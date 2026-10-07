// The tokens of one library file, in the contract the tool takes in (`SPSurfaceInventory`): the variables
// with their collection, modes, default mode and value for each mode, and the text and effect styles.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else. Never writes to the file, and it does not switch
// page. The agent saves each answer as a file next to the units' answers and runs `assemble.mjs`.
//
// The items of the file, in one order: every variable (collection by collection, in the order Figma lists
// them), then the text styles, then the effect styles. `from` and `to` take a range of those items. The
// answer stops by itself before `maxBytes` and returns `next`, the place to go on from; it is null when the
// last item was given. The first answer (from 0) lists every collection, so a collection with no variable is
// kept.
//
// A value is a number, a string, a boolean, a colour as hex with alpha (`#rrggbbaa`), or `{ "alias": "<name>" }`
// where the variable aliases another, which is written as the name of the variable it points to.

const INPUTS = {
  from: 0,
  to: null,
  maxBytes: 16000,
};

const hexPart = (channel) => Math.round(channel * 255).toString(16).padStart(2, "0");
const isColour = (value) => value !== null && typeof value === "object" && "r" in value && "g" in value && "b" in value;
const toHex = (colour) => "#" + hexPart(colour.r) + hexPart(colour.g) + hexPart(colour.b) + hexPart(colour.a === undefined ? 1 : colour.a);

const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
const localVariables = await figma.variables.getLocalVariablesAsync();
const textStyles = await figma.getLocalTextStylesAsync();
const effectStyles = await figma.getLocalEffectStylesAsync();

const names = new Map(localVariables.map((variable) => [variable.id, variable.name]));
async function variableName(id) {
  if (!names.has(id)) {
    const variable = await figma.variables.getVariableByIdAsync(id);
    names.set(id, variable ? variable.name : "unresolved:" + id);
  }
  return names.get(id);
}

async function valueOf(value) {
  if (value && typeof value === "object" && value.type === "VARIABLE_ALIAS") return { alias: await variableName(value.id) };
  return isColour(value) ? toHex(value) : value;
}

// The items, in order, each knowing where it belongs.
const items = [];
for (const collection of localCollections) {
  for (const variable of localVariables) {
    if (variable.variableCollectionId === collection.id) items.push({ kind: "variable", collection, variable });
  }
}
for (const style of textStyles) items.push({ kind: "text", style });
for (const style of effectStyles) items.push({ kind: "effect", style });

const from = INPUTS.from ?? 0;
const to = Math.min(INPUTS.to ?? items.length, items.length);
const shell = (collection) => ({
  name: collection.name,
  defaultMode: collection.modes.find((mode) => mode.modeId === collection.defaultModeId)?.name,
  modes: collection.modes.map((mode) => mode.name),
  variables: [],
});
// The first answer lists every collection, in the order Figma gives them; a later one only those it touches.
const collections = new Map();
if (from === 0) for (const collection of localCollections) collections.set(collection.id, shell(collection));
const styles = { text: [], effect: [] };

const answerBytes = () => JSON.stringify({ collections: [...collections.values()], styles }).length;
let next = null;
for (let index = from; index < to; index += 1) {
  if (answerBytes() > INPUTS.maxBytes - 700 && index > from) { next = index; break; }
  const item = items[index];
  if (item.kind === "variable") {
    const { collection, variable } = item;
    if (!collections.has(collection.id)) collections.set(collection.id, shell(collection));
    const values = {};
    for (const mode of collection.modes) values[mode.name] = await valueOf(variable.valuesByMode[mode.modeId]);
    collections.get(collection.id).variables.push({ name: variable.name, type: variable.resolvedType, values });
  } else if (item.kind === "text") {
    styles.text.push({ name: item.style.name, fontSize: item.style.fontSize, lineHeight: item.style.lineHeight });
  } else {
    styles.effect.push({ name: item.style.name });
  }
}

return {
  script: "tokens", file: figma.root.name, readAt: new Date().toISOString(),
  itemCount: items.length, range: [from, next ?? to], next,
  collections: [...collections.values()], styles,
};
