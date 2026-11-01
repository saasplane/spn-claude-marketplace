// The rule's parenthesis, read by `../../../src/lib/rule-mark.ts`: the book's form and a plugin file's,
// the faults a writer is told, the class each level and holder makes, and the field-by-field comparison.
// The book sentences below are the ones the book uses for each class.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..");
const { readMarks, parseFields, holderFaults, classOf, formatMark, compareMarks, chipOf } =
  await import(pathToFileURL(resolve(HERE, "src", "lib", "rule-mark.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== the book's form, one class each");
{
  const text = [
    "## Arcs and workstreams",
    "",
    "**Managing the arcs inside a workstream is the agent's, and creating a workstream is always your",
    "decision** (rule RULE.DEVEX.WORKSPACE.243 · MUST · short). It says so in one place.",
    "",
    "**A page is handed over as its whole `file:///` address** (rule RULE.DEVEX.AGENT.113 · MUST · check:page-path).",
    "",
    "**A runtime widens the three slots and never adds a fourth** (rule RULE.SUPPORT.CORE.001 · MUST · skill:spn-apps/implement).",
    "",
    "**A provider enum is named for the side that declares it** (rule RULE.PLATFORM.IAM.005 · MUST · skill:spn-apps/implement).",
    "",
    "**A panel keeps its lenses' rules** (rule RULE.DEVEX.AGENT.200 · MUST · agent:spn-devex/spn-panel).",
    "",
    "| The end of a line | its actions, a badge, or both (rule RULE.SUPPORT.SURFACE.059 · GUIDE) |",
  ].join("\n");
  const { marks, faults } = readMarks(text, "book");
  ok("[MKT.SCRIPTS.197] six parentheses read and none refused", marks.length === 6 && faults.length === 0, JSON.stringify(faults));
  const [stated, checked, core, skill, agent, guide] = marks;
  ok("[MKT.SCRIPTS.197] a sentence wrapped over two lines finds its parenthesis, on the line the parenthesis is on",
    stated.sentence.startsWith("Managing the arcs") && stated.line === 4, `${stated.line} ${stated.sentence}`);
  ok("[MKT.SCRIPTS.197] the heading above a parenthesis is carried", stated.heading === "Arcs and workstreams", stated.heading);
  ok("[MKT.SCRIPTS.197] `short` stands alone and makes the rule stated", stated.params.short === true && classOf(stated.level, stated.params) === "stated");
  ok("[MKT.SCRIPTS.197] `check:` makes the rule checked", checked.params.check === "page-path" && classOf(checked.level, checked.params) === "checked");
  ok("[MKT.SCRIPTS.197] a runtime rule is held by the skill where a module is built", core.params.skill === "spn-apps/implement" && classOf(core.level, core.params) === "stated in a skill");
  ok("[MKT.SCRIPTS.197] `skill:` names a plugin and a skill", skill.params.skill === "spn-apps/implement" && classOf(skill.level, skill.params) === "stated in a skill");
  ok("[MKT.SCRIPTS.325] `agent:` names a plugin and an agent, and the rule is kept by an agent",
    agent.params.agent === "spn-devex/spn-panel" && holderFaults(agent.level, agent.params).length === 0 && classOf(agent.level, agent.params) === "kept by an agent");
  ok("[MKT.SCRIPTS.197] a table row's parenthesis reads, and GUIDE takes no holder", guide.level === "GUIDE" && classOf(guide.level, guide.params) === "guidance");
}

console.log("\n=== what a writer is told");
{
  const fault = (rest) => { const read = parseFields(rest); return "fault" in read ? read.fault : ""; };
  ok("[MKT.SCRIPTS.198] a key the list does not hold is refused, and the list is named", fault(" · MUST · since:2026").includes("`since` is not a param key"));
  ok("[MKT.SCRIPTS.198] a value with a space is refused", fault(" · MUST · check:two words").includes("one token"));
  ok("[MKT.SCRIPTS.198] `short` with a value is refused", fault(" · MUST · short:yes").includes("takes no value"));
  ok("[MKT.SCRIPTS.198] a key given twice is refused", fault(" · MUST · check:a · check:b").includes("given twice"));
  ok("[MKT.SCRIPTS.198] two ids in one parenthesis are refused, the form a ref cites today", readMarks("**S** (`RULE.A.B.001`, `RULE.A.B.002`)", "ref").faults.length === 1);
  ok("[MKT.SCRIPTS.198] a parenthesis with no level reads, and its fault is the level", holderFaults(null, {})[0].includes("names no level"));
  ok("[MKT.SCRIPTS.198] a MUST that nothing holds is a fault", holderFaults("MUST", {})[0].includes("names what holds it"));
  ok("[MKT.SCRIPTS.198] a guidance rule that names a holder is a fault", holderFaults("GUIDE", { short: true })[0].includes("names no holder"));
  ok("[MKT.SCRIPTS.325] a `due:` is an unknown key, as any other, and the list is named without it",
    fault(" · MUST · check:page-path · due:a/b").includes("`due` is not a param key") && fault(" · MUST · due:a/b").endsWith("`check`, `short`, `skill`, `agent`"), fault(" · MUST · due:a/b"));
  ok("[MKT.SCRIPTS.325] an agent holder beside another holder is a fault", holderFaults("MUST", { agent: "spn-devex/spn-panel", check: "x" }).some((f) => f.includes("one holder")));
  ok("[MKT.SCRIPTS.325] a MUST that nothing holds names `agent:` among the holders", holderFaults("MUST", {})[0].includes("`agent:`"));
  ok("[MKT.SCRIPTS.198] two holders are a fault", holderFaults("MUST", { short: true, check: "x" }).some((f) => f.includes("one holder")));
}

console.log("\n=== a plugin file's form, and the comparison");
{
  const { marks } = readMarks("**A session is named for the workstream and the arc it works on** (`RULE.DEVEX.WORKSPACE.222`), so the", "ref");
  ok("[MKT.SCRIPTS.199] a ref's parenthesis reads in its own form", marks.length === 1 && marks[0].form === "ref" && marks[0].level === null);
  const drift = compareMarks({ level: "MUST", params: { short: true } }, marks[0]);
  ok("[MKT.SCRIPTS.200] a ref that drops the book's MUST is one finding per field",
    drift.length === 2 && drift[0] === "level: the book says MUST, this says none" && drift[1] === "short: the book says short, this says nothing",
    JSON.stringify(drift));
  ok("[MKT.SCRIPTS.200] the same parenthesis compares clean", compareMarks({ level: "MUST", params: { check: "x" } }, { level: "MUST", params: { check: "x" } }).length === 0);
  ok("[MKT.SCRIPTS.200] a parenthesis is written back in the book's form and a ref's",
    formatMark("RULE.DEVEX.WORKSPACE.243", "MUST", { short: true }, "book") === "(rule RULE.DEVEX.WORKSPACE.243 · MUST · short)" &&
    formatMark("RULE.DEVEX.WORKSPACE.243", "MUST", { short: true }, "ref") === "(`RULE.DEVEX.WORKSPACE.243` · MUST · short)");
  ok("[MKT.SCRIPTS.197] a fenced sample is never read", readMarks("```text\n(rule RULE.A.B.001 · MUST · short)\n```", "book").marks.length === 0);
}

console.log("\n=== the chip");
{
  const chip = chipOf("RULE.DEVEX.AGENT.113", "MUST", { check: "page-path" });
  ok("[MKT.SCRIPTS.201] a checked rule shows MUST and its class, the id as its anchor, the holder on hover",
    chip.label === "MUST · checked" && chip.anchor === "RULE.DEVEX.AGENT.113" && chip.title === "check:page-path", JSON.stringify(chip));
  ok("[MKT.SCRIPTS.201] a guidance rule shows Guidance", chipOf("RULE.SUPPORT.SURFACE.059", "GUIDE", {}).label === "Guidance");
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — rule mark` : `\n  all ${total} passed — rule mark`);
process.exit(failed ? 1 : 0);
