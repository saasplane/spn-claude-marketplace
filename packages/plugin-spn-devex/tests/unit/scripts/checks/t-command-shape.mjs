// `checks/command-shape.ts` — a Bash call the workspace's floor would send for approval only by its
// shape is told the part and its plain form. It is a `note`, never a `deny`, and a call whose prompt is
// about what it runs, or a plain allowed command, hears nothing.
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";
import { workspace } from "../../../helpers/fixture.mjs";

const { applies, checkCommandShape, partsOf, readFloor, ruleMatches, shapeHint } = await import(join(CHECKS, "command-shape.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

// A floor in the workspace's own shape: reads and their filters allowed, a push asked, a hard reset
// denied, and no rule for `cd` or `jq`.
const settings = JSON.stringify({ permissions: {
  allow: ["Bash(git status:*)", "Bash(git log:*)", "Bash(grep:*)", "Bash(head:*)", "Bash(wc:*)", "Bash(ls:*)", "Bash(node --version)", "Read(**)"],
  ask: ["Bash(git push:*)"],
  deny: ["Bash(git reset --hard:*)", "Bash(rm -rf *)"],
} });
const root = workspace("command-shape", { ".claude/settings.json": settings, "spn-x/a.ts": "export const a = 1;\n" });
const floor = readFloor(root);
const bash = (command, cwd = root) => ({ tool_name: "Bash", cwd, tool_input: { command } });
const verdictOf = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");

console.log("=== the floor and the parts");
{
  ok("the floor keeps the Bash rules by tier and leaves the others", floor.allow.length === 7 && floor.ask.join() === "git push:*" && floor.deny.length === 2, JSON.stringify(floor));
  ok("a prefix rule names its command and what goes on after a space", ruleMatches("git status:*", "git status --short") && ruleMatches("git status:*", "git status") && !ruleMatches("git status:*", "git statusx"));
  ok("an exact rule names the command alone", ruleMatches("node --version", "node --version") && !ruleMatches("node --version", "node --version x"));
  ok("a `*` stands for any text", ruleMatches("rm -rf *", "rm -rf /tmp/x"));
  ok("a call splits at `|`, `&&`, `||`, `;` and a line break, and a quoted operator stays",
    JSON.stringify(partsOf("grep 'a|b' x | head -1 && ls; wc -l y || ls\nls").map((part) => part.text)) === '["grep \'a|b\' x","head -1","ls","wc -l y","ls","ls"]',
    JSON.stringify(partsOf("grep 'a|b' x | head -1 && ls; wc -l y || ls\nls")));
  ok("a `$( … )` is a part of its own, and `2>&1` stays in its part",
    JSON.stringify(partsOf("ls $(git log -1) 2>&1").map((part) => part.text)) === '["git log -1","ls $SUBSTITUTION 2>&1"]', JSON.stringify(partsOf("ls $(git log -1) 2>&1")));
  ok("a lone `&` sends its part to the background", partsOf("git status &")[0].background === true);
}

console.log("\n=== the shape is the only reason for the prompt: a hint");
{
  const pipe = checkCommandShape(bash("grep -n rule spn-x/a.ts | head -5"));
  ok("a pipe of two allowed commands gets a note naming each part and one command per call",
    verdictOf(pipe) === "note" && pipe.note.includes("`grep -n rule spn-x/a.ts`") && pipe.note.includes("`head -5`") && pipe.note.includes("one command per call"), pipe?.note);
  const cd = checkCommandShape(bash("cd spn-x && git status --short"));
  ok("a `cd x &&` before an allowed command gets a note naming the `cd` and `cd <dir>` as a call of its own",
    verdictOf(cd) === "note" && cd.note.includes("`cd spn-x`") && cd.note.includes("`cd <dir>` as a call of its own") && cd.note.includes("`git status --short`"), cd?.note);
  const cdAllowed = shapeHint({ ...floor, allow: [...floor.allow, "cd:*"] }, "cd spn-x && git status");
  ok("where the floor allows `cd`, the joined call still gets one command per call and `cd <dir>` as a call of its own, and no word about a pipe",
    (cdAllowed ?? "").includes("allowed on its own") && cdAllowed.includes("`cd <dir>` as a call of its own") && !cdAllowed.includes("pipe"), cdAllowed);
  const loop = checkCommandShape(bash("for f in spn-x/*.ts; do wc -l $f; done"));
  ok("a loop over an allowed command gets one line naming the loop and a script run by its name",
    verdictOf(loop) === "note" && loop.note.includes("`for` … `done`") && loop.note.includes("run by its name") && loop.note.split("\n- ").length === 2, loop?.note);
  const path = checkCommandShape(bash("/usr/bin/git status"));
  ok("a program named by its path where the floor names it by its name gets the name", verdictOf(path) === "note" && path.note.includes("`git status`"), path?.note);
  const background = checkCommandShape(bash("git log --oneline &"));
  ok("an allowed command sent off with `&` gets `run_in_background`", verdictOf(background) === "note" && background.note.includes("`run_in_background`"), background?.note);
}

console.log("\n=== the shape is not why it would prompt: silent");
{
  ok("a plain allowed command gets no hint", checkCommandShape(bash("git status --short")) === null);
  ok("a plain command no rule names gets no hint, since its prompt is about what it runs", checkCommandShape(bash("jq . x.json")) === null);
  ok("a pipe into a program no rule names gets no hint", checkCommandShape(bash("git log | jq .")) === null);
  ok("a part an ask rule names keeps the call silent", checkCommandShape(bash("cd spn-x && git push")) === null);
  ok("a part a deny rule names keeps the call silent", checkCommandShape(bash("git status && git reset --hard HEAD")) === null);
  ok("a command no rule names sent off with `&` gets no hint", checkCommandShape(bash("sleep 5 &")) === null);
  ok("a call outside a workspace gets no hint", checkCommandShape(bash("cd spn-x && git status", "/")) === null);
  ok("a call in a workspace with no floor gets no hint", shapeHint(readFloor(workspace("command-shape-no-floor")), "cd x && git status") === null);
  ok("a non-Bash call gets no verdict", checkCommandShape({ tool_name: "Read", cwd: root, tool_input: { command: "cd x && ls" } }) === null);
}

console.log("\n=== it is a note and never a refusal, through the dispatcher");
{
  ok("the fast path takes a joined call, a `cd`, a loop and a path, and passes a plain command", applies("", "a | b") && applies("", "cd x") && applies("", "for f in x") && applies("", "/bin/ls") && !applies("", "git status"));
  const ran = spawnSync(process.execPath, [join(CHECKS, "..", "events", "pretooluse.ts")], {
    input: JSON.stringify(bash("cd spn-x && git status")), encoding: "utf8", env: { ...process.env, SPN_TELEMETRY: "off" } });
  const answer = JSON.parse((ran.stdout || "{}").trim().split("\n").at(-1) || "{}").hookSpecificOutput ?? {};
  ok("the dispatcher returns the hint as additional context and decides nothing", ran.status === 0 && (answer.additionalContext ?? "").includes("`cd <dir>` as a call of its own") && answer.permissionDecision === undefined, ran.stdout);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — command shape` : `\n  all ${total} passed — command shape`);
process.exit(failed ? 1 : 0);
