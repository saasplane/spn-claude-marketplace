// The behaviour id reader in `../../../src/lib/register.ts`, which every row reader and case reader
// here shares. The book spells an id `DOMAIN.AREA.NN`; a first part of up to seven letters is read,
// so `COMPOSE.BUILD.*` and `SERVICE.*` rows are seen like any other.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..");
const { declaredRows, idsIn } = await import(pathToFileURL(resolve(HERE, "src", "lib", "register.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== the behaviour id reader");

const seven = idsIn("[COMPOSE.BUILD.01] a stack builds · [SERVICE.HEALTH.02] a probe answers");
ok("[MKT.SCRIPTS.78] a first part of seven letters is read", JSON.stringify(seven) === '["COMPOSE.BUILD.01","SERVICE.HEALTH.02"]', JSON.stringify(seven));
ok("[MKT.SCRIPTS.78] a first part of two letters is still read", JSON.stringify(idsIn("WEB.A11Y.01 and UI.LIST.03")) === '["WEB.A11Y.01","UI.LIST.03"]',
  JSON.stringify(idsIn("WEB.A11Y.01 and UI.LIST.03")));
ok("a first part of eight letters is not an id", idsIn("PLATFORM.BOOT.01").length === 0, JSON.stringify(idsIn("PLATFORM.BOOT.01")));
ok("a first part of one letter is not an id", idsIn("X.BOOT.01").length === 0, JSON.stringify(idsIn("X.BOOT.01")));
ok("the book's register ids are never read as behaviour ids", idsIn("RD.DEVEX.UTILS.071 and PD.AGENT.01").length === 0,
  JSON.stringify(idsIn("RD.DEVEX.UTILS.071 and PD.AGENT.01")));

console.log("\n=== an id that more than one row declares");

{
  const root = mkdtempSync(join(tmpdir(), "register-"));
  try {
    const table = (...rows) => ["| Id | Who | Does | Sees | Type | Tier | Status | Updated at |", "| --- | --- | --- | --- | --- | --- | --- | --- |",
      ...rows.map(([id, does]) => `| ${id} | a person | ${does} | a result | POSITIVE | UNIT | PLANNED | — |`), ""].join("\n");
    mkdirSync(join(root, "docs", "03-behaviors"), { recursive: true });
    writeFileSync(join(root, "docs", "03-behaviors", "a.md"), table(["CLI.LINFRA.10", "starts the stack"], ["CLI.LINFRA.11", "stops the stack"], ["CLI.LINFRA.10", "starts it again"]), "utf8");
    writeFileSync(join(root, "docs", "03-behaviors", "b.md"), table(["CLI.LINFRA.11", "stops it elsewhere"], ["CLI.LINFRA.12", "lists the stack"]), "utf8");
    const read = declaredRows(root);
    ok("[MKT.SCRIPTS.84] known-bad: an id on two rows is returned beside the rows, with each file and line",
      JSON.stringify(read.repeated) === JSON.stringify([
        { id: "CLI.LINFRA.10", rows: [{ file: "docs/03-behaviors/a.md", line: 3 }, { file: "docs/03-behaviors/a.md", line: 5 }] },
        { id: "CLI.LINFRA.11", rows: [{ file: "docs/03-behaviors/a.md", line: 4 }, { file: "docs/03-behaviors/b.md", line: 3 }] },
      ]), JSON.stringify(read.repeated));
    ok("[MKT.SCRIPTS.84] `rows` still holds each id once, read from its first row",
      read.rows.map((row) => `${row.id} ${row.does}`).join(" | ") === "CLI.LINFRA.10 starts the stack | CLI.LINFRA.11 stops the stack | CLI.LINFRA.12 lists the stack",
      read.rows.map((row) => `${row.id} ${row.does}`).join(" | "));

    writeFileSync(join(root, "docs", "03-behaviors", "a.md"), table(["CLI.LINFRA.10", "starts the stack"]), "utf8");
    ok("[MKT.SCRIPTS.84] a tree whose ids are each declared once returns no repeated id", declaredRows(root).repeated.length === 0,
      JSON.stringify(declaredRows(root).repeated));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — register` : `\n  all ${total} passed — register`);
process.exit(failed ? 1 : 0);
