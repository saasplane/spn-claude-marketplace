// `figma-connector` — the check before a `use_figma` call. Each case runs the dispatcher's own entry
// with a PreToolUse event on stdin, the way the hook does.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const ENTRY = resolve(PLUGIN, "src", "scripts", "events", "pretooluse.ts");
const TOOL = "mcp__figma__use_figma";
const SKILLS = "resource:figma-use";

function once(event) {
  try {
    return execFileSync("node", [ENTRY], { input: JSON.stringify(event), encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }).trim();
  } catch (error) { return `${String(error.stdout ?? "")}${String(error.stderr ?? "")}`.trim(); }
}

let total = 0, failed = 0;

/** `expect` is "deny", "note" or "" (silent); `says` is a list of exact sentences the answer must hold. */
function one(label, { code, skillNames = SKILLS, tool = TOOL, expect, says = [], silentOf = [] }) {
  total += 1;
  const input = { fileKey: "abc", code, description: "read the pages" };
  if (skillNames !== null) input.skillNames = skillNames;
  const out = once({ tool_name: tool, tool_input: input, cwd: process.cwd() });
  let kind = "", text = "";
  try {
    const parsed = JSON.parse(out);
    const specific = parsed.hookSpecificOutput ?? {};
    if (specific.permissionDecision === "deny") { kind = "deny"; text = specific.permissionDecisionReason; }
    else if (parsed.systemMessage || specific.additionalContext) { kind = "note"; text = specific.additionalContext ?? parsed.systemMessage; }
  } catch { if (out) { kind = `UNPARSEABLE: ${out.slice(0, 120)}`; text = out; } }
  const saysOk = says.every((sentence) => text.includes(sentence));
  const absentOk = silentOf.every((sentence) => !text.includes(sentence));
  const ok = kind === expect && saysOk && absentOk;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect || "silent"} · got ${kind || "silent"}`);
  if (!ok) console.log(`        said: ${text.slice(0, 400)}`);
}

const READING = [
  "const pages = figma.root.children.map((page) => ({ id: page.id, name: page.name }));",
  "const page = await figma.getNodeByIdAsync(pages[0].id);",
  "await figma.setCurrentPageAsync(page);",
  "const sets = page.findAllWithCriteria({ types: ['COMPONENT_SET'] });",
  "return { pages, sets: sets.map((set) => ({ id: set.id, name: set.name })) };",
].join("\n");

const CHANGING = [
  "const page = await figma.getNodeByIdAsync('1:2');",
  "await figma.setCurrentPageAsync(page);",
  "const frame = figma.createAutoLayout();",
  "page.appendChild(frame);",
  "frame.name = 'Sheet';",
  "return { createdNodeIds: [frame.id], mutatedNodeIds: [] };",
].join("\n");

const SAVE_SENTENCE = "The script uses saveVersionHistoryAsync, which the connector does not support: a person saves a named version in Figma before the connector's first change in a file, so ask the developer for it.";

console.log("=== figma-connector — each refusal, with its sentence");

one("saveVersionHistoryAsync", {
  code: "await figma.saveVersionHistoryAsync('before the change');\nreturn 1;",
  expect: "deny", says: [SAVE_SENTENCE],
});
one("loadAllPagesAsync", {
  code: "await figma.loadAllPagesAsync();\nreturn 1;",
  expect: "deny", says: ["The script uses loadAllPagesAsync, which the connector does not support: work on one page at a time."],
});
one("setPluginData on a node", {
  code: "node.setPluginData('k', 'v');\nreturn 1;",
  expect: "deny", says: ["The script uses setPluginData, which the connector does not support: keep your notes outside the file."],
});
one("createImageAsync", {
  code: "const image = await figma.createImageAsync('https://x/y.png');\nreturn 1;",
  expect: "deny", says: ["The script uses createImageAsync, which the connector does not support: build the drawing from layers, and make an icon an instance of the icon unit."],
});
one("an assignment to figma.currentPage", {
  code: "figma.currentPage = page;\nreturn 1;",
  expect: "deny", says: ["The script assigns figma.currentPage, which throws in the connector: move with await figma.setCurrentPageAsync(page) instead."],
});
one("figma.notify", {
  code: "figma.notify('done');\nreturn 1;",
  expect: "deny", says: ["The script calls figma.notify, which throws in the connector: return what you need to see, because only the return value comes back."],
});
one("figma.closePlugin", {
  code: "figma.closePlugin();",
  expect: "deny", says: ["The script calls figma.closePlugin, which has no place in a connector script: a script is plain JavaScript with top-level await and return, so remove the call."],
});
one("two findings are both said, in one refusal", {
  code: "figma.notify('x');\nawait figma.loadAllPagesAsync();",
  expect: "deny", says: ["The script uses loadAllPagesAsync", "The script calls figma.notify"],
});
one("an optional-chained call is still found", {
  code: "await figma?.saveVersionHistoryAsync('x');",
  expect: "deny", says: [SAVE_SENTENCE],
});

console.log("\n=== figma-connector — each note lets the call go and adds its line");

one("two page switches", {
  code: "await figma.setCurrentPageAsync(a);\nawait figma.setCurrentPageAsync(b);\nreturn 1;",
  expect: "note", says: ["The script calls setCurrentPageAsync 2 times: a script switches page once, because each switch loads the file again, and work over several pages is one call for each page (two branches that each switch once are fine)."],
});
one("a switch inside a loop is one switch in the text, so it is not noted", {
  code: "for (const page of pages) { await figma.setCurrentPageAsync(page); }\nreturn 1;",
  expect: "",
});
one("a missing skillNames", {
  code: READING, skillNames: null,
  expect: "note", says: ['The call passes no skillNames: pass skillNames "resource:figma-use" on every call, and add resource:figma-generate-library on a call that changes a set, a version, a variable or a style.'],
});
one("a blank skillNames", {
  code: READING, skillNames: "   ",
  expect: "note", says: ["The call passes no skillNames"],
});
one("both notes together", {
  code: "await figma.setCurrentPageAsync(a);\nawait figma.setCurrentPageAsync(b);", skillNames: null,
  expect: "note", says: ["setCurrentPageAsync 2 times", "The call passes no skillNames"],
});

console.log("\n=== figma-connector — a right script passes with no line at all");

one("the reading script", { code: READING, expect: "" });
one("the changing script", { code: CHANGING, skillNames: "resource:figma-use,resource:figma-generate-library", expect: "" });
one("a comparison with figma.currentPage is not an assignment", {
  code: "if (figma.currentPage === page) return 1;\nreturn figma.currentPage.name;", expect: "",
});

console.log("\n=== figma-connector — a refused word in a string or a comment refuses nothing");

one("in a line comment", {
  code: "// never call figma.saveVersionHistoryAsync or figma.notify here\nreturn 1;", expect: "",
});
one("in a block comment", {
  code: "/* figma.closePlugin(); figma.currentPage = page; */\nreturn 1;", expect: "",
});
one("in single, double and template strings", {
  code: "return ['figma.notify(x)', \"loadAllPagesAsync\", `node.setPluginData(1)`, 'figma.currentPage = p'];", expect: "",
});
one("after a string holding a comment marker", {
  code: "const url = 'https://x.y/z';\nawait figma.saveVersionHistoryAsync('v');",
  expect: "deny", says: [SAVE_SENTENCE],
});
one("a word that only contains an unsupported name", {
  code: "const mySetPluginDataLabel = 1;\nreturn mySetPluginDataLabel;", expect: "",
});

console.log("\n=== figma-connector — other calls are not looked at");

one("another tool of the same server", { code: "figma.notify('x');", tool: "mcp__figma__get_metadata", expect: "" });
one("a tool of another server with the same word", { code: "figma.notify('x');", tool: "mcp__other__use_figma", expect: "" });
one("a call whose code is not text", { code: 7, expect: "" });

console.log(failed ? `\n  ${failed} of ${total} FAILED — figma-connector` : `\n  all ${total} passed — figma-connector`);
process.exit(failed ? 1 : 0);
