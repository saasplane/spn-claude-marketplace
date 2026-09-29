import { PLUGIN } from "../../../../helpers/harness.mjs";
// `docs coverage` — three set checks, replacing a resolver (decision `E`): the constructs and
// behaviours seats pair file for file by PATH, a capabilities folder names a real package and every
// package has a folder, and every `Who` a row names resolves to the personas table and back. Split
// out of `t-seats.mjs` (`N101` step 5), which carried every seat-shaped check in one file before the
// plugin ran through `cli.ts`.
//
// THREE SET CHECKS REPLACE A RESOLVER. The `Node` cell used to be matched against every declared
// name, accepting a hit anywhere inside either string — so a cell reading `the estate declaration`
// resolved through a node called `estate` and read as checked. Every case here plants a known-bad
// that is bad in the check's OWN terms: a path with no pair, a folder naming no package, a `Who`
// naming no persona. Id coverage is deliberately absent: the CLI's `behaviours-join.ts` already does
// it in both directions under `RD.SUPPORT.APPS.084`, and a second copy is the divergence that file warns
// about.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { SEAT } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-coverage-"));
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

let n = 0, failed = 0;
function one(name, got, want) {
  n += 1;
  const ok = typeof want === "function" ? want(got) : got === want;
  if (!ok) { failed += 1; console.log(`  FAIL  ${name}\n        got: ${JSON.stringify(String(got).slice(0, 300))}`); }
  else console.log(`  PASS  ${name}`);
}
const has = (s) => (got) => String(got).includes(s);
const lacks = (s) => (got) => !String(got).includes(s);

const kind = JSON.stringify({ kind: "MODULE_SERVER", name: "Pkg", config: { code: "pkg" } });
const personas = (actors) => doc(
  { id: "p", variant: "behaviors", title: "Personas", lenses: ["QA"], status: "PLANNING" },
  "| Actor | Who they are | What the rows promise them |\n| --- | --- | --- |\n" +
  actors.map((a) => `| **${a}** | somebody | an outcome |\n`).join(""));

console.log("=== the two seats pair file for file, and the pairing is of PATHS");
{
  const paired = {
    [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot"),
    [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b", [["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]),
  };
  one("a construct with its behaviours file at the same path is clean",
      run(repo(paired), ["coverage", "."]), lacks("parity"));

  // A BEHAVIOURS FILE WITH NO ROWS IS HONEST where the product is not built — two of
  // `spn-launchpad-ts`'s three carry none, because Surfaces and Web Shell settle declarations rather
  // than acts. A check requiring a row per file would fail them on day one.
  one("an empty behaviours file pairs, because parity is of paths and never of rows",
      run(repo({ ...paired, [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b", []) }), ["coverage", "."]),
      lacks("parity"));

  one("a construct with no behaviours file at its own path is reported",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot"),
                 [`docs/${SEAT.behaviors}/01-core/02-other.md`]: register("o", []) }), ["coverage", "."]),
      has(`no \`${SEAT.behaviors}/01-core/01-boot.md\``));

  one("and rows with no construct are reported the other way",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot"),
                 [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b", []),
                 [`docs/${SEAT.behaviors}/01-core/02-ghost.md`]: register("g", []) }), ["coverage", "."]),
      has(`no \`${SEAT.constructs}/01-core/02-ghost.md\``));

  one("the same file under a different domain is not the same path",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot"),
                 [`docs/${SEAT.behaviors}/02-other/01-boot.md`]: register("b", []) }), ["coverage", "."]),
      (g) => g.includes(`no \`${SEAT.behaviors}/01-core/01-boot.md\``) && g.includes(`no \`${SEAT.constructs}/02-other/01-boot.md\``));

  one("a face and the personas table are not topics, and pair with nothing",
      run(repo({ ...paired, [`docs/${SEAT.behaviors}/README.md`]: doc({ id: "f", variant: "behaviors", title: "F", lenses: ["QA"], status: "PLANNING" }),
                 [`docs/${SEAT.behaviors}/personas.md`]: personas(["A person"]) }), ["coverage", "."]),
      lacks("parity"));

  // AN ABSENT SCAN AND AN ABSENT FINDING MUST NOT SHARE A VERDICT.
  one("a repository with no behaviours seat says so rather than reading clean",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot"), [`docs/${SEAT.capabilities}/x/pkg-ts/a.md`]: "# a\n" }), ["coverage", "."]),
      has("nothing was compared"));
}

console.log("\n=== a capability folder names a package, and every package has a folder");
{
  const good = {
    [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot"),
    [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b", []),
    [`docs/${SEAT.capabilities}/01-core/pkg-ts/01-boot.md`]: "# Boot\n",
    "packages/pkg-ts/spkind.json": kind,
  };
  one("a folder named after a real package is clean", run(repo(good), ["coverage", "."]), lacks("mirror"));

  one("a folder naming no package of this repository is reported",
      run(repo({ ...good, [`docs/${SEAT.capabilities}/01-core/ghost-ts/01-boot.md`]: "# g\n" }), ["coverage", "."]),
      has("`ghost-ts` is a folder of the capabilities seat and no package"));

  one("a package with no folder is reported the other way",
      run(repo({ ...good, "packages/orphan-ts/spkind.json": kind }), ["coverage", "."]),
      has(`\`orphan-ts\` declares itself a package and \`${SEAT.capabilities}/\` carries no folder`));

  // A MANIFEST SITS TWO LEVELS DOWN AND NO DEEPER. A module inside an app and a fixture estate under
  // `tests/` each declare something that is not a package of this repository.
  one("a module inside a package is not a second package",
      run(repo({ ...good, "packages/pkg-ts/src/modules/order/spkind.json": kind }), ["coverage", "."]),
      lacks("`order` declares itself a package"));
  one("and a fixture estate under tests is not one either",
      run(repo({ ...good, "packages/pkg-ts/tests/fixtures/estate/packages/infra-x/spinfrapkg.json": "{}" }), ["coverage", "."]),
      lacks("`infra-x` declares itself a package"));
  one("a built copy under dist is not a second package",
      run(repo({ ...good, "packages/pkg-ts/dist/spkind.json": kind }), ["coverage", "."]),
      lacks("`dist` declares itself a package"));

  // A BOOK MIRRORS NO PACKAGES. The foundation's capabilities seat is the standard per topic, and its
  // folders are areas rather than packages. Judged this way it reported 129 correct constructs as
  // uncovered.
  one("a FOUNDATION repository is exempt",
      run(repo({ [`docs/${SEAT.capabilities}/01-devex/04-workspace/04-docs.md`]: "# d\n" }, { type: "FOUNDATION" }), ["coverage", "."]),
      lacks("mirror"));
  one("and an APPS repository with the same shape is not",
      run(repo({ [`docs/${SEAT.capabilities}/01-devex/04-workspace/04-docs.md`]: "# d\n", "packages/pkg-ts/spkind.json": kind }), ["coverage", "."]),
      has("`04-workspace` is a folder of the capabilities seat and no package"));

  one("a repository declaring no package at all says so rather than reading clean",
      run(repo({ [`docs/${SEAT.capabilities}/01-core/pkg-ts/01-boot.md`]: "# b\n" }), ["coverage", "."]),
      has("nothing in this repository declares a package"));
}

console.log("\n=== every Who resolves to the personas table, and every persona is named by a row");
{
  const rows = (who) => doc(
    { id: "b", variant: "behaviors", title: "b", lenses: ["QA"], status: "PLANNING" },
    "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n" +
    `| CORE.BOOT.01 | ${who} | can boot | a result | POSITIVE | UNIT | PLANNED | — |\n`);
  const tree = (who, actors) => ({
    [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot"),
    [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: rows(who),
    [`docs/${SEAT.behaviors}/personas.md`]: personas(actors),
  });

  one("a Who the table declares is clean",
      run(repo(tree("A web developer", ["A web developer"])), ["coverage", "."]), lacks("personas"));

  // THE ARTICLE AND THE FORMATTING COME OFF, AND NOTHING ELSE DOES. `Service app` in the table and
  // `a service app` in a cell are the same person, and two repositories spell them those two ways.
  one("a leading article is not a different persona",
      run(repo(tree("a service app", ["Service app"])), ["coverage", "."]), lacks("personas"));

  one("a Who nobody declared is reported",
      run(repo(tree("A quality engineer", ["A web developer"])), ["coverage", "."]),
      has("`A quality engineer` is a `Who` and `personas.md` declares no such actor"));

  one("a persona no row names is reported the other way",
      run(repo(tree("A web developer", ["A web developer", "An architect"])), ["coverage", "."]),
      has("`An architect` is declared as a persona and no behaviour row names it"));

  // NO SUBSTRING. That looseness is exactly what the retired `Node` resolver did — and a `Who` of
  // *a module* matching a persona called *a module service* is the same mistake in a new place.
  one("a persona is matched whole, never as part of a longer one",
      run(repo(tree("A module", ["A module service"])), ["coverage", "."]),
      has("`A module` is a `Who` and `personas.md` declares no such actor"));

  // THE RULE IS ANCHORED TO THE CELL, so a seat whose rows carry no Who owes no table. `spn-infra`
  // and `spn-support-infra` write `Observably · Where · Because`, with neither an id nor an actor.
  one("a seat whose rows carry no Who owes no personas table, and the absence is named",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot"),
                 [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: doc(
                   { id: "b", variant: "behaviors", title: "b", lenses: ["INFRA"], status: "PLANNING" },
                   "| Observably | Where | Because |\n| --- | --- | --- |\n| it stands | pkg | ground |\n") }),
          ["coverage", "."]),
      has("no row carrying a `Who`, so nothing was compared"));

  one("rows carrying a Who with no personas table beside them is a finding",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot"),
                 [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: rows("A web developer") }), ["coverage", "."]),
      has("name a person and there is no `personas.md`"));

  one("the personas table's own explanatory tables are not read as actors",
      run(repo({ ...tree("A web developer", ["A web developer"]),
                 [`docs/${SEAT.behaviors}/personas.md`]: personas(["A web developer"]) +
                   "\n| Why | What |\n| --- | --- |\n| because | a reason |\n" }), ["coverage", "."]),
      lacks("personas"));

  // EVERY PARSER OVER A TABLE IS FENCE-AWARE. A personas page teaching the table shape SHOWS one, and
  // three tools in one sitting read a worked example as live content — one of them rewrote its hashes.
  one("a personas table inside a fence is an example, not a declaration",
      run(repo({ ...tree("A web developer", ["A web developer"]),
                 [`docs/${SEAT.behaviors}/personas.md`]: personas(["A web developer"]) +
                   "\n```markdown\n| Actor | Who they are | What the rows promise them |\n| --- | --- | --- |\n" +
                   "| **An example person** | somebody | an outcome |\n```\n" }), ["coverage", "."]),
      lacks("An example person"));

  one("and a Who inside a fence is an example too",
      run(repo({ ...tree("A web developer", ["A web developer"]),
                 [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: rows("A web developer") +
                   "\n```markdown\n| Id | Who | Does | Sees | Type | Tier | Status | Updated at |\n" +
                   "| --- | --- | --- | --- | --- | --- | --- | --- |\n" +
                   "| CORE.X.01 | An invented person | x | y | POSITIVE | UNIT | PLANNED | — |\n```\n" }), ["coverage", "."]),
      lacks("An invented person"));

  // EVERY NEW CHECK SHIPS SOFT. An agent once read a rule off a buggy check and renamed a page.
  one("every set-check finding is SOFT while the corpus crosses",
      run(repo(tree("A quality engineer", ["A web developer"])), ["coverage", "."]),
      (g) => !/^. RULE /m.test(g) && /0 RULE/.test(g));
}

console.log(failed ? `\n  ${failed} of ${n} FAILED — docs coverage` : `\n  all ${n} passed — docs coverage`);
process.exit(failed ? 1 : 0);
