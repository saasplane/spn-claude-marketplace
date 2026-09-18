#!/usr/bin/env node
// RESTATES: spn-core/refs/workstream-loop.md S3 — execution is confirmed, never assumed.
// The ref is the source of truth. A rule change is edited there first, then here, in the same change.
//
// WHAT IT CATCHES. A session reads an open workstream, understands the plan, and starts editing a
// repository. Nobody said go. The page still reads as a proposal, the developer still thinks they are
// being shown something, and the first they learn otherwise is a diff. The failure is silent on both
// sides: the agent believes the plan is agreement, and the developer believes the plan is a plan.
//
// WHAT A GO LOOKS LIKE, so this can be checked at all. A go is a line in an arc's `## Log`, opening
// with the date and the word `go`:
//
//     - **2026-09-09 — go.** The developer said finish it.
//
// Nothing else counts, because nothing else is written down. A conversation is not a record: the
// window ends and the go ends with it, which is exactly the state this hook exists to make visible.
//
// WHEN IT FIRES. On the first write into a MEMBER REPOSITORY — never on `.spndevex/` itself, because
// writing the plan is how a session earns the go. One workstream open with no go, one warning.
//
// AND IT DOES NOT NAG. A warning repeated on every write is a warning nobody reads, and it would fire
// several times inside one turn. The session is remembered under `.spndevex/.debug/`, the container
// the workspace already keeps for what its machinery says about itself, so a second write is silent.
//
// PORTED FROM `hooks/scripts/confirmed.py`, WHICH HAD NEVER SPOKEN. The Python printed its warning as
// plain text; the dispatcher kept only stdout it could parse as JSON, so every one of its 147 recorded
// fires was discarded. The port returns a verdict rather than printing one, which is why the same
// mistake cannot be made again — there is no round trip to lose it in. Finding F9 in this arc.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import { DEVEX, emit, isDir, listdir, read, readPayload, runAlone, workspaceRoot,
         type Payload, type Verdict } from "./hook.ts";

const DEBUG = ".debug";
const CONFIRMED = "confirmed";

// `- **2026-09-09 — go.` — the date, the dash, then the word. The bold is how every other log line
// in these files opens, so this asks for the shape that is already there rather than a new one.
const GO = /^\s*-\s*\*\*\d{4}-\d{2}-\d{2}\s*[—-]\s*go\b/im;

/** Every folder under `workstreams/open/`, which is the state that means available now. */
function openWorkstreams(root: string): string[] {
  const folder = join(root, DEVEX, "workstreams", "open");
  return listdir(folder).map((name) => join(folder, name)).filter(isDir);
}

/** Whether any arc under this workstream records one. */
function hasGo(workstream: string): boolean {
  const arcs = join(workstream, "arcs");
  return listdir(arcs).some((name) => name.endsWith(".md") && GO.test(read(join(arcs, name))));
}

/**
 * A write into a member repository, rather than into the working state or the workspace floor.
 *
 * `.spndevex/` is deliberately excluded. Writing the plan is how a session earns a go, so a hook
 * that fired on it would refuse the very act that answers it. The workspace's own `.claude/` is
 * excluded for the same reason: wiring the window is not executing the plan.
 */
function isRepoWrite(root: string, path: string): boolean {
  const within = relative(root, resolve(path));
  if (!within || within.startsWith("..") || isAbsolute(within)) return false;
  const head = within.split("/")[0];
  return head !== "" && head !== "." && head !== DEVEX && head !== ".claude";
}

/** One warning per session, remembered where the workspace keeps its own machinery's state. */
function alreadyWarned(root: string, session: string | undefined): boolean {
  if (!session) return false;
  const marker = join(root, DEVEX, DEBUG, CONFIRMED, session);
  try {
    if (existsSync(marker)) return true;
    mkdirSync(join(root, DEVEX, DEBUG, CONFIRMED), { recursive: true });
    writeFileSync(marker, "warned\n", "utf8");
    return false;
  } catch { return false; }
}

/** Warn once when a repository write happens and no open workstream records a go. */
export function checkConfirmed(payload: Payload): Verdict {
  try {
    const written = payload.tool_input?.file_path;
    if (!written) return null;
    const cwd = payload.cwd ?? process.cwd();
    const root = workspaceRoot(cwd);
    if (!root) return null;
    if (!isRepoWrite(root, resolve(cwd, written))) return null;
    const workstreams = openWorkstreams(root);
    if (!workstreams.length) return null;
    // One go covers the window. A developer running two scopes said go to one of them, and warning
    // about the other would be noise on work they are watching.
    if (workstreams.some(hasGo)) return null;
    if (alreadyWarned(root, payload.session_id)) return null;
    const names = workstreams.map((w) => basename(w)).join(" · ");
    return {
      note:
        `This is a repository write and no open workstream records a go — ${names}. ` +
        `Execution is confirmed rather than assumed: show the plan, ask, and write the ` +
        `answer down as a log line in the arc, opening \`- **<date> — go.**\`. A go held only ` +
        `in the conversation ends with the window, and the next session cannot tell a plan ` +
        `from an agreement (refs/workstream-loop.md, S3).`,
    };
  } catch {
    return null;                                    // never fail a gate over a warning
  }
}

if (runAlone("confirmed.ts")) {
  try { emit(checkConfirmed(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
