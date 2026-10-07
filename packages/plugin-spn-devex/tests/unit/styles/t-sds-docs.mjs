// The shared script's colouring of a code block (`05-artifacts.md` § One stylesheet, served in versions): a page's
// file holds plain code in a `pre` tagged with its language, and the script colours the block when the page opens.
// The script is the one place the language rules live, so each case states the markup a language's sample must
// become, and the page tools are read to prove they hold no second copy.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";

const HERE = resolve(import.meta.dirname, "..", "..", "..");
const SCRIPT = readFileSync(resolve(HERE, "src", "styles", "sds-docs.js"), "utf8");
const FIGURES = resolve(HERE, "src", "scripts", "lib", "figures.ts");
const RENDERER = resolve(HERE, "src", "scripts", "lib", "render.ts");

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

/** Runs the whole script on a page that holds these blocks and nothing else. A block with no tag is not a `pre[data-lang]`. */
const open = (blocks) => {
  const document = {
    getElementById: () => null,
    querySelectorAll: (selector) => (selector === "pre[data-lang]" ? blocks.filter((pre) => pre.lang !== null) : []),
  };
  vm.runInNewContext(SCRIPT, { document: document, window: { addEventListener() {}, scrollY: 0 } });
  return blocks;
};

// The marks the script writes, one for each class of the stylesheet. The text inside is already escaped.
const mark = (name) => (text) => `<span class="sds-tk-${name}">${text}</span>`;
const keyword = mark("k"), type = mark("t"), string = mark("s"), comment = mark("c"), number = mark("n");
const added = mark("add"), removed = mark("del");

/** For each language: the plain code a page's file holds, and the markup the block holds once the page is open. */
const SAMPLES = {
  ts: {
    plain: "export interface SPRepo {\n  name: CDTString;   // what a person calls it\n  size: 26 | null;\n  label: 'a class of <one>';\n}",
    coloured: `${keyword("export")} ${keyword("interface")} ${type("SPRepo")} {\n  name: ${type("CDTString")};   ${comment("// what a person calls it")}\n`
      + `  size: ${number("26")} | ${keyword("null")};\n  label: ${string("'a class of &lt;one&gt;'")};\n}`,
  },
  json: {
    plain: '{\n  "type": "APPS",\n  "deploys": true,\n  "platform": null,\n  "count": 3\n}',
    coloured: `{\n  ${string('"type"')}: ${string('"APPS"')},\n  ${string('"deploys"')}: ${keyword("true")},\n  ${string('"platform"')}: ${keyword("null")},\n`
      + `  ${string('"count"')}: ${number("3")}\n}`,
  },
  yaml: {
    plain: "# one environment row\nsetup: dev\nregion: in",
    coloured: `${comment("# one environment row")}\nsetup: dev\nregion: in`,
  },
  sql: {
    plain: "CREATE TABLE iam_identity (\n  id CHAR(26) PRIMARY KEY, -- the row's id\n  handle VARCHAR(180) NOT NULL\n);",
    coloured: `${keyword("CREATE")} ${keyword("TABLE")} iam_identity (\n  id CHAR(${number("26")}) ${keyword("PRIMARY")} ${keyword("KEY")}, ${comment("-- the row's id")}\n`
      + `  handle VARCHAR(${number("180")}) ${keyword("NOT")} ${keyword("NULL")}\n);`,
  },
  sh: {
    plain: "# wire the agent\nspnutils repo agent-sync",
    coloured: `${comment("# wire the agent")}\nspnutils repo agent-sync`,
  },
  md: {
    plain: "| Estate | `SPEstate` | everything a company's work runs on |",
    coloured: `| Estate | ${string("`SPEstate`")} | everything a company's work runs on |`,
  },
  diff: {
    plain: "  kept as it is\n- what the file says today\n+ what it will say, with <a tag>",
    coloured: `  kept as it is\n${removed("- what the file says today")}\n${added("+ what it will say, with &lt;a tag&gt;")}`,
  },
};

console.log("=== the shared script — a block tagged with its language is coloured when the page opens");
for (const [lang, sample] of Object.entries(SAMPLES)) {
  const [pre] = open([block(lang, sample.plain)]);
  ok(`a \`${lang}\` block of plain code takes the marks of its language`, pre.innerHTML === sample.coloured,
    `script: ${JSON.stringify(pre.innerHTML)}\n        wanted: ${JSON.stringify(sample.coloured)}`);
}
const [typed] = open([block("ts", SAMPLES.ts.plain)]);
ok("a keyword, a type, a string, a comment and a number each take their class",
  ["sds-tk-k", "sds-tk-t", "sds-tk-s", "sds-tk-c", "sds-tk-n"].every((cls) => String(typed.innerHTML).includes(`class="${cls}"`)), String(typed.innerHTML));
ok("a `<` inside a string is escaped, never written as a tag", String(typed.innerHTML).includes("&lt;one&gt;") && !String(typed.innerHTML).includes("<one>"));
const [worded] = open([block("ts", "// the class a const names\nconst label = 'class';")]);
ok("a keyword inside a comment or a string is not coloured as code, and the script never colours its own marks",
  worded.innerHTML === `${comment("// the class a const names")}\n${keyword("const")} label = ${string("'class'")};`, String(worded.innerHTML));

console.log("=== the shared script — what it leaves alone");
const [untagged] = open([block(null, "folder/\n  file 26")]);
ok("a block with no language is not coloured", untagged.innerHTML === null);
const [unknown] = open([block("text", "folder/\n  file")]);
ok("a block with a language the script does not know is not coloured", unknown.innerHTML === null);
const [written] = open([block("ts", "export const done = 1;", true)]);
ok("a block that already holds an element keeps what its file says", written.innerHTML === null);
const [first, second] = open([block(null, "plain"), block("sh", "# after an untagged block")]);
ok("a block with no language does not stop the block after it", first.innerHTML === null && second.innerHTML === comment("# after an untagged block"));
ok("a page with no tagged block runs to its end", open([]).length === 0);

console.log("=== the language rules live in the shared script, and the page tools hold no second copy");
const figures = await import(pathToFileURL(FIGURES).href);
ok("the page tools export no function that colours code", !("colour" in figures) && !("stripSpans" in figures), Object.keys(figures).join(" · "));
for (const [name, path] of [["figures.ts", FIGURES], ["render.ts", RENDERER]]) {
  const source = readFileSync(path, "utf8");
  ok(`\`${name}\` holds no keyword list of a language`, !/\bSELECT FROM WHERE\b/.test(source) && !/\bconst let var function\b/.test(source));
}
ok("the shared script holds the keyword lists", /\bSELECT FROM WHERE\b/.test(SCRIPT) && /\bconst let var function\b/.test(SCRIPT));

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
