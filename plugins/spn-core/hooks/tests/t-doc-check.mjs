// `doc-check` — the largest port. A fixture proves each check still fires; the corpus diff (in
// t-doc-check-corpus.mjs) proves the port did not quietly change what it says about six hundred
// files nobody is going to re-read.
import { execFileSync } from "node:child_process";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const HOOKS = resolve(import.meta.dirname, "..");
const SCRIPTS = resolve(HOOKS, "scripts");
const DOCS = resolve(HOOKS, "docs");

// THESE SUITES ARE A BUILDER'S GATE, and they say so rather than pretending otherwise. Several cases
// name real files in the surrounding workspace — a chapter, an approach page, this workstream's own
// arcs — because what they prove is that the check agrees with the incumbent ON THE CORPUS, and a
// corpus cannot be invented. A partner holds the plugin without the workspace and runs
// `partner-shape.ts` instead, which needs nothing but the plugin itself.
const WORKSPACE = resolve(HOOKS, "..", "..", "..", "..");

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
  const ts = run("node", [`${HOOKS}/checks/doc-check.ts`, "--stdin"], payload);
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
const CHAPTER = `${WORKSPACE}/spn-foundation/docs/03-capabilities/05-docs/probe.md`;
const APPROACH = `${WORKSPACE}/spn-foundation/artifacts/approaches/probe-approach.html`;
const REGISTER = `${WORKSPACE}/spn-foundation/docs/registers/probe.md`;

// A page that passes everything, used as the base for each known-bad mutation.
const CLEAN = `<!doctype html>
<div class="eyebrow">Who this is for &middot; the developer picking up this work</div>
<h1>A subject</h1>
<section id="s1"><div class="sec-head"><h2>Why &mdash; the reason</h2></div>
  <p>You open this page when the model has no single home. You read it once and you know where each piece sits.</p>
  <p>Split it where it runs long. Say what you mean, and keep the reason beside the rule.</p>
</section>
<section id="s2"><div class="sec-head"><h2>What &mdash; the shape</h2></div>
  <p>You get one place for the model. You get one shape per page, and you get one plain voice.</p>
</section>
<section id="s3"><div class="sec-head"><h2>How &mdash; the order</h2></div>
  <h3>What re-aligns</h3>
  <table><thead><tr><th>What</th><th>Scope</th><th>State</th></tr></thead>
  <tbody><tr><td>the chapter</td><td>spn-foundation</td><td>&#x2705; landed</td></tr></tbody></table>
</section>
`;

console.log("\n=== doc-check — the fixtures");

// KNOWN-BAD, one rule each.
one("a sentence past thirty words",
  write(CHAPTER,
    "# A chapter\n\nYou will find that this one sentence runs on and on and on past the bar the book " +
    "sets for it, because it keeps adding clause after clause after clause until nobody reading it " +
    "can remember how it began or what it was ever meant to say.\n"),
  "reports", "past thirty words");

one("cardinality written into prose",
  write(CHAPTER, "# A chapter\n\nYou will find five decisions here. You read each one and you move on.\n"),
  "reports", "cardinality-in-prose");

one("an idiom a second-language reader cannot guess",
  write(CHAPTER, "# A chapter\n\nYou get it out of the box. You read it once and you are done with it.\n"),
  "reports", "idiom");

one("prose that never says you",
  write(CHAPTER, "# A chapter\n\n" + Array.from({ length: 9 }, (_, i) =>
    `The seat holds its own files and nothing else, in case ${i + 1}.`).join(" ") + "\n"),
  "reports", "never says *you*");

one("an approach page with no Why, What or How",
  write(APPROACH, `<div class="eyebrow">Who this is for &middot; a reader</div><section><h2>Background</h2><p>You read it once and you know it.</p></section>`),
  "reports", "carries no why + what + how");

one("an overview carrying an argument's organs",
  write(`${WORKSPACE}/spn-foundation/artifacts/overviews/probe-overview.html`,
    `<div class="eyebrow">Who this is for &middot; a reader</div><section><h2>Open</h2><p>You read it once and you know it.</p></section>`),
  "reports", "overview carries open");

one("an approach page sitting in the overviews pocket",
  write(`${WORKSPACE}/spn-foundation/artifacts/overviews/probe-approach.html`, CLEAN),
  "reports", "does not end -overview.html");

one("an Open card carrying no options table",
  write(APPROACH, CLEAN + `<section id="s4"><h2>Open</h2><div class="open"><h4 id="q1">Q1 &middot; a question</h4><p>You decide it yourself.</p></div></section>`),
  "reports", "carries no options table");

one("a Deferred card naming no trigger",
  write(APPROACH, CLEAN + `<section id="s5"><h2>Deferred</h2><div class="open"><h4 id="q2">Q2 &middot; a parked thing</h4><p>You leave this one alone.</p></div></section>`),
  "reports", "names no trigger");

one("a register row that says you",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| RD.DOCS.099 | you may not do it |\n"),
  "reports", "says *you*");

one("a register row past twenty-five words",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| RD.DOCS.099 | " +
    "A row states one clause a sentence and never more than that, and this particular row keeps " +
    "going well past the bar the chapter sets for it in every direction. |\n"),
  "reports", "a row states one clause a sentence");

one("a register row that rules over another row",
  write(REGISTER, "# A register\n\n| id | ruling |\n| --- | --- |\n| RD.DOCS.099 | Supersedes RD.DOCS.008 |\n"),
  "reports", "rules over RD.DOCS.008");

// THIS ONE NEEDS A REAL NODE. The rule fires on a `CONCEPT.md` with an `spkind.json` beside it, and
// the manifest is the workspace's, not something a fixture can stand in for. Run from a copy outside
// a workspace — which is how the port is proven against a tree with no `hooks/scripts/` — the case
// cannot run, and says so rather than failing.
if (!existsSync(resolve(WORKSPACE, ".spndevex")))
  console.log("  SKIP  a CONCEPT.md sitting beside a node manifest — this copy sits outside a workspace");
else one("a CONCEPT.md sitting beside a node manifest",
  write(`${WORKSPACE}/spn-platform-ts/apps/web-account-ts/CONCEPT.md`, "# A concept\n\nYou read it here.\n"),
  "reports", "belongs to a repo root");

// UNTOUCHED — every shape that must stay writable.
one("a well-formed approach page", write(APPROACH, CLEAN), "silent");

one("a file the standard does not watch",
  write(`${WORKSPACE}/spn-support-ts/src/thing.ts`, "export const x = 1;\n"), "silent");

one("an arc under .spndevex is state, not corpus",
  write(`${WORKSPACE}/.spndevex/workstreams/open/008-plain-language/arcs/probe.md`,
    "# Arc\n\n" + Array.from({ length: 9 }, () => "The seat holds its own files and nothing else here.").join(" ")),
  "silent");

one("a rule may quote the mistake it bans",
  write(CHAPTER, "# A chapter\n\nYou never write *five decisions* into a sentence. You name the set by its rule.\n"),
  "silent");

console.log("\n=== doc-check — every path a Bash command writes");
{
  n += 1;
  const command = "cat > docs/a.md <<'EOF'\nhello\nEOF\nsed -i '' 's/a/b/' docs/b.md\ncp docs/c.md docs/d.md\necho hi | tee -a docs/e.md";
  const payload = { tool_name: "Bash", tool_input: { command } };
  const ts = run("node", [`${HOOKS}/checks/doc-check.ts`, "--bash-writes"], payload);
  const py = hasPython("doc-check.py") ? run("python3", [`${SCRIPTS}/doc-check.py`, "--bash-writes"], payload) : null;
  const ok = (py === null || ts === py) && ["docs/a.md", "docs/b.md", "docs/d.md", "docs/e.md"].every((f) => ts.includes(f));
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  redirect with a heredoc body, sed -i, cp and tee all found\n        ts [${ts.split("\n").join(" · ")}]\n        py [${py === null ? "not installed" : py.split("\n").join(" · ")}]`);
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
