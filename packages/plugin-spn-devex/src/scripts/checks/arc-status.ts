#!/usr/bin/env node
// RESTATES: spn-foundation RD.DEVEX.WORKSPACE.058 — an arc carries a status, and it is one of a closed set.
// The register row is the source of truth. A rule change is edited there first, then here.
//
// WHAT IT CATCHES. An arc written with a status word nothing can act on, or with none at all.
//
// WHY THAT MATTERS MORE THAN IT SOUNDS. Every check that reads an arc reads this word. `checkRunnable`
// asks whether anybody is executing this arc; `checkHold` asks what it waits for. A word outside the
// set is a state those checks cannot classify, so they skip it in silence — and an arc with no status
// is one no check can see at all.
//
// MEASURED BEFORE IT WAS WRITTEN, over workstream `008` on 2026-09-23. The set existed, declared in an
// HTML comment inside `arc-template.md`, and the corpus had drifted off it: 29 of 57 arcs conformed,
// `PART-LANDED` had been invented and used fifteen times because the declared set had no word for a
// parked half-done arc, and ten arcs carried no status line at all. A rule stated only in a template
// is stated in an output — nothing can restate it, no ref can carry it, no check can read it.
//
// IT ADVISED FIRST AND REFUSES NOW, WHICH IS THE ORDER A NOISY CHECK IS OWED. This workstream has
// recorded an agent renaming a page to satisfy a check that was wrong, so a new check that refuses on
// the day it ships gets obeyed rather than read. This one shipped as a note, and the note said it
// would advise *until the corpus is clean under it*.
//
// NOBODY FLIPPED IT, AND THAT IS THE PART WORTH REMEMBERING. The corpus never became clean, because
// nothing was pushing it to. Measured 2026-09-24: **105 arcs carried a status and 22 used a word
// outside the set** — `OPEN` 8, `CLOSED` 5, `CLOSED IN` 4, `IN FLIGHT` 2, `CLOSING` 2, `PREPARED` 1 —
// including the arc being worked that day. Every one of the 22 already had a word in the set. A soft
// check left soft is a rule nobody is applying.
//
// So the corpus moved first: 3 live arcs and 11 of the 19 closed ones were retrofitted, each read
// rather than substituted, and only then did this become a refusal. The remaining 8 sit in closed
// workstreams, which a write-time check never opens.
//
// AN ARC WITH NO STATUS IS STILL NOT REFUSED. The check returns before it judges when the edit
// carries no status line at all, so a batch-shaped arc whose state has to be read is left alone
// rather than pushed into stamping a word nobody checked.

import { basename } from "node:path";
import { unescape, type Payload, type Verdict } from "../lib/payload.ts";
import { arcPathPattern } from "../lib/docs-tree.ts";

/** The set, in the order the register states it. The last three are terminal. */
export const STATUSES = ["PROPOSED", "DECIDED", "RUNNING", "HELD", "PART-LANDED", "LANDED", "CARRIED", "DROPPED"] as const;
export const TERMINAL = new Set(["LANDED", "CARRIED", "DROPPED"]);

// Both spellings are read, because the corpus has both and a reader that knows one is the fault this
// check exists downstream of. `RD.DEVEX.WORKSPACE.058` names `Status: **WORD` as the one to WRITE.
const STATUS_LINE = /^\*{0,2}Status:?\*{0,2}\s*\*{0,2}\s*([A-Z][A-Z-]*)/m;

/** Only an arc file, which is any `.md` directly under a workstream's `arcs/`. */
export function applies(path: string, command: string): boolean {
  return arcPathPattern(true).test(path) || arcPathPattern(false).test(command);
}

/** The status an arc's text declares, or null. */
export function statusIn(text: string): string | null {
  const m = STATUS_LINE.exec(text);
  return m ? m[1] : null;
}

export function checkArcStatus(payload: Payload): Verdict {
  const supplied = payload.tool_input ?? {};
  const path = supplied.file_path ?? "";
  const command = supplied.command ?? "";
  if (!applies(path, command)) return null;

  // The FRAGMENT being written, which is all a write-time check ever sees. A status line arriving in
  // an `Edit` is judged; an edit that touches neither the line nor the top of the file says nothing,
  // because a check that scolds about a line the writer did not touch is one people learn to ignore.
  const written = unescape(String(supplied.content ?? supplied.new_string ?? command ?? ""));
  if (!written) return null;
  const declared = statusIn(written);
  if (declared === null) return null;                  // this edit is not about the status line
  if ((STATUSES as readonly string[]).includes(declared)) return null;

  const name = basename(path || "the arc");
  // IT REFUSES NOW, AND IT ADVISED UNTIL THE CORPUS WAS CLEAN UNDER IT (N66). The note at the head
  // of this file said it would advise *until the corpus is clean under it*, and then nobody flipped
  // it — so the word drifted for as long as the check stayed soft. Measured 2026-09-24: 105 arcs
  // carried a status and 22 of them used a word outside the set, including the arc that was being
  // worked that day. All 3 live arcs and 11 of the 19 closed ones were retrofitted; the remaining 8
  // sit in closed workstreams, which a write-time check never opens.
  return {
    deny:
      `\`${name}\` declares \`Status: ${declared}\`, which is not one of the eight ` +
      `(RD.DEVEX.WORKSPACE.058): ${STATUSES.join(" · ")}.\n` +
      `Every check that reads an arc reads this word, so one outside the set is a state nothing can ` +
      `act on — \`runnable\` and \`hold\` both skip it in silence rather than reporting it.\n` +
      `${TERMINAL.has(declared) ? "" : "If some steps landed and nobody is on it, that is `PART-LANDED`. "}` +
      `\`HELD\` names its blocker in the same line and \`DROPPED\` names its reason. The set is ` +
      `defined in the workspace capability, § The arc.`,
  };
}

if (process.argv[1]?.endsWith("arc-status.ts")) {
  const { emit, readPayload } = await import("../lib/payload.ts");
  emit(checkArcStatus(readPayload()));
  process.exit(0);
}
