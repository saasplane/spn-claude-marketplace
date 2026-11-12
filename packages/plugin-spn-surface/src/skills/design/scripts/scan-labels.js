// The scan before a publish, part 1 of 4: the labels, the headers, and what each unit owes.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and `return`, no
// wrapper. Fill INPUTS, change nothing else. Never writes to the file. It is one part of the scan before a publish:
// the scan is sent as its parts, one for a call, because the whole was too large to send (the connector's limit for
// a call is 50,000 characters). Each part reads the whole page it needs, holds the findings named below, and answers
// with the same finding names and the same { count, items } for each as the whole scan gave. A page is clean when
// every part says `clean`.
//
//   pageId null      lists the file's pages (id, name) and stops. No page switch.
//   only: "<finding>" returns that finding's whole list instead, from `from`, at most `count` items and as many as
//                    fit `answerBytes`; `next` continues. Only a finding this part holds can be asked of it.
//   (The connector refuses a returned value over 20,480 bytes: `answerBytes` stays 18000 or under. The lists give up
//   items, down to 3 and then to counts alone, the counts always whole; `shortened` says what was left out.)
//
// Holds: labelsUnitElsewhere, labelLayerNames, labelsFormCannotSay, defaultNotLabels, unitsWithoutHeader, usagesNamingNoUnit, unitsWithoutCases, unitsWithoutUsage, emptyReading.
//          It also answers `read`: what the page holds, counted by kind. `unitsWithoutCases` does not block. `unitsWithoutUsage` blocks:
//          it names each top-level unit with no usage (a part owes none; a unit drawn as cases alone, with no component in its
//          section, takes its first case for its usage). A scan that found no unit is not clean: `emptyReading` says so.
//
// Boxes are [x, y, width, height], in the page's coordinates (a node's own x and y plus the origins of the
// sections above it). A node is one of: a section, a set, a component, a sheet (a frame named `<unit> cases`), a
// label (a text that is a header, a row label, a column label or a band's label), a usage (`usage · ...`), a
// reference frame (a frame on a page that holds no set and no component), or other. Only `other` is a stray.

const INPUTS = {
  pageId: null,
  findingItems: 25,
  answerBytes: 18000,
  only: null,
  from: 0,
  count: null,
  labelReach: 400,
};

// ---- the page's reading: begin (this block is the same in page.js, scan-labels.js, scan-placement.js and scan-properties.js)
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

// A text is a header when its first line names a unit and a line follows it (the unit's one line), or when it names a
// unit before ` — ` (a Core file's header, a sheet's label, or an older header that still states a layout). A caption
// such as `usage · DSImagePicker open — more`, a band's label such as `Usage`, and a value such as `none — follows the
// hue` is not.
function isHeaderText(text) {
  if (text.startsWith(USAGE_PREFIX)) return false;
  const first = text.split("\n")[0].trim();
  const cut = first.indexOf(UNIT_SEPARATOR);
  const head = cut > 0 ? first.slice(0, cut) : first;
  const names = UNIT_LIKE.test(head) || unitNames.has(head);
  if (cut > 0) return names || OLD_LAYOUT_CLAUSE.test(first.slice(cut + UNIT_SEPARATOR.length));
  return names && text.trim().includes("\n");
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
    const head = parsed.unit ?? entry.node.name.slice(HEADER_PREFIX.length);
    const forSheet = head.endsWith(SHEET_SUFFIX);
    const unit = forSheet ? head.slice(0, -SHEET_SUFFIX.length) : head;
    // The layout is the header's section's plugin data, never the header's text: `grid` for a set, `one component`,
    // `cases` for a unit shown as cases alone, `no layout` where the section keeps none, `cannot say` where it cannot be read.
    const home = entry.node.parent && entry.node.parent.type === "SECTION" ? entry.node.parent : null;
    const kept = home ? layoutOf(home) : { layout: null, error: "the section holds no layout" };
    const form = forSheet ? "sheet" : parsed.error ? "cannot say" : kept.layout === null ? (kept.error === "the section holds no layout" ? "no layout" : "cannot say")
      : kept.layout.shape === "set" ? "grid" : kept.layout.shape === "one component" ? "one component" : "cases";
    return { text, part: forSheet ? "sheet" : "header", unit, via: "text", onPage: unitNames.has(head) || unitNames.has(unit), setId: null, form, reason: forSheet ? null : (parsed.error ?? kept.error) };
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

const PART = "labels";
const NOT_BLOCKING = ["unitsWithoutCases"];

function parseVersionName(name) {
  const values = {};
  for (const part of name.split(", ")) {
    const cut = part.indexOf("=");
    if (cut > 0) values[part.slice(0, cut)] = part.slice(cut + 1);
  }
  return values;
}

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

const GROUP_OF = { set: "sets", component: "components", sheet: "sheets", label: "labels", usage: "usages", section: "sections", reference: "references", other: "others" };
const captions = entries.filter((entry) => entry.kind === "usage" && entry.node.type === "TEXT").length;
const read = Object.fromEntries(Object.keys(GROUP_OF).map((kind) => [GROUP_OF[kind], entries.filter((entry) => entry.kind === kind).length]));
read.usages -= captions;
const SCAN_FACTS = { read: { topLevel: topLevel.length, ...read, usageLabels: captions } };

async function scanFindings() {
  const defaultNotLabels = [];
  for (const entry of sets) {
    const read = readSet(entry.node);
    const set = entry.node;
    // The default each label names, against the default version Figma reports: the value before the mark.
    const named = [];
    for (const label of labelEntries) {
      const belongs = (label.part === "header" && label.unit === set.name) || label.setId === set.id;
      if (!belongs) continue;
      // A header holds no layout and marks no default; a row or a column label names one value, and marks it.
      if (label.part === "header") continue;
      named.push(...defaultMarksOf(label.text));
    }
    if (named.length > 0 && read.defaultVersion !== null) {
      // A long value may be named by its words before its first `: `, so the default carries both.
      const carried = Object.values(parseVersionName(read.defaultVersion)).flatMap((value) => [value, value.split(": ")[0]]);
      const wrong = named.filter((mark) => !mark.candidates.some((candidate) => carried.includes(candidate)));
      if (wrong.length > 0) defaultNotLabels.push({ set: set.id, labelNames: wrong.map((mark) => mark.value), defaultVersion: read.defaultVersion });
    }
  }

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
  const labelsFormCannotSay = labelEntries.filter((label) => label.part === "header" && (label.form === "cannot say" || (label.form === "no layout" && label.entry.parentId !== null)) && sets.some((set) => set.node.name === label.unit))
    .map((label) => ({ label: label.entry.node.id, unit: label.unit, reason: label.reason }));
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
    emptyReading, usagesNamingNoUnit, labelsUnitElsewhere, labelLayerNames, labelsFormCannotSay, defaultNotLabels,
    unitsWithoutHeader, unitsWithoutCases, unitsWithoutUsage,
  };
}

const allFindings = await scanFindings();
// ---- the answer's bounds: begin (this block is the same in every scan part)
// `SCAN_FACTS` is what the part adds beside its findings; `allFindings` is every finding of the part, whole.
function finding(items, limit) {
  return { count: items.length, items: items.slice(0, limit) };
}
// UTF-8 bytes of the JSON, which is what the connector measures.
const utf8Of = (value) => {
  let bytes = 0;
  for (const char of JSON.stringify(value)) { const code = char.codePointAt(0); bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4; }
  return bytes;
};
const scanShown = (limits) => {
  const findings = {};
  for (const [name, items] of Object.entries(allFindings)) findings[name] = finding(items, limits[name] ?? INPUTS.findingItems);
  const blocking = Object.entries(allFindings).filter(([name]) => !NOT_BLOCKING.includes(name));
  return { clean: blocking.every(([, items]) => items.length === 0), notBlocking: NOT_BLOCKING, ...SCAN_FACTS, findings };
};
// The default scan answer, under `answerBytes`: the longest lists (by their items' bytes) give up an item at a time down
// to 3, then every list goes to its count alone. The counts stay whole; `shortened` says what was left out and how to ask.
function scanBounded() {
  const limits = {};
  const build = () => {
    const scan = scanShown(limits);
    const left = {};
    for (const [name, one] of Object.entries(scan.findings)) if (one.count > one.items.length) left[name] = one.count - one.items.length;
    if (Object.keys(left).length > 0) scan.shortened = { itemsLeftOut: left, askForOneWhole: 'run again with only: "<finding>" (and from, count to page it)' };
    return scan;
  };
  let scan = build();
  while (utf8Of(scan) > INPUTS.answerBytes) {
    let worst = null;
    let heaviest = 0;
    for (const [name, one] of Object.entries(scan.findings)) {
      const weight = one.items.length > 3 ? utf8Of(one.items) : 0;
      if (weight > heaviest) { heaviest = weight; worst = name; }
    }
    if (worst !== null) limits[worst] = scan.findings[worst].items.length - 1;
    else for (const name of Object.keys(allFindings)) limits[name] = 0;
    const next = build();
    if (worst === null && utf8Of(next) === utf8Of(scan)) break;
    scan = next;
  }
  return scan;
}
// One finding's whole list, from `from`, `count` items at most (and as many as fit `answerBytes`); `next` continues.
function onlyFinding(name) {
  const items = allFindings[name];
  if (items === undefined) return { error: `only names no finding of this part: ${name}`, findings: Object.keys(allFindings) };
  const first = Math.min(INPUTS.from, items.length);
  const shown = [];
  let used = 0;
  let next = null;
  for (let index = first; index < items.length; index += 1) {
    const size = utf8Of(items[index]) + 1;
    if (shown.length >= (INPUTS.count ?? Infinity) || (shown.length > 0 && used + size > INPUTS.answerBytes)) { next = index; break; }
    used += size;
    shown.push(items[index]);
  }
  return { finding: name, count: items.length, from: first, next, items: shown };
}
const answer = { part: PART, page: { id: page.id, name: page.name }, form, readAt: new Date().toISOString() };
if (INPUTS.only !== null) answer.only = onlyFinding(INPUTS.only);
else answer.scan = scanBounded();
return answer;
// ---- the answer's bounds: end
