// The book check: every parenthesis in the book reads, names a level, and names a holder that exists.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const PLUGIN = resolve(import.meta.dirname, "..", "..", "..", "..");
const { bookClassFaults, knownHolders, pluginNameFaults } =
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

// A marketplace with one plugin that ships a check, an event, a stack's check, a skill and an agent.
const marketplace = join(ROOT, "spn-claude-marketplace");
put(join(marketplace, "packages", "plugin-spn-devex", "src", "scripts", "checks", "page-path.ts"));
put(join(marketplace, "packages", "plugin-spn-devex", "src", "scripts", "events", "stop.ts"));
put(join(marketplace, "packages", "plugin-spn-surface", "src", "providers", "ts", "scripts", "checks", "surface.ts"));
put(join(marketplace, "packages", "plugin-spn-apps", "src", "providers", "ts", "scripts", "checks", "_src", "app-style.ts"));
put(join(marketplace, "packages", "plugin-spn-apps", "src", "skills", "implement", "SKILL.md"));
put(join(marketplace, "packages", "plugin-spn-devex", "src", "agents", "spn-panel.md"));

console.log("=== the holders the plugins ship");
const known = knownHolders(marketplace);
ok("[MKT.HOOKS.85] a check is a file of checks/ or events/, without .ts", known.checks.has("page-path") && known.checks.has("stop"));
ok("[MKT.HOOKS.85] a stack's check under providers/ is a check too, and so is each part in its _<group>/ folder",
  known.checks.has("surface") && known.checks.has("app-style"));
ok("[MKT.HOOKS.85] a skill is <plugin>/<skill>", known.skills.has("spn-apps/implement"));
ok("[MKT.HOOKS.327] an agent is <plugin>/<agent>, from a file of a plugin's agents/", known.agents.has("spn-devex/spn-panel") && known.agents.size === 1);
ok("[MKT.HOOKS.327] the holders read no workspace", known.openArcs === undefined);

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
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · since:2026).")[0] === "line 3: (rule RULE.DEVEX.AGENT.113 · MUST · since:2026) — `since` is not a param key — the list is `check`, `short`, `skill`, `agent`");
ok("[MKT.HOOKS.86] a check no plugin ships is refused, and a check still to be built holds nothing",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · check:nothing).").some((f) => f.includes("`check:nothing` names no check the plugins ship") && !f.includes("due")));
ok("[MKT.HOOKS.86] a check named for a repository's own test is held by that test",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · check:workspace-state.spec.ts).").length === 0 &&
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · check:t-sheet.mjs).").length === 0);
ok("[MKT.HOOKS.86] a skill no plugin ships is refused",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · skill:spn-apps/nothing).").some((f) => f.includes("`skill:spn-apps/nothing` names no skill the plugins ship")));
ok("[MKT.HOOKS.86] a due: is an unknown key, with the check built or not",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · check:page-path · due:a/b).").some((f) => f.includes("`due` is not a param key")) &&
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · check:later · due:a/b).").some((f) => f.includes("`due` is not a param key")));

console.log("\n=== an agent holder");
ok("[MKT.HOOKS.327] an agent a plugin ships holds a rule",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · agent:spn-devex/spn-panel).").length === 0);
ok("[MKT.HOOKS.327] an agent holder naming no agent file a plugin ships is refused",
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · agent:spn-devex/nothing).").some((f) => f.includes("`agent:spn-devex/nothing` names no agent the plugins ship")) &&
  faults("A (rule RULE.DEVEX.AGENT.113 · MUST · agent:spn-apps/spn-panel).").some((f) => f.includes("names no agent the plugins ship")));

console.log("\n=== a workstream's name in the book");
const arcName = "036" + "/N008", wsName = "workstream " + "024", bare = "N" + "008";
const same = (line) => {
  const before = faults(line);
  put(join(ROOT, ".spndevex", "workstreams", "open", "036-agent-follows-rules", "arcs", "N008", "state.json"), "{}");
  const after = bookClassFaults(`## H\n\n${line}\n`, knownHolders(marketplace));
  rmSync(join(ROOT, ".spndevex"), { recursive: true, force: true });
  return before.length === after.length && before.every((f, i) => f === after[i]) ? before : null;
};
ok("[MKT.HOOKS.327] a book line naming a workstream with an arc is refused, with a workspace and without one",
  same(`It happened in ${arcName}.`)?.length === 1 && same(`It happened in ${arcName}.`)[0].startsWith("line 3: "));
ok("[MKT.HOOKS.327] the word workstream and a number is refused", same(`See ${wsName} for it.`)?.length === 1);
ok("[MKT.HOOKS.327] an arc number on its own is refused", same(`Arc ${bare} did it.`)?.length === 1);
ok("[MKT.HOOKS.327] a line that names none reads clean, and so does a placeholder",
  faults("The workstream and its arc, as <workstream>/<arc> or N<nnn>.").length === 0);
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

console.log("\n=== the plugins' own prose");
{
  const named = (text, file = "x.ts") => pluginNameFaults(text, file);
  ok("[MKT.HOOKS.328] a comment naming a workstream with an arc is refused",
    named(`// the shape of ${arcName}\nconst a = 1;`).length === 1 && named(`/** ${wsName} did it */`).length === 1);
  ok("[MKT.HOOKS.328] a test title naming one is refused", named(`ok("[X.1] it reads in ${arcName}", true);`).length === 1);
  ok("[MKT.HOOKS.328] a string a test hands the machinery, and a fixture's arc path, are not refused",
    named(`const path = "arcs/N001/state.json";\nput(join(ROOT, "x"), "${arcName}");\nrun("${wsName}");`).length === 0);
  ok("[MKT.HOOKS.328] markdown is read whole", named(`Fixed in ${arcName}.`, "SKILL.md").length === 1);
  ok("[MKT.HOOKS.328] an arc number on its own is not refused in the plugins' prose", named(`// the arc ${bare} did it`).length === 0);
  const src = join(ROOT, "spn-claude-marketplace", "packages", "plugin-spn-devex", "src", "x.ts");
  const hook = (file, content) => { try { return execFileSync("node", [resolve(PLUGIN, "src", "scripts", "checks", "doc-check.ts"), "--stdin"],
    { input: JSON.stringify({ tool_name: "Write", tool_input: { file_path: file, content } }), encoding: "utf8", cwd: ROOT }); }
    catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); } };
  ok("[MKT.HOOKS.328] a write into a plugin's source with such a comment is told", hook(src, `// from ${arcName}\nexport const a = 1;\n`).includes("workstream"));
  ok("[MKT.HOOKS.328] the same comment outside the plugins is not told", !hook(join(ROOT, "elsewhere", "x.ts"), `// from ${arcName}\n`).includes("workstream"));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — book classes` : `\n  all ${total} passed — book classes`);
process.exit(failed ? 1 : 0);
