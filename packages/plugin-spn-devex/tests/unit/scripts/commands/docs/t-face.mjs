import { PLUGIN } from "../../../../helpers/harness.mjs";
// `docs face` — the generated surface: the faces, the grouping, and the tag line.
//
// THIS SUITE EXISTS BECAUSE THE TOOL WRITES INTO EVERY DOCUMENT IN THE CORPUS. `face` renders each
// file's tag line from its own metadata block, so a regex that is one character wrong edits eight
// hundred files at once. Nothing here is a port, so the fixtures are the whole proof.
//
// Each case builds a throwaway tree, runs the real command against it (through the same `cli.ts`
// dispatcher `spn-devex docs face` runs through), and reads what changed on disk rather than what
// the command printed — a tool that reports a write it did not make, and one that makes a write it
// did not report, both have to fail.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { ARTIFACT, CONSTRUCT_PAGES, POCKET, SEAT, TEMPLATES } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { OWN_COPY, linesFor } from "../../../../../../plugin-support-lib/src/lib/page-styles.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-face-"));
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

/** `args` is what follows the group — `["face", "write", "docs"]` — run through `cli.ts docs <args>`. A refusal's text is handed back with the rest. */
function run(root, args) {
  try {
    return execFileSync(process.execPath, [TOOL, "docs", ...args],
      { encoding: "utf8", cwd: root, stdio: "pipe", env: { ...process.env, SPN_WORKSPACE: root } });
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
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Dictionary", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/README.md`]: doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    // What the whole corpus carried: the old label, and a status word that is not the enum's.
    [`docs/${SEAT.behaviors}/README.md`]:
      doc({ id: "b", title: "Behaviors", lenses: ["SERVER_DEV", "QA"], status: "DONE" },
          "Prose under it.\n", "`Lenses: DevOps · everyone` · `Status: ✅ Implemented`"),
  });
  run(root, ["face", "write", "docs"]);
  const got = readAt(root, `docs/${SEAT.behaviors}/README.md`);
  one("the label becomes For: and the actors come from the block",
    got, has("`For: Backend developer · Quality engineer`"));
  one("the status chip carries the enum word, not a synonym", got, has("`Status: ✅ DONE`"));
  one("the blank line between the tag line and the lead paragraph survives",
    got, has("`Status: ✅ DONE`\n\nProse under it."));

  const before = readAt(root, `docs/${SEAT.behaviors}/README.md`);
  run(root, ["face", "write", "docs"]);
  one("running it twice writes the same bytes", readAt(root, `docs/${SEAT.behaviors}/README.md`), before);
}

{
  const root = repo({
    "CONCEPT.md": "# c\n",
    [`docs/${SEAT.behaviors}/README.md`]:
      doc({ id: "b", title: "Behaviors", lenses: ["QA"], status: "DONE" }, "Lead.\n"),
  });
  run(root, ["face", "write", "docs"]);
  one("a document with no tag line gets one under its title",
    readAt(root, `docs/${SEAT.behaviors}/README.md`),
    has(`# Behaviors\n\n\`For: Quality engineer\` · \`Status: ✅ DONE\`\n\nLead.`));
}

{
  // A chapter that teaches the document shape SHOWS one. Its example is content, not a tag line.
  const root = repo({
    "CONCEPT.md": "# c\n",
    [`docs/${SEAT.behaviors}/README.md`]:
      doc({ id: "b", title: "Behaviors", lenses: ["QA"], status: "DONE" },
          "Lead.\n\n```text\n# An Example\n\n`For: Architect` · `Status: 🔮 PLANNING`\n```\n",
          "`For: Quality engineer` · `Status: ✅ DONE`"),
  });
  run(root, ["face", "write", "docs"]);
  const got = readAt(root, `docs/${SEAT.behaviors}/README.md`);
  one("a tag line inside a fence is content and is left alone", got, has("`For: Architect` · `Status: 🔮 PLANNING`"));
  one("the real tag line is still the block's", got, has("`For: Quality engineer` · `Status: ✅ DONE`"));
}


// ------------------------------------------- a domain face maps everything below it

console.log("\n=== a domain face maps a construct nested under a level, not just its direct children");
// A FACE RECURSES, AND THAT IS ITS JOB. The concept carried the same list a second time until MD10
// dropped it — one source with two generated homes — so this is now the only place the walk's
// recursion is asserted.
{
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/README.md`]: doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/loose.md`]:
      doc({ id: "loose", variant: "construct", parentId: "c", dependsOn: [], title: "Loose", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/01-level/README.md`]: doc({ id: "lv", title: "Level", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/01-level/nested.md`]:
      doc({ id: "nested", variant: "construct", parentId: "c", dependsOn: [], title: "Nested", lenses: ["ARCHITECT"], status: "PLANNING" }),
  });
  run(root, ["face", "write", "docs"]);
  one("the DOMAIN's face maps everything below it, nested included",
    readAt(root, `docs/${SEAT.constructs}/01-core/README.md`), has("[Nested]"));
}


// ---------------------------------------------------------------- a block inside a fence is an example

console.log("\n=== face writes no tag line for a chapter that only TEACHES the metadata block");
// THE WRITER WAS ONE RUN FROM EDITING THE ILLUSTRATION A RULE IS TAUGHT BY. readBlock took the
// first `spn:doc` anywhere, so a document showing an example block appeared to declare itself, and
// `face` rendered a tag line FOR THE EXAMPLE and wrote it into the file. That is exactly what
// happened to a rules file carrying no block of its own — the audit half of this same fixture (the
// example's block is not read as the document's own) lives in t-audit.mjs.
{
  const teaches = "<!-- spn:restates\n{}\n-->\n\n# How A Block Is Written\n\n" +
    "Every document opens with one:\n\n```markdown\n" +
    block({ id: "an-example", title: "Human Title", lenses: ["ARCHITECT"], status: "DONE", summary: "s." }) +
    "\n# Human Title\n```\n";
  const root = repo({ "CONCEPT.md": "# c\n", "docs/teaches.md": teaches });
  const before = readAt(root, "docs/teaches.md");
  run(root, ["face", "write", "docs"]);
  one("and `face` writes no tag line into it — the file is untouched",
    readAt(root, "docs/teaches.md"), before);
}
// ---------------------------------------------------------------- the grouping

console.log("\n=== a repository may group its domains by stage");
const GROUPED = {
  // The concept names the groups at `##` and the domains inside them at `###`.
  "CONCEPT.md": "# c\n\n## SaaS Plane — Foundation   `REALIZED`\n\nWhat this stage realizes.\n\n" +
                "### DevEx\n\nHow the function operates.\n\n### Docs\n\nHow the corpus is written.\n",
  [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
  [`docs/${SEAT.constructs}/01-foundation/README.md`]: doc({ id: "g", title: "Foundation", lenses: ["ARCHITECT"], status: "PLANNING" }),
  [`docs/${SEAT.constructs}/01-foundation/01-devex/README.md`]: doc({ id: "dv", title: "DevEx", lenses: ["ARCHITECT"], status: "PLANNING" }),
  [`docs/${SEAT.constructs}/01-foundation/02-docs/README.md`]: doc({ id: "dc", title: "Docs", lenses: ["ARCHITECT"], status: "PLANNING" }),
  [`docs/${SEAT.constructs}/01-foundation/01-devex/agent.md`]:
    doc({ id: "agent", variant: "construct", parentId: "c", dependsOn: [], title: "The Agent", lenses: ["ARCHITECT"], status: "PLANNING" }),
};
{
  const root = repo(GROUPED);
  const out = run(root, ["face", "write", "docs"]);
  one("a group two levels up still gets a face", out, has(`${SEAT.constructs}/01-foundation/README.md`));
  one("and so does each domain under it", out, has(`${SEAT.constructs}/01-foundation/01-devex/README.md`));
  one("the group's face maps its domains, read from the concept's own sections",
    readAt(root, `docs/${SEAT.constructs}/01-foundation/README.md`), has("| [devex](01-devex/README.md) |"));
  one("the group's bridge is the concept's, not invented",
    readAt(root, `docs/${SEAT.constructs}/01-foundation/README.md`), has("What this stage realizes."));
  one("a domain's face lists its constructs",
    readAt(root, `docs/${SEAT.constructs}/01-foundation/01-devex/README.md`), has("[The Agent](agent.md)"));
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
  run(root, ["face", "write", "docs"]);
  const face = readAt(root, `docs/${SEAT.constructs}/01-foundation/02-docs/README.md`);
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
      `How the function operates, argued in [the page](docs/${POCKET.artifacts}/${ARTIFACT.reports}/a.html).`),
    [`docs/${POCKET.artifacts}/${ARTIFACT.reports}/a.html`]: "<p>x</p>\n" });
  run(root, ["face", "write", "docs"]);
  one("a link inside a copied bridge is re-based onto the face that now carries it",
    readAt(root, `docs/${SEAT.constructs}/01-foundation/01-devex/README.md`),
    has(`](../../../${POCKET.artifacts}/${ARTIFACT.reports}/a.html)`));
}
{
  const root = repo({ ...GROUPED,
    [`docs/${SEAT.constructs}/01-foundation/03-nobody-declared/README.md`]:
      doc({ id: "x", title: "Nobody", lenses: ["ARCHITECT"], status: "PLANNING" }) });
  one("a domain folder the concept does not name is invariant 1's finding",
    run(root, ["face", "check", "docs"]), has("invariant 1"));
}


console.log("\n=== a concept may name its domains in a table");
{
  // The document chapter's format rule is *prefer a table over a prose list of parallel facts*, and
  // one line per domain is exactly that. Two of the three stack concepts name every domain this way.
  const root = repo({
    "CONCEPT.md": "# c\n\n## What the stack ships\n\n| Capability | Package |\n| --- | --- |\n" +
                  "| Contract | `@x/contract` |\n| Design system | `@x/ds` |\n",
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-contract/README.md`]: doc({ id: "c1", title: "Contract", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/06-design-system/README.md`]: doc({ id: "c2", title: "DS", lenses: ["WEB_DEV"], status: "PLANNING" }),
  });
  const out = run(root, ["face", "check", "docs"]);
  one("a domain named only by a table row satisfies invariant 1", out, lacks("invariant 1"));
  run(root, ["face", "write", "docs"]);
  one("and the row's remaining cells become the face's bridge",
    readAt(root, `docs/${SEAT.constructs}/01-contract/README.md`), has("@x/contract"));
  one("a multi-word domain matches its folder — `Design system` is `06-design-system`",
    readAt(root, `docs/${SEAT.constructs}/06-design-system/README.md`), has("@x/ds"));
}
{
  const root = repo({
    "CONCEPT.md": "# c\n\n## What the stack ships\n\n| Capability | Package |\n| --- | --- |\n| Contract | `@x/contract` |\n",
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/07-nobody-declared/README.md`]: doc({ id: "n", title: "N", lenses: ["ARCHITECT"], status: "PLANNING" }),
  });
  one("a domain no row and no heading names is still invariant 1's finding",
    run(root, ["face", "check", "docs"]), has("invariant 1"));
}


// ---------------------------------------------------------------- what is never walked

console.log(`\n=== a seat's \`${TEMPLATES}/\` is excluded by the folder, never per file`);
{
  const root = repo({
    "CONCEPT.md": "# c\n",
    [`docs/${SEAT.capabilities}/01-x/01-server/README.md`]:
      doc({ id: "f", title: "Face", lenses: ["SERVER_DEV"], status: "DONE" }, "Lead.\n",
          "`For: Backend developer` · `Status: ✅ DONE`"),
    [`docs/${SEAT.capabilities}/01-x/01-server/app.md`]:
      doc({ id: "m", title: "App", lenses: ["SERVER_DEV"], status: "DONE" }, "Lead.\n",
          "`For: Backend developer` · `Status: ✅ DONE`"),
    // A template's block carries placeholders and it is a mirror of nothing.
    [`docs/${SEAT.capabilities}/01-x/01-server/${TEMPLATES}/a-template.md`]: "# {{NAME}}\n\nno block here.\n",
  });
  const out = run(root, ["face", "write", "docs"]);
  one("a template is never taken for a mirror", out, lacks("a-template.md"));
  one("the real mirror still reaches the Map",
    readAt(root, `docs/${SEAT.capabilities}/01-x/01-server/README.md`), has("| [app.md](app.md) |"));
  one("a template's own tag line is never written",
    readAt(root, `docs/${SEAT.capabilities}/01-x/01-server/${TEMPLATES}/a-template.md`), "# {{NAME}}\n\nno block here.\n");
}


// ---------------------------------------------------------------- the authored seat

console.log("\n=== the dictionary is generated from the constructs, never typed (invariant 2)");
{
  // It is ONE DOMAIN's dictionary, on that domain's own face, in three columns. The fixture carries
  // a `data-model.md` on purpose: nothing it says may reach a dictionary row, because the column
  // that read it is gone.
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/README.md`]: doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/session.md`]:
      doc({ id: "session", variant: "construct", parentId: "c", dependsOn: [], title: "Session", lenses: ["ARCHITECT"], status: "PLANNING" },
          "## Terms\n\n| Term | Contract term | What it means here |\n| --- | --- | --- |\n" +
          "| sign-in | `SPSession` | one person's live access to one app site |\n" +
          "| device | `SPDevice` | the client a session was opened from |\n\n" +
          "## Model\n\nx\n\n## Parts\n\nx\n\n## Boundary\n\nx\n\n" +
          "## Binds\n\n| where it lives today | |\n| --- | --- |\n| a | b |\n\n## Proof\n\nx\n",
          "`For: Architect` · `Status: 🔮 PLANNING`"),
    [`docs/${SEAT.capabilities}/01-core/01-server/data-model.md`]:
      doc({ id: "dm", title: "Contract Terms", lenses: ["SERVER_DEV"], status: "DONE" },
          "| Table | Terms | Constraint |\n| --- | --- | --- |\n" +
          "| `sp_session` | `SPSession` | one row per live access |\n",
          "`For: Backend developer` · `Status: ✅ DONE`"),
  });
  run(root, ["face", "write", "docs"]);
  const domain = readAt(root, `docs/${SEAT.constructs}/01-core/README.md`);
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
    readAt(root, `docs/${SEAT.constructs}/README.md`), lacks("sign-in"));
}
{
  // THE REGION THE OLD SHAPE LEFT BEHIND. A generated region nothing regenerates goes stale rather
  // than standing still, so the run takes it off the seat face instead of writing past it.
  const stale =
    "<!-- spn:generated glossary — do not edit inside these markers; `docs.ts face` writes it -->\n" +
    "| Term | Contract term | Where it is stored | From |\n| --- | --- | --- | --- |\n" +
    "| sign-in | `SPSession` | `${APP}_JOB_SCHEDULER_PROVIDER` | Session |\n" +
    "<!-- /spn:generated -->\n";
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    [`docs/${SEAT.constructs}/README.md`]:
      doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }, "Some prose.\n\n" + stale),
    [`docs/${SEAT.constructs}/01-core/README.md`]: doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
  });
  const out = run(root, ["face", "write", "docs"]);
  const seat = readAt(root, `docs/${SEAT.constructs}/README.md`);
  one("a dictionary left on a seat face by the old shape is removed", seat, lacks("Where it is stored"));
  one("and the markers go with it, so nothing invites an edit inside a region nobody writes",
    seat, lacks("spn:generated dictionary"));
  one("the author's own prose around it is untouched", seat, has("Some prose."));
  one("and the run reports the file it rewrote", out, has(`${SEAT.constructs}/README.md`));
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
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/README.md`]: doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/01-alpha.md`]:
      doc({ id: "alpha", variant: "construct", parentId: "c", dependsOn: ["zebra"], title: "Alpha", lenses: ["ARCHITECT"], status: "PLANNING" },
          terms("apple"), "`For: Architect` · `Status: 🔮 PLANNING`"),
    [`docs/${SEAT.constructs}/01-core/02-zebra.md`]:
      doc({ id: "zebra", variant: "construct", parentId: "c", dependsOn: [], title: "Zebra", lenses: ["ARCHITECT"], status: "PLANNING" },
          terms("banana"), "`For: Architect` · `Status: 🔮 PLANNING`"),
  });
  run(root, ["face", "write", "docs"]);
  const domain = readAt(root, `docs/${SEAT.constructs}/01-core/README.md`);
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
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/README.md`]: doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/session.md`]:
      doc({ id: "session", variant: "construct", parentId: "c", dependsOn: [], title: "Session", lenses: ["ARCHITECT"], status: "PLANNING" },
          "## Terms\n\n| Term | Contract term |\n| --- | --- |\n| sign-in | `SPSession` |\n",
          "`For: Architect` · `Status: 🔮 PLANNING`"),
  });
  one("a two-column Terms table cannot be generated from, and says so",
    run(root, ["face", "check", "docs"]), has("two columns"));
}


console.log("\n=== a Map is a list of mirrors, so an authored seat has none");
{
  const files = {
    "CONCEPT.md": "# c\n",
    [`docs/${SEAT.capabilities}/README.md`]:
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
    [`docs/${SEAT.capabilities}/01-chapter.md`]:
      doc({ id: "ch", title: "A Chapter", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
  };
  const derived = repo(files);
  run(derived, ["face", "write", "docs"]);
  one("where the seat is derived from source, the face carries a Contents table",
    readAt(derived, `docs/${SEAT.capabilities}/README.md`), has("spn:generated contents"));

  const authored = repo(files, { type: "FOUNDATION" });
  run(authored, ["face", "write", "docs"]);
  one("where the seat is AUTHORED, no Contents table is invented — there is no src/ for a row to name",
    readAt(authored, `docs/${SEAT.capabilities}/README.md`), lacks("spn:generated contents"));
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
    [`docs/${SEAT.capabilities}/README.md`]:
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
    [`docs/${SEAT.capabilities}/01-core/README.md`]:
      doc({ id: "dm", title: "Core", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
    [`docs/${SEAT.capabilities}/01-core/01-server/README.md`]:
      doc({ id: "pk", title: "Server", lenses: ["SERVER_DEV"], status: "DONE" }, "Lead.\n",
          "`For: Backend developer` · `Status: ✅ DONE`"),
    [`docs/${SEAT.capabilities}/01-core/01-server/01-app.md`]:
      doc({ id: "ch", title: "App", lenses: ["SERVER_DEV"], status: "DONE" }, "Lead.\n",
          "`For: Backend developer` · `Status: ✅ DONE`"),
  });
  run(root, ["face", "write", "docs"]);
  const seat = readAt(root, `docs/${SEAT.capabilities}/README.md`);
  one("a chapter three levels down never reaches the seat's Map",
    seat, lacks("01-core/01-server/01-app"));
  one("and the seat says it carries no mirror rather than inventing one",
    seat, has("this layer carries no mirror yet"));
  one("the domain face between them says the same",
    readAt(root, `docs/${SEAT.capabilities}/01-core/README.md`), has("this layer carries no mirror yet"));
  one("the package face still lists the chapter — the chapter branch is unchanged",
    readAt(root, `docs/${SEAT.capabilities}/01-core/01-server/README.md`), has("| [01-app.md](01-app.md) |"));

  const before = seat;
  run(root, ["face", "write", "docs"]);
  one("running it twice writes the same bytes", readAt(root, `docs/${SEAT.capabilities}/README.md`), before);
}
{
  // A mirror that IS a direct child still reaches the Map, and is still named for its folder.
  const root = repo({
    "CONCEPT.md": "# c\n",
    [`docs/${SEAT.capabilities}/README.md`]:
      doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
    [`docs/${SEAT.capabilities}/app.md`]:
      doc({ id: "m", title: "App", lenses: ["ARCHITECT"], status: "DONE" }, "Lead.\n",
          "`For: Architect` · `Status: ✅ DONE`"),
  });
  run(root, ["face", "write", "docs"]);
  one("a direct `.md` child is a mirror and names the folder it governs",
    readAt(root, `docs/${SEAT.capabilities}/README.md`), has("| [app.md](app.md) | `src/app/` |"));
}


console.log("\n=== the domain's glossary lands on its overview too, in HTML (Q226 A, Q231, Q234)");
{
  const terms = "## Terms\n\n| Term | Contract term | What it means |\n| --- | --- | --- |\n" +
    "| sign-in | `SPSession` | one person's live access, as [the rule](../../registers/decisions.md#r1) and [the standard](https://example.com/s) say |\n\n" +
    "## Model\n\nx\n\n## Parts\n\nx\n\n## Boundary\n\nx\n\n" +
    "## Binds\n\n| where it lives today | |\n| --- | --- |\n| a | b |\n\n## Proof\n\nx\n";
  // An overview in the shared form by default: the line that links the shared stylesheet, and the
  // shared names. `own` gives the page its own copy of the styles and the names that copy used.
  const ov = (inner, { own = false } = {}) =>
    `<meta charset="utf-8">\n<title>Core</title>\n` +
    block({ id: "o", variant: "overview", parentId: "concept", title: "Core", lenses: ["ARCHITECT"], summary: "s." }) +
    (own ? "<style>.scroll{overflow:auto}</style>\n" : `${linesFor("1.0.0").stylesheet}\n`) +
    `<h2>Overview</h2>\n<p>x</p>\n` +
    `<section id="s1" data-block="glossary">\n  <div class="${own ? "sec-head" : "sds-section-head"}"><h2>Glossary</h2></div>\n` +
    `  <p>The authored line above the table.</p>\n${inner}\n</section>\n` +
    `<h2>Where to go next</h2>\n<p>x</p>`;
  const table = (scroll) => `  <div class="${scroll}"><table>\n    <thead><tr><th>Term</th><th>What it means</th></tr></thead>\n` +
    '    <tbody><tr><td>sign-in</td><td>typed by hand</td></tr></tbody>\n  </table></div>';
  const curated = table("sds-scroll");
  const tree = (overview) => ({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/README.md`]: doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }),
    [`docs/${SEAT.constructs}/01-core/session.md`]:
      doc({ id: "session", variant: "construct", parentId: "c", dependsOn: [], title: "Session", lenses: ["ARCHITECT"], status: "PLANNING" },
          terms, "`For: Architect` · `Status: 🔮 PLANNING`"),
    [`docs/${POCKET.artifacts}/${ARTIFACT.docs}/01-core/core-overview.html`]: overview,
  });
  const root = repo(tree(ov(curated)));
  run(root, ["face", "write", "docs"]);
  const page = readAt(root, `docs/${POCKET.artifacts}/${ARTIFACT.docs}/01-core/core-overview.html`);

  one("the overview gains a generated region, the first in any HTML page",
    page, has("spn:generated glossary"));
  one("and it carries the three columns the markdown face carries",
    page, has("<th>Term</th><th>Contract term</th><th>What it means</th>"));
  one("the term links to the construct PAGE, never the markdown seat (Q234)",
    page, has(`href="${CONSTRUCT_PAGES}/session-construct.html"`));
  // A term's meaning may hold a link, written for the seat file's folder. The overview sits in another
  // folder, so the link is an anchor whose address is expressed from the overview's own folder.
  one("a link in a term's meaning is an anchor, expressed from the overview's folder, with its fragment kept",
    page, has('<a href="../../../registers/decisions.md#r1">the rule</a>'));
  one("a hosted address in a term's meaning is kept as it is",
    page, has('<a href="https://example.com/s">the standard</a>'));
  one("and no markdown link is left as text in the page", page, lacks("](../../registers/"));
  one("the hand-typed row is gone, because the region replaced the table",
    page, lacks("typed by hand"));
  one("the authored line above the table survives (Q231)",
    page, has("The authored line above the table"));
  one("the markers sit INSIDE the section, not after the page",
    page, (g) => g.indexOf("spn:generated glossary") < g.indexOf("Where to go next"));

  // A REGION IS ONLY TRUSTWORTHY IF A SECOND RUN WRITES THE SAME BYTES. The first run replaces a
  // curated table; the second has to find its own markers and land on the same page exactly.
  const again = (() => { run(root, ["face", "write", "docs"]); return readAt(root, `docs/${POCKET.artifacts}/${ARTIFACT.docs}/01-core/core-overview.html`); })();
  one("and a second run writes the same bytes", again === page ? "same" : "DIFFERENT", has("same"));
  one("the glossary is written with the shared stylesheet's names", page,
    (g) => g.includes('<div class="sds-scroll"><table class="sds-glossary">') && g.includes('<tr class="sds-group">'));
  one("and with no class of its own making: every class in the region opens with `sds-`",
    page.slice(page.indexOf("spn:generated glossary")),
    (g) => [...g.matchAll(/class="([^"]+)"/g)].flatMap((found) => found[1].split(" ")).every((name) => name.startsWith("sds-")));

  // AN OVERVIEW THAT LINKS NO SHARED STYLESHEET HOLDS ITS OWN COPY, with the names that copy used.
  // The glossary is written with the shared names, so it is not written into such a page: the page
  // is named once, and its bytes stay as they are.
  const own = ov(table("scroll"), { own: true });
  const ownRoot = repo(tree(own));
  const said = run(ownRoot, ["face", "write", "docs"]);
  one("[MKT.SCRIPTS.108] `docs face` names an overview that holds its own copy once, as a RULE, with the text every command uses",
    said, (g) => (g.match(/✗ RULE styles/g) ?? []).length === 1 && g.includes(OWN_COPY) && !g.includes("SOFT styles"));
  const exitOf = (workspace) => {
    try { execFileSync(process.execPath, [TOOL, "docs", "face", "write", "docs"], { encoding: "utf8", cwd: workspace, stdio: "pipe", env: { ...process.env, SPN_WORKSPACE: workspace } }); return 0; }
    catch (error) { return error.status; }
  };
  one("[MKT.SCRIPTS.108] and `docs face` exits 1 on it, as on any RULE", exitOf(ownRoot), 1);
  one("untouched: `docs face` exits 0 on the same tree with the overview in the shared form", exitOf(root), 0);
  one("[MKT.SCRIPTS.108] and writes nothing into it",
    readAt(ownRoot, `docs/${POCKET.artifacts}/${ARTIFACT.docs}/01-core/core-overview.html`), own);
  one("[MKT.SCRIPTS.108] the markdown face beside it still gains its glossary, because a face is no page",
    readAt(ownRoot, `docs/${SEAT.constructs}/01-core/README.md`), has("spn:generated glossary"));
}

console.log("\n=== an escaped pipe inside a Terms cell stays one cell (found by the column check)");
{
  const root = repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n",
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"] }),
    [`docs/${SEAT.constructs}/01-core/README.md`]: doc({ id: "c", title: "Core", lenses: ["ARCHITECT"] }),
    [`docs/${SEAT.constructs}/01-core/hooks.md`]:
      doc({ id: "hooks", variant: "construct", dependsOn: [], title: "Hooks", lenses: ["ARCHITECT"] },
          "## Terms\n\n| Term | Contract term | What it means |\n| --- | --- | --- |\n" +
          "| the matcher | `Write\\|Edit` | the tool names an entry narrows to |\n"),
  });
  run(root, ["face", "write", "docs"]);
  const got = readAt(root, `docs/${SEAT.constructs}/01-core/README.md`);
  one("the contract term keeps its pipe and the meaning keeps its column",
    got, has("| [the matcher](hooks.md) | `Write\\|Edit` | the tool names an entry narrows to |"));
}

console.log("\n=== a package face's Map names chapters, never the realization files beside them");
{
  const root = repo({
    "CONCEPT.md": "# c\n",
    [`docs/${SEAT.capabilities}/01-core/module-web-core-ts/README.md`]:
      doc({ id: "pk", title: "Web", lenses: ["WEB_DEV"], status: "DONE" }, "Lead.\n", "`For: Web developer` · `Status: ✅ DONE`"),
    [`docs/${SEAT.capabilities}/01-core/module-web-core-ts/01-app.md`]:
      doc({ id: "ch", title: "App", lenses: ["WEB_DEV"], status: "DONE" }, "Lead.\n", "`For: Web developer` · `Status: ✅ DONE`"),
    [`docs/${SEAT.capabilities}/01-core/module-web-core-ts/surface-map.md`]:
      doc({ id: "sm", variant: "surface_map", title: "Surface Map", lenses: ["WEB_DEV"], status: "DONE" }, "x\n", "`For: Web developer` · `Status: ✅ DONE`"),
  });
  run(root, ["face", "write", "docs"]);
  const got = readAt(root, `docs/${SEAT.capabilities}/01-core/module-web-core-ts/README.md`);
  one("the chapter is in the Map", got, has("| [01-app.md](01-app.md) |"));
  one("the surface map is not a chapter", got, lacks("surface-map.md"));
}

// ---------------------------------------------------------------- the grammar: an action, a path, a block

/** The exit code of one run, typed after the group, from the folder given. */
const exitIn = (cwd, args) => {
  try { execFileSync(process.execPath, [TOOL, "docs", ...args], { encoding: "utf8", cwd, stdio: "pipe", env: { ...process.env, SPN_WORKSPACE: cwd } }); return 0; }
  catch (error) { return error.status; }
};
const USAGE = "usage: spn-devex docs face check [<path>] [--block glossary|constructs|contents|tags]\n" +
              "       spn-devex docs face write <path> [--block glossary|constructs|contents|tags]\n";

console.log("\n=== `docs face` needs its action as a word, and a `write` needs a path");
{
  // A stale tag line under the tree shows whether a run wrote.
  const stale = doc({ id: "a", title: "A", variant: "capability", lenses: ["ARCHITECT"], status: "PLANNING" }, "Some prose.\n", "`For: Architect` · `Status: ✅ DONE`");
  const root = repo({ "CONCEPT.md": "# c\n", [`docs/${SEAT.capabilities}/a.md`]: stale });
  const at = `docs/${SEAT.capabilities}/a.md`;

  one("[MKT.SCRIPTS.111] with no action the entry prints each usage line and says an action is owed",
    run(root, ["face"]), USAGE + "`docs face` needs an action.\n");
  one("[MKT.SCRIPTS.111] and exits 2", exitIn(root, ["face"]), 2);
  one("[MKT.SCRIPTS.111] a path where the action belongs is refused the same way, and `--check` is named as the action `check`",
    run(root, ["face", "docs", "--check"]), USAGE + "`docs face` needs an action. `--check` is the action `check`.\n");
  one("[MKT.SCRIPTS.111] with exit 2", exitIn(root, ["face", "docs", "--check"]), 2);
  one("[MKT.SCRIPTS.111] and a path alone, with no action before it, is refused with exit 2", exitIn(root, ["face", "docs"]), 2);
  one("[MKT.SCRIPTS.111] none of the refused runs wrote", readAt(root, at), stale);

  one("[MKT.SCRIPTS.87] [MKT.SCRIPTS.112] `write` with no path prints its usage line and says a path is owed",
    run(root, ["face", "write"]),
    "usage: spn-devex docs face write <path> [--block glossary|constructs|contents|tags]\n`docs face write` needs a path.\n");
  one("[MKT.SCRIPTS.87] [MKT.SCRIPTS.112] and exits 2", exitIn(root, ["face", "write"]), 2);
  one("[MKT.SCRIPTS.87] [MKT.SCRIPTS.112] and it wrote nothing under the folder it was run from", readAt(root, at), stale);

  one("[MKT.SCRIPTS.113] `check` with no path takes the repository the caller is in, from a folder inside it too",
    [run(root, ["face", "check"]), run(join(root, "docs", SEAT.capabilities), ["face", "check"])].map((said) => said.includes("would write 1 tag line")), (got) => got.every(Boolean));
  one("[MKT.SCRIPTS.113] and exits 0, because a stale region is reported and is no RULE finding", exitIn(root, ["face", "check"]), 0);
  one("[MKT.SCRIPTS.113] `check` writes nothing", readAt(root, at), stale);
  one("[MKT.SCRIPTS.113] where the caller is in no repository, `check` with no path says to name one",
    run(BASE, ["face", "check"]),
    "usage: spn-devex docs face check [<path>] [--block glossary|constructs|contents|tags]\n" +
    "`docs face check` needs a path here, because the folder it is run from is in no repository. Name a repository.\n");
  one("[MKT.SCRIPTS.113] with exit 2", exitIn(BASE, ["face", "check"]), 2);

  one("[MKT.SCRIPTS.115] a block outside the set is refused with the set",
    run(root, ["face", "write", "docs", "--block", "maps"]), has("takes `--block` from glossary · constructs · contents · tags, and `maps` is none of them."));
  one("[MKT.SCRIPTS.115] with exit 2", exitIn(root, ["face", "write", "docs", "--block", "maps"]), 2);
  one("an option the command does not take is refused with exit 2", exitIn(root, ["face", "check", "docs", "--json"]), 2);
  one("a second path is refused with exit 2", exitIn(root, ["face", "write", "docs", "docs"]), 2);
  one("and no refused run wrote", readAt(root, at), stale);

  // KNOWN-BAD, so the refusals are not the reason nothing was written: handed the tree, the same run writes.
  run(root, ["face", "write", "docs"]);
  one("[MKT.SCRIPTS.87] handed the docs tree, `write` writes the tag line the block declares",
    readAt(root, at), has("`Status: 🔮 PLANNING`"));
  one("and after the write a `check` finds every region current",
    run(root, ["face", "check", "docs"]), (got) => got.includes("every face is already current") && got.includes("every tag line is already rendered from its block"));
}

/** Two domains, each with a construct that declares a term, a capabilities face with a mirror, and every tag line stale. */
const twoDomains = () => {
  const terms = (term) => "## Terms\n\n| Term | Contract term | What it means |\n| --- | --- | --- |\n" + `| ${term} | \`SP${term}\` | the ${term} |\n`;
  const tag = "`For: Architect` · `Status: ✅ DONE`";
  return repo({
    "CONCEPT.md": "# c\n\n## Core\n\nThe core.\n\n## Edge\n\nThe edge.\n",
    [`docs/${SEAT.constructs}/README.md`]: doc({ id: "d", title: "Constructs", lenses: ["ARCHITECT"], status: "PLANNING" }, "Some prose.\n", tag),
    [`docs/${SEAT.constructs}/01-core/README.md`]: doc({ id: "c", title: "Core", lenses: ["ARCHITECT"], status: "PLANNING" }, "Some prose.\n", tag),
    [`docs/${SEAT.constructs}/01-core/session.md`]:
      doc({ id: "session", variant: "construct", parentId: "c", dependsOn: [], title: "Session", lenses: ["ARCHITECT"], status: "PLANNING" }, terms("apple"), tag),
    [`docs/${SEAT.constructs}/02-edge/README.md`]: doc({ id: "e", title: "Edge", lenses: ["ARCHITECT"], status: "PLANNING" }, "Some prose.\n", tag),
    [`docs/${SEAT.constructs}/02-edge/gate.md`]:
      doc({ id: "gate", variant: "construct", parentId: "e", dependsOn: [], title: "Gate", lenses: ["ARCHITECT"], status: "PLANNING" }, terms("banana"), tag),
    [`docs/${SEAT.capabilities}/README.md`]: doc({ id: "f", title: "Capabilities", lenses: ["ARCHITECT"], status: "PLANNING" }, "Lead.\n", tag),
    [`docs/${SEAT.capabilities}/app.md`]: doc({ id: "m", title: "App", lenses: ["ARCHITECT"], status: "PLANNING" }, "Lead.\n", tag),
  });
};
const CORE = `docs/${SEAT.constructs}/01-core`, EDGE = `docs/${SEAT.constructs}/02-edge`, MIRRORS = `docs/${SEAT.capabilities}`;
const EVERY = [`docs/${SEAT.constructs}/README.md`, `${CORE}/README.md`, `${CORE}/session.md`, `${EDGE}/README.md`, `${EDGE}/gate.md`,
  `${MIRRORS}/README.md`, `${MIRRORS}/app.md`];
/** The bytes of every file of the fixture, by its path. */
const bytesOf = (root) => Object.fromEntries(EVERY.map((file) => [file, readAt(root, file)]));
/** The files whose bytes differ between two readings. */
const changed = (before, after) => EVERY.filter((file) => before[file] !== after[file]);

console.log("\n=== a narrow path reads and writes only the regions it feeds");
{
  const root = twoDomains();
  const before = bytesOf(root);
  const said = run(root, ["face", "write", `${CORE}/session.md`]);
  const after = bytesOf(root);
  one("a seat file feeds its domain's face and its own tag line, and no other file changes",
    changed(before, after), (got) => JSON.stringify(got) === JSON.stringify([`${CORE}/README.md`, `${CORE}/session.md`]));
  one("the domain's face gains its glossary and its map", after[`${CORE}/README.md`],
    (got) => got.includes("| [apple](session.md) |") && got.includes("spn:generated constructs") && got.includes("[Session](session.md)"));
  one("the domain's face keeps its stale tag line, because the path is the seat file and a tag line is fed by its own file",
    after[`${CORE}/README.md`], has("`Status: ✅ DONE`"));
  one("the seat file's own tag line is rendered", after[`${CORE}/session.md`], has("`Status: 🔮 PLANNING`"));
  one("the other domain's face is the same bytes", after[`${EDGE}/README.md`], before[`${EDGE}/README.md`]);
  one("and so is the capabilities face", after[`${MIRRORS}/README.md`], before[`${MIRRORS}/README.md`]);
  one("the run names the one face it wrote", said, (got) => got.includes("wrote 2 faces") && !got.includes("02-edge") && got.includes("wrote 1 tag line"));

  // KNOWN-BAD, so the narrow run is the reason the others stayed: the whole tree, written, changes them.
  run(root, ["face", "write", "docs"]);
  one("known-bad: a write of the whole tree changes the other domain's face and the capabilities face",
    changed(after, bytesOf(root)), (got) => got.includes(`${EDGE}/README.md`) && got.includes(`${MIRRORS}/README.md`) && got.includes(`${EDGE}/gate.md`));
}
{
  const root = twoDomains();
  const before = bytesOf(root);
  run(root, ["face", "write", EDGE]);
  one("a folder inside the tree feeds the faces and the tag lines under it, and no file outside it changes",
    changed(before, bytesOf(root)), (got) => JSON.stringify(got) === JSON.stringify([`${EDGE}/README.md`, `${EDGE}/gate.md`]));
}
{
  const root = twoDomains();
  const before = bytesOf(root);
  run(root, ["face", "write", `${MIRRORS}/app.md`]);
  one("a mirror feeds the Map of the face beside it, and its own tag line",
    changed(before, bytesOf(root)), (got) => JSON.stringify(got) === JSON.stringify([`${MIRRORS}/README.md`, `${MIRRORS}/app.md`]));
  one("the Map names the mirror", readAt(root, `${MIRRORS}/README.md`), has("| [app.md](app.md) |"));
}
{
  const root = twoDomains();
  const whole = run(root, ["face", "check", "."]);
  const narrow = run(root, ["face", "check", CORE]);
  one("`check` narrowed to a folder reports the faces under it and none beside it",
    narrow, (got) => got.includes("01-core/README.md") && !got.includes("02-edge") && !got.includes(`${SEAT.capabilities}/README.md`));
  one("known-bad: the same `check` of the repository reports the other domain too", whole, has("02-edge/README.md"));
  one("and neither `check` wrote a byte", changed(bytesOf(twoDomains()), bytesOf(root)), (got) => got.length === 0);
}

console.log("\n=== `--block` reads and writes one generated block");
{
  const core = `${CORE}/README.md`, mirrors = `${MIRRORS}/README.md`;
  const after = (...blocks) => {
    const root = twoDomains();
    const said = run(root, ["face", "write", "docs", ...blocks.flatMap((block) => ["--block", block])]);
    return { said, files: bytesOf(root) };
  };
  const stale = bytesOf(twoDomains());
  const carries = (files) => ({
    glossary: files[core].includes("spn:generated glossary"),
    constructs: files[core].includes("spn:generated constructs"),
    contents: files[mirrors].includes("spn:generated contents"),
    tags: files[core].includes("`Status: 🔮 PLANNING`"),
  });
  const only = (block) => ({ glossary: false, constructs: false, contents: false, tags: false, [block]: true });
  one("untouched: the fixture carries none of the four before a write", JSON.stringify(carries(stale)),
    JSON.stringify({ glossary: false, constructs: false, contents: false, tags: false }));
  for (const block of ["glossary", "constructs", "contents", "tags"]) {
    const { said, files } = after(block);
    one(`\`--block ${block}\` writes that block and no other`, JSON.stringify(carries(files)), JSON.stringify(only(block)));
    one(`and \`--block ${block}\` speaks for its own block alone`, said,
      (got) => (block === "tags") === got.includes("tag line") && (block !== "tags") === got.includes("face"));
  }
  one("`--block` typed twice writes both blocks",
    JSON.stringify(carries(after("glossary", "tags").files)), JSON.stringify({ glossary: true, constructs: false, contents: false, tags: true }));
  one("and with no `--block` every block is written",
    JSON.stringify(carries(after().files)), JSON.stringify({ glossary: true, constructs: true, contents: true, tags: true }));
}

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
