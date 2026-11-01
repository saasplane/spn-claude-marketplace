// `story-order` [MKT.HOOKS.145] - a unit whose Playground is not last or not in the storySort order is noted. Each case runs the check's own entry with a PreToolUse event on stdin, the way the hook does.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const ENTRY = resolve(PLUGIN, "src", "scripts", "checks", "story-order.ts");
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

const STORIES = `${ROOT}/web/src/button.stories.tsx`;
const PREVIEW = `${ROOT}/web/.storybook/preview.ts`;
console.log("=== story-order - noted");
one("[MKT.HOOKS.145] a Playground before another story", { path: STORIES, expect: "note",
  content: "export const Default = {};\nexport const Playground = {};\nexport const Disabled = {};\n",
  says: ["Playground is not the last story", "move the Playground export to the end"] });
one("[MKT.HOOKS.145] a storySort order without Playground", { path: PREVIEW, expect: "note",
  content: "export default { parameters: { options: { storySort: { order: ['Intro', 'Button'] } } } };\n",
  says: ["does not name Playground", "add \"Playground\""] });

console.log("\n=== story-order - silent");
one("[MKT.HOOKS.145] Playground last", { path: STORIES, expect: "",
  content: "export const Default = {};\nexport const Disabled = {};\nexport const Playground = {};\n" });
one("[MKT.HOOKS.145] a storySort order that names Playground", { path: PREVIEW, expect: "",
  content: "export default { parameters: { options: { storySort: { order: ['Intro', 'Button', 'Playground'] } } } };\n" });
one("[MKT.HOOKS.145] a file the check does not read", { path: "/tmp/x.ts", expect: "",
  content: "export const Playground = {};\nexport const Default = {};\n" });

console.log(failed ? `\n  ${failed} of ${total} FAILED - story-order` : `\n  all ${total} passed - story-order`);
process.exit(failed ? 1 : 0);
