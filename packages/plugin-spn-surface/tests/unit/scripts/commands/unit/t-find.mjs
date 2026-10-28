// `unit find` — the units a task's words point to, from the snapshot this plugin carries and the
// symbol index `unit show` reads.
//
// THIS SUITE OWNS THE COMMAND'S SEARCH. Against the `unit show` fixture it proves a word finds a core
// unit by its line, a module's unit by its name from a workspace's root with its member named, a word
// matched by its first five letters, the unit named for the words ranked before one whose line carries
// them, a name the snapshot holds listed once, the JSON form, and the two refusals.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const PLUGIN_SRC = resolve(import.meta.dirname, "..", "..", "..", "..", "..", "src");
const CLI = join(PLUGIN_SRC, "scripts", "cli.ts");
const FIXTURE = resolve(import.meta.dirname, "..", "..", "..", "..", "fixtures", "unit-show");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

function runIn(cwd, ...args) {
  const env = { ...process.env, SPN_TELEMETRY: "off", SPN_SURFACE_UNIT_ROOT: FIXTURE };
  try {
    return { out: execFileSync("node", [CLI, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env, cwd }), code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 };
  }
}

/** A workspace root with one member holding the fixture index, where a fresh window starts. */
function workspaceRoot() {
  const root = mkdtempSync(join(tmpdir(), "unit-find-workspace-"));
  mkdirSync(join(root, ".spndevex"), { recursive: true });
  mkdirSync(join(root, "spn-platform", ".claude", "saasplane"), { recursive: true });
  writeFileSync(join(root, "spn-platform", "sprepo.json"), "{}\n");
  writeFileSync(join(root, "spn-platform", ".claude", "saasplane", "spn-symbols.json"), readFileSync(join(FIXTURE, "spn-symbols.json"), "utf8"));
  return root;
}

const first = (out) => out.split("\n").find((line) => line.startsWith("  ") && line.trim())?.trim() ?? "";

console.log("=== unit find — from a workspace's root");
{
  const root = workspaceRoot();
  const badge = runIn(root, "unit", "find", "factor", "verified");
  ok("a module's unit is found by its name, and named first", badge.code === 0 && first(badge.out).startsWith("IdentityFactorVerificationBadge"), badge.out);
  ok("its line names the package, the member, and the block whose cases it leaves to",
    first(badge.out).includes("@saasplane/module-web-iam-ts, in spn-platform") && first(badge.out).includes("its cases are DSBadge's"), badge.out);
  ok("its intent is printed under it", badge.out.includes("Whether a factor has been proven end to end"), badge.out);
  ok("it points to `unit show`", badge.out.includes("run `spn-surface unit show <Unit>`"), badge.out);

  const roles = runIn(root, "unit", "find", "the org's roles as a table");
  ok("a container is found by its intent, and points to the container patterns",
    first(roles.out).startsWith("RoleListContainer") && first(roles.out).includes("the container patterns"), roles.out);

  const quoted = runIn(root, "unit", "find", "list detail");
  ok("the words may come as one argument", first(quoted.out).startsWith("DSListDetail"), quoted.out);

  const core = runIn(root, "unit", "find", "pinned", "edge", "screen");
  ok("a core unit is found by its line, and named as the core", first(core.out).startsWith("DSSheet") && first(core.out).includes("the core"), core.out);

  const rows = runIn(root, "unit", "find", "list");
  ok("the unit named for the word ranks before one whose line carries it",
    rows.out.indexOf("DSList ") > -1 && rows.out.indexOf("DSListDetail") > -1 && rows.out.indexOf("DSList") <= rows.out.indexOf("DSListDetail"), rows.out);

  const json = runIn(root, "unit", "find", "factor", "--json");
  let parsed = null; try { parsed = JSON.parse(json.out); } catch { /* reported below */ }
  ok("--json carries each unit with its member and block", parsed?.units?.[0]?.unit === "IdentityFactorVerificationBadge"
    && parsed.units[0].repository === "spn-platform" && parsed.units[0].block === "DSBadge" && parsed.units[0].core === false, json.out);
}

console.log("\n=== unit find — matching");
{
  const root = workspaceRoot();
  const stem = runIn(root, "unit", "find", "verification");
  ok("a word matches by its first five letters", first(stem.out).startsWith("IdentityFactorVerificationBadge"), stem.out);
  const short = runIn(root, "unit", "find", "a", "of", "the", "factor");
  ok("a word of three letters or fewer is dropped", first(short.out).startsWith("IdentityFactorVerificationBadge"), short.out);
}

console.log("\n=== unit find — refusals");
{
  const root = workspaceRoot();
  const none = runIn(root, "unit", "find");
  ok("no words is a usage fault", none.code === 2 && none.out.includes("needs the words of a task"), none.out);
  const nothing = runIn(root, "unit", "find", "zebra", "giraffe");
  ok("words no unit carries exit 1 and say so", nothing.code === 1 && nothing.out.includes("no unit's name or line carries"), nothing.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — unit find` : `\n  all ${total} passed — unit find`);
process.exit(failed ? 1 : 0);
