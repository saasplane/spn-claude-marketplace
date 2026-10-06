import { PLUGIN } from "../../../helpers/harness.mjs";
// `window` — which workstreams a window works on, and what a hook says to it (RD.DEVEX.WORKSPACE.236).
//
// The fault this proves gone: a window on workstream 021 was asked for the cards of workstream 024,
// because the Stop hook bound a window to any folder whose NAME appeared in the text of a write, and the
// PreToolUse note read every open workstream with no window at all. Every case here fails on that code.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { workspace } from "../../../helpers/fixture.mjs";
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
const arc = (...answered) => `# N1 — a subject\n\nStatus: **RUNNING**\n\n## Steps\n\n| # | What | Where | How you would know |\n| --- | --- | --- | --- |\n| 1 | a thing | here | ✅ landed |\n\n## Log\n\n- **2026-09-19 — go.**\n${answered.map((q) => `- **2026-10-06 — Q${q} answered A**\n`).join("")}`;

/** Two open workstreams. Each has a page that still asks Q7 and an arc that records it as answered. */
const two = (name) => workspace(name, {
  [`${open(A)}/approach.html`]: page(7), [`${open(A)}/arcs/N1-a-subject.md`]: arc(7),
  [`${open(B)}/approach.html`]: page(7), [`${open(B)}/arcs/N1-b-subject.md`]: arc(7),
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
  pre(root, "mention", { file_path: join(root, open(A), "arcs", "N1-a-subject.md"), new_string: `see ${B}/approach.html and .spndevex/workstreams/open/${B}/arcs/N1-b-subject.md`, old_string: "x" });
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
  pre(root, "owner", { file_path: join(root, open(B), "arcs", "N1-b-subject.md"), old_string: "x", new_string: "y" });
  const held = readWindow(root, "owner").workstreams;
  check("a window that owns one workstream and writes inside another only visits it", held[A]?.tie === "owns" && held[B]?.tie === "visits", JSON.stringify(held));
  check("a visit is not an owned workstream and not read as one", windowWorkstreams(root, "owner").join() === A && [...visitedWorkstreams(root, "owner")].join() === B);
  pre(root, "owner", { file_path: join(root, open(B), "approach.html"), content: "x" });
  check("a second write there does not turn the visit into ownership", readWindow(root, "owner").workstreams[B].tie === "visits");
  bindNamed(root, "owner-b", A, "prompt");
  pre(root, "owner-b", { file_path: join(root, open(B), "arcs", "N1-b-subject.md"), old_string: "x", new_string: "y" }, { agent_id: "kid" });
  const told = pre(root, "owner-b", LOOK);
  check("the answered-card note names nothing of the workstream it visits, and speaks of the one it owns", !/002-b-subject/.test(told) && /001-a-subject/.test(told), told);
  // THE FIRST WORKSTREAM A WINDOW WRITES INSIDE, WHEN NOTHING NAMED ONE, IS ITS OWN.
  pre(root, "first", { file_path: join(root, open(A), "arcs", "N1-a-subject.md"), old_string: "x", new_string: "y" });
  pre(root, "first", { file_path: join(root, open(B), "arcs", "N1-b-subject.md"), old_string: "x", new_string: "y" });
  const first = readWindow(root, "first").workstreams;
  check("when nothing names one, the first workstream written inside is owned and the next is visited", first[A].tie === "owns" && first[B].tie === "visits", JSON.stringify(first));
  // At Stop: held by neither cards nor needs-you of the visited workstream.
  const out = stop(root, "owner");
  check("at Stop, a window is not held by the cards of a workstream it visits", !/002-b-subject/.test(out), out.slice(0, 300));
  // The notes rule still holds for an arc the window itself changed there, and the message says visited.
  const arcFile = join(root, open(B), "arcs", "N1-b-subject.md");
  const notes = join(root, open(B), "notes", "N1");
  mkdirSync(notes, { recursive: true });
  writeFileSync(join(notes, "plan.md"), "# plan\n");
  stop(root, "owner");                                           // a baseline, with the notes as they stand
  writeFileSync(arcFile, readFileSync(arcFile, "utf8") + "- **2026-10-06 — Q9 B.** a decision recorded, the developer said so\n");
  recordWrites(root, "owner", root, [arcFile]);
  const noted = stop(root, "owner");
  check("the notes rule speaks for an arc the window changed in a workstream it visits, and names the tie",
    /\[notes\] `002-b-subject` \(visited\)/.test(noted), noted.slice(0, 400));
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
  writeFileSync(join(root, open(B), "arcs", "N1-b-subject.md"), arc(7, 8));
  check("it is said again when the finding changes", /Q8/.test(pre(root, "win-b", LOOK)));
  // A CHILD.
  bindNamed(root, "parent", A, "prompt");
  const child = pre(root, "parent", LOOK, { agent_id: "child-1" });
  check("a call a child makes gets no card or page note", child === "", child);
  pre(root, "kid-window", { file_path: join(root, open(B), "arcs", "N1-b-subject.md"), old_string: "x", new_string: "y" }, { agent_id: "child-2" });
  check("but a child's write binds the window it carries the session id of", windowWorkstreams(root, "kid-window").join() === B);
  // A WORKSTREAM THAT LEAVES open/.
  mkdirSync(join(root, ".spndevex", WORKSTREAMS, "closed"), { recursive: true });
  renameSync(join(root, open(B)), join(root, ".spndevex", WORKSTREAMS, "closed", B));
  check("a workstream that moved to closed/ drops out of the window's set", windowWorkstreams(root, "win-b").length === 0 && Object.keys(readWindow(root, "win-b").workstreams).includes(B));
  check("an old baseline's workstreams list binds nothing at Stop", (() => {
    const r = two("w-old-baseline");
    const dir = join(r, ".spndevex", ".debug", "stop", "sessions");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "old.json"), JSON.stringify({ at: 1, steps: {}, workstreams: [A, B], cards: [] }));
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
