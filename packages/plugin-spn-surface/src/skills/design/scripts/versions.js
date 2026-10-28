// Every unit of one page of a library file with each of its versions: key, name and size.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else. Never writes to the file. The agent saves each
// answer as a file, whole and exactly as returned, and runs `check-answers.mjs` over the folder: `hash`
// is the FNV-1a hash of `JSON.stringify(rows)`, so a slip made while copying an answer is found.
//
//   pageId null    lists the file's pages (id, name, index) and stops.
//   pageId "<id>"  reads the page's units, a set of components or a lone component, in the page's order,
//                  as `inventory.js` finds them.
//   from           the place of the first unit to read, among the page's units.
//   versionsFrom   the place of the first version to give of the unit at `from`.
//   The answer stops by itself before `maxBytes` or after `maxSeconds` and returns `next` and
//   `nextVersion`: pass them back as `from` and `versionsFrom`. `next` null means the page is read.
//
// The rows:
//   ["U", index, nodeId, key, name, kind, versionCount, defaultVersionName, parentName, properties]
//        once for a unit, when its first version is given. `properties` is name -> [type, default, values].
//   ["V", index, place, key, name, width, height]   one for each version
//   ["H", index, [[setName, versionName], ...]]     a lone component only: the instances it holds directly
//   ["E", index, hash]   once for a unit, after its last version: the hash of all its [key, name, width, height]

const INPUTS = {
  pageId: null,
  from: 0,
  versionsFrom: 0,
  maxBytes: 14000,
  maxSeconds: 30,
};

if (INPUTS.pageId === null) {
  return {
    script: "versions", file: figma.root.name, readAt: new Date().toISOString(),
    pages: figma.root.children.map((page, index) => ({ id: page.id, name: page.name, index })),
  };
}

const startedAt = Date.now();
const page = await figma.getNodeByIdAsync(INPUTS.pageId);
if (!page || page.type !== "PAGE") {
  return { error: `${INPUTS.pageId} is not a page` };
}
await figma.setCurrentPageAsync(page);

const fnv = (text) => {
  let hash = 0x811c9dc5;
  for (let place = 0; place < text.length; place += 1) {
    hash ^= text.charCodeAt(place);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
};
const rounded = (value) => Math.round(value * 100) / 100;

const nodes = page.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] })
  .filter((node) => node.type === "COMPONENT_SET" || !node.parent || node.parent.type !== "COMPONENT_SET");

const rows = [];
let used = 0;
let next = null;
let nextVersion = null;
const push = (row) => { rows.push(row); used += JSON.stringify(row).length + 1; };
const full = () => used > INPUTS.maxBytes || Date.now() - startedAt > INPUTS.maxSeconds * 1000;

for (let index = INPUTS.from; index < nodes.length; index += 1) {
  if (rows.length > 0 && full()) { next = index; nextVersion = 0; break; }
  const node = nodes[index];
  const isSet = node.type === "COMPONENT_SET";
  const versions = isSet ? node.children.filter((child) => child.type === "COMPONENT") : [node];
  const facts = versions.map((version) => [version.key, version.name, rounded(version.width), rounded(version.height)]);
  const first = index === INPUTS.from ? INPUTS.versionsFrom : 0;
  if (first === 0) {
    const properties = {};
    for (const [name, definition] of Object.entries(node.componentPropertyDefinitions || {})) {
      properties[name] = [definition.type, definition.defaultValue, definition.variantOptions || null];
    }
    push(["U", index, node.id, node.key, node.name, isSet ? "SET" : "COMPONENT", versions.length,
      isSet ? node.defaultVariant.name : node.name, node.parent ? node.parent.name : null, properties]);
  }
  let place = first;
  for (; place < facts.length; place += 1) {
    if (rows.length > 1 && full()) break;
    push(["V", index, place, ...facts[place]]);
  }
  if (place < facts.length) { next = index; nextVersion = place; break; }
  if (!isSet) {
    const holds = [];
    for (const instance of node.findAllWithCriteria({ types: ["INSTANCE"] })) {
      if (instance.id.startsWith("I")) continue;
      const main = await instance.getMainComponentAsync();
      if (!main) continue;
      holds.push([main.parent && main.parent.type === "COMPONENT_SET" ? main.parent.name : null, main.name]);
    }
    push(["H", index, holds]);
  }
  push(["E", index, fnv(JSON.stringify(facts))]);
}

return {
  script: "versions", file: figma.root.name, readAt: new Date().toISOString(),
  page: { id: page.id, name: page.name }, unitCount: nodes.length,
  from: INPUTS.from, versionsFrom: INPUTS.versionsFrom, next, nextVersion,
  hash: fnv(JSON.stringify(rows)), rows,
};
