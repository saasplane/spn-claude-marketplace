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
import { BOOK_PATTERNS, BOOK_SITE_PATTERNS, PLUGIN_PATTERNS, PLUGIN_SITE_PATTERNS } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { exportTemplates, PATTERNS_SET, SITE_PATTERNS_SET } from "../../../../../src/scripts/commands/restates/files.ts";

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

console.log("=== restates files — the specs of the app patterns, a flat folder with a page of the book's own");
{
  // The book's folder holds two specs and a README it writes by hand; the copy takes the specs, and its README is the index.
  made += 1;
  const book = join(BASE, `book-${made}`), out = join(BASE, `plugin-${made}`, "app-patterns"), from = join(book, BOOK_PATTERNS);
  mkdirSync(from, { recursive: true });
  writeFileSync(join(from, "find-in-a-list.dg.json"), '{"kind":"skeleton"}\n', "utf8");
  writeFileSync(join(from, "overview.dg.json"), '{"kind":"skeleton"}\n', "utf8");
  writeFileSync(join(from, "README.md"), "# The specs, by the book's own hand\n", "utf8");
  const lines = [];
  const code = exportTemplates(book, out, true, (line) => lines.push(line), PATTERNS_SET);
  ok("[MKT.SCRIPTS.176] the specs are copied, and the report counts specs", code === 0 && /^2 spec\(s\) exported/.test(lines.join("\n")), lines.join("\n"));
  ok("[MKT.SCRIPTS.176] each spec is byte-identical in the copy", readFileSync(join(out, "overview.dg.json"), "utf8") === '{"kind":"skeleton"}\n');
  const index = readFileSync(join(out, "README.md"), "utf8");
  ok("[MKT.SCRIPTS.176] the copy's README is the index, with one stamp that names the folder, and not the book's own page",
    index.includes(`"path": "spn-foundation/${BOOK_PATTERNS}"`) && index.includes("[`find-in-a-list.dg.json`](find-in-a-list.dg.json)") && !index.includes("by the book's own hand"));
  ok("[MKT.SCRIPTS.176] the book keeps its own README, and gains an index of its specs", readFileSync(join(from, "README.md"), "utf8").startsWith("# The specs, by the book") && readFileSync(join(from, "index.md"), "utf8").includes("`overview.dg.json`"));
  const bookIndex = readFileSync(join(from, "index.md"), "utf8");
  ok("[MKT.SCRIPTS.176] the book's index sits inside the docs tree, so it opens with an `spn:doc` block that holds the set's id and title",
    bookIndex.startsWith('<!-- spn:doc\n{\n  "id": "surface-standards-patterns-specs-index",\n  "title": ') && bookIndex.includes('"status": "PLANNING"') && bookIndex.includes("-->\n\n# The specs of the app patterns this book owns"), bookIndex.slice(0, 300));
  ok("[MKT.SCRIPTS.176] the block is strict JSON with the fields of a doc block", (() => {
    const block = JSON.parse(bookIndex.slice(bookIndex.indexOf("{"), bookIndex.indexOf("\n-->")));
    return ["id", "title", "lenses", "status", "summary", "keywords"].every((field) => field in block);
  })());
  ok("[MKT.SCRIPTS.176] the copy's index, outside the docs tree, carries no `spn:doc` block", !index.includes("spn:doc"));
  const again = [];
  ok("[MKT.SCRIPTS.176] a second check finds every copy current", exportTemplates(book, out, false, (line) => again.push(line), PATTERNS_SET) === 0 && /every copy current/.test(again.join("\n")), again.join("\n"));
  writeFileSync(join(from, "overview.dg.json"), '{"kind":"skeleton","title":"x"}\n', "utf8");
  const behind = [];
  ok("[MKT.SCRIPTS.176] known-bad: an edited spec is reported behind, and the check exits 1", exportTemplates(book, out, false, (line) => behind.push(line), PATTERNS_SET) === 1 && behind.join("\n").includes("overview.dg.json"), behind.join("\n"));
}

console.log("=== restates files — the specs of the site patterns, a second flat folder beside the app patterns'");
{
  // The two folders sit side by side in the book and in the surface plugin, each named by its group.
  ok("[MKT.SCRIPTS.176] the book's two folders of specs are app-patterns/ and site-patterns/, side by side",
    BOOK_PATTERNS.endsWith("/01-common/app-patterns") && BOOK_SITE_PATTERNS.endsWith("/01-common/site-patterns")
      && dirname(BOOK_PATTERNS) === dirname(BOOK_SITE_PATTERNS), `${BOOK_PATTERNS}\n        ${BOOK_SITE_PATTERNS}`);
  ok("[MKT.SCRIPTS.176] and the surface plugin's two copies take the same names, beside the surface refs",
    PLUGIN_PATTERNS === "refs/support/surface/app-patterns" && PLUGIN_SITE_PATTERNS === "refs/support/surface/site-patterns", `${PLUGIN_PATTERNS} · ${PLUGIN_SITE_PATTERNS}`);
  made += 1;
  const book = join(BASE, `book-${made}`), out = join(BASE, `plugin-${made}`, "site-patterns"), from = join(book, BOOK_SITE_PATTERNS);
  mkdirSync(from, { recursive: true });
  writeFileSync(join(from, "hero.dg.json"), '{"kind":"skeleton"}\n', "utf8");
  writeFileSync(join(from, "README.md"), "# The site specs, by the book's own hand\n", "utf8");
  // An app pattern's spec in the other folder is no site spec, and is never copied with them.
  mkdirSync(join(book, BOOK_PATTERNS), { recursive: true });
  writeFileSync(join(book, BOOK_PATTERNS, "overview.dg.json"), '{"kind":"skeleton"}\n', "utf8");
  const lines = [];
  const code = exportTemplates(book, out, true, (line) => lines.push(line), SITE_PATTERNS_SET);
  ok("[MKT.SCRIPTS.176] the site specs are copied on their own, and the report counts them", code === 0 && /^1 spec\(s\) exported/.test(lines.join("\n")) && !existsSync(join(out, "overview.dg.json")), lines.join("\n"));
  const index = readFileSync(join(out, "README.md"), "utf8");
  ok("[MKT.SCRIPTS.176] the copy's index names the site folder in its one stamp, and the site patterns in its title",
    index.includes(`"path": "spn-foundation/${BOOK_SITE_PATTERNS}"`) && index.includes("# The specs of the site patterns, as a partner has them")
      && index.includes("[`hero.dg.json`](hero.dg.json)") && !index.includes("by the book's own hand"), index.slice(0, 600));
  const bookIndex = readFileSync(join(from, "index.md"), "utf8");
  ok("[MKT.SCRIPTS.176] the book's index of the site specs has an id of its own, apart from the app specs' index",
    bookIndex.startsWith('<!-- spn:doc\n{\n  "id": "surface-standards-patterns-site-specs-index",') && bookIndex.includes("-->\n\n# The specs of the site patterns this book owns")
      && SITE_PATTERNS_SET.bookDoc.id !== PATTERNS_SET.bookDoc.id, bookIndex.slice(0, 300));
  ok("[MKT.SCRIPTS.176] no word of either set names the group by its old name",
    !/page.pattern/i.test(JSON.stringify(PATTERNS_SET.bookDoc) + JSON.stringify(SITE_PATTERNS_SET.bookDoc) + bookIndex + index
      + PATTERNS_SET.bookIndex([]).join("\n") + PATTERNS_SET.copyIndex("x", []).join("\n")));
  const again = [];
  ok("[MKT.SCRIPTS.176] a second check finds the site copy current", exportTemplates(book, out, false, (line) => again.push(line), SITE_PATTERNS_SET) === 0, again.join("\n"));
}

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
  ok("[MKT.SCRIPTS.168] the templates set declares no block, so its index opens on its heading",
    readFileSync(join(book, BOOK_TEMPLATES, "index.md"), "utf8").startsWith("# The templates this book owns\n"));
  ok("[MKT.SCRIPTS.168] and so does the index of the copies",readFileSync(join(out, "README.md"), "utf8").includes("`restates files write` writes them"));
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
