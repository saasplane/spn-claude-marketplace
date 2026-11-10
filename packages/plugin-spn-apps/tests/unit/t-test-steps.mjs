// The setup steps a partner's agent writes tests from (`MKT.SKILLS.28`), held to what they promise:
// they carry no `DMO_` setting and no platform host, because a partner's stack is not the sample
// platform's, and a step that named either would write another platform's setup into theirs.
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

const STEPS = resolve(PLUGIN, "src", "providers", "ts", "skills", "implement", "steps", "test.md");
const text = readFileSync(STEPS, "utf8");

// A platform host is a name under `localhost`, or a URL, or a host with a port: what a stack serves on.
const DMO_SETTING = /\bDMO_[A-Z0-9_]+/g;
const PLATFORM_HOST = /\bhttps?:\/\/\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.localhost\b|\blocalhost:\d+\b|\b[a-z0-9-]+\.saasplane\.[a-z]+\b/gi;

console.log("=== MKT.SKILLS.28 the setup steps name no platform of their own");

ok("[MKT.SKILLS.28] the steps file is read and holds the partner's setup section", text.includes("## A partner's setup"), STEPS);
ok("[MKT.SKILLS.28] the steps name no DMO_ setting", !DMO_SETTING.test(text), (text.match(DMO_SETTING) ?? []).join(", "));
ok("[MKT.SKILLS.28] the steps name no platform host", !PLATFORM_HOST.test(text), (text.match(PLATFORM_HOST) ?? []).join(", "));

// The proof of a check: it must refuse what it is meant to refuse.
ok("the setting pattern refuses a DMO_ setting", /\bDMO_[A-Z0-9_]+/.test("set DMO_IAM_EDGE_TYPE first"));
ok("the host pattern refuses a localhost name and a URL",
   /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.localhost\b/i.test("hub.dmo.localhost") && /\bhttps?:\/\/\S+/.test("open https://hub.example.test"));

console.log(failed ? `\n  ${failed} of ${total} FAILED — setup steps` : `\n  all ${total} passed — setup steps`);
process.exit(failed ? 1 : 0);
