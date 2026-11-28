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

console.log("\n=== language samples write — the media a language's data holds");
{
  const media = await import("../../../../../src/scripts/commands/language/_trees/media.ts");
  const siteMod = await import("../../../../../src/scripts/commands/language/_trees/site.ts");
  const { loadData } = await import("../../../../../src/scripts/commands/language/_folder.ts");
  const layouts = await import("../../../../../src/scripts/commands/language/_trees/layouts.ts");
  const kit = await import("../../../../../src/scripts/commands/language/_trees/kit.ts");
  kit.setDs("11.30.0");
  const lang = join(dir, "media-lang");
  const put = (file, data) => { mkdirSync(join(lang, file, ".."), { recursive: true }); writeFileSync(join(lang, file), typeof data === "string" ? data : JSON.stringify(data)); };
  const picture = (caption, ratio) => ({ caption, ratio });
  put("data/index.json", { domain: "Sample", currency: "USD" });
  put("data/orgs.json", { type: "Org", records: [
    { key: "atelier", name: "Atelier", category: "PLATFORM", parent: null, logo: picture("Atelier", "1:1"), wide: picture("Atelier wide", "5:1") },
    { key: "kiln-co", name: "Kiln & Co", category: "MERCHANT", parent: "atelier", about: "A ceramics studio.", logo: picture("Kiln", "1:1"), wide: picture("Kiln wide", "5:1"), banner: picture("Kiln banner", "21:9") },
    { key: "byte-school", name: "Byte School", category: "MERCHANT", parent: "atelier", logo: picture("Byte", "1:1"), wide: picture("Byte wide", "5:1") },
  ] });
  put("data/people.json", { type: "Person", records: [{ key: "hana", name: "Hana Sato", avatar: picture("Hana", "1:1") }, { key: "mira", name: "Mira Okafor", avatar: picture("Mira", "1:1") }] });
  put("data/subjects.json", { type: "Subject", records: [{ key: "design", name: "Design", line: "Design taught by people who ship.", picture: picture("A desk", "4:3") }, { key: "food", name: "Food and drink", line: "Bread and coffee.", picture: picture("A loaf", "4:3") }] });
  put("data/posts.json", { type: "Post", records: [{ key: "first-post", title: "A first post", line: "Its line.", category: "Workshops", person: "mira", date: "2026-11-24", minutes: 6, cover: picture("A cover", "16:9") }] });
  const pics = [["orgs/atelier", "logo"], ["orgs/atelier", "wide"], ["orgs/kiln-co", "logo"], ["orgs/kiln-co", "wide"], ["orgs/kiln-co", "banner"], ["orgs/byte-school", "logo"], ["orgs/byte-school", "wide"], ["people/hana", "avatar"], ["people/mira", "avatar"], ["subjects/design", "picture"], ["subjects/food", "picture"], ["posts/first-post", "cover"]];
  put("assets/sources.json", { brand: {}, pictures: pics.map(([record, field]) => ({ record, field, file: `pictures/${record}-${field}.svg`, caption: "x", state: "HELD" })), drawings: [], note: null });
  for (const [record, field] of pics) put(`assets/pictures/${record}-${field}.svg`, "<svg/>");
  put("assets/drawings/door-teach.svg", "<svg/>");
  put("types.json", { types: [{ type: "Org", file: "orgs", medium: "LOGO", roles: { title: "name", line: "knownFor" }, required: ["key", "name"], derived: [], neededBy: [] }] });
  const data = loadData(lang).data;
  media.setMedia("sample", lang, data);
  const { dataPages: pagesOfData } = await import("../../../../../src/scripts/commands/language/_trees/data.ts");
  const orgPage = JSON.stringify(pagesOfData(data)[0].entries);
  ok("[MKT.SCRIPTS.742] an org of the Data folder is drawn with its banner and its logo, the files the data holds, and not a mark of its initials", orgPage.includes('"path":"pictures/orgs/kiln-co-banner.svg"') && orgPage.includes('"path":"pictures/orgs/kiln-co-logo.svg"'), orgPage.slice(0, 300));
  const plan = (name, price, recommended) => ({ name, price, line: `${name} line`, feats: [`${name} one`, `${name} two`, `${name} three`], ...(recommended ? { recommended: true } : {}) });
  const brief = {
    org: "Atelier", promise: "p", legal: "l", emails: ["a@x"], nav: [["Teach", "teach"]], groups: [], claim: "c", claim2: "c2", problem: "p", problem2: "p2", facts: [], heroCta: ["Go", "More"],
    doors: [["teach", "Teach on Atelier", "Publish a course.", "PENCIL"]], points: [], steps: [], qa: [], code: { file: "a", language: "HTML", text: "x" },
    records: [["A first post", "Its line.", "24 November 2026", "first-post"]],
    quotes: [["I sold out in two days.", "Hana Sato", "Teacher, Kiln & Co"], ["One page, one statement.", "Mira Okafor", "Founder, Studio Mira"], ["Seats and a waitlist.", "Nobody Known", "Teacher"]],
    people: [["Hana Sato", "Potter"], ["Mira Okafor", "Founder"]], plans: [plan("Starter", 0), plan("Pro", 1999, true), plan("Academy", 5999)], numbers: [], closing: { title: "t", description: "d", cta: "c", second: "s" },
    article: { title: "t", lede: "l", by: "b", date: "d" }, choose: [], marks: ["Kiln & Co", "Byte School", "Nowhere Ltd"], logosLine: "Teachers on Atelier.", places: [], picture: { hero: "h", show: "s", proof: "p" }, planTable: [], listings: [],
    pictures: { doors: { teach: "drawings/door-teach.svg" } },
  };
  const json = (tree) => JSON.stringify(tree);
  const strip = json(siteMod.siteContainer("PROOF_LOGOS", "CUSTOMER_MARKS", brief));
  ok("[MKT.SCRIPTS.730] the proof strip draws each org's wide logo image, and a name no org holds keeps its lockup, never a bare initial of an org that has a logo", strip.includes('"path":"pictures/orgs/kiln-co-wide.svg"') && strip.includes('"path":"pictures/orgs/byte-school-wide.svg"') && !/"text":"KI"|"text":"K"/.test(strip), strip.slice(0, 600));
  const quotes = json(siteMod.siteContainer("PROOF_TESTIMONIALS", "WALL", brief));
  ok("[MKT.SCRIPTS.731] a testimonial draws the speaker's face and the org's logo, from the people and the orgs the data holds", quotes.includes('"path":"pictures/people/hana-avatar.svg"') && quotes.includes('"path":"pictures/orgs/kiln-co-logo.svg"') && quotes.includes('"path":"pictures/people/mira-avatar.svg"'), quotes.slice(0, 600));
  const team = json(siteMod.siteContainer("ABOUT_TEAM", "", brief));
  ok("[MKT.SCRIPTS.732] a team card draws the person's face from the data in place of a labelled box", team.includes('"path":"pictures/people/hana-avatar.svg"') && !team.includes("portrait, head and shoulders"), team.slice(0, 400));
  const posts = json(siteMod.siteContainer("BROWSE_FEATURED", "", brief));
  ok("[MKT.SCRIPTS.733] a record named by its key draws its cover, with its category and read time from the data", posts.includes('"path":"pictures/posts/first-post-cover.svg"') && posts.includes("6 min read"), posts.slice(0, 500));
  const tiles = json(siteMod.siteContainer("BROWSE_TILES", "", { ...brief, pictures: undefined }));
  ok("[MKT.SCRIPTS.734] the category tiles of a marketplace draw each subject with its picture, its name and its line", tiles.includes('"path":"pictures/subjects/design-picture.svg"') && tiles.includes("Bread and coffee."), tiles.slice(0, 400));
  const doors = json(siteMod.siteContainer("EXPLAIN_DOORS", "", brief));
  ok("[MKT.SCRIPTS.735] a door draws its picture, its icon, its title and line, and a link", doors.includes('"path":"drawings/door-teach.svg"') && doors.includes('"PENCIL"') && doors.includes("Teach on Atelier") && doors.includes('"DSLink"'), doors.slice(0, 500));
  const cards = json(siteMod.siteContainer("PRICE_PLANS", "", brief));
  ok("[MKT.SCRIPTS.736] the plan cards come as a pricing page draws them: Monthly and Annual tabs with the saving, the recommended plan raised with its badge, a big price with a period, a tick list of the things themselves and one full-width button each", cards.includes('"DSTabs"') && cards.includes("Annual") && /Save \d+%/i.test(cards) && /Most popular/i.test(cards) && cards.includes("/ month") && cards.includes('"CHECK"') && !cards.includes("Included in the plan.") && (cards.match(/"fullWidth":true/g) ?? []).length === 3, cards.slice(0, 700));
  const header = json(layouts.siteLayout(brief, "TOPNAV", [], "teach"));
  ok("[MKT.SCRIPTS.737] the header carries the platform org's wide logo as a picture", header.includes('"path":"pictures/orgs/atelier-wide.svg"'), header.slice(0, 300));
  const hero = json(siteMod.siteContainer("ITEM_HERO", "", brief)) + json(siteMod.siteContainer("SELLER_HERO", "", brief));
  ok("[MKT.SCRIPTS.738] a seller or brand head names the org of the data, with its banner, and not a seller of the writer's own", hero.includes("Kiln & Co") && hero.includes('"path":"pictures/orgs/kiln-co-banner.svg"') && !hero.includes("Kite Studio"), hero.slice(0, 400));
  process.env.SPN_SURFACE_DS_ICONS = "PENCIL,CALENDAR,CHECK";
  const bad = kit.unknownIcons(siteMod.siteContainer("EXPLAIN_DOORS", "", { ...brief, pictures: undefined, doors: [["a", "A", "line", "BOOK"], ["b", "B", "line", "PENCIL"]] }));
  delete process.env.SPN_SURFACE_DS_ICONS;
  ok("[MKT.SCRIPTS.739] an icon the design system does not hold is named, so a section the render will not draw says why and not only that it would not render", bad.length === 1 && bad[0] === "BOOK", JSON.stringify(bad));
  media.setMedia("sample", null, null);
}

{
  const { dataPages } = await import("../../../../../src/scripts/commands/language/_trees/data.ts");
  const pages = dataPages({ folder: "", index: null, samples: null, assets: null, sources: null, types: { OrgCategory: { type: "OrgCategory", file: "categories", medium: "NONE", roles: { title: "label" }, required: [], derived: [], neededBy: [] } }, files: { categories: { type: "OrgCategory", records: [{ code: "A", label: "Alpha" }] } } });
  ok("[MKT.SCRIPTS.741] a record type named in camel case reads as words in the Data folder: Org category, never Orgcategory", pages[0].title === "Org category" && JSON.stringify(pages[0].entries).includes("Org category fields") && !JSON.stringify(pages[0].entries).includes("Orgcategory"), JSON.stringify([pages[0].title, pages[0].entries.map((e) => e.kind)]));
}
{
  const { windowsOf } = await import("../../../../../src/scripts/commands/language/_trees/render.ts");
  const drawn = windowsOf('<link rel="preload" as="image" href="asset:base/pictures/a.svg"/><section><img src="asset:base/pictures/a.svg"/></section><section>two</section>');
  ok("[MKT.SCRIPTS.740] the preload link the render writes before a section that holds a picture is no window of its own, so a section with a picture is still one window", drawn.length === 2 && drawn[0].startsWith("<section>"), JSON.stringify(drawn));
}

console.log("\n=== language samples write — what it refuses");
const none = run("nosuch", "--book", book, "--catalogue", catalogue, "--out", join(dir, "out3"), "--quiet");
ok("[MKT.SCRIPTS.709] a language with no spec is refused naming `--spec` and the book, and nothing is written", none.code === 2 && none.out.includes("--spec") && !existsSync(join(dir, "out3")), none.out);
const bare = run("--book", book);
ok("[MKT.SCRIPTS.709] no language is a usage fault", bare.code === 2 && bare.out.includes("takes one language"), bare.out);

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
