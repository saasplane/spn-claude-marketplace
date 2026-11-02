// `lib/timing.ts` — the one telemetry library every plugin bundles (RULE.DEVEX.WORKSPACE.185).
//
// One row family, read by its `mtype`: every row holds `v`, `mtype`, `id`, `at`, `ms`, `event` and the head
// `session`, `agent`, `workstream`, `arc`, `part`, `skill`, `stage`, `work`, `retryOf`. A hook check writes one `CHECK` row
// (`check`, `verdict`, `out`) and the run as a whole writes none; a command writes one `COMMAND` row (`call`, `exit`).
// The work comes from the paths the tool call touches, `agent` from the hook input, carried forward per session and agent.
//
// The cases that write point a temporary workspace (with `.spndevex/README.md` and
// `.spndevex/.debug/switches.json`) at the recorder, in a child process with `SPN_TELEMETRY` removed; nothing is written into a real workspace.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { argsText, commandFacts, LINE_KEYS, repoOf, tagsOf } from "../../../src/lib/timing.ts";
import * as timing from "../../../src/lib/timing.ts";
import { WORKSTREAMS } from "../../../src/lib/docs-tree.ts";

const LIB = resolve(import.meta.dirname, "..", "..", "..", "src", "lib");
const BASE = realpathSync(mkdtempSync(join(tmpdir(), "spn-timing-")));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

/** A throwaway workspace: a folder holding `.spndevex`, with the files given. */
function workspace(name, files = {}) {
  const root = join(BASE, name);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(join(root, ".spndevex"), { recursive: true });
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), body, "utf8");
  }
  return root;
}

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

// A workspace's `.spndevex` holds its README beside `.debug/`; one holding `.debug/` alone is no workspace.
const ON = { ".spndevex/README.md": "# .spndevex\n", ".spndevex/.debug/switches.json": "{\"telemetry\": true}\n" };
const env = () => { const copy = { ...process.env }; delete copy.SPN_TELEMETRY; return copy; };
/** Run a module snippet against the library in a child, the way a hook process does. */
const child = (body) => execFileSync("node", ["--input-type=module", "-e",
  `import { begin, callOf, end, record, settle, span, tagsOf } from ${JSON.stringify(join(LIB, "timing.ts"))};\n${body}`],
  { env: env(), encoding: "utf8" });
const logOf = (root) => readFileSync(join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), "utf8")
  .trim().split("\n").map((l) => JSON.parse(l));

const WS = `/opt/work/saasplane/code/.spndevex/${WORKSTREAMS}/open/008-plain-language`;
const tags = (workstream, arc, part, agent = null) => ({ workstream, arc, part, agent });

console.log("=== tagsOf — the work a tool call touches");
same("an order file names the workstream, the arc and the part",
  tagsOf({ tool_input: { file_path: `${WS}/notes/N116/orders/M7-order-rules-telemetry-subtitle.md` } }),
  tags("008-plain-language", "N116", "M7-order-rules-telemetry-subtitle"));
same("an arc file names the workstream and the arc",
  tagsOf({ tool_input: { file_path: `${WS}/arcs/N116-r2-the-devex-release.md` } }),
  tags("008-plain-language", "N116", null));
same("an arc's notes name the arc",
  tagsOf({ tool_input: { file_path: `${WS}/notes/N116/plan.md` } }),
  tags("008-plain-language", "N116", null));
// AN ARC NUMBERED IN THREE DIGITS, as an arc's file and its notes folder write it, keeps its
// zeros: the arc file, a preview, a sample and an order all name the same arc.
same("a three-digit arc file names its arc with its zeros",
  tagsOf({ tool_input: { file_path: `${WS}/arcs/N001-book-change.md` } }),
  tags("008-plain-language", "N001", null));
same("a preview under an arc's previews folder names the arc",
  tagsOf({ tool_input: { file_path: `${WS}/notes/N001/previews/sample1-preview.html` } }),
  tags("008-plain-language", "N001", null));
same("a sample under an arc's samples folder names the arc",
  tagsOf({ tool_input: { file_path: `${WS}/notes/N001/samples/close-message.md` } }),
  tags("008-plain-language", "N001", null));
same("an order under an arc's orders folder names the arc and the part",
  tagsOf({ tool_input: { file_path: `${WS}/notes/N001/orders/B1-book.md` } }),
  tags("008-plain-language", "N001", "B1-book"));
same("a relative three-digit arc path, from inside the workstream, names the arc",
  tagsOf({ cwd: WS, tool_input: { command: "sed -n 1,20p arcs/N001-book-change.md" } }),
  tags("008-plain-language", "N001", null));
same("a one-digit and a two-digit arc still name theirs",
  [tagsOf({ tool_input: { file_path: `${WS}/arcs/N1-a.md` } }).arc, tagsOf({ tool_input: { file_path: `${WS}/notes/N15/plan.md` } }).arc],
  ["N1", "N15"]);
same("the approach page names the workstream alone",
  tagsOf({ tool_input: { file_path: `${WS}/plain-language-approach.html` } }),
  tags("008-plain-language", null, null));
same("a command is read for paths too, and the most specific wins",
  tagsOf({ tool_input: { command: `cat ${WS}/plain-language-approach.html '${WS}/arcs/N116-r2.md' && rg x ${WS}/notes/N116/orders/B5-state.md` } }),
  tags("008-plain-language", "N116", "B5-state"));
same("backlog and closed are workstreams too",
  tagsOf({ tool_input: { file_path: `/w/.spndevex/${WORKSTREAMS}/closed/003-cloud-day-0/arcs/N2-x.md` } }),
  tags("003-cloud-day-0", "N2", null));
same("a relative arc path counts when the call runs inside a workstream",
  tagsOf({ cwd: WS, tool_input: { command: "sed -n 1,20p arcs/N116-r2-the-devex-release.md" } }),
  tags("008-plain-language", "N116", null));
same("a relative order path in a notes folder named past its arc counts too",
  tagsOf({ cwd: WS, tool_input: { command: "cat notes/N8-telemetry/orders/2p-plugin.md" } }),
  tags("008-plain-language", "N8", "2p-plugin"));
same("a relative arc path outside any workstream names nothing",
  tagsOf({ cwd: "/opt/work/saasplane/code/spn-foundation", tool_input: { command: "cat arcs/N116.md" } }),
  tags(null, null, null));
same("a call touching no workstream carries nulls",
  tagsOf({ tool_input: { file_path: "/opt/work/saasplane/code/spn-foundation/docs/README.md" } }),
  tags(null, null, null));
same("the agent comes from the hook input",
  tagsOf({ agent_id: "a238c7be035fb1b2e", tool_input: { file_path: `${WS}/arcs/N116-x.md` } }),
  tags("008-plain-language", "N116", null, "a238c7be035fb1b2e"));
same("an edit's strings are read as well as its path",
  tagsOf({ tool_input: { file_path: "/tmp/x.md", old_string: "a", new_string: `see ${WS}/notes/N116/orders/M7-x.md` } }),
  tags("008-plain-language", "N116", "M7-x"));
same("a notes folder named past its arc (`notes/N8-telemetry/`) names the arc and the part",
  tagsOf({ tool_input: { file_path: `${WS}/notes/N8-telemetry/orders/2p-plugin.md` } }),
  tags("008-plain-language", "N8", "2p-plugin"));
same("and its plan names the arc", tagsOf({ tool_input: { file_path: `${WS}/notes/N8-telemetry/plan.md` } }),
  tags("008-plain-language", "N8", null));
same("no payload never throws", tagsOf(undefined), tags(null, null, null));

console.log("\n=== the row — one family, one row for each check");
{
  const root = workspace("n8-shape", { ...ON, "spn-support-ts/README.md": "x\n" });
  child(`
    const payload = { session_id: "s1", agent_id: "ag1", tool_input: { file_path: ${JSON.stringify(`${WS}/arcs/N116-x.md`)} } };
    begin({ script: "spn-devex", event: "PreToolUse", tool: "Read", session: payload.session_id, ...tagsOf(payload),
            cwd: ${JSON.stringify(join(root, "spn-support-ts"))}, process: { group: "events", action: "pretooluse" } },
          ${JSON.stringify(root)});
    span({ group: "split-plan", action: "close" }, () => 1);
    record({ group: "saasplane-env", action: "saasplane-env" }, 1.5);
    end();`);
  const lines = logOf(root);
  same("[MKT.SCRIPTS.330] one row for each check and no whole-run line", lines.length, 2);
  same("[MKT.SCRIPTS.330] every row holds the base and the head, in order, then the check's own keys", lines.map((l) => Object.keys(l).join(",")),
    lines.map(() => [...LINE_KEYS, "check", "verdict", "out"].join(",")));
  same("[MKT.SCRIPTS.330] the keys are the family's base and head", LINE_KEYS, ["v", "mtype", "id", "at", "ms", "event", "session", "agent",
    "workstream", "arc", "part", "skill", "stage", "work", "retryOf"]);
  same("[MKT.SCRIPTS.330] a check's row is version 1, mtype CHECK, named by its action", [lines[0].v, lines[0].mtype, lines[0].check, lines[1].check],
    [1, "CHECK", "close", "saasplane-env"]);
  same("[MKT.SCRIPTS.471] every written row holds `stage`, right after `skill`, in LINE_KEYS order", lines.map((l) => Object.keys(l).slice(0, LINE_KEYS.length).join(",")),
    lines.map(() => LINE_KEYS.join(",")));
  same("[MKT.SCRIPTS.471] and `stage` follows `skill` in LINE_KEYS", LINE_KEYS.indexOf("stage"), LINE_KEYS.indexOf("skill") + 1);
  same("[MKT.SCRIPTS.330] its event is the hook's", lines.map((l) => l.event), ["PreToolUse", "PreToolUse"]);
  same("[MKT.SCRIPTS.330] a row's id is short and its own", [lines.every((l) => /^[A-Za-z0-9_-]{1,64}$/.test(l.id)), lines[0].id !== lines[1].id], [true, true]);
  same("[MKT.SCRIPTS.330] `at` is UTC ending in Z", lines.every((l) => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(l.at)), true);
  same("[MKT.SCRIPTS.330] with the call's work and agent", [lines[0].workstream, lines[0].arc, lines[0].part, lines[0].agent, lines[0].session],
    ["008-plain-language", "N116", null, "ag1", "s1"]);
  same("[MKT.SCRIPTS.330] no skill, no work and no retry where the call names none", [lines[0].skill, lines[0].work, lines[0].retryOf], [null, null, null]);
  same("[MKT.SCRIPTS.330] no row holds a path, a script or a repo", Object.keys(lines[0]).filter((k) => ["script", "repo", "tool", "pid", "order", "row"].includes(k)), []);
}
{
  const root = workspace("n8-head", ON);
  child(`
    const payload = { session_id: "sh", tool_input: { command: "workspace status" } };
    begin({ script: "spn-devex", event: "PreToolUse", tool: "Bash", session: "sh", workstream: "not a workstream", arc: "n17", part: "Code Part",
            skill: "spn-devex:execute", work: "CODE" }, ${JSON.stringify(root)});
    record({ group: "Bad Name", action: "Bad Name" }, 1);
    record({ group: "ok", action: "ok-check" }, 1);
    end();`);
  const lines = logOf(root);
  same("[MKT.SCRIPTS.330] a workstream, arc or part off its pattern is written null, and a skill the copy does not know too",
    [lines[0].workstream, lines[0].arc, lines[0].part, lines[0].skill], [null, null, null, null]);
  same("[MKT.SCRIPTS.330] a check whose name is off its pattern writes no row", lines.map((l) => l.check), ["ok-check"]);
  same("[MKT.SCRIPTS.330] the work a caller names is kept", lines[0].work, "CODE");
}
{
  const root = workspace("n8-head-ok", ON);
  child(`
    begin({ script: "spn-devex", event: "PreToolUse", tool: "Bash", session: "sk", workstream: "036-agent-follows-rules", arc: "N017",
            part: "code-spn-claude-marketplace-4", skill: "DEVEX_EXECUTE" }, ${JSON.stringify(root)});
    record({ group: "a", action: "a-check" }, 1);
    end();`);
  const row = logOf(root)[0];
  same("[MKT.SCRIPTS.330] a part names its work by its prefix when the caller names none", [row.workstream, row.arc, row.part, row.skill, row.work],
    ["036-agent-follows-rules", "N017", "code-spn-claude-marketplace-4", "DEVEX_EXECUTE", "CODE"]);
}
{
  const root = workspace("n8-cli", ON);
  child(`
    begin({ script: "spn-apps", event: "command", tool: null, session: null, cwd: ${JSON.stringify(root)},
            process: { group: "cli", action: "cli", args: "docs audit x" } }, ${JSON.stringify(root)});
    record({ group: "docs", action: "audit", args: "x" }, 12, 1);
    end(1);`);
  const lines = logOf(root);
  same("[MKT.SCRIPTS.330] a command writes one COMMAND row: its call and its exit, and never what was typed", [lines.length, lines[0].mtype, lines[0].call, lines[0].exit, JSON.stringify(lines).includes("audit x")],
    [1, "COMMAND", { program: "spn-apps", group: "cli", action: "cli" }, 1, false]);
  same("[MKT.SCRIPTS.330] a command's row holds no verdict and no check", [lines[0].event, "verdict" in lines[0], "check" in lines[0]], ["command", false, false]);
}
{
  const root = workspace("n8-async", ON);
  child(`
    begin({ script: "spn-apps", event: "PreToolUse", tool: "Edit", session: "s", process: { group: "events", action: "pretooluse" } }, ${JSON.stringify(root)});
    await span({ group: "src", action: "ts" }, () => new Promise((done) => setTimeout(() => done(null), 30)));
    end();`);
  same("[MKT.SCRIPTS.330] an asynchronous check is timed until it settles", logOf(root)[0].ms >= 25, true);
}

console.log("\n=== repoOf and argsText");
same("a member folder names its repository", repoOf("/w", "/w/spn-support-ts/packages/x"), "spn-support-ts");
same("the workspace root is null", repoOf("/w", "/w"), null);
same("the workspace's own `.spndevex` is not a repository", repoOf("/w", "/w/.spndevex/workstreams"), null);
same("a folder outside the workspace is null", repoOf("/w", "/elsewhere"), null);
same("a secret option's value is written ***, spaced or with =",
  argsText(["set", "--token", "abc", "--api-key=zzz", "--Password", "p", "--client-secret=s", "FOO"]),
  "set --token *** --api-key=*** --Password *** --client-secret=*** FOO");
same("nothing typed reads null", argsText([]), null);
same("a word with a space keeps its quotes", argsText(["-m", "two words"]), `-m "two words"`);

console.log("\n=== stage — written with the row, from the skill and work, else the stage the window last carried");
{
  const root = workspace("e160-stage", ON);
  const command = (session, agent, part, skill) => child(`
    begin({ script: "spn-devex", event: "command", tool: null, session: ${JSON.stringify(session)}, agent: ${JSON.stringify(agent)},
            workstream: "036-x", arc: "N017", part: ${JSON.stringify(part)}, skill: ${JSON.stringify(skill)}, process: { group: "cli", action: "cli" } }, ${JSON.stringify(root)});
    end(0);`);
  command("st1", "h1", "docs-spn-x-1", null);
  command("st2", "h2", "release-spn-x-1", null);
  command("st3", null, null, "DEVEX_IDEATE");
  command("st3", null, null, null);
  command("st4", null, null, null);
  const bySession = (id) => logOf(root).filter((row) => row.session === id).map((row) => row.stage);
  same("[MKT.SCRIPTS.470] a helper's COMMAND row with no skill and the part 'docs-spn-x-1' carries stage DEVELOP", bySession("st1"), ["DEVELOP"]);
  same("[MKT.SCRIPTS.470] a release part gives DELIVER", bySession("st2"), ["DELIVER"]);
  same("[MKT.SCRIPTS.470] a row with neither skill nor work, in a window that last carried IDEATE, carries IDEATE", bySession("st3"), ["IDEATE", "IDEATE"]);
  same("[MKT.SCRIPTS.470] a fresh window with nothing carries null", bySession("st4"), [null]);
  same("[MKT.SCRIPTS.471] the keys of every row written include `stage`", logOf(root).every((row) => "stage" in row), true);
}

console.log("\n=== the ideate and follow-up arcs — a path under notes/ideate/ or notes/follow-ups/");
same("[MKT.SCRIPTS.470] an order under notes/ideate/orders/ names the arc `ideate` and its part; one under notes/follow-ups/ the arc `follow-ups`",
  [tagsOf({ tool_input: { file_path: `${WS}/notes/ideate/orders/docs-spn-x-1.md` } }), tagsOf({ tool_input: { file_path: `${WS}/notes/follow-ups/plan.md` } })],
  [tags("008-plain-language", "ideate", "docs-spn-x-1"), tags("008-plain-language", "follow-ups", null)]);

console.log("\n=== 2o — the tags carry forward to a call that touches no workstream path");
{
  const root = workspace("m2o-carry", ON);
  const ORDER = `${WS}/notes/N122/orders/h-marketplace.md`;
  const call = (payload) => child(`
    const payload = ${JSON.stringify(payload)};
    begin({ script: "spn-devex", event: "PreToolUse", tool: "Read", session: payload.session_id, ...tagsOf(payload),
            process: { group: "events", action: "pretooluse" } }, ${JSON.stringify(root)});
    record({ group: "a-check", action: "a-check" }, 1);
    end();`);
  const repoFile = { file_path: "/opt/work/saasplane/code/spn-claude-marketplace/packages/plugin-support-lib/src/lib/timing.ts" };
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: { file_path: ORDER } });
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: repoFile });
  call({ session_id: "s2o", agent_id: "lane-g", tool_input: repoFile });
  call({ session_id: "s2o", tool_input: repoFile });
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: { file_path: `${WS}/notes/N122/spec.md` } });
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: repoFile });
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: { file_path: `${WS}/arcs/N008-the-workstream-closes.md` } });
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: repoFile });
  call({ session_id: "other", agent_id: "lane-h", tool_input: repoFile });
  const rows = logOf(root).filter((row) => row.check === "a-check").map((row) => [row.workstream, row.arc, row.part]);
  same("2o: a lane's call after reading its order carries the order's workstream, arc and part", rows[1],
    ["008-plain-language", "N122", "h-marketplace"]);
  same("2o: another agent in the same session does not inherit the lane's tags", rows[2], [null, null, null]);
  same("2o: the main window (no agent) does not inherit a lane's tags", rows[3], [null, null, null]);
  same("2o: a call inside the same arc keeps the part it carries", rows[4], ["008-plain-language", "N122", "h-marketplace"]);
  same("2o: and the untagged call after it still carries the order", rows[5], ["008-plain-language", "N122", "h-marketplace"]);
  same("2o: a call that names other work replaces the tags", rows[6], ["008-plain-language", "N008", null]);
  same("2o: and the untagged call after it carries the new work", rows[7], ["008-plain-language", "N008", null]);
  same("2o: another session inherits nothing", rows[8], [null, null, null]);
}
{
  const root = workspace("m2o-off", {});
  child(`
    const payload = { session_id: "s", tool_input: { file_path: ${JSON.stringify(`${WS}/arcs/N116-x.md`)} } };
    begin({ script: "spn-devex", event: "PreToolUse", tool: "Read", session: "s", ...tagsOf(payload) }, ${JSON.stringify(root)});
    record({ group: "a-check", action: "a-check" }, 1);
    end();`);
  same("2o: with telemetry off, no tag state is written", existsSync(join(root, ".spndevex", ".debug", "telemetry")), false);
}

console.log("\n=== commandFacts — a command run through the shell has no hook payload");
{
  const saved = { id: process.env.CLAUDE_CODE_SESSION_ID, old: process.env.CLAUDE_SESSION_ID };
  process.env.CLAUDE_CODE_SESSION_ID = "sess-42";
  delete process.env.CLAUDE_SESSION_ID;
  const facts = commandFacts("spn-devex", ["audit", `${WS}/notes/N120/orders/B1-marketplace-coverage.md`]);
  same("the session comes from CLAUDE_CODE_SESSION_ID, the variable Claude Code exports", facts.session, "sess-42");
  same("the work comes from the command's own arguments", [facts.workstream, facts.arc, facts.part],
    ["008-plain-language", "N120", "B1-marketplace-coverage"]);
  same("a command's line is marked as one, under its plugin", [facts.script, facts.event, facts.tool], ["spn-devex", "command", null]);
  same("[MKT.SCRIPTS.330] its call is the first two plain words typed: group and action", [facts.process.group, facts.process.action], ["audit", null]);
  delete process.env.CLAUDE_CODE_SESSION_ID;
  same("no session exported reads as null, never a guess", commandFacts("spn-devex", ["audit", "docs"]).session, null);
  same("a command touching no workstream path carries null tags", commandFacts("spn-devex", ["audit", "docs"]).workstream, null);
  if (saved.id !== undefined) process.env.CLAUDE_CODE_SESSION_ID = saved.id;
  if (saved.old !== undefined) process.env.CLAUDE_SESSION_ID = saved.old;
}

console.log("\n=== verdict and out — what a check decided, and the bytes it put into the context");
{
  const root = workspace("n8-verdict", ON);
  child(`
    begin({ script: "spn-devex", event: "PreToolUse", tool: "Bash", session: "sv", process: { group: "events", action: "pretooluse" } },
          ${JSON.stringify(root)});
    span({ group: "quiet", action: "quiet" }, () => null);
    span({ group: "noting", action: "noting" }, () => ({ note: "héllo" }));
    span({ group: "denying", action: "denying" }, () => ({ deny: "no" }));
    end();`);
  const lines = logOf(root);
  same("[MKT.SCRIPTS.330] a check that says nothing is PASS with no `out`", [lines[0].verdict, lines[0].out], ["PASS", null]);
  same("[MKT.SCRIPTS.330] a noting check is NOTE with the bytes of its words", [lines[1].verdict, lines[1].out], ["NOTE", 6]);
  same("[MKT.SCRIPTS.330] a denying check is DENY with the bytes of its reason: a send-back is this row", [lines[2].verdict, lines[2].out], ["DENY", 2]);
  same("[MKT.SCRIPTS.330] the three rows are the run's only rows, in the order the checks ran", lines.map((l) => l.check), ["quiet", "noting", "denying"]);
}
{
  const root = workspace("n8-settle", ON);
  child(`
    begin({ script: "spn-devex", event: "Stop", tool: null, session: "ss" }, ${JSON.stringify(root)});
    span({ group: "a", action: "split-plan" }, () => [{ check: "split-plan", deny: "held" }]);
    span({ group: "b", action: "proof-run" }, () => [{ check: "proof-run", message: "held" }]);
    settle(["split-plan"]);
    end();`);
  const lines = logOf(root);
  same("[MKT.SCRIPTS.330] at Stop, a finding not said is a NOTE and one said stays DENY", lines.map((l) => [l.check, l.verdict]),
    [["split-plan", "DENY"], ["proof-run", "NOTE"]]);
}
{
  const root = workspace("n8-verdict-command", ON);
  child(`
    begin({ script: "spn-apps", event: "command", tool: null, session: null, process: { group: "cli", action: "cli" } }, ${JSON.stringify(root)});
    end(0);`);
  same("[MKT.SCRIPTS.330] a command's row carries no verdict and no `out`", logOf(root).map((l) => [l.verdict ?? null, l.out ?? null]), [[null, null]]);
}

console.log("\n=== part — read from the order's name or the go start a Bash call makes, and its work from its prefix");
{
  const orderFile = `${WS}/notes/N008/orders/code-spn-claude-marketplace-4.md`;
  same("[MKT.SCRIPTS.329] the part is the order file's stem, never its report", [tagsOf({ tool_input: { file_path: orderFile } }).part,
    tagsOf({ tool_input: { file_path: orderFile.replace(".md", ".report.md") } }).part], ["code-spn-claude-marketplace-4", "code-spn-claude-marketplace-4"]);
  same("[MKT.SCRIPTS.329] and never a sentence's punctuation after the name", tagsOf({ tool_input: { command: `cat ${orderFile},` } }).part, "code-spn-claude-marketplace-4");
  same("[MKT.SCRIPTS.329] a go start names the workstream, the arc and the part",
    tagsOf({ tool_input: { command: "spn-devex workstream go start 036-agent-follows-rules/N017 code-spn-claude-marketplace-4" } }),
    tags("036-agent-follows-rules", "N017", "code-spn-claude-marketplace-4"));
  same("[MKT.SCRIPTS.329] a bare number names no workstream folder",
    tagsOf({ tool_input: { command: "spn-devex workstream go start 036/N017 docs-spn-foundation-1" } }),
    tags(null, "N017", "docs-spn-foundation-1"));
  same("[MKT.SCRIPTS.329] a part's work comes from its prefix", ["docs-a", "code-a", "generated-a", "design-a", "release-a", "proof-a", "baseline-a", "full-a", "other-a", "none"].map((one) => timing.workOfPart(one)),
    ["DOCS", "CODE", "GENERATED", "DESIGN", "RELEASE", "PROOF", "TEST", "TEST", null, null]);
  const root = workspace("n8-part", ON);
  child(`
    const call = (payload) => {
      begin({ script: "spn-devex", event: "PreToolUse", tool: "Read", session: "sp", ...tagsOf(payload), process: { group: "events", action: "pretooluse" } }, ${JSON.stringify(root)});
      record({ group: "a-check", action: "a-check" }, 1);
      end();
    };
    call({ session_id: "sp", tool_input: { command: "spn-devex workstream go start 036-agent-follows-rules/N017 proof-the-lot" } });
    call({ session_id: "sp", tool_input: { file_path: "/private/tmp/x.ts" } });`);
  const rows = logOf(root);
  same("[MKT.SCRIPTS.329] a row carries the part and its work, and the next call that names none carries both",
    rows.map((r) => [r.workstream, r.arc, r.part, r.work]), [["036-agent-follows-rules", "N017", "proof-the-lot", "PROOF"], ["036-agent-follows-rules", "N017", "proof-the-lot", "PROOF"]]);
}

console.log("\n=== callOf — the program of a Bash command and the kind of file a call touches, never the path (MKT.HOOKS.321)");
{
  const root = workspace("e72-kinds", { ...ON, "spn-claude-marketplace/README.md": "x\n" });
  const repo = join(root, "spn-claude-marketplace");
  const at = (tool_name, tool_input) => timing.callOf({ tool_name, tool_input, cwd: repo });
  same("a Bash call records its first program", at("Bash", { command: "node tests/unit/t-a.mjs" }).program, "node");
  same("after a cd and env assignments", at("Bash", { command: "cd /x/y && FOO=1 BAR=2 grep -rn a src" }).program, "grep");
  same("a program is its name, never its folder", at("Bash", { command: "/usr/bin/python3 -I x.py" }).program, "python3");
  same("a Read, Edit or Write records no program", [at("Read", { file_path: join(repo, "src/a.ts") }).program, at("Edit", { file_path: join(repo, "src/a.ts") }).program], [null, null]);
  same("a file under .spndevex is WORKSTREAM", at("Edit", { file_path: join(root, ".spndevex/workstreams/open/036-x/approach.html") }).pathKind, "WORKSTREAM");
  same("a file in a tests folder is TEST", at("Read", { file_path: join(repo, "packages/p/tests/unit/a.mjs") }).pathKind, "TEST");
  same("a test file name is TEST", at("Write", { file_path: join(repo, "packages/p/src/t-thing.mjs") }).pathKind, "TEST");
  same("any other file in a repository is SOURCE", at("Edit", { file_path: join(repo, "packages/p/src/a.ts") }).pathKind, "SOURCE");
  same("a file outside any repository is OTHER", at("Write", { file_path: "/private/tmp/x/a.ts" }).pathKind, "OTHER");
  same("a worktree's file is SOURCE", at("Edit", { file_path: "/opt/work/saasplane/code/.worktrees/036-x/spn-y/src/a.ts" }).pathKind, "SOURCE");
  same("a Bash call takes its kind from the paths it names", [
    at("Bash", { command: "cat .spndevex/state.json" }).pathKind,
    at("Bash", { command: "node packages/p/tests/unit/t-a.mjs" }).pathKind,
    at("Bash", { command: "sed -i s/a/b/ packages/p/src/a.ts" }).pathKind,
    at("Bash", { command: "cp /private/tmp/a /private/tmp/b" }).pathKind,
  ], ["WORKSTREAM", "TEST", "SOURCE", "OTHER"]);
  same("a workstream path outranks a source path in one command", at("Bash", { command: "cp packages/p/src/a.ts .spndevex/x" }).pathKind, "WORKSTREAM");
  same("a Bash call naming no path has no kind, and a tool without one has none", [at("Bash", { command: "git status" }).pathKind, at("Agent", {}).pathKind], [null, null]);
  same("no payload never throws", timing.callOf(undefined), { program: null, pathKind: null });

  const path = join(repo, "packages/p/src/a.ts");
  child(`
    const payload = { session_id: "k1", cwd: ${JSON.stringify(repo)}, tool_name: "Edit", tool_input: { file_path: ${JSON.stringify(path)} } };
    begin({ script: "spn-devex", event: "PreToolUse", tool: "Edit", session: "k1", ...tagsOf(payload), ...callOf(payload),
            process: { group: "events", action: "pretooluse" } }, ${JSON.stringify(root)});
    record({ group: "a-check", action: "a-check" }, 1);
    end();`);
  const lines = logOf(root);
  same("[MKT.SCRIPTS.330] a check's row carries neither the program nor the kind", [lines.length, "program" in lines[0], "pathKind" in lines[0]], [1, false, false]);
  same("[MKT.SCRIPTS.330] no row holds the path", JSON.stringify(lines).includes("a.ts"), false);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — timing` : `\n  all ${total} passed — timing`);
process.exit(failed ? 1 : 0);
