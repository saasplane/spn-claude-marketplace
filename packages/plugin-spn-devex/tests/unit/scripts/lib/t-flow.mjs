// `lib/flow.ts` — a flow file read against the specs it names (05-artifacts.md § A flow file orders a flow's pages).
// Each finding the chapter names is proven twice: a file that holds it is named, and the clean file is not.
import { readFlow } from "../../../../src/scripts/lib/flow.ts";

let n = 0, failed = 0;
function one(name, got, want) {
  n += 1;
  let ok = false;
  try { ok = typeof want === "function" ? want(got) : got === want; } catch { ok = false; }
  if (!ok) { failed += 1; console.log(`  FAIL  ${name}\n        got: ${JSON.stringify(got).slice(0, 300)}`); }
  else console.log(`  PASS  ${name}`);
}
const none = (got) => Array.isArray(got) && got.length === 0;
const says = (s) => (got) => JSON.stringify(got).includes(s);

const frame = { rows: [{ items: [{ text: "x" }] }] };
const SPECS = {
  "members.dg.json": { kind: "skeleton", views: [{ viewport: "DESKTOP", frame }, { viewport: "DESKTOP", state: "EMPTY", frame }] },
  "invite.dg.json": { kind: "skeleton", views: [{ viewport: "DESKTOP", frame }, { viewport: "DESKTOP", state: "FAILED", frame }] },
  "broken.dg.json": "not valid JSON — Unexpected token",
  "map.dg.json": { kind: "map", boxes: [] },
};
const specOf = (spec) => (spec in SPECS ? SPECS[spec] : null);
const INVITE = { flow: "Invite a member", pages: [
  { page: "members", spec: "members.dg.json", moves: [{ on: "Invite a member", to: "invite" }] },
  { page: "invite", spec: "invite.dg.json", moves: [
    { on: "Send invite", to: "members" }, { on: "Send invite", to: "invite", state: "FAILED" }, { on: "Done", to: "end" }] }] };
const withPages = (pages) => ({ flow: "Invite a member", pages });

console.log("=== a flow file is read against its specs");
one("the chapter's own example reads clean", readFlow(INVITE, specOf), none);
one("a `to` that names no page of the file is a finding",
  readFlow(withPages([{ ...INVITE.pages[0], moves: [{ on: "Invite a member", to: "invitee" }] }, INVITE.pages[1]]), specOf), says("`invitee`, which is no page of the file"));
one("a page no move of another page reaches is a finding; its own move back to itself does not reach it",
  readFlow(withPages([{ ...INVITE.pages[0], moves: [] }, INVITE.pages[1]]), specOf), says("no move of another page leads to `invite`"));
one("the first page needs no move to reach it", readFlow(withPages([INVITE.pages[0], INVITE.pages[1]]), specOf), none);
one("a `spec` that is not there is a finding",
  readFlow(withPages([{ ...INVITE.pages[0], spec: "gone.dg.json" }, INVITE.pages[1]]), specOf), says("`gone.dg.json` is not there"));
one("a spec that does not parse is named with why",
  readFlow(withPages([{ ...INVITE.pages[0], spec: "broken.dg.json" }, INVITE.pages[1]]), specOf), says("is not valid JSON"));
one("a spec that is no skeleton is a finding",
  readFlow(withPages([{ ...INVITE.pages[0], spec: "map.dg.json" }, INVITE.pages[1]]), specOf), says("is no skeleton"));
one("a `state` the page's spec does not draw is a finding",
  readFlow(withPages([{ ...INVITE.pages[0], moves: [{ on: "Invite a member", to: "invite", state: "DENIED" }] }, INVITE.pages[1]]), specOf), says("draws no view in that state"));
one("a `state` that is no value of `DSTaskStateType` is a finding",
  readFlow(withPages([{ ...INVITE.pages[0], moves: [{ on: "Invite a member", to: "invite", state: "LOADING" }] }, INVITE.pages[1]]), specOf), says("`LOADING`"));
one("a move to `end` takes no state", readFlow(withPages([INVITE.pages[0], { ...INVITE.pages[1], moves: [{ on: "Done", to: "end", state: "DONE" }, { on: "Back", to: "members" }] }]), specOf),
  says("the end of a flow is no view"));
one("two pages of one word are a finding", readFlow(withPages([INVITE.pages[0], INVITE.pages[1], INVITE.pages[1]]), specOf), says("two pages are `invite`"));
one("a field the file has no place for is named", readFlow({ ...INVITE, title: "x" }, specOf), says("`title` is no field of a flow file"));
one("a file with no pages is a finding", readFlow({ flow: "x", pages: [] }, specOf), says("lists none"));
one("a file that is no object is a finding", readFlow([], specOf), says("one object"));

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
