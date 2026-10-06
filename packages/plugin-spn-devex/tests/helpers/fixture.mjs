// A throwaway workspace on disk, so a gate can be run against a state this workspace is not in.
// Built fresh per run in a temporary folder, never inside a real workspace — the real workstreams
// stay untouched, and no run depends on another run's leftovers.
import { mkdirSync, mkdtempSync, readdirSync, realpathSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bindNamed, recordWrites } from "../../src/scripts/lib/window.ts";

export const BASE = realpathSync(mkdtempSync(join(tmpdir(), "spn-devex-fixtures-")));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

/**
 * @param name      folder under fixtures/
 * @param files     { "relative/path": "contents" } — folders are created as needed
 * @param folders   extra empty folders to create
 */
export function workspace(name, files = {}, folders = []) {
  const root = join(BASE, name);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(join(root, ".spndevex"), { recursive: true });
  for (const dir of folders) mkdirSync(join(root, dir), { recursive: true });
  for (const [path, body] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, body, "utf8");
  }
  return root;
}

export function clean() { rmSync(BASE, { recursive: true, force: true }); }

/**
 * Bind a session to every workstream that is open in a fixture, the way a window that wrote into each of
 * them is bound (RD.DEVEX.WORKSPACE.236). A hook now speaks only of the workstreams its window works on,
 * so a case about what a check says must first say whose window it is.
 */
export function bindOpen(root, session) {
  let names = [];
  try { names = readdirSync(join(root, ".spndevex", "workstreams", "open")); } catch { /* none open */ }
  for (const name of names) bindNamed(root, session, name, "prompt");
}

/**
 * Record that a session wrote every arc in a fixture, the way PreToolUse records an `Edit` of each one.
 * A case that changes an arc by hand between two Stops calls this to say whose write it was.
 */
export function wroteArcs(root, session) {
  const open = join(root, ".spndevex", "workstreams", "open");
  const paths = [];
  try {
    for (const name of readdirSync(open))
      try { for (const file of readdirSync(join(open, name, "arcs"))) paths.push(join(open, name, "arcs", file)); } catch { /* no arcs */ }
  } catch { /* none open */ }
  recordWrites(root, session, root, paths);
}
