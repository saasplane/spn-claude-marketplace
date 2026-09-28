import { PLUGIN } from "../../helpers/harness.mjs";
// `docs.ts topics` · `docs.ts coverage` · the Proof join — the three checks step 4 of N13 owes.
//
// EVERY CASE HERE RUNS TWICE IN SPIRIT: once on a tree that holds the rule, and once on a tree that
// breaks it. A check is only worth its runtime if it can be made to fail on purpose, and the first
// version of `topics` taught that lesson the expensive way — it returned early when the constructs
// seat named no numbered topic, so it reported CLEAN over seven repositories while comparing every
// numbered behaviours file against an empty set. The regression case below is that exact tree.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const TOOL = resolve(PLUGIN, "src", "scripts", "tools", "docs.ts");
const TEMPLATES = resolve(PLUGIN, "..", "..", "..",
                          "spn-foundation", "docs", "04-capabilities", "01-devex",
                          "04-workspace", "04-docs", "templates");
const BASE = mkdtempSync(join(tmpdir(), "t-seats-"));
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
    return execFileSync(process.execPath, [TOOL, ...args],
      { encoding: "utf8", cwd: root, env: { ...process.env, SPN_WORKSPACE: root, SPN_TEMPLATES: TEMPLATES } });
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

// ---------------------------------------------------------------- topics

console.log("=== a topic the constructs seat does not name is refused in the other two seats");
{
  const good = {
    "docs/02-constructs/README.md": doc({ id: "d", title: "Dictionary", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/01-boot.md": seat("boot"),
    "docs/03-behaviors/01-core/01-boot.md": register("b-boot", [["CORE.BOOT.01", "can boot", "UNIT", "PLANNED"]]),
    "docs/04-capabilities/01-core/pkg-ts/01-boot.md": "# Boot\n\nWhere it lives.\n",
  };
  one("a tree where all three seats name the same topic is clean",
      run(repo(good), ["topics", "."]), has("clean — 1 repository"));

  one("a numbered behaviours file naming no construct is a RULE",
      run(repo({ ...good, "docs/03-behaviors/01-core/02-ghost.md": register("g", [["CORE.GHOST.01", "x", "UNIT", "PLANNED"]]) }), ["topics", "."]),
      has("`ghost` is a numbered topic of the behaviours seat"));

  one("the same topic under a different domain is a RULE, not a pass",
      run(repo({ ...good, "docs/03-behaviors/02-other/01-boot.md": register("b2", [["CORE.BOOT.02", "x", "UNIT", "PLANNED"]]) }), ["topics", "."]),
      has("sits under `02-other` here and under `01-core` in the constructs seat"));

  one("a capability chapter naming no construct is a RULE",
      run(repo({ ...good, "docs/04-capabilities/01-core/pkg-ts/02-ghost.md": "# Ghost\n" }), ["topics", "."]),
      has("`ghost` is a numbered chapter of the capabilities seat"));

  one("an unnumbered file in either seat is not a topic and is not judged",
      run(repo({ ...good, "docs/03-behaviors/01-core/personas.md": doc({ id: "p", title: "Personas", lenses: ["QA"], status: "PLANNING" }) }), ["topics", "."]),
      has("clean — 1 repository"));

  // THE REGRESSION. Unnumbered constructs and numbered behaviours is the corpus mid-move, and the
  // first implementation called it clean because it had nothing to compare against.
  one("a tree whose constructs are not numbered yet is NOT reported clean",
      run(repo({
        "docs/02-constructs/01-core/boot.md": seat("boot"),
        "docs/03-behaviors/01-core/01-boot.md": register("b", [["CORE.BOOT.01", "can boot", "UNIT", "PLANNED"]]),
      }), ["topics", "."]),
      (g) => /RULE/.test(g) && !/clean/.test(g));

  one("a repository with no constructs seat at all is silent, not noisy",
      run(repo({ "docs/03-behaviors/01-core/01-boot.md": register("b", [["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]) }), ["topics", "."]),
      has("clean — 1 repository"));
}

// ---------------------------------------------------------------- the set checks

// THREE SET CHECKS REPLACE A RESOLVER (decision `E`). The `Node` cell used to be matched against
// every declared name, accepting a hit anywhere inside either string — so a cell reading `the estate
// declaration` resolved through a node called `estate` and read as checked. Every case here plants a
// known-bad that is bad in the check's OWN terms: a path with no pair, a folder naming no package, a
// `Who` naming no persona. Id coverage is deliberately absent: the CLI's `behaviours-join.ts` already
// does it in both directions under `RD.APPS.084`, and a second copy is the divergence that file warns
// about.

const kind = JSON.stringify({ kind: "MODULE_SERVER", name: "Pkg", config: { code: "pkg" } });
const personas = (actors) => doc(
  { id: "p", variant: "behaviors", title: "Personas", lenses: ["QA"], status: "PLANNING" },
  "| Actor | Who they are | What the rows promise them |\n| --- | --- | --- |\n" +
  actors.map((a) => `| **${a}** | somebody | an outcome |\n`).join(""));

console.log("\n=== the two seats pair file for file, and the pairing is of PATHS");
{
  const paired = {
    "docs/02-constructs/01-core/01-boot.md": seat("boot"),
    "docs/03-behaviors/01-core/01-boot.md": register("b", [["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]),
  };
  one("a construct with its behaviours file at the same path is clean",
      run(repo(paired), ["coverage", "."]), lacks("parity"));

  // A BEHAVIOURS FILE WITH NO ROWS IS HONEST where the product is not built — two of
  // `spn-launchpad-ts`'s three carry none, because Surfaces and Web Shell settle declarations rather
  // than acts. A check requiring a row per file would fail them on day one.
  one("an empty behaviours file pairs, because parity is of paths and never of rows",
      run(repo({ ...paired, "docs/03-behaviors/01-core/01-boot.md": register("b", []) }), ["coverage", "."]),
      lacks("parity"));

  one("a construct with no behaviours file at its own path is reported",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": seat("boot"),
                 "docs/03-behaviors/01-core/02-other.md": register("o", []) }), ["coverage", "."]),
      has("no `03-behaviors/01-core/01-boot.md`"));

  one("and rows with no construct are reported the other way",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": seat("boot"),
                 "docs/03-behaviors/01-core/01-boot.md": register("b", []),
                 "docs/03-behaviors/01-core/02-ghost.md": register("g", []) }), ["coverage", "."]),
      has("no `02-constructs/01-core/02-ghost.md`"));

  one("the same file under a different domain is not the same path",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": seat("boot"),
                 "docs/03-behaviors/02-other/01-boot.md": register("b", []) }), ["coverage", "."]),
      (g) => /no `03-behaviors\/01-core\/01-boot.md`/.test(g) && /no `02-constructs\/02-other\/01-boot.md`/.test(g));

  one("a face and the personas table are not topics, and pair with nothing",
      run(repo({ ...paired, "docs/03-behaviors/README.md": doc({ id: "f", variant: "behaviors", title: "F", lenses: ["QA"], status: "PLANNING" }),
                 "docs/03-behaviors/personas.md": personas(["A person"]) }), ["coverage", "."]),
      lacks("parity"));

  // AN ABSENT SCAN AND AN ABSENT FINDING MUST NOT SHARE A VERDICT.
  one("a repository with no behaviours seat says so rather than reading clean",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": seat("boot"), "docs/04-capabilities/x/pkg-ts/a.md": "# a\n" }), ["coverage", "."]),
      has("nothing was compared"));
}

console.log("\n=== a capability folder names a package, and every package has a folder");
{
  const good = {
    "docs/02-constructs/01-core/01-boot.md": seat("boot"),
    "docs/03-behaviors/01-core/01-boot.md": register("b", []),
    "docs/04-capabilities/01-core/pkg-ts/01-boot.md": "# Boot\n",
    "packages/pkg-ts/spkind.json": kind,
  };
  one("a folder named after a real package is clean", run(repo(good), ["coverage", "."]), lacks("mirror"));

  one("a folder naming no package of this repository is reported",
      run(repo({ ...good, "docs/04-capabilities/01-core/ghost-ts/01-boot.md": "# g\n" }), ["coverage", "."]),
      has("`ghost-ts` is a folder of the capabilities seat and no package"));

  one("a package with no folder is reported the other way",
      run(repo({ ...good, "packages/orphan-ts/spkind.json": kind }), ["coverage", "."]),
      has("`orphan-ts` declares itself a package and `04-capabilities/` carries no folder"));

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
      run(repo({ "docs/04-capabilities/01-devex/04-workspace/04-docs.md": "# d\n" }, { type: "FOUNDATION" }), ["coverage", "."]),
      lacks("mirror"));
  one("and an APPS repository with the same shape is not",
      run(repo({ "docs/04-capabilities/01-devex/04-workspace/04-docs.md": "# d\n", "packages/pkg-ts/spkind.json": kind }), ["coverage", "."]),
      has("`04-workspace` is a folder of the capabilities seat and no package"));

  one("a repository declaring no package at all says so rather than reading clean",
      run(repo({ "docs/04-capabilities/01-core/pkg-ts/01-boot.md": "# b\n" }), ["coverage", "."]),
      has("nothing in this repository declares a package"));
}

console.log("\n=== every Who resolves to the personas table, and every persona is named by a row");
{
  const rows = (who) => doc(
    { id: "b", variant: "behaviors", title: "b", lenses: ["QA"], status: "PLANNING" },
    "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n" +
    `| CORE.BOOT.01 | ${who} | can boot | a result | POSITIVE | UNIT | PLANNED | — |\n`);
  const tree = (who, actors) => ({
    "docs/02-constructs/01-core/01-boot.md": seat("boot"),
    "docs/03-behaviors/01-core/01-boot.md": rows(who),
    "docs/03-behaviors/personas.md": personas(actors),
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
      run(repo({ "docs/02-constructs/01-core/01-boot.md": seat("boot"),
                 "docs/03-behaviors/01-core/01-boot.md": doc(
                   { id: "b", variant: "behaviors", title: "b", lenses: ["INFRA"], status: "PLANNING" },
                   "| Observably | Where | Because |\n| --- | --- | --- |\n| it stands | pkg | ground |\n") }),
          ["coverage", "."]),
      has("no row carrying a `Who`, so nothing was compared"));

  one("rows carrying a Who with no personas table beside them is a finding",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": seat("boot"),
                 "docs/03-behaviors/01-core/01-boot.md": rows("A web developer") }), ["coverage", "."]),
      has("name a person and there is no `personas.md`"));

  one("the personas table's own explanatory tables are not read as actors",
      run(repo({ ...tree("A web developer", ["A web developer"]),
                 "docs/03-behaviors/personas.md": personas(["A web developer"]) +
                   "\n| Why | What |\n| --- | --- |\n| because | a reason |\n" }), ["coverage", "."]),
      lacks("personas")); 

  // EVERY PARSER OVER A TABLE IS FENCE-AWARE. A personas page teaching the table shape SHOWS one, and
  // three tools in one sitting read a worked example as live content — one of them rewrote its hashes.
  one("a personas table inside a fence is an example, not a declaration",
      run(repo({ ...tree("A web developer", ["A web developer"]),
                 "docs/03-behaviors/personas.md": personas(["A web developer"]) +
                   "\n```markdown\n| Actor | Who they are | What the rows promise them |\n| --- | --- | --- |\n" +
                   "| **An example person** | somebody | an outcome |\n```\n" }), ["coverage", "."]),
      lacks("An example person"));

  one("and a Who inside a fence is an example too",
      run(repo({ ...tree("A web developer", ["A web developer"]),
                 "docs/03-behaviors/01-core/01-boot.md": rows("A web developer") +
                   "\n```markdown\n| Id | Who | Does | Sees | Type | Tier | Status | Updated at |\n" +
                   "| --- | --- | --- | --- | --- | --- | --- | --- |\n" +
                   "| CORE.X.01 | An invented person | x | y | POSITIVE | UNIT | PLANNED | — |\n```\n" }), ["coverage", "."]),
      lacks("An invented person"));

  // EVERY NEW CHECK SHIPS SOFT. An agent once read a rule off a buggy check and renamed a page.
  one("every set-check finding is SOFT while the corpus crosses",
      run(repo(tree("A quality engineer", ["A web developer"])), ["coverage", "."]),
      (g) => !/^. RULE /m.test(g) && /0 RULE/.test(g));
}

// ---------------------------------------------------------------- nothing is joined

console.log("\n=== the produced page is the seat, and no register row is joined into it");
{
  // A construct types no proof (RD.DOCS.072). Its rows are read in the tests report, so a register
  // beside it changes nothing on its page — not a row, not a status, not a line naming the source.
  const rows = [["CORE.BOOT.01", "can boot a service", "UNIT", "PLANNED"],
                ["CORE.BOOT.02", "sees a clean shutdown", "INTEGRATION", "DONE"]];
  const ws = repo({
    "docs/02-constructs/01-core/01-boot.md": seat("boot"),
    "docs/03-behaviors/01-core/01-boot.md": register("b", rows),
  });
  const before = readAt(ws, "docs/02-constructs/01-core/01-boot.md");
  const out = run(ws, ["page", "docs/02-constructs/01-core/01-boot.md"]);
  const page = readAt(ws, "docs/artifacts/constructs/01-core/01-boot-construct.html");

  one("no register row reaches the page", page,
      (g) => !g.includes("CORE.BOOT.01") && !g.includes("CORE.BOOT.02"));
  one("and no line claims rows were joined", page, lacks("joined from the register"));
  one("the seat file on disk is untouched by production",
      readAt(ws, "docs/02-constructs/01-core/01-boot.md"), before);
  one("producing the page raises no proof finding", out, lacks("proof"));

  // THE TWO HALVES MUST AGREE ABOUT WHAT THE PAGE IS. `checkProduced` renders the same markdown
  // `page` does; if either added something the other did not, every produced page would read as
  // hand-edited the moment it was written.
  one("a page `page` just wrote does not audit as hand-edited", run(ws, ["audit", "docs"]),
      lacks("this page is not what `docs.ts page` produces"));
  one("and a page that really was hand-edited still is", (() => {
        // The produced page is found rather than named: the renderer decides the file name, and a
        // test that hard-codes it fails for the wrong reason the day that changes.
        const dir = join(ws, "docs/artifacts/constructs/01-core");
        const f = join(dir, readdirSync(dir).find((x) => x.endsWith(".html")));
        writeFileSync(f, `${readFileSync(f, "utf8")}\n<p>typed in by hand</p>\n`, "utf8");
        return run(ws, ["audit", "docs"]);
      })(),
      has("this page is not what `docs.ts page` produces"));

  // A domain-wide register is not joined either, and nothing reports a fallback that no longer exists.
  const ws2 = repo({
    "docs/02-constructs/01-core/01-boot.md": seat("boot"),
    "docs/03-behaviors/01-core/README.md": register("b", rows),
  });
  const out2 = run(ws2, ["page", "docs/02-constructs/01-core/01-boot.md"]);
  one("a domain register reaches no page",
      readAt(ws2, "docs/artifacts/constructs/01-core/01-boot-construct.html"), lacks("CORE.BOOT.01"));
  one("and no fallback is reported", out2, lacks("because this topic has no file of its own yet"));
}

console.log("\n=== a behaviour row typed into a seat's Proof is refused");
{
  const typed = "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| CORE.BOOT.01 | A person | boots | it booted | POSITIVE | UNIT | SUCCESS | — |\n";
  one("a register table in Proof is a RULE — the status lives in one place",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": seat("boot", { proof: typed }) }), ["audit", "docs"]),
      has("`Proof` carries a table of behaviour rows"));
  one("a typed check table is untouched by that rule",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": seat("boot", {
        proof: "| Check | Kind | What a green run shows |\n| --- | --- | --- |\n| `spnutils apps test unit` | gate | green |\n" }) }), ["audit", "docs"]),
      lacks("carries a table of behaviour rows"));
}

console.log("\n=== `figures check` takes a folder, the way `audit` does");
{
  // Given a folder it read the directory itself and died on EISDIR with a raw stack trace, which
  // reads as the tool being broken rather than as the argument being a folder. Found by a step 7
  // agent, which then ran it per file and said so rather than reporting the crash as a green.
  const page = (svg) => `<h1>p</h1>\n<figure><svg viewBox="0 0 100 60">${svg}</svg></figure>\n`;
  const clean = page('<rect x="10" y="10" width="40" height="20"/>');
  const ws = repo({
    "docs/artifacts/constructs/01-core/a-construct.html": clean,
    "docs/artifacts/constructs/01-core/b-construct.html": clean,
  });
  const out = run(ws, ["figures", "check", "docs/artifacts/constructs"]);
  one("a folder is every page under it, not a read of the directory", out, lacks("EISDIR"));
  one("and it says how many it judged", out, has("clean — 2 pages"));
  one("a path that is not there is named, not read",
      run(repo({ "docs/README.md": "# x\n" }), ["figures", "check", "docs/artifacts"]),
      (g) => /no such file or folder/.test(g) && !/ENOENT/.test(g));
  one("an empty folder says so rather than claiming clean",
      run(repo({ "docs/README.md": "# x\n" }, {}), ["figures", "check", "docs"]),
      has("clean — 1 page"));
}

console.log("\n=== a section is found by its whole name, not by its first word");
{
  const rows = "| Check | Kind | What a green run shows |\n| --- | --- | --- |\n| `spnutils apps test unit` | gate | green |\n";
  one("`Proof — how you check it` is the Proof section",
      run(repo({ "docs/02-constructs/01-core/01-boot.md":
        seat("boot").replace("## Proof\n", "## Proof — how you check it\n").replace(/## Proof — how you check it\n\nWhat proves it\.\n\n\n/, `## Proof — how you check it\n\n${rows}`) }), ["audit", "docs"]),
      lacks("carries a table of behaviour rows"));

  // An overview's `Proof Tiers` is a different section that happens to share a first word. Read as
  // Proof, its glossary rows were judged as proof rows — sixteen false findings on one page.
  const typed = "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| CORE.BOOT.01 | A person | boots | it booted | POSITIVE | UNIT | SUCCESS | — |\n";
  one("`Proof Tiers` is NOT the Proof section",
      run(repo({ "docs/02-constructs/01-core/01-boot.md":
        seat("boot").replace("## Proof\n\nWhat proves it.\n\n\n", `## Proof Tiers\n\n${typed}`) }), ["audit", "docs"]),
      lacks("carries a table of behaviour rows"));
  one("and a real Proof section is still judged",
      run(repo({ "docs/02-constructs/01-core/01-boot.md":
        seat("boot").replace("## Proof\n\nWhat proves it.\n\n\n", `## Proof\n\n${typed}`) }), ["audit", "docs"]),
      has("carries a table of behaviour rows"));
}

console.log("\n=== a spec that draws nothing is a finding, not a silence");
{
  // `figures check` judged the SVGs a page HAS. Eight foundation seats asked for the retired
  // `flow`; the drawer refuses it, the renderer then emits no figure element at all, and seven of
  // those pages carried no figure while nothing reported anything. A page missing a figure it
  // asked for looks exactly like a page that asked for none.
  const withSpec = (spec) => `# c\n\n\`\`\`dg\n${spec}\n\`\`\`\n`;
  // The spec carries a caption, because a spec without one is now a finding of its own and this
  // block is about whether a figure DRAWS. The caption gap has its own cases below.
  const good = '{ "kind": "map", "caption": "the two boxes and the link between them", "boxes": [{ "id": "a", "label": "A" }, { "id": "b", "label": "B" }], "links": [{ "from": "a", "to": "b", "label": "to" }] }';

  one("a seat whose spec draws is clean",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": withSpec(good) }), ["figures", "check", "docs"]),
      has("clean — 1 page"));
  one("a retired kind is named, rather than silently drawing nothing",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": withSpec(good.replace('"map"', '"flow"')) }), ["figures", "check", "docs"]),
      (g) => /spec1:/.test(g) && /flow/.test(g));
  one("a spec that is not valid JSON says so",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": withSpec('{ "kind": "map", oops }') }), ["figures", "check", "docs"]),
      has("not valid JSON"));
  one("and the finding names which spec on the page",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": withSpec(good) + "\n" + withSpec(good.replace('"map"', '"flow"')) }), ["figures", "check", "docs"]),
      has("spec2:"));
}

console.log("\n=== a figure that says nothing about itself is refused");
{
  // `05-artifacts.md § The figures` has asked for a caption since it was written — *a figure with
  // neither is decoration* — and nothing enforced it: 94 of the corpus's 150 specs carried neither
  // field, half of them in the book. It reported rather than refused for one sitting so the count
  // could be seen and could fall (N14 step 1); all 94 were authored in step 2, every repository
  // reads clean, and step 3 made it a RULE. These cases are what tells a report from a refusal.
  const withSpec = (spec) => `# c\n\n\`\`\`dg\n${spec}\n\`\`\`\n`;
  const boxes = '"boxes": [{ "id": "a", "label": "A" }, { "id": "b", "label": "B" }], "links": [{ "from": "a", "to": "b", "label": "to" }]';
  const mute = `{ "kind": "map", ${boxes} }`;
  const titled = `{ "kind": "map", "title": "a title", ${boxes} }`;
  const captioned = `{ "kind": "map", "caption": "what to notice", ${boxes} }`;
  const at = (spec) => repo({ "docs/02-constructs/01-core/01-boot.md": withSpec(spec) });
  // The exit CODE is half of what a SOFT means, and `run` above reports stdout alone.
  const statusOf = (root, args) => {
    try {
      execFileSync(process.execPath, [TOOL, ...args],
        { encoding: "utf8", cwd: root, env: { ...process.env, SPN_WORKSPACE: root, SPN_TEMPLATES: TEMPLATES } });
      return 0;
    } catch (e) { return e.status ?? -1; }
  };

  one("a spec with neither field is named, and the kind word a screen reader would announce with it",
      run(at(mute), ["figures", "check", "docs"]),
      (g) => /✗ RULE figure/.test(g) && /spec1:/.test(g) && /`map`/.test(g));
  one("it is counted as a RULE",
      run(at(mute), ["figures", "check", "docs"]),
      has("1 RULE, 0 SOFT"));
  one("and the command refuses, so no new figure joins the corpus without one",
      statusOf(at(mute), ["figures", "check", "docs"]), 1);
  // ONLY `caption` RENDERS A `<figcaption>` — `render.ts` reads that field alone and `title` becomes
  // the `aria-label`. A spec with a title only satisfies the words *neither title nor caption* and
  // still leaves the reader with no caption, so it is reported too.
  one("a `title` with no `caption` is refused too, because a title renders no caption",
      run(at(titled), ["figures", "check", "docs"]),
      (g) => /✗ RULE figure/.test(g) && /only a `caption` renders/.test(g));
  one("a spec that carries a caption is silent",
      run(at(captioned), ["figures", "check", "docs"]),
      has("clean — 1 page"));
  // A spec can fail both ways at once, and each fault is its own line. The retired kind reports
  // three of them — the kind, the caption, and the figure the page then never renders — so the
  // case names the faults rather than counting them, which a third rule would make wrong again.
  one("and a spec that draws nothing AND says nothing names both faults, not the first one",
      run(at(mute.replace('"map"', '"flow"')), ["figures", "check", "docs"]),
      (g) => /neither `title` nor `caption`/.test(g) && /`flow` is retired/.test(g)
             && /draws nothing/.test(g) && /0 SOFT/.test(g));
}

console.log("\n=== a code file's own RESTATES header is read, and a path that is not there is refused");
{
  // `restate-drift` read a DOCUMENT's `spn:restates` block and nothing else, so a `// RESTATES:`
  // header in code was outside its set — and FOURTEEN hook sources named a chapter that is not
  // there, nine of them under a folder N13 renamed, behind a green light (N15 step 2, 2026-09-22).
  const { headerSources } = await import("../../../src/scripts/lib/restates.ts");

  // THE CONTINUATION RULE IS WHAT BIT FIRST. The first version wanted an indent of two spaces,
  // because `split-plan.ts` wraps that way; six headers wrap at ONE space, so it read line two and
  // silently dropped the rest — an under-report by a check whose whole job is to stop one.
  const wrapped = [
    "// RESTATES: the foundation book — 02-document.md rule 9, and",
    "// 04-discipline.md § Voice discipline and 06-registers.md § Writing a row.",
    "//",
    "// Ordinary prose about 99-not-a-source.md, which is not part of the claim.",
  ].join("\n");
  one("a header wrapped at one space is read whole, not just its first line",
      headerSources(wrapped)[0].cited,
      (got) => got.join(" ") === "02-document.md 04-discipline.md 06-registers.md");
  one("and the prose after the bare `//` is not part of the claim",
      headerSources(wrapped)[0].cited, (got) => !got.includes("99-not-a-source.md"));
  one("a `RESTATES:` mid-line is a mention, not a header — a test fixture carries one",
      headerSources('const page = "## Boundary\\n<!-- RESTATES: a chapter -->";'), (got) => got.length === 0);
  one("a decision id is not a source, and neither is a plain word",
      headerSources("// RESTATES: RD.DOCS.055 and the layer promise, per docs/a/01-thing.md")[0].cited,
      (got) => got.length === 1 && got[0] === "docs/a/01-thing.md");
  one("a second header deeper in the file is found too",
      headerSources("// RESTATES: docs/a/01-x.md\n\ncode();\n\n// RESTATES: docs/b/02-y.md\n"),
      (got) => got.length === 2 && got[1].cited[0] === "docs/b/02-y.md");

  // END TO END, over a fixture tree: a path is a claim about a LOCATION and a bare name a claim
  // about EXISTENCE, so the two are judged differently. Judging both as paths reported six correct
  // headers as broken; judging both by name would have hidden all nine renamed ones.
  const bookAt = join(BASE, `hbook${made += 1}`);
  for (const [rel, body] of Object.entries({
    "docs/registers/decisions.md": "# decisions\n\n| RD.DOCS.055 | a row |\n",
    "CONCEPT.md": "# c\n",
    "docs/04-capabilities/01-devex/05-real.md": "# real\n",
  })) {
    mkdirSync(join(bookAt, rel, ".."), { recursive: true });
    writeFileSync(join(bookAt, rel), body, "utf8");
  }
  const pluginAt = join(BASE, `hplug${made += 1}`);
  const write = (rel, body) => {
    mkdirSync(join(pluginAt, rel, ".."), { recursive: true });
    writeFileSync(join(pluginAt, rel), body, "utf8");
  };
  write("plugins/spn-x/refs/a.md", "# a ref\n");
  write("plugins/spn-x/hooks/good.ts", "// RESTATES: docs/04-capabilities/01-devex/05-real.md § A part\n");
  write("plugins/spn-x/hooks/bare.ts", "// RESTATES: 05-real.md § A part, named without a path\n");
  write("plugins/spn-x/hooks/bad.ts", "// RESTATES: docs/04-capabilities/01-gone/05-real.md § A part\n");
  const drift = (args) => {
    try {
      return { out: execFileSync(process.execPath, [resolve(PLUGIN, "src", "scripts", "tools", "restate-drift.ts"), ...args],
        { encoding: "utf8", cwd: pluginAt }), status: 0 };
    } catch (e) { return { out: String(e.stdout ?? ""), status: e.status ?? -1 }; }
  };
  const run2 = drift([bookAt]);
  one("a header naming a path that is not there is reported",
      run2.out, has("plugins/spn-x/hooks/bad.ts"));
  one("and the finding names where that file actually is, so the fix is in the message",
      run2.out, has("that name is at"));
  one("a header naming a real path is silent",
      run2.out, lacks("good.ts"));
  one("a bare name is judged on whether the file EXISTS, not on where it sits",
      run2.out, lacks("bare.ts"));
  one("one broken header, counted", run2.out, has("1 broken header"));
  one("and the command refuses, so a renamed chapter cannot pass unnoticed again",
      run2.status, (got) => got !== 0);
}

console.log("\n=== a repository is never the book it restates");
{
  // `findBook` names the book by what it CARRIES — a decisions register and a concept — and reads
  // the siblings of its own parent, which includes itself. The marketplace earned both the day it
  // was documented as a GENERAL repository, so the bare command compared the plugins against
  // their own repository's docs and reported 77 drifts that were not drift at all.
  const { findBook } = await import("../../../src/scripts/tools/restate-drift.ts");
  const book = (name) => ({
    [`${name}/docs/registers/decisions.md`]: "# decisions\n",
    [`${name}/CONCEPT.md`]: "# c\n",
  });
  const parent = join(BASE, `books${made += 1}`);
  for (const [rel, body] of Object.entries({ ...book("self"), ...book("the-book") })) {
    const full = join(parent, rel);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, body, "utf8");
  }
  one("the repository being checked is skipped, even though it carries both files",
      findBook(undefined, join(parent, "self")), join(parent, "the-book"));
  one("and an explicit argument is still honoured",
      findBook(join(parent, "self"), join(parent, "self")), join(parent, "self"));
  // With a sibling that also carries both, `the-book` finds `self` — which is right: the test is
  // what a repository CARRIES, and a second book beside you is a candidate. What must never
  // happen is finding yourself.
  const alone = join(BASE, `alone${made += 1}`, "only");
  for (const [rel, body] of Object.entries({ "docs/registers/decisions.md": "# d\n", "CONCEPT.md": "# c\n" })) {
    mkdirSync(join(alone, rel, ".."), { recursive: true });
    writeFileSync(join(alone, rel), body, "utf8");
  }
  one("a repository with no sibling book finds none, rather than itself",
      findBook(undefined, alone), null);
}

console.log("\n=== a code figure names a PATH; a bare file name is a term");
{
  const withFig = (name) =>
    "<!-- spn:doc\n" + JSON.stringify({ id: "c", variant: "construct", title: "C", lenses: ["ARCHITECT"], status: "DONE", summary: "s" }) + "\n-->\n\n" +
    "# C\n\n`For: Architect` · `Status: ✅ DONE`\n\n" +
    `<p>The manifest <code>${name}</code> declares it:</p>\n<pre>{ "kind": "MODULE_SERVER" }</pre>\n`;
  one("a bare file name is not read as a path to open",
      run(repo({ "docs/artifacts/constructs/01-core/a-construct.html": withFig("spkind.json") }), ["audit", "docs"]),
      lacks("no such file exists"));
  one("a real path that is not there is still a RULE",
      run(repo({ "docs/artifacts/constructs/01-core/a-construct.html": withFig("packages/gone/spkind.json") }), ["audit", "docs"]),
      has("a figure names `packages/gone/spkind.json`, and no such file exists"));
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
    "docs/02-constructs/01-apps/01-shape.md": seat("apps-shape"),
    "docs/02-constructs/02-infra/01-shape.md": seat("estate-shape"),
    "docs/03-behaviors/01-apps/01-shape.md": register("b1", [["APPS.SHAPE.01", "x", "UNIT", "PLANNED"]]),
    "docs/03-behaviors/02-infra/01-shape.md": register("b2", [["INFRA.SHAPE.01", "y", "UNIT", "PLANNED"]]),
  };
  one("one name in two domains, with a rows file under each, is clean",
      run(repo(two), ["topics", "."]), has("clean — 1 repository"));

  one("and a third domain nothing names is still a RULE",
      run(repo({ ...two, "docs/03-behaviors/03-other/01-shape.md": register("b3", [["OTHER.SHAPE.01", "z", "UNIT", "PLANNED"]]) }), ["topics", "."]),
      (g) => /`shape` sits under `03-other` here and under/.test(g) && /`01-apps`/.test(g) && /`02-infra`/.test(g));
}

console.log("\n=== one id names one document");
{
  const doc2 = (id, title) => doc({ id, variant: "capability", title, lenses: ["SERVER_DEV"], status: "DONE" });
  one("two documents under one id are a RULE, and both are named",
      run(repo({
        "docs/04-capabilities/01-core/pkg-ts/README.md": doc2("pkg-caps", "Capabilities — pkg-ts"),
        "docs/04-capabilities/01-core/pkg-ts/01-boot.md": doc2("pkg-caps", "boot in pkg-ts"),
      }), ["topics", "."]),
      (g) => /`pkg-caps` is the id of 2 documents/.test(g) && (g.match(/RULE ids/g) ?? []).length === 2);

  one("a tree where every id is its own is clean",
      run(repo({
        "docs/04-capabilities/01-core/pkg-ts/README.md": doc2("pkg-caps", "Capabilities — pkg-ts"),
        "docs/04-capabilities/01-core/pkg-ts/01-boot.md": doc2("pkg-boot", "boot in pkg-ts"),
      }), ["topics", "."]),
      has("clean — 1 repository"));

  one("three documents under one id say three, not two",
      run(repo({
        "docs/04-capabilities/01-core/a/README.md": doc2("same", "A"),
        "docs/04-capabilities/01-core/b/README.md": doc2("same", "B"),
        "docs/04-capabilities/01-core/c/README.md": doc2("same", "C"),
      }), ["topics", "."]),
      has("`same` is the id of 3 documents"));

  // A template carries a placeholder id and is excluded from every walk by folder, not per file.
  one("a template's placeholder id is not a collision",
      run(repo({
        "docs/04-capabilities/01-core/pkg-ts/README.md": doc2("pkg-caps", "Capabilities — pkg-ts"),
        "docs/04-capabilities/templates/capability-template.md": doc2("pkg-caps", "A template"),
      }), ["topics", "."]),
      has("clean — 1 repository"));
}

console.log("\n=== `face` over a capability seat writes the chapters' own shape");
{
  const chapter = (name, realizes, status = "DONE") =>
    "<!-- spn:doc\n" + JSON.stringify({ id: `pkg-${realizes}`, variant: "capability", title: `${realizes} in pkg-ts`,
      lenses: ["SERVER_DEV"], status, realizes: [realizes], summary: `What pkg-ts does for ${realizes}.` }) + "\n-->\n\n" +
    `# ${realizes} in pkg-ts\n\n\`For: Backend developer\` · \`Status: ✅ ${status}\` · \`Realizes: ${realizes}\`\n\n## Where\n\nIn the package.\n`;
  const face = (title) =>
    "<!-- spn:doc\n" + JSON.stringify({ id: "pkg-capabilities", variant: "capability", title,
      lenses: ["SERVER_DEV"], status: "DONE", summary: "The constructs pkg-ts realizes." }) + "\n-->\n\n" +
    `# ${title}\n\n\`For: Backend developer\` · \`Status: ✅ DONE\`\n\n` +
    "<!-- spn:generated contents — do not edit inside these markers; `docs.ts face` writes it -->\n" +
    "<!-- /spn:generated contents -->\n";

  const ws = repo({
    "CONCEPT.md": "# c\n",
    "docs/02-constructs/01-core/01-boot.md": seat("boot"),
    "docs/04-capabilities/README.md": face("Capabilities"),
    "docs/04-capabilities/01-core/README.md": face("Capabilities — core"),
    "docs/04-capabilities/01-core/pkg-ts/README.md": face("Capabilities — pkg-ts"),
    "docs/04-capabilities/01-core/pkg-ts/01-boot.md": chapter("01-boot.md", "boot"),
    "docs/04-capabilities/01-core/pkg-ts/02-log.md": chapter("02-log.md", "log"),
  });
  run(ws, ["face", "docs"]);
  const pkgFace = readAt(ws, "docs/04-capabilities/01-core/pkg-ts/README.md");

  // A CHAPTER REALIZES A CONSTRUCT; IT GOVERNS NO SOURCE FOLDER. The mirror-per-folder Map derived
  // `src/01-boot/` from a chapter's file name and named a folder that does not exist.
  one("a package face's Map names the construct each chapter realizes", pkgFace,
      (g) => /\| Chapter \| Realizes \| Carries \| Status \|/.test(g));
  one("and never invents a src folder from a chapter's file name", pkgFace, lacks("src/01-boot"));
  one("every chapter beside it is a row", pkgFace,
      (g) => g.includes("01-boot.md") && g.includes("02-log.md"));

  // The bug a 6b agent found by probing rather than by trusting: the tag-line pattern ended at the
  // Status chip, so a `Realizes:` chip made it miss and write a SECOND tag line under the title.
  const ch = readAt(ws, "docs/04-capabilities/01-core/pkg-ts/01-boot.md");
  one("a chapter carrying a Realizes chip keeps exactly one tag line", ch,
      (g) => (g.match(/^`For:/gm) ?? []).length === 1);
  one("and the chip the author added survives the rewrite", ch, has("· `Realizes: boot`"));
  one("running face twice writes the same bytes", (run(ws, ["face", "docs"]), readAt(ws, "docs/04-capabilities/01-core/pkg-ts/01-boot.md")), ch);

  // A seat-level face is still the older shape, because it lists domains and not chapters.
  one("a seat face is not turned into a chapter list",
      readAt(ws, "docs/04-capabilities/README.md"), lacks("| Chapter | Realizes |"));
}

// ---------------------------------------------------------------- the status a run writes (Q107)

console.log("\n=== the plugins' own run writes the two cells a run owns, and no others");
{
  // The one writer, run the way this repository's own runner runs it: the whole tier, one artifact.
  const STATUS = resolve(PLUGIN, "src", "scripts", "tools", "behaviour-rows.ts");
  const results = (rows, tiers = ["UNIT"]) => {
    const f = join(BASE, `res${made}-${Math.random().toString(36).slice(2)}.json`);
    writeFileSync(f, JSON.stringify({ env: "local", tiers, ranAt: "2026-09-22T00:00:00.000Z", from: "t", results: rows }), "utf8");
    return f;
  };
  const status = (root, file, extra = []) => {
    try {
      return execFileSync(process.execPath, [STATUS, "--write", "--reach", "repository", "--results", file, root], { encoding: "utf8" });
    } catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
  };

  // Nine cells, `Where` included — the grammar the chapter states today. A parser pinned to the
  // older eight would see no register here and report a confident zero.
  const nine = (rows) =>
    "<!-- spn:doc\n" + JSON.stringify({ id: "b", variant: "behaviors", title: "b", lenses: ["QA"], status: "PLANNING", summary: "s" }, null, 2) + "\n-->\n\n# b\n\n" +
    "| Id | Who | Does | Sees | Where | Type | Tier | Status | Updated at |\n" +
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n" +
    rows.map((r) => `| ${r[0]} | A person | does | sees | pkg | POSITIVE | ${r[1]} | ${r[2]} | ${r[3] ?? "—"} |\n`).join("");

  const ws = repo({ "docs/03-behaviors/01-core/01-boot.md": nine([
    ["MKT.DOCS.01", "UNIT", "PLANNED"],
    ["MKT.DOCS.02", "UNIT", "PLANNED"],
    ["MKT.DOCS.03", "UNIT", "MANUAL"],
    ["MKT.DOCS.04", "JOURNEY", "PLANNED"],
    ["MKT.DOCS.05", "UNIT", "SUCCESS", "2026-01-01T00:00:00.000Z"],
  ]) });
  const out = status(ws, results([
    { id: "MKT.DOCS.01", tier: "UNIT", status: "SUCCESS", title: "[MKT.DOCS.01] it works" },
    { id: "MKT.DOCS.02", tier: "UNIT", status: "FAILED", title: "[MKT.DOCS.02] it does not" },
    { id: "MKT.DOCS.03", tier: "UNIT", status: "SUCCESS", title: "[MKT.DOCS.03] a hand check" },
  ]));
  const reg = readAt(ws, "docs/03-behaviors/01-core/01-boot.md");
  one("a nine-cell register is read, not skipped for its width", out, has("MKT.DOCS.01"));
  one("a proven row becomes SUCCESS", reg, (g) => /MKT\.DOCS\.01 \|.*\| SUCCESS \|/.test(g));
  one("a failing case makes the row FAILED, not absent", reg, (g) => /MKT\.DOCS\.02 \|.*\| FAILED \|/.test(g));
  one("MANUAL is never written over, even by a green case", reg, (g) => /MKT\.DOCS\.03 \|.*\| MANUAL \|/.test(g));
  one("a row in a tier this run did not cover is left alone", reg, (g) => /MKT\.DOCS\.04 \|.*\| PLANNED \|/.test(g));
  // A row no result names has no case citing it any more, so it goes back to what a row is at
  // birth — the book's rule, "delete a case and its row falls back to PLANNED".
  one("a row in a covered tier that nothing named goes back to PLANNED", reg, (g) => /MKT\.DOCS\.05 \|.*\| PLANNED \|/.test(g));
  one("Updated at moves with the status", reg, has("2026-09-22T00:00:00.000Z"));
  one("a row nobody proved keeps the date it had", reg, (g) => !/MKT\.DOCS\.04 \|.*2026-09-22/.test(g));

  // Read-only by default, and the count is the exit code so a pipeline can gate on drift.
  const ws2 = repo({ "docs/03-behaviors/01-core/01-boot.md": nine([["MKT.DOCS.01", "UNIT", "PLANNED"]]) });
  const before = readAt(ws2, "docs/03-behaviors/01-core/01-boot.md");
  let code = 0;
  try {
    execFileSync(process.execPath, [STATUS, "--reach", "repository", "--results", results([{ id: "MKT.DOCS.01", tier: "UNIT", status: "SUCCESS", title: "t" }]), ws2], { encoding: "utf8" });
  } catch (e) { code = e.status; }
  one("without --write nothing on disk changes", readAt(ws2, "docs/03-behaviors/01-core/01-boot.md"), before);
  one("and the exit code is the number of rows that would change", code, 1);

  // One red among several greens is a red row.
  const ws3 = repo({ "docs/03-behaviors/01-core/01-boot.md": nine([["MKT.DOCS.01", "UNIT", "PLANNED"]]) });
  status(ws3, results([
    { id: "MKT.DOCS.01", tier: "UNIT", status: "SUCCESS", title: "a" },
    { id: "MKT.DOCS.01", tier: "UNIT", status: "FAILED", title: "b" },
  ]));
  one("a row proved by several cases is green only when every one of them is",
      readAt(ws3, "docs/03-behaviors/01-core/01-boot.md"), (g) => /MKT\.DOCS\.01 \|.*\| FAILED \|/.test(g));
}

// -------------------------------------------- the status a construct derives (decision `E`)

console.log("\n=== a construct's status rolls up the behaviour rows at its own path");
{
  // THE KNOWN-BAD IS BAD IN THE DERIVATION'S OWN TERMS: the block claims a word the rows do not
  // carry. A generic wrong-looking page proves nothing here, because the only input is the rows.
  const tree = (rows, status = "PLANNING") => ({
    "docs/02-constructs/01-core/01-boot.md":
      seat("c-boot").replace('"status": "PLANNING"', `"status": "${status}"`),
    "docs/03-behaviors/01-core/01-boot.md": register("b-boot", rows),
  });
  const derived = (root) => run(root, ["status", "--check", "docs/02-constructs/01-core/01-boot.md"]);

  one("every row PLANNED derives PLANNING",
    derived(repo(tree([["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]))), has("current") );
  // THE LINE SAYS WHAT IT READ. A derived word with no input named is a claim a reader cannot check.
  one("and the line names the row count and the file the rows came from",
    derived(repo(tree([["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]))),
    (g) => /PLANNING from 1 row\(s\) in /.test(g) && /03-behaviors\/01-core\/01-boot/.test(g));

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
      "docs/02-constructs/01-core/01-boot.md": seat("c-boot"),
      "docs/03-behaviors/01-core/01-boot.md": register("b-boot", [["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]) +
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
    "docs/02-constructs/01-core/01-boot.md": seat("c-boot", {
      binds: "| Repo | Node | What it realizes | State |\n| --- | --- | --- | --- |\n| t | pkg-ts | it | done |\n",
      proof: "| Check | Kind | What a green run shows |\n| --- | --- | --- |\n| `spnutils apps test` | gate | it |\n",
    }),
    "docs/03-behaviors/01-core/01-boot.md": register("b-boot", [["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]),
  };
  one("a done realization row no longer lifts the status — only a run does",
    derived(repo(bindsDone)), has("current"));

  // AN ABSENT FILE AND AN EMPTY ONE ARE DIFFERENT ANSWERS, and stamping PLANNING for both would
  // report a measurement where there was no input.
  one("no behaviours file at the mirrored path claims nothing, and says so",
    derived(repo({ "docs/02-constructs/01-core/01-boot.md": seat("c-boot") })),
    (g) => /no behaviours file at this construct's own path/.test(g) && !/derive/.test(g));
}

console.log("\n=== a FOUNDATION construct derives no status at all");
{
  const book = (extra = {}) => repo({
    "docs/02-constructs/01-core/01-boot.md": seat("c-boot"),
    "docs/03-behaviors/01-core/01-boot.md": doc(
      { id: "b-boot", variant: "behaviors", title: "b-boot", lenses: ["QA"], status: "PLANNING" },
      "| Id | Who | Does | Sees | Type |\n| --- | --- | --- | --- | --- |\n" +
      "| CORE.BOOT.01 | A person | can boot | a result | PROMISE |\n"),
    ...extra,
  }, { type: "FOUNDATION" });

  const root = book();
  one("the check names the word the page carries and nothing derives",
    run(root, ["status", "--check", "docs/02-constructs/01-core/01-boot.md"]),
    has("carries no `status`"));

  run(root, ["status", "docs/02-constructs/01-core/01-boot.md"]);
  const after = readAt(root, "docs/02-constructs/01-core/01-boot.md");
  one("a write strips the field from the block", after, lacks('"status"'));
  one("and strips the chip from the tag line", after, lacks("Status:"));
  one("and leaves the For line standing", after, has("`For: Architect`"));
  one("running it again is quiet", run(root, ["status", "--check", "docs/02-constructs/01-core/01-boot.md"]),
    lacks("carries no `status`"));

  // `status` AS THE FIRST KEY IS THE EDGE THE COMMA RULE EXISTS FOR. Taking the leading comma
  // unconditionally leaves `{ , "id": …` and the block stops parsing at all.
  const first = repo({
    "docs/02-constructs/01-core/01-boot.md": "<!-- spn:doc\n" +
      JSON.stringify({ status: "PLANNING", id: "c-boot", variant: "construct", title: "c-boot",
                       lenses: ["ARCHITECT"], dependsOn: [], summary: "What c-boot is." }, null, 2) +
      "\n-->\n\n# c-boot\n\n`For: Architect` · `Status: 🔮 PLANNING`\n\n" +
      "## Overview\n\nwhy\n\n## Terms\n\nt\n\n## Model\n\nm\n\n## Parts\n\np\n\n## Boundary\n\nb\n",
    "docs/03-behaviors/01-core/01-boot.md": register("b", []),
  }, { type: "FOUNDATION" });
  run(first, ["status", "docs/02-constructs/01-core/01-boot.md"]);
  one("stripping a leading `status` leaves a block that still parses",
    run(first, ["audit", "docs/02-constructs/01-core/01-boot.md"]), lacks("spn:doc"));
  one("and the field is gone", readAt(first, "docs/02-constructs/01-core/01-boot.md"), lacks('"status"'));

  // THE AUDIT DOES NOT SAY IT TOO. `status` owns the fault and fixes it; reporting it from the block
  // check and from the header it renders put 204 findings on the book where there had been one.
  one("the audit stays out of it — one fault, one command",
    run(book(), ["audit", "docs/02-constructs/01-core/01-boot.md"]), lacks("carries no `status`"));

  // A CHIP THE BLOCK DOES NOT DECLARE IS A PAGE NOBODY RE-RENDERED, and that is the audit's fault.
  const stale = repo({ "docs/02-constructs/01-core/01-boot.md":
    seat("c-boot").replace(/,?\s*"status": "PLANNING"/, "") }, { type: "FOUNDATION" });
  one("a chip left standing over a block with no status is refused",
    run(stale, ["audit", "docs/02-constructs/01-core/01-boot.md"]),
    has("the block declares no status"));

  // The same page in an APPS repository still derives a word — the world is what decides.
  one("the rule is the repository's world, not the file's shape",
    run(repo({ "docs/02-constructs/01-core/01-boot.md": seat("c-boot"),
               "docs/03-behaviors/01-core/01-boot.md": register("b", [["CORE.BOOT.01", "x", "UNIT", "SUCCESS"]]) }),
        ["status", "--check", "docs/02-constructs/01-core/01-boot.md"]),
    has("derive `DONE`"));
}

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
