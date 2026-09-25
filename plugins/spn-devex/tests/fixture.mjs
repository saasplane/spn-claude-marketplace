// A throwaway workspace on disk, so a gate can be run against a state this workspace is not in.
// Built fresh per test and never inside `/opt/work` — the real workstreams stay untouched.
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

export const BASE = "/private/tmp/claude-501/-opt-work-saasplane-code/ca4d9391-8043-477a-926d-fabfa4253bdf/scratchpad/fixtures";

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
