// `lib/docs-tree.ts` — the docs layout stated once, and the check that no other script spells it.
//
// The helpers are proved on paths built from the module's own names, so a folder the book moves is
// one edit in the module and none here. The check reads every literal under `src/scripts/` with the
// comments dropped: a comment may cite a chapter's path, and code may not build one by hand.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SCRIPTS } from "../../../helpers/harness.mjs";
import { layoutLiterals, literalsOf, scanTree } from "../../../helpers/layout-literals.mjs";
import * as tree from "../../../../src/scripts/lib/docs-tree.ts";

const { SEAT, SEATS, POCKET, ARTIFACT, ARTIFACT_FOLDERS, TEMPLATES, WORKSTREAMS, DOCS } = tree;

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
  distinctive: [...Object.values(POCKET), ARTIFACT.overviews, WORKSTREAMS],
  common: [ARTIFACT.constructs, ARTIFACT.reports, TEMPLATES],
};

// A probe repository in a temporary workspace. Nothing here is read from disk; the paths only have
// to be shaped the way the module says a docs tree is.
const ROOT = "/probe-workspace";
const REPO = join(ROOT, "probe-repo");
const DOCS_TREE = tree.docsOf(REPO);
const SEAT_FILE = join(tree.constructsDir(DOCS_TREE), "01-domain", "02-thing.md");
const PAGE = join(tree.constructPagesDir(DOCS_TREE), "01-domain", `02-thing${tree.CONSTRUCT_PAGE_SUFFIX}`);

console.log("=== the tree — seats, pockets and the pages between them");
same("the seats are five, in reading order", SEATS, [SEAT.purpose, SEAT.constructs, SEAT.behaviors, SEAT.capabilities, SEAT.guides]);
same("each seat folder sits directly in the docs tree",
  Object.keys(SEAT).map((seat) => tree.seatDir(DOCS_TREE, seat)), SEATS.map((name) => join(DOCS_TREE, name)));
same("the decisions register sits in the registers pocket",
  tree.decisionsRegister(DOCS_TREE), join(DOCS_TREE, POCKET.registers, tree.DECISIONS));
same("the hub sits in the overviews folder of the artifacts pocket",
  tree.hubPage(DOCS_TREE), join(DOCS_TREE, POCKET.artifacts, ARTIFACT.overviews, tree.HUB));
same("a seat file is produced as a page at the mirrored path", tree.producedPageOf(SEAT_FILE), PAGE);
same("and the page finds its seat file by path alone", tree.seatOf(PAGE), SEAT_FILE);
same("a seat file is a construct .md that is not a face",
  [SEAT_FILE, join(tree.constructsDir(DOCS_TREE), tree.FACE), join(tree.behaviorsDir(DOCS_TREE), "01-domain", "02-thing.md")].map(tree.isSeatFile),
  [true, false, false]);
same("a produced page is recognised, and a seat file is not one", [PAGE, SEAT_FILE].map(tree.isProducedPage), [true, false]);
same("an overview is an .html in the overviews folder",
  [tree.hubPage(DOCS_TREE), join(tree.overviewsDir(DOCS_TREE), "notes.md"), PAGE].map(tree.isOverview), [true, false, false]);
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
   ARTIFACT_FOLDERS.includes(NOT_A_POCKET_FOLDER)], [ARTIFACT.constructs, NOT_A_POCKET_FOLDER, false]);
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
same("the arc pattern reads a command that names one",
  tree.arcPathPattern(false).test(`cat ${join(WORKSTREAM, tree.ARCS, "N1-probe.md")} | head`), true);

console.log("\n=== the check — no script spells the layout");
const line = (source) => layoutLiterals(source, NAMES).map((hit) => hit.name);
same("known-bad: a seat in a string is caught", line(`const x = join(repo, "docs", "${SEAT.constructs}");`), [SEAT.constructs]);
same("known-bad: a pocket path in a template chunk is caught",
  line("const x = `${repo}/docs/" + POCKET.artifacts + "/" + ARTIFACT.overviews + "/${name}`;"), [POCKET.artifacts, ARTIFACT.overviews]);
same("known-bad: a regular expression spelling the container is caught",
  line(`const re = /\\/${WORKSTREAMS}\\/[^/]+\\/;`), [WORKSTREAMS]);
same("known-bad: a common word beside a slash is caught",
  line(`const x = "${POCKET.artifacts}-free/${ARTIFACT.constructs}/";`), [ARTIFACT.constructs]);
same("a comment citing a chapter is prose, not a path",
  line(`// RESTATES: spn-foundation docs/${SEAT.capabilities}/01-devex/03-tree.md\n/* ${POCKET.artifacts}/${ARTIFACT.overviews} */\nconst x = 1;`), []);
same("a region named like a folder, with no slash, is not a folder", line(`replaceRegion(text, "${ARTIFACT.constructs}", body);`), []);
same("substitutions are code, so a constant inside one is not a literal",
  literalsOf("const p = `${SEAT.constructs}/x`;").map((l) => l.text), ["", "/x"]);

// THE KNOWN-BAD TREE. The same walk the real check runs, over a folder holding one offending file and
// one exempt file, so a walk that silently read nothing cannot pass for a clean tree.
const scratch = mkdtempSync(join(tmpdir(), "docs-tree-"));
try {
  mkdirSync(join(scratch, "lib"), { recursive: true });
  writeFileSync(join(scratch, "bad.ts"), `export const seat = "${DOCS}/${SEAT.behaviors}";\n`);
  writeFileSync(join(scratch, "lib", "docs-tree.ts"), `export const SEAT = "${SEAT.behaviors}";\n`);
  const bad = await scanTree(scratch, NAMES, ["lib/docs-tree.ts"]);
  same("known-bad tree: the offending file is named, and the module itself is exempt",
    bad.map((hit) => `${hit.file}:${hit.line} ${hit.name}`), [`bad.ts:1 ${SEAT.behaviors}`]);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

const found = await scanTree(SCRIPTS, NAMES, ["lib/docs-tree.ts"]);
same("no file under src/scripts other than lib/docs-tree.ts spells a layout folder",
  found.map((hit) => `${hit.file}:${hit.line} [${hit.name}] ${hit.text.slice(0, 80)}`), []);

console.log(failed ? `\n  ${failed} of ${total} FAILED — docs-tree` : `\n  all ${total} passed — docs-tree`);
process.exit(failed ? 1 : 0);
