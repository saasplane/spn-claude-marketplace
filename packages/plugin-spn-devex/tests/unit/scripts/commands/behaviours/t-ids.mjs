// behaviours ids — the soft id check reads contract, component and journey cases from the test source.
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const { casesIn, boundTier, boundCases } = await import("../../../../../src/scripts/commands/behaviours/ids.ts");

let n = 0, failed = 0;
const ok = (what, got, expected) => {
  n += 1;
  const pass = JSON.stringify(got) === JSON.stringify(expected);
  if (!pass) failed += 1;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${what}${pass ? "" : ` — got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`}`);
};

console.log("\n=== casesIn — an id in the title or an enclosing describe");
ok("a case carrying its own id", casesIn("it('IAM.LOGIN.01 signs in', () => {});").map((c) => c.hasId), [true]);
ok("a case under a describe that carries the id", casesIn("describe('IAM.LOGIN.01 sign in', () => { it('with a password', () => {}); it('with a code', () => {}); });").map((c) => c.hasId), [true, true]);
ok("known-bad: a case with no id anywhere", casesIn("test('signs in', async () => {});").map((c) => c.hasId), [false]);
ok("the describe's id stops at its closing brace", casesIn("describe('IAM.LOGIN.01 a', () => { it('x', () => {}); }); it('y', () => {});").map((c) => c.hasId), [true, false]);
ok("a modifier is still a case", casesIn("test.serial('IAM.SESSION.02 ends', () => {}); test.skip('z', () => {});").map((c) => c.hasId), [true, false]);
ok("a lower-case or one-segment word is not an id", casesIn("it('iam.login.01 and LOGIN.1 are not ids', () => {});").map((c) => c.hasId), [false]);

console.log("\n=== boundTier and boundCases — which folders bind an id");
const root = mkdtempSync(join(tmpdir(), "spn-ids-"));
const put = (path, text) => { mkdirSync(join(root, path, ".."), { recursive: true }); writeFileSync(join(root, path), text); };
put("apps/api/spkind.json", JSON.stringify({ kind: "APP_SERVER" }));
put("apps/api/tests/integration/login.int.spec.ts", "it('IAM.LOGIN.01 a', () => {}); it('b', () => {});");
put("packages/lib/spkind.json", JSON.stringify({ kind: "SUPPORT_SERVER" }));
put("packages/lib/tests/integration/cache.int.spec.ts", "it('a plain integration case', () => {});");
put("packages/lib/tests/unit/x.spec.ts", "it('a unit case', () => {});");
put("apps/web/tests/component/Card.ct.spec.tsx", "test('paints', () => {});");
put("tests/journeys/root.spec.ts", "test('UIIAM.SESSION.01 crosses surfaces', () => {});");
put("apps/web/node_modules/dep/tests/journeys/skip.spec.ts", "test('never read', () => {});");
ok("an app server's integration folder is its contract tier", boundTier(root, join(root, "apps/api/tests/integration/login.int.spec.ts")), "CONTRACT");
ok("known-bad: another kind's integration folder binds no id", boundTier(root, join(root, "packages/lib/tests/integration/cache.int.spec.ts")), null);
ok("a unit case binds no id", boundTier(root, join(root, "packages/lib/tests/unit/x.spec.ts")), null);
const found = boundCases(root);
ok("contract: two cases, one without an id", [found.get("CONTRACT").length, found.get("CONTRACT").filter((c) => !c.hasId).length], [2, 1]);
ok("component: one case, no id", [found.get("COMPONENT").length, found.get("COMPONENT").filter((c) => !c.hasId).length], [1, 1]);
ok("journey: the root's case is read, node_modules is not", found.get("JOURNEY").map((c) => c.file), ["tests/journeys/root.spec.ts"]);

console.log("\n=== the command — soft, so it always exits 0");
const out = execFileSync("node", [new URL("../../../../../src/scripts/commands/behaviours/ids.ts", import.meta.url).pathname, root], { encoding: "utf8" });
ok("it names each file with a missing id", out.includes("! SOFT component  apps/web/tests/component/Card.ct.spec.tsx  1 case(s) with no id"), true);
ok("and totals by tier", out.includes("2 case(s) with no id — contract 1 of 2 · component 1 of 1 · journey 0 of 1"), true);

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
