// `lib/working-detail.ts` — the one list of the agent's working detail a reader never sees: a row or order
// number, an order's file, a bare suggestion number, a rule id and a check's file name. Each is found with the
// sentence to rewrite; an arc number and a card number beside its words pass.
import { join } from "node:path";
import { LIB } from "../../../helpers/harness.mjs";

const { findWorkingDetail } = await import(join(LIB, "working-detail.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const kinds = (text) => findWorkingDetail(text).map((one) => one.kind).join();

console.log("=== each kind of working detail is found with its sentence");
{
  const row = findWorkingDetail("The plan is set. Row 3 of N006 is ready to run.");
  ok("[MKT.HOOKS.113] a row number is found with the sentence that holds it", row.length === 1 && row[0].kind === "row" && row[0].sentence === "Row 3 of N006 is ready to run.", JSON.stringify(row));
  ok("[MKT.HOOKS.113] an order number is found", kinds("I wrote order 2 for the child.") === "order", kinds("I wrote order 2 for the child."));
  ok("[MKT.HOOKS.113] an order's file is found", kinds("It is saved in notes/N006/orders/3.report.md for later.") === "order file", kinds("It is saved in notes/N006/orders/3.report.md for later."));
  ok("[MKT.HOOKS.113] a suggestion named by its number alone is found", kinds("Needs you: S27 and S28.") === "suggestion", kinds("Needs you: S27 and S28."));
  ok("[MKT.HOOKS.113] a rule id is found", kinds("This follows RULE.DEVEX.WORKSPACE.069 closely.") === "rule", kinds("This follows RULE.DEVEX.WORKSPACE.069 closely."));
  ok("[MKT.HOOKS.113] a check's file name is found", kinds("The fix is in standing-grant.ts now.") === "check file", kinds("The fix is in standing-grant.ts now."));
  const two = findWorkingDetail("Row 4 is done. Nothing else changed. Order 5 follows.");
  ok("[MKT.HOOKS.113] two sentences with detail are two findings, and the plain one none", two.length === 2 && two[1].sentence === "Order 5 follows.", JSON.stringify(two));
}

console.log("\n=== what passes");
{
  ok("[MKT.HOOKS.114] an arc number passes", findWorkingDetail("N006 is decided and its preview is open.").length === 0);
  ok("[MKT.HOOKS.114] a card number beside its words passes", findWorkingDetail("Q12 (should the check refuse or note?) is waiting on you.").length === 0);
  ok("[MKT.HOOKS.114] a suggestion beside its title passes", findWorkingDetail("S27 (shorter arc titles) is parked.").length === 0);
  ok("[MKT.HOOKS.114] plain words about rows and orders pass", findWorkingDetail("The table has a row for each order of business.").length === 0);
  ok("[MKT.HOOKS.114] a plain source file name passes", findWorkingDetail("I edited index.html and README.md.").length === 0);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — working detail` : `\n  all ${total} passed — working detail`);
process.exit(failed ? 1 : 0);
