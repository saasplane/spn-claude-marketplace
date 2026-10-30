// `checks/questions.ts` — every card on a page is its record rendered. The three checks each fail
// once on a page that breaks them, and pass once the page is what the record renders.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CARD, cli, dataWorkspace, put } from "../../../helpers/workstream-fixture.mjs";

const { cardsOn, cardsDiffer, checkQuestions, handMadeCards, openWithoutCard } = await import("../../../../src/scripts/checks/questions.ts");
const { cardHtml, readQuestions, writePreviewStatus } = await import("../../../../src/scripts/lib/workstream.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const { root, ws } = await dataWorkspace("questions");
const page = join(ws, "approach.html");
const preview = join(ws, "notes", "N001", "preview.html");
put(root, "card.json", JSON.stringify(CARD));
const raised = cli(root, ["workstream", "question", "raise", "031/N001", "--file", "card.json"]);
ok("a card is raised through its command", raised.code === 0 && /^q1 · open · approach.html Open — Q1/.test(raised.out), raised.out);
const shown = cli(root, ["workstream", "question", "show", "031/q1", "--in", "notes/N001/preview.html"]);
ok("and shown on its arc's preview", shown.code === 0 && /q1 · shown in 1 preview/.test(shown.out), shown.out);
const records = readQuestions(ws);

console.log("\n=== a card is the markup, not the anchor");
{
  const text = readFileSync(page, "utf8");
  const cards = cardsOn(text);
  ok("the rendered card is read, inside the open block", cards.length === 1 && cards[0].id === "q1" && cards[0].inBlock, JSON.stringify(cards.map((c) => [c.id, c.inBlock])));
  ok("an answered card's anchor on a statement is no card", cardsOn('<li id="q76">the page follows the template</li>').length === 0);
}

console.log("\n=== hand-made — no card on a page that is not in the record (the PreToolUse hook)");
{
  const before = readFileSync(page, "utf8");
  const forged = cardHtml({ id: "q99", title: "a card typed by hand", card: records[0].card }, "");
  const after = before.replace("</section>\n<section id=\"s3\"", `${forged}\n</section>\n<section id="s3"`);
  const red = handMadeCards(before, after, records);
  ok("red: a card with no record fails, in the hook's words", red.some((line) => line === "q99 has no record: raise it with `workstream question raise`"), red.join(" | "));
  const copied = before.replace("</section>\n<section id=\"s3\"", `${cardHtml(records[0], "")}\n</section>\n<section id="s3"`);
  ok("red: a recorded card copied outside the block fails", handMadeCards(before, copied, records).some((line) => /q1's card stands outside the open block/.test(line)));
  ok("green: a write that adds no card passes", handMadeCards(before, before.replace("<p>the probe</p>", "<p>the probe, said better</p>"), records).length === 0);
  const verdict = checkQuestions({ tool_name: "Write", cwd: root, tool_input: { file_path: page, content: after } });
  ok("red: the hook's check refuses that write", verdict?.deny?.includes("q99 has no record"), JSON.stringify(verdict));
  const edit = checkQuestions({ tool_name: "Edit", cwd: root, tool_input: { file_path: page, old_string: "<h4 id=\"c1\">The probe</h4>", new_string: "<h4 id=\"c1\">The probe, renamed</h4>" } });
  ok("green: an edit elsewhere on the page passes", edit === null, JSON.stringify(edit));
}

console.log("\n=== on-page — no open record without its card on the approach page (state check)");
{
  const good = readFileSync(page, "utf8");
  ok("green: the raised card stands on the approach page", openWithoutCard(ws, records).length === 0);
  writeFileSync(page, good.replace(/<div class="sds-open">[\s\S]*?<div class="sds-recommended">[\s\S]*?<\/div>\n\s*<\/div>\n/, ""));
  const red = openWithoutCard(ws, records);
  ok("red: an open record whose card was taken off fails", red.includes("q1 is open and its card is not on approach.html"), red.join(" | "));
  writeFileSync(page, good);
  ok("green: the card back, it passes", openWithoutCard(ws, records).length === 0);
}

console.log("\n=== same — each page's card equal to its record's (state check)");
{
  ok("green: the preview's card is its record's", cardsDiffer(ws, records).length === 0, cardsDiffer(ws, records).join(" | "));
  const good = readFileSync(preview, "utf8");
  writeFileSync(preview, good.replace("It costs less.", "It costs less, and reads better."));
  const red = cardsDiffer(ws, records);
  ok("red: a preview's card drifting from its record fails", red.includes("notes/N001/preview.html's q1 differs from its record"), red.join(" | "));
  writeFileSync(preview, good);
  ok("green: the card rendered again, it passes", cardsDiffer(ws, records).length === 0);
  const answered = cli(root, ["workstream", "question", "answer", "031/q1", "--key", "A", "--words", "Q1 - A"]);
  ok("an answer takes the card off both pages", answered.code === 0 && /q1 · answered A · off 2 pages · owed: N001's What, its Log line/.test(answered.out), answered.out);
  const after = readQuestions(ws);
  ok("green: nothing differs once the card is off every page", cardsDiffer(ws, after).length === 0 && openWithoutCard(ws, after).length === 0, cardsDiffer(ws, after).join(" | "));
  writeFileSync(page, readFileSync(page, "utf8").replace("<!-- /spn:generated -->\n</section>\n</div>", `${cardHtml(after[0], "  ")}\n  <!-- /spn:generated -->\n</section>\n</div>`));
  ok("red: an answered card left in Open fails", cardsDiffer(ws, after).includes("q1 is answered and its card still stands on approach.html"), cardsDiffer(ws, after).join(" | "));
}

console.log("\n=== shownIn is read for open cards only (state check)");
{
  const gone = "notes/N001/removed-preview.html";
  const clean = readQuestions(ws);
  const answeredNaming = [{ ...clean[0], state: "answered", shownIn: [gone] }];
  ok("green: an answered card naming a page that is gone leaves no finding",
    !cardsDiffer(ws, answeredNaming).some((line) => line.includes(gone)), cardsDiffer(ws, answeredNaming).join(" | "));
  const openNaming = [{ ...clean[0], state: "open", shownIn: [gone] }];
  ok("red: an open card naming a page that is gone is still a finding",
    cardsDiffer(ws, openNaming).includes(`${gone} is named by a card's \`shownIn\` and is not there`), cardsDiffer(ws, openNaming).join(" | "));
}

console.log("\n=== a preview's Open follows the records on every write");
{
  // The template's Open, as `arc edit` copies it into a new preview: the block's markers around slots.
  const templateOpen = [
    `<section id="s5" data-block="reasons">`,
    `  <!-- spn:generated open — do not edit inside these markers; \`workstream question show\` writes it from questions.jsonl -->`,
    `  <div class="sds-section-head"><h2>Open &mdash; Q{{n}} &middot; Q{{n}}</h2></div>`,
    `  <div class="sds-open"><h4 id="q{{n}}">Q{{n}} &middot; {{The question}}</h4></div>`,
    `  <!-- /spn:generated -->`,
    `</section>`,
  ].join("\n");
  const bare = readFileSync(preview, "utf8");
  ok("the preview holds no Open once its last card is answered", !bare.includes("spn:generated open"));
  writeFileSync(preview, bare.replace(/<\/div>\s*$/, `${templateOpen}\n</div>\n`));
  writePreviewStatus(ws);
  const cleared = readFileSync(preview, "utf8");
  ok("[MKT.HOOKS.83] red first: a workstream write drops the template's empty Open from a preview no card is shown on",
    !cleared.includes("spn:generated open") && !cleared.includes("{{"), cleared.slice(-400));
  put(root, "card2.json", JSON.stringify({ ...CARD, title: "a second probe" }));
  cli(root, ["workstream", "question", "raise", "031/N001", "--file", "card2.json"]);
  cli(root, ["workstream", "question", "show", "031/q2", "--in", "notes/N001/preview.html"]);
  writePreviewStatus(ws);
  const kept = readFileSync(preview, "utf8");
  ok("[MKT.HOOKS.83] green: a preview showing an open card keeps its Open through the same write",
    kept.includes("spn:generated open") && cardsOn(kept).some((card) => card.id === "q2"), JSON.stringify(cardsOn(kept).map((card) => card.id)));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — questions` : `\n  all ${total} passed — questions`);
process.exit(failed ? 1 : 0);
