// Checks a folder of saved answers of `versions.js` or `instances.js`, and joins them into one file.
//
//   node check-answers.mjs <folder of answer files> [<joined file to write>]
//
// Each answer file is one answer, whole, as JSON. For each file: `hash` must be the FNV-1a hash of
// `JSON.stringify(rows)`, which fails when a character was changed while the answer was copied. For
// `versions.js` it also checks, for each unit, that every version from 0 to its count is there once and
// that the unit's "E" hash is the hash of its versions' [key, name, width, height]. Then that the files
// of a page follow one another: each file's `from` is the `next` of the one before, and the last has
// `next` null. Exit 0 when nothing fails, 1 when something does; each failure is one line.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [folder, joinedPath] = process.argv.slice(2);
if (!folder) {
  console.error("usage: node check-answers.mjs <folder> [<joined file>]");
  process.exit(2);
}

const fnv = (text) => {
  let hash = 0x811c9dc5;
  for (let place = 0; place < text.length; place += 1) {
    hash ^= text.charCodeAt(place);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
};

const failures = [];
const answers = [];
for (const name of readdirSync(folder).filter((entry) => entry.endsWith(".json")).sort()) {
  let answer;
  try {
    answer = JSON.parse(readFileSync(join(folder, name), "utf8"));
  } catch (error) {
    failures.push(`${name}: not JSON (${error.message})`);
    continue;
  }
  if (!Array.isArray(answer.rows) || typeof answer.hash !== "string") continue;
  const hash = fnv(JSON.stringify(answer.rows));
  if (hash !== answer.hash) failures.push(`${name}: rows hash ${hash}, the answer says ${answer.hash}: read this call again`);
  answers.push({ name, answer });
}

// The files of one page (and one `within`), in the order they were read.
const chains = new Map();
for (const entry of answers) {
  const id = `${entry.answer.script}|${entry.answer.file}|${entry.answer.page?.id}|${entry.answer.within ?? ""}`;
  if (!chains.has(id)) chains.set(id, []);
  chains.get(id).push(entry);
}

const joined = [];
for (const [id, chain] of chains) {
  const second = (entry) => entry.answer.versionsFrom ?? entry.answer.groupsFrom ?? 0;
  chain.sort((one, other) => one.answer.from - other.answer.from || second(one) - second(other));
  let expected = [0, 0];
  for (const { name, answer } of chain) {
    if (answer.from !== expected[0] || second({ answer }) !== expected[1]) {
      failures.push(`${name}: begins at ${answer.from}/${second({ answer })}, expected ${expected[0]}/${expected[1]} in ${id}`);
    }
    expected = [answer.next, answer.nextVersion ?? answer.nextGroup ?? 0];
  }
  const last = chain[chain.length - 1].answer;
  if (last.next !== null) {
    failures.push(`${id}: not read to its end, the last answer has next ${last.next}${last.cutIn ? `, cut in ${last.cutIn}` : ""}`);
  }
  const rows = chain.flatMap((entry) => entry.answer.rows);
  if (last.script === "versions") {
    const units = new Map();
    for (const row of rows) {
      const index = row[1];
      if (!units.has(index)) units.set(index, { head: null, versions: [], end: null, holds: null });
      const unit = units.get(index);
      if (row[0] === "U") unit.head = row;
      if (row[0] === "V") unit.versions.push(row);
      if (row[0] === "H") unit.holds = row[2];
      if (row[0] === "E") unit.end = row[2];
    }
    if (units.size !== last.unitCount) failures.push(`${id}: ${units.size} units read, the page holds ${last.unitCount}`);
    for (const [index, unit] of units) {
      const label = `${id} unit ${index} ${unit.head ? unit.head[4] : "(no U row)"}`;
      if (!unit.head) { failures.push(`${label}: no U row`); continue; }
      const places = unit.versions.map((row) => row[2]);
      const whole = places.length === unit.head[6] && places.every((place, at) => place === at);
      if (!whole) failures.push(`${label}: ${places.length} versions read, ${unit.head[6]} expected, or out of order`);
      const hash = fnv(JSON.stringify(unit.versions.map((row) => row.slice(3))));
      if (hash !== unit.end) failures.push(`${label}: versions hash ${hash}, the unit's E row says ${unit.end}`);
    }
  }
  joined.push({ script: last.script, file: last.file, page: last.page, within: last.within ?? null, rows });
}

if (joinedPath) writeFileSync(joinedPath, JSON.stringify(joined, null, 1) + "\n");
for (const failure of failures) console.log(failure);
console.log(`${answers.length} answers, ${chains.size} pages, ${failures.length} failures`);
process.exit(failures.length > 0 ? 1 : 0);
