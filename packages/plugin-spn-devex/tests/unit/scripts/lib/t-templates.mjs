// The plugin's templates are the book's, copied by the build (RULE.DEVEX.WORKSPACE.490): with a book beside this checkout, every file of
// the book's `04-docs/templates/` folder is in `refs/devex/workspace/docs/templates/` byte for byte, and the build script copies, reports and
// keeps as it says. With no book beside, the copy stays as committed and the run says so.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { PLUGIN } from "../../../helpers/harness.mjs";

const { findBook } = await import("../../../../src/scripts/commands/restates/check.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 600)}` : ""}`);
};

const CHECKOUT = resolve(PLUGIN, "..", "..");
const BOOK_TEMPLATES = join("docs", "04-capabilities", "01-devex", "04-workspace", "04-docs", "templates");
const COPY = join(PLUGIN, "src", "refs", "devex", "workspace", "docs", "templates");
const filesUnder = (folder) => {
  const out = [];
  const walk = (dir) => { for (const name of readdirSync(dir).sort()) { const path = join(dir, name); if (statSync(path).isDirectory()) walk(path); else if (!name.startsWith(".")) out.push(relative(folder, path)); } };
  if (existsSync(folder)) walk(folder);
  return out;
};

console.log("=== the plugin's templates are the book's, byte for byte");
{
  const book = findBook(undefined, CHECKOUT);
  if (book === null) ok("[MKT.SCRIPTS.407] no book beside this checkout: the plugin's copy is what is committed, and there is nothing to compare", true);
  else {
    const from = join(book, BOOK_TEMPLATES);
    const files = filesUnder(from);
    const differing = files.filter((file) => !existsSync(join(COPY, file)) || !readFileSync(join(COPY, file)).equals(readFileSync(join(from, file))));
    ok("[MKT.SCRIPTS.407] every file of the book's templates folder is in the plugin's, equal byte for byte", files.length > 0 && differing.length === 0, differing.join(", "));
  }
}

console.log("\n=== the build script copies, reports and keeps");
{
  // The build script is read, not run: running it would rewrite the plugin and its bundles.
  const text = readFileSync(join(CHECKOUT, "scripts", "build-plugins.mjs"), "utf8");
  ok("[MKT.SCRIPTS.407] the build copies the book's templates folder into the plugin's, subfolders kept", /BOOK_TEMPLATES/.test(text) && /04-docs", "templates"/.test(text) && /refs", "devex", "workspace", "docs", "templates"/.test(text));
  ok("[MKT.SCRIPTS.407] it keeps the plugin's copy and says so when no book is beside the checkout", /no spn-foundation beside this checkout/.test(text) && /refs\/devex\/workspace\/docs\/templates/.test(text));
  ok("[MKT.SCRIPTS.407] a file only the plugin holds is reported, never deleted", /only in the plugin's templates, so it is kept/.test(text) && !/unlinkSync|rmSync\(join\(PLUGIN_TEMPLATES/.test(text));
}
console.log(failed ? `\n  ${failed} of ${total} FAILED — templates` : `\n  all ${total} passed — templates`);
process.exit(failed ? 1 : 0);
