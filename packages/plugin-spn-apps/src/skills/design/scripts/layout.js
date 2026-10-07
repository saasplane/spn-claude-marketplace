// The layout of one set: its versions placed in the grid its own label states.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else.
//
// It changes only the set, its versions, and the top-level nodes named in `mayMove`. DRY IS THE
// DEFAULT: with `dryRun: true` it changes nothing and returns what would move. Set `dryRun: false`
// only after a dry run came back with `mode: "dry"` and a plan the developer's order allows.
//
// The label. The set's header label is the top-level text layer named `label · ...` whose text
// begins with the set's name and ` — `. After that, clauses are separated by ` · `:
//
//   rows: variant=SOLID, OUTLINE x size=MD, XS, SM       the first factor runs slowest
//   columns: case=text, block, new tab, disabled
//   one row   |   one column                             a single line on that side
//
// Each factor is `property=value, value, ...` (or `property (value, value)`), joined by ` x `. Every
// property of the set must be named once, and every version must hold a stated value. A label this
// does not understand lays out nothing: it returns `mode: "refused"` with the reason.
//
// Before anything moves it checks the plan: no version outside the set, no two versions meeting,
// no two top-level nodes meeting, and the version at the top left carrying `defaults` (every
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

const LABEL_PREFIX = "label · ";
const UNIT_SEPARATOR = " — ";
const CLAUSE_SEPARATOR = " · ";
const FACTOR_SEPARATOR = " x ";

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

function stripMark(value) {
  return value.replace(/ \(default\)$/, "").trim();
}

// One factor: `property=a, b, c` or `property (a, b, c)`. Returns null where it is neither.
function parseFactor(text) {
  const equals = /^([^=(,]+)=(.+)$/.exec(text);
  const parens = /^([^=(,]+?)\s*\((.+)\)$/.exec(text);
  const found = equals ?? parens;
  if (!found) return null;
  const values = found[2].split(",").map(stripMark).filter((value) => value.length > 0);
  return values.length > 0 ? { property: found[1].trim(), values } : null;
}

// Returns { rows, columns } as lists of factors, or { error }.
function parseLabel(text, setName) {
  const body = text.slice(setName.length + UNIT_SEPARATOR.length);
  const clauses = body.split(CLAUSE_SEPARATOR).map((clause) => clause.trim());
  let rows = null;
  let columns = null;
  for (const clause of clauses) {
    const side = clause.startsWith("rows:") ? "rows" : clause.startsWith("columns:") ? "columns" : null;
    if (clause === "one row") { rows = []; continue; }
    if (clause === "one column") { columns = []; continue; }
    if (side === null) continue;
    const factors = [];
    for (const piece of clause.slice(side.length + 1).split(FACTOR_SEPARATOR)) {
      const factor = parseFactor(piece.trim());
      if (!factor) return { error: `the ${side} clause has a factor this script cannot read: "${piece.trim()}"` };
      factors.push(factor);
    }
    if (side === "rows") rows = factors; else columns = factors;
  }
  if (rows === null && columns === null) return { error: "the label states neither rows nor columns" };
  return { rows: rows ?? [], columns: columns ?? [] };
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
const identity = { set: { id: set.id, name: set.name }, page: { id: page.id, name: page.name }, defaultBefore, setBoxBefore };

if (versions.length === 0) return refusal([`the set ${set.id} holds no version`], identity);

// 1. The label, and what it says.
const labels = page.children.filter((node) =>
  node.type === "TEXT" && node.name.startsWith(LABEL_PREFIX) && node.characters.startsWith(set.name + UNIT_SEPARATOR));
if (labels.length !== 1) {
  return refusal([labels.length === 0
    ? `no label on this page names ${set.name}: a set whose label states no layout is reported, not laid out`
    : `${labels.length} labels name ${set.name}`], identity);
}
const label = labels[0];
const parsed = parseLabel(label.characters, set.name);
if (parsed.error) return refusal([parsed.error], { ...identity, label: { id: label.id, text: label.characters } });

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

// A top-level node that may move, and that would meet the planned set, goes to its right.
const topLevel = page.children.filter((node) => node.id !== set.id)
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
if (topLevelPairs.length > 0) failed.push(`${topLevelPairs.length} pair(s) of top-level nodes would meet: ${JSON.stringify(topLevelPairs.slice(0, 5))}`);
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
const topLevelPairsAfter = pairsThatMeet(page.children.map((node) => ({ id: node.id, box: boxOf(node) }))).length;
return {
  ...summary,
  mode: "applied",
  refused: null,
  defaultAfter: defaultVersionName(set),
  setBoxAfter: boxOf(set),
  verified: { versionsOutside: outsideAfter, versionPairsMeeting: versionPairsAfter, topLevelPairsMeeting: topLevelPairsAfter },
};
