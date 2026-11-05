#!/usr/bin/env node
// Refuse a migration write that breaks the SQL grammar, at the moment it is written.
//
// It watches `**/migrations/*.ts`, reads the module's code from the package folder, calls the shared rules
// (plugin-support-lib sql-grammar.ts) and denies only findings the write itself introduces, so a migration
// already in a repository is never judged unless it is edited. Four rules, each named in its denial:
// TABLE, SCHEMA, ENUM · INDEX · JSON, AUDIT TAIL.
//
// There is no scan: Q14 A has the check read only SQL being written, never a migration already there.
//
//   hook :  sql-grammar.ts          (PreToolUse JSON on stdin; denies with the rule named)

import { basename } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { inComment, mask, resultingText } from "../../../../../../../plugin-support-lib/src/lib/source.ts";
import { sqlFindings, type SqlFinding } from "../../../../../../../plugin-support-lib/src/lib/sql-grammar.ts";
import { introduced } from "../../../../../scripts/lib/source.ts";

// NAME THE RULE, NEVER ANOTHER PLUGIN'S FILE: the agent has the book's rule loaded and needs its name.
const REF = "The grammar is the book's: a table is `{module}_{entity}` in its owner's schema, an index is " +
  "`idx_{table}_…`, and the audit tail comes last (rules RULE.SUPPORT.APPS.251 · RULE.SUPPORT.APPS.254).";

const slashed = (path: string) => path.split("\\").join("/");

/** A migration of a module: a `.ts` file directly in a `migrations` folder. */
export const watched = (path: string) => /\/migrations\/[^/]+\.ts$/.test(slashed(path));

/** The module's code from its package folder (`module-server-job-ts` is `job`), or null. */
export function moduleOf(path: string): string | null {
  const folder = /\/module-server-([a-z][a-z0-9]{1,7})-[a-z]+\//.exec(slashed(path));
  return folder ? folder[1] : null;
}

/** Every finding the shared rules see in the text this migration would hold, outside its comments. */
export function check(path: string, source: string): SqlFinding[] {
  const masked = mask(source);
  return sqlFindings(source, { module: moduleOf(path) }).filter((item) => !inComment(masked, item.region[0]));
}

/** The verdict for one write, given text already read by the subject. Called alone and by the dispatcher. */
export function verdict(path: string, source: string | null, added: string | null): Verdict {
  if (source === null) return null;
  let found: SqlFinding[];
  try {
    found = check(path, source).filter((item) => introduced(source, item.region, added));
  } catch {
    return null;                     // a parse this check cannot do allows, never blocks
  }
  if (!found.length) return null;
  const lines = [`Denied — the SQL grammar. ${found.length} finding(s) in ${basename(path)}:`];
  for (const item of found) lines.push(`  [${item.rule}] ${item.message}`);
  lines.push(`  ${REF}`);
  return { deny: lines.join("\n") };
}

/** The verdict for one write, parsed here. Called alone; the dispatcher goes through a subject. */
export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  if (!watched(path)) return null;
  const [source, added] = resultingText(input, path);
  return verdict(path, source, added);
}

export const CHECK = { name: "sql-grammar", run, watched };

if (runAlone("sql-grammar.ts")) {
  const event = (await payload()) as Payload | null;
  emit(event ? run(event.tool_input ?? {}) : null);
  process.exit(0);
}
