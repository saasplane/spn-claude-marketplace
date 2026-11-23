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
  // The page is a page with no figure and no mode switch: the docs design language's behaviour (the mode switch, a figure's steps,
  // its tap to open, its motion) finds nothing on it, and the script must still colour the blocks.
  const document = {
    getElementById: () => null,
    querySelector: () => null,
    documentElement: { getAttribute: () => null, setAttribute() {} },
    querySelectorAll: (selector) => (selector === "pre[data-lang]" ? blocks.filter((pre) => pre.lang !== null) : []),
  };
  vm.runInNewContext(SCRIPT, { document: document, window: { addEventListener() {}, scrollY: 0, matchMedia: () => ({ matches: false }) } });
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
    coloured: `${comment("# one environment row")}\n${type("setup")}: dev\n${type("region")}: in`,
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
const [unknown] = open([block("cobol", "folder/\n  file")]);
ok("a block with a language the script does not know is not coloured", unknown.innerHTML === null);
// A file tree: a folder in the type colour, a file in the ink, the words after its gap in the comment colour (N010).
const [tree] = open([block("tree", "docs/\n  README.md   the map")]);
ok("a tree block colours its folder and its comment, and leaves its file plain",
  tree.innerHTML === `${type("docs/")}\n  README.md   ${comment("the map")}`, tree.innerHTML);
const [textTree] = open([block("text", "folder/\n  file")]);
ok("a text block shaped as a tree is coloured as one", textTree.innerHTML === `${type("folder/")}\n  file`, textTree.innerHTML);
const [plainText] = open([block("text", "the first line is not a folder\n  so this stays plain")]);
ok("a text block not shaped as a tree is not coloured", plainText.innerHTML === null);
const [drawn] = open([block("tree", "repo/\n├── docs/\n│   └── a.md      new      the page")]);
ok("a tree drawn with box marks keeps its branches quiet and colours a status word as a diff does",
  drawn.innerHTML.includes('<span class="sds-tk-g">├── </span>') && drawn.innerHTML.includes('<span class="sds-tk-add">new</span>')
  && drawn.innerHTML.includes(comment("the page")) && drawn.innerHTML.includes(type("docs/")), drawn.innerHTML);
const [yaml] = open([block("yaml", "region: in\nactive: true")]);
ok("a yaml block colours its keys and its true, false and null",
  yaml.innerHTML.includes(type("region")) && yaml.innerHTML.includes(type("active")) && yaml.innerHTML.includes(keyword("true")), yaml.innerHTML);
const [bash] = open([block("bash", "# a comment")]);
ok("a bash block is coloured as sh", bash.innerHTML === comment("# a comment"), bash.innerHTML);
const [jsonc] = open([block("jsonc", "// a note")]);
ok("a jsonc block colours its // comment", jsonc.innerHTML === comment("// a note"), jsonc.innerHTML);
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

// MKT.SCRIPTS.554: the approach page's status bar keeps each arc on one line, and its cells fill the row.
const SOURCE = readFileSync(resolve(HERE, "src", "styles", "sds-docs.src.css"), "utf8");
const ruleOf = (selector) => new RegExp(`\\${selector}\\{([^}]*)\\}`).exec(SOURCE)?.[1] ?? "";
ok("[MKT.SCRIPTS.554] an arc's count never wraps", /flex:none/.test(ruleOf(".sds-arc-count")) && /white-space:nowrap/.test(ruleOf(".sds-arc-count")));
ok("[MKT.SCRIPTS.554] the status bar's cells fill the row", /flex:1 0 auto/.test(ruleOf(".sds-chip")));

// N017: the tabs block's script. A fake page holds one tabset of three tabs; the script is run on it as a browser would.
console.log("=== the shared script — a tabset shows one panel, takes the arrow keys, and keeps the open tab in the hash");
{
  const el = (tag, attrs = {}) => ({
    tag, attrs: { ...attrs }, hidden: false, tabIndex: 0, listeners: {}, children: [], classes: new Set(), dataset: {}, focused: false,
    getAttribute(n) { return this.attrs[n] ?? null; }, setAttribute(n, v) { this.attrs[n] = String(v); },
    addEventListener(t, f) { this.listeners[t] = f; }, focus() { this.focused = true; }, scrollIntoView() {}, scrollBy() {},
    classList: { add: (c) => classes.add(c) }, appendChild(c) { this.children.push(c); return c; }, scrollLeft: 0, scrollWidth: 0, clientWidth: 0,
  });
  const classes = new Set();
  const run = (hash) => {
    const tabs = ["a", "b", "c"].map((id, i) => el("button", { role: "tab", "aria-controls": `p-${id}`, "aria-selected": String(i === 0) }));
    const panels = Object.fromEntries(["a", "b", "c"].map((id) => [`p-${id}`, el("div")]));
    const bar = el("div"); bar.parentNode = { insertBefore() {} };
    const set = { querySelectorAll: () => tabs, querySelector: () => bar, classList: { add: (c) => classes.add(c) } };
    classes.clear();
    const document = {
      getElementById: (id) => panels[id] ?? null, querySelector: () => null, createElement: (t) => el(t),
      documentElement: { getAttribute: () => null, setAttribute() {} },
      querySelectorAll: (selector) => (selector === ".sds-tabset" ? [set] : []),
    };
    vm.runInNewContext(SCRIPT, { document, location: { hash }, window: { addEventListener() {}, scrollY: 0, matchMedia: () => ({ matches: false }) } });
    return { tabs, panels };
  };
  const { tabs, panels } = run("");
  const shown = () => Object.values(panels).map((p) => !p.hidden);
  ok("a tabset opens on its selected tab: one panel shown, the others hidden, and the set is marked ready", JSON.stringify(shown()) === "[true,false,false]" && tabs[0].tabIndex === 0 && tabs[1].tabIndex === -1 && classes.has("sds-is-ready"));
  tabs[0].listeners.keydown({ key: "ArrowRight", preventDefault() {} });
  ok("the right arrow opens the next tab and moves the focus to it", JSON.stringify(shown()) === "[false,true,false]" && tabs[1].focused && tabs[1].getAttribute("aria-selected") === "true");
  tabs[1].listeners.keydown({ key: "End", preventDefault() {} });
  ok("End opens the last tab, and the right arrow from the last wraps to the first", JSON.stringify(shown()) === "[false,false,true]" && (tabs[2].listeners.keydown({ key: "ArrowRight", preventDefault() {} }), JSON.stringify(shown()) === "[true,false,false]"));
  tabs[0].listeners.keydown({ key: "ArrowLeft", preventDefault() {} });
  ok("the left arrow from the first wraps to the last, and Home opens the first", JSON.stringify(shown()) === "[false,false,true]" && (tabs[2].listeners.keydown({ key: "Home", preventDefault() {} }), JSON.stringify(shown()) === "[true,false,false]"));
  tabs[1].listeners.click();
  ok("a click opens its tab", JSON.stringify(shown()) === "[false,true,false]");
  ok("the tab the address's hash names is the one open at the start", JSON.stringify(Object.values(run("#p-c").panels).map((p) => !p.hidden)) === "[false,false,true]");
}

// N017: the rules of the new blocks are in the stylesheet source and its build, and the unit styles are the design system's, scoped.
console.log("=== the shared stylesheet — tabs, groups, facts, the fold and the inline unit");
{
  const BUILT = readFileSync(resolve(HERE, "src", "styles", "sds-docs.css"), "utf8");
  for (const selector of [".sds-tabset-bar", ".sds-tabset[data-type='PILL']", ".sds-group-jumps", ".sds-group", ".sds-tile-facts", ".sds-tiles[data-layout='LIST']", ".sds-catalog-table", ".sds-tile-media", ".sds-fold", ".sds-unit-pair"]) {
    const plain = selector.replace(/'/g, "");
    ok(`\`${selector}\` is in the source and the built stylesheet`, SOURCE.includes(selector) && (BUILT.includes(selector) || BUILT.includes(plain) || BUILT.includes(selector.replace(/'/g, '"'))));
  }
  ok("a done and a landed badge read the success token", /--sds-status-done:\s*var\(--sds-success\)/.test(SOURCE) && /--sds-status-landed-soft:\s*var\(--sds-success-soft\)/.test(SOURCE));
  const { scopeUnitCss, scopeSelector } = await import(pathToFileURL(resolve(HERE, "..", "..", "scripts", "build-unit-styles.mjs")).href);
  ok("the base reset's `*`, `html`, `body` and element selectors become descendants or the unit itself",
    JSON.stringify(scopeSelector("*")) === '[".sds-unit *"]' && JSON.stringify(scopeSelector("html")) === '[".sds-unit"]' && JSON.stringify(scopeSelector("body")) === '[".sds-unit"]' && JSON.stringify(scopeSelector("h1")) === '[".sds-unit h1"]' && JSON.stringify(scopeSelector(".ds\\:flex")) === '[".sds-unit .ds\\\\:flex"]');
  ok("`:root` and `[data-mode=light]` become `.sds-unit` and `.sds-unit[data-mode=light]`, and `[data-mode=dark]` its dark twin, also as a block inside the unit",
    JSON.stringify(scopeSelector(":root")) === '[".sds-unit"]' && JSON.stringify(scopeSelector(":root[data-mode=dark] .a")) === '[".sds-unit[data-mode=dark] .a"]'
      && JSON.stringify(scopeSelector("[data-mode=light]")) === '[".sds-unit[data-mode=light]",".sds-unit [data-mode=light]"]' && JSON.stringify(scopeSelector('[data-mode="dark"] p')) === '[".sds-unit[data-mode=dark] p",".sds-unit [data-mode=dark] p"]');
  const cut = scopeUnitCss("/*! lib */*,:before{box-sizing:border-box}:root,:host{--a:1}[data-mode=dark]{--a:2}@font-face{font-family:F;src:url(../assets/fonts/geist/Geist-Variable.woff2)}@property --x{syntax:'*';inherits:false}@keyframes k{from{opacity:0}to{opacity:1}}@layer base{h1{margin:0}@media (min-width:48rem){.a,.b{color:red}}}@layer a,b;", "v1.0.0");
  ok("a cut scopes every rule, in a layer and a media query too, and a list keeps each of its selectors",
    cut.includes(".sds-unit *,.sds-unit :before{box-sizing:border-box}") && cut.includes(".sds-unit{--a:1}") && cut.includes(".sds-unit[data-mode=dark],.sds-unit [data-mode=dark]{--a:2}")
      && cut.includes("@layer base{.sds-unit h1{margin:0}@media (min-width:48rem){.sds-unit .a,.sds-unit .b{color:red}}}") && cut.includes("@layer a,b;"), cut);
  ok("@font-face, @property and @keyframes stay global, and a font's url reads the version folder's fonts",
    cut.includes("@font-face{font-family:F;src:url(fonts/Geist-Variable.woff2)}") && cut.includes("@property --x{syntax:'*';inherits:false}") && cut.includes("@keyframes k{from{opacity:0}to{opacity:1}}"), cut);
  ok("a cut keeps the licence comment and says where it came from", cut.startsWith("/* The design system's own stylesheet, support-web-ds-ts v1.0.0,") && cut.includes("/*! lib */"));
  const unit = readFileSync(resolve(HERE, "src", "styles", "ds-unit.css"), "utf8");
  ok("ds-unit.css is in the styles folder, scoped: its first rule outside a layer or font is under .sds-unit, and no global body or html rule is left",
    unit.includes(".sds-unit") && !/(^|})(html|body|:root|\*)[,{]/.test(unit.replace(/\/\*[\s\S]*?\*\//g, "")), unit.slice(0, 300));
}

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
