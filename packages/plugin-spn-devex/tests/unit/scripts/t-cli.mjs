// `cli.ts` — the one entry: `<group> <action> [args] [--json]`, lazily importing
// `commands/<group>/<action>.ts`. A group is a folder and an action is a file, so this proves the
// discovery itself (a file named `_lib.ts` is never dispatched, an unknown group or action refuses
// with the list) rather than any one command's own behaviour, which belongs to that command's test.
import { PLUGIN } from "../../helpers/harness.mjs";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { actionsOf, groups, main } from "../../../src/scripts/cli.ts";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** Capture what `main` prints, since it is the CLI's own stdout rather than a return value. */
async function capture(argv) {
  const lines = [];
  const errLines = [];
  const realLog = console.log, realErr = console.error;
  console.log = (...args) => lines.push(args.join(" "));
  console.error = (...args) => errLines.push(args.join(" "));
  let code;
  try { code = await main(argv); }
  finally { console.log = realLog; console.error = realErr; }
  return { code, out: lines.join("\n"), err: errLines.join("\n") };
}

console.log("=== cli — real groups and actions this plugin ships");
{
  const gs = groups();
  ok("every group this plugin ships is discovered", ["behaviours", "docs", "plugin", "restates"].every((g) => gs.includes(g)), gs.join(","));
  const docsActions = actionsOf("docs");
  ok("a group's actions are its files, not a hand-kept list", docsActions.includes("audit") && docsActions.includes("coherence"));
  ok("`docs cycles` is an action because its file exists", docsActions.includes("cycles"), docsActions.join(","));
  ok("a file starting with `_` is a shared helper, never an action", !docsActions.includes("_lib"), docsActions.join(","));
}

console.log("\n=== cli — help lists every action as data");
{
  const { code, out } = await capture(["help", "--json"]);
  const parsed = JSON.parse(out);
  ok("exits clean", code === 0);
  ok("carries this plugin's own name", parsed.plugin === "spn-devex");
  ok("every command carries a non-empty describe", parsed.commands.every((c) => typeof c.describe === "string" && c.describe.length > 0), JSON.stringify(parsed.commands.filter((c) => !c.describe)));
  ok("a command reads `<group> <action>`", parsed.commands.some((c) => c.command === "docs audit"));
  ok("help lists `docs cycles` with its own describe",
    parsed.commands.some((c) => c.command === "docs cycles" && /Cycles/.test(c.describe)));
}

console.log("\n=== cli — an unknown group or action refuses with the list, never a crash");
{
  const bad = await capture(["nosuchgroup"]);
  ok("an unknown group exits non-zero", bad.code !== 0, `code ${bad.code}`);
  ok("and names the real groups", bad.err.includes("docs") && bad.err.includes("restates"), bad.err);

  const badAction = await capture(["docs", "nosuchaction"]);
  ok("an unknown action exits non-zero", badAction.code !== 0, `code ${badAction.code}`);
  ok("and names the real actions of that group", badAction.err.includes("audit") && badAction.err.includes("face"), badAction.err);

  const noAction = await capture(["docs"]);
  ok("a group with no action names usage and the action list", noAction.code !== 0 && noAction.err.includes("audit"), noAction.err);
}

console.log("\n=== cli — dispatches to a real command and hands back its exit code");
{
  const root = mkdtempSync(join(tmpdir(), "cli-dispatch-"));
  try {
    mkdirSync(join(root, ".spndevex"), { recursive: true });
    writeFileSync(join(root, "no-block.md"), "# nothing here\n", "utf8");
    const { code } = await capture(["docs", "audit", join(root, "no-block.md")]);
    // A markdown file with no `spn:doc` block is a RULE finding, so this proves the args reached
    // the real `audit` command and its own exit-code convention (findings → non-zero) held.
    ok("`docs audit` runs for real and returns its own exit code", code === 1, `code ${code}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — cli` : `\n  all ${total} passed — cli`);
process.exit(failed ? 1 : 0);
