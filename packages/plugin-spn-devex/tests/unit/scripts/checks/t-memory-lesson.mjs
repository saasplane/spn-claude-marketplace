// `checks/memory-lesson.ts` — a write to the memory folder in a turn that changed no book or plugin file is noted,
// and the note names where the rule belongs. [MKT.HOOKS.386]
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { applies, checkMemoryLesson } = await import(join(CHECKS, "memory-lesson.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const BASE = realpathSync(mkdtempSync(join(tmpdir(), "spn-devex-memory-lesson-")));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));
const kind = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");
const MEMORY = "/Users/x/.claude/projects/-opt-work-code/memory/lesson.md";

// A workspace whose window note says which repositories the window has written under.
function workspace(name, session, repos) {
  const root = join(BASE, name);
  mkdirSync(join(root, ".spndevex", ".debug", "sessions", session), { recursive: true });
  mkdirSync(join(root, ".spndevex", "workstreams"), { recursive: true });
  const stamped = Object.fromEntries(repos.map((r) => [r, "2026-11-01T00:00:00Z"]));
  writeFileSync(join(root, ".spndevex", ".debug", "sessions", session, "window.json"), JSON.stringify({ workstreams: {}, wrote: {}, told: {}, repos: stamped }));
  return root;
}
const write = (cwd, session, file_path = MEMORY, tool_name = "Write") => ({ tool_name, cwd, session_id: session, tool_input: { file_path } });

console.log("=== a memory write with no book or plugin file touched");
{
  const none = workspace("none", "s1", []), other = workspace("other", "s2", ["spn-platform-ts"]);
  for (const [label, root, session] of [["a window that wrote nowhere", none, "s1"], ["a window that wrote only in an application repository", other, "s2"]]) {
    const verdict = checkMemoryLesson(write(root, session));
    ok(`[MKT.HOOKS.386] ${label} is noted, naming the book and the plugin`, kind(verdict) === "note" && verdict.note.includes("book") && verdict.note.includes("plugin"), JSON.stringify(verdict));
  }
  ok("[MKT.HOOKS.386] an Edit of a memory file is noted too", kind(checkMemoryLesson(write(none, "s1", MEMORY, "Edit"))) === "note");
}

console.log("\n=== what it lets through");
{
  const book = workspace("book", "s3", ["spn-foundation"]), plugin = workspace("plugin", "s4", ["spn-claude-marketplace"]), none = workspace("none2", "s5", []);
  ok("[MKT.HOOKS.386] a window that wrote in the book passes", kind(checkMemoryLesson(write(book, "s3"))) === "silent");
  ok("[MKT.HOOKS.386] a window that wrote in the plugins passes", kind(checkMemoryLesson(write(plugin, "s4"))) === "silent");
  ok("[MKT.HOOKS.386] a write outside a memory folder passes", kind(checkMemoryLesson(write(none, "s5", "/Users/x/work/notes.md"))) === "silent");
  ok("[MKT.HOOKS.386] a Bash call is not read", kind(checkMemoryLesson({ tool_name: "Bash", cwd: none, tool_input: { command: "echo" } })) === "silent");
  ok("[MKT.HOOKS.386] its fast path is the path alone", applies(MEMORY) && !applies("/Users/x/work/a.ts") && !applies("/Users/x/.claude/projects/p/other/a.md"));
}

console.log(`\n${failed ? `${failed} of ${total} FAILED` : `all ${total} passed`}`);
process.exit(failed ? 1 : 0);
