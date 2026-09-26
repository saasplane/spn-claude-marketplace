import { PLUGIN } from "../../../helpers/harness.mjs";
// `comment-check` — what the code says about itself, read at the moment it is written.
//
// Every case is a pair, and both halves matter. The known-bad half proves the check refuses; the
// untouched half proves it is quiet on prose that is already right — because the fault this check
// can do most damage with is a false refusal. An agent handed one does not argue with it. It
// rewrites the sentence, and the sentence was correct.
//
// So several untouched cases below are VERBATIM from `spn-support-ts/src` and `spn-platform-ts/src`:
// the sentences that an earlier, looser version of each pattern refused. They are named that way,
// with the file they came from, so nobody re-broadens a pattern without meeting them.
//
// There is no Python arm. This check has no incumbent — it never existed under any name, in either
// plugin, though three arc files record it as landed.

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const CHECKS = resolve(PLUGIN, "src", "scripts", "checks");
const FILE = "/repo/packages/module-server-iam-ts/src/app/services/SessionService.ts";

let n = 0;
let failed = 0;

function verdictOf(text) {
  if (!text) return ["silent", ""];
  try {
    const parsed = JSON.parse(text.split("\n").filter(Boolean).at(-1));
    const specific = parsed.hookSpecificOutput ?? {};
    const why = specific.permissionDecisionReason ?? specific.additionalContext ?? parsed.systemMessage ?? "";
    return [specific.permissionDecision === "deny" ? "deny" : "note", why];
  } catch { return ["unparsable", text.slice(0, 200)]; }
}

/**
 * One case: write `source` to `path`, and say what the check must decide.
 *
 * @param label   the FAULT in a reader's words, never the function being called
 * @param expect  "deny" · "note" · "silent"
 * @param says    a phrase the message must carry, so a refusal is checked for being the right one
 */
function one(label, { source, path = FILE, tool = "Write", expect, says }) {
  n += 1;
  const input = tool === "Write" ? { file_path: path, content: source } : { file_path: path, new_string: source };
  let out = "";
  try {
    out = execFileSync("node", [`${CHECKS}/comment-check.ts`],
      { input: JSON.stringify({ tool_name: tool, tool_input: input }), encoding: "utf8" }).trim();
  } catch (error) { out = `ERROR ${String(error.stderr ?? error.message).slice(0, 300)}`; }
  const [verdict, why] = verdictOf(out);
  const saysOk = !says || why.includes(says);
  const ok = verdict === expect && saysOk;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect} · got ${verdict}` +
    `${says ? ` · names "${says}" ${saysOk}` : ""}`);
  if (!ok) console.log(`        it said: ${why.slice(0, 320) || out.slice(0, 320)}`);
}

console.log("\n=== comment-check — finding 1, a history word");

one("a comment saying what the code used to be is refused", {
  expect: "deny", says: "history word",
  source: `
/**
 * The identity's live sessions.
 *
 * This used to be a regular expression guessing at the same fact.
 */
export function sessionsOf(identityId) { return []; }
`});

one("so is one naming where the code moved from", {
  expect: "deny", says: "history word",
  source: `
export function topicOf(listener) {
  // It moved here from the provider's constructor.
  return listener.topic;
}
`});

one("and one saying a thing was formerly called something else", {
  expect: "deny", says: "history word",
  source: `
export function pad(size) {
  // Omit for a padding-less card (formerly DSCardSizeType.NONE).
  return size ?? null;
}
`});

// THE NARROWINGS, EACH ONE A SENTENCE THAT IS ALREADY IN THE TREE AND IS CORRECT.
one("a flag USED TO decide something is present truth, not history", {
  expect: "silent",
  source: `
export function branch(flag) {
  // The flag is used to decide which branch runs, and nothing else reads it.
  return flag ? 1 : 2;
}
`});

one("a RENAMED test changing the answer is present truth too — spn-support-ts/src/contract/states/spsymbols.ts", {
  expect: "silent",
  source: `
/**
 * The citation a proof rests on.
 *
 * Cited by the symbol, never authored — a renamed test changes the answer rather than
 * leaving a claim standing.
 */
export function citationOf(symbol) { return symbol.cite; }
`});

console.log("\n=== comment-check — finding 4, a line comment where a doc comment is required");

one("a published declaration described with // never reaches the symbol index", {
  expect: "deny", says: "doc comment is required",
  source: `
// A user's email lives in its handles; '—' when there is no email handle.
export const userEmail = (user) => user.email ?? '—';
`});

one("the same description as JSDoc is exactly right", {
  expect: "silent",
  source: `
/** A user's email lives in its handles; '—' when there is no email handle. */
export const userEmail = (user) => user.email ?? '—';
`});

// THE THREE SHAPES THAT LOOK LIKE IT AND ARE NOT, each measured in the tree.
one("a section divider over a run of declarations is not a description — spn-platform-ts states/system-provider.ts", {
  expect: "silent",
  source: `
// Email provider configs

/** SendGrid's secret half: the API key, masked before a read leaves the service. */
export interface SPEmailProviderConfigSendGrid { key: string; }
`});

one("a rule of box-drawing characters is a divider, and publishing it would say nothing", {
  expect: "silent",
  source: `
// ── doors ───────────────────────────────────────────────────
export const requireInfraRepo = (runPath) => runPath;
`});

one("a re-export owns no meaning, so the description belongs where the symbol is declared", {
  expect: "silent",
  source: `
// Re-exported from the package root so consumers import the seam from one place.
export type { IDSAddressProvider } from "./_address";
`});

one("a compiler directive is addressed to the compiler, not to a consumer", {
  expect: "silent",
  source: `
// @ts-expect-error - userModule is initialized via initUserModule
export const userModule = {};
`});

console.log("\n=== comment-check — finding 5, a comment that repeats its own line");

one("a comment saying what its own declaration already says costs a reader a line", {
  expect: "deny", says: "repeats its own line",
  source: `
// revoke the sessions
export async function revokeSessions(identityId) { return identityId; }
`});

one("a comment naming the ordering the code cannot show is the one worth keeping", {
  expect: "silent",
  source: `
export async function revokeAllSessions(identityId) {
  // Ordered before the cache purge: a reader between the two calls must never see a
  // session the store has already dropped.
  await revokeByIdentity(identityId);
  await dropByPrefix(identityId);
}
`});

one("a one-word section label is a file's structure, not a restatement", {
  expect: "silent",
  source: `
// Enum
export interface TSNodeEnumMember { key: string; }
`});

one("a comment over a branch names what the condition does not say in words", {
  expect: "silent",
  source: `
export function read(bindings) {
  // named imports
  if (bindings.kind === 'NamedImports') { return bindings.elements; }
  return [];
}
`});

console.log("\n=== comment-check — finding 6, a guess");

one("a hedge published on a declaration reads as a fact to everyone who did not write it", {
  expect: "deny", says: "a guess",
  source: `
/**
 * Drops the identity's cache entries. This probably clears the session cache too.
 */
export function dropCache(identityId) { return identityId; }
`});

one("a writer saying they are not sure is refused in their own voice as well", {
  expect: "deny", says: "a guess",
  source: `
export function dropCache(identityId) {
  // Not sure whether the provider evicts on write; this call is defensive.
  return identityId;
}
`});

// THE TWO LIVE USES THAT ARE NOT HEDGES, and the reason `seems to` and `appears to` are out.
one("a CLI that APPEARS TO HANG describes how it looks to a person — spn-support-ts lock/SPLockProviderDefault.ts", {
  expect: "silent",
  source: `
/**
 * In-memory mutual exclusion for a single process.
 *
 * Expiry is evaluated on read rather than scheduled, because a pending timer per lock
 * keeps the event loop alive and turns a short-lived CLI into one that appears to hang
 * after its work is done.
 */
export class SPLockProviderDefault { }
`});

one("a person with NO IDEA how many tries are left is ordinary English — spn-platform-ts auth/OTPStep.tsx", {
  expect: "silent",
  source: `
export function OTPStep(props) {
  // Rendering only the message left a person retyping a code with no idea how many
  // tries remained.
  return props;
}
`});

console.log("\n=== comment-check — finding 7, a rationale past three sentences (SOFT)");

one("a four-sentence rationale has become a design note, and is reported rather than refused", {
  expect: "note", says: "SOFT",
  source: `
export function purge(keys) {
  // The purge runs in one pass. A second pass would double the lock's hold time. The
  // store's own iterator is stable under deletion, so one pass is safe. Anything else
  // would need a snapshot nobody has asked for.
  return keys;
}
`});

one("three sentences is the line, and three is fine", {
  expect: "silent",
  source: `
export function purge(keys) {
  // The purge runs in one pass. A second pass would double the lock's hold time. The
  // store's own iterator is stable under deletion, so one pass is safe.
  return keys;
}
`});

console.log("\n=== comment-check — where it fires, and where it must not");

one("a test's own known-bad fixture is data, and refusing it would refuse the test that proves the check", {
  expect: "silent", path: "/repo/packages/module-server-iam-ts/tests/unit/session.spec.ts",
  source: `
const bad = "// this used to be a regular expression";
export const fixture = bad;
`});

one("a // inside a string on a source line is a fixture, not a comment", {
  expect: "silent",
  source: `
export const SAMPLE = "// it used to be derived from (mtype, ns)";
`});

one("a generated client is nobody's prose to fix", {
  expect: "silent", path: "/repo/packages/client-platform-api-ts/src/generated/client/client.gen.ts",
  source: `
// TODO: we probably want to return error and improve types
export const client = {};
`});

one("a declaration file carries no source to hold to this standard", {
  expect: "silent", path: "/repo/packages/module-server-iam-ts/src/index.d.ts",
  source: `
// It used to be derived from the namespace.
export declare const x: number;
`});

one("a markdown write is not a source write", {
  expect: "silent", path: "/repo/docs/04-capabilities/README.md",
  source: `
// This used to be a regular expression.
`});

console.log("\n=== comment-check — an Edit is judged on what it adds");

one("the fragment an Edit writes is read, so a history word cannot arrive through new_string", {
  expect: "deny", says: "history word", tool: "Edit",
  source: `  // The topic moved here from the provider's constructor.
  return listener.topic;`});

one("and an Edit that adds nothing to argue with is silent", {
  expect: "silent", tool: "Edit",
  source: `  // Ordered before the cache purge: a reader between the two would see a dropped session.
  return listener.topic;`});

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
