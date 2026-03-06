# @sql-lineage/lineage

A TypeScript library for extracting column and table lineage from SQL queries. Built with ANTLR4 grammar for Trino SQL, it enables static analysis of SQL to determine data flow and dependencies.

## Features
- Parse SQL queries and extract column lineage
- Identify upstream tables and columns
- Support for Trino SQL dialect (via official grammar)
- Utilities for lineage graph construction
- TypeScript API for integration in Node.js and browser environments

## Installation

Install via npm:

```
npm install @sql-lineage/lineage
```

## Usage

Import the library and use the main API:

```typescript
import { extractColumnLineage, extractUpstreamTables } from '@sql-lineage/lineage';

const sql = `SELECT a, b FROM my_table`;
const lineage = extractColumnLineage(sql);
const tables = extractUpstreamTables(sql);

console.log(lineage);
console.log(tables);
```

## Development

This package uses ANTLR4 grammar for parsing SQL. The grammar files are located in `grammar/` and generated parser code in `src/generated/official/`.

To regenerate parser code after grammar changes:

1. Install ANTLR4 (Java required)
2. Run the ANTLR generation script (see project docs)

## Testing

Run tests with:

```
npm -w @sql-lineage/lineage run test
```

Test files are located in `src/tests/`.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
