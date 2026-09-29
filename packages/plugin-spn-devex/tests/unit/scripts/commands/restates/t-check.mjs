import { PLUGIN } from "../../../../helpers/harness.mjs";
// `restates check` — every plugin document, against the book.
//
// It walks `<root>/packages/plugin-*`, which exists in the marketplace checkout and nowhere else.
// Run from the WORKSPACE — the folder the sibling checkouts sit in, and where every other tool here
// is run from — a version that only looked inside the given root found no documents, printed "no
// plugins here" and **returned 0**, so a handover carried a drift count that had opened nothing at
// all.
//
// So these cases are about WHERE it is run from, not about what drift means. The answer has to be
// the same from the workspace as from the repository, which is the rule `docs.ts` already states
// about its own workspace root: the same command must not give different answers from different
// directories.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { POCKET, SEAT } from "../../../../../src/scripts/lib/docs-tree.ts";

const HOOKS = PLUGIN;
const TOOL = join(HOOKS, "src", "scripts", "commands", "restates", "check.ts");
// REALPATH'D, because macOS's tmpdir is `/var/...`, a symlink to `/private/var/...` that
// `process.cwd()` resolves through but a path built by `join` never does — a fixture built on the
// unresolved form and compared against `process.cwd()` inside the child agrees on content and
// disagrees on the string, which is exactly what `strayStamps`'s prefix check needs to match.
const BASE = realpathSync(mkdtempSync(join(tmpdir(), "t-restate-drift-")));
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
mkdirSync(join(book, "docs", POCKET.registers), { recursive: true });
mkdirSync(join(book, "docs", SEAT.constructs), { recursive: true });
mkdirSync(join(market, "packages", "plugin-spn-devex", "refs"), { recursive: true });
writeFileSync(join(book, "CONCEPT.md"), "# concept\n");
writeFileSync(join(book, "docs", POCKET.registers, "decisions.md"), "| # | Decision | Why | Date |\n| --- | --- | --- | --- |\n");
writeFileSync(join(book, "docs", SEAT.constructs, "01-thing.md"), "# A thing\n\nIt is stated here, once.\n");
writeFileSync(join(market, "packages", "plugin-spn-devex", "refs", "thing.md"),
  `<!-- spn:restates\n{\n  "docs": [\n    { "path": "spn-foundation/docs/${SEAT.constructs}/01-thing.md", "seen": "deadbeef" }\n  ]\n}\n-->\n\n# Thing — quick reference\n`);

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

console.log("\n=== a stamp under packages/plugin-<name>/ is inside a plugin, not stray");
{
  // THE REGRESSION: `strayStamps` used to skip only a pre-joined `<root>/plugins` path, the shape
  // from before the `N101` move to `packages/plugin-<name>/`. Run for real after that move, it read
  // every genuine ref, skill and agent brief as a `spn:restates` header sitting outside the plugins
  // — over a hundred false PLACEMENT findings on one run of the real corpus. This fixture carries a
  // stamped file only under `packages/`, the post-move shape, with no `plugins/` folder at all.
  const ws2 = join(BASE, "ws2");
  const book2 = join(ws2, "spn-foundation");
  const market2 = join(ws2, "spn-claude-marketplace");
  mkdirSync(join(book2, "docs", POCKET.registers), { recursive: true });
  mkdirSync(join(book2, "docs", SEAT.constructs), { recursive: true });
  mkdirSync(join(market2, "packages", "plugin-spn-devex", "refs"), { recursive: true });
  writeFileSync(join(book2, "CONCEPT.md"), "# concept\n");
  writeFileSync(join(book2, "docs", POCKET.registers, "decisions.md"), "| # | Decision | Why | Date |\n| --- | --- | --- | --- |\n");
  const thingBody = "# A thing\n\nIt is stated here, once.";
  writeFileSync(join(book2, "docs", SEAT.constructs, "01-thing.md"), `${thingBody}\n`);
  // A CURRENT STAMP, so this fixture proves PLACEMENT alone and carries no unrelated DRIFT finding —
  // the same `normalize` + sha256-first-8-hex `seenHash` the library uses, over the cited section's
  // whole file (no trailing blank line, matching what `normalize` strips).
  const seen = createHash("sha256").update(thingBody, "utf8").digest("hex").slice(0, 8);
  writeFileSync(join(market2, "packages", "plugin-spn-devex", "refs", "thing.md"),
    `<!-- spn:restates\n{\n  "docs": [\n    { "path": "spn-foundation/docs/${SEAT.constructs}/01-thing.md", "seen": "${seen}" }\n  ]\n}\n-->\n\n# Thing — quick reference\n`);

  const out = run([book2], market2);
  one("a real plugin file under packages/plugin-<name>/ is not read as a stray stamp",
    !out.out.includes("thing.md") || !out.out.includes("outside the plugins"));
  one("and PLACEMENT reports zero misplaced stamps for this fixture", out.out.includes("0 misplaced"));
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
