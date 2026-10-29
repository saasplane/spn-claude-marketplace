// Where a plugin script finds its folder under `~/.saasplane/`, the home spnutils makes.
// A missing folder is told in the one line that names the spnutils command; a hook says nothing.
// The rule is spn-foundation `docs/04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md`.

import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** What a script prints when the home is missing, naming the command that makes it. */
export const MISSING_HOME_LINE = "spn-devex: no ~/.saasplane/ on this machine — run `spnutils workspace init` to make it";

/** What `docs look` prints when the browser profile is missing, naming the command that stands it up. */
export const MISSING_PROFILE_LINE =
  "browser profile  none at ~/.saasplane/state/browser/chrome — `spnutils infra organization up --apply` stands it up; rendered with Playwright's chromium";

/** The home spnutils makes, resolved the way the `spnutils` CLI resolves it (`os.homedir()`). */
export function machineHome(): string {
  return join(homedir(), ".saasplane");
}

/** A folder under the home, by its parts: `roomPath("state", "browser", "chrome")`. Nothing is made. */
export function roomPath(...parts: string[]): string {
  return join(machineHome(), ...parts);
}

function isFolder(path: string): boolean {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

/** Whether spnutils has made the home on this machine. */
export function homeExists(): boolean {
  return isFolder(machineHome());
}

/** The folder under the home, or `null` where it is missing. Nothing is made. */
export function findRoom(...parts: string[]): string | null {
  const path = roomPath(...parts);
  return existsSync(path) && isFolder(path) ? path : null;
}

/** The line a script prints when the home is missing, or `null` when the home is there. */
export function missingHomeLine(): string | null {
  return homeExists() ? null : MISSING_HOME_LINE;
}
