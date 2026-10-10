// Reads one set, and changes nothing: its box, its default, its grid's padding and gap, its header, and a
// hash of its versions' keys and names.
//
// Passed to the Figma connector's `use_figma` through `bundle.mjs`, one run for each set of a page. The
// hash is the FNV-1a hash of the lines `key=name` of the set's versions, sorted by key and joined by a
// line break; `operations-calls.mjs` computes the same hash from the readings and the specs, so a set is proven
// to hold the versions its spec gives, each under its old key, without the names being sent back.
// `padding` is the place of the top-left version in the set. `gap` is the smallest free distance between
// two neighbouring columns of versions, or else between two rows, or else 60. With `listVersions` the
// `setLabels` are the row and column labels beside the set, which `labels.js` writes again after a layout
// and which `layout.js` therefore leaves out of its check of nodes that meet. With `listVersions` the
// answer also holds each version's key and name, which a set that gains versions needs: one hash cannot
// say which versions stood and which are new.

const INPUTS = {
  setId: "",
  listVersions: false,
};

const set = await figma.getNodeByIdAsync(INPUTS.setId);
if (!set || set.type !== "COMPONENT_SET") return { setId: INPUTS.setId, refused: "not a set" };
let page = set.parent;
while (page && page.type !== "PAGE") page = page.parent;
await figma.setCurrentPageAsync(page);

const versions = set.children.filter((child) => child.type === "COMPONENT");
const lines = versions.map((version) => `${version.key}=${version.name}`).sort().join("\n");
let hash = 0x811c9dc5;
for (let place = 0; place < lines.length; place += 1) { hash ^= lines.charCodeAt(place); hash = Math.imul(hash, 0x01000193) >>> 0; }

const freeBetween = (axis, size) => {
  const bands = new Map();
  for (const version of versions) {
    const at = Math.round(version[axis]);
    bands.set(at, Math.max(bands.get(at) ?? 0, version[size]));
  }
  const starts = [...bands.keys()].sort((one, other) => one - other);
  let least = null;
  for (let at = 0; at + 1 < starts.length; at += 1) {
    const free = starts[at + 1] - (starts[at] + bands.get(starts[at]));
    if (free > 0 && (least === null || free < least)) least = free;
  }
  return least;
};
const home = set.parent;
const header = home.children.find((child) => child.type === "TEXT" && child.characters.startsWith(set.name + " — "));
// What `layout.js` may move out of the way of a set that grows: everything else in the section but the
// header and the row and column labels of the set (those `labels.js` finds beside the set as it stands).
const middleY = (node) => node.y + node.height / 2;
// A band label (`Usage`, `Cases`, `Parts`) and a sheet's own label stand at the section's left or over a
// sheet, and are never a row or column label of the set, though a tall set reaches down beside them.
const BAND_LABELS = ["label · Usage", "label · Cases", "label · Parts"];
const isSetLabel = (node) => node.type === "TEXT" && node.name.startsWith("label · ") && !BAND_LABELS.includes(node.name) && !node.name.includes(" cases — ") && (
  (node.x + node.width <= set.x && middleY(node) >= set.y && middleY(node) <= set.y + set.height) ||
  (node.y + node.height <= set.y && node.y >= set.y - 80 && node.x >= set.x - 1 && node.x <= set.x + set.width));
const mayMove = home.type === "SECTION" ? home.children.filter((node) => node.id !== set.id && node !== header && !isSetLabel(node)).map((node) => node.id) : [];
let defaultName = null;
try { defaultName = set.defaultVariant ? set.defaultVariant.name : null; } catch (error) { defaultName = null; }

return {
  setId: set.id,
  unit: set.name,
  key: set.key,
  page: page.id,
  home: { id: home.id, type: home.type },
  box: [set.x, set.y, set.width, set.height],
  count: versions.length,
  default: defaultName,
  padding: versions.length > 0 ? [Math.min(...versions.map((version) => version.x)), Math.min(...versions.map((version) => version.y))] : null,
  gap: freeBetween("x", "width") ?? freeBetween("y", "height") ?? 60,
  header: header ? header.characters : null,
  mayMove,
  setLabels: home.type === "SECTION" ? home.children.filter((node) => node !== header && isSetLabel(node)).map((node) => node.id) : [],
  labels: home.children.filter((child) => child.type === "TEXT" && child.name.startsWith("label · ")).length,
  hash: hash.toString(16).padStart(8, "0"),
  versions: INPUTS.listVersions ? versions.map((version) => [version.key, version.name]) : null,
};
