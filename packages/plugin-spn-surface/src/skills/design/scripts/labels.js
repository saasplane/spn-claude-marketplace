// The row and column labels of one set, and its groups' titles, written again from the set's grid after the set has
// changed.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else. DRY IS THE DEFAULT: with `dryRun: true` it
// changes nothing and returns the labels it would remove and write. Run it after `apply-spec.js` and
// after `layout.js` has laid the set out, because it reads the rows and columns from where the versions
// stand.
//
// The layout is the set's section's shared plugin data (namespace `saasplane`, key `layout`), never a label's text:
// its table captioned `the set` says which props run down and which across, each group a prop and its values, the
// default first. A row's label names the one value its versions move from the default, or the default's value where
// they move none; a column's the same across; ` (default)` follows the default's value. A label names a value and no
// property: each group's title names the property (`states` for the states), a column group's title above its first
// column's label and a row group's title above the row labels.
//
// A label is a text named `label · ` and its text. The labels that stood are found beside the set, loose in the
// section or inside the plugin's frame `table · the set`; each is removed, and one is written for each row, each
// column and each group, in the style of a label that stood, in the frame it stood in. A band label and a sheet's own
// label are never a row or a column label. The book's distances: a row label ends 24 left of the set, centred on its
// row; a column label stands 24 above the set, its left edge at its column's left; a title stands 16 above its labels.
//
// A side that had no label takes the style of the other side's. It refuses, and changes nothing, when the section holds
// no layout, when no label stood on either side to take the style from, or when the versions of a row or a column do
// not move one prop of the layout's groups to one value.
//
//   oldSetBox  the set's box [x, y, width, height] before `layout.js` laid it out (its answer's
//              `setBoxBefore`). The labels that stood there are found beside that box: a set that
//              shrank no longer reaches the labels of its old rows and columns, and they would be
//              left standing. null reads them beside the set as it is now.

const INPUTS = {
  setId: "",
  dryRun: true,
  oldSetBox: null,
};

const set = await figma.getNodeByIdAsync(INPUTS.setId);
if (!set || set.type !== "COMPONENT_SET") {
  return { refused: `${INPUTS.setId} is not a set` };
}
let page = set.parent;
while (page && page.type !== "PAGE") page = page.parent;
await figma.setCurrentPageAsync(page);
const home = set.parent;

// The layout, from the section's plugin data alone.
let layout = null;
try { layout = JSON.parse(home.getSharedPluginData("saasplane", "layout") || "null"); } catch { layout = null; }
if (home.type !== "SECTION" || layout === null || layout.shape !== "set") {
  return { refused: "the set's section holds no layout of the shape `set`: a set whose section holds no layout is reported, and its labels are not written" };
}
const table = (layout.tables ?? []).find((one) => one.caption === "the set");
if (!table) return { refused: "the layout holds no table captioned `the set`" };

const cellsOf = (name) => Object.fromEntries(name.split(", ").map((cell) => {
  const at = cell.indexOf("=");
  return [cell.slice(0, at), cell.slice(at + 1)];
}));
const defaults = { ...cellsOf(set.defaultVariant.name), ...(layout.default ?? {}) };
const titleOf = (prop) => (prop === "state" ? "states" : prop);
const titles = [...table.rowGroups, ...table.columnGroups].map((group) => titleOf(group.prop));

// Where a node stands in the section's coordinates: its own place plus the places of the frames above it.
const inHome = (node) => {
  let [x, y] = [node.x, node.y];
  for (let up = node.parent; up && up !== home; up = up.parent) { x += up.x; y += up.y; }
  return { node, x, y, width: node.width, height: node.height, characters: node.characters };
};
const BAND_NAMES = ["label · Usage", "label · Cases", "label · Parts", "label · Variations"];
const frame = home.children.find((child) => child.name === "table · the set" && "findAll" in child) ?? null;
const isLabel = (child) => child.type === "TEXT" && child.name.startsWith("label · ") && !BAND_NAMES.includes(child.name) && !child.name.includes(" cases — ");
const texts = [...home.children.filter(isLabel), ...(frame ? frame.findAll(isLabel) : [])].map(inHome);
const middle = (text, axis, size) => text[axis] + text[size] / 2;
const [oldX, oldY, oldWidth, oldHeight] = INPUTS.oldSetBox ?? [set.x, set.y, set.width, set.height];
// A title names a group's prop: above the column labels, or above the row labels, beside the set.
const oldTitles = texts.filter((text) => titles.includes(text.characters) && text.y >= oldY - 160 && text.y < oldY + oldHeight && text.x <= oldX + oldWidth);
const others = texts.filter((text) => !oldTitles.includes(text));
const oldRows = others.filter((text) => text.x + text.width <= oldX && middle(text, "y", "height") >= oldY && middle(text, "y", "height") <= oldY + oldHeight);
const oldColumns = others.filter((text) => text.y + text.height <= oldY && text.y >= oldY - 80 && text.x >= oldX - 1 && text.x <= oldX + oldWidth);

const versions = set.children.filter((child) => child.type === "COMPONENT");
const bands = (axis, size) => {
  const found = [];
  for (const version of [...versions].sort((one, other) => one[axis] - other[axis])) {
    const band = found.find((one) => Math.abs(one.at - version[axis]) < 1);
    if (band) { band.versions.push(version); band.size = Math.max(band.size, version[size]); } else found.push({ at: version[axis], size: version[size], versions: [version] });
  }
  return found;
};
const problems = [];
// A band's value: the one prop of the side's groups its versions move from the default, at one value; a band that
// moves none holds the first group's default.
const valueOf = (side, band, groups) => {
  const moved = new Set(band.versions.map((version) => {
    const cells = cellsOf(version.name);
    const group = groups.find((one) => cells[one.prop] !== defaults[one.prop]) ?? groups[0];
    return `${group.prop}\u0000${cells[group.prop]}`;
  }));
  if (moved.size !== 1) {
    problems.push(`a ${side} holds ${[...moved].map((one) => one.replace("\u0000", "=")).join(", ")}, not one value of one group`);
    return null;
  }
  const [prop, value] = [...moved][0].split("\u0000");
  if (value === "undefined") {
    problems.push(`a ${side}'s versions hold no value for \`${prop}\``);
    return null;
  }
  return { prop, value, text: value + (defaults[prop] === value ? " (default)" : "") };
};
const templateOf = (old, other) => old[0] ?? other[0] ?? null;
const textsOf = (side, found, groups, old, other) => {
  if (groups.length === 0) return [];
  if (!templateOf(old, other)) { problems.push(`no label stood on either side to take the style of a ${side} label from`); return []; }
  return found.map((band) => ({ band, ...valueOf(side, band, groups) })).filter((one) => one.text !== undefined);
};
const rows = textsOf("row", bands("y", "height"), table.rowGroups, oldRows, oldColumns);
const columns = textsOf("column", bands("x", "width"), table.columnGroups, oldColumns, oldRows);
// Each group's title, at the first band of its group.
const titled = (lines) => lines.filter((one, at) => lines.findIndex((other) => other.prop === one.prop) === at).map((one) => ({ prop: one.prop, text: titleOf(one.prop), band: one.band }));
const rowTitles = titled(rows);
const columnTitles = titled(columns);

const plan = {
  set: set.name, dryRun: INPUTS.dryRun, removed: [...oldRows, ...oldColumns, ...oldTitles].map((text) => text.characters),
  rows: rows.map((one) => one.text), columns: columns.map((one) => one.text), titles: [...rowTitles, ...columnTitles].map((one) => one.text), problems,
};
if (problems.length > 0 || INPUTS.dryRun) return plan;

// A copy of a text lands on the page's top level, not beside the text it copies: it goes into the frame the template
// stood in first, and its place is set in that frame's coordinates.
const write = async (template, text, x, y) => {
  const label = template.node.clone();
  const parent = template.node.parent;
  parent.appendChild(label);
  for (const segment of label.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(segment.fontName);
  label.characters = text;
  label.name = "label · " + text;
  const origin = inHome(label);
  label.x += x(label) - origin.x;
  label.y += y(label) - origin.y;
  return label;
};
const made = [];
const rowTemplate = templateOf(oldRows, oldColumns);
const columnTemplate = templateOf(oldColumns, oldRows);
for (const one of rows) {
  made.push((await write(rowTemplate, one.text, (label) => set.x - 24 - label.width, (label) => set.y + one.band.at + one.band.size / 2 - label.height / 2)).id);
}
for (const one of columns) {
  made.push((await write(columnTemplate, one.text, () => set.x + one.band.at, (label) => set.y - 24 - label.height)).id);
}
const labelHeight = (columns.length > 0 ? columnTemplate : rowTemplate).height;
for (const one of rowTitles) {
  made.push((await write(rowTemplate, one.text, (label) => set.x - 24 - label.width, (label) => set.y + one.band.at - 16 - label.height)).id);
}
for (const one of columnTitles) {
  made.push((await write(columnTemplate, one.text, () => set.x + one.band.at, (label) => set.y - 24 - labelHeight - 16 - label.height)).id);
}
for (const text of [...oldRows, ...oldColumns, ...oldTitles]) text.node.remove();
return { ...plan, made, home: home.id };
