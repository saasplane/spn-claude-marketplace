// The alignment of one page of a library file: place the pieces of every section at the book's distances, and prove it.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and `return`, no
// wrapper. Fill INPUTS, change nothing else. It reads a page whose top level holds only sections (a section for each
// unit, a unit's parts as sections inside it) and changes only the position and size of the sections and of the
// pieces directly inside them, and the fill of a section. It never changes a set, a version, a property or a layer
// inside a set, a sheet or a sample, and never the order of the layers. One changing call at a time.
//
//   mode "plan"     dry run: the plan, nothing changed. Returns the page's content line `contentLine`, the one width
//                   `width` of every top-level section, each section's box before and after, `problems` (two things
//                   that would meet in the plan, by box and by what they draw) and `anomalies` (a node the script
//                   could not place, a caption with no thing, a thing above no band label, a fractional label size).
//        "apply"    the same plan, executed. Refuses, and changes nothing, when the plan has `problems`, or `anomalies`
//                   unless `allowAnomalies` is true. Returns what it moved, resized and filled, and the greatest change
//                   of any row or column label's offset from its set (it is 0: a label moves with its set).
//        "run"      the ledger in memory, then apply, then prove against the ledger. `bump` makes the proof fail once.
//        "ledger"   reading only: what to keep before a change. `what` is "lines" (one line for each set and lone
//                   component: id, key, name, default, size, version count, a hash of the versions' ids and keys, a hash
//                   of their names and places, a hash of the property definitions), "offsets" (each label's offset from
//                   its set) or "order" (a hash of the layers order, and with `detail` the names of every section's
//                   children).
//        "prove"    reading only: the alignment proofs, and the keys proof against `ledger`. `bump` is
//                   [nodeId, dx, dy]: it moves that node, proves, puts it back and proves again, to show a proof fails.
//   pageId         the page, which the script names and switches to
//   distances      the book's distances in px: padding 80, headerToColumns 48, band 80, labelToContent 24, gap 48,
//                  wrapAt 4000, captionGap 16, sectionGap 240
//   topFill        {r, g, b}, 0 to 1: the fill of a top-level section. partFill is null (a part's section takes the
//                  page's own background) or {r, g, b}. A dark page: topFill {r: 0.165, g: 0.165, b: 0.165}.
//   ledger         for "prove": { lines: [[id, hashOfLine]], offsets: "setId|labelId|dx|dy;...", order: "hash" },
//                  what "ledger" returns, with each line hashed
//   tolerance      px a label's offset may differ from the ledger's
//
// A section's pieces are found by name and by role. The header is the text named `header · `. The set is a component
// set, or a component whose name has no `=` (a lone unit), the topmost one. A row label is a text that ends left of the
// set within 80 px and level with its rows; a column label is a text that ends 32 px or less above the set and starts
// over it; both keep their offset from the set. `label · Cases`, `label · Samples` and `label · Parts` are the bands'
// labels. A thing (a sheet, a sample, a loose case, a part's section) belongs to the last band label above it. A text
// above a thing, the nearest, is its caption: it stands 16 above the thing, their left edges level. The things of a
// band stand in rows, their tops level, 48 apart, wrapping after `wrapAt`. A thing that draws outside its box
// (render bounds beyond its bounding box) is given room for what it draws. The page's content line is the padding and
// the widest column of row labels; every set stands on it.

const INPUTS = {
  mode: "plan",
  pageId: "",
  distances: { padding: 80, headerToColumns: 48, band: 80, labelToContent: 24, gap: 48, wrapAt: 4000, captionGap: 16, sectionGap: 240 },
  topFill: { r: 1, g: 1, b: 1 },
  partFill: null,
  ledger: null,
  bump: null,
  detail: false,
  what: "lines",
  tolerance: 1,
  allowAnomalies: false,
};

const BAND_LABEL = /^label · (Cases|Samples|Parts)$/;
const HEADER_PREFIX = "header · ";
const BAND_PREFIX_LENGTH = "label · ".length;
const ROW_LABEL_REACH = 80;
const COLUMN_LABEL_REACH = 32;
const distances = INPUTS.distances;
const page = await figma.getNodeByIdAsync(INPUTS.pageId);
await figma.setCurrentPageAsync(page);

const roundUp = Math.ceil;
const roundWhole = Math.round;
const roundHundredth = (value) => Math.round(value * 100) / 100;
const hashOf = (text) => {
  let hash = 0x811c9dc5;
  for (let at = 0; at < text.length; at += 1) { hash ^= text.charCodeAt(at); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return hash.toString(16);
};
// How far what a node draws reaches beyond its box, on each side, in whole px.
function overhangOf(node) {
  const none = { left: 0, top: 0, right: 0, bottom: 0 };
  if (node.type === "TEXT" || node.type === "SECTION") return none;
  const drawn = node.absoluteRenderBounds;
  const box = node.absoluteBoundingBox;
  if (!drawn || !box) return none;
  const whole = (value) => (value > 0.5 ? roundUp(value) : 0);
  return {
    left: whole(box.x - drawn.x), top: whole(box.y - drawn.y),
    right: whole(drawn.x + drawn.width - box.x - box.width), bottom: whole(drawn.y + drawn.height - box.y - box.height),
  };
}
const isBandLabel = (node) => node.type === "TEXT" && BAND_LABEL.test(node.name);
const isHeader = (node) => node.type === "TEXT" && node.name.startsWith(HEADER_PREFIX);
const isUnitNode = (node) => node.type === "COMPONENT_SET" || (node.type === "COMPONENT" && !node.name.includes("="));
const sectionsIn = (section) => section.children.filter((child) => child.type === "SECTION");
const sectionsWithin = (section) => [section, ...sectionsIn(section).flatMap(sectionsWithin)];
const topSections = () => page.children.filter((node) => node.type === "SECTION").sort((first, second) => first.y - second.y || first.x - second.x);

// ---- the pieces of a section, found by name and by role
const readings = new Map();
function readSection(section) {
  if (readings.has(section.id)) return readings.get(section.id);
  const children = section.children;
  const anomalies = [];
  const header = children.find(isHeader) ?? null;
  const set = children.filter(isUnitNode).sort((first, second) => first.y - second.y || first.x - second.x)[0] ?? null;
  const extraUnits = children.filter(isUnitNode).length - (set ? 1 : 0);
  const used = new Set([header, set].filter(Boolean));
  const rowLabels = [];
  const columnLabels = [];
  const notes = [];
  const bandLabels = children.filter(isBandLabel).sort((first, second) => first.y - second.y);
  bandLabels.forEach((label) => used.add(label));
  for (const text of children.filter((child) => child.type === "TEXT" && !used.has(child))) {
    const right = text.x + text.width;
    const centreY = text.y + text.height / 2;
    const bottom = text.y + text.height;
    const aboveBands = bandLabels.length === 0 || bottom <= bandLabels[0].y;
    if (set && right <= set.x + 1 && set.x - right <= ROW_LABEL_REACH && centreY >= set.y - 1 && centreY <= set.y + set.height + 1) rowLabels.push(text);
    else if (set && bottom <= set.y + 1 && set.y - bottom <= COLUMN_LABEL_REACH && text.x >= set.x - 1 && text.x <= set.x + set.width) columnLabels.push(text);
    else if (set ? bottom <= set.y + 1 && aboveBands : aboveBands) notes.push(text);
    else continue;
    used.add(text);
  }
  const bandOf = (node) => bandLabels.filter((label) => label.y <= node.y + 1).pop() ?? null;
  const bands = bandLabels.map((label) => ({ name: label.name.slice(BAND_PREFIX_LENGTH), label, things: [], texts: [] }));
  let partsWithoutLabel = null;
  const unassigned = [];
  for (const node of children.filter((child) => !used.has(child))) {
    const label = bandOf(node);
    let band = label ? bands.find((one) => one.label === label) : null;
    if (!band && node.type === "SECTION") {
      partsWithoutLabel ??= { name: "Parts", label: null, things: [], texts: [] };
      band = partsWithoutLabel;
    }
    if (!band) { unassigned.push(`${node.id} ${node.name.slice(0, 30)}`); continue; }
    (node.type === "TEXT" ? band.texts : band.things).push(node);
  }
  if (partsWithoutLabel) bands.push(partsWithoutLabel);
  const orphans = [];
  for (const band of bands) {
    band.entries = band.things.map((thing) => ({ thing, captions: [] }));
    for (const text of band.texts) {
      let best = null;
      let bestScore = Infinity;
      for (const entry of band.entries) {
        const gap = entry.thing.y - (text.y + text.height);
        if (gap < -2 || !(text.x < entry.thing.x + entry.thing.width && text.x + text.width > entry.thing.x - 160)) continue;
        const score = gap + 2 * Math.abs(text.x - entry.thing.x);
        if (score < bestScore) { bestScore = score; best = entry; }
      }
      if (best) best.captions.push(text);
      else { band.entries.push({ thing: text, captions: [], orphan: true }); orphans.push(`${text.id} ${text.name.slice(0, 30)}`); }
    }
    for (const entry of band.entries) entry.captions.sort((first, second) => first.y - second.y);
    const top = (entry) => (entry.captions.length > 0 ? entry.captions[0].y : entry.thing.y);
    band.entries.sort((first, second) => (Math.abs(top(first) - top(second)) > 8 ? top(first) - top(second) : first.thing.x - second.thing.x));
  }
  if (extraUnits > 0) anomalies.push(`more than one set-like node in ${section.name}`);
  if (unassigned.length > 0) anomalies.push(`above no band label in ${section.name}: ${unassigned.join(" | ")}`);
  if (orphans.length > 0) anomalies.push(`caption with no thing in ${section.name}: ${orphans.join(" | ")}`);
  const leftExtent = rowLabels.length > 0 ? set.x - Math.min(...rowLabels.map((label) => label.x)) : 0;
  const reading = { section, header, set, rowLabels, columnLabels, notes, bands, anomalies, leftExtent };
  readings.set(section.id, reading);
  return reading;
}
const everySection = topSections().flatMap(sectionsWithin);
const contentLine = distances.padding + Math.max(0, ...everySection.map((section) => readSection(section).leftExtent));

// ---- the plan: pure; positions are in each section's own coordinates
// An operation is { node, x, y } (move) or { node, width, height } (resize).
function planSection(section) {
  const reading = readSection(section);
  const operations = [];
  const rectangles = [];
  const notes = [];
  const place = (node, x, y, overhang = { left: 0, top: 0, right: 0, bottom: 0 }) => {
    operations.push({ node, x, y });
    rectangles.push([node.id, x - overhang.left, y - overhang.top, node.width + overhang.left + overhang.right, node.height + overhang.top + overhang.bottom]);
  };
  let right = distances.padding;
  let bottom = null;
  if (reading.header) {
    place(reading.header, distances.padding, distances.padding);
    right = Math.max(right, distances.padding + roundUp(reading.header.width));
    bottom = distances.padding + roundUp(reading.header.height);
  }
  if (reading.notes.length > 0) {
    let x = distances.padding;
    const y = bottom === null ? distances.padding : bottom + distances.captionGap;
    let tallest = 0;
    for (const note of reading.notes) {
      place(note, x, y);
      x += roundUp(note.width) + distances.gap;
      tallest = Math.max(tallest, roundUp(note.height));
      right = Math.max(right, x - distances.gap);
    }
    bottom = y + tallest;
  }
  const groupTop = bottom === null ? distances.padding : bottom + distances.headerToColumns;
  if (reading.set) {
    const set = reading.set;
    const overhang = overhangOf(set);
    const labelsAbove = reading.columnLabels.length > 0 ? roundUp(set.y - Math.min(...reading.columnLabels.map((label) => label.y))) : 0;
    const setTop = groupTop + labelsAbove;
    place(set, contentLine, setTop, overhang);
    right = Math.max(right, contentLine + roundUp(set.width) + overhang.right);
    let groupBottom = setTop + roundUp(set.height) + overhang.bottom;
    for (const label of reading.rowLabels) {
      const y = roundWhole(setTop + (label.y - set.y));
      place(label, roundWhole(contentLine + (label.x - set.x)), y);
      groupBottom = Math.max(groupBottom, y + roundUp(label.height));
    }
    for (const label of reading.columnLabels) {
      const x = roundWhole(contentLine + (label.x - set.x));
      place(label, x, roundWhole(setTop + (label.y - set.y)));
      right = Math.max(right, x + roundUp(label.width));
    }
    bottom = groupBottom;
  }
  for (const band of reading.bands) {
    const labelTop = bottom === null ? distances.padding : bottom + distances.band;
    let rowTop = labelTop;
    if (band.label) {
      place(band.label, distances.padding, labelTop);
      right = Math.max(right, distances.padding + roundUp(band.label.width));
      rowTop = labelTop + roundUp(band.label.height) + distances.labelToContent;
    }
    const members = band.entries.map((entry) => {
      const part = entry.thing.type === "SECTION" ? planSection(entry.thing) : null;
      if (part) { operations.push(...part.operations); notes.push(...part.notes); }
      const overhang = overhangOf(entry.thing);
      const width = part ? part.width : roundUp(entry.thing.width);
      const height = part ? part.height : roundUp(entry.thing.height);
      const captionHeights = entry.captions.map((caption) => roundUp(caption.height));
      const captionWidth = entry.captions.length > 0 ? Math.max(...entry.captions.map((caption) => roundUp(caption.width))) : 0;
      const gapAbove = Math.max(distances.captionGap, overhang.top + 2);
      const captionBlock = entry.captions.length > 0 ? captionHeights.reduce((sum, one) => sum + one, 0) + distances.captionGap * (entry.captions.length - 1) + gapAbove : 0;
      return { entry, part, overhang, width, height, gapAbove, captionHeights, captionWidth, captionBlock };
    });
    const lines = [[]];
    let previous = null;
    for (const member of members) {
      let line = lines[lines.length - 1];
      const firstX = () => Math.max(contentLine, member.overhang.left + 24);
      let x = line.length > 0 ? previous.right + distances.gap + member.overhang.left : firstX();
      if (line.length > 0 && Math.max(x + member.width + member.overhang.right, x + member.captionWidth) - contentLine > distances.wrapAt) {
        lines.push([]);
        line = lines[lines.length - 1];
        x = firstX();
      }
      member.x = x;
      member.right = Math.max(x + member.width + member.overhang.right, x + member.captionWidth);
      line.push(member);
      previous = member;
      right = Math.max(right, member.right);
    }
    for (const line of lines.filter((one) => one.length > 0)) {
      const top = rowTop + Math.max(...line.map((member) => Math.max(member.captionBlock, member.overhang.top)));
      let lowest = 0;
      for (const member of line) {
        const thing = member.entry.thing;
        if (member.part) {
          operations.push({ node: thing, x: member.x, y: top });
          rectangles.push([thing.id, member.x, top, member.width, member.height]);
        } else {
          place(thing, member.x, top, member.overhang);
        }
        let captionBottom = top - member.gapAbove;
        for (let at = member.entry.captions.length - 1; at >= 0; at -= 1) {
          captionBottom -= member.captionHeights[at];
          place(member.entry.captions[at], member.x, captionBottom);
          captionBottom -= distances.captionGap;
        }
        lowest = Math.max(lowest, member.height + member.overhang.bottom);
      }
      bottom = top + lowest;
      rowTop = bottom + distances.gap;
    }
  }
  if (bottom === null) bottom = distances.padding;
  const width = right + distances.padding;
  const height = bottom + distances.padding;
  const problems = [];
  for (let first = 0; first < rectangles.length; first += 1) {
    for (let second = first + 1; second < rectangles.length; second += 1) {
      const [idA, xA, yA, widthA, heightA] = rectangles[first];
      const [idB, xB, yB, widthB, heightB] = rectangles[second];
      if (xA < xB + widthB - 0.01 && xB < xA + widthA - 0.01 && yA < yB + heightB - 0.01 && yB < yA + heightA - 0.01) problems.push(`${section.name}: ${idA} meets ${idB}`);
    }
  }
  notes.push(...problems.map((problem) => `PLAN MEETING ${problem}`), ...reading.anomalies);
  operations.push({ node: section, width, height });
  return { width, height, operations, notes };
}

const sameColour = (fills, colour) => fills && fills.length === 1 && fills[0].type === "SOLID" &&
  Math.abs(fills[0].color.r - colour.r) < 0.003 && Math.abs(fills[0].color.g - colour.g) < 0.003 && Math.abs(fills[0].color.b - colour.b) < 0.003 &&
  (fills[0].opacity === undefined || fills[0].opacity === 1);
const pageBackground = page.backgrounds?.[0]?.type === "SOLID" ? page.backgrounds[0].color : { r: 0.96, g: 0.96, b: 0.96 };
const partColour = INPUTS.partFill ?? pageBackground;

// The sections stand in one column, 240 apart, all as wide as the widest.
function planPage() {
  const sections = topSections();
  const plans = sections.map(planSection);
  const pageWidth = Math.max(...plans.map((plan) => plan.width));
  const operations = [];
  const notes = [];
  const boxes = [];
  let top = 0;
  sections.forEach((section, at) => {
    const plan = plans[at];
    operations.push(...plan.operations.filter((one) => !(one.node === section && one.width !== undefined)), { node: section, x: 0, y: top }, { node: section, width: pageWidth, height: plan.height });
    boxes.push({ id: section.id, name: section.name, from: [section.x, section.y, section.width, section.height].map(roundHundredth), to: [0, top, pageWidth, plan.height] });
    notes.push(...plan.notes);
    top += plan.height + distances.sectionGap;
  });
  return { operations, notes, boxes, pageWidth };
}

// ---- the ledger: what a change must leave as it was
const lineOf = (node) => {
  const versions = node.type === "COMPONENT_SET" ? node.children : [];
  return [
    node.id, node.key, node.name, node.type === "COMPONENT_SET" ? node.defaultVariant.name : null, roundHundredth(node.width), roundHundredth(node.height), versions.length,
    hashOf(versions.map((version) => `${version.id}|${version.key}`).join("\n")),
    hashOf(versions.map((version) => `${version.name}|${roundHundredth(version.x)}|${roundHundredth(version.y)}`).join("\n")),
    hashOf(JSON.stringify(node.componentPropertyDefinitions)),
  ];
};
const liveLines = () => [
  ...page.findAllWithCriteria({ types: ["COMPONENT_SET"] }),
  ...page.findAllWithCriteria({ types: ["COMPONENT"] }).filter((component) => component.parent.type !== "COMPONENT_SET"),
].sort((first, second) => (first.id < second.id ? -1 : 1)).map(lineOf);
const hashedLines = () => liveLines().map((line) => [...line, hashOf(JSON.stringify(line))]);
const idsBelow = (section) => [section.id, ...section.children.flatMap((child) => (child.type === "SECTION" ? idsBelow(child) : [child.id]))];
const offsetsText = () => everySection.flatMap((section) => {
  const reading = readSection(section);
  return [...reading.rowLabels, ...reading.columnLabels].map((label) => [reading.set.id, label.id, roundHundredth(label.x - reading.set.x), roundHundredth(label.y - reading.set.y)].join("|"));
}).join(";");

async function planMode(apply) {
  const plan = planPage();
  const wantedPlace = new Map();
  const wantedSize = new Map();
  for (const operation of plan.operations.filter((one) => one.node.type === "SECTION")) {
    if (operation.width !== undefined) wantedSize.set(operation.node.id, [operation.width, operation.height]);
    else wantedPlace.set(operation.node.id, [operation.x, operation.y]);
  }
  const changed = everySection.filter((section) => {
    const place = wantedPlace.get(section.id);
    const size = wantedSize.get(section.id);
    return (place && (Math.abs(place[0] - section.x) > 0.001 || Math.abs(place[1] - section.y) > 0.001)) ||
      (size && (Math.abs(size[0] - section.width) > 0.001 || Math.abs(size[1] - section.height) > 0.001));
  });
  const fractional = [];
  for (const section of everySection) {
    const reading = readSection(section);
    const labels = [reading.header, ...reading.rowLabels, ...reading.columnLabels, ...reading.notes, ...reading.bands.map((band) => band.label), ...reading.bands.flatMap((band) => band.texts)];
    for (const label of labels.filter(Boolean)) {
      if (Math.abs(label.width - roundWhole(label.width)) > 0.001 || Math.abs(label.height - roundWhole(label.height)) > 0.001) fractional.push(`${label.id} ${roundHundredth(label.width)}x${roundHundredth(label.height)}`);
    }
  }
  const result = {
    page: page.name, contentLine, width: plan.pageWidth, sections: plan.boxes, sectionsCount: everySection.length, sectionsChanged: changed.length,
    nodesPlaced: plan.operations.filter((one) => one.node.type !== "SECTION" || one.width === undefined).length,
    problems: plan.notes.filter((note) => note.startsWith("PLAN MEETING")),
    anomalies: plan.notes.filter((note) => !note.startsWith("PLAN MEETING")).concat(fractional.length > 0 ? [`fractional label sizes: ${fractional.join(" | ")}`] : []),
  };
  if (!apply) return result;
  if (result.problems.length > 0 || (result.anomalies.length > 0 && !INPUTS.allowAnomalies)) {
    return { refused: "the plan has things that meet, or things it could not place; nothing applied", ...result };
  }
  const offsetsBefore = new Map();
  for (const section of everySection) {
    const reading = readSection(section);
    for (const label of [...reading.rowLabels, ...reading.columnLabels]) offsetsBefore.set(label.id, [label.x - reading.set.x, label.y - reading.set.y]);
  }
  let moved = 0;
  let resized = 0;
  for (const operation of plan.operations) {
    const node = operation.node;
    if (operation.width !== undefined) {
      if (Math.abs(node.width - operation.width) > 0.001 || Math.abs(node.height - operation.height) > 0.001) { node.resizeWithoutConstraints(operation.width, operation.height); resized += 1; }
    } else if (Math.abs(node.x - operation.x) > 0.001 || Math.abs(node.y - operation.y) > 0.001) {
      node.x = operation.x;
      node.y = operation.y;
      moved += 1;
    }
  }
  let filled = 0;
  for (const section of everySection) {
    const wanted = section.parent === page ? INPUTS.topFill : partColour;
    if (!sameColour(section.fills, wanted)) { section.fills = [{ type: "SOLID", color: { r: wanted.r, g: wanted.g, b: wanted.b } }]; filled += 1; }
  }
  let greatestChange = 0;
  for (const section of everySection) {
    const reading = readSection(section);
    for (const label of [...reading.rowLabels, ...reading.columnLabels]) {
      const before = offsetsBefore.get(label.id);
      greatestChange = Math.max(greatestChange, Math.abs(label.x - reading.set.x - before[0]), Math.abs(label.y - reading.set.y - before[1]));
    }
  }
  return { ...result, applied: true, nodesMoved: moved, nodesResized: resized, filled, greatestLabelOffsetChange: roundHundredth(greatestChange) };
}

if (INPUTS.mode === "plan") return await planMode(false);
if (INPUTS.mode === "apply") return await planMode(true);
if (INPUTS.mode === "ledger") {
  if (INPUTS.what === "lines") return { page: page.name, lines: liveLines(), top: page.children.map((node) => [node.id, node.type, roundHundredth(node.x), roundHundredth(node.y), roundHundredth(node.width), roundHundredth(node.height)]) };
  if (INPUTS.what === "offsets") return { offsets: offsetsText() };
  const ids = topSections().flatMap(idsBelow);
  const result = { order: hashOf(ids.join(",")), count: ids.length, topIds: topSections().map((section) => `${section.id} ${section.name}`) };
  if (INPUTS.detail) result.names = everySection.map((section) => `${section.name} [${section.id}]: ${section.children.map((child) => child.name.slice(0, 22)).join(" / ")}`);
  return result;
}

// ---- the proof
const isWhole = (value) => Math.abs(value - roundWhole(value)) < 0.001;
const meetsBy = (first, second, slack) => first.x < second.x + second.width - slack && second.x < first.x + first.width - slack &&
  first.y < second.y + second.height - slack && second.y < first.y + first.height - slack;
const rectOfRender = (node) => (node.type !== "SECTION" && node.absoluteRenderBounds ? node.absoluteRenderBounds : node.absoluteBoundingBox);

function proveRun() {
  const fails = [];
  const counts = {};
  const ledger = INPUTS.ledger;
  if (ledger?.lines) {
    const wanted = new Map(ledger.lines.map((line) => [line[0], line[1]]));
    const got = hashedLines();
    if (got.length !== wanted.size) fails.push(`component count ${got.length} vs ledger ${wanted.size}`);
    for (const line of got) {
      const want = wanted.get(line[0]);
      const hashed = line[line.length - 1];
      if (want === undefined) fails.push(`not in ledger ${line[0]}`);
      else if (hashed !== want) fails.push(`key, id, name, default, size or hash differs ${line[0]} ${line[2]}`);
    }
    counts.components = got.length;
  }
  readings.clear();
  const sections = topSections();
  const notSections = page.children.filter((node) => node.type !== "SECTION").map((node) => node.id);
  if (notSections.length > 0) fails.push(`top level holds non-sections: ${notSections.join(",")}`);
  counts.top = page.children.length;
  const firstWidth = sections[0].width;
  let expectedTop = 0;
  for (const section of sections) {
    if (Math.abs(section.width - firstWidth) > 0.01) fails.push(`width ${section.name} ${roundHundredth(section.width)} vs ${roundHundredth(firstWidth)}`);
    if (Math.abs(section.x) > 0.01) fails.push(`x ${section.name} ${roundHundredth(section.x)}`);
    if (Math.abs(section.y - expectedTop) > 0.01) fails.push(`y ${section.name} ${roundHundredth(section.y)} vs ${expectedTop}`);
    expectedTop = section.y + section.height + distances.sectionGap;
  }
  counts.width = roundHundredth(firstWidth);
  const every = sections.flatMap(sectionsWithin);
  counts.sections = every.length;
  const line = distances.padding + Math.max(0, ...every.map((section) => readSection(section).leftExtent));
  counts.contentLine = line;
  let sets = 0, headers = 0, bandLabels = 0, items = 0, wholeChecked = 0;
  for (const section of every) {
    const reading = readSection(section);
    const isTop = section.parent === page;
    wholeChecked += 1;
    if (![section.x, section.y, section.width, section.height].every(isWhole)) fails.push(`not whole section ${section.name} ${[section.x, section.y, section.width, section.height].map(roundHundredth).join(",")}`);
    if (reading.set) {
      sets += 1;
      wholeChecked += 1;
      if (Math.abs(reading.set.x - line) > 0.01) fails.push(`set x ${reading.set.name} at ${roundHundredth(reading.set.x)} not content line ${line}${isTop ? " (top level)" : ` (inside ${section.name})`}`);
      if (!isWhole(reading.set.x) || !isWhole(reading.set.y)) fails.push(`set position not whole ${reading.set.name}`);
      if (reading.header && reading.notes.length === 0) {
        const groupTop = reading.set.y - (reading.columnLabels.length > 0 ? Math.max(...reading.columnLabels.map((label) => reading.set.y - label.y)) : 0);
        const gap = groupTop - (reading.header.y + reading.header.height);
        if (Math.abs(gap - distances.headerToColumns) > 0.51) fails.push(`header to column labels is not ${distances.headerToColumns} in ${section.name}: ${roundHundredth(gap)}`);
      }
    }
    if (reading.header) {
      headers += 1;
      wholeChecked += 1;
      if (Math.abs(reading.header.x - distances.padding) > 0.01 || Math.abs(reading.header.y - distances.padding) > 0.01) fails.push(`header not at the padding in ${section.name}: ${roundHundredth(reading.header.x)},${roundHundredth(reading.header.y)}`);
      if (![reading.header.x, reading.header.y, reading.header.width, reading.header.height].every(isWhole)) fails.push(`header not whole ${section.name}`);
    }
    let previousBottom = null;
    if (reading.set) {
      previousBottom = reading.set.y + reading.set.height + overhangOf(reading.set).bottom;
      for (const label of reading.rowLabels) previousBottom = Math.max(previousBottom, label.y + label.height);
    } else if (reading.header) {
      previousBottom = reading.header.y + reading.header.height;
    }
    for (const band of reading.bands) {
      if (band.label) {
        bandLabels += 1;
        wholeChecked += 1;
        if (Math.abs(band.label.x - distances.padding) > 0.01) fails.push(`band label x ${band.label.name} in ${section.name} ${roundHundredth(band.label.x)}`);
        if (![band.label.x, band.label.y, band.label.width, band.label.height].every(isWhole)) fails.push(`band label not whole ${band.label.name} in ${section.name}`);
        if (previousBottom !== null && Math.abs(band.label.y - previousBottom - distances.band) > 0.51) fails.push(`gap above ${band.label.name} in ${section.name} is ${roundHundredth(band.label.y - previousBottom)} not ${distances.band}`);
      }
      const tops = new Set();
      for (const entry of band.entries) {
        items += 1;
        const thing = entry.thing;
        wholeChecked += 1;
        if (!isWhole(thing.x) || !isWhole(thing.y)) fails.push(`band item not whole ${thing.id} ${thing.name.slice(0, 20)} ${roundHundredth(thing.x)},${roundHundredth(thing.y)}`);
        if ((thing.type === "SECTION" || thing.type === "TEXT") && (!isWhole(thing.width) || !isWhole(thing.height))) fails.push(`band item size not whole ${thing.id}`);
        for (const caption of entry.captions) {
          if (![caption.x, caption.y, caption.width, caption.height].every(isWhole)) fails.push(`caption not whole ${caption.id}`);
          if (Math.abs(caption.x - thing.x) > 0.01) fails.push(`caption ${caption.id} not level with its thing at the left`);
        }
        tops.add(roundHundredth(thing.y));
      }
      const rowsByTop = new Map();
      for (const entry of band.entries) {
        const top = roundHundredth(entry.thing.y);
        rowsByTop.set(top, [...(rowsByTop.get(top) ?? []), entry]);
      }
      for (const row of rowsByTop.values()) {
        row.sort((first, second) => first.thing.x - second.thing.x);
        let previousExtent = null;
        for (const entry of row) {
          const thing = entry.thing;
          const overhang = overhangOf(thing);
          const captionWidth = entry.captions.length > 0 ? Math.max(...entry.captions.map((caption) => caption.width)) : 0;
          if (previousExtent === null) {
            const firstX = Math.max(line, overhang.left + 24);
            if (Math.abs(thing.x - firstX) > 0.01) fails.push(`first item of a row in ${section.name} ${band.name} at x ${roundHundredth(thing.x)} not ${firstX}: ${thing.id}`);
          } else if (Math.abs((thing.x - overhang.left) - previousExtent - distances.gap) > 0.51) {
            fails.push(`gap before ${thing.id} in ${section.name} ${band.name} is ${roundHundredth((thing.x - overhang.left) - previousExtent)} not ${distances.gap}`);
          }
          previousExtent = Math.max(thing.x + thing.width + overhang.right, thing.x + captionWidth);
        }
      }
      const sortedTops = [...tops].sort((first, second) => first - second);
      for (let at = 1; at < sortedTops.length; at += 1) {
        if (sortedTops[at] - sortedTops[at - 1] < 40) fails.push(`tops nearly but not level in ${section.name} band ${band.name}: ${sortedTops[at - 1]} / ${sortedTops[at]}`);
      }
      if (band.label && band.entries.length > 0) {
        const first = Math.min(...band.entries.map((entry) => Math.min(entry.captions.length > 0 ? entry.captions[0].y : Infinity, entry.thing.y - overhangOf(entry.thing).top)));
        if (Math.abs(first - (band.label.y + band.label.height) - distances.labelToContent) > 0.51) fails.push(`band label to content is ${roundHundredth(first - band.label.y - band.label.height)} not ${distances.labelToContent} in ${section.name} ${band.name}`);
      }
      for (const entry of band.entries) previousBottom = Math.max(previousBottom ?? 0, entry.thing.y + entry.thing.height + overhangOf(entry.thing).bottom);
    }
    // tight: the section is as high as its lowest content and the padding; a part's section as wide as its rightmost
    let lowest = 0;
    let rightmost = 0;
    for (const child of section.children) {
      const overhang = overhangOf(child);
      lowest = Math.max(lowest, child.y + child.height + overhang.bottom);
      rightmost = Math.max(rightmost, child.x + child.width + overhang.right);
    }
    if (Math.abs(lowest + distances.padding - section.height) > 0.999) fails.push(`height of ${section.name} ${roundHundredth(section.height)} is not the content (${roundHundredth(lowest)}) plus padding`);
    if (!isTop && Math.abs(rightmost + distances.padding - section.width) > 0.999) fails.push(`width of ${section.name} ${roundHundredth(section.width)} is not the content (${roundHundredth(rightmost)}) plus padding`);
    if (isTop && rightmost + distances.padding > section.width + 0.51) fails.push(`content of ${section.name} reaches past its width`);
    if (!isTop) { if (!sameColour(section.fills, partColour)) fails.push(`part fill ${section.name}`); }
    else if (!sameColour(section.fills, INPUTS.topFill)) fails.push(`top fill ${section.name}`);
    // nothing meets, and nothing lies outside, by box and by what it draws
    const children = section.children;
    for (let first = 0; first < children.length; first += 1) {
      const one = children[first];
      const drawn = rectOfRender(one);
      const room = section.absoluteBoundingBox;
      if (drawn && room && (drawn.x < room.x - 0.5 || drawn.y < room.y - 0.5 || drawn.x + drawn.width > room.x + room.width + 0.5 || drawn.y + drawn.height > room.y + room.height + 0.5)) fails.push(`outside ${section.name}: ${one.id}`);
      for (let second = first + 1; second < children.length; second += 1) {
        const other = children[second];
        if (meetsBy(one.absoluteBoundingBox, other.absoluteBoundingBox, 0.01)) fails.push(`boxes meet in ${section.name}: ${one.id} / ${other.id}`);
        const otherDrawn = rectOfRender(other);
        if (drawn && otherDrawn && meetsBy(drawn, otherDrawn, 0.5)) fails.push(`drawings meet in ${section.name}: ${one.id} / ${other.id}`);
      }
    }
  }
  Object.assign(counts, { sets, headers, bandLabels, bandItems: items, wholeChecked });
  if (ledger?.offsets) {
    const now = new Map();
    for (const section of every) {
      const reading = readSection(section);
      for (const label of [...reading.rowLabels, ...reading.columnLabels]) now.set(label.id, [reading.set.id, label.x - reading.set.x, label.y - reading.set.y]);
    }
    let agreeing = 0;
    const entries = ledger.offsets.split(";").filter(Boolean);
    for (const entry of entries) {
      const [setId, labelId, dx, dy] = entry.split("|");
      const found = now.get(labelId);
      if (!found || found[0] !== setId) { fails.push(`label ${labelId} no longer tied to ${setId}`); continue; }
      if (Math.abs(found[1] - Number(dx)) > INPUTS.tolerance || Math.abs(found[2] - Number(dy)) > INPUTS.tolerance) fails.push(`label ${labelId} offset moved by ${roundHundredth(found[1] - Number(dx))},${roundHundredth(found[2] - Number(dy))}`);
      else agreeing += 1;
    }
    counts.labelOffsetsKept = `${agreeing} of ${entries.length}`;
  }
  if (ledger?.order) {
    if (hashOf(sections.flatMap(idsBelow).join(",")) !== ledger.order) fails.push("layers order differs from the ledger");
    else counts.layersOrder = "same";
  }
  return { counts, fails };
}

// Moves a node, proves, puts it back, and returns what failed with the node moved.
async function provedWithBump() {
  const [nodeId, dx, dy] = INPUTS.bump;
  const node = await figma.getNodeByIdAsync(nodeId);
  node.x += dx;
  node.y += dy;
  readings.clear();
  const moved = proveRun();
  node.x -= dx;
  node.y -= dy;
  readings.clear();
  return moved;
}

if (INPUTS.mode === "prove") {
  if (INPUTS.bump) {
    const moved = await provedWithBump();
    return { seenToFail: moved.fails.slice(0, 6), failCountWhenMoved: moved.fails.length, ...proveRun() };
  }
  return proveRun();
}
if (INPUTS.mode === "run") {
  const snapshot = { lines: hashedLines().map((line) => [line[0], line[line.length - 1]]), offsets: offsetsText(), order: hashOf(topSections().flatMap(idsBelow).join(",")) };
  const applied = await planMode(true);
  if (!applied.applied) return applied;
  INPUTS.ledger = snapshot;
  readings.clear();
  if (INPUTS.bump) {
    const moved = await provedWithBump();
    applied.seenToFail = moved.fails.slice(0, 5);
    applied.failCountWhenMoved = moved.fails.length;
  }
  applied.proof = proveRun();
  applied.ledger = hashedLines();
  applied.snapshot = { components: snapshot.lines.length, offsets: snapshot.offsets.split(";").filter(Boolean).length, order: snapshot.order };
  return applied;
}
return { error: `unknown mode ${INPUTS.mode}` };
