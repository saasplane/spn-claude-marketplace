// The scan before a publish, part 2 of 4: where things stand in their sections.
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
// Holds: topLevelPairsMeeting, strays, outsideUnitSection, childOutsideSection, topLevelNotSection, meetingInSection, sectionOutOfOrder, usagesWithoutCaption, partSectionTooWide.
//          These do not block: usagesWithoutCaption, partSectionTooWide.
//
// `childOutsideSection` names each child that lies beyond its section's box (by its box or by what it draws) by more than
// 1 px, with the side and the px. `partSectionTooWide` names a part's section with more than the padding empty at its right,
// the content measured as `align.js` measures it: each child's right edge and what it draws beyond that edge. `unitsWithoutUsage`
// blocks: it names each top-level unit with no usage (a part owes none; a unit drawn as cases alone, with no component in
// its section, takes its first case for its usage).
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

const PART = "placement";
const NOT_BLOCKING = ["usagesWithoutCaption", "partSectionTooWide"];
const SCAN_FACTS = {};
// The distances of a section (the book's table): the padding, the gap a caption may stand above its usage, the edge a caption may be off.
const SECTION_PADDING = 80;
const CAPTION_REACH = 48;
const CAPTION_EDGE = 2;
// A child may lie this far (px) beyond its section's box before it is named: the sums of fractional origins.
const OUTSIDE_TOLERANCE = 1;

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

// How far what a node draws reaches beyond its box on the right, in whole px (the way `align.js` reads it).
function drawnRightOf(node) {
  if (node.type === "TEXT" || node.type === "SECTION") return 0;
  const drawn = node.absoluteRenderBounds;
  const box = node.absoluteBoundingBox;
  if (!drawn || !box) return 0;
  const over = drawn.x + drawn.width - box.x - box.width;
  return over > 0.5 ? Math.ceil(over) : 0;
}

async function scanFindings() {
  const topLevelPairs = pairsThatMeet(topLevel.map((entry) => ({ id: entry.node.id, box: entry.box })));
  const strays = topLevel.filter((entry) => entry.kind === "other")
    .map((entry) => ({ id: entry.node.id, nodeType: entry.node.type, name: entry.node.name }));
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
  // A usage's caption stands directly above it, level at the left edge, within the reach of the section's distances.
  const usagesWithoutCaption = entries.filter((entry) => entry.kind === "usage" && entry.node.type !== "TEXT" && entry.parentId !== null &&
    !entries.some((caption) => caption.kind === "usage" && caption.node.type === "TEXT" && caption.parentId === entry.parentId &&
      Math.abs(caption.box[0] - entry.box[0]) <= CAPTION_EDGE && caption.box[1] + caption.box[3] <= entry.box[1] + CAPTION_EDGE &&
      entry.box[1] - (caption.box[1] + caption.box[3]) <= CAPTION_REACH))
    .map((entry) => ({ id: entry.node.id, name: entry.node.name.slice(0, 80), in: entry.parentId }));
  // A part's section is as wide as its content and its padding, the content judged by what it draws as well as by its box (the book:
  // "A thing MUST be given room for what it draws", and the section "is as large as its content and its padding"); a top-level
  // section is as wide as the widest of the page. `align.js` reads a part's section the same way.
  const partSectionTooWide = entries.filter((entry) => entry.kind === "section" && entry.depth > 0).map((entry) => {
    const children = entries.filter((child) => child.parentId === entry.node.id);
    const right = Math.max(0, ...children.map((child) => child.node.x + child.node.width + drawnRightOf(child.node)));
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

  return {
    topLevelPairsMeeting: topLevelPairs.map((pair) => ({ pair })), strays, topLevelNotSection, meetingInSection, sectionOutOfOrder,
    outsideUnitSection, childOutsideSection, usagesWithoutCaption, partSectionTooWide,
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
