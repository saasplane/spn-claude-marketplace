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
// EVERY PROVIDER, NOT A NAMED ONE. A test that looked only in `ts/` would be the one place in
// this plugin that names an instance, which is what the provider shape exists to remove.
const PROVIDERS = resolve(import.meta.dirname, "..", "src", "providers");
const CHECKS = readdirSync(PROVIDERS, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => join(PROVIDERS, e.name, "scripts", "checks"));
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
const SUBJECT_FILES = ["src.ts", "tests.ts"];
const rules = CHECKS.flatMap(walk).filter((f) => f.endsWith(".ts") && !SUBJECT_FILES.includes(f.split("/").pop()));
one("every provider holds at least one rule", rules.length >= 6, `${rules.length} found`);
for (const file of rules) {
  const text = readFileSync(file, "utf8");
  const body = bodyOf(text, "export function verdict(");
  if (body === null) continue;                       // not every file beside a subject is a rule
  const name = file.slice(PROVIDERS.length + 1);
  one(`${name}: verdict does not parse`, !body.includes("resultingText("),
      "a rule that assembles its own text is a rule the subject parsed for in vain");
}

// 2 · Each provider validator parses exactly once. More than one call is a rule's parse moved
//     rather than removed; none at all means it is judging text nobody assembled.
const validators = CHECKS.flatMap(walk).filter((f) => SUBJECT_FILES.includes(f.split("/").pop()));
one("every provider ships a subject file for each subject", validators.length === CHECKS.length * SUBJECT_FILES.length, `${validators.length} found`);
for (const file of validators) {
  const text = readFileSync(file, "utf8");
  const calls = (text.match(/resultingText\(/g) ?? []).length;
  one(`${file.slice(PROVIDERS.length + 1)}: parses exactly once`, calls === 1, `${calls} call(s)`);
}

// 3 · The dispatcher reaches rules only through a subject. A direct rule import is how the
//     per-rule parse came back the first time it was removed anywhere.
const dispatcher = readFileSync(join(SCRIPTS, "events", "pretooluse.ts"), "utf8");
one("the dispatcher imports no rule directly",
    !/from "\.\.\/\.\.\/providers\//.test(dispatcher),
    "it must go through checks/subjects.ts");
one("the dispatcher never parses", !dispatcher.includes("resultingText("));

console.log(failed ? `${failed} of ${n} failed` : `all ${n} passed — parse-once`);
process.exit(failed ? 1 : 0);
