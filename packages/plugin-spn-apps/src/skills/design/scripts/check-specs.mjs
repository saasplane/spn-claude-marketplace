// Checks the specs of a library update against the readings of the library, with no call to Figma.
//
//   node check-specs.mjs --specs <folder of specs> --readings <folder of readings> [--totals] [<Unit> …]
//
// A spec is `<Unit>.json` in the specs folder and says, in a form a script can carry out, what the unit's
// record says in words. The readings folder holds the joined answers of `versions.js` and `instances.js`
// (the file `check-answers.mjs` writes), as JSON. For each spec (all of them when no unit is named) this
// applies `keep` or `remove` to the set's versions as read and checks:
//   - the versions left are `expect.versionsAfterRemoval`
//   - each property in `dropProps` has one value among the versions left, and dropping its cell leaves
//     no two versions with one name
//   - every placed instance (DS 2, 3, 4 and 5) on a version that goes has a `move` rule, and the version
//     the rule leads to is one that stays
//   - each case in `cases` has a `base` that is a version that stays, by its name after the drop
// Prints one line for each fault and a line of counts for each spec. Exit 1 when anything fails.
//
// A pattern is an object of `property: value`, where a value may be a list of values; a version matches
// when every property of the pattern has one of its values. `keep` and `remove` are lists of patterns;
// a spec gives one of the two. With `keep`, a version that matches no pattern goes.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// `--specs <folder>` and `--readings <folder>` are the two folders; every other argument is a unit's name or `--totals`.
const argumentsGiven = process.argv.slice(2);
const folderOf = (flag) => {
  const at = argumentsGiven.indexOf(flag);
  if (at < 0 || at + 1 >= argumentsGiven.length) return null;
  const [, value] = argumentsGiven.splice(at, 2);
  return value;
};
const specsFolder = folderOf("--specs");
const readingsFolder = folderOf("--readings");
if (!specsFolder || !readingsFolder) {
  console.error("usage: node check-specs.mjs --specs <folder of specs> --readings <folder of readings> [--totals] [<Unit> …]");
  process.exit(2);
}
const readings = readdirSync(readingsFolder).filter((name) => name.endsWith(".json"))
  .flatMap((name) => JSON.parse(readFileSync(join(readingsFolder, name), "utf8")));

const cellsOf = (name) => Object.fromEntries(name.split(", ").map((cell) => {
  const at = cell.indexOf("=");
  return [cell.slice(0, at), cell.slice(at + 1)];
}));
const nameOf = (cells) => Object.entries(cells).map(([property, value]) => `${property}=${value}`).join(", ");
const matches = (cells, pattern) => Object.entries(pattern)
  .every(([property, value]) => (Array.isArray(value) ? value : [value]).map(String).includes(cells[property]));

// Every set of the versions readings, by node id.
const sets = new Map();
for (const reading of readings.filter((one) => one.script === "versions")) {
  const heads = new Map();
  for (const row of reading.rows) {
    if (row[0] === "U") heads.set(row[1], { id: row[2], name: row[4], kind: row[5], versions: [] });
    if (row[0] === "V") heads.get(row[1])?.versions.push({ key: row[3], name: row[4] });
  }
  for (const set of heads.values()) sets.set(set.id, set);
}

// `--totals` prints only the faults and one line of totals over the specs that have a set.
const quiet = argumentsGiven.includes("--totals");
const totals = { today: 0, stay: 0, go: 0, placed: 0, cases: 0, draw: 0, afterDrawing: 0 };
const wanted = argumentsGiven.filter((argument) => argument !== "--totals");
const files = (wanted.length > 0 ? wanted.map((unit) => `${unit}.json`) : readdirSync(specsFolder).filter((name) => name.endsWith(".json")).sort());
let failed = 0;
for (const file of files) {
  const path = join(specsFolder, file);
  const faults = [];
  if (!existsSync(path)) { console.log(`${file}: no such spec`); failed += 1; continue; }
  let spec;
  try {
    spec = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.log(`${file}: not JSON (${error.message})`);
    failed += 1;
    continue;
  }
  if (spec.setId === null) { console.log(`${file}: no set, ${(spec.needsDrawing ?? []).length} to draw`); continue; }
  const set = sets.get(spec.setId);
  if (!set || set.name !== spec.unit) { console.log(`${file}: set ${spec.setId} is not ${spec.unit} in the readings`); failed += 1; continue; }
  if (Boolean(spec.keep) === Boolean(spec.remove)) faults.push("give one of `keep` and `remove`");

  const versions = set.versions.map((version) => ({ ...version, cells: cellsOf(version.name) }));
  const stays = (version) => (spec.keep ? spec.keep.some((pattern) => matches(version.cells, pattern)) : !(spec.remove ?? []).some((pattern) => matches(version.cells, pattern)));
  const kept = versions.filter(stays);
  const gone = versions.filter((version) => !stays(version));
  if (kept.length !== spec.expect?.versionsAfterRemoval) faults.push(`${kept.length} versions stay, the spec expects ${spec.expect?.versionsAfterRemoval}`);

  const dropped = (cells) => Object.fromEntries(Object.entries(cells).filter(([property]) => !(spec.dropProps ?? []).includes(property)));
  for (const property of spec.dropProps ?? []) {
    const values = new Set(kept.map((version) => version.cells[property]));
    if (values.size > 1) faults.push(`\`${property}\` is dropped and the versions that stay hold ${[...values].join(", ")}`);
  }
  const keptNames = kept.map((version) => nameOf(dropped(version.cells)));
  if (new Set(keptNames).size !== keptNames.length) faults.push("two versions that stay have one name after the drop");

  // Each placed instance on a version that goes: where does it move?
  const goneByKey = new Map(gone.map((version) => [version.key, version]));
  let placed = 0;
  for (const reading of readings.filter((one) => one.script === "instances")) {
    for (const row of reading.rows) {
      if (row[0] !== "G" || !goneByKey.has(row[2])) continue;
      placed += row[7];
      const from = goneByKey.get(row[2]);
      const rule = (spec.move ?? []).find((one) => matches(from.cells, one.from));
      const where = `${reading.file} / ${reading.page.name}, owner ${row[6]}, ${row[7]} on [${from.name}]`;
      if (!rule) { faults.push(`no move rule: ${where}`); continue; }
      const target = { ...from.cells, ...Object.fromEntries(Object.entries(rule.set).map(([property, value]) => [property, String(value)])) };
      if (!kept.some((version) => nameOf(version.cells) === nameOf(target))) faults.push(`the move leads to [${nameOf(target)}], which does not stay: ${where}`);
    }
  }

  for (const one of spec.cases ?? []) {
    if (!keptNames.includes(nameOf(Object.fromEntries(Object.entries(one.base ?? {}).map(([property, value]) => [property, String(value)]))))) {
      const full = keptNames.find((name) => matches(cellsOf(name), one.base ?? {}));
      if (!full) faults.push(`case \`${one.name}\`: no version that stays matches its base`);
    }
  }

  totals.today += versions.length; totals.stay += kept.length; totals.go += gone.length; totals.placed += placed;
  totals.cases += (spec.cases ?? []).filter((one) => !one.stands).length; totals.draw += (spec.needsDrawing ?? []).length;
  totals.afterDrawing += spec.expect?.versionsAfterDrawing ?? kept.length;
  for (const fault of faults) console.log(`${file}: ${fault}`);
  if (quiet && faults.length === 0) continue;
  console.log(`${file}: ${versions.length} today, ${kept.length} stay, ${gone.length} go, ${placed} placed on a version that goes, ${(spec.cases ?? []).length} cases by properties, ${(spec.needsDrawing ?? []).length} to draw, ${faults.length} faults`);
  if (faults.length > 0) failed += 1;
}
console.log(`totals: ${totals.today} versions today, ${totals.stay} stay, ${totals.go} go, ${totals.afterDrawing} after drawing, ${totals.placed} placed instances to move, ${totals.cases} cases to make by properties, ${totals.draw} lines to draw by hand`);
console.log(`${files.length} specs, ${failed} with faults`);
process.exit(failed > 0 ? 1 : 0);
