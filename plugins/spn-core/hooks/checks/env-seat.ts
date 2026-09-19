#!/usr/bin/env node
// RESTATES: spn-foundation docs/03-capabilities/04-devex § the machine seat — a value in `~/.spnenv`
// is never printed or logged. The chapter is the source of truth; a rule change is edited there
// first, then here, in the same change.
//
// Refuse to render `~/.spnenv`. A value never reaches a terminal.
//
// WHY THIS EXISTS. Three surfaces state that a value in the machine seat is never printed or logged,
// and a session broke it anyway — five live credentials went into a transcript, hours after arguing
// the rule at length on the same day. A rule three documents state and no instrument checks is
// exactly the shape workstream 009 exists to fix. Prose plainly did not stop it.
//
// WHAT IS AND IS NOT REFUSED. The agent may READ this file; `Q7` settled that, and it has to —
// `spnutils` reads the whole file on every `sync` to preserve the regions you own. What is refused
// is RENDERING one: a command whose output lands in a transcript that outlives the session.
//
//     refused   cat · sed -n '72,89p' · head · tail · less · awk · grep, pointed at the seat
//               the Read tool pointed at it
//     fine      `spnutils workspace status`, which reports key names and set-state
//               anything inside spnutils' own process, which this never sees
//
// DENY, RATHER THAN AN ALLOWLIST OF SAFE READS. A pipeline ending in `cut -d= -f1` prints only key
// names, and one ending in `cut -d= -f2` prints every value. Telling those apart in a shell string is
// guesswork, and a guard that is wrong occasionally is one people learn to work around. So every
// route is refused and the message names the door instead.
//
// A COMMAND THAT ONLY WRITES PROSE ABOUT THE SEAT IS REFUSED TOO, and that is not a bug. This guard
// reads the whole command string, so a heredoc whose body quotes the path looks exactly like a read.
// Narrowing it would re-open a guard written because five live credentials reached a transcript. The
// refusal names the way through instead — put the text in a script file and run the file.
//
// PORTED FROM `hooks/scripts/env-seat.py`. Same spellings, same three tool families, same words.

import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

const SEAT = ".spnenv";

const DOOR =
  "Use the keys-only door: `spnutils workspace status` reports which keys this machine has and " +
  "whether each is set, and never a value. To test one key, test presence without expanding it " +
  "— `if [[ -n ${(P)k} ]]` — never printing the expansion. If the developer asked for one " +
  "specific value by name, ask them to read it themselves.";

const WHY =
  "A transcript outlives the session that wrote it. A printed credential is exposed from that " +
  "moment and rotation is the only repair — this has already happened here twice.";

// A14. This guard reads the whole command string, so a command that merely QUOTES the path is
// refused exactly like one that reads the file. That is deliberate — telling a pipeline's halves
// apart in a shell string is guesswork, and a guard that is wrong occasionally is one people learn
// to work around. What was missing was saying so: the refusal now names the way through, because
// this cost two sessions a minute each before anybody wrote it down.
const WRITING =
  "If you are only WRITING a document that quotes this path — a heredoc body, an editing script " +
  "— that is refused too, because the guard reads the whole command and cannot tell your prose " +
  "from a read. Put the text in a script file and run the file: the path is then in the file " +
  "rather than in the command line.";

// A token naming the seat, however it is spelled: ~/.spnenv, $HOME/.spnenv, ${HOME}/.spnenv,
// /Users/someone/.spnenv, and each of those inside single or double quotes.
const TOKEN = /(?:~|\$HOME|\$\{HOME\}|\/[^\s'"]*)\/\.spnenv\b/;
const WORD = /[^\s'"|;&<>()]+/g;

/** Every real path that IS the seat on this machine. */
function seatPaths(): Set<string> {
  const home = process.env.HOME || homedir();
  const plain = join(home, SEAT);
  const out = new Set([plain]);
  try { out.add(realpathSync(plain)); } catch { /* the seat need not exist for the guard to hold */ }
  return out;
}

/** Expand a tilde and the HOME forms the way a shell would, before the path is resolved. */
function expand(text: string): string {
  const home = process.env.HOME || homedir();
  return text
    .replace(/^~(?=\/|$)/, home)
    .replace(/\$\{HOME\}/g, home)
    .replace(/\$HOME/g, home);
}

/** Does this string reach the machine seat, by any spelling it is written in. */
export function namesTheSeat(text: string): boolean {
  if (!text) return false;
  if (TOKEN.test(text)) return true;
  // An absolute or expanded path that resolves to the seat, including a symlink to it.
  const seats = seatPaths();
  for (const candidate of text.match(WORD) ?? []) {
    const cleaned = candidate.replace(/^['"]+|['"]+$/g, "");
    if (!cleaned.endsWith(SEAT)) continue;
    const expanded = expand(cleaned);
    if (seats.has(expanded)) return true;
    try { if (seats.has(realpathSync(expanded))) return true; } catch { continue; }
  }
  return false;
}

export function checkEnvSeat(payload: Payload): Verdict {
  const tool = payload.tool_name ?? "";
  const supplied = payload.tool_input ?? {};

  if (tool === "Read" || tool === "NotebookRead") {
    if (namesTheSeat(String(supplied.file_path ?? "")))
      return { deny: `Denied: reading ~/.spnenv puts every value in it into this transcript. ${WHY} ${DOOR}` };
    return null;
  }

  if (tool === "Grep" || tool === "Glob") {
    for (const field of ["path", "pattern", "glob"] as const)
      if (namesTheSeat(String(supplied[field] ?? "")))
        return { deny: `Denied: searching ~/.spnenv prints the lines it matches, values and all. ${WHY} ${DOOR}` };
    return null;
  }

  if (tool === "Bash") {
    if (namesTheSeat(String(supplied.command ?? "")))
      return {
        deny:
          `Denied: this command renders ~/.spnenv, and its output lands in the transcript. ` +
          `${WHY} ${DOOR} ` +
          `You may still WRITE the file and read it inside a tool's own process — what is ` +
          `refused is putting a region of it on screen. ${WRITING}`,
      };
    return null;
  }

  return null;
}

if (runAlone("env-seat.ts")) {
  try { emit(checkEnvSeat(readPayload())); } catch { /* a guard never takes the chain down */ }
  process.exit(0);
}
