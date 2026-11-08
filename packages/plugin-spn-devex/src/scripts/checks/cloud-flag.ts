#!/usr/bin/env node
// A `spnutils` command that reaches a real cloud account is asked each time.
//
// WHY A HOOK AND NOT A PERMISSION RULE. A permission pattern matches a command PREFIX, so allowing
// `spnutils infra platform up` allows its `--cloud` form too, and no deny can take that back: the flag has
// no fixed position, and `--env dev --cloud` defeats any pattern keyed to one position. Only a check that
// reads the whole command can ask on the flag wherever it sits. The tier note beside the command table in
// spnutils (`SPNUTILS_COMMAND_TIERS`) says the same and points here.
//
// WHAT IT ASKS ON. The cloud-capable commands of the `infra` group (a layer noun's `up`, `down` and
// `status`, `web deploy` and `web rollback`, `config set`, `get` and `list`, and `logs`) when `--cloud` sits
// anywhere in the command, and `login` always: it signs in and writes credentials, and takes no flag.
// `infra release` is asked unless `--local` sits in it, because a release's default target is the
// organization's registry pair, which is a real cloud account; `--local` stages on this machine.
//
// IT NEVER DENIES. An ask puts the call to the developer; a deny would end it. The same words without
// `--cloud` pass, because the laptop's own stack is allowed.

import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";
import { afterCd } from "./long-run.ts";

/** The `infra` words that open a command which can be given `--cloud`: a noun with a verb, or a group with its verb. */
const INFRA_CLOUD_COMMANDS: Record<string, readonly string[] | null> = {
  organization: ["up", "down", "status"],
  platform: ["up", "down", "status"],
  environment: ["up", "down", "status"],
  deployments: ["up", "down", "status"],
  web: ["deploy", "rollback"],
  config: ["set", "get", "list"],
  logs: null,
};

/** The first simple command of a line: what stands before the first `&&`, `||`, `;` or `|`. */
function firstCommand(command: string): string {
  return afterCd(command).split(/&&|\|\||;|\|/)[0].trim();
}

/** The words after `spnutils`, or null when the command is not one. */
export function spnutilsWords(command: string): string[] | null {
  const words = firstCommand(command).split(/\s+/).filter(Boolean);
  const at = words.findIndex((word) => word === "spnutils" || word.endsWith("/spnutils"));
  return at === -1 || at > 0 ? null : words.slice(at + 1);
}

/** What asking would be about, or null when the command is not a cloud one. */
export function cloudCommand(command: string): string | null {
  const words = spnutilsWords(command);
  if (words === null || words.length === 0) return null;
  if (words[0] === "login") return "spnutils login";
  if (words[0] !== "infra") return null;
  const group = words[1];
  if (group === "release") {
    return words.slice(2).some((word) => word === "--local") ? null : "spnutils infra release";
  }
  if (group === undefined || !(group in INFRA_CLOUD_COMMANDS)) return null;
  const verbs = INFRA_CLOUD_COMMANDS[group];
  if (verbs !== null && !verbs.includes(words[2] ?? "")) return null;
  const flagged = words.slice(2).some((word) => word === "--cloud" || word.startsWith("--cloud="));
  return flagged ? `spnutils ${words.slice(0, verbs === null ? 2 : 3).join(" ")} --cloud` : null;
}

/** Whether this check could have an opinion: a `Bash` call whose command names `spnutils`. */
export function applies(_path: string, command: string): boolean {
  return command.includes("spnutils") && cloudCommand(command) !== null;
}

export function checkCloudFlag(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command) return null;
  const named = cloudCommand(command);
  if (named === null) return null;
  return {
    ask:
      `\`${named}\` reaches a real cloud account` +
      (named === "spnutils login" ? " — it signs in and writes credentials" : "") +
      (named === "spnutils infra release" ? " — without --local its target is the organization's registry pair" : "") +
      ". A cloud act is asked each time, and the answer is the developer's.",
  };
}

if (runAlone("cloud-flag.ts")) {
  try { emit(checkCloudFlag(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
