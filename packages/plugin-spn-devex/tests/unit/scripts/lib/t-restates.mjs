// The rules index and the skill blocks, written from the book's parentheses: one entry for each rule, a `short`
// rule's line from the ref that restates it, a `skill:` rule in the step that cites its chapter, and a second run
// that writes nothing.
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { POCKET, SEAT } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const PLUGIN = resolve(import.meta.dirname, "..", "..", "..", "..");
const restates = await import(pathToFileURL(resolve(PLUGIN, "src", "scripts", "lib", "restates.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const BASE = realpathSync(mkdtempSync(join(tmpdir(), "t-restates-")));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));
const put = (path, body) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, body); };

/** A workspace: a book with three rules, and a marketplace whose ref restates one and whose skill steps cite another. */
const ws = join(BASE, "ws");
const book = join(ws, "spn-foundation");
const market = join(ws, "spn-claude-marketplace");
put(join(book, "docs", POCKET.registers, "decisions.md"),
  "| # | Decision | Why | Date |\n| --- | --- | --- | --- |\n| DEC.DEVEX.AGENT.901 | A stated rule. | Because. | 2026-10 |\n");
put(join(book, "docs", SEAT.constructs, "01-rules.md"), [
  "# Rules", "", "## Replies", "",
  "**A reply starts with the answer** (rule RULE.DEVEX.AGENT.901 · MUST · short).", "",
  "**A contract names its states** (rule RULE.SUPPORT.APPS.902 · MUST · skill:spn-apps/implement).", "",
  "**A page is handed over whole** (rule RULE.DEVEX.AGENT.903 · MUST · check:page-path).", "",
].join("\n"));
put(join(market, "packages", "plugin-spn-devex", "src", "refs", "agent.md"),
  "# Agent\n\n## The rules of a reply\n\n**A reply starts with the answer.** (`RULE.DEVEX.AGENT.901` · MUST · short)\n");
const cited = `<!-- spn:restates\n{ "docs": [ { "path": "spn-foundation/docs/${SEAT.constructs}/01-rules.md", "seen": "x" } ] }\n-->\n\n# Contract\n\nSteps.\n`;
put(join(market, "packages", "plugin-spn-apps", "src", "skills", "implement", "steps", "contract.md"), cited);
put(join(market, "packages", "plugin-spn-apps", "src", "skills", "implement", "steps", "ui.md"), "# UI\n\nSteps.\n");
put(join(market, "packages", "plugin-spn-apps", "src", "skills", "implement", "SKILL.md"), "# Implement\n\nThe skill.\n");

console.log("=== the index");
const first = restates.writeRulesIndex(book, market);
const index = JSON.parse(readFileSync(join(market, "packages", "plugin-spn-devex", "src", "refs", "rules.json"), "utf8"));
ok("one entry for each rule that reads", first.rules === 3 && index.rules.length === 3 && first.faults.length === 0, JSON.stringify(first));
const short = index.rules.find((rule) => rule.id === "RULE.DEVEX.AGENT.901");
ok("a `short` entry carries the ref's sentence as its line, with the ref and the heading",
  short.class === "stated" && short.line?.text === "A reply starts with the answer." && short.line.ref === "refs/agent.md" && short.line.heading === "The rules of a reply",
  JSON.stringify(short));
ok("a rule with a register row names the row, and one without has none",
  short.decision === "DEC.DEVEX.AGENT.901" && index.rules.find((rule) => rule.id === "RULE.DEVEX.AGENT.903").decision === null);
ok("the entry names the plugin file that restates the rule",
  short.restated.length === 1 && short.restated[0].plugin === "spn-devex");
ok("the index names the book's commit", typeof index.book.commit === "string" && index.book.repository === "spn-foundation");

console.log("\n=== the skill blocks");
const stepPath = join(market, "packages", "plugin-spn-apps", "src", "skills", "implement", "steps", "contract.md");
const step = readFileSync(stepPath, "utf8");
ok("a `skill:` rule lands in the step whose block cites its chapter, under the step's title",
  step.includes("## The rules this step holds") && step.includes("**A contract names its states** (`RULE.SUPPORT.APPS.902` · MUST · skill:spn-apps/implement)")
    && step.indexOf("# Contract") < step.indexOf("## The rules this step holds"));
ok("a step that cites nothing gets no block", !readFileSync(join(stepPath, "..", "ui.md"), "utf8").includes("The rules this step holds"));
const skillPath = join(market, "packages", "plugin-spn-apps", "src", "skills", "implement", "SKILL.md");
ok("a `skill:` rule no step cites lands in SKILL.md instead",
  (() => {
    put(join(book, "docs", SEAT.constructs, "02-more.md"), "# More\n\n**A page names its audience** (rule RULE.SUPPORT.APPS.904 · MUST · skill:spn-apps/implement).\n");
    restates.writeRulesIndex(book, market);
    return readFileSync(skillPath, "utf8").includes("RULE.SUPPORT.APPS.904");
  })());

console.log("\n=== a second run");
// The blocks a run writes are plugin files that restate their rules, so the index of the next run lists them; the
// run after that has nothing left to change.
restates.writeRulesIndex(book, market);
const again = restates.writeRulesIndex(book, market);
ok("once settled, a run writes nothing", again.written.length === 0, JSON.stringify(again.written));
put(join(book, "docs", SEAT.constructs, "03-bad.md"), "# Bad\n\n**A bare one** (rule RULE.DEVEX.AGENT.905).\n");
ok("a rule whose parenthesis does not read is left out and named",
  (() => { const bad = restates.writeRulesIndex(book, market); return bad.faults.length === 1 && bad.faults[0].includes("RULE.DEVEX.AGENT.905"); })());

console.log(failed ? `\n  ${failed} of ${total} FAILED — restates` : `\n  all ${total} passed — restates`);
process.exit(failed ? 1 : 0);
