import { PLUGIN } from "../../../../helpers/harness.mjs";
// `docs id next <AREA.DOMAIN>` — the next free number of an id's place. `RULE` and `DEC` share one
// number line for each area and domain, so the number is one past the highest of either kind, read
// from the register and every chapter of the repository (the book by default). A place no id carries
// is refused, because a new place is the developer's call and never a guess.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { POCKET, SEAT } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-id-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let n = 0, failed = 0;
const one = (label, ok) => {
  n += 1;
  if (!ok) { failed += 1; console.log(`  FAIL  ${label}`); }
};

const mk = (root, path, body) => {
  const at = join(root, path);
  mkdirSync(dirname(at), { recursive: true });
  writeFileSync(at, body);
};

/** What one run printed, and its exit code. */
function next(workspace, ...words) {
  try { return { code: 0, out: execFileSync(process.execPath, [TOOL, "docs", "id", "next", ...words], { encoding: "utf8", stdio: "pipe", cwd: workspace, env: { ...process.env, SPN_WORKSPACE: workspace } }) }; }
  catch (e) { return { code: e.status, out: String(e.stdout ?? "") + String(e.stderr ?? "") }; }
}

const workspace = join(BASE, "ws");
const book = join(workspace, "spn-foundation");
mk(book, "sprepo.json", '{"type":"FOUNDATION","name":"spn-foundation","config":null}');
mk(book, `docs/${SEAT.constructs}/rules.md`,
  "# Rules\n\nA page MUST choose by size (rule RULE.SUPPORT.SURFACE.040).\n\nA rail follows the shell (rule RULE.SUPPORT.SURFACE.021).\n\n" +
  "A run proves each claim (rule RULE.SUPPORT.APPS.133).\n");
mk(book, `docs/${POCKET.registers}/decisions.md`,
  "# Decisions\n\n## SUPPORT.SURFACE\n\n| # | Decision | Why | Date |\n| --- | --- | --- | --- |\n" +
  "| DEC.SUPPORT.SURFACE.021 | A rail follows the shell (RULE.SUPPORT.SURFACE.021). | Weighed. | 2026-10 |\n" +
  "| DEC.SUPPORT.APPS.140 | A choice of its own. | Weighed. | 2026-10 |\n");

const pastRule = next(workspace, "SUPPORT.SURFACE");
one("the number is one past the highest RULE of the place, and both kinds are printed",
  pastRule.code === 0 && pastRule.out === "RULE.SUPPORT.SURFACE.041\nDEC.SUPPORT.SURFACE.041\n");

const pastDecision = next(workspace, "SUPPORT.APPS");
one("the number is one past the highest DEC of the place when a row holds it",
  pastDecision.code === 0 && pastDecision.out === "RULE.SUPPORT.APPS.141\nDEC.SUPPORT.APPS.141\n");

const refused = next(workspace, "SUPPORT.NOWHERE");
one("a place no id carries is refused, and the refusal names the place",
  refused.code === 2 && refused.out.includes("SUPPORT.NOWHERE") && !refused.out.includes("RULE.SUPPORT.NOWHERE.001"));
one("a path that is no place is refused", next(workspace, "support").code === 2);
one("a missing place is refused", next(workspace).code === 2);

// A repository's own rules: the token is the repository's folder name, and the repository is named.
const marketplace = join(workspace, "spn-claude-marketplace");
mk(marketplace, "sprepo.json", '{"type":"GENERAL","name":"m","config":null}');
mk(marketplace, `docs/${SEAT.constructs}/a.md`, "# A\n\nA hook MUST refuse (rule RULE.MARKETPLACE.DEVEX.002).\n");
const own = next(workspace, "MARKETPLACE.DEVEX", marketplace);
one("a named repository is read instead of the book",
  own.code === 0 && own.out === "RULE.MARKETPLACE.DEVEX.003\nDEC.MARKETPLACE.DEVEX.003\n");
one("and the book is not read for it", next(workspace, "MARKETPLACE.DEVEX").code === 2);

console.log(failed ? `${failed} of ${n} failed` : `all ${n} passed — docs id`);
process.exit(failed ? 1 : 0);
