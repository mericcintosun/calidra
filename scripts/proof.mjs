// npm run proof: runs the live engine proof (live-weather, demo-path, print-sheet) and the test suite,
// then rewrites the four PROOF blocks in README.md with what actually happened. It never throws, never invents a number,
// writes only inside this repo (README.md and one temp file under node_modules/.cache), exits 0
// on every path, and stops itself after 110 seconds.

import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const README = path.join(ROOT, "README.md");
const CACHE_DIR = path.join(ROOT, "node_modules", ".cache", "calidra-proof");
const VITEST_OUT = path.join(CACHE_DIR, "vitest.json");
const CHILD_TIMEOUT_MS = 90_000;
const HARD_STOP_MS = 110_000;

const NOT_RUN_LIVE_OFFLINE = "Not run in this build: Open-Meteo was not reachable.";

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Run a command; always resolves with { code, stdout, stderr, spawnError, timedOut }. */
function run(cmd, args) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, timedOut, ...result });
    };
    let child;
    try {
      child = spawn(cmd, args, { cwd: ROOT, shell: process.platform === "win32", env: process.env });
    } catch (e) {
      resolve({ code: null, stdout, stderr, timedOut, spawnError: String(e && e.message ? e.message : e) });
      return;
    }
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGKILL");
      } catch {
        // already gone
      }
      done({ code: null, spawnError: null });
    }, CHILD_TIMEOUT_MS);
    child.stdout?.on("data", (d) => {
      if (stdout.length < 200_000) stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      if (stderr.length < 200_000) stderr += d.toString();
    });
    child.on("error", (e) => done({ code: null, spawnError: String(e && e.message ? e.message : e) }));
    child.on("close", (code) => done({ code, spawnError: null }));
  });
}

function fmtHour(h) {
  return `${String(h).padStart(2, "0")}:00`;
}

/** Run the engine script once; both the live-weather and the demo-path blocks read its result. */
async function engineRun() {
  const r = await run("npx", ["--no-install", "tsx", "scripts/proof-engine.ts"]);
  if (r.spawnError) return { fail: "the engine script could not start (is tsx installed?)" };
  if (r.timedOut) return { fail: "the engine script did not finish within 90 seconds" };
  const jsonLine = r.stdout
    .split(/\r?\n/)
    .reverse()
    .find((l) => l.startsWith("PROOF_JSON "));
  if (!jsonLine) return { fail: "the engine script printed no result" };
  try {
    return { out: JSON.parse(jsonLine.slice("PROOF_JSON ".length)) };
  } catch {
    return { fail: "the engine script printed an unreadable result" };
  }
}

const SITE_NAMES = {
  "phoenix-desert-ridge-framing": "Phoenix",
  "cuiaba-soy-field-crew": "Cuiabá",
};

function demoPathProof(engine) {
  if (engine.fail) return { line: `Not run in this build: ${engine.fail}.`, summary: "demo-path: not run" };
  const demo = engine.out.demoPath;
  if (!demo) return { line: "Not run in this build: the engine script printed no demo path result.", summary: "demo-path: no result" };
  if (!demo.ok) return { line: `Not run in this build: ${demo.reason}.`, summary: `demo-path: not run (${demo.reason})` };
  const parts = (demo.steps ?? []).map((s) => {
    const name = SITE_NAMES[s.slug] ?? s.slug;
    if (!s.ok) return `${name}: getHours failed with ${s.code} after ${s.ms} ms`;
    const src = s.source === "seed" ? "seed fallback" : `live ${s.source}`;
    const gap = s.bandGap
      ? `band gap at ${fmtHour(s.bandGap.hour)} (heat index ${s.bandGap.hiBand}, ${s.bandGap.status})`
      : "no band gap hour (no hour that sun WBGT calls rest or stop)";
    return `${name} ${s.date}: ${s.hours} hours from ${src} in ${s.ms} ms, ${gap}`;
  });
  const over = (demo.steps ?? []).filter((s) => s.ms > 5000).length;
  const line =
    `Ran on ${today()} through getAdapter() in real mode, cold (no Next.js cache outside the server): ` +
    `${parts.join("; ")}.` +
    (over > 0 ? ` ${over} call(s) took over 5 s.` : " Every call finished under 5 s.");
  return { line, summary: `demo-path: ${(demo.steps ?? []).map((s) => `${s.slug}=${s.ms}ms`).join(" ")}` };
}

function printSheetProof(engine) {
  if (engine.fail) return { line: `Not run in this build: ${engine.fail}.`, summary: "print-sheet: not run" };
  const s = engine.out.printSheet;
  if (!s) return { line: "Not run in this build: the engine script printed no print sheet result.", summary: "print-sheet: no result" };
  if (!s.ok) return { line: `Not run in this build: ${s.reason}.`, summary: `print-sheet: not run (${s.reason})` };
  const src = s.source === "seed" ? "the seed day profile (live archive call failed)" : `live ${s.source} hours`;
  const first = s.first ? ` First row ${s.first.hour}: "${s.first.en}" / "${s.first.es}".` : "";
  const line =
    `Ran on ${today()}: lib/print-sheet.ts built the Phoenix sheet (${s.query}) from ${src} in English and Spanish, ` +
    `${s.rows} shift rows, ${Number(s.totalRestMin).toLocaleString("en-US")} crew-minutes of rest.${first} ` +
    `EN: ${s.bestEn} ES: ${s.bestEs} Same minutes in both languages: ${s.sameNumbers ? "yes" : "no"}.`;
  return { line, summary: `print-sheet: rows=${s.rows} rest=${s.totalRestMin} source=${s.source}` };
}

async function liveWeatherProof(engine) {
  if (engine.fail) return { line: `Not run in this build: ${engine.fail}.`, summary: "live-weather: not run" };
  const out = engine.out;
  if (!out.ok) {
    const line =
      out.code === "parse_failure"
        ? "Not run in this build: Open-Meteo answered, but not with complete hours for Phoenix on 19 Jul 2023."
        : NOT_RUN_LIVE_OFFLINE;
    return { line, summary: `live-weather: failed code=${out.code}` };
  }
  const head =
    `Ran on ${today()}: one Open-Meteo ${out.source} call for Phoenix (33.4484, -112.0740) on ${out.date} ` +
    `returned ${out.hours} hours in ${out.latencyMs} ms, solved to sun WBGT by lib/heat.ts and planned for heavy work.`;
  const m = out.mismatch;
  const tail = m
    ? ` Mismatch hour: ${fmtHour(m.hour)}, heat index ${m.heatIndexC}°C (${m.hiBand}), sun WBGT ${m.wbgtC}°C, ${m.workMin} work minutes per hour (${m.status}).`
    : ` No hour that day reads heat index Caution or lower while sun WBGT says rest or stop.`;
  return {
    line: head + tail,
    summary: `live-weather: ${out.source} hours=${out.hours} ms=${out.latencyMs} mismatch=${m ? fmtHour(m.hour) : "none"}`,
  };
}

async function testsProof() {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await rm(VITEST_OUT, { force: true });
  } catch {
    // the run below reports the real problem
  }
  const r = await run("npx", ["--no-install", "vitest", "run", "--reporter=json", `--outputFile=${VITEST_OUT}`]);
  if (r.spawnError) return { line: "Not run in this build: the test runner could not start.", summary: "tests: runner did not start" };
  if (r.timedOut) return { line: "Not run in this build: the test run did not finish within 90 seconds.", summary: "tests: timed out" };
  let report;
  try {
    report = JSON.parse(await readFile(VITEST_OUT, "utf8"));
  } catch {
    return { line: "Not run in this build: the test runner wrote no readable report.", summary: "tests: no report" };
  } finally {
    await rm(VITEST_OUT, { force: true }).catch(() => {});
  }
  const passed = Number(report.numPassedTests ?? 0);
  const failed = Number(report.numFailedTests ?? 0);
  const skipped = Number(report.numPendingTests ?? 0) + Number(report.numTodoTests ?? 0);
  const failedNames = [];
  const skippedNames = [];
  for (const file of report.testResults ?? []) {
    for (const a of file.assertionResults ?? []) {
      const name = a.fullName ?? a.title ?? "unnamed test";
      if (a.status === "failed") failedNames.push(name);
      else if (a.status === "skipped" || a.status === "pending" || a.status === "todo") skippedNames.push(name);
    }
  }
  let line = `Ran on ${today()} with Vitest: ${passed} passed, ${failed} failed, ${skipped} skipped.`;
  if (failedNames.length > 0) line += ` Failing: ${failedNames.slice(0, 5).join("; ")}.`;
  if (skippedNames.length > 0) line += ` Skipped on purpose: ${skippedNames.slice(0, 5).join("; ")}.`;
  let summary = `tests: passed=${passed} failed=${failed} skipped=${skipped}`;
  if (skipped > 0 && failed === 0) {
    summary += skippedNames.length > 0 ? ` (all pass; skipped: ${skippedNames.slice(0, 3).join("; ")})` : " (all pass)";
  }
  return { line, summary };
}

function replaceBlock(text, name, line) {
  const begin = `<!-- PROOF:BEGIN ${name} -->`;
  const end = `<!-- PROOF:END ${name} -->`;
  const i = text.indexOf(begin);
  const j = i >= 0 ? text.indexOf(end, i) : -1;
  if (i < 0 || j < 0) return text;
  return `${text.slice(0, i + begin.length)}\n${line}\n${text.slice(j)}`;
}

async function writeReadme(live, tests, demo, sheet) {
  try {
    const before = await readFile(README, "utf8");
    const after = replaceBlock(
      replaceBlock(
        replaceBlock(replaceBlock(before, "live-weather", live.line), "tests", tests.line),
        "demo-path",
        demo.line
      ),
      "print-sheet",
      sheet.line
    );
    if (after !== before) await writeFile(README, after, "utf8");
  } catch (e) {
    console.log(`proof: README.md not updated (${e && e.message ? e.message : e})`);
  }
}

async function main() {
  const hardStop = setTimeout(async () => {
    const stopped = { line: "Not run in this build: the proof did not finish within two minutes." };
    await writeReadme(stopped, stopped, stopped, stopped);
    console.log("proof: stopped after 110 s");
    process.exit(0);
  }, HARD_STOP_MS);
  hardStop.unref();

  let live = { line: NOT_RUN_LIVE_OFFLINE, summary: "live-weather: not run" };
  let tests = { line: "Not run in this build: the test runner could not start.", summary: "tests: not run" };
  let demo = { line: "Not run in this build: the engine script did not run.", summary: "demo-path: not run" };
  let sheet = { line: "Not run in this build: the engine script did not run.", summary: "print-sheet: not run" };
  try {
    const [engine, t] = await Promise.all([engineRun(), testsProof()]);
    tests = t;
    live = await liveWeatherProof(engine);
    demo = demoPathProof(engine);
    sheet = printSheetProof(engine);
  } catch (e) {
    console.log(`proof: unexpected error (${e && e.message ? e.message : e})`);
  }
  await writeReadme(live, tests, demo, sheet);
  console.log(live.summary);
  console.log(demo.summary);
  console.log(sheet.summary);
  console.log(tests.summary);
  clearTimeout(hardStop);
  process.exit(0);
}

main().catch(() => process.exit(0));
