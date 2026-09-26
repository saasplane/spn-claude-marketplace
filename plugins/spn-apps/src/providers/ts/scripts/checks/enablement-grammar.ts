#!/usr/bin/env node
// Refuse a write that breaks the enablement grammar, at the moment it is written.
//
// The construct: an enablement answers ONE question about one organization TYPE — what is this type
// offered. A permission answers what a PERSON may do. The full reasoning, the placement rule and the
// three traps this estate actually hit are named in the permission-versus-enablement rule
// plugin. This checks only the part a check CAN check.
//
// Four rules, each named in its own denial:
//
//   1 PREFIX    an enablement code starts with its OWNING module's prefix — `{MOD}_MANAGE_…`.
//               A code carrying another module's prefix collides in the shared catalog.
//   2 VERB      the code's second segment is `MANAGE`. That position is the whole discriminator:
//               a permission is `{MOD}_{FAMILY}_{TIER}`, so a new verb makes the two unreadable.
//   3 NOUN      a multi-value definition is named for its OPTIONS, never its area. Name it for the
//               area and the console shows "Customization" holding a list of entity types.
//   4 ORG TYPE  no hardcoded Set or array of `OrgType` values in a service. That is a product
//               decision written as code — the RD.PLATFORM.033 shape — invisible to the console and
//               changeable only by a release.
//
// **Not checked here, on purpose.** *Every gated method is a write* needs the decorator-to-method
// map, which no single-file write-time hook can build. It belongs in the module's own
// `tests/unit/enablement/authz.spec.ts`, where the gate table and the methods are both in scope.
//
// Scope is by path, and the two halves differ because the shapes differ:
//
//   **/app/utils/authz.ts        rules 2 and 4 — the gate table names enum members, not codes
//   **/migrations/*setup-a*.ts   rules 1, 2 and 3 — the seed carries the code literals
//   **/app/services/*.ts         rule 4 only — a ceiling list in a MIGRATION is correct, and a
//                                hardcoded org-type set in a SERVICE is the trap
//
// It reads the file the write would PRODUCE, never the fragment alone: an Edit carries only its
// replacement, and scoring that fragment is how a hook reports green having checked nothing. It then
// denies only for a finding the write itself introduces, so a pre-existing violation elsewhere in
// the file does not block an unrelated edit.
//
//   hook :  enablement-grammar.ts --stdin       (PreToolUse JSON on stdin; denies with the rule named)
//   scan :  enablement-grammar.ts <path> …      (any folder or repo; prints every finding it can see)

import { basename, resolve } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../scripts/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../scripts/lib/payload.ts";
import { filesUnder, inComment, introduced, mask, read, resultingText } from "../../../../scripts/lib/source.ts";

const ORG_TYPES = new Set([
  "PLATFORM", "ACCOUNT",
  "PLATFORM_ENTERPRISE", "ACCOUNT_ENTERPRISE",
  "PLATFORM_CONSUMER", "ACCOUNT_CONSUMER",
]);

// A selection is named for what it offers. These five name the AREA instead, which is what the
// boolean form is for — so a multi-value definition ending in one of them is rule 3.
const GENERIC = new Set(["CUSTOMIZATION", "MANAGEMENT", "CONFIG", "SETTINGS", "OPTIONS"]);

const COMMENT = "\x01";

// NAME THE RULE, NEVER ANOTHER PLUGIN'S FILE. A path into a sibling plugin breaks the day either
// one is rearranged, and the agent has both loaded anyway — it needs the rule's name, not its
// address.
const REF = "A permission is what a caller may do; an enablement is what an organization has " +
  "turned on. A gate that reads an enablement to decide authority has confused the two " +
  "(decisions RD.PLATFORM.033 · RD.PLATFORM.034).";

export type Region = [number, number];
export type Finding = { rule: string; region: Region; message: string };

/** The `{ … }` literal that directly contains `index`, or null. */
export function enclosingObject(masked: string, index: number): Region | null {
  let depth = 0;
  let start: number | null = null;
  for (let i = index - 1; i >= 0; i -= 1) {
    const char = masked[i];
    if (char === "}") depth += 1;
    else if (char === "{") {
      if (depth === 0) { start = i; break; }
      depth -= 1;
    }
  }
  if (start === null) return null;
  depth = 0;
  for (let i = start; i < masked.length; i += 1) {
    const char = masked[i];
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return [start, i + 1];
    }
  }
  return null;
}

/** The region from `start` (which holds `opener`) to its matching `closer`, or null. */
export function balanced(masked: string, start: number, opener: string, closer: string): Region | null {
  let depth = 0;
  for (let i = start; i < masked.length; i += 1) {
    const char = masked[i];
    if (char === opener) depth += 1;
    else if (char === closer) {
      depth -= 1;
      if (depth === 0) return [start, i + 1];
    }
  }
  return null;
}

// ---------------------------------------------------------------- path scope

const slashed = (path: string) => path.split("\\").join("/");

export const isAuthz = (path: string) => slashed(path).endsWith("/app/utils/authz.ts");

export function isSeed(path: string): boolean {
  const p = slashed(path);
  const base = basename(p);
  return p.includes("/migrations/") && base.endsWith(".ts") && base.includes("setup-a");
}

export function isService(path: string): boolean {
  const p = slashed(path);
  return p.includes("/app/services/") && p.endsWith(".ts");
}

export const watched = (path: string) => isAuthz(path) || isSeed(path) || isService(path);

const MODULE_FROM_SOURCE = [
  /\bexport\s+const\s+([A-Z][A-Z0-9]*)_AUTHZ\b/,
  /\b([A-Z][A-Z0-9]*)_ENABLEMENT_(?:SEED|DEFINITION_IDS)\b/,
  /\b([A-Z][A-Z0-9]{1,7})EnablementType\b/,
];

/**
 * The module a file belongs to, by its own evidence first.
 *
 * The folder is the least reliable witness: the sample module lives in `src/modules/project/` and
 * its codes are prefixed `PRJ`. So the file's own symbols are read first, then the migration's name,
 * then the package folder.
 */
export function moduleOf(path: string, source: string): string | null {
  for (const pattern of MODULE_FROM_SOURCE) {
    const found = pattern.exec(source);
    if (found) return found[1];
  }
  const base = basename(path);
  const named = /^\d+-([a-z][a-z0-9]{1,7})-setup-/.exec(base);
  if (named) return named[1].toUpperCase();
  const folder = /\/module-server-([a-z][a-z0-9]{1,7})-[a-z]+\//.exec(slashed(path));
  if (folder) return folder[1].toUpperCase();
  return null;
}

// ---------------------------------------------------------------- the four rules

const CODE_LITERAL = /\bcode\s*:\s*['"]([A-Z][A-Z0-9_]*)['"]/g;
const FIELD_MULTI = /\b(?:fieldType|mtype)\s*:\s*['"]([A-Z_]*_MULTI)['"]/;
const ENABLEMENT_ALIAS = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Z][A-Z0-9]{1,7}EnablementType)\b/g;
const ENABLEMENT_TYPE = /\b([A-Z][A-Z0-9]{1,7}EnablementType)\b/g;
const ORG_MEMBER = /\bOrgType\s*\.\s*([A-Z_]+)\b/g;
const ORG_QUOTED = /['"](PLATFORM|ACCOUNT|PLATFORM_ENTERPRISE|ACCOUNT_ENTERPRISE|PLATFORM_CONSUMER|ACCOUNT_CONSUMER)['"]/g;

const finding = (rule: string, region: Region, message: string): Finding => ({ rule, region, message });

/** Python's `str.capitalize`: first character upper, every other one LOWER. */
const capitalize = (word: string) => word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();

/**
 * Rules 1, 2 and 3 — over the enablement definitions a seed migration carries.
 *
 * A definition is told from a permission row by its own shape: the object holding the `code` also
 * holds `orgTypes`, the ceiling. Nothing else in these migrations carries both.
 */
export function seedFindings(path: string, source: string, masked: string, module: string | null): Finding[] {
  const out: Finding[] = [];
  for (const match of source.matchAll(CODE_LITERAL)) {
    if (inComment(masked, match.index)) continue;
    const obj = enclosingObject(masked, match.index);
    if (obj === null) continue;
    const body = source.slice(obj[0], obj[1]);
    const bodyMasked = masked.slice(obj[0], obj[1]);
    if (!/\borgTypes\s*:/.test(bodyMasked.split(COMMENT).join(" "))) continue;  // a permission row
    const code = match[1];
    const segments = code.split("_");
    const region: Region = [match.index, match.index + match[0].length];

    if (module && !code.startsWith(`${module}_`)) {
      out.push(finding("PREFIX", region,
        `Enablement code \`${code}\` does not start with its own module's prefix \`${module}_\`. ` +
        "A code carries the prefix of the module that OWNS the question. A module supplying an " +
        "OPTION to another module's question appends to that definition's VALUES instead — it " +
        "never mints a code under someone else's prefix."));
    } else if (segments.length < 3 || segments[1] !== "MANAGE") {
      out.push(finding("VERB", region,
        `Enablement code \`${code}\` does not read \`${module ?? "{MOD}"}_MANAGE_{NOUN}\`. ` +
        "`MANAGE` in the second position is the whole discriminator: a permission is " +
        "`{MOD}_{FAMILY}_{TIER}`, so a new verb makes the two unreadable and fragments the " +
        "vocabulary. There is no amount form either — a quota is billing's, not an enablement's."));
    }

    const multi = FIELD_MULTI.exec(body);
    if (multi && segments.length && GENERIC.has(segments[segments.length - 1])) {
      out.push(finding("NOUN", region,
        `\`${code}\` is a multi-value definition (\`${multi[1]}\`) named after its AREA. ` +
        "A boolean names the area; a SELECTION names its options. Named this way the console " +
        `shows "${capitalize(segments[segments.length - 1])}" holding a list of options, and ` +
        "whoever flips the cell cannot tell what they are choosing. Name it for what it offers."));
    }
  }
  return out;
}

/**
 * Rule 2 at the gate site — an enablement enum MEMBER begins `MANAGE_`.
 *
 * The gate table names members through an alias (`const E = PRJEnablementType`), so the aliases are
 * resolved from the file rather than assumed.
 */
export function authzFindings(path: string, source: string, masked: string): Finding[] {
  const aliases = new Set<string>();
  for (const found of source.matchAll(ENABLEMENT_ALIAS)) { aliases.add(found[1]); aliases.add(found[2]); }
  for (const found of source.matchAll(ENABLEMENT_TYPE)) aliases.add(found[1]);
  if (!aliases.size) return [];
  const escaped = [...aliases].sort().map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`\\b(${escaped.join("|")})\\s*\\.\\s*([A-Za-z_][\\w]*)\\b`, "g");
  const out: Finding[] = [];
  for (const match of source.matchAll(pattern)) {
    if (inComment(masked, match.index)) continue;
    const member = match[2];
    if (member.startsWith("MANAGE_")) continue;
    out.push(finding("VERB", [match.index, match.index + match[0].length],
      `Enablement member \`${match[1]}.${member}\` does not begin \`MANAGE_\`, so its code ` +
      "does not read `{MOD}_MANAGE_{NOUN}`. `MANAGE` in the second position is what tells " +
      "an enablement from a permission (`{MOD}_{FAMILY}_{TIER}`). Rename the member and " +
      "its code together, and fold the rename into the seed migration rather than adding one."));
  }
  return out;
}

const sameSet = (a: Set<string>, b: Set<string>) =>
  a.size === b.size && [...a].every((value) => b.has(value));

/**
 * Rule 4 — a hardcoded Set or array of `OrgType` values in a service or a gate table.
 *
 * Three shapes, all of them the same product decision written as code. A complete enumeration of
 * every type is left alone: it gates nothing. So is `Record<OrgType, …>`, which is exhaustive by the
 * type system rather than a subset somebody chose.
 */
export function orgTypeFindings(path: string, source: string, masked: string): Finding[] {
  const out: Finding[] = [];
  const seen = new Set<string>();

  const members = (region: Region) => new Set(
    [...source.slice(region[0], region[1]).matchAll(ORG_MEMBER)]
      .map((m) => m[1]).filter((m) => ORG_TYPES.has(m)));
  const quoted = (region: Region) => new Set(
    [...source.slice(region[0], region[1]).matchAll(ORG_QUOTED)]
      .map((m) => m[1]).filter((m) => ORG_TYPES.has(m)));
  const pick = (region: Region) => { const m = members(region); return m.size ? m : quoted(region); };

  const report = (region: Region, found: Set<string>, shape: string): void => {
    const key = `${region[0]}:${region[1]}`;
    if (seen.has(key) || !found.size || sameSet(found, ORG_TYPES)) return;
    seen.add(key);
    const listed = [...found].sort().join(", ");
    out.push(finding("ORG TYPE", region,
      `A hardcoded ${shape} of organization types (${listed}) in ${basename(path)}. ` +
      "No module gates by organization type on its own authority (RD.PLATFORM.033). Which types are " +
      "offered a capability is a PRODUCT decision, authored as an enablement cell the platform " +
      "console can show and change — not a literal a release has to move. Register a " +
      "`{MOD}_MANAGE_{NOUN}` definition and check it with `assertEnabled`, or `assertAllows` " +
      "where the answer is a value."));
  };

  // `new Set([...])` — the shape the estate actually hit, in IAMOrgService.updateOrgSubdomain.
  for (const match of masked.matchAll(/\bnew\s+Set\s*\(/g)) {
    if (inComment(masked, match.index)) continue;
    const region = balanced(masked, match.index + match[0].length - 1, "(", ")");
    if (region === null) continue;
    report([match.index, region[1]], pick(region), "Set");
  }

  // A const annotated with `OrgType` and initialized to a list. `Record<OrgType, …>` is exempt: an
  // exhaustive map keyed by the type is not a subset anyone chose.
  for (const match of masked.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*:\s*([^=;\n]*OrgType[^=;\n]*)=\s*/g)) {
    if (inComment(masked, match.index) || match[2].includes("Record<")) continue;
    const after = match.index + match[0].length;
    if (source.slice(after, after + 1) !== "[") continue;
    const region = balanced(masked, after, "[", "]");
    if (region === null) continue;
    report([match.index, region[1]], pick(region), "array");
  }

  // An inline list asked for membership — `[OrgType.A, OrgType.B].includes(org.orgType)`.
  for (const match of masked.matchAll(/\[/g)) {
    if (inComment(masked, match.index)) continue;
    const region = balanced(masked, match.index, "[", "]");
    if (region === null) continue;
    const tail = masked.slice(region[1], region[1] + 12);
    if (!/^\s*\.\s*(includes|has)\s*\(/.test(tail)) continue;
    report(region, pick(region), "list");
  }

  return out;
}

/** Every finding a check can see in the text this file would hold. */
export function check(path: string, source: string): Finding[] {
  const masked = mask(source);
  const out: Finding[] = [];
  if (isSeed(path)) out.push(...seedFindings(path, source, masked, moduleOf(path, source)));
  if (isAuthz(path)) out.push(...authzFindings(path, source, masked));
  if (isAuthz(path) || isService(path)) out.push(...orgTypeFindings(path, source, masked));
  return out;
}

// ---------------------------------------------------------------- the hook

/** The verdict for one write, or null. Called alone and by the dispatcher. */
/** The verdict for one write, given text that has ALREADY been parsed by the subject's validator. */
export function verdict(path: string, source: string | null, added: string | null): Verdict {
  if (source === null) return null;
  let found: Finding[];
  try {
    found = check(path, source).filter((item) => introduced(source, item.region, added));
  } catch {
    return null;                     // a parse this check cannot do allows, never blocks
  }
  if (!found.length) return null;
  const lines = [`Denied — the enablement grammar. ${found.length} finding(s) in ${basename(path)}:`];
  for (const item of found) lines.push(`  [${item.rule}] ${item.message}`);
  lines.push(`  ${REF}`);
  return { deny: lines.join("\n") };
}

/** The verdict for one write, parsed here. Called alone; the dispatcher goes through a subject. */
export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  if (!path.endsWith(".ts") || !watched(path)) return null;
  const [source, added] = resultingText(input, path);
  return verdict(path, source, added);
}

export function scan(paths: string[]): number {
  let total = 0;
  for (const target of filesUnder(paths)) {
    if (!target.endsWith(".ts") || !watched(target)) continue;
    const source = read(target);
    if (source === null) continue;
    for (const item of check(target, source)) {
      total += 1;
      console.log(`${target}: [${item.rule}] ${item.message}`);
    }
  }
  console.log(`\n${total} enablement-grammar finding(s)`);
  return total ? 1 : 0;
}

export const CHECK = { name: "enablement-grammar", run, watched };

if (runAlone("enablement-grammar.ts")) {
  const argv = process.argv.slice(2);
  if (argv.includes("--stdin")) {
    const event = (await payload()) as Payload | null;
    emit(event ? run(event.tool_input ?? {}) : null);
    process.exit(0);
  }
  const paths = argv.filter((a) => a !== "--stdin");
  process.exit(scan(paths.length ? paths : ["."]));
}
