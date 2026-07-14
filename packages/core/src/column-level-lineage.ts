/**
 * @module column-level-lineage
 *
 * Implements OpenLineage-shaped column-level lineage extraction from Trino SQL.
 *
 * Design overview:
 * ─────────────────
 * The algorithm performs a single top-down walk of the ANTLR parse tree,
 * maintaining two stacks:
 *  • `queryScopeStack` — tracks FROM-clause tables visible at each nesting level.
 *    Supports correlated subqueries by searching outward from the innermost scope.
 *  • `cteScopeStack` — tracks CTEs defined in WITH clauses, searched innermost-first.
 *
 * Key design decisions:
 *  1. **Index-based column loops** — Column origins are matched by *position* rather
 *     than by name because SQL aliases, CTE column lists, and column aliases on
 *     subqueries redefine names at the boundary. Position is the only stable
 *     identifier that maps output columns of a CTE/subquery to the inner SELECT
 *     list items that produced them.
 *  2. **Scope push before FROM registration** — The scope is pushed *before*
 *     iterating FROM relations so that LATERAL subqueries and UNNEST expressions
 *     can resolve correlated references to tables already registered in the same
 *     FROM clause (left-to-right SQL semantics).
 *  3. **Transparent derived sources** — CTE and derived tables are resolved
 *     *through* to their underlying real-table column origins, so lineage output
 *     only ever contains physical datasets. This avoids leaking internal synthetic
 *     names into the OpenLineage output.
 *  4. **Pragmatic unknown-table attribution** — When a bare column cannot be found
 *     in any confirmed table but exactly one fully-unknown (metadata-less) table
 *     exists in scope, the column is pragmatically attributed to it rather than
 *     being dropped as unresolved.
 *  5. **Ambiguous bare-name poisoning** — Two unaliased tables that share a bare
 *     name (e.g. `schema1.users` and `schema2.users`) "poison" the short key
 *     so bare `users.col` references are flagged as ambiguous.
 */
import { ParserRuleContext } from "antlr4ng";
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
  JsonTableContext,
  OrdinalityColumnContext,
  ValueColumnContext,
  QueryColumnContext,
  GroupingOperationContext,
} from "./generated/official/SqlBaseParser.js";
import { parseSqlAntlr } from "./parser.js";
import {
  getIdentifierText,
  normalizeId,
  getQualifiedNameParts,
  flattenDereference,
  extractColumnName,
  NormalizedIdBrand,
  uuid,
} from "./utils.js";
import { ScopeTableKind, buildMetadataLookup } from "./lineage-shared.js";
import { HashSet } from "./hashset.js";
import { UnresolvedColumnReference, TableMetadata } from "./types.js";

// ════════════════════════════════════════════════════════════════
// Public Types
// ════════════════════════════════════════════════════════════════

/**
 * OpenLineage-style dataset reference.
 *
 * In OpenLineage terminology, `namespace` identifies the *data source*
 * (e.g. `trino://prod-cluster:8080`, `postgres://host:5432`, or any
 * agreed-upon logical identifier). It is **not** the SQL schema — schemas
 * are part of the dataset `name`, e.g. `name: "myschema.users"`.
 */
export interface DatasetRef {
  namespace: string;
  name: string;
}

/**
 * A single source field referenced by an output column or by the dataset
 * as a whole. Mirrors the OpenLineage `InputField` shape.
 */
export interface InputField {
  namespace: string;
  /** Dataset name (e.g. `"schema.table"`). */
  name: string;
  /** Source column name. */
  field: string;
}

/** Per-output-column lineage entry. */
export interface ColumnLineageField {
  inputFields: InputField[];
}

/**
 * OpenLineage `columnLineage` facet attached to the output dataset.
 *
 * - `fields` maps each output column name → its source input fields.
 * - `dataset` lists input fields that affect the dataset as a whole but
 *   are not attributable to a single output column (WHERE / JOIN ON /
 *   USING / HAVING / GROUP BY / ORDER BY / WINDOW predicates).
 */
export interface ColumnLineageFacet {
  fields: Record<string, ColumnLineageField>;
  dataset: InputField[];
}

/** Output dataset entry, optionally carrying the columnLineage facet. */
export interface DatasetWithFacets extends DatasetRef {
  facets?: { columnLineage?: ColumnLineageFacet };
}

/** Options accepted by {@link ColumnLevelLineage}. */
export interface ColumnLevelLineageOptions {
  /**
   * Default OpenLineage namespace applied to every input dataset (and to the
   * output dataset when {@link outputNamespace} is omitted). Defaults to `""`.
   *
   * Examples: `"trino://prod-cluster:8080"`, `"kafka://broker:9092"`,
   * `"prod-warehouse"`. This is the **data-source** identifier, not a SQL
   * schema name.
   */
  defaultNamespace?: string;
  /**
   * Optional explicit name for the output dataset (e.g. `"analytics.users"`).
   * The input grammar accepts SELECT statements only, so there is no implicit
   * output target — when this option is omitted the synthetic name
   * `"__query_result__"` is used.
   */
  outputName?: string;
  /** Optional explicit namespace for the output dataset. Falls back to {@link defaultNamespace}. */
  outputNamespace?: string;
}

/** Top-level result returned by {@link ColumnLevelLineage.getResult}. */
export interface ColumnLevelLineageResult {
  /** All distinct upstream datasets referenced by the query. */
  inputs: DatasetRef[];
  /** Always a single entry — the (possibly synthetic) output dataset. */
  outputs: DatasetWithFacets[];
  /**
   * Column references that could not be fully resolved to a known table/column.
   * Each entry carries an optional `table` field:
   *  - `table` is set when a table reference was identified but the column name
   *    is not present in that table's known schema (metadata may be incomplete),
   *    or the table itself is absent from the provided metadata (unknown table).
   *  - `table` is absent when the reference had no table context at all
   *    (bare unresolved column, ambiguous column, or a star expansion on an
   *    unknown prefix).
   */
  unresolvedTableColumns: UnresolvedColumnReference[];
}

// ════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════

const SYNTHETIC_OUTPUT_NAME = "__query_result__";
const STAR_FIELD = "*";

// ════════════════════════════════════════════════════════════════
// Internal Types
// ════════════════════════════════════════════════════════════════

/**
 * A FROM-clause source visible in a query scope.
 *
 * For `'cte'` and `'derived'` sources, `columnOrigins` carries the *underlying*
 * input fields each output column was computed from, allowing the outer query
 * to transparently follow column lineage through the CTE / subquery boundary.
 *
 * For `'real'` and `'unknown'` sources, each known column maps to itself
 * (i.e. a single InputField pointing at the source dataset).
 */
interface ScopeTable {
  qualifiedName: string;
  /** Output column display names in declaration order (used for star expansion). */
  columns: string[];
  /** Normalised column name → underlying source input fields. */
  columnOrigins: Map<NormalizedIdBrand, InputField[]>;
  kind: ScopeTableKind;
  /**
   * For `'cte'` / `'derived'` sources only: dataset-level dependencies from
   * inside the body that should propagate into the enclosing query when this
   * source is referenced from a FROM clause.
   */
  inheritedDatasetInputs?: InputField[];
}

interface QueryScope {
  tables: Map<NormalizedIdBrand, ScopeTable>;
  /**
   * Short names that have been "poisoned" because two or more unaliased tables
   * share the same bare name (e.g. schema1.customers and schema2.customers).
   */
  ambiguousKeys: Set<NormalizedIdBrand>;
  /**
   * Dataset-level inputs accumulated while building this scope from the
   * FROM clause (forwarded from CTE / derived sources). Merged into the
   * enclosing query's `datasetInputs` once analysis completes.
   */
  inheritedDatasetInputs: InputField[];
}

interface CteScope {
  tables: Map<NormalizedIdBrand, ScopeTable>;
}

/** Single output column produced by a query. */
interface OutputColumn {
  name: string;
  inputFields: InputField[];
}

/** Result of analyzing a single query (top-level, CTE body, or subquery). */
interface QueryAnalysis {
  outputColumns: OutputColumn[];
  /** Dataset-level dependencies (WHERE / JOIN / HAVING / GROUP BY / ORDER BY / …). */
  datasetInputs: InputField[];
}

// ════════════════════════════════════════════════════════════════
// Internal helpers
// ════════════════════════════════════════════════════════════════

/** Produces a stable identity key for an InputField (namespace:dataset:column). */
function inputFieldKey(f: InputField): string {
  return `${f.namespace}:${f.name}:${f.field}`;
}

/**
 * Removes duplicate InputField entries while preserving insertion order.
 * Duplicates arise naturally when the same column is referenced multiple
 * times in an expression (e.g. `COALESCE(a.id, a.id)`).
 */
function dedupeInputFields(fields: InputField[]): InputField[] {
  const seen = new Set<string>();
  const out: InputField[] = [];
  for (const f of fields) {
    const k = inputFieldKey(f);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(f);
    }
  }
  return out;
}

// ════════════════════════════════════════════════════════════════
// ColumnLevelLineage
// ════════════════════════════════════════════════════════════════

/**
 * Captures column-level lineage **and** dataset-level lineage for a single
 * Trino SELECT statement, producing an OpenLineage-shaped result.
 *
 * Each instance parses and analyses the supplied SQL once on construction.
 * Call {@link getResult} to retrieve the {@link ColumnLevelLineageResult}.
 *
 * Traversal strategy:
 *  1. {@link analyzeQuery} handles WITH-clauses (registering CTEs) then
 *     delegates to {@link analyzeQueryNoWith}.
 *  2. {@link analyzeQueryTerm} dispatches to set operations or the primary
 *     query specification.
 *  3. {@link analyzeQuerySpecification} pushes the FROM scope **before**
 *     registering relations so that LATERAL / UNNEST correlated references
 *     can resolve earlier FROM items (left-to-right SQL semantics). It then
 *     collects per-column lineage from SELECT items and dataset-level lineage
 *     from WHERE / GROUP BY / HAVING / WINDOW / ORDER BY / JOIN criteria.
 *  4. {@link collectInputFieldsInto} is the leaf resolver — it walks an
 *     expression tree, resolving every ColumnReference / Dereference through
 *     the live scope stack.
 *  5. {@link appendSelectItem} expands `*` / `table.*` using each scope
 *     table's known columns list.
 *  6. Subqueries get their own scopes; outer query scopes stay on the stack
 *     so correlated references resolve correctly.
 *  7. CTE / derived entries resolve during column lookup but are
 *     *transparent* — their column origins are traced back to the underlying
 *     real/unknown base tables.
 *  8. Unknown tables (absent from metadata) are still emitted as inputs.
 *     For bare column references, pragmatic attribution is applied when there
 *     is exactly one completely-unknown table in scope with no confirmed
 *     columns to contradict the reference.
 *
 * @example
 * ```ts
 * const lineage = new ColumnLevelLineage(sql, metadata, {
 *   defaultNamespace: "trino://prod",
 *   outputName: "analytics.daily_users",
 * });
 * const { inputs, outputs } = lineage.getResult();
 * ```
 */
export class ColumnLevelLineage {
  private readonly metadataLookup: Map<NormalizedIdBrand, TableMetadata>;
  private readonly defaultNamespace: string;
  private readonly outputNamespace: string;
  private readonly outputName: string;

  /** Stack of FROM-clause scopes; innermost (current query) is last. */
  private readonly queryScopeStack: QueryScope[] = [];
  /** Stack of WITH-clause CTE scopes; innermost is last. */
  private readonly cteScopeStack: CteScope[] = [];
  /** Distinct upstream datasets referenced anywhere in the query (deduped by namespace\0name). */
  private readonly inputDatasets = new Map<string, DatasetRef>();
  /** Column references that could not be resolved (deduped by table:column). */
  private readonly unresolvedColumns = new HashSet<UnresolvedColumnReference>(
    ({ table, column }) => `${table ?? ""}:${normalizeId(column)}`
  );

  private readonly result: ColumnLevelLineageResult;

  constructor(sql: string, metadata: TableMetadata[], options: ColumnLevelLineageOptions = {}) {
    this.metadataLookup = buildMetadataLookup(metadata);
    this.defaultNamespace = options.defaultNamespace ?? "";
    this.outputNamespace = options.outputNamespace ?? this.defaultNamespace;
    this.outputName = options.outputName ?? SYNTHETIC_OUTPUT_NAME;

    const tree = parseSqlAntlr(sql);
    const queryCtx = findRootQuery(tree);
    const analysis: QueryAnalysis = queryCtx ? this.analyzeQuery(queryCtx) : { outputColumns: [], datasetInputs: [] };

    this.result = this.buildResult(analysis);
  }

  /** Returns the cached lineage result for the SQL passed to the constructor. */
  getResult(): ColumnLevelLineageResult {
    return this.result;
  }

  // ════════════════════════════════════════════════════════════
  // Result assembly
  // ════════════════════════════════════════════════════════════

  /**
   * Assembles the final {@link ColumnLevelLineageResult} from the raw analysis.
   *
   * Output column names are de-duplicated with numeric suffixes (`_1`, `_2`, …)
   * to match Trino’s behaviour when multiple output columns share the same
   * inferred name (e.g. bare `SELECT a.id, b.id FROM …`).
   */
  private buildResult(analysis: QueryAnalysis): ColumnLevelLineageResult {
    const fields: Record<string, ColumnLineageField> = {};
    // Track used output names to append numeric suffixes on collision.
    const usedNames = new Set<string>();
    for (const [i, col] of analysis.outputColumns.entries()) {
      // Anonymous columns (no alias, no inferable name) get a positional name.
      const baseName = col.name && col.name.length > 0 ? col.name : `_col${i}`;
      let name = baseName;
      let suffix = 1;
      while (usedNames.has(name)) {
        name = `${baseName}_${suffix++}`;
      }
      usedNames.add(name);
      fields[name] = { inputFields: dedupeInputFields(col.inputFields) };
    }

    const dataset = dedupeInputFields(analysis.datasetInputs);
    const facet: ColumnLineageFacet = { fields, dataset };
    const output: DatasetWithFacets = {
      namespace: this.outputNamespace,
      name: this.outputName,
      facets: { columnLineage: facet },
    };

    const inputs = [...this.inputDatasets.values()].sort((a, b) => {
      const ns = a.namespace.localeCompare(b.namespace);
      return ns !== 0 ? ns : a.name.localeCompare(b.name);
    });

    const unresolvedColumns = [...this.unresolvedColumns.values()].sort((a, b) => {
      const tableCompare = (a.table ?? "").localeCompare(b.table ?? "");
      if (tableCompare !== 0) return tableCompare;
      return a.column.localeCompare(b.column);
    });

    return { inputs, outputs: [output], unresolvedTableColumns: unresolvedColumns };
  }

  // ════════════════════════════════════════════════════════════
  // Scope management
  // ════════════════════════════════════════════════════════════

  private get currentScope(): QueryScope | undefined {
    return this.queryScopeStack.at(-1);
  }

  /**
   * Pushes `scope` onto the query scope stack and returns a `Disposable` that
   * pops it. Pair with `using` so the scope is always popped when the
   * enclosing block exits — even on throw.
   *
   * Using the TC39 Explicit Resource Management (`using`) pattern guarantees
   * that scopes are correctly balanced even if an unexpected error occurs
   * mid-analysis, preventing stale scopes from corrupting subsequent resolution.
   */
  private pushQueryScope(scope: QueryScope): Disposable {
    this.queryScopeStack.push(scope);
    return { [Symbol.dispose]: () => this.queryScopeStack.pop() };
  }

  private pushCteScope(scope: CteScope): Disposable {
    this.cteScopeStack.push(scope);
    return { [Symbol.dispose]: () => this.cteScopeStack.pop() };
  }

  private getUniqueDerivedTableName(): `__derived_table_${string}` {
    return `__derived_table_${uuid()}`;
  }

  // ════════════════════════════════════════════════════════════
  // Query analysis (top-down)
  // ════════════════════════════════════════════════════════════

  /** Entry point for every QueryContext (main query, CTEs, subqueries). */
  private analyzeQuery(ctx: QueryContext): QueryAnalysis {
    const withCtx = ctx.with();
    if (!withCtx) return this.analyzeQueryNoWith(ctx.queryNoWith());

    const cteScope: CteScope = { tables: new Map() };
    using _cteScope = this.pushCteScope(cteScope);
    this.registerCtes(withCtx, cteScope);
    return this.analyzeQueryNoWith(ctx.queryNoWith());
  }

  /**
   * Registers all CTEs in a WITH clause into `cteScope`. Each CTE body is
   * fully analysed so column origins can flow through transparently.
   * CTEs are registered in order so that chained CTEs can reference earlier ones.
   *
   * NOTE: We use index-based iteration over columns (line `for (let i = 0; ...)`)
   * because CTE column aliases override the inner query’s output names *by
   * position*, not by original name. The i-th alias maps to the i-th output
   * column of the CTE body regardless of what name that column was assigned.
   */
  private registerCtes(withCtx: WithContext, cteScope: CteScope): void {
    for (const namedQuery of withCtx.namedQuery()) {
      const cteName = getIdentifierText(namedQuery.identifier());
      const inner = this.analyzeQuery(namedQuery.query());

      const colAliasCtx = namedQuery.columnAliases();
      const aliasNames = colAliasCtx ? colAliasCtx.identifier().map(getIdentifierText) : null;
      const columns = aliasNames ?? inner.outputColumns.map((c, i) => c.name || `_col${i}`);

      const columnOrigins = new Map<NormalizedIdBrand, InputField[]>();
      for (let i = 0; i < columns.length; i++) {
        const key = normalizeId(columns[i]!);
        if (!columnOrigins.has(key)) columnOrigins.set(key, inner.outputColumns[i]?.inputFields ?? []);
      }

      cteScope.tables.set(normalizeId(cteName), {
        qualifiedName: cteName,
        columns,
        columnOrigins,
        kind: "cte",
        inheritedDatasetInputs: inner.datasetInputs,
      });
    }
  }

  private analyzeQueryNoWith(ctx: QueryNoWithContext): QueryAnalysis {
    return this.analyzeQueryTerm(ctx.queryTerm(), ctx);
  }

  /**
   * Dispatches to the correct handler based on the query term type.
   *
   * @param queryNoWithCtx - When `term` is the direct body of a queryNoWith,
   *                         this is that parent. Used so ORDER BY (which lives
   *                         on queryNoWith, not on the term) is resolved with
   *                         the correct scope live.
   */
  private analyzeQueryTerm(term: QueryTermContext, queryNoWithCtx?: QueryNoWithContext): QueryAnalysis {
    if (term instanceof SetOperationContext) {
      // UNION / INTERSECT / EXCEPT: analyse left and right branches
      // independently and merge by position.
      const left = term._left ? this.analyzeQueryTerm(term._left) : { outputColumns: [], datasetInputs: [] };
      const right = term._right ? this.analyzeQueryTerm(term._right) : { outputColumns: [], datasetInputs: [] };
      // Use the wider branch’s width; narrower branch fills with empty inputs.
      const width = Math.max(left.outputColumns.length, right.outputColumns.length);
      const outputColumns: OutputColumn[] = [];
      // Index-based merge: the i-th output column inherits inputs from BOTH
      // the i-th left and i-th right column. This is correct because SQL set
      // operations combine columns positionally, not by name.
      for (let i = 0; i < width; i++) {
        const l = left.outputColumns[i];
        const r = right.outputColumns[i];
        outputColumns.push({
          name: l?.name || r?.name || `_col${i}`,
          inputFields: [...(l?.inputFields ?? []), ...(r?.inputFields ?? [])],
        });
      }
      const datasetInputs = [...left.datasetInputs, ...right.datasetInputs];
      // Set-op ORDER BY cannot be resolved through a FROM scope (there is none
      // at this level — each branch has its own). Column references in ORDER BY
      // here would be positional ordinals or aliases, not FROM-scoped.
      if (queryNoWithCtx) {
        const ob = queryNoWithCtx.orderBy();
        if (ob) datasetInputs.push(...this.collectInputFields(ob));
      }
      return { outputColumns, datasetInputs };
    }

    if (term instanceof QueryTermDefaultContext) {
      const primary = term.queryPrimary();
      if (primary instanceof QueryPrimaryDefaultContext) {
        // Pass ORDER BY into analyzeQuerySpecification so it is resolved
        // while the spec's FROM scope is still live (avoids redundant rebuild).
        const orderBy = queryNoWithCtx?.orderBy() ?? null;
        return this.analyzeQuerySpecification(primary.querySpecification(), orderBy);
      }
      if (primary instanceof SubqueryContext) {
        const inner = this.analyzeQueryNoWith(primary.queryNoWith());
        if (queryNoWithCtx) {
          const ob = queryNoWithCtx.orderBy();
          if (ob) inner.datasetInputs.push(...this.collectInputFields(ob));
        }
        return inner;
      }
    }

    return { outputColumns: [], datasetInputs: [] };
  }

  /**
   * Analyses a single QuerySpecification (SELECT … FROM … WHERE …).
   *
   * The scope is pushed **before** relations are registered so that LATERAL
   * subqueries and UNNEST expressions can resolve correlated references to
   * earlier FROM items (left-to-right SQL semantics).
   *
   * @param orderBy - ORDER BY context from the parent queryNoWith, resolved
   *                  while this spec's scope is still live.
   */
  private analyzeQuerySpecification(
    spec: QuerySpecificationContext,
    orderBy?: ParserRuleContext | null
  ): QueryAnalysis {
    const scope: QueryScope = {
      tables: new Map(),
      ambiguousKeys: new Set(),
      inheritedDatasetInputs: [],
    };
    // Push scope BEFORE registering FROM relations so that LATERAL / UNNEST
    // correlated references (e.g. UNNEST(u.tags)) can resolve tables already
    // registered earlier in the same FROM clause. This mirrors SQL’s
    // left-to-right evaluation order within a FROM clause.
    using _scope = this.pushQueryScope(scope);
    // Register each relation sequentially (left-to-right). Earlier tables are
    // already in scope when later LATERAL / UNNEST items are processed.
    for (const rel of spec.relation()) {
      this.registerRelation(rel, scope);
    }

    // Dataset-level inputs: these are column references in clauses that affect
    // the output dataset as a whole (filtering, grouping, ordering) rather
    // than being attributable to a single output column.
    const datasetInputs: InputField[] = [...scope.inheritedDatasetInputs];

    // JOIN ON / USING — collect from each join in the FROM tree.
    for (const rel of spec.relation()) {
      this.collectJoinCriteria(rel, datasetInputs);
    }

    const where = spec._where;
    if (where) datasetInputs.push(...this.collectInputFields(where));
    const groupBy = spec.groupBy();
    if (groupBy) datasetInputs.push(...this.collectInputFields(groupBy));
    const having = spec._having;
    if (having) datasetInputs.push(...this.collectInputFields(having));
    for (const win of spec.windowDefinition()) {
      datasetInputs.push(...this.collectInputFields(win));
    }
    // ORDER BY is a sibling at the queryNoWith level but resolves against
    // this spec's scope while it is still live.
    if (orderBy) datasetInputs.push(...this.collectInputFields(orderBy));

    const outputColumns: OutputColumn[] = [];
    for (const item of spec.selectItem()) {
      this.appendSelectItem(item, scope, outputColumns);
    }

    return { outputColumns, datasetInputs };
  }

  /**
   * Processes a single SELECT list item into output columns.
   *
   * For `SelectSingle` items: resolves all column references in the expression
   * and produces one output column (name from alias or inferred from expression).
   *
   * For `SelectAll` (`*` / `t.*`): expands to one output column per source
   * table column. Tables are expanded in Map insertion order (which reflects
   * registration order from the FROM clause), matching the SQL engine’s
   * output column ordering guarantee.
   */
  private appendSelectItem(item: ParserRuleContext, scope: QueryScope, outputColumns: OutputColumn[]): void {
    if (item instanceof SelectSingleContext) {
      const aliasCtx = item.identifier();
      const expr = item.expression();
      const inputFields = this.collectInputFields(expr);
      const name = aliasCtx ? getIdentifierText(aliasCtx) : (extractColumnName(expr) ?? expr.getText());
      outputColumns.push({ name, inputFields });
      return;
    }
    if (item instanceof SelectAllContext) {
      const prefix = item.primaryExpression();
      if (prefix) {
        // `t.*` — resolve the prefix and expand its columns.
        const tableRef =
          prefix instanceof DereferenceContext
            ? flattenDereference(prefix).join(".")
            : prefix instanceof ColumnReferenceContext
              ? getIdentifierText(prefix.identifier())
              : prefix.getText();
        const table = this.resolveTableFromScope(tableRef);
        if (table) {
          this.expandTableStar(table, outputColumns);
        } else {
          outputColumns.push({
            name: STAR_FIELD,
            inputFields: [{ namespace: this.defaultNamespace, name: tableRef, field: STAR_FIELD }],
          });
        }
      } else {
        // Bare `*` — expand every distinct table in scope (insertion order).
        const seen = new Set<NormalizedIdBrand>();
        for (const table of scope.tables.values()) {
          const key = normalizeId(table.qualifiedName);
          if (seen.has(key)) continue;
          seen.add(key);
          this.expandTableStar(table, outputColumns);
        }
      }
    }
  }

  /**
   * Expands a single table’s columns for star expansion (`*` / `table.*`).
   *
   * For tables with no known columns (unknown/metadata-less), emits a synthetic
   * `*` InputField so the dependency is still tracked even without schema info.
   *
   * Column order follows the table’s `columns` array, which preserves the
   * original DDL declaration order (for real tables) or the SELECT list order
   * (for derived tables / CTEs).
   */
  private expandTableStar(table: ScopeTable, outputColumns: OutputColumn[]): void {
    if (table.columns.length === 0) {
      if (table.kind === "real" || table.kind === "unknown") {
        outputColumns.push({
          name: STAR_FIELD,
          inputFields: [{ namespace: this.defaultNamespace, name: table.qualifiedName, field: STAR_FIELD }],
        });
      }
      return;
    }
    for (const col of table.columns) {
      if (col === STAR_FIELD) continue;
      const origins = table.columnOrigins.get(normalizeId(col)) ?? [];
      outputColumns.push({ name: col, inputFields: [...origins] });
    }
  }

  // ════════════════════════════════════════════════════════════
  // Column reference collection (expressions → InputField[])
  // ════════════════════════════════════════════════════════════

  /** Collects all input field references from an expression tree. */
  private collectInputFields(node: ParserRuleContext): InputField[] {
    const out: InputField[] = [];
    this.collectInputFieldsInto(node, out);
    return out;
  }

  /**
   * Recursive collector that finds every ColumnReference / Dereference leaf
   * inside `node` and resolves it through the current scope stack. Subqueries
   * are analysed once and contribute both their output column inputs and
   * dataset deps to the enclosing context.
   *
   * Traversal stops at:
   *  - `ColumnReferenceContext`: bare column name → resolved via scope.
   *  - `DereferenceContext`: qualified column (e.g. `t.col`) → flattened and resolved.
   *  - `QueryContext`: inner subquery → analysed recursively; its results merge here.
   *  - `GroupingOperationContext`: `GROUPING(col, …)` → each argument resolved.
   *
   * All other nodes are traversed recursively to reach these leaf types.
   * This avoids needing a visitor for every expression production; the
   * `children` iteration handles the generic case.
   */
  private collectInputFieldsInto(node: ParserRuleContext, target: InputField[]): void {
    if (node instanceof ColumnReferenceContext) {
      this.appendBareColumnInputs(getIdentifierText(node.identifier()), target);
      return;
    }
    if (node instanceof DereferenceContext) {
      const parts = flattenDereference(node);
      this.appendQualifiedColumnInputs(parts, target);
      return;
    }
    if (node instanceof QueryContext) {
      const inner = this.analyzeQuery(node);
      for (const c of inner.outputColumns) target.push(...c.inputFields);
      target.push(...inner.datasetInputs);
      return;
    }
    if (node instanceof GroupingOperationContext) {
      for (const qn of node.qualifiedName()) {
        const parts = getQualifiedNameParts(qn);
        if (parts.length === 1) this.appendBareColumnInputs(parts[0]!, target);
        else if (parts.length >= 2) this.appendQualifiedColumnInputs(parts, target);
      }
      return;
    }
    if (node.children) {
      for (const child of node.children) {
        if (child instanceof ParserRuleContext) {
          this.collectInputFieldsInto(child, target);
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // Column resolution
  // ════════════════════════════════════════════════════════════

  /**
   * Resolves an unqualified (bare) column reference against the scope stack.
   *
   * Resolution rules (innermost scope outward):
   * 1. If exactly one table with confirmed columns owns the column → resolve
   *    through its `columnOrigins`.
   * 2. If multiple confirmed tables own it → ambiguous; drop silently.
   * 3. If no confirmed table owns it but exactly one completely-unknown table
   *    (no metadata columns at all) is in scope → pragmatically attribute.
   * 4. Outer-scope derived tables are excluded from resolution to prevent
   *    incorrect correlated attribution.
   *
   * The reversed iteration (`[...stack].reverse()`) ensures innermost-first
   * search which is safe because:
   *  - SQL name resolution always prefers the closest (most local) scope.
   *  - Correlated references only resolve outward when the inner scope has no
   *    match, exactly matching this fallback behaviour.
   *  - De-duplication by `qualifiedName` (not object identity) ensures that
   *    self-joins (same table aliased differently) count as one table for
   *    ambiguity purposes, preventing false positives.
   */
  private appendBareColumnInputs(name: string, target: InputField[]): void {
    const normalized = normalizeId(name);

    for (const [i, s] of [...this.queryScopeStack].reverse().entries()) {
      const isCurrent = i === 0; // i === 0 after reversal = the innermost scope
      const knownMatches: ScopeTable[] = [];
      const unknownMatches: ScopeTable[] = [];
      // De-duplicate by qualified name so self-joins (same physical table,
      // different aliases) only count once and don’t trigger false ambiguity.
      const seen = new Set<NormalizedIdBrand>();

      for (const t of s.tables.values()) {
        const key = normalizeId(t.qualifiedName);
        if (seen.has(key) || (!isCurrent && t.kind === "derived")) continue;
        seen.add(key);

        if (t.columnOrigins.has(normalized)) {
          knownMatches.push(t);
        } else if (t.kind === "unknown" && t.columns.length === 0) {
          // Completely unknown table (no metadata) — potential pragmatic match.
          unknownMatches.push(t);
        }
      }

      // Prefer confirmed matches over pragmatic unknown-table matches.
      // This two-tier system avoids attributing a column to an unknown table
      // when a confirmed table already claims it.
      const matches = knownMatches.length > 0 ? knownMatches : unknownMatches;
      if (matches.length === 0) continue;

      if (matches.length === 1) {
        const match = matches[0]!;
        const origins = match.columnOrigins.get(normalized);
        if (origins) {
          target.push(...origins);
        } else {
          // Pragmatic attribution: synthesise an InputField for the unknown table.
          target.push({ namespace: this.defaultNamespace, name: match.qualifiedName, field: name });
        }
        return;
      }
      // Ambiguous — multiple distinct tables own this column.
      this.recordUnresolved(undefined, name);
      return;
    }
    // Not found in any scope.
    this.recordUnresolved(undefined, name);
  }

  /**
   * Resolves a qualified column reference such as `t.col` or
   * `schema.table.col`.
   *
   * Resolution order (first match wins):
   *  1. Try the full dotted prefix as a table reference (e.g. `schema.table`).
   *  2. Progressively shorter right-hand suffixes of the prefix
   *     (catalog.schema.table → schema.table → table). This handles
   *     over-qualified references where the user includes the catalog/schema
   *     but the table is registered under a shorter key.
   *  3. Struct field access — when a left prefix resolves to a table and the
   *     next segment is a confirmed column, attribute to that column (ignoring
   *     deeper sub-fields like `.field.subfield`). This is correct for SQL
   *     column-level lineage: `t.profile.age` depends on column `profile`
   *     regardless of which nested field is accessed.
   *  4. Fallback: treat the first segment as a bare column name with struct
   *     field access (e.g. `column.field`) — resolve just the base name.
   */
  private appendQualifiedColumnInputs(parts: string[], target: InputField[]): void {
    if (parts.length < 2) {
      if (parts.length === 1 && parts[0]) this.appendBareColumnInputs(parts[0], target);
      return;
    }

    const colName = parts.at(-1)!;
    const tableParts = parts.slice(0, -1);

    // 1) Full prefix as a single table reference.
    const fullTable = this.resolveTableFromScope(tableParts.join("."));
    if (fullTable) {
      this.appendColumnFromTable(fullTable, colName, target);
      return;
    }

    // 2) Progressively shorter right-hand suffixes.
    for (let start = 1; start < tableParts.length; start++) {
      const t = this.resolveTableFromScope(tableParts.slice(start).join("."));
      if (t) {
        this.appendColumnFromTable(t, colName, target);
        return;
      }
    }

    // 3) Struct field access with a table alias or schema-qualified prefix:
    //    e.g. tbl.column.field or schema.tbl.column.field.
    //    Try each left-side prefix as a table path; the next segment is the
    //    column name, and remaining segments are sub-fields (ignored).
    if (parts.length >= 3) {
      let firstMatch: { table: ScopeTable; col: string } | undefined;
      for (let len = 1; len <= parts.length - 2; len++) {
        const t = this.resolveTableFromScope(parts.slice(0, len).join("."));
        if (!t) continue;
        const c = parts[len]!;
        const key = normalizeId(c);
        if (t.columnOrigins.has(key)) {
          // Preferred: column confirmed in schema — commit immediately.
          this.appendColumnFromTable(t, c, target);
          return;
        }
        if (!firstMatch) firstMatch = { table: t, col: c };
      }
      if (firstMatch) {
        this.appendColumnFromTable(firstMatch.table, firstMatch.col, target);
        return;
      }
    }

    // 4) Fallback: treat the first segment as a bare column name with struct
    //    field access (e.g. `profile.age` where `profile` is a column, not a
    //    table). Resolve just the base column name.
    this.appendBareColumnInputs(parts[0]!, target);
  }

  /** Records a column reference as unresolved (deduped by table+column). */
  private recordUnresolved(table: string | undefined, column: string): void {
    this.unresolvedColumns.add(table ? { table, column } : { column });
  }

  /**
   * Appends the input fields for `colName` on the given `table`.
   *
   * If the column has known origins, those are used. For real/unknown tables
   * where the column is NOT in the map, a synthetic InputField is emitted so
   * the reference is still surfaced. For CTE/derived tables, unrecognised
   * columns are silently dropped.
   */
  private appendColumnFromTable(table: ScopeTable, colName: string, target: InputField[]): void {
    const key = normalizeId(colName);
    const origins = table.columnOrigins.get(key);
    if (origins) {
      target.push(...origins);
      return;
    }
    if (table.kind === "real" || table.kind === "unknown") {
      target.push({ namespace: this.defaultNamespace, name: table.qualifiedName, field: colName });
      this.recordUnresolved(table.qualifiedName, colName);
    }
  }

  /**
   * Looks up a table by alias or name, searching from the innermost scope
   * outward (supporting correlated subqueries).
   *
   * The reverse traversal order is safe and correct because SQL name resolution
   * always binds to the nearest (most local) definition. A table alias `t` in
   * an inner subquery shadows any outer `t` — searching innermost-first means
   * we find the local binding without ever seeing the outer one.
   */
  private resolveTableFromScope(nameOrAlias: string): ScopeTable | undefined {
    const id = normalizeId(nameOrAlias);
    for (const scope of this.queryScopeStack.toReversed()) {
      const t = scope.tables.get(id);
      if (t) return t;
    }
    return undefined;
  }

  /** Searches the CTE scope stack for a CTE with the given normalised name. */
  private resolveCteFromCteScope(normalizedName: NormalizedIdBrand): ScopeTable | undefined {
    for (const scope of this.cteScopeStack.toReversed()) {
      const t = scope.tables.get(normalizedName);
      if (t) return t;
    }
    return undefined;
  }

  /**
   * Resolves a table name to its source descriptor, applying priority:
   * CTE in scope → metadata → unknown table.
   *
   * Used by MATCH_RECOGNIZE and TABLE() function argument handling to resolve
   * referenced table names without fully registering them in the FROM scope.
   */
  private resolveTableSource(
    normalizedName: NormalizedIdBrand,
    rawName: string
  ): { qualifiedName: string; columns: string[]; kind: ScopeTableKind } {
    const cte = this.resolveCteFromCteScope(normalizedName);
    if (cte) return { qualifiedName: cte.qualifiedName, columns: cte.columns, kind: "cte" };
    const meta = this.metadataLookup.get(normalizedName);
    if (meta) {
      const qualifiedName = meta.tableSchema ? `${meta.tableSchema}.${meta.tableName}` : meta.tableName;
      return { qualifiedName, columns: meta.columns, kind: "real" };
    }
    return { qualifiedName: rawName, columns: [], kind: "unknown" };
  }

  // ════════════════════════════════════════════════════════════
  // FROM clause → scope construction
  // ════════════════════════════════════════════════════════════

  /** Recursively walks a relation tree, registering each leaf in `scope`. */
  private registerRelation(rel: RelationContext, scope: QueryScope): void {
    if (rel instanceof JoinRelationContext) {
      for (const child of rel.relation()) this.registerRelation(child, scope);
      const sampled = rel.sampledRelation();
      if (sampled) this.registerPatternRecognition(sampled.patternRecognition(), scope);
      return;
    }
    if (rel instanceof RelationDefaultContext) {
      this.registerPatternRecognition(rel.sampledRelation().patternRecognition(), scope);
    }
  }

  /**
   * Registers a {@link PatternRecognitionContext} into the given scope.
   *
   * - When no MATCH_RECOGNIZE clause is present the inner
   *   {@link AliasedRelationContext} is registered as usual.
   * - When MATCH_RECOGNIZE is present the output is a `'derived'` scope table
   *   keyed on the outer alias, with its columns taken from the MEASURES
   *   definitions. The source relation is also registered as an input dataset
   *   so it appears in the lineage output.
   */
  private registerPatternRecognition(ctx: PatternRecognitionContext, scope: QueryScope): void {
    if (ctx.MATCH_RECOGNIZE()) {
      const aliasCtx = ctx.identifier();
      const aliasOrName = aliasCtx ? getIdentifierText(aliasCtx) : this.getUniqueDerivedTableName();
      const colAliasCtx = ctx.columnAliases();
      const cols = colAliasCtx
        ? colAliasCtx.identifier().map(getIdentifierText)
        : ctx.measureDefinition().map((m) => getIdentifierText(m.identifier()));
      this.registerDerived(aliasOrName, cols, new Map(), scope);

      // Register the source relation as an input dataset.
      const primary = ctx.aliasedRelation().relationPrimary();
      if (primary instanceof TableNameContext) {
        const nameParts = getQualifiedNameParts(primary.qualifiedName());
        const rawName = nameParts.join(".");
        const normalizedName = normalizeId(rawName);
        const source = this.resolveTableSource(normalizedName, rawName);
        if (source.kind !== "cte") {
          this.registerInputDataset({ namespace: this.defaultNamespace, name: source.qualifiedName });
        }
      } else if (primary instanceof SubqueryRelationContext || primary instanceof LateralContext) {
        // Analyse the inner query to trigger input dataset registration.
        this.analyzeQuery(primary.query());
      }
      return;
    }

    const ar = ctx.aliasedRelation();
    const primary = ar.relationPrimary();
    if (primary instanceof ParenthesizedRelationContext) {
      this.registerRelation(primary.relation(), scope);
      return;
    }
    this.registerAliasedRelation(ar, scope);
  }

  /**
   * Registers a single aliased relation (table, subquery, lateral, unnest,
   * table function, or json_table) into the given scope.
   */
  private registerAliasedRelation(ctx: AliasedRelationContext, scope: QueryScope): void {
    const primary = ctx.relationPrimary();
    const aliasCtx = ctx.identifier();
    const alias = aliasCtx ? getIdentifierText(aliasCtx) : null;
    const colAliasCtx = ctx.columnAliases();
    const columnAliases = colAliasCtx ? colAliasCtx.identifier().map(getIdentifierText) : null;

    if (primary instanceof TableNameContext) {
      this.registerTableName(primary, alias, columnAliases, scope);
      return;
    }

    if (primary instanceof SubqueryRelationContext || primary instanceof LateralContext) {
      const inner = this.analyzeQuery(primary.query());
      const aliasOrName = alias ?? this.getUniqueDerivedTableName();
      const columns = columnAliases ?? inner.outputColumns.map((c, i) => c.name || `_col${i}`);
      const origins = new Map<NormalizedIdBrand, InputField[]>();
      // Index-based: the i-th column alias/name on the derived table maps to
      // the i-th output column of the subquery body. This positional mapping
      // is the only safe approach because column aliases can freely rename the
      // inner columns (e.g. `(SELECT a AS x, b AS y) AS sub(p, q)`).
      for (let i = 0; i < columns.length; i++) {
        const key = normalizeId(columns[i]!);
        if (!origins.has(key)) origins.set(key, inner.outputColumns[i]?.inputFields ?? []);
      }
      this.registerDerived(aliasOrName, columns, origins, scope, inner.datasetInputs);
      return;
    }

    if (primary instanceof UnnestContext) {
      const aliasOrName = alias ?? this.getUniqueDerivedTableName();
      const columns = columnAliases ?? [];
      // Column refs inside UNNEST(expr) are dataset-level (they describe the
      // array being unnested, not output column origins).
      const datasetInputs = this.collectInputFields(primary);
      this.registerDerived(aliasOrName, columns, new Map(), scope);
      scope.inheritedDatasetInputs.push(...datasetInputs);
      return;
    }

    if (primary instanceof TableFunctionInvocationContext) {
      const aliasOrName = alias ?? this.getUniqueDerivedTableName();
      const columns = columnAliases ?? [];
      const datasetInputs = this.collectTableFunctionInputs(primary.tableFunctionCall());
      this.registerDerived(aliasOrName, columns, new Map(), scope);
      scope.inheritedDatasetInputs.push(...datasetInputs);
      return;
    }

    if (primary instanceof JsonTableContext) {
      const aliasOrName = alias ?? this.getUniqueDerivedTableName();
      let columns: string[] = [];
      if (columnAliases) {
        columns = columnAliases;
      } else {
        columns = primary
          .jsonTableColumn()
          .filter(
            (c): c is OrdinalityColumnContext | ValueColumnContext | QueryColumnContext =>
              c instanceof OrdinalityColumnContext || c instanceof ValueColumnContext || c instanceof QueryColumnContext
          )
          .map((c) => getIdentifierText(c.identifier()));
      }
      const datasetInputs = this.collectInputFields(primary);
      this.registerDerived(aliasOrName, columns, new Map(), scope);
      scope.inheritedDatasetInputs.push(...datasetInputs);
    }
  }

  /**
   * Visits the arguments of a TABLE() function invocation, properly handling
   * TABLE(table_name) arguments by pushing a temporary scope so that
   * PARTITION BY / ORDER BY column references resolve against the referenced
   * table.
   *
   * Mirrors the approach in {@link ColumnLineageVisitor.customVisitTableFunctionCallArguments}.
   */
  private collectTableFunctionInputs(ctx: TableFunctionCallContext): InputField[] {
    const result: InputField[] = [];
    for (const arg of ctx.tableFunctionArgument()) {
      const tableArg = arg.tableArgument();
      if (tableArg) {
        const rel = tableArg.tableArgumentRelation();
        if (rel instanceof TableArgumentTableContext) {
          // TABLE(table_name) PARTITION BY … ORDER BY … — resolve the table,
          // push a temporary scope so columns are attributed correctly.
          const rawName = getQualifiedNameParts(rel.qualifiedName()).join(".");
          const normalizedName = normalizeId(rawName);
          const source = this.resolveTableSource(normalizedName, rawName);

          if (source.kind !== "cte") {
            this.registerInputDataset({ namespace: this.defaultNamespace, name: source.qualifiedName });
          }

          // Build a temporary scope with the argument table.
          const datasetRef: DatasetRef = { namespace: this.defaultNamespace, name: source.qualifiedName };
          const origins = new Map<NormalizedIdBrand, InputField[]>();
          for (const col of source.columns) {
            const key = normalizeId(col);
            if (!origins.has(key)) origins.set(key, [{ ...datasetRef, field: col }]);
          }
          const tempScope: QueryScope = { tables: new Map(), ambiguousKeys: new Set(), inheritedDatasetInputs: [] };
          const scopeTable: ScopeTable = {
            qualifiedName: source.qualifiedName,
            columns: source.columns,
            columnOrigins: origins,
            kind: source.kind,
          };
          tempScope.tables.set(normalizedName, scopeTable);
          const argAlias = rel.identifier();
          if (argAlias) tempScope.tables.set(normalizeId(getIdentifierText(argAlias)), scopeTable);

          using _scope = this.pushQueryScope(tempScope);
          result.push(...this.collectInputFields(tableArg));
        } else if (rel instanceof TableArgumentQueryContext) {
          // TABLE(query) — analyse the inner query; all its outputs and dataset
          // deps flow into the enclosing TABLE() function's dataset deps.
          const inner = this.analyzeQuery(rel.query());
          for (const c of inner.outputColumns) result.push(...c.inputFields);
          result.push(...inner.datasetInputs);
        }
      } else {
        // Scalar expression argument.
        const expr = arg.expression();
        if (expr) result.push(...this.collectInputFields(expr));
      }
    }
    return result;
  }

  /**
   * Registers a real / cte / unknown {@link TableNameContext} in the FROM scope,
   * applying alias / unaliased / qualified-name registration rules and the
   * “ambiguous bare-name” poisoning logic so that two same-bare-name unaliased
   * tables from different schemas do not resolve via the bare identifier.
   *
   * **Why index-based loops for column origins:**
   * Column aliases on a table (e.g. `FROM users AS u(a, b, c)`) rename the
   * output columns *by position*. The i-th alias corresponds to the i-th
   * column in the table’s schema. Index-based iteration is the only correct
   * way to establish this positional mapping — name-based matching would
   * silently break when an alias differs from the underlying column name.
   *
   * The same reasoning applies to CTE column aliases:
   * `WITH cte(x, y) AS (SELECT a, b FROM t)` — `x` maps to the 1st output
   * column `a`, `y` maps to the 2nd output column `b`.
   */
  private registerTableName(
    primary: TableNameContext,
    alias: string | null,
    columnAliases: string[] | null,
    scope: QueryScope
  ): void {
    const nameParts = getQualifiedNameParts(primary.qualifiedName());
    const rawName = nameParts.join(".");
    const normalizedName = normalizeId(rawName);

    const cte = this.resolveCteFromCteScope(normalizedName);
    let scopeTable: ScopeTable;

    if (cte) {
      const columns = columnAliases ?? cte.columns;
      const origins = new Map<NormalizedIdBrand, InputField[]>();
      // Index-based: positional mapping from the outer alias (or CTE column
      // name) back to the inner CTE body’s output columns. The i-th column
      // in the CTE reference maps to the i-th column produced by the CTE body.
      // `!origins.has(key)` guard: first occurrence wins when duplicate column
      // names exist (shouldn’t happen in valid SQL but defends against it).
      for (let i = 0; i < columns.length; i++) {
        const key = normalizeId(columns[i]!);
        const sourceCol = cte.columns[i];
        const orig = sourceCol ? cte.columnOrigins.get(normalizeId(sourceCol)) : undefined;
        if (!origins.has(key)) origins.set(key, orig ?? []);
      }
      scopeTable = {
        qualifiedName: cte.qualifiedName,
        columns,
        columnOrigins: origins,
        kind: "cte",
        inheritedDatasetInputs: cte.inheritedDatasetInputs,
      };
      if (cte.inheritedDatasetInputs && cte.inheritedDatasetInputs.length > 0) {
        scope.inheritedDatasetInputs.push(...cte.inheritedDatasetInputs);
      }
    } else {
      const meta = this.metadataLookup.get(normalizedName);
      const kind: "real" | "unknown" = meta ? "real" : "unknown";
      const qualifiedName = meta
        ? meta.tableSchema
          ? `${meta.tableSchema}.${meta.tableName}`
          : meta.tableName
        : rawName;
      const datasetRef: DatasetRef = { namespace: this.defaultNamespace, name: qualifiedName };
      this.registerInputDataset(datasetRef);

      const sourceCols = meta?.columns ?? [];
      const columns = columnAliases ?? sourceCols;
      const origins = new Map<NormalizedIdBrand, InputField[]>();
      // Index-based: for real/unknown tables, each column maps to itself in
      // the source dataset. When the user supplied column aliases (e.g.
      // `FROM users AS u(a, b)`), we still attribute back to the underlying
      // real column at the same position. This is safe because SQL column
      // aliases on base tables are strictly positional.
      for (let i = 0; i < columns.length; i++) {
        const aliasName = columns[i]!;
        const sourceCol = columnAliases ? (sourceCols[i] ?? aliasName) : aliasName;
        const key = normalizeId(aliasName);
        if (!origins.has(key)) {
          origins.set(key, [{ ...datasetRef, field: sourceCol }]);
        }
      }
      scopeTable = { qualifiedName, columns, columnOrigins: origins, kind };
    }

    // Registration strategy for table lookup keys:
    // 1. If aliased: register under the alias only (SQL says alias hides the
    //    original name within the same scope).
    // 2. If unaliased: register under the bare (last segment) name, UNLESS a
    //    different table already occupies that key — in which case both are
    //    "poisoned" and the bare key is removed. This prevents ambiguous
    //    resolution of `tbl.col` when two schemas define the same table name.
    // 3. Always register under the full qualified normalised name so that
    //    fully-qualified references (e.g. `schema.table.col`) still resolve.
    const bareName = nameParts.at(-1);
    const normalizedAlias = alias ? normalizeId(alias) : null;
    const normalizedBare = bareName ? normalizeId(bareName) : null;

    if (normalizedAlias) {
      scope.tables.set(normalizedAlias, scopeTable);
    } else if (normalizedBare) {
      // Ambiguous bare-name poisoning: once poisoned, the key is never
      // un-poisoned (correct for SQL semantics within a single FROM clause).
      if (!scope.ambiguousKeys.has(normalizedBare)) {
        const existing = scope.tables.get(normalizedBare);
        // Compare qualified names to distinguish true ambiguity from self-join.
        // Self-join (same table twice): same qualifiedName → no poisoning.
        // Different tables: different qualifiedName → poison the bare key.
        if (existing && normalizeId(existing.qualifiedName) !== normalizeId(scopeTable.qualifiedName)) {
          scope.tables.delete(normalizedBare);
          scope.ambiguousKeys.add(normalizedBare);
        } else {
          scope.tables.set(normalizedBare, scopeTable);
        }
      }
    }
    // Always make the full qualified normalised name resolvable so that
    // `schema.table.col` references work regardless of aliasing.
    if (!scope.tables.has(normalizedName)) {
      scope.tables.set(normalizedName, scopeTable);
    }
  }

  /**
   * Registers a derived source (subquery, LATERAL, UNNEST, TABLE(), JSON_TABLE,
   * MATCH_RECOGNIZE output) in the FROM scope.
   *
   * Derived tables are always keyed by their alias (or a synthetic UUID name
   * when unaliased). They propagate `inheritedDatasetInputs` to the enclosing
   * scope so that WHERE/JOIN/GROUP BY columns referenced inside the subquery
   * body correctly appear in the outer query’s dataset-level inputs.
   */
  private registerDerived(
    aliasOrName: string,
    columns: string[],
    columnOrigins: Map<NormalizedIdBrand, InputField[]>,
    scope: QueryScope,
    inheritedDatasetInputs?: InputField[]
  ): void {
    scope.tables.set(normalizeId(aliasOrName), {
      qualifiedName: aliasOrName,
      columns,
      columnOrigins,
      kind: "derived",
      inheritedDatasetInputs,
    });
    if (inheritedDatasetInputs && inheritedDatasetInputs.length > 0) {
      scope.inheritedDatasetInputs.push(...inheritedDatasetInputs);
    }
  }

  // ════════════════════════════════════════════════════════════
  // Join criteria collection
  // ════════════════════════════════════════════════════════════

  /**
   * Walks the relation tree collecting dataset-level deps from JOIN ON/USING.
   *
   * JOIN criteria columns are dataset-level inputs (not attributable to a single
   * output column) because they affect which rows appear in the result rather
   * than computing a specific output value.
   */
  private collectJoinCriteria(rel: RelationContext, target: InputField[]): void {
    if (rel instanceof JoinRelationContext) {
      const criteria = rel.joinCriteria();
      if (criteria) this.appendJoinCriteriaInputs(criteria, target);
      for (const child of rel.relation()) this.collectJoinCriteria(child, target);
    }
  }

  /**
   * Resolves JOIN USING columns by looking up the column name in every distinct
   * table in the current scope. Unlike ON clauses (arbitrary boolean expressions),
   * USING references a column that must exist in both sides of the join, so we
   * attribute it to every table that has it.
   */
  private appendJoinCriteriaInputs(ctx: JoinCriteriaContext, target: InputField[]): void {
    if (ctx.USING()) {
      const scope = this.currentScope;
      if (!scope) return;
      for (const id of ctx.identifier()) {
        const colName = getIdentifierText(id);
        const normalized = normalizeId(colName);
        const seen = new Set<NormalizedIdBrand>();
        for (const t of scope.tables.values()) {
          const key = normalizeId(t.qualifiedName);
          if (seen.has(key)) continue;
          seen.add(key);
          const origins = t.columnOrigins.get(normalized);
          if (origins) target.push(...origins);
        }
      }
      return;
    }
    // ON clause — visit the boolean expression.
    target.push(...this.collectInputFields(ctx));
  }

  // ════════════════════════════════════════════════════════════
  // Input dataset registry
  // ════════════════════════════════════════════════════════════

  /**
   * Records a dataset as an input (upstream dependency).
   * Uses a null-byte separator in the dedup key to avoid collisions between
   * namespace and name segments (e.g. namespace="a" name="b" vs namespace="a\0" name="b").
   */
  private registerInputDataset(ref: DatasetRef): void {
    const key = `${ref.namespace}\u0000${ref.name}`;
    if (!this.inputDatasets.has(key)) {
      this.inputDatasets.set(key, ref);
    }
  }
}

// ════════════════════════════════════════════════════════════════
// Internal: locate the top-level QueryContext in a parsed statement.
// ════════════════════════════════════════════════════════════════

/**
 * Recursively searches the parse tree for the first QueryContext node.
 * The Trino grammar wraps the query in statement-level nodes, so this
 * DFS finds the actual query body regardless of the top-level statement type.
 */
function findRootQuery(node: ParserRuleContext): QueryContext | undefined {
  if (node instanceof QueryContext) return node;
  if (node.children) {
    for (const child of node.children) {
      if (child instanceof ParserRuleContext) {
        const found = findRootQuery(child);
        if (found) return found;
      }
    }
  }
  return undefined;
}

// ════════════════════════════════════════════════════════════════
// Public convenience function
// ════════════════════════════════════════════════════════════════

/**
 * One-shot helper around {@link ColumnLevelLineage}.
 *
 * @param sql      - The Trino SELECT statement to analyse.
 * @param metadata - Known tables and their columns, used to resolve bare
 *                   column references and to expand `SELECT *`.
 * @param options  - See {@link ColumnLevelLineageOptions}.
 */
export function getColumnLevelLineage(
  sql: string,
  metadata: TableMetadata[],
  options?: ColumnLevelLineageOptions
): ColumnLevelLineageResult {
  return new ColumnLevelLineage(sql, metadata, options).getResult();
}
