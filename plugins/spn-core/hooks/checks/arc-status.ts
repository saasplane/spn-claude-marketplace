#!/usr/bin/env node
// RESTATES: spn-foundation RD.DEVEX.058 — an arc carries a status, and it is one of a closed set.
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
// IT IS A NOTE, NOT A REFUSAL, AND THAT IS DELIBERATE. This workstream has already recorded an agent
// renaming a page to satisfy a check that was wrong. A new check that refuses on the day it ships gets
// obeyed rather than read, so this one advises until the corpus is clean under it. The eight
// `N5-align-*` arcs carry no status today on purpose: they hold batches rather than steps, so their
// state has to be read, and this check must not push anybody into stamping what nobody read.

import { basename } from "node:path";
import { unescape, type Payload, type Verdict } from "../lib/payload.ts";

/** The set, in the order the register states it. The last three are terminal. */
export const STATUSES = ["PROPOSED", "DECIDED", "RUNNING", "HELD", "PART-LANDED", "LANDED", "CARRIED", "DROPPED"] as const;
export const TERMINAL = new Set(["LANDED", "CARRIED", "DROPPED"]);

// Both spellings are read, because the corpus has both and a reader that knows one is the fault this
// check exists downstream of. `RD.DEVEX.058` names `Status: **WORD` as the one to WRITE.
const STATUS_LINE = /^\*{0,2}Status:?\*{0,2}\s*\*{0,2}\s*([A-Z][A-Z-]*)/m;

/** Only an arc file, which is any `.md` directly under a workstream's `arcs/`. */
export function applies(path: string, command: string): boolean {
  return /\/workstreams\/[^/]+\/[^/]+\/arcs\/[^/]+\.md$/.test(path)
      || /\/workstreams\/[^/]+\/[^/]+\/arcs\/[^/]+\.md/.test(command);
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
  return {
    note:
      `\`${name}\` declares \`Status: ${declared}\`, which is not one of the eight ` +
      `(RD.DEVEX.058): ${STATUSES.join(" · ")}.\n` +
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
