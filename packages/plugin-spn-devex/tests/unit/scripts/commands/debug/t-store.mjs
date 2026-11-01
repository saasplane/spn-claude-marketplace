// `debug store show` — each container of `.spndevex/.debug/`, its files, its bytes and its lifetime rule as the book's
// table states it (RULE.DEVEX.WORKSPACE.322, .323).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";

const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
const ENV = { ...process.env, SPN_TELEMETRY: "off" };
delete ENV.SPN_WORKSPACE;
/** `debug store` typed with exactly these words from the workspace: what it printed, and its exit code. */
const typed = (root, ...words) => {
  try { return { out: execFileSync("node", [TOOL, "debug", "store", ...words], { encoding: "utf8", stdio: "pipe", env: ENV, cwd: root }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const root = realpathSync(mkdtempSync(join(tmpdir(), "debug-store-")));
try {
  mkdirSync(join(root, ".spndevex", "workstreams"), { recursive: true });
  const debug = join(root, ".spndevex", ".debug");

  console.log("=== a store with nothing in it");
  const bare = JSON.parse(typed(root, "show", "--json").out);
  ok("still names the three containers, each with no files", bare.containers.length === 3 && bare.containers.every((one) => one.files === 0 && one.bytes === 0),
    JSON.stringify(bare));
  ok("and the switch, off, read from .debug/switches.json while there is no state.json",
    JSON.stringify(bare.debug) === JSON.stringify({ from: ".spndevex/.debug/switches.json", telemetry: false }), JSON.stringify(bare.debug));

  mkdirSync(join(debug, "sessions", "a", "pending"), { recursive: true });
  mkdirSync(join(debug, "sessions", "b"), { recursive: true });
  mkdirSync(join(debug, "telemetry"), { recursive: true });
  writeFileSync(join(debug, "switches.json"), "{\"telemetry\": true}\n");
  writeFileSync(join(debug, "sessions", "a", "name.json"), "12345");
  writeFileSync(join(debug, "sessions", "a", "pending", "t.json"), "123");
  writeFileSync(join(debug, "sessions", "b", "stop.json"), "1234567");
  writeFileSync(join(debug, "telemetry", "hooks.jsonl"), "x\n");
  writeFileSync(join(debug, "telemetry", "usage.jsonl"), "yy\n");
  writeFileSync(join(debug, "telemetry", "usage.1.jsonl"), "zzz\n");

  console.log("\n=== the data form");
  const data = JSON.parse(typed(root, "show", "--json").out);
  const by = Object.fromEntries(data.containers.map((one) => [one.container, one]));
  ok("the containers are the book's three, in its order", data.containers.map((one) => one.container).join(" | ") === "sessions/<session-id>/ | workspace/ | telemetry/",
    data.containers.map((one) => one.container).join(" | "));
  ok("each has its files counted, a folder's nested ones too, and its bytes", by["sessions/<session-id>/"].files === 3 && by["sessions/<session-id>/"].bytes === 15
    && by["workspace/"].files === 0 && by["telemetry/"].files === 3 && by["telemetry/"].bytes === 9, JSON.stringify(data.containers.map((one) => [one.container, one.files, one.bytes])));
  ok("and each its lifetime rule, as the table states it",
    by["sessions/<session-id>/"].lifetime.includes("swept whole, 14 days after the folder's newest write") && by["sessions/<session-id>/"].lifetime.includes("`debug window sweep`")
    && by["workspace/"].lifetime === "kept" && by["telemetry/"].lifetime.includes("past 20 MB") && by["telemetry/"].lifetime.includes("<name>.1.jsonl"),
    JSON.stringify(data.containers.map((one) => one.lifetime)));

  console.log("\n=== the printed form");
  const printed = typed(root, "show").out;
  ok("each container is a line with its count and its rule under it", /telemetry\/ {2}3 file\(s\), 9 bytes/.test(printed)
    && /renamed `<name>\.1\.jsonl`/.test(printed) && !printed.includes("switches.json  "), printed);
  ok("and the switch is its own last line, naming the file it is read from",
    printed.trimEnd().split("\n").at(-1) === "debug  telemetry on — read from .spndevex/.debug/switches.json until plugin migration 008 folds it into the debug node of .spndevex/state.json", printed);

  console.log("\n=== once spnutils has made .spndevex/state.json, the switch is its debug node");
  writeFileSync(join(root, ".spndevex", "state.json"), '{\n  "workspace": {},\n  "workstreams": {\n    "lastNumber": 0\n  },\n  "debug": {\n    "telemetry": false\n  }\n}\n');
  const node = JSON.parse(typed(root, "show", "--json").out);
  ok("the data form shows the debug node, which wins over the old file", JSON.stringify(node.debug) === JSON.stringify({ from: ".spndevex/state.json", telemetry: false }), JSON.stringify(node.debug));
  ok("and the printed form says so", typed(root, "show").out.trimEnd().split("\n").at(-1) === "debug  telemetry off — the debug node of .spndevex/state.json", typed(root, "show").out);

  console.log("\n=== reset — MKT.SCRIPTS.179");
  const telemetry = join(debug, "telemetry");
  mkdirSync(join(debug, "workspace"), { recursive: true });
  writeFileSync(join(debug, "workspace", "filter.json"), "{}");
  writeFileSync(join(telemetry, "hooks.1.jsonl"), "old\n");
  writeFileSync(join(telemetry, "kept.txt"), "kept\n");
  writeFileSync(join(root, ".spndevex", "state.json"), '{\n  "workspace": {},\n  "workstreams": {\n    "lastNumber": 0\n  },\n  "debug": {\n    "telemetry": true\n  }\n}\n');
  const resetRun = (() => {
    try { return { out: execFileSync("node", [TOOL, "debug", "store", "reset"], { encoding: "utf8", stdio: "pipe", env: { ...ENV, SPN_TELEMETRY: "on" }, cwd: root }), code: 0 }; }
    catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
  })();
  ok("[MKT.SCRIPTS.179] reset removes usage.jsonl, usage.1.jsonl, hooks.jsonl and hooks.1.jsonl", resetRun.code === 0
    && ["usage.jsonl", "usage.1.jsonl", "hooks.1.jsonl"].every((name) => !existsSync(join(telemetry, name))) && resetRun.out.includes("removed usage.jsonl, usage.1.jsonl, hooks.jsonl, hooks.1.jsonl"), resetRun.out);
  ok("[MKT.SCRIPTS.179] and nothing else: another file of the folder and the other containers stay", existsSync(join(telemetry, "kept.txt")) && existsSync(join(debug, "workspace", "filter.json"))
    && existsSync(join(debug, "sessions", "a", "name.json")), "");
  const opened = existsSync(join(telemetry, "hooks.jsonl")) ? readFileSync(join(telemetry, "hooks.jsonl"), "utf8").trim().split("\n").map((one) => JSON.parse(one)) : [];
  ok("[MKT.SCRIPTS.179] its own row opens the new hooks.jsonl: version 1, a COMMAND row that exited 0, the old log's lines gone",
    opened.length === 1 && opened[0].v === 1 && opened[0].mtype === "COMMAND" && opened[0].exit === 0 && !JSON.stringify(opened[0]).includes("old"), JSON.stringify(opened));
  ok("[MKT.SCRIPTS.179] reset takes no target", typed(root, "reset", "telemetry").code === 2, "");

  console.log("\n=== the words");
  const USAGE = "usage: spn-devex debug store show [--json]\n";
  const option = typed(root, "show", "--sizes");
  ok("[MKT.SCRIPTS.174] an option the command does not take is refused with exit 2 and the usage line", option.code === 2 && option.out === USAGE + "`debug store show` does not take `--sizes`.\n", option.out);
  const second = typed(root, "show", "--json", "--deep");
  ok("a second option is refused too", second.code === 2 && second.out.includes("does not take `--deep`"), second.out);
  const target = typed(root, "show", "telemetry");
  ok("a target is refused", target.code === 2 && target.out.startsWith(USAGE) && target.out.includes("takes no target"), target.out);
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — debug store` : `\n  all ${total} passed — debug store`);
process.exit(failed ? 1 : 0);
