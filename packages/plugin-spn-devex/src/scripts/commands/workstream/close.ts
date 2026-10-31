// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The commands · § The close gate
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream close <workstream>
//
// Runs the close gate, stamps the approach page DONE and moves the folder into `closed/`. A go that `go check` finds
// anything in refuses the close before the gate runs, and a refused close leaves the page and the folder as they were.

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { workstreamsDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { gateClose } from "../../checks/split-plan.ts";
import { goFileOf } from "../../lib/go-plan.ts";
import { approachOf, arcIdsOf, workspaceOf } from "../../lib/workstream.ts";
import { checkGo } from "./go.ts";
import { workstreamNamed } from "./_shared.ts";

export const describe = "close a workstream: run the close gate, stamp the approach page DONE, and move the folder into closed/";
export const usage = "<workstream>";

const refuse = (why: string): number => { console.log(`Refused: ${why}. Nothing was changed.`); return 1; };

/** The page with its masthead status and its header block reading DONE. */
function stamped(text: string): string {
  return text
    .replace(/(<span class="sds-label">Status:<\/span> )<span class="sds-badge sds-status sds-[a-z]+">[^<]*<\/span>/, '$1<span class="sds-badge sds-status sds-done">&#x2705; DONE</span>')
    .replace(/("status":\s*)"[A-Z]+"/, '$1"DONE"');
}

export function run(args: string[]): number {
  const words = readWords(args);
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one workstream.");
  const ws = workstreamNamed(ref);
  const root = workspaceOf();
  if (!root) throw new UsageFault("runs inside a workspace.");
  const held = basename(dirname(ws));
  if (held === "closed") return refuse(`${basename(ws)} is already closed`);

  // Each go is read against its sheets first; the gate then reads the plan again for the parts that have not landed.
  for (const arc of arcIdsOf(ws)) {
    if (!existsSync(goFileOf(ws, arc))) continue;
    if (checkGo([`${basename(ws)}/${arc}`]) !== 0) return refuse(`the go of ${arc} is not whole: \`workstream go write\` derives it again`);
  }

  const page = approachOf(ws);
  const target = `${workstreamsDir(root, "closed")}/${basename(ws)}`;
  const original = page ? readFileSync(page, "utf8") : null;
  if (page && original !== null) writeFileSync(page, stamped(original), "utf8");
  const verdict = gateClose({ tool_name: "Bash", tool_input: { command: `mv '${ws}' '${target}'` }, cwd: root });
  if (verdict?.deny) {
    if (page && original !== null) writeFileSync(page, original, "utf8");
    console.log(verdict.deny);
    return refuse(`the close gate holds ${basename(ws)}`);
  }
  mkdirSync(dirname(target), { recursive: true });
  renameSync(ws, target);
  console.log(`ok · ${basename(ws)} closed · approach page stamped DONE · moved from ${held}/ into closed/`);
  return 0;
}
