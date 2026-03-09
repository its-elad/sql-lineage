
# SQL Lineage Monorepo

This monorepo is managed with Turborepo and contains tools for SQL lineage extraction, UI components, linting, and TypeScript configuration. It is organized into apps and packages, all written in TypeScript.

## Monorepo Structure

### Apps

| App | Description |
|---|---|
| [`@sql-lineage/demo`](apps/demo) | Vite-based demo app for testing and showcasing SQL lineage features |

### Packages

| Package | Description |
|---|---|
| [`@sql-lineage/core`](packages/lineage/README.md) | TypeScript library for extracting column and table lineage from Trino SQL queries (ANTLR4-based) — see [package README](packages/lineage/README.md) |
| [`@sql-lineage/eslint-config`](packages/eslint-config) | Shared ESLint configuration (includes Next.js and Prettier configs) |
| [`@sql-lineage/typescript-config`](packages/typescript-config) | Shared TypeScript configuration files |

## What the lineage library does

`@sql-lineage/core` statically analyses a Trino SQL statement and answers two questions:

- **Which physical tables does this query read from?** (`getUpstreamTables`) — returns a sorted, de-duplicated list of real table names, excluding CTEs and derived tables.
- **Which columns from each table are actually used?** (`getColumnLineage`) — tracks every column reference across the full query (SELECT, WHERE, JOIN, GROUP BY, HAVING, ORDER BY, window functions) and maps each one back to its source table.

See the [full API and logic documentation](packages/lineage/README.md) for details.

## Quick Start

Clone the repo and install dependencies:

```
git clone <repo-url>
cd sql-lineage
npm install
```

## Build

To build all apps and packages:

```
npx turbo build
```

To build a specific package/app:

```
npx turbo build --filter=@sql-lineage/core
npx turbo build --filter=demo
```

## Develop

To start development mode for all apps/packages:

```
npx turbo dev
```

To develop a specific app:

```
npx turbo dev --filter=demo
```

## Test

To run tests for the lineage package:

```
npm -w @sql-lineage/core run test
```

## Remote Caching

Turborepo supports [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) via Vercel. To enable, authenticate and link your repo:

```
npx turbo login
npx turbo link
```

## Useful Links

- [Turborepo Docs](https://turborepo.dev/docs)
- [Vite](https://vitejs.dev/)
- [ANTLR4](https://www.antlr.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io)

---

For package-specific details, see individual README files in each package/app.
