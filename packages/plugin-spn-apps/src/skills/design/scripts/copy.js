// Adds versions to a set as copies of their nearest twin, and ties again what each copy lost.
// NOT YET RUN AGAINST A FILE: only its stand-in test has run it. Send it dry first and read what it says.
//
// Passed to the Figma connector's `use_figma` as it is, or through `bundle.mjs` for the sets of a page. A
// plain script with top-level `await` and `return`, no wrapper. Fill INPUTS, change nothing else. DRY IS
// THE DEFAULT: with `dryRun: true` it changes nothing and returns the copies it would make. Run it after
// `names.js`, so that `from` is read against the names the versions then have.
//
//   copies   a list of { from, to }. `from` is a full or partial pattern of cells (`property: value`, a
//            value may be a list) that finds exactly one version, the twin. The copy's name is the twin's
//            cells with the cells of `to` laid over them.
//
// Each copy is `twin.clone()`, named, appended to the set and placed in a row under everything the set
// holds, 48 apart, from the left of the leftmost version. The set is resized to hold the row, keeping the
// room it had to the right and below; `layout.js` lays the set out afterwards. A copy whose name already
// stands in the set is `stood` and is not made again, so the script is safe to send twice.
// A twin may be a copy planned earlier in the same list: a later `from` is matched against it, and in the real
// send its node is the clone made before. Dry and real give the same names. The slot check reads the version
// that stands at the head of the chain.
// A clone loses its property ties (connector rule 10). After cloning, each layer of the twin that is tied
// to a property is compared with the layer at the same path in the copy (the path is the layer names from
// the version down, a repeated name counted in order), and the tie is made again where it differs.
//
// Before anything changes it refuses, changing nothing, when a `from` finds no version or more than one,
// when a `to` names a property the twin does not hold, when two copies would have one name, or when a
// twin holds a slot, which a clone turns into a plain frame.

const INPUTS = {
  setId: "",
  unit: "",
  copies: [],
  dryRun: true,
};

const set = await figma.getNodeByIdAsync(INPUTS.setId);
if (!set || set.type !== "COMPONENT_SET" || (INPUTS.unit && set.name !== INPUTS.unit)) {
  return { refused: `${INPUTS.setId} is not the set ${INPUTS.unit}` };
}
let page = set.parent;
while (page && page.type !== "PAGE") page = page.parent;
await figma.setCurrentPageAsync(page);

const ROW_GAP = 48;
const cellsOf = (name) => Object.fromEntries(name.split(", ").filter((cell) => cell.includes("=")).map((cell) => {
  const at = cell.indexOf("=");
  return [cell.slice(0, at), cell.slice(at + 1)];
}));
const nameOf = (cells) => Object.entries(cells).map(([property, value]) => `${property}=${value}`).join(", ");
const matches = (cells, pattern) => Object.entries(pattern || {})
  .every(([property, value]) => (Array.isArray(value) ? value : [value]).map(String).includes(cells[property]));
const laidOver = (cells, over) => ({ ...cells, ...Object.fromEntries(Object.entries(over || {}).map(([property, value]) => [property, String(value)])) });
// The layers of a version by path. A layer inside an instance belongs to that instance's component and is not walked.
const pathsOf = (root) => {
  const found = new Map();
  const walk = (parent, prefix) => {
    const seen = {};
    for (const child of parent.children || []) {
      seen[child.name] = (seen[child.name] || 0) + 1;
      const path = `${prefix}/${child.name}#${seen[child.name]}`;
      found.set(path, child);
      if (child.type !== "INSTANCE") walk(child, path);
    }
  };
  walk(root, "");
  return found;
};
const referencesOf = (layer) => {
  try { return layer.componentPropertyReferences || {}; } catch (error) { return {}; }
};

// The versions a `from` is matched against: those that stand, then each copy planned before it in this
// list, as cells with no node yet. A planned copy's `root` is the version that stands at the head of its chain.
const pool = set.children.filter((child) => child.type === "COMPONENT").map((node) => ({ node, cells: cellsOf(node.name), name: node.name, root: node }));
const problems = [];
const plans = [];
const stood = [];
const plannedNames = new Set();
for (const [at, one] of (INPUTS.copies || []).entries()) {
  let found = pool.filter((entry) => matches(entry.cells, one.from));
  if (found.length > 1) {
    // A copy made by an earlier send also matches a partial `from`; it is the twin's copy, never a twin.
    const candidates = found;
    found = candidates.filter((entry) => !candidates.some((other) => other !== entry && other.name !== entry.name && nameOf(laidOver(other.cells, one.to)) === entry.name));
  }
  if (found.length !== 1) { problems.push(`copy ${at}: \`from\` finds ${found.length} versions, not one`); continue; }
  const twin = found[0];
  const unknown = Object.keys(one.to || {}).filter((property) => !(property in twin.cells));
  if (unknown.length > 0) { problems.push(`copy ${at}: the twin [${twin.name}] holds no property ${unknown.join(", ")}`); continue; }
  const cells = laidOver(twin.cells, one.to);
  const name = nameOf(cells);
  if (plannedNames.has(name)) { if (!problems.includes(`two copies would be named [${name}]`)) problems.push(`two copies would be named [${name}]`); continue; }
  if (pool.some((entry) => entry.name === name)) { if (!stood.includes(name)) stood.push(name); continue; }
  const plan = { name, twin, root: twin.root, node: null };
  plans.push(plan);
  plannedNames.add(name);
  pool.push({ node: null, cells, name, root: twin.root, plan });
}
for (const plan of plans) {
  const slots = [...pathsOf(plan.root).entries()].filter(([path, layer]) => layer.type === "SLOT").map(([path]) => path);
  if (slots.length > 0) problems.push(`[${plan.root.name}] holds a slot (${slots[0]}), which a copy would lose`);
}
const toMake = plans;

// The row of copies and the set's new box, worked out from the twins' sizes, so that dry and real agree.
const children = set.children;
const setBoxBefore = [set.x, set.y, set.width, set.height];
const rowLeft = children.length > 0 ? Math.min(...children.map((child) => child.x)) : 0;
const rowTop = children.length > 0 ? Math.max(...children.map((child) => child.y + child.height)) + ROW_GAP : 0;
const roomRight = children.length > 0 ? Math.max(0, set.width - Math.max(...children.map((child) => child.x + child.width))) : 0;
const roomBelow = children.length > 0 ? Math.max(0, set.height - Math.max(...children.map((child) => child.y + child.height))) : 0;
let nextLeft = rowLeft;
let rowRight = 0;
let rowBottom = 0;
for (const plan of toMake) {
  plan.x = nextLeft;
  plan.y = rowTop;
  nextLeft += plan.root.width + ROW_GAP;
  rowRight = Math.max(rowRight, plan.x + plan.root.width);
  rowBottom = Math.max(rowBottom, plan.y + plan.root.height);
}
const setBoxAfter = toMake.length > 0 ? [set.x, set.y, Math.max(set.width, rowRight + roomRight), Math.max(set.height, rowBottom + roomBelow)] : setBoxBefore;

const done = {
  unit: set.name, dryRun: INPUTS.dryRun, problems, made: [], stood, tiedAgain: null,
  setBoxBefore, setBoxAfter,
};
if (problems.length > 0) return { ...done, refused: "nothing was changed: see problems" };
if (INPUTS.dryRun) return { ...done, made: toMake.map((plan) => [plan.name, null, plan.twin.name]) };

let tiedAgain = 0;
for (const plan of toMake) {
  const copy = (plan.twin.node || plan.twin.plan.node).clone();
  plan.node = copy;
  copy.name = plan.name;
  set.appendChild(copy);
  copy.x = plan.x;
  copy.y = plan.y;
  const copyLayers = pathsOf(copy);
  for (const [path, layer] of pathsOf(plan.root)) {
    const references = referencesOf(layer);
    if (Object.keys(references).length === 0) continue;
    const mine = copyLayers.get(path);
    if (!mine) { problems.push(`[${plan.name}] holds no layer at ${path} to tie again`); continue; }
    if (JSON.stringify(referencesOf(mine)) === JSON.stringify(references)) continue;
    if (mine.type === "TEXT") {
      for (const segment of mine.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(segment.fontName);
    }
    mine.componentPropertyReferences = { ...references };
    tiedAgain += 1;
  }
  done.made.push([plan.name, copy.id, plan.twin.name]);
}
if (toMake.length > 0) set.resize(setBoxAfter[2], setBoxAfter[3]);
return { ...done, tiedAgain, setBoxAfter: [set.x, set.y, set.width, set.height] };
