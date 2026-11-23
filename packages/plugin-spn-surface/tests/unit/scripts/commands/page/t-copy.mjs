// `page copy` — what runs without a browser: where a note is placed, the mode meta, the listener, the copy's assembly and the refusals.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SRC = resolve(import.meta.dirname, "..", "..", "..", "..", "..", "src");
const CLI = join(SRC, "scripts", "cli.ts");
const { placeNotes, noteHtml, pageMarkup, fillTemplate, slugOf, templateBeside, TEMPLATE_IN_DEVEX } = await import(pathToFileURL(join(SRC, "scripts", "commands", "page", "copy.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const run = (...args) => {
  try { return { out: execFileSync("node", [CLI, "page", "copy", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 }; }
};

console.log("=== page copy — the notes' placement");
const headings = [{ title: "Hero", section: 0 }, { title: "Points", section: 1 }, { title: "Points again", section: 1 }, { title: "Closing", section: 2 }];
const placed = placeNotes([{ title: "Points", note: "one claim" }, { title: "Nowhere", note: "lost" }, { title: "Hero", note: "the lead" }, { title: "Points again", note: "same section" }], headings);
ok("a note stands in the section of the heading that carries its title", placed.find((one) => one.section === 1)?.number === 1 && placed.find((one) => one.section === 0)?.number === 3, JSON.stringify(placed));
ok("a note whose title no heading carries is left out, and a section takes one note", placed.length === 2, JSON.stringify(placed));
ok("a note is numbered from 1 by its place in the notes file", placed.map((one) => one.number).join() === "1,3");
const aside = noteHtml(2, "a <b> line");
ok("a note is a hidden aside marked data-note, with its number and its words escaped", aside === '<aside class="sds-note" data-note="2" hidden>2 &middot; a &lt;b&gt; line</aside>' && !aside.includes("style="), aside);

console.log("\n=== page copy — the surface page template holds the copy");
const TEMPLATE = '<meta name="surface-ds" content="11.21.0">\n<meta name="surface-app-css" content="">\n<title>{{NAME}}</title>\n<!-- spn:doc\n{"id": "surface-page-{{page}}", "variant": "surface-page", "title": "{{NAME}}"}\n-->\n<h1 class="sds-surface-title">{{NAME}}</h1>\n<template id="page">\n<div data-section="1">sample</div>\n</template>\n<script src="x.js"></script>\n';
const markup = pageMarkup("<html><head><title>t</title></head><body class=\"a\"><section>Hero</section></body></html>", "body{margin:0}");
ok("[MKT.SCRIPTS.637] the page's markup is its one style and what is inside its body", markup === "<style>\nbody{margin:0}\n</style>\n<section>Hero</section>\n", markup);
const made = fillTemplate(TEMPLATE, markup, { name: "Home Page", ds: "11.22.0", appCss: "../assets/app.css" });
ok("[MKT.SCRIPTS.637] the markup stands in the template's `page` tag, in place of the sample", made.includes('<template id="page">\n<style>') && !made.includes("sample</div>") && made.includes("<section>Hero</section>\n</template>"), made);
ok("[MKT.SCRIPTS.637] the two metas are set, and the name stands in the title, the bar and the page's id", made.includes('content="11.22.0"') && made.includes('content="../assets/app.css"') && made.includes("<title>Home Page</title>") && made.includes("surface-page-home-page") && !made.includes("{{"), made);
ok("[MKT.SCRIPTS.637] the copy holds no mode meta and no listener: the shared script sets the frame's own document", !/preview-mode|surface-page-preview|postMessage|addEventListener/.test(made));
ok("[MKT.SCRIPTS.637] the template's own script line is kept", made.includes('<script src="x.js"></script>'));
ok("[MKT.SCRIPTS.637] a name becomes a file name", slugOf("Home — Page 2") === "home-page-2" && slugOf("***") === "page");
let refused = "";
try { fillTemplate("<p>no tag</p>", markup, { name: "x", ds: "", appCss: "" }); } catch (error) { refused = String(error.message ?? error); }
ok("[MKT.SCRIPTS.637] a template with no `page` tag is refused", refused.includes("template"), refused);
ok("[MKT.SCRIPTS.637] the template is looked for beside the spn-devex plugin's refs when none is named: in the marketplace", String(templateBeside()).includes("plugin-spn-devex") && String(templateBeside()).endsWith("surface-page-template.html"), String(templateBeside()));
{
  // INSTALLED: `<plugins>/<marketplace>/spn-surface/<version>/dist/commands/page` runs beside `<plugins>/<marketplace>/spn-devex/<version>/refs/…`; the newest version holding the template is read.
  const cache = mkdtempSync(join(tmpdir(), "page-copy-installed-"));
  const surface = join(cache, "saasplane", "spn-surface", "0.5.0", "dist", "commands", "page");
  mkdirSync(surface, { recursive: true });
  for (const version of ["0.9.0", "0.10.0", "0.11.0"]) {
    if (version === "0.11.0") { mkdirSync(join(cache, "saasplane", "spn-devex", version), { recursive: true }); continue; }
    const file = join(cache, "saasplane", "spn-devex", version, TEMPLATE_IN_DEVEX);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, version);
  }
  ok("[MKT.SCRIPTS.637] installed, the template is the newest installed spn-devex version that holds it, found beside spn-surface", templateBeside(surface) === join(cache, "saasplane", "spn-devex", "0.10.0", TEMPLATE_IN_DEVEX), String(templateBeside(surface)));
  const lone = join(cache, "alone", "spn-surface", "0.5.0", "dist", "commands", "page");
  mkdirSync(lone, { recursive: true });
  ok("[MKT.SCRIPTS.637] with no spn-devex beside it there is no template, and the command refuses by name, saying to pass --template", templateBeside(lone) === null);
  rmSync(cache, { recursive: true, force: true });
}

console.log("\n=== page copy — refused by name");
{
  const none = run();
  ok("with no words it exits 2 and says what it takes", none.code === 2 && none.out.includes("takes a url and a folder"), none.out);
  const bad = run("not-a-url", "/tmp/x");
  ok("a word that is no url exits 2", bad.code === 2 && bad.out.includes("takes a url"), bad.out);
  const missing = run("https://example.invalid/", "/tmp/x", "--notes", "/nonexistent/notes.json");
  ok("a notes file that is not there exits 2 and names it", missing.code === 2 && missing.out.includes("/nonexistent/notes.json"), missing.out);
  const noTemplate = run("https://example.invalid/", "/tmp/x", "--template", "/nonexistent/template.html");
  ok("a template that is not there exits 2 and names it", noTemplate.code === 2 && noTemplate.out.includes("/nonexistent/template.html"), noTemplate.out);
  const help = run("--help");
  ok("--help names the command's words", help.out.includes("page copy") || help.out.includes("<url> <folder>"), help.out);
}

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
