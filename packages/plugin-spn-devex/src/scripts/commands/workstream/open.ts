// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The commands · § The formats
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream open --file <block.json> --note "<the developer's words>" [--backlog "<the blocker>"]
//
// A workstream opens from the six things the agent must know before it exists: the subject, the goal, why now, what it
// reaches, what the developer wants to see first, and the limits. A block with one missing is refused. Then the next
// number is taken and recorded, the folder and the approach page are written from the block, the first arc is opened
// for what the developer wants to see first, and the developer's words are logged on it.

import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { DEVEX, PLUGIN_TEMPLATES, WORKSTREAM_STATES, workstreamsDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { escapeHtml, titleCase, workspaceOf, writeWhole } from "../../lib/workstream.ts";
import { subjectFault } from "../../lib/workstream-schema.ts";
import { actions as arcActions } from "./arc.ts";

export const describe = "open a workstream from the six-things block: the next number, its folder, its approach page and its first arc";
export const usage = "--file <block.json> --note \"<the developer's words>\" [--backlog \"<the blocker>\"]";

/** The six things, in the order the block names them, and the words a refusal calls each. */
const SIX = [
  ["subject", "the subject"], ["goal", "the goal"], ["whyNow", "why now"], ["reaches", "what it reaches"],
  ["seeFirst", "what the developer wants to see first"], ["limits", "the limits"],
] as const;
type Block = Record<(typeof SIX)[number][0], string>;

const refuse = (why: string): number => { console.log(`Refused: ${why}. Nothing was written.`); return 1; };

/** The book's workstream templates, found in the nearest folder above this file that has them. */
function templateText(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    const found = join(dir, PLUGIN_TEMPLATES, "workstream", "approach-template.html");
    if (existsSync(found)) return readFileSync(found, "utf8");
    const up = dirname(dir);
    if (up === dir) throw new UsageFault("finds no approach-template.html among the plugin's references.");
    dir = up;
  }
}

/** The highest number any workstream folder carries, in any of the three states. */
function highestFolder(root: string): number {
  let top = 0;
  for (const state of WORKSTREAM_STATES) {
    const base = workstreamsDir(root, state);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base)) top = Math.max(top, Number(/^(\d+)-/.exec(entry)?.[1] ?? 0));
  }
  return top;
}

/** The approach page from the template: its masthead filled, and the four sections written from the block. */
function pageFrom(text: string, block: Block, number: string, workspace: string, blocker: string | null): string {
  const title = `${number} - ${titleCase(block.subject)}`;
  const head = text.slice(0, text.indexOf('<section id="s1"'));
  const tail = text.slice(text.indexOf("<script src="));
  const filled = head
    .replace(/<!-- RESTATES[\s\S]*?-->\n?/, "")
    .replace("<title>Approach Template v3</title>", `<title>${escapeHtml(title)}</title>`)
    .replace(/<!-- spn:doc[\s\S]*?-->/, () => `<!-- spn:doc\n${JSON.stringify({
      id: `ws-${number}-${block.subject}`, variant: "approach", title, lenses: ["LEAD"], status: "PLANNING",
      summary: block.goal, keywords: [block.subject],
    }).replace(/[^\x00-\x7f]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`)}\n-->`)
    .replace('<span class="sds-badge sds-lens">{{ROLE}}</span><span class="sds-badge sds-lens">{{ROLE}}</span>', '<span class="sds-badge sds-lens">LEAD</span>')
    .replace("{{THE SUBTITLE: the decision this page plans, one plain sentence.}}", escapeHtml(block.goal))
    .replace("{{THE DESCRIPTION, one paragraph: what changes, why you would read this page, and how the page runs.}}", escapeHtml(`${block.goal} ${block.whyNow}`))
    .split("{{NNN}} - {{TITLE}}").join(escapeHtml(title))
    .split("{{WORKSPACE}}").join(escapeHtml(workspace));
  const p = (value: string): string => `  <p>${escapeHtml(value)}</p>`;
  const body = [
    `<section id="s1" data-block="reasons">`,
    `  <div class="sds-section-head"><h2>Why</h2></div>`,
    `  <p class="sds-standfirst">${escapeHtml(block.whyNow)}</p>`,
    ...(blocker ? [p(`Waiting in the backlog on: ${blocker}`)] : []),
    `</section>`,
    ``,
    `<section id="s2" data-block="reasons">`,
    `  <div class="sds-section-head"><h2>What</h2></div>`,
    `  <p class="sds-standfirst">${escapeHtml(block.goal)}</p>`,
    p(`It reaches: ${block.reaches}`),
    p(`Limits: ${block.limits}`),
    `</section>`,
    ``,
    `<section id="s3" data-block="sequence">`,
    `  <div class="sds-section-head"><h2>How</h2></div>`,
    `  <h3 id="h9">Cycles</h3>`,
    `  <div class="sds-scroll"><table>`,
    `    <thead><tr><th>Arc</th><th class="sds-status-col">Status</th></tr></thead>`,
    `    <tbody>`,
    `    </tbody>`,
    `  </table></div>`,
    `  <!-- spn:generated progress — do not edit inside these markers; \`workstream progress write\` writes it from the arcs -->`,
    `  <!-- /spn:generated -->`,
    `</section>`,
    ``,
    `<section id="s4" data-block="reasons">`,
    `  <!-- spn:generated open — do not edit inside these markers; \`workstream question\` writes it from questions.jsonl -->`,
    `  <div class="sds-section-head"><h2>Open &mdash; no card is open</h2></div>`,
    `  <!-- /spn:generated -->`,
    `</section>`,
    ``,
    `</div>`,
    `</div>`,
    ``,
  ].join("\n");
  return `${filled}${body}\n${tail}`;
}

export function run(args: string[]): number {
  const words = readWords(args, { file: VALUE, note: VALUE, backlog: VALUE });
  if (words.paths.length) throw new UsageFault("takes the block as `--file <block.json>`.");
  const file = words.value("file");
  const note = words.value("note")?.trim();
  if (!file) throw new UsageFault("needs `--file <block.json>`, the six things as one block.");
  if (!note) throw new UsageFault("needs `--note \"<the developer's words>\"`: a new workstream is the developer's call, and the command carries their words.");
  let read: unknown;
  try { read = JSON.parse(readFileSync(file, "utf8")); } catch { throw new UsageFault(`reads no JSON in ${file}.`); }
  const given = (read && typeof read === "object" ? read : {}) as Record<string, unknown>;
  const missing = SIX.filter(([key]) => typeof given[key] !== "string" || !(given[key] as string).trim());
  if (missing.length) return refuse(`the block lacks ${missing.map(([key, said]) => `${key} (${said})`).join(", ")}; a workstream opens only when all six are known`);
  const block = Object.fromEntries(SIX.map(([key]) => [key, (given[key] as string).trim()])) as Block;
  const short = subjectFault(block.subject);
  if (short) return refuse(`the subject \`${block.subject}\` ${short}, such as \`layout-model\``);
  const blocker = words.given("backlog") ? words.value("backlog")!.trim() : null;
  if (blocker === "") return refuse("a workstream opened into backlog names its blocker: `--backlog \"<the blocker>\"`");

  const root = workspaceOf();
  if (!root) throw new UsageFault("runs inside a workspace.");
  const stateFile = join(root, DEVEX, "state.json");
  let state: Record<string, unknown>;
  try { state = JSON.parse(readFileSync(stateFile, "utf8")); } catch { return refuse(`${DEVEX}/state.json is not there or does not read: \`spnutils workspace init\` makes it`); }
  const recorded = Number((state.workstreams as { lastNumber?: unknown } | undefined)?.lastNumber ?? 0);
  const next = Math.max(recorded, highestFolder(root)) + 1;
  const number = String(next).padStart(3, "0");
  const name = `${number}-${block.subject}`;
  const folder = join(workstreamsDir(root, blocker ? "backlog" : "open"), name);

  writeWhole(stateFile, `${JSON.stringify({ ...state, workstreams: { ...(state.workstreams as object), lastNumber: next } }, null, 2)}\n`);
  mkdirSync(folder, { recursive: true });
  const workspace = typeof (state.workspace as { name?: unknown } | undefined)?.name === "string" ? (state.workspace as { name: string }).name : "Workspace";
  writeWhole(join(folder, "approach.html"), pageFrom(templateText(), block, number, workspace, blocker));
  console.log(`ok · ${name} opened in ${blocker ? "backlog" : "open"} · lastNumber ${next}`);

  return arcActions.edit.run([`${name}/N001`, "--title", block.seeFirst, "--subject", block.subject, "--goal", block.seeFirst,
    "--note", blocker ? `${note} · backlog, blocked by: ${blocker}` : note]);
}
