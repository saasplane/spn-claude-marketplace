// The fixed proposal cases (RULE.DEVEX.AGENT.169): the matching logic, with the session runner stubbed. The live cases are run by hand, once, before a
// release; nothing here calls a model.
import { resolve } from "node:path";

const lib = await import(resolve(import.meta.dirname, "../../../../../scripts/lib/proposal-cases.mjs"));
const CASES = resolve(import.meta.dirname, "../../../../../tests/proposal-cases");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const stream = (text) => [{ type: "system" }, { type: "assistant", message: { content: [{ type: "text", text: "draft" }] } }, { type: "result", result: text }].map((one) => JSON.stringify(one)).join("\n");
const one = { id: "c", problem: "p", nearest: ["n"], expect: ["beside /remote", "private listener"], refuse: ["IAMModuleController\\s+is\\s+the\\s+place"] };

console.log("=== judging a final text");
ok("[MKT.SCRIPTS.434] a text that matches every `expect` and no `refuse` passes", lib.judge(one, "Add it beside /remote on the private listener.").length === 0);
ok("[MKT.SCRIPTS.434] red: a text missing one `expect` pattern fails, naming it", lib.judge(one, "Add it beside /remote.").some((fault) => fault.includes("private listener")));
ok("[MKT.SCRIPTS.434] red: a text matching a `refuse` pattern fails even when it matches every `expect`",
  lib.judge(one, "Beside /remote on the private listener, and IAMModuleController is the place.").some((fault) => fault.includes("refuses")));
ok("[MKT.SCRIPTS.434] patterns match without regard to case", lib.judge(one, "BESIDE /REMOTE on the PRIVATE LISTENER").length === 0);

console.log("\n=== reading the stream");
ok("[MKT.SCRIPTS.434] the result event's text is the final text", lib.finalTextOf(stream("the answer")) === "the answer");
ok("[MKT.SCRIPTS.434] with no result event the last assistant text is", lib.finalTextOf(JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text: "last words" }] } })) === "last words");
ok("[MKT.SCRIPTS.434] a torn line is skipped", lib.finalTextOf(`{not json\n${stream("whole")}`) === "whole");

console.log("\n=== the prompt holds only the problem and the nearest constructs");
{
  const prompt = lib.promptOf({ ...one, ask: "Say where." });
  ok("[MKT.SCRIPTS.434] it carries the problem, the nearest construct and the ask, and nothing of the expected answer", prompt.includes("p") && prompt.includes("- n") && prompt.includes("Say where.") && !prompt.includes("private listener") && !prompt.includes("beside /remote"), prompt);
}

console.log("\n=== running cases with the session stubbed");
{
  const cases = [one, { ...one, id: "d", problem: "another problem" }];
  const answers = { c: "Beside /remote on the private listener.", d: "Use IAMModuleController, which is the place." };
  const results = lib.runCases(cases, (prompt) => stream(prompt.startsWith("The problem") ? (prompt === lib.promptOf(cases[0]) ? answers.c : answers.d) : ""));
  ok("[MKT.SCRIPTS.434] each case gets its own verdict", results.length === 2 && results[0].passed && !results[1].passed && results[1].id === "d", JSON.stringify(results));
  const thrown = lib.runCases([one], () => { throw new Error("no claude"); });
  ok("[MKT.SCRIPTS.434] a session that does not run fails its case, naming why", !thrown[0].passed && thrown[0].failures[0].includes("no claude"));
}

console.log("\n=== when the cases run");
ok("[MKT.SCRIPTS.433] a diff touching the ideate skill, the panel or the card grammar runs them",
  lib.touchesProposalSurface(["packages/plugin-spn-devex/src/skills/ideate/SKILL.md"]) && lib.touchesProposalSurface(["packages/plugin-spn-devex/src/agents/spn-panel.md"])
    && lib.touchesProposalSurface(["x", "packages/plugin-spn-devex/src/refs/devex/workspace/docs/decision-cards.md"]));
ok("[MKT.SCRIPTS.433] a diff touching none of them does not", !lib.touchesProposalSurface(["packages/plugin-spn-devex/src/scripts/events/stop.ts", "packages/plugin-spn-devex/src/skills/execute/SKILL.md"]));

console.log("\n=== the three cases kept");
{
  const cases = lib.loadCases(CASES);
  ok("[MKT.SCRIPTS.435] the folder holds the three first cases, each with expect patterns", cases.length === 3 && cases.every((c) => c.expect.length > 0), cases.map((c) => c.id).join(" "));
  ok("[MKT.SCRIPTS.435] the Q22 case expects the framework route beside /remote and refuses IAM's own controller", cases[0].expect.some((p) => /remote/.test(p)) && cases[0].refuse.some((p) => /IAMModuleController/.test(p)));
  ok("[MKT.SCRIPTS.435] the code and docs cases expect needs-you and refuse a landed outcome", cases.slice(1).every((c) => c.expect.includes("needs-you") && c.refuse.some((p) => /landed/.test(p))));
  ok("[MKT.SCRIPTS.435] the Q22 case passes its own good answer and fails the wrong one",
    lib.judge(cases[0], "Send it to a route the framework registers beside /remote on the private listener.").length === 0
      && lib.judge(cases[0], "I recommend a new route on IAMModuleController.").length > 0);
  ok("[MKT.SCRIPTS.435] the helper cases pass a needs-you report and fail a landed one",
    lib.judge(cases[1], "outcome: needs-you\nunnamed: [QuotaLedgerRelay]").length === 0 && lib.judge(cases[1], "outcome: landed\nI used QuotaLedgerRelay").length > 0
      && lib.judge(cases[2], "outcome: needs-you\nunnamed: [RULE.REPORTS.CADENCE.412]").length === 0 && lib.judge(cases[2], "outcome: landed").length > 0);
}

console.log(`\n${failed ? `${failed} of ${total} FAILED` : `all ${total} passed`}`);
process.exit(failed ? 1 : 0);
