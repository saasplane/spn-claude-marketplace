import { PLUGIN } from "../../../../helpers/harness.mjs";
// `docs figure` — proves the ONE thing nothing else covers: that `args[0]` correctly routes between
// the two halves this action combines. `figure check|colour` is extensively proven already, against
// the old `tools/docs.ts figures check|colour` argv shape, in `tests/unit/scripts/t-seats.mjs` — a
// file this workstream slice does not own, and which keeps exercising this exact moved logic through
// the forwarder `tools/docs.ts` -> `cli.ts` -> this file. No suite anywhere proved the DISPATCH
// itself — that `check`/`colour` in `args[0]` pick the geometry half and anything else falls through
// to the browser render — so that is what these three cases are for.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { OWN_COPY, linesFor } from "../../../../../../plugin-support-lib/src/lib/page-styles.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-figure-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

function run(args, cwd = BASE) {
  try { return { out: execFileSync(process.execPath, [TOOL, "docs", "figure", ...args], { encoding: "utf8", cwd }), code: 0 }; }
  catch (e) { return { out: String(e.stdout ?? "") + String(e.stderr ?? ""), code: e.status ?? 1 }; }
}

let n = 0, failed = 0;
function one(label, ok) {
  n += 1;
  if (!ok) { failed += 1; console.log(`  FAIL  ${label}`); }
  else console.log(`  PASS  ${label}`);
}

console.log("\n=== `figure`'s args[0] picks the geometry half or falls through to the render half");

// A page in the shared form: the line that links the shared stylesheet, then the page's content.
const LINK = linesFor("1.0.0").stylesheet;
const shared = (content) => `${LINK}\n<div class="sds-page">\n${content}\n</div>\n`;
// A drawing whose connector ends in empty space, written with whichever class names are given.
const drawing = (svg, box, connector) =>
  `<figure><svg class="${svg}" viewBox="0 0 400 200"><rect class="${box}" x="40" y="60" width="100" height="60" rx="3"/>` +
  `<path class="${connector}" d="M240 30 H185"/></svg></figure>`;
/** One folder under the scratch base, holding one page. */
function pageIn(name, text) {
  const dir = join(BASE, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "a.html"), text);
  return dir;
}

// `check` reads a page's own geometry — no browser involved, so this is the same on every machine.
{
  const { out, code } = run(["check", pageIn("check", shared(`<h1>p</h1>\n<figure><svg class="sds-drawing" viewBox="0 0 100 60"><rect class="sds-box" x="10" y="10" width="40" height="20"/></svg></figure>`))]);
  one("`figure check` runs the geometry check, not the render — it reports pages, not a render's PNG line",
    out.includes("clean — 1 page") && !out.includes("->"));
  one("and it exits clean", code === 0);
}
{
  // VERIFY THE VERIFIER: the same faulty drawing, on a page in the shared form, is reported.
  const { out, code } = run(["check", pageIn("check-bad", shared(drawing("sds-drawing", "sds-box", "sds-connector")))]);
  one("known-bad: a connector that ends in empty space, on a page that links the shared stylesheet, is refused",
    out.includes("RULE figure") && out.includes("empty space") && code === 1);
}
{
  // A PAGE THAT LINKS NO SHARED STYLESHEET HOLDS ITS OWN COPY, with the class names that copy used.
  // The check names the page once and reads no drawing of it, so the faulty drawing draws no finding.
  const own = `<!-- spn:doc\n{"id": "probe", "variant": "overview", "title": "Probe"}\n-->\n<style>.dg .c{stroke:blue}</style>\n<div class="page">\n${drawing("dg", "box", "c")}\n</div>\n`;
  const { out, code } = run(["check", pageIn("check-own", own)]);
  one("[MKT.SCRIPTS.108] `figure check` names a page that holds its own copy once, as a RULE, with the text every command uses",
    (out.match(/✗ RULE styles/g) ?? []).length === 1 && out.includes(OWN_COPY) && !out.includes("SOFT styles"));
  one("[MKT.SCRIPTS.108] and reads no drawing of it: no figure finding, and the exit is 1 for the page alone",
    !out.includes("RULE figure") && !out.includes("empty space") && code === 1);
  one("[MKT.SCRIPTS.108] the summary counts it as a RULE", out.includes("1 figure finding — 1 RULE, 0 SOFT, over 1 page"));
  // AN HTML FILE THAT IS NO PAGE OF OURS, such as a test report, has no `spn:doc` block and sits in no docs tree.
  const report = run(["check", pageIn("check-report", `<style>.x{color:red}</style>\n<div id="root"></div>\n`)]);
  one("[MKT.SCRIPTS.108] an html file that is no page of ours is read past: it is not named, and the exit is 0",
    !report.out.includes("RULE styles") && report.code === 0);
}

// `colour` is the geometry check's other half — also no browser.
{
  const coloured = `<pre data-lang="ts"><span class="sds-tk-k">const</span> a = <span class="sds-tk-n">1</span>;</pre>`;
  const { out, code } = run(["colour", pageIn("colour", shared(coloured))]);
  one("`figure colour` runs the colour audit, not the render: a block coloured with the shared names matches its own text",
    out.includes("every coloured block matches its own text") && code === 0);
  const bad = run(["colour", pageIn("colour-bad", shared(coloured.replace("sds-tk-n", "sds-tk-k")))]);
  one("known-bad: a block whose colouring is not what its text gives is refused",
    bad.out.includes("1 block off") && bad.code === 1);
  const own = run(["colour", pageIn("colour-own", `<!-- spn:doc\n{"id": "probe", "variant": "overview", "title": "Probe"}\n-->\n<style>.tk-k{color:red}</style>\n<pre data-lang="ts"><span class="tk-k">const</span> a = 1;</pre>\n`)]);
  one("[MKT.SCRIPTS.108] `figure colour` names a page that holds its own copy once, as a RULE, and reads no block of it",
    (own.out.match(/✗ RULE styles/g) ?? []).length === 1 && own.out.includes(OWN_COPY) && !own.out.includes("RULE figure") && !/blocks? off/.test(own.out));
  one("[MKT.SCRIPTS.108] and it exits 1, and the summary says the page was not read", own.out.includes("1 page not read") && own.code === 1);
}

// Anything else in `args[0]` is a file to render, never a geometry subcommand. The browser is
// optional on the machine running this suite, so both shapes the render half can honestly print are
// accepted — what is under test is that this path is NOT the geometry check's output shape.
{
  const svg = join(BASE, "plain.svg");
  writeFileSync(svg, `<svg viewBox="0 0 100 60"><rect x="10" y="10" width="40" height="20"/></svg>`);
  const { out, code } = run([svg]);
  one("a bare path is rendered, not geometry-checked — it never reports `clean — N page(s)`",
    !/clean — \d+ page/.test(out));
  one("it either found no browser and said so, or rendered and reported per file",
    out.includes("No browser on this machine") || out.includes("plain.svg"));
  one("and it exits clean either way — the render half reports, it never refuses", code === 0);
}

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
