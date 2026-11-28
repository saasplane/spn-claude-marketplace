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
  outline: { groups: [{ code: "SHARED", parts: [{ code: "BRAND", title: "Brand", description: "the primary, the greys and the typefaces", values: { ALL: ["theBrand"] } }, { code: "VOICE", title: "Voice", description: "how the language speaks", values: { ALL: ["howItSpeaks"] } }] }, { code: "STYLE", parts: [{ code: "THEME", title: "Theme", description: "the colours and corners" }, { code: "MEDIA", title: "Media", description: "the pictures" }, { code: "MOTION", title: "Motion", description: "what moves" }, { code: "WORDS", title: "Words", description: "how long and how big the text runs" }] }], categories: { MARKETING: { family: "SITE", person: "VISITOR", description: "a site" }, DASHBOARD: { family: "APP", person: "TEAM", description: "an app" } } },
  categories: {
    MARKETING: {
      LAYOUTS: [kind("TOPNAV", "Top nav")],
      PAGES: [kind("MAIN_HOME", "Home", { order: [{ kind: "INTRO_HERO", case: "BESIDE" }, { kind: "PROOF_TESTIMONIALS", case: "QUOTE" }, "COMMON_FOOTER"] })],
      CONTAINERS: [kind("INTRO_HERO", "Hero", { cases: [{ code: "BESIDE", when: "one picture reads beside the words" }, { code: "SLIDES", when: "the pictures turn", status: "PLANNED", missing: "a slideshow unit" }] }), kind("PROOF_TESTIMONIALS", "Testimonials", { cases: [{ code: "QUOTE", when: "one quote stands alone" }] }), kind("COMMON_FOOTER", "Footer", { cases: [{ code: "COLUMNS", when: "the footer holds columns" }] })],
      WIDGETS: [kind("CARD_LIST", "Card list"), kind("LIVE_COUNTDOWN", "Countdown", { status: "PLANNED", missing: "a countdown unit" })],
      THEME: [kind("ITEM_LOOK", "Item look", { style: { radius: "MEDIUM", door: { raised: true } } })], MEDIA: [], MOTION: [],
      WORDS: [kind("PARAGRAPH", "Paragraph", { style: { typography: "CONTENT_MD" } }), kind("KEYS", "Keys")],
    },
    DASHBOARD: { LAYOUTS: [kind("RAIL", "Rail")], PAGES: [kind("RECORD_HOME", "Record home", { cases: [{ code: "WITH_STATS", when: "the records stand under their numbers" }] })], CONTAINERS: [kind("RECORD_FACTS", "Record facts")], WIDGETS: [kind("VALUE_STATE", "Value state")], THEME: [], MEDIA: [], MOTION: [], WORDS: [] },
  },
};
const part = (pick = "ALL") => ({ source: "OWN", pick, notUsed: [], add: [] });
const SPEC = { name: "Sample", shared: { BRAND: { source: "NONE", values: { theBrand: { primary: "THE_DESIGN_SYSTEMS", greys: "THE_DESIGN_SYSTEMS" } }, why: "Sample sets no brand." }, VOICE: { source: "NONE", values: { howItSpeaks: null }, why: "Sample writes no voice yet." } }, categories: { MARKETING: { LAYOUTS: part(), PAGES: part(), CONTAINERS: part(), WIDGETS: part(), THEME: { ...part(), values: { mtype: "THEME", radius: "MEDIUM" }, why: "A site takes its looks from its brand." }, MEDIA: part(), MOTION: part(), WORDS: part() }, DASHBOARD: { LAYOUTS: part(), PAGES: part(), CONTAINERS: part(), WIDGETS: part() } } };
const book = join(dir, "book");
mkdirSync(join(book, "docs", "specs", "design-languages"), { recursive: true });
mkdirSync(join(book, "docs", "specs", "surface", "languages", "sample"), { recursive: true });
writeFileSync(join(book, "docs", "specs", "surface", "languages", "sample", "spdl.json"), JSON.stringify(SPEC));
// The catalogue as the book keeps it: a folder holding its outline and the file of each category.
const catalogue = join(dir, "catalogue");
mkdirSync(catalogue, { recursive: true });
const categoryFiles = Object.fromEntries(Object.keys(CATALOGUE.categories).map((code) => [code, `${code.toLowerCase()}.json`]));
writeFileSync(join(catalogue, "spcatalogue.json"), JSON.stringify({ ...CATALOGUE.outline, files: categoryFiles }));
for (const [code, parts] of Object.entries(CATALOGUE.categories)) writeFileSync(join(catalogue, categoryFiles[code]), JSON.stringify({ category: code, parts }));

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
ok("[MKT.SCRIPTS.700] it prints one OK line with the counts of pages, sections and planned sections, then one line for each category, and exits 0", first.code === 0 && /^OK \S+: 19 pages, \d+ sections, \d+ planned$/m.test(first.out) && first.out.includes("SHARED: brand 1, voice 1") && first.out.includes("MARKETING: layouts 1, pages 1, containers 3, widgets 2, media 1, motion 1, words 1") && first.out.includes("DASHBOARD: layouts 1, pages 1, containers 1, widgets 1, media 1, motion 1, words 1"), first.out);
ok("[MKT.SCRIPTS.701] the home is the one shape: each category's layouts, a folder for each page-kind family, a page for each container and widget family, then media, motion and words (RULE.SUPPORT.SURFACE.643)", ["01-layouts", "02-pages/01-main/01-home", "03-containers/01-intro", "03-containers/02-proof", "03-containers/03-common", "04-widgets/01-card", "04-widgets/02-live", "05-media", "06-motion", "07-words"].every((f) => written.includes(`02-site/01-marketing/${f}.html`)) && written.includes("03-app/01-dashboard/02-pages/01-record/01-home.html") && !written.some((f) => f.includes("theme")) && written.includes("index.html") && existsSync(join(out, "samples.json")), written.join(" "));
const home = readFileSync(join(out, "02-site/01-marketing/02-pages/01-main/01-home.html"), "utf8");
const notes = JSON.parse(/<script type="application\/json" id="sample-notes">\n([\s\S]*?)\n<\/script>/.exec(home)[1]);
ok("[MKT.SCRIPTS.702] a page is the surface page template with the design system's version in its meta, one note for each section and no placeholder left", home.includes('<meta name="surface-ds" content="11.26.0">') && notes.length === 3 && notes.every((n, i) => n.n === i && n.kind && n.text) && !/\{\{[^}]*\}\}/.test(home.replace(/<template[\s\S]*?<\/template>/g, "")) && home.includes('<template id="page-LIGHT-DESKTOP">'), home.slice(0, 400));

console.log("\n=== language samples write — a unit the design system does not build");
ok("[MKT.SCRIPTS.703] a case the catalogue marks planned is drawn as the planned mark and its note says what it needs", /Planned: needs a slideshow unit\./.test(readFileSync(join(out, "02-site/01-marketing/03-containers/01-intro.html"), "utf8")) && /Planned: needs a countdown unit\./.test(readFileSync(join(out, "02-site/01-marketing/04-widgets/02-live.html"), "utf8")));
ok("[MKT.SCRIPTS.704] a section the render finds a unit missing from is drawn as the planned mark, and its note names the unit", notes[1].text.startsWith("Planned: needs DSQuote") && /Planned: needs DSQuote/.test(readFileSync(join(out, "02-site/01-marketing/03-containers/02-proof.html"), "utf8")), JSON.stringify(notes));
const intro = JSON.parse(/<script type="application\/json" id="sample-notes">\n([\s\S]*?)\n<\/script>/.exec(readFileSync(join(out, "02-site/01-marketing/03-containers/01-intro.html"), "utf8"))[1]);
ok("[MKT.SCRIPTS.721] a family page draws every kind and every case at once, each under a heading that carries no note", intro.length === 2 && intro[0].case === "beside" && intro[1].case === "slides" && intro[0].n === 1 && intro[1].n === 3, JSON.stringify(intro));
const recordHome = readFileSync(join(out, "03-app/01-dashboard/02-pages/01-record/01-home.html"), "utf8");
const recordNotes = JSON.parse(/<script type="application\/json" id="sample-notes">\n([\s\S]*?)\n<\/script>/.exec(recordHome)[1]);
ok("[MKT.SCRIPTS.722] a page kind with cases is one page with a Case switch, the default first, a template set for each case and its notes keyed by case", /data-surface="case" data-value="DEFAULT">Default<\/button>[\s\S]*data-surface="case" data-value="WITH_STATS">With stats<\/button>/.test(recordHome) && recordHome.includes('<template id="page-LIGHT-DESKTOP">') && recordHome.includes('<template id="page-WITH_STATS-LIGHT-DESKTOP">') && Array.isArray(recordNotes.DEFAULT) && Array.isArray(recordNotes.WITH_STATS), recordHome.slice(0, 1600));
ok("[MKT.SCRIPTS.722] a page with one screen has no Case switch", !home.includes('data-surface="case"') && !home.includes("sds-surface-cases"));
const data = JSON.parse(readFileSync(join(out, "samples.json"), "utf8"));
const index = readFileSync(join(out, "index.html"), "utf8");
ok("[MKT.SCRIPTS.723] a category holds no Overview page: its folders open with Layouts, and no page of the home or its index is an overview", !written.some((f) => f.includes("overview")) && !data.samples.some((x) => x.part === "OVERVIEW" || x.file.includes("overview")) && !index.includes("Overview"), written.join(" "));

console.log("\n=== language samples write — a language kept in its own folder");
const folderBook = join(dir, "folder-book");
mkdirSync(join(folderBook, "docs", "specs", "surface", "languages", "sample", "data"), { recursive: true });
writeFileSync(join(folderBook, "docs", "specs", "surface", "languages", "sample", "spdl.json"), JSON.stringify(SPEC));
const inFolder = run("sample", "--book", folderBook, "--catalogue", catalogue, "--out", join(dir, "out-folder"), "--quiet");
ok("[MKT.SCRIPTS.713] a language in its own folder, by its spdl.json, is drawn with no note about an old path", inFolder.code === 0 && !inFolder.out.includes("note: read") && !first.out.includes("note: read"), inFolder.out);

console.log("\n=== language samples write — the index and a second run");
ok("[MKT.SCRIPTS.705] samples.json lists every page with its category, part and kinds, and the home's tree names the folders by the catalogue's own words", data.language === "sample" && data.samples.length === 19 && data.samples.every((s) => s.file && s.category && s.part && Array.isArray(s.kinds)) && index.includes('"label": "Containers"') && index.includes('"label": "Marketing"') && !/\{\{[^}]*\}\}/.test(index), index.slice(-800));
const snapshot = Object.fromEntries(files(out).map((f) => [f, readFileSync(join(out, f), "utf8")]));
run(...common);
ok("[MKT.SCRIPTS.706] a second run writes the same bytes", files(out).every((f) => readFileSync(join(out, f), "utf8") === snapshot[f]) && files(out).length === Object.keys(snapshot).length);

console.log("\n=== language samples write — what the spec picks, and where the assets are");
const narrow = { ...SPEC, categories: { MARKETING: { ...SPEC.categories.MARKETING, CONTAINERS: part(["INTRO_HERO"]), WIDGETS: { ...part(), notUsed: ["LIVE_COUNTDOWN"] } } } };
writeFileSync(join(dir, "narrow.spdl.json"), JSON.stringify(narrow));
const out2 = join(dir, "out2");
const assets = join(dir, "assets");
mkdirSync(assets);
const picked = run("sample", "--spec", join(dir, "narrow.spdl.json"), "--catalogue", catalogue, "--out", out2, "--assets", assets, "--quiet");
const second = existsSync(out2) ? files(out2) : [];
ok("[MKT.SCRIPTS.707] a language serves only the categories its spec names and takes only the kinds it picks, less those it does not use", picked.code === 0 && second.every((f) => !f.startsWith("03-app")) && second.some((f) => f.endsWith("03-containers/01-intro.html")) && !second.some((f) => f.endsWith("02-proof.html") || f.endsWith("02-live.html")), second.join(" "));
const linked = readFileSync(join(out2, "02-site/01-marketing/02-pages/01-main/01-home.html"), "utf8");
ok("[MKT.SCRIPTS.708] with --assets a page links the stylesheet and the script from that folder by a path relative to the page, with no integrity attribute", linked.includes('<link rel="stylesheet" href="../../../../../assets/docs-language.css">') && linked.includes('<script src="../../../../../assets/docs-page.js"></script>') && !/integrity=/.test(linked.replace(/<template[\s\S]*?<\/template>/g, "")), linked.slice(0, 900));

console.log("\n=== language samples write — the values parts");
const brand = readFileSync(join(out, "01-shared/01-brand.html"), "utf8");
const brandNotes = JSON.parse(/<script type="application\/json" id="sample-notes">\n([\s\S]*?)\n<\/script>/.exec(brand)[1]);
ok("[MKT.SCRIPTS.710] the Shared parts are pages in 01-shared, one section for each value the outline lists, noted from the spec's reason", written.includes("01-shared/01-brand.html") && written.includes("01-shared/02-voice.html") && brandNotes.length === 1 && brandNotes[0].kind === "The brand" && brandNotes[0].text === "Sample sets no brand.", JSON.stringify(brandNotes));
const words = JSON.parse(/<script type="application\/json" id="sample-notes">\n([\s\S]*?)\n<\/script>/.exec(readFileSync(join(out, "02-site/01-marketing/07-words.html"), "utf8"))[1]);
ok("[MKT.SCRIPTS.711] a category's Media, Motion and Words are pages 05 to 07 of its folder, each with a head section for what the spec sets and one section for each kind of the part, and no Theme page", ["05-media", "06-motion", "07-words"].every((n) => written.includes(`02-site/01-marketing/${n}.html`)) && !written.includes("02-site/01-marketing/05-theme.html") && words.length === 3 && words[0].n === 0 && words[1].kind === "Paragraph", JSON.stringify(words));
const order = data.samples.map((s) => s.file);
ok("[MKT.SCRIPTS.712] the index lists Shared first, then each category's parts in the home's order", order[0] === "01-shared/01-brand.html" && order.indexOf("01-shared/02-voice.html") < order.indexOf("02-site/01-marketing/01-layouts.html") && order.indexOf("02-site/01-marketing/01-layouts.html") < order.indexOf("02-site/01-marketing/07-words.html") && order.indexOf("02-site/01-marketing/07-words.html") < order.indexOf("03-app/01-dashboard/01-layouts.html"), order.join(" "));

console.log("\n=== language samples write — a picture named by its language");
{
  const { placeAssets } = await import("../../../../../src/scripts/commands/language/_trees/files.ts");
  const lang = join(dir, "lang-assets");
  mkdirSync(join(lang, "pictures", "subject"), { recursive: true });
  writeFileSync(join(lang, "pictures", "subject", "design.webp"), "webp");
  const home = join(dir, "out-assets");
  const page = join(home, "02-site", "01-marketing", "03-pages", "01-main", "01-home.html");
  const markup = '<img data-slot="subject-design" src="asset:base/pictures/subject/design.webp" alt="A desk"><img src="asset:base/pictures/none.webp">';
  const lines = [];
  const placed = placeAssets(markup, page, { out: home, assetFile: (language, path) => (language === "base" ? join(lang, path) : null), log: (line) => lines.push(line) });
  ok("[MKT.SCRIPTS.724] a picture the render names `asset:<language>/<path>` is copied into the home's assets and its src written relative to the page; one not found stays and is said (RULE.SUPPORT.SURFACE.644)", placed.includes('src="../../../../assets/base/pictures/subject/design.webp"') && existsSync(join(home, "assets", "base", "pictures", "subject", "design.webp")) && placed.includes('src="asset:base/pictures/none.webp"') && lines.some((line) => line.includes("none.webp")), placed);
}

console.log("\n=== language samples write — the Data group of Shared");
{
  const dataBook = join(dir, "data-book");
  const lang = join(dataBook, "docs", "specs", "surface", "languages", "sample");
  mkdirSync(join(lang, "data"), { recursive: true });
  writeFileSync(join(lang, "spdl.json"), JSON.stringify(SPEC));
  writeFileSync(join(lang, "types.json"), JSON.stringify({ types: [
    { type: "Subject", file: "subjects", medium: "PICTURE", roles: { title: "name", line: "line", picture: "picture" }, required: ["key", "name"], derived: [], neededBy: [] },
    { type: "Member", file: "members", medium: "NONE", roles: { title: "person", state: "role" }, required: ["key", "person"], derived: [], neededBy: [] },
  ] }));
  writeFileSync(join(lang, "data", "index.json"), JSON.stringify({ domain: "Sample", currency: "USD" }));
  writeFileSync(join(lang, "data", "subjects.json"), JSON.stringify({ type: "Subject", records: [{ key: "design", name: "Design", line: "Design taught by people who ship.", picture: { caption: "A desk", ratio: "4:3" } }, { key: "code", name: "Code", line: "Code that runs.", picture: { caption: "A screen", ratio: "4:3" } }] }));
  writeFileSync(join(lang, "data", "members.json"), JSON.stringify({ type: "Member", records: [{ key: "a", person: "Ana", role: "OWNER" }] }));
  const dataOut = join(dir, "out-data");
  const drawn = run("sample", "--book", dataBook, "--catalogue", catalogue, "--out", dataOut, "--quiet");
  const dataFiles = existsSync(dataOut) ? files(dataOut) : [];
  const subjectPage = dataFiles.includes("01-shared/05-data/01-subject.html") ? readFileSync(join(dataOut, "01-shared/05-data/01-subject.html"), "utf8") : "";
  const subjectNotes = subjectPage ? JSON.parse(/<script type="application\/json" id="sample-notes">\n([\s\S]*?)\n<\/script>/.exec(subjectPage)[1]) : [];
  const memberPage = dataFiles.includes("01-shared/05-data/02-member.html") ? readFileSync(join(dataOut, "01-shared/05-data/02-member.html"), "utf8") : "";
  ok("[MKT.SCRIPTS.726] the home holds 01-shared/05-data with a page for each type of types.json in its order; each page holds a fields table and every record under its own heading, and a type with no widget is one table of its records, said as unnamed", drawn.code === 0 && subjectNotes.length === 3 && subjectNotes[0].kind === "Fields" && subjectNotes[1].kind === "Design" && subjectNotes[2].kind === "Code" && (memberPage ? JSON.parse(/<script type="application\/json" id="sample-notes">\n([\s\S]*?)\n<\/script>/.exec(memberPage)[1]).map((n) => n.kind).join() === "Fields,Records" : false) && drawn.out.includes("unnamed: Member") && JSON.parse(readFileSync(join(dataOut, "samples.json"), "utf8")).samples.some((s) => s.file === "01-shared/05-data/02-member.html" && s.part === "DATA"), drawn.out + subjectNotes.map((n) => n.kind).join(","));
}

console.log("\n=== language samples write — what it refuses");
const none = run("nosuch", "--book", book, "--catalogue", catalogue, "--out", join(dir, "out3"), "--quiet");
ok("[MKT.SCRIPTS.709] a language with no spec is refused naming `--spec` and the book, and nothing is written", none.code === 2 && none.out.includes("--spec") && !existsSync(join(dir, "out3")), none.out);
const bare = run("--book", book);
ok("[MKT.SCRIPTS.709] no language is a usage fault", bare.code === 2 && bare.out.includes("takes one language"), bare.out);

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
