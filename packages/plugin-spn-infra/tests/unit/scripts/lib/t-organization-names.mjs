// `organization-names` - an organization declaration keeps its token and its readable name apart. The refusal
// cases are a declaration that spells the readable name in `org`, and one that repeats the token as `name`. They
// pass on today's plugin, because no rule reads the two fields.
import { join } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const { validate } = await import(join(PLUGIN, "src", "scripts", "lib", "organization-names.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const PATH = "/repo/packages/infra-organization/src/spestate.json";
const declaration = (org, name) => JSON.stringify({ type: "ORGANIZATION", config: { mtype: "ORGANIZATION", name, org } }, null, 2);

console.log("=== MKT.HOOKS.27 organization-names - known-bad");
{
  const readable = validate(PATH, declaration("SaaS Plane", "SaaS Plane"));
  ok("a readable name in org is refused", Boolean(readable?.deny) && readable.deny.includes("reads as a name"), JSON.stringify(readable));
  const repeated = validate(PATH, declaration("spn", "spn"));
  ok("the token repeated as the name is refused", Boolean(repeated?.deny) && repeated.deny.includes("is the token again"), JSON.stringify(repeated));
  ok("a capitalised token is refused", Boolean(validate(PATH, declaration("Spn", "SaaS Plane"))?.deny));
}

console.log("\n=== MKT.HOOKS.27 organization-names - what it must allow");
ok("the real declaration, token spn and name SaaS Plane", validate(PATH, declaration("spn", "SaaS Plane")) === null);
ok("a half-written declaration", validate(PATH, '{"type": "ORGANIZATION", "config": {') === null);
ok("a declaration with no name yet", validate(PATH, JSON.stringify({ config: { org: "spn" } })) === null);
ok("another package's declaration", validate("/repo/packages/infra-platform/src/spestate.json", declaration("SaaS Plane", "SaaS Plane")) === null);

console.log(failed ? `\n  ${failed} of ${total} FAILED - organization names` : `\n  all ${total} passed - organization names`);
process.exit(failed ? 1 : 0);
