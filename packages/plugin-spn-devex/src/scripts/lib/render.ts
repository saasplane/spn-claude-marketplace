// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The header · § The blocks
//           docs/04-capabilities/01-devex/04-workspace/04-docs/02-document.md § Metadata
// The chapters are the source of truth. A rule change is edited there first, then here, in the same change.
//
// The page, produced from the seat file. The agent authors the markdown; this writes the HTML —
// the body from the markdown, each figure drawn from its spec, then the furniture. So a page is
// never hand-edited, and the header can never disagree with the block it is rendered from.
//
// It is deliberately a small renderer rather than a markdown library: the seat file's grammar is
// closed — headings, paragraphs, tables, lists, fenced blocks — and a dependency would have to be
// installed on a partner's machine to read a document.

import { basename, dirname, relative, resolve } from "node:path";
import { existsSync } from "node:fs";

import { draw, type Spec } from "./draw.ts";
import { colour } from "./figures.ts";

export type Finding = { message: string; line?: number };

const LENS_LABEL: Record<string, string> = {
  LEAD: "Engineering leader", BUSINESS: "Business manager", PRODUCT: "Product manager",
  ARCHITECT: "Architect", SERVER_DEV: "Backend developer", WEB_DEV: "Web developer",
  QA: "Quality engineer", INFRA: "DevOps / SRE", TRUST: "DevSecOps / Security",
  PARTNER: "Partner / integrator", VOICE: "Editor",
};
const STATUS_GLYPH: Record<string, string> = { DONE: "&#x2705;", IMPLEMENTING: "&#x1F6A7;", PLANNING: "&#x1F52E;" };

/** The block a section declares, chosen the way the chapter's own order chooses it. */
const esc = (s: string) => s.replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Inline markdown, in the order that stops one form eating another. Inline code is held behind a
 * marker so no later pass can see inside it — the marker carries its index in letters and is built
 * from SUB at runtime, for the reason `figures.ts` records: a digit in the marker gets matched, and
 * writing the control character as a literal puts raw NUL bytes in this file.
 */
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
  return (href) => {
    if (/^(?:[a-z]+:|#|\/\/|\/)/i.test(href)) return href;
    const hash = href.indexOf("#");
    const path = hash < 0 ? href : href.slice(0, hash);
    const frag = hash < 0 ? "" : href.slice(hash);
    if (!path) return href;
    let target = resolve(seatDir, path);
    if (/\/02-constructs\/.*\.md$/.test(target) && basename(target) !== "README.md")
      target = target.replace("/02-constructs/", "/artifacts/constructs/").replace(/\.md$/, "-construct.html");
    const rel = relative(outDir, target);
    return (rel.startsWith(".") ? rel : `./${rel}`) + frag;
  };
}

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
  return out.replace(new RegExp(`${SEP}([a-z]+)${SEP}`, "g"), (_, k: string) => {
    let i = 0;
    for (const ch of k) i = i * 26 + (ch.charCodeAt(0) - 96);
    return `<code>${esc(code[i - 1])}</code>`;
  });
}

function table(lines: string[]): string {
  // A `\|` inside a cell is a pipe the author wants shown, not a column break — markdown's own rule,
  // and the one the first pattern table in the corpus needed (`{org}-{family}-public\|-private`).
  const cells = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
  const head = cells(lines[0]);
  const rows = lines.slice(2).map(cells);
  const th = head.map((c) => `<th>${inline(c)}</th>`).join("");
  const tb = rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("\n      ");
  return `  <div class="scroll"><table>\n    <thead><tr>${th}</tr></thead>\n    <tbody>\n      ${tb}\n    </tbody>\n  </table></div>`;
}

function anchorOf(text: string): string {
  return text.toLowerCase().replace(/`/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

/** One section's body: paragraphs, tables, lists, fenced blocks and figures. */
function renderBody(lines: string[], findings: Finding[]): string {
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
    if (/^```/.test(l)) {
      flush();
      const lang = l.replace(/^```/, "").trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
      i++;
      if (lang === "dg") {
        let spec: Spec | null = null;
        try { spec = JSON.parse(body.join("\n")); } catch (e) { findings.push({ message: `a \`dg\` figure is not strict JSON — ${(e as Error).message}` }); }
        if (spec) {
          const { svg, findings: df } = draw(spec);
          for (const m of df) findings.push({ message: m });
          if (svg) {
            out.push(`  <figure>\n${svg.split("\n").map((x) => "  " + x).join("\n")}`);
            if (spec.caption) out.push(`    <figcaption>${inline(spec.caption)}</figcaption>`);
            out.push(`  </figure>`);
            // The spec stays in the page as a comment, so the figure's source travels with it.
            out.push(`  <!-- dg:source\n${body.join("\n")}\n  -->`);
          }
        }
      } else if (lang === "html") {
        out.push(body.join("\n"));
      } else {
        // Colour is added when the page is produced, as spans the stylesheet colours in both
        // themes. No highlighter runs in the reader's browser.
        out.push(`  <pre${lang ? ` data-lang="${lang}"` : ""}>${lang ? colour(body.join("\n"), lang) : esc(body.join("\n"))}</pre>`);
      }
      continue;
    }
    if (/^\s*\|/.test(l)) {
      flush();
      const block: string[] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) block.push(lines[i++]);
      if (block.length >= 2) out.push(table(block));
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
      out.push(`  <div class="pull"><p>${inline(q.join(" "))}</p></div>`);
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
  furniture: { style: string; scripts: string; footer: string };
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
}): { html: string; findings: Finding[] } {
  const previousRewrite = rewriteHref;
  rewriteHref = opts.link ?? ((h) => h);
  try {
    return renderPageBody(opts);
  } finally {
    rewriteHref = previousRewrite;
  }
}

function renderPageBody(opts: Parameters<typeof renderPage>[0]): { html: string; findings: Finding[] } {
  const findings: Finding[] = [];
  const { block } = opts;
  const lines = opts.markdown.split("\n");

  // Everything above the first `##` is the lead: the h1 and the tag line are the masthead's,
  // so they are dropped here rather than rendered twice.
  const firstSection = lines.findIndex((l) => /^##\s/.test(l));
  const leadLines = lines.slice(0, firstSection < 0 ? lines.length : firstSection)
    .filter((l) => !/^#\s/.test(l) && !/^`(For|Lenses):/.test(l.trim()));
  // The first lead paragraph is the standfirst — the page's promise in one line — and the ones after it
  // are the summary. Rendering the first with the standfirst class is what gives a construct the same
  // masthead rhythm as an overview (the developer's rule, 2026-09-21).
  const lead = renderBody(leadLines, findings).replace(/^(\s*)<p>/, "$1<p class=\"standfirst\">");

  const sections: string[] = [];
  if (firstSection >= 0) {
    const bounds: number[] = [];
    lines.forEach((l, k) => { if (k >= firstSection && /^##\s/.test(l)) bounds.push(k); });
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
        `  <div class="sec-head"><h2>${inline(heading)}</h2></div>\n` +
        renderBody(body, findings) + `\n</section>`);
    }
  }

  const lensChips = (block.lenses ?? []).map((l: string) => {
    if (!LENS_LABEL[l]) findings.push({ message: `\`${l}\` is not a lens` });
    return `<span class="badge lens">${LENS_LABEL[l] ?? l}</span>`;
  }).join("");
  const type = block.variant ? block.variant.charAt(0).toUpperCase() + block.variant.slice(1) : "";
  const statusPart = block.variant === "overview" || !block.status ? "" :
    `<span class="st"><span class="lbl">Status:</span> <span class="badge status ${String(block.status).toLowerCase()}">${STATUS_GLYPH[block.status] ?? ""} ${block.status}</span></span>`;

  // The Subtitle is the seat block's `subtitle` field, one plain sentence under the title; the lead's
  // first paragraph stays the Description (RD.DEVEX.WORKSPACE.187).
  const subtitle = block.subtitle ? `  <p class="subtitle">${esc(String(block.subtitle))}</p>\n` : "";

  const masthead =
`<header class="masthead">
  <!-- Rendered from the spn:doc block by \`docs.ts page\`. Never typed: a header that disagreed with its block is what this removes. -->
  <div class="eyebrow"><span class="line1">${opts.workspace} &nbsp;|&nbsp; ${opts.location} &nbsp;|&nbsp; ${esc(block.title)}</span><span class="line"><span class="lbl">Type:</span> <span class="badge type">${type}</span><span class="sep">|</span><span class="lbl">For:</span> <span class="audience">${lensChips}</span>${statusPart}</span></div>
  <h1>${esc(block.title)}</h1>
${subtitle}${lead}
</header>`;

  const html = [
    `<meta charset="utf-8">`,
    `<title>${esc(block.title)}</title>`,
    `<!-- spn:doc\n${JSON.stringify(block)}\n-->`,
    `<!-- Produced by \`docs.ts page\` from the seat file. Never edit this page: edit the seat file and produce it again. -->`,
    opts.furniture.style,
    `<div class="page">`,
    ``,
    `<nav class="rail" id="rail">`,
    // THE WAY BACK NAMES WHERE IT GOES (Q238). Where the caller resolved the page above this one
    // — a construct's domain overview — that page is named. Where it could not, the constructs
    // seat's own face stands: the seat file sits one level under it, so `../README.md` is the link
    // an author would write, re-expressed for the page's folder by the same rewriter the body uses.
    opts.home
      ? `  <a class="home" href="${opts.home.href}">&larr; ${esc(opts.home.label)}</a>`
      : `  <a class="home" href="${rewriteHref("../README.md")}">&larr; the model</a>`,
    // THE RAIL CARRIES THE PAGE'S OWN NAME, NOT THE WORD `Outline` (Q239). A reader already knows a
    // rail is an outline — it is a list of this page's headings sitting beside them. What the label
    // can add is WHOSE, which is the one thing the rail does not say once the masthead has scrolled
    // away. 157 of 157 pages said `Outline`, and `blocks-template.html` already said `Blocks`.
    `  <div class="rail-title">${esc(String(block.title ?? "Outline"))}</div>`,
    `</nav>`,
    `<div class="wrap">`,
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
    opts.furniture.scripts,
    ``,
  ].join("\n");

  return { html, findings };
}
