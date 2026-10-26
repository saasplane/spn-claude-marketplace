#!/usr/bin/env node
// Puts the answers of `inventory.js` and `tokens.js` for one library file into the one inventory the tool
// takes in (`spnutils apps surface library --file`). Plain Node: it reads files and writes one file, and it
// never runs `spnutils` and never reaches the network. The agent has no judgement in it.
//
//   node assemble.mjs --answers <folder> --out <file> [--name <file name>] [--layer <LAYER>] [--slug <slug>]
//
// Through the connector `figma.root.name` is `Document`, so pass the library file's name with `--name`,
// such as `DS 4-Containers`; without it the name the answers hold is used.
//
// The folder holds one JSON file for each answer, saved exactly as the connector returned it:
//   - the answer of `inventory.js` with `pageId: null` (the list of the file's pages), once,
//   - the answers of `inventory.js` for each page, as many as the page's ranges needed,
//   - the answers of `tokens.js`, as many as its ranges needed.
// It refuses, naming the cause and writing nothing, when an answer is missing or breaks the range before it:
// a page that was listed and not read, a range that does not follow the one before, a page or the tokens whose
// last answer still has `next`, a unit the script could not read, answers of two files, a unit read twice.
//
// The inventory has `inventoryVersion`, `file`, `collections`, `styles`, `pages`, and `counts` written last.
// The depth is 3 when any unit holds its versions, and 2 otherwise. `file.readAt` is the earliest `readAt` of
// the answers. `--layer` is read from the file's name (`DS 4-Containers` is CONTAINERS) unless given, and
// `--slug` is the file's name in lower case with dashes unless given.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const INVENTORY_VERSION = 1;

function refuse(message) {
  process.stderr.write(`assemble: ${message}\n`);
  process.exit(1);
}

function option(name) {
  const at = process.argv.indexOf(`--${name}`);
  return at > 0 && at + 1 < process.argv.length ? process.argv[at + 1] : null;
}

const folder = option("answers");
const out = option("out");
if (folder === null || out === null) refuse("usage: node assemble.mjs --answers <folder> --out <file> [--name <file name>] [--layer <LAYER>] [--slug <slug>]");

// ---- read the answers
const answers = readdirSync(folder).filter((name) => name.endsWith(".json")).sort().map((name) => {
  let parsed;
  try { parsed = JSON.parse(readFileSync(join(folder, name), "utf8")); } catch { return refuse(`${name} is not JSON`); }
  if (parsed === null || typeof parsed !== "object") refuse(`${name} is not one JSON object`);
  if (parsed.error) refuse(`${name} holds the connector's error: ${parsed.error}`);
  return { name, ...parsed };
});
if (answers.length === 0) refuse(`${folder} holds no answer`);

const fileNames = [...new Set(answers.map((answer) => answer.file))];
if (fileNames.length !== 1 || typeof fileNames[0] !== "string") refuse(`the answers are for ${fileNames.length} files (${fileNames.join(", ")}), and must be for one`);
// The connector names the document `Document`, so the library file's own name is an input (`--name`).
const fileName = option("name") ?? fileNames[0];

const pageLists = answers.filter((answer) => answer.script === "inventory" && Array.isArray(answer.pages));
const unitAnswers = answers.filter((answer) => answer.script === "inventory" && Array.isArray(answer.units));
const tokenAnswers = answers.filter((answer) => answer.script === "tokens");
if (pageLists.length !== 1) refuse(`the folder must hold one answer that lists the pages (inventory.js with pageId null), and holds ${pageLists.length}`);
if (tokenAnswers.length === 0) refuse("the folder holds no answer of tokens.js");

// ---- a run of ranges must follow one another and end
// An answer that stopped inside a unit's versions ends where the next begins (`range[1]` is `next`), so the
// same rule holds for it: each range starts where the one before ended, and the last has no `next`.
function checkRanges(label, list, total) {
  const sorted = [...list].sort((first, second) => first.range[0] - second.range[0] || first.range[1] - second.range[1]);
  let at = 0;
  for (const answer of sorted) {
    if (answer.range[0] !== at) refuse(`${label}: ${answer.name} starts at ${answer.range[0]} and the answers before it end at ${at}`);
    at = answer.range[1];
  }
  const last = sorted[sorted.length - 1];
  if (last.next !== null) refuse(`${label}: the last answer (${last.name}) still has next ${last.next}: read on from there`);
  if (at !== total) refuse(`${label}: the answers reach ${at} of ${total}`);
  return sorted;
}

// ---- the tokens
const tokenTotals = [...new Set(tokenAnswers.map((answer) => answer.itemCount))];
if (tokenTotals.length !== 1) refuse(`the answers of tokens.js count ${tokenTotals.join(" and ")} items, and must agree`);
const tokensInOrder = checkRanges("tokens", tokenAnswers.map((answer) => ({ ...answer, total: answer.itemCount })), tokenTotals[0]);
const collections = new Map();
const styles = { text: [], effect: [] };
for (const answer of tokensInOrder) {
  for (const collection of answer.collections) {
    if (!collections.has(collection.name)) collections.set(collection.name, { name: collection.name, defaultMode: collection.defaultMode, modes: collection.modes, variables: [] });
    collections.get(collection.name).variables.push(...collection.variables);
  }
  styles.text.push(...answer.styles.text);
  styles.effect.push(...answer.styles.effect);
}

// ---- the units, page by page
const listed = pageLists[0].pages;
const byPage = new Map(listed.map((entry) => [entry.id, []]));
for (const answer of unitAnswers) {
  if (!byPage.has(answer.page.id)) refuse(`${answer.name} is for the page ${answer.page.id}, which the list of pages does not hold`);
  byPage.get(answer.page.id).push(answer);
}
const pages = [];
for (const entry of [...listed].sort((first, second) => first.index - second.index)) {
  const reads = byPage.get(entry.id);
  if (reads.length === 0) refuse(`the page ${entry.name} (${entry.id}) was listed and has no answer: read it with inventory.js`);
  const counts = [...new Set(reads.map((answer) => answer.unitCount))];
  if (counts.length !== 1) refuse(`the answers for the page ${entry.name} count ${counts.join(" and ")} units`);
  const ordered = checkRanges(`page ${entry.name}`, reads.map((answer) => ({ ...answer, total: answer.unitCount })), counts[0]);
  const units = [];
  for (const answer of ordered) {
    if (answer.unreadable.length > 0) {
      const first = answer.unreadable[0];
      refuse(`the unit ${first.name} (${first.id}) of the page ${entry.name} cannot be read: ${first.error}`);
    }
    for (const { index, ...unit } of answer.units) {
      const held = units.find((candidate) => candidate.id === unit.id);
      if (held === undefined) { units.push(unit); continue; }
      // the same unit again: the rest of its versions
      if (held.versions === null || unit.versions === null) refuse(`the unit ${unit.name} (${unit.id}) of the page ${entry.name} was read twice`);
      held.versions.push(...unit.versions);
    }
  }
  if (units.length > 0) pages.push({ id: entry.id, name: entry.name, units });
}

const unitCount = pages.reduce((total, page) => total + page.units.length, 0);
const slug = option("slug") ?? fileName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const layer = option("layer") ?? (/^DS \d-(\w+)$/.exec(fileName)?.[1] ?? "").toUpperCase();
if (layer === "") refuse(`the layer cannot be read from the file's name "${fileName}": pass --layer`);
const anyVersions = pages.some((page) => page.units.some((unit) => unit.versions !== null));
const readAt = [...answers.map((answer) => answer.readAt)].sort()[0];

const inventory = {
  inventoryVersion: INVENTORY_VERSION,
  file: { name: fileName, slug, layer, readAt, depth: anyVersions ? 3 : 2 },
  collections: [...collections.values()],
  styles,
  pages,
  counts: {
    pages: pages.length,
    units: unitCount,
    variables: [...collections.values()].reduce((total, collection) => total + collection.variables.length, 0),
    textStyles: styles.text.length,
    effectStyles: styles.effect.length,
  },
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(inventory, null, 2) + "\n");
process.stdout.write(`assemble: ${out}: ${inventory.counts.pages} pages, ${inventory.counts.units} units, ${inventory.counts.variables} variables, ${inventory.counts.textStyles} text styles, ${inventory.counts.effectStyles} effect styles, depth ${inventory.file.depth}\n`);
