# @sql-lineage/core

A TypeScript library for extracting column and table lineage from Trino SQL queries. Built on the official Trino ANTLR4 grammar, it statically analyses SQL to determine exactly which physical tables and columns a query depends on.

> **Supported dialect:** [Trino](https://trino.io/) SQL, parsed via the [official Trino ANTLR4 grammar](https://github.com/trinodb/trino/blob/master/core/trino-grammar/src/main/antlr4/io/trino/grammar/sql/SqlBase.g4) from Trino's source code.

> **The current grammar was taken from Trino 479** - Don't forget to update this line when updating the grammar and regenerating antlr4

## Features

- **Upstream table extraction** — identifies every real (physical) table a query reads from, stripping CTEs and derived tables
- **Column lineage** — for each source table, identifies exactly which columns are referenced anywhere in the query (SELECT list, WHERE, JOIN conditions, GROUP BY, HAVING, ORDER BY, window functions, etc.)
- **Unresolved reference tracking** — columns that cannot be attributed to a known table are collected separately rather than silently dropped
- **Full Trino SQL dialect** — CTEs, subqueries, LATERAL, UNNEST, set operations (UNION / EXCEPT / INTERSECT), correlated subqueries, `JOIN … USING`, `SELECT *` expansion, struct field access, table functions
- Works in both Node.js and browser environments

## Installation

```
npm install @sql-lineage/core
```

## API

### `getUpstreamTables(sql)`

```typescript
import { getUpstreamTables } from '@sql-lineage/core';

getUpstreamTables(`
  WITH recent AS (SELECT * FROM orders WHERE created_at > now() - interval '7' day)
  SELECT u.name, r.amount
  FROM users u
  JOIN recent r ON r.user_id = u.id
`);
// → ["orders", "users"]
```

Returns a **sorted, de-duplicated** array of real upstream table names.

- **Saved**: every table name that appears in a FROM clause, JOIN, or subquery — including schema/catalog-qualified names (`"myschema.orders"`, `"catalog.schema.table"`) preserved exactly as written.
- **Filtered out**: CTE names defined in `WITH` clauses. If a name is both a CTE and a physical table, the unqualified form is treated as the CTE; a schema-qualified form of the same name is always treated as a real table.
- **De-duplicated**: when the same table is self-joined or referenced multiple times it appears once.
- **Sorted**: output is alphabetically sorted for deterministic results.

---

### `getColumnLineage(sql, metadata)`

```typescript
import { getColumnLineage } from '@sql-lineage/core';

const metadata = [
  { tableName: 'users',  columns: ['id', 'name', 'email', 'status'] },
  { tableName: 'orders', columns: ['id', 'user_id', 'amount', 'created_at'] },
];

getColumnLineage(`
  SELECT u.name, o.amount
  FROM users u
  JOIN orders o ON u.id = o.user_id
  WHERE u.status = 'active'
  ORDER BY o.created_at
`, metadata);
// →
// {
//   tableColumns: [
//     { table: "orders", columns: ["amount", "created_at", "user_id"] },
//     { table: "users",  columns: ["id", "name", "status"] },
//   ],
//   unresolvedTableColumns: []
// }
```

Returns a `ColumnLineageResult` with two fields:

| Field | Type | Description |
|---|---|---|
| `tableColumns` | `{ table: string; columns: string[] }[]` | Resolved columns, grouped by source table |
| `unresolvedTableColumns` | `{ table?: string; column: string }[]` | Column references that could not be fully resolved |

#### What is saved in `tableColumns`

Every column reference found **anywhere** in the query (not just the SELECT list) that can be attributed to a known physical table goes here. The tracked clauses are:

- `SELECT` items
- `WHERE`
- `JOIN ON` / `JOIN USING`
- `GROUP BY`
- `HAVING`
- `ORDER BY`
- Window function definitions (`OVER (PARTITION BY … ORDER BY …)`)

Results are **sorted**: tables alphabetically, and columns within each table alphabetically.

#### What lands in `unresolvedTableColumns`

An entry is added here when a reference cannot be fully resolved:

- **`table` is set, `column` is the column name** — the table was identified but is either absent from the provided metadata (unknown table), or the column is not listed in that table's known schema.
- **`table` is absent** — no table context could be determined at all: bare unqualified column with no owning table in scope, ambiguous column present in multiple tables at the same scope level, a `USING` column not found in any in-scope table, or a `table.*` expansion where the prefix is unknown.

#### What is silently dropped

- Columns that resolve to a **CTE** source — CTEs are transparent relay nodes. Their recognized column references are consumed during lineage walking (so the underlying real-table columns get attributed correctly through whatever the CTE selects from), but CTE names themselves never appear in `tableColumns`.
- Columns that resolve to a **derived table** (inline subquery or `LATERAL` in FROM) — same reasoning: the subquery's own columns are resolved recursively against whatever tables feed it.

#### Metadata and `TableMetadata`

```typescript
interface TableMetadata {
  tableName: string;
  tableSchema?: string;    // optional — enables "schema.table" lookups
  columns: string[];
}
```

Metadata is required for:
- Resolving **bare unqualified column** names (e.g. `WHERE status = 'active'`) to the right table when multiple tables are in scope
- **Expanding `SELECT *`** and `SELECT table.*` into individual column names
- **Struct field access disambiguation** — when a dotted reference like `profile.age` could be either a table alias or a struct column, the metadata confirms which interpretation is correct

Without metadata (or with incomplete metadata), unresolvable references are collected in `unresolvedTableColumns` rather than dropped.

For a detailed walkthrough of the parsing pipeline, scope model, traversal order, and column-routing logic, see [INTERNALS.md](INTERNALS.md).

---

## Development

The grammar files are in `grammar/` and the generated parser code in `src/generated/official/`.

To download and regenerate the latest grammar files run:
1.  `npm run pull:grammar:official`
2.  `npm run generate:official`

## Testing

```
npm -w @sql-lineage/core run test
```

Test files are in `src/tests/`.

## License

MIT — see the LICENSE file for details.
