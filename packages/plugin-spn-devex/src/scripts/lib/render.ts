// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The header · § The blocks · § The shape of a section, on every page kind · § One stylesheet, served in versions
//           docs/04-capabilities/01-devex/04-workspace/04-docs/02-document.md § Metadata
// The chapters are the source of truth. A rule change is edited there first, then here, in the same change.
//
// The page, produced from the seat file. The agent authors the markdown; this writes the HTML —
// the body from the markdown, each figure drawn from its spec, then the furniture. So a page is
// never hand-edited, and the header can never disagree with the block it is rendered from.
// Every class it writes opens with `sds-`, and the furniture is the two lines that load the shared files.
//
// It is deliberately a small renderer rather than a markdown library: the seat file's grammar is
// closed — headings, paragraphs, tables, lists, fenced blocks — and a dependency would have to be
// installed on a partner's machine to read a document.

import { execFileSync } from "node:child_process";
import { dirname, join, relative, resolve, sep } from "node:path";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

import { draw, figureOf, type Spec } from "./draw.ts";
import { readsAsCondition } from "./block-fit.ts";
import { sentenceColumn } from "./item-cells.ts";
import { isSeatFile, producedPageOf, visibilityOf } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { stylesDir } from "../../../../plugin-support-lib/src/lib/page-styles.ts";
import { RULE_ID_SRC, chipOf, parseFields } from "../../../../plugin-support-lib/src/lib/rule-mark.ts";

/** The words of a short name: a run that holds a letter or a digit, so a dash, a `·` and a number's separator are not words (RULE.DEVEX.WORKSPACE.517). */
export const nameWords = (name: string): number => name.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;

/** `stops` says the finding is the render's: the page is not written while it stands (RULE.DEVEX.WORKSPACE.538). */
export type Finding = { message: string; line?: number; stops?: boolean };

// ---------------------------------------------------------------------------- the UNIT block

/**
 * The render of one file: what `spnutils apps surface render --file <file> --app <code> --modes LIGHT,DARK --devices DESKTOP` prints,
 * or the words it refused with: the markup of the tree alone, for each mode and device.
 * It is ONE FUNCTION, so a test replaces it with `setUnitRender`.
 */
export type UnitRender = (file: string, options?: { app: string; ds?: string }) => string;

/**
 * The app a `unit` fence is drawn under when the fence names none: `surface`, Surface's own brand-free language (decided by the lead,
 * 2026-11-23). It is drawn with `--ds <version>`, the version `ds-unit.css` was cut from; a fence naming another app sends no `--ds`.
 */
export const DEFAULT_RENDER_APP = "surface";

const findingWords = (findings: any[]): string => findings.map((f: any) => (typeof f === "string" ? f : f?.message ?? JSON.stringify(f))).join("; ");

/**
 * The page of each mode in what the render printed. Two shapes are read. The new render prints
 * `{ renderVersion, ds, app, renders: { LIGHT: { DESKTOP: { html, findings } }, DARK: { … } } }`, and the page of a mode is its first
 * device's `html`; a finding in any mode or device stops the write with the render's words. The released render prints
 * `{ pages: [{ html, findings }] }`, and its first page stands for both modes. Printed text that is no JSON is the page itself.
 */
export function pagesFromRender(printed: string): { LIGHT: string; DARK: string } {
  const text = printed.trim();
  if (!text.startsWith("{")) return { LIGHT: printed, DARK: printed };
  let out: any;
  try { out = JSON.parse(text); } catch { return { LIGHT: printed, DARK: printed }; }
  if (out && typeof out.renders === "object" && out.renders) {
    const pages: Record<string, string> = {};
    const said: any[] = [];
    for (const [mode, devices] of Object.entries<any>(out.renders)) {
      for (const [device, one] of Object.entries<any>(devices ?? {})) {
        if (Array.isArray(one?.findings)) said.push(...one.findings);
        if (!(mode in pages) && typeof one?.html === "string") pages[mode] = one.html;
        else if (typeof one?.html !== "string") said.push(`the render printed no page for ${mode} on ${device}: its JSON holds no \`html\``);
      }
    }
    if (said.length) throw new Error(findingWords(said));
    const light = pages.LIGHT ?? pages.DARK, dark = pages.DARK ?? pages.LIGHT;
    if (light === undefined || dark === undefined) throw new Error("the render printed no page: its JSON holds no `renders`");
    return { LIGHT: light, DARK: dark };
  }
  const first = Array.isArray(out?.pages) ? out.pages[0] : out;
  const findings = Array.isArray(first?.findings) ? first.findings : [];
  if (findings.length) throw new Error(findingWords(findings));
  if (typeof first?.html !== "string") throw new Error("the render printed no page: its JSON holds no `html`");
  return { LIGHT: first.html, DARK: first.html };
}

/** The first mode's page of what the render printed (see `pagesFromRender`). */
export function pageFromRender(printed: string): string { return pagesFromRender(printed).LIGHT; }

const spnutilsRender: UnitRender = (file, options = { app: DEFAULT_RENDER_APP }) => {
  try {
    return execFileSync("spnutils", ["apps", "surface", "render", "--file", file, "--app", options.app, ...(options.ds ? ["--ds", options.ds] : []), "--modes", "LIGHT,DARK", "--devices", "DESKTOP"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    const failed = error as { stdout?: unknown; stderr?: unknown; message?: string };
    throw new Error(`${String(failed.stderr ?? "")}${String(failed.stdout ?? "")}`.trim() || String(failed.message));
  }
};
let unitRender: UnitRender = spnutilsRender;
/** Replace the render, or give back the real one with no argument. */
export function setUnitRender(render: UnitRender = spnutilsRender): void { unitRender = render; }

/**
 * The version of `@saasplane/support-web-ds-ts` the docs stylesheet's Support release pins: the tag the tokens file in the
 * plugin's styles folder was copied from, which `docs sds cut` writes in its first line. Null where it cannot be read.
 */
export function designSystemVersion(styles: string | null = stylesDir(import.meta.dirname), file = "ds-tokens.css"): string | null {
  if (!styles || !existsSync(join(styles, file))) return null;
  return /support-web-ds-ts v?(\d+\.\d+\.\d+)/.exec(readFileSync(join(styles, file), "utf8").split("\n")[0])?.[1] ?? null;
}

/** Set by `unitFrame` when a page draws a unit, so the page links `ds-unit.css`; reset for every page. */
let unitUsed = false;
/** The page's link to the shared docs stylesheet, which a framed unit's document takes its `design-system.css` link from; set for every page. */
let unitStylesheet = "";

/**
 * The markup a render's printed page stands for in the docs page itself: the `<body>` content, with no `<style>` and no
 * `<script>`. A printed page with no `<body>` loses its document furniture instead.
 */
function unitMarkup(page: string): string {
  const body = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(page);
  let html = body ? body[1] : page.replace(/<!doctype[^>]*>/gi, "").replace(/<head\b[\s\S]*?<\/head>/gi, "").replace(/<\/?html\b[^>]*>/gi, "");
  html = html.replace(/<style\b[\s\S]*?<\/style>/gi, "").replace(/<script\b[\s\S]*?<\/script>/gi, "");
  return html.trim();
}

/**
 * A fence tagged `unit`: one tree, a unit with its props. It is wrapped as a render file and drawn by the render, and the
 * unit's own markup stands in the page, once in light and once in dark, side by side (`.sds-unit`, styled by `ds-unit.css`),
 * with the tree below as code. A window-sized unit (the first unit is `DSLayout`, or the tree has more than one section) is drawn in an `iframe`
 * instead, 640px high and full width, whose `srcdoc` is a document built from the render's markup, with `design-system.css` linked at the page's own stylesheet version and `data-mode` set, one for light and one for dark; a top-level
 * `"frame": true|false` forces either. The tree may carry a top-level `"caption"`: it is the figcaption's text, the unit's name stays
 * as the small label. `caption`, `frame` and `app` (the code of the app row it is drawn under) are taken out before the render and before the tree is shown. A tree that is no JSON, a refusal
 * and a finding each stop the write with the render's words.
 */
function unitFrame(body: string[], findings: Finding[]): string {
  const stop = (message: string): string => { findings.push({ message, stops: true }); return ""; };
  let tree: any;
  try { tree = JSON.parse(body.join("\n")); } catch (e) { return stop(`a \`unit\` fence is not strict JSON — ${(e as Error).message}`); }
  let caption = "";
  let forced: boolean | null = null;
  let app = DEFAULT_RENDER_APP;
  if (tree && typeof tree === "object" && !Array.isArray(tree) && ("caption" in tree || "frame" in tree || "app" in tree)) {
    const { caption: said, frame, app: named, ...rest } = tree;
    if (named !== undefined) {
      if (typeof named !== "string" || !named.trim()) return stop("a `unit` fence's `app` is the code of an app row, a string: the app the unit is drawn under");
      app = named.trim();
    }
    if (said !== undefined) {
      if (typeof said !== "string") return stop("a `unit` fence's `caption` is a string, the words under the unit");
      caption = said.trim();
    }
    if (frame !== undefined) {
      if (typeof frame !== "boolean") return stop("a `unit` fence's `frame` is `true` or `false`: `true` draws the unit in a frame, `false` draws it inline");
      forced = frame;
    }
    tree = rest;
  }
  const sections = Array.isArray(tree?.sections) ? tree.sections : [tree];
  const name = sections[0]?.unit;
  if (typeof name !== "string") return stop("a `unit` fence holds a tree whose first unit has no name: `{ \"unit\": \"DSFeature\", \"props\": { … } }`");
  // A window-sized unit, a layout or a page of several sections, stands in a frame of its own; `frame` says otherwise.
  const framed = forced ?? (name === "DSLayout" || sections.length > 1);
  // The render takes the tree alone, and the app row it is drawn under comes from `--app`. The `surface` app is drawn with the design
  // system version its unit stylesheet was cut from, so a unit's markup and its styles always match.
  const ds = app === DEFAULT_RENDER_APP ? (designSystemVersion(undefined, "ds-unit.css") ?? designSystemVersion()) : null;
  if (app === DEFAULT_RENDER_APP && !ds) return stop("a `unit` fence cannot be drawn: the docs stylesheet's design-system version is not read from `ds-unit.css` or `ds-tokens.css` in the plugin's styles folder");
  const file = { treeVersion: 1, sections };
  const folder = mkdtempSync(join(tmpdir(), "spn-unit-"));
  let pages: { LIGHT: string; DARK: string };
  try {
    const path = join(folder, "unit.json");
    writeFileSync(path, JSON.stringify(file));
    pages = pagesFromRender(unitRender(path, { app, ...(ds ? { ds } : {}) }));
  } catch (e) {
    return stop(`the render stopped the \`${name}\` fence: ${(e as Error).message}`);
  } finally { rmSync(folder, { recursive: true, force: true }); }
  let mode: (m: "light" | "dark") => string;
  if (framed) {
    // The frame's document is built here from the render's markup, the way the surface page template builds its own: `design-system.css`
    // is linked at the version of the page's shared stylesheet, and the mode is set on `<html>`. The markup carries no page of its own.
    const link = /sds-docs\.css/.test(unitStylesheet)
      ? unitStylesheet.replace(/sds-docs\.css/, "design-system.css").replace(/\s(?:integrity|crossorigin)="[^"]*"/g, "") : "";
    const document = (m: "light" | "dark"): string => {
      const markup = unitMarkup(pages[m === "light" ? "LIGHT" : "DARK"]);
      const whole = `<!doctype html><html lang="en" data-mode="${m}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${link}<style>html,body{margin:0}body{background:var(--surface,var(--background));color:var(--foreground)}</style></head><body><div id="root">${markup}</div></body></html>`;
      return whole.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    };
    mode = (m) => `    <iframe class="sds-unit-frame" data-mode="${m}" title="${esc(name)}, ${m}" width="100%" height="640" srcdoc="${document(m)}"></iframe>`;
  } else {
    unitUsed = true;
    mode = (m) => `    <div class="sds-unit" data-mode="${m}">${unitMarkup(pages[m === "light" ? "LIGHT" : "DARK"])}</div>`;
  }
  const label = caption ? `<span class="sds-file-path">${inline(caption)}</span><span class="sds-file-lang">${esc(name)}</span>`
    : `<span class="sds-file-path">${esc(name)}</span><span class="sds-file-lang">unit</span>`;
  return `  <figure class="sds-file">\n    <figcaption>${label}</figcaption>\n`
    + `    <div class="sds-unit-pair">\n${mode("light")}\n${mode("dark")}\n    </div>\n`
    + `    <pre data-lang="json">${escapedCode(JSON.stringify(sections.length === 1 && !Array.isArray(tree?.sections) ? tree : { specVersion: 1, sections }, null, 2))}</pre>\n  </figure>`;
}

/**
 * The units the design system builds, which `scripts/build-unit-styles.mjs` writes beside `ds-unit.css` as `ds-units.json` from the
 * design system's surface snapshot. Null where the list cannot be read, and then no skeleton is held against it.
 */
export type BuiltUnits = ReadonlySet<string> | null;
function readBuiltUnits(): BuiltUnits {
  const styles = stylesDir(import.meta.dirname);
  if (!styles || !existsSync(join(styles, "ds-units.json"))) return null;
  try {
    const list = JSON.parse(readFileSync(join(styles, "ds-units.json"), "utf8"))?.units;
    return Array.isArray(list) ? new Set(list.filter((name: unknown): name is string => typeof name === "string")) : null;
  } catch { return null; }
}
let builtUnits: BuiltUnits | undefined;
/** Replace the list of built units, or give back the file's with no argument. A test names its own. */
export function setBuiltUnits(units?: Iterable<string> | null): void { builtUnits = units === undefined ? undefined : units === null ? null : new Set(units); }

/** Each unit a skeleton spec names: the `unit` of any frame or section in it, however deep. */
function skeletonUnits(spec: unknown, found: Set<string> = new Set()): Set<string> {
  if (Array.isArray(spec)) spec.forEach((one) => skeletonUnits(one, found));
  else if (spec && typeof spec === "object") {
    for (const [key, value] of Object.entries(spec)) {
      if (key === "unit" && typeof value === "string") found.add(value);
      else skeletonUnits(value, found);
    }
  }
  return found;
}

/**
 * A SKELETON OF A UNIT THE DESIGN SYSTEM BUILDS stops the write, because the page then shows a sketch of what a `unit` fence draws for
 * real. A skeleton of a shape that is not built yet carries `"planned": true`; once the design system builds it, this finding is the
 * page's cue to change it to a `unit`.
 */
function builtSkeleton(spec: Spec, findings: Finding[]): void {
  if (spec.kind !== "skeleton" || spec.planned === true) return;
  const built = (builtUnits === undefined ? (builtUnits = readBuiltUnits()) : builtUnits);
  if (!built) return;
  const named = [...skeletonUnits(spec)].filter((name) => built.has(name));
  if (!named.length) return;
  findings.push({
    message: `a \`dg\` skeleton names ${named.map((name) => `\`${name}\``).join(", ")}, which the design system builds: draw it with a \`unit\` fence, or set \`"planned": true\` on the skeleton where it shows a shape that is not built yet`,
    stops: true,
  });
}

const LENS_LABEL: Record<string, string> = {
  LEAD: "Engineering leader", BUSINESS: "Business manager", PRODUCT: "Product manager",
  ARCHITECT: "Architect", SERVER_DEV: "Backend developer", WEB_DEV: "Web developer",
  QA: "Quality engineer", INFRA: "DevOps / SRE", TRUST: "DevSecOps / Security",
  PARTNER: "Partner / integrator", VOICE: "Editor", UX: "UX designer",
  STRATEGY: "Chief executive", UI: "UI designer", MARKETING: "Product marketer", SALES: "Sales lead",
  GROWTH: "Growth lead", SUPPORT: "Customer success lead", FINANCE: "Finance lead", DATA: "Data lead", AI: "AI lead",
};
const STATUS_GLYPH: Record<string, string> = { DONE: "&#x2705;", IMPLEMENTING: "&#x1F6A7;", PLANNING: "&#x1F52E;" };

/** The block a section declares, chosen the way the chapter's own order chooses it. */
const esc = (s: string) => s.replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Code is a literal, so every `&` is written as an entity: a block tagged with a language shows each character its author typed. */
const escapedCode = (code: string) => code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Inline markdown, in the order that stops one form eating another. Inline code is held behind a
 * marker so no later pass can see inside it — the marker carries its index in letters and is built
 * from SUB at runtime, for the reason `figures.ts` records: a digit in the marker gets matched, and
 * writing the control character as a literal puts raw NUL bytes in this file.
 */
/** The folder holding `docs/` that a seat file sits in: the repository root a `file=` path is read from. Null where the path has no `docs` folder. */
export function docsRoot(seat: string): string | null {
  const at = seat.lastIndexOf("/docs/");
  return at < 0 ? null : seat.slice(0, at);
}

/** The repository root the page is written from, set by `renderPage`; null where the caller names none. */
let pageRoot: string | null = null;

/**
 * How a relative link is re-expressed for the produced page. Set by `renderPage`, identity by default.
 *
 * A seat file's links are written from the SEAT's folder, and the page is produced into a different
 * one whose siblings carry different names — `platform-grants.md` beside the seat is
 * `platform-grants-construct.html` beside the page. Copying the href across verbatim broke a link on
 * **every produced page in the workspace, 166 of 166**, and no check saw it: `docs.ts audit` reads
 * structure and never follows a link.
 */
let rewriteHref: (href: string) => string = (h) => h;

const remotes = new Map<string, { top: string; url: string } | null>();

/**
 * The address of a file on github.com, read from the git remote of the repository that holds it, or null where there is no remote that names
 * github.com. It reads the remote with git and never the network.
 */
export function githubAddress(path: string): string | null {
  let file = path;
  try { file = realpathSync(path); } catch { /* a file not written yet keeps the path it was given */ }
  const folder = dirname(file);
  if (!remotes.has(folder)) {
    try {
      const top = execFileSync("git", ["-C", folder, "rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      const raw = execFileSync("git", ["-C", folder, "remote", "get-url", "origin"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      const found = /github\.com[:/]([^/\s]+\/[^/\s]+?)(?:\.git)?$/.exec(raw);
      remotes.set(folder, found ? { top, url: `https://github.com/${found[1]}` } : null);
    } catch { remotes.set(folder, null); }
  }
  const remote = remotes.get(folder);
  return remote ? `${remote.url}/blob/HEAD/${relative(remote.top, file).split(sep).join("/")}` : null;
}

/**
 * Re-express a seat file's link for the page produced from it.
 *
 * Resolve against the seat's folder, swap a construct seat file for the page produced from it, then
 * express the result relative to the page's own folder. A construct seat always owes a page, so the
 * swap is unconditional rather than a filesystem check — that keeps the answer the same whatever
 * order the pages are produced in. `README.md` is a domain face with no page, and keeps pointing at
 * the seat tree.
 */
export function hrefForPage(seat: string, out: string): (href: string) => string {
  const seatDir = dirname(seat);
  const outDir = dirname(out);
  // A public page links no `.md` seat file (RULE.DEVEX.WORKSPACE.555): a link to one becomes the file's address on github.com.
  const publicPage = visibilityOf(out) === "public";
  return (href) => {
    if (/^(?:[a-z]+:|#|\/\/|\/)/i.test(href)) return href;
    const hash = href.indexOf("#");
    const path = hash < 0 ? href : href.slice(0, hash);
    const frag = hash < 0 ? "" : href.slice(hash);
    if (!path) return href;
    let target = resolve(seatDir, path);
    if (isSeatFile(target)) target = producedPageOf(target);
    if (publicPage && target.endsWith(".md")) { const address = githubAddress(target); if (address) return address + frag; }
    const rel = relative(outDir, target);
    return (rel.startsWith(".") ? rel : `./${rel}`) + frag;
  };
}

/**
 * A rule's parenthesis shows as a chip: MUST and its class, or Guidance, with the id as its anchor so a citation can
 * link to it, and the holder on hover. A parenthesis that does not read stays as written, and the book check names it.
 */
// nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- built from the parser's own constant
const RULE_MARK = new RegExp(`\\(rule (${RULE_ID_SRC})((?: \u00b7 [^()]+)*)\\)`, "g");
const chip = (whole: string, id: string, rest: string): string => {
  const read = parseFields(rest);
  if ("fault" in read || read.level === null) return whole;
  const { label, anchor, title } = chipOf(id, read.level, read.params);
  return `<a class="sds-badge" id="${anchor}" href="#${anchor}" title="${title}">${label}</a>`;
};

function inline(s: string): string {
  const SEP = String.fromCharCode(26);
  const code: string[] = [];
  const mark = (i: number) => {
    let out = "", n = i + 1;
    while (n > 0) { out = String.fromCharCode(97 + ((n - 1) % 26)) + out; n = Math.floor((n - 1) / 26); }
    return SEP + out + SEP;
  };
  let out = s.replace(/`([^`]+)`/g, (_, c) => { code.push(c); return mark(code.length - 1); });
  out = esc(out);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, h) => `<a href="${rewriteHref(h)}">${t}</a>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  out = out.replace(RULE_MARK, chip);
  return out.replace(new RegExp(`${SEP}([a-z]+)${SEP}`, "g"), (_, k: string) => {
    let i = 0;
    for (const ch of k) i = i * 26 + (ch.charCodeAt(0) - 96);
    return `<code>${esc(code[i - 1])}</code>`;
  });
}

/** A cell that a dash or nothing fills says nothing, so no level of an item cell is made from it. */
const isBlank = (cell: string): boolean => /^(?:—|–|-|&mdash;)?$/.test(cell.trim());

/** A level's text in bold, unless its author already set it so. */
const bold = (html: string): string => /^<strong>[\s\S]*<\/strong>$/.test(html) ? html : `<strong>${html}</strong>`;

/**
 * An item cell (05-artifacts.md § The shape of a section, on every page kind): the title in the first
 * paragraph, the line under it, and the facts as `Key: value` pairs in the page's small type. A level
 * with nothing to say is left out. The stylesheet tones and spaces the levels, so the cell carries no style.
 */
function itemCell(title: string, line: string, facts: [string, string][]): string {
  const said = facts.filter(([, value]) => !isBlank(value)).map(([key, value]) => `${key}: ${inline(value)}`);
  return [
    isBlank(title) ? "" : `<p>${title}</p>`,
    isBlank(line) ? "" : `<p>${inline(line)}</p>`,
    said.length ? `<span class="sds-small">${said.join(" &middot; ")}</span>` : "",
  ].join("");
}

/**
 * A Terms row's contract term as the page writes it: the seat's code as written, and a note the seat adds after the
 * code (`` `OrgType` — the closed set … ``) under it in the page's small type. A dash is an empty cell.
 */
function contractCell(cell: string): string {
  const noted = cell.match(/^((?:`[^`]+`(?:\s*[·,]\s*)?)+)\s+[—–]\s+([\s\S]+)$/);
  return noted ? `${inline(noted[1].trim())}<br><span class="sds-small">${inline(noted[2])}</span>` : inline(cell);
}

/**
 * The tables every construct carries, and the two shapes the corpus repeats, each written as item
 * cells: a column a reader compares down stays a column, and the rest of what a row says about its
 * item becomes a level of the item's cell. The seat file keeps its markdown columns, because the
 * glossary is generated from them. Any other table keeps its columns, except one whose cells hold sentences.
 */
const ITEM_SHAPES: { head: RegExp[]; columns: string[]; row: (cells: string[]) => string[]; tableClass?: string }[] = [
  { // Terms: three columns, because a reader compares the person's word with the contract's spelling down the rows.
    head: [/^Term$/, /^Contract term$/, /^What it means/],
    columns: ["Term", "Contract term", "Description"],
    // The shared styles give the three columns fixed shares, and stack a row under 40rem.
    tableClass: "sds-terms",
    row: ([term, contract, means]) => [
      isBlank(term) ? inline(contract) : `<strong>${inline(term)}</strong>`,
      isBlank(term) || isBlank(contract) ? "" : contractCell(contract),
      inline(means),
    ],
  },
  { // Binds: the rule and what it decides; the weight is read down the column.
    head: [/^Rule$/, /^What it decides$/, /^Weight$/],
    columns: ["Rule", "Weight"],
    row: ([rule, decides, weight]) => [itemCell(inline(rule), decides, []), inline(weight)],
  },
  { // A Model's pieces: the piece, the question it answers, and its terms.
    head: [/^Piece$/, /^The question it answers$/, /^Its terms$/],
    columns: ["Piece"],
    row: ([piece, question, terms]) => [itemCell(bold(inline(piece)), question, [["Terms", terms]])],
  },
  { // A Boundary's edges: what this construct owns beside what it refuses, and who owns that instead.
    head: [/^Owns$/, /^Refuses$/, /^Who owns that instead$/],
    columns: ["Owns", "Refuses"],
    // Both sides are lines, read across the row, so neither takes the title's tone.
    row: ([owns, refuses, instead]) => [inline(owns), inline(refuses) + itemCell("", "", [["Owned by", instead]])],
  },
];

/**
 * Any other table, where a column after the first holds sentences (RULE.DEVEX.WORKSPACE.259): that column is a level of
 * the first column's cell, under its title. One such column is the line; where several are, each is a paragraph led by
 * its column's name. Every other column stays, as written. A table with no column of sentences has no shape here.
 */
function sentenceShape(head: string[], rows: string[][]): (typeof ITEM_SHAPES)[number] | undefined {
  const folded = head.map((_, at) => at).filter((at) => at > 0 && sentenceColumn(rows.map((r) => inline(r[at] ?? ""))).sentences);
  if (!folded.length) return undefined;
  const kept = head.map((_, at) => at).filter((at) => at > 0 && !folded.includes(at));
  const words = (html: string): boolean => /[a-z]/i.test(html.replace(/<code\b[\s\S]*?<\/code>/gi, "").replace(/<[^>]+>/g, ""));
  return {
    head: [],
    columns: [inline(head[0]), ...kept.map((at) => inline(head[at]))],
    row: (cells) => {
      const title = inline(cells[0] ?? "");
      const lines = folded.map((at) => [head[at], cells[at] ?? ""]).filter(([, cell]) => !isBlank(cell))
        .map(([name, cell]) => folded.length === 1 ? `<p>${inline(cell)}</p>` : `<p><strong>${inline(name)}:</strong> ${inline(cell)}</p>`);
      const item = (isBlank(title) ? "" : `<p>${words(title) ? bold(title) : title}</p>`) + lines.join("");
      return [item, ...kept.map((at) => inline(cells[at] ?? ""))];
    },
  };
}

/** A plain table that reads as a catalog: a name column, a description column, and more than four rows. */
const NAME_HEAD = /^(?:name|term|item|block|unit|command|page|check|field|option|figure|kind|type|tool|file|rule|view|layout|part)s?$/i;
const DESCRIPTION_HEAD = /^(?:description|meaning|purpose|summary|what (?:it|this)\b.*|use|uses|does|about)$/i;
const bare = (cell: string): string => cell.replace(/[`*]/g, "").trim();
/** The description column's name where the table reads as a catalog, else null. */
function readsAsCatalog(head: string[], rows: string[][]): string | null {
  const at = head.findIndex((name, k) => k > 0 && DESCRIPTION_HEAD.test(bare(name)));
  return rows.length > 4 && head.length <= 3 && NAME_HEAD.test(bare(head[0])) && at > 0 ? bare(head[at]) : null;
}

function table(lines: string[], findings: Finding[] = []): string {
  // A `\|` inside a cell is a pipe the author wants shown, not a column break — markdown's own rule,
  // and the one the first pattern table in the corpus needed (`{org}-{family}-public\|-private`).
  const cells = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
  const head = cells(lines[0]);
  const rows = lines.slice(2).map(cells);
  const shape = ITEM_SHAPES.find((one) => one.head.length === head.length && one.head.every((name, at) => name.test(head[at])))
    ?? sentenceShape(head, rows);
  // SOFT: a table of names and what each is, past four rows, is a catalog a reader browses (the block table in 05-artifacts.md).
  const described = ITEM_SHAPES.includes(shape as (typeof ITEM_SHAPES)[number]) ? null : readsAsCatalog(head, rows);
  if (described) findings.push({ message: `a table of ${rows.length} rows reads as a catalog, a \`${bare(head[0])}\` column and a \`${described}\` column: a \`catalog\` fence (\`layout=GRID\`, or \`LIST\` where the names are long) lets a reader browse them, and a plain table is for a wide comparison of attributes` });
  const th = (shape ? shape.columns : head.map(inline)).map((c) => `<th>${c}</th>`).join("");
  const tb = rows.map((r) => `<tr>${(shape ? shape.row(r) : r.map(inline)).map((c) => `<td>${c}</td>`).join("")}</tr>`).join("\n      ");
  return `  <div class="sds-scroll"><table${shape?.tableClass ? ` class="${shape.tableClass}"` : ""}>\n    <thead><tr>${th}</tr></thead>\n    <tbody>\n      ${tb}\n    </tbody>\n  </table></div>`;
}

function anchorOf(text: string): string {
  return text.toLowerCase().replace(/`/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

// ---------------------------------------------------------------------------- the CATALOG block

/** The layouts and the media a `catalog` fence tag may name (the design system's `DSDataTableConfigLayoutType`, `DSItemMediaType`, `DSFeatureType`). */
const CATALOG_LAYOUTS = ["GRID", "LIST", "TABLE"];
const CATALOG_MEDIA = ["ICON", "MARK", "AVATAR", "AVATAR_GROUP", "MEDIA_TOP"];

/** The icons an `ICON` or `MARK` item may name, as the sample draws them (24-unit boxes, drawn by the stylesheet's stroke). */
const ICONS: Record<string, string> = {
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  file: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/>',
  "file-x": '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="m14.5 12.5-5 5"/><path d="m9.5 12.5 5 5"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  key: '<path d="m2 21 9.6-9.6"/><path d="m7.5 15.5 2.3 2.3a1 1 0 0 1 0 1.4l-2.1 2.1a1 1 0 0 1-1.4 0L4 19"/><circle cx="15.5" cy="7.5" r="5.5"/>',
  "app-window": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><path d="M6 4v4"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  circle: '<circle cx="12" cy="12" r="10"/>',
};

/** The drawings a `MEDIA_TOP` item may name: the four layouts' wireframes, and a plain frame for any other name. */
const WIRES: Record<string, string> = {
  rail: '<rect class="nav" x="1" y="1" width="34" height="94" rx="3"/><rect class="line" x="8" y="10" width="20" height="4" rx="2"/><rect class="line" x="8" y="22" width="16" height="3" rx="1.5"/><rect class="line" x="8" y="30" width="18" height="3" rx="1.5"/><rect class="line" x="12" y="38" width="14" height="3" rx="1.5"/><rect class="line" x="12" y="46" width="12" height="3" rx="1.5"/><rect class="line" x="46" y="12" width="60" height="5" rx="2"/><rect class="box" x="46" y="26" width="104" height="60" rx="3"/>',
  dock: '<rect class="nav" x="1" y="1" width="158" height="14" rx="3"/><rect class="line" x="8" y="6" width="20" height="4" rx="2"/><rect class="nav" x="8" y="22" width="34" height="66" rx="3"/><rect class="line" x="13" y="30" width="22" height="3" rx="1.5"/><rect class="line" x="13" y="38" width="18" height="3" rx="1.5"/><rect class="line" x="13" y="46" width="20" height="3" rx="1.5"/><rect class="line" x="52" y="24" width="56" height="5" rx="2"/><rect class="box" x="52" y="36" width="98" height="52" rx="3"/>',
  topnav: '<rect class="nav" x="1" y="1" width="158" height="14" rx="3"/><rect class="line" x="8" y="6" width="20" height="4" rx="2"/><rect class="line" x="80" y="6.5" width="14" height="3" rx="1.5"/><rect class="line" x="100" y="6.5" width="14" height="3" rx="1.5"/><rect class="line" x="120" y="6.5" width="14" height="3" rx="1.5"/><rect class="line" x="30" y="26" width="64" height="5" rx="2"/><rect class="box" x="30" y="38" width="100" height="50" rx="3"/>',
  canvas: '<rect class="box" x="50" y="22" width="60" height="52" rx="3"/><rect class="line" x="60" y="32" width="40" height="4" rx="2"/><rect class="line" x="60" y="44" width="40" height="6" rx="2"/><rect class="nav" x="60" y="58" width="40" height="8" rx="2"/>',
};

type CatalogItem = { name: string; line: string; third: string; facts: [string, string][] };
type CatalogGroup = { name: string | null; items: CatalogItem[] };

/** A fence tag's `key=value` words, and the bare words beside them. */
function tagWords(tag: string): { words: string[]; options: Record<string, string> } {
  const words: string[] = [], options: Record<string, string> = {};
  for (const word of tag.split(/\s+/).filter(Boolean)) {
    const at = word.indexOf("=");
    if (at > 0) options[word.slice(0, at)] = word.slice(at + 1); else words.push(word);
  }
  return { words, options };
}

/**
 * A `catalog` fence's lines: an item is an unindented `Name | one line | third` line, and the indented lines under it are its
 * facts, `Key: value`, one a line; a key is a word or two, never a sentence. A line `## <Group name>` starts a group.
 */
function catalogLines(body: string[], findings: Finding[]): CatalogGroup[] {
  const groups: CatalogGroup[] = [{ name: null, items: [] }];
  for (const raw of body) {
    if (!raw.trim()) continue;
    const group = /^##\s+(\S.*)$/.exec(raw);
    if (group) { groups.push({ name: group[1].trim(), items: [] }); continue; }
    if (/^\s+\S/.test(raw)) {
      const item = groups[groups.length - 1].items.at(-1);
      const fact = /^\s+[-*]?\s*([^:]+?):\s+(\S.*)$/.exec(raw);
      if (!item) { findings.push({ message: `a \`catalog\` fact with no item above it: "${raw.trim()}"` }); continue; }
      if (!fact || fact[1].trim().split(/\s+/).length > 3) { findings.push({ message: `a \`catalog\` fact is \`Key: value\`, with a key of a word or two, never a sentence: "${raw.trim()}"` }); continue; }
      item.facts.push([fact[1].trim(), fact[2].trim()]);
      continue;
    }
    if (raw.startsWith("#")) continue;
    const [name, line = "", third = ""] = raw.trim().replace(/^[-*]\s+/, "").split(/\s+\|\s+/).map((cell) => cell.trim());
    groups[groups.length - 1].items.push({ name, line, third, facts: [] });
  }
  if (!groups[0].items.length) groups.shift();
  return groups;
}

/** One item's media: the span (or, for `MEDIA_TOP`, the picture) the fence's one media names. */
function mediaOf(media: string, item: CatalogItem, findings: Finding[]): string {
  const text = item.name.replace(/`/g, "");
  if (media === "ICON" || media === "MARK") {
    const key = item.third.replace(/^`|`$/g, "").toLowerCase().replace(/[\s_]+/g, "-");
    if (key && !ICONS[key]) findings.push({ message: `a \`catalog\` item names the icon "${item.third}", which is none of: ${Object.keys(ICONS).join(", ")}` });
    return `<span class="sds-tile-media" data-media="${media}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[key] ?? ICONS.circle}</svg></span>`;
  }
  if (media === "AVATAR") return `<span class="sds-tile-media" data-media="AVATAR">${esc((item.third || text.charAt(0)).toUpperCase())}</span>`;
  if (media === "AVATAR_GROUP") {
    const initials = (item.third ? item.third.split(",").map((one) => one.trim()).filter(Boolean) : [text.charAt(0)]).slice(0, 4);
    return `<span class="sds-tile-media" data-media="AVATAR_GROUP">${initials.map((one) => `<span>${esc(one.toUpperCase())}</span>`).join("")}</span>`;
  }
  const wire = item.third.replace(/^`|`$/g, "").toLowerCase();
  if (wire && !WIRES[wire]) findings.push({ message: `a \`catalog\` MEDIA_TOP item names the drawing "${item.third}", which is none of: ${Object.keys(WIRES).join(", ")}` });
  return `<div class="sds-tile-picture"><svg class="sds-wire" viewBox="0 0 160 96" aria-hidden="true"><rect class="frame" x="0.5" y="0.5" width="159" height="95" rx="4"/>${WIRES[wire] ?? ""}</svg></div>`;
}

/** The cards of one set of items, as the fence's layout and media draw them. Without either, and with no facts, the one-line tile of old. */
function catalogHtml(items: CatalogItem[], layout: string | null, media: string | null, findings: Finding[], compact = false): string {
  const hasFacts = items.some((item) => item.facts.length);
  const words = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;
  const longForCards = items.some((item) => words(item.name) > 4 || words(item.line ?? "") > 15 || item.facts.length > 3 || item.facts.some(([, value]) => words(value) > 5));
  if (!layout && longForCards) findings.push({ message: "these items are long for cards: layout=LIST (rule 549)" });
  const condition = items.find((item) => readsAsCondition(item.name));
  if (condition) findings.push({ message: `a \`catalog\` item "${condition.name}" reads as a condition: a first column of conditions is a table (rule 549)` });
  if (!layout && !media && !hasFacts) {
    const tiles = items.map(({ name, line, third }) => `    <div class="sds-tile"><h4>${inline(name)}</h4>${line ? `<p>${inline(line)}</p>` : ""}${third ? `<p class="sds-small"><code>${esc(third.replace(/^`|`$/g, ""))}</code></p>` : ""}</div>`);
    return `  <div class="sds-tiles">\n${tiles.join("\n")}\n  </div>`;
  }
  const kind = layout ?? "GRID";
  if (kind === "TABLE") {
    if (media) findings.push({ message: `a \`catalog\` in TABLE has no media; \`media=${media}\` is not drawn` });
    const keys: string[] = [];
    for (const item of items) for (const [key] of item.facts) if (!keys.includes(key)) keys.push(key);
    const head = items.map((item) => `<th><h4>${inline(item.name)}</h4>${item.line ? `<p>${inline(item.line)}</p>` : ""}</th>`).join("");
    const rows = keys.map((key) => `      <tr><th>${inline(key)}</th>${items.map((item) => `<td>${inline(item.facts.find(([name]) => name === key)?.[1] ?? "")}</td>`).join("")}</tr>`);
    return `  <div class="sds-scroll"><table class="sds-catalog-table">\n    <thead><tr><th></th>${head}</tr></thead>\n    <tbody>\n${rows.join("\n")}\n    </tbody>\n  </table></div>`;
  }
  let kept = media;
  if (kept === "MEDIA_TOP" && kind !== "GRID") { findings.push({ message: "a `catalog` draws `media=MEDIA_TOP` in GRID only" }); kept = null; }
  const tiles = items.map((item) => {
    const facts = item.facts.length
      ? `<dl class="sds-tile-facts${kind === "LIST" && item.facts.length === 1 ? " sds-tile-facts-one" : ""}">${item.facts.map(([key, value]) => `<div><dt>${inline(key)}</dt><dd>${inline(value)}</dd></div>`).join("")}</dl>` : "";
    if (kind === "GRID" && item.facts.length > 3) findings.push({ message: `a GRID card holds up to three facts, "${item.name}" has ${item.facts.length}; use \`layout=LIST\`` });
    const count = kind === "GRID" && item.facts.length ? ` data-facts="${Math.min(item.facts.length, 3)}"` : "";
    const words = `<h4>${inline(item.name)}</h4>${item.line ? `<p>${inline(item.line)}</p>` : ""}`;
    if (kind === "LIST") {
      const mediaHtml = kept ? mediaOf(kept, item, findings) : "";
      return `    <div class="sds-tile">${mediaHtml}<div class="sds-tile-body">${words}\n      ${facts}</div></div>`;
    }
    if (kept === "MEDIA_TOP") return `    <div class="sds-tile"${count}>${mediaOf(kept, item, findings)}\n      <div class="sds-tile-head"><div>${words}</div></div>\n      ${facts}</div>`;
    if (kept) return `    <div class="sds-tile"${count}><div class="sds-tile-head">${mediaOf(kept, item, findings)}<div>${words}</div></div>\n      ${facts}</div>`;
    return `    <div class="sds-tile"${count}><h4>${inline(item.name)}</h4>${item.line ? `<p class="sds-tile-line">${inline(item.line)}</p>` : ""}${item.third ? `<p class="sds-small"><code>${esc(item.third.replace(/^`|`$/g, ""))}</code></p>` : ""}\n      ${facts}</div>`;
  });
  return `  <div class="sds-tiles${compact ? " sds-tiles-compact" : ""}" data-layout="${kind}"${kept ? ` data-media="${kept}"` : ""}>\n${tiles.join("\n")}\n  </div>`;
}

/** Group ids already used on the page, so a second catalog's group of the same name gets its own anchor. */
let groupIds = new Set<string>();

/**
 * A `catalog` fence: ```catalog layout=GRID|LIST|TABLE media=ICON|MARK|AVATAR|AVATAR_GROUP|MEDIA_TOP. The item line is
 * `Name | one line | third`, and the third cell is the literal (a code line) where the fence has no media, the icon's name with
 * ICON and MARK (`globe`, `file`, `file-x`, `shield`, `key`, `app-window`, `user`), the initials with AVATAR, a comma list of
 * initials with AVATAR_GROUP, and a drawing's name with MEDIA_TOP (`rail`, `dock`, `topnav`, `canvas`). With two or more
 * `## Group` lines, each group is a panel and a row of links above them jumps to each.
 */
function catalogBlock(tag: string, body: string[], findings: Finding[]): string {
  const { options } = tagWords(tag);
  let layout: string | null = null, media: string | null = null;
  if ("layout" in options) {
    if (!CATALOG_LAYOUTS.includes(options.layout)) findings.push({ message: `a \`catalog\` layout is one of ${CATALOG_LAYOUTS.join(", ")}, not \`${options.layout}\``, stops: true });
    else layout = options.layout;
  }
  if ("media" in options) {
    if (!CATALOG_MEDIA.includes(options.media)) findings.push({ message: `a \`catalog\` media is one of ${CATALOG_MEDIA.join(", ")}, not \`${options.media}\``, stops: true });
    else media = options.media;
  }
  const groups = catalogLines(body, findings);
  if (!groups.length) { findings.push({ message: "a `catalog` block with no line" }); return ""; }
  const named = groups.filter((group) => group.name !== null);
  if (named.length < 2) return catalogHtml(groups.flatMap((group) => group.items), layout, media, findings);
  const out: string[] = [];
  if (groups[0].name === null) {
    findings.push({ message: "a `catalog` with groups holds items above its first `## Group` line; they are drawn before the panels" });
    out.push(catalogHtml(groups[0].items, layout, media, findings));
  }
  const panels = named.map((group) => {
    if (!group.items.length) findings.push({ message: `a \`catalog\` group with no item, "${group.name}"` });
    let id = `g-${anchorOf(group.name as string)}`;
    for (let n = 2; groupIds.has(id); n++) id = `g-${anchorOf(group.name as string)}-${n}`;
    groupIds.add(id);
    const compact = layout !== "LIST" && layout !== "TABLE" && !media && group.items.every((item) => !item.facts.length);
    const members = group.items.length ? catalogHtml(group.items, layout ?? "GRID", media, findings, compact) : "";
    const count = `${group.items.length} ${group.items.length === 1 ? "item" : "items"}`;
    return { id, group, count, html: `<section class="sds-group" id="${id}" aria-labelledby="${id}-title">\n  <div class="sds-group-head"><h5 id="${id}-title">${inline(group.name as string)}</h5><span class="sds-group-count">${count}</span></div>\n  <div class="sds-group-body">${members.trim()}</div>\n</section>` };
  });
  out.push(`  <nav class="sds-group-jumps" aria-label="Groups">${panels.map((p) => `<a class="sds-group-jump" href="#${p.id}">${inline(p.group.name as string)} <span>${p.group.items.length}</span></a>`).join(" ")}</nav>`);
  out.push(...panels.map((p) => p.html));
  return out.join("\n");
}

// ---------------------------------------------------------------------------- the TABS block

const TAB_LOOKS = ["LINE", "SWITCH", "PILL"];
/** How many tabsets this page has drawn, so each tab and panel has its own id. */
let tabsDrawn = 0;

/**
 * A fence opened with tildes: `~~~tabs look=LINE|SWITCH|PILL`, a `--- <label>` line before each panel, and a closing `~~~`.
 * Each panel's body is ordinary markdown, drawn by the body renderer; tabs inside tabs are refused, and so are fewer than
 * two or more than six tabs. Every panel is in the markup, so with no script every panel shows.
 */
function tabsBlock(tag: string, body: string[], findings: Finding[], nested: boolean): string {
  const stop = (message: string): string => { findings.push({ message, stops: true }); return ""; };
  const { options } = tagWords(tag);
  const look = options.look ?? "LINE";
  if (!TAB_LOOKS.includes(look)) return stop(`a \`tabs\` look is one of ${TAB_LOOKS.join(", ")}, not \`${look}\``);
  if (nested || body.some((line) => /^~~~\S/.test(line))) return stop("tabs inside tabs are refused: a panel holds ordinary blocks, and a second set of alternatives is a fold or a part of its own");
  const panels: { label: string; lines: string[] }[] = [];
  let fenced = false;
  for (const line of body) {
    if (/^```/.test(line)) fenced = !fenced;
    const start = fenced ? null : /^---\s+(\S.*)$/.exec(line);
    if (start) panels.push({ label: start[1].trim(), lines: [] });
    else if (panels.length) panels[panels.length - 1].lines.push(line);
    else if (line.trim()) return stop("a `tabs` fence starts each panel with a `--- <label>` line, and holds nothing before the first");
  }
  if (panels.length < 2 || panels.length > 6) return stop(`a \`tabs\` fence takes two to six tabs, this one has ${panels.length}`);
  const n = ++tabsDrawn;
  const bar = panels.map((panel, k) => `      <button type="button" role="tab" id="t-${n}-${k + 1}" aria-controls="p-${n}-${k + 1}" aria-selected="${k === 0}">${inline(panel.label)}</button>`);
  const body_ = panels.map((panel, k) => `    <div class="sds-tabset-panel" role="tabpanel" id="p-${n}-${k + 1}" aria-labelledby="t-${n}-${k + 1}">\n${renderBody(panel.lines, findings, true)}\n    </div>`);
  return `  <div class="sds-tabset" data-type="${look}">\n    <div class="sds-tabset-bar" role="tablist" aria-label="${esc(panels.map((p) => p.label).join(", "))}">\n${bar.join("\n")}\n    </div>\n${body_.join("\n")}\n  </div>`;
}

/**
 * The blocks that have a spelling of their own in markdown, each a fenced block tagged with its name and holding one line per thing, its parts split on ` | `:
 *   catalog   Name | one line | third, and facts indented under it       see `catalogBlock`; the tag takes layout= and media=
 *   cards     Title | description | link                                  a door each, title and Read more both links
 *   next      previous | Title | link, and next | Title | link            the two doors either side of the page
 */
function spelled(kind: string, body: string[], findings: Finding[]): string {
  const rows = body.map((row) => row.trim()).filter((row) => row && !row.startsWith("#")).map((row) => row.replace(/^[-*]\s+/, "").split(/\s+\|\s+/).map((cell) => cell.trim()));
  if (!rows.length) { findings.push({ message: `a \`${kind}\` block with no line` }); return ""; }
  if (kind === "cards") {
    const tiles = rows.map(([title, line = "", link = ""]) => {
      if (!link) findings.push({ message: `a \`cards\` line with no link, "${title}" — a card is Title | description | link` });
      const href = rewriteHref(link || "#");
      return `    <div class="sds-tile"><h4><a href="${esc(href)}">${inline(title)}</a></h4>${line ? `<p>${inline(line)}</p>` : ""}<a class="sds-more" href="${esc(href)}">Read more &rarr;</a></div>`;
    });
    return `  <div class="sds-tiles">\n${tiles.join("\n")}\n  </div>`;
  }
  const door = (direction: string) => {
    const row = rows.find((one) => one[0].toLowerCase() === direction);
    if (!row) return "";
    const [, title = "", link = ""] = row;
    const mark = direction === "previous" ? "&larr; Previous" : "Next &rarr;";
    return `    <a class="sds-nextnav-card${direction === "next" ? " sds-next" : ""}" href="${esc(rewriteHref(link || "#"))}"><span class="sds-direction">${mark}</span><span class="sds-title">${inline(title)}</span></a>`;
  };
  const doors = [door("previous"), door("next")].filter(Boolean);
  if (!doors.length) { findings.push({ message: "a `next` block with no `previous | Title | link` or `next | Title | link` line" }); return ""; }
  return `  <div class="sds-nextnav">\n${doors.join("\n")}\n  </div>`;
}

/** One section's body: paragraphs, tables, lists, fenced blocks and figures. */
function renderBody(lines: string[], findings: Finding[], nested = false): string {
  const out: string[] = [];
  let i = 0;
  const para: string[] = [];
  const flush = () => { if (para.length) { out.push(`  <p>${inline(para.join(" "))}</p>`); para.length = 0; } };

  while (i < lines.length) {
    const l = lines[i];

    // An HTML comment in the seat file is a note to the author — a RESTATES header, a block
    // declaration — and never part of the page. Before this it was escaped into the paragraph and
    // the reader saw the whole note as text (N13's sample, 2026-09-21). Single-line or spanning lines.
    if (/^\s*<!--/.test(l)) {
      flush();
      while (i < lines.length && !/-->\s*$/.test(lines[i])) i++;
      i++; continue;
    }

    // A `###` is a part and a `####` a sub-part; both are headings the seat file may use, so both are
    // rendered. Before this, a `####` fell through to the paragraph path and the reader saw the
    // hashes as text — found on the first page long enough to need one (N13's sample, 2026-09-21).
    if (/^#{3,5}\s/.test(l)) {
      flush();
      const level = (l.match(/^#+/) ?? ["###"])[0].length;
      const t = l.replace(/^#+\s*/, "");
      out.push(`  <h${level} id="${anchorOf(t)}">${inline(t)}</h${level}>`);
      i++; continue;
    }
    // A fence of tildes is the TABS block, closed by a line of three tildes alone.
    if (/^~~~tabs\b/.test(l)) {
      flush();
      const tag = l.replace(/^~~~/, "").trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^~~~\s*$/.test(lines[i])) body.push(lines[i++]);
      if (i >= lines.length) findings.push({ message: "a `tabs` fence is never closed with `~~~`", stops: true });
      i++;
      out.push(tabsBlock(tag, body, findings, nested));
      continue;
    }
    if (/^```/.test(l)) {
      flush();
      const tag = l.replace(/^```/, "").trim();
      // A fence tag is a language, and may carry `file=<path>`: the block then stands in a FILE frame titled by that path,
      // and the word `fold` draws that frame inside a `details` whose summary is the path.
      const fileAt = /\bfile=(\S+)/.exec(tag);
      const folded = /(?:^|\s)fold(?=\s|$)/.test(tag);
      const lang = tag.replace(/\bfile=\S+/, "").replace(/(?:^|\s)fold(?=\s|$)/, " ").trim();
      const kind = lang.split(/\s+/)[0];
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
      i++;
      // A FOLDED FENCE WITH NO BODY READS ITS FILE: the path is relative to the folder holding `docs/`, so a page shows a spec
      // without copying it into the markdown. A path that is not there stops the write.
      if (folded && fileAt && !body.some((line) => line.trim())) {
        const where = pageRoot ? resolve(pageRoot, fileAt[1]) : null;
        if (!where || !existsSync(where)) {
          findings.push({ message: `a folded fence with no body reads \`${fileAt[1]}\` from the repository root${pageRoot ? "" : " (the page's folder holding `docs/` is not known)"}, and no file is there`, stops: true });
          continue;
        }
        body.push(...readFileSync(where, "utf8").replace(/\n$/, "").split("\n"));
      }
      if (kind === "catalog") {
        out.push(catalogBlock(lang, body, findings));
      } else if (lang === "cards" || lang === "next") {
        out.push(spelled(lang, body, findings));
      } else if (lang === "unit") {
        out.push(unitFrame(body, findings));
      } else if (lang === "dg") {
        let spec: Spec | null = null;
        try { spec = JSON.parse(body.join("\n")); } catch (e) { findings.push({ message: `a \`dg\` figure is not strict JSON — ${(e as Error).message}` }); }
        if (spec) {
          builtSkeleton(spec, findings);
          const { svg, findings: df } = draw(spec);
          for (const m of df) findings.push({ message: m });
          if (svg) {
            out.push(figureOf(spec, svg, spec.caption ? inline(spec.caption) : ""));
            // The spec stays in the page as a comment, so the figure's source travels with it.
            out.push(`  <!-- dg:source\n${body.join("\n")}\n  -->`);
          }
        }
      } else if (lang === "html") {
        out.push(body.join("\n"));
      } else {
        // The page holds plain code, tagged with its language. The shared script colours the block
        // when the page opens, so no colour is written here.
        const pre = `<pre${lang ? ` data-lang="${lang}"` : ""}>${lang ? escapedCode(body.join("\n")) : esc(body.join("\n"))}</pre>`;
        if (folded && !fileAt) findings.push({ message: "the word `fold` needs a `file=<path>` in the same fence tag: the fold's summary is the path" });
        if (fileAt) {
          const frame = `  <figure class="sds-file">\n    <figcaption><span class="sds-file-path">${esc(fileAt[1])}</span>${lang ? `<span class="sds-file-lang">${esc(lang)}</span>` : ""}</figcaption>\n    ${pre}\n  </figure>`;
          out.push(folded ? `  <details class="sds-fold">\n    <summary>${esc(fileAt[1])}</summary>\n${frame}\n  </details>` : frame);
        } else out.push(`  ${pre}`);
      }
      continue;
    }
    if (/^\s*\|/.test(l)) {
      flush();
      const block: string[] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) block.push(lines[i++]);
      if (block.length >= 2) out.push(table(block, findings));
      else findings.push({ message: "a table with no body row" });
      continue;
    }
    if (/^[-*]\s/.test(l)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) items.push(lines[i++].replace(/^[-*]\s*/, ""));
      out.push(`  <ul>\n${items.map((x) => `    <li>${inline(x)}</li>`).join("\n")}\n  </ul>`);
      continue;
    }
    // A numbered list, where the order IS the content. Without this it fell through to the paragraph
    // path and the reader met one run-on paragraph beginning with the characters `1.` — found on the
    // Sign-in construct, whose four organization checks run in a fixed order (N13, 2026-09-22).
    if (/^\d+[.)]\s/.test(l)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i])) items.push(lines[i++].replace(/^\d+[.)]\s*/, ""));
      out.push(`  <ol>\n${items.map((x) => `    <li>${inline(x)}</li>`).join("\n")}\n  </ol>`);
      continue;
    }
    if (/^>\s?/.test(l)) {
      flush();
      const q: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`  <div class="sds-pull"><p>${inline(q.join(" "))}</p></div>`);
      continue;
    }
    if (!l.trim()) { flush(); i++; continue; }
    para.push(l.trim());
    i++;
  }
  flush();
  return out.join("\n");
}

export function renderPage(opts: {
  block: any;
  markdown: string;
  workspace: string;
  location: string;
  /** The line that links the shared stylesheet, the line that loads the shared script, and the footer. */
  furniture: { stylesheet: string; script: string; footer: string };
  /** Given a seat file's href, the one the produced page should carry. Identity when omitted. */
  link?: (href: string) => string;
  /**
   * The way back, named for where it goes (Q238).
   *
   * A page's way back is the page one level up IN THE SAME RENDERING, and it says which one:
   * a construct returns to its domain's overview, an overview to its repository. The corpus had
   * SEVEN vocabularies for this link across 157 pages — `← the model` on 117 of them — and only
   * two of the seven named a destination at all. The rest named a CATEGORY, which tells a reader
   * what kind of thing they are going to and not which one. Omitted, the constructs seat's own
   * face stands, which is what every produced page carried before.
   */
  home?: { href: string; label: string };
  /** The folder holding `docs/`: where a folded fence with no body reads its `file=` path from (`docsRoot(seat)`). */
  root?: string | null;
}): { html: string; findings: Finding[] } {
  const previousRewrite = rewriteHref, previousRoot = pageRoot;
  rewriteHref = opts.link ?? ((h) => h);
  pageRoot = opts.root ?? null;
  try {
    return renderPageBody(opts);
  } finally {
    rewriteHref = previousRewrite;
    pageRoot = previousRoot;
  }
}

function renderPageBody(opts: Parameters<typeof renderPage>[0]): { html: string; findings: Finding[] } {
  const findings: Finding[] = [];
  const { block } = opts;
  const lines = opts.markdown.split("\n");
  tabsDrawn = 0; groupIds = new Set(); unitUsed = false; unitStylesheet = opts.furniture.stylesheet;

  // Everything above the first `##` is the lead: the h1 and the tag line are the masthead's,
  // so they are dropped here rather than rendered twice.
  // A `## ` line inside a fence is not a section: a catalog fence uses it for its groups.
  const sectionAt = new Set<number>();
  for (let k = 0, fence = ""; k < lines.length; k++) {
    if (fence) { if (fence === "```" ? /^```/.test(lines[k]) : /^~~~\s*$/.test(lines[k])) fence = ""; continue; }
    if (/^```/.test(lines[k])) fence = "```"; else if (/^~~~tabs\b/.test(lines[k])) fence = "~~~"; else if (/^##\s/.test(lines[k])) sectionAt.add(k);
  }
  const firstSection = lines.findIndex((_, k) => sectionAt.has(k));
  const leadLines = lines.slice(0, firstSection < 0 ? lines.length : firstSection)
    .filter((l) => !/^#\s/.test(l) && !/^`(For|Lenses):/.test(l.trim()));
  // The first lead paragraph is the standfirst — the page's promise in one line — and the ones after it
  // are the summary. Rendering the first with the standfirst class is what gives a construct the same
  // masthead rhythm as an overview (the developer's rule, 2026-09-21).
  const lead = renderBody(leadLines, findings).replace(/^(\s*)<p>/, "$1<p class=\"sds-standfirst\">");

  const sections: string[] = [];
  if (firstSection >= 0) {
    const bounds: number[] = [];
    lines.forEach((_, k) => { if (k >= firstSection && sectionAt.has(k)) bounds.push(k); });
    bounds.push(lines.length);
    for (let s = 0; s < bounds.length - 1; s++) {
      const heading = lines[bounds[s]].replace(/^##\s*/, "");
      const name = heading.split(/\s+[—–-]\s+/)[0].trim();
      const body = lines.slice(bounds[s] + 1, bounds[s + 1]);
      sections.push(
        `<!-- ${String(s).padStart(2, "0")} -->\n` +
        // NOTHING DECLARES *THE* BLOCK OF A SECTION, because a section rarely has one. The renderer
        // stamped one anyway, guessed from the section's NAME — Model became `map`, Parts became
        // `reasons`, anything with a table became `comparison` — which is the model the developer
        // corrected: *blocks are not dictating usual paragraphs and text, blocks are basically have
        // different visual appeal to differentiate from normal paragraphs list etc..* A block is a
        // visually distinct insert a section may hold none, one or several of, so an attribute
        // naming one per section was a claim the chapter denies (05-artifacts.md § The blocks).
        `<section id="s${s}">\n` +
        // A number orders a file in a tree; a heading is a name. The section head carries no number
        // on the page and none in the rail (the developer's rule, 2026-09-21).
        `  <div class="sds-section-head"><h2>${inline(heading)}</h2></div>\n` +
        renderBody(body, findings) + `\n</section>`);
    }
  }

  const lensChips = (block.lenses ?? []).map((l: string) => {
    if (!LENS_LABEL[l]) findings.push({ message: `\`${l}\` is not a lens` });
    return `<span class="sds-badge sds-lens">${LENS_LABEL[l] ?? l}</span>`;
  }).join("");
  const type = block.variant ? block.variant.charAt(0).toUpperCase() + block.variant.slice(1) : "";
  const statusPart = block.variant === "overview" || !block.status ? "" :
    `<span class="sds-state"><span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-${String(block.status).toLowerCase()}">${STATUS_GLYPH[block.status] ?? ""} ${block.status}</span></span>`;

  // The Subtitle is the seat block's `subtitle` field, one plain sentence under the title; the lead's
  // first paragraph stays the Description (RULE.DEVEX.WORKSPACE.187).
  const subtitle = block.subtitle ? `  <p class="sds-subtitle">${esc(String(block.subtitle))}</p>\n` : "";

  // THE PAGE'S SHORT NAME AND ITS HEADING ARE TWO THINGS. `name` is the tab, the outline's title, the eyebrow's last segment and the index
  // entry, at most three words (RULE.DEVEX.WORKSPACE.517); `title` is the heading, in the `<h1>` alone. A block with no `name` has the
  // `title` for both, so no seat needs a change. A `name` of more than three words stops the write.
  const name = typeof block.name === "string" && block.name.trim() ? block.name.trim() : String(block.title ?? "");
  if (typeof block.name === "string" && nameWords(block.name) > 3)
    findings.push({ message: `\`name\` is ${nameWords(block.name)} words, and a short name is at most three (RULE.DEVEX.WORKSPACE.517): ${block.name.trim()}`, stops: true });
  const masthead =
`<header class="sds-masthead">
  <!-- Rendered from the spn:doc block by \`docs.ts page\`. Never typed: a header that disagreed with its block is what this removes. -->
  <div class="sds-eyebrow"><span class="sds-line1">${opts.workspace} &nbsp;|&nbsp; ${opts.location} &nbsp;|&nbsp; ${esc(name)}</span><span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">${type}</span><span class="sds-separator">|</span><span class="sds-label">For:</span> <span class="sds-audience">${lensChips}</span>${statusPart}</span></div>
  <h1>${esc(block.title)}</h1>
${subtitle}${lead}
</header>`;

  const html = [
    `<meta charset="utf-8">`,
    `<title>${esc(name)}</title>`,
    `<!-- spn:doc\n${JSON.stringify(block)}\n-->`,
    `<!-- Produced by \`docs.ts page\` from the seat file. Never edit this page: edit the seat file and produce it again. -->`,
    opts.furniture.stylesheet,
    // A page that draws a unit also links the design system's unit styles, from the folder of the shared stylesheet, after it.
    ...(unitUsed && /sds-docs\.css/.test(opts.furniture.stylesheet)
      ? [opts.furniture.stylesheet.replace(/sds-docs\.css/, "ds-unit.css").replace(/\s(?:integrity|crossorigin)="[^"]*"/g, "")] : []),
    `<div class="sds-page">`,
    ``,
    `<nav class="sds-rail" id="rail">`,
    // THE RAIL CARRIES THE PAGE'S OWN NAME, NOT THE WORD `Outline` (Q239). A reader already knows a
    // rail is an outline — it is a list of this page's headings sitting beside them. What the label
    // can add is WHOSE, which is the one thing the rail does not say once the masthead has scrolled
    // away. 157 of 157 pages said `Outline`, and `blocks-template.html` already said `Blocks`.
    `  <div class="sds-rail-title">${esc(name || "Outline")}</div>`,
    `</nav>`,
    `<div class="sds-wrap">`,
    // THE WAY BACK NAMES WHERE IT GOES (Q238), and it is the breadcrumb above the masthead, not a link in the rail. Where the caller
    // resolved the page above this one — a construct's domain overview — that page is named. Where it could not, the constructs
    // seat's own face stands: the seat file sits one level under it, so `../README.md` is the link an author would write,
    // re-expressed for the page's folder by the same rewriter the body uses.
    opts.home
      ? `<p class="sds-crumb"><a href="${opts.home.href}">&larr; ${esc(opts.home.label)}</a></p>`
      : `<p class="sds-crumb"><a href="${rewriteHref("../README.md")}">&larr; the model</a></p>`,
    ``,
    masthead,
    ``,
    sections.join("\n\n"),
    ``,
    opts.furniture.footer,
    ``,
    `</div>`,
    `</div>`,
    ``,
    opts.furniture.script,
    ``,
  ].join("\n");

  return { html, findings };
}
