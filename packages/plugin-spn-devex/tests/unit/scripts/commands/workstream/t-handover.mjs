// `workstream handover` — the handover block written from the data (MKT.HOOKS.326): the rows, the cards,
// the live orders and the pins, run as the agent types it, in a throwaway workspace.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CARD, cli, dataWorkspace, put } from "../../../../helpers/workstream-fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const lines = (path) => (existsSync(path) ? readFileSync(path, "utf8") : "").split("\n").filter(Boolean).map((line) => JSON.parse(line));

const { root, ws } = await dataWorkspace("handover");
const home = ".spndevex/workstreams/open/031-probe";
put(root, `${home}/arcs/N001/facts.jsonl`, `${JSON.stringify({ id: "f1", fact: "a thing", source: "spn-x/a.ts:1", commit: "abc12345", readAt: "2026-10-31T10:00+05:30", usedBy: [] })}\n`);
put(root, `${home}/notes/N001/orders/3.md`, "# order\n");
put(root, `${home}/notes/N001/orders/2.md`, "# order\n");
put(root, `${home}/notes/N001/orders/2.report.md`, "# report\n");
put(root, "card.json", JSON.stringify(CARD));
cli(root, ["workstream", "question", "raise", "031/N001", "--file", "card.json"]);

console.log("=== handover — the block is written from the data, with every label present (MKT.HOOKS.326)");
{
  const done = cli(root, ["workstream", "handover", "031", "--continue", "run the sheet", "--do-not-touch", "035's files"]);
  const text = done.out;
  for (const label of ["continue:", "model:", "read first:", "pins:", "state:", "live now:", "done when:", "do not touch:", "open:"])
    ok(`[MKT.HOOKS.326] the printed block carries \`${label}\``, text.includes(label), text);
  ok("[MKT.HOOKS.326] continue and do not touch are the agent's words", text.includes("continue: run the sheet") && text.includes("do not touch: 035's files"), text);
  ok("[MKT.HOOKS.326] state is read from the rows", /state: [^.]*N001 [A-Z]+ 0\/\d+/.test(text), text);
  ok("[MKT.HOOKS.326] the pins are the facts' repository and commit", /pins: [^.]*spn-x abc12345/.test(text), text);
  ok("[MKT.HOOKS.326] live now names the order that has no report, and not the one that has", /live now: [^.]*\b3\b/.test(text) && !/live now: [^.]*\b2\b/.test(text), text);
  ok("[MKT.HOOKS.326] open names the open card", /open: [^.]*q\d+/.test(text), text);
  const last = lines(join(ws, "arcs", "N001", "log.jsonl")).at(-1);
  ok("[MKT.HOOKS.326] the same block is the last line of the arc's log", last?.kind === "note" && /^HANDOVER, /.test(last.note ?? "") && (last.note ?? "").includes("pins:"), JSON.stringify(last));
  const bare = cli(root, ["workstream", "handover", "031"]);
  ok("[MKT.HOOKS.326] with no words from the agent, the two labels still stand and say they are owed", bare.code === 0 && /continue: [^\n]*(owed|you)/i.test(bare.out) && /do not touch: [^\n]*(owed|you|nothing)/i.test(bare.out), bare.out);
  const none = cli(root, ["workstream", "handover"]);
  ok("[MKT.HOOKS.326] red: no workstream named is refused", none.code === 2 && none.out.includes("needs a workstream"), none.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — handover` : `\n  all ${total} passed — handover`);
process.exit(failed ? 1 : 0);
