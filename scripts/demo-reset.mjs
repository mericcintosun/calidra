// npm run demo:reset: puts the demo back at its start state.
// 1. Runs the seed check (scripts/seed.mjs) and stops with its exit code if it fails.
// 2. Prints the reset URL. The only mutable demo state is the list of sites saved on /new,
//    which lives in the visitor's browser (localStorage, lib/site-store.ts). Opening the URL
//    runs components/demo-reset.tsx, which clears that list and reloads the collection.
// There is no server store and no chain fixture, so nothing else needs resetting.
// No filesystem writes, no clock, no randomness: running it twice prints the same lines.

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const seed = spawnSync(process.execPath, [join(root, "scripts", "seed.mjs")], { cwd: root, stdio: "inherit" });
if (seed.error || seed.status !== 0) {
  console.error("demo:reset: the seed check failed, so the demo start state is not guaranteed.");
  process.exit(seed.status && seed.status !== 0 ? seed.status : 1);
}

console.log("demo:reset: seed check passed (10 seed sites keep every demo route non-empty).");
console.log("demo:reset: open this URL in the demo browser to clear sites saved on /new:");
console.log("  /?demo-reset=1   (for example https://calidra.vercel.app/?demo-reset=1 or http://localhost:3000/?demo-reset=1)");
console.log("demo:reset: demo start route: /");
