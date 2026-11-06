// The ideate skill points only at sections its refs hold, and shows no rule as an id alone (MKT.SKILLS.09). Both faults were in the skill:
// step 6 sent the agent to a section the agent ref did not have, and the generated block held 19 lines that said nothing but an id.
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PLUGIN } from "../../helpers/harness.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const skillFile = resolve(PLUGIN, "src", "skills", "ideate", "SKILL.md");
const text = readFileSync(skillFile, "utf8");

/** The headings of a Markdown file, as plain text. */
const headingsOf = (file) => readFileSync(file, "utf8").split("\n").filter((line) => /^#{1,5}\s/.test(line)).map((line) => line.replace(/^#+\s+/, "").replace(/[*`]/g, "").trim().toLowerCase());

console.log("=== a pointer lands on a section that exists");
{
  const pointers = [...text.matchAll(/`?\[?`?(refs\/[\w./-]+\.md)`?(?:\]\(([^)]+)\))?[^\n§]{0,40}§\s*\*([^*]+)\*/g)].map((found) => ({ ref: found[1], section: found[3].trim().toLowerCase() }));
  ok("[MKT.SKILLS.09] the skill points at a section of a ref at least once", pointers.length > 0, String(pointers.length));
  const missing = pointers.filter((pointer) => {
    const file = resolve(PLUGIN, "src", pointer.ref);
    return !existsSync(file) || !headingsOf(file).includes(pointer.section);
  });
  ok("[MKT.SKILLS.09] every `refs/… § section` pointer lands on a ref that exists and a heading it holds", missing.length === 0, missing.map((one) => `${one.ref} § ${one.section}`).join("; "));
  const links = [...text.matchAll(/\]\((\.\.\/\.\.\/refs\/[\w./-]+\.md)\)/g)].map((found) => resolve(dirname(skillFile), found[1]));
  ok("[MKT.SKILLS.09] every link to a ref goes to a file that exists, the work map among them", links.every(existsSync) && links.some((file) => file.endsWith("work-map.md")), links.filter((file) => !existsSync(file)).join("; "));
}

console.log("\n=== no rule is a line of its id alone");
{
  const idOnly = text.split("\n").filter((line) => /^- \*\*(RULE\.[A-Z_]+\.[A-Z_]+\.\d+)\*\* \(`\1`/.test(line));
  ok("[MKT.SKILLS.09] no line of the rules block shows nothing but the rule's id", idOnly.length === 0, idOnly.slice(0, 3).join("\n"));
  const block = text.indexOf("## The rules this step holds");
  ok("[MKT.SKILLS.09] the rules block follows the last step, after the first proposal's rules and the arc's code step", block > text.indexOf("## Ideating an arc in code") && block > text.indexOf("## How a first proposal is shaped"));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — ideate skill` : `\n  all ${total} passed — ideate skill`);
process.exit(failed ? 1 : 0);
