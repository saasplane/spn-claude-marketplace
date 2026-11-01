// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A go's first plan and each release part wait for a panel's verdict on record (RULE.DEVEX.WORKSPACE.485)
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// A review panel's verdict, read from the transcript of the helper that gave it, for `events/subagentstop.ts` to record.
//
// THE PANEL IS KNOWN BY ITS AGENT TYPE: the payload's `agent_type`, else the `agentType` of the `.meta.json` beside the
// transcript, is `spn-devex:spn-panel` or ends in `spn-panel`. Its LENS is the one named beside the word "lens" in its first prompt, else the first lens word in it, its
// VERDICT the first line of its last reply, and its WORK the workstream, arc and part its first prompt names, else the
// main window's carried ones. A reply whose first line is none of the three verdicts writes no row.
//
//   called by: events/subagentstop.ts

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { readFrom, contentText } from "./usage.ts";
import { WORKSTREAM_STATES, workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { ARC_PATTERN, PART_PATTERN, WORKSTREAM_PATTERN, SPDevExAgentLensType, SPDevExAgentPanelVerdictType, held } from "../../../../plugin-support-lib/src/lib/telemetry-values.ts";

/** The panel agent's type, and the suffix every spelling of it ends in. */
export const PANEL_AGENT = "spn-devex:spn-panel";
const PANEL_SUFFIX = "spn-panel";
/** How much of a transcript's head is read to find its first prompt. */
const HEAD_BYTES = 256 * 1024;

/** Whether an agent type names the review panel. */
export const isPanelType = (type: unknown): boolean => typeof type === "string" && (type === PANEL_AGENT || type.endsWith(PANEL_SUFFIX));

/** The `.meta.json` beside a transcript: its path with `.jsonl` replaced. */
export const metaOf = (transcript: string): string => transcript.replace(/\.jsonl$/, ".meta.json");

/** Whether the helper that stopped is the review panel: by the payload's `agent_type`, else by the `agentType` in the meta file beside its transcript. */
export function isPanel(event: { agent_type?: string; agent_transcript_path?: string }): boolean {
  if (typeof event.agent_type === "string" && event.agent_type) return isPanelType(event.agent_type);
  try {
    const meta = event.agent_transcript_path ? metaOf(event.agent_transcript_path) : "";
    return !!meta && existsSync(meta) && isPanelType((JSON.parse(readFileSync(meta, "utf8")) as { agentType?: string }).agentType);
  } catch { return false; }
}

/** The text of a helper's first prompt: its first `type:"user"` line. Empty where the transcript cannot be read. */
export function firstPrompt(transcript: string | undefined): string {
  try {
    if (!transcript || !existsSync(transcript)) return "";
    for (const line of (readFrom(transcript, 0, HEAD_BYTES)?.text ?? "").split("\n")) {
      if (!line.includes('"user"')) continue;
      try {
        const entry = JSON.parse(line) as { type?: string; message?: { content?: unknown } };
        if (entry.type === "user") return contentText(entry.message?.content);
      } catch { /* a torn line is skipped */ }
    }
  } catch { /* nothing read */ }
  return "";
}

/** The first line of a helper's last assistant text, markup and leading marks taken off. Empty where it wrote none. */
export function lastFirstLine(transcript: string | undefined): string {
  try {
    if (!transcript || !existsSync(transcript)) return "";
    let last = "";
    for (const line of readFileSync(transcript, "utf8").split("\n")) {
      if (!line.includes('"assistant"')) continue;
      try {
        const entry = JSON.parse(line) as { type?: string; message?: { content?: unknown } };
        if (entry.type !== "assistant" || !Array.isArray(entry.message?.content)) continue;
        for (const part of entry.message.content as Array<{ type?: string; text?: string }>) if (part.type === "text" && part.text?.trim()) last = part.text;
      } catch { /* a torn line is skipped */ }
    }
    return (last.split("\n").find((one) => one.trim()) ?? "").replace(/^[^A-Za-z]+/, "").trim();
  } catch { return ""; }
}

/** The verdict a panel's last reply opens with, as the contract's value, or null where it opens with none of the three. */
export function verdictOf(firstLine: string): string | null {
  const text = firstLine.toLowerCase();
  if (/^blocked\b/.test(text)) return SPDevExAgentPanelVerdictType.BLOCKED;
  if (/^pass with advice\b/.test(text)) return SPDevExAgentPanelVerdictType.PASS_WITH_ADVICE;
  if (/^pass\b/.test(text)) return SPDevExAgentPanelVerdictType.PASS;
  return null;
}

/** A lens as the pattern a prompt writes it: `SERVER_DEV` also reads `server-dev` and `server dev`. */
const patternOf = (lens: string): string => lens.split("_").join("[-_ ]");
/** A lens as a whole word of a prompt. */
const wordOf = (lens: string): RegExp => new RegExp(`(?<![A-Za-z0-9])${patternOf(lens)}(?![A-Za-z0-9])`, "i");
/** A lens named beside the word "lens": `lens: architect`, `Lens ARCHITECT`, `the architect lens`, `through the infra lens`. */
const besideLens = (lens: string): RegExp => new RegExp(
  `(?<![A-Za-z0-9])lens(?![A-Za-z0-9])[\\s:=\\u2014-]*(?:of\\s+|the\\s+)?${patternOf(lens)}(?![A-Za-z0-9])|(?<![A-Za-z0-9])${patternOf(lens)}\\s+lens(?![A-Za-z0-9])`, "i");

/** The earliest lens a prompt names by `pattern`, as the contract's value, or null. */
function earliest(prompt: string, pattern: (lens: string) => RegExp): string | null {
  let best: { at: number; lens: string } | null = null;
  for (const lens of Object.values(SPDevExAgentLensType)) {
    const at = pattern(lens).exec(prompt)?.index;
    if (at !== undefined && (!best || at < best.at)) best = { at, lens };
  }
  return best?.lens ?? null;
}

/** The lens a prompt names: the one beside the word "lens" first, else the earliest lens word. Null where it names none. */
export const lensOf = (prompt: string): string | null => earliest(prompt, besideLens) ?? earliest(prompt, wordOf);

/** A workstream number's folder name in an open or backlog workstream, else the name given. */
function workstreamNamed(root: string, name: string): string | null {
  if (/^\d{3}-/.test(name)) return held(name, WORKSTREAM_PATTERN);
  for (const state of WORKSTREAM_STATES) {
    try { const found = readdirSync(workstreamsDir(root, state)).find((one) => one.startsWith(`${name}-`)); if (found) return held(found, WORKSTREAM_PATTERN); } catch { /* none kept */ }
  }
  return null;
}

/** `<NNN-subject>/N<nnn>` or `<NNN>/N<nnn>`, and a go part id (`release-spn-foundation-1`), as a prompt names them. */
const ARC_REF = /(?<![\w/.-])(\d{3}(?:-[a-z0-9][a-z0-9-]*)?)\/(N\d{3})(?![\w])/;
const PART_REF = /(?<![\w/-])((?:baseline|docs|code|full|generated|release|proof)-[a-z0-9][a-z0-9-]*[a-z0-9])(?![\w/-])/;

/** The workstream, arc and part a panel's first prompt names; each is null where it names none. */
export function namedWork(root: string, prompt: string): { workstream: string | null; arc: string | null; part: string | null } {
  const ref = ARC_REF.exec(prompt);
  return {
    workstream: ref ? workstreamNamed(root, ref[1]) : null,
    arc: ref ? held(ref[2], ARC_PATTERN) : null,
    part: held(PART_REF.exec(prompt)?.[1], PART_PATTERN),
  };
}

/** How long the helper ran, in milliseconds: from the first stamp of its transcript to the last. Zero where it holds fewer than two. */
export function elapsedOf(transcript: string | undefined): number {
  try {
    if (!transcript || !existsSync(transcript)) return 0;
    const stamps = [...readFileSync(transcript, "utf8").matchAll(/"timestamp":"([^"]+)"/g)].map((one) => Date.parse(one[1])).filter((one) => !Number.isNaN(one));
    return stamps.length > 1 ? Math.max(0, Math.max(...stamps) - Math.min(...stamps)) : 0;
  } catch { return 0; }
}
