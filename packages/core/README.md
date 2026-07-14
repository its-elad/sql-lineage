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

### `getColumnLevelLineage(sql, metadata, options?)`

An **OpenLineage-compatible** column-level lineage analyzer that produces a structured `inputs` / `outputs` result with per-column attribution *and* dataset-level dependency tracking.

```typescript
import { getColumnLevelLineage } from '@sql-lineage/core';

const metadata = [
  { tableName: 'users',  columns: ['id', 'name', 'email', 'status'] },
  { tableName: 'orders', columns: ['id', 'user_id', 'amount', 'created_at'] },
];

getColumnLevelLineage(`
  SELECT u.name, o.amount
  FROM users u
  JOIN orders o ON u.id = o.user_id
  WHERE u.status = 'active'
`, metadata, { defaultNamespace: 'trino://prod' });
// →
// {
//   inputs: [
//     { namespace: "trino://prod", name: "orders" },
//     { namespace: "trino://prod", name: "users" },
//   ],
//   outputs: [{
//     namespace: "trino://prod",
//     name: "__query_result__",
//     facets: {
//       columnLineage: {
//         fields: {
//           name:   { inputFields: [{ namespace: "trino://prod", name: "users", field: "name" }] },
//           amount: { inputFields: [{ namespace: "trino://prod", name: "orders", field: "amount" }] },
//         },
//         dataset: [
//           { namespace: "trino://prod", name: "users", field: "id" },
//           { namespace: "trino://prod", name: "orders", field: "user_id" },
//           { namespace: "trino://prod", name: "users", field: "status" },
//         ]
//       }
//     }
//   }]
// }
```

#### Options

```typescript
interface ColumnLevelLineageOptions {
  /** Namespace for all datasets (e.g. "trino://prod"). Defaults to "". */
  defaultNamespace?: string;
  /** Name for the output dataset. Defaults to "__query_result__". */
  outputName?: string;
  /** Namespace for the output dataset. Falls back to defaultNamespace. */
  outputNamespace?: string;
}
```

#### Result shape

```typescript
interface ColumnLevelLineageResult {
  inputs: DatasetRef[];                              // All upstream datasets, sorted by namespace then name
  outputs: DatasetWithFacets[];                      // Always exactly one entry (the output dataset)
  unresolvedTableColumns: UnresolvedColumnReference[];  // Columns that could not be resolved
}

interface UnresolvedColumnReference {
  table?: string;  // Set when table was identified but column couldn't be confirmed
  column: string;  // The unresolved column name
}

interface DatasetRef {
  namespace: string;
  name: string;
}

interface DatasetWithFacets extends DatasetRef {
  facets?: {
    columnLineage?: {
      fields: Record<string, { inputFields: InputField[] }>;  // per-output-column lineage
      dataset: InputField[];                                   // dataset-level dependencies
    }
  };
}

interface InputField {
  namespace: string;
  name: string;   // source dataset name (e.g. "schema.table")
  field: string;  // source column name
}
```

#### What goes into `fields` (per-column lineage)

Each output column in the SELECT list maps to the **source input fields** it was computed from. The engine traces through:

- Direct column references (`u.name` → `users.name`)
- Expressions — all column references inside an expression are collected (e.g. `a.x + b.y` → both `a.x` and `b.y`)
- CTE / subquery transparency — if a column passes through a CTE or derived table, it is traced back to the underlying physical table
- `SELECT *` / `table.*` — expanded using metadata, each expanded column gets its own entry
- Set operations (`UNION` / `INTERSECT` / `EXCEPT`) — output columns merge the inputs from both sides at the same ordinal position

#### What goes into `dataset` (dataset-level dependencies)

Column references in clauses that **filter, sort, or constrain the entire result set** but are not attributable to a single output column:

- `WHERE` conditions
- `JOIN ON` expressions
- `JOIN USING` columns (attributed to all tables that own the column)
- `GROUP BY` expressions
- `HAVING` conditions
- `ORDER BY` expressions
- Window function definitions (`OVER (PARTITION BY … ORDER BY …)`)
- Inherited dataset-level dependencies from CTEs / derived tables referenced in the FROM clause

#### What goes into `inputs`

Every distinct physical dataset (real table or unknown table) referenced anywhere in the query. CTEs and derived tables are **not** listed — they are transparent.

Inputs are sorted by namespace, then by name.

#### What is dropped / ignored

| Scenario | Behavior |
|----------|----------|
| **Ambiguous bare column** (exists in multiple tables at same scope) | Recorded in `unresolvedColumns`; `inputFields` will be empty for that column |
| **Bare column not found in any table** | Recorded in `unresolvedColumns` |
| **CTE / derived table columns** | Transparent — traced through to the underlying physical table |
| **Literal expressions** (e.g. `SELECT 1 AS one`) | No inputFields (empty array) — no source column to attribute |
| **Function calls with no column args** (e.g. `NOW()`) | No inputFields |
| **LIMIT / OFFSET / FETCH** | Not tracked (they don't reference columns) |
| **Table aliases** | Used for resolution only — the physical table name appears in output |

#### What happens when a table is NOT in metadata

The table is still registered and appears in `inputs` with `kind: "unknown"`. Consequences:

- `SELECT *` from it produces a single entry with `field: "*"` (cannot expand)
- **Pragmatic attribution**: if there is exactly one completely-unknown table (no columns in metadata) in scope and a bare column cannot be resolved to any known table, it is attributed to that unknown table
- Qualified references (`unknown_table.col`) produce an `InputField` with the referenced column name as-is

#### Schema name handling

Metadata entries with `tableSchema` are registered under **two lookup keys**:

- Bare name: `"test"` → found
- Schema-qualified: `"public.test"` → found

Both `FROM test` and `FROM public.test` resolve to the same metadata entry. The output `name` in `InputField` will include the schema: `"public.test"`.

When two tables share the same bare name from different schemas (e.g. `schema1.customers` and `schema2.customers`):
- The bare name is **poisoned** — `SELECT customers.id` will not resolve
- Fully-qualified references still work: `SELECT schema1.customers.id`
- Aliases disambiguate: `FROM schema1.customers c1`

#### Column name deduplication

Output column names are deduplicated: if the SELECT list would produce two columns named `id`, the second becomes `id_1`, then `id_2`, etc. If no alias is given and no name can be inferred, synthetic names `_col0`, `_col1`, … are used.

Input fields within each output column are deduplicated by `(namespace, name, field)` tuple.

---

### Differences between `getColumnLineage` and `getColumnLevelLineage`

| Aspect | `getColumnLineage` | `getColumnLevelLineage` |
|--------|-------------------|------------------------|
| **Output shape** | Flat `{ tableColumns, unresolvedTableColumns }` | OpenLineage `{ inputs, outputs }` with facets |
| **Granularity** | "Which columns of table X are used anywhere?" | "Output column Y was computed from input fields A, B, C" |
| **Per-column attribution** | No — all columns are grouped by source table | Yes — each output column has its own `inputFields` list |
| **Dataset-level tracking** | No distinction — all references go into the same bucket | Yes — WHERE/JOIN/GROUP BY go into a separate `dataset` array |
| **Namespace support** | None | Full OpenLineage namespace model |
| **Unknown tables** | Reported in `unresolvedTableColumns` | Still appear in `inputs` and `inputFields` |
| **Unresolved columns** | Collected in `unresolvedTableColumns` | Collected in `unresolvedColumns` |
| **CTE/derived handling** | Transparent (dropped from output) | Transparent (traced through to physical tables, dataset deps inherited) |
| **Architecture** | ANTLR visitor pattern (`SqlBaseVisitor`) | Manual recursive tree walker (no visitor base class) |
| **Subquery column origins** | Inferred for scope resolution but not tracked in output | Fully tracked — subquery/CTE column origins flow through to the outer query |

In short: `getColumnLineage` answers **"which source columns does this query touch?"** while `getColumnLevelLineage` answers **"for each output column, where did its data come from, and what additional columns constrain the result?"**

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
