// `design-wording` [MKT.HOOKS.144] - a design-system document that makes a prop's use a rule is noted. Each case runs the check's own entry with a PreToolUse event on stdin, the way the hook does.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const ENTRY = resolve(PLUGIN, "src", "scripts", "checks", "design-wording.ts");
const ROOT = "/opt/work/saasplane/code/spn-claude-marketplace/packages";

function once(event) {
  try {
    return execFileSync("node", [ENTRY], { input: JSON.stringify(event), encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }).trim();
  } catch (error) { return `${String(error.stdout ?? "")}${String(error.stderr ?? "")}`.trim(); }
}

let total = 0, failed = 0;

function one(label, { path, content, expect, says = [] }) {
  total += 1;
  const out = once({ tool_name: "Write", tool_input: { file_path: path, content }, cwd: "/opt/work/saasplane/code" });
  let kind = "", text = "";
  try {
    const specific = JSON.parse(out).hookSpecificOutput ?? {};
    if (specific.permissionDecision === "deny") { kind = "deny"; text = specific.permissionDecisionReason; }
    else if (specific.additionalContext) { kind = "note"; text = specific.additionalContext; }
  } catch { if (out) { kind = `UNPARSEABLE: ${out.slice(0, 120)}`; text = out; } }
  const ok = kind === expect && says.every((s) => text.includes(s));
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect || "silent"} - got ${kind || "silent"}`);
  if (!ok) console.log(`        said: ${text.slice(0, 300)}`);
}

const DOC = `${ROOT}/docs/design-system/button.md`;
console.log("=== design-wording - noted");
one("[MKT.HOOKS.144] a MUST on a prop's use", { path: DOC, expect: "note",
  content: "The `endNode` prop MUST be used only with a trailing icon.\n", says: ["how endNode is used a MUST"] });
one("[MKT.HOOKS.144] a never value on a prop", { path: DOC, expect: "note",
  content: "Never pass the `size` prop on a button inside a toolbar.\n", says: ["a never value"] });
one("[MKT.HOOKS.144] a refusal on a prop", { path: DOC, expect: "note",
  content: "The check refuses a write that sets the `variant` prop by hand.\n", says: ["a refusal"] });
one("[MKT.HOOKS.144] the note names the corrected form", { path: DOC, expect: "note",
  content: "The `endNode` prop MUST be used only with a trailing icon.\n", says: ["Write it as guidance with cases instead"] });

console.log("\n=== design-wording - silent");
one("[MKT.HOOKS.144] guidance with cases", { path: DOC, expect: "",
  content: "The `endNode` prop usually carries an icon. When the row is a link, a chevron reads better.\n" });
one("[MKT.HOOKS.144] a MUST that is not about a prop's use", { path: DOC, expect: "",
  content: "A page MUST name who the app is for.\n" });
one("[MKT.HOOKS.144] a file that is not a design-system document", { path: "/tmp/notes.md", expect: "",
  content: "The `endNode` prop MUST be used only with a trailing icon.\n" });

console.log(failed ? `\n  ${failed} of ${total} FAILED - design-wording` : `\n  all ${total} passed - design-wording`);
process.exit(failed ? 1 : 0);
