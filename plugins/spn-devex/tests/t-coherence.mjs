// `coherence` CITATION — does every decision id cited in a repository resolve to a row?
//
// The question exists because `N76` found two ids cited in the foundation book with no row behind
// them, and neither had ever been reported. A citation to a missing row is the one register failure
// a reader cannot work around: every other finding leaves two answers to choose between, and this
// one leaves none. It is also silent — `RD.APPS.020` reads exactly like a row that exists until
// somebody opens the register and searches.
//
// These cases fix the three answers that matter, because the check ships SOFT and a SOFT check
// nobody trusts is a SOFT check nobody reads:
//
//   a clean tree reports nothing        — otherwise the finding is noise and gets filtered away
//   one dangling id reports once        — naming the id AND the file, because the file is the fix
//   a repo with no register is silent   — the marketplace and the estate repos have none, and a
//                                         tool that fires there would be red everywhere by default
//
// The fixture is written rather than copied from the corpus on purpose. A test whose input is the
// live book passes for whatever reason the book happens to be in today.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync, renameSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";

const TOOL = join(resolve(import.meta.dirname, ".."), "src", "scripts", "tools", "coherence.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-coherence-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let n = 0, failed = 0;

function one(label, ok) {
  n += 1;
  if (!ok) { failed += 1; console.log(`  FAIL  ${label}`); }
}

function run(root) {
  try { return execFileSync("node", [TOOL, root], { encoding: "utf8" }); }
  catch (e) { return String(e.stdout ?? ""); }
}

function tree(name, pageBody, withRegister = true) {
  const root = join(BASE, name);
  mkdirSync(join(root, "docs", "registers"), { recursive: true });
  mkdirSync(join(root, "docs", "02-constructs"), { recursive: true });
  if (withRegister)
    writeFileSync(join(root, "docs", "registers", "decisions.md"),
      "# Decisions\n\n| # | Decision | Why | Date |\n| --- | --- | --- | --- |\n" +
      "| RD.GOV.001 | A thing is so. | Because a fixture needs a row that exists. | 2026-09 |\n");
  writeFileSync(join(root, "docs", "02-constructs", "a.md"), pageBody);
  return root;
}

/** Write one file into a fixture tree, making the folders it needs. */
function mk(root, relative, body) {
  const at = join(root, relative);
  mkdirSync(dirname(at), { recursive: true });
  writeFileSync(at, body);
}

// 1 — every citation resolves, so the check says nothing at all.
const clean = tree("clean", "# A page\n\nThis cites RD.GOV.001, which the register carries.\n");
one("a tree whose citations all resolve reports no CITATION finding",
  !run(clean).includes("CITATION"));

// 2 — one dangling id, reported once, naming the id and the file that cites it.
const dangling = tree("dangling",
  "# A page\n\nThis cites RD.GOV.001, which exists, and RD.GOV.999, which does not.\n");
const out = run(dangling);
one("a dangling id is reported", out.includes("CITATION"));
one("the finding names the dangling id", out.includes("RD.GOV.999"));
one("the finding names the file citing it", out.includes("docs/02-constructs/a.md"));
one("a resolving id in the same file is not reported", !out.includes("RD.GOV.001 —"));
one("one dangling id counts as one", /CITATION\s+1 decision id\(s\)/.test(out));

// 3 — a repository with no register is not this question's business. The marketplace and the
//     estate repos carry none, and a tool that fired there would be red everywhere by default.
const noRegister = tree("no-register", "# A page\n\nThis cites RD.GOV.999.\n", false);
one("a repository with no register reports nothing", !run(noRegister).includes("CITATION"));

// 4 — the id must be a whole id. A three-digit sequence is the register's own grammar, and a
//     looser match would report prose like "RD.GOV.1" that no reader would call a citation.
const partial = tree("partial", "# A page\n\nThis mentions RD.GOV.1 and RD.GOV.001.\n");
one("a short id is not read as a citation", !run(partial).includes("CITATION"));

// ── the capability-chapter question ───────────────────────────────────────────────────────────
//
// A construct says what a thing IS; a capability chapter says what it is held to. A construct with
// no chapter is a model nothing can measure, and neither tree shows the gap on its own.
//
// THE SHAPES ARE THE HARD PART, and the check was wrong about two of them before it shipped. A
// chapter may be a FILE, a FOLDER of chapters, or a folder of FOLDERS whose chapters sit a level
// down. Counting only folders called eight stages missing; counting only a folder's top level
// called five more missing, because `03-module/` holds `01-server/` and `02-web/` and a face.

// 5 — a construct whose chapter is a flat file is held.
const flat = tree("flat", "", false);
mk(flat, "docs/02-constructs/01-a/01-b/01-thing.md", "# Thing\n");
mk(flat, "docs/04-capabilities/01-a/01-b/01-thing.md", "# Thing — the standard\n");
one("a chapter that is a flat file counts", !run(flat).includes("CHAPTER"));

// 6 — a folder of chapters is held.
const folder = tree("folder", "", false);
mk(folder, "docs/02-constructs/01-a/01-b/01-thing.md", "# Thing\n");
mk(folder, "docs/04-capabilities/01-a/01-b/01-thing/01-part.md", "# A part\n");
one("a chapter that is a folder counts", !run(folder).includes("CHAPTER"));

// 7 — a folder of FOLDERS is held. This is the shape that produced five false findings.
const nested = tree("nested", "", false);
mk(nested, "docs/02-constructs/01-a/01-b/01-thing.md", "# Thing\n");
mk(nested, "docs/04-capabilities/01-a/01-b/01-thing/README.md", "# Thing\n");
mk(nested, "docs/04-capabilities/01-a/01-b/01-thing/01-server/01-part.md", "# A part\n");
one("a chapter nested a level down counts", !run(nested).includes("CHAPTER"));

// 8 — AND THE CHECK STILL FIRES. A question that cannot be made to answer is not a question.
const bare = tree("bare", "", false);
mk(bare, "docs/02-constructs/01-a/01-b/01-thing.md", "# Thing\n");
mk(bare, "docs/04-capabilities/01-a/01-b/README.md", "# The group\n");
one("a construct with no chapter anywhere is reported", run(bare).includes("CHAPTER"));

// 9 — a face alone is not a chapter. This is what makes case 8 a real gap rather than a naming one.
const faceOnly = tree("face-only", "", false);
mk(faceOnly, "docs/02-constructs/01-a/01-b/01-thing.md", "# Thing\n");
mk(faceOnly, "docs/04-capabilities/01-a/01-b/01-thing/README.md", "# Thing\n");
one("a folder holding only a face is not a chapter", run(faceOnly).includes("CHAPTER"));

console.log(failed ? `${failed} of ${n} failed` : `all ${n} passed — coherence`);
process.exit(failed ? 1 : 0);
