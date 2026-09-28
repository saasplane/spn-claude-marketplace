#!/usr/bin/env node
// RESTATES: plugin-spn-devex/src/refs/devex/workspace/workstream.md S3 — execution is confirmed, never assumed.
// The ref is the source of truth. A rule change is edited there first, then here, in the same change.
//
// WHAT IT CATCHES. A release the developer never agreed to, at a version that cannot be taken back.
//
// THE RULE IT ENFORCES, and it is narrow on purpose. The developer ruled that the agent releases:
// minor and patch bumps, in any repository type, without asking, because a sitting that changes the
// wiring has to finish it and the developer is not there to type the command. `N39` carries the
// standing authorization, written into an arc log rather than held in a window, because a window
// ends and the permission would end with it.
//
// WHAT STAYS WITH A PERSON IS THE MAJOR BUMP, and the developer put the question at planning time
// rather than at execution time: *ask for developer permission in advance if an arc needs a major
// release, such that while implementing it does not ask the developer to release.* So this check
// asks nobody anything. It reads a decision that was taken before the work started, and refuses a
// version nobody agreed to.
//
// WHAT A GO LOOKS LIKE. The same shape `confirmed.ts` already reads, plus the version, because a
// blanket go for an arc is not a go for an irreversible number:
//
//     - **2026-09-23 — go.** Release this as 2.0.0.
//
// Nothing else counts, for the reason `confirmed.ts` gives: a conversation is not a record.
//
// WHY THE FLOOR CANNOT DO THIS. A permission pattern matches a command PREFIX, and
// `apps release 2.0.0` shares every prefix that matters with `apps release 1.2.68`. The bump size is
// an argument, so only something that reads the argument can see it. That is `Q184` option C, ruled
// out by mechanism rather than by preference.
//
// IT REFUSES ONLY WHAT IT CAN PROVE. An omitted version, a rehearsal, a version it cannot compare
// against a known current one — every one of those passes. A gate that blocks work it does not
// understand is a gate somebody turns off, and this one guards the act that most needs to stay on.

import { execFileSync } from "node:child_process";
import { isAbsolute, join } from "node:path";
import { DEVEX, isDir, listdir, read, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";

/** `apps release 2.0.0` / `infra release 2.0.0`, however the CLI is spelled to get there. */
const RELEASE = /\b(apps|infra)\s+release\b([^|;&]*)/;
const SEMVER = /^(\d+)\.(\d+)\.(\d+)/;

/** `- **2026-09-23 — go.` — the shape `confirmed.ts` reads, and the only shape that counts. */
const GO_LINE = /^\s*-\s*\*\*\d{4}-\d{2}-\d{2}\s*[—-]\s*go\b.*$/gim;

export function applies(_path: string, command: string): boolean {
  return RELEASE.test(command);
}

/** The explicit version a release command stamps, or null when it was omitted. */
export function stampedVersion(command: string): string | null {
  const match = RELEASE.exec(command);
  if (!match) return null;
  // Everything after `release` that is not a flag and not a flag's value. The first bare word is the
  // version argument; commander takes it positionally and so does this.
  const rest = match[2].trim().split(/\s+/).filter(Boolean);
  for (let i = 0; i < rest.length; i += 1) {
    const word = rest[i];
    if (word.startsWith("-")) { if (word === "-m" || word === "--message" || word === "-p" || word === "--package") i += 1; continue; }
    return SEMVER.test(word) ? word : null;
  }
  return null;
}

/**
 * The directory the release will actually run in, which is not always where the session stands.
 *
 * `payload.cwd` is the SESSION's directory, and a Bash call routinely carries its own
 * `cd <repo> && …` because the caller is moving between checkouts in one workspace. Those are two
 * different directories and this check reads git tags out of one of them.
 *
 * FOUND BY BEING WRONG, on 2026-09-23. `cd spn-support-ts && … apps release 1.2.68` was compared
 * against the tags of `spn-platform-ts`, where the session happened to be standing. That repository
 * carries `v0.1.0`, so a patch bump read as a major one and a correct release was refused, with a
 * message naming a version the caller had never typed. The same `cd` also stopped the permission
 * floor's `allow` rule from matching, because a pattern matches the FIRST token — one prefix,
 * two failures, neither of them visible in the other.
 *
 * It reads only the leading `cd`, and only when a separator follows it. Anything more elaborate is a
 * command this cannot reason about, and the session's own directory is the honest answer there.
 */
export function commandCwd(command: string, sessionCwd: string): string {
  const found = /^\s*cd\s+(?:'([^']+)'|"([^"]+)"|([^\s;&|]+))\s*(?:&&|;)/.exec(command);
  const named = found?.[1] ?? found?.[2] ?? found?.[3];
  if (!named) return sessionCwd;
  return isAbsolute(named) ? named : join(sessionCwd, named);
}

/** The newest released version this repository carries, read from its own tags. */
function currentVersion(cwd: string): string | null {
  try {
    const out = execFileSync("git", ["-C", cwd, "tag", "--list", "v*", "--sort=-v:refname"],
                             { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const newest = out.split("\n").map((line) => line.trim()).find(Boolean);
    return newest ? newest.replace(/^v/, "") : null;
  } catch { return null; }
}

/** Whether `next` raises the major of `current`. Anything it cannot read is not a major bump. */
export function isMajorBump(next: string, current: string): boolean {
  const a = SEMVER.exec(next), b = SEMVER.exec(current);
  if (!a || !b) return false;
  return Number(a[1]) > Number(b[1]);
}

/** Whether any arc in any open workstream records a dated go naming this version. */
export function goRecorded(root: string, version: string): boolean {
  const open = join(root, DEVEX, "workstreams", "open");
  for (const subject of listdir(open)) {
    const arcs = join(open, subject, "arcs");
    if (!isDir(arcs)) continue;
    for (const name of listdir(arcs)) {
      if (!name.endsWith(".md")) continue;
      const text = read(join(arcs, name));
      for (const line of text.match(GO_LINE) ?? []) if (line.includes(version)) return true;
    }
  }
  return false;
}

export function checkReleaseGo(payload: Payload): Verdict {
  const command = payload.tool_input?.command ?? "";
  if (!applies("", command)) return null;
  // A rehearsal publishes nothing, so it is never the act this guards.
  if (/--dry-run\b/.test(command)) return null;

  const version = stampedVersion(command);
  if (!version) return null;                       // omitted: the CLI increments, never a major bump

  const cwd = commandCwd(command, payload.cwd ?? process.cwd());
  const current = currentVersion(cwd);
  if (!current) return null;                       // nothing to compare against: not this check's call
  if (!isMajorBump(version, current)) return null; // minor and patch are the standing authorization

  const root = workspaceRoot(cwd) ?? cwd;
  if (goRecorded(root, version)) return null;

  return {
    deny:
      `Denied: \`${version}\` raises the major over \`${current}\`, and no arc records a go for it.\n` +
      `A major release is agreed BEFORE the work starts, as a card on the arc that needs it, so ` +
      `execution never stops to ask for one. Minor and patch releases need none of this — they are ` +
      `the standing authorization in \`N39\`.\n\n` +
      `What is missing is a line in that arc's \`## Log\`:\n\n` +
      `    - **YYYY-MM-DD — go.** Release this as ${version}.\n\n` +
      `Write the card, get it answered, then record the answer in the arc. A go that lives only in ` +
      `this window ends with this window, which is why nothing else counts.`,
  };
}

if (process.argv[1]?.endsWith("release-go.ts")) {
  const { emit, readPayload } = await import("../lib/payload.ts");
  emit(checkReleaseGo(readPayload()));
  process.exit(0);
}
