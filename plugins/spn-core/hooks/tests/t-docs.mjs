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
const construct = (sections) =>
  doc({ id: "x", variant: "construct", parentId: "concept", dependsOn: [], title: "X", lenses: ["ARCHITECT"], status: "PLANNING" },
      "Lead.\n\n" + sections.map((h) => `## ${h}\n\nWhat ${h} says.\n`).join("\n"),
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
  one("and it names what it did NOT measure rather than reporting a zero",
    rep, has("What this report does not measure"));
}

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
