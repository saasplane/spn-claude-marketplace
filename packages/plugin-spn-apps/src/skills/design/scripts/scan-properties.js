// The scan before a publish, part 3 of 4: the properties a unit has and what the page draws of them.
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
// Holds: propertyNotDrawn, propertyClearedByNameAlone, behaviourNamesHeldProperty.
//          These do not block: propertyClearedByNameAlone, behaviourNamesHeldProperty. The answer's `propertyChecks` says `run`, or
//          `skipped: ...` on a page that is not in sections.
//
// `propertyNotDrawn` blocks: it names each BOOLEAN, INSTANCE_SWAP and TEXT property of a unit (a part too) that nothing on the
// page draws off its default and that the unit's header does not name after `behaviour: ` (a note of the header, such as
// ` · behaviour: collapsible, sticky`), with the unit, property, type and default. A property is drawn when an instance of the
// unit outside its set holds it off its default, or when a case of the unit's sheet (or a loose case component in its section)
// is named for it, `<property>=`. A swap named `startIcon` is judged with the boolean `withStartIcon` of the unit. An instance that
// stands inside a set or lone component of any unit draws nothing. A case's name counts for a property only where the case
// holds no instance of the unit (an instance speaks for itself); a loose case component is credited to the unit it belongs to
// (the unit of an instance in it, a unit named by a layer in it, else the one unit of its section).
// `behaviourNamesHeldProperty` follows the book: a property of behaviour changes nothing a person can see, so it has nothing to
// draw and the unit's set does not hold it, and the header names it in the `behaviour:` clause. A name in the clause that the
// set DOES hold as a property is the finding, because a held property is drawn and is not behaviour.
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

const PART = "properties";
const NOT_BLOCKING = ["propertyClearedByNameAlone", "behaviourNamesHeldProperty"];
const SCAN_FACTS = { propertyChecks: form === "sections" ? "run" : `skipped: the page is ${form}, and the property checks read only a page in sections` };
const DRAWABLE_TYPES = ["BOOLEAN", "INSTANCE_SWAP", "TEXT"];
const BEHAVIOUR_CLAUSE = "behaviour: ";

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

async function scanFindings() {
  const propertyNotDrawn = [];
  const propertyClearedByNameAlone = [];
  const behaviourNamesHeldProperty = [];
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
    for (const name of behaviour.filter((one) => definitions.some((known) => known.name === one))) {
      behaviourNamesHeldProperty.push({ unit: unit.node.name.slice(0, 80), id: unit.node.id, name: name.slice(0, 80), in: unit.parentId });
    }
  }
  return { propertyNotDrawn, propertyClearedByNameAlone, behaviourNamesHeldProperty };
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
