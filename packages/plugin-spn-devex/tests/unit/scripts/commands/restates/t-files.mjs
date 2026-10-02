// `restates files` — the plugin's copy of the book's templates, and what happens to a copy the book
// no longer holds. Every case builds a book folder and a plugin folder of its own in a temporary
// folder, because the workspace's own copy is current and shows no fault. The command itself writes
// into this plugin's own copies, so the cases that type it are refusals and a `check`, which write nothing.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { BOOK_TEMPLATES } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { exportTemplates } from "../../../../../src/scripts/commands/restates/files.ts";

const BASE = mkdtempSync(join(tmpdir(), "t-restates-files-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

let made = 0;
/** A book whose templates folder holds `templates`, and a plugin copy folder that holds `copies`. */
function pair(templates, copies) {
  made += 1;
  const book = join(BASE, `book-${made}`);
  const out = join(BASE, `plugin-${made}`, "templates");
  const put = (root, files) => {
    for (const [path, body] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), body, "utf8");
    }
  };
  put(join(book, BOOK_TEMPLATES), templates);
  mkdirSync(out, { recursive: true });
  put(out, copies);
  return { book, out };
}
/** One run, with what it printed. */
function exported(book, out, write) {
  const lines = [];
  const code = exportTemplates(book, out, write, (line) => lines.push(line));
  return { code, said: lines.join("\n") };
}

const BOOK = { "pages/report-template.html": "<h1>report</h1>\n", "agent/hook-template.ts": "export const hook = 1;\n" };

console.log("=== restates files — a copy the book no longer holds");
{
  // KNOWN-BAD: the book deleted `agent/hook-template.py`, and the plugin's copy still holds it.
  const { book, out } = pair(BOOK, { ...BOOK, "agent/hook-template.py": "print('hook')\n", "retired/old-template.md": "# old\n" });
  exported(book, out, true);                       // brings the two indexes current, and removes the extras
  writeFileSync(join(out, "agent", "hook-template.py"), "print('hook')\n", "utf8");
  const check = exported(book, out, false);
  ok("[MKT.SCRIPTS.94] known-bad: a check reports an extra copy as drift, and exits 1",
    check.code === 1 && check.said.includes("agent/hook-template.py") && /the book no longer holds/.test(check.said), check.said);
  ok("[MKT.SCRIPTS.94] the check removes nothing", existsSync(join(out, "agent", "hook-template.py")));
  ok("[MKT.SCRIPTS.94] and it names the command that writes, with the book after the action",
    check.said.includes("run `spn-devex restates files write <book>`"), check.said);

  const written = exported(book, out, true);
  ok("[MKT.SCRIPTS.94] a write removes the copy the book no longer holds", written.code === 0 && !existsSync(join(out, "agent", "hook-template.py")), written.said);
  ok("[MKT.SCRIPTS.94] and says how many it removed", /1 removed/.test(written.said), written.said);
  ok("[MKT.SCRIPTS.94] a folder left empty by the removal goes too", !existsSync(join(out, "retired")));
  ok("[MKT.SCRIPTS.94] the copies the book holds are still there, byte for byte",
    readFileSync(join(out, "agent", "hook-template.ts"), "utf8") === BOOK["agent/hook-template.ts"]
      && readFileSync(join(out, "pages", "report-template.html"), "utf8") === BOOK["pages/report-template.html"]);
  ok("[MKT.SCRIPTS.94] and so is the copy's own index, which the book does not hold", existsSync(join(out, "README.md")));
  const after = exported(book, out, false);
  ok("[MKT.SCRIPTS.94] after the write the check reads current", after.code === 0 && /every copy current/.test(after.said), after.said);
}

console.log("\n=== restates files — untouched");
{
  const { book, out } = pair(BOOK, {});
  exported(book, out, true);
  const stamp = statSync(join(out, "pages", "report-template.html")).mtimeMs;
  const again = exported(book, out, true);
  ok("a copy that is current is not rewritten", /0 rewritten/.test(again.said) && /0 removed/.test(again.said)
    && statSync(join(out, "pages", "report-template.html")).mtimeMs === stamp, again.said);
  ok("a copy that is behind the book is still reported by name", (() => {
    writeFileSync(join(book, BOOK_TEMPLATES, "pages", "report-template.html"), "<h1>report, changed</h1>\n", "utf8");
    const behind = exported(book, out, false);
    return behind.code === 1 && behind.said.includes("pages/report-template.html");
  })());
  const none = exported(join(BASE, "no-book-here"), out, true);
  ok("a folder that holds no book exports nothing and removes nothing",
    none.code === 0 && /no foundation book here/.test(none.said) && existsSync(join(out, "agent", "hook-template.ts")), none.said);
}

console.log("\n=== restates files — the indexes name the command that writes them");
{
  const { book, out } = pair(BOOK, {});
  exported(book, out, true);
  ok("[MKT.SCRIPTS.168] the book's index of its templates names `restates files write` as its writer",
    readFileSync(join(book, BOOK_TEMPLATES, "index.md"), "utf8").includes("**Generated by `restates files write`. Do not hand-edit.**"));
  ok("[MKT.SCRIPTS.168] and so does the index of the copies", readFileSync(join(out, "README.md"), "utf8").includes("`restates files write` writes them"));
}

console.log("\n=== restates files — the action is a word, and both actions need the book");
{
  const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
  /** `restates files` through the entry, from the folder given: what it printed, and its exit code. */
  const typed = (cwd, ...words) => {
    try { return { out: execFileSync("node", [TOOL, "restates", "files", ...words], { cwd, encoding: "utf8", stdio: "pipe", env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 }; }
    catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
  };
  // The folder the command is typed from is a repository that holds no templates, so a `write` that
  // took it for the book would find no book and change nothing.
  const here = join(BASE, "a-repository");
  mkdirSync(here, { recursive: true });
  writeFileSync(join(here, "sprepo.json"), '{"type":"GENERAL","config":null}\n', "utf8");
  const { book } = pair(BOOK, {});
  const USAGE = "usage: spn-devex restates files check <book>\n       spn-devex restates files write <book>\n";

  const none = typed(here);
  ok("[MKT.SCRIPTS.111] with no action the entry prints each usage line and says an action is owed",
    none.code === 2 && none.out === USAGE + "`restates files` needs an action.\n", none.out);
  const flag = typed(here, book, "--write");
  ok("[MKT.SCRIPTS.111] a book where the action belongs is refused, and `--write` is named as the action `write`",
    flag.code === 2 && flag.out === USAGE + "`restates files` needs an action. `--write` is the action `write`.\n", flag.out);
  const bare = typed(here, "write");
  ok("[MKT.SCRIPTS.112] `write` with no book prints its usage line and says a path is owed, with exit 2",
    bare.code === 2 && bare.out === "usage: spn-devex restates files write <book>\n`restates files write` needs a path.\n", `exit ${bare.code}\n${bare.out}`);
  const check = typed(here, "check");
  ok("[MKT.SCRIPTS.112] `check` keeps its book required too, and never takes the repository it is run from",
    check.code === 2 && check.out === "usage: spn-devex restates files check <book>\n`restates files check` needs a path.\n", `exit ${check.code}\n${check.out}`);
  const option = typed(here, "check", book, "--json");
  ok("[MKT.SCRIPTS.174] an option the command does not take is refused with exit 2", option.code === 2 && option.out.includes("does not take `--json`."), option.out);
  ok("a second book is refused with exit 2", typed(here, "write", book, book).code === 2);
  ok("and no refused run wrote the book's index", !existsSync(join(book, BOOK_TEMPLATES, "index.md")));

  const read = typed(here, "check", book);
  ok("[MKT.SCRIPTS.168] `check <book>` compares this plugin's own copies with that book, reports them behind, and exits 1",
    read.code === 1 && /behind the book/.test(read.out) && read.out.includes("run `spn-devex restates files write <book>`"), `exit ${read.code}\n${read.out}`);
  ok("[MKT.SCRIPTS.168] and `check` writes nothing: the book still has no index", !existsSync(join(book, BOOK_TEMPLATES, "index.md")));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — restates files` : `\n  all ${total} passed — restates files`);
process.exit(failed ? 1 : 0);
