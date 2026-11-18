import { PLUGIN } from "../../../helpers/harness.mjs";
// `presence` — whether the developer is here, away or watching, read from their words first and from silence after (041 N009),
// the commands that set it, the prompt hook that hears it, and the handover line that binds nothing.
import { mkdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { workspace } from "../../../helpers/fixture.mjs";
import { cli } from "../../../helpers/workstream-fixture.mjs";
import { WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { clockLine, insideUsualHours, nextState, presenceWords, readDeveloper, readPresence, staysInWindow } from "../../../../src/scripts/lib/presence.ts";
import { readWindow } from "../../../../src/scripts/lib/window.ts";
import { bindingsOf, hearDeveloper, sessionName, withoutDoNotTouch } from "../../../../src/scripts/events/prompt.ts";
import { checkWelcome } from "../../../../src/scripts/events/stop.ts";
import { welcome } from "../../../../src/scripts/events/orientation.ts";

let n = 0, failed = 0;
const check = (label, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${String(detail).slice(0, 400)}`}`); };
const at = (stamp) => Date.parse(stamp);
const DEVELOPER = { timezone: "Asia/Kolkata", usualHours: { from: "10:30", to: "04:00" } };
const state = (extra = {}) => JSON.stringify({ workspace: { name: "w" }, workstreams: { lastNumber: 1 }, developer: DEVELOPER, ...extra }, null, 2) + "\n";
const stamp = (root, session, when) => {
  const file = join(root, ".spndevex", ".debug", "sessions", session, "prompt.at");
  mkdirSync(join(file, ".."), { recursive: true }); writeFileSync(file, "x");
  utimesSync(file, at(when) / 1000, at(when) / 1000);
};
const stateOf = (root) => JSON.parse(readFileSync(join(root, ".spndevex", "state.json"), "utf8"));

console.log("=== presence — the developer's words");
check("words: 'going to sleep' sets AWAY", presenceWords("ok, going to sleep now") === "AWAY");
check("words: \"I'm going now\" sets AWAY", presenceWords("I'm going now") === "AWAY");
check("words: 'back tomorrow' sets AWAY", presenceWords("back tomorrow") === "AWAY");
check("words: 'watching from my phone' sets WATCHING", presenceWords("I am watching from my phone") === "WATCHING");
check("words: 'on remote control' sets WATCHING", presenceWords("on remote control, so no new window") === "WATCHING");
check("words: 'back at my desk' sets PRESENT", presenceWords("back at my desk") === "PRESENT");
check("words: an ordinary message sets nothing", presenceWords("please add the row") === null);
check("words: the word away inside a sentence about code sets nothing", presenceWords("take that away from the page and rename it") === null);
check("words: any message without words flips AWAY back to PRESENT", nextState("AWAY", "morning, where are we?") === "PRESENT");
check("words: and keeps WATCHING until words say otherwise", nextState("WATCHING", "carry on") === "WATCHING" && nextState("WATCHING", "I'm here") === "PRESENT");
check("words: 'stay' keeps the window", staysInWindow("stay") && staysInWindow("stay in this window") && !staysInWindow("a stay of execution"));

console.log("\n=== presence — read: said first, then silence, and watching only by words");
const developerRoot = (name, node) => workspace(name, { ".spndevex/state.json": state(node ? { presence: node } : {}) });
{
  const root = developerRoot("presence-silence");
  stamp(root, "w1", "2026-11-18T14:00:00+05:30");
  const read = (now) => readPresence(root, at(now));
  check("silence: 3 hours inside the usual hours is not yet away (2 h 59)", read("2026-11-18T16:59:00+05:30").state === "PRESENT");
  check("silence: 3 hours inside the usual hours reads away", read("2026-11-18T17:00:00+05:30").state === "AWAY" && read("2026-11-18T17:00:00+05:30").how === "silence");
  stamp(root, "w1", "2026-11-18T01:00:00+05:30");
  check("silence: 30 minutes outside the usual hours: 25 minutes is not yet away (05:00 is outside 04:00 to 10:30)", (() => { stamp(root, "w1", "2026-11-18T05:00:00+05:30"); return read("2026-11-18T05:25:00+05:30").state === "PRESENT"; })());
  check("silence: 30 minutes outside the usual hours reads away", read("2026-11-18T05:30:00+05:30").state === "AWAY");
  check("silence: the same 30 minutes inside the usual hours is still present (02:00 is inside 10:30 to 04:00)", (() => { stamp(root, "w1", "2026-11-18T02:00:00+05:30"); return read("2026-11-18T02:30:00+05:30").state === "PRESENT"; })());
  check("silence: usual hours that cross midnight hold 23:00 and 03:59, and not 04:00 or 10:29",
    insideUsualHours(at("2026-11-18T23:00:00+05:30"), readDeveloper(root)) && insideUsualHours(at("2026-11-18T03:59:00+05:30"), readDeveloper(root))
    && !insideUsualHours(at("2026-11-18T04:00:00+05:30"), readDeveloper(root)) && !insideUsualHours(at("2026-11-18T10:29:00+05:30"), readDeveloper(root)));
  const none = workspace("presence-no-developer", { ".spndevex/state.json": JSON.stringify({ workspace: { name: "w" }, workstreams: { lastNumber: 1 } }) });
  stamp(none, "w1", "2026-11-18T05:00:00+05:30");
  check("silence: with no developer node it always reads inside the usual hours, so 2 hours of silence is not away", readPresence(none, at("2026-11-18T07:00:00+05:30")).state === "PRESENT");
  check("said: AWAY by words holds whatever the silence", (() => { const r = developerRoot("presence-said-away", { state: "AWAY", said: "going to sleep", since: "2026-11-18T23:10+05:30" }); stamp(r, "w1", "2026-11-18T23:11:00+05:30"); const p = readPresence(r, at("2026-11-18T23:12:00+05:30")); return p.state === "AWAY" && p.how === "said" && p.said === "going to sleep"; })());
  check("watching: WATCHING by words holds through any silence and is never read from silence", (() => { const r = developerRoot("presence-watching", { state: "WATCHING", said: "on remote control", since: "2026-11-18T10:00+05:30" }); stamp(r, "w1", "2026-11-17T01:00:00+05:30"); return readPresence(r, at("2026-11-18T23:00:00+05:30")).state === "WATCHING"; })());
  check("watching: a long silence with no words reads AWAY, never WATCHING", read("2026-11-19T20:00:00+05:30").state === "AWAY");
  check("read: with no message recorded the developer reads present", readPresence(developerRoot("presence-no-stamp"), at("2026-11-18T23:00:00+05:30")).state === "PRESENT");
}

console.log("\n=== presence — the clock line, by the hour");
{
  const root = developerRoot("presence-clock");
  const line = (when) => clockLine(root, "Dhruv", at(when))?.line;
  check("clock: 02:00 is a late one, naming the hour", line("2026-11-18T02:00:00+05:30") === "It's 2 a.m. for you, a late one.");
  check("clock: 00:30 reads as 12 a.m.", line("2026-11-18T00:30:00+05:30") === "It's 12 a.m. for you, a late one.");
  check("clock: 04:59 is still a late one and 05:00 is morning", /late one/.test(line("2026-11-18T04:59:00+05:30")) && line("2026-11-18T05:00:00+05:30") === "Morning, Dhruv.");
  check("clock: 11:00 is Morning", line("2026-11-18T11:00:00+05:30") === "Morning, Dhruv.");
  check("clock: 12:00 is Afternoon and 17:59 too", line("2026-11-18T12:00:00+05:30") === "Afternoon, Dhruv." && line("2026-11-18T17:59:00+05:30") === "Afternoon, Dhruv.");
  check("clock: 18:00 is Evening", line("2026-11-18T18:00:00+05:30") === "Evening, Dhruv.");
  check("clock: no name drops the name and keeps the greeting", clockLine(root, null, at("2026-11-18T11:00:00+05:30"))?.line === "Morning.");
  stamp(root, "w1", "2026-11-18T05:40:00+05:30");
  const back = clockLine(root, "Dhruv", at("2026-11-18T12:00:00+05:30"));
  check("clock: a gap of 6 hours since the last message welcomes the developer back with the time they left, and the catch-up follows", back?.line === "Welcome back. You've been away since 05:40." && back.catchUp === true, JSON.stringify(back));
  check("clock: 5 hours 59 is not a night away", clockLine(root, "Dhruv", at("2026-11-18T11:39:00+05:30"))?.catchUp === false);
  check("clock: a workspace with no developer node has no clock line", clockLine(workspace("presence-clock-none", { ".spndevex/state.json": "{}" }), "Dhruv", at("2026-11-18T02:00:00+05:30")) === null);
}

console.log("\n=== presence — the welcome check keeps its fixed lines and allows the clock line");
{
  const lines = welcome("Dhruv", false).join("\n");
  const status = "1 repo · 2 workstreams open";
  check("welcome check: the whole welcome, the status line and the clock line under it is let through", checkWelcome(`${lines}\n\n${status}\n\nIt's 2 a.m. for you, a late one.\n\nThe answer.`, "whole").length === 0);
  check("welcome check: the clock line does not stand in for a fixed line: a welcome missing the roles line is still sent back", checkWelcome(`${lines.split("\n").slice(0, -1).join("\n")}\n\n${status}\n\nIt's 2 a.m. for you, a late one.`, "whole").length === 1);
}

console.log("\n=== presence — the commands");
{
  const root = developerRoot("presence-commands");
  const shown = cli(root, ["presence", "show"]);
  check("command: `presence show` prints the state, how it was decided and the developer's local time", shown.code === 0 && /^presence\s+PRESENT/m.test(shown.out) && /local time\s+\d\d:\d\d/.test(shown.out), shown.out);
  const away = cli(root, ["presence", "away", "--said", "going to sleep"]);
  check("command: `presence away --said` writes AWAY with the words, since now", away.code === 0 && stateOf(root).presence.state === "AWAY" && stateOf(root).presence.said === "going to sleep" && /^\d{4}-\d\d-\d\dT\d\d:\d\d[+-]\d\d:\d\d$/.test(stateOf(root).presence.since), JSON.stringify(stateOf(root).presence));
  check("command: it keeps the other nodes, the developer's included, as they were", JSON.stringify(stateOf(root).developer) === JSON.stringify(DEVELOPER) && stateOf(root).workstreams.lastNumber === 1);
  check("command: `presence show` reads it back as said", /^presence\s+AWAY/m.test(cli(root, ["presence", "show"]).out) && /decided\s+said/.test(cli(root, ["presence", "show"]).out));
  check("command: `presence show --json` is data", JSON.parse(cli(root, ["presence", "show", "--json"]).out).state === "AWAY");
  check("command: `presence watching` writes WATCHING", cli(root, ["presence", "watching", "--said", "on remote control"]).code === 0 && stateOf(root).presence.state === "WATCHING");
  check("command: `presence present` writes PRESENT", cli(root, ["presence", "present"]).code === 0 && stateOf(root).presence.state === "PRESENT" && stateOf(root).presence.said === null);
  const noFile = workspace("presence-commands-nofile", {});
  const refused = cli(noFile, ["presence", "away"]);
  check("command: with no state file the plugin starts none, and says so", refused.code === 2 && /spnutils makes it/.test(refused.out), refused.out);
  check("command: an option it does not take is refused", cli(root, ["presence", "away", "--force"]).code === 2);
}

console.log("\n=== presence — the prompt hook hears the developer");
{
  const root = developerRoot("presence-prompt");
  hearDeveloper(root, "p1", "ok, going to sleep");
  check("prompt: the developer's words set AWAY with what they said", stateOf(root).presence.state === "AWAY" && stateOf(root).presence.said === "ok, going to sleep", JSON.stringify(stateOf(root).presence));
  hearDeveloper(root, "p1", "good morning, where are we?");
  check("prompt: a message without such words flips AWAY back to PRESENT", stateOf(root).presence.state === "PRESENT");
  hearDeveloper(root, "p1", "I'm watching from my phone");
  hearDeveloper(root, "p1", "carry on with the next row");
  check("prompt: WATCHING holds through an ordinary message", stateOf(root).presence.state === "WATCHING");
  hearDeveloper(root, "p1", "back at my desk");
  check("prompt: and 'back at my desk' ends it", stateOf(root).presence.state === "PRESENT");
  check("prompt: every message is stamped, so the last message is read from the window's folder and not from the node", readPresence(root).lastMessageAt !== null && !("lastPromptAt" in stateOf(root).presence));
  hearDeveloper(root, "p1", "stay in this window");
  check("prompt: 'stay' is kept in the window's own note", readWindow(root, "p1").stay === true && readWindow(root, "other").stay === undefined);
  const noState = workspace("presence-prompt-nofile", {});
  hearDeveloper(noState, "p1", "going to sleep");
  check("prompt: with no state file the words set nothing and the hook does not fail", true);
}

console.log("\n=== presence — a handover's do-not-touch line binds nothing");
{
  const A = "041-improvements", B = "028-figma-library";
  const root = workspace("presence-binding", {
    [`.spndevex/${WORKSTREAMS}/open/${A}/arcs/N009/state.json`]: JSON.stringify({ arc: "N009", subject: "clock" }),
    [`.spndevex/${WORKSTREAMS}/open/${B}/arcs/N017/state.json`]: JSON.stringify({ arc: "N017", subject: "release" }),
  });
  const handover = (touch) => ["Pick this up.", "", "```text", `continue:     open ${A}, N009`, "model:        Opus 5.5", "pins:         none", `do not touch: ${touch}`, "open:         none", "```"].join("\n");
  const names = (prompt) => bindingsOf(prompt, root, "s1").map((bound) => bound.name);
  check("binding: a handover that names a workstream only under do not touch binds the window to the one it continues", JSON.stringify(names(handover(`${B} N017, which another window is on`))) === JSON.stringify([A]), JSON.stringify(names(handover(`${B} N017`))));
  const unnamed = ["Pick this up.", "", "continue:     the clock arc", "model:        Opus 5.5", `do not touch: ${B} N017, which another window is on`, "open:         none"].join("\n");
  check("binding: a handover whose continue line names no folder is not bound to the workstream its do not touch line names", names(unnamed).length === 0, JSON.stringify(names(unnamed)));
  const wrapped = ["Hand over.", `do not touch: nothing in the support repository,`, `              and not ${B} N017 row 2`, `open:         none`].join("\n");
  check("binding: the continuation lines under do not touch name none either", !names(wrapped).includes(B), JSON.stringify(names(wrapped)));
  check("binding: the same name outside a do-not-touch line still binds when it is the only one", JSON.stringify(names(`please look at ${B}`)) === JSON.stringify([B]));
  check("binding: the session is not named for a workstream that only a do-not-touch line holds", sessionName(`do not touch: ${B}\nopen: none`, root) === null);
  check("binding: withoutDoNotTouch drops the label's line and its indented continuation, and nothing after", withoutDoNotTouch("a\ndo not touch: x\n    y\nopen: z") === "a\nopen: z");
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
