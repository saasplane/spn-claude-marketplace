// `checks/page-path.ts` — a reply that hands over a page as a bare name, a relative path or a link whose text
// hides the address is sent back for the page's whole `file:///` address, which the developer opens by pasting
// what they see.
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { checkPagePath } = await import(join(CHECKS, "page-path.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const WHOLE = "file:///opt/work/saasplane/code/.spndevex/workstreams/open/036-agent-follows-rules/notes/N006/preview.html";

console.log("=== a page handed over without its whole address");
{
  const bare = checkPagePath("The preview is ready. Open preview.html and tell me what you think.");
  ok("[MKT.HOOKS.119] a bare page name is sent back for its address", bare.length === 1 && bare[0].check === "page-path" && bare[0].message.includes("file:///") && bare[0].message.includes("`preview.html`"), bare[0]?.message);
  const relative = checkPagePath("See notes/N006/preview.html for the arc.");
  ok("[MKT.HOOKS.119] a relative path is sent back", relative.length === 1 && relative[0].message.includes("`notes/N006/preview.html`"), relative[0]?.message);
  const hiding = checkPagePath(`Read [the preview](${WHOLE}) first.`);
  ok("[MKT.HOOKS.119] a link whose text hides the address is sent back", hiding.length === 1 && hiding[0].message.includes("[the preview]"), hiding[0]?.message);
  const hidingRelative = checkPagePath("Read [the page](approach.html) first.");
  ok("[MKT.HOOKS.119] a link to a relative page is sent back once", hidingRelative.length === 1, JSON.stringify(hidingRelative));
}

console.log("\n=== a whole address passes");
{
  ok("[MKT.HOOKS.120] a whole file:/// address on its own passes", checkPagePath(`Open it here:\n\n${WHOLE}`).length === 0);
  ok("[MKT.HOOKS.120] a link whose text is the whole address passes", checkPagePath(`Open [${WHOLE}](${WHOLE}) now.`).length === 0);
  ok("[MKT.HOOKS.120] a reply that names no page passes", checkPagePath("Row done, the checks are green.").length === 0);
  ok("[MKT.HOOKS.120] a file that is not a page passes", checkPagePath("I edited packages/plugin-spn-devex/src/index.ts.").length === 0);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — page path` : `\n  all ${total} passed — page path`);
process.exit(failed ? 1 : 0);
