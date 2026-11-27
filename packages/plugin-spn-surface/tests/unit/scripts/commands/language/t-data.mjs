// `language data check`, `language diff` and the folder a language is kept in: the dataset's rules, and a change that only grows.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SRC = resolve(import.meta.dirname, "..", "..", "..", "..", "..", "src");
const CLI = join(SRC, "scripts", "cli.ts");
const { parentName, findLanguage } = await import(pathToFileURL(join(SRC, "scripts", "commands", "language", "_folder.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const run = (...args) => {
  try { return { out: execFileSync("node", [CLI, "language", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 }; }
};

const dir = mkdtempSync(join(tmpdir(), "language-data-"));
const book = join(dir, "book");
const folder = join(book, "docs", "specs", "surface", "languages", "demo");
const write = (file, value) => { mkdirSync(resolve(file, ".."), { recursive: true }); writeFileSync(file, JSON.stringify(value, null, 1)); };
const SPEC = { name: "demo", version: "1.0.0", extends: "surface", categories: { MARKETPLACE: { PAGES: { pick: ["MARKET_ITEM", "MARKET_PRICING"], add: [], notUsed: [] } } } };
const CATALOGUE = { version: "1.0.0", categories: { MARKETPLACE: { PAGES: [{ code: "MARKET_ITEM" }, { code: "MARKET_PRICING" }, { code: "MARKET_CART" }] } } };
const GOOD = {
  index: { domain: "Demo", today: "2026-11-27", currency: "INR", surfaces: { MARKETPLACE: "the catalogue" }, files: ["items", "reviews", "plans"] },
  items: { type: "ITEM", medium: "PICTURE", roles: { title: "title", price: "price", ratingSource: "reviews.rating" }, records: [{ key: "a", title: "A", price: 10 }] },
  reviews: { type: "REVIEW", medium: "AVATAR", roles: { owner: "item", ratingSource: "rating" }, records: [{ item: "a", rating: 5 }] },
  plans: { type: "PLAN", medium: "NONE", roles: { title: "name", price: "price" }, records: [{ key: "free", name: "Free", price: 0 }] },
};
const lay = (data) => {
  rmSync(join(folder, "data"), { recursive: true, force: true });
  write(join(folder, "demo.spdl.json"), SPEC);
  for (const [name, value] of Object.entries(data)) write(join(folder, "data", `${name}.json`), value);
};
const catalogue = join(dir, "catalogue.json");
write(catalogue, CATALOGUE);
const icons = join(dir, "icons.json");
write(icons, { icons: ["PENCIL", "CODE"] });
const check = () => run("data", "check", "demo", "--book", book, "--catalogue", catalogue, "--icons", icons);
const mutate = (change) => { const copy = JSON.parse(JSON.stringify(GOOD)); change(copy); return copy; };

console.log("=== language data check");
lay(GOOD);
const good = check();
ok("[MKT.SCRIPTS.714] a dataset that agrees prints one OK line and exits 0", good.code === 0 && /^OK .*data: 3 record file\(s\) agree$/m.test(good.out), good.out);
lay(mutate((d) => { d.items.records[0].teacher = "nobody"; d.reviews.records[0].item = "gone"; }));
ok("[MKT.SCRIPTS.715] a link that resolves to no record is refused, naming the file", check().code === 1 && check().out.includes('item "gone" resolves to no record of data/items.json'));
lay(mutate((d) => { delete d.plans.medium; }));
ok("[MKT.SCRIPTS.715] a record file with no medium is refused", check().out.includes("data/plans.json has no medium"), check().out);
lay(mutate((d) => { delete d.plans.roles; }));
ok("[MKT.SCRIPTS.715] a record file with no roles is refused", check().out.includes("data/plans.json has no roles"), check().out);
lay(mutate((d) => { d.items.records[0].reviewCount = 3; d.items.records[0].rating = 4.5; d.plans.records[0].total = 9; }));
const derived = check().out;
ok("[MKT.SCRIPTS.715] a stored count, rating average or total is refused", derived.includes("`reviewCount` is a number the data can derive") && derived.includes("`rating` is stored outside the reviews") && derived.includes("`total` is a number"), derived);
lay(mutate((d) => { d.items.records[0].icon = "PEN_TOOL"; d.items.records[0].mark = { icon: "CODE" }; }));
ok("[MKT.SCRIPTS.715] an icon the design system's DSIconType lacks is refused, one it holds is not", check().out.includes("the icon PEN_TOOL is not one of the design system's DSIconType") && !check().out.includes("icon CODE"), check().out);
lay(mutate((d) => { d.index.files = ["items", "reviews"]; delete d.plans; d.index.files = ["items", "reviews"]; }));
ok("[MKT.SCRIPTS.715] a page kind the language picks whose records are missing is refused", check().out.includes("MARKETPLACE picks MARKET_PRICING, which need PLAN records"), check().out);


console.log("\n=== language data check — people, pages, tenancy and assets");
const GROWN = (change) => mutate((d) => {
  d.index.files = ["items", "reviews", "plans", "organizations", "members"];
  d.index.people = { MARKETPLACE: { person: "SEEKER", who: "A learner", comes: "to find a course", asks: ["Is it worth it?"], sees: ["items", "reviews"] } };
  d.teachers = { type: "SELLER", medium: "AVATAR", roles: { title: "name" }, records: [{ key: "mira", name: "Mira" }] };
  d.index.files.push("teachers");
  d.organizations = { type: "ORGANIZATION", medium: "LOGO", roles: { title: "name" }, records: [{ key: "atelier", name: "Atelier", level: "PLATFORM", plan: "free" }, { key: "studio", name: "Studio", level: "TENANT", parent: "atelier", plan: "free" }] };
  d.members = { type: "MEMBER", medium: "AVATAR", roles: { owner: "org" }, records: [{ key: "m1", person: "mira", org: "studio", role: "OWNER" }] };
  d.pages = { MARKET_ITEM: { record: "items/a", sections: { PROOF_REVIEWS: { title: "Reviews", description: "What learners say", from: "reviews where item = a" } } } };
  change(d);
});
const layGrown = (d) => { lay(Object.fromEntries(Object.entries(d).filter(([k]) => k !== "pages"))); if (d.pages) write(join(folder, "data", "pages.json"), d.pages); };
const CAT = { version: "1.0.0", outline: { categories: { MARKETPLACE: { person: "SEEKER" } } }, categories: { MARKETPLACE: { PAGES: [{ code: "MARKET_ITEM" }, { code: "MARKET_PRICING" }], CONTAINERS: [{ code: "PROOF_REVIEWS" }] } } };
write(catalogue, CAT);
layGrown(GROWN(() => {}));
const grown = check();
ok("[MKT.SCRIPTS.718] people, pages.json, organizations and members that agree are accepted", grown.code === 0, grown.out);
layGrown(GROWN((d) => { d.index.people.MARKETPLACE.person = "NOBODY"; d.index.people.MARKETPLACE.sees = ["ghost"]; }));
ok("[MKT.SCRIPTS.718] a person outside the surface person types, and a seen file that is not there, are refused", check().out.includes("the person NOBODY is not a surface person type") && check().out.includes("sees ghost"), check().out);
layGrown(GROWN((d) => { d.pages.MARKET_ITEM.record = "items/zzz"; d.pages.MARKET_ITEM.sections.PROOF_REVIEWS.from = "reviews where item = zzz"; d.pages.MARKET_ITEM.sections.NO_SUCH = { title: "t", description: "d", from: "teachers" }; }));
const pagesOut = check().out;
ok("[MKT.SCRIPTS.718] a page whose record, section filter or container kind does not resolve is refused", pagesOut.includes("record items/zzz resolves to no record") && pagesOut.includes('item "zzz" resolves to no record') && pagesOut.includes("NO_SUCH is no container kind"), pagesOut);
layGrown(GROWN((d) => { d.organizations.records[1].parent = "ghost"; d.organizations.records[1].plan = "gold"; d.organizations.records[1].level = "WHOLE"; d.members.records[0].org = "nowhere"; d.members.records[0].person = "nobody"; }));
const tenancy = check().out;
ok("[MKT.SCRIPTS.719] an organization's parent, plan and level and a member's org and person that do not resolve are refused", tenancy.includes('parent "ghost"') && tenancy.includes('plan "gold"') && tenancy.includes("level WHOLE") && tenancy.includes('org "nowhere"') && tenancy.includes('person "nobody"'), tenancy);
layGrown(GROWN((d) => { d.organizations.medium = "PICTURE"; }));
ok("[MKT.SCRIPTS.719] organizations are type ORGANIZATION with the medium LOGO", check().out.includes("data/organizations.json is type ORGANIZATION with the medium LOGO"), check().out);
layGrown(GROWN((d) => { d.items.records[0].cover = { asset: "pictures/a.png" }; }));
ok("[MKT.SCRIPTS.720] an asset named when the language has no assets/ folder is refused", check().out.includes("has no assets/ folder"), check().out);
mkdirSync(join(folder, "data", "assets", "pictures"), { recursive: true });
ok("[MKT.SCRIPTS.720] an assets/ folder with no sources.json is refused", check().out.includes("holds no sources.json"), check().out);
writeFileSync(join(folder, "data", "assets", "sources.json"), "{}");
ok("[MKT.SCRIPTS.720] an asset that is not under assets/ is refused", check().out.includes("the asset pictures/a.png is not under assets/"), check().out);
writeFileSync(join(folder, "data", "assets", "pictures", "a.png"), "x");
ok("[MKT.SCRIPTS.720] an asset that stands under assets/ is accepted", check().code === 0, check().out);

console.log("\n=== the folder, and the old flat path");
lay(GOOD);
ok("[MKT.SCRIPTS.713] a language is found in its folder, with no note", findLanguage("demo", book, undefined).spec.endsWith("demo/demo.spdl.json") && findLanguage("demo", book, undefined).notes.length === 0);
const flatBook = join(dir, "flat");
write(join(flatBook, "docs", "specs", "design-languages", "old.spdl.json"), SPEC);
const oldBook = join(dir, "old-folder");
write(join(oldBook, "docs", "specs", "design-languages", "older", "older.spdl.json"), SPEC);
write(join(oldBook, "docs", "specs", "design-languages", "older", "data", "index.json"), {});
const flat = findLanguage("old", flatBook, undefined);
ok("[MKT.SCRIPTS.713] the old flat file is read, and the reading says so", flat && flat.folder === null && flat.notes[0].includes("old flat path"));
const older = findLanguage("older", oldBook, undefined);
ok("[MKT.SCRIPTS.713] the folder at the old design-languages path is read, and the reading says so", older && older.folder && older.notes[0].includes("the old path"), JSON.stringify(older));
write(join(book, "docs", "specs", "surface", "languages", "base", "base.spdl.json"), { ...SPEC, name: "base" });
const renamed = findLanguage("surface", book, undefined);
ok("[MKT.SCRIPTS.713] surface is read as base, and the reading says so", renamed && renamed.name === "base" && renamed.notes[0].includes("is now named"), JSON.stringify(renamed));
ok("[MKT.SCRIPTS.713] a flat language has no data, and `data check` refuses it saying so", run("data", "check", "old", "--book", flatBook, "--catalogue", catalogue).out.includes("no data/"));

console.log("\n=== extends names the parent alone");
ok("[MKT.SCRIPTS.717] `base`, `base@1`, `surface` and `surface@1` all name base, and null names none", parentName("base") === "base" && parentName("base@1") === "base" && parentName("surface") === "base" && parentName("surface@1") === "base" && parentName(null) === null && parentName("Surface 1") === null);

console.log("\n=== language diff");
const before = join(dir, "before.json"), after = join(dir, "after.json");
const kinds = (codes, extra = {}) => ({ version: "1.0.0", categories: { MARKETING: { PAGES: codes.map((code) => ({ code, title: code, ...extra, cases: [{ code: "ONE" }] })) } } });
write(before, kinds(["A", "B"]));
write(after, { ...kinds(["A", "B", "C"]), version: undefined });
ok("[MKT.SCRIPTS.716] a kind added, and the version key gone, is not a breaking change", run("diff", before, after).code === 0);
write(after, kinds(["A"]));
const gone = run("diff", before, after);
ok("[MKT.SCRIPTS.716] a kind removed is refused and listed", gone.code === 1 && gone.out.includes("categories.MARKETING.PAGES[B]"), gone.out);
write(after, kinds(["A", "B"], { status: "DEPRECATED", replacedBy: "C" }));
ok("[MKT.SCRIPTS.716] a kind retired as DEPRECATED stays, and is not refused", run("diff", before, after).code === 0);
write(after, { version: "1.0.0", categories: { MARKETING: { PAGES: [{ code: "A", title: "A", cases: [{ code: "TWO" }] }, { code: "B", title: "B", cases: [{ code: "ONE" }] }] } } });
ok("[MKT.SCRIPTS.716] a case renamed is refused", run("diff", before, after).out.includes("[A].cases[ONE]"));
write(after, { version: "1.0.0", categories: { MARKETING: { PAGES: [{ code: "A", cases: [{ code: "ONE" }] }, { code: "B", title: "B", cases: [{ code: "ONE" }] }] } } });
ok("[MKT.SCRIPTS.716] a field removed from a kind is refused", run("diff", before, after).out.includes("[A].title"));

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-data` : `\n  all ${total} passed — t-data`);
process.exit(failed ? 1 : 0);
