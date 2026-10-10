// The shared part of the two programs that work on a unit's operation files, `operations-calls.mjs` and
// `operations-check.mjs`: the readings of the sets, the cells of a version's name, and the versions a set
// holds once a unit's operations have been carried out. It is imported, never run; it reads files and
// writes none.
//
//   readSets(readingsFolder)         a Map from a set's id to its versions as read, `[{ key, name }]`. The
//                                    folder holds the joined answers of `versions.js`, as JSON files whose
//                                    names begin `versions-`; each is a list of answers with `rows`.
//   cellsOf(name)                    `size=SM, state=rest` as `{ size: "SM", state: "rest" }`
//   nameOf(cells)                    the reverse
//   matches(cells, pattern)          a pattern is `{ property: value }`, a value may be a list of values
//   strings(cells)                   every value as text
//   standingOf(sets, spec)           the versions that stay after the spec's `keep` or `remove` and its
//                                    `dropProps`, each `{ key, cells }`: the state every operation starts from
//   versionsAfter(sets, spec, operations)
//                                    the cells of the versions once the `names` and `copy` operations are
//                                    carried out, in order. A fold may add a property: `size` goes first in a
//                                    name and any other new property last.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const cellsOf = (name) => Object.fromEntries(name.split(", ").filter((cell) => cell.includes("=")).map((cell) => {
  const at = cell.indexOf("=");
  return [cell.slice(0, at), cell.slice(at + 1)];
}));
export const nameOf = (cells) => Object.entries(cells).map(([property, value]) => `${property}=${value}`).join(", ");
export const matches = (cells, pattern) => Object.entries(pattern ?? {})
  .every(([property, value]) => (Array.isArray(value) ? value : [value]).map(String).includes(cells[property]));
export const strings = (cells) => Object.fromEntries(Object.entries(cells ?? {}).map(([property, value]) => [property, String(value)]));

export function readSets(readingsFolder) {
  const sets = new Map();
  for (const file of readdirSync(readingsFolder).filter((name) => name.startsWith("versions-")).sort()) {
    for (const reading of JSON.parse(readFileSync(join(readingsFolder, file), "utf8"))) {
      const heads = new Map();
      for (const row of reading.rows) {
        if (row[0] === "U") heads.set(row[1], { id: row[2], versions: [] });
        if (row[0] === "V") heads.get(row[1])?.versions.push({ key: row[3], name: row[4] });
      }
      for (const set of heads.values()) sets.set(set.id, set.versions);
    }
  }
  return sets;
}

export function standingOf(sets, spec) {
  const dropped = spec.dropProps ?? [];
  return (sets.get(spec.setId) ?? [])
    .map((version) => ({ key: version.key, cells: cellsOf(version.name) }))
    .filter((version) => (spec.keep ? spec.keep.some((pattern) => matches(version.cells, pattern)) : !(spec.remove ?? []).some((pattern) => matches(version.cells, pattern))))
    .map((version) => ({ key: version.key, cells: Object.fromEntries(Object.entries(version.cells).filter(([property]) => !dropped.includes(property))) }));
}

export function versionsAfter(sets, spec, operations) {
  let versions = standingOf(sets, spec).map((version) => version.cells);
  const withCells = (cells, added) => {
    const next = { ...cells };
    for (const [property, value] of Object.entries(added)) {
      if (property in next || property !== "size") next[property] = value;
      else return withCells({ size: value, ...cells }, Object.fromEntries(Object.entries(added).filter(([name]) => name !== "size")));
    }
    return next;
  };
  for (const operation of operations ?? []) {
    if (operation.op === "names") {
      for (const [from, to] of Object.entries(operation.renameProperty ?? {})) versions = versions.map((cells) => Object.fromEntries(Object.entries(cells).map(([property, value]) => [property === from ? to : property, value])));
      for (const one of operation.renameValue ?? []) for (const cells of versions) if (cells[one.property] === String(one.from)) cells[one.property] = String(one.to);
      for (const one of operation.fold ?? []) versions = versions.map((cells) => (matches(cells, one.match) ? withCells(cells, strings(one.set)) : cells));
      for (const property of operation.dropProperty ?? []) versions = versions.map((cells) => Object.fromEntries(Object.entries(cells).filter(([name]) => name !== property)));
    }
    if (operation.op === "copy") {
      const twin = versions.find((cells) => matches(cells, operation.from));
      if (!twin) continue;
      for (const to of Array.isArray(operation.to) ? operation.to : [operation.to]) {
        const made = { ...twin, ...strings(to) };
        if (!versions.some((cells) => nameOf(cells) === nameOf(made))) versions.push(made);
      }
    }
  }
  return versions;
}
