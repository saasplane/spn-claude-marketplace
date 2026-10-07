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

const SCRIPTS = resolve(import.meta.dirname, "..", "..", "..", "..", "src", "skills", "design", "scripts");
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
  const filled = body.replace(INPUTS_BLOCK, () => `const INPUTS = ${JSON.stringify(inputs)};`);
  return new AsyncFunction("figma", filled)(figma);
}

// A 2 x 2 grid of versions, laid out as `size` on the rows and `state` on the columns.
const grid = (prefix, order) => order.map(([size, state, x, y]) =>
  version(`${prefix}:${size}${state}`, `size=${size}, state=${state}`, x, y));
const buttonHeader = (text_ = "DSButton — rows: size=SM, MD · columns: state=rest, hover") =>
  text("1:label", "label · DSButton", text_, [0, -30, 300, 20]);
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
  const rowLabel = text("1:row", "label · SM (default)", "SM (default)", [-80, 10, 60, 20]);
  const stranger = text("9:lab", "label · DSGhost", "DSGhost — one row", [900, 0, 100, 20]);
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
  same("every other top-level node holds its id, kind, name and box", result.inventory.others, [{ kind: "other", id: "5:1", nodeType: "RECTANGLE", name: "Rectangle 1", box: [700, 700, 10, 10] }]);
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
  const result = await scanOf([buttonSet(tidy), text("9:lab", "label · DSGhost", "DSGhost — one row", [900, 0, 100, 20])]);
  same("a label whose unit is not on the page is named", result.findings.labelsUnitElsewhere.items.map((item) => [item.label, item.unit]), [["9:lab", "DSGhost"]]);
}
{
  const wrongDefault = [["MD", "rest", 20, 20], ["MD", "hover", 140, 20], ["SM", "rest", 20, 80], ["SM", "hover", 140, 80]];
  const rowLabel = text("1:row", "label · SM (default)", "SM (default)", [-80, 90, 60, 20]);
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
    ["no label names the set", text("1:label", "label · DSOther", "DSOther — one row", [0, -30, 300, 20])],
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

// ---- the texts ----------------------------------------------------------------------------------

console.log("\n=== the texts the agent passes on");
for (const script of ["page.js", "layout.js"]) {
  const body = readFileSync(resolve(SCRIPTS, script), "utf8");
  ok(`${script} holds one INPUTS block and no console.log, no spnutils`, (body.match(/const INPUTS = \{/g) ?? []).length === 1 && INPUTS_BLOCK.test(body) && !body.includes("console.log") && !body.toLowerCase().includes("spnutils"));
}
ok("layout.js is dry by default", /const INPUTS = \{[^}]*dryRun: true/.test(readFileSync(resolve(SCRIPTS, "layout.js"), "utf8")));

console.log(failed ? `\n  ${failed} of ${total} FAILED — figma scripts` : `\n  all ${total} passed — figma scripts`);
process.exit(failed ? 1 : 0);
