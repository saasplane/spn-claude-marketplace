// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The figures · § A connector is a claim
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

/**
 * THE FLOWCHART SHAPES, and each one carries its meaning (05-artifacts.md § The figures). A shape is
 * not decoration: a reader knows a decision from a step before reading either label, which is the
 * whole reason `FLOWCHART` is its own kind rather than a `MAP` with a diamond bolted on.
 */
export type Shape = "process" | "terminator" | "decision" | "io" | "predefined" | "store" | "connector"
  | "window" | "chevron" | "pipe" | "bucket";

/**
 * A RESOURCE OUTSIDE A SYSTEM'S BOUNDARY CARRIES THE SHAPE OF WHAT IT IS (05-artifacts.md § SYSTEM,
 * rule 4). Seven kinds, and each earns its place by being a different KIND of thing rather than a
 * different colour of the same thing — you read what a box is before you read its name.
 */
export type Resource = "client" | "way-in" | "queue" | "store" | "cache" | "bucket" | "service";
const RESOURCE: Record<Resource, { shape: Shape; soft?: boolean }> = {
  client: { shape: "window" },
  "way-in": { shape: "chevron" },
  queue: { shape: "pipe" },
  store: { shape: "store" },
  cache: { shape: "store", soft: true },   // a cylinder you can afford to lose
  bucket: { shape: "bucket" },
  service: { shape: "process" },
};
export type Box = { id: string; label: string; note?: string; em?: boolean; off?: boolean; warn?: boolean; in?: string; shape?: Shape };
export type Link = { from: string; to: string; label?: string; dashed?: boolean; card?: string };
/** One band of a SYSTEM's boundary: a named layer, and the boxes inside it. */
export type Layer = { name: string; boxes: Box[] };
export type Spec = {
  kind: string; boxes?: Box[]; links?: Link[]; caption?: string; title?: string;
  layers?: Layer[]; outside?: (Box & { as?: Resource })[]; frame?: SkeletonFrame;
};

/**
 * SKELETON — where the parts of a screen or a block sit, and nothing about how they look
 * (05-artifacts.md § `SKELETON`). An item is plain words, a control, an icon, a slot, a stand-in, a
 * note in muted text, or a frame of its own: a region, such as a navigation beside a main area.
 */
export type SkeletonItem = {
  /** Plain words — a title. With `control` it is the control's sample value; with `icon`, the word beside it. */
  text?: string; note?: string; fill?: boolean;
  frame?: SkeletonFrame;
  /** A named place that holds content: a dotted boundary and its name. */
  tag?: string;
  /** A slot that accepts any node: one block whose only content is its name. */
  slot?: string;
  /** A control at the size of its component, on one line. `main` tells the main action by weight, never by colour. */
  control?: "button" | "field" | "select" | "checkbox" | "pager"; main?: boolean;
  /** One of the small set of plain line shapes the drawer draws, centred in a square the height of a control. */
  icon?: "close" | "add" | "menu" | "search" | "more" | "previous" | "next" | "select" | "checkbox" | "bell" | "person" | "default";
  /** What bars stand in for; `lines` counts them, and the indexes in `headings` are shorter, taller heading bars. */
  standin?: "rows" | "cards" | "field" | "list"; lines?: number; headings?: number[];
  /** Free room that pushes the items after it to the end of the row. */
  spacer?: boolean;
  /** A region standing taller than what it holds, in rows. */
  height?: number;
};
/** A row runs left to right. `label` names the place, in a column every row of the frame shares;
 *  `framed` puts the row's items inside one box, as an example sits in its frame. */
export type SkeletonRow = { label?: string; framed?: boolean; items: SkeletonItem[] };
/** A frame is a box, with an optional title (`label`) and `note`, holding rows top to bottom. A
 *  frame nested in a row may carry `width` — a fraction of the row, or absent for what is left. Its `look` is
 *  `raised` (a surface), `bordered` (a solid line) or `flat` (neither), and `fill` takes the height left in its column.
 *
 *  A CONTAINER is a frame with `frames`: its rows each hold one part, the parts stand with no gap, and `frames`
 *  names the parts that share a frame. Parts next to each other that are named share one frame; a part not
 *  named is flat. The frame is `raised` (one surface behind its parts), `bordered` (one solid outline and a solid
 *  line between its parts), or both, and `rounded` or square. `size` is a size step, `XS` to `XL`, that every
 *  control inside reads its height from; the default is `SM`. */
export type SkeletonFrame = {
  label?: string; note?: string; width?: string; rows: SkeletonRow[]; look?: "raised" | "bordered" | "flat"; tag?: string; height?: number; fill?: boolean;
  frames?: string[]; raised?: boolean; bordered?: boolean; rounded?: boolean;
  size?: "XS" | "SM" | "MD" | "LG" | "XL";
};

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
// A LABEL IS SPOKEN, NOT RENDERED. A caption may carry the page's own markdown — a code span for a
// contract term, emphasis on one word — and the `<figcaption>` renders it as markup. The `aria-label`
// is read aloud instead, so the same sentence reaching it verbatim makes a screen reader announce the
// backtick characters themselves. Found by a step 2 agent on the one caption that spells a contract
// term as a code span (N14, 2026-09-22). The markers are the four `render.ts` renders inline.
const spoken = (s: string) => s
  .replace(/`([^`]+)`/g, "$1")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  .replace(/\*\*([^*]+)\*\*/g, "$1")
  .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1$2");

/**
 * A FIGURE'S viewBox HUGS ITS CONTENT, so a drawing is as wide as the paragraph above it. Every
 * drawer lays out inside a 1100 canvas and centres its rows in it, which is right for placing things
 * and wrong for shipping them: a four-box flowchart 250px wide arrived inside a 1156 canvas and
 * rendered as a small picture marooned in white space. The developer saw it on the blocks page —
 * *let each type of blocks take full width* — and the hand-authored figures were fitted then; the
 * drawer never was, so every figure it produced still paid the inset the edge-to-edge rule forbids.
 *
 * Bleed is `2`, so a `1.5` stroke on an outer edge is not clipped, and `9` wherever a connector
 * reaches the boundary, so the check's own `8px` frame rule still holds. `<defs>` is excluded: the
 * arrowhead defined there has its own coordinate space starting at 0,0, and measuring it makes every
 * figure look as though it already began at the origin (N13, 2026-09-22).
 */
function fit(body: string[]): { x0: number; y0: number; w: number; h: number } {
  const src = body.filter((l) => !l.includes("<defs>")).join("\n");
  let lo: [number, number] = [Infinity, Infinity], hi: [number, number] = [-Infinity, -Infinity];
  const see = (x: number, y: number, pad = 0) => {
    lo = [Math.min(lo[0], x - pad), Math.min(lo[1], y - pad)];
    hi = [Math.max(hi[0], x + pad), Math.max(hi[1], y + pad)];
  };
  for (const m of src.matchAll(/<rect[^>]*\sx="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/g))
    { const [x, y, w, h] = m.slice(1).map(Number); see(x, y); see(x + w, y + h); }
  for (const m of src.matchAll(/<circle[^>]*\scx="(-?[\d.]+)" cy="(-?[\d.]+)" r="([\d.]+)"/g))
    { const [cx, cy, r] = m.slice(1).map(Number); see(cx, cy, r); }
  for (const m of src.matchAll(/<ellipse[^>]*\scx="(-?[\d.]+)" cy="(-?[\d.]+)" rx="([\d.]+)" ry="([\d.]+)"/g))
    { const [cx, cy, rx, ry] = m.slice(1).map(Number); see(cx - rx, cy - ry); see(cx + rx, cy + ry); }
  // Text is measured from the same character widths the figure check measures it by, and a baseline
  // sits below its own line, so the box runs upward from `y`.
  for (const m of src.matchAll(/<text class="([\w-]+)" x="(-?[\d.]+)" y="(-?[\d.]+)">([\s\S]*?)<\/text>/g)) {
    const cls = m[1], x = Number(m[2]), y = Number(m[3]);
    const w = m[4].replace(/&[a-z]+;/g, " ").length * (cls === "sds-title" ? W_TITLE : cls === "sds-label" ? W_LABEL : W_NOTE);
    see(x, y - 13); see(x + w, y + 3);
  }
  for (const m of src.matchAll(/<path[^>]*\sd="([^"]+)"/g)) {
    const conn = m[0].includes('class="sds-connector');
    let x = 0, y = 0;
    for (const [, c, u, v] of m[1].matchAll(/([MLHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g)) {
      const a = Number(u);
      x = c === "V" ? x : a;
      y = c === "V" ? a : c === "H" ? y : Number(v);
      see(x, y, conn ? 9 : 2);
    }
  }
  if (!Number.isFinite(lo[0])) return { x0: 0, y0: 0, w: 1100, h: 1 };
  const x0 = Math.floor(lo[0] - 2), y0 = Math.floor(lo[1] - 2);
  return { x0, y0, w: Math.ceil(hi[0] + 2) - x0, h: Math.ceil(hi[1] + 2) - y0 };
}

/** One masthead for every drawer: the marker it needs, and a viewBox that hugs what was drawn. */
function svgOf(body: string[], label: string, extraClass = ""): string {
  const { x0, y0, w, h } = fit(body);
  return [
    // A FIGURE IS NEVER SCALED UP. The page sets `width:100%` so a wide figure shrinks to the column,
    // and that same rule stretched a NARROW one: a flowchart 586 across was blown up to the column's
    // 1100, so its text rendered at twice the size of the figure above it and the drawing stood
    // 1650px tall. The cap is the figure's own width, inline so it beats the stylesheet, and
    // `width:100%` still shrinks it on a narrow screen (2026-09-22, found on the Sign-in sample).
    `<svg class="sds-drawing${extraClass ? " " + extraClass : ""}" viewBox="${x0} ${y0} ${w} ${h}" style="max-width:${w}px" role="img" aria-label="${esc(spoken(label))}">`,
    // THE ARROWHEAD ONLY WHERE AN ARROW USES IT. A figure with no connector — every skeleton — carried
    // a marker it never drew, and six of them on one page repeated the id `ar` six times.
    ...(body.some((l) => l.includes("marker-end")) ? [`  <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>`] : []),
    ...body,
    `</svg>`,
  ].join("\n");
}

type Vert = { x: number; y1: number; y2: number; path?: number };
type Blocker = { x: number; y: number; w: number; h: number; path?: number };
// A LABEL IS NEVER BLOCKED BY ITS OWN CONNECTOR. Once runs became blockers the placer started
// pushing each label away from the very line it names — a system diagram's labels sit a standard
// gap above their own horizontal leg, which is exactly where they belong. Each run carries the
// path it came from and each label the path it names, and the placer skips the match.
type Pending = { x: number; y: number; w: number; txt: string; path?: number };

/** Every vertical run in a path, so a label can be kept off all of them and not merely off its own. */
function vertsOf(d: string, path?: number): Vert[] {
  const out: Vert[] = [];
  let x = 0, y = 0;
  for (const [, c, u, v] of d.matchAll(/([MHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g)) {
    const a = Number(u);
    const nx = c === "V" ? x : a, ny = c === "V" ? a : c === "M" ? Number(v) : y;
    if (c === "V") out.push({ x, y1: y, y2: ny, path });
    x = nx; y = ny;
  }
  return out;
}

/**
 * Every HORIZONTAL run in a path, shaped as a zero-height blocker.
 *
 * `placeLabels` already keeps a label clear of every box and every vertical run, and a horizontal
 * run was the third thing on the canvas that nothing told it about. Giving a label a second axis
 * to move on made that gap visible immediately: a label stepped to a free band and landed 1px from
 * the horizontal leg of another connector. A run with no height blocks exactly the way a flat box
 * would, so the placer needs no new rule — only the shape it already knows.
 */
function horzOf(d: string, path?: number): Blocker[] {
  const out: Blocker[] = [];
  let x = 0, y = 0;
  for (const [, c, u, v] of d.matchAll(/([MHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g)) {
    const a = Number(u);
    const nx = c === "V" ? x : a, ny = c === "V" ? a : c === "M" ? Number(v) : y;
    if (c === "H") out.push({ x: Math.min(x, nx), y: y, w: Math.abs(nx - x), h: 0, path });
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
function placeLabels(pending: Pending[], verticals: Vert[], margin: number, width: number,
                     boxes: Blocker[] = []): string[] {
  // AND A LABEL ALREADY PLACED BLOCKS THE ONE AFTER IT. The pass slid each label clear of the lines
  // and the boxes and then dropped it on its neighbour, because it kept no memory of where it had
  // just put one — two labels in the same band, 70px of overlap, and each of them individually
  // correct. This is the same rule the figure check applies when it says two words that close read
  // as one phrase; the placer now applies it while it still has somewhere else to go.
  const settled: { x: number; y: number; w: number }[] = [];
  // A BAND IS THE SECOND AXIS, and the pass used to have only the first. It slid a label sideways
  // along its own line and, where every x was taken, left it sitting on a connector and let the
  // figure check report it — eleven findings on one six-box map, each of them a label with nowhere
  // horizontal to go and a perfectly empty band a few pixels above. A label may now step to the
  // next band up or down, two at most, so it stays beside the line it names; the pitch is the one
  // the contract already uses everywhere else. Horizontal is still tried first at every band,
  // because sliding along the line reads better than floating away from it.
  const PITCH = LABEL_H + LABEL_GAP;
  const bands = [0, -PITCH, PITCH, -2 * PITCH, 2 * PITCH, -3 * PITCH, 3 * PITCH];
  return pending.map((p) => {
    // A BOX IS AS BLOCKING AS A CONNECTOR, and this pass only knew about connectors. Sliding a label
    // clear of two vertical runs pushed it OUT of the column gap and onto the box it named: the
    // sliding rule solved the problem it was given and created a worse one nobody had told it about.
    // A box overlapping the label's own band blocks its whole width plus the clear air it is owed.
    const blockedAt = (y: number): [number, number][] => {
      // THE SAME RECTANGLE THE CHECK MEASURES, to the pixel. The placer used to model the label as
      // `y - LABEL_H` to `y + 2`, two pixels taller at the bottom than the check's `y - lh` to `y`,
      // and those two pixels were the whole bug: a label sitting the contract's exact gap above its
      // own connector read as blocked, so the placer moved it — off a position that was already
      // correct and onto one that was not. A label owes clear air to every arrow, its own included,
      // so nothing here is excluded for belonging to the label. It simply has to measure what the
      // gate measures.
      const top = y - LABEL_H, bottom = y;
      return [
        ...verticals
          .filter((v) => Math.min(v.y1, v.y2) < bottom + LABEL_GAP && Math.max(v.y1, v.y2) > top - LABEL_GAP)
          .map((v) => [v.x - LABEL_GAP, v.x + LABEL_GAP] as [number, number]),
        ...boxes
          .filter((b) => b.y < bottom + LABEL_GAP && b.y + b.h > top - LABEL_GAP)
          .map((b) => [b.x - LABEL_GAP, b.x + b.w + LABEL_GAP] as [number, number]),
        ...settled
          .filter((q) => Math.abs(q.y - y) < PITCH)
          .map((q) => [q.x - LABEL_GAP, q.x + q.w + LABEL_GAP] as [number, number]),
      ];
    };
    let best: { x: number; y: number } | null = null;
    for (const dy of bands) {
      const y = p.y + dy;
      const blocked = blockedAt(y);
      const free = (x: number) => x >= margin && x + p.w <= width - margin
        && !blocked.some(([lo, hi]) => lo < x + p.w && x < hi);
      if (free(p.x)) { best = { x: p.x, y: y }; break; }
      const tries = [...blocked.flatMap(([lo, hi]) => [hi, lo - p.w]), margin, width - margin - p.w]
        .filter(free)
        .sort((m, n) => Math.abs(m - p.x) - Math.abs(n - p.x));
      if (tries.length) { best = { x: tries[0], y: y }; break; }
    }
    // NOWHERE CLEAR ANYWHERE still leaves it where it was put, and the check still reports it.
    // A placer that invents room it does not have hides the crowding instead of fixing it.
    const at = best ?? { x: p.x, y: p.y };
    settled.push({ x: at.x, y: at.y, w: p.w });
    return `  <text class="sds-note" x="${Math.round(at.x)}" y="${Math.round(at.y)}">${esc(p.txt)}</text>`;
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

/** The classes of a box: the spec's `em` is the blue tone, `warn` the amber one, and `off` a box that is absent. */
function boxClass(b: Box): string {
  if (b.em) return "sds-box sds-tone-blue";
  if (b.warn) return "sds-box sds-tone-amber";
  if (b.off) return "sds-box sds-absent";
  return "sds-box";
}

function rect(b: Box, x: number, y: number, w: number, h: number): string {
  const cy = b.note ? y + 26 : y + h / 2 + 4;
  const out = [`  <rect class="${boxClass(b)}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`,
               `  <text class="sds-label" x="${x + PAD_X}" y="${cy}">${esc(b.label)}</text>`];
  if (b.note) out.push(`  <text class="sds-note" x="${x + PAD_X}" y="${cy + 19}">${esc(b.note)}</text>`);
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
  // A RELATION'S TEXT IS ITS LABEL AND ITS CARDINALITY, as one phrase, computed ONCE. Sizing the
  // column gap from the label alone and then drawing the label plus its cardinality is two readings
  // of one thing, which is the shape of fault this arc keeps finding: the gap came out 80 wide for
  // text that needed 96, and three labels landed over boxes they did not belong to.
  const relationText = (l: Link) => l.label ? (l.card ? `${l.label}  ${l.card}` : l.label) : (l.card ?? "");
  const widestLabel = Math.max(0, ...links.map((l) => relationText(l).length * W_NOTE));
  // A COLUMN GAP HOLDS THE LABELS **AND** THE ELBOWS. Sized for the widest label alone, a gap two
  // relations cross has its own two vertical runs standing in the space the labels were measured
  // for — so each label is pushed off its centre, onto a box or onto its neighbour. The gap is wide
  // enough for the widest thing said across it plus a lane for every relation after the first.
  const crossings = Math.max(
    links.filter((l) => l.to === centre.id).length,
    links.filter((l) => l.from === centre.id).length, 1);
  const gapCol = Math.max(GAP_COL, Math.ceil(widestLabel) + LABEL_GAP * 2 + GAP_APART * (crossings - 1));
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
  const eHorz: Blocker[] = [];
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

  for (const [pathId, l] of links.entries()) {
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
    out.push(`  <path class="sds-connector" d="${dPath}"${dash} marker-end="url(#ar)"/>`);
    eVerts.push(...vertsOf(dPath, pathId)); eHorz.push(...horzOf(dPath, pathId));
    // EVERY RELATION LINE CARRIES ITS CARDINALITY, which is what the chapter asks of this kind and
    // what the drawer had no field for: an ER diagram whose lines say only *belongs to* leaves the
    // reader with the one question they opened it to answer — one, or many? It rides with the label
    // rather than sitting apart from it, because the two are read as one phrase.
    if (!l.card)
      findings.push(`the relation \`${l.from}\` → \`${l.to}\` carries no cardinality; every relation line in an entity diagram says one or many (\`card\`: "1:N")`);
    const text = relationText(l);
    if (text) {
      // THE LABEL SITS IN THE COLUMN GAP, on the connector's own vertical run — the one place in an
      // ER layout where no box can be. Hung above a box instead, it lands inside whichever column is
      // taller. Where the run is straight across it goes a standard gap above the line.
      const w = text.length * W_NOTE;
      // ON ITS OWN OUTBOUND LEG, not centred on the gap. Centring every label on the gap put them all
      // at one x, so with more than one relation crossing a gap each was pushed off by the other's
      // elbow — onto a box, or onto its neighbour. A link's own leg runs from its source to its own
      // elbow, at its own height, and that is a stretch no other relation in the gap occupies.
      const lead = Math.min(x1, mid), tail = Math.max(x1, mid);
      const want = (lead + tail - w) / 2;
      // Kept inside the gap, so a label never starts over the column it came from.
      const lo = Math.min(x1, x2) + LABEL_GAP, hi = Math.max(x1, x2) - LABEL_GAP;
      // A GAP HAS TWO BANDS, NOT ONE. Relations after the first in a gap alternate to the underside
      // of their own leg, which doubles the room without widening the figure — and a label under a
      // line reads as belonging to it exactly as one above it does.
      const under = i % 2 === 1;
      ePending.push({ x: Math.round(Math.min(Math.max(want, lo), Math.max(lo, hi - w))),
                      y: y1 + (under ? LABEL_H + LABEL_GAP : -LABEL_GAP), w, txt: text, path: pathId });
    }
  }

  out.push(...placeLabels(ePending, eVerts, margin, width, [...at.values(), ...eHorz]));

  return { svg: svgOf(out, spec.title ?? spec.caption ?? "entity diagram"), findings };
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
    if (i < boxes.length - 1) out.push(`  <path class="sds-connector" d="M${x + widths[i]} ${margin + h / 2} H${x + widths[i] + gap}" marker-end="url(#ar)"/>`);
    x += widths[i] + gap;
  });
  return {
    svg: svgOf(out, spec.title ?? spec.caption ?? "chain"),
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
const shapeOf = (b: Box): Shape => b.shape ?? "process";

// The lean on a parallelogram, the bars on a predefined process, the cap on a cylinder, and the
// radius of an on-page connector. Four numbers, each belonging to one shape and to nothing else.
const SKEW = 16, BARS = 11, CAP = 13, DOT = 17;
// A window's title bar, a chevron's point, and how far a bucket narrows towards its foot.
const BAR = 22, POINT = 40, TAPER = 12;

/**
 * TEXT IS CENTRED BY ARITHMETIC, NOT BY `text-anchor`. The figure check reads a `<text>` element's
 * `x` as the LEFT edge of the word and measures its box from there, so a centred label declared the
 * SVG way would be judged half a word to the right of where it actually sits — every clearance
 * around it wrong, and wrong in the direction that passes. So the drawer computes the left edge
 * itself from the same character width the check uses, and the two halves agree by construction.
 */
function centred(cls: "sds-label" | "sds-note", txt: string, cx: number, y: number): string {
  const w = txt.length * (cls === "sds-label" ? W_LABEL : W_NOTE);
  return `  <text class="${cls}" x="${Math.round(cx - w / 2)}" y="${y}">${esc(txt)}</text>`;
}

function mapBoxWidth(b: Box): number {
  const lines = b.note ? wrapNote(b.note) : [];
  const widest = Math.max(b.label.length * W_LABEL, ...lines.map((l) => l.length * W_NOTE));
  const base = Math.ceil(widest + PAD_X * 2);
  switch (shapeOf(b)) {
    // A DIAMOND HOLDS ONLY THE RECTANGLE INSCRIBED IN IT. A rectangle centred in a diamond of width
    // W and height H fits exactly when `tw/W + th/H <= 1`, so a flat allowance cannot be right at
    // any size — the wider the text, the more the corners take away. Doubling each side puts both
    // ratios at one half, which leaves the text's own corners inside the edge with its padding to
    // spare. Found by the developer on the Sign-in flowchart, where *The organization judges* sat
    // wider than the diamond at its own height and the note's last line fell outside it entirely
    // (2026-09-22).
    case "decision": return base * 2;
    case "io": return base + SKEW;
    case "predefined": return base + BARS * 2;
    case "terminator": return base + 12;
    case "connector": return DOT * 2;
    case "chevron": return base + POINT;
    case "pipe": return base + CAP;
    case "bucket": return base + TAPER * 2;
    default: return base;
  }
}
function mapBoxHeight(b: Box): number {
  const lines = b.note ? wrapNote(b.note).length : 0;
  const base = lines ? 26 + 19 * lines + 12 : H_ONE;
  switch (shapeOf(b)) {
    // The other half of the inscribed rule above: doubled, so the text's height uses half the
    // diamond and its width the other half.
    case "decision": return base * 2;
    // The cap sits INSIDE the box's own bounds rather than above them, so the grid's spacing keeps
    // every neighbour clear of it without the layout knowing a cylinder is there.
    case "store": return base + CAP;
    case "terminator": return Math.max(base, 40);
    case "connector": return DOT * 2;
    case "window": return base + BAR;
    default: return base;
  }
}

/**
 * A SHAPE IS DRAWN, AND ITS TEXT IS PLACED INSIDE IT. Everything but `process` centres its label,
 * because a leaning, pointed or round shape has no left edge a reader's eye can rest on.
 *
 * Only `<rect>` is a shape the figure check measures sides of, which is deliberate rather than a
 * gap: a connector lands on a diamond's vertex or a terminator's end, and the check reads those as
 * points on a closed path — it is the CENTRING rule that wants a rectangle, and a diamond has no
 * side to be off the middle of.
 */
function mapRect(b: Box, x: number, y: number, w: number, h: number): string {
  const cls = boxClass(b), cx = x + w / 2, cy = y + h / 2;
  const body: string[] = [];
  let textTop = y + 26, textMid = cy + 4, centre = true;

  switch (shapeOf(b)) {
    case "terminator":
      body.push(`  <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/>`);
      break;
    case "decision":
      body.push(`  <path class="${cls}" d="M${cx} ${y} L${x + w} ${cy} L${cx} ${y + h} L${x} ${cy} Z"/>`);
      // THE BLOCK IS CENTRED ON THE DIAMOND'S WAIST, not hung from its top. A diamond is at its
      // widest exactly at the middle, so text starting 26 below the top vertex begins where the
      // shape is still narrow — and once the height was doubled to fit the text at all, a
      // top-anchored block sat high and left the room it needed empty underneath it.
      textTop = cy - (19 * (b.note ? wrapNote(b.note).length : 0)) / 2 + 4;
      break;
    case "io":
      body.push(`  <path class="${cls}" d="M${x + SKEW} ${y} L${x + w} ${y} L${x + w - SKEW} ${y + h} L${x} ${y + h} Z"/>`);
      break;
    case "predefined":
      body.push(`  <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`,
                `  <path class="${cls}" d="M${x + BARS} ${y} V${y + h}"/>`,
                `  <path class="${cls}" d="M${x + w - BARS} ${y} V${y + h}"/>`);
      break;
    case "store":
      // Rect from the cap's waist down, cap centred on that waist: a connector lands on the rect,
      // which is a shape the check can measure, and the cap is the picture rather than the claim.
      body.push(`  <rect class="${cls}" x="${x}" y="${y + CAP}" width="${w}" height="${h - CAP}" rx="3"/>`,
                `  <ellipse class="${cls}" cx="${cx}" cy="${y + CAP}" rx="${w / 2}" ry="${CAP}"/>`);
      textTop = y + CAP + 26; textMid = y + CAP + (h - CAP) / 2 + 4;
      break;
    case "connector":
      body.push(`  <circle class="${cls}" cx="${cx}" cy="${cy}" r="${DOT}"/>`);
      break;
    case "window":
      // A client: a frame with a title bar. The bar is marked a curve so the figure check reads it
      // as part of the picture rather than as a connector starting and ending on nothing.
      body.push(`  <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`,
                `  <path class="sds-connector" data-role="curve" d="M${x} ${y + BAR} H${x + w}"/>`);
      textTop = y + BAR + 24; textMid = y + BAR + (h - BAR) / 2 + 4; centre = false;
      break;
    case "chevron":
      body.push(`  <path class="${cls}" d="M${x} ${y} H${x + w - POINT} L${x + w} ${cy} L${x + w - POINT} ${y + h} H${x} Z"/>`);
      centre = false;
      break;
    case "pipe":
      // A queue, lying on its side: the cap is at the end work enters, not on top.
      body.push(`  <rect class="${cls}" x="${x + CAP}" y="${y}" width="${w - CAP}" height="${h}" rx="3"/>`,
                `  <ellipse class="${cls}" cx="${x + CAP}" cy="${cy}" rx="${CAP}" ry="${h / 2}"/>`);
      textTop = y + 26; textMid = cy + 4; centre = false;
      break;
    case "bucket":
      body.push(`  <path class="${cls}" d="M${x} ${y} L${x + w} ${y} L${x + w - TAPER} ${y + h} L${x + TAPER} ${y + h} Z"/>`);
      centre = false;
      break;
    default:
      body.push(`  <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`);
      centre = false;
  }

  if (!b.note) {
    body.push(centre ? centred("sds-label",b.label, cx, textMid) : `  <text class="sds-label" x="${x + PAD_X}" y="${textMid}">${esc(b.label)}</text>`);
    return body.join("\n");
  }
  body.push(centre ? centred("sds-label",b.label, cx, textTop) : `  <text class="sds-label" x="${x + PAD_X}" y="${textTop}">${esc(b.label)}</text>`);
  wrapNote(b.note).forEach((line, i) => body.push(
    centre ? centred("sds-note",line, cx, textTop + 19 * (i + 1))
           : `  <text class="sds-note" x="${x + PAD_X}" y="${textTop + 19 + 19 * i}">${esc(line)}</text>`));
  return body.join("\n");
}

type Placed = { x: number; y: number; w: number; h: number; row: number };

/**
 * WHERE A CONNECTOR MEETS A SHAPE depends on the shape, which is the price of having shapes at all.
 * A rectangle's top is a flat run offering up to three points; a diamond's top is a single vertex; a
 * parallelogram's top is a flat run shifted by its own lean; a cylinder's top is the waist of its
 * cap. Get this wrong and the arrow lands in white space beside the shape it points at — which the
 * figure check reports as a connector starting nowhere, and which a reader sees immediately.
 */
function acrossPoints(b: Box, p: Placed, side: "top" | "bottom", asking: number): number[] {
  const cx = p.x + p.w / 2;
  switch (shapeOf(b)) {
    case "decision": case "connector": case "terminator": return [Math.round(cx)];
    case "io": return [Math.round(cx + (side === "top" ? SKEW / 2 : -SKEW / 2))];
    default: return sidePoints(p.x, p.w, asking);
  }
}
/** A cylinder's top edge is the waist its cap is centred on, because that is where its rect starts. */
const edgeY = (b: Box, p: Placed, side: "top" | "bottom") =>
  side === "bottom" ? p.y + p.h : shapeOf(b) === "store" ? p.y + CAP : p.y;
/** A shape's left and right, measured at its own middle, where a sideways connector meets it. */
function edgeX(b: Box, p: Placed, side: "left" | "right"): number {
  const cx = p.x + p.w / 2;
  switch (shapeOf(b)) {
    case "io": return side === "left" ? p.x + SKEW / 2 : p.x + p.w - SKEW / 2;
    case "connector": return side === "left" ? cx - DOT : cx + DOT;
    // A bucket narrows towards its foot, so at its own middle it is half a taper in on both sides.
    case "bucket": return side === "left" ? p.x + TAPER / 2 : p.x + p.w - TAPER / 2;
    // A pipe is entered at the tip of its cap, which is where work goes in.
    case "pipe": return side === "left" ? p.x : p.x + p.w;
    default: return side === "left" ? p.x : p.x + p.w;
  }
}
/** A cylinder's middle is the middle of its body, not of the box its cap is reserved in. */
const midY = (b: Box, p: Placed) => shapeOf(b) === "store" ? p.y + CAP + (p.h - CAP) / 2 : p.y + p.h / 2;

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
function drawMap(spec: Spec, opts: { downward?: boolean } = {}): { svg: string; findings: string[] } {
  const label = opts.downward ? "flowchart" : "map";
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
      // A FLOWCHART RUNS DOWN THE PAGE even when it is a straight line and would fit across one.
      // A map of three parts reads fine either way; a path does not, because a reader follows a
      // path downward and a decision's answers have to fall on either side of where it turns.
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
        if (total <= CANVAS - margin * 2 && !opts.downward) {
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
              out.push(`  <path class="sds-connector" d="M${x1} ${cy} H${x2}"${l?.dashed ? ' stroke-dasharray="5 4"' : ""} marker-end="url(#ar)"/>`);
              if (l?.label) out.push(`  <text class="sds-note" x="${Math.round(x1 + (gaps[i] - labelW(i)) / 2)}" y="${cy - 8}">${esc(l.label)}</text>`);
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
              out.push(`  <path class="sds-connector" d="M${cx} ${y1} V${y2}"${l?.dashed ? ' stroke-dasharray="5 4"' : ""} marker-end="url(#ar)"/>`);
              if (l?.label) out.push(`  <text class="sds-note" x="${cx + 10}" y="${y1 + GAP_V / 2 + 4}">${esc(l.label)}</text>`);
              y = y2;
            }
          });
          height = y + hs[hs.length - 1] + margin;
        }
        return { svg: svgOf(out, spec.title ?? spec.caption ?? label), findings };
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
    out.push(`  <text class="sds-label" x="${x + PAD_IN}" y="${y + 22}">${esc(b.label)}</text>`);
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

  // THE CORRIDOR SITS BESIDE THE BOXES, not beside the canvas. It was floored at the canvas edge, so
  // a four-box flowchart 260px wide sent its one skipping link out to x=1132 and back — a sweep the
  // width of a page to join two boxes a hand's breadth apart, and 725px of viewBox for 260px of
  // picture. The canvas is where things are LAID OUT; it is not where they end up.
  const rightMost = Math.max(...[...at.values()].map((p2) => p2.x + p2.w));
  const skippers = links.filter((l) => {
    const ra = rowOfAny(l.from), rb = rowOfAny(l.to);
    return ra >= 0 && rb >= 0 && (rb < ra || rb > ra + 1);
  });
  const sideLane = (l: Link) => rightMost + GAP_LINKED + Math.max(0, skippers.indexOf(l)) * GAP_Y;
  const width = Math.max(rightMost, skippers.length ? sideLane(skippers[skippers.length - 1]) : 0) + margin;
  const height = y + margin;

  // WHERE A CONNECTOR MEETS A BOX, decided once so the lane search and the drawing cannot disagree.
  const exitX = (l: Link) => {
    const a = at.get(l.from)!, b = at.get(l.to)!;
    const up = b.row < a.row;
    const n = (up ? leaveTop : leaveBottom).get(l.from) ?? 0;
    const towards = b.row === a.row + 1 ? b.x + b.w / 2 : sideLane(l);
    return alignedTo(acrossPoints(byId.get(l.from)!, a, up ? "top" : "bottom", n), towards);
  };
  const entryX = (l: Link) => {
    const a = at.get(l.from)!, b = at.get(l.to)!;
    const up = b.row < a.row;
    const n = (up ? enterBottom : enterTop).get(l.to) ?? 0;
    const towards = b.row === a.row + 1 ? a.x + a.w / 2 : sideLane(l);
    return alignedTo(acrossPoints(byId.get(l.to)!, b, up ? "bottom" : "top", n), towards);
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
    const ba = byId.get(l.from)!, bb = byId.get(l.to)!;
    if (el) drops.push({ link: l, lane: el, x: exitX(l), edge: edgeY(ba, a, down ? "bottom" : "top") });
    if (en) drops.push({ link: l, lane: en, x: entryX(l), edge: edgeY(bb, b, down ? "top" : "bottom") });
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
  const horizontals: Blocker[] = [];
  const pending: Pending[] = [];

  for (const [pathId, l] of links.entries()) {
    const a = at.get(l.from), b = at.get(l.to);
    if (!a || !b) continue;
    const dash = l.dashed ? ' stroke-dasharray="5 4"' : "";
    let d: string; let label: { x: number; y: number } | null = null;
    const w = (l.label ?? "").length * W_NOTE;
    if (a.row === b.row) {
      // Side by side: out of one vertical edge, into the other, the label above both.
      const rightward = a.x < b.x;
      const ba = byId.get(l.from)!, bb = byId.get(l.to)!;
      const x1 = edgeX(ba, a, rightward ? "right" : "left"), x2 = edgeX(bb, b, rightward ? "left" : "right");
      const y1 = midY(ba, a), y2 = midY(bb, b), mid = (x1 + x2) / 2;
      d = `M${x1} ${y1} H${mid} V${y2} H${x2}`;
      if (l.label) label = labelAt(-1 - a.row, mid, w, Math.min(a.y, b.y) - LABEL_GAP);
    } else if (b.row === a.row + 1) {
      // The next row down: out of the bottom, along this link's own lane in the gap, into the top.
      const x1 = exitX(l), x2 = entryX(l);
      const y1 = edgeY(byId.get(l.from)!, a, "bottom"), y2 = edgeY(byId.get(l.to)!, b, "top");
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
      const ba = byId.get(l.from)!, bb = byId.get(l.to)!;
      if (bySide(l.from)) { runY = midY(ba, a); runFrom = edgeX(ba, a, "right"); parts.push(`M${runFrom} ${runY}`); }
      else {
        const el = exitLane.get(l)!; runY = laneY(el.gap, el.index); runFrom = exitX(l);
        parts.push(`M${runFrom} ${edgeY(ba, a, "bottom")}`, `V${runY}`);
      }
      parts.push(`H${sideX}`);
      if (bySide(l.to)) parts.push(`V${midY(bb, b)}`, `H${edgeX(bb, b, "right")}`);
      else { const en = entryLane.get(l)!; parts.push(`V${laneY(en.gap, en.index)}`, `H${entryX(l)}`, `V${edgeY(bb, b, "top")}`); }
      d = parts.join(" ");
      if (l.label) label = labelAt(a.row, (runFrom + sideX) / 2, w, runY - LABEL_GAP);
    } else {
      // Upward: out of the top, along the gap above to the lane, up to the gap below the target, in
      // from the bottom. Drawn, and reported, because a map is meant to flow one way.
      findings.push(`the link \`${l.from}\` → \`${l.to}\` runs upward; a map flows one way, so a link points at a box below its source`);
      const sideX = sideLane(l);
      const parts: string[] = [];
      let runY: number, runFrom: number;
      const ba = byId.get(l.from)!, bb = byId.get(l.to)!;
      if (bySide(l.from)) { runY = midY(ba, a); runFrom = edgeX(ba, a, "right"); parts.push(`M${runFrom} ${runY}`); }
      else {
        const el = exitLane.get(l)!; runY = laneY(el.gap, el.index); runFrom = exitX(l);
        parts.push(`M${runFrom} ${edgeY(ba, a, "top")}`, `V${runY}`);
      }
      parts.push(`H${sideX}`);
      if (bySide(l.to)) parts.push(`V${midY(bb, b)}`, `H${edgeX(bb, b, "right")}`);
      else { const en = entryLane.get(l)!; parts.push(`V${laneY(en.gap, en.index)}`, `H${entryX(l)}`, `V${edgeY(bb, b, "bottom")}`); }
      d = parts.join(" ");
      if (l.label) label = labelAt(a.row - 1, (runFrom + sideX) / 2, w, runY - LABEL_GAP);
    }
    out.push(`  <path class="sds-connector" d="${d}"${dash} marker-end="url(#ar)"/>`);
    horizontals.push(...horzOf(d, pathId));
    if (label && l.label) { verticals.push(...vertsOf(d, pathId)); pending.push({ ...label, w, txt: l.label, path: pathId }); }
    else verticals.push(...vertsOf(d, pathId));
  }

  // THE BOXES GO IN. `placeLabels` has known since it was written that a box blocks as surely as a
  // connector, and this call site never passed them — so a map's labels were slid clear of every
  // line and dropped 2px from a box, which is the one fault the placer's own comment describes.
  // Three call sites, one of them passing the argument: the lesson was learned in `entities` and
  // never carried across.
  out.push(...placeLabels(pending, verticals, margin, width, [...at.values(), ...horizontals]));

  return { svg: svgOf(out, spec.title ?? spec.caption ?? label), findings };
}

/**
 * SYSTEM — the architecture of a thing somebody builds, and the one kind that carries a server
 * module, a web module and an estate package alike, because the three are the same shape: server
 * runs entry → services → repositories → stores, web runs pages → hooks → services → client, an
 * estate runs organization → account → network → resources (decision RD.DEVEX.WORKSPACE.135).
 *
 * WHY IT IS A DRAWER RATHER THAN THREE RULES BOLTED ONTO THE MAP. The kind was specified fully and
 * drawn by hand three times; placing ONE of those figures took more than twenty rounds against the
 * figure check, and every fault was caught by a rule rather than by eye. A person cannot hold the
 * spacing contract, the lane rules, the attachment points and the label clearances in their head at
 * once, and should not have to (developer, 2026-09-21). So the spec names layers, the boxes inside
 * them, the resources outside the boundary with the KIND of each, and the edges — and every
 * coordinate is computed here.
 *
 * Three columns. What points INTO the system sits left, the system sits in the middle, what the
 * system reaches sits right — the same rule `ENTITIES` uses, and for the same reason: with direction
 * deciding the column, every outward edge runs one way and none of them crosses a label.
 */
function drawSystem(spec: Spec): { svg: string; findings: string[] } {
  const findings: string[] = [];
  const layers = spec.layers ?? [];
  const outside = spec.outside ?? [];
  const links = spec.links ?? [];
  if (!layers.length) return { svg: "", findings: ["a `system` figure with no layers; a system is layers inside one boundary"] };

  const inner = layers.flatMap((l) => l.boxes);
  const byId = new Map<string, Box>([...inner, ...outside].map((b) => [b.id, b]));
  const layerOf = new Map<string, number>();
  layers.forEach((l, i) => l.boxes.forEach((b) => layerOf.set(b.id, i)));
  const isOut = new Set(outside.map((b) => b.id));
  for (const l of links) for (const end of [l.from, l.to])
    if (!byId.has(end)) findings.push(`an edge names \`${end}\`, and no box has that id`);
  // RULE 3 — an edge is a call or a flow of data and it carries what flows. An unlabelled line
  // meaning *related* is the one thing this kind refuses, because *related* is what a reader was
  // already assuming. Inside the boundary the layer order says it, so only outward edges are held.
  for (const l of links)
    if (!l.label && (isOut.has(l.from) || isOut.has(l.to)))
      findings.push(`the edge \`${l.from}\` → \`${l.to}\` crosses the boundary with nothing on it; an edge carries what flows`);

  // Which side of the boundary an outside thing belongs on: what points in sits left, what is
  // reached sits right. A thing that does both is drawn on the left, where a loop closing back is
  // easier to follow than a loop opening forward.
  const reaches = new Set(links.filter((l) => !isOut.has(l.from) && isOut.has(l.to)).map((l) => l.to));
  const feeds = new Set(links.filter((l) => isOut.has(l.from)).map((l) => l.from));
  const left = outside.filter((b) => feeds.has(b.id));
  const right = outside.filter((b) => !feeds.has(b.id) && reaches.has(b.id));
  for (const b of outside)
    if (!feeds.has(b.id) && !reaches.has(b.id))
      findings.push(`\`${b.id}\` sits outside the boundary with no edge to it; anything drawn outside is something the system talks to`);

  const shaped = (b: Box & { as?: Resource }): Box => b.shape ? b
    : { ...b, shape: RESOURCE[b.as ?? "service"].shape, off: b.off ?? RESOURCE[b.as ?? "service"].soft };

  const margin = 24, HEAD_MOD = 40, HEAD_LAYER = 36, PAD_IN = 16;
  const innerW = Math.max(200, ...inner.map(mapBoxWidth));
  const layerW = innerW + PAD_IN * 2, modW = layerW + PAD_IN * 2;

  // The left side is itself a little chain — a client knocks on a door, the door calls the entry —
  // so it lays out in columns by how far each box is from the boundary.
  const depthOf = new Map<string, number>(left.map((b) => [b.id, 0]));
  for (let pass = 0; pass < left.length; pass++)
    for (const l of links)
      if (depthOf.has(l.from) && depthOf.has(l.to))
        depthOf.set(l.to, Math.max(depthOf.get(l.to)!, depthOf.get(l.from)! + 1));
  const leftCols: (Box & { as?: Resource })[][] = [];
  for (const b of left) (leftCols[depthOf.get(b.id) ?? 0] ??= []).push(b);
  const leftW = leftCols.map((c) => Math.max(...c.map((b) => mapBoxWidth(shaped(b)))));
  // A gap on the left holds the label of whatever is said across it, for the same reason.
  const leftGap = leftCols.map((col) => {
    const said = links.filter((l) => col.some((b) => b.id === l.from)).map((l) => (l.label ?? "").length * W_NOTE);
    return Math.max(GAP_LINKED, Math.ceil(Math.max(0, ...said)) + 32);
  });
  const leftSpan = leftW.reduce((t, w, i) => t + w + leftGap[i], 0);
  const rightW = right.length ? Math.max(...right.map((b) => mapBoxWidth(shaped(b)))) : 0;

  const modX = margin + leftSpan;
  // One corridor per outward edge, between the boundary and the right-hand column, GAP_APART apart.
  const outEdges = links.filter((l) => !isOut.has(l.from) && reaches.has(l.to));
  // The rail holds one corridor per outward edge AND the widest label said across it, because an
  // outward edge's label sits on the run that lands in the right-hand column.
  const outLabel = Math.max(0, ...outEdges.map((l) => (l.label ?? "").length * W_NOTE));
  const railW = outEdges.length
    ? Math.max(GAP_LINKED + GAP_APART * Math.max(0, outEdges.length - 1) + GAP_LINKED, Math.ceil(outLabel) + 32)
    : GAP_LINKED;
  const rightX = modX + modW + (right.length ? railW : 0);

  // Vertical: the module first, since the outside boxes hang off what they connect to.
  const at = new Map<string, { x: number; y: number; w: number; h: number }>();
  const body: string[] = [];
  const layerAt: { y: number; h: number }[] = [];
  let y = margin + HEAD_MOD;
  for (const layer of layers) {
    const hs = layer.boxes.map(mapBoxHeight);
    const lh = HEAD_LAYER + hs.reduce((t, h) => t + h, 0) + GAP_Y * (hs.length - 1) + PAD_IN;
    layerAt.push({ y, h: lh });
    let by = y + HEAD_LAYER;
    layer.boxes.forEach((b, i) => { at.set(b.id, { x: modX + PAD_IN * 2, y: by, w: innerW, h: hs[i] }); by += hs[i] + GAP_Y; });
    y += lh + GAP_LINKED;
  }
  const modH = y - GAP_LINKED + PAD_IN - margin;

  // RULE 1 — one outermost container, and it is the thing being described.
  body.push(`  <rect class="sds-box sds-absent" x="${modX}" y="${margin}" width="${modW}" height="${modH}" rx="3" fill="none"/>`);
  body.push(`  <text class="sds-title" x="${modX + PAD_IN}" y="${margin + 26}">${esc(spec.title ?? "the system")}</text>`);
  layers.forEach((layer, i) => {
    const { y: ly, h: lh } = layerAt[i];
    body.push(`  <rect class="sds-box sds-absent" x="${modX + PAD_IN}" y="${ly}" width="${layerW}" height="${lh}" rx="3" fill="none"/>`);
    body.push(`  <text class="sds-title" x="${modX + PAD_IN * 2}" y="${ly + 24}">${esc(layer.name)}</text>`);
    for (const b of layer.boxes) { const p = at.get(b.id)!; body.push(mapRect(b, p.x, p.y, p.w, p.h)); }
  });

  // RULE 2 — the layers run one way, the direction a call travels, and the arrow between them says so.
  for (let i = 0; i + 1 < layers.length; i++) {
    const a = layerAt[i], b = layerAt[i + 1];
    body.push(`  <path class="sds-connector" d="M${modX + modW / 2} ${a.y + a.h} V${b.y}" marker-end="url(#ar)"/>`);
  }

  // An outside box is centred on what it connects to, then pushed down to keep the grid's own gap.
  const settle = (boxes: (Box & { as?: Resource })[], want: (b: Box) => number, x: number, w: number) => {
    const rows = boxes.map((b) => ({ b, h: mapBoxHeight(shaped(b)), y: want(b) }))
      .sort((m, n) => m.y - n.y);
    let floor = margin;
    for (const r of rows) {
      r.y = Math.max(r.y - r.h / 2, floor);
      at.set(r.b.id, { x, y: r.y, w, h: r.h });
      body.push(mapRect(shaped(r.b), x, r.y, w, r.h));
      floor = r.y + r.h + GAP_Y;
    }
  };
  const midOf = (id: string) => { const p = at.get(id); return p ? p.y + p.h / 2 : margin + modH / 2; };
  let lx = margin;
  leftCols.forEach((col, i) => {
    settle(col, (b) => {
      const onward = links.filter((l) => l.from === b.id).map((l) => l.to);
      return onward.length ? onward.reduce((t, id) => t + midOf(id), 0) / onward.length : margin + modH / 2;
    }, lx, leftW[i]);
    lx += leftW[i] + leftGap[i];
  });
  settle(right, (b) => {
    const back = links.filter((l) => l.to === b.id).map((l) => l.from);
    return back.length ? back.reduce((t, id) => t + midOf(id), 0) / back.length : margin + modH / 2;
  }, rightX, rightW);

  // The edges. Inward runs land on the left of what they reach; outward runs leave the right of the
  // box that owns them — which layer owns an edge is the claim the figure exists to make checkable.
  const pending: Pending[] = [], verticals: Vert[] = [];

  // A SIDE OFFERS THREE POINTS AND A LONE ARROW TAKES THE MIDDLE, on this kind as on every other.
  // Two edges leaving one box both took its exact middle, so they ran side by side out of the
  // boundary and the check read them as one line 7px thick. A shape's usable side is its own body:
  // a cylinder's begins below its cap.
  const leaving = new Map<string, number>(), arriving = new Map<string, number>();
  for (const l of links) {
    if (!at.has(l.from) || !at.has(l.to)) continue;
    leaving.set(l.from, (leaving.get(l.from) ?? 0) + 1);
    arriving.set(l.to, (arriving.get(l.to) ?? 0) + 1);
  }
  const span = (b: Box, p: { y: number; h: number }) =>
    shapeOf(b) === "store" ? { start: p.y + CAP, len: p.h - CAP } : { start: p.y, len: p.h };

  // TWO CONNECTORS MAY SHARE A POINT ONLY WHERE THEY PART AT ONCE. The map drawer lets a side's
  // points be chosen by alignment, and two links taking the same one is fine there because each
  // drops into a lane of its own within a few pixels. Here they do not: both edges leave the
  // boundary and run RIGHT, so a shared point put them side by side for 88px and the check read
  // them as one line 8px thick. On this kind a side's points are dealt out, one per edge, in the
  // order the things at the other end sit — so the fan is a fan and its lines never touch.
  const seat = new Map<Link, number>();
  for (const [id, group] of new Map<string, Link[]>(
    [...new Set(links.map((l) => l.from))].map((id) => [id, links.filter((l) => l.from === id && at.has(l.to))]))) {
    if (!at.has(id)) continue;
    group.sort((m, n) => at.get(m.to)!.y - at.get(n.to)!.y).forEach((l, i) => seat.set(l, i));
  }
  const arrive = new Map<Link, number>();
  for (const [id, group] of new Map<string, Link[]>(
    [...new Set(links.map((l) => l.to))].map((id) => [id, links.filter((l) => l.to === id && at.has(l.from))]))) {
    if (!at.has(id)) continue;
    group.sort((m, n) => at.get(m.from)!.y - at.get(n.from)!.y).forEach((l, i) => arrive.set(l, i));
  }
  const sideY = (b: Box, p: { y: number; h: number }, n: number, i: number) => {
    const { start, len } = span(b, p);
    const pts = sidePoints(start, len, n);
    return pts[Math.min(i, pts.length - 1)];
  };

  // WHICH CORRIDOR AN OUTWARD EDGE TAKES IS CHOSEN, NOT COUNTED OFF — the same lesson the map
  // drawer learned about lanes, met again one layer out. An edge leaves the boundary at its own seat,
  // runs right to its corridor, drops, and runs right again into its resource. The FIRST run of one
  // edge and the LAST run of another therefore share a stretch of x whenever the second corridor is
  // the further out, and the contract's 24 has to hold between them. Ordering by where the resources
  // sit is the obvious choice and it is wrong: it put a run into the cache 8px under a run out of
  // services. So the order is searched and scored with the figure check's own rule, exhaustively up
  // to six corridors and greedily beyond, and where nothing is clean the best is kept and reported.
  const outward = links.filter((l) => isOut.has(l.to) && !isOut.has(l.from) && at.has(l.to) && at.has(l.from));
  const railOf = new Map<Link, number>();
  outward.forEach((l, i) => railOf.set(l, i));
  if (outward.length > 1) {
    const runsFor = (order: Link[]) => {
      const segs: { k: Link; y: number; x1: number; x2: number }[] = [];
      order.forEach((l, i) => {
        const a = at.get(l.from)!, b = at.get(l.to)!;
        const ba = shaped(byId.get(l.from) as Box & { as?: Resource });
        const bb = shaped(byId.get(l.to) as Box & { as?: Resource });
        const y1 = sideY(ba, a, leaving.get(l.from) ?? 1, seat.get(l) ?? 0);
        const y2 = sideY(bb, b, arriving.get(l.to) ?? 1, arrive.get(l) ?? 0);
        const via = modX + modW + GAP_LINKED + GAP_APART * i;
        if (Math.abs(y1 - y2) < 1) segs.push({ k: l, y: y1, x1: edgeX(ba, { ...a, row: 0 }, "right"), x2: b.x });
        else {
          segs.push({ k: l, y: y1, x1: edgeX(ba, { ...a, row: 0 }, "right"), x2: via });
          segs.push({ k: l, y: y2, x1: via, x2: b.x });
        }
      });
      let bad = 0;
      for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
        if (segs[i].k === segs[j].k) continue;
        const apart = Math.abs(segs[i].y - segs[j].y);
        if (apart < 0.5 || apart >= GAP_APART) continue;
        if (Math.min(segs[i].x2, segs[j].x2) - Math.max(segs[i].x1, segs[j].x1) > LABEL_GAP) bad += 1;
      }
      return bad;
    };
    const permute = <T,>(xs: T[]): T[][] =>
      xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permute([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r]));
    let best = outward, score = runsFor(outward);
    if (score) {
      const tries = outward.length <= 6 ? permute(outward)
        : [[...outward].sort((m, n) => at.get(m.to)!.y - at.get(n.to)!.y),
           [...outward].sort((m, n) => at.get(n.to)!.y - at.get(m.to)!.y)];
      for (const order of tries) {
        const s2 = runsFor(order);
        if (s2 < score) { best = order; score = s2; if (!score) break; }
      }
    }
    best.forEach((l, i) => railOf.set(l, i));
  }

  for (const [pathId, l] of links.entries()) {
    const a = at.get(l.from), b = at.get(l.to);
    if (!a || !b) continue;
    const ba = shaped(byId.get(l.from) as Box & { as?: Resource });
    const bb = shaped(byId.get(l.to) as Box & { as?: Resource });
    const dash = l.dashed ? ' stroke-dasharray="5 4"' : "";
    const w = (l.label ?? "").length * W_NOTE;
    // A CYLINDER'S MIDDLE IS THE MIDDLE OF ITS BODY, not of the box its cap is reserved in — the
    // first draw put the only arrow into a database 7px off its own centre, twice, which is the
    // same half-a-shape mistake the map drawer had in its rows.
    const x1 = edgeX(ba, { ...a, row: 0 }, "right"), x2 = edgeX(bb, { ...b, row: 0 }, "left");
    const y1 = sideY(ba, a, leaving.get(l.from) ?? 1, seat.get(l) ?? 0);
    const y2 = sideY(bb, b, arriving.get(l.to) ?? 1, arrive.get(l) ?? 0);
    let d: string, lx2: number, ly2: number;
    if (isOut.has(l.to) && !isOut.has(l.from)) {
      // Out of the boundary, down its own corridor, into the resource. The label rides the last run,
      // which is the one stretch of the route that is outside every container on the page — a label
      // left inside the module reads as belonging to the module, and the check measures it against
      // the boundary it sits in and calls it an overrun, which it is.
      const via = modX + modW + GAP_LINKED + GAP_APART * (railOf.get(l) ?? 0);
      d = Math.abs(y1 - y2) < 1 ? `M${x1} ${y1} H${x2}` : `M${x1} ${y1} H${via} V${y2} H${x2}`;
      const from = Math.abs(y1 - y2) < 1 ? modX + modW : via;
      lx2 = from + (x2 - from - w) / 2; ly2 = y2 - LABEL_GAP;
    } else {
      // Inward, or between two things outside. The label sits above the run, before the boundary.
      d = Math.abs(y1 - y2) < 1 ? `M${x1} ${y1} H${x2}` : `M${x1} ${y1} V${y2} H${x2}`;
      const stop = isOut.has(l.to) ? x2 : modX;
      lx2 = x1 + (stop - x1 - w) / 2; ly2 = Math.min(y1, y2) - LABEL_GAP;
    }
    body.push(`  <path class="sds-connector" d="${d}"${dash} marker-end="url(#ar)"/>`);
    verticals.push(...vertsOf(d, pathId));
    if (l.label) pending.push({ x: Math.round(lx2), y: Math.round(ly2), w, txt: l.label, path: pathId });
  }
  body.push(...placeLabels(pending, verticals, margin, rightX + rightW + margin));

  return { svg: svgOf(body, spec.title ?? spec.caption ?? "system diagram"), findings };
}

/**
 * SEQUENCE — a process with more than one participant, where WHO SPEAKS TO WHOM is the thing to see.
 * One lifeline per participant, time running down, one arrow per message carrying its own label, and
 * a dashed arrow for a reply (05-artifacts.md § The figures).
 *
 * **A lifeline runs on past the last message.** The developer, on the handoff figure: *for seq flow
 * diagram can we have particpant vertical line grow extra*. A lifeline is the participant's existence
 * through time and the messages are events on it, so one stopping dead at the final arrow says the
 * parties ceased to exist at the last word spoken.
 *
 * A lifeline is marked `lifeline`, which the figure check reads as background rather than as a claim:
 * it is exempt from the shaft, the clearance and the parallel-run rules, and a message landing on one
 * still counts as landing on something, because a connector may end on another connector.
 */
function drawSequence(spec: Spec): { svg: string; findings: string[] } {
  const findings: string[] = [];
  const parts = spec.boxes ?? [];
  const msgs = spec.links ?? [];
  if (!parts.length) return { svg: "", findings: ["a `dg` figure with no boxes"] };

  const idx = new Map(parts.map((b, i) => [b.id, i]));
  for (const m of msgs) for (const end of [m.from, m.to])
    if (!idx.has(end)) findings.push(`a message names \`${end}\`, and no participant has that id`);
  const known = msgs.filter((m) => idx.has(m.from) && idx.has(m.to));
  for (const m of known) if (!m.label)
    findings.push(`the message \`${m.from}\` → \`${m.to}\` carries no label; a sequence shows who says WHAT to whom`);

  const margin = 24;
  // One pitch per message. A label sits LABEL_GAP above its own arrow and owes the same to the arrow
  // above it, so the pitch is that gap twice plus the line itself — the same arithmetic a lane uses.
  const HEAD_H = 44, PITCH = LABEL_H + LABEL_GAP * 3, TAIL = 36, SELF_W = 44, SELF_H = 22;

  const ws = parts.map((b) => Math.max(120, Math.ceil(b.label.length * W_LABEL + PAD_X * 2)));
  // A COLUMN GAP GROWS TO HOLD THE WIDEST THING SAID ACROSS IT. A message's label is centred on its
  // own arrow, so a long one on a short arrow sprawls over the lifelines either side of it.
  const gaps = parts.slice(0, -1).map((_, i) => {
    const across = known.filter((m) => {
      const a = idx.get(m.from)!, b = idx.get(m.to)!;
      return Math.min(a, b) === i && Math.max(a, b) === i + 1;
    });
    const widest = Math.max(0, ...across.map((m) => (m.label ?? "").length * W_NOTE));
    return Math.max(GAP_COL, Math.ceil(widest + 24 - (ws[i] + ws[i + 1]) / 2));
  });

  const out: string[] = [];
  const xs: number[] = [];
  let x = margin;
  parts.forEach((b, i) => {
    xs.push(x + ws[i] / 2);
    out.push(`  <rect class="${boxClass(b)}" x="${x}" y="${margin}" width="${ws[i]}" height="${HEAD_H}" rx="3"/>`);
    out.push(centred("sds-label",b.label, x + ws[i] / 2, margin + HEAD_H / 2 + 4));
    x += ws[i] + (gaps[i] ?? 0);
  });

  let y = margin + HEAD_H + PITCH;
  for (const m of known) {
    const a = xs[idx.get(m.from)!], b = xs[idx.get(m.to)!];
    const dash = m.dashed ? ' stroke-dasharray="5 4"' : "";
    if (m.from === m.to) {
      // A PARTICIPANT SPEAKING TO ITSELF is a loop off its own lifeline and back, because an arrow
      // from a line to the same line has nowhere to be and no length a reader could see.
      out.push(`  <path class="sds-connector" d="M${a} ${y} H${a + SELF_W} V${y + SELF_H} H${a}"${dash} marker-end="url(#ar)"/>`);
      if (m.label) out.push(`  <text class="sds-note" x="${Math.round(a + SELF_W + LABEL_GAP)}" y="${y + SELF_H / 2 + 4}">${esc(m.label)}</text>`);
      y += SELF_H + PITCH;
      continue;
    }
    out.push(`  <path class="sds-connector" d="M${a} ${y} H${b}"${dash} marker-end="url(#ar)"/>`);
    if (m.label) out.push(centred("sds-note",m.label, (a + b) / 2, y - LABEL_GAP));
    y += PITCH;
  }

  // The lifelines are drawn last so they run the full height, and they run on past the last message.
  const foot = y - PITCH + TAIL;
  parts.forEach((_, i) => out.push(
    `  <path class="sds-connector sds-lifeline" d="M${xs[i]} ${margin + HEAD_H} V${foot}" stroke-dasharray="3 5"/>`));

  return { svg: svgOf(out, spec.title ?? spec.caption ?? "sequence diagram"), findings };
}

/**
 * FLOWCHART — the path somebody or something takes, and where it turns. It is laid out on the map's
 * own geometry, because rows-by-depth is what a flowchart already is; what the kind adds is the
 * standard shape vocabulary and the rule that the path runs DOWN the page.
 *
 * A shape is inferred only where the author has not named one, and only for the two a flowchart
 * cannot be read without: the ends of the path are terminators, and a box with more than one way out
 * is a decision. Everything else stays a process, which is what it usually is. Naming `shape` in the
 * spec always wins — inference is a convenience, never an opinion the author cannot overrule.
 */
function drawFlowchart(spec: Spec): { svg: string; findings: string[] } {
  const boxes = spec.boxes ?? [];
  const links = spec.links ?? [];
  const outs = new Map<string, number>(), ins = new Map<string, number>();
  for (const l of links) { outs.set(l.from, (outs.get(l.from) ?? 0) + 1); ins.set(l.to, (ins.get(l.to) ?? 0) + 1); }

  const shaped: Box[] = boxes.map((b) => {
    if (b.shape) return b;
    if (!ins.get(b.id) || !outs.get(b.id)) return { ...b, shape: "terminator" as Shape };
    if ((outs.get(b.id) ?? 0) > 1) return { ...b, shape: "decision" as Shape };
    return b;
  });
  const shapeById = new Map(shaped.map((b) => [b.id, shapeOf(b)]));

  const { svg, findings } = drawMap({ ...spec, boxes: shaped }, { downward: true });
  // A DIAMOND WITH AN UNANSWERED BRANCH is the one fault this kind can have that a map cannot. The
  // chapter says a decision carries each branch's answer, and a reader meeting two unlabelled arrows
  // out of a diamond has to guess which one is yes — which is the question the diamond was asked.
  for (const l of links)
    if (shapeById.get(l.from) === "decision" && !l.label)
      findings.push(`the branch \`${l.from}\` → \`${l.to}\` leaves a decision with no answer on it; each branch out of a diamond carries its own answer`);
  return { svg, findings };
}

/**
 * SKELETON — a mock of a layout, drawn under the rule that holds for every other kind: nothing by
 * eye, every box measured from its own text. No connectors: position is the whole claim, so this
 * drawer emits none.
 *
 * A SKELETON READS ITS OWN MEASURES (05-artifacts.md § `SKELETON`, § The skeleton's own guidelines).
 * Every number below is a copy of a grid number or a number of its own; none is shared with another
 * kind, so a change here never moves a MAP, a FLOWCHART, a SYSTEM or an ENTITIES figure.
 *
 * Marks, never tints: a background is a surface (`sds-skel-surface`), a solid line is a border the block
 * has (`sds-skel-border`), a dotted line marks a component, a part or a slot (`sds-skel-guide`), a thin
 * line is a control (`sds-skel-control`), and a soft bar stands in for content (`sds-skel-bar`). A drawing
 * carries no colour of its own: every mark is a class of the shared stylesheet.
 */
const SKEL_PAD = 16, SKEL_GAP = 24, SKEL_LABEL_H = 12, SKEL_LABEL_GAP = 8;
const SKEL_W_LABEL = 7, SKEL_W_NOTE = 6.4, SKEL_W_TITLE = 7.6;
const SKEL_H_ONE = 44, SKEL_H_TWO = 64;
/** A control's height at each size step, from the library's own scale. A frame's `size` sets it for everything inside; the default is `SM`. */
const SKEL_CONTROL_H: Record<string, number> = { XS: 28, SM: 32, MD: 36, LG: 40, XL: 44 };
const SKEL_DEFAULT_H = SKEL_CONTROL_H.SM;
/** The control height inside `frame`: its own `size`, or the one that holds it. */
const skelSizeH = (frame: SkeletonFrame, inherited: number): number =>
  frame.size !== undefined && SKEL_CONTROL_H[frame.size] !== undefined ? SKEL_CONTROL_H[frame.size] : inherited;
/** The corner of a rounded frame; a square one has none. */
const SKEL_ROUND = 8;
/** A tag's line: the note measure, its own clear air below it before the words or bars it heads. */
const SKEL_TAG_H = SKEL_LABEL_H + SKEL_LABEL_GAP;
/** One placeholder bar and the gap under it; a heading bar is a little taller. */
const SKEL_BAR = 6, SKEL_HEAD_BAR = 8, SKEL_BAR_STEP = SKEL_BAR + SKEL_LABEL_GAP;
/** Controls of one packed group (a pager, a layout switch) sit this far apart. */
const SKEL_PACK_GAP = 4;
/** How many named boundaries may sit inside one another before the drawing is split. */
const SKEL_NEST_MAX = 2;
const SKEL_LINES_W = 160, SKEL_FIELD_W = 160, SKEL_CARD_H = 64;
const WIDTH_FRACTIONS: Record<string, number> = { "1/4": 1 / 4, "1/3": 1 / 3, "1/2": 1 / 2, "2/3": 2 / 3, "3/4": 3 / 4 };
// THE OUTER FRAME TAKES THE GRID'S CONTENT WIDTH (05-artifacts.md § The grid), as the hand-drawn
// skeletons did: a layout is a screen, and a screen drawn 300 wide reads as a widget.
const SKEL_CANVAS = 1052;
// A FLOOR RATHER THAN A ZERO, for the degenerate case every row's width is left to a `fill` or a
// fraction: nothing would set the frame's own width, and 0 is not a figure.
const SKEL_MIN_W = 200;

const SKEL_LOOKS = ["raised", "bordered", "flat"];
const SKEL_CONTROLS = ["button", "field", "select", "checkbox", "pager"];
const SKEL_STANDINS = ["rows", "cards", "field", "list"];
const SKEL_ICONS = ["close", "add", "menu", "search", "more", "previous", "next", "select", "checkbox", "bell", "person", "default"];

type SkelKind = "frame" | "spacer" | "slot" | "standin" | "control" | "icon" | "place" | "plain" | "note";
/** Which shape an item is; `null` is the thing the spec refuses. A tag with no other claim is a named place. */
const skelKind = (it: SkeletonItem): SkelKind | null =>
  it.frame ? "frame" : it.spacer ? "spacer" : it.slot !== undefined ? "slot"
    : it.standin !== undefined || it.lines !== undefined ? "standin"
    : it.control !== undefined ? "control" : it.icon !== undefined ? "icon"
    : it.tag !== undefined ? "place" : it.text !== undefined ? "plain" : it.note !== undefined ? "note" : null;

/** `tone` as a colour and `em` on a word are not read: the finding names the field that replaces each. */
function skelOldFields(holder: SkeletonItem | SkeletonFrame, findings: string[]): void {
  const said = (message: string) => { if (!findings.includes(message)) findings.push(message); };
  const old = holder as { tone?: string; em?: boolean; off?: boolean; warn?: boolean };
  if (old.tone !== undefined) said("a skeleton no longer reads `tone`; a place is told apart by its mark, so give a frame a `look` of `raised`, `bordered` or `flat`");
  if (old.em !== undefined) said("a skeleton no longer reads `em`; a title is plain `text`, and the main action is a `control` with `main: true`");
  if (old.off !== undefined) said("a skeleton no longer reads `off`; muted words are a `note`");
  if (old.warn !== undefined) said("a skeleton no longer reads `warn`; a skeleton shows an arrangement, so say it in a `note`");
}

const skelWordW = (s: string) => Math.ceil(s.length * SKEL_W_LABEL);
const skelTextW = (s: string) => Math.ceil(s.length * SKEL_W_LABEL + SKEL_PAD * 2);
const skelTagW = (s: string) => Math.ceil(s.length * SKEL_W_NOTE + SKEL_PAD * 2);
const skelPagerParts = (it: SkeletonItem) => (it.text ?? "‹ 1 2 3 ›").split(/\s+/).filter(Boolean);
const skelPartW = (part: string, h: number) => Math.max(h, Math.ceil(part.length * SKEL_W_LABEL + SKEL_PAD));
const skelIconOnly = (it: SkeletonItem) => skelKind(it) === "icon" && it.text === undefined;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** An item's own width where it has one; a `fill` item or a frame takes what the row has left. */
function skelFixedWidth(it: SkeletonItem, h: number): number {
  switch (skelKind(it)) {
    case "plain": return skelWordW(it.text!);
    case "note": return skelWordW(it.note!);
    case "place": return it.fill ? 0 : Math.max(it.text !== undefined ? skelTextW(it.text) : 0, skelTagW(it.tag!), SKEL_PAD * 2);
    case "slot": return it.fill ? 0 : Math.max(skelTagW(it.slot!), SKEL_PAD * 2);
    case "standin": return it.fill ? 0 : SKEL_LINES_W;
    case "icon": return h + (it.text !== undefined ? SKEL_LABEL_GAP + skelWordW(it.text) : 0);
    case "control": {
      const text = it.text ?? "";
      if (it.control === "pager") {
        const parts = skelPagerParts(it);
        return parts.reduce((t, p) => t + skelPartW(p, h), 0) + SKEL_PACK_GAP * (parts.length - 1);
      }
      if (it.control === "checkbox") return h + (text ? SKEL_LABEL_GAP + skelWordW(text) : 0);
      if (it.fill) return 0;
      if (it.control === "field") return Math.max(skelTextW(text), SKEL_FIELD_W);
      if (it.control === "select") return skelTextW(text) + SKEL_PAD + 8;
      return Math.max(skelTextW(text), SKEL_PAD * 2);
    }
    default: return 0; // a frame never sets the row's shared width — it takes a fraction of it, or what is left
  }
}

/** An item's own height: its slot, its tag's line above its words, its bars, or the rows it asks for. */
function skelItemHeight(it: SkeletonItem, slot: number): number {
  const kind = skelKind(it);
  if (kind === "frame") return skelFrameHeight(it.frame!, slot);
  let h = slot;
  if (kind === "place" && it.text !== undefined) h = slot + SKEL_TAG_H;
  if (kind === "standin") {
    const count = Math.max(1, it.lines ?? 3);
    if (it.standin === "cards") h = SKEL_CARD_H;
    else if (it.standin === "field") h = SKEL_HEAD_BAR + SKEL_LABEL_GAP + slot;
    else h = SKEL_PAD + count * SKEL_BAR_STEP - SKEL_LABEL_GAP + SKEL_PAD;
  }
  return Math.max(h, (it.height ?? 0) * slot);
}
/** A row's height, independent of width: the tallest item it holds, or that plus the framed pad. */
function skelRowHeight(row: SkeletonRow, ctl: number): number {
  const items = row.items.length ? row.items : [{}];
  const h = Math.max(...items.map((it) => skelItemHeight(it, ctl)));
  return row.framed ? h + SKEL_GAP * 2 : h;
}
/** A frame's height, independent of width: its header, its rows stacked with the gap, its own pad. */
function skelFrameHeight(frame: SkeletonFrame, inherited: number): number {
  const ctl = skelSizeH(frame, inherited);
  const rows = frame.rows ?? [];
  // A CONTAINER'S PARTS STAND WITH NO GAP AND NO PADDING OF THE CONTAINER'S OWN: each part keeps its own.
  if (frame.frames !== undefined)
    return Math.max(skelHead(frame) + skelParts(frame).reduce((t, p) => t + skelFrameHeight(p, ctl), 0), (frame.height ?? 0) * ctl);
  const body = rows.reduce((t, r) => t + skelRowHeight(r, ctl), 0) + SKEL_GAP * Math.max(0, rows.length - 1);
  return Math.max(skelHead(frame) + body + SKEL_PAD, (frame.height ?? 0) * ctl);
}
/** The parts of a container: the one frame each of its rows holds. */
const skelParts = (frame: SkeletonFrame): SkeletonFrame[] =>
  (frame.rows ?? []).flatMap((r) => (r.items.length === 1 && r.items[0].frame ? [r.items[0].frame] : []));
/** A frame's header: its tag's line, then its title and note. A frame with neither title nor tag
 *  starts its rows at its own padding. */
function skelHead(frame: SkeletonFrame): number {
  const tag = frame.tag ? SKEL_TAG_H + SKEL_LABEL_GAP : 0;
  if (!frame.label) return Math.max(tag, SKEL_PAD);
  return tag + (frame.note ? SKEL_H_TWO : SKEL_H_ONE);
}
/** The left column every row of a frame shares, sized to the widest row label — or none at all. */
function skelLabelCol(frame: SkeletonFrame): number {
  const labels = (frame.rows ?? []).map((r) => r.label).filter((l): l is string => !!l);
  return labels.length ? Math.ceil(Math.max(...labels.map((l) => l.length * SKEL_W_LABEL))) : 0;
}
/** The gap after item `i` of a row: a packed group (icon after icon, pager part after part) sits close. */
const skelGapAfter = (row: SkeletonRow, i: number) =>
  skelIconOnly(row.items[i]) && row.items[i + 1] && skelIconOnly(row.items[i + 1]) ? SKEL_PACK_GAP : SKEL_GAP;
const skelRowGaps = (row: SkeletonRow) =>
  row.items.slice(0, -1).reduce((t, _, i) => t + skelGapAfter(row, i), 0);
/** A row's own minimum width: its fixed items, the gaps between them, and a framed row's own pad. */
function skelRowMinWidth(row: SkeletonRow, ctl: number): number {
  // A FILL OR A FRAME STILL NEEDS ROOM FOR WHAT IT HOLDS.
  const need = (it: SkeletonItem): number => {
    const kind = skelKind(it);
    if (kind === "spacer") return 0;
    if (kind === "frame") {
      const own = skelFrameMinWidth(it.frame!, ctl);
      const frac = it.frame!.width ? WIDTH_FRACTIONS[it.frame!.width] : undefined;
      return frac ? Math.ceil(own / frac) : own;
    }
    if (kind === "standin" || kind === "slot") return Math.max(kind === "slot" ? skelTagW(it.slot!) : SKEL_LINES_W, SKEL_PAD * 2);
    if (kind === "place") return Math.max(skelTagW(it.tag!), it.text !== undefined ? skelTextW(it.text) : 0, SKEL_PAD * 2);
    if (kind === "control" && it.fill) return it.control === "field" ? SKEL_FIELD_W : skelTextW(it.text ?? "");
    return skelFixedWidth(it, ctl);
  };
  const fixed = row.items.reduce((t, it) => t + need(it), 0);
  return fixed + skelRowGaps(row) + (row.framed ? SKEL_GAP * 2 : 0);
}
/** A frame's own minimum width: its padding, its label column, and its widest row's need. */
function skelFrameMinWidth(frame: SkeletonFrame, inherited: number): number {
  const ctl = skelSizeH(frame, inherited);
  const labelCol = skelLabelCol(frame);
  const head = Math.max(frame.label ? Math.ceil(frame.label.length * SKEL_W_TITLE) : 0, frame.tag ? skelTagW(frame.tag) - SKEL_PAD : 0,
    frame.label && frame.note ? Math.ceil(frame.note.length * SKEL_W_NOTE) : 0);
  if (frame.frames !== undefined) return Math.max(head + SKEL_PAD * 2, ...skelParts(frame).map((p) => skelFrameMinWidth(p, ctl)));
  const rows = Math.max(0, ...(frame.rows ?? []).map((r) => skelRowMinWidth(r, ctl)));
  return SKEL_PAD * 2 + Math.max(head, (labelCol ? labelCol + SKEL_GAP : 0) + rows);
}

/** Whether an item takes the rest of its row's width. */
const skelFlexes = (it: SkeletonItem): boolean => {
  const kind = skelKind(it);
  if (kind === "spacer") return true;
  if (kind === "frame") return it.frame!.width === undefined || WIDTH_FRACTIONS[it.frame!.width] === undefined;
  return !!it.fill && kind !== "plain" && kind !== "note" && kind !== "icon";
};

/**
 * Each item's width within a row of `available` pixels. An item's own width and a frame's fraction of
 * `available` are fixed; a `fill` item, a spacer or a frame named with no fraction takes an equal share of
 * what the fixed items and the row's own gaps leave over. An item with no shape a skeleton has, and a
 * `width` naming no fraction the spec has, are findings — the drawer still places something, rather than
 * leaving a gap nobody can explain.
 */
function skelRowWidths(row: SkeletonRow, available: number, ctl: number, findings: string[]): number[] {
  const n = row.items.length;
  const widths: number[] = new Array(n).fill(0);
  const flex: number[] = [];
  let fixed = 0;
  row.items.forEach((it, i) => {
    const kind = skelKind(it);
    if (kind === null) { findings.push("an item that is none of `text`, `note`, `slot`, `icon`, `control`, `standin`, `spacer` or `frame`"); return; }
    if (kind === "frame") {
      const w = it.frame!.width;
      if (w !== undefined && WIDTH_FRACTIONS[w] === undefined)
        findings.push(`a frame's \`width\` is \`${w}\`, and a skeleton takes one of ${Object.keys(WIDTH_FRACTIONS).join(" · ")}, or none for what is left`);
      if (w !== undefined && WIDTH_FRACTIONS[w] !== undefined) { widths[i] = Math.round(available * WIDTH_FRACTIONS[w]); fixed += widths[i]; return; }
      flex.push(i); return;
    }
    // A SLOT OR A PART ALONE IN ITS ROW IS THE ROW'S: it takes the row's width, as it takes the column's height with `fill`.
    if (skelFlexes(it) || (n === 1 && (kind === "slot" || kind === "place"))) { flex.push(i); return; }
    widths[i] = skelFixedWidth(it, ctl); fixed += widths[i];
  });
  const left = Math.max(0, available - fixed - skelRowGaps(row));
  const share = flex.length ? Math.round(left / flex.length) : 0;
  for (const i of flex) widths[i] = share;
  return widths;
}

const skelRect = (cls: string, x: number, y: number, w: number, h: number, rx = 3) =>
  `  <rect class="${cls}" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${rx}"/>`;
const skelPath = (cls: string, points: [number, number][][]) =>
  `  <path class="${cls}" d="${points.map((line) => line.map(([px, py], i) => `${i ? "L" : "M"}${r2(px)} ${r2(py)}`).join(" ")).join(" ")}"/>`;

/** A frame's marks. The outer frame is the drawing's own edge; a part is a surface, a border or neither, and a part with no border of its own shows the dotted boundary. */
function skelMarks(look: string | undefined, x: number, y: number, w: number, h: number): string[] {
  if (look === "bordered") return [skelRect("sds-skel-border", x, y, w, h)];
  if (look === "flat") return [skelRect("sds-skel-guide", x, y, w, h)];
  return [skelRect("sds-skel-surface", x, y, w, h), skelRect("sds-skel-guide", x, y, w, h)];
}

/**
 * An icon is a few plain line shapes, drawn about the centre `(cx, cy)` in a box of `g` pixels. Every
 * point is written out in absolute numbers, so no transform hides a shape from the drawing's own fit.
 */
function skelGlyph(name: string, cx: number, cy: number, g: number): string[] {
  const u = g / 24, X = (v: number) => cx - g / 2 + v * u, Y = (v: number) => cy - g / 2 + v * u;
  const line = (...pts: number[][]): [number, number][] => pts.map(([a, b]) => [X(a), Y(b)]);
  const stroke = (...lines: [number, number][][]) => skelPath("sds-skel-glyph", lines);
  const solid = (...lines: [number, number][][]) => skelPath("sds-skel-glyph sds-skel-glyph-solid", lines);
  const dot = (a: number, b: number, rad: number) => `  <circle class="sds-skel-glyph sds-skel-glyph-solid" cx="${r2(X(a))}" cy="${r2(Y(b))}" r="${r2(rad * u)}"/>`;
  switch (name) {
    case "close": return [stroke(line([6, 6], [18, 18]), line([18, 6], [6, 18]))];
    case "add": return [stroke(line([12, 5], [12, 19]), line([5, 12], [19, 12]))];
    case "menu": return [stroke(line([5, 7], [19, 7]), line([5, 12], [19, 12]), line([5, 17], [19, 17]))];
    case "search": return [`  <circle class="sds-skel-glyph" cx="${r2(X(10))}" cy="${r2(Y(10))}" r="${r2(6 * u)}"/>`, stroke(line([15, 15], [20, 20]))];
    case "more": return [dot(5, 12, 1.6), dot(12, 12, 1.6), dot(19, 12, 1.6)];
    case "previous": return [stroke(line([14, 5], [7, 12], [14, 19]))];
    case "next": return [stroke(line([10, 5], [17, 12], [10, 19]))];
    case "select": return [stroke(line([6, 9], [12, 15], [18, 9]))];
    case "checkbox": return [stroke(line([8, 12], [11, 15], [16, 8]))];
    case "bell": return [solid(line([12, 4], [16, 7], [17, 12], [19.5, 16], [4.5, 16], [7, 12], [8, 7], [12, 4])), dot(12, 19, 1.6)];
    case "person": return [dot(12, 8, 4), solid(line([4, 20], [6, 15], [12, 13], [18, 15], [20, 20], [4, 20]))];
    default: return [dot(12, 12, 2)];
  }
}

/** One item that is a leaf (a control, an icon, a slot, plain words, a stand-in), drawn at `(ix, iy)`, `iw` wide and `ih` tall. */
function skelDrawLeaf(it: SkeletonItem, kind: SkelKind, ix: number, iy: number, iw: number, ih: number, boxH: number, h: number, findings: string[], out: string[]): void {
  const mid = iy + ih / 2;
  const baseline = Math.round(mid + 4);
  if (kind === "plain") { out.push(`  <text class="sds-label" x="${ix}" y="${baseline}">${esc(it.text!)}</text>`); return; }
  if (kind === "note") { out.push(`  <text class="sds-code" x="${ix}" y="${baseline}">${esc(it.note!)}</text>`); return; }
  if (kind === "slot") {
    out.push(...skelMarks(undefined, ix, iy, iw, ih));
    out.push(`  <text class="sds-note" x="${ix + SKEL_LABEL_GAP}" y="${iy + SKEL_LABEL_H + 4}">${esc(it.slot!)}</text>`);
    return;
  }
  if (kind === "place") {
    out.push(...skelMarks(undefined, ix, iy, iw, ih));
    out.push(`  <text class="sds-note" x="${ix + SKEL_LABEL_GAP}" y="${iy + SKEL_LABEL_H + 4}">${esc(it.tag!)}</text>`);
    if (it.text !== undefined) out.push(`  <text class="sds-code" x="${ix + SKEL_PAD}" y="${Math.round(iy + SKEL_TAG_H + (ih - SKEL_TAG_H) / 2 + 4)}">${esc(it.text)}</text>`);
    return;
  }
  if (kind === "icon") {
    if (!SKEL_ICONS.includes(it.icon!)) findings.push(`an icon is \`${it.icon}\`, and a skeleton draws ${SKEL_ICONS.join(" · ")}; \`default\` is drawn where none fits`);
    out.push(skelRect("sds-skel-control", ix, iy, h, h));
    out.push(...skelGlyph(it.icon!, ix + h / 2, mid, Math.round(h / 2)));
    if (it.text !== undefined) out.push(`  <text class="sds-code" x="${ix + h + SKEL_LABEL_GAP}" y="${baseline}">${esc(it.text)}</text>`);
    return;
  }
  if (kind === "control") {
    const text = it.text ?? "";
    if (!SKEL_CONTROLS.includes(it.control!)) findings.push(`a control is \`${it.control}\`, and a skeleton draws ${SKEL_CONTROLS.join(" · ")}`);
    if (it.tag !== undefined) findings.push(`a control carries no tag: \`${it.tag}\` names a component, a part or a slot, and a control is told by its sample value`);
    if (text.includes("\n")) findings.push("a control stands on one line, and its sample value runs over more");
    const cls = "sds-skel-control" + (it.main ? " sds-skel-main" : "");
    if (it.control === "pager") {
      let px = ix;
      for (const part of skelPagerParts(it)) {
        const pw = skelPartW(part, h);
        out.push(skelRect(cls, px, iy, pw, h));
        if (part === "‹" || part === "›") out.push(...skelGlyph(part === "‹" ? "previous" : "next", px + pw / 2, mid, Math.round(h / 2)));
        else out.push(`  <text class="sds-code" x="${r2(px + (pw - part.length * SKEL_W_LABEL) / 2)}" y="${baseline}">${esc(part)}</text>`);
        px += pw + SKEL_PACK_GAP;
      }
      return;
    }
    if (it.control === "checkbox") {
      out.push(skelRect(cls, ix, iy, h, h));
      out.push(...skelGlyph("checkbox", ix + h / 2, mid, Math.round(h / 2)));
      if (text) out.push(`  <text class="sds-code" x="${ix + h + SKEL_LABEL_GAP}" y="${baseline}">${esc(text)}</text>`);
      return;
    }
    out.push(skelRect(cls, ix, iy, iw, h));
    if (text) out.push(`  <text class="sds-code" x="${ix + SKEL_PAD}" y="${baseline}">${esc(text)}</text>`);
    if (it.control === "select") out.push(...skelGlyph("select", ix + iw - SKEL_PAD - 4, mid, Math.round(h / 2)));
    return;
  }
  // a stand-in: bars with no box around them
  const count = Math.max(1, it.lines ?? 3);
  const kindOf = it.standin ?? "rows";
  if (!SKEL_STANDINS.includes(kindOf)) findings.push(`a stand-in is \`${kindOf}\`, and a skeleton draws ${SKEL_STANDINS.join(" · ")}`);
  const bar = (x: number, y: number, w: number, hh: number) => skelRect("sds-skel-bar", x, y, w, hh);
  if (kindOf === "cards") {
    const cardW = (iw - SKEL_GAP * (count - 1)) / count;
    for (let c = 0; c < count; c++) {
      const cx = ix + c * (cardW + SKEL_GAP);
      out.push(skelRect("sds-skel-control", cx, iy, cardW, SKEL_CARD_H));
      out.push(bar(cx + SKEL_PAD, iy + SKEL_PAD, (cardW - SKEL_PAD * 2) * 0.5, SKEL_HEAD_BAR));
      out.push(bar(cx + SKEL_PAD, iy + SKEL_PAD + SKEL_BAR_STEP + 4, cardW - SKEL_PAD * 2, SKEL_BAR));
      out.push(bar(cx + SKEL_PAD, iy + SKEL_PAD + SKEL_BAR_STEP * 2 + 4, (cardW - SKEL_PAD * 2) * 0.7, SKEL_BAR));
    }
    return;
  }
  if (kindOf === "field") {
    out.push(bar(ix, iy, Math.min(iw, SKEL_FIELD_W) * 0.4, SKEL_HEAD_BAR));
    out.push(skelRect("sds-skel-control", ix, iy + SKEL_HEAD_BAR + SKEL_LABEL_GAP, iw, h));
    return;
  }
  const heads = new Set(it.headings ?? []);
  let by = iy + SKEL_PAD;
  for (let b = 0; b < count; b++) {
    const head = heads.has(b);
    if (kindOf === "list") {
      out.push(bar(ix + SKEL_PAD, by, SKEL_BAR, SKEL_BAR));
      out.push(bar(ix + SKEL_PAD + SKEL_BAR + SKEL_LABEL_GAP, by, (iw - SKEL_PAD * 2 - SKEL_BAR - SKEL_LABEL_GAP) * (head ? 0.42 : 0.7), head ? SKEL_HEAD_BAR : SKEL_BAR));
    } else out.push(bar(ix + SKEL_PAD, by, (iw - SKEL_PAD * 2) * (head ? 0.42 : 1), head ? SKEL_HEAD_BAR : SKEL_BAR));
    by += SKEL_BAR_STEP;
  }
}

/** Whether a row's one item takes the height left in its column: a frame, a slot or a part, with `fill`. */
const skelGrows = (row: SkeletonRow): boolean => {
  if (row.items.length !== 1) return false;
  const it = row.items[0], kind = skelKind(it);
  return kind === "frame" ? !!it.frame!.fill : (kind === "slot" || kind === "place") && !!it.fill;
};

/** What a container's own props say, checked: each one a reader maps to one of the four. */
function skelContainerFindings(frame: SkeletonFrame, parts: SkeletonFrame[], findings: string[]): void {
  const names = parts.map((p) => p.tag);
  if (!Array.isArray(frame.frames)) { findings.push("`frames` is the list of the parts that share a frame, by their `tag`"); return; }
  for (const named of frame.frames)
    if (!names.includes(named)) findings.push(`\`frames\` names \`${named}\`, and no part of this container has that \`tag\``);
  if (frame.frames.length && !frame.raised && !frame.bordered)
    findings.push("`frames` lists parts, and the frame is neither `raised` nor `bordered`; a part not in a frame is flat, so leave it out of `frames`");
  if ((frame.rows ?? []).some((r) => !(r.items.length === 1 && r.items[0].frame)))
    findings.push("a container's rows each hold one part, a `frame` with a `tag`");
  for (const part of parts) {
    if (!part.tag) findings.push("a part of a container carries a name; give the part its `tag`");
    if (part.look !== undefined) findings.push(`the part \`${part.tag ?? ""}\` takes its frame from the container's \`frames\`; leave \`look\` off a part`);
  }
}

/** One frame, drawn at `(x, y)`. `forcedW` is given for a frame nested in a row; the outer frame
 *  sizes itself from its own rows instead. `named` counts the named boundaries that hold this one.
 *  `inherited` is the control height of the frame that holds this one, and a `bare` part leaves its
 *  marks to the container that holds it. */
function skelDrawFrame(frame: SkeletonFrame, x: number, y: number, forcedW: number | undefined, findings: string[], out: string[], forcedH?: number, named = 0, inherited = SKEL_DEFAULT_H, bare = false): void {
  const root = forcedW === undefined;
  skelOldFields(frame, findings);
  if (frame.size !== undefined && SKEL_CONTROL_H[frame.size] === undefined)
    findings.push(`a \`size\` is \`${frame.size}\`, and a skeleton takes ${Object.keys(SKEL_CONTROL_H).join(" · ")}`);
  const ctl = skelSizeH(frame, inherited);
  const isContainer = frame.frames !== undefined;
  const rows = frame.rows ?? [];
  const parts = skelParts(frame);
  if (isContainer) skelContainerFindings(frame, parts, findings);
  else if (frame.raised !== undefined || frame.bordered !== undefined || frame.rounded !== undefined)
    findings.push("`raised`, `bordered` and `rounded` belong to a frame with `frames`; a frame that stands alone takes `look`");
  const labelCol = skelLabelCol(frame);
  const rowContentW = forcedW !== undefined
    ? Math.max(0, forcedW - SKEL_PAD * 2 - (labelCol ? labelCol + SKEL_GAP : 0))
    : Math.max(SKEL_MIN_W, SKEL_CANVAS - SKEL_PAD * 2 - (labelCol ? labelCol + SKEL_GAP : 0), ...rows.map((r) => skelRowMinWidth(r, ctl)));
  const w = forcedW !== undefined ? forcedW : isContainer ? Math.max(SKEL_CANVAS - SKEL_PAD * 2, skelFrameMinWidth(frame, inherited)) : SKEL_PAD * 2 + (labelCol ? labelCol + SKEL_GAP : 0) + rowContentW;
  // A FRAME IN A ROW STANDS AS TALL AS THE ROW, so a rail and the main area beside it end on one line.
  const natural = skelFrameHeight(frame, inherited);
  const h = Math.max(natural, forcedH ?? 0);

  if (frame.look !== undefined && !SKEL_LOOKS.includes(frame.look))
    findings.push(`a frame's \`look\` is \`${frame.look}\`, and a frame takes ${SKEL_LOOKS.join(" · ")}`);
  if (frame.look !== undefined && !frame.tag && !frame.label && !root)
    findings.push(`a boundary with a \`look\` of \`${frame.look}\` carries no name; give the part its \`tag\``);
  if (frame.tag && named >= SKEL_NEST_MAX)
    findings.push(`the boundary \`${frame.tag}\` sits inside ${named} named boundaries, and a skeleton nests ${SKEL_NEST_MAX} at most; draw \`${frame.tag}\` as a skeleton of its own`);
  // A CONTAINER HAS NO BOX OF ITS OWN: its frames are drawn behind its parts, below.
  if (root) out.push(skelRect("sds-box", x, y, w, h));
  else if (!bare && !isContainer) out.push(...skelMarks(frame.look, x, y, w, h));
  const tagH = frame.tag ? SKEL_TAG_H + SKEL_LABEL_GAP : 0;
  if (frame.tag) out.push(`  <text class="sds-note" x="${x + SKEL_LABEL_GAP}" y="${y + SKEL_LABEL_H + 4}">${esc(frame.tag)}</text>`);
  if (frame.label) out.push(`  <text class="sds-title" x="${x + SKEL_PAD}" y="${y + tagH + 26}">${esc(frame.label)}</text>`);
  if (frame.label && frame.note) out.push(`  <text class="sds-code" x="${x + SKEL_PAD}" y="${y + tagH + 45}">${esc(frame.note)}</text>`);

  // A PART THAT TAKES THE HEIGHT LEFT: where the frame stands taller than its rows need, the rows whose
  // one item is a `fill` frame, slot or part share what is over.
  const slack = Math.max(0, h - natural);
  const growers = rows.map((row, i) => (skelGrows(row) ? i : -1)).filter((i) => i >= 0);

  if (isContainer) {
    // THE PARTS STAND WITH NO GAP. Those named in `frames` and next to each other share one frame.
    const heights = parts.map((p) => skelFrameHeight(p, ctl));
    const partGrowers = parts.map((p, i) => (p.fill ? i : -1)).filter((i) => i >= 0);
    if (partGrowers.length && slack > 0) for (const i of partGrowers) heights[i] += slack / partGrowers.length;
    const tops: number[] = [];
    let top = y + skelHead(frame);
    heights.forEach((ph) => { tops.push(top); top += ph; });
    const listed = parts.map((p) => !!p.tag && Array.isArray(frame.frames) && frame.frames.includes(p.tag));
    const radius = frame.rounded ? SKEL_ROUND : 0;
    for (let i = 0; i < parts.length; i++) {
      if (!listed[i]) continue;
      let end = i;
      while (end + 1 < parts.length && listed[end + 1]) end++;
      const fy = tops[i], fh = tops[end] + heights[end] - fy;
      if (frame.raised) out.push(skelRect("sds-skel-surface", x, fy, w, fh, radius));
      if (frame.bordered) {
        out.push(skelRect("sds-skel-border", x, fy, w, fh, radius));
        for (let d = i + 1; d <= end; d++) out.push(`  <path class="sds-skel-border" d="M${r2(x)} ${r2(tops[d])} H${r2(x + w)}"/>`);
      }
      i = end;
    }
    parts.forEach((part, i) => {
      // A PART WITH NO SOLID BORDER AROUND IT KEEPS ITS DOTTED BOUNDARY; a solid line already marks the others.
      if (!(frame.bordered && listed[i])) out.push(skelRect("sds-skel-guide", x, tops[i], w, heights[i], 0));
      skelDrawFrame(part, x, tops[i], w, findings, out, heights[i], named + (frame.tag ? 1 : 0), ctl, true);
    });
    return;
  }

  const heights = rows.map((r) => skelRowHeight(r, ctl));
  if (growers.length && slack > 0) for (const i of growers) heights[i] += slack / growers.length;

  const itemsX = x + SKEL_PAD + (labelCol ? labelCol + SKEL_GAP : 0);
  let rowY = y + skelHead(frame);
  rows.forEach((row, rowIndex) => {
    const rh = heights[rowIndex];
    if (row.label) out.push(`  <text class="sds-label" x="${x + SKEL_PAD}" y="${Math.round(rowY + rh / 2 + 4)}">${esc(row.label)}</text>`);

    let innerX = itemsX, innerY = rowY, innerW = rowContentW;
    if (row.framed) {
      out.push(...skelMarks(undefined, itemsX, rowY, rowContentW, rh));
      innerX = itemsX + SKEL_GAP; innerY = rowY + SKEL_GAP; innerW = rowContentW - SKEL_GAP * 2;
    }

    const widths = skelRowWidths(row, innerW, ctl, findings);
    // EVERY BOX IN A ROW STANDS AS TALL AS THE ROW, so a named place beside a plain one lines up at
    // both edges, as the regions of a layout do.
    const boxH = row.framed ? rh - SKEL_GAP * 2 : rh;
    const centres: number[] = [];
    let ix = innerX;
    row.items.forEach((it, i) => {
      const iw = widths[i];
      const kind = skelKind(it);
      skelOldFields(it, findings);
      if (kind === "slot") {
        const stray = ["text", "note", "lines", "standin", "control", "icon", "frame"].filter((k) => (it as Record<string, unknown>)[k] !== undefined);
        if (stray.length) findings.push(`a slot holds nothing: \`${it.slot}\` carries ${stray.map((k) => `\`${k}\``).join(", ")}, and a slot is one block whose only content is its name`);
      }
      if (kind === "frame") skelDrawFrame(it.frame!, ix, innerY, iw, findings, out, boxH, named + (frame.tag ? 1 : 0), ctl);
      else if (kind !== null && kind !== "spacer") {
        // A PLACE AND A STAND-IN STRETCH, A CONTROL DOES NOT: a named region fills its row, and a
        // control keeps the height of its component, centred on the row's one centre line.
        const stretches = kind === "slot" || kind === "place" || (it.height !== undefined && kind === "standin");
        const own = stretches ? boxH : skelItemHeight(it, ctl);
        const top = kind === "standin" || stretches ? innerY : innerY + (boxH - Math.min(own, boxH)) / 2;
        const drawnH = kind === "standin" ? Math.min(own, boxH) : own;
        if (kind !== "standin") centres.push(top + (kind === "control" || kind === "icon" ? ctl : own) / 2);
        skelDrawLeaf(it, kind, ix, top, iw, kind === "control" || kind === "icon" ? ctl : drawnH, boxH, ctl, findings, out);
      }
      ix += iw + skelGapAfter(row, i);
    });
    if (centres.length > 1 && Math.max(...centres) - Math.min(...centres) > 0.5)
      findings.push("the items of one row do not share one centre line");
    rowY += rh + SKEL_GAP;
  });
}

/** A `skeleton` with no `frame` draws nothing — it is one outer frame, and there is no other claim
 *  this kind can make. */
function drawSkeleton(spec: Spec): { svg: string; findings: string[] } {
  if (!spec.frame) return { svg: "", findings: ["a `skeleton` figure with no `frame`; a skeleton is one outer frame"] };
  const findings: string[] = [];
  const out: string[] = [];
  skelDrawFrame(spec.frame, 24, 24, undefined, findings, out);
  return { svg: svgOf(out, spec.title ?? spec.caption ?? "skeleton", "sds-skeleton"), findings };
}

const DRAWERS: Record<string, (s: Spec) => { svg: string; findings: string[] }> = {
  entities: drawEntities,
  chain: drawChain,
  flowchart: drawFlowchart,
  sequence: drawSequence,
  system: drawSystem,
  map: drawMap,
  skeleton: drawSkeleton,
};

/**
 * `flow` IS RETIRED, and the refusal is where the distinction gets taught (Q136 A, 2026-09-22).
 * It was registered as an alias of the map drawer before `FLOWCHART` existed, so a figure asking for
 * a flow was laid out as boxes and arrows with no shapes at all — and the book's figure table never
 * named a `FLOW`. A drawer that accepts a kind the book does not have is the same defect as a
 * capability folder with no construct twin, which is the check this very step adds.
 *
 * A retired kind is worth more than an unknown one, because the two it might have meant are exactly
 * the pair the chapter asks a reader to read twice: a map answers *what is this made of*, a
 * flowchart answers *what happens, and where does it turn*.
 */
const RETIRED: Record<string, string> = {
  flow: "`flow` is retired. Use `map` when the figure is the PARTS of one thing and how they touch, or `flowchart` when it is a PATH somebody takes and where it turns — a flowchart has the standard shapes because a decision is not a step, and a map has none because its boxes are all the same kind of thing (05-artifacts.md, The figures)",
};

export const KINDS = Object.keys(DRAWERS);

export function draw(spec: Spec): { svg: string; findings: string[] } {
  const kind = (spec.kind ?? "").toLowerCase();
  if (RETIRED[kind]) return { svg: "", findings: [RETIRED[kind]] };
  const drawer = DRAWERS[kind];
  if (!drawer)
    return { svg: "", findings: [`no helper draws a \`${spec.kind}\` figure. The helpers are ${KINDS.join(" · ")}; author this one as SVG in an HTML block in the seat file and it is used verbatim (05-artifacts.md, The figures)`] };
  return drawer(spec);
}
