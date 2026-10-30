#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/03-utils/01-spnutils/02-delivery.md § The three permission tiers
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// A refusal with the plain form: a Bash call the workspace's floor would send for approval only by its
// shape is refused and told which part, and the plain form of it, so the developer is never asked to
// approve a shape. It reads the floor's rules from both settings files, as the harness merges them, and
// it matches text and starts no other program. The design is in the marketplace's hooks chapter, § A call that would
// prompt only by its shape is told the plain form.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { emit, readPayload, runAlone, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";

/** The floor's Bash rules, by tier. */
export type Floor = { allow: string[]; ask: string[]; deny: string[] };

/** One part of a call: its text, and whether a lone `&` sent it to the background. */
export type Part = { text: string; background: boolean };

const TIERS = ["allow", "ask", "deny"] as const;

/**
 * The workspace's settings files, in the order the harness reads them: `settings.json`, which the floor writes,
 * and `settings.local.json`, where the developer widens it for this machine.
 */
export const FLOOR_FILES = ["settings.json", "settings.local.json"] as const;

/** The workspace floor's `Bash(…)` rules by tier, from both settings files, as the harness merges them. */
export function readFloor(root: string): Floor {
  const floor: Floor = { allow: [], ask: [], deny: [] };
  for (const file of FLOOR_FILES) {
    const one = floorOf(join(root, ".claude", file));
    for (const tier of TIERS) floor[tier].push(...one[tier]);
  }
  return floor;
}

/** One settings file's `Bash(…)` rules by tier; empty where the file cannot be read. */
export function floorOf(path: string): Floor {
  const floor: Floor = { allow: [], ask: [], deny: [] };
  try {
    const settings = JSON.parse(readFileSync(path, "utf8")) as { permissions?: Record<string, unknown> };
    for (const tier of TIERS) {
      const rules = settings.permissions?.[tier];
      if (!Array.isArray(rules)) continue;
      for (const rule of rules) {
        if (typeof rule !== "string") continue;
        if (rule === "Bash") floor[tier].push("*");
        const inside = /^Bash\((.*)\)$/s.exec(rule);
        if (inside) floor[tier].push(inside[1]);
      }
    }
  } catch { /* a floor that cannot be read allows nothing, and nothing is hinted */ }
  return floor;
}

const escapeRegex = (text: string): string => text.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

/**
 * Whether one part of a command matches one rule's text: `git status:*` names `git status` and every
 * command that goes on from it after a space, `*` stands for any text, and any other rule is the
 * command exactly.
 */
export function ruleMatches(rule: string, part: string): boolean {
  const text = part.trim();
  if (rule === "*") return true;
  const prefix = rule.endsWith(":*") ? rule.slice(0, -2) : null;
  const body = (prefix ?? rule).split("*").map(escapeRegex).join(".*");
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
  return new RegExp(prefix !== null ? `^${body}(?:\\s.*)?$` : `^${body}$`, "s").test(text);
}

/** The tier a part falls in: `deny` before `ask` before `allow`, as the harness reads them; null where no rule names it. */
export function tierOf(floor: Floor, part: string): "allow" | "ask" | "deny" | null {
  for (const tier of ["deny", "ask", "allow"] as const)
    if (floor[tier].some((rule) => ruleMatches(rule, part))) return tier;
  return null;
}

/**
 * The parts of a command, split where the harness splits it: `|`, `||`, `&&`, `;`, a lone `&` and a
 * line break, outside quotes, with each `$( … )` taken out as a part of its own. A redirection such as
 * `2>&1` or `&>` stays inside its part.
 */
export function partsOf(command: string): Part[] {
  const parts: Part[] = [];
  let current = "";
  let quote: string | null = null;
  const close = (background: boolean): void => {
    if (current.trim()) parts.push({ text: current.trim(), background });
    current = "";
  };
  for (let at = 0; at < command.length; at += 1) {
    const char = command[at];
    const next = command[at + 1] ?? "";
    if (quote) {
      if (char === "\\" && quote === '"') { current += char + next; at += 1; continue; }
      if (char === quote) quote = null;
      current += char;
      continue;
    }
    if (char === "\\") { current += char + next; at += 1; continue; }
    if (char === "'" || char === '"') { quote = char; current += char; continue; }
    if (char === "$" && next === "(" && command[at + 2] !== "(") {
      let depth = 1;
      let end = at + 2;
      for (; end < command.length && depth > 0; end += 1) {
        if (command[end] === "(") depth += 1;
        else if (command[end] === ")") depth -= 1;
      }
      parts.push(...partsOf(command.slice(at + 2, end - 1)));
      current += "$SUBSTITUTION";
      at = end - 1;
      continue;
    }
    if ((char === "&" && next === "&") || (char === "|" && next === "|")) { close(false); at += 1; continue; }
    if (char === "&" && (next === ">" || command[at - 1] === ">")) { current += char; continue; }
    if (char === "&") { close(true); continue; }
    if (char === "|" || char === ";" || char === "\n") { close(false); continue; }
    current += char;
  }
  close(false);
  return parts;
}

// A loop's and a branch's own words. A part that opens with one of the words that carry a command
// (`do`, `then`, `else`) is read for the command after it.
const LOOP_HEAD = /^(?:for|while|until|if|elif|case|select)\b/;
const LOOP_WORD = /^(?:done|fi|esac|\{|\}|\(|\))$/;
const CARRIES = /^(?:do|then|else)\s+/;
const ASSIGNMENT = /^(?:[A-Za-z_][A-Za-z0-9_]*=(?:'[^']*'|"[^"]*"|\S*)\s+)+/;

/** What a part is once the shape around it is read: the command it runs and the shape it is written in, or null where it runs none. */
type Reading = { command: string | null; shape: string | null; plain: string | null };

/** A program named by its path, when a rule allows the same program named by its name. */
function byName(floor: Floor, text: string): string | null {
  const [first, ...rest] = text.split(/\s+/);
  if (!first.includes("/")) return null;
  const named = [first.split("/").pop() ?? "", ...rest].join(" ");
  return named && tierOf(floor, named) === "allow" ? named : null;
}

/** How one part reads against the floor. */
function readPart(floor: Floor, part: Part): Reading & { tier: ReturnType<typeof tierOf> } {
  const text = part.text.replace(CARRIES, "");
  if (LOOP_HEAD.test(text) || LOOP_WORD.test(text))
    return { command: null, shape: `\`${text.split(/\s+/)[0]}\``, plain: "one command per call, or the loop kept as a script in the arc's `scripts/` and run by its name", tier: null };
  const tier = tierOf(floor, text);
  if (part.background && tier === "allow")
    return { command: text, shape: "a trailing `&`", plain: "`run_in_background` on the call, with the command alone", tier };
  if (tier !== null || part.background) return { command: text, shape: null, plain: null, tier };
  if (/^cd(?:\s|$)/.test(text))
    return { command: null, shape: `\`${text}\``, plain: "the tool's own path option or an absolute path, or `cd <dir>` as a call of its own (git has no `-C` rule on the floor), one command per call", tier: null };
  const named = byName(floor, text);
  if (named) return { command: named, shape: `\`${text.split(/\s+/)[0]}\``, plain: `the program by its name: \`${named}\``, tier: "allow" };
  const assigned = ASSIGNMENT.exec(text);
  if (assigned && tierOf(floor, text.slice(assigned[0].length)) === "allow")
    return { command: text.slice(assigned[0].length), shape: `\`${assigned[0].trim()}\` before the program`, plain: "the program alone, by its name, with what it needs passed as an option", tier: "allow" };
  return { command: text, shape: null, plain: null, tier: null };
}

/**
 * The hint for a command, or null where its shape is not why it would prompt: a single allowed command,
 * a part an `ask` or `deny` rule names, or a part no rule allows for what it does.
 */
export function shapeHint(floor: Floor, command: string): string | null {
  const parts = partsOf(command);
  if (!parts.length) return null;
  if (parts.length === 1 && !parts[0].background && tierOf(floor, parts[0].text) !== null) return null;
  const read = parts.map((part) => ({ part, ...readPart(floor, part) }));
  // A part an ask or deny rule names, or one no rule allows and no shape explains, is a prompt about what the call does.
  if (read.some((one) => one.tier === "ask" || one.tier === "deny")) return null;
  if (read.some((one) => one.tier === null && one.shape === null)) return null;
  const shaped = read.filter((one) => one.shape !== null);
  if (!shaped.length) {
    if (parts.length < 2) return null;
    const instead: string[] = [];
    if (parts.some((part) => /^cd(?:\s|$)/.test(part.text))) instead.push("`cd <dir>` as a call of its own, then the command, or the tool's own path option in place of the `cd`");
    if (/(?:^|[^|])\|(?:[^|]|$)/.test(command)) instead.push("the Read or Grep tool, or the program's own option, in place of the pipe");
    return `Each part of this call is allowed on its own (${parts.map((part) => `\`${part.text}\``).join(", ")}), and joined they are sent for ` +
      `approval by their shape. Run one command per call${instead.length ? `: ${instead.join(", and ")}` : ""}.`;
  }
  // One line for each plain form, so a loop's opening and closing words share the line that names them.
  const byPlain = new Map<string, string[]>();
  for (const one of shaped) byPlain.set(one.plain!, [...(byPlain.get(one.plain!) ?? []), one.shape!]);
  const lines = [...byPlain].map(([plain, shapes]) => `- ${[...new Set(shapes)].join(" … ")}: ${plain}`);
  return `This call would be sent for approval by its shape, not by what it runs — the floor allows ` +
    `${read.filter((one) => one.command && one.tier === "allow").map((one) => `\`${one.command}\``).join(", ") || "each command in it"}. ` +
    `The plain form:\n${lines.join("\n")}`;
}

/** Whether the check could have an opinion: a command joined by an operator, or one whose first word is a shape. */
export function applies(_path: string, command: string): boolean {
  return /[|;&\n]|\$\(|^\s*(?:cd|for|while|until|if|[A-Za-z_][A-Za-z0-9_]*=)\b|^\s*\S*\//.test(command);
}

export function checkCommandShape(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command) return null;
  const root = workspaceRoot(payload.cwd ?? process.cwd());
  if (!root) return null;
  const hint = shapeHint(readFloor(root), command);
  return hint ? { deny: hint } : null;
}

if (runAlone("command-shape.ts")) {
  try { emit(checkCommandShape(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
