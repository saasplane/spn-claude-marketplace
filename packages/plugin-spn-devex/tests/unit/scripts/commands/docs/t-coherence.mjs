import { PLUGIN } from "../../../../helpers/harness.mjs";
// `coherence` CITATION — does every decision id cited in a repository resolve to a row?
//
// The question exists because `N76` found two ids cited in the foundation book with no row behind
// them, and neither had ever been reported. A citation to a missing row is the one register failure
// a reader cannot work around: every other finding leaves two answers to choose between, and this
// one leaves none. It is also silent — `RD.APPS.020` reads exactly like a row that exists until
// somebody opens the register and searches.
//
// These cases fix the three answers that matter, because the check ships SOFT and a SOFT check
// nobody trusts is a SOFT check nobody reads:
//
//   a clean tree reports nothing        — otherwise the finding is noise and gets filtered away
//   one dangling id reports once        — naming the id AND the file, because the file is the fix
//   a repo with no register is silent   — the marketplace and the estate repos have none, and a
//                                         tool that fires there would be red everywhere by default
//
// The fixture is written rather than copied from the corpus on purpose. A test whose input is the
// live book passes for whatever reason the book happens to be in today.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, mkdtempSync, rmSync, renameSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { ARTIFACT, CONSTRUCT_PAGES, POCKET, SEAT } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const TOOL = join(PLUGIN, "src", "scripts", "commands", "docs", "coherence.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-coherence-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let n = 0, failed = 0;

function one(label, ok) {
  n += 1;
  if (!ok) { failed += 1; console.log(`  FAIL  ${label}`); }
}

function run(root) {
  try { return execFileSync("node", [TOOL, root], { encoding: "utf8" }); }
  catch (e) { return String(e.stdout ?? ""); }
}

function tree(name, pageBody, withRegister = true) {
  const root = join(BASE, name);
  mkdirSync(join(root, "docs", POCKET.registers), { recursive: true });
  mkdirSync(join(root, "docs", SEAT.constructs), { recursive: true });
  if (withRegister)
    writeFileSync(join(root, "docs", POCKET.registers, "decisions.md"),
      "# Decisions\n\n| # | Decision | Why | Date |\n| --- | --- | --- | --- |\n" +
      "| RD.DEVEX.WORKSPACE.155 | A thing is so. | Because a fixture needs a row that exists. | 2026-09 |\n");
  writeFileSync(join(root, "docs", SEAT.constructs, "a.md"), pageBody);
  return root;
}

/** Write one file into a fixture tree, making the folders it needs. */
function mk(root, relative, body) {
  const at = join(root, relative);
  mkdirSync(dirname(at), { recursive: true });
  writeFileSync(at, body);
}

// 1 — every citation resolves, so the check says nothing at all.
const clean = tree("clean", "# A page\n\nThis cites RD.DEVEX.WORKSPACE.155, which the register carries.\n");
one("a tree whose citations all resolve reports no CITATION finding",
  !run(clean).includes("CITATION"));

// 2 — one dangling id, reported once, naming the id and the file that cites it.
const dangling = tree("dangling",
  "# A page\n\nThis cites RD.DEVEX.WORKSPACE.155, which exists, and RD.GOV.999, which does not.\n");
const out = run(dangling);
one("a dangling id is reported", out.includes("CITATION"));
one("the finding names the dangling id", out.includes("RD.GOV.999"));
one("the finding names the file citing it", out.includes(`docs/${SEAT.constructs}/a.md`));
one("a resolving id in the same file is not reported", !out.includes("RD.DEVEX.WORKSPACE.155 —"));
one("one dangling id counts as one", /CITATION\s+1 decision id\(s\)/.test(out));

// 3 — a repository with no register is not this question's business. The marketplace and the
//     estate repos carry none, and a tool that fired there would be red everywhere by default.
const noRegister = tree("no-register", "# A page\n\nThis cites RD.GOV.999.\n", false);
one("a repository with no register reports nothing", !run(noRegister).includes("CITATION"));

// 4 — the id must be a whole id. A three-digit sequence is the register's own grammar, and a
//     looser match would report prose like "RD.GOV.1" that no reader would call a citation.
const partial = tree("partial", "# A page\n\nThis mentions RD.GOV.1 and RD.DEVEX.WORKSPACE.155.\n");
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

// 5 — a three-part id (`RD.<DOMAIN>.<NNN>`).
const rulingThree = rulingTree("ruling-three", "RD.GOV.100");
one("a buried ruling under a three-part id is reported", run(rulingThree).includes("RULING"));

// 6 — a four-part id (`RD.<DOMAIN>.<SUBDOMAIN>.<NNN>`), same shape.
const rulingFour = rulingTree("ruling-four", "RD.DEVEX.WORKSPACE.201");
one("a buried ruling under a four-part id is reported", run(rulingFour).includes("RULING"));

// 7 — one ruling, nothing buried: the header read locates the real Decision cell rather than
//     reporting on every row by construction.
const rulingClean = join(BASE, "ruling-clean");
mkdirSync(join(rulingClean, "docs", POCKET.registers), { recursive: true });
writeFileSync(join(rulingClean, "docs", POCKET.registers, "decisions.md"),
  "# Decisions\n\n| # | Construct | Decision | Why | Date |\n| --- | --- | --- | --- | --- |\n" +
  "| RD.GOV.101 | ideate | A single plain ruling with nothing bolded past it. | because | 2026-09 |\n");
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

console.log(failed ? `${failed} of ${n} failed` : `all ${n} passed — coherence`);
process.exit(failed ? 1 : 0);
