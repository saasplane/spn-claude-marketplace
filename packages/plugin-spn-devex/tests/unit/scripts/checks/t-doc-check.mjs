import { PLUGIN } from "../../../helpers/harness.mjs";
// `doc-check` — the largest port. A fixture proves each check still fires; the corpus diff (in
// t-doc-check-corpus.mjs) proves the port did not quietly change what it says about six hundred
// files nobody is going to re-read.
import { execFileSync } from "node:child_process";

import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { ARCS, artifactDocsDir, artifactIndex, capabilitiesDir, decisionsRegister, docsOf, domainConstructsDir, domainDirOf, constructsDir,
  guidePagesDir, hubPage, registersDir, workstreamsDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { OWN_COPY, STYLES_ADDRESS, linesFor } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";
import { cyclesOf, tableOf } from "../../../../src/scripts/commands/docs/cycles.ts";

const HOOKS = PLUGIN;
const SCRIPTS = resolve(HOOKS, "scripts");
const EVENTS = resolve(HOOKS, "src", "scripts", "events");

// EVERY PROBE SITS IN A TEMPORARY WORKSPACE. A probe path is the target of a simulated Write — the
// check reads the content from the payload and the path only for where it sits — so a neutral
// repository, `probe-repo`, stands in for any repository, and its paths are built through the same
// layout module the check uses. Only a rule that holds for the foundation alone (the hub's `.143`
// pair) names `spn-foundation`.
const WORKSPACE = realpathSync(mkdtempSync(join(tmpdir(), "doc-check-probe-")));
process.on("exit", () => rmSync(WORKSPACE, { recursive: true, force: true }));
const PROBE_REPO = join(WORKSPACE, "probe-repo");
const PROBE_DOCS = docsOf(PROBE_REPO);
// One domain's folder in the pocket, named as its seat folder is. Its overviews sit directly in it.
const PROBE_DOMAIN = domainDirOf(join(constructsDir(PROBE_DOCS), "01-probe"));
mkdirSync(join(WORKSPACE, ".spndevex"), { recursive: true });

// THE PARITY ARM IS THE INCUMBENT, AND THE INCUMBENT IS GOING AWAY. Until the plugin reinstall
// deletes `hooks/scripts/`, every case runs both implementations and requires them to agree. After
// that the Python is not there to run, and each case still asserts what the port itself must decide
// — which is the half that outlives the port.
const hasPython = (name) => existsSync(resolve(SCRIPTS, name));

const CWD = `${WORKSPACE}`;

let n = 0, failed = 0;

function notesOf(out) {
  if (!out) return "";
  try {
    const parsed = JSON.parse(out.split("\n").filter(Boolean).at(-1));
    return parsed.hookSpecificOutput?.additionalContext ?? parsed.systemMessage ?? "";
  } catch { return out; }
}

function run(cmd, args, payload) {
  try { return notesOf(execFileSync(cmd, args, { input: JSON.stringify(payload ?? {}), encoding: "utf8", cwd: CWD }).trim()); }
  catch (e) { return `ERROR ${String(e.stderr ?? e.message).slice(0, 300)}`; }
}

/** One payload through both, compared on the findings each reports. */
function one(label, payload, expect, says) {
  n += 1;
  const ts = run("node", [`${HOOKS}/src/scripts/checks/doc-check.ts`, "--stdin"], payload);
  const py = hasPython("doc-check.py") ? run("python3", [`${SCRIPTS}/doc-check.py`, "--stdin"], payload) : null;
  const saysOk = !says || ts.toLowerCase().includes(says.toLowerCase());
  const same = py === null || ts === py;
  const ok = (Boolean(ts) === (expect === "reports")) && saysOk && same;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect} · ts ${ts ? "reports" : "silent"} · py ${py === null ? "not installed" : py ? "reports" : "silent"} · identical ${same}${says ? ` · names "${says}" ${saysOk}` : ""}`);
  if (!ok) {
    console.log(`        ts: ${ts.slice(0, 460)}`);
    console.log(`        py: ${(py ?? "").slice(0, 460)}`);
  }
}

const write = (path, content) => ({ tool_name: "Write", tool_input: { file_path: path, content } });
const CHAPTER = join(capabilitiesDir(PROBE_DOCS), "01-devex", "04-workspace", "04-docs", "probe.md");
const REGISTER = join(registersDir(PROBE_DOCS), "probe.md");

// An approach page lives in the workstream that argues it, beside its arcs, so the probe page is
// compared with arcs on disk, kept as data: N1 and N2, carrying the statuses the clean page's Cycles
// table reads.
const putArc = (folder, id, name, status, reason = null) => {
  mkdirSync(join(folder, ARCS, id), { recursive: true });
  writeFileSync(join(folder, ARCS, id, "state.json"), `${JSON.stringify({ schemaVersion: 2, arc: id, subject: "the-arc", title: name,
    goal: "it lands", decides: `${name}, in one sentence.`, status, reason, preview: "preview.html", rows: [] }, null, 2)}\n`);
};
const stream = (root, name, state = "open", statuses = ["RUNNING", "DECIDED"]) => {
  const folder = join(workstreamsDir(root, state), name);
  putArc(folder, "N1", "the chapter", statuses[0]);
  putArc(folder, "N2", "the check", statuses[1], statuses[1] === "DROPPED" ? "2026-09-29" : null);
  return folder;
};
const PROBE_STREAM = stream(WORKSPACE, "041-probe");
const APPROACH = join(PROBE_STREAM, "probe-approach.html");

// The two lines a stored page carries: the shared stylesheet's, and the shared script's.
const STYLES = linesFor("1.0.0");

// A page that passes everything, used as the base for each known-bad mutation. It is in the shared
// form: it links one version of the shared stylesheet, and every class of it opens with `sds-`.
const CLEAN_FOUR = `<!doctype html>
${STYLES.stylesheet}
<div class="sds-eyebrow">Who this is for &middot; the developer picking up this work</div>
<h1>A subject</h1>
<p class="sds-standfirst">This page plans a change to where the model is written down.</p>
<p>Read it to see what will change and why, before anything is built.</p>
<section id="s1"><div class="sds-section-head"><h2>Why &mdash; the reason</h2></div>
  <p>You open this page when the model has no single home. You read it once and you know where each piece sits.</p>
  <p>Split it where it runs long. Say what you mean, and keep the reason beside the rule.</p>
</section>
<section id="s2"><div class="sds-section-head"><h2>What &mdash; the shape</h2></div>
  <p>You get one place for the model. You get one shape per page, and you get one plain voice.</p>
</section>
<section id="s3"><div class="sds-section-head"><h2>How &mdash; the order</h2></div>
  <h3 id="h1">spn-foundation &mdash; the chapter</h3>
  <p>You read the chapter first, and the code follows it.</p>
  <h3 id="h9">Cycles &mdash; the arcs, in the order they run</h3>
  <div class="sds-scroll"><table><thead><tr><th>Arc</th><th>What it does</th><th>Status</th><th>Previews</th></tr></thead>
  <tbody><tr><td><strong>N1 &mdash; the chapter</strong><br><a class="sds-small" href="arcs/N1-the-chapter.md">arcs/N1-the-chapter.md</a></td><td>the chapter, in one sentence.</td><td>RUNNING</td><td>&mdash;</td></tr>
  <tr><td><strong>N2 &mdash; the check</strong><br><a class="sds-small" href="arcs/N2-the-check.md">arcs/N2-the-check.md</a></td><td>the check, in one sentence.</td><td>DECIDED</td><td>&mdash;</td></tr></tbody></table></div>
</section>
`;

// The same page with the two-column Cycles table an open workstream carries, written from a folder's
// arcs: the Arc cell holds the title, the line and the facts, and the Status cell the badge.
// A status as an open page draws it: its badge (05-artifacts.md § How ends in Cycles).
const BADGE = (word) => `<span class="sds-badge sds-status sds-${word.toLowerCase()}">${word}</span>`;
const cleanFor = (folder) => CLEAN_FOUR.replace(/  <div class="sds-scroll"><table>[\s\S]*<\/table><\/div>\n/, `${tableOf(cyclesOf(folder))}\n`);
const CLEAN = cleanFor(PROBE_STREAM);

// The same page with the Cycles table a closed workstream keeps: three columns, no file link.
const NO_PREVIEWS = CLEAN_FOUR
  .replace("<th>Previews</th>", "")
  .replace(/<br><a class="sds-small"[^>]*>[^<]*<\/a>/g, "")
  .replace(/<td>&mdash;<\/td><\/tr>/g, "</tr>");

console.log("\n=== doc-check — the fixtures");

// THE TWO MEASURES THE BOOK RETIRED, asserted SILENT.
//
// Both were known-bad fixtures until 2026-09-19. `05-docs/01-corpus.md` § The readability bar now
// says seven rules are the whole bar and none of them measures length, and `04-discipline.md` says
// it outright: *no rule measures length, and no rule counts `you`*. A check still firing on either
// produces a finding that is always wrong, and **a finding that is usually wrong teaches people to
// stop reading the run** — which is the same argument `restates.py` gives for a per-citation hash.
//
// They are kept as cases rather than deleted, because a silent check proves nothing unless somebody
// feeds it the thing it used to catch.
one("a sentence past thirty words — RETIRED, must stay silent",
  write(CHAPTER,
    "# A chapter\n\nYou will find that this one sentence runs on and on and on past the bar the book " +
    "once set for it, because it keeps adding clause after clause after clause until nobody reading " +
    "it can remember how it began or what it was ever meant to say.\n"),
  "silent");

// KNOWN-BAD, one rule each.

one("cardinality written into prose",
  write(CHAPTER, "# A chapter\n\nYou will find five decisions here. You read each one and you move on.\n"),
  "reports", "cardinality-in-prose");

one("an idiom a second-language reader cannot guess",
  write(CHAPTER, "# A chapter\n\nYou get it out of the box. You read it once and you are done with it.\n"),
  "reports", "idiom");

// RETIRED with the length cap, and for a sharper reason: a count of a pronoun cannot see an
// imperative, so it read every instruction file as silent when it was anything but.
//
// AND THE REACH SHARE IS RETIRED AS A FINDING TOO (Q100, decided N13). It survives as a STATISTIC in
// the rates table, because a share is read across a corpus and not pronounced on one file — the
// measure admits it cannot see one of the three moves, and a verdict from a measure that
// under-counts is a verdict nobody can act on. So this file, which reaches its reader by none of the
// three moves, must now draw NOTHING from either measure.
one("prose that never says you draws no finding — neither the count nor the share",
  write(CHAPTER, "# A chapter\n\n" + Array.from({ length: 9 }, (_, i) =>
    `The seat holds its own files and nothing else, in case ${i + 1}.`).join(" ") + "\n"),
  "silent");

one("an approach page with no Why, What or How",
  write(APPROACH, `${STYLES.stylesheet}<div class="sds-eyebrow">Who this is for &middot; a reader</div><section><h2>Background</h2><p>You read it once and you know it.</p></section>`),
  "reports", "carries no why + what + how");

one("an overview carrying an argument's organs",
  write(join(PROBE_DOMAIN, "probe-overview.html"),
    `${STYLES.stylesheet}<div class="sds-eyebrow">Who this is for &middot; a reader</div><section><h2>Open</h2><p>You read it once and you know it.</p></section>`),
  "reports", "overview carries open");

one("an approach page sitting beside a domain's overviews",
  write(join(PROBE_DOMAIN, "probe-approach.html"), CLEAN),
  "reports", "does not end -overview.html");

one("an Open card carrying no options table",
  write(APPROACH, CLEAN + `<section id="s4"><h2>Open</h2><div class="sds-open"><h4 id="q1">Q1 &middot; a question</h4><p>You decide it yourself.</p></div></section>`),
  "reports", "carries no options table");

// A card in an approach page's Open carries a part named Views (RULE.DEVEX.WORKSPACE.242, Q50 B). The
// check reads that the labelled block is there, and never what it says.
{
  const VIEWS = `<span class="sds-key">Views</span>\n<p>Architect and partner, because the choice changes what a partner builds on. Architect: the platform must not name a service built on it. Partner: no objection.</p>`;
  const openCard = (views, title = "Q1 &middot; a question") => CLEAN + `<section id="s4"><h2>Open</h2><div class="sds-open"><h4 id="q1">${title}</h4>
<span class="sds-key">Options</span>
<div class="sds-scroll"><table><thead><tr><th></th><th>Option</th></tr></thead><tbody><tr><td><strong>A</strong></td><td>one way</td></tr><tr><td><strong>B</strong></td><td>another way</td></tr></tbody></table></div>
${views}
<div class="sds-recommended"><b>Recommended: A.</b> <b>Decision:</b> &mdash;</div></div></section>`;
  one("an Open card carrying its Views part", write(APPROACH, openCard(VIEWS)), "silent");
  one("known-bad: an Open card with no Views part", write(APPROACH, openCard("")), "reports", "carries no Views part");
  const { openCards } = await import("../../../../src/scripts/checks/doc-check.ts");
  for (const [what, got, expected] of [
    ["a card without the part draws one RULE finding", openCards(openCard("")).filter(([severity, message]) => severity === "RULE" && message.includes("Views")).length, 1],
    ["and nothing else, so the page's other parts are not reported beside it", openCards(openCard("")).length, 1],
    ["the finding says where the part goes: after What and before the options",
      openCards(openCard("")).filter(([, message]) => message.includes("after What and before the options")).length, 1],
    ["known-bad: the finding no longer sends the part after the options",
      openCards(openCard("")).filter(([, message]) => message.includes("a paragraph after the options")).length, 0],
    ["a card with the part draws none", openCards(openCard(VIEWS)).length, 0],
    ["known-bad: the word in the card's title or its prose is not the part",
      openCards(openCard("<p>The views differ on this one.</p>", "Q1 &middot; whose Views count")).length, 1],
    ["a card with no options table and no Views part is told both", openCards(openCard("").replace(/(<span class="sds-key">Options<\/span>\n)<div class="sds-scroll">[\s\S]*?<\/div>/, "$1")).length, 2],
    ["a Deferred card is not asked for the part",
      openCards(openCard("").replace("<h2>Open</h2>", "<h2>Deferred</h2>").replace("&mdash;</div>", "&mdash; It comes back when the release lands.</div>")).length, 0],
  ]) { n += 1; const ok = got === expected; if (!ok) failed += 1;
       console.log(`  ${ok ? "PASS" : "FAIL"}  Views — ${what}${ok ? "" : ` — got ${got}, expected ${expected}`}`); }
}

one("a Deferred card naming no trigger",
  write(APPROACH, CLEAN + `<section id="s5"><h2>Deferred</h2><div class="sds-open"><h4 id="q2">Q2 &middot; a parked thing</h4><p>You leave this one alone.</p></div></section>`),
  "reports", "names no trigger");

one("a register row that says you",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| DEC.SUPPORT.EVENTS.099 | you may not do it |\n"),
  "reports", "says *you*");

// N27 step 12 — a row that QUOTES somebody saying `you` is evidence, not the row warming its reader.
// RULE.DEVEX.WORKSPACE.112 says the marking is how a check tells the two apart, and the exemption used to cover
// only the bare word in italics, so a quoted PHRASE still fired. Four real rows carried one.
one("a register row quoting a person saying you — the marking is the exemption",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| DEC.SUPPORT.EVENTS.099 | " +
    "Asked by the developer: *\"you can call revoke signed-in if other tests are working\"* |\n"),
  "silent");

one("a register row citing another document's phrase in italics",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| DEC.SUPPORT.EVENTS.099 | " +
    "A number written **four ways**, and the section's own *seven yours and two the agent's* again |\n"),
  "silent");

one("a register row quoting a string in double quotes",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| DEC.SUPPORT.EVENTS.099 | " +
    "The hub shows a neutral \"taking you to your provider\" state until the redirect leaves |\n"),
  "silent");

// The other half, and the one that matters: the exemption must not swallow a real breach. Bold is in
// the row on purpose — `**shape**` leaves an unpaired asterisk, and an exemption that strips every
// marked span pairs it with the opening `*` of a later `*you*` and exposes the word it was meant to
// protect. Anchoring the exemption on the word is what makes this case pass.
one("a register row that says you beside bold — still reports",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| DEC.SUPPORT.EVENTS.099 | " +
    "A row keeps its **shape**, and you should install the plugin before you open a window |\n"),
  "reports", "says *you*");

// N27 step 13 — `one` is a pronoun as often as it is an impersonal subject, and only the obligation
// form is the construction RULE.DEVEX.WORKSPACE.096 is named after.
one("one as a pronoun, not an impersonal subject",
  write(CHAPTER, "# A probe\n\n`For: Architect` \u00b7 `Status: \ud83d\udd2e PLANNING`\n\n" +
    "Modules are separated precisely because a change to one must not force a redeploy of another, " +
    "and you can read the boundary off the manifest itself.\n"),
  "silent");

one("one as an impersonal subject — still reports",
  write(CHAPTER, "# A probe\n\n`For: Architect` \u00b7 `Status: \ud83d\udd2e PLANNING`\n\n" +
    "One must install the plugin before opening a window, and you will not see it otherwise.\n"),
  "reports", "written about the reader");

one("a register row past twenty-five words",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| DEC.SUPPORT.EVENTS.099 | " +
    "A row states one clause a sentence and never more than that, and this particular row keeps " +
    "going well past the bar the chapter sets for it in every direction. |\n"),
  "reports", "a row states one clause a sentence");

one("a register row that rules over another row",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| DEC.SUPPORT.EVENTS.099 | Supersedes DEC.SUPPORT.EVENTS.008 |\n"),
  "reports", "rules over DEC.SUPPORT.EVENTS.008");

// A decision id names its domain now (`RD.<DOMAIN>.<SUBDOMAIN>.<NNN>`), and the id inside a
// supersession clause must be read with the same grammar as a register row's own id — this is the
// known-bad case: the two-segment pattern this check carried before stopped matching the moment a
// cited id gained a domain segment, and a stale ruling would have gone unreported.
one("a register row that rules over a four-part id",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n" +
    "| RULE.SUPPORT.APPS.099 | Supersedes RULE.SUPPORT.APPS.008 |\n"),
  "reports", "rules over RULE.SUPPORT.APPS.008");

// The repository-letter form (`PD1`, `SD23`) is retired — no id in the corpus is written that way
// any more, and accepting it here would let a real, current supersession clause hide behind a shape
// that reads as an id but is not one.
one("the retired repository-letter form is not read as a register id",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| DEC.SUPPORT.EVENTS.099 | Supersedes PD1 |\n"),
  "silent");

// The rule fires on a `CONCEPT.md` with a node manifest beside it and no `sprepo.json`, so the probe
// node carries a fixture `spkind.json` on disk.
const PROBE_NODE = join(PROBE_REPO, "apps", "probe-app");
mkdirSync(PROBE_NODE, { recursive: true });
writeFileSync(join(PROBE_NODE, "spkind.json"), `{ "kind": "APP_WEB", "name": "probe-app" }\n`);
one("a CONCEPT.md sitting beside a node manifest",
  write(join(PROBE_NODE, "CONCEPT.md"), "# A concept\n\nYou read it here.\n"),
  "reports", "belongs to a repo root");

// UNTOUCHED — every shape that must stay writable.
one("a well-formed approach page", write(APPROACH, CLEAN), "silent");

one("a file the standard does not watch",
  write(join(PROBE_REPO, "src", "thing.ts"), "export const x = 1;\n"), "silent");

one("an arc under .spndevex is state, not corpus",
  write(join(workstreamsDir(WORKSPACE, "open"), "008-plain-probe", ARCS, "probe.md"),
    "# Arc\n\n" + Array.from({ length: 9 }, () => "The seat holds its own files and nothing else here.").join(" ")),
  "silent");

one("a rule may quote the mistake it bans",
  write(CHAPTER, "# A chapter\n\nYou never write *five decisions* into a sentence. You name the set by its rule.\n"),
  "silent");

console.log("\n=== doc-check — the masthead: h1, an optional p.sds-subtitle, one p.sds-standfirst (RULE.DEVEX.WORKSPACE.187)");

// The same function `docs audit` runs, so a page is judged alike when it is saved and when it is audited.
const CONSTRUCT = join(domainConstructsDir(PROBE_DOMAIN), "probe-construct.html");
const page = (inner) => `<!doctype html>
${STYLES.stylesheet}
<header class="sds-masthead">
  <div class="sds-eyebrow"><span class="sds-audience">Architect</span></div>
${inner}
</header>
<section id="s0"><div class="sds-section-head"><h2>Overview</h2></div>
  <p>You read this part when you need the core. You leave it knowing where each piece sits.</p>
</section>
`;
// The same builder under a name the cases further down can reach, where `page` names a file.
const constructPage = (inner) => page(inner);
const MAST = `  <h1>Probe</h1>\n  <p class="sds-subtitle">You keep one place for the model.</p>\n  <p class="sds-standfirst">This page covers the probe. Read it before you change it.</p>`;

one("a construct masthead with h1, Subtitle and Description", write(CONSTRUCT, page(MAST)), "silent");
one("a construct with no Subtitle — the Subtitle is optional",
  write(CONSTRUCT, page(MAST.replace(/  <p class="sds-subtitle">.*\n/, ""))), "silent");
one("a second paragraph after the Description is SOFT until every tree is retrofitted (N116 row 9)",
  write(CONSTRUCT, page(MAST + "\n  <p>You also read this, and it should be in the first section.</p>")),
  "reports", "[SOFT] the header carries 1 paragraph past the Subtitle and the Description");
// MEASURED on a domain's README construct page, 2026-10-26: its table of constructs sits in the header, and each item
// cell holds two paragraphs of its own (RULE.DEVEX.WORKSPACE.259), which are the table's and never the header's.
one("a table's item cells in the header are not paragraphs of the header, so only the one paragraph is counted",
  write(CONSTRUCT, page(MAST + "\n  <p>You also read this.</p>\n  <table><thead><tr><th>Construct</th></tr></thead><tbody>" +
    "<tr><td><p><strong>One</strong></p><p>The first piece of the model.</p></td></tr><tr><td><p><strong>Two</strong></p><p>The second piece.</p></td></tr></tbody></table>")),
  "reports", "[SOFT] the header carries 1 paragraph past the Subtitle and the Description");
one("two standfirsts are a second paragraph",
  write(CONSTRUCT, page(MAST + `\n  <p class="sds-standfirst">You read a second Description here.</p>`)),
  "reports", "[SOFT] the header carries 1 paragraph");
one("a Subtitle of two sentences is SOFT",
  write(CONSTRUCT, page(MAST.replace("the model.</p>", "the model. You keep it there.</p>"))),
  "reports", "[SOFT] the Subtitle runs to 2 sentences");
one("a construct header with no Description is SOFT",
  write(CONSTRUCT, page(MAST.replace(/\n  <p class="sds-standfirst">.*/, ""))),
  "reports", "[SOFT] the header has no Description");
one("a Subtitle under the Description is out of place",
  write(CONSTRUCT, page(`  <h1>Probe</h1>\n  <p class="sds-standfirst">This page covers the probe. Read it before you change it.</p>\n  <p class="sds-subtitle">You keep one place for the model.</p>`)),
  "reports", "[SOFT] the Subtitle is out of place");
// THE PLACE OF A PAGE UNDER THE POCKET'S `docs` FOLDER NAMES ITS KIND. A page in a `constructs` folder
// is a construct page, and every other page is an overview: beside the hub, or in a domain's folder.
{
  const OVERVIEW = `<!doctype html>\n${STYLES.stylesheet}\n<div class="sds-eyebrow">Who this is for &middot; a reader</div>\n` +
    `<section><h2>Overview</h2><p>You read it once and you know it.</p></section>`;
  const strayConstruct = join(PROBE_DOMAIN, "probe-construct.html");
  one("[MKT.SCRIPTS.110] an overview in its domain's folder is held to its suffix, and draws no finding about its place",
    write(join(PROBE_DOMAIN, "probe-overview.html"), OVERVIEW), "silent");
  one("[MKT.SCRIPTS.110] an overview beside the hub draws none either",
    write(join(artifactDocsDir(PROBE_DOCS), "probe-overview.html"), OVERVIEW), "silent");
  one("[MKT.SCRIPTS.110] a construct page beside its domain's overviews is refused: outside a constructs folder a page is an overview",
    write(strayConstruct, page(MAST)), "reports", "in no constructs/ folder, but does not end -overview.html");
  one("[MKT.SCRIPTS.110] and the finding names the same page's path in its domain's constructs folder",
    write(strayConstruct, page(MAST)), "reports", `this page belongs at ${relative(PROBE_REPO, CONSTRUCT)}`);
  one("[MKT.SCRIPTS.110] an overview in a constructs folder is refused: a page there is a construct page",
    write(join(domainConstructsDir(PROBE_DOMAIN), "probe-overview.html"), OVERVIEW), "reports", "sits in constructs/ but does not end -construct.html");
  one("[MKT.SCRIPTS.110] a page of another name beside the hub is held to the overview's suffix",
    write(join(artifactDocsDir(PROBE_DOCS), "probe-notes.html"), OVERVIEW), "reports", "does not end -overview.html");
}

// THE HUB CASES ARE HERMETIC. The pair is read from the register beside the page, so each case
// builds its own workspace holding a stub DEC.DEVEX.WORKSPACE.143 row, and the suite never depends
// on what the real foundation's register says today.
{
  const HUB_WS = realpathSync(mkdtempSync(join(tmpdir(), "doc-check-hub-")));
  try {
    const hubIn = (repoName, register) => {
      const docs = docsOf(join(HUB_WS, repoName));
      mkdirSync(artifactDocsDir(docs), { recursive: true });
      if (register !== null) {
        mkdirSync(registersDir(docs), { recursive: true });
        writeFileSync(decisionsRegister(docs),
          "# Decisions\n\n| ID | Area | Decision | Why | When |\n| --- | --- | --- | --- | --- |\n" + register);
      }
      return hubPage(docs);
    };
    const STUB = "| DEC.DEVEX.WORKSPACE.143 | [docs](x.md) | **The punchline is `A stub title for the probe.`, and the " +
      "statement beside it does not change.** The statement below it reads *the stub subtitle, read from the row*. | why | 2026-09 |\n";
    const foundationHub = hubIn("spn-foundation", STUB);
    const mast = (h1, sub) => page(`  <h1>${h1}</h1>\n  <p class="sds-subtitle">${sub}</p>\n  <p class="sds-standfirst">This page is where you start. Read it first.</p>`);

    one("a register still holding the retired RD form of the row is not read as the pair",
      write(hubIn("spn-retired", STUB.replace("DEC.DEVEX", "RD.DEVEX")), mast("Ship it faster.", "You build on one base.")),
      "silent");
    one("the foundation hub with the stub row's pair, word for word",
      write(foundationHub, mast("A stub title for the probe.", "The stub subtitle, read from the row.")), "silent");
    one("the foundation hub with a Title of its own",
      write(foundationHub, mast("Ship it faster.", "The stub subtitle, read from the row.")),
      "reports", "[SOFT] the foundation hub's Title is not DEC.DEVEX.WORKSPACE.143's, word for word — \"A stub title for the probe.\"");
    one("the foundation hub with a Subtitle of its own",
      write(foundationHub, mast("A stub title for the probe.", "You build on one base.")),
      "reports", "[SOFT] the foundation hub's Subtitle is not DEC.DEVEX.WORKSPACE.143's");
    one("a .143 row the check cannot read is said, never passed",
      write(hubIn("spn-unreadable", "| DEC.DEVEX.WORKSPACE.143 | a | no pair here | b | c |\n"), mast("x y z", "You build on one base.")),
      "reports", "could not be read from the row");
    one("another repository's hub, whose register has no .143 row, is not held to the pair",
      write(hubIn("spn-support-ts", "| RULE.SUPPORT.APPS.001 | a | b | c | d |\n"), mast("Ship it faster.", "You build on one base.")),
      "silent");
    one("a partner's workspace with no register at all skips the pair silently",
      write(hubIn("partner-docs", null), mast("Ship it faster.", "You build on one base.")),
      "silent");
  } finally {
    rmSync(HUB_WS, { recursive: true, force: true });
  }
}

console.log("\n=== doc-check — the approach page: an opening, five sections, How ending in Cycles");

// 05-artifacts.md § The approach document. The page is an opening, then Why > What > How > Open >
// Deferred, nothing else; there is no Terms section; How's last subsection is Cycles.
const HOW_TAIL = /<h3 id="h9">[\s\S]*?<\/table><\/div>\n/;

one("How with no Cycles, only the retired What re-aligns",
  write(APPROACH, CLEAN.replace(HOW_TAIL, `<h3>What re-aligns</h3>\n  <table><thead><tr><th>What</th><th>Scope</th><th>State</th></tr></thead><tbody><tr><td>x</td><td>y</td><td>z</td></tr></tbody></table>\n`)),
  "reports", "does not end in Cycles");

one("a subsection after Cycles",
  write(APPROACH, CLEAN.replace("</section>\n`", "").replace(/<\/table><\/div>\n<\/section>/, `</table></div>\n  <h3 id="h10">Later &mdash; a note</h3>\n  <p>You read this after the table.</p>\n</section>`)),
  "reports", "after Cycles");

one("Cycles whose table has the wrong columns",
  write(APPROACH, CLEAN.replace(">Status</th>", ">Scope</th>")),
  "reports", "Arc · Status");

one("a Terms section — an approach page has none",
  write(APPROACH, CLEAN.replace(`<section id="s1">`, `<section id="s0"><h2>Terms</h2><p>You read the words here.</p></section>\n<section id="s1">`)),
  "reports", "carries a Terms section");

one("a section outside the five",
  write(APPROACH, CLEAN + `<section id="s6"><h2>Background &mdash; history</h2><p>You read the history here.</p></section>`),
  "reports", "and nothing else");

one("sections out of order",
  write(APPROACH, CLEAN.replace(`<h2>What &mdash; the shape</h2>`, `<h2>Deferred &mdash; parked</h2>`)
    + `<section id="s7"><h2>What &mdash; late</h2><p>You read it last.</p></section>`),
  "reports", "the order is Why > What > How > Open > Deferred");

one("no opening — no standfirst above Why",
  write(APPROACH, CLEAN.replace(/<p class="sds-standfirst">[^\n]*\n/, "")),
  "reports", "has no opening");

// THE COMPARISON NEEDS REAL ARCS, so a workstream is built in a temporary folder: a page and its
// arcs, in the layout `.spndevex/workstreams/<state>/<NNN>-<subject>/`.
const TMP = realpathSync(mkdtempSync(join(tmpdir(), "doc-check-cycles-")));
try {
  const home = stream(TMP, "042-probe");
  const page = join(home, "probe-approach.html");

  one("Cycles matching the arcs, row for row and status for status",
    write(page, CLEAN), "silent");

  one("a Cycles status the arc does not carry",
    write(page, CLEAN.replace(`<td>${BADGE("DECIDED")}</td>`, `<td>${BADGE("RUNNING")}</td>`)),
    "reports", "N2 reads RUNNING and the arc reads DECIDED");

  one("an arc with no row in Cycles",
    write(page, CLEAN.replace(/\n\s*<tr id="N2"[^\n]*/, "")),
    "reports", "has no row for N2");

  one("a Cycles row naming no arc",
    write(page, CLEAN.replace("</tbody>", `<tr><td><strong>N3 &mdash; typed by hand</strong></td><td>DECIDED</td></tr></tbody>`)),
    "reports", "lists N3");

  one("a status cell carrying its blocker still reads as its word",
    write(join(stream(TMP, "043-held"), "held-approach.html"), CLEAN.replace(`<td>${BADGE("RUNNING")}</td>`, `<td>${BADGE("RUNNING")} &middot; since today</td>`)),
    "silent");

  one("the same rows in another order — a person chooses the order the arcs run in",
    write(page, CLEAN.replace(/(<tbody>\n)(\s*<tr id="N1"[^\n]*\n)(\s*<tr id="N2"[^\n]*\n)/, "$1$3$2")),
    "silent");

  one("a row whose Arc cell links a preview the arc's notes do not hold",
    write(page, CLEAN.replace(`<span class="sds-small"></span></td><td>${BADGE("DECIDED")}`,
      `<span class="sds-small">Preview: <a href="notes/N2/preview.html">preview.html</a></span></td><td>${BADGE("DECIDED")}`)),
    "reports", "N2's links are not the arc's preview and samples");

  one("a row named differently from its arc's heading",
    write(page, CLEAN.replace("N2 &mdash; the check</strong>", "N2 &mdash; the gate</strong>")),
    "reports", `N2 is named "N2 — the gate" and the arc is "N2 — the check"`);

  one("a line under the title typed by hand",
    write(page, CLEAN.replace("the check, in one sentence.", "a check reads the new shape")),
    "reports", "N2's line is not the arc's own line");

  one("four columns in an open workstream — told to run the command",
    write(page, CLEAN_FOUR), "reports", "run `spn-devex docs cycles write <workstream>`");

  // THE TABLE WITH NO PREVIEWS COLUMN, in each of the three states. A workstream being worked or
  // parked is told to print the table again; a closed one stays as it was written.
  one("three columns in an open workstream — told to run the command",
    write(page, NO_PREVIEWS), "reports", "run `spn-devex docs cycles write <workstream>`");
  one("three columns in a backlog workstream — told to run the command",
    write(join(stream(TMP, "045-parked", "backlog"), "approach.html"), NO_PREVIEWS),
    "reports", "where an open workstream carries Arc · Status");
  const closedPage = join(stream(TMP, "046-done", "closed"), "done-approach.html");
  one("three columns in a closed workstream — never judged for the column",
    write(closedPage, NO_PREVIEWS), "silent");
  one("a closed workstream's page stays as it closed: a status its arc does not carry is not compared",
    write(closedPage, NO_PREVIEWS.replace("<td>DECIDED</td>", "<td>RUNNING</td>")), "silent");
  one("four columns in a closed workstream, matching its arcs",
    write(closedPage, CLEAN_FOUR), "silent");
  one("two columns in a closed workstream, matching its arcs",
    write(closedPage, CLEAN), "silent");

  // AN ARC NUMBERED IN THREE DIGITS, WITH A PREVIEW AND A SAMPLE, linked from the page's workstream folder.
  const previewed = join(workstreamsDir(TMP, "open"), "047-previewed");
  putArc(previewed, "N001", "the chapter", "RUNNING");
  putArc(previewed, "N002", "the check", "DECIDED");
  mkdirSync(join(previewed, "notes", "N001", "samples"), { recursive: true });
  writeFileSync(join(previewed, "notes", "N001", "preview.html"), "<h1>the layout</h1>\n");
  writeFileSync(join(previewed, "notes", "N001", "samples", "close-message.md"), "the close\n");
  const PILLS = `Preview: <a href="notes/N001/preview.html">preview.html</a> &middot; Sample: <a href="notes/N001/samples/close-message.md">close-message.md</a>`;
  const PREVIEWED = cleanFor(previewed);
  const previewedPage = join(previewed, "approach.html");
  one("three-digit arcs, and facts matching the arc's preview and sample",
    write(previewedPage, PREVIEWED), "silent");
  one("facts left out while the arc's notes hold two files",
    write(previewedPage, PREVIEWED.replace(PILLS, "")),
    "reports", "N001's links are not the arc's preview and samples");
  one("a fact whose link is written from arcs/ rather than from the page",
    write(previewedPage, PREVIEWED.replace(`href="notes/N001/preview.html"`, `href="../notes/N001/preview.html"`)),
    "reports", "N001's links are not the arc's preview and samples");

  // 008 is exempt by name: its page keeps the shape it was written in.
  const exempt = stream(TMP, "008-plain-probe");
  one("workstream 008's page — exempt by name from Terms and Cycles",
    write(join(exempt, "plain-probe-approach.html"),
      CLEAN.replace(HOW_TAIL, "").replace(`<section id="s1">`, `<section id="s0"><h2>Terms</h2><p>You read the words here.</p></section>\n<section id="s1">`)),
    "silent");

  console.log("\n=== doc-check — an arc is data, and a Markdown arc file is no document it reads");

  // THE RETIRED FORM COUNTS FOR NOTHING. The arc's rows are written by `workstream row add`, which
  // names a row out of chain order itself; a Markdown arc written by hand is read by no check here.
  one("a Markdown arc file under arcs/ with rows out of chain order draws nothing",
    write(join(home, ARCS, "N4-late-docs.md"), "# N4 — late docs\n\nStatus: **DECIDED.**\n\n## Steps\n\n" +
      "| # | Repo | Altitude | What | Mechanism | Acceptance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n" +
      "| 1 | spn-support-ts | CODE | a | by hand | b | |\n| 2 | spn-support-ts | DOCS | a | by hand | b | |\n"), "silent");

  console.log("\n=== doc-check — the header's status against the arcs, when the whole page is written");

  // The header line as the approach template writes it: the status in its own labelled badge.
  const withStatus = (text, word, glyph = "&#x1F52E;") => text.replace(/<div class="sds-eyebrow">[^\n]*<\/div>/,
    `<div class="sds-eyebrow"><span class="sds-line1">Who this is for &middot; the developer</span><span class="sds-state"><span class="sds-label">Status:</span> ` +
    `<span class="sds-badge sds-status sds-${word.toLowerCase()}">${glyph} ${word}</span></span></div>`);
  // A workstream of its own, holding N1 at RUNNING and N2 at DECIDED, so the arcs give IMPLEMENTING.
  const statusPage = join(stream(TMP, "050-status"), "approach.html");
  one("[MKT.HOOKS.40] known-bad: a page reading PLANNING while an arc runs — both words are named",
    write(statusPage, withStatus(CLEAN, "PLANNING")), "reports", "the header's status reads PLANNING and the arcs give IMPLEMENTING");
  one("[MKT.HOOKS.40] and the finding names the command that writes it",
    write(statusPage, withStatus(CLEAN, "PLANNING")), "reports", "spn-devex docs cycles write <workstream>");
  one("[MKT.HOOKS.40] a page reading IMPLEMENTING while an arc runs is left alone",
    write(statusPage, withStatus(CLEAN, "IMPLEMENTING", "&#x1F6A7;")), "silent");
  one("[MKT.HOOKS.40] a page whose header labels no status is left alone", write(statusPage, CLEAN), "silent");

  // A workstream whose arcs are all at PROPOSED or DECIDED: the arcs give PLANNING.
  const planning = stream(TMP, "048-planning", "open", ["PROPOSED", "DECIDED"]);
  const PLANNED = cleanFor(planning);
  one("[MKT.HOOKS.40] a page reading PLANNING while no arc is past DECIDED is left alone",
    write(join(planning, "approach.html"), withStatus(PLANNED, "PLANNING")), "silent");
  one("[MKT.HOOKS.40] known-bad: a page reading IMPLEMENTING while no arc is past DECIDED",
    write(join(planning, "approach.html"), withStatus(PLANNED, "IMPLEMENTING", "&#x1F6A7;")),
    "reports", "the header's status reads IMPLEMENTING and the arcs give PLANNING");

  one("[MKT.HOOKS.40] a page in closed/ that reads DONE is left alone",
    write(closedPage, withStatus(CLEAN, "DONE", "&#x2705;")), "silent");
  one("[MKT.HOOKS.40] known-bad: a page in closed/ that still reads IMPLEMENTING",
    write(closedPage, withStatus(CLEAN, "IMPLEMENTING", "&#x1F6A7;")), "reports", "a closed workstream reads DONE");
  one("[MKT.HOOKS.40] workstream 008's page is exempt by name",
    write(join(exempt, "plain-probe-approach.html"), withStatus(CLEAN, "PLANNING").replace(HOW_TAIL, "")), "silent");

  // THE STAMP BEFORE THE MOVE. The close gate asks for a page that says it is finished before the
  // folder moves, so a page in `open/` may read DONE once every arc carries a terminal status.
  const landing = stream(TMP, "049-landing", "open", ["LANDED", "DROPPED"]);
  const LANDED_PAGE = cleanFor(landing);
  one("[MKT.HOOKS.40] a page in open/ stamped DONE once every arc is terminal is left alone",
    write(join(landing, "approach.html"), withStatus(LANDED_PAGE, "DONE", "&#x2705;")), "silent");
  one("[MKT.HOOKS.40] known-bad: a page in open/ stamped DONE while an arc still runs",
    write(statusPage, withStatus(CLEAN, "DONE", "&#x2705;")), "reports", "the header's status reads DONE and the arcs give IMPLEMENTING");

  // THE SWEEP READS THE PAGE, and counts each document it scanned — a bad path reads `0 scanned`. A
  // Markdown arc file beside it is no document of the sweep's.
  n += 1;
  const sweptHome = stream(TMP, "044-sweep");
  writeFileSync(join(sweptHome, "sweep-approach.html"), cleanFor(sweptHome));
  writeFileSync(join(sweptHome, ARCS, "N4-late-docs.md"), "# N4 — late docs\n\nStatus: **DECIDED.**\n");
  let out = "", code = 0;
  try { out = execFileSync("node", [`${HOOKS}/src/scripts/checks/doc-check.ts`, sweptHome], { encoding: "utf8", cwd: CWD }); }
  catch (e) { out = String(e.stdout ?? ""); code = e.status; }
  const scanned = /(\d+) documents scanned/.exec(out)?.[1];
  const swept = scanned === "1" && !out.includes("N4-late-docs.md") && code === 0;
  if (!swept) failed += 1;
  console.log(`  ${swept ? "PASS" : "FAIL"}  the sweep scans the page and no Markdown arc file\n        scanned ${scanned} · exit ${code}${swept ? "" : `\n${out.slice(0, 600)}`}`);

  console.log("\n=== doc-check — a page that holds its own copy of the styles");

  const { check, checkDoc, uncutVersions, watched } = await import("../../../../src/scripts/checks/doc-check.ts");
  const tell = (label, ok, detail = "") => {
    n += 1;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`);
  };

  // KNOWN-BAD: an arc's preview written with its own markup, no masthead and no shared stylesheet. Before the
  // workstreams moved under `.spndevex/workstreams/`, the hook watched `.spndevex/notes/` only, and this page passed unread.
  const arcPreview = join(TMP, ".spndevex", "workstreams", "open", "060-arc-preview", "notes", "N010", "preview.html");
  tell("an arc's preview under `.spndevex/workstreams/<state>/<ws>/notes/N<nnn>/` is watched", watched(arcPreview));
  tell("a sample beside it is not read as a page", !watched(join(dirname(arcPreview), "samples", "page.html")));
  const handMade = checkDoc({ tool_input: { file_path: arcPreview, content: "<!doctype html><title>x</title><h1>A preview</h1><p>Its own page.</p>\n" } });
  tell("a preview with its own markup and no masthead draws a RULE note when it is written",
    typeof handMade?.note === "string" && handMade.note.includes("[RULE]"), JSON.stringify(handMade));
  // KNOWN-BAD FOR A READER OF THE SHARED NAMES: the clean page as it was written before the shared
  // stylesheet. It links nothing, it carries a style block, and its classes have no prefix. Read by
  // the shared names it has no opening and no card in the open shape.
  const OWN = CLEAN.replace(`${STYLES.stylesheet}\n`, "<style>.eyebrow{font-size:.8rem} .standfirst{font-size:1.2rem} .open{border-left:2px solid orange}</style>\n")
    .replace(/class="sds-section-head"/g, 'class="sec-head"').replace(/class="sds-small"/g, 'class="s"').replace(/sds-badge sds-lens/g, "badge lens").replace(/sds-badge sds-status sds-([a-z]+)/g, "badge status $1").replace(/class="sds-/g, 'class="')
    + `<section id="s4"><div class="sec-head"><h2>Open &mdash; Q1</h2></div><div class="open"><h4 id="q1">Q1 &middot; a question</h4><p>You decide it yourself.</p></div></section>\n`;
  const ownHome = stream(TMP, "060-own-copy");
  const ownPage = join(ownHome, "approach.html");
  const found = check(ownPage, OWN);
  tell("the fixture links no shared stylesheet and holds no shared name", !OWN.includes("sds-") && OWN.includes("<style>"));
  tell("[MKT.SCRIPTS.108] a page with its own copy draws one RULE finding, which says how to move it",
    found.length === 1 && found[0][0] === "RULE" && found[0][1] === OWN_COPY, JSON.stringify(found));
  one("[MKT.SCRIPTS.108] and the hook says that one line when the page is written", write(ownPage, OWN), "reports", `[RULE] ${OWN_COPY}`);
  const reported = checkDoc(write(ownPage, OWN));
  tell("[MKT.SCRIPTS.108] the hook reports it as it reports any RULE: a note, and the write is not refused",
    typeof reported?.note === "string" && reported.note.includes(`[RULE] ${OWN_COPY}`) && reported.deny === undefined, JSON.stringify(reported));
  const stale = check(ownPage, OWN.replace(`<td>${BADGE("RUNNING")}</td>`, `<td>${BADGE("PROPOSED")}</td>`).replace(/<p class="standfirst">[^\n]*\n/, ""));
  tell("[MKT.SCRIPTS.108] no markup of it is read: a stale table, a missing opening and a card with no options draw nothing",
    stale.length === 1 && stale[0][1] === OWN_COPY, JSON.stringify(stale));
  tell("[MKT.SCRIPTS.108] untouched: the same page in the shared form is read, and its card with no options is reported",
    check(ownPage, CLEAN + `<section id="s4"><div class="sds-section-head"><h2>Open &mdash; Q1</h2></div><div class="sds-open"><h4 id="q1">Q1 &middot; a question</h4><p>You decide it yourself.</p></div></section>`)
      .some(([severity, message]) => severity === "RULE" && message.includes("carries no options table")));
  const proseOnly = check(ownPage, OWN.replace("You get one place for the model.", "You get it out of the box."));
  tell("[MKT.SCRIPTS.108] its prose is still read: an idiom is reported beside the one line",
    proseOnly.filter(([, message]) => message === OWN_COPY).length === 1 && proseOnly.some(([, message]) => /idiom/i.test(message)), JSON.stringify(proseOnly));
  tell("[MKT.SCRIPTS.108] a page with its own copy under closed/ is not read at all",
    check(join(stream(TMP, "061-own-copy-closed", "closed"), "approach.html"), OWN).length === 0);
  // An Edit carries only its replacement, so the page on disk says which form the page is in.
  writeFileSync(ownPage, OWN);
  one("[MKT.SCRIPTS.108] an Edit of a page that holds its own copy on disk draws the one line",
    { tool_name: "Edit", tool_input: { file_path: ownPage, old_string: "<h1>A subject</h1>", new_string: "<h1>Another subject</h1>" } },
    "reports", `[RULE] ${OWN_COPY}`);
  const sharedOnDisk = join(stream(TMP, "062-shared"), "approach.html");
  writeFileSync(sharedOnDisk, CLEAN);
  one("[MKT.SCRIPTS.108] untouched: the same Edit of a page in the shared form is silent",
    { tool_name: "Edit", tool_input: { file_path: sharedOnDisk, old_string: "<h1>A subject</h1>", new_string: "<h1>Another subject</h1>" } }, "silent");

  console.log("\n=== doc-check — a page links a version that was cut, and its rail is the shared script's");

  /** The whole verdict of the hook for one payload: whether it refuses, the reason, and the note. */
  const verdict = (payload) => {
    const out = execFileSync("node", [`${HOOKS}/src/scripts/checks/doc-check.ts`, "--stdin"], { input: JSON.stringify(payload), encoding: "utf8", cwd: CWD }).trim();
    if (!out) return { refused: false, reason: "", note: "" };
    const specific = JSON.parse(out.split("\n").filter(Boolean).at(-1)).hookSpecificOutput ?? {};
    return { refused: specific.permissionDecision === "deny", reason: specific.permissionDecisionReason ?? "", note: specific.additionalContext ?? "" };
  };
  const CONSTRUCT_PAGE = constructPage(MAST);
  // KNOWN-BAD: the two lines name version 9.9.9, and `versions.json` holds 1.0.0 alone.
  const UNCUT_PAGE = CONSTRUCT_PAGE.split("/1.0.0/").join("/9.9.9/");
  const refusal = verdict(write(CONSTRUCT, UNCUT_PAGE));
  tell("[MKT.HOOKS.45] known-bad: a write of a page that links a version nobody cut is refused",
    refusal.refused && UNCUT_PAGE.includes(`${STYLES_ADDRESS}9.9.9/sds-docs.css`), JSON.stringify(refusal));
  tell("[MKT.HOOKS.45] the refusal names the version the page links and the versions that exist",
    refusal.reason.includes("`9.9.9`") && refusal.reason.includes("`versions.json` holds `1.0.0`") && refusal.note.includes("[RULE]"), refusal.reason);
  tell("[MKT.HOOKS.45] untouched: the same page linking the version that was cut is not refused, and draws no finding",
    !verdict(write(CONSTRUCT, CONSTRUCT_PAGE)).refused && verdict(write(CONSTRUCT, CONSTRUCT_PAGE)).note === "");
  const editedLink = verdict({ tool_name: "Edit", tool_input: { file_path: sharedOnDisk, old_string: STYLES.stylesheet, new_string: linesFor("9.9.9").stylesheet } });
  tell("[MKT.HOOKS.45] an Edit that changes the link to a version nobody cut is refused too", editedLink.refused && editedLink.reason.includes("`9.9.9`"), JSON.stringify(editedLink));
  // The versions that exist are read from `versions.json`, so the finding lists what that file holds.
  const stylesFixture = join(TMP, "styles");
  mkdirSync(stylesFixture, { recursive: true });
  writeFileSync(join(stylesFixture, "versions.json"), JSON.stringify({ "1.0.0": {}, "1.1.0": {} }));
  const scriptAlone = `${STYLES.stylesheet}\n<p>You read it.</p>\n${linesFor("2.0.0").script}`;
  const listed = uncutVersions(scriptAlone, stylesFixture);
  tell("[MKT.HOOKS.45] a script line that names a version nobody cut is found, and each version that exists is listed",
    listed.length === 1 && listed[0][0] === "RULE" && listed[0][1].includes("`2.0.0`") && listed[0][1].includes("`1.0.0` · `1.1.0`"), JSON.stringify(listed));
  tell("[MKT.HOOKS.45] a page whose link names no version, as a sample's does, draws none",
    uncutVersions(`<link rel="stylesheet" href="../assets/sds-docs.css">`, stylesFixture).length === 0);
  tell("[MKT.HOOKS.45] where no `versions.json` is found nothing says which versions exist, so nothing is reported",
    uncutVersions(UNCUT_PAGE, null).length === 0 && uncutVersions(UNCUT_PAGE, join(TMP, "no-such-folder")).length === 0);

  // doc-check holds no check on a hosted address, so only the first half of the row has a case here.
  one("[MKT.HOOKS.47] the address of the version a page links draws no finding",
    write(CONSTRUCT, constructPage(MAST) + `${STYLES.script}\n`), "silent");

  console.log("\n=== doc-check — the two produced kinds of page, and a page's bundled copy");

  // A guide page as `docs guide` writes it: a header line with no status, a Title, a Description, its
  // stages and its steps. It sits in `guides/`, and its name ends `-guide.html`.
  const GUIDE = `<!doctype html>\n${STYLES.stylesheet}\n<nav class="sds-rail" id="rail"></nav>\n<header class="sds-masthead">\n` +
    `  <div class="sds-eyebrow"><span class="sds-line1">SaaS Plane &nbsp;|&nbsp; Probe &nbsp;|&nbsp; Getting Started</span><span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Guide</span></span></div>\n` +
    `  <h1>Getting Started</h1>\n  <p class="sds-standfirst">You go from a clone to a running service. Read it on your first day.</p>\n</header>\n` +
    `<section id="s1"><div class="sds-section-head"><h2>The machine is ready</h2></div>\n  <p>You install the tools once, and you check them once.</p>\n` +
    `  <div class="sds-step"><h3 id="h1">Install the toolchain</h3><p>You need it before any other step.</p><pre>spnutils setup</pre><p>You see one line for each tool.</p></div>\n</section>\n${STYLES.script}\n`;
  const guidePage = join(guidePagesDir(PROBE_DOCS), "getting-started-guide.html");
  one("a guide page under artifacts/guides/ is in its place, and draws no finding", write(guidePage, GUIDE), "silent");
  one("a page under artifacts/guides/ whose name does not end -guide.html",
    write(join(guidePagesDir(PROBE_DOCS), "getting-started.html"), GUIDE), "reports", "does not end -guide.html");
  // The index of artifacts as `docs index` writes it: no header, no Title, no Description, and its own script.
  const INDEX = `<!doctype html>\n<title>Probe Artifacts</title>\n${STYLES.stylesheet}\n<div class="sds-index" id="index">\n` +
    `  <aside class="sds-index-side" id="index-side"><nav class="sds-tree" id="index-tree" aria-label="Pages"></nav>\n` +
    `    <noscript><p class="sds-index-note">This index needs its script to list the pages.</p></noscript></aside>\n` +
    `  <main class="sds-index-main"><div class="sds-tabs" id="index-tabs"></div><div class="sds-panes" id="index-panes"></div></main>\n</div>\n` +
    `<script type="application/json" id="index-data">{"base": "", "groups": []}</script>\n${linesFor("1.0.0", "sds-index.js").script}\n`;
  one("the index of artifacts, directly in the pocket, is in its place: no check of a masthead, a Subtitle or a Description reads it",
    write(artifactIndex(PROBE_DOCS), INDEX), "silent");
  tell("neither page is held to a suffix or to a masthead, and both are still read",
    check(guidePage, GUIDE).length === 0 && check(artifactIndex(PROBE_DOCS), INDEX).length === 0
      && check(guidePage, GUIDE.split("/1.0.0/").join("/9.9.9/")).some(([, message]) => message.includes("`9.9.9`"))
      && check(artifactIndex(PROBE_DOCS), INDEX.split("/1.0.0/").join("/9.9.9/")).some(([, message]) => message.includes("`9.9.9`")));
  // A bundled copy carries its styles inside it and links nothing. KNOWN-BAD without the rule: read as a
  // page, it holds its own copy, and beside an overview its name does not end `-overview.html`.
  const BUNDLED = `<!doctype html>\n<style>.sds-masthead{margin:0}</style>\n<header class="sds-masthead"><h1>Probe</h1></header>\n<p>You read it with no network.</p>\n`;
  one("a page's bundled copy is not read: it is a copy made to publish",
    write(join(PROBE_DOMAIN, "probe-overview.bundled.html"), BUNDLED), "silent");
  tell("known-bad: the same text under a page's own name is read, and is told it holds its own copy",
    check(join(PROBE_DOMAIN, "probe-overview.html"), BUNDLED).some(([, message]) => message === OWN_COPY)
      && check(join(PROBE_DOMAIN, "probe-overview.bundled.html"), BUNDLED).length === 0);

  const RAIL = `<nav class="sds-rail" id="rail"></nav>\n`;
  one("known-bad: a page that carries a rail and loads no shared script is told its outline is not built",
    write(statusPage, withStatus(CLEAN, "IMPLEMENTING", "&#x1F6A7;") + RAIL), "reports", "carries a rail and loads no `sds-docs.js`");
  one("untouched: the same page with the shared script's line is silent",
    write(statusPage, withStatus(CLEAN, "IMPLEMENTING", "&#x1F6A7;") + RAIL + `${STYLES.script}\n`), "silent");
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

console.log("\n=== doc-check — every path a Bash command writes");
{
  n += 1;
  const command = "cat > docs/a.md <<'EOF'\nhello\nEOF\nsed -i '' 's/a/b/' docs/b.md\ncp docs/c.md docs/d.md\necho hi | tee -a docs/e.md";
  const payload = { tool_name: "Bash", tool_input: { command } };
  const ts = run("node", [`${HOOKS}/src/scripts/checks/doc-check.ts`, "--bash-writes"], payload);
  const py = hasPython("doc-check.py") ? run("python3", [`${SCRIPTS}/doc-check.py`, "--bash-writes"], payload) : null;
  const ok = (py === null || ts === py) && ["docs/a.md", "docs/b.md", "docs/d.md", "docs/e.md"].every((f) => ts.includes(f));
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  redirect with a heredoc body, sed -i, cp and tee all found\n        ts [${ts.split("\n").join(" · ")}]\n        py [${py === null ? "not installed" : py.split("\n").join(" · ")}]`);
}

console.log("\n=== RULE.DEVEX.WORKSPACE.259 — a column whose cells hold sentences is a level of the item cell, as a note");
{
  const { check: checkPage, columnRule, itemCellPage } = await import("../../../../src/scripts/checks/doc-check.ts");
  const { readFileSync } = await import("node:fs");
  const say = (label, pass, detail = "") => { n += 1; if (!pass) failed += 1; console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}${pass || !detail ? "" : `\n        ${String(detail).slice(0, 300)}`}`); };
  const notes = (findings) => findings.filter(([grade, text]) => grade === "SOFT" && text.includes("RULE.DEVEX.WORKSPACE.259"));
  // The shape workstream 030's N010 preview held before 26 Oct: three columns, every cell a sentence.
  const sentences = `<table><thead><tr><th>Finding</th><th>What it says</th><th>What it causes</th></tr></thead><tbody>
    <tr><td>Planning</td><td>A planning arc whose reading and drafting are rows, turned into build rows at the go.</td><td>An arc reads RUNNING while nothing is built, then flips back.</td></tr>
    <tr><td>Cutting</td><td>Arcs are cut by the release each pays, or one per site or repository.</td><td>Ten arcs stand for what the developer reviews as three.</td></tr>
    <tr><td>Placing</td><td>Six tables place new work, each with its own test to apply.</td><td>Small changes become new arcs, and fixes land in the wrong workstream.</td></tr>
  </tbody></table>`;
  const preview = join(WORKSPACE, ".spndevex", "workstreams", "open", "040-probe", "notes", "N002", "preview.html");
  say("an arc's preview, a construct, an overview, an approach page and the hub are read; a report is not",
    itemCellPage(preview) && itemCellPage("/d/x-construct.html") && itemCellPage("/d/x-overview.html") && itemCellPage("/w/open/040-probe/approach.html") && !itemCellPage("/d/x-report.html"));
  const red = notes(columnRule(sentences));
  say("red: a three-column table of sentences draws a note for each column after the first, naming it",
    red.length === 2 && red[0][1].includes('"What it says"') && red[1][1].includes('"What it causes"') && red[0][1].includes("the title in bold, the line under it, one `Key: value` line"), JSON.stringify(red));
  const shared = '<link rel="stylesheet" href="https://saasplane.github.io/spn-claude-marketplace/assets/docs/1.9.0/sds-docs.css">';
  say("red: through the doc hook's check, on an arc's preview", notes(checkPage(preview, `<meta charset="utf-8">\n${shared}\n${sentences}\n`)).length === 2,
    JSON.stringify(checkPage(preview, `<meta charset="utf-8">\n${shared}\n${sentences}\n`)));
  const now = readFileSync(join(PLUGIN, "tests", "fixtures", "doc-check", "item-cell-preview.html"), "utf8");
  say("green: that preview as it is now, its tables item cells, draws none", notes(checkPage(preview, now)).length === 0, JSON.stringify(notes(checkPage(preview, now))));
  const status = `<table><thead><tr><th>Arc</th><th class="sds-status-col">Status</th></tr></thead><tbody>
    <tr><td><p><strong>N001 &mdash; the patterns</strong></p><p>What the patterns hold, in one place for every app and site.</p></td><td><span class="sds-badge">LANDED and released with the plugins and the book</span></td></tr>
    <tr><td><p><strong>N002 &mdash; the sites</strong></p><p>The sites follow the patterns.</p></td><td><span class="sds-badge">RUNNING since the morning, with three steps to go</span></td></tr>
  </tbody></table>`;
  say("green: a status column is compared down by design, and draws none", notes(columnRule(status)).length === 0);
  const counts = `<table><thead><tr><th>Domain</th><th>Rows</th><th>Proved</th></tr></thead><tbody>
    <tr><td>Surface</td><td>42</td><td>40 of 42</td></tr><tr><td>Apps</td><td>17</td><td>17 of 17</td></tr></tbody></table>`;
  say("green: columns of counts draw none", notes(columnRule(counts)).length === 0);
  // MEASURED on the hub, 2026-10-26: a Values column lists code, however many values it holds, and is compared down.
  const values = `<table><thead><tr><th>Vocabulary</th><th>Values</th></tr></thead><tbody>
    <tr><td>Task state</td><td><code>IDLE</code> · <code>WORKING</code> · <code>DONE</code> · <code>FAILED</code> · <code>EMPTY</code> · <code>DENIED</code> · <code>SKIPPED</code></td></tr>
    <tr><td>Layer</td><td><code>CORE</code> · <code>COMPONENTS</code> · <code>WIDGETS</code> · <code>CONTAINERS</code> · <code>LAYOUTS</code> · <code>APP</code> · <code>PAGE</code></td></tr></tbody></table>`;
  say("green: a column of code values, however long the list, draws none", notes(columnRule(values)).length === 0, JSON.stringify(notes(columnRule(values))));
  // A construct's Terms: Term · Contract term · Description, and the hub's glossary stays one column.
  const termsOf = (head, rows) => `<section id="s1">\n  <div class="sds-section-head"><h2>Terms</h2></div>\n  <div class="sds-scroll"><table>\n    <thead><tr>${head}</tr></thead>\n    <tbody>\n${rows}\n    </tbody>\n  </table></div>\n</section>`;
  const meaning = "the one membership accountable for a node, from the moment the node exists, and the only one who may hand it on";
  const threeColumns = termsOf("<th>Term</th><th>Contract term</th><th>Description</th>",
    `<tr><td><strong>Owner</strong></td><td><code>PrincipalMeta</code></td><td>${meaning}</td></tr>\n<tr><td><strong>Anchor</strong></td><td></td><td>${meaning}</td></tr>`);
  say("a construct's Terms in three columns draw no note, the Description being the meaning and not a column of sentences",
    notes(columnRule(threeColumns)).length === 0 && !checkPage("/d/x-construct.html", `<meta charset="utf-8">\n${shared}\n${threeColumns}\n`).some(([, text]) => text.includes("Terms table")),
    JSON.stringify(columnRule(threeColumns)));
  const oneCell = termsOf("<th>Term</th>", `<tr><td><p><strong>Owner</strong></p><p>${meaning}</p><span class="sds-small">Contract term: <code>PrincipalMeta</code></span></td></tr>`);
  const refused = columnRule(oneCell).filter(([grade, text]) => grade === "SOFT" && text.includes("Terms table is one column"));
  say("red: the old one-cell Terms shape is named as a note", refused.length === 1 && refused[0][1].includes("`Term` · `Contract term` · `Description`"), JSON.stringify(columnRule(oneCell)));
  const hubGlossary = oneCell.replace("<h2>Terms</h2>", "<h2>Glossary</h2>");
  say("green: a hub's one-column glossary is untouched", columnRule(hubGlossary).length === 0, JSON.stringify(columnRule(hubGlossary)));
  say("green: a report's tables are its own, and the same sentences there draw none", notes(checkPage("/d/artifacts/reports/docs-report.html", `<meta charset="utf-8">\n${shared}\n${sentences}\n`)).length === 0);
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
