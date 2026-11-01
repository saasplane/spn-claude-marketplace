#!/usr/bin/env node
// Refuse a branch on the environment's name, at the moment it is written (MKT.HOOKS.143).
//
// The rule: never branch code on the environment's name. Read a setting named for what it does, set per
// environment by the estate. `env === "production"`, `APP_ENV !== "dev"` and `process.env.NODE_ENV ===
// "staging"` all decide by a name the estate can change, and the code then lies the day an environment is
// renamed or added. A setting such as `isDebug` or `emailsEnabled` says what it does and is set per environment.
//
// It reads the text the write introduces, and only a comparison of `env`, `APP_ENV` or `NODE_ENV` against a
// literal environment name. A comparison against a variable, or of any other setting, is not judged.
//
//   hook :  env-name-branch.ts --stdin        (PreToolUse JSON on stdin; denies with the fix named)

import { basename, resolve } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { resultingText } from "../../../../../../../plugin-support-lib/src/lib/source.ts";

const NAME = "[\"'`](?:production|prod|development|dev|staging|stage|preprod|local|qa|uat|test)[\"'`]";
const SUBJECT = "(?<![\\w$])(?:[\\w$]+\\??\\.)*(?:env|APP_ENV|NODE_ENV)(?![\\w$])";
const OPERATOR = "[!=]==?";
const SUBJECT_FIRST = new RegExp(`(${SUBJECT})\\s*(${OPERATOR})\\s*(${NAME})`, "g");
const NAME_FIRST = new RegExp(`(${NAME})\\s*(${OPERATOR})\\s*(${SUBJECT})`, "g");

const REMEDY = "Read a setting named for what it does, set per environment by the estate: isDebug, " +
  "emailsEnabled, a base URL. Add that setting to the app's config and branch on it, never on the environment's name.";

export function watched(path: string): boolean {
  const normalized = resolve(path).split("\\").join("/");
  return /\.tsx?$/.test(normalized) && !/\.(?:d|test|spec)\.tsx?$/.test(normalized) && normalized.includes("/src/");
}

/** Comments blanked to spaces so a comparison quoted in prose is not judged; offsets and lines stay put. */
function withoutComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\/|(?<![:"'`])\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, " "));
}

/** Every comparison of an environment variable against a literal environment name in this text. */
export function findings(text: string): string[] {
  const body = withoutComments(text);
  const found: string[] = [];
  for (const m of body.matchAll(SUBJECT_FIRST)) found.push(`${m[1]} ${m[2]} ${m[3]}`);
  for (const m of body.matchAll(NAME_FIRST)) found.push(`${m[1]} ${m[2]} ${m[3]}`);
  return [...new Set(found)];
}

/** The verdict for one write, given text that has ALREADY been parsed. */
export function verdict(path: string, source: string | null, added: string | null): Verdict {
  const text = added ?? source;
  if (text === null) return null;
  let found: string[];
  try {
    found = findings(text);
  } catch {
    return null;                     // a parse this check cannot do allows, never blocks
  }
  if (!found.length) return null;
  const lines = [`Denied — ${basename(path)} branches on the environment's name.`];
  for (const item of found) lines.push(`  - ${item}`);
  lines.push(`  ${REMEDY}`);
  return { deny: lines.join("\n") };
}

/** The verdict for one write, parsed here. Called alone; the dispatcher goes through a subject. */
export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  if (!watched(path)) return null;
  let added: string | null;
  try {
    [, added] = resultingText(input, path);
  } catch {
    added = input.content ?? input.new_string ?? null;
  }
  return verdict(path, null, added);
}

export const CHECK = { name: "env-name-branch", run, watched };

if (runAlone("env-name-branch.ts")) {
  const event = (await payload()) as Payload | null;
  emit(event ? run(event.tool_input ?? {}) : null);
  process.exit(0);
}
