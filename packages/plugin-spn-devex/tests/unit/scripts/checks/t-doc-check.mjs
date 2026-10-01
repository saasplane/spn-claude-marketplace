import { PLUGIN } from "../../../helpers/harness.mjs";
// `doc-check` — the largest port. A fixture proves each check still fires; the corpus diff (in
// t-doc-check-corpus.mjs) proves the port did not quietly change what it says about six hundred
// files nobody is going to re-read.
import { execFileSync } from "node:child_process";

import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ARCS, artifactIndex, capabilitiesDir, constructPagesDir, decisionsRegister, docsOf, guidePagesDir, hubPage, overviewsDir, registersDir,
  workstreamsDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { OWN_COPY, STYLES_ADDRESS, linesFor } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";

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

// The two lines a stored page carries: the shared stylesheet's, and the shared script's.
const STYLES = linesFor("1.0.0");

// A page that passes everything, used as the base for each known-bad mutation. It is in the shared
// form: it links one version of the shared stylesheet, and every class of it opens with `sds-`.
const CLEAN = `<!doctype html>
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

// The same page with the Cycles table a closed workstream keeps: three columns, no file link.
const NO_PREVIEWS = CLEAN
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
  write(join(overviewsDir(PROBE_DOCS), "probe-overview.html"),
    `${STYLES.stylesheet}<div class="sds-eyebrow">Who this is for &middot; a reader</div><section><h2>Open</h2><p>You read it once and you know it.</p></section>`),
  "reports", "overview carries open");

one("an approach page sitting in the overviews pocket",
  write(join(overviewsDir(PROBE_DOCS), "probe-approach.html"), CLEAN),
  "reports", "does not end -overview.html");

one("an Open card carrying no options table",
  write(APPROACH, CLEAN + `<section id="s4"><h2>Open</h2><div class="sds-open"><h4 id="q1">Q1 &middot; a question</h4><p>You decide it yourself.</p></div></section>`),
  "reports", "carries no options table");

one("a Deferred card naming no trigger",
  write(APPROACH, CLEAN + `<section id="s5"><h2>Deferred</h2><div class="sds-open"><h4 id="q2">Q2 &middot; a parked thing</h4><p>You leave this one alone.</p></div></section>`),
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

console.log("\n=== doc-check — the masthead: h1, an optional p.sds-subtitle, one p.sds-standfirst (RD.DEVEX.WORKSPACE.187)");

// The same function `docs audit` runs, so a page is judged alike when it is saved and when it is audited.
const CONSTRUCT = join(constructPagesDir(PROBE_DOCS), "probe-construct.html");
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
    const mast = (h1, sub) => page(`  <h1>${h1}</h1>\n  <p class="sds-subtitle">${sub}</p>\n  <p class="sds-standfirst">This page is where you start. Read it first.</p>`);

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
    write(page, CLEAN.replace(`<br><a class="sds-small" href="arcs/N2-the-check.md">arcs/N2-the-check.md</a>`, "")),
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
      `<td>DECIDED</td><td><a href="notes/N2/previews/layout-preview.html">layout-preview.html</a> &middot; preview &middot; proposed</td>`)),
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
    "| [`layout-preview.html`](../notes/N001/previews/layout-preview.html) | preview | how the page is laid out | proposed |\n" +
    "| [`close-message.md`](../notes/N001/samples/close-message.md) | sample | what the agent says at a close | decided 2026-10-01 |\n\n## Steps"));
  writeFileSync(join(previewed, ARCS, "N002-the-check.md"), arcFile("N002", "the check", "DECIDED").replace("## Steps", "## Previews\n\nNone.\n\n## Steps"));
  const PREVIEWS_CELL = `<a href="notes/N001/previews/layout-preview.html">layout-preview.html</a> &middot; preview &middot; proposed<br>` +
    `<a href="notes/N001/samples/close-message.md">close-message.md</a> &middot; sample &middot; decided`;
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
    write(previewedPage, PREVIEWED.replace("preview &middot; proposed", "preview &middot; decided")),
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

  console.log("\n=== doc-check — a step row's cell count, read when the arc is written");

  // KNOWN-BAD: a doubled pipe before State, so the row has 8 cells under a 7-cell header.
  one("[MKT.HOOKS.38] a step row with a doubled pipe is named with its count and the header's",
    write(join(arcs, "N10-doubled.md"), arcFile("N10", "doubled", "DECIDED",
      "| 1 | spn-support-ts | DOCS | a | by hand | b | |\n| 2 | spn-support-ts | CODE | a | by hand | b || ✅ landed 2026-10-01 |\n")),
    "reports", "row 2 has 8 cells under a 7-cell header");
  one("[MKT.HOOKS.38] a step row that is short of its header is named too",
    write(join(arcs, "N11-short.md"), arcFile("N11", "short", "DECIDED", "| 1 | spn-support-ts | DOCS | a | by hand | b |\n")),
    "reports", "row 1 has 6 cells under a 7-cell header");
  // UNTOUCHED: an Acceptance cell that holds a pipe written with a backslash, inside a code span.
  one("[MKT.HOOKS.38] a cell holding an escaped pipe is read as one cell",
    write(join(arcs, "N12-escaped.md"), arcFile("N12", "escaped", "DECIDED",
      "| 1 | spn-support-ts | DOCS | a | by hand | `grep -c \"a\\|b\" file` → 0 | ✅ landed 2026-10-01 |\n")),
    "silent");
  const countedOnDisk = join(arcs, "N13-counted.md");
  writeFileSync(countedOnDisk, arcFile("N13", "counted", "DECIDED", ordered));
  one("[MKT.HOOKS.38] an Edit that adds a pipe to a row is judged on the arc it leaves",
    { tool_name: "Edit", tool_input: { file_path: countedOnDisk, old_string: "| 3 | spn-support-ts | CODE | a |", new_string: "| 3 | spn-support-ts | CODE | a | or b |" } },
    "reports", "row 3 has 8 cells under a 7-cell header");
  one("[MKT.HOOKS.38] an older 008 arc with a miscounted row is exempt by name",
    write(join(exempt, ARCS, "N51-older.md"), arcFile("N51", "older", "LANDED", "| 1 | spn-support-ts | DOCS | a | by hand | b || ✅ |\n")),
    "silent");

  console.log("\n=== doc-check — a row of an arc's Previews table names its file as a link");

  const previewsArc = (id, section) => arcFile(id, "previewed", "DECIDED", "| 1 | spn-support-ts | DOCS | a | by hand | b | |\n")
    .replace("## Steps", `${section}\n\n## Steps`);
  const PREVIEWS_HEAD = "## Previews\n\n| File | Kind | Shows | State |\n| --- | --- | --- | --- |\n";
  // KNOWN-BAD: the File cell names its file in backticks and links nothing.
  one("[MKT.SCRIPTS.80] a Previews row whose File cell is not a link is named",
    write(join(arcs, "N999-unlinked.md"), previewsArc("N999", PREVIEWS_HEAD + "| `notes/N999/previews/a-preview.html` | preview | the layout | proposed |")),
    "reports", "Previews row `notes/N999/previews/a-preview.html` names its file without a link");
  one("[MKT.SCRIPTS.80] and the note shows the link form",
    write(join(arcs, "N999-unlinked.md"), previewsArc("N999", PREVIEWS_HEAD + "| `a-preview.html` | preview | the layout | proposed |")),
    "reports", "[`a-preview.html`](../notes/N999/previews/a-preview.html)");
  // UNTOUCHED.
  one("[MKT.SCRIPTS.80] a row written as a markdown link is left alone",
    write(join(arcs, "N999-linked.md"), previewsArc("N999", PREVIEWS_HEAD + "| [`a-preview.html`](../notes/N999/previews/a-preview.html) | preview | the layout | decided 2026-10-01 |")),
    "silent");
  one("[MKT.SCRIPTS.80] a section that reads None. is left alone",
    write(join(arcs, "N999-none.md"), previewsArc("N999", "## Previews\n\nNone.")), "silent");
  one("[MKT.SCRIPTS.80] an 008 arc is exempt by name",
    write(join(exempt, ARCS, "N52-older.md"), previewsArc("N52", PREVIEWS_HEAD + "| `a-preview.html` | preview | the layout | proposed |")),
    "silent");

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
    write(statusPage, withStatus(CLEAN, "PLANNING")), "reports", "spn-devex docs cycles <workstream> --write");
  one("[MKT.HOOKS.40] a page reading IMPLEMENTING while an arc runs is left alone",
    write(statusPage, withStatus(CLEAN, "IMPLEMENTING", "&#x1F6A7;")), "silent");
  one("[MKT.HOOKS.40] a page whose header labels no status is left alone", write(statusPage, CLEAN), "silent");

  // A workstream whose arcs are all at PROPOSED or DECIDED: the arcs give PLANNING.
  const planning = join(workstreamsDir(TMP, "open"), "048-planning");
  mkdirSync(join(planning, ARCS), { recursive: true });
  writeFileSync(join(planning, ARCS, "N1-the-chapter.md"), arcFile("N1", "the chapter", "PROPOSED"));
  writeFileSync(join(planning, ARCS, "N2-the-check.md"), arcFile("N2", "the check", "DECIDED"));
  const PLANNED = CLEAN.replace("<td>RUNNING</td>", "<td>PROPOSED</td>");
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
  const landing = join(workstreamsDir(TMP, "open"), "049-landing");
  mkdirSync(join(landing, ARCS), { recursive: true });
  writeFileSync(join(landing, ARCS, "N1-the-chapter.md"), arcFile("N1", "the chapter", "LANDED"));
  writeFileSync(join(landing, ARCS, "N2-the-check.md"), arcFile("N2", "the check", "DROPPED"));
  const LANDED_PAGE = CLEAN.replace("<td>RUNNING</td>", "<td>LANDED</td>").replace("<td>DECIDED</td>", "<td>DROPPED</td>");
  one("[MKT.HOOKS.40] a page in open/ stamped DONE once every arc is terminal is left alone",
    write(join(landing, "approach.html"), withStatus(LANDED_PAGE, "DONE", "&#x2705;")), "silent");
  one("[MKT.HOOKS.40] known-bad: a page in open/ stamped DONE while an arc still runs",
    write(statusPage, withStatus(CLEAN, "DONE", "&#x2705;")), "reports", "the header's status reads DONE and the arcs give IMPLEMENTING");

  // THE SWEEP READS ARCS TOO, and counts each one it scanned — a bad path reads `0 scanned`.
  n += 1;
  const sweptHome = stream(TMP, "044-sweep");
  writeFileSync(join(sweptHome, "sweep-approach.html"), CLEAN.replace("</tbody>",
    `<tr><td><strong>N4 &mdash; late docs</strong><br><a class="sds-small" href="arcs/N4-late-docs.md">arcs/N4-late-docs.md</a></td>` +
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

  console.log("\n=== doc-check — a page that holds its own copy of the styles");

  const { check, checkDoc, uncutVersions } = await import("../../../../src/scripts/checks/doc-check.ts");
  const tell = (label, ok, detail = "") => {
    n += 1;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`);
  };
  // KNOWN-BAD FOR A READER OF THE SHARED NAMES: the clean page as it was written before the shared
  // stylesheet. It links nothing, it carries a style block, and its classes have no prefix. Read by
  // the shared names it has no opening and no card in the open shape.
  const OWN = CLEAN.replace(`${STYLES.stylesheet}\n`, "<style>.eyebrow{font-size:.8rem} .standfirst{font-size:1.2rem} .open{border-left:2px solid orange}</style>\n")
    .replace(/class="sds-section-head"/g, 'class="sec-head"').replace(/class="sds-small"/g, 'class="s"').replace(/class="sds-/g, 'class="')
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
  const stale = check(ownPage, OWN.replace("<td>RUNNING</td>", "<td>PROPOSED</td>").replace(/<p class="standfirst">[^\n]*\n/, ""));
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
    write(join(overviewsDir(PROBE_DOCS), "probe-overview.bundled.html"), BUNDLED), "silent");
  tell("known-bad: the same text under a page's own name is read, and is told it holds its own copy",
    check(join(overviewsDir(PROBE_DOCS), "probe-overview.html"), BUNDLED).some(([, message]) => message === OWN_COPY)
      && check(join(overviewsDir(PROBE_DOCS), "probe-overview.bundled.html"), BUNDLED).length === 0);

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

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
