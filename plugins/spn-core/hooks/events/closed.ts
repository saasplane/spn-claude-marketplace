#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-foundation/01-devex/11-workspace.md § The workstream — closing.
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
// WHAT IT SAYS. What landed, counted from the page's own split plan — not a generic well done. The
// number is the work, and a line that names it is worth reading twice.
//
// PORTED FROM `hooks/scripts/closed.py`, WHICH HAD ALMOST NEVER SPOKEN. The Python took the subject
// from the DESTINATION's basename, so `mv <subject> closed/` — the way a close is actually typed —
// landed on `closed`, a structural name, and it skipped. It spoke only when the destination spelled
// the subject out a second time. Finding F10 in this arc.
//
// The port takes the subject from the SOURCE, which is where the subject has always been, and speaks
// only when that subject resolves to an approach page — so moving a loose file into `closed/` is not
// congratulated as a finished scope.
//
// It reads `split-plan`'s parser, as the Python did, so the count here and the count the close gate
// refused on are the same reading of the same table.

import { basename, resolve } from "node:path";
import { isDir, readPayload, runAlone, workspaceRoot, type Payload } from "../lib/payload.ts";
import { closing, moves, planOf, stateOf, subjectPages } from "../checks/split-plan.ts";
import { begin, end, span } from "../lib/timing.ts";

const STRUCTURE = new Set(["workstreams", "sessions", "arcs", "open", "backlog", "closed", ""]);

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
    // A SCOPE, NOT ANY FILE. Moving a loose note into `closed/` is not a workstream finishing, and
    // congratulating it would make the one moment that speaks mean nothing. A real close has a page:
    // the close gate refuses one without a split plan, so by the time this fires there is one to read.
    if (!pages.length) continue;

    const rows = pages.flatMap(planOf);
    const states = rows.map(stateOf);
    const landed = states.filter((s) => s === "landed").length;
    const carried = states.filter((s) => s === "carried").length;
    const deferred = states.filter((s) => s === "deferred").length;

    const tail = [
      ...(carried ? [`${carried} carried to a named successor`] : []),
      ...(deferred ? [`${deferred} deferred with its trigger`] : []),
    ];
    const rest = tail.length ? `, and ${tail.join(" and ")}` : "";
    // `1 rows landed` is what the Python said, every time a scope closed with one row. This is the
    // line the developer asked for by name, so it reads as somebody wrote it.
    const rowWord = landed === 1 ? "row" : "rows";
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
  begin({ event: "PostToolUse", tool: payload.tool_name ?? null, session: payload.session_id ?? null },
        payload.cwd ?? process.cwd());
  let message: string | null = null;
  try { message = span("closed", () => closingMessage(payload)); } catch { message = null; }
  end();
  if (message) console.log(JSON.stringify({ systemMessage: message }));
  process.exit(0);
}
