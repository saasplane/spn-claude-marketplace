// `page copy` — what runs without a browser: where a note is placed, the mode meta, the listener, the copy's assembly and the refusals.
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SRC = resolve(import.meta.dirname, "..", "..", "..", "..", "..", "src");
const CLI = join(SRC, "scripts", "cli.ts");
const { placeNotes, noteHtml, previewMeta, LISTENER, assemble, MODE_SWITCH } = await import(pathToFileURL(join(SRC, "scripts", "commands", "page", "copy.ts")).href);

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
ok("a note is a hidden aside marked data-note, with its number and its words escaped", aside.startsWith('<aside data-note="2" hidden ') && aside.includes(">2</b>a &lt;b&gt; line</aside>"), aside);

console.log("\n=== page copy — the meta and the listener");
ok("the meta names the page's own mode switch", previewMeta() === '<meta name="preview-mode" content="data-mode light dark">' && MODE_SWITCH === "data-mode light dark", previewMeta());
ok("the listener reads the preview's message and shows or hides the notes", LISTENER.includes("e.data['surface-page-preview']") && LISTENER.includes("n.hidden=!d.notes") && LISTENER.includes("setAttribute(s[0]"), LISTENER);
ok("the listener names no outside address", !/https?:\/\//.test(LISTENER));

console.log("\n=== page copy — the copy");
const copy = assemble("<html><head><title>t</title></head><body><section></section></body></html>", "body{margin:0}");
ok("it opens with a doctype, holds the meta and one style in the head, and the listener at the end of the body", copy.startsWith("<!doctype html>\n") && /<meta name="preview-mode"[^>]*>\n<style>\nbody\{margin:0\}\n<\/style>\n<\/head>/.test(copy) && copy.endsWith(`${LISTENER}\n</body></html>`), copy);

console.log("\n=== page copy — refused by name");
{
  const none = run();
  ok("with no words it exits 2 and says what it takes", none.code === 2 && none.out.includes("takes a url and a folder"), none.out);
  const bad = run("not-a-url", "/tmp/x");
  ok("a word that is no url exits 2", bad.code === 2 && bad.out.includes("takes a url"), bad.out);
  const missing = run("https://example.invalid/", "/tmp/x", "--notes", "/nonexistent/notes.json");
  ok("a notes file that is not there exits 2 and names it", missing.code === 2 && missing.out.includes("/nonexistent/notes.json"), missing.out);
  const help = run("--help");
  ok("--help names the command's words", help.out.includes("page copy") || help.out.includes("<url> <folder>"), help.out);
}

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
