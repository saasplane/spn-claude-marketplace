import { PLUGIN } from "../../../helpers/harness.mjs";
// `doc-check` — the largest port. A fixture proves each check still fires; the corpus diff (in
// t-doc-check-corpus.mjs) proves the port did not quietly change what it says about six hundred
// files nobody is going to re-read.
import { execFileSync } from "node:child_process";

import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ARCS, capabilitiesDir, constructPagesDir, decisionsRegister, docsOf, hubPage, overviewsDir, registersDir,
  workstreamsDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

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
// compared with arcs on disk: N1 and N2, carrying the statuses the clean page's Cycles table reads.
const arcFile = (id, name, status, rows = "") =>
  `# ${id} — ${name}\n\nStatus: **${status} — 2026-09-29.** ${name}, in one sentence.\n\n## Steps\n\n` +
  `| # | Repo | Altitude | What | Mechanism | Acceptance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows}`;
const stream = (root, name, state = "open") => {
  const folder = join(workstreamsDir(root, state), name);
  mkdirSync(join(folder, ARCS), { recursive: true });
  writeFileSync(join(folder, ARCS, "N1-the-chapter.md"), arcFile("N1", "the chapter", "RUNNING"));
  writeFileSync(join(folder, ARCS, "N2-the-check.md"), arcFile("N2", "the check", "DECIDED"));
  return folder;
};
const APPROACH = join(stream(WORKSPACE, "041-probe"), "probe-approach.html");

// A page that passes everything, used as the base for each known-bad mutation.
const CLEAN = `<!doctype html>
<div class="eyebrow">Who this is for &middot; the developer picking up this work</div>
<h1>A subject</h1>
<p class="standfirst">This page plans a change to where the model is written down.</p>
<p>Read it to see what will change and why, before anything is built.</p>
<section id="s1"><div class="sec-head"><h2>Why &mdash; the reason</h2></div>
  <p>You open this page when the model has no single home. You read it once and you know where each piece sits.</p>
  <p>Split it where it runs long. Say what you mean, and keep the reason beside the rule.</p>
</section>
<section id="s2"><div class="sec-head"><h2>What &mdash; the shape</h2></div>
  <p>You get one place for the model. You get one shape per page, and you get one plain voice.</p>
</section>
<section id="s3"><div class="sec-head"><h2>How &mdash; the order</h2></div>
  <h3 id="h1">spn-foundation &mdash; the chapter</h3>
  <p>You read the chapter first, and the code follows it.</p>
  <h3 id="h9">Cycles &mdash; the arcs, in the order they run</h3>
  <div class="scroll"><table><thead><tr><th>Arc</th><th>What it does</th><th>Status</th><th>Previews</th></tr></thead>
  <tbody><tr><td><strong>N1 &mdash; the chapter</strong><br><a class="s" href="arcs/N1-the-chapter.md">arcs/N1-the-chapter.md</a></td><td>the chapter, in one sentence.</td><td>RUNNING</td><td>&mdash;</td></tr>
  <tr><td><strong>N2 &mdash; the check</strong><br><a class="s" href="arcs/N2-the-check.md">arcs/N2-the-check.md</a></td><td>the check, in one sentence.</td><td>DECIDED</td><td>&mdash;</td></tr></tbody></table></div>
</section>
`;

// The same page with the Cycles table a closed workstream keeps: three columns, no file link.
const NO_PREVIEWS = CLEAN
  .replace("<th>Previews</th>", "")
  .replace(/<br><a class="s"[^>]*>[^<]*<\/a>/g, "")
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
  write(APPROACH, `<div class="eyebrow">Who this is for &middot; a reader</div><section><h2>Background</h2><p>You read it once and you know it.</p></section>`),
  "reports", "carries no why + what + how");

one("an overview carrying an argument's organs",
  write(join(overviewsDir(PROBE_DOCS), "probe-overview.html"),
    `<div class="eyebrow">Who this is for &middot; a reader</div><section><h2>Open</h2><p>You read it once and you know it.</p></section>`),
  "reports", "overview carries open");

one("an approach page sitting in the overviews pocket",
  write(join(overviewsDir(PROBE_DOCS), "probe-approach.html"), CLEAN),
  "reports", "does not end -overview.html");

one("an Open card carrying no options table",
  write(APPROACH, CLEAN + `<section id="s4"><h2>Open</h2><div class="open"><h4 id="q1">Q1 &middot; a question</h4><p>You decide it yourself.</p></div></section>`),
  "reports", "carries no options table");

one("a Deferred card naming no trigger",
  write(APPROACH, CLEAN + `<section id="s5"><h2>Deferred</h2><div class="open"><h4 id="q2">Q2 &middot; a parked thing</h4><p>You leave this one alone.</p></div></section>`),
  "reports", "names no trigger");

one("a register row that says you",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| RD.EVENTS.099 | you may not do it |\n"),
  "reports", "says *you*");

// N27 step 12 — a row that QUOTES somebody saying `you` is evidence, not the row warming its reader.
// RD.DEVEX.WORKSPACE.112 says the marking is how a check tells the two apart, and the exemption used to cover
// only the bare word in italics, so a quoted PHRASE still fired. Four real rows carried one.
one("a register row quoting a person saying you — the marking is the exemption",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| RD.EVENTS.099 | " +
    "Asked by the developer: *\"you can call revoke signed-in if other tests are working\"* |\n"),
  "silent");

one("a register row citing another document's phrase in italics",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| RD.EVENTS.099 | " +
    "A number written **four ways**, and the section's own *seven yours and two the agent's* again |\n"),
  "silent");

one("a register row quoting a string in double quotes",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| RD.EVENTS.099 | " +
    "The hub shows a neutral \"taking you to your provider\" state until the redirect leaves |\n"),
  "silent");

// The other half, and the one that matters: the exemption must not swallow a real breach. Bold is in
// the row on purpose — `**shape**` leaves an unpaired asterisk, and an exemption that strips every
// marked span pairs it with the opening `*` of a later `*you*` and exposes the word it was meant to
// protect. Anchoring the exemption on the word is what makes this case pass.
one("a register row that says you beside bold — still reports",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| RD.EVENTS.099 | " +
    "A row keeps its **shape**, and you should install the plugin before you open a window |\n"),
  "reports", "says *you*");

// N27 step 13 — `one` is a pronoun as often as it is an impersonal subject, and only the obligation
// form is the construction RD.DEVEX.WORKSPACE.096 is named after.
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
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| RD.EVENTS.099 | " +
    "A row states one clause a sentence and never more than that, and this particular row keeps " +
    "going well past the bar the chapter sets for it in every direction. |\n"),
  "reports", "a row states one clause a sentence");

one("a register row that rules over another row",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| RD.EVENTS.099 | Supersedes RD.EVENTS.008 |\n"),
  "reports", "rules over RD.EVENTS.008");

// A decision id names its domain now (`RD.<DOMAIN>.<SUBDOMAIN>.<NNN>`), and the id inside a
// supersession clause must be read with the same grammar as a register row's own id — this is the
// known-bad case: the two-segment pattern this check carried before stopped matching the moment a
// cited id gained a domain segment, and a stale ruling would have gone unreported.
one("a register row that rules over a four-part id",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n" +
    "| RD.SUPPORT.APPS.099 | Supersedes RD.SUPPORT.APPS.008 |\n"),
  "reports", "rules over RD.SUPPORT.APPS.008");

// The repository-letter form (`PD1`, `SD23`) is retired — no id in the corpus is written that way
// any more, and accepting it here would let a real, current supersession clause hide behind a shape
// that reads as an id but is not one.
one("the retired repository-letter form is not read as a register id",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| RD.EVENTS.099 | Supersedes PD1 |\n"),
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

console.log("\n=== doc-check — the masthead: h1, an optional p.subtitle, one p.standfirst (RD.DEVEX.WORKSPACE.187)");

// The same function `docs audit` runs, so a page is judged alike when it is saved and when it is audited.
const CONSTRUCT = join(constructPagesDir(PROBE_DOCS), "probe-construct.html");
const page = (inner) => `<!doctype html>
<header class="masthead">
  <div class="eyebrow"><span class="audience">Architect</span></div>
${inner}
</header>
<section id="s0"><div class="sec-head"><h2>Overview</h2></div>
  <p>You read this part when you need the core. You leave it knowing where each piece sits.</p>
</section>
`;
const MAST = `  <h1>Probe</h1>\n  <p class="subtitle">You keep one place for the model.</p>\n  <p class="standfirst">This page covers the probe. Read it before you change it.</p>`;

one("a construct masthead with h1, Subtitle and Description", write(CONSTRUCT, page(MAST)), "silent");
one("a construct with no Subtitle — the Subtitle is optional",
  write(CONSTRUCT, page(MAST.replace(/  <p class="subtitle">.*\n/, ""))), "silent");
one("a second paragraph after the Description is SOFT until every tree is retrofitted (N116 row 9)",
  write(CONSTRUCT, page(MAST + "\n  <p>You also read this, and it should be in the first section.</p>")),
  "reports", "[SOFT] the header carries 1 paragraph past the Subtitle and the Description");
one("two standfirsts are a second paragraph",
  write(CONSTRUCT, page(MAST + `\n  <p class="standfirst">You read a second Description here.</p>`)),
  "reports", "[SOFT] the header carries 1 paragraph");
one("a Subtitle of two sentences is SOFT",
  write(CONSTRUCT, page(MAST.replace("the model.</p>", "the model. You keep it there.</p>"))),
  "reports", "[SOFT] the Subtitle runs to 2 sentences");
one("a construct header with no Description is SOFT",
  write(CONSTRUCT, page(MAST.replace(/\n  <p class="standfirst">.*/, ""))),
  "reports", "[SOFT] the header has no Description");
one("a Subtitle under the Description is out of place",
  write(CONSTRUCT, page(`  <h1>Probe</h1>\n  <p class="standfirst">This page covers the probe. Read it before you change it.</p>\n  <p class="subtitle">You keep one place for the model.</p>`)),
  "reports", "[SOFT] the Subtitle is out of place");
// THE HUB CASES ARE HERMETIC. The pair is read from the register beside the page, so each case
// builds its own workspace holding a stub RD.DEVEX.WORKSPACE.143 row, and the suite never depends
// on what the real foundation's register says today.
{
  const HUB_WS = realpathSync(mkdtempSync(join(tmpdir(), "doc-check-hub-")));
  try {
    const hubIn = (repoName, register) => {
      const docs = docsOf(join(HUB_WS, repoName));
      mkdirSync(overviewsDir(docs), { recursive: true });
      if (register !== null) {
        mkdirSync(registersDir(docs), { recursive: true });
        writeFileSync(decisionsRegister(docs),
          "# Decisions\n\n| ID | Area | Decision | Why | When |\n| --- | --- | --- | --- | --- |\n" + register);
      }
      return hubPage(docs);
    };
    const STUB = "| RD.DEVEX.WORKSPACE.143 | [docs](x.md) | **The punchline is `A stub title for the probe.`, and the " +
      "statement beside it does not change.** The statement below it reads *the stub subtitle, read from the row*. | why | 2026-09 |\n";
    const foundationHub = hubIn("spn-foundation", STUB);
    const mast = (h1, sub) => page(`  <h1>${h1}</h1>\n  <p class="subtitle">${sub}</p>\n  <p class="standfirst">This page is where you start. Read it first.</p>`);

    one("the foundation hub with the stub row's pair, word for word",
      write(foundationHub, mast("A stub title for the probe.", "The stub subtitle, read from the row.")), "silent");
    one("the foundation hub with a Title of its own",
      write(foundationHub, mast("Ship it faster.", "The stub subtitle, read from the row.")),
      "reports", "[SOFT] the foundation hub's Title is not RD.DEVEX.WORKSPACE.143's, word for word — \"A stub title for the probe.\"");
    one("the foundation hub with a Subtitle of its own",
      write(foundationHub, mast("A stub title for the probe.", "You build on one base.")),
      "reports", "[SOFT] the foundation hub's Subtitle is not RD.DEVEX.WORKSPACE.143's");
    one("a .143 row the check cannot read is said, never passed",
      write(hubIn("spn-unreadable", "| RD.DEVEX.WORKSPACE.143 | a | no pair here | b | c |\n"), mast("x y z", "You build on one base.")),
      "reports", "could not be read from the row");
    one("another repository's hub, whose register has no .143 row, is not held to the pair",
      write(hubIn("spn-support-ts", "| RD.SUPPORT.APPS.001 | a | b | c | d |\n"), mast("Ship it faster.", "You build on one base.")),
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
  write(APPROACH, CLEAN.replace("<th>What it does</th>", "<th>Scope</th>")),
  "reports", "Arc · What it does · Status");

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
  write(APPROACH, CLEAN.replace(/<p class="standfirst">[^\n]*\n/, "")),
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
    write(page, CLEAN.replace("<td>DECIDED</td>", "<td>RUNNING</td>")),
    "reports", "N2 reads RUNNING and the arc reads DECIDED");

  one("an arc with no row in Cycles",
    write(page, CLEAN.replace(/\n  <tr><td><strong>N2[^\n]*/, "</tbody></table></div>")),
    "reports", "has no row for N2");

  one("a Cycles row naming no arc",
    write(page, CLEAN.replace("</tbody>", `<tr><td><strong>N3 &mdash; typed by hand</strong></td><td>x</td><td>DECIDED</td></tr></tbody>`)),
    "reports", "lists N3");

  one("a status cell carrying its blocker still reads as its word",
    write(join(stream(TMP, "043-held"), "held-approach.html"), CLEAN.replace("<td>RUNNING</td>", "<td>RUNNING &middot; since today</td>")),
    "silent");

  one("the same rows in another order — a person chooses the order the arcs run in",
    write(page, CLEAN.replace(/(<tbody>)(<tr>[^\n]*)\n  (<tr>[\s\S]*?<\/tr>)(<\/tbody>)/, "$1$3\n  $2$4")),
    "silent");

  one("a row whose Arc cell links no file",
    write(page, CLEAN.replace(`<br><a class="s" href="arcs/N2-the-check.md">arcs/N2-the-check.md</a>`, "")),
    "reports", "N2 does not link its arc file as arcs/N2-the-check.md");

  one("a row whose Arc cell links another arc's file",
    write(page, CLEAN.replace(`href="arcs/N2-the-check.md"`, `href="arcs/N1-the-chapter.md"`)),
    "reports", "N2 does not link its arc file as arcs/N2-the-check.md");

  one("a row named differently from its arc's heading",
    write(page, CLEAN.replace("N2 &mdash; the check</strong>", "N2 &mdash; the gate</strong>")),
    "reports", `N2 is named "N2 — the gate" and the arc is "N2 — the check"`);

  one("a What it does cell typed by hand",
    write(page, CLEAN.replace("the check, in one sentence.", "a check reads the new shape")),
    "reports", "N2's What it does is not the arc's own line");

  one("a Previews cell listing a file the arc does not",
    write(page, CLEAN.replace("<td>DECIDED</td><td>&mdash;</td>",
      `<td>DECIDED</td><td><a href="notes/N2/previews/layout-preview.html">layout-preview.html</a> &middot; preview &middot; under review</td>`)),
    "reports", "N2's Previews cell is not what the arc's Previews table lists");

  // THE TABLE WITH NO PREVIEWS COLUMN, in each of the three states. A workstream being worked or
  // parked is told to print the table again; a closed one stays as it was written.
  one("three columns in an open workstream — told to run the command",
    write(page, NO_PREVIEWS), "reports", "run `spn-devex docs cycles <workstream>`");
  one("three columns in a backlog workstream — told to run the command",
    write(join(stream(TMP, "045-parked", "backlog"), "approach.html"), NO_PREVIEWS),
    "reports", "no Previews column");
  const closedPage = join(stream(TMP, "046-done", "closed"), "done-approach.html");
  one("three columns in a closed workstream — never judged for the column",
    write(closedPage, NO_PREVIEWS), "silent");
  one("three columns in a closed workstream — a status the arc does not carry is still reported",
    write(closedPage, NO_PREVIEWS.replace("<td>DECIDED</td>", "<td>RUNNING</td>")),
    "reports", "N2 reads RUNNING and the arc reads DECIDED");
  one("four columns in a closed workstream, matching its arcs",
    write(closedPage, CLEAN), "silent");

  // AN ARC NUMBERED IN THREE DIGITS, WITH A PREVIEWS TABLE: a preview, a sample with a dated state,
  // and a link written from `arcs/`, which the page states from the workstream folder.
  const previewed = join(workstreamsDir(TMP, "open"), "047-previewed");
  mkdirSync(join(previewed, ARCS), { recursive: true });
  writeFileSync(join(previewed, ARCS, "N001-the-chapter.md"), arcFile("N001", "the chapter", "RUNNING").replace("## Steps",
    "## Previews\n\n| File | Kind | Shows | State |\n| --- | --- | --- | --- |\n" +
    "| [`layout-preview.html`](../notes/N001/previews/layout-preview.html) | preview | how the page is laid out | under review |\n" +
    "| [`close-message.md`](../notes/N001/samples/close-message.md) | sample | what the agent says at a close | approved 2026-10-01 |\n\n## Steps"));
  writeFileSync(join(previewed, ARCS, "N002-the-check.md"), arcFile("N002", "the check", "DECIDED").replace("## Steps", "## Previews\n\nNone.\n\n## Steps"));
  const PREVIEWS_CELL = `<a href="notes/N001/previews/layout-preview.html">layout-preview.html</a> &middot; preview &middot; under review<br>` +
    `<a href="notes/N001/samples/close-message.md">close-message.md</a> &middot; sample &middot; approved`;
  const PREVIEWED = CLEAN.replace(/N1-the-chapter/g, "N001-the-chapter").replace(/N2-the-check/g, "N002-the-check")
    .replace("N1 &mdash;", "N001 &mdash;").replace("N2 &mdash;", "N002 &mdash;")
    .replace("<td>RUNNING</td><td>&mdash;</td>", `<td>RUNNING</td><td>${PREVIEWS_CELL}</td>`);
  const previewedPage = join(previewed, "approach.html");
  one("three-digit arcs, and a Previews cell matching the arc's Previews table",
    write(previewedPage, PREVIEWED), "silent");
  one("a Previews cell left as a dash while the arc lists two files",
    write(previewedPage, PREVIEWED.replace(PREVIEWS_CELL, "&mdash;")),
    "reports", "N001's Previews cell is not what the arc's Previews table lists");
  one("a Previews cell whose state is not the arc's",
    write(previewedPage, PREVIEWED.replace("preview &middot; under review", "preview &middot; approved")),
    "reports", "N001's Previews cell is not what the arc's Previews table lists");
  one("a Previews cell whose link is written from arcs/ rather than from the page",
    write(previewedPage, PREVIEWED.replace(`href="notes/N001/previews/`, `href="../notes/N001/previews/`)),
    "reports", "N001's Previews cell is not what the arc's Previews table lists");

  // 008 is exempt by name: its page keeps the shape it was written in.
  const exempt = stream(TMP, "008-plain-probe");
  one("workstream 008's page — exempt by name from Terms and Cycles",
    write(join(exempt, "plain-probe-approach.html"),
      CLEAN.replace(HOW_TAIL, "").replace(`<section id="s1">`, `<section id="s0"><h2>Terms</h2><p>You read the words here.</p></section>\n<section id="s1">`)),
    "silent");

  console.log("\n=== doc-check — an arc's step rows (SOFT)");

  const arcs = join(home, ARCS);
  const ordered = "| 1 | spn-foundation | DOCS | a | by hand | b | |\n| 2 | spn-support-ts | DOCS | a | by hand | b | |\n" +
    "| 3 | spn-support-ts | CODE | a | by hand | b | |\n| 4 | — | PROOF | a | command | b | |\n";
  one("rows in chain order, a `—` proof row last",
    write(join(arcs, "N3-ordered.md"), arcFile("N3", "ordered", "DECIDED", ordered)), "silent");

  one("DOCS after CODE inside one repository",
    write(join(arcs, "N4-late-docs.md"), arcFile("N4", "late docs", "DECIDED",
      "| 1 | spn-support-ts | CODE | a | by hand | b | |\n| 2 | spn-support-ts | DOCS | a | by hand | b | |\n")),
    "reports", "row 2 is DOCS after CODE in spn-support-ts");

  one("the foundation after another repository",
    write(join(arcs, "N5-late-book.md"), arcFile("N5", "late book", "DECIDED",
      "| 1 | spn-support-ts | DOCS | a | by hand | b | |\n| 2 | spn-foundation | DOCS | a | by hand | b | |\n")),
    "reports", "the foundation comes first");

  one("a repository that comes back after another",
    write(join(arcs, "N6-back.md"), arcFile("N6", "back", "DECIDED",
      "| 1 | spn-foundation | DOCS | a | by hand | b | |\n| 2 | spn-support-ts | DOCS | a | by hand | b | |\n| 3 | spn-foundation | CODE | a | by hand | b | |\n")),
    "reports", "returns to spn-foundation");

  one("a row with no altitude from the set",
    write(join(arcs, "N7-bare.md"), arcFile("N7", "bare", "DECIDED", "| 1 | spn-foundation | DOCS → CODE | a | by hand | b | |\n")),
    "reports", "carry no Repo, or no Altitude");

  one("a step table with no Repo column",
    write(join(arcs, "N8-old.md"), "# N8 — old\n\nStatus: **DECIDED.**\n\n## Steps\n\n| # | What | State |\n| --- | --- | --- |\n| 1 | a | |\n"),
    "reports", "carries no Repo column");

  one("an older 008 arc with no Repo column — exempt by name",
    write(join(exempt, ARCS, "N50-older.md"), "# N50 — older\n\nStatus: **LANDED.**\n\n## Steps\n\n| # | What | State |\n| --- | --- | --- |\n| 1 | a | ✅ |\n"),
    "silent");

  one("a new 008 arc past the exemption still reports",
    write(join(exempt, ARCS, "N121-newer.md"), "# N121 — newer\n\nStatus: **DECIDED.**\n\n## Steps\n\n| # | What | State |\n| --- | --- | --- |\n| 1 | a | |\n"),
    "reports", "carries no Repo column");

  // An Edit carries only its replacement, and the table is judged whole: the edit is applied to the
  // arc on disk first.
  const onDisk = join(arcs, "N9-edited.md");
  writeFileSync(onDisk, arcFile("N9", "edited", "DECIDED", ordered));
  one("an Edit that moves a row out of order — judged on the arc it leaves",
    { tool_name: "Edit", tool_input: { file_path: onDisk,
      old_string: "| 3 | spn-support-ts | CODE |", new_string: "| 3 | spn-foundation | CODE |" } },
    "reports", "returns to spn-foundation");
  one("an Edit that keeps the order", { tool_name: "Edit", tool_input: { file_path: onDisk,
    old_string: "| 4 | — | PROOF |", new_string: "| 4 | — | PROOF | " } }, "silent");

  // THE SWEEP READS ARCS TOO, and counts each one it scanned — a bad path reads `0 scanned`.
  n += 1;
  const sweptHome = stream(TMP, "044-sweep");
  writeFileSync(join(sweptHome, "sweep-approach.html"), CLEAN.replace("</tbody>",
    `<tr><td><strong>N4 &mdash; late docs</strong><br><a class="s" href="arcs/N4-late-docs.md">arcs/N4-late-docs.md</a></td>` +
    `<td>late docs, in one sentence.</td><td>DECIDED</td><td>&mdash;</td></tr></tbody>`));
  writeFileSync(join(sweptHome, ARCS, "N4-late-docs.md"), arcFile("N4", "late docs", "DECIDED",
    "| 1 | spn-support-ts | CODE | a | by hand | b | |\n| 2 | spn-support-ts | DOCS | a | by hand | b | |\n"));
  let out = "", code = 0;
  try { out = execFileSync("node", [`${HOOKS}/src/scripts/checks/doc-check.ts`, sweptHome], { encoding: "utf8", cwd: CWD }); }
  catch (e) { out = String(e.stdout ?? ""); code = e.status; }
  const scanned = /(\d+) documents scanned/.exec(out)?.[1];
  const swept = scanned === "4" && out.includes("N4-late-docs.md") && out.includes("[SOFT]") && code === 0;
  if (!swept) failed += 1;
  console.log(`  ${swept ? "PASS" : "FAIL"}  the sweep scans the page and every arc, and a SOFT keeps exit 0\n        scanned ${scanned} · exit ${code}${swept ? "" : `\n${out.slice(0, 600)}`}`);
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

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
