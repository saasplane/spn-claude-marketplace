// The layout of one set: its versions placed in the set's table that its section's plugin data states.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else.
//
// It changes only the set, its versions, and the nodes named in `mayMove` that share the set's parent. DRY IS THE
// DEFAULT: with `dryRun: true` it changes nothing and returns what would move. Set `dryRun: false`
// only after a dry run came back with `mode: "dry"` and a plan the developer's order allows.
//
// The home. A set stands in its unit's section, and its layout is that section's shared plugin data (namespace
// `saasplane`, key `layout`), as the drawing page's part "The layout, kept as plugin data" states. A script reads the
// layout there and never from a label's text, so a header that still carries layout clauses lays nothing out. A set
// whose section holds no layout is reported, not laid out, and so is a set on a page with no section.
//
// The set's table is the layout's table captioned `the set`. Its row groups stand one under the other and its column
// groups side by side, each group a prop and its values, the default first: a version takes the row of the row group
// whose prop it moves from the default, and the column of the column group whose prop it moves, every other prop at
// the default. So the version at the default of every prop stands in the first row and the first column. The mode
// tables are instances, never versions, and this script leaves them. A version the table holds no cell for lays out
// nothing: it returns `mode: "refused"` with the reason.
//
// Each column is as wide as the wider of its label and its widest version, as the plugin lays it out: a column's
// label is the text named `label · ` and the value, with ` (default)` after the default, in the section's frame
// `table · the set`. The versions stand at their column's left edge, centred in their row, `padding` from the set's
// edge and `gap` apart (16 and 16, the plugin's own).
//
// `ignore` is a list of node ids of the home that the check of nodes that meet leaves out: a pair is left out
// when EITHER of its two nodes is ignored. It is for the set's old row and column labels, which `labels.js`
// removes and writes again right after the layout, so what they meet does not stop it. The answer's
// `ignored` counts the ignored nodes the home holds; with `ignore` empty nothing is left out.
//
// Before anything moves it checks the plan: no version outside the set, no two versions meeting,
// no two nodes of the home meeting, and the version at the top left carrying `defaults` (every
// property of the set, as the stack gives them). A failed check moves nothing. The answer holds the
// default version before and after, the set's box before and after, and the counts.
//
// Boxes are [x, y, width, height]. A version's box is inside its set.

const INPUTS = {
  setId: "",
  dryRun: true,
  defaults: {},
  padding: 16,
  gap: 16,
  resize: true,
  mayMove: [],
  ignore: [],
  clearance: 100,
  listMoves: 50,
};

// ---- the book's label form: begin (this block is the same in page.js and layout.js)
const LABEL_PREFIX = "label · ";
const HEADER_PREFIX = "header · ";
const USAGE_PREFIX = "usage · ";
const UNIT_SEPARATOR = " — ";
const BEHAVIOUR_PREFIX = "behaviour: ";
const LAYOUT_NAMESPACE = "saasplane";
const LAYOUT_KEY = "layout";
const LAYOUT_SHAPES = ["set", "one component", "no set of versions, shown as cases"];
const OLD_LAYOUT_CLAUSE = /(^|· )(rows: |columns: |one row$|one row ·|one column$|one column ·|one component)/;
const MARK_TEXT = /^(.*?)\s*\(default(?: at the top)?\)$/;
const MARK_SPLIT = /, | · |=/;
const UNIT_LIKE = /^\.?[A-Z][A-Za-z0-9.]*[a-z][A-Za-z0-9.]*( cases)?$/;

// A header, in the book's form: the unit's name; on the line under it, what the unit is in one line; then
// `behaviour: ` and the props that change only how the unit behaves. A header holds no layout: a header that still
// carries the old layout clauses (`<unit> — <line> · rows: …`) is reported, and nothing is read from them. A Core
// file's header reads `<group> — <line>`, with no layout. Returns { unit, line, behaviour, error }.
function parseHeader(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length === 0) return { unit: null, line: null, behaviour: [], error: "the header is empty" };
  const cut = lines[0].indexOf(UNIT_SEPARATOR);
  const unit = cut > 0 ? lines[0].slice(0, cut) : lines[0];
  const rest = cut > 0 ? [lines[0].slice(cut + UNIT_SEPARATOR.length), ...lines.slice(1)] : lines.slice(1);
  if (rest.some((line) => OLD_LAYOUT_CLAUSE.test(line))) {
    return { unit, line: null, behaviour: [], error: "the header states a layout: a header holds the unit's name, its one line and its `behaviour:` note, and the layout is the section's plugin data" };
  }
  const note = rest.find((line) => line.startsWith(BEHAVIOUR_PREFIX));
  const behaviour = note ? note.slice(BEHAVIOUR_PREFIX.length).split(", ").map((name) => name.trim()).filter((name) => name.length > 0) : [];
  return { unit, line: rest.find((line) => !line.startsWith(BEHAVIOUR_PREFIX)) ?? null, behaviour, error: null };
}

// The layout a unit's section keeps as shared plugin data (`saasplane`, `layout`): { shape, tables, default, cases,
// behaviour }, each table a `caption`, `rowGroups` and `columnGroups`, each group a `prop` and its `values` in the
// order they run, the default first. A script reads the layout here and never from a label's text. Returns
// { layout, error }, where a section that holds none answers `layout: null` and says so.
function layoutOf(section) {
  let data = null;
  try { data = JSON.parse(section.getSharedPluginData(LAYOUT_NAMESPACE, LAYOUT_KEY) || "null"); } catch { return { layout: null, error: "the section's layout is not JSON" }; }
  if (data === null) return { layout: null, error: "the section holds no layout" };
  if (typeof data !== "object" || !LAYOUT_SHAPES.includes(data.shape)) return { layout: null, error: `the layout's shape is none of ${LAYOUT_SHAPES.join(", ")}` };
  const tables = Array.isArray(data.tables) ? data.tables : [null];
  const bad = (group) => typeof group?.prop !== "string" || !Array.isArray(group.values) || group.values.length === 0;
  if (tables.some((table) => typeof table?.caption !== "string" || !Array.isArray(table.rowGroups) || !Array.isArray(table.columnGroups) || [...table.rowGroups, ...table.columnGroups].some(bad))) {
    return { layout: null, error: "a table of the layout lacks its caption, a group, or a group's prop or values" };
  }
  return { layout: { shape: data.shape, tables, default: data.default ?? {}, cases: data.cases ?? [], behaviour: data.behaviour ?? [] }, error: null };
}

// The set's table of a layout: the first table, captioned `the set`. Its cells are versions; a mode table's are instances.
function setTableOf(layout) {
  return layout.tables.find((table) => table.caption === "the set") ?? null;
}

// The values a label marks as the default: each is the candidates for the value before the mark, the whole
// piece and its last word (an older label wrote `size SM (default)`). Never the word before the value.
function defaultMarksOf(text) {
  const marks = [];
  for (const piece of text.split(MARK_SPLIT)) {
    const found = MARK_TEXT.exec(piece.trim());
    if (!found || found[1].trim().length === 0) continue;
    const value = found[1].trim();
    marks.push({ value, candidates: [value, value.split(" ").pop()] });
  }
  return marks;
}
// ---- the book's label form: end

const boxOf = (node) => [node.x, node.y, node.width, node.height];
const meets = (first, second) =>
  first[0] < second[0] + second[2] && second[0] < first[0] + first[2] &&
  first[1] < second[1] + second[3] && second[1] < first[1] + first[3];

function pairsThatMeet(entries) {
  const sorted = [...entries].sort((first, second) => first.box[0] - second.box[0]);
  const pairs = [];
  for (let at = 0; at < sorted.length; at += 1) {
    const right = sorted[at].box[0] + sorted[at].box[2];
    for (let next = at + 1; next < sorted.length && sorted[next].box[0] < right; next += 1) {
      if (meets(sorted[at].box, sorted[next].box)) pairs.push([sorted[at].id, sorted[next].id]);
    }
  }
  return pairs;
}

function parseVersionName(name) {
  const values = {};
  for (const part of name.split(", ")) {
    const cut = part.indexOf("=");
    if (cut > 0) values[part.slice(0, cut)] = part.slice(cut + 1);
  }
  return values;
}

function topLeftOf(versions) {
  let topLeft = null;
  for (const version of versions) {
    if (topLeft === null || version.y < topLeft.y || (version.y === topLeft.y && version.x < topLeft.x)) topLeft = version;
  }
  return topLeft;
}

function defaultVersionName(set) {
  try { return set.defaultVariant?.name ?? null; } catch { return null; }
}

function refusal(reasons, extra = {}) {
  return { mode: "refused", dryRun: INPUTS.dryRun, refused: reasons, ...extra };
}

const set = await figma.getNodeByIdAsync(INPUTS.setId);
if (!set || set.type !== "COMPONENT_SET") return refusal([`${INPUTS.setId} is not a set`]);
let page = set.parent;
while (page && page.type !== "PAGE") page = page.parent;
if (!page) return refusal([`the set ${set.id} has no page`]);
await figma.setCurrentPageAsync(page);

const setBoxBefore = boxOf(set);
const defaultBefore = defaultVersionName(set);
const versions = set.children.filter((child) => child.type === "COMPONENT");
const home = set.parent.type === "SECTION" ? set.parent : page;
const identity = { set: { id: set.id, name: set.name }, page: { id: page.id, name: page.name }, home: { id: home.id, name: home.name, type: home.type }, defaultBefore, setBoxBefore };

if (versions.length === 0) return refusal([`the set ${set.id} holds no version`], identity);

// 1. The layout, read from the section's plugin data.
if (home.type !== "SECTION") return refusal([`the set ${set.id} stands in no section, so no layout is kept for it: it is reported, not laid out`], identity);
const kept = layoutOf(home);
if (kept.layout === null) return refusal([`${kept.error}: a set whose section holds no layout is reported, not laid out`], identity);
if (kept.layout.shape !== "set") return refusal([`the layout's shape is \`${kept.layout.shape}\`, and a set is laid out only from the shape \`set\``], identity);
const table = setTableOf(kept.layout);
if (table === null) return refusal(["the layout holds no table captioned `the set`"], identity);
const understood = { rows: table.rowGroups, columns: table.columnGroups, default: kept.layout.default };

// 2. Every version into its cell.
const reasons = [];
const properties = versions.length > 0 ? Object.keys(parseVersionName(versions[0].name)) : [];
const grouped = [...table.rowGroups, ...table.columnGroups].map((group) => group.prop);
for (const prop of grouped) {
  if (!properties.includes(prop)) reasons.push(`the layout's set table names ${prop}, which the set does not have`);
}
for (const property of Object.keys(INPUTS.defaults)) {
  if (!properties.includes(property)) reasons.push(`defaults names ${property}, which the set does not have`);
}
for (const property of properties) {
  if (!(property in INPUTS.defaults)) reasons.push(`no default is given for ${property}`);
  // The stack decides the default: a layout that names another is corrected first, never followed.
  else if (property in kept.layout.default && kept.layout.default[property] !== INPUTS.defaults[property]) {
    reasons.push(`the layout names ${property}=${kept.layout.default[property]} as the default and the stack ${property}=${INPUTS.defaults[property]}: correct the layout first`);
  }
}
if (INPUTS.padding === null || INPUTS.gap === null) reasons.push("padding and gap are not given");
if (reasons.length > 0) return refusal(reasons, { ...identity, understood });

// A line of a side: each group's values in order, the line naming the one prop it moves from the default.
const linesOf = (groups) => groups.length === 0 ? [{ prop: null, value: null }]
  : groups.flatMap((group) => group.values.map((value) => ({ prop: group.prop, value })));
const rowLines = linesOf(table.rowGroups);
const columnLines = linesOf(table.columnGroups);
// The line a version takes: the first whose prop it holds at that value, every other prop of the side's groups at
// the default; a version at the default of all of them takes the line of the default, which the first group holds.
function lineOf(values, lines, groups) {
  const atDefault = (prop) => values[prop] === INPUTS.defaults[prop];
  for (let at = 0; at < lines.length; at += 1) {
    const line = lines[at];
    if (line.prop === null) return at;
    if (values[line.prop] !== line.value) continue;
    if (groups.every((group) => group.prop === line.prop || atDefault(group.prop))) return at;
  }
  return -1;
}
const cells = new Map();
for (const version of versions) {
  const values = parseVersionName(version.name);
  const ungrouped = properties.filter((property) => !grouped.includes(property) && values[property] !== INPUTS.defaults[property]);
  const row = lineOf(values, rowLines, table.rowGroups);
  const column = lineOf(values, columnLines, table.columnGroups);
  if (row < 0 || column < 0 || ungrouped.length > 0) {
    reasons.push(`version ${version.id} (${version.name}) holds a value the layout's set table has no cell for`);
    continue;
  }
  const cell = `${row}:${column}`;
  if (cells.has(cell)) reasons.push(`versions ${cells.get(cell).id} and ${version.id} take the same cell of the layout's set table`);
  else cells.set(cell, version);
}
if (reasons.length > 0) return refusal(reasons, { ...identity, understood });

// A column's label, measured where the plugin wrote it: the text `label · <value>` in the frame `table · the set`.
const labelFrame = home.children.find((node) => node.name === "table · the set" && "findAll" in node) ?? null;
function labelWidthOf(line) {
  if (labelFrame === null || line.prop === null) return 0;
  const words = line.value + (INPUTS.defaults[line.prop] === line.value ? " (default)" : "");
  const found = labelFrame.findAll((node) => node.type === "TEXT" && node.name === LABEL_PREFIX + words);
  return found.reduce((widest, node) => Math.max(widest, node.width), 0);
}

// 3. The plan: rows and columns that hold no version take no room.
const usedRows = [...new Set([...cells.keys()].map((cell) => Number(cell.split(":")[0])))].sort((first, second) => first - second);
const usedColumns = [...new Set([...cells.keys()].map((cell) => Number(cell.split(":")[1])))].sort((first, second) => first - second);
const columnWidth = new Map(usedColumns.map((column) => [column, 0]));
const rowHeight = new Map(usedRows.map((row) => [row, 0]));
for (const column of usedColumns) columnWidth.set(column, labelWidthOf(columnLines[column]));
for (const [cell, version] of cells) {
  const [row, column] = cell.split(":").map(Number);
  columnWidth.set(column, Math.max(columnWidth.get(column), version.width));
  rowHeight.set(row, Math.max(rowHeight.get(row), version.height));
}
const columnX = new Map();
let cursor = INPUTS.padding;
for (const column of usedColumns) { columnX.set(column, cursor); cursor += columnWidth.get(column) + INPUTS.gap; }
const plannedWidth = cursor - INPUTS.gap + INPUTS.padding;
const rowY = new Map();
cursor = INPUTS.padding;
for (const row of usedRows) { rowY.set(row, cursor); cursor += rowHeight.get(row) + INPUTS.gap; }
const plannedHeight = cursor - INPUTS.gap + INPUTS.padding;

const plannedSet = INPUTS.resize ? [set.x, set.y, plannedWidth, plannedHeight] : setBoxBefore;
const placements = [];
for (const [cell, version] of cells) {
  const [row, column] = cell.split(":").map(Number);
  placements.push({ version, box: [columnX.get(column), rowY.get(row) + (rowHeight.get(row) - version.height) / 2, version.width, version.height] });
}

// A node of the home that may move, and that would meet the planned set, goes to its right.
const topLevel = home.children.filter((node) => node.id !== set.id)
  .map((node) => ({ node, id: node.id, box: boxOf(node) }));
const nodeMoves = [];
for (const entry of topLevel) {
  if (INPUTS.mayMove.includes(entry.id) && meets(entry.box, plannedSet)) {
    entry.box = [plannedSet[0] + plannedSet[2] + INPUTS.clearance, entry.box[1], entry.box[2], entry.box[3]];
    nodeMoves.push(entry);
  }
}

// 4. The checks, on the plan.
const outside = placements.filter((placement) =>
  placement.box[0] < 0 || placement.box[1] < 0 ||
  placement.box[0] + placement.box[2] > plannedSet[2] || placement.box[1] + placement.box[3] > plannedSet[3])
  .map((placement) => placement.version.id);
const versionPairs = pairsThatMeet(placements.map((placement) => ({ id: placement.version.id, box: placement.box })));
// A pair with an ignored node in it is left out: that node is about to be removed, so what it meets does not matter.
// The frame of the set's labels encloses the set by design, as the plugin draws it, so it is never a node that meets it.
const isIgnored = (id) => INPUTS.ignore.includes(id) || (labelFrame !== null && id === labelFrame.id);
const withoutIgnored = (pairs) => pairs.filter(([first, second]) => !isIgnored(first) && !isIgnored(second));
const topLevelPairs = withoutIgnored(pairsThatMeet([...topLevel.map((entry) => ({ id: entry.id, box: entry.box })), { id: set.id, box: plannedSet }]));
const plannedTopLeft = topLeftOf(placements.map((placement) => ({ name: placement.version.name, x: placement.box[0], y: placement.box[1] })));
const plannedValues = parseVersionName(plannedTopLeft.name);
const wrongDefaults = Object.keys(INPUTS.defaults).filter((property) => plannedValues[property] !== INPUTS.defaults[property])
  .map((property) => ({ property, given: INPUTS.defaults[property], topLeft: plannedValues[property] }));

const checks = {
  versionsOutside: outside.length,
  versionPairsMeeting: versionPairs.length,
  topLevelPairsMeeting: topLevelPairs.length,
  topLeftCarriesDefaults: wrongDefaults.length === 0,
};
const failed = [];
if (outside.length > 0) failed.push(`${outside.length} version(s) would be outside the set: ${outside.slice(0, 5).join(", ")}`);
if (versionPairs.length > 0) failed.push(`${versionPairs.length} pair(s) of versions would meet: ${JSON.stringify(versionPairs.slice(0, 5))}`);
if (topLevelPairs.length > 0) failed.push(`${topLevelPairs.length} pair(s) of nodes in ${home.type === "PAGE" ? "the page" : "the section"} would meet: ${JSON.stringify(topLevelPairs.slice(0, 5))}`);
if (wrongDefaults.length > 0) failed.push(`the top-left version ${plannedTopLeft.name} does not carry the given defaults: ${JSON.stringify(wrongDefaults)}`);

const moves = placements.filter((placement) => placement.version.x !== placement.box[0] || placement.version.y !== placement.box[1]);
const summary = {
  ...identity,
  layoutFrom: { section: home.id },
  understood,
  setBoxPlanned: plannedSet,
  defaultPlanned: plannedTopLeft.name,
  ignored: topLevel.filter((entry) => isIgnored(entry.id)).length,
  counts: { versions: versions.length, versionsToMove: moves.length, nodesToMove: nodeMoves.length },
  moves: moves.slice(0, INPUTS.listMoves).map((placement) => [placement.version.id, placement.box[0], placement.box[1]]),
  nodeMoves: nodeMoves.map((entry) => [entry.id, entry.box[0], entry.box[1]]),
  checks,
};
if (failed.length > 0) return { ...summary, mode: "refused", dryRun: INPUTS.dryRun, refused: failed };
if (INPUTS.dryRun) return { ...summary, mode: "dry", refused: null, defaultAfter: plannedTopLeft.name };

// 5. The move, then the same checks on what is really there.
if (INPUTS.resize) set.resize(plannedSet[2], plannedSet[3]);
for (const placement of placements) {
  placement.version.x = placement.box[0];
  placement.version.y = placement.box[1];
}
for (const entry of nodeMoves) {
  entry.node.x = entry.box[0];
  entry.node.y = entry.box[1];
}
const after = set.children.filter((child) => child.type === "COMPONENT");
const outsideAfter = after.filter((version) =>
  version.x < 0 || version.y < 0 || version.x + version.width > set.width || version.y + version.height > set.height).length;
const versionPairsAfter = pairsThatMeet(after.map((version) => ({ id: version.id, box: boxOf(version) }))).length;
const topLevelPairsAfter = withoutIgnored(pairsThatMeet(home.children.map((node) => ({ id: node.id, box: boxOf(node) })))).length;
return {
  ...summary,
  mode: "applied",
  refused: null,
  defaultAfter: defaultVersionName(set),
  setBoxAfter: boxOf(set),
  verified: { versionsOutside: outsideAfter, versionPairsMeeting: versionPairsAfter, topLevelPairsMeeting: topLevelPairsAfter },
};
