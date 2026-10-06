// The shared script's colouring of a code block (`05-artifacts.md` § One stylesheet, served in versions): a `pre`
// tagged with its language is coloured when the page opens, and the result is what the page tools' own `colour`
// gives for the same text, so a block looks the same whichever of the two coloured it.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";

const HERE = resolve(import.meta.dirname, "..", "..", "..");
const SCRIPT = readFileSync(resolve(HERE, "src", "styles", "sds-docs.js"), "utf8");
const { colour } = await import(pathToFileURL(resolve(HERE, "src", "scripts", "lib", "figures.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** One `pre` as the script sees it: its language tag, its text, and whether it already holds an element. */
const block = (lang, text, holdsElement = false) => ({
  lang: lang,
  textContent: text,
  innerHTML: null,
  children: holdsElement ? [{}] : [],
  getAttribute(name) { return name === "data-lang" ? this.lang : null; },
});

/** Runs the whole script on a page that holds these blocks and nothing else. */
const open = (blocks) => {
  const document = {
    getElementById: () => null,
    querySelectorAll: (selector) => (selector === "pre[data-lang]" ? blocks : []),
  };
  vm.runInNewContext(SCRIPT, { document: document, window: { addEventListener() {}, scrollY: 0 }, Array: Array, String: String, Math: Math, RegExp: RegExp });
  return blocks;
};

const SAMPLES = {
  ts: "export interface SPRepo {\n  name: CDTString;   // what a person calls it\n  size: 26 | null;\n  label: 'a class of <one>';\n}",
  json: '{\n  "type": "APPS",\n  "deploys": true,\n  "platform": null,\n  "count": 3\n}',
  yaml: "# one environment row\nsetup: dev\nregion: in",
  sql: "CREATE TABLE iam_identity (\n  id CHAR(26) PRIMARY KEY, -- the row's id\n  handle VARCHAR(180) NOT NULL\n);",
  sh: "# wire the agent\nspnutils repo agent-sync",
  md: "| Estate | `SPEstate` | everything a company's work runs on |",
  diff: "  kept as it is\n- what the file says today\n+ what it will say, with <a tag>",
};

console.log("=== the shared script — a tagged block is coloured as the page tools colour it");
for (const [lang, text] of Object.entries(SAMPLES)) {
  const [pre] = open([block(lang, text)]);
  ok(`a \`${lang}\` block is coloured, and equals the page tools' colouring`, pre.innerHTML === colour(text, lang),
    `script: ${JSON.stringify(pre.innerHTML)}\n        tools:  ${JSON.stringify(colour(text, lang))}`);
}
const [typed] = open([block("ts", SAMPLES.ts)]);
ok("a keyword, a type, a string, a comment and a number each take their class",
  ["sds-tk-k", "sds-tk-t", "sds-tk-s", "sds-tk-c", "sds-tk-n"].every((cls) => typed.innerHTML.includes(`class="${cls}"`)), typed.innerHTML);
ok("a `<` inside a string is escaped, never written as a tag", typed.innerHTML.includes("&lt;one&gt;") && !typed.innerHTML.includes("<one>"));

console.log("=== the shared script — what it leaves alone");
const [written] = open([block("ts", "export const done = 1;", true)]);
ok("a block that already holds an element keeps what its file says", written.innerHTML === null);
const [unknown] = open([block("text", "folder/\n  file")]);
ok("a block with a language the script does not know is not coloured", unknown.innerHTML === null);
ok("a page with no tagged block runs to its end", open([]).length === 0);

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
