// `language samples write` — a language's samples drawn from its spec and the catalogue, through a render that is stood in for here.
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const CLI = join(resolve(import.meta.dirname, "..", "..", "..", "..", "..", "src"), "scripts", "cli.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const dir = mkdtempSync(join(tmpdir(), "language-samples-"));
// The render, stood in for: it draws each section as one window, and says a quote is a unit the design system does not build.
const fake = join(dir, "spnutils");
writeFileSync(fake, `#!/usr/bin/env node
const fs = require("node:fs");
const a = process.argv.slice(2);
if (a[0] === "--version") { console.log("spnutils   11.26.0"); process.exit(0); }
const at = (name) => a[a.indexOf(name) + 1];
const tree = JSON.parse(fs.readFileSync(at("--file"), "utf8"));
const renders = {};
for (const mode of at("--modes").split(",")) { renders[mode] = {}; for (const device of at("--devices").split(",")) {
  renders[mode][device] = {
    html: tree.sections.map((s, i) => '<main data-layout-place="window" data-n="' + i + '">' + JSON.stringify(s).length + "</main>").join(""),
    findings: tree.sections.flatMap((s, i) => JSON.stringify(s).includes('"DSQuote"') ? [{ path: "sections[" + i + "]/DSLayout/DSQuote", unit: "DSQuote", message: "DSQuote is not exported by the design system, so it is not drawn." }] : []),
  };
} }
console.log(JSON.stringify({ renderVersion: 1, ds: at("--ds"), app: at("--app"), renders }));
`);
chmodSync(fake, 0o755);

const kind = (code, title, extra = {}) => ({ code, title, description: `${title} is drawn for a reader who asks for it.`, status: "BUILT", ...extra });
const CATALOGUE = {
  version: "1.0.0",
  outline: { categories: { MARKETING: { family: "SITE", person: "VISITOR", description: "a site" }, DASHBOARD: { family: "APP", person: "TEAM", description: "an app" } } },
  categories: {
    MARKETING: {
      LAYOUTS: [kind("TOPNAV", "Top nav")],
      PAGES: [kind("HOME", "Home", { order: [{ kind: "HERO", case: "BESIDE" }, { kind: "TESTIMONIALS", case: "QUOTE" }, "FOOTER"] })],
      CONTAINERS: [kind("HERO", "Hero", { cases: [{ code: "BESIDE", when: "one picture reads beside the words" }, { code: "SLIDES", when: "the pictures turn", status: "PLANNED", missing: "a slideshow unit" }] }), kind("TESTIMONIALS", "Testimonials", { cases: [{ code: "QUOTE", when: "one quote stands alone" }] }), kind("FOOTER", "Footer", { cases: [{ code: "COLUMNS", when: "the footer holds columns" }] })],
      WIDGETS: [kind("CALLOUT", "Callout"), kind("COUNTDOWN", "Countdown", { status: "PLANNED", missing: "a countdown unit" })],
    },
    DASHBOARD: { LAYOUTS: [kind("RAIL", "Rail")], PAGES: [kind("FIND_IN_A_LIST", "Find in a list")], CONTAINERS: [kind("PANEL", "Panel")], WIDGETS: [kind("STATE", "State")] },
  },
};
const part = (pick = "ALL") => ({ source: "OWN", pick, notUsed: [], add: [] });
const SPEC = { name: "Sample", categories: { MARKETING: { LAYOUTS: part(), PAGES: part(), CONTAINERS: part(), WIDGETS: part() }, DASHBOARD: { LAYOUTS: part(), PAGES: part(), CONTAINERS: part(), WIDGETS: part() } } };
const book = join(dir, "book");
mkdirSync(join(book, "docs", "specs", "design-languages"), { recursive: true });
writeFileSync(join(book, "docs", "specs", "design-languages", "sample.spdl.json"), JSON.stringify(SPEC));
const catalogue = join(dir, "catalogue.json");
writeFileSync(catalogue, JSON.stringify(CATALOGUE));

const run = (...args) => {
  try { return { out: execFileSync("node", [CLI, "language", "samples", "write", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off", SPN_SURFACE_SPNUTILS: fake } }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 }; }
};
const files = (root) => readdirSync(root, { recursive: true }).filter((f) => String(f).endsWith(".html")).map(String).sort();
const out = join(dir, "out");
const common = ["sample", "--book", book, "--catalogue", catalogue, "--out", out, "--quiet"];

console.log("=== language samples write — every page of every category the language serves");
const first = run(...common);
const written = existsSync(out) ? files(out) : [];
ok("[MKT.SCRIPTS.700] it prints one OK line with the counts of pages, sections and planned sections, then one line for each category, and exits 0", first.code === 0 && /^OK \S+: 11 pages, \d+ sections, 4 planned$/m.test(first.out) && first.out.includes("MARKETING: layouts 1, pages 1, containers 3, widgets 2") && first.out.includes("DASHBOARD: layouts 1, pages 1, containers 1, widgets 1"), first.out);
ok("[MKT.SCRIPTS.701] each layout, page kind, container kind and widget kind is a page in its category's part folder, and the home and the index data stand beside them", written.includes("02-site/01-marketing/01-layouts/01-topnav.html") && written.includes("02-site/01-marketing/02-pages/01-home.html") && written.includes("02-site/01-marketing/03-containers/02-testimonials.html") && written.includes("02-site/01-marketing/04-widgets/01-callout.html") && written.includes("03-app/01-dashboard/02-pages/01-find-in-a-list.html") && written.includes("index.html") && existsSync(join(out, "samples.json")), written.join(" "));
const home = readFileSync(join(out, "02-site/01-marketing/02-pages/01-home.html"), "utf8");
const notes = JSON.parse(/<script type="application\/json" id="sample-notes">\n([\s\S]*?)\n<\/script>/.exec(home)[1]);
ok("[MKT.SCRIPTS.702] a page is the surface page template with the design system's version in its meta, one note for each section and no placeholder left", home.includes('<meta name="surface-ds" content="11.26.0">') && notes.length === 3 && notes.every((n, i) => n.n === i && n.kind && n.text) && !/\{\{[^}]*\}\}/.test(home.replace(/<template[\s\S]*?<\/template>/g, "")) && home.includes('<template id="page-LIGHT-DESKTOP">'), home.slice(0, 400));

console.log("\n=== language samples write — a unit the design system does not build");
ok("[MKT.SCRIPTS.703] a case the catalogue marks planned is drawn as the planned mark and its note says what it needs", /Planned: needs a slideshow unit\./.test(readFileSync(join(out, "02-site/01-marketing/03-containers/01-hero.html"), "utf8")) && /Planned: needs a countdown unit\./.test(readFileSync(join(out, "02-site/01-marketing/04-widgets/02-countdown.html"), "utf8")));
ok("[MKT.SCRIPTS.704] a section the render finds a unit missing from is drawn as the planned mark, and its note names the unit", notes[1].text.startsWith("Planned: needs DSQuote") && /Planned: needs DSQuote/.test(readFileSync(join(out, "02-site/01-marketing/03-containers/02-testimonials.html"), "utf8")), JSON.stringify(notes));

console.log("\n=== language samples write — the index and a second run");
const data = JSON.parse(readFileSync(join(out, "samples.json"), "utf8"));
const index = readFileSync(join(out, "index.html"), "utf8");
ok("[MKT.SCRIPTS.705] samples.json lists every page with its category, part and kinds, and the home's tree names the folders by the catalogue's own words", data.language === "sample" && data.samples.length === 11 && data.samples.every((s) => s.file && s.category && s.part && s.kinds.length) && index.includes('"label": "Containers"') && index.includes('"label": "Marketing"') && !/\{\{[^}]*\}\}/.test(index), index.slice(-800));
const snapshot = Object.fromEntries(files(out).map((f) => [f, readFileSync(join(out, f), "utf8")]));
run(...common);
ok("[MKT.SCRIPTS.706] a second run writes the same bytes", files(out).every((f) => readFileSync(join(out, f), "utf8") === snapshot[f]) && files(out).length === Object.keys(snapshot).length);

console.log("\n=== language samples write — what the spec picks, and where the assets are");
const narrow = { ...SPEC, categories: { MARKETING: { ...SPEC.categories.MARKETING, CONTAINERS: part(["HERO"]), WIDGETS: { ...part(), notUsed: ["COUNTDOWN"] } } } };
writeFileSync(join(dir, "narrow.spdl.json"), JSON.stringify(narrow));
const out2 = join(dir, "out2");
const assets = join(dir, "assets");
mkdirSync(assets);
const picked = run("sample", "--spec", join(dir, "narrow.spdl.json"), "--catalogue", catalogue, "--out", out2, "--assets", assets, "--quiet");
const second = existsSync(out2) ? files(out2) : [];
ok("[MKT.SCRIPTS.707] a language serves only the categories its spec names and takes only the kinds it picks, less those it does not use", picked.code === 0 && second.every((f) => !f.startsWith("03-app")) && second.some((f) => f.endsWith("01-hero.html")) && !second.some((f) => f.endsWith("testimonials.html") || f.endsWith("countdown.html")), second.join(" "));
const linked = readFileSync(join(out2, "02-site/01-marketing/02-pages/01-home.html"), "utf8");
ok("[MKT.SCRIPTS.708] with --assets a page links the stylesheet and the script from that folder by a path relative to the page, with no integrity attribute", linked.includes('<link rel="stylesheet" href="../../../../assets/docs-language.css">') && linked.includes('<script src="../../../../assets/docs-page.js"></script>') && !/integrity=/.test(linked.replace(/<template[\s\S]*?<\/template>/g, "")), linked.slice(0, 900));

console.log("\n=== language samples write — what it refuses");
const none = run("nosuch", "--book", book, "--catalogue", catalogue, "--out", join(dir, "out3"), "--quiet");
ok("[MKT.SCRIPTS.709] a language with no spec is refused naming `--spec` and the book, and nothing is written", none.code === 2 && none.out.includes("--spec") && !existsSync(join(dir, "out3")), none.out);
const bare = run("--book", book);
ok("[MKT.SCRIPTS.709] no language is a usage fault", bare.code === 2 && bare.out.includes("takes one language"), bare.out);

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
