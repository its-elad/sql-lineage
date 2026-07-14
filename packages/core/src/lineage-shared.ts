import { normalizeId, NormalizedIdBrand } from "./utils.js";
import { TableMetadata } from "./types.js";

// ════════════════════════════════════════════════════════════════
// Internal Shared Types
// ════════════════════════════════════════════════════════════════

/**
 * Discriminates the origin of a table source visible within a query scope.
 *
 * - `'real'`    — a physical table or view present in the metadata.
 * - `'cte'`     — a WITH-clause definition (runtime-computed, no storage).
 * - `'derived'` — an inline subquery, LATERAL, UNNEST, TABLE(), JSON_TABLE,
 *                 or MATCH_RECOGNIZE output in the FROM clause.
 * - `'unknown'` — a table referenced in the query but absent from the metadata.
 */
export type ScopeTableKind = "real" | "cte" | "derived" | "unknown";

// ════════════════════════════════════════════════════════════════
// Internal Shared Helpers
// ════════════════════════════════════════════════════════════════

/**
 * Builds a case-insensitive lookup map from table metadata.
 * Keys: `"tablename"` and (if schema provided) `"schema.tablename"`.
 */
export function buildMetadataLookup(metadata: TableMetadata[]): Map<NormalizedIdBrand, TableMetadata> {
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
