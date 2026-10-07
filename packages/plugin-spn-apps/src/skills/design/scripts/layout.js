// The layout of one set: its versions placed in the grid its own label states.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else.
//
// It changes only the set, its versions, and the nodes named in `mayMove` that share the set's parent. DRY IS THE
// DEFAULT: with `dryRun: true` it changes nothing and returns what would move. Set `dryRun: false`
// only after a dry run came back with `mode: "dry"` and a plan the developer's order allows.
//
// The home. A set stands in a section, or on the page itself in the old form. Its home is that section or that
// page: the header and the labels are found among the home's own children, and the set is checked against the
// other children of the home, in the home's coordinates, which are the set's own.
//
// The label. The set's header label is the text in the home whose text begins with the set's name and ` — `
// (its layer is named `header · ` and the unit's name, or `label · ` and the text in the old form; a header
// whose layer name is neither is still the header). After that, clauses are separated by ` · `, in the book's form:
//
//   rows: variant=SOLID, OUTLINE x size=MD, XS, SM       the first factor runs slowest; ` x ` joins factors
//   columns: case=text, block, new tab, disabled         a bare value takes the property before it
//   one row   |   one column                             a single line on that side (an axis left out is one too)
//   one component                                        a unit with no grid: a set is refused
//
// A cell is `property=value`, and ` (default)` after a value marks the default. A note may stand before or
// after the layout. A label the form cannot say lays out nothing: it returns `mode: "refused"` with the
// reason. This script lays out an axis only when every cell of one factor names one property.
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
  padding: null,
  gap: null,
  resize: true,
  mayMove: [],
  clearance: 100,
  listMoves: 50,
};

// ---- the book's label form: begin (this block is the same in page.js and layout.js)
const LABEL_PREFIX = "label · ";
const HEADER_PREFIX = "header · ";
const SAMPLE_PREFIX = "sample · ";
const UNIT_SEPARATOR = " — ";
const CLAUSE_SEPARATOR = " · ";
const FACTOR_SEPARATOR = " x ";
const DEFAULT_MARK = /\s+\(default\)$/;
const MARK_TEXT = /^(.*?)\s*\(default(?: at the top)?\)$/;
const MARK_SPLIT = /, | · | x |=|: |each with /;
const UNIT_LIKE = /^\.?[A-Z][A-Za-z0-9.]*[a-z][A-Za-z0-9.]*( cases)?$/;

// An axis is factors joined by ` x `; a factor is cells joined by `, `; a cell is `property=value` or only
// `value`, taking the property of the cell before it; ` (default)` after a value marks the default.
function parseAxis(text) {
  const factors = [];
  for (const piece of text.split(FACTOR_SEPARATOR)) {
    const cells = [];
    let property = null;
    for (const raw of piece.split(", ")) {
      const cut = raw.indexOf("=");
      if (cut > 0) property = raw.slice(0, cut).trim();
      const marked = DEFAULT_MARK.test(cut > 0 ? raw.slice(cut + 1) : raw);
      const value = (cut > 0 ? raw.slice(cut + 1) : raw).replace(DEFAULT_MARK, "").trim();
      if (property === null) return { error: `the cell "${raw.trim()}" names no property, and no cell stands before it` };
      if (value.length === 0) return { error: `the cell "${raw.trim()}" holds no value` };
      cells.push({ property, value, isDefault: marked });
    }
    factors.push({ cells });
  }
  return { factors };
}

// A header: the unit, ` — `, then clauses joined by ` · `. A clause is `rows: <axis>`, `columns: <axis>`,
// `one row`, `one column`, `one component` (a comma may follow it), or a note. Returns { unit, layout, error }
// where layout is { rows, columns, oneComponent } (an axis left out is [], one line) or null.
function parseHeader(text) {
  const cut = text.indexOf(UNIT_SEPARATOR);
  if (cut <= 0) return { unit: null, layout: null, error: "the text holds no unit before ' — '" };
  const unit = text.slice(0, cut);
  let rows = null;
  let columns = null;
  let oneComponent = false;
  let stated = 0;
  for (const clause of text.slice(cut + UNIT_SEPARATOR.length).split(CLAUSE_SEPARATOR).map((part) => part.trim())) {
    if (clause === "one row" || clause === "one column") {
      const side = clause === "one row" ? "rows" : "columns";
      if ((side === "rows" ? rows : columns) !== null) return { unit, layout: null, error: `the label states the ${side} twice` };
      if (side === "rows") rows = []; else columns = [];
    } else if (clause === "one component" || clause.startsWith("one component,")) {
      oneComponent = true;
    } else if (clause.startsWith("rows: ") || clause.startsWith("columns: ")) {
      const side = clause.startsWith("rows: ") ? "rows" : "columns";
      if ((side === "rows" ? rows : columns) !== null) return { unit, layout: null, error: `the label states the ${side} twice` };
      const axis = parseAxis(clause.slice(side.length + 2));
      if (axis.error) return { unit, layout: null, error: `the ${side} clause: ${axis.error}` };
      if (side === "rows") rows = axis.factors; else columns = axis.factors;
    } else {
      continue;
    }
    stated += 1;
  }
  if (stated === 0) return { unit, layout: null, error: "the label states no layout (rows, columns, one row, one column or one component)" };
  if (oneComponent && (rows !== null || columns !== null)) return { unit, layout: null, error: "the label says one component and also states rows or columns" };
  return { unit, layout: { rows: rows ?? [], columns: columns ?? [], oneComponent }, error: null };
}

// The values a text marks as the default: each is the candidates for the value before the mark, the whole
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

// The label's layout as lists of factors, each { property, values }, or { error }.
function parseLabel(text) {
  const parsed = parseHeader(text);
  if (parsed.error) return { error: parsed.error };
  if (parsed.layout.oneComponent) return { error: "the label says one component, and a set is not one component" };
  const factorsOf = (side, factors) => {
    const lists = [];
    for (const factor of factors) {
      const properties = [...new Set(factor.cells.map((cell) => cell.property))];
      if (properties.length !== 1) return { error: `the ${side} clause has cells of ${properties.join(" and ")} in one run, which this script does not lay out` };
      lists.push({ property: properties[0], values: factor.cells.map((cell) => cell.value) });
    }
    return { lists };
  };
  const rows = factorsOf("rows", parsed.layout.rows);
  if (rows.error) return rows;
  const columns = factorsOf("columns", parsed.layout.columns);
  if (columns.error) return columns;
  return { rows: rows.lists, columns: columns.lists };
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

// 1. The label, and what it says.
const labels = home.children.filter((node) =>
  node.type === "TEXT" && !node.name.startsWith(SAMPLE_PREFIX) && node.characters.startsWith(set.name + UNIT_SEPARATOR));
if (labels.length !== 1) {
  return refusal([labels.length === 0
    ? `no label in ${home.type === "PAGE" ? "this page" : `the section ${home.name}`} names ${set.name}: a set whose label states no layout is reported, not laid out`
    : `${labels.length} labels name ${set.name}`], identity);
}
const label = labels[0];
const parsed = parseLabel(label.characters);
if (parsed.error) return refusal([`the label cannot be laid out: ${parsed.error}`], { ...identity, label: { id: label.id, text: label.characters } });

// 2. Every version into its cell.
const understood = { rows: parsed.rows, columns: parsed.columns };
const reasons = [];
const stated = [...parsed.rows, ...parsed.columns];
const properties = versions.length > 0 ? Object.keys(parseVersionName(versions[0].name)) : [];
for (const property of properties) {
  const count = stated.filter((factor) => factor.property === property).length;
  if (count !== 1) reasons.push(`the label names ${property} ${count} times; it must name it once`);
}
for (const factor of stated) {
  if (!properties.includes(factor.property)) reasons.push(`the label names ${factor.property}, which the set does not have`);
}
for (const property of Object.keys(INPUTS.defaults)) {
  if (!properties.includes(property)) reasons.push(`defaults names ${property}, which the set does not have`);
}
for (const property of properties) {
  if (!(property in INPUTS.defaults)) reasons.push(`no default is given for ${property}`);
}
if (INPUTS.padding === null || INPUTS.gap === null) reasons.push("padding and gap are not given");

const keyOf = (values, factors) => factors.map((factor) => values[factor.property]).join("\u0000");
const tuplesOf = (factors) => factors.reduce(
  (tuples, factor) => tuples.flatMap((tuple) => factor.values.map((value) => [...tuple, value])), [[]]);
const rowKeys = tuplesOf(parsed.rows).map((tuple) => tuple.join("\u0000"));
const columnKeys = tuplesOf(parsed.columns).map((tuple) => tuple.join("\u0000"));

const cells = new Map();
for (const version of versions) {
  const values = parseVersionName(version.name);
  const rowKey = keyOf(values, parsed.rows);
  const columnKey = keyOf(values, parsed.columns);
  if (!rowKeys.includes(rowKey) || !columnKeys.includes(columnKey)) {
    reasons.push(`version ${version.id} (${version.name}) holds a value the label does not state`);
    continue;
  }
  const cell = `${rowKeys.indexOf(rowKey)}:${columnKeys.indexOf(columnKey)}`;
  if (cells.has(cell)) reasons.push(`versions ${cells.get(cell).id} and ${version.id} take the same place in the label's grid`);
  else cells.set(cell, version);
}
if (reasons.length > 0) return refusal(reasons, { ...identity, understood });

// 3. The plan: rows and columns that hold no version take no room.
const usedRows = [...new Set([...cells.keys()].map((cell) => Number(cell.split(":")[0])))].sort((first, second) => first - second);
const usedColumns = [...new Set([...cells.keys()].map((cell) => Number(cell.split(":")[1])))].sort((first, second) => first - second);
const columnWidth = new Map(usedColumns.map((column) => [column, 0]));
const rowHeight = new Map(usedRows.map((row) => [row, 0]));
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
  placements.push({ version, box: [columnX.get(column), rowY.get(row), version.width, version.height] });
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
const topLevelPairs = pairsThatMeet([...topLevel.map((entry) => ({ id: entry.id, box: entry.box })), { id: set.id, box: plannedSet }]);
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
  label: { id: label.id, text: label.characters },
  understood,
  setBoxPlanned: plannedSet,
  defaultPlanned: plannedTopLeft.name,
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
const topLevelPairsAfter = pairsThatMeet(home.children.map((node) => ({ id: node.id, box: boxOf(node) }))).length;
return {
  ...summary,
  mode: "applied",
  refused: null,
  defaultAfter: defaultVersionName(set),
  setBoxAfter: boxOf(set),
  verified: { versionsOutside: outsideAfter, versionPairsMeeting: versionPairsAfter, topLevelPairsMeeting: topLevelPairsAfter },
};
