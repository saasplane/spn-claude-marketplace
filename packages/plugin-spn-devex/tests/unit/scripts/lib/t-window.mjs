import { PLUGIN } from "../../../helpers/harness.mjs";
// `window` — which workstreams a window works on, and what a hook says to it (RULE.DEVEX.WORKSPACE.236).
//
// The fault this proves gone: a window on workstream 021 was asked for the cards of workstream 024,
// because the Stop hook bound a window to any folder whose NAME appeared in the text of a write, and the
// PreToolUse note read every open workstream with no window at all. Every case here fails on that code.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { workspace } from "../../../helpers/fixture.mjs";
import { CARD as RAISED_CARD } from "../../../helpers/workstream-fixture.mjs";
import { WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { linesFor } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";
import { bindNamed, readWindow, recordWrites, reposWritten, visitedWorkstreams, windowWorkstreams } from "../../../../src/scripts/lib/window.ts";
import { bindingsOf } from "../../../../src/scripts/events/prompt.ts";

const SCRIPTS = resolve(PLUGIN, "src", "scripts");
const A = "001-a-subject", B = "002-b-subject";
const open = (name) => `.spndevex/${WORKSTREAMS}/open/${name}`;

// A page with one card the arc has answered: the page still asks it, which is the note's finding.
const STYLES = linesFor("1.0.0").stylesheet;
const card = (q) => `<div class="sds-open"><h4 id="q${q}">Q${q} &middot; a question</h4><div class="sds-scroll"><table><thead><tr><th></th><th>What</th></tr></thead><tbody><tr><td><strong>A</strong></td><td>x</td></tr></tbody></table></div><div class="sds-recommended"><b>Recommended: A.</b> <b>Decision:</b> &mdash;</div></div>`;
const page = (...cards) => `<!doctype html>\n${STYLES}\n<div class="sds-eyebrow">Workstream</div>\n<section id="s4"><div class="sds-section-head"><h2>Open</h2></div>\n${cards.map(card).join("\n")}\n</section>\n`;
const { title: _title, ...WHOLE_CARD } = RAISED_CARD;
// The workstream's question records, each card answered: the page still asking them is the note's finding.
const answered = (...cards) => cards.map((q) => JSON.stringify({ id: `q${q}`, arc: "N001", title: "a question", state: "answered",
  raised: "2026-10-06T09:00+05:30", shownIn: [], card: WHOLE_CARD, answer: { key: "A", words: "the developer chose A", at: "2026-10-06T10:00+05:30" } })).join("\n") + "\n";

// An arc kept as data, for the cases about the arcs a window writes.
const DATA_ARC = { schemaVersion: 2, arc: "N001", subject: "a-subject", title: "a subject", goal: "it lands", status: "RUNNING", reason: null,
  preview: "preview.html", rows: [{ id: "1", parent: "N001", title: "a thing", kind: "change", state: "waiting" }] };

/** Two open workstreams. Each has a page that still asks Q7, and a record in `questions.jsonl` that holds it answered. */
const two = (name) => workspace(name, {
  [`${open(A)}/approach.html`]: page(7), [`${open(A)}/questions.jsonl`]: answered(7),
  [`${open(B)}/approach.html`]: page(7), [`${open(B)}/questions.jsonl`]: answered(7),
});

function hook(event, payload, cwd) {
  try {
    const out = execFileSync("node", [`${SCRIPTS}/events/${event}.ts`], { input: JSON.stringify(payload), encoding: "utf8", cwd }).trim();
    if (!out) return "";
    const parsed = JSON.parse(out.split("\n").filter(Boolean).at(-1));
    const specific = parsed.hookSpecificOutput ?? {};
    return specific.permissionDecisionReason ?? specific.additionalContext ?? parsed.systemMessage ?? out;
  } catch (e) { return `${String(e.stdout ?? "")}${String(e.stderr ?? "")}`.trim(); }
}
const pre = (root, session, tool_input, extra = {}) =>
  hook("pretooluse", { cwd: root, session_id: session, tool_name: tool_input.command ? "Bash" : "Write", tool_input, ...extra }, root);
const stop = (root, session, extra = {}) => hook("stop", { cwd: root, session_id: session, last_assistant_message: "done", ...extra }, root);
// A call that reads nothing and writes nothing, but names the plan, so the note's gate runs.
const LOOK = { command: "ls .spndevex/workstreams/open" };

let n = 0, failed = 0;
const check = (label, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${String(detail).slice(0, 400)}`}`); };

console.log("\n=== window — what binds a window, and what does not");
{
  const root = two("w-binds");
  // A LOG LINE THAT NAMES ANOTHER WORKSTREAM'S PAGE BINDS NOTHING: only the path of the write counts.
  pre(root, "mention", { file_path: join(root, open(A), "notes", "N001", "plan.md"), new_string: `see ${B}/approach.html and .spndevex/workstreams/open/${B}/notes/N001/plan.md`, old_string: "x" });
  check("a write whose text names another workstream's folder does not bind it",
    JSON.stringify(Object.keys(readWindow(root, "mention").workstreams)) === JSON.stringify([A]), JSON.stringify(readWindow(root, "mention").workstreams));
  // A READ BINDS NOTHING.
  pre(root, "reader", { file_path: join(root, open(B), "approach.html") }, { tool_name: "Read" });
  check("a read of a workstream's page binds nothing", Object.keys(readWindow(root, "reader").workstreams).length === 0);
  // A SHELL WRITE, A mkdir AND A MOVE BIND, BY THEIR PATHS.
  pre(root, "shell", { command: `echo x > ${open(A)}/notes.md` });
  pre(root, "maker", { command: `mkdir -p ${open("003-new-thing")}/arcs` });
  check("a shell redirect into a workstream folder binds it", windowWorkstreams(root, "shell").join() === A);
  check("a mkdir that opens a workstream binds it", Object.keys(readWindow(root, "maker").workstreams).join() === "003-new-thing");
  // A HANDOVER AND A PROMPT BIND.
  const handover = (line) => `Pick this up.\n\ncontinue:     ${line}\nmodel:        Opus\n`;
  check("a handover prompt owns the workstream its continue line names",
    JSON.stringify(bindingsOf(handover(`workstream ${B}, arc N1`), root, "h1")) === JSON.stringify([{ name: B, by: "handover" }]));
  check("a handover that names two workstreams gives two owned",
    bindingsOf(handover(`open workstream ${A}; ${B} N1 waits on it`), root, "h2").map((one) => one.name).sort().join() === `${A},${B}`);
  check("a prompt that names two workstreams and holds no handover binds neither", bindingsOf(`compare ${A} with ${B}`, root, "h3").length === 0);
  check("a prompt that names one binds it", bindingsOf(`work on ${B}`, root, "h4")[0]?.name === B);
  bindNamed(root, "h5", A, "prompt");
  check("a later prompt that names another workstream changes nothing", bindingsOf(`and look at ${B}`, root, "h5").length === 0);
}

console.log("\n=== window — owning and visiting a workstream");
{
  const root = two("w-ties");
  bindNamed(root, "owner", A, "prompt");
  pre(root, "owner", { file_path: join(root, open(B), "notes", "N001", "plan.md"), old_string: "x", new_string: "y" });
  const held = readWindow(root, "owner").workstreams;
  check("a window that owns one workstream and writes inside another only visits it", held[A]?.tie === "owns" && held[B]?.tie === "visits", JSON.stringify(held));
  check("a visit is not an owned workstream and not read as one", windowWorkstreams(root, "owner").join() === A && [...visitedWorkstreams(root, "owner")].join() === B);
  pre(root, "owner", { file_path: join(root, open(B), "approach.html"), content: "x" });
  check("a second write there does not turn the visit into ownership", readWindow(root, "owner").workstreams[B].tie === "visits");
  bindNamed(root, "owner-b", A, "prompt");
  pre(root, "owner-b", { file_path: join(root, open(B), "notes", "N001", "plan.md"), old_string: "x", new_string: "y" }, { agent_id: "kid" });
  const told = pre(root, "owner-b", LOOK);
  check("the answered-card note names nothing of the workstream it visits, and speaks of the one it owns", !/002-b-subject/.test(told) && /001-a-subject/.test(told), told);
  // THE FIRST WORKSTREAM A WINDOW WRITES INSIDE, WHEN NOTHING NAMED ONE, IS ITS OWN.
  pre(root, "first", { file_path: join(root, open(A), "notes", "N001", "plan.md"), old_string: "x", new_string: "y" });
  pre(root, "first", { file_path: join(root, open(B), "notes", "N001", "plan.md"), old_string: "x", new_string: "y" });
  const first = readWindow(root, "first").workstreams;
  check("when nothing names one, the first workstream written inside is owned and the next is visited", first[A].tie === "owns" && first[B].tie === "visits", JSON.stringify(first));
  // At Stop: held by neither cards nor needs-you of the visited workstream.
  const out = stop(root, "owner");
  check("at Stop, a window is not held by the cards of a workstream it visits", !/002-b-subject/.test(out), out.slice(0, 300));
}
{
  // The notes rule still holds for an arc the window itself changed in a workstream it visits, and the
  // message says visited. B keeps its arc as data, and the answer is a line its log gains.
  const root = workspace("w-visit-notes", {
    [`${open(A)}/approach.html`]: page(),
    [`${open(B)}/approach.html`]: page(),
    [`${open(B)}/arcs/N001/state.json`]: `${JSON.stringify(DATA_ARC)}\n`,
    [`${open(B)}/notes/N001/plan.md`]: "# plan\n",
    [`${open(B)}/notes/N001/preview.html`]: "<p>the preview</p>\n",
    // The answered card is shown on B's preview, which is what the notes rule reads.
    [`${open(B)}/questions.jsonl`]: `${JSON.stringify({ id: "q9", arc: "N001", title: RAISED_CARD.title, state: "answered", raised: "2026-10-06T09:00+05:30",
      shownIn: ["notes/N001/preview.html"], card: RAISED_CARD, answer: { key: "B", words: "the developer said so", at: "2026-10-06T10:00+05:30" } })}\n`,
  });
  bindNamed(root, "owner", A, "prompt");
  pre(root, "owner", { file_path: join(root, open(B), "notes", "N001", "plan.md"), old_string: "x", new_string: "y" });
  stop(root, "owner");                                           // a baseline, with the notes as they stand
  writeFileSync(join(root, open(B), "arcs", "N001", "log.jsonl"),
    `${JSON.stringify({ at: "2026-10-06T10:00+05:30", kind: "answered", row: null, note: "q9 B · the developer said so" })}\n`);
  recordWrites(root, "owner", root, [join(root, open(B), "arcs", "N001", "log.jsonl")]);
  const noted = stop(root, "owner");
  check("the notes rule speaks for an arc the window changed in a workstream it visits, and names the tie",
    /\[notes\] `002-b-subject` \(visited\)/.test(noted), noted.slice(0, 400));
}

console.log("\n=== window — the arc a write records: a path inside its data or notes folder, or a `workstream` command");
{
  const root = workspace("w-arc-writes", {
    [`${open(A)}/arcs/N001/state.json`]: `${JSON.stringify(DATA_ARC)}\n`,
    [`${open(B)}/arcs/N002/state.json`]: `${JSON.stringify({ ...DATA_ARC, arc: "N002" })}\n`,
    [`${open(B)}/questions.jsonl`]: `${JSON.stringify({ id: "q3", arc: "N002", title: "a question", state: "open" })}\n`,
  });
  const wrote = (session) => Object.keys(readWindow(root, session).wrote).sort();
  const arcOf = (name, arc) => `${open(name)}/arcs/${arc}`;
  pre(root, "by-path", { file_path: join(root, open(A), "notes", "N001", "plan.md"), content: "x" });
  check("a write inside an arc's notes records the arc by its data folder", wrote("by-path").join() === arcOf(A, "N001"), wrote("by-path").join());
  pre(root, "by-data", { file_path: join(root, open(A), "arcs", "N001", "state.json"), content: "x" });
  check("a write inside an arc's data folder records it the same way", wrote("by-data").join() === arcOf(A, "N001"), wrote("by-data").join());
  pre(root, "loose", { file_path: join(root, open(A), "approach.html"), content: "x" });
  check("a write to the page records no arc, and still binds the workstream", wrote("loose").length === 0 && windowWorkstreams(root, "loose").join() === A);
  pre(root, "row-write", { command: "spn-devex workstream row state 002/N002 1 landed --note \"the developer: go\"" });
  check("known-bad: `row state` records the arc it names, and binds its workstream",
    wrote("row-write").join() === arcOf(B, "N002") && windowWorkstreams(root, "row-write").join() === B, `${wrote("row-write")} · ${windowWorkstreams(root, "row-write")}`);
  pre(root, "built-cli", { command: "node packages/plugin-spn-devex/src/dist/cli.mjs workstream arc stamp write 001/N001" });
  check("the plugin's built command line counts as the command, and `arc stamp write` records its arc", wrote("built-cli").join() === arcOf(A, "N001"), wrote("built-cli").join());
  pre(root, "answer", { command: "spn-devex workstream question answer q3 --key A --words \"the first\"" });
  check("`question answer` records the arc its card's record names, found in the one workstream that holds it", wrote("answer").join() === arcOf(B, "N002"), wrote("answer").join());
  pre(root, "report", { command: `spn-devex workstream report write 002 notes/N002/orders/04.report.md` });
  check("`report write` records the arc whose notes hold the report", wrote("report").join() === arcOf(B, "N002"), wrote("report").join());
  hook("pretooluse", { cwd: join(root, open(A)), session_id: "around", tool_name: "Bash", tool_input: { command: "spn-devex workstream fact write N001 --source spn-x/a.ts --fact \"a fact\"" } }, join(root, open(A)));
  check("a bare arc is read in the workstream the command stands in", wrote("around").join() === arcOf(A, "N001"), wrote("around").join());
  pre(root, "reads", { command: "spn-devex workstream state check && spn-devex workstream rows show 002 --ready" });
  check("a command that only reads records nothing and binds nothing", wrote("reads").length === 0 && windowWorkstreams(root, "reads").length === 0);
  pre(root, "nowhere", { command: "spn-devex workstream arc edit N009 --note \"x\"" });
  check("an arc no workstream holds records nothing", wrote("nowhere").length === 0);
}

console.log("\n=== window — a hook speaks only of this window's workstreams");
{
  const root = two("w-speaks");
  bindNamed(root, "win-a", A, "prompt");
  bindNamed(root, "win-b", B, "prompt");
  bindNamed(root, "win-b2", B, "prompt");
  const a = pre(root, "win-a", LOOK), b = pre(root, "win-b", LOOK), b2 = pre(root, "win-b2", LOOK);
  check("two windows on two workstreams: each hears only its own", /001-a-subject/.test(a) && !/002-b-subject/.test(a) && /002-b-subject/.test(b) && !/001-a-subject/.test(b), `${a}\n---\n${b}`);
  check("two windows on one workstream both hear it", /002-b-subject/.test(b2));
  check("the note names the workstream, its tie, and the page by its path from the workspace",
    /`002-b-subject` \(owned\)/.test(b) && b.includes(`${open(B)}/approach.html`), b);
  check("a window with no workstream hears nothing", pre(root, "nobody", LOOK) === "");
  check("and a window with no session id hears nothing", pre(root, undefined, LOOK) === "");
  // SPEAKS ONCE.
  check("the same finding is not said again to the same window", pre(root, "win-b", LOOK) === "");
  writeFileSync(join(root, open(B), "approach.html"), page(7, 8));
  writeFileSync(join(root, open(B), "questions.jsonl"), answered(7, 8));
  check("it is said again when the finding changes", /Q8/.test(pre(root, "win-b", LOOK)));
  // A CHILD.
  bindNamed(root, "parent", A, "prompt");
  const child = pre(root, "parent", LOOK, { agent_id: "child-1" });
  check("a call a child makes gets no card or page note", child === "", child);
  pre(root, "kid-window", { file_path: join(root, open(B), "notes", "N001", "plan.md"), old_string: "x", new_string: "y" }, { agent_id: "child-2" });
  check("but a child's write binds the window it carries the session id of", windowWorkstreams(root, "kid-window").join() === B);
  // A WORKSTREAM THAT LEAVES open/.
  mkdirSync(join(root, ".spndevex", WORKSTREAMS, "closed"), { recursive: true });
  renameSync(join(root, open(B)), join(root, ".spndevex", WORKSTREAMS, "closed", B));
  check("a workstream that moved to closed/ drops out of the window's set", windowWorkstreams(root, "win-b").length === 0 && Object.keys(readWindow(root, "win-b").workstreams).includes(B));
  check("an old baseline's workstreams list binds nothing at Stop", (() => {
    const r = two("w-old-baseline");
    const dir = join(r, ".spndevex", ".debug", "sessions", "old");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "stop.json"), JSON.stringify({ at: 1, steps: {}, workstreams: [A, B], cards: [] }));
    return stop(r, "old") === "";
  })());
}

console.log("\n=== window — the repositories a window has written under");
{
  const root = workspace("w-repos", { "repo-a/sprepo.json": "{}", "repo-b/sprepo.json": "{}", "loose/x.md": "x" });
  pre(root, "writer", { file_path: join(root, "repo-a", "docs", "x.md"), content: "x" });
  pre(root, "writer", { file_path: join(root, "loose", "x.md"), content: "x" });
  pre(root, "writer", { command: `echo x > ${join(root, ".spndevex", "notes.md")}` });
  pre(root, "reader", { file_path: join(root, "repo-b", "docs", "x.md") }, { tool_name: "Read" });
  check("a write under a repository records it, and only a member repository, and only by path", [...reposWritten(root, "writer")].join() === "repo-a");
  check("a read under a repository records nothing", reposWritten(root, "reader").size === 0);
}

console.log("\n=== window — no hook reads every open workstream to speak of it");
{
  const files = ["events", "checks"].flatMap((dir) => readdirSync(join(SCRIPTS, dir)).filter((f) => f.endsWith(".ts")).map((f) => join(SCRIPTS, dir, f)));
  // A snapshot is state, never speech; a CLI sweep is run by hand; a definition is not a call.
  const ALLOWED = new Set(["currentSteps", "snapshotArcs", "sweep", "checkConfirmed"]);
  const unfiltered = [];
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, at) => {
      if (!/\b(?:openWorkstreams|openWorkstreamFolders)\(/.test(line) || /^\s*(?:\/\/|\*)/.test(line) || /function\s+(?:openWorkstreams|openWorkstreamFolders)\b/.test(line)) return;
      let owner = "";
      for (let back = at; back >= 0 && !owner; back -= 1) owner = lines[back].match(/^(?:export )?function (\w+)/)?.[1] ?? "";
      const filtered = /\bmine\b|scoped\(/.test(`${line}\n${lines[at + 1] ?? ""}`);
      if (!filtered && !ALLOWED.has(owner)) unfiltered.push(`${file.split("/").slice(-2).join("/")}:${at + 1} ${owner}`);
    });
  }
  check("every read of the open workstreams is filtered by the window's set, bar the snapshot and the sweep", unfiltered.length === 0, unfiltered.join("\n        "));
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
