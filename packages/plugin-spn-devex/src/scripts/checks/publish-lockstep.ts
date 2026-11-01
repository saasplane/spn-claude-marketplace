#!/usr/bin/env node
// RESTATES: spn-foundation RULE.DEVEX.AGENT.109 and RULE.DEVEX.AGENT.110, which say a repository's releasable projects
// are released together, at one version, through its one release command. The chapters are the source of truth; a
// rule change is edited there first, then here.
//
// Refuses `npm publish` and `pnpm publish` in a repository that has a release command, and names that command:
// `spnutils apps release` for an APPS repository, `spnutils infra release` for an INFRA one, and the repository's own
// `release` script where its package.json holds one.
//
// A REFUSAL, BECAUSE A PUBLISH CANNOT BE TAKEN BACK: one project at a new version while its siblings stay behind
// claims a difference nobody built. Its fast path is one regular expression over the command.
//
//   called by: events/pretooluse.ts, on a Bash call

import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

const PUBLISH = /\b(?:npm|pnpm)\b(?:\s+(?:-\S+|"[^"]*"|'[^']*'))*\s+publish\b/;

/** Whether a command could be a publish: a regular expression over the text, so every other call stops here. */
export function applies(_path: string, command: string): boolean {
  return PUBLISH.test(command);
}

/** The folder a publish runs in: the last `cd` or `--prefix`/`-C` it names, else the call's folder. */
function runsIn(command: string, cwd: string): string {
  let dir = cwd;
  for (const found of command.matchAll(/\bcd\s+("[^"]+"|'[^']+'|[^\s;&|]+)/g)) dir = resolve(isAbsolute(dir) ? dir : cwd, found[1].replace(/^["']|["']$/g, ""));
  const prefix = /\b(?:npm|pnpm)\b[^|;&\n]*?\s(?:--prefix|-C|--dir)[ =](\S+)/.exec(command);
  return prefix ? resolve(dir, prefix[1]) : dir;
}

/** The release command of the repository around a folder, or null where it has none. */
export function releaseCommand(dir: string): string | null {
  for (let at = resolve(dir); ; at = dirname(at)) {
    const repo = join(at, "sprepo.json");
    if (existsSync(repo)) {
      try {
        const type = (JSON.parse(readFileSync(repo, "utf8")) as { type?: string }).type;
        if (type === "APPS") return "spnutils apps release";
        if (type === "INFRA") return "spnutils infra release";
      } catch { /* an unreadable declaration names no command */ }
      try {
        const scripts = (JSON.parse(readFileSync(join(at, "package.json"), "utf8")) as { scripts?: Record<string, string> }).scripts ?? {};
        const own = Object.keys(scripts).find((name) => name === "release" || name.startsWith("release:"));
        if (own) return `pnpm ${own}`;
      } catch { /* no package.json, no script */ }
      return null;
    }
    if (dirname(at) === at) return null;
  }
}

export function checkPublishLockstep(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command || !applies("", command)) return null;
  const release = releaseCommand(runsIn(command, payload.cwd ?? process.cwd()));
  if (!release) return null;
  return { deny:
    `Denied: this repository releases its projects in lockstep, at one version, through \`${release}\`; ` +
    `\`npm publish\` and \`pnpm publish\` ship one project alone (RULE.DEVEX.AGENT.109, RULE.DEVEX.AGENT.110). Run \`${release}\`.` };
}

if (runAlone("publish-lockstep.ts")) {
  try { emit(checkPublishLockstep(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
