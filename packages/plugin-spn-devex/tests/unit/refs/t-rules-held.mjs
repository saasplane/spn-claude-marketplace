// The checker's own check (QA's check of the checker): every rule the book says a check holds is held by a check the plugins register, and a test
// proves it. Read from `src/refs/rules.json`, the rules index built from the book beside this checkout.
//
//   1. every rule whose holder is `check:<name>` names a check the plugins register (a file of a plugin's `scripts/checks/` or `scripts/events/`,
//      or a test holder), the same list the book check reads
//   2. some test file carries a bracketed case `[MKT.<GROUP>.<n>]` for a behaviour row that cites the rule, or the rule's own id
//
// A rule that fails either is NAMED, and the test fails: the list is the work still owed, and the test is never made to pass by leaving a rule out.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../../../..");
const { knownHolders } = await import("../../../src/scripts/checks/book-classes.ts");
const { isTestHolder } = await import("../../../../plugin-support-lib/src/lib/rule-mark.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const walk = (dir, keep) => {
  let out = [];
  let entries = [];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
    const at = join(dir, entry);
    if (statSync(at).isDirectory()) out = out.concat(walk(at, keep)); else if (keep(at)) out.push(at);
  }
  return out;
};

const index = JSON.parse(readFileSync(resolve(import.meta.dirname, "../../../src/refs/rules.json"), "utf8"));
const held = index.rules.filter((rule) => rule.params?.check !== undefined);
const known = knownHolders(ROOT);

// The behaviour rows of the marketplace's own book, each with the ids it carries.
const rows = walk(join(ROOT, "docs", "03-behaviors"), (path) => path.endsWith(".md"))
  .flatMap((path) => readFileSync(path, "utf8").split("\n").filter((line) => line.startsWith("| MKT.")));
const idOf = (row) => /^\| (MKT\.[A-Z]+\.\d+) /.exec(row)?.[1];
const cites = (row, ruleId) => new RegExp(`${ruleId.replace(/\./g, "\\.")}(?!\\d)`).test(row);

// Every test file of every plugin and the shared library, read once.
const tests = walk(join(ROOT, "packages"), (path) => /\/tests\//.test(path) && /\.(?:mjs|ts)$/.test(path)).map((path) => readFileSync(path, "utf8")).join("\n");

console.log(`=== ${held.length} rules name a check as their holder`);
const unregistered = held.filter((rule) => !known.checks.has(rule.params.check) && !isTestHolder(rule.params.check));
ok("[MKT.SCRIPTS.436] every rule held by a check names a check the plugins register", unregistered.length === 0,
  unregistered.map((rule) => `${rule.id} → check:${rule.params.check}`).join("\n        "));

const unproved = held.filter((rule) => {
  if (tests.includes(rule.id)) return false;
  return !rows.filter((row) => cites(row, rule.id)).some((row) => tests.includes(`[${idOf(row)}]`));
});
ok("[MKT.SCRIPTS.436] some test file carries a bracketed case for each such rule's behaviour, or the rule's id", unproved.length === 0,
  `${unproved.length} of ${held.length} unproved:\n        ${unproved.map((rule) => `${rule.id} (check:${rule.params.check})`).join("\n        ")}`);

console.log(`\n${failed ? `${failed} of ${total} FAILED` : `all ${total} passed`}`);
process.exit(failed ? 1 : 0);
