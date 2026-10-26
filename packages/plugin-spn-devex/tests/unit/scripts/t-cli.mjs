// `cli.ts` — the one entry: `<group> [<subject>] <action> [<path>…] [options]`.
//
// A group is a folder, and a file in it is a subject where it exports `actions` and an action where
// it exports `run`. This suite proves the entry alone: the discovery, `help`, each refusal, the
// dispatch, and the one telemetry line a run writes. What a command does with its own words belongs
// to that command's suite.
import { PLUGIN } from "../../helpers/harness.mjs";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { filesOf, groups, main } from "../../../src/scripts/cli.ts";

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

console.log("=== cli — the groups and the command files this plugin ships");
{
  const found = groups();
  ok("every group this plugin ships is discovered", ["behaviours", "coverage", "docs", "plugin", "restates"].every((group) => found.includes(group)), found.join(","));
  const docsFiles = filesOf("docs");
  ok("a group's commands are its files, not a hand-kept list", docsFiles.includes("audit") && docsFiles.includes("coherence"));
  ok("`docs cycles` is a subject because its file exists", docsFiles.includes("cycles"), docsFiles.join(","));
  ok("a file starting with `_` is a shared helper, never a command", !docsFiles.includes("_lib"), docsFiles.join(","));
  ok("[MKT.SCRIPTS.81] `report refresh` is a command because its file exists",
    found.includes("report") && filesOf("report").includes("refresh"), `${found.join(",")} · ${filesOf("report").join(",")}`);
}

console.log("\n=== cli — help lists every action, as a reading and as data");
{
  const { code, out } = await capture(["help", "--json"]);
  const parsed = JSON.parse(out);
  const commandOf = (words) => parsed.commands.find((listed) => listed.command === words);
  ok("exits clean", code === 0);
  ok("carries this plugin's own name", parsed.plugin === "spn-devex");
  ok("every action carries exactly group, subject, action, command and describe",
    parsed.commands.every((listed) => Object.keys(listed).join(",") === "group,subject,action,command,describe"),
    JSON.stringify(parsed.commands.find((listed) => Object.keys(listed).join(",") !== "group,subject,action,command,describe")));
  ok("every action carries a non-empty describe", parsed.commands.every((listed) => typeof listed.describe === "string" && listed.describe.length > 0),
    JSON.stringify(parsed.commands.filter((listed) => !listed.describe)));
  ok("a subject is listed once for each of its actions, as `<group> <subject> <action>`",
    JSON.stringify([commandOf("docs face check"), commandOf("docs face write")].map((listed) => [listed?.group, listed?.subject, listed?.action])) ===
    JSON.stringify([["docs", "face", "check"], ["docs", "face", "write"]]), JSON.stringify(parsed.commands.filter((listed) => listed.subject === "face")));
  ok("and never by the subject's name alone", commandOf("docs face") === undefined && commandOf("docs audit") === undefined);
  ok("`docs audit` lists `check` and `report`, each with its own describe",
    commandOf("docs audit check")?.describe.length > 0 && commandOf("docs audit report")?.describe.length > 0 &&
    commandOf("docs audit check").describe !== commandOf("docs audit report").describe);
  ok("a command of two words has a null subject", commandOf("restates check")?.subject === null && commandOf("restates check")?.action === "check",
    JSON.stringify(commandOf("restates check")));
  ok("help lists `docs cycles` with its own describe",
    parsed.commands.some((listed) => listed.command.startsWith("docs cycles") && /Cycles/.test(listed.describe)));

  const read = await capture(["help"]);
  ok("`help` prints one line for each action, as its words", read.code === 0 &&
    parsed.commands.every((listed) => read.out.split("\n").some((line) => line.startsWith(`  ${listed.command} `))), read.out);
  ok("and the reading states the grammar with the plugin's name", read.out.includes("`spn-devex <group> [<subject>] <action> [<path>…] [options]`"), read.out.split("\n")[0]);
  ok("with no word at all the entry prints the same reading", (await capture([])).out === read.out);

  // `help --json` names each command, and the file behind it says what the command takes. A refusal
  // prints that usage line, so a command with none would be refused with nothing to show.
  const withoutUsage = [];
  for (const listed of parsed.commands) {
    const file = await import(pathToFileURL(join(PLUGIN, "src", "scripts", "commands", listed.group, `${listed.subject ?? listed.action}.ts`)).href);
    const usage = listed.subject === null ? file.usage : file.actions?.[listed.action]?.usage;
    if (typeof usage !== "string") withoutUsage.push(listed.command);
  }
  ok("every command `help --json` lists carries a usage line", withoutUsage.length === 0, `no usage: ${withoutUsage.join(" · ")}`);
}

console.log("\n=== cli — an unknown group or command refuses with the list, never a crash");
{
  const bad = await capture(["nosuchgroup"]);
  ok("an unknown group exits 2", bad.code === 2, `code ${bad.code}`);
  ok("and names the real groups", bad.err.includes("docs") && bad.err.includes("restates"), bad.err);

  const badCommand = await capture(["docs", "nosuchcommand"]);
  ok("an unknown command of a group exits 2", badCommand.code === 2, `code ${badCommand.code}`);
  ok("and names what the group holds", badCommand.err.includes("unknown command `docs nosuchcommand`") && badCommand.err.includes("audit") && badCommand.err.includes("face"), badCommand.err);

  const noCommand = await capture(["docs"]);
  ok("a group with no further word exits 2 and names what the group holds", noCommand.code === 2 && noCommand.err.includes("audit"), noCommand.err);
  ok("a helper's name is no command", (await capture(["docs", "_lib"])).code === 2);
}

console.log("\n=== cli — a subject needs its action as a word");
{
  const USAGE = "usage: spn-devex docs face check [<path>] [--block glossary|constructs|contents|tags]\n" +
                "       spn-devex docs face write <path> [--block glossary|constructs|contents|tags]\n";
  const none = await capture(["docs", "face"]);
  ok("[MKT.SCRIPTS.111] a subject with no action exits 2", none.code === 2, `code ${none.code}`);
  ok("[MKT.SCRIPTS.111] and prints every usage line of the subject, then says an action is owed",
    `${none.err}\n` === `${USAGE}\`docs face\` needs an action.\n`, none.err);
  ok("[MKT.SCRIPTS.111] and prints nothing to stdout, so no command ran", none.out === "", none.out);

  const unknown = await capture(["docs", "face", "render"]);
  ok("[MKT.SCRIPTS.111] a word the subject does not name is refused the same way",
    unknown.code === 2 && `${unknown.err}\n` === `${USAGE}\`docs face\` needs an action.\n`, unknown.err);

  const option = await capture(["docs", "face", "some/tree", "--check"]);
  ok("[MKT.SCRIPTS.111] an option that spells an action is named as that action",
    option.code === 2 && `${option.err}\n` === `${USAGE}\`docs face\` needs an action. \`--check\` is the action \`check\`.\n`, option.err);
  ok("[MKT.SCRIPTS.111] an inherited name is no action", (await capture(["docs", "face", "constructor"])).code === 2);
}

console.log("\n=== cli — dispatches to a real command and hands back its exit code");
{
  const root = mkdtempSync(join(tmpdir(), "cli-dispatch-"));
  try {
    mkdirSync(join(root, ".spndevex"), { recursive: true });
    writeFileSync(join(root, "no-block.md"), "# nothing here\n", "utf8");
    const { code, out } = await capture(["docs", "audit", "check", join(root, "no-block.md")]);
    // A markdown file with no `spn:doc` block is a RULE finding, so this proves the words after the
    // action reached the real `check` and its own exit-code convention (a RULE finding → 1) held.
    ok("an action of a subject runs for real and returns its own exit code", code === 1 && out.includes("no-block.md"), `code ${code}`);
    const fault = await capture(["docs", "audit", "check", join(root, "no-block.md"), "--nosuchoption"]);
    ok("a usage fault of the command exits 2, after the command's own usage line",
      fault.code === 2 && fault.err.startsWith("usage: spn-devex docs audit check ") && fault.err.includes("`docs audit check` does not take `--nosuchoption`."), fault.err);
    const two = await capture(["behaviours", "check", root]);
    ok("an action with no subject runs with the words after it", two.code === 0 && two.out.length > 0, `code ${two.code}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log("\n=== cli — a run writes one telemetry line, with its words as the levels");
{
  // A workspace of its own with recording on, and a child with `SPN_TELEMETRY` removed, so nothing
  // is written into a real workspace.
  const root = realpathSync(mkdtempSync(join(tmpdir(), "cli-telemetry-")));
  try {
    mkdirSync(join(root, ".spndevex", ".debug"), { recursive: true });
    writeFileSync(join(root, ".spndevex", ".debug", "telemetry.on"), "on\n", "utf8");
    mkdirSync(join(root, "repo", "docs"), { recursive: true });
    writeFileSync(join(root, "repo", "sprepo.json"), '{"type":"APPS"}', "utf8");
    const entry = join(PLUGIN, "src", "scripts", "cli.ts");
    const env = { ...process.env, SPN_WORKSPACE: root };
    delete env.SPN_TELEMETRY;
    const run = (...words) => spawnSync(process.execPath, [entry, ...words], { encoding: "utf8", cwd: root, env });
    run("docs", "face", "check", "repo/docs", "--block", "tags");
    run("behaviours", "check", "repo");
    run("docs", "face", "write");
    run("docs", "face");
    const lines = readFileSync(join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line));
    const levels = (line) => [line.script, line.group, line.subgroup, line.action, line.args, line.exit];
    const commands = lines.filter((line) => line.group !== "cli").map(levels);
    ok("[MKT.SCRIPTS.116] a subject's action writes its group, its subject as `subgroup`, its action, and what followed the action",
      JSON.stringify(commands[0]) === JSON.stringify(["spn-devex", "docs", "face", "check", "repo/docs --block tags", 0]), JSON.stringify(commands[0]));
    ok("[MKT.SCRIPTS.116] a command of two words leaves `subgroup` empty, and is recorded though its file records nothing itself",
      JSON.stringify(commands[1]) === JSON.stringify(["spn-devex", "behaviours", null, "check", "repo", 0]), JSON.stringify(commands[1]));
    ok("[MKT.SCRIPTS.116] a run the command refuses is recorded with exit 2",
      JSON.stringify(commands[2]) === JSON.stringify(["spn-devex", "docs", "face", "write", null, 2]), JSON.stringify(commands[2]));
    ok("[MKT.SCRIPTS.116] each command is recorded once, and a run the entry refuses is no command",
      commands.length === 3 && lines.filter((line) => line.group === "cli").length === 3, JSON.stringify(lines.map(levels)));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log("\n=== cli — `--json` through a pipe arrives whole");
{
  // KNOWN-BAD: a pipe holds 65,536 bytes, and an entry that exits straight after it prints leaves
  // the rest unwritten. The fixture's measurement is several times that size.
  const root = mkdtempSync(join(tmpdir(), "cli-pipe-"));
  try {
    const rows = Array.from({ length: 900 }, (_, at) =>
      `| IAM.LOGIN.${String(at + 1).padStart(2, "0")} | a person | signs in, case ${at + 1} | the screen after the sign-in | POSITIVE | UNIT | PLANNED | — |`);
    mkdirSync(join(root, "docs", "03-behaviors"), { recursive: true });
    writeFileSync(join(root, "sprepo.json"), '{"type":"APPS","config":{"mtype":"APPS","stack":"TS"}}', "utf8");
    writeFileSync(join(root, "docs", "03-behaviors", "iam.md"),
      ["| Id | Who | Does | Sees | Type | Tier | Status | Updated at |", "| --- | --- | --- | --- | --- | --- | --- | --- |", ...rows, ""].join("\n"), "utf8");
    const entry = join(PLUGIN, "src", "scripts", "cli.ts");
    const piped = spawnSync(process.execPath, [entry, "behaviours", "coverage", "show", root, "--json"],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: { ...process.env, SPN_TELEMETRY: "off" } });
    let parsed = null;
    try { parsed = JSON.parse(piped.stdout); } catch { parsed = null; }
    ok("[MKT.SCRIPTS.95] the fixture's output is larger than a pipe holds", piped.stdout.length > 65536, `${piped.stdout.length} bytes`);
    ok("[MKT.SCRIPTS.95] every byte arrives, so the output parses", parsed !== null && parsed.rows.length === 900,
      `${piped.stdout.length} bytes · parsed ${parsed === null ? "no" : parsed.rows.length}`);
    ok("[MKT.SCRIPTS.95] and the entry still hands back the command's exit code", piped.status === 0, `status ${piped.status}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — cli` : `\n  all ${total} passed — cli`);
process.exit(failed ? 1 : 0);
