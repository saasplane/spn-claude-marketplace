#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md § The PreToolUse `agent-model`
// check holds every launch to its model (RULE.DEVEX.AGENT.104).
//
// The one owner of the launch's model: refuses an Agent launch that names no model and no order names one either,
// a launch of an order on a model other than the one its `model:` line names, and a fork, which runs on the window's
// own model with its whole context. A launch that names no model but an order does is let through, and the event
// fills the order's model in. Its fast path is the tool name.
//
//   called by: events/pretooluse.ts `dispatch`, on an Agent or Task call

import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { emit, readPayload, runAlone, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";

const ORDER_PATH = /[^\s'"`()<>]*notes\/N\d+[a-z]?\/orders\/[^\s'"`()<>]+\.md/g;

/** The three model families an order and a launch are compared by. */
const FAMILY = /opus|sonnet|haiku/i;

/** The model family an order's front matter names on its `model:` line, or null. */
export function orderModel(text: string): string | null {
  const head = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? "";
  return FAMILY.exec(/^model:\s*(.*)$/m.exec(head)?.[1] ?? "")?.[0].toLowerCase() ?? null;
}

/**
 * Each order a launch's prompt names, with the model family its `model:` line names, read from the window's folder
 * and then from the workspace root; a report, and an order that cannot be read, are left out.
 */
function namedOrders(payload: Payload): { path: string; model: string | null }[] {
  const input = (payload.tool_input ?? {}) as { prompt?: string };
  const cwd = payload.cwd ?? process.cwd();
  const root = workspaceRoot(cwd);
  const out: { path: string; model: string | null }[] = [];
  for (const found of (input.prompt ?? "").matchAll(ORDER_PATH)) {
    if (found[0].endsWith(".report.md")) continue;
    for (const path of [resolve(cwd, found[0]), ...(root ? [resolve(root, found[0])] : [])]) {
      try { out.push({ path, model: orderModel(readFileSync(path, "utf8")) }); break; } catch { /* try the next folder */ }
    }
  }
  return out;
}

/** The model family the first order a launch names puts on its `model:` line, or null: what the event fills in. */
export function launchOrderModel(payload: Payload): string | null {
  return namedOrders(payload).find((order) => order.model)?.model ?? null;
}

export function checkAgentModel(payload: Payload): Verdict {
  if (payload.tool_name !== "Agent" && payload.tool_name !== "Task") return null;
  const input = (payload.tool_input ?? {}) as { model?: string; subagent_type?: string };
  if (input.subagent_type === "fork")
    return { deny: "A fork runs on this window's own model with its whole context (RULE.DEVEX.AGENT.104). Launch the agent with a `subagent_type` and the `model` its order names: `model: \"sonnet\"` for a written order." };
  if (!input.model?.trim()) {
    if (launchOrderModel(payload)) return null;
    return { deny: "This launch names no `model` (RULE.DEVEX.AGENT.104). Add `model` to the call: `model: \"sonnet\"` for a written order, `model: \"opus\"` for design." };
  }
  const launched = FAMILY.exec(input.model)?.[0].toLowerCase();
  for (const order of namedOrders(payload)) {
    if (order.model && order.model !== launched)
      return { deny: `The order ${basename(order.path)} names \`model: ${order.model}\` and this launch names \`${input.model}\`. Launch it with \`model: "${order.model}"\`, or change the order's \`model:\` line first (RULE.DEVEX.AGENT.104).` };
  }
  return null;
}

if (runAlone("agent-model.ts")) {
  try { emit(checkAgentModel(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
