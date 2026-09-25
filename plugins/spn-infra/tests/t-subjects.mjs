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
import { one, done } from "./harness.mjs";

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

done("subjects");
