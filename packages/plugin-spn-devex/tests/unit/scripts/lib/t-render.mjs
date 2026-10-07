// The page renderer and a code block (`05-artifacts.md` § One stylesheet, served in versions): a produced page
// holds plain code in a `pre` tagged with its language, and no colour. The shared script colours the block when
// the page opens, so the renderer writes the same block a person writes by hand.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..", "..");
const { renderPage } = await import(pathToFileURL(resolve(HERE, "src", "scripts", "lib", "render.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** The page a seat file with this body becomes. */
const produced = (body) => renderPage({
  block: { id: "probe", title: "Probe", status: "DONE", lenses: ["ARCHITECT"], summary: "What a probe is." },
  markdown: `# Probe\n\nThe lead.\n\n## What it is\n\nSome prose.\n\n${body}`,
  workspace: "/workspace",
  location: "/workspace/docs/02-constructs/probe.md",
  furniture: { stylesheet: "<link rel=\"stylesheet\" href=\"sds-docs.css\">", script: "<script src=\"sds-docs.js\"></script>", footer: "" },
}).html;
const fence = (lang, code) => `\`\`\`${lang}\n${code}\n\`\`\`\n`;

/** One sample for each language the shared script colours, as an author types it in a fence. */
const SAMPLES = {
  ts: "export const size = 26; // the size of a class",
  json: "{ \"deploys\": true, \"count\": 3 }",
  yaml: "# one row\nsetup: dev",
  sql: "CREATE TABLE iam_identity (id CHAR(26) PRIMARY KEY); -- the row",
  sh: "# wire the agent\nspnutils repo agent-sync",
  md: "| Estate | `SPEstate` |",
  diff: "- what the file says today\n+ what it will say",
};

console.log("=== the page renderer — a fenced block becomes plain code, tagged with its language");
for (const [lang, code] of Object.entries(SAMPLES)) {
  const html = produced(fence(lang, code));
  ok(`a \`${lang}\` fence is written as \`<pre data-lang="${lang}">\` holding its own text`, html.includes(`<pre data-lang="${lang}">${code}</pre>`),
    html.slice(html.indexOf("<pre"), html.indexOf("</pre>") + 6));
  ok(`and the \`${lang}\` block carries no colour span`, !html.includes("sds-tk-"));
}
const literal = produced(fence("ts", "const label = '<one> & two &amp; three';"));
ok("a `<`, a `>` and every `&` of tagged code are written as entities, so the block shows what its author typed",
  literal.includes(`<pre data-lang="ts">const label = '&lt;one&gt; &amp; two &amp;amp; three';</pre>`),
  literal.slice(literal.indexOf("<pre"), literal.indexOf("</pre>") + 6));
const untagged = produced(fence("", "folder/\n  file 26"));
ok("a fence with no language is written as `<pre>` with no tag", untagged.includes("<pre>folder/\n  file 26</pre>") && !untagged.includes("data-lang"),
  untagged.slice(untagged.indexOf("<pre"), untagged.indexOf("</pre>") + 6));
ok("and it carries no colour span", !untagged.includes("sds-tk-"));

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-render` : `\n  all ${total} passed — t-render`);
process.exit(failed ? 1 : 0);
