import { SqlBaseVisitor } from "./generated/official/SqlBaseVisitor.js";
import {
  TableArgumentTableContext,
  TableFunctionCallContext,
  TableNameContext,
  WithContext,
} from "./generated/official/SqlBaseParser.js";
import { parseSqlAntlr } from "./parser.js";
import { getIdentifierText, getQualifiedNameParts, normalizeId } from "./column-lineage.utils.js";

// ════════════════════════════════════════════════════════════════
// Upstream Tables Visitor
// ════════════════════════════════════════════════════════════════

/**
 * ANTLR visitor that collects every real upstream table referenced in a query.
 *
 * Strategy:
 *  1. `visitWith` registers all CTE names defined in each WITH clause before
 *     descending, so nested CTEs and chained CTEs are captured in one pass.
 *  2. `visitTableName` records every plain table reference encountered anywhere
 *     in the tree (FROM, subqueries, LATERAL, etc.).
 *  3. `visitTableArgumentTable` records `TABLE(table_name)` references that
 *     appear as arguments inside `TABLE(tableFunctionCall)` invocations.
 *  4. `visitTableFunctionCall` explicitly skips the function name so it is not
 *     mistaken for a table, then visits only the argument list.
 *  5. `getResult` returns the de-duplicated table references that are NOT
 *     CTE names, preserving original casing.
 *
 * Supported FROM-clause forms:
 *  - Plain table / view:      FROM my_table
 *  - Schema-qualified:        FROM myschema.my_table
 *  - Subquery / lateral:      FROM (SELECT …) sub  /  LATERAL (SELECT …)
 *  - UNNEST:                  UNNEST(array_expr) — no new table ref, handled by
 *                             default visitChildren descent.
 *  - Table function:          TABLE(func_name(TABLE(src_table) PARTITION BY …))
 *
 * Note: a schema-qualified reference such as `myschema.my_cte` is intentionally
 * NOT treated as a CTE — CTEs are always unqualified identifiers, so a qualified
 * name is by definition a real table.
 */
class UpstreamTablesVisitor extends SqlBaseVisitor<void> {
  /** Normalised names of all CTE definitions found in the query. */
  private readonly cteNames = new Set<string>();

  /** normalised qualified name → original (first-seen casing) */
  private readonly tableRefs = new Map<string, string>();

  protected defaultResult(): void {
    return;
  }

  /** Registers all CTE names in this WITH clause before walking its children. */
  visitWith = (ctx: WithContext): void => {
    for (const named of ctx.namedQuery()) {
      this.cteNames.add(normalizeId(getIdentifierText(named.identifier())));
    }
    this.visitChildren(ctx);
  };

  /** Records every plain table reference, qualified or not (e.g. `users`, `db.schema.table`). */
  visitTableName = (ctx: TableNameContext): void => {
    const parts = getQualifiedNameParts(ctx.qualifiedName());
    const raw = parts.join(".");
    const normalized = normalizeId(raw);
    if (!this.tableRefs.has(normalized)) {
      this.tableRefs.set(normalized, raw);
    }
    this.visitChildren(ctx);
  };

  /**
   * Records a TABLE(table_name) reference that appears as a table argument
   * inside a TABLE(tableFunctionCall) invocation, e.g.:
   *   TABLE(my_func(TABLE(source_table) PARTITION BY id))
   *                          ^^^^^^^^^^^^
   */
  visitTableArgumentTable = (ctx: TableArgumentTableContext): void => {
    const parts = getQualifiedNameParts(ctx.qualifiedName());
    const raw = parts.join(".");
    const normalized = normalizeId(raw);
    if (!this.tableRefs.has(normalized)) {
      this.tableRefs.set(normalized, raw);
    }
    // Column aliases inside TABLE(…) are not table references — no need to
    // descend further from this node.
  };

  /**
   * Visits a tableFunctionCall node while explicitly skipping its leading
   * qualifiedName (the function name, e.g. `my_func`) so it is never confused
   * with a table reference.  Only the argument list is visited.
   */
  visitTableFunctionCall = (ctx: TableFunctionCallContext): void => {
    for (const arg of ctx.tableFunctionArgument()) {
      this.visit(arg);
    }
  };

  /** Returns the real upstream table names, sorted, with CTE names excluded. */
  getResult(): string[] {
    const result: string[] = [];
    for (const [normalized, raw] of this.tableRefs) {
      if (!this.cteNames.has(normalized)) {
        result.push(raw);
      }
    }
    return result.sort();
  }
}

// ════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════

/**
 * Parses a Trino SQL statement and returns the sorted, de-duplicated list of
 * real upstream table names referenced in it.
 *
 * CTE names (WITH clause definitions) and derived-table aliases are excluded —
 * only physical tables or views that the query ultimately reads from are returned.
 *
 * Schema/catalog qualifications are preserved as written (e.g. `"myschema.orders"`).
 * @example
 * getUpstreamTables(`
 *   WITH recent AS (SELECT * FROM orders WHERE created_at > now() - interval '7' day)
 *   SELECT u.name, r.amount
 *   FROM users u
 *   JOIN recent r ON r.user_id = u.id
 * `);
 * // → ["orders", "users"]
 */
export function getUpstreamTables(sql: string): string[] {
  const tree = parseSqlAntlr(sql);
  const visitor = new UpstreamTablesVisitor();
  visitor.visit(tree);
  return visitor.getResult();
}
