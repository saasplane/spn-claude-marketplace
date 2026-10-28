// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md § `.debug/` holds
// four containers. The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//     spn-devex debug window show <session|this> [--json]
//     spn-devex debug window sweep
//
// `this` is the window whose start file, written before the call runs, reads as this very command.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { sessionDir, sweepSessions } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";

export const describe = "the notes one window keeps in its folder, and the sweep of the windows nobody has written to for 14 days";

function rootOf(): string {
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  return root;
}

/** The window whose command is this invocation: the newest start file, under any window's `pending/`, that reads as `debug window show this`. */
function windowRunning(root: string): string {
  const sessions = dirname(sessionDir(root, "-"));
  let best: { session: string; at: number } | null = null;
  try {
    for (const session of readdirSync(sessions)) {
      const pending = join(sessions, session, "pending");
      if (!existsSync(pending)) continue;
      for (const name of readdirSync(pending)) {
        try {
          const file = join(pending, name);
          const started = JSON.parse(readFileSync(file, "utf8")) as { found?: Array<Record<string, unknown>> };
          const mine = (started.found ?? []).some((one) => one.script === "spn-devex" && one.group === "debug" && one.subgroup === "window"
            && one.action === "show" && typeof one.args === "string" && one.args.split(/\s+/).includes("this"));
          const at = statSync(file).mtimeMs;
          if (mine && (!best || at > best.at)) best = { session, at };
        } catch { /* a start file that does not read is not this one */ }
      }
    }
  } catch { /* no sessions folder */ }
  if (!best) throw new UsageFault("finds no window that is running this command. Name the window: `debug window show <session>`.");
  return best.session;
}

type Note = { name: string; bytes: number; content: unknown };

/** Every file under the folder, by its path from it. */
function notesOf(folder: string): Note[] {
  const notes: Note[] = [];
  const walk = (path: string): void => {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) { walk(child); continue; }
      const raw = readFileSync(child, "utf8");
      let content: unknown = raw;
      if (entry.name.endsWith(".json")) { try { content = JSON.parse(raw); } catch { content = raw; } }
      notes.push({ name: relative(folder, child), bytes: Buffer.byteLength(raw), content });
    }
  };
  walk(folder);
  return notes;
}

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length !== 1) throw new UsageFault("takes one window: a session id, or `this`.");
  const root = rootOf();
  const session = words.paths[0] === "this" ? windowRunning(root) : words.paths[0];
  const folder = sessionDir(root, session);
  if (!existsSync(folder)) { console.error(`no folder for window \`${session}\``); return 1; }
  const notes = notesOf(folder);
  if (words.given("json")) { console.log(JSON.stringify({ session, notes }, null, 2)); return 0; }
  console.log(`window ${session} — ${notes.length} note(s)`);
  for (const note of notes) {
    const said = typeof note.content === "string" ? note.content.trim() : JSON.stringify(note.content);
    console.log(`\n${note.name} (${note.bytes} bytes)\n  ${said.length > 400 ? `${said.slice(0, 400)}…` : said}`);
  }
  return 0;
}

function sweep(args: string[]): number {
  const words = readWords(args);
  if (words.paths.length) throw new UsageFault("takes nothing after it.");
  const removed = sweepSessions(rootOf());
  console.log(removed.length ? removed.map((id) => `removed ${id}`).join("\n") : "nothing to remove");
  return 0;
}

export const actions: Record<string, Action> = {
  show: { describe: "the notes one window keeps in its folder", usage: "<session|this> [--json]", run: show },
  sweep: { describe: "remove the window folders idle past 14 days", usage: "", run: sweep },
};
