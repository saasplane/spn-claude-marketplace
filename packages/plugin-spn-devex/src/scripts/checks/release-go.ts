#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A major release is agreed while the arc is planned (RULE.DEVEX.WORKSPACE.069)
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
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
// WHAT THE AGENT RECORDS BEFORE THE GO. The version is decided while the arc is planned, and the agent writes it into the arc's log
// as a line of its own, for the repository the release is of:
//
//     spn-devex workstream arc edit <ws>/<arc> --note "release <repo> <version>: <why>"
//
// The guard waits on nobody. It reads that line, and refuses a release with none, or a stamped version whose bump (major, minor or
// patch over the repository's newest tag) is smaller than the recorded one. A bigger bump than recorded is not refused. A major release is therefore agreed at planning, in the
// log, and never at execution.
//
// EVERY OPEN WORKSTREAM, NOT THIS WINDOW'S. A version belongs to a repository rather than to a window,
// so the go may sit in any open workstream (RULE.DEVEX.WORKSPACE.236 names this check among those that
// stay across the workspace).
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
import { basename, isAbsolute, join } from "node:path";
import { isDir, listdir, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";
import { arcIdsOf, logLinesOf } from "../lib/workstream.ts";
import { workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";

/** `apps release 2.0.0` / `infra release 2.0.0`, however the CLI is spelled to get there. */
const RELEASE = /\b(apps|infra)\s+release\b([^|;&]*)/;
const SEMVER = /^(\d+)\.(\d+)\.(\d+)/;

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

/** How large a bump `next` is over `current`: 3 a major, 2 a minor, 1 a patch, 0 none. Null where either cannot be read. */
export function bumpOf(next: string, current: string): number | null {
  const a = SEMVER.exec(next), b = SEMVER.exec(current);
  if (!a || !b) return null;
  if (Number(a[1]) !== Number(b[1])) return Number(a[1]) > Number(b[1]) ? 3 : 0;
  if (Number(a[2]) !== Number(b[2])) return Number(a[2]) > Number(b[2]) ? 2 : 0;
  return Number(a[3]) > Number(b[3]) ? 1 : 0;
}

/** The repository a release runs in, by the folder name of its checkout's top level. */
function repositoryOf(cwd: string): string {
  try {
    const top = execFileSync("git", ["-C", cwd, "rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return basename(top || cwd);
  } catch { return basename(cwd); }
}

/** The version the agent recorded for a repository's release in the log of any arc of any open workstream: the newest line wins. Null where none. */
export function recordedVersion(root: string, repository: string): string | null {
  const escaped = repository.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
  const line = new RegExp(`(?:^|[\\s\u00b7])release ${escaped} (\\d+\\.\\d+\\.\\d+[^\\s:]*):`);
  let newest: { at: string; version: string } | null = null;
  const open = workstreamsDir(root, "open");
  for (const subject of listdir(open)) {
    const ws = join(open, subject);
    if (!isDir(ws)) continue;
    for (const arc of arcIdsOf(ws)) {
      for (const entry of logLinesOf(ws, arc) as Array<{ at?: unknown; note?: unknown }>) {
        const found = typeof entry?.note === "string" ? line.exec(entry.note) : null;
        const at = typeof entry?.at === "string" ? entry.at : "";
        if (found && (!newest || at >= newest.at)) newest = { at, version: found[1] };
      }
    }
  }
  return newest?.version ?? null;
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
  const stamped = bumpOf(version, current);
  if (stamped === null) return null;               // an uncomparable version is not this check's call

  const root = workspaceRoot(cwd) ?? cwd;
  const repository = repositoryOf(cwd);
  const recorded = recordedVersion(root, repository);
  const record = `spn-devex workstream arc edit <ws>/<arc> --note "release ${repository} ${version}: <why>"`;
  if (recorded === null)
    return {
      deny:
        `Denied: no arc's log records the version of the \`${repository}\` release, and \`${version}\` over \`${current}\` is what is being stamped.\n` +
        `The agent decides the version while the arc is planned and records it before the go, so execution never waits on anyone:\n\n` +
        `    ${record}\n\n` +
        `Record it, then run the release (RULE.DEVEX.WORKSPACE.069).`,
    };
  const agreed = bumpOf(recorded, current);
  if (agreed !== null && stamped < agreed) {
    const name = ["no bump", "a patch", "a minor", "a major"];
    return {
      deny:
        `Denied: \`${version}\` is only ${name[stamped]} over \`${current}\`, and the log records \`${recorded}\` for \`${repository}\`, ${name[agreed]}.\n` +
        `Stamp the recorded version, or record the new one first with its reason:\n\n` +
        `    ${record}\n\n` +
        `(RULE.DEVEX.WORKSPACE.069).`,
    };
  }
  return null;
}

if (process.argv[1]?.endsWith("release-go.ts")) {
  const { emit, readPayload } = await import("../lib/payload.ts");
  emit(checkReleaseGo(readPayload()));
  process.exit(0);
}
