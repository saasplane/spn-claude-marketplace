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
ok("[MKT.SCRIPTS.204] one entry for each rule that reads", first.rules === 3 && index.rules.length === 3 && first.faults.length === 0, JSON.stringify(first));
const short = index.rules.find((rule) => rule.id === "RULE.DEVEX.AGENT.901");
ok("[MKT.SCRIPTS.204] a `short` entry carries the ref's sentence as its line, with the ref and the heading",
  short.class === "stated" && short.line?.text === "A reply starts with the answer." && short.line.ref === "refs/agent.md" && short.line.heading === "The rules of a reply",
  JSON.stringify(short));
ok("[MKT.SCRIPTS.204] a rule with a register row names the row, and one without has none",
  short.decision === "DEC.DEVEX.AGENT.901" && index.rules.find((rule) => rule.id === "RULE.DEVEX.AGENT.903").decision === null);
ok("[MKT.SCRIPTS.204] the entry names the plugin file that restates the rule",
  short.restated.length === 1 && short.restated[0].plugin === "spn-devex");
ok("[MKT.SCRIPTS.204] the index names the book's commit", typeof index.book.commit === "string" && index.book.repository === "spn-foundation");

console.log("\n=== the skill blocks");
const stepPath = join(market, "packages", "plugin-spn-apps", "src", "skills", "implement", "steps", "contract.md");
const step = readFileSync(stepPath, "utf8");
ok("[MKT.SCRIPTS.205] a `skill:` rule lands in the step whose block cites its chapter, under the step's title",
  step.includes("## The rules this step holds") && step.includes("**A contract names its states** (`RULE.SUPPORT.APPS.902` · MUST · skill:spn-apps/implement)")
    && step.indexOf("# Contract") < step.indexOf("## The rules this step holds"));
ok("[MKT.SCRIPTS.205] a step that cites nothing gets no block", !readFileSync(join(stepPath, "..", "ui.md"), "utf8").includes("The rules this step holds"));
const skillPath = join(market, "packages", "plugin-spn-apps", "src", "skills", "implement", "SKILL.md");
ok("[MKT.SCRIPTS.205] a `skill:` rule no step cites lands in SKILL.md instead",
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
ok("[MKT.SCRIPTS.206] once settled, a run writes nothing", again.written.length === 0, JSON.stringify(again.written));
put(join(book, "docs", SEAT.constructs, "03-bad.md"), "# Bad\n\n**A bare one** (rule RULE.DEVEX.AGENT.905).\n");
ok("[MKT.SCRIPTS.204] a rule whose parenthesis does not read is left out and named",
  (() => { const bad = restates.writeRulesIndex(book, market); return bad.faults.length === 1 && bad.faults[0].includes("RULE.DEVEX.AGENT.905"); })());

console.log("\n=== the parentheses, field by field");
{
  const stated = restates.ruleMarks(ws);
  const ref = "# Ref\n\n**A reply starts with the answer.** (`RULE.DEVEX.AGENT.901`)\n";
  const found = restates.parenFindings("refs/agent.md", ref, stated);
  ok("[MKT.SCRIPTS.207] a ref that drops the book's level and holder is one finding for each field",
    found.length === 2 && found[0] === "refs/agent.md:3: `RULE.DEVEX.AGENT.901` — level: the book says MUST, this says none"
      && found[1] === "refs/agent.md:3: `RULE.DEVEX.AGENT.901` — short: the book says short, this says nothing", JSON.stringify(found));
  ok("[MKT.SCRIPTS.207] a parenthesis equal to the book's has no finding",
    restates.parenFindings("refs/agent.md", "**A.** (`RULE.DEVEX.AGENT.901` · MUST · short)\n", stated).length === 0);
  ok("[MKT.SCRIPTS.207] a rule no member of the workspace states is named",
    restates.parenFindings("refs/agent.md", "**A.** (`RULE.DEVEX.AGENT.777` · MUST · short)\n", stated)[0].includes("no member of the workspace states this rule"));
  ok("[MKT.SCRIPTS.207] a parenthesis citing two ids is refused, one id to a parenthesis",
    restates.parenFindings("refs/agent.md", "**A.** (`RULE.DEVEX.AGENT.901`, `RULE.DEVEX.AGENT.903`)\n", stated).length === 1);
}

console.log("\n=== the nearest book up");
{
  const { findBook, noBookReason } = await import(pathToFileURL(resolve(PLUGIN, "src", "scripts", "commands", "restates", "check.ts")).href);
  const w = join(BASE, "w");
  const registers = (repo) => put(join(repo, "docs", POCKET.registers, "decisions.md"), "| # | Decision | Why | Date |\n| --- | --- | --- | --- |\n");
  put(join(w, ".spndevex", "state.json"), "{}");
  registers(join(w, "spn-foundation"));
  registers(join(w, ".worktrees", "s", "spn-foundation"));
  put(join(w, ".worktrees", "s", "spn-claude-marketplace", "sprepo.json"), "{}");
  put(join(w, "spn-claude-marketplace", "sprepo.json"), "{}");
  ok("[MKT.SCRIPTS.208] from a worktree set's marketplace, the set's own book is read",
    findBook(undefined, join(w, ".worktrees", "s", "spn-claude-marketplace")) === join(w, ".worktrees", "s", "spn-foundation"));
  ok("[MKT.SCRIPTS.208] from the workspace's marketplace, the workspace's book is read",
    findBook(undefined, join(w, "spn-claude-marketplace")) === join(w, "spn-foundation"));
  const lonely = join(BASE, "lonely", "somewhere");
  mkdirSync(lonely, { recursive: true });
  ok("[MKT.SCRIPTS.208] with no book anywhere up, there is none and the reason names where the walk began",
    findBook(undefined, lonely) === null && noBookReason(lonely).includes(lonely));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — restates` : `\n  all ${total} passed — restates`);
process.exit(failed ? 1 : 0);
