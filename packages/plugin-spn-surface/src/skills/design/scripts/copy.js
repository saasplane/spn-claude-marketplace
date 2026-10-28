// Adds versions to a set as copies of their nearest twin, and ties again what each copy lost.
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
// send its node is the clone made before. Dry and real give the same names. Slots are read on the version that
// stands at the head of the chain.
// A clone loses its property ties (connector rule 10). After cloning, each layer of the twin that is tied
// to a property is compared with the layer at the same path in the copy (the path is the layer names from
// the version down, a repeated name counted in order), and the tie is made again where it differs.
//
// Before anything changes it refuses, changing nothing, when a `from` finds no version or more than one,
// when a `to` names a property the twin does not hold, or when two copies would have one name.
//
// A twin that holds a slot: nobody has seen whether a clone inside a set keeps a slot, so the script finds out
// before it copies. Dry plans the copies as usual and answers `slotProbe: "owed"` with the slots' paths in
// `slots` (at most 8). Real, before any copy, clones the first such twin once as a probe, appends it to the
// set, reads whether each slot's path still holds a SLOT, and removes the probe in a `finally`. All kept:
// `slotProbe: "kept"` and the copies are made; after each copy its slots are read the same way, and a copy
// that lost one is removed, named in `problems`, and no further copy is made. A probe that lost a slot:
// `slotProbe: "lost"`, the unit is refused and nothing stays changed. A slot layer's ties are compared and
// made again like any other layer's.

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
// The slots of the versions at the head of the chains. Whether a clone keeps a slot is tried in the real send,
// with one probe, before any copy is made.
const slotsOf = (root) => [...pathsOf(root).entries()].filter(([path, layer]) => layer.type === "SLOT").map(([path]) => path);
const slotRoots = [];
for (const plan of plans) {
  if (!slotRoots.some((one) => one.root === plan.root)) {
    const slots = slotsOf(plan.root);
    if (slots.length > 0) slotRoots.push({ root: plan.root, slots });
  }
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
  setBoxBefore, setBoxAfter, slotProbe: null, slots: [...new Set(slotRoots.flatMap((one) => one.slots))].slice(0, 8),
};
if (problems.length > 0) return { ...done, refused: "nothing was changed: see problems" };
if (INPUTS.dryRun) return { ...done, slotProbe: slotRoots.length > 0 ? "owed" : null, made: toMake.map((plan) => [plan.name, null, plan.twin.name]) };

// One probe before any copy: clone the first twin that holds a slot, append it as a copy would be, read the
// slots in the clone, and remove it again whatever happens.
if (slotRoots.length > 0) {
  const probe = slotRoots[0].root.clone();
  let lost = null;
  try {
    set.appendChild(probe);
    const layers = pathsOf(probe);
    for (const path of slotRoots[0].slots) {
      const found = layers.get(path);
      if (!found || found.type !== "SLOT") { lost = `a clone turns the slot at ${path} into a ${found ? found.type : "missing layer"}`; break; }
    }
  } finally {
    probe.remove();
  }
  if (lost) {
    problems.push(`[${slotRoots[0].root.name}]: ${lost}`);
    return { ...done, slotProbe: "lost", refused: `${lost}; nothing was changed` };
  }
  done.slotProbe = "kept";
}

let tiedAgain = 0;
const madePlans = [];
for (const plan of toMake) {
  const copy = (plan.twin.node || plan.twin.plan.node).clone();
  plan.node = copy;
  copy.name = plan.name;
  set.appendChild(copy);
  copy.x = plan.x;
  copy.y = plan.y;
  const copyLayers = pathsOf(copy);
  const lostSlot = slotsOf(plan.root).find((path) => !copyLayers.get(path) || copyLayers.get(path).type !== "SLOT");
  if (lostSlot) {
    copy.remove();
    problems.push(`[${plan.name}] lost the slot at ${lostSlot}: the copy was removed and no further copy is made`);
    break;
  }
  madePlans.push(plan);
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
if (madePlans.length > 0) {
  const right = Math.max(...madePlans.map((plan) => plan.x + plan.root.width));
  const bottom = Math.max(...madePlans.map((plan) => plan.y + plan.root.height));
  set.resize(Math.max(set.width, right + roomRight), Math.max(set.height, bottom + roomBelow));
}
return { ...done, tiedAgain, setBoxAfter: [set.x, set.y, set.width, set.height] };
