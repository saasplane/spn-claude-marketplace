// RESTATES: spn-foundation docs/04-capabilities/01-devex/03-utils/01-spnutils/02-delivery.md § The three permission tiers,
//           which runs the commands the floor already allows, and RULE.DEVEX.WORKSPACE.069, which releases a minor or
//           patch bump without asking.
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// A standing grant is an allow rule the developer keeps: in the workspace's `.claude/settings.json`, which the floor
// writes, or in `.claude/settings.local.json`, where the developer widens it for this machine. A reply that ends the
// turn by asking leave for an act such a rule already allows makes the developer answer a question they settled, so
// the turn does not end: the agent is sent back to do the act. A minor or patch release needs no ask at all.
// It reads the last paragraph of the reply, with its fenced blocks taken out, because that is the ask a turn ends on.
//
//   called by: events/stop.ts, on the turn's last reply

import { join } from "node:path";
import { FLOOR_FILES, floorOf, readFloor, ruleMatches, tierOf } from "./command-shape.ts";

/** A finding about the reply, in the shape every Stop check returns. */
export type GrantFinding = { check: string; message: string };

/** A sentence that asks the developer's leave before the agent acts. */
const ASKS = /\b(?:shall I|should I|do you want me to|want me to|would you like me to|can I|may I|ok(?:ay)? to|let me know (?:if|whether|when)|say (?:the word|go)|(?:once|when) you (?:say|give) (?:go|the go|the word)|waiting (?:for|on) your (?:go|ok|okay|approval|word))\b/i;

/** An act a grant can allow: the words that name it in a reply, and plain commands the floor's rules are matched against. */
type Act = { act: string; words: RegExp; commands: string[] };

/** The acts a standing grant covers. A merge is tried in the form the developer's own rule allows, then plainer forms. */
export const ACTS: Act[] = [
  { act: "merge", words: /\bmerg(?:e|ing)\b/i,
    commands: ["gh pr merge 1 --repo saasplane/x --merge --admin", "gh pr merge 1 --merge", "gh pr merge 1"] },
  { act: "open the pull request", words: /\b(?:open|create|raise)\b[^.?!]{0,40}\b(?:PR|pull request)s?\b/i, commands: ["gh pr create"] },
  { act: "push", words: /\bpush(?:ing)?\b/i, commands: ["git push"] },
  { act: "commit", words: /\bcommit(?:ting)?\b(?!\s+to\b)/i, commands: ["git commit -m x"] },
];

/** A sentence that asks to release, and one that names a major bump, which is agreed on the arc's go instead. */
const RELEASE = /\b(?:release|publish)\b/i;
const MAJOR = /\bmajor\b/i;

/** The last paragraph of the reply's prose: what the turn ends on. */
export function lastParagraph(prose: string): string {
  return prose.split(/\n\s*\n/).map((one) => one.trim()).filter(Boolean).at(-1) ?? "";
}

/** The sentences of a paragraph that ask leave. */
export function asks(paragraph: string): string[] {
  return paragraph.split(/(?<=[.?!])\s+/).filter((sentence) => ASKS.test(sentence));
}

/**
 * The allow rule that grants a command, and the settings file that holds it. Null where no rule allows it, or where
 * an ask or deny rule names it, because the harness reads deny before ask before allow across both files.
 */
export function grantOf(root: string, command: string): { rule: string; file: string } | null {
  if (tierOf(readFloor(root), command) !== "allow") return null;
  for (const file of FLOOR_FILES) {
    const rule = floorOf(join(root, ".claude", file)).allow.find((one) => ruleMatches(one, command));
    if (rule) return { rule, file };
  }
  return null;
}

/**
 * The standing-grant check: one finding that names each act the reply's last paragraph asks leave for and the rule
 * that already allows it, or none.
 *
 * @param prose  the turn's last reply with its fenced blocks taken out
 * @param root   the workspace, whose `.claude/` settings hold the grants
 */
export function checkStandingGrant(prose: string, root: string): GrantFinding[] {
  const lines: string[] = [];
  for (const sentence of asks(lastParagraph(prose))) {
    for (const one of ACTS) {
      if (!one.words.test(sentence)) continue;
      const grant = one.commands.map((command) => grantOf(root, command)).find(Boolean);
      if (grant) lines.push(`- ${one.act}: \`${grant.rule}\` in \`.claude/${grant.file}\``);
    }
    if (RELEASE.test(sentence) && !MAJOR.test(sentence))
      lines.push("- release: a minor or patch release needs no ask (RULE.DEVEX.WORKSPACE.069), and a major one is agreed on the arc's go");
  }
  const said = [...new Set(lines)];
  if (!said.length) return [];
  return [{ check: "standing-grant", message:
    `This reply ends by asking leave for ${said.length === 1 ? "an act" : "acts"} the developer has already allowed:\n${said.join("\n")}\n` +
    `Do ${said.length === 1 ? "it" : "them"} now, in this turn, and say what you did. An agent runs the commands the floor ` +
    `already allows without asking (02-delivery.md § The three permission tiers).` }];
}
