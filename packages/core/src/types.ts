/** Metadata describing a table available in the query namespace. */
export interface TableMetadata {
  tableName: string;
  tableSchema?: string;
  columns: string[];
}

/** Column reference that could not be resolved to a known table. */
export interface UnresolvedColumnReference {
  table?: string;
  column: string;
}
