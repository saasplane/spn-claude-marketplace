// `lib/timing.ts` — the one telemetry library every plugin bundles (RD.DEVEX.WORKSPACE.185).
//
// Each line has one shape, key for key: `script`, `group`, `subgroup`, `action`, `args`, `event`,
// `tool`, `ms`, `exit`, `at`, `repo`, `pid`, `session`, `agent`, `workstream`, `arc`, `order`. And
// each says which work it belongs to: `workstream`, `arc` and `order` from the paths the tool call
// touches, `agent` from the hook input, carried forward per session and agent.
//
// The cases that write point a temporary workspace (with `.spndevex/.debug/telemetry.on`) at the
// recorder, in a child process with `SPN_TELEMETRY` removed; nothing is written into a real workspace.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { argsText, commandFacts, LINE_KEYS, repoOf, tagsOf } from "../../../src/lib/timing.ts";
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

const ON = { ".spndevex/.debug/telemetry.on": "on\n" };
const env = () => { const copy = { ...process.env }; delete copy.SPN_TELEMETRY; return copy; };
/** Run a module snippet against the library in a child, the way a hook process does. */
const child = (body) => execFileSync("node", ["--input-type=module", "-e",
  `import { begin, end, record, span, tagsOf } from ${JSON.stringify(join(LIB, "timing.ts"))};\n${body}`],
  { env: env(), encoding: "utf8" });
const logOf = (root) => readFileSync(join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), "utf8")
  .trim().split("\n").map((l) => JSON.parse(l));

const WS = `/opt/work/saasplane/code/.spndevex/${WORKSTREAMS}/open/008-plain-language`;
const tags = (workstream, arc, order, agent = null) => ({ workstream, arc, order, agent });

console.log("=== tagsOf — the work a tool call touches");
same("an order file names the workstream, the arc and the order",
  tagsOf({ tool_input: { file_path: `${WS}/notes/N116/orders/M7-order-rules-telemetry-subtitle.md` } }),
  tags("008-plain-language", "N116", "M7-order-rules-telemetry-subtitle"));
same("an arc file names the workstream and the arc",
  tagsOf({ tool_input: { file_path: `${WS}/arcs/N116-r2-the-devex-release.md` } }),
  tags("008-plain-language", "N116", null));
same("an arc's notes name the arc",
  tagsOf({ tool_input: { file_path: `${WS}/notes/N116/plan.md` } }),
  tags("008-plain-language", "N116", null));
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
same("a notes folder named past its arc (`notes/N8-telemetry/`) names the arc and the order",
  tagsOf({ tool_input: { file_path: `${WS}/notes/N8-telemetry/orders/2p-plugin.md` } }),
  tags("008-plain-language", "N8", "2p-plugin"));
same("and its plan names the arc", tagsOf({ tool_input: { file_path: `${WS}/notes/N8-telemetry/plan.md` } }),
  tags("008-plain-language", "N8", null));
same("no payload never throws", tagsOf(undefined), tags(null, null, null));

console.log("\n=== the line — one shape, key for key");
{
  const root = workspace("n8-shape", { ...ON, "spn-support-ts/README.md": "x\n" });
  child(`
    const payload = { session_id: "s1", agent_id: "ag1", tool_input: { file_path: ${JSON.stringify(`${WS}/arcs/N116-x.md`)} } };
    begin({ script: "spn-devex", event: "PreToolUse", tool: "Read", session: payload.session_id, ...tagsOf(payload),
            cwd: ${JSON.stringify(join(root, "spn-support-ts"))}, process: { group: "events", action: "pretooluse" } },
          ${JSON.stringify(root)});
    span({ group: "split-plan", action: "close" }, () => 1);
    record({ group: "env-seat", action: "env-seat" }, 1.5);
    end();`);
  const lines = logOf(root);
  same("every line has the seventeen keys, in the book's order", lines.map((l) => Object.keys(l).join(",")),
    lines.map(() => LINE_KEYS.join(",")));
  same("the keys are the approved preview's", LINE_KEYS, ["script", "group", "subgroup", "action", "args", "event", "tool",
    "ms", "exit", "at", "repo", "pid", "session", "agent", "workstream", "arc", "order"]);
  same("a check's name is structured, never a parsed string", [lines[0].script, lines[0].group, lines[0].subgroup, lines[0].action],
    ["spn-devex", "split-plan", null, "close"]);
  same("a hook check's `exit` and `args` are null", [lines[0].exit, lines[0].args, lines[1].exit, lines[1].args], [null, null, null, null]);
  same("the whole run is group `events`, action the entry", [lines[2].group, lines[2].action], ["events", "pretooluse"]);
  same("`at` is UTC ending in Z", lines.every((l) => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(l.at)), true);
  same("`repo` is the member the call ran in", lines.map((l) => l.repo), ["spn-support-ts", "spn-support-ts", "spn-support-ts"]);
  same("with the call's work and agent", [lines[0].workstream, lines[0].arc, lines[0].order, lines[0].agent, lines[0].session],
    ["008-plain-language", "N116", null, "ag1", "s1"]);
}
{
  const root = workspace("n8-cli", ON);
  child(`
    begin({ script: "spn-apps", event: "command", tool: null, session: null, cwd: ${JSON.stringify(root)},
            process: { group: "cli", action: "cli", args: "docs audit x" } }, ${JSON.stringify(root)});
    record({ group: "docs", action: "audit", args: "x" }, 12, 1);
    end(1);`);
  const lines = logOf(root);
  same("a plugin command writes its exit and what followed the action", [lines[0].script, lines[0].group, lines[0].action, lines[0].args, lines[0].exit],
    ["spn-apps", "docs", "audit", "x", 1]);
  same("a CLI process is group `cli`, action `cli`, with its exit", [lines[1].group, lines[1].action, lines[1].exit], ["cli", "cli", 1]);
  same("`repo` is null at the workspace root", lines.map((l) => l.repo), [null, null]);
}
{
  const root = workspace("n8-async", ON);
  child(`
    begin({ script: "spn-apps", event: "PreToolUse", tool: "Edit", session: "s", process: { group: "events", action: "pretooluse" } }, ${JSON.stringify(root)});
    await span({ group: "src", action: "ts" }, () => new Promise((done) => setTimeout(() => done(null), 30)));
    end();`);
  same("an asynchronous check is timed until it settles", logOf(root)[0].ms >= 25, true);
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

console.log("\n=== 2o — the tags carry forward to a call that touches no workstream path");
{
  const root = workspace("m2o-carry", ON);
  const ORDER = `${WS}/notes/N122/orders/H-marketplace.md`;
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
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: { file_path: `${WS}/arcs/N8-the-workstream-closes.md` } });
  call({ session_id: "s2o", agent_id: "lane-h", tool_input: repoFile });
  call({ session_id: "other", agent_id: "lane-h", tool_input: repoFile });
  const rows = logOf(root).filter((row) => row.group === "a-check").map((row) => [row.workstream, row.arc, row.order]);
  same("2o: a lane's call after reading its order carries the order's workstream, arc and order", rows[1],
    ["008-plain-language", "N122", "H-marketplace"]);
  same("2o: another agent in the same session does not inherit the lane's tags", rows[2], [null, null, null]);
  same("2o: the main window (no agent) does not inherit a lane's tags", rows[3], [null, null, null]);
  same("2o: a call inside the same arc keeps the order it carries", rows[4], ["008-plain-language", "N122", "H-marketplace"]);
  same("2o: and the untagged call after it still carries the order", rows[5], ["008-plain-language", "N122", "H-marketplace"]);
  same("2o: a call that names other work replaces the tags", rows[6], ["008-plain-language", "N8", null]);
  same("2o: and the untagged call after it carries the new work", rows[7], ["008-plain-language", "N8", null]);
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
  same("the work comes from the command's own arguments", [facts.workstream, facts.arc, facts.order],
    ["008-plain-language", "N120", "B1-marketplace-coverage"]);
  same("a command's line is marked as one, under its plugin", [facts.script, facts.event, facts.tool], ["spn-devex", "command", null]);
  same("its whole run is group `cli`, action `cli`", [facts.process.group, facts.process.action], ["cli", "cli"]);
  delete process.env.CLAUDE_CODE_SESSION_ID;
  same("no session exported reads as null, never a guess", commandFacts("spn-devex", ["audit", "docs"]).session, null);
  same("a command touching no workstream path carries null tags", commandFacts("spn-devex", ["audit", "docs"]).workstream, null);
  if (saved.id !== undefined) process.env.CLAUDE_CODE_SESSION_ID = saved.id;
  if (saved.old !== undefined) process.env.CLAUDE_SESSION_ID = saved.old;
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — timing` : `\n  all ${total} passed — timing`);
process.exit(failed ? 1 : 0);
