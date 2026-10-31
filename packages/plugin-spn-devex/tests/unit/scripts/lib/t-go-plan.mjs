// `lib/go-plan.ts` — a go's parts derived from the scope's change sheets: passes by repository in release chain
// order, the bound and the split, the test files found by behaviour id, and a derivation kept after a change.
// Driven through the exports; the test files are looked for in a temporary git repository.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const lib = resolve(PLUGIN, "src", "scripts", "lib");
const { deriveGo, readyParts, ratesOf, boundOf, testFilesOf, entryHash, changedEntries, staleEntries } = await import(join(lib, "go-plan.ts"));
const { goFaults, entryAltitude } = await import(join(lib, "workstream-schema.ts"));

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

const entry = (id, file, tiers = { unit: ["MKT.SCRIPTS.300"] }) => ({ id, op: "edit", file, what: "w", decidedBy: [], facts: ["f1"], then: [], rules: [], callers: [], tiers, docs: [], book: [] });
const sheet = (entries, releaseChain = ["lib-repo", "app-repo"]) => ({ schemaVersion: 1, releaseChain, dependsOn: [], stack: null, entries });

// A sheet naming the app repository first still builds the library first: the chain orders the passes, and a repository
// with code carries a baseline before it and a full run after it.
const scope = [{ arc: "N009", sheet: sheet([entry("E1", "app-repo:src/a.ts"), entry("E2", "lib-repo:src/b.ts"), entry("E3", "lib-repo:docs/c.md")]) }];
const plan = deriveGo(scope, { writtenAt: "2026-10-31T00:00:00Z" });
const ids = plan.parts.map((p) => p.id);
same("[MKT.SCRIPTS.300] passes run in release chain order, each repository's docs, baseline, code and full run in turn, the release last", ids,
  ["docs-lib-repo-1", "baseline-lib-repo", "code-lib-repo-1", "full-lib-repo", "baseline-app-repo", "code-app-repo-1", "full-app-repo", "release-lib-repo-1", "release-app-repo-1"]);
same("[MKT.SCRIPTS.300] a part's pass is the enum and its entries are named across the scope", plan.parts.map((p) => [p.pass, p.entries]).slice(0, 3),
  [["DOCS", ["N009/E3"]], ["BASELINE", []], ["CODE", ["N009/E2"]]]);
same("[MKT.SCRIPTS.300] the plan names its lead, its whole scope and when it was written", [plan.lead, plan.scope, plan.writtenAt], ["N009", ["N009"], "2026-10-31T00:00:00Z"]);
const waits = Object.fromEntries(plan.parts.map((p) => [p.id, p.waitsOn]));
same("[MKT.SCRIPTS.300] a baseline waits on nothing and its code on it, a full run on the code, a repository's first pass on the docs before it", [waits["baseline-lib-repo"], waits["code-lib-repo-1"], waits["full-lib-repo"], waits["baseline-app-repo"]],
  [[], ["baseline-lib-repo"], ["code-lib-repo-1"], []]);
same("[MKT.SCRIPTS.300] the release waits on every full run and generated part, and the models are sonnet or none", [waits["release-app-repo-1"], plan.parts.map((p) => p.model).filter((m, i, all) => all.indexOf(m) === i)],
  [["full-lib-repo", "full-app-repo"], ["sonnet", "none"]]);
same("[MKT.SCRIPTS.300] a new plan is ready, never held", plan.parts.every((p) => p.state === "ready"), true);
same("[MKT.SCRIPTS.300] a plan holds to its schema", goFaults(plan), []);
const docsFirst = deriveGo([{ arc: "N009", sheet: sheet([entry("E1", "app-repo:docs/x.md"), entry("E2", "lib-repo:docs/c.md"), entry("E3", "app-repo:src/a.ts")]) }]);
same("[MKT.SCRIPTS.300] a repository's first pass waits on the docs of the repository before it", docsFirst.parts.find((p) => p.id === "docs-app-repo-1").waitsOn, ["docs-lib-repo-1"]);
same("[MKT.SCRIPTS.300] a path says the kind of change where the entry names none", [entryAltitude(entry("E1", "r:src/dist/x.mjs")), entryAltitude(entry("E1", "r:refs/x.md")), entryAltitude(entry("E1", "r:src/x.ts")), entryAltitude({ ...entry("E1", "r:src/x.ts"), altitude: "PROOF" })],
  ["GENERATED", "DOCS", "CODE", "PROOF"]);

// The bound: 45 over the rate, 8 where nothing is measured.
const many = (n) => sheet(Array.from({ length: n }, (_, i) => entry(`E${i + 1}`, `lib-repo:src/f${i}.ts`)));
const codeOf = (p) => p.pass === "CODE";
same("[MKT.SCRIPTS.301] unmeasured, a part holds eight entries", deriveGo([{ arc: "N009", sheet: many(10) }]).parts.filter(codeOf).map((p) => [p.id, p.entries.length]), [["code-lib-repo-1", 8], ["code-lib-repo-2", 2]]);
const measures = [{ repo: "lib-repo", altitude: "CODE", entries: 2, minutes: 18 }, { repo: "lib-repo", altitude: "CODE", entries: 1, minutes: 9 }];
const rates = ratesOf(measures);
same("[MKT.SCRIPTS.301] the rate is minutes over entries of the landed rows", rates, { "lib-repo|CODE": 9 });
same("[MKT.SCRIPTS.301] the bound is 45 over the rate", [boundOf(rates, "lib-repo", "CODE"), boundOf(rates, "lib-repo", "DOCS")], [5, 8]);
const priced = deriveGo([{ arc: "N009", sheet: many(7) }], { rates, measures });
same("[MKT.SCRIPTS.302] a measured group splits at its bound and each part is priced and says from what", priced.parts.filter(codeOf).map((p) => [p.entries.length, p.minutes, p.measuredFrom]),
  [[5, 45, "cost of 2 landed CODE rows in lib-repo"], [2, 18, "cost of 2 landed CODE rows in lib-repo"]]);
same("[MKT.SCRIPTS.302] an unmeasured part has no minutes and no source", deriveGo([{ arc: "N009", sheet: many(1) }]).parts.filter(codeOf).map((p) => [p.minutes, p.measuredFrom]), [[null, null]]);
const timed = deriveGo(scope, { fullRunMinutes: 12.34 });
same("[MKT.SCRIPTS.302] a baseline and a full run are priced from the last three full runs", timed.parts.filter((p) => p.pass === "BASELINE" || p.pass === "FULL_RUN").map((p) => [p.minutes, p.measuredFrom]).slice(0, 2),
  [[12.3, "last 3 full runs"], [12.3, "last 3 full runs"]]);

// Tests found by id, in the first directory that holds one.
const dir = mkdtempSync(join(tmpdir(), "go-plan-"));
execFileSync("git", ["init", "-q"], { cwd: dir });
mkdirSync(join(dir, "tests"));
writeFileSync(join(dir, "tests", "t-one.mjs"), 'same("[MKT.SCRIPTS.300] a case", 1, 1);\n');
writeFileSync(join(dir, "notes.md"), "[MKT.SCRIPTS.300] is named here too\n");
same("[MKT.SCRIPTS.307] a test file is found by the id in its labels, and a note naming it is not one", testFilesOf(["MKT.SCRIPTS.300"], [dir]), ["tests/t-one.mjs"]);
same("[MKT.SCRIPTS.307] an id no file names finds none", testFilesOf(["MKT.SCRIPTS.999"], [dir]), []);
same("[MKT.SCRIPTS.307] a missing worktree falls back to the next directory", testFilesOf(["MKT.SCRIPTS.300"], [join(dir, "gone"), dir]), ["tests/t-one.mjs"]);
const found = deriveGo(scope, { dirsOf: () => [dir] });
same("[MKT.SCRIPTS.307] a part carries the test files of its entries' ids", found.parts.filter((p) => p.entries.length).map((p) => p.tests), [["tests/t-one.mjs"], ["tests/t-one.mjs"], ["tests/t-one.mjs"]]);

// Signature, and a derivation kept after a change.
const first = plan.parts.find((p) => p.id === "code-lib-repo-1");
same("[MKT.SCRIPTS.307] a signature is the entries' hashes joined by a dot", first.signature, scope[0].sheet.entries.slice(1, 2).map(entryHash).join("."));
const changed = [{ arc: "N009", sheet: sheet([entry("E1", "app-repo:src/a.ts"), { ...entry("E2", "lib-repo:src/b.ts"), what: "changed" }, entry("E3", "lib-repo:docs/c.md"), entry("E4", "lib-repo:src/d.ts")]) }];
same("[MKT.SCRIPTS.307] a changed entry is named by its ref", changedEntries(first, changed), ["N009/E2"]);
const running = { ...plan, parts: plan.parts.map((p) => ({ ...p, state: p.id === "docs-lib-repo-1" ? "landed" : p.id === "code-lib-repo-1" ? "running" : p.id.startsWith("baseline-lib") ? "landed" : "held" })) };
const again = deriveGo(changed, { previous: running });
same("[MKT.SCRIPTS.307] derived again, landed and running parts stay whole and the rest are cut anew", again.parts.filter((p) => p.entries.length).map((p) => [p.id, p.state, p.entries]),
  [["docs-lib-repo-1", "landed", ["N009/E3"]], ["code-lib-repo-1", "running", ["N009/E2"]], ["code-lib-repo-2", "ready", ["N009/E4"]], ["code-app-repo-1", "ready", ["N009/E1"]]]);
same("[MKT.SCRIPTS.307] derived again, a landed baseline is kept and not made twice", again.parts.filter((p) => p.id === "baseline-lib-repo").length, 1);
const landedAll = { ...plan, parts: plan.parts.map((p) => ({ ...p, state: "landed" })) };
same("[MKT.SCRIPTS.307] a landed part whose entry changed gets a follow-up part", deriveGo(changed, { previous: landedAll }).parts.filter((p) => p.entries.includes("N009/E2")).map((p) => [p.id, p.state]),
  [["code-lib-repo-1", "landed"], ["code-lib-repo-2", "ready"]]);
same("[MKT.SCRIPTS.307] a plan with a follow-up part holds to its schema", goFaults(deriveGo(changed, { previous: landedAll })), []);
const followed = deriveGo(changed, { previous: landedAll });
same("[MKT.SCRIPTS.307] a landed part's change that a follow-up part carries is not stale", staleEntries(followed.parts.find((p) => p.id === "code-lib-repo-1"), followed, changed), []);
same("[MKT.SCRIPTS.307] a landed part's change that no part carries is stale", staleEntries(landedAll.parts.find((p) => p.id === "code-lib-repo-1"), landedAll, changed), ["N009/E2"]);
const doneFirst = deriveGo([{ ...scope[0], landed: ["E2", "E3"] }]);
same("[MKT.SCRIPTS.320] an entry a landed row holds is in no part", doneFirst.parts.flatMap((p) => p.entries), ["N009/E1"]);
same("[MKT.SCRIPTS.320] a repository whose entries all landed gets no docs or code part", doneFirst.parts.filter((p) => p.repo === "lib-repo" && p.pass !== "RELEASE").map((p) => p.id), []);
const rowsLanded = [{ ...changed[0], landed: ["E2", "E3"] }];
same("[MKT.SCRIPTS.320] an entry that changed after its part landed gets a follow-up part, though a landed row holds it", deriveGo(rowsLanded, { previous: landedAll }).parts.filter((p) => p.entries.includes("N009/E2")).map((p) => [p.id, p.state]),
  [["code-lib-repo-1", "landed"], ["code-lib-repo-2", "ready"]]);
same("[MKT.SCRIPTS.320] an unchanged entry of a landed row gets no follow-up", deriveGo(rowsLanded, { previous: landedAll }).parts.filter((p) => p.entries.includes("N009/E3")).map((p) => p.state), ["landed"]);
same("[MKT.SCRIPTS.311] a part held twice fails the schema", goFaults({ ...plan, parts: [plan.parts[0], { ...plan.parts[0], id: "docs-lib-repo-9" }] }).length > 0, true);
same("[MKT.SCRIPTS.311] a signature that misses an entry fails the schema", goFaults({ ...plan, parts: [{ ...plan.parts[0], signature: "a.b" }] }).length, 1);
same("[MKT.SCRIPTS.311] a pass that is a number fails the schema", goFaults({ ...plan, parts: [{ ...plan.parts[0], pass: 1 }] }).length > 0, true);
same("[MKT.SCRIPTS.303] a plan of another version fails the schema", goFaults({ ...plan, schemaVersion: 9 }).length, 1);

const ready = (states) => readyParts({ ...plan, parts: plan.parts.map((p) => ({ ...p, state: states[p.id] ?? "ready" })) }).map((p) => p.id);
same("[MKT.SCRIPTS.304] a ready part whose waits are open is not in the ready list", ready({}).slice(0, 2), ["docs-lib-repo-1", "baseline-lib-repo"]);
same("[MKT.SCRIPTS.304] a part is ready once every part it waits on has landed", ready({ "baseline-lib-repo": "landed", "docs-lib-repo-1": "landed" }).includes("code-lib-repo-1"), true);
same("[MKT.SCRIPTS.304] a held or running part is never in the ready list", ready({ "docs-lib-repo-1": "held", "baseline-lib-repo": "running" }), ["baseline-app-repo"]);

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
