// `unit-read` — the advice beside a Read of a unit's own file. Each case runs the dispatcher's own
// entry with a PreToolUse event on stdin, the way the hook does, and reads what it prints.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const ENTRY = resolve(PLUGIN, "src", "scripts", "events", "pretooluse.ts");
const HOOKS = resolve(PLUGIN, "src", "hooks", "hooks.json");
const ROOT = "/opt/work/saasplane/code";

function once(event) {
  try {
    return execFileSync("node", [ENTRY], { input: JSON.stringify(event), encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }).trim();
  } catch (error) { return `${String(error.stdout ?? "")}${String(error.stderr ?? "")}`.trim(); }
}

let total = 0, failed = 0;

/** `expect` is "note" or "" (silent); `says` lists exact text the note must hold. */
function one(label, { tool = "Read", path, expect, says = [] }) {
  total += 1;
  const out = once({ tool_name: tool, tool_input: path === undefined ? {} : { file_path: path }, cwd: ROOT });
  let kind = "", text = "";
  try {
    const parsed = JSON.parse(out);
    const specific = parsed.hookSpecificOutput ?? {};
    if (specific.permissionDecision === "deny") { kind = "deny"; text = specific.permissionDecisionReason; }
    else if (specific.additionalContext) { kind = "note"; text = specific.additionalContext; }
  } catch { if (out) { kind = `UNPARSEABLE: ${out.slice(0, 120)}`; text = out; } }
  const ok = kind === expect && says.every((sentence) => text.includes(sentence));
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect || "silent"} · got ${kind || "silent"}`);
  if (!ok) console.log(`        said: ${text.slice(0, 400)}`);
}

console.log("=== unit-read — a Read of a unit's own file is advised to run unit show first");
one("a module's step, from the workspace root", {
  path: `${ROOT}/spn-platform-ts/packages/module-web-iam-ts/src/entry/ui/components/auth/ForgotPasswordStep.tsx`, expect: "note",
  says: ["`ForgotPasswordStep` is a unit", "Run `spn-surface unit show ForgotPasswordStep` first", "Read the source only for what that leaves out"] });
one("a module's badge", {
  path: `${ROOT}/spn-platform-ts/packages/module-web-iam-ts/src/entry/ui/components/security/IdentityFactorVerificationBadge.tsx`, expect: "note",
  says: ["`spn-surface unit show IdentityFactorVerificationBadge`"] });
one("a module's entry", {
  path: `${ROOT}/spn-platform-ts/packages/module-web-doc-ts/src/entry/ui/components/files/DocFileUploadEntry.tsx`, expect: "note",
  says: ["`spn-surface unit show DocFileUploadEntry`"] });
one("a module's container", {
  path: `${ROOT}/spn-platform-ts/packages/module-web-iam-ts/src/entry/ui/containers/RoleListContainer.tsx`, expect: "note",
  says: ["`spn-surface unit show RoleListContainer`"] });
one("a design-system component", {
  path: `${ROOT}/spn-support-ts/packages/support-web-ds-ts/src/ui/components/composites/DSListDetail.tsx`, expect: "note",
  says: ["`spn-surface unit show DSListDetail`"] });
one("a relative path, as a window inside a repository gives it", {
  path: "packages/module-web-iam-ts/src/entry/ui/components/auth/ForgotPasswordStep.tsx", expect: "note" });

console.log("\n=== unit-read — every other call is left alone");
one("a unit's test", { path: `${ROOT}/spn-platform-ts/packages/module-web-iam-ts/src/entry/ui/components/auth/ForgotPasswordStep.test.tsx`, expect: "" });
one("a unit's story", { path: `${ROOT}/spn-support-ts/packages/support-web-ds-ts/src/ui/components/data-display/DSBadge.stories.tsx`, expect: "" });
one("a .tsx outside a unit's folder", { path: `${ROOT}/spn-platform-ts/apps/web-dmo/src/entry/routes/SignIn.tsx`, expect: "" });
one("a hook file in a unit's folder, not named for a unit", { path: `${ROOT}/spn-platform-ts/packages/module-web-iam-ts/src/entry/ui/components/auth/useResetFlow.tsx`, expect: "" });
one("a .ts beside the units", { path: `${ROOT}/spn-platform-ts/packages/module-web-iam-ts/src/entry/ui/components/auth/labels.ts`, expect: "" });
one("a search, whatever its words", { tool: "Grep", path: `${ROOT}/spn-platform-ts/packages/module-web-iam-ts/src/entry/ui/components/auth/ForgotPasswordStep.tsx`, expect: "" });
one("a Read with no path", { path: undefined, expect: "" });

console.log("\n=== unit-read — the hook is registered for a Read");
{
  total += 1;
  const matcher = JSON.parse(readFileSync(HOOKS, "utf8")).hooks.PreToolUse[0].matcher;
  const ok = matcher.split("|").includes("Read");
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  the PreToolUse matcher names Read\n        matcher ${matcher}`);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — unit-read` : `\n  all ${total} passed — unit-read`);
process.exit(failed ? 1 : 0);
