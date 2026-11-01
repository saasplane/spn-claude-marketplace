// `checks/workstream-open.ts` — making a workstream folder is refused when its number is not the next free one or a
// subagent makes it, and a right one is noted as owing the developer's yes. [MKT.HOOKS.385]
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { applies, checkWorkstreamOpen, nextFree } = await import(join(CHECKS, "workstream-open.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const BASE = realpathSync(mkdtempSync(join(tmpdir(), "spn-devex-workstream-open-")));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));
const kind = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");

const root = join(BASE, "ws");
for (const dir of ["open/036-agent-follows-rules", "backlog/040-later", "closed/041-done"]) mkdirSync(join(root, ".spndevex", "workstreams", dir), { recursive: true });
const bash = (command, extra = {}) => ({ tool_name: "Bash", cwd: root, tool_input: { command }, ...extra });
const folder = (state, name) => `${root}/.spndevex/workstreams/${state}/${name}`;

console.log("=== the next free number counts open, backlog and closed");
ok("[MKT.HOOKS.385] the highest number across the three states plus one", nextFree(root) === "042", nextFree(root));

console.log("\n=== a folder with another number is refused");
for (const [state, name] of [["open", "037-reuse"], ["backlog", "041-closed-number"], ["open", "099-skip"], ["open", "no-number"]]) {
  const verdict = checkWorkstreamOpen(bash(`mkdir -p ${folder(state, name)}`));
  ok(`[MKT.HOOKS.385] making ${state}/${name} is refused, naming 042-<subject>`, kind(verdict) === "deny" && verdict.deny.includes("042-<subject>"), JSON.stringify(verdict));
}
ok("[MKT.HOOKS.385] a relative path from the workspace is read the same way", kind(checkWorkstreamOpen(bash("mkdir .spndevex/workstreams/open/050-x"))) === "deny");

console.log("\n=== the right number owes the developer's yes");
{
  const verdict = checkWorkstreamOpen(bash(`mkdir -p ${folder("open", "042-new-subject")}`));
  ok("[MKT.HOOKS.385] the next free number is noted, naming the yes and workstream open", kind(verdict) === "note" && verdict.note.includes("yes") && verdict.note.includes("workstream open"), JSON.stringify(verdict));
  const child = checkWorkstreamOpen(bash(`mkdir -p ${folder("backlog", "042-new-subject")}`, { agent_id: "a1" }));
  ok("[MKT.HOOKS.385] a subagent making it is refused, naming the developer's decision", kind(child) === "deny" && child.deny.includes("developer"), JSON.stringify(child));
}

console.log("\n=== what it leaves alone");
ok("a folder inside a workstream is not a workstream", kind(checkWorkstreamOpen(bash(`mkdir -p ${folder("open", "036-agent-follows-rules")}/notes/N009`))) === "silent");
ok("a closed workstream's folder is not read", kind(checkWorkstreamOpen(bash(`mkdir -p ${folder("closed", "099-x")}`))) === "silent");
ok("a mkdir elsewhere passes", kind(checkWorkstreamOpen(bash("mkdir -p /tmp/a/b"))) === "silent");
ok("a tool that is not Bash is not read", kind(checkWorkstreamOpen({ tool_name: "Write", tool_input: { command: `mkdir ${folder("open", "099-x")}` } })) === "silent");
ok("a command that does not make a folder does not apply", !applies("", "ls .spndevex/workstreams/open") && applies("", "mkdir -p .spndevex/workstreams/open/042-x"));

console.log(`\n${failed ? `${failed} of ${total} FAILED` : `all ${total} passed`}`);
process.exit(failed ? 1 : 0);
