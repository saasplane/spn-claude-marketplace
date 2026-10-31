// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § Three classes of rule
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// The book check: every parenthesis in the book reads, names a level, and names a holder that exists.
//
//   called by: checks/doc-check.ts on a write under `spn-foundation/docs/`, and `docs book check` over the whole book

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { holderFaults, isTestHolder, readMarks } from "../../../../plugin-support-lib/src/lib/rule-mark.ts";
import { TERMINAL } from "./arc-status.ts";

/** What a holder may name: the checks and the skills the plugins ship, and the open arcs a `due:` may wait on. */
export type Known = {
  /** Each check's name: a file of a plugin's `scripts/checks/` or `scripts/events/`, or a stack's, without `.ts`. */
  checks: Set<string>;
  /** Each skill as `<plugin>/<skill>`, such as `spn-apps/implement`. */
  skills: Set<string>;
  /** Each arc of an open workstream that has not landed, carried or dropped, as `<workstream>/<arc>`, such as
   *  `036/N008`; null where no workspace state is at hand. */
  openArcs: Set<string> | null;
};

const list = (dir: string): string[] => { try { return readdirSync(dir).sort(); } catch { return []; } };
const isDir = (path: string): boolean => { try { return statSync(path).isDirectory(); } catch { return false; } };
const statusOf = (stateFile: string): string | null => {
  try { return (JSON.parse(readFileSync(stateFile, "utf8")) as { status?: string }).status ?? null; } catch { return null; }
};

/** The marketplace this check runs from, found from its own file, in source or in a bundle. */
export function ownMarketplace(): string {
  let at = dirname(fileURLToPath(import.meta.url));
  for (; dirname(at) !== at; at = dirname(at)) if (existsSync(join(at, "packages", "plugin-spn-devex"))) return at;
  return at;
}

/** The holders the marketplace ships, and the open arcs of the workspace's `.spndevex` where there is one. */
export function knownHolders(marketplace: string, workspace: string | null): Known {
  const checks = new Set<string>(), skills = new Set<string>();
  // A stack's checks keep their parts in `_<group>/` folders inside `checks/`, and each part is a check of its own.
  const addChecks = (scripts: string): void => {
    for (const folder of ["checks", "events"])
      for (const file of list(join(scripts, folder))) {
        if (file.endsWith(".ts")) checks.add(file.slice(0, -3));
        else if (file.startsWith("_"))
          for (const part of list(join(scripts, folder, file))) if (part.endsWith(".ts")) checks.add(part.slice(0, -3));
      }
  };
  for (const plugin of list(join(marketplace, "packages")).filter((name) => name.startsWith("plugin-spn-"))) {
    const src = join(marketplace, "packages", plugin, "src");
    addChecks(join(src, "scripts"));
    for (const provider of list(join(src, "providers"))) addChecks(join(src, "providers", provider, "scripts"));
    for (const skill of list(join(src, "skills"))) if (isDir(join(src, "skills", skill))) skills.add(`${plugin.slice("plugin-".length)}/${skill}`);
  }
  let openArcs: Set<string> | null = null;
  const open = workspace === null ? null : workstreamsDir(workspace, "open");
  if (open !== null && isDir(open)) {
    openArcs = new Set();
    for (const folder of list(open)) {
      const number = /^(\d{3})-/.exec(folder)?.[1];
      if (!number) continue;
      for (const arc of list(join(open, folder, "arcs")))
        if (!TERMINAL.has(statusOf(join(open, folder, "arcs", arc, "state.json")) ?? "")) openArcs.add(`${number}/${arc}`);
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
    // A `due:` on a check that is built is the arc that teaches it this breach, and it comes off when that arc lands.
    const shipped = mark.params.check !== undefined && (known.checks.has(mark.params.check) || isTestHolder(mark.params.check));
    if (mark.params.check && !shipped && mark.params.due === undefined)
      out.push(`${at} — \`check:${mark.params.check}\` names no check the plugins ship; name one, or add \`due:\` and the arc that builds it`);
    if (mark.params.skill && !known.skills.has(mark.params.skill))
      out.push(`${at} — \`skill:${mark.params.skill}\` names no skill the plugins ship`);
    if (mark.params.due && known.openArcs && !known.openArcs.has(mark.params.due))
      out.push(`${at} — \`due:${mark.params.due}\` names no open arc: the arc landed or was dropped, so the \`due:\` comes off`);
  }
  return out;
}
