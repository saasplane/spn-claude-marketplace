// `checks/push-tiers.ts` — a `git push` waits for a whole, green, stamped run of the tree at HEAD
// (the book's RD.DEVEX.WORKSPACE.281).
//
// Each case builds a throwaway git repository with a node in it, marks `origin/develop` at its first commit,
// lands changes as commits, writes run files and stamps beside them the way spnutils does, and calls the
// check's own function. The stamp's content hash is computed here from `git ls-files -s`, independently of
// the check, so a hash the check gets wrong fails a case.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const { applies, checkPushTiers, contentHash, readPushes, tiersTouched } = await import("../../../../src/scripts/checks/push-tiers.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const BASE = realpathSync(mkdtempSync(join(tmpdir(), "spn-devex-push-tiers-")));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

const git = (repo, ...args) => execFileSync("git", ["-C", repo, "-c", "user.name=t", "-c", "user.email=t@t", ...args], { encoding: "utf8" });

/** A repository holding `files`, all committed, so a later change is a change. */
function repository(name, files) {
  const repo = join(BASE, name);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q");
  write(repo, files);
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", "base");
  git(repo, "update-ref", "refs/remotes/origin/develop", "HEAD");
  return repo;
}
/** Lands the named paths as one commit on top of origin/develop: a push carries commits, never the index. */
function land(repo, ...paths) {
  git(repo, "add", ...paths);
  git(repo, "commit", "-q", "-m", "change");
}
function write(repo, files) {
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), body, "utf8");
  }
}

/** The hash a stamp records for a node, from what the index holds for it. */
function indexHash(repo, node) {
  const lines = git(repo, "ls-files", "-s", "--", node).split("\n").filter(Boolean).map((line) => {
    const [meta, path] = line.split("\t");
    return [path.slice(node === "." ? 0 : node.length + 1), meta.split(" ")[1]];
  }).sort((left, right) => (left[0] < right[0] ? -1 : 1));
  return createHash("sha256").update(lines.map(([path, id]) => `${path}\t${id}\n`).join("")).digest("hex");
}

/** A run file and its stamp, as `spnutils apps test` and `spnutils infra test` leave them. */
function leaveRun(repo, node, tier, { content, narrowed = false, status = "SUCCESS", stamped = true, name = "r1" }) {
  const runs = join(repo, node, "tests", ".output", tier, "runs");
  mkdirSync(runs, { recursive: true });
  writeFileSync(join(runs, `${name}.json`), JSON.stringify({ run: name, tier: tier.toUpperCase(), phase: null, ranAt: "2026-10-23T21:00:00Z", env: "local",
    results: [{ id: "X.Y.01", tier: tier.toUpperCase(), status, title: "a case" }] }), "utf8");
  if (stamped) {
    writeFileSync(join(runs, `${name}.stamp.json`), JSON.stringify({ run: name, tier: tier.toUpperCase(), content, narrowed, stampedAt: "2026-10-23T21:00:00Z" }), "utf8");
  }
}

const push = (repo, command = "git push", cwd = repo) => ({ tool_name: "Bash", cwd, tool_input: { command } });
const verdictOf = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");
const denial = (verdict) => verdict?.deny ?? "";

/** An apps node `pkg` of the given kind, with a source file and a case file, committed, then a source change staged. */
function appsRepo(name, kind = "SUPPORT_WEB") {
  const repo = repository(name, {
    "pkg/spkind.json": JSON.stringify({ kind, name: "Pkg", config: { mtype: kind } }),
    "pkg/package.json": JSON.stringify({ name: "pkg", private: true }),
    "pkg/src/a.ts": "export const a = 1;\n",
    "pkg/tests/unit/a.spec.ts": "it('a', () => {});\n",
    "pkg/docs/readme.txt": "docs\n",
    "pkg/README.md": "# pkg\n",
    "loose.txt": "outside any node\n",
  });
  return repo;
}
function appsRepoNoOrigin(name) {
  const repo = appsRepo(name);
  git(repo, "update-ref", "-d", "refs/remotes/origin/develop");
  stageSource(repo);
  return repo;
}
const stageSource = (repo) => { write(repo, { "pkg/src/a.ts": "export const a = 2;\n" }); land(repo, "pkg/src/a.ts"); };

console.log("=== a push that touches no tier passes");
{
  const repo = appsRepo("docs-only");
  write(repo, { "pkg/README.md": "# pkg\n\nmore\n", "pkg/docs/readme.txt": "more docs\n" });
  land(repo, "pkg/README.md", "pkg/docs/readme.txt");
  ok("[MKT.HOOKS.63] a push of a markdown file and a docs folder of a node passes with no run at all", verdictOf(checkPushTiers(push(repo))) === "silent");
  write(repo, { "loose.txt": "changed\n" });
  land(repo, "loose.txt");
  ok("[MKT.HOOKS.63] a push of a file outside every node passes", verdictOf(checkPushTiers(push(repo))) === "silent");
  ok("[MKT.HOOKS.63] a call that is not a push gets no verdict", checkPushTiers({ tool_name: "Bash", cwd: repo, tool_input: { command: "git status" } }) === null);
  ok("[MKT.HOOKS.63] a dry run pushes nothing and is left out", readPushes("git push --dry-run", repo).length === 0 && readPushes("git push", repo).length === 1);
}

console.log("\n=== an app-owned module is part of its app's run");
{
  const repo = repository("app-module", {
    "app/spkind.json": JSON.stringify({ kind: "APP_WEB", name: "App", config: { mtype: "APP_WEB" } }),
    "app/package.json": JSON.stringify({ name: "app", private: true }),
    "app/src/modules/site/spkind.json": JSON.stringify({ kind: "MODULE_WEB", name: "Site", config: { mtype: "MODULE_WEB" } }),
    "app/src/modules/site/entry/page.ts": "export const page = 1;\n",
  });
  write(repo, { "app/src/modules/site/entry/page.ts": "export const page = 2;\n" });
  land(repo, "app/src/modules/site/entry/page.ts");
  const refused = checkPushTiers(push(repo));
  ok("[MKT.HOOKS.64] a change in a module with a manifest and no package.json asks for its app's tiers, by the app's name",
    denial(refused).includes("`app`, component") && denial(refused).includes("spnutils apps test component commit-component app") && !denial(refused).includes("site"), denial(refused));
}

console.log("\n=== a touched node without a whole, green run on this content is refused, naming its command");
{
  const none = appsRepo("no-stamp");
  stageSource(none);
  const refused = checkPushTiers(push(none));
  ok("[MKT.HOOKS.64] a node with no run file is refused", verdictOf(refused) === "deny", JSON.stringify(refused));
  ok("[MKT.HOOKS.64] the refusal names the node, the tier and the command to run",
    denial(refused).includes("`pkg`, unit") && denial(refused).includes("spnutils apps test unit commit-unit pkg"), denial(refused));
  ok("[MKT.HOOKS.64] and every tier the kind owes, one line each", denial(refused).includes("`pkg`, component") && denial(refused).includes("spnutils apps test component commit-component pkg"), denial(refused));

  const bare = appsRepo("bare-run");
  stageSource(bare);
  leaveRun(bare, "pkg", "unit", { content: "", stamped: false });
  ok("[MKT.HOOKS.64] a run file with no stamp counts as no proof", denial(checkPushTiers(push(bare))).includes("no stamp file beside it"), denial(checkPushTiers(push(bare))));

  const narrowed = appsRepo("narrowed");
  stageSource(narrowed);
  leaveRun(narrowed, "pkg", "unit", { content: indexHash(narrowed, "pkg"), narrowed: true });
  ok("[MKT.HOOKS.64] a narrowed run is refused", denial(checkPushTiers(push(narrowed))).includes("narrowed"), denial(checkPushTiers(push(narrowed))));

  const stale = appsRepo("stale");
  stageSource(stale);
  leaveRun(stale, "pkg", "unit", { content: indexHash(stale, "pkg") });
  write(stale, { "pkg/src/a.ts": "export const a = 3;\n" });
  land(stale, "pkg/src/a.ts");
  ok("[MKT.HOOKS.64] a stamp whose content differs from the staged content is refused", denial(checkPushTiers(push(stale))).includes("other content"), denial(checkPushTiers(push(stale))));

  const red = appsRepo("red");
  stageSource(red);
  leaveRun(red, "pkg", "unit", { content: indexHash(red, "pkg"), status: "FAILED" });
  ok("[MKT.HOOKS.64] a run with a failed result is refused", denial(checkPushTiers(push(red))).includes("not all green"), denial(checkPushTiers(push(red))));

  const live = appsRepo("live-skipped");
  stageSource(live);
  leaveRun(live, "pkg", "unit", { content: indexHash(live, "pkg") });
  leaveRun(live, "pkg", "component", { content: indexHash(live, "pkg") });
  const liveFile = join(live, "pkg", "tests", ".output", "unit", "runs", "r1.json");
  writeFileSync(liveFile, JSON.stringify({ run: "r1", tier: "UNIT", phase: null, ranAt: "2026-10-27T00:00:00Z", env: "local", results: [{ id: "X.01", status: "SUCCESS" }, { id: "X.02", status: "PENDING" }] }), "utf8");
  ok("[MKT.HOOKS.64] a run whose other cases are skipped live cases counts as green", checkPushTiers(push(live)) === null, denial(checkPushTiers(push(live))));

  const skipped = appsRepo("all-skipped");
  stageSource(skipped);
  leaveRun(skipped, "pkg", "unit", { content: indexHash(skipped, "pkg") });
  const skippedFile = join(skipped, "pkg", "tests", ".output", "unit", "runs", "r1.json");
  writeFileSync(skippedFile, JSON.stringify({ run: "r1", tier: "UNIT", phase: null, ranAt: "2026-10-27T00:00:00Z", env: "local", results: [{ id: "X.02", status: "PENDING" }] }), "utf8");
  ok("[MKT.HOOKS.64] a run where every case was skipped is refused", denial(checkPushTiers(push(skipped))).includes("every case it ran was skipped"), denial(checkPushTiers(push(skipped))));
}

{
  const empty = appsRepo("empty-run");
  stageSource(empty);
  leaveRun(empty, "pkg", "unit", { content: indexHash(empty, "pkg") });
  const runFile = join(empty, "pkg", "tests", ".output", "unit", "runs", "r1.json");
  writeFileSync(runFile, JSON.stringify({ run: "r1", tier: "UNIT", phase: null, ranAt: "2026-10-23T21:00:00Z", env: "local", results: [] }), "utf8");
  const refused = checkPushTiers(push(empty));
  ok("[MKT.HOOKS.64] a run with no results is refused like a red one, naming its command",
    denial(refused).includes("proved nothing") && denial(refused).includes("spnutils apps test unit commit-unit pkg"), denial(refused));
}

console.log("\n=== a whole green stamped run on exactly this content passes");
{
  const repo = appsRepo("green");
  stageSource(repo);
  const content = indexHash(repo, "pkg");
  leaveRun(repo, "pkg", "unit", { content });
  ok("[MKT.HOOKS.65] with one owed tier still unproven the push is refused", verdictOf(checkPushTiers(push(repo))) === "deny");
  leaveRun(repo, "pkg", "component", { content });
  ok("[MKT.HOOKS.65] with every owed tier whole, green and stamped on this content it passes", verdictOf(checkPushTiers(push(repo))) === "silent", denial(checkPushTiers(push(repo))));

  write(repo, { "pkg/src/a.ts": "export const a = 4;\n" });
  land(repo, "pkg/src/a.ts");
  ok("[MKT.HOOKS.65] one byte staged after the runs makes them stale", verdictOf(checkPushTiers(push(repo))) === "deny");
}
{
  const repo = appsRepo("case-file");
  write(repo, { "pkg/tests/unit/a.spec.ts": "it('a', () => { expect(1).toBe(1); });\n" });
  land(repo, "pkg/tests/unit/a.spec.ts");
  leaveRun(repo, "pkg", "unit", { content: indexHash(repo, "pkg") });
  ok("[MKT.HOOKS.65] a case file touches its own tier alone, so the other owed tier is not asked for", verdictOf(checkPushTiers(push(repo))) === "silent", denial(checkPushTiers(push(repo))));
  ok("[MKT.HOOKS.65] and a case file of a tier the kind does not owe touches nothing", tiersTouched("tests/journey/x.spec.ts", ["unit", "component"]).length === 0);
  const owesNone = appsRepo("owes-none", "APP_SERVER");
  stageSource(owesNone);
  ok("[MKT.HOOKS.65] a kind that owes only contract and journey asks for no tier at the push", verdictOf(checkPushTiers(push(owesNone))) === "silent");
}

console.log("\n=== an infra node is found by spinfrapkg.json");
{
  const infra = (name) => repository(name, {
    "packages/infra-org/spinfrapkg.json": JSON.stringify({ name: "@spn/infra-org", version: "0.1.0" }),
    "packages/infra-org/src/spestate.json": JSON.stringify({ type: "ORGANIZATION", config: { mtype: "ORGANIZATION" } }),
    "packages/infra-org/src/main.tf": "# tf\n",
  });
  const repo = infra("infra-red");
  write(repo, { "packages/infra-org/src/main.tf": "# tf changed\n" });
  land(repo, "packages/infra-org/src/main.tf");
  const refused = checkPushTiers(push(repo));
  ok("[MKT.HOOKS.66] a change to an infra node is refused with no run, naming the infra command",
    verdictOf(refused) === "deny" && denial(refused).includes("`packages/infra-org`") && denial(refused).includes("spnutils infra test commit infra-org"), denial(refused));
  ok("[MKT.HOOKS.66] and names the type's tiers", denial(refused).includes("contract") && denial(refused).includes("integration"), denial(refused));
  const content = indexHash(repo, "packages/infra-org");
  leaveRun(repo, "packages/infra-org", "contract", { content });
  ok("[MKT.HOOKS.66] one of the two tiers proven is not enough", verdictOf(checkPushTiers(push(repo))) === "deny");
  leaveRun(repo, "packages/infra-org", "integration", { content });
  ok("[MKT.HOOKS.66] both tiers whole, green and stamped pass", verdictOf(checkPushTiers(push(repo))) === "silent", denial(checkPushTiers(push(repo))));
}

console.log("\n=== a manifest inside another node's tests/ folder is a fixture, never a node");
{
  const repo = repository("fixture-manifest", {
    "tool/spkind.json": JSON.stringify({ kind: "APP_UTILITY", name: "Tool", config: { mtype: "APP_UTILITY" } }),
    "tool/package.json": JSON.stringify({ name: "tool", private: true }),
    "tool/tests/fixtures/estate-x/spinfrapkg.json": JSON.stringify({ name: "@spn/estate-x", version: "0.1.0" }),
    "tool/tests/fixtures/estate-x/src/spestate.json": JSON.stringify({ type: "ORGANIZATION", config: { mtype: "ORGANIZATION" } }),
    "tool/tests/fixtures/estate-x/src/main.tf": "# tf\n",
  });
  write(repo, { "tool/tests/fixtures/estate-x/src/main.tf": "# tf changed\n" });
  land(repo, "tool/tests/fixtures/estate-x/src/main.tf");
  const refused = checkPushTiers(push(repo));
  ok("[MKT.HOOKS.78] a change to a fixture asks for the tiers of the node whose tests hold it, and names no infra node",
    denial(refused).includes("`tool`, unit") && denial(refused).includes("`tool`, integration") && !denial(refused).includes("estate-x") && !denial(refused).includes("infra test"), denial(refused));
  const content = indexHash(repo, "tool");
  leaveRun(repo, "tool", "unit", { content });
  leaveRun(repo, "tool", "integration", { content });
  ok("[MKT.HOOKS.78] and the outer node's whole, green runs pass it", verdictOf(checkPushTiers(push(repo))) === "silent", denial(checkPushTiers(push(repo))));
}

console.log("\n=== a push is measured from its base, and carries commits only");
{
  const repo = appsRepo("hotfix-base");
  const branch = git(repo, "branch", "--show-current").trim();
  // origin/main stays at the first commit; a change is committed, and origin/develop moves up to it.
  git(repo, "update-ref", "refs/remotes/origin/main", "HEAD");
  stageSource(repo);
  git(repo, "update-ref", "refs/remotes/origin/develop", "HEAD");
  ok("[MKT.HOOKS.67] a branch with nothing since origin/develop carries nothing, so a push of it passes", verdictOf(checkPushTiers(push(repo))) === "silent", denial(checkPushTiers(push(repo))));
  git(repo, "config", `branch.${branch}.spnBase`, "main");
  const refused = checkPushTiers(push(repo));
  ok("[MKT.HOOKS.67] a branch whose git config records `spnBase` main is measured from origin/main, and is refused without a stamp",
    verdictOf(refused) === "deny" && denial(refused).includes("spnutils apps test unit commit-unit pkg"), denial(refused));
  const content = indexHash(repo, "pkg");
  leaveRun(repo, "pkg", "unit", { content });
  leaveRun(repo, "pkg", "component", { content });
  ok("[MKT.HOOKS.67] with the whole stamped runs on the tree at HEAD the hotfix push passes", verdictOf(checkPushTiers(push(repo))) === "silent", denial(checkPushTiers(push(repo))));
  write(repo, { "pkg/src/a.ts": "export const a = 99;\n" });
  git(repo, "add", "pkg/src/a.ts");
  ok("[MKT.HOOKS.67] a change staged or left in the working tree after the runs is not carried, so the push still passes", verdictOf(checkPushTiers(push(repo))) === "silent", denial(checkPushTiers(push(repo))));
  ok("[MKT.HOOKS.67] a push in a folder git does not know, or with no origin/develop, gets no verdict",
    checkPushTiers(push(repo, "git push", join(BASE, "nowhere"))) === null && checkPushTiers(push(appsRepoNoOrigin("no-origin"))) === null);
}

console.log("\n=== the content hash is pinned");
{
  const repo = repository("pinned", { "node/a.txt": "alpha\n", "node/src/b.txt": "beta\n" });
  const blobs = git(repo, "ls-files", "-s", "--", "node").trim().split("\n").map((line) => line.split(/\s+/)[1]);
  const entries = new Map([["node/a.txt", blobs[0]], ["node/src/b.txt", blobs[1]]]);
  ok("[MKT.HOOKS.68] the blob ids are git's own for `alpha\\n` and `beta\\n`",
    blobs[0] === git(repo, "hash-object", "node/a.txt").trim() && blobs[1] === git(repo, "hash-object", "node/src/b.txt").trim());
  const PINNED = "53351ac4132ba64749a0815fd79531c10cd5f430cb8906b11f92372f3f6c81b9";
  ok("[MKT.HOOKS.68] node/a.txt = `alpha\\n` and node/src/b.txt = `beta\\n`, hashed by path and index blob id, give one fixed answer",
    contentHash(entries, "node") === PINNED && indexHash(repo, "node") === PINNED, `${contentHash(entries, "node")} / ${blobs.join(" ")}`);
  ok("[MKT.HOOKS.68] the order the entries arrive in changes nothing",
    contentHash(new Map([...entries].reverse()), "node") === contentHash(entries, "node"));
}

console.log("\n=== a push of a TypeScript node also waits for the repository's own Prettier to accept the files it changes");
{
  // A stand-in for the pinned Prettier: it flags a file holding the word UNFORMATTED, skips what `.prettierignore` names,
  // and records how it was called, so the case reads the flags and the folder the check used.
  const STUB = [
    "#!/usr/bin/env node",
    'const fs = require("node:fs");',
    'const args = process.argv.slice(2);',
    'fs.appendFileSync(__dirname + "/prettier.calls", JSON.stringify({ cwd: process.cwd(), args }) + "\\n");',
    'const ignored = fs.existsSync(".prettierignore") ? fs.readFileSync(".prettierignore", "utf8").split("\\n").filter(Boolean) : [];',
    'let bad = false;',
    'for (const file of args.filter((arg) => !arg.startsWith("--"))) {',
    '  if (ignored.some((rule) => file === rule || file.startsWith(rule))) continue;',
    '  if (!/\\.(ts|tsx|json)$/.test(file)) continue;',
    '  if (fs.readFileSync(file, "utf8").includes("UNFORMATTED")) { console.error("[warn] " + file); bad = true; }',
    '}',
    'if (bad) console.error("[warn] Code style issues found in the above file. Run Prettier to fix.");',
    "process.exit(bad ? 1 : 0);",
    "",
  ].join("\n");
  const FORMATTED = "export const a = 1;\n";
  const BAD = "export const a   =   1; // UNFORMATTED\n";
  const calls = (repo) => { try { return readFileSync(join(repo, "node_modules", ".bin", "prettier.calls"), "utf8").trim().split("\n").map((line) => JSON.parse(line)); } catch { return []; } };

  /** A TypeScript repository with one node, the stub installed unless `installed` is false, and `.prettierignore` as given. */
  function fmtRepo(name, { stack = "TS", installed = true, ignore = "" } = {}) {
    const repo = repository(name, {
      "sprepo.json": JSON.stringify({ type: "APPS", name: "R", config: { mtype: "APPS", stack } }),
      "pkg/spkind.json": JSON.stringify({ kind: "APP_SERVER", name: "Pkg", config: { mtype: "APP_SERVER" } }),
      "pkg/package.json": JSON.stringify({ name: "pkg", private: true }),
      "pkg/src/a.ts": FORMATTED,
      "pkg/src/gen/g.ts": FORMATTED,
      "pkg/src/keep.ts": BAD,
      "pkg/README.md": "# pkg\n",
      ".prettierignore": ignore,
    });
    if (installed) {
      mkdirSync(join(repo, "node_modules", ".bin"), { recursive: true });
      writeFileSync(join(repo, "node_modules", ".bin", "prettier"), STUB, { mode: 0o755 });
    }
    return repo;
  }

  const bad = fmtRepo("fmt-bad");
  write(bad, { "pkg/src/a.ts": BAD });
  land(bad, "pkg/src/a.ts");
  const refused = checkPushTiers(push(bad));
  ok("[MKT.HOOKS.82] a changed file Prettier would reformat refuses the push, naming the file and the fix",
    verdictOf(refused) === "deny" && denial(refused).includes("`pkg/src/a.ts`") && denial(refused).includes("pnpm exec prettier --write pkg/src/a.ts"), denial(refused));
  const ran = calls(bad);
  ok("[MKT.HOOKS.82] the repository's own Prettier ran as --check --ignore-unknown from the repository root, on the changed file alone",
    ran.length === 1 && ran[0].args.join(" ") === "--check --ignore-unknown pkg/src/a.ts" && realpathSync(ran[0].cwd) === bad, JSON.stringify(ran));

  const good = fmtRepo("fmt-good");
  write(good, { "pkg/src/a.ts": "export const a = 2;\n" });
  land(good, "pkg/src/a.ts");
  ok("[MKT.HOOKS.82] a changed file Prettier accepts passes", verdictOf(checkPushTiers(push(good))) === "silent", denial(checkPushTiers(push(good))));

  const unchanged = fmtRepo("fmt-unchanged");
  write(unchanged, { "pkg/src/a.ts": "export const a = 3;\n" });
  land(unchanged, "pkg/src/a.ts");
  ok("[MKT.HOOKS.82] an unformatted file the push does not change passes, and is not even handed to Prettier",
    verdictOf(checkPushTiers(push(unchanged))) === "silent" && !calls(unchanged).some((call) => call.args.includes("pkg/src/keep.ts")));

  const ignored = fmtRepo("fmt-ignored", { ignore: "pkg/src/gen/\n" });
  write(ignored, { "pkg/src/gen/g.ts": BAD });
  land(ignored, "pkg/src/gen/g.ts");
  ok("[MKT.HOOKS.82] a changed file the repository's .prettierignore keeps out passes", verdictOf(checkPushTiers(push(ignored))) === "silent", denial(checkPushTiers(push(ignored))));

  const docsOnly = fmtRepo("fmt-docs");
  write(docsOnly, { "pkg/README.md": "# pkg\n\nmore\n" });
  land(docsOnly, "pkg/README.md");
  ok("[MKT.HOOKS.82] a push that changes no file Prettier handles passes", verdictOf(checkPushTiers(push(docsOnly))) === "silent", denial(checkPushTiers(push(docsOnly))));

  const removed = fmtRepo("fmt-removed");
  git(removed, "rm", "-q", "pkg/src/keep.ts");
  git(removed, "commit", "-q", "-m", "delete");
  ok("[MKT.HOOKS.82] a deleted file is not checked", verdictOf(checkPushTiers(push(removed))) === "silent" && calls(removed).length === 0, denial(checkPushTiers(push(removed))));

  const missing = fmtRepo("fmt-missing", { installed: false });
  write(missing, { "pkg/src/a.ts": "export const a = 4;\n" });
  land(missing, "pkg/src/a.ts");
  const noPrettier = checkPushTiers(push(missing));
  ok("[MKT.HOOKS.82] Prettier not installed refuses the push, naming pnpm install", verdictOf(noPrettier) === "deny" && denial(noPrettier).includes("pnpm install"), denial(noPrettier));

  const other = fmtRepo("fmt-py", { stack: "PY" });
  write(other, { "pkg/src/a.ts": BAD });
  land(other, "pkg/src/a.ts");
  ok("[MKT.HOOKS.82] a node of a repository that is not TypeScript is not checked", verdictOf(checkPushTiers(push(other))) === "silent" && calls(other).length === 0, denial(checkPushTiers(push(other))));
}

console.log("\n=== the fast path");
ok("[MKT.HOOKS.63] a `git push`, with options or after a `cd`, applies", applies("", "git push origin HEAD") && applies("", "cd spn-x && git -C spn-x push -u origin feat/x"));
ok("[MKT.HOOKS.63] a command that only names the word, and a `git commit`, do not", !applies("", "echo push") && !applies("", "git commit -m x") && !applies("", "ls"));

console.log(`\n${failed ? `${failed} of ${total} FAILED` : `all ${total} passed`}`);
process.exit(failed ? 1 : 0);
