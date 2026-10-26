// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md § A release carries its migration, and a window runs what is pending first
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// What a migration is, the workspace's ledger of the ones it applied, and where each one stands. The
// `plugin migration` commands, the session-start event and the Stop hook read through this file, so
// the ledger's place and its format are spelled once.
//
// The ledger is only ever appended to, and a ledger that does not read stops every write.

import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { userInfo } from "node:os";
import { dirname, join } from "node:path";
import { withOffset } from "./clock.ts";
import { DEVEX } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";

export const LEDGER = "migrations.jsonl";
export const PLUGIN_NAME = "spn-devex";
/** How a migration was applied: by its script, by the agent's steps, or with nothing to do. */
export const HOW = ["script", "agent", "nothing to do"] as const;
export type How = (typeof HOW)[number];

/** A migration's id: three digits, which order it. */
export const MIGRATION_ID = /^\d{3}$/;

/**
 * One migration as the plugin ships it. `check` names each place still in the old shape, from the
 * workspace root, and names nothing once none is left. `script` is the mechanical part, and returns
 * a line for each thing it moved; `steps` are the agent's, read in order after the script ran.
 * `needsYou` says what the developer looks at before it is applied, where the rewrite needs that.
 */
export type Migration = {
  id: string;
  version: string;
  changed: string;
  check: (root: string) => string[];
  script?: (root: string) => string[];
  steps?: readonly string[];
  needsYou?: string;
};

/** One line of the ledger. */
export type LedgerEntry = { plugin: string; id: string; version: string; at: string; by: string; how: How };

/** The ledger read: every line that holds to the format, and a fault for each one that does not. */
export type Ledger = { entries: LedgerEntry[]; faults: string[] };

/** Where a migration stands in one workspace. */
export type Standing =
  | { migration: Migration; state: "applied"; entry: LedgerEntry; found: [] }
  | { migration: Migration; state: "pending"; entry: null; found: string[] }
  | { migration: Migration; state: "nothing to do"; entry: null; found: [] };

export const ledgerOf = (root: string): string => join(root, DEVEX, LEDGER);

const isText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

/** Each fault one ledger line has against the format. */
export function entryFaults(line: unknown, where: string): string[] {
  if (typeof line !== "object" || line === null || Array.isArray(line)) return [`${where} is not a JSON object`];
  const record = line as Record<string, unknown>;
  const out: string[] = [];
  for (const field of ["plugin", "id", "version", "at", "by"]) if (!isText(record[field])) out.push(`${where} has no \`${field}\``);
  if (isText(record.id) && !MIGRATION_ID.test(record.id)) out.push(`${where}'s \`id\` \`${record.id}\` is not three digits`);
  if (!HOW.includes(record.how as How)) out.push(`${where}'s \`how\` is \`${String(record.how)}\`, and it is one of ${HOW.join(" · ")}`);
  return out;
}

/** The ledger of a workspace. An absent ledger is an empty one: nothing has been applied there yet. */
export function readLedger(root: string): Ledger {
  let text: string;
  try { text = readFileSync(ledgerOf(root), "utf8"); } catch { return { entries: [], faults: [] }; }
  const entries: LedgerEntry[] = [];
  const faults: string[] = [];
  text.split("\n").forEach((raw, at) => {
    if (!raw.trim()) return;
    const where = `${DEVEX}/${LEDGER} line ${at + 1}`;
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { faults.push(`${where} is not JSON`); return; }
    const found = entryFaults(parsed, where);
    if (found.length) faults.push(...found);
    else entries.push(parsed as LedgerEntry);
  });
  return { entries, faults };
}

/** The entry that records one migration of this plugin, or null. */
export const recorded = (ledger: Ledger, id: string, plugin = PLUGIN_NAME): LedgerEntry | null =>
  ledger.entries.find((entry) => entry.plugin === plugin && entry.id === id) ?? null;

/** Who applies a migration: the person the process runs as. */
export function applier(): string {
  try { return process.env.USER || userInfo().username || "unknown"; } catch { return "unknown"; }
}

/**
 * Appends one migration's line. Throws, and writes nothing, where the ledger does not read, so a
 * broken ledger is never written over; and where the migration is recorded already.
 */
export function record(root: string, migration: Migration, how: How, at: Date = new Date(), plugin = PLUGIN_NAME): LedgerEntry {
  const ledger = readLedger(root);
  if (ledger.faults.length)
    throw new Error(`the ledger does not read — ${ledger.faults.join("; ")}. Nothing was written; it is the developer's to mend`);
  if (recorded(ledger, migration.id, plugin)) throw new Error(`${migration.id} is recorded already`);
  const entry: LedgerEntry = { plugin, id: migration.id, version: migration.version, at: withOffset(at), by: applier(), how };
  mkdirSync(dirname(ledgerOf(root)), { recursive: true });
  appendFileSync(ledgerOf(root), `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

/** A check run so that a check that throws reads as a place it could not read, never as a clean one. */
export function runCheck(migration: Migration, root: string): string[] {
  try { return migration.check(root); }
  catch (thrown) { return [`its check could not run: ${thrown instanceof Error ? thrown.message : String(thrown)}`]; }
}

/** Where each migration stands, in id order. A recorded one is never checked again. */
export function standings(root: string, migrations: readonly Migration[], ledger: Ledger = readLedger(root)): Standing[] {
  return [...migrations].sort((a, b) => a.id.localeCompare(b.id)).map((migration): Standing => {
    const entry = recorded(ledger, migration.id);
    if (entry) return { migration, state: "applied", entry, found: [] };
    const found = runCheck(migration, root);
    return found.length ? { migration, state: "pending", entry: null, found } : { migration, state: "nothing to do", entry: null, found: [] };
  });
}

/** How a pending migration is applied, as the words the agent reads. */
export function applyLine(migration: Migration): string {
  const command = `\`spn-devex plugin migration write ${migration.id}\``;
  const done = `\`spn-devex plugin migration write ${migration.id} --steps-done\``;
  if (migration.needsYou)
    return `a needs-you: open your reply with it, naming what it rewrites (${migration.needsYou}), and apply it after the developer's look, then ${done} records it`;
  if (migration.script && !migration.steps?.length) return `run ${command}: it runs the script, checks again and records it`;
  if (migration.script) return `run ${command} for its script, then its steps are your first task, and ${done} records it`;
  return `its steps are your first task, and ${done} records it once its check finds nothing`;
}

/**
 * The lines the session-start event gives the agent, once: each pending migration and how it is
 * applied, each one with nothing to do, and a ledger that does not read. Empty where nothing waits.
 */
export function windowStartLines(root: string, migrations: readonly Migration[]): string[] {
  const ledger = readLedger(root);
  const lines: string[] = [];
  if (ledger.faults.length)
    lines.push(`- **The ledger \`${DEVEX}/${LEDGER}\` does not read** — ${ledger.faults.slice(0, 3).join("; ")}. ` +
      "A needs-you: nothing is recorded until the developer mends it, and no command rewrites it.");
  const standing = standings(root, migrations, ledger);
  for (const one of standing.filter((item) => item.state === "pending")) {
    const { migration, found } = one;
    lines.push(`- **${migration.id}** (${PLUGIN_NAME} ${migration.version}) — ${migration.changed} Its check finds ${found.length} ` +
      `place(s) in the old shape: ${found.slice(0, 3).join(" · ")}${found.length > 3 ? ` · and ${found.length - 3} more` : ""}. ` +
      `How: ${applyLine(migration)}.`);
    for (const [at, step] of (migration.steps ?? []).entries()) lines.push(`  ${at + 1}. ${step}`);
  }
  const idle = standing.filter((item) => item.state === "nothing to do").map((item) => item.migration.id);
  if (idle.length)
    lines.push(`- ${idle.join(", ")}: the check finds nothing in the old shape — \`spn-devex plugin migration write ${idle.join(" ")}\` ` +
      "records it, with nothing to do.");
  return lines;
}

/** What applying migrations printed, and its exit: 0 where each one named is recorded, 1 where one is not. */
export type Applied = { code: 0 | 1; out: string[]; err: string[] };

/**
 * Applies one migration the ledger lacks, and says whether it is recorded now. `stepsDone` is the
 * agent saying it carried out the steps, so a clean check records the agent's work and not an idle pass.
 */
function applyOne(root: string, migration: Migration, out: string[], stepsDone: boolean): boolean {
  let found = runCheck(migration, root);
  if (!found.length) {
    const how: How = stepsDone && (migration.steps?.length || migration.needsYou) ? "agent" : "nothing to do";
    record(root, migration, how);
    out.push(`${migration.id} · recorded · ${how === "agent" ? "by the agent's steps" : "nothing to do"}`);
    return true;
  }
  if (migration.script) {
    for (const line of migration.script(root)) out.push(`${migration.id} · ${line}`);
    found = runCheck(migration, root);
    if (!found.length) {
      const how: How = migration.steps?.length || migration.needsYou ? "agent" : "script";
      record(root, migration, how);
      out.push(`${migration.id} · recorded · ${how === "script" ? "by its script" : "by its script and the agent's steps"}`);
      return true;
    }
  }
  out.push(`${migration.id} · not recorded — its check still finds ${found.length} place(s) in the old shape:`);
  for (const place of found) out.push(`    ${place}`);
  if (migration.needsYou) out.push(`    needs the developer's look: ${migration.needsYou}`);
  for (const [at, step] of (migration.steps ?? []).entries()) out.push(`    ${at + 1}. ${step}`);
  return false;
}

/**
 * Applies the migrations named, walking every migration in id order up to the last one named. One
 * recorded already is passed; one with nothing in the old shape is recorded as it passes; one still
 * pending that was not named stops the walk, because a later migration applies after an earlier one.
 * A ledger that does not read stops it before anything is written.
 */
export function applyMigrations(root: string, migrations: readonly Migration[], named: readonly string[], stepsDone = false): Applied {
  const out: string[] = [];
  const err: string[] = [];
  const ledger = readLedger(root);
  if (ledger.faults.length) {
    err.push(...ledger.faults.map((fault) => `! ${fault} — the ledger is the developer's to mend, and no command rewrites it`), "Nothing was written.");
    return { code: 1, out, err };
  }
  const wanted = new Set(named);
  const last = [...wanted].sort().at(-1) ?? "";
  for (const migration of [...migrations].sort((a, b) => a.id.localeCompare(b.id))) {
    if (migration.id > last) break;
    const entry = recorded(ledger, migration.id);
    if (entry) {
      if (wanted.has(migration.id)) out.push(`${migration.id} · applied already, ${entry.at} by ${entry.by}`);
      continue;
    }
    if (!wanted.has(migration.id) && runCheck(migration, root).length) {
      err.push(`${migration.id} is pending, and it applies before ${last} — \`spn-devex plugin migration show\` says how.`);
      return { code: 1, out, err };
    }
    if (!applyOne(root, migration, out, stepsDone && wanted.has(migration.id))) return { code: 1, out, err };
  }
  return { code: 0, out, err };
}
