// The surface catalogue and a design language as generated regions: the reader, the resolver's five states, the frame both blocks draw.
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..", "..");
const { checkCatalogue, checkSpec, readChain, resolve: resolveLanguage, renderCatalogue, renderLanguage } = await import(pathToFileURL(resolve(HERE, "src", "scripts", "lib", "surface-catalogue.ts")).href);

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
const spec = (name, extendsRef, extra = {}) => ({ name, extends: extendsRef, domain: { product: "p", records: [], reads: "r" }, references: [], shared: {}, categories: {}, gaps: { notInTheLanguage: [], designSystemGaps: [], whatTheAgentMustAsk: [] }, ...extra });

const { catalogue, problems } = checkCatalogue(raw);
console.log("=== the catalogue reader");
ok("a catalogue with its outline is read", catalogue !== null && problems.length === 0, problems.join("; "));
ok("a catalogue without `outline` is refused, naming it", checkCatalogue({ version: "1", categories: {} }).problems.some((p) => p.includes("outline")));
ok("a part the outline names and a category lacks is refused", checkCatalogue({ ...raw, categories: { MARKETING: { LAYOUTS: [] } } }).problems.some((p) => p.includes("MARKETING.CONTAINERS")));

console.log("=== the catalogue frame");
const text = renderCatalogue(catalogue, "docs/specs/surface/catalogue.json");
ok("it opens with the Shared panel and one tab a part", text.startsWith("~~~group Shared | kept the same\n~~~tabs look=LINE\n--- Brand\n"));
{
  const anchors = [...text.matchAll(/^  Anchor: (\S+)$/gm)].map((m) => m[1]);
  ok("every kind's entry carries an anchor, <category>-<kind> in lower case with hyphens, once", anchors.length > 0 && anchors.every((a) => /^[a-z]+-[a-z0-9-]+$/.test(a)) && new Set(anchors).size === anchors.length && anchors.some((a) => a.startsWith("marketing-")), anchors.slice(0, 5).join());
}
{
  // A kind's whole entry stands once, in its own place: units, placement and style as JSON facts, default case, level, order and cases in words, a planned kind marked.
  const rich = checkCatalogue({ ...raw, categories: { MARKETING: { ...raw.categories.MARKETING, CONTAINERS: [kind("HERO", { status: "PLANNED", missing: "DSHeroScene", units: { container: { unit: "DSSectionContainer" } }, placement: { level: "2 OR DEEPER" }, style: { ground: "BASE" },
    defaultCase: "ON_SCENE", order: ["HERO", { kind: "DOORS", case: "DOOR_CARDS" }], cases: [{ code: "ON_SCENE", when: "the scene sets the ground", status: "PLANNED", missing: "DSScene" }] })] } } }).catalogue;
  const entry = renderCatalogue(rich, "docs/specs/surface/catalogue.json");
  ok("a kind's units, placement and style are JSON facts, its default case, level and order are in words, and each case is a line with what it needs",
    entry.includes("  Units: `{") && entry.includes("  Placement: `{") && entry.includes("  Style: `{") && entry.includes("  Default case: on scene") && entry.includes("  At level: 2 or deeper")
      && entry.includes("  Order: Hero → Doors (door cards)") && entry.includes("  Case: On scene | the scene sets the ground Planned: needs DSScene."), entry.slice(entry.indexOf("Hero |"), entry.indexOf("Hero |") + 900));
  ok("a planned kind is marked as planned and says what it needs", entry.includes("[HERO] [PLANNED]") && entry.includes("Planned: needs DSHeroScene."));
}
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
ok("it opens with the language's panel and links the parent's page", page.startsWith("~~~group Language | demo\n") && page.includes("Extends: [surface@1](13-language-surface.md)"));
ok("a kind's state stands as a tag beside its code", page.includes("  Code: [HERO] [CUSTOMISED]") && page.includes("  Code: [NUMBERS] [NOT_USED]") && page.includes("  Code: [PLANS] [NEW]"));
ok("the part's source and its values stand in the tab", page.includes("Filled by: [OWN]") && page.includes("  Source: [OWN]"));
ok("a value's key stands in words as its row's title, and its JSON is emitted for the writer to draw", !page.includes("\ntheBrand\n") && /\nThe brand\n  Source: \[(OWN|INHERITED)\]/.test(page) && /  Value: `\{"primary"/.test(page), page.slice(0, 900));
ok("a wholly inherited category is one line", renderLanguage(catalogue, resolveLanguage(catalogue, [root, spec("quiet", "surface@1")]), { specPath: "s.json" }).includes("Inherited whole from surface@1: this language says nothing here."));
// A LIST holds up to three facts beside its badge (RULE.DEVEX.WORKSPACE.576), so the writer never stops on a block it generates.
const factsBesideBadge = (md) => [...md.matchAll(/```catalog[^\n]*\n([\s\S]*?)```/g)].map(([, body]) => {
  const seen = new Map();
  for (const [, key, value] of body.matchAll(/^ {2}([A-Z][^:\n]*): (.*)$/gm)) {
    if (/^(For|Choose when|Not when|Rules)$/.test(key)) continue;
    seen.set(key, (seen.get(key) ?? true) && /^\s*(\[[^\]\[]+\]\s*)+$/.test(value));
  }
  return [...seen.values()].filter((badge) => !badge).length;
});
ok("[MKT.SCRIPTS.659] every list the language block writes names three keys or fewer beside its badge, across all its rows, a customised kind's config folded into one",
  Math.max(...factsBesideBadge(page)) <= 3 && page.includes("  Version") === false, JSON.stringify(factsBesideBadge(page)));
ok("it ends with the gaps and the spec in a fold", page.includes("~~~group Gaps |") && page.endsWith("```json file=docs/specs/design-languages/demo.spdl.json fold\n```"));

// A language is a folder, and `extends` may name the parent alone.
{
  const dir = mkdtempSync(join(tmpdir(), "spdl-folder-"));
  const put = (file, value) => { mkdirSync(resolve(file, ".."), { recursive: true }); writeFileSync(file, JSON.stringify(value)); };
  put(join(dir, "surface", "surface.spdl.json"), spec("surface", null));
  put(join(dir, "kid", "kid.spdl.json"), spec("kid", "surface"));
  put(join(dir, "old.spdl.json"), spec("old", "surface@1"));
  const bare = readChain(join(dir, "kid", "kid.spdl.json"), outline, [dir]);
  ok("a child that names its parent alone is read from the parent's folder", bare.problems.length === 0 && bare.chain.map((c) => c.name).join() === "surface,kid", bare.problems.join("; "));
  put(join(dir, "base", "base.spdl.json"), spec("base", null));
  put(join(dir, "kid2", "kid2.spdl.json"), spec("kid2", "surface@1"));
  const alias = readChain(join(dir, "kid2", "kid2.spdl.json"), outline, [dir]);
  ok("a child that still extends surface finds the language named base", alias.problems.length === 0 && alias.chain.map((c) => c.name).join() === "base,kid2", alias.problems.join("; "));
  const flat = readChain(join(dir, "old.spdl.json"), outline, [dir]);
  ok("a child that names surface@1 is still read", flat.problems.length === 0 && flat.chain.length === 2, flat.problems.join("; "));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-surface-catalogue` : `\n  all ${total} passed — t-surface-catalogue`);
process.exit(failed ? 1 : 0);
