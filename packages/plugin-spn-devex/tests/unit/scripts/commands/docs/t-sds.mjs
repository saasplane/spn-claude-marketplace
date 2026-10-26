// `docs sds` — cuts a version of the shared page styles, moves the pages of a folder to a version, and
// writes a copy of a page with its version's styles inside it (`05-artifacts.md` § One stylesheet,
// served in versions). Every case builds a small marketplace and a few pages in a scratch folder,
// runs the real command through `cli.ts`, and reads the files back from disk. No case reaches the
// network: a bundle reads its files from `--assets`, or from a folder beside the page.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { OWN_COPY, STYLES_ADDRESS, cutVersions } from "../../../../../../plugin-support-lib/src/lib/page-styles.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "sds-")));
process.on("exit", () => rmSync(SCRATCH, { recursive: true, force: true }));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 900)}` : ""}`);
};

const ENV = { ...process.env, SPN_TELEMETRY: "off", SPN_WORKSPACE: SCRATCH };
/** One run of `docs sds` through the entry, from a working directory, with its exit code and what it printed. */
const sdsFrom = (cwd, ...args) => {
  try { return { code: 0, out: execFileSync(process.execPath, [TOOL, "docs", "sds", ...args], { encoding: "utf8", env: ENV, stdio: "pipe", cwd }) }; }
  catch (error) { return { code: error.status ?? 1, out: String(error.stdout ?? "") + String(error.stderr ?? "") }; }
};
const sds = (...args) => sdsFrom(SCRATCH, ...args);

const put = (path, body) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  return path;
};
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
/** Every file under a folder with the hash of its bytes, as one text: two equal texts are two equal trees. */
const tree = (folder) => {
  const lines = [];
  const walk = (at) => {
    for (const name of readdirSync(at).sort()) {
      const path = join(at, name);
      if (statSync(path).isDirectory()) { lines.push(`${relative(folder, path)}/`); walk(path); }
      else lines.push(`${relative(folder, path)} ${sha(readFileSync(path))}`);
    }
  };
  walk(folder);
  return lines.join("\n");
};

// ---------------------------------------------------------------------------- the marketplace

const MARKET = join(SCRATCH, "marketplace");
const STYLES = join(MARKET, "packages", "plugin-spn-devex", "src", "styles");
const SERVED = join(MARKET, "public", "assets", "docs");
const CSS = ":root{--sds-ink:#111}\n.sds-badge{color:var(--sds-ink)}\n";
// `$&` and `$1` are what a text replacement reads as a pattern, so the script holds both.
const PAGE_JS = "document.documentElement.classList.add('sds-has-script'); const price = '$& and $1';\n";
const INDEX_JS = "document.querySelectorAll('.sds-record-name').forEach(() => {});\n";
const BUILT = { "sds-docs.css": CSS, "sds-docs.js": PAGE_JS, "sds-index.js": INDEX_JS };
for (const [name, body] of Object.entries(BUILT)) put(join(STYLES, name), body);
put(join(STYLES, "versions.json"), "{}\n");
mkdirSync(join(MARKET, "public"), { recursive: true });

// ---------------------------------------------------------------------------- the pages

const link = (version, file = "sds-docs.css") => `<link rel="stylesheet" href="${STYLES_ADDRESS}${version}/${file}">`;
const script = (version, file = "sds-docs.js") => `<script src="${STYLES_ADDRESS}${version}/${file}"></script>`;
const OWN_STYLE = "<style>\n.ledger{border:1px solid var(--sds-rule)}\n</style>";
/**
 * A page that loads one version and shows another in a sample: `loaded` is in its two lines, `shown`
 * is in its text. The `head` and the `foot` are the two lines, so a case can put anything in their place.
 */
const pageWith = (head, foot, shown) => [
  "<meta charset=\"utf-8\">", "<title>Ledger — café</title>", head, OWN_STYLE,
  "<div class=\"sds-page\"><div class=\"sds-wrap\">",
  "<h1>Ledger</h1><p class=\"sds-subtitle\">What a page links → and why.</p>\r",
  `<p>This page shows version ${shown} of <span class="sds-key">sds-docs</span>.</p>`,
  `<pre class="sds-scroll">&lt;link rel="stylesheet" href="${STYLES_ADDRESS}${shown}/sds-docs.css"&gt;`,
  `&lt;script src="${STYLES_ADDRESS}${shown}/sds-docs.js"&gt;&lt;/script&gt;</pre>`,
  "<span class=\"sds-badge sds-status sds-planning\">PLANNING</span>",
  "</div></div>", foot, "",
].join("\n");
const page = (loaded, shown = "1.0.0") => pageWith(link(loaded), script(loaded), shown);
const indexPage = (loaded) => [
  "<meta charset=\"utf-8\">", "<title>Index</title>", link(loaded),
  "<script type=\"application/json\" id=\"index-data\">{\"files\":[]}</script>",
  "<div class=\"sds-page\"><div class=\"sds-record-name\">ledger.html</div></div>", script(loaded, "sds-index.js"), "",
].join("\n");
// A page that links no shared stylesheet holds its own copy of the styles and its own class names.
const OWN_PAGE = "<meta charset=\"utf-8\">\n<title>Own</title>\n<style>\n.badge{color:red}\n.k{font-weight:600}\n</style>\n"
  + "<div class=\"page\"><span class=\"badge st planning\">PLANNING</span></div>\n<script>document.title = 'Own';</script>\n";
// Bytes that are no UTF-8 text: a page in another encoding keeps every one of them.
const otherEncoding = (loaded) => Buffer.concat([
  Buffer.from(`${link(loaded)}\n<p>caf`, "latin1"), Buffer.from([0xe9, 0xff, 0xfe, 0x0d, 0x0a]),
  Buffer.from(`</p>\n${script(loaded)}\n`, "latin1")]);

const SITE = join(SCRATCH, "site");
const LEDGER = put(join(SITE, "ledger.html"), page("1.0.0"));
const INDEX = put(join(SITE, "sub", "index.html"), indexPage("1.0.0"));
const ENCODED = put(join(SITE, "sub", "encoded.html"), otherEncoding("1.0.0"));
const BESIDE = put(join(SITE, "beside.html"), pageWith("<link rel=\"stylesheet\" href=\"../assets/sds-docs.css\">", "<script src=\"../assets/sds-docs.js\"></script>", "1.0.0"));
const OWN = put(join(SITE, "own.html"), OWN_PAGE);
const IN_MODULES = put(join(SITE, "node_modules", "package", "page.html"), page("1.0.0"));
const IN_DOT = put(join(SITE, ".cache", "page.html"), page("1.0.0"));
put(join(SITE, "notes.md"), `${link("1.0.0")}\n`);
const WORKSTREAMS = join(SCRATCH, "workspace", ".spndevex", "workstreams");
const OPEN_PAGE = put(join(WORKSTREAMS, "open", "002-ledger", "approach.html"), page("1.0.0"));
const CLOSED_PAGE = put(join(WORKSTREAMS, "closed", "001-styles", "styles-approach.html"), page("1.0.0"));
for (const [name, body] of Object.entries(BUILT)) put(join(SCRATCH, "assets", name), body);

// ---------------------------------------------------------------------------- cut

const USAGE = "usage: spn-devex docs sds cut <version> [--root <folder>]\n" +
              "       spn-devex docs sds check <version> <folder…> [--root <folder>]\n" +
              "       spn-devex docs sds repoint <version> <folder…> [--root <folder>]\n" +
              "       spn-devex docs sds bundle <page> [--assets <folder>]\n";

console.log("=== docs sds — the action is a word, and each action refuses what it does not take");
{
  const bare = sds();
  ok("[MKT.SCRIPTS.111] no action prints each usage line, says an action is owed and exits 2",
    bare.code === 2 && bare.out === `${USAGE}\`docs sds\` needs an action.\n`, bare.out);
  const unknown = sds("publish", "1.0.0");
  ok("[MKT.SCRIPTS.111] an action that does not exist is refused the same way", unknown.code === 2 && unknown.out === `${USAGE}\`docs sds\` needs an action.\n`, unknown.out);
  const asOption = sds("--check", "1.1.0", SITE);
  ok("[MKT.SCRIPTS.111] `--check` where the action belongs is named as the action `check`",
    asOption.code === 2 && asOption.out === `${USAGE}\`docs sds\` needs an action. \`--check\` is the action \`check\`.\n`, asOption.out);
  const option = sds("cut", "1.0.0", "--force", "--root", MARKET);
  ok("an option that does not exist is refused by its name, with exit 2, and cuts nothing",
    option.code === 2 && option.out === "usage: spn-devex docs sds cut <version> [--root <folder>]\n`docs sds cut` does not take `--force`.\n" && !existsSync(SERVED), option.out);
  const noVersion = sds("cut", "--root", MARKET);
  ok("`cut` with no version says a version is owed, exits 2 and cuts nothing",
    noVersion.code === 2 && noVersion.out === "usage: spn-devex docs sds cut <version> [--root <folder>]\n`docs sds cut` needs a version.\n" && !existsSync(SERVED), noVersion.out);
  const twoVersions = sds("cut", "1.0.0", "1.1.0", "--root", MARKET);
  ok("`cut` with two versions is refused with exit 2, and cuts nothing", twoVersions.code === 2 && twoVersions.out.includes("`docs sds cut` takes one version.") && !existsSync(SERVED), twoVersions.out);
  const noRoot = sds("cut", "1.0.0", "--root");
  ok("`--root` with no value after it is refused with exit 2", noRoot.code === 2 && noRoot.out.includes("needs a value after `--root`."), noRoot.out);
  const noPage = sds("bundle");
  ok("`bundle` with no page says a path is owed, and exits 2",
    noPage.code === 2 && noPage.out === "usage: spn-devex docs sds bundle <page> [--assets <folder>]\n`docs sds bundle` needs a path.\n", noPage.out);
  ok("`bundle` with two pages is refused with exit 2", sds("bundle", LEDGER, INDEX).code === 2);
}

console.log("=== docs sds cut — a version is a folder and an entry");
{
  const first = sds("cut", "1.0.0", "--root", MARKET);
  const folder = join(SERVED, "1.0.0");
  ok("[MKT.SCRIPTS.98] cut writes the three built files into the version's folder, byte for byte",
    first.code === 0 && JSON.stringify(readdirSync(folder).sort()) === JSON.stringify(Object.keys(BUILT).sort())
      && Object.entries(BUILT).every(([name, body]) => readFileSync(join(folder, name), "utf8") === body), first.out);
  ok("[MKT.SCRIPTS.98] cut prints the folder it wrote", first.out.includes(folder), first.out);
  const listed = cutVersions(STYLES);
  ok("[MKT.SCRIPTS.98] cut lists the version in versions.json, with the sha256 of each file, in the served order",
    JSON.stringify(listed) === JSON.stringify({ "1.0.0": { "sds-docs.css": sha(CSS), "sds-docs.js": sha(PAGE_JS), "sds-index.js": sha(INDEX_JS) } }),
    JSON.stringify(listed));
  ok("[MKT.SCRIPTS.98] versions.json is written in two spaces and ends with a new line",
    readFileSync(join(STYLES, "versions.json"), "utf8") === `${JSON.stringify(listed, null, 2)}\n`);

  writeFileSync(join(STYLES, "sds-docs.css"), `${CSS}.sds-tone-blue{color:blue}\n`);
  const second = sdsFrom(join(MARKET, "packages", "plugin-spn-devex"), "cut", "1.1.0");
  const both = cutVersions(STYLES);
  ok("[MKT.SCRIPTS.98] with no --root the marketplace is found above the working directory, and the next version joins the list",
    second.code === 0 && JSON.stringify(Object.keys(both)) === JSON.stringify(["1.0.0", "1.1.0"])
      && readFileSync(join(SERVED, "1.1.0", "sds-docs.css"), "utf8") === `${CSS}.sds-tone-blue{color:blue}\n`
      && both["1.1.0"]["sds-docs.css"] === sha(`${CSS}.sds-tone-blue{color:blue}\n`), second.out);
  ok("[MKT.SCRIPTS.98] a version that exists keeps its bytes and its entry when the next one is cut",
    readFileSync(join(folder, "sds-docs.css"), "utf8") === CSS && both["1.0.0"]["sds-docs.css"] === sha(CSS));
}

console.log("=== docs sds cut — what it refuses");
{
  writeFileSync(join(STYLES, "sds-docs.js"), `${PAGE_JS}// a change after the cut\n`);
  const before = tree(MARKET);
  const again = sds("cut", "1.0.0", "--root", MARKET);
  ok("[MKT.SCRIPTS.99] a version that exists is refused with exit 1, and the refusal names its folder",
    again.code === 1 && again.out.includes(join(SERVED, "1.0.0")) && again.out.includes("refused"), again.out);
  ok("[MKT.SCRIPTS.99] the refused cut changes no file of the marketplace", tree(MARKET) === before);

  const listedOnly = { ...cutVersions(STYLES), "2.0.0": { "sds-docs.css": "0" } };
  writeFileSync(join(STYLES, "versions.json"), `${JSON.stringify(listedOnly, null, 2)}\n`);
  const beforeListed = tree(MARKET);
  const entry = sds("cut", "2.0.0", "--root", MARKET);
  ok("[MKT.SCRIPTS.99] a version the list holds is refused though its folder is missing, and nothing is written",
    entry.code === 1 && entry.out.includes(join(SERVED, "2.0.0")) && tree(MARKET) === beforeListed, entry.out);
  delete listedOnly["2.0.0"];
  writeFileSync(join(STYLES, "versions.json"), `${JSON.stringify(listedOnly, null, 2)}\n`);

  put(join(SERVED, "3.0.0", "sds-docs.css"), "a folder the list does not hold\n");
  const beforeFolder = tree(MARKET);
  const folderOnly = sds("cut", "3.0.0", "--root", MARKET);
  ok("[MKT.SCRIPTS.99] a version whose folder is there is refused though the list does not hold it, and nothing is written",
    folderOnly.code === 1 && folderOnly.out.includes(`exists at \`${join(SERVED, "3.0.0")}\``) && tree(MARKET) === beforeFolder, folderOnly.out);
  rmSync(join(SERVED, "3.0.0"), { recursive: true });

  const beforeNames = tree(MARKET);
  for (const name of ["1.2", "v1.2.0", "1.2.0-beta", "../1.2.0", "latest"]) {
    const refused = sds("cut", name, "--root", MARKET);
    ok(`a version that is not three numbers is refused and nothing is written: ${name}`,
      refused.code === 1 && refused.out.includes("three numbers") && tree(MARKET) === beforeNames, refused.out);
  }

  const elsewhere = join(SCRATCH, "elsewhere");
  mkdirSync(elsewhere, { recursive: true });
  const named = sds("cut", "1.2.0", "--root", elsewhere);
  ok("a folder that is not the marketplace is refused and nothing is written into it",
    named.code === 1 && named.out.includes("not the marketplace") && readdirSync(elsewhere).length === 0, named.out);
  const stood = sdsFrom(elsewhere, "cut", "1.2.0");
  ok("a working directory with no marketplace above it is refused and nothing is written",
    stood.code === 1 && stood.out.includes("not the marketplace") && readdirSync(elsewhere).length === 0 && tree(MARKET) === beforeNames, stood.out);

  rmSync(join(STYLES, "sds-index.js"));
  const beforeMissing = tree(MARKET);
  const missing = sds("cut", "1.2.0", "--root", MARKET);
  ok("a built file that is missing is refused by name, and no part of the version is written",
    missing.code === 1 && missing.out.includes("refused: ") && missing.out.includes("holds no `sds-index.js`") && tree(MARKET) === beforeMissing && !existsSync(join(SERVED, "1.2.0")), missing.out);
  writeFileSync(join(STYLES, "sds-index.js"), INDEX_JS);
}

// ---------------------------------------------------------------------------- repoint

console.log("=== docs sds repoint — what it refuses");
{
  const before = `${tree(SITE)}\n${tree(WORKSTREAMS)}`;
  const never = sds("repoint", "9.9.9", SITE, WORKSTREAMS, "--root", MARKET);
  ok("[MKT.SCRIPTS.101] a version nobody cut is refused with exit 1, naming it and the versions that exist",
    never.code === 1 && never.out.includes("9.9.9") && never.out.includes("1.0.0, 1.1.0"), never.out);
  ok("[MKT.SCRIPTS.101] the refused move changes no page", `${tree(SITE)}\n${tree(WORKSTREAMS)}` === before);
  const ownList = sds("repoint", "9.9.9", SITE);
  ok("[MKT.SCRIPTS.101] with no --root the list is the plugin's own, and a version it does not hold is refused",
    ownList.code === 1 && ownList.out.includes("9.9.9") && ownList.out.includes("versions that exist") && `${tree(SITE)}\n${tree(WORKSTREAMS)}` === before,
    ownList.out);
  const noFolder = sds("repoint", "1.1.0", SITE, join(SCRATCH, "no-such-folder"), "--root", MARKET);
  ok("a folder that is not there is refused before any page is changed",
    noFolder.code === 1 && noFolder.out.includes("no-such-folder") && `${tree(SITE)}\n${tree(WORKSTREAMS)}` === before, noFolder.out);
  const noPages = sds("repoint", "1.1.0", "--root", MARKET);
  ok("[MKT.SCRIPTS.112] a move that names no folder prints its usage line, says a path is owed and exits 2",
    noPages.code === 2 && noPages.out === "usage: spn-devex docs sds repoint <version> <folder…> [--root <folder>]\n`docs sds repoint` needs a path.\n", noPages.out);
  const noLook = sds("check", "1.1.0", "--root", MARKET);
  ok("[MKT.SCRIPTS.134] `check` that names no folder is refused the same way, because a look is of the folders it is given",
    noLook.code === 2 && noLook.out === "usage: spn-devex docs sds check <version> <folder…> [--root <folder>]\n`docs sds check` needs a path.\n", noLook.out);
  const withOption = sds("repoint", "1.1.0", SITE, "--check", "--root", MARKET);
  ok("`repoint` does not take `--check`: the look is the action `check`, and the refused run changes no page",
    withOption.code === 2 && withOption.out.includes("`docs sds repoint` does not take `--check`.") && `${tree(SITE)}\n${tree(WORKSTREAMS)}` === before, withOption.out);
  const neverLook = sds("check", "9.9.9", SITE, "--root", MARKET);
  ok("[MKT.SCRIPTS.134] `check` refuses a version nobody cut as `repoint` does, with exit 1",
    neverLook.code === 1 && neverLook.out.includes("docs sds check — refused") && neverLook.out.includes("9.9.9"), neverLook.out);
}

console.log("=== docs sds repoint — the version changes, and no other byte");
{
  const before = tree(SITE);
  const dry = sds("check", "1.1.0", SITE, "--root", MARKET);
  ok("[MKT.SCRIPTS.134] `check` prints each page a move would change and the count, exits 0 and writes nothing",
    dry.code === 0 && dry.out.includes(`would move  ${LEDGER}`) && dry.out.includes("3 pages would move to 1.1.0") && tree(SITE) === before, dry.out);

  const moved = sds("repoint", "1.1.0", SITE, "--root", MARKET);
  ok("[MKT.SCRIPTS.100] repoint rewrites the version in both lines of a page, and no other byte",
    moved.code === 0 && readFileSync(LEDGER).equals(Buffer.from(page("1.1.0", "1.0.0"))), readFileSync(LEDGER, "utf8"));
  ok("[MKT.SCRIPTS.100] the two lines shown as a sample in the page's text keep the version they show",
    readFileSync(LEDGER, "utf8").includes(`&lt;link rel="stylesheet" href="${STYLES_ADDRESS}1.0.0/sds-docs.css"&gt;`)
      && readFileSync(LEDGER, "utf8").includes("shows version 1.0.0"));
  ok("[MKT.SCRIPTS.100] the index's page moves its stylesheet and its own script", readFileSync(INDEX, "utf8") === indexPage("1.1.0"), readFileSync(INDEX, "utf8"));
  ok("[MKT.SCRIPTS.100] a page in another encoding keeps every byte the move does not name", readFileSync(ENCODED).equals(otherEncoding("1.1.0")));
  ok("[MKT.SCRIPTS.100] repoint prints each page it changed and the count",
    [LEDGER, INDEX, ENCODED].every((path) => moved.out.includes(`moved  ${path}`)) && moved.out.includes("3 pages moved to 1.1.0"), moved.out);
  ok("a page that links a folder beside it is left as it is", readFileSync(BESIDE, "utf8").includes("href=\"../assets/sds-docs.css\"") && !moved.out.includes(BESIDE));
  ok("a page that links no shared stylesheet is left as it is", readFileSync(OWN, "utf8") === OWN_PAGE && !moved.out.includes(OWN));
  ok("a page under node_modules is not read", readFileSync(IN_MODULES, "utf8") === page("1.0.0") && !moved.out.includes(IN_MODULES));
  ok("a page under a folder whose name starts with a dot is not read", readFileSync(IN_DOT, "utf8") === page("1.0.0") && !moved.out.includes(IN_DOT));
  ok("a file that is no .html page is not read", readFileSync(join(SITE, "notes.md"), "utf8") === `${link("1.0.0")}\n`);

  const after = tree(SITE);
  const again = sds("repoint", "1.1.0", SITE, "--root", MARKET);
  ok("a second move to the same version changes nothing and says the pages are there",
    again.code === 0 && again.out.includes("0 pages moved to 1.1.0") && again.out.includes("3 already there") && tree(SITE) === after, again.out);

  const streams = sds("repoint", "1.1.0", WORKSTREAMS, "--root", MARKET);
  ok("a page of an open workstream moves", streams.code === 0 && readFileSync(OPEN_PAGE, "utf8") === page("1.1.0", "1.0.0"), streams.out);
  ok("a page under a workstream's closed/ folder is never changed",
    readFileSync(CLOSED_PAGE, "utf8") === page("1.0.0") && !streams.out.includes(CLOSED_PAGE) && streams.out.includes("1 page moved to 1.1.0"), streams.out);
  const closedOnly = sds("repoint", "1.1.0", join(WORKSTREAMS, "closed", "001-styles"), CLOSED_PAGE, "--root", MARKET);
  ok("the closed/ folder named itself, or a page inside it, is still left as it is",
    closedOnly.code === 0 && readFileSync(CLOSED_PAGE, "utf8") === page("1.0.0") && closedOnly.out.includes("0 pages moved"), closedOnly.out);

  const back = sds("repoint", "1.0.0", LEDGER, "--root", MARKET);
  ok("a page named by its own path moves, and a move back restores its first bytes",
    back.code === 0 && readFileSync(LEDGER, "utf8") === page("1.0.0") && back.out.includes("1 page moved to 1.0.0"), back.out);
  sds("repoint", "1.1.0", LEDGER, "--root", MARKET);
}

// ---------------------------------------------------------------------------- bundle

console.log("=== docs sds bundle — a copy that carries its styles inside it");
const ASSETS = join(SERVED, "1.1.0");
const CUT_CSS = readFileSync(join(ASSETS, "sds-docs.css"), "utf8");
const LOADS_SHARED = /<link\b[^>]*sds-docs\.css|<script\b[^>]*\bsrc="[^"]*sds-(?:docs|index)\.js"/;
{
  const source = readFileSync(LEDGER, "utf8");
  const made = sds("bundle", LEDGER, "--assets", ASSETS);
  const target = join(SITE, "ledger.bundled.html");
  const bundled = existsSync(target) ? readFileSync(target, "utf8") : "";
  ok("[MKT.SCRIPTS.102] bundle writes <name>.bundled.html beside the page and prints it", made.code === 0 && existsSync(target) && made.out.includes(target), made.out);
  ok("[MKT.SCRIPTS.102] the copy holds its version's stylesheet in a style element and its script in a script element",
    bundled.includes(`<style>\n${CUT_CSS}</style>`) && bundled.includes(`<script>\n${PAGE_JS}</script>`), bundled);
  ok("[MKT.SCRIPTS.102] the copy loads nothing from the address, and from no other place", !LOADS_SHARED.test(bundled), bundled);
  ok("[MKT.SCRIPTS.102] the page's own style block is kept, after the shared styles",
    bundled.includes(OWN_STYLE) && bundled.indexOf(OWN_STYLE) > bundled.indexOf(CUT_CSS));
  ok("[MKT.SCRIPTS.102] every other byte of the page stays as it is",
    bundled === pageWith(`<style>\n${CUT_CSS}</style>`, `<script>\n${PAGE_JS}</script>`, "1.0.0"), bundled);
  ok("[MKT.SCRIPTS.102] a pattern such as $& inside a script reaches the copy as it is written", bundled.includes("const price = '$& and $1';"));
  ok("[MKT.SCRIPTS.102] the stored page keeps its two lines", readFileSync(LEDGER, "utf8") === source);

  const index = sds("bundle", INDEX, "--assets", ASSETS);
  const indexCopy = readFileSync(join(SITE, "sub", "index.bundled.html"), "utf8");
  ok("[MKT.SCRIPTS.102] the index's copy holds the index's script, and its data block stays as it is",
    index.code === 0 && indexCopy.includes(`<script>\n${INDEX_JS}</script>`) && !indexCopy.includes(PAGE_JS)
      && indexCopy.includes("<script type=\"application/json\" id=\"index-data\">{\"files\":[]}</script>") && !LOADS_SHARED.test(indexCopy), index.out);

  const beside = sds("bundle", BESIDE);
  const besideCopy = existsSync(join(SITE, "beside.bundled.html")) ? readFileSync(join(SITE, "beside.bundled.html"), "utf8") : "";
  ok("[MKT.SCRIPTS.102] a page that links a folder beside it reads its files from that folder",
    beside.code === 0 && besideCopy === pageWith(`<style>\n${CSS}</style>`, `<script>\n${PAGE_JS}</script>`, "1.0.0"), beside.out);

  // The workspace of every run is the scratch folder, so its marketplace checkout is a folder of this suite.
  for (const name of Object.keys(BUILT)) put(join(SCRATCH, "spn-claude-marketplace", "public", "assets", "docs", "1.1.0", name), readFileSync(join(ASSETS, name)));
  const stored = put(join(SCRATCH, "stored", "ledger.html"), page("1.1.0"));
  const checkout = sds("bundle", stored);
  ok("[MKT.SCRIPTS.102] with no --assets a page of a served version reads it from the marketplace's checkout in the workspace",
    checkout.code === 0 && checkout.out.includes(join(SCRATCH, "spn-claude-marketplace", "public", "assets", "docs", "1.1.0"))
      && readFileSync(join(SCRATCH, "stored", "ledger.bundled.html"), "utf8") === pageWith(`<style>\n${CUT_CSS}</style>`, `<script>\n${PAGE_JS}</script>`, "1.0.0"),
    checkout.out);

  put(join(SCRATCH, "closing", "sds-docs.css"), ".sds-note::after{content:\"</style>\"}");
  put(join(SCRATCH, "closing", "sds-docs.js"), "const text = '</script>';");
  const closing = sds("bundle", LEDGER, "--assets", join(SCRATCH, "closing"));
  const closingCopy = readFileSync(target, "utf8");
  ok("a closing tag inside a shared file closes nothing in the copy, and a second bundle replaces the first copy",
    closing.code === 0 && closingCopy.includes("content:\"<\\/style>\"}\n</style>") && closingCopy.includes("const text = '<\\/script>';\n</script>")
      && closingCopy.split("</style>").length === 3 && closingCopy.split("</script>").length === 2, closingCopy);
}

console.log("=== docs sds bundle — what it refuses");
{
  const own = sds("bundle", OWN, "--assets", ASSETS);
  ok("[MKT.SCRIPTS.103] a page that links no shared stylesheet is refused with exit 1, in the words every command uses",
    own.code === 1 && own.out.includes(OWN_COPY) && own.out.includes("links no shared stylesheet"), own.out);
  ok("[MKT.SCRIPTS.103] the refused bundle writes nothing", !existsSync(join(SITE, "own.bundled.html")) && readFileSync(OWN, "utf8") === OWN_PAGE);

  const lone = put(join(SCRATCH, "lone", "ledger.html"), page("1.1.0"));
  const empty = join(SCRATCH, "empty");
  mkdirSync(empty, { recursive: true });
  const unread = sds("bundle", lone, "--assets", empty);
  ok("a version whose files cannot be read is refused with exit 1, naming the version and the file",
    unread.code === 1 && unread.out.includes("version 1.1.0") && unread.out.includes("sds-docs.css") && unread.out.includes(empty), unread.out);
  ok("the refused bundle writes no copy", JSON.stringify(readdirSync(join(SCRATCH, "lone"))) === JSON.stringify(["ledger.html"]));
  put(join(SCRATCH, "half", "sds-docs.css"), CSS);
  const half = sds("bundle", lone, "--assets", join(SCRATCH, "half"));
  ok("a version with its stylesheet and no script is refused whole, and no copy is written",
    half.code === 1 && half.out.includes("sds-docs.js") && JSON.stringify(readdirSync(join(SCRATCH, "lone"))) === JSON.stringify(["ledger.html"]), half.out);

  const other = put(join(SCRATCH, "lone", "other.html"), pageWith("<link rel=\"stylesheet\" href=\"https://example.com/styles/sds-docs.css\">", "", "1.0.0"));
  const foreign = sds("bundle", other);
  ok("a page that links its stylesheet from another address is refused, and nothing is fetched from it",
    foreign.code === 1 && foreign.out.includes("not the served address") && !existsSync(join(SCRATCH, "lone", "other.bundled.html")), foreign.out);

  const copy = sds("bundle", join(SITE, "ledger.bundled.html"), "--assets", ASSETS);
  ok("a bundled copy is refused as a page to bundle", copy.code === 1 && copy.out.includes("bundled copy") && !existsSync(join(SITE, "ledger.bundled.bundled.html")), copy.out);
  const absent = sds("bundle", join(SITE, "no-such-page.html"), "--assets", ASSETS);
  ok("a page that is not there is refused", absent.code === 1 && absent.out.includes("not a file"), absent.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-sds` : `\n  all ${total} passed — t-sds`);
process.exit(failed ? 1 : 0);
