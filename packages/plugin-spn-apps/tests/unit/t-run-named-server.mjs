// The run skill's start rule (`MKT.SKILLS.30`), held to what it promises: an app launches from its one
// default env with `--override` for one run, and runs as a second server with `--name` from a worktree,
// with the agent's checks before a named service. A skill that still said "never from a worktree" would
// send the agent back to swapping the demo for every review.
import { PLUGIN } from "../helpers/harness.mjs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const SKILL = process.env.MKT_RUN_SKILL_FILE || resolve(PLUGIN, "src", "skills", "run", "SKILL.md");
const text = readFileSync(SKILL, "utf8");

console.log("=== MKT.SKILLS.30 the run skill starts a worktree's app as a named server with overrides");

ok("[MKT.SKILLS.30] the start rule names --name and --override", text.includes("--name <name>") && text.includes("--override KEY=VALUE"), SKILL);
ok("[MKT.SKILLS.30] the start rule no longer forbids a worktree", !/never from a worktree/.test(text));
ok("[MKT.SKILLS.30] an override sits over the one default env and never sets APP_ENV", text.includes("one default env") && text.includes("`APP_ENV` is never overridden"));
ok("[MKT.SKILLS.30] no secret goes through an override", text.includes("never pass a secret"));
ok("[MKT.SKILLS.30] a named service waits on the three checks", ["`develop`'s", "`--mode API`", "pointed at it by an override"].every((part) => text.includes(part)));
ok("[MKT.SKILLS.30] a named server never migrates", text.includes("refuses `--mode MIGRATE` with `--name`"));
ok("[MKT.SKILLS.30] the developer gets both addresses", text.includes("both addresses"));

// The proof of a check: the worktree pattern refuses the old rule's words.
ok("the worktree pattern refuses the old rule", /never from a worktree/.test("never raw `nx` and never from a worktree"));

console.log(failed ? `\n  ${failed} of ${total} FAILED — run skill` : `\n  all ${total} passed — run skill`);
process.exit(failed ? 1 : 0);
