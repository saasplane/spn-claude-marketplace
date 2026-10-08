// The two scripts the design skill hands to the Figma connector's `use_figma`: `page.js` (the
// inventory and the scan of a page) and `layout.js` (the layout of one set from its label).
//
// Each runs here as the connector runs it: the file's text is the body of an async function whose one
// argument is `figma`, with top-level `await` and `return`. `figma` is a stand-in of only the parts
// the scripts use: pages, sets, versions with names and boxes, texts, `getNodeByIdAsync`,
// `setCurrentPageAsync`, a set's `componentPropertyDefinitions` (which throws from a version) and a
// set's `defaultVariant` (the version at its top left, computed from the boxes each time it is read,
// so a move changes it as it does in Figma).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// FIGMA_SCRIPTS points the suite at another folder of the scripts (the old ones, to see a case fail on them).
const SCRIPTS = process.env.FIGMA_SCRIPTS ?? resolve(import.meta.dirname, "..", "..", "..", "..", "src", "skills", "design", "scripts");
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

// ---- the stand-in -------------------------------------------------------------------------------

const solid = (variableId) => [{ type: "SOLID", boundVariables: variableId ? { color: { id: variableId } } : {} }];

function version(id, name, x, y, width = 100, height = 40, extra = {}) {
  const node = {
    id, name, type: "COMPONENT", x, y, width, height, children: extra.empty ? [] : [{ id: `${id}:0`, type: "RECTANGLE" }],
    fills: solid(null), strokes: [],
  };
  Object.defineProperty(node, "componentPropertyDefinitions", {
    get() { throw new Error("can only get component property definitions of a component set or non-variant component"); },
  });
  return node;
}

function componentSet(id, name, box, versions, { definitions = {}, unreadable = false, fill = "VariableID:fill", stroke = "VariableID:stroke" } = {}) {
  const set = {
    id, name, type: "COMPONENT_SET", x: box[0], y: box[1], width: box[2], height: box[3], children: versions,
    fills: solid(fill), strokes: solid(stroke), resizes: [],
    resize(width, height) { this.width = width; this.height = height; this.resizes.push([width, height]); },
  };
  for (const child of versions) child.parent = set;
  Object.defineProperty(set, "componentPropertyDefinitions", {
    get() { if (unreadable) throw new Error("the definitions cannot be read"); return definitions; },
  });
  Object.defineProperty(set, "defaultVariant", {
    get() {
      return [...this.children].sort((first, second) => first.y - second.y || first.x - second.x)[0];
    },
  });
  return set;
}

const text = (id, name, characters, box) => ({ id, name, type: "TEXT", characters, x: box[0], y: box[1], width: box[2], height: box[3] });
const sheet = (id, name, box, cases) => ({ id, name, type: "FRAME", x: box[0], y: box[1], width: box[2], height: box[3], children: cases });
const sheetCase = (id, name, size = [50, 20]) => ({ id, name, type: "INSTANCE", x: 0, y: 0, width: size[0], height: size[1], children: [{ id: `${id}:0`, type: "TEXT" }] });
const loose = (id, name, box) => ({ id, name, type: "RECTANGLE", x: box[0], y: box[1], width: box[2], height: box[3] });

function file(pages) {
  const everything = new Map();
  const walk = (node) => { everything.set(node.id, node); for (const child of node.children ?? []) { child.parent ??= node; walk(child); } };
  const root = { id: "0:0", type: "DOCUMENT", children: pages };
  for (const pageNode of pages) { pageNode.type = "PAGE"; pageNode.parent = root; walk(pageNode); }
  const figma = {
    mixed: Symbol("mixed"), root, switches: 0,
    async getNodeByIdAsync(id) { return everything.get(id) ?? null; },
    async setCurrentPageAsync() { this.switches += 1; },
  };
  return figma;
}

const page = (id, name, children, backgrounds = [{ type: "SOLID", color: { r: 0.12, g: 0.12, b: 0.12 }, opacity: 1 }]) =>
  ({ id, name, children, backgrounds });

async function run(script, inputs, figma) {
  const body = readFileSync(resolve(SCRIPTS, script), "utf8");
  // an input the case does not give keeps the script's own default, as it does when an agent fills only some
  const defaults = new Function(`return ${INPUTS_BLOCK.exec(body)[0].slice("const INPUTS = ".length, -1)}`)();
  const filled = body.replace(INPUTS_BLOCK, () => `const INPUTS = ${JSON.stringify({ ...defaults, ...inputs })};`);
  return new AsyncFunction("figma", filled)(figma);
}

// A 2 x 2 grid of versions, laid out as `size` on the rows and `state` on the columns.
const grid = (prefix, order) => order.map(([size, state, x, y]) =>
  version(`${prefix}:${size}${state}`, `size=${size}, state=${state}`, x, y));
// A label's layer is named `label · ` and its text, as the book states.
const labelText = (id, characters, box, name = `label · ${characters}`) => text(id, name, characters, box);
const buttonHeader = (text_ = "DSButton — rows: size=SM, MD · columns: state=rest, hover") =>
  labelText("1:label", text_, [0, -30, 300, 20]);
const buttonSet = (order, box = [0, 0, 300, 200], options) =>
  componentSet("1:set", "DSButton", box, grid("1", order), options);
const tidy = [["SM", "rest", 20, 20], ["SM", "hover", 140, 20], ["MD", "rest", 20, 80], ["MD", "hover", 140, 80]];
const defaultsOfButton = { size: "SM", state: "rest" };
const layoutInputs = (more = {}) => ({ setId: "1:set", dryRun: true, defaults: defaultsOfButton, padding: 20, gap: 20, resize: true, mayMove: [], clearance: 100, listMoves: 50, ...more });

// ---- the inventory ------------------------------------------------------------------------------

console.log("=== page.js — the inventory");
{
  const figma = file([page("2:1", "Actions", []), page("2:2", "Fields", [])]);
  const result = await run("page.js", { pageId: null }, figma);
  same("with no page id it lists the pages and switches none", [result.pages, figma.switches], [[{ id: "2:1", name: "Actions" }, { id: "2:2", name: "Fields" }], 0]);
}
{
  const set = buttonSet(tidy, [0, 0, 300, 200], { definitions: { size: { type: "VARIANT", defaultValue: "SM", variantOptions: ["SM", "MD"] } } });
  const figma = file([page("2:1", "Actions", [set, buttonHeader()])]);
  const result = await run("page.js", { pageId: "2:1", report: "inventory", from: 0, to: null, maxBytes: 16000, findingItems: 25 }, figma);
  const read = result.inventory.sets[0];
  same("a page switch happens once", figma.switches, 1);
  same("the page holds its id, name and background", result.page, { id: "2:1", name: "Actions", background: [{ type: "SOLID", color: "#1f1f1f", opacity: 1 }] });
  same("a set holds its box, version count, default version and top-left version",
    [read.box, read.versionCount, read.defaultVersion, read.topLeftVersion], [[0, 0, 300, 200], 4, "size=SM, state=rest", "size=SM, state=rest"]);
  same("a set holds its properties with their values", read.props, { size: { type: "VARIANT", default: "SM", options: ["SM", "MD"] } });
  same("a set holds its ground, the variables bound to fill and stroke",
    read.ground, { fills: [{ type: "SOLID", variableId: "VariableID:fill" }], strokes: [{ type: "SOLID", variableId: "VariableID:stroke" }] });
}
{
  const reading = (order) => file([page("2:1", "Actions", [buttonSet(order)])]);
  const moved = [["MD", "rest", 20, 20], ["MD", "hover", 140, 20], ["SM", "rest", 20, 80], ["SM", "hover", 140, 80]];
  const result = await run("page.js", { pageId: "2:1", report: "inventory", from: 0, to: null, maxBytes: 16000 }, reading(moved));
  same("the default version is read from the set, and is the top-left version", [result.inventory.sets[0].defaultVersion, result.inventory.sets[0].topLeftVersion], ["size=MD, state=rest", "size=MD, state=rest"]);
}
{
  const broken = componentSet("3:set", "DSBroken", [400, 0, 100, 100], [version("3:1", "a=1", 0, 0)], { unreadable: true });
  const figma = file([page("2:1", "Actions", [buttonSet(tidy), broken])]);
  const result = await run("page.js", { pageId: "2:1", report: "inventory", from: 0, to: null, maxBytes: 16000 }, figma);
  same("a set whose definitions throw is reported with its error, and the others are read",
    [result.inventory.sets.length, result.inventory.sets[1].readError], [2, "the definitions cannot be read"]);
}
{
  const set = buttonSet(tidy);
  const rowLabel = labelText("1:row", "SM (default)", [-80, 10, 60, 20]);
  const stranger = labelText("9:lab", "DSGhost — one row", [900, 0, 100, 20]);
  const figma = file([page("2:1", "Actions", [set, buttonHeader(), rowLabel, stranger])]);
  const result = await run("page.js", { pageId: "2:1", report: "inventory", from: 0, to: null, maxBytes: 16000 }, figma);
  const [header, row, ghost] = result.inventory.labels;
  same("a label holds its id, full text, box and the unit it names", [header.id, header.text, header.box, header.unit], ["1:label", "DSButton — rows: size=SM, MD · columns: state=rest, hover", [0, -30, 300, 20], "DSButton"]);
  same("a row label names the unit by the row it sits beside", [row.unit, row.unitVia], ["DSButton", "row"]);
  same("a label naming a unit that is not on the page still holds its text", [ghost.unit, ghost.text], ["DSGhost", "DSGhost — one row"]);
}
{
  const cases = sheet("4:sheet", "DSButton cases", [0, 400, 300, 100], [sheetCase("4:1", "case=text"), sheetCase("4:2", "case=block")]);
  const stray = loose("5:1", "Rectangle 1", [700, 700, 10, 10]);
  const figma = file([page("2:1", "Actions", [cases, stray])]);
  const result = await run("page.js", { pageId: "2:1", report: "inventory", from: 0, to: null, maxBytes: 16000 }, figma);
  same("a sheet holds its id, box and its cases' names and kinds", [result.inventory.sheets[0].id, result.inventory.sheets[0].box, result.inventory.sheets[0].cases],
    ["4:sheet", [0, 400, 300, 100], [{ name: "case=text", kind: "INSTANCE" }, { name: "case=block", kind: "INSTANCE" }]]);
  same("every other top-level node holds its id, kind, layer name, place in the page's order and box", result.inventory.others, [{ kind: "other", id: "5:1", index: 1, name: "Rectangle 1", box: [700, 700, 10, 10], nodeType: "RECTANGLE" }]);
}
{
  const nodes = Array.from({ length: 10 }, (_, index) => loose(`6:${index}`, `Node ${index}`, [index * 50, 900, 10, 10]));
  const figma = file([page("2:1", "Big", nodes)]);
  const range = await run("page.js", { pageId: "2:1", report: "inventory", from: 2, to: 5, maxBytes: 16000 }, figma);
  same("a range of top-level nodes returns those nodes only", [range.inventory.others.map((node) => node.id), range.inventory.next], [["6:2", "6:3", "6:4"], null]);
  const cut = await run("page.js", { pageId: "2:1", report: "inventory", from: 0, to: null, maxBytes: 250 }, figma);
  ok("an answer over the byte limit stops and says where to continue", cut.inventory.next !== null && cut.inventory.others.length === cut.inventory.next && cut.inventory.others.length < 10, JSON.stringify(cut.inventory.next));
  const rest = await run("page.js", { pageId: "2:1", report: "inventory", from: cut.inventory.next, to: null, maxBytes: 16000 }, figma);
  same("continuing from `next` returns the rest", cut.inventory.others.length + rest.inventory.others.length, 10);
}

// ---- the scan -----------------------------------------------------------------------------------

console.log("\n=== page.js — the scan");
const scanOf = async (nodes) => (await run("page.js", { pageId: "2:1", report: "scan", findingItems: 25 }, file([page("2:1", "Actions", nodes)]))).scan;
{
  const result = await scanOf([buttonSet(tidy), buttonHeader()]);
  same("a tidy page is clean", result.clean, true);
}
{
  const stacked = componentSet("1:set", "DSButton", [0, 0, 300, 200], [version("1:a", "size=SM, state=rest", 20, 20), version("1:b", "size=SM, state=hover", 60, 30)]);
  const result = await scanOf([stacked]);
  same("a stacked pair of versions is counted", [result.findings.versionPairsMeeting.count, result.findings.versionPairsMeeting.items[0].pair], [1, ["1:a", "1:b"]]);
}
{
  const outside = componentSet("1:set", "DSButton", [0, 0, 200, 100], [version("1:a", "size=SM, state=rest", 20, 20), version("1:b", "size=SM, state=hover", 180, 20)]);
  const result = await scanOf([outside]);
  same("a version outside its set is counted", [result.findings.versionsOutside.count, result.findings.versionsOutside.items[0].version], [1, "1:b"]);
}
{
  const first = componentSet("1:set", "DSButton", [0, 0, 300, 200], grid("1", tidy));
  const second = componentSet("2:set", "DSInput", [200, 100, 300, 200], [version("2:a", "size=SM", 20, 20)]);
  const result = await scanOf([first, second]);
  same("two top-level nodes that meet are counted", [result.findings.topLevelPairsMeeting.count, result.findings.topLevelPairsMeeting.items[0].pair], [1, ["1:set", "2:set"]]);
}
{
  const result = await scanOf([buttonSet(tidy), loose("7:1", "Rectangle 7", [900, 900, 10, 10])]);
  same("a stray is listed", result.findings.strays.items, [{ id: "7:1", nodeType: "RECTANGLE", name: "Rectangle 7" }]);
}
{
  const named = componentSet("1:set", "DSButton", [0, 0, 300, 200], grid("1", tidy), { definitions: { "Property 1": { type: "VARIANT", defaultValue: "a", variantOptions: ["a"] }, size: { type: "VARIANT", defaultValue: "SM", variantOptions: ["SM"] } } });
  const result = await scanOf([named]);
  same("a property with the editor's default name is listed", result.findings.defaultNamedProperties.items, [{ set: "1:set", property: "Property 1" }]);
}
{
  const broken = componentSet("3:set", "DSBroken", [0, 0, 100, 100], [version("3:1", "a=1", 0, 0)], { unreadable: true });
  const result = await scanOf([broken]);
  same("a set whose properties cannot be read is listed", result.findings.unreadableSets.items, [{ set: "3:set", error: "the definitions cannot be read" }]);
}
{
  const zero = componentSet("1:set", "DSButton", [0, 0, 300, 200], [version("1:a", "size=SM, state=rest", 20, 20, 0, 40), version("1:b", "size=SM, state=hover", 140, 20, 100, 40, { empty: true })]);
  const cases = sheet("4:sheet", "DSButton cases", [0, 400, 300, 100], [sheetCase("4:1", "case=text", [0, 20])]);
  const result = await scanOf([zero, cases]);
  same("a version of zero size or with no layer is listed", result.findings.emptyVersions.items.map((item) => item.version), ["1:a", "1:b"]);
  same("a case of zero size is listed", result.findings.emptyCases.items.map((item) => item.case), ["4:1"]);
}
{
  const cases = sheet("4:sheet", "DSButton cases", [0, 400, 300, 100], [sheetCase("4:1", "text"), sheetCase("4:2", "case=block"), sheetCase("4:3", "case=block")]);
  const result = await scanOf([cases]);
  same("a case not named property=value is listed", result.findings.badCaseNames.items.map((item) => item.name), ["text"]);
  same("two cases of one name are listed", result.findings.duplicateCaseNames.items.map((item) => item.case), ["4:3"]);
}
{
  const result = await scanOf([buttonSet(tidy), labelText("9:lab", "DSGhost — one row", [900, 0, 100, 20])]);
  same("a label whose unit is not on the page is named", result.findings.labelsUnitElsewhere.items.map((item) => [item.label, item.unit]), [["9:lab", "DSGhost"]]);
}
{
  const wrongDefault = [["MD", "rest", 20, 20], ["MD", "hover", 140, 20], ["SM", "rest", 20, 80], ["SM", "hover", 140, 80]];
  const rowLabel = labelText("1:row", "SM (default)", [-80, 90, 60, 20]);
  const result = await scanOf([buttonSet(wrongDefault), buttonHeader(), rowLabel]);
  same("a set whose default version is not the one its label names is named",
    result.findings.defaultNotLabels.items, [{ set: "1:set", labelNames: ["SM"], defaultVersion: "size=MD, state=rest" }]);
  const agreeing = await scanOf([buttonSet(tidy), buttonHeader(), rowLabel]);
  same("a set whose default version is the one its label names is not named", agreeing.findings.defaultNotLabels.count, 0);
}

// ---- the layout ---------------------------------------------------------------------------------

console.log("\n=== layout.js — the layout of one set");
// A set laid out in the wrong order: the columns are swapped, so the top left carries state=hover.
const swapped = [["SM", "hover", 20, 20], ["SM", "rest", 140, 20], ["MD", "hover", 20, 80], ["MD", "rest", 140, 80]];
const positions = (set) => set.children.map((child) => [child.id, child.x, child.y]);
{
  const set = buttonSet(swapped);
  const before = positions(set);
  const figma = file([page("2:1", "Actions", [set, buttonHeader()])]);
  const result = await run("layout.js", layoutInputs(), figma);
  same("dry mode moves nothing", [positions(set), set.resizes.length, [set.width, set.height]], [before, 0, [300, 200]]);
  same("dry mode returns the plan and the default before and after", [result.mode, result.defaultBefore, result.defaultAfter, result.counts.versionsToMove], ["dry", "size=SM, state=hover", "size=SM, state=rest", 2 + 2]);
  same("the layout switches the page once", figma.switches, 1);
  same("the label is read and returned as understood", result.understood, { rows: [{ property: "size", values: ["SM", "MD"] }], columns: [{ property: "state", values: ["rest", "hover"] }] });
}
{
  const set = buttonSet(swapped);
  const figma = file([page("2:1", "Actions", [set, buttonHeader()])]);
  const result = await run("layout.js", layoutInputs({ dryRun: false }), figma);
  same("applied: every version is placed as the label says", positions(set).sort(), [["1:SMhover", 140, 20], ["1:SMrest", 20, 20], ["1:MDhover", 140, 80], ["1:MDrest", 20, 80]].sort());
  same("applied: the default version after is the one at the top left", [result.mode, result.defaultBefore, result.defaultAfter], ["applied", "size=SM, state=hover", "size=SM, state=rest"]);
  same("applied: the set's box before and after, and the proof", [result.setBoxBefore, result.setBoxAfter, result.verified], [[0, 0, 300, 200], [0, 0, 260, 140], { versionsOutside: 0, versionPairsMeeting: 0, topLevelPairsMeeting: 0 }]);
}
{
  const set = buttonSet(tidy, [0, 0, 100, 100]);
  const before = positions(set);
  const result = await run("layout.js", layoutInputs({ dryRun: false, resize: false }), file([page("2:1", "Actions", [set, buttonHeader()])]));
  same("it refuses when a version would leave the set, and moves nothing", [result.mode, result.checks.versionsOutside > 0, positions(set)], ["refused", true, before]);
}
{
  const set = buttonSet(swapped);
  const before = positions(set);
  const result = await run("layout.js", layoutInputs({ dryRun: false, defaults: { size: "SM", state: "hover" } }), file([page("2:1", "Actions", [set, buttonHeader()])]));
  same("it refuses when the top-left version would not carry the given default, and moves nothing",
    [result.mode, result.checks.topLeftCarriesDefaults, positions(set), result.refused[0].includes("does not carry the given defaults")], ["refused", false, before, true]);
}
{
  const set = buttonSet(swapped);
  const before = positions(set);
  const result = await run("layout.js", layoutInputs({ dryRun: false, gap: -10 }), file([page("2:1", "Actions", [set, buttonHeader()])]));
  same("it refuses when two versions would meet, and moves nothing", [result.mode, result.checks.versionPairsMeeting > 0, positions(set)], ["refused", true, before]);
}
{
  const set = buttonSet(swapped, [0, 0, 100, 100]);
  const neighbour = componentSet("2:set", "DSInput", [200, 0, 100, 100], [version("2:a", "size=SM", 10, 10)]);
  const figma = () => file([page("2:1", "Actions", [set, neighbour, buttonHeader()])]);
  const before = positions(set);
  const refused = await run("layout.js", layoutInputs({ dryRun: false }), figma());
  same("it refuses when two top-level nodes would meet, and moves nothing", [refused.mode, refused.checks.topLevelPairsMeeting > 0, positions(set), [neighbour.x, neighbour.y]], ["refused", true, before, [200, 0]]);
  const allowed = await run("layout.js", layoutInputs({ dryRun: false, mayMove: ["2:set"] }), figma());
  same("a node it may move is moved clear, and nothing else is", [allowed.mode, allowed.nodeMoves, allowed.verified.topLevelPairsMeeting], ["applied", [["2:set", 260 + 100, 0]], 0]);
}
{
  const set = buttonSet(swapped);
  const before = positions(set);
  for (const [reason, header] of [
    ["no label names the set", labelText("1:label", "DSOther — one row", [0, -30, 300, 20])],
    ["a label that states neither rows nor columns", buttonHeader("DSButton — all the versions")],
    ["a factor it cannot read", buttonHeader("DSButton — rows: size · columns: state=rest, hover")],
    ["a property the label does not name", buttonHeader("DSButton — rows: size=SM, MD · columns: other=rest, hover")],
  ]) {
    const result = await run("layout.js", layoutInputs({ dryRun: false }), file([page("2:1", "Actions", [set, header])]));
    same(`a label it cannot understand lays out nothing: ${reason}`, [result.mode, positions(set)], ["refused", before]);
  }
}
{
  const twice = componentSet("1:set", "DSButton", [0, 0, 300, 200], [...grid("1", swapped), version("1:dup", "size=SM, state=rest", 300, 300)]);
  const result = await run("layout.js", layoutInputs(), file([page("2:1", "Actions", [twice, buttonHeader()])]));
  same("two versions for one place of the grid are refused", [result.mode, result.refused[0].includes("take the same place")], ["refused", true]);
}
{
  const result = await run("layout.js", layoutInputs({ defaults: { size: "SM" } }), file([page("2:1", "Actions", [buttonSet(swapped), buttonHeader()])]));
  same("a default missing for a property is refused", [result.mode, result.refused], ["refused", ["no default is given for state"]]);
}

// A case that throws is a failed case, not the end of the suite (it throws on the scripts before the fix).
async function guard(body) {
  try { await body(); } catch (error) { ok(`a case crashed: ${String(error?.message ?? error)}`, false, String(error?.stack ?? "").split("\n")[1] ?? ""); }
}

// ---- the label form, and the faults of the first real reading ---------------------------------------
//
// Every text below that holds a label's words is a real one of DS 2-Components, copied as it was read
// (`notes/N020/inventory-ds-2-components-labels.md` and `inventory-ds-2-components.md`, 2026-10-07). A text the
// case had to make up is named as made up.

console.log("\n=== the book's label form, read from real labels");
const REAL = {
  list: "DSList — rows: bulleted=false (default), bulleted=true · columns: flush=false (default), flush=true · its slot holds three DSList.Item at MD, with divided off",
  progress: "DSProgress — rows: size=SM (default), XS, MD, LG, XL · columns: showValue=false, showValue=true, indeterminate=true · withLabel is off",
  anchor: "DSAnchorContainer — one row · columns: case=address, handler, element",
  hueIcon: ".DSHueIcon — a private part · columns: icon=INFO (default), CIRCLE_CHECK, TRIANGLE_ALERT, CIRCLE_ALERT",
  alertDialog: "DSAlertDialog — one component, no set",
  kbd: "DSKbd — one component, the host. Its slot keys holds DSKbdKey",
  skeleton: "DSSkeleton — row 1: LINE (default), TEXT, LIST · row 2: CARD, FORM, TABLE",
  dialog: "DSDialog — columns: size SM (default), XS, MD, LG, XL · rows: fullScreen false, true",
  sheet: "DSSheet — columns: size SM (default), XS, MD, LG, XL · rows: placement RIGHT (default), LEFT, TOP, BOTTOM",
  drawer: "DSDrawer — columns: size SM (default), XS, MD, LG, XL · rows: placement BOTTOM (default), TOP, LEFT, RIGHT",
  alert: "DSAlert — rows: size SM (default), XS, MD, LG, XL",
  toast: "DSToast — rows: rest (default), focus",
  tableCases: "DSTable cases — horizontalScroll=true · wrap=true, wrap=false · pinned=Header, Columns on the left, One column by its cell, Both sides. The four pinned cases are a still picture of one scroll place; their rows are DSTable.Row instances in a drawn column, because the DSTable instance has three fixed body rows.",
  badge: "DSBadge — rows: SOLID, SOFT, OUTLINE, GHOST, LINK, each with MD (default at the top), XS, SM, LG, XL · columns: rest, hover, disabled · every switch is off",
  badgeNow: "DSBadge — rows: SOLID, SOFT, OUTLINE, GHOST, LINK, each with SM (default at the top), XS, MD, LG, XL · columns: rest, hover, disabled · every switch is off",
  tone: "none — follows the hue",
  inverse: "INVERSE — white",
  sampleDialog: "sample · DSDialog over DSBackdrop. It is no component",
};
// A set of two or four versions named by `names`, laid out one under another, the first at the top left.
const setNamed = (id, name, box, names) => componentSet(id, name, box, names.map((versionName, at) => version(`${id}:${at}`, versionName, 20, 20 + at * 60)));
const inventoryOf = async (nodes, inputs = {}) => (await run("page.js", { pageId: "2:1", report: "inventory", ...inputs }, file([page("2:1", "Page", nodes)]))).inventory;
const labelFor = async (characters, extra = []) => (await inventoryOf([...extra, text("L:1", characters, characters, [0, -40, 300, 20])])).labels[0];
await guard(async () => {
  const lists = await labelFor(REAL.list);
  same("DSList's label reads as a grid", [lists.unit, lists.part, lists.form], ["DSList", "header", "grid"]);
  const layoutOfList = async (header) => {
    const list = setNamed("1:set", "DSList", [0, 0, 400, 400], ["bulleted=false, flush=false", "bulleted=true, flush=false", "bulleted=false, flush=true", "bulleted=true, flush=true"]);
    return run("layout.js", layoutInputs({ defaults: { bulleted: "false", flush: "false" } }), file([page("2:1", "Page", [list, labelText("1:label", header, [0, -30, 300, 20])])]));
  };
  const laid = await layoutOfList(REAL.list);
  same("layout.js lays DSList out from its real label, the default marks stripped",
    [laid.mode, laid.understood], ["dry", { rows: [{ property: "bulleted", values: ["false", "true"] }], columns: [{ property: "flush", values: ["false", "true"] }] }]);
});
await guard(async () => {
  const progress = await labelFor(REAL.progress);
  same("DSProgress's label reads as a grid whose second axis names two properties", [progress.form], ["grid"]);
  const set = setNamed("1:set", "DSProgress", [0, 0, 400, 400], ["size=SM, showValue=false, indeterminate=false"]);
  const result = await run("layout.js", layoutInputs({ defaults: { size: "SM", showValue: "false", indeterminate: "false" } }), file([page("2:1", "Page", [set, labelText("1:label", REAL.progress, [0, -30, 300, 20])])]));
  same("layout.js reports an axis with cells of two properties and lays out nothing", [result.mode, result.refused[0].includes("showValue and indeterminate")], ["refused", true]);
});
await guard(async () => {
  const anchor = setNamed("1:set", "DSAnchorContainer", [0, 0, 600, 100], ["case=address", "case=handler", "case=element"]);
  const result = await run("layout.js", layoutInputs({ defaults: { case: "address" } }), file([page("2:1", "Page", [anchor, labelText("1:label", REAL.anchor, [0, -30, 300, 20])])]));
  same("one row and a column axis of bare values: the grid is one row of three", [result.mode, result.understood.rows, result.understood.columns[0].values], ["dry", [], ["address", "handler", "element"]]);
  const hue = setNamed("2:set", ".DSHueIcon", [0, 0, 600, 100], ["icon=INFO", "icon=CIRCLE_CHECK", "icon=TRIANGLE_ALERT", "icon=CIRCLE_ALERT"]);
  const hueResult = await run("layout.js", layoutInputs({ setId: "2:set", defaults: { icon: "INFO" } }), file([page("2:1", "Page", [hue, labelText("2:label", REAL.hueIcon, [0, -30, 300, 20])])]));
  same("a note before the layout is read, and an axis left out is one row", [hueResult.mode, hueResult.understood.rows, hueResult.understood.columns[0].values], ["dry", [], ["INFO", "CIRCLE_CHECK", "TRIANGLE_ALERT", "CIRCLE_ALERT"]]);
});
await guard(async () => {
  const forms = [];
  for (const real of [REAL.alertDialog, REAL.kbd, REAL.skeleton, REAL.dialog, REAL.alert, REAL.toast, REAL.tableCases]) {
    const one = await labelFor(real);
    forms.push([one.unit, one.form, one.reason ?? null]);
  }
  same("the form says what it can, and a label it cannot say is named with its reason",
    forms, [
      ["DSAlertDialog", "one component", null],
      ["DSKbd", "one component", null],
      ["DSSkeleton", "cannot say", "the label states no layout (rows, columns, one row, one column or one component)"],
      ["DSDialog", "cannot say", "the columns clause: the cell \"size SM (default)\" names no property, and no cell stands before it"],
      ["DSAlert", "cannot say", "the rows clause: the cell \"size SM (default)\" names no property, and no cell stands before it"],
      ["DSToast", "cannot say", "the rows clause: the cell \"rest (default)\" names no property, and no cell stands before it"],
      ["DSTable", "sheet", null],
    ]);
  const dialog = setNamed("1:set", "DSDialog", [0, 0, 400, 200], ["size=SM, fullScreen=false", "size=SM, fullScreen=true"]);
  const result = await run("layout.js", layoutInputs({ defaults: { size: "SM", fullScreen: "false" } }), file([page("2:1", "Page", [dialog, labelText("1:label", REAL.dialog, [0, -30, 300, 20])])]));
  same("a label that cannot be said lays out nothing, and the refusal says so", [result.mode, result.refused[0].startsWith("the label cannot be laid out: the columns clause")], ["refused", true]);
  const one = setNamed("2:set", "DSAlertDialog", [0, 0, 100, 100], ["a=1"]);
  const refused = await run("layout.js", layoutInputs({ setId: "2:set", defaults: { a: "1" } }), file([page("2:1", "Page", [one, labelText("1:label", REAL.alertDialog, [0, -30, 300, 20])])]));
  same("a set whose label says one component is refused", [refused.mode, refused.refused[0].includes("one component")], ["refused", true]);
});
await guard(async () => {
  const bare = text("1:label", "DSButton — rows: size=SM, MD · columns: state=rest, hover", "DSButton — rows: size=SM, MD · columns: state=rest, hover", [0, -30, 300, 20]);
  const set = buttonSet(swapped);
  const result = await run("layout.js", layoutInputs(), file([page("2:1", "Actions", [set, bare])]));
  same("a header whose layer has no `label · ` prefix is still the set's header for the layout", [result.mode, result.label.id], ["dry", "1:label"]);
});

console.log("\n=== the nine faults of the first real reading");
// 1. a header with no prefix, a sample and a page's own reference frame are not strays
await guard(async () => {
  const badge = setNamed("1:set", "DSBadge", [200, 8032, 409, 400], ["variant=SOLID, size=SM, disabled=false, state=rest", "variant=SOLID, size=XS, disabled=false, state=rest"]);
  const header = text("1:head", REAL.badgeNow, REAL.badgeNow, [200, 8000, 971, 20]);
  const sample = { id: "1:smp", name: "sample · nothing set", type: "INSTANCE", x: 680, y: 188, width: 320, height: 53, children: [{ id: "1:smp:0", type: "TEXT" }] };
  const caption = text("1:cap", "sample · DSDialog over DSBackdrop. It is no component", "sample · DSDialog over DSBackdrop. It is no component", [680, 160, 200, 20]);
  const found = (await scanOf([badge, header, sample, caption])).findings;
  same("a header with no prefix, a sample instance and a sample caption are no stray", found.strays.items, []);
  same("the header with no prefix is named as a label with a wrong layer name", found.labelLayerNames.items.map((item) => [item.label, item.why]), [["1:head", "the layer name has no `label · ` prefix"]]);
  const reference = (id, name) => ({ id, name, type: "FRAME", x: 0, y: id === "6:1" ? 0 : 800, width: 1334, height: 699, children: [{ id: `${id}:0`, type: "TEXT" }] });
  const choices = (await run("page.js", { pageId: "2:1", report: "scan" }, file([page("2:1", "Choices", [reference("6:1", "§ 6.1 A hue as text"), reference("6:2", "C1 Selected, on an entry that is no row of a list")])]))).scan.findings;
  same("a page that holds no unit has its reference frames, and they are no stray", choices.strays.items, []);
  const loose = (await scanOf([badge, { id: "7:1", name: "Frame 9", type: "FRAME", x: 900, y: 8032, width: 10, height: 10, children: [] }])).findings;
  same("a frame on a page that holds units is still a stray", loose.strays.items.map((item) => item.id), ["7:1"]);
});
// 2. the default's mark reads the value before ` (default)`
await guard(async () => {
  const names = ["size=SM, fullScreen=false", "size=XS, fullScreen=false"];
  const dialog = setNamed("1:set", "DSDialog", [0, 0, 400, 200], names);
  const found = (await scanOf([dialog, labelText("1:label", REAL.dialog, [0, -30, 300, 20])])).findings;
  same("DSDialog's real label names SM, the value before the mark, and is not named", found.defaultNotLabels.count, 0);
  const wrong = setNamed("2:set", "DSDialog", [0, 0, 400, 200], ["size=MD, fullScreen=false", "size=SM, fullScreen=false"]);
  const named = (await scanOf([wrong, labelText("1:label", REAL.dialog, [0, -30, 300, 20])])).findings;
  same("DSDialog with MD at its top left is named, with the value its label names", named.defaultNotLabels.items, [{ set: "2:set", labelNames: ["size SM"], defaultVersion: "size=MD, fullScreen=false" }]);
});
// 3. a column label and a row label are not counted as `unit elsewhere`
await guard(async () => {
  const set = componentSet("1:set", "DSInput", [300, 160, 600, 200], [version("1:a", "size=SM, state=rest", 20, 20), version("1:b", "size=SM, state=error · filled", 140, 20), version("1:c", "size=SM, state=off · focus", 260, 20)]);
  const column = (id, characters, x) => labelText(id, characters, [x, 128, 100, 20]);
  const nodes = [set, column("1:c1", "rest", 320), column("1:c2", "error · filled", 440), column("1:c3", "off · focus", 560), labelText("1:r1", "SM  (default)", [60, 190, 100, 20])];
  const found = (await scanOf(nodes)).findings;
  same("the real column labels and a row label name no unit elsewhere", found.labelsUnitElsewhere.items, []);
  const inventory = await inventoryOf(nodes);
  same("they are tied to the set by the column's and the row's own span", inventory.labels.map((label) => [label.part, label.unit]), [["column", "DSInput"], ["column", "DSInput"], ["column", "DSInput"], ["row", "DSInput"]]);
});
// 4. a caption with a dash gets no unit
await guard(async () => {
  const inventory = await inventoryOf([
    setNamed("1:set", "DSText", [300, 160, 600, 200], ["tone=DEFAULT"]),
    labelText("L:1", REAL.tone, [292, 128, 100, 20]), labelText("L:2", REAL.inverse, [892, 128, 100, 20]),
    text("S:1", "sample · DSImagePicker open — the picker, open (a caption made up for this case)", "sample · DSImagePicker open — the picker, open (a caption made up for this case)", [900, 900, 100, 20]),
  ]);
  same("`none — follows the hue` and `INVERSE — white` are value labels, tied by their column or to none, and never to the unit `none` or `INVERSE`",
    inventory.labels.map((label) => [label.part, label.unit]), [["column", "DSText"], ["untied", null]]);
  same("a sample's caption with a dash is a sample and names no unit", inventory.samples.map((sample) => [sample.kind, sample.unit]), [["sample", null]]);
});
// 5. a case named with two properties is right
await guard(async () => {
  const cases = sheet("4:sheet", "DSSkeleton cases", [0, 400, 300, 100], [sheetCase("4:1", "type=LIST, count=6"), sheetCase("4:2", "type=CARD, count=8"), sheetCase("4:3", "maxHeight=160, maxWidth=320"), sheetCase("4:4", "type=LIST,count=6"), sheetCase("4:5", "text")]);
  const found = (await scanOf([cases])).findings;
  same("real two-property case names are right, and a name that is not property=value is still named", found.badCaseNames.items.map((item) => item.name), ["type=LIST,count=6", "text"]);
});
// 6. the answer carries each node's layer name and its place in the page's order
await guard(async () => {
  const nodes = [setNamed("1:set", "DSButton", [0, 0, 300, 200], ["size=SM"]), labelText("1:label", "DSButton — one row", [0, -30, 300, 20]), loose("5:1", "Rectangle 1", [900, 900, 10, 10])];
  const inventory = await inventoryOf(nodes);
  same("a label, a set and another node hold their layer name and place in the page's order",
    [inventory.labels[0].name, inventory.labels[0].index, inventory.sets[0].name, inventory.sets[0].index, inventory.others[0].name, inventory.others[0].index],
    ["label · DSButton — one row", 1, "DSButton", 0, "Rectangle 1", 2]);
  const second = await inventoryOf(nodes, { from: 1, to: 3 });
  same("a range by place gives those nodes, with the places they hold", [second.labels[0].index, second.others[0].index, second.range], [1, 2, [1, 3]]);
});
// 7. `both` never overflows the answer's limit, and says what it cut
await guard(async () => {
  const many = Array.from({ length: 80 }, (_, index) => loose(`6:${index}`, `Rectangle ${index}`, [index * 50, 900, 10, 10]));
  const nodes = [buttonSet(tidy), buttonHeader(), ...many];
  const both = await run("page.js", { pageId: "2:1", report: "both", maxBytes: 3500, findingItems: 25 }, file([page("2:1", "Big", nodes)]));
  ok("a `both` answer is no longer than maxBytes", JSON.stringify(both).length <= 3500, String(JSON.stringify(both).length));
  ok("it says what it cut: the scan's items, and where the inventory stopped", both.cut.scanItemsLeftOut.strays > 0 && both.cut.inventoryStoppedAt !== null, JSON.stringify(both.cut));
  const small = await run("page.js", { pageId: "2:1", report: "both", maxBytes: 16000, findingItems: 25 }, file([page("2:1", "Small", [buttonSet(tidy), buttonHeader()])]));
  same("a small page is whole, and cuts nothing", [small.inventory.next, small.cut.scanItemsLeftOut], [null, {}]);
});
// 8. an empty version is reported as empty, and is not a failure of the scan
await guard(async () => {
  const empty = componentSet("1:set", "DSImage", [0, 0, 300, 200], [version("1:a", "state=loading", 20, 20, 100, 40, { empty: true }), version("1:b", "state=rest", 140, 20, 0, 40)]);
  const scan = (await scanOf([empty, labelText("1:label", "DSImage — one row · columns: state=loading, rest", [0, -30, 300, 20])]));
  same("an empty version says why it is empty", scan.findings.emptyVersions.items.map((item) => [item.version, item.why]), [["1:a", "no layer"], ["1:b", "no size"]]);
  same("empty versions do not make the page unclean, and the answer says which findings do not block", [scan.clean, scan.notBlocking], [true, ["emptyVersions", "emptyCases", "unitsWithoutCases", "unitsWithoutSample"]]);
});
// 9. the scan names a set whose default version is not the one its label names (DSBadge), and gives no false hit
await guard(async () => {
  const badge = setNamed("1:set", "DSBadge", [200, 8032, 409, 400], ["variant=SOLID, size=SM, disabled=false, state=rest", "variant=SOLID, size=MD, disabled=false, state=rest"]);
  const header = (characters) => text("1:head", characters, characters, [200, 8000, 971, 20]);
  const named = (await scanOf([badge, header(REAL.badge)])).findings.defaultNotLabels;
  same("DSBadge, whose header says MD (default at the top) and whose default is SM, is named", named.items, [{ set: "1:set", labelNames: ["MD"], defaultVersion: "variant=SOLID, size=SM, disabled=false, state=rest" }]);
  same("the same header as the inventory holds it now names SM, and is not named", (await scanOf([badge, header(REAL.badgeNow)])).findings.defaultNotLabels.count, 0);
  const four = [
    setNamed("2:set", "DSDialog", [0, 0, 300, 120], ["size=SM, fullScreen=false"]), labelText("2:l", REAL.dialog, [0, -30, 300, 20]),
    setNamed("3:set", "DSSheet", [400, 0, 300, 120], ["size=SM, placement=RIGHT"]), labelText("3:l", REAL.sheet, [400, -30, 300, 20]),
    setNamed("4:set", "DSDrawer", [800, 0, 300, 120], ["size=SM, placement=BOTTOM"]), labelText("4:l", REAL.drawer, [800, -30, 300, 20]),
    setNamed("5:set", "DSAlert", [1200, 0, 300, 120], ["size=SM"]), labelText("5:l", REAL.alert, [1200, -30, 300, 20]),
  ];
  const found = (await scanOf(four)).findings;
  same("DSDialog, DSSheet, DSDrawer and DSAlert, the five false hits of the old scan, are not named", found.defaultNotLabels.count, 0);
  same("their labels are named for what they are: not in the book's form", found.labelsFormCannotSay.items.map((item) => item.unit), ["DSDialog", "DSSheet", "DSDrawer", "DSAlert"]);
});

console.log("\n=== a row label and a column label belong to the row or column they sit by");
await guard(async () => {
  const inputs = { pageId: "2:1", report: "inventory", labelReach: 400 };
  // DSInput at 300,160 with rows at y 192-232 and 256-296 (the set's own box 160-330); a second set below it
  const input = componentSet("1:set", "DSInput", [300, 160, 600, 170], [version("1:a", "size=SM", 20, 32), version("1:b", "size=XS", 20, 96)]);
  const second = componentSet("2:set", "DSSelect", [300, 400, 600, 170], [version("2:a", "size=SM", 20, 32), version("2:b", "size=XS", 20, 96)]);
  const rowAt = (id, characters, y, x = 60) => labelText(id, characters, [x, y, 100, 20]);
  const one = async (label) => (await run("page.js", inputs, file([page("2:1", "Fields", [input, second, label])]))).inventory.labels[0];
  same("a row label inside a row of the set is tied to it", (await one(rowAt("L:1", "SM", 202))).unit, "DSInput");
  same("a row label level with the set but between its rows is tied to no row, so to no set", (await one(rowAt("L:2", "SM", 238))).unit, null);
  same("a row label level with a row of the second set is tied to the second set", (await one(rowAt("L:3", "XS", 506))).unit, "DSSelect");
  same("a row label too far from any set (past labelReach) is tied to none", (await one(rowAt("L:4", "SM", 202, -1000))).unit, null);
  same("a row label beside no set's rows is tied to none, whatever height it has", (await one(rowAt("L:5", "SM", 1426))).unit, null);
  const column = await one(labelText("L:6", "rest", [320, 128, 100, 20]));
  same("a column label above a column of the set is tied to the set", [column.part, column.unit], ["column", "DSInput"]);
});

console.log("\n=== a set is named when it holds more than 1,000 versions");
await guard(async () => {
  const names = Array.from({ length: 1001 }, (_, at) => `n=${at}`);
  const big = componentSet("1:set", "DSBig", [0, 0, 300, 200], names.map((name, at) => version(`1:${at}`, name, 20, 20)));
  const found = (await scanOf([big])).findings;
  same("a set of 1,001 versions is named with its count", found.setsOverLimit.items, [{ set: "1:set", name: "DSBig", versions: 1001 }]);
  const fine = (await scanOf([componentSet("1:set", "DSBig", [0, 0, 300, 200], names.slice(0, 1000).map((name, at) => version(`1:${at}`, name, 20 + at * 120, 20)))])).findings;
  same("a set of 1,000 is not", fine.setsOverLimit.count, 0);
});

// ---- a page whose units sit inside sections ------------------------------------------------------
//
// A unit is one section: from the top its header (layer `header · <Unit>`), its set with the row and column
// labels, its cases, its samples and its parts, a part being a section inside its owner's. A page holds sections
// and nothing else at its top level. The coordinates below are those of the section a node stands in.

console.log("\n=== a page of sections: the same scripts read it");
const section = (id, name, box, children) => ({ id, name, type: "SECTION", x: box[0], y: box[1], width: box[2], height: box[3], children });
const headerText = (id, unit, characters, box) => text(id, `header · ${unit}`, characters, box);
const sample = (id, name, box) => ({ id, name, type: "INSTANCE", x: box[0], y: box[1], width: box[2], height: box[3], children: [{ id: `${id}:0`, type: "TEXT" }] });
const iconPart = (id, box = [80, 860, 400, 220]) => section(`${id}:sec`, ".DSIcon", box, [
  headerText(`${id}:head`, ".DSIcon", ".DSIcon — one component", [80, 80, 300, 20]),
  version(`${id}:icon`, ".DSIcon", 80, 128, 48, 48),
]);
// One unit's section: header, set with its labels, cases, samples, and the parts it is given.
function unitSection(sid, name, origin, { header = true, parts = [], sampleAbove = false, sheetLabel = false, caption = false } = {}) {
  const set = componentSet(`${sid}:set`, name, [200, 148, 300, 200], grid(sid, tidy));
  const cases = sheet(`${sid}:sheet`, `${name} cases`, [80, sampleAbove ? 668 : 444, 300, 100], [sheetCase(`${sid}:c1`, "case=text")]);
  const shown = sample(`${sid}:smp`, `sample · ${name} open`, [80, sampleAbove ? 444 : 668, 200, 60]);
  return section(`${sid}:sec`, name, [origin[0], origin[1], 800, 1300], [
    ...(header ? [headerText(`${sid}:head`, name, `${name} — rows: size=SM, MD · columns: state=rest, hover`, [80, 80, 600, 20])] : []),
    set,
    labelText(`${sid}:row`, "SM (default)", [116, 168, 60, 20]),
    labelText(`${sid}:col`, "rest", [220, 112, 60, 20]),
    labelText(`${sid}:lc`, "Cases", [80, sampleAbove ? 624 : 400, 100, 20]),
    ...(sheetLabel ? [text(`${sid}:sl`, `label · ${name} cases — horizontalScroll=true · wrap=true, wrap=false`, `${name} cases — horizontalScroll=true · wrap=true, wrap=false`, [80, 420, 300, 20])] : []),
    cases,
    labelText(`${sid}:ls`, "Samples", [80, sampleAbove ? 400 : 624, 100, 20]),
    shown,
    ...(caption ? [text(`${sid}:cap`, `sample · ${name} open`, `sample · ${name} open`, [300, 668, 200, 20])] : []),
    ...(parts.length > 0 ? [labelText(`${sid}:lp`, "Parts", [80, 820, 100, 20]), ...parts] : []),
  ]);
}
const sectioned = (nodes) => file([page("2:1", "Actions", nodes)]);
const scanSections = async (nodes, inputs = {}) => (await run("page.js", { pageId: "2:1", report: "scan", findingItems: 25, ...inputs }, sectioned(nodes))).scan;
const inventorySections = async (nodes) => (await run("page.js", { pageId: "2:1", report: "inventory", maxBytes: 16000 }, sectioned(nodes))).inventory;
const counts = (scan) => Object.fromEntries(Object.entries(scan.findings).filter(([, one]) => one.count > 0).map(([name, one]) => [name, one.count]));

await guard(async () => {
  const old = await scanOf([buttonSet(tidy), buttonHeader()]);
  same("the old form: things at the page's top level are read, and the scan says the page is flat", [old.clean, old.form, old.read.sets, old.read.labels], [true, "flat", 1, 1]);
  const scan = await scanSections([unitSection("B", "DSButton", [100, 100], { parts: [iconPart("P")] })]);
  same("the same unit in a section, a part's section inside it: clean, and the page is said to be in sections",
    [scan.clean, scan.form, counts(scan)], [true, "sections", {}]);
  same("the scan says what it read: one unit, its sheet, its sample, its labels and its two sections",
    [scan.read.sets, scan.read.components, scan.read.sheets, scan.read.samples, scan.read.labels, scan.read.sections, scan.read.topLevel], [1, 1, 1, 1, 7, 2, 1]);
});
await guard(async () => {
  const inventory = await inventorySections([unitSection("B", "DSButton", [100, 100], { parts: [iconPart("P")] })]);
  same("a set in a section holds its box in page coordinates and the section it stands in", [inventory.sets[0].box, inventory.sets[0].parent], [[300, 248, 300, 200], "B:sec"]);
  same("a header is read from its layer `header · ` and tied to its unit, in the part's section too",
    inventory.labels.filter((label) => label.part === "header").map((label) => [label.unit, label.parent, label.name]),
    [["DSButton", "B:sec", "header · DSButton"], [".DSIcon", "P:sec", "header · .DSIcon"]]);
  same("a row label and a column label are tied to the set by its rows' and columns' spans, in one frame of reference",
    inventory.labels.filter((label) => ["row", "column"].includes(label.part)).map((label) => [label.part, label.unit]), [["row", "DSButton"], ["column", "DSButton"]]);
  same("a band's label is no value label and is tied to no unit", inventory.labels.filter((label) => label.part === "band").map((label) => label.text), ["Cases", "Samples", "Parts"]);
  same("the sections are listed, the part's inside its owner's", inventory.sections.map((one) => [one.id, one.parent ?? null]), [["B:sec", null], ["P:sec", "B:sec"]]);
  same("a lone component of a part is found inside its section", [inventory.components[0].id, inventory.components[0].box, inventory.components[0].parent], ["P:icon", [260, 1088, 48, 48], "P:sec"]);
  const range = await run("page.js", { pageId: "2:1", report: "inventory", from: 1, to: 2, maxBytes: 16000 }, sectioned([unitSection("B", "DSButton", [100, 100], { parts: [iconPart("P")] })]));
  same("a range reads the nodes in the order of the walk, the sections' children after their section", [range.inventory.range, Object.values(range.inventory).flat().filter((item) => item?.index !== undefined).map((item) => item.id)], [[1, 2], ["B:head"]]);
});
await guard(async () => {
  const shared = section("SP:sec", "Shared parts", [100, 1640, 800, 400], [headerText("SP:head", ".DSIcon", ".DSIcon — one component", [80, 80, 300, 20]), version("SP:icon", ".DSIcon", 80, 128, 48, 48)]);
  const scan = await scanSections([unitSection("B", "DSButton", [100, 100]), shared]);
  same("a `Shared parts` section at the end of the page is clean, and its unit has its header", [scan.clean, scan.read.sections, scan.findings.unitsWithoutHeader.count], [true, 2, 0]);
});
await guard(async () => {
  const away = unitSection("B", "DSButton", [100, 100]);
  away.children.find((child) => child.id === "B:row").y = 1000;
  const inventory = await inventorySections([away]);
  same("a row label away from its row is tied to no set", inventory.labels.filter((label) => label.id === "B:row").map((label) => [label.part, label.unit]), [["untied", null]]);
  const tied = await inventorySections([unitSection("B", "DSButton", [100, 100])]);
  same("the same label at its row's height is tied: a section's offset does not break the tie", tied.labels.filter((label) => label.id === "B:row").map((label) => [label.part, label.unit]), [["row", "DSButton"]]);
});
await guard(async () => {
  const strayRect = loose("X:1", "Rectangle 1", [2000, 100, 10, 10]);
  const strayLabel = labelText("X:2", "DSButton — one row", [2000, 300, 100, 20]);
  const scan = await scanSections([unitSection("B", "DSButton", [100, 100]), strayRect, strayLabel]);
  same("a node at the top level of a sectioned page that is no section is named, a label too", [scan.clean, scan.findings.topLevelNotSection.items.map((item) => item.id)], [false, ["X:1", "X:2"]]);
});
await guard(async () => {
  const crowded = unitSection("B", "DSButton", [100, 100]);
  crowded.children.find((child) => child.id === "B:sheet").y = 300;
  const scan = await scanSections([crowded]);
  same("two things that meet inside a section are named, with the section", scan.findings.meetingInSection.items, [{ section: "B:sec", pair: ["B:sheet", "B:set"] }]);
  const second = unitSection("C", "DSInput", [100, 1000]);
  const meeting = await scanSections([unitSection("B", "DSButton", [100, 100]), second]);
  same("two sections that meet are named at the page's top level", meeting.findings.topLevelPairsMeeting.items.map((item) => item.pair), [["B:sec", "C:sec"]]);
  same("two sections that meet also fail the scan", meeting.clean, false);
});
await guard(async () => {
  const swappedBands = await scanSections([unitSection("B", "DSButton", [100, 100], { sampleAbove: true })]);
  same("a section whose samples stand above its cases is named, with the band it stands below",
    swappedBands.findings.sectionOutOfOrder.items.map((item) => [item.band, item.standsBelow]), [["cases", "samples"], ["cases", "samples"]]);
  const headerLow = unitSection("B", "DSButton", [100, 100]);
  headerLow.children.find((child) => child.id === "B:head").y = 380;
  same("a header below the set is named", (await scanSections([headerLow])).findings.sectionOutOfOrder.items.map((item) => [item.id, item.band]), [["B:head", "header"]]);
});
await guard(async () => {
  const scan = await scanSections([unitSection("B", "DSButton", [100, 100], { header: false })]);
  same("a unit with no header is named, in its section", [scan.clean, scan.findings.unitsWithoutHeader.items], [false, [{ unit: "DSButton", id: "B:set", in: "B:sec" }]]);
  const withHeaders = await scanSections([unitSection("B", "DSButton", [100, 100], { parts: [iconPart("P")] })]);
  const noPartHeader = unitSection("B", "DSButton", [100, 100], { parts: [iconPart("P")] });
  noPartHeader.children.find((child) => child.id === "P:sec").children.splice(0, 1);
  same("a part with no header is named too", [withHeaders.findings.unitsWithoutHeader.count, (await scanSections([noPartHeader])).findings.unitsWithoutHeader.items.map((item) => item.unit)], [0, [".DSIcon"]]);
});
await guard(async () => {
  const misplaced = unitSection("B", "DSButton", [100, 100]);
  misplaced.children.push(headerText("B:other", "DSInput", "DSInput — one row", [500, 80, 100, 20]), sample("B:alien", "sample · DSInput open", [500, 668, 100, 60]));
  const scan = await scanSections([misplaced, unitSection("C", "DSInput", [100, 1640])]);
  same("a header and a sample of another unit, standing in this unit's section, are named",
    scan.findings.outsideUnitSection.items.map((item) => [item.id, item.kind, item.unit, item.in, item.unitIn]), [["B:other", "label", "DSInput", "B:sec", "C:sec"], ["B:alien", "sample", "DSInput", "B:sec", "C:sec"]]);
});
await guard(async () => {
  const names = async (name) => {
    const unit = unitSection("B", "DSButton", [100, 100]);
    unit.children.find((child) => child.id === "B:head").name = name;
    return (await scanSections([unit])).findings.labelLayerNames.items.map((item) => item.why);
  };
  same("`header · ` and the unit's name is the header's layer name", await names("header · DSButton"), []);
  same("in a page of sections a header named as a label is named", await names("label · DSButton — rows: size=SM, MD · columns: state=rest, hover"), ["the layer name of a header is `header · ` and the unit's name"]);
  same("a header named for another unit is named", await names("header · DSInput"), ["the layer name is not `header · ` and the unit's name"]);
});
await guard(async () => {
  const empty = await run("page.js", { pageId: "2:1", report: "scan" }, sectioned([]));
  same("an empty page is never clean: the empty reading is its own finding", [empty.scan.clean, empty.scan.form, empty.scan.findings.emptyReading.count], [false, "empty", 1]);
  const hollow = await scanSections([section("H:sec", "DSButton", [0, 0, 400, 400], [])]);
  same("a section with no unit in it is an empty reading, not a clean page", [hollow.clean, hollow.findings.emptyReading.count, hollow.form], [false, 1, "sections"]);
  const reference = await run("page.js", { pageId: "2:1", report: "scan" }, file([page("2:1", "Choices", [{ id: "6:1", name: "§ 6.1", type: "FRAME", x: 0, y: 0, width: 100, height: 100, children: [{ id: "6:1:0", type: "TEXT" }] }])]));
  same("a page that holds no unit is not clean either", [reference.scan.clean, reference.scan.findings.emptyReading.count], [false, 1]);
  const both = await run("page.js", { pageId: "2:1", report: "both", maxBytes: 16000 }, sectioned([]));
  same("the answer says the form at its top, whichever report is asked", [both.form, both.scan.form], ["empty", "empty"]);
});

await guard(async () => {
  // The three real sheet labels of Data display (453:2926, 458:3831, 459:3869): layer `label · <Unit> cases — ...`.
  for (const name of ["DSTable", "DSCodeBlockView", "DSJSONView"]) {
    const scan = await scanSections([unitSection("B", name, [100, 100], { sheetLabel: true })]);
    same(`${name}'s sheet label, in the Cases band above its sheet, is no header: clean, no layer name and no order finding`, [scan.clean, counts(scan)], [true, {}]);
    const inventory = await inventorySections([unitSection("B", name, [100, 100], { sheetLabel: true })]);
    same(`${name}'s sheet label has a part of its own, and is read as a sheet's`, inventory.labels.filter((label) => label.id === "B:sl").map((label) => [label.part, label.form, label.unit]), [["sheet", "sheet", name]]);
  }
  const missing = unitSection("B", "DSTable", [100, 100], { header: false, sheetLabel: true });
  same("a sheet's label never hides a unit with no header", (await scanSections([missing])).findings.unitsWithoutHeader.items.map((item) => item.unit), ["DSTable"]);
  const low = unitSection("B", "DSTable", [100, 100], { sheetLabel: true });
  low.children.find((child) => child.id === "B:sl").y = 640;
  same("a sheet's label below the samples' label is out of the cases band", (await scanSections([low])).findings.sectionOutOfOrder.items.map((item) => item.id), ["B:sl"]);
});
await guard(async () => {
  const scan = await scanSections([unitSection("B", "DSButton", [100, 100], { caption: true })]);
  same("a sample's caption is counted apart: one sample and one sample label", [scan.read.samples, scan.read.sampleLabels, scan.clean], [1, 1, true]);
  const unnamed = unitSection("B", "DSButton", [100, 100]);
  unnamed.children.find((child) => child.id === "B:smp").name = "sample · nothing set";
  const found = await scanSections([unnamed]);
  same("a sample that names no unit is a finding of its own, with its id, name and section; the scan is not clean",
    [found.clean, found.findings.samplesNamingNoUnit.items], [false, [{ id: "B:smp", name: "sample · nothing set", in: "B:sec" }]]);
});

// A value that itself holds `: ` (real: DSAnchor on Navigation, DSAnchorContainer 422:128706 on Utility). The header
// names the value by its words before the first `: `, or writes it whole; either marks the version that carries it.
await guard(async () => {
  const anchor = setNamed("1:set", "DSAnchor", [0, 0, 600, 100], ["case=text: a word or two as a link", "case=block: a card as a link"]);
  const marked = async (header, set = anchor) => (await scanOf([set, labelText("1:label", header, [0, -30, 300, 20])])).findings.defaultNotLabels;
  same("DSAnchor: `case=text (default)` is true of `case=text: a word or two as a link`", (await marked("DSAnchor — one row · columns: case=text (default), block")).count, 0);
  const container = setNamed("2:set", "DSAnchorContainer", [0, 0, 600, 100], ["case=address: the row goes to an address", "case=handler: a handler runs"]);
  const containerMarked = async (header) => (await scanOf([container, labelText("2:label", header, [0, -30, 300, 20])])).findings.defaultNotLabels;
  same("DSAnchorContainer: `case=address (default)` is true of `case=address: the row goes to an address`", (await containerMarked("DSAnchorContainer — one row · columns: case=address (default), handler")).count, 0);
  same("the whole value written in the header is true too", (await containerMarked("DSAnchorContainer — one row · columns: case=address: the row goes to an address (default), handler")).count, 0);
  same("a mark on the other value is still named", (await marked("DSAnchor — one row · columns: case=block (default), text")).items.map((item) => item.labelNames), [["block"]]);
});

// A section does not clip: a child can lie outside the section's box and still be its child. The unit's section
// below is at (100, 100) and 800 x 1300, so it spans x 100 to 900 and y 100 to 1400 on the page.
console.log("\n=== page.js — a child outside its section's box");
const outsideOf = async (nodes) => (await scanSections(nodes)).findings.childOutsideSection;
const withChild = (child, parts = []) => { const unit = unitSection("B", "DSButton", [100, 100], { parts }); unit.children.push(child); return unit; };
await guard(async () => {
  const clean = await outsideOf([unitSection("B", "DSButton", [100, 100], { parts: [iconPart("P")] })]);
  same("a unit whose pieces all lie inside its section and its part's section names nothing", clean.count, 0);
  const sides = [
    ["left", loose("X:l", "Rectangle left", [-50, 500, 100, 20]), 50],
    ["top", loose("X:t", "Rectangle top", [500, -40, 100, 20]), 40],
    ["right", loose("X:r", "Rectangle right", [750, 500, 100, 20]), 50],
    ["bottom", loose("X:b", "Rectangle bottom", [500, 1280, 100, 60]), 40],
  ];
  for (const [side, child, px] of sides) {
    const found = await outsideOf([withChild(child)]);
    same(`a child outside on the ${side} is named with its section, the side and the px, and the scan is not clean`,
      [found.items.map((item) => [item.child, item.section, item.side, item.px, item.bounds]), (await scanSections([withChild(child)])).clean],
      [[[child.id, "B:sec", side, px, "box"]], false]);
  }
  same("a child inside the section is not named", (await outsideOf([withChild(loose("X:i", "Rectangle inside", [500, 1000, 100, 20]))])).count, 0);
});
await guard(async () => {
  const at = async (x) => (await outsideOf([withChild(loose("X:e", "Rectangle edge", [x, 500, 100, 20]))])).items.map((item) => [item.side, item.px]);
  same("a child 1 px beyond the box is within the tolerance and is not named", await at(-1), []);
  same("a child 2 px beyond the box is named", await at(-2), [["left", 2]]);
  same("a child touching the edge is not named", await at(0), []);
});
await guard(async () => {
  const wide = sample("X:w", "sample · DSButton open", [500, 1000, 100, 20]);
  wide.absoluteRenderBounds = { x: 600, y: 1100, width: 100, height: 320 };
  const found = await outsideOf([withChild(wide)]);
  same("a child whose box is inside but whose render bounds reach past the section is named, by the render bounds",
    found.items.map((item) => [item.child, item.side, item.px, item.bounds]), [["X:w", "bottom", 20, "render"]]);
  const inside = sample("X:n", "sample · DSButton open", [500, 1000, 100, 20]);
  inside.absoluteRenderBounds = { x: 590, y: 1090, width: 140, height: 60 };
  same("render bounds wider than the box but inside the section name nothing", (await outsideOf([withChild(inside)])).count, 0);
  const own = loose("X:o", "Rectangle own", [500, 1000, 100, 20]);
  own.absoluteBoundingBox = { x: 880, y: 1100, width: 100, height: 20 };
  same("an absoluteBoundingBox, where the node has one, is the box that is read", (await outsideOf([withChild(own)])).items.map((item) => [item.side, item.px]), [["right", 80]]);
});
await guard(async () => {
  const insidePart = iconPart("P");
  insidePart.children.push(loose("P:x", "Rectangle in part", [350, 100, 100, 20]));
  const found = await outsideOf([unitSection("B", "DSButton", [100, 100], { parts: [insidePart] })]);
  same("a child of a part's section is judged against the part's own box, not its owner's", found.items.map((item) => [item.child, item.section, item.side, item.px]), [["P:x", "P:sec", "right", 50]]);
  const far = iconPart("Q", [600, 860, 400, 220]);
  const part = await outsideOf([unitSection("B", "DSButton", [100, 100], { parts: [far] })]);
  same("a part's section that lies outside its owner's box is named as the owner's child", part.items.map((item) => [item.child, item.section, item.side, item.px]), [["Q:sec", "B:sec", "right", 200]]);
});
await guard(async () => {
  const flat = await scanOf([buttonSet(tidy), buttonHeader(), loose("X:f", "Rectangle", [5000, 5000, 10, 10])]);
  same("a flat page has no section to lie outside of", flat.findings.childOutsideSection.count, 0);
});
await guard(async () => {
  const names = (found) => found.items.map((item) => item.child);
  const many = unitSection("B", "DSButton", [100, 100]);
  for (let at = 0; at < 40; at += 1) many.children.push(loose(`M:${at}`, `Rectangle ${at}`, [-100, 20 * at, 10, 10]));
  const shown = (await scanSections([many])).findings.childOutsideSection;
  same("a long finding is counted whole and cut to the findingItems", [shown.count, names(shown).length], [40, 25]);
});

// The sibling check that was there already, `meetingInSection`, compares every direct child of a section with the
// others, whatever its kind, by their boxes. A nested part's section against a sheet and a sample against a sheet
// are two of those pairs; nothing was added for them.
console.log("\n=== page.js — siblings that meet inside a section");
await guard(async () => {
  const part = iconPart("P", [80, 460, 400, 220]);
  const found = (await scanSections([unitSection("B", "DSButton", [100, 100], { parts: [part] })])).findings.meetingInSection.items;
  same("a part's section that meets the sheet of cases is named with the section",
    found.filter((item) => item.pair.includes("B:sheet")).map((item) => [item.section, [...item.pair].sort()]), [["B:sec", ["B:sheet", "P:sec"]]]);
  const crowded = unitSection("B", "DSButton", [100, 100]);
  crowded.children.find((child) => child.id === "B:smp").y = 480;
  same("a sample that meets the sheet of cases is named with the section",
    (await scanSections([crowded])).findings.meetingInSection.items.map((item) => [item.section, [...item.pair].sort()]), [["B:sec", ["B:sheet", "B:smp"]]]);
});

console.log("\n=== page.js — units with no cases and units with no sample");
await guard(async () => {
  const bare = unitSection("B", "DSButton", [100, 100], { parts: [iconPart("P")] });
  bare.children = bare.children.filter((child) => child.id !== "B:sheet" && child.id !== "B:smp");
  const scan = await scanSections([bare]);
  same("a top-level unit with no sheet and no sample is named in each, and a part owes neither",
    [scan.findings.unitsWithoutCases.items, scan.findings.unitsWithoutSample.items],
    [[{ unit: "DSButton", id: "B:set", in: "B:sec" }], [{ unit: "DSButton", id: "B:set", in: "B:sec" }]]);
  same("neither makes the scan unclean, and the answer says they do not block", [scan.clean, scan.notBlocking.includes("unitsWithoutCases"), scan.notBlocking.includes("unitsWithoutSample")], [true, true, true]);
  const full = await scanSections([unitSection("B", "DSButton", [100, 100], { parts: [iconPart("P")] })]);
  same("a unit with a sheet and a sample is named in neither", [full.findings.unitsWithoutCases.count, full.findings.unitsWithoutSample.count], [0, 0]);
});
await guard(async () => {
  const lone = unitSection("B", "DSButton", [100, 100]);
  lone.children = lone.children.filter((child) => child.id !== "B:sheet");
  lone.children.push(version("B:case", "case=text", 80, 444, 50, 20));
  const scan = await scanSections([lone]);
  same("a loose case component counts as the unit's cases", scan.findings.unitsWithoutCases.count, 0);
  const shared = section("SP:sec", "Shared parts", [100, 1640, 800, 400], [headerText("SP:head", "DSBase", "DSBase — one component", [80, 80, 300, 20]), version("SP:base", "DSBase", 80, 128, 48, 48)]);
  const withShared = await scanSections([unitSection("B", "DSButton", [100, 100]), shared]);
  same("a unit in `Shared parts` is a part and owes neither", [withShared.findings.unitsWithoutCases.count, withShared.findings.unitsWithoutSample.count], [0, 0]);
  const other = unitSection("B", "DSButton", [100, 100]);
  other.children.find((child) => child.id === "B:smp").name = "sample · DSInput open";
  same("a sample that names another unit is no sample of this one", (await scanSections([other])).findings.unitsWithoutSample.items.map((item) => item.unit), ["DSButton"]);
});

console.log("\n=== layout.js — a set in a section");
const layoutIn = (nodes, inputs = {}) => run("layout.js", layoutInputs({ setId: "B:set", ...inputs }), sectioned(nodes));
const unitWith = (order) => {
  const unit = unitSection("B", "DSButton", [100, 100]);
  const set = componentSet("B:set", "DSButton", [200, 148, 300, 200], grid("B", order));
  unit.children.splice(unit.children.findIndex((child) => child.id === "B:set"), 1, set);
  return unit;
};
await guard(async () => {
  const unit = unitWith(swapped);
  const result = await layoutIn([unit]);
  same("the header is found in the set's own section, and the home is that section", [result.mode, result.label.id, result.home], ["dry", "B:head", { id: "B:sec", name: "DSButton", type: "SECTION" }]);
  same("its box is in the section's coordinates, and nothing of the section's other pieces is said to meet it", [result.setBoxBefore, result.checks.topLevelPairsMeeting], [[200, 148, 300, 200], 0]);
  const applied = await layoutIn([unitWith(swapped)], { dryRun: false });
  same("applied in a section: every version is placed and the verified counts are zero", [applied.mode, applied.verified], ["applied", { versionsOutside: 0, versionPairsMeeting: 0, topLevelPairsMeeting: 0 }]);
});
await guard(async () => {
  const unit = unitWith(swapped);
  unit.children = unit.children.filter((child) => child.id !== "B:head");
  const strayHeader = labelText("X:1", "DSButton — rows: size=SM, MD · columns: state=rest, hover", [3000, 0, 300, 20]);
  const refused = await layoutIn([unit, strayHeader]);
  same("a header at the page's top level is not the set's: with none in its section it refuses", [refused.mode, refused.refused[0].startsWith("no label in the section DSButton")], ["refused", true]);
});
await guard(async () => {
  const unit = unitWith(swapped);
  unit.children.push(componentSet("B:near", "DSNear", [300, 148, 100, 100], [version("B:near:a", "size=SM", 10, 10)]));
  const set = unit.children.find((child) => child.id === "B:set");
  set.resize(100, 100);
  const refused = await layoutIn([unit], { resize: true });
  same("a neighbour in the same section that the planned set would meet refuses, and moves nothing",
    [refused.mode, refused.checks.topLevelPairsMeeting > 0, refused.refused.some((reason) => reason.includes("in the section"))], ["refused", true, true]);
  const moved = await layoutIn([unit], { dryRun: false, mayMove: ["B:near"] });
  same("a neighbour it may move is moved clear in the section's own coordinates", [moved.mode, moved.nodeMoves.map((move) => move[0]), moved.nodeMoves[0][1] >= 200 + 260 + 100, moved.verified.topLevelPairsMeeting], ["applied", ["B:near"], true, 0]);
});
await guard(async () => {
  const unit = unitWith(swapped);
  const elsewhere = section("E:sec", "DSOther", [100, 1640, 800, 400], [loose("E:1", "Rectangle", [200, 148, 300, 200])]);
  const result = await layoutIn([unit, elsewhere]);
  same("a node of another section at the same relative place is no neighbour: nothing meets", [result.mode, result.checks.topLevelPairsMeeting], ["dry", 0]);
});

// ---- the texts ----------------------------------------------------------------------------------

console.log("\n=== the texts the agent passes on");
for (const script of ["page.js", "layout.js"]) {
  const body = readFileSync(resolve(SCRIPTS, script), "utf8");
  ok(`${script} holds one INPUTS block and no console.log, no spnutils`, (body.match(/const INPUTS = \{/g) ?? []).length === 1 && INPUTS_BLOCK.test(body) && !body.includes("console.log") && !body.toLowerCase().includes("spnutils"));
}
{
  const between = (name) => { const body = readFileSync(resolve(SCRIPTS, name), "utf8"); return body.slice(body.indexOf("// ---- the book's label form: begin"), body.indexOf("// ---- the book's label form: end")); };
  ok("the book's label form is one block, the same in page.js and layout.js", between("page.js").length > 500 && between("page.js") === between("layout.js"));
}
ok("layout.js is dry by default", /const INPUTS = \{[^}]*dryRun: true/.test(readFileSync(resolve(SCRIPTS, "layout.js"), "utf8")));

console.log(failed ? `\n  ${failed} of ${total} FAILED — figma scripts` : `\n  all ${total} passed — figma scripts`);
process.exit(failed ? 1 : 0);
