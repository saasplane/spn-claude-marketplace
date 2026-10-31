// `spn-devex docs book check` — the book check over the whole book, and the named run a clean read records.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const CLI = join(import.meta.dirname, "..", "..", "..", "..", "..", "src", "scripts", "cli.ts");
const kept = [];
process.on("exit", () => { for (const dir of kept) rmSync(dir, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** A book in a fresh folder: a decisions register, so the command finds it, and the chapters given. */
function book(chapters) {
  const root = mkdtempSync(join(tmpdir(), "docs-book-"));
  kept.push(root);
  const files = { "docs/registers/decisions.md": "# Decisions\n", ...chapters };
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text, "utf8");
  }
  return root;
}

/** The command's output and exit code, run on the book given. */
function check(root, ...args) {
  try {
    return { out: execFileSync(process.execPath, [CLI, "docs", "book", "check", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), code: 0 };
  } catch (error) { return { out: String(error.stdout ?? ""), code: error.status ?? 1 }; }
}

const CLEAN = "# A chapter\n\n**A rule nothing checks.** (rule RULE.DEVEX.TEST.001 · GUIDE)\n";
const FAULT = "# A chapter\n\n**A rule with no level.** (rule RULE.DEVEX.TEST.002)\n";
const runFile = (root, run) => join(root, "tests", ".output", "unit", "runs", `${run}.json`);

console.log("=== docs book check");

{
  const root = book({ "docs/01-a.md": CLEAN, "docs/artifacts/README.md": FAULT });
  const { out, code } = check(root, "--run", "book-1");
  ok("[MKT.SCRIPTS.318] a clean book exits 0 and says how many chapters it read, the produced pages left out",
    code === 0 && out.includes("clean — 2 chapters read"), out);
  const written = existsSync(runFile(root, "book-1")) ? JSON.parse(readFileSync(runFile(root, "book-1"), "utf8")) : null;
  ok("[MKT.SCRIPTS.318] with --run, the clean read is recorded as a named run in the book, in the shape every runner writes",
    written !== null && written.run === "book-1" && written.tier === "UNIT" && Array.isArray(written.results), JSON.stringify(written));
}

{
  const root = book({ "docs/01-a.md": CLEAN, "docs/02-b.md": FAULT });
  const { out, code } = check(root, "--run", "book-2");
  ok("[MKT.SCRIPTS.319] a fault is named with its chapter, and the command exits 1",
    code === 1 && out.includes("docs/02-b.md") && out.includes("1 fault(s)"), out);
  ok("[MKT.SCRIPTS.319] and no run is recorded, so the proof row cannot land on it",
    !existsSync(runFile(root, "book-2")) && out.includes("no run written"), out);
}

{
  const root = book({ "docs/01-a.md": CLEAN });
  const { code } = check(root);
  ok("[MKT.SCRIPTS.318] without --run the book is read and nothing is written",
    code === 0 && !existsSync(join(root, "tests")));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — docs book` : `\n  all ${total} passed — docs book`);
process.exit(failed ? 1 : 0);
