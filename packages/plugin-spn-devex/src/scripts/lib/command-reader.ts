// A Bash command read into the programs it runs, each as `script` › `group` › `subgroup` › `action`
// and the `args` typed after the action (RD.DEVEX.WORKSPACE.185). What `bash-timing.ts` times.
//
// THE READING. The command is split on `&&`, `||`, `;`, `|`, `&` and newlines; quotes join a word and
// hide a separator; redirections and their targets are dropped, and so is a heredoc's body. In each
// segment a leading `VAR=value` is dropped, a `cd <dir>` moves where the later segments run (which is
// the line's `repo`), and `npx`, `pnpm exec` and `node <script>` are looked through to the program.
// A program is read by its rule: how many words make its levels, which first words take one more,
// and which options take a value (so `git -C <dir> status` reads `status`).
//
// A PLUGIN COMMAND IS READ BY ITS GRAMMAR: `<group> [<subject>] <action>`. A subject is a command
// file that names its actions, so `docs face check docs/` reads group `docs`, subgroup `face`,
// action `check`, and `restates check <book>` reads group `restates`, action `check`. Those are the
// levels the command's own telemetry line carries. `PLUGIN_SUBJECTS` names each subject, and a case
// in the suite compares it with the command files.
//
// THE FILTER. `DEFAULT_PROGRAMS` names `spnutils`, the three plugin CLIs, `nx`, `git` and `docker`.
// A workspace may add or remove programs in `.spndevex/.debug/telemetry/filter.json`:
//
//     { "add":    [{ "program": "make", "levels": 1, "valued": ["f", "C"] }],
//       "remove": ["git"] }
//
// `add[].program` is the command word as typed (its basename is compared), and it is also the line's
// `script`; `levels` is how many words make the name, 1 to 3 (1 when absent); `valued` lists the
// options that take a value, without dashes. `remove` names a `script` — a default or an added one.
// A file that cannot be read or does not parse leaves the defaults, and a malformed entry is skipped.

import { readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { argsText, repoOf } from "../../../../plugin-support-lib/src/lib/timing.ts";

/** How one program is read. */
export type Program = {
  /** The line's `script`, and the name a filter removes. */
  script: string;
  /** Whether the command word runs this program. */
  matches: (word: string) => boolean;
  /** How many words make group/subgroup/action by default. */
  levels: number;
  /** First words that take one more level: always (`true`), or only before one of these second words. */
  deeper?: Record<string, true | string[]>;
  /** Options that take a value, without their dashes. */
  valued?: string[];
};

/** One program a command runs, read. */
export type Reading = {
  script: string; group: string | null; subgroup: string | null; action: string | null; args: string | null; repo: string | null;
};

const named = (name: string) => (word: string) => basename(word) === name;
/** A plugin CLI: the installed `spn-<plugin>/<version>/dist/cli.mjs`, the marketplace's own build, or its bin name. */
const pluginCli = (plugin: string) => {
  const path = new RegExp(`(?:^|/)(?:plugin-)?${plugin}/(?:.*/)?cli\\.(?:mjs|ts)$`);
  return (word: string) => word === plugin || path.test(word);
};
// `docker <management command> <action>` is two levels; `docker ps`, `docker run` are one.
const DOCKER_GROUPS = ["builder", "buildx", "compose", "config", "container", "context", "image", "manifest", "network",
  "node", "plugin", "secret", "service", "stack", "swarm", "system", "trust", "volume"];

/**
 * The subjects of each plugin, by group: each command file that names its actions, so its command
 * is typed as three words. A group's other files are actions of the group, typed as two.
 */
export const PLUGIN_SUBJECTS: Record<string, Record<string, string[]>> = {
  "spn-devex": {
    behaviours: ["coverage", "ids", "stamp"],
    docs: ["audit", "coherence", "cycles", "face", "figure", "guide", "index", "page", "parity", "prose", "sds", "status", "topics"],
    plugin: ["partner", "paths", "timings"],
    report: ["refresh"],
    restates: ["decisions", "docs", "files"],
    workspace: ["tokens"],
  },
  "spn-apps": { library: ["catalogue"] },
  "spn-infra": {},
};

export const DEFAULT_PROGRAMS: Program[] = [
  { script: "spnutils", matches: named("spnutils"), levels: 2,
    // The groups whose second word has subcommands of its own, read from `spnutils help --json`.
    deeper: { apps: ["migrate"], infra: ["app", "config", "domain", "environment", "organization", "platform", "scaffold", "web"] },
    valued: ["mode", "phase", "usecase", "u", "code", "c", "scope", "s", "support-version", "name", "stack", "organization",
             "platform", "env", "e", "app", "a", "port", "p", "deployment", "unit", "ports", "dist", "from", "timeout"] },
  { script: "spn-devex", matches: pluginCli("spn-devex"), levels: 2, deeper: PLUGIN_SUBJECTS["spn-devex"],
    valued: ["block", "finding", "name", "out", "projects", "reach", "root", "variant"] },
  { script: "spn-apps", matches: pluginCli("spn-apps"), levels: 2, deeper: PLUGIN_SUBJECTS["spn-apps"] },
  { script: "spn-infra", matches: pluginCli("spn-infra"), levels: 2, deeper: PLUGIN_SUBJECTS["spn-infra"] },
  { script: "nx", matches: named("nx"), levels: 1 },
  { script: "git", matches: named("git"), levels: 1, valued: ["C", "c", "git-dir", "work-tree", "namespace"] },
  { script: "docker", matches: named("docker"), levels: 1,
    deeper: Object.fromEntries(DOCKER_GROUPS.map((group) => [group, true as const])),
    valued: ["context", "H", "host", "config", "l", "log-level", "f", "file", "p", "project-name", "env-file", "profile",
             "project-directory"] },
];

type Filter = { add?: unknown; remove?: unknown };

/** The defaults with a workspace filter applied. Never throws; a malformed entry is skipped. */
export function programsFrom(filter: Filter | null | undefined): Program[] {
  try {
    const removed = new Set(Array.isArray(filter?.remove) ? filter!.remove.filter((one): one is string => typeof one === "string") : []);
    const added: Program[] = [];
    for (const entry of Array.isArray(filter?.add) ? filter!.add : []) {
      if (!entry || typeof entry !== "object") continue;
      const { program, levels, valued } = entry as { program?: unknown; levels?: unknown; valued?: unknown };
      if (typeof program !== "string" || !program.trim()) continue;
      const depth = typeof levels === "number" && levels >= 1 && levels <= 3 ? Math.floor(levels) : 1;
      added.push({ script: basename(program), matches: named(basename(program)), levels: depth,
                   valued: Array.isArray(valued) ? valued.filter((one): one is string => typeof one === "string") : [] });
    }
    return [...DEFAULT_PROGRAMS, ...added].filter((program) => !removed.has(program.script));
  } catch { return DEFAULT_PROGRAMS; }
}

/** The programs a workspace times: the defaults, and its `filter.json` beside the log where there is one. */
export function loadPrograms(telemetryDir: string): Program[] {
  let filter: Filter | null = null;
  try { filter = JSON.parse(readFileSync(join(telemetryDir, "filter.json"), "utf8")) as Filter; } catch { return DEFAULT_PROGRAMS; }
  return programsFrom(filter);
}

/**
 * A command's words, one list per segment, as the shell would split them: quotes removed, escapes
 * applied, separators and redirections gone, heredoc bodies skipped, comments dropped.
 */
export function segments(text: string): string[][] {
  const out: string[][] = [];
  let words: string[] = [];
  let word = "";
  let inWord = false;
  let target: "none" | "redirect" | "heredoc" = "none";
  let strip = false;
  const heredocs: Array<{ delimiter: string; strip: boolean }> = [];
  const endWord = () => {
    if (!inWord) return;
    if (target === "redirect") target = "none";
    else if (target === "heredoc") { heredocs.push({ delimiter: word, strip }); target = "none"; }
    else words.push(word);
    word = ""; inWord = false;
  };
  const endSegment = () => { endWord(); if (target === "redirect") target = "none"; if (words.length) out.push(words); words = []; };

  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === "\\") {
      if (text[i + 1] === "\n") { i += 2; continue; }
      if (i + 1 < text.length) { word += text[i + 1]; inWord = true; }
      i += 2; continue;
    }
    if (c === "'") {
      const close = text.indexOf("'", i + 1);
      const stop = close < 0 ? text.length : close;
      word += text.slice(i + 1, stop); inWord = true; i = stop + 1; continue;
    }
    if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') {
        if (text[j] === "\\" && j + 1 < text.length && '"\\$`\n'.includes(text[j + 1])) { word += text[j + 1]; j += 2; continue; }
        word += text[j]; j += 1;
      }
      inWord = true; i = j + 1; continue;
    }
    if (c === "#" && !inWord) { const eol = text.indexOf("\n", i); i = eol < 0 ? text.length : eol; continue; }
    if (c === "\n") {
      endSegment(); i += 1;
      // The bodies of the heredocs this line opened, skipped to each one's closing line.
      while (heredocs.length) {
        const { delimiter, strip: tabs } = heredocs.shift()!;
        while (i < text.length) {
          const eol = text.indexOf("\n", i);
          const stop = eol < 0 ? text.length : eol;
          const line = tabs ? text.slice(i, stop).replace(/^\t+/, "") : text.slice(i, stop);
          i = stop + 1;
          if (line === delimiter) break;
        }
      }
      continue;
    }
    if (c === " " || c === "\t" || c === "\r") { endWord(); i += 1; continue; }
    if (c === ";" || c === "(" || c === ")") { endSegment(); i += 1; continue; }
    if (c === "&") {
      if (text[i + 1] === "&") { endSegment(); i += 2; continue; }
      if (text[i + 1] === ">") { endWord(); target = "redirect"; i += text[i + 2] === ">" ? 3 : 2; continue; }
      endSegment(); i += 1; continue;
    }
    if (c === "|") { endSegment(); i += text[i + 1] === "|" || text[i + 1] === "&" ? 2 : 1; continue; }
    if (c === ">" || c === "<") {
      // Digits right before a redirection are its file descriptor, not a word.
      if (inWord && /^\d+$/.test(word)) { word = ""; inWord = false; } else endWord();
      if (c === "<" && text[i + 1] === "<") {
        if (text[i + 2] === "<") { target = "redirect"; i += 3; continue; }
        strip = text[i + 2] === "-"; target = "heredoc"; i += strip ? 3 : 2; continue;
      }
      i += 1;
      if (text[i] === ">" || text[i] === "&" || text[i] === "|") i += 1;
      target = "redirect";
      continue;
    }
    word += c; inWord = true; i += 1;
  }
  endSegment();
  return out;
}

const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;
// Words that open a segment without being its program.
const PREFIXES = new Set(["if", "then", "else", "elif", "do", "while", "until", "!", "{", "time", "exec", "nohup", "command"]);
// `node`'s own options that take a value; `-e`/`-p` mean there is no script file to read.
const NODE_VALUED = new Set(["-r", "--require", "--import", "--loader", "--input-type", "-C", "--conditions"]);

/** The program word and what follows it, looking through `npx`, `pnpm exec` and `node <script>`. */
function programWords(words: string[]): string[] {
  let at = 0;
  while (at < words.length && (ASSIGNMENT.test(words[at]) || PREFIXES.has(words[at]))) at += 1;
  let rest = words.slice(at);
  if (rest[0] === "npx") { rest = rest.slice(1); while (rest[0]?.startsWith("-")) rest = rest.slice(1); }
  if (rest[0] === "pnpm" && (rest[1] === "exec" || rest[1] === "dlx")) rest = rest.slice(2);
  if (rest[0] !== undefined && basename(rest[0]) === "node") {
    let i = 1;
    while (i < rest.length && rest[i].startsWith("-")) {
      if (rest[i] === "-e" || rest[i] === "--eval" || rest[i] === "-p" || rest[i] === "--print") return [];
      i += NODE_VALUED.has(rest[i]) ? 2 : 1;
    }
    rest = rest.slice(i);
  }
  return rest;
}

/** One segment read by the first program whose rule matches it, or null. */
function readSegment(words: string[], programs: Program[]): Omit<Reading, "repo"> | null {
  const [first, ...rest] = programWords(words);
  if (first === undefined) return null;
  const program = programs.find((one) => one.matches(first));
  if (!program) return null;
  const valued = new Set(program.valued ?? []);
  const levels: string[] = [];
  let want = program.levels;
  let last = -1;
  for (let i = 0; i < rest.length && levels.length < want; i++) {
    const word = rest[i];
    if (word.startsWith("-") && word !== "-") {
      const name = word.replace(/^-+/, "").split("=")[0];
      if (valued.has(name) && !word.includes("=")) i += 1;
      last = i;
      continue;
    }
    levels.push(word);
    last = i;
    if (levels.length === 1 && program.deeper?.[word] !== undefined) {
      const deeper = program.deeper[word];
      if (deeper === true) want += 1;
      else {
        const next = rest.slice(i + 1).find((one) => !one.startsWith("-"));
        if (next !== undefined && deeper.includes(next)) want += 1;
      }
      want = Math.min(want, 3);
    }
  }
  // Options before the first level are not the action's args; a run with no level keeps them all.
  const after = levels.length ? rest.slice(last + 1) : rest;
  // Two words read where three were owed are a group and its subgroup, typed with no action after them.
  const [group, subgroup, action] =
    levels.length === 3 ? levels
    : levels.length === 2 ? (want === 3 ? [levels[0], levels[1], null] : [levels[0], null, levels[1]])
    : [null, null, levels[0] ?? null];
  return { script: program.script, group, subgroup, action, args: argsText(after) };
}

/**
 * Every program in `command` the filter names, in the order they run, each with the repository it
 * runs in: the member folder `cwd` sits in, or the one a `cd` moved to. Never throws.
 */
export function readCommand(command: string, cwd: string, programs: Program[], root: string | null): Reading[] {
  try {
    const found: Reading[] = [];
    let here = cwd;
    for (const words of segments(command)) {
      if (words[0] === "cd" || words[0] === "pushd") {
        const to = words[1];
        if (to && to !== "-") here = resolve(here, to.startsWith("~") ? `${process.env.HOME ?? "~"}${to.slice(1)}` : to);
        continue;
      }
      const one = readSegment(words, programs);
      if (one) found.push({ ...one, repo: repoOf(root, here) });
    }
    return found;
  } catch { return []; }
}
