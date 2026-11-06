// `workstream decision` — an engineering call the agent decided: logged with what settles it and the one line that reverses it, listed by
// `decision show`, and counted by `state show` (MKT.SCRIPTS.529).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cli, dataWorkspace } from "../../../../helpers/workstream-fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const { root, ws } = await dataWorkspace("decision");
const args = ["workstream", "decision", "write", "031/N001", "--said", "org_types becomes iam_org_type[]", "--because", "purpose",
  "--ref", "spn-platform-ts/packages/module-server-iam-ts/src/migrations/1780000002000-iam-org.ts:87", "--reverse", "say 'keep the string list' and the column stays VARCHAR(30)[]"];

console.log("=== a call is logged with its reversal");
{
  const wrote = cli(root, args);
  const line = readFileSync(join(ws, "arcs", "N001", "log.jsonl"), "utf8").trim().split("\n").map((one) => JSON.parse(one)).find((one) => one.kind === "decided");
  ok("[MKT.SCRIPTS.529] decision write logs the call, what settles it, the reference and the one line that reverses it", wrote.code === 0 && line.because === "purpose" && line.reverse.startsWith("say 'keep") && line.ref.endsWith("iam-org.ts:87"), wrote.out);
  ok("[MKT.SCRIPTS.529] and says it is the agent's, to be reported in one line", wrote.out.includes("decided by the agent") && wrote.out.includes("report it in one line") && wrote.out.includes("reverse:"), wrote.out);
  const shown = cli(root, ["workstream", "decision", "show", "031/N001"]);
  ok("[MKT.SCRIPTS.529] decision show lists it with its reversal", shown.out.includes("org_types becomes") && shown.out.includes("reverse: say 'keep"), shown.out);
  const state = cli(root, ["workstream", "state", "show", "031"]);
  ok("[MKT.SCRIPTS.529] state show counts the call and lists it with its one-line reversal", state.out.includes("1 call decided by the agent") && state.out.includes("(reverse: say 'keep the string list'"), state.out);
}

console.log("\n=== a call with nothing settling it is refused");
{
  const noReverse = cli(root, args.slice(0, -2));
  ok("[MKT.SCRIPTS.529] red: a call with no reversal is refused", noReverse.code !== 0 && noReverse.out.includes("--reverse"), noReverse.out);
  const bad = cli(root, [...args.slice(0, 6), "--because", "hunch", ...args.slice(8)]);
  ok("[MKT.SCRIPTS.529] red: what settles it is one of rule, book, code or purpose", bad.code !== 0 && bad.out.includes("rule"), bad.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream decision` : `\n  all ${total} passed — workstream decision`);
process.exit(failed ? 1 : 0);
