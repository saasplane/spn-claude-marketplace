// THE INVARIANT THE SPLIT BUYS: one parse per subject, not one per rule.
//
// Each rule used to call `resultingText` for itself, so an Edit to one file assembled that file
// from disk once per rule — at write time, which is where a person is waiting.
//
// **THIS IS CHECKED STRUCTURALLY, AND THAT IS THE HONEST WAY HERE.** The verdicts are identical
// whether the parse happens once or six times, so no behaviour test can tell. What CAN regress is
// somebody reaching for `resultingText` inside a rule's `verdict` again, and that is exactly what
// these cases refuse.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const SCRIPTS = resolve(import.meta.dirname, "..", "src", "scripts");
let n = 0, failed = 0;
const one = (title, ok, detail = "") => {
  n += 1;
  if (!ok) { failed += 1; console.log(`  FAIL ${title}${detail ? ` — ${detail}` : ""}`); }
};

const walk = (dir) => readdirSync(dir).flatMap((entry) => {
  const at = join(dir, entry);
  return statSync(at).isDirectory() ? walk(at) : [at];
});

/** The text of one exported function, from its signature to the closing brace at column zero. */
const bodyOf = (text, signature) => {
  const start = text.indexOf(signature);
  if (start === -1) return null;
  const end = text.indexOf("\n}", start);
  return end === -1 ? null : text.slice(start, end);
};

// 1 · No rule parses. `verdict` receives text that is already assembled.
const rules = walk(join(SCRIPTS, "checks")).filter((f) => f.endsWith(".ts") && !f.endsWith("subjects.ts"));
one("every subject folder holds at least one rule", rules.length >= 6, `${rules.length} found`);
for (const file of rules) {
  const text = readFileSync(file, "utf8");
  const body = bodyOf(text, "export function verdict(");
  if (body === null) continue;                       // not every file in checks/ is a rule
  const name = file.slice(SCRIPTS.length + 1);
  one(`${name}: verdict does not parse`, !body.includes("resultingText("),
      "a rule that assembles its own text is a rule the subject parsed for in vain");
}

// 2 · Each provider validator parses exactly once. More than one call is a rule's parse moved
//     rather than removed; none at all means it is judging text nobody assembled.
const validators = walk(join(SCRIPTS, "providers")).filter((f) => f.endsWith(".ts"));
one("the ts provider ships a validator per subject", validators.length === 3, `${validators.length} found`);
for (const file of validators) {
  const text = readFileSync(file, "utf8");
  const calls = (text.match(/resultingText\(/g) ?? []).length;
  one(`${file.slice(SCRIPTS.length + 1)}: parses exactly once`, calls === 1, `${calls} call(s)`);
}

// 3 · The dispatcher reaches rules only through a subject. A direct rule import is how the
//     per-rule parse came back the first time it was removed anywhere.
const dispatcher = readFileSync(join(SCRIPTS, "events", "pretooluse.ts"), "utf8");
one("the dispatcher imports no rule directly",
    !/from "\.\.\/checks\/(contract|src|tests)\//.test(dispatcher),
    "it must go through checks/subjects.ts");
one("the dispatcher never parses", !dispatcher.includes("resultingText("));

console.log(failed ? `${failed} of ${n} failed` : `all ${n} passed — parse-once`);
process.exit(failed ? 1 : 0);
