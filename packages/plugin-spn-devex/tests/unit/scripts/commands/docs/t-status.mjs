import { PLUGIN } from "../../../../helpers/harness.mjs";
// `docs status` — a construct's status is DERIVED from the behaviour rows at its own path, never
// typed by an author and never rolled up from a Binds realization table (decision `E`). Split out of
// `t-seats.mjs` (`N101` step 5), which carried every seat-shaped check in one file before the plugin
// ran through `cli.ts`.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { SEAT } from "../../../../../src/scripts/lib/docs-tree.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-status-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let made = 0;
function repo(files, { type = "APPS" } = {}) {
  made += 1;
  const root = join(BASE, `r${made}`);
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, "sprepo.json"), JSON.stringify({ type, name: "t", config: null }));
  for (const [path, text] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text, "utf8");
  }
  return root;
}

const block = (o) => `<!-- spn:doc\n${JSON.stringify(o, null, 2)}\n-->\n`;
const doc = (o, body = "Some prose.\n", tag = null) =>
  block({ summary: `What ${o.title} is.`, ...o }) +
  `\n# ${o.title}\n\n` + (tag === null ? "" : tag + "\n\n") + body;

const seat = (id, { binds = "", proof = "" } = {}) => doc(
  { id, variant: "construct", parentId: "concept", title: id, lenses: ["ARCHITECT"],
    status: "PLANNING", dependsOn: [] },
  "## Terms\n\n| Term | Contract | Means |\n| --- | --- | --- |\n| Thing | `SPThing` | a thing |\n\n" +
  "## Model\n\nThe model.\n\n## Parts\n\nThe parts.\n\n## Boundary\n\nThe boundary.\n\n" +
  `## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| a chapter | a thing | MUST |\n\n${binds}\n` +
  `## Proof\n\nWhat proves it.\n\n${proof}\n`,
  "`For: Architect` · `Status: 🔮 PLANNING`");

const register = (id, rows) => doc(
  { id, variant: "behaviors", title: id, lenses: ["QA"], status: "PLANNING" },
  "| Id | Who | Does | Sees | Where | Type | Tier | Status | Updated at |\n" +
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n" +
  rows.map((r) => `| ${r[0]} | A person | ${r[1]} | a result | pkg-ts | POSITIVE | ${r[2]} | ${r[3]} | — |\n`).join(""));

function run(root, args) {
  try {
    return execFileSync(process.execPath, [TOOL, "docs", ...args],
      { encoding: "utf8", cwd: root, env: { ...process.env, SPN_WORKSPACE: root } });
  } catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
}
const readAt = (root, p) => readFileSync(join(root, p), "utf8");

let n = 0, failed = 0;
function one(name, got, want) {
  n += 1;
  const ok = typeof want === "function" ? want(got) : got === want;
  if (!ok) { failed += 1; console.log(`  FAIL  ${name}\n        got: ${JSON.stringify(String(got).slice(0, 300))}`); }
  else console.log(`  PASS  ${name}`);
}
const has = (s) => (got) => String(got).includes(s);
const lacks = (s) => (got) => !String(got).includes(s);

console.log("=== a construct's status rolls up the behaviour rows at its own path");
{
  // THE KNOWN-BAD IS BAD IN THE DERIVATION'S OWN TERMS: the block claims a word the rows do not
  // carry. A generic wrong-looking page proves nothing here, because the only input is the rows.
  const tree = (rows, status = "PLANNING") => ({
    [`docs/${SEAT.constructs}/01-core/01-boot.md`]:
      seat("c-boot").replace('"status": "PLANNING"', `"status": "${status}"`),
    [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b-boot", rows),
  });
  const derived = (root) => run(root, ["status", "--check", `docs/${SEAT.constructs}/01-core/01-boot.md`]);

  one("every row PLANNED derives PLANNING",
    derived(repo(tree([["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]))), has("current") );
  // THE LINE SAYS WHAT IT READ. A derived word with no input named is a claim a reader cannot check.
  one("and the line names the row count and the file the rows came from",
    derived(repo(tree([["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]))),
    (g) => /PLANNING from 1 row\(s\) in /.test(g) && g.includes(`${SEAT.behaviors}/01-core/01-boot`));

  one("a file with no rows at all derives PLANNING — an empty register is honest",
    derived(repo(tree([]))), has("PLANNING"));

  one("one proven row among planned ones derives IMPLEMENTING",
    derived(repo(tree([["CORE.BOOT.01", "x", "UNIT", "SUCCESS"], ["CORE.BOOT.02", "y", "UNIT", "PLANNED"]]))),
    has("derive `IMPLEMENTING`"));

  one("every row proven, each carrying a tier, derives DONE",
    derived(repo(tree([["CORE.BOOT.01", "x", "UNIT", "SUCCESS"], ["CORE.BOOT.02", "y", "CONTRACT", "SUCCESS"]]))),
    has("derive `DONE`"));

  // A PROVEN ROW WITH NO TIER NAMES NO RUNG ANYBODY CAN RE-RUN, so it holds the construct at
  // IMPLEMENTING. This is the pair the old derivation could not tell apart at all.
  one("a proven row with no tier does not reach DONE",
    derived(repo(tree([["CORE.BOOT.01", "x", "—", "SUCCESS"]]))), has("derive `IMPLEMENTING`"));

  one("a failed row derives IMPLEMENTING, never PLANNING",
    derived(repo(tree([["CORE.BOOT.01", "x", "UNIT", "FAILED"]]))), has("derive `IMPLEMENTING`"));

  // MANUAL IS THE ONE STATUS A RUN NEVER WRITES, so it counts as started and never as proven.
  one("a MANUAL row is started and not proven",
    derived(repo(tree([["CORE.BOOT.01", "x", "UNIT", "MANUAL"]]))), has("derive `IMPLEMENTING`"));

  // A ROLL-UP OVER A FENCED EXAMPLE IS A ROLL-UP OVER SOMEBODY ELSE'S ROWS.
  one("a proven row inside a fence does not lift the status",
    derived(repo({
      [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("c-boot"),
      [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b-boot", [["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]) +
        "\n```markdown\n| Id | Who | Does | Sees | Where | Type | Tier | Status | Updated at |\n" +
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n" +
        "| CORE.BOOT.09 | A person | y | z | pkg-ts | POSITIVE | UNIT | SUCCESS | — |\n```\n",
    })), (g) => /PLANNING from 1 row\(s\)/.test(g));

  one("a block claiming DONE over planned rows is refused",
    derived(repo(tree([["CORE.BOOT.01", "x", "UNIT", "PLANNED"]], "DONE"))),
    (g) => /the block says `DONE`/.test(g) && /derive `PLANNING`/.test(g));

  // THE REALIZATION TABLE IS NOT AN INPUT ANY MORE. A construct whose Binds says every row is done
  // still derives PLANNING when nothing has run — which is the whole point of `E`.
  const bindsDone = {
    [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("c-boot", {
      binds: "| Repo | Node | What it realizes | State |\n| --- | --- | --- | --- |\n| t | pkg-ts | it | done |\n",
      proof: "| Check | Kind | What a green run shows |\n| --- | --- | --- |\n| `spnutils apps test` | gate | it |\n",
    }),
    [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b-boot", [["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]),
  };
  one("a done realization row no longer lifts the status — only a run does",
    derived(repo(bindsDone)), has("current"));

  // AN ABSENT FILE AND AN EMPTY ONE ARE DIFFERENT ANSWERS, and stamping PLANNING for both would
  // report a measurement where there was no input.
  one("no behaviours file at the mirrored path claims nothing, and says so",
    derived(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("c-boot") })),
    (g) => /no behaviours file at this construct's own path/.test(g) && !/derive/.test(g));
}

console.log("\n=== a FOUNDATION construct derives no status at all");
{
  const book = (extra = {}) => repo({
    [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("c-boot"),
    [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: doc(
      { id: "b-boot", variant: "behaviors", title: "b-boot", lenses: ["QA"], status: "PLANNING" },
      "| Id | Who | Does | Sees | Type |\n| --- | --- | --- | --- | --- |\n" +
      "| CORE.BOOT.01 | A person | can boot | a result | PROMISE |\n"),
    ...extra,
  }, { type: "FOUNDATION" });

  const root = book();
  one("the check names the word the page carries and nothing derives",
    run(root, ["status", "--check", `docs/${SEAT.constructs}/01-core/01-boot.md`]),
    has("carries no `status`"));

  run(root, ["status", `docs/${SEAT.constructs}/01-core/01-boot.md`]);
  const after = readAt(root, `docs/${SEAT.constructs}/01-core/01-boot.md`);
  one("a write strips the field from the block", after, lacks('"status"'));
  one("and strips the chip from the tag line", after, lacks("Status:"));
  one("and leaves the For line standing", after, has("`For: Architect`"));
  one("running it again is quiet", run(root, ["status", "--check", `docs/${SEAT.constructs}/01-core/01-boot.md`]),
    lacks("carries no `status`"));

  // `status` AS THE FIRST KEY IS THE EDGE THE COMMA RULE EXISTS FOR. Taking the leading comma
  // unconditionally leaves `{ , "id": …` and the block stops parsing at all.
  const first = repo({
    [`docs/${SEAT.constructs}/01-core/01-boot.md`]: "<!-- spn:doc\n" +
      JSON.stringify({ status: "PLANNING", id: "c-boot", variant: "construct", title: "c-boot",
                       lenses: ["ARCHITECT"], dependsOn: [], summary: "What c-boot is." }, null, 2) +
      "\n-->\n\n# c-boot\n\n`For: Architect` · `Status: 🔮 PLANNING`\n\n" +
      "## Overview\n\nwhy\n\n## Terms\n\nt\n\n## Model\n\nm\n\n## Parts\n\np\n\n## Boundary\n\nb\n",
    [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b", []),
  }, { type: "FOUNDATION" });
  run(first, ["status", `docs/${SEAT.constructs}/01-core/01-boot.md`]);
  one("stripping a leading `status` leaves a block that still parses",
    run(first, ["audit", `docs/${SEAT.constructs}/01-core/01-boot.md`]), lacks("spn:doc"));
  one("and the field is gone", readAt(first, `docs/${SEAT.constructs}/01-core/01-boot.md`), lacks('"status"'));

  // THE AUDIT DOES NOT SAY IT TOO. `status` owns the fault and fixes it; reporting it from the block
  // check and from the header it renders put 204 findings on the book where there had been one.
  one("the audit stays out of it — one fault, one command",
    run(book(), ["audit", `docs/${SEAT.constructs}/01-core/01-boot.md`]), lacks("carries no `status`"));

  // A CHIP THE BLOCK DOES NOT DECLARE IS A PAGE NOBODY RE-RENDERED, and that is the audit's fault.
  const stale = repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]:
    seat("c-boot").replace(/,?\s*"status": "PLANNING"/, "") }, { type: "FOUNDATION" });
  one("a chip left standing over a block with no status is refused",
    run(stale, ["audit", `docs/${SEAT.constructs}/01-core/01-boot.md`]),
    has("the block declares no status"));

  // The same page in an APPS repository still derives a word — the world is what decides.
  one("the rule is the repository's world, not the file's shape",
    run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("c-boot"),
               [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b", [["CORE.BOOT.01", "x", "UNIT", "SUCCESS"]]) }),
        ["status", "--check", `docs/${SEAT.constructs}/01-core/01-boot.md`]),
    has("derive `DONE`"));
}

console.log(failed ? `\n  ${failed} of ${n} FAILED — docs status` : `\n  all ${n} passed — docs status`);
process.exit(failed ? 1 : 0);
