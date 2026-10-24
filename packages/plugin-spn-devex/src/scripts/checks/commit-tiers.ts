#!/usr/bin/env node
// RESTATES: spn-foundation RD.DEVEX.WORKSPACE.281 — a check refuses an agent's commit when no whole, green run covers exactly the content staged.
//
// Refuses a `git commit` to a node whose touched tiers have no whole, green run, stamped by spnutils, on exactly
// the content the commit carries. The design is in the hooks chapter, § A commit waits for a whole run of its
// content. It reads files and runs git only.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { emit, read, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";
import { segments } from "../lib/command-reader.ts";

/** The tiers a commit asks for: the ones that need nothing running. */
type Tier = "unit" | "component" | "integration" | "contract";

/**
 * What an apps kind owes that needs nothing running, from the testing group's Kind · Owes table. A
 * contract or journey tier needs a service or a stack and stays with the dry run, so a kind that owes
 * only those (`APP_SERVER`, `CLIENT_API`) owes none here. `TOOLCHAIN` owes unit like the support kinds.
 */
export const APPS_OWES: Record<string, Tier[]> = {
  SUPPORT_UNIVERSAL: ["unit"],
  SUPPORT_SERVER: ["unit"],
  SUPPORT_WEB: ["unit", "component"],
  MODULE_SERVER: ["unit"],
  MODULE_WEB: ["unit"],
  APP_SERVER: [],
  APP_WEB: ["component"],
  APP_UTILITY: ["unit", "integration"],
  CLIENT_API: [],
  TOOLCHAIN: ["unit"],
};

/** What an infra node owes by its type, from the blueprints chapter's Which tiers each kind of node owes. Every one needs nothing running. */
export const INFRA_OWES: Record<string, Tier[]> = {
  SUPPORT: ["unit", "contract", "integration"],
  ORGANIZATION: ["contract", "integration"],
  PLATFORM: ["contract", "integration"],
  MODULE: ["contract", "integration"],
};

const TIERS = ["unit", "component", "integration", "contract", "journey"];
const MANIFESTS = ["spkind.json", "spinfrapkg.json"];

/** Whether a command could be a `git commit`: a regular expression over the text, so every other call pays that and stops. */
export function applies(_path: string, command: string): boolean {
  return /\bgit\b[^|;&\n]*\bcommit\b/.test(command);
}

/** One `git commit` as the command typed it. */
export type CommitCall = { dir: string; all: boolean; pathspecs: string[] };

/** Options of `git commit` that take the next word as their value. */
const VALUED_LONG = new Set(["--message", "--file", "--author", "--date", "--reuse-message", "--reedit-message",
  "--template", "--cleanup", "--fixup", "--squash", "--trailer", "--gpg-sign", "--pathspec-from-file"]);
const VALUED_SHORT = new Set(["m", "F", "C", "c", "t"]);
/** Options of `git` itself, before the subcommand, that take the next word. */
const GIT_VALUED = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace"]);

/**
 * Every `git commit` a command runs, each with the folder it runs in (a `cd` or `git -C` moves it), whether
 * it takes every tracked change (`-a`), and the paths it names. A `--dry-run` commits nothing and is left out.
 */
export function readCommits(command: string, cwd: string): CommitCall[] {
  const out: CommitCall[] = [];
  let dir = cwd;
  for (const words of segments(command)) {
    let at = 0;
    while (at < words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[at])) at += 1;
    if (words[at] === "cd" && words[at + 1]) { dir = resolve(dir, words[at + 1]); continue; }
    if (words[at] !== "git") continue;
    at += 1;
    let where = dir;
    while (at < words.length && words[at].startsWith("-")) {
      if (words[at] === "-C" && words[at + 1]) where = resolve(where, words[at + 1]);
      at += GIT_VALUED.has(words[at]) ? 2 : 1;
    }
    if (words[at] !== "commit") continue;
    const call: CommitCall = { dir: where, all: false, pathspecs: [] };
    let dryRun = false;
    let afterDashes = false;
    for (let index = at + 1; index < words.length; index += 1) {
      const word = words[index];
      if (afterDashes) { call.pathspecs.push(word); continue; }
      if (word === "--") { afterDashes = true; continue; }
      if (word.startsWith("--")) {
        if (word === "--all") call.all = true;
        if (word === "--dry-run") dryRun = true;
        if (VALUED_LONG.has(word)) index += 1;
        continue;
      }
      if (word.startsWith("-") && word.length > 1) {
        for (let letter = 1; letter < word.length; letter += 1) {
          const flag = word[letter];
          if (flag === "a") call.all = true;
          if (VALUED_SHORT.has(flag)) { if (letter === word.length - 1) index += 1; break; }
        }
        continue;
      }
      call.pathspecs.push(word);
    }
    if (!dryRun) out.push(call);
  }
  return out;
}

/** Runs git in a folder and returns its output; a failure throws, and the check then allows. */
function git(dir: string, args: string[], input?: string): string {
  return execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", input, maxBuffer: 256 * 1024 * 1024, stdio: ["pipe", "pipe", "ignore"] });
}

/** The blob ids of working-tree files, by `git hash-object --stdin-paths`; a path that is not a file is absent from the answer. */
function workingBlobs(top: string, paths: string[]): Map<string, string> {
  const present = paths.filter((path) => { try { return statSync(join(top, path)).isFile(); } catch { return false; } });
  const out = new Map<string, string>();
  if (!present.length) return out;
  const ids = git(top, ["hash-object", "--stdin-paths"], `${present.join("\n")}\n`).split("\n").filter(Boolean);
  present.forEach((path, index) => out.set(path, ids[index]));
  return out;
}

/** What one commit would carry: the paths it changes, and a way to ask the blob ids of any folder. */
export type Carried = { top: string; changed: string[]; blobsUnder: (folder: string) => Map<string, string> };

/**
 * The paths a commit changes and the files it carries, both relative to the repository's top. Three
 * shapes: the index (a plain commit), the index with tracked working-tree changes (`-a`), and the last
 * commit with the named paths taken from the working tree (`git commit -- <paths>`).
 */
export function carriedBy(call: CommitCall): Carried | null {
  const top = git(call.dir, ["rev-parse", "--show-toplevel"]).trim();
  if (!top) return null;
  const nul = (text: string): string[] => text.split("\0").filter(Boolean);

  if (call.pathspecs.length) {
    const specs = call.pathspecs.map((spec) => (isAbsolute(spec) ? relative(top, spec) : relative(top, resolve(call.dir, spec))) || ".");
    const changed = nul(git(top, ["diff", "HEAD", "--name-only", "--no-renames", "-z", "--", ...specs]));
    return {
      top, changed,
      blobsUnder: (folder) => {
        const base = new Map<string, string>();
        let tree = "";
        try { tree = git(top, ["ls-tree", "-r", "-z", "HEAD", "--", folder]); } catch { /* no commit yet */ }
        for (const entry of nul(tree)) {
          const tab = entry.indexOf("\t");
          base.set(entry.slice(tab + 1), entry.slice(0, tab).split(" ")[2]);
        }
        for (const path of changed) base.delete(path);
        for (const [path, id] of workingBlobs(top, changed)) base.set(path, id);
        return filterUnder(base, folder);
      },
    };
  }

  const staged = nul(git(top, ["diff", "--cached", "--name-only", "--no-renames", "-z"]));
  const tracked = call.all ? nul(git(top, ["ls-files", "-m", "-z"])) : [];
  const changed = [...new Set([...staged, ...tracked])];
  return {
    top, changed,
    blobsUnder: (folder) => {
      const index = new Map<string, string>();
      for (const entry of nul(git(top, ["ls-files", "-s", "-z", "--", folder]))) {
        const tab = entry.indexOf("\t");
        index.set(entry.slice(tab + 1), entry.slice(0, tab).split(" ")[1]);
      }
      if (call.all) {
        for (const path of tracked) index.delete(path);
        for (const [path, id] of workingBlobs(top, tracked)) index.set(path, id);
      }
      return filterUnder(index, folder);
    },
  };
}

/** The entries of a map whose path is under a folder of the repository's top (`.` is all of them). */
function filterUnder(entries: Map<string, string>, folder: string): Map<string, string> {
  if (folder === ".") return entries;
  const out = new Map<string, string>();
  for (const [path, id] of entries) if (path.startsWith(`${folder}/`)) out.set(path, id);
  return out;
}

/**
 * The hash that names a node's content: sha256 over `<path relative to the node>\t<blob id>\n` for each
 * file, sorted by path. The run stamp a run leaves records the same hash of the node it ran on.
 */
export function contentHash(entries: Map<string, string>, folder: string): string {
  const prefix = folder === "." ? "" : `${folder}/`;
  const lines = [...entries].map(([path, id]) => [path.slice(prefix.length), id] as const)
    .sort((left, right) => (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0))
    .map(([path, id]) => `${path}\t${id}\n`);
  return createHash("sha256").update(lines.join("")).digest("hex");
}

/** The node of a path: the nearest folder at or above it, up to the repository's top, that holds a manifest. */
function nodeOf(top: string, path: string): { folder: string; manifest: string } | null {
  let folder = dirname(join(top, path));
  for (;;) {
    for (const manifest of MANIFESTS) if (existsSync(join(folder, manifest))) return { folder: relative(top, folder) || ".", manifest };
    if (folder === top || !folder.startsWith(top + sep)) return null;
    folder = dirname(folder);
  }
}

/** The tiers a node owes that a commit asks for, or none for a kind this check does not know. */
export function owedTiers(top: string, folder: string, manifest: string): Tier[] {
  const node = join(top, folder);
  try {
    if (manifest === "spkind.json") return APPS_OWES[JSON.parse(read(join(node, manifest))).kind] ?? [];
    const estate = JSON.parse(read(join(node, "src", "spestate.json")));
    return INFRA_OWES[estate.type ?? estate.config?.mtype] ?? [];
  } catch { return []; }
}

/** The tiers one changed path touches: a case file its own tier, a document none, anything else every tier owed. */
export function tiersTouched(relativePath: string, owed: Tier[]): Tier[] {
  if (relativePath.endsWith(".md") || relativePath.startsWith("docs/") || relativePath.startsWith("tests/.output/")) return [];
  const caseFile = /^tests\/([a-z]+)\//.exec(relativePath);
  if (caseFile && TIERS.includes(caseFile[1])) return owed.filter((tier) => tier === caseFile[1]);
  return owed;
}

/**
 * Whether a tier of a node has a run that proves exactly this content, or why its newest run does not.
 */
export function proofOf(top: string, folder: string, tier: Tier, content: string): { ok: true } | { ok: false; reason: string } {
  const runs = join(top, folder, "tests", ".output", tier, "runs");
  let files: string[];
  try { files = readdirSync(runs).filter((name) => name.endsWith(".json") && !/\.(stamp|runner)\.json$/.test(name)); }
  catch { files = []; }
  if (!files.length) return { ok: false, reason: "no run file" };
  const newestFirst = files.map((name) => ({ name, at: statSync(join(runs, name)).mtimeMs })).sort((left, right) => right.at - left.at);
  let newestReason = "";
  for (const { name } of newestFirst) {
    const reason = refusalOf(join(runs, name), tier, content);
    if (reason === null) return { ok: true };
    newestReason ||= `\`${name}\`: ${reason}`;
  }
  return { ok: false, reason: newestReason };
}

/** Why one run file is no proof, or null where it is. */
function refusalOf(runFile: string, tier: Tier, content: string): string | null {
  let run: { results?: Array<{ status?: string }> };
  try { run = JSON.parse(read(runFile)); } catch { return "the run file cannot be read"; }
  let stamp: { content?: string; narrowed?: boolean; tier?: string };
  try { stamp = JSON.parse(read(runFile.replace(/\.json$/, ".stamp.json"))); } catch { return "no stamp file beside it, so no proof"; }
  if (stamp.tier && stamp.tier.toLowerCase() !== tier) return `its stamp is for the ${stamp.tier} tier`;
  if (stamp.narrowed !== false) return "the run was narrowed by files, names or a phase";
  if (stamp.content !== content) return "it ran on other content than this commit carries";
  if (!Array.isArray(run.results) || run.results.length === 0) return "it ran no case, so it proved nothing";
  if (run.results.some((result) => result?.status !== "SUCCESS")) return "its results are not all green";
  return null;
}

/** One finding: a node, a tier and why no run covers it. */
type Gap = { folder: string; manifest: string; tier: Tier; reason: string };

export function checkCommitTiers(payload: Payload): Verdict {
  const command = payload.tool_input?.command ?? "";
  if (!applies("", command)) return null;
  const gaps: Gap[] = [];
  let repo = "";
  for (const call of readCommits(command, payload.cwd ?? process.cwd())) {
    const carried = carriedBy(call);
    if (!carried) continue;
    const touched = new Map<string, { manifest: string; tiers: Set<Tier> }>();
    for (const path of carried.changed) {
      const node = nodeOf(carried.top, path);
      if (!node) continue;
      const owed = owedTiers(carried.top, node.folder, node.manifest);
      const inside = node.folder === "." ? path : path.slice(node.folder.length + 1);
      const entry = touched.get(node.folder) ?? { manifest: node.manifest, tiers: new Set<Tier>() };
      for (const tier of tiersTouched(inside, owed)) entry.tiers.add(tier);
      touched.set(node.folder, entry);
    }
    for (const [folder, { manifest, tiers }] of touched) {
      if (!tiers.size) continue;
      const content = contentHash(carried.blobsUnder(folder), folder);
      for (const tier of TIERS.filter((one) => tiers.has(one as Tier)) as Tier[]) {
        const proof = proofOf(carried.top, folder, tier, content);
        if (!proof.ok) { gaps.push({ folder, manifest, tier, reason: proof.reason }); repo = basename(carried.top); }
      }
    }
  }
  if (!gaps.length) return null;
  const lines: string[] = [];
  const infraDone = new Set<string>();
  for (const gap of gaps) {
    const name = basename(gap.folder === "." ? repo : gap.folder);
    if (gap.manifest === "spinfrapkg.json") {
      if (infraDone.has(gap.folder)) continue;
      infraDone.add(gap.folder);
      const tiers = gaps.filter((one) => one.folder === gap.folder).map((one) => one.tier).join(", ");
      lines.push(`- \`${gap.folder}\` (${tiers}): ${gap.reason}. Run \`spnutils infra test commit ${name}\`.`);
    } else {
      lines.push(`- \`${gap.folder}\`, ${gap.tier}: ${gap.reason}. Run \`spnutils apps test ${gap.tier} commit-${gap.tier} -p ${name}\`.`);
    }
  }
  return {
    deny:
      `Denied: this commit touches a node whose owed tiers have no whole, green run on exactly the content it carries ` +
      `(RD.DEVEX.WORKSPACE.281).\n${lines.join("\n")}\n` +
      `Run each command from \`${repo}\`, then commit again. A run narrowed by files, names or a phase, a run with no stamp ` +
      `file and a run made on other content do not count; a file another window left in the node changes the content too.`,
  };
}

if (runAlone("commit-tiers.ts")) {
  try { emit(checkCommitTiers(readPayload())); } catch { /* when unsure, allow */ }
  process.exit(0);
}
