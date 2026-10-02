import { PLUGIN } from "../../../../helpers/harness.mjs";
// `docs topics` — every numbered folder under the constructs, behaviours and capabilities seats
// names the same set, and one id never names two documents. Split out of `t-seats.mjs` (`N101` step
// 5), which carried every seat-shaped check in one file before the plugin ran through `cli.ts`.
//
// EVERY CASE HERE RUNS TWICE IN SPIRIT: once on a tree that holds the rule, and once on a tree that
// breaks it. A check is only worth its runtime if it can be made to fail on purpose, and the first
// version of `topics` taught that lesson the expensive way — it returned early when the constructs
// seat named no numbered topic, so it reported CLEAN over seven repositories while comparing every
// numbered behaviours file against an empty set. The regression case below is that exact tree.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { SEAT, TEMPLATES } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-topics-"));
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

/** A construct seat file: the six sections, with whatever Binds and Proof the case needs. */
const seat = (id, { binds = "", proof = "" } = {}) => doc(
  { id, variant: "construct", parentId: "concept", title: id, lenses: ["ARCHITECT"],
    status: "PLANNING", dependsOn: [] },
  "## Terms\n\n| Term | Contract | Means |\n| --- | --- | --- |\n| Thing | `SPThing` | a thing |\n\n" +
  "## Model\n\nThe model.\n\n## Parts\n\nThe parts.\n\n## Boundary\n\nThe boundary.\n\n" +
  `## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| a chapter | a thing | MUST |\n\n${binds}\n` +
  `## Proof\n\nWhat proves it.\n\n${proof}\n`,
  "`For: Architect` · `Status: 🔮 PLANNING`");

/** A behaviours register file, nine cells wide, as the document chapter spells it. */
const register = (id, rows) => doc(
  { id, variant: "behaviors", title: id, lenses: ["QA"], status: "PLANNING" },
  "| Id | Who | Does | Sees | Where | Type | Tier | Status | Updated at |\n" +
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n" +
  rows.map((r) => `| ${r[0]} | A person | ${r[1]} | a result | pkg-ts | POSITIVE | ${r[2]} | ${r[3]} | — |\n`).join(""));

function run(root, args) {
  try {
    return execFileSync(process.execPath, [TOOL, "docs", ...args],
      { encoding: "utf8", cwd: root, stdio: "pipe", env: { ...process.env, SPN_WORKSPACE: root } });
  } catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
}

let n = 0, failed = 0;
function one(name, got, want) {
  n += 1;
  const ok = typeof want === "function" ? want(got) : got === want;
  if (!ok) { failed += 1; console.log(`  FAIL  ${name}\n        got: ${JSON.stringify(String(got).slice(0, 300))}`); }
  else console.log(`  PASS  ${name}`);
}
const has = (s) => (got) => String(got).includes(s);
const lacks = (s) => (got) => !String(got).includes(s);

console.log("=== a topic the constructs seat does not name is refused in the other two seats");
{
  const good = {
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Dictionary", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot"),
    [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b-boot", [["CORE.BOOT.01", "can boot", "UNIT", "PLANNED"]]),
    [`docs/${SEAT.capabilities}/01-core/pkg-ts/01-boot.md`]: "# Boot\n\nWhere it lives.\n",
  };
  one("a tree where all three seats name the same topic is clean",
      run(repo(good), ["topics", "check", "."]), has("clean — 1 repository"));

  one("a numbered behaviours file naming no construct is a RULE",
      run(repo({ ...good, [`docs/${SEAT.behaviors}/01-core/02-ghost.md`]: register("g", [["CORE.GHOST.01", "x", "UNIT", "PLANNED"]]) }), ["topics", "check", "."]),
      has("`ghost` is a numbered topic of the behaviours seat"));

  one("the same topic under a different domain is a RULE, not a pass",
      run(repo({ ...good, [`docs/${SEAT.behaviors}/02-other/01-boot.md`]: register("b2", [["CORE.BOOT.02", "x", "UNIT", "PLANNED"]]) }), ["topics", "check", "."]),
      has("sits under `02-other` here and under `01-core` in the constructs seat"));

  one("a capability chapter naming no construct is a RULE",
      run(repo({ ...good, [`docs/${SEAT.capabilities}/01-core/pkg-ts/02-ghost.md`]: "# Ghost\n" }), ["topics", "check", "."]),
      has("`ghost` is a numbered chapter of the capabilities seat"));

  one("an unnumbered file in either seat is not a topic and is not judged",
      run(repo({ ...good, [`docs/${SEAT.behaviors}/01-core/personas.md`]: doc({ id: "p", title: "Personas", lenses: ["QA"], status: "PLANNING" }) }), ["topics", "check", "."]),
      has("clean — 1 repository"));

  // THE REGRESSION. Unnumbered constructs and numbered behaviours is the corpus mid-move, and the
  // first implementation called it clean because it had nothing to compare against.
  one("a tree whose constructs are not numbered yet is NOT reported clean",
      run(repo({
        [`docs/${SEAT.constructs}/01-core/boot.md`]: seat("boot"),
        [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b", [["CORE.BOOT.01", "can boot", "UNIT", "PLANNED"]]),
      }), ["topics", "check", "."]),
      (g) => /RULE/.test(g) && !/clean/.test(g));

  one("a repository with no constructs seat at all is silent, not noisy",
      run(repo({ [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b", [["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]) }), ["topics", "check", "."]),
      has("clean — 1 repository"));
}

console.log("\n=== a topic name repeats across domains, and that is not drift");
{
  // The foundation names `shape`, `ships`, `resources` and `operate` in two domains each. The
  // applications half and the infra half both have a shape and both ship something, and neither is
  // the other. The first version of this check kept one domain per name, so the last one walked
  // won and the other reported as sitting in the wrong place — and a merge agent, reading the rule
  // off the check, renamed a page to satisfy it.
  const two = {
    // One topic name, two domains, two ids — which is exactly what the corpus does: the infra
    // half's pages are `estate-*` so they cannot collide with the applications half's own.
    [`docs/${SEAT.constructs}/01-apps/01-shape.md`]: seat("apps-shape"),
    [`docs/${SEAT.constructs}/02-infra/01-shape.md`]: seat("estate-shape"),
    [`docs/${SEAT.behaviors}/01-apps/01-shape.md`]: register("b1", [["APPS.SHAPE.01", "x", "UNIT", "PLANNED"]]),
    [`docs/${SEAT.behaviors}/02-infra/01-shape.md`]: register("b2", [["INFRA.SHAPE.01", "y", "UNIT", "PLANNED"]]),
  };
  one("one name in two domains, with a rows file under each, is clean",
      run(repo(two), ["topics", "check", "."]), has("clean — 1 repository"));

  one("and a third domain nothing names is still a RULE",
      run(repo({ ...two, [`docs/${SEAT.behaviors}/03-other/01-shape.md`]: register("b3", [["OTHER.SHAPE.01", "z", "UNIT", "PLANNED"]]) }), ["topics", "check", "."]),
      (g) => /`shape` sits under `03-other` here and under/.test(g) && /`01-apps`/.test(g) && /`02-infra`/.test(g));
}

console.log("\n=== one id names one document");
{
  const doc2 = (id, title) => doc({ id, variant: "capability", title, lenses: ["SERVER_DEV"], status: "DONE" });
  one("two documents under one id are a RULE, and both are named",
      run(repo({
        [`docs/${SEAT.capabilities}/01-core/pkg-ts/README.md`]: doc2("pkg-caps", "Capabilities — pkg-ts"),
        [`docs/${SEAT.capabilities}/01-core/pkg-ts/01-boot.md`]: doc2("pkg-caps", "boot in pkg-ts"),
      }), ["topics", "check", "."]),
      (g) => /`pkg-caps` is the id of 2 documents/.test(g) && (g.match(/RULE ids/g) ?? []).length === 2);

  one("a tree where every id is its own is clean",
      run(repo({
        [`docs/${SEAT.capabilities}/01-core/pkg-ts/README.md`]: doc2("pkg-caps", "Capabilities — pkg-ts"),
        [`docs/${SEAT.capabilities}/01-core/pkg-ts/01-boot.md`]: doc2("pkg-boot", "boot in pkg-ts"),
      }), ["topics", "check", "."]),
      has("clean — 1 repository"));

  one("three documents under one id say three, not two",
      run(repo({
        [`docs/${SEAT.capabilities}/01-core/a/README.md`]: doc2("same", "A"),
        [`docs/${SEAT.capabilities}/01-core/b/README.md`]: doc2("same", "B"),
        [`docs/${SEAT.capabilities}/01-core/c/README.md`]: doc2("same", "C"),
      }), ["topics", "check", "."]),
      has("`same` is the id of 3 documents"));

  // A template carries a placeholder id and is excluded from every walk by folder, not per file.
  one("a template's placeholder id is not a collision",
      run(repo({
        [`docs/${SEAT.capabilities}/01-core/pkg-ts/README.md`]: doc2("pkg-caps", "Capabilities — pkg-ts"),
        [`docs/${SEAT.capabilities}/${TEMPLATES}/capability-template.md`]: doc2("pkg-caps", "A template"),
      }), ["topics", "check", "."]),
      has("clean — 1 repository"));
}

// ---------------------------------------------------------------- the grammar: an action, and paths inside a repository

/** What one run printed and its exit code, typed after the group, from the folder given. */
const typed = (cwd, args) => {
  try { return { code: 0, out: execFileSync(process.execPath, [TOOL, "docs", ...args], { encoding: "utf8", cwd, stdio: "pipe", env: { ...process.env, SPN_WORKSPACE: cwd } }) }; }
  catch (error) { return { code: error.status, out: String(error.stdout ?? "") + String(error.stderr ?? "") }; }
};
const USAGE = "usage: spn-devex docs topics check [<path>…]\n";

console.log("\n=== `docs topics` needs its action as a word, and a narrow path reports what sits under it");
{
  const doc2 = (id, title) => doc({ id, title, lenses: ["ARCHITECT"], status: "PLANNING" });
  // Two faults in two seats: a behaviours topic no construct names, and one id on two capability faces.
  const root = repo({
    [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("c-boot"),
    [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b-boot", [["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]),
    [`docs/${SEAT.behaviors}/01-core/02-ghost.md`]: register("b-ghost", [["CORE.GHOST.01", "x", "UNIT", "PLANNED"]]),
    [`docs/${SEAT.capabilities}/01-core/a/README.md`]: doc2("same", "A"),
    [`docs/${SEAT.capabilities}/01-core/b/README.md`]: doc2("same", "B"),
  });
  const GHOST = `docs/${SEAT.behaviors}/01-core/02-ghost.md`;

  const bare = typed(root, ["topics"]);
  one("[MKT.SCRIPTS.111] with no action the entry prints the usage line, says an action is owed and exits 2",
    [bare.code, bare.out].join(), `2,${USAGE}\`docs topics\` needs an action.\n`);
  one("[MKT.SCRIPTS.111] a path where the action belongs is refused with exit 2", typed(root, ["topics", "."]).code, 2);
  const option = typed(root, ["topics", "check", ".", "--json"]);
  one("an option the command does not take is refused by its name, with exit 2",
    [option.code, option.out].join(), `2,${USAGE}\`docs topics check\` does not take \`--json\`.\n`);

  const whole = typed(root, ["topics", "check", "."]);
  one("known-bad: the repository, checked, reports the topic no construct names and the id of two documents, and exits 1",
    whole, (got) => got.code === 1 && got.out.includes("`ghost` is a numbered topic") && got.out.includes("`same` is the id of 2 documents") && got.out.includes("3 finding(s) — 3 RULE"));
  const behaviours = typed(root, ["topics", "check", `docs/${SEAT.behaviors}`]);
  one("[MKT.SCRIPTS.138] a run narrowed to one seat reports the finding under it, and none from the seat beside it",
    behaviours, (got) => got.code === 1 && got.out.includes("`ghost` is a numbered topic") && !got.out.includes("`same`") && got.out.includes("1 finding(s) — 1 RULE"));
  // THE CONSTRUCTS SEAT SITS OUTSIDE THE PATH. A run that read only the one file would have no seat
  // to compare it with, and would report nothing.
  const oneFile = typed(root, ["topics", "check", GHOST]);
  one("[MKT.SCRIPTS.138] a run narrowed to one file still compares it with the constructs seat outside its path",
    oneFile, (got) => got.code === 1 && got.out.includes("`ghost` is a numbered topic") && got.out.includes("1 finding(s) — 1 RULE"));
  const oneFace = typed(root, ["topics", "check", `docs/${SEAT.capabilities}/01-core/a`]);
  one("[MKT.SCRIPTS.138] a run narrowed to one of two documents under one id reports that document, and names the other in its message",
    oneFace, (got) => got.code === 1 && got.out.includes("1 finding(s) — 1 RULE") && got.out.includes("01-core/b/README.md"));
  const clean = typed(root, ["topics", "check", `docs/${SEAT.constructs}`]);
  one("[MKT.SCRIPTS.138] a run narrowed to a folder with no finding is clean and exits 0", clean, (got) => got.code === 0 && got.out.includes("clean — 1 repository"));
  const several = typed(root, ["topics", "check", GHOST, `docs/${SEAT.capabilities}`]);
  one("several paths of one repository are one run, and the repository is read once", several, (got) => got.code === 1 && got.out.includes("3 finding(s) — 3 RULE"));

  const inside = typed(join(root, "docs", SEAT.constructs), ["topics", "check"]);
  one("[MKT.SCRIPTS.113] with no path the run takes the repository the caller is in, from a folder inside it too",
    [typed(root, ["topics", "check"]).out.includes("3 finding(s)"), inside.out.includes("3 finding(s)"), inside.code].join(), "true,true,1");
  const outside = typed(BASE, ["topics", "check"]);
  one("[MKT.SCRIPTS.113] where the caller is in no repository, `check` with no path says to name one, and exits 2",
    [outside.code, outside.out].join(), `2,${USAGE}\`docs topics check\` needs a path here, because the folder it is run from is in no repository. Name a repository.\n`);
}

console.log(failed ? `\n  ${failed} of ${n} FAILED — docs topics` : `\n  all ${n} passed — docs topics`);
process.exit(failed ? 1 : 0);
