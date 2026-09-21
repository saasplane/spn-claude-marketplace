// RESTATES: spn-foundation docs/04-capabilities/01-foundation/02-docs/05-artifacts.md § The figures · § A connector is a claim
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// The `.dg` drawer. A figure's single source is its spec — a fenced ```dg block in the seat file —
// and this turns one into inline SVG. Nothing is drawn by eye: every box is measured from its own
// text, so a connector lands on an edge and a label fits by construction rather than by luck.
//
// The grid: canvas 1100 wide, margin 24, three type sizes and no fourth. The chapter says 760; the page
// renders a figure at the width of its column, about 1100, so a 760 canvas was scaled up by half and
// every box and label read big and dark beside the hand-drawn figures of the hub (N13, 2026-09-21).
// The chapter changes to 1100 in N13 step 1; this is the one measure from here on.

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
  // A chain wider than the canvas is drawn by the map drawer as a one-way chain, which stands it
  // up as a vertical line. The neighbours are the links, since a chain declares none.
  if (width > 1100) {
    const links = boxes.slice(0, -1).map((b, i) => ({ from: b.id, to: boxes[i + 1].id }));
    return drawMap({ ...spec, kind: "map", links });
  }
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

  const CANVAS = 1100, margin = 24, gapX = 36;

  // A ONE-WAY CHAIN IS A STRAIGHT LINE. When every box has at most one link in and one out and the
  // links form a single path through all of them, the figure is a flow, and a flow reads best as a
  // line: horizontal when it fits the canvas, vertical when it does not. Labels sit above a
  // horizontal link, beside a vertical one — never on a box. The developer's rule, 2026-09-21.
  if (!kids.size) {
    const inOf = new Map<string, number>(), outOf = new Map<string, number>();
    for (const [f, t] of edges) { outOf.set(f, (outOf.get(f) ?? 0) + 1); inOf.set(t, (inOf.get(t) ?? 0) + 1); }
    const heads = topIds.filter((id) => !(inOf.get(id) ?? 0));
    const simple = topIds.every((id) => (inOf.get(id) ?? 0) <= 1 && (outOf.get(id) ?? 0) <= 1);
    if (simple && heads.length === 1 && edges.length === topIds.length - 1 && topIds.length > 1) {
      const next = new Map(edges);
      const order: string[] = []; let cur: string | undefined = heads[0];
      while (cur && order.length <= topIds.length) { order.push(cur); cur = next.get(cur); }
      if (order.length === topIds.length) {
        const boxes = order.map((id) => byId.get(id)!);
        const linkOf = (a: string, b: string) => links.find((l) => holder(l.from) === a && holder(l.to) === b);
        const labelW = (i: number) => ((linkOf(order[i], order[i + 1])?.label ?? "").length * W_NOTE);
        const ws = boxes.map(mapBoxWidth), hs = boxes.map(mapBoxHeight);
        const gaps = boxes.slice(0, -1).map((_, i) => Math.max(gapX, labelW(i) + 16));
        const total = ws.reduce((s, w) => s + w, 0) + gaps.reduce((s, g) => s + g, 0);
        const out: string[] = [];
        let width = CANVAS, height = 0;
        if (total <= CANVAS - margin * 2) {
          const h = Math.max(...hs);
          let x = margin + Math.floor((CANVAS - margin * 2 - total) / 2);
          const y = margin;
          boxes.forEach((b, i) => {
            out.push(mapRect(b, x, y, ws[i], hs[i]));
            if (i < boxes.length - 1) {
              const l = linkOf(order[i], order[i + 1]);
              const x1 = x + ws[i], x2 = x1 + gaps[i], cy = y + h / 2;
              out.push(`  <path class="c" d="M${x1} ${cy} H${x2}"${l?.dashed ? ' stroke-dasharray="5 4"' : ""} marker-end="url(#ar)"/>`);
              if (l?.label) out.push(`  <text class="n" x="${Math.round(x1 + (gaps[i] - labelW(i)) / 2)}" y="${cy - 8}">${esc(l.label)}</text>`);
              x = x2;
            }
          });
          height = margin + h + margin;
        } else {
          const w = Math.max(...ws);
          const x = margin + Math.floor((CANVAS - margin * 2 - w) / 2);
          let y = margin;
          const GAP_V = 40;
          boxes.forEach((b, i) => {
            out.push(mapRect(b, x, y, w, hs[i]));
            if (i < boxes.length - 1) {
              const l = linkOf(order[i], order[i + 1]);
              const cx = x + w / 2, y1 = y + hs[i], y2 = y1 + GAP_V;
              out.push(`  <path class="c" d="M${cx} ${y1} V${y2}"${l?.dashed ? ' stroke-dasharray="5 4"' : ""} marker-end="url(#ar)"/>`);
              if (l?.label) out.push(`  <text class="n" x="${cx + 10}" y="${y1 + GAP_V / 2 + 4}">${esc(l.label)}</text>`);
              y = y2;
            }
          });
          height = y + hs[hs.length - 1] + margin;
        }
        const svg = [
          `<svg class="dg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(spec.title ?? spec.caption ?? "map")}">`,
          `  <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>`,
          ...out, `</svg>`].join("\n");
        return { svg, findings };
      }
    }
  }

  const levels = [...new Set([...depth.values()])].sort((a, b) => a - b);
  // Within a row, boxes are ordered by where the boxes they link to sit — a sweep down by sources,
  // then up by targets — so two links in one gap do not cross. Order is what makes a picture read.
  const pos = new Map<string, number>();
  const byLevel = levels.map((lv) => top.filter((b) => depth.get(b.id) === lv));
  byLevel.forEach((row) => row.forEach((b, i) => pos.set(b.id, i)));
  const mean = (ids: string[], fallback: number) => ids.length ? ids.reduce((s, id) => s + (pos.get(id) ?? 0), 0) / ids.length : fallback;
  const sweep = (down: boolean) => {
    const order = down ? byLevel : [...byLevel].reverse();
    for (const row of order) {
      const key = (b: Box) => mean(edges.filter(([f, t]) => (down ? t : f) === b.id).map(([f, t]) => (down ? f : t)), pos.get(b.id) ?? 0);
      row.sort((a, b) => key(a) - key(b) || (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0));
      row.forEach((b, i) => pos.set(b.id, i));
    }
  };
  sweep(true); sweep(false); sweep(true);
  const rows: Box[][] = [];
  for (const lv of levels) {
    const members = byLevel[levels.indexOf(lv)];
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

  // Each link between neighbouring rows gets its own lane through the gap, so two horizontal runs
  // never sit on top of each other and each label has a line of its own. The gap is as tall as the
  // lanes it carries.
  const rowOf = new Map<string, number>();
  rows.forEach((row, i) => { for (const b of row) rowOf.set(b.id, i); });
  const rowOfAny = (id: string) => rowOf.get(holder(id)) ?? -1;
  const laneOf = new Map<Link, number>(), lanesIn: number[] = rows.map(() => 0);
  for (const l of links) {
    const ra = rowOfAny(l.from), rb = rowOfAny(l.to);
    if (ra >= 0 && rb === ra + 1 && !(ra === rb)) { laneOf.set(l, lanesIn[ra]); lanesIn[ra] += 1; }
  }
  const LANE_H = 22;
  const gapAfter = (i: number) => Math.max(52, 20 + LANE_H * lanesIn[i]);

  const rowTop: number[] = [], rowBottom: number[] = [];
  let y = margin;
  rows.forEach((row, i) => {
    const rh = Math.max(...row.map(outerH));
    const rw = row.reduce((s, b) => s + outerW(b), 0) + gapX * (row.length - 1);
    let x = margin + Math.floor((CANVAS - margin * 2 - rw) / 2);   // rows are centred
    rowTop.push(y); rowBottom.push(y + rh);
    for (const b of row) { const w = outerW(b); place(b, x, y, w, outerH(b), i); x += w + gapX; }
    y += rh + (i < rows.length - 1 ? gapAfter(i) : 0);
  });
  const width = CANVAS;
  const height = y + margin;

  // Where a box has several links leaving its bottom or arriving at its top, the points are spread
  // along the edge rather than piled on its centre, so two arrows never share one head.
  const outs = new Map<string, Link[]>(), ins = new Map<string, Link[]>();
  for (const l of links) {
    if (!at.has(l.from) || !at.has(l.to)) continue;
    outs.set(l.from, [...(outs.get(l.from) ?? []), l]); ins.set(l.to, [...(ins.get(l.to) ?? []), l]);
  }
  const spread = (box: { x: number; w: number }, list: Link[], l: Link) => {
    const i = list.indexOf(l), n = list.length;
    return Math.round(box.x + (box.w * (i + 1)) / (n + 1));
  };
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
      // The next row down: out of the bottom, along this link's own lane in the gap, into the top.
      const x1 = spread(a, outs.get(l.from) ?? [l], l), x2 = spread(b, ins.get(l.to) ?? [l], l);
      const y1 = a.y + a.h, y2 = b.y;
      const lane = laneOf.get(l) ?? 0;
      const mid = rowBottom[a.row] + 10 + LANE_H * lane + 12;
      const straight = Math.abs(x1 - x2) < 1;
      d = straight ? `M${x1} ${y1} V${y2}` : `M${x1} ${y1} V${mid} H${x2} V${y2}`;
      if (l.label) {
        // Above this link's own horizontal run, or beside the vertical run when the link is straight.
        // Either way the text is in the gap and its span never contains a vertical segment.
        const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
        const cx = straight ? x1 + 8 + w / 2 : (lo + hi) / 2;
        label = { x: Math.min(Math.max(cx - w / 2, margin), width - margin - w), y: straight ? mid + 4 : mid - 5 };
        if (!straight && w > hi - lo - 8) { // a label longer than its run sits clear of both verticals
          label.x = Math.min(Math.max(hi + 6, margin), width - margin - w);
          if (label.x + w > width - margin) label.x = Math.max(lo - w - 6, margin);
        }
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
  // A flow declares links, and links decide rows: the map drawer lays it out, and a one-way path
  // through every box is drawn as a straight line, horizontal when it fits, vertical when not.
  flow: drawMap,
  map: drawMap,
};

export const KINDS = Object.keys(DRAWERS);

export function draw(spec: Spec): { svg: string; findings: string[] } {
  const drawer = DRAWERS[(spec.kind ?? "").toLowerCase()];
  if (!drawer)
    return { svg: "", findings: [`no helper draws a \`${spec.kind}\` figure. The helpers are ${KINDS.join(" · ")}; author this one as SVG in an HTML block in the seat file and it is used verbatim (05-artifacts.md, The figures)`] };
  return drawer(spec);
}
