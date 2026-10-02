// `docs guide` produces a guide's page of stages and steps from the guide's markdown. Every case
// builds a small repository in a temporary folder, runs the real command through `cli.ts`, and reads
// the page back from disk.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { PLUGIN, WORKSPACE } from "../../../../helpers/harness.mjs";
import { ARTIFACT, CONSTRUCT_PAGES, DOCS, GUIDE_PAGE_SUFFIX, POCKET, SEAT, bookTemplatesDir } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { OWN_COPY, linesFor } from "../../../../../../plugin-support-lib/src/lib/page-styles.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-guide-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 900)}` : ""}`);
};
const same = (label, got, want) => ok(label, JSON.stringify(got) === JSON.stringify(want), `got:  ${JSON.stringify(got)}\n        want: ${JSON.stringify(want)}`);

// Three versions were cut here, and the newest is not the last by its letters.
const STYLES = join(BASE, "styles");
mkdirSync(STYLES);
writeFileSync(join(STYLES, "versions.json"), JSON.stringify({ "1.0.0": {}, "1.10.0": {}, "1.2.0": {} }));
const NEWEST = "1.10.0";

const environment = { ...process.env, SPN_TELEMETRY: "off", SPN_WORKSPACE: BASE, SPN_STYLES: STYLES,
  SPN_TEMPLATES: bookTemplatesDir(resolve(WORKSPACE, "spn-foundation")) };
delete environment.SPN_ORG;
delete environment.SPN_LOCATION;
/** One run of `docs guide` through the entry, with its exit code and what it printed. */
const guide = (args, extra = {}) => {
  try { return { code: 0, out: execFileSync(process.execPath, [TOOL, "docs", "guide", ...args], { encoding: "utf8", env: { ...environment, ...extra }, stdio: "pipe" }) }; }
  catch (error) { return { code: error.status ?? 1, out: String(error.stdout ?? "") + String(error.stderr ?? "") }; }
};

const GUIDES = `${DOCS}/${SEAT.guides}`;
const PAGES = `${DOCS}/${POCKET.artifacts}/${ARTIFACT.guides}`;

let made = 0;
/** A repository under the scratch folder, from a map of path to text. Its manifest names it Sample. */
const repo = (files) => {
  made += 1;
  const root = join(BASE, `spn-sample-${made}`);
  for (const [path, text] of Object.entries({ "sprepo.json": '{"type":"APPS","name":"Sample","config":null}', ...files })) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text, "utf8");
  }
  return root;
};
const read = (root, path) => readFileSync(join(root, path), "utf8");
/** Every file under a folder, by its path from that folder. */
const filesUnder = (folder, from = folder) => readdirSync(folder, { withFileTypes: true }).flatMap((one) =>
  one.isDirectory() ? filesUnder(join(folder, one.name), from) : [relative(from, join(folder, one.name)).split("\\").join("/")]).sort();
const block = (fields) => `<!-- spn:doc\n${JSON.stringify(fields, null, 2)}\n-->\n`;
/** The text of each element a pattern finds, with its tags taken off. */
const each = (text, pattern) => [...text.matchAll(pattern)].map((found) => found[1].replace(/<[^>]+>/g, ""));
const headsOf = (text) => each(text, /<h2>([\s\S]*?)<\/h2>/g);
const stepsOf = (text) => each(text, /<div class="sds-step">\s*<h3[^>]*>([\s\S]*?)<\/h3>/g);
/** One step of a page, from its opening to the line that closes it. */
const stepAt = (text, id) => new RegExp(`  <div class="sds-step">\\n    <h3 id="${id}">[\\s\\S]*?\\n  </div>`).exec(text)?.[0] ?? "";
const blockOf = (text) => JSON.parse(/<!--\s*spn:doc\s*(\{[\s\S]*?\})\s*-->/.exec(text)[1]);

// ---------------------------------------------------------------------------- a guide written as a table

const TABLE_GUIDE = `${block({ id: "sample-getting-started", title: "Getting Started", lenses: ["SERVER_DEV", "QA"], status: "DONE",
  summary: "From a clone to a first run, with \`tool\`.", keywords: ["start"] })}
# Getting Started

\`For: Backend developer · Quality engineer\` · \`Status: ✅ DONE\`

You end with a service that runs. Read [the model](../${SEAT.constructs}/01-core/thing.md) first,
and then [the face](../README.md#the-map).

## Your machine

You need node, at the version the repository pins.

| You need | How to check it |
| --- | --- |
| node | \`node --version\` |

## The steps

This stage gets you a service that answers.

| # | Step | Runs | Status |
| --- | --- | --- | --- |
| 1 | **Install it.** It puts the tool on your machine. What just happened: the tool answers \`--version\` | \`npm install -g tool\` | ✅ |
| 2 | **Start it.** It runs the service & its queue. **What you see:** a line that says \`listening\` | \`tool start\` · \`tool status\` | 🚧 |
| 3 | **Stop it** when you are done | \`tool stop <name>\` | ✅ |

After the last step the service is down again.

## Where to go next

| You want to | Read |
| --- | --- |
| Build more | [Build](02-build.md) |

---

<!-- book-nav -->
📖 ↑ [book](../README.md)
`;

{
  const root = repo({ [`${GUIDES}/01-getting-started.md`]: TABLE_GUIDE, [`${GUIDES}/02-build.md`]: "# Build\n",
    [`${DOCS}/README.md`]: "# Docs\n", [`${DOCS}/${SEAT.constructs}/01-core/thing.md`]: "# Thing\n" });
  const before = filesUnder(root);
  const ran = guide([join(root, GUIDES, "01-getting-started.md")]);
  const out = `${PAGES}/getting-started-guide.html`;
  ok("[MKT.SCRIPTS.106] a guide written as a table gives its page, named for the file without its number, and exits 0",
    ran.code === 0 && existsSync(join(root, out)), ran.out);
  same("[MKT.SCRIPTS.106] the run writes the guide's page and no other file", filesUnder(root), [...before, out].sort());
  const text = existsSync(join(root, out)) ? read(root, out) : "";

  same("[MKT.SCRIPTS.106] table: the opening, what must be true first, the stage, and where to go next, in that order",
    headsOf(text), ["Overview", "Before you start", "The steps", "Where to go next"]);
  same("[MKT.SCRIPTS.106] table: each row is one step, named for what you do", stepsOf(text),
    ["Install it", "Start it", "Stop it when you are done"]);
  same("[MKT.SCRIPTS.106] table: a step holds why, the command and what you see, in that order", stepAt(text, "install-it").split("\n"), [
    `  <div class="sds-step">`,
    `    <h3 id="install-it">Install it</h3>`,
    `    <p>It puts the tool on your machine.</p>`,
    `    <pre>npm install -g tool</pre>`,
    `    <div class="sds-step-see"><span class="sds-label">What you see</span><p>What just happened: the tool answers <code>--version</code></p></div>`,
    `  </div>`]);
  same("[MKT.SCRIPTS.106] table: each command of a step is on a line of its own, and the mark `What you see` is the page's own label",
    stepAt(text, "start-it").split("\n").slice(2, 6), [
      `    <p>It runs the service &amp; its queue.</p>`,
      `    <pre>tool start`,
      `tool status</pre>`,
      `    <div class="sds-step-see"><span class="sds-label">What you see</span><p>a line that says <code>listening</code></p></div>`]);
  same("[MKT.SCRIPTS.106] table: a step with no why and nothing to see holds its name and its command",
    stepAt(text, "stop-it-when-you-are-done").split("\n").slice(1, -1),
    [`    <h3 id="stop-it-when-you-are-done">Stop it when you are done</h3>`, `    <pre>tool stop &lt;name&gt;</pre>`]);
  ok("[MKT.SCRIPTS.106] table: the sentence of the stage stands above its steps, and the text after them below",
    text.indexOf("<p>This stage gets you a service that answers.</p>") < text.indexOf('<div class="sds-step">')
      && text.indexOf("<p>After the last step the service is down again.</p>") > text.lastIndexOf('<div class="sds-step">'));
  ok("[MKT.SCRIPTS.106] table: what must be true first keeps its own heading and its table",
    text.includes("  <h3>Your machine</h3>") && text.includes('<div class="sds-scroll"><table>') && text.includes("<td><code>node --version</code></td>"));

  ok("[MKT.SCRIPTS.106] table: the page holds no status", !/✅|🚧|sds-status|Status/.test(text) && blockOf(text).status === undefined,
    text.split("\n").filter((line) => /✅|🚧|sds-status|Status/.test(line)).join("\n"));
  ok("[MKT.SCRIPTS.106] table: the page holds no typed number", !/<t[dh]>(?:#|\d+)<\/t[dh]>/.test(text) && !/<h[23][^>]*>\s*(?:Step\s+)?\d/.test(text),
    text.split("\n").filter((line) => /<t[dh]>(?:#|\d+)<\/t[dh]>/.test(line)).join("\n"));

  ok("a link to a construct's seat file points at that construct's page, from the page's own place",
    text.includes(`<a href="../${ARTIFACT.docs}/01-core/${CONSTRUCT_PAGES}/thing-construct.html">the model</a>`), each(text, /(<a [^>]*>)/g).join(" "));
  ok("a link to another file is written again against the page's own place, and keeps its anchor",
    text.includes('<a href="../../README.md#the-map">the face</a>') && text.includes(`<a href="../../${SEAT.guides}/02-build.md">Build</a>`));
  ok("the link home is `../index.html`", text.includes('<a class="sds-home" href="../index.html" target="_top">'));
  const lines = linesFor(NEWEST);
  ok("the page links the newest version that was cut, and loads the page script from it",
    text.includes(lines.stylesheet) && text.includes(lines.script) && !text.includes("/1.0.0/") && !text.includes("/1.2.0/"));
  ok("the header says the workspace, the repository's declared name and the guide, then the type and the audience",
    text.includes('<span class="sds-line1">SaaS Plane &nbsp;|&nbsp; Sample &nbsp;|&nbsp; Getting Started</span>')
      && text.includes('<span class="sds-badge sds-type">Guide</span>')
      && text.includes('<span class="sds-audience"><span class="sds-badge sds-lens">Backend developer</span><span class="sds-badge sds-lens">Quality engineer</span></span>'));
  ok("the title is on the tab, in the rail and in the masthead, and the summary is the description",
    text.includes("<title>Getting Started</title>") && text.includes('<div class="sds-rail-title">Getting Started</div>')
      && text.includes("<h1>Getting Started</h1>") && text.includes('<p class="sds-standfirst">From a clone to a first run, with <code>tool</code>.</p>'));
  ok("a guide whose block has no subtitle gives a page with no subtitle line", !text.includes("sds-subtitle"));
  same("the page's block names the guide it was produced from", blockOf(text), { id: "sample-getting-started", variant: "guide",
    title: "Getting Started", lenses: ["SERVER_DEV", "QA"], summary: "From a clone to a first run, with `tool`.", keywords: ["start"],
    source: `${GUIDES}/01-getting-started.md` });
  ok("the page holds no slot, no footer, no note to an author of the template, and none of the book's own navigation",
    !text.includes("{{") && !text.includes("<footer>") && !text.includes("RESTATES") && !text.includes("book-nav") && !text.includes("📖")
      && text.startsWith('<meta charset="utf-8">') && text.includes("<!-- Produced by `docs guide`"));
  ok("the run says how many stages and steps it placed, and which steps lack what you see",
    ran.out.includes("1 stage(s) · 3 step(s)") && /SOFT[^\n]*01-getting-started\.md\n[^\n]*step 3: no text is marked as what you see/.test(ran.out), ran.out);

  const again = guide([join(root, GUIDES, "01-getting-started.md")]);
  ok("a second run writes the same bytes", again.code === 0 && read(root, out) === text && again.out.includes("current"), again.out);
  const checked = guide([join(root, GUIDES, "01-getting-started.md"), "--check"]);
  ok("`--check` on a page that is current exits 0", checked.code === 0 && checked.out.includes("current"), checked.out);

  writeFileSync(join(root, GUIDES, "01-getting-started.md"), TABLE_GUIDE.replace("**Stop it** when you are done", "**Stop it.** It frees the port."));
  const stale = guide([join(root, GUIDES, "01-getting-started.md"), "--check"]);
  ok("`--check` after the guide changed exits 1, names the page and writes nothing",
    stale.code === 1 && /RULE[^\n]*getting-started-guide\.html\n[^\n]*not what `docs guide` produces now/.test(stale.out) && read(root, out) === text, stale.out);
}

// ---------------------------------------------------------------------------- a guide written under headings

const HEADINGS_GUIDE = `${block({ id: "sample-test-and-verify", title: "Test and Verify", subtitle: "Prove a change at every tier.",
  lenses: ["QA"], status: "DONE", summary: "A full run of every tier." })}
# Test and Verify

\`For: Quality engineer\` · \`Status: ✅ DONE\`

A full run proves every tier this repository owes.

## Before you start

You need Docker, and the platform's declaration.

## 1. Stand the platform

This stage gets you a running platform.

### Step 1 — Start the stack

It starts the database and the queue.

\`\`\`bash
tool up --apply
\`\`\`

**What you see:** three containers that say \`healthy\`.

### 2. Register the app

It gives the app a host name.

\`\`\`bash
tool app up
\`\`\`

> The host name is local to your machine.

## Stage 2 — Run the tests

### Run the unit tests

\`\`\`
tool test unit
\`\`\`

What you see: a line that says \`all passed\`.

#### When a test fails

Read the first failure only.

## Where to go next

- [Release](06-release.md)
`;

{
  const root = repo({ [`${GUIDES}/07-test-and-verify.md`]: HEADINGS_GUIDE });
  const ran = guide([join(root, GUIDES, "07-test-and-verify.md")]);
  const out = `${PAGES}/test-and-verify-guide.html`;
  ok("[MKT.SCRIPTS.106] a guide written under headings gives its page, and exits 0", ran.code === 0 && existsSync(join(root, out)), ran.out);
  const text = existsSync(join(root, out)) ? read(root, out) : "";
  same("[MKT.SCRIPTS.106] headings: each section is a section of the page, and a section that holds steps is a stage",
    headsOf(text), ["Overview", "Before you start", "1. Stand the platform", "Stage 2 — Run the tests", "Where to go next"]);
  ok("[MKT.SCRIPTS.106] headings: a stage's name stays as the guide writes it, typed number and all",
    text.includes("<h2>1. Stand the platform</h2>") && text.includes("<h2>Stage 2 — Run the tests</h2>"), headsOf(text).join(" | "));
  same("[MKT.SCRIPTS.106] headings: each heading under a stage is one step", stepsOf(text),
    ["Start the stack", "Register the app", "Run the unit tests"]);
  ok("[MKT.SCRIPTS.106] headings: the run counts two stages and three steps", ran.out.includes("2 stage(s) · 3 step(s)"), ran.out);
  same("[MKT.SCRIPTS.106] headings: a step holds why, the command and what you see, where the markdown has them",
    stepAt(text, "start-the-stack").split("\n"), [
      `  <div class="sds-step">`,
      `    <h3 id="start-the-stack">Start the stack</h3>`,
      `    <p>It starts the database and the queue.</p>`,
      `    <pre data-lang="bash">tool up --apply</pre>`,
      `    <div class="sds-step-see"><span class="sds-label">What you see</span><p>three containers that say <code>healthy</code>.</p></div>`,
      `  </div>`]);
  ok("[MKT.SCRIPTS.106] headings: the mark `What you see` is read with and without bold",
    stepAt(text, "run-the-unit-tests").includes('<span class="sds-label">What you see</span><p>a line that says <code>all passed</code>.</p>'), stepAt(text, "run-the-unit-tests"));
  ok("[MKT.SCRIPTS.106] headings: a quote and a deeper heading stay in their step",
    stepAt(text, "register-the-app").includes('    <div class="sds-pull"><p>The host name is local to your machine.</p></div>')
      && stepAt(text, "run-the-unit-tests").includes("    <h4>When a test fails</h4>"));
  ok("[MKT.SCRIPTS.106] headings: the page holds no status", !/✅|sds-status|Status/.test(text) && blockOf(text).status === undefined);
  ok("[MKT.SCRIPTS.106] headings: no step holds a typed number",
    !/<h3[^>]*>\s*(?:Step\s+)?\d/.test(text), stepsOf(text).join(" | "));
  ok("a guide whose block has a subtitle gives a page with that subtitle, under the title",
    text.includes('<h1>Test and Verify</h1>\n  <p class="sds-subtitle">Prove a change at every tier.</p>\n  <p class="sds-standfirst">A full run of every tier.</p>'));
  ok("the run names the step that lacks what you see", /step 2: no text is marked as what you see/.test(ran.out), ran.out);

  const named = guide([join(root, GUIDES, "07-test-and-verify.md"), "--name", "verify"]);
  ok("`--name` names the page", named.code === 0 && existsSync(join(root, PAGES, "verify-guide.html"))
    && read(root, `${PAGES}/verify-guide.html`) === text, named.out);

  const elsewhere = join(BASE, "elsewhere", "page.html");
  mkdirSync(dirname(elsewhere));
  const before = filesUnder(root);
  const away = guide([join(root, GUIDES, "07-test-and-verify.md"), "--out", elsewhere]);
  ok("`--out` writes the page elsewhere, with its links written for that place, and writes nothing into the repository",
    away.code === 0 && readFileSync(elsewhere, "utf8").includes(`<a href="../spn-sample-${made}/${GUIDES}/06-release.md">Release</a>`)
      && JSON.stringify(filesUnder(root)) === JSON.stringify(before), away.out);
}

// ---------------------------------------------------------------------------- a guide whose sections are its steps

const STEP_SECTIONS = `${block({ id: "sample-verify", title: "Verify", lenses: ["QA"], status: "DONE", summary: "Every tier, in order." })}
# Verify

\`For: Quality engineer\` · \`Status: ✅ DONE\`

This guide runs every test.

## Before you start

Check the tool first.

\`\`\`bash
tool -v
\`\`\`

## Step 1 — Stand the platform

The tests need the platform.

\`\`\`bash
tool platform up
\`\`\`

### When the ports moved

Run it again.

## Step 2 - Run the unit tests

\`\`\`bash
tool test unit
\`\`\`

**What you see:** a line that says \`passed\`.

## Clean reset

Only when somebody asks.

#### Step 3 — Remove the data

\`\`\`bash
tool clean
\`\`\`

## Step 4 — Record the run

\`\`\`bash
tool record
\`\`\`
`;

{
  const root = repo({ [`${GUIDES}/07-verify.md`]: STEP_SECTIONS });
  const ran = guide([join(root, GUIDES, "07-verify.md")]);
  const out = `${PAGES}/verify${GUIDE_PAGE_SUFFIX}`;
  ok("[MKT.SCRIPTS.106] a guide whose sections open with `Step N —` gives its page, and exits 0", ran.code === 0 && existsSync(join(root, out)), ran.out);
  const text = existsSync(join(root, out)) ? read(root, out) : "";
  same("[MKT.SCRIPTS.106] step sections: a heading of any level that opens with `Step`, a number and a dash is a step, without its typed number",
    stepsOf(text), ["Stand the platform", "Run the unit tests", "Remove the data", "Record the run"]);
  same("[MKT.SCRIPTS.106] step sections: sections that are steps, one after another, are one stage, which the guide did not name",
    headsOf(text), ["Overview", "Before you start", "Steps", "Clean reset", "Steps"]);
  ok("[MKT.SCRIPTS.106] step sections: the run counts each stage and each step", ran.out.includes("3 stage(s) · 4 step(s)"), ran.out);
  // A guide that numbers its sections, `## 1. …`, says the same thing as one that writes `## Step 1 — …`.
  const NUMBERED = block({ id: "sample-stand-it-up", title: "Stand It Up", lenses: ["QA"], status: "DONE", summary: "Stand it up." }) + "\n# Stand It Up\n\nYou stand the platform up and check it.\n\n## 1. Stand the platform\n\nThe tests need the platform.\n\n```bash\ntool platform up\n```\n\n" +
    "## 2. Run the unit tests\n\n```bash\ntool test\n```\n\n## 3. Remove the data\n\n```bash\ntool clean\n```\n\n## 4. Record the run\n\n```bash\ntool record\n```\n";
  const numbered = repo({ [`${GUIDES}/01-stand-it-up.md`]: NUMBERED });
  const numberedRun = guide([join(numbered, GUIDES, "01-stand-it-up.md")]);
  const numberedOut = `${PAGES}/stand-it-up${GUIDE_PAGE_SUFFIX}`;
  same("[MKT.SCRIPTS.106] step sections: a heading that opens with a number and a dot is a step too, without its typed number",
    numberedRun.code === 0 && existsSync(join(numbered, numberedOut)) ? stepsOf(read(numbered, numberedOut)) : numberedRun.out,
    ["Stand the platform", "Run the unit tests", "Remove the data", "Record the run"]);
  // The same guide with a `###` heading under one numbered section numbers its stages, and that heading is the step.
  const staged = repo({ [`${GUIDES}/01-stand-it-up.md`]: NUMBERED.replace("The tests need the platform.", "### Start the engine\n\nThe tests need the platform.") });
  const stagedRun = guide([join(staged, GUIDES, "01-stand-it-up.md")]);
  same("[MKT.SCRIPTS.106] step sections: where a numbered section holds a `###` heading, the numbered sections are stages and keep their numbers",
    stagedRun.code === 0 && existsSync(join(staged, numberedOut)) ? stepsOf(read(staged, numberedOut)) : stagedRun.out, ["Start the engine"]);
  same("[MKT.SCRIPTS.106] step sections: a step holds what its section holds, and a heading under it is a part of the step",
    stepAt(text, "stand-the-platform").split("\n"), [
      `  <div class="sds-step">`,
      `    <h3 id="stand-the-platform">Stand the platform</h3>`,
      `    <p>The tests need the platform.</p>`,
      `    <pre data-lang="bash">tool platform up</pre>`,
      `    <h4>When the ports moved</h4>`,
      `    <p>Run it again.</p>`,
      `  </div>`]);
  ok("[MKT.SCRIPTS.106] step sections: what you see is read in a step that is a section",
    stepAt(text, "run-the-unit-tests").includes('<span class="sds-label">What you see</span><p>a line that says <code>passed</code>.</p>'));
  ok("[MKT.SCRIPTS.106] step sections: the command of a section that is no step stays in no step",
    text.indexOf('<pre data-lang="bash">tool -v</pre>') < text.indexOf('<div class="sds-step">') && /`Before you start`: commands that sit under no step/.test(ran.out), ran.out);
  ok("[MKT.SCRIPTS.106] step sections: no step holds a typed number", !/<h3[^>]*>\s*(?:Step\s+)?\d/.test(text), stepsOf(text).join(" | "));
}

// ---------------------------------------------------------------------------- a guide with no step

const NO_STEP = `${block({ id: "sample-notes", title: "Notes", lenses: ["QA"], status: "DONE", summary: "Notes on a run." })}
# Notes

Some prose, and a section that holds a command under no heading.

## Run it

\`\`\`bash
tool run
\`\`\`

| Task | Command |
| --- | --- |
| Run | \`tool run\` |
`;

{
  const root = repo({ [`${GUIDES}/03-notes.md`]: NO_STEP, [`${GUIDES}/01-getting-started.md`]: TABLE_GUIDE });
  const before = filesUnder(root);
  const ran = guide([join(root, GUIDES, "03-notes.md")]);
  ok("[MKT.SCRIPTS.107] a guide with no step is named, and the run exits 1",
    ran.code === 1 && /RULE[^\n]*03-notes\.md\n[^\n]*this guide holds no step, so no page is written/.test(ran.out), ran.out);
  ok("[MKT.SCRIPTS.107] no page is written for a guide with no step, and no folder is made for one",
    JSON.stringify(filesUnder(root)) === JSON.stringify(before) && !existsSync(join(root, PAGES)), filesUnder(root).join(" "));

  const both = guide([join(root, GUIDES, "03-notes.md"), join(root, GUIDES, "01-getting-started.md")]);
  ok("[MKT.SCRIPTS.107] beside a guide with steps, the guide with none is still named, the other page is written, and the run exits 1",
    both.code === 1 && both.out.includes("holds no step") && existsSync(join(root, PAGES, "getting-started-guide.html"))
      && !existsSync(join(root, PAGES, "notes-guide.html")), both.out);
}

// ---------------------------------------------------------------------------- what the command refuses

{
  const root = repo({ [`${GUIDES}/01-getting-started.md`]: TABLE_GUIDE, [`${GUIDES}/04-no-block.md`]: "# No block\n\n## A stage\n\n### A step\n\n```\nx\n```\n" });
  const before = filesUnder(root);
  const unchanged = () => JSON.stringify(filesUnder(root)) === JSON.stringify(before);

  const noBlock = guide([join(root, GUIDES, "04-no-block.md")]);
  ok("a guide with no block is refused, and nothing is written", noBlock.code === 1 && noBlock.out.includes("has no `spn:doc` block") && unchanged(), noBlock.out);
  const missing = guide([join(root, GUIDES, "09-not-there.md")]);
  ok("a guide that is not there is refused", missing.code === 1 && missing.out.includes("is not there") && unchanged(), missing.out);
  const usage = guide([]);
  ok("with no guide the command prints its usage and exits 2", usage.code === 2 && usage.out.includes("usage: spn-devex docs guide"), usage.out);
  const two = guide([join(root, GUIDES, "01-getting-started.md"), join(root, GUIDES, "04-no-block.md"), "--name", "one"]);
  ok("`--name` with two guides is refused, and nothing is written", two.code === 2 && two.out.includes("take one guide") && unchanged(), two.out);

  const templates = join(BASE, "templates-before");
  mkdirSync(join(templates, "pages"), { recursive: true });
  writeFileSync(join(templates, "pages", "guide-template.html"), "<title>Guide</title>\n<style>.step{}</style>\n<div class=\"page guide\"></div>\n");
  const refused = guide([join(root, GUIDES, "01-getting-started.md")], { SPN_TEMPLATES: templates });
  ok("a template that links no shared stylesheet is refused in the one wording, and no page is written",
    refused.code === 1 && refused.out.includes(OWN_COPY) && unchanged(), refused.out);

  // A template with a slot this command does not know is not filled by a guess.
  const real = readFileSync(join(environment.SPN_TEMPLATES, "pages", "guide-template.html"), "utf8");
  const changed = join(BASE, "templates-changed");
  mkdirSync(join(changed, "pages"), { recursive: true });
  writeFileSync(join(changed, "pages", "guide-template.html"), real.replace("<h1>{{NAME}}</h1>", "<h1>{{NAME}}</h1>\n  <p>{{A NEW SLOT}}</p>"));
  const slot = guide([join(root, GUIDES, "01-getting-started.md")], { SPN_TEMPLATES: changed });
  ok("a template with a slot the command does not fill is refused, and the slot is named",
    slot.code === 1 && slot.out.includes("{{A NEW SLOT}}") && unchanged(), slot.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
