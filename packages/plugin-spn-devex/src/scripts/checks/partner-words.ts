// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The reply as a teammate,
//           which speaks a partner's words (RULE.DEVEX.AGENT.160) and sets a product choice beside its trade-off (RULE.DEVEX.AGENT.161).
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// Outside the builder's workspace the reader holds neither the book nor the plugins, so a reply names what the partner can
// open: their platform, their files, their commands, SaaS Plane by its product name. A rule, decision or behaviour id of
// ours, the book or one of its chapters, a skill, a hook or a check by name, and "conflicts with" our standard are sent back.
// A code block and a reply to a prompt that itself names the book, a rule or a plugin pass.
//
//   called by: events/stop.ts, on the turn's last reply; checks/doc-check.ts, on an approach page and a preview (the same list)

import { isBuilderWorkspace } from "../events/orientation.ts";

/** A finding about the reply, in the shape every Stop check returns. */
export type PartnerFinding = { check: string; message: string };

/** One thing a partner cannot open that a text names: what kind it is, and the words that name it. */
export type PartnerWord = { kind: string; phrase: string };

const OUR_PREFIXES = "DEVEX|SUPPORT|PLATFORM|LAUNCHPAD|INFRA|FOUNDATION|SURFACE|APPS|SPN";

/** The kinds a partner cannot open, in the order they are told. */
const KINDS: ReadonlyArray<{ kind: string; found: RegExp }> = [
  { kind: "a rule or decision id of ours", found: new RegExp(`\\bRULE\\.(?:${OUR_PREFIXES})(?:\\.[A-Z0-9]+)*\\.\\d+\\b|\\b(?:MKT|CLI)\\.[A-Z]+\\.\\d+\\b`, "g") },
  { kind: "the book", found: /\bthe book(?:'s|’s)?\b|\b\d{2}-[a-z][a-z0-9-]*\.md\b|\brefs\/[\w./-]+/gi },
  { kind: "the plugins' insides", found: /\bthe plugins?\b|\bspn-(?:devex|apps|surface|infra)\b|\bskills?\b|\b(?:stop|pretooluse|posttooluse|sessionstart) hook\b|\b(?:standing-grant|how-it-runs|partner-words|doc-check|reply-shape|working-detail)\b/gi },
  { kind: "a conflict with our standard", found: /\b(?:conflicts? with|forbidden by|not allowed by)\b[^.?!\n]{0,40}\b(?:the book|rules?|plugins?|our standards?|SaaS Plane(?:'s|’s) standards?)\b/gi },
];

/** Whether a prompt itself names the book, a rule or a plugin: a reply in kind may name them back. */
export function promptNamesBook(prompt: string): boolean {
  return /\bthe book\b|\bRULE\.[A-Z]+\.|\bplugins?\b|\bspn-(?:devex|apps|surface|infra)\b|\bskills?\b|\bchapter\b/i.test(prompt);
}

/**
 * Every thing a partner cannot open that the text names, with the first phrase of each kind. The doc check reads the
 * same list.
 *
 * @param text  the prose to read, with its fenced blocks already taken out
 */
export function findPartnerWords(text: string): PartnerWord[] {
  const out: PartnerWord[] = [];
  // The partner's own files pass: a whole file:// address and an absolute path are skipped like a code block.
  const own = text.replace(/\bfile:\/\/[^\s)\]>"'`]*/gi, " ").replace(/(?<![\w.:/-])\/(?:[\w.@~+-]+\/)+[\w.@~+-]*/g, " ");
  for (const one of KINDS) {
    const found = own.match(one.found);
    if (found) out.push({ kind: one.kind, phrase: found[0] });
  }
  return out;
}

/**
 * The partner-words check: one finding that names what the reply says that a partner cannot open, or none. It reads
 * nothing in the builder's workspace and nothing where the prompt itself named the book.
 *
 * @param prose   the turn's last reply with its fenced blocks taken out
 * @param root    the workspace
 * @param prompt  the turn's prompt, where it names the book, a rule or a plugin
 */
export function checkPartnerWords(prose: string, root: string, prompt = ""): PartnerFinding[] {
  if (isBuilderWorkspace(root) || promptNamesBook(prompt)) return [];
  const found = findPartnerWords(prose);
  if (!found.length) return [];
  return [{ check: "partner-words", message:
    `This reply names what a partner cannot open: ${found.map((one) => `"${one.phrase}"`).join(" · ")}. Say it in the partner's product: what the ` +
    `platform does, why, and the ways to reach what they asked for, each with its trade-off (RULE.DEVEX.AGENT.160, RULE.DEVEX.AGENT.161).` }];
}
