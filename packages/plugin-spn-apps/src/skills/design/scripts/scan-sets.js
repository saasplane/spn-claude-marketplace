// The scan before a publish, part 4 of 4: the sets, their cases and the references of their versions.
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
// Holds: versionsOutside, versionPairsMeeting, emptyVersions, defaultNamedProperties, unreadableSets, setsOverLimit, emptyCases, badCaseNames, duplicateCaseNames, versionNotWired, versionDiffersFromDefault, versionSlotIsFrame, versionTiedToAnotherProperty, propertyTiedToNothing, crossedBeyondTheRule.
//          These do not block: emptyVersions, emptyCases, versionSlotIsFrame, versionDiffersFromDefault. This part reads sets and lone components only, so it
//          carries no label form.
//
// `crossedBeyondTheRule` blocks: a set crosses its `size`, the shared `variant` and its states (the list `STATE_PROPERTIES`), and
// every other property is a case on the unit's sheet. A set is named, with the property, its default and the values that
// multiply it, when it holds a variant property outside that rule and some value of it other than the default is held by more than
// one version. A property whose every other value is held by exactly one version is drawn once and passes. A property in
// `PROPERTIES_A_SPEC_KEEPS_CROSSED` is a known exception, awaiting the developer's ruling: it is not named, and the answer's
// `passedByException` counts the sets that pass only because of that list. A property in `PROPERTIES_A_UNIT_KEEPS_CROSSED`, a
// list of unit name to property names that the book states, passes for its own unit only and is counted the same way.
//
// `versionNotWired` blocks: in a set of more than one version, a layer path that holds a `componentPropertyReferences` entry
// (`characters`, `visible`, `mainComponent`, `slotContentId`) in any version, on a node of one type, is wired for that kind; a
// version is named, with the count of missing references, its first paths (`pathsNamed`, 3 by default; raise it to be given
// all), `plain` and `changesDrawing` (how many ties would leave the drawing as it is, and how many would change it: the layer
// differs from the default of the property a tie would use, in visibility, text or main component), `changing` (those paths)
// and `nearest` (the wired version that holds every missing reference, a twin one variant value apart first, else the fewest
// values apart; null when none holds them all; its absence excuses nothing), when its node at that path, of that type, lacks
// the kind. A version that ties the same property on another layer (the tie moved by design), a version with no node at the
// path and a set with no reference at all are not named. A version all of whose missing ties would change what is drawn is
// `versionDiffersFromDefault` instead, which does not block: a person judges it, a state by design or a version to repair by
// hand. `versionTiedToAnotherProperty` blocks: where a path is tied in several versions to different properties, a version off
// the most common one is named with the path, the key it holds and the key the others hold, unless one variant of the set
// explains the split (every version with one of its values holds one key there, and each value that holds a key is held by at
// least two versions, since a lone version cannot establish a pattern); otherwise `nearestVariant` is the variant with the
// fewest values that hold both keys (`valuesHoldingBoth`), for a person to judge. `propertyTiedToNothing` blocks: a set's or
// lone component's definition, not a VARIANT, that no layer of any version references (an instance's layers are not
// entered), with the unit, the property's name and key and its type. A node of another type than the wired ones is
// `versionSlotIsFrame`, which does not block (a FRAME where another version has a SLOT).
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
  maxVersions: 1000,
  pathsNamed: 3,
};

const PART = "sets";
const NOT_BLOCKING = ["emptyVersions", "emptyCases", "versionSlotIsFrame", "versionDiffersFromDefault"];
// The book's rule for what a set crosses: its `size`, the shared `variant` and its states; every other property is a case
// on the unit's sheet. A property outside the rule that is "drawn once" (every value but the default is held by one
// version) multiplies nothing and passes.
const SIZE_PROPERTY = "size";
const SHARED_VARIANT_PROPERTY = "variant";
// A state is what a unit is in, as the showcase's States section states it (default, disabled, working, error, empty, read
// only, open, checked, selected, no permission). A choice that a caller makes with a prop is a case, never a state.
const STATE_PROPERTIES = [
  "checked", "current", "disabled", "empty", "expanded", "filled", "indeterminate", "loading", "pressed", "selected", "state", "validationType",
];
// Properties that a recorded spec of the library update keeps crossed, each a KNOWN EXCEPTION to the rule. Every name in this
// list is to be ruled on by the developer: it either leaves the list (its unit draws it as a case on the sheet) or is
// admitted to the rule. The scan therefore does NOT catch these names yet; `passedByException` counts the sets that pass only
// because of this list, so the gap is visible in every scan.
const PROPERTIES_A_SPEC_KEEPS_CROSSED = [
  "attached", "badge", "bordered", "dataSources", "extent", "fill", "iconSize", "layout", "mode", "mtype", "nested", "orientation",
  "percent", "placement", "shape", "sort", "type", "valueType",
];
// Properties that the book names for one unit, with a reason (the table "A property a named unit keeps crossed" in the delivery
// library chapter). Unlike the list above, a pair here is admitted to the rule, for its own unit only: the same property on any
// other unit is still named. `passedByException` counts a set that passes only because of this list too.
const PROPERTIES_A_UNIT_KEEPS_CROSSED = {
  DSWFilterField: ["kind"],
  DSWFilterBar: ["narrow"],
  ".DSWDataTableEmpty": ["filtered"],
  ".DSContainerFrames": ["frames"],
  "DSContainer.Header": ["flush"],
  "DSContainer.Content": ["flush"],
  "DSContainer.Footer": ["flush"],
  DSLayoutNavNode: ["open", "inGroup", "inMenu"],
  DSLayout: ["open", "narrow", "flush", "side"],
};
const EDITOR_DEFAULT_PROPERTY = /^Property \d+$/;
const SCAN_FACTS = { passedByException: 0 };
const LABEL_PREFIX = "label · ";
const SHEET_SUFFIX = " cases";
const CASE_NAME = /^[^=,]+=[^=,]+(, [^=,]+=[^=,]+)*$/;
const PATH_JOIN = " > ";

if (INPUTS.pageId === null) {
  return { pages: figma.root.children.map((page) => ({ id: page.id, name: page.name })) };
}

const page = await figma.getNodeByIdAsync(INPUTS.pageId);
if (!page || page.type !== "PAGE") {
  return { error: `${INPUTS.pageId} is not a page` };
}
await figma.setCurrentPageAsync(page);

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

function parseVersionName(name) {
  const values = {};
  for (const part of name.split(", ")) {
    const cut = part.indexOf("=");
    if (cut > 0) values[part.slice(0, cut)] = part.slice(cut + 1);
  }
  return values;
}

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

// One set, read once. The definitions come from the set, inside a try, because they throw from a
// version. The default version is the one Figma reports; the top left is the one found by position.
// One set, read once. The definitions come from the set, inside a try, because they throw from a
// version. The default version is the one Figma reports; the top left is the one found by position.
function readSet(set) {
  let definitions = null;
  let readError = null;
  try {
    definitions = set.componentPropertyDefinitions;
  } catch (error) {
    readError = String(error?.message ?? error);
  }
  const versions = set.children.filter((child) => child.type === "COMPONENT");
  let topLeft = null;
  for (const version of versions) {
    if (topLeft === null || version.y < topLeft.y || (version.y === topLeft.y && version.x < topLeft.x)) {
      topLeft = version;
    }
  }
  let defaultVersion = null;
  try { defaultVersion = set.defaultVariant?.name ?? null; } catch { defaultVersion = null; }
  const props = {};
  for (const [name, definition] of Object.entries(definitions ?? {})) {
    props[name] = { type: definition.type, default: definition.defaultValue, options: definition.variantOptions ?? null };
  }
  return { set, versions, definitions, readError, props, defaultVersion, topLeftVersion: topLeft?.name ?? null };
}

// The walk goes down through sections (and sections inside sections, for parts) and no further. A unit is a set, or a
// lone component that is no case.
const placed = [];
function collect(parent) {
  for (const node of parent.children) {
    placed.push(node);
    if (isSection(node)) collect(node);
  }
}
collect(page);
const unitEntries = placed.filter((node) => node.type === "COMPONENT_SET" || (node.type === "COMPONENT" && !CASE_NAME.test(node.name)));
const form = page.children.length === 0 ? "empty" : page.children.some((node) => isSection(node)) ? "sections" : "flat";

// ---- the references of a set's versions
// The layers of a version by path (the layer names from the version down, joined; a second sibling of one name takes
// ` [2]`, and so on). A node inside an instance is not entered. A node outside a component, or one that throws on the
// read, holds no reference; a reference is a key of `componentPropertyReferences` (`characters`, `visible`,
// `mainComponent`, and a SLOT's `slotContentId`) with the property it is tied to.
function layersOf(version) {
  const found = new Map();
  const walk = (node, path) => {
    if (node.type === "INSTANCE" || !node.children) return;
    const times = new Map();
    for (const child of node.children) {
      const nth = (times.get(child.name) ?? 0) + 1;
      times.set(child.name, nth);
      const here = (path === "" ? "" : path + PATH_JOIN) + (nth > 1 ? `${child.name} [${nth}]` : child.name);
      let tied = null;
      let unread = false;
      try { tied = child.componentPropertyReferences ?? null; } catch { unread = true; }
      const references = {};
      for (const [kind, property] of Object.entries(tied ?? {})) if (property) references[kind] = property;
      found.set(here, { type: child.type, references, unread, node: child });
      walk(child, here);
    }
  };
  walk(version, "");
  return found;
}

// Whether a layer already shows what the property a tie would use gives by default: the same visibility, the same text,
// the same main component (the swap's default is a component's id or key). What cannot be read, or a definition that is
// not known, counts as the same: the tie is plain.
async function drawsDefault(node, kind, definition) {
  const want = definition?.defaultValue;
  try {
    if (kind === "visible") return typeof node.visible !== "boolean" || typeof want !== "boolean" || node.visible === want;
    if (kind === "characters") return typeof node.characters !== "string" || typeof want !== "string" || node.characters === want;
    if (kind === "mainComponent" && want) {
      const main = await node.getMainComponentAsync();
      return !main || main.id === want || main.key === want;
    }
  } catch { return true; }
  return true;
}

// For one set or lone component: what its layers' references say. A path is wired for a kind when any version holds that
// kind there on a node of the same type. Named: a version whose node there, of that type, lacks it (`lacking`; not when the
// version ties the same property on another layer, since a tie may move between layers by design; each missing tie is
// `plain` where the layer already shows the property's default, or would change what is drawn, and a version all of whose
// missing ties would change it is `differs`, a thing for a person to judge); a version whose layer is of another type where
// no version of its type holds the kind (`reshaped`, a FRAME where another version has a SLOT); a version tied there to
// another property than the most (`tiedElsewhere`; not when one variant of the set explains the split, every version of one
// of its values holding one key and each held by two versions at least; else the variant nearest to explaining it is given); a definition, not a VARIANT, that no
// layer of any version references (`unreferenced`). The nearest wired version, one that holds every missing reference and
// differs in the fewest variant values, is given to help a writer; its absence excuses nothing.
async function wiringOf(read) {
  const out = { lacking: [], differs: [], reshaped: [], tiedElsewhere: [], unreferenced: [] };
  const versions = read.versions;
  if (versions.length === 0 || versions.length > INPUTS.maxVersions) return out;
  const layers = versions.map(layersOf);
  const wired = new Map();
  const held = layers.map(() => new Set());
  let unread = false;
  layers.forEach((one, index) => {
    for (const [path, node] of one) {
      if (node.unread) unread = true;
      for (const [kind, property] of Object.entries(node.references)) {
        held[index].add(property);
        if (!wired.has(path)) wired.set(path, new Map());
        const group = wired.get(path);
        const id = node.type + "\u0000" + kind;
        if (!group.has(id)) group.set(id, new Map());
        const keys = group.get(id);
        keys.set(property, (keys.get(property) ?? 0) + 1);
      }
    }
  });
  const label = { set: read.set.id, setName: read.set.name.slice(0, 80) };
  if (!unread) {
    for (const [key, definition] of Object.entries(read.definitions ?? {})) {
      if (definition.type !== "VARIANT" && !held.some((one) => one.has(key))) {
        out.unreferenced.push({ ...label, property: propertyName(key).slice(0, 80), key: key.slice(0, 80), type: definition.type });
      }
    }
  }
  if (versions.length < 2 || wired.size === 0) return out;
  const leaderOf = (keys) => {
    const ranked = [...keys].sort((first, second) => second[1] - first[1]);
    return ranked[0][1] > ranked[1][1] ? ranked[0][0] : null;
  };
  const values = versions.map((version) => parseVersionName(version.name));
  const signature = (index, skipped) => skipped + "\u0000" + JSON.stringify(Object.keys(values[index]).filter((key) => key !== skipped).sort().map((key) => [key, values[index][key]]));
  const buckets = new Map();
  values.forEach((one, index) => {
    for (const key of Object.keys(one)) {
      const at = signature(index, key);
      if (!buckets.has(at)) buckets.set(at, []);
      buckets.get(at).push(index);
    }
  });
  const twinsOf = (index) => Object.keys(values[index]).flatMap((key) => (buckets.get(signature(index, key)) ?? []).filter((other) => other !== index && values[other][key] !== values[index][key]));
  const distance = (first, second) => [...new Set([...Object.keys(values[first]), ...Object.keys(values[second])])].filter((key) => values[first][key] !== values[second][key]).length;
  const splits = new Map();
  const splitOf = (path, id) => {
    const at = path + "\u0000" + id;
    if (splits.has(at)) return splits.get(at);
    const [type, kind] = id.split("\u0000");
    const holders = layers.flatMap((one, other) => (one.get(path)?.type === type && one.get(path).references[kind] ? [[other, one.get(path).references[kind]]] : []));
    let nearestVariant = null;
    let fewest = Infinity;
    let rank = Infinity;
    for (const variant of new Set(values.flatMap(Object.keys))) {
      const byValue = new Map();
      for (const [other, key] of holders) {
        const group = byValue.get(values[other][variant]) ?? { keys: new Set(), count: 0 };
        group.keys.add(key);
        group.count += 1;
        byValue.set(values[other][variant], group);
      }
      const mixed = [...byValue.values()].filter((group) => group.keys.size > 1).length;
      const lone = [...byValue.values()].some((group) => group.count < 2);
      if (mixed === 0 && !lone) { splits.set(at, null); return null; }
      if (mixed * 2 + (lone ? 1 : 0) < rank) { rank = mixed * 2 + (lone ? 1 : 0); fewest = mixed; nearestVariant = variant; }
    }
    const found = { variant: nearestVariant, values: fewest === Infinity ? 0 : fewest };
    splits.set(at, found);
    return found;
  };
  const cap = (paths) => paths.slice(0, INPUTS.pathsNamed).map((path) => path.slice(0, 120));
  for (const [index, version] of versions.entries()) {
    const missing = [];
    const changed = [];
    for (const [path, group] of wired) {
      const node = layers[index].get(path);
      if (node === undefined) continue;
      for (const [id, keys] of group) {
        const [type, kind] = id.split("\u0000");
        const own = node.references[kind];
        if (type !== node.type) {
          if (!own && !group.has(node.type + "\u0000" + kind)) changed.push(`${path} (${kind}; twin ${type}, here ${node.type})`);
        } else if (!own) {
          if ([...keys.keys()].some((property) => held[index].has(property))) continue;
          const key = [...keys].sort((first, second) => second[1] - first[1])[0][0];
          missing.push({ path, kind, type, text: `${path} (${kind})`, plain: await drawsDefault(node.node, kind, read.definitions?.[key]) });
        } else if (keys.size > 1 && leaderOf(keys) !== null && leaderOf(keys) !== own) {
          const split = splitOf(path, id);
          if (split !== null) out.tiedElsewhere.push({ ...label, version: version.id, name: version.name.slice(0, 160), path: `${path} (${kind})`.slice(0, 120), holds: own.slice(0, 80), others: leaderOf(keys).slice(0, 80), nearestVariant: split.variant, valuesHoldingBoth: split.values });
        }
      }
    }
    const item = (paths) => ({ ...label, version: version.id, name: version.name.slice(0, 160), missing: paths.length, paths: cap(paths) });
    if (missing.length > 0) {
      const holdsAll = (other) => other !== index && missing.every((one) => layers[other].get(one.path)?.type === one.type && layers[other].get(one.path).references[one.kind]);
      let nearest = twinsOf(index).find(holdsAll);
      if (nearest === undefined) {
        let fewest = Infinity;
        for (let other = 0; other < versions.length; other += 1) if (holdsAll(other) && distance(index, other) < fewest) { fewest = distance(index, other); nearest = other; }
      }
      const changing = missing.filter((one) => !one.plain).map((one) => one.text);
      const found = { ...item(missing.map((one) => one.text)), plain: missing.length - changing.length, changesDrawing: changing.length, changing: cap(changing), nearest: nearest === undefined ? null : versions[nearest].id };
      (changing.length === missing.length ? out.differs : out.lacking).push(found);
    }
    if (changed.length > 0) out.reshaped.push(item(changed));
  }
  return out;
}

// For one set: each variant property that is not `size`, the shared `variant` or a state, and that multiplies the set, meaning
// some value of it other than the default is held by more than one version. A value held by one version only is drawn once.
function crossedBeyondTheRuleOf(read) {
  const held = new Map();
  const names = read.versions.map((version) => parseVersionName(version.name));
  for (const cells of names) {
    for (const [property, value] of Object.entries(cells)) {
      if (!held.has(property)) held.set(property, new Map());
      held.get(property).set(value, (held.get(property).get(value) ?? 0) + 1);
    }
  }
  const fallback = parseVersionName(read.defaultVersion ?? read.topLeftVersion ?? "");
  const items = [];
  let excused = false;
  for (const [property, counts] of held) {
    if (property === SIZE_PROPERTY || property === SHARED_VARIANT_PROPERTY || STATE_PROPERTIES.includes(property)) continue;
    const defaultValue = read.props[property]?.default !== undefined ? String(read.props[property].default) : fallback[property];
    const multiplying = [...counts].filter(([value, count]) => value !== defaultValue && count > 1);
    if (multiplying.length === 0) continue;
    if (PROPERTIES_A_SPEC_KEEPS_CROSSED.includes(property) || PROPERTIES_A_UNIT_KEEPS_CROSSED[read.set.name]?.includes(property)) { excused = true; continue; }
    items.push({
      set: read.set.id, setName: read.set.name.slice(0, 80), property: property.slice(0, 80), default: String(defaultValue).slice(0, 40),
      multiplying: multiplying.slice(0, 5).map(([value, count]) => `${value} x${count}`.slice(0, 40)),
    });
  }
  if (items.length === 0 && excused) SCAN_FACTS.passedByException += 1;
  return items;
}

async function scanFindings() {
  const versionsOutside = [];
  const versionPairs = [];
  const emptyVersions = [];
  const defaultNamedProperties = [];
  const unreadableSets = [];
  const setsOverLimit = [];
  for (const node of unitEntries.filter((one) => one.type === "COMPONENT_SET")) {
    const read = readSet(node);
    const set = node;
    const positions = read.versions.map((version) => ({ id: version.id, box: boxOf(version) }));
    for (const version of read.versions) {
      const box = boxOf(version);
      if (box[0] < 0 || box[1] < 0 || box[0] + box[2] > set.width || box[1] + box[3] > set.height) {
        versionsOutside.push({ set: set.id, version: version.id });
      }
      const hasNoLayer = "children" in version && version.children.length === 0;
      const hasNoSize = box[2] === 0 || box[3] === 0;
      if (hasNoLayer || hasNoSize) {
        emptyVersions.push({ set: set.id, version: version.id, why: hasNoLayer && hasNoSize ? "no layer and no size" : hasNoLayer ? "no layer" : "no size" });
      }
    }
    for (const pair of pairsThatMeet(positions)) versionPairs.push({ set: set.id, pair });
    if (read.readError !== null) unreadableSets.push({ set: set.id, error: read.readError });
    if (read.versions.length > INPUTS.maxVersions) setsOverLimit.push({ set: set.id, name: set.name, versions: read.versions.length });
    for (const name of Object.keys(read.props)) {
      if (EDITOR_DEFAULT_PROPERTY.test(name.replace(/#.*$/, ""))) defaultNamedProperties.push({ set: set.id, property: name });
    }
  }

  const versionNotWired = [];
  const versionDiffersFromDefault = [];
  const versionSlotIsFrame = [];
  const versionTiedToAnotherProperty = [];
  const propertyTiedToNothing = [];
  const crossedBeyondTheRule = [];
  for (const node of unitEntries) {
    const lone = node.type === "COMPONENT";
    if (!lone) crossedBeyondTheRule.push(...crossedBeyondTheRuleOf(readSet(node)));
    const wiring = await wiringOf(lone ? { set: node, versions: [node], definitions: definitionsOf(node) } : readSet(node));
    versionNotWired.push(...wiring.lacking);
    versionDiffersFromDefault.push(...wiring.differs);
    versionSlotIsFrame.push(...wiring.reshaped);
    versionTiedToAnotherProperty.push(...wiring.tiedElsewhere);
    propertyTiedToNothing.push(...wiring.unreferenced);
  }

  const emptyCases = [];
  const badCaseNames = [];
  const duplicateCaseNames = [];
  for (const sheetNode of placed.filter(isSheet)) {
    const seen = new Set();
    for (const child of sheetNode.children) {
      if (isSheetLabel(child)) continue;
      const hasNoLayer = "children" in child && child.children.length === 0;
      const hasNoSize = child.width === 0 || child.height === 0;
      if (hasNoLayer || hasNoSize) emptyCases.push({ sheet: sheetNode.id, case: child.id, why: hasNoLayer && hasNoSize ? "no layer and no size" : hasNoLayer ? "no layer" : "no size" });
      if (!CASE_NAME.test(child.name)) badCaseNames.push({ sheet: sheetNode.id, case: child.id, name: child.name });
      if (seen.has(child.name)) duplicateCaseNames.push({ sheet: sheetNode.id, case: child.id, name: child.name });
      seen.add(child.name);
    }
  }

  return { versionsOutside, versionPairsMeeting: versionPairs, emptyVersions, defaultNamedProperties, unreadableSets, setsOverLimit, emptyCases, badCaseNames, duplicateCaseNames, versionNotWired, versionDiffersFromDefault, versionSlotIsFrame, versionTiedToAnotherProperty, propertyTiedToNothing, crossedBeyondTheRule };
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
