// Every `SKILL.md` of the four plugins opens with its frontmatter (RD.DEVEX.AGENT.108). The runtime
// reads frontmatter only at the start of the file, and a plugin skill whose description it cannot
// read stays a typed command that is never offered to the session, so no ask in plain words reaches
// it. The stamp of what a skill restates comes right after the frontmatter. Only this marketplace's
// own plugins are read: a partner's skills are theirs, and tightening them would break them.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../helpers/harness.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** A skill the session is offered: its first line opens the frontmatter, which names a description. */
const offered = (text) => /^---\r?\n[\s\S]*?^description:[ \t]*\S[\s\S]*?^---\r?$/m.test(text) && text.startsWith("---");

const PACKAGES = resolve(PLUGIN, "..");
const skills = readdirSync(PACKAGES)
  .filter((name) => name.startsWith("plugin-spn-"))
  .flatMap((plugin) => {
    const dir = join(PACKAGES, plugin, "src", "skills");
    return existsSync(dir) ? readdirSync(dir).map((skill) => join(dir, skill, "SKILL.md")).filter(existsSync) : [];
  });

console.log("=== a skill opens with its frontmatter, so the session is offered it");
{
  const stampFirst = "<!-- spn:restates\n{\"docs\": []}\n-->\n---\nname: x\ndescription: Do x.\n---\nSteps.\n";
  ok("[MKT.SKILLS.08] known-bad: a skill that opens with its stamp is caught", !offered(stampFirst));
  const frontmatterFirst = "---\nname: x\ndescription: Do x.\n---\n<!-- spn:restates\n{\"docs\": []}\n-->\nSteps.\n";
  ok("[MKT.SKILLS.08] a skill that opens with its frontmatter, the stamp after it, passes", offered(frontmatterFirst));

  const stamped = skills.filter((file) => !offered(readFileSync(file, "utf8")));
  ok("[MKT.SKILLS.08] every SKILL.md of the four plugins opens with frontmatter naming a description", stamped.length === 0,
    `opens with something else: ${stamped.map((file) => file.slice(PACKAGES.length + 1)).join(" · ")}`);
  ok("the case reads every plugin's skills, so it proves something", skills.length >= 23, `read ${skills.length}`);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — frontmatter first` : `\n  all ${total} passed — frontmatter first`);
process.exit(failed ? 1 : 0);
