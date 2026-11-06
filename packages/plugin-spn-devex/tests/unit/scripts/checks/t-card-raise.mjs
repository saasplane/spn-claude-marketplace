// `checks/questions.ts` raiseFaults and the schema's raisedCardFaults — one card shape for a question and a suggestion, checked when it is
// raised or added and never when it is read (RULE.DEVEX.WORKSPACE.491 and .492, RULE.DEVEX.AGENT.168).
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { writeSwitch, telemetryFolder } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { CARD, cli, dataWorkspace, put } from "../../../helpers/workstream-fixture.mjs";

const { questionFaults } = await import("../../../../src/scripts/lib/workstream-schema.ts");
const { readQuestions } = await import("../../../../src/scripts/lib/workstream.ts");
const questionsOf = readQuestions;

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const { root, ws } = await dataWorkspace("card-raise");
const name = basename(ws);
const raise = (card, env = {}) => { put(root, "c.json", JSON.stringify(card)); return cli(root, ["workstream", "question", "raise", "031/N001", "--file", "c.json"], env); };
const { title, ...bare } = CARD;
const drop = (field) => { const { [field]: _gone, ...rest } = CARD; return rest; };

console.log("\n=== a card raised now carries the new fields");
{
  for (const field of ["nearest", "signs", "others"]) {
    const refused = raise(drop(field));
    ok(`[MKT.SCRIPTS.421] red: a card with no \`${field}\` is refused at raise`, refused.code !== 0 && refused.out.includes(`\`${field}\``), refused.out);
  }
  const noScope = raise({ ...CARD, recommended: { key: "A", reason: "r" } });
  ok("[MKT.SCRIPTS.421] red: a recommendation with no core or periphery is refused", noScope.code !== 0 && noScope.out.includes("recommended.scope"), noScope.out);
  const noMade = raise({ ...CARD, views: [{ lens: "Architect", text: "x" }] });
  ok("[MKT.SCRIPTS.421] red: a view with no `made` is refused", noMade.code !== 0 && noMade.out.includes("`made`"), noMade.out);
  const noLeave = raise({ ...CARD, options: [{ key: "A", does: "a", costs: "b" }, { key: "B", does: "c", costs: "d" }] });
  ok("[MKT.SCRIPTS.421] red: no leave-it option and no `noLeaveIt` is refused", noLeave.code !== 0 && noLeave.out.includes("leaveIt"), noLeave.out);
  const why = raise({ ...CARD, options: [{ key: "A", does: "a", costs: "b" }, { key: "B", does: "c", costs: "d" }], noLeaveIt: "nothing exists to leave" });
  ok("[MKT.SCRIPTS.421] green: `noLeaveIt` with its reason passes in place of a leave-it option", why.code === 0, why.out);
  ok("[MKT.SCRIPTS.421] and the record keeps nearest, signs and others", (() => { const card = readQuestions(ws)[0].card; return card.nearest === "spn-x" && Array.isArray(card.signs) && card.others.length > 0 && card.noLeaveIt; })());
}

console.log("\n=== nearest resolves");
{
  const gone = raise({ ...CARD, nearest: "spn-x/nowhere/at-all.ts" });
  ok("[MKT.SCRIPTS.422] red: a nearest path that does not exist is refused", gone.code !== 0 && gone.out.includes("no path that exists"), gone.out);
  put(root, "spn-x/pattern.ts", "export {};\n");
  const coded = CARD.options.map((option) => ({ ...option, code: "export const probe = 1;" }));
  const there = raise({ ...CARD, nearest: "spn-x/pattern.ts:1", options: coded, preview: { reason: "The options differ in one line." } });
  ok("[MKT.SCRIPTS.422] green: a path that exists, with its line, passes", there.code === 0, there.out);
  const none = raise({ ...CARD, nearest: "none" });
  ok("[MKT.SCRIPTS.422] green: `none` passes outside the builder's workspace", none.code === 0, none.out);
  const builder = raise({ ...CARD, nearest: "none" }, { SPN_DEVEX_AGENT_WORKSPACE: root });
  ok("[MKT.SCRIPTS.422] red: in the builder's workspace `none` must name an S<n> that exists", builder.code !== 0 && builder.out.includes("RULE.DEVEX.AGENT.168"), builder.out);
  cli(root, ["workstream", "suggestion", "add", "031/N001", "the book names the construct"]);
  const linked = raise({ ...CARD, nearest: "none", others: "the gap is S1" }, { SPN_DEVEX_AGENT_WORKSPACE: root });
  ok("[MKT.SCRIPTS.422] green: and passes once it names the gap's suggestion", linked.code === 0, linked.out);
}

console.log("\n=== signs call for fresh views, on record");
{
  const fresh = (lens, words = `${lens.toLowerCase()}.md`) => ({ lens, text: "read it fresh", made: "FRESH", words });
  const spoken = { lens: "Architect", text: "spoken", made: "SPOKEN" };
  const spans = { ...CARD, what: "Both `spn-x/a.ts:1` and `spn-y/b.ts:2` change.", signs: [], views: [spoken] };
  const one = raise(spans);
  ok("[MKT.SCRIPTS.423] the repository sign is added from the cited paths whatever the card declared, and one sign needs no fresh view", one.code === 0 && readQuestions(ws).at(-1).card.signs.includes("CROSSES_REPO"), one.out);
  const two = raise({ ...spans, signs: ["SETS_PATTERN"] });
  ok("[MKT.SCRIPTS.423] red: two signs with spoken views are refused, naming how many fresh views they call for", two.code !== 0 && two.out.includes("2 FRESH views"), two.out);
  put(root, `.spndevex/workstreams/open/${name}/notes/N001/work/architect.md`, "whole words\n");
  put(root, `.spndevex/workstreams/open/${name}/notes/N001/work/lead.md`, "whole words\n");
  const partner = raise({ ...spans, signs: ["CHANGES_PARTNER_SURFACE"], views: [fresh("Architect"), fresh("Lead")] });
  ok("[MKT.SCRIPTS.423] red: the partner sign without a fresh Partner view is refused", partner.code !== 0 && partner.out.includes("PARTNER"), partner.out);
  const nowords = raise({ ...spans, signs: ["SETS_PATTERN"], views: [fresh("Architect"), fresh("Lead", "missing.md")] });
  ok("[MKT.SCRIPTS.423] red: a fresh view whose words file is not there is refused", nowords.code !== 0 && nowords.out.includes("missing.md"), nowords.out);
  const quiet = raise({ ...spans, signs: ["SETS_PATTERN"], views: [fresh("Architect"), fresh("Lead")] });
  ok("[MKT.SCRIPTS.423] with recording off a fresh view with its words passes, and one note says the launch can't be seen", quiet.code === 0 && quiet.out.includes("can't be seen"), quiet.out);
  writeSwitch(root, "telemetry", true);
  const on = { SPN_TELEMETRY: "on" };
  const unrecorded = raise({ ...spans, signs: ["SETS_PATTERN"], views: [fresh("Architect"), fresh("Lead")] }, on);
  ok("[MKT.SCRIPTS.423] red: with recording on, a fresh view with no panel row for its lens is refused", unrecorded.code !== 0 && unrecorded.out.includes("no panel launch for ARCHITECT"), unrecorded.out);
  const folder = telemetryFolder(root);
  mkdirSync(folder, { recursive: true });
  for (const lens of ["ARCHITECT", "LEAD"])
    appendFileSync(join(folder, "hooks.jsonl"), `${JSON.stringify({ v: 1, mtype: "PANEL", id: lens, at: new Date().toISOString().slice(0, 19) + "Z", ms: 0, event: "SubagentStop", session: "s", agent: "a", workstream: name, arc: "N001", part: null, skill: null, work: null, retryOf: null, lens, verdict: "PASS" })}\n`);
  const recorded = raise({ ...spans, signs: ["SETS_PATTERN"], views: [fresh("Architect"), fresh("Lead")] }, on);
  ok("[MKT.SCRIPTS.423] green: and it passes once a panel row for each lens, workstream and arc is on record", recorded.code === 0, recorded.out);
}

console.log("\n=== a suggestion carries the same card");
{
  const added = (card, ref = "031/N001") => { put(root, "s.json", JSON.stringify(card)); return cli(root, ["workstream", "suggestion", "add", ref, "a suggestion with a card", "--file", "s.json"]); };
  const plain = cli(root, ["workstream", "suggestion", "add", "031", "a title only"]);
  ok("[MKT.SCRIPTS.424] the title-only form still raises a suggestion", plain.code === 0, plain.out);
  const half = added(drop("others"));
  ok("[MKT.SCRIPTS.424] red: a suggestion's card is held to the same new fields", half.code !== 0 && half.out.includes("`others`"), half.out);
  const whole = added(CARD);
  const kept = readFileSync(join(ws, "suggestions.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line)).at(-1);
  ok("[MKT.SCRIPTS.424] green: a whole card is kept on the record", whole.code === 0 && kept.card?.nearest === "spn-x" && kept.arc === "N001", whole.out);
  const noArc = added(CARD, "031");
  ok("[MKT.SCRIPTS.424] red: a card needs the arc whose fresh views it rests on", noArc.code !== 0 && noArc.out.includes("against an arc"), noArc.out);
  const codeBare = cli(root, ["workstream", "suggestion", "add", "031/N001", "a code thing", "--about", "CODE"]);
  ok("[MKT.SCRIPTS.527] red: a suggestion about CODE with no settled block is refused, naming the answers", codeBare.code !== 0 && codeBare.out.includes("settled") && codeBare.out.includes("refuses"), codeBare.out);
  const codeNoPreview = added({ ...CARD, nearest: "spn-x/packages/job/src/contract/states/job.ts" });
  ok("[MKT.SCRIPTS.527] red: a card whose nearest is a .ts file and a preview of none is refused, saying what to show", codeNoPreview.code !== 0 && codeNoPreview.out.includes("preview"), codeNoPreview.out);
  put(root, "spn-x/packages/job/src/contract/states/job.ts", "export {};\n");
  put(root, "s.json", JSON.stringify({ ...CARD, nearest: "spn-x/packages/job/src/contract/states/job.ts", options: CARD.options.map((option) => ({ ...option, code: "isActive: CDTBoolean;" })), preview: { reason: "r" } }));
  const codeWithPreview = cli(root, ["workstream", "suggestion", "add", "031/N001", "a code card with its fragment", "--file", "s.json"]);
  ok("[MKT.SCRIPTS.527] green: the same card with the fragment in its preview is taken and the record keeps about and preview", codeWithPreview.code === 0 && (() => { const last = readFileSync(join(ws, "suggestions.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line)).at(-1); return last.about === "CODE" && last.preview.includes("isActive: CDTBoolean;"); })(), codeWithPreview.out);
}

console.log("\n=== an old record reads clean");
{
  const { id, arc, state, raised, shownIn } = readQuestions(ws)[0];
  const old = { id, arc, title: "old", state, raised, shownIn, card: { why: "w", what: "a.ts:1", viewsLead: "v", views: [{ lens: "Architect", text: "t" }],
    options: [{ key: "A", does: "d", costs: "c" }, { key: "B", does: "d", costs: "c" }], recommended: { key: "A", reason: "r" } }, answer: null };
  ok("[MKT.SCRIPTS.425] a record raised before the new fields reads with no fault", questionFaults(old, "Q1").length === 0, questionFaults(old, "Q1").join("; "));
}

console.log("\n=== a fresh view's brief comes from the record");
{
  const brief = cli(root, ["workstream", "question", "brief", "031/Q1"]);
  ok("[MKT.SCRIPTS.426] the brief names the problem, the What and the nearest construct", brief.code === 0 && brief.out.includes(readQuestions(ws)[0].card.why) && brief.out.includes("The nearest existing construct: spn-x"), brief.out);
  ok("[MKT.SCRIPTS.426] and holds no option, and ends by saying the proposals come after the view answers",
    !/does: |one way|the other/.test(brief.out) && /The proposals are not in this brief/.test(brief.out.trim().split("\n").at(-1)), brief.out);
  ok("[MKT.SCRIPTS.426] and sends the view's words to the arc's work folder", brief.out.includes("notes/N001/work/"), brief.out);
  ok("[MKT.SCRIPTS.530] and tells each panel to answer first whether the premise is true and what would make the question unnecessary", /premise true/.test(brief.out) && /unnecessary/.test(brief.out) && brief.out.indexOf("premise") < brief.out.indexOf("what you would build"), brief.out);
}

console.log("\n=== a card about code carries code, and a card holds the three answers it was raised on");
{
  const { raisedCardFaults, suggestionFaults, suggestionRaisedFaults, cardAbout, nearestIsCode } = await import("../../../../src/scripts/lib/workstream-schema.ts");
  const coded = CARD.options.map((option) => ({ ...option, code: "isActive: CDTBoolean;" }));
  put(root, "spn-x/packages/job/src/contract/states/job.ts", "export {};\n");
  const job = raise({ ...CARD, nearest: "spn-x/packages/job/src/contract/states/job.ts" });
  ok("[MKT.SCRIPTS.522] red: a card whose nearest is a .ts file is about CODE, and none of its options carrying code is refused, saying what to show",
    job.code !== 0 && job.out.includes("about CODE") && job.out.includes("a few lines of code") && job.out.includes("Today"), job.out);
  const flow = raise({ ...CARD, about: "FLOW", nearest: "spn-x" });
  ok("[MKT.SCRIPTS.522] green: a card about a flow needs no code on its options", flow.code === 0, flow.out);
  ok("[MKT.SCRIPTS.522] the nearest of a .ts, .tsx or .sql file or a path under /src/ is code, and a folder or none is not",
    ["a/b.ts", "a/b.tsx:3", "m/1-x.sql", "pkg/src/x"].every(nearestIsCode) && !["spn-x", "none", "docs/a.md"].some(nearestIsCode) && cardAbout({ about: "FLOW", nearest: "a/b.ts" }) === "CODE" && cardAbout({}) === "OTHER");
  ok("[MKT.SCRIPTS.522] red: an option's code with no preview reason is refused", raisedCardFaults({ ...CARD, about: "CODE", options: coded }).some((fault) => fault.includes("preview.reason")));
  ok("[MKT.SCRIPTS.522] green: a code card with code on each option and a reason has no fault", raisedCardFaults({ ...CARD, about: "CODE", options: coded, preview: { reason: "r" } }).length === 0);
  ok("[MKT.SCRIPTS.522] red: an about outside CODE, FLOW and OTHER is refused", raisedCardFaults({ ...CARD, about: "WHATEVER" }).some((fault) => fault.includes("about")));
  const noSettled = raise(drop("settled"));
  ok("[MKT.SCRIPTS.528] red: a card with no `settled` block is refused, naming the three answers and the command for an engineering call", noSettled.code !== 0 && noSettled.out.includes("settled") && noSettled.out.includes("decision write"), noSettled.out);
  for (const field of ["answered", "premise"]) {
    const empty = raise({ ...CARD, settled: { ...CARD.settled, [field]: " " } });
    ok(`[MKT.SCRIPTS.528] red: an empty \`settled.${field}\` is refused`, empty.code !== 0 && empty.out.includes(`settled.${field}`), empty.out);
  }
  const wrongChange = raise({ ...CARD, settled: { ...CARD.settled, changes: "COLOUR" } });
  ok("[MKT.SCRIPTS.528] red: `settled.changes` outside PRODUCT, BOUNDARY, PROMISE and TRADE_OFF is refused", wrongChange.code !== 0 && wrongChange.out.includes("PRODUCT"), wrongChange.out);
  ok("[MKT.SCRIPTS.528] the refusal prints the lookup's findings first, so what is already answered is the command's finding", wrongChange.out.indexOf("already decided, written or built") >= 0 && wrongChange.out.indexOf("already decided, written or built") < wrongChange.out.indexOf("refuses a card"), wrongChange.out.slice(0, 300));
  const kept = readQuestions(ws).at(-1).card;
  ok("[MKT.SCRIPTS.528] a card raised whole keeps its settled block, its about and its option code in the record", kept.settled?.changes === "TRADE_OFF" && kept.about === "FLOW");
  const oldCard = { ...questionsOf(ws)[0], card: { ...questionsOf(ws)[0].card, settled: undefined, about: undefined } };
  ok("[MKT.SCRIPTS.528] a card already stored without the new fields reads clean: a record is never judged again", questionFaults({ ...oldCard, card: { ...oldCard.card } }, "q1").every((fault) => !fault.includes("settled") && !fault.includes("about")));
  ok("[MKT.SCRIPTS.527] a suggestion about code with an empty preview is refused, and one with a fragment or a link is taken",
    suggestionFaults({ id: "s1", title: "t", state: "raised", preview: "", words: null, about: "CODE" }, "S1").length === 1 &&
    suggestionFaults({ id: "s1", title: "t", state: "raised", preview: "isActive: CDTBoolean;", words: null, about: "CODE" }, "S1").length === 0 &&
    suggestionFaults({ id: "s1", title: "t", state: "raised", preview: "notes/N001/preview.html#s3a", words: null, about: "CODE" }, "S1").length === 0);
  ok("[MKT.SCRIPTS.527] a suggestion stored before the field, with no about and no preview, reads clean", suggestionFaults({ id: "s1", title: "t", state: "raised", preview: null, words: null }, "S1").length === 0);
  ok("[MKT.SCRIPTS.527] a suggestion added now needs its settled block", suggestionRaisedFaults({ id: "s2", title: "t" }).length > 0 && suggestionRaisedFaults({ id: "s2", settled: CARD.settled }).length === 0);
}

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
