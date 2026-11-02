// `workstream handover` — the handover block written from the data (MKT.HOOKS.326): the rows, the cards,
// the live orders and the pins, run as the agent types it, in a throwaway workspace.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { givesHandover, handoverColumns, HANDOVER_COLUMN } from "../../../../../src/scripts/events/stop.ts";
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
const part = (id, state) => ({ id, repo: "spn-x", work: "TEST", entries: [], tests: [], minutes: null, measuredFrom: null, waitsOn: [], model: "none", signature: "", state });
put(root, `${home}/arcs/N001/go.json`, JSON.stringify({ schemaVersion: 1, lead: "N001", scope: ["N001"], writtenAt: "2026-11-01T00:00:00Z", parts: [part("full-spn-x-2", "running"), part("full-spn-x-3", "running"), part("full-spn-x-4", "ready"), part("full-spn-x-5", "ready")] }));
put(root, `${home}/notes/N001/orders/full-spn-x-3.md`, "# order\n");
put(root, `${home}/notes/N001/orders/full-spn-x-2.md`, "# order\n");
put(root, `${home}/notes/N001/orders/full-spn-x-2.report.md`, "# report\n");
put(root, `${home}/notes/N001/orders/full-spn-x-5.md`, "# order\n");
put(root, `${home}/suggestions.jsonl`, [{ id: "s7", title: "raised one", state: "raised" }, { id: "s8", title: "shaped one", state: "shaped" }, { id: "s9", title: "decided", state: "decided" }].map((one) => JSON.stringify(one)).join("\n") + "\n");
put(root, "card.json", JSON.stringify(CARD));
cli(root, ["workstream", "question", "raise", "031/N001", "--file", "card.json"]);

console.log("=== versioned records (MKT.SCRIPTS.417)");
ok("[MKT.SCRIPTS.417] a card raised now carries v 1", lines(join(ws, "questions.jsonl")).at(-1)?.v === 1, JSON.stringify(lines(join(ws, "questions.jsonl")).at(-1)));
const added = cli(root, ["workstream", "suggestion", "add", "031/N001", "a probe suggestion"]);
ok("[MKT.SCRIPTS.417] a suggestion raised now carries v 1", added.code === 0 && lines(join(ws, "suggestions.jsonl")).at(-1)?.v === 1, added.out + JSON.stringify(lines(join(ws, "suggestions.jsonl")).at(-1)));

console.log("=== handover — the block is written from the data, with every label present (MKT.HOOKS.326)");
{
  const done = cli(root, ["workstream", "handover", "031", "--continue", "run the sheet", "--do-not-touch", "035's files"]);
  const text = done.out;
  for (const label of ["continue:", "model:", "read first:", "pins:", "state:", "live now:", "done when:", "do not touch:", "open:"])
    ok(`[MKT.HOOKS.326] the printed block carries \`${label}\``, text.includes(label), text);
  ok("[MKT.HOOKS.326] continue and do not touch are the agent's words", /continue:\s+run the sheet/.test(text) && /do not touch:\s+035's files/.test(text), text);
  ok("[MKT.HOOKS.326] state is read from the rows", /state:\s+[^.]*N001 [A-Z]+ 0\/\d+/.test(text), text);
  ok("[MKT.HOOKS.326] the pins are the facts' repository and commit", /pins:\s+[^.]*spn-x abc12345/.test(text), text);
  ok("[MKT.HOOKS.326] live now names the order whose part runs and has no report, and not the one that has", /live now:\s+[^.]*full-spn-x-3\b/.test(text) && !/live now:\s+[^.]*full-spn-x-2\b/.test(text) && !/live now:\s+[^.]*full-spn-x-4\b/.test(text), text);
ok("[MKT.SCRIPTS.409] a brief whose part is not running is not live", !/live now:\s+[^.]*full-spn-x-5\b/.test(text), text);
  ok("[MKT.HOOKS.326] open names the open card", /open:\s+[^.]*Q\d+/.test(text), text);
  ok("[MKT.SCRIPTS.410] open also lists a suggestion still raised or shaped as S<n>, and not a decided one", /open:\s+[^.]*S7/.test(text) && /open:\s+[^.]*S8/.test(text) && !/open:\s+[^.]*S9/.test(text), text);
  const last = lines(join(ws, "arcs", "N001", "log.jsonl")).at(-1);
  ok("[MKT.HOOKS.326] the same block is the last line of the arc's log", last?.kind === "note" && /^HANDOVER, /.test(last.note ?? "") && (last.note ?? "").includes("pins:"), JSON.stringify(last));
  const bare = cli(root, ["workstream", "handover", "031"]);
  ok("[MKT.HOOKS.326] with no words from the agent, the two labels still stand and say they are owed", bare.code === 0 && /continue:\s+[^\n]*(owed|you)/i.test(bare.out) && /do not touch:\s+[^\n]*(owed|you|nothing)/i.test(bare.out), bare.out);
  const log = (done.out.match(/^```text\n([\s\S]*?)\n```$/m) ?? [])[1] ?? "";
  ok("[MKT.SCRIPTS.409] the printed block sits in a text fence", done.out.startsWith("```text\n") && done.out.trimEnd().endsWith("```") && log !== "", done.out);
  const labels = ["continue:", "model:", "read first:", "pins:", "state:", "live now:", "done when:", "do not touch:", "open:"];
  ok("[MKT.SCRIPTS.409] each of the nine labels opens its own line", labels.every((label) => log.split("\n").some((line) => line.startsWith(label))), log);
  ok("[MKT.SCRIPTS.409] no blank line sits inside the block", !log.split("\n").some((line) => line.trim() === ""), log);
  const columns = [...handoverColumns(log).values()];
  ok("[MKT.SCRIPTS.410] handoverColumns reads every value at column 14", HANDOVER_COLUMN === 14 && columns.length === 9 && columns.every((column) => column === 14), JSON.stringify([...handoverColumns(log)]));
  ok("[MKT.HOOKS.326] givesHandover reads the printed block as whole", givesHandover(done.out), done.out);
  const long = Array.from({ length: 30 }, (_, at) => `word${at}`).join(" ");
  const wrapped = cli(root, ["workstream", "handover", "031", "--continue", long, "--do-not-touch", "nothing"]);
  const wrappedLines = ((wrapped.out.match(/^```text\n([\s\S]*?)\n```$/m) ?? [])[1] ?? "").split("\n");
  const at = wrappedLines.findIndex((line) => line.startsWith("continue:"));
  ok("[MKT.SCRIPTS.409] a continue value over 100 characters wraps, each continuation line indented to column 14",
    wrappedLines[at + 1]?.startsWith(" ".repeat(14) + "word") && !wrappedLines[at + 1].startsWith(" ".repeat(15)) && wrappedLines[at].length <= 14 + 100, wrappedLines.join("\n"));
  ok("[MKT.HOOKS.326] a wrapped block is still read as whole", givesHandover(wrapped.out), wrapped.out);
  const oneLine = lines(join(ws, "arcs", "N001", "log.jsonl")).filter((entry) => /^HANDOVER, /.test(entry.note ?? "")).at(-1);
  ok("[MKT.SCRIPTS.478] the log's last handover is one line that starts HANDOVER and holds no newline", Boolean(oneLine) && !oneLine.note.includes("\n") && oneLine.note.includes("continue: word0"), JSON.stringify(oneLine));
  const none = cli(root, ["workstream", "handover"]);
  ok("[MKT.HOOKS.326] red: no workstream named is refused", none.code === 2 && none.out.includes("needs a workstream"), none.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — handover` : `\n  all ${total} passed — handover`);
process.exit(failed ? 1 : 0);
