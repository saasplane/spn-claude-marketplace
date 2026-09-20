// RESTATES: spn-foundation docs/04-capabilities/01-foundation/02-docs/05-artifacts.md § The figures · § A connector is a claim
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// The `.dg` drawer. A figure's single source is its spec — a fenced ```dg block in the seat file —
// and this turns one into inline SVG. Nothing is drawn by eye: every box is measured from its own
// text, so a connector lands on an edge and a label fits by construction rather than by luck.
//
// The grid, from the chapter: canvas 760 wide, margin 24, three type sizes and no fourth.

export type Box = { id: string; label: string; note?: string; em?: boolean; off?: boolean; warn?: boolean; in?: string };
export type Link = { from: string; to: string; label?: string; dashed?: boolean };
export type Spec = { kind: string; boxes?: Box[]; links?: Link[]; caption?: string; title?: string };

/** The measure the figure check uses, at the drawn scale. */
const W_LABEL = 7, W_NOTE = 6.4, W_TITLE = 7.6;
const PAD_X = 14, GAP_Y = 20, GAP_COL = 56;
const H_ONE = 44, H_TWO = 64;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function boxWidth(b: Box): number {
  const label = b.label.length * W_LABEL;
  const note = (b.note ?? "").length * W_NOTE;
  return Math.ceil(Math.max(label, note) + PAD_X * 2);
}
const boxHeight = (b: Box) => (b.note ? H_TWO : H_ONE);

function boxClass(b: Box): string {
  if (b.em) return "box em";
  if (b.warn) return "box warn";
  if (b.off) return "box off";
  return "box";
}

function rect(b: Box, x: number, y: number, w: number, h: number): string {
  const cy = b.note ? y + 26 : y + h / 2 + 4;
  const out = [`  <rect class="${boxClass(b)}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`,
               `  <text class="l" x="${x + PAD_X}" y="${cy}">${esc(b.label)}</text>`];
  if (b.note) out.push(`  <text class="n" x="${x + PAD_X}" y="${cy + 19}">${esc(b.note)}</text>`);
  return out.join("\n");
}

/**
 * ENTITIES — the construct is data. Three columns, and the direction of a link decides the column:
 * what points at the centre sits left, the centre sits in the middle, what it points at sits right.
 * Every connector then runs one way along the horizontal axis and lands on two vertical edges, so
 * none of them crosses a label and no return lane is needed.
 */
function drawEntities(spec: Spec): { svg: string; findings: string[] } {
  const findings: string[] = [];
  const boxes = spec.boxes ?? [];
  const links = spec.links ?? [];
  if (!boxes.length) return { svg: "", findings: ["a `dg` figure with no boxes"] };

  const centre = boxes.find((b) => b.em) ?? boxes[0];
  if (!boxes.some((b) => b.em)) findings.push(`no box is marked \`em\`, so \`${centre.id}\` was taken as the centre`);

  const targets = links.filter((l) => l.from === centre.id).map((l) => l.to);
  const sources = links.filter((l) => l.to === centre.id).map((l) => l.from);
  const byId = new Map(boxes.map((b) => [b.id, b]));
  for (const l of links) for (const end of [l.from, l.to])
    if (!byId.has(end)) findings.push(`a link names \`${end}\`, and no box has that id`);

  const left = [...new Set(sources)].map((id) => byId.get(id)!).filter(Boolean);
  const right = [...new Set(targets)].map((id) => byId.get(id)!).filter(Boolean);
  const placed = new Set([centre.id, ...left.map((b) => b.id), ...right.map((b) => b.id)]);
  for (const b of boxes) if (!placed.has(b.id)) { right.push(b); findings.push(`\`${b.id}\` is in no link, so it was placed beside the centre`); }

  const colWidth = (col: Box[]) => (col.length ? Math.max(...col.map(boxWidth)) : 0);
  const wL = colWidth(left), wC = boxWidth(centre), wR = colWidth(right);
  const colHeight = (col: Box[]) => col.reduce((h, b) => h + boxHeight(b) + GAP_Y, -GAP_Y);
  const hL = colHeight(left), hC = boxHeight(centre), hR = colHeight(right);

  const margin = 24;
  const height = Math.max(hL, hC, hR) + margin * 2;
  const width = margin * 2 + wL + wC + wR + GAP_COL * 2;
  const xL = margin, xC = margin + wL + GAP_COL, xR = xC + wC + GAP_COL;

  const out: string[] = [];
  const at = new Map<string, { x: number; y: number; w: number; h: number }>();
  const layColumn = (col: Box[], x: number, w: number, total: number) => {
    let y = margin + (height - margin * 2 - total) / 2;
    for (const b of col) {
      const h = boxHeight(b);
      out.push(rect(b, x, y, w, h));
      at.set(b.id, { x, y, w, h });
      y += h + GAP_Y;
    }
  };
  layColumn(left, xL, wL, hL);
  layColumn([centre], xC, wC, hC);
  layColumn(right, xR, wR, hR);

  for (const l of links) {
    const a = at.get(l.from), b = at.get(l.to);
    if (!a || !b) continue;
    const fromRight = a.x < b.x;
    const x1 = fromRight ? a.x + a.w : a.x;
    const x2 = fromRight ? b.x : b.x + b.w;
    const y1 = a.y + a.h / 2, y2 = b.y + b.h / 2;
    const mid = (x1 + x2) / 2;
    const dash = l.dashed ? ' stroke-dasharray="5 4"' : "";
    out.push(`  <path class="c" d="M${x1} ${y1} H${mid} V${y2} H${x2}"${dash} marker-end="url(#ar)"/>`);
    if (l.label) {
      // THE LABEL SITS ABOVE BOTH BOXES, not at their mid-height. `y1` and `y2` are box CENTRES, so
      // a label placed against them lands inside a box — and the figure check then measures it
      // against that box's width and reports it overrunning something it was never inside.
      const w = l.label.length * W_NOTE;
      const x = Math.min(Math.max(mid - w / 2, margin), width - margin - w);
      out.push(`  <text class="n" x="${x}" y="${Math.min(a.y, b.y) - 6}">${esc(l.label)}</text>`);
    }
  }

  const svg = [
    `<svg class="dg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(spec.title ?? spec.caption ?? "entity diagram")}">`,
    `  <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>`,
    ...out,
    `</svg>`,
  ].join("\n");
  return { svg, findings };
}

/** CHAIN — a FLOW read left to right: a box per step, an arrow means *then*. */
function drawChain(spec: Spec): { svg: string; findings: string[] } {
  const boxes = spec.boxes ?? [];
  if (!boxes.length) return { svg: "", findings: ["a `dg` figure with no boxes"] };
  const margin = 24, gap = 22;
  const h = Math.max(...boxes.map(boxHeight));
  const widths = boxes.map(boxWidth);
  const width = margin * 2 + widths.reduce((a, b) => a + b, 0) + gap * (boxes.length - 1);
  const height = margin * 2 + h;
  const out: string[] = [];
  let x = margin;
  boxes.forEach((b, i) => {
    out.push(rect(b, x, margin, widths[i], h));
    if (i < boxes.length - 1) out.push(`  <path class="c" d="M${x + widths[i]} ${margin + h / 2} H${x + widths[i] + gap}" marker-end="url(#ar)"/>`);
    x += widths[i] + gap;
  });
  return {
    svg: [`<svg class="dg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(spec.title ?? spec.caption ?? "flow")}">`,
      `  <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>`,
      ...out, `</svg>`].join("\n"),
    findings: [],
  };
}

/**
 * MAP — the parts of one thing, and how they touch. The chapter's shape, exactly: **a box is a
 * group, an arrow is what flows, a nested box is containment.**
 *
 * Groups lay out in rows that wrap at the canvas width, so a map of three parts is one row and a
 * map of nine is three — the reader never scrolls sideways and no box is scaled down to fit. A box
 * naming another in `in` is drawn INSIDE it, and its parent grows to hold it rather than the child
 * being shrunk: containment is the claim, so the parent's size is derived from what it contains.
 *
 * Every connector leaves one edge and lands on another, which is the chapter's own test for a
 * figure being checkable rather than a matter of taste. Boxes sharing a row connect straight across;
 * boxes on different rows leave the bottom edge and enter the top, so no connector crosses a label.
 */
function drawMap(spec: Spec): { svg: string; findings: string[] } {
  const findings: string[] = [];
  const all = spec.boxes ?? [];
  const links = spec.links ?? [];
  if (!all.length) return { svg: "", findings: ["a `dg` figure with no boxes"] };

  const byId = new Map(all.map((b) => [b.id, b]));
  for (const l of links) for (const end of [l.from, l.to])
    if (!byId.has(end)) findings.push(`a link names \`${end}\`, and no box has that id`);

  const kids = new Map<string, Box[]>();
  const top: Box[] = [];
  for (const b of all) {
    if (b.in === undefined) { top.push(b); continue; }
    if (!byId.has(b.in)) { findings.push(`\`${b.id}\` is nested in \`${b.in}\`, and no box has that id`); top.push(b); continue; }
    if (b.in === b.id) { findings.push(`\`${b.id}\` is nested in itself`); top.push(b); continue; }
    kids.set(b.in, [...(kids.get(b.in) ?? []), b]);
  }
  if (!top.length) { findings.push("every box is nested, so none could be placed"); return { svg: "", findings }; }

  const HEAD = 34, PAD_IN = 12;
  const outerW = (b: Box): number => {
    const own = boxWidth(b);
    const inner = (kids.get(b.id) ?? []).map(outerW);
    return inner.length ? Math.max(own, Math.max(...inner) + PAD_IN * 2) : own;
  };
  const outerH = (b: Box): number => {
    const inner = kids.get(b.id) ?? [];
    if (!inner.length) return boxHeight(b);
    return HEAD + inner.reduce((h, c) => h + outerH(c) + 10, 0) + PAD_IN - 10 + PAD_IN;
  };

  // Rows that wrap at the canvas width, so the figure grows downward rather than sideways.
  const CANVAS = 760, margin = 24, gapX = 28, gapY = 26;
  const rows: Box[][] = [[]];
  let used = 0;
  for (const b of top) {
    const w = outerW(b);
    if (used && used + gapX + w > CANVAS - margin * 2) { rows.push([]); used = 0; }
    rows[rows.length - 1].push(b);
    used += (used ? gapX : 0) + w;
  }

  const out: string[] = [];
  const at = new Map<string, { x: number; y: number; w: number; h: number }>();
  const place = (b: Box, x: number, y: number, w: number, h: number) => {
    const inner = kids.get(b.id) ?? [];
    at.set(b.id, { x, y, w, h });
    if (!inner.length) { out.push(rect(b, x, y, w, h)); return; }
    // A group that contains things is drawn as a frame with its label in the band at the top.
    out.push(`  <rect class="${boxClass(b)}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none"/>`);
    out.push(`  <text class="l" x="${x + PAD_IN}" y="${y + 22}">${esc(b.label)}</text>`);
    let cy = y + HEAD;
    for (const c of inner) { const ch = outerH(c); place(c, x + PAD_IN, cy, w - PAD_IN * 2, ch); cy += ch + 10; }
  };

  let y = margin;
  const rowHeights = rows.map((r) => Math.max(...r.map(outerH)));
  rows.forEach((row, i) => {
    let x = margin;
    for (const b of row) { const w = outerW(b); place(b, x, y, w, outerH(b)); x += w + gapX; }
    y += rowHeights[i] + gapY;
  });
  const width = CANVAS;
  const height = y - gapY + margin;

  for (const l of links) {
    const a = at.get(l.from), b = at.get(l.to);
    if (!a || !b) continue;
    const sameRow = a.y < b.y + b.h && b.y < a.y + a.h;
    let d: string, lx: number, ly: number;
    if (sameRow) {
      const rightward = a.x < b.x;
      const x1 = rightward ? a.x + a.w : a.x, x2 = rightward ? b.x : b.x + b.w;
      const y1 = a.y + a.h / 2, y2 = b.y + b.h / 2;
      const mid = (x1 + x2) / 2;
      d = `M${x1} ${y1} H${mid} V${y2} H${x2}`;
      // Above both boxes, never at their mid-height — `y1` and `y2` are centres, so a label placed
      // against them sits inside a box rather than in the gap the connector runs through.
      lx = mid; ly = Math.min(a.y, b.y) - 6;
    } else {
      const downward = a.y < b.y;
      const y1 = downward ? a.y + a.h : a.y, y2 = downward ? b.y : b.y + b.h;
      const x1 = a.x + a.w / 2, x2 = b.x + b.w / 2;
      const mid = (y1 + y2) / 2;
      d = `M${x1} ${y1} V${mid} H${x2} V${y2}`;
      lx = (x1 + x2) / 2; ly = mid - 6;
    }
    const dash = l.dashed ? ' stroke-dasharray="5 4"' : "";
    out.push(`  <path class="c" d="${d}"${dash} marker-end="url(#ar)"/>`);
    if (l.label) {
      const w = l.label.length * W_NOTE;
      const x = Math.min(Math.max(lx - w / 2, margin), width - margin - w);
      out.push(`  <text class="n" x="${x}" y="${ly}">${esc(l.label)}</text>`);
    }
  }

  const svg = [
    `<svg class="dg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(spec.title ?? spec.caption ?? "map")}">`,
    `  <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>`,
    ...out,
    `</svg>`,
  ].join("\n");
  return { svg, findings };
}

const DRAWERS: Record<string, (s: Spec) => { svg: string; findings: string[] }> = {
  entities: drawEntities,
  chain: drawChain,
  flow: drawChain,
  map: drawMap,
};

export const KINDS = Object.keys(DRAWERS);

export function draw(spec: Spec): { svg: string; findings: string[] } {
  const drawer = DRAWERS[(spec.kind ?? "").toLowerCase()];
  if (!drawer)
    return { svg: "", findings: [`no helper draws a \`${spec.kind}\` figure. The helpers are ${KINDS.join(" · ")}; author this one as SVG in an HTML block in the seat file and it is used verbatim (05-artifacts.md, The figures)`] };
  return drawer(spec);
}
