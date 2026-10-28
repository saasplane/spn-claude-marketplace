// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md § A release carries its migration, and a window runs what is pending first
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex plugin migration show [--json]     each migration: applied, pending, or nothing to do
//   spn-devex plugin migration check [--json]    exit 1 while one is pending or the ledger does not read
//   spn-devex plugin migration write <id>… [--steps-done]   apply and record, in id order; --steps-done once the agent carried out the steps
//
// `write` is the ledger's only writer, and it applies in id order (`applyMigrations`).

import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import {
  LEDGER, PLUGIN_NAME, type Ledger, type Standing, applyLine, applyMigrations, readLedger, standings,
} from "../../lib/migration.ts";
import { MIGRATIONS } from "../../lib/migrations/index.ts";
import { workspaceOf } from "../../lib/workstream.ts";

export const describe = "the migrations this plugin ships, and the workspace's ledger of the ones it applied";

function rootHere(): string {
  const root = workspaceOf();
  if (!root) throw new UsageFault("is run inside a workspace: a folder holding `.spndevex/`.");
  return root;
}

/** One migration's state in a line. */
function stateLine(one: Standing): string {
  const { migration } = one;
  const head = `${migration.id} · ${PLUGIN_NAME} ${migration.version}`;
  if (one.state === "applied") return `${head} · applied ${one.entry.at} by ${one.entry.by} (${one.entry.how})`;
  if (one.state === "nothing to do") return `${head} · nothing to do — its check finds no old shape; \`write ${migration.id}\` records it`;
  return `${head} · pending — ${one.found.length} place(s) in the old shape`;
}

function faultLines(ledger: Ledger): string[] {
  return ledger.faults.map((fault) => `! ${fault} — the ledger is the developer's to mend, and no command rewrites it`);
}

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length) throw new UsageFault("takes no path.");
  const root = rootHere();
  const ledger = readLedger(root);
  const all = standings(root, MIGRATIONS, ledger);
  if (words.given("json")) {
    console.log(JSON.stringify({ ledger: `.spndevex/${LEDGER}`, faults: ledger.faults,
      migrations: all.map((one) => ({ id: one.migration.id, version: one.migration.version, changed: one.migration.changed,
        state: one.state, applied: one.entry, found: one.found })) }, null, 2));
    return 0;
  }
  for (const one of all) console.log(`${stateLine(one)}\n    ${one.migration.changed}`);
  for (const line of faultLines(ledger)) console.log(line);
  return 0;
}

function check(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length) throw new UsageFault("takes no path.");
  const root = rootHere();
  const ledger = readLedger(root);
  const all = standings(root, MIGRATIONS, ledger);
  const pending = all.filter((one) => one.state === "pending");
  const findings = pending.length + ledger.faults.length;
  if (words.given("json")) {
    console.log(JSON.stringify({ faults: ledger.faults, pending: pending.map((one) => ({ id: one.migration.id, found: one.found, how: applyLine(one.migration) })),
      nothingToDo: all.filter((one) => one.state === "nothing to do").map((one) => one.migration.id) }, null, 2));
    return findings ? 1 : 0;
  }
  for (const line of faultLines(ledger)) console.log(line);
  for (const one of pending) {
    console.log(`${one.migration.id} pending · ${one.migration.changed}`);
    for (const place of one.found) console.log(`    ${place}`);
    console.log(`    how: ${applyLine(one.migration)}`);
  }
  for (const one of all.filter((item) => item.state === "nothing to do"))
    console.log(`note ${one.migration.id} · nothing in the old shape — \`spn-devex plugin migration write ${one.migration.id}\` records it`);
  console.log(findings ? `${findings} finding(s)` : `ok · ${all.length} migration(s), none pending`);
  return findings ? 1 : 0;
}

function write(args: string[]): number {
  const words = readWords(args, { "steps-done": FLAG });
  if (!words.paths.length) throw new UsageFault("needs the id of a migration, as `001`.");
  const known = MIGRATIONS.map((migration) => migration.id);
  for (const id of words.paths)
    if (!known.includes(id)) throw new UsageFault(`knows no migration \`${id}\` — this plugin ships ${known.join(" · ") || "none"}.`);
  const applied = applyMigrations(rootHere(), MIGRATIONS, words.paths, words.given("steps-done"));
  for (const line of applied.out) console.log(line);
  for (const line of applied.err) console.error(line);
  return applied.code;
}

export const actions: Record<string, Action> = {
  show: { describe: "each migration this plugin ships: applied, pending, or nothing to do; with --json, as data", usage: "[--json]", run: show },
  check: { describe: "exit 1 while a migration is pending or the ledger does not read", usage: "[--json]", run: check },
  write: { describe: "apply each migration named and record it in the ledger, in id order; --steps-done once the agent carried out its steps", usage: "<id>… [--steps-done]", run: write },
};
