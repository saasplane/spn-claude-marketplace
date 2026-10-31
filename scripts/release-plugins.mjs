#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md § The
// place you are standing decides the install mode, and § What names a plugin, and what a version
// means (RULE.DEVEX.AGENT.109, RULE.DEVEX.AGENT.110). The chapter is the source of truth; a rule change
// is edited there first, then here, in the same change.
//
// The plugins' one release command. The four plugins release in lockstep at one version, and the
// marketplace's release tag is that version.
//
//     npm run release:plugins -- prepare <version>    write the version, build, test, commit
//     npm run release:plugins -- tag                  print the five tags the release would cut
//     npm run release:plugins -- tag --push           cut them, push them, read them back
//
// PREPARE refuses a dirty tree, a version that is not `X.Y.Z`, and one not above the newest `vX.Y.Z`
// tag on `origin`, read by number as Support reads it. It writes the version into every manifest
// the listing names (the field only, every other byte kept), runs `build:plugins` and the whole
// test run, and commits the manifests and any rebuilt `dist/` by path. It pushes nothing: the commit
// travels by the usual PRs, to `develop` and then to `main`.
//
// TAG runs on `main` once that commit has landed. It refuses unless `HEAD` is `origin/main`, the
// tree is clean, the manifests agree and none of the five tags exists locally or on `origin`.
// Without `--push` it prints the tags and their messages and changes nothing. With `--push` it cuts
// them annotated, pushes those five refs and no others, and reads them back from `origin`, failing
// by name on any that did not land on `HEAD`.
//
// The repository is the one the command runs in — `npm run` runs it at the marketplace root.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  VERSION_PATTERN, agreedVersion, compareVersions, listedPlugins, newestReleaseNumber, readVersions,
  releaseTags, withVersion,
} from "./lib/plugin-versions.mjs";

const USAGE = [
  "usage: npm run release:plugins -- prepare <version>",
  "       npm run release:plugins -- tag [--push]",
].join("\n");

class Refusal extends Error {}

function git(root, args, options = {}) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options }).trim();
}

function repositoryRoot() {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    throw new Refusal("not inside a git repository — run it at the marketplace root");
  }
}

function refuseDirty(root) {
  const status = git(root, ["status", "--porcelain"]);
  if (status) throw new Refusal(`the tree is not clean — commit or set aside first:\n${status}`);
}

function remoteTags(root) {
  return git(root, ["ls-remote", "--tags", "origin"]);
}

function run(root, command, args) {
  execFileSync(command, args, { cwd: root, stdio: "inherit" });
}

/** The faults of the book beside this checkout, read through the built restates bundle; none where there is no book. */
async function bookFaults(root) {
  const bundle = join(root, "packages", "plugin-spn-devex", "src", "dist", "commands", "restates", "check.mjs");
  if (!existsSync(bundle)) return [];
  const { findBook, writeRulesIndex } = await import(pathToFileURL(bundle).href);
  const book = findBook(undefined, root);
  return book === null ? [] : writeRulesIndex(book, root).faults;
}

async function prepare(root, version) {
  if (!version) throw new Refusal(`prepare needs a version\n${USAGE}`);
  if (!VERSION_PATTERN.test(version)) throw new Refusal(`"${version}" is not a version — write it as X.Y.Z, numbers only`);
  refuseDirty(root);
  const newest = newestReleaseNumber(remoteTags(root));
  if (newest !== null && compareVersions(version, newest) <= 0) {
    throw new Refusal(`${version} is not above the newest release, v${newest} — choose a number above it`);
  }

  const plugins = listedPlugins(root);
  for (const plugin of plugins) {
    const path = join(root, plugin.manifest);
    writeFileSync(path, withVersion(readFileSync(path, "utf8"), version, plugin.manifest), "utf8");
  }
  agreedVersion(readVersions(root));
  console.log(`wrote ${version} into ${plugins.map((plugin) => plugin.manifest).join(", ")}`);

  const restore = () => git(root, ["checkout", "--", ...plugins.map((plugin) => plugin.manifest)]);
  try {
    run(root, "npm", ["run", "build:plugins"]);
  } catch {
    restore();
    throw new Refusal("the build or the tests failed — the manifests are restored and nothing is committed");
  }
  // A book with a parenthesis that does not read is never released: the rules index would leave that rule out.
  const faults = await bookFaults(root);
  if (faults.length > 0) {
    restore();
    throw new Refusal(`the book holds ${faults.length} parenthes(es) that do not read — the manifests are restored and nothing is committed:\n${faults.join("\n")}`);
  }
  try {
    run(root, "npm", ["test"]);
  } catch {
    restore();
    throw new Refusal("the build or the tests failed — the manifests are restored and nothing is committed");
  }

  const manifests = new Set(plugins.map((plugin) => plugin.manifest));
  // `-z` keeps each entry's two status columns intact, where a trimmed line would lose the first.
  const changed = execFileSync("git", ["-C", root, "status", "--porcelain", "-z", "--untracked-files=all"], { encoding: "utf8" })
    .split("\0").filter(Boolean).map((entry) => entry.slice(3));
  const stray = changed.filter((path) => !manifests.has(path) && !/^packages\/[^/]+\/src\/dist\//.test(path));
  if (stray.length > 0) {
    throw new Refusal(`the build or the tests changed files a release does not carry — nothing is committed:\n${stray.join("\n")}`);
  }
  git(root, ["add", "--", ...changed]);
  git(root, ["commit", "-q", "-m", `chore(release): plugins ${version}`, "--", ...changed]);
  console.log(`committed ${changed.length} file(s) as "chore(release): plugins ${version}" — nothing is pushed`);
  console.log("next: the PRs to develop and then to main; on main, `npm run release:plugins -- tag`, then `-- tag --push`");
}

function tag(root, push) {
  git(root, ["fetch", "-q", "origin"]);
  const head = git(root, ["rev-parse", "HEAD"]);
  let main = null;
  try { main = git(root, ["rev-parse", "--verify", "-q", "refs/remotes/origin/main"]); } catch { main = null; }
  if (head !== main) throw new Refusal(`HEAD is not origin/main — the release tags only the commit main holds (HEAD ${head.slice(0, 8)}, origin/main ${main ? main.slice(0, 8) : "missing"})`);
  refuseDirty(root);
  const plugins = readVersions(root);
  const version = agreedVersion(plugins);
  const tags = releaseTags(plugins, version);

  const onRemote = new Set(remoteTags(root).split("\n").map((line) => line.split(/\s+/)[1]).filter(Boolean));
  const existing = tags.filter((t) => {
    let local = false;
    try { git(root, ["rev-parse", "--verify", "-q", `refs/tags/${t.name}`]); local = true; } catch { local = false; }
    return local || onRemote.has(`refs/tags/${t.name}`);
  });
  if (existing.length > 0) throw new Refusal(`already tagged: ${existing.map((t) => t.name).join(", ")} — a release is cut once`);

  if (!push) {
    console.log(`the release of ${version} would cut, on ${head.slice(0, 8)}:`);
    for (const t of tags) console.log(`  ${t.name.padEnd(24)} ${t.message}`);
    console.log("nothing is tagged — run `-- tag --push` to cut and push them");
    return;
  }

  for (const t of tags) git(root, ["tag", "-a", t.name, "-m", t.message, head]);
  git(root, ["push", "-q", "origin", ...tags.map((t) => `refs/tags/${t.name}`)]);
  const landed = new Map(remoteTags(root).split("\n").filter(Boolean).map((line) => {
    const [sha, ref] = line.split(/\s+/);
    return [ref, sha];
  }));
  const missing = tags.filter((t) => landed.get(`refs/tags/${t.name}^{}`) !== head);
  if (missing.length > 0) throw new Refusal(`did not land on origin at ${head.slice(0, 8)}: ${missing.map((t) => t.name).join(", ")}`);
  for (const t of tags) console.log(`  pushed ${t.name}`);
  console.log(`released ${version}: ${tags.length} tags on origin, at ${head.slice(0, 8)}`);
}

const [action, ...rest] = process.argv.slice(2);
try {
  const root = repositoryRoot();
  if (action === "prepare") await prepare(root, rest[0]);
  else if (action === "tag") {
    const unknown = rest.filter((arg) => arg !== "--push");
    if (unknown.length > 0) throw new Refusal(`unknown option(s): ${unknown.join(" ")}\n${USAGE}`);
    tag(root, rest.includes("--push"));
  } else throw new Refusal(action ? `unknown action "${action}"\n${USAGE}` : USAGE);
} catch (error) {
  // A refusal, a manifest the shared reader refuses, or a git command that failed: each is said in
  // one line by its own message, and the command exits non-zero.
  const said = error instanceof Refusal ? error.message : String(error.stderr || error.message).trim();
  console.error(`release:plugins refused — ${said}`);
  process.exit(1);
}
