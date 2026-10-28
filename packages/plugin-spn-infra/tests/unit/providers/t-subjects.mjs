// The split the refactor is for: a rule stated once, and each cloud's own spellings beside it.
//
// **A RULE THAT IS CLOUD-FREE AND A PATTERN THAT IS NOT.** *A provider string lives only inside a
// cloud entry* is true everywhere. What a region LOOKS LIKE is that cloud's business — `eu-west-1`
// is AWS's spelling, `europe-west1` is Google's, and the two differ by one hyphen. A rule carrying
// both would have to change every time a cloud joins.
//
// **SO THIS SUITE PROVES BOTH HALVES.** Each cloud's own strings are refused, each cloud's
// sanctioned homes are still allowed, and — the case that matters — a region belonging to the
// OTHER cloud is caught too, because a write-time gate cannot know which cloud the estate will
// resolve to and refusing only the declared one would miss the mistake somebody makes while
// moving between them.
import { one, done } from "../../helpers/harness.mjs";
import { pluginSrcDir } from "../../../src/scripts/checks/subjects.ts";
import { join, sep } from "node:path";

const EST = "/tmp/estate/src/spestate.json";

console.log("=== subjects — the rule is shared, the patterns are each cloud's");

// 1 · AWS spellings, refused in a declaration.
one("an AWS region outside a cloud entry", {
  input: { file_path: EST, content: '{"note":"we run in eu-west-1 today"}' },
  expect: "deny", says: "region string" });
one("an AWS instance class outside a profile", {
  input: { file_path: EST, content: '{"note":"db.r6g.large"}' },
  expect: "deny", says: "instance class" });

// 2 · Google spellings, refused by the same rule with the other cloud's patterns.
//     THIS IS THE CASE THE OLD SHAPE COULD NOT PASS: one rule carried AWS patterns alone.
one("a Google region outside a cloud entry", {
  input: { file_path: EST, content: '{"note":"we run in europe-west1 today"}' },
  expect: "deny", says: "region string" });
one("a Google machine type outside a profile", {
  input: { file_path: EST, content: '{"note":"e2-standard-4"}' },
  expect: "deny", says: "instance class" });

// 3 · The two sanctioned homes still hold, for both clouds. A rule that refuses the declaration's
//     own correct use of these words is a rule people turn off.
one("an AWS region inside a cloud entry's region mapping", {
  input: { file_path: EST, content: '{"cloud":{"region":"eu-west-1"}}' },
  expect: "" });
one("a Google region inside a cloud entry's region mapping", {
  input: { file_path: EST, content: '{"cloud":{"region":"europe-west1"}}' },
  expect: "" });
one("an instance class inside a profile's capacity keys", {
  input: { file_path: EST, content: '{"profile":{"database":"db.r6g.large"}}' },
  expect: "" });

// 4 · The subject applies to declarations alone. Ordinary source naming a region is not a
//     declaration binding an estate to a cloud, and refusing it would be a false refusal.
one("a region named in ordinary source", {
  input: { file_path: "/tmp/estate/src/blueprint.ts", content: 'const r = "eu-west-1";' },
  expect: "" });

// 5 · The rendering subject decides on the path alone, so it decides with no text at all — and it
//     is the only subject that can.
one("a write under dist/ with no content at all", {
  input: { file_path: "/tmp/estate/dist/main.js" },
  expect: "deny", says: "under dist/" });

// 6 · `pluginSrcDir` resolves `PROVIDERS` from wherever this file ends up, not only from its own
//     source depth. A fixed `../..` climb answered correctly after bundling only because
//     `scripts/checks` and `dist/events` happen to sit at the same depth under `src/` — a
//     coincidence a future entry at a different depth would break silently (`subjects.ts`'s own
//     comment). These synthetic paths prove the climb-to-named-ancestor approach does not depend
//     on that coincidence.
console.log("\n=== subjects — pluginSrcDir resolves src/ from any depth under scripts/ or dist/");
{
  const cases = [
    ["source depth (scripts/checks)", join(sep, "plugin", "src", "scripts", "checks"), join(sep, "plugin", "src")],
    ["bundled depth (dist/events), same depth as source — the coincidence today relies on",
      join(sep, "plugin", "src", "dist", "events"), join(sep, "plugin", "src")],
    ["a bundle nested deeper than its source (dist/events/sub)",
      join(sep, "plugin", "src", "dist", "events", "sub"), join(sep, "plugin", "src")],
    ["scripts nested deeper than dist ever is (scripts/checks/providers)",
      join(sep, "plugin", "src", "scripts", "checks", "providers"), join(sep, "plugin", "src")],
  ];
  let failed = 0;
  for (const [label, from, want] of cases) {
    const got = pluginSrcDir(from);
    if (got === want) { console.log(`  PASS  ${label}`); }
    else { failed += 1; console.log(`  FAIL  ${label}: got ${got}, wanted ${want}`); }
  }
  if (failed) { console.log(`\n  ${failed} FAILED — pluginSrcDir`); process.exit(1); }
  console.log(`  all ${cases.length} passed — pluginSrcDir`);
}

done("subjects");
