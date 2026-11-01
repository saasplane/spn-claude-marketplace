// `figma-connector` - a `use_figma` script that names a library file or a theme collection with a middle dot
// is refused. Each case runs the dispatcher's own entry with a PreToolUse event on stdin, the way the hook does.
// The refusal cases pass on today's plugin, because the connector check reads no name a script gives.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const ENTRY = resolve(PLUGIN, "src", "scripts", "events", "pretooluse.ts");
let total = 0, failed = 0;

function answer(code) {
  const event = { tool_name: "mcp__figma__use_figma", cwd: process.cwd(),
    tool_input: { fileKey: "abc", code, description: "name the collection", skillNames: "resource:figma-use" } };
  try {
    return execFileSync("node", [ENTRY], { input: JSON.stringify(event), encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, SPN_TELEMETRY: "off" } }).trim();
  } catch (error) { return `${String(error.stdout ?? "")}${String(error.stderr ?? "")}`.trim(); }
}
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const denied = (out) => out.includes('"permissionDecision":"deny"') || out.includes('"permissionDecision": "deny"');

console.log("=== a name with a middle dot");
{
  const created = answer('const c = figma.variables.createVariableCollection("DS 3·Colors"); return c.id;');
  ok("a collection created with a middle dot is refused", denied(created) && created.includes("DS <n>-<Name>"), created);
  const renamed = answer('const collection = figma.variables.getLocalVariableCollections()[0]; collection.name = "DS 3 · Colors"; return collection.name;');
  ok("a collection renamed with a middle dot is refused", denied(renamed), renamed);
}

console.log("\n=== a name with a hyphen");
{
  const created = answer('const c = figma.variables.createVariableCollection("DS 3-Colors"); return c.id;');
  ok("the hyphen form passes", !denied(created), created);
  const quoted = answer('// never write "DS 3·Colors"\nreturn figma.root.name;');
  ok("a middle dot inside a comment passes", !denied(quoted), quoted);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED - figma collection name` : `\n  all ${total} passed - figma collection name`);
process.exit(failed ? 1 : 0);
