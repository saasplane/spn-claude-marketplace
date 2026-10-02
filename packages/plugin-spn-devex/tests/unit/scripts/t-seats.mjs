import { PLUGIN } from "../../helpers/harness.mjs";
// The seat-shaped `docs` checks that are not their own command's whole file: the Proof join, the
// Proof-carries-a-register-table refusal, `figure check`, a code file's own `// RESTATES:` header,
// `findBook`, and `face` over a capability seat. `docs status` · `docs topics` · `docs parity` each
// moved to their own file beside this one (`N101` step 5) once the plugin ran through `cli.ts` — a
// suite this size was one file only because `docs.ts` was one file too.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { ARTIFACT, CONSTRUCT_PAGES, POCKET, SEAT, bookTemplatesDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { linesFor } from "../../../../plugin-support-lib/src/lib/page-styles.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const TEMPLATES = bookTemplatesDir(resolve(PLUGIN, "..", "..", "..", "spn-foundation"));
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
    return execFileSync(process.execPath, [TOOL, "docs", ...args],
      { encoding: "utf8", cwd: root, env: { ...process.env, SPN_WORKSPACE: root, SPN_TEMPLATES: TEMPLATES } });
  } catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
}
const readAt = (root, p) => readFileSync(join(root, p), "utf8");
/** Where the construct pages of the domain `01-core` sit: the `constructs` folder of its folder in the pocket. */
const CORE_PAGES = `docs/${POCKET.artifacts}/${ARTIFACT.docs}/01-core/${CONSTRUCT_PAGES}`;

let n = 0, failed = 0;
function one(name, got, want) {
  n += 1;
  const ok = typeof want === "function" ? want(got) : got === want;
  if (!ok) { failed += 1; console.log(`  FAIL  ${name}\n        got: ${JSON.stringify(String(got).slice(0, 300))}`); }
  else console.log(`  PASS  ${name}`);
}
const has = (s) => (got) => String(got).includes(s);
const lacks = (s) => (got) => !String(got).includes(s);

// ---------------------------------------------------------------- nothing is joined

console.log("\n=== the produced page is the seat, and no register row is joined into it");
{
  // A construct types no proof (RD.DEVEX.WORKSPACE.132). Its rows are read in the tests report, so a register
  // beside it changes nothing on its page — not a row, not a status, not a line naming the source.
  const rows = [["CORE.BOOT.01", "can boot a service", "UNIT", "PLANNED"],
                ["CORE.BOOT.02", "sees a clean shutdown", "INTEGRATION", "DONE"]];
  const ws = repo({
    [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot"),
    [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: register("b", rows),
  });
  const before = readAt(ws, `docs/${SEAT.constructs}/01-core/01-boot.md`);
  const out = run(ws, ["page", "write", `docs/${SEAT.constructs}/01-core/01-boot.md`]);
  const page = readAt(ws, `${CORE_PAGES}/01-boot-construct.html`);

  one("no register row reaches the page", page,
      (g) => !g.includes("CORE.BOOT.01") && !g.includes("CORE.BOOT.02"));
  one("and no line claims rows were joined", page, lacks("joined from the register"));
  one("the seat file on disk is untouched by production",
      readAt(ws, `docs/${SEAT.constructs}/01-core/01-boot.md`), before);
  one("producing the page raises no proof finding", out, lacks("proof"));

  // THE TWO HALVES MUST AGREE ABOUT WHAT THE PAGE IS. `checkProduced` renders the same markdown
  // `page` does; if either added something the other did not, every produced page would read as
  // hand-edited the moment it was written.
  one("a page `page` just wrote does not audit as hand-edited", run(ws, ["audit", "check", "docs"]),
      lacks("this page is not what `docs.ts page` produces"));
  one("and a page that really was hand-edited still is", (() => {
        // The produced page is found rather than named: the renderer decides the file name, and a
        // test that hard-codes it fails for the wrong reason the day that changes.
        const dir = join(ws, CORE_PAGES);
        const f = join(dir, readdirSync(dir).find((x) => x.endsWith(".html")));
        writeFileSync(f, `${readFileSync(f, "utf8")}\n<p>typed in by hand</p>\n`, "utf8");
        return run(ws, ["audit", "check", "docs"]);
      })(),
      has("this page is not what `docs.ts page` produces"));

  // A domain-wide register is not joined either, and nothing reports a fallback that no longer exists.
  const ws2 = repo({
    [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot"),
    [`docs/${SEAT.behaviors}/01-core/README.md`]: register("b", rows),
  });
  const out2 = run(ws2, ["page", "write", `docs/${SEAT.constructs}/01-core/01-boot.md`]);
  one("a domain register reaches no page",
      readAt(ws2, `${CORE_PAGES}/01-boot-construct.html`), lacks("CORE.BOOT.01"));
  one("and no fallback is reported", out2, lacks("because this topic has no file of its own yet"));
}

console.log("\n=== a behaviour row typed into a seat's Proof is refused");
{
  const typed = "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| CORE.BOOT.01 | A person | boots | it booted | POSITIVE | UNIT | SUCCESS | — |\n";
  one("a register table in Proof is a RULE — the status lives in one place",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot", { proof: typed }) }), ["audit", "check", "docs"]),
      has("`Proof` carries a table of behaviour rows"));
  one("a typed check table is untouched by that rule",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot", {
        proof: "| Check | Kind | What a green run shows |\n| --- | --- | --- |\n| `spnutils apps test unit` | gate | green |\n" }) }), ["audit", "check", "docs"]),
      lacks("carries a table of behaviour rows"));
}

console.log("\n=== `figure check` takes a folder, the way `audit check` does");
{
  // Given a folder it read the directory itself and died on EISDIR with a raw stack trace, which
  // reads as the tool being broken rather than as the argument being a folder. Found by a step 7
  // agent, which then ran it per file and said so rather than reporting the crash as a green.
  // A page in the shared form: the check reads a drawing only on a page that links the shared stylesheet.
  const page = (svg) => `${linesFor("1.0.0").stylesheet}\n<h1>p</h1>\n<figure><svg class="sds-drawing" viewBox="0 0 100 60">${svg}</svg></figure>\n`;
  const clean = page('<rect class="sds-box" x="10" y="10" width="40" height="20"/>');
  const ws = repo({
    [`${CORE_PAGES}/a-construct.html`]: clean,
    [`${CORE_PAGES}/b-construct.html`]: clean,
  });
  const out = run(ws, ["figure", "check", `docs/${POCKET.artifacts}/${ARTIFACT.docs}`]);
  one("a folder is every page under it, not a read of the directory", out, lacks("EISDIR"));
  one("and it says how many it judged", out, has("clean — 2 pages"));
  one("a path that is not there is named, not read",
      run(repo({ "docs/README.md": "# x\n" }), ["figure", "check", `docs/${POCKET.artifacts}`]),
      (g) => /no such file or folder/.test(g) && !/ENOENT/.test(g));
  one("an empty folder says so rather than claiming clean",
      run(repo({ "docs/README.md": "# x\n" }, {}), ["figure", "check", "docs"]),
      has("clean — 1 page"));
}

console.log("\n=== a section is found by its whole name, not by its first word");
{
  const rows = "| Check | Kind | What a green run shows |\n| --- | --- | --- |\n| `spnutils apps test unit` | gate | green |\n";
  one("`Proof — how you check it` is the Proof section",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]:
        seat("boot").replace("## Proof\n", "## Proof — how you check it\n").replace(/## Proof — how you check it\n\nWhat proves it\.\n\n\n/, `## Proof — how you check it\n\n${rows}`) }), ["audit", "check", "docs"]),
      lacks("carries a table of behaviour rows"));

  // An overview's `Proof Tiers` is a different section that happens to share a first word. Read as
  // Proof, its glossary rows were judged as proof rows — sixteen false findings on one page.
  const typed = "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| CORE.BOOT.01 | A person | boots | it booted | POSITIVE | UNIT | SUCCESS | — |\n";
  one("`Proof Tiers` is NOT the Proof section",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]:
        seat("boot").replace("## Proof\n\nWhat proves it.\n\n\n", `## Proof Tiers\n\n${typed}`) }), ["audit", "check", "docs"]),
      lacks("carries a table of behaviour rows"));
  one("and a real Proof section is still judged",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]:
        seat("boot").replace("## Proof\n\nWhat proves it.\n\n\n", `## Proof\n\n${typed}`) }), ["audit", "check", "docs"]),
      has("carries a table of behaviour rows"));
}

console.log("\n=== a spec that draws nothing is a finding, not a silence");
{
  // `figure check` judged the SVGs a page HAS. Eight foundation seats asked for the retired
  // `flow`; the drawer refuses it, the renderer then emits no figure element at all, and seven of
  // those pages carried no figure while nothing reported anything. A page missing a figure it
  // asked for looks exactly like a page that asked for none.
  const withSpec = (spec) => `# c\n\n\`\`\`dg\n${spec}\n\`\`\`\n`;
  // The spec carries a caption, because a spec without one is now a finding of its own and this
  // block is about whether a figure DRAWS. The caption gap has its own cases below.
  const good = '{ "kind": "map", "caption": "the two boxes and the link between them", "boxes": [{ "id": "a", "label": "A" }, { "id": "b", "label": "B" }], "links": [{ "from": "a", "to": "b", "label": "to" }] }';

  one("a seat whose spec draws is clean",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: withSpec(good) }), ["figure", "check", "docs"]),
      has("clean — 1 page"));
  one("a retired kind is named, rather than silently drawing nothing",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: withSpec(good.replace('"map"', '"flow"')) }), ["figure", "check", "docs"]),
      (g) => /spec1:/.test(g) && /flow/.test(g));
  one("a spec that is not valid JSON says so",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: withSpec('{ "kind": "map", oops }') }), ["figure", "check", "docs"]),
      has("not valid JSON"));
  one("and the finding names which spec on the page",
      run(repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: withSpec(good) + "\n" + withSpec(good.replace('"map"', '"flow"')) }), ["figure", "check", "docs"]),
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
  const at = (spec) => repo({ [`docs/${SEAT.constructs}/01-core/01-boot.md`]: withSpec(spec) });
  // The exit CODE is half of what a SOFT means, and `run` above reports stdout alone.
  const statusOf = (root, args) => {
    try {
      execFileSync(process.execPath, [TOOL, "docs", ...args],
        { encoding: "utf8", cwd: root, env: { ...process.env, SPN_WORKSPACE: root, SPN_TEMPLATES: TEMPLATES } });
      return 0;
    } catch (e) { return e.status ?? -1; }
  };

  one("a spec with neither field is named, and the kind word a screen reader would announce with it",
      run(at(mute), ["figure", "check", "docs"]),
      (g) => /✗ RULE figure/.test(g) && /spec1:/.test(g) && /`map`/.test(g));
  one("it is counted as a RULE",
      run(at(mute), ["figure", "check", "docs"]),
      has("1 RULE, 0 SOFT"));
  one("and the command refuses, so no new figure joins the corpus without one",
      statusOf(at(mute), ["figure", "check", "docs"]), 1);
  // ONLY `caption` RENDERS A `<figcaption>` — `render.ts` reads that field alone and `title` becomes
  // the `aria-label`. A spec with a title only satisfies the words *neither title nor caption* and
  // still leaves the reader with no caption, so it is reported too.
  one("a `title` with no `caption` is refused too, because a title renders no caption",
      run(at(titled), ["figure", "check", "docs"]),
      (g) => /✗ RULE figure/.test(g) && /only a `caption` renders/.test(g));
  one("a spec that carries a caption is silent",
      run(at(captioned), ["figure", "check", "docs"]),
      has("clean — 1 page"));
  // A spec can fail both ways at once, and each fault is its own line. The retired kind reports
  // three of them — the kind, the caption, and the figure the page then never renders — so the
  // case names the faults rather than counting them, which a third rule would make wrong again.
  one("and a spec that draws nothing AND says nothing names both faults, not the first one",
      run(at(mute.replace('"map"', '"flow"')), ["figure", "check", "docs"]),
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
      headerSources("// RESTATES: RD.DEVEX.WORKSPACE.118 and the layer promise, per docs/a/01-thing.md")[0].cited,
      (got) => got.length === 1 && got[0] === "docs/a/01-thing.md");
  one("a second header deeper in the file is found too",
      headerSources("// RESTATES: docs/a/01-x.md\n\ncode();\n\n// RESTATES: docs/b/02-y.md\n"),
      (got) => got.length === 2 && got[1].cited[0] === "docs/b/02-y.md");

  // END TO END, over a fixture tree: a path is a claim about a LOCATION and a bare name a claim
  // about EXISTENCE, so the two are judged differently. Judging both as paths reported six correct
  // headers as broken; judging both by name would have hidden all nine renamed ones.
  const bookAt = join(BASE, `hbook${made += 1}`);
  for (const [rel, body] of Object.entries({
    [`docs/${POCKET.registers}/decisions.md`]: "# decisions\n\n| RD.DEVEX.WORKSPACE.118 | a row |\n",
    "CONCEPT.md": "# c\n",
    [`docs/${SEAT.capabilities}/01-devex/05-real.md`]: "# real\n",
  })) {
    mkdirSync(join(bookAt, rel, ".."), { recursive: true });
    writeFileSync(join(bookAt, rel), body, "utf8");
  }
  const pluginAt = join(BASE, `hplug${made += 1}`);
  const write = (rel, body) => {
    mkdirSync(join(pluginAt, rel, ".."), { recursive: true });
    writeFileSync(join(pluginAt, rel), body, "utf8");
  };
  write("packages/plugin-spn-x/refs/a.md", "# a ref\n");
  write("packages/plugin-spn-x/hooks/good.ts", `// RESTATES: docs/${SEAT.capabilities}/01-devex/05-real.md § A part\n`);
  write("packages/plugin-spn-x/hooks/bare.ts", "// RESTATES: 05-real.md § A part, named without a path\n");
  write("packages/plugin-spn-x/hooks/bad.ts", `// RESTATES: docs/${SEAT.capabilities}/01-gone/05-real.md § A part\n`);
  const drift = (args) => {
    try {
      return { out: execFileSync(process.execPath, [TOOL, "restates", "check", ...args],
        { encoding: "utf8", cwd: pluginAt }), status: 0 };
    } catch (e) { return { out: String(e.stdout ?? ""), status: e.status ?? -1 }; }
  };
  const run2 = drift([bookAt]);
  one("a header naming a path that is not there is reported",
      run2.out, has("packages/plugin-spn-x/hooks/bad.ts"));
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
  const { findBook } = await import("../../../src/scripts/commands/restates/check.ts");
  const book = (name) => ({
    [`${name}/docs/${POCKET.registers}/decisions.md`]: "# decisions\n",
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
  for (const [rel, body] of Object.entries({ [`docs/${POCKET.registers}/decisions.md`]: "# d\n", "CONCEPT.md": "# c\n" })) {
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
    "# C\n\n`For: Architect` · `Status: ✅ DONE`\n\n" + linesFor("1.0.0").stylesheet + "\n" +
    `<p>The manifest <code>${name}</code> declares it:</p>\n<pre>{ "kind": "MODULE_SERVER" }</pre>\n`;
  one("a bare file name is not read as a path to open",
      run(repo({ [`${CORE_PAGES}/a-construct.html`]: withFig("spkind.json") }), ["audit", "check", "docs"]),
      lacks("no such file exists"));
  one("a real path that is not there is still a RULE",
      run(repo({ [`${CORE_PAGES}/a-construct.html`]: withFig("packages/gone/spkind.json") }), ["audit", "check", "docs"]),
      has("a figure names `packages/gone/spkind.json`, and no such file exists"));
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
    [`docs/${SEAT.constructs}/01-core/01-boot.md`]: seat("boot"),
    [`docs/${SEAT.capabilities}/README.md`]: face("Capabilities"),
    [`docs/${SEAT.capabilities}/01-core/README.md`]: face("Capabilities — core"),
    [`docs/${SEAT.capabilities}/01-core/pkg-ts/README.md`]: face("Capabilities — pkg-ts"),
    [`docs/${SEAT.capabilities}/01-core/pkg-ts/01-boot.md`]: chapter("01-boot.md", "boot"),
    [`docs/${SEAT.capabilities}/01-core/pkg-ts/02-log.md`]: chapter("02-log.md", "log"),
  });
  run(ws, ["face", "write", "docs"]);
  const pkgFace = readAt(ws, `docs/${SEAT.capabilities}/01-core/pkg-ts/README.md`);

  // A CHAPTER REALIZES A CONSTRUCT; IT GOVERNS NO SOURCE FOLDER. The mirror-per-folder Map derived
  // `src/01-boot/` from a chapter's file name and named a folder that does not exist.
  one("a package face's Map names the construct each chapter realizes", pkgFace,
      (g) => /\| Chapter \| Realizes \| Carries \| Status \|/.test(g));
  one("and never invents a src folder from a chapter's file name", pkgFace, lacks("src/01-boot"));
  one("every chapter beside it is a row", pkgFace,
      (g) => g.includes("01-boot.md") && g.includes("02-log.md"));

  // The bug a 6b agent found by probing rather than by trusting: the tag-line pattern ended at the
  // Status chip, so a `Realizes:` chip made it miss and write a SECOND tag line under the title.
  const ch = readAt(ws, `docs/${SEAT.capabilities}/01-core/pkg-ts/01-boot.md`);
  one("a chapter carrying a Realizes chip keeps exactly one tag line", ch,
      (g) => (g.match(/^`For:/gm) ?? []).length === 1);
  one("and the chip the author added survives the rewrite", ch, has("· `Realizes: boot`"));
  one("running face twice writes the same bytes", (run(ws, ["face", "write", "docs"]), readAt(ws, `docs/${SEAT.capabilities}/01-core/pkg-ts/01-boot.md`)), ch);

  // A seat-level face is still the older shape, because it lists domains and not chapters.
  one("a seat face is not turned into a chapter list",
      readAt(ws, `docs/${SEAT.capabilities}/README.md`), lacks("| Chapter | Realizes |"));
}

// ---------------------------------------------------------------- the status a run writes (Q107)

console.log("\n=== the plugins' own run writes the two cells a run owns, and no others");
{
  // The one writer, run the way this repository's own runner runs it: the whole tier, one named run.
  const results = (root, rows, tier = "UNIT") => {
    const f = join(root, "tests", ".output", tier.toLowerCase(), "runs", "q1.json");
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, JSON.stringify({ run: "q1", tier, phase: null, ranAt: "2026-09-22T00:00:00Z", env: "local", results: rows }), "utf8");
    return "q1";
  };
  const status = (root, run) => {
    try {
      return execFileSync(process.execPath, [TOOL, "behaviours", "stamp", "write", run, root, "--reach", "repository"], { encoding: "utf8" });
    } catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
  };

  // Nine cells, `Where` included — the grammar the chapter states today. A parser pinned to the
  // older eight would see no register here and report a confident zero.
  const nine = (rows) =>
    "<!-- spn:doc\n" + JSON.stringify({ id: "b", variant: "behaviors", title: "b", lenses: ["QA"], status: "PLANNING", summary: "s" }, null, 2) + "\n-->\n\n# b\n\n" +
    "| Id | Who | Does | Sees | Where | Type | Tier | Status | Updated at |\n" +
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n" +
    rows.map((r) => `| ${r[0]} | A person | does | sees | pkg | POSITIVE | ${r[1]} | ${r[2]} | ${r[3] ?? "—"} |\n`).join("");

  const ws = repo({ [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: nine([
    ["MKT.DOCS.01", "UNIT", "PLANNED"],
    ["MKT.DOCS.02", "UNIT", "PLANNED"],
    ["MKT.DOCS.03", "UNIT", "MANUAL"],
    ["MKT.DOCS.04", "JOURNEY", "PLANNED"],
    ["MKT.DOCS.05", "UNIT", "SUCCESS", "2026-01-01T00:00:00.000Z"],
  ]) });
  const out = status(ws, results(ws, [
    { id: "MKT.DOCS.01", tier: "UNIT", status: "SUCCESS", title: "[MKT.DOCS.01] it works" },
    { id: "MKT.DOCS.02", tier: "UNIT", status: "FAILED", title: "[MKT.DOCS.02] it does not" },
    { id: "MKT.DOCS.03", tier: "UNIT", status: "SUCCESS", title: "[MKT.DOCS.03] a hand check" },
  ]));
  const reg = readAt(ws, `docs/${SEAT.behaviors}/01-core/01-boot.md`);
  one("a nine-cell register is read, not skipped for its width", out, has("MKT.DOCS.01"));
  one("a proven row becomes SUCCESS", reg, (g) => /MKT\.DOCS\.01 \|.*\| SUCCESS \|/.test(g));
  one("a failing case makes the row FAILED, not absent", reg, (g) => /MKT\.DOCS\.02 \|.*\| FAILED \|/.test(g));
  one("MANUAL is never written over, even by a green case", reg, (g) => /MKT\.DOCS\.03 \|.*\| MANUAL \|/.test(g));
  one("a row in a tier this run did not cover is left alone", reg, (g) => /MKT\.DOCS\.04 \|.*\| PLANNED \|/.test(g));
  // A row no result names has no case citing it any more, so it goes back to what a row is at
  // birth — the book's rule, "delete a case and its row falls back to PLANNED".
  one("a row in a covered tier that nothing named goes back to PLANNED", reg, (g) => /MKT\.DOCS\.05 \|.*\| PLANNED \|/.test(g));
  one("Updated at moves with the status, and names the run", reg, has("2026-09-22T00:00:00Z · q1"));
  one("a row nobody proved keeps the date it had", reg, (g) => !/MKT\.DOCS\.04 \|.*2026-09-22/.test(g));

  // `check` reads and writes nothing, and the count is the exit code so a pipeline can gate on drift.
  const ws2 = repo({ [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: nine([["MKT.DOCS.01", "UNIT", "PLANNED"]]) });
  const before = readAt(ws2, `docs/${SEAT.behaviors}/01-core/01-boot.md`);
  let code = 0;
  try {
    execFileSync(process.execPath, [TOOL, "behaviours", "stamp", "check", results(ws2, [{ id: "MKT.DOCS.01", tier: "UNIT", status: "SUCCESS", title: "t" }]), ws2, "--reach", "repository"], { encoding: "utf8" });
  } catch (e) { code = e.status; }
  one("`check` changes nothing on disk", readAt(ws2, `docs/${SEAT.behaviors}/01-core/01-boot.md`), before);
  one("and the exit code is the number of rows that would change", code, 1);

  // One red among several greens is a red row.
  const ws3 = repo({ [`docs/${SEAT.behaviors}/01-core/01-boot.md`]: nine([["MKT.DOCS.01", "UNIT", "PLANNED"]]) });
  status(ws3, results(ws3, [
    { id: "MKT.DOCS.01", tier: "UNIT", status: "SUCCESS", title: "a" },
    { id: "MKT.DOCS.01", tier: "UNIT", status: "FAILED", title: "b" },
  ]));
  one("a row proved by several cases is green only when every one of them is",
      readAt(ws3, `docs/${SEAT.behaviors}/01-core/01-boot.md`), (g) => /MKT\.DOCS\.01 \|.*\| FAILED \|/.test(g));
}

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
