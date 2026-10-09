// The row and column labels of one set, written again from the set's grid after the set has changed.
// NOT YET RUN AGAINST A FILE: only its stand-in test has run it. Send it dry first and read what it says.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else. DRY IS THE DEFAULT: with `dryRun: true` it
// changes nothing and returns the labels it would remove and write. Run it after `apply-spec.js` and
// after `layout.js` has laid the set out, because it reads the rows and columns from where the versions
// stand.
//
// A row label is a text of the unit's section named `label · …` that stands left of the set, beside it.
// A column label is one that stands above the set, over it. Each is removed, and one is written for each
// row and each column the set now has, in the style of a label that stood there. A row's label names the
// values its versions share for the properties the header's `rows:` clause names, and a column's the
// same for `columns:`; a value that is the default carries ` (default)`. A side keeps the form its labels
// had: `property=value` where they named the property, the bare values joined by ` · ` where they did not.
// The book's distances: a row label ends 24 left of the set, centred on its row; a column label stands 16
// above the set, its left edge at its column's left.
//
// It refuses, and changes nothing, when the header names no layout, when a side had no label to take the
// style from, or when the versions of a row or a column do not share one value for a named property.

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

const cellsOf = (name) => Object.fromEntries(name.split(", ").map((cell) => {
  const at = cell.indexOf("=");
  return [cell.slice(0, at), cell.slice(at + 1)];
}));
const header = home.children.find((child) => child.type === "TEXT" && child.characters.startsWith(set.name + " — "));
if (!header) return { refused: "no header text beside the set" };
// The properties a clause names, in its order: a cell `property=value` names one, a bare value does not.
const propertiesOf = (start) => {
  // The unit and ` — ` come first, so the first clause is the one after them (`rows: ...` of `DSButton — rows: ...`).
  const clause = header.characters.slice((set.name + " — ").length).split(" · ").find((one) => one.startsWith(start));
  return clause ? [...new Set([...clause.slice(start.length).matchAll(/([A-Za-z][A-Za-z0-9]*)=/g)].map((match) => match[1]))] : [];
};
const rowProperties = propertiesOf("rows: ");
const columnProperties = propertiesOf("columns: ");
const defaults = cellsOf(set.defaultVariant.name);

// The header is no label of a row or a column, though its layer may be named `label · `.
const texts = home.children.filter((child) => child.type === "TEXT" && child.name.startsWith("label · ") && child !== header);
const middle = (node, axis, size) => node[axis] + node[size] / 2;
const [oldX, oldY, oldWidth, oldHeight] = INPUTS.oldSetBox ?? [set.x, set.y, set.width, set.height];
const oldRows = texts.filter((text) => text.x + text.width <= oldX && middle(text, "y", "height") >= oldY && middle(text, "y", "height") <= oldY + oldHeight);
const oldColumns = texts.filter((text) => text.y + text.height <= oldY && text.y >= oldY - 80 && text.x >= oldX - 1 && text.x <= oldX + oldWidth);

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
const textsOf = (side, found, properties, old) => {
  if (properties.length === 0) return [];
  if (old.length === 0) { problems.push(`no ${side} label stood to take the style from`); return []; }
  const named = old[0].characters.includes("=");
  return found.map((band) => {
    const parts = properties.map((property) => {
      const values = new Set(band.versions.map((version) => cellsOf(version.name)[property]));
      if (values.size !== 1 || values.has(undefined)) problems.push(`a ${side} holds ${[...values].map((one) => one ?? "no value").join(", ")} for \`${property}\``);
      const value = [...values][0];
      return (named ? `${property}=${value}` : value) + (defaults[property] === value ? " (default)" : "");
    });
    return { band, text: parts.join(named ? ", " : " · ") };
  });
};
const rows = textsOf("row", bands("y", "height"), rowProperties, oldRows);
const columns = textsOf("column", bands("x", "width"), columnProperties, oldColumns);

const plan = { set: set.name, dryRun: INPUTS.dryRun, removed: [...oldRows, ...oldColumns].map((text) => text.characters), rows: rows.map((one) => one.text), columns: columns.map((one) => one.text), problems };
if (problems.length > 0 || INPUTS.dryRun) return plan;

const write = async (template, text) => {
  const label = template.clone();
  for (const segment of label.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(segment.fontName);
  label.characters = text;
  label.name = "label · " + text;
  return label;
};
const made = [];
for (const one of rows) {
  const label = await write(oldRows[0], one.text);
  label.x = set.x - 24 - label.width;
  label.y = set.y + one.band.at + one.band.size / 2 - label.height / 2;
  made.push(label.id);
}
for (const one of columns) {
  const label = await write(oldColumns[0], one.text);
  label.x = set.x + one.band.at;
  label.y = set.y - 16 - label.height;
  made.push(label.id);
}
for (const text of [...oldRows, ...oldColumns]) text.remove();
return { ...plan, made };
