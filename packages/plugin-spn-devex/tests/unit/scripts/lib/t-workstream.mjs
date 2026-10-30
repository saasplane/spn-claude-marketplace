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
    ["a schemaVersion 1, which names migration 006", (d) => { d.schemaVersion = 1; }, /`schemaVersion` is `1`.*plugin migration write 006/],
    ["a schemaVersion newer than the plugin's, which says to update it", (d) => { d.schemaVersion = 3; }, /`schemaVersion` is 3, and this spn-devex reads 2: update the plugin/],
    ["a status outside the stored set", (d) => { d.status = "OPEN"; }, /status/],
    ["RUNNING, which the steps work out and nothing stores", (d) => { d.status = "RUNNING"; }, /`status` is `RUNNING`/],
    ["DROPPED with no reason", (d) => { d.status = "DROPPED"; }, /DROPPED and carries no `reason`/],
    ["a wait that is not words", (d) => { d.wait = 3; }, /`wait`/],
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

console.log("\n=== the stamp — the arc's goal, title and repositories, never its rows");
{
  const data = arcData();
  const stamp = lib.arcStamp(data);
  ok("the stamp is twelve hex characters", /^[0-9a-f]{12}$/.test(stamp), stamp);
  const moved = clone(data); moved.rows[0].state = "landed";
  ok("a row's state changing does not move it", lib.arcStamp(moved) === stamp);
  const reordered = clone(data); reordered.rows.reverse();
  ok("the rows' order does not move it", lib.arcStamp(reordered) === stamp);
  const added = clone(data); added.rows.push({ id: "3", parent: "N001", title: "more", kind: "fix", repo: "spn-x", state: "waiting" });
  ok("a row added in a repository the arc reaches does not move it", lib.arcStamp(added) === stamp);
  const retitledRow = clone(data); retitledRow.rows[0].title = "write the whole book";
  ok("a row's What changed does not move it", lib.arcStamp(retitledRow) === stamp);
  const noRepo = clone(data); noRepo.rows.push({ id: "4", parent: "N001", title: "prove it", kind: "change", repo: "—", state: "waiting" });
  ok("a row that changes no repository does not move it", lib.arcStamp(noRepo) === stamp);
  const reached = clone(data); reached.rows.push({ id: "5", parent: "N001", title: "elsewhere", kind: "change", repo: "spn-y", state: "waiting" });
  ok("red: a row in a repository the arc did not reach moves it", lib.arcStamp(reached) !== stamp);
  const regoaled = clone(data); regoaled.goal = "another outcome";
  ok("red: the goal changed moves it", lib.arcStamp(regoaled) !== stamp);
  const retitled = clone(data); retitled.title = "another arc";
  ok("red: the title changed moves it", lib.arcStamp(retitled) !== stamp);
  const header = clone(data); header.repos = ["spn-x", "spn-z"];
  ok("red: a repository added to the header moves it", lib.arcStamp(header) !== stamp);
  ok("the repositories are the header's and the rows', sorted, with no empty cell",
    lib.arcRepos({ repos: ["spn-b"], rows: [{ repo: "spn-a" }, { repo: "—" }, { repo: "spn-b" }, {}] }).join() === "spn-a,spn-b");
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
  const words = lib.progressInside("/nowhere", [{ ...data, arc: "N002", subject: "workstream-data", status: "PROPOSED" }]);
  ok("progress: a subject is shown as words", words.includes("<span class=\"sds-chip-subject\"> &middot; workstream data</span>") && words.includes('class="sds-chip sds-proposed '), words);
  ok("progress: no arc, no card and nothing else", lib.progressInside("/nowhere", []) === "");
  {
    const order = (list) => lib.executionOrder("/nowhere", list).map((one) => one.arc).join(" ");
    const arc = (id, status, position) => ({ ...arcData(), arc: id, status, ...(position === undefined ? {} : { position }) });
    // RUNNING and LANDED are worked out from the steps: a decided arc with a step started runs, and one with every step landed has landed.
    const started = (id) => ({ ...arc(id, "DECIDED"), rows: arcData().rows.map((row, at) => ({ ...row, state: at ? "waiting" : "running" })) });
    const done = (id) => ({ ...arc(id, "DECIDED"), rows: arcData().rows.map((row) => ({ ...row, state: "landed" })) });
    ok("progress order: the done arcs, then RUNNING, then DECIDED and PROPOSED by position, an arc without one last, the number breaking a tie",
      order([arc("N009", "PROPOSED"), arc("N008", "DECIDED", 5), arc("N004", "DECIDED", 2), started("N003"), done("N001"), started("N010"), arc("N011", "PROPOSED", 4), arc("N002", "CARRIED")]) === "N001 N002 N003 N010 N004 N011 N008 N009",
      order([arc("N009", "PROPOSED"), arc("N008", "DECIDED", 5), arc("N004", "DECIDED", 2), started("N003"), done("N001"), started("N010"), arc("N011", "PROPOSED", 4), arc("N002", "CARRIED")]));
    const folder = mkdtempSync(join(tmpdir(), "order-"));
    const written = [["N005", "2026-10-12T10:00+05:30"], ["N006", "2026-10-11T10:00+05:30"]];
    for (const [id, at] of written) { const dir = join(folder, "arcs", id); mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, "log.jsonl"), `${JSON.stringify({ at, kind: "landed", row: "1", note: "waiting → landed" })}\n`); }
    ok("progress order: done arcs are in the order they finished, by their log, not by number", lib.executionOrder(folder, [done("N005"), done("N006")]).map((one) => one.arc).join(" ") === "N006 N005");
    ok("progress: an arc's position is a whole number the schema accepts", schema.arcFaults({ ...arcData(), position: 3 }).length === 0 && schema.arcFaults({ ...arcData(), position: "x" }).length > 0);
  }
  ok("progress: a sticky card closes the block — the arcs' chips on the left, then the overall chip, and no line along its top edge",
    inside.includes('<nav class="sds-footbar" aria-label="Workstream status">') && inside.indexOf('sds-footbar-chips') < inside.indexOf('sds-footbar-summary')
      && inside.includes('<span>0 of 1 arcs closed</span>') && !inside.includes("sds-footbar-line"), inside);
  ok("progress: a chip is two lines — the number without the N and the name with done/total on the right, then the bar — its status in its class, its tooltip and its accessible name, and no badge",
    /<a class="sds-chip sds-running sds-step-3" href="#N001" aria-label="N001 probe, RUNNING, 1 of 2 steps landed, in progress: none, next ready: row 2, build it, log last moved: never"><span class="sds-chip-line"><span class="sds-chip-name"><span class="sds-mono">1<\/span><span class="sds-chip-subject"> &middot; probe<\/span><\/span><span class="sds-arc-count">1\/2<\/span><\/span><span class="sds-chip-bar"><i style="width:50%"><\/i><\/span><span class="sds-tip"><span class="sds-badge sds-status sds-running">RUNNING<\/span><strong>the probe arc<\/strong><span>1 of 2 steps landed<\/span><span>in progress: none<\/span><span>next ready: row 2, build it<\/span><span>log last moved: never<\/span><\/span><\/a>/.test(inside) && !/sds-chip-line"><span class="sds-badge[^>]*>RUNNING/.test(inside), inside);
  ok("progress: the summary is a highlighted section of two lines — Overall with steps landed, then its bar in the same step shade — with the workstream's status in its class, tooltip and accessible name",
    /<div class="sds-footbar-summary sds-implementing sds-step-3" tabindex="0" aria-label="Workstream IMPLEMENTING, 1 of 2 steps landed, 0 of 1 arcs closed">\s*<span class="sds-chip-line"><span class="sds-chip-name">Overall<\/span><span class="sds-arc-count">1\/2<\/span><\/span>\s*<span class="sds-chip-bar"><i style="width:50%"><\/i><\/span>\s*<span class="sds-tip"><span class="sds-badge sds-status sds-implementing">IMPLEMENTING<\/span><strong>Overall<\/strong><span>0 of 1 arcs closed<\/span><span>1 of 2 steps landed<\/span><\/span>\s*<\/div>/.test(inside), inside);
  {
    // RULE.DEVEX.WORKSPACE.278: every row is a build step; a chip and Overall count steps, and an arc with none shows its status.
    const build = (id, state) => ({ id, parent: "N001", title: `build ${id}`, kind: "change", state });
    const arc = (id, status, rows) => ({ ...arcData(rows), arc: id, subject: `arc-${id.toLowerCase()}`, status });
    const chipOf = (html, id) => new RegExp(`<a class="sds-chip [^"]*" href="#${id}"[\\s\\S]*?</a>`).exec(html)?.[0] ?? "";
    const summaryOf = (html) => /<div class="sds-footbar-summary[\s\S]*?<\/div>/.exec(html)?.[0] ?? "";
    const shaped = lib.progressInside("/nowhere", [arc("N001", "PROPOSED", [])]);
    ok("progress: an arc with no step yet says its status, with no bar to fill",
      chipOf(shaped, "N001").includes('<span class="sds-arc-count">proposed</span>') && chipOf(shaped, "N001").includes('style="width:0%"') && !shaped.includes("sds-step-done"), shaped);
    const partBuilt = lib.progressInside("/nowhere", [arc("N002", "DECIDED", [build("3", "landed"), build("4", "running")])]);
    ok("progress: a part-built arc reads RUNNING and counts its steps",
      /class="sds-chip sds-running sds-step-3"/.test(chipOf(partBuilt, "N002")) && chipOf(partBuilt, "N002").includes('<span class="sds-arc-count">1/2</span>') && chipOf(partBuilt, "N002").includes('style="width:50%"'), partBuilt);
    const built = lib.progressInside("/nowhere", [arc("N002", "DECIDED", [build("3", "landed"), build("4", "landed")])]);
    ok("progress: an arc whose steps all landed reads LANDED, in the done shade", /class="sds-chip sds-landed sds-step-done"/.test(chipOf(built, "N002")), built);
    const waiting = lib.progressInside("/nowhere", [{ ...arc("N003", "DECIDED", [build("1", "waiting")]), wait: "the developer: approved, but wait" }]);
    ok("progress: a decided arc's wait is in its tooltip and its accessible name", chipOf(waiting, "N003").includes("wait: the developer: approved, but wait"), waiting);
    const running = lib.progressInside("/nowhere", [arc("N001", "PROPOSED", []), arc("N002", "DECIDED", [build("2", "running")])]);
    ok("progress: Overall reads IMPLEMENTING once a step has started, as the header does, though none has landed",
      summaryOf(running).includes('class="sds-footbar-summary sds-implementing ') && summaryOf(running).includes('<span class="sds-arc-count">0/1</span>'), summaryOf(running));
    const decided = lib.progressInside("/nowhere", [arc("N001", "PROPOSED", []), arc("N002", "DECIDED", [build("2", "waiting"), build("3", "waiting")])]);
    ok("progress: Overall reads PLANNING until the first step of any arc starts, as the header does",
      summaryOf(decided).includes('class="sds-footbar-summary sds-planning ') && summaryOf(decided).includes('<span class="sds-arc-count">0/2</span>'), summaryOf(decided));
    {
      // The running arc's line: the row in progress, the next ready row, and when its log last moved.
      const folder = mkdtempSync(join(tmpdir(), "running-"));
      mkdirSync(join(folder, "arcs", "N002"), { recursive: true });
      writeFileSync(join(folder, "arcs", "N002", "log.jsonl"), [
        { at: "2026-10-10T09:00+05:30", kind: "added", row: "3", note: null },
        { at: "2026-10-12T10:30+05:30", kind: "state", row: "4", note: "ready → running" },
        { at: "2026-10-11T08:00+05:30", kind: "note", row: null, note: "earlier" }].map((line) => JSON.stringify(line)).join("\n") + "\n");
      const rows = [build("3", "landed"), build("4", "running"), { ...build("5", "waiting"), blockedBy: ["3"] }, { ...build("6", "waiting"), blockedBy: ["4"] }];
      const live = lib.progressInside(folder, [arc("N002", "DECIDED", rows)]);
      const chip = chipOf(live, "N002");
      ok("progress: a running arc names its row in progress, the next ready row and when its log last moved",
        chip.includes("<span>in progress: row 4, build 4</span>") && chip.includes("<span>next ready: row 5, build 5</span>")
          && chip.includes("<span>log last moved: 2026-10-12T10:30+05:30</span>"), chip);
      ok("progress: the same words are in the chip's accessible name", chip.includes("in progress: row 4, build 4, next ready: row 5, build 5, log last moved: 2026-10-12T10:30+05:30\""), chip);
      const idle = lib.progressInside(folder, [arc("N002", "DECIDED", [build("3", "waiting")]), arc("N003", "PROPOSED", []), arc("N004", "LANDED", [build("1", "landed")])]);
      ok("progress: an arc that is not running has no line in the block", !idle.includes("in progress:") && !idle.includes("log last moved"), idle);
      const bare = lib.progressInside(folder, [arc("N002", "DECIDED", [build("4", "running")])]);
      ok("progress: a running arc with nothing ready says none", chipOf(bare, "N002").includes("<span>next ready: none</span>"), bare);
    }
    const closed = lib.progressInside("/work/.spndevex/workstreams/closed/031-probe", [arc("N001", "LANDED", [build("1", "landed")])]);
    ok("progress: a closed workstream's Overall reads DONE", summaryOf(closed).includes('class="sds-footbar-summary sds-done '), summaryOf(closed));
    ok("the workstream's word is one function, the header's and Overall's alike",
      lib.workstreamWord("/nowhere", ["PROPOSED", "DECIDED"]) === "PLANNING" && lib.workstreamWord("/nowhere", ["DECIDED", "RUNNING"]) === "IMPLEMENTING" && lib.workstreamWord("/x/closed/031-probe", ["PROPOSED"]) === "DONE");
  }
  {
    // An arc's moves are read from its log.
    ok("a status line's move is read from its note's head", JSON.stringify(lib.moveOf("PROPOSED → DECIDED · the developer: go")) === '{"from":"PROPOSED","to":"DECIDED"}'
      && lib.moveOf("PART-LANDED → LANDED") !== null && lib.moveOf("the developer: go") === null);
    const line = (kind, note, row = null) => ({ at: "2026-10-23T19:00+05:30", kind, row, note });
    const reopened = [line("opened", "opened as PROPOSED"), line("status", "the developer: go"), line("landed", "waiting → landed", "1"),
      line("status", "RUNNING → LANDED"), line("status", "LANDED → PROPOSED · new scope"), line("added", "new", "5"), line("landed", "waiting → landed", "6")];
    const moves = lib.statusMoves(reopened);
    ok("the last move to PROPOSED and the first move out of it are read from the log, an older line with words alone read from the status before it",
      moves.toProposed === 4 && moves.outOfProposed === 1 && moves.firstProposed === 0, JSON.stringify(moves));
    ok("an arc opened with words alone opened at PROPOSED", lib.statusMoves([line("opened", "the developer: open it")]).toProposed === 0);
    ok("a log with no move out of PROPOSED says so", lib.statusMoves([line("opened", "opened as PROPOSED"), line("note", "x")]).outOfProposed === null);
    const landedAt = lib.landedLines({ rows: [{ id: "1", state: "landed" }, { id: "5", state: "landed" }, { id: "7", state: "landed" }] }, reopened);
    ok("a row lands at its landed line, or at the line that added it already landed, and is absent where the log shows neither",
      landedAt.get("1") === 2 && landedAt.get("5") === 5 && !landedAt.has("7"), JSON.stringify([...landedAt]));
  }
  {
    // RULE.DEVEX.WORKSPACE.273: the go's write lists each line of the preview that still says proposed, and checks none.
    const preview = [
      '<!-- spn:doc {"summary": "what is proposed here"} -->',
      '<header class="sds-masthead"><div class="sds-eyebrow"><span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Preview</span><span class="sds-state"><span class="sds-label">Status:</span> <a class="sds-badge sds-status sds-proposed" href="../../approach.html#N001">PROPOSED</a></span></span></div></header>',
      '<section id="s3"><div class="sds-section-head"><h2>Proposed</h2></div>',
      '<p>The status table does not change.</p>',
      '<p>The bar is <span class="sds-proposed">drawn</span> as it would be once proposed.</p>',
      "</section>",
    ].join("\n");
    const found = lib.proposedLines(preview);
    ok("each line whose text says proposed, in any case, by its number; never the masthead's badge, the template's Proposed heading, a comment or a class",
      found.map((one) => one.line).join() === "5" && found[0].text.endsWith("once proposed."), JSON.stringify(found));
  }
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

console.log("\n=== a preview's Open takes the id `open` — S169");
{
  const { CARD } = await import("../../../helpers/workstream-fixture.mjs");
  const { title, ...card } = CARD;
  const ws = "/w/.spndevex/workstreams/open/031-probe";
  const preview = `${ws}/notes/N001/preview.html`;
  const open = [{ id: "q8", arc: "N001", title, state: "open", raised: "t", shownIn: ["notes/N001/preview.html"], card, answer: null }];
  const answered = [{ ...open[0], state: "answered", answer: "A" }];
  const taken = `<div class="sds-wrap">\n<section id="s1"><h2>Overview</h2></section>\n<section id="s5"><h2>Deferred</h2><p>kept</p></section>\n</div>\n`;
  const added = lib.previewWithOpen(ws, preview, taken, open);
  ok("a page whose s5 is taken gains the block as `<section id=\"open\">` and keeps its own s5 once",
    added.includes('<section id="open" data-block="reasons">') && added.split('id="s5"').length === 2 && added.includes("<p>kept</p>"), added);
  ok("a second write finds it current", lib.previewWithOpen(ws, preview, added, open) === added);
  const dropped = lib.previewWithOpen(ws, preview, added, answered);
  ok("the card answered drops the `open` section and leaves the page's s5", !dropped.includes('id="open"') && !dropped.includes("sds-open") && dropped.includes("<p>kept</p>"), dropped);
  const marker = "  <!-- spn:generated open — do not edit inside these markers; `workstream question show` writes it from questions.jsonl -->";
  const before = taken.replace("</div>\n", `<section id="s5" data-block="reasons">\n${marker}\n  <p>stale</p>\n  <!-- /spn:generated -->\n</section>\n</div>\n`);
  const updated = lib.previewWithOpen(ws, preview, before, open);
  ok("a page written with the block in a second s5 updates, and that section takes the id `open`",
    updated.includes('<h4 id="q8">') && !updated.includes("<p>stale</p>") && updated.includes('<section id="open" data-block="reasons">') && updated.split('id="s5"').length === 2, updated);
  const template = `<section id="s1"><h2>Overview</h2></section>\n<section id="s5" data-block="reasons">\n${marker}\n  <p>stale</p>\n  <!-- /spn:generated -->\n</section>\n`;
  const fromTemplate = lib.previewWithOpen(ws, preview, template, open);
  ok("a template page holding its Open as its only s5 updates and keeps s5", fromTemplate.includes('<h4 id="q8">') && fromTemplate.includes('<section id="s5" data-block="reasons">'), fromTemplate);
  ok("and the card answered drops that s5 section", !lib.previewWithOpen(ws, preview, fromTemplate, answered).includes("<section id=\"s5\""));
  const authored = `<section id="s3"><h2>Mine</h2>\n${marker}\n  <p>stale</p>\n  <!-- /spn:generated -->\n<p>my words</p>\n</section>\n`;
  const authoredDropped = lib.previewWithOpen(ws, preview, authored, answered);
  ok("a block inside a section of another id loses the block alone, never the section", authoredDropped.includes("<p>my words</p>") && !authoredDropped.includes("stale"), authoredDropped);
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

console.log("\n=== the name file — RULE.DEVEX.WORKSPACE.264");
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

console.log("\n=== a preview's one status, the arc's — RULE.DEVEX.WORKSPACE.266");
{
  const eyebrow = (line) => `<header class="sds-masthead">\n  <div class="sds-eyebrow"><span class="sds-line1">SaaS Plane &nbsp;|&nbsp; Workstream 031 &nbsp;|&nbsp; Probe</span>${line}</div>\n  <h1>Probe</h1>\n</header>\n`;
  const type = `<span class="sds-label">Type:</span> <span class="sds-badge sds-type">Preview</span>`;
  const sep = `<span class="sds-separator">|</span>`;
  const shown = `<span class="sds-label">Shown:</span> <span class="sds-badge">2026-10-17</span>`;
  const status = (word) => `<span class="sds-state"><span class="sds-label">Status:</span> <a class="sds-badge sds-status sds-${word.toLowerCase()}" href="../../approach.html#N001">${word}</a></span>`;
  const arc = `<span class="sds-label">Arc:</span> <a class="sds-badge" href="../../approach.html#N001">N001</a>`;
  const want = eyebrow(`<span class="sds-line">${type}${sep}${arc}${sep}${shown}${status("LANDED")}</span>`);
  const before = eyebrow(`<span class="sds-line">${type}${sep}<span class="sds-label">Arc:</span> <span class="sds-badge">N001</span> <span class="sds-small"><a href="../../approach.html#N001">approach.html#N001</a></span>${sep}${shown}<span class="sds-state"><span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-decided">DECIDED</span></span></span>`);
  const written = lib.previewWithStatus(before, "N001", "LANDED");
  ok("the header's own DECIDED gives way to the arc's LANDED, one badge labelled Status that links the arc's row, and the stale Arc fact is rewritten as the linked badge after the type",
    written === want, written);
  ok("a second write finds it current", lib.previewWithStatus(written, "N001", "LANDED") === written);
  ok("an arc still PROPOSED reads PROPOSED, since its design is not decided",
    lib.previewWithStatus(written, "N001", "PROPOSED") === eyebrow(`<span class="sds-line">${type}${sep}${arc}${sep}${shown}${status("PROPOSED")}</span>`));
  ok("the arc's status moving moves only the badge", lib.previewWithStatus(written, "N001", "PART-LANDED") === eyebrow(`<span class="sds-line">${type}${sep}${arc}${sep}${shown}${status("PART-LANDED")}</span>`));
  const two = eyebrow(`<span class="sds-line">${type}${sep}${shown}<span class="sds-state"><span class="sds-label">Design:</span> <span class="sds-badge sds-status sds-decided">DECIDED</span>${sep}<span class="sds-label">Arc:</span> <a href="../../approach.html#N001">N001</a> <span class="sds-badge sds-status sds-landed">LANDED</span></span></span>`);
  ok("a header showing two statuses, Design and Arc, becomes the one", lib.previewWithStatus(two, "N001", "LANDED") === want, lib.previewWithStatus(two, "N001", "LANDED"));
  const fileFact = eyebrow(`<span class="sds-line">${type}${sep}<span class="sds-label">Arc:</span> <span class="sds-badge">N001</span>${sep}${shown}<span class="sds-state"><span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-decided">DECIDED</span></span>${sep}<span class="sds-label">Arc file:</span> <a href="../../approach.html#N001">approach.html#N001</a></span>`);
  ok("an Arc file fact after the state goes, and the arc stays named by its one badge", lib.previewWithStatus(fileFact, "N001", "LANDED") === want, lib.previewWithStatus(fileFact, "N001", "LANDED"));
  ok("a header with no Arc fact and no status gains both", lib.previewWithStatus(eyebrow(`<span class="sds-line">${type}${sep}${shown}</span>`), "N001", "LANDED") === want);
  const stale = eyebrow(`<span class="sds-line">${type}${sep}<span class="sds-label">Arc:</span> <span class="sds-badge">N009</span>${sep}${shown}${status("LANDED")}</span>`);
  ok("a stale Arc fact naming another arc is rewritten, once", lib.previewWithStatus(stale, "N001", "LANDED") === want, lib.previewWithStatus(stale, "N001", "LANDED"));
  ok("a second write of the rewritten header changes nothing", lib.previewWithStatus(lib.previewWithStatus(stale, "N001", "LANDED"), "N001", "LANDED") === want);
  ok("the Arc fact stands right after the type and the page names the arc once", written.indexOf("Type:") < written.indexOf("Arc:") && written.indexOf("Arc:") < written.indexOf("Shown:") && written.split("Arc:").length === 2);
  ok("a page with no header line stays as it is", lib.previewWithStatus("<p>no header</p>\n", "N001", "LANDED") === "<p>no header</p>\n");

  const { root, ws } = await dataWorkspace("t-workstream-preview-status");
  const preview = join(ws, "notes", "N001", "preview.html");
  writeFileSync(preview, `<meta charset="utf-8">\n${before}<section id="s1"><h2>Overview</h2></section>\n`);
  ok("the writer writes the arc's status from its state.json, and names the preview it wrote",
    lib.writePreviewStatus(ws).join() === "notes/N001/preview.html" && readFileSync(preview, "utf8").includes(status("DECIDED")), readFileSync(preview, "utf8"));
  ok("and a second run writes nothing", lib.writePreviewStatus(ws).length === 0);
  const { cli } = await import("../../../helpers/workstream-fixture.mjs");
  // A step started: the arc reads RUNNING, worked out from its steps, and the preview shows it.
  const moved = cli(root, ["workstream", "row", "state", "031/N001", "1", "running"]);
  ok("a command that writes the arc writes the preview's status with it",
    moved.code === 0 && readFileSync(preview, "utf8").includes(`${status("RUNNING")}</span></div>`), `${moved.out}\n${readFileSync(preview, "utf8")}`);
}

console.log("\n=== a short subject — RULE.DEVEX.WORKSPACE.265");
{
  const { subjectFault } = schema;
  ok("one to three words of at most 24 characters hold", ["lenses", "web-stack", "surface-app-patterns"].every((one) => subjectFault(one) === null));
  ok("red: four words or more are refused", /is 5 words/.test(subjectFault("web-stack-and-partner-choices") ?? ""));
  ok("red: more than 24 characters is refused", /is 25 characters/.test(subjectFault("aaaaaaaaaaaa-bbbbbbbbbbbb") ?? ""), subjectFault("aaaaaaaaaaaa-bbbbbbbbbbbb"));
  ok("red: a sentence is not kebab-case", subjectFault("Layout model") !== null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream library` : `\n  all ${total} passed — workstream library`);
process.exit(failed ? 1 : 0);
