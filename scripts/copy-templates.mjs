#!/usr/bin/env node
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "..", "src", "scaffold", "templates");
const dest = resolve(__dirname, "..", "dist", "scaffold", "templates");

if (!existsSync(src)) {
  console.error(`[copy-templates] source missing: ${src}`);
  process.exit(1);
}
if (existsSync(dest)) rmSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`[copy-templates] copied ${src} → ${dest}`);
