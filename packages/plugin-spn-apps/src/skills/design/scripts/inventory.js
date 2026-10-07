// The units of one page of a library file, in the contract the tool takes in (`SPSurfaceInventory`).
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else. Never writes to the file. The agent saves each
// answer as a file and runs `assemble.mjs`, which puts the answers and the tokens answer into one inventory.
//
//   pageId null    lists the file's pages (id, name, index) and stops. Run it once for the file: the
//                  assembling script checks that every listed page has been read.
//   pageId "<id>"  reads the page's units, a set of components or a lone component, in the page's order.
//                  One entry for each unit, never one for each layer: the layers of every version are
//                  reduced here, by the rule the tool's contract states for each fact.
//   from, to       a range of units, by their place among the page's units. The answer stops by itself
//                  before `maxBytes` or after `maxSeconds`, and returns `next`, the place to go on from.
//   measuresFor    the names of the units that also give their versions with their measures (depth 3). It
//                  is for units that were asked for, never for a whole file. `versionsFrom` and `versionsTo`
//                  take a window of one unit's versions; where the versions do not fit, the answer carries
//                  `next` (the same unit) and `nextVersion`, and the next call passes both back.
//
// The facts of a set, over the layers of every version (nested layers included, as `findAll` gives them):
//   boundVariables  the distinct names of the variables bound by any layer (its `boundVariables` fields, and
//                   the variable of each fill and stroke paint), sorted
//   frameVariables  the same over each version's own bound fields, fills and strokes, sorted
//   sizing          the distinct layout sizing across and down of the layers directly under a version
//   frame           per version: a stroke weight above 0 and a stroke paint; an effect or an effect style;
//                   a corner radius above 0. The distinct answers, false before true
//   text            the distinct text case and text decoration of the text layers, sorted
//   measures        per version, the first layer whose field is a number, with the variable bound to it

const INPUTS = {
  pageId: null,
  from: 0,
  to: null,
  maxBytes: 16000,
  maxSeconds: 40,
  measuresFor: [],
  versionsFrom: 0,
  versionsTo: null,
};

const NUMBER_FIELDS = [
  "strokeTopWeight", "strokeBottomWeight", "strokeLeftWeight", "strokeRightWeight",
  "topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius",
  "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "itemSpacing", "minHeight", "maxHeight",
];

// The measure each layer field gives, and the key the layer's bound variable is held under.
const MEASURES = [
  { measure: "paddingTop", field: "paddingTop", boundAs: "paddingTop" },
  { measure: "paddingRight", field: "paddingRight", boundAs: "paddingRight" },
  { measure: "paddingBottom", field: "paddingBottom", boundAs: "paddingBottom" },
  { measure: "paddingLeft", field: "paddingLeft", boundAs: "paddingLeft" },
  { measure: "gap", field: "itemSpacing", boundAs: "itemSpacing" },
  { measure: "radiusTopLeft", field: "topLeftRadius", boundAs: "topLeftRadius" },
  { measure: "radiusTopRight", field: "topRightRadius", boundAs: "topRightRadius" },
  { measure: "radiusBottomRight", field: "bottomRightRadius", boundAs: "bottomRightRadius" },
  { measure: "radiusBottomLeft", field: "bottomLeftRadius", boundAs: "bottomLeftRadius" },
  { measure: "border", field: "strokeTopWeight", boundAs: "strokeTopWeight" },
  { measure: "textSize", field: "fontSize", boundAs: "fontSize" },
];

if (INPUTS.pageId === null) {
  return {
    script: "inventory", file: figma.root.name, readAt: new Date().toISOString(),
    pages: figma.root.children.map((page, index) => ({ id: page.id, name: page.name, index })),
  };
}

const startedAt = Date.now();
const pageIndex = figma.root.children.findIndex((candidate) => candidate.id === INPUTS.pageId);
const page = await figma.getNodeByIdAsync(INPUTS.pageId);
if (!page || page.type !== "PAGE") {
  return { error: `${INPUTS.pageId} is not a page` };
}
await figma.setCurrentPageAsync(page);
figma.skipInvisibleInstanceChildren = false;

const plain = (value) => (typeof value === "symbol" ? "mixed" : value);
const distinct = (values) => [...new Set(values.filter((value) => typeof value === "string"))].sort();
const answers = (list) => [false, true].filter((answer) => list.includes(answer));
const positive = (values) => values.some((value) => typeof value === "number" && value > 0);

// A variable's name, once for each id. A name that cannot be found is `unresolved:<id>`.
const variableNames = new Map();
async function variableName(id) {
  if (!variableNames.has(id)) {
    const variable = await figma.variables.getVariableByIdAsync(id);
    variableNames.set(id, variable ? variable.name : "unresolved:" + id);
  }
  return variableNames.get(id);
}

async function aliasName(alias) {
  return alias && alias.id ? variableName(alias.id) : null;
}

// What a node binds, as the names of its variables: a bound field is the first alias it holds.
async function boundOf(node, keys) {
  const found = {};
  const bound = node.boundVariables || {};
  for (const key of keys ?? Object.keys(bound)) {
    if (!(key in bound)) continue;
    const alias = bound[key];
    const name = await aliasName(Array.isArray(alias) ? alias[0] : alias);
    if (name) found[key] = name;
  }
  return found;
}

// The variable names of a node's fills or strokes, and how many paints it holds.
async function paintsOf(node, field) {
  const paints = field in node ? node[field] : null;
  if (!Array.isArray(paints)) return { variables: [], count: 0 };
  const variables = [];
  for (const paint of paints) {
    const name = await aliasName(paint.boundVariables && paint.boundVariables.color);
    if (name) variables.push(name);
  }
  return { variables, count: paints.length };
}

// The facts of one layer that a set's reduction keeps.
async function readLayer(layer, version) {
  const keys = ["height", "width", ...NUMBER_FIELDS.filter((field) => field in layer)];
  if (layer.type === "TEXT") keys.push("fontSize");
  const bound = await boundOf(layer, keys);
  const fills = await paintsOf(layer, "fills");
  const strokes = await paintsOf(layer, "strokes");
  const numbers = {};
  for (const field of NUMBER_FIELDS) if (field in layer) numbers[field] = plain(layer[field]);
  const text = layer.type === "TEXT"
    ? { fontSize: plain(layer.fontSize), case: plain(layer.textCase), decoration: plain(layer.textDecoration) }
    : null;
  let sizing = null;
  try {
    if ("layoutSizingHorizontal" in layer || "layoutSizingVertical" in layer) {
      sizing = {
        horizontal: "layoutSizingHorizontal" in layer ? plain(layer.layoutSizingHorizontal) : null,
        vertical: "layoutSizingVertical" in layer ? plain(layer.layoutSizingVertical) : null,
      };
    }
  } catch { sizing = null; }
  return {
    // a layer sits directly under the version when its path of names holds no `/`
    direct: layer.parent && layer.parent.id === version.id && !layer.name.includes("/"),
    bound, variables: [...Object.values(bound), ...fills.variables, ...strokes.variables], numbers, text, sizing,
  };
}

// One version: its frame's facts, its layers' facts, and (when asked) its measures.
async function readVersion(version, wantMeasures) {
  const field = (name) => (name in version ? plain(version[name]) : null);
  const frameBound = await boundOf(version);
  const frameFills = await paintsOf(version, "fills");
  const frameStrokes = await paintsOf(version, "strokes");
  const effects = "effects" in version && typeof version.effects !== "symbol" ? version.effects : null;
  const frame = {
    variables: [...Object.values(frameBound), ...frameFills.variables, ...frameStrokes.variables],
    stroke: positive([field("strokeTopWeight"), field("strokeBottomWeight"), field("strokeLeftWeight"), field("strokeRightWeight")]) && frameStrokes.count > 0,
    effect: (effects ?? []).length > 0 || Boolean(plain(version.effectStyleId)),
    radius: positive([field("topLeftRadius"), field("topRightRadius"), field("bottomLeftRadius"), field("bottomRightRadius")]),
  };
  const layers = [];
  for (const layer of version.findAll(() => true)) layers.push(await readLayer(layer, version));
  let measures = null;
  if (wantMeasures) {
    measures = {};
    for (const one of MEASURES) {
      const source = layers.find((layer) => typeof (one.field === "fontSize" ? layer.text?.fontSize : layer.numbers[one.field]) === "number");
      if (source) {
        measures[one.measure] = {
          value: one.field === "fontSize" ? source.text.fontSize : source.numbers[one.field],
          variable: source.bound[one.boundAs] ?? null,
        };
      }
    }
  }
  return { name: version.name, w: version.width, h: version.height, frame, layers, measures };
}

// One unit: its props, its version count and default, how it is drawn, and its versions when asked for.
async function readUnit(node, wantMeasures) {
  const isSet = node.type === "COMPONENT_SET";
  const versionNodes = isSet ? node.children.filter((child) => child.type === "COMPONENT") : [node];
  const props = {};
  for (const [name, definition] of Object.entries(node.componentPropertyDefinitions || {})) {
    props[name] = { type: definition.type, default: definition.defaultValue, values: definition.variantOptions || null };
  }
  const versions = [];
  for (const version of versionNodes) versions.push(await readVersion(version, wantMeasures));
  const layers = versions.flatMap((version) => version.layers);
  const direct = layers.filter((layer) => layer.direct);
  const textLayers = layers.filter((layer) => layer.text);
  return {
    id: node.key, name: node.name, kind: isSet ? "SET" : "COMPONENT",
    props, versionCount: versions.length, defaultVersion: isSet ? node.defaultVariant.name : node.name,
    drawn: {
      boundVariables: distinct(layers.flatMap((layer) => layer.variables)),
      frameVariables: distinct(versions.flatMap((version) => version.frame.variables)),
      sizing: { horizontal: distinct(direct.map((layer) => layer.sizing?.horizontal)), vertical: distinct(direct.map((layer) => layer.sizing?.vertical)) },
      frame: {
        stroke: answers(versions.map((version) => version.frame.stroke)),
        effect: answers(versions.map((version) => version.frame.effect)),
        radius: answers(versions.map((version) => version.frame.radius)),
      },
      text: { case: distinct(textLayers.map((layer) => layer.text.case)), decoration: distinct(textLayers.map((layer) => layer.text.decoration)) },
    },
    versions: wantMeasures ? versions.map((version) => ({ name: version.name, w: version.w, h: version.h, measures: version.measures })) : null,
  };
}

// The units of the page, in its order: sets, and components that are not a version of a set.
const nodes = page.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] })
  .filter((node) => node.type === "COMPONENT_SET" || !node.parent || node.parent.type !== "COMPONENT_SET");

const from = INPUTS.from ?? 0;
const to = Math.min(INPUTS.to ?? nodes.length, nodes.length);
const units = [];
const unreadable = [];
let used = 0;
let next = null;
let nextVersion = null;
for (let index = from; index < to; index += 1) {
  if (units.length > 0 && Date.now() - startedAt > INPUTS.maxSeconds * 1000) { next = index; break; }
  const node = nodes[index];
  const wantMeasures = INPUTS.measuresFor.includes(node.name);
  let unit;
  try {
    unit = await readUnit(node, wantMeasures);
  } catch (error) {
    unreadable.push({ index, id: node.id, name: node.name, error: String(error?.message ?? error) });
    continue;
  }
  if (wantMeasures) {
    // Only a window of the versions is given, and fewer when they do not fit; the next call goes on from there.
    const all = unit.versions;
    const first = index === from ? (INPUTS.versionsFrom ?? 0) : 0;
    const wanted = all.slice(first, index === from && INPUTS.versionsTo !== null ? INPUTS.versionsTo : all.length);
    let count = wanted.length;
    while (count > 1 && units.length === 0 && used + JSON.stringify({ ...unit, versions: wanted.slice(0, count) }).length + 1 > INPUTS.maxBytes) {
      count = Math.ceil(count / 2);
    }
    unit.versions = wanted.slice(0, count);
    if (count < wanted.length) { next = index; nextVersion = first + count; }
  }
  const size = JSON.stringify(unit).length + 1;
  if (units.length > 0 && used + size > INPUTS.maxBytes) { next = index; break; }
  used += size;
  units.push({ index, ...unit });
  if (nextVersion !== null) break;
}

return {
  script: "inventory", file: figma.root.name, readAt: new Date().toISOString(),
  page: { id: page.id, name: page.name, index: pageIndex },
  unitCount: nodes.length, range: [from, next ?? to], next, nextVersion, units, unreadable,
};
