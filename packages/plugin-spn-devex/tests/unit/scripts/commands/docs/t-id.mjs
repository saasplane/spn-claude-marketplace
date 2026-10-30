import { PLUGIN } from "../../../../helpers/harness.mjs";
// `docs id next <AREA.DOMAIN>` — the next free number of an id's place. `RULE` and `DEC` share one
// number line for each area and domain, so the number is one past the highest of either kind, read
// from the register and every chapter of the repository that states the place's rules (the book when
// none does). A place no id carries is refused, because a new place is the developer's call and never
// a guess, and a place another repository states is refused with that repository named.
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
one("[MKT.SCRIPTS.195] the number is one past the highest RULE of the place, and both kinds are printed",
  pastRule.code === 0 && pastRule.out === "RULE.SUPPORT.SURFACE.041\nDEC.SUPPORT.SURFACE.041  read from spn-foundation, which states the rules of SUPPORT.SURFACE\n");

const pastDecision = next(workspace, "SUPPORT.APPS");
one("[MKT.SCRIPTS.195] the number is one past the highest DEC of the place when a row holds it",
  pastDecision.code === 0 && pastDecision.out.startsWith("RULE.SUPPORT.APPS.141\nDEC.SUPPORT.APPS.141  "));

const refused = next(workspace, "SUPPORT.NOWHERE");
one("[MKT.SCRIPTS.196] a place no id carries is refused, and the refusal names the place",
  refused.code === 2 && refused.out.includes("SUPPORT.NOWHERE") && !refused.out.includes("RULE.SUPPORT.NOWHERE.001"));
one("[MKT.SCRIPTS.196] a path that is no place is refused", next(workspace, "support").code === 2);
one("[MKT.SCRIPTS.196] a missing place is refused", next(workspace).code === 2);

// A repository's own rules: the domain it declares, and the repository that states them owns the place.
const marketplace = join(workspace, "spn-claude-marketplace");
mk(marketplace, "sprepo.json", '{"type":"GENERAL","name":"Claude Marketplace","config":null}');
mk(marketplace, `docs/${SEAT.constructs}/a.md`, "# A\n\nA hook MUST refuse (rule RULE.CLAUDE_MARKETPLACE.DEVEX.002).\n");
const own = next(workspace, "CLAUDE_MARKETPLACE.DEVEX", marketplace);
one("[MKT.SCRIPTS.195] a named repository that owns the place is read",
  own.code === 0 && own.out.startsWith("RULE.CLAUDE_MARKETPLACE.DEVEX.003\nDEC.CLAUDE_MARKETPLACE.DEVEX.003  read from spn-claude-marketplace"));
const found = next(workspace, "CLAUDE_MARKETPLACE.DEVEX");
one("[MKT.SCRIPTS.195] with no repository named, the owner is found and read",
  found.code === 0 && found.out.startsWith("RULE.CLAUDE_MARKETPLACE.DEVEX.003\n"));

// The book cites a repository's rule at a higher number than the repository states: the citation never
// moves the repository's number line, and the book is refused the place with its owner named.
const platform = join(workspace, "spn-platform-ts");
mk(platform, "sprepo.json", '{"type":"APPS","name":"Platform","config":null}');
mk(platform, `docs/${SEAT.constructs}/01-iam/a.md`, "# A\n\nA link names the row (rule RULE.PLATFORM.IAM.004).\n");
mk(platform, `docs/${POCKET.registers}/decisions.md`,
  "# Decisions\n\n| # | Decision | Why | Date |\n| --- | --- | --- | --- |\n| DEC.PLATFORM.IAM.006 | A choice. | Weighed. | 2026-10 |\n");
mk(book, `docs/${SEAT.constructs}/cites.md`, "# Cites\n\nThe platform holds it (RULE.PLATFORM.IAM.004, RULE.PLATFORM.IAM.090).\n");
const owned = next(workspace, "PLATFORM.IAM");
one("[MKT.SCRIPTS.195] a place a repository states is answered from that repository, and a citation in the book counts for nothing",
  owned.code === 0 && owned.out === "RULE.PLATFORM.IAM.007\nDEC.PLATFORM.IAM.007  read from spn-platform-ts, which states the rules of PLATFORM.IAM\n");
const refusedBook = next(workspace, "PLATFORM.IAM", book);
one("[MKT.SCRIPTS.196] the book is refused a place another repository states, and the owner is named",
  refusedBook.code === 2 && refusedBook.out.includes("refuses `PLATFORM.IAM` in `spn-foundation`") && refusedBook.out.includes("spn-platform-ts states its rules"));
const worktree = join(BASE, "worktrees", "spn-platform-ts");
mk(worktree, "sprepo.json", '{"type":"APPS","name":"Platform","config":null}');
mk(worktree, `docs/${SEAT.constructs}/01-iam/a.md`, "# A\n\nA link names the row (rule RULE.PLATFORM.IAM.004).\n\nA new one (rule RULE.PLATFORM.IAM.007).\n");
const fromWorktree = next(workspace, "PLATFORM.IAM", worktree);
one("[MKT.SCRIPTS.195] a worktree of the owner answers as the owner, and its own branch is read",
  fromWorktree.code === 0 && fromWorktree.out.startsWith("RULE.PLATFORM.IAM.008\n"));

// Two repositories stating one place is a workspace no number can be given in.
const support = join(workspace, "spn-support-ts");
mk(support, "sprepo.json", '{"type":"APPS","name":"Support","config":null}');
mk(support, `docs/${SEAT.constructs}/a.md`, "# A\n\nA second owner (rule RULE.PLATFORM.IAM.001).\n");
const twice = next(workspace, "PLATFORM.IAM");
one("[MKT.SCRIPTS.196] a place two repositories state is refused, naming both",
  twice.code === 2 && twice.out.includes("spn-platform-ts and spn-support-ts"));

console.log(failed ? `${failed} of ${n} failed` : `all ${n} passed — docs id`);
process.exit(failed ? 1 : 0);
