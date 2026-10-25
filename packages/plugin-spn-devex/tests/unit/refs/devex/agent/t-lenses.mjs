// `refs/devex/agent/lenses/` — every lens file takes the construct's one shape, in its order
// (RD.DEVEX.AGENT.097), carries its share of the SaaS Plane way by number (RD.DEVEX.AGENT.095), owns at
// least one kind of ask in the router (RD.DEVEX.AGENT.098), and stays short enough to be read whole for
// one task (RD.DEVEX.AGENT.102). A file that drifts from the shape leaves the agent unable to tell whose
// work a lens serves or what it does at a stage, and a file that grows past its limit crowds the one
// task it was loaded for.
//
// The folder also says the agent decides what the book, the references and the lenses settle
// (N8 row 2n, RD.DEVEX.WORKSPACE.193), and each lens names the outside sources it is fluent in, so a
// card's options are set against a named practice rather than an opinion.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";

const AGENT = join(PLUGIN, "src", "refs", "devex", "agent");
const LENSES = join(AGENT, "lenses");
const WAY = join(AGENT, "way.md");
const PANEL = join(PLUGIN, "src", "agents", "spn-panel.md");
const WORKSTREAM = join(PLUGIN, "src", "refs", "devex", "workspace", "workstream.md");
const CARDS = join(PLUGIN, "src", "refs", "devex", "workspace", "docs", "decision-cards.md");

let total = 0, failed = 0;
const check = (label, ok, detail = "") => {
  total += 1;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`);
};

/** A file's text with its `spn:restates` block taken off: the part a reader loads. */
const body = (text) => text.replace(/<!--\s*spn:restates[\s\S]*?-->\s*/, "");
/** `SERVER_DEV` is `server-dev.md`. */
const fileOf = (lens) => `${lens.toLowerCase().replace(/_/g, "-")}.md`;

// THE SHAPE, IN ITS ORDER. The header lines first, then the sections.
const HEADER = [/^# Lens — `([A-Z_]+)` \((.+)\)$/m, /^\*\*Consumer first:\*\* /m, /^\*\*Persona:\*\* /m, /\*\*Carries:\*\* the SaaS Plane way [\d ·]+ \(`refs\/devex\/agent\/way\.md`\)/,
                /^\*\*Worn\*\* /m, /^\*\*Source of truth:\*\* /m];
const SECTIONS = ["Asks it owns", "Mastery", "Industry bridge", "Mentoring", "Behaviour", "Blind spots", "By stage",
                  "Produces to", "Gates", "Sweeps", "Improves the book"];
const BLOCKING = new Set(["QA", "TRUST", "PARTNER", "ARCHITECT", "VOICE"]);
const LIMIT = 150;

const files = readdirSync(LENSES).filter((name) => name.endsWith(".md") && name !== "README.md").sort();
const way = readFileSync(WAY, "utf8");
const owners = [...way.matchAll(/^- .+ → `([A-Z_]+)`$/gm)].map((found) => found[1]);
const carried = new Map();

console.log("=== every lens file takes the construct's one shape, in its order");
for (const name of files) {
  const text = body(readFileSync(join(LENSES, name), "utf8"));
  const heading = text.match(HEADER[0]);
  const lens = heading?.[1] ?? "?";
  check(`${name}: the heading names its value and its real-world title`, heading !== null && fileOf(lens) === name);
  const at = HEADER.map((pattern) => text.search(pattern));
  check(`${name}: title, consumer first, persona, carries, worn and source of truth stand in that order`,
    at.every((position, index) => position >= 0 && (index === 0 || position > at[index - 1])), `positions ${at.join(", ")}`);
  const sections = [...text.matchAll(/^## (.+)$/gm)].map((found) => found[1]);
  check(`${name}: its sections are the shape's, in order`, JSON.stringify(sections) === JSON.stringify(SECTIONS),
    `got ${sections.join(" · ")}`);
  const lines = text.trimEnd().split("\n").length;
  check(`${name}: read whole for one task, it stays within ${LIMIT} lines (${lines})`, lines <= LIMIT);
  const numbers = (text.match(/\*\*Carries:\*\* the SaaS Plane way ([\d ·]+)/)?.[1] ?? "").split("·").map((n) => Number(n.trim())).filter(Boolean);
  check(`${name}: it carries principles of the way by number, each one the way has`,
    numbers.length > 0 && numbers.every((n) => n >= 1 && n <= 17), `carries ${numbers.join(", ")}`);
  for (const n of numbers) carried.set(n, [...(carried.get(n) ?? []), lens]);
  const blocks = /^\*\*Worn\*\*.*\*\*Blocks:\*\*/m.test(text);
  check(`${name}: it ${BLOCKING.has(lens) ? "names its one block" : "advises and never blocks"}`,
    BLOCKING.has(lens) ? blocks : !blocks && /\*\*Advises — never blocks/.test(text));
  check(`${name}: it owns at least one kind of ask in the router`, owners.includes(lens));
  check(`${name}: its mentoring speaks to a junior, a mid-level and a senior developer`, /^\| Junior \| Mid-level \| Senior \|$/m.test(text));
  check(`${name}: by stage names the decisions it thinks hard about`, /^\*\*Thinks hard before:\*\* /m.test(text));
}

console.log("\n=== the roster, the router and the way hold together");
check("every owner the router names has a lens file, and every lens file is an owner",
  owners.length > 0 && [...new Set(owners)].every((lens) => files.includes(fileOf(lens))) && files.every((name) => owners.some((lens) => fileOf(lens) === name)),
  `owners ${[...new Set(owners)].join(" ")} · files ${files.join(" ")}`);
const thin = [...Array(17).keys()].map((i) => i + 1).filter((n) => (carried.get(n) ?? []).length < 2);
check("every principle of the way is carried by at least two lenses", thin.length === 0, `carried by fewer than two: ${thin.join(", ")}`);
const panel = readFileSync(PANEL, "utf8");
const description = panel.match(/^description: (.+)$/m)?.[1] ?? "";
const unnamed = files.map((name) => name.replace(/\.md$/, "")).filter((lens) => !new RegExp(`\\b${lens}\\b`).test(description));
check("the panel's description names every lens, so it is asked for each", unnamed.length === 0, `not named: ${unnamed.join(", ")}`);
check("the panel names the consumer and the stage first, then speaks as the lens's persona",
  /Name the consumer and the stage first, then speak as the lens's persona/.test(panel));

console.log("\n=== each lens names the outside sources it masters, and a finding lands on the book");
const text = (name) => readFileSync(join(LENSES, name), "utf8");
const mastery = (name) => text(name).split(/^## Mastery$/m)[1]?.split(/^## /m)[0] ?? "";
const NAMED = { "architect.md": [/Design Patterns/, /Domain-Driven Design/], "trust.md": [/OWASP ASVS 5\.0/, /NIST SP 800-63B/],
                "infra.md": [/twelve-factor/i, /SRE/], "qa.md": [/ISTQB/, /test pyramid/i],
                "ux.md": ["Mobbin", "Nielsen Norman Group", "Baymard Institute", "Laws of UX", "Page Flows", "UI-Patterns.com", "AWS Cloudscape",
                          "PatternFly", "Salesforce Lightning", "Atlassian", "Shopify Polaris", "GitHub Primer", "Adobe Spectrum", "Material", "Carbon", "GOV.UK"],
                "ui.md": ["Material 3", "IBM Carbon", "Shopify Polaris", "Mobbin", "W3C Design Tokens"], "marketing.md": ["April Dunford", "Mobbin", "Nielsen Norman Group", "Page Flows"] };
for (const [name, sources] of Object.entries(NAMED)) {
  const missing = sources.filter((source) => !(source instanceof RegExp ? source : new RegExp(source.replace(/[.]/g, "\\."))).test(mastery(name)));
  check(`${name} names its sources in Mastery`, missing.length === 0, `missing: ${missing.join(", ")}`);
}
for (const name of ["ux.md", "ui.md", "marketing.md"])
  check(`${name}: an outside source is consulted live, never copied into the plugin, and a finding is mapped onto the book`,
    /never copied into the plugin/.test(mastery(name)) && /A finding lands mapped onto the book's/.test(mastery(name)));
check("no lens keeps the retired Judged against line", files.every((name) => !/\*\*Judged against, beside the book:\*\*/.test(text(name))));
const readme = readFileSync(join(LENSES, "README.md"), "utf8");
check("2n: the lenses README says the agent decides what the book, the references and the lenses settle",
  /decides what the book, the plugin references and the lenses settle/.test(readme));

console.log("\n=== 2n — the workstream reference and the card grammar carry decide-before-you-ask");
const workstream = readFileSync(WORKSTREAM, "utf8");
check("2n: workstream.md has § A card is only for what the rules leave open", /^## A card is only for what the rules leave open$/m.test(workstream));
check("2n: workstream.md names the three reasons a question reaches the developer",
  /a boundary shifts/.test(workstream) && /information is missing/.test(workstream) && /the choice is people's/.test(workstream));
check("2n: workstream.md says an answer lands in the card and the arc in the same turn, and in a preview only where it shows that card",
  /An answer lands in the card and the arc in the same turn, and in a preview only where the preview\s+shows that card — MUST/.test(workstream));
const cards = readFileSync(CARDS, "utf8");
check("2n: decision-cards.md fills a design question as an expert would, with named sources",
  /filled as an expert would fill it/.test(cards) && /OWASP ASVS/.test(cards));
check("2m: decision-cards.md shows a card in full once, then in one line",
  /shown in full once, at the top of the reply that raises it/.test(cards) && !/every open card leads the reply/.test(cards));

console.log(failed ? `\n  ${failed} of ${total} FAILED — lenses` : `\n  all ${total} passed — lenses`);
process.exit(failed ? 1 : 0);
