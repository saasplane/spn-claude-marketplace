// `plugin build` — thin by design: the build itself is proven by `N101` step 2's own gates (byte
// identical `dist/`, `help --json` parity, staleness and bundle-parity suites). This case proves only
// that the command finds the marketplace root, refuses cleanly where there is none, and hands the
// underlying script's exit code and flags through unchanged.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { run } from "../../../../../src/scripts/commands/plugin/build.ts";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** A marketplace-shaped fixture: `packages/plugin-spn-fixture` and a root `scripts/build-plugins.mjs`. */
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "plugin-build-"));
  mkdirSync(join(root, "packages", "plugin-spn-fixture", "src", ".claude-plugin"), { recursive: true });
  writeFileSync(join(root, "packages", "plugin-spn-fixture", "src", ".claude-plugin", "plugin.json"),
    '{"name":"spn-fixture"}\n', "utf8");
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(join(root, "scripts", "build-plugins.mjs"), "// fixture, never actually run\n", "utf8");
  return root;
}

console.log("=== plugin build — finds the marketplace root and runs the script there, with its own exit code");
{
  const root = fixture();
  try {
    const calls = [];
    const code = run([root, "--watch"], (script, passthrough, cwd) => {
      calls.push({ script, passthrough, cwd });
      return 0;
    });
    ok("exit code is the spawned script's own", code === 0);
    ok("one call was made", calls.length === 1, JSON.stringify(calls));
    ok("the script is this fixture's build-plugins.mjs", calls[0]?.script === join(root, "scripts", "build-plugins.mjs"));
    ok("cwd is the marketplace root", calls[0]?.cwd === root);
    ok("--watch is forwarded, the root path is not", JSON.stringify(calls[0]?.passthrough) === JSON.stringify(["--watch"]));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log("\n=== plugin build — a non-zero from the script is handed straight back");
{
  const root = fixture();
  try {
    const code = run([root], () => 7);
    ok("the spawned script's exit code is not swallowed", code === 7);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log("\n=== plugin build — no marketplace root above this refuses, never spawns");
{
  const nowhere = mkdtempSync(join(tmpdir(), "plugin-build-nowhere-"));
  try {
    let spawned = false;
    const code = run([nowhere], () => { spawned = true; return 0; });
    ok("refuses non-zero", code !== 0);
    ok("never spawned the script", spawned === false);
  } finally {
    rmSync(nowhere, { recursive: true, force: true });
  }
}

console.log("\n=== plugin build — a marketplace root with no build script refuses, never spawns");
{
  const root = mkdtempSync(join(tmpdir(), "plugin-build-no-script-"));
  try {
    mkdirSync(join(root, "packages", "plugin-spn-fixture", "src", ".claude-plugin"), { recursive: true });
    writeFileSync(join(root, "packages", "plugin-spn-fixture", "src", ".claude-plugin", "plugin.json"),
      '{"name":"spn-fixture"}\n', "utf8");
    let spawned = false;
    const code = run([root], () => { spawned = true; return 0; });
    ok("refuses non-zero", code !== 0);
    ok("never spawned the script", spawned === false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log("\n=== plugin build — what it refuses, typed through the entry, before any script is run");
{
  // A folder that holds no plugin, so the refusals below are reached and no build can start from it.
  const nowhere = mkdtempSync(join(tmpdir(), "plugin-build-typed-"));
  const typed = (...words) => {
    try { return { out: execFileSync("node", [join(PLUGIN, "src", "scripts", "cli.ts"), "plugin", "build", ...words], { cwd: nowhere, encoding: "utf8", stdio: "pipe", env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 }; }
    catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
  };
  try {
    const USAGE = "usage: spn-devex plugin build [<marketplace-root>] [--watch]\n";
    const option = typed(nowhere, "--release");
    ok("[MKT.SCRIPTS.174] an option the command does not take is refused with its usage line and exit 2",
      option.code === 2 && option.out === USAGE + "`plugin build` does not take `--release`.\n", option.out);
    const two = typed(nowhere, nowhere);
    ok("a second root is refused with exit 2", two.code === 2 && two.out === USAGE + "`plugin build` takes one marketplace root.\n", two.out);
    const none = typed(nowhere);
    ok("typed with a folder that holds no plugin, the command refuses with exit 1 and its own sentence", none.code === 1 && none.out.includes("nothing to bundle"), none.out);
    let spawned = false;
    let thrown = "";
    try { run([nowhere, "--release"], () => { spawned = true; return 0; }); } catch (error) { thrown = error.name; }
    ok("and an option it does not take is a usage fault thrown before any script is spawned", thrown === "UsageFault" && spawned === false, thrown);
  } finally {
    rmSync(nowhere, { recursive: true, force: true });
  }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plugin build` : `\n  all ${total} passed — plugin build`);
process.exit(failed ? 1 : 0);
