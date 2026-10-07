// The three scripts that give the tool's inventory: `inventory.js` (the units of a page), `tokens.js` (the
// variables and styles of a file) and `assemble.mjs` (the answers of both, put into one inventory file).
//
// The two scripts for the connector run here as the connector runs them, on a stand-in of the parts of the Figma
// API they use. `assemble.mjs` runs as Node runs it, on a folder of saved answers. The case that matters most is
// the last one: a file built from a raw fixture gives, through the three scripts, the inventory that the tool's
// own helper (`reduceRawToInventory`, in spn-support-ts) gives from that raw fixture. The helper's two outputs
// for the fixture are held in `fixtures/` as data; they were written by the helper itself (see the fixtures'
// README line in this file's last section), so no copy of the helper's rule lives here.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPTS = process.env.FIGMA_SCRIPTS ?? resolve(import.meta.dirname, "..", "..", "..", "..", "src", "skills", "design", "scripts");
const FIXTURES = resolve(import.meta.dirname, "fixtures");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const INPUTS_BLOCK = /const INPUTS = \{[\s\S]*?\n\};/;

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const same = (label, actual, expected) =>
  ok(label, JSON.stringify(actual) === JSON.stringify(expected), `got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`);
async function guard(body) {
  try { await body(); } catch (error) { ok(`a case crashed: ${String(error?.message ?? error)}`, false, String(error?.stack ?? "").split("\n")[1] ?? ""); }
}

// ---- the stand-in -------------------------------------------------------------------------------

const alias = (name) => ({ id: `V:${name}` });
const solid = (variable) => ({ type: "SOLID", boundVariables: variable ? { color: alias(variable) } : {} });
const boundOf = (bound) => Object.fromEntries(Object.entries(bound ?? {}).map(([field, name]) => [field, ["fills", "strokes", "effects"].includes(field) ? [alias(name)] : alias(name)]));

// A layer: a node with children, as `findAll` walks them in order.
function layer(id, name, type, fields = {}, children = []) {
  const node = { id, name, type, children, ...fields };
  for (const child of children) child.parent = node;
  if (fields.bound !== undefined) { node.boundVariables = boundOf(fields.bound); delete node.bound; }
  node.findAll = (test) => {
    const found = [];
    const walk = (parent) => { for (const child of parent.children) { if (test(child)) found.push(child); walk(child); } };
    walk(node);
    return found;
  };
  return node;
}

function versionNode(id, name, { box = [0, 0, 100, 40], frame = {}, layers = [] } = {}) {
  const node = layer(id, name, "COMPONENT", {
    x: box[0], y: box[1], width: box[2], height: box[3],
    fills: [], strokes: [], effects: [], effectStyleId: "",
    strokeTopWeight: 0, strokeBottomWeight: 0, strokeLeftWeight: 0, strokeRightWeight: 0,
    topLeftRadius: 0, topRightRadius: 0, bottomLeftRadius: 0, bottomRightRadius: 0,
    ...frame,
  }, layers);
  Object.defineProperty(node, "componentPropertyDefinitions", { configurable: true, get() { throw new Error("can only get component property definitions of a component set or non-variant component"); } });
  return node;
}

function setNode(id, name, versions, { key = `key-${id}`, definitions = {}, unreadable = false } = {}) {
  const node = layer(id, name, "COMPONENT_SET", { key, x: 0, y: 0, width: 300, height: 200 }, versions);
  Object.defineProperty(node, "componentPropertyDefinitions", { get() { if (unreadable) throw new Error("Component set has existing errors"); return definitions; } });
  Object.defineProperty(node, "defaultVariant", { get() { return [...node.children].sort((first, second) => first.y - second.y || first.x - second.x)[0]; } });
  return node;
}

function lone(id, name, { key = `key-${id}`, definitions = {}, ...rest } = {}) {
  const node = versionNode(id, name, rest);
  node.key = key;
  Object.defineProperty(node, "componentPropertyDefinitions", { get() { return definitions; } });
  return node;
}

function pageNode(id, name, children) {
  const node = { id, name, type: "PAGE", children };
  for (const child of children) child.parent = node;
  node.findAllWithCriteria = ({ types }) => {
    const found = [];
    const walk = (parent) => { for (const child of parent.children) { if (types.includes(child.type)) found.push(child); walk(child); } };
    walk(node);
    return found;
  };
  return node;
}

function figmaFile(name, pages, { collections = [], variables = [], textStyles = [], effectStyles = [] } = {}) {
  const everything = new Map();
  const walk = (node) => { everything.set(node.id, node); for (const child of node.children ?? []) walk(child); };
  const root = { id: "0:0", name, type: "DOCUMENT", children: pages };
  for (const node of pages) walk(node);
  return {
    root, switches: 0, skipInvisibleInstanceChildren: true,
    async getNodeByIdAsync(id) { return everything.get(id) ?? null; },
    async setCurrentPageAsync() { this.switches += 1; },
    variables: {
      async getLocalVariableCollectionsAsync() { return collections; },
      async getLocalVariablesAsync() { return variables; },
      async getVariableByIdAsync(id) { return id.startsWith("V:") ? { name: id.slice(2) } : null; },
    },
    async getLocalTextStylesAsync() { return textStyles; },
    async getLocalEffectStylesAsync() { return effectStyles; },
  };
}

async function run(script, inputs, figma) {
  const body = readFileSync(resolve(SCRIPTS, script), "utf8");
  const defaults = new Function(`return ${INPUTS_BLOCK.exec(body)[0].slice("const INPUTS = ".length, -1)}`)();
  const filled = body.replace(INPUTS_BLOCK, () => `const INPUTS = ${JSON.stringify({ ...defaults, ...inputs })};`);
  return new AsyncFunction("figma", filled)(figma);
}

// ---- a set read by hand: every reduced fact, from layers whose facts are known ------------------------

console.log("=== inventory.js — the facts of a set");
const boxSet = () => {
  const text = layer("10:t", "label", "TEXT", { width: 40, height: 20, fontSize: 14, textCase: "UPPER", textDecoration: "UNDERLINE", fills: [solid("fg")], strokes: [], layoutSizingHorizontal: "HUG", layoutSizingVertical: "HUG", bound: { fontSize: "type/md" } });
  const inner = layer("10:i", "inner", "FRAME", { width: 40, height: 20, paddingTop: 99, itemSpacing: 99, fills: [], strokes: [solid("line/inner")], layoutSizingHorizontal: "FIXED", layoutSizingVertical: "FIXED" }, [text]);
  const row = layer("10:r", "row", "FRAME", {
    width: 80, height: 30, paddingTop: 8, paddingLeft: 12, itemSpacing: 4, topLeftRadius: 6, strokeTopWeight: 1,
    fills: [solid("surface")], strokes: [], layoutSizingHorizontal: "FILL", layoutSizingVertical: "HUG",
    bound: { paddingTop: "space/2", itemSpacing: "space/1", topLeftRadius: "radius/md", strokeTopWeight: "border/hair", height: "size/md" },
  }, [inner]);
  const first = versionNode("10:a", "size=MD, tone=plain", {
    box: [20, 20, 100, 40],
    frame: { strokeTopWeight: 1, strokes: [solid("line/frame")], topLeftRadius: 4, effects: [{ type: "DROP_SHADOW" }], boundVariables: boundOf({ paddingLeft: "space/3", strokes: "line/frame" }) },
    layers: [row],
  });
  const second = versionNode("10:b", "size=SM, tone=plain", { box: [20, 80, 100, 40], layers: [layer("10:s", "plain", "FRAME", { width: 10, height: 10, paddingTop: 2, fills: [], strokes: [], layoutSizingHorizontal: "HUG", layoutSizingVertical: "HUG" })] });
  return setNode("10:set", "DSBox", [second, first], { key: "k-box", definitions: { size: { type: "VARIANT", defaultValue: "MD", variantOptions: ["SM", "MD"] }, "withIcon#1:0": { type: "BOOLEAN", defaultValue: false } } });
};
await guard(async () => {
  const figma = figmaFile("DS Test", [pageNode("2:1", "Boxes", [boxSet()])]);
  const answer = await run("inventory.js", { pageId: "2:1", measuresFor: ["DSBox"] }, figma);
  const unit = answer.units[0];
  same("the answer says what it is, whose it is, and where the page stands", [answer.script, answer.file, answer.page, answer.unitCount, answer.range, answer.next], ["inventory", "DS Test", { id: "2:1", name: "Boxes", index: 0 }, 1, [0, 1], null]);
  same("the page is switched to once, and invisible instance children are read", [figma.switches, figma.skipInvisibleInstanceChildren], [1, false]);
  same("a unit is one entry: its key, name, kind, versions, and the default Figma reports (the top left)", [unit.index, unit.id, unit.name, unit.kind, unit.versionCount, unit.defaultVersion], [0, "k-box", "DSBox", "SET", 2, "size=MD, tone=plain"]);
  same("props keep Figma's names and the id suffix", unit.props, { size: { type: "VARIANT", default: "MD", values: ["SM", "MD"] }, "withIcon#1:0": { type: "BOOLEAN", default: false, values: null } });
  same("boundVariables: the names bound by any layer's fields and any paint, sorted",
    unit.drawn.boundVariables, ["border/hair", "fg", "line/inner", "radius/md", "size/md", "space/1", "space/2", "surface", "type/md"]);
  same("frameVariables: the version's own bound fields, fills and strokes, sorted", unit.drawn.frameVariables, ["line/frame", "space/3"]);
  same("sizing: only the layers directly under a version, over every version", unit.drawn.sizing, { horizontal: ["FILL", "HUG"], vertical: ["HUG"] });
  same("frame: a stroke weight and a stroke paint, an effect, a corner radius; false before true", unit.drawn.frame, { stroke: [false, true], effect: [false, true], radius: [false, true] });
  same("text: the case and the decoration of the text layers", unit.drawn.text, { case: ["UPPER"], decoration: ["UNDERLINE"] });
  same("a version holds its name and box, and the first layer's number with its variable for each measure", unit.versions.map((version) => [version.name, version.w, version.h]), [["size=SM, tone=plain", 100, 40], ["size=MD, tone=plain", 100, 40]]);
  same("a measure is the first layer in order that holds the field: not the inner layer's 99",
    [unit.versions[1].measures.paddingTop, unit.versions[1].measures.gap, unit.versions[1].measures.radiusTopLeft, unit.versions[1].measures.border, unit.versions[1].measures.textSize],
    [{ value: 8, variable: "space/2" }, { value: 4, variable: "space/1" }, { value: 6, variable: "radius/md" }, { value: 1, variable: "border/hair" }, { value: 14, variable: "type/md" }]);
  same("a measure no layer holds is left out, and one that is not bound has no variable",
    [Object.keys(unit.versions[1].measures), unit.versions[1].measures.paddingLeft, Object.keys(unit.versions[0].measures)],
    [["paddingTop", "paddingLeft", "gap", "radiusTopLeft", "border", "textSize"], { value: 12, variable: null }, ["paddingTop"]]);
});

console.log("\n=== inventory.js — the depths, ranges and units that are not sets");
await guard(async () => {
  const figma = figmaFile("DS Test", [pageNode("2:1", "Boxes", [boxSet()])]);
  const answer = await run("inventory.js", { pageId: "2:1" }, figma);
  same("with no unit named for measures a unit holds no versions (depth 2)", [answer.units[0].versions, answer.units[0].drawn !== null], [null, true]);
  const listed = await run("inventory.js", { pageId: null }, figma);
  same("with no page id the pages are listed with their place, and no page is switched to", [listed.pages, figma.switches], [[{ id: "2:1", name: "Boxes", index: 0 }], 1]);
});
await guard(async () => {
  const sets = Array.from({ length: 6 }, (_, at) => setNode(`${at}:set`, `DSUnit${at}`, [versionNode(`${at}:a`, "a=1", { box: [0, 0, 10, 10] })], { definitions: { a: { type: "VARIANT", defaultValue: "1", variantOptions: ["1"] } } }));
  const figma = figmaFile("DS Test", [pageNode("2:1", "Many", sets)]);
  const first = await run("inventory.js", { pageId: "2:1", from: 0, to: 4 }, figma);
  same("a range of units gives those units, with their place", [first.units.map((unit) => unit.index), first.range, first.next], [[0, 1, 2, 3], [0, 4], null]);
  const cut = await run("inventory.js", { pageId: "2:1", maxBytes: 700 }, figma);
  ok("an answer over the byte limit stops by itself and says where to go on", cut.next !== null && cut.units.length === cut.next && cut.units.length < 6, JSON.stringify([cut.next, cut.units.length]));
  const rest = await run("inventory.js", { pageId: "2:1", from: cut.next, maxBytes: 16000 }, figma);
  same("going on from `next` gives the rest, and the answers run on without a gap", [cut.units.length + rest.units.length, cut.range[1] === rest.range[0], rest.next], [6, true, null]);
  const slow = await run("inventory.js", { pageId: "2:1", maxSeconds: -1 }, figma);
  same("after its time the script stops at a unit's end and says where to go on", [slow.units.length, slow.next], [1, 1]);
});
await guard(async () => {
  const alone = lone("5:c", "DSElementObserver", { key: "k-alone", definitions: { "label#1:0": { type: "TEXT", defaultValue: "x" } }, layers: [layer("5:l", "inner", "FRAME", { width: 5, height: 5, paddingTop: 3, fills: [], strokes: [], layoutSizingHorizontal: "FILL", layoutSizingVertical: "FILL" })] });
  const inside = setNode("6:set", "DSSet", [versionNode("6:v", "a=1")]);
  const figma = figmaFile("DS Test", [pageNode("2:1", "Mixed", [alone, inside])]);
  const answer = await run("inventory.js", { pageId: "2:1", measuresFor: ["DSElementObserver"] }, figma);
  same("a lone component is a unit of kind COMPONENT with one version, and a version of a set is no unit", answer.units.map((unit) => [unit.name, unit.kind, unit.versionCount, unit.defaultVersion]), [["DSElementObserver", "COMPONENT", 1, "DSElementObserver"], ["DSSet", "SET", 1, "a=1"]]);
  same("a lone component's props come from itself and its measures from its layers", [answer.units[0].props, answer.units[0].versions[0].measures.paddingTop], [{ "label#1:0": { type: "TEXT", default: "x", values: null } }, { value: 3, variable: null }]);
});
await guard(async () => {
  const broken = setNode("7:set", "DSBroken", [versionNode("7:v", "a=1")], { unreadable: true });
  const figma = figmaFile("DS Test", [pageNode("2:1", "Broken", [broken, boxSet()])]);
  const answer = await run("inventory.js", { pageId: "2:1" }, figma);
  same("a set that cannot be read is listed with its error and the others are read", [answer.unreadable.map((entry) => [entry.name, entry.error]), answer.units.map((unit) => unit.name)], [[["DSBroken", "Component set has existing errors"]], ["DSBox"]]);
});
await guard(async () => {
  const many = setNode("8:set", "DSMany", Array.from({ length: 6 }, (_, at) => versionNode(`8:${at}`, `n=${at}`, { box: [0, at * 50, 10, 10], layers: [layer(`8:${at}:l`, "inner", "FRAME", { width: 5, height: 5, paddingTop: at, fills: [], strokes: [] })] })), { definitions: { n: { type: "VARIANT", defaultValue: "0", variantOptions: [] } } });
  const figma = figmaFile("DS Test", [pageNode("2:1", "Many", [many])]);
  const whole = (await run("inventory.js", { pageId: "2:1", measuresFor: ["DSMany"] }, figma)).units[0].versions;
  const window = await run("inventory.js", { pageId: "2:1", measuresFor: ["DSMany"], versionsFrom: 2, versionsTo: 4 }, figma);
  same("a window of one unit's versions gives only those versions", window.units[0].versions.map((version) => version.name), whole.slice(2, 4).map((version) => version.name));
  const cut = await run("inventory.js", { pageId: "2:1", measuresFor: ["DSMany"], maxBytes: 800 }, figma);
  ok("versions that do not fit are cut, and the answer says where its unit goes on", cut.next === 0 && cut.nextVersion > 0 && cut.units[0].versions.length === cut.nextVersion, JSON.stringify([cut.next, cut.nextVersion]));
  const rest = await run("inventory.js", { pageId: "2:1", measuresFor: ["DSMany"], from: cut.next, versionsFrom: cut.nextVersion }, figma);
  same("going on from the unit and its version gives the rest of its versions", [cut.units[0].versions.length + rest.units[0].versions.length, rest.next], [6, null]);
});

// ---- the tokens ---------------------------------------------------------------------------------

console.log("\n=== tokens.js — the variables and the styles");
const mode = (modeId, name) => ({ modeId, name });
const variableOf = (id, name, collection, resolvedType, valuesByMode) => ({ id, name, variableCollectionId: collection, resolvedType, valuesByMode });
const tokenParts = {
  collections: [
    { id: "C1", name: "Roles", modes: [mode("m1", "Light"), mode("m2", "Dark")], defaultModeId: "m1" },
    { id: "C2", name: "Scale", modes: [mode("m3", "Web")], defaultModeId: "m3" },
    { id: "C3", name: "Empty", modes: [mode("m4", "Default")], defaultModeId: "m4" },
  ],
  variables: [
    variableOf("VariableID:1", "surface", "C1", "COLOR", { m1: { type: "VARIABLE_ALIAS", id: "VariableID:2" }, m2: { r: 0, g: 0.5, b: 1, a: 0.5 } }),
    variableOf("VariableID:2", "color/neutral/0", "C1", "COLOR", { m1: { r: 1, g: 1, b: 1, a: 1 }, m2: { r: 1, g: 1, b: 1 } }),
    variableOf("VariableID:3", "icon-size/xs", "C2", "FLOAT", { m3: 12 }),
    variableOf("VariableID:4", "label", "C2", "STRING", { m3: "Hello" }),
    variableOf("VariableID:5", "flag", "C2", "BOOLEAN", { m3: true }),
  ],
  textStyles: [{ name: "heading/xl", fontSize: 40, lineHeight: { unit: "PERCENT", value: 120 }, fontName: { family: "Inter" } }],
  effectStyles: [{ name: "shadow/md", effects: [{ type: "DROP_SHADOW" }] }],
};
const tokenFile = () => figmaFile("DS Test", [], tokenParts);
await guard(async () => {
  const answer = await run("tokens.js", {}, tokenFile());
  same("the answer says what it is, whose it is, and counts its items (variables, text styles, effect styles)", [answer.script, answer.file, answer.itemCount, answer.range, answer.next], ["tokens", "DS Test", 7, [0, 7], null]);
  same("every collection is listed with its default mode and modes, and an empty one is kept", answer.collections.map((collection) => [collection.name, collection.defaultMode, collection.modes, collection.variables.length]), [["Roles", "Light", ["Light", "Dark"], 2], ["Scale", "Web", ["Web"], 3], ["Empty", "Default", ["Default"], 0]]);
  same("a value is an alias kept as the name it points to, a colour as hex with alpha, or the number, string or boolean itself",
    answer.collections.flatMap((collection) => collection.variables.map((variable) => [variable.name, variable.type, variable.values])),
    [["surface", "COLOR", { Light: { alias: "color/neutral/0" }, Dark: "#0080ff80" }], ["color/neutral/0", "COLOR", { Light: "#ffffffff", Dark: "#ffffffff" }], ["icon-size/xs", "FLOAT", { Web: 12 }], ["label", "STRING", { Web: "Hello" }], ["flag", "BOOLEAN", { Web: true }]]);
  same("a text style keeps its size and line height, an effect style its name", answer.styles, { text: [{ name: "heading/xl", fontSize: 40, lineHeight: { unit: "PERCENT", value: 120 } }], effect: [{ name: "shadow/md" }] });
});
await guard(async () => {
  const cut = await run("tokens.js", { maxBytes: 900 }, tokenFile());
  ok("an answer over the byte limit stops by itself and says where to go on", cut.next !== null && cut.next < 7, JSON.stringify(cut.next));
  const rest = await run("tokens.js", { from: cut.next, maxBytes: 16000 }, tokenFile());
  same("going on from `next` reaches the end, and a later answer lists only the collections it touches", [rest.range[0], rest.range[1], rest.next, rest.collections.some((collection) => collection.name === "Empty")], [cut.next, 7, null, false]);
});
ok("tokens.js reads without switching a page", await (async () => { const figma = tokenFile(); await run("tokens.js", {}, figma); return figma.switches === 0; })());

// ---- the assembling script -----------------------------------------------------------------------

console.log("\n=== assemble.mjs — the answers put into one inventory");
const scratch = mkdtempSync(join(tmpdir(), "figma-assemble-"));
let folderCount = 0;
// Saves the answers as the connector returned them, each as one file, and runs the script on the folder.
function assemble(answersList, extra = []) {
  folderCount += 1;
  const folder = join(scratch, `answers-${folderCount}`);
  mkdirSync(folder, { recursive: true });
  answersList.forEach((answer, at) => writeFileSync(join(folder, `${String(at).padStart(2, "0")}.json`), JSON.stringify(answer)));
  const out = join(scratch, `inventory-${folderCount}.json`);
  try {
    const said = execFileSync(process.execPath, [resolve(SCRIPTS, "assemble.mjs"), "--answers", folder, "--out", out, ...extra], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { exit: 0, said, inventory: JSON.parse(readFileSync(out, "utf8")) };
  } catch (error) {
    return { exit: error.status, said: String(error.stderr), inventory: null };
  }
}
const twoPages = () => figmaFile("DS 4-Containers", [pageNode("2:1", "Boxes", [boxSet()]), pageNode("2:2", "Cover", []), pageNode("2:3", "More", [setNode("3:set", "DSMore", [versionNode("3:a", "a=1")], { definitions: { a: { type: "VARIANT", defaultValue: "1", variantOptions: ["1"] } } })])],
  { collections: [{ id: "C1", name: "Roles", modes: [mode("m1", "Light")], defaultModeId: "m1" }], variables: [variableOf("VariableID:1", "surface", "C1", "COLOR", { m1: { r: 0, g: 0, b: 0, a: 1 } })], textStyles: [{ name: "t", fontSize: 12, lineHeight: { unit: "AUTO" } }] });
const readAll = async (figma, measuresFor = []) => {
  const listed = await run("inventory.js", { pageId: null }, figma);
  const reads = [];
  for (const page of listed.pages) reads.push(await run("inventory.js", { pageId: page.id, measuresFor }, figma));
  return [listed, ...reads, await run("tokens.js", {}, figma)];
};
await guard(async () => {
  const answersList = await readAll(twoPages());
  const result = assemble(answersList);
  const inventory = result.inventory;
  same("the inventory's keys are in the contract's order, and `counts` is written last", Object.keys(inventory), ["inventoryVersion", "file", "collections", "styles", "pages", "counts"]);
  same("the file is named from its answers, the slug and layer follow from the name, the depth is 2", [inventory.file.name, inventory.file.slug, inventory.file.layer, inventory.file.depth, inventory.inventoryVersion], ["DS 4-Containers", "ds-4-containers", "CONTAINERS", 2, 1]);
  same("only the pages that hold a unit are in it, in the file's order", inventory.pages.map((page) => [page.id, page.name, page.units.map((unit) => unit.name)]), [["2:1", "Boxes", ["DSBox"]], ["2:3", "More", ["DSMore"]]]);
  same("a unit holds no `index` and the counts are what the file holds", [Object.keys(inventory.pages[0].units[0]).includes("index"), inventory.counts], [false, { pages: 2, units: 2, variables: 1, textStyles: 1, effectStyles: 0 }]);
  ok("readAt is the earliest time any answer was read", inventory.file.readAt === answersList.map((answer) => answer.readAt).sort()[0]);
  same("--layer and --slug are taken as given", [assemble(answersList, ["--layer", "WIDGETS", "--slug", "ds-3-widgets"]).inventory.file.layer, assemble(answersList, ["--layer", "WIDGETS", "--slug", "ds-3-widgets"]).inventory.file.slug], ["WIDGETS", "ds-3-widgets"]);
  const renamed = assemble(answersList.map((answer) => ({ ...answer, file: "Document" })), ["--name", "DS 3-Widgets"]).inventory;
  same("the connector names a document `Document`, so --name gives the file's name, and the slug and layer follow", [renamed.file.name, renamed.file.slug, renamed.file.layer], ["DS 3-Widgets", "ds-3-widgets", "WIDGETS"]);
  const withMeasures = assemble(await readAll(twoPages(), ["DSBox"]));
  same("a unit read with its versions makes the depth 3, and the other units hold none", [withMeasures.inventory.file.depth, withMeasures.inventory.pages[0].units[0].versions.length, withMeasures.inventory.pages[1].units[0].versions], [3, 2, null]);
});
await guard(async () => {
  const answersList = await readAll(twoPages());
  const refuses = (label, list, wanted) => { const result = assemble(list); ok(`it refuses ${label}, naming it, and writes nothing`, result.exit === 1 && result.said.includes(wanted) && result.inventory === null, result.said); };
  refuses("a page that was listed and not read", answersList.filter((answer) => answer.page?.id !== "2:3"), "the page More (2:3) was listed and has no answer");
  refuses("a list of pages that is missing", answersList.filter((answer) => answer.pages === undefined), "one answer that lists the pages");
  refuses("a file with no tokens", answersList.filter((answer) => answer.script !== "tokens"), "no answer of tokens.js");
  const gap = structuredClone(answersList);
  gap[1].range = [0, 1]; gap[1].unitCount = 3; gap[1].next = 1;
  refuses("a page whose answers stop before its end", gap, "page Boxes");
  const otherFile = structuredClone(answersList);
  otherFile[2].file = "DS 5-Layouts";
  refuses("answers of two files", otherFile, "the answers are for 2 files");
  const unreadable = structuredClone(answersList);
  unreadable[1].unreadable = [{ index: 0, id: "9:9", name: "DSBroken", error: "Component set has existing errors" }];
  refuses("a unit that cannot be read", unreadable, "the unit DSBroken (9:9) of the page Boxes cannot be read: Component set has existing errors");
  const unfinished = structuredClone(answersList);
  unfinished.find((answer) => answer.script === "tokens").next = 3;
  refuses("tokens whose last answer still has `next`", unfinished, "still has next 3");
  const notJson = join(scratch, "bad");
  mkdirSync(notJson, { recursive: true });
  writeFileSync(join(notJson, "a.json"), "not json");
  let exit = 0;
  try { execFileSync(process.execPath, [resolve(SCRIPTS, "assemble.mjs"), "--answers", notJson, "--out", join(scratch, "bad.json")], { stdio: "pipe" }); } catch (error) { exit = error.status; }
  same("a file that is not JSON is refused", exit, 1);
});
await guard(async () => {
  // a unit cut inside its versions, and a page cut between units, put back together by the assembling script
  const many = () => figmaFile("DS 4-Containers", [pageNode("2:1", "Many", [
    setNode("8:set", "DSMany", Array.from({ length: 6 }, (_, at) => versionNode(`8:${at}`, `n=${at}`, { box: [0, at * 50, 10, 10], layers: [layer(`8:${at}:l`, "inner", "FRAME", { width: 5, height: 5, paddingTop: at, fills: [], strokes: [] })] })), { definitions: { n: { type: "VARIANT", defaultValue: "0", variantOptions: [] } } }),
    setNode("9:set", "DSAfter", [versionNode("9:a", "a=1")]),
  ])], tokenParts);
  const figma = many();
  const listed = await run("inventory.js", { pageId: null }, figma);
  const tokens = await run("tokens.js", {}, figma);
  const whole = assemble([listed, await run("inventory.js", { pageId: "2:1", measuresFor: ["DSMany"] }, figma), tokens]).inventory;
  const first = await run("inventory.js", { pageId: "2:1", measuresFor: ["DSMany"], maxBytes: 800 }, figma);
  const second = await run("inventory.js", { pageId: "2:1", measuresFor: ["DSMany"], from: first.next, versionsFrom: first.nextVersion }, figma);
  const cut = assemble([listed, first, second, tokens]).inventory;
  ok("the cut answers give the inventory the whole answer gives", first.nextVersion > 0 && JSON.stringify(cut) === JSON.stringify(whole), `${first.nextVersion} ${JSON.stringify(cut).length} ${JSON.stringify(whole).length}`);
});

// ---- the one equality that matters: the tool's helper, on the same file -------------------------------

console.log("\n=== the three scripts give what the tool's helper gives, from the same file");
// `fixtures/raw-fixture.json` is a cut of the real raw files of 2026-10-06 (two sets of DS 4-Containers, and
// DSPopover, DSKbdKey and DSTable.HCell of DS 2-Components, with a few real variables and styles of DS 1-Core).
// `inventory-depth2.expected.json` and `inventory-depth3.expected.json` were written from it by `reduceRawToInventory`
// of spn-support-ts (`apps/utility-ts/tests/helpers/surface-inventory-reducer.ts`, commit 533bc04c), depth 2, and
// depth 3 with every unit asked for. A file is built here from the same raw fixture, layer by layer.
const raw = JSON.parse(readFileSync(resolve(FIXTURES, "raw-fixture.json"), "utf8"));
const NUMBER_FIELDS = ["strokeTopWeight", "strokeBottomWeight", "strokeLeftWeight", "strokeRightWeight", "topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "itemSpacing", "minHeight", "maxHeight"];
const rawPaints = (paints) => paints.map((paint) => ({ type: paint.type, boundVariables: paint.variable ? { color: alias(paint.variable) } : {} }));
function fromHex(text) {
  const found = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(text);
  if (!found) return null;
  const channel = (at) => parseInt(found[1].slice(at, at + 2), 16) / 255;
  return { r: channel(0), g: channel(2), b: channel(4), a: parseInt(found[2], 16) / 255 };
}
function layersOf(version, prefix) {
  const made = new Map();
  const roots = [];
  version.layers.forEach((entry, at) => {
    const names = entry.path.split("/");
    const fields = { width: entry.w, height: entry.h };
    if (entry.layout !== undefined) fields.layoutMode = entry.layout;
    if (entry.sizing) {
      if (entry.sizing.horizontal !== null) fields.layoutSizingHorizontal = entry.sizing.horizontal;
      if (entry.sizing.vertical !== null) fields.layoutSizingVertical = entry.sizing.vertical;
    }
    for (const field of NUMBER_FIELDS) if (field in entry) fields[field] = entry[field];
    if (Array.isArray(entry.fills)) fields.fills = rawPaints(entry.fills);
    if (Array.isArray(entry.strokes)) fields.strokes = rawPaints(entry.strokes);
    if (entry.text) { fields.fontSize = entry.text.fontSize; fields.textCase = entry.text.case; fields.textDecoration = entry.text.decoration; }
    if (entry.bound) fields.bound = entry.bound;
    const node = layer(`${prefix}:${at}`, names[names.length - 1], entry.type, fields);
    made.set(entry.path, node);
    const parent = made.get(names.slice(0, -1).join("/"));
    (parent ? parent.children : roots).push(node);
    if (parent) node.parent = parent;
  });
  return roots;
}
function versionFromRaw(entry, id, at) {
  const frame = entry.frame;
  const fields = {};
  if (Array.isArray(frame.fills)) fields.fills = rawPaints(frame.fills);
  if (Array.isArray(frame.strokes)) fields.strokes = rawPaints(frame.strokes);
  for (const [side, field] of [["top", "strokeTopWeight"], ["bottom", "strokeBottomWeight"], ["left", "strokeLeftWeight"], ["right", "strokeRightWeight"]]) if (typeof frame.strokeWeights[side] === "number") fields[field] = frame.strokeWeights[side];
  for (const [corner, field] of [["topLeft", "topLeftRadius"], ["topRight", "topRightRadius"], ["bottomLeft", "bottomLeftRadius"], ["bottomRight", "bottomRightRadius"]]) if (typeof frame.radii[corner] === "number") fields[field] = frame.radii[corner];
  if (Array.isArray(frame.effects)) fields.effects = frame.effects;
  if (frame.effectStyle) fields.effectStyleId = `S:${frame.effectStyle}`;
  fields.boundVariables = boundOf(frame.bound);
  return versionNode(id, entry.name, { box: [20, 20 + at * 60, entry.w, entry.h], frame: fields, layers: [] });
}
function setFromRaw(set, id) {
  const versions = set.versions.map((entry, at) => {
    const node = versionFromRaw(entry, `${id}:${at}`, at);
    for (const root of layersOf(entry, `${id}:${at}`)) { root.parent = node; node.children.push(root); }
    return node;
  });
  const definitions = Object.fromEntries(Object.entries(set.props).map(([name, prop]) => [name, { type: prop.type, defaultValue: prop.default, variantOptions: prop.values ?? undefined }]));
  const node = setNode(`${id}:set`, set.name, versions, { key: set.key, definitions });
  return node;
}
function fileFromRaw() {
  const pages = raw.pages.map((one, at) => pageNode(`2:${at}`, one.name, one.sets.map((set, index) => setFromRaw(set, `${at}${index}`))));
  const collections = raw.collections.map((collection, at) => ({ id: `C${at}`, name: collection.name, modes: collection.modes.map((name, index) => mode(`m${at}${index}`, name)), defaultModeId: `m${at}${collection.modes.indexOf(collection.defaultMode)}` }));
  const variables = raw.collections.flatMap((collection, at) => collection.variables.map((variable, index) => variableOf(`VariableID:${at}-${index}`, variable.name, `C${at}`, variable.type, Object.fromEntries(collection.modes.map((name, modeAt) => {
    const value = variable.values[name];
    const converted = value && typeof value === "object" && value.alias ? { type: "VARIABLE_ALIAS", id: `V:${value.alias}` } : (typeof value === "string" && fromHex(value)) || value;
    return [`m${at}${modeAt}`, converted];
  })))));
  return figmaFile(raw.file.name, pages, {
    collections, variables,
    textStyles: raw.styles.text.map((style) => ({ name: style.name, fontSize: style.fontSize, lineHeight: style.lineHeight })),
    effectStyles: raw.styles.effect.map((style) => ({ name: style.name, effects: [] })),
  });
}
// The aliases of the stand-in point at `V:<name>`, and `getVariableByIdAsync` answers from the name in the id.
const withoutPageIds = (inventory) => ({ ...inventory, file: { ...inventory.file, readAt: "-" }, pages: inventory.pages.map((page) => ({ ...page, id: "-" })) });
const keysOfUnits = (inventory) => inventory.pages.flatMap((page) => page.units.map((unit) => Object.keys(unit).join()));
for (const depth of [2, 3]) {
  await guard(async () => {
    const expected = JSON.parse(readFileSync(resolve(FIXTURES, `inventory-depth${depth}.expected.json`), "utf8"));
    const answersList = await readAll(fileFromRaw(), depth === 3 ? raw.pages.flatMap((one) => one.sets.map((set) => set.name)) : []);
    const made = assemble(answersList, ["--layer", "CONTAINERS"]).inventory;
    ok(`depth ${depth}: the inventory made from the file equals the helper's, key by key (page ids and the reading time aside)`,
      JSON.stringify(withoutPageIds(made)) === JSON.stringify(withoutPageIds(expected)),
      (() => { const mine = JSON.stringify(withoutPageIds(made)); const theirs = JSON.stringify(withoutPageIds(expected)); let at = 0; while (at < mine.length && mine[at] === theirs[at]) at += 1; return `first difference at ${at}: mine ...${mine.slice(Math.max(0, at - 60), at + 80)} theirs ...${theirs.slice(Math.max(0, at - 60), at + 80)}`; })());
    same(`depth ${depth}: the units' keys come in the helper's order, and the file says depth ${depth}`, [keysOfUnits(made), made.file.depth], [keysOfUnits(expected), depth]);
  });
}

// ---- the texts the agent passes on --------------------------------------------------------------

console.log("\n=== the texts the agent passes on");
for (const script of ["inventory.js", "tokens.js"]) {
  const body = readFileSync(resolve(SCRIPTS, script), "utf8");
  ok(`${script} holds one INPUTS block and no console.log, no spnutils, and writes nothing to the file`,
    (body.match(/const INPUTS = \{/g) ?? []).length === 1 && INPUTS_BLOCK.test(body) && !body.includes("console.log") && !body.toLowerCase().includes("spnutils") &&
    !/\.(createFrame|createComponent|createText|createRectangle|appendChild|remove|setBoundVariable|resize)\(|\bset(PluginData|SharedPluginData)\b|\.(name|x|y|fills|strokes) = /.test(body));
}
{
  const body = readFileSync(resolve(SCRIPTS, "assemble.mjs"), "utf8");
  ok("assemble.mjs reads files and writes one file: no process spawned, no network", !/child_process|\bfetch\(|node:https?|node:net|XMLHttpRequest/.test(body));
}
rmSync(scratch, { recursive: true, force: true });

console.log(failed ? `\n  ${failed} of ${total} FAILED — figma inventory scripts` : `\n  all ${total} passed — figma inventory scripts`);
process.exit(failed ? 1 : 0);
