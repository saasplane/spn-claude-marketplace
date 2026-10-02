// The bundle-parity case (`N101` step 4) — every shipped bundle must answer exactly what the
// source it was built from answers, over a recorded set of tool calls. A bundle that silently
// changed behaviour during a rebuild is caught here, against real argv and a real stdin payload,
// rather than discovered from a hook running the wrong thing in a live session.
//
// The comparison is `plugin-support-lib/tests/helpers/bundle-parity.mjs` — one `spawnSync`
// implementation both this case and its own fixture proof call, so stdout, stderr and the exit
// code are compared the same way everywhere.
import { PLUGIN } from "../helpers/harness.mjs";
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { compareRun } from "../../../plugin-support-lib/tests/helpers/bundle-parity.mjs";

const CLI_SOURCE = resolve(PLUGIN, "src", "scripts", "cli.ts");
const CLI_BUNDLE = resolve(PLUGIN, "src", "dist", "cli.mjs");
const EVENT_SOURCE = resolve(PLUGIN, "src", "scripts", "events", "pretooluse.ts");
const EVENT_BUNDLE = resolve(PLUGIN, "src", "dist", "events", "pretooluse.mjs");
const PAYLOADS_DIR = resolve(PLUGIN, "tests", "fixtures", "payloads", "pretooluse");
const FIXTURE_REPO = resolve(PLUGIN, "tests", "fixtures", "repo");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== bundle parity — the CLI, argv only");

for (const argv of [["help", "--json"], ["help"], ["coverage", "no-such-action"], ["no-such-group", "no-such-action"]]) {
  const { source, bundle, parity } = compareRun(CLI_SOURCE, CLI_BUNDLE, { argv });
  ok(`cli.mjs agrees with cli.ts on \`${argv.join(" ")}\``, parity,
     `source: ${JSON.stringify(source)}\n        bundle: ${JSON.stringify(bundle)}`);
}

console.log("\n=== bundle parity — the CLI against a temp project, no side effects on the source of truth");

{
  const root = mkdtempSync(join(tmpdir(), "apps-parity-catalogue-"));
  try {
    const { source, bundle, parity } = compareRun(CLI_SOURCE, CLI_BUNDLE, { argv: ["library", "catalogue", "check", root] });
    ok("cli.mjs agrees with cli.ts on `library catalogue check` against an empty project", parity,
       `source: ${JSON.stringify(source)}\n        bundle: ${JSON.stringify(bundle)}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log("\n=== bundle parity — the PreToolUse event, over every recorded payload");

const payloadFiles = readdirSync(PAYLOADS_DIR).filter((f) => f.endsWith(".json")).sort();
ok("at least one payload is recorded to replay", payloadFiles.length > 0, PAYLOADS_DIR);

// `compareRun` spawns with no `cwd` of its own, so each child inherits THIS process's working
// directory at the moment it is spawned. The hook resolves a node's stack from `tool_input.file_path`
// relative to the real process cwd (never the payload's own `cwd` field, which is telemetry-only) —
// see `scripts/lib/stack.ts`. So the fixture repo is the actual cwd for the length of this loop, and
// every recorded payload names its `file_path` relative to it, the way `hooks.json` sees one for real.
const before = process.cwd();
process.chdir(FIXTURE_REPO);
try {
  for (const file of payloadFiles) {
    const input = readFileSync(join(PAYLOADS_DIR, file), "utf8");
    const { source, bundle, parity } = compareRun(EVENT_SOURCE, EVENT_BUNDLE, { input });
    ok(`pretooluse.mjs agrees with pretooluse.ts on ${file}`, parity,
       `source: ${JSON.stringify(source)}\n        bundle: ${JSON.stringify(bundle)}`);
  }
} finally {
  process.chdir(before);
}

console.log("\n=== an installed copy runs every command — the plugin's src/ alone, outside this repository");
{
  // The install copies the plugin's src/ and nothing beside it, so a command reaching plugin-support-lib
  // by its repository path fails there with ERR_MODULE_NOT_FOUND. `help` loads every command.
  const { cpSync } = await import("node:fs");
  const { spawnSync } = await import("node:child_process");
  const installed = mkdtempSync(join(tmpdir(), "installed-plugin-"));
  cpSync(join(PLUGIN, "src"), installed, { recursive: true });
  const run = spawnSync("node", [join(installed, "dist", "cli.mjs"), "help", "--json"], { encoding: "utf8", cwd: tmpdir() });
  rmSync(installed, { recursive: true, force: true });
  ok("every command loads from the installed copy", run.status === 0 && !run.stderr.includes("ERR_MODULE_NOT_FOUND"),
    `${run.status} ${run.stderr.slice(0, 400)}`);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — bundle parity` : `\n  all ${total} passed — bundle parity`);
process.exit(failed ? 1 : 0);
