// The inventory of one page of a library file: what the agent keeps of it. It is not the scan (`scan-labels.js`,
// `scan-placement.js`, `scan-properties.js` and `scan-sets.js` are the scan, one part for a call) and it is not the
// inventory the tool takes in (`inventory.js` and `tokens.js` give that one).
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and `return`, no
// wrapper. Fill INPUTS, change nothing else. Never writes to the file.
//
//   pageId null      lists the file's pages (id, name) and stops. No page switch.
//   (The connector refuses a returned value over 20,480 bytes: keep `maxBytes` at 16000 or under. An inventory
//   of a page of about 100 nodes takes three ranges, each continued from `next`.)
//   The answer holds what the book's inventory holds for the agent's own work: the page, each set and lone component,
//   each sheet of cases, each label with its layer name, full text and the unit it names, each usage, each section,
//   each reference frame and every other node. Every node carries `index`, its place in the page's order (the walk
//   down through the sections), `name`, its layer name, and, inside a section, `parent`, that section's id.
//   `from` and `to` take a range of nodes by `index`, and the answer stops by itself before `maxBytes`, returning
//   `next` to continue from.
//
// The form of a page is `sections` when its top level holds a section, `flat` when it holds nodes and no section (the
// old form), `empty` when it holds nothing. A page is read in either form: the walk goes through sections, and
// sections inside sections for parts, and stops at every other node.
//
// Boxes are [x, y, width, height], in the page's coordinates (a node's own x and y plus the origins of the sections
// above it). A set's versions carry their own box inside the set.
//
// A node is one of: a section, a set, a component, a sheet (a frame named `<unit> cases`), a label (a text that is a
// header, a row label, a column label or a band's label), a usage (`usage · ...`), a reference frame (a frame on a
// page that holds no set and no component), or other. A header's layer is `header · <Unit>`; every other label's is
// `label · <text>`, a sheet's label (`<unit> cases — ...`, part `sheet`) included, and it stands in the Cases band. A
// usage's name begins with its unit's name.
//
// A row label belongs to the row it sits by and a column label to the column it sits by: the label's centre must lie
// inside the span of one row (or column) of a set's versions, with the label beside the set (left or right of it for a
// row, above or below for a column) and at most `labelReach` from it.

const INPUTS = {
  pageId: null,
  from: 0,
  to: null,
  maxBytes: 16000,
  labelReach: 400,
};

// ---- the page's reading: begin (this block is the same in page.js, scan-labels.js, scan-placement.js and scan-properties.js)
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
const CASE_NAME = /^[^=,]+=[^=,]+(, [^=,]+=[^=,]+)*$/;
const BAND_LABELS = ["Usage", "Cases", "Parts"];

if (INPUTS.pageId === null) {
  return { pages: figma.root.children.map((page) => ({ id: page.id, name: page.name })) };
}

const page = await figma.getNodeByIdAsync(INPUTS.pageId);
if (!page || page.type !== "PAGE") {
  return { error: `${INPUTS.pageId} is not a page` };
}
await figma.setCurrentPageAsync(page);

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

const propertyName = (key) => key.replace(/#.*$/, "");
function definitionsOf(node) {
  try { return node.componentPropertyDefinitions ?? {}; } catch { return {}; }
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
// A unit is a set, or a lone component that is no case.
const unitEntries = entries.filter((entry) => entry.kind === "set" || (entry.kind === "component" && !CASE_NAME.test(entry.node.name)));
// ---- the page's reading: end

// One set, read once. The definitions come from the set, inside a try, because they throw from a
// version. The default version is the one Figma reports; the top left is the one found by position.
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

const GROUP_OF = { set: "sets", component: "components", sheet: "sheets", label: "labels", usage: "usages", section: "sections", reference: "references", other: "others" };

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

return {
  page: { id: page.id, name: page.name, background: backgroundOf(page) },
  form,
  readAt: new Date().toISOString(),
  inventory: inventory(INPUTS.maxBytes, true),
};
