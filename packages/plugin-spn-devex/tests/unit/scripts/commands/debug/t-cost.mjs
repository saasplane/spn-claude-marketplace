// `debug cost show <target>` — what a target cost, read from `usage.jsonl` alone (RULE.DEVEX.AGENT.082,
// RULE.DEVEX.WORKSPACE.323): the five targets, each reply once, the rotated log and the live one, money from the
// price table and null for a model it lacks, and the window the command runs in found from its start file. Every row is a version 1
// row read by its `mtype` (a TURN in usage.jsonl; a COMMAND, TEST or CHECK in hooks.jsonl); a row without v 1 is skipped. The time
// is read by stage (the stored stage, else the row's skill and work), by go (a block by work, the lead apart) and by window (working, waiting, or idle).
// `compare` reads two plugin versions, each found from the `pluginVersion` of its windows' SessionStart rows.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";

const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
const ENV = { ...process.env, SPN_TELEMETRY: "off" };
delete ENV.SPN_WORKSPACE;
/** `debug cost` typed with exactly these words from the workspace: what it printed, and its exit code. */
const typed = (root, ...words) => {
  try { return { out: execFileSync("node", [TOOL, "debug", "cost", ...words], { encoding: "utf8", stdio: "pipe", env: ENV, cwd: root }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};
const json = (root, target) => JSON.parse(typed(root, "show", target, "--json").out);
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const OPUS = "claude-opus-4-6-20260101", SONNET = "claude-sonnet-5-5";
let seq = 0;
/** A TURN row (version 1): its id is the reply's message id, which a log that repeats a reply repeats. */
const reply = (extra) => { const { turn, ...rest } = { turn: `m${(seq += 1)}`, ...extra }; const { input, cache_read, cache_write, output, ...head } = rest;
  return JSON.stringify({ v: 1, mtype: "TURN", id: turn, event: "Stop", at: "2026-10-10T10:00:00Z", session: "s1", agent: null, workstream: "031-compliance", arc: "N008",
    part: "code-spn-x-1", skill: null, work: null, retryOf: null, model: OPUS, ms: 60000,
    tokens: { in: input ?? 1000, out: output ?? 400, cacheRead: cache_read ?? 2000, cacheWrite: cache_write ?? 3000 }, ...head }); };

const root = realpathSync(mkdtempSync(join(tmpdir(), "debug-cost-")));
try {
  const telemetry = join(root, ".spndevex", ".debug", "telemetry");
  mkdirSync(telemetry, { recursive: true });
  mkdirSync(join(root, ".spndevex", "workstreams"), { recursive: true });
  // The rotated log first: older replies, one of which the live log repeats.
  const repeated = reply({ at: "2026-10-01T08:00:00Z", turn: "rotated-and-live", workstream: "030-older", arc: "N001", part: "docs-spn-x-1" });
  writeFileSync(join(telemetry, "usage.1.jsonl"), [
    repeated,
    reply({ at: "2026-10-01T09:00:00Z", workstream: "030-older", arc: "N001", part: "docs-spn-x-2" }),
    "{ not json — a torn line",
  ].join("\n") + "\n");
  const million = { input: 1e6, cache_read: 1e6, cache_write: 1e6, output: 1e6 };
  writeFileSync(join(telemetry, "usage.jsonl"), [
    repeated,
    reply({ turn: "same-reply", ...million }),
    reply({ turn: "same-reply", ...million }),
    reply({ part: "docs-spn-x-1", model: SONNET }),
    reply({ arc: "N009", part: null, model: "claude-mystery-9" }),
    reply({ workstream: "032-other", arc: "N001", part: "docs-spn-x-1", session: "s2" }),
    reply({ agent: "agent-aaa", session: "s1", model: SONNET }),
    reply({ agent: "agent-bbb", session: "s1", model: SONNET }),
    reply({ agent: "agent-aaa", session: "s2", model: SONNET }),
    // rows that are not version 1 TURN rows: the old shape (no v), a version 2, and another kind
    JSON.stringify({ at: "2026-10-10T10:00:00Z", session: "s1", agent: null, workstream: "031-compliance", arc: "N008", order: null, row: "50", turn: "old-shape", model: OPUS, ms: 60000, input: 1, cache_read: 1, cache_write: 1, output: 1 }),
    JSON.stringify({ v: 2, mtype: "TURN", id: "future", workstream: "031-compliance", arc: "N008", model: OPUS, ms: 1, tokens: { in: 1, out: 1, cacheRead: 1, cacheWrite: 1 } }),
    JSON.stringify({ v: 1, mtype: "COMMAND", id: "not-a-turn", workstream: "031-compliance", arc: "N008", model: OPUS, ms: 1 }),
  ].join("\n") + "\n");

  console.log("=== all — one line for each workstream");
  {
    const all = json(root, "all");
    const by = Object.fromEntries(all.rows.map((one) => [one.key, one]));
    ok("each workstream is a line, the older one from the rotated log first",
      all.rows.map((one) => one.key).join(" ") === "030-older 031-compliance 032-other", all.rows.map((one) => one.key).join(" "));
    ok("a reply in both logs is counted once, and a reply repeated across lines once", by["030-older"].replies === 2 && by["031-compliance"].replies === 6,
      JSON.stringify([by["030-older"].replies, by["031-compliance"].replies]));
    ok("the torn line is skipped without a crash", all.rows.reduce((sum, one) => sum + one.replies, 0) === 9);
    ok("[MKT.SCRIPTS.325] a row without v 1 as a TURN, of the old shape, of version 2 or of another kind, is skipped", by["031-compliance"].replies === 6 && by["031-compliance"].input !== undefined
      && all.rows.every((one) => one.key !== "(no workstream)"), JSON.stringify(by["031-compliance"]));
    ok("the earliest time is the first line of the rotated log", all.earliest === "2026-10-01T08:00:00Z", String(all.earliest));
    ok("the output says money is an estimate and dates the prices", all.estimate === true && all.pricesAsOf === "2026-10-06");
    ok("a line carries the four counts, the model time and the model", by["032-other"].input === 1000 && by["032-other"].cacheRead === 2000
      && by["032-other"].cacheWrite === 3000 && by["032-other"].output === 400 && by["032-other"].modelMs === 60000
      && by["032-other"].models.join() === OPUS, JSON.stringify(by["032-other"]));
    ok("money is the table's price of the counts, a date-suffixed id matching its base", Math.abs(by["032-other"].money - (1000 * 5 + 3000 * 6.25 + 2000 * 0.5 + 400 * 25) / 1e6) < 1e-9,
      String(by["032-other"].money));
    ok("a line holding a model the table lacks has money null, never a guess", by["031-compliance"].money === null && by["031-compliance"].models.includes("claude-mystery-9"));
    const printed = typed(root, "show", "all").out;
    ok("the printed table names the unknown money and says the prices are an estimate", /unknown/.test(printed) && /estimate/.test(printed) && /2026-10-01T08:00:00Z/.test(printed), printed);
  }

  console.log("\n=== <workstream> — one line for each arc");
  {
    const ws = json(root, "031-compliance");
    ok("an arc is a line", ws.rows.map((one) => one.key).join(" ") === "N008 N009", ws.rows.map((one) => one.key).join(" "));
    ok("the workstream's number names it too", json(root, "031").rows.length === 2);
    ok("a workstream no line names has no rows", json(root, "099-none").rows.length === 0);
    ok("and the printed form says so", /no usage for `099-none`/.test(typed(root, "show", "099-none").out));
  }

  console.log("\n=== <workstream>/N<nnn> — one line for each part");
  {
    const arc = json(root, "031-compliance/N008");
    const keys = arc.rows.map((one) => one.key);
    ok("[MKT.SCRIPTS.326] a part is one line, and a reply that names none is its own line", keys.join(" | ") === "part code-spn-x-1 | part docs-spn-x-1", keys.join(" | "));
    const code = arc.rows.find((one) => one.key === "part code-spn-x-1");
    ok("a part's line sums the replies of the window and of its children, once each", code.replies === 4, String(code.replies));
    ok("the arc's id is read in either case", json(root, "031-compliance/n008").rows.length === arc.rows.length);
  }

  console.log("\n=== window/<session> — the window and each child");
  {
    const window = json(root, "window/s1");
    ok("the window is the first line and each child its own", window.rows.map((one) => one.key).join(" ") === "window child agent-aaa child agent-bbb",
      window.rows.map((one) => one.key).join(" "));
    ok("another window's replies are not counted", window.rows.find((one) => one.key === "child agent-aaa").replies === 1);
  }

  console.log("\n=== window/this — the window the command runs in");
  {
    const none = typed(root, "show", "window/this");
    ok("with no start file for this command it is refused and names `debug window show <session>`", none.code === 2
      && none.out.includes("`debug window show <session>`") && none.out.includes("usage: spn-devex debug cost show <target> [--from <time>] [--to <time>] [--lead] [--json]"), none.out);
    const pending = join(root, ".spndevex", ".debug", "sessions", "s2", "pending");
    mkdirSync(pending, { recursive: true });
    // The pending file keeps the call and never its arguments, so the newest `debug cost show` start file is this one.
    const start = () => JSON.stringify({ at: Date.now(), background: false, found: [{ repo: null, call: { program: "spn-devex", group: "debug", action: "cost show" }, suite: false }] });
    writeFileSync(join(pending, "toolu_this.json"), start());
    const found = json(root, "window/this");
    ok("with one, the window is the one whose folder holds it", found.rows.map((one) => one.key).join(" ") === "window child agent-aaa", found.rows.map((one) => one.key).join(" "));
    const newer = join(root, ".spndevex", ".debug", "sessions", "s1", "pending");
    mkdirSync(newer, { recursive: true });
    const later = new Date(Date.now() + 60_000);
    writeFileSync(join(newer, "toolu_newest.json"), start());
    utimesSync(join(newer, "toolu_newest.json"), later, later);
    ok("the newest of several is the window", json(root, "window/this").rows.map((one) => one.key).join(" ") === "window child agent-aaa child agent-bbb");
  }

  console.log("\n=== <workstream> — the split of a small constructed day, from the hooks log alone");
  {
    // The marketplace is public, so no real telemetry is a fixture. This day is built from the kinds of call the 31 October measure
    // (`036-agent-follows-rules`, notes N010 `slowness-measure.md`) classes, each 30 seconds after the last: it proves that each kind
    // lands in the class the measure gives it. The "within 10%" reading of the real day is the work file
    // `036-agent-follows-rules/notes/N011/work/cost-split-vs-measure.md` (MKT.HOOKS.321); it needs the real log, so no case here holds it.
    const T0 = Date.parse("2026-10-31T10:00:00Z");
    const stamp = (seconds) => new Date(T0 + seconds * 1000).toISOString().slice(0, 19) + "Z";
    const lines = [];
    let n = 0;
    const head = (mtype, seconds, agent, part) => ({ v: 1, mtype, id: `d${(n += 1)}`, event: "PostToolUse", at: stamp(seconds), session: "d1", agent, workstream: "040-split", arc: "N011", part,
      skill: null, work: null, retryOf: null });
    const LEAD = "code-spn-x-1", CHILD = "docs-spn-x-1";
    const command = (seconds, call, extra = {}, agent = null, part = agent ? CHILD : LEAD) => lines.push({ ...head("COMMAND", seconds, agent, part), call, ms: 5, exit: 0, ...extra });
    // One call every 30 seconds, the kinds the 31 October measure classes, in the rows the hooks now write: a command, a test run, a refusing check.
    command(30, { program: "spn-devex", group: "workstream", action: "row state" });                         // managing
    lines.push({ ...head("CHECK", 60, null, LEAD), event: "PreToolUse", check: "command-shape", verdict: "DENY", ms: 5, out: 100 }); // a refusal
    command(90, { program: "spn-devex", group: "workstream", action: "row state" }, { retryOf: "d1" });      // its retry: a refusal
    command(120, { program: "git", group: null, action: "log" });                                             // reading
    lines.push({ ...head("TEST", 150, null, LEAD), tier: "unit", node: "api", verdict: "pass" });             // proof
    command(180, { program: "spn-devex", group: "restates", action: "docs write" });                         // change
    command(210, { program: "cat", group: null, action: null });                                              // reading
    command(240, { program: "spn-devex", group: "docs", action: "cycles write" });                            // managing
    command(270, { program: "spn-devex", group: "workstream", action: "row land" }, { exit: 2 });            // refused by its exit status
    command(300, { program: "git", group: "rm", action: null });                                              // change
    command(330, { program: "ls", group: null, action: null });                                               // reading
    command(330 + 20 * 60, { program: "git", group: "commit", action: null });                                // managing, after a wait of 20 minutes
    // A child: a git mv.
    command(360 + 20 * 60, { program: "git", group: "mv", action: null }, {}, "c1");                          // change
    // Rows that are no call: an old-shape row, a version 2 row, a PASS check and a TURN row.
    lines.push({ script: "spn-devex", group: "workstream", action: "state", event: "command", tool: "Bash", at: stamp(400), session: "d1", agent: null, workstream: "040-split", arc: "N011", row: "1", verdict: null });
    lines.push({ ...head("COMMAND", 410, null, LEAD), v: 2, call: { program: "git", group: "commit", action: null } });
    lines.push({ ...head("CHECK", 420, null, LEAD), event: "PreToolUse", check: "command-shape", verdict: "PASS", ms: 5, out: null });
    writeFileSync(join(telemetry, "hooks.jsonl"), lines.map((one) => JSON.stringify(one)).join("\n") + "\n");
    const split = json(root, "040-split").split;
    const arc = (split ?? []).find((one) => one.key === "N011");
    const calls = (kind) => arc?.[kind]?.calls;
    ok("[MKT.HOOKS.321] a `workstream row state`, a docs cycles write and a commit are managing", calls("managing") === 3, JSON.stringify(arc));
    ok("[MKT.HOOKS.321] a check's refusal, a retry, and a plugin command refused by its exit status are refusals; a passing check is no call", calls("refusals") === 3, JSON.stringify(arc));
    ok("[MKT.HOOKS.321] a generated write, a git rm and a child's git mv are change", calls("change") === 3, JSON.stringify(arc));
    ok("[MKT.HOOKS.321] a test run's row is proof", calls("proof") === 1, JSON.stringify(arc));
    ok("[MKT.HOOKS.321] a git log and a command the hooks name no kind for are reading, never change", calls("reading") === 3, JSON.stringify(arc));
    ok("[MKT.HOOKS.321] a gap of 20 minutes is one wait, apart from the work after it", calls("waiting") === 1 && Math.abs(arc.waiting.minutes - 20) < 0.2, JSON.stringify(arc?.waiting));
    ok("[MKT.HOOKS.321] each part of the arc is split too", (split ?? []).filter((one) => /^N011 · part (code|docs)-spn-x-1$/.test(one.key)).length === 2, JSON.stringify((split ?? []).map((one) => one.key)));
    const printed = typed(root, "show", "040-split").out;
    ok("[MKT.HOOKS.321] the printed form names the five classes and no sixth", ["change", "proof", "managing", "refusals", "waiting"].every((word) => printed.includes(word)) && !/reading/.test(printed) && /N011 · part code-spn-x-1/.test(printed), printed);
    const lead = (extra) => (JSON.parse(typed(root, "show", "040-split", "--json", ...extra).out).split ?? []).find((one) => one.key === "N011");
    ok("`--lead` leaves the child's calls out", lead(["--lead"])?.change.calls === 2 && lead([])?.change.calls === 3, JSON.stringify(lead(["--lead"])));
    ok("`--from` and `--to` bound the split to a time", lead(["--to", "2026-10-31T10:04:00Z"])?.managing.calls === 2 && lead(["--from", "2026-10-31T10:20:00Z"])?.managing.calls === 1,
      JSON.stringify([lead(["--to", "2026-10-31T10:04:00Z"]), lead(["--from", "2026-10-31T10:20:00Z"])]));
    const bad = typed(root, "show", "040-split", "--from", "yesterday-ish");
    ok("a time that is none is refused with exit 2", bad.code === 2 && bad.out.includes("not one"), bad.out);
  }

  console.log("\n=== <workstream> — a record of the old shape is not read as a call");
  {
    const old = [];
    for (const [seconds, extra] of [[30, { event: "PreToolUse", tool: "Read", pathKind: "WORKSTREAM" }], [60, { event: "PreToolUse", tool: "Edit", pathKind: "SOURCE" }],
      [90, { event: "PostToolUse", tool: "Bash", program: "cat", pathKind: "SOURCE" }], [120, { event: "PostToolUse", tool: "Bash", program: "vitest", pathKind: null }]])
      old.push({ ms: 5, exit: null, pid: 1, out: null, session: "k1", agent: null, workstream: "041-kinds", arc: "N001", order: null, row: "1", repo: null,
        script: "spn-devex", group: "events", subgroup: null, action: null, args: null, at: new Date(Date.parse("2026-10-31T11:00:00Z") + seconds * 1000).toISOString().slice(0, 19) + "Z", verdict: "pass", ...extra });
    writeFileSync(join(telemetry, "hooks.jsonl"), old.map((one) => JSON.stringify(one)).join("\n") + "\n");
    const split = json(root, "041-kinds").split ?? [];
    ok("[MKT.SCRIPTS.325] a hook row with no v 1 and a pathKind is skipped, so the workstream has no split", split.length === 0, JSON.stringify(split));
  }

  console.log("\n=== <workstream> — the time by stage, by go and by window, from the version 1 rows");
  {
    const folder = join(root, ".spndevex", "workstreams", "open", "042-time", "arcs", "N001");
    mkdirSync(folder, { recursive: true });
    // The go log: code launched and landed 12 minutes later, the baseline landed with no launch, the full run started and landed 8 minutes later.
    const goLine = (at, note) => ({ at, kind: "go", row: null, note });
    writeFileSync(join(folder, "log.jsonl"), [{ at: "2026-10-20T10:00:00Z", kind: "status", note: "PROPOSED → DECIDED" },
      goLine("2026-10-20T10:35:00Z", "code-spn-x-1 launched"), goLine("2026-10-20T10:47:00Z", "code-spn-x-1 landed"), goLine("2026-10-20T10:55:00Z", "baseline-spn-x landed"),
      goLine("2026-10-20T11:00:00Z", "full-spn-x started"), goLine("2026-10-20T11:08:00Z", "full-spn-x landed")].map((one) => JSON.stringify(one)).join("\n") + "\n");
    writeFileSync(join(folder, "go.json"), JSON.stringify({ schemaVersion: 1, lead: "N001", scope: ["N001"], parts: [{ id: "code-spn-x-1", work: "CODE" }, { id: "baseline-spn-x", work: "TEST" }, { id: "full-spn-x", work: "TEST" }] }));
    const turn = (id, at, extra) => reply({ turn: id, at, session: "w1", workstream: "042-time", arc: "N001", part: null, ...extra });
    const usage = join(telemetry, "usage.jsonl");
    writeFileSync(usage, [
      turn("a", "2026-10-20T09:00:00Z", { skill: "DEVEX_IDEATE" }),
      turn("b", "2026-10-20T09:10:00Z", {}),
      turn("c", "2026-10-20T10:30:00Z", { skill: "DEVEX_EXECUTE" }),
      turn("d", "2026-10-20T10:40:00Z", { agent: "h1", skill: "DEVEX_EXECUTE", work: "CODE", part: "code-spn-x-1" }),
      turn("e", "2026-10-20T10:50:00Z", { agent: "h2", skill: "DEVEX_EXECUTE", work: "TEST", part: "baseline-spn-x" }),
      turn("f", "2026-10-20T11:00:00Z", { agent: "h3", skill: "DEVEX_EXECUTE", work: "TEST", part: "full-spn-x" }),
      turn("g", "2026-10-20T11:05:00Z", { agent: "h3", skill: "DEVEX_EXECUTE", work: "TEST", part: "full-spn-x" }),
    ].join("\n") + "\n");
    // The window's background test run began at 09:20, between its second and third replies.
    writeFileSync(join(telemetry, "hooks.jsonl"), `${JSON.stringify({ v: 1, mtype: "TEST", id: "t1", event: "PostToolUse", at: "2026-10-20T09:20:00Z", session: "w1", agent: null, workstream: "042-time", arc: "N001", part: null, skill: null, work: null, retryOf: null })}\n`);
    const data = json(root, "042-time");
    const line = data.stages.find((one) => one.arc === "N001");
    ok("[MKT.SCRIPTS.326] a reply's stage comes from its skill and work: the ideate skill is IDEATE, an execute reply takes it from its work, one with neither has none",
      line?.stages.IDEATE === 60000 && line.stages.DEVELOP === 60000 && line.stages.TEST === 180000 && line.stages.none === 120000, JSON.stringify(line));
    ok("[MKT.SCRIPTS.326] a reply before its arc's DECIDED line is planning, the rest executing", line?.phases.planning === 120000 && line.phases.executing === 300000 && line.modelMs === 420000, JSON.stringify(line?.phases));
    const block = data.goBlocks[0];
    const by = (label) => block?.lines.find((one) => one.label === label);
    ok("[MKT.SCRIPTS.326] a go block gives each reply of a helper to its part's work, a baseline and a full run apart by their ids",
      block?.lead === "N001" && by("Code")?.replies === 1 && by("Test · baseline")?.replies === 1 && by("Test · full")?.replies === 2 && by("Test · full").helpers === 1 && by("Test · full").parts === 1, JSON.stringify(block));
    ok("[MKT.SCRIPTS.326] every lead reply is on the Lead line, which has no parts", block?.leadLine.label === "Lead" && block.leadLine.replies === 3 && block.leadLine.modelMs === 180000 && block.leadLine.parts === 0 && block.noPart === null, JSON.stringify(block?.leadLine));
    ok("[MKT.SCRIPTS.326] a go log with a launched and a landed part shows its whole minutes as Elapsed, a started full run as well", by("Code")?.elapsedMin === 12 && by("Test · full")?.elapsedMin === 8, JSON.stringify(block?.lines.map((one) => [one.label, one.elapsedMin])));
    ok("[MKT.SCRIPTS.474] a part with no launch shows none, and the Lead line shows the span its own turns cover (three turns of a minute, apart)", by("Test · baseline")?.elapsedMin === null && block?.leadLine.elapsedMin === 3, JSON.stringify(block?.lines.map((one) => [one.label, one.elapsedMin, block.leadLine.elapsedMin])));
    const planning = data.windows.find((one) => one.arc === "N001" && one.phase === "planning");
    ok("[MKT.SCRIPTS.327] a window's time is working, waiting on a run where a background run began in the gap, else waiting on you",
      planning?.workingMs === 120000 && planning.waitingOnYouMs === 540000 && planning.waitingOnRunMs === 4740000, JSON.stringify(data.windows));
    const text = typed(root, "show", "042-time").out;
    ok("[MKT.SCRIPTS.327] the printed form shows the stage table, the go block with its Lead line, and the window time",
      /Stage/.test(text) && /All arcs/.test(text) && /Go N001/.test(text) && /Test · full/.test(text) && /Lead/.test(text) && /Window time/.test(text) && /Waiting on you/.test(text), text);
    ok("[MKT.SCRIPTS.325] `--json` carries stages, goBlocks and windows, and a target that is no workstream carries them empty",
      Array.isArray(data.stages) && Array.isArray(data.goBlocks) && Array.isArray(data.windows) && json(root, "all").stages.length === 0 && json(root, "all").windows.length === 0);
  }

  console.log("\n=== the stage a row stored, and the lead's part (MKT.SCRIPTS.473, MKT.SCRIPTS.474)");
  {
    const folder = join(root, ".spndevex", "workstreams", "open", "043-stage", "arcs", "N001");
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, "go.json"), JSON.stringify({ schemaVersion: 1, lead: "N001", scope: ["N001"], parts: [{ id: "release-spn-x", work: "RELEASE" }] }));
    const turn = (id, at, extra) => reply({ turn: id, at, session: "w1", workstream: "043-stage", arc: "N001", part: null, ...extra });
    writeFileSync(join(telemetry, "usage.jsonl"), [
      turn("s1", "2026-10-21T09:00:00Z", { stage: "DELIVER" }),
      turn("s2", "2026-10-21T09:05:00Z", { work: "CODE" }),
      turn("s3", "2026-10-21T09:10:00Z", {}),
      turn("s4", "2026-10-21T09:15:00Z", { stage: "OPERATE", skill: "DEVEX_IDEATE" }),
      turn("r1", "2026-10-21T12:00:00Z", { part: "release-spn-x", work: "RELEASE", stage: "DELIVER" }),
      turn("r2", "2026-10-21T12:01:00Z", { part: "release-spn-x", work: "RELEASE", stage: "DELIVER" }),
      turn("r3", "2026-10-21T12:02:00Z", { agent: "h1", part: "release-spn-x", work: "RELEASE", stage: "DELIVER" }),
    ].join("\n") + "\n");
    writeFileSync(join(telemetry, "hooks.jsonl"), "");
    const data = json(root, "043-stage");
    const line = data.stages.find((one) => one.arc === "N001");
    ok("[MKT.SCRIPTS.473] a turn with stage DELIVER and no skill prints under DELIVER, and a stored stage wins over the skill", line?.stages.DELIVER === 240000 && line.stages.OPERATE === 60000, JSON.stringify(line?.stages));
    ok("[MKT.SCRIPTS.473] a row with work and no stage falls back to the work's stage", line?.stages.DEVELOP === 60000, JSON.stringify(line?.stages));
    ok("[MKT.SCRIPTS.473] under No stage only a row with no stage, no work and no carried stage", line?.stages.none === 60000, JSON.stringify(line?.stages));
    const printed = typed(root, "show", "043-stage").out;
    ok("[MKT.SCRIPTS.473] the printed table holds the DELIVER column", /DELIVER/.test(printed) && /No stage/.test(printed), printed);
    const block = data.goBlocks[0];
    const release = block?.lines.find((one) => one.label === "Release");
    ok("[MKT.SCRIPTS.474] a go with a release part whose rows have agent null shows that part's replies, model time and money", release?.replies === 3 && release.modelMs === 180000 && release.money !== null, JSON.stringify(release));
    ok("[MKT.SCRIPTS.474] helpers still counts distinct agents", release?.helpers === 1, JSON.stringify(release));
    ok("[MKT.SCRIPTS.474] the Lead line holds only the part-less rows and prints an Elapsed", block?.leadLine.replies === 4 && block.leadLine.elapsedMin === 4 && /Elapsed/.test(printed) && /Lead\s+—\s+—\s+4/.test(printed), JSON.stringify([block?.leadLine, printed]));
  }

  console.log("\n=== idle, waiting on you and waiting on a run (MKT.SCRIPTS.475)");
  {
    mkdirSync(join(root, ".spndevex", "workstreams", "open", "045-idle", "arcs", "N001"), { recursive: true });
    const turn = (id, at) => reply({ turn: id, at, session: "w1", workstream: "045-idle", arc: "N001", part: null });
    writeFileSync(join(telemetry, "usage.jsonl"), [
      turn("i1", "2026-10-22T09:00:00Z"), turn("i2", "2026-10-22T12:01:00Z"), turn("i3", "2026-10-22T12:12:00Z"), turn("i4", "2026-10-22T13:00:00Z"),
    ].join("\n") + "\n");
    // A background test run began at 12:40, between the third and fourth replies.
    writeFileSync(join(telemetry, "hooks.jsonl"), `${JSON.stringify({ v: 1, mtype: "TEST", id: "t9", event: "PostToolUse", at: "2026-10-22T12:40:00Z", session: "w1", agent: null, workstream: "045-idle", arc: "N001", part: null, skill: null, work: null, retryOf: null })}\n`);
    const data = json(root, "045-idle");
    const sum = (field) => data.windows.reduce((total, one) => total + one[field], 0);
    ok("[MKT.SCRIPTS.475] a 3-hour gap after a turn is idle", sum("idleMs") === 10800000, JSON.stringify(data.windows));
    ok("[MKT.SCRIPTS.475] a 10-minute gap is waiting on you", sum("waitingOnYouMs") === 600000, JSON.stringify(data.windows));
    ok("[MKT.SCRIPTS.475] a gap with a background run since is waiting on a run, however long", sum("waitingOnRunMs") === 2820000, JSON.stringify(data.windows));
    ok("[MKT.SCRIPTS.475] the printed form has the Idle column", /Idle/.test(typed(root, "show", "045-idle").out));
  }

  console.log("\n=== the arcs in their order: Ideate, the build arcs, Follow-ups (the ideate and follow-up arcs)");
  {
    mkdirSync(join(root, ".spndevex", "workstreams", "open", "046-arcs", "arcs"), { recursive: true });
    const turn = (id, arc, part) => reply({ turn: id, at: "2026-10-23T09:00:00Z", session: "w1", workstream: "046-arcs", arc, part });
    writeFileSync(join(telemetry, "usage.jsonl"), [
      turn("v1", "follow-ups", "docs-spn-x-1"), turn("v2", "N002", "code-spn-x-1"), turn("v3", "ideate", "docs-spn-x-2"), turn("v4", "N001", "code-spn-x-2"),
    ].join("\n") + "\n");
    writeFileSync(join(telemetry, "hooks.jsonl"), "");
    ok("a workstream's arcs read Ideate first, the build arcs by number, Follow-ups last, each by its address", json(root, "046-arcs").rows.map((one) => one.key).join(" ") === "ideate N001 N002 follow-ups",
      json(root, "046-arcs").rows.map((one) => one.key).join(" "));
    ok("its stage lines keep that order", json(root, "046-arcs").stages.map((one) => one.arc).join(" ") === "ideate N001 N002 follow-ups");
    ok("`<workstream>/ideate` and `<workstream>/follow-ups` name an arc and give a line for each part",
      json(root, "046-arcs/ideate").rows.map((one) => one.key).join() === "part docs-spn-x-2" && json(root, "046-arcs/follow-ups").rows.map((one) => one.key).join() === "part docs-spn-x-1");
    ok("a word that is no arc's address names no arc", json(root, "046-arcs/follow-up").rows.length === 0 && json(root, "046-arcs/Ideate").rows.length === 0);
  }

  console.log("\n=== compare — two plugin versions, before and after (MKT.SCRIPTS.476)");
  {
    const turn = (id, session, extra = {}) => reply({ turn: id, at: "2026-10-24T09:00:00Z", session, workstream: "047-cmp", arc: "N001", part: "code-spn-x-1", work: "CODE", stage: "DEVELOP", ...extra });
    writeFileSync(join(telemetry, "usage.jsonl"), [turn("c1", "sA"), turn("c2", "sA"), turn("c3", "sB"), turn("c4", "sB", { part: null, work: null, stage: null })].join("\n") + "\n");
    const loaded = (id, session, pluginVersion) => JSON.stringify({ v: 1, mtype: "CHECK", id, event: "SessionStart", at: "2026-10-24T08:59:00Z", session, agent: null, workstream: null, arc: null,
      part: null, skill: null, stage: null, work: null, retryOf: null, check: "orientation", verdict: "PASS", ms: 5, out: 2000, pluginVersion });
    writeFileSync(join(telemetry, "hooks.jsonl"), [loaded("l1", "sA", "0.41.0"), loaded("l2", "sB", "0.42.0")].join("\n") + "\n");
    const both = JSON.parse(typed(root, "compare", "0.41.0", "0.42.0", "--json").out);
    const kind = (reading, key) => reading.parts.find((one) => one.key === key);
    ok("[MKT.SCRIPTS.476] two versions that two sessions loaded print both, each with its windows", both.versions.join() === "0.41.0,0.42.0" && both.readings.every((one) => one.windows === 1), JSON.stringify(both.versions));
    ok("[MKT.SCRIPTS.476] each reading holds the replies by kind of part, and the stage's model minutes", kind(both.readings[0], "CODE")?.replies === 2 && kind(both.readings[1], "CODE")?.replies === 1 && both.readings[0].stages.DEVELOP === 120000, JSON.stringify(both.readings));
    const change = both.difference.parts.find((one) => one.key === "CODE");
    ok("[MKT.SCRIPTS.476] the difference is the second less the first, in model time, tokens and money per kind of part", change?.modelMs === -60000 && change.tokens === -6400 && change.money < 0, JSON.stringify(both.difference.parts));
    ok("[MKT.SCRIPTS.476] and in the hook bytes carried and in the stage minutes", both.difference.stagesMs.DEVELOP === -60000 && typeof both.difference.carried === "number", JSON.stringify(both.difference));
    const printed = typed(root, "compare", "0.41.0", "0.42.0").out;
    ok("[MKT.SCRIPTS.476] the printed form names both versions and the difference", /Plugin 0\.41\.0/.test(printed) && /Plugin 0\.42\.0/.test(printed) && /Difference, 0\.42\.0 less 0\.41\.0/.test(printed) && /Hook bytes carried/.test(printed), printed);
    const refused = typed(root, "compare", "0.41.0", "9.9.9");
    ok("[MKT.SCRIPTS.476] a version no window loaded is refused, naming it", refused.code === 2 && refused.out.includes("`9.9.9`"), refused.out);
    const one = typed(root, "compare", "0.41.0");
    ok("compare takes two versions", one.code === 2 && one.out.includes("takes two plugin versions"), one.out);
  }

  console.log("\n=== the words");
  {
    const USAGE = "usage: spn-devex debug cost show <target> [--from <time>] [--to <time>] [--lead] [--json]\n";
    const option = typed(root, "show", "all", "--by", "arc");
    ok("[MKT.SCRIPTS.174] an option the command does not take is refused with exit 2 and the usage line", option.code === 2 && option.out === USAGE + "`debug cost show` does not take `--by`.\n", option.out);
    const second = typed(root, "show", "all", "--json", "--since");
    ok("a second option is refused too", second.code === 2 && second.out.includes("does not take `--since`"), second.out);
    const missing = typed(root, "show");
    ok("a missing target is refused with the usage line", missing.code === 2 && missing.out.startsWith(USAGE) && missing.out.includes("takes one target"), missing.out);
    const two = typed(root, "show", "all", "031");
    ok("a second target is refused", two.code === 2 && two.out.includes("takes one target"), two.out);
    const none = typed(root);
    ok("with no action the entry says an action is owed", none.code === 2 && none.out.includes("`debug cost` needs an action."), none.out);
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — debug cost` : `\n  all ${total} passed — debug cost`);
process.exit(failed ? 1 : 0);

