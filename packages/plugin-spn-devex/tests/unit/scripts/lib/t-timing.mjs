// `lib/timing.ts` — each telemetry line says which work it belongs to (RD.DEVEX.WORKSPACE.185):
// `workstream`, `arc` and `order` from the paths the tool call touches, `agent` from the hook input.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LIB } from "../../../helpers/harness.mjs";
import { workspace } from "../../../helpers/fixture.mjs";
import { tagsOf, commandFacts } from "../../../../src/scripts/lib/timing.ts";
import { WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

const WS = `/opt/work/saasplane/code/.spndevex/${WORKSTREAMS}/open/008-plain-language`;
const tags = (workstream, arc, order, agent = null) => ({ workstream, arc, order, agent });

console.log("=== tagsOf — the work a tool call touches");
same("an order file names the workstream, the arc and the order",
  tagsOf({ tool_input: { file_path: `${WS}/notes/N116/orders/M7-order-rules-telemetry-subtitle.md` } }),
  tags("008-plain-language", "N116", "M7-order-rules-telemetry-subtitle"));
same("an arc file names the workstream and the arc",
  tagsOf({ tool_input: { file_path: `${WS}/arcs/N116-r2-the-devex-release.md` } }),
  tags("008-plain-language", "N116", null));
same("an arc's notes name the arc",
  tagsOf({ tool_input: { file_path: `${WS}/notes/N116/plan.md` } }),
  tags("008-plain-language", "N116", null));
same("the approach page names the workstream alone",
  tagsOf({ tool_input: { file_path: `${WS}/plain-language-approach.html` } }),
  tags("008-plain-language", null, null));
same("a command is read for paths too, and the most specific wins",
  tagsOf({ tool_input: { command: `cat ${WS}/plain-language-approach.html '${WS}/arcs/N116-r2.md' && rg x ${WS}/notes/N116/orders/B5-state.md` } }),
  tags("008-plain-language", "N116", "B5-state"));
same("backlog and closed are workstreams too",
  tagsOf({ tool_input: { file_path: `/w/.spndevex/${WORKSTREAMS}/closed/003-cloud-day-0/arcs/N2-x.md` } }),
  tags("003-cloud-day-0", "N2", null));
same("a relative arc path counts when the call runs inside a workstream",
  tagsOf({ cwd: WS, tool_input: { command: "sed -n 1,20p arcs/N116-r2-the-devex-release.md" } }),
  tags("008-plain-language", "N116", null));
same("a relative arc path outside any workstream names nothing",
  tagsOf({ cwd: "/opt/work/saasplane/code/spn-foundation", tool_input: { command: "cat arcs/N116.md" } }),
  tags(null, null, null));
same("a call touching no workstream carries nulls",
  tagsOf({ tool_input: { file_path: "/opt/work/saasplane/code/spn-foundation/docs/README.md" } }),
  tags(null, null, null));
same("the agent comes from the hook input",
  tagsOf({ agent_id: "a238c7be035fb1b2e", tool_input: { file_path: `${WS}/arcs/N116-x.md` } }),
  tags("008-plain-language", "N116", null, "a238c7be035fb1b2e"));
same("an edit's strings are read as well as its path",
  tagsOf({ tool_input: { file_path: "/tmp/x.md", old_string: "a", new_string: `see ${WS}/notes/N116/orders/M7-x.md` } }),
  tags("008-plain-language", "N116", "M7-x"));
same("no payload never throws", tagsOf(undefined), tags(null, null, null));

console.log("\n=== the writer — the tags reach the line");
{
  const root = workspace("m7-timing", { ".spndevex/.debug/telemetry.on": "on\n" });
  const script = `
    import { begin, end, record, tagsOf } from ${JSON.stringify(join(LIB, "timing.ts"))};
    const payload = { session_id: "s1", agent_id: "ag1", tool_input: { file_path: ${JSON.stringify(`${WS}/arcs/N116-x.md`)} } };
    begin({ event: "PreToolUse", tool: "Read", session: payload.session_id, ...tagsOf(payload) }, ${JSON.stringify(root)});
    record("a-check", 1.5);
    end();`;
  const env = { ...process.env };
  delete env.SPN_TELEMETRY;
  execFileSync("node", ["--input-type=module", "-e", script], { env, encoding: "utf8" });
  const lines = readFileSync(join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const first = lines[0];
  same("every line carries the four fields", lines.every((l) => "workstream" in l && "arc" in l && "order" in l && "agent" in l), true);
  same("with the call's work and agent", [first.workstream, first.arc, first.order, first.agent, first.session],
    ["008-plain-language", "N116", null, "ag1", "s1"]);
}


console.log("\n=== 2o — the tags carry forward to a call that touches no workstream path");
{
  const root = workspace("m2o-carry", { ".spndevex/.debug/telemetry.on": "on\n" });
  const env = { ...process.env };
  delete env.SPN_TELEMETRY;
  const ORDER = `${WS}/notes/N122/orders/H-marketplace.md`;
  const call = (payload) => execFileSync("node", ["--input-type=module", "-e", `
    import { begin, end, record, tagsOf } from ${JSON.stringify(join(LIB, "timing.ts"))};
    const payload = ${JSON.stringify(payload)};
    begin({ event: "PreToolUse", tool: "Read", session: payload.session_id, ...tagsOf(payload) }, ${JSON.stringify(root)});
    record("a-check", 1);
    end();`], { env, encoding: "utf8" });
  const repoFile = { file_path: "/opt/work/saasplane/code/spn-claude-marketplace/packages/plugin-spn-devex/src/scripts/lib/timing.ts" };
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: { file_path: ORDER } });
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: repoFile });
  call({ session_id: "s2o", agent_id: "lane-g", tool_input: repoFile });
  call({ session_id: "s2o", tool_input: repoFile });
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: { file_path: `${WS}/notes/N122/spec.md` } });
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: repoFile });
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: { file_path: `${WS}/arcs/N8-the-workstream-closes.md` } });
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: repoFile });
  call({ session_id: "other", agent_id: "lane-h", tool_input: repoFile });
  const rows = readFileSync(join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), "utf8").trim().split("\n")
    .map((l) => JSON.parse(l)).filter((row) => row.script === "a-check").map((row) => [row.workstream, row.arc, row.order]);
  same("2o: a lane's call after reading its order carries the order's workstream, arc and order", rows[1],
    ["008-plain-language", "N122", "H-marketplace"]);
  same("2o: another agent in the same session does not inherit the lane's tags", rows[2], [null, null, null]);
  same("2o: the main window (no agent) does not inherit a lane's tags", rows[3], [null, null, null]);
  same("2o: a call inside the same arc keeps the order it carries", rows[4], ["008-plain-language", "N122", "H-marketplace"]);
  same("2o: and the untagged call after it still carries the order", rows[5], ["008-plain-language", "N122", "H-marketplace"]);
  same("2o: a call that names other work replaces the tags", rows[6], ["008-plain-language", "N8", null]);
  same("2o: and the untagged call after it carries the new work", rows[7], ["008-plain-language", "N8", null]);
  same("2o: another session inherits nothing", rows[8], [null, null, null]);
}
{
  const root = workspace("m2o-off", {});
  const env = { ...process.env };
  delete env.SPN_TELEMETRY;
  execFileSync("node", ["--input-type=module", "-e", `
    import { begin, end, record, tagsOf } from ${JSON.stringify(join(LIB, "timing.ts"))};
    const payload = { session_id: "s", tool_input: { file_path: ${JSON.stringify(`${WS}/arcs/N116-x.md`)} } };
    begin({ event: "PreToolUse", tool: "Read", session: "s", ...tagsOf(payload) }, ${JSON.stringify(root)});
    record("a-check", 1);
    end();`], { env, encoding: "utf8" });
  same("2o: with telemetry off, no tag state is written", existsSync(join(root, ".spndevex", ".debug", "telemetry")), false);
}

console.log("=== commandFacts — a command run through the shell has no hook payload");
{
  const saved = { id: process.env.CLAUDE_CODE_SESSION_ID, old: process.env.CLAUDE_SESSION_ID, cwd: process.cwd() };
  process.env.CLAUDE_CODE_SESSION_ID = "sess-42";
  delete process.env.CLAUDE_SESSION_ID;
  const facts = commandFacts(["audit", `${WS}/notes/N120/orders/B1-marketplace-coverage.md`]);
  same("the session comes from CLAUDE_CODE_SESSION_ID, the variable Claude Code exports", facts.session, "sess-42");
  same("the work comes from the command's own arguments", [facts.workstream, facts.arc, facts.order],
    ["008-plain-language", "N120", "B1-marketplace-coverage"]);
  same("a command's line is marked as one", [facts.event, facts.tool], ["command", null]);
  delete process.env.CLAUDE_CODE_SESSION_ID;
  same("no session exported reads as null, never a guess", commandFacts(["audit", "docs"]).session, null);
  same("a command touching no workstream path carries null tags", commandFacts(["audit", "docs"]).workstream, null);
  if (saved.id !== undefined) process.env.CLAUDE_CODE_SESSION_ID = saved.id;
  if (saved.old !== undefined) process.env.CLAUDE_SESSION_ID = saved.old;
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — timing` : `\n  all ${total} passed — timing`);
process.exit(failed ? 1 : 0);
