// Which package suites a run must run and which reuse their last green run: `scripts/lib/package-scope.mjs`, read against a
// temporary marketplace of three packages and a book beside it — never the real one.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const { dropGreen, fingerprints, importsOf, planRun, restatedOf, suitesLine, writeGreen } = await import(resolve(import.meta.dirname, "../../../../../scripts/lib/package-scope.mjs"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** A workspace folder holding a marketplace (plugin-aa; plugin-bb importing it; plugin-cc restating a book chapter) and a book. */
function fixture() {
  const home = mkdtempSync(join(tmpdir(), "package-scope-"));
  const root = join(home, "market");
  const put = (base, rel, text) => { mkdirSync(dirname(join(base, rel)), { recursive: true }); writeFileSync(join(base, rel), text, "utf8"); };
  put(root, "package.json", "{}\n");
  put(root, "scripts/build.mjs", "// build\n");
  for (const name of ["plugin-aa", "plugin-bb", "plugin-cc"]) {
    put(root, `packages/${name}/tests/run.mjs`, "// runner\n");
    put(root, `packages/${name}/.claude-plugin/plugin.json`, `{ "name": "${name}", "version": "0.1.0" }\n`);
  }
  put(root, "packages/plugin-aa/src/a.ts", "export const a = 1;\n");
  put(root, "packages/plugin-bb/src/b.ts", 'import { a } from "../../plugin-aa/src/a.ts";\n');
  put(root, "packages/plugin-cc/src/refs/c.md", '<!-- spn:restates\n{ "docs": [ { "path": "spn-foundation/docs/ch.md", "seen": "00000000" } ] }\n-->\n# c\n');
  put(home, "spn-foundation/docs/ch.md", "# the chapter\n");
  put(root, ".gitignore", "**/tests/.output/\n");
  const git = (...args) => execFileSync("git", ["-C", root, ...args], { stdio: "ignore", env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" } });
  git("init", "-q"); git("add", "-A"); git("-c", "user.name=c", "-c", "user.email=c@example.invalid", "commit", "-qm", "base");
  const green = () => { const now = fingerprints(root); for (const label of Object.keys(now)) writeGreen(root, label, { fingerprint: now[label], run: "full-1", ranAt: "2026-11-25T10:00:00Z", results: [{ id: "X.Y.1", tier: "UNIT", status: "SUCCESS", title: label }] }); };
  const runs = (options) => planRun(root, options).filter((one) => !one.reuse).map((one) => one.label);
  return { home, root, put: (rel, text) => put(root, rel, text), book: (rel, text) => put(home, rel, text), green, runs };
}

console.log("=== what a package reads");
{
  const f = fixture();
  ok("[MKT.SCRIPTS.664] a package's imports are the other packages its files name", JSON.stringify(importsOf(f.root, "plugin-bb")) === '["plugin-aa"]' && importsOf(f.root, "plugin-aa").length === 0);
  ok("[MKT.SCRIPTS.664] a package's restated chapters are read from its spn:restates stamps", JSON.stringify(restatedOf(f.root, "plugin-cc")) === '["spn-foundation/docs/ch.md"]');
}

console.log("\n=== which suites run");
{
  const f = fixture();
  ok("[MKT.SCRIPTS.664] with no green record, every package runs", f.runs().join() === "plugin-aa,plugin-bb,plugin-cc", f.runs().join());
  f.green();
  ok("[MKT.SCRIPTS.664] with nothing changed since each suite passed, every package reuses its green run", f.runs().length === 0, f.runs().join());
  const reused = planRun(f.root).find((one) => one.label === "plugin-aa");
  ok("[MKT.SCRIPTS.664] a reused package carries the results and the run its record holds", reused.green?.run === "full-1" && reused.green?.results?.length === 1);
  f.put("packages/plugin-aa/.claude-plugin/plugin.json", '{ "name": "plugin-aa", "version": "0.2.0" }\n');
  f.put("packages/plugin-aa/src/dist/a.mjs", "// built\n");
  ok("[MKT.SCRIPTS.664] the release's version field and a rebuilt dist/ change no input", f.runs().length === 0, f.runs().join());
  f.put("packages/plugin-cc/src/c2.ts", "export const c = 2;\n");
  ok("[MKT.SCRIPTS.664] a file changed in a package's folder, untracked too, runs that package alone", f.runs().join() === "plugin-cc", f.runs().join());
  f.green();
  f.put("packages/plugin-aa/src/a.ts", "export const a = 2;\n");
  ok("[MKT.SCRIPTS.664] a change to a package runs every package that imports it", f.runs().join() === "plugin-aa,plugin-bb", f.runs().join());
  f.green();
  f.book("spn-foundation/docs/ch.md", "# the chapter, changed\n");
  ok("[MKT.SCRIPTS.664] a change to a book chapter a package restates runs that package", f.runs().join() === "plugin-cc", f.runs().join());
  f.green();
  f.put("scripts/build.mjs", "// build, changed\n");
  ok("[MKT.SCRIPTS.664] a change to the root scripts, manifest or lockfile runs every package", f.runs().join() === "plugin-aa,plugin-bb,plugin-cc", f.runs().join());
}

console.log("\n=== a red run, and --all");
{
  const f = fixture();
  f.green();
  dropGreen(f.root, "plugin-bb");
  ok("[MKT.SCRIPTS.665] a package whose suite went red has no record, so it runs", f.runs().join() === "plugin-bb", f.runs().join());
  writeGreen(f.root, "plugin-bb", { fingerprint: "another", run: "full-0", ranAt: "2026-11-24T10:00:00Z", results: [] });
  ok("[MKT.SCRIPTS.665] a record taken on other inputs is never reused", f.runs().join() === "plugin-bb", f.runs().join());
  f.green();
  ok("[MKT.SCRIPTS.665] --all runs every package, green records or not", f.runs({ all: true }).length === 3);
}

console.log("\n=== the release names what ran");
{
  ok("[MKT.SCRIPTS.666] the release commit's line names the suites that ran and each reused one with its run",
    suitesLine({ ran: ["plugin-spn-devex"], reused: [{ package: "plugin-spn-infra", from: "N017-full", ranAt: "2026-11-25T10:00:00Z" }] })
      === "Suites ran: plugin-spn-devex. Reused: plugin-spn-infra (from N017-full at 2026-11-25T10:00:00Z).");
  ok("[MKT.SCRIPTS.666] a run that left no summary adds no line", suitesLine(null) === null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — package scope` : `\n  all ${total} passed — package scope`);
process.exit(failed ? 1 : 0);
