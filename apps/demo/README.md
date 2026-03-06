
# Demo App: React + TypeScript + Vite

This demo app showcases and tests SQL lineage extraction features from the `@sql-lineage/lineage` package. Built with React, TypeScript, and Vite, it provides an interactive UI for exploring SQL parsing and lineage results.

## Features
- Interactive SQL editor and lineage visualization
- Hot Module Replacement (HMR) for fast development
- TypeScript and ESLint integration
- Uses official Vite React plugins ([Babel](https://babeljs.io/) or [SWC](https://swc.rs/))

## Setup

Install dependencies from the monorepo root:

```
npm install
```

## Running the Demo

Start the development server:

```
npx turbo dev --filter=@sql-lineage/demo
```
or
```
cd apps/demo
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser to view the app.

## Building

Build the demo app for production:

```
npx turbo build --filter=demo
```
or
```
cd apps/demo
npm run build
```

## Testing

Tests are managed at the package level. For lineage logic, see `@sql-lineage/lineage` tests.

## ESLint & TypeScript

The app uses shared ESLint and TypeScript configs from the monorepo. For production, consider enabling type-aware lint rules and React-specific plugins as described in the monorepo docs.

## Useful Links
- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [@sql-lineage/lineage](../../packages/lineage/README.md)

---

For advanced ESLint configuration, see the monorepo's `eslint-config` package and Vite docs.
