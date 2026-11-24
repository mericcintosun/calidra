// Seed check. Reads lib/data/seed.ts as text, pulls every `slug:` (the site id) and any
// `id:` value, and asserts they are unique and that at least 8 sites exist.
// No writes, no clock, no randomness: running it twice prints the same line.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const text = readFileSync(join(root, "lib", "data", "seed.ts"), "utf8");

const collect = (key) => [...text.matchAll(new RegExp(`\\b${key}:\\s*["']([^"']+)["']`, "g"))].map((m) => m[1]);
const slugs = collect("slug");
const ids = collect("id");

function assertUnique(label, values) {
  const seen = new Set();
  for (const v of values) {
    if (seen.has(v)) {
      console.error(`seed: duplicate ${label} "${v}"`);
      process.exit(1);
    }
    seen.add(v);
  }
}

assertUnique("slug", slugs);
assertUnique("id", ids);

if (slugs.length < 8) {
  console.error(`seed: expected at least 8 sites, found ${slugs.length}`);
  process.exit(1);
}

console.log(`seed: ${slugs.length} sites, ids stable`);
