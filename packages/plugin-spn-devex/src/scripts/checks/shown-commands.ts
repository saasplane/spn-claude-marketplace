#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § Code blocks
// A COMMAND A PAGE SHOWS IS ONE THE COMMAND LINE ACCEPTS TODAY, as decision 046 holds a permission rule to the command table.
// The table is `refs/commands.md` of each plugin, generated from the commands tree. A `node <name>.ts` line is a form that is gone, and a
// `spn-devex`, `spn-apps`, `spn-surface` or `spn-infra` line whose command words the table does not hold is a finding. Every finding is SOFT
// and names the closest current form. `spnutils` has no table in the plugins, so its lines are not read here.
//
// WHAT IT READS. The lines of a `sh`, `bash`, `shell`, `zsh` or `console` fence in a seat file, the same in a `<pre data-lang="sh">` of a
// page, and the command after "Try it:" on a line.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type CommandEntry = { cli: string; words: string[]; usage: string };

const CLIS = ["spn-devex", "spn-apps", "spn-surface", "spn-infra"];

/** The commands one `commands.md` lists: the CLI, the plain words, and the line up to its dash. */
export function parseCommandTable(markdown: string): CommandEntry[] {
  const out: CommandEntry[] = [];
  for (const line of markdown.split("\n")) {
    const head = /^(spn-[a-z]+)\s+(.*?)\s+—\s/.exec(line);
    if (!head || !CLIS.includes(head[1])) continue;
    const words: string[] = [];
    for (const token of head[2].split(/\s+/)) { if (!/^[a-z][a-z0-9-]*$/.test(token)) break; words.push(token); }
    if (words.length) out.push({ cli: head[1], words, usage: `${head[1]} ${head[2]}` });
  }
  return out;
}

/** The tables of this plugin and of its sibling plugins in the same checkout; a plugin installed alone holds its own. */
export function loadCommandTable(): CommandEntry[] {
  const here = dirname(fileURLToPath(import.meta.url));
  const own = join(here, "..", "..", "refs", "commands.md");
  const siblings = join(here, "..", "..", "..", "..");
  const files = new Set<string>([own]);
  try {
    for (const name of readdirSync(siblings))
      if (name.startsWith("plugin-spn-")) files.add(join(siblings, name, "src", "refs", "commands.md"));
  } catch { /* an installed plugin has no siblings */ }
  const out: CommandEntry[] = [];
  for (const file of files) if (existsSync(file)) out.push(...parseCommandTable(readFileSync(file, "utf8")));
  return out;
}

/** The longest run of words two lists share from the start. */
function shared(one: string[], two: string[]): number {
  let at = 0;
  while (at < one.length && at < two.length && one[at] === two[at]) at += 1;
  return at;
}

/** The finding for one shown command, or null where the table holds it. */
export function commandFinding(line: string, table: CommandEntry[]): string | null {
  const old = /(?:^|[\s`$>(])node\s+(?:\S*\/)?([a-z][a-z-]*)\.ts(?:\s+([a-z][a-z-]*))?/.exec(line);
  if (old) {
    const [, name, sub] = old;
    const near = table.find((e) => e.cli === "spn-devex" && e.words[0] === name && sub !== undefined && e.words[1] === sub)
      ?? table.find((e) => e.cli === "spn-devex" && e.words[0] === name);
    const shown = `node ${name}.ts${sub ? ` ${sub}` : ""}`;
    return near ? `\`${shown}\` is gone: use \`${near.usage}\` (RULE.DEVEX.WORKSPACE.046)` : `\`${shown}\` is gone: no command of that name is in the command table (RULE.DEVEX.WORKSPACE.046)`;
  }
  const start = /(?:^|[\s`$>(])((?:spn-devex|spn-apps|spn-surface|spn-infra))\s+([^`\n<]*)/.exec(line);
  if (!start) return null;
  const cli = start[1];
  if (!table.some((e) => e.cli === cli)) return null; // a plugin whose table is not here is not read
  const words: string[] = [];
  for (const token of start[2].trim().split(/\s+/)) { if (!/^[a-z][a-z0-9-]*$/.test(token)) break; words.push(token); }
  const own = table.filter((e) => e.cli === cli);
  if (own.some((e) => shared(e.words, words) === e.words.length)) return null;
  const best = own.map((e) => ({ e, n: shared(e.words, words) })).sort((a, b) => b.n - a.n)[0];
  const shown = `${cli} ${words.join(" ")}`.trim();
  return best && best.n > 0
    ? `\`${shown}\` is not a command the command line accepts: use \`${best.e.usage}\` (RULE.DEVEX.WORKSPACE.046)`
    : `\`${shown}\` is not a command the command line accepts: no command of that name is in the command table (RULE.DEVEX.WORKSPACE.046)`;
}

const SHELL = /^(?:sh|bash|shell|zsh|console)$/;

/** The lines of a text a command is shown on: shell fences, shell `<pre>` blocks, and a "Try it:" line. */
export function shownLines(text: string): string[] {
  const out: string[] = [];
  const fence = /^\s*(```+|~~~+)\s*([\w-]*)\s*$/;
  const lines = text.split("\n");
  for (let at = 0; at < lines.length; at += 1) {
    const open = fence.exec(lines[at]);
    if (open) {
      const shell = SHELL.test(open[2]);
      for (at += 1; at < lines.length && !lines[at].trim().startsWith(open[1]); at += 1) if (shell) out.push(lines[at]);
      continue;
    }
    if (/\bTry it:/i.test(lines[at])) out.push(lines[at].replace(/^.*\bTry it:/i, ""));
  }
  for (const pre of text.matchAll(/<pre\b[^>]*\bdata-lang="(?:sh|bash|shell|zsh|console)"[^>]*>([\s\S]*?)<\/pre>/gi))
    out.push(...pre[1].replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").split("\n"));
  return out;
}

/** Every shown command a table does not hold, one finding each, in the order shown. */
export function shownCommandFindings(text: string, table: CommandEntry[] = loadCommandTable()): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of shownLines(text)) {
    const found = commandFinding(line.replace(/^\s*[$#>]\s*/, ""), table);
    if (found && !seen.has(found)) { seen.add(found); out.push(found); }
  }
  return out;
}
