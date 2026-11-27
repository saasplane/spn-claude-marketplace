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
const folder = join(book, "docs", "specs", "design-languages", "demo");
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

console.log("\n=== the folder, and the old flat path");
lay(GOOD);
ok("[MKT.SCRIPTS.713] a language is found in its folder, with no note", findLanguage("demo", book, undefined).spec.endsWith("demo/demo.spdl.json") && findLanguage("demo", book, undefined).notes.length === 0);
const flatBook = join(dir, "flat");
write(join(flatBook, "docs", "specs", "design-languages", "old.spdl.json"), SPEC);
const flat = findLanguage("old", flatBook, undefined);
ok("[MKT.SCRIPTS.713] the old flat file is read, and the reading says so", flat && flat.folder === null && flat.notes[0].includes("old flat path"));
ok("[MKT.SCRIPTS.713] a flat language has no data, and `data check` refuses it saying so", run("data", "check", "old", "--book", flatBook, "--catalogue", catalogue).out.includes("no data/"));

console.log("\n=== extends names the parent alone");
ok("[MKT.SCRIPTS.717] `surface` and `surface@1` both name surface, and null names none", parentName("surface") === "surface" && parentName("surface@1") === "surface" && parentName(null) === null && parentName("Surface 1") === null);

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
