// A design language kept as one folder (RULE.SUPPORT.SURFACE.628 to 636): where it is found, what its data and samples must agree
// on, and what `language diff` refuses. The data checks run on a small folder in the new shape; the contract's own reading of each
// file is `language check`'s, proved where the contract is installed.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SRC = resolve(import.meta.dirname, "..", "..", "..", "..", "..", "src");
const CLI = join(SRC, "scripts", "cli.ts");
const { parentName, findLanguage, loadData, checkData } = await import(pathToFileURL(join(SRC, "scripts", "commands", "language", "_folder.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 500)}` : ""}`);
};
const run = (...args) => {
  try { return { out: execFileSync("node", [CLI, "language", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 }; }
};
const root = mkdtempSync(join(tmpdir(), "t-language-data-"));
process.on("exit", () => rmSync(root, { recursive: true, force: true }));
const put = (file, value) => { mkdirSync(resolve(file, ".."), { recursive: true }); writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value)); };

// A catalogue in the in-memory shape the checks read, and a small language in the folder's shape.
const catalogue = {
  outline: { categories: { MARKETPLACE: { family: "SITE", person: "SEEKER" }, PORTAL: { family: "APP", person: "INDIVIDUAL" } } },
  categories: { MARKETPLACE: { PAGES: [{ code: "MARKET_ITEM" }, { code: "MARKET_SEARCH" }] }, PORTAL: { PAGES: [{ code: "HOME_APP" }] } },
};
const spec = { name: "demo", extends: "base", categories: { MARKETPLACE: {}, PORTAL: {} } };
const types = { types: [
  { type: "OrgCategory", file: "categories", medium: "NONE", roles: { title: "label" }, required: ["code", "label", "pluralLabel", "orgType"], derived: [], neededBy: [] },
  { type: "Org", file: "orgs", medium: "LOGO", roles: { title: "name" }, required: ["key", "name", "category"], derived: [], neededBy: [] },
  { type: "Person", file: "people", medium: "AVATAR", roles: { title: "name" }, required: ["key", "name"], derived: [], neededBy: [] },
  { type: "Member", file: "members", medium: "NONE", roles: { owner: "org" }, required: ["key", "person", "org", "role"], derived: [], neededBy: [] },
  { type: "Item", file: "items", medium: "PICTURE", roles: { title: "title", owner: "teacher" }, required: ["key", "title"], derived: [], neededBy: [] },
  { type: "Review", file: "reviews", medium: "AVATAR", roles: { title: "by", ratingSource: "rating" }, required: ["item"], derived: [], neededBy: [] },
] };
const data = {
  index: { domain: "Demo", line: "A demo", today: "2026-11-27", currency: "INR", files: ["categories", "orgs", "people", "members", "items", "reviews"] },
  categories: { type: "OrgCategory", records: [
    { code: "PLATFORM", label: "Platform", pluralLabel: "Platform", orgType: "PLATFORM", parentOrgCategoryCode: null },
    { code: "MERCHANT", label: "Merchant", pluralLabel: "Merchants", orgType: "ENTERPRISE", parentOrgCategoryCode: "PLATFORM" },
    { code: "SHOPPER", label: "Shopper", pluralLabel: "Shoppers", orgType: "CONSUMER", parentOrgCategoryCode: "PLATFORM" },
  ] },
  orgs: { type: "Org", records: [
    { key: "demo", name: "Demo", category: "PLATFORM", parent: null },
    { key: "studio", name: "A studio", category: "MERCHANT", parent: "demo" },
    { key: "ana", name: "Ana", category: "SHOPPER", parent: "demo" },
  ] },
  people: { type: "Person", records: [{ key: "mira", name: "Mira" }, { key: "ana", name: "Ana" }] },
  members: { type: "Member", records: [{ key: "mira@studio", person: "mira", org: "studio", role: "OWNER" }, { key: "ana@ana", person: "ana", org: "ana", role: "OWNER" }] },
  items: { type: "Item", records: [{ key: "course", title: "A course", teacher: "mira" }] },
  reviews: { type: "Review", records: [{ item: "course", by: "Ana P.", rating: 5 }] },
};
const samples = { categories: {
  MARKETPLACE: { person: { type: "SEEKER", who: "a learner", comes: "from a search", asks: "is it good", sees: "the catalogue" }, navigation: {}, words: {},
    pages: [{ page: "MARKET_ITEM", record: "items/course", as: null }, { page: "MARKET_SEARCH", record: null, as: null }], flows: [{ key: "BUY", pages: ["MARKET_SEARCH", "MARKET_ITEM"], record: "items/course" }] },
  PORTAL: { person: { type: "INDIVIDUAL", who: "Ana", comes: "to learn", asks: "where was I", sees: "her account" }, navigation: {}, words: {},
    pages: [{ page: "HOME_APP", record: null, as: "members/ana@ana" }], flows: [] },
} };
const write = (folder, over = {}) => {
  rmSync(folder, { recursive: true, force: true });
  put(join(folder, "spdl.json"), spec);
  put(join(folder, "types.json"), over.types ?? types);
  put(join(folder, "samples.json"), over.samples ?? samples);
  for (const [name, value] of Object.entries({ ...data, ...(over.data ?? {}) })) put(join(folder, "data", `${name}.json`), value);
  if (over.assets) for (const [name, value] of Object.entries(over.assets)) put(join(folder, "assets", name), value);
  return folder;
};
const problemsOf = (folder) => { const { data: read, problems } = loadData(folder); return problems.length ? problems : checkData(read, spec, catalogue, ["PENCIL"]); };
const lang = join(root, "docs", "specs", "surface", "languages", "demo");

{
  const clean = problemsOf(write(lang));
  ok("[MKT.SCRIPTS.714] a language folder whose data, types and samples agree has no problem", clean.length === 0, clean.join(" | "));
}
{
  const links = problemsOf(write(lang, { data: { items: { type: "Item", records: [{ key: "course", title: "A course", teacher: "nobody" }] } } }));
  ok("[MKT.SCRIPTS.715] a link that resolves to no record is refused, naming the file", links.some((one) => one.includes("data/items.json: teacher \"nobody\" resolves to no record of data/people.json")), links.join(" | "));
  const untyped = problemsOf(write(lang, { types: { types: types.types.filter((one) => one.type !== "Item") } }));
  ok("[MKT.SCRIPTS.715] a data file whose type types.json does not hold is refused", untyped.some((one) => one.includes("holds the type Item, which types.json does not hold")), untyped.join(" | "));
  const noMedium = problemsOf(write(lang, { types: { types: types.types.map((one) => (one.type === "Item" ? { ...one, medium: "COLOUR" } : one)) } }));
  ok("[MKT.SCRIPTS.715] a type with no medium is refused", noMedium.some((one) => one.includes("Item has no medium")), noMedium.join(" | "));
  const noRoles = problemsOf(write(lang, { types: { types: types.types.map((one) => (one.type === "Item" ? { ...one, roles: {} } : one)) } }));
  ok("[MKT.SCRIPTS.715] a type with no roles is refused", noRoles.some((one) => one.includes("Item has no roles")), noRoles.join(" | "));
  const derived = problemsOf(write(lang, { data: { orgs: { type: "Org", records: [...data.orgs.records.slice(0, 2), { ...data.orgs.records[2], courseCount: 3 }] } } }));
  ok("[MKT.SCRIPTS.715] a stored count, rating average or total is refused", derived.some((one) => one.includes("`courseCount` is a number the data can derive")), derived.join(" | "));
  const icon = problemsOf(write(lang, { data: { people: { type: "Person", records: [{ key: "mira", name: "Mira", icon: "SPARKLE" }, { key: "ana", name: "Ana", icon: "PENCIL" }] } } }));
  ok("[MKT.SCRIPTS.715] an icon the design system's DSIconType lacks is refused, one it holds is not", icon.some((one) => one.includes("the icon SPARKLE")) && !icon.some((one) => one.includes("PENCIL")), icon.join(" | "));
}
{
  const page = problemsOf(write(lang, { samples: { categories: { ...samples.categories, MARKETPLACE: { ...samples.categories.MARKETPLACE, pages: [{ page: "MARKET_CART", record: "items/nothing", as: null }] } } } }));
  ok("[MKT.SCRIPTS.718] a sample page that is no page kind of its category, or whose record does not resolve, is refused", page.some((one) => one.includes("MARKET_CART is no page kind of MARKETPLACE")) && page.some((one) => one.includes("record items/nothing resolves to no record of data/items.json")), page.join(" | "));
  const person = problemsOf(write(lang, { samples: { categories: { ...samples.categories, PORTAL: { ...samples.categories.PORTAL, person: { ...samples.categories.PORTAL.person, type: "SHOPPER" } } } } }));
  ok("[MKT.SCRIPTS.718] a person outside the surface person types is refused", person.some((one) => one.includes("the person SHOPPER is not a surface person type")), person.join(" | "));
  const flow = problemsOf(write(lang, { samples: { categories: { ...samples.categories, MARKETPLACE: { ...samples.categories.MARKETPLACE, flows: [{ key: "BUY", pages: ["MARKET_CHECKOUT"], record: null }] } } } }));
  ok("[MKT.SCRIPTS.718] a flow through a page the category does not sample is refused", flow.some((one) => one.includes("flow BUY: MARKET_CHECKOUT is none of the category's sample pages")), flow.join(" | "));
}
{
  const parent = problemsOf(write(lang, { data: { orgs: { type: "Org", records: [data.orgs.records[0], { ...data.orgs.records[1], parent: "studio" }, data.orgs.records[2]] } } }));
  ok("[MKT.SCRIPTS.719] an org whose parent is not of its category's parent category is refused", parent.some((one) => one.includes("studio is a MERCHANT, whose parent is a PLATFORM")), parent.join(" | "));
  const category = problemsOf(write(lang, { data: { orgs: { type: "Org", records: [...data.orgs.records, { key: "x", name: "X", category: "TENANT", parent: "demo" }] } } }));
  ok("[MKT.SCRIPTS.719] an org of a category categories.json does not hold is refused", category.some((one) => one.includes("x has the category TENANT")), category.join(" | "));
  const member = problemsOf(write(lang, { data: { members: { type: "Member", records: [{ key: "zed@nowhere", person: "zed", org: "nowhere", role: "" }] } } }));
  ok("[MKT.SCRIPTS.719] a member whose person or org does not resolve, or with no role, is refused", member.some((one) => one.includes('the person "zed"')) && member.some((one) => one.includes('the org "nowhere"')) && member.some((one) => one.includes("has no role")), member.join(" | "));
  const types2 = problemsOf(write(lang, { data: { categories: { type: "OrgCategory", records: data.categories.records.map((one) => (one.code === "MERCHANT" ? { ...one, orgType: "TENANT" } : one)) } } }));
  ok("[MKT.SCRIPTS.719] a category of an org type outside PLATFORM, ENTERPRISE and CONSUMER is refused", types2.some((one) => one.includes("the org type TENANT")), types2.join(" | "));
}
{
  const noSources = (() => { const folder = write(lang); put(join(folder, "assets", "brand", "mark.svg"), "<svg/>"); return loadData(folder).problems; })();
  ok("[MKT.SCRIPTS.720] an assets/ folder with no sources.json is refused", noSources.some((one) => one.includes("assets/ holds no sources.json")), noSources.join(" | "));
  const sources = problemsOf(write(lang, { assets: { "sources.json": { brand: {}, pictures: [{ record: "items/nowhere", field: "cover", file: null, caption: null, state: "AWAITED" }], drawings: [], note: null } } }));
  ok("[MKT.SCRIPTS.720] a picture sources.json lists for a record that is not there is refused", sources.some((one) => one.includes("assets/sources.json: record items/nowhere")), sources.join(" | "));
  const held = problemsOf(write(lang, { assets: { "sources.json": { brand: {}, pictures: [{ record: "items/course", field: "cover", file: null, caption: "a cover", state: "AWAITED" }], drawings: [], note: null } } }));
  ok("[MKT.SCRIPTS.720] an awaited picture of a record that is there is accepted", held.length === 0, held.join(" | "));
}
{
  write(lang);
  const found = findLanguage("demo", root, undefined);
  ok("[MKT.SCRIPTS.713] a language is found in its folder by spdl.json, with no note", found && found.spec.endsWith(join("demo", "spdl.json")) && found.notes.length === 0, JSON.stringify(found));
  const older = join(root, "docs", "specs", "surface", "languages", "aged");
  put(join(older, "aged.spdl.json"), { ...spec, name: "aged" });
  const named = findLanguage("aged", root, undefined);
  ok("[MKT.SCRIPTS.713] the old file name is read, and the reading says so", named && named.spec.endsWith("aged.spdl.json") && named.notes.some((one) => one.includes("the old file name")), JSON.stringify(named));
  put(join(root, "docs", "specs", "design-languages", "past", "spdl.json"), { ...spec, name: "past" });
  const past = findLanguage("past", root, undefined);
  ok("[MKT.SCRIPTS.713] the folder at the old design-languages path is read, and the reading says so", past && past.notes.some((one) => one.includes("the old folder")), JSON.stringify(past));
  put(join(root, "docs", "specs", "surface", "languages", "base", "spdl.json"), { ...spec, name: "base", extends: null });
  const renamed = findLanguage("surface", root, undefined);
  ok("[MKT.SCRIPTS.713] surface is read as base, and the reading says so", renamed && renamed.name === "base" && renamed.notes.some((one) => one.includes("now named `base`")), JSON.stringify(renamed));
}
ok("[MKT.SCRIPTS.717] `base`, `base@1`, `surface` and `surface@1` all name base, and null names none", ["base", "base@1", "surface", "surface@1"].every((one) => parentName(one) === "base") && parentName(null) === null);
{
  const a = join(root, "a.json"), b = join(root, "b.json");
  const kinds = (list) => ({ categories: { MARKETING: { PAGES: list } } });
  put(a, { version: "1.0.0", ...kinds([{ code: "HOME", cases: [{ code: "WIDE" }] }]) });
  put(b, kinds([{ code: "HOME", cases: [{ code: "WIDE" }] }, { code: "ABOUT" }]));
  const added = run("diff", a, b);
  ok("[MKT.SCRIPTS.716] a kind added, and the version key gone, is not a breaking change", added.code === 0 && added.out.startsWith("OK"), added.out);
  put(b, kinds([]));
  const gone = run("diff", a, b);
  ok("[MKT.SCRIPTS.716] a kind removed is refused and listed", gone.code === 1 && gone.out.includes("[HOME]"), gone.out);
  put(b, kinds([{ code: "HOME", status: "DEPRECATED", replacedBy: "MAIN_HOME", cases: [{ code: "WIDE" }] }]));
  ok("[MKT.SCRIPTS.716] a kind retired as DEPRECATED stays, and is not refused", run("diff", a, b).code === 0);
  put(b, kinds([{ code: "HOME", cases: [{ code: "BROAD" }] }]));
  ok("[MKT.SCRIPTS.716] a case renamed is refused", run("diff", a, b).code === 1);
  put(a, kinds([{ code: "HOME", title: "Home" }])); put(b, kinds([{ code: "HOME" }]));
  ok("[MKT.SCRIPTS.716] a field removed from a kind is refused", run("diff", a, b).code === 1);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
