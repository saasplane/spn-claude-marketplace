#!/usr/bin/env node
// RESTATES: the `N71` tree. The arc is the source of truth for the shape; this file only measures
// against it.
//
// The shape it measures: a ref sits at domain, then group, then a file named for a construct, and
// the book's matching chapter sits at seat, then numbered domain, then numbered group, then a
// numbered chapter. The numbers drop, because the book is read in order and a ref is looked up.
//
// What a plugin's refs cover, and what they do not.
//
// **A REF IS NAMED FOR A CONSTRUCT, SO COVERAGE IS COUNTABLE.** The book states a fixed set of
// constructs per group. A plugin picks the ones its readers need. Without this file the picking is
// invisible: an absent ref looks exactly like a group nobody has reached yet, and both look like
// nothing at all.
//
// **COVERAGE IS REPORTED PER GROUP, NEVER AS ONE NUMBER.** One percentage over a plugin averages a
// group that is complete with a group that is empty, and the average is true of neither. A reader
// deciding whether to trust the apps model wants the apps row, not the plugin's mean.
//
//     node refs-readme.ts <workspace>            write every plugin's refs/README.md
//     node refs-readme.ts <workspace> --check    report what would change, write nothing
//
// **THE BOOK IS FOUND, NEVER ASSUMED.** Run from a partner's checkout there is no book, and then
// there is nothing to measure against — it says so and exits clean rather than reporting a plugin
// as empty. That is the same stance `restate-drift.ts` takes, and for the same reason: a builder's
// gate that fails for a partner is a gate a partner turns off.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

/** `01-apps` → `apps`. The book numbers because it is read in order; a ref is looked up. */
const bare = (name: string): string => name.replace(/^\d+-/, "");

const dirs = (at: string): string[] =>
  existsSync(at) ? readdirSync(at).filter((e) => statSync(join(at, e)).isDirectory()) : [];

const chapters = (at: string): string[] =>
  existsSync(at) ? readdirSync(at).filter((e) => e.endsWith(".md") && e !== "README.md") : [];

type Row = {
  group: string;
  /** Refs whose name matches a construct the book states. */
  covers: string[];
  /** Constructs the book states and this plugin does not restate. */
  gaps: string[];
  /** Refs that match no construct — a rule cutting across the group rather than restating one. */
  across: string[];
};

/**
 * What the book states for one `<domain>/<group>` pair, found by walking the areas.
 *
 * The book divides by area above the domain and no plugin does, so the area is searched rather
 * than named: a ref folder says `support/apps` and the book says `02-support/01-apps` under
 * `02-constructs`. Returning zero means the pair names nothing the book has, which is itself the
 * finding — a ref filed under a group that does not exist.
 */
function statesFor(book: string, domain: string, group: string): string[] {
  const seat = join(book, "docs", "02-constructs");
  for (const area of dirs(seat)) {
    if (bare(area) !== domain) continue;
    for (const g of dirs(join(seat, area))) {
      if (bare(g) === group) return chapters(join(seat, area, g)).map(bare).map((f) => f.replace(/\.md$/, ""));
    }
    // A domain whose constructs are files directly under it, with no group level.
    const flat = chapters(join(seat, area)).map(bare).map((f) => f.replace(/\.md$/, ""));
    if (flat.length && group === bare(area)) return flat;
  }
  return [];
}

function rowsFor(pluginRefs: string, book: string): Row[] {
  const rows: Row[] = [];
  for (const domain of dirs(pluginRefs).sort()) {
    const domainAt = join(pluginRefs, domain);
    const groups = dirs(domainAt);
    if (!groups.length) {
      // A domain with refs directly under it — `lenses/` is the standing example, and it is by
      // ROLE rather than by construct, so the book states nothing to measure it against.
      const here = chapters(domainAt);
      if (here.length) rows.push({ group: domain, covers: [], gaps: [], across: here.map((f) => f.replace(/\.md$/, "")).sort() });
      continue;
    }
    for (const group of groups.sort()) {
      const picked = chapters(join(domainAt, group)).map((f) => f.replace(/\.md$/, ""));
      const states = statesFor(book, domain, group);
      // MATCHED BY NAME, NEVER BY COUNT. A ref named for no construct is not surplus coverage —
      // it is a rule that cuts ACROSS the group, which the tree allows and a count cannot see.
      // Counting alone reports `10 of 9`, which is both wrong and unreadable.
      rows.push({
        group: `${domain}/${group}`,
        covers: picked.filter((n) => states.includes(n)).sort(),
        gaps: states.filter((n) => !picked.includes(n)).sort(),
        across: picked.filter((n) => !states.includes(n)).sort(),
      });
    }
  }
  return rows;
}

function render(plugin: string, rows: Row[]): string {
  const total = rows.reduce((n, r) => n + r.covers.length + r.across.length, 0);
  let out = `<!-- spn:generated refs-readme — do not edit inside these markers; \`refs-readme.ts\` writes it -->\n`;
  out += `# ${plugin} — what these refs cover\n\n`;
  out += `A ref is a self-contained leaf, named for a construct the book states. **This plugin ships ${total}.**\n\n`;
  out += `**Coverage is per group, never one number.** One figure over a plugin averages a complete group with an empty one, and is true of neither.\n\n`;
  out += `| Group | Covers | Cuts across | Not restated |\n| --- | --- | ---: | ---: |\n`;
  for (const r of rows) {
    const states = r.covers.length + r.gaps.length;
    const covers = states === 0 ? "— by role, not by construct" : `${r.covers.length} of ${states} constructs`;
    out += `| \`${r.group}\` | ${covers} | ${r.across.length || "—"} | ${r.gaps.length || "—"} |\n`;
  }
  out += `\n**A ref that cuts across restates no single construct** — it carries a rule the whole group obeys, which is why it has no chapter to be named for.\n\n`;
  const gaps = rows.filter((r) => r.gaps.length);
  if (gaps.length) {
    out += `**What is not restated, and that is a choice rather than an oversight.** A construct earns a ref when a reader here needs it; one whose rules a skill already carries would be a second home for them.\n\n`;
    for (const r of gaps) out += `- \`${r.group}\` — ${r.gaps.map((n) => `\`${n}\``).join(" · ")}\n`;
  } else {
    out += `**Every construct the book states in these groups has a ref.**\n`;
  }
  out += `\n<!-- /spn:generated -->\n`;
  return out;
}

export function main(workspace: string, check = false): number {
  const book = join(workspace, "spn-foundation");
  if (!existsSync(join(book, "docs", "02-constructs"))) {
    console.log("no foundation book here — nothing to measure refs against, and the shipped READMEs stand");
    return 0;
  }
  const plugins = join(workspace, "spn-claude-marketplace", "plugins");
  if (!existsSync(plugins)) { console.log("no plugins here"); return 0; }

  let changed = 0;
  for (const plugin of dirs(plugins).sort()) {
    const refs = join(plugins, plugin, "src", "refs");
    if (!existsSync(refs)) continue;
    const body = render(plugin, rowsFor(refs, book));
    const at = join(refs, "README.md");
    const now = existsSync(at) ? readFileSync(at, "utf8") : "";
    if (now === body) { console.log(`current  ${plugin}/src/refs/README.md`); continue; }
    if (check) { changed += 1; console.log(`would write  ${plugin}/src/refs/README.md`); continue; }
    writeFileSync(at, body);
    console.log(`wrote    ${plugin}/src/refs/README.md`);
  }
  // WRITING IS SUCCESS, and only --check reports staleness through the exit code. A generator that
  // exits non-zero after writing correctly fails every build that regenerates as a step — and it
  // makes `generate && verify` unwritable, which is the shape every caller wants.
  return changed;
}

if (process.argv[1] && basename(process.argv[1]) === "refs-readme.ts") {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  process.exit(Math.min(main(args.find((a) => !a.startsWith("-")) ?? process.cwd(), check), 250));
}
