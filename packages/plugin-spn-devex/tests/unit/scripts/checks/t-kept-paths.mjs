// `checks/kept-paths.ts` (MKT.HOOKS.381) — a Write or Edit to a closed workstream, a plugin cache, the tool's home
// folder, a settings allow rule with a path wildcard or a new generated block kind is refused, and the refusal
// names the corrected form. Every refusal case is an act the developer corrected, and no check read it before.
import { join } from "node:path";
import { homedir } from "node:os";
import { CHECKS } from "../../../helpers/harness.mjs";

const { applies, checkKeptPaths } = await import(join(CHECKS, "kept-paths.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  [MKT.HOOKS.381] ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  [MKT.HOOKS.381] ${label}${detail ? `\n        ${String(detail).slice(0, 400)}` : ""}`);
};

const WS = "/opt/work/saasplane/code";
const HOME = process.env.HOME || homedir();
const write = (file_path, content = "x") => ({ tool_name: "Write", cwd: WS, tool_input: { file_path, content } });
const edit = (file_path, new_string, old_string = "a") => ({ tool_name: "Edit", cwd: WS, tool_input: { file_path, old_string, new_string } });
const kind = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");

console.log("=== writes it refuses, each naming the corrected form");
{
  const closed = checkKeptPaths(write(`${WS}/.spndevex/workstreams/closed/008-history/approach.html`));
  ok("a write into a closed workstream is refused, naming an open workstream", kind(closed) === "deny" && closed.deny.includes("open workstream"), JSON.stringify(closed));
  const cache = checkKeptPaths(write(`${WS}/.spndevex/cache/plugin-x/index.json`));
  ok("a plugin cache in the workspace folder is refused, naming the machine store", kind(cache) === "deny" && cache.deny.includes("machine store"), JSON.stringify(cache));
  const plugins = checkKeptPaths(write(`${HOME}/.claude/plugins/cache/spn/x.json`));
  ok("a write under the tool's plugins folder is refused, naming agent-sync", kind(plugins) === "deny" && plugins.deny.includes("agent-sync"), JSON.stringify(plugins));
  const homeFile = checkKeptPaths(edit(`${HOME}/.claude/settings.json`, "{}"));
  ok("an edit in the tool's home folder is refused, naming spnutils", kind(homeFile) === "deny" && homeFile.deny.includes("spnutils"), JSON.stringify(homeFile));
  const allow = checkKeptPaths(edit(`${WS}/spn-x/.claude/settings.local.json`, '"Edit(/opt/work/**)",'));
  ok("a path wildcard written into settings is refused, naming agent-sync", kind(allow) === "deny" && allow.deny.includes("agent-sync"), JSON.stringify(allow));
  const bashAllow = checkKeptPaths(write(`${WS}/spn-x/.claude/settings.json`, '{"permissions":{"allow":["Bash(/opt/bin/*)"]}}'));
  ok("a Bash rule with a path wildcard is refused", kind(bashAllow) === "deny", JSON.stringify(bashAllow));
  const kindRefused = checkKeptPaths(write(`${WS}/spn-foundation/docs/a.md`, "<!-- spn:generated tallies -->\nx\n<!-- /spn:generated -->"));
  ok("a new generated block kind is refused, naming the developer's approval", kind(kindRefused) === "deny" && kindRefused.deny.includes("approval"), JSON.stringify(kindRefused));
}

console.log("\n=== writes it lets through");
{
  ok("a write into an open workstream passes", kind(checkKeptPaths(write(`${WS}/.spndevex/workstreams/open/036-x/notes/N001/plan.md`))) === "silent");
  ok("the agent's memory folder under projects passes", kind(checkKeptPaths(write(`${HOME}/.claude/projects/-opt-work/memory/a.md`))) === "silent");
  ok("a settings edit without a path wildcard passes", kind(checkKeptPaths(edit(`${WS}/spn-x/.claude/settings.local.json`, '"Bash(git status:*)",'))) === "silent");
  ok("a known generated block kind passes", kind(checkKeptPaths(write(`${WS}/a.md`, "<!-- spn:generated progress -->\nx\n<!-- /spn:generated -->"))) === "silent");
  ok("an ordinary source file passes", kind(checkKeptPaths(write(`${WS}/spn-x/src/a.ts`))) === "silent");
  ok("a call that is not a write is not read", kind(checkKeptPaths({ tool_name: "Read", tool_input: { file_path: `${WS}/.spndevex/workstreams/closed/x.md` } })) === "silent");
  ok("an ordinary source path does not apply", applies(`${WS}/spn-x/src/a.ts`) === false);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — kept paths` : `\n  all ${total} passed — kept paths`);
process.exit(failed ? 1 : 0);
