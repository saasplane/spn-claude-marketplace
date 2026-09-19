// RESTATES: spn-foundation docs/03-capabilities/05-docs/05-artifacts.md § The figures · § A connector is a claim
//           § One stylesheet, shipped with the template
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
//   check    labels fit their boxes; every connector starts and ends on a box edge or on another
//            connector; nothing hugs the viewBox edge; no connector crosses a label
//   colour   the tokens of a `data-lang` block, wrapped in spans the stylesheet colours in both themes
//
// A connector is a claim that two things touch, which is what makes a figure checkable rather than a
// matter of taste. Ported from this workstream's `notes/figcheck.py`, the reference that passes on all
// seven pages — and checked against it rather than trusted.

/** The measure, at the drawn scale: pixels per character, by text class. */
const PX: Record<string, number> = { t: 7.6, l: 7.0, s: 6.6, n: 6.4 };
const EDGE = 8, JOIN_TOL = 6, BOX_TOL = 4;

type Pt = [number, number];
type Rect = [number, number, number, number];

export type FigureFinding = { figure: number; message: string };

const unescape = (s: string) => s
  .replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&middot;/g, "·").replace(/&mdash;/g, "—").replace(/&rarr;/g, "→")
  .replace(/&nbsp;/g, " ")
  .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));

/**
 * Absolute points per subpath. A closed subpath (Z) is a shape rather than a connector, so it is
 * dropped: checking a shape's endpoints for a join would report every box outline.
 */
function subpaths(d: string): Pt[][] {
  const toks = [...d.matchAll(/([MLHVCZmlhvcz])|(-?[\d.]+)/g)];
  const out: Pt[][] = [];
  let cur: Pt[] = [], cmd = "", x = 0, y = 0, closed = false;
  const flush = () => { if (cur.length && !closed) out.push(cur); cur = []; closed = false; };
  let i = 0;
  while (i < toks.length) {
    const [, c] = toks[i];
    if (c) { cmd = c; i++; if (c === "Z" || c === "z") { closed = true; flush(); } continue; }
    const nums: number[] = [];
    while (i < toks.length && toks[i][2] !== undefined) nums.push(Number(toks[i++][2]));
    let j = 0;
    while (j < nums.length) {
      switch (cmd) {
        case "M": flush(); x = nums[j]; y = nums[j + 1]; cur = [[x, y]]; j += 2; cmd = "L"; break;
        case "m": flush(); x += nums[j]; y += nums[j + 1]; cur = [[x, y]]; j += 2; cmd = "l"; break;
        case "L": x = nums[j]; y = nums[j + 1]; cur.push([x, y]); j += 2; break;
        case "l": x += nums[j]; y += nums[j + 1]; cur.push([x, y]); j += 2; break;
        case "H": x = nums[j]; cur.push([x, y]); j += 1; break;
        case "h": x += nums[j]; cur.push([x, y]); j += 1; break;
        case "V": y = nums[j]; cur.push([x, y]); j += 1; break;
        case "v": y += nums[j]; cur.push([x, y]); j += 1; break;
        case "C": x = nums[j + 4]; y = nums[j + 5]; cur.push([x, y]); j += 6; break;
        case "c": x += nums[j + 4]; y += nums[j + 5]; cur.push([x, y]); j += 6; break;
        default: j += 1;
      }
    }
  }
  flush();
  return out;
}

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function onBox(p: Pt, rects: Rect[]): boolean {
  const [x, y] = p;
  for (const [rx, ry, rw, rh] of rects) {
    if ((Math.abs(x - rx) <= BOX_TOL || Math.abs(x - (rx + rw)) <= BOX_TOL) && ry - BOX_TOL <= y && y <= ry + rh + BOX_TOL) return true;
    if ((Math.abs(y - ry) <= BOX_TOL || Math.abs(y - (ry + rh)) <= BOX_TOL) && rx - BOX_TOL <= x && x <= rx + rw + BOX_TOL) return true;
  }
  return false;
}

export function checkFigures(src: string): FigureFinding[] {
  const findings: FigureFinding[] = [];
  const svgs = [...src.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((m) => m[0]);

  svgs.forEach((svg, n) => {
    const vb = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/);
    if (!vb) { findings.push({ figure: n + 1, message: "no viewBox, so nothing can be measured" }); return; }
    const W = Number(vb[1]), H = Number(vb[2]);
    const rects: Rect[] = [...svg.matchAll(/<rect[^>]*\sx="([\d.]+)"\s+y="([\d.]+)"\s+width="([\d.]+)"\s+height="([\d.]+)"/g)]
      .map((m) => [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]);

    // A lifeline, an axis or a chart curve is background rather than a claim, so it is exempt.
    const conns: { pts: Pt[]; exempt: boolean }[] = [];
    for (const m of svg.matchAll(/<line\b([^>]*)>/g)) {
      const at = m[1];
      const g = (k: string) => Number(at.match(new RegExp(`\\s${k}="(-?[\\d.]+)"`))?.[1] ?? NaN);
      const pts: Pt[] = [[g("x1"), g("y1")], [g("x2"), g("y2")]];
      if (pts.flat().some(Number.isNaN)) continue;
      conns.push({ pts, exempt: /lifeline|axis/.test(at) });
    }
    for (const m of svg.matchAll(/<path\b([^>]*)>/g)) {
      const at = m[1];
      if (!at.includes('class="c')) continue;
      const d = at.match(/\sd="([^"]+)"/);
      if (!d) continue;
      const exempt = /lifeline|axis|curve/.test(at);
      for (const pts of subpaths(d[1])) if (pts.length >= 2) conns.push({ pts, exempt });
    }

    const segs: { k: number; a: Pt; b: Pt }[] = [];
    conns.forEach((c, k) => { for (let i = 1; i < c.pts.length; i++) segs.push({ k, a: c.pts[i - 1], b: c.pts[i] }); });
    const crossable = segs.filter((s) => !conns[s.k].exempt);

    conns.forEach((c, k) => {
      if (c.exempt) return;
      for (const [which, p] of [["start", c.pts[0]], ["end", c.pts[c.pts.length - 1]]] as [string, Pt][]) {
        if (onBox(p, rects)) continue;
        if (segs.some((s) => s.k !== k && distToSegment(p, s.a, s.b) <= JOIN_TOL)) continue;
        findings.push({ figure: n + 1, message: `a connector ${which}s in empty space at ${p[0]},${p[1]} — a connector is a claim that two things touch, so it lands on a box edge or on another connector` });
      }
      for (const [x, y] of c.pts) {
        if (x < EDGE || y < EDGE || x > W - EDGE || y > H - EDGE) {
          findings.push({ figure: n + 1, message: `a connector comes within ${EDGE}px of the viewBox edge at ${x},${y}` });
          break;
        }
      }
    });

    for (const m of svg.matchAll(/<text class="(\w+)"[^>]*x="([\d.]+)" y="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g)) {
      const cls = m[1], x = Number(m[2]), y = Number(m[3]), txt = unescape(m[4]);
      const w = txt.length * (PX[cls] ?? 7);
      const inside = rects.filter((r) => r[0] <= x && x <= r[0] + r[2] && r[1] <= y && y <= r[1] + r[3]);
      const narrowest = inside.length ? inside.reduce((a, b) => (a[2] <= b[2] ? a : b)) : null;
      const limit = narrowest ? narrowest[0] + narrowest[2] : W;
      if (x + w > limit + 4)
        findings.push({ figure: n + 1, message: `the label "${txt.slice(0, 40)}" overruns its box by ${Math.trunc(x + w - limit)}px — a label wider than the shape it names is the fault a reader notices first` });
      for (const s of crossable) {
        const [ax, ay] = s.a, [bx, by] = s.b;
        if (Math.abs(ax - bx) < 1 && x + 2 < ax && ax < x + w - 2 && Math.min(ay, by) < y - 2 && Math.max(ay, by) > y - 10)
          findings.push({ figure: n + 1, message: `a connector crosses the label "${txt.slice(0, 30)}" at x=${Math.round(ax)}` });
      }
    }
  });
  return findings;
}

// ---------------------------------------------------------------------------- colour

/**
 * Token colouring, added when the page is produced. A token the rules do not know stays plain —
 * never wrong — and the audit compares the raw text rather than the spans, so stripping every span
 * must give back exactly what the author wrote.
 */
const LANGS: Record<string, { keywords?: string[]; comment?: RegExp; type?: RegExp }> = {
  ts: { keywords: "const let var function return if else for while class interface type enum export import from as await async new extends implements readonly public private void null undefined true false".split(" "), comment: /\/\/[^\n]*|\/\*[\s\S]*?\*\//g, type: /\b[A-Z][A-Za-z0-9_]+\b/g },
  json: { keywords: ["true", "false", "null"] },
  yaml: { comment: /#[^\n]*/g },
  sql: { keywords: "SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE INDEX PRIMARY KEY FOREIGN REFERENCES NOT NULL UNIQUE ON DEFAULT ALTER ADD CONSTRAINT AND OR JOIN LEFT INNER GROUP BY ORDER LIMIT".split(" "), comment: /--[^\n]*/g },
  sh: { comment: /#[^\n]*/g },
  diff: {},
  md: {},
};

const HTML_ESC = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function colour(code: string, lang: string): string {
  const spec = LANGS[lang];
  if (!spec) return HTML_ESC(code);

  if (lang === "diff")
    return code.split("\n").map((l) =>
      l.startsWith("+") ? `<span class="tk-add">${HTML_ESC(l)}</span>`
      : l.startsWith("-") ? `<span class="tk-del">${HTML_ESC(l)}</span>`
      : HTML_ESC(l)).join("\n");

  // Comments and strings are taken out first, so a keyword inside one is never coloured as code.
  //
  // The placeholder is built at runtime from SUB (0x1A) and carries its index in LETTERS. Two faults
  // the round-trip test found: a digit in the marker was matched by the number rule below, which
  // wrapped it in a span and left the marker unrestorable; and writing the control character into
  // this file as a literal put raw NUL bytes in the source.
  const SEP = String.fromCharCode(26);
  const held: string[] = [];
  const mark = (i: number) => {
    let s = "", n = i + 1;
    while (n > 0) { s = String.fromCharCode(97 + ((n - 1) % 26)) + s; n = Math.floor((n - 1) / 26); }
    return SEP + s + SEP;
  };
  const hold = (cls: string, text: string) => {
    held.push(`<span class="${cls}">${HTML_ESC(text)}</span>`);
    return mark(held.length - 1);
  };

  // EVERY span becomes a placeholder, not just the comments and strings. Inserting markup and then
  // running another pass over it is how a highlighter colours its own output: the TypeScript keyword
  // list carries `class`, so the keyword pass wrapped the `class` inside a `<span class="tk-n">` it
  // had just written. The round-trip test is what caught it.
  const keep = (cls: string, escaped: string) => {
    held.push(`<span class="${cls}">${escaped}</span>`);
    return mark(held.length - 1);
  };

  let out = code;
  if (spec.comment) out = out.replace(spec.comment, (m) => hold("tk-c", m));
  out = out.replace(/'[^'\n]*'|"[^"\n]*"|`[^`\n]*`/g, (m) => hold("tk-s", m));

  out = HTML_ESC(out);
  out = out.replace(/\b\d+(?:\.\d+)?\b/g, (m) => keep("tk-n", m));
  if (spec.keywords?.length) {
    const kw = new RegExp(`\\b(${spec.keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "g");
    out = out.replace(kw, (m) => keep("tk-k", m));
  }
  if (spec.type) out = out.replace(spec.type, (m) => keep("tk-t", m));

  return out.replace(new RegExp(`${SEP}([a-z]+)${SEP}`, "g"), (_, k: string) => {
    let i = 0;
    for (const ch of k) i = i * 26 + (ch.charCodeAt(0) - 96);
    return held[i - 1];
  });
}

/** The audit's half: the raw text of a coloured block must equal what the author wrote. */
export function stripSpans(html: string): string {
  // `&amp;` is unescaped LAST. Doing it first turns an author's literal `&lt;` into `<`.
  return html.replace(/<span class="tk-[a-z]+">/g, "").replace(/<\/span>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
