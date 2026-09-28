import { PLUGIN } from "../../../helpers/harness.mjs";
// The table of which tier each kind owes is copied here, because a plugin imports nothing. In the
// builder workspace the toolchain's own kind table sits beside this checkout, and this suite holds
// the copy to it, member for member. A partner's install has no toolchain beside it, and says so.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { OWED_TIERS, TIERS } = await import(pathToFileURL(resolve(PLUGIN, "src", "scripts", "lib", "kinds.ts")).href);
const FACTS = resolve(PLUGIN, "..", "..", "..", "spn-support-ts", "packages", "toolchain-ts", "src", "bin", "kind-facts.mjs");
const CONTRACT = resolve(PLUGIN, "..", "..", "..", "spn-support-ts", "packages", "toolchain-ts", "src", "contract", "index.mjs");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== the tiers each kind owes");

ok("the ladder is the book's five, in its order", JSON.stringify(TIERS) === JSON.stringify(["UNIT", "INTEGRATION", "CONTRACT", "COMPONENT", "JOURNEY"]));
ok("every owed tier is a rung of the ladder", Object.values(OWED_TIERS).flat().every((tier) => TIERS.includes(tier)));

if (existsSync(FACTS) && existsSync(CONTRACT)) {
  const { KIND_FACTS } = await import(pathToFileURL(FACTS).href);
  const { SPKindType, SPTestTierType } = await import(pathToFileURL(CONTRACT).href);
  ok("the copy names every kind the toolchain names, and no other",
     JSON.stringify(Object.keys(OWED_TIERS).sort()) === JSON.stringify(Object.keys(KIND_FACTS).sort()),
     `${Object.keys(OWED_TIERS)} vs ${Object.keys(KIND_FACTS)}`);
  for (const kind of Object.values(SPKindType)) {
    ok(`${kind} owes the tiers the toolchain says it owes`,
       JSON.stringify(OWED_TIERS[kind]) === JSON.stringify(KIND_FACTS[kind]?.tiers), `${OWED_TIERS[kind]} vs ${KIND_FACTS[kind]?.tiers}`);
  }
  ok("the ladder is the toolchain contract's SPTestTierType", JSON.stringify([...TIERS].sort()) === JSON.stringify(Object.values(SPTestTierType).sort()));
} else {
  console.log("  ·     no toolchain checkout beside this one — the copy is held to the book's table alone");
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — kinds` : `\n  all ${total} passed — kinds`);
process.exit(failed ? 1 : 0);
