// `lib/usage.ts` — what each model turn cost, read from a transcript into `usage.jsonl` (RULE.DEVEX.AGENT.082): a reply timed on one
// clock that a line stamped earlier never moves back, a turn counted once by its message id, the row's own stamp and counts, and the
// order a helper was launched for (MKT.SCRIPTS.179, MKT.SCRIPTS.326).
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { launchedWork, recordUsage, turnsIn } from "../../../../src/scripts/lib/usage.ts";

delete process.env.SPN_TELEMETRY;
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const same = (label, got, want) => ok(label, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

/** A transcript line: a user prompt or an assistant reply stamped `at`, with the message id and counts of a reply. */
const user = (at, content = "go") => JSON.stringify({ type: "user", timestamp: at, message: { role: "user", content } });
const reply = (at, id, usage = {}, model = "claude-opus-5-5") => JSON.stringify({ type: "assistant", timestamp: at,
  message: { id, model, role: "assistant", usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, ...usage } } });
const lines = (...all) => `${all.join("\n")}\n`;

console.log("=== one clock for model time");
const back = turnsIn(lines(
  user("2026-10-31T12:00:00.000Z", "do it"),
  JSON.stringify({ type: "user", isCompactSummary: true, timestamp: "2026-10-31T07:30:00.000Z", message: { role: "user", content: "summary" } }),
  reply("2026-10-31T12:00:07.700Z", "msg_a")));
same("[MKT.SCRIPTS.179] a summary line stamped four and a half hours earlier moves nothing: the reply is timed from the prompt", back.map((one) => one.ms), [7700]);

const note = turnsIn(lines(
  user("2026-10-31T12:00:00.000Z"), reply("2026-10-31T12:00:05.000Z", "msg_a"),
  user("2026-10-31T12:10:00.000Z", "<task-notification>helper done</task-notification>"), reply("2026-10-31T12:10:03.200Z", "msg_b")));
same("[MKT.SCRIPTS.179] a background helper's notification times the reply after it, not the idle ten minutes", note.map((one) => one.ms), [5000, 3200]);

console.log("\n=== a turn is counted once, by its message id");
const streamed = turnsIn(lines(
  user("2026-10-31T12:20:00.000Z"),
  reply("2026-10-31T12:20:01.000Z", "msg_s", { output_tokens: 1, cache_read_input_tokens: 500 }, "claude-opus-5-5"),
  reply("2026-10-31T12:20:02.000Z", "msg_s", { output_tokens: 5, cache_read_input_tokens: 500 }, "claude-sonnet-5-5"),
  reply("2026-10-31T12:20:04.000Z", "msg_s", { output_tokens: 40, cache_read_input_tokens: 520, cache_creation_input_tokens: 9 }, "claude-sonnet-5-5")));
same("[MKT.SCRIPTS.326] a turn streamed over three lines is one turn", streamed.length, 1);
same("it carries the id, and the counts of its last line", [streamed[0].id, streamed[0].tokens], ["msg_s", { in: 1, out: 40, cacheRead: 520, cacheWrite: 9 }]);
same("and the model, the stamp and the model time of its first line", [streamed[0].model, streamed[0].at, streamed[0].ms], ["claude-opus-5-5", "2026-10-31T12:20:01.000Z", 1000]);

console.log("\n=== the row written");
const root = realpathSync(mkdtempSync(join(tmpdir(), "usage-")));
try {
  mkdirSync(join(root, ".spndevex", ".debug"), { recursive: true });
  writeFileSync(join(root, ".spndevex", ".debug", "switches.json"), "{\"telemetry\": true}\n");
  const transcript = join(root, "t.jsonl");
  writeFileSync(transcript, lines(user("2026-10-31T12:20:00.000Z"),
    reply("2026-10-31T12:20:01.000Z", "msg_s", { input_tokens: 3, output_tokens: 2 }),
    reply("2026-10-31T12:20:04.000Z", "msg_s", { input_tokens: 3, output_tokens: 40, cache_read_input_tokens: 520, cache_creation_input_tokens: 9 })));
  const facts = { session: "w1", agent: null, workstream: "036-x", arc: "N017", part: null, skill: null };
  recordUsage(root, facts, transcript);
  const log = join(root, ".spndevex", ".debug", "telemetry", "usage.jsonl");
  const rows = readFileSync(log, "utf8").split("\n").filter(Boolean).map((one) => JSON.parse(one));
  same("[MKT.SCRIPTS.326] the turn is one row, a TURN of version 1 whose id is the message id", [rows.length, rows[0]?.v, rows[0]?.mtype, rows[0]?.id], [1, 1, "TURN", "msg_s"]);
  same("its tokens are the line's own counts: fresh, output, cache read and cache write", rows[0]?.tokens, { in: 3, out: 40, cacheRead: 520, cacheWrite: 9 });
  same("its at is when the turn started, the reply's own stamp less its model time, to the second", [rows[0]?.at, rows[0]?.ms], ["2026-10-31T12:20:00Z", 1000]);
  same("its head names the window, the workstream and the arc, and the event Stop", [rows[0]?.session, rows[0]?.workstream, rows[0]?.arc, rows[0]?.event], ["w1", "036-x", "N017", "Stop"]);
  recordUsage(root, facts, transcript);
  same("reading the same transcript again adds no row", readFileSync(log, "utf8").split("\n").filter(Boolean).length, 1);

  console.log("\n=== the work a helper was launched for");
  const orders = join(root, ".spndevex", "workstreams", "open", "036-x", "notes", "N017", "orders");
  mkdirSync(orders, { recursive: true });
  const order = join(orders, "code-spn-claude-marketplace-4.md");
  writeFileSync(order, "---\ngo: \"N016\"\npart: \"code-spn-claude-marketplace-4\"\n---\n# Part\n");
  const launched = (name, prompt) => { const file = join(root, name); writeFileSync(file, lines(user("2026-10-31T12:00:00.000Z", prompt))); return file; };
  same("[MKT.SCRIPTS.326] the order the first prompt names gives the workstream, the arc and part of its front matter, and the part's work",
    launchedWork(launched("a.jsonl", `Do the work in ${order} now.`)),
    { workstream: "036-x", arc: "N016", part: "code-spn-claude-marketplace-4", work: "CODE" });
  const bare = join(orders, "docs-spn-foundation-1.md");
  same("an order with no file to read gives the arc of its folder and its own name as the part",
    launchedWork(launched("b.jsonl", `Read ${bare}.`)), { workstream: "036-x", arc: "N017", part: "docs-spn-foundation-1", work: "DOCS" });
  same("a prompt naming no order gives null", launchedWork(launched("c.jsonl", "fix the typo in the readme")), null);
  same("a transcript that is not there gives null", launchedWork(join(root, "none.jsonl")), null);
  same("and no transcript gives null", launchedWork(undefined), null);
} finally { rmSync(root, { recursive: true, force: true }); }

console.log(failed ? `\n  ${failed} of ${total} FAILED — usage` : `\n  all ${total} passed — usage`);
process.exit(failed ? 1 : 0);
