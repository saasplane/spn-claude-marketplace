// The book check: every parenthesis in the book reads, names a level, and names a holder that exists.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const PLUGIN = resolve(import.meta.dirname, "..", "..", "..", "..");
const { bookClassFaults, knownHolders } =
  await import(pathToFileURL(resolve(PLUGIN, "src", "scripts", "checks", "book-classes.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const ROOT = realpathSync(mkdtempSync(join(tmpdir(), "book-classes-")));
process.on("exit", () => rmSync(ROOT, { recursive: true, force: true }));
const put = (path, body = "") => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, body); };

// A marketplace with one plugin that ships a check, an event, a stack's check and a skill; a workspace with one
// open arc and one that has landed.
const marketplace = join(ROOT, "spn-claude-marketplace");
put(join(marketplace, "packages", "plugin-spn-devex", "src", "scripts", "checks", "page-path.ts"));
put(join(marketplace, "packages", "plugin-spn-devex", "src", "scripts", "events", "stop.ts"));
put(join(marketplace, "packages", "plugin-spn-surface", "src", "providers", "ts", "scripts", "checks", "surface.ts"));
put(join(marketplace, "packages", "plugin-spn-apps", "src", "providers", "ts", "scripts", "checks", "_src", "app-style.ts"));
put(join(marketplace, "packages", "plugin-spn-apps", "src", "skills", "implement", "SKILL.md"));
put(join(ROOT, ".spndevex", "workstreams", "open", "036-agent-follows-rules", "arcs", "N008", "state.json"), "{}");
put(join(ROOT, ".spndevex", "workstreams", "open", "036-agent-follows-rules", "arcs", "N005", "state.json"), '{"status":"LANDED"}');

console.log("=== the holders the plugins ship");
const known = knownHolders(marketplace, ROOT);
ok("[MKT.HOOKS.85] a check is a file of checks/ or events/, without .ts", known.checks.has("page-path") && known.checks.has("stop"));
ok("[MKT.HOOKS.85] a stack's check under providers/ is a check too, and so is each part in its _<group>/ folder",
  known.checks.has("surface") && known.checks.has("app-style"));
ok("[MKT.HOOKS.85] a skill is <plugin>/<skill>", known.skills.has("spn-apps/implement"));
ok("[MKT.HOOKS.85] an open arc is <workstream number>/<arc>", known.openArcs.has("036/N008"));
ok("[MKT.HOOKS.85] an arc that has landed is not open", !known.openArcs.has("036/N005"));
ok("[MKT.HOOKS.85] no workspace gives no open arcs to check against", knownHolders(marketplace, null).openArcs === null);

console.log("\n=== the faults, each in words a writer can act on");
const faults = (line) => bookClassFaults(`## H\n\n${line}\n`, known);
ok("[MKT.HOOKS.86] a clean checked rule, a stated rule and a guidance rule have no fault",
  faults("A MUST (rule RULE.DEVEX.AGENT.113 · MUST · check:page-path).").length === 0 &&
  faults("A MUST (rule RULE.DEVEX.AGENT.114 · MUST · short).").length === 0 &&
  faults("A MAY (rule RULE.DEVEX.AGENT.115 · GUIDE).").length === 0);
ok("[MKT.HOOKS.86] a bare parenthesis names no level",
  faults("A MUST (rule RULE.DEVEX.AGENT.113).")[0]?.startsWith("line 3: RULE.DEVEX.AGENT.113 — ") && faults("A MUST (rule RULE.DEVEX.AGENT.113).")[0].includes("names no level"));
ok("[MKT.HOOKS.86] a MUST that nothing holds is refused", faults("A (rule RULE.DEVEX.AGENT.113 · MUST).").some((f) => f.includes("names what holds it")));
ok("[MKT.HOOKS.86] a param key outside the list is refused with line and raw text",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · since:2026).")[0] === "line 3: (rule RULE.DEVEX.AGENT.113 · MUST · since:2026) — `since` is not a param key — the list is `check`, `due`, `short`, `skill`");
ok("[MKT.HOOKS.86] a check no plugin ships is refused, with the way out",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · check:nothing).").some((f) => f.includes("`check:nothing` names no check the plugins ship") && f.includes("`due:`")));
ok("[MKT.HOOKS.86] a built check whose due: names an open arc reads clean: that arc teaches it the breach",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · check:page-path · due:036/N008).").length === 0);
ok("[MKT.HOOKS.86] a due: whose arc has landed comes off",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · check:page-path · due:036/N005).").some((f) => f.includes("`due:036/N005` names no open arc") && f.includes("comes off")));
ok("[MKT.HOOKS.86] a check named for a repository's own test is held by that test",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · check:workspace-state.spec.ts).").length === 0 &&
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · check:t-sheet.mjs).").length === 0);
ok("[MKT.HOOKS.86] a skill no plugin ships is refused",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · skill:spn-apps/nothing).").some((f) => f.includes("`skill:spn-apps/nothing` names no skill the plugins ship")));
ok("[MKT.HOOKS.86] a due: waiting on a check that is not built reads clean while its arc is open",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · check:later · due:036/N008).").length === 0);
ok("[MKT.HOOKS.86] a due: naming an arc that is not open is refused",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · check:later · due:036/N099).").some((f) => f.includes("`due:036/N099` names no open arc")));
ok("[MKT.HOOKS.86] with no workspace, a due: is not judged",
  bookClassFaults("A (rule RULE.DEVEX.AGENT.113 · MUST · check:later · due:036/N099).\n", knownHolders(marketplace, null)).length === 0);

console.log("\n=== the write check reaches it");
{
  const book = join(ROOT, "spn-foundation");
  const chapter = join(book, "docs", "04-capabilities", "x.md");
  put(join(book, "sprepo.json"), "{}");
  let chapter2;
  const runAt = (file, content) => {
    try { return execFileSync("node", [resolve(PLUGIN, "src", "scripts", "checks", "doc-check.ts"), "--stdin"],
      { input: JSON.stringify({ tool_name: "Write", tool_input: { file_path: file, content } }), encoding: "utf8", cwd: ROOT }); }
    catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
  };
  const run = (content) => runAt(chapter, content);
  ok("[MKT.HOOKS.87] a write of a chapter under spn-foundation/docs/ with a bare parenthesis is told", run("# X\n\nA MUST (rule RULE.DEVEX.AGENT.113).\n").includes("names no level"));
  chapter2 = join(ROOT, "elsewhere", "docs", "04-capabilities", "x.md");
  ok("[MKT.HOOKS.87] the same text in another repository's docs is not told",
    !runAt(chapter2, "# X\n\nA MUST (rule RULE.DEVEX.AGENT.113).\n").includes("names no level"));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — book classes` : `\n  all ${total} passed — book classes`);
process.exit(failed ? 1 : 0);
