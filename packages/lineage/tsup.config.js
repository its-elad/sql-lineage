import { defineConfig } from "tsup";
import config from "@sql-lineage/tsup-config";

export default defineConfig({
  ...config,
  dts: true,
  entry: ["src/index.ts"],
});
