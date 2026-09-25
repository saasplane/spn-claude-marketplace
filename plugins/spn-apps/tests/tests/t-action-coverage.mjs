// `action-coverage` — the published actions, and which of them a behaviour row claims.
//
// This tool CHANGES NOTHING, so the bar is different from `behaviour-rows`: every case asserts what
// it reported and what its exit code was, because the failure worth fearing here is a gate that
// reports green having found nothing to look at.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const TOOL = resolve(import.meta.dirname, "..", "src", "scripts", "tools", "action-coverage.ts");
const kept = [];
process.on("exit", () => { for (const d of kept) rmSync(d, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** A repository on disk: files by path, written under a fresh root that carries an `sprepo.json`. */
const tree = (files) => {
  const root = mkdtempSync(join(tmpdir(), "actions-"));
  kept.push(root);
  const all = { "sprepo.json": '{"world":"APPS","stacks":["spn-apps-ts"]}\n', ...files };
  for (const [path, body] of Object.entries(all)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body, "utf8");
  }
  return root;
};

const manifest = (kind, code) => JSON.stringify({ kind: kind, name: code, config: { mtype: kind, code: code } });

/** A controller declaring one or more `METHOD path` pairs. */
const controller = (...routes) =>
  "export class AController {\n" +
  routes.map(([method, path]) =>
    `  @SPAPIRouteCommand('${method}', '${path}')\n  async handle() { return null; }\n`).join("") +
  "}\n";

/** A register: the eight headings, then one row per tuple of [id, who, does, sees, type, tier]. */
const register = (...rows) => [
  "# An area",
  "",
  "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ...rows.map(([id, who, does, sees, type, tier]) =>
    `| \`${id}\` | ${who} | ${does} | ${sees} | ${type} | ${tier} | PLANNED |  |`),
  "",
].join("\n");

const run = (root, ...args) => {
  try {
    const stdout = execFileSync("node", [TOOL, ...args, "."], { cwd: root, encoding: "utf8" });
    return { out: stdout, code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 };
  }
};

console.log("=== the gate — a state action nothing claims");

{
  const root = tree({
    "packages/module-server-iam-ts/spkind.json": manifest("MODULE_SERVER", "IAM"),
    "packages/module-server-iam-ts/src/entry/api/controllers/C.ts": controller(["POST", "/group/active"]),
    "docs/03-behaviors/group.md": register(
      ["IAM.GROUP.01", "a person", "creates a group", "the group listed", "POSITIVE", "CONTRACT"]),
  });
  const { out, code } = run(root);
  ok("an unclaimed state action is named", out.includes("POST") && out.includes("/group/active"));
  ok("under the module its own manifest declares", /\n {2}IAM\n/.test(out));
  ok("and the run fails", code === 1);

  const reported = run(root, "--report");
  ok("--report names the same action", reported.out.includes("/group/active"));
  ok("and exits 0, so a report is not a gate", reported.code === 0);
}

{
  const root = tree({
    "packages/module-server-iam-ts/spkind.json": manifest("MODULE_SERVER", "IAM"),
    "packages/module-server-iam-ts/src/entry/api/controllers/C.ts": controller(["POST", "/group/active"]),
    "docs/03-behaviors/group.md": register(
      ["IAM.GROUP.02", "an access manager", "deactivates a group", "the group marked inactive", "POSITIVE", "CONTRACT"]),
  });
  const { out, code } = run(root);
  ok("a row using a synonym of the verb claims it", out.includes("every state action is claimed"));
  ok("and the run passes", code === 0);
}

{
  const root = tree({
    "packages/module-server-iam-ts/spkind.json": manifest("MODULE_SERVER", "IAM"),
    "packages/module-server-iam-ts/src/entry/api/controllers/C.ts": controller(["POST", "/group/active"]),
    "docs/03-behaviors/other.md": register(
      ["IAM.ORG.01", "a person", "deactivates an organization", "it marked inactive", "POSITIVE", "CONTRACT"]),
  });
  const { out, code } = run(root);
  ok("the same verb about another entity does not claim it", out.includes("/group/active") && code === 1);
}

console.log("\n=== finding an action — the decorator, not a folder shape");

{
  const root = tree({
    "apps/service-platform-ts/spkind.json": manifest("APP_SERVER", "api"),
    "apps/service-platform-ts/src/modules/project/spkind.json": manifest("MODULE_SERVER", "PRJ"),
    "apps/service-platform-ts/src/modules/project/entry/api/controllers/C.ts": controller(["POST", "/project/active"]),
  });
  const { out } = run(root);
  ok("an app-owned module's controller is found", out.includes("/project/active"));
  ok("and carries its own module's code, not the app's", /\n {2}PRJ\n/.test(out) && !out.includes("\n  api\n"));
}

{
  const root = tree({
    "packages/anything-at-all/spkind.json": manifest("MODULE_SERVER", "LNG"),
    "packages/anything-at-all/src/whatever/C.ts": controller(["POST", "/label/active"]),
  });
  const { out } = run(root);
  ok("neither the folder name nor the path decides the module", /\n {2}LNG\n/.test(out));
}

{
  const root = tree({
    "packages/m/spkind.json": manifest("MODULE_SERVER", "IAM"),
    "packages/m/src/C.ts":
      "export class C {\n" +
      "  // @SPAPIRouteCommand('POST', '/gone/active')\n" +
      "  /* @SPAPIRouteCommand('POST', '/also-gone/delete') */\n" +
      "  @SPAPIRouteCommand('POST', '/real/active')\n  async handle() { return null; }\n}\n",
  });
  const { out } = run(root);
  ok("a decorator in a line comment is not a published action", !out.includes("/gone/active"));
  ok("nor one in a block comment", !out.includes("/also-gone/delete"));
  ok("and the live one beside them still counts", out.includes("/real/active"));
  ok("so the surface is counted from what is published", out.includes("1 published action"));
}

console.log("\n=== finding a register — by its header, wherever it sits");

{
  const root = tree({
    "packages/m/spkind.json": manifest("MODULE_SERVER", "IAM"),
    "packages/m/src/C.ts": controller(["POST", "/group/active"]),
    "some/unexpected/place/rows.md": register(
      ["IAM.GROUP.02", "a person", "deactivates a group", "it inactive", "POSITIVE", "CONTRACT"]),
  });
  const { out, code } = run(root);
  ok("a register is read wherever the tree puts it", code === 0 && out.includes("1 declared in 1 register"));
}

{
  const root = tree({
    "packages/m/spkind.json": manifest("MODULE_SERVER", "IAM"),
    "packages/m/src/C.ts": controller(["POST", "/group/active"]),
    "docs/not-a-register.md": [
      "| Id | Behavior | Acceptance | Status |",
      "| --- | --- | --- | --- |",
      "| `IAM.GROUP.02` | a person deactivates a group | it is inactive | ✅ |",
      "",
    ].join("\n"),
  });
  const { out, code } = run(root);
  ok("a table with other headings is not a register", out.includes("0 declared in 0 register"));
  ok("so the action it appears to claim is still unclaimed", code === 1);
  ok("and an empty result says so rather than blaming the code",
     out.includes("no behaviour register found"));
}

console.log("\n=== the shape table — designed absences, read from the Type cell");

{
  const root = tree({
    "packages/m/spkind.json": manifest("MODULE_SERVER", "ORG"),
    "packages/m/src/C.ts": controller(
      ["POST", "/policy"], ["POST", "/policy/update"], ["POST", "/policy/active"]),
    "docs/rows.md": register(
      ["ORG.POLICY.01", "a person", "deactivates a policy", "it inactive", "POSITIVE", "CONTRACT"],
      ["ORG.POLICY.40", "a person", "tries to delete a policy", "no way to delete one", "NEGATIVE", "CONTRACT"]),
  });
  const { out } = run(root);
  ok("an entity with a lifecycle is listed", out.includes("1 entities carry a lifecycle"));
  ok("a NEGATIVE row naming the absence closes that dash", !out.includes("policy · delete"));
}

{
  const root = tree({
    "packages/m/spkind.json": manifest("MODULE_SERVER", "ORG"),
    "packages/m/src/C.ts": controller(
      ["POST", "/policy"], ["POST", "/policy/update"], ["POST", "/policy/active"]),
    "docs/rows.md": register(
      ["ORG.POLICY.01", "a person", "deactivates a policy", "it inactive", "POSITIVE", "CONTRACT"],
      ["ORG.POLICY.02", "a person", "tries to delete a policy", "no way to delete one", "POSITIVE", "CONTRACT"]),
  });
  const { out } = run(root);
  ok("the same sentence marked POSITIVE does not name an absence", out.includes("policy · delete"));
  ok("so the Type cell decides it, never the words", out.includes("designed absence"));
}

{
  const root = tree({
    "packages/m/spkind.json": manifest("MODULE_SERVER", "ORG"),
    "packages/m/src/C.ts": controller(["POST", "/token"]),
  });
  const { out } = run(root);
  ok("an entity that can only be created carries no lifecycle", out.includes("0 entities carry a lifecycle"));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — action-coverage` : `\n  all ${total} passed — action-coverage`);
process.exit(failed ? 1 : 0);
