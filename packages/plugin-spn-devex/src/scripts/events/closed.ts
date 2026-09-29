#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Retirement is close-or-graduate.
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// What gets said when a workstream closes.
//
// WHY THIS EXISTS. The developer asked for it, in these words: *"we should say some cheer up message
// when workstream is done, make devs happy on small achievements."* A scope that took days ended in a
// silent `mv`, and the only thing that ever spoke at that moment was a refusal.
//
// WHY `PostToolUse`. It is the one honest moment. The close gate runs before the move and speaks only
// to refuse, so congratulating from there would be congratulating something that has not happened and
// might still fail. This fires after the folder has actually moved.
//
// WHAT IT SAYS. What landed, counted from the workstream's own split plan — the step rows of its
// arcs, and the scope tables of a page written in the older shape — not a generic well done. The
// number is the work, and a line that names it is worth reading twice.
//
// PORTED FROM `hooks/scripts/closed.py`, WHICH HAD ALMOST NEVER SPOKEN. The Python took the subject
// from the DESTINATION's basename, so `mv <subject> closed/` — the way a close is actually typed —
// landed on `closed`, a structural name, and it skipped. It spoke only when the destination spelled
// the subject out a second time. Finding F10 in this arc.
//
// The port takes the subject from the SOURCE, which is where the subject has always been, and speaks
// only when that subject resolves to a workstream with a page or a split plan — so moving a loose
// file into `closed/` is not congratulated as a finished scope.
//
// It reads `split-plan`'s parser, as the Python did, so the count here and the count the close gate
// refused on are the same reading of the same table.

import { basename, resolve } from "node:path";
import { isDir, readPayload, runAlone, workspaceRoot, type Payload } from "../lib/payload.ts";
import { ARCS, SESSIONS, WORKSTREAM_STATES, WORKSTREAMS } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { HELD_STATE, closing, moves, stateOf, subjectFolders, subjectPages, workstreamPlan } from "../checks/split-plan.ts";
import { begin, end, span, tagsOf } from "../lib/timing.ts";

const STRUCTURE = new Set<string>([WORKSTREAMS, SESSIONS, ARCS, ...WORKSTREAM_STATES, ""]);

/** The line a close earns, or nothing. */
export function closingMessage(payload: Payload): string | null {
  const command = payload.tool_input?.command ?? "";
  if (!command) return null;
  const cwd = payload.cwd ?? process.cwd();

  for (const [source, rawDestination] of moves(command)) {
    const destination = resolve(cwd, rawDestination);
    if (!closing(destination)) continue;
    const root = workspaceRoot(destination) ?? workspaceRoot(cwd);
    if (!root) continue;
    let subject = basename(source.replace(/\/+$/, ""));
    if (subject.startsWith("arc-") && subject.endsWith(".md"))
      subject = subject.slice("arc-".length, -".md".length);       // the shape `workstreams/` replaces
    if (!subject || STRUCTURE.has(subject)) continue;

    const from = resolve(cwd, source);
    const pages = subjectPages(root, subject, isDir(from) ? from : null);
    const rows = workstreamPlan(subjectFolders(root, subject, isDir(from) ? from : null), pages);
    // A SCOPE, NOT ANY FILE. Moving a loose note into `closed/` is not a workstream finishing, and
    // congratulating it would make the one moment that speaks mean nothing. A real close has a split
    // plan: the close gate refuses one without, so by the time this fires there is one to read.
    if (!pages.length && !rows.length) continue;

    const states = rows.map(stateOf);
    const landed = states.filter((s) => s === "landed").length;
    const carried = states.filter((s) => s === "carried").length;
    const deferred = states.filter((s) => s === "deferred").length;
    // `in progress <time>` is never landed (RD.DEVEX.WORKSPACE.184). The close gate refuses such a
    // row before the move, so one found here was moved past the gate, and the line says so.
    const running = states.filter((s) => s === "in-progress").length;
    // `⏸ held on Q<n>` waits on a card's answer (RD.DEVEX.WORKSPACE.188), and the gate refuses it the
    // same way, so a held row found here was moved past the gate too.
    const held = states.filter((s) => s === HELD_STATE).length;

    const tail = [
      ...(carried ? [`${carried} carried to a named successor`] : []),
      ...(deferred ? [`${deferred} deferred with its trigger`] : []),
    ];
    const rest = tail.length ? `, and ${tail.join(" and ")}` : "";
    // `1 rows landed` is what the Python said, every time a scope closed with one row. This is the
    // line the developer asked for by name, so it reads as somebody wrote it.
    const rowWord = landed === 1 ? "row" : "rows";
    const open = [
      ...(running ? [`${running} ${running === 1 ? "row" : "rows"} still marked in progress`] : []),
      ...(held ? [`${held} ${held === 1 ? "row" : "rows"} held on a card`] : []),
    ];
    if (open.length)
      return `${subject} moved to closed/ with ${open.join(" and ")}, which ${running + held === 1 ? "is" : "are"} ` +
             `not landed. ${landed} ${rowWord} landed${rest}. ` +
             `Land each one or say where it went before calling the scope finished.`;
    return `${subject} is closed. ${landed} ${rowWord} landed${rest} — that is a scope finished, ` +
           `recorded, and findable by whoever comes next. Well done.`;
  }
  return null;
}

if (runAlone("closed.ts")) {
  const payload = readPayload();
  // The whole run under one name, because these events fire a handful of times a session and the
  // breakdown would cost more attention than it buys. `PreToolUse` is the hot path, and it times
  // per check.
  begin({ event: "PostToolUse", tool: payload.tool_name ?? null, session: payload.session_id ?? null, ...tagsOf(payload) },
        payload.cwd ?? process.cwd());
  let message: string | null = null;
  try { message = span("closed", () => closingMessage(payload)); } catch { message = null; }
  end();
  if (message) console.log(JSON.stringify({ systemMessage: message }));
  process.exit(0);
}
