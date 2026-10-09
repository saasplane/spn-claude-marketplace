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
    id, name, type: "COMPONENT", x, y, width, height, children: extra.empty ? [] : [{ id: `${id}:0`, name: "shape", type: "RECTANGLE" }],
    fills: solid(null), strokes: [],
  };
  Object.defineProperty(node, "componentPropertyDefinitions", {
    configurable: true,
    get() { throw new Error("can only get component property definitions of a component set or non-variant component"); },
  });
  for (const child of node.children) Object.defineProperty(child, "componentPropertyReferences", { get() { return {}; } });
  return node;
}

// A layer inside a component, as the API answers on 4,226 real versions: `componentPropertyReferences` is an object of the
// properties the layer is tied to (keys `characters`, `visible`, `mainComponent`, and `slotContentId` on a SLOT, which may
// also hold `visible`), and `{}` when it is tied to none; never null or undefined. A node outside a component holds null.
// `values` is what the layer draws: `visible`, `characters`, and `main` (the component an instance is of, read asynchronously).
const layer = (id, name, type, references = null, children = undefined, values = null) => {
  const node = { id, name, type, x: 0, y: 0, width: 10, height: 10, ...(children ? { children } : {}) };
  if (values && "visible" in values) node.visible = values.visible;
  if (values && "characters" in values) node.characters = values.characters;
  if (values && "main" in values) node.getMainComponentAsync = async () => values.main;
  Object.defineProperty(node, "componentPropertyReferences", { configurable: true, get() { return references ?? {}; } });
  return node;
};
const outsideLayer = (id, name, type) => {
  const node = { id, name, type, x: 0, y: 0, width: 10, height: 10 };
  Object.defineProperty(node, "componentPropertyReferences", { get() { return null; } });
  return node;
};

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
// An instance, as Figma gives it: its main component is read asynchronously (the sync read throws on a page that
// loads on demand), and its property values are in `componentProperties`, each as { type, value }.
const instanceNode = (id, name, box, { main = null, properties = {}, children = [{ id: `${id}:0`, name: "text", type: "TEXT" }] } = {}) => {
  const node = { id, name, type: "INSTANCE", x: box[0], y: box[1], width: box[2], height: box[3], children, componentProperties: properties, async getMainComponentAsync() { return main; } };
  Object.defineProperty(node, "mainComponent", { get() { throw new Error("Cannot call with documentAccess: dynamic-page. Use getMainComponentAsync instead."); } });
  return node;
};
const sheetCase = (id, name, size = [50, 20]) => instanceNode(id, name, [0, 0, size[0], size[1]]);
const loose = (id, name, box) => ({ id, name, type: "RECTANGLE", x: box[0], y: box[1], width: box[2], height: box[3] });

function file(pages) {
  const everything = new Map();
  // real Figma has no render bounds on a SECTION and throws on the read, so the stand-in does too
  const walk = (node) => {
    if (node.type === "SECTION") {
      Object.defineProperty(node, "absoluteRenderBounds", { get() { throw new Error("no such property 'absoluteRenderBounds' on SECTION node"); }, configurable: true });
    }
    everything.set(node.id, node); for (const child of node.children ?? []) { child.parent ??= node; walk(child); } };
  const root = { id: "0:0", type: "DOCUMENT", children: pages };
  for (const pageNode of pages) { pageNode.type = "PAGE"; pageNode.parent = root; walk(pageNode); }
  const figma = {
    mixed: Symbol("mixed"), root, switches: 0,
    async getNodeByIdAsync(id) { return everything.get(id) ?? null; },
    async setCurrentPageAsync() { this.switches += 1; },
  };
  // the page finds its nodes of a type, as Figma's does, through every level
  for (const pageNode of pages) {
    pageNode.findAllWithCriteria = ({ types }) => {
      const found = [];
      const collect = (node) => { for (const child of node.children ?? []) { if (types.includes(child.type)) found.push(child); collect(child); } };
      collect(pageNode);
      return found;
    };
  }
  return figma;
}

const page = (id, name, children, backgrounds = [{ type: "SOLID", color: { r: 0.12, g: 0.12, b: 0.12 }, opacity: 1 }]) =>
  ({ id, name, children, backgrounds });

async function runFile(script, inputs, figma) {
  const body = readFileSync(resolve(SCRIPTS, script), "utf8");
  // an input the case does not give keeps the script's own default, as it does when an agent fills only some
  const defaults = new Function(`return ${INPUTS_BLOCK.exec(body)[0].slice("const INPUTS = ".length, -1)}`)();
  const filled = body.replace(INPUTS_BLOCK, () => `const INPUTS = ${JSON.stringify({ ...defaults, ...inputs })};`);
  return new AsyncFunction("figma", filled)(figma);
}

// The scan is sent as its parts, one for a call. `run("page.js", { report: "scan" })` sends every part and puts the
// answers together as the whole scan answered before it was cut, so a case reads one scan. The findings stand in the
// order the whole scan gave them; a page is clean when every part is.
const SCAN_PARTS = ["scan-labels.js", "scan-placement.js", "scan-properties.js", "scan-sets.js"];
const FINDING_ORDER = ["emptyReading", "usagesNamingNoUnit", "versionsOutside", "versionPairsMeeting", "topLevelPairsMeeting", "strays", "defaultNamedProperties", "unreadableSets", "setsOverLimit", "emptyVersions", "emptyCases",
  "badCaseNames", "duplicateCaseNames", "labelsUnitElsewhere", "labelLayerNames", "labelsFormCannotSay", "defaultNotLabels",
  "topLevelNotSection", "meetingInSection", "sectionOutOfOrder", "unitsWithoutHeader", "outsideUnitSection",
  "childOutsideSection", "unitsWithoutCases", "unitsWithoutUsage", "propertyNotDrawn", "propertyClearedByNameAlone", "behaviourNamesHeldProperty", "versionNotWired", "versionDiffersFromDefault", "versionSlotIsFrame", "versionTiedToAnotherProperty", "propertyTiedToNothing", "crossedBeyondTheRule", "usagesWithoutCaption", "partSectionTooWide"];
const NOT_BLOCKING_ORDER = ["emptyVersions", "emptyCases", "unitsWithoutCases", "behaviourNamesHeldProperty", "usagesWithoutCaption", "partSectionTooWide", "propertyClearedByNameAlone", "versionSlotIsFrame", "versionDiffersFromDefault"];
async function runScan(inputs, figma) {
  const answers = [];
  for (const part of SCAN_PARTS) {
    const answer = await runFile(part, inputs, figma);
    if (answer.error || answer.pages) return answer;
    answers.push(answer);
  }
  if (inputs.only) {
    const held = answers.find((answer) => !answer.only.error);
    return held ?? answers[0];
  }
  const scans = answers.map((answer) => answer.scan);
  const findings = {};
  for (const name of FINDING_ORDER) for (const scan of scans) if (name in scan.findings) findings[name] = scan.findings[name];
  const left = Object.assign({}, ...scans.map((scan) => scan.shortened?.itemsLeftOut ?? {}));
  return {
    page: answers[0].page, form: answers[0].form, readAt: answers[0].readAt,
    scan: {
      clean: scans.every((scan) => scan.clean), notBlocking: NOT_BLOCKING_ORDER.filter((name) => scans.some((scan) => scan.notBlocking.includes(name))),
      form: answers[0].form, propertyChecks: scans.find((scan) => scan.propertyChecks).propertyChecks, read: scans.find((scan) => scan.read).read, findings,
      ...(Object.keys(left).length > 0 ? { shortened: { itemsLeftOut: left, askForOneWhole: scans.find((scan) => scan.shortened)?.shortened.askForOneWhole } } : {}),
    },
  };
}
const run = (script, inputs, figma) => (script === "page.js" && inputs.report === "scan" ? runScan(inputs, figma) : runFile(script, inputs, figma));

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
  usageDialog: "usage · DSDialog over DSBackdrop. It is no component",
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
// 1. a header with no prefix, a usage and a page's own reference frame are not strays
await guard(async () => {
  const badge = setNamed("1:set", "DSBadge", [200, 8032, 409, 400], ["variant=SOLID, size=SM, disabled=false, state=rest", "variant=SOLID, size=XS, disabled=false, state=rest"]);
  const header = text("1:head", REAL.badgeNow, REAL.badgeNow, [200, 8000, 971, 20]);
  const usageInstance = { id: "1:smp", name: "usage · nothing set", type: "INSTANCE", x: 680, y: 188, width: 320, height: 53, children: [{ id: "1:smp:0", type: "TEXT" }] };
  const caption = text("1:cap", "usage · DSDialog over DSBackdrop. It is no component", "usage · DSDialog over DSBackdrop. It is no component", [680, 160, 200, 20]);
  const found = (await scanOf([badge, header, usageInstance, caption])).findings;
  same("a header with no prefix, a usage instance and a usage caption are no stray", found.strays.items, []);
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
    text("S:1", "usage · DSImagePicker open — the picker, open (a caption made up for this case)", "usage · DSImagePicker open — the picker, open (a caption made up for this case)", [900, 900, 100, 20]),
  ]);
  same("`none — follows the hue` and `INVERSE — white` are value labels, tied by their column or to none, and never to the unit `none` or `INVERSE`",
    inventory.labels.map((label) => [label.part, label.unit]), [["column", "DSText"], ["untied", null]]);
  same("a usage's caption with a dash is a usage and names no unit", inventory.usages.map((usage) => [usage.kind, usage.unit]), [["usage", null]]);
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
// 7. a part's answer never overflows the limit, and says what it left out
await guard(async () => {
  const many = Array.from({ length: 80 }, (_, index) => loose(`6:${index}`, `Rectangle ${index}`, [index * 50, 900, 10, 10]));
  const nodes = [buttonSet(tidy), buttonHeader(), ...many];
  const part = await runFile("scan-placement.js", { pageId: "2:1", answerBytes: 3500, findingItems: 25 }, file([page("2:1", "Big", nodes)]));
  ok("a part's answer is no longer than answerBytes", Buffer.byteLength(JSON.stringify(part.scan), "utf8") <= 3500, String(JSON.stringify(part.scan).length));
  ok("it says what it left out, the counts whole", part.scan.shortened.itemsLeftOut.strays > 0 && part.scan.findings.strays.count === 80, JSON.stringify(part.scan.shortened));
  const small = await runFile("scan-placement.js", { pageId: "2:1" }, file([page("2:1", "Small", [buttonSet(tidy), buttonHeader()])]));
  same("a small page is whole, and cuts nothing", small.scan.shortened, undefined);
});
// 8. an empty version is reported as empty, and is not a failure of the scan
await guard(async () => {
  const empty = componentSet("1:set", "DSImage", [0, 0, 300, 200], [version("1:a", "state=loading", 20, 20, 100, 40, { empty: true }), version("1:b", "state=rest", 140, 20, 0, 40)]);
  const scan = (await scanOf([empty, labelText("1:label", "DSImage — one row · columns: state=loading, rest", [0, -30, 300, 20])]));
  same("an empty version says why it is empty", scan.findings.emptyVersions.items.map((item) => [item.version, item.why]), [["1:a", "no layer"], ["1:b", "no size"]]);
  same("empty versions do not make the page unclean, and the answer says which findings do not block", [scan.clean, scan.notBlocking], [true, ["emptyVersions", "emptyCases", "unitsWithoutCases", "behaviourNamesHeldProperty", "usagesWithoutCaption", "partSectionTooWide", "propertyClearedByNameAlone", "versionSlotIsFrame", "versionDiffersFromDefault"]]);
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
// labels, its usage, its cases and its parts, a part being a section inside its owner's. A page holds sections
// and nothing else at its top level. The coordinates below are those of the section a node stands in.

console.log("\n=== a page of sections: the same scripts read it");
const section = (id, name, box, children) => ({ id, name, type: "SECTION", x: box[0], y: box[1], width: box[2], height: box[3], children });
const headerText = (id, unit, characters, box) => text(id, `header · ${unit}`, characters, box);
const usageNode = (id, name, box, options) => instanceNode(id, name, box, options);
const iconPart = (id, box = [80, 860, 400, 220]) => section(`${id}:sec`, ".DSIcon", box, [
  headerText(`${id}:head`, ".DSIcon", ".DSIcon — one component", [80, 80, 300, 20]),
  version(`${id}:icon`, ".DSIcon", 80, 128, 48, 48),
]);
// One unit's section: header, set with its labels, usage, cases, and the parts it is given.
function unitSection(sid, name, origin, { header = true, parts = [], casesAbove = false, sheetLabel = false, caption = true, definitions = {}, note = "", caseNames = ["case=text"] } = {}) {
  const set = componentSet(`${sid}:set`, name, [200, 148, 300, 200], grid(sid, tidy), { definitions });
  const cases = sheet(`${sid}:sheet`, `${name} cases`, [80, casesAbove ? 444 : 668, 300, 100], caseNames.map((caseName, at) => sheetCase(`${sid}:c${at + 1}`, caseName)));
  const shown = usageNode(`${sid}:smp`, `usage · ${name} open`, [80, casesAbove ? 668 : 444, 200, 60]);
  return section(`${sid}:sec`, name, [origin[0], origin[1], 800, 1300], [
    ...(header ? [headerText(`${sid}:head`, name, `${name} — rows: size=SM, MD · columns: state=rest, hover${note}`, [80, 80, 600, 20])] : []),
    set,
    labelText(`${sid}:row`, "SM (default)", [116, 168, 60, 20]),
    labelText(`${sid}:col`, "rest", [220, 112, 60, 20]),
    labelText(`${sid}:lu`, "Usage", [80, casesAbove ? 624 : 400, 100, 20]),
    shown,
    ...(caption ? [text(`${sid}:cap`, `usage · ${name} open`, `usage · ${name} open`, [80, casesAbove ? 646 : 422, 200, 20])] : []),
    labelText(`${sid}:lc`, "Cases", [80, casesAbove ? 400 : 624, 100, 20]),
    ...(sheetLabel ? [text(`${sid}:sl`, `label · ${name} cases — horizontalScroll=true · wrap=true, wrap=false`, `${name} cases — horizontalScroll=true · wrap=true, wrap=false`, [80, casesAbove ? 420 : 644, 300, 20])] : []),
    cases,
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
  same("the scan says what it read: one unit, its sheet, its usage, its labels and its two sections",
    [scan.read.sets, scan.read.components, scan.read.sheets, scan.read.usages, scan.read.labels, scan.read.sections, scan.read.topLevel], [1, 1, 1, 1, 7, 2, 1]);
});
await guard(async () => {
  const inventory = await inventorySections([unitSection("B", "DSButton", [100, 100], { parts: [iconPart("P")] })]);
  same("a set in a section holds its box in page coordinates and the section it stands in", [inventory.sets[0].box, inventory.sets[0].parent], [[300, 248, 300, 200], "B:sec"]);
  same("a header is read from its layer `header · ` and tied to its unit, in the part's section too",
    inventory.labels.filter((label) => label.part === "header").map((label) => [label.unit, label.parent, label.name]),
    [["DSButton", "B:sec", "header · DSButton"], [".DSIcon", "P:sec", "header · .DSIcon"]]);
  same("a row label and a column label are tied to the set by its rows' and columns' spans, in one frame of reference",
    inventory.labels.filter((label) => ["row", "column"].includes(label.part)).map((label) => [label.part, label.unit]), [["row", "DSButton"], ["column", "DSButton"]]);
  same("a band's label is no value label and is tied to no unit", inventory.labels.filter((label) => label.part === "band").map((label) => label.text), ["Usage", "Cases", "Parts"]);
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
  const swappedBands = await scanSections([unitSection("B", "DSButton", [100, 100], { casesAbove: true })]);
  same("a section whose cases stand above its usage is named, with the band each piece of the usage stands below",
    swappedBands.findings.sectionOutOfOrder.items.map((item) => [item.band, item.standsBelow]), [["usage", "cases"], ["usage", "cases"], ["usage", "cases"]]);
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
  misplaced.children.push(headerText("B:other", "DSInput", "DSInput — one row", [500, 80, 100, 20]), usageNode("B:alien", "usage · DSInput open", [500, 668, 100, 60]));
  const scan = await scanSections([misplaced, unitSection("C", "DSInput", [100, 1640])]);
  same("a header and a usage of another unit, standing in this unit's section, are named",
    scan.findings.outsideUnitSection.items.map((item) => [item.id, item.kind, item.unit, item.in, item.unitIn]), [["B:other", "label", "DSInput", "B:sec", "C:sec"], ["B:alien", "usage", "DSInput", "B:sec", "C:sec"]]);
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
  const forms = [];
  for (const part of SCAN_PARTS) forms.push((await runFile(part, { pageId: "2:1" }, sectioned([]))).form);
  same("every part says the form at the top of its answer", forms, ["empty", "empty", "empty", "empty"]);
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
  const low = unitSection("B", "DSTable", [100, 100], { sheetLabel: true, parts: [iconPart("P")] });
  low.children.find((child) => child.id === "B:sl").y = 840;
  same("a sheet's label below the parts' label is out of the cases band", (await scanSections([low])).findings.sectionOutOfOrder.items.map((item) => item.id), ["B:sl"]);
});
await guard(async () => {
  const scan = await scanSections([unitSection("B", "DSButton", [100, 100], { caption: true })]);
  same("a usage's caption is counted apart: one usage and one usage label", [scan.read.usages, scan.read.usageLabels, scan.clean], [1, 1, true]);
  const unnamed = unitSection("B", "DSButton", [100, 100]);
  unnamed.children.find((child) => child.id === "B:smp").name = "usage · nothing set";
  const found = await scanSections([unnamed]);
  same("a usage that names no unit is a finding of its own, with its id, name and section; the scan is not clean",
    [found.clean, found.findings.usagesNamingNoUnit.items], [false, [{ id: "B:smp", name: "usage · nothing set", in: "B:sec" }]]);
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
  const wide = usageNode("X:w", "usage · DSButton open", [500, 1000, 100, 20]);
  wide.absoluteRenderBounds = { x: 600, y: 1100, width: 100, height: 320 };
  const found = await outsideOf([withChild(wide)]);
  same("a child whose box is inside but whose render bounds reach past the section is named, by the render bounds",
    found.items.map((item) => [item.child, item.side, item.px, item.bounds]), [["X:w", "bottom", 20, "render"]]);
  const inside = usageNode("X:n", "usage · DSButton open", [500, 1000, 100, 20]);
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
  // real Figma throws on absoluteRenderBounds of a SECTION; the stand-in does too, so the scan must not read it
  const owner = unitSection("B", "DSButton", [100, 100], { parts: [iconPart("P"), iconPart("Q", [600, 860, 400, 220])] });
  let found = null;
  try { found = await outsideOf([owner]); } catch (error) { found = { thrown: error.message }; }
  same("a sectioned page with a part section inside its owner and one outside answers, names the outside one by box, and does not throw",
    found.items?.map((item) => [item.child, item.section, item.side, item.px, item.bounds]) ?? found, [["Q:sec", "B:sec", "right", 200, "box"]]);
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
// others, whatever its kind, by their boxes. A nested part's section against a sheet and a usage against a sheet
// are two of those pairs; nothing was added for them.
console.log("\n=== page.js — siblings that meet inside a section");
await guard(async () => {
  const part = iconPart("P", [80, 700, 400, 220]);
  const found = (await scanSections([unitSection("B", "DSButton", [100, 100], { parts: [part] })])).findings.meetingInSection.items;
  same("a part's section that meets the sheet of cases is named with the section",
    found.filter((item) => item.pair.includes("B:sheet")).map((item) => [item.section, [...item.pair].sort()]), [["B:sec", ["B:sheet", "P:sec"]]]);
  const crowded = unitSection("B", "DSButton", [100, 100]);
  crowded.children.find((child) => child.id === "B:smp").y = 700;
  same("a usage that meets the sheet of cases is named with the section",
    (await scanSections([crowded])).findings.meetingInSection.items.map((item) => [item.section, [...item.pair].sort()]), [["B:sec", ["B:sheet", "B:smp"]]]);
});

console.log("\n=== page.js — units with no cases and units with no usage");
await guard(async () => {
  const bare = unitSection("B", "DSButton", [100, 100], { parts: [iconPart("P")] });
  bare.children = bare.children.filter((child) => child.id !== "B:sheet" && child.id !== "B:smp" && child.id !== "B:cap");
  const scan = await scanSections([bare]);
  same("a top-level unit with no sheet and no usage is named in each, and a part owes neither",
    [scan.findings.unitsWithoutCases.items, scan.findings.unitsWithoutUsage.items],
    [[{ unit: "DSButton", id: "B:set", in: "B:sec" }], [{ unit: "DSButton", id: "B:set", in: "B:sec" }]]);
  same("no usage makes the scan unclean and no sheet does not, and the answer says which does not block", [scan.clean, scan.notBlocking.includes("unitsWithoutCases"), scan.notBlocking.includes("unitsWithoutUsage")], [false, true, false]);
  const full = await scanSections([unitSection("B", "DSButton", [100, 100], { parts: [iconPart("P")] })]);
  same("a unit with a sheet and a usage is named in neither", [full.findings.unitsWithoutCases.count, full.findings.unitsWithoutUsage.count], [0, 0]);
});
await guard(async () => {
  const lone = unitSection("B", "DSButton", [100, 100]);
  lone.children = lone.children.filter((child) => child.id !== "B:sheet");
  lone.children.push(version("B:case", "case=text", 80, 668, 50, 20));
  const scan = await scanSections([lone]);
  same("a loose case component counts as the unit's cases", scan.findings.unitsWithoutCases.count, 0);
  const shared = section("SP:sec", "Shared parts", [100, 1640, 800, 400], [headerText("SP:head", "DSBase", "DSBase — one component", [80, 80, 300, 20]), version("SP:base", "DSBase", 80, 128, 48, 48)]);
  const withShared = await scanSections([unitSection("B", "DSButton", [100, 100]), shared]);
  same("a unit in `Shared parts` is a part and owes neither", [withShared.findings.unitsWithoutCases.count, withShared.findings.unitsWithoutUsage.count], [0, 0]);
  const other = unitSection("B", "DSButton", [100, 100]);
  other.children.find((child) => child.id === "B:smp").name = "usage · DSInput open";
  other.children.find((child) => child.id === "B:cap").characters = "usage · DSInput open";
  same("a usage that names another unit is no usage of this one", (await scanSections([other])).findings.unitsWithoutUsage.items.map((item) => item.unit), ["DSButton"]);
  const oldName = unitSection("B", "DSButton", [100, 100]);
  oldName.children.find((child) => child.id === "B:smp").name = "sample · DSButton open";
  oldName.children.find((child) => child.id === "B:cap").name = "sample · DSButton open";
  oldName.children.find((child) => child.id === "B:cap").characters = "sample · DSButton open";
  const oldScan = await scanSections([oldName]);
  same("a layer named `sample · ` is no usage: the unit owes one, and nothing is read as a usage",
    [oldScan.findings.unitsWithoutUsage.items.map((item) => item.unit), oldScan.read.usages, oldScan.read.usageLabels], [["DSButton"], 0, 0]);
});

// What a library file owes of a unit: a property that nothing draws is named, unless a header names it as behaviour.
console.log("\n=== page.js — a property that nothing draws");
const iconDefinitions = {
  "size#1:0": { type: "VARIANT", defaultValue: "SM", variantOptions: ["SM", "MD"] },
  "withStartIcon#1:1": { type: "BOOLEAN", defaultValue: false },
  "startIcon#1:2": { type: "INSTANCE_SWAP", defaultValue: "I:home" },
  "label#1:3": { type: "TEXT", defaultValue: "Button" },
  "withHeading#1:4": { type: "BOOLEAN", defaultValue: true },
};
// The unit's usage is an instance of the unit's first version, holding the given values of the unit's properties.
const drawing = (unit, properties) => {
  const set = unit.children.find((child) => child.type === "COMPONENT_SET");
  const shown = unit.children.find((child) => child.id.endsWith(":smp"));
  shown.componentProperties = Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, { type: iconDefinitions[key]?.type ?? "BOOLEAN", value }]));
  shown.getMainComponentAsync = async () => set.children[0];
  return unit;
};
const undrawn = async (unit, extra = []) => (await scanSections([unit, ...extra])).findings.propertyNotDrawn;
const namesOf = (found) => found.items.map((item) => item.property);
const everyDrawn = { "withStartIcon#1:1": true, "label#1:3": "Save", "withHeading#1:4": false };
await guard(async () => {
  const nothing = unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions });
  const found = await undrawn(nothing);
  same("a boolean, a swap and a text that nothing draws are named with their unit, type and default, and the scan is not clean",
    [found.count, found.items.map((item) => [item.unit, item.property, item.type, item.default]), (await scanSections([nothing])).clean],
    [4, [["DSButton", "withStartIcon", "BOOLEAN", "false"], ["DSButton", "startIcon", "INSTANCE_SWAP", "I:home"], ["DSButton", "label", "TEXT", "Button"], ["DSButton", "withHeading", "BOOLEAN", "true"]], false]);
  same("a variant property is no property to draw: it is drawn by the versions", namesOf(found).includes("size"), false);
  same("propertyNotDrawn blocks", (await scanSections([nothing])).notBlocking.includes("propertyNotDrawn"), false);
});
await guard(async () => {
  const found = await undrawn(drawing(unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions }), everyDrawn));
  same("an instance of the unit outside its set that holds a boolean on, a text changed and a default-on boolean off draws them; the swap is judged with its boolean",
    namesOf(found), []);
  const onlyTrue = await undrawn(drawing(unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions }), { "withStartIcon#1:1": false, "label#1:3": "Button", "withHeading#1:4": true }));
  same("an instance that holds every value at its default draws nothing", onlyTrue.count, 4);
});
await guard(async () => {
  const unit = unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions, caseNames: ["withStartIcon=true, startIcon=HOME", "label=Save", "withHeading=false"] });
  same("a case whose name holds `<property>=` draws that property, with no instance: a default-on property by its off case, a swap by its own name",
    namesOf(await undrawn(unit)), []);
  const loneCase = unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions });
  loneCase.children = loneCase.children.filter((child) => child.id !== "B:sheet");
  for (const [at, caseName] of ["withStartIcon=true", "label=Save", "withHeading=false"].entries()) loneCase.children.push(version(`B:lc${at}`, caseName, 80, 668 + at * 10, 50, 20));
  same("a loose case component in the unit's section draws it the same way, and its boolean draws the swap", namesOf(await undrawn(loneCase)), []);
  const loneWithPair = unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions });
  loneWithPair.children = loneWithPair.children.filter((child) => child.id !== "B:sheet");
  for (const [at, caseName] of ["withStartIcon=true, startIcon=HOME", "label=Save", "withHeading=false"].entries()) loneWithPair.children.push(version(`B:lc${at}`, caseName, 80, 668 + at * 10, 50, 20));
  same("a case that names a pair draws both", namesOf(await undrawn(loneWithPair)), []);
  const partly = unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions, caseNames: ["label=Save"] });
  same("a case that names one property draws only that one", namesOf(await undrawn(partly)), ["withStartIcon", "startIcon", "withHeading"]);
});
await guard(async () => {
  const swapOnly = drawing(unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions }), { "startIcon#1:2": "I:search" });
  same("a swap changed to another component is drawn on its own", namesOf(await undrawn(swapOnly)), ["withStartIcon", "label", "withHeading"]);
  const pair = drawing(unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions }), { "withStartIcon#1:1": true });
  same("a swap whose boolean (`with` and the swap's name, first letter raised) is drawn is drawn with it", namesOf(await undrawn(pair)), ["label", "withHeading"]);
  const noPartner = { "icon#1:2": { type: "INSTANCE_SWAP", defaultValue: "I:home" }, "withStartIcon#1:1": { type: "BOOLEAN", defaultValue: false } };
  const alone = drawing(unitSection("B", "DSButton", [100, 100], { definitions: noPartner }), { "withStartIcon#1:1": true });
  alone.children.find((child) => child.id === "B:smp").componentProperties["withStartIcon#1:1"].type = "BOOLEAN";
  same("a swap with no boolean of that name is judged alone", namesOf(await undrawn(alone)), ["icon"]);
});
await guard(async () => {
  const behaves = unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions, note: " · behaviour: label, withHeading, startIcon" });
  same("a property the header names in its behaviour clause is not named; the others still are", namesOf(await undrawn(behaves)), ["withStartIcon"]);
  const swapBehaviour = unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions, note: " · behaviour: withStartIcon" });
  same("a swap is judged with its boolean named as behaviour", namesOf(await undrawn(swapBehaviour)), ["label", "withHeading"]);
  // The book: a property of behaviour has nothing to draw, so the set does not hold it, and the header names it.
  const held = await scanSections([unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions, note: " · behaviour: label, lazy" })]);
  same("a name in the behaviour clause that the set holds as a property is the finding (it is drawn, so it is not behaviour), and does not block",
    [held.findings.behaviourNamesHeldProperty.items.map((item) => [item.unit, item.name]), held.notBlocking.includes("behaviourNamesHeldProperty")], [[["DSButton", "label"]], true]);
  same("a name the set does not hold (`lazy`) is what the rule asks, and is no finding",
    (await scanSections([unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions, note: " · behaviour: lazy" })])).findings.behaviourNamesHeldProperty.count, 0);
  const soundUnit = drawing(unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions, note: " · behaviour: lazy" }), everyDrawn);
  // every property is tied to a layer of the first version, so that propertyTiedToNothing has nothing to name
  soundUnit.children.find((child) => child.type === "COMPONENT_SET").children[0].children = Object.keys(iconDefinitions).filter((key) => iconDefinitions[key].type !== "VARIANT").map((key, at) => layer(`B:t${at}`, `layer ${at}`, "TEXT", { characters: key }));
  const sound = await scanSections([soundUnit]);
  same("a unit whose every property is drawn or named is clean", [sound.clean, counts(sound)], [true, {}]);
});
await guard(async () => {
  const set = componentSet("P:set", ".DSIcon", [80, 128, 100, 100], [version("P:1", "size=SM", 0, 0)], { definitions: { "withBadge#2:1": { type: "BOOLEAN", defaultValue: false } } });
  const part = section("P:sec", ".DSIcon", [80, 860, 400, 220], [headerText("P:head", ".DSIcon", ".DSIcon — rows: size=SM", [80, 80, 300, 20]), set]);
  const found = await undrawn(unitSection("B", "DSButton", [100, 100], { parts: [part] }));
  same("a part's property that nothing draws is named, with the part's section", found.items.map((item) => [item.unit, item.property, item.in]), [[".DSIcon", "withBadge", "P:sec"]]);
  same("a part owes no usage, so it is named in no usage finding", (await scanSections([unitSection("B", "DSButton", [100, 100], { parts: [part] })])).findings.unitsWithoutUsage.count, 0);
});
await guard(async () => {
  const lone = { id: "L:unit", name: "DSLink", type: "COMPONENT", x: 200, y: 148, width: 100, height: 40, children: [{ id: "L:unit:0", type: "RECTANGLE" }], fills: solid(null), strokes: [], componentPropertyDefinitions: { "withIcon#3:1": { type: "BOOLEAN", defaultValue: false } } };
  const unit = unitSection("B", "DSLink", [100, 100], { definitions: {} });
  unit.children = unit.children.filter((child) => !["B:set", "B:row", "B:col"].includes(child.id)).concat([lone]);
  same("a lone component's property that nothing draws is named", namesOf(await undrawn(unit)), ["withIcon"]);
  const smp = unit.children.find((child) => child.id === "B:smp");
  smp.componentProperties = { "withIcon#3:1": { type: "BOOLEAN", value: true } };
  smp.getMainComponentAsync = async () => lone;
  same("an instance of a lone component that holds it on draws it", namesOf(await undrawn(unit)), []);
});
await guard(async () => {
  const unit = unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions });
  const set = unit.children.find((child) => child.type === "COMPONENT_SET");
  set.children[0].children = [instanceNode("B:in", "inside", [0, 0, 10, 10], { main: set.children[1], properties: { "withStartIcon#1:1": { type: "BOOLEAN", value: true } } })];
  set.children[0].children[0].parent = set.children[0];
  same("an instance inside the unit's own set draws nothing", (await undrawn(unit)).count, 4);
  const other = unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions });
  const nested = usageNode("B:nest", "usage · DSButton nested", [500, 1000, 100, 20], { main: other.children.find((child) => child.type === "COMPONENT_SET").children[1], properties: { "withStartIcon#1:1": { type: "BOOLEAN", value: true } } });
  other.children.push(nested);
  same("an instance of any version of the unit draws it, wherever it stands on the page", namesOf(await undrawn(other)), ["label", "withHeading"]);
});
await guard(async () => {
  const flat = await scanOf([componentSet("F:set", "DSButton", [0, 0, 300, 200], grid("F", tidy), { definitions: iconDefinitions }), buttonHeader()]);
  same("a page in the old flat form is not judged for drawn properties", flat.findings.propertyNotDrawn.count, 0);
});

console.log("\n=== page.js — a unit with no usage, and a unit drawn as cases alone");
const casesAlone = (caseNames) => section("A:sec", "DSAspectRatio", [100, 100, 800, 600], [
  headerText("A:head", "DSAspectRatio", "DSAspectRatio — no set of versions, shown as cases", [80, 80, 600, 20]),
  labelText("A:lc", "Cases", [80, 144, 100, 20]),
  sheet("A:sheet", "DSAspectRatio cases", [80, 188, 300, 100], caseNames.map((caseName, at) => sheetCase(`A:c${at}`, caseName))),
]);
await guard(async () => {
  const scan = await scanSections([casesAlone(["ratio=16:9"])]);
  same("a unit drawn as cases alone, with no component in its section, takes its first case for its usage", [scan.findings.unitsWithoutUsage.count, scan.clean], [0, true]);
  same("a unit drawn as cases alone with an empty sheet has no first case: it owes its usage", (await scanSections([casesAlone([])])).findings.unitsWithoutUsage.items.map((item) => item.unit), ["DSAspectRatio"]);
  const withComponent = casesAlone(["ratio=16:9"]);
  withComponent.children.push(version("A:lone", "DSAspectRatio", 80, 300, 40, 40));
  same("a sheet beside a component of its section is not a unit of cases alone: with no usage it is named", (await scanSections([withComponent])).findings.unitsWithoutUsage.count, 1);
});
await guard(async () => {
  const bare = unitSection("B", "DSButton", [100, 100]);
  bare.children = bare.children.filter((child) => child.id !== "B:smp" && child.id !== "B:cap");
  const scan = await scanSections([bare]);
  same("a top-level unit with no usage is named and the scan is not clean", [scan.findings.unitsWithoutUsage.items.map((item) => item.unit), scan.clean], [["DSButton"], false]);
});

console.log("\n=== page.js — a usage's caption, and a part's section as wide as its content");
await guard(async () => {
  const uncaptioned = unitSection("B", "DSButton", [100, 100], { caption: false });
  const scan = await scanSections([uncaptioned]);
  same("a usage with no caption directly above it is counted and does not block", [scan.findings.usagesWithoutCaption.items.map((item) => item.id), scan.clean], [["B:smp"], true]);
  const moved = unitSection("B", "DSButton", [100, 100]);
  moved.children.find((child) => child.id === "B:cap").x = 300;
  same("a caption off the usage's left edge is no caption of it", (await scanSections([moved])).findings.usagesWithoutCaption.count, 1);
  same("a caption above its usage at its left edge is found", (await scanSections([unitSection("B", "DSButton", [100, 100])])).findings.usagesWithoutCaption.count, 0);
  const wide = iconPart("P", [80, 860, 600, 220]);
  const tooWide = await scanSections([unitSection("B", "DSButton", [100, 100], { parts: [wide] })]);
  same("a part's section with more than the padding empty at its right is counted and does not block", [tooWide.findings.partSectionTooWide.items.map((item) => [item.id, item.emptyAtRight]), tooWide.clean], [[["P:sec", 220]], true]);
  same("a part's section as wide as its content and the padding is not counted", (await scanSections([unitSection("B", "DSButton", [100, 100], { parts: [iconPart("P")] })])).findings.partSectionTooWide.count, 0);
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

console.log("\n=== page.js — a version whose layers carry no reference its twin holds");
const wiredVersion = (id, name, y, layers) => {
  const node = version(id, name, 20, y);
  node.children = layers;
  return node;
};
const bodyOf = (id, wired, extra = []) => [layer(`${id}:b`, "body", "FRAME", null, [
  layer(`${id}:t`, "label", "TEXT", wired ? { characters: "label#1:1" } : null),
  layer(`${id}:i`, "icon", "INSTANCE", wired ? { visible: "withIcon#1:2", mainComponent: "icon#1:3" } : null),
  ...extra,
])];
const wiredScan = async (versions) => (await scanOf([componentSet("W:set", "DSInput", [0, 0, 300, 400], versions), buttonHeader()])).findings;
await guard(async () => {
  const found = await wiredScan([
    wiredVersion("W:1", "readOnly=false, type=TEXT", 0, bodyOf("W:1", true)),
    wiredVersion("W:2", "readOnly=true, type=TEXT", 60, bodyOf("W:2", false)),
    wiredVersion("W:3", "readOnly=false, type=EMAIL", 120, bodyOf("W:3", true)),
    wiredVersion("W:4", "readOnly=true, type=EMAIL", 180, bodyOf("W:4", false)),
  ]);
  same("a version whose layers carry no reference its twin holds is named, with its set, the missing count and its paths",
    found.versionNotWired.items.map((item) => [item.set, item.setName, item.version, item.name, item.missing, item.paths]),
    [["W:set", "DSInput", "W:2", "readOnly=true, type=TEXT", 3, ["body > label (characters)", "body > icon (visible)", "body > icon (mainComponent)"]],
      ["W:set", "DSInput", "W:4", "readOnly=true, type=EMAIL", 3, ["body > label (characters)", "body > icon (visible)", "body > icon (mainComponent)"]]]);
  const scan = await scanOf([componentSet("W:set", "DSInput", [0, 0, 300, 400], [wiredVersion("W:1", "readOnly=false", 0, bodyOf("W:1", true)), wiredVersion("W:2", "readOnly=true", 60, bodyOf("W:2", false))]), buttonHeader()]);
  same("versionNotWired blocks", [scan.clean, scan.notBlocking.includes("versionNotWired"), scan.findings.versionNotWired.count], [false, false, 1]);
});
await guard(async () => {
  const more = [layer("W:2:x1", "a", "TEXT"), layer("W:2:x2", "b", "TEXT"), layer("W:2:x3", "c", "TEXT")];
  const wired = (id) => bodyOf(id, true, ["a", "b", "c"].map((name, at) => layer(`${id}:x${at}`, name, "TEXT", { characters: `${name}#1:9` })));
  const found = await wiredScan([wiredVersion("W:1", "state=rest", 0, wired("W:1")), wiredVersion("W:2", "state=hover", 60, bodyOf("W:2", false, more))]);
  same("the count of missing references is whole and the paths are cut to the first three", [found.versionNotWired.items[0].missing, found.versionNotWired.items[0].paths.length], [6, 3]);
});
await guard(async () => {
  const bare = [layer("W:2:b", "body", "FRAME", null, [layer("W:2:t", "label", "TEXT", null)])];
  const found = await wiredScan([wiredVersion("W:1", "ellipsis=false", 0, bodyOf("W:1", true)), wiredVersion("W:2", "ellipsis=true", 60, bare)]);
  same("a version with no node at a wired path (an ellipsis version with no icon layer) is named only for the layers it has", found.versionNotWired.items.map((item) => [item.version, item.missing, item.paths]), [["W:2", 1, ["body > label (characters)"]]]);
  const noLayer = [layer("W:2:s", "separator", "RECTANGLE", null)];
  const none = await wiredScan([wiredVersion("W:1", "kind=item", 0, bodyOf("W:1", true)), wiredVersion("W:2", "kind=separator", 60, noLayer)]);
  same("a version with none of the wired paths (a separator) is not named", [none.versionNotWired.count, none.versionSlotIsFrame.count], [0, 0]);
});
await guard(async () => {
  const slotted = (id, slot) => [layer(`${id}:b`, "body", "FRAME", null, [slot])];
  const found = await wiredScan([
    wiredVersion("W:1", "type=TEXT", 0, slotted("W:1", layer("W:1:s", "startNode", "SLOT", { slotContentId: "startNode#1:5", visible: "withStart#1:6" }))),
    wiredVersion("W:2", "type=NUMBER", 60, slotted("W:2", layer("W:2:s", "startNode", "FRAME"))),
  ]);
  same("a FRAME where the twin has a SLOT is named apart, in versionSlotIsFrame, and not in versionNotWired",
    [found.versionNotWired.count, found.versionSlotIsFrame.items.map((item) => [item.version, item.missing, item.paths])],
    [0, [["W:2", 2, ["body > startNode (slotContentId; twin SLOT, here FRAME)", "body > startNode (visible; twin SLOT, here FRAME)"]]]]);
  const scan = await scanOf([componentSet("W:set", "DSInput", [0, 0, 300, 400], [wiredVersion("W:1", "type=TEXT", 0, slotted("W:1", layer("W:1:s", "startNode", "SLOT", { slotContentId: "startNode#1:5" }))), wiredVersion("W:2", "type=NUMBER", 60, slotted("W:2", layer("W:2:s", "startNode", "FRAME")))]), buttonHeader()]);
  const sound = await scanOf([componentSet("W:set", "DSInput", [0, 0, 300, 400], [wiredVersion("W:1", "type=TEXT", 0, slotted("W:1", layer("W:1:s", "startNode", "SLOT", { slotContentId: "startNode#1:5" }))), wiredVersion("W:2", "type=NUMBER", 60, slotted("W:2", layer("W:2:s", "startNode", "SLOT", { slotContentId: "startNode#1:5" })))]), buttonHeader()]);
  same("versionSlotIsFrame does not block: the scan is as clean with the FRAME as with the SLOT", [scan.findings.versionSlotIsFrame.count, sound.findings.versionSlotIsFrame.count, scan.clean === sound.clean, scan.notBlocking.includes("versionSlotIsFrame")], [1, 0, true, true]);
  const slotLacking = await wiredScan([
    wiredVersion("W:1", "type=TEXT", 0, slotted("W:1", layer("W:1:s", "startNode", "SLOT", { slotContentId: "startNode#1:5" }))),
    wiredVersion("W:2", "type=EMAIL", 60, slotted("W:2", layer("W:2:s", "startNode", "SLOT"))),
  ]);
  same("a SLOT that lacks the slot reference its twin SLOT holds is a version not wired", slotLacking.versionNotWired.items.map((item) => [item.version, item.paths]), [["W:2", ["body > startNode (slotContentId)"]]]);
});
await guard(async () => {
  const found = await wiredScan([wiredVersion("W:1", "size=SM", 0, bodyOf("W:1", false)), wiredVersion("W:2", "size=MD", 60, bodyOf("W:2", false))]);
  same("a set where no version holds any reference has nothing to compare", [found.versionNotWired.count, found.versionSlotIsFrame.count], [0, 0]);
  const apart = await wiredScan([wiredVersion("W:1", "size=SM, tone=A", 0, bodyOf("W:1", true)), wiredVersion("W:2", "size=MD, tone=B", 60, bodyOf("W:2", false))]);
  same("a version that differs from the wired one in two values is named all the same: the twin no longer decides, and its nearest is the wired version that holds every missing tie with the fewest values apart",
    apart.versionNotWired.items.map((item) => [item.version, item.missing, item.nearest]), [["W:2", 3, "W:1"]]);
  const lone = await wiredScan([wiredVersion("W:1", "size=SM", 0, bodyOf("W:1", true))]);
  same("a set of one version has no twin", lone.versionNotWired.count, 0);
  const twice = await wiredScan([
    wiredVersion("W:1", "size=SM", 0, [layer("W:1:a", "row", "FRAME", { visible: "p#1:1" }), layer("W:1:b", "row", "FRAME", null)]),
    wiredVersion("W:2", "size=MD", 60, [layer("W:2:a", "row", "FRAME", { visible: "p#1:1" }), layer("W:2:b", "row", "FRAME", null)]),
  ]);
  same("two sibling layers of one name are two paths: the unwired second one is not mistaken for the wired first", twice.versionNotWired.count, 0);
});

console.log("\n=== page.js — a path wired in any version, a tie that moves, a tie to another property, a property tied to nothing");
const definedScan = async (versions, definitions, extra = []) => (await scanOf([componentSet("W:set", "DSInput", [0, 0, 300, 400], versions, { definitions }), buttonHeader(), ...extra])).findings;
await guard(async () => {
  // DSInput-like: only kind=TEXT, size=SM holds the references; the others have a twin that holds none, or none at all.
  const grid = [["TEXT", "SM"], ["TEXT", "MD"], ["NUMBER", "SM"], ["NUMBER", "MD"], ["EMAIL", "SM"], ["EMAIL", "MD"]];
  const found = await wiredScan(grid.map(([kind, size], at) => wiredVersion(`W:${at}`, `kind=${kind}, size=${size}`, at * 60, bodyOf(`W:${at}`, at === 0))));
  same("every version that lacks what any version holds is named, also one whose one-value twins are all unwired too; the nearest wired version is given: a twin one value apart, else the one that holds every missing tie",
    found.versionNotWired.items.map((item) => [item.version, item.missing, item.nearest]),
    [["W:1", 3, "W:0"], ["W:2", 3, "W:0"], ["W:3", 3, "W:0"], ["W:4", 3, "W:0"], ["W:5", 3, "W:0"]]);
});
await guard(async () => {
  // DSLayoutNavNode-like: a SLOT in one version only; the FRAMEs have only FRAME twins, or none a value apart.
  const slotted = (id, type) => [layer(`${id}:b`, "nodes wrap", "FRAME", null, [layer(`${id}:s`, "nodes", type, type === "SLOT" ? { slotContentId: "nodes#1:5" } : null)])];
  const found = await wiredScan([
    wiredVersion("W:0", "kind=A, size=SM", 0, slotted("W:0", "SLOT")),
    wiredVersion("W:1", "kind=B, size=MD", 60, slotted("W:1", "FRAME")),
    wiredVersion("W:2", "kind=C, size=MD", 120, slotted("W:2", "FRAME")),
  ]);
  same("a FRAME at a path where any version holds a SLOT is named in versionSlotIsFrame, though no twin of it is a SLOT",
    [found.versionSlotIsFrame.items.map((item) => item.version), found.versionNotWired.count], [["W:1", "W:2"], 0]);
});
await guard(async () => {
  // DSProgress-like: with showValue=false the visibility is tied on header, with showValue=true on header > label.
  const progress = (id, shown, extra = {}) => [layer(`${id}:h`, "header", "FRAME", shown ? null : { visible: "showValue#1:1" }, [
    layer(`${id}:l`, "label", "TEXT", { characters: "text#1:2", ...(shown ? { visible: "showValue#1:1" } : {}), ...extra }),
  ])];
  const found = await wiredScan([
    wiredVersion("W:1", "percent=40, showValue=false", 0, progress("W:1", false)),
    wiredVersion("W:2", "percent=40, showValue=true", 60, progress("W:2", true)),
  ]);
  same("a version that ties the same property on another layer is not named for lacking it here: the tie moves between layers by design", found.versionNotWired.count, 0);
  const cleared = wiredVersion("W:3", "percent=0, showValue=true", 120, [layer("W:3:h", "header", "FRAME", null, [layer("W:3:l", "label", "TEXT", null)])]);
  const named = await wiredScan([
    wiredVersion("W:1", "percent=40, showValue=false", 0, progress("W:1", false)),
    wiredVersion("W:2", "percent=40, showValue=true", 60, progress("W:2", true)),
    cleared,
  ]);
  same("a version that ties the property nowhere (left untied on purpose) is still named", named.versionNotWired.items.map((item) => [item.version, item.missing]), [["W:3", 3]]);
});
await guard(async () => {
  // DSLayout-like: rail > nav is a SLOT tied to nav#5:21 in the versions, and to nav#168:0 in one.
  const rail = (id, key) => [layer(`${id}:r`, "rail", "FRAME", null, [layer(`${id}:n`, "nav", "SLOT", { slotContentId: key })])];
  const found = await wiredScan([
    wiredVersion("W:1", "side=LEFT, size=SM", 0, rail("W:1", "nav#5:21")),
    wiredVersion("W:2", "side=LEFT, size=MD", 60, rail("W:2", "nav#5:21")),
    wiredVersion("W:3", "side=RIGHT, size=SM", 120, rail("W:3", "nav#5:21")),
    wiredVersion("W:4", "side=RIGHT, size=MD", 180, rail("W:4", "nav#168:0")),
  ]);
  same("a lone version tied to another property that no single variant explains is named, with the path, both keys and the variant nearest to explaining it, and blocks",
    [found.versionTiedToAnotherProperty.items.map((item) => [item.version, item.path, item.holds, item.others, item.nearestVariant, item.valuesHoldingBoth]), found.versionNotWired.count],
    [[["W:4", "rail > nav (slotContentId)", "nav#168:0", "nav#5:21", "side", 1]], 0]);
  const scan = await scanOf([componentSet("W:set", "DSInput", [0, 0, 300, 400], [wiredVersion("W:1", "side=LEFT, size=SM", 0, rail("W:1", "a#1:1")), wiredVersion("W:2", "side=LEFT, size=MD", 60, rail("W:2", "a#1:1")), wiredVersion("W:3", "side=RIGHT, size=SM", 120, rail("W:3", "a#1:1")), wiredVersion("W:4", "side=RIGHT, size=MD", 180, rail("W:4", "b#1:2"))]), buttonHeader()]);
  same("versionTiedToAnotherProperty blocks", [scan.notBlocking.includes("versionTiedToAnotherProperty"), scan.clean], [false, false]);
  const split = await wiredScan([wiredVersion("W:1", "side=LEFT", 0, rail("W:1", "nav#5:21")), wiredVersion("W:2", "side=RIGHT", 60, rail("W:2", "nav#168:0"))]);
  same("two versions tied to two properties have no minority: none is named", split.versionTiedToAnotherProperty.count, 0);
  const same3 = await wiredScan([wiredVersion("W:1", "side=LEFT", 0, rail("W:1", "nav#5:21")), wiredVersion("W:2", "side=RIGHT", 60, rail("W:2", "nav#5:21"))]);
  same("versions tied to the same property are not named", same3.versionTiedToAnotherProperty.count, 0);
});
await guard(async () => {
  const body = (id, keys) => [layer(`${id}:b`, "body", "FRAME", null, keys.map((key, at) => layer(`${id}:${at}`, `part ${at}`, "TEXT", { characters: key })))];
  const definitions = {
    "size#1:0": { type: "VARIANT", defaultValue: "SM", variantOptions: ["SM", "MD"] },
    "label#1:1": { type: "TEXT", defaultValue: "Name" },
    "withIcon#1:2": { type: "BOOLEAN", defaultValue: false },
    "startNode#9:9": { type: "SLOT", defaultValue: "" },
  };
  const found = await definedScan([wiredVersion("W:1", "size=SM", 0, body("W:1", ["label#1:1"])), wiredVersion("W:2", "size=MD", 60, body("W:2", []))], definitions);
  same("a definition that no layer of any version is tied to is named with its unit, name, key and type; one tied in a single version only, and a VARIANT, are not",
    found.propertyTiedToNothing.items.map((item) => [item.set, item.setName, item.property, item.key, item.type]),
    [["W:set", "DSInput", "withIcon", "withIcon#1:2", "BOOLEAN"], ["W:set", "DSInput", "startNode", "startNode#9:9", "SLOT"]]);
  const scan = await scanOf([componentSet("W:set", "DSInput", [0, 0, 300, 400], [wiredVersion("W:1", "size=SM", 0, body("W:1", []))], { definitions }), buttonHeader()]);
  same("propertyTiedToNothing blocks, and its count is whole", [scan.notBlocking.includes("propertyTiedToNothing"), scan.findings.propertyTiedToNothing.count, scan.clean], [false, 3, false]);
  const nested = [layer("W:1:b", "body", "FRAME", null, [layer("W:1:i", "inner", "INSTANCE", null, [layer("W:1:t", "text", "TEXT", { characters: "withIcon#1:2" })])])];
  const entered = await definedScan([wiredVersion("W:1", "size=SM", 0, nested)], { "withIcon#1:2": { type: "BOOLEAN", defaultValue: false } });
  same("a layer inside an instance is not entered: its reference is the nested component's, so the property is still tied to nothing", entered.propertyTiedToNothing.count, 1);
  const throwing = layer("W:1:x", "body", "TEXT");
  Object.defineProperty(throwing, "componentPropertyReferences", { get() { throw new Error("cannot read"); } });
  const unread = await definedScan([wiredVersion("W:1", "size=SM", 0, [throwing])], { "withIcon#1:2": { type: "BOOLEAN", defaultValue: false } });
  same("a set with a layer whose references cannot be read is not judged: an unread tie is not a missing tie", unread.propertyTiedToNothing.count, 0);
  const nodeOutside = await definedScan([wiredVersion("W:1", "size=SM", 0, [outsideLayer("W:1:o", "body", "TEXT")])], { "withIcon#1:2": { type: "BOOLEAN", defaultValue: false } });
  same("a layer that answers null (outside a component) holds no tie and does not throw", nodeOutside.propertyTiedToNothing.count, 1);
  const lone = version("L:1", "DSChip", 0, 0);
  lone.children = [layer("L:1:t", "label", "TEXT", { characters: "label#1:1" })];
  Object.defineProperty(lone, "componentPropertyDefinitions", { get() { return definitions; } });
  const loneFound = (await scanOf([lone])).findings.propertyTiedToNothing;
  same("a lone component with definitions is read the same way", loneFound.items.map((item) => [item.setName, item.property]), [["DSChip", "withIcon"], ["DSChip", "startNode"]]);
});

console.log("\n=== page.js — a split explained by a variant, a layer meant to differ, the nearest version, the caps");
const wiredScanWith = async (inputs, versions) => (await run("page.js", { pageId: "2:1", report: "scan", findingItems: 25, ...inputs }, file([page("2:1", "Actions", [componentSet("W:set", "DSInput", [0, 0, 300, 400], versions), buttonHeader()])]))).scan.findings;
await guard(async () => {
  // DSAccordion-like: the swap on `header row > indicator` follows `expanded`: every expanded version holds one key, every collapsed one the other.
  const indicator = (id, key) => [layer(`${id}:r`, "header row", "FRAME", null, [layer(`${id}:i`, "indicator", "INSTANCE", { mainComponent: key })])];
  const found = await wiredScan([
    wiredVersion("W:1", "expanded=true, state=rest", 0, indicator("W:1", "expandedIcon#1:1")),
    wiredVersion("W:2", "expanded=true, state=hover", 60, indicator("W:2", "expandedIcon#1:1")),
    wiredVersion("W:3", "expanded=true, state=focus", 120, indicator("W:3", "expandedIcon#1:1")),
    wiredVersion("W:4", "expanded=false, state=rest", 180, indicator("W:4", "collapsedIcon#1:2")),
    wiredVersion("W:5", "expanded=false, state=hover", 240, indicator("W:5", "collapsedIcon#1:2")),
  ]);
  same("a swap that follows a variant (every expanded version one key, every collapsed one the other, each value held by two versions at least) is not named, though the collapsed ones are the minority", found.versionTiedToAnotherProperty.count, 0);
  const lone = await wiredScan([
    wiredVersion("W:1", "expanded=true, state=rest", 0, indicator("W:1", "expandedIcon#1:1")),
    wiredVersion("W:2", "expanded=true, state=hover", 60, indicator("W:2", "expandedIcon#1:1")),
    wiredVersion("W:3", "expanded=true, state=focus", 120, indicator("W:3", "expandedIcon#1:1")),
    wiredVersion("W:4", "expanded=false, state=rest", 180, indicator("W:4", "collapsedIcon#1:2")),
  ]);
  same("a value held by one version only cannot explain a split: that version is named, for a person to judge by its nearestVariant", lone.versionTiedToAnotherProperty.items.map((item) => [item.version, item.nearestVariant]), [["W:4", "expanded"]]);
  // .DSContainerFrames-like: the layer `frame` is the footer in frames=FOOTER and the header in the others.
  const frame = (id, key) => [layer(`${id}:f`, "frame", "FRAME", { visible: key })];
  const frames = await wiredScan([
    wiredVersion("W:1", "frames=HEADER, size=SM", 0, frame("W:1", "withHeader#1:1")),
    wiredVersion("W:2", "frames=HEADER, size=MD", 60, frame("W:2", "withHeader#1:1")),
    wiredVersion("W:3", "frames=HEADER+FOOTER, size=SM", 120, frame("W:3", "withHeader#1:1")),
    wiredVersion("W:4", "frames=HEADER+FOOTER, size=MD", 180, frame("W:4", "withHeader#1:1")),
    wiredVersion("W:5", "frames=FOOTER, size=SM", 240, frame("W:5", "withFooter#1:2")),
    wiredVersion("W:6", "frames=FOOTER, size=MD", 300, frame("W:6", "withFooter#1:2")),
  ]);
  same("a layer that is the footer in one value of a variant and the header in the others is not named: `frames` explains the split", frames.versionTiedToAnotherProperty.count, 0);
  // two variants together: the key is y for (B, M) and (C, S) only; neither layout nor size explains it alone.
  const both = [["A", "S", "x"], ["A", "M", "x"], ["B", "S", "x"], ["B", "M", "y"], ["C", "S", "y"], ["C", "M", "x"], ["D", "S", "x"], ["D", "M", "x"]];
  const together = await wiredScan(both.map(([layout, size, key], at) => wiredVersion(`W:${at}`, `layout=${layout}, size=${size}`, at * 60, frame(`W:${at}`, `${key}#1:1`))));
  same("a key that depends on two variants together, which no single variant explains, is named, and the item says which variant comes nearest",
    together.versionTiedToAnotherProperty.items.map((item) => [item.version, item.nearestVariant, item.valuesHoldingBoth]), [["W:3", "layout", 2], ["W:4", "layout", 2]]);
});
await guard(async () => {
  // DSLayout-like, as read: rail > nav is nav#5:21 in four versions, all flush=false, and nav#168:0 in the one flush=true.
  // `flush` holds one key under each of its values, but flush=true is held by one version: it explains nothing.
  const rail = (id, key) => [layer(`${id}:r`, "rail", "FRAME", null, [layer(`${id}:n`, "nav", "SLOT", { slotContentId: key })])];
  const layout = await wiredScan([
    wiredVersion("W:1", "side=LEFT, size=SM, flush=false", 0, rail("W:1", "nav#5:21")),
    wiredVersion("W:2", "side=LEFT, size=MD, flush=false", 60, rail("W:2", "nav#5:21")),
    wiredVersion("W:3", "side=RIGHT, size=SM, flush=false", 120, rail("W:3", "nav#5:21")),
    wiredVersion("W:4", "side=RIGHT, size=MD, flush=false", 180, rail("W:4", "nav#5:21")),
    wiredVersion("W:5", "side=LEFT, size=MD, flush=true", 240, rail("W:5", "nav#168:0")),
  ]);
  same("the DSLayout shape: one version on another key, the only holder with flush=true, is named though flush seems to explain it",
    layout.versionTiedToAnotherProperty.items.map((item) => [item.version, item.path, item.holds, item.others]), [["W:5", "rail > nav (slotContentId)", "nav#168:0", "nav#5:21"]]);
  const pair = await wiredScan([wiredVersion("W:1", "flush=false", 0, rail("W:1", "nav#5:21")), wiredVersion("W:2", "flush=true", 60, rail("W:2", "nav#168:0"))]);
  same("a path tied in two versions, each to another key, has no minority: nothing is named", pair.versionTiedToAnotherProperty.count, 0);
});
await guard(async () => {
  // the answer's cap by bytes
  const many = unitSection("B", "DSButton", [100, 100]);
  for (let at = 0; at < 40; at += 1) many.children.push(loose(`M:${at}`, `Rectangle ${at} ${"long ".repeat(15)}`, [-100, 20 * at, 10, 10]));
  const asked = async (inputs) => (await run("page.js", { pageId: "2:1", report: "scan", findingItems: 25, ...inputs }, sectioned([many])));
  const utf8 = (value) => Buffer.byteLength(JSON.stringify(value), "utf8");
  const fewer = unitSection("B", "DSButton", [100, 100]);
  for (let at = 0; at < 5; at += 1) fewer.children.push(loose(`F:${at}`, `Rectangle ${at}`, [-100, 20 * at, 10, 10]));
  const whole = (await run("page.js", { pageId: "2:1", report: "scan" }, sectioned([fewer]))).scan;
  same("a page of few findings is not shortened", [whole.shortened, whole.findings.childOutsideSection.items.length], [undefined, 5]);
  const small = (await runFile("scan-placement.js", { pageId: "2:1", findingItems: 25, answerBytes: 4000 }, sectioned([many]))).scan;
  same("an answer over the limit is cut to under it, its counts whole, and says it was shortened",
    [utf8(small) <= 4000, small.findings.childOutsideSection.count, small.findings.childOutsideSection.items.length < 25, small.findings.childOutsideSection.items.length >= 3, small.shortened.itemsLeftOut.childOutsideSection > 0, small.shortened.askForOneWhole.includes("only")],
    [true, 40, true, true, true, true]);
  const counts = (await asked({ answerBytes: 1 })).scan;
  same("under a limit nothing fits, the lists go to counts alone, still whole", [counts.findings.childOutsideSection.count, counts.findings.childOutsideSection.items.length, counts.shortened.itemsLeftOut.childOutsideSection], [40, 0, 40]);
  const one = (await asked({ only: "childOutsideSection", answerBytes: 100000 })).only;
  same("`only` returns the finding's items past the default cap", [one.count, one.items.length, one.next], [40, 40, null]);
  const paged = (await asked({ only: "childOutsideSection", from: 5, count: 10 })).only;
  same("`only` pages by from and count", [paged.items.length, paged.from, paged.next, paged.items[0].child], [10, 5, 15, "M:5"]);
  const bytePaged = (await asked({ only: "childOutsideSection", answerBytes: 1000 })).only;
  same("`only` stops before answerBytes and gives next", [bytePaged.items.length < 40, bytePaged.next === bytePaged.items.length], [true, true]);
  same("`only` with an unknown finding says so", (await asked({ only: "nothing" })).only.error.includes("nothing"), true);
});
await guard(async () => {
  // DSProgress / DSNavigationMenuItem / DSInput-like: the layer is untied on purpose and shows other than the property's default.
  const definitions = {
    "value#1:2": { type: "TEXT", defaultValue: "40%" },
    "withPanel#1:3": { type: "BOOLEAN", defaultValue: false },
    "icon#1:4": { type: "INSTANCE_SWAP", defaultValue: "9:9" },
  };
  const parts = (id, wired, shown) => [layer(`${id}:b`, "body", "FRAME", null, [
    layer(`${id}:v`, "value", "TEXT", wired ? { characters: "value#1:2" } : null, undefined, { characters: shown.text }),
    layer(`${id}:c`, "chevron", "FRAME", wired ? { visible: "withPanel#1:3" } : null, undefined, { visible: shown.visible }),
    layer(`${id}:i`, "icon", "INSTANCE", wired ? { mainComponent: "icon#1:4" } : null, undefined, { main: shown.main }),
  ])];
  const rest = { text: "40%", visible: false, main: { id: "9:9", key: "k9" } };
  const scan = async (others) => (await scanOf([componentSet("W:set", "DSInput", [0, 0, 300, 400], [wiredVersion("W:1", "percent=40", 0, parts("W:1", true, rest)), ...others.map((one, at) => wiredVersion(`W:${at + 2}`, one[0], 60 * (at + 1), parts(`W:${at + 2}`, false, one[1])))], { definitions }), buttonHeader()]));
  const meant = await scan([["percent=0", { ...rest, text: "0%", visible: true, main: { id: "8:8", key: "k8" } }]]);
  same("a version all of whose missing ties would change what is drawn (the text, the visibility, the swap off their defaults) is a version that differs from its default, not a version not wired",
    [meant.findings.versionNotWired.count, meant.findings.versionDiffersFromDefault.items.map((item) => [item.version, item.missing, item.plain, item.changesDrawing, item.changing])],
    [0, [["W:2", 3, 0, 3, ["body > value (characters)", "body > chevron (visible)", "body > icon (mainComponent)"]]]]);
  same("versionDiffersFromDefault does not block", [meant.notBlocking.includes("versionDiffersFromDefault"), meant.findings.versionDiffersFromDefault.count], [true, 1]);
  const plain = await scan([["percent=60", rest], ["percent=61", { ...rest, main: { id: "x", key: "9:9" } }]]);
  same("a version whose layers already show the defaults (the swap by the component's id or its key) is a version not wired, with every tie plain",
    [plain.findings.versionDiffersFromDefault.count, plain.findings.versionNotWired.items.map((item) => [item.version, item.plain, item.changesDrawing, item.changing])], [0, [["W:2", 3, 0, []], ["W:3", 3, 0, []]]]);
  const mixed = await scan([["percent=0", { ...rest, visible: true }]]);
  same("a version with one missing tie that would change what is drawn and two plain ones stays a version not wired, giving the counts of each",
    [mixed.findings.versionDiffersFromDefault.count, mixed.findings.versionNotWired.items.map((item) => [item.version, item.missing, item.plain, item.changesDrawing, item.changing])],
    [0, [["W:2", 3, 2, 1, ["body > chevron (visible)"]]]]);
  const unknown = await wiredScan([wiredVersion("W:1", "percent=40", 0, bodyOf("W:1", true)), wiredVersion("W:2", "percent=0", 60, bodyOf("W:2", false))]);
  same("a tie whose property default is not known counts as plain: the version stays not wired", [unknown.versionDiffersFromDefault.count, unknown.versionNotWired.items.map((item) => [item.plain, item.changesDrawing])], [0, [[3, 0]]]);
});
await guard(async () => {
  const one = (id, wired, extra = []) => [layer(`${id}:a`, "a", "TEXT", wired.includes("a") ? { characters: "a#1:1" } : null), layer(`${id}:b`, "b", "TEXT", wired.includes("b") ? { characters: "b#1:2" } : null), ...extra];
  const none = await wiredScan([wiredVersion("W:1", "p=1, q=1", 0, one("W:1", ["a"])), wiredVersion("W:2", "p=2, q=2", 60, one("W:2", ["b"])), wiredVersion("W:3", "p=3, q=3", 120, one("W:3", []))]);
  same("the nearest is null only when no version holds every missing tie (W:3 misses both, and none holds both)", none.versionNotWired.items.map((item) => [item.version, item.nearest]), [["W:1", "W:2"], ["W:2", "W:1"], ["W:3", null]]);
  const far = await wiredScan([
    wiredVersion("W:1", "p=1, q=1, r=1", 0, one("W:1", [])),
    wiredVersion("W:2", "p=2, q=2, r=2", 60, one("W:2", ["a", "b"])),
    wiredVersion("W:3", "p=2, q=2, r=1", 120, one("W:3", ["a", "b"])),
  ]);
  same("where no twin one value apart holds the ties, the nearest is the wired version that holds all of them and differs in the fewest values", far.versionNotWired.items.map((item) => [item.version, item.nearest]), [["W:1", "W:3"]]);
});
await guard(async () => {
  const long = "state=" + "x".repeat(100) + ", filled=" + "y".repeat(40);
  const many = (id, wired) => [layer(`${id}:b`, "body", "FRAME", null, ["a", "b", "c", "d", "e"].map((name) => layer(`${id}:${name}`, name, "TEXT", wired ? { characters: `${name}#1:1` } : null)))];
  const versions = () => [wiredVersion("W:1", "state=rest", 0, many("W:1", true)), wiredVersion("W:2", long, 60, many("W:2", false))];
  const found = await wiredScanWith({}, versions());
  same("a version name is kept to 160 characters, and the paths to the first three by default", [found.versionNotWired.items[0].name.length, found.versionNotWired.items[0].paths.length, found.versionNotWired.items[0].missing], [long.length, 3, 5]);
  const whole = await wiredScanWith({ pathsNamed: 100 }, versions());
  same("`pathsNamed` asks for every path", [whole.versionNotWired.items[0].paths.length, whole.versionNotWired.items[0].paths[4]], [5, "body > e (characters)"]);
});

console.log("\n=== page.js — the four weaknesses of the property check");
const linkDefinitions = { "label#2:1": { type: "TEXT", defaultValue: "Link" }, "withIcon#2:2": { type: "BOOLEAN", defaultValue: false } };
const twoUnits = (caseNames = []) => {
  const unit = unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions, caseNames });
  const other = componentSet("B:set2", "DSLink", [520, 148, 200, 100], [version("B:set2:1", "tone=A", 0, 0), version("B:set2:2", "tone=B", 100, 0)], { definitions: linkDefinitions });
  unit.children.push(other);
  unit.children.push(headerText("B:head2", "DSLink", "DSLink — rows: tone=A, B", [520, 80, 300, 20]));
  return { unit, button: unit.children.find((child) => child.id === "B:set"), link: other };
};
const looseCase = (id, name, children) => { const node = version(id, name, 80, 668, 50, 20); node.children = children; return node; };
const propertiesOf = (unitName, values) => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { type: (unitName === "DSLink" ? linkDefinitions : iconDefinitions)[key].type, value }]));
const propertyScan = async (unit) => (await scanSections([unit])).findings;
const unitsNamed = (found) => found.items.map((item) => `${item.unit}.${item.property}`);
const withoutSheet = (unit) => { unit.children = unit.children.filter((child) => child.id !== "B:sheet"); return unit; };
await guard(async () => {
  const { unit, link } = twoUnits();
  withoutSheet(unit).children.push(looseCase("B:lc", "label=Save", [layer("B:lc:n", "DSLink label", "TEXT")]));
  const found = await propertyScan(unit);
  same("a loose case component is credited to the unit its layer names, not to every unit of its section",
    [unitsNamed(found.propertyClearedByNameAlone), unitsNamed(found.propertyNotDrawn).filter((name) => name.endsWith(".label"))], [["DSLink.label"], ["DSButton.label"]]);
  const held = twoUnits();
  withoutSheet(held.unit).children.push(looseCase("B:lc", "label=Save", [instanceNode("B:lc:i", "a button", [0, 0, 10, 10], { main: held.button.children[0], properties: propertiesOf("DSButton", { "label#1:3": "Save" }) })]));
  const heldFound = await propertyScan(held.unit);
  same("a loose case component holding an instance of one unit belongs to that unit: the other unit's property is not cleared",
    [unitsNamed(heldFound.propertyNotDrawn).filter((name) => name.endsWith(".label")), unitsNamed(heldFound.propertyClearedByNameAlone)], [["DSLink.label"], []]);
  const alone = unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions });
  withoutSheet(alone).children.push(looseCase("B:lc", "label=Save", []));
  same("a loose case component with no instance and no unit named, in a section of one unit, is that unit's", unitsNamed((await propertyScan(alone)).propertyClearedByNameAlone), ["DSButton.label"]);
  const nobody = twoUnits();
  withoutSheet(nobody.unit).children.push(looseCase("B:lc", "label=Save", []));
  same("a loose case component that belongs to no unit of a section of two clears none", unitsNamed((await propertyScan(nobody.unit)).propertyClearedByNameAlone), []);
  void link;
});
await guard(async () => {
  const opened = unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions, caseNames: ["label=Save"] });
  const set = opened.children.find((child) => child.type === "COMPONENT_SET");
  const sheetOf = opened.children.find((child) => child.id === "B:sheet");
  sheetOf.children = [instanceNode("B:c1", "label=Save", [0, 0, 50, 20], { main: set.children[0], properties: propertiesOf("DSButton", { "label#1:3": "Button" }) })];
  const unopened = await propertyScan(opened);
  same("a case named `label=Save` that holds an instance of the unit with the label at its default does not clear it", [unitsNamed(unopened.propertyNotDrawn).includes("DSButton.label"), unopened.propertyClearedByNameAlone.count], [true, 0]);
  sheetOf.children = [instanceNode("B:c1", "label=Save", [0, 0, 50, 20], { main: set.children[0], properties: propertiesOf("DSButton", { "label#1:3": "Save" }) })];
  same("the same case with the label changed clears it by the instance, and not by name", [unitsNamed((await propertyScan(opened)).propertyNotDrawn).includes("DSButton.label"), (await propertyScan(opened)).propertyClearedByNameAlone.count], [false, 0]);
  sheetOf.children = [instanceNode("B:c1", "withStartIcon=true, startIcon=HOME", [0, 0, 50, 20], { main: set.children[0], properties: propertiesOf("DSButton", { "withStartIcon#1:1": true }) })];
  const swapped = await propertyScan(opened);
  same("a case naming a swap clears it where the instance holds its `with` flag on", [unitsNamed(swapped.propertyNotDrawn).includes("DSButton.startIcon"), unitsNamed(swapped.propertyNotDrawn).includes("DSButton.withStartIcon")], [false, false]);
  sheetOf.children = [instanceNode("B:c1", "withStartIcon=true, startIcon=HOME", [0, 0, 50, 20], { main: set.children[0], properties: propertiesOf("DSButton", {}) })];
  const flagOff = await propertyScan(opened);
  same("a case naming a swap and its flag, whose instance holds both at their defaults, clears neither", [unitsNamed(flagOff.propertyNotDrawn).includes("DSButton.startIcon"), unitsNamed(flagOff.propertyNotDrawn).includes("DSButton.withStartIcon")], [true, true]);
  const byName = unitSection("B", "DSButton", [100, 100], { definitions: iconDefinitions, caseNames: ["label=Save", "withHeading=false"] });
  const named = await scanSections([byName]);
  same("a case drawn with no instance of the unit clears by its name, and the answer counts and names those properties without blocking",
    [unitsNamed(named.findings.propertyClearedByNameAlone), named.findings.propertyClearedByNameAlone.count, named.notBlocking.includes("propertyClearedByNameAlone"), named.findings.propertyNotDrawn.count],
    [["DSButton.label", "DSButton.withHeading"], 2, true, 2]);
});
await guard(async () => {
  const flat = await scanOf([componentSet("F:set", "DSButton", [0, 0, 300, 200], grid("F", tidy), { definitions: iconDefinitions }), buttonHeader()]);
  const sections = await scanSections([unitSection("B", "DSButton", [100, 100])]);
  same("a flat page's answer says the property checks were skipped, and a page in sections says they ran",
    [flat.propertyChecks.startsWith("skipped"), flat.propertyChecks.includes("flat"), sections.propertyChecks], [true, true, "run"]);
});
await guard(async () => {
  const { unit, button, link } = twoUnits();
  link.children[0].children = [instanceNode("B:in", "button in a link", [0, 0, 10, 10], { main: button.children[0], properties: propertiesOf("DSButton", { "withStartIcon#1:1": true }) })];
  link.children[0].children[0].parent = link.children[0];
  const found = await propertyScan(unit);
  same("an instance that stands inside another unit's set does not count as drawing", unitsNamed(found.propertyNotDrawn).includes("DSButton.withStartIcon"), true);
  const outside = twoUnits();
  outside.unit.children.push(instanceNode("B:out", "usage · DSButton elsewhere", [500, 1000, 100, 20], { main: outside.button.children[0], properties: propertiesOf("DSButton", { "withStartIcon#1:1": true }) }));
  same("the same instance standing outside every unit's set does", unitsNamed((await propertyScan(outside.unit)).propertyNotDrawn).includes("DSButton.withStartIcon"), false);
});

await guard(async () => {
  // a text inside a sheet that is named as a label is the sheet's own label, not one of its cases (every part that walks a sheet knows the prefix)
  const labelled = unitSection("B", "DSButton", [100, 100]);
  labelled.children.find((child) => child.id === "B:sheet").children.push(text("B:in", "label · DSButton cases — rows: case=text", "DSButton cases — rows: case=text", [0, 0, 100, 20]));
  const scan = await scanSections([labelled]);
  same("a label inside a sheet is no case: no bad name, no empty case, no duplicate", [scan.findings.badCaseNames.count, scan.findings.emptyCases.count, scan.findings.duplicateCaseNames.count], [0, 0, 0]);
});

console.log("\n=== page.js — a set crossed beyond the rule");
{
  const crossing = async (names, definitions = {}) => {
    const versions = names.map((name, at) => version(`X:${at}`, name, 20, at * 60));
    return (await scanOf([componentSet("X:set", "DSThing", [0, 0, 300, 600], versions, { definitions }), buttonHeader()]));
  };
  await guard(async () => {
    const scan = await crossing(["size=SM, tone=a", "size=SM, tone=b", "size=SM, tone=c", "size=MD, tone=a", "size=MD, tone=b", "size=MD, tone=c"]);
    same("a property outside the rule that has a value other than the default held by two versions is named, with the values that multiply it, and blocks",
      [scan.findings.crossedBeyondTheRule.items.map((item) => [item.set, item.setName, item.property, item.default, item.multiplying]), scan.notBlocking.includes("crossedBeyondTheRule"), scan.clean],
      [[["X:set", "DSThing", "tone", "a", ["b x2", "c x2"]]], false, false]);
  });
  await guard(async () => {
    const drawnOnce = await crossing(["size=SM, tone=a", "size=SM, tone=b", "size=MD, tone=a", "size=MD, tone=c"]);
    same("a property whose every other value is held by one version is drawn once and passes", drawnOnce.findings.crossedBeyondTheRule.count, 0);
    const allowed = await crossing(["size=SM, variant=A, state=rest", "size=SM, variant=A, state=hover", "size=MD, variant=A, state=rest", "size=MD, variant=A, state=hover", "size=SM, variant=B, state=rest", "size=SM, variant=B, state=hover"]);
    same("size, the shared variant and a state cross as they like", allowed.findings.crossedBeyondTheRule.count, 0);
    const named = await crossing(["tone=a", "tone=b", "tone=b"], { tone: { type: "VARIANT", defaultValue: "b", variantOptions: ["a", "b"] } });
    same("the default is the set's own: the value that is the default is not counted, wherever it sits", named.findings.crossedBeyondTheRule.count, 0);
  });
  await guard(async () => {
    const names = ["size=SM, orientation=H", "size=SM, orientation=V", "size=SM, orientation=D", "size=MD, orientation=H", "size=MD, orientation=V", "size=MD, orientation=D"];
    const partOf = async (versionNames) => (await runFile("scan-sets.js", { pageId: "2:1" }, file([page("2:1", "Actions", [componentSet("X:set", "DSThing", [0, 0, 300, 600], versionNames.map((name, at) => version(`X:${at}`, name, 20, at * 60))), buttonHeader()])]))).scan;
    const excused = await partOf(names);
    same("a property of the list of known exceptions is not named, and the set that passes only by it is counted", [excused.findings.crossedBeyondTheRule.count, excused.passedByException], [0, 1]);
    const caught = await partOf(["size=SM, tone=a", "size=SM, tone=b", "size=SM, tone=c"]);
    same("a set that is named is not counted as passed by exception, and a clean set counts none", [caught.passedByException, (await partOf(["size=SM", "size=MD"])).passedByException], [0, 0]);
    const book = await partOf(["size=SM, bordered=false", "size=SM, bordered=true", "size=SM, bordered=maybe", "size=MD, bordered=false", "size=MD, bordered=true", "size=MD, bordered=maybe"].map((name) => name.replace("bordered", "caller")));
    same("a caller's choice that is in neither list is named", book.findings.crossedBeyondTheRule.items.map((item) => item.property), ["caller"]);
  });
}

// ---- the texts ----------------------------------------------------------------------------------

console.log("\n=== the texts the agent passes on");
const PASSED_ON = ["page.js", ...SCAN_PARTS, "layout.js"];
for (const script of PASSED_ON) {
  const body = readFileSync(resolve(SCRIPTS, script), "utf8");
  ok(`${script} holds one INPUTS block and no console.log, no spnutils`, (body.match(/const INPUTS = \{/g) ?? []).length === 1 && INPUTS_BLOCK.test(body) && !body.includes("console.log") && !body.toLowerCase().includes("spnutils"));
}
// A part that reads an input its INPUTS block does not hold reads `undefined`, and a check built on it quietly finds nothing.
for (const script of PASSED_ON) {
  const body = readFileSync(resolve(SCRIPTS, script), "utf8");
  const block = INPUTS_BLOCK.exec(body)[0];
  const missing = [...new Set([...body.matchAll(/INPUTS\.(\w+)/g)].map((one) => one[1]))].filter((name) => !new RegExp(`\\n  ${name}:`).test(block));
  same(`${script} holds, in its INPUTS block, every input it reads`, missing, []);
}
{
  const between = (name, from, to) => { const body = readFileSync(resolve(SCRIPTS, name), "utf8"); return body.slice(body.indexOf(from), body.indexOf(to)); };
  const labelForm = (name) => between(name, "// ---- the book's label form: begin", "// ---- the book's label form: end");
  ok("the book's label form is one block, the same in page.js, layout.js and the parts that read labels",
    labelForm("page.js").length > 500 && ["layout.js", "scan-labels.js", "scan-placement.js", "scan-properties.js"].every((name) => labelForm(name) === labelForm("page.js")));
  const reading = (name) => between(name, "// ---- the page's reading: begin", "// ---- the page's reading: end");
  ok("the page's reading is one block, the same in page.js and the three parts that read the page's nodes",
    reading("page.js").length > 5000 && ["scan-labels.js", "scan-placement.js", "scan-properties.js"].every((name) => reading(name) === reading("page.js")));
  const bounds = (name) => between(name, "// ---- the answer's bounds: begin", "// ---- the answer's bounds: end");
  ok("the answer's bounds are one block, the same in every part of the scan", bounds(SCAN_PARTS[0]).length > 1500 && SCAN_PARTS.every((name) => bounds(name) === bounds(SCAN_PARTS[0])));
}
// The connector refuses a call over 50,000 characters, and a script an agent writes out is stopped or cut off when it is near
// that. Each script is sent whole, so each stays well under half the limit once its comments are taken out.
const withoutComments = (body) => body.split("\n").map((line) => line.replace(/(^|\s)\/\/ .*$/, "").trimEnd()).filter((line) => line.trim() !== "").join("\n");
for (const script of ["page.js", ...SCAN_PARTS]) {
  const body = readFileSync(resolve(SCRIPTS, script), "utf8");
  ok(`${script} is under 50,000 characters (${body.length}) and under 21,000 without its comments (${withoutComments(body).length})`, body.length < 50000 && withoutComments(body).length < 21000);
}
await guard(async () => {
  // the parts together hold every finding the whole scan held, each in one part, under the same name
  const held = [];
  for (const part of SCAN_PARTS) held.push(...Object.keys((await runFile(part, { pageId: "2:1" }, sectioned([]))).scan.findings));
  same("every finding of the whole scan is held by exactly one part", [...held].sort(), [...FINDING_ORDER].sort());
});
ok("layout.js is dry by default", /const INPUTS = \{[^}]*dryRun: true/.test(readFileSync(resolve(SCRIPTS, "layout.js"), "utf8")));

console.log(failed ? `\n  ${failed} of ${total} FAILED — figma scripts` : `\n  all ${total} passed — figma scripts`);
process.exit(failed ? 1 : 0);
