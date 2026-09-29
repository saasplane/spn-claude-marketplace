#!/usr/bin/env node
// RESTATES: `docs/02-constructs/02-support/01-apps/10-providers.md` § The claim, and what grants it —
// the stack sits in the repository's own `sprepo.json`; and RD.DEVEX.AGENT.066 — a gate never names
// an instance. Those are the source of truth; this file states no rule of its own and only performs
// the read it describes.
//
// **THE STACK IS THE NODE'S OWN**, read from the nearest `sprepo.json` — never typed on a command
// and never guessed from a file extension. A gate that could name an instance is a gate somebody
// edits to add the next one, and that edit is what the provider shape exists to remove.
//
// **THE WALK STOPS AT THE FIRST `sprepo.json`.** A file outside every repository resolves to null,
// and the caller treats that as *no subject applies* rather than as an error: a hook that refuses
// what it cannot classify refuses far more than it was asked to.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { isFile } from "./source.ts";

/**
 * The instance folder name for the repository owning `path` — `ts` today, lowercased from the
 * declaration's own spelling so the folder and the manifest cannot disagree by case.
 *
 * Returns null where there is no repository, no `config`, or no `stack` on it. A repository that
 * declares no stack is answered by no provider, which is the same thing as a stack with no folder.
 */
export function stackOf(path: string): string | null {
  let here = dirname(resolve(path));
  for (;;) {
    const manifest = join(here, "sprepo.json");
    if (isFile(manifest)) {
      try {
        const stack = JSON.parse(readFileSync(manifest, "utf8"))?.config?.stack;
        return typeof stack === "string" && stack.length ? stack.toLowerCase() : null;
      } catch {
        return null;
      }
    }
    const up = dirname(here);
    if (up === here) return null;
    here = up;
  }
}
