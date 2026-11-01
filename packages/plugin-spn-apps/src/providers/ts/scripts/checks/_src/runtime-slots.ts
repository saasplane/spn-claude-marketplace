#!/usr/bin/env node
// Refuse an `SPApp` interface that declares a member beside `config`, `providers` and `modules` (MKT.HOOKS.146).
//
// The rule (RULE.SUPPORT.CORE.001 in spn-support-ts): the app runtime has three slots, `config`, `providers`
// and `modules`. A fourth member on `SPApp` is a slot the runtime does not know, so what it holds is invisible
// to the runtime and to every module. Put the value in `config`, a provider or a module instead.
//
// It reads the file the write would PRODUCE, finds the `SPApp` interface body in the masked text, and denies
// only a member the write itself names. A file that never says `SPApp` returns before any parse.
//
//   hook :  runtime-slots.ts --stdin        (PreToolUse JSON on stdin; denies with the fix named)

import { basename, resolve } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { mask, resultingText } from "../../../../../../../plugin-support-lib/src/lib/source.ts";

const SLOTS = new Set(["config", "providers", "modules"]);
const HEADER = /\binterface\s+SPApp\b[^{;]*\{/g;

const REMEDY = "SPApp has three slots: config, providers and modules. Put a setting in config, a service in a " +
  "provider, and a feature in a module, so the runtime and every module can see it (RULE.SUPPORT.CORE.001).";

export function watched(path: string): boolean {
  const normalized = resolve(path).split("\\").join("/");
  return normalized.endsWith(".ts") && !/\.(?:test|spec)\.ts$/.test(normalized) && normalized.includes("/src/");
}

/** The names of the members declared at the top level of every `SPApp` interface body. */
export function members(masked: string): string[] {
  const found: string[] = [];
  for (const header of masked.matchAll(HEADER)) {
    let depth = 1, member = "";
    const start = header.index + header[0].length;
    for (let i = start; i < masked.length && depth > 0; i += 1) {
      const ch = masked[i];
      if (depth === 1 && (ch === "(" || ch === "<")) {
        const m = /^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*$/.exec(member);
        if (m && !found.includes(m[1])) found.push(m[1]);
        member = "\u0000";
      }
      if (ch === "{" || ch === "(" || ch === "[" || ch === "<") depth += 1;
      else if (ch === "}" || ch === ")" || ch === "]" || ch === ">") {
        if (ch === ">" && masked[i - 1] === "=") continue;     // an arrow, not a closing angle
        depth -= 1;
        if (depth === 0) break;
      }
      if (depth === 1 && (ch === ";" || ch === "," || ch === "\n")) member = "";
      else if (depth === 1) {
        member += ch;
        const m = /^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*\??\s*[:(<]/.exec(member);
        if (m && !found.includes(m[1])) { found.push(m[1]); member = "\u0000"; }
      }
    }
  }
  return found;
}

/** The verdict for one write, given text that has ALREADY been parsed. */
export function verdict(path: string, source: string | null, added: string | null): Verdict {
  if (source === null || !source.includes("SPApp")) return null;
  let extra: string[];
  try {
    extra = members(mask(source)).filter((name) => !SLOTS.has(name))
      // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from an identifier read out of the file being judged
      .filter((name) => added === null || new RegExp(`(?<![\\w$])${name.replace(/\$/g, "\\$")}(?![\\w$])`).test(added));
  } catch {
    return null;                     // a parse this check cannot do allows, never blocks
  }
  if (!extra.length) return null;
  return { deny: [`Denied — SPApp in ${basename(path)} declares ${extra.join(", ")} beside config, providers and modules.`, `  ${REMEDY}`].join("\n") };
}

/** The verdict for one write, parsed here. Called alone; the dispatcher goes through a subject. */
export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  if (!watched(path)) return null;
  let source: string | null;
  let added: string | null;
  try {
    [source, added] = resultingText(input, path);
  } catch {
    source = added = input.content ?? input.new_string ?? null;
  }
  return verdict(path, source, added);
}

export const CHECK = { name: "runtime-slots", run, watched };

if (runAlone("runtime-slots.ts")) {
  const event = (await payload()) as Payload | null;
  emit(event ? run(event.tool_input ?? {}) : null);
  process.exit(0);
}
