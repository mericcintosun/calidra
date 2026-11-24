// npm run proof: runs the live engine proof and the test suite, then rewrites the two PROOF
// blocks in README.md with what actually happened. It never throws, never invents a number,
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

async function liveWeatherProof() {
  const r = await run("npx", ["--no-install", "tsx", "scripts/proof-engine.ts"]);
  if (r.spawnError) return { line: "Not run in this build: the engine script could not start (is tsx installed?).", summary: "live-weather: engine script did not start" };
  if (r.timedOut) return { line: "Not run in this build: the engine script did not finish within 90 seconds.", summary: "live-weather: timed out" };
  const jsonLine = r.stdout
    .split(/\r?\n/)
    .reverse()
    .find((l) => l.startsWith("PROOF_JSON "));
  if (!jsonLine) return { line: "Not run in this build: the engine script printed no result.", summary: "live-weather: no result line" };
  let out;
  try {
    out = JSON.parse(jsonLine.slice("PROOF_JSON ".length));
  } catch {
    return { line: "Not run in this build: the engine script printed an unreadable result.", summary: "live-weather: unreadable result" };
  }
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
  for (const file of report.testResults ?? []) {
    for (const a of file.assertionResults ?? []) {
      if (a.status === "failed") failedNames.push(a.fullName ?? a.title ?? "unnamed test");
    }
  }
  let line = `Ran on ${today()} with Vitest: ${passed} passed, ${failed} failed, ${skipped} skipped.`;
  if (failedNames.length > 0) line += ` Failing: ${failedNames.slice(0, 5).join("; ")}.`;
  return { line, summary: `tests: passed=${passed} failed=${failed} skipped=${skipped}` };
}

function replaceBlock(text, name, line) {
  const begin = `<!-- PROOF:BEGIN ${name} -->`;
  const end = `<!-- PROOF:END ${name} -->`;
  const i = text.indexOf(begin);
  const j = i >= 0 ? text.indexOf(end, i) : -1;
  if (i < 0 || j < 0) return text;
  return `${text.slice(0, i + begin.length)}\n${line}\n${text.slice(j)}`;
}

async function writeReadme(live, tests) {
  try {
    const before = await readFile(README, "utf8");
    const after = replaceBlock(replaceBlock(before, "live-weather", live.line), "tests", tests.line);
    if (after !== before) await writeFile(README, after, "utf8");
  } catch (e) {
    console.log(`proof: README.md not updated (${e && e.message ? e.message : e})`);
  }
}

async function main() {
  const hardStop = setTimeout(async () => {
    await writeReadme(
      { line: "Not run in this build: the proof did not finish within two minutes." },
      { line: "Not run in this build: the proof did not finish within two minutes." }
    );
    console.log("proof: stopped after 110 s");
    process.exit(0);
  }, HARD_STOP_MS);
  hardStop.unref();

  let live = { line: NOT_RUN_LIVE_OFFLINE, summary: "live-weather: not run" };
  let tests = { line: "Not run in this build: the test runner could not start.", summary: "tests: not run" };
  try {
    [live, tests] = await Promise.all([liveWeatherProof(), testsProof()]);
  } catch (e) {
    console.log(`proof: unexpected error (${e && e.message ? e.message : e})`);
  }
  await writeReadme(live, tests);
  console.log(live.summary);
  console.log(tests.summary);
  clearTimeout(hardStop);
  process.exit(0);
}

main().catch(() => process.exit(0));
