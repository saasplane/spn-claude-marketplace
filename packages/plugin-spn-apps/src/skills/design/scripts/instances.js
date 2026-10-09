// Every placed instance of one page of a Figma file, counted by the version it is an instance of.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else. Never writes to the file. The agent saves each
// answer as a file, whole and exactly as returned, and runs `check-answers.mjs` over the folder: `hash`
// is the FNV-1a hash of `JSON.stringify(rows)`, so a slip made while copying an answer is found.
//
//   pageId null    lists the file's pages (id, name, index) and stops.
//   pageId "<id>"  reads the page, one top-level node after another (a section, most often).
//   within         the id of a node to read in place of the page: its children are then the "top-level
//                  nodes". Use it for a section too large to read in one call.
//   from           the place of the first top-level node to read.
//   groupsFrom     the place of the first group to give of the node at `from`.
//   The answer stops by itself before `maxBytes` or after `maxSeconds` and returns `next` and `nextGroup`:
//   pass them back as `from` and `groupsFrom`. `next` null means everything is read.
//   `cutIn` is set when the time ran out inside one top-level node before it was read whole: nothing of
//   that node is given, and the next call passes its id as `within`.
//
// An instance counts when it was placed by hand: one inside another instance (its id begins with `I`)
// follows its parent's main component and is not counted.
//
// The rows:
//   ["T", index, nodeId, name, type, instanceCount]   once for a top-level node
//   ["G", index, key, remote, setName, versionName, owner, count, firstNodeId]
//        one for each version placed in that node, by owner. `owner` is the nearest set or component the
//        instance stands in, or else the name of the node directly under the top-level node.

const INPUTS = {
  pageId: null,
  within: null,
  from: 0,
  groupsFrom: 0,
  maxBytes: 14000,
  maxSeconds: 30,
};

if (INPUTS.pageId === null) {
  return {
    script: "instances", file: figma.root.name, readAt: new Date().toISOString(),
    pages: figma.root.children.map((page, index) => ({ id: page.id, name: page.name, index })),
  };
}

const startedAt = Date.now();
const page = await figma.getNodeByIdAsync(INPUTS.pageId);
if (!page || page.type !== "PAGE") {
  return { error: `${INPUTS.pageId} is not a page` };
}
await figma.setCurrentPageAsync(page);

const root = INPUTS.within === null ? page : await figma.getNodeByIdAsync(INPUTS.within);
if (!root || !("children" in root)) {
  return { error: `${INPUTS.within} holds no children` };
}

const fnv = (text) => {
  let hash = 0x811c9dc5;
  for (let place = 0; place < text.length; place += 1) {
    hash ^= text.charCodeAt(place);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
};
const late = () => Date.now() - startedAt > INPUTS.maxSeconds * 1000;

function ownerOf(instance, top) {
  let under = instance;
  for (let node = instance.parent; node && node.id !== top.id; node = node.parent) {
    if (node.type === "COMPONENT_SET") return node.name;
    if (node.type === "COMPONENT" && (!node.parent || node.parent.type !== "COMPONENT_SET")) return node.name;
    under = node;
  }
  return under.name;
}

const tops = root.children;
const rows = [];
let used = 0;
let next = null;
let nextGroup = null;
let cutIn = null;
const push = (row) => { rows.push(row); used += JSON.stringify(row).length + 1; };

for (let index = INPUTS.from; index < tops.length; index += 1) {
  if (rows.length > 0 && (used > INPUTS.maxBytes || late())) { next = index; nextGroup = 0; break; }
  const top = tops[index];
  const found = top.type === "INSTANCE" ? [top] : ("findAllWithCriteria" in top ? top.findAllWithCriteria({ types: ["INSTANCE"] }) : []);
  const placed = found.filter((instance) => !instance.id.startsWith("I"));
  const groups = new Map();
  let ranOut = false;
  for (const instance of placed) {
    if (late()) { ranOut = true; break; }
    const main = await instance.getMainComponentAsync();
    if (!main) continue;
    const owner = ownerOf(instance, top);
    const id = main.key + "\n" + owner;
    const group = groups.get(id);
    if (group) { group[7] += 1; continue; }
    groups.set(id, ["G", index, main.key, main.remote, main.parent && main.parent.type === "COMPONENT_SET" ? main.parent.name : null, main.name, owner, 1, instance.id]);
  }
  if (ranOut) {
    if (rows.length === 0) cutIn = top.id;
    next = index; nextGroup = 0;
    break;
  }
  const sorted = [...groups.values()].sort((one, other) => (one[2] + one[6] < other[2] + other[6] ? -1 : 1));
  const first = index === INPUTS.from ? INPUTS.groupsFrom : 0;
  if (first === 0) push(["T", index, top.id, top.name, top.type, placed.length]);
  let place = first;
  for (; place < sorted.length; place += 1) {
    if (rows.length > 1 && used > INPUTS.maxBytes) break;
    push(sorted[place]);
  }
  if (place < sorted.length) { next = index; nextGroup = place; break; }
}

return {
  script: "instances", file: figma.root.name, readAt: new Date().toISOString(),
  page: { id: page.id, name: page.name }, within: INPUTS.within, topCount: tops.length,
  from: INPUTS.from, groupsFrom: INPUTS.groupsFrom, next, nextGroup, cutIn,
  hash: fnv(JSON.stringify(rows)), rows,
};
