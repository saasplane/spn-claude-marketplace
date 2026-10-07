// The reading of one page of a library file: what the agent keeps of it, and the scan before a publish.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else. Never writes to the file. It is not the
// inventory the tool takes in: `inventory.js` and `tokens.js` give that one.
//
//   pageId null      lists the file's pages (id, name) and stops. No page switch.
//   report inventory what the book's inventory holds for the agent's own work: the page, each set and
//                    lone component, each sheet of cases, each label with its layer name, full text and
//                    the unit it names, each sample, each reference frame and every other top-level node.
//                    Every node carries `index`, its place in the page's order, and `name`, its layer name.
//                    `from` and `to` take a range of top-level nodes by `index`, and the answer stops by
//                    itself before `maxBytes`, returning `next` to continue from.
//   report scan      the last scan before a publish. It always reads the whole page, because a pair that
//                    meets or a label whose unit is elsewhere needs every node. Its answer is counts and
//                    the first items of each finding.
//   report both      the two together, for a small page. The whole answer stays under `maxBytes`: the scan
//                    gives up items first, then the inventory stops early, and `cut` says what was left out.
//
// Boxes are [x, y, width, height]. A set's versions carry their own box inside the set.
//
// A top-level node is one of: a set, a component, a sheet (a frame named `<unit> cases`), a label (a text
// that is a header, a row label or a column label), a sample (`sample · ...`), a reference frame (a frame on
// a page that holds no set and no component), or other. Only `other` is a stray.
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

const SHEET_SUFFIX = " cases";
const EDITOR_DEFAULT_PROPERTY = /^Property \d+$/;
const CASE_NAME = /^[^=,]+=[^=,]+(, [^=,]+=[^=,]+)*$/;
const NOT_BLOCKING = ["emptyVersions", "emptyCases"];

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

// ---- the page's top-level nodes, sorted into their kinds
const pageHoldsUnits = page.children.some((node) => node.type === "COMPONENT_SET" || node.type === "COMPONENT");
const unitNames = new Set();
for (const node of page.children) {
  if (node.type === "COMPONENT_SET" || node.type === "COMPONENT") unitNames.add(node.name);
  if (isSheet(node)) { unitNames.add(node.name); unitNames.add(node.name.slice(0, -SHEET_SUFFIX.length)); }
}

// A text is a header when it names a unit before ` — ` and says a layout or names a unit by its shape. A
// caption such as `sample · DSImagePicker open — more` and a value such as `none — follows the hue` is not.
function isHeaderText(text) {
  if (text.startsWith(SAMPLE_PREFIX)) return false;
  const cut = text.indexOf(UNIT_SEPARATOR);
  if (cut <= 0) return false;
  const head = text.slice(0, cut);
  return UNIT_LIKE.test(head) || unitNames.has(head) || parseHeader(text).layout !== null;
}

function isSample(node) {
  return node.name.startsWith(SAMPLE_PREFIX) || (node.type === "TEXT" && (textOf(node) ?? "").startsWith(SAMPLE_PREFIX));
}

function kindOf(node) {
  if (node.type === "COMPONENT_SET") return "set";
  if (node.type === "COMPONENT") return "component";
  if (isSheet(node)) return "sheet";
  if (isSample(node)) return "sample";
  if (node.type === "TEXT" && (node.name.startsWith(LABEL_PREFIX) || isHeaderText(textOf(node) ?? ""))) return "label";
  if ((node.type === "FRAME" || node.type === "SECTION") && !pageHoldsUnits) return "reference";
  return "other";
}

const topLevel = page.children.map((node, index) => ({ node, index, kind: kindOf(node), box: boxOf(node) }));
const unitNodes = topLevel.filter((entry) => ["set", "component", "sheet"].includes(entry.kind));
const sets = topLevel.filter((entry) => entry.kind === "set");

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
  if (isHeaderText(text)) {
    const parsed = parseHeader(text);
    const head = text.slice(0, text.indexOf(UNIT_SEPARATOR));
    const forSheet = head.endsWith(SHEET_SUFFIX);
    const unit = forSheet ? head.slice(0, -SHEET_SUFFIX.length) : head;
    const form = forSheet ? "sheet" : parsed.error ? "cannot say" : parsed.layout.oneComponent ? "one component" : "grid";
    return { text, part: "header", unit, via: "text", onPage: unitNames.has(head) || unitNames.has(unit), setId: null, form, reason: forSheet ? null : parsed.error };
  }
  const tie = tieOfValueLabel(entry);
  return { text, part: tie ? tie.axis : "untied", unit: tie ? tie.name : null, via: tie ? tie.axis : null, onPage: tie !== null, setId: tie ? tie.setId : null, form: null, reason: null };
}

const labelEntries = topLevel.filter((entry) => entry.kind === "label").map((entry) => ({ entry, ...readLabel(entry) }));
const labelOf = new Map(labelEntries.map((label) => [label.entry, label]));

// A sample belongs to the unit whose name its caption begins with, where one does.
function unitOfSample(node) {
  const shown = node.type === "TEXT" ? (textOf(node) ?? "") : node.name;
  const after = shown.slice(SAMPLE_PREFIX.length);
  const names = [...unitNames].filter((name) => after === name || after.startsWith(name + " ")).sort((first, second) => second.length - first.length);
  return names[0] ?? null;
}

function inventoryEntry(entry) {
  const { node, kind, box, index } = entry;
  const base = { kind, id: node.id, index, name: node.name, box };
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
  if (kind === "sample") return { ...base, nodeType: node.type, unit: unitOfSample(node) };
  return { ...base, nodeType: node.type };
}

const GROUP_OF = { set: "sets", component: "components", sheet: "sheets", label: "labels", sample: "samples", reference: "references", other: "others" };

// The inventory of a range of top-level nodes. It stops before `budget` bytes and says where to go on. With
// `allowFirst` false, not even the first node is taken when it does not fit.
function inventory(budget, allowFirst) {
  const from = INPUTS.from ?? 0;
  const to = Math.min(INPUTS.to ?? topLevel.length, topLevel.length);
  const groups = Object.fromEntries(Object.values(GROUP_OF).map((group) => [group, []]));
  let used = 0;
  let next = null;
  for (let index = from; index < to; index += 1) {
    const item = inventoryEntry(topLevel[index]);
    const size = JSON.stringify(item).length + 1;
    const fits = used + size <= budget;
    if (!fits && (used > 0 || !allowFirst)) { next = index; break; }
    used += size;
    groups[GROUP_OF[topLevel[index].kind]].push(item);
  }
  return { range: [from, next ?? to], topLevelCount: topLevel.length, next, ...groups };
}

function finding(items, limit) {
  return { count: items.length, items: items.slice(0, limit) };
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
    const placed = read.versions.map((version) => ({ id: version.id, box: boxOf(version) }));
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
    for (const pair of pairsThatMeet(placed)) versionPairs.push({ set: set.id, pair });
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
      const body = label.part === "header" ? label.text.slice(label.text.indexOf(UNIT_SEPARATOR) + UNIT_SEPARATOR.length) : label.text;
      named.push(...defaultMarksOf(body));
    }
    if (named.length > 0 && read.defaultVersion !== null) {
      const carried = Object.values(parseVersionName(read.defaultVersion));
      const wrong = named.filter((mark) => !mark.candidates.some((candidate) => carried.includes(candidate)));
      if (wrong.length > 0) defaultNotLabels.push({ set: set.id, labelNames: wrong.map((mark) => mark.value), defaultVersion: read.defaultVersion });
    }
  }

  const emptyCases = [];
  const badCaseNames = [];
  const duplicateCaseNames = [];
  for (const entry of topLevel.filter((candidate) => candidate.kind === "sheet")) {
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
  const labelsUnitElsewhere = labelEntries.filter((label) => label.part === "header" && !label.onPage)
    .map((label) => ({ label: label.entry.node.id, unit: label.unit, text: label.text.slice(0, 80) }));
  const labelLayerNames = labelEntries.flatMap((label) => {
    const name = label.entry.node.name;
    if (!name.startsWith(LABEL_PREFIX)) return [{ label: label.entry.node.id, name: name.slice(0, 80), text: label.text.slice(0, 80), why: "the layer name has no `label · ` prefix" }];
    if (name !== LABEL_PREFIX + label.text) return [{ label: label.entry.node.id, name: name.slice(0, 80), text: label.text.slice(0, 80), why: "the layer name is not `label · ` and the text" }];
    return [];
  });
  const labelsFormCannotSay = labelEntries.filter((label) => label.part === "header" && label.form === "cannot say" && sets.some((set) => set.node.name === label.unit))
    .map((label) => ({ label: label.entry.node.id, unit: label.unit, reason: label.reason }));

  return {
    versionsOutside, versionPairsMeeting: versionPairs, topLevelPairsMeeting: topLevelPairs.map((pair) => ({ pair })),
    strays, defaultNamedProperties, unreadableSets, setsOverLimit, emptyVersions, emptyCases,
    badCaseNames, duplicateCaseNames, labelsUnitElsewhere, labelLayerNames, labelsFormCannotSay, defaultNotLabels,
  };
}

const allFindings = scanFindings();
const scanShown = (limit) => {
  const findings = {};
  for (const [name, items] of Object.entries(allFindings)) findings[name] = finding(items, limit);
  const blocking = Object.entries(allFindings).filter(([name]) => !NOT_BLOCKING.includes(name));
  return { clean: blocking.every(([, items]) => items.length === 0), notBlocking: NOT_BLOCKING, findings };
};

const result = {
  page: { id: page.id, name: page.name, background: backgroundOf(page) },
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
