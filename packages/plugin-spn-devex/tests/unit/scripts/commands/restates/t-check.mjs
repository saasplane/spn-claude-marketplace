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
import { POCKET, SEAT } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const HOOKS = PLUGIN;
const TOOL = join(HOOKS, "src", "scripts", "cli.ts");
// REALPATH'D, because macOS's tmpdir is `/var/...`, a symlink to `/private/var/...` that
// `process.cwd()` resolves through but a path built by `join` never does — a fixture built on the
// unresolved form and compared against `process.cwd()` inside the child agrees on content and
// disagrees on the string, which is exactly what `strayStamps`'s prefix check needs to match.
const BASE = realpathSync(mkdtempSync(join(tmpdir(), "t-restate-drift-")));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let n = 0, failed = 0;

/** One command of the `restates` group through the entry, from the folder given: what it printed, and its exit code. */
function typed(words, cwd) {
  try { return { out: execFileSync("node", [TOOL, "restates", ...words], { encoding: "utf8", cwd, stdio: "pipe", env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 }; }
  catch (e) { return { out: String(e.stdout ?? "") + String(e.stderr ?? ""), code: e.status ?? 1 }; }
}
const run = (args, cwd) => typed(["check", ...args], cwd);

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
one("[MKT.SCRIPTS.167] run from the workspace it reports the stale stamp, and exits 1",
  fromWorkspace.out.includes("01-thing.md") && fromWorkspace.code === 1);
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

console.log("\n=== the book is the workspace's own spn-foundation, and the first line says which");
{
  const body = "# A thing\n\nIt is stated here, once.";
  const seen = createHash("sha256").update(body, "utf8").digest("hex").slice(0, 8);
  const stamp = (cited, at) => `<!-- spn:restates\n{\n  "docs": [\n    { "path": "${cited}", "seen": "${at}" }\n  ]\n}\n-->\n\n# Thing — quick reference\n`;
  /** A workspace: `.spndevex`, the folders named, each a book when it carries a register. */
  const workspace = (name, books) => {
    const w = join(BASE, name);
    mkdirSync(join(w, ".spndevex", "workstreams"), { recursive: true });
    for (const b of books) {
      mkdirSync(join(w, b, "docs", POCKET.registers), { recursive: true });
      mkdirSync(join(w, b, "docs", SEAT.constructs), { recursive: true });
      writeFileSync(join(w, b, "CONCEPT.md"), "# concept\n");
      writeFileSync(join(w, b, "docs", POCKET.registers, "decisions.md"), "| # | Decision | Why | Date |\n| --- | --- | --- | --- |\n");
      writeFileSync(join(w, b, "docs", SEAT.constructs, "01-thing.md"), `${body}\n`);
    }
    return w;
  };
  const marketIn = (w, folder, { manifest = false } = {}) => {
    const m = join(w, folder);
    mkdirSync(join(m, "packages", "plugin-spn-devex", "refs"), { recursive: true });
    writeFileSync(join(m, "packages", "plugin-spn-devex", "refs", "thing.md"),
      stamp(`spn-foundation/docs/${SEAT.constructs}/01-thing.md`, seen));
    if (manifest) {
      mkdirSync(join(m, ".claude-plugin"), { recursive: true });
      writeFileSync(join(m, ".claude-plugin", "marketplace.json"), JSON.stringify({ name: folder, plugins: [] }));
    }
    return m;
  };

  // Two foundation-like folders, and the alphabetical first is not the book.
  const two = workspace("ws-two", ["aaa-foundation-copy", "spn-foundation"]);
  const m2 = marketIn(two, "spn-claude-marketplace");
  const first = run([], m2);
  one("[MKT.SCRIPTS.192] with no path it reads spn-foundation, not the alphabetical first, and says so on its first line",
    first.out.split("\n")[0] === "book  spn-foundation  at no commit  (this workspace's)" && !first.out.includes("aaa-foundation-copy"));
  one("and the same line opens a `docs check` and a `decisions check`",
    typed(["docs", "check"], m2).out.split("\n")[0] === first.out.split("\n")[0]
    && typed(["decisions", "check"], m2).out.split("\n")[0] === first.out.split("\n")[0]);
  const given = run([join(two, "aaa-foundation-copy")], m2);
  one("[MKT.SCRIPTS.192] a path given is read, and the first line says (given)",
    given.out.split("\n")[0] === "book  aaa-foundation-copy  at no commit  (given)");

  // No spn-foundation: refused by name, never guessed from the sibling that carries a register.
  const none = workspace("ws-none", ["aaa-foundation-copy"]);
  const m3 = marketIn(none, "spn-claude-marketplace");
  const refused = run([], m3);
  one("[MKT.SCRIPTS.192] with no spn-foundation and no path it is refused by name, naming the workspace",
    refused.out.includes("holds no spn-foundation") && refused.out.includes(none) && !refused.out.startsWith("book  "));
  one("and it reads nothing from the sibling that carries a register", !refused.out.includes("DRIFT"));

  // A second marketplace checkout beside the one that runs.
  const many = workspace("ws-many", ["spn-foundation"]);
  const run1 = marketIn(many, "spn-claude-marketplace", { manifest: true });
  marketIn(many, "spn-claude-marketplace-debug", { manifest: true });
  marketIn(many, join("pair", "spn-claude-marketplace-hotfix"), { manifest: true });
  const plural = run([], run1);
  one("[MKT.SCRIPTS.193] a second marketplace checkout under another name, or one folder down, is a marketplace: 0 misplaced",
    /\b0 misplaced/.test(plural.out) && !plural.out.includes("outside the plugins"));

  // A checkout under another folder name is still its own repository.
  const own = workspace("ws-own", ["spn-foundation"]);
  const checkout = marketIn(own, "mkt-checkout-x", { manifest: true });
  writeFileSync(join(checkout, "packages", "plugin-spn-devex", "refs", "self.md"),
    stamp("spn-claude-marketplace/docs/x.md", "deadbeef"));
  execFileSync("git", ["-C", checkout, "init", "-q"]);
  execFileSync("git", ["-C", checkout, "remote", "add", "origin", "https://example.com/org/spn-claude-marketplace.git"]);
  const selfOut = run([], checkout);
  one("[MKT.SCRIPTS.193] a self-citation from a checkout under another folder name is still its own",
    selfOut.out.includes("cites `spn-claude-marketplace/docs/x.md` in its own repository"));
}

console.log("\n=== a finding is exit 1, whatever the count, and a typing fault is exit 2");
{
  // A second stale citation: two findings, and the exit code stays 1, because 2 is a fault in how the command was typed.
  writeFileSync(join(market, "packages", "plugin-spn-devex", "refs", "second.md"),
    `<!-- spn:restates\n{\n  "docs": [\n    { "path": "spn-foundation/docs/${SEAT.constructs}/01-thing.md", "seen": "deadbeef" }\n  ]\n}\n-->\n\n# Second — quick reference\n`);
  const two = run([book], market);
  one("[MKT.SCRIPTS.167] known-bad: two drifted stamps are reported, and `restates check` exits 1, never the count",
    /\b2 drift\b/.test(two.out) && two.code === 1);
  for (const kind of ["docs", "decisions"]) {
    const narrow = typed([kind, "check", book], market);
    one(`[MKT.SCRIPTS.167] \`restates ${kind} check <book>\` reads that kind alone, and exits ${kind === "docs" ? 1 : 0}`,
      narrow.code === (kind === "docs" ? 1 : 0) && narrow.out.includes(kind === "docs" ? "2 owe a rewrite" : "0 owe a re-read"));
    const usage = `usage: spn-devex restates ${kind} check [<book>]\n       spn-devex restates ${kind} write <ref>\n`;
    one(`[MKT.SCRIPTS.111] \`restates ${kind}\` with no action prints each usage line and says an action is owed`,
      typed([kind], market).out === usage + `\`restates ${kind}\` needs an action.\n` && typed([kind], market).code === 2);
    one(`[MKT.SCRIPTS.111] \`restates ${kind}\` with \`--write\` where the action belongs is refused, and \`--write\` is named as the action \`write\``,
      typed([kind, "--write", "x.md"], market).out === usage + `\`restates ${kind}\` needs an action. \`--write\` is the action \`write\`.\n`);
    one(`[MKT.SCRIPTS.112] \`restates ${kind} write\` with no ref prints its usage line and says a path is owed`,
      typed([kind, "write"], market).out === `usage: spn-devex restates ${kind} write <ref>\n\`restates ${kind} write\` needs a path.\n` && typed([kind, "write"], market).code === 2);
    one(`[MKT.SCRIPTS.174] \`restates ${kind} check\` refuses an option it does not take, with exit 2`,
      typed([kind, "check", "--write"], market).code === 2 && typed([kind, "check", "--write"], market).out.includes("does not take `--write`."));
    one(`\`restates ${kind} check\` refuses a second book with exit 2`, typed([kind, "check", book, book], market).code === 2);
  }
  const option = run(["--json"], market);
  one("[MKT.SCRIPTS.174] `restates check` refuses an option it does not take, with its usage line and exit 2",
    option.code === 2 && option.out === "usage: spn-devex restates check [<book>]\n`restates check` does not take `--json`.\n");
  one("`restates check` refuses a second book with exit 2", run([book, book], market).code === 2 && run([book, book], market).out.includes("takes one book."));
}

console.log("\n=== a named book that is not there is a finding, not a quiet pass");
{
  const gone = join(BASE, "no-such-book");
  const refused = typed(["docs", "check", gone], market);
  one("[MKT.SCRIPTS.167] `restates docs check` of a path that is no book says so as a RULE finding",
    refused.out.includes("✗ RULE restates") && refused.out.includes("no foundation book"));
  one("[MKT.SCRIPTS.167] and exits 1", refused.code === 1);
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
