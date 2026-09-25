#!/usr/bin/env node
// The action surface, and what claims it.
//
//     node action-coverage.ts [--report] [root]
//
// **Every published API action is an interaction** — performed by a person through a browser, or by
// another system through the generated client. So the API's own surface is the behaviour surface,
// and it is the thing coverage should be measured against.
//
// That is a correction to measuring coverage by ROUTE. A route is where a screen lives; it says
// nothing about what can be done there. `/settings/groups` is one route and the group entity carries
// create, update, activate/deactivate, role-grant and role-revoke behind it. Counting routes reports
// that screen as covered while five of its six actions have never been performed by anything.
//
// It reads two things and compares them:
//
//     actions    every `@SPAPIRouteCommand` a node's source declares
//     rows       every behaviour row in every register in the repository
//
// It reports what nothing claims. A `POST /group/active` that no row mentions is an action nobody
// has said a persona can perform — so no case exists on either surface, and neither the browser nor
// the client is proving it.
//
// **It finds an action by the DECORATOR, never by a path.** The glob this replaces read
// `packages/module-server-*/src/entry/api/controllers/*.ts`, which is one stack's folder shape
// written into a tool. It also missed a whole module: an app may own one, and the project module
// lives at `apps/service-platform-ts/src/modules/project` — so its published actions were never
// measured, and nothing said so. The decorator IS the declaration, so looking for it needs no
// folder shape and finds a module wherever it is kept.
//
// **A module names itself in its own manifest.** The code comes from the nearest `spkind.json`'s
// `config.code` rather than from a folder called `module-server-iam-ts`, so a rename of the package
// does not silently rename a module in this report.
//
// **A register is found by its HEADER**, the same eight headings `behaviour-rows` writes into, which
// is what decouples this tool from where the documents live.
//
// **A designed absence is named by a `NEGATIVE` row, read from the cell that declares it.** An
// org-type auth policy arrives by migration and can only be modified: there is no create and no
// delete, and that is the construct rather than an omission. The version this replaces guessed at
// that by looking for the word *cannot* at the start of an English sentence. The row now carries a
// `Type`, so the tool reads the declaration instead.
//
// **What is deliberately NOT here: the surface pairing.** Reporting which API rows a person is told
// they may do and has no screen to do it on needs to know whether a persona is a person or a
// system, and today nothing declares it — the two word lists that used to guess it from English are
// dropped rather than carried. That half returns when the personas table says how each persona
// reaches the platform.
//
// Exit code is 1 when a state action has no row, so a pipeline can gate on it. `--report` reports
// the same thing and exits 0.

import { readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { inComment, isDir, isFile, mask, read } from "../lib/source.ts";
import { cellsOf, isHeader, isUnderline } from "../lib/register.ts";

const SKIP = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage", ".output"]);

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try { entries = readdirSync(dir).sort(); } catch { return; }
  for (const entry of entries) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) yield* walk(full);
    else yield full;
  }
}

// ── The action surface ────────────────────────────────────────────────────────────────────────

/** A published action, as its controller declares it. */
interface ApiAction {
  method: string;
  path: string;
  /** The module code, from the nearest node manifest — `IAM`, `PRJ`. */
  module: string;
  /** True when the action moves an entity between states rather than creating or editing one. */
  stateful: boolean;
}

/**
 * Actions that change what an entity IS rather than what it holds.
 *
 * These are the ones a UI expresses as a row action or a switch, and the ones a behaviour register
 * most often forgets: everybody writes a row for *create* and nobody writes one for *deactivate*.
 */
const STATE_SEGMENTS = /\/(active|delete|revoke|resend|verify|reset|disable|enable|archive|restore|suspend)$/;

const DECORATOR = /@SPAPIRouteCommand\(\s*'([A-Z]+)'\s*,\s*'([^']+)'/g;

/**
 * The module code the node above this file declares, or `?` where no manifest does.
 *
 * The walk stops at the repository root, so a file outside every node answers `?` rather than
 * borrowing a code from somewhere further up the machine — the same stop `nodeKind` makes.
 */
const codeCache = new Map<string, string>();
function codeOf(file: string, root: string): string {
  const start = dirname(resolve(file));
  const seen: string[] = [];
  let here = start;
  for (;;) {
    const cached = codeCache.get(here);
    if (cached !== undefined) {
      for (const dir of seen) codeCache.set(dir, cached);
      return cached;
    }
    seen.push(here);
    const text = read(join(here, "spkind.json"));
    if (text !== null) {
      let code = "?";
      try { code = (JSON.parse(text) as { config?: { code?: string } }).config?.code ?? "?"; } catch { code = "?"; }
      const upper = code.toUpperCase();
      for (const dir of seen) codeCache.set(dir, upper);
      return upper;
    }
    const up = dirname(here);
    if (isFile(join(here, "sprepo.json")) || isDir(join(here, ".git")) || here === resolve(root) || up === here) {
      for (const dir of seen) codeCache.set(dir, "?");
      return "?";
    }
    here = up;
  }
}

function apiActions(root: string): ApiAction[] {
  const actions: ApiAction[] = [];
  for (const file of walk(root)) {
    if (!file.endsWith(".ts")) continue;
    const source = read(file);
    if (source === null || !source.includes("@SPAPIRouteCommand")) continue;
    // A decorator inside a comment is a route somebody took out, or an example in a doc block. It
    // is not published, and counting it would report an action nothing serves as uncovered.
    const masked = mask(source);
    for (const match of source.matchAll(DECORATOR)) {
      if (inComment(masked, match.index)) continue;
      actions.push({
        method: match[1],
        path: match[2],
        module: codeOf(file, root),
        stateful: STATE_SEGMENTS.test(match[2]),
      });
    }
  }
  return actions.sort((a, b) => `${a.module}${a.path}`.localeCompare(`${b.module}${b.path}`));
}

// ── What the registers claim ──────────────────────────────────────────────────────────────────

/**
 * One behaviour row, in the two cells a claim is read from.
 *
 * `Id`, `Tier`, `Status` and `Updated at` are not read here. This tool asks whether ANY row claims
 * an action, and which row it was does not change the answer — `behaviour-rows` owns the cells that
 * say what a run found.
 */
interface Row {
  /** `POSITIVE` or `NEGATIVE` — whether the row asserts the thing works, or that it is refused. */
  type: string;
  /** `Who`, `Does` and `Sees` as one lowercase string, which is what a claim is matched against. */
  sentence: string;
}

function rows(root: string): { rows: Row[]; files: number } {
  const found: Row[] = [];
  let files = 0;
  for (const file of walk(root)) {
    if (!file.endsWith(".md")) continue;
    const body = read(file);
    if (body === null || !body.includes("|")) continue;
    let carried = false;
    let inTable = false;
    for (const line of body.split("\n")) {
      if (isHeader(line)) { inTable = true; continue; }
      const cells = cellsOf(line);
      if (!inTable) continue;
      if (cells === null) { inTable = false; continue; }
      if (isUnderline(cells)) continue;
      carried = true;
      found.push({
        type: cells[4].trim().toUpperCase(),
        sentence: `${cells[1]} ${cells[2]} ${cells[3]}`.replace(/\*\*/g, "").toLowerCase(),
      });
    }
    if (carried) files += 1;
  }
  return { rows: found, files: files };
}

// ── Whether any row reads as claiming an action ───────────────────────────────────────────────

/**
 * The words a row uses for an action, one list per verb the path can end in.
 *
 * **Deliberately generous**: it matches on the action's own verb and its entity noun appearing
 * together in a row's sentence. A generous test is right here because a false MATCH understates the
 * gap by one row, while a false miss would cry wolf on a register that is actually complete — and a
 * gate nobody believes gets switched off.
 */
const VERB_WORDS: Record<string, string[]> = {
  active: ["activate", "deactivate", "turn off", "turn on", "open or close", "close", "enable", "disable", "suspend"],
  delete: ["delete", "remove", "revoke", "forget"],
  revoke: ["revoke", "forget"],
  resend: ["resend", "send again"],
  verify: ["verify", "confirm", "prove"],
  reset: ["reset"],
};

const isClaimed = (action: ApiAction, all: Row[]): boolean => {
  const segments = action.path.split("/").filter(Boolean);
  const verb = segments[segments.length - 1];
  const words = VERB_WORDS[verb] ?? [verb];
  // The entity noun, singularised crudely — `principal/factor/delete` is about a factor.
  const noun = (segments.length > 1 ? segments[segments.length - 2] : segments[0]).replace(/-/g, " ");
  return all.some((row) => words.some((word) => row.sentence.includes(word)) && row.sentence.includes(noun));
};

// ── What each entity's action set is, and therefore what it deliberately is NOT ────────────────

/**
 * The words a `NEGATIVE` row uses for an action that is absent by design — one list per column of
 * the shape table. Generous on purpose, like `VERB_WORDS`: a row wrongly read as naming an absence
 * hides one line of a report, while a row wrongly read as silent sends somebody to write a row
 * twice.
 */
const VERBS = ["create", "update", "active", "delete"];

const ABSENCE_WORDS: Record<string, string[]> = {
  create: ["create", "add", "mint", "register", "make", "new"],
  update: ["update", "edit", "rename", "change"],
  active: ["deactivate", "switch", "pause", "suspend", "retire", "turn", "active"],
  delete: ["delete", "remove"],
};

/** A tail that names a verb, and the verb it names. */
const KNOWN_TAILS: Record<string, string> = {
  update: "update",
  active: "active",
  delete: "delete",
  search: "search",
  revoke: "revoke",
  resend: "resend",
  verify: "verify",
  reset: "reset",
  // `request` is how a vanity domain is created — the edge has to act before the row exists — so it
  // reads as that entity's create.
  request: "create",
};

/**
 * What each entity's action set actually is — and therefore what it deliberately is NOT.
 *
 * **An absent action is a designed fact, not a gap in the API.** An org-type auth policy arrives by
 * migration and can only be modified; there is no create and no delete, and that is the construct
 * rather than an omission. An org auth provider can be added, edited and deactivated, and never
 * deleted.
 *
 * Each of those absences is a use case of the module and owes a behaviour row saying so — a
 * `NEGATIVE` row, in the same grammar as the `POSITIVE` one beside it. Without it, nothing
 * distinguishes "this cannot be created, by design" from "nobody has built create yet", and no test
 * protects the difference. Printing the shape is what makes the absence visible enough to write a
 * row about.
 */
function reportShapes(actions: ApiAction[], all: Row[]): void {
  const shapes = new Map<string, Set<string>>();
  for (const action of actions) {
    if (action.method !== "POST") continue;
    const segments = action.path.split("/").filter(Boolean);
    const tail = segments[segments.length - 1];
    const entity = tail in KNOWN_TAILS ? segments.slice(0, -1).join("/") : segments.join("/");
    shapes.set(entity, (shapes.get(entity) ?? new Set()).add(KNOWN_TAILS[tail] ?? "create"));
  }
  // A lifecycle entity is one that can be brought into being or taken out of it. Anything with only
  // `create` is a command rather than a record, and has no shape worth reporting.
  const lifecycle = [...shapes.entries()]
    .filter(([, verbs]) => verbs.has("update") || verbs.has("active") || verbs.has("delete"))
    .sort();
  console.log(`\nentity action shapes · ${lifecycle.length} entities carry a lifecycle\n`);
  // Centred in a column of one width, so a dash sits under the verb it is an absence of. The
  // version this replaces wrote a 6-wide mark under an 8-wide heading, and by `delete` the columns
  // had slipped far enough that the table's one job — which verb is missing — took counting.
  const column = (text: string): string => text.padStart(Math.floor((8 + text.length) / 2)).padEnd(8);
  console.log(`  ${"entity".padEnd(38)}${VERBS.map(column).join("")}`);
  console.log(`  ${"-".repeat(38)}${VERBS.map(() => " ------ ").join("")}`);
  for (const [entity, verbs] of lifecycle) {
    console.log(`  ${entity.padEnd(38)}${VERBS.map((verb) => column(verbs.has(verb) ? "·" : "—")).join("")}`);
  }
  console.log(
    "\n  A dash is a designed absence and owes a row that says so — a NEGATIVE row, in the same" +
    "\n  grammar as the POSITIVE one beside it. Nothing else distinguishes \"by design\" from" +
    "\n  \"not built yet\"."
  );

  // Which dashes a NEGATIVE row names. Read the same generous way `isClaimed` reads a claim: the
  // entity's own noun and a word for the missing verb, anywhere in the row. Reported rather than
  // enforced, because the gate below decides on state actions and this is the other half.
  const denials = all.filter((row) => row.type === "NEGATIVE");
  const unwritten: string[] = [];
  for (const [entity, verbs] of lifecycle) {
    const noun = (entity.split("/").pop() ?? entity).replace(/-/g, " ");
    for (const verb of VERBS) {
      if (verbs.has(verb)) continue;
      const named = denials.some(
        (row) => row.sentence.includes(noun) && ABSENCE_WORDS[verb].some((word) => row.sentence.includes(word))
      );
      if (!named) unwritten.push(`${entity} · ${verb}`);
    }
  }
  if (unwritten.length > 0) {
    console.log(`\n  ${unwritten.length} designed absence(s) that no NEGATIVE row names yet:`);
    for (const absence of unwritten) console.log(`    ${absence}`);
  } else {
    console.log("\n  every dash above is named by a NEGATIVE row in this repository's registers");
  }
}

// ── The run ───────────────────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const reportOnly = argv.includes("--report");
const root = resolve(argv.find((a) => !a.startsWith("--")) ?? ".");

const actions = apiActions(root);
const register = rows(root);
const modules = new Set(actions.map((action) => action.module));
const stateful = actions.filter((action) => action.stateful);
const unclaimed = stateful.filter((action) => !isClaimed(action, register.rows));

console.log(`action surface · ${actions.length} published actions across ${modules.size} module(s)`);
console.log(`               · ${stateful.length} of them move an entity between states`);
console.log(`behaviour rows · ${register.rows.length} declared in ${register.files} register(s)`);

// Nothing found is a different answer from nothing claimed, and saying so is the whole difference
// between "this repository proves none of its actions" and "this tool was pointed somewhere empty".
if (register.files === 0) {
  console.log(
    "\n· no behaviour register found — a register is a table whose eight headings are" +
    "\n  Id · Who · Does · Sees · Type · Tier · Status · Updated at. Every action below is" +
    "\n  therefore unclaimed because nothing has been written yet, not because anything is wrong."
  );
}

reportShapes(actions, register.rows);

if (unclaimed.length === 0) {
  console.log("\n✓ every state action is claimed by a behaviour row");
  process.exit(0);
}

const byModule = new Map<string, ApiAction[]>();
for (const action of unclaimed) byModule.set(action.module, [...(byModule.get(action.module) ?? []), action]);

console.log(`\n✗ ${unclaimed.length} state action(s) that no behaviour row claims:\n`);
for (const [module, list] of [...byModule.entries()].sort()) {
  console.log(`  ${module}`);
  for (const action of list) console.log(`    ${action.method.padEnd(5)} ${action.path}`);
}
console.log(
  "\n  Each is an interaction a person or a system can perform and nothing says who may perform it." +
  "\n  A row makes it claimable; the claim then owes a case at the tier the row declares."
);
process.exit(reportOnly ? 0 : 1);
