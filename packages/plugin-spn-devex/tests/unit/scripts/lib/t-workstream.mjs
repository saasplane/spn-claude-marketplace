// `lib/workstream-schema.ts`, `lib/workstream.ts` and `lib/front-matter.ts` — the schema every file a
// script owns is held to, the stamp of an arc's rows, the two generated blocks, and the front matter an
// order and a report open with. Each rule is shown failing on a record that breaks it, and passing on
// the record that keeps it.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { arcData, approachPage, dataWorkspace } from "../../../helpers/workstream-fixture.mjs";

const schema = await import("../../../../src/scripts/lib/workstream-schema.ts");
const lib = await import("../../../../src/scripts/lib/workstream.ts");
const { frontMatter, flowValue } = await import("../../../../src/scripts/lib/front-matter.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const clone = (value) => JSON.parse(JSON.stringify(value));

console.log("=== the schema — an arc's state.json");
{
  const good = arcData();
  ok("a whole arc holds to the schema", schema.arcFaults(good).length === 0, schema.arcFaults(good).join("; "));
  const cases = [
    ["a schemaVersion other than 1", (d) => { d.schemaVersion = 2; }, /schemaVersion/],
    ["a status outside the eight", (d) => { d.status = "OPEN"; }, /status/],
    ["HELD with no reason", (d) => { d.status = "HELD"; }, /HELD and carries no `reason`/],
    ["an arc id not N<nnn>", (d) => { d.arc = "arc7"; }, /`arc`/],
    ["a row with no kind", (d) => { delete d.rows[0].kind; }, /row 1 has no `kind`/],
    ["a row kind outside fix, change and question", (d) => { d.rows[0].kind = "chore"; }, /`kind` is `chore`/],
    ["a row state outside the seven", (d) => { d.rows[0].state = "done"; }, /`state` is `done`/],
    ["a work row with no state", (d) => { delete d.rows[0].state; }, /row 1 has no `state`/],
    ["two rows with one id", (d) => { d.rows[1].id = "1"; }, /written twice/],
    ["a parent that is neither the arc nor a row", (d) => { d.rows[1].parent = "9"; }, /`parent` `9`/],
    ["a row with rows under it carrying a state", (d) => { d.rows[1].parent = "1"; }, /its state is theirs/],
    ["a blocker the arc does not hold", (d) => { d.rows[1].blockedBy = ["7"]; }, /waits on row 7/],
    ["a touch with no repository", (d) => { d.rows[0].touches = ["decisions.md"]; }, /`touches`/],
    ["a cost that is not tokens and minutes", (d) => { d.rows[0].cost = { tokens: "a lot" }; }, /`cost`/],
  ];
  for (const [label, breakIt, says] of cases) {
    const broken = clone(good);
    breakIt(broken);
    const faults = schema.arcFaults(broken).join("; ");
    ok(`red: ${label} fails`, says.test(faults), faults);
  }
  const grown = clone(good);
  grown.rows[0].laterField = "kept";
  grown.extra = 1;
  ok("green: a field the schema does not know is left alone", schema.arcFaults(grown).length === 0);
  const parent = clone(good);
  parent.rows[1].parent = "1";
  delete parent.rows[0].state;
  ok("green: a row with rows under it and no state holds", schema.arcFaults(parent).length === 0, schema.arcFaults(parent).join("; "));
}

console.log("\n=== the schema — the one-line records");
{
  ok("a whole fact holds", schema.factFaults({ id: "f1", fact: "x", source: "spn-x/a.ts", commit: "abc", readAt: "t", usedBy: [] }, "f").length === 0);
  ok("red: a fact with no commit fails", /commit/.test(schema.factFaults({ id: "f1", fact: "x", source: "s", readAt: "t", usedBy: [] }, "f").join()));
  ok("a whole suggestion holds", schema.suggestionFaults({ id: "s2", title: "x", state: "shaped", preview: null, words: null }, "s").length === 0);
  ok("red: a suggestion state outside the five fails", /state/.test(schema.suggestionFaults({ id: "s2", title: "x", state: "open", preview: null, words: null }, "s").join()));
  ok("a whole log line holds", schema.logFaults({ at: "t", kind: "landed", row: "1", note: null }, "l").length === 0);
  const { title, ...card } = await import("../../../helpers/workstream-fixture.mjs").then((m) => m.CARD);
  ok("a whole card holds", schema.cardFaults(card).length === 0, schema.cardFaults(card).join("; "));
  ok("red: a card with no why fails", /`why`/.test(schema.cardFaults({ ...card, why: "" }).join()));
  ok("red: a card with one option fails", /fewer than two/.test(schema.cardFaults({ ...card, options: card.options.slice(0, 1) }).join()));
  ok("red: a recommendation naming no option fails", /none of its options/.test(schema.cardFaults({ ...card, recommended: { key: "C", reason: "r" } }).join()));
  const record = { id: "q1", arc: "N001", title, state: "open", raised: "t", shownIn: [], card, answer: null };
  ok("a whole question holds", schema.questionFaults(record, "q").length === 0, schema.questionFaults(record, "q").join("; "));
  ok("red: an answered question with no words fails", /no answer/.test(schema.questionFaults({ ...record, state: "answered" }, "q").join()));
}

console.log("\n=== the stamp — ids and What, never states");
{
  const data = arcData();
  const stamp = lib.rowStamp(data);
  ok("the stamp is twelve hex characters", /^[0-9a-f]{12}$/.test(stamp), stamp);
  const moved = clone(data); moved.rows[0].state = "landed";
  ok("a row's state changing does not move it", lib.rowStamp(moved) === stamp);
  const reordered = clone(data); reordered.rows.reverse();
  ok("the rows' order does not move it", lib.rowStamp(reordered) === stamp);
  const added = clone(data); added.rows.push({ id: "3", parent: "N001", title: "more", kind: "fix", state: "waiting" });
  ok("a row added moves it", lib.rowStamp(added) !== stamp);
  const retitled = clone(data); retitled.rows[0].title = "write the whole book";
  ok("a row's What changed moves it", lib.rowStamp(retitled) !== stamp);
  const page = approachPage("old");
  ok("the page's stamp is read from the arc's Cycles row", lib.stampsOn(page).get("N001")?.stamp === "old");
  ok("a restamp writes the new value on that row alone", lib.stampsOn(lib.restamped(page, "N001", stamp)).get("N001")?.stamp === stamp);
  ok("a page with no stamp yet gains one", lib.stampsOn(lib.restamped(approachPage(""), "N001", stamp)).get("N001")?.stamp === stamp);
  ok("an arc with no row has no restamp", lib.restamped(page, "N002", stamp) === null);
}

console.log("\n=== the generated blocks — progress and open");
{
  const page = approachPage("x");
  ok("both blocks are found", lib.blocksIn(page).map((one) => one.kind).sort().join() === "open,progress");
  const next = lib.withBlock(page, "progress", "  <p>new</p>\n");
  ok("a block is rewritten between its markers and nowhere else",
    next.includes("<p>new</p>") && !next.includes("<p>old</p>") && next.replace("  <p>new</p>\n", "") === page.replace("  <p>old</p>\n", ""));
  ok("a page with no such block is not written", lib.withBlock("<p>no block</p>", "progress", "x") === null);
  const data = arcData(); data.rows[0].state = "landed";
  const inside = lib.progressInside("/nowhere", [data]);
  ok("progress: the card alone — no Overall line, no long bar, no grid of tiles", !inside.includes("<p>") && !inside.includes('class="sds-bar"') && !inside.includes("sds-arcs") && inside.startsWith('  <nav class="sds-footbar"'), inside);
  ok("progress: a chip links its row on the page, never its data", inside.includes('href="#N001"') && inside.includes('style="width:50%"') && !inside.includes("state.json"), inside);
  const words = lib.progressInside("/nowhere", [{ ...data, arc: "N002", subject: "workstream-data", status: "PART-LANDED" }]);
  ok("progress: a subject is shown as words, and a two-word status is one class", words.includes("<span class=\"sds-chip-subject\"> &middot; workstream data</span>") && words.includes('class="sds-chip sds-part-landed '), words);
  ok("progress: no arc, no card and nothing else", lib.progressInside("/nowhere", []) === "");
  {
    const order = (list) => lib.executionOrder("/nowhere", list).map((one) => one.arc).join(" ");
    const arc = (id, status, position) => ({ ...arcData(), arc: id, status, ...(position === undefined ? {} : { position }) });
    ok("progress order: the done arcs, then RUNNING and PART-LANDED, then DECIDED and PROPOSED by position, an arc without one last, the number breaking a tie",
      order([arc("N009", "PROPOSED"), arc("N008", "DECIDED", 5), arc("N004", "DECIDED", 2), arc("N003", "RUNNING"), arc("N001", "LANDED"), arc("N010", "PART-LANDED"), arc("N011", "PROPOSED", 4), arc("N002", "CARRIED")]) === "N001 N002 N003 N010 N004 N011 N008 N009");
    const folder = mkdtempSync(join(tmpdir(), "order-"));
    const written = [["N005", "2026-10-12T10:00+05:30"], ["N006", "2026-10-11T10:00+05:30"]];
    for (const [id, at] of written) { const dir = join(folder, "arcs", id); mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, "log.jsonl"), `${JSON.stringify({ at, kind: "landed", row: "1", note: "waiting → landed" })}\n`); }
    ok("progress order: done arcs are in the order they finished, by their log, not by number", lib.executionOrder(folder, [arc("N005", "LANDED"), arc("N006", "LANDED")]).map((one) => one.arc).join(" ") === "N006 N005");
    ok("progress: an arc's position is a whole number the schema accepts", schema.arcFaults({ ...arcData(), position: 3 }).length === 0 && schema.arcFaults({ ...arcData(), position: "x" }).length > 0);
  }
  ok("progress: a sticky card closes the block — the arcs' chips on the left, then the overall chip, and no line along its top edge",
    inside.includes('<nav class="sds-footbar" aria-label="Workstream status">') && inside.indexOf('sds-footbar-chips') < inside.indexOf('sds-footbar-summary')
      && inside.includes('<span>0 of 1 arcs closed</span>') && !inside.includes("sds-footbar-line"), inside);
  ok("progress: a chip is two lines — the number without the N and the name with done/total on the right, then the bar — its status in its class, its tooltip and its accessible name, and no badge",
    /<a class="sds-chip sds-decided sds-step-3" href="#N001" aria-label="N001 probe, DECIDED, 1 of 2 rows done"><span class="sds-chip-line"><span class="sds-chip-name"><span class="sds-mono">1<\/span><span class="sds-chip-subject"> &middot; probe<\/span><\/span><span class="sds-arc-count">1\/2<\/span><\/span><span class="sds-chip-bar"><i style="width:50%"><\/i><\/span><span class="sds-tip"><span class="sds-badge sds-status sds-decided">DECIDED<\/span><strong>the probe arc<\/strong><span>1 of 2 rows done<\/span><\/span><\/a>/.test(inside) && !/sds-chip-line"><span class="sds-badge[^>]*>DECIDED/.test(inside), inside);
  ok("progress: the summary is a highlighted section of two lines — Overall with rows done, then its bar in the same step shade — with the workstream's status in its class, tooltip and accessible name",
    /<div class="sds-footbar-summary sds-planning sds-step-3" tabindex="0" aria-label="Workstream PLANNING, 1 of 2 rows done, 0 of 1 arcs closed">\s*<span class="sds-chip-line"><span class="sds-chip-name">Overall<\/span><span class="sds-arc-count">1\/2<\/span><\/span>\s*<span class="sds-chip-bar"><i style="width:50%"><\/i><\/span>\s*<span class="sds-tip"><span class="sds-badge sds-status sds-planning">PLANNING<\/span><strong>Overall<\/strong><span>0 of 1 arcs closed<\/span><span>1 of 2 rows done<\/span><\/span>\s*<\/div>/.test(inside), inside);
  ok("progress: the shade steps are 0-19, 20-39, 40-59, 60-79, 80-99 and done at 100",
    [[0, 10, "1"], [1, 10, "1"], [2, 10, "2"], [4, 10, "3"], [6, 10, "4"], [8, 10, "5"], [99, 100, "5"], [10, 10, "done"], [0, 0, "1"]].every(([d, t, want]) => lib.progressStep(d, t) === want));
  ok("progress: the card is written with the first arc, whatever its status, and not before", lib.progressInside("/nowhere", [{ ...data, status: "PROPOSED" }]).includes("sds-footbar-chips") && !lib.progressInside("/nowhere", []).includes("sds-footbar"));
  const { CARD } = await import("../../../helpers/workstream-fixture.mjs");
  const { title, ...card } = CARD;
  const html = lib.cardHtml({ id: "q7", title, card });
  ok("a card renders the template's markup: heading, the four keys, options, recommended",
    html.includes('<h4 id="q7">Q7 &middot; Which way the <code>probe</code> goes</h4>') && html.includes('<span class="sds-key">Why it matters</span>') &&
    html.includes("<tr><td><strong>A</strong></td><td>one way</td><td>little</td></tr>") && html.includes("<b>Recommended: A.</b> It costs less."), html);
  ok("the heading names each open card", lib.openHeading([{ id: "q7" }, { id: "q9" }]) === "Open &mdash; Q7 &middot; Q9");
  ok("and says so when none is open", lib.openHeading([]) === "Open &mdash; no card is open");
}

console.log("\n=== the front matter — an order's and a report's");
{
  const matter = frontMatter(['---', 'row: "57"', 'outcome: landed        # landed · stopped · needs-you', 'proof: "unit 2225 ✓ · ct 750 ✓"',
    'commits: { support: [304ff5be] }', 'followUps: ["57b QUIET tints"]', 'cost: { tokens: 194383, minutes: 29 }', 'touches: [support:web-ds, "foundation:decisions.md"]', '---', 'body'].join("\n"));
  ok("a quoted text, a bare word with its comment gone", matter.row === "57" && matter.outcome === "landed", JSON.stringify(matter));
  ok("a map of lists", JSON.stringify(matter.commits) === '{"support":["304ff5be"]}');
  ok("a map of numbers", matter.cost.tokens === 194383 && matter.cost.minutes === 29);
  ok("a list of texts, bare and quoted, a colon inside a word kept", JSON.stringify(matter.touches) === '["support:web-ds","foundation:decisions.md"]', JSON.stringify(matter.touches));
  ok("a file with no front matter gives null", frontMatter("# no\n") === null);
  ok("a flow value alone", JSON.stringify(flowValue("[q63, q64]")) === '["q63","q64"]');
}

console.log("\n=== the folder — what a script owns, and where a reference points");
{
  const base = "/w/.spndevex/workstreams/open/025-x";
  ok("an arc's state.json is a script's", lib.scriptOwned(`${base}/arcs/N007/state.json`)?.file === "arcs/N007/state.json");
  ok("its log and facts are", !!lib.scriptOwned(`${base}/arcs/N007/log.jsonl`) && !!lib.scriptOwned(`${base}/arcs/N007/facts.jsonl`));
  ok("the workstream's questions and suggestions are", !!lib.scriptOwned(`${base}/questions.jsonl`) && !!lib.scriptOwned(`${base}/suggestions.jsonl`));
  ok("the workspace's own workstreams/state.json is not", lib.scriptOwned("/w/.spndevex/workstreams/state.json") === null);
  ok("the agent's preview and plan are not", lib.scriptOwned(`${base}/notes/N007/preview.html`) === null && lib.scriptOwned(`${base}/notes/N007/plan.md`) === null);
  ok("the arc's name file beside its data is a script's", lib.scriptOwned(`${base}/arcs/N007/layout-model.md`)?.file === "arcs/N007/layout-model.md");
  ok("an arc's address is its row on the approach page", lib.arcAddress("N013") === "approach.html#N013" && lib.arcAddress("N013", "../../") === "../../approach.html#N013");
  const { root, ws } = await dataWorkspace("t-workstream-lib");
  ok("an arc named with its workstream resolves", lib.resolveArc("031/N001", root).ws === ws);
  ok("an arc named alone resolves where one workstream holds it", lib.resolveArc("N001", root).arc === "N001");
  let said = "";
  try { lib.resolveArc("N009", root); } catch (error) { said = error.message; }
  ok("an arc no workstream holds is named as such", /in no open or backlog workstream/.test(said), said);
  ok("the workstream is kept as data", lib.isDataLayout(ws));
  ok("its arcs are read from their folders", lib.arcIdsOf(ws).join() === "N001");
  ok("its page reads its progress block written", lib.writeProgress(ws) === "progress written" && readFileSync(join(ws, "approach.html"), "utf8").includes("0/2</span>"));
  ok("and a second write finds it current", lib.writeProgress(ws) === "progress current");
}

console.log("\n=== the name file — RD.DEVEX.WORKSPACE.264");
{
  const { ws } = await dataWorkspace("t-workstream-name");
  const data = arcData();
  const text = readFileSync(join(ws, "arcs", "N001", "probe.md"), "utf8");
  const order = ["# N001 — the probe arc", "**Goal.** the probe is answered", "**Status.** DECIDED", "**Decides.** what it decides", "**Repos.** spn-x", "**Links.**"];
  ok("it holds the title, the goal, the status, what it decides, its repos and its links, in that order",
    order.every((part, at) => text.indexOf(part) >= 0 && (at === 0 || text.indexOf(part) > text.indexOf(order[at - 1]))), text);
  ok("its links: the arc on the page first, then the preview and the plan that are on disk",
    text.includes("[the arc on the approach page](../../approach.html#N001) · [preview](../../notes/N001/preview.html) · [plan](../../notes/N001/plan.md)") && !text.includes("samples"), text);
  ok("no rows and no log", !text.includes("write the book") && !text.includes("log.jsonl"));
  ok("it holds against its data", lib.nameFileHolds(ws, data, text));
  ok("red: a hand edit of the goal does not hold", !lib.nameFileHolds(ws, data, text.replace("the probe is answered", "something else")));
  mkdirSync(join(ws, "notes", "N001", "samples"), { recursive: true });
  ok("a sample added since is no hand edit: the links line follows the next write", lib.nameFileHolds(ws, data, text));
  lib.writeArc(ws, { ...data, subject: "renamed" });
  ok("a subject changed renames the file, and the old one goes",
    lib.markdownIn(ws, "N001").join() === "renamed.md" && readFileSync(join(ws, "arcs", "N001", "renamed.md"), "utf8").includes("[samples](../../notes/N001/samples/)"));
}

console.log("\n=== a short subject — RD.DEVEX.WORKSPACE.265");
{
  const { subjectFault } = schema;
  ok("one to three words of at most 24 characters hold", ["lenses", "web-stack", "surface-app-patterns"].every((one) => subjectFault(one) === null));
  ok("red: four words or more are refused", /is 5 words/.test(subjectFault("web-stack-and-partner-choices") ?? ""));
  ok("red: more than 24 characters is refused", /is 25 characters/.test(subjectFault("aaaaaaaaaaaa-bbbbbbbbbbbb") ?? ""), subjectFault("aaaaaaaaaaaa-bbbbbbbbbbbb"));
  ok("red: a sentence is not kebab-case", subjectFault("Layout model") !== null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream library` : `\n  all ${total} passed — workstream library`);
process.exit(failed ? 1 : 0);
