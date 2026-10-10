// Checks the operation files of the units against their specs and the readings, with no call to Figma.
//
//   node operations-check.mjs --ops <folder of operation files> --specs <folder of specs> --readings <folder of readings> [--modes <file.json>] [<Unit> …]
//
// A unit's operations are `<Unit>.json` in the operations folder (the form is in the step
// `operations-and-composing.md`). The specs are `<Unit>.json` in the specs folder, and the readings are the
// joined answers of `versions.js` (`versions-*.json`). For each spec (all of them when no unit is named) it checks:
//   - the file is there, is JSON, and names the spec's unit and set
//   - every line of the spec's `needsDrawing` is accounted for exactly once, in `ops`, `choices`, `compose`
//     or `nothing` (two operations of one line are allowed only inside `ops`)
//   - every operation is one of the closed list (names, copy, property, sheet, case, default, header) and
//     holds what its kind needs
//   - the `names` operations, applied in order to the versions that stay, leave no two versions with one
//     name (a fold may add a property the names do not hold, and an empty `match` is every version)
//   - a `copy` starts from a version that is there then and makes a version that is not
//   - a `case` and a `default` name a version that is there after the names and the copies
//   - a case's mode is one of the modes the file can set, where `--modes` gives them: a JSON object of
//     `{ "<collection>": ["<mode>", …] }` read from the library's core file. Without it the modes are not checked.
//   - where the unit has an operation that changes its set, a `header` in the strict form names every property
//     once and every version has a place of its own in it (a property added by a choice is allowed when the
//     header says so)
// Prints one line for each fault and one line of counts for each unit; a last line of totals. Exit 1 on a
// fault or on a unit with lines owed and no file, 2 on a wrong call.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { matches, nameOf, readSets, standingOf } from "./operations-versions.mjs";

const argumentsGiven = process.argv.slice(2);
const folderOf = (flag) => {
  const at = argumentsGiven.indexOf(flag);
  if (at < 0 || at + 1 >= argumentsGiven.length) return null;
  const [, value] = argumentsGiven.splice(at, 2);
  return value;
};
const operationsFolder = folderOf("--ops");
const specsFolder = folderOf("--specs");
const readingsFolder = folderOf("--readings");
const modesFile = folderOf("--modes");
if (!operationsFolder || !specsFolder || !readingsFolder) {
  console.error("usage: node operations-check.mjs --ops <folder of operation files> --specs <folder of specs> --readings <folder of readings> [--modes <file.json>] [<Unit> …]");
  process.exit(2);
}
const MODES = modesFile ? JSON.parse(readFileSync(modesFile, "utf8")) : null;
const KINDS = ["names", "copy", "property", "sheet", "case", "default", "header"];

const sets = readSets(readingsFolder);

const wanted = argumentsGiven;
const files = wanted.length > 0 ? wanted.map((unit) => `${unit}.json`) : readdirSync(specsFolder).filter((name) => name.endsWith(".json")).sort();
const totals = { units: 0, lines: 0, ops: 0, choices: 0, compose: 0, nothing: 0, faulty: 0, missing: 0 };
const byKind = Object.fromEntries(KINDS.map((kind) => [kind, 0]));
for (const file of files) {
  const spec = JSON.parse(readFileSync(join(specsFolder, file), "utf8"));
  const lines = (spec.needsDrawing ?? []).length;
  totals.units += 1; totals.lines += lines;
  const path = join(operationsFolder, file);
  if (!existsSync(path)) { if (lines > 0) { console.log(`${file}: NO FILE, ${lines} lines owed`); totals.missing += 1; } continue; }
  const faults = [];
  let draw;
  try { draw = JSON.parse(readFileSync(path, "utf8")); } catch (error) { console.log(`${file}: not JSON (${error.message})`); totals.faulty += 1; continue; }
  if (draw.unit !== spec.unit || (draw.setId ?? null) !== (spec.setId ?? null)) faults.push(`names ${draw.unit} ${draw.setId}, the spec is ${spec.unit} ${spec.setId}`);

  // every line once
  const seen = new Map();
  const count = (list, part) => { for (const one of list ?? []) for (const line of new Set(one.lines ?? [])) seen.set(line, [...(seen.get(line) ?? []), part]); };
  count(draw.ops, "ops"); count(draw.choices, "choices"); count(draw.compose, "compose"); count(draw.nothing, "nothing");
  for (let line = 0; line < lines; line += 1) {
    const parts = [...new Set(seen.get(line) ?? [])];
    if (parts.length === 0) faults.push(`line ${line} is not accounted for: ${spec.needsDrawing[line].what.slice(0, 70)}`);
    // A line may be half an operation and half something else: a sheet made by script whose cases are
    // composed, a property that waits for a choice. It may never be owed and not owed at once.
    if (parts.length > 1 && !(parts.length === 2 && parts.includes("ops") && !parts.includes("nothing"))) faults.push(`line ${line} is in ${parts.join(" and ")}`);
  }
  for (const line of seen.keys()) if (!(Number.isInteger(line) && line >= 0 && line < lines)) faults.push(`names line ${line}, and the spec has ${lines}`);

  // the versions as the operations leave them
  let versions = spec.setId ? standingOf(sets, spec).map((version) => version.cells) : [];
  let header = null;
  for (const [at, operation] of (draw.ops ?? []).entries()) {
    const where = `op ${at} (${operation.op})`;
    if (!KINDS.includes(operation.op)) { faults.push(`${where}: not an operation of the list`); continue; }
    byKind[operation.op] += 1; totals.ops += 1;
    if (operation.op !== "header" && !Array.isArray(operation.lines)) faults.push(`${where}: no \`lines\``);
    if (operation.op === "names") {
      for (const [from, to] of Object.entries(operation.renameProperty ?? {})) versions = versions.map((cells) => Object.fromEntries(Object.entries(cells).map(([property, value]) => [property === from ? to : property, value])));
      for (const one of operation.renameValue ?? []) for (const cells of versions) if (cells[one.property] === String(one.from)) cells[one.property] = String(one.to);
      for (const one of operation.fold ?? []) for (const cells of versions) if (matches(cells, one.match)) Object.assign(cells, Object.fromEntries(Object.entries(one.set).map(([property, value]) => [property, String(value)])));
      for (const property of operation.dropProperty ?? []) {
        // A dropped property may hold two values when a fold has carried the difference into another
        // property (`selected=true` folded into `state=selected`): the names must only stay unique.
        versions = versions.map((cells) => Object.fromEntries(Object.entries(cells).filter(([name]) => name !== property)));
      }
      const names = versions.map(nameOf);
      if (new Set(names).size !== names.length) faults.push(`${where}: two versions have one name after it`);
      if (names.includes("") && versions.length > 1) faults.push(`${where}: a version is left with no property`);
    }
    if (operation.op === "copy") {
      const twin = versions.find((cells) => matches(cells, operation.from));
      if (!twin) { faults.push(`${where}: no version matches its twin ${JSON.stringify(operation.from)}`); continue; }
      if (!("look" in operation)) faults.push(`${where}: no \`look\` (words, or null)`);
      for (const to of Array.isArray(operation.to) ? operation.to : [operation.to]) {
        const made = { ...twin, ...Object.fromEntries(Object.entries(to ?? {}).map(([property, value]) => [property, String(value)])) };
        if (versions.some((cells) => nameOf(cells) === nameOf(made))) faults.push(`${where}: [${nameOf(made)}] is there already`);
        else versions.push(made);
      }
    }
    if (operation.op === "property") {
      if (!operation.name || !["BOOLEAN", "TEXT"].includes(operation.type) || !operation.layer || !["visible", "characters"].includes(operation.ties)) faults.push(`${where}: needs name, type BOOLEAN or TEXT, layer, ties visible or characters`);
    }
    if (operation.op === "case") {
      if (!operation.name || !operation.proves) faults.push(`${where}: needs name and proves`);
      if (spec.setId && versions.length > 0 && !versions.some((cells) => matches(cells, operation.base))) faults.push(`${where} ${operation.name}: no version matches its base ${JSON.stringify(operation.base)}`);
      if (MODES) for (const [collection, mode] of Object.entries(operation.modes ?? {})) if (!(MODES[collection] ?? []).includes(mode)) faults.push(`${where} ${operation.name}: ${collection} has no mode ${mode}`);
    }
    if (operation.op === "default" && !versions.some((cells) => matches(cells, operation.to))) faults.push(`${where}: no version matches ${JSON.stringify(operation.to)}`);
    if (operation.op === "header") header = operation;
  }

  // the header, where the unit has an operation that changes its set
  const changesSet = (draw.ops ?? []).some((operation) => ["names", "copy", "default"].includes(operation.op));
  if (changesSet && !header) faults.push("the set changes and no `header` operation says its layout");
  if (header && spec.setId && (draw.choices ?? []).length === 0) {
    const stated = [];
    for (const clause of String(header.layout ?? "").split(" · ").map((part) => part.trim())) {
      const side = clause.startsWith("rows: ") ? "rows" : clause.startsWith("columns: ") ? "columns" : null;
      if (side === null) { if (!["one row", "one column"].includes(clause)) faults.push(`header: the clause "${clause.slice(0, 40)}" is no layout clause`); continue; }
      for (const piece of clause.slice(side.length + 2).split(" x ")) {
        let property = null;
        const values = [];
        for (const raw of piece.split(", ")) {
          const cut = raw.indexOf("=");
          if (cut > 0) property = raw.slice(0, cut).trim();
          values.push((cut > 0 ? raw.slice(cut + 1) : raw).replace(/\s+\(default\)$/, "").trim());
        }
        stated.push({ property, values });
      }
    }
    const properties = Object.keys(versions[0] ?? {});
    for (const property of properties) {
      const times = stated.filter((factor) => factor.property === property).length;
      if (times !== 1) faults.push(`header: names \`${property}\` ${times} times`);
    }
    for (const factor of stated) if (!properties.includes(factor.property)) faults.push(`header: names \`${factor.property}\`, which the set does not hold after the operations`);
    for (const cells of versions) {
      const outside = stated.find((factor) => properties.includes(factor.property) && !factor.values.includes(cells[factor.property]));
      if (outside) faults.push(`header: [${nameOf(cells)}] holds \`${outside.property}=${cells[outside.property]}\`, which it does not state`);
    }
  }

  totals.choices += (draw.choices ?? []).length; totals.compose += (draw.compose ?? []).length; totals.nothing += (draw.nothing ?? []).length;
  for (const fault of [...new Set(faults)].slice(0, 12)) console.log(`${file}: ${fault}`);
  if (faults.length > 0) totals.faulty += 1;
  console.log(`${file}: ${lines} lines, ${(draw.ops ?? []).length} operations, ${(draw.choices ?? []).length} choices, ${(draw.compose ?? []).length} to compose, ${(draw.nothing ?? []).length} nothing owed, ${versions.length} versions after, ${faults.length} faults`);
}
console.log(`operations by kind: ${Object.entries(byKind).map(([kind, count]) => `${kind} ${count}`).join(", ")}`);
console.log(`totals: ${totals.units} units, ${totals.lines} lines, ${totals.ops} operations, ${totals.choices} choices, ${totals.compose} to compose, ${totals.nothing} nothing owed; ${totals.missing} units with lines and no file, ${totals.faulty} with faults`);
process.exit(totals.faulty > 0 || totals.missing > 0 ? 1 : 0);
