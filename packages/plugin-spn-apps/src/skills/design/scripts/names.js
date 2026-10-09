// Changes the names of a set's versions, and nothing else: a property renamed, a value renamed, a
// difference carried from one property into another, a property added to every version, a property taken
// out of the names. The versions keep their ids and keys, so nothing placed breaks.
//
// Passed to the Figma connector's `use_figma` as it is, or through `bundle.mjs` for the sets of a page. A
// plain script with top-level `await` and `return`, no wrapper. Fill INPUTS, change nothing else. DRY IS
// THE DEFAULT: with `dryRun: true` it changes nothing and returns the names it would write.
//
//   ops   a list of name changes, carried out in the order given. Each may hold, applied in this order:
//         renameProperty  { "<old>": "<new>" }
//         renameValue     [{ property, from, to }]
//         fold            [{ match, set }]: every version whose cells match `match` takes the cells of
//                         `set`. An empty `match` is every version. A property `set` names that the
//                         version does not hold is added to its name: `size` goes first, any other last.
//         dropProperty    ["<property>"]: its cell leaves every name.
// A pattern is `property: value`, where a value may be a list. Before anything changes it works out every
// new name and refuses, changing nothing, when two versions would have one name, when a version would
// be left with no property, or when the versions would not all hold the same properties.

const INPUTS = {
  setId: "",
  unit: "",
  ops: [],
  dryRun: true,
};

const set = await figma.getNodeByIdAsync(INPUTS.setId);
if (!set || set.type !== "COMPONENT_SET" || (INPUTS.unit && set.name !== INPUTS.unit)) {
  return { refused: `${INPUTS.setId} is not the set ${INPUTS.unit}` };
}
let page = set.parent;
while (page && page.type !== "PAGE") page = page.parent;
await figma.setCurrentPageAsync(page);

const cellsOf = (name) => Object.fromEntries(name.split(", ").filter((cell) => cell.includes("=")).map((cell) => {
  const at = cell.indexOf("=");
  return [cell.slice(0, at), cell.slice(at + 1)];
}));
const nameOf = (cells) => Object.entries(cells).map(([property, value]) => `${property}=${value}`).join(", ");
const matches = (cells, pattern) => Object.entries(pattern || {})
  .every(([property, value]) => (Array.isArray(value) ? value : [value]).map(String).includes(cells[property]));
// The cells of a version with `added` set: a property it holds keeps its place, `size` is put first, any other last.
const withCells = (cells, added) => {
  let next = { ...cells };
  for (const [property, value] of Object.entries(added)) {
    if (property in next || property !== "size") next[property] = String(value);
    else next = { size: String(value), ...next };
  }
  return next;
};

let versions = set.children.filter((child) => child.type === "COMPONENT").map((node) => ({ node, cells: cellsOf(node.name) }));
for (const op of INPUTS.ops) {
  for (const [from, to] of Object.entries(op.renameProperty || {})) {
    for (const version of versions) version.cells = Object.fromEntries(Object.entries(version.cells).map(([property, value]) => [property === from ? to : property, value]));
  }
  for (const one of op.renameValue || []) {
    for (const version of versions) if (version.cells[one.property] === String(one.from)) version.cells[one.property] = String(one.to);
  }
  for (const one of op.fold || []) {
    for (const version of versions) if (matches(version.cells, one.match)) version.cells = withCells(version.cells, one.set);
  }
  for (const property of op.dropProperty || []) {
    for (const version of versions) version.cells = Object.fromEntries(Object.entries(version.cells).filter(([name]) => name !== property));
  }
}

const problems = [];
const names = versions.map((version) => nameOf(version.cells));
const twice = [...new Set(names.filter((name, at) => names.indexOf(name) !== at))];
for (const name of twice.slice(0, 8)) problems.push(`two versions would be named [${name}]`);
if (names.includes("")) problems.push("a version would be left with no property in its name");
const held = (cells) => Object.keys(cells).sort().join(",");
const shapes = [...new Set(versions.map((version) => held(version.cells)))];
if (shapes.length > 1) problems.push(`the versions would not all hold the same properties: ${shapes.slice(0, 3).join(" | ")}`);

const changes = versions.filter((version, at) => names[at] !== version.node.name);
const done = {
  unit: set.name, dryRun: INPUTS.dryRun, versions: versions.length, renamed: changes.length, problems,
  some: changes.slice(0, 8).map((version) => [version.node.name, nameOf(version.cells)]),
  propertiesAfter: versions.length > 0 ? Object.keys(versions[0].cells) : [],
};
if (problems.length > 0 || INPUTS.dryRun) return done;

for (const version of changes) version.node.name = nameOf(version.cells);
let defaultName = null;
try { defaultName = set.defaultVariant ? set.defaultVariant.name : null; } catch (error) { defaultName = null; }
return { ...done, defaultVersion: defaultName, setKey: set.key };
