// `checks/agent-model.ts` (MKT.HOOKS.385) — an Agent launch with no model and no order naming one, or as a fork, is
// refused, and the refusal names the model to pass; a model the order does not name takes the order's model, and a
// launch with no model and no order takes its agent file's model (`launchDefaultModel`), else sonnet.
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";
import { workspace } from "../../../helpers/fixture.mjs";

const { checkAgentModel, orderModel, launchOrderModel, launchDefaultModel } = await import(join(CHECKS, "agent-model.ts"));

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
  const fork = checkAgentModel(launch({ subagent_type: "fork" }));
  ok("a fork is refused, naming a subagent_type and the order's model", kind(fork) === "deny" && fork.deny.includes("subagent_type"), JSON.stringify(fork));
  ok("a Task fork is refused too", kind(checkAgentModel(launch({ subagent_type: "fork" }, "Task"))) === "deny");
}

console.log("\n=== a launch with no model and no order takes the agent file's model, else sonnet");
{
  ok("a launch with no model and no order is let through", kind(checkAgentModel(launch({}))) === "silent" && kind(checkAgentModel(launch({}, "Task"))) === "silent");
  ok("with no subagent_type the default model is sonnet", launchDefaultModel(launch({})) === "sonnet", launchDefaultModel(launch({})));
  ok("a subagent_type with no agent file of its own gets sonnet", launchDefaultModel(launch({ subagent_type: "general-purpose" })) === "sonnet");
  ok("spn-prose-rewriter takes the `model:` line of its agent file, sonnet", launchDefaultModel(launch({ subagent_type: "spn-devex:spn-prose-rewriter" })) === "sonnet");
  ok("spn-prose-reviewer takes the `model:` line of its agent file, opus", launchDefaultModel(launch({ subagent_type: "spn-devex:spn-prose-reviewer" })) === "opus", launchDefaultModel(launch({ subagent_type: "spn-devex:spn-prose-reviewer" })));
  ok("a fork stays refused", kind(checkAgentModel(launch({ subagent_type: "fork" }))) === "deny");
}

console.log("\n=== an order under notes/ideate/ or notes/follow-ups/ is read as an order (Q33)");
{
  const SIDE = [".spndevex/workstreams/open/031-probe/notes/ideate/orders/part-1.md", ".spndevex/workstreams/open/031-probe/notes/follow-ups/orders/part-2.md"];
  const sided = workspace("agent-model-ideate", { [SIDE[0]]: '---\nmodel: opus\n---\n# Part\n', [SIDE[1]]: '---\nmodel: haiku\n---\n# Part\n' });
  const at = (input) => ({ tool_name: "Agent", cwd: sided, tool_input: { description: "d", prompt: "do it", ...input } });
  ok("a launch with no model passes where its order sits under notes/ideate/, and takes that model", kind(checkAgentModel(at({ prompt: `Read ${SIDE[0]}.` }))) === "silent" && launchOrderModel(at({ prompt: `Read ${SIDE[0]}.` })) === "opus", launchOrderModel(at({ prompt: `Read ${SIDE[0]}.` })));
  ok("the same under notes/follow-ups/", launchOrderModel(at({ prompt: `Read ${SIDE[1]}.` })) === "haiku", launchOrderModel(at({ prompt: `Read ${SIDE[1]}.` })));
}

console.log("\n=== launches it lets through");
{
  const off = checkAgentModel(launch({ model: "opus", prompt: `Read ${ORDER} and carry it out.` }));
  ok("a model the order does not name returns nothing, and the order's model is still named",
    kind(off) === "silent" && launchOrderModel(launch({ model: "opus", prompt: `Read ${ORDER}.` })) === "sonnet", JSON.stringify(off));
  ok("a launch on the order's model passes", kind(checkAgentModel(launch({ model: "sonnet", prompt: `Read ${ORDER}.` }))) === "silent");
  ok("a launch with no model passes where its order names one, and takes that model",
    kind(checkAgentModel(launch({ prompt: `Read ${ORDER}.` }))) === "silent" && launchOrderModel(launch({ prompt: `Read ${ORDER}.` })) === "sonnet");
  ok("a launch with a model and no order passes", kind(checkAgentModel(launch({ model: "haiku" }))) === "silent");
  ok("a tool that is not an Agent launch is not read", kind(checkAgentModel({ tool_name: "Bash", tool_input: { command: "ls" } })) === "silent");
  ok("an order's model line is read from its front matter", orderModel("---\nmodel: opus\n---\n") === "opus" && orderModel("# none") === null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — agent model` : `\n  all ${total} passed — agent model`);
process.exit(failed ? 1 : 0);
