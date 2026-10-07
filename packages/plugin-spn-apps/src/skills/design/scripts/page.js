// The reading of one page of a library file: its inventory, its scan, or both.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else. Never writes to the file.
//
//   pageId null      lists the file's pages (id, name) and stops. No page switch.
//   report inventory what the book's inventory holds: the page, each set and lone component, each
//                    sheet of cases, each label with its full text and the unit it names, every
//                    other top-level node. `from` and `to` take a range of top-level nodes, and the
//                    answer stops by itself before `maxBytes`, returning `next` to continue from.
//   report scan      the last scan before a publish. It always reads the whole page, because a pair
//                    that meets or a label whose unit is elsewhere needs every node. Its answer is
//                    counts and the first items of each finding.
//   report both      the two together, for a small page.
//
// Boxes are [x, y, width, height]. A set's versions carry their own box inside the set.

const INPUTS = {
  pageId: null,
  report: "inventory",
  from: 0,
  to: null,
  maxBytes: 16000,
  findingItems: 25,
};

const LABEL_PREFIX = "label · ";
const UNIT_SEPARATOR = " — ";
const SHEET_SUFFIX = " cases";
const EDITOR_DEFAULT_PROPERTY = /^Property \d+$/;
const CASE_NAME = /^[^=,]+=[^=,]+$/;
const DEFAULT_MARK = /([^,·()=:]+?) \(default\)/g;

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

function isLabel(node) {
  return node.type === "TEXT" && node.name.startsWith(LABEL_PREFIX);
}

function isSheet(node) {
  return (node.type === "FRAME" || node.type === "SECTION") && node.name.endsWith(SHEET_SUFFIX);
}

function kindOf(node) {
  if (node.type === "COMPONENT_SET") return "set";
  if (node.type === "COMPONENT") return "component";
  if (isLabel(node)) return "label";
  if (isSheet(node)) return "sheet";
  return "other";
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

// The first pass is cheap: kind, name and box of every top-level node. The row-label lookup and the
// scan need the whole page even when the inventory is asked for a range.
const topLevel = page.children.map((node, index) => ({ node, index, kind: kindOf(node), box: boxOf(node) }));
const unitNodes = topLevel.filter((entry) => ["set", "component", "sheet"].includes(entry.kind));
const sets = topLevel.filter((entry) => entry.kind === "set");

function unitNameOf(entry) {
  return entry.kind === "sheet" ? entry.node.name.slice(0, -SHEET_SUFFIX.length) : entry.node.name;
}

// A header label names its unit by its text. A row label has no separator and names a value: its
// unit is the set whose rows it sits beside (its centre inside the set's rows, nearest on x).
function unitOfLabel(entry) {
  const text = textOf(entry.node) ?? "";
  const cut = text.indexOf(UNIT_SEPARATOR);
  if (cut > 0) return { name: text.slice(0, cut), via: "text", onPage: unitNodes.some((unit) => unitNameOf(unit) === text.slice(0, cut) || unit.node.name === text.slice(0, cut)) };
  const centre = entry.box[1] + entry.box[3] / 2;
  let best = null;
  let bestGap = Infinity;
  for (const candidate of sets) {
    if (centre < candidate.box[1] || centre > candidate.box[1] + candidate.box[3]) continue;
    const gap = Math.max(0, candidate.box[0] - (entry.box[0] + entry.box[2]), entry.box[0] - (candidate.box[0] + candidate.box[2]));
    if (gap < bestGap) { best = candidate; bestGap = gap; }
  }
  return best
    ? { name: best.node.name, via: "row", value: text, setId: best.node.id, onPage: true }
    : { name: null, via: null, onPage: false };
}

const labelEntries = topLevel.filter((entry) => entry.kind === "label").map((entry) => ({
  entry, text: textOf(entry.node), unit: unitOfLabel(entry),
}));

function inventoryEntry(entry) {
  const { node, kind, box } = entry;
  if (kind === "set") {
    const read = readSet(node);
    return {
      kind, id: node.id, name: node.name, box, props: read.props, readError: read.readError,
      versionCount: read.versions.length, defaultVersion: read.defaultVersion, topLeftVersion: read.topLeftVersion,
      ground: { fills: groundOf(node.fills), strokes: groundOf(node.strokes) },
    };
  }
  if (kind === "component") {
    return { kind, id: node.id, name: node.name, box, ground: { fills: groundOf(node.fills), strokes: groundOf(node.strokes) } };
  }
  if (kind === "sheet") {
    const cases = node.children.filter((child) => !isLabel(child));
    return { kind, id: node.id, name: node.name, box, cases: cases.map((child) => ({ name: child.name, kind: child.type })) };
  }
  if (kind === "label") {
    const found = labelEntries.find((candidate) => candidate.entry === entry);
    return { kind, id: node.id, text: found.text, box, unit: found.unit.name, unitVia: found.unit.via };
  }
  return { kind: "other", id: node.id, nodeType: node.type, name: node.name, box };
}

function inventory() {
  const from = INPUTS.from ?? 0;
  const to = Math.min(INPUTS.to ?? topLevel.length, topLevel.length);
  const groups = { sets: [], components: [], sheets: [], labels: [], others: [] };
  const groupOf = { set: "sets", component: "components", sheet: "sheets", label: "labels", other: "others" };
  let used = 0;
  let next = null;
  for (let index = from; index < to; index += 1) {
    const item = inventoryEntry(topLevel[index]);
    const size = JSON.stringify(item).length;
    if (used > 0 && used + size > INPUTS.maxBytes) { next = index; break; }
    used += size;
    groups[groupOf[topLevel[index].kind]].push(item);
  }
  return { range: [from, next ?? to], topLevelCount: topLevel.length, next, ...groups };
}

function finding(items) {
  return { count: items.length, items: items.slice(0, INPUTS.findingItems) };
}

function scan() {
  const versionsOutside = [];
  const versionPairs = [];
  const emptyVersions = [];
  const defaultNamedProperties = [];
  const unreadableSets = [];
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
      if (hasNoLayer || box[2] === 0 || box[3] === 0) emptyVersions.push({ set: set.id, version: version.id });
    }
    for (const pair of pairsThatMeet(placed)) versionPairs.push({ set: set.id, pair });
    if (read.readError !== null) unreadableSets.push({ set: set.id, error: read.readError });
    for (const name of Object.keys(read.props)) {
      if (EDITOR_DEFAULT_PROPERTY.test(name.replace(/#.*$/, ""))) defaultNamedProperties.push({ set: set.id, property: name });
    }
    const named = [];
    for (const label of labelEntries) {
      const isHeader = label.unit.via === "text" && label.unit.name === set.name;
      const isRow = label.unit.via === "row" && label.unit.setId === set.id;
      if (!isHeader && !isRow) continue;
      for (const mark of (label.text ?? "").matchAll(DEFAULT_MARK)) named.push(mark[1].trim());
    }
    if (named.length > 0 && read.defaultVersion !== null) {
      const carried = Object.values(parseVersionName(read.defaultVersion));
      if (named.some((value) => !carried.includes(value))) {
        defaultNotLabels.push({ set: set.id, labelNames: named, defaultVersion: read.defaultVersion });
      }
    }
  }

  const emptyCases = [];
  const badCaseNames = [];
  const duplicateCaseNames = [];
  for (const entry of topLevel.filter((candidate) => candidate.kind === "sheet")) {
    const seen = new Set();
    for (const child of entry.node.children.filter((candidate) => !isLabel(candidate))) {
      const hasNoLayer = "children" in child && child.children.length === 0;
      if (hasNoLayer || child.width === 0 || child.height === 0) emptyCases.push({ sheet: entry.node.id, case: child.id });
      if (!CASE_NAME.test(child.name)) badCaseNames.push({ sheet: entry.node.id, case: child.id, name: child.name });
      if (seen.has(child.name)) duplicateCaseNames.push({ sheet: entry.node.id, case: child.id, name: child.name });
      seen.add(child.name);
    }
  }

  const topLevelPairs = pairsThatMeet(topLevel.map((entry) => ({ id: entry.node.id, box: entry.box })));
  const strays = topLevel.filter((entry) => entry.kind === "other")
    .map((entry) => ({ id: entry.node.id, nodeType: entry.node.type, name: entry.node.name }));
  const labelsUnitElsewhere = labelEntries.filter((label) => !label.unit.onPage)
    .map((label) => ({ label: label.entry.node.id, unit: label.unit.name, text: (label.text ?? "").slice(0, 80) }));

  const findings = {
    versionsOutside: finding(versionsOutside),
    versionPairsMeeting: finding(versionPairs),
    topLevelPairsMeeting: finding(topLevelPairs.map((pair) => ({ pair }))),
    strays: finding(strays),
    defaultNamedProperties: finding(defaultNamedProperties),
    unreadableSets: finding(unreadableSets),
    emptyVersions: finding(emptyVersions),
    emptyCases: finding(emptyCases),
    badCaseNames: finding(badCaseNames),
    duplicateCaseNames: finding(duplicateCaseNames),
    labelsUnitElsewhere: finding(labelsUnitElsewhere),
    defaultNotLabels: finding(defaultNotLabels),
  };
  return { clean: Object.values(findings).every((one) => one.count === 0), findings };
}

const result = {
  page: { id: page.id, name: page.name, background: backgroundOf(page) },
  readAt: new Date().toISOString(),
};
if (INPUTS.report === "inventory" || INPUTS.report === "both") result.inventory = inventory();
if (INPUTS.report === "scan" || INPUTS.report === "both") result.scan = scan();
return result;
