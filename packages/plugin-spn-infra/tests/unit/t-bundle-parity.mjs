// Bundle parity (`N101` step 4, `02-shape.md` § Bundle parity is proven, not assumed): the
// committed `dist/events/pretooluse.mjs` must answer every recorded payload exactly as its source,
// `src/scripts/events/pretooluse.ts`, does — same stdout, same stderr, same exit code.
//
// THIS IS ALSO WHAT PROVES `subjects.ts`'s `PROVIDERS` PATH SURVIVES BUNDLING. Before this suite,
// `PROVIDERS` was computed from a fixed `../..` climb off `import.meta.dirname`, which esbuild
// collapses to the bundle's own location for every inlined module — it only kept answering
// `src/providers` after bundling because `scripts/checks` and `dist/events` happen to sit at the
// same depth under `src/`, a coincidence rather than a guarantee (see `checks/subjects.ts`'s own
// comment). `arn-in-declaration.json` below denies through a PROVIDER's `manifest` subject
// (`no-secrets.ts`, wired in through `providers/aws/scripts/checks/manifest.ts`) — if `PROVIDERS`
// ever resolved to a folder with no provider subfolders, `subjects()` would silently find zero
// providers and this case would go from "deny" to silent, and this suite would catch it as a
// parity break even though the source side kept working.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { compareRun } from "../../../plugin-support-lib/tests/helpers/bundle-parity.mjs";

const PLUGIN = join(import.meta.dirname, "..", "..");
const SOURCE = join(PLUGIN, "src", "scripts", "events", "pretooluse.ts");
const BUNDLE = join(PLUGIN, "src", "dist", "events", "pretooluse.mjs");
const PAYLOADS_DIR = join(PLUGIN, "tests", "fixtures", "payloads", "pretooluse");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== bundle parity — every recorded PreToolUse payload agrees between source and bundle");
const payloadFiles = readdirSync(PAYLOADS_DIR).filter((f) => f.endsWith(".json")).sort();
ok("at least one payload is recorded", payloadFiles.length > 0);

for (const file of payloadFiles) {
  const input = readFileSync(join(PAYLOADS_DIR, file), "utf8");
  const result = compareRun(SOURCE, BUNDLE, { input });
  ok(`${file}: source and bundle agree`, result.parity === true, JSON.stringify(result));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-bundle-parity` : `\n  all ${total} passed — t-bundle-parity`);
process.exit(failed ? 1 : 0);
