#!/usr/bin/env node
// RESTATES: nothing. This carries no rule of its own — it renders what `spnutils` says about
// itself, and the argument above the region it writes is the ref's and stays a person's.
//
// The `commands`-kind restatement: the `spnutils` command surface, rendered into `refs/commands.md`
// so an agent holds it without asking.
//
//     spn-devex restates commands            check: is the region current?  (exit 1 if not)
//     spn-devex restates commands --write    rewrite the region
//
// WHY THE RELEASED CLI AND NOT THE SOURCE. A partner holds the published plugin and the published
// CLI. A region rendered from a checkout would describe commands a partner cannot run, so the lag
// behind the workspace is correct rather than tolerated.
//
// TWO STAMPS, BECAUSE THEY ANSWER DIFFERENT QUESTIONS. The version says WHICH CLI this describes; the
// surface hash says whether the COMMANDS moved — a patch fixing a bug inside a command leaves the
// hash unmoved and the diff is one line. Either going stale makes the region stale, and the check
// compares the whole body rather than the hash alone.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const REF = resolve(dirname(new URL(import.meta.url).pathname), "..", "..", "..", "refs", "devex", "utils", "spnutils", "commands.md");
const WHAT = "commands";
// THE MARKER TEXT IS THE ALREADY-PUBLISHED ONE. `commands.md` carries this exact string today, and
// `regionOf` locates the region by finding it verbatim — renaming it here without rewriting the file
// would make a current file read as stale on the next run. The rename rides the path sweep instead.
const BEGIN = `<!-- spn:generated ${WHAT} — do not edit inside these markers; \`commands-ref.ts\` writes it -->`;
const END = "<!-- /spn:generated -->";

type Option = { param: string; alias: string | null; takes: string | null; description: string | null };
type Command = { command: string; intent: string | null; signature: string; options: Option[] };
type Surface = { cli: string; commands: Command[] };

/** What the INSTALLED `spnutils` says about itself, and the version that said it. */
function surface(): { payload: Surface; version: string } {
  const payload = JSON.parse(execFileSync("spnutils", ["help", "--json"], { encoding: "utf8" })) as Surface;
  // `--version` prints more than the number — the first token of the first line is the number.
  const printed = execFileSync("spnutils", ["--version"], { encoding: "utf8" });
  const version = (printed.split("\n")[0] ?? "").trim().split(/\s+/).pop() ?? "unknown";
  return { payload, version };
}

/**
 * The hash that decides staleness.
 *
 * Over the COMMANDS alone and with keys sorted, so the answer does not move when a serializer
 * reorders a field or the CLI's own name changes. No semver appears anywhere in the payload, so
 * this is stable across a release that adds no command.
 */
export function fingerprint(payload: Surface): string {
  return createHash("sha256").update(JSON.stringify(payload.commands, Object.keys(payload.commands[0] ?? {}).sort())).digest("hex").slice(0, 12);
}

const cell = (s: string | null) => (s ?? "—").replace(/\|/g, "\\|").replace(/\n+/g, " ").trim() || "—";

/** One table per group, because the group is what an agent narrows by before it reads a command. */
export function render(payload: Surface, version: string, hash: string): string {
  const groups = new Map<string, Command[]>();
  for (const c of payload.commands) {
    const group = c.command.split(" ")[0];
    groups.set(group, [...(groups.get(group) ?? []), c]);
  }
  const out: string[] = [
    `Rendered from \`spnutils ${version}\` — the **released** CLI, which is what a partner holds.`,
    `Surface \`${hash}\` — the COMMANDS. A release that adds none leaves it unmoved, so the diff is the version line alone.`,
    "",
  ];
  for (const group of [...groups.keys()].sort()) {
    out.push(`#### \`${group}\``, "", "| Command | Does | Options |", "| --- | --- | --- |");
    for (const c of groups.get(group)!.sort((a, b) => a.command.localeCompare(b.command))) {
      const opts = c.options.length
        ? c.options.map((o) => `\`${o.param}${o.takes ? " " + o.takes : ""}\``).join(" · ")
        : "—";
      out.push(`| \`${c.command}\` | ${cell(c.intent)} | ${opts} |`);
    }
    out.push("");
  }
  return out.join("\n").trimEnd();
}

export function regionOf(src: string): string | null {
  const i = src.indexOf(BEGIN);
  if (i < 0) return null;
  const j = src.indexOf(END, i);
  return j < 0 ? null : src.slice(i + BEGIN.length, j).trim();
}

export const describe = "the `commands`-kind restatement — render the spnutils surface into refs/commands.md";

export function run(args: string[]): number {
  const write = args.includes("--write");
  const { payload, version } = surface();
  const body = render(payload, version, fingerprint(payload));
  const src = readFileSync(REF, "utf8");
  const current = regionOf(src);

  if (current === body) {
    console.log(`commands region current — ${payload.commands.length} commands from spnutils ${version}`);
    return 0;
  }
  if (!write) {
    // A STALE REGION IS A FINDING, NOT A REPAIR. Saying so and exiting 1 is what lets a release
    // refuse; rewriting it here would hide the very drift this exists to catch.
    console.log(`✗ commands region is stale — spnutils ${version} describes ${payload.commands.length} commands`);
    console.log(`  run: node ${new URL(import.meta.url).pathname} --write`);
    return 1;
  }
  const i = src.indexOf(BEGIN);
  const next = i < 0
    ? `${src.trimEnd()}\n\n${BEGIN}\n${body}\n${END}\n`
    : `${src.slice(0, i)}${BEGIN}\n${body}\n${END}${src.slice(src.indexOf(END, i) + END.length)}`;
  writeFileSync(REF, next, "utf8");
  console.log(`wrote commands region — ${payload.commands.length} commands from spnutils ${version}`);
  return 0;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
