import { defineConfig } from "tsup";
import config from "@studybuddy/tsup-config";

export default defineConfig({
  ...config,
  dts: true,
  entry: ["src/index.ts"],
});
