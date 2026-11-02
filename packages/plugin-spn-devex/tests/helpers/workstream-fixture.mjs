// A workstream kept as data, on disk in a throwaway workspace: an approach page in the template's
// shape (What holding the arc's entry, N001-what, which links the preview, Plan with the arc's row and the progress block, Open as the open
// block), one arc's `state.json` with its name file, its preview and its plan. Each case starts whole
// and breaks one thing.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { workspace } from "./fixture.mjs";
import { PLUGIN } from "./harness.mjs";

export const CLI = resolve(PLUGIN, "src", "scripts", "cli.ts");

/** The approach page, its Plan row carrying `stamp`. */
export function approachPage(stamp = "") {
  return [
    `<meta charset="utf-8">`,
    `<link rel="stylesheet" href="https://saasplane.github.io/spn-claude-marketplace/assets/docs/1.5.0/sds-docs.css">`,
    `<div class="sds-page"><div class="sds-wrap">`,
    `<header class="sds-masthead"><div class="sds-eyebrow"><span class="sds-line"><span class="sds-state"><span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-planning">&#x1F52E; PLANNING</span></span></span></div><h1>031 - Probe</h1></header>`,
    `<section id="s2" data-block="reasons">`,
    `  <div class="sds-section-head"><h2>What</h2></div>`,
    `  <h4 id="N001-what">The probe</h4>`,
    `  <p>Read the preview &rarr; <a href="notes/N001/preview.html">the probe</a></p>`,
    `</section>`,
    `<section id="s3" data-block="sequence">`,
    `  <div class="sds-section-head"><h2>How</h2></div>`,
    `</section>`,
    `<section id="arcs" data-block="sequence">`,
    `  <div class="sds-section-head"><h2>Plan</h2></div>`,
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
      { id: "1", parent: "N001", title: "write the book", kind: "change", repo: "spn-x", work: "DOCS", blockedBy: [], touches: ["foundation:a"], state: "waiting" },
      { id: "2", parent: "N001", title: "build it", kind: "change", repo: "spn-x", work: "CODE", blockedBy: ["1"], touches: ["marketplace:b"], state: "waiting" },
    ],
  };
}

/**
 * Writes the two role arcs every workstream has, `ideate` first and `follow-ups` last, under the workstream folder `ws`:
 * no number, no stored kind, no rows. The ideate arc starts DECIDED and the follow-up arc PROPOSED, as `workstream open` writes them.
 */
export function writeRoleArcs(ws, { subject = "probe", title = "the probe", ideate = {}, followUps = {} } = {}) {
  const arcs = {
    ideate: { arc: "ideate", title, subject, goal: title, status: "DECIDED", ...ideate },
    "follow-ups": {
      arc: "follow-ups", title: "Follow-ups", subject: "follow-ups", status: "PROPOSED",
      goal: "The workstream's one follow-up arc: it collects what the other arcs do not need, is reviewed once they have all landed, and builds what is kept.", ...followUps,
    },
  };
  for (const [name, head] of Object.entries(arcs)) {
    const data = { schemaVersion: 2, reason: null, decides: null, repos: [], cycle: null, follows: null, preview: "preview.html", ...head, rows: [] };
    mkdirSync(join(ws, "arcs", name), { recursive: true });
    writeFileSync(join(ws, "arcs", name, "state.json"), `${JSON.stringify(data, null, 2)}\n`);
  }
  return Object.keys(arcs);
}

/**
 * Gives the role arcs (or any arc folders already written under `ws`) their place on the approach page: a Plan row carrying
 * `data-arc`, `id` and the arc's stamp, and a What entry, `<arc>-what`, linking the arc's own preview.
 */
export async function writeRolePageParts(ws, arcs = ["ideate", "follow-ups"]) {
  const { arcStamp } = await import(resolve(PLUGIN, "src", "scripts", "lib", "workstream.ts"));
  const page = join(ws, "approach.html");
  let text = readFileSync(page, "utf8");
  for (const arc of arcs) {
    const data = JSON.parse(readFileSync(join(ws, "arcs", arc, "state.json"), "utf8"));
    const row = `      <tr id="${arc}" data-arc="arcs/${arc}/state.json" data-arc-stamp="${arcStamp(data)}"><td><p><strong>${arc} &mdash; ${data.title}</strong></p><span class="sds-small">Preview: <a href="notes/${arc}/preview.html">preview.html</a></span></td><td><span class="sds-badge sds-status sds-${String(data.status).toLowerCase()}">${data.status}</span></td></tr>\n`;
    const what = `  <h4 id="${arc}-what">The ${arc} arc</h4>\n  <p>Read the preview &rarr; <a href="notes/${arc}/preview.html">the ${arc}</a></p>\n`;
    // `arc edit` already writes the What entry of an arc it opened, so each part is added only where the page lacks it
    if (!text.includes(`data-arc="arcs/${arc}/state.json"`)) text = text.replace("    </tbody>", `${row}    </tbody>`);
    if (!text.includes(`id="${arc}-what"`)) text = text.replace('</section>\n<section id="s3"', `${what}</section>\n<section id="s3"`);
  }
  writeFileSync(page, text);
}

/** A card a `question raise` takes, whole. */
export const CARD = {
  title: "Which way the `probe` goes", why: "It blocks row 2.", what: "The file is `a.ts:12`.", viewsLead: "One view.",
  views: [{ lens: "Architect", text: "Keep it in one place.", made: "SPOKEN" }],
  options: [{ key: "A", does: "one way", costs: "little", leaveIt: true }, { key: "B", does: "the other", costs: "more" }],
  recommended: { key: "A", reason: "It costs less.", scope: "CORE" },
  nearest: "spn-x", signs: [], others: "A third way, set aside: it costs more than B.",
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
export function cli(root, args, env = {}) {
  try {
    const out = execFileSync(process.execPath, [CLI, ...args], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, SPN_TELEMETRY: "off", SPN_WORKSPACE: root, CLAUDE_CODE_SESSION_ID: "", ...env } });
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

/** The closing block a closed approach page carries, in the shape closed pages hold (RULE.DEVEX.WORKSPACE.206). */
export const CLOSING_BLOCK = `<div class="sds-note">
  <p>&#x1F680; <strong>031 Probe has shipped.</strong> One arc, two steps.</p>
  <p>&nbsp;</p>
  <p><strong>&#x1F4E6; What we delivered</strong></p>
  <ul><li>the probe</li></ul>
  <p>&nbsp;</p>
  <p><strong>&#x1F9E0; What we learned</strong></p>
  <ul><li>it works</li></ul>
  <p>&nbsp;</p>
  <p><strong>Thank you &#x1F44D;</strong></p>
  <p>Done.</p>
</div>
`;

/** Writes the closing block into a workstream's approach page, under the masthead (or at the end where the page has none). */
export function writeClosingBlock(ws) {
  const page = join(ws, "approach.html");
  const text = readFileSync(page, "utf8");
  writeFileSync(page, text.includes("</header>") ? text.replace("</header>", `</header>\n${CLOSING_BLOCK}`) : `${text}\n${CLOSING_BLOCK}`);
}
