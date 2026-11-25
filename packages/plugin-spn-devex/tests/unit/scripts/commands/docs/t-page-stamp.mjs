import { PLUGIN, TEMPLATES_DIR } from "../../../../helpers/harness.mjs";
// `docs page stamp`, and the check that reads it back: an overview records the construct pages it
// summarises, each with the seen hash of its seat file, and is told when one of them has moved
// (RULE.DEVEX.WORKSPACE.581). Each case builds a throwaway tree and runs the real command against it.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, appendFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { SEAT } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-page-stamp-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));
process.env.SPN_TEMPLATES = TEMPLATES_DIR;

let made = 0;
function repo(files) {
  made += 1;
  const root = join(BASE, `r${made}`);
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, "sprepo.json"), JSON.stringify({ type: "APPS", name: "t", config: null }));
  for (const [path, text] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text, "utf8");
  }
  return root;
}
function run(root, args) {
  try {
    return execFileSync(process.execPath, [TOOL, "docs", ...args], { encoding: "utf8", cwd: root, stdio: "pipe", env: { ...process.env, SPN_WORKSPACE: root } });
  } catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
}
const readAt = (root, p) => readFileSync(join(root, p), "utf8");

let n = 0, failed = 0;
function one(name, got, want) {
  n += 1;
  const ok = typeof want === "function" ? want(got) : got === want;
  if (!ok) { failed += 1; console.log(`  FAIL  ${name}\n        got: ${JSON.stringify(String(got).slice(0, 400))}`); }
  else console.log(`  PASS  ${name}`);
}
const has = (s) => (got) => String(got).includes(s);
const lacks = (s) => (got) => !String(got).includes(s);

const seat = (id) => `<!-- spn:doc\n${JSON.stringify({ id, variant: "construct", title: id, lenses: ["ARCHITECT"], status: "PLANNING", dependsOn: [], summary: `What ${id} is.` }, null, 2)}\n-->\n\n# ${id}\n\n\`For: Architect\` · \`Status: 🔮 PLANNING\`\n\n## Boundary\n\nx\n`;
const DOCS = "docs/artifacts/public/docs/01-core";
// The page links the shared stylesheet with the book template's own line, so the check reads it as a page and not as an own copy.
const LINK = readFileSync(resolve(TEMPLATES_DIR, "docs", "pages", "construct-template.html"), "utf8").match(/<link\b[^>]*docs-language\.css"[^>]*>/)[0];
const OVERVIEW = `${DOCS}/core-overview.html`;
const overview = (doors, extra = "") => `<!-- spn:doc
{
  "id": "concept-core-overview",
  "variant": "overview",
  "title": "Core",
  "lenses": ["ARCHITECT"],
  "summary": "The core path.",
  "keywords": ["core"]${extra}
}
-->
${LINK}
<div class="sds-page"><p>Who this is for: an architect.</p>
${doors.map((d) => `<p><a href="${d}">Read it</a></p>`).join("\n")}
<!-- spn:generated glossary — do not edit inside these markers; \`docs.ts face\` writes it -->
<a href="constructs/gloss-construct.html">gloss</a>
<!-- /spn:generated -->
<p><a href="https://example.com/x">out</a> <a href="#s1">in</a></p>
</div>
`;
const tree = (doors, extra) => repo({
  [`docs/${SEAT.constructs}/01-core/thing.md`]: seat("thing"),
  [`docs/${SEAT.constructs}/01-core/other.md`]: seat("other"),
  [`docs/${SEAT.constructs}/01-core/gloss.md`]: seat("gloss"),
  [`docs/${SEAT.constructs}/README.md`]: "# Constructs\n",
  [OVERVIEW]: overview(doors, extra),
});

{
  const ws = tree(["constructs/thing-construct.html", "constructs/other-construct.html#part", "constructs/thing-construct.html"]);
  const before = readAt(ws, OVERVIEW);
  one("[MKT.SCRIPTS.669] an overview with doors and no stamp is told to run it", run(ws, ["page", "check", OVERVIEW]), has("records no construct pages it summarises (2 doors)"));
  const said = run(ws, ["page", "stamp", OVERVIEW]);
  const after = readAt(ws, OVERVIEW);
  const block = JSON.parse(/<!--\s*spn:doc\s*([\s\S]*?)-->/.exec(after)[1]);
  one("[MKT.SCRIPTS.668] stamp writes one entry for each door to a construct page, once, in page order", block.summarises?.map((e) => e.page).join(" "), "constructs/thing-construct.html constructs/other-construct.html");
  one("[MKT.SCRIPTS.668] each entry carries an 8-character seen hash", block.summarises?.every((e) => /^[0-9a-f]{8}$/.test(e.seen)), true);
  one("[MKT.SCRIPTS.668] a door inside a generated region, a hosted address and an anchor are no entries", JSON.stringify(block.summarises), lacks("gloss"));
  one("[MKT.SCRIPTS.668] every other key of the block is kept", [block.id, block.title, block.keywords?.join()].join(" "), "concept-core-overview Core core");
  one("[MKT.SCRIPTS.668] nothing outside the block changes", after.replace(/<!--\s*spn:doc[\s\S]*?-->/, ""), before.replace(/<!--\s*spn:doc[\s\S]*?-->/, ""));
  one("[MKT.SCRIPTS.668] the stamp says what it wrote", said, has("stamped"));
  one("[MKT.SCRIPTS.668] a second stamp changes nothing", [run(ws, ["page", "stamp", OVERVIEW]), readAt(ws, OVERVIEW) === after].join(" "), (g) => g.includes("current") && g.endsWith("true"));
  one("[MKT.SCRIPTS.669] a stamped overview whose constructs are as they were reports nothing of RULE 581", run(ws, ["page", "check", OVERVIEW]), lacks("581"));

  appendFileSync(join(ws, `docs/${SEAT.constructs}/01-core/thing.md`), "\nMore.\n");
  one("[MKT.SCRIPTS.669] a seat file changed since the stamp is reported, naming its page", run(ws, ["page", "check", OVERVIEW]), (g) => g.includes("`constructs/thing-construct.html` has moved") && !g.includes("other-construct.html` has moved"));
  one("[MKT.SCRIPTS.670] page write names the overview a seat leaves owed", run(ws, ["page", "write", `docs/${SEAT.constructs}/01-core/thing.md`]), (g) => g.includes("owed") && g.includes("core-overview.html"));
  one("[MKT.SCRIPTS.670] page write names no overview for a seat it summarises as it is", run(ws, ["page", "write", `docs/${SEAT.constructs}/01-core/other.md`]), lacks("owed"));
  run(ws, ["page", "stamp", OVERVIEW]);
  one("[MKT.SCRIPTS.669] stamping again after the rewrite clears it", run(ws, ["page", "check", OVERVIEW]), lacks("581"));

  writeFileSync(join(ws, OVERVIEW), readAt(ws, OVERVIEW).replace("</div>", '<p><a href="constructs/gloss-construct.html">Read gloss</a></p>\n</div>'));
  one("[MKT.SCRIPTS.669] a door the stamp does not name is reported", run(ws, ["page", "check", OVERVIEW]), has("the door to `constructs/gloss-construct.html` is not in `summarises`"));
  rmSync(join(ws, `docs/${SEAT.constructs}/01-core/other.md`));
  one("[MKT.SCRIPTS.669] an entry whose construct page leads nowhere is reported", run(ws, ["page", "check", OVERVIEW]), has("`constructs/other-construct.html` leads nowhere"));
}

{
  const ws = tree(["constructs/thing-construct.html", "constructs/gone-construct.html"]);
  const before = readAt(ws, OVERVIEW);
  const said = run(ws, ["page", "stamp", OVERVIEW]);
  one("[MKT.SCRIPTS.671] stamp refuses a door to a construct page whose seat file is not there, naming it", said, has("`constructs/gone-construct.html` leads nowhere"));
  one("[MKT.SCRIPTS.671] and writes nothing", readAt(ws, OVERVIEW), before);
  one("[MKT.SCRIPTS.671] stamp refuses a file that is no overview", run(ws, ["page", "stamp", `docs/${SEAT.constructs}/01-core/thing.md`]), has("no overview there"));
}

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
