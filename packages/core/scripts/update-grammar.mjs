#!/usr/bin/env node
/**
 * Downloads the official Trino ANTLR4 grammar pinned to the version declared
 * in "trinoGrammarVersion" inside package.json.
 *
 * To upgrade: bump "trinoGrammarVersion" in package.json, then run:
 *   npm run update:grammar:official
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(await readFile(join(root, "../package.json"), "utf8"));
const version = pkg.trinoGrammarVersion;

if (!version) {
  console.error('Error: "trinoGrammarVersion" is not set in package.json');
  process.exit(1);
}

const url = [
  "https://raw.githubusercontent.com/trinodb/trino",
  version,
  "core/trino-grammar/src/main/antlr4/io/trino/grammar/sql/SqlBase.g4",
].join("/");

const outDir = join(root, "../grammar/trino-official");
const outFile = join(outDir, "SqlBase.g4");

console.log(`Fetching Trino grammar version ${version} \nfrom ${url}...\n`);

const res = await fetch(url);
if (!res.ok) {
  console.error(`Failed: HTTP ${res.status} ${res.statusText}`);
  console.error(`URL: ${url}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, Buffer.from(await res.arrayBuffer()));
console.log(`Saved to ${outFile}`);
