// `restates files` — the plugin's copy of the book's templates, and what happens to a copy the book
// no longer holds. Every case builds a book folder and a plugin folder of its own in a temporary
// folder, because the workspace's own copy is current and shows no fault.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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
  ok("[MKT.SCRIPTS.94] known-bad: without `--write` an extra copy is reported as drift, and the command exits 1",
    check.code === 1 && check.said.includes("agent/hook-template.py") && /the book no longer holds/.test(check.said), check.said);
  ok("[MKT.SCRIPTS.94] the check removes nothing", existsSync(join(out, "agent", "hook-template.py")));
  ok("[MKT.SCRIPTS.94] and it names the command as `spn-devex restates files`",
    check.said.includes("spn-devex restates files") && !check.said.includes("templates-export"), check.said);

  const written = exported(book, out, true);
  ok("[MKT.SCRIPTS.94] `--write` removes the copy the book no longer holds", written.code === 0 && !existsSync(join(out, "agent", "hook-template.py")), written.said);
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

console.log(failed ? `\n  ${failed} of ${total} FAILED — restates files` : `\n  all ${total} passed — restates files`);
process.exit(failed ? 1 : 0);
