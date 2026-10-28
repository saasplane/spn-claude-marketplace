// `lib/debug-store.ts` — the one place `.spndevex/.debug/` is named: its paths, its switches, its rotated
// logs and the sweep of a window's folder. Every case runs in a temporary folder.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, utimesSync, writeFileSync } from "node:fs";
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
