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
ok("a title built from data in a file that writes the id carries it through data (Q363 A)",
  casesIn("const rows = [{ ids: ['UINTF.CONFIG.12'] }];\nfor (const r of rows) test(`${r.ids.join(' ')} redirects`, () => {});").map((c) => [c.hasId, c.throughData]), [[true, true]]);
ok("known-bad: a title built from data in a file that writes no id has none",
  casesIn("for (const r of rows) test(`${r.from} redirects`, () => {});").map((c) => [c.hasId, c.throughData]), [[false, false]]);
ok("known-bad: a plain-quoted title with a dollar is not built from data",
  casesIn("const x = 'IAM.LOGIN.01';\ntest('costs ${x}', () => {});").map((c) => [c.hasId, c.throughData]), [[false, false]]);

console.log("\n=== boundTier and boundCases — which folders bind an id");
const root = mkdtempSync(join(tmpdir(), "spn-ids-"));
const put = (path, text) => { mkdirSync(join(root, path, ".."), { recursive: true }); writeFileSync(join(root, path), text); };
put("apps/api/spkind.json", JSON.stringify({ kind: "APP_SERVER" }));
put("apps/api/tests/integration/login.int.spec.ts", "it('a plain integration case', () => {});");
put("packages/client/spkind.json", JSON.stringify({ kind: "CLIENT_API" }));
put("packages/client/tests/contract/iam/login.contract.spec.ts", "it('IAM.LOGIN.01 a', () => {}); it('b', () => {});");
put("packages/lib/spkind.json", JSON.stringify({ kind: "SUPPORT_SERVER" }));
put("packages/lib/tests/integration/cache.int.spec.ts", "it('a plain integration case', () => {});");
put("packages/lib/tests/unit/x.spec.ts", "it('a unit case', () => {});");
put("apps/web/tests/component/Card.ct.spec.tsx", "test('paints', () => {});");
put("tests/journeys/root.spec.ts", "test('UIIAM.SESSION.01 crosses surfaces', () => {});");
put("apps/web/node_modules/dep/tests/journeys/skip.spec.ts", "test('never read', () => {});");
put("tests/helpers/table.ts", "export const ROWS = [{ from: '/a', ids: ['UINTF.CONFIG.12'] }];");
put("tests/journeys/built.spec.ts", "import { ROWS } from '../helpers/table';\nfor (const r of ROWS) test(`[${r.ids.join(' ')}] ${r.from} redirects`, () => {});");
ok("known-bad: an app server's integration folder is integration, and binds no id", boundTier(root, join(root, "apps/api/tests/integration/login.int.spec.ts")), null);
ok("known-bad: another kind's integration folder binds no id", boundTier(root, join(root, "packages/lib/tests/integration/cache.int.spec.ts")), null);
ok("a unit case binds no id", boundTier(root, join(root, "packages/lib/tests/unit/x.spec.ts")), null);
ok("a client's tests/contract/ folder is the contract tier", boundTier(root, join(root, "packages/client/tests/contract/iam/login.contract.spec.ts")), "CONTRACT");
ok("known-bad: a unit case mirroring src/contract/ binds no id", boundTier(root, join(root, "packages/lib/tests/unit/contract/states.spec.ts")), null);
const found = boundCases(root);
ok("contract: two cases, one without an id", [found.get("CONTRACT").length, found.get("CONTRACT").filter((c) => !c.hasId).length], [2, 1]);
ok("component: one case, no id", [found.get("COMPONENT").length, found.get("COMPONENT").filter((c) => !c.hasId).length], [1, 1]);
ok("journey: the root's cases are read, node_modules is not", found.get("JOURNEY").map((c) => c.file).sort(), ["tests/journeys/built.spec.ts", "tests/journeys/root.spec.ts"]);
ok("a data-built title whose table is imported carries its id through data", found.get("JOURNEY").filter((c) => c.throughData).map((c) => c.file), ["tests/journeys/built.spec.ts"]);

console.log("\n=== the command — strict: exit 1 while any case has no id");
let out = "", code = 0;
try { out = execFileSync("node", [new URL("../../../../../src/scripts/commands/behaviours/ids.ts", import.meta.url).pathname, root], { encoding: "utf8" }); }
catch (e) { out = String(e.stdout ?? ""); code = e.status ?? 1; }
ok("known-bad: a repository with cases missing their id exits 1", code, 1);
ok("it names each file with a missing id", out.includes("✗ component  apps/web/tests/component/Card.ct.spec.tsx  1 case(s) with no id"), true);
ok("and totals by tier", out.includes("2 case(s) with no id — contract 1 of 2 · component 1 of 1 · journey 0 of 2; 1 through data"), true);

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
