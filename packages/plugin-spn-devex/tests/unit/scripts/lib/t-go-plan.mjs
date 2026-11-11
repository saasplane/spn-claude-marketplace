// `lib/go-plan.ts` — a go's parts derived from the scope's change sheets: passes by repository in release chain
// order, the bound and the split, the test files found by behaviour id, and a derivation kept after a change.
// Driven through the exports; the test files are looked for in a temporary git repository.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const lib = resolve(PLUGIN, "src", "scripts", "lib");
const { deriveGo, workflowOf, releaseCircles, tangledParts, fullRunMinutes, readyParts, clearWaiting, markDropped, markWaiting, ratesOf, boundOf, testFilesOf, entryHash, changedEntries, staleEntries, proposeScopes, redCheckIds } = await import(join(lib, "go-plan.ts"));
const { goFaults, entryWork } = await import(join(lib, "workstream-schema.ts"));

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
same("[MKT.SCRIPTS.300] a part's work is the enum and its entries are named across the scope, a baseline being TEST work", plan.parts.map((p) => [p.work, p.entries]).slice(0, 3),
  [["DOCS", ["N009/E3"]], ["TEST", []], ["CODE", ["N009/E2"]]]);
same("[MKT.SCRIPTS.300] the plan names its lead, its whole scope and when it was written", [plan.lead, plan.scope, plan.writtenAt], ["N009", ["N009"], "2026-10-31T00:00:00Z"]);
const waits = Object.fromEntries(plan.parts.map((p) => [p.id, p.waitsOn]));
same("[MKT.SCRIPTS.300] a baseline waits on nothing and its code on it, a full run on the code, a repository's first pass on the docs before it", [waits["baseline-lib-repo"], waits["code-lib-repo-1"], waits["full-lib-repo"], waits["baseline-app-repo"]],
  [[], ["baseline-lib-repo"], ["code-lib-repo-1"], []]);
same("[MKT.SCRIPTS.300] a release waits on its own repository's full run and the release before it in the chain, and the models are sonnet or none", [waits["release-app-repo-1"], plan.parts.map((p) => p.model).filter((m, i, all) => all.indexOf(m) === i)],
  [["full-app-repo", "release-lib-repo-1"], ["sonnet", "none"]]);
same("[MKT.SCRIPTS.300] a new plan is ready, never held", plan.parts.every((p) => p.state === "ready"), true);
same("[MKT.SCRIPTS.300] a plan holds to its schema", goFaults(plan), []);
const docsFirst = deriveGo([{ arc: "N009", sheet: sheet([entry("E1", "app-repo:docs/x.md"), entry("E2", "lib-repo:docs/c.md"), entry("E3", "app-repo:src/a.ts")]) }]);
same("[MKT.SCRIPTS.300] a repository's first pass waits on the docs of the repository before it", docsFirst.parts.find((p) => p.id === "docs-app-repo-1").waitsOn, ["docs-lib-repo-1"]);
same("[MKT.SCRIPTS.300] a path says the kind of change where the entry names none", [entryWork(entry("E1", "r:src/dist/x.mjs")), entryWork(entry("E1", "r:refs/x.md")), entryWork(entry("E1", "r:src/x.ts")), entryWork({ ...entry("E1", "r:src/x.ts"), work: "PROOF" })],
  ["GENERATED", "DOCS", "CODE", "PROOF"]);

// The bound: 45 over the rate, 8 where nothing is measured.
const many = (n) => sheet(Array.from({ length: n }, (_, i) => entry(`E${i + 1}`, `lib-repo:src/f${i}.ts`)));
const codeOf = (p) => p.work === "CODE";
same("[MKT.SCRIPTS.301] unmeasured, a part holds eight entries", deriveGo([{ arc: "N009", sheet: many(10) }]).parts.filter(codeOf).map((p) => [p.id, p.entries.length]), [["code-lib-repo-1", 8], ["code-lib-repo-2", 2]]);
const measures = [{ repo: "lib-repo", work: "CODE", entries: 2, minutes: 18 }, { repo: "lib-repo", work: "CODE", entries: 1, minutes: 9 }];
const rates = ratesOf(measures);
same("[MKT.SCRIPTS.301] the rate is minutes over entries of the landed rows", rates, { "lib-repo|CODE": 9 });
same("[MKT.SCRIPTS.301] the bound is 45 over the rate", [boundOf(rates, "lib-repo", "CODE"), boundOf(rates, "lib-repo", "DOCS")], [5, 8]);
const priced = deriveGo([{ arc: "N009", sheet: many(7) }], { rates, measures });
same("[MKT.SCRIPTS.302] a measured group splits at its bound and each part is priced and says from what", priced.parts.filter(codeOf).map((p) => [p.entries.length, p.minutes, p.measuredFrom]),
  [[5, 45, "cost of 2 landed CODE rows in lib-repo"], [2, 18, "cost of 2 landed CODE rows in lib-repo"]]);
same("[MKT.SCRIPTS.302] an unmeasured part has no minutes and no source", deriveGo([{ arc: "N009", sheet: many(1) }]).parts.filter(codeOf).map((p) => [p.minutes, p.measuredFrom]), [[null, null]]);
const timed = deriveGo(scope, { fullRunMinutes: 12.34 });
same("[MKT.SCRIPTS.302] a baseline and a full run are priced from the last three full runs", timed.parts.filter((p) => p.work === "TEST").map((p) => [p.minutes, p.measuredFrom]).slice(0, 2),
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
const heldNow = { ...landedAll, parts: [{ ...landedAll.parts.find((p) => p.id === "code-lib-repo-1"), id: "code-lib-repo-0", signature: entryHash(changed[0].sheet.entries[1]) }, ...landedAll.parts] };
same("[MKT.SCRIPTS.307] a landed part's change that an earlier landed part holds as it stands now is not stale", staleEntries(heldNow.parts.find((p) => p.id === "code-lib-repo-1"), heldNow, changed), []);
same("[MKT.SCRIPTS.307] and go write adds no follow-up part for it", deriveGo(changed, { previous: heldNow }).parts.filter((p) => p.entries.includes("N009/E2")).map((p) => p.id), ["code-lib-repo-0", "code-lib-repo-1"]);
const doneFirst = deriveGo([{ ...scope[0], landed: ["E2", "E3"] }]);
same("[MKT.SCRIPTS.320] an entry a landed row holds is in no part", doneFirst.parts.flatMap((p) => p.entries), ["N009/E1"]);
same("[MKT.SCRIPTS.320] a repository whose entries all landed gets no docs or code part", doneFirst.parts.filter((p) => p.repo === "lib-repo" && p.work !== "RELEASE").map((p) => p.id), []);
const rowsLanded = [{ ...changed[0], landed: ["E2", "E3"] }];
same("[MKT.SCRIPTS.320] an entry that changed after its part landed gets a follow-up part, though a landed row holds it", deriveGo(rowsLanded, { previous: landedAll }).parts.filter((p) => p.entries.includes("N009/E2")).map((p) => [p.id, p.state]),
  [["code-lib-repo-1", "landed"], ["code-lib-repo-2", "ready"]]);
same("[MKT.SCRIPTS.320] an unchanged entry of a landed row gets no follow-up", deriveGo(rowsLanded, { previous: landedAll }).parts.filter((p) => p.entries.includes("N009/E3")).map((p) => p.state), ["landed"]);
const allLanded = { ...scope[0], landed: ["E1", "E2", "E3"] };
same("[MKT.SCRIPTS.322] code landed and a proof owed: a full run and no baseline", deriveGo([{ ...allLanded, proofs: ["lib-repo"] }]).parts.filter((p) => p.work !== "RELEASE").map((p) => p.id), ["full-lib-repo", "proof-lib-repo"]);
same("[MKT.SCRIPTS.322] code landed and no proof owed: neither", deriveGo([allLanded]).parts.filter((p) => p.work !== "RELEASE").map((p) => p.id), []);
same("[MKT.SCRIPTS.322] the full run for a proof owed waits on nothing of its own repository", deriveGo([{ ...allLanded, proofs: ["lib-repo"] }]).parts.find((p) => p.id === "full-lib-repo")?.waitsOn, []);
// The proof after the releases: the repository's full run has landed, so an owed PROOF row has a part of its own, not a second full run.
const owedProof = deriveGo([{ ...allLanded, proofs: ["lib-repo"] }], { previous: landedAll });
const proofPart = owedProof.parts.find((p) => p.id === "proof-lib-repo");
same("[MKT.SCRIPTS.384] a PROOF row owed after a landed full run derives proof-<repo>, TEST work, waiting on every release of the plan",
  [proofPart?.work, proofPart?.waitsOn, owedProof.parts.some((p) => p.id.startsWith("full-lib-repo-")), goFaults(owedProof)], ["TEST", ["release-lib-repo-1", "release-app-repo-1"], false, []]);
same("[MKT.SCRIPTS.384] no proof is owed, no proof part", deriveGo([allLanded], { previous: landedAll }).parts.some((p) => p.id.startsWith("proof-")), false);
const proofLanded = { ...owedProof, parts: owedProof.parts.map((p) => (p.id === "proof-lib-repo" ? { ...p, state: "landed" } : p)) };
same("[MKT.SCRIPTS.384] a landed proof part is kept as it was and made once", deriveGo([{ ...allLanded, proofs: ["lib-repo"] }], { previous: proofLanded }).parts.filter((p) => p.id === "proof-lib-repo").map((p) => p.state), ["landed"]);
const without = [{ arc: "N009", sheet: sheet([entry("E1", "app-repo:src/a.ts"), entry("E3", "lib-repo:docs/c.md")]), dropped: ["E2"] }];
same("[MKT.SCRIPTS.384] a landed part holding an entry later dropped from the sheet is not stale", staleEntries(landedAll.parts.find((p) => p.id === "code-lib-repo-1"), landedAll, without), []);
same("[MKT.SCRIPTS.384] and one whose entry was edited still is", staleEntries(landedAll.parts.find((p) => p.id === "code-lib-repo-1"), landedAll, changed), ["N009/E2"]);
same("[MKT.SCRIPTS.311] a part held twice fails the schema", goFaults({ ...plan, parts: [plan.parts[0], { ...plan.parts[0], id: "docs-lib-repo-9" }] }).length > 0, true);
same("[MKT.SCRIPTS.311] a signature that misses an entry fails the schema", goFaults({ ...plan, parts: [{ ...plan.parts[0], signature: "a.b" }] }).length, 1);
same("[MKT.SCRIPTS.311] a work that is a number fails the schema", goFaults({ ...plan, parts: [{ ...plan.parts[0], work: 1 }] }).length > 0, true);
same("[MKT.SCRIPTS.303] a plan of another version fails the schema", goFaults({ ...plan, schemaVersion: 9 }).length, 1);

const ready = (states) => readyParts({ ...plan, parts: plan.parts.map((p) => ({ ...p, state: states[p.id] ?? "ready" })) }).map((p) => p.id);
same("[MKT.SCRIPTS.304] a ready part whose waits are open is not in the ready list", ready({}).slice(0, 2), ["docs-lib-repo-1", "baseline-lib-repo"]);
same("[MKT.SCRIPTS.304] a part is ready once every part it waits on has landed", ready({ "baseline-lib-repo": "landed", "docs-lib-repo-1": "landed" }).includes("code-lib-repo-1"), true);
same("[MKT.SCRIPTS.304] a held or running part is never in the ready list", ready({ "docs-lib-repo-1": "held", "baseline-lib-repo": "running" }), ["baseline-app-repo"]);

// A part that waits on something outside the window is `waiting`, with a plain field naming what, and is never ready.
const needing = [{ arc: "N009", sheet: { ...sheet([entry("E1", "app-repo:src/a.ts"), entry("E2", "lib-repo:src/b.ts")]), needsRelease: [{ repo: "app-repo", release: "lib-repo", command: "spnutils x run" }] } }];
const needed = deriveGo(needing);
const firstOfApp = needed.parts.find((p) => p.repo === "app-repo" && p.work !== "RELEASE");
same("[MKT.HOOKS.322] a repository's first pass waits on the release that ships a command it needs (s23)", [firstOfApp.id, firstOfApp.state, firstOfApp.waitingOn], ["baseline-app-repo", "waiting", "the release of lib-repo that ships spnutils x run"]);
same("[MKT.HOOKS.322] only that repository's first pass waits, and a plan with a waiting part holds to its schema", [needed.parts.filter((p) => p.state === "waiting").map((p) => p.id), goFaults(needed)], [["baseline-app-repo"], []]);
same("[MKT.HOOKS.322] a waiting part is not ready, and what waits on it is not either", readyParts(needed).map((p) => p.id).filter((id) => id.endsWith("app-repo") || id.includes("app-repo-")), []);
const marked = markWaiting(plan, "docs-lib-repo-1", "your sign-in to the registry");
same("[MKT.HOOKS.322] a part marked waiting names what it waits on, the plan holds to its schema, and the plan given is untouched", [marked.parts.find((p) => p.id === "docs-lib-repo-1").state, marked.parts.find((p) => p.id === "docs-lib-repo-1").waitingOn, goFaults(marked), plan.parts[0].state], ["waiting", "your sign-in to the registry", [], "ready"]);
same("[MKT.HOOKS.322] a part marked waiting is not in the ready list", readyParts(marked).map((p) => p.id).includes("docs-lib-repo-1"), false);
same("[MKT.HOOKS.322] marking a part that is not in the plan is refused", (() => { try { markWaiting(plan, "docs-nowhere-1", "x"); return "no error"; } catch { return "refused"; } })(), "refused");
same("[MKT.HOOKS.322] a wait marked by hand is kept when the plan is derived again", deriveGo(scope, { previous: marked }).parts.find((p) => p.id === "docs-lib-repo-1").waitingOn, "your sign-in to the registry");

// A new code part in a repository whose full run has landed opens a second full run.
const secondPlan = deriveGo(changed, { previous: landedAll });
same("[MKT.HOOKS.324] a new code part in a repository whose full run landed opens full-<repo>-2", secondPlan.parts.filter((p) => p.work === "TEST" && p.id.startsWith("full-") && p.repo === "lib-repo").map((p) => [p.id, p.state]), [["full-lib-repo", "landed"], ["full-lib-repo-2", "ready"]]);
same("[MKT.HOOKS.324] the second full run waits on the repository's code", secondPlan.parts.find((p) => p.id === "full-lib-repo-2").waitsOn, ["code-lib-repo-1", "code-lib-repo-2"]);
same("[MKT.HOOKS.324] with no new code part, no second full run", deriveGo(scope, { previous: landedAll }).parts.filter((p) => p.work === "TEST" && p.id.startsWith("full-")).map((p) => p.id), ["full-lib-repo", "full-app-repo"]);
same("[MKT.HOOKS.324] derived again, the second full run is made once", deriveGo(changed, { previous: secondPlan }).parts.filter((p) => p.id.startsWith("full-lib-repo")).map((p) => p.id), ["full-lib-repo", "full-lib-repo-2"]);

// E67 · a hand-marked wait comes off
const cleared = clearWaiting(marked, "docs-lib-repo-1");
same("[MKT.HOOKS.322] clearing a wait with nothing open in the plan reads the part ready, with no reason", [cleared.parts.find((one) => one.id === "docs-lib-repo-1").state, cleared.parts.find((one) => one.id === "docs-lib-repo-1").waitingOn], ["ready", undefined]);
same("[MKT.HOOKS.322] clearing a wait on a part that is not waiting is refused", (() => { try { clearWaiting(plan, "docs-lib-repo-1"); return "no error"; } catch { return "refused"; } })(), "refused");
same("[MKT.HOOKS.322] clearing a part not in the plan is refused", (() => { try { clearWaiting(plan, "docs-nowhere-1"); return "no error"; } catch { return "refused"; } })(), "refused");
const blocked = { ...marked, parts: [...marked.parts.filter((one) => one.id !== "docs-lib-repo-1"), { ...marked.parts.find((one) => one.id === "docs-lib-repo-1"), waitsOn: ["code-nowhere-1"] }, { ...marked.parts[0], id: "code-nowhere-1", state: "ready", waitingOn: undefined }] };
const stillWaiting = clearWaiting(blocked, "docs-lib-repo-1").parts.find((one) => one.id === "docs-lib-repo-1");
same("[MKT.HOOKS.322] clearing a wait whose plan parts have not landed reads it waiting on them", [stillWaiting.state, stillWaiting.waitingOn.includes("code-nowhere-1")], ["waiting", true]);
same("[MKT.HOOKS.322] clearing leaves the plan given unchanged", marked.parts.find((one) => one.id === "docs-lib-repo-1").state, "waiting");
const drawnBefore = { ...plan, parts: plan.parts.map((one) => (one.id === "docs-lib-repo-1" ? { ...one, state: "waiting", waitingOn: "code-nowhere-1, which has not landed" } : one)) };
const handBefore = { ...plan, parts: plan.parts.map((one) => (one.id === "docs-lib-repo-1" ? { ...one, state: "waiting", waitingOn: "the developer's sign-in" } : one)) };
same("[MKT.HOOKS.322] a reason drawn from the plan's own waits is not carried into the next plan, and a hand wait is (s188)",
  [deriveGo(scope, { previous: drawnBefore }).parts.find((one) => one.id === "docs-lib-repo-1").waitingOn, deriveGo(scope, { previous: handBefore }).parts.find((one) => one.id === "docs-lib-repo-1").waitingOn],
  [undefined, "the developer's sign-in"]);

// MKT.SCRIPTS.326 · a baseline and a full run are both TEST parts, told apart by their ids; fullRunMinutes reads the test rows.
const tests = plan.parts.filter((p) => p.work === "TEST");
same("[MKT.SCRIPTS.326] a baseline and a full run are both TEST parts, and their ids keep the baseline- and full- prefixes", tests.map((p) => [p.id, p.work, p.id.split("-")[0]]),
  [["baseline-lib-repo", "TEST", "baseline"], ["full-lib-repo", "TEST", "full"], ["baseline-app-repo", "TEST", "baseline"], ["full-app-repo", "TEST", "full"]]);
same("[MKT.SCRIPTS.326] a plan whose test parts carry work TEST holds to its schema, and a part still holding pass or BASELINE work does not", [goFaults(plan), goFaults({ ...plan, parts: [{ ...plan.parts[1], work: "BASELINE" }] }).length > 0], [[], true]);
const root = mkdtempSync(join(tmpdir(), "go-plan-root-"));
mkdirSync(join(root, ".spndevex", ".debug", "telemetry"), { recursive: true });
const row = (run, at, ms, part, status = "SUCCESS") => JSON.stringify({ v: 1, mtype: "TEST", id: `${run}-${at}`, event: "PostToolUse", part, status, at, ms, test: { run, tier: "unit", node: "n" } });
same("[MKT.SCRIPTS.326] with no test rows, a full run takes no minutes", fullRunMinutes(root), null);
writeFileSync(join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), [
  row("r1", "2026-10-31T10:00:00.000Z", 120000, "full-lib-repo"),
  row("r1", "2026-10-31T10:01:00.000Z", 120000, "full-lib-repo"),
  row("r2", "2026-10-31T11:00:00.000Z", 60000, "baseline-lib-repo"),
  row("r3", "2026-10-31T12:00:00.000Z", 600000, "full-lib-repo", "FAILURE"),
  JSON.stringify({ v: 1, mtype: "COMMAND", id: "c", part: "full-lib-repo", at: "2026-10-31T13:00:00.000Z", ms: 999999 }),
  "",
].join("\n"));
same("[MKT.SCRIPTS.326] fullRunMinutes is the span of a full run's TEST rows, from the earliest start to the latest end; a baseline, a red run and a row of another kind are left out", fullRunMinutes(root), 3);

const cited = { ...entry("E2", "lib-repo:src/b.ts"), decidedBy: ["Q9"] };
same("[MKT.SCRIPTS.408] citing a card changes no entry's hash", entryHash(cited), entryHash(entry("E2", "lib-repo:src/b.ts")));
same("[MKT.SCRIPTS.408] any other field still changes the hash", entryHash({ ...cited, what: "other" }) === entryHash(cited), false);
const citedScope = [{ arc: "N009", sheet: sheet([entry("E1", "app-repo:src/a.ts"), cited, entry("E3", "lib-repo:docs/c.md")]) }];
same("[MKT.SCRIPTS.408] a landed part whose entry only gained a citation plans no follow-up and is not stale", [changedEntries(plan.parts.find((p) => p.id === "code-lib-repo-1"), citedScope), staleEntries(plan.parts.find((p) => p.id === "code-lib-repo-1"), plan, citedScope)], [[], []]);
const legacyHash = (one) => createHash("sha1").update(JSON.stringify(one)).digest("hex").slice(0, 8);
const signedBefore = plan.parts.find((p) => p.id === "code-lib-repo-1");
const asWritten = new Map(scope[0].sheet.entries.map((one) => [`N009/${one.id}`, one]));
const oldSigned = { ...signedBefore, signature: signedBefore.entries.map((ref) => legacyHash(asWritten.get(ref))).join(".") };
same("[MKT.SCRIPTS.408] a landed part signed before citations left the hash, with decidedBy hashed in, is unchanged while its entries stand as written", changedEntries(oldSigned, scope), []);
const editedSince = [{ arc: "N009", sheet: sheet(scope[0].sheet.entries.map((one) => (one.id === "E2" ? { ...one, what: "other" } : one))) }];
same("[MKT.SCRIPTS.408] and an entry edited since it landed is still found", changedEntries(oldSigned, editedSince), ["N009/E2"]);

const afterRelease = deriveGo([{ arc: "N009", sheet: sheet([...scope[0].sheet.entries, entry("E4", "lib-repo:docs/late.md")]) }], { previous: landedAll });
same("[MKT.SCRIPTS.411] a docs entry planned after its repository's release landed gets a second release part, and a repository with nothing new keeps one",
  afterRelease.parts.filter((p) => p.work === "RELEASE").map((p) => [p.id, p.state]), [["release-lib-repo-1", "landed"], ["release-lib-repo-2", "ready"], ["release-app-repo-1", "landed"]]);
const afterTwo = deriveGo([{ arc: "N009", sheet: sheet([...scope[0].sheet.entries, entry("E4", "lib-repo:docs/late.md"), entry("E5", "lib-repo:docs/later.md")]) }],
  { previous: { ...afterRelease, parts: afterRelease.parts.map((p) => ({ ...p, state: p.id === "release-lib-repo-2" ? "landed" : p.state === "ready" && p.entries.includes("N009/E4") ? "landed" : p.state })) } });
same("[MKT.SCRIPTS.411] and a third after the second landed", afterTwo.parts.filter((p) => p.id.startsWith("release-lib-repo")).map((p) => p.id), ["release-lib-repo-1", "release-lib-repo-2", "release-lib-repo-3"]);
same("[MKT.SCRIPTS.411] the second release waits on the new docs' pass like the first, and the plan passes the schema", [afterRelease.parts.find((p) => p.id === "release-lib-repo-2").waitsOn.length > 0, goFaults(afterRelease)], [true, []]);

// A code part kept from before, landed after the repository's full run, opens the next full run.
const partsOf = (landed) => plan.parts.map((p) => ({ ...p, state: landed.includes(p.id) ? "landed" : "held" }));
const kept2 = { ...plan, parts: partsOf(["docs-lib-repo-1", "baseline-lib-repo", "code-lib-repo-1", "full-lib-repo"]) };
const noNewEntry = [{ arc: "N009", sheet: sheet([scope[0].sheet.entries[1], scope[0].sheet.entries[2]]), landed: ["E2", "E3"] }];
same("[MKT.SCRIPTS.412] a code part that landed after the full run opens the next full run, though it was kept from a previous plan",
  deriveGo(noNewEntry, { previous: kept2, landedOrder: ["docs-lib-repo-1", "baseline-lib-repo", "full-lib-repo", "code-lib-repo-1"] }).parts.some((p) => p.id === "full-lib-repo-2"), true);
same("[MKT.SCRIPTS.412] one that landed before the full run opens none",
  deriveGo(noNewEntry, { previous: kept2, landedOrder: ["docs-lib-repo-1", "baseline-lib-repo", "code-lib-repo-1", "full-lib-repo"] }).parts.some((p) => p.id === "full-lib-repo-2"), false);
same("[MKT.SCRIPTS.412] and with no landing order read, none is opened",
  deriveGo(noNewEntry, { previous: kept2 }).parts.some((p) => p.id === "full-lib-repo-2"), false);

// A code entry that creates a file comes before the one that uses it.
const user = entry("E1", "lib-repo:src/use.ts"), maker = { ...entry("E2", "lib-repo:src/type.ts"), op: "create", callers: ["src/use.ts"] }, other = entry("E3", "lib-repo:src/other.ts");
const ordered = deriveGo([{ arc: "N009", sheet: sheet([user, other, maker]) }]);
same("[MKT.SCRIPTS.413] the entry that creates a file is built before the one that uses it, the rest keeping their number order", ordered.parts.find((p) => p.id === "code-lib-repo-1").entries, ["N009/E2", "N009/E1", "N009/E3"]);
const unknown = deriveGo([{ arc: "N009", sheet: sheet([user, other, { ...maker, callers: [] }]) }]);
same("[MKT.SCRIPTS.413] where nothing says what builds on what, the number order stands", unknown.parts.find((p) => p.id === "code-lib-repo-1").entries, ["N009/E1", "N009/E3", "N009/E2"]);
const loop = deriveGo([{ arc: "N009", sheet: sheet([{ ...user, op: "create", callers: ["src/type.ts"] }, maker]) }]);
same("[MKT.SCRIPTS.413] two entries that name each other keep the number order", loop.parts.find((p) => p.id === "code-lib-repo-1").entries, ["N009/E1", "N009/E2"]);
same("[MKT.SCRIPTS.413] the signature follows the new order and the plan passes the schema", [ordered.parts.find((p) => p.id === "code-lib-repo-1").signature.split(".").length, goFaults(ordered)], [3, []]);

// Two parts that edit one file never run together; a part waits for the parts that edit its sources.
const same1 = entry("E1", "lib-repo:src/shared.ts"), same2 = entry("E2", "lib-repo:src/shared.ts"), apart = entry("E3", "lib-repo:src/apart.ts");
const byOne = deriveGo([{ arc: "N009", sheet: sheet([same1, apart, same2]) }], { rates: { "lib-repo|CODE": 45 / 1 } });
same("[MKT.SCRIPTS.447] one file's entries stay in one part though the bound is one entry, and the entry of another file has a part of its own",
  Object.fromEntries(byOne.parts.filter((p) => p.id.startsWith("code-")).map((p) => [p.id, p.entries])),
  { "code-lib-repo-1": ["N009/E1", "N009/E2"], "code-lib-repo-2": ["N009/E3"] });
const gen = { ...entry("E4", "lib-repo:src/dist/rules.json"), work: "GENERATED", book: ["lib-repo:docs/book.md"] };
const book = { ...entry("E5", "lib-repo:docs/book.md"), work: "DOCS" };
const generated = deriveGo([{ arc: "N009", sheet: sheet([gen, book]) }]);
same("[MKT.SCRIPTS.414] a part waits for the part that edits the file its entries' book lines name, so nothing is ready before its sources landed",
  [generated.parts.find((p) => p.id === "generated-lib-repo-1").waitsOn.includes("docs-lib-repo-1"), readyParts(generated).map((p) => p.id).includes("generated-lib-repo-1")], [true, false]);
same("[MKT.SCRIPTS.414] and the plan passes the schema", goFaults(byOne), []);

// A follow-up is one part for each repository, carried out by the lead.
const fu = deriveGo([{ arc: "N009", sheet: sheet([entry("E1", "lib-repo:docs/a.md"), entry("E2", "lib-repo:docs/b.md"), entry("E3", "lib-repo:src/c.ts")]) }], { followUp: true });
same("[MKT.SCRIPTS.416] a follow-up is one part with its entries of every kind, the lead's own, and the repository's full run because code changed; no baseline and no release",
  fu.parts.map((p) => [p.id, p.entries.length, p.model]), [["code-lib-repo-1", 3, "lead"], ["full-lib-repo", 0, "none"]]);
const fuDocs = deriveGo([{ arc: "N009", sheet: sheet([entry("E1", "lib-repo:docs/a.md"), entry("E2", "lib-repo:docs/b.md")]) }], { followUp: true });
same("[MKT.SCRIPTS.416] a follow-up of docs only has no full run", fuDocs.parts.map((p) => [p.id, p.entries.length]), [["docs-lib-repo-1", 2]]);
same("[MKT.SCRIPTS.416] and both pass the schema", [goFaults(fu), goFaults(fuDocs)], [[], []]);

// ---- Release 1: waits between arcs, releases, baselines and names
const fe = (id, file, over = {}) => ({ ...entry(id, file), ...over });
const rel = (p) => p.parts.filter((x) => x.work === "RELEASE").map((x) => [x.id, x.waitsOn]);
const two = (dependsOn, n3 = true) => [
  ...(n3 ? [{ arc: "N003", sheet: sheet([fe("E1", "sup:src/a.ts")], ["sup"]) }] : []),
  { arc: "N004", sheet: { ...sheet([fe("E1", "plat:src/b.ts")], ["sup", "plat"]), dependsOn } },
];
const sib = [{ arc: "N003", sheet: sheet([fe("E1", "sup:src/a.ts")], ["sup"]) }];
const dep = deriveGo(two(["N003 landed: its release of sup"]));
same("[MKT.SCRIPTS.442] a dependsOn line naming an arc of the scope makes the code parts of the carrying sheet wait on the arc's release parts",
  dep.parts.find((p) => p.id === "code-plat-1").waitsOn.includes("release-sup-1"), true);
const depOut = deriveGo([two(["N003 landed: its release of sup"], false)[0]], { siblings: sib });
const depFirst = depOut.parts.find((p) => p.id === "code-plat-1");
same("[MKT.SCRIPTS.442] with the arc outside the scope the first part of the repository reads waiting on the arc's release of the repository",
  [depFirst.state, depFirst.waitingOn], ["waiting", "N003's release of sup"]);
const own = deriveGo([{ arc: "N003", sheet: sheet([fe("E1", "sup:src/a.ts"), fe("E2", "sup:src/gen/dist/x.js", { work: "GENERATED" })], ["sup", "plat"]) }, { arc: "N004", sheet: sheet([fe("E1", "plat:src/b.ts")], ["sup", "plat"]) }]);
same("[MKT.SCRIPTS.443] a release waits on its own repository's full run and generated parts and on the release before it in the chain, and no other full run",
  rel(own), [["release-sup-1", ["full-sup", "generated-sup-1"]], ["release-plat-1", ["full-plat", "release-sup-1"]]]);
const loopPlan = deriveGo([{ arc: "N003", sheet: { ...sheet([fe("E1", "sup:src/a.ts")], ["sup"]), dependsOn: ["N004 needs plat"] } }, ...two(["N003 landed: its release of sup"], false)]);
same("[MKT.SCRIPTS.443] a dependsOn line naming an arc whose repository comes later in the chain adds no release wait, so two arcs naming each other close no circle",
  [loopPlan.parts.find((p) => p.id === "code-sup-1").waitsOn.includes("release-plat-1"), loopPlan.parts.find((p) => p.id === "code-plat-1").waitsOn.includes("release-sup-1"), loopPlan.circles], [false, true, []]);
same("[MKT.SCRIPTS.443] that dependsOn line is named among the lines it ignored, and go write prints it (s186)",
  [loopPlan.ignored.length, /N003's dependsOn names N004, whose plat comes later in the chain than sup/.test(loopPlan.ignored[0] ?? ""), own.ignored], [1, true, []]);
const looped = [
  { id: "code-sup-1", work: "CODE", repo: "sup", waitsOn: ["release-plat-1"] }, { id: "full-sup", work: "FULL_RUN", repo: "sup", waitsOn: ["code-sup-1"] },
  { id: "release-sup-1", work: "RELEASE", repo: "sup", waitsOn: ["full-sup"] }, { id: "code-plat-1", work: "CODE", repo: "plat", waitsOn: ["release-sup-1"] },
  { id: "full-plat", work: "FULL_RUN", repo: "plat", waitsOn: ["code-plat-1"] }, { id: "release-plat-1", work: "RELEASE", repo: "plat", waitsOn: ["full-plat", "release-sup-1"] },
];
same("[MKT.SCRIPTS.443] a wait circle through a release is returned with its parts", releaseCircles(looped).some((c) => c.includes("release-sup-1") && c.includes("code-sup-1") && c.includes("release-plat-1")), true);
same("[MKT.SCRIPTS.443] and a plan with no circle returns none", own.circles, []);
const landedLoop = deriveGo([{ arc: "N003", sheet: sheet([fe("E1", "sup:src/a.ts")], ["sup"]) }], {
  previous: { schemaVersion: 1, lead: "N003", scope: ["N003"], writtenAt: "2026-10-31T00:00:00Z", parts: looped.map((p) => ({ entries: [], tests: [], signature: "", ...p, state: "landed" })) } });
same("[MKT.SCRIPTS.443] a circle made only of landed parts, kept from an earlier plan, refuses no plan", landedLoop.circles, []);
same("[MKT.SCRIPTS.307] a landed part holding another arc's entry, outside the plan's scope, reads no change",
  changedEntries({ id: "docs-x-1", entries: ["N004/E1", "N009/E2"], signature: "aaaa.bbbb", state: "landed" }, [{ arc: "N009", sheet: sheet([entry("E2", "lib-repo:docs/b.md")]) }]),
  ["N009/E2"]);
same("[MKT.SCRIPTS.514] the circle through a release is its shortest, one to each release, and tangledParts counts every part held in a circle",
  [releaseCircles(looped).map((c) => c.length), tangledParts(looped).length, tangledParts(own.parts)], [[4], 6, []]);
const wide = [{ id: "release-r-1", work: "RELEASE", repo: "r", waitsOn: ["full-r"] }, { id: "full-r", work: "FULL_RUN", repo: "r", waitsOn: Array.from({ length: 40 }, (_, i) => `code-r-${i}`) },
  ...Array.from({ length: 40 }, (_, i) => ({ id: `code-r-${i}`, work: "CODE", repo: "r", waitsOn: [...Array.from({ length: 40 }, (_, j) => `code-r-${j}`).filter((_, j) => j !== i), "release-r-1"] }))];
const started = Date.now();
const wideCircles = releaseCircles(wide);
same("[MKT.SCRIPTS.514] a plan of forty parts that all wait on each other and on the release is answered at once, with one circle",
  [wideCircles.length, wideCircles[0].length, tangledParts(wide).length, Date.now() - started < 2000], [1, 3, 42, true]);
const shared = deriveGo([
  { arc: "N004", sheet: sheet([fe("E1", "sup:src/a.ts"), fe("E2", "plat:src/b.ts")], ["sup", "plat"]) },
  { arc: "N005", sheet: { ...sheet([fe("E1", "plat:src/c.ts")], ["sup", "plat"]), dependsOn: ["N004 (IAM) entries landed first"] } },
]);
const n5 = shared.parts.find((p) => p.entries.includes("N005/E1"));
const n4plat = shared.parts.find((p) => p.entries.includes("N004/E2"));
same("[MKT.SCRIPTS.513] a dependsOn line naming an arc of the scope that shares the waiter's repository waits on that arc's parts there and the releases before it, never its own repository's release",
  [n5.waitsOn.includes(n4plat.id) || n4plat === n5, n5.waitsOn.includes("release-sup-1"), n5.waitsOn.includes("release-plat-1"), shared.circles], [true, true, false, []]);
const named = deriveGo([{ arc: "N004", sheet: sheet([
  fe("E1", "spn-foundation:docs/iam.md", { what: "the chapter names IAMMigrationContribution" }),
  fe("E2", "plat:src/contribution.ts", { what: "exports IAMMigrationContribution" }),
  fe("E3", "plat:src/use.ts", { what: "reads IAMMigrationContribution" })], ["plat"]) }]);
const holderOf = (ref) => named.parts.find((p) => p.entries.includes(ref));
same("[MKT.SCRIPTS.513] a name is waited on only by a part that runs no earlier than its maker: the book's docs naming a platform type do not wait on its code, a later code part does",
  [holderOf("N004/E1").waitsOn.includes(holderOf("N004/E2").id), holderOf("N004/E3") === holderOf("N004/E2") || holderOf("N004/E3").waitsOn.includes(holderOf("N004/E2").id), named.circles], [false, true, []]);
const fnd = deriveGo([{ arc: "N009", sheet: sheet([fe("E1", "lib-repo:docs/c.md"), fe("E2", "spn-foundation:docs/b.md"), fe("E3", "lib-repo:src/x.ts")]) }]);
same("[MKT.SCRIPTS.444] the repository that holds the book comes first, though outside every release chain, and a copy waits on its docs",
  [fnd.parts[0].id, fnd.parts.find((p) => p.id === "docs-lib-repo-1").waitsOn], ["docs-spn-foundation-1", ["docs-spn-foundation-1"]]);
const rowsOf = (status) => ({ schemaVersion: 1, arc: "N009", status, rows: [{ id: "1", parent: "N009", repo: "lib-repo", work: "DOCS", entries: ["E3"], state: "ready" }] });
const bs = (status) => deriveGo([{ arc: "N009", sheet: sheet([fe("E1", "lib-repo:src/x.ts"), fe("E3", "lib-repo:docs/c.md")]), data: rowsOf(status) }]).parts.find((p) => p.id === "baseline-lib-repo").waitsOn;
same("[MKT.SCRIPTS.445] a baseline waits on the part holding a decided arc's DOCS row of its repository", bs("DECIDED"), ["docs-lib-repo-1"]);
same("[MKT.SCRIPTS.445] and an undecided arc's DOCS row does not hold it", bs("OPEN"), []);
const outDocs = deriveGo([{ arc: "N009", sheet: sheet([fe("E1", "lib-repo:src/x.ts")]) }], { siblings: [{ arc: "N003", sheet: sheet([fe("E1", "lib-repo:docs/z.md")]), data: { ...rowsOf("DECIDED"), arc: "N003", rows: [{ id: "1", parent: "N003", repo: "lib-repo", work: "DOCS", entries: ["E1"], state: "ready" }] } }] }).parts.find((p) => p.id === "baseline-lib-repo");
same("[MKT.SCRIPTS.445] a decided arc outside the scope holds the baseline with a waiting line naming the arc", [outDocs.state, outDocs.waitingOn], ["waiting", "N003's docs of lib-repo"]);
const exp = { ...fe("E255", "lib-repo:src/a.ts"), what: "exports readUIServing" }, usesA = { ...fe("E256", "lib-repo:src/b.ts"), what: "calls readUIServing" }, usesB = { ...fe("E257", "lib-repo:src/c.ts"), what: "wraps readUIServingNow, a longer word" };
const exported = deriveGo([{ arc: "N009", sheet: sheet([usesA, usesB, exp]) }]);
same("[MKT.SCRIPTS.413] E255 exporting readUIServing is built before E256 in one part, and a name only inside a longer word holds nothing",
  exported.parts.find((p) => p.id === "code-lib-repo-1").entries, ["N009/E255", "N009/E256", "N009/E257"]);
const exportedApart = deriveGo([{ arc: "N009", sheet: sheet([usesA, usesB, exp]) }], { rates: { "lib-repo|CODE": 45 / 1 } });
const pt = (e) => exportedApart.parts.find((p) => p.entries.includes(`N009/${e}`));
same("[MKT.SCRIPTS.413] across parts the part of E256 waits on the part of E255, and E257 does not",
  [pt("E256").waitsOn.includes(pt("E255").id), pt("E257").waitsOn.includes(pt("E255").id)], [true, false]);
const dec = deriveGo([{ arc: "N009", sheet: sheet([fe("E1", "lib-repo:src/a.ts", { decidedBy: ["Q29"] }), fe("E2", "lib-repo:src/b.ts", { decidedBy: ["notes/N009/preview.html#s3a"] }), fe("E3", "lib-repo:src/c.ts", { decidedBy: ["Q29"] }), fe("E4", "lib-repo:src/d.ts", { decidedBy: [] })]) }]);
same("[MKT.SCRIPTS.447] a pass is grouped by the first card or preview section its entries cite, a preview section first, and each part is named for it",
  dec.parts.filter((p) => p.work === "CODE").map((p) => [p.id, p.entries]),
  [["code-lib-repo-s3a-1", ["N009/E2"]], ["code-lib-repo-q29-1", ["N009/E1", "N009/E3"]], ["code-lib-repo-1", ["N009/E4"]]]);
const decKept = deriveGo([{ arc: "N009", sheet: sheet([fe("E1", "lib-repo:src/a.ts", { decidedBy: ["Q29"] }), fe("E2", "lib-repo:src/b.ts", { decidedBy: ["Q29"] })]) }],
  { rates: { "lib-repo|CODE": 45 / 1 }, previous: { ...dec, parts: [{ ...dec.parts.find((p) => p.id === "code-lib-repo-q29-1"), entries: ["N009/E1"], signature: entryHash(fe("E1", "lib-repo:src/a.ts", { decidedBy: ["Q29"] })), state: "landed" }] } });
same("[MKT.SCRIPTS.447] a new entry of a decision adds a part and renames no other", decKept.parts.filter((p) => p.work === "CODE").map((p) => p.id), ["code-lib-repo-q29-1", "code-lib-repo-q29-2"]);
same("[MKT.SCRIPTS.447] and a plan with such names passes the schema", goFaults(dec), []);

// ---- Release 2: the arc address and the part and cost fields (Q33)
const { ARC_ID, ARC_KINDS } = await import(join(lib, "workstream-schema.ts"));
same("[MKT.SCRIPTS.484] ARC_ID keeps N<nnn> and admits ideate and follow-ups, and no other word", ["N011", "N011a", "ideate", "follow-ups", "follow-up", "build", "N"].map((id) => ARC_ID.test(id)), [true, true, true, true, false, false, false]);
same("[MKT.SCRIPTS.450] a go part may be apply-<repo> and carry a cost, and a cost that is not { tokens, minutes } fails",
  [goFaults({ ...plan, parts: [{ ...plan.parts[0], id: "apply-lib-repo", cost: { tokens: 10, minutes: 2 } }] }), goFaults({ ...plan, parts: [{ ...plan.parts[0], cost: { tokens: "x" } }] }).length > 0], [[], true]);
const ideatePlan = { ...plan, lead: "ideate", scope: ["ideate", "N009"] };
same("[MKT.SCRIPTS.484] a plan may lead with the ideate arc", goFaults(ideatePlan), []);

// ---- Release 2: the apply part and the pricing from landed parts
const light = (id, file) => entry(id, file, {});
const patchOf = (id) => ({ file: `patches/${id}.diff`, base: "abcdef1" });
const applied = deriveGo([{ arc: "N009", sheet: sheet([{ ...entry("E1", "lib-repo:src/a.ts"), patch: patchOf("E1") }, { ...entry("E2", "lib-repo:src/b.ts"), patch: patchOf("E2") }, entry("E3", "lib-repo:src/c.ts")]) }]);
const applyOf = (plan) => plan.parts.find((p) => p.id === "apply-lib-repo");
same("[MKT.SCRIPTS.450] two patched entries form apply-lib-repo with the lead as model and no tests, and the helper's part keeps the rest",
  [applyOf(applied)?.entries, applyOf(applied)?.model, applyOf(applied)?.tests, applied.parts.find((p) => p.id === "code-lib-repo-1")?.entries], [["N009/E1", "N009/E2"], "lead", [], ["N009/E3"]]);
same("[MKT.SCRIPTS.450] the apply part is a code part: the full run waits on it, and the plan holds to its schema", [applied.parts.find((p) => p.id === "full-lib-repo").waitsOn.includes("apply-lib-repo"), goFaults(applied)], [true, []]);
const applyShared = deriveGo([
  { arc: "N004", sheet: sheet([entry("E1", "plat:src/a.ts"), { ...entry("E2", "plat:src/b.ts"), patch: patchOf("E2") }], ["sup", "plat"]) },
  { arc: "N005", sheet: { ...sheet([{ ...entry("E1", "plat:src/c.ts"), patch: patchOf("E1") }], ["sup", "plat"]), dependsOn: ["N004 entries landed first"] } },
]);
const sharedApply = applyShared.parts.find((p) => p.id.startsWith("apply-plat"));
const n4Helper = applyShared.parts.find((p) => p.entries.includes("N004/E1"));
same("[MKT.SCRIPTS.513] the apply part, carrying every arc's patched entries, never waits on another arc's helper code part for a dependsOn line (s188)",
  [!!sharedApply, sharedApply?.waitsOn.includes(n4Helper?.id), applyShared.circles], [true, false, []]);
const failing = deriveGo([{ arc: "N009", sheet: sheet([{ ...entry("E1", "lib-repo:src/a.ts"), patch: patchOf("E1") }, { ...entry("E2", "lib-repo:src/b.ts"), patch: patchOf("E2") }]) }],
  { patchOk: (_arc, one) => one.id !== "E2" });
same("[MKT.SCRIPTS.450] an entry whose patch fails the check joins a code part on its prose",
  [applyOf(failing)?.entries, failing.parts.find((p) => p.id === "code-lib-repo-1")?.entries], [["N009/E1"], ["N009/E2"]]);

// MKT.SCRIPTS.538: a patched change is the lead's, a step is a part of its own, and the go is one workflow.
const change = (id, file, over = {}) => ({ ...entry(id, file), kind: "change", ...over });
const stepOf = (id, file, over = {}) => ({ ...entry(id, file, {}), kind: "step", command: "run it", proof: "it printed ok", ...over });
const stalePatched = deriveGo([{ arc: "N009", sheet: sheet([change("E1", "lib-repo:src/a.ts", { patch: patchOf("E1") }), change("E2", "lib-repo:src/b.ts", { patch: patchOf("E2") })]) }],
  { patchOk: () => false });
same("[MKT.SCRIPTS.538] a patched change whose check fails stays in the apply part and is never cut into a helper's part",
  [applyOf(stalePatched)?.entries, stalePatched.parts.find((p) => p.id === "code-lib-repo-1")?.entries], [["N009/E1", "N009/E2"], undefined]);
const stepPlan = deriveGo([{ arc: "N009", sheet: sheet([stepOf("E1", "lib-repo:src/gen/a.ts"), stepOf("E2", "lib-repo:src/gen/b.ts"), change("E3", "lib-repo:src/c.ts", { patch: patchOf("E3") })]) }]);
const stepParts = stepPlan.parts.filter((p) => p.id.startsWith("generated-"));
same("[MKT.SCRIPTS.538] each step is a part of its own, and the plan holds to its schema",
  [stepParts.map((p) => p.entries), applyOf(stepPlan)?.entries, goFaults(stepPlan)], [[["N009/E1"], ["N009/E2"]], ["N009/E3"], []]);
same("[MKT.SCRIPTS.538] a step runs in the generated pass after the repository's full run, and the full run does not wait on it",
  [stepParts.every((p) => p.waitsOn.includes("full-lib-repo")), stepPlan.parts.find((p) => p.id === "full-lib-repo").waitsOn.includes(stepParts[0].id)], [true, false]);
const flow = workflowOf(stepPlan, [{ arc: "N009", sheet: sheet([stepOf("E1", "lib-repo:src/gen/a.ts"), stepOf("E2", "lib-repo:src/gen/b.ts"), change("E3", "lib-repo:src/c.ts", { patch: patchOf("E3") })]) }]);
const flowParts = JSON.parse(/const PARTS = (\[[\s\S]*?\n\]);/.exec(flow)?.[1] ?? "null");
same("[MKT.SCRIPTS.538] one workflow script holds every part of the plan, each with the waits the plan gives it",
  [flow.startsWith("export const meta"), flowParts?.map((p) => [p.id, p.waitsOn]), flowParts?.find((p) => p.id === stepParts[0].id)?.prompt.includes("run it")],
  [true, stepPlan.parts.map((p) => [p.id, p.waitsOn]), true]);

const lightPlan = deriveGo([{ arc: "N009", sheet: sheet([light("E1", "lib-repo:src/a.ts"), light("E2", "lib-repo:src/b.ts"), light("E3", "lib-repo:src/b.ts"), entry("E4", "lib-repo:src/d.ts")]) }]);
same("[MKT.SCRIPTS.452] a one-file entry with no tiers joins the apply part, and entries whose file another entry edits do not, nor does one with tiers",
  [applyOf(lightPlan)?.entries, lightPlan.parts.find((p) => p.id === "code-lib-repo-1")?.entries], [["N009/E1"], ["N009/E2", "N009/E3", "N009/E4"]]);

// Priced from landed parts, and from another repository's where this one has none.
const landedPart = (id, repo, cost, entries) => ({ id, repo, work: "CODE", entries, tests: [], minutes: null, measuredFrom: null, waitsOn: [], model: "sonnet", signature: entries.map(() => "x").join("."), state: "landed", cost });
const { landedMeasures } = await import(join(lib, "go-plan.ts"));
const fromParts = landedMeasures("", "ws", [], { schemaVersion: 1, lead: "N009", scope: ["N009"], writtenAt: "t", parts: [landedPart("code-lib-repo-1", "lib-repo", { tokens: 10, minutes: 18 }, ["N009/E1", "N009/E2"]), landedPart("code-lib-repo-2", "lib-repo", null, ["N009/E3"])] });
same("[MKT.SCRIPTS.455] landed parts' cost is the measure: a part with no recorded cost measures nothing", fromParts, [{ repo: "lib-repo", work: "CODE", entries: 2, minutes: 18 }]);
const abroad = ratesOf(fromParts);
const estimated = deriveGo([{ arc: "N009", sheet: sheet([entry("E1", "app-repo:src/a.ts"), entry("E2", "app-repo:src/b.ts")]) }], { rates: abroad, measures: fromParts });
same("[MKT.SCRIPTS.455] a repository with no landed part is priced at the other repository's rate and reads estimated from it",
  estimated.parts.filter(codeOf).map((p) => [p.minutes, p.measuredFrom]), [[18, "estimated from lib-repo (1 landed CODE parts there)"]]);
same("[MKT.SCRIPTS.455] the bound follows the other repository's rate, and eight entries only where no part of that kind has landed",
  [boundOf(abroad, "app-repo", "CODE"), boundOf(abroad, "app-repo", "DOCS")], [5, 8]);

// An apply part planned after the repository's full run landed opens the next full run.
const opening = deriveGo([{ arc: "N009", sheet: sheet([entry("E1", "lib-repo:src/a.ts")]) }]);
const finished = { ...opening, parts: opening.parts.filter((p) => p.repo === "lib-repo" && p.work !== "RELEASE").map((p) => ({ ...p, state: "landed" })) };
const later = deriveGo([{ arc: "N009", sheet: sheet([entry("E1", "lib-repo:src/a.ts"), { ...entry("E2", "lib-repo:src/b.ts"), patch: patchOf("E2") }]), landed: ["E1"] }],
  { previous: finished, landedOrder: finished.parts.map((p) => p.id) });
same("[MKT.SCRIPTS.455] an apply part planned after a landed full run opens full-lib-repo-2, which waits on it", [applyOf(later)?.entries, later.parts.find((p) => p.id === "full-lib-repo-2")?.waitsOn.filter((id) => id !== "code-lib-repo-1")], [["N009/E2"], ["apply-lib-repo"]]);

// A stale patch loses its patch for the go; the baseline stands before the apply part.
const stale = deriveGo([{ arc: "N009", sheet: sheet([{ ...entry("E1", "lib-repo:src/a.ts"), patch: patchOf("E1") }]) }], { patchOk: () => false });
same("[MKT.SCRIPTS.497] an entry whose patch is stale has no apply part and joins a code part on its prose",
  [applyOf(stale), stale.parts.find((p) => p.id === "code-lib-repo-1")?.entries], [undefined, ["N009/E1"]]);
const appliedIds = applied.parts.map((p) => p.id);
same("[MKT.SCRIPTS.498] the baseline stands before the apply part",
  appliedIds.indexOf("baseline-lib-repo") >= 0 && appliedIds.indexOf("baseline-lib-repo") < appliedIds.indexOf("apply-lib-repo"), true);

// A step that changed after its part landed gets a follow-up of its own (026 N007/E27), and a dropped part is kept.
const stepEntry = (over = {}) => ({ ...entry("E5", "lib-repo:src/gen.ts", {}), kind: "step", command: "gen", proof: "matches", ...over });
const stepScope = [{ arc: "N009", sheet: sheet([entry("E2", "lib-repo:src/b.ts"), stepEntry()]) }];
const stepLanded = { ...deriveGo(stepScope), parts: deriveGo(stepScope).parts.map((p) => ({ ...p, state: "landed" })) };
const stepChanged = [{ arc: "N009", sheet: sheet([entry("E2", "lib-repo:src/b.ts"), stepEntry({ tiers: { unit: ["MKT.SCRIPTS.300"] } })]) }];
const stepFollowed = deriveGo(stepChanged, { previous: stepLanded });
same("[MKT.SCRIPTS.307] a step that changed after its part landed gets a follow-up part of its own, numbered -2", stepFollowed.parts.filter((p) => p.entries.includes("N009/E5")).map((p) => [p.id, p.state]),
  [["generated-lib-repo-n009-e5", "landed"], ["generated-lib-repo-n009-e5-2", "ready"]]);
same("[MKT.SCRIPTS.307] and the landed step part is no longer stale", staleEntries(stepFollowed.parts.find((p) => p.id === "generated-lib-repo-n009-e5"), stepFollowed, stepChanged), []);
same("[MKT.SCRIPTS.307] an unchanged landed step gets no follow-up", deriveGo(stepScope, { previous: stepLanded }).parts.filter((p) => p.entries.includes("N009/E5")).map((p) => p.id), ["generated-lib-repo-n009-e5"]);
const dropped = markDropped(plan, "release-app-repo-1", "drop the release");
same("[MKT.HOOKS.308] a part is dropped with the developer's words", dropped.parts.filter((p) => p.id === "release-app-repo-1").map((p) => [p.state, p.droppedWords]), [["dropped", "drop the release"]]);
same("[MKT.HOOKS.308] a dropped part holds to its schema", goFaults(dropped), []);
same("[MKT.HOOKS.308] a dropped part is kept as it is when the plan is derived again", deriveGo(scope, { previous: dropped }).parts.filter((p) => p.id === "release-app-repo-1").map((p) => p.state), ["dropped"]);
same("[MKT.HOOKS.308] a landed part cannot be dropped, nor a part with no words", [landedAll, plan].map((one, at) => { try { markDropped(one, "docs-lib-repo-1", at ? " " : "x"); return "no error"; } catch { return "refused"; } }), ["refused", "refused"]);

// proposeScopes: arcs that share a repository are one scope.
const chainOf = ["lib-repo", "app-repo"];
const arcOf = (arc, ...files) => ({ arc, sheet: sheet(files.map((f, i) => entry(`E${i + 1}`, f)), chainOf) });
const proposed = proposeScopes({ arcs: [arcOf("N003", "app-repo:src/c.ts"), arcOf("N002", "lib-repo:src/b.ts", "spn-foundation:docs/x.md"), arcOf("N001", "lib-repo:src/a.ts")], minutes: { "lib-repo": 10, "app-repo": 4 } });
same("[MKT.SCRIPTS.502] arcs sharing a repository form one scope, priced once per extra arc, the book left out, and a later repository waits on the scope before it",
  proposed, [{ arcs: ["N001", "N002"], repos: ["lib-repo"], waitsOn: null, savedMinutes: 10 }, { arcs: ["N003"], repos: ["app-repo"], waitsOn: 1, savedMinutes: 0 }]);
const through = proposeScopes({ arcs: [arcOf("N001", "lib-repo:src/a.ts"), arcOf("N002", "app-repo:src/b.ts"), arcOf("N003", "lib-repo:src/c.ts", "app-repo:src/d.ts")], minutes: { "lib-repo": 10, "app-repo": 4 } });
same("[MKT.SCRIPTS.502] arcs joined through another arc are one scope, repositories in chain order", through, [{ arcs: ["N001", "N002", "N003"], repos: ["lib-repo", "app-repo"], waitsOn: null, savedMinutes: 28 }]);
const unmeasured = proposeScopes({ arcs: [arcOf("N001", "lib-repo:src/a.ts"), arcOf("N002", "lib-repo:src/b.ts", "app-repo:src/c.ts")], minutes: { "lib-repo": null, "app-repo": 4 } });
same("[MKT.SCRIPTS.502] a repository with unmeasured minutes adds nothing to the saving", unmeasured.map((one) => one.savedMinutes), [4]);
same("[MKT.SCRIPTS.502] redCheckIds lists the sorted unique test ids of the CODE parts' entries in a repository",
  [redCheckIds(plan, scope, "lib-repo"), redCheckIds(plan, scope, "app-repo"), redCheckIds(plan, scope, "none")], [["MKT.SCRIPTS.300"], ["MKT.SCRIPTS.300"], []]);

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
