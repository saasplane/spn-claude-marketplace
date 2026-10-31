// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The card section,
//           which keeps how the work runs (RULE.DEVEX.WORKSPACE.467) out of Needs you and out of a closing ask;
//           docs/04-capabilities/01-devex/03-utils/01-spnutils/02-delivery.md § The three permission tiers; and
//           RULE.DEVEX.WORKSPACE.069, which releases a minor or patch bump without asking.
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// How the work runs is the agent's within its grants, so a reply that asks the developer about the order of the work, its
// own measurements, files or workspace, or an act a standing grant allows, is sent back to decide it and say the outcome.
// An ask is a leave-asking phrase, "your go for", or a sentence ending in a question mark, read in the Needs you part and
// the last paragraph. Grants are the allow rules in `.claude/settings.json` and `.claude/settings.local.json`.
//
//   called by: events/stop.ts, on the turn's last reply; checks/questions.ts, on a card or suggestion raised
//              (through `runsTheWork`, which is the list of acts without the settings)

import { join } from "node:path";
import { FLOOR_FILES, floorOf, readFloor, ruleMatches, tierOf } from "./command-shape.ts";

/** A finding about the reply, in the shape every Stop check returns. */
export type HowFinding = { check: string; message: string };

/** A sentence that asks the developer's leave before the agent acts. */
const LEAVE = /\b(?:shall I|should I|do you want me to|want me to|would you like me to|can I|may I|ok(?:ay)? to|let me know (?:if|whether|when)|say (?:the word|go)|say\b[^.?!]{0,40}\band I(?:'|’)ll|(?:once|when) you (?:say|give) (?:go|the go|the word)|waiting (?:for|on) your (?:go|ok|okay|approval|word)|(?:the|your) go for)\b/i;

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

/** The acts of running the work that no grant is needed to decide: what each is, and the words that name it. */
type Running = { kind: string; found: (sentence: string) => boolean };

const ARC_WORDS = /\b(?:arcs?|steps?|passes|pass|helpers?|agents?)\b|\bN\d{3}\b/i;
const FILE_VERBS = /\b(?:discard|keep|delete|drop|move|remove)\b/i;
const FILE_THINGS = /\b(?:notes?|work files?|the log|log line|the plan|the sheet|change sheet|briefs?|reports?|drafts?)\b|\.spndevex\b/i;

export const RUNNING: Running[] = [
  { kind: "the order of the work", found: (s) => /\b(?:start|hold|first|after|before|wait|next)\b/i.test(s) && ARC_WORDS.test(s) },
  { kind: "the agent's own measurement", found: (s) => /\b(?:baselines?|measurements?|timings?|re-?runs?|full runs?|suites?)\b/i.test(s) },
  { kind: "the agent's own files", found: (s) => FILE_VERBS.test(s) && FILE_THINGS.test(s) },
  { kind: "the agent's own workspace", found: (s) =>
    /\b(?:worktrees?|branch(?:es)?|rebase|stash|local services?|ports?)\b/i.test(s) || /\breset\b[^.?!]{0,30}\blocal\b/i.test(s) },
];

/** What passes whatever else a sentence names: a card's line, a page to look at, a refused act, a boundary, a new workstream. */
const PASSES: RegExp[] = [
  /^\W*[QS]\d+\b/,
  /\b(?:look at|review|read|your go on)\b[^.?!]{0,60}\b(?:preview|page|design)\b/i,
  /\b(?:refus(?:es|ed)|denied|blocked by|permission system|harness)\b/i,
  /\b(?:published contract|contract|security|customer data|product(?:'|’)s data|person(?:'|’)s data|personal data|cloud cost|infrastructure|what (?:a |the )?users? (?:see|sees))\b/i,
  /\bnew workstreams?\b/i,
];

/** Whether a sentence is one of the passes. */
const passes = (sentence: string): boolean => PASSES.some((one) => one.test(sentence));

/**
 * What kind of act of running the work a text names, with no settings read, or null. A card's title and options, and a
 * suggestion's title, are read with this: a card or suggestion whose every part is such an act is the agent's to decide.
 */
export function runsTheWork(text: string): string | null {
  if (passes(text)) return null;
  return RUNNING.find((one) => one.found(text))?.kind ?? null;
}

/** The last paragraph of the reply's prose: what the turn ends on. */
export function lastParagraph(prose: string): string {
  return prose.split(/\n\s*\n/).map((one) => one.trim()).filter(Boolean).at(-1) ?? "";
}

/** A sentence is an ask when it asks leave or ends in a question mark. */
const isAsk = (sentence: string): boolean => LEAVE.test(sentence) || /\?["')\]*_]*$/.test(sentence.trim());

/** The sentences of a text that ask: split after a stop and at a line break. */
export function asks(text: string): string[] {
  return text.split(/\n+|(?<=[.?!])\s+/).map((one) => one.trim()).filter((one) => one && isAsk(one));
}

const NEEDS_YOU = /^[ \t]{0,3}(?:#{1,6}[ \t]*)?(?:\*\*|__)?[ \t]*Needs you\b/i;
const PART_ENDS = /^[ \t]{0,3}(?:(?:#{1,6}[ \t]*|\*\*|__)[ \t]*(?:Progress|What moved)\b|(?:-{3,}|\*{3,}|_{3,})[ \t]*$)/i;

/** The reply's Needs you part: from its opening line to the progress heading or a rule. Empty where the reply does not open with it. */
export function needsYouOf(prose: string): string {
  const lines = prose.split("\n");
  const start = lines.findIndex((line) => line.trim() !== "");
  if (start < 0 || !NEEDS_YOU.test(lines[start])) return "";
  const out: string[] = [];
  for (let at = start; at < lines.length; at += 1) {
    if (at > start && PART_ENDS.test(lines[at])) break;
    out.push(lines[at]);
  }
  return out.join("\n");
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

/** What one ask names, as lines of the finding: the kind of act, or the grant that already allows it. */
function linesOf(sentence: string, root: string): string[] {
  if (passes(sentence)) return [];
  const lines: string[] = [];
  const quoted = `"${sentence.length > 140 ? `${sentence.slice(0, 137)}...` : sentence}"`;
  for (const one of RUNNING) if (one.found(sentence)) lines.push(`- ${quoted}: ${one.kind}`);
  for (const one of ACTS) {
    if (!one.words.test(sentence)) continue;
    const grant = one.commands.map((command) => grantOf(root, command)).find(Boolean);
    if (grant) lines.push(`- ${quoted}: ${one.act}, which \`${grant.rule}\` in \`.claude/${grant.file}\` already allows`);
  }
  if (RELEASE.test(sentence) && !MAJOR.test(sentence))
    lines.push(`- ${quoted}: a minor or patch release needs no ask (RULE.DEVEX.WORKSPACE.069), and a major one is agreed on the arc's go`);
  return lines;
}

/**
 * The how-it-runs check: one finding that names each ask about running the work, in the reply's Needs you part and in
 * its last paragraph, or none.
 *
 * @param prose  the turn's last reply with its fenced blocks taken out
 * @param root   the workspace, whose `.claude/` settings hold the grants
 */
export function checkHowItRuns(prose: string, root: string): HowFinding[] {
  const sentences = [...asks(needsYouOf(prose)), ...asks(lastParagraph(prose))];
  const said = [...new Set(sentences.flatMap((sentence) => linesOf(sentence, root)))];
  if (!said.length) return [];
  return [{ check: "how-it-runs", message:
    `This reply asks the developer how the work runs:\n${said.join("\n")}\n` +
    `Decide ${said.length === 1 ? "it" : "them"}, do ${said.length === 1 ? "it" : "them"}, and say the outcome in one line. The developer decides the goal, ` +
    `the constructs, the requirements and the cards; how the work runs is yours within your grants (RULE.DEVEX.WORKSPACE.467).` }];
}
