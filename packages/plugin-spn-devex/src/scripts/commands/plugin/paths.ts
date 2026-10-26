// RD.DEVEX.AGENT.070, carried from `N97` step 4 and run here per `N101` step 6b — a path written in a
// plugin file must name a file the installed plugins carry.
//
// `${CLAUDE_PLUGIN_ROOT}` is the one variable a skill, a ref or `hooks.json` ever writes a plugin
// path through, and it resolves at install time to that PLUGIN'S OWN `src/`. A path after it that
// does not exist under that plugin's `src/` is an agent told to run something nobody shipped — the
// same failure `coherence.ts`'s `PATH` question catches for the foundation book naming a plugin file,
// read here from the other side: a plugin naming its own.
//
//     spn-devex plugin paths check [<path>]
//
// A SUBJECT WITH ONE ACTION, AND A `tree` PATH. The marketplace checkout is found by walking up from
// the path, and the files read are the plugin files that sit under the path: the checkout itself
// reads every plugin, one plugin's folder reads that plugin, and one skill reads that file.
//
// Exit code is 1 where a path resolves to nothing. The finding is graded SOFT: the corpus it reads
// has not yet been swept to it (that sweep is the path rename `N101` step 6 carries).

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { type Action, OPTIONAL, onePath, readWords, scopeOf, under } from "../../../../../plugin-support-lib/src/lib/command.ts";

const SKIP = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage", "__pycache__"]);
const PLACEHOLDER = /[<{*…]|&lt;/;

function isDir(path: string): boolean { try { return statSync(path).isDirectory(); } catch { return false; } }
function isFile(path: string): boolean { try { return statSync(path).isFile(); } catch { return false; } }

/** The marketplace root — the folder holding `packages/plugin-*`, found by walking up from `from`. */
export function marketplaceRoot(from: string): string | null {
  let dir = resolve(from);
  for (;;) {
    if (isDir(join(dir, "packages")) && readdirSync(join(dir, "packages")).some((e) => e.startsWith("plugin-")))
      return dir;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/** Every file under a plugin's `src/{skills,refs,agents}` (markdown) plus its `hooks/hooks.json`. */
function pluginSources(pluginRoot: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: string[];
    try { entries = readdirSync(dir).sort(); } catch { return; }
    for (const entry of entries) {
      if (SKIP.has(entry)) continue;
      const full = join(dir, entry);
      let stat;
      try { stat = statSync(full); } catch { continue; }
      if (stat.isDirectory()) walk(full);
      else if (entry.endsWith(".md") || entry === "hooks.json") out.push(full);
    }
  };
  for (const folder of ["skills", "refs", "agents", "hooks"]) walk(join(pluginRoot, "src", folder));
  return out;
}

// `"${CLAUDE_PLUGIN_ROOT}"/scripts/…` and `${CLAUDE_PLUGIN_ROOT}/scripts/…` both appear in the
// corpus — the quote before the slash is optional.
const PLUGIN_PATH = /\$\{CLAUDE_PLUGIN_ROOT\}"?\/([A-Za-z0-9_][A-Za-z0-9_.\/-]*)/g;

export type Finding = { file: string; line: number; named: string };

/** Every `${CLAUDE_PLUGIN_ROOT}` path this plugin's own files name that does not resolve. */
export function findDead(pluginRoot: string): Finding[] {
  const dead: Finding[] = [];
  for (const file of pluginSources(pluginRoot)) {
    const text = readFileSync(file, "utf8");
    text.split("\n").forEach((line, index) => {
      for (const hit of line.matchAll(PLUGIN_PATH)) {
        const named = hit[1].replace(/[.,:;)]+$/, "");
        const cut = named.search(PLACEHOLDER);
        const asked = cut < 0 ? named : named.slice(0, cut).replace(/[^/]*$/, "");
        if (!asked) continue; // a placeholder alone, with nothing fixed before it, asks nothing
        if (!isFile(join(pluginRoot, "src", asked)) && !isDir(join(pluginRoot, "src", asked)))
          dead.push({ file, line: index + 1, named });
      }
    });
  }
  return dead;
}

export const describe = "a plugin path named in its own skills/refs/hooks resolves to a shipped file (RD.DEVEX.AGENT.070)";

/** The dead paths in the plugin files under one path, printed; 1 where there is one, else 0. */
export function check(args: string[]): number {
  const path = onePath(scopeOf(readWords(args).paths, OPTIONAL));
  const root = marketplaceRoot(path);
  if (root === null) {
    console.log("no `packages/plugin-*` here — nothing to check");
    return 0;
  }
  // `plugin-support-lib` shares the `plugin-` prefix and is not itself an installed plugin (`02-shape.md`:
  // "a plain folder — no package.json, no name, never installed") — an entry counts only where it
  // carries a `.claude-plugin/plugin.json`, the one file that makes something installable.
  const plugins = readdirSync(join(root, "packages"))
    .filter((e) => e.startsWith("plugin-") && isFile(join(root, "packages", e, "src", ".claude-plugin", "plugin.json")))
    // A plugin is read where its folder sits under the path, or holds it.
    .filter((e) => under(join(root, "packages", e), [path]) || under(path, [join(root, "packages", e)]))
    .sort();
  let total = 0;
  for (const plugin of plugins) {
    const pluginRoot = join(root, "packages", plugin);
    const dead = findDead(pluginRoot).filter((one) => under(one.file, [path]));
    total += dead.length;
    for (const d of dead)
      console.log(`! SOFT paths     ${d.file.slice(root.length + 1)}:${d.line}\n         names \`\${CLAUDE_PLUGIN_ROOT}/${d.named}\`, which resolves to no file this plugin ships`);
  }
  console.log(total
    ? `\n${total} plugin path(s) named that resolve to nothing, over ${plugins.length} plugin(s)`
    : `\nclean — ${plugins.length} plugin(s)`);
  return total ? 1 : 0;
}

export const actions: Record<string, Action> = {
  check: {
    describe: "name each plugin path, in the plugin files under the path, that resolves to no shipped file",
    usage: "[<path>]",
    run: check,
  },
};
