// RESTATES: RD.DEVEX.WORKSPACE.185, and `docs/04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md`.
// The register row and the chapter are the source of truth. A rule change is edited there first,
// then here, in the same change.
//
// What a workstream's work cost in tokens and in the model's own time, per workstream, arc and order.
//
//     spn-devex workspace tokens show [<workstream>] [--json] [--root <workspace>] [--projects <folder>]
//
// A SUBJECT WITH ONE ACTION. Its one word after the action is a workstream's number or name, which
// narrows the reading to that workstream. The workspace is `--root`, or the one the caller is in.
//
// THE JOIN IS BY SESSION, NEVER BY GUESSING. Each hook telemetry line in
// `.spndevex/.debug/telemetry/hooks.jsonl` carries `session`, and `workstream`, `arc`, `order` and
// `agent` where the tool call touched a workstream path (`plugin-support-lib/src/lib/timing.ts`). The Claude Code transcripts
// sit in `~/.claude/projects/<the workspace's project folder>/`: `<session>.jsonl` for the main
// window, and `<session>/subagents/**/*.jsonl` for each agent it launched.
//
// ONE REPLY IS COUNTED ONCE. A transcript writes one line per content block of a reply, and every
// line repeats the reply's `usage`. So replies are keyed by `message.id`, and a repeated line adds
// nothing. Where two lines of one reply disagree, the larger count of each field is kept, because a
// streamed reply's last line carries its final output count.
//
// WHICH WORK A REPLY BELONGS TO. A reply is written before the tool call it asks for, and the hook
// that tags that call runs just after it. So a reply takes the tag of the first tagged telemetry line
// of its own session and agent at or after its time, and a reply after the last tagged line takes
// the last one. A subagent's replies are joined to the lines that carry its `agent`, the main
// window's to the lines that carry none.
//
// A SESSION WITH NO TAGGED LINE IS "untagged", never guessed. A transcript whose session has no
// telemetry line at all is outside the log's window (the log restarts past its size cap, and it
// records only while the switch is on), so it is counted, not read.
//
// THE MODEL'S OWN TIME IS READ FROM THE TRANSCRIPT. Every `user` and `assistant` line carries
// `timestamp` in UTC to the millisecond, and no other line is read for time. The time before a line
// is counted by what the line is: before a reply it is the model's, before a tool result it is a
// tool's, and before a prompt it is time spent waiting for the developer. So the three add up to the
// span of one transcript, first stamped line to last. Each stretch takes its tag the way a reply
// does. An agent's transcript runs while its window waits on the tool that launched it, so an agent's
// time is also inside its window's tool time, and the three do not add up across transcripts.

import { closeSync, existsSync, openSync, readSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { type Action, FLAG, UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";

type Tag = { workstream: string | null; arc: string | null; order: string | null };
type TelemetryLine = Tag & { session: string; agent: string | null; at: number };
type Usage = { input: number; cacheWrite: number; cacheRead: number; output: number };
/** Time by who spent it: the model replying, a tool running, the developer not yet prompting. */
type Time = { modelMs: number; toolMs: number; waitingMs: number };
type Reply = Usage & { session: string; agent: string | null; at: number };
/** The time before one transcript line, which ends at `at` and is of the kind the line makes it. */
type Stretch = { session: string; agent: string | null; at: number; kind: keyof Time; ms: number };
export type Row = Tag & Usage & Time & { replies: number };
export type Report = {
  root: string; projects: string; filter: string | null;
  sessions: number; noTranscript: number; transcripts: number; replies: number; repeatedLines: number;
  outsideWindow: number;
  rows: Row[]; untagged: Usage & Time & { replies: number; sessions: number }; total: Usage & Time & { replies: number };
};

const ZERO = (): Usage & Time => ({ input: 0, cacheWrite: 0, cacheRead: 0, output: 0, modelMs: 0, toolMs: 0, waitingMs: 0 });

function workspaceRoot(start: string): string | null {
  try {
    let path = resolve(start);
    for (;;) {
      if (existsSync(join(path, ".spndevex"))) return path;
      const up = dirname(path);
      if (up === path) return null;
      path = up;
    }
  } catch { return null; }
}

/** Claude Code's project folder for a workspace: its absolute path with every other character a dash. */
export function projectFolder(root: string, home = process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude")): string {
  return join(home, "projects", resolve(root).replace(/[^A-Za-z0-9]/g, "-"));
}

/** Every line of a file, read in chunks so a transcript of any size fits. */
function forEachLine(path: string, visit: (line: string) => void): void {
  let fd: number;
  try { fd = openSync(path, "r"); } catch { return; }
  try {
    const chunk = Buffer.alloc(4 * 1024 * 1024);
    let carry = "";
    for (;;) {
      const read = readSync(fd, chunk, 0, chunk.length, null);
      if (read <= 0) break;
      const text = carry + chunk.subarray(0, read).toString("utf8");
      const lines = text.split("\n");
      carry = lines.pop() ?? "";
      for (const line of lines) visit(line);
    }
    if (carry) visit(carry);
  } finally { closeSync(fd); }
}

/** The telemetry log's lines, with `at` read as UTC. A line the writer could not have produced is skipped. */
export function readTelemetry(root: string): TelemetryLine[] {
  const out: TelemetryLine[] = [];
  forEachLine(join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), (line) => {
    if (!line.trim()) return;
    try {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      if (typeof parsed.session !== "string" || !parsed.session) return;
      // `at` is UTC ending in Z; a line written before the zone was added carries none, and is UTC too.
      const written = String(parsed.at ?? "");
      const at = Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(written) ? written : `${written}Z`);
      if (Number.isNaN(at)) return;
      const text = (value: unknown) => (typeof value === "string" && value ? value : null);
      out.push({ session: parsed.session, agent: text(parsed.agent), at,
                 workstream: text(parsed.workstream), arc: text(parsed.arc), order: text(parsed.order) });
    } catch { /* a torn line from a truncated write */ }
  });
  return out;
}

/** A session's transcripts: the main window's file, and every subagent file under its folder. */
function transcriptsOf(projects: string, session: string): string[] {
  const out: string[] = [];
  const main = join(projects, `${session}.jsonl`);
  if (existsSync(main)) out.push(main);
  const walk = (dir: string) => {
    let entries: string[] = [];
    try { entries = readdirSync(dir); } catch { return; }
    for (const entry of entries) {
      const path = join(dir, entry);
      let isDir = false;
      try { isDir = statSync(path).isDirectory(); } catch { continue; }
      if (isDir) walk(path);
      else if (entry.endsWith(".jsonl")) out.push(path);
    }
  };
  walk(join(projects, session, "subagents"));
  return out;
}

/** What the time before a transcript line was spent on: the line is a reply, a tool result, or a prompt. */
function kindOf(entry: Record<string, any>): keyof Time {
  if (entry.type === "assistant") return "modelMs";
  const content = entry.message?.content;
  return Array.isArray(content) && content.some((part) => part?.type === "tool_result") ? "toolMs" : "waitingMs";
}

/**
 * Every assistant reply in the given transcripts, keyed by `message.id` so a reply written over
 * several lines is counted once, and the stretch of time before each stamped `user` and `assistant`
 * line. Returns the replies, how many repeated lines were set aside, and the stretches.
 */
export function readReplies(files: string[]): { replies: Map<string, Reply>; repeatedLines: number; stretches: Stretch[] } {
  const replies = new Map<string, Reply>();
  const stretches: Stretch[] = [];
  let repeatedLines = 0;
  for (const file of files) {
    const fromName = basename(file).match(/^agent-([A-Za-z0-9]+)\.jsonl$/)?.[1] ?? null;
    const under = file.indexOf("/subagents/");
    const sessionFromPath = under >= 0 ? basename(file.slice(0, under)) : basename(file, ".jsonl");
    const stamped: Array<Omit<Stretch, "ms">> = [];
    forEachLine(file, (line) => {
      if (!line.includes('"assistant"') && !line.includes('"user"')) return;
      let parsed: Record<string, any>;
      try { parsed = JSON.parse(line); } catch { return; }
      if (parsed.type !== "assistant" && parsed.type !== "user") return;
      const session = typeof parsed.sessionId === "string" ? parsed.sessionId : sessionFromPath;
      const agent = typeof parsed.agentId === "string" && parsed.agentId ? parsed.agentId : fromName;
      const stamp = Date.parse(String(parsed.timestamp ?? ""));
      // A window's own file is one timeline: an agent's line written into it belongs to the agent's.
      if (!Number.isNaN(stamp) && (under >= 0 || parsed.isSidechain !== true))
        stamped.push({ session, agent, at: stamp, kind: kindOf(parsed) });
      if (parsed.type !== "assistant") return;
      const message = parsed.message ?? {};
      const id = typeof message.id === "string" ? message.id : null;
      const usage = message.usage;
      if (!id || !usage) return;
      const count = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
      const reply: Reply = {
        session, agent,
        at: stamp || 0,
        input: count(usage.input_tokens), cacheWrite: count(usage.cache_creation_input_tokens),
        cacheRead: count(usage.cache_read_input_tokens), output: count(usage.output_tokens),
      };
      const seen = replies.get(id);
      if (!seen) { replies.set(id, reply); return; }
      repeatedLines += 1;
      seen.input = Math.max(seen.input, reply.input);
      seen.cacheWrite = Math.max(seen.cacheWrite, reply.cacheWrite);
      seen.cacheRead = Math.max(seen.cacheRead, reply.cacheRead);
      seen.output = Math.max(seen.output, reply.output);
    });
    stamped.sort((earlier, later) => earlier.at - later.at);
    for (let index = 1; index < stamped.length; index += 1)
      stretches.push({ ...stamped[index], ms: stamped[index].at - stamped[index - 1].at });
  }
  return { replies, repeatedLines, stretches };
}

/** Whether a tag's workstream is the one asked for: `008` and `008-plain-language` both name it. */
export function matchesWorkstream(workstream: string | null, filter: string | null): boolean {
  if (!filter) return true;
  if (!workstream) return false;
  return workstream === filter || workstream.startsWith(`${filter}-`);
}

const tagged = (line: TelemetryLine) => Boolean(line.workstream);
const keyOf = (session: string, agent: string | null) => `${session} ${agent ?? ""}`;

/** The tag a reply belongs to, or `null` where its session and agent carry no tagged line. */
export function tagFor(reply: { at: number }, lines: TelemetryLine[]): Tag | null {
  if (!lines.length) return null;
  const second = Math.floor(reply.at / 1000) * 1000;
  const after = lines.find((line) => line.at >= second) ?? lines[lines.length - 1];
  return { workstream: after.workstream, arc: after.arc, order: after.order };
}

/** The whole reading: telemetry joined to transcripts, summed per workstream, arc and order. */
export function report(root: string, projects: string, filter: string | null): Report {
  const telemetry = readTelemetry(root);
  const bySession = new Map<string, TelemetryLine[]>();
  for (const line of telemetry) bySession.set(line.session, [...(bySession.get(line.session) ?? []), line]);

  // The sessions worth reading: every session with a line tagged for the work asked about, and every
  // session with no tagged line at all, which is reported as untagged.
  const sessions = [...bySession.entries()]
    .filter(([, lines]) => !lines.some(tagged) || lines.some((line) => tagged(line) && matchesWorkstream(line.workstream, filter)))
    .map(([session]) => session);

  const found = sessions.map((session) => transcriptsOf(projects, session));
  const files = found.flat();
  // A session the log names whose transcript is not in this project folder: a window rooted in a
  // member repository writes to that repository's folder, and a test writes none.
  const noTranscript = found.filter((one) => one.length === 0).length;
  const { replies, repeatedLines, stretches } = readReplies(files);

  const lanes = new Map<string, TelemetryLine[]>();
  for (const line of telemetry.filter(tagged)) {
    const key = keyOf(line.session, line.agent);
    lanes.set(key, [...(lanes.get(key) ?? []), line]);
  }
  for (const lane of lanes.values()) lane.sort((a, b) => a.at - b.at);

  const rows = new Map<string, Row>();
  const untagged = { ...ZERO(), replies: 0, sessions: 0 };
  const total = { ...ZERO(), replies: 0 };
  const add = (into: Usage & { replies: number }, reply: Reply) => {
    into.input += reply.input; into.cacheWrite += reply.cacheWrite;
    into.cacheRead += reply.cacheRead; into.output += reply.output; into.replies += 1;
  };
  const rowOf = (tag: Tag): Row => {
    const key = JSON.stringify([tag.workstream, tag.arc, tag.order]);
    const row = rows.get(key) ?? { workstream: tag.workstream, arc: tag.arc, order: tag.order, ...ZERO(), replies: 0 };
    rows.set(key, row);
    return row;
  };
  const untaggedSeen = new Set<string>();
  for (const reply of replies.values()) {
    const tag = tagFor(reply, lanes.get(keyOf(reply.session, reply.agent)) ?? []);
    if (!tag) {
      // No tagged line for this session and agent: a session that touched no workstream path, or
      // an agent of a tagged session whose own calls touched none. Counted, never assigned.
      add(untagged, reply); add(total, reply); untaggedSeen.add(reply.session);
      continue;
    }
    if (!matchesWorkstream(tag.workstream, filter)) continue;
    add(total, reply);
    // A reply is counted once, at its most specific level; the printed tree sums upward.
    add(rowOf(tag), reply);
  }
  untagged.sessions = untaggedSeen.size;
  // A stretch of time is joined as a reply is: by its session and agent, to the tagged line that follows it.
  for (const stretch of stretches) {
    const tag = tagFor(stretch, lanes.get(keyOf(stretch.session, stretch.agent)) ?? []);
    if (!tag) { untagged[stretch.kind] += stretch.ms; total[stretch.kind] += stretch.ms; continue; }
    if (!matchesWorkstream(tag.workstream, filter)) continue;
    total[stretch.kind] += stretch.ms;
    rowOf(tag)[stretch.kind] += stretch.ms;
  }

  let outsideWindow = 0;
  try {
    outsideWindow = readdirSync(projects)
      .filter((entry) => entry.endsWith(".jsonl") && !bySession.has(entry.slice(0, -".jsonl".length))).length;
  } catch { outsideWindow = 0; }

  const sorted = [...rows.values()].sort((a, b) =>
    String(a.workstream).localeCompare(String(b.workstream)) ||
    String(a.arc ?? "").localeCompare(String(b.arc ?? ""), undefined, { numeric: true }) ||
    String(a.order ?? "").localeCompare(String(b.order ?? "")));
  return { root, projects, filter, sessions: sessions.length - noTranscript, noTranscript, transcripts: files.length, replies: replies.size,
           repeatedLines, outsideWindow, rows: sorted, untagged, total };
}

const n = (value: number) => value.toLocaleString("en-US");
const minutes = (ms: number) => `${(ms / 60000).toFixed(1)} min`;
const cells = (usage: Usage & Time & { replies: number }) =>
  n(usage.replies).padStart(8) + n(usage.input).padStart(13) + n(usage.cacheWrite).padStart(15) +
  n(usage.cacheRead).padStart(17) + n(usage.output).padStart(13) + minutes(usage.modelMs).padStart(14);

/** The tree a reader reads: each workstream, its arcs under it, each arc's orders under that. */
function print(result: Report): void {
  console.log(`workspace tokens${result.filter ? ` — ${result.filter}` : ""} · ${result.sessions} session(s) joined` +
    `${result.noTranscript ? ` (${result.noTranscript} more in the log have no transcript here)` : ""} · ` +
    `${result.transcripts} transcript(s) · ${n(result.replies)} replies counted once ` +
    `(${n(result.repeatedLines)} repeated lines not counted again)`);
  console.log(`telemetry ${join(result.root, ".spndevex", ".debug", "telemetry", "hooks.jsonl")} · transcripts ${result.projects}\n`);
  console.log("Work".padEnd(48) + "Replies".padStart(8) + "Input".padStart(13) + "Cache write".padStart(15) +
    "Cache read".padStart(17) + "Output".padStart(13) + "Model time".padStart(14));
  const sum = (rows: Row[]) => rows.reduce((acc, row) => {
    acc.input += row.input; acc.cacheWrite += row.cacheWrite; acc.cacheRead += row.cacheRead;
    acc.output += row.output; acc.replies += row.replies;
    acc.modelMs += row.modelMs; acc.toolMs += row.toolMs; acc.waitingMs += row.waitingMs; return acc;
  }, { ...ZERO(), replies: 0 });
  const label = (text: string, indent: number) => (" ".repeat(indent) + text).slice(0, 47).padEnd(48);
  const workstreams = [...new Set(result.rows.map((row) => row.workstream))];
  for (const workstream of workstreams) {
    const mine = result.rows.filter((row) => row.workstream === workstream);
    console.log(label(String(workstream), 0) + cells(sum(mine)));
    const arcs = [...new Set(mine.map((row) => row.arc))];
    for (const arc of arcs) {
      const ofArc = mine.filter((row) => row.arc === arc);
      console.log(label(arc ?? "(no arc)", 2) + cells(sum(ofArc)));
      if (arc === null) continue;
      for (const row of ofArc.filter((one) => one.order !== null))
        console.log(label(String(row.order), 4) + cells(row));
      const loose = ofArc.filter((one) => one.order === null);
      if (loose.length && loose.length !== ofArc.length) console.log(label("(no order)", 4) + cells(sum(loose)));
    }
  }
  console.log(label(`untagged (${result.untagged.sessions} session(s))`, 0) + cells(result.untagged));
  console.log(label("total", 0) + cells(result.total));
  console.log(`\ntime · the model ${minutes(result.total.modelMs)} · the tools ${minutes(result.total.toolMs)} · ` +
    `waiting on a prompt ${minutes(result.total.waitingMs)} — an agent's time is also inside its window's tool time`);
  if (result.outsideWindow)
    console.log(`\n${result.outsideWindow} transcript(s) in the project folder have no telemetry line at all — ` +
      `outside the log's window, so not read.`);
}

export const describe = "tokens and the model's own time per workstream, arc and order, joining hook telemetry to the transcripts by session";

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG, root: VALUE, projects: VALUE });
  if (words.paths.length > 1) throw new UsageFault("takes one workstream.");
  const filter = words.paths[0] ?? null;
  const root = resolve(words.value("root") ?? workspaceRoot(process.cwd()) ?? process.cwd());
  if (!existsSync(join(root, ".spndevex")))
    throw new UsageFault(`needs a workspace, and ${root} is none. Run it inside one, or pass \`--root <workspace>\`.`);
  const projects = resolve(words.value("projects") ?? projectFolder(root));
  const result = report(root, projects, filter);
  if (words.given("json")) console.log(JSON.stringify(result, null, 2));
  else print(result);
  return 0;
}

export const actions: Record<string, Action> = {
  show: {
    describe: "print tokens and the model's own time per workstream, arc and order; with --json, as data",
    usage: "[<workstream>] [--json] [--root <workspace>] [--projects <folder>]",
    run: show,
  },
};
