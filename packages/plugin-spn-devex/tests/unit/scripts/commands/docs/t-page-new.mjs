import { PLUGIN, CHECKS } from "../../../../helpers/harness.mjs";
// `docs page new`, `docs page check <page.html>`, and the unfilled-page rule (RULE.DEVEX.WORKSPACE.560): a hand page starts from its kind's
// template, and no page that still holds a slot or an empty section reaches the developer.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-page-new-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));
const { unfilledPage, slotsLeft, whatHowShape, unpairedTags } = await import(join(CHECKS, "doc-check.ts"));
const { checkUnfilledPage } = await import(join(CHECKS, "unfilled-page.ts"));

let n = 0, failed = 0;
function one(name, got, want) {
  n += 1;
  const ok = typeof want === "function" ? want(got) : got === want;
  if (!ok) { failed += 1; console.log(`  FAIL  ${name}\n        got: ${JSON.stringify(String(typeof got === "object" ? JSON.stringify(got) : got).slice(0, 300))}`); } else console.log(`  PASS  ${name}`);
}
const has = (s) => (got) => String(got.out ?? got).includes(s);
function run(args) {
  try { return { out: execFileSync(process.execPath, [TOOL, "docs", ...args], { encoding: "utf8", cwd: BASE, stdio: "pipe", env: { ...process.env, SPN_WORKSPACE: BASE } }), code: 0 }; }
  catch (e) { return { out: String(e.stdout ?? "") + String(e.stderr ?? ""), code: e.status }; }
}

console.log("=== unpairedTags");
{
  const ok = `<section><div><h2>A</h2></div><pre></section> in code</pre><!-- </div> --></section>`;
  one("[RULE.DEVEX.WORKSPACE.579] [MKT.SCRIPTS.657] boxes that open and close in pairs have no finding, and a tag in pre or a comment is not read", unpairedTags(ok).length, 0);
  one("[RULE.DEVEX.WORKSPACE.579] [MKT.SCRIPTS.657] known-bad: a section closed twice is a RULE naming its line",
    unpairedTags(`<section>\n<section class="sds-group"></section>\n</section>\n</section>\n<h3>FOLD</h3>`), (f) => f.length === 1 && f[0][0] === "RULE" && f[0][1].startsWith("line 4 closes a </section>"));
  one("[MKT.SCRIPTS.657] a box never closed is a RULE naming where it opened", unpairedTags(`<div>\n<section></section>`), (f) => f[0][1].includes("<div> of line 1 is never closed"));
}

console.log("=== unfilledPage");
{
  const P = "/w/pages/a.html";
  const whole = (body) => `<meta charset="utf-8"><title>T</title><div class="sds-page"><main>${body}</main></div>`;
  const full = whole(`<section><div class="sds-section-head"><h2>Why</h2></div><p>Words.</p></section>`);
  one("a filled page has no finding", unfilledPage(P, full).length, 0);
  one("a slot is a RULE finding naming it", unfilledPage(P, whole(`<p>{{TITLE}} and {{NAME}}</p>`)), (f) => f[0][0] === "RULE" && f[0][1].includes("{{TITLE}}") && f[0][1].includes("{{NAME}}"));
  one("a slot in a comment is a note", unfilledPage(P, `${full}<!-- {{X}} -->`).length, 0);
  one("a slot in the spn:doc block is read", slotsLeft('<!-- spn:doc\n{"id": "{{ID}}"}\n-->'), (s) => s[0] === "{{ID}}");
  one("a heading with nothing under it is a finding", unfilledPage(P, whole(`<section><div class="sds-section-head"><h2>Empty one</h2></div></section>`)), (f) => f.length === 1 && f[0][1].includes('"Empty one"'));
  one("a section holding only a placeholder is a finding", unfilledPage(P, whole(`<section><h2>Only</h2><p>{{TEXT}}</p></section>`)), (f) => f.some(([, m]) => m.includes("only a placeholder")));
  one("a heading followed by a deeper heading is a section with parts", unfilledPage(P, whole(`<section><h2>Parts</h2><h3>One</h3><p>Words.</p></section>`)).length, 0);
  one("a section with a table is filled", unfilledPage(P, whole(`<section><h2>T</h2><div><table><tr><td>1</td></tr></table></div></section>`)).length, 0);
  one("a file under templates/ is exempt", unfilledPage("/w/templates/docs/a.html", whole(`<p>{{TITLE}}</p><h2>Empty</h2>`)).length, 0);
}

console.log("\n=== the stop hook's check");
{
  const dir = join(BASE, "stop");
  mkdirSync(join(dir, "templates"), { recursive: true });
  const slotted = join(dir, "slotted.html"), clean = join(dir, "clean.html"), tmpl = join(dir, "templates", "t.html");
  writeFileSync(slotted, "<p>{{TITLE}}</p>");
  writeFileSync(clean, "<p>Words.</p>");
  writeFileSync(tmpl, "<p>{{TITLE}}</p>");
  const url = (p) => pathToFileURL(p).href;
  one("a reply linking a page with a slot is refused with the slot's name", checkUnfilledPage(`Open ${url(slotted)} now.`),
    (f) => f.length === 1 && f[0].check === "unfilled-page" && f[0].message.includes("this page still has slots to fill: ") && f[0].message.includes("{{TITLE}}") && f[0].message.includes("or say it is a template"));
  one("a clean page passes", checkUnfilledPage(`Open ${url(clean)}`).length, 0);
  one("a page under templates/ passes", checkUnfilledPage(`Open ${url(tmpl)}`).length, 0);
  one("a missing page passes", checkUnfilledPage(`Open ${url(join(dir, "gone.html"))}`).length, 0);
  const t0 = performance.now();
  for (let i = 0; i < 50; i += 1) checkUnfilledPage(`${url(slotted)} ${url(clean)} ${url(tmpl)}`);
  console.log(`  timing: ${((performance.now() - t0) / 50).toFixed(2)} ms for a reply linking three pages`);
  one("three linked pages are read in well under 5 ms", (performance.now() - t0) / 50, (ms) => ms < 5);
}

console.log("\n=== docs page new");
{
  const target = join(BASE, "hand", "a.html");
  const made = run(["page", "new", "page", target, "--name", "Probe page"]);
  one("writes the page and says the placeholders left, each with its comment's line", made.out,
    (s) => s.includes("wrote ") && s.includes("still to fill") && s.includes("{{TITLE}}") && s.includes("the page's heading, the promise the page makes"));
  const text = readFileSync(target, "utf8");
  one("fills the name and the newest cut with its hashes", text,
    (s) => s.includes("<title>Probe page</title>") && /docs-language\.css" integrity="sha384-/.test(s) && /docs-page\.js" integrity="sha384-/.test(s) && !s.includes("{{WORKSPACE}}"));
  one("leaves none of the template's notes to its author", text.includes("Placeholders:"), false);
  one("refuses a path that exists", run(["page", "new", "page", target]), (r) => r.code === 1 && r.out.includes("exists") && r.out.includes("Nothing was written"));
  one("refuses a kind it does not know", run(["page", "new", "poster", join(BASE, "hand", "b.html")]), (r) => r.code === 1 && r.out.includes("is no kind of page"));
  const ws = join(BASE, ".spndevex", "workstreams", "open", "041-improvements");
  mkdirSync(ws, { recursive: true });
  const arc = join(ws, "notes", "N018", "preview.html");
  const arcMade = run(["page", "new", "arc", arc, "--name", "N018 Docs tooling"]);
  one("an arc page takes its arc, the workstream's numbered name and its links", readFileSync(arc, "utf8"),
    (s) => s.includes("../../approach.html#N018") && s.includes("041 Improvements") && s.includes("ws-041-improvements-N018") && !s.includes("{{arc}}"));
  one("an arc page says what is left", arcMade, has("still to fill"));
  one("page check on a page with slots exits 1 and names them", run(["page", "check", target]), (r) => r.code === 1 && r.out.includes("{{TITLE}}") && r.out.includes("holds only a placeholder"));
  const filled = join(BASE, "hand", "ok.html");
  writeFileSync(filled, readFileSync(target, "utf8").replace(/\{\{[^{}\n]*\}\}/g, "Words here."));
  one("page check on a filled page has no unfilled finding", run(["page", "check", filled]).out, (s) => !s.includes("still has slots") && !s.includes("only a placeholder"));
}

console.log("\n=== the approach page: arcs are linked in Plan alone, figures stand in What and How");
{
  const fig = '<figure class="dl-figure"><svg></svg></figure>';
  const page = ({ what = "<h3>Domain</h3><p>Line.</p>", how = fig, why = "<p>Why.</p>", plan = "<p>Rows.</p>" } = {}) =>
    `<h2>Why</h2>${why}<h2>What</h2>${what}<h2>Plan</h2>${plan}<h2>How</h2>${how}<h2>Open</h2><p>None.</p>`;
  const found = (text, older = false) => whatHowShape(text, older).map(([, m]) => m).join(" | ");
  one("a page told the new way has no finding", found(page()), "");
  one("an arc link in What is flagged", found(page({ what: '<h3>D</h3><p><a href="notes/N001/arc.html">N001</a></p>' })), has("What links an arc"));
  one("an Arcs line in How is flagged", found(page({ how: `${fig}<p>Arcs: N001</p>` })), has("How has an `Arcs:` line"));
  one("a figure in Why is flagged", found(page({ why: fig })), has("Why holds a figure"));
  one("a figure in Plan is flagged", found(page({ plan: fig })), has("Plan holds a figure"));
  one("two figures in one What domain are flagged", found(page({ what: `<h3>D</h3>${fig}${fig}` })), has("more than one figure"));
  one("a How without its chain is flagged", found(page({ how: "<p>Repositories.</p>" })), has("no release chain"));
  const deferred = (body) => `${page()}<h2>Deferred</h2>${body}`;
  one("a Deferred of one-column rows is clean", found(deferred('<div class="sds-scroll"><table><tbody><tr><td><p><strong>x</strong></p><p>why</p><p><em>Needed for: y</em></p></td></tr></tbody></table></div>')), "");
  one("a Deferred of catalog panels is flagged", found(deferred('<div class="sds-tiles"><div class="sds-tile"></div></div>')), has("Deferred is a catalog or a table of columns"));
  one("a Deferred with a second column is flagged", found(deferred("<table><tbody><tr><td>x</td><td>y</td></tr></tbody></table>")), has("Deferred is a catalog or a table of columns"));
  one("a page in the older order is still SOFT", whatHowShape(page({ how: "<p>x</p>" }), true).every(([grade]) => grade === "SOFT"), true);
}

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
