// Makes the cases of one unit's spec that the set's own properties can produce, on the unit's sheet.
// NOT YET RUN AGAINST A FILE: only its stand-in test has run it. Send it dry first and read what it says.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else. DRY IS THE DEFAULT: with `dryRun: true` it
// changes nothing and returns what it would make. Run it after `apply-spec.js` has renamed the set, so
// that a case's `base` is read against the names the versions then have.
//
// A sheet is the frame named `<Unit> cases` in the unit's section. A case is a component on it, named as
// the spec names it, that holds one instance of the unit with the case's `props` set. A case whose name
// already stands on the sheet is left as it is. On a sheet with no auto layout the new cases stand in a
// row of their own under the cases that are there. What this script does not do, and reports in `problems`:
// make a sheet where the unit has none, set a swap property, and write the sheet's label.
//
//   spec    the spec's `unit`, `setId` and `cases` (each with `name`, `base`, `props`, `stands`)

const INPUTS = {
  spec: null,
  dryRun: true,
};

const spec = INPUTS.spec;
const set = await figma.getNodeByIdAsync(spec.setId);
if (!set || set.type !== "COMPONENT_SET" || set.name !== spec.unit) {
  return { refused: `${spec.setId} is not the set ${spec.unit}` };
}
let page = set.parent;
while (page && page.type !== "PAGE") page = page.parent;
await figma.setCurrentPageAsync(page);

const cellsOf = (name) => Object.fromEntries(name.split(", ").map((cell) => {
  const at = cell.indexOf("=");
  return [cell.slice(0, at), cell.slice(at + 1)];
}));
const matches = (cells, pattern) => Object.entries(pattern).every(([property, value]) => cells[property] === String(value));

const home = set.parent;
const sheet = home.children.find((child) => (child.type === "FRAME" || child.type === "SECTION") && child.name === `${spec.unit} cases`);
const definitions = set.componentPropertyDefinitions;
// A property's full key: a variant's is its name, any other kind carries `#id` after it.
const keyOf = (property) => Object.keys(definitions).find((key) => key === property || key.startsWith(property + "#"));
const versions = set.children.filter((child) => child.type === "COMPONENT");

const done = { unit: spec.unit, dryRun: INPUTS.dryRun, sheet: sheet ? sheet.id : null, made: [], stood: [], problems: [] };
const wanted = (spec.cases || []).filter((one) => !one.stands);
if (!sheet && wanted.length > 0) {
  done.problems.push(`no sheet named "${spec.unit} cases": ${wanted.length} cases not made`);
  return done;
}

// On a sheet that lays nothing out by itself, a new case would land on the sheet's corner, on a case that
// stands there. The new cases take a row of their own under everything the sheet holds, 48 apart, and a
// sheet that is a frame grows to hold them. A sheet with auto layout places them itself.
const CASE_GAP = 48;
const placesItself = sheet && "layoutMode" in sheet && sheet.layoutMode && sheet.layoutMode !== "NONE";
const stoodBefore = sheet ? [...sheet.children] : [];
const rowLeft = stoodBefore.length > 0 ? Math.min(...stoodBefore.map((child) => child.x)) : 0;
const rowTop = stoodBefore.length > 0 ? Math.max(...stoodBefore.map((child) => child.y + child.height)) + CASE_GAP : 0;
let nextLeft = rowLeft;

for (const one of wanted) {
  if (sheet.children.some((child) => child.name === one.name)) { done.stood.push(one.name); continue; }
  const base = versions.find((version) => matches(cellsOf(version.name), one.base || {}));
  if (!base) { done.problems.push(`${one.name}: no version matches its base`); continue; }
  const values = {};
  let unknown = null;
  for (const [property, value] of Object.entries(one.props || {})) {
    const key = keyOf(property);
    if (!key) { unknown = `the set holds no property \`${property}\``; break; }
    if (definitions[key].type === "INSTANCE_SWAP") { unknown = `\`${property}\` is a swap, which this script does not set`; break; }
    values[key] = definitions[key].type === "BOOLEAN" ? value === true || value === "true" : String(value);
  }
  if (unknown) { done.problems.push(`${one.name}: ${unknown}`); continue; }
  if (!INPUTS.dryRun) {
    const component = figma.createComponent();
    component.name = one.name;
    component.fills = [];
    sheet.appendChild(component);
    const instance = base.createInstance();
    component.appendChild(instance);
    component.layoutMode = "VERTICAL";
    component.primaryAxisSizingMode = "AUTO";
    component.counterAxisSizingMode = "AUTO";
    try {
      instance.setProperties(values);
    } catch (error) {
      done.problems.push(`${one.name}: made, but its properties were refused (${String(error.message || error).slice(0, 120)})`);
    }
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
  } else {
    done.made.push([one.name, null, base.name]);
  }
}
return done;
