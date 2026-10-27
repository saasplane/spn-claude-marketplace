// RESTATES: `docs/02-constructs/02-support/02-apps/10-providers.md` § The claim, and what grants it — the
// stack is the repository's own claim; RD.DEVEX.AGENT.066 — a gate never names an instance; and
// RD.DEVEX.AGENT.107 — the Surface check reaches its stack's reader.
//
// The reader sits at `providers/<stack>/scripts/checks/surface.ts`.
//
// **THIS FILE IS THE GATE, AND IT KNOWS NO STACK.** It decides that a write is Surface code — a `.tsx`
// file in a web node's `src/` — and hands it to the reader the node's own `sprepo.json` names. A stack
// with no reader here answers nothing, and that is not an error.
import type { ToolInput, Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { stackOf } from "../../../../plugin-support-lib/src/lib/stack.ts";
import { isWebSource } from "../lib/node.ts";

/** The Surface reader for this file's stack, or null where the file is no Surface code or no reader exists. */
export async function surfaceFor(path: string): Promise<{ stack: string; validate: (input: ToolInput) => Verdict } | null> {
  if (!isWebSource(path)) return null;
  const stack = stackOf(path);
  if (!stack) return null;
  try {
    // The path is composed from the declaration: a static import would be this file naming a stack.
    const module = await import(`../../providers/${stack}/scripts/checks/surface.ts`);
    return typeof module.validate === "function" ? { stack, validate: module.validate } : null;
  } catch {
    return null;
  }
}
