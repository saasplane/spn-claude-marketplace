import { PLUGIN } from "../../../../helpers/harness.mjs";
// `behaviours stamp` — writing what a run found into the rows, and nothing else.
//
// The other suites here test CHECKS, which read and give a verdict. This one tests a tool that
// REWRITES documents, so the bar is higher: every case asserts what changed AND that nothing else
// did, because the failure worth fearing is a cell quietly moved in a file nobody was looking at.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { SEAT } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const ENV = { ...process.env, SPN_TELEMETRY: "off" };
const kept = [];
process.on("exit", () => { for (const d of kept) rmSync(d, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const REGISTER = [
  "# Signing in",
  "",
  "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
  "| `IAM.LOGIN.01` | a person | signs in | the home page | POSITIVE | CONTRACT | SUCCESS | 2026-09-19T04:12:08Z |",
  "| `IAM.LOGIN.02` | a person | asks for a code | the home page | POSITIVE | CONTRACT | PLANNED |  |",
  "| `IAM.LOGIN.03` | a person | uses a passkey | the home page | POSITIVE | JOURNEY | SUCCESS | 2026-09-19T04:31:22Z |",
  "| `IAM.LOGIN.04` | a person | checks by hand | a page | POSITIVE | CONTRACT | MANUAL | 2026-09-14T10:00:00Z |",
  "",
].join("\n");

/** A run file's body, in the shape the toolchain's runner writes. */
const runBody = (run, tier, results, ranAt = "2026-09-20T09:00:00Z", phase = null) =>
  JSON.stringify({ run, tier, phase, ranAt, env: "local", results });

/** Where a node's run of one tier writes under a name. */
const runPath = (node, tier, run, phase = null) =>
  `${node}/tests/.output/${tier.toLowerCase()}/runs/${phase === null ? run : `${run}.${phase}`}.json`;

const stand = (results, tier = "CONTRACT", ranAt = "2026-09-20T09:00:00Z", name = "r1") => {
  const root = mkdtempSync(join(tmpdir(), "rows-"));
  kept.push(root);
  const doc = join(root, "docs", SEAT.behaviors, "login.md");
  mkdirSync(dirname(doc), { recursive: true });
  writeFileSync(doc, REGISTER, "utf8");
  const file = join(root, runPath("apps/api", tier, name));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, runBody(name, tier, results, ranAt), "utf8");
  return { root, doc };
};

/** A further run file beside what `stand` wrote. */
const add = (root, path, body) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), body, "utf8");
};

/** One action of `behaviours stamp` through the entry, on the repository it is run from, told to read the run it names. */
const runNamed = (root, name, action, ...args) => {
  try { return execFileSync("node", [TOOL, "behaviours", "stamp", action, name, ...args, "."], { cwd: root, encoding: "utf8", stdio: "pipe", env: ENV }); }
  catch (e) { return `${e.stdout ?? ""}${e.stderr ?? ""}`; }
};
/** The same, reading run `r1`. */
const run = (root, action, ...args) => runNamed(root, "r1", action, ...args);

/** The exit code and everything printed by `behaviours stamp`, typed with exactly these words. */
const runCode = (root, argv) => {
  try { return { out: execFileSync("node", [TOOL, "behaviours", "stamp", ...argv], { cwd: root, encoding: "utf8", stdio: "pipe", env: ENV }), code: 0 }; }
  catch (e) { return { out: `${e.stdout ?? ""}${e.stderr ?? ""}`, code: e.status ?? -1 }; }
};

/** One row's Tier, Status and Updated at, so a case asserts cells rather than substrings. */
const cells = (doc, id) => {
  const line = readFileSync(doc, "utf8").split("\n").find((l) => l.includes(`\`${id}\``));
  const c = line.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
  return { tier: c[5], status: c[6], at: c[7], width: c.length };
};

const PASSED = [{ id: "IAM.LOGIN.01", tier: "CONTRACT", status: "SUCCESS", title: "t", detail: null }];

console.log("=== behaviours stamp — what it writes");

{
  const { root, doc } = stand([{ id: "IAM.LOGIN.01", tier: "CONTRACT", status: "FAILED", title: "t", detail: "x" }]);
  run(root, "write");
  ok("a run's finding reaches the row", cells(doc, "IAM.LOGIN.01").status === "FAILED");
  ok("[MKT.SCRIPTS.75] and stamps the run's own instant and its name", cells(doc, "IAM.LOGIN.01").at === "2026-09-20T09:00:00Z · r1",
     cells(doc, "IAM.LOGIN.01").at);
  ok("a row of another tier is untouched", cells(doc, "IAM.LOGIN.03").at === "2026-09-19T04:31:22Z");
  ok("the row keeps its eight cells", cells(doc, "IAM.LOGIN.01").width === 8);
}

{
  // Two cases citing one id: the row takes the worst, because a behaviour with a failing proof is
  // not proven — and which one wins may not depend on the order they were written in.
  const { root, doc } = stand([
    { id: "IAM.LOGIN.01", tier: "CONTRACT", status: "SUCCESS", title: "a", detail: null },
    { id: "IAM.LOGIN.01", tier: "CONTRACT", status: "FAILED", title: "b", detail: "x" },
  ]);
  run(root, "write");
  ok("two cases on one id take the worst", cells(doc, "IAM.LOGIN.01").status === "FAILED");
}

{
  const { root, doc } = stand([{ id: "IAM.LOGIN.04", tier: "CONTRACT", status: "SUCCESS", title: "t", detail: null }]);
  run(root, "write", "--reach", "repository");
  // The one intent no evidence can recover, so the one value the agent never writes.
  ok("MANUAL is never written over", cells(doc, "IAM.LOGIN.04").status === "MANUAL");
}

{
  // A repository's one root journey run: its file sits at the root, and it speaks for the JOURNEY rows it named.
  const { root, doc } = stand([], "CONTRACT");
  add(root, runPath(".", "JOURNEY", "r1"), runBody("r1", "JOURNEY",
    [{ id: "IAM.LOGIN.03", tier: "JOURNEY", status: "FAILED", title: "t", detail: "x" }], "2026-09-21T09:00:00Z"));
  run(root, "write");
  ok("a root journey run's file stamps the JOURNEY row it named", cells(doc, "IAM.LOGIN.03").status === "FAILED"
    && cells(doc, "IAM.LOGIN.03").at === "2026-09-21T09:00:00Z · r1", JSON.stringify(cells(doc, "IAM.LOGIN.03")));
}

console.log("=== behaviours stamp — what it refuses to assume");

{
  const { root, doc } = stand(PASSED);
  run(root, "write");
  // Silence is not evidence of absence: this artifact is one node's, and the register is the
  // repository's, so a row it did not name may be proven by a node that has not run.
  ok("without a stated reach, an unnamed row is left alone", cells(doc, "IAM.LOGIN.02").status === "PLANNED");
}

{
  const { root, doc } = stand(PASSED);
  run(root, "write", "--reach", "repository");
  ok("with the reach stated, an unnamed row goes back to PLANNED", cells(doc, "IAM.LOGIN.02").status === "PLANNED");
  // The other half of the same sweep: a row the run DID name keeps what the run found, rather than
  // being swept back with the ones nothing cited.
  ok("a row the run named keeps what the run found", cells(doc, "IAM.LOGIN.01").status === "SUCCESS");
  ok("a JOURNEY row survives a CONTRACT run of the whole repository",
     cells(doc, "IAM.LOGIN.03").status === "SUCCESS");
}

{
  const { root, doc } = stand([], "CONTRACT");
  run(root, "write", "--reach", "repository");
  ok("a tier that ran and matched nothing resets its rows", cells(doc, "IAM.LOGIN.01").status === "PLANNED");
  ok("and clears the instant with it", cells(doc, "IAM.LOGIN.01").at === "");
}

console.log("=== behaviours stamp — what it reports");

{
  const { root, doc } = stand([{ id: "IAM.LOGIN.01", tier: "CONTRACT", status: "SUCESS", title: "t", detail: null }]);
  const out = run(root, "check");
  ok("a malformed status is a named finding", out.includes("SUCESS") && out.includes("IAM.LOGIN.01"));
  ok("and nothing is applied from it", cells(doc, "IAM.LOGIN.01").status === "SUCCESS");
}

{
  const { root, doc } = stand([{ id: "IAM.LOGIN.01", tier: "CONTRACT", status: "FAILED", title: "t", detail: "x" }]);
  const out = run(root, "check");
  ok("[MKT.SCRIPTS.160] `check` says what it would change", out.includes("would change") && out.includes("SUCCESS → FAILED"));
  ok("[MKT.SCRIPTS.160] and changes nothing", cells(doc, "IAM.LOGIN.01").status === "SUCCESS");
}

console.log("\n=== behaviours stamp — every width, read by heading");

/** A register of any width, and an artifact beside it. */
const standWith = (lines, artifactsByPath) => {
  const root = mkdtempSync(join(tmpdir(), "rows-"));
  kept.push(root);
  const doc = join(root, "docs", SEAT.behaviors, "wide.md");
  mkdirSync(dirname(doc), { recursive: true });
  writeFileSync(doc, lines.join("\n") + "\n", "utf8");
  for (const [path, body] of Object.entries(artifactsByPath)) {
    const at = join(root, path);
    mkdirSync(dirname(at), { recursive: true });
    writeFileSync(at, JSON.stringify(body), "utf8");
  }
  return { root, doc };
};

/** One row's cells by heading, whatever the table's width. */
const byHeading = (doc, id) => {
  const lines = readFileSync(doc, "utf8").split("\n");
  const header = lines.find((l) => /\|\s*Id\s*\|/.test(l)).trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim().toLowerCase());
  const line = lines.find((l) => l.includes(`| ${id} |`));
  const c = line.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
  return { status: c[header.indexOf("status")], at: c[header.indexOf("updated at")], width: c.length, line: line };
};

const CONTRACT_RUN = (results, ranAt = "2026-09-28T09:00:00Z") =>
  ({ [runPath("apps/api", "CONTRACT", "r1")]: { run: "r1", tier: "CONTRACT", phase: null, ranAt, env: "local", results } });

{
  const nine = [
    "| Id | Who | Does | Sees | Type | Tier | Status | Updated at | Realizes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| IAM.WIDE.01 | a person | signs in | the home page | POSITIVE | CONTRACT | PLANNED | — | account |",
  ];
  const { root, doc } = standWith(nine, CONTRACT_RUN([{ id: "IAM.WIDE.01", tier: "CONTRACT", status: "SUCCESS", title: "t" }]));
  run(root, "write");
  const row = byHeading(doc, "IAM.WIDE.01");
  ok("[MKT.SCRIPTS.48] a nine-cell row is stamped by heading", row.status === "SUCCESS" && row.at === "2026-09-28T09:00:00Z · r1", row.line);
  ok("[MKT.SCRIPTS.48] and keeps its nine cells, the last one as written", row.width === 9 && row.line.endsWith("| account |"));
}

{
  const ten = [
    "| Id | Who | Does | Sees | Where | Type | Tier | Status | Updated at | Names |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| IAM.TEN.01 | a person | signs in | the home page | service-api | POSITIVE | CONTRACT | PLANNED | — | FDN.LOGIN.01 |",
  ];
  const { root, doc } = standWith(ten, CONTRACT_RUN([{ id: "IAM.TEN.01", tier: "CONTRACT", status: "FAILED", title: "t" }]));
  run(root, "write");
  const row = byHeading(doc, "IAM.TEN.01");
  ok("[MKT.SCRIPTS.48] a ten-cell row, with Where before Type, is stamped by heading", row.status === "FAILED" && row.at === "2026-09-28T09:00:00Z · r1", row.line);
  ok("[MKT.SCRIPTS.48] and its Where and Names cells are copied through", row.width === 10 && row.line.includes("| service-api |") && row.line.endsWith("| FDN.LOGIN.01 |"));
}

console.log("\n=== behaviours stamp — the rules a writer keeps");

{
  const { root, doc } = stand([{ id: "IAM.LOGIN.02", tier: "UNIT", status: "SUCCESS", title: "t", detail: null }]);
  run(root, "write");
  ok("[MKT.SCRIPTS.49] a result at another tier is not evidence for the row", cells(doc, "IAM.LOGIN.02").status === "PLANNED");
}

{
  // Two runs of one tier, from two nodes. The newer one did not name the row, so it may not date it.
  const eight = REGISTER.split("\n");
  const { root, doc } = standWith(eight, {
    [runPath("apps/api", "CONTRACT", "r1")]:
      { run: "r1", tier: "CONTRACT", phase: null, env: "local", ranAt: "2026-09-20T08:00:00Z", results: [{ id: "IAM.LOGIN.02", tier: "CONTRACT", status: "SUCCESS", title: "t" }] },
    [runPath("apps/web", "CONTRACT", "r1")]:
      { run: "r1", tier: "CONTRACT", phase: null, env: "local", ranAt: "2026-09-28T08:00:00Z", results: [{ id: "IAM.OTHER.01", tier: "CONTRACT", status: "SUCCESS", title: "t" }] },
  });
  run(root, "write");
  ok("[MKT.SCRIPTS.50] the row is dated by the file that named it, not by a newer file of the run that did not",
     cells(doc, "IAM.LOGIN.02").at === "2026-09-20T08:00:00Z · r1", JSON.stringify(cells(doc, "IAM.LOGIN.02")));
}

{
  const promise = [
    "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| IAM.PROM.01 | a person | signs in | the home page | PROMISE | CONTRACT | PLANNED | — |",
  ];
  const { root, doc } = standWith(promise, CONTRACT_RUN([{ id: "IAM.PROM.01", tier: "CONTRACT", status: "SUCCESS", title: "t" }]));
  run(root, "write", "--reach", "repository");
  ok("[MKT.SCRIPTS.51] a PROMISE row is never stamped", byHeading(doc, "IAM.PROM.01").status === "PLANNED");
}

{
  const { root, doc } = stand([{ id: "IAM.LOGIN.02", tier: "CONTRACT", status: "SUCCESS", title: "t", detail: null }]);
  run(root, "write");
  const first = statSync(doc).mtimeMs;
  const before = readFileSync(doc, "utf8");
  const second = run(root, "write");
  ok("a second stamp from the same run changes no row", second.includes("wrote 0 row(s)") && readFileSync(doc, "utf8") === before);
  ok("and leaves the file's modified time where it was", statSync(doc).mtimeMs === first);
}


console.log("\n=== behaviours stamp — the run is named, and only that run is read");

{
  const { root, doc } = stand(PASSED);
  add(root, runPath("apps/web", "CONTRACT", "r2"), runBody("r2", "CONTRACT", PASSED, "2026-09-22T09:00:00Z"));
  const before = readFileSync(doc, "utf8");
  const { out, code } = runCode(root, ["write", "."]);
  ok("[MKT.SCRIPTS.73] a stamp typed with a path and no run before it is refused with exit 2", code === 2 && readFileSync(doc, "utf8") === before, `exit ${code}\n${out}`);
  ok("[MKT.SCRIPTS.73] and the refusal names the newest runs it found, newest first",
     out.includes("r2") && out.includes("r1") && out.indexOf("r2") < out.indexOf("r1"), out);
}

{
  const { root, doc } = stand(PASSED);
  const before = readFileSync(doc, "utf8");
  const { out, code } = runCode(root, ["write", "nope-1", "."]);
  ok("[MKT.SCRIPTS.73] a run name nothing on disk carries is refused, naming the runs that exist",
     code === 1 && out.includes("nope-1") && out.includes("r1") && readFileSync(doc, "utf8") === before, `exit ${code}\n${out}`);
}

{
  const { root } = stand(PASSED);
  const { out, code } = runCode(root, ["check", "r1", "--results", "x.json", "."]);
  ok("[MKT.SCRIPTS.174] an option the stamp does not take is refused by name with exit 2, never read as the repository", code === 2 && out.includes("does not take `--results`"), `exit ${code}\n${out}`);
}

{
  // Two runs of the same tier on disk: the stamp reads the one it is told to, and never the other.
  const { root, doc } = stand([{ id: "IAM.LOGIN.01", tier: "CONTRACT", status: "FAILED", title: "t", detail: "x" }]);
  add(root, runPath("apps/api", "CONTRACT", "r2"), runBody("r2", "CONTRACT", PASSED, "2026-09-22T09:00:00Z"));
  runNamed(root, "r2", "write");
  ok("[MKT.SCRIPTS.74] a stamp reads only the run it names", cells(doc, "IAM.LOGIN.01").status === "SUCCESS"
    && cells(doc, "IAM.LOGIN.01").at === "2026-09-22T09:00:00Z · r2", JSON.stringify(cells(doc, "IAM.LOGIN.01")));
  runNamed(root, "r1", "write");
  ok("[MKT.SCRIPTS.74] and the other name reads the other run", cells(doc, "IAM.LOGIN.01").status === "FAILED"
    && cells(doc, "IAM.LOGIN.01").at === "2026-09-20T09:00:00Z · r1", JSON.stringify(cells(doc, "IAM.LOGIN.01")));
}

{
  // A phased run writes <run>.<phase>.json; the stamp reads it beside <run>.json.
  const { root, doc } = stand(PASSED);
  add(root, runPath("apps/web", "JOURNEY", "r1", "serialized"), runBody("r1", "JOURNEY",
    [{ id: "IAM.LOGIN.03", tier: "JOURNEY", status: "FAILED", title: "t", detail: "x" }], "2026-09-21T09:00:00Z", "SERIALIZED"));
  runNamed(root, "r1", "write");
  ok("[MKT.SCRIPTS.74] a phase's file of the named run is read beside the run's own",
     cells(doc, "IAM.LOGIN.03").status === "FAILED" && cells(doc, "IAM.LOGIN.03").at === "2026-09-21T09:00:00Z · r1"
       && cells(doc, "IAM.LOGIN.01").at === "2026-09-20T09:00:00Z · r1", JSON.stringify([cells(doc, "IAM.LOGIN.03"), cells(doc, "IAM.LOGIN.01")]));
}

{
  // `r1.x.json` looks like a phase of r1 by its name, but its own run field says it is run r1.x.
  const { root, doc } = stand(PASSED);
  add(root, runPath("apps/web", "JOURNEY", "r1.x"), runBody("r1.x", "JOURNEY",
    [{ id: "IAM.LOGIN.03", tier: "JOURNEY", status: "FAILED", title: "t", detail: "x" }], "2026-09-21T09:00:00Z"));
  runNamed(root, "r1", "write");
  ok("[MKT.SCRIPTS.74] a run whose name only starts with the named one is not read",
     cells(doc, "IAM.LOGIN.03").status === "SUCCESS" && cells(doc, "IAM.LOGIN.03").at === "2026-09-19T04:31:22Z", JSON.stringify(cells(doc, "IAM.LOGIN.03")));
}

{
  const { root, doc } = stand([], "CONTRACT");
  add(root, runPath("apps/api", "CONTRACT", "r2"), runBody("r2", "CONTRACT", PASSED, "2026-09-22T09:00:00Z"));
  runNamed(root, "r2", "write", "--reach", "repository");
  ok("--reach repository reads over the named run alone: what it named keeps its finding",
     cells(doc, "IAM.LOGIN.01").status === "SUCCESS" && cells(doc, "IAM.LOGIN.01").at === "2026-09-22T09:00:00Z · r2", JSON.stringify(cells(doc, "IAM.LOGIN.01")));
}

// ---------------------------------------------------------------- the grammar: an action, a run, a path

const USAGE = "usage: spn-devex behaviours stamp check <run> <path> [--reach repository]\n" +
              "       spn-devex behaviours stamp write <run> <path> [--reach repository]\n";
const FAILING = [{ id: "IAM.LOGIN.01", tier: "CONTRACT", status: "FAILED", title: "t", detail: "x" }];

console.log("\n=== behaviours stamp — the action is a word, and a write needs its run and its path");

{
  const { root, doc } = stand(FAILING);
  const before = readFileSync(doc, "utf8");
  const none = runCode(root, []);
  ok("[MKT.SCRIPTS.111] with no action the entry prints each usage line and says an action is owed",
     none.code === 2 && none.out === USAGE + "`behaviours stamp` needs an action.\n", `exit ${none.code}\n${none.out}`);
  const flag = runCode(root, ["r1", ".", "--write"]);
  ok("[MKT.SCRIPTS.111] a run where the action belongs is refused, and `--write` is named as the action `write`",
     flag.code === 2 && flag.out === USAGE + "`behaviours stamp` needs an action. `--write` is the action `write`.\n", `exit ${flag.code}\n${flag.out}`);
  const bare = runCode(root, ["write"]);
  ok("[MKT.SCRIPTS.112] `write` with no run and no path prints its usage line and says both are owed",
     bare.code === 2 && bare.out === "usage: spn-devex behaviours stamp write <run> <path> [--reach repository]\n`behaviours stamp write` needs a run and a path.\n",
     `exit ${bare.code}\n${bare.out}`);
  const noPath = runCode(root, ["write", "r1"]);
  ok("[MKT.SCRIPTS.112] `write` with a run and no path says a path is owed, and never takes the folder it is run from",
     noPath.code === 2 && noPath.out.endsWith("`behaviours stamp write` needs a path.\n"), `exit ${noPath.code}\n${noPath.out}`);
  const checkNoPath = runCode(root, ["check", "r1"]);
  ok("[MKT.SCRIPTS.112] `check` keeps its path required too", checkNoPath.code === 2 && checkNoPath.out.endsWith("`behaviours stamp check` needs a path.\n"),
     `exit ${checkNoPath.code}\n${checkNoPath.out}`);
  const three = runCode(root, ["write", "r1", ".", "docs"]);
  ok("a second path is refused with exit 2", three.code === 2 && three.out.includes("takes one run and one path."), `exit ${three.code}\n${three.out}`);
  const reach = runCode(root, ["write", "r1", ".", "--reach", "node"]);
  ok("[MKT.SCRIPTS.115] a reach outside the set is refused with the set",
     reach.code === 2 && reach.out.includes("takes `--reach` from repository, and `node` is none of them."), `exit ${reach.code}\n${reach.out}`);
  ok("and no refused run wrote", readFileSync(doc, "utf8") === before);

  const checked = runCode(root, ["check", "r1", "."]);
  ok("[MKT.SCRIPTS.160] `check` exits 1 where a row would change, and names the change",
     checked.code === 1 && checked.out.includes("would change 1 row(s)") && checked.out.includes("SUCCESS → FAILED"), `exit ${checked.code}\n${checked.out}`);
  ok("[MKT.SCRIPTS.160] `check` writes nothing", readFileSync(doc, "utf8") === before);
  // KNOWN-BAD, so the refusals are not the reason nothing was written: the same words with `write` change the row.
  const wrote = runCode(root, ["write", "r1", "."]);
  ok("known-bad: the same run with `write` changes the row, and exits 0",
     wrote.code === 0 && cells(doc, "IAM.LOGIN.01").status === "FAILED", `exit ${wrote.code}\n${wrote.out}`);
  const again = runCode(root, ["check", "r1", "."]);
  ok("[MKT.SCRIPTS.160] after the write a `check` finds no row to change and exits 0", again.code === 0 && again.out.includes("would change 0 row(s)"), `exit ${again.code}\n${again.out}`);
}

console.log("\n=== behaviours stamp — a narrow path stamps the registers under it, and reads the run from the repository");

{
  // A repository with two registers, and one run that found a failure for a row of each.
  const { root, doc } = stand([
    { id: "IAM.LOGIN.01", tier: "CONTRACT", status: "FAILED", title: "t", detail: "x" },
    { id: "PAY.CARD.01", tier: "CONTRACT", status: "FAILED", title: "t", detail: "x" },
  ]);
  writeFileSync(join(root, "sprepo.json"), '{"type":"APPS","config":{"mtype":"APPS","stack":"TS"}}\n', "utf8");
  const other = join(root, "docs", SEAT.behaviors, "pay", "card.md");
  mkdirSync(dirname(other), { recursive: true });
  writeFileSync(other, REGISTER.split("IAM.LOGIN").join("PAY.CARD"), "utf8");
  const before = readFileSync(other, "utf8");

  const folder = join("docs", SEAT.behaviors, "pay");
  const narrow = runCode(root, ["check", "r1", folder]);
  ok("[MKT.SCRIPTS.161] `check` narrowed to a folder reports the rows under it and none beside it",
     narrow.code === 1 && narrow.out.includes("PAY.CARD.01") && !narrow.out.includes("IAM.LOGIN.01"), `exit ${narrow.code}\n${narrow.out}`);
  const whole = runCode(root, ["check", "r1", "."]);
  ok("known-bad: the same `check` of the repository reports both registers", whole.out.includes("PAY.CARD.01") && whole.out.includes("IAM.LOGIN.01"), whole.out);

  const login = readFileSync(doc, "utf8");
  const wrote = runCode(join(root, "docs"), ["write", "r1", join(SEAT.behaviors, "pay", "card.md")]);
  ok("[MKT.SCRIPTS.161] `write` handed one register, from a folder inside the repository, stamps that register",
     wrote.code === 0 && cells(other, "PAY.CARD.01").status === "FAILED" && cells(other, "PAY.CARD.01").at === "2026-09-20T09:00:00Z · r1", `exit ${wrote.code}\n${wrote.out}`);
  ok("[MKT.SCRIPTS.161] and the register beside it keeps every byte", readFileSync(doc, "utf8") === login && readFileSync(other, "utf8") !== before);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — behaviours stamp` : `\n  all ${total} passed — behaviours stamp`);
process.exit(failed ? 1 : 0);
