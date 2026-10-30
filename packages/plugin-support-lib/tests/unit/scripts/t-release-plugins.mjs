// The plugins' release command, `scripts/release-plugins.mjs`, run against a temporary marketplace
// with a bare repository as its `origin` — never the real one. Every case builds its own pair, so no
// case reads what another left behind (RULE.DEVEX.AGENT.110).
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT = resolve(import.meta.dirname, "../../../../../scripts/release-plugins.mjs");
const PLUGINS = ["spn-devex", "spn-surface", "spn-apps", "spn-infra"];

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

// The person's own git settings never reach a case: no signing, no hooks, a fixed identity.
function isolatedEnv(home) {
  const config = join(home, "gitconfig");
  writeFileSync(config, "[init]\n\tdefaultBranch = main\n[tag]\n\tgpgSign = false\n[commit]\n\tgpgSign = false\n", "utf8");
  return {
    ...process.env,
    GIT_CONFIG_GLOBAL: config, GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_NAME: "Release Case", GIT_AUTHOR_EMAIL: "case@example.invalid",
    GIT_COMMITTER_NAME: "Release Case", GIT_COMMITTER_EMAIL: "case@example.invalid",
  };
}

/** A marketplace with four listed plugins at disagreeing numbers, pushed to a bare `origin` tagged `v0.4.0`. */
function fixture() {
  const home = mkdtempSync(join(tmpdir(), "release-plugins-"));
  const env = isolatedEnv(home);
  const remote = join(home, "remote.git");
  const work = join(home, "work");
  const git = (cwd, ...args) => {
    const result = spawnSync("git", args, { cwd, env, encoding: "utf8" });
    if (result.status !== 0) throw new Error(`git ${args.join(" ")}: ${result.stderr}`);
    return result.stdout.trim();
  };
  git(home, "init", "-q", "--bare", "-b", "main", remote);
  git(home, "init", "-q", "-b", "main", work);
  mkdirSync(join(work, ".claude-plugin"), { recursive: true });
  writeFileSync(join(work, ".claude-plugin", "marketplace.json"), JSON.stringify({
    name: "fixture",
    plugins: PLUGINS.map((name) => ({ name, source: `./packages/plugin-${name}/src` })),
  }, null, 2) + "\n", "utf8");
  const numbers = { "spn-devex": "0.75.0", "spn-surface": "0.3.0", "spn-apps": "0.67.0", "spn-infra": "0.59.0" };
  for (const name of PLUGINS) {
    const dir = join(work, "packages", `plugin-${name}`, "src", ".claude-plugin");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "plugin.json"),
      `{\n  "name": "${name}",\n  "version": "${numbers[name]}",\n  "description": "fixture \\u2014 ${name}"\n}\n`, "utf8");
  }
  // The build writes one bundle, so prepare has a rebuilt `dist/` to carry; the tests pass.
  const build = "node -e \"require('fs').mkdirSync('packages/plugin-spn-devex/src/dist',{recursive:true});"
    + "require('fs').writeFileSync('packages/plugin-spn-devex/src/dist/cli.mjs','// built')\"";
  writeFileSync(join(work, "package.json"), JSON.stringify({
    name: "fixture", private: true, scripts: { "build:plugins": build, test: "node -e \"\"" },
  }, null, 2) + "\n", "utf8");
  git(work, "add", "-A");
  git(work, "commit", "-q", "-m", "fixture");
  git(work, "remote", "add", "origin", remote);
  git(work, "push", "-q", "origin", "main");
  git(work, "tag", "-a", "v0.4.0", "-m", "SaaS Plane marketplace 0.4.0");
  git(work, "push", "-q", "origin", "refs/tags/v0.4.0");
  git(work, "fetch", "-q", "origin");
  const release = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd: work, env, encoding: "utf8" });
  const manifest = (name) => readFileSync(join(work, "packages", `plugin-${name}`, "src", ".claude-plugin", "plugin.json"), "utf8");
  const versionOf = (name) => JSON.parse(manifest(name)).version;
  /** Sets all four manifests to one version and lands that commit on origin/main. */
  const landAt = (version, off = {}) => {
    for (const name of PLUGINS) {
      const path = join(work, "packages", `plugin-${name}`, "src", ".claude-plugin", "plugin.json");
      writeFileSync(path, manifest(name).replace(/"version": "[^"]*"/, `"version": "${off[name] ?? version}"`), "utf8");
    }
    git(work, "commit", "-q", "-am", `land ${version}`);
    git(work, "push", "-q", "origin", "main");
    git(work, "fetch", "-q", "origin");
  };
  /** A read that may find nothing: the empty string rather than a throw, so a missing tag is a failed case. */
  const read = (cwd, ...args) => { try { return git(cwd, ...args); } catch { return ""; } };
  const cleanup = () => rmSync(home, { recursive: true, force: true });
  return { home, work, remote, git, read, release, manifest, versionOf, landAt, cleanup };
}

const said = (result) => `${result.stdout}${result.stderr}`;

console.log("=== prepare writes all four and commits");
{
  const f = fixture();
  try {
    const before = f.manifest("spn-devex");
    const result = f.release("prepare", "0.76.0");
    ok("exits 0", result.status === 0, said(result));
    ok("all four carry 0.76.0", PLUGINS.every((name) => f.versionOf(name) === "0.76.0"), PLUGINS.map(f.versionOf).join(" "));
    ok("only the version field moved", f.manifest("spn-devex") === before.replace("0.75.0", "0.76.0"));
    ok("committed as chore(release): plugins 0.76.0", f.git(f.work, "log", "-1", "--format=%s") === "chore(release): plugins 0.76.0");
    const files = f.git(f.work, "show", "--name-only", "--format=", "HEAD").split("\n").sort();
    ok("the commit holds the four manifests and the rebuilt dist/", files.length === 5
      && files.includes("packages/plugin-spn-devex/src/dist/cli.mjs"), files.join(", "));
    ok("the tree is clean after", f.git(f.work, "status", "--porcelain") === "");
    ok("nothing is pushed", f.git(f.remote, "rev-parse", "main") !== f.git(f.work, "rev-parse", "HEAD"));
  } finally { f.cleanup(); }
}

console.log("\n=== prepare refuses a dirty tree, a malformed version, and one not above the newest tag");
{
  const f = fixture();
  try {
    writeFileSync(join(f.work, "stray.txt"), "x\n", "utf8");
    const dirty = f.release("prepare", "0.76.0");
    ok("a dirty tree is refused", dirty.status !== 0 && /not clean/.test(said(dirty)), said(dirty));
    ok("and nothing was written", f.versionOf("spn-devex") === "0.75.0");
    rmSync(join(f.work, "stray.txt"));
    for (const bad of ["0.76", "v0.76.0", "0.76.0-rc.1", "00.76.0"]) {
      const result = f.release("prepare", bad);
      ok(`"${bad}" is refused as malformed`, result.status !== 0 && /not a version/.test(said(result)), said(result));
    }
    for (const low of ["0.4.0", "0.3.9"]) {
      const result = f.release("prepare", low);
      ok(`${low} is refused, not above v0.4.0`, result.status !== 0 && /not above the newest release, v0\.4\.0/.test(said(result)), said(result));
    }
    f.git(f.work, "tag", "-a", "v0.10.0", "-m", "ten");
    f.git(f.work, "push", "-q", "origin", "refs/tags/v0.10.0");
    const numeric = f.release("prepare", "0.9.0");
    ok("the newest is read by number: 0.9.0 is below v0.10.0", numeric.status !== 0 && /v0\.10\.0/.test(said(numeric)), said(numeric));
    ok("no refusal wrote a manifest", PLUGINS.every((name) => f.versionOf(name) !== "0.9.0" && f.versionOf(name) !== "0.76.0"));
  } finally { f.cleanup(); }
}

console.log("\n=== tag refuses off origin/main, on versions that disagree, and on a tag that exists");
{
  const f = fixture();
  try {
    f.release("prepare", "0.76.0");
    const off = f.release("tag");
    ok("a prepared commit not yet on main is refused", off.status !== 0 && /not origin\/main/.test(said(off)), said(off));
  } finally { f.cleanup(); }
}
{
  const f = fixture();
  try {
    const disagree = f.release("tag");
    ok("four manifests that disagree are refused", disagree.status !== 0 && /disagree/.test(said(disagree)), said(disagree));
    f.landAt("0.76.0", { "spn-surface": "0.75.0" });
    const oneOff = f.release("tag");
    ok("one manifest off by one is refused, by name", oneOff.status !== 0 && /spn-surface 0\.75\.0/.test(said(oneOff)), said(oneOff));
  } finally { f.cleanup(); }
}
{
  const f = fixture();
  try {
    f.landAt("0.76.0");
    f.git(f.work, "tag", "-a", "spn-infra--v0.76.0", "-m", "spn-infra 0.76.0");
    const local = f.release("tag");
    ok("a tag that exists locally is refused, by name", local.status !== 0 && /already tagged: spn-infra--v0\.76\.0/.test(said(local)), said(local));
    f.git(f.work, "push", "-q", "origin", "refs/tags/spn-infra--v0.76.0");
    f.git(f.work, "tag", "-d", "spn-infra--v0.76.0");
    const remote = f.release("tag");
    ok("a tag that exists on origin is refused", remote.status !== 0 && /already tagged/.test(said(remote)), said(remote));
  } finally { f.cleanup(); }
}
{
  const f = fixture();
  try {
    f.landAt("0.76.0");
    writeFileSync(join(f.work, "stray.txt"), "x\n", "utf8");
    const dirty = f.release("tag");
    ok("a dirty tree is refused", dirty.status !== 0 && /not clean/.test(said(dirty)), said(dirty));
  } finally { f.cleanup(); }
}

console.log("\n=== tag prints five tags without --push, and cuts nothing");
{
  const f = fixture();
  try {
    f.landAt("0.76.0");
    const tagsBefore = f.git(f.work, "tag", "--list");
    const result = f.release("tag");
    const out = said(result);
    ok("exits 0", result.status === 0, out);
    ok("prints the marketplace tag and its message", out.includes("v0.76.0")
      && out.includes("SaaS Plane marketplace 0.76.0: spn-devex 0.76.0, spn-apps 0.76.0, spn-infra 0.76.0, spn-surface 0.76.0"), out);
    ok("prints a tag for each plugin", PLUGINS.every((name) => out.includes(`${name}--v0.76.0`) && out.includes(`${name} 0.76.0`)), out);
    ok("no tag is cut locally", f.git(f.work, "tag", "--list") === tagsBefore);
    ok("no tag reaches origin", f.git(f.remote, "tag", "--list") === "v0.4.0");
  } finally { f.cleanup(); }
}

console.log("\n=== prepare refuses a book with a parenthesis that does not read");
{
  const f = fixture();
  try {
    const dir = join(f.work, "packages", "plugin-spn-devex", "src", "dist", "commands", "restates");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "check.mjs"),
      'export const findBook = () => "/book";\n' +
      'export const writeRulesIndex = () => ({ commit: "abc", rules: 1, written: [], faults: ["x.md:3: RULE.DEVEX.AGENT.113 \u2014 names no level"] });\n', "utf8");
    f.git(f.work, "add", "-A");
    f.git(f.work, "commit", "-q", "-m", "a stub restates bundle");
    const result = f.release("prepare", "0.76.0");
    ok("the release stops and names the fault", result.status !== 0 && /RULE\.DEVEX\.AGENT\.113 \u2014 names no level/.test(said(result)), said(result));
    ok("the manifests are restored", f.versionOf("spn-devex") === "0.75.0");
  } finally { f.cleanup(); }
}

console.log("\n=== tag --push puts all five on origin, annotated, on main's commit");
{
  const f = fixture();
  try {
    f.landAt("0.76.0");
    const result = f.release("tag", "--push");
    ok("exits 0", result.status === 0, said(result));
    const main = f.git(f.remote, "rev-parse", "main");
    const names = ["v0.76.0", ...PLUGINS.map((name) => `${name}--v0.76.0`)];
    for (const name of names) {
      ok(`${name} is on origin, annotated`, f.read(f.remote, "cat-file", "-t", `refs/tags/${name}`) === "tag");
      ok(`${name} points at main`, f.read(f.remote, "rev-parse", `refs/tags/${name}^{commit}`) === main);
    }
    ok("only those five were pushed", f.git(f.remote, "tag", "--list").split("\n").length === 6);
    ok("the marketplace tag carries the message", f.git(f.remote, "tag", "-l", "--format=%(contents:subject)", "v0.76.0")
      === "SaaS Plane marketplace 0.76.0: spn-devex 0.76.0, spn-apps 0.76.0, spn-infra 0.76.0, spn-surface 0.76.0");
    const again = f.release("tag", "--push");
    ok("a second run is refused, the release is cut once", again.status !== 0 && /already tagged/.test(said(again)), said(again));
  } finally { f.cleanup(); }
}

console.log(`\n${failed ? `${failed} of ${total} FAILED` : `all ${total} passed`}`);
process.exit(failed ? 1 : 0);
