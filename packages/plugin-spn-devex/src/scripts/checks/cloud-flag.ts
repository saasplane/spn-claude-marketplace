#!/usr/bin/env node
// A `spnutils` command that reaches a real cloud account is asked each time.
//
// WHY A HOOK AND NOT A PERMISSION RULE. A permission pattern matches a command PREFIX, so allowing
// `spnutils infra platform up` allows its `--cloud` form too, and no deny can take that back: the flag has
// no fixed position, and `--env dev --cloud` defeats any pattern keyed to one position. Only a check that
// reads the whole line can ask on the flag wherever it sits, in any simple command of the line, through an
// environment prefix, a runner such as `npx`, or a shell's `-c` text. The tier note beside the command table in
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

/** The simple commands of a line: split at `&&`, `||`, `;`, `|`, `&`, a newline and a parenthesis, outside quotes. */
function simpleCommands(command: string): string[] {
  const commands: string[] = [];
  let current = "";
  let quote = "";
  for (let at = 0; at < command.length; at += 1) {
    const char = command[at];
    if (quote !== "") {
      if (char === quote) quote = "";
      current += char;
    } else if (char === "'" || char === '"') {
      quote = char;
      current += char;
    } else if (";|\n()".includes(char) || (char === "&" && command[at - 1] !== ">" && command[at + 1] !== ">")) {
      commands.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  commands.push(current);
  return commands.map((one) => one.trim()).filter(Boolean);
}

/** What may stand before the program itself: an assignment, or a runner that starts it. */
const BEFORE_PROGRAM = /^(?:[A-Za-z_]\w*=\S*\s+|npx\s+|pnpm\s+(?:exec|dlx)\s+|command\s+|exec\s+|env\s+|time\s+|nohup\s+)/;

/** A shell handed its command as text: `bash -c '…'`. */
const SHELL_TEXT = /^(?:ba|z)?sh\s+-l?c\s+(['"])([\s\S]*)\1$/;

/** The words after `spnutils` in one simple command, or null when it runs something else. */
export function spnutilsWords(command: string): string[] | null {
  let rest = command;
  while (BEFORE_PROGRAM.test(rest)) rest = rest.replace(BEFORE_PROGRAM, "");
  const words = rest.split(/\s+/).filter(Boolean);
  return words[0] === "spnutils" || words[0]?.endsWith("/spnutils") ? words.slice(1) : null;
}

/** What asking about one spnutils command would be about, or null. Its flags may sit anywhere among its words. */
function cloudWords(words: string[]): string | null {
  const named = words.filter((word) => !word.startsWith("-"));
  if (named[0] === "login") return "spnutils login";
  if (named[0] !== "infra") return null;
  const rest = named.slice(1);
  const at = rest.findIndex((word) => word === "release" || word in INFRA_CLOUD_COMMANDS);
  if (at === -1) return null;
  const group = rest[at];
  if (group === "release") return words.includes("--local") ? null : "spnutils infra release";
  const verbs = INFRA_CLOUD_COMMANDS[group];
  const verb = verbs === null ? undefined : rest.slice(at + 1).find((word) => verbs.includes(word));
  if (verbs !== null && verb === undefined) return null;
  const flagged = words.some((word) => word === "--cloud" || word.startsWith("--cloud="));
  return flagged ? `spnutils infra ${group}${verb === undefined ? "" : ` ${verb}`} --cloud` : null;
}

function cloudOf(one: string): string | null {
  const words = spnutilsWords(one);
  return words === null ? null : cloudWords(words);
}

/** What asking would be about, for the first cloud command anywhere in the line, or null when it holds none. */
export function cloudCommand(command: string): string | null {
  for (const one of simpleCommands(command)) {
    const shell = SHELL_TEXT.exec(one);
    const named = shell !== null ? cloudCommand(shell[2]) : cloudOf(one);
    if (named !== null) return named;
  }
  return null;
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
