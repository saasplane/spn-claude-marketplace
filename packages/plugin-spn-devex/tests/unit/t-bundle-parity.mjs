// Bundle parity (`N101` step 4, `02-shape.md` § Bundle parity is proven, not assumed): each committed
// `dist/events/*.mjs` must answer every recorded payload exactly as its source `.ts` does, and
// `dist/cli.mjs` must answer every recorded argv exactly as `cli.ts` does — same stdout, same
// stderr, same exit code.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { compareRun } from "../../../plugin-support-lib/tests/helpers/bundle-parity.mjs";

const PLUGIN = join(import.meta.dirname, "..", "..");
const SCRIPTS = join(PLUGIN, "src", "scripts");
const DIST = join(PLUGIN, "src", "dist");
const PAYLOADS = join(PLUGIN, "tests", "fixtures", "payloads");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const EVENTS = [
  { name: "orientation", argv: ["--stdin"] },
  { name: "pretooluse", argv: [] },
  { name: "closed", argv: [] },
  { name: "stop", argv: [] },
];

for (const event of EVENTS) {
  const source = join(SCRIPTS, "events", `${event.name}.ts`);
  const bundle = join(DIST, "events", `${event.name}.mjs`);
  const dir = join(PAYLOADS, event.name);
  console.log(`\n=== bundle parity — ${event.name}: every recorded payload agrees between source and bundle`);
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  ok(`${event.name}: at least one payload is recorded`, files.length > 0);
  for (const file of files) {
    const input = readFileSync(join(dir, file), "utf8");
    const result = compareRun(source, bundle, { argv: event.argv, input });
    ok(`${event.name}/${file}: source and bundle agree`, result.parity === true, JSON.stringify(result));
  }
}

console.log("\n=== bundle parity — cli.mjs answers every recorded argv exactly as cli.ts does");
{
  const source = join(SCRIPTS, "cli.ts");
  const bundle = join(DIST, "cli.mjs");
  const CASES = [
    ["help"],
    ["help", "--json"],
    ["docs", "help"],
    ["unknown-group"],
    ["docs", "unknown-action"],
  ];
  for (const argv of CASES) {
    const result = compareRun(source, bundle, { argv });
    ok(`cli.mjs ${argv.join(" ")}: source and bundle agree`, result.parity === true, JSON.stringify(result));
  }
}

console.log("\n=== an installed copy runs every command — the plugin's src/ alone, outside this repository");
{
  // The install copies the plugin's src/ and nothing beside it, so a command reaching plugin-support-lib
  // by its repository path fails there with ERR_MODULE_NOT_FOUND. `help` loads every command.
  const { cpSync, mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { spawnSync } = await import("node:child_process");
  const installed = mkdtempSync(join(tmpdir(), "installed-plugin-"));
  cpSync(join(PLUGIN, "src"), installed, { recursive: true });
  const run = spawnSync("node", [join(installed, "dist", "cli.mjs"), "help", "--json"], { encoding: "utf8", cwd: tmpdir() });
  rmSync(installed, { recursive: true, force: true });
  ok("every command loads from the installed copy", run.status === 0 && !run.stderr.includes("ERR_MODULE_NOT_FOUND"),
    `${run.status} ${run.stderr.slice(0, 400)}`);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-bundle-parity` : `\n  all ${total} passed — t-bundle-parity`);
process.exit(failed ? 1 : 0);
