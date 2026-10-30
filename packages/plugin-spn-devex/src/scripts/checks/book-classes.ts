// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § Three classes of rule
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// The book check: every parenthesis in the book reads, names a level, and names a holder that exists.
//
//   called by: checks/doc-check.ts on a write under `spn-foundation/docs/`, and scripts/release-plugins.mjs over the whole book

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { holderFaults, readMarks } from "../../../../plugin-support-lib/src/lib/rule-mark.ts";

/** What a holder may name: the checks and the skills the plugins ship, and the open arcs a `due:` may wait on. */
export type Known = {
  /** Each check's name: a file of a plugin's `scripts/checks/` or `scripts/events/`, without `.ts`. */
  checks: Set<string>;
  /** Each skill as `<plugin>/<skill>`, such as `spn-apps/implement`. */
  skills: Set<string>;
  /** Each open arc as `<workstream>/<arc>`, such as `036/N008`, or null where no workspace state is at hand. */
  openArcs: Set<string> | null;
};

const list = (dir: string): string[] => { try { return readdirSync(dir).sort(); } catch { return []; } };
const isDir = (path: string): boolean => { try { return statSync(path).isDirectory(); } catch { return false; } };

/** The holders the marketplace ships, and the open arcs of the workspace's `.spndevex` where there is one. */
export function knownHolders(marketplace: string, workspace: string | null): Known {
  const checks = new Set<string>(), skills = new Set<string>();
  for (const plugin of list(join(marketplace, "packages")).filter((name) => name.startsWith("plugin-spn-"))) {
    const src = join(marketplace, "packages", plugin, "src");
    for (const folder of ["checks", "events"])
      for (const file of list(join(src, "scripts", folder))) if (file.endsWith(".ts")) checks.add(file.slice(0, -3));
    for (const skill of list(join(src, "skills"))) if (isDir(join(src, "skills", skill))) skills.add(`${plugin.slice("plugin-".length)}/${skill}`);
  }
  let openArcs: Set<string> | null = null;
  const open = workspace === null ? null : workstreamsDir(workspace, "open");
  if (open !== null && isDir(open)) {
    openArcs = new Set();
    for (const folder of list(open)) {
      const number = /^(\d{3})-/.exec(folder)?.[1];
      if (number) for (const arc of list(join(open, folder, "arcs"))) openArcs.add(`${number}/${arc}`);
    }
  }
  return { checks, skills, openArcs };
}

/** Every fault of the parentheses in one book chapter, each with its line, in words a writer can act on. */
export function bookClassFaults(text: string, known: Known): string[] {
  const { marks, faults } = readMarks(text, "book");
  const out = faults.map((one) => `line ${one.line}: ${one.raw} — ${one.fault}`);
  for (const mark of marks) {
    const at = `line ${mark.line}: ${mark.id}`;
    for (const fault of holderFaults(mark.level, mark.params)) out.push(`${at} — ${fault}`);
    const built = mark.params.check !== undefined && known.checks.has(mark.params.check);
    if (mark.params.check && !built && mark.params.due === undefined)
      out.push(`${at} — \`check:${mark.params.check}\` names no check the plugins ship; name one, or add \`due:\` and the arc that builds it`);
    if (built && mark.params.due)
      out.push(`${at} — \`check:${mark.params.check}\` is built, so \`due:${mark.params.due}\` comes off`);
    if (mark.params.skill && !known.skills.has(mark.params.skill))
      out.push(`${at} — \`skill:${mark.params.skill}\` names no skill the plugins ship`);
    if (mark.params.due && known.openArcs && !known.openArcs.has(mark.params.due))
      out.push(`${at} — \`due:${mark.params.due}\` names no open arc, so the check it waits on is built or dropped`);
  }
  return out;
}
