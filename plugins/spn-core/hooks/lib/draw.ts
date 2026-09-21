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
/** Wrap a note at a fixed width so a box is never wider than a third of the canvas. */
const NOTE_CHARS = 34;
function wrapNote(note: string): string[] {
  const words = note.split(/\s+/); const lines: string[] = []; let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > NOTE_CHARS) { lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}
function mapBoxWidth(b: Box): number {
  const lines = b.note ? wrapNote(b.note) : [];
  const widest = Math.max(b.label.length * W_LABEL, ...lines.map((l) => l.length * W_NOTE));
  return Math.ceil(widest + PAD_X * 2);
}
function mapBoxHeight(b: Box): number {
  const lines = b.note ? wrapNote(b.note).length : 0;
  return lines ? 26 + 19 * lines + 12 : H_ONE;
}
function mapRect(b: Box, x: number, y: number, w: number, h: number): string {
  const out = [`  <rect class="${boxClass(b)}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`];
  if (!b.note) { out.push(`  <text class="l" x="${x + PAD_X}" y="${y + h / 2 + 4}">${esc(b.label)}</text>`); return out.join("\n"); }
  out.push(`  <text class="l" x="${x + PAD_X}" y="${y + 26}">${esc(b.label)}</text>`);
  wrapNote(b.note).forEach((line, i) => out.push(`  <text class="n" x="${x + PAD_X}" y="${y + 45 + 19 * i}">${esc(line)}</text>`));
  return out.join("\n");
}

/**
 * MAP — groups and what flows between them. Boxes are laid in rows by dependency depth: a box
 * nothing points at sits in the first row, and a box sits one row below the deepest box that points
 * at it. So every link runs downward, a link to the next row is one elbow through the gap between
 * the rows, and a link that skips rows goes round the right edge rather than through a box. Labels
 * sit in the gaps, never on a box. Notes wrap at a fixed width, so a box is a third of the canvas
 * at most and a row holds up to three.
 *
 * Before this, boxes were laid in the order written and wrapped by width; a box with a long note
 * filled its own row, every box stacked in one column, and each connector ran straight through the
 * boxes between its ends with its label printed over them (N13's sample, 2026-09-21).
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
    const own = mapBoxWidth(b);
    const inner = (kids.get(b.id) ?? []).map(outerW);
    return inner.length ? Math.max(own, Math.max(...inner) + PAD_IN * 2) : own;
  };
  const outerH = (b: Box): number => {
    const inner = kids.get(b.id) ?? [];
    if (!inner.length) return mapBoxHeight(b);
    return HEAD + inner.reduce((h, c) => h + outerH(c) + 10, 0) + PAD_IN - 10 + PAD_IN;
  };

  // The row of a top-level box is its depth: one more than the deepest box that points at it. A
  // nested box counts through the group that holds it. A cycle is reported and its back edge ignored.
  const holder = (id: string): string => { const b = byId.get(id); return b && b.in !== undefined && byId.has(b.in) ? holder(b.in) : id; };
  const topIds = top.map((b) => b.id);
  const depth = new Map<string, number>(topIds.map((id) => [id, 0]));
  const edges = links.map((l) => [holder(l.from), holder(l.to)] as [string, string]).filter(([f, t]) => f !== t && depth.has(f) && depth.has(t));
  for (let pass = 0; pass < topIds.length + 1; pass++) {
    let moved = false;
    for (const [f, t] of edges) { const want = depth.get(f)! + 1; if (want > depth.get(t)!) { depth.set(t, want); moved = true; } }
    if (!moved) break;
    if (pass === topIds.length) { findings.push("the links form a cycle, so the rows could not be decided; a map flows one way"); break; }
  }

  const CANVAS = 760, margin = 24, gapX = 36, gapY = 52;
  const levels = [...new Set([...depth.values()])].sort((a, b) => a - b);
  const rows: Box[][] = [];
  for (const lv of levels) {
    const members = top.filter((b) => depth.get(b.id) === lv);
    let row: Box[] = []; let used = 0;
    for (const b of members) {
      const w = outerW(b);
      if (row.length && used + gapX + w > CANVAS - margin * 2) { rows.push(row); row = []; used = 0; }
      row.push(b); used += (used ? gapX : 0) + w;
    }
    if (row.length) rows.push(row);
  }

  const out: string[] = [];
  const at = new Map<string, { x: number; y: number; w: number; h: number; row: number }>();
  const place = (b: Box, x: number, y: number, w: number, h: number, row: number) => {
    const inner = kids.get(b.id) ?? [];
    at.set(b.id, { x, y, w, h, row });
    if (!inner.length) { out.push(mapRect(b, x, y, w, h)); return; }
    out.push(`  <rect class="${boxClass(b)}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none"/>`);
    out.push(`  <text class="l" x="${x + PAD_IN}" y="${y + 22}">${esc(b.label)}</text>`);
    let cy = y + HEAD;
    for (const c of inner) { const ch = outerH(c); place(c, x + PAD_IN, cy, w - PAD_IN * 2, ch, row); cy += ch + 10; }
  };

  const rowTop: number[] = [], rowBottom: number[] = [];
  let y = margin;
  rows.forEach((row, i) => {
    const rh = Math.max(...row.map(outerH));
    const rw = row.reduce((s, b) => s + outerW(b), 0) + gapX * (row.length - 1);
    let x = margin + Math.floor((CANVAS - margin * 2 - rw) / 2);   // rows are centred
    rowTop.push(y); rowBottom.push(y + rh);
    for (const b of row) { const w = outerW(b); place(b, x, y, w, outerH(b), i); x += w + gapX; }
    y += rh + gapY;
  });
  const width = CANVAS;
  const height = y - gapY + margin;
  const LANE = width - margin / 2;   // the return lane down the right edge, clear of every box

  // Labels live in the gaps between rows. Two labels in one gap are stacked so neither overprints.
  const taken: { gap: number; x1: number; x2: number; y: number }[] = [];
  const labelAt = (gap: number, cx: number, w: number, baseY: number): { x: number; y: number } => {
    let x = Math.min(Math.max(cx - w / 2, margin), width - margin - w);
    let ly = baseY;
    for (let tries = 0; tries < 4; tries++) {
      const hit = taken.find((t) => t.gap === gap && Math.abs(t.y - ly) < 12 && t.x1 < x + w && x < t.x2);
      if (!hit) break;
      ly += 14;
    }
    taken.push({ gap, x1: x, x2: x + w, y: ly });
    return { x, y: ly };
  };

  for (const l of links) {
    const a = at.get(l.from), b = at.get(l.to);
    if (!a || !b) continue;
    const dash = l.dashed ? ' stroke-dasharray="5 4"' : "";
    let d: string; let label: { x: number; y: number } | null = null;
    const w = (l.label ?? "").length * W_NOTE;
    if (a.row === b.row) {
      // Side by side: out of one vertical edge, into the other, the label above both.
      const rightward = a.x < b.x;
      const x1 = rightward ? a.x + a.w : a.x, x2 = rightward ? b.x : b.x + b.w;
      const y1 = a.y + a.h / 2, y2 = b.y + b.h / 2, mid = (x1 + x2) / 2;
      d = `M${x1} ${y1} H${mid} V${y2} H${x2}`;
      if (l.label) label = labelAt(-1 - a.row, mid, w, Math.min(a.y, b.y) - 8);
    } else if (b.row === a.row + 1) {
      // The next row down: out of the bottom, one elbow in the gap, into the top.
      const x1 = a.x + a.w / 2, x2 = b.x + b.w / 2;
      const y1 = a.y + a.h, y2 = b.y, mid = Math.round((y1 + y2) / 2);
      d = Math.abs(x1 - x2) < 1 ? `M${x1} ${y1} V${y2}` : `M${x1} ${y1} V${mid} H${x2} V${y2}`;
      if (l.label) {
        // Beside the vertical run when the link is straight; on the horizontal run otherwise. Either
        // way the text is in the gap and its span never contains a vertical segment.
        const straight = Math.abs(x1 - x2) < 1;
        const cx = straight ? x1 + 8 + w / 2 : (Math.min(x1, x2) + Math.max(x1, x2)) / 2;
        label = labelAt(a.row, cx, w, straight ? mid + 4 : mid - 6);
        if (!straight && label.x + 2 < Math.max(x1, x2) && Math.max(x1, x2) < label.x + w - 2) label.y = mid - 6; // the horizontal run is below the text
      }
    } else if (b.row > a.row) {
      // Skips a row: down into the gap, along it to the lane at the right edge, down the lane to the
      // gap above the target, back along that gap, and in from the top. No box is crossed.
      const x1 = a.x + a.w / 2, x2 = b.x + b.w / 2;
      const g1 = Math.round((rowBottom[a.row] + rowTop[a.row + 1]) / 2);
      const g2 = Math.round((rowBottom[b.row - 1] + rowTop[b.row]) / 2);
      d = `M${x1} ${a.y + a.h} V${g1} H${LANE} V${g2} H${x2} V${b.y}`;
      if (l.label) label = labelAt(a.row, (x1 + LANE) / 2, w, g1 - 6);
    } else {
      // Upward: out of the top, along the gap above to the lane, up to the gap below the target, in
      // from the bottom. Drawn, and reported, because a map is meant to flow one way.
      findings.push(`the link \`${l.from}\` → \`${l.to}\` runs upward; a map flows one way, so a link points at a box below its source`);
      const x1 = a.x + a.w / 2, x2 = b.x + b.w / 2;
      const g1 = Math.round((rowBottom[a.row - 1] + rowTop[a.row]) / 2);
      const g2 = Math.round((rowBottom[b.row] + rowTop[b.row + 1]) / 2);
      d = `M${x1} ${a.y} V${g1} H${LANE} V${g2} H${x2} V${b.y + b.h}`;
      if (l.label) label = labelAt(a.row - 1, (x1 + LANE) / 2, w, g1 - 6);
    }
    out.push(`  <path class="c" d="${d}"${dash} marker-end="url(#ar)"/>`);
    if (label && l.label) out.push(`  <text class="n" x="${label.x}" y="${label.y}">${esc(l.label)}</text>`);
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
