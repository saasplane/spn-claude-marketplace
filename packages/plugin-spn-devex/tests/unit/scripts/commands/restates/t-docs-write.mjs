// `restates docs --write <ref>` — restamps one ref's `docs` citations after the developer has
// re-read each source and fixed any disagreement in the ref's own prose. It never touches the
// prose itself, and it never touches a file other than the one named on the command line.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { check, parse, sectionText, seenHash } from "../../../../../src/scripts/lib/restates.ts";
import { SEAT, TEMPLATES } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

let n = 0, failed = 0;
const one = (label, got, want) => {
  n += 1;
  const ok = typeof want === "function" ? want(got) : got === want;
  if (!ok) { failed += 1; console.log(`  FAIL  ${label}\n        got: ${JSON.stringify(got)}`); }
  else console.log(`  PASS  ${label}`);
};

const BASE = mkdtempSync(join(tmpdir(), "t-restates-docs-write-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

const TOOL = join(import.meta.dirname, "..", "..", "..", "..", "..", "src", "scripts", "commands", "restates", "docs.ts");
const write = (refPath) => {
  try { return { out: execFileSync("node", [TOOL, "--write", refPath], { encoding: "utf8" }), code: 0 }; }
  catch (e) { return { out: String(e.stdout ?? ""), code: e.status ?? 1 }; }
};

const workspace = join(BASE, "ws");
mkdirSync(join(workspace, ".spndevex"), { recursive: true });
mkdirSync(join(workspace, "spn-foundation", "docs", SEAT.constructs), { recursive: true });

const CHAPTER = join(workspace, "spn-foundation", "docs", SEAT.constructs, "thing.md");
const chapterBody = [
  "# A thing",
  "",
  "## First section",
  "",
  "The first section's own text.",
  "",
  "## Second section",
  "",
  "The second section's own text.",
  "",
].join("\n");
writeFileSync(CHAPTER, chapterBody);

console.log("=== known-bad first — a citation that cannot resolve is left as found, never crashes");
{
  const refPath = join(workspace, "bad.md");
  writeFileSync(refPath,
    '<!-- spn:restates\n{\n  "docs": [\n' +
    `    { "path": "spn-foundation/docs/${SEAT.constructs}/ghost.md", "seen": "deadbeef" },\n` +
    `    { "path": "spn-foundation/docs/${SEAT.constructs}/thing.md", "section": "No Such Heading", "seen": "deadbeef" }\n` +
    "  ]\n}\n-->\n\n# a ref\n");
  const before = readFileSync(refPath, "utf8");
  const result = write(refPath);
  one("the writer does not crash on an unresolved citation", result.code, 0);
  one("it reports zero restamped for a ref with nothing resolvable", result.out, (g) => /0 doc\(s\) restamped/.test(g));
  one("it names the path that does not resolve", result.out, (g) => g.includes("ghost.md") && g.includes("does not resolve"));
  one("it names the heading that does not exist", result.out, (g) => g.includes("No Such Heading"));
  one("the ref is left byte-identical — nothing to write when nothing restamped", readFileSync(refPath, "utf8"), before);
}

console.log("\n=== a section citation is hashed by its own section, never the whole file");
{
  const refPath = join(workspace, "section.md");
  const sectionHash = seenHash(sectionText(chapterBody, "First section"));
  writeFileSync(refPath,
    '<!-- spn:restates\n{\n  "docs": [\n' +
    `    { "path": "spn-foundation/docs/${SEAT.constructs}/thing.md", "section": "First section", "seen": "${sectionHash}" }\n` +
    "  ]\n}\n-->\n\n# a ref\n\nProse untouched by the writer.\n");

  // KNOWN-BAD FIRST: editing the OTHER section leaves this citation's stamp current — if the hash
  // covered the whole file, this edit would drift it, and the writer would wrongly restamp.
  const untouchedBody = readFileSync(refPath, "utf8");
  const edited = chapterBody.replace("The second section's own text.", "The second section, rewritten.");
  writeFileSync(CHAPTER, edited);
  const quiet = write(refPath);
  one("editing a SIBLING section restamps nothing — the citation covers only its own section",
    quiet.out, (g) => /0 doc\(s\) restamped/.test(g));
  one("and the ref file is untouched", readFileSync(refPath, "utf8"), untouchedBody);
  writeFileSync(CHAPTER, chapterBody); // restore

  // Now edit the CITED section itself and confirm the restamp lands the section's own hash.
  const changed = chapterBody.replace("The first section's own text.", "The first section, rewritten.");
  writeFileSync(CHAPTER, changed);
  const newSectionHash = seenHash(sectionText(changed, "First section"));
  const result = write(refPath);
  one("editing the CITED section restamps exactly one citation", result.out, (g) => /1 doc\(s\) restamped/.test(g));
  const after = readFileSync(refPath, "utf8");
  one("the stamp now carries the section's own hash, not a whole-file hash",
    after.includes(`"seen": "${newSectionHash}"`), true);
  one("the prose is byte-identical — the writer never rewrites text, only the stamp",
    after.endsWith("Prose untouched by the writer.\n"), true);
  const [block] = parse(refPath);
  one("re-checking the restamped ref is clean",
    check(refPath, workspace, block, ["docs"]).length, 0);
  writeFileSync(CHAPTER, chapterBody); // restore for the next case
}

console.log("\n=== the writer touches only the ref named on the command line, never a sibling citer");
{
  const refA = join(workspace, "citer-a.md");
  const refB = join(workspace, "citer-b.md");
  const body = (marker) =>
    '<!-- spn:restates\n{\n  "docs": [\n' +
    `    { "path": "spn-foundation/docs/${SEAT.constructs}/thing.md", "seen": "deadbeef" }\n` +
    `  ]\n}\n-->\n\n# ${marker}\n`;
  writeFileSync(refA, body("citer A"));
  writeFileSync(refB, body("citer B"));
  const beforeB = readFileSync(refB, "utf8");

  const result = write(refA);
  one("the named ref is restamped", result.out, (g) => /1 doc\(s\) restamped/.test(g));
  one("a sibling ref citing the same source, not named on the command line, is untouched",
    readFileSync(refB, "utf8"), beforeB);
}

console.log("\n=== a folder citation restamps by its tree hash, exactly as `check()` reads it");
{
  const folder = join(workspace, "spn-foundation", "docs", SEAT.capabilities, "01-devex", "templates");
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "one.md"), "one\n");
  writeFileSync(join(folder, "two.md"), "two\n");
  const refPath = join(workspace, "folder.md");
  writeFileSync(refPath,
    '<!-- spn:restates\n{\n  "docs": [\n' +
    `    { "path": "spn-foundation/docs/${SEAT.capabilities}/01-devex/${TEMPLATES}", "seen": "deadbeef" }\n` +
    "  ]\n}\n-->\n\n# a ref\n");
  const result = write(refPath);
  one("a folder citation restamps", result.out, (g) => /1 doc\(s\) restamped/.test(g));
  const [block] = parse(refPath);
  one("re-checking the restamped folder citation is clean",
    check(refPath, workspace, block, ["docs"]).length, 0);
}

console.log(failed ? `\n  ${failed} of ${n} FAILED — restates docs --write` : `\n  all ${n} passed — restates docs --write`);
process.exit(failed ? 1 : 0);
