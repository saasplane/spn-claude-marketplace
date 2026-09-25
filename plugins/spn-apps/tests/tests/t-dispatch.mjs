// The spn-apps-ts dispatcher — every refusal and every warning routed through one process.
//
// THE COMPARISON IS THE CHAIN, NOT A SCRIPT. The incumbent is eight separate hook entries, so the
// expectation is what the eight TOGETHER would have said: the first deny, or every warning.
import { execFileSync } from "node:child_process";
import { tree } from "./harness.mjs";

import { existsSync } from "node:fs";
import { resolve } from "node:path";
const HOOKS = resolve(import.meta.dirname, "..");
const SCRIPTS = resolve(HOOKS, "scripts");
const CHECKS = resolve(HOOKS, "src", "scripts", "checks");
// The entry point a registration names lives in `events/`, beside `spn-devex`'s four. The checks it
// calls stay in `checks/` — this constant is the dispatcher itself, not one of them.
const EVENTS = resolve(HOOKS, "src", "scripts", "events");
const PYTHON_HERE = existsSync(resolve(SCRIPTS, "pretooluse.py"))
  || existsSync(resolve(SCRIPTS, "coverage.py"));

const EIGHT = [
  ["enablement-grammar.py", []], ["host-assertion.py", []],
  ["coverage.py", ["--check", "route-e2e"]], ["coverage.py", ["--check", "spec-restore"]],
  ["coverage.py", ["--check", "foreign-double"]],
  ["read-verb-naming.py", []], ["await-sequencing.py", []], ["assertion-message.py", []],
];

function once(cmd, args, payload, cwd) {
  try { return execFileSync(cmd, args, { input: JSON.stringify(payload), encoding: "utf8", cwd,
    stdio: ["pipe", "pipe", "pipe"] }).trim(); }
  catch (e) { return `${String(e.stdout ?? "")}${String(e.stderr ?? "")}`.trim(); }
}

const decide = (out) => {
  if (!out) return "";
  try {
    const p = JSON.parse(out);
    if (p.hookSpecificOutput?.permissionDecision === "deny") return "deny";
    if (p.systemMessage || p.hookSpecificOutput?.additionalContext) return "note";
    return "";
  } catch { return "UNPARSEABLE"; }
};

/** What the eight Python entries together would have decided. */
function chain(payload, cwd) {
  if (!PYTHON_HERE) return null;                    // the incumbent is gone; the port stands alone
  let notes = 0;
  for (const [script, args] of EIGHT) {
    const d = decide(once("python3", [`${SCRIPTS}/${script}`, ...args, "--stdin"], payload, cwd));
    if (d === "deny") return "deny";
    if (d === "note") notes += 1;
  }
  return notes ? "note" : "";
}

let n = 0, failed = 0;
function one(label, { root, input, expect, says }) {
  n += 1;
  const payload = { tool_name: input.content !== undefined ? "Write" : "Edit", tool_input: input, cwd: root };
  const out = once("node", [`${EVENTS}/pretooluse.ts`], payload, root);
  const ts = decide(out);
  const py = chain(payload, root);
  let reason = "";
  try { const p = JSON.parse(out);
        reason = p.hookSpecificOutput?.permissionDecisionReason ?? p.systemMessage ?? ""; } catch {}
  const saysOk = !says || reason.includes(says);
  const ok = ts === expect && (py === null || ts === py) && saysOk;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect || "silent"} · dispatcher ${ts || "silent"} · eight-script chain ${py === null ? "not installed" : py || "silent"}${says ? ` · names "${says}" ${saysOk}` : ""}`);
  if (!ok) console.log(`        got: ${reason.slice(0, 260)}`);
}

const REPO = { "sprepo.json": '{"world":"APPS","stacks":["spn-apps-ts"]}\n' };
const APP = { "apps/api/spkind.json": '{"kind":"APP_SERVER","config":null}\n' };

console.log("=== dispatcher — each refusal still arrives");

const IFACE = "apps/api/src/contract/services/UserService.ts";
one("read-verb-naming's refusal", {
  root: tree({ ...REPO, ...APP }),
  input: { file_path: IFACE, content: "export interface U {\n  getUsers(): Promise<UserList>;\n}\n" },
  expect: "deny", says: "read verb is named for the list",
});

const SRC = "apps/api/src/app/Loader.ts";
one("await-sequencing's refusal", {
  root: tree({ ...REPO, ...APP }),
  input: { file_path: SRC, content: "export async function l() { return f().then((u) => u.id); }\n" },
  expect: "deny", says: "await is how you sequence work",
});

const SERVICE = "apps/api/src/app/services/IAMOrgService.ts";
one("enablement-grammar's refusal", {
  root: tree({ ...REPO, ...APP }),
  input: { file_path: SERVICE, content: "const a = new Set([OrgType.PLATFORM, OrgType.ACCOUNT]);\n" },
  expect: "deny", says: "[ORG TYPE]",
});

const SPEC = "apps/api/tests/journeys/signin.spec.ts";
one("host-assertion's refusal", {
  root: tree({ ...REPO, ...APP }),
  input: { file_path: SPEC, content: "await page.waitForURL(/example\\.app/);\ntest('x', () => {});\n" },
  expect: "deny", says: "unanchored host pattern",
});

console.log("\n=== dispatcher — warnings accumulate rather than stopping the chain");

const BOTH = "test('it', async () => {\n  await setBooleanEnablement('X', true);\n  await expect(rows).toHaveCount(1);\n});\n";
one("a spec tripping both warning checks at once", {
  root: tree({ ...REPO, ...APP }),
  input: { file_path: SPEC, content: BOTH },
  expect: "note",
});

console.log("\n=== dispatcher — untouched");

one("an ordinary source edit", {
  root: tree({ ...REPO, ...APP, [SRC]: "export const a = 1;\n" }),
  input: { file_path: SRC, old_string: "export const a = 1;", new_string: "export const a = 2;" },
  expect: "",
});

one("a markdown file", {
  root: tree({ ...REPO, ...APP }),
  input: { file_path: "docs/a.md", content: "# a\n" },
  expect: "",
});

one("a payload with no file path", {
  root: tree({ ...REPO, ...APP }),
  input: { command: "ls" },
  expect: "",
});

console.log(failed ? `\n  ${failed} of ${n} FAILED — dispatcher` : `\n  all ${n} passed — dispatcher`);
process.exit(failed ? 1 : 0);
