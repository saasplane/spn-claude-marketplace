// `product-name` [MKT.HOOKS.146] - the company and product name misspelled in visible text is refused. Each case runs the check's own entry with a PreToolUse event on stdin, the way the hook does.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const ENTRY = resolve(PLUGIN, "src", "scripts", "checks", "product-name.ts");
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

console.log("=== product-name - refused");
one("[MKT.HOOKS.146] SaasPlane in a docs page", { path: `${ROOT}/docs/intro.md`, expect: "deny",
  content: "Welcome to SaasPlane, the platform.\n", says: ["SaasPlane", "spell the company and product name SaaS Plane"] });
one("[MKT.HOOKS.146] Saas Plane in a web component's text", { path: `${ROOT}/web/src/hero.tsx`, expect: "deny",
  content: "export const Hero = () => <h1>Saas Plane for teams</h1>;\n", says: ["Saas Plane"] });
one("[MKT.HOOKS.146] SPN Demo in a page", { path: `${ROOT}/web/index.html`, expect: "deny",
  content: "<title>SPN Demo</title>\n", says: ["SPN Demo"] });

console.log("\n=== product-name - allowed");
one("[MKT.HOOKS.146] the right spelling", { path: `${ROOT}/docs/intro.md`, expect: "",
  content: "Welcome to SaaS Plane, the platform.\n" });
one("[MKT.HOOKS.146] a wrong spelling inside code, not visible text", { path: `${ROOT}/web/src/id.tsx`, expect: "",
  content: "const SaasPlane = 1;\nexport const X = () => <b>{SaasPlane}</b>;\n" });
one("[MKT.HOOKS.146] a file the check does not read", { path: "/tmp/x.json", expect: "",
  content: "{\"name\": \"SaasPlane\"}\n" });

console.log(failed ? `\n  ${failed} of ${total} FAILED - product-name` : `\n  all ${total} passed - product-name`);
process.exit(failed ? 1 : 0);
