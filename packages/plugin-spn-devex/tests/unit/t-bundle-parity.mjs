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

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-bundle-parity` : `\n  all ${total} passed — t-bundle-parity`);
process.exit(failed ? 1 : 0);
