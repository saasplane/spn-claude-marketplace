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
    "**A runtime widens the three slots and never adds a fourth** (rule RULE.SUPPORT.CORE.001 · MUST · check:apps-runtime-slots · due:036/N008).",
    "",
    "**A provider enum is named for the side that declares it** (rule RULE.PLATFORM.IAM.005 · MUST · skill:spn-apps/implement).",
    "",
    "| The end of a line | its actions, a badge, or both (rule RULE.SUPPORT.SURFACE.059 · GUIDE) |",
  ].join("\n");
  const { marks, faults } = readMarks(text, "book");
  ok("five parentheses read and none refused", marks.length === 5 && faults.length === 0, JSON.stringify(faults));
  const [stated, checked, due, skill, guide] = marks;
  ok("a sentence wrapped over two lines finds its parenthesis, on the line the parenthesis is on",
    stated.sentence.startsWith("Managing the arcs") && stated.line === 4, `${stated.line} ${stated.sentence}`);
  ok("the heading above a parenthesis is carried", stated.heading === "Arcs and workstreams", stated.heading);
  ok("`short` stands alone and makes the rule stated", stated.params.short === true && classOf(stated.level, stated.params) === "stated");
  ok("`check:` makes the rule checked", checked.params.check === "page-path" && classOf(checked.level, checked.params) === "checked");
  ok("`due:` beside `check:` names the arc that builds it", due.params.due === "036/N008" && holderFaults(due.level, due.params).length === 0);
  ok("`skill:` names a plugin and a skill", skill.params.skill === "spn-apps/implement" && classOf(skill.level, skill.params) === "stated in a skill");
  ok("a table row's parenthesis reads, and GUIDE takes no holder", guide.level === "GUIDE" && classOf(guide.level, guide.params) === "guidance");
}

console.log("\n=== what a writer is told");
{
  const fault = (rest) => { const read = parseFields(rest); return "fault" in read ? read.fault : ""; };
  ok("a key the list does not hold is refused, and the list is named", fault(" · MUST · since:2026").includes("`since` is not a param key"));
  ok("a value with a space is refused", fault(" · MUST · check:two words").includes("one token"));
  ok("`short` with a value is refused", fault(" · MUST · short:yes").includes("takes no value"));
  ok("a key given twice is refused", fault(" · MUST · check:a · check:b").includes("given twice"));
  ok("two ids in one parenthesis are refused, the form a ref cites today", readMarks("**S** (`RULE.A.B.001`, `RULE.A.B.002`)", "ref").faults.length === 1);
  ok("a parenthesis with no level reads, and its fault is the level", holderFaults(null, {})[0].includes("names no level"));
  ok("a MUST that nothing holds is a fault", holderFaults("MUST", {})[0].includes("names what holds it"));
  ok("a guidance rule that names a holder is a fault", holderFaults("GUIDE", { short: true })[0].includes("names no holder"));
  ok("`due:` with no `check:` is a fault", holderFaults("MUST", { short: true, due: "036/N008" }).some((f) => f.includes("comes with `check:`")));
  ok("two holders are a fault", holderFaults("MUST", { short: true, check: "x" }).some((f) => f.includes("one holder")));
}

console.log("\n=== a plugin file's form, and the comparison");
{
  const { marks } = readMarks("**A session is named for the workstream and the arc it works on** (`RULE.DEVEX.WORKSPACE.222`), so the", "ref");
  ok("a ref's parenthesis reads in its own form", marks.length === 1 && marks[0].form === "ref" && marks[0].level === null);
  const drift = compareMarks({ level: "MUST", params: { short: true } }, marks[0]);
  ok("a ref that drops the book's MUST is one finding per field",
    drift.length === 2 && drift[0] === "level: the book says MUST, this says none" && drift[1] === "short: the book says short, this says nothing",
    JSON.stringify(drift));
  ok("the same parenthesis compares clean", compareMarks({ level: "MUST", params: { check: "x" } }, { level: "MUST", params: { check: "x" } }).length === 0);
  ok("a parenthesis is written back in the book's form and a ref's",
    formatMark("RULE.DEVEX.WORKSPACE.243", "MUST", { short: true }, "book") === "(rule RULE.DEVEX.WORKSPACE.243 · MUST · short)" &&
    formatMark("RULE.DEVEX.WORKSPACE.243", "MUST", { short: true }, "ref") === "(`RULE.DEVEX.WORKSPACE.243` · MUST · short)");
  ok("a fenced sample is never read", readMarks("```text\n(rule RULE.A.B.001 · MUST · short)\n```", "book").marks.length === 0);
}

console.log("\n=== the chip");
{
  const chip = chipOf("RULE.DEVEX.AGENT.113", "MUST", { check: "page-path" });
  ok("a checked rule shows MUST and its class, the id as its anchor, the holder on hover",
    chip.label === "MUST · checked" && chip.anchor === "RULE.DEVEX.AGENT.113" && chip.title === "check:page-path", JSON.stringify(chip));
  ok("a guidance rule shows Guidance", chipOf("RULE.SUPPORT.SURFACE.059", "GUIDE", {}).label === "Guidance");
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — rule mark` : `\n  all ${total} passed — rule mark`);
process.exit(failed ? 1 : 0);
