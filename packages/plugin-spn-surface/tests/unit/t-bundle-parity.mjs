// The bundle-parity case — every shipped bundle must answer exactly what the source it was built
// from answers, over a recorded set of tool calls. A bundle that silently changed behaviour during a
// rebuild is caught here, against real argv and a real stdin payload, rather than discovered from a
// hook running the wrong thing in a live session.
//
// The comparison is `plugin-support-lib/tests/helpers/bundle-parity.mjs` — one `spawnSync`
// implementation both this case and its own fixture proof call, so stdout, stderr and the exit
// code are compared the same way everywhere.
import { PLUGIN } from "../helpers/harness.mjs";
import { readFileSync, readdirSync, mkdtempSync, rmSync, cpSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { compareRun } from "../../../plugin-support-lib/tests/helpers/bundle-parity.mjs";

const CLI_SOURCE = resolve(PLUGIN, "src", "scripts", "cli.ts");
const CLI_BUNDLE = resolve(PLUGIN, "src", "dist", "cli.mjs");
const EVENT_SOURCE = resolve(PLUGIN, "src", "scripts", "events", "pretooluse.ts");
const EVENT_BUNDLE = resolve(PLUGIN, "src", "dist", "events", "pretooluse.mjs");
const PAYLOADS_DIR = resolve(PLUGIN, "tests", "fixtures", "payloads", "pretooluse");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== bundle parity — the CLI, argv only");

for (const argv of [["help", "--json"], ["help"], ["no-such-group", "no-such-action"]]) {
  const { source, bundle, parity } = compareRun(CLI_SOURCE, CLI_BUNDLE, { argv });
  ok(`cli.mjs agrees with cli.ts on \`${argv.join(" ")}\``, parity,
     `source: ${JSON.stringify(source)}\n        bundle: ${JSON.stringify(bundle)}`);
}

console.log("\n=== bundle parity — the PreToolUse event, over every recorded payload");

const payloadFiles = readdirSync(PAYLOADS_DIR).filter((f) => f.endsWith(".json")).sort();
ok("at least one payload is recorded to replay", payloadFiles.length > 0, PAYLOADS_DIR);

const before = process.cwd();
const scratch = mkdtempSync(join(tmpdir(), "surface-parity-"));
process.chdir(scratch);
try {
  for (const file of payloadFiles) {
    const input = readFileSync(join(PAYLOADS_DIR, file), "utf8");
    const { source, bundle, parity } = compareRun(EVENT_SOURCE, EVENT_BUNDLE, { input });
    ok(`pretooluse.mjs agrees with pretooluse.ts on ${file}`, parity,
       `source: ${JSON.stringify(source)}\n        bundle: ${JSON.stringify(bundle)}`);
  }
} finally {
  process.chdir(before);
  rmSync(scratch, { recursive: true, force: true });
}

console.log("\n=== an installed copy runs every command — the plugin's src/ alone, outside this repository");
{
  // The install copies the plugin's src/ and nothing beside it, so a script reaching plugin-support-lib
  // by its repository path fails there with ERR_MODULE_NOT_FOUND. The event is the bundle that loads it.
  const installed = mkdtempSync(join(tmpdir(), "installed-plugin-"));
  cpSync(join(PLUGIN, "src"), installed, { recursive: true });
  const help = spawnSync("node", [join(installed, "dist", "cli.mjs"), "help", "--json"], { encoding: "utf8", cwd: tmpdir() });
  const event = spawnSync("node", [join(installed, "dist", "events", "pretooluse.mjs")], { encoding: "utf8", cwd: tmpdir(),
    input: readFileSync(join(PAYLOADS_DIR, payloadFiles[0]), "utf8"), env: { ...process.env, SPN_TELEMETRY: "off" } });
  rmSync(installed, { recursive: true, force: true });
  ok("the entry loads from the installed copy", help.status === 0 && !help.stderr.includes("ERR_MODULE_NOT_FOUND"), `${help.status} ${help.stderr.slice(0, 400)}`);
  ok("the event loads from the installed copy", event.status === 0 && !event.stderr.includes("ERR_MODULE_NOT_FOUND"), `${event.status} ${event.stderr.slice(0, 400)}`);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — bundle parity` : `\n  all ${total} passed — bundle parity`);
process.exit(failed ? 1 : 0);
