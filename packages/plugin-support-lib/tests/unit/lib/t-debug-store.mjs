// `lib/debug-store.ts` — the one place `.spndevex/.debug/` is named: its paths, its switches (the `debug`
// node of `.spndevex/state.json`, through `lib/workspace-state.ts`), its rotated logs and the sweep of a
// window's folder. Every case runs in a temporary folder.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  LOG_CAP, SESSION_KEEP_MS, SWITCH_NAMES, appendLog, debugDir, logFiles, readSwitch, sessionDir, switchesFile, sweepSessions,
  telemetryFolder, workspaceDir, writeSwitch,
} from "../../../src/lib/debug-store.ts";

const BASE = realpathSync(mkdtempSync(join(tmpdir(), "spn-debug-store-")));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};
let n = 0;
const fresh = () => { const root = join(BASE, `w${n += 1}`); mkdirSync(join(root, ".spndevex", ".debug"), { recursive: true }); return root; };

console.log("=== the paths");
{
  const root = "/w";
  same("the debug folder", debugDir(root), "/w/.spndevex/.debug");
  same("the switches file", switchesFile(root), "/w/.spndevex/.debug/switches.json");
  same("a window's folder", sessionDir(root, "abc-1"), "/w/.spndevex/.debug/sessions/abc-1");
  same("a session id cannot leave its folder", sessionDir(root, "../x/y"), "/w/.spndevex/.debug/sessions/xy");
  same("the workspace folder", workspaceDir(root), "/w/.spndevex/.debug/workspace");
  same("the telemetry folder", telemetryFolder(root), "/w/.spndevex/.debug/telemetry");
  same("the switches there are", [...SWITCH_NAMES], ["telemetry"]);
  same("the paths touch no disk", existsSync("/w/.spndevex"), false);
}

console.log("\n=== readSwitch — on only where switches.json says true");
{
  const on = fresh(); writeFileSync(switchesFile(on), '{"telemetry": true}');
  same("on", readSwitch(on, "telemetry"), true);
  const off = fresh(); writeFileSync(switchesFile(off), '{"telemetry": false}');
  same("off", readSwitch(off, "telemetry"), false);
  same("absent", readSwitch(fresh(), "telemetry"), false);
  const bad = fresh(); writeFileSync(switchesFile(bad), "{ not json");
  same("malformed reads off and does not throw", readSwitch(bad, "telemetry"), false);
  const text = fresh(); writeFileSync(switchesFile(text), '{"telemetry": "yes"}');
  same("a value that is not `true` is off", readSwitch(text, "telemetry"), false);
  const list = fresh(); writeFileSync(switchesFile(list), "[true]");
  same("a file that is not an object is off", readSwitch(list, "telemetry"), false);
  const old = fresh(); writeFileSync(join(debugDir(old), "telemetry.on"), "on\n");
  same("an old `telemetry.on` alone is off", readSwitch(old, "telemetry"), false);
  const set = fresh(); writeSwitch(set, "telemetry", true);
  same("writeSwitch turns it on", [readSwitch(set, "telemetry"), JSON.parse(readFileSync(switchesFile(set), "utf8"))], [true, { telemetry: true }]);
  writeSwitch(set, "telemetry", false);
  same("and off", readSwitch(set, "telemetry"), false);
}

console.log("\n=== the switch is the debug node of .spndevex/state.json, and .debug/switches.json where there is none");
{
  const stateOf = (root) => join(root, ".spndevex", "state.json");
  // spnutils's two nodes, as spnutils writes them: the bytes a plugin write must keep.
  const SPNUTILS = '{\n  "workspace": {\n    "name": "saasplane"\n  },\n  "workstreams": {\n    "lastNumber": 35\n  }';
  const withDebug = (on) => `${SPNUTILS},\n  "debug": {\n    "telemetry": ${on}\n  }\n}\n`;

  const node = fresh(); writeFileSync(stateOf(node), withDebug(true)); writeFileSync(switchesFile(node), '{"telemetry": false}');
  same("the switch is read from the node, and the old file beside it is not", readSwitch(node, "telemetry"), true);
  const nodeOff = fresh(); writeFileSync(stateOf(nodeOff), withDebug(false)); writeFileSync(switchesFile(nodeOff), '{"telemetry": true}');
  same("a node that says off is off, whatever the old file says", readSwitch(nodeOff, "telemetry"), false);
  const noNode = fresh(); writeFileSync(stateOf(noNode), `${SPNUTILS}\n}\n`); writeFileSync(switchesFile(noNode), '{"telemetry": true}');
  same("a state file with no debug node reads the old file", readSwitch(noNode, "telemetry"), true);
  const noFile = fresh(); writeFileSync(switchesFile(noFile), '{"telemetry": true}');
  same("no state file reads the old file", readSwitch(noFile, "telemetry"), true);
  const broken = fresh(); writeFileSync(stateOf(broken), "{ not json");
  same("a state file that does not read, and no old file, is off and does not throw", readSwitch(broken, "telemetry"), false);
  const odd = fresh(); writeFileSync(stateOf(odd), `${SPNUTILS},\n  "debug": "yes"\n}\n`);
  same("a debug node that is not an object of switches is off", readSwitch(odd, "telemetry"), false);

  const kept = fresh();
  const before = `${SPNUTILS},\n  "extra": {\n    "kept": [1, 2]\n  }\n}\n`;
  writeFileSync(stateOf(kept), before);
  writeSwitch(kept, "telemetry", true);
  const after = readFileSync(stateOf(kept), "utf8");
  same("a write adds the debug node and keeps workspace and workstreams byte for byte",
    [after.startsWith(`${SPNUTILS},\n`), JSON.parse(after).debug, JSON.parse(after).extra, readSwitch(kept, "telemetry")],
    [true, { telemetry: true }, { kept: [1, 2] }, true]);
  writeSwitch(kept, "telemetry", false);
  const off = readFileSync(stateOf(kept), "utf8");
  same("turning it off changes only debug.telemetry", [off.startsWith(`${SPNUTILS},\n`), JSON.parse(off)], [true, { workspace: { name: "saasplane" }, workstreams: { lastNumber: 35 }, extra: { kept: [1, 2] }, debug: { telemetry: false } }]);
  same("a write to the node makes no old file, and leaves no lock and no temporary file",
    [existsSync(switchesFile(kept)), existsSync(join(kept, ".spndevex", ".state.lock")), readdirSync(join(kept, ".spndevex")).filter((name) => name.endsWith(".tmp"))], [false, false, []]);

  const old = fresh(); writeSwitch(old, "telemetry", true);
  same("with no state file a write goes to the old file, and makes no state file",
    [JSON.parse(readFileSync(switchesFile(old), "utf8")), existsSync(stateOf(old))], [{ telemetry: true }, false]);

  const held = fresh(); writeFileSync(stateOf(held), `${SPNUTILS}\n}\n`);
  const lock = join(held, ".spndevex", ".state.lock");
  mkdirSync(lock);
  // Another program holds the lock, and lets it go 400 ms from now.
  spawn(process.execPath, ["-e", `setTimeout(() => require("fs").rmSync(${JSON.stringify(lock)}, { recursive: true, force: true }), 400)`], { stdio: "ignore" });
  const start = Date.now();
  writeSwitch(held, "telemetry", true);
  const waited = Date.now() - start;
  same("a held lock is waited on, and the write lands once it is let go", [waited >= 300, readSwitch(held, "telemetry"), existsSync(lock)], [true, true, false]);

  const stale = fresh(); writeFileSync(stateOf(stale), `${SPNUTILS}\n}\n`);
  const staleLock = join(stale, ".spndevex", ".state.lock");
  mkdirSync(staleLock);
  utimesSync(staleLock, new Date(Date.now() - 60_000), new Date(Date.now() - 60_000));
  const quick = Date.now();
  writeSwitch(stale, "telemetry", true);
  same("a lock older than 30 seconds is taken over at once", [Date.now() - quick < 1000, readSwitch(stale, "telemetry"), existsSync(staleLock)], [true, true, false]);
}

console.log("\n=== appendLog and logFiles — one rotation, the rotated file read first");
{
  same("the cap is twenty megabytes", LOG_CAP, 20 * 1024 * 1024);
  const root = fresh();
  const log = join(telemetryFolder(root), "hooks.jsonl");
  same("no file, no files", logFiles(log), []);
  appendLog(log, '{"n":1}', 10); appendLog(log, '{"n":2}', 10);
  same("under the cap one file holds both", [readFileSync(log, "utf8"), logFiles(log)], ['{"n":1}\n{"n":2}\n', [log]]);
  appendLog(log, '{"n":3}', 10);
  same("past the cap the live file moves to <stem>.1.jsonl", existsSync(join(telemetryFolder(root), "hooks.1.jsonl")), true);
  same("and the line starts a fresh file", readFileSync(log, "utf8"), '{"n":3}\n');
  same("a reader gets the rotated file, then the live one", logFiles(log), [join(telemetryFolder(root), "hooks.1.jsonl"), log]);
  for (const one of [4, 5, 6]) appendLog(log, `{"n":${one}}`, 10);
  same("a second rotation replaces the first", [readFileSync(join(telemetryFolder(root), "hooks.1.jsonl"), "utf8"), readFileSync(log, "utf8")],
    ['{"n":3}\n{"n":4}\n', '{"n":5}\n{"n":6}\n']);
}

console.log("\n=== sweepSessions — a window nobody has written to for fourteen days goes");
{
  const root = fresh();
  const old = sessionDir(root, "old"), young = sessionDir(root, "young");
  mkdirSync(join(old, "pending"), { recursive: true }); mkdirSync(young, { recursive: true });
  writeFileSync(join(old, "window.json"), "{}"); writeFileSync(join(old, "pending", "t.json"), "{}"); writeFileSync(join(young, "window.json"), "{}");
  const now = Date.now(), ago = (ms) => new Date(now - ms);
  for (const file of [join(old, "window.json"), join(old, "pending", "t.json")]) utimesSync(file, ago(SESSION_KEEP_MS + 1000), ago(SESSION_KEEP_MS + 1000));
  utimesSync(join(young, "window.json"), ago(1000), ago(1000));
  same("the ids removed", sweepSessions(root, now), ["old"]);
  same("the old folder is gone and the fresh one stays", [existsSync(old), existsSync(young)], [false, true]);
  const touched = fresh(); const mixed = sessionDir(touched, "mixed");
  mkdirSync(join(mixed, "pending"), { recursive: true });
  writeFileSync(join(mixed, "window.json"), "{}"); writeFileSync(join(mixed, "pending", "t.json"), "{}");
  utimesSync(join(mixed, "window.json"), ago(SESSION_KEEP_MS + 1000), ago(SESSION_KEEP_MS + 1000));
  same("a folder with one fresh file in it stays", [sweepSessions(touched, now), existsSync(mixed)], [[], true]);
  same("no sessions folder is nothing to sweep", sweepSessions(fresh(), now), []);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — debug store` : `\n  all ${total} passed — debug store`);
process.exit(failed ? 1 : 0);
