# Internal Logic

This document describes the internal implementation of `@sql-lineage/lineage`.

## Parsing

`parseSqlAntlr(sql)` feeds the SQL string through the official Trino ANTLR4 grammar (`SqlBase.g4`) using a strict error listener that throws `AntlrParseError` on any syntax problem. The result is a typed parse tree passed to the visitors.

## `getUpstreamTables` — how it works

An ANTLR visitor (`UpstreamTablesVisitor`) walks the entire parse tree in a single pass:

1. **`visitWith`** — before descending into each `WITH` clause body, registers every CTE name. This ensures chained CTEs (where CTE B references CTE A) are handled correctly.
2. **`visitTableName`** — records every `FROM table` or `JOIN table` reference found anywhere in the tree, storing the first-seen casing and keying by normalized (lowercase) name for de-duplication.
3. **`visitTableArgumentTable`** — records `TABLE(tbl_name)` references that appear as arguments to table functions (e.g. `TABLE(my_func(TABLE(source)))`).
4. **`visitTableFunctionCall`** — explicitly skips the function name node so it is never mistaken for a table reference; only visits the argument list.
5. **`getResult()`** — filters out any collected name that matches a registered CTE name (case-insensitively), then sorts and returns the remainder.

## `getColumnLineage` — how it works

A scope-stack–based ANTLR visitor (`ColumnLineageVisitor`) walks the parse tree and resolves every column reference to its source table.

### Scope model

Two independent stacks are maintained:

- **Query scope stack** — one entry per SELECT level. Each entry maps a normalized alias (or bare table name) to a `ScopeTable`. The innermost scope is checked first, enabling correlated subquery resolution.
- **CTE scope stack** — one entry per `WITH` clause. CTE definitions are registered here and looked up during table resolution so they can be transparently replaced by their underlying column lists.

Each `ScopeTable` carries:
- `qualifiedName` — display name preserving original casing
- `columns` — ordered list of column names (from metadata or inferred output)
- `columnsByNormalized` — `Map<lowercaseName, originalName>` for O(1) case-insensitive lookups
- `kind` — one of `'real'`, `'cte'`, `'derived'`, `'unknown'`

### Traversal order

1. **`visitQuery`** — entry point for every query node (main query, CTE bodies, subqueries). If a `WITH` clause is present, processes CTEs before the body and pops the CTE scope afterwards.
2. **`processCtes`** — registers all CTE names with inferred or declared column lists in the CTE scope *before* visiting any CTE body, so forward and chained references work.
3. **`processTerm`** — handles the grammar distinction between a plain `SELECT`, a parenthesised subquery, and a set operation (`UNION`/`EXCEPT`/`INTERSECT`). Each branch pushes and pops its own query scope.
4. **`buildScopeFromRelations`** — walks the `FROM` clause to populate the current query scope. For each `AliasedRelation`:
   - **Plain table** → looks up in CTE scope, then metadata, then marks as `'unknown'`. Registered under both its alias and its full qualified name.
   - **Subquery / LATERAL** → registered as `'derived'` with inferred output columns; body is visited separately with its own scope.
   - **UNNEST / TABLE function** → registered as `'derived'` with any declared column aliases.
5. **`customVisitSpecInternals`** — visits SELECT items, WHERE, HAVING, GROUP BY, window definitions, and JOIN ON/USING while the scope is live. Deliberately skips derived-source bodies (handled separately) and ORDER BY (visited by the caller after this returns).
6. Derived-source bodies (subqueries, LATERAL, UNNEST expressions, table function arguments) are visited **after** the scope is pushed, so the outer scope is available for correlated references.

### Column resolution

- **`visitColumnReference`** (bare `col`) → calls `recordUnqualifiedColumn`, which scans from the innermost scope outward. If exactly one table in the scope owns the column, it is attributed to that table. If multiple distinct tables own it (ambiguous), it goes to `unresolvedTableColumns`. If none own it, same.
- **`visitDereference`** (`t.col`, `schema.table.col`, `col.field`) → tries the full dotted prefix as a table alias/name; if not found, tries progressively shorter suffixes; if still not found and there are 3+ parts, tries split points for struct field access (e.g. `alias.struct_col.subfield` — `alias` is the table, `struct_col` is the column, `subfield` is ignored); falls back to treating the first segment as a bare column name before giving up.
- **`visitJoinCriteria`** — for `JOIN … USING (col)`, attributes the column to every table in scope that owns it (both sides of the join typically share it). Uses `visitChildren` for `JOIN … ON` expressions.
- **`visitSelectAll`** — expands `*` and `tbl.*` using the table's known columns list. If the table's column list is empty (unknown metadata), records a `*` placeholder into `unresolvedTableColumns`.

### `recordColumn` routing

| `table.kind` | Column in metadata? | Destination |
|---|---|---|
| `'real'` | yes | `tableColumns` |
| `'real'` | no | `unresolvedTableColumns` (with `table` set) |
| `'unknown'` | — | `unresolvedTableColumns` (with `table` set) |
| `'cte'` | yes or no | silently dropped |
| `'derived'` | yes or no | silently dropped |
