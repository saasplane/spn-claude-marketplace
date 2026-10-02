// `lib/docs-tree.ts` — the docs layout stated once, and the check that no other script spells it.
//
// The helpers are proved on paths built from the module's own names, so a folder the book moves is
// one edit in the module and none here. The check reads every literal under each plugin's
// `src/scripts/`, and under this folder's own `src/lib/`, with the comments dropped: a comment may
// cite a chapter's path, and code may not build one by hand. The module is the one file exempt.
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { layoutLiterals, literalsOf, scanTree } from "../../helpers/layout-literals.mjs";
import * as tree from "../../../src/lib/docs-tree.ts";

// `tests/` SITS BESIDE `src/`, and this folder beside the plugins, so both are found by walking up.
const HERE = resolve(import.meta.dirname, "..", "..", "..");
const PACKAGES = resolve(HERE, "..");
const MODULE = "docs-tree.ts";

const { SEAT, SEATS, POCKET, ARTIFACT, ARTIFACT_FOLDERS, CONSTRUCT_PAGES, TEMPLATES, WORKSTREAMS, DOCS } = tree;

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

// What the check refuses, read from the module rather than typed here.
const NAMES = {
  numbered: [...SEATS],
  distinctive: [...Object.values(POCKET), WORKSTREAMS],
  common: [CONSTRUCT_PAGES, ARTIFACT.reports, TEMPLATES],
};

// A probe repository in a temporary workspace. Nothing here is read from disk; the paths only have
// to be shaped the way the module says a docs tree is.
const ROOT = "/probe-workspace";
const REPO = join(ROOT, "probe-repo");
const DOCS_TREE = tree.docsOf(REPO);
const SEAT_FILE = join(tree.constructsDir(DOCS_TREE), "01-domain", "02-thing.md");
// The pocket's `docs` folder, and one domain's folder in it, named as the domain's seat folder is.
const POCKET_DOCS = join(DOCS_TREE, POCKET.artifacts, ARTIFACT.docs);
const DOMAIN = join(POCKET_DOCS, "01-domain");
const PAGE = join(DOMAIN, CONSTRUCT_PAGES, `02-thing${tree.CONSTRUCT_PAGE_SUFFIX}`);
const OVERVIEW = join(DOMAIN, `domain${tree.OVERVIEW_PAGE_SUFFIX}`);

console.log("=== the tree — seats, pockets and the pages between them");
same("the seats are five, in reading order", SEATS, [SEAT.purpose, SEAT.constructs, SEAT.behaviors, SEAT.capabilities, SEAT.guides]);
same("each seat folder sits directly in the docs tree",
  Object.keys(SEAT).map((seat) => tree.seatDir(DOCS_TREE, seat)), SEATS.map((name) => join(DOCS_TREE, name)));
same("the decisions register sits in the registers pocket",
  tree.decisionsRegister(DOCS_TREE), join(DOCS_TREE, POCKET.registers, tree.DECISIONS));
same("the pocket holds the folders docs, guides and reports, and the index sits beside them",
  [ARTIFACT_FOLDERS, tree.artifactIndex(DOCS_TREE)],
  [[ARTIFACT.docs, ARTIFACT.guides, ARTIFACT.reports], join(DOCS_TREE, POCKET.artifacts, tree.ARTIFACT_INDEX)]);
same("the hub sits directly in the docs folder of the artifacts pocket", tree.hubPage(DOCS_TREE), join(POCKET_DOCS, tree.HUB));
same("a domain's folder in the pocket is named as its seat folder, and the seat itself gives the pocket's docs folder",
  [join(tree.constructsDir(DOCS_TREE), "01-area", "02-domain"), `${tree.constructsDir(DOCS_TREE)}/`, tree.behaviorsDir(DOCS_TREE)].map(tree.domainDirOf),
  [join(POCKET_DOCS, "01-area", "02-domain"), POCKET_DOCS, null]);
same("[MKT.SCRIPTS.110] a seat file is produced as a page in the constructs folder of its domain's folder",
  tree.producedPageOf(SEAT_FILE), PAGE);
same("[MKT.SCRIPTS.110] a seat file two folders deep keeps both folders, and the constructs folder comes last",
  tree.producedPageOf(join(tree.constructsDir(DOCS_TREE), "01-area", "02-domain", "03-thing.md")),
  join(POCKET_DOCS, "01-area", "02-domain", CONSTRUCT_PAGES, `03-thing${tree.CONSTRUCT_PAGE_SUFFIX}`));
same("[MKT.SCRIPTS.110] and the page finds its seat file by path alone", tree.seatOf(PAGE), SEAT_FILE);
same("a path that is no construct page is given back as it is", tree.seatOf(OVERVIEW), OVERVIEW);
same("a seat file is a construct .md that is not a face",
  [SEAT_FILE, join(tree.constructsDir(DOCS_TREE), tree.FACE), join(tree.behaviorsDir(DOCS_TREE), "01-domain", "02-thing.md")].map(tree.isSeatFile),
  [true, false, false]);
// The same two file names, each in the other's place: the place decides, and the name alone does not.
const CONSTRUCT_BESIDE_OVERVIEWS = join(DOMAIN, `02-thing${tree.CONSTRUCT_PAGE_SUFFIX}`);
const OVERVIEW_IN_CONSTRUCTS = join(DOMAIN, CONSTRUCT_PAGES, `domain${tree.OVERVIEW_PAGE_SUFFIX}`);
// A folder of the pocket that is not in its set, holding pages of both names.
const STRAY = join(DOCS_TREE, POCKET.artifacts, "probe-stray");
const STRAY_PAGES = [join(STRAY, `domain${tree.OVERVIEW_PAGE_SUFFIX}`), join(STRAY, "01-domain", `02-thing${tree.CONSTRUCT_PAGE_SUFFIX}`)];
same("[MKT.SCRIPTS.110] a construct page ends -construct.html in a constructs folder under the pocket's docs folder",
  [PAGE, SEAT_FILE, CONSTRUCT_BESIDE_OVERVIEWS, OVERVIEW_IN_CONSTRUCTS, ...STRAY_PAGES].map(tree.isProducedPage),
  [true, false, false, false, false, false]);
same("[MKT.SCRIPTS.110] an overview ends -overview.html under the pocket's docs folder, in no constructs folder",
  [OVERVIEW, tree.hubPage(DOCS_TREE), join(POCKET_DOCS, `beside${tree.OVERVIEW_PAGE_SUFFIX}`), join(DOMAIN, "notes.md"), PAGE,
   OVERVIEW_IN_CONSTRUCTS, CONSTRUCT_BESIDE_OVERVIEWS, ...STRAY_PAGES].map(tree.isOverview),
  [true, true, true, false, false, false, false, false, false]);
same("[MKT.SCRIPTS.110] a page in its place belongs nowhere else, and neither does a file of another kind",
  [PAGE, OVERVIEW, tree.hubPage(DOCS_TREE), join(DOMAIN, "notes.md"), SEAT_FILE].map(tree.pagePlaceOf), [null, null, null, null, null]);
const POCKET_DOCS_NAMED = [DOCS, POCKET.artifacts, ARTIFACT.docs].join("/");
same("[MKT.SCRIPTS.110] a construct page out of its place is told its domain's constructs folder",
  [CONSTRUCT_BESIDE_OVERVIEWS, join(DOCS_TREE, POCKET.artifacts, CONSTRUCT_PAGES, "01-area", "02-domain", `03-thing${tree.CONSTRUCT_PAGE_SUFFIX}`),
   STRAY_PAGES[1]].map(tree.pagePlaceOf),
  [`${POCKET_DOCS_NAMED}/01-domain/${CONSTRUCT_PAGES}/02-thing${tree.CONSTRUCT_PAGE_SUFFIX}`,
   `${POCKET_DOCS_NAMED}/01-area/02-domain/${CONSTRUCT_PAGES}/03-thing${tree.CONSTRUCT_PAGE_SUFFIX}`,
   `${POCKET_DOCS_NAMED}/<domain>/${CONSTRUCT_PAGES}/02-thing${tree.CONSTRUCT_PAGE_SUFFIX}`]);
same("[MKT.SCRIPTS.110] an overview out of its place is told the hub's folder and a domain's folder",
  [OVERVIEW_IN_CONSTRUCTS, STRAY_PAGES[0]].map(tree.pagePlaceOf),
  Array(2).fill(`${POCKET_DOCS_NAMED}/domain${tree.OVERVIEW_PAGE_SUFFIX} beside the hub, or ${POCKET_DOCS_NAMED}/<domain>/domain${tree.OVERVIEW_PAGE_SUFFIX}`));
same("[MKT.SCRIPTS.110] the hub out of its place is told the one place a hub sits in",
  tree.pagePlaceOf(join(STRAY, tree.HUB)), `${POCKET_DOCS_NAMED}/${tree.HUB}`);
same("the path under the pocket's docs folder is one part for each folder, and null outside it",
  [PAGE, tree.hubPage(DOCS_TREE), STRAY_PAGES[0], SEAT_FILE].map(tree.artifactDocsPathOf),
  [["01-domain", CONSTRUCT_PAGES, `02-thing${tree.CONSTRUCT_PAGE_SUFFIX}`], [tree.HUB], null, null]);
same("a register is a .md in the registers pocket that is not its face",
  [tree.decisionsRegister(DOCS_TREE), join(tree.registersDir(DOCS_TREE), tree.FACE)].map(tree.isRegister), [true, false]);
same("a construct's behaviours file mirrors its path",
  tree.mirrorPath(SEAT_FILE, "constructs", "behaviors"), join(tree.behaviorsDir(DOCS_TREE), "01-domain", "02-thing.md"));
same("a path outside the seat mirrors nothing", tree.mirrorPath(join(DOCS_TREE, tree.FACE), "constructs", "behaviors"), null);
same("splitting at a seat gives the tree above and the path inside",
  tree.splitAtSeat(SEAT_FILE, "constructs"), { docs: DOCS_TREE, rel: join("01-domain", "02-thing.md") });
same("the docs root of a seat file, a page, and a face at the tree's top level",
  [SEAT_FILE, PAGE, join(DOCS_TREE, tree.FACE)].map(tree.docsRootOf), [DOCS_TREE, DOCS_TREE, DOCS_TREE]);
same("a file outside any docs tree has none", tree.docsRootOf(join(REPO, "src", "index.ts")), null);
same("the book's templates sit in its capabilities seat",
  tree.bookTemplatesDir(join(ROOT, "book")).startsWith(join(ROOT, "book", DOCS, SEAT.capabilities)) && tree.bookTemplatesDir(join(ROOT, "book")).endsWith(`/${TEMPLATES}`),
  true);
// A folder the pocket's fixed set does not name; the check reads the set, so any name will do.
const NOT_A_POCKET_FOLDER = "probe-folder";
same("a file names the pocket folder it sits in, and a folder outside the set is not in it",
  [tree.artifactFolderOf(PAGE), tree.artifactFolderOf(join(tree.artifactsDir(DOCS_TREE), NOT_A_POCKET_FOLDER, "x.md")),
   ARTIFACT_FOLDERS.includes(NOT_A_POCKET_FOLDER)], [ARTIFACT.docs, NOT_A_POCKET_FOLDER, false]);
same("a file at the pocket's top level, or outside the pocket, sits in no pocket folder",
  [tree.artifactFolderOf(join(tree.artifactsDir(DOCS_TREE), tree.FACE)), tree.artifactFolderOf(SEAT_FILE)], [null, null]);

console.log("\n=== the workstreams");
const WORKSTREAM = join(tree.workstreamsDir(ROOT, "open"), "041-probe");
same("a workstream folder sits under its state", tree.workstreamsDir(ROOT, "backlog"), join(ROOT, ".spndevex", WORKSTREAMS, "backlog"));
same("a path inside a workstream names it",
  tree.workstreamDirOf(join(WORKSTREAM, tree.ARCS, "N1-probe.md")), { folder: WORKSTREAM, name: "041-probe" });
same("and the container's older name still reads",
  tree.workstreamDirOf(join(tree.legacyWorkstreamsDir(ROOT, "closed"), "002-old", "page.html"))?.name, "002-old");
same("a path outside one names none", tree.workstreamDirOf(SEAT_FILE), null);
same("an arc file is an .md directly under arcs/",
  [join(WORKSTREAM, tree.ARCS, "N1-probe.md"), join(WORKSTREAM, tree.ARCS, "deep", "N1.md"), join(WORKSTREAM, "notes.md")].map(tree.isArcFile),
  [true, false, false]);
same("an approach page is a workstream's approach.html, or a page with the approach suffix",
  [join(WORKSTREAM, tree.APPROACH_PAGE), join(WORKSTREAM, `probe${tree.APPROACH_SUFFIX}`), join(WORKSTREAM, "approach.md"),
   join(WORKSTREAM, "preapproach.html")].map(tree.isApproachPage),
  [true, true, false, false]);
same("the arc pattern reads a command that names one",
  tree.arcPathPattern(false).test(`cat ${join(WORKSTREAM, tree.ARCS, "N1-probe.md")} | head`), true);

console.log("\n=== the check — no script spells the layout");
const line = (source) => layoutLiterals(source, NAMES).map((hit) => hit.name);
same("known-bad: a seat in a string is caught", line(`const x = join(repo, "docs", "${SEAT.constructs}");`), [SEAT.constructs]);
same("known-bad: a pocket path in a template chunk is caught",
  line("const x = `${repo}/docs/" + POCKET.artifacts + "/" + ARTIFACT.reports + "/${name}`;"), [POCKET.artifacts, ARTIFACT.reports]);
same("known-bad: a regular expression spelling the container is caught",
  line(`const re = /\\/${WORKSTREAMS}\\/[^/]+\\/;`), [WORKSTREAMS]);
same("known-bad: a common word beside a slash is caught",
  line(`const x = "${POCKET.artifacts}-free/${CONSTRUCT_PAGES}/";`), [CONSTRUCT_PAGES]);
same("a comment citing a chapter is prose, not a path",
  line(`// RESTATES: spn-foundation docs/${SEAT.capabilities}/01-devex/03-tree.md\n/* ${POCKET.artifacts}/${ARTIFACT.reports} */\nconst x = 1;`), []);
same("a region named like a folder, with no slash, is not a folder", line(`replaceRegion(text, "${CONSTRUCT_PAGES}", body);`), []);
same("substitutions are code, so a constant inside one is not a literal",
  literalsOf("const p = `${SEAT.constructs}/x`;").map((l) => l.text), ["", "/x"]);

// THE KNOWN-BAD TREE. The same walk the real check runs, over a folder holding one offending file and
// one exempt file, so a walk that silently read nothing cannot pass for a clean tree.
const scratch = mkdtempSync(join(tmpdir(), "docs-tree-"));
try {
  mkdirSync(join(scratch, "lib"), { recursive: true });
  writeFileSync(join(scratch, "bad.ts"), `export const seat = "${DOCS}/${SEAT.behaviors}";\n`);
  writeFileSync(join(scratch, "lib", MODULE), `export const SEAT = "${SEAT.behaviors}";\n`);
  const bad = await scanTree(scratch, NAMES, [`lib/${MODULE}`]);
  same("known-bad tree: the offending file is named, and the module itself is exempt",
    bad.map((hit) => `${hit.file}:${hit.line} ${hit.name}`), [`bad.ts:1 ${SEAT.behaviors}`]);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

// Every plugin beside this folder that carries scripts, found by walking rather than listed, so a
// new plugin is scanned the day it lands.
const PLUGINS = readdirSync(PACKAGES).sort()
  .filter((name) => name.startsWith("plugin-spn-") && existsSync(join(PACKAGES, name, "src", "scripts")));
same("the check scans spn-devex, spn-apps and spn-infra",
  ["plugin-spn-devex", "plugin-spn-apps", "plugin-spn-infra"].every((name) => PLUGINS.includes(name)), true);
for (const plugin of PLUGINS) {
  const found = await scanTree(join(PACKAGES, plugin, "src", "scripts"), NAMES);
  same(`no file under ${plugin}/src/scripts spells a layout folder`,
    found.map((hit) => `${hit.file}:${hit.line} [${hit.name}] ${hit.text.slice(0, 80)}`), []);
}
const own = await scanTree(join(HERE, "src", "lib"), NAMES, [MODULE]);
same(`no file under plugin-support-lib/src/lib other than ${MODULE} spells a layout folder`,
  own.map((hit) => `${hit.file}:${hit.line} [${hit.name}] ${hit.text.slice(0, 80)}`), []);

console.log(failed ? `\n  ${failed} of ${total} FAILED — docs-tree` : `\n  all ${total} passed — docs-tree`);
process.exit(failed ? 1 : 0);
