// Makes the cases of one unit's spec that the unit's own properties can produce, on the unit's sheet.
// NOT YET RUN AGAINST A FILE: only its stand-in test has run it. Send it dry first and read what it says.
//
// Passed to the Figma connector's `use_figma` as it is, or through `bundle.mjs` for the units of a page. A
// plain script with top-level `await` and `return`, no wrapper. Fill INPUTS, change nothing else. DRY IS THE
// DEFAULT: with `dryRun: true` it changes nothing and returns what it would make. Run it after `names.js`
// and `copy.js`, so that a case's `base` is read against the names the versions then have.
//
// A sheet is the frame named `<Unit> cases` in the unit's section. A case is a component on it, named as
// the spec names it, that holds one instance of the unit with the case's `props` set. A case whose name
// already stands on the sheet is left as it is (`stood`), so the script is safe to send twice. On a sheet
// with no auto layout the new cases stand in a row of their own under the cases that are there. What this
// script does not do, and reports in `problems`: make a sheet where the unit has none (`sheet.js` does),
// set a swap property, and write the sheet's label.
//
//   spec    the spec's `unit`, `setId` and `cases`. A case holds `name`, `base`, `props`, `stands` and,
//           optionally:
//           text      { "<property>": "<text>" }: text properties of the set, set by name
//           modes     { "<collection's name>": "<mode's name>" }: a variable mode set on the instance. The
//                     collection is found by its name: first among the collections that instances of this page
//                     already carry (the unit's section first), then, for a name still missing, through the
//                     variables that the unit's own layers are bound to (at most 400 layers), following a
//                     variable's alias values up to three steps further; the mode is found by its name in it
//           replaces  the exact name of a component that stands on the sheet. That component is kept (its
//                     id and key stay, so nothing placed on it breaks), its children are removed, it takes
//                     the case's `name`, and the new instance goes into it, at the place it had. A component
//                     that holds exactly one instance of the unit keeps that instance: it is swapped to the
//                     base when its main component differs, then takes the properties and the modes, and its
//                     text overrides and the component's layout stay; only a component that holds anything
//                     else has its children removed. A name that matches nothing on the sheet, or one that
//                     another case of the call replaces too, is a problem and that case is not made. Every
//                     `replaced` entry ends with what the component held and with `rename`, `keep` or
//                     `rebuild`, so a dry answer shows what a real call would remove
//           swap      a non-empty one is a problem and the case is not made
//         With `setId` null the spec holds `loneId`, the lone component that each case is an instance of;
//         the case's `props` are then that component's own properties and its `base` is not read.
//
// A case that already stands right is left alone, also under `replaces`: its component holds exactly one
// instance whose main component is the base, whose variable modes carry every wanted mode and whose
// properties hold every wanted value. Under `replaces` such a component is only renamed. A component of
// the case's own name that is not right stays as it is and is named in `stoodDifferent` with what it holds,
// unless the case's `replaces` names that very component: then it is replaced.
// Every case is worked out before any is made, so a case that cannot be made is named in `problems` and the
// others are made. The answer holds `made`, `stood`, `stoodDifferent` ([name, what it holds]) and
// `replaced` ([old name, new name, id, what it held]).

const INPUTS = {
  spec: null,
  dryRun: true,
};

const spec = INPUTS.spec;
const target = await figma.getNodeByIdAsync(spec.setId || spec.loneId);
const isSet = Boolean(spec.setId);
if (!target || target.type !== (isSet ? "COMPONENT_SET" : "COMPONENT") || target.name !== spec.unit) {
  return { refused: `${spec.setId || spec.loneId} is not the ${isSet ? "set" : "lone component"} ${spec.unit}` };
}
let page = target.parent;
while (page && page.type !== "PAGE") page = page.parent;
await figma.setCurrentPageAsync(page);

const cellsOf = (name) => Object.fromEntries(name.split(", ").map((cell) => {
  const at = cell.indexOf("=");
  return [cell.slice(0, at), cell.slice(at + 1)];
}));
const matches = (cells, pattern) => Object.entries(pattern).every(([property, value]) => cells[property] === String(value));

const home = target.parent;
const sheet = home.children.find((child) => (child.type === "FRAME" || child.type === "SECTION") && child.name === `${spec.unit} cases`);
const definitions = target.componentPropertyDefinitions;
// A property's full key: a variant's is its name, any other kind carries `#id` after it.
const keyOf = (property) => Object.keys(definitions).find((key) => key === property || key.startsWith(property + "#"));
const versions = isSet ? target.children.filter((child) => child.type === "COMPONENT") : [target];

const done = { unit: spec.unit, dryRun: INPUTS.dryRun, sheet: sheet ? sheet.id : null, made: [], stood: [], stoodDifferent: [], replaced: [], problems: [] };
const wanted = (spec.cases || []).filter((one) => !one.stands);
if (!sheet && wanted.length > 0) {
  done.problems.push(`no sheet named "${spec.unit} cases": ${wanted.length} cases not made`);
  return done;
}

// The collections that variable modes are set from. A collection of a library is reached by an id. First by
// the ids that instances already carry for it, among the instances of the unit's section, then of the page.
const collections = new Map();
const neededNames = new Set(wanted.flatMap((one) => Object.keys(one.modes || {})));
if (neededNames.size > 0) {
  const seenIds = new Set();
  for (const scope of [home, page]) {
    if ([...neededNames].every((name) => collections.has(name))) break;
    for (const instance of scope.findAllWithCriteria({ types: ["INSTANCE"] })) {
      let ids = [];
      try { ids = Object.keys(instance.explicitVariableModes || {}); } catch (error) { ids = []; }
      for (const id of ids) {
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        const collection = await figma.variables.getVariableCollectionByIdAsync(id);
        if (collection && neededNames.has(collection.name) && !collections.has(collection.name)) collections.set(collection.name, collection);
      }
      if ([...neededNames].every((name) => collections.has(name))) break;
    }
  }
  // A name still missing is looked for through the unit's own layers: each layer bound to a variable leads to
  // that variable's collection, and a variable's values that are aliases lead further, three steps at most.
  const missing = () => [...neededNames].some((name) => !collections.has(name));
  if (missing()) {
    const aliasesIn = (value, found) => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) { for (const one of value) aliasesIn(one, found); return; }
      if (value.type === "VARIABLE_ALIAS" && value.id) found.add(value.id);
      for (const inner of Object.values(value)) aliasesIn(inner, found);
    };
    const first = new Set();
    let layers = [target];
    try { layers = [target, ...target.findAll(() => true)].slice(0, 400); } catch (error) { layers = [target]; }
    for (const layer of layers) {
      try { aliasesIn(layer.boundVariables, first); } catch (error) { continue; }
    }
    const resolved = new Set();
    let step = [...first];
    for (let depth = 0; depth < 4 && step.length > 0 && missing(); depth += 1) {
      const next = new Set();
      for (const id of step.slice(0, 150)) {
        if (resolved.has(id)) continue;
        resolved.add(id);
        const variable = await figma.variables.getVariableByIdAsync(id);
        if (!variable) continue;
        if (!seenIds.has(variable.variableCollectionId)) {
          seenIds.add(variable.variableCollectionId);
          const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
          if (collection && neededNames.has(collection.name) && !collections.has(collection.name)) collections.set(collection.name, collection);
        }
        aliasesIn(variable.valuesByMode, next);
      }
      step = [...next].filter((id) => !resolved.has(id));
    }
  }
}

// What a component holds, in words: `INSTANCE DSAlertDialog`, `FRAME button row, TEXT caption`.
const heldBy = (component) => ((component.children || []).length > 0 ? component.children.map((child) => `${child.type} ${child.name}`).join(", ") : "nothing");
// A component is right when it holds exactly one instance of the base that carries every wanted mode and value.
const instanceOfUnit = async (component) => {
  if ((component.children || []).length !== 1 || component.children[0].type !== "INSTANCE") return null;
  const instance = component.children[0];
  const main = await instance.getMainComponentAsync();
  return { instance, main, ofUnit: Boolean(main) && (isSet ? main.parent === target : main === target) };
};
const isRight = async (component, plan) => {
  const found = await instanceOfUnit(component);
  if (!found || found.main !== plan.base) return false;
  const carried = found.instance.explicitVariableModes || {};
  if (!plan.modes.every(({ collection, modeId }) => carried[collection.id] === modeId)) return false;
  const held = found.instance.componentProperties || {};
  return Object.entries(plan.values).every(([key, value]) => held[key] && held[key].value === value);
};

// Work out every case first: the base, the values to set, the modes, and the component a case replaces.
const plans = [];
const claimed = new Set();
for (const one of wanted) {
  const standing = sheet.children.find((child) => child.name === one.name);
  const base = isSet ? versions.find((version) => matches(cellsOf(version.name), one.base || {})) : target;
  const values = {};
  const modes = [];
  let unknown = null;
  if (!base) unknown = "no version matches its base";
  else if (one.swap && Object.keys(one.swap).length > 0) unknown = "a swap is set by hand, which this script does not do";
  for (const [property, value] of Object.entries(unknown ? {} : one.props || {})) {
    const key = keyOf(property);
    if (!key) { unknown = `the unit holds no property \`${property}\``; break; }
    if (definitions[key].type === "INSTANCE_SWAP") { unknown = `\`${property}\` is a swap, which this script does not set`; break; }
    values[key] = definitions[key].type === "BOOLEAN" ? value === true || value === "true" : String(value);
  }
  for (const [property, text] of Object.entries(unknown ? {} : one.text || {})) {
    const key = keyOf(property);
    if (!key) { unknown = `the unit holds no property \`${property}\``; break; }
    if (definitions[key].type !== "TEXT") { unknown = `\`${property}\` is a ${definitions[key].type} property, not a text`; break; }
    values[key] = String(text);
  }
  for (const [collectionName, modeName] of Object.entries(unknown ? {} : one.modes || {})) {
    const collection = collections.get(collectionName);
    if (!collection) { unknown = `the collection "${collectionName}" is carried by no instance of this page and bound to no layer of the unit, so it cannot be reached`; break; }
    const mode = collection.modes.find((candidate) => candidate.name === modeName);
    if (!mode) { unknown = `the collection "${collectionName}" holds no mode "${modeName}" (it holds ${collection.modes.map((candidate) => candidate.name).join(", ")})`; break; }
    modes.push({ collection, modeId: mode.modeId });
  }
  // A component under the case's own name stands, unless the case says it replaces that very component and
  // it is not right: then it goes on to be replaced.
  if (standing) {
    const right = await isRight(standing, { base, values, modes });
    if (right || one.replaces !== one.name) {
      done.stood.push(one.name);
      if (!right) done.stoodDifferent.push([one.name, heldBy(standing)]);
      continue;
    }
  }
  let replaced = null;
  let how = "new";
  if (!unknown && one.replaces) {
    replaced = sheet.children.find((child) => child.type === "COMPONENT" && child.name === one.replaces) || null;
    if (!replaced) unknown = `\`replaces\` names "${one.replaces}", which stands on the sheet as no component`;
    else if (claimed.has(replaced.id)) unknown = `"${one.replaces}" is replaced by an earlier case of this call`;
    else claimed.add(replaced.id);
  }
  if (unknown) { done.problems.push(`${one.name}: ${unknown}`); continue; }
  const held = replaced ? heldBy(replaced) : null;
  if (replaced) {
    const found = await instanceOfUnit(replaced);
    how = (await isRight(replaced, { base, values, modes })) ? "rename" : found && found.ofUnit ? "keep" : "rebuild";
  }
  plans.push({ one, base, values, modes, replaced, how, held });
}

// On a sheet that lays nothing out by itself, a new case would land on the sheet's corner, on a case that
// stands there. The new cases take a row of their own under everything the sheet holds, 48 apart, and a
// sheet that is a frame grows to hold them. A sheet with auto layout places them itself.
const CASE_GAP = 48;
const placesItself = Boolean(sheet) && "layoutMode" in sheet && sheet.layoutMode && sheet.layoutMode !== "NONE";
const stoodBefore = sheet ? [...sheet.children] : [];
const rowLeft = stoodBefore.length > 0 ? Math.min(...stoodBefore.map((child) => child.x)) : 0;
const rowTop = stoodBefore.length > 0 ? Math.max(...stoodBefore.map((child) => child.y + child.height)) + CASE_GAP : 0;
let nextLeft = rowLeft;

for (const { one, base, values, modes, replaced, how, held } of plans) {
  if (INPUTS.dryRun) {
    if (replaced) done.replaced.push([replaced.name, one.name, replaced.id, held, how]);
    else done.made.push([one.name, null, base.name]);
    continue;
  }
  let component = replaced;
  let instance = null;
  if (replaced && how !== "rebuild") {
    // The instance stays with its text overrides and the component keeps its layout; only a different version is swapped in.
    replaced.name = one.name;
    instance = replaced.children[0];
    if (how === "keep" && (await instance.getMainComponentAsync()) !== base) instance.swapComponent(base);
  } else {
    if (replaced) {
      for (const child of [...replaced.children]) child.remove();
      replaced.name = one.name;
    } else {
      component = figma.createComponent();
      component.name = one.name;
      component.fills = [];
      sheet.appendChild(component);
    }
    instance = base.createInstance();
    component.appendChild(instance);
    component.layoutMode = "VERTICAL";
    component.primaryAxisSizingMode = "AUTO";
    component.counterAxisSizingMode = "AUTO";
  }
  if (how !== "rename") {
    for (const text of instance.findAllWithCriteria({ types: ["TEXT"] })) {
      for (const segment of text.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(segment.fontName);
    }
    try {
      instance.setProperties(values);
    } catch (error) {
      done.problems.push(`${one.name}: made, but its properties were refused (${String(error.message || error).slice(0, 120)})`);
    }
    for (const { collection, modeId } of modes) {
      try {
        instance.setExplicitVariableModeForCollection(collection, modeId);
      } catch (error) {
        done.problems.push(`${one.name}: made, but the mode ${collection.name} was refused (${String(error.message || error).slice(0, 120)})`);
      }
    }
  }
  if (replaced) {
    done.replaced.push([one.replaces, one.name, component.id, held, how]);
  } else {
    if (!placesItself) {
      component.x = nextLeft;
      component.y = rowTop;
      nextLeft += component.width + CASE_GAP;
      const width = Math.max(sheet.width, component.x + component.width);
      const height = Math.max(sheet.height, component.y + component.height);
      if (sheet.type === "FRAME") sheet.resize(width, height);
      if (sheet.type === "SECTION") sheet.resizeWithoutConstraints(width, height);
    }
    done.made.push([one.name, component.id, base.name]);
  }
}
return done;
