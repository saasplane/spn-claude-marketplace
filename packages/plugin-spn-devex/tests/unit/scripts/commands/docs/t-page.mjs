import { PLUGIN } from "../../../../helpers/harness.mjs";
// `docs page` — producing a construct page from its seat file: the rail, the way back, re-based
// links, tables, HTML escaping and lists carried through the produced page correctly.
//
// THIS SUITE EXISTS BECAUSE THE TOOL WRITES INTO EVERY DOCUMENT IN THE CORPUS. Nothing here is a
// port, so the fixtures are the whole proof. Each case builds a throwaway tree and runs the real
// command against it, through the same `cli.ts` dispatcher `spn-devex docs page` runs through.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-page-"));
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

/** `args` is the action's own argv — `["page", "docs/…"]` — run through `cli.ts docs <args>`. */
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
    const templates = resolve(PLUGIN, "..", "..", "..",
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
    // THE TEMPLATE'S FOOTER IS A NOTE TO ITS AUTHOR, never furniture. Copied into every produced
    // page, readers of 122 construct pages met "A template from workstream 008 · copy it …", and an
    // edit to the note made every one of them stale at once. The template here carries a marked
    // footer, so the case fails if any of it reaches the page.
    const noted = mkdtempSync(join(tmpdir(), "spn-templates-"));
    mkdirSync(join(noted, "pages"));
    writeFileSync(join(noted, "pages", "construct-template.html"),
      bookTemplate.replace(/<footer>[\s\S]*?<\/footer>/, "") +
      "\n<footer>AUTHOR-NOTE: copy this template, keep the comments</footer>\n");
    process.env.SPN_TEMPLATES = noted;
    run(ws, ["page", "docs/02-constructs/01-core/thing.md"]);
    const footed = readAt(ws, "docs/artifacts/constructs/01-core/thing-construct.html");
    process.env.SPN_TEMPLATES = templates;
    rmSync(noted, { recursive: true, force: true });
    one("the template's author note never reaches a produced page", footed, (g) => !/AUTHOR-NOTE/.test(g) && !/<footer>/.test(g));
    one("nor does the book template's own footer", page, (g) => !/A template from workstream/.test(g) && !/<footer>/.test(g));
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
console.log("\n=== the rail names the page, and the way back names where it goes (Q238, Q239)");
{
  const templates = resolve(PLUGIN, "..", "..", "..",
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
  const templates = resolve(PLUGIN, "..", "..", "..",
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


console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
