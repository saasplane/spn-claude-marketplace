// `design-guidance` — a MUST on how a prop is used is noted; guidance with cases is silent. Each case runs the
// dispatcher's own entry with a PreToolUse event on stdin, the way the hook does.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const ENTRY = resolve(PLUGIN, "src", "scripts", "events", "pretooluse.ts");
const REF = "/opt/work/saasplane/code/spn-claude-marketplace/packages/plugin-spn-surface/src/refs/support/design-system.md";

function once(event) {
  try {
    return execFileSync("node", [ENTRY], { input: JSON.stringify(event), encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }).trim();
  } catch (error) { return `${String(error.stdout ?? "")}${String(error.stderr ?? "")}`.trim(); }
}

let total = 0, failed = 0;

function one(label, { path = REF, content, expect, says = [] }) {
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
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect || "silent"} · got ${kind || "silent"}`);
  if (!ok) console.log(`        said: ${text.slice(0, 300)}`);
}

console.log("=== design-guidance — noted [MKT.HOOKS.143]");
one("[MKT.HOOKS.143] a MUST on a prop's use", { expect: "note",
  content: "The `endNode` prop MUST be used only with a trailing icon.\n",
  says: ["This makes how endNode is used a MUST", "guidance, with cases"] });
one("[MKT.HOOKS.143] a never on a prop's use", { expect: "note",
  content: "Never pass the `size` prop on a DSButton inside a toolbar.\n", says: ["how size is used a never"] });
one("[MKT.HOOKS.143] a refusal in a check source", {
  path: "/opt/work/saasplane/code/spn-claude-marketplace/packages/plugin-spn-surface/src/scripts/checks/x.ts", expect: "note",
  content: "// The check refuses a write that sets the `variant` prop by hand.\n", says: ["variant"] });

console.log("\n=== design-guidance — silent");
one("[MKT.HOOKS.143] guidance with cases", { expect: "",
  content: "The `endNode` prop usually carries an icon. When the row is a link, a chevron reads better; in a toolbar, leave it empty.\n" });
one("[MKT.HOOKS.143] a MUST that is not about a prop's use", { expect: "",
  content: "A page MUST name who the app is for.\n" });
one("[MKT.HOOKS.143] a file the check does not read", { path: "/tmp/notes.md", expect: "",
  content: "The `endNode` prop MUST be used only with a trailing icon.\n" });

console.log(failed ? `\n  ${failed} of ${total} FAILED — design-guidance` : `\n  all ${total} passed — design-guidance`);
process.exit(failed ? 1 : 0);
