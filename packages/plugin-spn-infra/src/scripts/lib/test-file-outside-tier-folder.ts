#!/usr/bin/env node
// RESTATES: `docs/04-capabilities/02-support/02-infra/02-packages/02-tests.md` §
// The folder is the tier, the extension is the engine. That chapter governs; this file states no
// rule of its own.
//
// Refuse a test file sitting in the wrong tier folder, at the moment it is written — the same
// defect `spnutils infra test` refuses at run time, caught here first. `run.sh` is exempt: it is
// the one entry every tier's tree names sitting directly under `tests/`.
import type { Rule } from "./laws/law.ts";
import type { Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";

const TIER_FOLDERS = ["contract", "unit", "integration", "cloud"];
const OTHER_FOLDERS = ["fixtures", "helpers"];
const CASE_LIKE = /\.(sh|test\.mjs|tftest\.hcl)$/;
const DIRECT_CHILD = /\/tests\/([^/]+)$/;
const FOLDER_CHILD = /\/tests\/([^/]+)\/([^/]+)$/;

/** What each tier folder may hold. `cloud/` is left unchecked — reserved, and no package holds a
 * file there yet, so there is no shape here to enforce. */
const ALLOWED: Record<string, (file: string) => boolean> = {
  contract: (file) => file.endsWith(".sh"),
  unit: (file) => file.endsWith(".test.mjs") || file.endsWith(".tftest.hcl"),
  integration: (file) => file.endsWith(".tftest.hcl") || file === "acceptance.sh",
};

export const RULES: Rule[] = [
  {
    name: "test-file-outside-tier-folder",
    applies: (path) => path.includes("/tests/") && CASE_LIKE.test(path),
    run: (path): Verdict => {
      const folderChild = FOLDER_CHILD.exec(path);
      if (!folderChild) {
        const directChild = DIRECT_CHILD.exec(path);
        if (directChild && directChild[1] !== "run.sh") {
          return { deny: `Denied: ${path} sits directly under tests/, with no tier folder. A case belongs in contract/, unit/ or integration/ — see 02-tests.md § The folder is the tier, the extension is the engine.` };
        }
        return null; // run.sh, or deeper than one level (fixtures/<name>/… owns its own shape)
      }
      const [, folder, file] = folderChild;
      if (OTHER_FOLDERS.includes(folder)) return null;
      if (!TIER_FOLDERS.includes(folder)) {
        return { deny: `Denied: tests/${folder}/ is not a tier folder (contract, unit, integration, cloud) or fixtures/helpers — a case there proves no tier.` };
      }
      const allowed = ALLOWED[folder];
      if (allowed && !allowed(file)) {
        return { deny: `Denied: ${file} is the wrong engine for tests/${folder}/ — see 02-tests.md § The folder is the tier, the extension is the engine.` };
      }
      return null;
    },
  },
];

export function validate(path: string, text: string): Verdict {
  for (const rule of RULES) {
    if (!rule.applies(path)) continue;
    const verdict = rule.run(path, text);
    if (verdict) return verdict;
  }
  return null;
}
