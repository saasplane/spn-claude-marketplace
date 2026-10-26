// `commands/plugin/migration.ts` — `plugin migration show · check · write`, run as the agent types
// them in a throwaway workspace: a workstream still in the old shape, then the same workspace once it
// is kept as data, then a ledger that does not read.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cli } from "../../../../helpers/workstream-fixture.mjs";
import { workspace } from "../../../../helpers/fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const OLD = ".spndevex/workstreams/open/031-probe";
const root = workspace("migration-command", {
  [`${OLD}/approach.html`]: "<h1>031</h1>\n",
  [`${OLD}/arcs/N001-probe.md`]: "# N001 — the probe\n",
}, [], { migrated: false });
const ledger = join(root, ".spndevex", "migrations.jsonl");
const read = (path) => { try { return readFileSync(path, "utf8"); } catch { return null; } };

console.log("=== help lists the subject");
{
  const help = cli(root, ["help"]);
  for (const words of ["plugin migration show", "plugin migration check", "plugin migration write"]) ok(`help lists \`${words}\``, help.out.includes(words), words);
}

console.log("\n=== a workstream in the old shape: 001 pending");
{
  const shown = cli(root, ["plugin", "migration", "show"]);
  ok("show names 001 pending, with what changed", shown.code === 0 && /001 · spn-devex \S+ · pending — 1 place\(s\)/.test(shown.out) && /keeps each arc as data/.test(shown.out), shown.out);
  const checked = cli(root, ["plugin", "migration", "check"]);
  ok("red: check exits 1, naming the place and how it is applied",
    checked.code === 1 && checked.out.includes("open/031-probe: 1 arc(s) kept as Markdown under arcs/") && /its steps are your first task/.test(checked.out), checked.out);
  const json = JSON.parse(cli(root, ["plugin", "migration", "check", "--json"]).out);
  ok("check --json gives the pending one as data", json.pending[0].id === "001" && json.pending[0].found.length === 1, JSON.stringify(json));
  const written = cli(root, ["plugin", "migration", "write", "001"]);
  ok("red: write 001 exits 1 and prints the steps, while the old shape stands", written.code === 1 && /001 · not recorded/.test(written.out) && /\n {4}1\. /.test(written.out), written.out);
  ok("and the ledger is not written", read(ledger) === null);
}

console.log("\n=== typed wrongly");
{
  const none = cli(root, ["plugin", "migration", "write"]);
  ok("red: write with no id exits 2", none.code === 2 && none.out.includes("needs the id of a migration"), none.out);
  const unknown = cli(root, ["plugin", "migration", "write", "999"]);
  ok("red: an id the plugin does not ship exits 2, naming the ones it does", unknown.code === 2 && unknown.out.includes("knows no migration `999` — this plugin ships 001"), unknown.out);
}

console.log("\n=== the workstream moved to the data layout: write records it");
{
  rmSync(join(root, OLD, "arcs", "N001-probe.md"));
  const written = cli(root, ["plugin", "migration", "write", "001", "--steps-done"]);
  ok("write 001 --steps-done records the agent's work once the check finds nothing", written.code === 0 && written.out.trim() === "001 · recorded · by the agent's steps", written.out);
  const line = JSON.parse(read(ledger).trim());
  ok("the ledger holds its one line", line.id === "001" && line.plugin === "spn-devex" && line.how === "agent", read(ledger));
  const checked = cli(root, ["plugin", "migration", "check"]);
  ok("check passes", checked.code === 0 && /ok · \d+ migration\(s\), none pending/.test(checked.out), checked.out);
  const shown = cli(root, ["plugin", "migration", "show"]);
  ok("show says when, by whom and how", /001 · spn-devex \S+ · applied \d{4}-\d\d-\d\dT\d\d:\d\d[+-]\d\d:\d\d by \S+ \(agent\)/.test(shown.out), shown.out);
}

console.log("\n=== a ledger that does not read");
{
  writeFileSync(ledger, "{ broken\n", "utf8");
  const checked = cli(root, ["plugin", "migration", "check"]);
  ok("red: check exits 1 and names the line", checked.code === 1 && /migrations\.jsonl line 1 is not JSON/.test(checked.out), checked.out);
  const written = cli(root, ["plugin", "migration", "write", "001"]);
  ok("red: write exits 1, and the ledger is not written over", written.code === 1 && /Nothing was written/.test(written.out) && read(ledger) === "{ broken\n", written.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plugin migration` : `\n  all ${total} passed — plugin migration`);
process.exit(failed ? 1 : 0);
