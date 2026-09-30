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
import { ARTIFACT, POCKET, SEAT, WORKSTREAMS, bookTemplatesDir } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

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

const block = (o) => `<!-- spn:doc\n${JSON.stringify(o, null, 2)}\n-->\n`;

/** A seat file, written the way an author writes one: block, title, tag line, prose. */
const doc = (o, body = "Some prose.\n", tag = null) =>
  block({ summary: `What ${o.title} is.`, ...o }) +
  `\n# ${o.title}\n\n` + (tag === null ? "" : tag + "\n\n") + body;

/** `args` is the action's own argv — `["audit", "docs/a.md"]` — run through `cli.ts docs <args>`. */
function run(root, args) {
  try {
    return execFileSync(process.execPath, [TOOL, "docs", ...args],
      { encoding: "utf8", cwd: root, env: { ...process.env, SPN_WORKSPACE: root } });
  } catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
}
const readAt = (root, p) => readFileSync(join(root, p), "utf8");
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
    run(root, ["audit", "docs/a.md"]), has("clean — 1 page"));
}
{
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/a.md": doc({ id: "a", title: "A Title", lenses: ["QA"], status: "DONE" },
                     "Lead.\n", "`For: Architect` · `Status: ✅ DONE`"),
  });
  one("a lens line that disagrees with the block is a finding",
    run(root, ["audit", "docs/a.md"]), has("which the block does not declare"));
}
{
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/a.md": doc({ id: "a", title: "A Title", lenses: ["QA"], status: "DONE" },
                     "Lead.\n", "`For: Quality engineer` · `Status: 🔮 PLANNING`"),
  });
  one("a status chip that disagrees with the block is a finding",
    run(root, ["audit", "docs/a.md"]), has("the block says `DONE`"));
}
{
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/a.md": doc({ id: "a", title: "A Title", lenses: ["QA"], status: "DONE" },
                     "Lead.\n\n```text\n# A Second Title In A Fence\n```\n",
                     "`For: Quality engineer` · `Status: ✅ DONE`"),
  });
  one("a title inside a fence is not a second title",
    run(root, ["audit", "docs/a.md"]), has("clean — 1 page"));
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
    run(root, ["audit", `docs/${SEAT.constructs}/x.md`]), has("clean — 1 page"));
}
{
  const root = repo({ "CONCEPT.md": "# c\n",
    [`docs/${SEAT.constructs}/x.md`]: construct(SECTIONS.filter((h) => h !== "Boundary")) });
  const out = run(root, ["audit", `docs/${SEAT.constructs}/x.md`]);
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
    run(root, ["audit", `docs/${SEAT.constructs}/x.md`]), has("clean — 1 page"));

  const swapped = repo({ "CONCEPT.md": "# c\n",
    [`docs/${SEAT.constructs}/x.md`]: construct(["Overview", "Terms", "Model", "Parts", "Proof", "Boundary"]) });
  one("an optional section out of place is still out of place",
    run(swapped, ["audit", `docs/${SEAT.constructs}/x.md`]), has("`Proof` comes before `Boundary`"));
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
    run(root, ["audit", `docs/${SEAT.constructs}/x.md`]), has("missing section: Overview"));

  // Order matters as much as presence: Overview argues WHY and Terms defines the words the Model
  // uses, so a page that defines before it argues is a finding rather than a preference.
  const swapped = repo({ "CONCEPT.md": "# c\n",
    [`docs/${SEAT.constructs}/x.md`]: construct(["Terms", "Overview", "Model", "Parts", "Boundary", "Binds", "Proof"]) });
  one("a construct that puts Terms before Overview is refused",
    run(swapped, ["audit", `docs/${SEAT.constructs}/x.md`]), has("`Terms` comes before `Overview`"));
}
{
  const v1 = doc({ id: "x", variant: "construct", parentId: "concept", dependsOn: [], title: "X", lenses: ["ARCHITECT"], status: "PLANNING" },
      "Lead.\n\n## Boundary\n\nb\n\n## Model\n\nm\n\n## Parts\n\np\n\n## Relations\n\nr\n\n" + SECTION_BODY.Binds + "\n## Proof\n\n" + SECTION_BODY.Proof,
      "`For: Architect` · `Status: 🔮 PLANNING`");
  const out = run(repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: v1 }), ["audit", `docs/${SEAT.constructs}/x.md`]);
  one("a v1-shaped construct is reported softly until N13 re-shapes it, never refused", out, (g) => /carries the v1 outline/.test(g) && !/missing section/.test(g));
}
{
  // A construct that SHOWS an outline in an example is not carrying that section.
  const root = repo({ "CONCEPT.md": "# c\n",
    [`docs/${SEAT.constructs}/x.md`]: construct(SECTIONS.filter((h) => h !== "Boundary"))
      .replace("## Binds", "```text\n## Boundary\n```\n\n## Binds") });
  one("a heading inside a fence does not satisfy the outline",
    run(root, ["audit", `docs/${SEAT.constructs}/x.md`]), has("missing section: Boundary"));
}
{
  // `produced` compares a PAGE with the seat it would be produced from. A seat file is not a page.
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: construct(SECTIONS) });
  one("the produced check stays silent on a seat file, which has no page yet",
    run(root, ["audit", `docs/${SEAT.constructs}/x.md`]), lacks("no seat file sits at the mirrored path"));
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
          lenses: ["ARCHITECT"], summary: "s." }) +
  sections.map((h) => `<h2>${h}</h2>\n<p>x</p>`).join("\n");

const CONCEPT_TREE = "# c\n\n## SaaS Plane — Foundation\n\nstage.\n\n### DevEx\n\nhow it runs.\n\n### Docs\n\nhow it is written.\n\n## Adoption\n\nlast.\n";
{
  const root = repo({ "CONCEPT.md": CONCEPT_TREE,
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/o.html`]: overview(["Overview", "DevEx", "Docs", "Glossary", "Where to go next"]) });
  one("a domain heading at `###` is a real heading, and the overview may borrow it",
    run(root, ["audit", `docs/${POCKET.artifacts}/${ARTIFACT.overviews}/o.html`]), lacks("no counterpart"));
}
{
  const root = repo({ "CONCEPT.md": CONCEPT_TREE,
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/o.html`]: overview(["Overview", "DevEx", "Invented", "Glossary", "Where to go next"]) });
  one("a heading the concept does not have anywhere is still a finding",
    run(root, ["audit", `docs/${POCKET.artifacts}/${ARTIFACT.overviews}/o.html`]), has("Invented — an overview never invents"));
}
{
  const root = repo({ "CONCEPT.md": CONCEPT_TREE,
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/o.html`]: overview(["Overview", "Docs", "DevEx", "Glossary", "Where to go next"]) });
  one("and the source's order still binds across depths",
    run(root, ["audit", `docs/${POCKET.artifacts}/${ARTIFACT.overviews}/o.html`]), has("an overview holds its source's order"));
}
{
  // A concept that SHOWS an example page in a fenced block is not declaring those headings.
  const root = repo({
    "CONCEPT.md": CONCEPT_TREE + "\n```markdown\n## Fenced Heading\n```\n",
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/o.html`]: overview(["Overview", "Fenced Heading", "Glossary", "Where to go next"]) });
  one("a heading inside a fence is not a heading the concept has",
    run(root, ["audit", `docs/${POCKET.artifacts}/${ARTIFACT.overviews}/o.html`]), has("Fenced Heading — an overview never invents"));
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
    run(root, ["audit", `docs/${SEAT.constructs}/x.md`]), has("clean"));
}
{
  // ONE TABLE IS THE SHAPE `E` LEAVES BEHIND — the rules that hold the construct, and nothing about
  // where code sits. Demanding two would refuse every page the sweep touches.
  const one_table = "## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| `a.md` | x | MUST |\n";
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(one_table, PROOF_OK) });
  one("Binds carrying the rules table alone is clean",
    run(root, ["audit", `docs/${SEAT.constructs}/x.md`]), has("clean"));
}
{
  const no_table = "## Binds\n\nThe rules are written down somewhere else.\n";
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(no_table, PROOF_OK) });
  one("Binds carrying no table at all is still a finding",
    run(root, ["audit", `docs/${SEAT.constructs}/x.md`]), has("Binds carries no table"));
}
{
  // A realization table with no row was invariant 6's RULE, and `E` removes the table it read.
  const no_row = "## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| `a.md` | x | MUST |\n\n| Repo | Node | What it realizes | State |\n| --- | --- | --- | --- |\n";
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(no_row, PROOF_OK) });
  one("an empty realization table is no longer a finding — `E` retires the row it demanded",
    run(root, ["audit", `docs/${SEAT.constructs}/x.md`]), has("clean"));
}
{
  // THE `NODE` CELL IS NOT RESOLVED ANY MORE, and the case names the exact substring match that went:
  // `the estate declaration` used to resolve through a node called `estate`, so a cell naming a house
  // word read as checked. Nothing here resolves, and nothing here is reported.
  const loose = BINDS_OK.replace("| R | n | x | planned |", "| R | the estate declaration | x | done |");
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(loose, PROOF_OK) });
  one("a `Node` cell is no longer resolved, loosely or at all",
    run(root, ["audit", `docs/${SEAT.constructs}/x.md`]), lacks("resolves to no node"));
}
{
  const odd = BINDS_OK.replace("| R | n | x | planned |", "| R | n | x | nearly |");
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(odd, PROOF_OK) });
  one("a realization state outside planned · partial · done is reported",
    run(root, ["audit", `docs/${SEAT.constructs}/x.md`]), has("planned · partial · done"));
}
{
  // A COMMAND IS WRITTEN AS CODE, and markdown's backticks are not part of the command.
  const spec = PROOF_OK.replace("`spnutils apps test`", "`some-thing.spec.ts`");
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(BINDS_OK, spec) });
  one("a Proof row naming a spec file rather than a command is reported",
    run(root, ["audit", `docs/${SEAT.constructs}/x.md`]), has("may not name a command"));
  const root2 = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.constructs}/x.md`]: withSections(BINDS_OK, PROOF_OK) });
  one("and a real command in backticks is NOT — the markers are stripped first",
    run(root2, ["audit", `docs/${SEAT.constructs}/x.md`]), lacks("may not name a command"));
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
    run(root, ["audit", "docs/teaches.md"]), has("no spn:doc block"));
}
{
  // The ordinary case must still work: a real block, and an example further down.
  const both = doc({ id: "real", title: "Real", lenses: ["QA"], status: "DONE" },
    "Lead.\n\n```markdown\n" + block({ id: "an-example", title: "Other", lenses: ["ARCHITECT"], status: "DONE", summary: "s." }) + "```\n",
    "`For: Quality engineer` · `Status: ✅ DONE`");
  const root = repo({ "CONCEPT.md": "# c\n", "docs/real.md": both });
  one("a real block above a fenced example is still read, and it is the real one",
    run(root, ["audit", "docs/real.md"]), has("clean"));
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
  const out = run(root, ["audit", "docs"]);
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
  const out = run(root, ["audit", "docs"]);
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
  const out = run(root, ["audit", "docs"]);
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
  one("a Map whose every cell resolves reports nothing", run(root, ["audit", "docs"]), lacks("SOFT map"));
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
    run(root, ["audit", "docs"]), lacks("SOFT map"));
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
    run(root, ["audit", "docs"]), lacks("SOFT map"));
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
  const rep = run(root, ["audit", "--report", "."]);

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
    run(root, ["audit", "--report", ".", "--json"]), (g) => {
      try { const d = JSON.parse(g); return d.repo !== undefined && Array.isArray(d.seats) && d.measuredAt !== undefined; }
      catch { return false; }
    });

  // AN ARGUMENT IS A WORKSTREAM'S, NEVER A REPOSITORY'S. 05-artifacts.md has always said "an
  // argument does not live here", but nothing checked it, so fifteen pages accumulated across three
  // repositories before anybody counted. A rule a person has to remember is a rule that holds until
  // the week somebody is busy. The page is refused wherever it sits in `docs/`, a pocket folder too.
  {
    const ws = repo({
      [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/x-approach.html`]:
        doc({ id: "x", variant: "approach", title: "X", lenses: ["ARCHITECT"], status: "PLANNING" },
            "<p>an argument</p>\n"),
    });
    const got = run(ws, ["audit", `docs/${POCKET.artifacts}/${ARTIFACT.overviews}/x-approach.html`]);
    one("an approach page in a repository's docs is refused", got, has("belongs to the workstream"));
  }
  {
    // The same page under a workstream is exactly where it belongs, and must pass untouched.
    const ws = repo({
      [`.spndevex/${WORKSTREAMS}/open/001-a/a-approach.html`]:
        doc({ id: "a", variant: "approach", title: "A", lenses: ["ARCHITECT"], status: "PLANNING" },
            "<p>an argument</p>\n"),
    });
    const got = run(ws, ["audit", `.spndevex/${WORKSTREAMS}/open/001-a/a-approach.html`]);
    one("the same page in a workstream is not", got, (g) => !/belongs to the workstream/.test(g));
  }

  // The pocket's folder set is overviews, constructs and reports (05-artifacts.md § What the pocket
  // holds). A folder the set does not name held "what a document was written from", and every such
  // file was a seat depending on a pocket — 229 files across five repositories, 187 of them cited by
  // nothing. The check reads the set, so any other name is refused the same way; two are probed.
  for (const folder of ["resources", "notes"]) {
    const ws = repo({
      [`docs/${POCKET.artifacts}/${folder}/packages/x/purpose.md`]:
        doc({ id: "xp", title: "Purpose — x", lenses: ["ARCHITECT"], status: "DONE" },
            "why x exists\n", "`For: Architect` · `Status: ✅ DONE`"),
    });
    const got = run(ws, ["audit", `docs/${POCKET.artifacts}/${folder}/packages/x/purpose.md`]);
    one(`a file in a pocket folder outside the set (${folder}/) is refused`, got, has(`never in \`${folder}/\``));
  }
  {
    // The same file in the seat that owns it is exactly right, and must pass untouched.
    const ws = repo({
      [`docs/${SEAT.purpose}/x.md`]:
        doc({ id: "xp", title: "Purpose — x", lenses: ["ARCHITECT"], status: "DONE" },
            "why x exists\n", "`For: Architect` · `Status: ✅ DONE`"),
    });
    const got = run(ws, ["audit", `docs/${SEAT.purpose}/x.md`]);
    one(`the same file in ${SEAT.purpose} is not`, got, (g) => !/lives in a seat/.test(g));
  }
  {
    // A folder the set names is the pocket working as intended, and this rule stays quiet on it.
    const ws = repo({
      [`docs/${POCKET.artifacts}/${ARTIFACT.reports}/x.md`]:
        doc({ id: "xr", title: "Report — x", lenses: ["ARCHITECT"], status: "DONE" },
            "what x measured\n", "`For: Architect` · `Status: ✅ DONE`"),
    });
    const got = run(ws, ["audit", `docs/${POCKET.artifacts}/${ARTIFACT.reports}/x.md`]);
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
      run(root, ["audit", `docs/${SEAT.constructs}/01-core/rungs.md`]), lacks("vocabulary"));
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
    const got = run(root, ["audit", `docs/${SEAT.constructs}/01-core/rungs.md`]);
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
      run(root, ["audit", `docs/${SEAT.constructs}/01-core/rungs.md`]), has("does not name BROWSED"));
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
    const got = run(root, ["audit", `docs/${SEAT.constructs}/01-core/rungs.md`]);
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
      run(root, ["audit", `docs/${SEAT.constructs}/01-core/rungs.md`]), lacks("vocabulary"));
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
      run(root, ["audit", `docs/${SEAT.constructs}/01-core/rungs.md`, `docs/${SEAT.constructs}/01-core/again.md`]),
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
      run(root, ["audit", `docs/${SEAT.constructs}/01-core/rungs.md`, `docs/${SEAT.constructs}/01-core/other.md`]),
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
      run(root, ["audit", `docs/${SEAT.constructs}/01-core/rungs.md`, `docs/${SEAT.constructs}/01-core/other.md`]),
      has("`SPRungType` is named as a contract term"));
  }

  {
    // One page cannot see the corpus, so it must not accuse another chapter of not existing.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      [`docs/${SEAT.constructs}/01-core/rungs.md`]: chapter("Rungs", "rungs", "No declaration here.\n"),
    });
    one("one page audited alone never claims a value is undeclared",
      run(root, ["audit", `docs/${SEAT.constructs}/01-core/rungs.md`]), lacks("no chapter declares"));
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
    const got = run(root, ["audit", `docs/${SEAT.constructs}/01-core/rungs.md`]);
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
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/concept-core-overview.html`]:
      `<meta charset="utf-8">\n<title>Core</title>\n` +
      block({ id: "o", variant: "overview", parentId: "concept", title: "Core", lenses: ["ARCHITECT"], summary: "s." }) +
      sections.map((h) => `<h2>${h}</h2>\n<p>x</p>`).join("\n"),
  });
  const audit = (secs) => run(repo(tree(secs)), ["audit", `docs/${POCKET.artifacts}/${ARTIFACT.overviews}/concept-core-overview.html`]);

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
    `<h2>Overview</h2>\n<p>See <a href="${href}">it</a>.</p>\n<h2>Glossary</h2>\n<p>x</p>\n<h2>Where to go next</h2>\n<p>x</p>`;
  const mk = (href) => repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    [`docs/${SEAT.constructs}/01-core/thing.md`]: "# Thing\n",
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/o.html`]: page(href),
  });
  one("a link to a construct SEAT is refused, and it names the page it should have used",
    run(mk(`../../${SEAT.constructs}/01-core/thing.md`), ["audit", `docs/${POCKET.artifacts}/${ARTIFACT.overviews}/o.html`]),
    has("thing-construct.html"));
  one("a link to the produced page is silent",
    run(mk(`../${ARTIFACT.constructs}/01-core/thing-construct.html`), ["audit", `docs/${POCKET.artifacts}/${ARTIFACT.overviews}/o.html`]),
    lacks("an HTML page links the HTML page"));
  // A SEAT README IS PRODUCED AS NO PAGE AT ALL, so a link to one has nowhere else to go. Refusing
  // it would be a gate demanding a file the generator never writes.
  one("a link to a seat README keeps its .md, because no page exists for it",
    run(mk(`../../${SEAT.constructs}/README.md`), ["audit", `docs/${POCKET.artifacts}/${ARTIFACT.overviews}/o.html`]),
    lacks("an HTML page links the HTML page"));
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
    run(mk(at, dm(good)), ["audit", at]), has("clean — 1 page"));
  // THE KNOWN-BAD INPUT IS THE CORPUS'S OWN FIRST ROW: 19 of 25 files opened with this dictionary heading.
  const dictionary = good.replace("| Table | Stores | The rule it keeps |", "| Consumer | Capability | Description |");
  const out = run(mk(at, dm(dictionary)), ["audit", at]);
  one("a dictionary's first row under Tables is an outline finding", out,
    has("`Tables`'s first row is `Consumer · Capability · Description`; the data_model heading is `Table · Stores · The rule it keeps`"));
  one("and it is SOFT, because the check is new", out, has("SOFT outline"));
  one("and nothing about it refuses", out, has("0 RULE"));
  one("a data model with no Indexes section is missing one",
    run(mk(at, dm(good.replace(/## Indexes[\s\S]*$/, ""))), ["audit", at]), has("missing section: Indexes"));
  one("Seeds and order is optional, and in its place it is silent",
    run(mk(at, dm(good + "\n## Seeds and order\n\nThe roles migration runs first.\n")), ["audit", at]), has("clean — 1 page"));
  one("a section the outline does not have is named",
    run(mk(at, dm(good + "\n## Environment Variables\n\nNone.\n")), ["audit", at]), has("the data_model outline does not have: Environment Variables"));
  const root = `docs/${SEAT.capabilities}/01-core/data-model.md`;
  one("a data model at a domain's root sits above the half that owns the storage",
    run(mk(root, dm(good)), ["audit", root]), has("at a domain's root it sits above the half that owns the storage"));
  const bare = doc({ id: "dm", title: "Contract Terms", lenses: ["SERVER_DEV"], status: "DONE" }, good, "`For: Backend developer` · `Status: ✅ DONE`");
  one("a data-model.md that declares no kind is itself a finding — nothing else would read its outline",
    run(mk(at, bare), ["audit", at]), has("declares `variant` `—`; the file kind is `data_model`"));
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
  one("a surface map in the shape is clean", run(mk(sm(good)), ["audit", at]), has("clean — 1 page"));
  one("a kind outside the four is named",
    run(mk(sm(good.replace("| hook |", "| util |"))), ["audit", at]), has("`useIdentityFactors` is of kind `util`; a surface is one of page · component · widget · hook"));
  one("a screen-keyed first row is refused softly — routes are the application's",
    run(mk(sm(good.replace("| Surface | Kind | Contract term | What it is for |", "| Screen | Route | Contract term | Surfaces |"))), ["audit", at]),
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
  one("a glossary whose cells answer their headings is silent", run(mk(good), ["audit", at]), lacks("column"));
  // THE DEFECT THAT OPENED THE ARC, REPRODUCED: the column no reading was ever written for.
  const stored = "| Term | Contract term | Where it is stored |\n| --- | --- | --- |\n" +
    "| [scheduler](job.md) | `JobScheduler` | `${APP}_JOB_SCHEDULER_PROVIDER` |\n| [queue](job.md) | `JobQueue` | ✅ written |\n";
  const out = run(mk(stored), ["audit", at]);
  one("a generated column no reading exists for is reported by a run", out,
    has("the generated glossary column `Where it is stored` has no reading of its values"));
  one("a status marker under Contract term is not a spelling",
    run(mk(good.replace("`SPSession`", "✅ written")), ["audit", at]), has("under the generated glossary column `Contract term` is not the term as the system spells it"));
  one("a description standing where a spelling belongs is named",
    run(mk(good.replace("`SPSession`", "the estate's app row")), ["audit", at]), has("`the estate's app row`"));
  one("a group divider row is not data", run(mk(good), ["audit", at]), lacks("`Session`"));
  one("a table written by hand, outside the markers, is the author's and is not read",
    run(repo({ "CONCEPT.md": "# c\n", [at]: doc({ id: "c", title: "Core", lenses: ["ARCHITECT"] }, "| Term | Anything |\n| --- | --- |\n| a | ✅ |\n", "`For: Architect`") }), ["audit", at]),
    lacks("column"));
}

console.log("\n=== an authored page defines no selector its declared template does not (N25 step 6)");
{
  // THE REAL TEMPLATES, copied untouched. A fixture stylesheet would prove the reader agrees with
  // the fixture; the figure this check exists to produce is measured against these files.
  const templates = bookTemplatesDir(resolve(PLUGIN, "..", "..", "..", "spn-foundation"));
  process.env.SPN_TEMPLATES = templates;
  const overview = readFileSync(resolve(templates, "pages", "overview-template.html"), "utf8");
  const hub = readFileSync(resolve(templates, "pages", "hub-template.html"), "utf8");
  const invent = (page, css) => page.replace("</style>", `${css}\n</style>`);
  const ws = repo({
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/concept-core-overview.html`]: overview,
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/concept-bad-overview.html`]: invent(overview, "  .invented-hero > .lede{margin:0}"),
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/concept-media-overview.html`]:
      invent(overview, "  @media (max-width:40rem){ .only-narrow, .tile{padding:0} }\n  @keyframes spin{from{opacity:0}to{opacity:1}}"),
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/concept-overview.html`]: hub,
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/concept-glyph-overview.html`]: invent(overview, "  .tile .glyph{float:right}"),
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/concept-late-overview.html`]: overview + "\n<style>\n  .late-block{color:red}\n</style>\n",
  });
  const got = (p) => run(ws, ["audit", `docs/${POCKET.artifacts}/${ARTIFACT.overviews}/${p}`]);

  one("an untouched copy of the overview template is not reported", got("concept-core-overview.html"), lacks("SOFT selector"));
  one("an untouched copy of the hub template is not reported", got("concept-overview.html"), lacks("SOFT selector"));
  one("a page with an invented selector is reported, SOFT, naming it",
    got("concept-bad-overview.html"), (g) => g.includes("SOFT selector") && g.includes("`.invented-hero>.lede`"));
  // The copied template carries its placeholders, so other checks refuse it; the claim here is only
  // that THIS check reports rather than refuses.
  one("and it never refuses", got("concept-bad-overview.html"), (g) => g.includes("! SOFT selector") && !g.includes("RULE selector"));
  one("a selector inside @media is read; one the template declares there is not reported",
    got("concept-media-overview.html"), (g) => g.includes("defines 1 selector(s)") && g.includes("`.only-narrow`"));
  one("a keyframe step is not a selector", got("concept-media-overview.html"), lacks("`from`"));
  one("the hub's template blesses `.tile .glyph`, a domain overview's does not",
    got("concept-glyph-overview.html"), has("`overview-template.html` does not — `.tile .glyph`"));
  one("every style block is read, not only the first", got("concept-late-overview.html"), has("`.late-block`"));
  one("the same page gives the same finding twice", got("concept-bad-overview.html"), (g) => g === got("concept-bad-overview.html"));
  delete process.env.SPN_TEMPLATES;
  one("with no template to read, nothing is reported rather than everything",
    got("concept-bad-overview.html"), lacks("SOFT selector"));
}

console.log("\n=== a report is a snapshot: no status, and its header says Generated and Commit (RD.DEVEX.WORKSPACE.192)");
{
  // THE REAL TEMPLATE'S SCRIPTS, because the furniture check compares a report with its own
  // template, and a fixture script would prove only that the check agrees with the fixture.
  const templates = bookTemplatesDir(resolve(PLUGIN, "..", "..", "..", "spn-foundation"));
  const reportTemplate = readFileSync(resolve(templates, "pages", "report-template.html"), "utf8");
  const constructTemplate = readFileSync(resolve(templates, "pages", "construct-template.html"), "utf8");
  const scriptsOf = (t) => (t.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) ?? []).join("\n");
  const at = `docs/${POCKET.artifacts}/${ARTIFACT.reports}/coverage-report.html`;
  const good = { id: "t-coverage-report", variant: "report", reportType: "COVERAGE", title: "Coverage report",
    lenses: ["QA"], generatedAt: "2026-09-30T12:57+05:30", summary: "What was counted.", keywords: ["report"] };
  const line2 = (datetime, cls = "local") =>
    `<span class="line"><span class="lbl">Generated:</span> <span class="badge when"><time class="${cls}" datetime="${datetime}">${datetime}</time></span>` +
    `<span class="sep">|</span><span class="lbl">Commit:</span> <span class="badge when">e549cfaa</span></span>`;
  const page = (o, { second = line2(o.generatedAt), chip = "", scripts = scriptsOf(reportTemplate) } = {}) =>
    block(o) + `<nav class="rail" id="rail"></nav>\n<header class="masthead">\n` +
    `<div class="eyebrow"><span class="line1">SaaS Plane | t | ${o.title}</span>` +
    `<span class="line"><span class="lbl">Type:</span> <span class="badge type">Report</span><span class="sep">|</span>` +
    `<span class="lbl">For:</span> <span class="audience"><span class="badge lens">Quality engineer</span></span>${chip}</span>${second}</div>\n` +
    `<h1>${o.title}</h1>\n<p class="subtitle">How much of this repository is written, built and proved?</p>\n` +
    `<p class="standfirst">What was counted.</p>\n</header>\n${scripts}\n`;
  const audit = (text) => {
    process.env.SPN_TEMPLATES = templates;
    try { return run(repo({ "CONCEPT.md": "# c\n", [at]: text }), ["audit", at]); }
    finally { delete process.env.SPN_TEMPLATES; }
  };
  const mine = /a report carries|a report shows|Generated|no Commit|only a `tests` report|`measuredAt` is|furniture/;

  const clean = audit(page(good));
  one("a report with no status, a Generated moment and a Commit draws none of these findings",
    clean, (g) => !g.split("\n").some((l) => /RULE/.test(l) && mine.test(l)));
  one("a report block carrying `status` is refused",
    audit(page({ ...good, status: "IMPLEMENTING" })), has("a report carries no `status`"));
  one("a report header showing a status chip is refused",
    audit(page(good, { chip: `<span class="lbl">Status:</span> <span class="badge status implementing">&#x1F6A7; IMPLEMENTING</span>` })),
    has("a report shows no status chip"));
  one("a report with no `generatedAt` is refused",
    audit(page((({ generatedAt, ...rest }) => rest)(good), { second: line2("2026-09-30T12:57+05:30") })), has("a report carries `generatedAt`"));
  one("a `generatedAt` with no time and offset is refused",
    audit(page({ ...good, generatedAt: "2026-09-30" })), has("a report carries `generatedAt`"));
  one("a header moment that is not the block's is refused",
    audit(page(good, { second: line2("2026-09-29T09:00+05:30") })), has("Generated reads `2026-09-29T09:00+05:30`"));
  one("a Generated `<time>` the script cannot find is refused",
    audit(page(good, { second: line2(good.generatedAt, "stamp") })), has("carries `class=\"local\"`"));
  one("a header with no Generated line is refused",
    audit(page(good, { second: "" })), has("no Generated line"));
  one("a header with no Commit is refused",
    audit(page(good, { second: line2(good.generatedAt).replace(/<span class="sep">\|<\/span><span class="lbl">Commit:[\s\S]*?e549cfaa<\/span>/, "") })),
    has("no Commit"));
  one("`measuredAt` on a coverage report is refused",
    audit(page({ ...good, measuredAt: "2026-09-30T12:44+05:30" })), has("only a `tests` report carries `measuredAt`"));
  one("`measuredAt` on a tests report is its newest run, and passes",
    audit(page({ ...good, reportType: "TESTS", measuredAt: "2026-09-30T12:44+05:30" })), lacks("carries `measuredAt`"));
  one("a report carrying only the construct template's scripts is off its own template",
    audit(page(good, { scripts: scriptsOf(constructTemplate) })), has("this page's scripts are not the template's"));
}

// ---------------------------------------------------------------- the masthead's three levels

console.log("\n=== the masthead: h1, an optional p.subtitle, one p.standfirst, and nothing after it (RD.DEVEX.WORKSPACE.187)");
{
  const page = (inner, file = "concept-core-overview.html") => repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/${file}`]:
      `<meta charset="utf-8">\n<title>Core</title>\n` +
      block({ id: "o", variant: "overview", parentId: "concept", title: "Core", lenses: ["ARCHITECT"], summary: "s." }) +
      `<header class="masthead">\n<!-- a comment <p>is not a paragraph</p> -->\n${inner}\n</header>\n<h2>Overview</h2>\n<p>x</p>`,
  });
  const audit = (inner, file) => run(page(inner, file), ["audit", `docs/${POCKET.artifacts}/${ARTIFACT.overviews}/${file ?? "concept-core-overview.html"}`]);
  const GOOD = `<h1>Know where you are.</h1>\n<p class="subtitle">The core is the part every other part reads.</p>\n<p class="standfirst">This page covers the core. Read it first.</p>`;

  one("h1, one Subtitle and one Description draw no masthead finding", audit(GOOD), lacks("masthead"));
  one("a Subtitle is optional", audit(GOOD.replace(/<p class="subtitle">.*<\/p>\n/, "")), lacks("masthead"));
  one("a second paragraph after the Description is SOFT until every tree is retrofitted (N116 row 9)",
    audit(GOOD + "\n<p>A second paragraph.</p>"), (g) => g.includes("! SOFT masthead") && g.includes("paragraph past the Subtitle"));
  one("a second standfirst is a second paragraph, whatever its class says",
    audit(GOOD + `\n<p class="standfirst">Another Description.</p>`), has("carries 1 paragraph past the Subtitle"));
  one("a tagline beside the Subtitle is a second paragraph too",
    audit(GOOD.replace("<p class=\"subtitle\">", "<p class=\"tagline\">A tagline.</p>\n<p class=\"subtitle\">")), (g) => g.includes("! SOFT masthead") && g.includes("paragraph past the Subtitle"));
  one("a Subtitle of two sentences is SOFT",
    audit(GOOD.replace("reads.</p>", "reads. It is small.</p>")), has("! SOFT masthead"));
  one("and names the count", audit(GOOD.replace("reads.</p>", "reads. It is small.</p>")), has("runs to 2 sentences"));
  one("a header with no Description is SOFT",
    audit(GOOD.replace(/\n<p class="standfirst">.*<\/p>/, "")), has("has no Description"));
  one("a Subtitle below the Description is out of place",
    audit(`<h1>Know where you are.</h1>\n<p class="standfirst">This page covers the core.</p>\n<p class="subtitle">The core is the part every other part reads.</p>`),
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
    [`docs/${POCKET.artifacts}/${ARTIFACT.overviews}/concept-overview.html`]:
      `<meta charset="utf-8">\n<title>Concept</title>\n` +
      block({ id: "o", variant: "overview", parentId: "concept", title: "Concept", lenses: ["ARCHITECT"], summary: "s." }) +
      `<header class="masthead">\n<h1>${h1}</h1>\n<p class="subtitle">${sub}</p>\n<p class="standfirst">This page is the start.</p>\n</header>\n<h2>Overview</h2>\n<p>x</p>`,
  }, { type: "FOUNDATION" });
  const audit = (...a) => run(hub(...a), ["audit", `docs/${POCKET.artifacts}/${ARTIFACT.overviews}/concept-overview.html`]);
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

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
