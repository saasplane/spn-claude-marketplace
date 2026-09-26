#!/usr/bin/env node
// RESTATES: `docs/02-constructs/01-spn-devex/11-provider-set.md` — a gate
// never names an instance. That chapter is the source of truth; this file states no rule of its own.
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
import { join, resolve } from "node:path";
import type { Verdict } from "../lib/payload.ts";

/** One subject, parsed once per provider that has an opinion about it. */
export type Subject = { name: string; validate: (path: string, text: string) => Verdict };

/**
 * The subjects an estate node has, in the order a person would want to hear about them.
 *
 * `rendering` reads the path alone, so it runs first and costs nothing when it does not apply.
 * `manifest` needs the text the write would produce.
 */
export const SUBJECT_NAMES = ["rendering", "manifest"] as const;

const PROVIDERS = resolve(import.meta.dirname, "..", "..", "providers");

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
  const found: Subject[] = [];
  for (const name of SUBJECT_NAMES) {
    for (const instance of instances()) {
      try {
        const module = await import(join(PROVIDERS, instance, "scripts", "checks", `${name}.ts`));
        if (typeof module.validate === "function") found.push({ name: `${name}:${instance}`, validate: module.validate });
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
export const pathOnly = (name: string): boolean => name.startsWith("rendering:");
