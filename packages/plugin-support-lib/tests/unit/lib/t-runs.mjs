// The run file reader in `../../../src/lib/runs.ts`: a reader is told which run to read, and reads
// `<run>.json` and every `<run>.<phase>.json` of that run in every node, and nothing else.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..");
const { cited, namedRun, runNames, stampOf } = await import(pathToFileURL(resolve(HERE, "src", "lib", "runs.ts")).href);

const kept = [];
process.on("exit", () => { for (const dir of kept) rmSync(dir, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const repo = (files) => {
  const root = mkdtempSync(join(tmpdir(), "runs-"));
  kept.push(root);
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), typeof body === "string" ? body : JSON.stringify(body), "utf8");
  }
  return root;
};
const body = (run, tier, ranAt, phase = null) =>
  ({ run, tier, phase, ranAt, env: "local", results: [{ id: "IAM.LOGIN.01", tier, status: "SUCCESS", title: "t", detail: null }] });

const root = repo({
  "apps/api/tests/.output/unit/runs/full-1.json": body("full-1", "UNIT", "2026-10-01T01:00:00Z"),
  "apps/web/tests/.output/journey/runs/full-1.serialized.json": body("full-1", "JOURNEY", "2026-10-01T01:10:00Z", "SERIALIZED"),
  "tests/.output/journey/runs/full-1.json": body("full-1", "JOURNEY", "2026-10-01T01:05:00Z", "SWEEP"),
  "apps/api/tests/.output/unit/runs/full-1.x.json": body("full-1.x", "UNIT", "2026-10-01T02:00:00Z"),
  "apps/api/tests/.output/unit/runs/p2.json": body("p2", "UNIT", "2026-10-01T03:00:00Z"),
  "apps/api/tests/.output/unit/runs/broken.json": "{ not json",
  "apps/api/tests/.output/unit/runs/full-1.runner.json": "{ a raw report still being folded",
});

console.log("=== one named run");

const full = namedRun(root, "full-1");
ok("a named run is every file of that name, its phases and every node included",
  JSON.stringify(full.runs.map((one) => one.from).sort()) === JSON.stringify([
    "apps/api/tests/.output/unit/runs/full-1.json",
    "apps/web/tests/.output/journey/runs/full-1.serialized.json",
    "tests/.output/journey/runs/full-1.json",
  ]), JSON.stringify(full.runs.map((one) => one.from)));
ok("a runner's raw report beside the run is never read as one of its files", full.findings.length === 0, JSON.stringify(full.findings));
ok("a run whose name only starts with the named one is left out", !full.runs.some((one) => one.run === "full-1.x"));
ok("each file carries its node, tier and phase", full.runs.every((one) => one.run === "full-1")
  && full.runs.find((one) => one.node === "apps/web")?.phase === "SERIALIZED" && full.runs.find((one) => one.node === ".")?.tier === "JOURNEY",
  JSON.stringify(full.runs.map((one) => [one.node, one.tier, one.phase])));
ok("a malformed file of the named run is a named finding", JSON.stringify(namedRun(root, "broken").findings).includes("not parseable"),
  JSON.stringify(namedRun(root, "broken")));
ok("a name nothing carries reads nothing", namedRun(root, "nope").runs.length === 0 && namedRun(root, "nope").findings.length === 0);

console.log("=== the runs on disk, and what a row cites");

ok("the runs on disk are listed newest first, each once",
  JSON.stringify(runNames(root).map((one) => one.run)) === '["p2","full-1.x","full-1"]', JSON.stringify(runNames(root)));
ok("[MKT.SCRIPTS.75] the stamp writes the instant, then ` · `, then the run's name", stampOf("2026-09-30T18:54:19Z", "full-1001") === "2026-09-30T18:54:19Z · full-1001");
ok("a row's Updated at is read back as its instant and the run it cites",
  JSON.stringify(cited("2026-09-30T18:54:19Z · full-1001")) === '{"at":"2026-09-30T18:54:19Z","run":"full-1001"}', JSON.stringify(cited("2026-09-30T18:54:19Z · full-1001")));
ok("an instant alone cites no run", JSON.stringify(cited("2026-09-30T18:54:19Z")) === '{"at":"2026-09-30T18:54:19Z","run":null}');
ok("a dash cites nothing", cited("—") === null && cited("") === null);

console.log(failed ? `\n  ${failed} of ${total} FAILED — runs` : `\n  all ${total} passed — runs`);
process.exit(failed ? 1 : 0);
