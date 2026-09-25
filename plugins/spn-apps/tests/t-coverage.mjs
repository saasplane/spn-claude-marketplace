// `coverage` — route-e2e, spec-restore and foreign-double.
import { one, done, tree } from "./harness.mjs";

const REPO = { "sprepo.json": '{"world":"APPS","stacks":["spn-apps"]}\n' };
const APP = (dir) => ({ [dir + "/spkind.json"]: '{"kind":"APP_SERVER","config":null}\n' });
const MODULE = (dir) => ({ [dir + "/spkind.json"]: '{"kind":"MODULE_SERVER","config":null}\n' });

const CTRL = "apps/api/src/controllers/UserController.ts";
const controller = (route) =>
  "export class UserController {\n  @SPAPIRouteCommand('GET', '" + route + "')\n" +
  "  async list() { return []; }\n}\n";

console.log("=== route-e2e — known-bad");

one("a route no case names", {
  script: "coverage", args: ["--check", "route-e2e"],
  root: tree({ ...REPO, ...APP("apps/api") }),
  input: { file_path: CTRL, content: controller("/users") },
  expect: "note", says: "no case naming it",
});

one("a route named only outside its own node", {
  script: "coverage", args: ["--check", "route-e2e"],
  root: tree({ ...REPO, ...APP("apps/api"), ...APP("apps/web"),
               "apps/web/tests/journeys/a.spec.ts": "test('x', () => fetch('/users'));\n" }),
  input: { file_path: CTRL, content: controller("/users") },
  expect: "note", says: "outside its own node",
});

console.log("\n=== route-e2e — untouched");

one("a route its own node's tests name", {
  script: "coverage", args: ["--check", "route-e2e"],
  root: tree({ ...REPO, ...APP("apps/api"),
               "apps/api/tests/journeys/a.spec.ts": "test('x', () => fetch('/users'));\n" }),
  input: { file_path: CTRL, content: controller("/users") },
  expect: "",
});

one("a route already on disk, which this write did not add", {
  script: "coverage", args: ["--check", "route-e2e"],
  root: tree({ ...REPO, ...APP("apps/api"), [CTRL]: controller("/users") }),
  input: { file_path: CTRL, old_string: "async list() { return []; }",
           new_string: "async list() { return [1]; }" },
  expect: "",
});

one("a route already on disk is not something this write added", {
  script: "coverage", args: ["--check", "route-e2e"],
  root: tree({ ...REPO, ...APP("apps/api"), [CTRL]: controller("/users") }),
  input: { file_path: CTRL, content: controller("/users") },
  expect: "",
});

one("a file outside any repository", {
  script: "coverage", args: ["--check", "route-e2e"],
  root: tree({}),
  input: { file_path: CTRL, content: controller("/users") },
  expect: "",
});

console.log("\n=== spec-restore — known-bad");

const SPEC = "apps/api/tests/journeys/orgs.spec.ts";
const MUTATES = "test('it', async () => {\n  await setBooleanEnablement('X', true);\n  expect(1).toBe(1);\n});\n";

one("a mutation with no restore at all", {
  script: "coverage", args: ["--check", "spec-restore"],
  root: tree({ ...REPO, ...APP("apps/api"), [SPEC]: MUTATES }),
  input: { file_path: SPEC, content: MUTATES },
  expect: "note", says: "interrupt-safe restore",
});

const TRAILING = "test('it', async () => {\n  await setBooleanEnablement('X', true);\n" +
  "  expect(1).toBe(1);\n  await setBooleanEnablement('X', false);\n});\n";
one("a trailing restore, which a failure above it skips", {
  script: "coverage", args: ["--check", "spec-restore"],
  root: tree({ ...REPO, ...APP("apps/api"), [SPEC]: TRAILING }),
  input: { file_path: SPEC, content: TRAILING },
  expect: "note", says: "interrupt-safe restore",
});

const HTTP = "test('it', async () => {\n  await request.post('/orgs');\n});\n";
one("a mutating API call", {
  script: "coverage", args: ["--check", "spec-restore"],
  root: tree({ ...REPO, ...APP("apps/api"), [SPEC]: HTTP }),
  input: { file_path: SPEC, content: HTTP },
  expect: "note", says: "interrupt-safe restore",
});

const SQL = "test('it', async () => {\n  await db.query('DELETE FROM orgs');\n});\n";
one("a write to the database", {
  script: "coverage", args: ["--check", "spec-restore"],
  root: tree({ ...REPO, ...APP("apps/api"), [SPEC]: SQL }),
  input: { file_path: SPEC, content: SQL },
  expect: "note", says: "interrupt-safe restore",
});

console.log("\n=== spec-restore — untouched");

for (const [label, guard] of [
  ["afterEach", "afterEach(async () => { await setBooleanEnablement('X', false); });\n"],
  ["afterAll", "afterAll(async () => { await setBooleanEnablement('X', false); });\n"],
  ["a finally block", "test('it', async () => { try { await setBooleanEnablement('X', true); } finally { await reset(); } });\n"],
]) {
  one("a restore in " + label, {
    script: "coverage", args: ["--check", "spec-restore"],
    root: tree({ ...REPO, ...APP("apps/api"), [SPEC]: guard + MUTATES }),
    input: { file_path: SPEC, content: guard + MUTATES },
    expect: "",
  });
}

one("a module spec, which stands nothing shared up", {
  script: "coverage", args: ["--check", "spec-restore"],
  root: tree({ ...REPO, ...MODULE("packages/mod-ts"),
               "packages/mod-ts/tests/a.spec.ts": MUTATES }),
  input: { file_path: "packages/mod-ts/tests/a.spec.ts", content: MUTATES },
  expect: "",
});

const HELPER = "export async function enable() {\n  await setBooleanEnablement('X', true);\n}\n";
one("a helper the specs call, which declares no cases", {
  script: "coverage", args: ["--check", "spec-restore"],
  root: tree({ ...REPO, ...APP("apps/api"), "apps/api/tests/helpers/enablement.ts": HELPER }),
  input: { file_path: "apps/api/tests/helpers/enablement.ts", content: HELPER },
  expect: "",
});

one("ordinary source that is not a spec", {
  script: "coverage", args: ["--check", "spec-restore"],
  root: tree({ ...REPO, ...APP("apps/api"), "apps/api/src/a.ts": MUTATES }),
  input: { file_path: "apps/api/src/a.ts", content: MUTATES },
  expect: "",
});

console.log("\n=== foreign-double — known-bad");

const MSPEC = "packages/mod-ts/tests/a.spec.ts";
const FOREIGN = "vi.mock('@saasplane/support-web-ds-ts');\ntest('it', () => expect(1).toBe(1));\n";
one("a module doubling a sibling package", {
  script: "coverage", args: ["--check", "foreign-double"],
  root: tree({ ...REPO, ...MODULE("packages/mod-ts"), [MSPEC]: FOREIGN }),
  input: { file_path: MSPEC, content: FOREIGN },
  expect: "note", says: "does not own this seam",
});

console.log("\n=== foreign-double — untouched");

const OWN = "vi.mock('@saasplane/mod-ts');\ntest('it', () => expect(1).toBe(1));\n";
one("a module doubling its own package", {
  script: "coverage", args: ["--check", "foreign-double"],
  root: tree({ ...REPO, ...MODULE("packages/mod-ts"), [MSPEC]: OWN }),
  input: { file_path: MSPEC, content: OWN }, expect: "",
});

const THIRD = "vi.mock('node-fetch');\ntest('it', () => expect(1).toBe(1));\n";
one("a third-party double, which is the node's own business", {
  script: "coverage", args: ["--check", "foreign-double"],
  root: tree({ ...REPO, ...MODULE("packages/mod-ts"), [MSPEC]: THIRD }),
  input: { file_path: MSPEC, content: THIRD }, expect: "",
});

one("an application doubling anything, which this never judges", {
  script: "coverage", args: ["--check", "foreign-double"],
  root: tree({ ...REPO, ...APP("apps/api"), "apps/api/tests/a.spec.ts": FOREIGN }),
  input: { file_path: "apps/api/tests/a.spec.ts", content: FOREIGN }, expect: "",
});

done("coverage");
