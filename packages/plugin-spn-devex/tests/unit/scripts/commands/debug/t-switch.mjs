// `debug switch show|on|off` — the switches of the agent's machinery, from a closed set (RD.DEVEX.WORKSPACE.322, .323).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";

const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
const ENV = { ...process.env, SPN_TELEMETRY: "off" };
delete ENV.SPN_WORKSPACE;
/** `debug switch` typed with exactly these words from the workspace: what it printed, and its exit code. */
const typed = (root, ...words) => {
  try { return { out: execFileSync("node", [TOOL, "debug", "switch", ...words], { encoding: "utf8", stdio: "pipe", env: ENV, cwd: root }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const root = realpathSync(mkdtempSync(join(tmpdir(), "debug-switch-")));
const file = join(root, ".spndevex", ".debug", "switches.json");
try {
  mkdirSync(join(root, ".spndevex", "workstreams"), { recursive: true });

  console.log("=== show");
  ok("with no file every switch is off", typed(root, "show").out.trim() === "telemetry  off");
  ok("and the data form says the same", JSON.stringify(JSON.parse(typed(root, "show", "--json").out)) === JSON.stringify({ telemetry: false }));

  console.log("\n=== on and off");
  const on = typed(root, "on", "telemetry");
  ok("`on` turns the switch on, and says so", on.code === 0 && on.out.trim() === "telemetry  on" && JSON.parse(readFileSync(file, "utf8")).telemetry === true, on.out);
  ok("`show` reads it back", typed(root, "show").out.trim() === "telemetry  on" && JSON.parse(typed(root, "show", "--json").out).telemetry === true);
  writeFileSync(file, JSON.stringify({ telemetry: true, kept: 1 }));
  const off = typed(root, "off", "telemetry");
  ok("`off` turns it off and keeps the other keys of the file", off.code === 0 && off.out.trim() === "telemetry  off"
    && JSON.stringify(JSON.parse(readFileSync(file, "utf8"))) === JSON.stringify({ telemetry: false, kept: 1 }), readFileSync(file, "utf8"));

  console.log("\n=== once spnutils has made .spndevex/state.json, the switch is its debug node");
  const stateFile = join(root, ".spndevex", "state.json");
  const SPNUTILS = '{\n  "workspace": {\n    "name": "saasplane"\n  },\n  "workstreams": {\n    "lastNumber": 35\n  }';
  writeFileSync(stateFile, `${SPNUTILS}\n}\n`);
  const node = typed(root, "on", "telemetry");
  const text = readFileSync(stateFile, "utf8");
  ok("`on` writes the debug node, keeping workspace and workstreams byte for byte",
    node.code === 0 && text === `${SPNUTILS},\n  "debug": {\n    "telemetry": true\n  }\n}\n`, text);
  ok("and leaves the old file as it was", JSON.stringify(JSON.parse(readFileSync(file, "utf8"))) === JSON.stringify({ telemetry: false, kept: 1 }), readFileSync(file, "utf8"));
  ok("`show` reads the node", typed(root, "show").out.trim() === "telemetry  on");
  typed(root, "off", "telemetry");
  ok("`off` changes only debug.telemetry", readFileSync(stateFile, "utf8") === `${SPNUTILS},\n  "debug": {\n    "telemetry": false\n  }\n}\n`, readFileSync(stateFile, "utf8"));
  rmSync(stateFile);

  console.log("\n=== the words");
  const unknown = typed(root, "on", "verbose");
  ok("an unknown name is refused with the set listed, and nothing is written",
    unknown.code === 2 && unknown.out.includes("usage: spn-devex debug switch on <name>") && unknown.out.includes("knows no switch `verbose`; the switches are telemetry"), unknown.out);
  ok("the unknown name wrote no switch", !("verbose" in JSON.parse(readFileSync(file, "utf8"))));
  const missing = typed(root, "off");
  ok("a missing name is refused with the usage line", missing.code === 2 && missing.out.includes("usage: spn-devex debug switch off <name>") && missing.out.includes("takes one switch, from telemetry"), missing.out);
  const option = typed(root, "on", "telemetry", "--force");
  ok("[MKT.SCRIPTS.174] an option the command does not take is refused with exit 2", option.code === 2 && option.out.includes("does not take `--force`"), option.out);
  const json = typed(root, "on", "telemetry", "--json");
  ok("`--json` is shown only for `show`: `on` refuses it", json.code === 2 && json.out.includes("does not take `--json`"), json.out);
  const second = typed(root, "show", "--json", "--all");
  ok("a second option on `show` is refused", second.code === 2 && second.out.includes("does not take `--all`"), second.out);
  const name = typed(root, "show", "telemetry");
  ok("`show` takes no name", name.code === 2 && name.out.includes("takes no name"), name.out);

  console.log("\n=== a folder with no workspace");
  const stray = realpathSync(mkdtempSync(join(tmpdir(), "debug-switch-stray-")));
  try {
    const lost = typed(stray, "on", "telemetry");
    ok("is refused, and no store is made there", lost.code === 2 && lost.out.includes("finds no workspace") && !existsSync(join(stray, ".spndevex")), lost.out);
  } finally { rmSync(stray, { recursive: true, force: true }); }
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — debug switch` : `\n  all ${total} passed — debug switch`);
process.exit(failed ? 1 : 0);
