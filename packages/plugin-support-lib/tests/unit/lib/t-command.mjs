// `lib/command.ts` — how a plugin command reads the words it is typed with.
//
// One grammar holds for every command: `<group> [<subject>] <action> [<path>…] [options]`. This suite
// proves the shared reading alone: the two shapes a command file exports, the words read into paths
// and options, the repository and the docs tree of a path, the scope of a run that names no path,
// the usage text, and the one telemetry line `runCommand` writes. What a command does with its words
// is that command's own suite.
//
// The cases that write telemetry point a temporary workspace (with `.spndevex/.debug/telemetry.on`)
// at the recorder, in a child process with `SPN_TELEMETRY` removed; nothing is written into a real
// workspace.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { FLAG, MANIFEST, OPTIONAL, REQUIRED, VALUE, UsageFault, actionOwed, commandWords, docsTreeOf, isSubject,
  isUsageFault, onePath, readWords, repositoryOf, scopeOf, under, usageOf } from "../../../src/lib/command.ts";
import { DEVEX, DOCS, SEAT, docsOf } from "../../../src/lib/docs-tree.ts";

const LIB = resolve(import.meta.dirname, "..", "..", "..", "src", "lib");
const PACKAGES = resolve(import.meta.dirname, "..", "..", "..", "..");
const BASE = realpathSync(mkdtempSync(join(tmpdir(), "spn-command-")));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

/** Writes the files given under one folder of the temporary base, and hands the folder back. */
function folder(name, files = {}) {
  const root = join(BASE, name);
  mkdirSync(root, { recursive: true });
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body, "utf8");
  }
  return root;
}

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};
/** What a call throws: `usage: <message>` for a usage fault, the error's name for any other, null for none. */
const faultOf = (call) => {
  try { call(); return null; }
  catch (thrown) { return isUsageFault(thrown) ? `usage: ${thrown.message}` : String(thrown?.name); }
};

const noop = () => 0;
const ACTIONS = {
  check: { describe: "report", usage: "[<path>]", run: noop },
  write: { describe: "write", usage: "<path> [--block glossary|tags]", run: noop },
};

console.log("=== a command file is a subject or an action, by what it exports");
same("a file that exports `actions` is a subject", isSubject({ describe: "d", actions: ACTIONS }), true);
same("a file that exports `run` is an action of its group", isSubject({ describe: "d", usage: "", run: noop }), false);
same("a command's words are its group, its subject and its action", commandWords("docs", "face", "check"), "docs face check");
same("a command of two words has no subject", commandWords("restates", null, "check"), "restates check");

console.log("\n=== the words after the action are read into paths and options");
{
  const options = { json: FLAG, out: VALUE, block: ["glossary", "tags"] };
  const words = readWords(["docs", "--json", "--out", "a.html", "--block=glossary", "more", "--block", "tags"], options);
  same("a word with no dash is a path, in the order typed", words.paths, ["docs", "more"]);
  same("a flag is given or not", [words.given("json"), readWords(["docs"], options).given("json")], [true, false]);
  same("a value follows its option", words.value("out"), "a.html");
  same("a filter may be typed more than once, with `=` or without it", words.values("block"), ["glossary", "tags"]);
  same("an option nobody typed has no value", [words.value("block") === "tags", readWords([], options).value("out"), readWords([], options).values("block")],
    [true, null, []]);
  same("an option the command does not declare is a usage fault",
    faultOf(() => readWords(["docs", "--check"], options)), "usage: does not take `--check`.");
  same("[MKT.SCRIPTS.115] a filter's value outside its set is a usage fault that prints the set",
    faultOf(() => readWords(["--block", "maps"], options)), "usage: takes `--block` from glossary · tags, and `maps` is none of them.");
  same("untouched: a value inside the set is read", faultOf(() => readWords(["--block", "tags"], options)), null);
  same("a value left out is a usage fault", [faultOf(() => readWords(["--out"], options)), faultOf(() => readWords(["--out", "--json"], options))],
    ["usage: needs a value after `--out`.", "usage: needs a value after `--out`."]);
  same("a value handed to a flag is a usage fault", faultOf(() => readWords(["--json=yes"], options)), "usage: takes `--json` with no value.");
  same("a command that declares no option refuses every option", faultOf(() => readWords(["--json"])), "usage: does not take `--json`.");
  same("an inherited name is no declared option", faultOf(() => readWords(["--constructor"], options)), "usage: does not take `--constructor`.");
}

console.log("\n=== a usage fault is known by its name");
{
  class UsageFaultOfAnotherBundle extends Error { constructor(message) { super(message); this.name = "UsageFault"; } }
  same("a fault thrown by this file is one", isUsageFault(new UsageFault("needs a path.")), true);
  same("a fault of the same name from another copy of the class is one too", isUsageFault(new UsageFaultOfAnotherBundle("x")), true);
  same("any other error is not", [isUsageFault(new Error("x")), isUsageFault(new TypeError("x")), isUsageFault("UsageFault")], [false, false, false]);
}

console.log("\n=== the repository and the docs tree of a path");
const REPO = folder("workspace/repo-one", {
  [MANIFEST]: "{}",
  [`${DOCS}/${SEAT.constructs}/01-core/thing.md`]: "x\n",
  "packages/part/README.md": "x\n",
});
const LOOSE = folder("workspace/loose", { [`${DOCS}/${SEAT.constructs}/thing.md`]: "x\n", "notes/page.html": "x\n" });
{
  const seatFile = join(REPO, DOCS, SEAT.constructs, "01-core", "thing.md");
  same("a repository is the nearest folder above the path that holds the manifest",
    [repositoryOf(seatFile), repositoryOf(join(REPO, "packages", "part")), repositoryOf(REPO)], [REPO, REPO, REPO]);
  same("a path that is not on disk is still read by the folders above it", repositoryOf(join(REPO, "nowhere", "yet.md")), REPO);
  same("a path in no repository has none", [repositoryOf(LOOSE), repositoryOf(join(BASE, "workspace"))], [null, null]);
  same("inside a repository the docs tree is the repository's, whatever the path",
    [docsTreeOf(seatFile), docsTreeOf(join(REPO, "packages", "part")), docsTreeOf(REPO), docsTreeOf(docsOf(REPO))].map((tree) => tree === docsOf(REPO)),
    [true, true, true, true]);
  same("a path in no repository is read as it is: the docs tree it sits in",
    [docsTreeOf(join(LOOSE, DOCS, SEAT.constructs, "thing.md")), docsTreeOf(join(LOOSE, DOCS))], [join(LOOSE, DOCS), join(LOOSE, DOCS)]);
  same("and outside any docs tree, the folder itself, or the folder a file sits in",
    [docsTreeOf(join(LOOSE, "notes")), docsTreeOf(join(LOOSE, "notes", "page.html"))], [join(LOOSE, "notes"), join(LOOSE, "notes")]);
}

console.log("\n=== the scope of a run");
{
  same("typed paths are the scope, made absolute from the caller's folder",
    scopeOf([DOCS, join(REPO, "packages")], OPTIONAL, REPO), [join(REPO, DOCS), join(REPO, "packages")]);
  same("[MKT.SCRIPTS.113] with no path, a `check` takes the repository the caller is in",
    scopeOf([], OPTIONAL, join(REPO, DOCS, SEAT.constructs)), [REPO]);
  same("[MKT.SCRIPTS.113] and where the caller is in no repository it is a usage fault that says to name one",
    faultOf(() => scopeOf([], OPTIONAL, join(BASE, "workspace"))),
    "usage: needs a path here, because the folder it is run from is in no repository. Name a repository.");
  same("[MKT.SCRIPTS.112] with no path, a `write` is a usage fault, inside a repository too",
    [faultOf(() => scopeOf([], REQUIRED, REPO)), faultOf(() => scopeOf([], REQUIRED, join(BASE, "workspace")))],
    ["usage: needs a path.", "usage: needs a path."]);
  same("untouched: a `write` that names its path has a scope", scopeOf(["docs"], REQUIRED, REPO), [join(REPO, "docs")]);
  same("a command that takes one path refuses a second", [onePath([REPO]), faultOf(() => onePath([REPO, LOOSE]))], [REPO, "usage: takes one path."]);
}

console.log("\n=== whether a file sits under a path");
{
  const tree = docsOf(REPO);
  same("a file under the path, and the path itself, are under it", [under(join(tree, "a", "b.md"), [tree]), under(tree, [tree])], [true, true]);
  same("a folder that only opens with the same letters is not", under(`${tree}-old/b.md`, [tree]), false);
  same("a file above the path is not", under(REPO, [tree]), false);
  same("any one of several paths is enough", under(join(REPO, "packages", "x.md"), [tree, join(REPO, "packages")]), true);
  same("no path holds nothing", under(tree, []), false);
}

console.log("\n=== the usage of a subject, and what the entry says where the action is left out");
{
  same("one line for each action, the first after `usage:` and the next under it",
    usageOf("spn-devex", "docs", "face", ACTIONS),
    "usage: spn-devex docs face check [<path>]\n       spn-devex docs face write <path> [--block glossary|tags]");
  same("[MKT.SCRIPTS.111] a subject typed with no action needs one", actionOwed("docs", "face", ACTIONS, []), "`docs face` needs an action.");
  same("[MKT.SCRIPTS.111] an option that spells an action is named as that action",
    actionOwed("docs", "face", ACTIONS, ["docs", "--check"]), "`docs face` needs an action. `--check` is the action `check`.");
  same("an option that spells no action is not named", actionOwed("docs", "face", ACTIONS, ["docs", "--json"]), "`docs face` needs an action.");
}

console.log("\n=== runCommand records a command once, with its words as the levels");
{
  const env = (root) => { const copy = { ...process.env, SPN_WORKSPACE: root }; delete copy.SPN_TELEMETRY; return copy; };
  /** Runs a module snippet against the library in a child process, and hands back what it printed and its exit code. */
  const child = (root, body) => {
    const source = `import { UsageFault, runCommand } from ${JSON.stringify(join(LIB, "command.ts"))};\n${body}`;
    try { return { out: execFileSync("node", ["--input-type=module", "-e", source], { env: env(root), cwd: root, encoding: "utf8", stdio: "pipe" }), code: 0 }; }
    catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status }; }
  };
  const logOf = (root) => readFileSync(join(root, DEVEX, ".debug", "telemetry", "hooks.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line));
  const levels = (line) => [line.script, line.group, line.subgroup, line.action, line.args, line.exit];

  const root = folder("recorded", { [`${DEVEX}/.debug/telemetry.on`]: "on\n" });
  const ran = child(root, `
    const code = await runCommand({ plugin: "spn-devex", group: "docs", subject: "face", action: "check", usage: "[<path>]",
      run: (args) => { console.log("ran with " + args.join(",")); return 1; } }, ["docs", "--block", "tags"]);
    process.exit(code);`);
  same("the command runs with what followed its action, and its exit code is handed back", [ran.out.trim(), ran.code], ["ran with docs,--block,tags", 1]);
  const lines = logOf(root);
  same("[MKT.SCRIPTS.116] a subject's action writes group, the subject as `subgroup`, the action, and what followed it",
    lines.filter((line) => line.group === "docs").map(levels), [["spn-devex", "docs", "face", "check", "docs --block tags", 1]]);
  same("and the whole run is one more line, `cli` › `cli`", lines.filter((line) => line.group === "cli").map((line) => [line.action, line.exit]), [["cli", 1]]);

  const two = folder("recorded-two", { [`${DEVEX}/.debug/telemetry.on`]: "on\n" });
  child(two, `
    process.exit(await runCommand({ plugin: "spn-apps", group: "coverage", subject: null, action: "check", usage: "[<path>…]",
      run: async () => 0 }, []));`);
  same("[MKT.SCRIPTS.116] a command of two words leaves `subgroup` empty, and `args` too where nothing followed",
    logOf(two).filter((line) => line.group === "coverage").map(levels), [["spn-apps", "coverage", null, "check", null, 0]]);

  const refused = folder("recorded-fault", { [`${DEVEX}/.debug/telemetry.on`]: "on\n" });
  const fault = child(refused, `
    process.exit(await runCommand({ plugin: "spn-devex", group: "docs", subject: "face", action: "write", usage: "<path> [--block glossary|tags]",
      run: () => { throw new UsageFault("needs a path."); } }, []));`);
  same("[MKT.SCRIPTS.112] a usage fault prints the command's usage line, then the fault after the command's words, and exits 2",
    [fault.out.trim(), fault.code], ["usage: spn-devex docs face write <path> [--block glossary|tags]\n`docs face write` needs a path.", 2]);
  same("and the refused run is recorded with exit 2", logOf(refused).filter((line) => line.group === "docs").map(levels),
    [["spn-devex", "docs", "face", "write", null, 2]]);

  const broken = child(folder("recorded-error", { [`${DEVEX}/.debug/telemetry.on`]: "on\n" }), `
    process.exit(await runCommand({ plugin: "spn-devex", group: "docs", subject: null, action: "audit", usage: "",
      run: () => { throw new TypeError("the command's own error"); } }, []));`);
  same("untouched: an error that is no usage fault is thrown on, never read as one",
    [broken.code !== 0 && broken.code !== 2, broken.out.includes("the command's own error"), broken.out.includes("usage:")], [true, true, false]);
}

console.log("\n=== the two plugins ship one entry");
{
  const entry = (plugin) => readFileSync(join(PACKAGES, `plugin-${plugin}`, "src", "scripts", "cli.ts"), "utf8");
  const devex = entry("spn-devex"), apps = entry("spn-apps");
  same("each entry names its own plugin", [devex.includes('const PLUGIN_NAME = "spn-devex";'), apps.includes('const PLUGIN_NAME = "spn-apps";')], [true, true]);
  same("and apart from that name the two files are the same text", devex.split("spn-devex").join("spn-apps") === apps, true);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — command` : `\n  all ${total} passed — command`);
process.exit(failed ? 1 : 0);
