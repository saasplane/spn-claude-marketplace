// `precedent find` — what is already decided, written or built for a subject: the work's row first, then the matches by kind with file and line
// (MKT.SCRIPTS.516), the shared contract types first for an address region, and exported names only with --code (MKT.SCRIPTS.517).
import { workspace } from "../../../../helpers/fixture.mjs";
import { cli } from "../../../../helpers/workstream-fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const root = workspace("precedent", {
  "spn-support-ts/packages/support-contract-ts/src/contract/states/global/address.ts":
    "/** A postal place. */\nexport interface SPAddress {\n  line: string;\n}\n\n/** A country and a city, and no more. */\nexport interface SPAddressRegion extends SPAddress {\n  city: string;\n}\n",
  "spn-support-ts/packages/support-contract-ts/src/contract/states/global/currency.ts": "/** A currency code. */\nexport type SPCurrencyCodeType = string;\n",
  "spn-platform-ts/packages/module-server-job-ts/src/contract/states/schedule.ts":
    "/**\n * Whether a schedule's configuration is still live.\n *\n * Pause/disable is carried by `isActive`, so there is no separate CANCELLED state.\n */\nexport enum JobScheduleStatusType {\n  PUBLISHED = 'PUBLISHED',\n}\n",
  "spn-claude-marketplace/packages/plugin-spn-apps/src/refs/support/apps/providers/ts/02-naming.md":
    "# Naming\n\n## Booleans\n\n**A boolean reads yes or no, such as `isActive`, and a status enum never stands in for it.**\n",
  "spn-foundation/docs/registers/decisions.md": "| Id | Decision |\n| --- | --- |\n| DEC.SUPPORT.APPS.232 | A boolean that is on or off reads yes or no, such as isActive |\n",
  ".spndevex/workstreams/closed/035-org-shape/questions.jsonl":
    `${JSON.stringify({ id: "q42", title: "A definition's list of org types: keep it a string list or a list of the closed org type enum", state: "answered", answer: { key: "B", words: "make it the enum list", at: "2026-11-03T10:00+05:30" } })}\n`,
});
const find = (...args) => cli(root, ["precedent", "find", ...args], { CLAUDE_CONFIG_DIR: `${root}/none` });
const at = (out, text) => out.indexOf(text);

console.log("=== the row first, then the matches by kind with file and line");
{
  const found = find("job address region active boolean", "--work", "server-contract", "--code");
  ok("[MKT.SCRIPTS.516] the work's row is printed first, with its references resolved to paths", found.code === 0 && found.out.startsWith("work: server-contract") && found.out.includes("02-naming.md"), found.out);
  ok("[MKT.SCRIPTS.516] the matches follow by kind: shared types, exported names, reference statements, then decisions",
    at(found.out, "type (") > 0 && at(found.out, "type (") < at(found.out, "export (") && at(found.out, "export (") < at(found.out, "ref (") && at(found.out, "ref (") < at(found.out, "decision ("), found.out);
  ok("[MKT.SCRIPTS.516] a reference's bold sentence is found with its file and line", /isActive.*02-naming\.md:5/.test(found.out), found.out);
  const card = find("org types enum list", "--work", "card");
  ok("[MKT.SCRIPTS.516] an answered card of a closed workstream is found with its workstream and number", card.out.includes("035/Q42") && card.out.includes("answered B"), card.out);
  const none = find("colour of the footer banner");
  ok("[MKT.SCRIPTS.516] a subject nothing speaks to says so", none.code === 0 && none.out.includes("nothing speaks to"), none.out);
  const bad = find("anything", "--work", "no-such-work");
  ok("[MKT.SCRIPTS.516] red: a kind of work the map does not hold is refused, naming the kinds", bad.code !== 0 && bad.out.includes("server-contract"), bad.out);
}

console.log("\n=== shared types, and exported names only with --code");
{
  const region = find("address region");
  const types = region.out.slice(at(region.out, "type ("), at(region.out, "type (") + 400);
  ok("[MKT.SCRIPTS.517] for \"address region\" the shared type SPAddressRegion is listed first, with its file and line", region.code === 0 && types.indexOf("SPAddressRegion") > 0 && /SPAddressRegion.*address\.ts:7/.test(region.out), region.out);
  ok("[MKT.SCRIPTS.517] without --code no exported name under a module's contract is listed", !find("schedule status").out.includes("JobScheduleStatusType"));
  const code = find("schedule status", "--code");
  ok("[MKT.SCRIPTS.517] with --code the exported name is listed with its file and line", /JobScheduleStatusType.*schedule\.ts:6/.test(code.out), code.out);
  ok("[MKT.SCRIPTS.517] and the comment above a name is part of what it answers to", find("pause disable", "--code").out.includes("JobScheduleStatusType"));
}

console.log("\n=== precedent map: the kinds, or one row resolved");
{
  const map = (...args) => cli(root, ["precedent", "map", ...args], { CLAUDE_CONFIG_DIR: `${root}/none` });
  const all = map();
  ok("[MKT.SCRIPTS.518] with no kind it lists the kinds of work", all.code === 0 && all.out.includes("server-contract") && all.out.includes("preview"), all.out);
  const one = map("server-contract");
  ok("[MKT.SCRIPTS.518] with a kind it prints the row, its references resolved to a path", one.code === 0 && one.out.startsWith("work: server-contract") && one.out.includes("02-naming.md"), one.out);
  const bad = map("no-such-work");
  ok("[MKT.SCRIPTS.518] red: a kind the map does not hold is refused, naming the kinds", bad.code !== 0 && bad.out.includes("server-contract"), bad.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — precedent find` : `\n  all ${total} passed — precedent find`);
process.exit(failed ? 1 : 0);
