// The spn-infra PreToolUse hook's telemetry lines: the one shape every plugin writes, as v 1 CHECK rows, with the part tag of the call (RULE.DEVEX.WORKSPACE.185, N8 row 2p).
//
// A temporary workspace with `.spndevex/.debug/switches.json` is pointed at the recorder, in a child
// with `SPN_TELEMETRY` removed; nothing is written into a real workspace.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const EVENT = resolve(PLUGIN, "src", "scripts", "events", "pretooluse.ts");
const KEYS = ["v", "mtype", "id", "at", "ms", "event", "session", "agent", "workstream", "arc", "part", "skill", "work", "retryOf",
  "check", "verdict", "out"];

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

const root = realpathSync(mkdtempSync(join(tmpdir(), "spn-infra-telemetry-")));
process.on("exit", () => rmSync(root, { recursive: true, force: true }));
const files = {
  ".spndevex/.debug/switches.json": "{\"telemetry\": true}\n",
  ".spndevex/workstreams/open/008-plain-language/notes/N8/orders/2p-plugin.md": "# order\n",
  "spn-estate/sprepo.json": JSON.stringify({ type: "INFRA", name: "Estate" }),
};
for (const [path, body] of Object.entries(files)) {
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(join(root, path), body, "utf8");
}

console.log("=== spn-infra — every line carries its plugin and the call's work");
{
  const env = { ...process.env };
  delete env.SPN_TELEMETRY;
  const payload = {
    session_id: "sess-infra", agent_id: "lane-2p", tool_name: "Edit", cwd: join(root, "spn-estate"),
    tool_input: { file_path: join(root, "spn-estate", "estate", "platform.yaml"), old_string: "a",
                  new_string: `# see ${root}/.spndevex/workstreams/open/008-plain-language/notes/N8/orders/2p-plugin.md` },
  };
  execFileSync("node", [EVENT], { input: JSON.stringify(payload), env, encoding: "utf8", cwd: payload.cwd });
  const lines = readFileSync(join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  same("every line is a v 1 CHECK row with the book's keys, in order", lines.every((l) => JSON.stringify(Object.keys(l)) === JSON.stringify(KEYS) && l.v === 1 && l.mtype === "CHECK" && l.event === "PreToolUse"), true);
  same("every line has a check name and a PASS verdict", lines.every((l) => typeof l.check === "string" && l.check && l.verdict === "PASS"), true);
  same("every line carries the work tags", lines.every((l) => l.workstream === "008-plain-language" && l.part === "2p-plugin" && l.agent === "lane-2p" && l.session === "sess-infra"), true);
  same("a provider's subject is its name and its cloud, structured", lines.some((l) => l.check === "aws"), true);
  same("a cloud-free subject names itself twice", lines.some((l) => l.check === "test-tree-shape"), true);
  same("no whole-run row is written: every row is one check's", lines.some((l) => l.check === "pretooluse" || l.check === "events"), false);
  same("a hook check's at ends in Z and its ms is a number", lines.every((l) => /Z$/.test(l.at) && typeof l.ms === "number"), true);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — telemetry` : `\n  all ${total} passed — telemetry`);
process.exit(failed ? 1 : 0);
