
# SQL Lineage Monorepo

This monorepo is managed with Turborepo and contains tools for SQL lineage extraction, UI components, linting, and TypeScript configuration. It is organized into apps and packages, all written in TypeScript.

## Monorepo Structure

### Apps
- `demo`: Vite-based demo app for testing and showcasing SQL lineage features

### Packages
- `@sql-lineage/lineage`: TypeScript library for extracting column and table lineage from SQL queries (Trino SQL dialect, ANTLR4-based)
- `@sql-lineage/eslint-config`: Shared ESLint configuration (includes Next.js and Prettier configs)
- `@sql-lineage/typescript-config`: Shared TypeScript configuration files

## Features
- SQL lineage extraction (column/table)
- Trino SQL grammar support (ANTLR4)
- Demo app for interactive testing
- Shared ESLint and TypeScript configs
- Modular, TypeScript-first codebase

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
npx turbo build --filter=@sql-lineage/lineage
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
npm -w @sql-lineage/lineage run test
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
