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
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const TOOL = join(resolve(import.meta.dirname, ".."), "tools", "coherence.ts");
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

console.log(failed ? `t-coherence: ${failed} of ${n} failed` : `t-coherence: ${n} passed`);
process.exit(failed ? 1 : 0);
