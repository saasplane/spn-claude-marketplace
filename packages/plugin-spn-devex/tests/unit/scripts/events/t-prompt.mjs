// `prompt` — what a session is called (RD.DEVEX.WORKSPACE.222). The script runs on every prompt, so
// the known-bad is every prompt that must NOT name the session: one that binds no workstream, one
// that repeats the name already given, and one the script cannot read. An answer on any of those
// writes over a name the developer typed, or stands between the developer and their prompt.
//
// Each case runs on a scratch workspace this file builds. The pure parts are called directly, and
// the script is run as a process wherever the case is about what reaches stdout, the exit code, or
// the record under `.spndevex/.debug/names/`.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";
import { workspace } from "../../../helpers/fixture.mjs";
import { ARCS, DEVEX, WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { nameToGive, readRecord, recordFile, sessionName } from "../../../../src/scripts/events/prompt.ts";

const SCRIPT = resolve(PLUGIN, "src", "scripts", "events", "prompt.ts");
const EVENT = "UserPromptSubmit";

const THIS = "020-agent-workstream-improvements";
const NEXT = "021-next-subject";
const DONE = "008-plain-language";
const ARC_FILE = "# the arc\n\nStatus: **RUNNING**\n";

// One workstream in each state. `021` holds an arc numbered `N011` as `020` does, so a reload
// handover that reads the waiting arc as its own is caught by the name it gives.
const files = {
  [`${DEVEX}/${WORKSTREAMS}/open/${THIS}/${ARCS}/N011-artifacts-by-domain.md`]: ARC_FILE,
  [`${DEVEX}/${WORKSTREAMS}/open/${THIS}/${ARCS}/N012-session-names.md`]: ARC_FILE,
  [`${DEVEX}/${WORKSTREAMS}/backlog/${NEXT}/${ARCS}/N011-same-number.md`]: ARC_FILE,
  [`${DEVEX}/${WORKSTREAMS}/closed/${DONE}/${ARCS}/N119-fresh-window.md`]: ARC_FILE,
  "spn-support-ts/src/a.ts": "export const a = 1;\n",
};
const build = (name, more = {}) => workspace(`prompt-${name}`, { ...files, ...more });

// The handover block as the template lays it out: nine labels, every value in the column
// `do not touch:` sets, and a long value wrapped onto a line indented to that column.
const handover = (next) => [
  `continue:     ${next}`,
  "model:        Opus 5.5, effort high",
  `read first:   \`/work/${DEVEX}/${WORKSTREAMS}/open/${THIS}/${ARCS}/N011-artifacts-by-domain.md\` (fields, and row 3)`,
  "pins:         spn-foundation db1e69f · spn-claude-marketplace 7fc99c1",
  "state:        rows 1 to 2 ✅ landed; row 3 not started",
  "live now:     no reload",
  "done when:    Commands row `suites` → exit 0",
  "do not touch: nothing",
  "open:         none",
].join("\n");
const fenced = (block) => `Pick this up.\n\n\`\`\`text\n${block}\n\`\`\`\n`;

const toArc = (arc) => `workstream \`${THIS}\`, arc \`${arc}\`, row 3, in a \`spn-claude-marketplace\` window`;
const RELOAD = `open workstream \`${NEXT}\`; \`${THIS}\` N011 waits on it`;

let n = 0, failed = 0;
function same(label, got, expected) {
  n += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
}

// The suites run with `SPN_TELEMETRY=off`, and a hook started here must not find the real workspace
// through the session's own project folder.
const quiet = () => { const copy = { ...process.env, SPN_TELEMETRY: "off" }; delete copy.CLAUDE_PROJECT_DIR; return copy; };

/** Run the script as the harness does: the event on stdin. Returns the exit code and both streams. */
function hook(input, cwd, env = quiet()) {
  const ran = spawnSync("node", [SCRIPT], { input: typeof input === "string" ? input : JSON.stringify(input), encoding: "utf8", cwd, env });
  return { exit: ran.status, out: (ran.stdout ?? "").trim(), err: (ran.stderr ?? "").trim() };
}
const event = (root, session, prompt, cwd = root) => ({ session_id: session, cwd, hook_event_name: EVENT, prompt });
/** The title an answer carries, `null` where nothing was printed, and `"UNREADABLE"` where it is not the answer's shape. */
function titleOf(ran) {
  if (!ran.out) return null;
  try {
    const answer = JSON.parse(ran.out);
    const specific = answer.hookSpecificOutput ?? {};
    return Object.keys(answer).join() === "hookSpecificOutput" && specific.hookEventName === EVENT ? specific.sessionTitle ?? "UNREADABLE" : "UNREADABLE";
  } catch { return "UNREADABLE"; }
}
const recordOf = (root, session) => readRecord(recordFile(root, session));
const namesFolder = (root) => join(root, DEVEX, ".debug", "names");
const recordsIn = (root) => (existsSync(namesFolder(root)) ? readdirSync(namesFolder(root)) : []);

console.log("\n=== prompt");

// ---------------------------------------------------------------- the name a prompt gives
{
  const root = build("pure");

  // UNTOUCHED — the workstream form, from a folder in each of the three states.
  same("[MKT.HOOKS.48] a prompt that names one open workstream gives the folder's name",
    sessionName(`pick up ${THIS} where it stands`, root), { name: THIS, form: "workstream" });
  same("[MKT.HOOKS.48] a workstream in backlog/ is named the same way",
    sessionName(`open \`${NEXT}\` next`, root), { name: NEXT, form: "workstream" });
  same("[MKT.HOOKS.48] and so is one in closed/",
    sessionName(`what did ${DONE} land?`, root), { name: DONE, form: "workstream" });
  same("[MKT.HOOKS.48] a path into the workstream names it, and naming it twice is still one workstream",
    sessionName(`read /work/${DEVEX}/${WORKSTREAMS}/open/${THIS}/notes/N012/plan.md, then ${THIS}/approach.html`, root),
    { name: THIS, form: "workstream" });

  // UNTOUCHED — the arc form, from a handover block.
  same("[MKT.HOOKS.49] a handover that names a workstream and an arc of it gives the arc form",
    sessionName(fenced(handover(toArc("N011"))), root), { name: "020-N011 artifacts-by-domain", form: "arc" });
  same("[MKT.HOOKS.49] the block is read with no fence around it, as a copy control hands it over",
    sessionName(handover(toArc("N012")), root), { name: "020-N012 session-names", form: "arc" });
  same("[MKT.HOOKS.49] an arc named on the wrapped line of `continue:` is read",
    sessionName(handover(`workstream \`${THIS}\`,\n              arc \`N011\`, row 3`), root), { name: "020-N011 artifacts-by-domain", form: "arc" });
  same("[MKT.HOOKS.49] a handover into a closed workstream names its arc too",
    sessionName(handover(`workstream \`${DONE}\`, arc \`N119\`, row 1`), root), { name: "008-N119 fresh-window", form: "arc" });

  // KNOWN-BAD — a handover with no arc to start on gives the workstream form, never an arc form.
  same("[MKT.HOOKS.49] an arc with no file in the workstream's arcs/ gives the workstream form",
    sessionName(handover(toArc("N099")), root), { name: THIS, form: "workstream" });
  same("[MKT.HOOKS.49] the reload form names the workstream to open, and the waiting arc is not its own",
    sessionName(handover(RELOAD), root), { name: NEXT, form: "workstream" });
  same("[MKT.HOOKS.49] a `continue:` line that names no arc gives the workstream form",
    sessionName(handover(`workstream \`${THIS}\`, in a \`spn-foundation\` window`), root), { name: THIS, form: "workstream" });

  // KNOWN-BAD — nothing is bound.
  same("[MKT.HOOKS.50] a prompt that names no workstream binds none",
    sessionName("why does the release gate refuse a dirty tree?", root), null);
  same("[MKT.HOOKS.50] a name shaped as a workstream with no folder binds none",
    sessionName("continue 099-not-here from row 2", root), null);
  same("[MKT.HOOKS.50] two workstreams in one prompt, with no handover, bind neither",
    sessionName(`compare ${THIS} with ${NEXT}`, root), null);
  same("[MKT.HOOKS.50] a date and a version are not workstreams",
    sessionName("on 2026-10-02 the plugins went to 0.13.0, and 100-200 rows moved", root), null);
  same("[MKT.HOOKS.50] a workspace with no workstreams binds none",
    sessionName(`pick up ${THIS}`, workspace("prompt-empty")), null);
}

// ---------------------------------------------------------------- the decision
{
  const workstream = { name: THIS, form: "workstream" };
  const other = { name: NEXT, form: "workstream" };
  const arc = { name: "020-N011 artifacts-by-domain", form: "arc" };
  const later = { name: "020-N012 session-names", form: "arc" };
  same("[MKT.HOOKS.48] with nothing recorded, the workstream form is given", nameToGive(workstream, null), workstream);
  same("[MKT.HOOKS.49] with nothing recorded, the arc form is given", nameToGive(arc, null), arc);
  same("[MKT.HOOKS.49] a handover's arc form replaces a recorded workstream form", nameToGive(arc, workstream), arc);
  same("[MKT.HOOKS.49] a handover to another arc replaces a recorded arc form", nameToGive(later, arc), later);
  same("[MKT.HOOKS.50] no name worked out gives nothing, whatever is recorded", [nameToGive(null, null), nameToGive(null, arc)], [null, null]);
  same("[MKT.HOOKS.51] known-bad: the name recorded last is not given again, in either form",
    [nameToGive(workstream, workstream), nameToGive(arc, arc)], [null, null]);
  same("[MKT.HOOKS.51] known-bad: another workstream named later changes nothing", nameToGive(other, workstream), null);
  same("[MKT.HOOKS.51] known-bad: a workstream named after an arc form changes nothing", nameToGive(workstream, arc), null);
}

// ---------------------------------------------------------------- the script, as the harness runs it
{
  // UNTOUCHED — the workstream form reaches stdout in the answer's shape, and the record is written.
  const root = build("run");
  const first = hook(event(root, "sess-one", `pick up ${THIS}`), root);
  same("[MKT.HOOKS.48] the first prompt that names a workstream names the session, and exits 0",
    [first.exit, titleOf(first), first.err], [0, THIS, ""]);
  same("[MKT.HOOKS.48] the answer is exactly the documented object",
    first.out, JSON.stringify({ hookSpecificOutput: { hookEventName: EVENT, sessionTitle: THIS } }));
  same("[MKT.HOOKS.48] the record holds the name and its form, one file for the session",
    [recordOf(root, "sess-one"), recordsIn(root)], [{ name: THIS, form: "workstream" }, ["sess-one.json"]]);

  // KNOWN-BAD — the same name again. An answer here writes over a name the developer typed.
  const again = hook(event(root, "sess-one", `carry on with ${THIS}, row 2`), root);
  same("[MKT.HOOKS.51] known-bad: a second prompt with the same name is silent", [again.exit, again.out], [0, ""]);

  // KNOWN-BAD — another workstream named later, and a prompt that binds none.
  const elsewhere = hook(event(root, "sess-one", `how did ${DONE} close?`), root);
  same("[MKT.HOOKS.51] known-bad: a later prompt naming another workstream is silent, and the record stays",
    [elsewhere.exit, elsewhere.out, recordOf(root, "sess-one")], [0, "", { name: THIS, form: "workstream" }]);
  const plain = hook(event(root, "sess-one", "run the gates"), root);
  same("[MKT.HOOKS.50] a prompt that names nothing is silent, and the record stays",
    [plain.exit, plain.out, recordOf(root, "sess-one")], [0, "", { name: THIS, form: "workstream" }]);

  // UNTOUCHED — a handover upgrades the workstream form, and a second paste of it is silent.
  const upgraded = hook(event(root, "sess-one", fenced(handover(toArc("N011")))), root);
  same("[MKT.HOOKS.49] a handover after a workstream name gives the arc form",
    [upgraded.exit, titleOf(upgraded), recordOf(root, "sess-one")],
    [0, "020-N011 artifacts-by-domain", { name: "020-N011 artifacts-by-domain", form: "arc" }]);
  const pasted = hook(event(root, "sess-one", fenced(handover(toArc("N011")))), root);
  same("[MKT.HOOKS.51] known-bad: the same handover pasted again is silent", [pasted.exit, pasted.out], [0, ""]);
  const back = hook(event(root, "sess-one", `back to ${THIS} in general`), root);
  same("[MKT.HOOKS.51] known-bad: naming the workstream after the arc form is silent, so the session keeps its arc",
    [back.exit, back.out, recordOf(root, "sess-one")], [0, "", { name: "020-N011 artifacts-by-domain", form: "arc" }]);

  // UNTOUCHED — a session is its own: another window in the same workspace is named from nothing.
  const second = hook(event(root, "sess-two", fenced(handover(RELOAD))), root);
  same("[MKT.HOOKS.49] the reload form names a second session for the workstream it opens",
    [second.exit, titleOf(second), recordOf(root, "sess-two")], [0, NEXT, { name: NEXT, form: "workstream" }]);
  same("[MKT.HOOKS.48] each session has its own record", recordsIn(root).sort(), ["sess-one.json", "sess-two.json"]);

  // UNTOUCHED — a window rooted in a member repository finds the workspace above it.
  const member = hook(event(root, "sess-three", `pick up ${THIS}`, join(root, "spn-support-ts", "src")), join(root, "spn-support-ts"));
  same("[MKT.HOOKS.48] a prompt typed in a member repository finds the workspace above it", [member.exit, titleOf(member)], [0, THIS]);
}

{
  // KNOWN-BAD — nothing bound: no answer and no record.
  const root = build("none");
  const two = hook(event(root, "sess-none", `compare ${THIS} with ${NEXT}`), root);
  const nothing = hook(event(root, "sess-none", "what is a hook?"), root);
  same("[MKT.HOOKS.50] known-bad: two workstreams in one prompt get no answer", [two.exit, two.out], [0, ""]);
  same("[MKT.HOOKS.50] known-bad: a prompt that names none gets no answer", [nothing.exit, nothing.out], [0, ""]);
  same("[MKT.HOOKS.50] and no record is written for a session that was given no name", recordsIn(root), []);

  // KNOWN-BAD — a session with no id gets no record and no name.
  const noId = hook({ cwd: root, hook_event_name: EVENT, prompt: `pick up ${THIS}` }, root);
  const emptyId = hook(event(root, "", `pick up ${THIS}`), root);
  const noUsableId = hook(event(root, "../..", `pick up ${THIS}`), root);
  same("[MKT.HOOKS.52] known-bad: a payload with no session id gets no name and no record",
    [noId.exit, noId.out, emptyId.exit, emptyId.out, noUsableId.exit, noUsableId.out, recordsIn(root)], [0, "", 0, "", 0, "", []]);
}

{
  // UNTOUCHED — a prompt that is not JSON-safe still gets valid JSON, with the exact name.
  const root = build("unsafe");
  const unsafe = `"quoted" and 'single'\n\twith a tab, a \\ backslash, \`backticks\`, \${braces} and </script>\r\nthen ${THIS} \u0000 "end`;
  const ran = hook(event(root, "sess-unsafe", unsafe), root);
  same("[MKT.HOOKS.52] a prompt holding quotes, newlines and backticks still gets valid JSON out",
    [ran.exit, titleOf(ran), ran.out.split("\n").length], [0, THIS, 1]);
  const block = hook(event(root, "sess-unsafe-arc", `"so" \`here\`:\n${handover(toArc("N011"))}\n"and" more`), root);
  same("[MKT.HOOKS.52] and so does a handover wrapped in quotes and backticks", [block.exit, titleOf(block)], [0, "020-N011 artifacts-by-domain"]);
}

{
  // KNOWN-BAD — a payload the script cannot read. Exit 0 and nothing printed, on either stream.
  const root = build("broken");
  for (const [what, input] of [
    ["a payload that is not JSON", `{"session_id": "sess-broken", "prompt": "pick up ${THIS}`],
    ["an empty payload", ""],
    ["a payload that is JSON `null`", "null"],
    ["a payload that is a list", `["${THIS}"]`],
    ["a prompt that is not text", JSON.stringify({ session_id: "sess-broken", cwd: root, prompt: { text: THIS } })],
    ["a session id that is not text", JSON.stringify({ session_id: 7, cwd: root, prompt: `pick up ${THIS}` })],
    ["a folder that is not text", JSON.stringify({ session_id: "sess-broken", cwd: 7, prompt: "what is a hook?" })],
  ]) {
    const ran = hook(input, root);
    same(`[MKT.HOOKS.52] known-bad: ${what} ends in exit 0 with nothing printed`, [ran.exit, ran.out, ran.err], [0, "", ""]);
  }
  same("[MKT.HOOKS.52] and none of them left a record", recordsIn(root), []);

  // KNOWN-BAD — outside any workspace there is nothing to name a session from.
  const outside = hook(event("/", "sess-outside", `pick up ${THIS}`), "/");
  same("[MKT.HOOKS.52] known-bad: a prompt typed outside any workspace ends in exit 0 with nothing printed",
    [outside.exit, outside.out, outside.err], [0, "", ""]);

  // KNOWN-BAD — a record that cannot be written gives no name, so the next prompt cannot give it twice.
  const blocked = build("blocked", { [`${DEVEX}/.debug/names`]: "a file where the folder of names belongs\n" });
  const ran = hook(event(blocked, "sess-blocked", `pick up ${THIS}`), blocked);
  same("[MKT.HOOKS.52] known-bad: a name that cannot be recorded is not given", [ran.exit, ran.out, ran.err], [0, "", ""]);

  // KNOWN-BAD — a record that holds something else is read as no record.
  const odd = build("odd-record", { [`${DEVEX}/.debug/names/sess-odd.json`]: "{\"name\": 7" });
  const reread = hook(event(odd, "sess-odd", `pick up ${THIS}`), odd);
  same("[MKT.HOOKS.52] a record that cannot be read counts as none, and the name is given",
    [reread.exit, titleOf(reread), recordOf(odd, "sess-odd")], [0, THIS, { name: THIS, form: "workstream" }]);
}

// ---------------------------------------------------------------- what the run cost, and the wiring
{
  const recording = () => { const copy = quiet(); delete copy.SPN_TELEMETRY; return copy; };
  const linesOf = (root) => {
    const log = join(root, DEVEX, ".debug", "telemetry", "hooks.jsonl");
    return existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)) : [];
  };
  const on = build("recorded", { [`${DEVEX}/.debug/telemetry.on`]: "on\n" });
  hook(event(on, "sess-timed", `pick up ${THIS}`), on, recording());
  same("[MKT.HOOKS.48] while recording is on, a run writes its check's line and its whole-run line",
    linesOf(on).map((line) => `${line.event} ${line.group} › ${line.action} ${line.session}`),
    [`${EVENT} prompt › name sess-timed`, `${EVENT} events › prompt sess-timed`]);
  const off = build("not-recorded");
  hook(event(off, "sess-timed", `pick up ${THIS}`), off, recording());
  same("[MKT.HOOKS.48] with recording off, a run writes no line", linesOf(off), []);

  const wiring = JSON.parse(readFileSync(resolve(PLUGIN, "src", "hooks", "hooks.json"), "utf8")).hooks[EVENT];
  same("[MKT.HOOKS.05] the wiring declares one entry for the prompt: the bundled script, with a 10 second timeout",
    wiring, [{ hooks: [{ type: "command", command: "node \"${CLAUDE_PLUGIN_ROOT}\"/dist/events/prompt.mjs", timeout: 10 }] }]);
}

console.log(failed ? `  ${failed} FAILED` : `  all ${n} passed`);
process.exit(failed ? 1 : 0);
