import { PLUGIN } from "../../../../helpers/harness.mjs";
// `docs audit` — the invariants a page must hold: the block, the outline, headers, links, Binds and
// Proof, the generated columns, a closed vocabulary against what realizes it, and the gap scan.
//
// THIS SUITE EXISTS BECAUSE THE TOOL WRITES INTO EVERY DOCUMENT IN THE CORPUS. Nothing here is a
// port, so the fixtures are the whole proof. Each case builds a throwaway tree and runs the real
// command against it, through the same `cli.ts` dispatcher `spn-devex docs audit` runs through.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { ARTIFACT, CONSTRUCT_PAGES, POCKET, SEAT, WORKSTREAMS, bookTemplatesDir } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { INDEX_SCRIPT, OWN_COPY, linesFor } from "../../../../../../plugin-support-lib/src/lib/page-styles.ts";
import { ENUM_HEAD, checkCodeFigures, checkTreeFigures } from "../../../../../src/scripts/commands/docs/_lib.ts";
import { FINDINGS } from "../../../../../src/scripts/commands/docs/audit.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-audit-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let made = 0;
/** A repository: `sprepo.json`, `CONCEPT.md`, and a `docs/` tree, from a flat path map. */
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

/** A folder in no repository: the files of a flat path map, and no `sprepo.json` at or above it. */
function loose(files) {
  made += 1;
  const root = join(BASE, `loose${made}`);
  for (const [path, text] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text, "utf8");
  }
  return root;
}

const block = (o) => `<!-- spn:doc\n${JSON.stringify(o, null, 2)}\n-->\n`;
/** The two lines a page in the shared form carries: the stylesheet's, and the script's. */
const LINES = linesFor("1.0.0");

/** A seat file, written the way an author writes one: block, title, tag line, prose. */
const doc = (o, body = "Some prose.\n", tag = null) =>
  block({ summary: `What ${o.title} is.`, ...o }) +
  `\n# ${o.title}\n\n` + (tag === null ? "" : tag + "\n\n") + body;

/** `args` is what follows the group — `["audit", "check", "docs/a.md"]` — run through `cli.ts docs <args>`. */
function run(root, args) {
  try {
    return execFileSync(process.execPath, [TOOL, "docs", ...args],
      { encoding: "utf8", cwd: root, stdio: "pipe", env: { ...process.env, SPN_WORKSPACE: root } });
  } catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
}
const readAt = (root, p) => readFileSync(join(root, p), "utf8");
/** The pocket's `docs` folder: the hub, each overview beside it, and one folder for each domain. */
const POCKET_DOCS = `docs/${POCKET.artifacts}/${ARTIFACT.docs}`;
const absent = (root, p) => !existsSync(join(root, p));

let n = 0, failed = 0;
function one(name, got, want) {
  n += 1;
  const ok = typeof want === "function" ? want(got) : got === want;
  if (!ok) { failed += 1; console.log(`  FAIL  ${name}\n        got: ${JSON.stringify(String(got).slice(0, 220))}`); }
  else console.log(`  PASS  ${name}`);
}
const has = (s) => (got) => String(got).includes(s);
const lacks = (s) => (got) => !String(got).includes(s);

// ---------------------------------------------------------------- the seat header check

console.log("\n=== a markdown seat file is checked as a seat file, not as a page");
{
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/a.md": doc({ id: "a", title: "A Title", lenses: ["QA"], status: "DONE" },
                     "Lead.\n", "`For: Quality engineer` · `Status: ✅ DONE`"),
  });
  one("a well-formed seat file is clean — it is never asked for an HTML <header>",
    run(root, ["audit", "check", "docs/a.md"]), has("clean — 1 page"));
}
{
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/a.md": doc({ id: "a", title: "A Title", lenses: ["QA"], status: "DONE" },
                     "Lead.\n", "`For: Architect` · `Status: ✅ DONE`"),
  });
  one("a lens line that disagrees with the block is a finding",
    run(root, ["audit", "check", "docs/a.md"]), has("which the block does not declare"));
}
{
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/a.md": doc({ id: "a", title: "A Title", lenses: ["QA"], status: "DONE" },
                     "Lead.\n", "`For: Quality engineer` · `Status: 🔮 PLANNING`"),
  });
  one("a status chip that disagrees with the block is a finding",
    run(root, ["audit", "check", "docs/a.md"]), has("the block says `DONE`"));
}
{
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/a.md": doc({ id: "a", title: "A Title", lenses: ["QA"], status: "DONE" },
                     "Lead.\n\n```text\n# A Second Title In A Fence\n```\n",
                     "`For: Quality engineer` · `Status: ✅ DONE`"),
  });
  one("a title inside a fence is not a second title",
    run(root, ["audit", "check", "docs/a.md"]), has("clean — 1 page"));
}
{
  // `UX` is the UX designer's lens (RD.DEVEX.AGENT.079). A page may declare it, and its tag line
  // reads the label the register gives the value.
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/a.md": doc({ id: "a", title: "A Title", lenses: ["UX"], status: "DONE" },
                     "Lead.\n", "`For: UX designer` · `Status: ✅ DONE`"),
  });
  one("a page that declares `UX` is clean: the value is a lens, and its tag line reads `For: UX designer`",
    run(root, ["audit", "check", "docs/a.md"]),
    (got) => got.includes("clean — 1 page") && !got.includes("is not a lens"));
}


// ------------------------------------------- the outline check reads the format it is given

console.log("\n=== a construct's outline is checked in markdown, not only in HTML");
// THE GATE WAS BLIND, AND A BLIND GATE IS WORSE THAN NO GATE because its refusal is believed. The
// outline check read `<h2>` only, so a hand-authored construct carrying all six required sections
// reported all six missing. The first batch that ever wrote one distrusted the red light and traced
// it. These cases are the other half of that fix: the check must still FAIL a file that is really
// missing a section, or it has simply been made quiet.
const SECTIONS = ["Overview", "Terms", "Model", "Parts", "Boundary", "Binds", "Proof"];
// Binds and Proof carry real tables, because both are checked now — a section that is only a
// heading used to pass, and only because the checks could not read markdown at all.
const SECTION_BODY = {
  Binds: "| Rule | What it decides | Weight |\n| --- | --- | --- |\n| `a.md` | x | MUST |\n\n" +
         "| Repo | Node | What it realizes | State |\n| --- | --- | --- | --- |\n| R | n | x | planned |\n",
  Proof: "| Check | Kind | What a green run shows |\n| --- | --- | --- |\n| `spnutils apps test` | gate | x |\n",
};
const construct = (sections) =>
  doc({ id: "x", variant: "construct", parentId: "concept", dependsOn: [], title: "X", lenses: ["ARCHITECT"], status: "PLANNING" },
      "Lead.\n\n" + sections.map((h) => `## ${h}\n\n${SECTION_BODY[h] ?? `What ${h} says.`}\n`).join("\n"),
      "`For: Architect` · `Status: 🔮 PLANNING`");
{
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: construct(SECTIONS) });
  one("a construct with every section, written as `##`, is clean",
    run(root, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), has("clean — 1 page"));
}
{
  const root = repo({ "CONCEPT.md": "# c\n",
    [`docs/${SEAT.constructs}/x.md`]: construct(SECTIONS.filter((h) => h !== "Boundary")) });
  const out = run(root, ["audit", "check", `docs/${SEAT.constructs}/x.md`]);
  one("a construct genuinely missing a section is still a finding", out, has("missing section: Boundary"));
  one("and it names only the one that is missing", out, lacks("missing section: Terms"));
}
{
  // BINDS AND PROOF ARE OPTIONAL WHILE THE CORPUS CROSSES. Decision `E` takes the realization table
  // out of `Binds` and takes `Proof` off the construct, and the sweep that edits the 122 pages is a
  // separate arc — so both shapes pass, and the order of the two is still the outline's.
  const root = repo({ "CONCEPT.md": "# c\n",
    [`docs/${SEAT.constructs}/x.md`]: construct(["Overview", "Terms", "Model", "Parts", "Boundary"]) });
  one("a construct carrying neither Binds nor Proof is clean, which is the shape `E` leaves",
    run(root, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), has("clean — 1 page"));

  const swapped = repo({ "CONCEPT.md": "# c\n",
    [`docs/${SEAT.constructs}/x.md`]: construct(["Overview", "Terms", "Model", "Parts", "Proof", "Boundary"]) });
  one("an optional section out of place is still out of place",
    run(swapped, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), has("`Proof` comes before `Boundary`"));
}
{
  // OVERVIEW IS REQUIRED, AND IT WAS OPTIONAL FOR ONE SITTING (N67). Adding a required section to
  // documents that already exist has no safe order: move the corpus first and every moved page is
  // refused for carrying a section the outline does not name; require it first and every page that
  // has not moved is refused for lacking it. Optional is the state where both pass. These two cases
  // hold the end state — required, and first — so the middle state cannot be left behind by accident.
  const root = repo({ "CONCEPT.md": "# c\n",
    [`docs/${SEAT.constructs}/x.md`]: construct(SECTIONS.filter((h) => h !== "Overview")) });
  one("a construct with no Overview is refused, and named",
    run(root, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), has("missing section: Overview"));

  // Order matters as much as presence: Overview argues WHY and Terms defines the words the Model
  // uses, so a page that defines before it argues is a finding rather than a preference.
  const swapped = repo({ "CONCEPT.md": "# c\n",
    [`docs/${SEAT.constructs}/x.md`]: construct(["Terms", "Overview", "Model", "Parts", "Boundary", "Binds", "Proof"]) });
  one("a construct that puts Terms before Overview is refused",
    run(swapped, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), has("`Terms` comes before `Overview`"));
}
{
  const v1 = doc({ id: "x", variant: "construct", parentId: "concept", dependsOn: [], title: "X", lenses: ["ARCHITECT"], status: "PLANNING" },
      "Lead.\n\n## Boundary\n\nb\n\n## Model\n\nm\n\n## Parts\n\np\n\n## Relations\n\nr\n\n" + SECTION_BODY.Binds + "\n## Proof\n\n" + SECTION_BODY.Proof,
      "`For: Architect` · `Status: 🔮 PLANNING`");
  const out = run(repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: v1 }), ["audit", "check", `docs/${SEAT.constructs}/x.md`]);
  one("a v1-shaped construct is reported softly until N13 re-shapes it, never refused", out, (g) => /carries the v1 outline/.test(g) && !/missing section/.test(g));
}
{
  // A construct that SHOWS an outline in an example is not carrying that section.
  const root = repo({ "CONCEPT.md": "# c\n",
    [`docs/${SEAT.constructs}/x.md`]: construct(SECTIONS.filter((h) => h !== "Boundary"))
      .replace("## Binds", "```text\n## Boundary\n```\n\n## Binds") });
  one("a heading inside a fence does not satisfy the outline",
    run(root, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), has("missing section: Boundary"));
}
{
  // `produced` compares a PAGE with the seat it would be produced from. A seat file is not a page.
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: construct(SECTIONS) });
  one("the produced check stays silent on a seat file, which has no page yet",
    run(root, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), lacks("no seat file sits at the mirrored path"));
}


// ------------------------------------------- an overview borrows headings at any depth

console.log("\n=== an overview's source headings are read at any depth, not just `##`");
// A DOMAIN SITS ONE LEVEL DOWN FROM A GROUP. The concept names a group at `##` and a domain inside
// it at `###`, and this check read `^## ` alone — so the hub could pass and **no domain overview
// ever could**: every heading it correctly borrowed was reported as invented. The rule is *an
// overview never invents a heading its source does not have*, and that says nothing about depth.
const overview = (sections) =>
  `<meta charset="utf-8">\n<title>T</title>\n` +
  block({ id: "o", variant: "overview", parentId: "concept", title: "T",
          lenses: ["ARCHITECT"], summary: "s." }) + `${LINES.stylesheet}\n` +
  sections.map((h) => `<h2>${h}</h2>\n<p>x</p>`).join("\n");

const CONCEPT_TREE = "# c\n\n## SaaS Plane — Foundation\n\nstage.\n\n### DevEx\n\nhow it runs.\n\n### Docs\n\nhow it is written.\n\n## Adoption\n\nlast.\n";
{
  const root = repo({ "CONCEPT.md": CONCEPT_TREE,
    [`${POCKET_DOCS}/o-overview.html`]: overview(["Overview", "DevEx", "Docs", "Glossary", "Where to go next"]) });
  one("a domain heading at `###` is a real heading, and the overview may borrow it",
    run(root, ["audit", "check", `${POCKET_DOCS}/o-overview.html`]), lacks("no counterpart"));
}
{
  const root = repo({ "CONCEPT.md": CONCEPT_TREE,
    [`${POCKET_DOCS}/o-overview.html`]: overview(["Overview", "DevEx", "Invented", "Glossary", "Where to go next"]) });
  one("a heading the concept does not have anywhere is still a finding",
    run(root, ["audit", "check", `${POCKET_DOCS}/o-overview.html`]), has("Invented — an overview never invents"));
}
{
  const root = repo({ "CONCEPT.md": CONCEPT_TREE,
    [`${POCKET_DOCS}/o-overview.html`]: overview(["Overview", "Docs", "DevEx", "Glossary", "Where to go next"]) });
  one("and the source's order still binds across depths",
    run(root, ["audit", "check", `${POCKET_DOCS}/o-overview.html`]), has("an overview holds its source's order"));
}
{
  // A concept that SHOWS an example page in a fenced block is not declaring those headings.
  const root = repo({
    "CONCEPT.md": CONCEPT_TREE + "\n```markdown\n## Fenced Heading\n```\n",
    [`${POCKET_DOCS}/o-overview.html`]: overview(["Overview", "Fenced Heading", "Glossary", "Where to go next"]) });
  one("a heading inside a fence is not a heading the concept has",
    run(root, ["audit", "check", `${POCKET_DOCS}/o-overview.html`]), has("Fenced Heading — an overview never invents"));
}


// ------------------------------------------- Binds and Proof are read in markdown too

console.log("\n=== a seat file's Binds and Proof are checked, not skipped");
// THE FOURTH TIME THIS EXACT BLINDNESS TURNED UP. checkBinds and checkProof searched for
// `<h2>Binds` and returned early when they did not find it — so on a markdown seat file, the ONLY
// form an author writes, they read nothing and reported nothing. 140 constructs passed with their
// Binds and Proof entirely unexamined while the audit said clean.
const withSections = (binds, proof) =>
  doc({ id: "x", variant: "construct", parentId: "concept", dependsOn: [], title: "X", lenses: ["ARCHITECT"], status: "PLANNING" },
      "Lead.\n\n## Overview\n\nwhy\n\n## Terms\n\nt\n\n## Model\n\nm\n\n## Parts\n\np\n\n## Boundary\n\nb\n\n" + binds + "\n" + proof,
      "`For: Architect` · `Status: 🔮 PLANNING`");
const BINDS_OK = "## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| `a.md` | x | MUST |\n\n| Repo | Node | What it realizes | State |\n| --- | --- | --- | --- |\n| R | n | x | planned |\n";
const PROOF_OK = "## Proof\n\n| Check | Kind | What a green run shows |\n| --- | --- | --- |\n| `spnutils apps test` | gate | x |\n";
{
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(BINDS_OK, PROOF_OK) });
  one("a construct with both tables and a real command is clean",
    run(root, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), has("clean"));
}
{
  // ONE TABLE IS THE SHAPE `E` LEAVES BEHIND — the rules that hold the construct, and nothing about
  // where code sits. Demanding two would refuse every page the sweep touches.
  const one_table = "## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| `a.md` | x | MUST |\n";
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(one_table, PROOF_OK) });
  one("Binds carrying the rules table alone is clean",
    run(root, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), has("clean"));
}
{
  const no_table = "## Binds\n\nThe rules are written down somewhere else.\n";
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(no_table, PROOF_OK) });
  one("Binds carrying no table at all is still a finding",
    run(root, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), has("Binds carries no table"));
}
{
  // A realization table with no row was invariant 6's RULE, and `E` removes the table it read.
  const no_row = "## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| `a.md` | x | MUST |\n\n| Repo | Node | What it realizes | State |\n| --- | --- | --- | --- |\n";
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(no_row, PROOF_OK) });
  one("an empty realization table is no longer a finding — `E` retires the row it demanded",
    run(root, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), has("clean"));
}
{
  // THE `NODE` CELL IS NOT RESOLVED ANY MORE, and the case names the exact substring match that went:
  // `the estate declaration` used to resolve through a node called `estate`, so a cell naming a house
  // word read as checked. Nothing here resolves, and nothing here is reported.
  const loose = BINDS_OK.replace("| R | n | x | planned |", "| R | the estate declaration | x | done |");
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(loose, PROOF_OK) });
  one("a `Node` cell is no longer resolved, loosely or at all",
    run(root, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), lacks("resolves to no node"));
}
{
  const odd = BINDS_OK.replace("| R | n | x | planned |", "| R | n | x | nearly |");
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(odd, PROOF_OK) });
  one("a realization state outside planned · partial · done is reported",
    run(root, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), has("planned · partial · done"));
}
{
  // A COMMAND IS WRITTEN AS CODE, and markdown's backticks are not part of the command.
  const spec = PROOF_OK.replace("`spnutils apps test`", "`some-thing.spec.ts`");
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(BINDS_OK, spec) });
  one("a Proof row naming a spec file rather than a command is reported",
    run(root, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), has("may not name a command"));
  const root2 = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(BINDS_OK, PROOF_OK) });
  one("and a real command in backticks is NOT — the markers are stripped first",
    run(root2, ["audit", "check", `docs/${SEAT.constructs}/x.md`]), lacks("may not name a command"));
}


// ---------------------------------------------------------------- a block inside a fence is an example

console.log("\n=== a chapter that TEACHES the metadata block does not thereby declare one");
// THE WRITER WAS ONE RUN FROM EDITING THE ILLUSTRATION A RULE IS TAUGHT BY. readBlock took the
// first `spn:doc` anywhere, so a document showing an example block appeared to declare itself, and
// `face` rendered a tag line FOR THE EXAMPLE and wrote it into the file. That is exactly what
// happened to a rules file carrying no block of its own.
{
  const teaches = "<!-- spn:restates\n{}\n-->\n\n# How A Block Is Written\n\n" +
    "Every document opens with one:\n\n```markdown\n" +
    block({ id: "an-example", title: "Human Title", lenses: ["ARCHITECT"], status: "DONE", summary: "s." }) +
    "\n# Human Title\n```\n";
  const root = repo({ "CONCEPT.md": "# c\n", "docs/teaches.md": teaches });
  one("the example's block is not read as the document's own",
    run(root, ["audit", "check", "docs/teaches.md"]), has("no spn:doc block"));
}
{
  // The ordinary case must still work: a real block, and an example further down.
  const both = doc({ id: "real", title: "Real", lenses: ["QA"], status: "DONE" },
    "Lead.\n\n```markdown\n" + block({ id: "an-example", title: "Other", lenses: ["ARCHITECT"], status: "DONE", summary: "s." }) + "```\n",
    "`For: Quality engineer` · `Status: ✅ DONE`");
  const root = repo({ "CONCEPT.md": "# c\n", "docs/real.md": both });
  one("a real block above a fenced example is still read, and it is the real one",
    run(root, ["audit", "check", "docs/real.md"]), has("clean"));
}
// ---------------------------------------------------------------- the Map cell resolves on disk

console.log("\n=== a link is opened, rather than merely written");
{
  // KNOWN-BAD INPUT. Twelve links naming a folder N13 deleted survived a corpus reporting 0 RULE,
  // because every other check asks whether a document is well-formed and a dangling link is
  // perfectly well-formed. One link of each shape here, so a check that reports all of them — or
  // none — fails.
  const root = repo({
    "CONCEPT.md": "# c\n",
    [`docs/${SEAT.constructs}/01-here/01-here.md`]:
      doc({ id: "l-here", title: "Here", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`") +
      "\nA link that [resolves](02-there.md), and one that [does not](03-gone.md).\n" +
      "\nA [heading on a page that exists](02-there.md#a-heading), and a [heading here](#a-heading).\n" +
      "\nAn [absolute one](https://example.com/x.md), and a [root-relative one](/docs/x.md).\n",
    [`docs/${SEAT.constructs}/01-here/02-there.md`]:
      doc({ id: "l-there", title: "There", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
  });
  const out = run(root, ["audit", "check", "docs"]);
  one("a link naming nothing is reported", out, has("names `03-gone.md`, and nothing is there"));
  one("a link that resolves is not", out, lacks("names `02-there.md`"));
  one("an anchor on a page that exists is the page, and the page is there",
    out, lacks("names `02-there.md#a-heading`"));
  one("a bare fragment names this page and is not a path", out, lacks("names `#a-heading`"));
  one("an absolute URL belongs to somebody else's server", out, lacks("example.com"));
  one("a root-relative path belongs to a rendering this corpus does not control",
    out, lacks("names `/docs/x.md`"));
}

{
  // A page that TEACHES link syntax writes a dead path on purpose. No corpus page carries this
  // shape today, which is why it is a fixture rather than a corpus case.
  const root = repo({
    "CONCEPT.md": "# c\n",
    [`docs/${SEAT.constructs}/01-here/01-here.md`]:
      doc({ id: "l-fence", title: "Fence", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`") +
      "\nA link is written like this:\n\n```md\nSee [the other page](99-nowhere.md).\n```\n" +
      "\nAnd in a page, like this:\n\n<pre>&lt;a href=\"98-nowhere.md\"&gt;the other page&lt;/a&gt;</pre>\n",
  });
  const out = run(root, ["audit", "check", "docs"]);
  one("a link inside a fenced sample is a sample", out, lacks("99-nowhere.md"));
  one("a link inside a pre block is a sample too", out, lacks("98-nowhere.md"));
}

console.log("\n=== a Governs cell names a folder that exists, and the audit says so when it does not");
{
  // KNOWN-BAD INPUT, because a gate that has only seen a clean tree has not been tested. One cell
  // resolves and one does not, in the same region, so a check that reports both — or neither —
  // fails here.
  const root = repo({
    "CONCEPT.md": "# c\n",
    [`docs/${SEAT.capabilities}/README.md`]:
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`") +
      "\n<!-- spn:generated contents — do not edit inside these markers; `docs.ts face` writes it -->\n" +
      "| File | Governs | Carries | Status |\n| --- | --- | --- | --- |\n" +
      "| [app.md](app.md) | `src/app/` | The app layer. | ✅ |\n" +
      "| [ghost.md](ghost.md) | `src/01-core/01-server/ghost/` | A folder nobody has. | ✅ |\n" +
      "<!-- /spn:generated -->\n",
    "src/app/index.ts": "export const a = 1;\n",
    // The Map's own links resolve, because a generated Map names files it walked. What is under test
    // is the Governs CELL, and a fixture whose links dangle would be reporting something else.
    [`docs/${SEAT.capabilities}/app.md`]:
      doc({ id: "g-app", title: "App", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
    [`docs/${SEAT.capabilities}/ghost.md`]:
      doc({ id: "g-ghost", title: "Ghost", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
  });
  const out = run(root, ["audit", "check", "docs"]);
  one("the cell that resolves to nothing is reported", out, has("`src/01-core/01-server/ghost/`, and no such folder exists"));
  one("and the row it sits on is named by its text, not its link syntax",
    out, (g) => g.includes("the Contents table says `ghost.md` governs") && !g.includes("[ghost.md](ghost.md)"));
  one("the cell that resolves is not reported", out, lacks("`src/app/`, and no such folder exists"));
  one("it reports rather than refuses — SOFT for one sitting", out, (g) => /SOFT\s+contents/.test(g) && /0 RULE/.test(g));
}
{
  // The same file with the dead row removed: the check stays quiet.
  const root = repo({
    "CONCEPT.md": "# c\n",
    [`docs/${SEAT.capabilities}/README.md`]:
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`") +
      "\n<!-- spn:generated contents — do not edit inside these markers; `docs.ts face` writes it -->\n" +
      "| File | Governs | Carries | Status |\n| --- | --- | --- | --- |\n" +
      "| [app.md](app.md) | `src/app/` | The app layer. | ✅ |\n" +
      "<!-- /spn:generated -->\n",
    "src/app/index.ts": "export const a = 1;\n",
  });
  one("a Map whose every cell resolves reports nothing", run(root, ["audit", "check", "docs"]), lacks("SOFT map"));
}
{
  // The empty Map the generator writes where a level has no mirror is not a dead cell.
  const root = repo({
    "CONCEPT.md": "# c\n",
    [`docs/${SEAT.capabilities}/README.md`]:
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`") +
      "\n<!-- spn:generated contents — do not edit inside these markers; `docs.ts face` writes it -->\n" +
      "| File | Governs | Carries | Status |\n| --- | --- | --- | --- |\n" +
      "| — | — | this layer carries no mirror yet | 🔮 |\n" +
      "<!-- /spn:generated -->\n",
  });
  one("`this layer carries no mirror yet` is the right answer, not a finding",
    run(root, ["audit", "check", "docs"]), lacks("SOFT map"));
}
{
  // `Governs` IS ALSO A COLUMN HEADING IN AUTHORED TABLES, where the cell is a sentence. The
  // foundation's register index carries one, and a cell reading `auth/data policies` looks like a
  // path to anything that only tests for a slash. Only the generated region is judged.
  const root = repo({
    "CONCEPT.md": "# c\n",
    [`docs/${SEAT.capabilities}/README.md`]:
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" },
          "| Register | Governs | Status |\n| --- | --- | --- |\n" +
          "| [naming.md](naming.md) | auth/data policies with merged effective reads | ✅ |\n",
          "`For: Architect` · `Status: ✅ DONE`"),
  });
  one("an authored `Governs` column of prose is not read as a path",
    run(root, ["audit", "check", "docs"]), lacks("SOFT map"));
}

console.log("\n=== the gap scan measures and never fixes");
{
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n\n- **Session** — one person's live access\n",
    "docs/README.md": doc({ id: "f", title: "Docs", lenses: ["ARCHITECT"], status: "DONE" }, "x\n", "`For: Architect` · `Status: ✅ DONE`"),
    [`docs/${SEAT.purpose}/README.md`]: doc({ id: "p", title: "Purpose", lenses: ["ARCHITECT"], status: "PLANNING" }, "x\n", "`For: Architect` · `Status: 🔮 PLANNING`"),
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }, "x\n", "`For: Architect` · `Status: 🔮 PLANNING`"),
    [`docs/${SEAT.constructs}/01-core/README.md`]: doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }, "x\n", "`For: Architect` · `Status: 🔮 PLANNING`"),
    // A page with no metadata block: the finding the scan exists to count.
    [`docs/${SEAT.behaviors}/README.md`]: "# Behaviors\n\nno block here.\n",
    // A node still carrying a tree: the shape the consolidation removed.
    "pkg/docs/README.md": "# stray\n",
  });
  const before = readAt(root, `docs/${SEAT.behaviors}/README.md`);
  const rep = run(root, ["audit", "report", "."]);

  // THE MEASUREMENT IS A RETURN VALUE, NEVER A FILE (RD.DEVEX.WORKSPACE.149). A report is written by the agent
  // from what it read; a tool hands over what it measured and writes nothing into a pocket. Before
  // this, the scan wrote the only machine-authored page in a folder of authored ones, and rewrote
  // it on every run whether anybody had asked a question or not.
  one("it writes nothing into the repository's pocket", absent(root, `docs/${POCKET.artifacts}/${ARTIFACT.reports}/docs-audit.md`), true);
  one("the measurement comes back to the caller", rep, has("still carry a docs tree"));
  one("IT FIXES NOTHING IT MEASURES", readAt(root, `docs/${SEAT.behaviors}/README.md`), before);
  one("a node still carrying a docs tree is a finding", rep, has("still carry a docs tree"));
  one("a domain with nothing written in it is a DOMAIN, not a group", rep, has("`01-core`"));
  one("what the concept lists is what the domain owes", rep, (g) => /\| `01-core` \| ✅ \| 0 \| 1 \|/.test(g));
  // An approach page lives in its workstream, so the pocket holds no arguments to count.
  one("the report counts no arguments in the pocket", rep, lacks("arguments still in the pocket"));
  one("a page with no block is counted", rep, has("block (RULE)"));
  one("--json hands the agent the same measurement as data",
    run(root, ["audit", "report", ".", "--json"]), (g) => {
      try { const d = JSON.parse(g); return d.repo !== undefined && Array.isArray(d.seats) && d.measuredAt !== undefined; }
      catch { return false; }
    });

  // AN ARGUMENT IS A WORKSTREAM'S, NEVER A REPOSITORY'S. 05-artifacts.md has always said "an
  // argument does not live here", but nothing checked it, so fifteen pages accumulated across three
  // repositories before anybody counted. A rule a person has to remember is a rule that holds until
  // the week somebody is busy. The page is refused wherever it sits in `docs/`, a pocket folder too.
  {
    const ws = repo({
      [`${POCKET_DOCS}/x-approach.html`]:
        doc({ id: "x", variant: "approach", title: "X", lenses: ["ARCHITECT"], status: "PLANNING" },
            `${LINES.stylesheet}\n<p>an argument</p>\n`),
    });
    const got = run(ws, ["audit", "check", `${POCKET_DOCS}/x-approach.html`]);
    one("an approach page in a repository's docs is refused", got, has("belongs to the workstream"));
  }
  {
    // The same page under a workstream is exactly where it belongs, and must pass untouched.
    const ws = repo({
      [`.spndevex/${WORKSTREAMS}/open/001-a/a-approach.html`]:
        doc({ id: "a", variant: "approach", title: "A", lenses: ["ARCHITECT"], status: "PLANNING" },
            `${LINES.stylesheet}\n<p>an argument</p>\n`),
    });
    const got = run(ws, ["audit", "check", `.spndevex/${WORKSTREAMS}/open/001-a/a-approach.html`]);
    one("the same page in a workstream is not", got, (g) => !/belongs to the workstream/.test(g));
  }

  // The pocket's folder set is docs, guides and reports (05-artifacts.md § What the pocket
  // holds). A folder the set does not name held "what a document was written from", and every such
  // file was a seat depending on a pocket — 229 files across five repositories, 187 of them cited by
  // nothing. The check reads the set, so any other name is refused the same way; two are probed.
  for (const folder of ["resources", "notes"]) {
    const ws = repo({
      [`docs/${POCKET.artifacts}/${folder}/packages/x/purpose.md`]:
        doc({ id: "xp", title: "Purpose — x", lenses: ["ARCHITECT"], status: "DONE" },
            "why x exists\n", "`For: Architect` · `Status: ✅ DONE`"),
    });
    const got = run(ws, ["audit", "check", `docs/${POCKET.artifacts}/${folder}/packages/x/purpose.md`]);
    one(`a file in a pocket folder outside the set (${folder}/) is refused`, got, has(`never in \`${folder}/\``));
  }

  // A PAGE OUT OF ITS PLACE IS TOLD ITS PLACE. A repository whose pages sit in one folder of overviews
  // and one tree of construct pages, directly in the pocket, holds each page in a folder the set does
  // not name. The finding says where the page belongs, so the move needs no second look at the book.
  {
    const overviewPage = `<meta charset="utf-8">\n<title>Core</title>\n` +
      block({ id: "o", variant: "overview", parentId: "concept", title: "Core", lenses: ["ARCHITECT"], summary: "s." }) + `${LINES.stylesheet}\n<h2>Overview</h2>\n<p>x</p>`;
    const constructPage = `<meta charset="utf-8">\n<title>Thing</title>\n` +
      block({ id: "x", variant: "construct", parentId: "core", title: "Thing", lenses: ["ARCHITECT"], status: "DONE", summary: "s.", dependsOn: [] }) + `${LINES.stylesheet}\n<h2>Boundary</h2>\n<p>x</p>`;
    // A folder named `overviews`, which the pocket's set does not hold, and the pocket's own `constructs`.
    const LEFT_OVERVIEWS = `docs/${POCKET.artifacts}/overviews`;
    const LEFT_CONSTRUCTS = `docs/${POCKET.artifacts}/${CONSTRUCT_PAGES}`;
    const placed = {
      overview: `${POCKET_DOCS}/01-core/core-overview.html`,
      beside: `${POCKET_DOCS}/core-overview.html`,
      construct: `${POCKET_DOCS}/01-core/${CONSTRUCT_PAGES}/01-thing-construct.html`,
      nested: `${POCKET_DOCS}/01-area/02-core/${CONSTRUCT_PAGES}/01-thing-construct.html`,
    };
    const at = (path, text) => run(repo({ "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n", [path]: text }), ["audit", "check", path]);

    const leftOverview = at(`${LEFT_OVERVIEWS}/core-overview.html`, overviewPage);
    one("[MKT.SCRIPTS.110] an overview left under `overviews/` is a finding of the audit, and it names the folder the pocket does not hold",
      leftOverview, (g) => g.includes("✗ RULE block") && g.includes("the pocket holds `docs/`, `guides/` and `reports/`, and no `overviews/`"));
    one("[MKT.SCRIPTS.110] and it names where the overview belongs: beside the hub, or in its domain's folder",
      leftOverview, has(`this page belongs at ${placed.beside} beside the hub, or ${POCKET_DOCS}/<domain>/core-overview.html`));
    const leftConstruct = at(`${LEFT_CONSTRUCTS}/01-core/01-thing-construct.html`, constructPage);
    one("[MKT.SCRIPTS.110] a construct page left under the pocket's own `constructs/` is a finding of the audit",
      leftConstruct, (g) => g.includes("✗ RULE block") && g.includes(`and no \`${CONSTRUCT_PAGES}/\``));
    one("[MKT.SCRIPTS.110] and it names the page's path in its domain's constructs folder", leftConstruct, has(`this page belongs at ${placed.construct}`));
    one("[MKT.SCRIPTS.110] a construct page two folders deep is told both folders, with the constructs folder last",
      at(`${LEFT_CONSTRUCTS}/01-area/02-core/01-thing-construct.html`, constructPage), has(`this page belongs at ${placed.nested}`));
    one("[MKT.SCRIPTS.110] a construct page beside its domain's overviews is out of its place too, and is told the constructs folder beside it",
      at(`${POCKET_DOCS}/01-core/01-thing-construct.html`, constructPage),
      (g) => g.includes(`out of its place in \`${ARTIFACT.docs}/\``) && g.includes(`it belongs at ${placed.construct}`));
    one("[MKT.SCRIPTS.110] an overview in a constructs folder is out of its place, and is told the two places an overview sits in",
      at(`${POCKET_DOCS}/01-core/${CONSTRUCT_PAGES}/core-overview.html`, overviewPage), has(`it belongs at ${placed.beside} beside the hub, or`));
    for (const [name, path, text] of [["an overview in its domain's folder", placed.overview, overviewPage],
      ["an overview beside the hub", placed.beside, overviewPage], ["a construct page in its domain's constructs folder", placed.construct, constructPage]])
      one(`[MKT.SCRIPTS.110] ${name} draws no finding about its place`, at(path, text),
        (g) => !g.includes("the pocket holds") && !g.includes("belongs at") && !g.includes("out of its place"));
    one("[MKT.SCRIPTS.110] a construct page with no seat file at the path its own path gives is said to have none",
      at(placed.construct, constructPage), has("no seat file sits at the mirrored path"));
  }
  {
    // The same file in the seat that owns it is exactly right, and must pass untouched.
    const ws = repo({
      [`docs/${SEAT.purpose}/x.md`]:
        doc({ id: "xp", title: "Purpose — x", lenses: ["ARCHITECT"], status: "DONE" },
            "why x exists\n", "`For: Architect` · `Status: ✅ DONE`"),
    });
    const got = run(ws, ["audit", "check", `docs/${SEAT.purpose}/x.md`]);
    one(`the same file in ${SEAT.purpose} is not`, got, (g) => !/lives in a seat/.test(g));
  }
  {
    // A folder the set names is the pocket working as intended, and this rule stays quiet on it.
    const ws = repo({
      [`docs/${POCKET.artifacts}/${ARTIFACT.reports}/x.md`]:
        doc({ id: "xr", title: "Report — x", lenses: ["ARCHITECT"], status: "DONE" },
            "what x measured\n", "`For: Architect` · `Status: ✅ DONE`"),
    });
    const got = run(ws, ["audit", "check", `docs/${POCKET.artifacts}/${ARTIFACT.reports}/x.md`]);
    one(`a file in ${ARTIFACT.reports}/, a folder the set names, is not`, got, (g) => !/lives in a seat/.test(g));
  }

  one("and it names what it did NOT measure rather than reporting a zero",
    rep, has("What this report does not measure"));
}
// ------------------------------------------------- a closed vocabulary, and the code under it

console.log("=== a closed value is declared once, and agrees with what realizes it");
{
  // A chapter DECLARING a value, and a node whose source carries the same enum. The realization
  // index walks `<repo>/<apps|packages>/<node>/src`, which is where a declaration lives on this
  // stack, so the fixture is shaped that way rather than mocked.
  // The tag line is not decoration here. Without it every fixture earns a RULE header finding, and
  // a `lacks("vocabulary")` assertion then passes on a page the check never got to read — which is
  // how the first run of this suite reported four passes that proved nothing.
  const chapter = (title, id, body) =>
    doc({ id: id, parentId: "concept", title: title, variant: "construct", lenses: ["ARCHITECT"],
          status: "PLANNING", dependsOn: [] },
        `## Overview\n\nWhy it exists.\n\n## Terms\n\n| Term | Contract term | What it means |\n| --- | --- | --- |\n| Rung | \`SPRungType\` | how much is real |\n\n## Model\n\nThe model.\n\n## Parts\n\n${body}\n\n## Boundary\n\nIt stops here.\n\n## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| \`RD.DEVEX.WORKSPACE.165\` | that a closed vocabulary is stated once | MUST |\n\n| Repo | Node | What it realizes | State |\n| --- | --- | --- | --- |\n| t | thing-ts | the enum | planned |\n\n## Proof\n\nNothing yet.\n`,
        "`For: Architect` · `Status: 🔮 PLANNING`");

  const AGREES = "```ts\nexport enum SPRungType {\n  UNIT = 'UNIT',    // alone\n  WIRED = 'WIRED',  // against the real thing\n}\n```";
  const SOURCE = "export enum SPRungType {\n  UNIT = 'UNIT',\n  WIRED = 'WIRED',\n}\n";

  {
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "packages/thing-ts/src/rungs.ts": SOURCE,
      [`docs/${SEAT.constructs}/01-core/rungs.md`]: chapter("Rungs", "rungs", AGREES),
    });
    one("a declaration that matches the code it realizes is reported nowhere",
      run(root, ["audit", "check", `docs/${SEAT.constructs}/01-core/rungs.md`]), lacks("vocabulary"));
  }

  {
    // The book ahead of the code. This is the normal way a standard leads, so the MESSAGE has to
    // name both sides rather than assert which one is wrong.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "packages/thing-ts/src/rungs.ts": SOURCE,
      [`docs/${SEAT.constructs}/01-core/rungs.md`]: chapter("Rungs", "rungs",
        "```ts\nexport enum SPRungType {\n  UNIT = 'UNIT',      // alone\n  WIRED = 'WIRED',    // against the real thing\n  BROWSED = 'BROWSED',// in a real browser\n}\n```"),
    });
    const got = run(root, ["audit", "check", `docs/${SEAT.constructs}/01-core/rungs.md`]);
    one("a member the book names and the code lacks is reported", got, has("names BROWSED"));
    one("and the finding names the file that would have to change", got, has("src/rungs.ts"));
    one("neither side is called the wrong one", got, has("one of the two is wrong"));
  }

  {
    // The code ahead of the book — a value added in a release nobody documented. The corpus had
    // exactly this the day the check was written, and nothing compared the two.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "packages/thing-ts/src/rungs.ts": "export enum SPRungType {\n  UNIT = 'UNIT',\n  WIRED = 'WIRED',\n  BROWSED = 'BROWSED',\n}\n",
      [`docs/${SEAT.constructs}/01-core/rungs.md`]: chapter("Rungs", "rungs", AGREES),
    });
    one("a member the code carries and the book omits is reported",
      run(root, ["audit", "check", `docs/${SEAT.constructs}/01-core/rungs.md`]), has("does not name BROWSED"));
  }

  {
    // A COMPACT DECLARATION, AND THE NEIGHBOUR BELOW IT. The first reading of this closed a body at
    // the first line-start `}`, which a one-line enum does not have — so the match ran into the
    // next enum and reported its members as this one's. The corpus finding it produced was
    // confident, precise and wrong about a chapter that was correct.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "packages/thing-ts/src/rungs.ts": "export enum SPRungType { UNIT = 'UNIT' }\nexport enum SPOther {\n  ADM = 'ADM',\n  MIG = 'MIG',\n}\n",
      [`docs/${SEAT.constructs}/01-core/rungs.md`]: chapter("Rungs", "rungs",
        "```ts\nexport enum SPRungType { UNIT = 'UNIT' }  // alone\n\nexport enum SPOther {\n  ADM = 'ADM',  // administer\n  MIG = 'MIG',  // migrate\n}\n```"),
    });
    const got = run(root, ["audit", "check", `docs/${SEAT.constructs}/01-core/rungs.md`]);
    one("a one-line enum does not swallow the enum after it", got, lacks("vocabulary"));
    one("and neither is accused of carrying the other's members", got, lacks("ADM"));
  }

  {
    // A value nothing realizes is the normal state of a standard, and reporting it would make the
    // book unable to lead anything.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      [`docs/${SEAT.constructs}/01-core/rungs.md`]: chapter("Rungs", "rungs", AGREES),
    });
    one("a value no source realizes yet is reported nowhere",
      run(root, ["audit", "check", `docs/${SEAT.constructs}/01-core/rungs.md`]), lacks("vocabulary"));
  }

  {
    // The other half of the rule: ONE place. Two chapters declaring one value is two answers that
    // drift, which is what the rule exists to prevent.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      [`docs/${SEAT.constructs}/01-core/rungs.md`]: chapter("Rungs", "rungs", AGREES),
      [`docs/${SEAT.constructs}/01-core/again.md`]: chapter("Again", "again", AGREES),
    });
    one("one value declared in two chapters is reported",
      run(root, ["audit", "check", `docs/${SEAT.constructs}/01-core/rungs.md`, `docs/${SEAT.constructs}/01-core/again.md`]),
      has("is declared in 2 chapters"));
  }

  {
    // Named in Terms, declared nowhere — the state 51 chapters were in when this was written.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      [`docs/${SEAT.constructs}/01-core/rungs.md`]: chapter("Rungs", "rungs", "No declaration here.\n"),
      [`docs/${SEAT.constructs}/01-core/other.md`]: chapter("Other", "other", "Nor here.\n"),
    });
    one("a contract term no chapter declares is reported",
      run(root, ["audit", "check", `docs/${SEAT.constructs}/01-core/rungs.md`, `docs/${SEAT.constructs}/01-core/other.md`]),
      has("`SPRungType` is named as a contract term and no chapter declares"));
  }

  {
    // A MEMBER REFERENCE NAMES ITS TYPE. `SPDocPassType.FRAME` claims the type exists exactly as the
    // bare name does, and reading only the bare form missed three of the four stale contract terms
    // found the day this check was written — each naming a vocabulary the contract had deleted.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      [`docs/${SEAT.constructs}/01-core/rungs.md`]:
        doc({ id: "rungs", parentId: "concept", title: "Rungs", variant: "construct", lenses: ["ARCHITECT"],
              status: "PLANNING", dependsOn: [] },
            "## Overview\n\nWhy it exists.\n\n## Terms\n\n| Term | Contract term | What it means |\n| --- | --- | --- |\n| Alone | `SPRungType.UNIT` | proven with nothing running |\n\n## Model\n\nThe model.\n\n## Parts\n\nNo declaration here.\n\n## Boundary\n\nIt stops here.\n\n## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| `RD.DEVEX.WORKSPACE.165` | one place | MUST |\n\n| Repo | Node | What it realizes | State |\n| --- | --- | --- | --- |\n| t | thing-ts | the enum | planned |\n\n## Proof\n\nNothing yet.\n",
            "`For: Architect` · `Status: 🔮 PLANNING`"),
      [`docs/${SEAT.constructs}/01-core/other.md`]: chapter("Other", "other", "Nor here.\n"),
    });
    one("a member reference names its type, and an undeclared one is reported",
      run(root, ["audit", "check", `docs/${SEAT.constructs}/01-core/rungs.md`, `docs/${SEAT.constructs}/01-core/other.md`]),
      has("`SPRungType` is named as a contract term"));
  }

  {
    // AN ENUM WHOSE COMMENT HOLDS A BRACE IS READ WHOLE. A body that stops at the first brace reads
    // no such declaration at all, and then nothing is compared.
    const BRACED = "export enum SPRungType {\n  /** alone, see {@link SPOther} */\n  UNIT = 'UNIT',\n  WIRED = 'WIRED',\n}\n";
    one("[MKT.SCRIPTS.86] an enum whose comment holds a brace matches as one declaration",
      [...BRACED.matchAll(ENUM_HEAD)].length, 1);
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "packages/thing-ts/src/rungs.ts": BRACED,
      [`docs/${SEAT.constructs}/01-core/rungs.md`]: chapter("Rungs", "rungs",
        "```ts\nexport enum SPRungType {\n  UNIT = 'UNIT',      // alone\n  WIRED = 'WIRED',    // against the real thing\n  BROWSED = 'BROWSED',// in a real browser\n}\n```"),
    });
    one("[MKT.SCRIPTS.86] known-bad: the code's enum with a brace in its comment is still compared with the book",
      run(root, ["audit", "check", `docs/${SEAT.constructs}/01-core/rungs.md`]), has("names BROWSED"));
  }

  {
    // A TERM THAT ENDS IN `Type` AND IS NOT AN ENUM. `EntityType` is a row shape, which the source
    // declares as an interface, so no chapter owes it a list of members.
    const terms = (title, id, term) =>
      doc({ id: id, parentId: "concept", title: title, variant: "construct", lenses: ["ARCHITECT"], status: "PLANNING", dependsOn: [] },
        `## Overview\n\nWhy it exists.\n\n## Terms\n\n| Term | Contract term | What it means |\n| --- | --- | --- |\n| Entity type | \`${term}\` | one kind of record |\n\n## Model\n\nThe model.\n\n## Parts\n\nNo declaration here.\n\n## Boundary\n\nIt stops here.\n`,
        "`For: Architect` · `Status: 🔮 PLANNING`");
    const files = (source) => ({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      ...(source === null ? {} : { "packages/thing-ts/src/entity.ts": source }),
      [`docs/${SEAT.constructs}/01-core/entity.md`]: terms("Entity", "entity", "EntityType"),
      [`docs/${SEAT.constructs}/01-core/other.md`]: terms("Other", "other", "EntityType"),
    });
    const both = [`docs/${SEAT.constructs}/01-core/entity.md`, `docs/${SEAT.constructs}/01-core/other.md`];
    one("[MKT.SCRIPTS.86] a `…Type` term the source declares as an interface is not reported as an enum with no members",
      run(repo(files("export interface EntityType extends EntityTypeInfo {\n  id: string;\n}\n")), ["audit", "check", ...both]), lacks("no chapter declares"));
    one("[MKT.SCRIPTS.86] nor is one the source declares as a type alias",
      run(repo(files("export type EntityType = { id: string };\n")), ["audit", "check", ...both]), lacks("no chapter declares"));
    one("[MKT.SCRIPTS.86] known-bad: a `…Type` term the source declares as an enum, and no chapter declares, is still reported",
      run(repo(files("export enum EntityType {\n  PERSON = 'PERSON',\n}\n")), ["audit", "check", ...both]),
      has("`EntityType` is named as a contract term and no chapter declares"));
    one("[MKT.SCRIPTS.86] known-bad: so is one that no source declares at all, because the book may lead the code",
      run(repo(files(null)), ["audit", "check", ...both]), has("`EntityType` is named as a contract term and no chapter declares"));
  }

  {
    // A PATH IN NO REPOSITORY IS READ AS IT IS. One page read alone cannot see a corpus, so it must
    // not accuse another chapter of not existing.
    const root = loose({
      [`docs/${SEAT.constructs}/01-core/rungs.md`]: chapter("Rungs", "rungs", "No declaration here.\n"),
      [`docs/${SEAT.constructs}/01-core/other.md`]: chapter("Other", "other", "Nor here.\n"),
    });
    one("a page in no repository, audited alone, never claims a value is undeclared",
      run(root, ["audit", "check", `docs/${SEAT.constructs}/01-core/rungs.md`]), (got) => got.includes("clean — 1 page") && !got.includes("no chapter declares"));
    one("known-bad: the folder that holds both pages, audited, does claim it",
      run(root, ["audit", "check", "docs"]), has("no chapter declares"));
  }

  {
    // INSIDE A REPOSITORY A NARROW RUN STILL READS THE CORPUS. A value declared in two chapters is a
    // finding no single page can show, and it is reported whichever of the two the run is narrowed to.
    const rungs = `docs/${SEAT.constructs}/01-core/rungs.md`, again = `docs/${SEAT.constructs}/01-core/again.md`;
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      [rungs]: chapter("Rungs", "rungs", AGREES),
      [again]: chapter("Again", "again", AGREES),
    });
    const times = (got) => got.split("is declared in 2 chapters").length - 1;
    one("[MKT.SCRIPTS.114] a value declared in two chapters is reported on a run narrowed to one of them",
      run(root, ["audit", "check", rungs]), (got) => times(got) === 1 && got.includes("over 1 page"));
    one("[MKT.SCRIPTS.114] and on a run narrowed to the other", run(root, ["audit", "check", again]), (got) => times(got) === 1 && got.includes("over 1 page"));
    one("[MKT.SCRIPTS.114] a run on the whole repository reports it once", times(run(root, ["audit", "check"])), 1);

    const lone = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      [rungs]: chapter("Rungs", "rungs", "No declaration here.\n"),
    });
    one("[MKT.SCRIPTS.114] a term no chapter of the repository declares is reported on a run narrowed to the page that names it",
      run(lone, ["audit", "check", rungs]), has("`SPRungType` is named as a contract term and no chapter declares"));
  }

  {
    // A grade, not a refusal. A new check that refuses is a check people satisfy by editing the
    // page to match the tool.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "packages/thing-ts/src/rungs.ts": SOURCE,
      [`docs/${SEAT.constructs}/01-core/rungs.md`]: chapter("Rungs", "rungs",
        "```ts\nexport enum SPRungType {\n  UNIT = 'UNIT',  // alone\n}\n```"),
    });
    const got = run(root, ["audit", "check", `docs/${SEAT.constructs}/01-core/rungs.md`]);
    one("a disagreement reports rather than refuses", got, has("SOFT vocabulary"));
    one("and it is counted among the soft findings", got, has("0 RULE, 1 SOFT"));
  }
}


console.log("\n=== a domain overview borrows from its DOMAIN, not from the concept (Q228, Q229)");
{
  // THE DOMAIN'S READING ORDER IS NOT THE FILE ORDER. `beta` depends on `gamma`, so the face reads
  // Gamma before Beta however the files are numbered — and an overview that lists them the other
  // way round has invented an order its own face contradicts.
  const seat = (id, title, deps) => doc(
    { id, variant: "construct", parentId: "core", title, lenses: ["ARCHITECT"], status: "PLANNING", dependsOn: deps },
    "## Boundary\n\nx\n", "`For: Architect` · `Status: 🔮 PLANNING`");
  const tree = (sections) => ({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/README.md`]: doc({ id: "core", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/01-beta.md`]: seat("beta", "Beta", ["gamma"]),
    [`docs/${SEAT.constructs}/01-core/02-gamma.md`]: seat("gamma", "Gamma", []),
    [`${POCKET_DOCS}/01-core/core-overview.html`]:
      `<meta charset="utf-8">\n<title>Core</title>\n` +
      block({ id: "o", variant: "overview", parentId: "concept", title: "Core", lenses: ["ARCHITECT"], summary: "s." }) +
      `${LINES.stylesheet}\n` + sections.map((h) => `<h2>${h}</h2>\n<p>x</p>`).join("\n"),
  });
  const audit = (secs) => run(repo(tree(secs)), ["audit", "check", `${POCKET_DOCS}/01-core/core-overview.html`]);

  // ASSERT ON THE FINDING UNDER TEST, never on the absence of every finding: this fixture carries
  // no `<header>`, so `checkHeader` fires on it and a bare `lacks("✗")` was failing for a reason
  // that has nothing to do with the source of an overview's sections.
  one("a section per construct, in the face's reading order, is accepted",
    audit(["Overview", "Gamma", "Beta", "Glossary", "Where to go next"]), lacks("name no construct"));
  one("and its order is not questioned either",
    audit(["Overview", "Gamma", "Beta", "Glossary", "Where to go next"]), lacks("reading order"));
  one("and the concept naming nothing below the domain no longer refuses it",
    audit(["Overview", "Gamma", "Beta", "Glossary", "Where to go next"]), lacks("no counterpart"));
  one("one section naming no construct is the connective one, and it is allowed",
    audit(["Overview", "Gamma", "Beta", "The rules this path shares", "Glossary", "Where to go next"]),
    lacks("name no construct"));
  one("two are refused, because the second is an argument the domain does not account for",
    audit(["Overview", "Gamma", "Beta", "The rules", "Something else", "Glossary", "Where to go next"]),
    has("name no construct of this domain"));
  one("and the reading order is held, so the file order cannot be mistaken for it",
    audit(["Overview", "Beta", "Gamma", "Glossary", "Where to go next"]),
    has("holds its face's reading order"));
}

console.log("\n=== an HTML page links the HTML page, never the markdown seat (Q234)");
{
  const page = (href) =>
    `<meta charset="utf-8">\n<title>T</title>\n` +
    block({ id: "o", variant: "overview", parentId: "concept", title: "T", lenses: ["ARCHITECT"], summary: "s." }) +
    `${LINES.stylesheet}\n<h2>Overview</h2>\n<p>See <a href="${href}">it</a>.</p>\n<h2>Glossary</h2>\n<p>x</p>\n<h2>Where to go next</h2>\n<p>x</p>`;
  const mk = (href) => repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    [`docs/${SEAT.constructs}/01-core/thing.md`]: "# Thing\n",
    [`${POCKET_DOCS}/o-overview.html`]: page(href),
  });
  one("a link to a construct SEAT is refused, and it names the page it should have used",
    run(mk(`../../${SEAT.constructs}/01-core/thing.md`), ["audit", "check", `${POCKET_DOCS}/o-overview.html`]),
    has("thing-construct.html"));
  one("a link to the produced page is silent",
    run(mk(`01-core/${CONSTRUCT_PAGES}/thing-construct.html`), ["audit", "check", `${POCKET_DOCS}/o-overview.html`]),
    lacks("an HTML page links the HTML page"));
  // A SEAT README IS PRODUCED AS NO PAGE AT ALL, so a link to one has nowhere else to go. Refusing
  // it would be a gate demanding a file the generator never writes.
  one("a link to a seat README keeps its .md, because no page exists for it",
    run(mk(`../../${SEAT.constructs}/README.md`), ["audit", "check", `${POCKET_DOCS}/o-overview.html`]),
    lacks("an HTML page links the HTML page"));
}

console.log("\n=== the back link and the previous and next doors open a page; the content may open a markdown file");
{
  const page = ({ home, next, inside, previous = "p-overview.html", door = "n-overview.html#top" }) =>
    `<meta charset="utf-8">\n<title>T</title>\n` +
    block({ id: "o", variant: "overview", parentId: "concept", title: "T", lenses: ["ARCHITECT"], summary: "s." }) +
    `${LINES.stylesheet}\n<nav class="sds-rail" id="rail">\n  <a class="sds-home" href="${home}">&larr; Home</a>\n  <a href="#s1">Overview</a>\n</nav>\n` +
    `<section id="s1">\n  <div class="sds-section-head"><h2>Overview</h2></div>\n<p>See <a href="${inside}">a sample</a>.</p>\n</section>\n` +
    `<section id="s2">\n  <div class="sds-section-head"><h2>Glossary</h2></div>\n<p>x</p>\n</section>\n` +
    `<section id="s3">\n  <div class="sds-section-head"><h2>Where to go next</h2></div>\n<ul><li><a href="${next}">next</a></li></ul>\n` +
    `<div class="sds-nextnav">\n  <a class="sds-nextnav-card" href="${previous}"><span class="sds-direction">&larr; Previous</span><span class="sds-title">P</span></a>\n` +
    `  <a class="sds-nextnav-card sds-next" href="${door}"><span class="sds-direction">Next &rarr;</span><span class="sds-title">N</span></a>\n</div>\n</section>`;
  const FILE = `${POCKET_DOCS}/o-overview.html`;
  const mk = (parts) => repo({ "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n", [FILE]: page(parts) });
  const good = { home: "concept-overview.html", next: "p-overview.html#x", inside: "../../notes/sample.md" };
  const check = (root) => run(root, ["audit", "check", FILE, "--finding", "rail"]);
  const exitOf = (root) => { try { execFileSync(process.execPath, [TOOL, "docs", "audit", "check", FILE, "--finding", "rail"], { cwd: root, stdio: "pipe", env: { ...process.env, SPN_WORKSPACE: root } }); return 0; } catch (error) { return error.status; } };
  one("a back link and both doors that open a page, a rail anchor, and a markdown link in the content are clean",
    check(mk(good)), has("clean"));
  const bad = mk({ ...good, home: `../../../${SEAT.constructs}/02-support/README.md` });
  one("a back link that opens a markdown file is a RULE, and it says the back link",
    check(bad), (g) => g.includes("✗ RULE rail") && g.includes("the back link opens") && g.includes("README.md"));
  one("and the audit exits 1 on it", exitOf(bad), 1);
  one("a Where to go next link that opens a markdown file is no finding",
    check(mk({ ...good, next: "../x/thing.md#s1" })), lacks("RULE rail"));
  one("a markdown link inside the content is never refused",
    check(mk({ ...good, inside: "sample.md" })), lacks("RULE rail"));
  one("a previous door that opens a markdown file is a RULE",
    check(mk({ ...good, previous: "../x/thing.md#s1" })), (g) => g.includes("✗ RULE rail") && g.includes("the previous door opens") && g.includes("thing.md"));
  one("a next door that opens a markdown file is a RULE",
    check(mk({ ...good, door: "../x/thing.md" })), (g) => g.includes("✗ RULE rail") && g.includes("the next door opens") && g.includes("thing.md"));
  one("a previous door and a next door that open a page, with an anchor, are clean",
    check(mk({ ...good, previous: "a-overview.html#s2", door: "b-overview.html#s3" })), has("clean"));
  one("the finding name `rail` is one the command takes", FINDINGS.includes("rail"), true);
}

console.log("\n=== every page walks up one step: the back link by kind of page, and the top of a chain has none");
{
  // A page of any kind, with `home` as the link at the top of its rail, or none where `home` is null.
  const page = (variant, title, home, extra = "") =>
    `<meta charset="utf-8">\n<title>${title}</title>\n` +
    block({ id: `${variant}-x`, variant, title, lenses: ["ARCHITECT"], summary: "s." }) +
    `${LINES.stylesheet}\n<nav class="sds-rail" id="rail">\n${home === null ? "" : `  <a class="sds-home" href="${home}">&larr; Up</a>\n`}</nav>\n` +
    `<section id="s1">\n<p>x</p>${extra}\n</section>\n`;
  const HUB_AT = `${POCKET_DOCS}/concept-overview.html`;
  const hubFile = page("overview", "The Hub", null);
  const rail = (root, file) => run(root, ["audit", "check", file, "--finding", "rail"]);
  const refused = (root, file, ...words) => one(`${file.split("/").pop()}: a RULE that says ${words[0]}`, rail(root, file),
    (g) => g.includes("✗ RULE rail") && words.every((word) => g.includes(word)));
  const clean = (name, root, file) => one(name, rail(root, file), has("clean"));
  const base = { "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n", [HUB_AT]: hubFile };

  // THE TOPS OF A CHAIN: the hub and an approach page carry none.
  clean("a hub with no back link is clean", repo(base), HUB_AT);
  refused(repo({ ...base, [HUB_AT]: page("overview", "The Hub", "../../README.md") }), HUB_AT, "the top of a repository's chain");
  const approachAt = ".spndevex/workstreams/open/001-x/approach.html";
  clean("an approach page with no back link is clean", repo({ ...base, [approachAt]: page("approach", "X", null) }), approachAt);
  refused(repo({ ...base, [approachAt]: page("approach", "X", "../../../README.md") }), approachAt, "the top of a workstream's chain");
  const closedAt = ".spndevex/workstreams/closed/002-y/y-approach.html";
  refused(repo({ ...base, [closedAt]: page("approach", "Y", "../../../README.md") }), closedAt, "the top of a workstream's chain");

  // AN OVERVIEW, A GUIDE, A REPORT AND AN INDEX GO BACK TO THE HUB.
  const kinds = {
    overview: [`${POCKET_DOCS}/01-core/core-overview.html`, "../concept-overview.html"],
    guide: [`docs/${POCKET.artifacts}/${ARTIFACT.guides}/start-guide.html`, "../docs/concept-overview.html"],
    report: [`docs/${POCKET.artifacts}/${ARTIFACT.reports}/2026/audit-report.html`, "../../docs/concept-overview.html"],
  };
  for (const [variant, [file, up]] of Object.entries(kinds)) {
    clean(`a ${variant} that goes back to the hub is clean`, repo({ ...base, [file]: page(variant, "T", up) }), file);
    const none = repo({ ...base, [file]: page(variant, "T", null) });
    refused(none, file, `no way back`, "the hub of its repository", "concept-overview.html");
    const wrong = repo({ ...base, [file]: page(variant, "T", "../other-overview.html"), [`${POCKET_DOCS}/other-overview.html`]: page("overview", "O", "concept-overview.html") });
    refused(wrong, file, `${variant === "overview" ? "an" : "a"} ${variant} goes back to the hub of its repository`, "concept-overview.html");
  }
  const indexAt = `docs/${POCKET.artifacts}/index.html`;
  const indexPage = (home) => `<meta charset="utf-8">\n<title>I</title>\n` +
    block({ id: "i", variant: "index", title: "Artifacts", summary: "s." }) +
    `${LINES.stylesheet}\n<div class="sds-index"><aside class="sds-index-side">\n${home === null ? "" : `<a class="sds-home" href="${home}">&larr; The Hub</a>\n`}</aside></div>\n`;
  clean("an index that goes back to the hub is clean", repo({ ...base, [indexAt]: indexPage("artifacts/docs/concept-overview.html".replace("artifacts/", "")) }), indexAt);
  refused(repo({ ...base, [indexAt]: indexPage(null) }), indexAt, "no way back", "docs/concept-overview.html");
  refused(repo({ ...base, [indexAt]: indexPage("docs/01-core/core-overview.html"), [`${POCKET_DOCS}/01-core/core-overview.html`]: page("overview", "C", "../concept-overview.html") }),
    indexAt, "an index goes back to the hub");
  clean("a repository with no hub owes its overview no way back, because there is nothing to open",
    repo({ "CONCEPT.md": base["CONCEPT.md"], [kinds.overview[0]]: page("overview", "T", null) }), kinds.overview[0]);

  // A CONSTRUCT PAGE GOES BACK TO THE OVERVIEW THAT LINKS FORWARD TO IT, never to the hub while one does.
  const seats = {
    [`docs/${SEAT.constructs}/01-core/README.md`]: doc({ id: "core", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/thing.md`]: doc({ id: "thing", variant: "construct", parentId: "core", title: "Thing", lenses: ["ARCHITECT"], status: "PLANNING", dependsOn: [] }, "x\n"),
  };
  const constructAt = `${POCKET_DOCS}/01-core/constructs/thing-construct.html`;
  const naming = page("overview", "Core Overview", "../concept-overview.html", '<a href="constructs/thing-construct.html">Read thing</a>');
  const withOverview = (home) => repo({ ...base, ...seats, [`${POCKET_DOCS}/01-core/core-overview.html`]: naming,
    [constructAt]: page("construct", "Thing", home) });
  clean("a construct page that goes back to the overview naming it is clean", withOverview("../core-overview.html"), constructAt);
  refused(withOverview("../../concept-overview.html"), constructAt, "a construct goes back to the overview that links forward to it", "../core-overview.html");
  refused(withOverview(null), constructAt, "no way back", "the overview that links forward to it", "../core-overview.html");

  // A PREVIEW GOES BACK TO ITS APPROACH PAGE, AT THE SUBSECTION IT SERVES.
  const previewAt = ".spndevex/workstreams/open/001-x/notes/N001/previews/shape-preview.html";
  const withApproach = (home) => repo({ ...base, [approachAt]: page("approach", "X", null), [previewAt]: page("preview", "Shape", home) });
  clean("a preview that goes back to its approach page, at a subsection, is clean", withApproach("../../../approach.html#c12"), previewAt);
  refused(withApproach("../../../../../../../docs/artifacts/docs/concept-overview.html"), previewAt, "a preview goes back to the approach page of its workstream", "approach.html");
  refused(withApproach(null), previewAt, "no way back", "the approach page of its workstream");
  refused(repo({ ...base, [previewAt]: page("preview", "Shape", "../../../README.md") }), previewAt, "not an approach page");

  // THE KIND IS READ FROM THE FILE NAME AND THE BLOCK, NEVER FROM THE FOLDER: a page in a folder that
  // looks like a guide's, but whose name and block say overview, is judged as an overview, and a page
  // of a kind with no rule is left alone.
  const odd = `docs/${POCKET.artifacts}/${ARTIFACT.guides}/odd-overview.html`;
  refused(repo({ ...base, [odd]: page("overview", "Odd", null) }), odd, "this overview");
  clean("a page of a kind with no rule is left alone", repo({ ...base, [`${POCKET_DOCS}/x.html`]: page("capability", "C", null) }), `${POCKET_DOCS}/x.html`);
}

// ---------------------------------------------------------------- N37: the realization files

console.log("\n=== a data model is read against its fixed outline, and reports softly while it is new (N37 step 3)");
{
  const dm = (body, o = {}) => doc({ id: "dm", variant: "data_model", title: "Data Model", lenses: ["SERVER_DEV"], status: "DONE", ...o }, body,
    "`For: Backend developer` · `Status: ✅ DONE`");
  const good = "The tables below mirror `src/migrations`.\n\n## Tables\n\n| Table | Stores | The rule it keeps |\n| --- | --- | --- |\n" +
    "| `sp_session` | `SPSession` | one row per live access |\n\n## Indexes\n\n| Index | Why it exists |\n| --- | --- |\n" +
    "| `sp_session_org_idx` | a sign-out ends every session of one organization |\n";
  const at = `docs/${SEAT.capabilities}/01-core/module-server-core-ts/data-model.md`;
  const mk = (path, text) => repo({ "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n", [path]: text });

  one("a data model in the shape, beside its package, is clean",
    run(mk(at, dm(good)), ["audit", "check", at]), has("clean — 1 page"));
  // THE KNOWN-BAD INPUT IS THE CORPUS'S OWN FIRST ROW: 19 of 25 files opened with this dictionary heading.
  const dictionary = good.replace("| Table | Stores | The rule it keeps |", "| Consumer | Capability | Description |");
  const out = run(mk(at, dm(dictionary)), ["audit", "check", at]);
  one("a dictionary's first row under Tables is an outline finding", out,
    has("`Tables`'s first row is `Consumer · Capability · Description`; the data_model heading is `Table · Stores · The rule it keeps`"));
  one("and it is SOFT, because the check is new", out, has("SOFT outline"));
  one("and nothing about it refuses", out, has("0 RULE"));
  one("a data model with no Indexes section is missing one",
    run(mk(at, dm(good.replace(/## Indexes[\s\S]*$/, ""))), ["audit", "check", at]), has("missing section: Indexes"));
  one("Seeds and order is optional, and in its place it is silent",
    run(mk(at, dm(good + "\n## Seeds and order\n\nThe roles migration runs first.\n")), ["audit", "check", at]), has("clean — 1 page"));
  one("a section the outline does not have is named",
    run(mk(at, dm(good + "\n## Environment Variables\n\nNone.\n")), ["audit", "check", at]), has("the data_model outline does not have: Environment Variables"));
  const root = `docs/${SEAT.capabilities}/01-core/data-model.md`;
  one("a data model at a domain's root sits above the half that owns the storage",
    run(mk(root, dm(good)), ["audit", "check", root]), has("at a domain's root it sits above the half that owns the storage"));
  const bare = doc({ id: "dm", title: "Contract Terms", lenses: ["SERVER_DEV"], status: "DONE" }, good, "`For: Backend developer` · `Status: ✅ DONE`");
  one("a data-model.md that declares no kind is itself a finding — nothing else would read its outline",
    run(mk(at, bare), ["audit", "check", at]), has("declares `variant` `—`; the file kind is `data_model`"));
}

console.log("\n=== a surface map carries one table per ui/ folder, and a surface is one of four kinds (N37 step 3)");
{
  const sm = (body) => doc({ id: "sm", variant: "surface_map", title: "Surface Map", lenses: ["WEB_DEV"], status: "DONE" }, body,
    "`For: Web developer` · `Status: ✅ DONE`");
  const good = "## security\n\n| Surface | Kind | Contract term | What it is for |\n| --- | --- | --- | --- |\n" +
    "| `FactorsPage` | page | `IdentityFactor` | adds and removes a second way to confirm who you are |\n" +
    "| `useIdentityFactors` | hook | `IdentityFactor` | reads the factors a person has |\n\n" +
    "## layout\n\n| Surface | Kind | Contract term | What it is for |\n| --- | --- | --- | --- |\n" +
    "| `DSButton` | component | — | a button |\n";
  const at = `docs/${SEAT.capabilities}/01-core/module-web-core-ts/surface-map.md`;
  const mk = (text) => repo({ "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n", [at]: text });
  one("a surface map in the shape is clean", run(mk(sm(good)), ["audit", "check", at]), has("clean — 1 page"));
  one("a kind outside the four is named",
    run(mk(sm(good.replace("| hook |", "| util |"))), ["audit", "check", at]), has("`useIdentityFactors` is of kind `util`; a surface is one of page · component · widget · hook"));
  one("a screen-keyed first row is refused softly — routes are the application's",
    run(mk(sm(good.replace("| Surface | Kind | Contract term | What it is for |", "| Screen | Route | Contract term | Surfaces |"))), ["audit", "check", at]),
    has("`security`'s first row is `Screen · Route · Contract term · Surfaces`"));
}

console.log("\n=== a generated column is read against its own heading (N37 step 7)");
{
  const face = (region) => doc({ id: "c", title: "Core", lenses: ["ARCHITECT"] }, "Lead.\n\n" +
    "<!-- spn:generated glossary — do not edit inside these markers; `docs.ts face` writes it -->\n" + region + "<!-- /spn:generated -->\n",
    "`For: Architect`");
  const at = `docs/${SEAT.constructs}/01-core/README.md`;
  const mk = (region) => repo({ "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n", [at]: face(region) });
  const good = "| Term | Contract term | What it means |\n| --- | --- | --- |\n| **Session** | | |\n" +
    "| [sign-in](session.md) | `SPSession` | one person's live access |\n| [device](session.md) | — | the client a session opened from |\n";
  one("a glossary whose cells answer their headings is silent", run(mk(good), ["audit", "check", at]), lacks("column"));
  // THE DEFECT THAT OPENED THE ARC, REPRODUCED: the column no reading was ever written for.
  const stored = "| Term | Contract term | Where it is stored |\n| --- | --- | --- |\n" +
    "| [scheduler](job.md) | `JobScheduler` | `${APP}_JOB_SCHEDULER_PROVIDER` |\n| [queue](job.md) | `JobQueue` | ✅ written |\n";
  const out = run(mk(stored), ["audit", "check", at]);
  one("a generated column no reading exists for is reported by a run", out,
    has("the generated glossary column `Where it is stored` has no reading of its values"));
  one("a status marker under Contract term is not a spelling",
    run(mk(good.replace("`SPSession`", "✅ written")), ["audit", "check", at]), has("under the generated glossary column `Contract term` is not the term as the system spells it"));
  one("a description standing where a spelling belongs is named",
    run(mk(good.replace("`SPSession`", "the estate's app row")), ["audit", "check", at]), has("`the estate's app row`"));
  one("a group divider row is not data", run(mk(good), ["audit", "check", at]), lacks("`Session`"));
  one("a table written by hand, outside the markers, is the author's and is not read",
    run(repo({ "CONCEPT.md": "# c\n", [at]: doc({ id: "c", title: "Core", lenses: ["ARCHITECT"] }, "| Term | Anything |\n| --- | --- |\n| a | ✅ |\n", "`For: Architect`") }), ["audit", "check", at]),
    lacks("column"));
}

console.log("\n=== a page's furniture is the shared files': a version that exists, and a style of its own is the page's to add");
{
  const at = `${POCKET_DOCS}/01-core/core-overview.html`;
  const o = { id: "o", variant: "overview", parentId: "concept", title: "Core", lenses: ["ARCHITECT"], summary: "s." };
  // AN OVERVIEW THAT AUDITS CLEAN, so each case below differs from it in one thing and a finding is
  // that thing's alone.
  const content = (type = "Overview") =>
    `<nav class="sds-rail" id="rail"></nav>\n<header class="sds-masthead">\n` +
    `<div class="sds-eyebrow"><span class="sds-line1">SaaS Plane | t | Core</span>` +
    `<span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">${type}</span><span class="sds-separator">|</span>` +
    `<span class="sds-label">For:</span> <span class="sds-audience"><span class="sds-badge sds-lens">Architect</span></span></span></div>\n` +
    `<h1>Know where you are.</h1>\n<p class="sds-standfirst">This page covers the core.</p>\n</header>\n` +
    ["Overview", "Glossary", "Where to go next"].map((name, at) =>
      `<section id="s${at}"><div class="sds-section-head"><h2>${name}</h2></div>\n<p>x</p></section>\n`).join("");
  const head = `<meta charset="utf-8">\n<title>Core</title>\n` + block(o);
  const shared = ({ link = LINES.stylesheet, own = "", type } = {}) => `${head}${link}\n${own}${content(type)}${LINES.script}\n`;
  // THE SAME PAGE WITH ITS OWN COPY OF THE STYLES: a style block in place of the link, a script with
  // code in place of the script's line, and each class by the name that copy used.
  const withOwnNames = (html) => html.replaceAll("sds-section-head", "sec-head").replaceAll("sds-label", "lbl")
    .replaceAll("sds-separator", "sep").replaceAll("sds-", "");
  const ownCopy = (type) => `${head}<style>.badge{color:red} .invented-hero > .lede{margin:0}</style>\n` +
    `${withOwnNames(content(type))}<script>/* a rail builder of this page's own */</script>\n`;
  const audit = (text, files = {}) => run(repo({ "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n", [at]: text, ...files }), ["audit", "check", at]);

  one("a page that links a version that exists is clean", audit(shared()), has("clean — 1 page"));
  one("[MKT.SCRIPTS.109] a page that links the shared stylesheet and adds a style of its own draws no finding",
    audit(shared({ own: "<style>.invented-hero > .lede{margin:0}</style>\n" })), has("clean — 1 page"));
  one("[MKT.SCRIPTS.109] and a `<script type=\"application/json\">` draws none either",
    audit(shared({ own: '<script type="application/json">{"rows":[]}</script>\n' })), has("clean — 1 page"));
  one("a page that links a folder beside it names no version, and draws no finding",
    audit(shared({ link: '<link rel="stylesheet" href="../assets/sds-docs.css">' }),
      { [`${POCKET_DOCS}/assets/sds-docs.css`]: "/* the stylesheet, beside the page's folder */\n" }),
    has("clean — 1 page"));

  const absent = audit(shared({ link: linesFor("9.9.9").stylesheet }));
  one("known-bad: a page that links version 9.9.9, which nobody cut, is refused", absent,
    (g) => g.includes("✗ RULE furniture") && g.includes("links version `9.9.9`") && g.includes("1 finding — 1 RULE, 0 SOFT"));
  one("and the finding names the versions that exist", absent, has("The versions that exist: `1.0.0`"));
  one("known-bad: a script's line that names a version nobody cut is refused too, though the stylesheet's line is right",
    audit(shared().replace(LINES.script, linesFor("9.9.9").script)),
    (g) => g.includes("✗ RULE furniture") && g.includes("links version `9.9.9`"));
  // `SPN_STYLES` names another folder of versions, and the audit reads the versions that folder lists.
  const elsewhere = mkdtempSync(join(BASE, "styles-"));
  writeFileSync(join(elsewhere, "versions.json"), JSON.stringify({ "9.9.9": {} }));
  process.env.SPN_STYLES = elsewhere;
  one("a version is judged against the folder `SPN_STYLES` names", audit(shared({ link: linesFor("9.9.9").stylesheet })),
    (g) => !g.includes("links version `9.9.9`") && g.includes("links version `1.0.0`") && g.includes("The versions that exist: `9.9.9`"));
  delete process.env.SPN_STYLES;

  const named = audit(ownCopy());
  one("[MKT.SCRIPTS.108] a page that holds its own copy is named once, as a RULE, with the text every command uses",
    named, (g) => (g.match(/✗ RULE styles/g) ?? []).length === 1 && g.includes(OWN_COPY) && !g.includes("SOFT styles"));
  one("[MKT.SCRIPTS.108] and that is its one finding: nothing about its style block, its script or its class names",
    named, has("1 finding — 1 RULE, 0 SOFT, over 1 page"));
  // The exit code is a RULE's: 1 for the page with its own copy, and 0 for the same page in the shared form.
  const exitOf = (text) => {
    const root = repo({ "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n", [at]: text });
    try { execFileSync(process.execPath, [TOOL, "docs", "audit", "check", at], { encoding: "utf8", cwd: root, stdio: "pipe", env: { ...process.env, SPN_WORKSPACE: root } }); return 0; }
    catch (error) { return error.status; }
  };
  one("[MKT.SCRIPTS.108] `docs audit` exits 1 on a page that holds its own copy", exitOf(ownCopy()), 1);
  one("untouched: and exits 0 on the same page in the shared form", exitOf(shared()), 0);
  // VERIFY THE VERIFIER: a wrong Type chip is found by its class. On a page in the shared form it is
  // refused, so the header check does read; on a page with its own copy no class is read at all.
  one("known-bad: a wrong Type chip on a page in the shared form is refused, so the header is read by its classes",
    audit(shared({ type: "Construct" })), has("Type reads `Construct`; the block's variant is `overview`"));
  one("[MKT.SCRIPTS.108] the same wrong chip on a page that holds its own copy is not read: the one RULE line, and no other",
    audit(ownCopy("Construct")), (g) => g.includes("✗ RULE styles") && g.includes("1 finding — 1 RULE, 0 SOFT, over 1 page") && !g.includes("Type reads"));
}
{
  // A PRODUCED PAGE, AND THE SAME PAGE WITH ITS OWN COPY. `docs page` writes the construct page in the
  // shared form; the audit compares it with what the seat produces. A page that holds its own copy
  // is not compared: it is named once, and `docs page` is what moves it.
  const templates = bookTemplatesDir(resolve(PLUGIN, "..", "..", "..", "spn-foundation"));
  const seat = `docs/${SEAT.constructs}/01-core/x.md`;
  const at = `${POCKET_DOCS}/01-core/${CONSTRUCT_PAGES}/x-construct.html`;
  const root = repo({ "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n", [seat]: construct(SECTIONS),
    // The domain has no overview, so the way back of a produced page is the hub, a page.
    [`${POCKET_DOCS}/concept-overview.html`]: block({ id: "hub", variant: "overview", title: "Hub", lenses: ["ARCHITECT"], summary: "s." }) + "<h1>x</h1>\n",
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }) });
  process.env.SPN_TEMPLATES = templates;
  run(root, ["page", "write", seat]);
  const produced = readAt(root, at);
  const audit = (text) => { writeFileSync(join(root, at), text); return run(root, ["audit", "check", at]); };

  one("a page `docs page` produced links the shared stylesheet, and the audit finds it clean", audit(produced),
    // The page takes its two lines from the template, so it links the version the template links.
    (g) => /<link rel="stylesheet" href="[^"]*\/assets\/docs\/\d+\.\d+\.\d+\/sds-docs\.css">/.test(produced)
      && produced.includes(/<link rel="stylesheet"[^>]*>/.exec(readFileSync(resolve(templates, "pages", "construct-template.html"), "utf8"))[0])
      && g.includes("clean — 1 page"));
  one("known-bad: the same page edited by hand is not what the seat produces",
    audit(produced.replace("<h2>Model</h2>", "<h2>Model</h2>\n<p>typed into the page</p>")), has("✗ RULE produced"));
  const own = produced.replace(LINES.stylesheet, "<style>.badge{color:red}</style>")
    .replace(LINES.script, "<script>/* a rail builder of this page's own */</script>")
    .replaceAll("sds-section-head", "sec-head").replaceAll("sds-label", "lbl").replaceAll("sds-separator", "sep").replaceAll("sds-", "");
  const named = audit(own);
  one("[MKT.SCRIPTS.108] a produced page that holds its own copy draws the one RULE line, and no `produced` finding",
    named, (g) => g.includes("✗ RULE styles") && g.includes(OWN_COPY) && !g.includes("produced") && g.includes("1 finding — 1 RULE, 0 SOFT, over 1 page"));
  one("[MKT.SCRIPTS.108] the audit writes nothing into it", readAt(root, at), own);
  delete process.env.SPN_TEMPLATES;
}
{
  // A CLOSED WORKSTREAM'S PAGE STAYS AS IT IS RENDERED, so its styles are never checked. The same
  // page under `open/` is named.
  const argument = doc({ id: "a", variant: "approach", title: "A", lenses: ["ARCHITECT"], status: "PLANNING" },
    "<style>.card{color:red}</style>\n<p>an argument</p>\n");
  const under = (state) => {
    const path = `.spndevex/${WORKSTREAMS}/${state}/001-a/a-approach.html`;
    return run(repo({ [path]: argument }), ["audit", "check", path]);
  };
  one("[MKT.SCRIPTS.108] a page of an open workstream that holds its own copy is named, as a RULE", under("open"), has("✗ RULE styles"));
  one("[MKT.SCRIPTS.108] a page under a workstream's `closed/` folder is not: it draws no `styles` finding", under("closed"), lacks("styles"));
}

console.log("\n=== a report is a snapshot: no status, and its header says Generated and Commit (RD.DEVEX.WORKSPACE.192)");
{
  const at = `docs/${POCKET.artifacts}/${ARTIFACT.reports}/coverage-report.html`;
  const good = { id: "t-coverage-report", variant: "report", reportType: "COVERAGE", title: "Coverage report",
    lenses: ["QA"], generatedAt: "2026-09-30T12:57+05:30", summary: "What was counted.", keywords: ["report"] };
  const line2 = (datetime, cls = "sds-local") =>
    `<span class="sds-line"><span class="sds-label">Generated:</span> <span class="sds-badge sds-when"><time class="${cls}" datetime="${datetime}">${datetime}</time></span>` +
    `<span class="sds-separator">|</span><span class="sds-label">Commit:</span> <span class="sds-badge sds-when">e549cfaa</span></span>`;
  // A report in the shared form: the two lines that load the shared files, and the shared names.
  const page = (o, { second = line2(o.generatedAt), chip = "" } = {}) =>
    block(o) + `${LINES.stylesheet}\n<nav class="sds-rail" id="rail"></nav>\n<header class="sds-masthead">\n` +
    `<div class="sds-eyebrow"><span class="sds-line1">SaaS Plane | t | ${o.title}</span>` +
    `<span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Report</span><span class="sds-separator">|</span>` +
    `<span class="sds-label">For:</span> <span class="sds-audience"><span class="sds-badge sds-lens">Quality engineer</span></span>${chip}</span>${second}</div>\n` +
    `<h1>${o.title}</h1>\n<p class="sds-subtitle">How much of this repository is written, built and proved?</p>\n` +
    `<p class="sds-standfirst">What was counted.</p>\n</header>\n${LINES.script}\n`;
  const audit = (text) => run(repo({ "CONCEPT.md": "# c\n", [at]: text }), ["audit", "check", at]);
  const mine = /a report carries|a report shows|Generated|no Commit|only a `tests` report|`measuredAt` is|furniture/;

  const clean = audit(page(good));
  one("a report with no status, a Generated moment and a Commit draws none of these findings",
    clean, (g) => !g.split("\n").some((l) => /RULE/.test(l) && mine.test(l)));
  one("a report block carrying `status` is refused",
    audit(page({ ...good, status: "IMPLEMENTING" })), has("a report carries no `status`"));
  one("a report header showing a status chip is refused",
    audit(page(good, { chip: `<span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-implementing">&#x1F6A7; IMPLEMENTING</span>` })),
    has("a report shows no status chip"));
  one("a report with no `generatedAt` is refused",
    audit(page((({ generatedAt, ...rest }) => rest)(good), { second: line2("2026-09-30T12:57+05:30") })), has("a report carries `generatedAt`"));
  one("a `generatedAt` with no time and offset is refused",
    audit(page({ ...good, generatedAt: "2026-09-30" })), has("a report carries `generatedAt`"));
  one("a header moment that is not the block's is refused",
    audit(page(good, { second: line2("2026-09-29T09:00+05:30") })), has("Generated reads `2026-09-29T09:00+05:30`"));
  one("a Generated `<time>` the script cannot find is refused",
    audit(page(good, { second: line2(good.generatedAt, "stamp") })), has("carries `class=\"sds-local\"`"));
  one("a header with no Generated line is refused",
    audit(page(good, { second: "" })), has("no Generated line"));
  one("a header with no Commit is refused",
    audit(page(good, { second: line2(good.generatedAt).replace(/<span class="sds-separator">\|<\/span><span class="sds-label">Commit:[\s\S]*?e549cfaa<\/span>/, "") })),
    has("no Commit"));
  one("`measuredAt` on a coverage report is refused",
    audit(page({ ...good, measuredAt: "2026-09-30T12:44+05:30" })), has("only a `tests` report carries `measuredAt`"));
  one("`measuredAt` on a tests report is its newest run, and passes",
    audit(page({ ...good, reportType: "TESTS", measuredAt: "2026-09-30T12:44+05:30" })), lacks("carries `measuredAt`"));
  one("[MKT.SCRIPTS.82] a tests report with no stamped run leaves `measuredAt` out, and passes",
    audit(page({ ...good, reportType: "TESTS" })), lacks("measuredAt"));
  one("[MKT.SCRIPTS.82] known-bad: `measuredAt` written as `null` is refused, and the finding says to leave the key out",
    audit(page({ ...good, reportType: "TESTS", measuredAt: null })), has("leave the key out"));
}

// ---------------------------------------------------------------- the masthead's three levels

console.log("\n=== the masthead: h1, an optional p.sds-subtitle, one p.sds-standfirst, and nothing after it (RD.DEVEX.WORKSPACE.187)");
{
  const page = (inner, file = "01-core/core-overview.html") => repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    [`${POCKET_DOCS}/${file}`]:
      `<meta charset="utf-8">\n<title>Core</title>\n` +
      block({ id: "o", variant: "overview", parentId: "concept", title: "Core", lenses: ["ARCHITECT"], summary: "s." }) +
      `${LINES.stylesheet}\n<header class="sds-masthead">\n<!-- a comment <p>is not a paragraph</p> -->\n${inner}\n</header>\n<h2>Overview</h2>\n<p>x</p>`,
  });
  const audit = (inner, file) => run(page(inner, file), ["audit", "check", `${POCKET_DOCS}/${file ?? "01-core/core-overview.html"}`]);
  const GOOD = `<h1>Know where you are.</h1>\n<p class="sds-subtitle">The core is the part every other part reads.</p>\n<p class="sds-standfirst">This page covers the core. Read it first.</p>`;

  one("h1, one Subtitle and one Description draw no masthead finding", audit(GOOD), lacks("masthead"));
  one("a Subtitle is optional", audit(GOOD.replace(/<p class="sds-subtitle">.*<\/p>\n/, "")), lacks("masthead"));
  one("a second paragraph after the Description is SOFT until every tree is retrofitted (N116 row 9)",
    audit(GOOD + "\n<p>A second paragraph.</p>"), (g) => g.includes("! SOFT masthead") && g.includes("paragraph past the Subtitle"));
  one("a second standfirst is a second paragraph, whatever its class says",
    audit(GOOD + `\n<p class="sds-standfirst">Another Description.</p>`), has("carries 1 paragraph past the Subtitle"));
  one("a tagline beside the Subtitle is a second paragraph too",
    audit(GOOD.replace("<p class=\"sds-subtitle\">", "<p class=\"tagline\">A tagline.</p>\n<p class=\"sds-subtitle\">")), (g) => g.includes("! SOFT masthead") && g.includes("paragraph past the Subtitle"));
  one("a Subtitle of two sentences is SOFT",
    audit(GOOD.replace("reads.</p>", "reads. It is small.</p>")), has("! SOFT masthead"));
  one("and names the count", audit(GOOD.replace("reads.</p>", "reads. It is small.</p>")), has("runs to 2 sentences"));
  one("a header with no Description is SOFT",
    audit(GOOD.replace(/\n<p class="sds-standfirst">.*<\/p>/, "")), has("has no Description"));
  one("a Subtitle below the Description is out of place",
    audit(`<h1>Know where you are.</h1>\n<p class="sds-standfirst">This page covers the core.</p>\n<p class="sds-subtitle">The core is the part every other part reads.</p>`),
    has("the Subtitle is out of place"));
  // The foundation hub's pair is read from RD.DEVEX.WORKSPACE.143 in the register beside the page;
  // a register without that row (every other repository) leaves the hub's lines to the author.
  one("a hub in a repository whose register has no .143 row is not held to the pair",
    audit(GOOD, "concept-overview.html"), lacks("RD.DEVEX.WORKSPACE.143"));
}
{
  const ROW = "| RD.DEVEX.WORKSPACE.143 | [docs](x.md) | **The punchline is `Only this probe's own title.`, and the statement beside it does not change.** " +
    "The statement below it reads *the probe's own subtitle, read from the row*. | why | 2026-09 |\n";
  const hub = (h1, sub, row = ROW) => repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    [`docs/${POCKET.registers}/decisions.md`]: "# Decisions\n\n| ID | Area | Decision | Why | When |\n| --- | --- | --- | --- | --- |\n" + row,
    [`${POCKET_DOCS}/concept-overview.html`]:
      `<meta charset="utf-8">\n<title>Concept</title>\n` +
      block({ id: "o", variant: "overview", parentId: "concept", title: "Concept", lenses: ["ARCHITECT"], summary: "s." }) +
      `${LINES.stylesheet}\n<header class="sds-masthead">\n<h1>${h1}</h1>\n<p class="sds-subtitle">${sub}</p>\n<p class="sds-standfirst">This page is the start.</p>\n</header>\n<h2>Overview</h2>\n<p>x</p>`,
  }, { type: "FOUNDATION" });
  const audit = (...a) => run(hub(...a), ["audit", "check", `${POCKET_DOCS}/concept-overview.html`]);
  one("the hub's pair, word for word from the register's row, is silent",
    audit("Only this probe&rsquo;s own title.", "The probe's own subtitle, read from the row."), lacks("RD.DEVEX.WORKSPACE.143"));
  one("a hub Title that is not the row's is SOFT, and quotes the row",
    audit("Your team's time belongs to your product.", "The probe's own subtitle, read from the row."),
    (g) => g.includes("! SOFT masthead") && g.includes("Title is not RD.DEVEX.WORKSPACE.143's") && g.includes("Only this probe's own title."));
  one("a hub Subtitle that is not the row's is SOFT",
    audit("Only this probe's own title.", "A subtitle somebody typed."), has("Subtitle is not RD.DEVEX.WORKSPACE.143's"));
  one("a .143 row the check cannot read is said, never passed",
    audit("x", "y", "| RD.DEVEX.WORKSPACE.143 | a | no pair here | b | c |\n"), has("could not be read from the row"));
}

// ---------------------------------------------------------------- the two produced kinds of page

console.log("\n=== a guide page and the index of artifacts are pages the audit knows (RD.DEVEX.WORKSPACE.218, .219)");
{
  // EACH FIXTURE HAS THE SHAPE THE COMMAND WRITES. `docs guide` and `docs index` were run from source
  // on a real repository, and the two pages below keep what those pages hold: the block's keys, the
  // header of a guide with no Status chip, and an index with no header, a block of data and its own script.
  const guideAt = `docs/${POCKET.artifacts}/${ARTIFACT.guides}/getting-started-guide.html`;
  const indexAt = `docs/${POCKET.artifacts}/index.html`;
  const guideBlock = { id: "t-guide-getting-started", variant: "guide", title: "Getting Started", lenses: ["SERVER_DEV", "WEB_DEV"],
    summary: "Clone to running.", keywords: ["getting started"], source: `docs/${SEAT.guides}/01-getting-started.md` };
  const guide = (o = guideBlock, { chip = "" } = {}) =>
    `<meta charset="utf-8">\n<title>${o.title}</title>\n<!-- spn:doc\n${JSON.stringify(o)}\n-->\n` +
    `<!-- Produced by \`docs guide\` from ${o.source}. Never edit this page: change the guide, and produce the page again. -->\n` +
    `${LINES.stylesheet}\n<div class="sds-page sds-guide">\n\n<nav class="sds-rail" id="rail">\n` +
    `  <a class="sds-home" href="../index.html" target="_top">&larr; the index</a>\n  <div class="sds-rail-title">${o.title}</div>\n</nav>\n<div class="sds-wrap">\n\n` +
    `<header class="sds-masthead">\n  <div class="sds-eyebrow"><span class="sds-line1">SaaS Plane &nbsp;|&nbsp; t &nbsp;|&nbsp; ${o.title}</span>` +
    `<span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Guide</span><span class="sds-separator">|</span>` +
    `<span class="sds-label">For:</span> <span class="sds-audience"><span class="sds-badge sds-lens">Backend developer</span><span class="sds-badge sds-lens">Web developer</span></span>${chip}</span></div>\n` +
    `  <h1>${o.title}</h1>\n  <p class="sds-standfirst">Clone to running.</p>\n</header>\n\n` +
    `<section id="s0">\n  <div class="sds-section-head"><h2>Overview</h2></div>\n  <p>x</p>\n</section>\n\n</div>\n</div>\n\n${LINES.script}\n`;
  const indexBlock = { id: "t-artifacts-index", variant: "index", title: "Artifacts",
    summary: "Every page of this repository's docs/artifacts, in one tree, opened in tabs." };
  const tree = { base: "", tabs: 8, groups: [{ label: "Guides", children: [{ label: "Getting Started", kind: "guide", path: `${ARTIFACT.guides}/getting-started-guide.html` }] }] };
  const index = (o = indexBlock, script = linesFor("1.0.0", INDEX_SCRIPT).script) =>
    `<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>t Artifacts</title>\n<!-- spn:doc\n${JSON.stringify(o)}\n-->\n` +
    `<!-- Produced by \`docs index\` from the pages on disk. Never edit this page: produce it again. -->\n` +
    `${LINES.stylesheet}\n<div class="sds-index" id="index">\n  <aside class="sds-index-side" id="index-side">\n` +
    `    <nav class="sds-tree" id="index-tree" aria-label="Pages"></nav>\n` +
    `    <noscript><p class="sds-index-note">This index needs its script to list the pages. Start at <a href="${ARTIFACT.guides}/getting-started-guide.html">the guide</a>.</p></noscript>\n  </aside>\n` +
    `  <main class="sds-index-main">\n    <div class="sds-tabs" id="index-tabs" role="tablist"></div>\n    <div class="sds-panes" id="index-panes"></div>\n  </main>\n</div>\n\n` +
    `<script type="application/json" id="index-data">\n${JSON.stringify(tree, null, 1)}\n</script>\n${script}\n`;
  const pocket = (files = {}) => repo({ "CONCEPT.md": "# c\n", [guideAt]: guide(), [indexAt]: index(), ...files });
  const audit = (files, target = `docs/${POCKET.artifacts}`) => run(pocket(files), ["audit", "check", target]);

  // (a) the two kinds are variants
  one("a guide page and the index, as the two commands write them, audit clean", audit({}), has("clean — 2 pages"));
  const unknown = audit({ [guideAt]: guide({ ...guideBlock, variant: "walkthrough" }) }, guideAt);
  one("known-bad: a variant nobody declared is still refused, and the set it names holds `guide` and `index`",
    unknown, (g) => g.includes("`variant` `walkthrough` is not one of") && g.includes("preview · guide · index"));

  // (b) neither carries a status
  one("a guide page with no `status` in its block draws no status finding", audit({}, guideAt),
    (g) => g.includes("clean — 1 page") && !g.includes("status"));
  one("known-bad: the same block declared a `construct` is asked for its status, so the kind is what lifts it",
    audit({ [guideAt]: guide({ ...guideBlock, variant: "construct", dependsOn: [] }) }, guideAt), has("`status` must be PLANNING · IMPLEMENTING · DONE"));
  one("known-bad: a Status chip in a guide's header is refused, because the block declares no status",
    audit({ [guideAt]: guide(guideBlock, { chip: `<span class="sds-state"><span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-done">DONE</span></span>` }) }, guideAt),
    has("a status chip is here and the block declares no status"));

  // (c) the index has no lenses, no header and no masthead, and it loads its own script
  const alone = audit({}, indexAt);
  one("the index is asked for no `lenses`, no header and no masthead, and its block of data and its own script draw no finding",
    alone, has("clean — 1 page"));
  const asOverview = `${POCKET_DOCS}/01-core/core-overview.html`;
  one("known-bad: the same page declared an `overview` is asked for its lenses and its header, so the kind is what lifts them",
    audit({ [asOverview]: index({ ...indexBlock, variant: "overview" }) }, asOverview),
    (g) => g.includes("`lenses` is missing or empty") && g.includes("no `<header>`"));
  one("known-bad: an index whose own script names a version nobody cut is refused, so its script's line is still read",
    audit({ [indexAt]: index(indexBlock, linesFor("9.9.9", INDEX_SCRIPT).script) }, indexAt),
    (g) => g.includes("✗ RULE furniture") && g.includes("links version `9.9.9`"));

  // (d) the index sits directly in the pocket, and `guides/` is a folder of it
  one("`guides/` is a folder of the pocket, and `index.html` sits directly in it: neither draws a pocket finding",
    audit({}), (g) => !g.includes("the pocket holds") && !g.includes("directly in the pocket"));
  const stray = `docs/${POCKET.artifacts}/stray-guide.html`;
  one("known-bad: another page directly in the pocket is refused, and the finding names the folders",
    audit({ [stray]: guide() }, stray), (g) => g.includes("`index.html` is the one page that sits directly in the pocket") && g.includes("`guides/`"));
  const elsewhere = `${POCKET_DOCS}/index.html`;
  one("known-bad: an index in a folder of the pocket is refused, because a repository has one and it sits in the pocket itself",
    audit({ [elsewhere]: index() }, elsewhere), has("a repository has one index, and it is `docs/artifacts/index.html`"));
  one("the pocket's face sits directly in the pocket too, and is not refused",
    audit({ [`docs/${POCKET.artifacts}/README.md`]: doc({ id: "p", title: "Artifacts", lenses: ["ARCHITECT"], status: "DONE" }, "x\n", "`For: Architect` · `Status: ✅ DONE`") },
      `docs/${POCKET.artifacts}/README.md`), lacks("directly in the pocket"));

  // (e) a bundled copy is not a page of the tree
  const bundled = { [`docs/${POCKET.artifacts}/index.bundled.html`]: "<style>.sds-index{display:grid}</style>\n<h1>no block: refused if it were read</h1>\n" };
  one("a `*.bundled.html` copy beside the index is not read: the pocket still counts two pages, and is clean",
    audit(bundled), has("clean — 2 pages"));
  one("and named alone it is said to be no page, never refused",
    audit(bundled, `docs/${POCKET.artifacts}/index.bundled.html`),
    (g) => g.includes("a sample, a template and a bundled copy are not audited as pages") && !g.includes("RULE"));
  one("known-bad: the same file under a page's name is read, and refused for having no block",
    audit({ [`docs/${POCKET.artifacts}/${ARTIFACT.guides}/copy-guide.html`]: Object.values(bundled)[0] }, `docs/${POCKET.artifacts}/${ARTIFACT.guides}/copy-guide.html`),
    has("✗ RULE block"));
}

// ---------------------------------------------------------------- a preview page

console.log("\n=== a preview page: variant `preview`, its own title, a Status chip, and the shared furniture");
{
  // THE BOOK'S OWN TEMPLATE GIVES THE TWO LINES, so a clean case links what the book links.
  const templates = bookTemplatesDir(resolve(PLUGIN, "..", "..", "..", "spn-foundation"));
  const previewTemplate = readFileSync(resolve(templates, "workstream", "approach-preview-template.html"), "utf8");
  const linkLine = previewTemplate.match(/<link\b[^>]*sds-docs\.css"[^>]*>/)[0];
  const scriptLine = previewTemplate.match(/<script\b[^>]*sds-docs\.js"[^>]*><\/script>/)[0];
  const notes = `.spndevex/${WORKSTREAMS}/open/001-a/notes/N001`;
  const at = `${notes}/previews/layout-preview.html`;
  const good = { id: "ws-001-a-layout", variant: "preview", title: "Layout", lenses: ["ARCHITECT"], status: "PLANNING",
    summary: "This page shows the layout.", keywords: ["preview"] };
  const state = (word) => `<span class="sds-state"><span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-${word.toLowerCase()}">${word}</span></span>`;
  const page = (o, { chip = state("PROPOSED"), named = o.title, heading = o.title, own = "" } = {}) =>
    block(o) + `${linkLine}\n${own}<nav class="sds-rail" id="rail"></nav>\n<header class="sds-masthead">\n` +
    `<div class="sds-eyebrow"><span class="sds-line1">SaaS Plane &nbsp;|&nbsp; Workstream 001 &nbsp;|&nbsp; ${named}</span>` +
    `<span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Preview</span><span class="sds-separator">|</span>` +
    `<span class="sds-label">Arc:</span> <span class="sds-badge">N001</span><span class="sds-separator">|</span>` +
    `<span class="sds-label">Shown:</span> <span class="sds-badge">2026-10-01</span>${chip}</span></div>\n` +
    `<h1>${heading}</h1>\n<p class="sds-subtitle">Decides how the page is laid out.</p>\n` +
    `<p class="sds-standfirst">This page shows the layout.</p>\n</header>\n${scriptLine}\n`;
  const audit = (files, target = at) => run(repo(files), ["audit", "check", target]);

  one("a preview written from the template is clean, with no For chips and a block status the chip does not repeat",
    audit({ [at]: page(good) }), has("clean — 1 page"));
  one("a Status chip reading DECIDED is not compared with the block's PLANNING",
    audit({ [at]: page(good, { chip: state("DECIDED") }) }), has("clean — 1 page"));
  for (const word of ["UNDER REVIEW", "APPROVED", "SUPERSEDED"])
    one(`known-bad: a Status chip reading ${word} is refused, because a preview is PROPOSED or DECIDED`,
      audit({ [at]: page(good, { chip: `<span class="sds-state"><span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-proposed">${word}</span></span>` }) }),
      has(`the Status chip reads \`${word}\`; a preview shows PROPOSED · DECIDED`));
  one("known-bad: a Status chip carrying a page's status word is refused",
    audit({ [at]: page(good, { chip: `<span class="sds-state"><span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-proposed">&#x1F52E; PLANNING</span></span>` }) }),
    has("the Status chip reads"));
  one("known-bad: a preview with no Status chip is refused",
    audit({ [at]: page(good, { chip: "" }) }), has("no Status chip — a preview shows PROPOSED · DECIDED"));
  one("known-bad: a header line whose third part is not the preview's title is refused",
    audit({ [at]: page(good, { named: "001 - A" }) }), has("the header title `001 - A` is not the block's `Layout`"));
  one("known-bad: an `<h1>` that is not the preview's title is refused",
    audit({ [at]: page(good, { heading: "001 - A" }) }), has("the `<h1>` `001 - A` is not the block's `Layout`"));
  one("[MKT.SCRIPTS.109] a preview that adds a style of its own, after the stylesheet's line, is clean",
    audit({ [at]: page(good, { own: "<style>.mine{color:var(--sds-ink)}</style>\n" }) }), has("clean — 1 page"));

  // THE NAME AND THE VARIANT AGREE: a file ending `-preview.html` declares `preview`, and only such a file does.
  one("known-bad: a file ending -preview.html that declares another variant is reported",
    audit({ [at]: page({ ...good, variant: "approach" }) }), has("the file name does not end `-approach.html`"));
  one("known-bad: a file declaring `preview` under another name is reported",
    audit({ [`${notes}/previews/layout-page.html`]: page(good) }, `${notes}/previews/layout-page.html`),
    has("the file name does not end `-preview.html`"));

  // A SAMPLE AND A TEMPLATE ARE NOT PAGES. The same broken file is refused under `previews/` and
  // left alone under `samples/`.
  const broken = `${LINES.stylesheet}\n<h1>No block, no header</h1>\n`;
  one("known-bad: a file with no block under previews/ is refused",
    audit({ [`${notes}/previews/broken-preview.html`]: broken }, `${notes}/previews/broken-preview.html`), has("RULE"));
  one("the same file under samples/ is not audited as a page",
    audit({ [`${notes}/samples/broken-preview.html`]: broken }, `${notes}/samples/broken-preview.html`),
    (got) => has("a sample, a template and a bundled copy are not audited as pages")(got) && lacks("RULE")(got));
  one("a template file is not audited as a page, wherever it sits",
    audit({ [`${notes}/previews/approach-preview-template.html`]: previewTemplate }, `${notes}/previews/approach-preview-template.html`),
    (got) => has("a sample, a template and a bundled copy are not audited as pages")(got) && lacks("RULE")(got));
  one("a notes folder is audited for its previews alone — the sample and the template beside it are not counted",
    audit({ [at]: page(good), [`${notes}/samples/broken-preview.html`]: broken, [`${notes}/samples/close-message.md`]: "Closing.\n",
            [`${notes}/samples/approach-preview-template.html`]: previewTemplate }, notes),
    has("clean — 1 page"));
}

// ---------------------------------------------------------------- the status check, inside the audit

console.log("\n=== the audit runs the status check on each construct it reads, and writes nothing");
{
  const seat = `docs/${SEAT.constructs}/01-core/rungs.md`;
  const rows = (status) => ["# Behaviors — Rungs", "", "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |", "| --- | --- | --- | --- | --- | --- | --- | --- |",
    `| COR.RUNG.01 | Architect | reads a rung | the rung | POSITIVE | UNIT | ${status} | — |`, ""].join("\n");
  const construct = (status, glyph) =>
    doc({ id: "rungs", parentId: "concept", title: "Rungs", variant: "construct", lenses: ["ARCHITECT"], status: status, dependsOn: [] },
      "## Overview\n\nWhy it exists.\n\n## Terms\n\n| Term | Contract term | What it means |\n| --- | --- | --- |\n| Rung | — | how much is real |\n\n## Model\n\nThe model.\n\n## Parts\n\nThe parts.\n\n## Boundary\n\nIt stops here.\n",
      `\`For: Architect\` · \`Status: ${glyph} ${status}\``);
  const tree = (status, glyph, rowStatus) => repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    [seat]: construct(status, glyph),
    [`docs/${SEAT.behaviors}/01-core/rungs.md`]: rows(rowStatus),
  });

  const behind = tree("PLANNING", "🔮", "SUCCESS");
  const before = readAt(behind, seat);
  const got = run(behind, ["audit", "check", seat]);
  one("[MKT.SCRIPTS.88] known-bad: a status that fell behind its rows is an audit finding",
    got, (g) => g.includes("RULE status") && g.includes("the block says `PLANNING`") && g.includes("derive `DONE`"));
  one("[MKT.SCRIPTS.88] and the audit exits non-zero on it, as on any RULE finding", got, has("1 RULE"));
  one("[MKT.SCRIPTS.88] the audit writes nothing: the seat file's bytes are as they were", readAt(behind, seat) === before, true);
  one("[MKT.SCRIPTS.88] a status that matches its rows draws no status finding, and no line from the status command",
    run(tree("DONE", "✅", "SUCCESS"), ["audit", "check", seat]), (g) => !g.includes("status   ") && !/^current /m.test(g) && g.includes("clean — 1 page"));
}

// ---------------------------------------------------------------- what a figure claims

console.log("\n=== a figure is read for what it claims: a diff is no copy, and a tree's folder is in the paragraph before it");
{
  const root = repo({
    "repo-a/src/cli.ts": "const REAL = \"the line that is in the file\";\n",
    "repo-a/packages/alpha/x.txt": "x", "repo-a/packages/beta/x.txt": "x",
    "repo-a/.git/HEAD": "ref: refs/heads/main\n",
  });
  const lines = "- const OLD = \"a line that was never in the file at all\";\n+ const NEW = \"a line that is not in the file yet either\";";
  const figure = (attributes) => `<p>The change to <code>repo-a/src/cli.ts</code></p>\n<pre${attributes}>${lines}</pre>`;
  const said = (found) => found.map((one) => `${one.check} ${one.message}`).join(" | ");
  one("[MKT.SCRIPTS.89] a block whose language is `diff` is never compared with the file its caption names",
    said(checkCodeFigures("p.html", figure(' data-lang="diff"'), root)), "");
  one("[MKT.SCRIPTS.89] known-bad: the same lines in a plain block are a copied figure that no longer matches",
    said(checkCodeFigures("p.html", figure(""), root)), has("codefig the figure copied from `repo-a/src/cli.ts` no longer matches"));
  // A guide page's step names the script its command runs, and the block is the command, never a copy.
  const command = `<p>Each package's <code>tests/run.sh</code> runs the build:</p>\n<pre data-lang="bash">bash packages/alpha/tests/run.sh</pre>`;
  one("[MKT.SCRIPTS.106] a command block on a guide page is not a figure copied from the script its sentence names",
    said(checkCodeFigures("docs/artifacts/guides/stand-it-up-guide.html", command, root)), "");
  one("[MKT.SCRIPTS.106] known-bad: the same block on a page of another kind names a file that is not there",
    said(checkCodeFigures("p.html", command, root)), has("codefig a figure names `tests/run.sh`, and no such file exists"));

  const tree = "<pre>N006/\n├── previews/\n└── orders/</pre>";
  const earlier = "<p>The code sits in <code>repo-a/packages/</code>.</p>\n<h3>Another subsection</h3>\n<p>Its notes folder looks like this.</p>\n" + tree;
  one("[MKT.SCRIPTS.93] a folder named in an earlier paragraph is not read as the tree's folder",
    said(checkTreeFigures("p.html", earlier, root)), "");
  const direct = "<p>An earlier paragraph.</p>\n<p>The packages sit in <code>repo-a/packages/</code>.</p>\n<pre>packages/\n├── alpha/\n└── ghost/</pre>";
  one("[MKT.SCRIPTS.93] known-bad: the paragraph directly before a tree names its folder, and a folder that is not there is reported",
    said(checkTreeFigures("p.html", direct, root)), (g) => g.includes("draws `ghost/`") && g.includes("holds `beta/`"));
}

// ---------------------------------------------------------------- the grammar: an action, paths, two filters

/** The exit code of one run, typed after the group, from the folder given. */
const exitIn = (cwd, args) => {
  try { execFileSync(process.execPath, [TOOL, "docs", ...args], { encoding: "utf8", cwd, stdio: "pipe", env: { ...process.env, SPN_WORKSPACE: cwd } }); return 0; }
  catch (error) { return error.status; }
};
const AUDIT_USAGE = "usage: spn-devex docs audit check [<path>…] [--variant <name>] [--finding <name>]\n" +
                    "       spn-devex docs audit report <repo> [--json]\n";
/** A repository with one clean page, one clean construct, and one page with no block, each in its own folder. */
const mixed = () => repo({
  "docs/good/a.md": doc({ id: "a", title: "A Title", lenses: ["QA"], status: "DONE" }, "Lead.\n", "`For: Quality engineer` · `Status: ✅ DONE`"),
  [`docs/${SEAT.constructs}/x.md`]: construct(SECTIONS),
  "docs/bad/b.md": "# No Block Here\n\nProse.\n",
  "docs/bad/c.md": doc({ id: "c", title: "C Title", lenses: ["QA"], status: "DONE" }, "Lead.\n", "`For: Architect` · `Status: ✅ DONE`"),
});

console.log("\n=== `docs audit` needs its action as a word");
{
  const root = mixed();
  one("[MKT.SCRIPTS.111] with no action the entry prints each usage line and says an action is owed",
    run(root, ["audit"]), AUDIT_USAGE + "`docs audit` needs an action.\n");
  one("[MKT.SCRIPTS.111] a path where the action belongs is refused with exit 2", exitIn(root, ["audit", "docs"]), 2);
  one("[MKT.SCRIPTS.111] `--report` is named as the action `report`",
    run(root, ["audit", "--report", "."]), AUDIT_USAGE + "`docs audit` needs an action. `--report` is the action `report`.\n");
  one("[MKT.SCRIPTS.111] with exit 2", exitIn(root, ["audit", "--report", "."]), 2);
  one("`report` with no repository prints its usage line and says a path is owed",
    run(root, ["audit", "report"]), "usage: spn-devex docs audit report <repo> [--json]\n`docs audit report` needs a path.\n");
  one("with exit 2, and a second path is refused the same way", [exitIn(root, ["audit", "report"]), exitIn(root, ["audit", "report", ".", "docs"])],
    (got) => got.join() === "2,2");
  one("an option `check` does not take is refused with exit 2", exitIn(root, ["audit", "check", "docs", "--json"]), 2);
}

console.log("\n=== a narrow run reports what sits under its path, and nothing beside it");
{
  const root = mixed();
  one("known-bad: the docs tree, audited, reports the page with no block and exits 1",
    [run(root, ["audit", "check", "docs"]).includes("bad/b.md"), exitIn(root, ["audit", "check", "docs"])], (got) => got.join() === "true,1");
  one("[MKT.SCRIPTS.114] a run narrowed to the clean folder reports nothing from the folder beside it",
    run(root, ["audit", "check", "docs/good"]), (got) => got.includes("clean — 1 page") && !got.includes("bad/"));
  one("[MKT.SCRIPTS.114] and exits 0, because no finding it reports is a RULE", exitIn(root, ["audit", "check", "docs/good"]), 0);
  one("several paths are one run: each page under any of them is counted",
    run(root, ["audit", "check", "docs/good", `docs/${SEAT.constructs}`]), has("clean — 2 pages"));
  one("[MKT.SCRIPTS.113] with no path the run takes the repository the caller is in, from a folder inside it too",
    [run(root, ["audit", "check"]), run(join(root, "docs", "good"), ["audit", "check"])].map((got) => got.includes("bad/b.md") && got.includes("over 4 pages")),
    (got) => got.join() === "true,true");
  one("[MKT.SCRIPTS.113] where the caller is in no repository, `check` with no path says to name one",
    run(BASE, ["audit", "check"]),
    "usage: spn-devex docs audit check [<path>…] [--variant <name>] [--finding <name>]\n" +
    "`docs audit check` needs a path here, because the folder it is run from is in no repository. Name a repository.\n");
  one("[MKT.SCRIPTS.113] with exit 2", exitIn(BASE, ["audit", "check"]), 2);
}

console.log("\n=== `--variant` and `--finding` narrow what is reported");
{
  const root = mixed();
  const whole = run(root, ["audit", "check", "docs"]);
  one("untouched: with no filter the run reports the missing block and the wrong tag line, over every page",
    whole, (got) => got.includes("RULE block") && got.includes("header") && got.includes("over 4 pages"));
  one("`--variant construct` counts and reports the constructs alone",
    run(root, ["audit", "check", "docs", "--variant", "construct"]), (got) => got.includes("clean — 1 page") && !got.includes("bad/"));
  one("`--variant` typed twice selects both kinds", run(root, ["audit", "check", "docs", "--variant", "construct", "--variant=overview"]), has("clean — 1 page"));
  one("a variant no page under the path declares is said, and the run exits 0",
    [run(root, ["audit", "check", "docs", "--variant", "guide"]), exitIn(root, ["audit", "check", "docs", "--variant", "guide"])],
    (got) => got[0].includes("no page under that path declares the variant guide") && got[1] === 0);
  one("[MKT.SCRIPTS.115] a variant outside the set is refused with the set",
    run(root, ["audit", "check", "docs", "--variant", "chapter"]), (got) => got.includes("takes `--variant` from approach · overview · construct") && got.includes("and `chapter` is none of them."));
  one("[MKT.SCRIPTS.115] with exit 2", exitIn(root, ["audit", "check", "docs", "--variant", "chapter"]), 2);

  const blockOnly = run(root, ["audit", "check", "docs", "--finding", "block"]);
  one("`--finding block` reports the findings of that name alone", blockOnly,
    (got) => got.includes("RULE block") && !got.includes("header") && got.includes("1 finding — 1 RULE, 0 SOFT, over 4 pages"));
  one("`--finding` typed twice reports both names", run(root, ["audit", "check", "docs", "--finding", "block", "--finding", "header"]),
    (got) => got.includes("RULE block") && got.includes("header"));
  one("a finding name that nothing under the path earns reads clean", run(root, ["audit", "check", "docs", "--finding", "treefig"]), has("clean — 4 pages"));
  one("[MKT.SCRIPTS.115] a finding name outside the set is refused with the set",
    run(root, ["audit", "check", "docs", "--finding", "page"]), (got) => got.includes("takes `--finding` from binds · block · cards") && got.includes("and `page` is none of them."));
  one("[MKT.SCRIPTS.115] with exit 2", exitIn(root, ["audit", "check", "docs", "--finding", "page"]), 2);
}

console.log("\n=== the set `--finding` takes is the names the audit's own findings carry");
{
  // Every function the audit reaches is read from the source, with the name each of its findings carries.
  const source = readFileSync(resolve(PLUGIN, "src", "scripts", "commands", "docs", "_lib.ts"), "utf8");
  const heads = [...source.matchAll(/^(?:export )?function ([A-Za-z0-9_]+)\(/gm)];
  const bodies = new Map(heads.map((head, at) => [head[1], source.slice(head.index, heads[at + 1]?.index ?? source.length)]));
  const reached = new Set(), carried = new Set();
  const walk = (name) => {
    if (reached.has(name) || !bodies.has(name)) return;
    reached.add(name);
    for (const found of bodies.get(name).matchAll(/check: "([a-z-]+)"/g)) carried.add(found[1]);
    for (const call of bodies.get(name).matchAll(/\b([A-Za-z0-9_]+)\(/g)) walk(call[1]);
  };
  walk("audit");
  one("the declared set and the names in the source are the same", [...FINDINGS].sort().join(" "), [...carried].sort().join(" "));
  one("untouched: the walk reads the audit's own checks, so the comparison is of something", reached.has("checkBlock") && carried.has("block") && carried.size > 10, true);
  one("and a name of another command, such as `page` or `face`, is not in the set", FINDINGS.includes("page") || FINDINGS.includes("face"), false);
}

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
