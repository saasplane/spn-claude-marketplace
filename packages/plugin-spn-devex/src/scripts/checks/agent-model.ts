#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md § The PreToolUse `agent-model`
// check holds every launch to its model (RULE.DEVEX.AGENT.104).
//
// The one owner of the launch's model: refuses a fork, which runs on the window's own model with its whole context. A launch that names no model but an
// order does is let through, and so is one that names none at all: the event fills in the order's model, else the
// agent kind's, else `sonnet` (`launchDefaultModel`). Its fast path is the tool name.
//
//   called by: events/pretooluse.ts `dispatch`, on an Agent or Task call

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { emit, readPayload, runAlone, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";

const ORDER_PATH = /[^\s'"`()<>]*notes\/(?:N\d+[a-z]?|ideate|follow-ups)\/orders\/[^\s'"`()<>]+\.md/g;

/** The three model families an order and a launch are compared by. */
const FAMILY = /opus|sonnet|haiku/i;

/** The model a launch gets where it names none and no order names one: the `model:` line of the agent file its `subagent_type` names, else `sonnet`, the model the book gives a written order (RULE.DEVEX.AGENT.104). */
export function launchDefaultModel(payload: Payload): string {
  const type = ((payload.tool_input ?? {}) as { subagent_type?: string }).subagent_type?.trim() ?? "";
  const name = type.split(":").pop() ?? "";
  if (name && name !== "fork" && /^[A-Za-z0-9._-]+$/.test(name)) {
    const here = dirname(fileURLToPath(import.meta.url));
    for (const folder of [join(here, "..", "..", "agents"), join(here, "..", "..", "..", "agents"), join(here, "..", "..", "..", "src", "agents")]) {
      try {
        const head = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(folder, `${name}.md`), "utf8"))?.[1] ?? "";
        const found = FAMILY.exec(/^model:\s*(.*)$/m.exec(head)?.[1] ?? "")?.[0].toLowerCase();
        if (found) return found;
      } catch { /* try the next folder */ }
    }
  }
  return "sonnet";
}

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
  // A launch with no model runs on the order's, else its agent kind's, else `sonnet`: the event fills it in (`launchDefaultModel`).
  return null;
}

if (runAlone("agent-model.ts")) {
  try { emit(checkAgentModel(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
