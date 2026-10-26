// A workstream kept as data, on disk in a throwaway workspace: an approach page in the template's
// shape (What linking the preview, Cycles with the arc's row and the progress block, Open as the open
// block), one arc's `state.json` with its name file, its preview and its plan. Each case starts whole
// and breaks one thing.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { workspace } from "./fixture.mjs";
import { PLUGIN } from "./harness.mjs";

export const CLI = resolve(PLUGIN, "src", "scripts", "cli.ts");

/** The approach page, its Cycles row carrying `stamp`. */
export function approachPage(stamp = "") {
  return [
    `<meta charset="utf-8">`,
    `<link rel="stylesheet" href="https://saasplane.github.io/spn-claude-marketplace/assets/docs/1.5.0/sds-docs.css">`,
    `<div class="sds-page"><div class="sds-wrap">`,
    `<header class="sds-masthead"><div class="sds-eyebrow"><span class="sds-line"><span class="sds-state"><span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-planning">&#x1F52E; PLANNING</span></span></span></div><h1>031 - Probe</h1></header>`,
    `<section id="s2" data-block="reasons">`,
    `  <div class="sds-section-head"><h2>What</h2></div>`,
    `  <h4 id="c1">The probe</h4>`,
    `  <p>Read the preview &rarr; <a href="notes/N001/preview.html">the probe</a></p>`,
    `</section>`,
    `<section id="s3" data-block="sequence">`,
    `  <div class="sds-section-head"><h2>How</h2></div>`,
    `  <h3 id="h9">Cycles</h3>`,
    `  <div class="sds-scroll"><table>`,
    `    <thead><tr><th>Arc</th><th class="sds-status-col">Status</th></tr></thead>`,
    `    <tbody>`,
    `      <tr id="N001" data-arc="arcs/N001/state.json"${stamp ? ` data-arc-stamp="${stamp}"` : ""}><td><p><strong>N001 &mdash; the probe arc</strong></p><p>what it decides</p><span class="sds-small">Preview: <a href="notes/N001/preview.html">preview.html</a></span></td><td><span class="sds-badge sds-status sds-decided">DECIDED</span></td></tr>`,
    `    </tbody>`,
    `  </table></div>`,
    `  <!-- spn:generated progress — do not edit inside these markers; \`workstream progress write\` writes it from the arcs -->`,
    `  <p>old</p>`,
    `  <!-- /spn:generated -->`,
    `</section>`,
    `<section id="s4" data-block="reasons">`,
    `  <!-- spn:generated open — do not edit inside these markers; \`workstream question\` writes it from questions.jsonl -->`,
    `  <div class="sds-section-head"><h2>Open &mdash; no card is open</h2></div>`,
    `  <!-- /spn:generated -->`,
    `</section>`,
    `</div></div>`,
    ``,
  ].join("\n");
}

export const PREVIEW = `<meta charset="utf-8">\n<div class="sds-wrap">\n<section id="s1"><h2>Overview</h2><p>the probe</p></section>\n</div>\n`;

/** The arc's data: decided, two rows, the second waiting on the first. */
export function arcData(rows) {
  return {
    schemaVersion: 2, arc: "N001", subject: "probe", title: "the probe arc", goal: "the probe is answered", status: "DECIDED", reason: null,
    decides: "what it decides", repos: ["spn-x"], cycle: "a plugin release", follows: null, model: "Opus 5.5", preview: "preview.html",
    rows: rows ?? [
      { id: "1", parent: "N001", title: "write the book", kind: "change", repo: "spn-x", altitude: "DOCS", blockedBy: [], touches: ["foundation:a"], state: "waiting" },
      { id: "2", parent: "N001", title: "build it", kind: "change", repo: "spn-x", altitude: "CODE", blockedBy: ["1"], touches: ["marketplace:b"], state: "waiting" },
    ],
  };
}

/** A card a `question raise` takes, whole. */
export const CARD = {
  title: "Which way the `probe` goes", why: "It blocks row 2.", what: "The file is `a.ts`.", viewsLead: "One view.",
  views: [{ lens: "Architect", text: "Keep it in one place." }],
  options: [{ key: "A", does: "one way", costs: "little" }, { key: "B", does: "the other", costs: "more" }],
  recommended: { key: "A", reason: "It costs less." },
};

/**
 * A workspace holding one open workstream, `031-probe`, kept as data and whole, and a git checkout
 * `spn-x` beside it. The stamp on the page is the arc's own unless `stamp` says otherwise.
 */
export async function dataWorkspace(name, { stamp = null, rows = undefined } = {}) {
  const { arcStamp, writeNameFile } = await import(resolve(PLUGIN, "src", "scripts", "lib", "workstream.ts"));
  const data = arcData(rows);
  const ws = `.spndevex/workstreams/open/031-probe`;
  const root = workspace(name, {
    [`${ws}/approach.html`]: approachPage(stamp ?? arcStamp(data)),
    [`${ws}/arcs/N001/state.json`]: `${JSON.stringify(data, null, 2)}\n`,
    [`${ws}/notes/N001/preview.html`]: PREVIEW,
    [`${ws}/notes/N001/plan.md`]: "# N001 plan\n",
    "spn-x/a.ts": "export const a = 1;\n",
  });
  writeNameFile(join(root, ws), data);
  const repo = join(root, "spn-x");
  const git = (args) => execFileSync("git", args, { cwd: repo, stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" }).trim();
  git(["init", "-q"]);
  git(["add", "-A"]);
  git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "first"]);
  return { root, ws: join(root, ws), repo, git };
}

/** Runs the plugin's command line in a workspace: its exit code and everything it printed. */
export function cli(root, args) {
  try {
    const out = execFileSync(process.execPath, [CLI, ...args], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, SPN_TELEMETRY: "off", SPN_WORKSPACE: root } });
    return { code: 0, out };
  } catch (error) {
    return { code: error.status ?? 1, out: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

/** Writes a file under the workspace, folders made as needed. */
export function put(root, path, body) {
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(join(root, path), body, "utf8");
}
