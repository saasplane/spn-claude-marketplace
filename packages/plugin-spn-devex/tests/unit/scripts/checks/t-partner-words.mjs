// `checks/partner-words.ts` — outside the builder's workspace a reply names what the partner can open. The failing
// replies are shaped on ones that named the book, a rule id of ours or a hook to a partner; the passing ones are the
// partner's own ids, their files, SaaS Plane by name, a code block, and a reply to a prompt that named the book.
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { checkPartnerWords, findPartnerWords } = await import(join(CHECKS, "partner-words.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const root = mkdtempSync(join(tmpdir(), "partner-words-"));
const saved = process.env.SPN_DEVEX_AGENT_WORKSPACE;
const outside = () => { delete process.env.SPN_DEVEX_AGENT_WORKSPACE; };
const inside = () => { process.env.SPN_DEVEX_AGENT_WORKSPACE = root; };
const say = (reply, prompt = "") => checkPartnerWords(reply, root, prompt);

console.log("=== outside the builder's workspace");
outside();
{
  const book = say("The book says a release needs a go, so I held it.");
  ok("[MKT.HOOKS.313] the book by name is sent back, with the partner rules cited",
    book.length === 1 && book[0].check === "partner-words" && book[0].message.includes("RULE.DEVEX.AGENT.160") && book[0].message.includes("The book"), book[0]?.message);
  const id = say("This follows RULE.DEVEX.WORKSPACE.467, so the baseline is mine to take.");
  ok("[MKT.HOOKS.313] a rule id of ours is sent back", id.length === 1 && id[0].message.includes("RULE.DEVEX.WORKSPACE.467"), id[0]?.message);
  const hook = say("The stop hook caught it, and the doc-check skill reads the page.");
  ok("[MKT.HOOKS.313] a hook, a check and a skill by name are sent back", hook.length === 1 && hook[0].message.includes("hook"), hook[0]?.message);
  const clash = say("That conflicts with the rules we keep.");
  ok("[MKT.HOOKS.313] 'conflicts with the rules' is sent back", clash.length === 1 && clash[0].message.includes("conflicts with"), clash[0]?.message);
  const many = findPartnerWords("The book and RULE.DEVEX.AGENT.160 and the plugin and it conflicts with the rules.");
  ok("[MKT.HOOKS.313] the list names one phrase of each kind", many.length === 4, JSON.stringify(many));
}

console.log("\n=== what passes");
{
  ok("[MKT.HOOKS.314] the partner's own rule id passes", say("Your rule RULE.ACME.PAY.012 holds, and MYAPP.PAY.4 too.").length === 0);
  ok("[MKT.HOOKS.314] SaaS Plane by its product name passes", say("SaaS Plane runs your checks on every push, then opens the pull request.").length === 0);
  ok("[MKT.HOOKS.314] the partner's own files and commands pass", say("I edited `src/pay.ts` and ran `spnutils repo agent-sync`.").length === 0);
  ok("[MKT.HOOKS.314] a code block is taken out before the check, so the prose around it is all it reads", say("Here is the line.").length === 0);
  ok("[MKT.HOOKS.314] a reply to a prompt that named the book passes", say("The book says a release needs a go.", "What does the book say about releases?").length === 0);
  ok("[MKT.HOOKS.314] a reply to a prompt that named a rule passes", say("RULE.DEVEX.AGENT.160 asks for the partner's words.", "explain RULE.DEVEX.AGENT.160").length === 0);
  ok("[MKT.HOOKS.314] a reply to a prompt that named a plugin passes", say("The plugin reads it at the start.", "how does the spn-devex plugin start?").length === 0);
}

console.log("\n=== a whole file address and an absolute path pass");
{
  const url = say("Open file:///Users/dev/code/spn-devex/the%20book/01-a.md to see it.");
  ok("[MKT.HOOKS.314] a reply carrying a whole file:/// address passes, even when the path holds a word on the list", url.length === 0, url[0]?.message);
  const path = say("The page is at /Users/dev/code/spn-devex/notes/skills/preview.html now.");
  ok("[MKT.HOOKS.314] an absolute path passes the same way", path.length === 0, path[0]?.message);
  const beside = say("Open file:///Users/dev/a/spn-devex/p.html; the book says so.");
  ok("[MKT.HOOKS.314] words beside the address are still read", beside.length === 1 && beside[0].message.includes("the book"), beside[0]?.message);
}

console.log("\n=== inside the builder's workspace");
inside();
{
  ok("[MKT.HOOKS.313] the same book, rule id and hook pass in the builder's workspace",
    say("The book, RULE.DEVEX.WORKSPACE.467 and the stop hook conflict with the rules.").length === 0);
}

console.log("\n=== the builder test comes from the builder library, not from the session-start source");
{
  const source = readFileSync(join(CHECKS, "partner-words.ts"), "utf8");
  ok("[MKT.HOOKS.326] partner-words imports the builder test from lib/builder.ts", /from "\.\.\/lib\/builder\.ts"/.test(source) && !/events\/orientation/.test(source));
  const bundle = readFileSync(join(CHECKS, "..", "..", "dist", "events", "pretooluse.mjs"), "utf8");
  ok("[MKT.HOOKS.326] the tool-call hook's bundle carries no session-start source", !/SESSION_START_CEILING|The short rules — they hold/.test(bundle));
}

if (saved === undefined) delete process.env.SPN_DEVEX_AGENT_WORKSPACE; else process.env.SPN_DEVEX_AGENT_WORKSPACE = saved;
console.log(failed ? `\n  ${failed} of ${total} FAILED — partner-words` : `\n  all ${total} passed — partner-words`);
process.exit(failed ? 1 : 0);
