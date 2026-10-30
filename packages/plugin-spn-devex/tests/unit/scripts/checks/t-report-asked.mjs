// `checks/report-asked.ts` — a report is written when somebody asks for one (RULE.DEVEX.WORKSPACE.212).
//
// The check reads the user prompts of the window's transcript, from the end.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { workspace } from "../../../helpers/fixture.mjs";

const { checkReportAsked } = await import("../../../../src/scripts/checks/report-asked.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const verdictOf = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");
const write = (file_path, content, tool_name = "Write") =>
  ({ tool_name, cwd: "/repo", tool_input: tool_name === "Write" ? { file_path, content } : { file_path, new_string: content } });

const line = (type, content) => JSON.stringify({ type, message: { role: type, content } });
function transcript(name, prompts) {
  const root = workspace(name, { "x/README.md": "x\n" });
  const path = join(root, "t.jsonl");
  writeFileSync(path, prompts.map((p) => line("user", p)).join("\n") + "\n", "utf8");
  return path;
}
const REPORT = "/repo/docs/artifacts/reports/coverage.html";
const reporting = (transcript_path, file_path = REPORT) => ({ ...write(file_path, "<html></html>"), transcript_path });

console.log("=== an unasked report");
const refused = checkReportAsked(reporting(transcript("report-unasked", ["fix the build", [{ type: "text", text: "now the tests" }]])));
ok("[MKT.HOOKS.140] a report write with no prompt asking for one is refused", verdictOf(refused) === "deny", JSON.stringify(refused));
ok("[MKT.HOOKS.140] the refusal says to write one only when somebody asks", (refused?.deny ?? "").includes("only when somebody asks"), refused?.deny);

console.log("\n=== an asked report");
ok("[MKT.HOOKS.140] a report some prompt asks for passes",
  verdictOf(checkReportAsked(reporting(transcript("report-asked", ["fix the build", "write the coverage report"])))) === "silent");
ok("[MKT.HOOKS.140] a tool result that says report is not a prompt",
  verdictOf(checkReportAsked(reporting(transcript("report-result", ["fix it", [{ type: "tool_result", content: "the report" }]])))) === "deny");
ok("[MKT.HOOKS.140] a write elsewhere is not judged",
  verdictOf(checkReportAsked(reporting(transcript("report-else", ["fix it"]), "/repo/docs/a.md"))) === "silent");
ok("[MKT.HOOKS.140] no transcript to read is not a finding",
  verdictOf(checkReportAsked(write(REPORT, "x"))) === "silent");

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);

