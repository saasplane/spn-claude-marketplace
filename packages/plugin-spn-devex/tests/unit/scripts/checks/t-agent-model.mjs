// `checks/agent-model.ts` (MKT.HOOKS.385) — an Agent launch with no model and no order naming one, with a model its
// order's `model:` line does not name, or as a fork is refused, and the refusal names the model to pass.
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";
import { workspace } from "../../../helpers/fixture.mjs";

const { checkAgentModel, orderModel, launchOrderModel } = await import(join(CHECKS, "agent-model.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  [MKT.HOOKS.385] ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  [MKT.HOOKS.385] ${label}${detail ? `\n        ${String(detail).slice(0, 400)}` : ""}`);
};

const ORDER = ".spndevex/workstreams/open/031-probe/notes/N001/orders/part-1.md";
const root = workspace("agent-model", { [ORDER]: '---\nmodel: sonnet\n---\n# Part\n' });
const launch = (input, tool_name = "Agent") => ({ tool_name, cwd: root, tool_input: { description: "d", prompt: "do it", ...input } });
const kind = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");

console.log("=== launches it refuses, naming the model to pass");
{
  const none = checkAgentModel(launch({}));
  ok("a launch with no model and no order is refused, naming sonnet", kind(none) === "deny" && none.deny.includes('model: "sonnet"'), JSON.stringify(none));
  const off = checkAgentModel(launch({ model: "opus", prompt: `Read ${ORDER} and carry it out.` }));
  ok("a model the order does not name is refused, naming the order's model", kind(off) === "deny" && off.deny.includes('"sonnet"'), JSON.stringify(off));
  const fork = checkAgentModel(launch({ subagent_type: "fork" }));
  ok("a fork is refused, naming a subagent_type and the order's model", kind(fork) === "deny" && fork.deny.includes("subagent_type"), JSON.stringify(fork));
  ok("a Task launch with no model is refused too", kind(checkAgentModel(launch({}, "Task"))) === "deny");
}

console.log("\n=== launches it lets through");
{
  ok("a launch on the order's model passes", kind(checkAgentModel(launch({ model: "sonnet", prompt: `Read ${ORDER}.` }))) === "silent");
  ok("a launch with no model passes where its order names one, and takes that model",
    kind(checkAgentModel(launch({ prompt: `Read ${ORDER}.` }))) === "silent" && launchOrderModel(launch({ prompt: `Read ${ORDER}.` })) === "sonnet");
  ok("a launch with a model and no order passes", kind(checkAgentModel(launch({ model: "haiku" }))) === "silent");
  ok("a tool that is not an Agent launch is not read", kind(checkAgentModel({ tool_name: "Bash", tool_input: { command: "ls" } })) === "silent");
  ok("an order's model line is read from its front matter", orderModel("---\nmodel: opus\n---\n") === "opus" && orderModel("# none") === null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — agent model` : `\n  all ${total} passed — agent model`);
process.exit(failed ? 1 : 0);
