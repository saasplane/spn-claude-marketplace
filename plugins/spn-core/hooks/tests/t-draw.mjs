// `lib/draw.ts` — the `.dg` drawer, checked against the figure check that judges its output.
//
// THE TWO HALVES HAD NEVER BEEN RUN AGAINST EACH OTHER, and they disagreed. `drawEntities` placed a
// connector's label at the boxes' own mid-height, so the label sat INSIDE a box; `checkFigures` then
// measured it against that box's width and reported it overrunning something it was never in. The
// drawer was shipped and the check was shipped and nothing put one in front of the other.
//
// So every case here draws a figure and then asks the real check to judge it. A drawer whose output
// its own gate refuses is a defect, whichever half is wrong.
import { draw, KINDS } from "../lib/draw.ts";
import { checkFigures } from "../lib/figures.ts";

let n = 0, failed = 0;
function one(name, got, want) {
  n += 1;
  const ok = typeof want === "function" ? want(got) : got === want;
  if (!ok) { failed += 1; console.log(`  FAIL  ${name}\n        got: ${JSON.stringify(got).slice(0, 300)}`); }
  else console.log(`  PASS  ${name}`);
}
const none = (got) => Array.isArray(got) && got.length === 0;
const says = (s) => (got) => JSON.stringify(got).includes(s);

/** Draw it, then let the real figure check judge what came out. */
const judge = (spec) => { const { svg, findings } = draw(spec); return { findings, figure: checkFigures(svg), svg }; };

console.log("=== every drawer's output passes the figure check");

const FIGURES = {
  "entities — a centre with what points at it and what it points to": {
    kind: "entities", boxes: [{ id: "c", label: "Account", em: true }, { id: "u", label: "User" }, { id: "o", label: "Org" }],
    links: [{ from: "u", to: "c", label: "belongs to" }, { from: "c", to: "o", label: "scopes" }],
  },
  "chain — a box per step, an arrow means then": {
    kind: "chain", boxes: [{ id: "a", label: "Plan" }, { id: "b", label: "Build" }, { id: "c", label: "Prove" }],
  },
  "map — flat groups with what flows between them": {
    kind: "map", boxes: [{ id: "a", label: "Contract", note: "the shared surface" }, { id: "b", label: "App" }, { id: "c", label: "Entry" }],
    links: [{ from: "a", to: "b", label: "types" }, { from: "b", to: "c" }],
  },
  "map — a one-way chain that fits is one horizontal line": {
    kind: "map", boxes: [{ id: "a", label: "Ground", note: "the company brings" }, { id: "b", label: "Estate", note: "SaaS Plane creates" }, { id: "c", label: "Deployments", note: "the apps deliver" }],
    links: [{ from: "a", to: "b", label: "derives" }, { from: "b", to: "c", label: "runs" }],
  },
  "flow — a branch keeps every link, laid in rows": {
    kind: "flow", boxes: [{ id: "a", label: "Judge" }, { id: "b", label: "Pass" }, { id: "c", label: "One more step" }, { id: "d", label: "Refuse" }],
    links: [{ from: "a", to: "b" }, { from: "a", to: "c" }, { from: "a", to: "d" }, { from: "c", to: "b" }] },
  "chain — too wide for the canvas stands up as a vertical line": {
    kind: "chain", boxes: "12345678".split("").map((n) => ({ id: "s" + n, label: "A long step name number " + n, note: "with a note that widens the box further" })) },
  "map — a one-way chain too wide for the canvas is one vertical line": {
    kind: "map", boxes: "abcdef".split("").map((id) => ({ id, label: `Step ${id.toUpperCase()}`, note: "a note long enough to make the row too wide" })),
    links: [["a","b"],["b","c"],["c","d"],["d","e"],["e","f"]].map(([from, to]) => ({ from, to, label: "then" })),
  },
  "map — rows are ordered so links do not cross": {
    kind: "map", boxes: [{ id: "v", label: "Vocabulary" }, { id: "g", label: "Ground" }, { id: "p", label: "Providers" }, { id: "c", label: "Coordinates" }],
    links: [{ from: "v", to: "c" }, { from: "g", to: "p" }, { from: "g", to: "c" }],
  },
  "map — a nested box is containment": {
    kind: "map", boxes: [{ id: "repo", label: "Repository" }, { id: "s1", label: "01-purpose", in: "repo" },
      { id: "s2", label: "02-constructs", in: "repo" }, { id: "n", label: "Node", note: "README.md only" }],
    links: [{ from: "n", to: "repo", label: "links into" }],
  },
  "map — nine groups wrap into rows rather than running off the canvas": {
    kind: "map", boxes: Array.from({ length: 9 }, (_, i) => ({ id: `b${i}`, label: `Domain ${i + 1}`, note: "what it holds" })),
    links: [{ from: "b0", to: "b8", label: "depends on" }],
  },
};
for (const [name, spec] of Object.entries(FIGURES)) {
  const r = judge(spec);
  one(`${name} — draws without a finding`, r.findings, none);
  one(`${name} — and the figure check passes it`, r.figure, none);
}

{
  const flat = judge(FIGURES["map — a one-way chain that fits is one horizontal line"]).svg;
  one("a chain that fits has every box on one y", flat, (g) => new Set([...g.matchAll(/<rect[^>]* y="([\d.]+)"/g)].map((m) => m[1])).size === 1);
  one("and every link is a single horizontal segment", flat, (g) => [...g.matchAll(/<path class="c" d="([^"]+)"/g)].every((m) => /^M[\d.]+ [\d.]+ H[\d.]+$/.test(m[1])));
  const branch = judge(FIGURES["flow — a branch keeps every link, laid in rows"]).svg;
  one("a flow with a branch draws all four links", branch, (g) => (g.match(/marker-end/g) ?? []).length === 4);
  one("and its boxes sit in more than one row", branch, (g) => new Set([...g.matchAll(/<rect[^>]* y="([\d.]+)"/g)].map((m) => m[1])).size > 1);
  const wide = judge(FIGURES["chain — too wide for the canvas stands up as a vertical line"]).svg;
  one("a chain too wide for the canvas has every box on one x", wide, (g) => new Set([...g.matchAll(/<rect[^>]* x="([\d.]+)"/g)].map((m) => m[1])).size === 1);
  one("and is no wider than the canvas", wide, (g) => Number(g.match(/viewBox="0 0 (\d+)/)[1]) <= 1100);
  const tall = judge(FIGURES["map — a one-way chain too wide for the canvas is one vertical line"]).svg;
  one("a chain too wide has every box on one x", tall, (g) => new Set([...g.matchAll(/<rect[^>]* x="([\d.]+)"/g)].map((m) => m[1])).size === 1);
  one("and every link is a single vertical segment", tall, (g) => [...g.matchAll(/<path class="c" d="([^"]+)"/g)].every((m) => /^M[\d.]+ [\d.]+ V[\d.]+$/.test(m[1])));
  const ordered = judge(FIGURES["map — rows are ordered so links do not cross"]).svg;
  const xOf = (label) => Number(ordered.match(new RegExp(`<text class="l" x="([\\d.]+)" y="[\\d.]+">${label}<`))[1]);
  // Two orders are crossing-free (Ground first or Vocabulary first); what must hold is that the
  // rows agree, so the one link that could cross another does not.
  one("the two rows are ordered the same way, so no run crosses another", ordered, () => (xOf("Ground") < xOf("Vocabulary")) === (xOf("Providers") < xOf("Coordinates")));
}

console.log("\n=== the map drawer says what it cannot do, rather than drawing something wrong");
one("`map` is a kind the book names, and a helper draws it", KINDS, (k) => k.includes("map"));
one("a figure with no boxes is a finding, not an empty canvas",
  draw({ kind: "map", boxes: [] }).findings, says("no boxes"));
one("a link naming a box that does not exist is a finding",
  draw({ kind: "map", boxes: [{ id: "a", label: "A" }], links: [{ from: "a", to: "ghost" }] }).findings,
  says("`ghost`, and no box has that id"));
one("a box nested in one that does not exist is a finding, and it is still placed",
  draw({ kind: "map", boxes: [{ id: "a", label: "A", in: "ghost" }] }).findings,
  says("nested in `ghost`"));
one("a box nested in itself is a finding rather than a hang",
  draw({ kind: "map", boxes: [{ id: "a", label: "A", in: "a" }] }).findings, says("nested in itself"));

console.log("\n=== containment is drawn as containment");
{
  const { svg } = draw({ kind: "map", boxes: [{ id: "p", label: "Parent" }, { id: "k", label: "A Much Longer Child", in: "p" }] });
  const rects = [...svg.matchAll(/<rect[^>]*x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)]
    .map((m) => m.slice(1).map(Number));
  one("the parent and the child are both drawn", rects.length, 2);
  const [p, k] = rects;
  one("the child sits inside the parent on both axes",
    [p[0] <= k[0], p[1] <= k[1], k[0] + k[2] <= p[0] + p[2], k[1] + k[3] <= p[1] + p[3]],
    (v) => v.every(Boolean));
  one("the parent grew to hold a child wider than its own label, rather than the child shrinking",
    p[2] >= k[2], true);
}

// THE THREE FAULTS THE MAP DRAWER SHIPPED WITH, each asserted against the rule it broke rather than
// only against the figure check. A check can go blind — that is how all three survived a release —
// so each rule is also stated here in the terms the chapter states it in.
console.log("\n=== the map drawer keeps the three rules it was found breaking");
{
  // A row of boxes of unequal height was hung from its top while the connector ran at the tallest
  // box's mid-height, so a box that is pointed at once took its one arrow 7px off its own centre.
  const { svg } = draw({ kind: "map",
    boxes: [{ id: "a", label: "Contract", note: "the shared surface" }, { id: "b", label: "App" }, { id: "c", label: "Entry" }],
    links: [{ from: "a", to: "b", label: "types" }, { from: "b", to: "c" }] });
  const rects = [...svg.matchAll(/<rect[^>]*y="([\d.]+)"[^>]*height="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const runs = [...svg.matchAll(/<path class="c" d="M[\d.]+ ([\d.]+) H/g)].map((m) => Number(m[1]));
  one("a row of unequal boxes shares one centre line, so a lone arrow is straight",
    rects.map(([y, h]) => y + h / 2), (mids) => new Set(mids).size === 1 && runs.every((r) => r === mids[0]));
}
{
  // Three links out of one gap: the lane ORDER decides where the vertical drops fall, and two of
  // them came out 22px apart while every other number in the figure obeyed 24.
  const { svg } = draw({ kind: "map",
    boxes: [{ id: "v", label: "Vocabulary" }, { id: "g", label: "Ground" }, { id: "p", label: "Providers" }, { id: "c", label: "Coordinates" }],
    links: [{ from: "v", to: "c" }, { from: "g", to: "p" }, { from: "g", to: "c" }] });
  const verts = [];
  [...svg.matchAll(/<path class="c" d="([^"]+)"/g)].forEach((m, k) => {
    let x = 0, y = 0;
    for (const [, cmd, u, v] of m[1].matchAll(/([MHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g)) {
      const a = Number(u);
      const nx = cmd === "V" ? x : a, ny = cmd === "V" ? a : cmd === "M" ? Number(v) : y;
      if (cmd === "V") verts.push({ k, x, y1: Math.min(y, ny), y2: Math.max(y, ny) });
      x = nx; y = ny;
    }
  });
  const tooClose = [];
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) {
    if (verts[i].k === verts[j].k) continue;
    const apart = Math.abs(verts[i].x - verts[j].x);
    const run = Math.min(verts[i].y2, verts[j].y2) - Math.max(verts[i].y1, verts[j].y1);
    if (apart >= 0.5 && apart < 24 && run > 8) tooClose.push(`${apart}px for ${run}px`);
  }
  one("no two verticals from different connectors run closer than 24", tooClose, none);
}
{
  // A link that skips a row left by the right edge of a box sitting FIRST in a row of six, so it ran
  // the width of the row through five boxes at their own mid-height with 0px of clear air.
  const { svg } = draw({ kind: "map",
    boxes: Array.from({ length: 9 }, (_, i) => ({ id: `b${i}`, label: `Domain ${i + 1}`, note: "what it holds" })),
    links: [{ from: "b0", to: "b8", label: "depends on" }] });
  const rows = [...svg.matchAll(/<rect[^>]*y="([\d.]+)"[^>]*height="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const top = rows[0];
  const d = svg.match(/<path class="c" d="([^"]+)"/)[1];
  one("a skipping link out of a box that is not last in its row drops below the row before it travels",
    d, (g) => /^M[\d.]+ ([\d.]+) V([\d.]+) H/.test(g)
      && Number(/^M[\d.]+ ([\d.]+)/.exec(g)[1]) >= top[0] + top[1]);
  one("and the figure it draws has nothing for the check to report", checkFigures(svg), none);
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
