// The spn-apps PreToolUse hook's telemetry lines: the one shape every plugin writes, under
// `script: "spn-apps"`, with the work tags of the call (RD.DEVEX.WORKSPACE.185, N8 row 2p).
//
// A temporary workspace with `.spndevex/.debug/telemetry.on` is pointed at the recorder, in a child
// with `SPN_TELEMETRY` removed; nothing is written into a real workspace.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const EVENT = resolve(PLUGIN, "src", "scripts", "events", "pretooluse.ts");
const KEYS = ["script", "group", "subgroup", "action", "args", "event", "tool", "ms", "exit", "at",
  "repo", "pid", "session", "agent", "workstream", "arc", "order"];

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

const root = realpathSync(mkdtempSync(join(tmpdir(), "spn-apps-telemetry-")));
process.on("exit", () => rmSync(root, { recursive: true, force: true }));
const files = {
  ".spndevex/.debug/telemetry.on": "on\n",
  ".spndevex/workstreams/open/008-plain-language/notes/N8/orders/2p-plugin.md": "# order\n",
  "spn-sample-ts/sprepo.json": JSON.stringify({ type: "APPS", name: "Sample", config: { mtype: "APPS", stack: "TS" } }),
};
for (const [path, body] of Object.entries(files)) {
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(join(root, path), body, "utf8");
}

console.log("=== spn-apps — every line carries its plugin and the call's work");
{
  const env = { ...process.env };
  delete env.SPN_TELEMETRY;
  const payload = {
    session_id: "sess-apps", agent_id: "lane-2p", tool_name: "Edit", cwd: join(root, "spn-sample-ts"),
    tool_input: { file_path: join(root, "spn-sample-ts", "apps", "api", "src", "a.ts"), old_string: "a",
                  new_string: `// see ${root}/.spndevex/workstreams/open/008-plain-language/notes/N8/orders/2p-plugin.md` },
  };
  execFileSync("node", [EVENT], { input: JSON.stringify(payload), env, encoding: "utf8", cwd: payload.cwd });
  const lines = readFileSync(join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  same("every line has the seventeen keys, in the book's order", lines.every((l) => JSON.stringify(Object.keys(l)) === JSON.stringify(KEYS)), true);
  same("every line's script is the plugin", [...new Set(lines.map((l) => l.script))], ["spn-apps"]);
  same("every line carries the work tags", lines.every((l) => l.workstream === "008-plain-language" && l.arc === "N8"
    && l.order === "2p-plugin" && l.agent === "lane-2p" && l.session === "sess-apps"), true);
  same("a subject is its name and its stack, structured", lines.some((l) => l.group === "src" && l.action === "ts"), true);
  same("the whole run is events › pretooluse", lines.at(-1) && [lines.at(-1).group, lines.at(-1).action], ["events", "pretooluse"]);
  same("a hook check's exit is null, at ends in Z, and repo is the member",
    lines.every((l) => l.exit === null && /Z$/.test(l.at) && l.repo === "spn-sample-ts"), true);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — telemetry` : `\n  all ${total} passed — telemetry`);
process.exit(failed ? 1 : 0);
