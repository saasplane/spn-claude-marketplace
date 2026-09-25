// `restate-drift` — the tool that reported 0 having compared nothing.
//
// It walks `<root>/plugins`, which exists in the marketplace checkout and nowhere else. Run from the
// WORKSPACE — the folder the sibling checkouts sit in, and where every other tool here is run from —
// it found no documents, printed "no plugins here" and **returned 0**. A handover then carried
// `restate-drift 0` that had opened nothing at all.
//
// So these cases are about WHERE it is run from, not about what drift means. The answer has to be
// the same from the workspace as from the repository, which is the rule `docs.ts` already states
// about its own workspace root: the same command must not give different answers from different
// directories.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const HOOKS = resolve(import.meta.dirname, "..");
const TOOL = join(HOOKS, "src", "scripts", "tools", "restate-drift.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-restate-drift-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let n = 0, failed = 0;

function run(args, cwd) {
  try { return { out: execFileSync("node", [TOOL, ...args], { encoding: "utf8", cwd }), code: 0 }; }
  catch (e) { return { out: String(e.stdout ?? ""), code: e.status ?? 1 }; }
}

function one(label, ok) {
  n += 1;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
}

/** A workspace holding a book and a marketplace beside it, the shape this tool actually runs in. */
const ws = join(BASE, "ws");
const book = join(ws, "spn-foundation");
const market = join(ws, "spn-claude-marketplace");
mkdirSync(join(book, "docs", "registers"), { recursive: true });
mkdirSync(join(book, "docs", "02-constructs"), { recursive: true });
mkdirSync(join(market, "plugins", "spn-devex", "refs"), { recursive: true });
writeFileSync(join(book, "CONCEPT.md"), "# concept\n");
writeFileSync(join(book, "docs", "registers", "decisions.md"), "| # | Decision | Why | Date |\n| --- | --- | --- | --- |\n");
writeFileSync(join(book, "docs", "02-constructs", "01-thing.md"), "# A thing\n\nIt is stated here, once.\n");
writeFileSync(join(market, "plugins", "spn-devex", "refs", "thing.md"),
  '<!-- spn:restates\n{\n  "docs": [\n    { "path": "spn-foundation/docs/02-constructs/01-thing.md", "seen": "deadbeef" }\n  ]\n}\n-->\n\n# Thing — quick reference\n');

console.log("\n=== it finds the plugins from the workspace, not only from the repository that holds them");

const fromWorkspace = run([book], ws);
const fromMarket = run([book], market);

one("run from the workspace it does not say there are no plugins",
  !fromWorkspace.out.includes("no plugins here"));
one("run from the workspace it reports the stale stamp",
  fromWorkspace.out.includes("01-thing.md") && fromWorkspace.code !== 0);
one("run from the repository it says the same thing",
  fromMarket.out.includes("01-thing.md") && fromMarket.code === fromWorkspace.code);
one("and the two summaries agree line for line",
  fromWorkspace.out.split("\n").at(-2) === fromMarket.out.split("\n").at(-2));

// A partner holds the plugins and no book, and a folder with neither is not a finding about
// anything. Silence there is correct — what was wrong was silence where the plugins existed.
const empty = join(BASE, "empty");
mkdirSync(empty, { recursive: true });
one("a root with no plugins anywhere is quiet, and that is right",
  run([], empty).out.includes("no plugins here") && run([], empty).code === 0);

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
