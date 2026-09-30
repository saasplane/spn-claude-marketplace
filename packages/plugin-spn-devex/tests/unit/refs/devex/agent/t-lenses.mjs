// `refs/devex/agent/lenses/` — each lens names the references it judges against beside the book, and
// the folder says the agent decides what the book, the references and the lenses settle (N8 row 2n,
// RD.DEVEX.WORKSPACE.193). A card's options are set against those named sources, so a lens that names
// none leaves the agent to guess which practice decides a design question.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";

const LENSES = join(PLUGIN, "src", "refs", "devex", "agent", "lenses");
const WORKSTREAM = join(PLUGIN, "src", "refs", "devex", "workspace", "workstream.md");
const CARDS = join(PLUGIN, "src", "refs", "devex", "workspace", "docs", "decision-cards.md");

let total = 0, failed = 0;
const check = (label, ok, detail = "") => {
  total += 1;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`);
};

// The line each lens carries, and the named sources the arc row gives four of them.
const JUDGED = /^\*\*Judged against, beside the book:\*\* .+/m;
const NAMED = { "architect.md": /design patterns/i, "trust.md": /OWASP ASVS[\s\S]*NIST (?:SP )?800-63/,
                "infra.md": /twelve-factor[\s\S]*SRE/i, "qa.md": /test design/i };

console.log("=== 2n — each lens names the references it judges against, beside the book");
const files = readdirSync(LENSES).filter((name) => name.endsWith(".md") && name !== "README.md").sort();
for (const name of files) {
  const text = readFileSync(join(LENSES, name), "utf8");
  check(`2n: ${name} carries a "Judged against, beside the book" line`, JUDGED.test(text));
  if (NAMED[name]) check(`2n: ${name} names the sources the arc row gives it`, NAMED[name].test(text.match(JUDGED)?.[0] ?? ""));
}
const readme = readFileSync(join(LENSES, "README.md"), "utf8");
check("2n: the lenses README says the agent decides what the book, the references and the lenses settle",
  /decides what the book, the plugin references and the lenses settle/.test(readme));

console.log("\n=== 2n — the workstream reference and the card grammar carry decide-before-you-ask");
const workstream = readFileSync(WORKSTREAM, "utf8");
check("2n: workstream.md has § A card is only for what the rules leave open", /^## A card is only for what the rules leave open$/m.test(workstream));
check("2n: workstream.md names the three reasons a question reaches the developer",
  /a boundary shifts/.test(workstream) && /information is missing/.test(workstream) && /the choice is people's/.test(workstream));
check("2n: workstream.md says an answer lands in the arc's notes in the same turn",
  /An answer lands in the arc's notes in the same turn — MUST/.test(workstream));
const cards = readFileSync(CARDS, "utf8");
check("2n: decision-cards.md fills a design question as an expert would, with named sources",
  /filled as an expert would fill it/.test(cards) && /OWASP ASVS/.test(cards));
check("2m: decision-cards.md shows a card in full once, then in one line",
  /shown in full once, at the top of the reply that raises it/.test(cards) && !/every open card leads the reply/.test(cards));

console.log(failed ? `\n  ${failed} of ${total} FAILED — lenses` : `\n  all ${total} passed — lenses`);
process.exit(failed ? 1 : 0);
