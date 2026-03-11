import { ParserRuleContext } from "antlr4ng";
import { SqlBaseVisitor } from "./generated/official/SqlBaseVisitor.js";
import {
  QueryContext,
  WithContext,
  QueryNoWithContext,
  QueryTermContext,
  QueryTermDefaultContext,
  SetOperationContext,
  QueryPrimaryDefaultContext,
  SubqueryContext,
  QuerySpecificationContext,
  SelectSingleContext,
  SelectAllContext,
  RelationContext,
  RelationDefaultContext,
  JoinRelationContext,
  AliasedRelationContext,
  TableNameContext,
  SubqueryRelationContext,
  ParenthesizedRelationContext,
  LateralContext,
  UnnestContext,
  TableFunctionInvocationContext,
  TableFunctionCallContext,
  TableArgumentTableContext,
  TableArgumentQueryContext,
  ColumnReferenceContext,
  DereferenceContext,
  JoinCriteriaContext,
  PatternRecognitionContext,
  PatternVariableContext,
  RowPatternContext,
  JsonTableContext,
  OrdinalityColumnContext,
  ValueColumnContext,
  QueryColumnContext,
} from "./generated/official/SqlBaseParser.js";
import { parseSqlAntlr } from "./parser.js";
import {
  getIdentifierText,
  normalizeId,
  getQualifiedNameParts,
  flattenDereference,
  extractColumnName,
  NormalizedIdBrand,
} from "./utils.js";
import { HashSet } from "./hashset.js";

// ════════════════════════════════════════════════════════════════
// Public Types
// ════════════════════════════════════════════════════════════════

/** Metadata describing a table available in the query namespace. */
export interface TableMetadata {
  tableName: string;
  tableSchema?: string;
  columns: string[];
}

/** Resolved column lineage entry for a single source table. */
export interface TableColumnLineage {
  table: string;
  columns: string[];
}

/** Column reference that could not be resolved to a known table. */
export interface UnresolvedColumnReference {
  table?: string;
  column: string;
}

/** Full result returned by {@link getColumnLineage}. */
export interface ColumnLineageResult {
  /** Columns successfully attributed to a source table in the metadata. */
  tableColumns: TableColumnLineage[];
  /**
   * Column references that could not be fully resolved to a known table/column.
   * Each entry carries an optional `table` field:
   *  - `table` is set when a table reference was identified but is either absent
   *    from the provided metadata (unknown table), or the column name is not
   *    present in that table's known schema.
   *  - `table` is absent when the reference had no table context at all
   *    (bare unresolved column, ambiguous column, USING column with no owner,
   *    or a star expansion on an unknown prefix).
   */
  unresolvedTableColumns: UnresolvedColumnReference[];
}

// ════════════════════════════════════════════════════════════════
// Internal Types
// ════════════════════════════════════════════════════════════════

/**
 * Discriminates the origin of a table source visible within a query scope.
 *
 * - `'real'`    — a physical table or view present in the metadata.
 * - `'cte'`     — a WITH-clause definition (runtime-computed, no storage).
 * - `'derived'` — an inline subquery or LATERAL in the FROM clause
 *                 (runtime-computed, anonymous except for its alias).
 * - `'unknown'` — a table referenced in the query but absent from the metadata.
 *
 * Only `'real'` entries go into `tableColumns`; `'unknown'` entries, and any
 * reference to a column absent from a table's known schema, are reported in
 * `unresolvedTableColumns` with the `table` field set. `'cte'` and `'derived'`
 * entries participate in scope resolution, but their recognized columns are
 * transparent — they are dropped silently and do not appear in either output
 * collection.
 */
type ScopeTableKind = "real" | "cte" | "derived" | "unknown";

/** A table source visible within a query scope. */
interface ScopeTable {
  /** Display name preserving original casing (e.g. "public.users"). */
  qualifiedName: string;
  /** Original column names for star expansion. */
  columns: string[];
  /** Normalised column name → display column name (O(1) lookup). */
  columnsByNormalized: Map<NormalizedIdBrand, string>;
  /** Origin of this source — only `'real'` entries appear in lineage output. */
  kind: ScopeTableKind;
}

interface CteScopeTable extends ScopeTable {
  kind: "cte";
}

/** Scope tracking for a single SELECT query level. */
interface QueryScope {
  /** Maps normalised alias (or bare table name) → table info. */
  tables: Map<NormalizedIdBrand, ScopeTable>;
  /**
   * Short names that have been "poisoned" because two or more unaliased tables
   * share the same bare name (e.g. schema1.customers and schema2.customers).
   * Once poisoned a key must never be re-inserted, even if a third table with
   * the same short name arrives later.
   */
  ambiguousKeys: Set<NormalizedIdBrand>;
}

/** Scope tracking for WITH-clause CTE registrations. */
interface CteScope {
  /** Maps normalised CTE name → CTE descriptor. */
  tables: Map<NormalizedIdBrand, CteScopeTable>;
}

/** Accumulator for resolved column references per table. */
interface ResultEntry {
  displayName: string;
  columns: Set<string>;
}

// ════════════════════════════════════════════════════════════════
// Internal Helpers
// ════════════════════════════════════════════════════════════════

/**
 * Builds a case-insensitive lookup map from table metadata.
 * Keys: `"tablename"` and (if schema provided) `"schema.tablename"`.
 */
function buildMetadataLookup(metadata: TableMetadata[]): Map<NormalizedIdBrand, TableMetadata> {
  const map = new Map<NormalizedIdBrand, TableMetadata>();
  for (const m of metadata) {
    const name = normalizeId(m.tableName);
    map.set(name, m);
    if (m.tableSchema) {
      map.set(`${normalizeId(m.tableSchema)}.${name}` as NormalizedIdBrand, m);
    }
  }
  return map;
}

/** Creates a {@link ScopeTable} with a pre-built normalised column lookup map. */
function createScopeTable<K extends ScopeTableKind = "real">(
  qualifiedName: string,
  columns: string[],
  kind: K = "real" as K
): ScopeTable & { kind: K } {
  const columnsByNormalized = new Map<NormalizedIdBrand, string>();
  for (const col of columns) {
    const key = normalizeId(col);
    if (!columnsByNormalized.has(key)) {
      columnsByNormalized.set(key, col);
    }
  }
  return { qualifiedName, columns, columnsByNormalized, kind };
}

// ════════════════════════════════════════════════════════════════
// Column Lineage Visitor
// ════════════════════════════════════════════════════════════════

/**
 * ANTLR visitor that walks a parsed Trino SQL tree, resolves every column
 * reference back to its source table, and accumulates the results.
 *
 * Traversal strategy:
 *  1. {@link visitQuery} handles CTEs then delegates to the body.
 *  2. {@link visitQuery} pushes a CTE scope via {@link pushCteScope} (whose
 *     returned `Disposable` is held by a `using` declaration), then calls
 *     {@link registerCtes} to register each CTE with `kind: 'cte'` and visit
 *     its body. The scope stays live for the main query body and is automatically
 *     popped when the `using` binding leaves its block. Inner WITH clauses
 *     therefore cannot leak definitions to outer queries.
 *  3. {@link visitQueryNoWith} builds a scope from the FROM clause, visits ORDER BY
 *     while the scope is live, and pops the scope.
 *  4. {@link visitDereference} and {@link visitColumnReference} are the leaf
 *     resolvers — they look up columns in the query-scope stack.
 *  5. {@link visitSelectAll} expands `*` / `table.*` using each scope table's
 *     known columns list (populated from metadata for real tables, or inferred
 *     from subquery output columns for CTEs and derived sources).
 *  6. Subqueries get their own scopes; outer query scopes stay on the stack
 *     so correlated references resolve correctly.
 *  7. CTE entries resolve during column lookup but are transparent in
 *     {@link recordColumn} — recognized CTE columns are silently dropped because
 *     neither the `unknown || !column` branch nor the `kind === 'real'` branch
 *     fires for them; only real tables appear in the lineage output.
 *  8. Any column reference whose source table cannot be determined
 *     is recorded in {@link unresolvedColumns}.
 */
class ColumnLineageVisitor extends SqlBaseVisitor<void> {
  private readonly metadataLookup: Map<NormalizedIdBrand, TableMetadata>;
  private readonly queryScopeStack: QueryScope[] = [];
  private readonly cteScopeStack: CteScope[] = [];
  private readonly resultEntries = new Map<NormalizedIdBrand, ResultEntry>();
  private readonly unresolvedColumns = new HashSet<{ table?: string; column: NormalizedIdBrand }>(
    ({ table, column }) => `${table ?? ""}:${column}`
  );

  private get currentScope(): QueryScope | undefined {
    return this.queryScopeStack.at(-1);
  }

  /**
   * Pushes `scope` onto the query scope stack and returns a `Disposable` that
   * pops it. Pair with `using` so the scope is always popped when the
   * enclosing block exits — even on throw.
   *
   * @example
   * ```ts
   * using _scope = this.pushQueryScope(scope);
   * // … scope is live until end of this block
   * ```
   */
  private pushQueryScope(scope: QueryScope): Disposable {
    this.queryScopeStack.push(scope);
    return { [Symbol.dispose]: () => this.queryScopeStack.pop() };
  }

  /**
   * Pushes `scope` onto the CTE scope stack and returns a `Disposable` that
   * pops it. Pair with `using` so the scope is always popped when the
   * enclosing block exits — even on throw.
   *
   * @example
   * ```ts
   * using _cteScope = this.pushCteScope(cteScope);
   * // … CTE scope is live until end of this block
   * ```
   */
  private pushCteScope(scope: CteScope): Disposable {
    this.cteScopeStack.push(scope);
    return { [Symbol.dispose]: () => this.cteScopeStack.pop() };
  }

  constructor(metadata: TableMetadata[]) {
    super();
    this.metadataLookup = buildMetadataLookup(metadata);
  }

  protected defaultResult(): void {}

  /** Aggregates and returns the final lineage result. */
  getResult(): ColumnLineageResult {
    const tableColumns: TableColumnLineage[] = [];
    for (const [, entry] of this.resultEntries) {
      if (entry.columns.size > 0) {
        tableColumns.push({
          table: entry.displayName,
          columns: [...entry.columns].sort(),
        });
      }
    }
    tableColumns.sort((a, b) => a.table.localeCompare(b.table));

    return {
      tableColumns,
      unresolvedTableColumns: [...this.unresolvedColumns].sort((a, b) => {
        const tableCompare = (a.table ?? "").localeCompare(b.table ?? "");
        if (tableCompare !== 0) return tableCompare;
        return a.column.localeCompare(b.column);
      }),
    };
  }

  // ════════════════════════════════════════════════════════════
  // Visitor method overrides
  // ════════════════════════════════════════════════════════════

  /** Entry point for every QueryContext (main query, CTEs, subqueries). */
  visitQuery = (ctx: QueryContext): void => {
    const withCtx = ctx.with();
    if (withCtx) {
      const cteScope: CteScope = { tables: new Map() };
      // `using` guarantees the CTE scope is popped when this if-block exits,
      // even if an exception is thrown during CTE registration or query traversal.
      using _cteScope = this.pushCteScope(cteScope);
      this.registerCtes(withCtx, cteScope);
      this.visit(ctx.queryNoWith());
    } else {
      this.visit(ctx.queryNoWith());
    }
  };

  /** Resolves a bare column reference such as `col`. */
  visitColumnReference = (ctx: ColumnReferenceContext): void => {
    this.recordUnqualifiedColumn(getIdentifierText(ctx.identifier()));
  };

  /**
   * Resolves a qualified column reference such as `t.col` or
   * `schema.table.col`.
   *
   * Resolution order:
   *  1. Try the dotted prefix as a table reference.
   *  2. If that fails, try the base identifier as an unqualified column
   *     (handles struct field access like `column.field`).
   *  3. If both fail, record the full reference as unresolved.
   *
   * Does NOT call `visitChildren` — the entire chain is consumed here
   * to prevent double-counting.
   */
  visitDereference = (ctx: DereferenceContext): void => {
    const columnParts = flattenDereference(ctx);

    if (columnParts.length >= 2) {
      // 1. Try qualified table.column resolution
      if (this.tryResolveAndRecordQualifiedColumn(columnParts)) return;

      // 2. Fallback: treat the first segment as a bare column name with struct
      //    field access (e.g. `col.field`) — resolve just the base name.
      const baseName = columnParts[0];
      if (baseName && this.tryResolveAndRecordUnqualifiedColumn(baseName)) return;

      // 3. Truly unresolved — record the full dotted path
      this.unresolvedColumns.add({ column: normalizeId(columnParts.join(".")) });
      return;
    }

    // Single-part dereference (unusual) — treat as unqualified
    if (columnParts.length === 1 && columnParts[0]) {
      this.recordUnqualifiedColumn(columnParts[0]);
    }
  };

  /**
   * Handles `JOIN ... USING (col, ...)` by recording each USING column on
   * every in-scope table that owns it. ON clauses delegate to visitChildren.
   */
  visitJoinCriteria = (ctx: JoinCriteriaContext): void => {
    if (ctx.USING()) {
      const scope = this.currentScope;
      for (const identifier of ctx.identifier()) {
        const colName = getIdentifierText(identifier);
        const normalizedColumn = normalizeId(colName);
        let tableFound = false;
        if (scope) {
          const seenTables = new Set<NormalizedIdBrand>();
          for (const table of scope.tables.values()) {
            const tableKey = normalizeId(table.qualifiedName);
            if (seenTables.has(tableKey)) continue;
            seenTables.add(tableKey);
            // The Column was Found in a table (of any kind) or the table is unknown (no metadata) - tableFound
            if (table.columnsByNormalized.has(normalizedColumn) || table.kind === "unknown") {
              this.recordColumn(table, colName);
              tableFound = true;
            }
          }
        }
        if (!tableFound) {
          this.unresolvedColumns.add({ column: normalizedColumn });
        }
      }
    } else {
      this.visitChildren(ctx);
    }
  };

  /** Expands `*` or `table.*` into individual column hits. */
  visitSelectAll = (ctx: SelectAllContext): void => {
    const scope = this.currentScope;
    if (!scope) return;

    const prefix = ctx.primaryExpression();

    if (prefix) {
      // table.* — resolve prefix and expand its columns
      let tableRef: string;
      if (prefix instanceof DereferenceContext) {
        tableRef = flattenDereference(prefix).join(".");
      } else if (prefix instanceof ColumnReferenceContext) {
        tableRef = getIdentifierText(prefix.identifier());
      } else {
        tableRef = prefix.getText();
      }

      const table = this.resolveTableFromScope(tableRef);
      if (table) {
        if (table.columns.length) {
          for (const col of table.columns) {
            if (col !== "*") this.recordColumn(table, col);
          }
        } else {
          this.recordColumn(table, "*");
        }
      } else {
        this.unresolvedColumns.add({ column: normalizeId(`${tableRef}.*`) });
      }
    } else {
      // Bare * — expand every table in the current scope
      const seen = new Set<NormalizedIdBrand>();
      for (const [, table] of scope.tables) {
        const tableKey = normalizeId(table.qualifiedName);
        if (seen.has(tableKey)) continue;
        seen.add(tableKey);
        if (table.columns.length) {
          for (const col of table.columns) {
            if (col !== "*") this.recordColumn(table, col);
          }
        } else {
          this.recordColumn(table, "*");
        }
      }
    }
  };

  // ════════════════════════════════════════════════════════════
  // Query body orchestration
  // ════════════════════════════════════════════════════════════

  /**
   * Registers all CTEs in a WITH clause into `cteScope` and visits each body.
   * The caller is responsible for pushing/popping `cteScope` via `using`.
   * Each CTE is registered before its body is visited so that chained CTEs
   * can reference earlier ones through normal scope resolution.
   */
  private registerCtes(withCtx: WithContext, cteScope: CteScope): void {
    for (const namedQuery of withCtx.namedQuery()) {
      const cteName = getIdentifierText(namedQuery.identifier());
      const colAliases = namedQuery.columnAliases();

      const cols = colAliases
        ? colAliases.identifier().map(getIdentifierText)
        : this.inferQueryOutputColumns(namedQuery.query());

      // Register before visiting the body so subsequent CTEs in the same
      // WITH clause can already reference this one.
      cteScope.tables.set(normalizeId(cteName), createScopeTable(cteName, cols, "cte"));

      this.visit(namedQuery); // identifier/columnAliases are just names — no column refs
    }
  }

  visitQueryNoWith = (ctx: QueryNoWithContext): void => {
    this.visit(ctx.queryTerm());
  };

  visitQueryTermDefault = (ctx: QueryTermDefaultContext): void => {
    const primary = ctx.queryPrimary();
    if (primary instanceof QueryPrimaryDefaultContext) {
      const spec = primary.querySpecification();
      using _scope = this.pushQueryScope(this.buildScopeFromRelations(spec.relation()));
      this.visit(spec);
      // ORDER BY is a sibling of queryTerm inside queryNoWith, not a child of queryPrimary.
      // Visit it only when this term is the direct body of a queryNoWith (not a set-op side).
      if (ctx.parent instanceof QueryNoWithContext) {
        const ob = ctx.parent.orderBy();
        if (ob) this.visit(ob);
      }
    } else if (primary instanceof SubqueryContext) {
      this.visit(primary.queryNoWith());
    }
  };

  visitJoinRelation = (ctx: JoinRelationContext): void => {
    const criteria = ctx.joinCriteria();
    if (criteria) this.visit(criteria);
    for (const child of ctx.relation()) {
      this.visit(child);
    }
    const sampledRelation = ctx.sampledRelation();
    if (sampledRelation) this.visit(sampledRelation);
  };

  visitPatternRecognition = (ctx: PatternRecognitionContext): void => {
    if (ctx.MATCH_RECOGNIZE()) {
      this.customVisitMatchRecognizeInternals(ctx);
    } else {
      const p = ctx.aliasedRelation().relationPrimary();
      if (p instanceof TableFunctionInvocationContext) {
        this.customVisitTableFunctionCallArguments(p.tableFunctionCall());
      } else if (!(p instanceof TableNameContext)) {
        this.visit(p);
      }
    }
  };

  // ════════════════════════════════════════════════════════════
  // Result recording & Column resolution
  // ════════════════════════════════════════════════════════════

  /**
   * Looks up a table by alias or name, searching from the innermost
   * scope outward (supporting correlated subqueries).
   */
  private resolveTableFromScope(nameOrAlias: string): ScopeTable | undefined {
    const tableId = normalizeId(nameOrAlias);
    for (const scope of this.queryScopeStack.toReversed()) {
      const table = scope.tables.get(tableId);
      if (table) return table;
    }
    return undefined;
  }

  /**
   * Searches the CTE scope stack for a CTE registration with the given normalised
   * name. Returns the {@link CteScopeTable}.
   */
  private resolveCteFromCteScope(normalizedName: NormalizedIdBrand): CteScopeTable | undefined {
    for (const scope of this.cteScopeStack.toReversed()) {
      const table = scope.tables.get(normalizedName);
      if (table) return table;
    }
    return undefined;
  }

  /**
   * Records a resolved column to the appropriate output:
   * - `'unknown'` table or missing column → {@link unresolvedColumns}
   * - `'real'` table → {@link resultEntries}
   * - `'cte'` / `'derived'` → silently dropped
   */
  private recordColumn(table: ScopeTable, column: string): void {
    if (table.kind !== "real" && table.kind !== "unknown") {
      return;
    }
    const normalizedColumn = normalizeId(column);
    const originalColumnName = table.columnsByNormalized.get(normalizedColumn);
    if (table.kind === "unknown" || !originalColumnName) {
      this.unresolvedColumns.add({ table: table.qualifiedName, column: normalizedColumn });
    } else if (table.kind === "real") {
      const tableId = normalizeId(table.qualifiedName);
      let entry = this.resultEntries.get(tableId);
      if (!entry) {
        entry = { displayName: table.qualifiedName, columns: new Set() };
        this.resultEntries.set(tableId, entry);
      }
      entry.columns.add(originalColumnName);
    }
  }

  /**
   * Resolves an unqualified column. If no table owns it, the reference
   * is recorded as unresolved.
   */
  private recordUnqualifiedColumn(columnName: string): void {
    if (!this.tryResolveAndRecordUnqualifiedColumn(columnName)) {
      this.unresolvedColumns.add({ column: normalizeId(columnName) });
    }
  }

  /**
   * Attempts to resolve a qualified column reference like `t.col` or
   * `schema.table.col`. Tries the full table prefix first, then
   * progressively shorter right-hand suffixes. Returns `true` if the column was successfully recorded.
   */
  private tryResolveAndRecordQualifiedColumn(parts: string[]): boolean {
    if (parts.length < 2) return false;

    const columnName = parts.at(-1);
    if (!columnName) return false;
    const tableParts = parts.slice(0, -1);

    // Try the full prefix as a single alias / table reference
    const fullRef = tableParts.join(".");
    const fullTable = this.resolveTableFromScope(fullRef);
    if (fullTable) {
      this.recordColumn(fullTable, columnName);
      return true;
    }

    // Progressively shorter right-hand suffixes (catalog.schema.table.col, schema.table.col, table.col)
    for (let startIndex = 1; startIndex < tableParts.length; startIndex++) {
      const suffix = tableParts.slice(startIndex).join(".");
      const table = this.resolveTableFromScope(suffix);
      if (table) {
        this.recordColumn(table, columnName);
        return true;
      }
    }

    // Struct field access with a table alias or schema-qualified prefix:
    // e.g. schema.tbl.profile.age
    // Try each left-side prefix as a table path; the next segment is the column
    // name, and any remaining segments are struct sub-fields (ignored for lineage).
    // Prefer the first split where the column is confirmed in the table's schema;
    // if none match, fall back to the first resolved table so the column is still
    // attributed (routed to unresolvedColumns by recordColumn).
    if (parts.length >= 3) {
      let firstTableMatch: { table: ScopeTable; colName: string } | undefined;
      for (let tableLen = 1; tableLen <= parts.length - 2; tableLen++) {
        const tableRef = parts.slice(0, tableLen).join(".");
        const table = this.resolveTableFromScope(tableRef);
        if (table) {
          const structColName = parts[tableLen];
          if (!structColName) continue;
          const normalizedStructCol = normalizeId(structColName);
          const originalColName = table.columnsByNormalized.get(normalizedStructCol);
          if (originalColName !== undefined) {
            // Preferred path: column confirmed in metadata — commit immediately.
            this.recordColumn(table, originalColName);
            return true;
          }
          if (!firstTableMatch) {
            firstTableMatch = { table, colName: structColName };
          }
        }
      }

      if (firstTableMatch) {
        this.recordColumn(firstTableMatch.table, firstTableMatch.colName);
        return true;
      }
    }

    return false;
  }

  /**
   * Attempts to resolve a bare column name against all in-scope tables.
   * Returns `true` if the column was recorded.
   *
   * Ambiguity rule (mirrors Trino semantics): when more than one *distinct*
   * source table in the same scope level owns the column, Trino raises a
   * SemanticException. We mirror this by adding the column to
   * `unresolvedColumns` instead of silently picking the first match.
   */
  private tryResolveAndRecordUnqualifiedColumn(columnName: string): boolean {
    const normalized = normalizeId(columnName);
    for (const scope of this.queryScopeStack.toReversed()) {
      // Collect all *distinct* ScopeTable objects in this scope that own the column.
      const matches: Array<{ table: ScopeTable; originalColumnName: string }> = [];
      const seenTables = new Set<NormalizedIdBrand>();
      for (const table of scope.tables.values()) {
        const tableKey = normalizeId(table.qualifiedName);
        if (seenTables.has(tableKey) || table.kind === "derived") continue;
        seenTables.add(tableKey);
        const originalColumnName = table.columnsByNormalized.get(normalized);
        if (originalColumnName) {
          matches.push({ table, originalColumnName });
        }
      }

      if (matches.length === 0) continue;

      if (matches.length === 1) {
        const { table, originalColumnName } = matches[0]!;
        this.recordColumn(table, originalColumnName);
        return true;
      }

      // Ambiguous — multiple distinct tables own this column in the same scope.
      // Trino would reject this query; report as unresolved.
      this.unresolvedColumns.add({ column: normalized });
      return true;
    }
    return false;
  }

  // ════════════════════════════════════════════════════════════
  // FROM clause → scope building
  // ════════════════════════════════════════════════════════════

  /** Builds a {@link QueryScope} from a list of FROM-clause relations. */
  private buildScopeFromRelations(relations: RelationContext[]): QueryScope {
    const scope: QueryScope = { tables: new Map(), ambiguousKeys: new Set() };
    for (const rel of relations) {
      this.forEachPatternRecognition(rel, (patRec) => {
        this.registerPatternRecognition(patRec, scope);
      });
    }
    return scope;
  }

  /**
   * Unwraps a parenthesised relation at the {@link PatternRecognitionContext}
   * level, then invokes the callback.
   */
  private dispatchPatternRecognition(
    ctx: PatternRecognitionContext,
    callback: (patRec: PatternRecognitionContext) => void
  ): void {
    const primary = ctx.aliasedRelation().relationPrimary();
    if (primary instanceof ParenthesizedRelationContext) {
      this.forEachPatternRecognition(primary.relation(), callback);
    } else {
      callback(ctx);
    }
  }

  /**
   * Walks a FROM-clause relation tree and invokes `callback` for every
   * {@link PatternRecognitionContext} leaf found. Parenthesised relations are
   * transparently unwrapped.
   */
  private forEachPatternRecognition(rel: RelationContext, callback: (patRec: PatternRecognitionContext) => void): void {
    if (rel instanceof JoinRelationContext) {
      for (const child of rel.relation()) {
        this.forEachPatternRecognition(child, callback);
      }
      const sampledRelation = rel.sampledRelation();
      if (sampledRelation) {
        this.dispatchPatternRecognition(sampledRelation.patternRecognition(), callback);
      }
    } else if (rel instanceof RelationDefaultContext) {
      this.dispatchPatternRecognition(rel.sampledRelation().patternRecognition(), callback);
    }
  }

  /**
   * Visits all expression clauses inside a MATCH_RECOGNIZE block against a
   * temporary inner scope built from the source relation.
   *
   * Clauses visited: PARTITION BY, ORDER BY, every MEASURES expression, every
   * DEFINE predicate.  If the source is itself a derived relation (subquery,
   * LATERAL, UNNEST, TABLE()) its body is visited here as well.
   */
  private customVisitMatchRecognizeInternals(ctx: PatternRecognitionContext): void {
    const innerScope: QueryScope = { tables: new Map(), ambiguousKeys: new Set() };
    this.registerAliasedRelation(ctx.aliasedRelation(), innerScope);

    // Register each DEFINE variable as an alias for the source table so that
    // pattern variable references like A.price resolve to the source columns.
    // Pattern variables (A, B, …) are row-level references into the source
    // relation and are not independent table aliases.

    // @important: since we've registered only one aliased relation as the source,
    // we rely on the assumption that all variables reference the same source.
    const sourceTables = [...innerScope.tables.values()];
    if (sourceTables.length > 0) {
      const firstSource = sourceTables[0]!;
      for (const varDef of ctx.variableDefinition()) {
        const varName = normalizeId(getIdentifierText(varDef.identifier()));
        if (!innerScope.tables.has(varName)) {
          innerScope.tables.set(varName, firstSource);
        }
      }

      // Register SUBSET variable names so that expressions like U.totalprice
      // (where U = (C, D) in SUBSET) resolve to the source relation.
      for (const subsetDef of ctx.subsetDefinition()) {
        const subsetName = normalizeId(getIdentifierText(subsetDef._name!));
        if (!innerScope.tables.has(subsetName)) {
          innerScope.tables.set(subsetName, firstSource);
        }
      }

      // Also register any pattern variable from the PATTERN clause that has no
      // DEFINE entry. In Trino, unlisted variables default to always-match and
      // are still valid references to the source relation.
      const rowPattern = ctx.rowPattern();
      if (rowPattern) this.registerPatternVar(rowPattern, firstSource, innerScope);
    }

    {
      // Explicit block so the scope is disposed before visiting the source body below.
      using _scope = this.pushQueryScope(innerScope);
      for (const partExpr of ctx._partition) {
        this.visit(partExpr);
      }
      const ob = ctx.orderBy();
      if (ob) this.visit(ob);
      for (const measure of ctx.measureDefinition()) {
        this.visit(measure);
      }
      for (const varDef of ctx.variableDefinition()) {
        this.visit(varDef);
      }
    }

    // Visit the inner source body if it is itself a derived relation.
    const p = ctx.aliasedRelation().relationPrimary();
    if (p instanceof TableFunctionInvocationContext) {
      this.customVisitTableFunctionCallArguments(p.tableFunctionCall());
    } else if (!(p instanceof TableNameContext)) {
      this.visit(p);
    }
  }

  /**
   * Recursively walks a `rowPattern` parse tree and registers every
   * {@link PatternVariableContext} leaf as an alias for `tableToRegister` in
   * `scope`, provided the name is not already present.
   *
   * Used by {@link customVisitMatchRecognizeInternals} to ensure that pattern
   * variables declared only in the `PATTERN` clause (i.e. with no `DEFINE`
   * entry) are still resolvable as column-reference prefixes.
   */
  private registerPatternVar(node: RowPatternContext, tableToRegister: ScopeTable, scope: QueryScope): void {
    if (node instanceof PatternVariableContext) {
      const varName = normalizeId(getIdentifierText(node.identifier()));
      if (!scope.tables.has(varName)) {
        scope.tables.set(varName, tableToRegister);
      }
      return;
    }
    for (const child of node.children ?? []) {
      if (child instanceof ParserRuleContext) this.registerPatternVar(child, tableToRegister, scope);
    }
  }

  /**
   * Resolves a table name to its source descriptor, applying the priority:
   * CTE in scope → metadata → unknown table (empty columns, rawName as-is).
   *
   * All derived properties (`qualifiedName`, `columns`, `kind`) come from the
   * same source, so they can never get out of sync with each other.
   */
  private resolveTableSource(
    normalizedName: NormalizedIdBrand,
    rawName: string
  ): { qualifiedName: string; columns: string[]; kind: ScopeTableKind } {
    const cteTable = this.resolveCteFromCteScope(normalizedName);
    if (cteTable) {
      return { qualifiedName: cteTable.qualifiedName, columns: cteTable.columns, kind: "cte" };
    }
    const meta = this.metadataLookup.get(normalizedName);
    if (meta) {
      const qualifiedName = meta.tableSchema ? `${meta.tableSchema}.${meta.tableName}` : meta.tableName;
      return { qualifiedName, columns: meta.columns, kind: "real" };
    }
    return { qualifiedName: rawName, columns: [], kind: "unknown" };
  }

  /**
   * Registers a {@link PatternRecognitionContext} into the given scope.
   *
   * - When no MATCH_RECOGNIZE clause is present the inner
   *   {@link AliasedRelationContext} is registered as usual (transparent pass-through).
   * - When MATCH_RECOGNIZE is present the output is a `'derived'` scope table
   *   keyed on the outer alias, with its columns taken from the MEASURES
   *   definitions (or from explicit column aliases if provided).
   */
  private registerPatternRecognition(ctx: PatternRecognitionContext, scope: QueryScope): void {
    if (!ctx.MATCH_RECOGNIZE()) {
      this.registerAliasedRelation(ctx.aliasedRelation(), scope);
      return;
    }

    const aliasCtx = ctx.identifier();
    const alias = aliasCtx ? getIdentifierText(aliasCtx) : null;
    const columnAliasCtx = ctx.columnAliases();

    const measureCols = columnAliasCtx
      ? columnAliasCtx.identifier().map(getIdentifierText)
      : ctx.measureDefinition().map((m) => getIdentifierText(m.identifier()));

    if (alias) {
      scope.tables.set(normalizeId(alias), createScopeTable(alias, measureCols, "derived"));
    }
  }

  /**
   * Registers a single aliased relation (table, subquery, lateral)
   * into the given scope.
   */
  private registerAliasedRelation(ctx: AliasedRelationContext, scope: QueryScope): void {
    const primary = ctx.relationPrimary();
    const aliasCtx = ctx.identifier();
    const alias = aliasCtx ? getIdentifierText(aliasCtx) : null;
    const columnAliasCtx = ctx.columnAliases();

    if (primary instanceof TableNameContext) {
      const nameParts = getQualifiedNameParts(primary.qualifiedName());
      const rawName = nameParts.join(".");
      const normalizedName = normalizeId(rawName);

      const source = this.resolveTableSource(normalizedName, rawName);
      const columns = columnAliasCtx ? columnAliasCtx.identifier().map(getIdentifierText) : source.columns;

      const scopeTable = createScopeTable(source.qualifiedName, columns, source.kind);

      // Register under alias (or bare table name when no alias).
      const bareName = nameParts.at(-1);
      const normalizedAlias = alias ? normalizeId(alias) : null;
      const normalizedBareName = bareName ? normalizeId(bareName) : null;

      if (normalizedAlias) {
        // Explicit alias — always register; the user controls uniqueness.
        scope.tables.set(normalizedAlias, scopeTable);
      } else if (normalizedBareName) {
        // Unaliased short name — guard against collisions from same-name tables in
        // different schemas (e.g. schema1.customers vs schema2.customers).
        // Once poisoned, the key must stay absent even if a third table arrives later.
        if (!scope.ambiguousKeys.has(normalizedBareName)) {
          const existingByBareName = scope.tables.get(normalizedBareName);
          // Inequality guard: same table registered twice (e.g. a self-join) is not a collision.
          if (existingByBareName && normalizeId(existingByBareName.qualifiedName) !== normalizedName) {
            scope.tables.delete(normalizedBareName);
            scope.ambiguousKeys.add(normalizedBareName);
          } else {
            scope.tables.set(normalizedBareName, scopeTable);
          }
        }
      }

      // Also register under the full qualified name so schema1.customers.col
      // always resolves even when the short name is poisoned.
      if (!scope.tables.has(normalizedName)) {
        scope.tables.set(normalizedName, scopeTable);
      }
    } else if (primary instanceof SubqueryRelationContext || primary instanceof LateralContext) {
      this.registerSubquerySource(primary.query(), alias, columnAliasCtx, scope);
    } else if (primary instanceof UnnestContext || primary instanceof TableFunctionInvocationContext) {
      if (alias) {
        const columns = columnAliasCtx ? columnAliasCtx.identifier().map(getIdentifierText) : [];
        scope.tables.set(normalizeId(alias), createScopeTable(alias, columns, "derived"));
      }
    } else if (primary instanceof JsonTableContext) {
      // if there is no alias, the source table is not addressable at all
      if (alias) {
        let columns: string[] = [];
        if (columnAliasCtx) {
          columns = columnAliasCtx.identifier().map(getIdentifierText);
        } else {
          columns = primary
            .jsonTableColumn()
            .filter(
              (c): c is OrdinalityColumnContext | ValueColumnContext | QueryColumnContext =>
                c instanceof OrdinalityColumnContext ||
                c instanceof ValueColumnContext ||
                c instanceof QueryColumnContext
            )
            .map((c) => getIdentifierText(c.identifier()));
        }
        scope.tables.set(normalizeId(alias), createScopeTable(alias, columns, "derived"));
      }
    }
  }

  /**
   * Visits the arguments of a `TABLE(tableFunctionCall)` invocation:
   *  - `TABLE(tbl_name)` argument → resolve the table, push a temporary scope
   *    containing only that table, visit its PARTITION BY / ORDER BY
   *    expressions (so column refs are attributed to the table), then pop.
   *  - `TABLE(query)` argument     → visit the inner query.
   *  - Scalar `expression` argument → visit directly.
   */
  private customVisitTableFunctionCallArguments(ctx: TableFunctionCallContext): void {
    for (const arg of ctx.tableFunctionArgument()) {
      const tableArg = arg.tableArgument();
      if (tableArg) {
        const rel = tableArg.tableArgumentRelation();
        if (rel instanceof TableArgumentTableContext) {
          const rawName = getQualifiedNameParts(rel.qualifiedName()).join(".");
          const normalizedName = normalizeId(rawName);
          const source = this.resolveTableSource(normalizedName, rawName);
          const scopeTable = createScopeTable(source.qualifiedName, source.columns, source.kind);

          // Build a temporary scope so PARTITION BY / ORDER BY columns
          // resolve against this argument table.
          const tempScope: QueryScope = { tables: new Map(), ambiguousKeys: new Set() };
          tempScope.tables.set(normalizedName, scopeTable);
          const argAliasCtx = rel.identifier();
          if (argAliasCtx) {
            tempScope.tables.set(normalizeId(getIdentifierText(argAliasCtx)), scopeTable);
          }
          using _scope = this.pushQueryScope(tempScope);
          this.visit(tableArg); // visits PARTITION BY expressions and ORDER BY sort items; qualifiedName/identifier produce no col refs
        } else if (rel instanceof TableArgumentQueryContext) {
          this.visit(rel); // visitChildren reaches rel.query() → visitQuery
        }
      } else {
        const expr = arg.expression();
        if (expr) this.visit(expr);
      }
    }
  }

  /** Registers a subquery (or LATERAL) source in the scope. */
  private registerSubquerySource(
    queryCtx: QueryContext,
    alias: string | null,
    columnAliasCtx: ReturnType<AliasedRelationContext["columnAliases"]>,
    scope: QueryScope
  ): void {
    if (!alias) return; // subqueries in FROM must be aliased

    const columns = columnAliasCtx
      ? columnAliasCtx.identifier().map(getIdentifierText)
      : this.inferQueryOutputColumns(queryCtx);

    scope.tables.set(normalizeId(alias), createScopeTable(alias, columns, "derived"));
  }

  // ════════════════════════════════════════════════════════════
  // Subquery output-column inference
  // ════════════════════════════════════════════════════════════

  private inferQueryOutputColumns(ctx: QueryContext): string[] {
    return this.inferTermOutputColumns(ctx.queryNoWith().queryTerm());
  }

  private inferSpecOutputColumns(spec: QuerySpecificationContext): string[] {
    const cols: string[] = [];
    for (const item of spec.selectItem()) {
      if (item instanceof SelectSingleContext) {
        const aliasCtx = item.identifier();
        if (aliasCtx) {
          cols.push(getIdentifierText(aliasCtx));
        } else {
          const name = extractColumnName(item.expression());
          cols.push(name ?? item.expression().getText());
        }
      } else if (item instanceof SelectAllContext) {
        cols.push("*");
      }
    }
    return cols;
  }

  private inferTermOutputColumns(term: QueryTermContext): string[] {
    if (term instanceof QueryTermDefaultContext) {
      const primary = term.queryPrimary();
      if (primary instanceof QueryPrimaryDefaultContext) {
        return this.inferSpecOutputColumns(primary.querySpecification());
      } else if (primary instanceof SubqueryContext) {
        return this.inferTermOutputColumns(primary.queryNoWith().queryTerm());
      }
    }
    // UNION / EXCEPT / INTERSECT — optimistically take output from the left side
    if (term instanceof SetOperationContext && term._left) {
      return this.inferTermOutputColumns(term._left);
    }
    return [];
  }
}

// ════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════

/**
 * Analyses a Trino SQL statement and returns, for every source table, which
 * of its columns are referenced anywhere in the query (SELECT, WHERE, JOIN
 * ON, GROUP BY, HAVING, ORDER BY, etc.).
 *
 * Columns whose source table cannot be determined are returned separately
 * in {@link ColumnLineageResult.unresolvedTableColumns}.
 *
 * @param sql      - The SQL statement to analyse.
 * @param metadata - Known tables and their columns. Used to resolve bare
 *                   column references and to expand `SELECT *`.
 * @returns A {@link ColumnLineageResult} with resolved and unresolved entries.
 */
export function getColumnLineage(sql: string, metadata: TableMetadata[]): ColumnLineageResult {
  const tree = parseSqlAntlr(sql);
  const visitor = new ColumnLineageVisitor(metadata);
  visitor.visit(tree);
  return visitor.getResult();
}
