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
// One pair of numbers, both axes: 24 where nothing connects two boxes, 56 where a connector does.
// Padding is one number, 16, for a leaf and a container alike (05-artifacts.md § The grid).
const PAD_X = 16, GAP_Y = 24, GAP_COL = 56, GAP_LINKED = 56;
// A box edge carries three connection points at most; a fourth link leaves by another side.
// A side offers three points at most — its middle and the middle of each half.
const SIDE_POINTS = 3, GAP_APART = 24;
// A connector's label and the connector itself. Every figure puts this much clear space between a
// label's line and any arrow — its own or a neighbour's — so no drawer invents its own offset and
// no reader has to work out which run a word belongs to.
const LABEL_H = 12, LABEL_GAP = 8;
const H_ONE = 44, H_TWO = 64;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Vert = { x: number; y1: number; y2: number };
type Pending = { x: number; y: number; w: number; txt: string };

/** Every vertical run in a path, so a label can be kept off all of them and not merely off its own. */
function vertsOf(d: string): Vert[] {
  const out: Vert[] = [];
  let x = 0, y = 0;
  for (const [, c, u, v] of d.matchAll(/([MHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g)) {
    const a = Number(u);
    const nx = c === "V" ? x : a, ny = c === "V" ? a : c === "M" ? Number(v) : y;
    if (c === "V") out.push({ x, y1: y, y2: ny });
    x = nx; y = ny;
  }
  return out;
}

/**
 * WHERE A LABEL FINALLY SITS is decided once every line is drawn, because the connector that crosses
 * a label is rarely the one it names — it belongs to a third link passing through the same gap, which
 * no drawer can see while it is placing its own text. Each label slides along its own line to the
 * nearest stretch no vertical run crosses, keeping the clear air the contract owes. A label with
 * nowhere clear to go stays where it was put, and the figure check reports it rather than this
 * quietly stacking it somewhere worse.
 */
function placeLabels(pending: Pending[], verticals: Vert[], margin: number, width: number): string[] {
  return pending.map((p) => {
    const top = p.y - LABEL_H, bottom = p.y + 2;
    const blocked = verticals
      .filter((v) => Math.min(v.y1, v.y2) < bottom && Math.max(v.y1, v.y2) > top)
      .map((v) => [v.x - LABEL_GAP, v.x + LABEL_GAP] as [number, number]);
    const free = (x: number) => x >= margin && x + p.w <= width - margin
      && !blocked.some(([lo, hi]) => lo < x + p.w && x < hi);
    let x = p.x;
    if (!free(x)) {
      const tries = [...blocked.flatMap(([lo, hi]) => [hi, lo - p.w]), margin, width - margin - p.w]
        .filter(free)
        .sort((m, n) => Math.abs(m - p.x) - Math.abs(n - p.x));
      if (tries.length) x = tries[0];
    }
    return `  <text class="n" x="${Math.round(x)}" y="${p.y}">${esc(p.txt)}</text>`;
  });
}

/**
 * THE POINTS A SIDE OFFERS, and HOW MANY CONNECTORS ASK FOR THEM decides which: one connector takes
 * the middle, two take the middle of each half, three take all three. That order matters — a side is
 * not a fixed set of slots a lone arrow has to pick from, or a single connector lands off-centre and
 * dog-legs to reach a box it was pointing straight at (developer, 2026-09-21).
 *
 * A short side offers fewer, because two points closer than the contract's gap read as one. Among the
 * points on offer a connector takes whichever lines up best with the box at its other end, and two
 * connectors may well take the same one: forcing every arrow onto a point of its own bends lines that
 * had no reason to bend, and alignment is what a reader follows.
 */
function sidePoints(start: number, len: number, asking: number): number[] {
  const at = (f: number) => Math.round(start + len * f);
  const halves = [at(0.25), at(0.75)], all = [at(0.25), at(0.5), at(0.75)];
  const want = Math.min(Math.max(asking, 1), SIDE_POINTS);
  if (want === 1) return [at(0.5)];
  if (want === 2) return len / 2 >= GAP_APART ? halves : [at(0.5)];
  if (len / (SIDE_POINTS + 1) >= GAP_APART) return all;
  return len / 2 >= GAP_APART ? halves : [at(0.5)];
}
const alignedTo = (points: number[], towards: number): number =>
  points.reduce((best, p) => (Math.abs(p - towards) < Math.abs(best - towards) ? p : best), points[0]);

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
  // A link's label rides in the column gap, so the gap is as wide as the widest label plus the clear
  // air it owes on both sides. Sized from GAP_COL alone, a label longer than 56px was hung above a
  // box instead and landed inside the next column (N13, 2026-09-21).
  const widestLabel = Math.max(0, ...links.map((l) => (l.label ?? "").length * W_NOTE));
  const gapCol = Math.max(GAP_COL, Math.ceil(widestLabel) + LABEL_GAP * 2);
  const height = Math.max(hL, hC, hR) + margin * 2;
  const width = margin * 2 + wL + wC + wR + gapCol * 2;
  const xL = margin, xC = margin + wL + gapCol, xR = xC + wC + gapCol;

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

  // Two links crossing the same column gap would otherwise share one vertical x and one landing
  // point, so each would run straight through the other's label. Each gets a share of the gap and a
  // share of the edge it lands on, which is what keeps the labels readable (N13, 2026-09-21).
  const eVerts: Vert[] = [], ePending: Pending[] = [];
  // Per box AND per side, because a box can be pointed at from the left and point on to the right,
  // and each of those sides answers the how-many question on its own.
  const leaves = new Map<string, number>(), lands = new Map<string, number>();
  for (const l of links) {
    const a = at.get(l.from), b = at.get(l.to);
    if (!a || !b) continue;
    const side = a.x < b.x ? "R" : "L";
    const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
    bump(leaves, `${l.from}:${side}`);
    bump(lands, `${l.to}:${side === "R" ? "L" : "R"}`);
  }
  const lane = new Map<Link, { i: number; n: number }>();
  for (const l of links) {
    const peers = links.filter((p) => (at.get(p.from)?.x ?? -1) === (at.get(l.from)?.x ?? -2)
                                   && (at.get(p.to)?.x ?? -1) === (at.get(l.to)?.x ?? -2));
    lane.set(l, { i: peers.indexOf(l), n: peers.length });
  }

  for (const l of links) {
    const a = at.get(l.from), b = at.get(l.to);
    if (!a || !b) continue;
    const fromRight = a.x < b.x;
    const x1 = fromRight ? a.x + a.w : a.x;
    const x2 = fromRight ? b.x : b.x + b.w;
    const { i, n } = lane.get(l) ?? { i: 0, n: 1 };
    const y1 = alignedTo(sidePoints(a.y, a.h, leaves.get(`${l.from}:${fromRight ? "R" : "L"}`) ?? 0), b.y + b.h / 2);
    const y2 = alignedTo(sidePoints(b.y, b.h, lands.get(`${l.to}:${fromRight ? "L" : "R"}`) ?? 0), y1);
    const mid = x1 + ((x2 - x1) * (i + 1)) / (n + 1);
    const dash = l.dashed ? ' stroke-dasharray="5 4"' : "";
    const dPath = `M${x1} ${y1} H${mid} V${y2} H${x2}`;
    out.push(`  <path class="c" d="${dPath}"${dash} marker-end="url(#ar)"/>`);
    eVerts.push(...vertsOf(dPath));
    if (l.label) {
      // THE LABEL SITS IN THE COLUMN GAP, on the connector's own vertical run — the one place in an
      // ER layout where no box can be. Hung above a box instead, it lands inside whichever column is
      // taller. Where the run is straight across it goes a standard gap above the line.
      const w = l.label.length * W_NOTE;
      // Centred on the GAP, not on the connector's own vertical: the gap is sized to hold the widest
      // label with its clear air, and a vertical spread across that gap sits off-centre, so a label
      // centred on it would hang over a box. Above the higher of the two horizontal runs, where the
      // vertical has not started, is the one spot crossed by neither the line nor a box.
      ePending.push({ x: Math.round((x1 + x2 - w) / 2), y: Math.min(y1, y2) - LABEL_GAP, w, txt: l.label });
    }
  }

  out.push(...placeLabels(ePending, eVerts, margin, width));

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
  // 56 is the connected gap: a 7 arrowhead and 49 of shaft. It was 22, which is the grid's
  // unconnected gap — the two rules contradicted each other and the chain followed the wrong one.
  const margin = 24, gap = 56;
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

  // 16 inside a container, the same number a leaf pads its own label by — one padding, not two
  // (05-artifacts.md § The primitives). It was 12, so a nested box read as falling out of its parent.
  const HEAD = 34, PAD_IN = 16;
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

  const CANVAS = 1100, margin = 24, gapX = GAP_LINKED;

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
          // A BOX IS CENTRED ON THE ROW'S MIDDLE, not hung from its top. The connector runs at the
          // tallest box's mid-height, so a shorter box left at the top took its only arrow off its
          // own centre — 7px on a row of one noted box and two plain ones, which is exactly the
          // fault the centring rule refuses. Centring is also what the developer asked for of every
          // figure: elements may be centred, and spacing is what must not vary.
          boxes.forEach((b, i) => {
            const by = y + (h - hs[i]) / 2;   // not rounded: a half-pixel here is the arrow off centre
            out.push(mapRect(b, x, by, ws[i], hs[i]));
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

  // EVERY horizontal run through a gap takes a lane of its own, so no two connectors travel side by
  // side and each label has a line to itself. A link to the next row crosses one gap and takes one
  // lane; a link that skips rows travels through two and takes a lane in each. Both are counted,
  // because a gap is as tall as everything crossing it, and lanes are a whole gap apart so the two
  // kinds cannot be placed by different arithmetic and land on each other.
  const rowOf = new Map<string, number>();
  rows.forEach((row, i) => { for (const b of row) rowOf.set(b.id, i); });
  const rowOfAny = (id: string) => rowOf.get(holder(id)) ?? -1;

  // A BOX LEAVES BY ITS SIDE ONLY IF NOTHING IN ITS ROW SITS BEYOND IT. The side corridor runs to the
  // right of every box, so a connector taking the right edge of a box that is NOT last in its row
  // travels the width of the row straight through every box after it: the nine-group map ran one link
  // across five boxes at their own mid-height, 0px of clear air, and printed its label over five more.
  // The chapter's rule is that a link which skips rows runs down a corridor clear of every box, and
  // clear is a fact about this row rather than an assumption — so it is decided per box. Last in its
  // row leaves by the side; anything else drops into the lane below, which is clear by construction.
  const lastInRow = new Set(rows.map((row) => row[row.length - 1].id));
  const bySide = (id: string) => lastInRow.has(holder(id));

  type Lane = { gap: number; index: number };
  const exitLane = new Map<Link, Lane>(), entryLane = new Map<Link, Lane>();
  const lanesIn: number[] = rows.map(() => 0);
  const takeLane = (gap: number): Lane => ({ gap, index: lanesIn[gap]++ });

  // How many connectors use each edge of each box, which is what decides how many points that edge
  // offers. Counted from the routes actually taken rather than from the rows alone: a link that skips
  // rows leaves by the side when it can and by the bottom when it cannot, and a box whose only arrow
  // leaves by the side must not have its bottom counted, or the one arrow on the bottom of the box
  // below it stops landing in the middle.
  const leaveBottom = new Map<string, number>(), enterTop = new Map<string, number>();
  const leaveTop = new Map<string, number>(), enterBottom = new Map<string, number>();
  const bump = (m: Map<string, number>, id: string) => m.set(id, (m.get(id) ?? 0) + 1);

  for (const l of links) {
    const ra = rowOfAny(l.from), rb = rowOfAny(l.to);
    if (ra < 0 || rb < 0 || ra === rb) continue;
    if (rb === ra + 1) {                                   // neighbours: one lane, bottom to top
      const lane = takeLane(ra);
      exitLane.set(l, lane); entryLane.set(l, lane);
      bump(leaveBottom, l.from); bump(enterTop, l.to);
    } else if (rb > ra + 1) {                              // skips down the right-hand corridor
      if (!bySide(l.from)) { exitLane.set(l, takeLane(ra)); bump(leaveBottom, l.from); }
      if (!bySide(l.to)) { entryLane.set(l, takeLane(rb - 1)); bump(enterTop, l.to); }
    } else {                                               // upward, and reported below
      if (!bySide(l.from)) { exitLane.set(l, takeLane(ra - 1)); bump(leaveTop, l.from); }
      if (!bySide(l.to)) { entryLane.set(l, takeLane(rb)); bump(enterBottom, l.to); }
    }
  }
  // A lane is not a line, it is a line plus the label riding above it plus the clear air the
  // contract owes on both sides. Deriving the pitch from LABEL_GAP is what stops a label touching
  // the arrow above it: whatever room a label needs, the next lane starts past it by construction.
  // One lane therefore makes a gap of exactly GAP_LINKED, which is the connected minimum.
  const LANE_H = LABEL_H + LABEL_GAP * 2, LANE_TOP = LANE_H;
  const gapAfter = (i: number) => Math.max(GAP_LINKED, LANE_TOP + LANE_H * lanesIn[i]);

  const laneY = (gap: number, lane: number) => rowBottom[gap] + LANE_TOP + LANE_H * lane;

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
  // A SIDE CORRIDOR PER SKIPPING LINK, clear to the right of every box. A link that skips rows runs
  // down one of these rather than out to the figure's far edge, so the figure is only as wide as the
  // routes it actually needs.

  const rightMost = Math.max(CANVAS - margin, ...[...at.values()].map((p2) => p2.x + p2.w));
  const skippers = links.filter((l) => {
    const ra = rowOfAny(l.from), rb = rowOfAny(l.to);
    return ra >= 0 && rb >= 0 && (rb < ra || rb > ra + 1);
  });
  const sideLane = (l: Link) => rightMost + GAP_LINKED + Math.max(0, skippers.indexOf(l)) * GAP_Y;
  const width = Math.max(CANVAS, (skippers.length ? sideLane(skippers[skippers.length - 1]) : 0) + margin);
  const height = y + margin;

  // WHERE A CONNECTOR MEETS A BOX, decided once so the lane search and the drawing cannot disagree.
  const exitX = (l: Link) => {
    const a = at.get(l.from)!, b = at.get(l.to)!;
    const up = b.row < a.row;
    const n = (up ? leaveTop : leaveBottom).get(l.from) ?? 0;
    const towards = b.row === a.row + 1 ? b.x + b.w / 2 : sideLane(l);
    return alignedTo(sidePoints(a.x, a.w, n), towards);
  };
  const entryX = (l: Link) => {
    const a = at.get(l.from)!, b = at.get(l.to)!;
    const up = b.row < a.row;
    const n = (up ? enterBottom : enterTop).get(l.to) ?? 0;
    const towards = b.row === a.row + 1 ? a.x + a.w / 2 : sideLane(l);
    return alignedTo(sidePoints(b.x, b.w, n), towards);
  };

  // WHICH LANE A LINK TAKES IN A GAP IS CHOSEN, NOT COUNTED OFF. Lanes keep the horizontal runs
  // apart, and nothing kept the VERTICAL runs apart: a link drops from its source to its own lane,
  // and drops again from that lane to its target, so a link on a high lane has a long second drop
  // passing every lane below it — and that drop can land inside the contract's 24 of another link's
  // first drop. Three links out of one gap came out 22 apart, and no arithmetic here was wrong: the
  // ORDER was. So the order is searched and scored with the same rule the figure check applies to
  // the finished drawing, and the first clean one wins. Where no order is clean the best is kept and
  // the check reports it, which is the promise the drawer makes everywhere: try, then tell the truth.
  type Drop = { link: Link; lane: Lane; x: number; edge: number };
  const drops: Drop[] = [];
  for (const l of links) {
    const a = at.get(l.from), b = at.get(l.to);
    if (!a || !b || a.row === b.row) continue;
    const down = b.row > a.row;
    const el = exitLane.get(l), en = entryLane.get(l);
    if (el) drops.push({ link: l, lane: el, x: exitX(l), edge: down ? a.y + a.h : a.y });
    if (en) drops.push({ link: l, lane: en, x: entryX(l), edge: down ? b.y : b.y + b.h });
  }

  // The figure check's own rule, applied to a candidate order rather than to a drawing.
  const clashes = (ds: Drop[], yOf: (lane: Lane) => number): number => {
    const segs = ds.map((d) => { const ly = yOf(d.lane); return { k: d.link, x: d.x, y1: Math.min(d.edge, ly), y2: Math.max(d.edge, ly) }; });
    let n = 0;
    for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
      if (segs[i].k === segs[j].k) continue;
      const apart = Math.abs(segs[i].x - segs[j].x);
      if (apart < 0.5 || apart >= GAP_APART) continue;   // collinear reads as one line continuing
      if (Math.min(segs[i].y2, segs[j].y2) - Math.max(segs[i].y1, segs[j].y1) > LABEL_GAP) n += 1;
    }
    return n;
  };
  const orders = <T,>(xs: T[]): T[][] =>
    xs.length <= 1 ? [xs] : xs.flatMap((x, i) => orders([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r]));

  for (let g = 0; g < rows.length; g++) {
    const ds = drops.filter((d) => d.lane.gap === g);
    const lanes = [...new Set(ds.map((d) => d.lane))];
    if (lanes.length < 2) continue;
    const yFor = (order: Lane[]) => {
      const m = new Map(order.map((ln, i) => [ln, rowBottom[g] + LANE_TOP + LANE_H * i]));
      return (ln: Lane) => m.get(ln)!;
    };
    let best = lanes, score = clashes(ds, yFor(lanes));
    // Six lanes in one gap is 720 orders and the search is exhaustive; beyond that it is greedy —
    // each place in turn takes whichever lane adds fewest clashes to what is already settled.
    if (score) {
      if (lanes.length <= 6) {
        for (const order of orders(lanes)) {
          const s2 = clashes(ds, yFor(order));
          if (s2 < score) { best = order; score = s2; if (!score) break; }
        }
      } else {
        const rest = [...lanes], picked: Lane[] = [];
        while (rest.length) {
          let at2 = 0, low = Infinity;
          for (let i = 0; i < rest.length; i++) {
            const trial = [...picked, rest[i]];
            const s2 = clashes(ds.filter((d) => trial.includes(d.lane)), yFor([...trial, ...rest.filter((r) => r !== rest[i])]));
            if (s2 < low) { low = s2; at2 = i; }
          }
          picked.push(...rest.splice(at2, 1));
        }
        if (clashes(ds, yFor(picked)) < score) best = picked;
      }
    }
    best.forEach((ln, i) => { ln.index = i; });
  }


  // Labels live in the gaps between rows. Two labels in one gap are stacked so neither overprints.
  const taken: { gap: number; x1: number; x2: number; y: number }[] = [];
  const labelAt = (gap: number, cx: number, w: number, baseY: number): { x: number; y: number } => {
    let x = Math.min(Math.max(cx - w / 2, margin), width - margin - w);
    let ly = baseY;
    for (let tries = 0; tries < 4; tries++) {
      const hit = taken.find((t) => t.gap === gap && Math.abs(t.y - ly) < LABEL_H + LABEL_GAP && t.x1 < x + w && x < t.x2);
      if (!hit) break;
      ly += LABEL_H + LABEL_GAP;
    }
    taken.push({ gap, x1: x, x2: x + w, y: ly });
    return { x, y: ly };
  };

  const verticals: Vert[] = [];
  const pending: Pending[] = [];

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
      if (l.label) label = labelAt(-1 - a.row, mid, w, Math.min(a.y, b.y) - LABEL_GAP);
    } else if (b.row === a.row + 1) {
      // The next row down: out of the bottom, along this link's own lane in the gap, into the top.
      const x1 = exitX(l), x2 = entryX(l);
      const y1 = a.y + a.h, y2 = b.y;
      const lane = exitLane.get(l);
      const mid = laneY(a.row, lane ? lane.index : 0);
      const straight = Math.abs(x1 - x2) < 1;
      d = straight ? `M${x1} ${y1} V${y2}` : `M${x1} ${y1} V${mid} H${x2} V${y2}`;
      if (l.label) {
        // Above this link's own horizontal run, or beside the vertical run when the link is straight.
        // Either way the text is in the gap and its span never contains a vertical segment.
        const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
        const cx = straight ? x1 + 8 + w / 2 : (lo + hi) / 2;
        label = { x: Math.min(Math.max(cx - w / 2, margin), width - margin - w), y: straight ? mid + LABEL_GAP : mid - LABEL_GAP };
        if (!straight && w > hi - lo - 8) { // a label longer than its run sits clear of both verticals
          label.x = Math.min(Math.max(hi + 6, margin), width - margin - w);
          if (label.x + w > width - margin) label.x = Math.max(lo - w - 6, margin);
        }
      }
    } else if (b.row > a.row) {
      // Skips a row: out to a corridor of its own, clear to the right of every box, down it, and
      // back in beside the target. A connector leaves whichever side puts it on the shortest honest
      // route rather than always the bottom — leaving the bottom forced a link that skips two rows
      // out to the figure's far edge and back across everything, to join two boxes sitting one above
      // the other (developer, 2026-09-21). HONEST is the word that does the work: the right edge is
      // the shortest route only for a box with nothing beyond it in its row, and for any other box
      // it is a run straight through its neighbours. So the side is taken when it is clear, and the
      // lane below is taken when it is not.
      const sideX = sideLane(l);
      const parts: string[] = [];
      let runY: number, runFrom: number;
      if (bySide(l.from)) { runY = a.y + a.h / 2; runFrom = a.x + a.w; parts.push(`M${runFrom} ${runY}`); }
      else {
        const el = exitLane.get(l)!; runY = laneY(el.gap, el.index); runFrom = exitX(l);
        parts.push(`M${runFrom} ${a.y + a.h}`, `V${runY}`);
      }
      parts.push(`H${sideX}`);
      if (bySide(l.to)) parts.push(`V${b.y + b.h / 2}`, `H${b.x + b.w}`);
      else { const en = entryLane.get(l)!; parts.push(`V${laneY(en.gap, en.index)}`, `H${entryX(l)}`, `V${b.y}`); }
      d = parts.join(" ");
      if (l.label) label = labelAt(a.row, (runFrom + sideX) / 2, w, runY - LABEL_GAP);
    } else {
      // Upward: out of the top, along the gap above to the lane, up to the gap below the target, in
      // from the bottom. Drawn, and reported, because a map is meant to flow one way.
      findings.push(`the link \`${l.from}\` → \`${l.to}\` runs upward; a map flows one way, so a link points at a box below its source`);
      const sideX = sideLane(l);
      const parts: string[] = [];
      let runY: number, runFrom: number;
      if (bySide(l.from)) { runY = a.y + a.h / 2; runFrom = a.x + a.w; parts.push(`M${runFrom} ${runY}`); }
      else {
        const el = exitLane.get(l)!; runY = laneY(el.gap, el.index); runFrom = exitX(l);
        parts.push(`M${runFrom} ${a.y}`, `V${runY}`);
      }
      parts.push(`H${sideX}`);
      if (bySide(l.to)) parts.push(`V${b.y + b.h / 2}`, `H${b.x + b.w}`);
      else { const en = entryLane.get(l)!; parts.push(`V${laneY(en.gap, en.index)}`, `H${entryX(l)}`, `V${b.y + b.h}`); }
      d = parts.join(" ");
      if (l.label) label = labelAt(a.row - 1, (runFrom + sideX) / 2, w, runY - LABEL_GAP);
    }
    out.push(`  <path class="c" d="${d}"${dash} marker-end="url(#ar)"/>`);
    if (label && l.label) { verticals.push(...vertsOf(d)); pending.push({ ...label, w, txt: l.label }); }
    else verticals.push(...vertsOf(d));
  }

  out.push(...placeLabels(pending, verticals, margin, width));

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
