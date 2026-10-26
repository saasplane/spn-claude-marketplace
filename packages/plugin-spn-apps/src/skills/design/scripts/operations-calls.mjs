// Prepares the calls that carry out the operations of one page of a library file, so that a page goes
// together: one bundled call for each step of the page, and not one for each unit. It makes no call to
// Figma; it reads the folders it is given and writes the files a writer sends, in the output folder.
//
//   node operations-calls.mjs prepare --page "<page's name>" <folders> [--decisions <file.json>]
//                                     [--lone-ids <file.json>] [--after-composing]
//   node operations-calls.mjs layout  --page "<page's name>" <folders>   (after 01-read's answer is saved as read.json)
//   node operations-calls.mjs check   --page "<page's name>" <folders>   (after 18-read's answer is saved as after.json)
//   node operations-calls.mjs summary <folders> [--decisions <file.json>]   (one line for each page; changes nothing)
//
// <folders> are --ops <folder of operation files> --specs <folder of specs> --readings <folder of readings>
// --plan <page plan file> --out <output folder>. `summary` does not need --out.
//   operation files  `<Unit>.json` in the folder, one for each unit: the form of an operation is in the step
//                    `operations-and-composing.md`, and `operations-check.mjs` checks the files offline.
//   specs            `<Unit>.json`: `unit`, `setId`, `keep` or `remove`, `dropProps`, `defaults`,
//                    `layoutDefaults`, as the step "A set changed by its spec" has them.
//   readings         the joined answers of `versions.js` (`versions-*.json`), as `check-answers.mjs` writes them.
//   page plan        a JSON list of pages: `[{ page, pageId, units: [{ unit, changes }] }]`, in the order the
//                    pages are taken. `changes` is true where the spec's removal is carried out before the
//                    operations (the set then starts from the versions that stay), false where the set starts
//                    as it was read.
//   output folder    the folder of a page is `<out>/<page's name, lower case, dashes>/`.
//
//   prepare  writes, each as a dry file and a real file, only where the page has such an operation:
//              01-read       read-sets.js, one run for each set with a names, copy, property, default or header
//              02/03 names   names.js, one run for each unit with names operations (all of them, in order)
//              04/05 copy    copy.js, one run for each unit with copy operations (a { from, to } for each entry)
//              06/07 property property.js, one run for each property operation
//              08/09 header  header.js, one run for each header operation
//              14/15 sheet   sheet.js, one run for each sheet operation
//              16/17 cases   cases.js, one run for each unit with case operations
//              18-read       read-sets.js, the sets of 01-read
//            and expected.json. Each file is the text of `bundle.mjs` for the script, and `<name>.inputs.json`
//            beside it holds the runs. A script of this folder that is not there is named in one line, and its
//            inputs are written all the same. `prepare` stops, writes nothing and exits 1 when it meets a thing
//            that only a decision can settle (below).
//   layout   reads read.json, checks each set against the readings, and writes 10/11 layout (layout.js with
//            the header's defaults and the padding, gap and mayMove as read) and 12/13 labels (labels.js with
//            `oldSetBox` as read) for each set whose versions' names or count change.
//   check    reads after.json and says, for each set read, whether every version that stood keeps its key under
//            the name the operations give it, whether the new versions are exactly the copies, whether the
//            default carries the header's defaults, and whether the header holds the layout and the notes.
//            Exit 1 when any set has a fault.
//
// A saved answer is the call's answer as returned, `{ script, runs, of, stopped, answers }`.
//
// A header operation's defaults are its `defaults` (`{ property: value }`) where it holds them, else the
// `to` of the unit's `default` operation, else the spec's `defaults`, else the spec's `layoutDefaults`,
// else the first version's value, each taken only where a version carries it.
//
// The operation files are not exact everywhere, and a program may not guess. A `replaces` that is not the
// usual sentence, a case whose `why` says it is repointed, a copy that brings in a property no version holds,
// and a unit with no set whose cases are made and that has no lone id each stop the program, naming the unit
// and the reason, unless the decisions file settles them. The usual `replaces` sentence is "the lone component
// `<name>` that stands on the sheet today is replaced by this instance".
//
// The decisions file (--decisions) is one JSON object, every key optional; the keys name a case as
// "<Unit>|<case name>":
//   irregularReplaces  { "<Unit>|<case>": { "name": "<the one component the case takes the place of>", "reason" }
//                                       | { "none": true, "reason" }   (the case replaces nothing)
//                                       | { "hand": true, "reason" } } (no script makes the case: it is left out)
//   repointed          { "<Unit>|<case>": { "name": "<the component's name on the sheet>", "reason" } }
//   afterComposing     { "<Unit>|<case>": "<reason>" }  cases left out unless --after-composing is given
//   addedByCopy        { "<Unit>": { "<property>": "<the value every version takes before the copies>" } }
//   propertyDefault    { "<Unit>": { "value": <the default a script takes instead of the operation's, or null for the
//                      characters the layer holds in the default version>, "reason" } }
//   leftToTheDeveloper { "<Unit>": ["<word>", …] }  every operation of the unit that names a word is left out
//                      (a question that waits for the developer), with its reason printed.
// The lone ids file (--lone-ids) is { "<Unit>": "<the id of the unit's lone component>" }, for a unit with
// no set whose cases are made.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { matches, nameOf, readSets, standingOf, strings, versionsAfter } from "./operations-versions.mjs";

const here = import.meta.dirname;
const USUAL_REPLACES = /^the lone component `([^`]+)` that stands on the sheet today is replaced by this instance/;
const USAGE = 'usage: node operations-calls.mjs prepare|layout|check --page "<page\'s name>" --ops <folder> --specs <folder> --readings <folder> --plan <file> --out <folder> [--decisions <file>] [--lone-ids <file>] [--after-composing]   |   node operations-calls.mjs summary --ops <folder> --specs <folder> --readings <folder> --plan <file> [--decisions <file>]';

// ---- the arguments

const args = process.argv.slice(2);
const stage = args[0];
if (!["prepare", "layout", "check", "summary"].includes(stage)) { console.error(USAGE); process.exit(2); }
const valueOf = (flag) => {
  const at = args.indexOf(flag);
  return at < 0 || at + 1 >= args.length ? null : args[at + 1];
};
const folders = { ops: valueOf("--ops"), specs: valueOf("--specs"), readings: valueOf("--readings"), plan: valueOf("--plan"), out: valueOf("--out") };
const pageName = valueOf("--page");
if (!folders.ops || !folders.specs || !folders.readings || !folders.plan || (stage !== "summary" && (!folders.out || !pageName))) { console.error(USAGE); process.exit(2); }
const jsonFile = (flag, fallback) => {
  const path = valueOf(flag);
  if (path === null) return fallback;
  if (!existsSync(path)) { console.error(`${flag} ${path}: no such file`); process.exit(2); }
  try { return JSON.parse(readFileSync(path, "utf8")); } catch (error) { console.error(`${flag} ${path} is not JSON: ${error.message}`); process.exit(2); }
};
const decisions = jsonFile("--decisions", {});
const loneIds = jsonFile("--lone-ids", {});
const afterComposing = args.includes("--after-composing");
const irregularReplaces = decisions.irregularReplaces ?? {};
const repointed = decisions.repointed ?? {};
const waitsForComposing = decisions.afterComposing ?? {};
const addedByCopy = decisions.addedByCopy ?? {};
const propertyDefault = decisions.propertyDefault ?? {};
const leftToTheDeveloper = decisions.leftToTheDeveloper ?? {};

// ---- helpers

const fnv = (text) => {
  let hash = 0x811c9dc5;
  for (let place = 0; place < text.length; place += 1) { hash ^= text.charCodeAt(place); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return hash.toString(16).padStart(8, "0");
};
const slugOf = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const isEmpty = (value) => value === undefined || value === null || (typeof value === "object" && Object.keys(value).length === 0);
const stopFor = (text) => { console.error(text); process.exit(2); };

const pagePlan = JSON.parse(readFileSync(folders.plan, "utf8"));
const sets = readSets(folders.readings);
const specOf = (unit) => JSON.parse(readFileSync(join(folders.specs, `${unit}.json`), "utf8"));

// ---- one unit's operations, made exact

// The operations of a unit that the calls carry, and what is left out of them with the reason.
const operationsOf = (draw, leftOut) => {
  const words = leftToTheDeveloper[draw.unit] ?? [];
  if (words.length === 0) return draw.ops ?? [];
  const mentions = (value) => words.some((word) => new RegExp(`\\b${word}\\b`).test(JSON.stringify(value)));
  const lines = new Set((draw.choices ?? []).filter((choice) => mentions(choice.what)).flatMap((choice) => choice.lines));
  return (draw.ops ?? []).filter((operation) => {
    const names = mentions(operation) || ((operation.lines ?? []).length > 0 && operation.lines.every((line) => lines.has(line)));
    if (names) leftOut.push(`${draw.unit}: ${operation.op}${operation.name ? ` ${operation.name}` : ""} names ${words.join(" or ")}, a question with the developer`);
    return !names;
  });
};

// A variant property that a unit's copies bring in and that no version holds yet is first added to every
// version by a `names` fold, at the value the decisions give, and the unit's header states it, in the rows.
const withAddedProperties = (unitName, spec, operations, faultsFound, remarks) => {
  const firstCopy = operations.findIndex((operation) => operation.op === "copy");
  if (firstCopy < 0 || !spec.setId) return operations;
  const held = Object.keys(versionsAfter(sets, spec, operations.slice(0, firstCopy))[0] ?? {});
  const valuesOf = new Map();
  for (const operation of operations.filter((one) => one.op === "copy")) {
    for (const to of Array.isArray(operation.to) ? operation.to : [operation.to]) {
      for (const [property, value] of Object.entries(to ?? {})) {
        if (held.includes(property)) continue;
        valuesOf.set(property, [...new Set([...(valuesOf.get(property) ?? []), String(value)])]);
      }
    }
  }
  if (valuesOf.size === 0) return operations;
  const decided = addedByCopy[unitName] ?? {};
  const undecided = [...valuesOf.keys()].filter((property) => !(property in decided));
  if (undecided.length > 0) { faultsFound.push(`${unitName}: a copy adds ${undecided.join(", ")}, which no version holds, and the decisions file does not decide it in addedByCopy (the value every version takes before the copies)`); return operations; }
  const set = Object.fromEntries([...valuesOf.keys()].map((property) => [property, decided[property]]));
  const next = operations.map((operation) => ({ ...operation }));
  next.splice(firstCopy, 0, { op: "names", lines: [], why: `adds ${Object.keys(set).join(", ")} to every version before the copies`, fold: [{ match: {}, set }] });
  const header = next.find((operation) => operation.op === "header");
  if (header) {
    for (const [property, values] of valuesOf) {
      const clause = [`${property}=${decided[property]} (default)`, ...values.filter((value) => value !== decided[property])].join(", ");
      const parts = String(header.layout).split(" · ");
      const rows = parts.findIndex((part) => part.startsWith("rows: ") || part === "one row");
      if (rows < 0) { faultsFound.push(`${unitName}: the header's layout has no rows clause to state ${property} in`); continue; }
      parts[rows] = parts[rows] === "one row" ? `rows: ${clause}` : `rows: ${clause} x ${parts[rows].slice("rows: ".length)}`;
      header.layout = parts.join(" · ");
      header.defaults = { ...(header.defaults ?? {}), [property]: decided[property] };
    }
  }
  remarks.push(`${unitName}: ${Object.entries(set).map(([property, value]) => `${property}=${value}`).join(", ")} is added to every version before the copies, and the header states it: ${header?.layout ?? "no header"}`);
  return next;
};

// The defaults a header states, by the order in the header comment.
const defaultsOf = (spec, operations, versions) => {
  const header = operations.find((operation) => operation.op === "header");
  const toDefault = operations.find((operation) => operation.op === "default")?.to ?? {};
  const result = {};
  for (const property of Object.keys(versions[0] ?? {})) {
    const wanted = [header?.defaults?.[property], toDefault[property], spec.defaults?.[property], spec.layoutDefaults?.[property]].filter((value) => value !== undefined).map(String);
    result[property] = wanted.find((value) => versions.some((cells) => cells[property] === value)) ?? versions[0][property];
  }
  return result;
};

// A case as `cases.js` takes it, or null when the case goes to the hand. A case whose `replaces` is neither
// the usual sentence nor decided stops the program.
const caseOf = (draw, operation, leftOut) => {
  const key = `${draw.unit}|${operation.name}`;
  if (waitsForComposing[key] && !afterComposing) { leftOut.push(`${draw.unit}: case ${operation.name} waits for the composing (${waitsForComposing[key]})`); return null; }
  let replaces = null;
  if (operation.replaces) {
    const usual = USUAL_REPLACES.exec(operation.replaces);
    if (usual) replaces = usual[1];
    else if (irregularReplaces[key]) {
      const decision = irregularReplaces[key];
      if (decision.hand) { leftOut.push(`${draw.unit}: case ${operation.name} goes to the hand (${decision.reason})`); return null; }
      replaces = decision.none ? null : decision.name;
    } else stopFor(`${draw.unit}: case ${operation.name} holds a \`replaces\` sentence that is not the usual one and is not decided in irregularReplaces of the decisions file (--decisions): ${operation.replaces}`);
  } else if (/repointed/.test(operation.why ?? "")) {
    if (!repointed[key]) stopFor(`${draw.unit}: case ${operation.name} says it is repointed and is not decided in repointed of the decisions file (--decisions)`);
    replaces = repointed[key].name;
  }
  if (!isEmpty(operation.swap)) { leftOut.push(`${draw.unit}: case ${operation.name} holds a swap, which no script makes`); return null; }
  const entry = { name: operation.name, base: operation.base, props: operation.props ?? {}, stands: false };
  if (!isEmpty(operation.text)) entry.text = operation.text;
  if (!isEmpty(operation.modes)) entry.modes = operation.modes;
  if (replaces !== null) entry.replaces = replaces;
  return entry;
};

// ---- one page's calls, worked out and not written

const build = (name) => {
  const plan = pagePlan.find((one) => one.page === name);
  if (!plan) stopFor(`no page named ${name} in the page plan`);
  const leftOut = [];
  const remarks = [];
  const needsLone = [];
  const faultsFound = [];
  const withOperations = [];
  const unitsLaidOut = [];
  const inputs = { read: [], names: [], copy: [], property: [], header: [], sheet: [], cases: [] };
  const expected = {};
  for (const unit of plan.units) {
    const path = join(folders.ops, `${unit.unit}.json`);
    if (!existsSync(path)) continue;
    const draw = JSON.parse(readFileSync(path, "utf8"));
    const spec = specOf(unit.unit);
    const operations = withAddedProperties(unit.unit, spec, operationsOf(draw, leftOut), faultsFound, remarks);
    if (operations.length === 0) continue;
    withOperations.push(unit.unit);
    const setId = spec.setId ?? null;
    const kinds = new Set(operations.map((operation) => operation.op));
    const base = { setId, unit: unit.unit };

    if (setId !== null && ["names", "copy", "property", "default", "header"].some((kind) => kinds.has(kind))) inputs.read.push(kinds.has("copy") ? { setId, listVersions: true } : { setId });
    if (kinds.has("names")) {
      inputs.names.push({ ...base, ops: operations.filter((operation) => operation.op === "names").map(({ renameProperty, renameValue, fold, dropProperty }) => Object.fromEntries(Object.entries({ renameProperty, renameValue, fold, dropProperty }).filter(([, value]) => value !== undefined))) });
    }

    // copies: each entry of each `to`, from a twin that is exactly one version
    if (kinds.has("copy")) {
      const copies = [];
      for (const [at, operation] of operations.entries()) {
        if (operation.op === "names" && operations.slice(0, at).some((one) => one.op === "copy")) faultsFound.push(`${unit.unit}: a names operation comes after a copy, so a copy's twin may be named differently when copy.js runs`);
        if (operation.op !== "copy") continue;
        const standing = versionsAfter(sets, spec, operations.slice(0, at));
        const found = standing.filter((cells) => matches(cells, operation.from));
        const beforeAnyCopy = versionsAfter(sets, spec, operations.slice(0, at).filter((one) => one.op === "names"));
        // The twin is passed with every cell: a partial `from` would also match a copy this run makes of it.
        const exact = found.length > 0 ? strings(found[0]) : strings(operation.from);
        if (found.length > 1) remarks.push(`${unit.unit}: copy from ${JSON.stringify(operation.from)} matches ${found.length} versions; the twin is made exact as the first of them, ${nameOf(found[0])}`);
        if (found.length > 0 && !beforeAnyCopy.some((cells) => nameOf(cells) === nameOf(found[0]))) remarks.push(`${unit.unit}: copy from ${nameOf(found[0])}, a version an earlier copy of the unit makes`);
        for (const to of Array.isArray(operation.to) ? operation.to : [operation.to]) copies.push({ from: exact, to: strings(to) });
      }
      inputs.copy.push({ ...base, copies });
    }
    for (const operation of operations.filter((one) => one.op === "property")) {
      const fixed = propertyDefault[unit.unit];
      inputs.property.push({ ...base, name: operation.name, type: operation.type, layer: operation.layer, ties: operation.ties, default: fixed ? fixed.value : operation.default });
    }
    // A header's layout is written only for a set that these calls lay out again (a change of names, a copy,
    // a default). A set that stays as it is drawn keeps the layout its header states and takes only the notes.
    const laidOutAgain = setId !== null && ["names", "copy", "default"].some((kind) => kinds.has(kind));
    for (const operation of operations.filter((one) => one.op === "header")) {
      const layout = laidOutAgain ? operation.layout : null;
      const notes = operation.notes ?? [];
      if (layout === null && notes.length === 0) continue;
      inputs.header.push(setId !== null ? { ...base, layout, notes } : { unit: unit.unit, setId: null, pageId: plan.pageId, layout, notes });
    }
    // A new sheet's own label lists the cases the calls put on it, as the sheets that stand do.
    const caseNames = operations.filter((one) => one.op === "case").map((one) => one.name);
    for (let sheetAt = 0; sheetAt < operations.filter((one) => one.op === "sheet").length; sheetAt += 1) {
      inputs.sheet.push(caseNames.length > 0 ? { unit: unit.unit, setId, pageId: plan.pageId, label: caseNames.join(", ") } : { unit: unit.unit, setId, pageId: plan.pageId });
    }
    const caseOperations = operations.filter((one) => one.op === "case");
    if (caseOperations.length > 0) {
      const cases = caseOperations.map((operation) => caseOf(draw, operation, leftOut)).filter((one) => one !== null);
      const properties = cases.flatMap((one) => Object.keys(one.text ?? {}));
      const added = operations.filter((one) => one.op === "property").map((one) => one.name);
      for (const property of new Set(properties)) if (added.includes(property)) remarks.push(`${unit.unit}: text property ${property} is added by the unit's property operation, so a dry call before it would not find it`);
      if (cases.length > 0) {
        const casesSpec = { unit: unit.unit, setId };
        if (setId === null) {
          casesSpec.loneId = loneIds[unit.unit] ?? null;
          if (casesSpec.loneId === null) needsLone.push(unit.unit);
        }
        inputs.cases.push({ spec: { ...casesSpec, cases } });
      }
    }

    // what expected.json holds for a set
    if (setId !== null) {
      const standing = standingOf(sets, spec);
      const after = versionsAfter(sets, spec, operations.filter((operation) => operation.op === "names" || operation.op === "copy"));
      const header = operations.find((operation) => operation.op === "header");
      const defaults = defaultsOf(spec, operations, after);
      const stood = after.slice(0, standing.length).map((cells, place) => `${standing[place].key}=${nameOf(cells)}`);
      const readings = (sets.get(setId) ?? []).map((version) => `${version.key}=${version.name}`);
      const hashBefore = fnv((unit.changes
        ? standing.map((version) => `${version.key}=${nameOf(version.cells)}`)
        : readings).sort().join("\n"));
      expected[setId] = {
        unit: unit.unit,
        today: standing.length,
        count: after.length,
        names: after.map(nameOf),
        copies: after.slice(standing.length).map(nameOf),
        stood,
        hashBefore,
        hashStood: fnv([...stood].sort().join("\n")),
        defaultAfter: header ? nameOf(defaults) : null,
        layout: laidOutAgain ? header?.layout ?? null : null,
        notes: header?.notes ?? [],
        changesToday: Boolean(unit.changes),
      };
      if (kinds.has("names") || kinds.has("copy") || kinds.has("default")) unitsLaidOut.push({ setId, unit: unit.unit, defaults: header ? defaults : null });
    }
  }
  return { plan, leftOut, remarks, needsLone, faultsFound, withOperations, inputs, expected, unitsLaidOut };
};

// ---- the files of a page

const FILES = [
  ["01-read", "read-sets.js", "read", false],
  ["02-names", "names.js", "names", true],
  ["04-copy", "copy.js", "copy", true],
  ["06-property", "property.js", "property", true],
  ["08-header", "header.js", "header", true],
  ["14-sheet", "sheet.js", "sheet", true],
  ["16-cases", "cases.js", "cases", true],
  ["18-read", "read-sets.js", "read", false],
];
// The number of the real file follows the dry file's.
const fileNames = (prefix, hasDry) => {
  if (!hasDry) return [{ name: prefix, dryRun: null }];
  const number = Number(prefix.slice(0, 2));
  const word = prefix.slice(3);
  return [{ name: `${prefix}-dry`, dryRun: true }, { name: `${String(number + 1).padStart(2, "0")}-${word}-real`, dryRun: false }];
};

const writeBundle = (folder, script, inputs, name) => {
  writeFileSync(join(folder, `${name}.inputs.json`), JSON.stringify(inputs));
  const path = join(here, script);
  if (!existsSync(path)) { console.log(`  ${name}: ${script} is not there yet; ${name}.inputs.json is written (${inputs.length} runs)`); return; }
  try {
    const said = execFileSync(process.execPath, [join(here, "bundle.mjs"), "--script", path, "--inputs", join(folder, `${name}.inputs.json`), "--out", join(folder, name), "--seconds", "40"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    process.stdout.write(said.replaceAll(`${folder}/`, "  "));
  } catch (error) {
    const reason = String(error.stderr ?? error.message).trim().split("\n")[0];
    console.log(`  ${name}: ${script} is not ready to bundle (${reason}); ${name}.inputs.json is written (${inputs.length} runs)`);
  }
};

const answersOf = (folder, file) => {
  const path = join(folder, file);
  if (!existsSync(path)) stopFor(`save the call's answer as ${path} first`);
  const saved = JSON.parse(readFileSync(path, "utf8"));
  const list = Array.isArray(saved) ? saved.flatMap((one) => one.answers) : saved.answers;
  return new Map(list.map((answer) => [answer.setId, answer]));
};

if (stage === "summary") {
  const totals = { units: 0, left: 0, faults: 0 };
  for (const plan of pagePlan) {
    const built = build(plan.page);
    const runs = FILES.map(([prefix, , key, hasDry]) => ({ prefix, count: built.inputs[key].length, hasDry })).filter((one) => one.count > 0);
    const laidOut = built.unitsLaidOut.length;
    totals.units += built.withOperations.length; totals.left += built.leftOut.length + built.needsLone.length; totals.faults += built.faultsFound.length;
    console.log(`${plan.page} (${plan.pageId}): ${built.withOperations.length} of ${plan.units.length} units with operations${built.withOperations.length > 0 ? ` (${built.withOperations.join(", ")})` : ""}`);
    if (runs.length > 0) console.log(`  runs: ${runs.map((one) => `${one.prefix} ${one.count}`).join(", ")}${laidOut > 0 ? `, layout ${laidOut}, labels ${laidOut} (after read.json)` : ""}`);
    for (const line of built.leftOut) console.log(`  left out: ${line}`);
    for (const line of built.remarks) console.log(`  note: ${line}`);
    for (const line of built.faultsFound) console.log(`  FAULT: ${line}`);
    if (built.needsLone.length > 0) console.log(`  needs a lone id: ${built.needsLone.join(", ")}`);
  }
  console.log(`${pagePlan.length} pages, ${totals.units} units with operations, ${totals.left} lines of what is left out or open, ${totals.faults} faults`);
  process.exit(totals.faults > 0 ? 1 : 0);
}

const built = build(pageName);
const folder = join(resolve(folders.out), slugOf(pageName));
console.log(`${pageName} (${built.plan.pageId}): ${built.withOperations.length} units with operations, in ${folder}`);

if (stage === "prepare") {
  for (const line of built.faultsFound) console.log(`  FAULT: ${line}`);
  if (built.needsLone.length > 0) console.log(`  FAULT: no lone id (--lone-ids): ${built.needsLone.join(", ")}`);
  if (built.faultsFound.length > 0 || built.needsLone.length > 0) { console.log("nothing written"); process.exit(1); }
  mkdirSync(folder, { recursive: true });
  for (const old of readdirSync(folder).filter((name) => /^\d\d-.*\.(js|inputs\.json)$/.test(name))) rmSync(join(folder, old));
  for (const [prefix, script, key, hasDry] of FILES) {
    const list = built.inputs[key];
    if (list.length === 0) continue;
    for (const { name, dryRun } of fileNames(prefix, hasDry)) writeBundle(folder, script, dryRun === null ? list : list.map((one) => ({ ...one, dryRun })), name);
  }
  writeFileSync(join(folder, "expected.json"), `${JSON.stringify(built.expected, null, 2)}\n`);
  if (existsSync(join(folder, "after.json"))) {
    const answers = answersOf(folder, "after.json");
    for (const [setId, want] of Object.entries(built.expected)) {
      const answer = answers.get(setId);
      if (answer && answer.hash && answer.hash !== want.hashBefore) console.log(`  NOTE ${want.unit}: after.json holds hash ${answer.hash}, the starting state here is ${want.hashBefore}`);
    }
  }
  for (const line of built.leftOut) console.log(`  left out: ${line}`);
  for (const line of built.remarks) console.log(`  note: ${line}`);
  console.log(`expected.json: ${Object.values(built.expected).map((one) => `${one.unit} ${one.today} -> ${one.count}`).join(", ") || "no sets"}`);
}

if (stage === "layout") {
  const expected = JSON.parse(readFileSync(join(folder, "expected.json"), "utf8"));
  const read = answersOf(folder, "read.json");
  let faults = 0;
  const layoutInputs = [];
  const labelInputs = [];
  for (const one of built.unitsLaidOut) {
    const answer = read.get(one.setId);
    const want = expected[one.setId];
    if (!answer || answer.refused) { console.log(`FAULT ${one.unit}: not read (${answer?.refused ?? "no answer"})`); faults += 1; continue; }
    // A set read again after its names and copies are done holds exactly the names the operations give.
    const namesRead = Array.isArray(answer.versions) ? answer.versions.map((version) => (Array.isArray(version) ? version[1] : String(version).slice(String(version).indexOf("=") + 1))).sort() : null;
    const namesDone = namesRead !== null && JSON.stringify(namesRead) === JSON.stringify([...want.names].sort());
    const state = answer.hash === want.hashBefore ? "as it stands today" : (want.copies.length === 0 && answer.hash === want.hashStood) || namesDone ? "the operations are carried out already" : null;
    // A set whose operations are partly carried out (its names done, its copies refused or not yet made) holds
    // the count of versions it had or the count it will have, under names between the two.
    const partly = state === null && (answer.count === want.today || answer.count === want.count);
    if (state === null && !partly) { console.log(`FAULT ${one.unit}: ${answer.count} versions, and their keys and names are not the state today's calls left (${want.today}): the set changed since`); faults += 1; continue; }
    if (partly) console.log(`NOTE ${one.unit}: ${answer.count} versions under names that are neither the start's nor the end's: its operations are partly carried out`);
    if (one.defaults === null) { console.log(`FAULT ${one.unit}: no header operation gives its defaults`); faults += 1; continue; }
    console.log(`${one.unit}: ${state ?? "partly carried out"}; box ${JSON.stringify(answer.box)}, padding ${answer.padding[0]}, gap ${answer.gap}, ${answer.labels} labels in its section`);
    layoutInputs.push({ setId: one.setId, defaults: one.defaults, padding: answer.padding[0], gap: answer.gap, mayMove: answer.mayMove ?? [], ignore: answer.setLabels ?? [], listMoves: 0 });
    labelInputs.push({ setId: one.setId, oldSetBox: answer.box });
  }
  if (faults > 0) { console.log(`${faults} faults: nothing written`); process.exit(1); }
  for (const dryRun of [true, false]) {
    if (layoutInputs.length > 0) writeBundle(folder, "layout.js", layoutInputs.map((one) => ({ ...one, dryRun })), dryRun ? "10-layout-dry" : "11-layout-real");
    if (labelInputs.length > 0) writeBundle(folder, "labels.js", labelInputs.map((one) => ({ ...one, dryRun })), dryRun ? "12-labels-dry" : "13-labels-real");
  }
}

if (stage === "check") {
  const expected = JSON.parse(readFileSync(join(folder, "expected.json"), "utf8"));
  const after = answersOf(folder, "after.json");
  let faults = 0;
  for (const [setId, want] of Object.entries(expected)) {
    const answer = after.get(setId);
    const found = [];
    if (!answer || answer.refused) found.push("not read");
    else {
      if (answer.count !== want.count) found.push(`${answer.count} versions, the operations give ${want.count}`);
      if (Array.isArray(answer.versions)) {
        // `versions` is a list of [key, name] pairs or of `key=name` lines
        const lines = answer.versions.map((version) => (Array.isArray(version) ? `${version[0]}=${version[1]}` : version));
        const missing = want.stood.filter((line) => !lines.includes(line));
        if (missing.length > 0) found.push(`${missing.length} versions that stood are not under their key and name, first ${missing[0]}`);
        const newNames = lines.filter((line) => !want.stood.includes(line)).map((line) => line.slice(line.indexOf("=") + 1)).sort();
        if (JSON.stringify(newNames) !== JSON.stringify([...want.copies].sort())) found.push(`the new versions are [${newNames.join(" | ")}], the copies are [${want.copies.join(" | ")}]`);
      } else if (want.copies.length === 0) {
        if (answer.hash !== want.hashStood) found.push("the versions' keys and names are not the operations'");
      } else {
        found.push(`UNPROVEN: the keys of the ${want.stood.length} versions that stood cannot be told from the hash beside ${want.copies.length} copies; read the set with \`listVersions: true\``);
      }
      if (want.defaultAfter !== null && answer.default !== want.defaultAfter) found.push(`the default is [${answer.default}], not [${want.defaultAfter}]`);
      if (want.layout !== null && (!answer.header || !answer.header.includes(want.layout))) found.push("the header does not hold the layout clause");
      for (const note of want.notes) if (answer.header && !answer.header.includes(note)) found.push(`the header does not hold the note [${note}]`);
    }
    faults += found.length > 0 ? 1 : 0;
    console.log(`${found.length > 0 ? "FAULT" : "whole"} ${want.unit}: ${found.length > 0 ? found.join("; ") : `${answer.count} versions, each that stood under its key; default [${answer.default}]`}`);
  }
  console.log(`${Object.keys(expected).length} sets, ${faults} with faults`);
  process.exit(faults > 0 ? 1 : 0);
}
