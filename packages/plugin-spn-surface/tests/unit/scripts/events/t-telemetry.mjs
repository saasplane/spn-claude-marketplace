// The spn-surface PreToolUse hook's telemetry lines: the one shape every plugin writes, under
// `script: "spn-surface"`, with the work tags of the call (RULE.DEVEX.WORKSPACE.185).
//
// A temporary workspace with `.spndevex/.debug/switches.json` is pointed at the recorder, in a child
// with `SPN_TELEMETRY` removed; nothing is written into a real workspace.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const EVENT = resolve(PLUGIN, "src", "scripts", "events", "pretooluse.ts");
const KEYS = ["script", "group", "subgroup", "action", "args", "event", "tool", "ms", "exit", "at",
  "repo", "pid", "verdict", "out", "session", "agent", "workstream", "arc", "order", "row"];

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

const root = realpathSync(mkdtempSync(join(tmpdir(), "spn-surface-telemetry-")));
process.on("exit", () => rmSync(root, { recursive: true, force: true }));
const files = {
  ".spndevex/.debug/switches.json": "{\"telemetry\": true}\n",
  ".spndevex/workstreams/open/033-surface-agent/notes/N001/orders/02-plugin-move.md": "# order\n",
  "spn-sample-ts/sprepo.json": JSON.stringify({ type: "APPS", name: "Sample", config: { mtype: "APPS", stack: "TS" } }),
};
for (const [path, body] of Object.entries(files)) {
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(join(root, path), body, "utf8");
}

console.log("=== spn-surface — every line carries its plugin and the call's work");
{
  const env = { ...process.env };
  delete env.SPN_TELEMETRY;
  const payload = {
    session_id: "sess-surface", agent_id: "lane-02", tool_name: "mcp__figma__use_figma", cwd: join(root, "spn-sample-ts"),
    tool_input: { fileKey: "abc", skillNames: "resource:figma-use", description: `see ${root}/.spndevex/workstreams/open/033-surface-agent/notes/N001/orders/02-plugin-move.md`,
                  code: "return figma.root.children.length;" },
  };
  execFileSync("node", [EVENT], { input: JSON.stringify(payload), env, encoding: "utf8", cwd: payload.cwd });
  const lines = readFileSync(join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  same("every line has the twenty keys, in the book's order", lines.every((l) => JSON.stringify(Object.keys(l)) === JSON.stringify(KEYS)), true);
  same("every line's script is the plugin", [...new Set(lines.map((l) => l.script))], ["spn-surface"]);
  same("every line carries the work tags", lines.every((l) => l.workstream === "033-surface-agent" && l.arc === "N001"
    && l.order === "02-plugin-move" && l.agent === "lane-02" && l.session === "sess-surface"), true);
  same("the connector check is a figma connector span", lines.some((l) => l.group === "figma" && l.action === "connector"), true);
  same("the whole run is events › pretooluse", lines.at(-1) && [lines.at(-1).group, lines.at(-1).action], ["events", "pretooluse"]);
  same("a hook check's exit is null, at ends in Z, and repo is the member",
    lines.every((l) => l.exit === null && /Z$/.test(l.at) && l.repo === "spn-sample-ts"), true);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — telemetry` : `\n  all ${total} passed — telemetry`);
process.exit(failed ? 1 : 0);
