#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § `How` ends in Cycles, and the arcs are the state
//           docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc's status says which of eight states it is in
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// Print a workstream's Cycles table, read from its arcs: one row per arc, in the order the arcs run.
//
//   spn-devex docs cycles <workstream> [--json]
//
// <workstream> is the workstream's folder, its approach page, its number (`016`) or its folder name
// (`016-provider-secret-storage`), looked up in `.spndevex/workstreams/{open,backlog,closed}/`.
//
// It writes no file: the agent pastes the rows, and `doc-check` compares the page with `cyclesOf` (N116, D2).

import { basename, dirname, join, resolve } from "node:path";
import { STATUSES } from "../../checks/arc-status.ts";
import { DEVEX, isDir, isFile, listdir, read, workspaceRoot } from "../../lib/payload.ts";
import { begin, end, record } from "../../lib/timing.ts";

export const describe = "print a workstream's Cycles table from its arcs — one row per arc, with its status";

/** One row of Cycles, and the file it was read from. */
export type Cycle = {
  id: string | null;       // `N12`, `N1a` — from the file name; null for an arc file that carries none
  name: string;            // the heading, without the number
  does: string;            // one line: what the arc changes
  status: string | null;   // one of STATUSES, or null where the arc states none the set knows
  detail: string;          // the blocker, destination or reason a HELD, CARRIED or DROPPED arc carries
  file: string;
};

const STATES = ["open", "backlog", "closed"];
const MUST_CARRY = new Set(["HELD", "CARRIED", "DROPPED"]);
// Longest word first, so `PART-LANDED` is never read as `LANDED`.
const BY_LENGTH = [...STATUSES].sort((a, b) => b.length - a.length);
const ARC_ID = /^(N\d+[a-z]?)(?=-|\.md$)/i;
const STATUS_LINE = /^\s*\*{0,2}Status:?\*{0,2}\s*/i;

/** Markdown as a person reads it: links to their text, code and emphasis marks gone, spaces collapsed. */
function plain(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The status word at the start of a text, or null. `HELD on Q5` and `HELD · no account` both read HELD. */
export function statusWord(text: string): string | null {
  const head = plain(text).toUpperCase();
  return BY_LENGTH.find((word) => new RegExp(`^${word}(?![A-Z-])`).test(head)) ?? null;
}

/** The arc number a file name carries, or null. `N7-N8-flip-and-close.md` is `N7`. */
export function arcId(file: string): string | null {
  const found = ARC_ID.exec(basename(file));
  return found ? found[1].charAt(0).toUpperCase() + found[1].slice(1) : null;
}

/** The first sentence of a text. */
function firstSentence(text: string): string {
  return text.split(/(?<=[.!?])\s+(?=[A-Z"“(])/)[0]?.trim() ?? "";
}

/**
 * One arc file, read into its Cycles row. Arc: the number in the file name and the name in the
 * heading. What it does: the first sentence after the bold status, which the arc template reserves
 * for what the arc changes, or else the `Decides` field. Status: the word, then what a HELD, CARRIED
 * or DROPPED arc must also carry.
 */
export function cycleOf(file: string, text: string): Cycle {
  const lines = text.split("\n");
  const heading = lines.find((line) => /^#\s/.test(line)) ?? "";
  const id = arcId(file);
  const name = plain(heading.replace(/^#\s+/, ""))
    .replace(/^(?:Arc\s*)?(?:N?\d+[a-z]?)?\s*[—–:-]\s*/i, "")
    .trim() || basename(file, ".md");

  // The status line is a paragraph: a long one wraps, and the sentence after the status may sit on
  // the next line. It ends at the first blank line or the next field line.
  const at = lines.findIndex((line) => STATUS_LINE.test(line));
  const paragraph: string[] = [];
  for (let i = at; at >= 0 && i < lines.length; i += 1) {
    if (i > at && (!lines[i].trim() || /^\s*(?:Repos?:|\||#|>|<!--)/.test(lines[i]))) break;
    paragraph.push(lines[i]);
  }
  const afterLabel = paragraph.join(" ").replace(STATUS_LINE, "");
  // The bold span is the status itself; what follows it on the same line says what the arc changes.
  const bold = /^\*\*([^*]*)\*\*(.*)$/.exec(afterLabel.trim());
  const statusText = bold ? bold[1] : afterLabel;
  const status = statusWord(statusText);
  const rest = bold ? bold[2] : "";

  let detail = "";
  if (status && MUST_CARRY.has(status))
    detail = plain(statusText).slice(status.length).replace(/^[\s—–:·,-]+/, "").replace(/[.\s]+$/, "");

  // What precedes the sentence is bookkeeping the status already carries: a date, or when it opened.
  let does = firstSentence(plain(rest)
    .replace(/^[\s,.;:·—–-]+/, "")
    .replace(/^\d{4}-\d{2}-\d{2}\.?\s*/, "")
    .replace(/^Opened\b[^.]*\.\s*/i, ""));
  if (!does) {
    const decides = lines.find((line) => /^\|\s*\*{0,2}Decides\*{0,2}\s*\|/.test(line));
    if (decides) does = firstSentence(plain(decides.split("|")[2] ?? ""));
  }
  return { id, name, does, status, detail, file };
}

/** The order arcs run in: by number, then by the letter after it; an arc with no number last. */
function runOrder(a: Cycle, b: Cycle): number {
  if (a.id && !b.id) return -1;
  if (!a.id && b.id) return 1;
  if (a.id && b.id) {
    const [, an, al] = /^N(\d+)([a-z]?)$/i.exec(a.id)!;
    const [, bn, bl] = /^N(\d+)([a-z]?)$/i.exec(b.id)!;
    if (Number(an) !== Number(bn)) return Number(an) - Number(bn);
    if (al !== bl) return al < bl ? -1 : 1;
  }
  return basename(a.file) < basename(b.file) ? -1 : basename(a.file) > basename(b.file) ? 1 : 0;
}

/** Every arc of a workstream folder, as Cycles rows in run order. A folder with no `arcs/` has none. */
export function cyclesOf(folder: string): Cycle[] {
  const arcs = join(folder, "arcs");
  if (!isDir(arcs)) return [];
  return listdir(arcs)
    .filter((entry) => entry.endsWith(".md") && isFile(join(arcs, entry)))
    .map((entry) => cycleOf(join(arcs, entry), read(join(arcs, entry))))
    .sort(runOrder);
}

/** The Arc cell as a person reads it: `N12 — the name`. */
export function arcLabel(cycle: Cycle): string {
  return cycle.id ? `${cycle.id} — ${cycle.name}` : cycle.name;
}

/** The Status cell: the word, then what a HELD, CARRIED or DROPPED arc must also carry. */
export function statusLabel(cycle: Cycle): string {
  if (!cycle.status) return "(no status)";
  return cycle.detail ? `${cycle.status} · ${cycle.detail}` : cycle.status;
}

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/—/g, "&mdash;").replace(/·/g, "&middot;");

/** The table the approach template's Cycles subsection carries, ready to replace it. */
export function tableOf(cycles: Cycle[]): string {
  const rows = cycles.map((cycle) =>
    `      <tr><td><strong>${escape(arcLabel(cycle))}</strong></td><td>${escape(cycle.does)}</td><td>${escape(statusLabel(cycle))}</td></tr>`);
  return [
    `  <div class="scroll"><table>`,
    `    <thead><tr><th>Arc</th><th>What it does</th><th>Status</th></tr></thead>`,
    `    <tbody>`,
    ...rows,
    `    </tbody>`,
    `  </table></div>`,
  ].join("\n");
}

/**
 * The workstream folder an argument names: a folder, an approach page inside one, or a number or
 * folder name looked up under the workspace's workstreams. Null where none matches.
 */
export function workstreamFolder(target: string, workspace: string | null): string | null {
  const direct = resolve(target);
  if (isDir(direct)) return direct;
  if (isFile(direct) && direct.endsWith("-approach.html")) return dirname(direct);
  if (!workspace) return null;
  for (const state of STATES) {
    const base = join(workspace, DEVEX, "workstreams", state);
    const found = listdir(base).find((entry) => entry === target || entry.startsWith(`${target}-`));
    if (found && isDir(join(base, found))) return join(base, found);
  }
  return null;
}

function body(args: string[], workspace: string | null): number {
  const json = args.includes("--json");
  const target = args.find((arg) => !arg.startsWith("--"));
  if (!target) { console.error("usage: spn-devex docs cycles <workstream> [--json]"); return 2; }
  const folder = workstreamFolder(target, workspace);
  if (!folder) {
    console.error(`no workstream \`${target}\` — name its folder, its approach page, or its number, ` +
      `as \`spnutils workspace status\` lists it`);
    return 2;
  }
  const cycles = cyclesOf(folder);
  if (!cycles.length) { console.error(`${basename(folder)} has no arcs — an empty \`arcs/\` has no Cycles yet`); return 1; }
  if (json) {
    console.log(JSON.stringify(cycles.map((cycle) => ({
      arc: arcLabel(cycle), does: cycle.does, status: statusLabel(cycle), file: basename(cycle.file) })), null, 2));
  } else {
    console.log(tableOf(cycles));
  }
  // An arc whose status the set does not know is printed and named, never guessed at: the row still
  // appears, and the arc is the file to fix.
  for (const cycle of cycles.filter((c) => !c.status))
    console.error(`! ${basename(cycle.file)} states no status the set knows (${STATUSES.join(" · ")})`);
  return 0;
}

export function run(args: string[]): number {
  const workspace = process.env.SPN_WORKSPACE ?? workspaceRoot(process.cwd());
  const startedAt = performance.now();
  begin({ event: process.env.CLAUDE_HOOK_EVENT ?? "command", tool: null, session: process.env.CLAUDE_SESSION_ID ?? null }, workspace ?? undefined);
  const code = body(args, workspace);
  record("docs-cycles", performance.now() - startedAt);
  end();
  return code;
}

if (process.argv[1] && basename(process.argv[1]) === "cycles.ts")
  process.exit(run(process.argv.slice(2)));
