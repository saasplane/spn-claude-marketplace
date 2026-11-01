// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § Three classes of rule
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// The book check: every parenthesis in the book reads, names a level, and names a holder that exists.
//
//   called by: checks/doc-check.ts on a write under `spn-foundation/docs/`, and `docs book check` over the whole book

import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { holderFaults, isTestHolder, readMarks } from "../../../../plugin-support-lib/src/lib/rule-mark.ts";

/** What a holder may name: the checks, the skills and the agents the plugins ship. */
export type Known = {
  /** Each check's name: a file of a plugin's `scripts/checks/` or `scripts/events/`, or a stack's, without `.ts`. */
  checks: Set<string>;
  /** Each skill as `<plugin>/<skill>`, such as `spn-apps/implement`. */
  skills: Set<string>;
  /** Each agent as `<plugin>/<agent>`, such as `spn-devex/spn-panel`: a file of a plugin's `agents/`, without `.md`. */
  agents: Set<string>;
};

const list = (dir: string): string[] => { try { return readdirSync(dir).sort(); } catch { return []; } };
const isDir = (path: string): boolean => { try { return statSync(path).isDirectory(); } catch { return false; } };

/** The marketplace this check runs from, found from its own file, in source or in a bundle. */
export function ownMarketplace(): string {
  let at = dirname(fileURLToPath(import.meta.url));
  for (; dirname(at) !== at; at = dirname(at)) if (existsSync(join(at, "packages", "plugin-spn-devex"))) return at;
  return at;
}

/** The holders the marketplace ships. It reads no workspace, so the shared book is judged the same everywhere. */
export function knownHolders(marketplace: string): Known {
  const checks = new Set<string>(), skills = new Set<string>(), agents = new Set<string>();
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
    for (const agent of list(join(src, "agents"))) if (agent.endsWith(".md")) agents.add(`${plugin.slice("plugin-".length)}/${agent.slice(0, -3)}`);
  }
  return { checks, skills, agents };
}

/** Every fault of the parentheses in one book chapter, each with its line, in words a writer can act on. */
export function bookClassFaults(text: string, known: Known): string[] {
  const { marks, faults } = readMarks(text, "book");
  const out = faults.map((one) => `line ${one.line}: ${one.raw} — ${one.fault}`);
  for (const mark of marks) {
    const at = `line ${mark.line}: ${mark.id}`;
    for (const fault of holderFaults(mark.level, mark.params)) out.push(`${at} — ${fault}`);
    // A check still to be built holds nothing: a rule names it only in the change that ships it.
    const shipped = mark.params.check !== undefined && (known.checks.has(mark.params.check) || isTestHolder(mark.params.check));
    if (mark.params.check && !shipped)
      out.push(`${at} — \`check:${mark.params.check}\` names no check the plugins ship; a check still to be built holds nothing`);
    if (mark.params.skill && !known.skills.has(mark.params.skill))
      out.push(`${at} — \`skill:${mark.params.skill}\` names no skill the plugins ship`);
    if (mark.params.agent && !known.agents.has(mark.params.agent))
      out.push(`${at} — \`agent:${mark.params.agent}\` names no agent the plugins ship`);
  }
  out.push(...bookNameFaults(text));
  return out;
}

// The shared book names no workstream, arc or window: a reader of it cannot open what such a name points at.
const WORKSTREAM_WITH_ARC = /\b\d{3}\/N\d{3}\b/;
const WORKSTREAM_AND_NUMBER = /\bworkstreams?\s+\d{3}\b/i;
const ARC_NUMBER = /\bN\d{3}\b/;
const TOLD = "told by what happened, never by where";

/** Each line of the book that names a workstream with an arc, the word workstream and a number, or an arc number. */
export function bookNameFaults(text: string): string[] {
  const out: string[] = [];
  text.split("\n").forEach((line, at) => {
    if (WORKSTREAM_WITH_ARC.test(line) || WORKSTREAM_AND_NUMBER.test(line) || ARC_NUMBER.test(line))
      out.push(`line ${at + 1}: the book names a workstream or an arc; an example is ${TOLD}`);
  });
  return out;
}

/** Whether a path is a file of a plugin's source or tests, outside the regenerated refs and the bundle. */
export function inPluginSource(path: string): boolean {
  const p = path.replace(/\\/g, "/");
  return /\/packages\/plugin-[^/]+\/(?:src|tests)\//.test(p) && !/\/(?:refs|dist|node_modules)\//.test(p);
}

// A test's title is the first string of its `ok(` call; a string a test hands the machinery is data and is never read.
const TEST_TITLE = /\bok\(\s*(["'`])((?:\\.|(?!\1).)*)\1/;

/** The prose of one plugin file: all of a markdown file, and the comments and test titles of a script. */
function pluginProse(text: string, file: string): Array<[number, string]> {
  const lines = text.split("\n");
  if (file.endsWith(".md")) return lines.map((line, at) => [at + 1, line]);
  const out: Array<[number, string]> = [];
  let block = false;
  lines.forEach((line, at) => {
    const trimmed = line.trim();
    const parts: string[] = [];
    if (block) { parts.push(trimmed); if (trimmed.includes("*/")) block = false; }
    else if (trimmed.startsWith("/*")) { parts.push(trimmed); if (!trimmed.includes("*/")) block = true; }
    else {
      const slashes = /(?:^|\s)\/\/(.*)$/.exec(line);
      if (slashes) parts.push(slashes[1]);
      const title = TEST_TITLE.exec(line);
      if (title) parts.push(title[2]);
    }
    for (const part of parts) out.push([at + 1, part]);
  });
  return out;
}

/** Each place in a plugin's prose that names a workstream with an arc, or workstream and a number. */
export function pluginNameFaults(text: string, file: string): string[] {
  const out: string[] = [];
  for (const [line, prose] of pluginProse(text, file))
    if (WORKSTREAM_WITH_ARC.test(prose) || WORKSTREAM_AND_NUMBER.test(prose))
      out.push(`line ${line}: a plugin names a workstream or an arc; an example is ${TOLD}`);
  return out;
}
