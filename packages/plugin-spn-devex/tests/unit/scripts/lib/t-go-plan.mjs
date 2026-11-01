// `lib/go-plan.ts` — a go's parts derived from the scope's change sheets: passes by repository in release chain
// order, the bound and the split, the test files found by behaviour id, and a derivation kept after a change.
// Driven through the exports; the test files are looked for in a temporary git repository.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const lib = resolve(PLUGIN, "src", "scripts", "lib");
const { deriveGo, fullRunMinutes, readyParts, clearWaiting, markWaiting, ratesOf, boundOf, testFilesOf, entryHash, changedEntries, staleEntries } = await import(join(lib, "go-plan.ts"));
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
same("[MKT.SCRIPTS.300] the release waits on every full run and generated part, and the models are sonnet or none", [waits["release-app-repo-1"], plan.parts.map((p) => p.model).filter((m, i, all) => all.indexOf(m) === i)],
  [["full-lib-repo", "full-app-repo"], ["sonnet", "none"]]);
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

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
