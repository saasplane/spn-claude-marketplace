#!/usr/bin/env node
// RESTATES: `docs/02-constructs/02-support/02-infra/10-providers.md` § The tree follows the category
// vocabulary · § The check reads the declared provider, and never names a vendor; and
// RD.DEVEX.AGENT.066 — a gate never names an instance. Those are the source of truth; this file
// states no rule of its own.
//
// Which providers judge this write, and which subjects exist.
//
// **THE ESTATE HAS ONE PROVIDER PER CATEGORY AND THE DECLARATION SAYS WHICH. THIS GATE STILL RUNS
// EVERY ONE.** A write-time gate cannot read a resolved estate — there may not be one yet — so it
// runs every provider's validators. That sounds wasteful and is not: the rules are the same and
// only the patterns differ, so the cost is a handful of regular expressions against text already in
// memory.
//
// **AND IT IS THE SAFE DIRECTION.** Running only the declared cloud's patterns would let an AWS
// region into a declaration whose cloud entry says Google, which is exactly the mistake somebody
// makes while moving an estate between clouds — the moment the gate is most worth having.
//
// **THE CLOUDS ARE DISCOVERED, NOT LISTED.** This file names no cloud: it reads which folders
// `providers/` holds and imports each one's subjects. A third cloud joins by adding a folder, and
// the gate that would otherwise have needed four new import lines needs none.
import { readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import type { Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { validate as testTreeShape } from "../lib/test-file-outside-tier-folder.ts";
import { validate as harnessManifestIdentity } from "../lib/harness-reimplements-manifest-identity.ts";

/** One subject, parsed once per provider that has an opinion about it. */
export type Subject = {
  name: string;
  /** The subject and the cloud that answers it, as the telemetry line's group and action (`manifest` › `aws`). */
  group: string;
  action: string;
  validate: (path: string, text: string) => Verdict;
};

/**
 * The subjects an estate node has, in the order a person would want to hear about them.
 *
 * `rendering` reads the path alone, so it runs first and costs nothing when it does not apply.
 * `manifest` needs the text the write would produce. `test-tree-shape` and
 * `harness-manifest-identity` are cloud-free — the test tree's own layout, not a provider's — so
 * they run once each rather than once per provider.
 */
export const SUBJECT_NAMES = ["rendering", "manifest"] as const;

/** The cloud-free subjects, run once regardless of which provider folders exist. */
const CORE_SUBJECTS: Subject[] = [
  { name: "test-tree-shape", group: "test-tree-shape", action: "test-tree-shape", validate: testTreeShape },
  { name: "harness-manifest-identity", group: "harness-manifest-identity", action: "harness-manifest-identity",
    validate: harnessManifestIdentity },
];

/**
 * This plugin's own `src/` — this file's home when it runs from source, or the sibling of
 * wherever this file ends up bundled to.
 *
 * ESBUILD COLLAPSES EVERY INLINED MODULE'S `import.meta.dirname` TO THE BUNDLE'S OWN LOCATION
 * (the same defect `corpus.ts` in `plugin-spn-devex` documents and fixes). This file is a static
 * import of `events/pretooluse.ts`, so once that event is built to `dist/events/pretooluse.mjs`,
 * `import.meta.dirname` inside this module reads as `.../src/dist/events`, never
 * `.../src/scripts/checks`. A fixed `resolve(dirname, "..", "..", "providers")` answered
 * `src/providers` either way ONLY BECAUSE `scripts/checks` and `dist/events` happen to sit at the
 * same depth under `src/` — a coincidence, not a guarantee a future entry keeps. Climbing to the
 * nearer ancestor named `scripts` or `dist` and returning ITS OWN PARENT (the plugin's `src/`) is
 * correct whichever way this file is reached, and does not depend on the two trees matching depth.
 */
export function pluginSrcDir(from: string): string {
  let dir = from;
  for (let hop = 0; hop < 8; hop++) {
    const name = basename(dir);
    if (name === "scripts" || name === "dist") return dirname(dir);
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return from;
}
const PROVIDERS = join(pluginSrcDir(import.meta.dirname), "providers");

/** Every cloud this plugin ships a provider folder for, sorted so the order is stable. */
function instances(): string[] {
  try {
    return readdirSync(PROVIDERS, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}

/**
 * Every subject, for every provider, subject-major so `rendering` runs before `manifest`.
 *
 * A provider that ships no file for a subject contributes nothing for it, which is the same
 * statement as a cloud with no folder: a realization that is absent says so.
 */
export async function subjects(): Promise<Subject[]> {
  const found: Subject[] = [...CORE_SUBJECTS];
  for (const name of SUBJECT_NAMES) {
    for (const instance of instances()) {
      try {
        const module = await import(join(PROVIDERS, instance, "scripts", "checks", `${name}.ts`));
        if (typeof module.validate === "function")
          found.push({ name: `${name}:${instance}`, group: name, action: instance, validate: module.validate });
      } catch {
        // A subject a provider does not ship is a subject that does not run for that cloud.
      }
    }
  }
  return found;
}

/** The text this call would ADD. A Write carries `content`, an Edit carries `new_string`. */
export const written = (input: { content?: string; new_string?: string }): string =>
  input.content ?? input.new_string ?? "";

/** True where a subject can decide without reading any text — the path is enough. */
export const pathOnly = (name: string): boolean => name.startsWith("rendering:") || name === "test-tree-shape";
