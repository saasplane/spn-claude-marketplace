// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The figures · § A connector is a claim
//           § One stylesheet, served in versions
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
//   check    labels fit their boxes; every connector starts and ends on a box edge or on another
//            connector; nothing hugs the viewBox edge; no connector crosses a label
//   colour   the tokens of a `data-lang` block, wrapped in spans the stylesheet colours in both themes
//
// A connector is a claim that two things touch, which is what makes a figure checkable rather than a
// matter of taste. Ported from this workstream's `notes/figcheck.py`, the reference that passes on all
// seven pages — and checked against it rather than trusted.
//
// A SKELETON NEEDS NO RULE OF ITS OWN HERE: it draws no connector, so every rule above reads it as
// an ordinary set of boxes and labels, and the look it must never borrow is the drawer's promise.

/** The measure, at the drawn scale: pixels per character, by text class. */
const PX: Record<string, number> = { "sds-title": 7.6, "sds-label": 7.0, "sds-code": 6.6, "sds-note": 6.4 };
/** A path that is a connector: its `class` holds `sds-connector`, alone or beside a tone or `sds-lifeline`. */
const CONNECTOR = /\bclass="(?:[^"]*\s)?sds-connector(?:\s[^"]*)?"/;
const EDGE = 8, JOIN_TOL = 6, BOX_TOL = 4;
// A connector needs shaft a reader can see, and a label on it needs room to sit in. Both were rules
// nothing enforced: the chapter has asked for 36 of visible shaft since it was written, and a label
// was only ever compared with the box CONTAINING it — so a label lying across its neighbour passed.
// Found by the developer on the SYSTEM samples, 2026-09-22: every fault was in hand-drawn SVG, and
// every drawer-produced figure was already clean.
const MIN_SHAFT = 36, LABEL_TOL = 1, PAD = 16, PAD_TOL = 2;
// A label owes this much clear air to everything that is not its own text: a box it is not inside,
// another label, and any connector. Checking for *clearance* rather than for overlap is the point —
// a label one pixel clear of an arrow does not overlap it and is still unreadable.
const LABEL_GAP = 8, GAP_APART = 24;
// How far off a side's centre a lone arrow may land before a reader sees it as off-centre.
const CENTRE_TOL = 2;
// The clear air a connector owes a shape it passes without touching. It is the contract's own
// unconnected gap rather than the padding number: at 16 a line threading between two stacked boxes
// measured clean and still read as cramped, because what was too small was the corridor, not the
// line's distance from either side. 24 forces the corridor to be one a reader can see through.
const LINE_CLEAR = GAP_APART;
/** The drawn length of a connector, summed over its segments. */
const shaftOf = (pts: Pt[]): number => {
  let n = 0;
  for (let i = 1; i < pts.length; i++) n += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return n;
};

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
 * Absolute points per subpath, every one of them, with whether it closed. A closed subpath is a
 * SHAPE — a diamond, a terminator, any outline drawn as a path rather than a `<rect>` — and the two
 * are used differently: a shape is never checked for dangling endpoints, and a connector is allowed
 * to land on one. Before this, a closed path was dropped entirely and a flowchart's decision diamond
 * counted as empty space (N13, 2026-09-22).
 */
function subpathsAll(d: string): { pts: Pt[]; closed: boolean }[] {
  const toks = [...d.matchAll(/([MLHVCZmlhvcz])|(-?[\d.]+)/g)];
  const out: { pts: Pt[]; closed: boolean }[] = [];
  let cur: Pt[] = [], cmd = "", x = 0, y = 0;
  const flush = (closed: boolean) => { if (cur.length) out.push({ pts: cur, closed }); cur = []; };
  let i = 0;
  while (i < toks.length) {
    const [, c] = toks[i];
    if (c) { cmd = c; i++; if (c === "Z" || c === "z") flush(true); continue; }
    const nums: number[] = [];
    while (i < toks.length && toks[i][2] !== undefined) nums.push(Number(toks[i++][2]));
    let j = 0;
    while (j < nums.length) {
      switch (cmd) {
        case "M": flush(false); x = nums[j]; y = nums[j + 1]; cur = [[x, y]]; j += 2; cmd = "L"; break;
        case "m": flush(false); x += nums[j]; y += nums[j + 1]; cur = [[x, y]]; j += 2; cmd = "l"; break;
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
  flush(false);
  return out;
}

/** The connector subpaths alone — what every caller before the flowchart wanted. */
function subpaths(d: string): Pt[][] {
  return subpathsAll(d).filter((s) => !s.closed).map((s) => s.pts);
}

/** A point sitting on the outline of a closed shape, within the same tolerance a box edge uses. */
function onShape(p: Pt, shapes: Pt[][]): boolean {
  for (const pts of shapes) {
    for (let i = 1; i < pts.length; i++) if (distToSegment(p, pts[i - 1], pts[i]) <= BOX_TOL) return true;
    if (pts.length > 2 && distToSegment(p, pts[pts.length - 1], pts[0]) <= BOX_TOL) return true;
  }
  return false;
}

/** A point sitting on a circle's circumference — a flowchart's on-page connector is one. */
/** On the rim of an ellipse, within the same tolerance a box edge is judged by. */
function onEllipse(p: Pt, ellipses: [number, number, number, number][]): boolean {
  return ellipses.some(([cx, cy, rx, ry]) => {
    if (rx <= 0 || ry <= 0) return false;
    const dx = (p[0] - cx) / rx, dy = (p[1] - cy) / ry;
    const r = Math.hypot(dx, dy);
    return Math.abs(r - 1) * Math.min(rx, ry) <= JOIN_TOL;
  });
}
function onCircle(p: Pt, circles: [number, number, number][]): boolean {
  for (const [cx, cy, r] of circles) if (Math.abs(Math.hypot(p[0] - cx, p[1] - cy) - r) <= BOX_TOL) return true;
  return false;
}

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * How close a connector segment comes to a label's box, which is what decides whether the two can be
 * read apart. A drawn connector is axis-aligned, so its bounding box IS the segment and the distance
 * between two axis-aligned boxes is exact. A hand-drawn diagonal falls back to its corners, which
 * under-states the distance and so errs towards reporting rather than towards silence.
 */
function distSegRect(a: Pt, b: Pt, r: Rect): number {
  const [rx, ry, rw, rh] = r;
  const lo = [Math.min(a[0], b[0]), Math.min(a[1], b[1])], hi = [Math.max(a[0], b[0]), Math.max(a[1], b[1])];
  const dx = Math.max(0, rx - hi[0], lo[0] - (rx + rw));
  const dy = Math.max(0, ry - hi[1], lo[1] - (ry + rh));
  return Math.hypot(dx, dy);
}

function sideOfAny(p: Pt, r: Rect): boolean {
  const [rx, ry, rw, rh] = r;
  const onX = rx - BOX_TOL <= p[0] && p[0] <= rx + rw + BOX_TOL;
  const onY = ry - BOX_TOL <= p[1] && p[1] <= ry + rh + BOX_TOL;
  return (onX && (Math.abs(p[1] - ry) <= BOX_TOL || Math.abs(p[1] - (ry + rh)) <= BOX_TOL))
      || (onY && (Math.abs(p[0] - rx) <= BOX_TOL || Math.abs(p[0] - (rx + rw)) <= BOX_TOL));
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
    // A viewBox may carry an origin, so a figure can hug its own content and render edge to edge
    // rather than paying an inner margin the section already provides (05-artifacts.md § A figure runs
    // edge to edge). The edge test measures against the box's real bounds, not against 0,0.
    const vb = svg.match(/viewBox="(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/);
    if (!vb) { findings.push({ figure: n + 1, message: "no viewBox, so nothing can be measured" }); return; }
    const X0 = Number(vb[1]), Y0 = Number(vb[2]), W = X0 + Number(vb[3]), H = Y0 + Number(vb[4]);
    const rects: Rect[] = [...svg.matchAll(/<rect[^>]*\sx="([\d.]+)"\s+y="([\d.]+)"\s+width="([\d.]+)"\s+height="([\d.]+)"/g)]
      .map((m) => [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]);

    // A CONTAINER'S PADDING. A box inside another box keeps `16` clear on every side, the same number
    // a leaf pads its own label by. The MAP sample had 20 on the left and 4 at the bottom, which reads
    // as a box falling out of its container — found by the developer on the rendered page, 2026-09-22.
    for (const child of rects) {
      for (const box of rects) {
        if (box === child) continue;
        const inside = box[0] <= child[0] && box[1] <= child[1] &&
                       child[0] + child[2] <= box[0] + box[2] && child[1] + child[3] <= box[1] + box[3];
        if (!inside) continue;
        const pads = [child[0] - box[0], box[0] + box[2] - (child[0] + child[2]), box[1] + box[3] - (child[1] + child[3])];
        const tight = Math.min(...pads);
        if (tight < PAD - PAD_TOL)
          findings.push({ figure: n + 1, message: `a box sits ${Math.round(tight)}px from the edge of the one holding it — a container keeps ${PAD}px clear on every side, so the child does not read as falling out of it` });
      }
    }

    // A lifeline, an axis or a chart curve is background rather than a claim, so it is exempt.
    const conns: { pts: Pt[]; exempt: boolean }[] = [];
    for (const m of svg.matchAll(/<line\b([^>]*)>/g)) {
      const at = m[1];
      const g = (k: string) => Number(at.match(new RegExp(`\\s${k}="(-?[\\d.]+)"`))?.[1] ?? NaN);
      const pts: Pt[] = [[g("x1"), g("y1")], [g("x2"), g("y2")]];
      if (pts.flat().some(Number.isNaN)) continue;
      conns.push({ pts, exempt: /lifeline|axis/.test(at) });
    }
    const circles: [number, number, number][] = [...svg.matchAll(/<circle[^>]*\scx="([\d.]+)"\s+cy="([\d.]+)"\s+r="([\d.]+)"/g)]
      .map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
    // AN ELLIPSE IS A SHAPE, and until now the check could not see one. A cylinder's cap and a pipe's
    // end are drawn as ellipses, so a connector landing on the leftmost point of a queue was reported
    // as ending in empty space — the drawer was right and the check was blind (N13, 2026-09-22).
    const ellipses: [number, number, number, number][] = [...svg.matchAll(/<ellipse[^>]*\scx="([\d.]+)"\s+cy="([\d.]+)"\s+rx="([\d.]+)"\s+ry="([\d.]+)"/g)]
      .map((m) => [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]);

    // A closed subpath is a SHAPE — a flowchart's decision diamond, a terminator — and a connector is
    // allowed to land on one, exactly as it lands on a `<rect>` edge.
    const shapes: Pt[][] = [];
    // A DIAMOND, as centre and half-axes: four points, opposite pairs sharing a centre, one pair on
    // each axis. That is the shape the drawer emits for a decision, and the only closed path whose
    // label containment can be tested by a formula rather than by a point-in-polygon walk.
    const diamonds: [number, number, number, number][] = [];
    for (const m of svg.matchAll(/<path\b([^>]*)>/g)) {
      const at = m[1];
      const d = at.match(/\sd="([^"]+)"/);
      if (!d) continue;
      const parts = subpathsAll(d[1]);
      for (const sp of parts) if (sp.closed && sp.pts.length >= 3) {
        shapes.push(sp.pts);
        const q = sp.pts.length === 5 && sp.pts[0][0] === sp.pts[4][0] && sp.pts[0][1] === sp.pts[4][1]
          ? sp.pts.slice(0, 4) : sp.pts.length === 4 ? sp.pts : null;
        if (!q) continue;
        const cx = (q[0][0] + q[2][0]) / 2, cy = (q[1][1] + q[3][1]) / 2;
        const onAxis = Math.abs(q[0][0] - cx) < 1 && Math.abs(q[2][0] - cx) < 1
                    && Math.abs(q[1][1] - cy) < 1 && Math.abs(q[3][1] - cy) < 1;
        if (!onAxis) continue;
        const a = Math.abs(q[1][0] - cx), b = Math.abs(q[0][1] - cy);
        if (a > 1 && b > 1) diamonds.push([cx, cy, a, b]);
      }
      if (!CONNECTOR.test(at)) continue;
      const exempt = /lifeline|axis|curve/.test(at);
      for (const sp of parts) if (!sp.closed && sp.pts.length >= 2) conns.push({ pts: sp.pts, exempt });
    }

    const segs: { k: number; a: Pt; b: Pt }[] = [];
    conns.forEach((c, k) => { for (let i = 1; i < c.pts.length; i++) segs.push({ k, a: c.pts[i - 1], b: c.pts[i] }); });
    const crossable = segs.filter((s) => !conns[s.k].exempt);

    // TWO CONNECTORS TRAVELLING SIDE BY SIDE read as one thick line, and the reader cannot tell which
    // label belongs to which. Found on the Sign-in flow, where a link that skipped a row was placed at
    // its gap's midpoint while a link to the next row was placed in a numbered lane — two independent
    // arithmetics in one gap, landing 4px apart (N13, 2026-09-21).
    const axis = (s: { a: Pt; b: Pt }): 0 | 1 | -1 =>
      Math.abs(s.a[0] - s.b[0]) < 1 ? 0 : Math.abs(s.a[1] - s.b[1]) < 1 ? 1 : -1;
    let worst: { gap: number; run: number } | null = null;
    for (let i = 0; i < crossable.length; i++) for (let j = i + 1; j < crossable.length; j++) {
      const s = crossable[i], t = crossable[j];
      if (s.k === t.k) continue;
      const av = axis(s);
      if (av < 0 || av !== axis(t)) continue;       // not parallel, or not axis-aligned
      const gap = Math.abs(s.a[av] - t.a[av]);
      if (gap < 0.5 || gap >= GAP_APART) continue;  // on top of each other is a different fault
      const o = av === 0 ? 1 : 0;
      const run = Math.min(Math.max(s.a[o], s.b[o]), Math.max(t.a[o], t.b[o]))
                - Math.max(Math.min(s.a[o], s.b[o]), Math.min(t.a[o], t.b[o]));
      if (run > LABEL_GAP && (!worst || gap < worst.gap)) worst = { gap, run };
    }
    if (worst)
      findings.push({ figure: n + 1, message: `two connectors run ${Math.round(worst.gap)}px apart for ${Math.round(worst.run)}px — parallel runs are ${GAP_APART}px apart, or a reader reads them as one line` });

    conns.forEach((c, k) => {
      if (c.exempt) return;
      for (const [which, p] of [["start", c.pts[0]], ["end", c.pts[c.pts.length - 1]]] as [string, Pt][]) {
        if (onBox(p, rects)) continue;
        if (onShape(p, shapes) || onCircle(p, circles) || onEllipse(p, ellipses)) continue;
        if (segs.some((s) => s.k !== k && distToSegment(p, s.a, s.b) <= JOIN_TOL)) continue;
        findings.push({ figure: n + 1, message: `a connector ${which}s in empty space at ${p[0]},${p[1]} — a connector is a claim that two things touch, so it lands on a box edge, on a shape, or on another connector` });
      }
      const shaft = shaftOf(c.pts);
      if (shaft < MIN_SHAFT)
        findings.push({ figure: n + 1, message: `a connector is only ${Math.round(shaft)}px long — a reader cannot see an arrow shorter than ${MIN_SHAFT}px, so move the boxes apart rather than shortening the line` });
      for (const [x, y] of c.pts) {
        if (x < X0 + EDGE || y < Y0 + EDGE || x > W - EDGE || y > H - EDGE) {
          findings.push({ figure: n + 1, message: `a connector comes within ${EDGE}px of the viewBox edge at ${x},${y}` });
          break;
        }
      }
    });

    // A CONNECTOR OWES CLEAR AIR TO EVERY SHAPE IT MERELY PASSES. Landing on a box is a claim; running
    // alongside one is not, and a line threaded two pixels past a corner reads as touching it. The
    // rules so far protected labels from lines and lines from each other, and left the commonest
    // crowding in a dense figure unmeasured (developer, 2026-09-21).
    // A CONTAINER IS EXEMPT HERE TOO, and for a plainer reason than the centring rule: a connector that
    // reaches a box inside a boundary from outside it MUST cross that boundary, so measuring the wall
    // it crosses reports the idiom rather than a fault. Every 0px hit the rule first produced was one
    // of those, and the one real finding under them was a line five pixels off a terminal.
    const encloses = (r: Rect) => rects.some((q) =>
      q !== r && q[0] >= r[0] && q[1] >= r[1] && q[0] + q[2] <= r[0] + r[2] && q[1] + q[3] <= r[1] + r[3]);
    for (const seg of crossable) {
      let worstBox: number | null = null;
      // A box INSIDE a container the line is attached to is not a box the line merely passes: it is
      // the padding of the thing the line comes out of. Requiring 24 there would contradict the grid,
      // which fixes a container's padding at 16 — two rules of this chapter disagreeing, which is the
      // fault this whole arc keeps finding, so the narrower rule yields to the one the grid states.
      // A CAP AND THE BODY IT CAPS ARE ONE SHAPE. A cylinder is a rect with an ellipse on its top
      // edge and a queue is a rect with one on its left, so an arrow landing on the cap is landing on
      // the thing — and measuring it against the body it just arrived at reported 13px of crowding
      // where a connector had done exactly what it was told (N13, 2026-09-22).
      const onCap = (p: Pt, r: Rect) => ellipses.some(([cx, cy, rx, ry]) =>
        onEllipse(p, [[cx, cy, rx, ry]])
        && cx >= r[0] - BOX_TOL && cx <= r[0] + r[2] + BOX_TOL
        && cy >= r[1] - BOX_TOL && cy <= r[1] + r[3] + BOX_TOL);
      const meets = (p: Pt, r: Rect) => sideOfAny(p, r) || onCap(p, r);
      const attached = rects.filter((r) => [seg.a, seg.b].some((p) => meets(p, r)));
      const inside = (r: Rect) => attached.some((c) =>
        c !== r && r[0] >= c[0] && r[1] >= c[1] && r[0] + r[2] <= c[0] + c[2] && r[1] + r[3] <= c[1] + c[3]);
      for (const r of rects) {
        if (encloses(r) || inside(r)) continue;
        const touches = [seg.a, seg.b].some((p) => meets(p, r));
        if (touches) continue;
        const d = distSegRect(seg.a, seg.b, r);
        if (d < LINE_CLEAR && (worstBox === null || d < worstBox)) worstBox = d;
      }
      if (worstBox !== null) {
        findings.push({ figure: n + 1, message: `a connector passes ${Math.round(worstBox)}px from a box it does not touch — a line owes ${LINE_CLEAR}px of clear air to every shape it merely goes by` });
        break;
      }
    }

    // A SIDE WITH ONE CONNECTOR ON IT TAKES IT IN THE MIDDLE. Where several arrows share a side they
    // spread across it; where one arrow has the side to itself, the middle is the only place it
    // belongs — an arrow landing off-centre makes a reader look for the second arrow that would
    // explain the offset, and there is none. No rule had an opinion about WHERE on a side an arrow
    // lands, which is how a lone arrow came to dog-leg to a box it was pointing straight at
    // (developer, 2026-09-21).
    const sideOf = (p: Pt, r: Rect): string | null => {
      const [rx, ry, rw, rh] = r;
      const onX = rx - BOX_TOL <= p[0] && p[0] <= rx + rw + BOX_TOL;
      const onY = ry - BOX_TOL <= p[1] && p[1] <= ry + rh + BOX_TOL;
      if (onX && Math.abs(p[1] - ry) <= BOX_TOL) return "top";
      if (onX && Math.abs(p[1] - (ry + rh)) <= BOX_TOL) return "bottom";
      if (onY && Math.abs(p[0] - rx) <= BOX_TOL) return "left";
      if (onY && Math.abs(p[0] - (rx + rw)) <= BOX_TOL) return "right";
      return null;
    };
    // An endpoint belongs to the INNERMOST box whose side it lies on. A connector leaving a box inside
    // a container crosses the container's edge at the same point, and judged against the container's
    // centre it reads as off-centre when it is exactly where it should be — three of the first five
    // findings this rule produced were that, and none of them was a fault in a figure.
    const landings = new Map<string, Pt[]>();
    for (const c of conns) {
      if (c.exempt) continue;
      for (const p of [c.pts[0], c.pts[c.pts.length - 1]]) {
        const hits = rects.map((r, ri) => ({ ri, r, side: sideOf(p, r) })).filter((h) => h.side);
        if (!hits.length) continue;
        const inner = hits.reduce((a, b) => (a.r[2] * a.r[3] <= b.r[2] * b.r[3] ? a : b));
        const key = `${inner.ri}:${inner.side}`;
        landings.set(key, [...(landings.get(key) ?? []), p]);
      }
    }
    // A CONTAINER IS EXEMPT. Where a connector leaves a box holding other boxes is decided by what is
    // inside it, not by its own midpoint: a container carries a header band, so its content sits below
    // its geometric centre and an arrow aligned with the row inside reads as 16px off the box.
    const holds = (r: Rect) => rects.some((q) =>
      q !== r && q[0] >= r[0] && q[1] >= r[1] && q[0] + q[2] <= r[0] + r[2] && q[1] + q[3] <= r[1] + r[3]);
    for (const [key, pts] of landings) {
      if (pts.length !== 1) continue;
      const [ri, side] = key.split(":");
      if (holds(rects[Number(ri)])) continue;
      const [rx, ry, rw, rh] = rects[Number(ri)];
      const across = side === "top" || side === "bottom";
      const want = across ? rx + rw / 2 : ry + rh / 2;
      const got = across ? pts[0][0] : pts[0][1];
      if (Math.abs(got - want) > CENTRE_TOL)
        findings.push({ figure: n + 1, message: `the only connector on a box's ${side} lands ${Math.round(Math.abs(got - want))}px off its centre — a side with one arrow on it takes that arrow in the middle` });
    }

    // Every label, measured, so one can be compared with another and with the boxes it is NOT in.
    const HGT: Record<string, number> = { "sds-title": 13, "sds-label": 12, "sds-code": 11, "sds-note": 11 };
    const placed: { r: Rect; txt: string }[] = [];
    const overlap = (a: Rect, b: Rect): [number, number] =>
      [Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]),
       Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1])];

    for (const m of svg.matchAll(/<text class="([\w-]+)"[^>]*x="([\d.]+)" y="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g)) {
      const cls = m[1], x = Number(m[2]), y = Number(m[3]), txt = unescape(m[4]);
      const w = txt.length * (PX[cls] ?? 7);
      const lh = HGT[cls] ?? 12;
      const lr: Rect = [x, y - lh, w, lh];
      // The same rect, grown by the clear air the label is owed on every side. Everything below is
      // measured against THIS, so "they do not overlap" is no longer a pass.
      const air: Rect = [x - LABEL_GAP, y - lh - LABEL_GAP, w + LABEL_GAP * 2, lh + LABEL_GAP * 2];
      // A DIAMOND HOLDS ONLY THE RECTANGLE INSCRIBED IN IT, and nothing checked that. Only `<rect>`
      // is measured for a label fitting its box, so a decision — a closed path, not a rect — was
      // outside every containment rule here: the Sign-in flowchart shipped with *The organization
      // judges* wider than its diamond and the note's last line hanging outside the shape, through
      // a check that reported the page clean. A point inside a diamond of half-width `a` and
      // half-height `b` satisfies `|dx|/a + |dy|/b <= 1`, so each corner of the label is tested
      // against the edge it is nearest (2026-09-22).
      for (const d of diamonds) {
        const [cx, cy, a, b] = d;
        if (!(cx >= lr[0] && cx <= lr[0] + lr[2]) && !(lr[0] >= cx - a && lr[0] + lr[2] <= cx + a)) continue;
        if (Math.abs(y - cy) > b + lh) continue;   // not this diamond's label
        const corners: Pt[] = [[lr[0], lr[1]], [lr[0] + lr[2], lr[1]], [lr[0], lr[1] + lr[3]], [lr[0] + lr[2], lr[1] + lr[3]]];
        let worst = 0;
        for (const [px, py] of corners) worst = Math.max(worst, Math.abs(px - cx) / a + Math.abs(py - cy) / b);
        if (worst > 1)
          findings.push({ figure: n + 1, message: `the label "${txt}" runs outside the diamond holding it — a decision holds only the rectangle inscribed in it, and this text needs ${Math.round(worst * 100)}% of the room the shape has at that height` });
      }

      // A label lying across a box it does not belong to is the commonest fault on a hand-drawn
      // figure, and the one a reader notices first: an edge's label is squeezed into the gap between
      // two boxes and runs over the one it points at.
      for (const b of rects) {
        if (b[0] <= x && x <= b[0] + b[2] && b[1] <= y && y <= b[1] + b[3]) continue;  // it is in this one
        const [ox, oy] = overlap(lr, b);
        if (ox > LABEL_TOL && oy > LABEL_TOL) {
          findings.push({ figure: n + 1, message: `the label "${txt.slice(0, 34)}" lies ${Math.round(ox)}px over a box it is not inside — give the edge room rather than letting its label cross what it points at` });
          break;
        }
        const [ax2, ay2] = overlap(air, b);
        if (ax2 > 0 && ay2 > 0) {
          // The shortfall can compute to zero or less, which means the two are touching within the
          // tolerance the overlap rule allows — say so rather than printing a negative distance.
          const room = Math.round(LABEL_GAP - Math.min(ax2, ay2));
          findings.push({ figure: n + 1, message: room > 0
            ? `the label "${txt.slice(0, 34)}" comes within ${room}px of a box it is not inside — a label owes ${LABEL_GAP}px of clear air to every shape but its own`
            : `the label "${txt.slice(0, 34)}" touches a box it is not inside — a label owes ${LABEL_GAP}px of clear air to every shape but its own` });
          break;
        }
      }
      for (const q of placed) {
        const [ox, oy] = overlap(lr, q.r);
        if (ox > LABEL_TOL && oy > LABEL_TOL) {
          findings.push({ figure: n + 1, message: `the labels "${q.txt.slice(0, 22)}" and "${txt.slice(0, 22)}" overlap by ${Math.round(ox)}px` });
          break;
        }
        const [ax2, ay2] = overlap(air, q.r);
        if (ax2 > 0 && ay2 > 0) {
          findings.push({ figure: n + 1, message: `the labels "${q.txt.slice(0, 22)}" and "${txt.slice(0, 22)}" are only ${Math.round(LABEL_GAP - Math.min(ax2, ay2))}px apart — two words that close read as one phrase` });
          break;
        }
      }
      // A label INSIDE a shape that is not a `<rect>` — the letter in an on-page connector circle, a
      // word in a diamond — is the shape's own text, and every connector that lands on that shape
      // reaches its boundary by design. Measuring those as near misses reported the vocabulary the
      // flowchart had only just gained (N13, 2026-09-21).
      const inShape = circles.some(([cx, cy, r]) => Math.hypot(x + w / 2 - cx, y - lh / 2 - cy) <= r)
        || shapes.some((pts) => {
          const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
          return x >= Math.min(...xs) && x + w <= Math.max(...xs)
              && y - lh >= Math.min(...ys) && y <= Math.max(...ys);
        });
      // Every connector, not just a vertical one crossing the text. A label sits a standard gap from
      // the run it names, so anything closer than that gap is a different connector passing too near.
      for (const s of inShape ? [] : crossable) {
        const d = distSegRect(s.a, s.b, lr);
        if (d < LABEL_GAP - 0.5) {
          findings.push({ figure: n + 1, message: `a connector runs ${Math.round(d)}px from the label "${txt.slice(0, 30)}" — a label owes ${LABEL_GAP}px of clear air to every arrow, its own included` });
          break;
        }
      }
      placed.push({ r: lr, txt });
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
      l.startsWith("+") ? `<span class="sds-tk-add">${HTML_ESC(l)}</span>`
      : l.startsWith("-") ? `<span class="sds-tk-del">${HTML_ESC(l)}</span>`
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
  // list carries `class`, so the keyword pass wrapped the `class` inside a `<span class="sds-tk-n">` it
  // had just written. The round-trip test is what caught it.
  const keep = (cls: string, escaped: string) => {
    held.push(`<span class="${cls}">${escaped}</span>`);
    return mark(held.length - 1);
  };

  let out = code;
  if (spec.comment) out = out.replace(spec.comment, (m) => hold("sds-tk-c", m));
  out = out.replace(/'[^'\n]*'|"[^"\n]*"|`[^`\n]*`/g, (m) => hold("sds-tk-s", m));

  out = HTML_ESC(out);
  out = out.replace(/\b\d+(?:\.\d+)?\b/g, (m) => keep("sds-tk-n", m));
  if (spec.keywords?.length) {
    const kw = new RegExp(`\\b(${spec.keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "g");
    out = out.replace(kw, (m) => keep("sds-tk-k", m));
  }
  if (spec.type) out = out.replace(spec.type, (m) => keep("sds-tk-t", m));

  return out.replace(new RegExp(`${SEP}([a-z]+)${SEP}`, "g"), (_, k: string) => {
    let i = 0;
    for (const ch of k) i = i * 26 + (ch.charCodeAt(0) - 96);
    return held[i - 1];
  });
}

/** The audit's half: the raw text of a coloured block must equal what the author wrote. */
export function stripSpans(html: string): string {
  // `&amp;` is unescaped LAST. Doing it first turns an author's literal `&lt;` into `<`.
  return html.replace(/<span class="sds-tk-[a-z]+">/g, "").replace(/<\/span>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
