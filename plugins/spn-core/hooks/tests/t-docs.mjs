// `docs.ts` — the generated surface: the faces, the grouping, and the tag line.
//
// THIS SUITE EXISTS BECAUSE THE TOOL WRITES INTO EVERY DOCUMENT IN THE CORPUS. `face` renders each
// file's tag line from its own metadata block, so a regex that is one character wrong edits eight
// hundred files at once. Nothing here is a port, so the fixtures are the whole proof.
//
// Each case builds a throwaway tree, runs the real command against it, and reads what changed on
// disk rather than what the command printed — a tool that reports a write it did not make, and one
// that makes a write it did not report, both have to fail.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const TOOL = resolve(import.meta.dirname, "..", "tools", "docs.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-"));
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

function run(root, args) {
  try {
    return execFileSync(process.execPath, [TOOL, ...args],
      { encoding: "utf8", cwd: root, env: { ...process.env, SPN_WORKSPACE: root } });
  } catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
}
const readAt = (root, p) => readFileSync(join(root, p), "utf8");

let n = 0, failed = 0;
function one(name, got, want) {
  n += 1;
  const ok = typeof want === "function" ? want(got) : got === want;
  if (!ok) { failed += 1; console.log(`  FAIL  ${name}\n        got: ${JSON.stringify(String(got).slice(0, 220))}`); }
  else console.log(`  PASS  ${name}`);
}
const has = (s) => (got) => String(got).includes(s);
const lacks = (s) => (got) => !String(got).includes(s);


// ---------------------------------------------------------------- the tag line

console.log("=== the tag line is rendered from the block, never typed");
{
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    "docs/02-constructs/README.md": doc({ id: "d", title: "Dictionary", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/README.md": doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    // What the whole corpus carried: the old label, and a status word that is not the enum's.
    "docs/03-behaviors/README.md":
      doc({ id: "b", title: "Behaviors", lenses: ["SERVER_DEV", "QA"], status: "DONE" },
          "Prose under it.\n", "`Lenses: DevOps · everyone` · `Status: ✅ Implemented`"),
  });
  run(root, ["face", "docs"]);
  const got = readAt(root, "docs/03-behaviors/README.md");
  one("the label becomes For: and the actors come from the block",
    got, has("`For: Backend developer · Quality engineer`"));
  one("the status chip carries the enum word, not a synonym", got, has("`Status: ✅ DONE`"));
  one("the blank line between the tag line and the lead paragraph survives",
    got, has("`Status: ✅ DONE`\n\nProse under it."));

  const before = readAt(root, "docs/03-behaviors/README.md");
  run(root, ["face", "docs"]);
  one("running it twice writes the same bytes", readAt(root, "docs/03-behaviors/README.md"), before);
}

{
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/03-behaviors/README.md":
      doc({ id: "b", title: "Behaviors", lenses: ["QA"], status: "DONE" }, "Lead.\n"),
  });
  run(root, ["face", "docs"]);
  one("a document with no tag line gets one under its title",
    readAt(root, "docs/03-behaviors/README.md"),
    has(`# Behaviors\n\n\`For: Quality engineer\` · \`Status: ✅ DONE\`\n\nLead.`));
}

{
  // A chapter that teaches the document shape SHOWS one. Its example is content, not a tag line.
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/03-behaviors/README.md":
      doc({ id: "b", title: "Behaviors", lenses: ["QA"], status: "DONE" },
          "Lead.\n\n```text\n# An Example\n\n`For: Architect` · `Status: 🔮 PLANNING`\n```\n",
          "`For: Quality engineer` · `Status: ✅ DONE`"),
  });
  run(root, ["face", "docs"]);
  const got = readAt(root, "docs/03-behaviors/README.md");
  one("a tag line inside a fence is content and is left alone", got, has("`For: Architect` · `Status: 🔮 PLANNING`"));
  one("the real tag line is still the block's", got, has("`For: Quality engineer` · `Status: ✅ DONE`"));
}


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
const SECTIONS = ["Boundary", "Model", "Parts", "Relations", "Binds", "Proof"];
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
  const root = repo({ "CONCEPT.md": "# c\n", "docs/02-constructs/x.md": construct(SECTIONS) });
  one("a construct with every section, written as `##`, is clean",
    run(root, ["audit", "docs/02-constructs/x.md"]), has("clean — 1 page"));
}
{
  const root = repo({ "CONCEPT.md": "# c\n",
    "docs/02-constructs/x.md": construct(SECTIONS.filter((h) => h !== "Binds")) });
  const out = run(root, ["audit", "docs/02-constructs/x.md"]);
  one("a construct genuinely missing a section is still a finding", out, has("missing section: Binds"));
  one("and it names only the one that is missing", out, lacks("Boundary"));
}
{
  // A construct that SHOWS an outline in an example is not carrying that section.
  const root = repo({ "CONCEPT.md": "# c\n",
    "docs/02-constructs/x.md": construct(SECTIONS.filter((h) => h !== "Binds"))
      .replace("## Proof", "```text\n## Binds\n```\n\n## Proof") });
  one("a heading inside a fence does not satisfy the outline",
    run(root, ["audit", "docs/02-constructs/x.md"]), has("missing section: Binds"));
}
{
  // `produced` compares a PAGE with the seat it would be produced from. A seat file is not a page.
  const root = repo({ "CONCEPT.md": "# c\n", "docs/02-constructs/x.md": construct(SECTIONS) });
  one("the produced check stays silent on a seat file, which has no page yet",
    run(root, ["audit", "docs/02-constructs/x.md"]), lacks("no seat file sits at the mirrored path"));
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
    "docs/artifacts/overviews/o.html": overview(["Overview", "DevEx", "Docs", "Glossary", "Where to go next"]) });
  one("a domain heading at `###` is a real heading, and the overview may borrow it",
    run(root, ["audit", "docs/artifacts/overviews/o.html"]), lacks("no counterpart"));
}
{
  const root = repo({ "CONCEPT.md": CONCEPT_TREE,
    "docs/artifacts/overviews/o.html": overview(["Overview", "DevEx", "Invented", "Glossary", "Where to go next"]) });
  one("a heading the concept does not have anywhere is still a finding",
    run(root, ["audit", "docs/artifacts/overviews/o.html"]), has("Invented — an overview never invents"));
}
{
  const root = repo({ "CONCEPT.md": CONCEPT_TREE,
    "docs/artifacts/overviews/o.html": overview(["Overview", "Docs", "DevEx", "Glossary", "Where to go next"]) });
  one("and the source's order still binds across depths",
    run(root, ["audit", "docs/artifacts/overviews/o.html"]), has("an overview holds its source's order"));
}
{
  // A concept that SHOWS an example page in a fenced block is not declaring those headings.
  const root = repo({
    "CONCEPT.md": CONCEPT_TREE + "\n```markdown\n## Fenced Heading\n```\n",
    "docs/artifacts/overviews/o.html": overview(["Overview", "Fenced Heading", "Glossary", "Where to go next"]) });
  one("a heading inside a fence is not a heading the concept has",
    run(root, ["audit", "docs/artifacts/overviews/o.html"]), has("Fenced Heading — an overview never invents"));
}


// ------------------------------------------- the concept's outline names each construct once

console.log("\n=== a construct nested under a level is listed once, not once per ancestor");
// AN OUTLINE THAT NAMES A THING TWICE IS NOT ONE. The concept's generated block filed a line under
// every folder, and the walk that found those constructs recurses — so a domain and each level
// beneath it both listed the same construct. The faces are right to recurse, because a face maps
// everything below it; the outline is not.
{
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    "docs/02-constructs/README.md": doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/README.md": doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/loose.md":
      doc({ id: "loose", variant: "construct", parentId: "c", dependsOn: [], title: "Loose", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/01-level/README.md": doc({ id: "lv", title: "Level", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/01-level/nested.md":
      doc({ id: "nested", variant: "construct", parentId: "c", dependsOn: [], title: "Nested", lenses: ["ARCHITECT"], status: "PLANNING" }),
  });
  run(root, ["face", "docs"]);
  const concept = readAt(root, "CONCEPT.md");
  const lines = (concept.match(/^- \*\*Nested\*\*/gm) ?? []).length;
  one("a nested construct appears exactly once in the concept's outline", lines, 1);
  one("and the construct beside it does too",
    (concept.match(/^- \*\*Loose\*\*/gm) ?? []).length, 1);
  one("while the DOMAIN's face still maps everything below it, nested included",
    readAt(root, "docs/02-constructs/01-core/README.md"), has("[Nested]"));
}


// ------------------------------------------- Binds and Proof are read in markdown too

console.log("\n=== a seat file's Binds and Proof are checked, not skipped");
// THE FOURTH TIME THIS EXACT BLINDNESS TURNED UP. checkBinds and checkProof searched for
// `<h2>Binds` and returned early when they did not find it — so on a markdown seat file, the ONLY
// form an author writes, they read nothing and reported nothing. 140 constructs passed with their
// Binds and Proof entirely unexamined while the audit said clean.
const withSections = (binds, proof) =>
  doc({ id: "x", variant: "construct", parentId: "concept", dependsOn: [], title: "X", lenses: ["ARCHITECT"], status: "PLANNING" },
      "Lead.\n\n## Boundary\n\nb\n\n## Model\n\nm\n\n## Parts\n\np\n\n## Relations\n\nr\n\n" + binds + "\n" + proof,
      "`For: Architect` · `Status: 🔮 PLANNING`");
const BINDS_OK = "## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| `a.md` | x | MUST |\n\n| Repo | Node | What it realizes | State |\n| --- | --- | --- | --- |\n| R | n | x | planned |\n";
const PROOF_OK = "## Proof\n\n| Check | Kind | What a green run shows |\n| --- | --- | --- |\n| `spnutils apps test` | gate | x |\n";
{
  const root = repo({ "CONCEPT.md": "# c\n", "docs/02-constructs/x.md": withSections(BINDS_OK, PROOF_OK) });
  one("a construct with both tables and a real command is clean",
    run(root, ["audit", "docs/02-constructs/x.md"]), has("clean"));
}
{
  const one_table = "## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| `a.md` | x | MUST |\n";
  const root = repo({ "CONCEPT.md": "# c\n", "docs/02-constructs/x.md": withSections(one_table, PROOF_OK) });
  one("Binds carrying one table is a finding — it is two",
    run(root, ["audit", "docs/02-constructs/x.md"]), has("Binds carries 1 table"));
}
{
  const no_row = "## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| `a.md` | x | MUST |\n\n| Repo | Node | What it realizes | State |\n| --- | --- | --- | --- |\n";
  const root = repo({ "CONCEPT.md": "# c\n", "docs/02-constructs/x.md": withSections(no_row, PROOF_OK) });
  one("a realization table with no row is invariant 6's finding",
    run(root, ["audit", "docs/02-constructs/x.md"]), has("no row"));
}
{
  const odd = BINDS_OK.replace("| R | n | x | planned |", "| R | n | x | nearly |");
  const root = repo({ "CONCEPT.md": "# c\n", "docs/02-constructs/x.md": withSections(odd, PROOF_OK) });
  one("a realization state outside planned · partial · done is reported",
    run(root, ["audit", "docs/02-constructs/x.md"]), has("planned · partial · done"));
}
{
  // A COMMAND IS WRITTEN AS CODE, and markdown's backticks are not part of the command.
  const spec = PROOF_OK.replace("`spnutils apps test`", "`some-thing.spec.ts`");
  const root = repo({ "CONCEPT.md": "# c\n", "docs/02-constructs/x.md": withSections(BINDS_OK, spec) });
  one("a Proof row naming a spec file rather than a command is reported",
    run(root, ["audit", "docs/02-constructs/x.md"]), has("may not name a command"));
  const root2 = repo({ "CONCEPT.md": "# c\n", "docs/02-constructs/x.md": withSections(BINDS_OK, PROOF_OK) });
  one("and a real command in backticks is NOT — the markers are stripped first",
    run(root2, ["audit", "docs/02-constructs/x.md"]), lacks("may not name a command"));
}


// ------------------------------------------- a block inside a fence is an example

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
  const before = readAt(root, "docs/teaches.md");
  run(root, ["face", "docs"]);
  one("and `face` writes no tag line into it — the file is untouched",
    readAt(root, "docs/teaches.md"), before);
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


// ---------------------------------------------------------------- the grouping

console.log("\n=== a repository may group its domains by stage");
const GROUPED = {
  // The concept names the groups at `##` and the domains inside them at `###`.
  "CONCEPT.md": "# c\n\n## SaaS Plane — Foundation   `REALIZED`\n\nWhat this stage realizes.\n\n" +
                "### DevEx\n\nHow the function operates.\n\n### Docs\n\nHow the corpus is written.\n",
  "docs/02-constructs/README.md": doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
  "docs/02-constructs/01-foundation/README.md": doc({ id: "g", title: "Foundation", lenses: ["ARCHITECT"], status: "PLANNING" }),
  "docs/02-constructs/01-foundation/01-devex/README.md": doc({ id: "dv", title: "DevEx", lenses: ["ARCHITECT"], status: "PLANNING" }),
  "docs/02-constructs/01-foundation/02-docs/README.md": doc({ id: "dc", title: "Docs", lenses: ["ARCHITECT"], status: "PLANNING" }),
  "docs/02-constructs/01-foundation/01-devex/agent.md":
    doc({ id: "agent", variant: "construct", parentId: "c", dependsOn: [], title: "The Agent", lenses: ["ARCHITECT"], status: "PLANNING" }),
};
{
  const root = repo(GROUPED);
  const out = run(root, ["face", "docs"]);
  one("a group two levels up still gets a face", out, has("02-constructs/01-foundation/README.md"));
  one("and so does each domain under it", out, has("02-constructs/01-foundation/01-devex/README.md"));
  one("the group's face maps its domains, read from the concept's own sections",
    readAt(root, "docs/02-constructs/01-foundation/README.md"), has("| [devex](01-devex/README.md) |"));
  one("the group's bridge is the concept's, not invented",
    readAt(root, "docs/02-constructs/01-foundation/README.md"), has("What this stage realizes."));
  one("a domain's face lists its constructs",
    readAt(root, "docs/02-constructs/01-foundation/01-devex/README.md"), has("[The Agent](agent.md)"));
  one("a heading the reader needs and a folder cannot hold is stripped — `SaaS Plane —`, the chip",
    out, lacks("invariant 1"));
}
{
  // A SECTION WRITTEN AS PROSE AND TABLES HAS NO BULLETS, and that is the shape the bridge used to
  // swallow whole. `### Docs` in this book is exactly it: one opening paragraph, then sub-headings
  // and tables. Reading *everything before the first bullet* as the paragraph meant a section with
  // no bullet had no end, so the face carried the entire section joined with single spaces — table
  // pipes included. The case asserts both halves: the paragraph is carried, and the body is not.
  const root = repo({ ...GROUPED,
    "CONCEPT.md": GROUPED["CONCEPT.md"].replace("### Docs\n\nHow the corpus is written.\n",
      "### Docs\n\nHow the corpus is written.\n\n#### Node Vocabulary\n\n" +
      "| Type | Purpose |\n| --- | --- |\n| `NODE` | anything that owns a doc set |\n\n" +
      "A second paragraph the face must not carry.\n") });
  run(root, ["face", "docs"]);
  const face = readAt(root, "docs/02-constructs/01-foundation/02-docs/README.md");
  one("a domain written as prose and tables still carries its opening paragraph",
    face, has("How the corpus is written."));
  one("and the face stops there — the table's own rows never reach it",
    face, lacks("anything that owns a doc set"));
  one("nor does the sub-heading, nor the paragraph after it",
    face, lacks("A second paragraph the face must not carry."));
}
{
  // A bridge is the CONCEPT's prose, and the concept sits at the repository root.
  const root = repo({ ...GROUPED,
    "CONCEPT.md": GROUPED["CONCEPT.md"].replace("How the function operates.",
      "How the function operates, argued in [the page](docs/artifacts/approaches/a.html)."),
    "docs/artifacts/approaches/a.html": "<p>x</p>\n" });
  run(root, ["face", "docs"]);
  one("a link inside a copied bridge is re-based onto the face that now carries it",
    readAt(root, "docs/02-constructs/01-foundation/01-devex/README.md"),
    has("](../../../artifacts/approaches/a.html)"));
}
{
  const root = repo({ ...GROUPED,
    "docs/02-constructs/01-foundation/03-nobody-declared/README.md":
      doc({ id: "x", title: "Nobody", lenses: ["ARCHITECT"], status: "PLANNING" }) });
  one("a domain folder the concept does not name is invariant 1's finding",
    run(root, ["face", "docs", "--check"]), has("invariant 1"));
}


console.log("\n=== a concept may name its domains in a table");
{
  // The document chapter's format rule is *prefer a table over a prose list of parallel facts*, and
  // one line per domain is exactly that. Two of the three stack concepts name every domain this way.
  const root = repo({
    "CONCEPT.md": "# c\n\n## What the stack ships\n\n| Capability | Package |\n| --- | --- |\n" +
                  "| Contract | `@x/contract` |\n| Design system | `@x/ds` |\n",
    "docs/02-constructs/README.md": doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-contract/README.md": doc({ id: "c1", title: "Contract", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/06-design-system/README.md": doc({ id: "c2", title: "DS", lenses: ["WEB_DEV"], status: "PLANNING" }),
  });
  const out = run(root, ["face", "docs", "--check"]);
  one("a domain named only by a table row satisfies invariant 1", out, lacks("invariant 1"));
  run(root, ["face", "docs"]);
  one("and the row's remaining cells become the face's bridge",
    readAt(root, "docs/02-constructs/01-contract/README.md"), has("@x/contract"));
  one("a multi-word domain matches its folder — `Design system` is `06-design-system`",
    readAt(root, "docs/02-constructs/06-design-system/README.md"), has("@x/ds"));
}
{
  const root = repo({
    "CONCEPT.md": "# c\n\n## What the stack ships\n\n| Capability | Package |\n| --- | --- |\n| Contract | `@x/contract` |\n",
    "docs/02-constructs/README.md": doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/07-nobody-declared/README.md": doc({ id: "n", title: "N", lenses: ["ARCHITECT"], status: "PLANNING" }),
  });
  one("a domain no row and no heading names is still invariant 1's finding",
    run(root, ["face", "docs", "--check"]), has("invariant 1"));
}


// ---------------------------------------------------------------- what is never walked

console.log("\n=== a seat's `templates/` is excluded by the folder, never per file");
{
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/04-capabilities/01-x/01-server/README.md":
      doc({ id: "f", title: "Face", lenses: ["SERVER_DEV"], status: "DONE" }, "Lead.\n",
          "`For: Backend developer` · `Status: ✅ DONE`"),
    "docs/04-capabilities/01-x/01-server/app.md":
      doc({ id: "m", title: "App", lenses: ["SERVER_DEV"], status: "DONE" }, "Lead.\n",
          "`For: Backend developer` · `Status: ✅ DONE`"),
    // A template's block carries placeholders and it is a mirror of nothing.
    "docs/04-capabilities/01-x/01-server/templates/a-template.md": "# {{NAME}}\n\nno block here.\n",
  });
  const out = run(root, ["face", "docs"]);
  one("a template is never taken for a mirror", out, lacks("a-template.md"));
  one("the real mirror still reaches the Map",
    readAt(root, "docs/04-capabilities/01-x/01-server/README.md"), has("| [app.md](app.md) |"));
  one("a template's own tag line is never written",
    readAt(root, "docs/04-capabilities/01-x/01-server/templates/a-template.md"), "# {{NAME}}\n\nno block here.\n");
}


// ---------------------------------------------------------------- the authored seat

console.log("\n=== the dictionary is generated from the constructs, never typed (invariant 2)");
{
  // Each column has exactly one source, and that is what makes the generation possible: a
  // construct's `Terms` table carries the consumer's word and the contract term, and the domain's
  // data-model.md carries where it is stored, matched on the contract term.
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    "docs/02-constructs/README.md": doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/README.md": doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/session.md":
      doc({ id: "session", variant: "construct", parentId: "c", dependsOn: [], title: "Session", lenses: ["ARCHITECT"], status: "PLANNING" },
          "## Terms\n\n| Term | Contract term | What it means here |\n| --- | --- | --- |\n" +
          "| sign-in | `SPSession` | one person's live access to one app site |\n" +
          "| device | `SPDevice` | the client a session was opened from |\n\n" +
          "## Boundary\n\nx\n\n## Model\n\nx\n\n## Parts\n\nx\n\n## Relations\n\nx\n\n" +
          "## Binds\n\n| where it lives today | |\n| --- | --- |\n| a | b |\n\n## Proof\n\nx\n",
          "`For: Architect` · `Status: 🔮 PLANNING`"),
    "docs/04-capabilities/01-core/01-server/data-model.md":
      doc({ id: "dm", title: "Contract Terms", lenses: ["SERVER_DEV"], status: "DONE" },
          "| Table | Terms | Constraint |\n| --- | --- | --- |\n" +
          "| `sp_session` | `SPSession` | one row per live access |\n",
          "`For: Backend developer` · `Status: ✅ DONE`"),
  });
  run(root, ["face", "docs"]);
  const dict = readAt(root, "docs/02-constructs/README.md");
  one("a Terms row becomes a dictionary row", dict, has("| sign-in | `SPSession` |"));
  one("the storage column is matched on the contract term, from data-model.md",
    dict, (g) => /\| sign-in \| `SPSession` \| `sp_session` \|/.test(g));
  one("a term no data-model names writes an em dash rather than a guess",
    dict, (g) => /\| device \| `SPDevice` \| — \|/.test(g));
  one("and the row says which construct it came from", dict, has("| Session |"));
}
{
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    "docs/02-constructs/README.md": doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/README.md": doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/session.md":
      doc({ id: "session", variant: "construct", parentId: "c", dependsOn: [], title: "Session", lenses: ["ARCHITECT"], status: "PLANNING" },
          "## Terms\n\n| Term | Contract term |\n| --- | --- |\n| sign-in | `SPSession` |\n",
          "`For: Architect` · `Status: 🔮 PLANNING`"),
  });
  one("a two-column Terms table cannot be generated from, and says so",
    run(root, ["face", "docs", "--check"]), has("two columns"));
}


console.log("\n=== a Map is a list of mirrors, so an authored seat has none");
{
  const files = {
    "CONCEPT.md": "# c\n",
    "docs/04-capabilities/README.md":
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
    "docs/04-capabilities/01-chapter.md":
      doc({ id: "ch", title: "A Chapter", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
  };
  const derived = repo(files);
  run(derived, ["face", "docs"]);
  one("where the seat is derived from source, the face carries a Map",
    readAt(derived, "docs/04-capabilities/README.md"), has("spn:generated map"));

  const authored = repo(files, { type: "FOUNDATION" });
  run(authored, ["face", "docs"]);
  one("where the seat is AUTHORED, no Map is invented — there is no src/ for a row to name",
    readAt(authored, "docs/04-capabilities/README.md"), lacks("spn:generated map"));
}

console.log("\n=== the gap scan measures and never fixes");
{
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n\n- **Session** — one person's live access\n",
    "docs/README.md": doc({ id: "f", title: "Docs", lenses: ["ARCHITECT"], status: "DONE" }, "x\n", "`For: Architect` · `Status: ✅ DONE`"),
    "docs/01-purpose/README.md": doc({ id: "p", title: "Purpose", lenses: ["ARCHITECT"], status: "PLANNING" }, "x\n", "`For: Architect` · `Status: 🔮 PLANNING`"),
    "docs/02-constructs/README.md": doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }, "x\n", "`For: Architect` · `Status: 🔮 PLANNING`"),
    "docs/02-constructs/01-core/README.md": doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }, "x\n", "`For: Architect` · `Status: 🔮 PLANNING`"),
    "docs/artifacts/approaches/a-approach.html": "<p>an argument</p>\n",
    // A page with no metadata block: the finding the scan exists to count.
    "docs/03-behaviors/README.md": "# Behaviors\n\nno block here.\n",
    // A node still carrying a tree: the shape the consolidation removed.
    "pkg/docs/README.md": "# stray\n",
  });
  const before = readAt(root, "docs/03-behaviors/README.md");
  const out = run(root, ["audit", "--report", "."]);
  const rep = readAt(root, "docs/artifacts/reports/docs-audit.md");

  one("it writes one report into the repository's own pocket", out, has("docs/artifacts/reports/docs-audit.md"));
  one("IT FIXES NOTHING IT MEASURES", readAt(root, "docs/03-behaviors/README.md"), before);
  one("a node still carrying a docs tree is a finding", rep, has("still carry a docs tree"));
  one("a domain with nothing written in it is a DOMAIN, not a group", rep, has("`01-core`"));
  one("what the concept lists is what the domain owes", rep, (g) => /\| `01-core` \| ✅ \| 0 \| 1 \|/.test(g));
  one("the arguments still in the pocket are listed", rep, has("a-approach.html"));
  one("a page with no block is counted", rep, has("block (RULE)"));

  // AN ARGUMENT IS A WORKSTREAM'S, NEVER A REPOSITORY'S. The rule is old — 05-artifacts.md has
  // always said "an argument does not live here", and the pocket's folder set never had an
  // `approaches/` in it — but nothing checked it, so fifteen pages accumulated across three
  // repositories before anybody counted. A rule a person has to remember is a rule that holds
  // until the week somebody is busy.
  {
    const ws = repo({
      "docs/artifacts/approaches/x-approach.html":
        doc({ id: "x", variant: "approach", title: "X", lenses: ["ARCHITECT"], status: "PLANNING" },
            "<p>an argument</p>\n"),
    });
    const got = run(ws, ["audit", "docs/artifacts/approaches/x-approach.html"]);
    one("an approach page in a repository's docs is refused", got, has("belongs to the workstream"));
  }
  {
    // The same page under a workstream is exactly where it belongs, and must pass untouched.
    const ws = repo({
      ".spndevex/workstreams/open/001-a/a-approach.html":
        doc({ id: "a", variant: "approach", title: "A", lenses: ["ARCHITECT"], status: "PLANNING" },
            "<p>an argument</p>\n"),
    });
    const got = run(ws, ["audit", ".spndevex/workstreams/open/001-a/a-approach.html"]);
    one("the same page in a workstream is not", got, (g) => !/belongs to the workstream/.test(g));
  }

  // The pocket's folder set is overviews, constructs and reports. `resources/` held "what a
  // document was written from", and every such file was a seat depending on a pocket — 229 files
  // across five repositories, 187 of them cited by nothing.
  {
    const ws = repo({
      "docs/artifacts/resources/packages/x/purpose.md":
        doc({ id: "xp", title: "Purpose — x", lenses: ["ARCHITECT"], status: "DONE" },
            "why x exists\n", "`For: Architect` · `Status: ✅ DONE`"),
    });
    const got = run(ws, ["audit", "docs/artifacts/resources/packages/x/purpose.md"]);
    one("a file in the pocket's resources folder is refused", got, has("lives in a seat"));
  }
  {
    // The same file in the seat that owns it is exactly right, and must pass untouched.
    const ws = repo({
      "docs/01-purpose/x.md":
        doc({ id: "xp", title: "Purpose — x", lenses: ["ARCHITECT"], status: "DONE" },
            "why x exists\n", "`For: Architect` · `Status: ✅ DONE`"),
    });
    const got = run(ws, ["audit", "docs/01-purpose/x.md"]);
    one("the same file in 01-purpose is not", got, (g) => !/lives in a seat/.test(g));
  }

  // A PRODUCED PAGE'S LINKS ARE RE-EXPRESSED FOR THE FOLDER IT LANDS IN. The seat writes
  // `sibling.md`; beside the page that file is `sibling-construct.html`, and the page sits three
  // levels from the capabilities seat rather than two. Copying the href across verbatim broke a
  // link on 166 of 166 produced pages in the workspace, and nothing saw it: the audit reads
  // structure and never follows a link.
  {
    const seat = (id, body) => doc(
      { id, variant: "construct", parentId: "concept", title: id, lenses: ["ARCHITECT"],
        status: "PLANNING", dependsOn: [] },
      body, "`For: Architect` · `Status: 🔮 PLANNING`");
    const ws = repo({
      "docs/02-constructs/01-core/thing.md": seat("thing",
        "## Boundary\n\nSee [Other](other.md) and [the cap](../../04-capabilities/x.md).\n"),
      "docs/02-constructs/01-core/other.md": seat("other", "## Boundary\n\nx\n"),
      "docs/04-capabilities/x.md": "# X\n",
    });
    // `page` needs the real construct template for its furniture; the throwaway repo has none.
    const templates = resolve(import.meta.dirname, "..", "..", "..", "..", "..",
                              "spn-foundation", "docs", "04-capabilities", "01-foundation",
                              "02-docs", "templates");
    process.env.SPN_TEMPLATES = templates;
    run(ws, ["page", "docs/02-constructs/01-core/thing.md"]);
    run(ws, ["page", "docs/02-constructs/01-core/other.md"]);
    const page = readAt(ws, "docs/artifacts/constructs/01-core/thing-construct.html");

    one("a sibling seat link becomes the sibling PAGE", page, has('href="./other-construct.html"'));
    one("a link out of the seat tree is re-based for the page's depth", page,
        has('href="../../../04-capabilities/x.md"'));
    one("the rail's home link is re-based too, not shipped as `../README.md`", page,
        (g) => /class="home" href="\.\.\/\.\.\/\.\.\/02-constructs\/README\.md"/.test(g));
    one("and the page it produced is the page the audit expects", run(ws, ["audit", "docs"]),
        (g) => !/produced/.test(g));
    delete process.env.SPN_TEMPLATES;
  }
  one("and it names what it did NOT measure rather than reporting a zero",
    rep, has("What this report does not measure"));
}

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
