#!/usr/bin/env node
// RESTATES: nothing. This tool carries no rule of its own — it reads what the platform repository
// publishes and writes it down. What a module IS belongs to
// `spn-claude-marketplace/plugins/spn-apps/src/refs/platform/modules/modules.md`.
//
// Which modules exist, as a table a partner can read without a checkout.
//
// **A CATALOGUE CANNOT BE RESTATED, WHICH IS WHY IT IS GENERATED.** A restatement carries a hash of
// what it restates, and the hash is the promise that the two still agree. The set of published
// modules moves every release, so a hand-written list is stale the day after it is written and
// nothing would report it. Generating it makes the staleness a diff instead of a surprise.
//
// **SO THE BLOCK IS A `commands` ENTRY, NOT A `docs` ONE.** The citation says *this file is what
// that command produced*, and re-running the command is how you check it. A `docs` citation would
// promise agreement with a chapter, and there is no chapter — the platform repository's own
// manifests are the source.
//
//     node module-catalogue.ts <workspace>            write refs/platform/modules/catalogue.md
//     node module-catalogue.ts <workspace> --check    report what would change, write nothing
//
// **THE PLATFORM REPOSITORY IS FOUND, NEVER ASSUMED.** A partner holds the plugins and not the
// platform checkout, so run there it says so and exits clean rather than writing an empty
// catalogue. An empty table would read as *there are no modules*, which is a different claim.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { seenHash } from "../lib/stamp.ts";

/** One published module, as its own manifest declares it. */
type Module = { folder: string; kind: string; name: string; code: string };

const PLATFORM = "spn-platform-ts";
const OUT = join("spn-claude-marketplace", "plugins", "spn-apps", "src", "refs", "platform", "modules", "catalogue.md");
/** The generator itself. A `commands` citation names what produced the file, and a hash of the
 *  generator is what says the output is stale: change the renderer and every catalogue it wrote is
 *  owed a re-run. A command STRING would resolve to nothing and report as broken forever. */
const GENERATOR = "spn-claude-marketplace/plugins/spn-apps/src/scripts/tools/module-catalogue.ts";

/**
 * Every `module-*` package the platform repository holds, read from its own `spkind.json`.
 *
 * A folder with no manifest is skipped rather than guessed at: the folder name carries the code by
 * convention, and reading a convention is how a catalogue starts disagreeing with the manifests.
 */
function modules(workspace: string): Module[] {
  const packages = join(workspace, PLATFORM, "packages");
  if (!existsSync(packages)) return [];
  const found: Module[] = [];
  for (const folder of readdirSync(packages).sort()) {
    if (!folder.startsWith("module-")) continue;
    const manifest = join(packages, folder, "spkind.json");
    if (!existsSync(manifest)) continue;
    const declared = JSON.parse(readFileSync(manifest, "utf8"));
    found.push({
      folder: folder,
      kind: declared.kind ?? "—",
      name: declared.name ?? "—",
      code: declared.config?.code ?? "—",
    });
  }
  return found;
}

/**
 * The catalogue, grouped by code rather than by package.
 *
 * A module is one subject with as many packages as it has runtimes, and a reader asking *is there
 * an identity module* wants one row. Listing the packages instead answers a question about the
 * repository's layout, which is not what a catalogue is for.
 */
function render(found: Module[], generatorHash: string): string {
  const byCode = new Map<string, Module[]>();
  for (const module of found) {
    if (!byCode.has(module.code)) byCode.set(module.code, []);
    byCode.get(module.code)!.push(module);
  }
  let out = `<!-- spn:restates\n{\n  "commands": [\n    { "path": "${GENERATOR}", "seen": "${generatorHash}" }\n  ]\n}\n-->\n`;
  out += `<!-- spn:generated module-catalogue — do not edit inside these markers; \`module-catalogue.ts\` writes it -->\n`;
  out += `# The published modules\n\n`;
  out += `**This table is generated from the platform repository's own manifests**, and it moves every release. What a module *is* — the contract chain, what you may consume and what you may not reach — is [\`modules.md\`](modules.md) beside this file. **${byCode.size} module(s) are published.**\n\n`;
  out += `**A module is one subject and as many packages as it has runtimes**, so the rows are by code. A module with a server package and a web package is one module.\n\n`;
  out += `| Code | Module | Runtimes |\n| --- | --- | --- |\n`;
  for (const code of [...byCode.keys()].sort()) {
    const packages = byCode.get(code)!;
    const runtimes = packages.map((m) => `\`${m.kind}\``).sort().join(" · ");
    out += `| \`${code}\` | ${packages[0].name} | ${runtimes} |\n`;
  }
  out += `\n**A code is the module's name everywhere** — in a manifest, in a package folder, and in the estate's own coordinates. Nothing derives a second spelling from it.\n`;
  out += `\n<!-- /spn:generated -->\n`;
  return out;
}

export function main(workspace: string, check = false): number {
  if (!existsSync(join(workspace, PLATFORM, "packages"))) {
    console.log("no platform checkout here — nothing to catalogue, and the shipped catalogue stands");
    return 0;
  }
  const found = modules(workspace);
  if (!found.length) {
    console.log("the platform checkout holds no module packages — refusing to write an empty catalogue");
    return 0;
  }
  const body = render(found, seenHash(readFileSync(join(workspace, GENERATOR), "utf8")));
  const at = join(workspace, OUT);
  const now = existsSync(at) ? readFileSync(at, "utf8") : "";
  if (now === body) { console.log(`current  ${OUT} — ${found.length} package(s)`); return 0; }
  if (check) { console.log(`would write  ${OUT} — ${found.length} package(s)`); return 1; }
  writeFileSync(at, body);
  console.log(`wrote    ${OUT} — ${found.length} package(s)`);
  // WRITING IS SUCCESS. The exit code says whether the run FAILED, and only --check reports
  // staleness through it — a generator that exits non-zero after writing correctly fails every
  // build that regenerates as a step.
  return 0;
}

if (process.argv[1] && basename(process.argv[1]) === "module-catalogue.ts") {
  const args = process.argv.slice(2);
  process.exit(main(args.find((a) => !a.startsWith("-")) ?? process.cwd(), args.includes("--check")));
}
