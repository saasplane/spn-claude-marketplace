// The reading of one page of a library file: what the agent keeps of it, and the scan before a publish.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else. Never writes to the file. It is not the
// inventory the tool takes in: `inventory.js` and `tokens.js` give that one.
//
//   pageId null      lists the file's pages (id, name) and stops. No page switch.
//   (The connector refuses a returned value over 20,480 bytes: keep `maxBytes` at 16000 or under. An inventory
//   of a page of about 100 nodes takes three ranges, each continued from `next`.)
//   report inventory what the book's inventory holds for the agent's own work: the page, each set and
//                    lone component, each sheet of cases, each label with its layer name, full text and
//                    the unit it names, each usage, each section, each reference frame and every other node.
//                    Every node carries `index`, its place in the page's order (the walk down through the
//                    sections), `name`, its layer name, and, inside a section, `parent`, that section's id.
//                    `from` and `to` take a range of nodes by `index`, and the answer stops by itself before
//                    `maxBytes`, returning `next` to continue from.
//   report scan      the last scan before a publish. It always reads the whole page, because a pair that
//                    meets or a label whose unit is elsewhere needs every node. Its answer is counts and
//                    the first items of each finding, the page's `form` and what it `read`. A scan that found
//                    no unit is not clean: `emptyReading` says so. `childOutsideSection` names each child that
//                    lies beyond its section's box (by its box or by what it draws) by more than 1 px, with the
//                    side and the px. `unitsWithoutUsage` blocks: it names each top-level unit with no usage (a part owes none; a
//                    unit drawn as cases alone, with no component in its section, takes its first case for its usage).
//                    `propertyNotDrawn` blocks: it names each BOOLEAN, INSTANCE_SWAP and TEXT property of a unit (a part too)
//                    that nothing on the page draws off its default and that the unit's header does not name after
//                    `behaviour: ` (a note of the header, such as ` · behaviour: collapsible, sticky`), with the unit,
//                    property, type and default. A property is drawn when an instance of the unit outside its set holds it
//                    off its default, or when a case of the unit's sheet (or a loose case component in its section) is named
//                    for it, `<property>=`. A swap named `startIcon` is judged with the boolean `withStartIcon` of the unit.
//                    `behaviourNamesNoProperty` names a property the clause gives that the unit does not have. An instance that
//                    stands inside a set or lone component of any unit draws nothing. A case's name counts for a property only
//                    where the case holds no instance of the unit (an instance speaks for itself); a loose case component is
//                    credited to the unit it belongs to (the unit of an instance in it, a unit named by a layer in it, else the
//                    one unit of its section). The answer's `propertyChecks` says `run`, or `skipped: ...` on a page that is not
//                    in sections. `versionNotWired` blocks: in a set of more than one version, a layer path that holds a
//                    `componentPropertyReferences` entry (`characters`, `visible`, `mainComponent`, `slotContentId`) in any
//                    version, on a node of one type, is wired for that kind; a version is named, with the count of missing
//                    references, its first paths and `nearest` (a version one variant value apart that holds the reference, or
//                    null; its absence excuses nothing), when its node at that path, of that type, lacks the kind. A version that
//                    ties the same property on another layer (the tie moved by design), a version with no node at the path and a
//                    set with no reference at all are not named. `versionTiedToAnotherProperty` blocks: where a path is tied in
//                    several versions to different properties, a version off the most common one is named with the path, the
//                    key it holds and the key the others hold. `propertyTiedToNothing` blocks: a set's or lone component's
//                    definition, not a VARIANT, that no layer of any version references (an instance's layers are not entered),
//                    with the unit, the property's name and key and its type. A node of another type than the wired ones is
//                    `versionSlotIsFrame`, which does not block (a FRAME where another version has a SLOT). These do not
//                    block: `unitsWithoutCases` (a unit whose versions draw everything owes no sheet), `usagesWithoutCaption`
//                    (a usage with no caption directly above it), `partSectionTooWide` (a part's section with more than the
//                    padding empty at its right), `propertyClearedByNameAlone` (a property cleared only by the name of a case that
//                    holds no instance of the unit: a person opens it) and `versionSlotIsFrame`.
//   report both      the two together, for a small page. The whole answer stays under `maxBytes`: the scan
//                    gives up items first, then the inventory stops early, and `cut` says what was left out.
//
// The form of a page is `sections` when its top level holds a section, `flat` when it holds nodes and no
// section (the old form), `empty` when it holds nothing. A page is read in either form: the walk goes through
// sections, and sections inside sections for parts, and stops at every other node.
//
// Boxes are [x, y, width, height], in the page's coordinates (a node's own x and y plus the origins of the
// sections above it), so that a label and a row, or two nodes, are always compared in one frame of reference.
// A set's versions carry their own box inside the set.
//
// A node is one of: a section, a set, a component, a sheet (a frame named `<unit> cases`), a label (a text
// that is a header, a row label, a column label or a band's label), a usage (`usage · ...`), a reference
// frame (a frame on a page that holds no set and no component), or other. Only `other` is a stray. A header's
// layer is `header · <Unit>`; every other label's is `label · <text>`, a sheet's label (`<unit> cases — ...`,
// part `sheet`) included, and it stands in the Cases band. A usage's name begins with its unit's name.
//
// A row label belongs to the row it sits by and a column label to the column it sits by: the label's centre
// must lie inside the span of one row (or column) of a set's versions, with the label beside the set (left
// or right of it for a row, above or below for a column) and at most `labelReach` from it.

const INPUTS = {
  pageId: null,
  report: "inventory",
  from: 0,
  to: null,
  maxBytes: 16000,
  findingItems: 25,
  labelReach: 400,
  maxVersions: 1000,
};

// ---- the book's label form: begin (this block is the same in page.js and layout.js)
const LABEL_PREFIX = "label · ";
const HEADER_PREFIX = "header · ";
const USAGE_PREFIX = "usage · ";
const UNIT_SEPARATOR = " — ";
const CLAUSE_SEPARATOR = " · ";
const FACTOR_SEPARATOR = " x ";
const DEFAULT_MARK = /\s+\(default\)$/;
const MARK_TEXT = /^(.*?)\s*\(default(?: at the top)?\)$/;
const MARK_SPLIT = /, | · | x |=|each with /;
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
  // A clause word (`rows: `, `columns: `) is no part of a value, and a `: ` after a cell's `=` is inside its value.
  for (const piece of text.replace(/(^|· )(rows|columns): /g, "$1").split(MARK_SPLIT)) {
    const found = MARK_TEXT.exec(piece.trim());
    if (!found || found[1].trim().length === 0) continue;
    const value = found[1].trim();
    marks.push({ value, candidates: [value, value.split(" ").pop()] });
  }
  return marks;
}
// ---- the book's label form: end

const SHEET_SUFFIX = " cases";
const EDITOR_DEFAULT_PROPERTY = /^Property \d+$/;
const CASE_NAME = /^[^=,]+=[^=,]+(, [^=,]+=[^=,]+)*$/;
const NOT_BLOCKING = ["emptyVersions", "emptyCases", "unitsWithoutCases", "behaviourNamesNoProperty", "usagesWithoutCaption", "partSectionTooWide", "propertyClearedByNameAlone", "versionSlotIsFrame"];
const DRAWABLE_TYPES = ["BOOLEAN", "INSTANCE_SWAP", "TEXT"];
const BEHAVIOUR_CLAUSE = "behaviour: ";
const PATH_JOIN = " > ";
const PATHS_NAMED = 3;
// The distances of a section (the book's table): the padding, the gap a caption may stand above its usage, the edge a caption may be off.
const SECTION_PADDING = 80;
const CAPTION_REACH = 48;
const CAPTION_EDGE = 2;
// A child may lie this far (px) beyond its section's box before it is named: the sums of fractional origins.
const OUTSIDE_TOLERANCE = 1;

if (INPUTS.pageId === null) {
  return { pages: figma.root.children.map((page) => ({ id: page.id, name: page.name })) };
}

const page = await figma.getNodeByIdAsync(INPUTS.pageId);
if (!page || page.type !== "PAGE") {
  return { error: `${INPUTS.pageId} is not a page` };
}
await figma.setCurrentPageAsync(page);

const boxOf = (node) => [node.x, node.y, node.width, node.height];
const meets = (first, second) =>
  first[0] < second[0] + second[2] && second[0] < first[0] + first[2] &&
  first[1] < second[1] + second[3] && second[1] < first[1] + first[3];

// Pairs that meet, found by sorting on x and comparing only the nodes whose x ranges overlap.
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

function hex(color) {
  return "#" + [color.r, color.g, color.b]
    .map((channel) => Math.round(channel * 255).toString(16).padStart(2, "0")).join("");
}

function groundOf(paints) {
  if (paints === figma.mixed) return "mixed";
  return paints.map((paint) => ({ type: paint.type, variableId: paint.boundVariables?.color?.id ?? null }));
}

function backgroundOf(node) {
  const paints = node.backgrounds;
  if (!paints || paints === figma.mixed) return null;
  return paints.map((paint) => ({
    type: paint.type, color: paint.color ? hex(paint.color) : null, opacity: paint.opacity ?? 1,
  }));
}

function textOf(node) {
  try { return node.characters; } catch { return null; }
}

// A text inside a sheet that is named as a label is the sheet's own label, not one of its cases.
function isSheetLabel(node) {
  return node.type === "TEXT" && node.name.startsWith(LABEL_PREFIX);
}

function isSheet(node) {
  return (node.type === "FRAME" || node.type === "SECTION") && node.name.endsWith(SHEET_SUFFIX);
}

// A section that is no sheet holds a unit, or a unit's parts, or the shared parts.
function isSection(node) {
  return node.type === "SECTION" && !isSheet(node);
}

// One set, read once. The definitions come from the set, inside a try, because they throw from a
// version. The default version is the one Figma reports; the top left is the one found by position.
function readSet(set) {
  let definitions = null;
  let readError = null;
  try {
    definitions = set.componentPropertyDefinitions;
  } catch (error) {
    readError = String(error?.message ?? error);
  }
  const versions = set.children.filter((child) => child.type === "COMPONENT");
  let topLeft = null;
  for (const version of versions) {
    if (topLeft === null || version.y < topLeft.y || (version.y === topLeft.y && version.x < topLeft.x)) {
      topLeft = version;
    }
  }
  let defaultVersion = null;
  try { defaultVersion = set.defaultVariant?.name ?? null; } catch { defaultVersion = null; }
  const props = {};
  for (const [name, definition] of Object.entries(definitions ?? {})) {
    props[name] = { type: definition.type, default: definition.defaultValue, options: definition.variantOptions ?? null };
  }
  return { set, versions, definitions, readError, props, defaultVersion, topLeftVersion: topLeft?.name ?? null };
}

// ---- the page's nodes, sorted into their kinds
// The walk goes down through sections (and sections inside sections, for parts) and no further. A node's box
// is in page coordinates, found by adding the origins of the sections above it, so every comparison is made in
// one frame of reference.
const placed = [];
function collect(parent, depth) {
  for (const node of parent.children) {
    placed.push({ node, depth, parentId: depth === 0 ? null : parent.id });
    if (isSection(node)) collect(node, depth + 1);
  }
}
function absoluteBox(node) {
  let [x, y] = [node.x, node.y];
  for (let up = node.parent; up && up.type !== "PAGE"; up = up.parent) { x += up.x; y += up.y; }
  return [x, y, node.width, node.height];
}
const rectOfBox = (box) => ({ x: box[0], y: box[1], width: box[2], height: box[3] });
// How far `drawn` reaches beyond `room` (both { x, y, width, height } in page coordinates): the side that reaches
// furthest and by how many px, or null when no side reaches past the tolerance.
function overshoot(room, drawn) {
  const by = {
    left: room.x - drawn.x,
    top: room.y - drawn.y,
    right: drawn.x + drawn.width - (room.x + room.width),
    bottom: drawn.y + drawn.height - (room.y + room.height),
  };
  const [side, px] = Object.entries(by).sort((first, second) => second[1] - first[1])[0];
  return px > OUTSIDE_TOLERANCE ? { side, px: Math.round(px * 100) / 100 } : null;
}
collect(page, 0);
const pageHoldsUnits = placed.some(({ node }) => node.type === "COMPONENT_SET" || node.type === "COMPONENT");
const unitNames = new Set();
for (const { node } of placed) {
  if (node.type === "COMPONENT_SET" || node.type === "COMPONENT") unitNames.add(node.name);
  if (isSheet(node)) { unitNames.add(node.name); unitNames.add(node.name.slice(0, -SHEET_SUFFIX.length)); }
}

// A text is a header when it names a unit before ` — ` and says a layout or names a unit by its shape. A
// caption such as `usage · DSImagePicker open — more` and a value such as `none — follows the hue` is not.
function isHeaderText(text) {
  if (text.startsWith(USAGE_PREFIX)) return false;
  const cut = text.indexOf(UNIT_SEPARATOR);
  if (cut <= 0) return false;
  const head = text.slice(0, cut);
  return UNIT_LIKE.test(head) || unitNames.has(head) || parseHeader(text).layout !== null;
}

function isUsage(node) {
  return node.name.startsWith(USAGE_PREFIX) || (node.type === "TEXT" && (textOf(node) ?? "").startsWith(USAGE_PREFIX));
}

function kindOf(node) {
  if (node.type === "COMPONENT_SET") return "set";
  if (node.type === "COMPONENT") return "component";
  if (isSheet(node)) return "sheet";
  if (isUsage(node)) return "usage";
  if (isSection(node)) return "section";
  if (node.type === "TEXT" && (node.name.startsWith(LABEL_PREFIX) || node.name.startsWith(HEADER_PREFIX) || isHeaderText(textOf(node) ?? ""))) return "label";
  if ((node.type === "FRAME" || node.type === "SECTION") && !pageHoldsUnits) return "reference";
  return "other";
}

const entries = placed.map((item, index) => ({ ...item, index, kind: kindOf(item.node), box: absoluteBox(item.node) }));
const topLevel = entries.filter((entry) => entry.depth === 0);
const sets = entries.filter((entry) => entry.kind === "set");
const form = topLevel.length === 0 ? "empty" : topLevel.some((entry) => entry.kind === "section") ? "sections" : "flat";
const BAND_LABELS = ["Usage", "Cases", "Parts"];
// The unit a set, a lone component or a sheet stands for: a case component is no unit of its own.
const unitEntryByName = new Map();
for (const entry of entries) {
  const isUnit = entry.kind === "set" || (entry.kind === "component" && !CASE_NAME.test(entry.node.name));
  if (isUnit) unitEntryByName.set(entry.node.name, entry);
}
for (const entry of entries) {
  const unit = entry.node.name.slice(0, -SHEET_SUFFIX.length);
  if (entry.kind === "sheet" && !unitEntryByName.has(unit)) unitEntryByName.set(unit, entry);
}

// The rows and columns of a set, as the spans its versions fill on the page: [start, end] along y and x.
const spanCache = new Map();
function spansOfSet(entry) {
  if (!spanCache.has(entry.node.id)) {
    const versions = entry.node.children.filter((child) => child.type === "COMPONENT");
    spanCache.set(entry.node.id, {
      rows: versions.map((version) => [entry.box[1] + version.y, entry.box[1] + version.y + version.height]),
      columns: versions.map((version) => [entry.box[0] + version.x, entry.box[0] + version.x + version.width]),
    });
  }
  return spanCache.get(entry.node.id);
}

const inside = (point, spans) => spans.some(([start, end]) => point >= start && point <= end);

// A row or column label names values only. It belongs to the row (or column) of one set that it sits by:
// its centre lies inside that row's own span in the set, and it stands beside the set, within `labelReach`.
function tieOfValueLabel(entry) {
  const centreX = entry.box[0] + entry.box[2] / 2;
  const centreY = entry.box[1] + entry.box[3] / 2;
  let best = null;
  for (const candidate of sets) {
    const { rows, columns } = spansOfSet(candidate);
    const [setX, setY, setWidth, setHeight] = candidate.box;
    const beside = Math.max(setX - (entry.box[0] + entry.box[2]), entry.box[0] - (setX + setWidth));
    const above = Math.max(setY - (entry.box[1] + entry.box[3]), entry.box[1] - (setY + setHeight));
    if (beside >= 0 && beside <= INPUTS.labelReach && inside(centreY, rows) && (best === null || beside < best.gap)) {
      best = { axis: "row", gap: beside, name: candidate.node.name, setId: candidate.node.id };
    }
    if (above >= 0 && above <= INPUTS.labelReach && inside(centreX, columns) && (best === null || above < best.gap)) {
      best = { axis: "column", gap: above, name: candidate.node.name, setId: candidate.node.id };
    }
  }
  return best;
}

function readLabel(entry) {
  const text = textOf(entry.node) ?? "";
  const named = entry.node.name.startsWith(HEADER_PREFIX);
  if (named || isHeaderText(text)) {
    const parsed = parseHeader(text);
    const cut = text.indexOf(UNIT_SEPARATOR);
    const head = cut > 0 ? text.slice(0, cut) : entry.node.name.slice(HEADER_PREFIX.length);
    const forSheet = head.endsWith(SHEET_SUFFIX);
    const unit = forSheet ? head.slice(0, -SHEET_SUFFIX.length) : head;
    const form = forSheet ? "sheet" : parsed.error ? "cannot say" : parsed.layout.oneComponent ? "one component" : "grid";
    return { text, part: forSheet ? "sheet" : "header", unit, via: "text", onPage: unitNames.has(head) || unitNames.has(unit), setId: null, form, reason: forSheet ? null : parsed.error };
  }
  if (entry.node.name.startsWith(LABEL_PREFIX) && BAND_LABELS.includes(text)) {
    return { text, part: "band", unit: null, via: null, onPage: true, setId: null, form: null, reason: null };
  }
  const tie = tieOfValueLabel(entry);
  return { text, part: tie ? tie.axis : "untied", unit: tie ? tie.name : null, via: tie ? tie.axis : null, onPage: tie !== null, setId: tie ? tie.setId : null, form: null, reason: null };
}

const labelEntries = entries.filter((entry) => entry.kind === "label").map((entry) => ({ entry, ...readLabel(entry) }));
const labelOf = new Map(labelEntries.map((label) => [label.entry, label]));

// A usage belongs to the unit whose name its caption begins with, where one does.
function unitOfUsage(node) {
  const shown = node.type === "TEXT" ? (textOf(node) ?? "") : node.name;
  const after = shown.slice(USAGE_PREFIX.length);
  const names = [...unitNames].filter((name) => after === name || after.startsWith(name + " ")).sort((first, second) => second.length - first.length);
  return names[0] ?? null;
}

// ---- what the page's instances draw of each unit
const propertyName = (key) => key.replace(/#.*$/, "");
function definitionsOf(node) {
  try { return node.componentPropertyDefinitions ?? {}; } catch { return {}; }
}
function isInside(node, ancestor) {
  for (let up = node.parent; up; up = up.parent) if (up === ancestor) return true;
  return false;
}
// A unit is a set, or a lone component that is no case.
const unitEntries = entries.filter((entry) => entry.kind === "set" || (entry.kind === "component" && !CASE_NAME.test(entry.node.name)));
const unitOfComponent = new Map();
for (const { node } of unitEntries) for (const component of node.type === "COMPONENT_SET" ? node.children : [node]) unitOfComponent.set(component.id, node);
const unitNodeIds = new Set(unitEntries.map((entry) => entry.node.id));
function isInsideAUnit(node) {
  for (let up = node.parent; up; up = up.parent) if (unitNodeIds.has(up.id)) return true;
  return false;
}
// For each unit, the names of its boolean, swap and text properties that an instance on the page holds at a value other
// than the default. An instance that stands inside any unit's set or lone component draws nothing: it is a part of that
// unit's own drawing. The main component is read the way a page that loads on demand allows.
async function drawnByInstances() {
  const definitionsOfUnit = new Map();
  const drawn = new Map();
  for (const { node } of unitEntries) {
    drawn.set(node.id, new Set());
    definitionsOfUnit.set(node.id, definitionsOf(node));
  }
  for (const instance of page.findAllWithCriteria({ types: ["INSTANCE"] })) {
    const main = await instance.getMainComponentAsync();
    const unit = main ? unitOfComponent.get(main.id) : undefined;
    if (unit === undefined || isInsideAUnit(instance)) continue;
    const definitions = definitionsOfUnit.get(unit.id);
    for (const [key, held] of Object.entries(instance.componentProperties ?? {})) {
      const definition = definitions[key];
      if (definition && DRAWABLE_TYPES.includes(definition.type) && held.value !== definition.defaultValue) drawn.get(unit.id).add(propertyName(key));
    }
  }
  return drawn;
}
// What each case holds: the units of the instances in it (the case itself or a layer of it; an instance is not entered), and
// the unit a layer of it is named for. A case is a child of a sheet, or a loose case component.
async function readCase(root, sectionUnits) {
  const holds = new Set();
  const named = [];
  const walk = async (node, isRoot) => {
    if (!isRoot) {
      for (const unit of sectionUnits) if (node.name === unit.node.name || node.name.startsWith(unit.node.name + " ")) named.push(unit);
    }
    if (node.type === "INSTANCE") {
      const main = await node.getMainComponentAsync();
      const unit = main ? unitOfComponent.get(main.id) : undefined;
      if (unit !== undefined) holds.add(unit.id);
      return;
    }
    for (const child of node.children ?? []) await walk(child, false);
  };
  await walk(root, true);
  named.sort((first, second) => second.node.name.length - first.node.name.length);
  return { holds, named: named[0] ?? null };
}
async function readCases() {
  const readings = new Map();
  for (const entry of entries) {
    const isLoose = entry.kind === "component" && CASE_NAME.test(entry.node.name);
    if (entry.kind !== "sheet" && !isLoose) continue;
    const sectionUnits = unitEntries.filter((unit) => unit.parentId === entry.parentId);
    for (const node of isLoose ? [entry.node] : entry.node.children.filter((child) => !isSheetLabel(child))) readings.set(node, await readCase(node, sectionUnits));
  }
  return readings;
}
const drawnOffDefault = form === "sections" ? await drawnByInstances() : new Map();
const caseReadings = form === "sections" ? await readCases() : new Map();

function inventoryEntry(entry) {
  const { node, kind, box, index } = entry;
  const base = { kind, id: node.id, index, name: node.name, box, ...(entry.parentId ? { parent: entry.parentId } : {}) };
  if (kind === "set") {
    const read = readSet(node);
    return {
      ...base, props: read.props, readError: read.readError,
      versionCount: read.versions.length, defaultVersion: read.defaultVersion, topLeftVersion: read.topLeftVersion,
      ground: { fills: groundOf(node.fills), strokes: groundOf(node.strokes) },
    };
  }
  if (kind === "component") return { ...base, ground: { fills: groundOf(node.fills), strokes: groundOf(node.strokes) } };
  if (kind === "sheet") {
    const cases = node.children.filter((child) => !isSheetLabel(child));
    return { ...base, cases: cases.map((child) => ({ name: child.name, kind: child.type })) };
  }
  if (kind === "label") {
    const found = labelOf.get(entry);
    return {
      ...base, text: found.text, unit: found.unit, unitVia: found.via, part: found.part,
      ...(found.form ? { form: found.form } : {}), ...(found.reason ? { reason: found.reason } : {}),
    };
  }
  if (kind === "usage") return { ...base, nodeType: node.type, unit: unitOfUsage(node) };
  if (kind === "section") return { ...base, nodeType: node.type, children: node.children.length };
  return { ...base, nodeType: node.type };
}

const GROUP_OF = { set: "sets", component: "components", sheet: "sheets", label: "labels", usage: "usages", section: "sections", reference: "references", other: "others" };

// The inventory of a range of the page's nodes, in the order of the walk down through the sections. It stops before `budget` bytes and says where to go on. With
// `allowFirst` false, not even the first node is taken when it does not fit.
function inventory(budget, allowFirst) {
  const from = INPUTS.from ?? 0;
  const to = Math.min(INPUTS.to ?? entries.length, entries.length);
  const groups = Object.fromEntries(Object.values(GROUP_OF).map((group) => [group, []]));
  let used = 0;
  let next = null;
  for (let index = from; index < to; index += 1) {
    const item = inventoryEntry(entries[index]);
    const size = JSON.stringify(item).length + 1;
    const fits = used + size <= budget;
    if (!fits && (used > 0 || !allowFirst)) { next = index; break; }
    used += size;
    groups[GROUP_OF[entries[index].kind]].push(item);
  }
  return { range: [from, next ?? to], topLevelCount: topLevel.length, nodeCount: entries.length, next, ...groups };
}

function finding(items, limit) {
  return { count: items.length, items: items.slice(0, limit) };
}

// ---- the references of a set's versions
// The layers of a version by path (the layer names from the version down, joined; a second sibling of one name takes
// ` [2]`, and so on). A node inside an instance is not entered. A node outside a component, or one that throws on the
// read, holds no reference; a reference is a key of `componentPropertyReferences` (`characters`, `visible`,
// `mainComponent`, and a SLOT's `slotContentId`) with the property it is tied to.
function layersOf(version) {
  const found = new Map();
  const walk = (node, path) => {
    if (node.type === "INSTANCE" || !node.children) return;
    const times = new Map();
    for (const child of node.children) {
      const nth = (times.get(child.name) ?? 0) + 1;
      times.set(child.name, nth);
      const here = (path === "" ? "" : path + PATH_JOIN) + (nth > 1 ? `${child.name} [${nth}]` : child.name);
      let tied = null;
      let unread = false;
      try { tied = child.componentPropertyReferences ?? null; } catch { unread = true; }
      const references = {};
      for (const [kind, property] of Object.entries(tied ?? {})) if (property) references[kind] = property;
      found.set(here, { type: child.type, references, unread });
      walk(child, here);
    }
  };
  walk(version, "");
  return found;
}

// For one set or lone component: what its layers' references say. A path is wired for a kind when any version holds that
// kind there on a node of the same type. Named: a version whose node there, of that type, lacks it (`lacking`; not when the
// version ties the same property on another layer, since a tie may move between layers by design); a version whose layer
// is of another type where no version of its type holds the kind (`reshaped`, a FRAME where another version has a SLOT);
// a version tied there to another property than the most (`tiedElsewhere`); a definition, not a VARIANT, that no layer of
// any version references (`unreferenced`). The nearest wired version, a twin (one variant value apart) that holds the
// reference, is given to help a writer; its absence excuses nothing.
function wiringOf(read) {
  const out = { lacking: [], reshaped: [], tiedElsewhere: [], unreferenced: [] };
  const versions = read.versions;
  if (versions.length === 0 || versions.length > INPUTS.maxVersions) return out;
  const layers = versions.map(layersOf);
  const wired = new Map();
  const held = layers.map(() => new Set());
  let unread = false;
  layers.forEach((one, index) => {
    for (const [path, node] of one) {
      if (node.unread) unread = true;
      for (const [kind, property] of Object.entries(node.references)) {
        held[index].add(property);
        if (!wired.has(path)) wired.set(path, new Map());
        const group = wired.get(path);
        const id = node.type + "\u0000" + kind;
        if (!group.has(id)) group.set(id, new Map());
        const keys = group.get(id);
        keys.set(property, (keys.get(property) ?? 0) + 1);
      }
    }
  });
  const label = { set: read.set.id, setName: read.set.name.slice(0, 80) };
  if (!unread) {
    for (const [key, definition] of Object.entries(read.definitions ?? {})) {
      if (definition.type !== "VARIANT" && !held.some((one) => one.has(key))) {
        out.unreferenced.push({ ...label, property: propertyName(key).slice(0, 80), key: key.slice(0, 80), type: definition.type });
      }
    }
  }
  if (versions.length < 2 || wired.size === 0) return out;
  const leaderOf = (keys) => {
    const ranked = [...keys].sort((first, second) => second[1] - first[1]);
    return ranked[0][1] > ranked[1][1] ? ranked[0][0] : null;
  };
  const values = versions.map((version) => parseVersionName(version.name));
  const signature = (index, skipped) => skipped + "\u0000" + JSON.stringify(Object.keys(values[index]).filter((key) => key !== skipped).sort().map((key) => [key, values[index][key]]));
  const buckets = new Map();
  values.forEach((one, index) => {
    for (const key of Object.keys(one)) {
      const at = signature(index, key);
      if (!buckets.has(at)) buckets.set(at, []);
      buckets.get(at).push(index);
    }
  });
  const twinsOf = (index) => Object.keys(values[index]).flatMap((key) => (buckets.get(signature(index, key)) ?? []).filter((other) => other !== index && values[other][key] !== values[index][key]));
  versions.forEach((version, index) => {
    const missing = [];
    const changed = [];
    let first = null;
    for (const [path, group] of wired) {
      const node = layers[index].get(path);
      if (node === undefined) continue;
      for (const [id, keys] of group) {
        const [type, kind] = id.split("\u0000");
        const own = node.references[kind];
        if (type !== node.type) {
          if (!own && !group.has(node.type + "\u0000" + kind)) changed.push(`${path} (${kind}; twin ${type}, here ${node.type})`);
        } else if (!own) {
          if ([...keys.keys()].some((property) => held[index].has(property))) continue;
          first ??= { path, kind };
          missing.push(`${path} (${kind})`);
        } else if (keys.size > 1 && leaderOf(keys) !== null && leaderOf(keys) !== own) {
          out.tiedElsewhere.push({ ...label, version: version.id, name: version.name.slice(0, 80), path: `${path} (${kind})`.slice(0, 120), holds: own.slice(0, 80), others: leaderOf(keys).slice(0, 80) });
        }
      }
    }
    const item = (paths) => ({ ...label, version: version.id, name: version.name.slice(0, 80), missing: paths.length, paths: paths.slice(0, PATHS_NAMED).map((path) => path.slice(0, 120)) });
    if (missing.length > 0) {
      const nearest = twinsOf(index).find((other) => layers[other].get(first.path)?.references[first.kind]);
      out.lacking.push({ ...item(missing), nearest: nearest === undefined ? null : versions[nearest].id });
    }
    if (changed.length > 0) out.reshaped.push(item(changed));
  });
  return out;
}

// Every finding, whole. `scanShown` cuts each to its first `limit` items.
function scanFindings() {
  const versionsOutside = [];
  const versionPairs = [];
  const emptyVersions = [];
  const defaultNamedProperties = [];
  const unreadableSets = [];
  const setsOverLimit = [];
  const defaultNotLabels = [];
  for (const entry of sets) {
    const read = readSet(entry.node);
    const set = entry.node;
    const positions = read.versions.map((version) => ({ id: version.id, box: boxOf(version) }));
    for (const version of read.versions) {
      const box = boxOf(version);
      if (box[0] < 0 || box[1] < 0 || box[0] + box[2] > set.width || box[1] + box[3] > set.height) {
        versionsOutside.push({ set: set.id, version: version.id });
      }
      const hasNoLayer = "children" in version && version.children.length === 0;
      const hasNoSize = box[2] === 0 || box[3] === 0;
      if (hasNoLayer || hasNoSize) {
        emptyVersions.push({ set: set.id, version: version.id, why: hasNoLayer && hasNoSize ? "no layer and no size" : hasNoLayer ? "no layer" : "no size" });
      }
    }
    for (const pair of pairsThatMeet(positions)) versionPairs.push({ set: set.id, pair });
    if (read.readError !== null) unreadableSets.push({ set: set.id, error: read.readError });
    if (read.versions.length > INPUTS.maxVersions) setsOverLimit.push({ set: set.id, name: set.name, versions: read.versions.length });
    for (const name of Object.keys(read.props)) {
      if (EDITOR_DEFAULT_PROPERTY.test(name.replace(/#.*$/, ""))) defaultNamedProperties.push({ set: set.id, property: name });
    }
    // The default each label names, against the default version Figma reports: the value before the mark.
    const named = [];
    for (const label of labelEntries) {
      const belongs = (label.part === "header" && label.unit === set.name) || label.setId === set.id;
      if (!belongs) continue;
      const cut = label.text.indexOf(UNIT_SEPARATOR);
      const body = label.part !== "header" ? label.text : cut > 0 ? label.text.slice(cut + UNIT_SEPARATOR.length) : "";
      named.push(...defaultMarksOf(body));
    }
    if (named.length > 0 && read.defaultVersion !== null) {
      // A long value may be named by its words before its first `: `, so the default carries both.
      const carried = Object.values(parseVersionName(read.defaultVersion)).flatMap((value) => [value, value.split(": ")[0]]);
      const wrong = named.filter((mark) => !mark.candidates.some((candidate) => carried.includes(candidate)));
      if (wrong.length > 0) defaultNotLabels.push({ set: set.id, labelNames: wrong.map((mark) => mark.value), defaultVersion: read.defaultVersion });
    }
  }

  const versionNotWired = [];
  const versionSlotIsFrame = [];
  const versionTiedToAnotherProperty = [];
  const propertyTiedToNothing = [];
  for (const entry of unitEntries) {
    const lone = entry.kind === "component";
    const wiring = wiringOf(lone ? { set: entry.node, versions: [entry.node], definitions: definitionsOf(entry.node) } : readSet(entry.node));
    versionNotWired.push(...wiring.lacking);
    versionSlotIsFrame.push(...wiring.reshaped);
    versionTiedToAnotherProperty.push(...wiring.tiedElsewhere);
    propertyTiedToNothing.push(...wiring.unreferenced);
  }

  const emptyCases = [];
  const badCaseNames = [];
  const duplicateCaseNames = [];
  for (const entry of entries.filter((candidate) => candidate.kind === "sheet")) {
    const seen = new Set();
    for (const child of entry.node.children) {
      if (isSheetLabel(child)) continue;
      const hasNoLayer = "children" in child && child.children.length === 0;
      const hasNoSize = child.width === 0 || child.height === 0;
      if (hasNoLayer || hasNoSize) emptyCases.push({ sheet: entry.node.id, case: child.id, why: hasNoLayer && hasNoSize ? "no layer and no size" : hasNoLayer ? "no layer" : "no size" });
      if (!CASE_NAME.test(child.name)) badCaseNames.push({ sheet: entry.node.id, case: child.id, name: child.name });
      if (seen.has(child.name)) duplicateCaseNames.push({ sheet: entry.node.id, case: child.id, name: child.name });
      seen.add(child.name);
    }
  }

  const topLevelPairs = pairsThatMeet(topLevel.map((entry) => ({ id: entry.node.id, box: entry.box })));
  const strays = topLevel.filter((entry) => entry.kind === "other")
    .map((entry) => ({ id: entry.node.id, nodeType: entry.node.type, name: entry.node.name }));
  // Only a header names a unit. A row label and a column label name values, so they are never "elsewhere".
  const labelsUnitElsewhere = labelEntries.filter((label) => (label.part === "header" || label.part === "sheet") && !label.onPage)
    .map((label) => ({ label: label.entry.node.id, unit: label.unit, text: label.text.slice(0, 80) }));
  const labelLayerNames = labelEntries.flatMap((label) => {
    const name = label.entry.node.name;
    if (label.part === "header" && name.startsWith(HEADER_PREFIX)) {
      return name === HEADER_PREFIX + label.unit ? [] : [{ label: label.entry.node.id, name: name.slice(0, 80), text: label.text.slice(0, 80), why: "the layer name is not `header · ` and the unit's name" }];
    }
    if (label.part === "header" && form === "sections") return [{ label: label.entry.node.id, name: name.slice(0, 80), text: label.text.slice(0, 80), why: "the layer name of a header is `header · ` and the unit's name" }];
    if (!name.startsWith(LABEL_PREFIX)) return [{ label: label.entry.node.id, name: name.slice(0, 80), text: label.text.slice(0, 80), why: "the layer name has no `label · ` prefix" }];
    if (name !== LABEL_PREFIX + label.text) return [{ label: label.entry.node.id, name: name.slice(0, 80), text: label.text.slice(0, 80), why: "the layer name is not `label · ` and the text" }];
    return [];
  });
  const labelsFormCannotSay = labelEntries.filter((label) => label.part === "header" && label.form === "cannot say" && sets.some((set) => set.node.name === label.unit))
    .map((label) => ({ label: label.entry.node.id, unit: label.unit, reason: label.reason }));

  // The unit that a thing names must stand in the same section as the thing: a header, a row or column label,
  // a sheet of cases and a usage are the unit's own.
  const outsideUnitSection = [];
  for (const entry of entries.filter((candidate) => ["sheet", "usage", "label"].includes(candidate.kind))) {
    const name = entry.kind === "sheet" ? entry.node.name.slice(0, -SHEET_SUFFIX.length)
      : entry.kind === "usage" ? unitOfUsage(entry.node) : labelOf.get(entry).unit;
    const owner = unitEntryByName.get(name);
    if (owner && owner !== entry && owner.parentId !== entry.parentId) {
      outsideUnitSection.push({ id: entry.node.id, kind: entry.kind, unit: name, in: entry.parentId, unitIn: owner.parentId });
    }
  }
  // A section does not clip, so a child can lie outside the white box and still be its child. Each direct child of
  // each section, at any depth, must lie wholly inside the section's box, by its box and by what it draws.
  const childOutsideSection = [];
  if (form === "sections") {
    for (const owner of entries.filter((candidate) => candidate.kind === "section")) {
      const room = owner.node.absoluteBoundingBox ?? rectOfBox(owner.box);
      for (const child of entries.filter((candidate) => candidate.parentId === owner.node.id)) {
        const drawn = [
          ["box", child.node.absoluteBoundingBox ?? rectOfBox(child.box)],
          // a SECTION has no render bounds and Figma throws on the read, so a section is judged by its box alone
          ["render", child.node.type === "SECTION" ? null : child.node.absoluteRenderBounds ?? null],
        ];
        let worst = null;
        for (const [bounds, rect] of drawn) {
          const found = rect === null ? null : overshoot(room, rect);
          if (found !== null && (worst === null || found.px > worst.px)) worst = { ...found, bounds };
        }
        if (worst !== null) childOutsideSection.push({ child: child.node.id, name: child.node.name.slice(0, 80), section: owner.node.id, side: worst.side, px: worst.px, bounds: worst.bounds });
      }
    }
  }
  // A unit whose versions draw everything it can show owes no sheet, so `unitsWithoutCases` is a count that does not
  // block. A top-level unit owes a usage, which shows its primary use, so `unitsWithoutUsage` blocks. A part (a unit in a
  // section inside a section, a name that starts with a dot, or a unit in `Shared parts`) owes neither.
  const sectionNameOf = (id) => entries.find((candidate) => candidate.node.id === id)?.node.name ?? null;
  const topUnits = form !== "sections" ? [] : [...unitEntryByName].filter(([name, entry]) =>
    entry.parentId !== null && entry.depth < 2 && !name.startsWith(".") && sectionNameOf(entry.parentId) !== "Shared parts");
  const unitsWithoutCases = topUnits.filter(([name, entry]) => !entries.some((candidate) => candidate.parentId === entry.parentId &&
    ((candidate.kind === "sheet" && candidate.node.name === name + SHEET_SUFFIX) || (candidate.kind === "component" && CASE_NAME.test(candidate.node.name)))))
    .map(([name, entry]) => ({ unit: name, id: entry.node.id, in: entry.parentId }));
  // A unit drawn as cases alone (a sheet, and no component in its section) takes its first case for its usage.
  const drawnAsCasesAlone = (entry) => entry.kind === "sheet" && entry.node.children.some((child) => !isSheetLabel(child)) &&
    !unitEntries.some((candidate) => candidate.parentId === entry.parentId);
  const unitsWithoutUsage = topUnits.filter(([name, entry]) => !drawnAsCasesAlone(entry) && !entries.some((candidate) => candidate.kind === "usage" &&
    candidate.parentId === entry.parentId && unitOfUsage(candidate.node) === name))
    .map(([name, entry]) => ({ unit: name, id: entry.node.id, in: entry.parentId }));
  const propertyNotDrawn = [];
  const propertyClearedByNameAlone = [];
  const behaviourNamesNoProperty = [];
  for (const unit of form === "sections" ? unitEntries : []) {
    const definitions = Object.entries(definitionsOf(unit.node)).map(([key, definition]) => ({ name: propertyName(key), definition }));
    const header = labelEntries.find((label) => label.part === "header" && label.unit === unit.node.name && label.entry.parentId === unit.parentId);
    const clause = (header?.text ?? "").split(CLAUSE_SEPARATOR).find((note) => note.trim().startsWith(BEHAVIOUR_CLAUSE));
    const behaviour = clause === undefined ? [] : clause.trim().slice(BEHAVIOUR_CLAUSE.length).split(", ").map((name) => name.trim()).filter((name) => name.length > 0);
    // A case's name credits a property only where the case holds no instance of the unit: an instance speaks for itself,
    // and the page's instances are read above. A loose case component belongs to one unit, not to every unit of its section.
    const sectionUnits = unitEntries.filter((one) => one.parentId === unit.parentId);
    const namedByCases = new Set();
    for (const candidate of entries.filter((one) => one.parentId === unit.parentId)) {
      const isOwnSheet = candidate.kind === "sheet" && candidate.node.name === unit.node.name + SHEET_SUFFIX;
      const isLooseCase = candidate.kind === "component" && CASE_NAME.test(candidate.node.name);
      if (!isOwnSheet && !isLooseCase) continue;
      for (const caseNode of isOwnSheet ? candidate.node.children.filter((child) => !isSheetLabel(child)) : [candidate.node]) {
        const reading = caseReadings.get(caseNode);
        if (reading === undefined || reading.holds.has(unit.node.id)) continue;
        const belongs = !isLooseCase || (reading.holds.size > 0 ? false : reading.named !== null ? reading.named === unit : sectionUnits.length === 1);
        if (!belongs) continue;
        for (const cell of caseNode.name.split(", ")) if (cell.includes("=")) namedByCases.add(cell.slice(0, cell.indexOf("=")).trim());
      }
    }
    const drawn = (name) => (drawnOffDefault.get(unit.node.id)?.has(name) ?? false) || behaviour.includes(name);
    const booleans = definitions.filter((one) => one.definition.type === "BOOLEAN").map((one) => one.name);
    for (const { name, definition } of definitions.filter((one) => DRAWABLE_TYPES.includes(one.definition.type))) {
      // a swap is judged with the boolean that turns it on: `startIcon` with `withStartIcon`
      const partner = `with${name.charAt(0).toUpperCase()}${name.slice(1)}`;
      const names = definition.type === "INSTANCE_SWAP" && booleans.includes(partner) ? [name, partner] : [name];
      if (names.some(drawn)) continue;
      const item = { unit: unit.node.name.slice(0, 80), id: unit.node.id, property: name.slice(0, 80), type: definition.type, default: String(definition.defaultValue).slice(0, 40), in: unit.parentId };
      if (names.some((one) => namedByCases.has(one))) propertyClearedByNameAlone.push(item);
      else propertyNotDrawn.push(item);
    }
    for (const name of behaviour.filter((one) => !definitions.some((known) => known.name === one))) {
      behaviourNamesNoProperty.push({ unit: unit.node.name.slice(0, 80), id: unit.node.id, name: name.slice(0, 80), in: unit.parentId });
    }
  }
  // A usage's caption stands directly above it, level at the left edge, within the reach of the section's distances.
  const usagesWithoutCaption = entries.filter((entry) => entry.kind === "usage" && entry.node.type !== "TEXT" && entry.parentId !== null &&
    !entries.some((caption) => caption.kind === "usage" && caption.node.type === "TEXT" && caption.parentId === entry.parentId &&
      Math.abs(caption.box[0] - entry.box[0]) <= CAPTION_EDGE && caption.box[1] + caption.box[3] <= entry.box[1] + CAPTION_EDGE &&
      entry.box[1] - (caption.box[1] + caption.box[3]) <= CAPTION_REACH))
    .map((entry) => ({ id: entry.node.id, name: entry.node.name.slice(0, 80), in: entry.parentId }));
  // A part's section is as wide as its content and its padding; a top-level section is as wide as the widest of the page.
  const partSectionTooWide = entries.filter((entry) => entry.kind === "section" && entry.depth > 0).map((entry) => {
    const children = entries.filter((child) => child.parentId === entry.node.id);
    const right = Math.max(0, ...children.map((child) => child.node.x + child.node.width));
    return { id: entry.node.id, name: entry.node.name.slice(0, 80), emptyAtRight: Math.round((entry.node.width - right) * 100) / 100, children: children.length };
  }).filter((one) => one.children > 0 && one.emptyAtRight > SECTION_PADDING + OUTSIDE_TOLERANCE)
    .map(({ id, name, emptyAtRight }) => ({ id, name, emptyAtRight }));
  const topLevelNotSection = form === "sections"
    ? topLevel.filter((entry) => entry.kind !== "section").map((entry) => ({ id: entry.node.id, nodeType: entry.node.type, name: entry.node.name }))
    : [];
  const sectionIds = [...new Set(entries.map((entry) => entry.parentId).filter((id) => id !== null))];
  const meetingInSection = sectionIds.flatMap((sectionId) => pairsThatMeet(
    entries.filter((entry) => entry.parentId === sectionId).map((entry) => ({ id: entry.node.id, box: entry.box })))
    .map((pair) => ({ section: sectionId, pair })));
  // A section's pieces, from the top: header, the set with its labels, usage, cases, parts. Read by the top of each.
  const BANDS = ["header", "set", "usage", "cases", "parts"];
  const bandOf = (entry) => {
    if (entry.kind === "set" || entry.kind === "component") return CASE_NAME.test(entry.node.name) ? 3 : 1;
    if (entry.kind === "sheet") return 3;
    if (entry.kind === "usage") return 2;
    if (entry.kind === "section") return 4;
    const label = labelOf.get(entry);
    if (!label) return null;
    if (label.part === "header") return 0;
    if (label.part === "sheet") return 3;
    if (label.part === "row" || label.part === "column") return 1;
    return label.part === "band" ? 2 + BAND_LABELS.indexOf(label.text) : null;
  };
  const sectionOutOfOrder = [];
  for (const sectionId of sectionIds) {
    const pieces = entries.filter((entry) => entry.parentId === sectionId && bandOf(entry) !== null)
      .sort((first, second) => first.box[1] - second.box[1] || bandOf(first) - bandOf(second));
    let deepest = 0;
    for (const piece of pieces) {
      if (bandOf(piece) < deepest) sectionOutOfOrder.push({ section: sectionId, id: piece.node.id, name: piece.node.name.slice(0, 80), band: BANDS[bandOf(piece)], standsBelow: BANDS[deepest] });
      deepest = Math.max(deepest, bandOf(piece));
    }
  }
  // A set or a lone component is a unit, and a unit has a header. A case component is no unit.
  const headed = new Set(labelEntries.filter((label) => label.part === "header").map((label) => label.unit));
  const unitsWithoutHeader = [...unitEntryByName].filter(([name]) => !headed.has(name))
    .map(([name, entry]) => ({ unit: name, id: entry.node.id, in: entry.parentId }));
  const usagesNamingNoUnit = entries.filter((entry) => entry.kind === "usage" && unitOfUsage(entry.node) === null)
    .map((entry) => ({ id: entry.node.id, name: entry.node.name.slice(0, 80), in: entry.parentId }));
  const kinds = (kind) => entries.filter((entry) => entry.kind === kind).length;
  const emptyReading = kinds("set") + kinds("component") + kinds("sheet") === 0
    ? [{ page: page.id, nodes: entries.length, why: "the scan found no set, no lone component and no sheet of cases, so it checked no unit" }]
    : [];

  return {
    emptyReading, usagesNamingNoUnit, versionsOutside, versionPairsMeeting: versionPairs, topLevelPairsMeeting: topLevelPairs.map((pair) => ({ pair })),
    strays, defaultNamedProperties, unreadableSets, setsOverLimit, emptyVersions, emptyCases,
    badCaseNames, duplicateCaseNames, labelsUnitElsewhere, labelLayerNames, labelsFormCannotSay, defaultNotLabels,
    topLevelNotSection, meetingInSection, sectionOutOfOrder, unitsWithoutHeader, outsideUnitSection,
    childOutsideSection, unitsWithoutCases, unitsWithoutUsage, propertyNotDrawn, propertyClearedByNameAlone, behaviourNamesNoProperty, versionNotWired, versionSlotIsFrame, versionTiedToAnotherProperty, propertyTiedToNothing, usagesWithoutCaption, partSectionTooWide,
  };
}

const allFindings = scanFindings();
const scanShown = (limit) => {
  const findings = {};
  for (const [name, items] of Object.entries(allFindings)) findings[name] = finding(items, limit);
  const blocking = Object.entries(allFindings).filter(([name]) => !NOT_BLOCKING.includes(name));
  const read = Object.fromEntries(Object.keys(GROUP_OF).map((kind) => [GROUP_OF[kind], entries.filter((entry) => entry.kind === kind).length]));
  const captions = entries.filter((entry) => entry.kind === "usage" && entry.node.type === "TEXT").length;
  read.usages -= captions;
  return { clean: blocking.every(([, items]) => items.length === 0), notBlocking: NOT_BLOCKING, form, propertyChecks: form === "sections" ? "run" : `skipped: the page is ${form}, and the property checks read only a page in sections`, read: { topLevel: topLevel.length, ...read, usageLabels: captions }, findings };
};

const result = {
  page: { id: page.id, name: page.name, background: backgroundOf(page) },
  form,
  readAt: new Date().toISOString(),
};
const bytesOf = (value) => JSON.stringify(value).length;

if (INPUTS.report === "inventory") result.inventory = inventory(INPUTS.maxBytes, true);
if (INPUTS.report === "scan") result.scan = scanShown(INPUTS.findingItems);
if (INPUTS.report === "both") {
  // The whole answer stays under maxBytes. The scan is cut first, to the fewest items that fit half of it;
  // the inventory takes what is left and stops early. `cut` says what was left out.
  let limit = INPUTS.findingItems;
  let scan = scanShown(limit);
  while (limit > 0 && bytesOf(scan) > INPUTS.maxBytes / 2) {
    limit = Math.floor(limit / 2);
    scan = scanShown(limit);
  }
  const dropped = {};
  for (const [name, one] of Object.entries(scan.findings)) {
    if (one.count > one.items.length) dropped[name] = one.count - one.items.length;
  }
  result.scan = scan;
  const budget = INPUTS.maxBytes - bytesOf(result) - 400;
  result.inventory = inventory(Math.max(budget, 0), false);
  result.cut = { scanItemsPerFinding: limit, scanItemsLeftOut: dropped, inventoryStoppedAt: result.inventory.next };
}
return result;
