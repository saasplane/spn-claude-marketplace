import { PLUGIN } from "../../../../helpers/harness.mjs";
// `coherence` CITATION — does every id cited resolve to exactly one place in the workspace?
//
// The question exists because `N76` found two ids cited in the foundation book with no row behind
// them, and neither had ever been reported. A citation to a missing place is the one register failure
// a reader cannot work around: every other finding leaves two answers to choose between, and this
// one leaves none. It is also silent — `DEC.SUPPORT.APPS.020` reads exactly like a row that exists
// until somebody opens the register and searches.
//
// An id is `RULE.<AREA>.<DOMAIN>.<NNN>`, written once as `(rule RULE.…)` on the rule's sentence in a
// chapter, or `DEC.<AREA>.<DOMAIN>.<NNN>`, written once as a register row's first cell. These cases
// fix the answers that matter, because the check ships SOFT and a SOFT check nobody trusts is a SOFT
// check nobody reads:
//
//   a clean tree reports nothing        — otherwise the finding is noise and gets filtered away
//   one dangling id reports once        — naming the id AND the file, because the file is the fix
//   an id that resolves twice, an id written as a link, and any `RD.` id are findings too
//   a workspace holding no rule and no row is silent — a partner holds the plugins and neither the
//                                         book nor its register, and a tool that fired there would be
//                                         red everywhere by default
//
// The fixture is written rather than copied from the corpus on purpose. A test whose input is the
// live book passes for whatever reason the book happens to be in today.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync, renameSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { ARTIFACT, CONSTRUCT_PAGES, POCKET, SEAT } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { FINDINGS } from "../../../../../src/scripts/commands/docs/coherence.ts";

const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-coherence-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let n = 0, failed = 0;

function one(label, ok) {
  n += 1;
  if (!ok) { failed += 1; console.log(`  FAIL  ${label}`); }
}

/** One `docs coherence check` of a path through the entry, with what follows the path. A refusal's text is handed back with the rest. */
let WORKSPACE = null;
function run(root, ...more) {
  try { return execFileSync(process.execPath, [TOOL, "docs", "coherence", "check", root, ...more], { encoding: "utf8", stdio: "pipe", env: { ...process.env, SPN_WORKSPACE: WORKSPACE ?? resolve(root) } }); }
  catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
}

function tree(name, pageBody, withRegister = true) {
  const root = join(BASE, name);
  mkdirSync(join(root, "docs", POCKET.registers), { recursive: true });
  mkdirSync(join(root, "docs", SEAT.constructs), { recursive: true });
  if (withRegister)
    writeFileSync(join(root, "docs", POCKET.registers, "decisions.md"),
      "# Decisions\n\n| # | Decision | Why | Date |\n| --- | --- | --- | --- |\n" +
      "| DEC.DEVEX.WORKSPACE.155 | A thing is so. | Because a fixture needs a row that exists. | 2026-09 |\n");
  writeFileSync(join(root, "docs", SEAT.constructs, "a.md"), pageBody);
  return root;
}

/** Write one file into a fixture tree, making the folders it needs. */
function mk(root, relative, body) {
  const at = join(root, relative);
  mkdirSync(dirname(at), { recursive: true });
  writeFileSync(at, body);
}

// 0 — the new shape: a RULE id resolves to its sentence, a DEC id to its row, each exactly once.
const ruleSentence = "A page MUST choose by its size (rule RULE.SUPPORT.SURFACE.075).\n";
const rules = tree("rules", "# A page\n\nIt cites RULE.SUPPORT.SURFACE.075 and DEC.DEVEX.WORKSPACE.155.\n");
mk(rules, `docs/${SEAT.constructs}/b.md`, `# B\n\n${ruleSentence}`);
one("a RULE id with its sentence and a DEC id with its row report no CITATION finding", !run(rules).includes("CITATION"));

const noSentence = tree("no-sentence", "# A page\n\nIt cites RULE.SUPPORT.SURFACE.076.\n");
mk(noSentence, `docs/${SEAT.constructs}/b.md`, `# B\n\n${ruleSentence}`);
const noSentenceOut = run(noSentence);
one("a RULE id no chapter carries is reported as resolving nowhere",
  /CITATION\s+1 id\(s\)/.test(noSentenceOut) && noSentenceOut.includes("RULE.SUPPORT.SURFACE.076 — resolves nowhere"));

const twice = tree("twice", "# A page\n\nIt cites RULE.SUPPORT.SURFACE.075.\n");
mk(twice, `docs/${SEAT.constructs}/b.md`, `# B\n\n${ruleSentence}`);
mk(twice, `docs/${SEAT.constructs}/c.md`, `# C\n\n${ruleSentence}`);
one("a RULE id two sentences carry is reported as resolving twice", run(twice).includes("RULE.SUPPORT.SURFACE.075 — resolves 2 times"));

const decTwice = tree("dec-twice", "# A page\n\nIt cites DEC.DEVEX.WORKSPACE.155.\n");
writeFileSync(join(decTwice, "docs", POCKET.registers, "decisions.md"),
  readFileSync(join(decTwice, "docs", POCKET.registers, "decisions.md"), "utf8") +
  "| DEC.DEVEX.WORKSPACE.155 | The same row again. | Because a fixture needs a duplicate. | 2026-09 |\n");
one("a DEC id two rows carry is reported as resolving twice", run(decTwice).includes("DEC.DEVEX.WORKSPACE.155 — resolves 2 times"));

const linked = tree("linked", "# A page\n\nIt cites [RULE.SUPPORT.SURFACE.075](../registers/decisions.md).\n");
mk(linked, `docs/${SEAT.constructs}/b.md`, `# B\n\n${ruleSentence}`);
one("an id written as a link is reported", run(linked).includes("RULE.SUPPORT.SURFACE.075 — written as a link"));

const retired = tree("retired", "# A page\n\nIt cites RD.SUPPORT.SURFACE.075.\n");
one("an RD id is reported, whatever the workspace holds", run(retired).includes("RD.SUPPORT.SURFACE.075 — an `RD.` id"));

{
  // The book states the rule and a second repository cites it: the id resolves across the workspace.
  const ws = join(BASE, "cross");
  const book = join(ws, "spn-foundation");
  mk(book, `docs/${SEAT.constructs}/b.md`, `# B\n\n${ruleSentence}`);
  mk(book, "sprepo.json", '{"type":"FOUNDATION","name":"spn-foundation","config":null}');
  const marketplace = join(ws, "spn-claude-marketplace");
  mk(marketplace, "sprepo.json", '{"type":"GENERAL","name":"m","config":null}');
  mk(marketplace, `docs/${SEAT.constructs}/a.md`, "# A\n\nIt cites RULE.SUPPORT.SURFACE.075 and RULE.SUPPORT.SURFACE.999.\n");
  WORKSPACE = ws;
  const crossOut = run(marketplace);
  WORKSPACE = null;
  one("a RULE id the book states resolves from a sibling repository, and one nothing states does not",
    /CITATION\s+1 id\(s\)/.test(crossOut) && crossOut.includes("RULE.SUPPORT.SURFACE.999 — resolves nowhere")
      && !crossOut.includes("RULE.SUPPORT.SURFACE.075 —"));
}

// 1 — every citation resolves, so the check says nothing at all.
const clean = tree("clean", "# A page\n\nThis cites DEC.DEVEX.WORKSPACE.155, which the register carries.\n");
one("a tree whose citations all resolve reports no CITATION finding",
  !run(clean).includes("CITATION"));

// 2 — one dangling id, reported once, naming the id and the file that cites it.
const dangling = tree("dangling",
  "# A page\n\nThis cites DEC.DEVEX.WORKSPACE.155, which exists, and DEC.SUPPORT.GOV.999, which does not.\n");
const out = run(dangling);
one("a dangling id is reported", out.includes("CITATION"));
one("the finding names the dangling id", out.includes("DEC.SUPPORT.GOV.999"));
one("the finding names the file citing it", out.includes(`docs/${SEAT.constructs}/a.md`));
one("a resolving id in the same file is not reported", !out.includes("DEC.DEVEX.WORKSPACE.155 —"));
one("one dangling id counts as one", /CITATION\s+1 id\(s\)/.test(out));

// 3 — a repository with no register is not this question's business. The marketplace and the
//     estate repos carry none, and a tool that fired there would be red everywhere by default.
const noRegister = tree("no-register", "# A page\n\nThis cites DEC.SUPPORT.GOV.999.\n", false);
one("a repository with no register reports nothing", !run(noRegister).includes("CITATION"));

// 4 — the id must be a whole id. A three-digit sequence is the register's own grammar, and a
//     looser match would report prose like "DEC.GOV.1" that no reader would call a citation.
const partial = tree("partial", "# A page\n\nThis mentions DEC.GOV.1 and DEC.DEVEX.WORKSPACE.155.\n");
one("a short id is not read as a citation", !run(partial).includes("CITATION"));

// ── the RULING question ───────────────────────────────────────────────────────────────────────
//
// A register row states one ruling, and a row burying a second complete claim past its opening one
// is a finding. A register carries FIVE columns — `# | Construct | Decision | Why | Date` — not
// four, and reading the wrong cell as the ruling text is the known-bad case here: a four-cell
// positional read takes the SECOND cell (`Construct`, a short label like `ideate`) as the ruling,
// so a buried second claim sitting in the THIRD cell (`Decision`), where every register actually
// writes it, was never reached.
function rulingTree(name, id) {
  const root = join(BASE, name);
  mkdirSync(join(root, "docs", POCKET.registers), { recursive: true });
  writeFileSync(join(root, "docs", POCKET.registers, "decisions.md"),
    "# Decisions\n\n| # | Construct | Decision | Why | Date |\n| --- | --- | --- | --- | --- |\n" +
    `| ${id} | ideate | **The opening claim states the ruling.** **A buried second ruling states ` +
    `its own complete claim right here.** | because a fixture needs a reason | 2026-09 |\n`);
  return root;
}

// 5 — the retired form (`RD.<DOMAIN>.<NNN>`) is no decision id, so its row is not read as a ruling.
const rulingRetired = rulingTree("ruling-retired", "RD.SUPPORT.GOV.100");
one("a buried ruling under a retired id is not read as a ruling", !run(rulingRetired).includes("RULING"));

// 6 — a decision id (`DEC.<AREA>.<DOMAIN>.<NNN>`), same shape.
const rulingFour = rulingTree("ruling-four", "DEC.DEVEX.WORKSPACE.201");
one("a buried ruling under a four-part id is reported", run(rulingFour).includes("RULING"));

// 7 — one ruling, nothing buried: the header read locates the real Decision cell rather than
//     reporting on every row by construction.
const rulingClean = join(BASE, "ruling-clean");
mkdirSync(join(rulingClean, "docs", POCKET.registers), { recursive: true });
writeFileSync(join(rulingClean, "docs", POCKET.registers, "decisions.md"),
  "# Decisions\n\n| # | Construct | Decision | Why | Date |\n| --- | --- | --- | --- | --- |\n" +
  "| DEC.SUPPORT.GOV.101 | ideate | A single plain ruling with nothing bolded past it. | because | 2026-09 |\n");
one("a register with no buried ruling reports no RULING finding", !run(rulingClean).includes("RULING"));

// ── the capability-chapter question ───────────────────────────────────────────────────────────
//
// A construct says what a thing IS; a capability chapter says what it is held to. A construct with
// no chapter is a model nothing can measure, and neither tree shows the gap on its own.
//
// THE SHAPES ARE THE HARD PART, and the check was wrong about two of them before it shipped. A
// chapter may be a FILE, a FOLDER of chapters, or a folder of FOLDERS whose chapters sit a level
// down. Counting only folders called eight stages missing; counting only a folder's top level
// called five more missing, because `03-module/` holds `01-server/` and `02-web/` and a face.

// 5 — a construct whose chapter is a flat file is held.
const flat = tree("flat", "", false);
mk(flat, `docs/${SEAT.constructs}/01-a/01-b/01-thing.md`, "# Thing\n");
mk(flat, `docs/${SEAT.capabilities}/01-a/01-b/01-thing.md`, "# Thing — the standard\n");
one("a chapter that is a flat file counts", !run(flat).includes("CHAPTER"));

// 6 — a folder of chapters is held.
const folder = tree("folder", "", false);
mk(folder, `docs/${SEAT.constructs}/01-a/01-b/01-thing.md`, "# Thing\n");
mk(folder, `docs/${SEAT.capabilities}/01-a/01-b/01-thing/01-part.md`, "# A part\n");
one("a chapter that is a folder counts", !run(folder).includes("CHAPTER"));

// 7 — a folder of FOLDERS is held. This is the shape that produced five false findings.
const nested = tree("nested", "", false);
mk(nested, `docs/${SEAT.constructs}/01-a/01-b/01-thing.md`, "# Thing\n");
mk(nested, `docs/${SEAT.capabilities}/01-a/01-b/01-thing/README.md`, "# Thing\n");
mk(nested, `docs/${SEAT.capabilities}/01-a/01-b/01-thing/01-server/01-part.md`, "# A part\n");
one("a chapter nested a level down counts", !run(nested).includes("CHAPTER"));

// 8 — AND THE CHECK STILL FIRES. A question that cannot be made to answer is not a question.
const bare = tree("bare", "", false);
mk(bare, `docs/${SEAT.constructs}/01-a/01-b/01-thing.md`, "# Thing\n");
mk(bare, `docs/${SEAT.capabilities}/01-a/01-b/README.md`, "# The group\n");
one("a construct with no chapter anywhere is reported", run(bare).includes("CHAPTER"));

// 9 — a face alone is not a chapter. This is what makes case 8 a real gap rather than a naming one.
const faceOnly = tree("face-only", "", false);
mk(faceOnly, `docs/${SEAT.constructs}/01-a/01-b/01-thing.md`, "# Thing\n");
mk(faceOnly, `docs/${SEAT.capabilities}/01-a/01-b/01-thing/README.md`, "# Thing\n");
one("a folder holding only a face is not a chapter", run(faceOnly).includes("CHAPTER"));

// ── the provider-contract question ────────────────────────────────────────────────────────────
//
// Every instance answers the same entries under the same names, and one with no capability writes
// the file anyway. So a MISSING file is a missing answer rather than an absent capability — and
// before the contract existed those two looked identical.
//
// THE CONTRACT IS READ, NEVER HARDCODED. Adding an entry to `02-contract.md` is what puts it on
// every instance's bill, so these cases write their own contract rather than leaning on the book's.

const contract = (root, where, entries) =>
  mk(root, `${where}/02-contract.md`,
     "# The contract\n\n| File | The question |\n| --- | --- |\n" +
     entries.map((e) => `| \`${e}\` | something |`).join("\n") + "\n");

// 10 — an instance answering every entry says nothing.
const full = tree("contract-full", "", false);
contract(full, `docs/${SEAT.capabilities}/01-a/01-b/10-providers`, ["01-one.md", "02-two.md"]);
mk(full, `docs/${SEAT.capabilities}/01-a/01-b/10-providers/x/01-one.md`, "# One\n");
mk(full, `docs/${SEAT.capabilities}/01-a/01-b/10-providers/x/02-two.md`, "# Two\n");
one("an instance answering every entry reports nothing", !run(full).includes("CONTRACT"));

// 11 — a missing entry is reported, and named.
const short = tree("contract-short", "", false);
contract(short, `docs/${SEAT.capabilities}/01-a/01-b/10-providers`, ["01-one.md", "02-two.md"]);
mk(short, `docs/${SEAT.capabilities}/01-a/01-b/10-providers/x/01-one.md`, "# One\n");
one("a missing entry is reported by name", run(short).includes("02-two.md"));

// 12 — a file the contract does not ask for is reported too. It has either found a question the
//      contract is missing, or been written somewhere nobody will look.
const overfull = tree("contract-overfull", "", false);
contract(overfull, `docs/${SEAT.capabilities}/01-a/01-b/10-providers`, ["01-one.md"]);
mk(overfull, `docs/${SEAT.capabilities}/01-a/01-b/10-providers/x/01-one.md`, "# One\n");
mk(overfull, `docs/${SEAT.capabilities}/01-a/01-b/10-providers/x/99-invented.md`, "# Invented\n");
one("a file the contract does not ask for is reported", run(overfull).includes("99-invented.md"));

// 13 — a folder with no contract beside it is not this question's business.
const nocontract = tree("contract-none", "", false);
mk(nocontract, `docs/${SEAT.capabilities}/01-a/01-b/01-thing/x/01-one.md`, "# One\n");
one("a folder with no contract is left alone", !run(nocontract).includes("CONTRACT"));

// ── the plugin-path question ──────────────────────────────────────────────────────────────────
//
// Nothing proved the docs against the plugins, so a doc could name a file the plugin stopped
// shipping and read exactly like one naming a file it ships. `N85` found a fifth of them dead.
//
// Each fixture holds a real `packages/plugin-spn-x/` folder — the layout the plugins ship from —
// because a repo without one is not this question's.

/** A fixture with one real plugin file, `packages/plugin-spn-x/src/scripts/checks/real.ts`. */
function shelf(name, pageBody) {
  const root = tree(name, pageBody, false);
  mk(root, "packages/plugin-spn-x/src/scripts/checks/real.ts", "// a check\n");
  return root;
}

// 14 — KNOWN-BAD FIRST. A real dead path under the layout that exists today is reported. The
//      pre-rewrite check looked for a `plugins/` shelf; this fixture never creates one, so that
//      version found no shelf, returned early, and this exact case would have passed with nothing
//      ever read from disk. Proving the fixture carries no `plugins/` folder, and proving the check
//      is still red against it, is what proves the rewrite reads `packages/` rather than passing by
//      construction.
const knownBad = shelf("path-known-bad",
  "# A page\n\nThe check is `packages/plugin-spn-x/src/scripts/checks/gone.ts`.\n");
one("[known-bad] the fixture carries no `plugins/` shelf at all", !existsSync(join(knownBad, "plugins")));
const knownBadOut = run(knownBad);
one("[known-bad] a dead path under the current layout is reported, not silently passed",
  /PATH\s+1 plugin path/.test(knownBadOut));
one("[known-bad] the finding names the dead path and where it is named",
  knownBadOut.includes(`packages/plugin-spn-x/src/scripts/checks/gone.ts — named in docs/${SEAT.constructs}/a.md:3`));

// 15 — a real path, rooted at `packages/`, reports nothing.
const real = shelf("path-real", "# A page\n\nThe check is `packages/plugin-spn-x/src/scripts/checks/real.ts`.\n");
one("a plugin path that exists is not reported", !run(real).includes("PATH "));

// 16 — a dead path is reported, naming the path and the file and line naming it.
const deadPath = shelf("path-dead",
  "# A page\n\nThe check is `packages/plugin-spn-x/src/scripts/checks/gone.ts`.\n");
const deadOut = run(deadPath);
one("a plugin path that does not exist is reported", /PATH\s+1 plugin path/.test(deadOut));
one("the finding names the dead path and where it is named",
  deadOut.includes(`packages/plugin-spn-x/src/scripts/checks/gone.ts — named in docs/${SEAT.constructs}/a.md:3`));

// 17 — a path inside a fence is an example, and is not read.
const fenced = shelf("path-fenced",
  "# A page\n\n```bash\nnode packages/plugin-spn-x/src/scripts/checks/gone.ts\n```\n");
one("a dead path inside a fence is an example, not a finding", !run(fenced).includes("PATH "));

// 18 — a placeholder asks only for the folder before it.
const shape = shelf("path-shape",
  "# A page\n\nA rule lives at `packages/plugin-spn-x/src/scripts/checks/<subject>.ts`, " +
  "and not at `packages/plugin-spn-x/src/providers/<cloud>/checks/`.\n");
const shapeOut = run(shape);
one("a placeholder under a real folder is not reported",
  !shapeOut.includes("scripts/checks/<subject>.ts"));
one("a placeholder under a missing folder is reported",
  shapeOut.includes("packages/plugin-spn-x/src/providers/<cloud>/checks/ — named"));

// 19 — the short form `plugin-<name>/src/…` counts when the plugin is real, and a lookalike shaped
//      the same way but naming no real package does not.
const short2 = shelf("path-short",
  "# A page\n\nSee `plugin-spn-x/src/scripts/checks/gone.ts`, and `plugin-vendor/src/anything.ts`.\n");
const shortOut = run(short2);
one("a plugin path without its `packages/` root is still read",
  shortOut.includes("packages/plugin-spn-x/src/scripts/checks/gone.ts"));
one("a `plugin-<name>/src/` naming no real plugin is left alone", !shortOut.includes("plugin-vendor/src"));

// 20 — a repository with no `packages/plugin-*` folder is not this question's business. This is
//      the same fixture shape as the known-bad case, so it proves the negative: absence of the
//      shelf is silence, and only that — never a crash, and never a false finding.
const noShelf = tree("path-no-shelf", "# A page\n\nSee `packages/plugin-spn-x/src/gone.ts`.\n", false);
one("a repository with no packages/plugin-* folder reports nothing", !run(noShelf).includes("PATH "));

// 21 — an overview is read too, and the markup around a path is not part of it. A `<pre>` block is
//      a page's fence; an escaped placeholder is still a placeholder.
const page = shelf("path-page", "# A page\n");
mk(page, `docs/${POCKET.artifacts}/${ARTIFACT.docs}/concept-overview.html`,
  "<p>Run <code>packages/plugin-spn-x/src/scripts/checks/real.ts</code> and " +
  "<code>packages/plugin-spn-x/src/scripts/checks/&lt;subject&gt;.ts</code>, never " +
  "<code>packages/plugin-spn-x/hooks/run.mjs</code>.</p>\n<pre>packages/plugin-spn-x/src/example.ts</pre>\n");
const pageOut = run(page);
one("a dead path on an overview is reported, without its markup",
  pageOut.includes(`packages/plugin-spn-x/hooks/run.mjs — named in docs/${POCKET.artifacts}/${ARTIFACT.docs}/concept-overview.html:1`));
one("a real path and an escaped placeholder on an overview are not", /PATH\s+1 plugin path/.test(pageOut));

// 21b — an overview in a domain's folder is read as the hub is. A construct page of that folder is
//       not: it is produced from its seat file, and the seat file is what is read.
const domainPage = shelf("path-domain-page", "# A page\n");
const POCKET_DOCS = `docs/${POCKET.artifacts}/${ARTIFACT.docs}`;
mk(domainPage, `${POCKET_DOCS}/01-core/core-overview.html`, "<p>Never <code>packages/plugin-spn-x/hooks/gone-one.mjs</code>.</p>\n");
mk(domainPage, `${POCKET_DOCS}/01-core/${CONSTRUCT_PAGES}/01-thing-construct.html`, "<p>Never <code>packages/plugin-spn-x/hooks/gone-two.mjs</code>.</p>\n");
const domainOut = run(domainPage);
one("[MKT.SCRIPTS.110] a dead path on an overview in its domain's folder is reported, and it names the page by its place",
  domainOut.includes(`packages/plugin-spn-x/hooks/gone-one.mjs — named in ${POCKET_DOCS}/01-core/core-overview.html:1`));
one("[MKT.SCRIPTS.110] a construct page in the constructs folder beside it is not read as an overview",
  /PATH\s+1 plugin path/.test(domainOut) && !domainOut.includes("gone-two.mjs"));

// 22 — a placeholder inside a segment keeps the segment whole, so it is asked of the folder above.
const partSegment = shelf("path-part-segment",
  "# A page\n\nA rule's suite sits at `packages/plugin-spn-x/src/scripts/checks/_<subject>/`.\n");
one("a placeholder inside a segment is not read as a truncated name", !run(partSegment).includes("PATH "));

// ── the grammar: an action, one path inside a repository, and a filter ─────────────────────────
//
// A repository this time, because a run with no path takes the repository the caller is in. Two
// files cite an id no row carries, and two write a count into a set that can grow, in three folders.

{
/** What one run through the entry printed, and its exit code, from the folder given. */
function typed(cwd, ...words) {
  try { return { code: 0, out: execFileSync(process.execPath, [TOOL, "docs", "coherence", ...words], { encoding: "utf8", stdio: "pipe", cwd, env: { ...process.env, SPN_WORKSPACE: WORKSPACE ?? cwd } }) }; }
  catch (e) { return { code: e.status, out: String(e.stdout ?? "") + String(e.stderr ?? "") }; }
}
const USAGE = "usage: spn-devex docs coherence check [<path>] [--finding <name>]\n";
const repository = tree("repository",
  "# A page\n\nThis cites DEC.SUPPORT.GOV.999, which no row carries. It names the three kinds of page.\n");
mk(repository, "sprepo.json", '{"type":"APPS","name":"t","config":null}');
mk(repository, `docs/${SEAT.constructs}/01-core/b.md`,
  "# B\n\nThis cites DEC.DEVEX.WORKSPACE.155, which the register carries, and DEC.SUPPORT.GOV.998, which it does not.\n");
mk(repository, `docs/${SEAT.behaviors}/c.md`, "# C\n\nIt lists the four skills of the plugin.\n");
const CORE = `docs/${SEAT.constructs}/01-core`;
WORKSPACE = repository;

const bare = typed(repository);
one("[MKT.SCRIPTS.111] with no action the entry prints the usage line, says an action is owed and exits 2",
  bare.code === 2 && bare.out === `${USAGE}\`docs coherence\` needs an action.\n`);
one("[MKT.SCRIPTS.111] a path where the action belongs is refused with exit 2", typed(repository, ".").code === 2);
const option = typed(repository, "check", ".", "--json");
one("an option the command does not take is refused by its name, with exit 2",
  option.code === 2 && option.out === `${USAGE}\`docs coherence check\` does not take \`--json\`.\n`);
one("a second path is refused with exit 2", typed(repository, "check", ".", "docs").code === 2);

const whole = typed(repository, "check", ".");
one("known-bad: the repository, checked, reports both ids and both counts",
  /CITATION\s+2 id\(s\)/.test(whole.out) && whole.out.includes("DEC.SUPPORT.GOV.999") && whole.out.includes("DEC.SUPPORT.GOV.998")
    && whole.out.includes("the three kinds") && whole.out.includes("the four skills"));
one("and its exit code is the number of findings it reports: one citation finding and two counts", whole.code === 3);
one("the closing line of a whole run names no path", /documents compared against each other — 2 cardinality · 1 citation\n$/.test(whole.out));

const narrow = typed(repository, "check", CORE);
one("[MKT.SCRIPTS.135] a run narrowed to one folder reports the id cited under it, and no finding from a file beside it",
  /CITATION\s+1 id\(s\)/.test(narrow.out) && narrow.out.includes("DEC.SUPPORT.GOV.998") && !narrow.out.includes("DEC.SUPPORT.GOV.999")
    && !narrow.out.includes("the three kinds") && !narrow.out.includes("the four skills"));
// THE REGISTER SITS OUTSIDE THE PATH. A run that read only its path would find no register, so it
// would report no citation at all, and a run that found one would report the id the register carries.
one("[MKT.SCRIPTS.135] the narrow run still reads the register outside its path: the id the register carries is not reported",
  narrow.out.includes("CITATION") && !narrow.out.includes("DEC.DEVEX.WORKSPACE.155 —"));
one("[MKT.SCRIPTS.135] its exit code is the number of findings under the path", narrow.code === 1);
one("[MKT.SCRIPTS.135] and its closing line counts every document read, and names the path", narrow.out.endsWith(`1 citation under ${CORE}\n`)
  && narrow.out.match(/^(\d+) documents compared/m)?.[1] === whole.out.match(/^(\d+) documents compared/m)?.[1]);
const oneFile = typed(repository, "check", `docs/${SEAT.behaviors}/c.md`);
one("[MKT.SCRIPTS.135] a run narrowed to one file reports that file's finding alone",
  oneFile.code === 1 && oneFile.out.includes("the four skills") && !oneFile.out.includes("CITATION") && !oneFile.out.includes("the three kinds"));
const cleanFolder = typed(repository, "check", `docs/${POCKET.registers}`);
one("[MKT.SCRIPTS.135] a run narrowed to a folder with no finding reports nothing and exits 0",
  cleanFolder.code === 0 && cleanFolder.out.includes("— nothing under"));

const inside = typed(join(repository, CORE), "check");
one("[MKT.SCRIPTS.113] with no path the run takes the repository the caller is in, from a folder inside it too",
  typed(repository, "check").out === whole.out && inside.out === whole.out && inside.code === 3);
const outside = typed(BASE, "check");
one("[MKT.SCRIPTS.113] where the caller is in no repository, `check` with no path says to name one, and exits 2",
  outside.code === 2 && outside.out === `${USAGE}\`docs coherence check\` needs a path here, because the folder it is run from is in no repository. Name a repository.\n`);

const citationOnly = typed(repository, "check", ".", "--finding", "citation");
one("[MKT.SCRIPTS.136] `--finding citation` reports the findings of that name alone",
  citationOnly.code === 1 && citationOnly.out.includes("CITATION") && !citationOnly.out.includes("CARDINALITY"));
const both = typed(repository, "check", ".", "--finding", "citation", "--finding=cardinality");
one("[MKT.SCRIPTS.136] `--finding` typed twice reports both names", both.code === 3 && both.out.includes("CITATION") && both.out.includes("CARDINALITY"));
const filteredNarrow = typed(repository, "check", CORE, "--finding", "cardinality");
one("[MKT.SCRIPTS.136] a name that nothing under the path earns reports nothing and exits 0", filteredNarrow.code === 0 && !filteredNarrow.out.includes("CITATION"));
const outsideSet = typed(repository, "check", ".", "--finding", "block");
one("[MKT.SCRIPTS.115] a finding name outside the set is refused with the set, and exit 2",
  outsideSet.code === 2 && outsideSet.out.includes("takes `--finding` from vocabulary · ruling · ownership · cardinality · hub · restates · citation · chapter · contract · path, and `block` is none of them."));

// The set `--finding` takes is the first word of each finding the command's own source writes.
{
  const source = readFileSync(join(PLUGIN, "src", "scripts", "commands", "docs", "coherence.ts"), "utf8");
  const written = [...new Set([...source.matchAll(/`([A-Z]{3,}) +["$]/g)].map((found) => found[1].toLowerCase()))].sort();
  one("the declared set and the first words of the findings in the source are the same",
    written.length > 5 && written.join(" ") === [...FINDINGS].sort().join(" "));
}
}

console.log(failed ? `${failed} of ${n} failed` : `all ${n} passed — coherence`);
process.exit(failed ? 1 : 0);
