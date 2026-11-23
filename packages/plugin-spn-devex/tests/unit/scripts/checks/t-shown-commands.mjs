// `checks/shown-commands.ts` — a command a docs page shows is one the command line accepts today (decision 046's rule, held to the command table).
const { parseSpnutilsSnapshot, parseCommandTable, commandFinding, shownLines, shownCommandFindings, loadCommandTable } = await import("../../../../src/scripts/checks/shown-commands.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const TABLE = parseCommandTable([
  "# spn-devex commands",
  "spn-devex docs audit check [<path>…] [--variant <name>] — the findings under the paths",
  "spn-devex docs prose paragraphs <file> — print the flagged paragraphs",
  "spn-devex docs blocks units <file> [--json] — the units",
  "spn-surface language write <app> [--construct <construct.md>] — Fill a design-language construct's figures",
].join("\n"));

console.log("=== the table");
ok("each command line is an entry with its plain words", TABLE.length === 4 && TABLE[0].words.join(" ") === "docs audit check" && TABLE[3].cli === "spn-surface");
ok("the usage keeps the arguments", TABLE[0].usage === "spn-devex docs audit check [<path>…] [--variant <name>]");
ok("the real tables load", loadCommandTable().some((e) => e.words.join(" ") === "docs prose paragraphs"));

console.log("\n=== one shown line");
ok("node docs.ts audit is gone, and names the current form", commandFinding("node docs.ts audit docs/02-constructs", TABLE) === "`node docs.ts audit` is gone: use `spn-devex docs audit check [<path>…] [--variant <name>]` (RULE.DEVEX.WORKSPACE.046)", commandFinding("node docs.ts audit docs/02-constructs", TABLE));
ok("a node line with no current command says so", commandFinding("node tool.ts run", TABLE).includes("no command of that name"));
ok("a command the table holds passes", commandFinding("spn-devex docs audit check docs/02-constructs", TABLE) === null);
ok("a command with flags and a path passes", commandFinding("spn-devex docs blocks units a.md --json", TABLE) === null);
ok("the surface command the design-language template shows passes", commandFinding("spn-surface language write <app>", TABLE) === null);
const gone = commandFinding("spn-devex docs audit", TABLE);
ok("a command short of its action names the closest form", gone === "`spn-devex docs audit` is not a command the command line accepts: use `spn-devex docs audit check [<path>…] [--variant <name>]` (RULE.DEVEX.WORKSPACE.046)", gone);
ok("a command that is nowhere in the table is refused", commandFinding("spn-devex nothing here", TABLE).includes("no command of that name"));
ok("a line with no command has nothing to find", commandFinding("pnpm install", TABLE) === null);
ok("a spnutils line is not read where the table holds no spnutils", commandFinding("spnutils workspace status", TABLE) === null);

console.log("\n=== spnutils, from its snapshot (S72)");
const SNAP = parseSpnutilsSnapshot(JSON.stringify({ cli: "spnutils", commands: [
  { command: "workspace status", signature: "spnutils workspace status [options]" },
  { command: "workspace clock set", signature: "spnutils workspace clock set [options] <timezone>" },
] }));
const BOTH = [...TABLE, ...SNAP];
ok("the snapshot's commands are entries with their words and signature", SNAP.length === 2 && SNAP[1].words.join(" ") === "workspace clock set" && SNAP[0].usage === "spnutils workspace status [options]");
ok("a snapshot of another cli or a text that does not read holds none", parseSpnutilsSnapshot("{}").length === 0 && parseSpnutilsSnapshot("nope").length === 0 && parseSpnutilsSnapshot('{"cli":"x","commands":[]}').length === 0);
ok("a spnutils command the snapshot holds passes, with flags", commandFinding("spnutils workspace status --json", BOTH) === null);
ok("a spnutils command that is gone is a finding naming the closest current form",
  commandFinding("spnutils workspace clock", BOTH) === "`spnutils workspace clock` is not a command the command line accepts: use `spnutils workspace clock set [options] <timezone>` (RULE.DEVEX.WORKSPACE.046)", commandFinding("spnutils workspace clock", BOTH));
ok("a spnutils command nowhere in the snapshot is refused", commandFinding("spnutils nothing here", BOTH).includes("no command of that name"));
ok("a bare spnutils shows no command", commandFinding("spnutils --version", BOTH) === null);
ok("a spnutils line in a sh fence is read", shownCommandFindings("```sh\nspnutils workspace statuss\n```", BOTH).length === 1);
ok("the real snapshot loads beside the plugin tables", loadCommandTable().some((e) => e.cli === "spnutils" && e.words.join(" ") === "workspace status"));

console.log("\n=== where a command is shown");
const md = "Text `spn-devex nothing`.\n\n```sh\n$ spn-devex docs audit check a\nnode docs.ts audit b\n```\n\n```ts\nnode docs.ts audit c\n```\n\nTry it: `spn-devex docs prose`\n";
ok("a sh fence and a Try it line are read, a ts fence is not", JSON.stringify(shownLines(md).map((l) => l.trim())) === JSON.stringify(["$ spn-devex docs audit check a", "node docs.ts audit b", "`spn-devex docs prose`"]), JSON.stringify(shownLines(md)));
const found = shownCommandFindings(md, TABLE);
ok("only the two stale ones are findings, each once", found.length === 2 && found[0].startsWith("`node docs.ts audit`") && found[1].startsWith("`spn-devex docs prose`"), found.join("|"));
ok("the same finding is raised once", shownCommandFindings("```sh\nnode docs.ts audit a\nnode docs.ts audit b\n```", TABLE).length === 1);
ok("a pre marked sh on a page is read", shownCommandFindings('<pre data-lang="sh">node docs.ts audit x</pre>', TABLE).length === 1);
ok("a pre of another language is not", shownCommandFindings('<pre data-lang="ts">node docs.ts audit x</pre>', TABLE).length === 0);

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-shown-commands` : `\n  all ${total} passed — t-shown-commands`);
process.exit(failed ? 1 : 0);
