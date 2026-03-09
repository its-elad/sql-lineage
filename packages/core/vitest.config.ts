import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        // NodeNext TypeScript uses .js extensions in imports; tell Vitest to
        // resolve them as .ts files first (then fall back to actual .js).
        alias: {
            ".js": ".ts",
        },
    },
    test: {
        globals: false,
        environment: "node",
    },
});
