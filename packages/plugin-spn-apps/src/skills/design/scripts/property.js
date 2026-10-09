// Adds a yes-or-no property or a text property to a set, and ties one layer to it in every version that holds it.
// NOT YET RUN AGAINST A FILE: only its stand-in test has run it. Send it dry first and read what it says.
//
// Passed to the Figma connector's `use_figma` as it is, or through `bundle.mjs` for the sets of a page. A
// plain script with top-level `await` and `return`, no wrapper. Fill INPUTS, change nothing else. DRY IS
// THE DEFAULT: with `dryRun: true` it changes nothing and returns what it would add and tie.
//
//   name      the property's name
//   type      BOOLEAN (tied to a layer's `visible`) or TEXT (tied to a text layer's `characters`)
//   layer     the exact name of the layer to tie, in every version that holds one
//   ties      `visible` for BOOLEAN, `characters` for TEXT
//   default   for BOOLEAN true or false; for TEXT a text, or null for the characters the layer holds in the
//             set's default version
//
// A layer is found by walking each version down; the layers inside an instance are not walked, because they
// belong to the instance's own component. A property of that name that the set already holds is `stood`: the
// script ties nothing then. Before anything changes it refuses, changing nothing, when no version holds the
// layer, when a version holds two layers of that name, when a layer is already tied to another property by
// the same tie, when a TEXT property meets a layer that is no text, or when the default does not fit the type.

const INPUTS = {
  setId: "",
  unit: "",
  name: "",
  type: "BOOLEAN",
  layer: "",
  ties: "visible",
  default: null,
  dryRun: true,
};

const set = await figma.getNodeByIdAsync(INPUTS.setId);
if (!set || set.type !== "COMPONENT_SET" || (INPUTS.unit && set.name !== INPUTS.unit)) {
  return { refused: `${INPUTS.setId} is not the set ${INPUTS.unit}` };
}
let page = set.parent;
while (page && page.type !== "PAGE") page = page.parent;
await figma.setCurrentPageAsync(page);

const problems = [];
const wantedTie = INPUTS.type === "BOOLEAN" ? "visible" : INPUTS.type === "TEXT" ? "characters" : null;
if (wantedTie === null) problems.push(`the type ${INPUTS.type} is neither BOOLEAN nor TEXT`);
else if (INPUTS.ties !== wantedTie) problems.push(`a ${INPUTS.type} property ties \`${wantedTie}\`, not \`${INPUTS.ties}\``);
if (INPUTS.type === "BOOLEAN" && typeof INPUTS.default !== "boolean") problems.push("the default of a BOOLEAN property is true or false");
if (INPUTS.type === "TEXT" && INPUTS.default !== null && typeof INPUTS.default !== "string") problems.push("the default of a TEXT property is a text or null");
if (!INPUTS.name || !INPUTS.layer) problems.push("the property needs a name and a layer");

const definitions = set.componentPropertyDefinitions;
const standingKey = Object.keys(definitions).find((key) => key === INPUTS.name || key.startsWith(INPUTS.name + "#"));
if (standingKey && definitions[standingKey].type !== INPUTS.type) problems.push(`the set holds a property \`${INPUTS.name}\` of the type ${definitions[standingKey].type}, not ${INPUTS.type}`);

// The layers of a version named `layer`, not walking into instances.
const layersOf = (root) => {
  const found = [];
  const walk = (parent) => {
    for (const child of parent.children || []) {
      if (child.name === INPUTS.layer) found.push(child);
      if (child.type !== "INSTANCE") walk(child);
    }
  };
  walk(root);
  return found;
};
const versions = set.children.filter((child) => child.type === "COMPONENT");
const holders = [];
const without = [];
for (const version of versions) {
  const layers = layersOf(version);
  if (layers.length === 0) { without.push(version.name); continue; }
  if (layers.length > 1) { problems.push(`[${version.name}] holds ${layers.length} layers named \`${INPUTS.layer}\``); continue; }
  const layer = layers[0];
  if (INPUTS.type === "TEXT" && layer.type !== "TEXT") problems.push(`[${version.name}] holds \`${INPUTS.layer}\` as a ${layer.type}, not a text`);
  const references = layer.componentPropertyReferences || {};
  if (wantedTie && references[wantedTie] && !standingKey) problems.push(`[${version.name}] has \`${INPUTS.layer}\` tied to ${references[wantedTie]} already`);
  holders.push({ version, layer });
}
if (holders.length === 0 && !problems.some((text) => text.includes("layers named"))) problems.push(`no version holds a layer named \`${INPUTS.layer}\``);

let defaultValue = INPUTS.default;
if (INPUTS.type === "TEXT" && INPUTS.default === null) {
  const home = holders.find((one) => one.version === set.defaultVariant);
  if (home && home.layer.type === "TEXT") defaultValue = home.layer.characters;
  else if (!standingKey) problems.push("the default version holds no text layer of that name to take the default from");
}

const done = { unit: set.name, dryRun: INPUTS.dryRun, problems, stood: Boolean(standingKey), key: standingKey || null, tied: 0, versionsWithoutLayer: without.slice(0, 8) };
if (standingKey) return { ...done, problems: problems.filter((text) => text.startsWith("the set holds a property")) };
if (problems.length > 0 || INPUTS.dryRun) return { ...done, wouldTie: holders.length };

const key = set.addComponentProperty(INPUTS.name, INPUTS.type, defaultValue);
for (const { layer } of holders) {
  if (INPUTS.type === "TEXT") {
    for (const segment of layer.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(segment.fontName);
  }
  layer.componentPropertyReferences = { ...(layer.componentPropertyReferences || {}), [wantedTie]: key };
  done.tied += 1;
}
return { ...done, key };
