// What every plugin with a command line holds to: a launcher under `src/bin/<name>` that runs the
// plugin's own entry, and a `src/tiers.json` that declares the tier of each command group. Both are
// declared by hand and checked here against the code, so neither can drift from the entry or from
// the `commands/` tree.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TIERS = ["allow", "ask"];

const isFolder = (path) => { try { return statSync(path).isDirectory(); } catch { return false; } };

/** Every group of a plugin: a folder under `src/scripts/commands/` whose name does not start with `_`. */
export const groupFolders = (pluginDir) => {
  const commands = join(pluginDir, "src", "scripts", "commands");
  return readdirSync(commands).filter((entry) => !entry.startsWith("_") && isFolder(join(commands, entry))).sort();
};

/** The launcher or the entry, run from `cwd`: its output and exit code. */
const runFrom = (command, args, cwd) => {
  const done = spawnSync(command, args, { cwd, encoding: "utf8" });
  return { stdout: done.stdout, stderr: done.stderr, status: done.status };
};

/** The launcher exists, is executable by its owner, and answers as the entry does from another folder. */
export function launcherCases(ok, pluginDir, name) {
  const launcher = join(pluginDir, "src", "bin", name);
  const entry = join(pluginDir, "src", "dist", "cli.mjs");
  ok(`the launcher src/bin/${name} exists`, existsSync(launcher));
  ok(`the launcher src/bin/${name} has the owner's executable bit`,
    existsSync(launcher) && (statSync(launcher).mode & 0o100) !== 0);
  ok(`the launcher's first line is #!/bin/sh`, readFileSync(launcher, "utf8").split("\n")[0] === "#!/bin/sh");

  // A folder whose name holds a space, so the launcher is proven to quote what it finds.
  const spaced = join(tmpdir(), "launcher cwd");
  mkdirSync(spaced, { recursive: true });
  for (const argv of [["help"], ["help", "--json"], ["no-such-group"]]) {
    const direct = runFrom("node", [entry, ...argv], tmpdir());
    const launched = runFrom(launcher, argv, spaced);
    const label = `${name} ${argv.join(" ")} from another folder`;
    ok(`${label}: the same output as the entry`, launched.stdout === direct.stdout && launched.stderr === direct.stderr,
      JSON.stringify({ launched, direct }).slice(0, 400));
    ok(`${label}: the same exit code as the entry (${direct.status})`, launched.status === direct.status,
      `${launched.status} against ${direct.status}`);
  }
  const unknown = runFrom(launcher, ["no-such-group"], tmpdir());
  ok(`${name} no-such-group: exits non-zero, so the entry's refusal reaches the caller`, unknown.status !== 0);
}

/** `src/tiers.json` names exactly the groups the plugin ships, and each tier is `allow` or `ask`. */
export function tiersCases(ok, pluginDir) {
  const file = join(pluginDir, "src", "tiers.json");
  ok("src/tiers.json exists", existsSync(file));
  const declared = JSON.parse(readFileSync(file, "utf8"));
  ok("tiers.json holds `groups` and `commands` and nothing else",
    JSON.stringify(Object.keys(declared).sort()) === '["commands","groups"]', JSON.stringify(Object.keys(declared)));

  const folders = groupFolders(pluginDir);
  ok("the keys of `groups` are exactly the folders under src/scripts/commands/",
    JSON.stringify(Object.keys(declared.groups).sort()) === JSON.stringify(folders),
    `declared ${JSON.stringify(Object.keys(declared.groups).sort())} against ${JSON.stringify(folders)}`);

  const table = JSON.parse(runFrom("node", [join(pluginDir, "src", "dist", "cli.mjs"), "help", "--json"], tmpdir()).stdout);
  const known = table.commands.map((listed) => listed.command);
  const strayed = Object.keys(declared.commands).filter((key) => !known.includes(key));
  ok("each key of `commands` is a command of the plugin's own table", strayed.length === 0, `not in the table: ${strayed.join(" · ")}`);
  const outside = Object.keys(declared.commands).filter((key) => !(key.split(" ")[0] in declared.groups));
  ok("each key of `commands` sits under a group the file declares", outside.length === 0, outside.join(" · "));

  const values = [...Object.values(declared.groups), ...Object.values(declared.commands)];
  ok("each tier is `allow` or `ask`", values.every((tier) => TIERS.includes(tier)), JSON.stringify(values));
}
