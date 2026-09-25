// `docs.ts` — the generated surface: the faces, the grouping, and the tag line.
//
// THIS SUITE EXISTS BECAUSE THE TOOL WRITES INTO EVERY DOCUMENT IN THE CORPUS. `face` renders each
// file's tag line from its own metadata block, so a regex that is one character wrong edits eight
// hundred files at once. Nothing here is a port, so the fixtures are the whole proof.
//
// Each case builds a throwaway tree, runs the real command against it, and reads what changed on
// disk rather than what the command printed — a tool that reports a write it did not make, and one
// that makes a write it did not report, both have to fail.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const TOOL = resolve(import.meta.dirname, "..", "src", "scripts", "tools", "docs.ts");
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
  const root = repo({ "CONCEPT.md": "# c\n", "docs/02-constructs/x.md": construct(SECTIONS) });
  one("a construct with every section, written as `##`, is clean",
    run(root, ["audit", "docs/02-constructs/x.md"]), has("clean — 1 page"));
}
{
  const root = repo({ "CONCEPT.md": "# c\n",
    "docs/02-constructs/x.md": construct(SECTIONS.filter((h) => h !== "Binds")) });
  const out = run(root, ["audit", "docs/02-constructs/x.md"]);
  one("a construct genuinely missing a section is still a finding", out, has("missing section: Binds"));
  one("and it names only the one that is missing", out, lacks("missing section: Terms"));
}
{
  // OVERVIEW IS REQUIRED, AND IT WAS OPTIONAL FOR ONE SITTING (N67). Adding a required section to
  // documents that already exist has no safe order: move the corpus first and every moved page is
  // refused for carrying a section the outline does not name; require it first and every page that
  // has not moved is refused for lacking it. Optional is the state where both pass. These two cases
  // hold the end state — required, and first — so the middle state cannot be left behind by accident.
  const root = repo({ "CONCEPT.md": "# c\n",
    "docs/02-constructs/x.md": construct(SECTIONS.filter((h) => h !== "Overview")) });
  one("a construct with no Overview is refused, and named",
    run(root, ["audit", "docs/02-constructs/x.md"]), has("missing section: Overview"));

  // Order matters as much as presence: Overview argues WHY and Terms defines the words the Model
  // uses, so a page that defines before it argues is a finding rather than a preference.
  const swapped = repo({ "CONCEPT.md": "# c\n",
    "docs/02-constructs/x.md": construct(["Terms", "Overview", "Model", "Parts", "Boundary", "Binds", "Proof"]) });
  one("a construct that puts Terms before Overview is refused",
    run(swapped, ["audit", "docs/02-constructs/x.md"]), has("`Terms` comes before `Overview`"));
}
{
  const v1 = doc({ id: "x", variant: "construct", parentId: "concept", dependsOn: [], title: "X", lenses: ["ARCHITECT"], status: "PLANNING" },
      "Lead.\n\n## Boundary\n\nb\n\n## Model\n\nm\n\n## Parts\n\np\n\n## Relations\n\nr\n\n" + SECTION_BODY.Binds + "\n## Proof\n\n" + SECTION_BODY.Proof,
      "`For: Architect` · `Status: 🔮 PLANNING`");
  const out = run(repo({ "CONCEPT.md": "# c\n", "docs/02-constructs/x.md": v1 }), ["audit", "docs/02-constructs/x.md"]);
  one("a v1-shaped construct is reported softly until N13 re-shapes it, never refused", out, (g) => /carries the v1 outline/.test(g) && !/missing section/.test(g));
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
      "Lead.\n\n## Overview\n\nwhy\n\n## Terms\n\nt\n\n## Model\n\nm\n\n## Parts\n\np\n\n## Boundary\n\nb\n\n" + binds + "\n" + proof,
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
  // It is ONE DOMAIN's dictionary, on that domain's own face, in three columns. The fixture carries
  // a `data-model.md` on purpose: nothing it says may reach a dictionary row, because the column
  // that read it is gone.
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    "docs/02-constructs/README.md": doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/README.md": doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/session.md":
      doc({ id: "session", variant: "construct", parentId: "c", dependsOn: [], title: "Session", lenses: ["ARCHITECT"], status: "PLANNING" },
          "## Terms\n\n| Term | Contract term | What it means here |\n| --- | --- | --- |\n" +
          "| sign-in | `SPSession` | one person's live access to one app site |\n" +
          "| device | `SPDevice` | the client a session was opened from |\n\n" +
          "## Model\n\nx\n\n## Parts\n\nx\n\n## Boundary\n\nx\n\n" +
          "## Binds\n\n| where it lives today | |\n| --- | --- |\n| a | b |\n\n## Proof\n\nx\n",
          "`For: Architect` · `Status: 🔮 PLANNING`"),
    "docs/04-capabilities/01-core/01-server/data-model.md":
      doc({ id: "dm", title: "Contract Terms", lenses: ["SERVER_DEV"], status: "DONE" },
          "| Table | Terms | Constraint |\n| --- | --- | --- |\n" +
          "| `sp_session` | `SPSession` | one row per live access |\n",
          "`For: Backend developer` · `Status: ✅ DONE`"),
  });
  run(root, ["face", "docs"]);
  const domain = readAt(root, "docs/02-constructs/01-core/README.md");
  one("a Terms row becomes a dictionary row on its own domain's face",
    domain, has("| [sign-in](session.md) | `SPSession` | one person's live access to one app site |"));
  one("the term is the link to the construct that declares it, and there is no fourth column",
    domain, lacks("| Session |"));
  one("the domain's glossary carries a heading a reader can land on",
    domain, has("## Glossary"));
  one("the glossary is not called a dictionary, which is what the seat face used to carry",
    domain, lacks("## The dictionary"));
  one("a term the domain's data model names is not stored-column joined — the column is gone",
    domain, lacks("sp_session"));
  one("and the table is three columns wide",
    domain, has("| Term | Contract term | What it means |"));
  one("the seat face carries the domain table and no dictionary",
    readAt(root, "docs/02-constructs/README.md"), lacks("sign-in"));
}
{
  // THE REGION THE OLD SHAPE LEFT BEHIND. A generated region nothing regenerates goes stale rather
  // than standing still, so the run takes it off the seat face instead of writing past it.
  const stale =
    "<!-- spn:generated dictionary — do not edit inside these markers; `docs.ts face` writes it -->\n" +
    "| Term | Contract term | Where it is stored | From |\n| --- | --- | --- | --- |\n" +
    "| sign-in | `SPSession` | `${APP}_JOB_SCHEDULER_PROVIDER` | Session |\n" +
    "<!-- /spn:generated -->\n";
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    "docs/02-constructs/README.md":
      doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }, "Some prose.\n\n" + stale),
    "docs/02-constructs/01-core/README.md": doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
  });
  const out = run(root, ["face", "docs"]);
  const seat = readAt(root, "docs/02-constructs/README.md");
  one("a dictionary left on a seat face by the old shape is removed", seat, lacks("Where it is stored"));
  one("and the markers go with it, so nothing invites an edit inside a region nobody writes",
    seat, lacks("spn:generated dictionary"));
  one("the author's own prose around it is untouched", seat, has("Some prose."));
  one("and the run reports the file it rewrote", out, has("02-constructs/README.md"));
}

console.log("\n=== the glossary is ordered the way a reader meets the words, not A-Z (Q233)");
{
  // THE TWO ORDERS ARE MADE TO DISAGREE ON PURPOSE. `Zebra` is read FIRST because `Alpha` depends
  // on it, and its term `banana` sorts AFTER `Alpha`'s `apple`. An alphabetical glossary puts
  // `apple` first; a glossary in the domain's own reading order puts `banana` first. A fixture
  // where both orders agree proves nothing, which is how the old A-Z sort survived.
  const terms = (t) => "## Terms\n\n| Term | Contract term | What it means |\n| --- | --- | --- |\n" +
    `| ${t} | \`SP${t}\` | the ${t} |\n\n` +
    "## Model\n\nx\n\n## Parts\n\nx\n\n## Boundary\n\nx\n\n" +
    "## Binds\n\n| where it lives today | |\n| --- | --- |\n| a | b |\n\n## Proof\n\nx\n";
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    "docs/02-constructs/README.md": doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/README.md": doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/01-alpha.md":
      doc({ id: "alpha", variant: "construct", parentId: "c", dependsOn: ["zebra"], title: "Alpha", lenses: ["ARCHITECT"], status: "PLANNING" },
          terms("apple"), "`For: Architect` · `Status: 🔮 PLANNING`"),
    "docs/02-constructs/01-core/02-zebra.md":
      doc({ id: "zebra", variant: "construct", parentId: "c", dependsOn: [], title: "Zebra", lenses: ["ARCHITECT"], status: "PLANNING" },
          terms("banana"), "`For: Architect` · `Status: 🔮 PLANNING`"),
  });
  run(root, ["face", "docs"]);
  const domain = readAt(root, "docs/02-constructs/01-core/README.md");
  const at = (needle) => domain.indexOf(needle);
  one("a construct contributes a heading row, so the grouping is visible rather than implied",
    domain, has("| **Zebra** | | |"));
  one("the construct read first comes first, even though its term sorts last",
    at("| **Zebra** | | |") > -1 && at("| **Alpha** | | |") > at("| **Zebra** | | |") ? "ok" : "wrong order", has("ok"));
  one("and its term travels with it, ahead of the alphabetically earlier one",
    at("banana") > -1 && at("apple") > at("banana") ? "ok" : "A-Z survived", has("ok"));
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


// ---------------------------------------------------------------- a mirror is a DIRECT child

console.log("\n=== a seat face lists the mirrors beside it, never the chapters three levels down");
{
  // The shape every affected repository has: the seat holds domains, a domain holds packages, and
  // only a package holds chapters. A recursive walk collected the chapters and derived
  // `src/<domain>/<package>/<chapter>/` for each — a path with the seat's own numbering
  // concatenated onto the source root, naming a folder that has never existed.
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/04-capabilities/README.md":
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
    "docs/04-capabilities/01-core/README.md":
      doc({ id: "dm", title: "Core", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
    "docs/04-capabilities/01-core/01-server/README.md":
      doc({ id: "pk", title: "Server", lenses: ["SERVER_DEV"], status: "DONE" }, "Lead.\n",
          "`For: Backend developer` · `Status: ✅ DONE`"),
    "docs/04-capabilities/01-core/01-server/01-app.md":
      doc({ id: "ch", title: "App", lenses: ["SERVER_DEV"], status: "DONE" }, "Lead.\n",
          "`For: Backend developer` · `Status: ✅ DONE`"),
  });
  run(root, ["face", "docs"]);
  const seat = readAt(root, "docs/04-capabilities/README.md");
  one("a chapter three levels down never reaches the seat's Map",
    seat, lacks("01-core/01-server/01-app"));
  one("and the seat says it carries no mirror rather than inventing one",
    seat, has("this layer carries no mirror yet"));
  one("the domain face between them says the same",
    readAt(root, "docs/04-capabilities/01-core/README.md"), has("this layer carries no mirror yet"));
  one("the package face still lists the chapter — the chapter branch is unchanged",
    readAt(root, "docs/04-capabilities/01-core/01-server/README.md"), has("| [01-app.md](01-app.md) |"));

  const before = seat;
  run(root, ["face", "docs"]);
  one("running it twice writes the same bytes", readAt(root, "docs/04-capabilities/README.md"), before);
}
{
  // A mirror that IS a direct child still reaches the Map, and is still named for its folder.
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/04-capabilities/README.md":
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
    "docs/04-capabilities/app.md":
      doc({ id: "m", title: "App", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
  });
  run(root, ["face", "docs"]);
  one("a direct `.md` child is a mirror and names the folder it governs",
    readAt(root, "docs/04-capabilities/README.md"), has("| [app.md](app.md) | `src/app/` |"));
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
    "docs/02-constructs/01-here/01-here.md":
      doc({ id: "l-here", title: "Here", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`") +
      "\nA link that [resolves](02-there.md), and one that [does not](03-gone.md).\n" +
      "\nA [heading on a page that exists](02-there.md#a-heading), and a [heading here](#a-heading).\n" +
      "\nAn [absolute one](https://example.com/x.md), and a [root-relative one](/docs/x.md).\n",
    "docs/02-constructs/01-here/02-there.md":
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
    "docs/02-constructs/01-here/01-here.md":
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
    "docs/04-capabilities/README.md":
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`") +
      "\n<!-- spn:generated map — do not edit inside these markers; `docs.ts face` writes it -->\n" +
      "| File | Governs | Carries | Status |\n| --- | --- | --- | --- |\n" +
      "| [app.md](app.md) | `src/app/` | The app layer. | ✅ |\n" +
      "| [ghost.md](ghost.md) | `src/01-core/01-server/ghost/` | A folder nobody has. | ✅ |\n" +
      "<!-- /spn:generated -->\n",
    "src/app/index.ts": "export const a = 1;\n",
    // The Map's own links resolve, because a generated Map names files it walked. What is under test
    // is the Governs CELL, and a fixture whose links dangle would be reporting something else.
    "docs/04-capabilities/app.md":
      doc({ id: "g-app", title: "App", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
    "docs/04-capabilities/ghost.md":
      doc({ id: "g-ghost", title: "Ghost", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
  });
  const out = run(root, ["audit", "docs"]);
  one("the cell that resolves to nothing is reported", out, has("`src/01-core/01-server/ghost/`, and no such folder exists"));
  one("and the row it sits on is named by its text, not its link syntax",
    out, (g) => g.includes("the Map says `ghost.md` governs") && !g.includes("[ghost.md](ghost.md)"));
  one("the cell that resolves is not reported", out, lacks("`src/app/`, and no such folder exists"));
  one("it reports rather than refuses — SOFT for one sitting", out, (g) => /SOFT\s+map/.test(g) && /0 RULE/.test(g));
}
{
  // The same file with the dead row removed: the check stays quiet.
  const root = repo({
    "CONCEPT.md": "# c\n",
    "docs/04-capabilities/README.md":
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`") +
      "\n<!-- spn:generated map — do not edit inside these markers; `docs.ts face` writes it -->\n" +
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
    "docs/04-capabilities/README.md":
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`") +
      "\n<!-- spn:generated map — do not edit inside these markers; `docs.ts face` writes it -->\n" +
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
    "docs/04-capabilities/README.md":
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" },
          "| Register | Governs | Status |\n| --- | --- | --- |\n" +
          "| [glossary.md](glossary.md) | auth/data policies with merged effective reads | ✅ |\n",
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
  const rep = run(root, ["audit", "--report", "."]);

  // THE MEASUREMENT IS A RETURN VALUE, NEVER A FILE (RD.DOCS.089). A report is written by the agent
  // from what it read; a tool hands over what it measured and writes nothing into a pocket. Before
  // this, the scan wrote the only machine-authored page in a folder of authored ones, and rewrote
  // it on every run whether anybody had asked a question or not.
  one("it writes nothing into the repository's pocket", absent(root, "docs/artifacts/reports/docs-audit.md"), true);
  one("the measurement comes back to the caller", rep, has("still carry a docs tree"));
  one("IT FIXES NOTHING IT MEASURES", readAt(root, "docs/03-behaviors/README.md"), before);
  one("a node still carrying a docs tree is a finding", rep, has("still carry a docs tree"));
  one("a domain with nothing written in it is a DOMAIN, not a group", rep, has("`01-core`"));
  one("what the concept lists is what the domain owes", rep, (g) => /\| `01-core` \| ✅ \| 0 \| 1 \|/.test(g));
  one("the arguments still in the pocket are listed", rep, has("a-approach.html"));
  one("a page with no block is counted", rep, has("block (RULE)"));
  one("--json hands the agent the same measurement as data",
    run(root, ["audit", "--report", ".", "--json"]), (g) => {
      try { const d = JSON.parse(g); return d.repo !== undefined && Array.isArray(d.seats) && d.measuredAt !== undefined; }
      catch { return false; }
    });

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
    const templates = resolve(import.meta.dirname, "..", "..", "..", "..",
                              "spn-foundation", "docs", "04-capabilities", "01-devex",
                              "04-workspace", "04-docs", "templates");
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
    // Every script of the template ships, in the template's order: the rail builder, the fold,
    // and whatever the template adds after them (the anchor links, once the templates carry them).
    const bookTemplate = readFileSync(resolve(templates, "pages", "construct-template.html"), "utf8");
    const more = mkdtempSync(join(tmpdir(), "spn-templates-"));
    mkdirSync(join(more, "pages"));
    writeFileSync(join(more, "pages", "construct-template.html"),
                  bookTemplate + "\n<script>/* a third script: the anchor links */</script>\n");
    process.env.SPN_TEMPLATES = more;
    run(ws, ["page", "docs/02-constructs/01-core/thing.md"]);
    const withThree = readAt(ws, "docs/artifacts/constructs/01-core/thing-construct.html");
    process.env.SPN_TEMPLATES = templates;
    one("a section head carries no number — a heading is a name", page, (g) => !/class="num"/.test(g));
    one("the page carries every script the template has, not the first two", withThree,
        (g) => [...g.matchAll(/<script>[\s\S]*?<\/script>/g)].length ===
               [...bookTemplate.matchAll(/<script>[\s\S]*?<\/script>/g)].length + 1);
    rmSync(more, { recursive: true, force: true });

    // A `\|` in a cell is a pipe the author wants shown. The splitter cut the cell in two and the
    // reader saw a five-column row in a three-column table (N13's sample, 2026-09-21). And a `####`
    // used to fall through to the paragraph path, hashes and all.
    writeFileSync(join(ws, "docs/02-constructs/01-core/thing.md"), seat("thing",
      "## Boundary\n\n#### A sub-part\n\n| a | b | c |\n| --- | --- | --- |\n| repos | `{org}-public\\|-private` | x |\n"));
    run(ws, ["page", "docs/02-constructs/01-core/thing.md"]);
    const page2 = readAt(ws, "docs/artifacts/constructs/01-core/thing-construct.html");
    one("an escaped pipe stays inside its cell", page2, has("<code>{org}-public|-private</code></td><td>x</td>"));
    one("a level-four heading is a heading, not a paragraph of hashes", page2, has('<h4 id="a-sub-part">A sub-part</h4>'));
    writeFileSync(join(ws, "docs/02-constructs/01-core/thing.md"), seat("thing",
      "## Boundary\n<!-- RESTATES: a chapter\n     never add a rule here -->\n\nvisible\n<!-- block: REASONS -->\n"));
    run(ws, ["page", "docs/02-constructs/01-core/thing.md"]);
    const page3 = readAt(ws, "docs/artifacts/constructs/01-core/thing-construct.html");
    one("an author's HTML comment never reaches the page", page3, (g) => !/RESTATES|block: REASONS/.test(g) && /<p>visible<\/p>/.test(g));
    writeFileSync(join(ws, "docs/02-constructs/01-core/thing.md"), seat("thing",
      "The promise, in one line.\n\nThe summary paragraph.\n\n## Boundary\n\nx\n"));
    run(ws, ["page", "docs/02-constructs/01-core/thing.md"]);
    const page4 = readAt(ws, "docs/artifacts/constructs/01-core/thing-construct.html");
    one("the first lead paragraph is the standfirst, the rest are the summary", page4, (g) => /<p class="standfirst">The promise, in one line\.<\/p>\s*<p>The summary paragraph\.<\/p>/.test(g));

    // A NUMBERED LIST IS A LIST. There was no case for `1.`, so it fell through to the paragraph path
    // and the reader met one run-on paragraph beginning with the characters `1.` — the order, which is
    // the whole content of such a passage, was gone. Found on the Sign-in construct, whose four
    // organization checks run in a fixed order (N13, 2026-09-22). The bullet case is asserted beside
    // it because the two patterns sit next to each other and must not eat one another.
    writeFileSync(join(ws, "docs/02-constructs/01-core/thing.md"), seat("thing",
      "## Boundary\n\n1. **First** the step that comes first.\n2. **Then** the next one.\n3) A closing paren is a list too.\n\n- a bullet after it\n- another\n"));
    run(ws, ["page", "docs/02-constructs/01-core/thing.md"]);
    const page5 = readAt(ws, "docs/artifacts/constructs/01-core/thing-construct.html");
    one("a numbered list is an ordered list, not a paragraph of digits", page5,
        (g) => /<ol>[\s\S]*<li><strong>First<\/strong> the step that comes first\.<\/li>[\s\S]*<\/ol>/.test(g));
    one("every item of it is in the list, `)` included", page5,
        (g) => (g.match(/<ol>[\s\S]*?<\/ol>/)?.[0].match(/<li>/g) ?? []).length === 3);
    one("no numbered item leaks into a paragraph", page5, (g) => !/<p>\s*\d+[.)]\s/.test(g));
    one("a bullet list beside it is still a bullet list", page5,
        (g) => /<ul>\s*<li>a bullet after it<\/li>/.test(g));
    delete process.env.SPN_TEMPLATES;
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
        `## Overview\n\nWhy it exists.\n\n## Terms\n\n| Term | Contract term | What it means |\n| --- | --- | --- |\n| Rung | \`SPRungType\` | how much is real |\n\n## Model\n\nThe model.\n\n## Parts\n\n${body}\n\n## Boundary\n\nIt stops here.\n\n## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| \`RD.GOV.011\` | that a closed vocabulary is stated once | MUST |\n\n| Repo | Node | What it realizes | State |\n| --- | --- | --- | --- |\n| t | thing-ts | the enum | planned |\n\n## Proof\n\nNothing yet.\n`,
        "`For: Architect` · `Status: 🔮 PLANNING`");

  const AGREES = "```ts\nexport enum SPRungType {\n  UNIT = 'UNIT',    // alone\n  WIRED = 'WIRED',  // against the real thing\n}\n```";
  const SOURCE = "export enum SPRungType {\n  UNIT = 'UNIT',\n  WIRED = 'WIRED',\n}\n";

  {
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "packages/thing-ts/src/rungs.ts": SOURCE,
      "docs/02-constructs/01-core/rungs.md": chapter("Rungs", "rungs", AGREES),
    });
    one("a declaration that matches the code it realizes is reported nowhere",
      run(root, ["audit", "docs/02-constructs/01-core/rungs.md"]), lacks("vocabulary"));
  }

  {
    // The book ahead of the code. This is the normal way a standard leads, so the MESSAGE has to
    // name both sides rather than assert which one is wrong.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "packages/thing-ts/src/rungs.ts": SOURCE,
      "docs/02-constructs/01-core/rungs.md": chapter("Rungs", "rungs",
        "```ts\nexport enum SPRungType {\n  UNIT = 'UNIT',      // alone\n  WIRED = 'WIRED',    // against the real thing\n  BROWSED = 'BROWSED',// in a real browser\n}\n```"),
    });
    const got = run(root, ["audit", "docs/02-constructs/01-core/rungs.md"]);
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
      "docs/02-constructs/01-core/rungs.md": chapter("Rungs", "rungs", AGREES),
    });
    one("a member the code carries and the book omits is reported",
      run(root, ["audit", "docs/02-constructs/01-core/rungs.md"]), has("does not name BROWSED"));
  }

  {
    // A COMPACT DECLARATION, AND THE NEIGHBOUR BELOW IT. The first reading of this closed a body at
    // the first line-start `}`, which a one-line enum does not have — so the match ran into the
    // next enum and reported its members as this one's. The corpus finding it produced was
    // confident, precise and wrong about a chapter that was correct.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "packages/thing-ts/src/rungs.ts": "export enum SPRungType { UNIT = 'UNIT' }\nexport enum SPOther {\n  ADM = 'ADM',\n  MIG = 'MIG',\n}\n",
      "docs/02-constructs/01-core/rungs.md": chapter("Rungs", "rungs",
        "```ts\nexport enum SPRungType { UNIT = 'UNIT' }  // alone\n\nexport enum SPOther {\n  ADM = 'ADM',  // administer\n  MIG = 'MIG',  // migrate\n}\n```"),
    });
    const got = run(root, ["audit", "docs/02-constructs/01-core/rungs.md"]);
    one("a one-line enum does not swallow the enum after it", got, lacks("vocabulary"));
    one("and neither is accused of carrying the other's members", got, lacks("ADM"));
  }

  {
    // A value nothing realizes is the normal state of a standard, and reporting it would make the
    // book unable to lead anything.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "docs/02-constructs/01-core/rungs.md": chapter("Rungs", "rungs", AGREES),
    });
    one("a value no source realizes yet is reported nowhere",
      run(root, ["audit", "docs/02-constructs/01-core/rungs.md"]), lacks("vocabulary"));
  }

  {
    // The other half of the rule: ONE place. Two chapters declaring one value is two answers that
    // drift, which is what the rule exists to prevent.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "docs/02-constructs/01-core/rungs.md": chapter("Rungs", "rungs", AGREES),
      "docs/02-constructs/01-core/again.md": chapter("Again", "again", AGREES),
    });
    one("one value declared in two chapters is reported",
      run(root, ["audit", "docs/02-constructs/01-core/rungs.md", "docs/02-constructs/01-core/again.md"]),
      has("is declared in 2 chapters"));
  }

  {
    // Named in Terms, declared nowhere — the state 51 chapters were in when this was written.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "docs/02-constructs/01-core/rungs.md": chapter("Rungs", "rungs", "No declaration here.\n"),
      "docs/02-constructs/01-core/other.md": chapter("Other", "other", "Nor here.\n"),
    });
    one("a contract term no chapter declares is reported",
      run(root, ["audit", "docs/02-constructs/01-core/rungs.md", "docs/02-constructs/01-core/other.md"]),
      has("`SPRungType` is named as a contract term and no chapter declares"));
  }

  {
    // A MEMBER REFERENCE NAMES ITS TYPE. `SPDocPassType.FRAME` claims the type exists exactly as the
    // bare name does, and reading only the bare form missed three of the four stale contract terms
    // found the day this check was written — each naming a vocabulary the contract had deleted.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "docs/02-constructs/01-core/rungs.md":
        doc({ id: "rungs", parentId: "concept", title: "Rungs", variant: "construct", lenses: ["ARCHITECT"],
              status: "PLANNING", dependsOn: [] },
            "## Overview\n\nWhy it exists.\n\n## Terms\n\n| Term | Contract term | What it means |\n| --- | --- | --- |\n| Alone | `SPRungType.UNIT` | proven with nothing running |\n\n## Model\n\nThe model.\n\n## Parts\n\nNo declaration here.\n\n## Boundary\n\nIt stops here.\n\n## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| `RD.GOV.011` | one place | MUST |\n\n| Repo | Node | What it realizes | State |\n| --- | --- | --- | --- |\n| t | thing-ts | the enum | planned |\n\n## Proof\n\nNothing yet.\n",
            "`For: Architect` · `Status: 🔮 PLANNING`"),
      "docs/02-constructs/01-core/other.md": chapter("Other", "other", "Nor here.\n"),
    });
    one("a member reference names its type, and an undeclared one is reported",
      run(root, ["audit", "docs/02-constructs/01-core/rungs.md", "docs/02-constructs/01-core/other.md"]),
      has("`SPRungType` is named as a contract term"));
  }

  {
    // One page cannot see the corpus, so it must not accuse another chapter of not existing.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "docs/02-constructs/01-core/rungs.md": chapter("Rungs", "rungs", "No declaration here.\n"),
    });
    one("one page audited alone never claims a value is undeclared",
      run(root, ["audit", "docs/02-constructs/01-core/rungs.md"]), lacks("no chapter declares"));
  }

  {
    // A grade, not a refusal. A new check that refuses is a check people satisfy by editing the
    // page to match the tool.
    const root = repo({
      "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
      "packages/thing-ts/src/rungs.ts": SOURCE,
      "docs/02-constructs/01-core/rungs.md": chapter("Rungs", "rungs",
        "```ts\nexport enum SPRungType {\n  UNIT = 'UNIT',  // alone\n}\n```"),
    });
    const got = run(root, ["audit", "docs/02-constructs/01-core/rungs.md"]);
    one("a disagreement reports rather than refuses", got, has("SOFT vocabulary"));
    one("and it is counted among the soft findings", got, has("0 RULE, 1 SOFT"));
  }
}


console.log("\n=== the rail names the page, and the way back names where it goes (Q238, Q239)");
{
  const templates = resolve(import.meta.dirname, "..", "..", "..", "..",
                            "spn-foundation", "docs", "04-capabilities", "01-devex",
                            "04-workspace", "04-docs", "templates");
  process.env.SPN_TEMPLATES = templates;
  const seat = (id, title) => doc(
    { id, variant: "construct", parentId: "core", title, lenses: ["ARCHITECT"],
      status: "PLANNING", dependsOn: [] },
    "## Boundary\n\nx\n", "`For: Architect` · `Status: 🔮 PLANNING`");

  // A DOMAIN AND ITS OVERVIEW JOIN ON THEIR TITLE AND NOTHING ELSE. The overview's file name
  // carries the area in one repository and not in another, so no path can be computed. Here the
  // face and the overview both say `Core` and the file is named for neither, which is what makes
  // the join the only thing under test.
  const ws = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    "docs/02-constructs/README.md": doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/README.md": doc({ id: "core", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/thing.md": seat("thing", "The Thing Itself"),
    "docs/artifacts/overviews/concept-anything-at-all-overview.html":
      '<!-- spn:doc\n{"id":"ov","variant":"overview","title":"Core","lenses":["ARCHITECT"],"summary":"s"}\n-->\n<h1>x</h1>\n',
  });
  run(ws, ["page", "docs/02-constructs/01-core/thing.md"]);
  const page = readAt(ws, "docs/artifacts/constructs/01-core/thing-construct.html");

  one("the rail carries the page's own name, not the word Outline",
    page, has('<div class="rail-title">The Thing Itself</div>'));
  one("and never the word it replaced", page, lacks('<div class="rail-title">Outline</div>'));
  one("the way back reaches the domain's overview, found by its title alone",
    page, has('href="../../overviews/concept-anything-at-all-overview.html"'));
  one("and it names the domain rather than a category", page, has("&larr; Core"));
  one("so the old category label is gone", page, lacks("&larr; the model"));
}

{
  // NO OVERVIEW, NO GUESS. Nine domains have no overview today, and a link that names a page which
  // is not there is worse than the category label it replaced.
  const templates = resolve(import.meta.dirname, "..", "..", "..", "..",
                            "spn-foundation", "docs", "04-capabilities", "01-devex",
                            "04-workspace", "04-docs", "templates");
  process.env.SPN_TEMPLATES = templates;
  const ws = repo({
    "docs/02-constructs/README.md": doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/README.md": doc({ id: "core", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/thing.md": doc(
      { id: "thing", variant: "construct", parentId: "core", title: "Thing", lenses: ["ARCHITECT"],
        status: "PLANNING", dependsOn: [] },
      "## Boundary\n\nx\n", "`For: Architect` · `Status: 🔮 PLANNING`"),
  });
  run(ws, ["page", "docs/02-constructs/01-core/thing.md"]);
  const page = readAt(ws, "docs/artifacts/constructs/01-core/thing-construct.html");
  one("with no overview above it the constructs face stands, rather than a link to nothing",
    page, has("&larr; the model"));
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
    "docs/02-constructs/README.md": doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/README.md": doc({ id: "core", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/01-beta.md": seat("beta", "Beta", ["gamma"]),
    "docs/02-constructs/01-core/02-gamma.md": seat("gamma", "Gamma", []),
    "docs/artifacts/overviews/concept-core-overview.html":
      `<meta charset="utf-8">\n<title>Core</title>\n` +
      block({ id: "o", variant: "overview", parentId: "concept", title: "Core", lenses: ["ARCHITECT"], summary: "s." }) +
      sections.map((h) => `<h2>${h}</h2>\n<p>x</p>`).join("\n"),
  });
  const audit = (secs) => run(repo(tree(secs)), ["audit", "docs/artifacts/overviews/concept-core-overview.html"]);

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

console.log("\n=== the domain's glossary lands on its overview too, in HTML (Q226 A, Q231, Q234)");
{
  const terms = "## Terms\n\n| Term | Contract term | What it means |\n| --- | --- | --- |\n" +
    "| sign-in | `SPSession` | one person's live access |\n\n" +
    "## Model\n\nx\n\n## Parts\n\nx\n\n## Boundary\n\nx\n\n" +
    "## Binds\n\n| where it lives today | |\n| --- | --- |\n| a | b |\n\n## Proof\n\nx\n";
  const ov = (inner) =>
    `<meta charset="utf-8">\n<title>Core</title>\n` +
    block({ id: "o", variant: "overview", parentId: "concept", title: "Core", lenses: ["ARCHITECT"], summary: "s." }) +
    `<h2>Overview</h2>\n<p>x</p>\n` +
    `<section id="s1" data-block="glossary">\n  <div class="sec-head"><h2>Glossary</h2></div>\n` +
    `  <p>The authored line above the table.</p>\n${inner}\n</section>\n` +
    `<h2>Where to go next</h2>\n<p>x</p>`;
  const curated = '  <div class="scroll"><table>\n    <thead><tr><th>Term</th><th>What it means</th></tr></thead>\n' +
    '    <tbody><tr><td>sign-in</td><td>typed by hand</td></tr></tbody>\n  </table></div>';
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    "docs/02-constructs/README.md": doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/README.md": doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/session.md":
      doc({ id: "session", variant: "construct", parentId: "c", dependsOn: [], title: "Session", lenses: ["ARCHITECT"], status: "PLANNING" },
          terms, "`For: Architect` · `Status: 🔮 PLANNING`"),
    "docs/artifacts/overviews/concept-core-overview.html": ov(curated),
  });
  run(root, ["face", "docs"]);
  const page = readAt(root, "docs/artifacts/overviews/concept-core-overview.html");

  one("the overview gains a generated region, the first in any HTML page",
    page, has("spn:generated glossary"));
  one("and it carries the three columns the markdown face carries",
    page, has("<th>Term</th><th>Contract term</th><th>What it means</th>"));
  one("the term links to the construct PAGE, never the markdown seat (Q234)",
    page, has('href="../constructs/01-core/session-construct.html"'));
  one("the hand-typed row is gone, because the region replaced the table",
    page, lacks("typed by hand"));
  one("the authored line above the table survives (Q231)",
    page, has("The authored line above the table"));
  one("the markers sit INSIDE the section, not after the page",
    page, (g) => g.indexOf("spn:generated glossary") < g.indexOf("Where to go next"));

  // A REGION IS ONLY TRUSTWORTHY IF A SECOND RUN WRITES THE SAME BYTES. The first run replaces a
  // curated table; the second has to find its own markers and land on the same page exactly.
  const again = (() => { run(root, ["face", "docs"]); return readAt(root, "docs/artifacts/overviews/concept-core-overview.html"); })();
  one("and a second run writes the same bytes", again === page ? "same" : "DIFFERENT", has("same"));
}

console.log("\n=== an HTML page links the HTML page, never the markdown seat (Q234)");
{
  const page = (href) =>
    `<meta charset="utf-8">\n<title>T</title>\n` +
    block({ id: "o", variant: "overview", parentId: "concept", title: "T", lenses: ["ARCHITECT"], summary: "s." }) +
    `<h2>Overview</h2>\n<p>See <a href="${href}">it</a>.</p>\n<h2>Glossary</h2>\n<p>x</p>\n<h2>Where to go next</h2>\n<p>x</p>`;
  const mk = (href) => repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    "docs/02-constructs/01-core/thing.md": "# Thing\n",
    "docs/artifacts/overviews/o.html": page(href),
  });
  one("a link to a construct SEAT is refused, and it names the page it should have used",
    run(mk("../../02-constructs/01-core/thing.md"), ["audit", "docs/artifacts/overviews/o.html"]),
    has("thing-construct.html"));
  one("a link to the produced page is silent",
    run(mk("../constructs/01-core/thing-construct.html"), ["audit", "docs/artifacts/overviews/o.html"]),
    lacks("an HTML page links the HTML page"));
  // A SEAT README IS PRODUCED AS NO PAGE AT ALL, so a link to one has nowhere else to go. Refusing
  // it would be a gate demanding a file the generator never writes.
  one("a link to a seat README keeps its .md, because no page exists for it",
    run(mk("../../02-constructs/README.md"), ["audit", "docs/artifacts/overviews/o.html"]),
    lacks("an HTML page links the HTML page"));
}

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
