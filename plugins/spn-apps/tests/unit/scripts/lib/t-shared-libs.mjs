import { PLUGIN } from "../../../helpers/harness.mjs";
// The register grammar, the run reader and the kind table are the core plugin's, and this plugin
// carries copies because a plugin imports nothing from another. A copy that drifts would let the
// join read a row the writer never wrote, so each copy is held to the original byte for byte.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const CORE = resolve(PLUGIN, "..", "spn-devex", "src", "scripts", "lib");
const HERE = resolve(PLUGIN, "src", "scripts", "lib");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== the libraries this plugin copies from the core plugin");
for (const file of ["register.ts", "runs.ts", "kinds.ts"]) {
  const core = resolve(CORE, file);
  if (!existsSync(core)) {
    ok(`${file}: the core plugin's original is beside this checkout`, false, core);
    continue;
  }
  ok(`${file}: this copy is the core plugin's, byte for byte`, readFileSync(resolve(HERE, file), "utf8") === readFileSync(core, "utf8"));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — shared libraries` : `\n  all ${total} passed — shared libraries`);
process.exit(failed ? 1 : 0);
