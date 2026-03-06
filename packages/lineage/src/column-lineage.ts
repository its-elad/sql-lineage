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
} from "./generated/official/SqlBaseParser.js";
import { parseSqlAntlr } from "./parser.js";
import {
  getIdentifierText,
  normalizeId,
  getQualifiedNameParts,
  flattenDereference,
  extractColumnName,
  NormalizedIdBrand,
} from "./column-lineage.utils.js";
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
   * Column references that could not be attributed to a known (metadata) table.
   * Each entry carries an optional `table` field:
   *  - `table` is set when the column was resolved to a table reference that is
   *    not present in the provided metadata (unknown table).
   *  - `table` is absent when the reference could not be attributed to any table
   *    at all (truly unresolved).
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
 * Only `'real'` entries go into `tableColumns`; `'unknown'` entries are reported
 * in `unresolvedTableColumns` with the `table` field set. `'cte'` and `'derived'`
 * entries participate in resolution only and are excluded from the output.
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

/** Scope tracking for a single SELECT query level. */
interface QueryScope {
  /** Maps normalised alias (or bare table name) → table info. */
  tables: Map<NormalizedIdBrand, ScopeTable>;
}

/** Scope tracking for WITH-clause CTE registrations. */
interface CteScope {
  /** Maps normalised CTE name → CTE descriptor. */
  tables: Map<NormalizedIdBrand, ScopeTable & { kind: "cte" }>;
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
 *  2. {@link processCtes} pushes a shared CTE scope onto the CTE stack, registers
 *     each CTE as a {@link ScopeTable} with `kind: 'cte'`, visits its body,
 *     and leaves the scope live for the main query body. {@link visitQuery}
 *     pops it afterwards. This means CTE visibility is scoped correctly —
 *     inner WITH clauses cannot leak definitions to outer queries.
 *  3. {@link processTerm} / {@link processQueryNoWith} push a scope built
 *     from the FROM clause, visit all column-bearing clauses, then pop.
 *  4. {@link visitDereference} and {@link visitColumnReference} are the leaf
 *     resolvers — they look up columns in the query-scope stack.
 *  5. {@link visitSelectAll} expands `*` / `table.*` from metadata.
 *  6. Subqueries get their own scopes; outer query scopes stay on the stack
 *     so correlated references resolve correctly.
 *  7. CTE entries resolve during column lookup but are filtered out in
 *     {@link recordColumn} via `kind === 'cte'`, so only real tables appear in output.
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

  constructor(metadata: TableMetadata[]) {
    super();
    this.metadataLookup = buildMetadataLookup(metadata);
  }

  protected defaultResult(): void {
    return;
  }

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
      if (this.tryResolveQualifiedColumn(columnParts)) return;

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
        let found = false;
        if (scope) {
          const seenTables = new Set<ScopeTable>();
          for (const table of scope.tables.values()) {
            if (seenTables.has(table)) continue;
            seenTables.add(table);
            if (!this.recordColumn(table, colName).skipped) {
              found = true;
            }
          }
        }
        if (!found) {
          this.unresolvedColumns.add({ column: normalizedColumn });
        }
      }
    } else {
      this.visitChildren(ctx);
    }
  };

  /** Entry point for every QueryContext (main query, CTEs, subqueries). */
  visitQuery = (ctx: QueryContext): void => {
    const withCtx = ctx.with();
    if (withCtx) {
      this.processCtes(withCtx); // pushes the CTE scope
      this.processQueryNoWith(ctx.queryNoWith());
      this.popCteScope(); // pop the CTE scope
    } else {
      this.processQueryNoWith(ctx.queryNoWith());
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
      const seen = new Set<string>();
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

  private processCtes(withCtx: WithContext): void {
    // Push a dedicated scope for all CTEs in this WITH clause.
    // Registering each CTE before visiting its body means chained CTEs can
    // reference earlier ones via normal scope resolution.
    const cteScope: CteScope = { tables: new Map() };
    this.pushCteScope(cteScope);

    for (const namedQuery of withCtx.namedQuery()) {
      const cteName = getIdentifierText(namedQuery.identifier());
      const colAliases = namedQuery.columnAliases();

      const cols = colAliases
        ? colAliases.identifier().map(getIdentifierText)
        : this.inferQueryOutputColumns(namedQuery.query());

      // Register with kind='cte' before visiting the body so subsequent
      // CTEs in the same WITH clause can already reference this one.
      cteScope.tables.set(normalizeId(cteName), createScopeTable(cteName, cols, "cte"));

      this.visit(namedQuery.query());
    }
    // cteScope stays on the stack — visitQuery pops it after the query body.
  }

  private processQueryNoWith(ctx: QueryNoWithContext): void {
    const term = ctx.queryTerm();
    const scopeWasPushed = this.processTerm(term);

    const orderBy = ctx.orderBy();
    if (orderBy) {
      this.visit(orderBy);
    }

    if (scopeWasPushed) {
      this.popQueryScope();
    }
  }

  /**
   * Processes a QueryTermContext. Returns `true` if a scope was pushed
   * (caller is responsible for popping after ORDER BY).
   */
  private processTerm(term: QueryTermContext): boolean {
    if (term instanceof QueryTermDefaultContext) {
      const primary = term.queryPrimary();

      if (primary instanceof QueryPrimaryDefaultContext) {
        const spec = primary.querySpecification();
        const scope = this.buildScopeFromRelations(spec.relation());
        this.pushQueryScope(scope);

        this.customVisitSpecInternals(spec);

        // Visit FROM-clause subquery / UNNEST / TABLE() bodies (scope is now active)
        for (const rel of spec.relation()) {
          this.forEachAliasedRelation(rel, (aliased) => {
            const p = aliased.relationPrimary();
            if (p instanceof SubqueryRelationContext) {
              this.visit(p.query());
            } else if (p instanceof LateralContext) {
              this.visit(p.query());
            } else if (p instanceof UnnestContext) {
              for (const expr of p.expression()) {
                this.visit(expr);
              }
            } else if (p instanceof TableFunctionInvocationContext) {
              this.customVisitTableFunctionCallArguments(p.tableFunctionCall());
            }
          });
        }

        return true; // scope stays for ORDER BY
      }

      if (primary instanceof SubqueryContext) {
        this.processQueryNoWith(primary.queryNoWith());
        return false;
      }
    }

    if (term instanceof SetOperationContext) {
      if (term._left) {
        const pushed = this.processTerm(term._left);
        if (pushed) this.popQueryScope();
      }
      if (term._right) {
        const pushed = this.processTerm(term._right);
        if (pushed) this.popQueryScope();
      }
      return false;
    }

    return false;
  }

  private visitJoinConditions(rel: RelationContext): void {
    if (!(rel instanceof JoinRelationContext)) return;

    const criteria = rel.joinCriteria();
    if (criteria) {
      this.visit(criteria);
    }
    for (const child of rel.relation()) {
      this.visitJoinConditions(child);
    }
  }

  /** Visits all column-bearing clauses of a query specification. */
  private customVisitSpecInternals(spec: QuerySpecificationContext): void {
    for (const item of spec.selectItem()) {
      this.visit(item);
    }
    if (spec._where) {
      this.visit(spec._where);
    }
    if (spec._having) {
      this.visit(spec._having);
    }
    const groupBy = spec.groupBy();
    if (groupBy) {
      this.visit(groupBy);
    }
    for (const window of spec.windowDefinition()) {
      this.visit(window);
    }
    for (const relation of spec.relation()) {
      this.visitJoinConditions(relation);
    }
  }

  // ════════════════════════════════════════════════════════════
  // Scope helpers & result recording
  // ════════════════════════════════════════════════════════════

  private get currentScope(): QueryScope | undefined {
    return this.queryScopeStack[this.queryScopeStack.length - 1];
  }

  private pushQueryScope(scope: QueryScope): void {
    this.queryScopeStack.push(scope);
  }

  private popQueryScope(): void {
    this.queryScopeStack.pop();
  }

  private pushCteScope(scope: CteScope): void {
    this.cteScopeStack.push(scope);
  }

  private popCteScope(): void {
    this.cteScopeStack.pop();
  }

  /**
   * Records a resolved column hit, deduplicating by normalised table key.
   * - `'real'`    → added to `tableColumns` in the result.
   * - `'unknown'` / column not in meta → added to `unresolvedTableColumns` with the table name set.
   * - `'cte'` / `'derived'` → silently dropped (participate in resolution only).
   */
  private recordColumn(table: ScopeTable, column: string): { skipped: boolean } {
    const normalizedColumn = normalizeId(column);
    const originalColumnName = table.columnsByNormalized.get(normalizedColumn);
    if (table.kind === "unknown" || !originalColumnName) {
      const unresolvedColumn = { table: table.qualifiedName, column: normalizedColumn };
      if (!this.unresolvedColumns.has(unresolvedColumn)) {
        this.unresolvedColumns.add(unresolvedColumn);
        return { skipped: false };
      }
    } else if (table.kind === "real") {
      const tableId = normalizeId(table.qualifiedName);
      let entry = this.resultEntries.get(tableId);
      if (!entry) {
        entry = { displayName: table.qualifiedName, columns: new Set() };
        this.resultEntries.set(tableId, entry);
      }
      entry.columns.add(originalColumnName);
      return { skipped: false };
    }
    return { skipped: true };
  }

  // ════════════════════════════════════════════════════════════
  // Column resolution
  // ════════════════════════════════════════════════════════════

  /**
   * Looks up a table by alias or name, searching from the innermost
   * scope outward (supporting correlated subqueries).
   */
  private resolveTableFromScope(nameOrAlias: string): ScopeTable | undefined {
    const tableId = normalizeId(nameOrAlias);
    for (let i = this.queryScopeStack.length - 1; i >= 0; i--) {
      const scope = this.queryScopeStack[i];
      if (!scope) continue;
      const table = scope.tables.get(tableId);
      if (table) return table;
    }
    return undefined;
  }

  /**
   * Searches the CTE scope stack for a CTE registration with the given normalised
   * name. Returns the {@link ScopeTable} only when `kind === 'cte'`, so a real
   * table that shadows a CTE name is never misidentified.
   */
  private resolveCteFromScope(normalizedName: NormalizedIdBrand): ScopeTable | undefined {
    for (let i = this.cteScopeStack.length - 1; i >= 0; i--) {
      const scope = this.cteScopeStack[i];
      if (!scope) continue;
      const table = scope.tables.get(normalizedName);
      if (table?.kind === "cte") return table;
    }
    return undefined;
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
   * progressively shorter right-hand suffixes. Returns `true` on success.
   */
  private tryResolveQualifiedColumn(parts: string[]): boolean {
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
    // Prefer the first split where the column is confirmed in metadata; if none
    // match, fall back to the first resolved table so the column is still
    // attributed (routed to unresolvedByTableMap by recordColumn).
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
      // No split produced a metadata match — commit to the first resolved table.
      if (firstTableMatch) {
        this.recordColumn(firstTableMatch.table, firstTableMatch.colName);
        return true;
      }
    }

    return false;
  }

  /**
   * Attempts to resolve a bare column name against all in-scope tables.
   * Returns `true` if the column was found and recorded (or was ambiguous).
   *
   * Ambiguity rule (mirrors Trino semantics): when more than one *distinct*
   * source table in the same scope level owns the column, Trino raises a
   * SemanticException. We mirror this by adding the column to
   * `unresolvedColumns` instead of silently picking the first match.
   */
  private tryResolveAndRecordUnqualifiedColumn(columnName: string): boolean {
    const normalized = normalizeId(columnName);
    for (let i = this.queryScopeStack.length - 1; i >= 0; i--) {
      const scope = this.queryScopeStack[i];
      if (!scope) continue;

      // Collect all *distinct* ScopeTable objects in this scope that own the column.
      // Derived tables are intentionally excluded: they are opaque boundaries —
      // unqualified references must not resolve through a derived alias. This
      // prevents columns inside a subquery body from being absorbed by the
      // outer scope's derived alias that wraps the very same subquery
      // (which would be silently dropped, making them disappear from output).
      // Qualified references (e.g. `o.col`) go through tryResolveQualifiedColumn
      // and correctly reach recordColumn where derived entries are dropped.
      const matches: Array<{ table: ScopeTable; originalColumnName: string }> = [];
      const seenTables = new Set<ScopeTable>();
      for (const table of scope.tables.values()) {
        if (seenTables.has(table)) continue;
        seenTables.add(table);
        if (table.kind === "derived") continue;
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
    const scope: QueryScope = { tables: new Map() };
    for (const rel of relations) {
      this.forEachAliasedRelation(rel, (aliased) => {
        this.registerAliasedRelation(aliased, scope);
      });
    }
    return scope;
  }

  /** Unwraps parenthesised relations, then invokes the callback. */
  private dispatchAliased(aliased: AliasedRelationContext, callback: (aliased: AliasedRelationContext) => void): void {
    const primary = aliased.relationPrimary();
    if (primary instanceof ParenthesizedRelationContext) {
      this.forEachAliasedRelation(primary.relation(), callback);
    } else {
      callback(aliased);
    }
  }

  /**
   * Walks a FROM-clause relation tree and invokes `callback` for every
   * {@link AliasedRelationContext} found. Parenthesised relations are
   * transparently unwrapped.
   */
  private forEachAliasedRelation(rel: RelationContext, callback: (aliased: AliasedRelationContext) => void): void {
    if (rel instanceof JoinRelationContext) {
      for (const child of rel.relation()) {
        this.forEachAliasedRelation(child, callback);
      }
      const sampledRelation = rel.sampledRelation();
      if (sampledRelation) {
        this.dispatchAliased(sampledRelation.patternRecognition().aliasedRelation(), callback);
      }
    } else if (rel instanceof RelationDefaultContext) {
      this.dispatchAliased(rel.sampledRelation().patternRecognition().aliasedRelation(), callback);
    }
  }

  /**
   * Resolves a table name to its source descriptor, applying the priority:
   * CTE in scope → metadata → unknown real table (empty columns, rawName as-is).
   *
   * All derived properties (`qualifiedName`, `columns`, `kind`) come from the
   * same source, so they can never get out of sync with each other.
   */
  private resolveTableSource(
    normalizedName: NormalizedIdBrand,
    rawName: string
  ): { qualifiedName: string; columns: string[]; kind: ScopeTableKind } {
    const cteTable = this.resolveCteFromScope(normalizedName);
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

      // Register under alias (or bare table name when no alias)
      const aliasOrName = alias ?? nameParts.at(-1);
      const scopeTableKey = aliasOrName ? normalizeId(aliasOrName) : normalizedName;
      scope.tables.set(scopeTableKey, scopeTable);

      // Also register under full qualified name for direct references
      if (scopeTableKey !== normalizedName) {
        scope.tables.set(normalizedName, scopeTable);
      }
    } else if (primary instanceof SubqueryRelationContext) {
      this.registerSubquerySource(primary.query(), alias, columnAliasCtx, scope);
    } else if (primary instanceof LateralContext) {
      this.registerSubquerySource(primary.query(), alias, columnAliasCtx, scope);
    } else if (primary instanceof UnnestContext) {
      if (alias) {
        const columns = columnAliasCtx ? columnAliasCtx.identifier().map(getIdentifierText) : [];
        scope.tables.set(normalizeId(alias), createScopeTable(alias, columns, "derived"));
      }
    } else if (primary instanceof TableFunctionInvocationContext) {
      if (alias) {
        const columns = columnAliasCtx ? columnAliasCtx.identifier().map(getIdentifierText) : [];
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
          const tempScope: QueryScope = { tables: new Map() };
          tempScope.tables.set(normalizedName, scopeTable);
          const argAliasCtx = rel.identifier();
          if (argAliasCtx) {
            tempScope.tables.set(normalizeId(getIdentifierText(argAliasCtx)), scopeTable);
          }
          this.pushQueryScope(tempScope);

          for (const expr of tableArg.expression()) {
            this.visit(expr);
          }
          for (const item of tableArg.sortItem()) {
            this.visit(item);
          }

          this.popQueryScope();
        } else if (rel instanceof TableArgumentQueryContext) {
          this.visit(rel.query());
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
      }
      if (primary instanceof SubqueryContext) {
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
