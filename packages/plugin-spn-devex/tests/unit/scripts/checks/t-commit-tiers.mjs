// `checks/commit-tiers.ts` — a `git commit` waits for a whole, green, stamped run of the content it carries
// (the book's RD.DEVEX.WORKSPACE.281).
//
// Each case builds a throwaway git repository with a node in it, writes run files and stamps beside them
// the way spnutils does, and calls the check's own function. The stamp's content hash is computed here
// from `git ls-files -s`, independently of the check, so a hash the check gets wrong fails a case.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const { applies, checkCommitTiers, contentHash, readCommits, tiersTouched } = await import("../../../../src/scripts/checks/commit-tiers.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const BASE = realpathSync(mkdtempSync(join(tmpdir(), "spn-devex-commit-tiers-")));
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
  return repo;
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

const commit = (repo, command = "git commit -m x") => ({ tool_name: "Bash", cwd: repo, tool_input: { command } });
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
const stageSource = (repo) => { write(repo, { "pkg/src/a.ts": "export const a = 2;\n" }); git(repo, "add", "pkg/src/a.ts"); };

console.log("=== a commit that touches no tier passes");
{
  const repo = appsRepo("docs-only");
  write(repo, { "pkg/README.md": "# pkg\n\nmore\n", "pkg/docs/readme.txt": "more docs\n" });
  git(repo, "add", "pkg/README.md", "pkg/docs/readme.txt");
  ok("[MKT.HOOKS.63] a commit of a markdown file and a docs folder of a node passes with no run at all", verdictOf(checkCommitTiers(commit(repo))) === "silent");
  write(repo, { "loose.txt": "changed\n" });
  git(repo, "add", "loose.txt");
  ok("[MKT.HOOKS.63] a commit of a file outside every node passes", verdictOf(checkCommitTiers(commit(repo))) === "silent");
  ok("[MKT.HOOKS.63] a call that is not a commit gets no verdict", checkCommitTiers({ tool_name: "Bash", cwd: repo, tool_input: { command: "git status" } }) === null);
  ok("[MKT.HOOKS.63] a dry run commits nothing and is left out", readCommits("git commit --dry-run -m x", repo).length === 0);
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
  git(repo, "add", "app/src/modules/site/entry/page.ts");
  const refused = checkCommitTiers(commit(repo));
  ok("[MKT.HOOKS.64] a change in a module with a manifest and no package.json asks for its app's tiers, by the app's name",
    denial(refused).includes("`app`, component") && denial(refused).includes("spnutils apps test component commit-component app") && !denial(refused).includes("site"), denial(refused));
}

console.log("\n=== a touched node without a whole, green run on this content is refused, naming its command");
{
  const none = appsRepo("no-stamp");
  stageSource(none);
  const refused = checkCommitTiers(commit(none));
  ok("[MKT.HOOKS.64] a node with no run file is refused", verdictOf(refused) === "deny", JSON.stringify(refused));
  ok("[MKT.HOOKS.64] the refusal names the node, the tier and the command to run",
    denial(refused).includes("`pkg`, unit") && denial(refused).includes("spnutils apps test unit commit-unit pkg"), denial(refused));
  ok("[MKT.HOOKS.64] and every tier the kind owes, one line each", denial(refused).includes("`pkg`, component") && denial(refused).includes("spnutils apps test component commit-component pkg"), denial(refused));

  const bare = appsRepo("bare-run");
  stageSource(bare);
  leaveRun(bare, "pkg", "unit", { content: "", stamped: false });
  ok("[MKT.HOOKS.64] a run file with no stamp counts as no proof", denial(checkCommitTiers(commit(bare))).includes("no stamp file beside it"), denial(checkCommitTiers(commit(bare))));

  const narrowed = appsRepo("narrowed");
  stageSource(narrowed);
  leaveRun(narrowed, "pkg", "unit", { content: indexHash(narrowed, "pkg"), narrowed: true });
  ok("[MKT.HOOKS.64] a narrowed run is refused", denial(checkCommitTiers(commit(narrowed))).includes("narrowed"), denial(checkCommitTiers(commit(narrowed))));

  const stale = appsRepo("stale");
  stageSource(stale);
  leaveRun(stale, "pkg", "unit", { content: indexHash(stale, "pkg") });
  write(stale, { "pkg/src/a.ts": "export const a = 3;\n" });
  git(stale, "add", "pkg/src/a.ts");
  ok("[MKT.HOOKS.64] a stamp whose content differs from the staged content is refused", denial(checkCommitTiers(commit(stale))).includes("other content"), denial(checkCommitTiers(commit(stale))));

  const red = appsRepo("red");
  stageSource(red);
  leaveRun(red, "pkg", "unit", { content: indexHash(red, "pkg"), status: "FAILED" });
  ok("[MKT.HOOKS.64] a run with a failed result is refused", denial(checkCommitTiers(commit(red))).includes("not all green"), denial(checkCommitTiers(commit(red))));
}

{
  const empty = appsRepo("empty-run");
  stageSource(empty);
  leaveRun(empty, "pkg", "unit", { content: indexHash(empty, "pkg") });
  const runFile = join(empty, "pkg", "tests", ".output", "unit", "runs", "r1.json");
  writeFileSync(runFile, JSON.stringify({ run: "r1", tier: "UNIT", phase: null, ranAt: "2026-10-23T21:00:00Z", env: "local", results: [] }), "utf8");
  const refused = checkCommitTiers(commit(empty));
  ok("[MKT.HOOKS.64] a run with no results is refused like a red one, naming its command",
    denial(refused).includes("proved nothing") && denial(refused).includes("spnutils apps test unit commit-unit pkg"), denial(refused));
}

console.log("\n=== a whole green stamped run on exactly this content passes");
{
  const repo = appsRepo("green");
  stageSource(repo);
  const content = indexHash(repo, "pkg");
  leaveRun(repo, "pkg", "unit", { content });
  ok("[MKT.HOOKS.65] with one owed tier still unproven the commit is refused", verdictOf(checkCommitTiers(commit(repo))) === "deny");
  leaveRun(repo, "pkg", "component", { content });
  ok("[MKT.HOOKS.65] with every owed tier whole, green and stamped on this content it passes", verdictOf(checkCommitTiers(commit(repo))) === "silent", denial(checkCommitTiers(commit(repo))));

  write(repo, { "pkg/src/a.ts": "export const a = 4;\n" });
  git(repo, "add", "pkg/src/a.ts");
  ok("[MKT.HOOKS.65] one byte staged after the runs makes them stale", verdictOf(checkCommitTiers(commit(repo))) === "deny");
}
{
  const repo = appsRepo("case-file");
  write(repo, { "pkg/tests/unit/a.spec.ts": "it('a', () => { expect(1).toBe(1); });\n" });
  git(repo, "add", "pkg/tests/unit/a.spec.ts");
  leaveRun(repo, "pkg", "unit", { content: indexHash(repo, "pkg") });
  ok("[MKT.HOOKS.65] a case file touches its own tier alone, so the other owed tier is not asked for", verdictOf(checkCommitTiers(commit(repo))) === "silent", denial(checkCommitTiers(commit(repo))));
  ok("[MKT.HOOKS.65] and a case file of a tier the kind does not owe touches nothing", tiersTouched("tests/journey/x.spec.ts", ["unit", "component"]).length === 0);
  const owesNone = appsRepo("owes-none", "APP_SERVER");
  stageSource(owesNone);
  ok("[MKT.HOOKS.65] a kind that owes only contract and journey asks for no tier at the commit", verdictOf(checkCommitTiers(commit(owesNone))) === "silent");
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
  git(repo, "add", "packages/infra-org/src/main.tf");
  const refused = checkCommitTiers(commit(repo));
  ok("[MKT.HOOKS.66] a change to an infra node is refused with no run, naming the infra command",
    verdictOf(refused) === "deny" && denial(refused).includes("`packages/infra-org`") && denial(refused).includes("spnutils infra test commit infra-org"), denial(refused));
  ok("[MKT.HOOKS.66] and names the type's tiers", denial(refused).includes("contract") && denial(refused).includes("integration"), denial(refused));
  const content = indexHash(repo, "packages/infra-org");
  leaveRun(repo, "packages/infra-org", "contract", { content });
  ok("[MKT.HOOKS.66] one of the two tiers proven is not enough", verdictOf(checkCommitTiers(commit(repo))) === "deny");
  leaveRun(repo, "packages/infra-org", "integration", { content });
  ok("[MKT.HOOKS.66] both tiers whole, green and stamped pass", verdictOf(checkCommitTiers(commit(repo))) === "silent", denial(checkCommitTiers(commit(repo))));
}

console.log("\n=== a commit by path is read from the working tree of the named paths");
{
  const repo = appsRepo("by-path");
  write(repo, { "pkg/src/a.ts": "export const a = 5;\n", "pkg/src/other.ts": "export const other = 1;\n" });
  git(repo, "add", "pkg/src/other.ts");
  const call = "git commit -m x -- pkg/src/a.ts";
  ok("[MKT.HOOKS.67] the paths after `--` are the commit's, and the message is not", JSON.stringify(readCommits(call, repo)[0].pathspecs) === JSON.stringify(["pkg/src/a.ts"]));
  ok("[MKT.HOOKS.67] a commit by path with no run is refused", verdictOf(checkCommitTiers(commit(repo, call))) === "deny");
  // The runs saw the committed tree with a.ts changed and nothing else: the node as the commit will hold it.
  const carried = join(BASE, "by-path-shadow");
  mkdirSync(carried, { recursive: true });
  git(carried, "init", "-q");
  write(carried, { "pkg/spkind.json": JSON.stringify({ kind: "SUPPORT_WEB", name: "Pkg", config: { mtype: "SUPPORT_WEB" } }), "pkg/package.json": JSON.stringify({ name: "pkg", private: true }), "pkg/src/a.ts": "export const a = 5;\n",
    "pkg/tests/unit/a.spec.ts": "it('a', () => {});\n", "pkg/docs/readme.txt": "docs\n", "pkg/README.md": "# pkg\n" });
  git(carried, "add", "-A");
  const content = indexHash(carried, "pkg");
  leaveRun(repo, "pkg", "unit", { content });
  leaveRun(repo, "pkg", "component", { content });
  ok("[MKT.HOOKS.67] runs made on the node as the named paths would leave it pass, whatever else is staged", verdictOf(checkCommitTiers(commit(repo, call))) === "silent", denial(checkCommitTiers(commit(repo, call))));
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

console.log("\n=== the fast path");
ok("[MKT.HOOKS.63] a `git commit`, with options or after a `cd`, applies", applies("", "git commit -m x") && applies("", "cd spn-x && git -C spn-x commit -F msg.txt"));
ok("[MKT.HOOKS.63] a command that only names the word does not", !applies("", "echo commit") && !applies("", "ls"));

console.log(`\n${failed ? `${failed} of ${total} FAILED` : `all ${total} passed`}`);
process.exit(failed ? 1 : 0);
