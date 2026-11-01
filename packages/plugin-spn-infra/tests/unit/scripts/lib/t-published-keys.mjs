// `published-keys` - a published estate key carries no module of the code that reads it. The refusal cases are a
// key that spells the identity module (`DMO_IAM_EDGE_TARGET`); they pass on today's plugin, because no rule reads
// the published keys. The reference in a module's own file, and the owner's key, must pass.
import { join } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const { validate } = await import(join(PLUGIN, "src", "scripts", "lib", "published-keys.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const BLUEPRINT = "/repo/packages/infra-blueprints/src/edge.tf";
const PLATFORM = "/repo/packages/infra-platform-dmo/src/world.json";

console.log("=== MKT.HOOKS.28 published-keys - known-bad");
{
  const refused = validate(BLUEPRINT, 'output "k" { value = { DMO_IAM_EDGE_TARGET = aws_cloudfront_distribution.edge.domain_name } }');
  ok("a published key spelling the identity module is refused", Boolean(refused?.deny), JSON.stringify(refused));
  ok("the refusal names the corrected form", Boolean(refused?.deny) && refused.deny.includes("DMO_PLATFORM_INTEGRATION_EDGE_TARGET"), JSON.stringify(refused));
  ok("the refusal names the rule", Boolean(refused?.deny) && refused.deny.includes("RULE.SUPPORT.INFRA.111"));
  ok("a platform layer file is read as well", Boolean(validate(PLATFORM, '{"SPN_IAM_EDGE_DISTRIBUTION_ID": "E1"}')?.deny));
}

console.log("\n=== MKT.HOOKS.28 published-keys - what it must allow");
ok("the owner's published key", validate(BLUEPRINT, 'DMO_PLATFORM_INTEGRATION_EDGE_TARGET = "x"') === null);
ok("a file that publishes nothing: a module's own settings", validate("/repo/packages/infra-module-idp/src/settings.json", '{"DMO_IAM_EDGE_TARGET": "ref"}') === null);
ok("an unrelated key in a blueprint", validate(BLUEPRINT, 'DMO_PLATFORM_DOMAIN = "x"') === null);
ok("a markdown file in a blueprint package", validate("/repo/packages/infra-blueprints/src/README.md", "DMO_IAM_EDGE_TARGET") === null);

console.log(failed ? `\n  ${failed} of ${total} FAILED - published keys` : `\n  all ${total} passed - published keys`);
process.exit(failed ? 1 : 0);
