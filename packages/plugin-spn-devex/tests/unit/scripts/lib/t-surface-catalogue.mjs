// The surface catalogue and a design language as generated regions: the reader, the resolver's five states, the frame both blocks draw.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..", "..");
const { checkCatalogue, checkSpec, resolve: resolveLanguage, renderCatalogue, renderLanguage } = await import(pathToFileURL(resolve(HERE, "src", "scripts", "lib", "surface-catalogue.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const part = (code, title, holds = "KINDS", values = { SITE: [], APP: [] }) => ({ code, title, description: `the ${title}`, holds, config: [], values });
const outline = {
  groups: [
    { code: "SHARED", title: "Shared", description: "kept the same", parts: [part("BRAND", "Brand", "VALUES", { ALL: ["theBrand"] })] },
    { code: "STRUCTURE", title: "Structure", description: "how pages are built", parts: [part("LAYOUTS", "Layouts"), part("CONTAINERS", "Containers")] },
    { code: "STYLE", title: "Style", description: "how pages look", parts: [part("THEME", "Theme")] },
  ],
  categories: { MARKETING: { family: "SITE", person: "VISITOR", description: "a site for a Visitor, who is deciding" } },
  partNotes: { MARKETING: { THEME: { none: "none defined yet: a site takes the one default theme" } } },
};
const kind = (code, extra = {}) => ({ code, title: code[0] + code.slice(1).toLowerCase(), description: `the ${code}`, config: {}, ...extra });
const raw = { version: "1.0.0", outline, categories: { MARKETING: { LAYOUTS: [kind("TOPNAV", { floor: true })], CONTAINERS: [kind("HERO"), kind("NUMBERS")], THEME: [] } } };
const decision = (extra) => ({ source: "OWN", pick: "ALL", customise: [], add: [], notUsed: [], values: { mtype: "X" }, why: "", ...extra });
const spec = (name, extendsRef, extra = {}) => ({ name, version: "1.0.0", extends: extendsRef, domain: { product: "p", records: [], reads: "r" }, references: [], shared: {}, categories: {}, gaps: { notInTheLanguage: [], designSystemGaps: [], whatTheAgentMustAsk: [] }, ...extra });

const { catalogue, problems } = checkCatalogue(raw);
console.log("=== the catalogue reader");
ok("a catalogue with its outline is read", catalogue !== null && problems.length === 0, problems.join("; "));
ok("a catalogue without `outline` is refused, naming it", checkCatalogue({ version: "1", categories: {} }).problems.some((p) => p.includes("outline")));
ok("a part the outline names and a category lacks is refused", checkCatalogue({ ...raw, categories: { MARKETING: { LAYOUTS: [] } } }).problems.some((p) => p.includes("MARKETING.CONTAINERS")));

console.log("=== the catalogue frame");
const text = renderCatalogue(catalogue, "docs/specs/surface/catalogue.json");
ok("it opens with the Shared panel and one tab a part", text.startsWith("~~~group Shared | kept the same\n~~~tabs look=LINE\n--- Brand\n"));
ok("a category is a heading and a Structure and a Style panel", text.includes("### MARKETING — a site for a Visitor\n\n~~~group Structure | how pages are built") && text.includes("~~~group Style | how pages look"));
ok("a kind's code and its floor are tags in one fact, and no state is drawn", text.includes("  Code: [TOPNAV] [FLOOR]") && !text.includes("State"));
ok("an empty part is its note as one row", text.includes("None defined yet | a site takes the one default theme"));
ok("the catalogue's JSON stands in a fold at the end", text.endsWith("```json file=docs/specs/surface/catalogue.json fold\n```"));

console.log("=== a language, read as the contract states it");
const old = { name: "x", version: "1.0.0", extends: null, domain: { product: "p", for: {}, records: [], reads: "r" }, serves: [], references: [], shared: { brand: {} }, site: {}, app: {}, gaps: {} };
const bad = checkSpec(old, outline).problems.join("\n");
ok("`serves`, `site`, `app`, `domain.for` and a lower-case part are each named", ["`serves`", "`site`", "`app`", "`domain.for`", "`shared.brand`", "`categories` is missing"].every((n) => bad.includes(n)), bad);
ok("a language of the contract's shape is read", checkSpec(spec("surface", null, { shared: { BRAND: decision({ values: { mtype: "BRAND", theBrand: { a: 1 } } }) } }), outline).problems.length === 0);

console.log("=== the resolver");
const root = spec("surface", null, { shared: { BRAND: decision({ values: { mtype: "BRAND", theBrand: { primary: "x" } }, why: "root" }) }, categories: { MARKETING: { LAYOUTS: decision(), CONTAINERS: decision() } } });
const child = spec("demo", "surface@1", {
  shared: { BRAND: decision({ pick: undefined, values: { mtype: "BRAND", theBrand: { primary: "y" } } }) },
  categories: {
    MARKETING: {
      CONTAINERS: decision({ pick: undefined, customise: [{ code: "HERO", change: "bigger", config: { mtype: "CONTAINERS", size: "XL" } }], add: [kind("PLANS")], notUsed: ["NUMBERS"] }),
    },
    CONSOLE: { family: "APP", person: "TEAM", from: "the admin", LAYOUTS: decision({ add: [kind("RAIL")] }) },
  },
});
const stateOf = (r, cat, partCode, code) => r.categories.find((c) => c.code === cat).parts.find((p) => p.code === partCode).kinds.find((k) => k.kind.code === code);
const rootOnly = resolveLanguage(catalogue, [root]);
ok("the root picks every kind: PICKED", stateOf(rootOnly, "MARKETING", "CONTAINERS", "HERO").state === "PICKED");
const r = resolveLanguage(catalogue, [root, child]);
ok("a kind the child names to change is CUSTOMISED, with its change and merged config", stateOf(r, "MARKETING", "CONTAINERS", "HERO").state === "CUSTOMISED" && stateOf(r, "MARKETING", "CONTAINERS", "HERO").change === "bigger" && stateOf(r, "MARKETING", "CONTAINERS", "HERO").kind.config.size === "XL");
ok("a kind the child adds is NEW, and follows the core kinds", stateOf(r, "MARKETING", "CONTAINERS", "PLANS").state === "NEW" && r.categories[0].parts[1].kinds.at(-1).kind.code === "PLANS");
ok("a kind the child leaves out is NOT_USED", stateOf(r, "MARKETING", "CONTAINERS", "NUMBERS").state === "NOT_USED");
ok("a kind the child says nothing about is INHERITED from the parent", stateOf(r, "MARKETING", "LAYOUTS", "TOPNAV").state === "INHERITED" && stateOf(r, "MARKETING", "LAYOUTS", "TOPNAV").definedIn === "surface");
ok("a category the catalogue lacks is NEW, with its own kinds only", r.categories.find((c) => c.code === "CONSOLE").fresh && stateOf(r, "CONSOLE", "LAYOUTS", "RAIL").state === "NEW");
ok("a value is OWN where the child states it", r.shared[0].values[0].source === "OWN" && r.shared[0].values[0].value.primary === "y");
const two = resolveLanguage(catalogue, [root, spec("quiet", "surface@1", { shared: { BRAND: decision({ values: { mtype: "BRAND", other: 1 } }) } })]);
ok("a value the child does not state keeps the parent's, INHERITED, and the keys merge", two.shared[0].values.map((v) => `${v.key}:${v.source}`).join() === "theBrand:INHERITED,other:OWN");
ok("a child that names no category is wholly inherited there", resolveLanguage(catalogue, [root, spec("quiet", "surface@1")]).categories[0].wholly);
ok("a child that customises a code the parents lack is a problem", resolveLanguage(catalogue, [root, spec("c", "surface@1", { categories: { MARKETING: { CONTAINERS: decision({ pick: undefined, customise: [{ code: "GONE", change: "x" }] }) } } })]).problems.length === 1);

console.log("=== a language's frame");
const page = renderLanguage(catalogue, r, { specPath: "specs/design-languages/demo.spdl.json", parentPage: "13-language-surface.md" });
ok("it opens with the language's panel and links the parent's page", page.startsWith("~~~group Language | demo 1.0.0") && page.includes("Extends: [surface@1](13-language-surface.md)"));
ok("a kind's state stands as a tag beside its code", page.includes("  Code: [HERO] [CUSTOMISED]") && page.includes("  Code: [NUMBERS] [NOT_USED]") && page.includes("  Code: [PLANS] [NEW]"));
ok("the part's source and its values stand in the tab", page.includes("Filled by: [OWN]") && page.includes("  Source: [OWN]"));
ok("a wholly inherited category is one line", renderLanguage(catalogue, resolveLanguage(catalogue, [root, spec("quiet", "surface@1")]), { specPath: "s.json" }).includes("Inherited whole from surface@1: this language says nothing here."));
ok("it ends with the gaps and the spec in a fold", page.includes("~~~group Gaps |") && page.endsWith("```json file=docs/specs/design-languages/demo.spdl.json fold\n```"));

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-surface-catalogue` : `\n  all ${total} passed — t-surface-catalogue`);
process.exit(failed ? 1 : 0);
