// `lib/draw.ts` — the `.dg` drawer, checked against the figure check that judges its output.
//
// THE TWO HALVES HAD NEVER BEEN RUN AGAINST EACH OTHER, and they disagreed. `drawEntities` placed a
// connector's label at the boxes' own mid-height, so the label sat INSIDE a box; `checkFigures` then
// measured it against that box's width and reported it overrunning something it was never in. The
// drawer was shipped and the check was shipped and nothing put one in front of the other.
//
// So every case here draws a figure and then asks the real check to judge it. A drawer whose output
// its own gate refuses is a defect, whichever half is wrong.
import { draw, KINDS } from "../../../../src/scripts/lib/draw.ts";
import { checkFigures } from "../../../../src/scripts/lib/figures.ts";
import { SEAT } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { createHash } from "node:crypto";

let n = 0, failed = 0;
function one(name, got, want) {
  n += 1;
  // A PREDICATE THAT THROWS FAILS ITS CASE, so a drawer that has not drawn a part yet reds one case and not the suite.
  let ok = false;
  try { ok = typeof want === "function" ? want(got) : got === want; } catch { ok = false; }
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
    links: [{ from: "u", to: "c", label: "belongs to", card: "N:1" }, { from: "c", to: "o", label: "scopes", card: "1:N" }],
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
  "map — a branch keeps every link, laid in rows": {
    kind: "map", boxes: [{ id: "a", label: "Judge" }, { id: "b", label: "Pass" }, { id: "c", label: "One more step" }, { id: "d", label: "Refuse" }],
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
    kind: "map", boxes: [{ id: "repo", label: "Repository" }, { id: "s1", label: SEAT.purpose, in: "repo" },
      { id: "s2", label: SEAT.constructs, in: "repo" }, { id: "n", label: "Node", note: "README.md only" }],
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
  one("and every link is a single horizontal segment", flat, (g) => [...g.matchAll(/<path class="sds-connector" d="([^"]+)"/g)].every((m) => /^M[\d.]+ [\d.]+ H[\d.]+$/.test(m[1])));
  const branch = judge(FIGURES["map — a branch keeps every link, laid in rows"]).svg;
  one("a flow with a branch draws all four links", branch, (g) => (g.match(/marker-end/g) ?? []).length === 4);
  one("and its boxes sit in more than one row", branch, (g) => new Set([...g.matchAll(/<rect[^>]* y="([\d.]+)"/g)].map((m) => m[1])).size > 1);
  const wide = judge(FIGURES["chain — too wide for the canvas stands up as a vertical line"]).svg;
  one("a chain too wide for the canvas has every box on one x", wide, (g) => new Set([...g.matchAll(/<rect[^>]* x="([\d.]+)"/g)].map((m) => m[1])).size === 1);
  one("and is no wider than the canvas", wide, (g) => Number(g.match(/viewBox="0 0 (\d+)/)[1]) <= 1100);
  const tall = judge(FIGURES["map — a one-way chain too wide for the canvas is one vertical line"]).svg;
  one("a chain too wide has every box on one x", tall, (g) => new Set([...g.matchAll(/<rect[^>]* x="([\d.]+)"/g)].map((m) => m[1])).size === 1);
  one("and every link is a single vertical segment", tall, (g) => [...g.matchAll(/<path class="sds-connector" d="([^"]+)"/g)].every((m) => /^M[\d.]+ [\d.]+ V[\d.]+$/.test(m[1])));
  const ordered = judge(FIGURES["map — rows are ordered so links do not cross"]).svg;
  const xOf = (label) => Number(ordered.match(new RegExp(`<text class="sds-label" x="([\\d.]+)" y="[\\d.]+">${label}<`))[1]);
  // Two orders are crossing-free (Ground first or Vocabulary first); what must hold is that the
  // rows agree, so the one link that could cross another does not.
  one("the two rows are ordered the same way, so no run crosses another", ordered, () => (xOf("Ground") < xOf("Vocabulary")) === (xOf("Providers") < xOf("Coordinates")));
}

console.log("\n=== the map drawer says what it cannot do, rather than drawing something wrong");
one("`map` is a kind the book names, and a helper draws it", KINDS, (k) => k.includes("map"));
// `flow` was an alias of the map drawer from before FLOWCHART existed, and the book's figure table
// never named it. A drawer that accepts a kind the book does not have is the defect this step is
// adding a check to refuse, so it refuses itself first (Q136 A, 2026-09-22).
one("`flow` is retired rather than quietly aliased", KINDS, (k) => !k.includes("flow"));
one("and asking for one names BOTH kinds it might have meant",
  draw({ kind: "flow", boxes: [{ id: "a", label: "A" }] }).findings,
  (g) => JSON.stringify(g).includes("`map`") && JSON.stringify(g).includes("`flowchart`") && JSON.stringify(g).includes("retired"));
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
  const runs = [...svg.matchAll(/<path class="sds-connector" d="M[\d.]+ ([\d.]+) H/g)].map((m) => Number(m[1]));
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
  [...svg.matchAll(/<path class="sds-connector" d="([^"]+)"/g)].forEach((m, k) => {
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
  const d = svg.match(/<path class="sds-connector" d="([^"]+)"/)[1];
  one("a skipping link out of a box that is not last in its row drops below the row before it travels",
    d, (g) => /^M[\d.]+ ([\d.]+) V([\d.]+) H/.test(g)
      && Number(/^M[\d.]+ ([\d.]+)/.exec(g)[1]) >= top[0] + top[1]);
  one("and the figure it draws has nothing for the check to report", checkFigures(svg), none);
}

console.log("\n=== FLOWCHART — the standard shapes, and the path runs down the page");
{
  const spec = { kind: "flowchart",
    boxes: [{ id: "s", label: "A request arrives" }, { id: "c", label: "Is the caller a member?" },
      { id: "y", label: "Mint a session" }, { id: "n", label: "Refuse", warn: true },
      { id: "log", label: "Write the audit row", shape: "store" }, { id: "e", label: "Done" }],
    links: [{ from: "s", to: "c" }, { from: "c", to: "y", label: "yes" }, { from: "c", to: "n", label: "no" },
      { from: "y", to: "log" }, { from: "n", to: "e" }, { from: "log", to: "e" }] };
  const r = judge(spec);
  one("a flowchart draws without a finding", r.findings, none);
  one("and the figure check passes it", r.figure, none);
  one("`flowchart` is a kind the book names, and a helper draws it", KINDS, (k) => k.includes("flowchart"));
  one("the ends of the path are terminators — a rect rounded to a half its own height",
    r.svg, (g) => (g.match(/<rect[^>]*height="44"[^>]*rx="22"/g) ?? []).length === 2);
  one("a box with two ways out is drawn as a diamond", r.svg, (g) => /<path class="sds-box" d="M[\d.]+ [\d.]+ L[\d.]+ [\d.]+ L[\d.]+ [\d.]+ L[\d.]+ [\d.]+ Z"/.test(g));
  one("a store carries a cap, and its body is a rect the check can measure",
    r.svg, (g) => /<ellipse class="sds-box"/.test(g) && /<rect class="sds-box"[^>]*\/>\n  <ellipse/.test(g));
  // Inference gives `c` a diamond because it has two ways out; naming a shape must overrule that.
  one("a named shape always wins over the inferred one",
    draw({ ...spec, boxes: spec.boxes.map((b) => (b.id === "c" ? { ...b, shape: "process" } : b)) }).svg,
    (g) => !/<path class="sds-box" d="M[\d.]+ [\d.]+ L/.test(g));
  one("a branch out of a decision with no answer on it is a finding",
    draw({ ...spec, links: spec.links.map((l) => (l.label === "no" ? { from: l.from, to: l.to } : l)) }).findings,
    says("leaves a decision with no answer"));
  // A map of three parts may read left to right; a path never does.
  const line = { kind: "flowchart", boxes: [{ id: "a", label: "Start" }, { id: "b", label: "Do the thing" }, { id: "c", label: "Stop" }],
    links: [{ from: "a", to: "b" }, { from: "b", to: "c" }] };
  one("a flowchart that would fit across the page still runs down it",
    draw(line).svg, (g) => new Set([...g.matchAll(/<rect[^>]* y="([\d.]+)"/g)].map((m) => m[1])).size === 3);
  one("and the same boxes as a `map` lie across it",
    draw({ ...line, kind: "map" }).svg, (g) => new Set([...g.matchAll(/<rect[^>]* y="([\d.]+)"/g)].map((m) => m[1])).size === 1);
}

console.log("\n=== a figure hugs its own content");
{
  // The drawer lays out in a 1100 canvas and centres its rows in it. That is right for PLACING
  // things and wrong for shipping them: a narrow figure arrived marooned in white space.
  //
  // Measured over every coordinate the drawing puts on the page — boxes, connectors and words
  // alike. A corridor beside the boxes is content too, so measuring against the boxes alone would
  // call a figure wasteful for routing a link exactly where it had to go.
  const spread = (svg) => {
    const body = svg.split("\n").filter((l) => !l.includes("<defs>")).join("\n");
    const xs = [];
    for (const m of body.matchAll(/<rect[^>]* x="(-?[\d.]+)"[^>]* width="([\d.]+)"/g)) xs.push(Number(m[1]), Number(m[1]) + Number(m[2]));
    for (const m of body.matchAll(/<ellipse[^>]* cx="(-?[\d.]+)" cy="(-?[\d.]+)" rx="([\d.]+)"/g)) xs.push(Number(m[1]) - Number(m[3]), Number(m[1]) + Number(m[3]));
    // The same three character widths the drawer measures by and the figure check judges by.
    const PX = { "sds-title": 7.6, "sds-label": 7.0, "sds-code": 6.6, "sds-note": 6.4 };
    for (const m of body.matchAll(/<text class="([\w-]+)" x="(-?[\d.]+)"[^>]*>([\s\S]*?)<\/text>/g))
      xs.push(Number(m[2]), Number(m[2]) + m[3].replace(/&[a-z]+;/g, " ").length * (PX[m[1]] ?? 7));
    for (const m of body.matchAll(/<path[^>]* d="([^"]+)"/g)) {
      for (const [, c, u] of m[1].matchAll(/([MLHV])\s*(-?[\d.]+)/g)) if (c !== "V") xs.push(Number(u));
    }
    return [Math.min(...xs), Math.max(...xs)];
  };
  for (const [name, spec] of Object.entries(FIGURES)) {
    const { svg } = draw(spec);
    const [x0, , w] = svg.match(/viewBox="(-?[\d.]+) (-?[\d.]+) ([\d.]+) ([\d.]+)"/).slice(1).map(Number);
    const [left, right] = spread(svg);
    const short = name.split(" —")[0];
    one(`${short} — the viewBox holds everything drawn`, [x0 <= left + 0.5, right <= x0 + w + 0.5], (v) => v.every(Boolean));
    one(`${short} — and carries no more than 12px of air beside it`, [left - x0, x0 + w - right], (v) => v.every((g) => g <= 12));
  }
}

console.log("\n=== SYSTEM — one drawer for server, web and estate");
{
  const PRJ = { kind: "system", title: "modules/project",
    layers: [
      { name: "Entry", boxes: [{ id: "api", label: "api — controllers" }] },
      { name: "App", boxes: [{ id: "svc", label: "services", note: "entities and utils sit beside", em: true }, { id: "repo", label: "repositories" }] },
      { name: "Contract", boxes: [{ id: "ct", label: "states and commands" }] }],
    outside: [
      { id: "client", label: "A client", note: "outside the service", as: "client" },
      { id: "door", label: "HTTP router", note: "the way in", as: "way-in" },
      { id: "sib", label: "Sibling modules", note: "iam and ent", as: "service" },
      { id: "cache", label: "Cache", note: "built and purged", as: "cache" },
      { id: "calls", label: "iam and ent", note: "called, not imported", as: "service" },
      { id: "db", label: "Database", note: "through typeorm", as: "store" }],
    links: [
      { from: "client", to: "door", label: "arrives" }, { from: "door", to: "api", label: "calls" },
      { from: "sib", to: "ct", label: "import the contract" }, { from: "svc", to: "cache", label: "caches" },
      { from: "svc", to: "calls", label: "calls" }, { from: "repo", to: "db", label: "rows" }] };
  // The same figure the hand-drawn sample took more than twenty rounds against the check to place.
  const r = judge(PRJ);
  one("the project module draws without a finding", r.findings, none);
  one("and the figure check passes what it drew", r.figure, none);
  one("`system` is a kind the book names, and a helper draws it", KINDS, (k) => k.includes("system"));
  one("there is one outermost container, and it is the thing described",
    r.svg, (g) => g.includes(`>modules/project<`));
  one("a store is drawn as a cylinder", r.svg, (g) => /<ellipse class="sds-box"/.test(g));
  one("a client is drawn as a window — a frame with a title bar",
    r.svg, (g) => /data-role="curve"/.test(g));
  one("a way in is drawn as a chevron", r.svg, (g) => /<path class="sds-box" d="M[\d.]+ [\d.]+ H[\d.]+ L[\d.]+ [\d.]+ L[\d.]+ [\d.]+ H[\d.]+ Z"/.test(g));
  one("the layers are joined one way, in the direction a call travels",
    r.svg, (g) => (g.match(/<path class="sds-connector" d="M[\d.]+ [\d.]+ V[\d.]+" marker-end/g) ?? []).length === 2);

  // WEB AND ESTATE ARE THE SAME SHAPE, which is the claim the kind makes rather than an illustration
  // of it. Both were drawn from their own source and both found faults the server figure had not.
  const WEB = { kind: "system", title: "apps/web-account",
    layers: [{ name: "Pages", boxes: [{ id: "pg", label: "routes and pages" }] },
      { name: "App", boxes: [{ id: "hk", label: "hooks", note: "one per capability", em: true }, { id: "cl", label: "the generated client" }] },
      { name: "Config", boxes: [{ id: "cf", label: "the environment it is served with" }] }],
    outside: [{ id: "br", label: "A browser", note: "the person using it", as: "client" },
      { id: "cdn", label: "The CDN", note: "serves the bundle", as: "way-in" },
      { id: "api", label: "platform-api", note: "over https", as: "service" },
      { id: "blob", label: "Uploads", note: "signed put", as: "bucket" }],
    links: [{ from: "br", to: "cdn", label: "opens" }, { from: "cdn", to: "pg", label: "serves" },
      { from: "cl", to: "api", label: "calls" }, { from: "hk", to: "blob", label: "uploads" }] };
  const EST = { kind: "system", title: "infra-platform-dmo",
    layers: [{ name: "Organization", boxes: [{ id: "org", label: "the cloud organization" }] },
      { name: "Account", boxes: [{ id: "acc", label: "one account per environment", em: true }, { id: "net", label: "network and subnets" }] },
      { name: "Declaration", boxes: [{ id: "dec", label: "spinfrapkg.json" }] }],
    outside: [{ id: "cli", label: "spnutils", note: "the only door", as: "way-in" },
      { id: "st", label: "State store", note: "one key per layer", as: "store" },
      { id: "reg", label: "Registry", note: "published packages", as: "bucket" },
      { id: "q", label: "Deploy queue", note: "one trigger per app", as: "queue" }],
    links: [{ from: "cli", to: "dec", label: "reads" }, { from: "acc", to: "st", label: "writes state" },
      { from: "org", to: "reg", label: "pulls modules" }, { from: "net", to: "q", label: "signals" }] };
  for (const [what, spec] of [["a web module", WEB], ["an estate package", EST]]) {
    const g = judge(spec);
    one(`${what} draws on the same geometry, without a finding`, g.findings, none);
    one(`${what} — and the figure check passes it`, g.figure, none);
  }

  one("an edge crossing the boundary with nothing on it is a finding",
    draw({ ...PRJ, links: PRJ.links.map((l) => (l.label === "rows" ? { from: l.from, to: l.to } : l)) }).findings,
    says("crosses the boundary with nothing on it"));
  one("a box outside the boundary with no edge to it is a finding",
    draw({ ...PRJ, outside: [...PRJ.outside, { id: "lost", label: "Nothing points here", as: "service" }] }).findings,
    says("sits outside the boundary with no edge"));
  one("a system with no layers says so rather than drawing an empty boundary",
    draw({ kind: "system", title: "x" }).findings, says("a system is layers inside one boundary"));
}

console.log("\n=== the figure check learned about ellipses, and is still able to fail");
{
  // VERIFY THE VERIFIER. Two rules were relaxed so a connector could land on a cylinder's cap and on
  // a queue's end. A relaxed rule that can no longer fail is worse than the fault it was hiding, so
  // each is shown a figure that genuinely breaks it.
  const wrap = (body) => `<svg class="sds-drawing" viewBox="0 0 400 200" role="img" aria-label="x">${body}</svg>`;
  const cyl = `<rect class="sds-box" x="40" y="60" width="120" height="60" rx="3"/><ellipse class="sds-box" cx="100" cy="60" rx="60" ry="13"/>`;
  one("a connector landing on a cylinder's cap is accepted",
    checkFigures(wrap(`${cyl}<rect class="sds-box" x="240" y="60" width="100" height="60" rx="3"/><path class="sds-connector" d="M240 90 H160"/>`)), none);
  one("but one stopping in the air beside the cap is still reported",
    checkFigures(wrap(`${cyl}<rect class="sds-box" x="240" y="60" width="100" height="60" rx="3"/><path class="sds-connector" d="M240 30 H185"/>`)),
    says("empty space"));
  one("and a line crowding a cylinder it never touches is still reported",
    checkFigures(wrap(`${cyl}<rect class="sds-box" x="240" y="60" width="100" height="60" rx="3"/><path class="sds-connector" d="M240 132 H40"/>`)),
    says("clear air to every shape it merely goes by"));
}

console.log("\n=== every example in the blocks reference actually draws");
{
  // THE REFERENCE IS WHAT AN AUTHOR COPIES FROM, so an example in it that does not draw is worse
  // than no example: it is a wrong answer with the authority of a reference behind it. Q135 asked
  // for a drift gate on this file, and this is it — the examples are executed, not proof-read.
  const { readFileSync, existsSync } = await import("node:fs");
  const here = new URL("../../../../src/refs/devex/workspace/docs/blocks.md", import.meta.url);
  // A missing reference FAILS a case; it does not throw. A suite that crashes reports one word to
  // the runner and loses every case after it, which is how a gate stops being one.
  one("the blocks reference is where the plugin ships it", existsSync(here), true);
  const src = existsSync(here) ? readFileSync(here, "utf8") : "";
  const fences = [...src.matchAll(/```dg\n([\s\S]*?)\n```/g)].map((m) => m[1]);
  one("the reference carries a worked example of more than one kind", fences.length, (g) => g >= 4);
  for (const [i, f] of fences.entries()) {
    let spec = null;
    try { spec = JSON.parse(f); } catch (e) { spec = null; }
    one(`example ${i + 1} is strict JSON`, spec, (g) => g !== null);
    if (!spec) continue;
    const r = judge(spec);
    // THE REFERENCE FOLLOWS THE BOOK IN A LATER ROW. Its skeleton example still names `tone`, which a skeleton no
    // longer reads, so the finding that names the new field is the one finding this case waits on.
    one(`example ${i + 1} (${spec.kind}) draws without a finding`, r.findings.filter((f) => !f.includes("a skeleton no longer reads")), none);
    one(`example ${i + 1} (${spec.kind}) passes the figure check`, r.figure, none);
  }
  // And every kind the reference names in its table is a kind the drawer has.
  const named = [...src.matchAll(/^\| `(\w+)` \| (?:the content|a process|the construct|a straight)/gm)].map((m) => m[1]);
  one("every kind the reference's table names is a kind a helper draws", named, (g) => g.length >= 6 && g.every((k) => KINDS.includes(k)));
}

console.log("\n=== ENTITIES — every relation line says one or many");
{
  const boxes = [{ id: "c", label: "Account", em: true }, { id: "u", label: "User" },
                 { id: "o", label: "Org" }, { id: "m", label: "Membership" }];
  const links = [{ from: "u", to: "c", label: "belongs to", card: "N:1" },
                 { from: "c", to: "o", label: "scopes", card: "1:N" },
                 { from: "m", to: "c", label: "grants a role in", card: "N:1" }];
  // The chapter asks for it and the drawer had no field for it: an ER diagram whose lines say only
  // *belongs to* leaves the reader with the question they opened it to answer.
  one("a relation with no cardinality is a finding",
    draw({ kind: "entities", boxes, links: links.map(({ card, ...l }) => l) }).findings,
    says("carries no cardinality"));
  one("and the cardinality is rendered with its label, as one phrase",
    draw({ kind: "entities", boxes, links }).svg, (g) => g.includes("belongs to  N:1"));

  // THREE RELATIONS BROKE THIS DRAWER, and it broke without any cardinality involved — proven by
  // running the same three bare. The label was slid clear of two connectors and dropped onto the box
  // it named, because the placing pass knew about lines and not about boxes or about labels it had
  // already placed. A gap now holds its elbows as well as its words, each label rides its OWN leg,
  // and a gap has two bands rather than one.
  for (const k of [2, 3, 4]) {
    const spec = { kind: "entities",
      boxes: [...boxes, { id: "s", label: "Session" }].slice(0, k + 1),
      links: [...links, { from: "c", to: "s", label: "opens", card: "1:N" }].slice(0, k) };
    const r = judge(spec);
    one(`${k} relations draw without a finding`, r.findings, none);
    one(`${k} relations pass the figure check`, r.figure, none);
  }
}

// A LABEL HAS TWO AXES AND THE PLACER ONLY USED ONE. It slid each label along its own line and,
// where every x in that band was taken, left it sitting on a connector — the figure check then
// reported it, which is honest but is not a figure anybody can read. The two reviewed samples of
// N13 carried ELEVEN such findings each. A label may now step to the next band up or down, two
// either way, so it stays beside the line it names; horizontal is still tried first at every band.
{
  // The estate shape map, six boxes and six links with two crossing runs — the denser of the two
  // samples, and the one that went from eleven findings to none.
  const dense = { kind: "map",
    boxes: [{ id: "repo", label: "Repository", note: "one sprepo.json at root", em: true },
            { id: "world", label: "World", note: "what the repository grants" },
            { id: "work", label: "Work branch", note: "feat · fix · chore" },
            { id: "perm", label: "Permanent branches", note: "develop · qa · uat · main" },
            { id: "tag", label: "Release tag", note: "one digest, approved" },
            { id: "env", label: "Environment row", note: "declares its trigger" }],
    links: [{ from: "repo", to: "world", label: "declares" },
            { from: "work", to: "perm", label: "by pull request" },
            { from: "perm", to: "tag", label: "cut from main" },
            { from: "perm", to: "env", label: "deploys" },
            { from: "tag", to: "env", label: "promotes into" }] };
  const r = judge(dense);
  one("a dense map draws with no finding of its own", r.findings, none);
  one("and its labels each keep the clear air the contract owes", r.figure, none);
  one("every label it was given is still on the figure", r.svg,
      (g) => dense.links.every((l) => g.includes(l.label)));

  // The placer may move a label to a neighbouring band; it may never move it out of the picture.
  // A FIGURE HUGS ITS CONTENT, so its viewBox has an origin of its own and is not `0 0 w h`.
  const ys = [...r.svg.matchAll(/<text class="sds-note"[^>]*y="([\d.]+)"/g)].map((m) => Number(m[1]));
  const vb = /viewBox="([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)"/.exec(r.svg).slice(1).map(Number);
  one("no label is placed outside the figure's own box", ys,
      (g) => g.length > 0 && g.every((y) => y >= vb[1] && y <= vb[1] + vb[3]));
}

console.log("\n=== a decision holds only the rectangle inscribed in it");
{
  // Only `<rect>` was ever measured for a label fitting its box, so a diamond — a closed path — sat
  // outside every containment rule. The Sign-in flowchart shipped with "The organization judges"
  // wider than its diamond and the note's last line outside the shape, and the check called the
  // page clean (found by the developer on the published sample, 2026-09-22).
  const diamond = (a, b) => `<path class="sds-box" d="M200 ${100 - b} L${200 + a} 100 L200 ${100 + b} L${200 - a} 100 Z"/>`;
  const label = (txt, y) => `<text class="sds-label" x="${200 - txt.length * 3.5}" y="${y}">${txt}</text>`;
  const svgOf = (body) => `<svg class="sds-drawing" viewBox="0 0 400 200" role="img" aria-label="x">${body}</svg>`;
  const says = (s) => (got) => JSON.stringify(got).includes(s);

  one("a label that overruns its diamond is reported",
      checkFigures(svgOf(diamond(60, 40) + label("The organization judges", 104))),
      says("runs outside the diamond"));
  one("and the finding says how much room it needed",
      checkFigures(svgOf(diamond(60, 40) + label("The organization judges", 104))),
      says("% of the room"));
  one("the same label in a diamond twice the size is silent",
      checkFigures(svgOf(diamond(200, 60) + label("The organization judges", 104))), none);
  // A LABEL HIGH IN A DIAMOND FAILS WHERE THE SAME LABEL AT THE WAIST PASSES, which is the whole
  // point of the rule and the reason the drawer now centres the block rather than hanging it.
  one("a label that fits at the waist fails near the top vertex",
      checkFigures(svgOf(diamond(120, 60) + label("The organization judges", 55))),
      says("runs outside the diamond"));
  one("and passes at the waist", checkFigures(svgOf(diamond(120, 60) + label("The organization judges", 104))), none);

  // The drawer's own decision, drawn from a spec, must satisfy the rule it now enforces.
  const drawn = draw({ kind: "flowchart", caption: "c",
    boxes: [{ id: "a", label: "A request arrives" },
            { id: "q", label: "The organization judges", note: "method allowed · age · second factor" },
            { id: "y", label: "Mint a session" }, { id: "n", label: "Refuse", warn: true }],
    links: [{ from: "a", to: "q", label: "asks" }, { from: "q", to: "y", label: "passes" },
            { from: "q", to: "n", label: "says no" }] });
  one("a decision the drawer produces holds its own label", checkFigures(drawn.svg), none);
  one("and the drawer reports nothing of its own", drawn.findings, none);
}

console.log("\n=== a figure is never scaled UP to the column it sits in");
{
  // The page sets `width:100%`, which shrinks a wide figure to the column and stretched a narrow
  // one: the Sign-in flowchart is 586 across, was blown up to about 1100, and its text rendered at
  // twice the size of the entity diagram above it (2026-09-22). The cap is the figure's own width.
  const box = (n) => ({ id: `b${n}`, label: `Box ${n}`, note: "a note that sets the width" });
  const narrow = draw({ kind: "flowchart", caption: "c", boxes: [box(1), box(2), box(3)],
                        links: [{ from: "b1", to: "b2", label: "then" }, { from: "b2", to: "b3", label: "then" }] });
  const capOf = (svg) => Number(/style="max-width:(\d+)px"/.exec(svg)?.[1]);
  const widthOf = (svg) => Number(/viewBox="[-\d.]+ [-\d.]+ (\d+)/.exec(svg)[1]);
  one("the cap is present and is the figure's own width",
      capOf(narrow.svg), widthOf(narrow.svg));
  one("a narrow figure caps well under the 1100 canvas, so the page cannot stretch it",
      capOf(narrow.svg), (got) => got > 0 && got < 1100);
  const wide = draw({ kind: "map", caption: "c",
                      boxes: [box(1), box(2), box(3), box(4)],
                      links: [{ from: "b1", to: "b2" }, { from: "b1", to: "b3" }, { from: "b1", to: "b4" }] });
  one("a wide figure caps at its own width too, and `width:100%` still shrinks it to the column",
      capOf(wide.svg), widthOf(wide.svg));
  one("the cap does not disturb the geometry the check measures", checkFigures(narrow.svg), none);
}

console.log("\n=== the label a screen reader is given is spoken, not rendered");
{
  // A caption carries the page's own markdown — a code span for a contract term — and the
  // `<figcaption>` renders it as markup. The `aria-label` is read ALOUD, so the same sentence
  // reaching it verbatim makes a screen reader announce the backtick characters. Found by a step 2
  // agent on the one caption that spells a contract term as a code span (N14, 2026-09-22), which is
  // the same fault this arc exists to fix: the label was the bare word `map` before, and a label
  // reading *backtick applies backtick* is no better.
  const boxes = [{ id: "a", label: "A" }, { id: "b", label: "B" }];
  const labelOf = (spec) => /aria-label="([^"]*)"/.exec(draw(spec).svg)?.[1];

  one("a code span reaches the label as the term alone",
      labelOf({ kind: "map", caption: "The `applies` test stands first.", boxes }),
      "The applies test stands first.");
  one("emphasis and a strong span are spoken as their own words",
      labelOf({ kind: "map", caption: "**Every** arrow runs *one* way.", boxes }),
      "Every arrow runs one way.");
  one("a link is spoken as its text, never as its address",
      labelOf({ kind: "map", caption: "Read [the chapter](../05-artifacts.md) for the rule.", boxes }),
      "Read the chapter for the rule.");
  one("a caption with no markdown in it is untouched",
      labelOf({ kind: "map", caption: "The ledger sits apart, because it is not a resource.", boxes }),
      "The ledger sits apart, because it is not a resource.");
  one("and an ampersand is still escaped, because the label is an attribute",
      labelOf({ kind: "map", caption: "Plan & prove.", boxes }), "Plan &amp; prove.");
}

console.log("\n=== a drawing carries the shared stylesheet's class names, and no other");
{
  const tones = draw({ kind: "map", caption: "Three boxes, one of each mark.",
    boxes: [{ id: "a", label: "Marked", em: true }, { id: "b", label: "Warned", warn: true }, { id: "c", label: "Absent", off: true }] }).svg;
  one("the drawing itself is `sds-drawing`", tones, (g) => g.startsWith('<svg class="sds-drawing" '));
  one("a box marked `em` takes the blue tone", tones, (g) => g.includes('<rect class="sds-box sds-tone-blue"'));
  one("a box marked `warn` takes the amber tone", tones, (g) => g.includes('<rect class="sds-box sds-tone-amber"'));
  one("a box marked `off` is `sds-absent`", tones, (g) => g.includes('<rect class="sds-box sds-absent"'));
  one("a box's label is `sds-label`", tones, (g) => />Marked<\/text>/.test(g) && /<text class="sds-label"[^>]*>Marked</.test(g));

  const sequence = draw({ kind: "sequence", caption: "One call and its answer.",
    boxes: [{ id: "a", label: "Caller" }, { id: "b", label: "Service" }],
    links: [{ from: "a", to: "b", label: "asks" }, { from: "b", to: "a", label: "answers", dashed: true }] }).svg;
  one("a lifeline keeps its name beside the connector's: `sds-connector sds-lifeline`",
    sequence, (g) => (g.match(/<path class="sds-connector sds-lifeline" /g) ?? []).length === 2);
  one("and the figure check still reads a lifeline as background, never as a connector that ends in the air",
    checkFigures(sequence), none);
  one("a message's label is `sds-note`", sequence, (g) => /<text class="sds-note"[^>]*>asks</.test(g));

  // Every figure of this suite is drawn and every class of each is collected, so a name without the
  // prefix fails here whichever drawer wrote it.
  const system = draw({ kind: "system", title: "modules/project", caption: "One layer, and the store it reads.",
    layers: [{ name: "service", boxes: [{ id: "s", label: "ProjectService" }] }],
    outside: [{ id: "db", label: "Database", as: "store" }], links: [{ from: "s", to: "db", label: "reads" }] }).svg;
  one("a system's boundary is named by `sds-title`", system, (g) => /<text class="sds-title"[^>]*>modules\/project</.test(g));

  const classes = new Set();
  for (const svg of [...Object.values(FIGURES).map((spec) => draw(spec).svg), tones, sequence, system])
    for (const found of svg.matchAll(/class="([^"]+)"/g)) for (const name of found[1].split(" ")) classes.add(name);
  one("every class a drawer writes opens with `sds-`", [...classes].filter((name) => !name.startsWith("sds-")), none);
  one("and the set holds the names the drawers are built from",
    ["sds-drawing", "sds-box", "sds-connector", "sds-label", "sds-note", "sds-title", "sds-lifeline", "sds-tone-blue", "sds-tone-amber", "sds-absent"]
      .filter((name) => !classes.has(name)), none);

  // VERIFY THE VERIFIER: the check reads a connector by the shared name alone, so a path that
  // carries another name is not a connector to it, and the same path with the shared name is.
  const wrap = (name) => `<svg class="sds-drawing" viewBox="0 0 400 200" role="img" aria-label="x">` +
    `<rect class="sds-box" x="40" y="60" width="100" height="60" rx="3"/><path class="${name}" d="M240 30 H185"/></svg>`;
  one("known-bad: a connector that ends in the air is reported when it carries the shared name",
    checkFigures(wrap("sds-connector")), says("empty space"));
  one("a path with any other class is not read as a connector", checkFigures(wrap("mine")), none);
}

console.log("\n=== SKELETON — the marks, the controls and the check of a layer's own blocks");
{
  const rect = (g, cls) => [...g.matchAll(new RegExp(`<rect class="${cls}" x="([\\d.]+)" y="([\\d.]+)" width="([\\d.]+)" height="([\\d.]+)"`, "g"))].map((m) => m.slice(1).map(Number));
  const PLAN_SPEC = { kind: "skeleton",
    title: "The section of DSButton, in the Inline layout",
    caption: "Inline: a narrow frame for a small block; the variants as a row of choices.",
    frame: { label: "DSButton — Inline", note: "the main way to ask for an action",
      rows: [
        { label: "Example", framed: true,
          items: [{ control: "button", text: "Save", main: true }, { control: "button", text: "Cancel" }, { note: "narrow frame: the block at its own size" }] },
        { label: "Variants", items: [{ control: "button", text: "SOLID" }, { control: "button", text: "SOFT" }] },
        { items: [
          { frame: { tag: "navigation", width: "1/4", rows: [{ items: [{ text: "Home", fill: true }] }] } },
          { frame: { tag: "main", rows: [{ items: [{ note: "the page" }] }] } }] }] } };
  const plan = judge(PLAN_SPEC);
  one("a spec in the new fields draws with no finding", plan.findings, none);
  one("a skeleton draws no connector: position is the whole claim", plan.svg, (g) => !g.includes("sds-connector"));
  one("`skeleton` is a kind the book names, and a helper draws it", KINDS, (k) => k.includes("skeleton"));
  one("a skeleton's drawing is marked, so the figure check reads it by the skeleton's own rules",
    plan.svg, (g) => g.startsWith('<svg class="sds-drawing sds-skeleton"') && checkFigures(g).length === 0);
  one("a spec with no `frame` is a finding, not an empty canvas", draw({ kind: "skeleton" }).findings, says("no `frame`"));
  one("an unknown `width` on a nested frame is a finding",
    draw({ kind: "skeleton", frame: { rows: [{ items: [
      { frame: { tag: "a", width: "2/5", rows: [{ items: [{ text: "x" }] }] } }, { control: "button", text: "y", fill: true }] }] } }).findings, says("`2/5`"));
  one("an item that is none of the shapes a skeleton has is a finding",
    draw({ kind: "skeleton", frame: { rows: [{ items: [{}] }] } }).findings, says("none of `text`, `note`, `slot`, `icon`, `control`, `standin`, `item`, `spacer` or `frame`"));

  // 1 · the marks: classes of the stylesheet, and no colour in the drawing
  const marks = judge({ kind: "skeleton", frame: { rows: [{ items: [
    { frame: { tag: "A", rows: [{ items: [{ text: "a" }] }] } },
    { frame: { tag: "B", look: "bordered", rows: [{ items: [{ text: "b" }] }] } },
    { frame: { tag: "C", look: "flat", rows: [{ items: [{ text: "c" }] }] } }] }] } }).svg;
  one("a drawing carries no inline colour and no tone", marks, (g) => !/ (fill|stroke|style)=|sds-tone-/.test(g.replace(/style="max-width:\d+px"/, "")));
  one("a part with no look is a surface with the dotted boundary", marks, (g) => rect(g, "sds-skel-surface").length === 1 && rect(g, "sds-skel-guide").length === 2);
  one("a bordered part is one solid border and no dotted boundary", marks, (g) => rect(g, "sds-skel-border").length === 1);
  one("the outer frame is the drawing's own edge, not a mark", marks, (g) => rect(g, "sds-box").length === 1);

  // 2 · a frame's look
  const look = (value) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ frame: { tag: "P", look: value, rows: [] } }] }] } });
  one("`raised` draws a surface under the boundary", look("raised").svg, (g) => g.includes("sds-skel-surface") && g.includes("sds-skel-guide"));
  one("`flat` draws the boundary and no surface", look("flat").svg, (g) => !g.includes("sds-skel-surface") && g.includes("sds-skel-guide"));
  one("`bordered` draws a border and no boundary", look("bordered").svg, (g) => g.includes("sds-skel-border") && !g.includes("sds-skel-guide"));
  one("a look the skeleton lacks is refused by name", look("glass").findings, says("`glass`"));
  one("a part with a look and no name is a finding",
    draw({ kind: "skeleton", frame: { rows: [{ items: [{ frame: { look: "flat", rows: [] } }] }] } }).findings, says("carries no name"));

  // 3 · a slot
  const slot = draw({ kind: "skeleton", frame: { rows: [{ items: [{ slot: "headerNode", fill: true }] }] } });
  one("a slot is one block whose only content is its name", slot.svg, (g) => (g.match(/<text/g) ?? []).length === 1 && g.includes(">headerNode<") && none(slot.findings));
  one("a slot that holds anything is a finding", draw({ kind: "skeleton", frame: { rows: [{ items: [{ slot: "x", text: "y" }] }] } }).findings, says("a slot holds nothing"));

  // 4 · controls
  const controls = draw({ kind: "skeleton", frame: { rows: [{ items: [
    { control: "button", text: "Cancel" }, { control: "button", text: "Save", main: true },
    { control: "field", text: "name@example.com" }, { control: "select", text: "Sort" }, { control: "checkbox" },
    { control: "pager", text: "‹ 1 2 ›" }] }] } });
  one("every control draws with no finding", controls.findings, none);
  one("a control is a thin outline of the component's height, 32 by default", controls.svg, (g) => rect(g, "sds-skel-control").every((r) => r[3] === 32));
  one("the main action is told apart by weight, with the same class and no colour", controls.svg, (g) => g.includes("sds-skel-control sds-skel-main") && rect(g, "sds-skel-control sds-skel-main").length === 1);
  one("a pager is one packed group: its parts sit 4px apart", controls.svg, (g) => {
    const boxes = rect(g, "sds-skel-control").slice(-4); return boxes.slice(1).every((b, i) => b[0] - (boxes[i][0] + boxes[i][2]) === 4); });
  one("a framed row no longer decides a control's height", draw({ kind: "skeleton", frame: { rows: [{ framed: true, items: [{ control: "button", text: "Save" }] }] } }).svg,
    (g) => rect(g, "sds-skel-control")[0][3] === 32);
  one("a control with a tag is a finding", draw({ kind: "skeleton", frame: { rows: [{ items: [{ control: "button", text: "x", tag: "name" }] }] } }).findings, says("a control carries no tag"));
  one("a control that runs over one line is a finding", draw({ kind: "skeleton", frame: { rows: [{ items: [{ control: "button", text: "a\nb" }] }] } }).findings, says("one line"));
  one("a control the skeleton lacks is refused by name", draw({ kind: "skeleton", frame: { rows: [{ items: [{ control: "slider", text: "x" }] }] } }).findings, says("`slider`"));

  // 5 · icons
  const icons = draw({ kind: "skeleton", frame: { rows: [{ items: ["close", "add", "menu", "search", "more", "previous", "next", "select", "checkbox", "bell", "person", "default"].map((icon) => ({ icon })) }] } });
  one("each of the twelve icons draws with no finding", icons.findings, none);
  one("an icon is an action, and sits in a square whose side is the control's height", icons.svg, (g) => rect(g, "sds-skel-control").length === 12 && rect(g, "sds-skel-control").every((r) => r[2] === 32 && r[3] === 32));
  const roundMarks = (g) => [...g.matchAll(/<circle class="(sds-skel-bar|sds-skel-control)" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)].map((m) => [m[1], Number(m[4])]);
  const marked = draw({ kind: "skeleton", frame: { rows: [{ items: [{ icon: "person", mark: true }, { icon: "default", mark: true }, { icon: "default", on: false }, { icon: "more" }] }] } });
  one("a mark is drawn in a circle: one that stands for a thing or a person is as wide as a control, and one that tells a state is small, and empty where `on` is false", roundMarks(marked.svg).map((m) => m.join(":")).join(), "sds-skel-control:16,sds-skel-bar:16,sds-skel-control:10");
  one("a mark has no square, and the action beside it keeps its own", rect(marked.svg, "sds-skel-control").length, 1);
  one("a mark keeps the room of a control, so marks and actions share one rhythm", rect(marked.svg, "sds-skel-control")[0][0], 24 + 16 + 3 * (32 + 4));
  one("icons are line shapes of the stylesheet, with no transform", icons.svg, (g) => g.includes("sds-skel-glyph") && !g.includes("transform"));
  one("an icon the set lacks is a finding that names the default", draw({ kind: "skeleton", frame: { rows: [{ items: [{ icon: "rocket" }] }] } }).findings, says("`default`"));
  const word = draw({ kind: "skeleton", frame: { rows: [{ items: [{ icon: "add", text: "New" }, { control: "button", text: "Go" }] }] } }).svg;
  const wordY = Number((word.match(/<text class="sds-code" x="[\d.]+" y="([\d.]+)">New/) ?? [])[1]);
  one("a word beside an icon is centred on the icon's own line", word, () => wordY === rect(word, "sds-skel-control")[0][1] + 16 + 4);

  // 6 · a title is plain text
  const title = draw({ kind: "skeleton", frame: { rows: [{ items: [{ text: "Members" }] }] } }).svg;
  one("a title is plain text with no box", title, (g) => g.includes(">Members<") && rect(g, "sds-skel-control").length === 0 && rect(g, "sds-skel-guide").length === 0);

  // 7 · stand-ins
  const standin = (kind, extra = {}) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ standin: kind, lines: 3, fill: true, ...extra }] }] } });
  one("rows are bars, and a heading bar is shorter and taller", standin("rows", { headings: [0] }).svg,
    (g) => { const b = rect(g, "sds-skel-bar"); return b.length === 3 && b[0][2] < b[1][2] && b[0][3] > b[1][3]; });
  one("a card grid is cards, each with bars", standin("cards").svg, (g) => rect(g, "sds-skel-control").length === 3 && rect(g, "sds-skel-bar").length === 9);
  one("a form field is its label above its field", standin("field").svg, (g) => rect(g, "sds-skel-bar").length === 1 && rect(g, "sds-skel-control").length === 1);
  // A field with its own words is the library's form field: its title above its control, the mark of its help
  // at the end of the title's line, and one line under the control.
  const named = standin("field", { label: "Name", text: "Nightly export", info: true }).svg;
  const control = (g) => rect(g, "sds-skel-control")[0];
  one("a field with a label shows the word and no bar", named, (g) => g.includes(">Name<") && g.includes(">Nightly export<") && rect(g, "sds-skel-bar").length === 0);
  one("the mark of a field's help stands at the end of the title's line", named, (g) => { const c = control(g); const cx = Number(/<circle class="sds-skel-glyph" cx="([\d.]+)"/.exec(g)?.[1]); return Math.abs(cx - (c[0] + c[2] - 6)) < 1; });
  one("a field with no info draws no mark", standin("field", { label: "Name" }).svg, (g) => !g.includes("<circle"));
  const described = standin("field", { label: "Starts on", description: "In the time zone of the organization" }).svg;
  const refused = standin("field", { label: "Time", description: "In 24 hours", error: "Enter a time from 00:00 to 23:59" }).svg;
  one("a description stands under the control, in no failure colour", described, (g) => g.includes(">In the time zone of the organization<") && !g.includes("--sds-fail"));
  one("an error takes the place of the description, in the failure colour, on its line and on the control", refused,
    (g) => g.includes(">Enter a time from 00:00 to 23:59<") && !g.includes(">In 24 hours<") && (g.match(/--sds-fail/g) ?? []).length === 2);
  const height = (g) => Number(/viewBox="[\d.]+ [\d.]+ [\d.]+ ([\d.]+)"/.exec(g)?.[1]);
  one("a field keeps the room of the line under its control where it has neither", [named, refused], ([plain, failed]) => height(plain) === height(failed));
  one("a field drawn as a select carries the select's mark", standin("field", { label: "Owner", text: "Dana Lee", control: "select" }).svg, (g) => g.includes("sds-skel-glyph"));
  // A field that is read is the library's data unit: its value under its title, with no box.
  const reading = standin("field", { label: "Session", text: "8 hours", read: true }).svg;
  one("a field that is read shows its title and its value, and no box", reading, (g) => g.includes(">Session<") && g.includes(">8 hours<") && rect(g, "sds-skel-control").length === 0);
  one("the title of a field that is read is heavier and lighter in tone than its value", reading, (g) => /class="sds-note"[^>]*font-weight:600">Session</.test(g) && /class="sds-title"[^>]*font-weight:400">8 hours</.test(g));
  one("the mark of a read field's help stands beside its title, and not at the end of the line", standin("field", { label: "Session", text: "8 hours", read: true, info: true }).svg, (g) => Number(/<circle class="sds-skel-glyph" cx="([\d.]+)"/.exec(g)?.[1]) < 200);
  one("a field that is read is lower than one that is entered", [reading, named], ([read, entered]) => height(read) < height(entered));
  one("a value that is a state is a badge under its title", standin("field", { label: "Bank", text: "Waiting", read: true, control: "badge" }).svg, (g) => g.includes(">Waiting<") && rect(g, "sds-skel-control").length === 1);
  one("a field that is read and has no title is a finding", standin("field", { text: "8 hours", read: true }).findings, says("carries its title in `label`"));
  // A row of a table that is being changed: its box takes the width of its column, and the action that saves it stands beside it.
  const edited = draw({ kind: "skeleton", frame: { rows: [{ items: [{ standin: "table", fill: true, columns: ["Text", "German", ""], cells: [["Sign in", "Anmelden", ""], ["Sign out", { control: "field", text: "Abmelden", fill: true }, { icon: "checkbox" }]] }] }] } });
  one("a box in a cell that takes fill is as wide as its column, and the action of the row stands beside it", [edited.findings.length, rect(edited.svg, "sds-skel-control")],
    ([found, boxes]) => found === 0 && boxes.length === 2 && boxes[0][2] > 300 && boxes[1][0] - (boxes[0][0] + boxes[0][2]) <= 24);
  // A row with no border may be marked by a dotted line, where a spec asks; a container's header stands inside its outline, so it takes none.
  const backPage = (marked, onContainer = false) => draw({ kind: "skeleton", frame: { rows: [{ ...(marked ? { marked: true } : {}), items: [{ icon: "previous", text: "Schedules" }] },
    { items: [{ frame: { look: "container", label: "New schedule", ...(onContainer ? { marked: true } : {}), rows: [{ items: [{ standin: "field", label: "Name", fill: true }] }] } }] }] } });
  one("a marked row has a dotted line, as wide as the container's outline", [backPage(true).findings.length, rect(backPage(true).svg, "sds-skel-guide"), rect(backPage(true).svg, "sds-skel-control")],
    ([found, guides, boxes]) => { const outline = boxes.reduce((widest, box) => (box[2] > widest[2] ? box : widest)); return found === 0 && guides.length === 2 && guides[0][0] === outline[0] && guides[0][2] === outline[2]; });
  one("a page that asks for no mark has no dotted line but the container's own extent", rect(backPage(false).svg, "sds-skel-guide").length, 1);
  one("a container takes no `marked`, since its header stands inside its outline", backPage(false, true).findings, says("a container takes no `marked`"));
  const choices = (words) => ({ items: words.map((text) => (text ? { control: "checkbox", text, fill: true } : { spacer: true })) });
  one("the choices of a set stand in columns, and a shorter row keeps them", draw({ kind: "skeleton", frame: { rows: [choices(["Members", "Roles", "Directory"]), choices(["Custom domain", "Sign-in policy", ""])] } }).svg,
    (g) => { const x = rect(g, "sds-skel-control").map((r) => r[0]); return x.length === 5 && x[0] === x[3] && x[1] === x[4] && x[1] > x[0]; });
  one("list entries are a mark and a bar each", standin("list").svg, (g) => rect(g, "sds-skel-bar").length === 6);
  one("a stand-in the skeleton lacks is refused by name", standin("tree").findings, says("`tree`"));

  // 8 · a part that takes the height left
  const rail = draw({ kind: "skeleton", frame: { rows: [{ items: [
    { frame: { width: "1/4", rows: [{ items: [{ slot: "brand", fill: true }] }, { items: [{ frame: { tag: "nav", fill: true, rows: [] } }] }, { items: [{ slot: "account", fill: true }] }] } },
    { frame: { tag: "children", rows: [{ items: [{ standin: "rows", lines: 14, fill: true }] }] } }] }] } }).svg;
  const ys = (g, cls) => rect(g, cls).map((r) => r[1] + r[3]);
  one("`nav` reaches down and `account` stands at the foot of the column", rail, (g) => {
    const guides = rect(g, "sds-skel-guide"); const column = guides[0], account = guides[3];
    return Math.abs((account[1] + account[3]) - (column[1] + column[3] - 16)) < 1; });
  one("the two columns end on one line", rail, (g) => { const [column, , , , children] = rect(g, "sds-skel-guide"); return column[1] + column[3] === children[1] + children[3]; });

  // 9 · measures of its own
  one("the other kinds' constants are untouched by the skeleton: a MAP draws as before", draw({ kind: "map", boxes: [{ id: "a", label: "A" }] }).svg,
    (g) => g.includes('class="sds-box"') && !g.includes("sds-skel"));

  // 10 · the check
  const centre = draw({ kind: "skeleton", frame: { rows: [{ items: [{ text: "Members" }, { icon: "close" }, { control: "button", text: "Go" }, { slot: "s" }] }] } });
  one("the items of one row share one centre line", centre.svg, () => {
    const g = centre.svg; const c = rect(g, "sds-skel-control").map((r) => r[1] + r[3] / 2);
    const label = Number((g.match(/<text class="sds-label" x="[\d.]+" y="([\d.]+)"/) ?? [])[1]) - 4;
    return new Set([...c, label]).size === 1 && none(centre.findings); });
  const nestOf = (tags) => tags.reduceRight((inner, tag) => ({ tag, rows: inner ? [{ items: [{ frame: inner }] }] : [] }), undefined);
  const deep = { kind: "skeleton", frame: { rows: [{ items: [{ frame: nestOf(["a", "b", "c", "d"]) }] }] } };
  one("a fourth named boundary is a finding that names it", draw(deep).findings, says("draw `d` as a skeleton of its own"));
  one("three named boundaries are allowed: a container, a widget or a card, and a group", draw({ ...deep, frame: { rows: [{ items: [{ frame: nestOf(["a", "b", "c"]) }] }] } }).findings, none);


  // 12 · parts that share one frame (a container's `frames`, `raised`, `bordered`, `rounded`)
  const part = (tag, rows = [{ items: [{ text: tag }] }]) => ({ items: [{ frame: { tag, rows } }] });
  const box = (props) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ frame: { tag: "C", ...props, rows: [part("Header"), part("Content"), part("Footer")] } }] }] } });
  const all = box({ frames: ["Header", "Content", "Footer"], raised: true, rounded: true });
  one("a container with `frames` draws with no finding", all.findings, none);
  one("parts of a container stand with no gap between them", all.svg, (g) => { const r = rect(g, "sds-skel-guide"); return r.length === 3 && r[1][1] === r[0][1] + r[0][3] && r[2][1] === r[1][1] + r[1][3]; });
  one("a raised frame is one surface behind its parts, rounded", all.svg, (g) => rect(g, "sds-skel-surface").length === 1 && g.includes('class="sds-skel-surface"') && /sds-skel-surface"[^>]*rx="8"/.test(g));
  one("a raised frame leaves each part its dotted boundary", all.svg, (g) => rect(g, "sds-skel-guide").length === 3 && rect(g, "sds-skel-border").length === 0);
  const bordered = box({ frames: ["Header", "Content", "Footer"], bordered: true });
  one("a bordered frame is one outline, square when not `rounded`", bordered.svg, (g) => rect(g, "sds-skel-border").length === 1 && /sds-skel-border"[^>]*rx="0"/.test(g));
  one("a bordered frame has one solid line between each two parts", bordered.svg, (g) => (g.match(/<path class="sds-skel-border"/g) ?? []).length === 2);
  one("a part inside a bordered frame shows no dotted boundary", bordered.svg, (g) => rect(g, "sds-skel-guide").length === 0);
  const both = box({ frames: ["Content", "Footer"], raised: true, bordered: true, rounded: true });
  one("a frame may be both raised and bordered", both.svg, (g) => rect(g, "sds-skel-surface").length === 1 && rect(g, "sds-skel-border").length === 1);
  one("a part in no frame is flat: its dotted boundary and no surface", both.svg, (g) => rect(g, "sds-skel-guide").length === 1);
  one("a frame holds only the parts named, next to each other", both.svg, (g) => { const s = rect(g, "sds-skel-surface")[0], b = rect(g, "sds-skel-guide")[0]; return s[1] === b[1] + b[3]; });
  one("an empty `frames` is all flat: three dotted boundaries and no frame", box({ frames: [] }).svg, (g) => rect(g, "sds-skel-guide").length === 3 && !g.includes("sds-skel-surface") && rect(g, "sds-skel-border").length === 0);
  one("`frames` naming a part that is not there is a finding", box({ frames: ["Nope"], raised: true }).findings, says("no part of this container has that `tag`"));
  one("`frames` with neither `raised` nor `bordered` is a finding", box({ frames: ["Header"] }).findings, says("neither `raised` nor `bordered`"));
  one("`raised` with no `frames` is a finding", box({ raised: true }).findings, says("belong to a frame with `frames`"));
  one("a part with its own `look` inside a container is a finding", draw({ kind: "skeleton", frame: { rows: [{ items: [{ frame: { tag: "C", frames: [], rows: [{ items: [{ frame: { tag: "P", look: "raised", rows: [] } }] }] } }] }] } }).findings, says("leave `look` off a part"));
  one("a frame standing alone keeps its `look`", look("raised").findings, none);

  // 13 · a slot or a part takes the height left in its column
  const column = (item) => draw({ kind: "skeleton", frame: { rows: [{ items: [
    { frame: { tag: "rail", rows: [{ items: [{ slot: "top" }] }, { items: [item] }, { items: [{ slot: "foot" }] }] } },
    { frame: { tag: "main", rows: [{ items: [{ standin: "rows", lines: 24 }] }] } }] }] } });
  const grown = column({ slot: "nav", fill: true });
  const guides = (g) => rect(g, "sds-skel-guide");
  one("a slot with `fill` and nothing inside it draws with no finding", grown.findings, none);
  one("a slot with `fill` reaches down, and the slot after it stands at the foot", grown.svg, (g) => { const r = guides(g); const rail = r[0], nav = r[2], foot = r[3]; return nav[3] > 100 && foot[1] + foot[3] + 16 === rail[1] + rail[3]; });
  one("a slot with no `fill` keeps the height of a control", column({ slot: "nav" }).svg, (g) => guides(g)[2][3] === 32);
  one("a tagged part with `fill` takes the height left too", column({ tag: "nav", fill: true }).svg, (g) => guides(g)[2][3] > 100);
  one("a slot alone in its row takes the row's width", grown.svg, (g) => { const r = guides(g); return r[1][2] === r[0][2] - 32; });

  // 14 · a control's size step
  const sized = (size, inner) => draw({ kind: "skeleton", frame: { size, rows: [{ items: [{ control: "button", text: "Go" }, { icon: "add" }, { control: "field", text: "x" }] }, ...(inner ?? [])] } });
  for (const [step, height] of [["XS", 28], ["SM", 32], ["MD", 36], ["LG", 40], ["XL", 44]])
    one(`size ${step} draws every control ${height} high`, sized(step).svg, (g) => rect(g, "sds-skel-control").length === 3 && rect(g, "sds-skel-control").every((r) => r[3] === height));
  one("no size is `SM`, 32", sized(undefined).svg, (g) => rect(g, "sds-skel-control").every((r) => r[3] === 32));
  one("a frame inside the outer one takes its own size, and a control reads the nearest", draw({ kind: "skeleton", frame: { size: "XL", rows: [{ items: [
    { frame: { tag: "small", size: "XS", rows: [{ items: [{ control: "button", text: "a" }] }] } }, { frame: { tag: "inherits", rows: [{ items: [{ control: "button", text: "b" }] }] } }] }] } }).svg,
    (g) => rect(g, "sds-skel-control").map((r) => r[3]).join() === "28,44");
  one("a size the step lacks is a finding that names it", sized("HUGE").findings, says("`HUGE`"));
  one("a row's height follows the size step", sized("XL").svg, (g) => rect(g, "sds-box")[0][3] - rect(sized("XS").svg, "sds-box")[0][3] === 16);


  // 11 · the old fields
  const oldFields = draw({ kind: "skeleton", frame: { tone: "blue", rows: [{ items: [{ text: "Save", em: true }, { note: "n", off: true }] }] } });
  one("`tone` is not read, and the finding names `look`", oldFields.findings, says("no longer reads `tone`"));
  one("`em` is not read, and the finding names `control` and `main`", oldFields.findings, says("`control` with `main: true`"));
  one("`off` is not read, and the finding names `note`", oldFields.findings, says("no longer reads `off`"));
  one("nothing is drawn by guessing: no tone class reaches the drawing", oldFields.svg, (g) => !g.includes("sds-tone-"));
  one("an old `warn` is a finding that names the new field", draw({ kind: "skeleton", frame: { rows: [{ items: [{ text: "x", warn: true }] }] } }).findings, says("no longer reads `warn`"));

  // 12 · a switch, a row of tabs and a badge: state by position and weight, never by a colour
  const row = (...items) => draw({ kind: "skeleton", frame: { rows: [{ items }] } });
  const circles = (g) => [...g.matchAll(/<circle class="([^"]+)" cx="([\d.]+)"/g)].map((m) => [m[1], Number(m[2])]);
  const switches = row({ control: "switch", text: "Off" }, { control: "switch", text: "On", on: true });
  one("a switch draws without a finding", switches.findings, none);
  one("a switch that is on has its knob at the end of its track, and solid", circles(switches.svg)[1], (g) => g[0].includes("sds-skel-glyph-solid"));
  one("a switch that is off has its knob at the start of its track, and hollow", circles(switches.svg)[0], (g) => !g[0].includes("solid"));
  one("the two knobs stand at different places in their tracks", row({ control: "switch" }, { control: "switch", on: true }).svg,
    (g) => { const track = rect(g, "sds-skel-control"), knob = circles(g); return knob[0][1] - track[0][0] < track[0][2] / 2 && knob[1][1] - track[1][0] > track[1][2] / 2; });
  one("a switch's track stands 12 lower than a control", rect(switches.svg, "sds-skel-control")[0][3], 20);
  // Tabs inside a container, a card or a widget are the line; the same tabs at the page level are pills (below).
  const inBox = (...items) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ frame: { rows: [{ items }] } }] }] } });
  const tabs = inBox({ control: "tabs", tabs: ["Email", "SMS", "WhatsApp"], chosen: 1 });
  one("a row of tabs draws without a finding", tabs.findings, none);
  one("the chosen tab alone is heavy", [...tabs.svg.matchAll(/<text class="sds-label"[^>]*>([^<]+)</g)].map((m) => m[1]).join(), "SMS");
  one("the chosen tab alone has a line under it", (tabs.svg.match(/<path class="sds-skel-border"/g) ?? []).length, 1);
  one("with no `chosen`, the first tab is the chosen one", inBox({ control: "tabs", tabs: ["A", "B"] }).svg, (g) => g.includes('<text class="sds-label"') && /sds-label"[^>]*>A</.test(g));
  one("a `chosen` the row lacks is a finding that counts the tabs", inBox({ control: "tabs", tabs: ["A", "B"], chosen: 2 }).findings, says("has 2 tabs, counted from 0"));
  one("a row of tabs with no words is a finding", inBox({ control: "tabs" }).findings, says("names its words in `tabs`"));
  // Tabs that stand at the page level, in the root frame's rows or in the page head's actions, are a track holding a pill.
  const pageTabs = row({ control: "tabs", tabs: ["Email", "SMS", "WhatsApp"], chosen: 1 });
  const pageTrack = rect(pageTabs.svg, "sds-skel-surface")[0], pagePill = rect(pageTabs.svg, "sds-skel-control")[1];
  one("tabs at the page level draw without a finding", pageTabs.findings, none);
  one("tabs at the page level are a muted track and a pill, with no line under anything", pageTabs.svg,
    (g) => rect(g, "sds-skel-surface").length === 1 && rect(g, "sds-skel-control").length === 2 && !g.includes("sds-skel-border") && !g.includes('<path class="sds-skel-control"'));
  one("the pill stands inside the track, which is fully rounded", [pagePill, pageTrack], ([pill, track]) => pill[0] > track[0] && pill[0] + pill[2] < track[0] + track[2] && pill[3] < track[3]);
  one("the chosen word alone is heavy, and the others are words in the code style", [pageTabs.svg.match(/<text class="sds-label"[^>]*>([^<]+)</g)?.length, pageTabs.svg.match(/<text class="sds-code"/g)?.length], (g) => g[0] === 1 && g[1] === 2);
  // The track's edge is the row's edge, where the page head and the parts under it start; the words stand inside it.
  one("the pill's track starts where the row starts, lined up with the page head", pageTrack[0], 24 + 16);
  one("page-level tabs stand their words inside the track", [...pageTabs.svg.matchAll(/<text class="sds-(?:label|code)" x="([\d.]+)"/g)].map((m) => Number(m[1])), (g) => g.length === 3 && g[1] - g[0] > 0 && g.every((x) => x > pageTrack[0]));
  const headTabs = draw({ kind: "skeleton", views: [{ viewport: "DESKTOP", page: { item: { title: "Overview" }, actions: [{ control: "tabs", tabs: ["Day", "Week"], chosen: 0 }] }, frame: { rows: [{ items: [{ note: "x" }] }] } }] });
  one("tabs in the page head's actions are pills too", headTabs, (g) => g.findings.length === 0 && !g.svg.includes("sds-skel-border") && rect(g.svg, "sds-skel-surface").length >= 1);
  one("tabs inside a container still draw the line under the chosen one", (inBox({ control: "tabs", tabs: ["A", "B"] }).svg.match(/<path class="sds-skel-border"/g) ?? []).length, 1);
  const badge = row({ control: "badge", text: "Published v2" }, { control: "button", text: "Publish" });
  one("a badge draws without a finding", badge.findings, none);
  one("a badge stands 8 lower than the button beside it", rect(badge.svg, "sds-skel-control").map((r) => r[3]).join(), "24,32");
  one("a badge and a button share the row's centre line", rect(badge.svg, "sds-skel-control"), (g) => g[0][1] + g[0][3] / 2 === g[1][1] + g[1][3] / 2);
  one("a badge with `main` is a finding: it is never something to press", row({ control: "badge", text: "x", main: true }).findings, says("never takes the weight of a main action"));
  one("a badge with no word is a finding", row({ control: "badge" }).findings, says("carries its word in `text`"));
  one("a badge and a tab may carry an icon, drawn with no square around it", inBox({ control: "badge", text: "Platform", icon: "default" }, { control: "tabs", tabs: ["Email"], icon: "default" }),
    (g) => g.findings.length === 0 && (g.svg.match(/<circle class="sds-skel-glyph /g) ?? []).length === 2 && rect(g.svg, "sds-skel-control").length === 1);
  one("an icon the set lacks, on a badge, is a finding that names the default", row({ control: "badge", text: "x", icon: "rocket" }).findings, says("`default`"));
  one("the three carry no tag, as every control", row({ control: "switch", tag: "name" }).findings, says("a control carries no tag"));
  one("none of the three takes the rest of its row with `fill`", rect(row({ control: "badge", text: "x", fill: true }).svg, "sds-skel-control")[0][2], (g) => g < 60);

  // 13 · a view for each screen class, in one figure
  const frameOf = (label, items = [{ text: "Members" }]) => ({ label, rows: [{ items }] });
  const views = draw({ kind: "skeleton", views: [{ viewport: "MOBILE", frame: frameOf("Phone") }, { viewport: "DESKTOP", frame: frameOf("Desk") }] });
  const outer = (g) => rect(g, "sds-box");
  one("a spec with `views` draws without a finding", views.findings, none);
  one("each view is one outer frame", outer(views.svg).length, 2);
  one("the views are drawn desktop first, whatever order the spec lists them in", [...views.svg.matchAll(/<text class="sds-note"[^>]*>([A-Z]+)</g)].map((m) => m[1]).join(), "DESKTOP,MOBILE");
  one("a view's width stands for its class: the desktop takes the grid's width", outer(views.svg).map((r) => r[2]).join(), "1052,411");
  one("the desktop stands alone on its line, and the phone starts the next", outer(views.svg), (g) => g[1][0] === g[0][0] && g[1][1] > g[0][1] + g[0][3]);
  one("a figure of views is a skeleton the figure check reads by the skeleton's own rules", views.svg, (g) => g.startsWith('<svg class="sds-drawing sds-skeleton"') && checkFigures(g).length === 0);
  const three = draw({ kind: "skeleton", views: ["TABLET", "MOBILE", "DESKTOP"].map((viewport) => ({ viewport, frame: frameOf(viewport) })) });
  one("a view that would pass the grid's width starts a new line: the tablet stands under the desktop", outer(three.svg), (g) => g.length === 3 && g[1][0] === g[0][0] && g[1][1] > g[0][1] + g[0][3] && g[2][1] === g[1][1] && g[1][2] === 617 && g[2][0] - (g[1][0] + g[1][2]) === 24 && g[2][0] + g[2][2] === g[0][0] + g[0][2]);
  one("a figure of three views is no wider than the grid", three.svg, (g) => Number(g.match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/)[1]) <= 1056);
  one("`frame` beside `views` is a finding", draw({ kind: "skeleton", frame: frameOf("x"), views: [{ viewport: "MOBILE", frame: frameOf("y") }] }).findings, says("`frame` or `views`, never both"));
  one("a viewport that is no screen class is refused by name", draw({ kind: "skeleton", views: [{ viewport: "WATCH", frame: frameOf("x") }] }).findings, says("`WATCH`"));
  one("two views of one class are a finding", draw({ kind: "skeleton", views: [{ viewport: "MOBILE", frame: frameOf("x") }, { viewport: "MOBILE", frame: frameOf("y") }] }).findings, says("one view for a screen class"));
  one("a view with no frame is a finding", draw({ kind: "skeleton", views: [{ viewport: "MOBILE" }] }).findings, says("has no `frame`"));
  one("`views` holding no view is a finding, not an empty canvas", draw({ kind: "skeleton", views: [] }), (g) => g.svg === "" && says("holds no view")(g.findings));
  const wide = [{ control: "field", text: "Search members" }, { control: "button", text: "Invite a member" }, { control: "button", text: "Export" }];
  one("a view whose frame needs more than its class has is a finding that names both widths", draw({ kind: "skeleton", views: [{ viewport: "MOBILE", frame: frameOf("x", wide) }] }).findings, says("and its class stands at 411"));
  one("the same row fits a desktop", draw({ kind: "skeleton", views: [{ viewport: "DESKTOP", frame: frameOf("x", wide) }] }).findings, none);
  const beside = [{ frame: { tag: "groups", width: "1/3", rows: [{ items: [{ standin: "list", fill: true }] }] } }, { frame: { tag: "items", rows: [{ items: [{ text: "Project" }] }] } }];
  one("a view measures a share exactly: a third beside the rest fits a desktop", draw({ kind: "skeleton", views: [{ viewport: "DESKTOP", frame: frameOf("x", beside) }] }).findings, none);
  one("a spec with one frame draws at the grid's width, as before views existed", outer(draw({ kind: "skeleton", frame: frameOf("x") }).svg)[0][2], 1052);

  // 14 · a table that takes sample cells
  const texts = (g, cls) => [...g.matchAll(new RegExp(`<text class="${cls}" x="([\\d.]+)" y="([\\d.]+)"(?: style="[^"]*")?>([^<]*)<`, "g"))].map((m) => [Number(m[1]), Number(m[2]), m[3]]);
  const table = (extra = {}) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ standin: "table", fill: true, columns: ["Name", "Email", "State", ""],
    cells: [["Dana Lee", "dana@acme.com", "", { icon: "more" }], ["Omar Haddad", "omar@acme.com", { control: "badge", text: "Invited" }, { icon: "more" }]], ...extra }] }] } });
  one("a table with sample cells draws without a finding", table().findings, none);
  one("its head row is the words of its columns, and an empty head draws no word", texts(table().svg, "sds-label").map((t) => t[2]).join(), "Name,Email,State");
  one("a cell stands under the head of its column", texts(table().svg, "sds-code").filter((t) => t[2] === "dana@acme.com" || t[2] === "omar@acme.com").map((t) => t[0]),
    (g) => g.length === 2 && g[0] === g[1] && g[0] === texts(table().svg, "sds-label")[1][0]);
  one("a cell may be a badge, drawn as a badge is", rect(table().svg, "sds-skel-control").some((r) => r[3] === 24), true);
  one("a column with an empty head holds the actions of a row, at the end of the table", rect(table().svg, "sds-skel-control").filter((r) => r[2] === 32 && r[3] === 32),
    (g) => g.length === 2 && g[0][0] === g[1][0] && g[0][0] + 32 === 24 + 1052 - 16 - 16);
  one("a table with no `columns` is a finding", table({ columns: undefined }).findings, says("names the words of its head row in `columns`"));
  one("a row with more cells than columns is a finding that counts both", table({ columns: ["Name"] }).findings, says("holds 4 cells, and the table has 1 columns"));
  one("a cell that is a frame is a finding", table({ cells: [[{ frame: { rows: [] } }]] }).findings, says("a cell of a table is a word, a note, an icon or a control"));
  one("a table too wide for a phone is refused by the view", draw({ kind: "skeleton", views: [{ viewport: "MOBILE", frame: { rows: [{ items: [{ standin: "table", fill: true, columns: ["Name", "Email", "Role", "State", "Created by", "Created at"], cells: [["Omar Haddad", "omar@acme.com", "Member", "Invited", "Dana Lee", "2 May 2026"]] }] }] } }] }).findings, says("its class stands at 411"));

  // 15 · an item line
  const line = (item, extra = {}) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ item, fill: true, ...extra }] }] } });
  const full = line({ media: "person", title: "Dana Lee", description: "Admin", end: [{ control: "badge", text: "Invited" }, { icon: "more" }] });
  one("an item line draws without a finding", full.findings, none);
  one("its title is heavy and its description is quiet", [texts(full.svg, "sds-title").map((t) => t[2]).join(), texts(full.svg, "sds-note").map((t) => t[2]).includes("Admin")].join(), "Dana Lee,true");
  one("the description stands under the title, at the same start", [texts(full.svg, "sds-title")[0], texts(full.svg, "sds-note").find((t) => t[2] === "Admin")], (g) => g[0][0] === g[1][0] && g[1][1] > g[0][1]);
  one("the media is as tall as the two lines beside it, and the words start after it", texts(full.svg, "sds-title")[0][0], 24 + 16 + 40 + 8);
  one("beside a title alone the media is as tall as a control", texts(line({ media: "person", title: "Dana Lee" }).svg, "sds-title")[0][0], 24 + 16 + 32 + 8);
  one("the media of a person is a circle, and no square", [roundMarks(full.svg)[0].join(":"), rect(full.svg, "sds-skel-control").filter((r) => r[0] === 40).length].join(), "sds-skel-control:20,0");
  one("what is pressed at the end of an item keeps its square", rect(full.svg, "sds-skel-control").some((r) => r[2] === 32 && r[3] === 32), true);
  one("what stands at its end ends at the end of the line", rect(full.svg, "sds-skel-control").map((r) => r[0] + r[2]), (g) => Math.max(...g) === 24 + 1052 - 16);
  one("an item with a description stands taller than one without", rect(full.svg, "sds-box")[0][3] > rect(line({ title: "Dana Lee" }).svg, "sds-box")[0][3], true);
  one("an item with no media starts its words at the start of the line", texts(line({ title: "Dana Lee" }).svg, "sds-title")[0][0], 24 + 16);
  one("an item with no title is a finding", line({ media: "person" }).findings, says("carries its `title`"));
  one("a media the set lacks is a finding that names the default", line({ media: "rocket", title: "x" }).findings, says("`default`"));
  one("a frame at the end of an item line is a finding", line({ title: "x", end: [{ frame: { rows: [] } }] }).findings, says("the end of an item line holds"));

  // 15a · the line of facts under an item's title
  const facts = line({ media: "default", title: "SaaS Plane Platform", meta: [{ control: "badge", text: "Platform" }, "platform", "Owner: Dana Lee"] });
  one("an item with a line of facts draws without a finding", facts.findings, none);
  one("a dot stands between every two facts, a badge among them", texts(facts.svg, "sds-note").map((t) => t[2]).join("|"), "·|platform|·|Owner: Dana Lee");
  one("the dot after a badge stands between the badge and the next fact", [rect(facts.svg, "sds-skel-control").find((r) => r[3] === 16), texts(facts.svg, "sds-note")],
    (g) => g[1][0][0] > g[0][0] + g[0][2] && g[1][0][0] < g[1][1][0]);
  const badges = line({ title: "x", meta: [{ control: "badge", text: "Platform", icon: "default" }, { control: "badge", text: "Pending", icon: "default" }] });
  one("two badges on one line have a dot between them", [badges.findings.length, texts(badges.svg, "sds-note").map((t) => t[2]).join("|")], (g) => g[0] === 0 && g[1] === "·");
  one("the facts stand on one line under the title, in the order given", [rect(facts.svg, "sds-skel-control").find((r) => r[3] === 16), texts(facts.svg, "sds-note")[0], texts(facts.svg, "sds-title")[0]],
    (g) => g[0][0] === g[2][0] && g[1][0] > g[0][0] + g[0][2] && g[1][1] > g[2][1]);
  one("an item whose facts hold a badge stands a little taller than one whose facts are words", rect(facts.svg, "sds-box")[0][3] > rect(line({ title: "x", description: "y" }).svg, "sds-box")[0][3], true);
  one("a fact that is neither a word nor a badge is a finding", line({ title: "x", meta: [{ control: "button", text: "Go" }] }).findings, says("a word or a badge"));

  // 15a2 · an item marked `inline`: its facts stand on the title's line, after a dot
  const compact = line({ title: "v3", inline: true, meta: [{ control: "badge", text: "Draft" }] });
  const compactPlain = line({ title: "v3" });
  const compactFacts = line({ title: "v3", meta: [{ control: "badge", text: "Draft" }] });
  one("an inline item draws without a finding", compact.findings, none);
  one("an inline item stands one line tall, as a title alone does", rect(compact.svg, "sds-box")[0][3], rect(compactPlain.svg, "sds-box")[0][3]);
  one("an item with facts and not inline keeps its facts under the title and stands taller", rect(compactFacts.svg, "sds-box")[0][3] > rect(compactPlain.svg, "sds-box")[0][3], true);
  one("an inline item's badge stands on the title's line, after the title and a dot",
    [texts(compact.svg, "sds-title")[0], texts(compact.svg, "sds-note").find((t) => t[2] === "·"), rect(compact.svg, "sds-skel-control").find((r) => r[3] === 16)],
    (g) => g[1][0] > g[0][0] && g[2][0] > g[1][0] && Math.abs((g[2][1] + g[2][3] / 2) - (g[0][1] - 4)) <= 3);
  one("an inline item's dot stands level with its title's words", [texts(compact.svg, "sds-title")[0][1], texts(compact.svg, "sds-note").find((t) => t[2] === "·")[1]], (g) => g[0] === g[1]);

  // 15b · a card: a thin rounded outline, with a title of its own
  const card = (frame) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ frame }] }] } });
  const titled = card({ look: "card", label: "Sign-in", rows: [{ items: [{ text: "Account" }] }] });
  one("a card with a title draws without a finding, and needs no tag", titled.findings, none);
  one("a card is a thin outline with a rounded corner, and nothing behind it", titled.svg, (g) => /<rect class="sds-skel-control"[^>]*rx="8"/.test(g) && !g.includes("sds-skel-surface") && !g.includes("sds-skel-guide"));
  one("a card's title is drawn as a title, in the heavy weight", titled.svg, (g) => /<text class="sds-title"[^>]*>Sign-in</.test(g));
  one("a card's head is lower than the head of a frame with a title", rect(titled.svg, "sds-box")[0][3] < rect(card({ tag: "x", label: "Sign-in", rows: [{ items: [{ text: "Account" }] }] }).svg, "sds-box")[0][3] - 16, true);
  one("a card with neither a title nor a tag is a finding", card({ look: "card", rows: [] }).findings, says("carries no name"));

  // 15c · a container on a surface: one thin outline holding its header, its content and its footer (RD.DEVEX.WORKSPACE.268)
  const boxed = card({ look: "container", label: "Sign-in", note: "By app", actions: [{ control: "button", text: "Set our own" }],
    rows: [{ items: [{ text: "Account" }] }], footer: [{ items: [{ note: "Follows the default" }] }] });
  const outline = (g) => [...g.matchAll(/<rect class="sds-skel-control" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="8"/g)].map((m) => m.slice(1).map(Number));
  /** A container's extent is the first dotted outline; the thin rounded box under its header is `outline`. */
  const extent = (g) => rect(g, "sds-skel-guide")[0];
  one("a container draws without a finding", boxed.findings, none);
  const lineYs = (g) => [...g.matchAll(/<path class="sds-skel-control" d="M[\d.]+ ([\d.]+) H[\d.]+"\/>/g)].map((m) => Number(m[1]));
  one("its title stands inside its outline, in the heavy weight, with the line under it quiet", [texts(boxed.svg, "sds-title").find((t) => t[2] === "Sign-in"), texts(boxed.svg, "sds-note").find((t) => t[2] === "By app"), extent(boxed.svg)],
    (g) => g[0][1] > g[2][1] && g[1][1] > g[0][1] && g[0][0] === g[2][0] + 16);
  one("its actions stand at the end of its header, inside the outline", rect(boxed.svg, "sds-skel-control").find((r) => r[3] === 32 && r[2] > 60), (g) => g[0] + g[2] === extent(boxed.svg)[0] + extent(boxed.svg)[2] - 16 && g[1] > extent(boxed.svg)[1]);
  // The default frame of a container (RD.DEVEX.WORKSPACE.269): a dotted extent, an unframed header, and one rounded box under the header.
  one("its extent is a dotted outline, and no line stands under the header: the one line is the footer's, inside the box", [rect(boxed.svg, "sds-skel-guide").length, lineYs(boxed.svg), outline(boxed.svg)[0]], (g) => g[0] === 1 && g[1].length === 1 && g[1][0] > g[2][1] + 16);
  one("its content and its footer stand in one thin rounded box under the header, to the extent's bottom and sides",
    [extent(boxed.svg), outline(boxed.svg), texts(boxed.svg, "sds-note").find((t) => t[2] === "By app")],
    ([ext, boxes, note]) => boxes.length === 1 && boxes[0][0] === ext[0] && boxes[0][2] === ext[2] && boxes[0][1] + boxes[0][3] === ext[1] + ext[3] && boxes[0][1] > note[1]);
  one("no box goes round the header: the box begins under its words", [outline(boxed.svg)[0], texts(boxed.svg, "sds-title").find((t) => t[2] === "Sign-in")], ([box, title]) => box[1] > title[1]);
  one("its content stands inside the outline", texts(boxed.svg, "sds-label").find((t) => t[2] === "Account"), (g) => g[1] > outline(boxed.svg)[0][1] && g[0] === outline(boxed.svg)[0][0] + 16);
  // 15c · a footer sits under a line, inside the same box (RD.DEVEX.WORKSPACE.272)
  one("its footer stands in the same box as its content, under a line that crosses the box", boxed.svg,
    (g) => lineYs(g).length === 1 && outline(g).length === 1 && texts(g, "sds-code").some((t) => t[2] === "Follows the default" && t[1] > lineYs(g)[0] && t[1] < outline(g)[0][1] + outline(g)[0][3]) && lineYs(g)[0] > outline(g)[0][1]);
  // 15c · the content of a container is one or more parts, a line between every two, and no dotted boundary on a part
  const partOf = (label, extra = {}) => ({ part: true, label, rows: [{ items: [{ text: label + " field" }] }], ...extra });
  const threeParts = card({ look: "container", label: "New job", sections: [partOf("Details"), partOf("Trigger"), partOf("Destinations")] });
  one("three content parts draw without a finding", threeParts.findings, none);
  one("three content parts draw two lines inside the box and no dotted boundary but the extent", [lineYs(threeParts.svg).length, rect(threeParts.svg, "sds-skel-guide").length, texts(threeParts.svg, "sds-note").filter((t) => t[2] === "Group").length],
    (g) => g[0] === 2 && g[1] === 1 && g[2] === 0);
  one("each part carries its own title", ["Details", "Trigger", "Destinations"].map((t) => texts(threeParts.svg, "sds-title").some((x) => x[2] === t) || texts(threeParts.svg, "sds-step").some((x) => x[2] === t) || JSON.stringify(threeParts.svg).includes(">" + t + "<")), (g) => g.every(Boolean));
  const withGroup = card({ look: "container", label: "New job", sections: [partOf("Details"),
    partOf("Destinations", { sections: [{ label: "Destination 1", rows: [{ items: [{ text: "Type" }] }] }] })] });
  one("a group inside a part keeps its dotted boundary and the word Group", [withGroup.findings, rect(withGroup.svg, "sds-skel-guide").length, texts(withGroup.svg, "sds-note").filter((t) => t[2] === "Group").length],
    (g) => g[0].length === 0 && g[1] === 2 && g[2] === 1);
  one("a footer under two parts is a second line, under the last part", card({ look: "container", label: "x", sections: [partOf("A"), partOf("B")], footer: [{ items: [{ note: "n" }] }] }).svg, (g) => lineYs(g).length === 2);
  one("sections with no `part` stay groups, with no line between them", card({ look: "container", label: "x", sections: [{ label: "A", rows: [{ items: [{ text: "a" }] }] }, { label: "B", rows: [{ items: [{ text: "b" }] }] }] }).svg,
    (g) => lineYs(g).length === 0 && texts(g, "sds-note").filter((t) => t[2] === "Group").length === 2);
  one("a container with no header is its outline alone, and needs no name", card({ look: "container", rows: [{ items: [{ text: "x" }] }] }), (g) => g.findings.length === 0 && outline(g.svg).length === 1);
  one("a frame at the end of a container's header is a finding", card({ look: "container", label: "x", actions: [{ frame: { rows: [] } }], rows: [] }).findings, says("the actions of a container's header"));
  // 15c · content that is only cards stands flush (RD.DEVEX.WORKSPACE.269)
  const cardsOnly = card({ look: "container", label: "Sign-in", rows: [{ items: [
    { frame: { look: "card", label: "Account", rows: [{ items: [{ text: "x" }] }] } }, { frame: { look: "card", label: "Platform", rows: [{ items: [{ text: "y" }] }] } }] }] });
  one("a container whose content is only cards draws no box round them, and the cards reach its edges",
    [cardsOnly.findings, extent(cardsOnly.svg), outline(cardsOnly.svg)],
    ([found, ext, boxes]) => found.length === 0 && boxes.length === 2 && boxes[0][0] === ext[0] && boxes[1][0] + boxes[1][2] === ext[0] + ext[2]);
  const cardAndWord = card({ look: "container", label: "Sign-in", rows: [{ items: [{ frame: { look: "card", label: "Account", rows: [{ items: [{ text: "x" }] }] } }] }, { items: [{ note: "Owned by Dana Lee" }] }] });
  one("a container with a word beside its cards keeps its box and its side padding", [extent(cardAndWord.svg), outline(cardAndWord.svg)],
    ([ext, boxes]) => boxes.length === 2 && boxes[0][0] === ext[0] && boxes[1][0] === ext[0] + 16);
  // 15c · a card may carry actions at the end of its title
  const withAction = card({ look: "card", label: "Account", actions: [{ control: "button", text: "Add directory" }], rows: [{ items: [{ text: "x" }] }] });
  const withoutAction = card({ look: "card", label: "Account", rows: [{ items: [{ text: "x" }] }] });
  one("a card's actions stand at the end of its title's line, inside its outline",
    [withAction.findings, rect(withAction.svg, "sds-skel-control").find((r) => r[3] === 32 && r[2] > 60), outline(withAction.svg)[0], texts(withAction.svg, "sds-title").find((t) => t[2] === "Account")],
    ([found, button, box, title]) => found.length === 0 && button !== undefined && button[0] + button[2] === box[0] + box[2] - 16 && button[1] < title[1] && title[1] < button[1] + button[3]);
  one("a card with an action stands taller than one without", [withAction, withoutAction].map((c) => outline(c.svg)[0][3]), (g) => g[0] > g[1]);
  one("a card's action that is a frame is a finding", card({ look: "card", label: "x", actions: [{ frame: { rows: [] } }], rows: [] }).findings, says("the actions of a card's header"));
  // 15c · a brand pressed to set it up is a tile (RD.DEVEX.WORKSPACE.269)
  const tile = (on) => card({ look: "card", label: "Social sign-in", rows: [{ items: [{ icon: "default", mark: false, ...(on === undefined ? {} : { on }) }] }] });
  one("an icon with `mark: false` and `on` is a square action as tall as a control, and not a circle", [tile(true).findings, rect(tile(true).svg, "sds-skel-control").filter((r) => r[2] === 32 && r[3] === 32).length, (tile(false).svg.match(/<circle class="sds-skel-(?:bar|control)"/g) ?? []).length],
    ([found, squares, circles]) => found.length === 0 && squares === 1 && circles === 0);
  one("a tile that is set up carries a small filled check at its top end corner, and one that is not carries none",
    [rect(tile(true).svg, "sds-skel-control").find((r) => r[2] === 32 && r[3] === 32), [...tile(true).svg.matchAll(/<circle class="sds-skel-bar" cx="([\d.]+)" cy="([\d.]+)" r="4"/g)].map((m) => [Number(m[1]), Number(m[2])]), (tile(false).svg.match(/<circle class="sds-skel-bar"/g) ?? []).length],
    ([square, checks, none]) => checks.length === 1 && checks[0][0] === square[0] + square[2] && checks[0][1] === square[1] && none === 0);
  const parted = card({ look: "container", label: "Web addresses", sections: [
    { label: "Sites", actions: [{ control: "button", text: "Change" }], rows: [{ items: [{ text: "plat.spn.io" }] }] },
    { label: "Email domains", actions: [{ control: "button", text: "Add" }], rows: [{ items: [{ note: "None yet" }] }] }] });
  one("a container with two parts of content draws without a finding", parted.findings, none);
  one("each part has its own title, with its action at the end of that title", [texts(parted.svg, "sds-title").find((t) => t[2] === "Email domains"), rect(parted.svg, "sds-skel-control").filter((r) => r[3] === 32)],
    (g) => g[1].length === 2 && Math.abs((g[1][1][1] + 16) - (g[0][1] - 4)) < 1 && g[1][1][0] + g[1][1][2] === outline(parted.svg)[0][0] + outline(parted.svg)[0][2] - 16);
  one("no line crosses the container, under the header or between its parts", (parted.svg.match(/<path class="sds-skel-control" d="M/g) ?? []).length, 0);
  one("a part of the content with a title and no unit is a group: a dotted boundary, *Group* at its corner, its title inside",
    [rect(parted.svg, "sds-skel-guide"), texts(parted.svg, "sds-note").filter((t) => t[2] === "Group"), texts(parted.svg, "sds-title").find((t) => t[2] === "Sites")],
    ([guides, names, title]) => guides.length === 3 && names.length === 2 && names[0][1] < title[1] && title[1] < guides[1][1] + guides[1][3]);
  // 15c · the titles of a surface stand in steps
  const stepOf = (g, words) => (g.match(new RegExp(`style="([^"]*)">${words}<`)) ?? [])[1];
  const stepped = card({ look: "container", label: "Sign-in", rows: [{ items: [{ frame: { look: "card", label: "Account", sections: [
    { label: "Directories", actions: [{ control: "button", text: "Add" }], rows: [{ items: [{ item: { title: "Acme Okta", meta: ["SAML"] }, fill: true }] }] }] } }] }] });
  one("a card with a part of content draws without a finding", stepped.findings, none);
  one("a container's title, a card's, a part's and an item's are four steps, largest first", ["Sign-in", "Account", "Directories", "Acme Okta"].map((w) => stepOf(stepped.svg, w)),
    (g) => g.join("|") === "font-size:20px|font-size:15px|font-size:13px|font-size:12px;font-weight:500");
  one("the title of a part is heavy and an item's title is of medium weight", [stepOf(stepped.svg, "Directories"), stepOf(stepped.svg, "Acme Okta")], (g) => !g[0].includes("font-weight") && g[1].includes("font-weight:500"));
  const headed = draw({ kind: "skeleton", frame: { label: "Organization", rows: [{ items: [{ item: { media: "default", title: "SaaS Plane Platform", meta: ["platform"] }, fill: true }] }] } });
  one("an item on the page itself is the page's header, as large and heavy as a container's title", [headed.findings.length, stepOf(headed.svg, "SaaS Plane Platform")], (g) => g[0] === 0 && g[1] === "font-size:20px");
  const flushed = card({ look: "container", label: "Orders", rows: [{ items: [{ standin: "table", fill: true, flush: true, columns: ["Order", "Customer"], cells: [["ORD-1", "Acme"], ["ORD-2", "Blue"]] }] }] });
  one("a flush table draws its lines from one edge of the container's outline to the other", [flushed.findings.length, extent(flushed.svg), [...flushed.svg.matchAll(/<path class="sds-skel-(?:control|border)" d="M([\d.]+) [\d.]+ H([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])])],
    (g) => g[0] === 0 && g[2].length === 2 && g[2].every((l) => l[0] === g[1][0] && l[1] === g[1][0] + g[1][2]));
  one("the head row of a flush table is a band, with its words in capitals", [flushed.svg.includes('class="sds-skel-surface"'), texts(flushed.svg, "sds-note").map((t) => t[2])], (g) => g[0] && g[1].includes("ORDER") && g[1].includes("CUSTOMER"));
  const cardWithMark = card({ look: "card", label: "Email", media: "default", rows: [{ items: [{ note: "SendGrid" }] }] });
  one("a card with a mark draws it before its title, and the title starts after it", [cardWithMark.findings.length, (cardWithMark.svg.match(/<circle/g) ?? []).length, texts(cardWithMark.svg, "sds-title").find((t) => t[2] === "Email")[0], texts(card({ look: "card", label: "Email", rows: [{ items: [{ note: "SendGrid" }] }] }).svg, "sds-title").find((t) => t[2] === "Email")[0]],
    (g) => g[0] === 0 && g[1] === 1 && g[2] === g[3] + 30);
  const itemOfThree = line({ media: "default", title: "SendGrid", description: "Sends the email of every app", meta: [{ control: "badge", text: "Connected" }, "Since 2 May"] });
  const itemOfTwo = line({ media: "default", title: "SendGrid", meta: [{ control: "badge", text: "Connected" }, "Since 2 May"] });
  one("an item with a description and facts stands itemOfThree lines: the description on its own line, the facts under it", [itemOfThree.findings.length, texts(itemOfThree.svg, "sds-note").map((t) => t[2]), rect(itemOfThree.svg, "sds-box")[0][3] - rect(itemOfTwo.svg, "sds-box")[0][3]],
    (g) => g[0] === 0 && g[1][0] === "Sends the email of every app" && g[1].includes("Since 2 May") && g[2] === 18);
  one("an item with a description and no facts keeps itemOfTwo lines", texts(line({ title: "x", description: "y" }).svg, "sds-note").map((t) => t[2]), (g) => g.length === 1 && g[0] === "y");
  const listWithLines = card({ look: "container", label: "Users", divided: true, rows: [{ items: [{ item: { title: "Dana Lee" }, fill: true }] }, { items: [{ item: { title: "Li Wei" }, fill: true }] }, { items: [{ item: { title: "Omar" }, fill: true }] }] });
  one("a divided container has a line between each two of its rows, and none under its header", [listWithLines.findings.length, (listWithLines.svg.match(/<path class="sds-skel-control" d="M/g) ?? []).length], (g) => g[0] === 0 && g[1] === 2);
  const radius = (g) => [...g.matchAll(/<circle[^>]* r="([\d.]+)"/g)].map((m) => Number(m[1]));
  one("a mark that is a thing and tells its state is as tall as a control, and one that only tells a state is small",
    [radius(card({ look: "card", label: "x", rows: [{ items: [{ icon: "default", mark: true, on: true, text: "Google" }] }] }).svg)[0], radius(card({ look: "card", label: "x", rows: [{ items: [{ icon: "default", on: true }] }] }).svg)[0]], (g) => g[0] > g[1]);
  const listWithChosen = card({ look: "container", label: "Groups", divided: true, rows: [{ chosen: true, items: [{ item: { title: "Authentication" }, fill: true }] }, { items: [{ item: { title: "Billing" }, fill: true }] }] });
  one("the chosen line of a list is a band across the box, from its top to the line under the row", [listWithChosen.findings.length, rect(listWithChosen.svg, "sds-skel-surface"), outline(listWithChosen.svg)[0], lineYs(listWithChosen.svg)[0]],
    (g) => g[0] === 0 && g[1].length === 1 && g[1][0][0] === g[2][0] && g[1][0][2] === g[2][2] && g[1][0][1] === g[2][1] && g[1][0][1] + g[1][0][3] === g[3]);
  const cardWithList = draw({ kind: "skeleton", frame: { rows: [{ items: [{ frame: { look: "card", label: "Account", sections: [{ rows: [{ items: [{ control: "switch", text: "Open" }] }] },
    { label: "Directories", divided: true, rows: [{ items: [{ item: { title: "Acme Okta" }, fill: true }] }, { items: [{ item: { title: "Acme Entra" }, fill: true }] }, { items: [{ item: { title: "Acme Ping" }, fill: true }] }] }] } }] }] } });
  one("a list in a card has a line between each two of its rows, and no line above the part", [cardWithList.findings.length, (cardWithList.svg.match(/<path class="sds-skel-control" d="M/g) ?? []).length], (g) => g[0] === 0 && g[1] === 2);
  one("a part of a card has no line above it", (card({ look: "card", label: "Account", sections: [{ rows: [{ items: [{ text: "x" }] }] }, { label: "Directories", rows: [{ items: [{ text: "y" }] }] }] }).svg.match(/<path class="sds-skel-control" d="M/g) ?? []).length, 0);
  const groupList = card({ look: "container", label: "Web addresses", sections: [{ label: "Sites", divided: true, rows: [{ items: [{ item: { title: "acme.spn.io" }, fill: true }] }, { items: [{ item: { title: "my.acme.com" }, fill: true }] }] }] });
  one("the line between two rows of a list in a group stays inside the group's boundary", [groupList.findings.length, rect(groupList.svg, "sds-skel-guide")[1], [...groupList.svg.matchAll(/<path class="sds-skel-control" d="M([\d.]+) [\d.]+ H([\d.]+)"\/>/g)].map((m) => [Number(m[1]), Number(m[2])])],
    ([found, group, lines]) => found === 0 && lines.length === 1 && lines[0][0] === group[0] && lines[0][1] === group[0] + group[2]);
  one("a plain word in a row keeps the weight of a word", texts(card({ look: "card", label: "x", rows: [{ items: [{ text: "plain" }] }] }).svg, "sds-label").map((t) => t[2]), (g) => g.includes("plain"));
  one("a look the skeleton lacks names the five it has", card({ tag: "x", look: "glass", rows: [] }).findings, says("raised · bordered · flat · card · container"));

  // 16 · one estimate of width, for every spec
  const shared = { kind: "skeleton", frame: { rows: [{ items: [{ frame: { tag: "a", width: "1/4", rows: [{ items: [{ standin: "list", fill: true }] }] } }, { frame: { tag: "b", rows: [{ items: [{ control: "field", text: "x" }, { control: "button", text: "Go" }] }] } }] }] } };
  one("a spec with one frame is no wider than the grid where its shares fit it", outer(draw(shared).svg)[0][2], 1052);

  // 17 · a page's skeleton draws every level: the layout, the page level and each block's unit (RD.DEVEX.WORKSPACE.260)
  const boxes = (g, cls) => [...g.matchAll(new RegExp(`<rect class="${cls}" x="([\\d.]+)" y="([\\d.]+)" width="([\\d.]+)" height="([\\d.]+)" rx="([\\d.]+)"`, "g"))].map((m) => m.slice(1).map(Number));
  const listing = (extra = {}) => ({ look: "container", unit: "DSPanelContainer", rows: [], ...extra,
    sections: [{ unit: "DSFilterBar", rows: [{ items: [{ control: "field", text: "Search", fill: true }, { icon: "close" }] }] },
      { unit: "DSDataTable", rows: [{ items: [{ standin: "table", fill: true, flush: true, columns: ["Order", "Customer", ""], cells: [["#1042", "Acme Corp", { icon: "more" }]] }] }] }] });
  const paged = (viewport, layout, page = { item: { title: "Orders", description: "Every order placed" }, actions: [{ control: "button", text: "New order", main: true }] }, frame = { size: "XS", rows: [{ items: [{ frame: listing() }] }] }) =>
    judge({ kind: "skeleton", ...(layout ? { layout } : {}), views: [{ viewport, page, frame }] });
  const RAIL = { type: "RAIL", body: { width: "WIDE" }, navigation: { nav: ["Dashboard", "Orders", "Customers"], chosen: "Orders" } };
  // A SKELETON DRAWS A RAIL SHUT TO ITS ICONS ON EVERY DEVICE; only a figure about the rail itself asks for it open, with `open`.
  const RAIL_OPEN = { ...RAIL, navigation: { ...RAIL.navigation, open: true } };
  const desk = paged("DESKTOP", RAIL_OPEN);
  const win = (g) => outer(g)[0] ?? [];
  one("a page in a RAIL that is open draws with no finding, its layout drawn round it, and the figure check reads it as a skeleton", [desk.findings, desk.figure, desk.svg.includes(">Dashboard<")], (g) => g[0].length === 0 && g[1].length === 0 && g[2]);
  one("an attached rail that is open is a surface at the window's left edge, 131 wide at a desktop, the window's height",
    [win(desk.svg), boxes(desk.svg, "sds-skel-surface")[0]], ([w, nav]) => nav[0] === w[0] && nav[1] === w[1] && nav[2] === 131 && nav[3] === w[3] && nav[4] === 0);
  one("a WIDE body at a desktop is a box 701 wide, square where it is attached, centred in the area beside the open rail",
    [win(desk.svg), boxes(desk.svg, "sds-skel-border")], ([w, content]) => content.length === 1 && content[0][2] === 701 && content[0][4] === 0
      && content[0][0] === w[0] + 131 + (1052 - 131 - 701) / 2 && content[0][1] === w[1] && content[0][3] === w[3]);
  one("the open rail holds the words of `nav`, and the chosen one is heavier, in a band",
    [texts(desk.svg, "sds-label").map((t) => t[2]), texts(desk.svg, "sds-title").map((t) => t[2])], ([plain, heavy]) => plain.includes("Dashboard") && plain.includes("Customers") && heavy.includes("Orders") && !plain.includes("Orders"));
  const tablet = paged("TABLET", RAIL);
  one("at a tablet the rail is shut to 40 and the box is the screen beside it, since a width only bounds",
    [tablet.findings.length, boxes(tablet.svg, "sds-skel-surface")[0]?.[2], boxes(tablet.svg, "sds-skel-border")[0]?.[2]], (g) => g[0] === 0 && g[1] === 40 && g[2] === 617 - 40);
  const phone = paged("MOBILE", { ...RAIL, navigation: { ...RAIL.navigation, attached: false }, content: { attached: false } });
  one("on a phone every part attaches: one bar 48 high across the top, the menu at its start, and the content the screen under it",
    [win(phone.svg), boxes(phone.svg, "sds-skel-surface")[0], boxes(phone.svg, "sds-skel-border")[0], phone.svg.match(/M[\d.]+ [\d.]+ L[\d.]+ [\d.]+ M[\d.]+ [\d.]+ L[\d.]+ [\d.]+ M/) !== null],
    ([w, bar, content, menu]) => bar[2] === 411 && bar[3] === 48 && bar[1] === w[1] && content[1] === w[1] + 48 && content[2] === 411 && content[4] === 0 && menu);
  const apart = paged("DESKTOP", { type: "RAIL", body: { width: "FULL" }, navigation: { attached: false, open: true }, content: { attached: false } });
  one("a navigation and a content that are not attached are rounded and stand 16 in",
    [win(apart.svg), boxes(apart.svg, "sds-skel-surface")[0], boxes(apart.svg, "sds-skel-border")[0]],
    ([w, nav, content]) => nav[0] === w[0] + 16 && nav[1] === w[1] + 16 && nav[4] === 8 && content[4] === 8 && content[0] === nav[0] + 131 + 16 && content[0] + content[2] === w[0] + w[2] - 16);
  const top = paged("DESKTOP", { type: "TOPNAV", body: { width: "XWIDE" }, navigation: { nav: ["Dashboard", "Orders"], chosen: "Orders" } });
  one("a top bar runs across the window, 48 high, and the content stands under it at the body's width",
    [win(top.svg), boxes(top.svg, "sds-skel-surface")[0], boxes(top.svg, "sds-skel-border")[0]],
    ([w, bar, content]) => bar[0] === w[0] && bar[2] === 1052 && bar[3] === 48 && content[1] === w[1] + 48 && content[2] === 842 && content[0] === w[0] + (1052 - 842) / 2);
  const dock = paged("DESKTOP", { type: "DOCK" });
  one("a dock's column stands inside the content, at its left, and the page stands beside it",
    [boxes(dock.svg, "sds-skel-border")[0], boxes(dock.svg, "sds-skel-surface")[0], texts(dock.svg, "sds-title").find((t) => t[2] === "Orders")],
    ([content, column, title]) => column[0] === content[0] && column[1] === content[1] && column[2] === 131 && title[0] > column[0] + 131);
  const canvas = paged("DESKTOP", { type: "CANVAS", body: { width: "MEDIUM" } });
  one("CANVAS draws the body alone: the content's box and no navigation",
    [canvas.findings.length, boxes(canvas.svg, "sds-skel-border")[0], canvas.svg.includes("sds-skel-surface\" x=\"" + win(canvas.svg)[0])], (g) => g[0] === 0 && g[1][2] === 561 && !g[2]);
  const wideTable = { size: "XS", rows: [{ items: [{ standin: "table", fill: true, columns: ["Order", "Customer", "Email", "Status", "Total", "Placed", "Channel", "Owner"],
    cells: [["#1042", "Acme Corporation", "orders@acme.example", "Pending", "$1,240.00", "2 May 2026", "Online", "Dana Lee"]] }] }] };
  one("a view that needs more room than its content has is a finding that names the content's width",
    paged("DESKTOP", RAIL, undefined, wideTable).findings, says("its content in a `RAIL` with a `WIDE` body stands at 701"));
  const fullBody = paged("DESKTOP", { ...RAIL, body: { width: "FULL" } }, undefined, wideTable);
  one("the same view fits a FULL body, which is all the window beside the shut rail", [fullBody.findings, boxes(fullBody.svg, "sds-skel-border")[0]?.[2]], (g) => g[0].length === 0 && g[1] === 1052 - 40);

  // 17a · the page level: first in the content, the largest title, its actions at the end, the way back before the title
  const titleOf = (g, words) => texts(g, "sds-title").filter((t) => t[2] === words).at(-1);
  one("the page level's title is the largest of a surface's titles, a step over a container's",
    [stepOf(desk.svg, "Orders"), texts(desk.svg, "sds-note").map((t) => t[2])], (g) => g[0] === "font-size:24px" && g[1].includes("Every order placed"));
  one("the page level stands first in the content, above the container, with its main action at the end",
    [titleOf(desk.svg, "Orders"), outline(desk.svg)[0], boxes(desk.svg, "sds-skel-border")[0], desk.svg.match(/<rect class="sds-skel-control sds-skel-main" x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/)],
    ([title, container, content, main]) => title[1] < container[1] && title[0] === content[0] + 16 && Number(main[1]) + Number(main[2]) === content[0] + content[2] - 16);
  const back = paged("DESKTOP", undefined, { item: { title: "Blue Bakery" }, back: true });
  one("`back` is the way back, an action before the title, and a page with no layout stands in its window",
    [back.findings.length, rect(back.svg, "sds-skel-control")[0], titleOf(back.svg, "Blue Bakery"), outer(back.svg).length],
    ([found, icon, title, windows]) => found === 0 && icon[2] === icon[3] && icon[0] + icon[2] < title[0] && windows === 1);
  const headedRoot = paged("DESKTOP", undefined, { item: { title: "Orders" } }, { rows: [{ items: [{ item: { title: "Acme Corp" }, fill: true }] }] });
  one("under a page level, an item in the frame is one thing among the content, not the page's header",
    [stepOf(headedRoot.svg, "Orders"), stepOf(headedRoot.svg, "Acme Corp")], (g) => g[0] === "font-size:24px" && g[1] === "font-size:12px;font-weight:500");
  one("a view's `page` with no `item` is a finding", paged("DESKTOP", RAIL, { actions: [] }).findings, says("`page` carries its `item`"));

  // 17b · each block's unit, at the level its name gives
  const notes = (g) => texts(g, "sds-note").map((t) => t[2]);
  one("a container's unit is named at the corner of its outline, over its header",
    [notes(desk.svg).includes("DSPanelContainer"), texts(desk.svg, "sds-note").find((t) => t[2] === "DSPanelContainer"), extent(desk.svg)],
    ([named, name, box]) => named && name[0] === box[0] + 8 && name[1] > box[1] && name[1] < box[1] + 24);
  const headedBox = paged("DESKTOP", RAIL, undefined, { size: "XS", rows: [{ items: [{ frame: { look: "container", unit: "DSPanelContainer", label: "Desk lamps", note: "Lamps for a desk", actions: [{ control: "button", text: "Add product" }],
    rows: [{ items: [{ standin: "table", fill: true, flush: true, columns: ["Product", "Price"], cells: [["Arc desk lamp", "$89.00"]] }] }] } }] }] });
  one("a container's title, the line under it and its actions stand inside its outline, under its unit's name, as `DSPanelContainer.Header`",
    [headedBox.findings, texts(headedBox.svg, "sds-note").find((t) => t[2] === "DSPanelContainer"), titleOf(headedBox.svg, "Desk lamps"), texts(headedBox.svg, "sds-note").find((t) => t[2] === "Lamps for a desk"), extent(headedBox.svg)],
    ([found, name, title, note, box]) => found.length === 0 && name[1] < title[1] && title[1] < note[1] && title[0] === box[0] + 16 && title[1] > box[1] && note[1] < box[1] + box[3]);
  one("the rail's chosen entry is named by its word, and an index is a finding that names the word",
    paged("DESKTOP", { ...RAIL, navigation: { ...RAIL.navigation, chosen: 1 } }).findings, says("name the open entry by its word, one of `nav`"));
  one("a chosen entry `nav` does not hold is a finding",
    paged("DESKTOP", { ...RAIL, navigation: { ...RAIL.navigation, chosen: "Team" } }).findings, says("`layout.navigation.chosen` is `Team`, and `nav` holds"));
  one("the chosen entry is the page's own: a page that is an entry, under another entry's band, is a finding",
    paged("DESKTOP", { ...RAIL, navigation: { ...RAIL.navigation, chosen: "Customers" } }).findings, says("the `DESKTOP` view's page is `Orders`, an entry of the navigation, and the chosen entry is `Customers`"));
  one("a navigation that names its entries and none open is a finding",
    paged("DESKTOP", { ...RAIL, navigation: { nav: RAIL.navigation.nav } }).findings, says("no `chosen`"));
  one("a container's unit is named once, at its outline's corner", notes(headedBox.svg).filter((name) => name === "DSPanelContainer").length, 1);
  one("a part that is a widget is a dotted boundary round its rows, its name at its corner",
    [notes(desk.svg), boxes(desk.svg, "sds-skel-guide").length, extent(desk.svg), boxes(desk.svg, "sds-skel-guide")[1]],
    ([names, guides, box, first]) => names.includes("DSFilterBar") && names.includes("DSDataTable") && guides === 3 && first[0] === box[0] + 8 && first[2] === box[2] - 16);
  one("a flush table in a widget reaches the widget's boundary, under its name",
    [boxes(desk.svg, "sds-skel-guide")[2], desk.svg.match(/<rect class="sds-skel-surface" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"[^>]*rx="0"\/>\s*<text class="sds-note"[^>]*letter-spacing/)],
    ([widget, band]) => band !== null && Number(band[1]) === widget[0] && Number(band[3]) === widget[2] && Number(band[2]) > widget[1] + 20);
  const unitFrames = judge({ kind: "skeleton", frame: { rows: [{ items: [{ frame: { unit: "DSComparison", rows: [{ items: [
    { frame: { unit: "DSCard", label: "Revenue", rows: [{ items: [{ text: "$12,400" }] }] } }] }] } }] }] } });
  one("a frame that names a widget and no look is a dotted boundary with its name, and a card its outline, its name and its title",
    [unitFrames.findings, notes(unitFrames.svg), boxes(unitFrames.svg, "sds-skel-guide").length, outline(unitFrames.svg).length, stepOf(unitFrames.svg, "Revenue")],
    ([found, names, guides, cards, step]) => found.length === 0 && names.includes("DSComparison") && names.includes("DSCard") && guides === 1 && cards === 1 && step === "font-size:15px");
  const cardWidget = judge({ kind: "skeleton", frame: { rows: [{ items: [{ frame: { unit: "DSCardWidget", label: "Contacts", media: "person", rows: [{ items: [{ item: { title: "Dana Lee" }, fill: true }] }] } },
    { frame: { unit: "DSCardWidget", label: "Teams", media: "person", rows: [{ items: [{ item: { title: "Sales" }, fill: true }] }] } }] }] } });
  one("`DSCardWidget` is a card: its outline, its name at the corner and its title inside",
    [cardWidget.findings, notes(cardWidget.svg), outline(cardWidget.svg).length, boxes(cardWidget.svg, "sds-skel-guide").length, stepOf(cardWidget.svg, "Contacts")],
    ([found, names, cards, guides, step]) => found.length === 0 && names.includes("DSCardWidget") && cards === 2 && guides === 0 && step === "font-size:15px");
  const fourDeep = draw({ kind: "skeleton", views: [{ viewport: "DESKTOP", page: { item: { title: "Overview" } }, frame: { rows: [{ items: [{ frame: { unit: "DSPanelContainer", rows: [{ items: [
    { frame: { unit: "DSComparison", rows: [{ items: [{ frame: { unit: "DSCard", label: "Revenue", sections: [{ label: "This month", rows: [{ items: [{ text: "$12,400" }] }] }], rows: [] } }] }] } }] }] } }] }] } }] });
  one("the count starts at the container: a container, a widget or a card, and a group are three, and a fourth level is a finding",
    fourDeep.findings, says("the boundary `Group` sits inside 3 named boundaries"));
  one("a card in a widget in a container is three levels, and allowed",
    draw({ kind: "skeleton", views: [{ viewport: "DESKTOP", page: { item: { title: "Overview" } }, frame: { rows: [{ items: [{ frame: { unit: "DSPanelContainer", rows: [{ items: [
      { frame: { unit: "DSComparison", rows: [{ items: [{ frame: { unit: "DSCard", label: "Revenue", rows: [] } }] }] } }] }] } }] }] } }] }).findings, none);
  one("a unit the barrel does not name is a finding that says what a unit is",
    paged("DESKTOP", RAIL, undefined, { rows: [{ items: [{ frame: { unit: "DSFormWidget", rows: [{ items: [{ control: "field", text: "Name" }] }] } }] }] }).findings,
    says("`DSFormWidget` is no unit of the design system"));
  one("a part of a container that names a unit the barrel does not have is a finding as well",
    paged("DESKTOP", RAIL, undefined, { rows: [{ items: [{ frame: { look: "container", rows: [], sections: [{ unit: "DSFilterBarWidget", rows: [{ items: [{ text: "x" }] }] }] } }] }] }).findings,
    says("`DSFilterBarWidget` is no unit of the design system"));

  // 17c · the layout's fields are the looks' own
  one("a layout field the looks do not have is a finding that names the fields they have",
    paged("DESKTOP", { ...RAIL, navigation: { ...RAIL.navigation, side: "left" } }).findings, says("`layout.navigation.side` is no field of the navigation's look, which has `attached` · `sticky` · `className` · `nav` · `chosen`"));
  one("`flush`, the inset the layout model removed, is no field of a layout", paged("DESKTOP", { ...RAIL, flush: true }).findings, says("`layout.flush` is no field of a layout"));
  one("a body's width the design system lacks is refused by name", paged("DESKTOP", { ...RAIL, body: { width: "HUGE" } }).findings, says("`layout.body.width` is `HUGE`, and a body is FULL · XWIDE · WIDE · MEDIUM · NARROW"));
  one("a layout type the design system lacks is refused by name", paged("DESKTOP", { type: "SIDEBAR" }).findings, says("`layout.type` is `SIDEBAR`, and a layout is RAIL · DOCK · TOPNAV · CANVAS"));
  one("a `layout` beside one `frame` is a finding: the layout is where the views stand",
    draw({ kind: "skeleton", layout: RAIL, frame: frameOf("x") }).findings, says("a spec with a `layout` holds `views`"));
}

console.log("=== SKELETON — which unit, when: taught by the book, refused by the drawer");
{
  // Each case draws a deliberately wrong spec and wants the drawer to name the rule; its right form draws clean.
  const page = (frame, layout, page = { item: { title: "Orders" } }) =>
    draw({ kind: "skeleton", ...(layout ? { layout } : {}), views: [{ viewport: "DESKTOP", page, frame: { size: "XS", ...frame } }] });
  const cardOf = (unit, label, extra = {}) => ({ frame: { unit, label, rows: [{ items: [{ text: "180" }] }], ...extra } });
  const inPage = (items) => ({ rows: [{ items }] });

  // 1 · a card with parts is a `DSCardWidget`
  const parts = [{ label: "Sign-in", rows: [{ items: [{ text: "Email" }] }] }];
  one("a `DSCard` with titled parts is a finding: a card with parts is a `DSCardWidget`",
    page(inPage([cardOf("DSCard", "Account", { sections: parts })])).findings, says("a card with parts is a `DSCardWidget`"));
  one("a `DSCardWidget` with titled parts is clean", page(inPage([cardOf("DSCardWidget", "Account", { sections: parts }), cardOf("DSCardWidget", "Platform", { sections: parts })])).findings, none);

  // 2 · a card shows its own info: several side by side stay `DSCard`s
  const container = (rows) => ({ frame: { unit: "DSPanelContainer", label: "Providers", rows } });
  one("four `DSCard`s side by side are clean: a number with its caption is a card, however many come from data",
    page(inPage([cardOf("DSCard", "Users"), cardOf("DSCard", "Roles"), cardOf("DSCard", "Organizations"), cardOf("DSCard", "Accounts")])).findings, none);
  one("two `DSCard`s that are the only content of a container, one under another, are clean",
    page(inPage([container([{ items: [cardOf("DSCard", "Email")] }, { items: [cardOf("DSCard", "SMS")] }])])).findings, none);
  one("one `DSCard` on its own is clean", page(inPage([container([{ items: [cardOf("DSCard", "Owned by Dana Lee")] }])])).findings, none);

  // 3 · a `DSCardWidget` has a head: a mark, or actions in the head, or titled parts
  one("a `DSCardWidget` with no head and no parts, among siblings, is a finding: a card with no head and no parts is a `DSCard`",
    page(inPage([cardOf("DSCardWidget", "Users"), cardOf("DSCardWidget", "Roles")])).findings, says("a card with no head and no parts is a `DSCard`"));
  one("a `DSCardWidget` with no head and no parts, on its own, is a finding as well",
    page(inPage([cardOf("DSCardWidget", "Owned by Dana Lee")])).findings, says("a card with no head and no parts is a `DSCard`"));
  one("a `DSCardWidget` with a mark in its head is clean", page(inPage([cardOf("DSCardWidget", "Email", { media: "person" }), cardOf("DSCardWidget", "SMS", { media: "bell" })])).findings, none);
  one("a `DSCardWidget` with actions in its head is clean", page(inPage([cardOf("DSCardWidget", "Email", { actions: [{ icon: "more" }] })])).findings, none);
  one("the same card as a `DSCard` is clean", page(inPage([cardOf("DSCard", "Owned by Dana Lee")])).findings, none);

  // 4 · a page-level row that holds words and an action, outside any frame
  const loose = { rows: [{ items: [{ text: "Owned by Dana Lee" }, { spacer: true }, { control: "button", text: "Transfer ownership" }] }] };
  one("a row of the page outside any frame that holds words and an action is a finding: it is a `DSCard`",
    page(loose).findings, says("a row of the page outside any frame holds words and an action: one thing with its own info and action is a `DSCard`"));
  one("the same row in a `DSCard` is clean", page(inPage([{ frame: { unit: "DSCard", label: "Owned by Dana Lee", rows: [{ items: [{ control: "button", text: "Transfer ownership" }] }] } }])).findings, none);

  // 5 · a frame that writes both `look` and `unit`, where the look is not the unit's
  one("a frame that writes a `look` its unit's level does not give is a finding: the unit decides the look",
    page(inPage([{ frame: { unit: "DSDrawer", look: "container", rows: [{ items: [{ text: "Urgent" }] }] } }])).findings, says("the unit decides the look; drop `look`"));
  one("a composite is a component by its name: it takes the look of a component, so a container look on it is a finding and its own is not",
    [page(inPage([{ frame: { unit: "DSDataTable", look: "container", rows: [{ items: [{ text: "Urgent" }] }] } }])).findings.length, page(inPage([{ frame: { unit: "DSDataTable", look: "flat", rows: [{ items: [{ text: "Urgent" }] }] } }])).findings.length], (g) => g[0] === 1 && g[1] === 0);
  one("a frame that writes the look its unit gives is not a finding", page(inPage([{ frame: { unit: "DSPanelContainer", look: "container", label: "Tags", rows: [{ items: [{ text: "Urgent" }] }] } }])).findings, none);
  one("a frame that names only its unit is clean, and is drawn in the look of its level",
    [page(inPage([{ frame: { unit: "DSDrawer", rows: [{ items: [{ text: "Urgent" }] }] } }])).findings, page(inPage([{ frame: { unit: "DSPanelContainer", label: "Tags", rows: [{ items: [{ text: "Urgent" }] }] } }])).svg.includes(">DSPanelContainer<")],
    (g) => g[0].length === 0 && g[1]);

  // 6 · a row built by hand as words, a note and an action is an `item`
  const byHand = { unit: "DSPanelContainer", label: "Sign-in", rows: [{ items: [{ text: "Acme Okta" }, { note: "Connected 2 May" }, { spacer: true }, { icon: "more" }] }] };
  one("a row built by hand as words, a note and an action is a finding: write it as an `item`",
    page(inPage([{ frame: byHand }])).findings, says("one line about one thing is a `DSItem`; write it as an `item`"));
  one("the same line as an `item` is clean",
    page(inPage([{ frame: { ...byHand, rows: [{ items: [{ item: { title: "Acme Okta", description: "Connected 2 May", end: [{ icon: "more" }] }, fill: true }] }] } }])).findings, none);
  one("a filter bar's row, with its field and its separator, is not a hand-built line",
    page(inPage([{ frame: { unit: "DSPanelContainer", label: "Orders", rows: [{ items: [{ control: "field", text: "Search", fill: true }, { note: "|" }, { icon: "search" }] }] } }])).findings, none);

  // 7 · a skeleton draws a rail shut to its icons on a desktop too; `open: true` is the exception
  const RAIL = { type: "RAIL", body: { width: "FULL" }, navigation: { nav: ["Orders", "Customers"], chosen: "Orders" } };
  const railW = (g) => [...g.matchAll(/<rect class="sds-skel-surface" x="[\d.]+" y="[\d.]+" width="([\d.]+)"/g)].map((m) => Number(m[1]))[0];
  const body = inPage([{ frame: { unit: "DSPanelContainer", label: "Orders", rows: [{ items: [{ text: "180" }] }] } }]);
  one("a rail at a desktop is shut to its icons, 40 wide, and the words of its entries are not drawn",
    [railW(page(body, RAIL).svg), page(body, RAIL).svg.includes(">Customers<"), page(body, RAIL).findings], (g) => g[0] === 40 && !g[1] && g[2].length === 0);
  one("a rail with `open: true` is the exception: open at a desktop, 131 wide, with the words of its entries",
    [railW(page(body, { ...RAIL, navigation: { ...RAIL.navigation, open: true } }).svg), page(body, { ...RAIL, navigation: { ...RAIL.navigation, open: true } }).svg.includes(">Customers<"), page(body, { ...RAIL, navigation: { ...RAIL.navigation, open: true } }).findings],
    (g) => g[0] === 131 && g[1] && g[2].length === 0);
  one("`open` on a layout that is no `RAIL` is a finding", page(body, { type: "DOCK", navigation: { open: true } }).findings, says("only a `RAIL` takes `open`"));
  one("`open` that is not true or false is a finding", page(body, { ...RAIL, navigation: { ...RAIL.navigation, open: "yes" } }).findings, says("only a `RAIL` takes `open`"));
}

console.log("=== SKELETON — a feature's head, in DSFeature's own names (RD.DEVEX.WORKSPACE.284)");
{
  const SENTENCE = "Each order shows where it stands and what waits on it, from paid to shipped.";
  const headed = (head, extra = {}) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ head: { title: "Watch every order move", ...head }, ...extra }] }] } });
  // A head in a column a third of the row wide, a part beside it, and a line of words under the head in the same column.
  const narrow = (head) => draw({ kind: "skeleton", frame: { rows: [{ items: [
    { frame: { width: "1/3", rows: [{ items: [{ head: { title: "Watch every order move", ...head } }] }, { items: [{ text: "After the head" }] }] } },
    { slot: "mediaNode", fill: true }] }] } });
  const texts = (g, cls) => [...g.matchAll(new RegExp(`<text class="${cls}" x="([\\d.]+)" y="([\\d.]+)"(?: style="([^"]*)")?>([^<]*)<`, "g"))]
    .map((m) => ({ x: Number(m[1]), y: Number(m[2]), style: m[3] ?? "", words: m[4] }));
  const sized = (g, px) => texts(g, "sds-note").filter((t) => t.style.startsWith(`font-size:${px}px`));
  const titleOf = (g) => texts(g, "sds-title").filter((t) => /font-size:(24|20|15)px/.test(t.style));
  const height = (g) => Number(/viewBox="[-\d.]+ [-\d.]+ [\d.]+ ([\d.]+)"/.exec(g)?.[1]);

  // 1 · the title stands at its level's step, heavy; the description a step larger than an item's words
  one("a head's title stands at its level's step: 24px at PAGE, 20px at CONTAINER, 15px at WIDGET, and 20px where `pageLevel` is left out",
    ["PAGE", "CONTAINER", "WIDGET", undefined].map((pageLevel) => titleOf(headed(pageLevel ? { pageLevel } : {}).svg)[0]?.style),
    (g) => g.join("|") === "font-size:24px|font-size:20px|font-size:15px|font-size:20px");
  one("a head's description is 16px at PAGE, 14px at CONTAINER and 13px at WIDGET, each larger than an item's 11px line",
    ["PAGE", "CONTAINER", "WIDGET"].map((pageLevel, i) => sized(headed({ pageLevel, description: "From paid to shipped." }).svg, [16, 14, 13][i]).map((t) => t.words).join("")),
    (g) => g.every((words) => words === "From paid to shipped."));

  // 2 · the eyebrow is drawn in capitals, small and spaced, packed 6px above the title
  const withEyebrow = headed({ eyebrow: "Orders" }), without = headed({});
  one("the eyebrow is written in a sentence's case and drawn in capitals, 11px and spaced",
    sized(withEyebrow.svg, 11).map((t) => [t.words, t.style]),
    (g) => g.length === 1 && g[0][0] === "ORDERS" && g[0][1].includes("letter-spacing") && !withEyebrow.svg.includes(">Orders<"));
  one("the eyebrow's line and a 6px gap stand above the title: the title moves down by 14 + 6 and the head grows by the same",
    [titleOf(withEyebrow.svg)[0]?.y - titleOf(without.svg)[0]?.y, height(withEyebrow.svg) - height(without.svg), titleOf(withEyebrow.svg)[0]?.y - sized(withEyebrow.svg, 11)[0]?.y],
    ([moved, grown, apart]) => moved === 20 && grown === 20 && apart > 0 && apart < 30);
  one("a head is as tall as its lines and takes no control's height: a title alone at 20px stands lower than a row with a button",
    [height(without.svg), height(draw({ kind: "skeleton", frame: { rows: [{ items: [{ control: "button", text: "Go" }] }] } }).svg)],
    ([title, button]) => title < button);

  // 3 · the title and the description wrap at a word to the column, and the height counts every line
  const wrapped = narrow({ description: SENTENCE });
  const lines = sized(wrapped.svg, 14), after = texts(wrapped.svg, "sds-label").find((t) => t.words === "After the head");
  one("a long description in a narrow column wraps at a word, onto three lines or more, and keeps every word",
    [lines.length, lines.map((t) => t.words).join(" ")], ([count, words]) => count >= 3 && words === SENTENCE);
  one("the wrapped head's height counts every line: the row under it starts below the last line, a gap clear",
    [after?.y, lines.at(-1)?.y], ([next, last]) => next - last >= 24);
  one("a title wider than its column wraps at a word too", narrow({ title: "Watch every order move through the shop" }).svg, (g) => titleOf(g).length >= 2);
  one("a wrapped head draws clean", wrapped.findings, none);

  // 4 · the facts stand on one line under the description, as an item's facts do
  const facts = headed({ description: "From paid to shipped.", facts: [{ control: "badge", text: "Real time" }, { control: "badge", text: "Shopify" }] });
  const badges = [...facts.svg.matchAll(/<rect class="sds-skel-control" x="([\d.]+)" y="([\d.]+)" width="[\d.]+" height="16"/g)].map((m) => [Number(m[1]), Number(m[2])]);
  one("a head's facts stand on one line under the description: two badges at the facts' height, side by side, with a dot between",
    [badges, sized(facts.svg, 14)[0]?.y, texts(facts.svg, "sds-note").filter((t) => t.words === "·").length, facts.findings],
    ([marks, description, dots, found]) => marks.length === 2 && marks[0][1] === marks[1][1] && marks[1][0] > marks[0][0] && marks[0][1] > description && dots === 1 && found.length === 0);
  one("a fact that is only words is drawn as a word", headed({ facts: [{ text: "Live" }] }).svg, (g) => texts(g, "sds-note").some((t) => t.words === "Live"));

  // 5 · `textAlign` `CENTER` centres every line
  const start = headed({ description: "From paid to shipped." }), centred = headed({ description: "From paid to shipped.", textAlign: "CENTER" });
  one("`textAlign` `CENTER` centres every line: each starts further in than at `START`, and the shorter line further in again",
    [titleOf(start.svg)[0]?.x, titleOf(centred.svg)[0]?.x, sized(start.svg, 14)[0]?.x, sized(centred.svg, 14)[0]?.x, centred.findings],
    ([titleStart, titleCentre, lineStart, lineCentre, found]) => titleCentre > titleStart && lineCentre > lineStart && lineCentre > titleCentre && found.length === 0);

  // 6 · the findings
  one("a head with no `title` is a finding", draw({ kind: "skeleton", frame: { rows: [{ items: [{ head: { eyebrow: "Orders" } }] }] } }).findings, says("a head carries its `title`"));
  one("a `pageLevel` the head does not take is a finding", headed({ pageLevel: "GROUP" }).findings, says("a head's `pageLevel` is `GROUP`, and a head takes PAGE · CONTAINER · WIDGET"));
  one("a `textAlign` the head does not take is a finding", headed({ textAlign: "END" }).findings, says("a head's `textAlign` is `END`, and a head takes START · CENTER"));
  one("a title with one word wider than its column, after wrapping, is a finding",
    draw({ kind: "skeleton", frame: { rows: [{ items: [{ frame: { width: "1/4", rows: [{ items: [{ head: { pageLevel: "PAGE", title: "Internationalization" } }] }] } }, { slot: "x", fill: true }] }] } }).findings,
    says("has a word wider than its column: `Internationalization`"));
  one("a fact under a head that is neither a word nor a badge is a finding", headed({ facts: [{ icon: "more" }] }).findings, says("a fact under a head is a word or a badge"));

  // 7 · a spec written with loose text draws byte for byte as before (the hash of the drawer before the head item)
  const LOOSE = { kind: "skeleton", title: "Loose words", views: [{ viewport: "DESKTOP", frame: { size: "XS", rows: [
    { items: [{ note: "Orders" }] },
    { items: [{ text: "Watch every order move" }] },
    { items: [{ note: "Where each order stands, and what waits." }, { spacer: true }, { control: "badge", text: "Real time" }] },
    { items: [{ item: { media: "default", title: "Live status", description: "Paid, packed or shipped" }, fill: true }] }] } }] };
  one("a spec with loose `text` and `note` items draws byte for byte as it did before the head item",
    createHash("sha256").update(draw(LOOSE).svg).digest("hex"), "5dad41d636d8f5b8ece28d801e51e4df6adcede2b6863539b049a57d74494a24");
}

console.log("=== SKELETON — a section's fill and room, a feature's frames, and every field read (RD.DEVEX.WORKSPACE.285 to .288)");
{
  /** Every rect of one class, as [x, y, width, height, corner]. */
  const boxes = (g, cls) => [...g.matchAll(new RegExp(`<rect class="${cls}" x="([\\d.]+)" y="([\\d.]+)" width="([\\d.]+)" height="([\\d.]+)" rx="([\\d.]+)"`, "g"))].map((m) => m.slice(1).map(Number));
  const wordsAt = (g, words) => [...g.matchAll(/<text class="[^"]+" x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)</g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]), words: m[3] })).find((t) => t.words === words);
  const same = (one_, other) => JSON.stringify(one_) === JSON.stringify(other);
  const NOTE = [{ items: [{ note: "Every team rebuilds the same plumbing" }] }];
  const section = (look, rows = NOTE) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSSectionContainer", rows, ...look } }] }] } });
  const feature = (look, rows) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSFeature", rows, ...look } }] }] } });
  const extent = (g) => boxes(g, "sds-skel-guide")[0];
  const DOORS = [{ items: [{ item: { media: "default", title: "Secure", description: "Zero trust by construction" }, fill: true }, { item: { media: "default", title: "Scalable" }, fill: true }] }];
  const HEAD = [{ items: [{ head: { title: "Plans for every team" } }] }];
  const BESIDE = [{ items: [{ frame: { rows: HEAD } }, { slot: "mediaNode · the product", fill: true }] }];

  // 1 · `DSFeatureGridSectionContainer` is a unit, a container by its name
  const cell = { fill: true, frame: { unit: "DSFeature", rows: [{ items: [{ head: { pageLevel: "WIDGET", title: "Audit log" } }] }] } };
  const grid = draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSFeatureGridSectionContainer", rows: [...HEAD, { items: [cell, { ...cell }] }] } }] }] } });
  one("`DSFeatureGridSectionContainer` is a unit a spec may name: a container, drawn as a section is, its name at the corner of its outline",
    [grid.findings, grid.svg.includes(">DSFeatureGridSectionContainer<"), boxes(grid.svg, "sds-skel-control").filter((b) => b[4] === 8)[0], extent(grid.svg)],
    ([found, named, box, outer]) => found.length === 0 && named && box[0] === outer[0] && box[2] === outer[2]);

  // 2 · a section's fill is a band across its box, and every strength draws the same band
  const banded = section({ color: "DEFAULT" });
  one("a section's `color` other than `BASE` is a band: a raised frame's background across the whole box, square, and no finding",
    [banded.findings, boxes(banded.svg, "sds-skel-surface"), extent(banded.svg), boxes(section({}).svg, "sds-skel-surface"), boxes(section({ color: "BASE" }).svg, "sds-skel-surface")],
    ([found, band, outer, plain, base]) => found.length === 0 && band.length === 1 && same(band[0].slice(0, 4), outer.slice(0, 4)) && band[0][4] === 0 && plain.length === 0 && base.length === 0);
  one("how strong the fill is belongs to the library's look: `SUBTLE`, `QUIET` and `SOLID` draw the same band, and a fill draws one",
    ["SUBTLE", "QUIET", "SOLID"].map((strength) => section({ color: "PRIMARY", strength }).svg),
    (g) => g[0] === g[1] && g[1] === g[2] && g[0] !== section({}).svg);

  // 3 · `inset` is a solid line along the top and the bottom edge of the box, and none at its sides
  const inset = section({ inset: true }), [ix, iy, iw, ih] = extent(inset.svg);
  one("a section's `inset` is a solid line along its top and its bottom edge, and none at its sides",
    [inset.findings, [...inset.svg.matchAll(/<path class="sds-skel-border" d="([^"]+)"/g)].map((m) => m[1]), section({}).svg.includes("sds-skel-border")],
    ([found, lines, plain]) => found.length === 0 && lines.length === 1 && lines[0] === `M${ix} ${iy} L${ix + iw} ${iy} M${ix} ${iy + ih} L${ix + iw} ${iy + ih}` && !plain);

  // 4 · a `size` stands the section's room above and below its content: its room on a phone
  one("a section's `size` stands its room above and below its content: 24, 32, 56, 64 and 72 for XS to XL, each side",
    ["XS", "SM", "MD", "LG", "XL"].map((size, i) => extent(section({ size }).svg)[3] - 20 - [28, 32, 36, 40, 44][i]),
    (g) => g.join() === "48,64,112,128,144");
  one("the content stands its room under the section's name: at `SM`, 16 further down than a section with no `size`",
    wordsAt(section({ size: "SM" }).svg, "Every team rebuilds the same plumbing").y - wordsAt(section({}).svg, "Every team rebuilds the same plumbing").y, 16);

  // 5 · a section's fields are a section's, and take the values the design system has
  one("`color`, `strength` or `inset` on a frame that is not a `DSSectionContainer` is a finding",
    draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSPanelContainer", label: "Orders", inset: true, rows: NOTE } }] }] } }).findings,
    says("`inset` is a field of a `DSSectionContainer`, and this frame is `DSPanelContainer`"));
  one("a `color` or a `strength` the design system does not have is a finding",
    [section({ color: "BLUE" }).findings, section({ strength: "LOUD" }).findings],
    ([colour, strength]) => says("a section's `color` is `BLUE`, and it takes BASE · DEFAULT · PRIMARY")(colour) && says("a section's `strength` is `LOUD`, and it takes SUBTLE · QUIET · SOLID")(strength));

  // 6 · `items.surface` puts each item line of a feature in a frame of its own
  const doors = feature({ items: { surface: {} } }, DOORS);
  const doorBoxes = boxes(doors.svg, "sds-skel-control").filter((b) => b[4] === 8);
  one("`items.surface` puts each item line in a thin rounded outline of its own, as tall as its row, its words a boundary's padding in",
    [doors.findings, doorBoxes, wordsAt(doors.svg, "Secure"), wordsAt(doors.svg, "Scalable")],
    ([found, two, secure, scalable]) => found.length === 0 && two.length === 2 && two[0][3] === two[1][3] && two[0][1] === two[1][1]
      && secure.x > two[0][0] + 16 && scalable.x > two[1][0] + 16 && secure.y > two[0][1] + 16 && scalable.y < two[1][1] + two[1][3]);
  one("a boxed line takes a boundary's padding on every side: the row is 32 taller than the same lines unboxed",
    extent(doors.svg)[3] - extent(feature({}, DOORS).svg)[3], 32);
  const raisedDoors = feature({ items: { surface: { raised: true, elevation: "MD" } } }, DOORS);
  one("a raised frame has a raised frame's background behind its outline, and a bordered one a solid line in place of the thin one",
    [boxes(raisedDoors.svg, "sds-skel-surface").filter((b) => b[4] === 8), boxes(raisedDoors.svg, "sds-skel-control").filter((b) => b[4] === 8),
      boxes(feature({ items: { surface: { bordered: true } } }, DOORS).svg, "sds-skel-border"), boxes(feature({ items: { surface: { bordered: true } } }, DOORS).svg, "sds-skel-control").filter((b) => b[4] === 8)],
    ([fills, outlines, solid, thin]) => fills.length === 2 && same(fills, outlines) && solid.length === 2 && thin.length === 0);
  one("a frame with `rounded` false has square corners", boxes(feature({ items: { surface: { rounded: false } } }, DOORS).svg, "sds-skel-control").filter((b) => b[4] === 0).length, 2);
  one("a colour other than `BASE` gives the frame a background too", boxes(feature({ items: { surface: { color: "DEFAULT" } } }, DOORS).svg, "sds-skel-surface").filter((b) => b[4] === 8).length, 2);
  one("how far a raised frame stands off belongs to the library's look: `elevation` `MD` and `LG` draw the same raised frame",
    [feature({ items: { surface: { raised: true, elevation: "LG" } } }, DOORS).svg === raisedDoors.svg, boxes(raisedDoors.svg, "sds-skel-surface").filter((b) => b[4] === 8).length],
    ([alike, raised]) => alike && raised === 2);

  // 7 · `frames` and `surface`: the feature's own frame, round the whole of it, its media, or its words
  const whole = feature({ frames: ["TEXT"], surface: {} }, HEAD);
  one("`frames` `TEXT` on a feature with no media frames the whole feature, in place of its dotted boundary, its name kept",
    [whole.findings, boxes(whole.svg, "sds-skel-guide"), boxes(whole.svg, "sds-skel-control").filter((b) => b[4] === 8), extent(feature({}, HEAD).svg), whole.svg.includes(">DSFeature<")],
    ([found, guides, frame, plain, named]) => found.length === 0 && guides.length === 0 && frame.length === 1 && same(frame[0].slice(0, 4), plain.slice(0, 4)) && named);
  const media = feature({ frames: ["MEDIA"], surface: { raised: true, elevation: "LG" } }, [...HEAD, { items: [{ slot: "mediaNode · the product", fill: true, height: 3 }] }]);
  const plainMedia = feature({}, [...HEAD, { items: [{ slot: "mediaNode · the product", fill: true, height: 3 }] }]);
  one("`frames` `MEDIA` frames the slot that is the feature's media, flush, and the feature keeps its dotted boundary",
    [media.findings, boxes(media.svg, "sds-skel-control").filter((b) => b[4] === 8), boxes(media.svg, "sds-skel-surface").filter((b) => b[4] === 8), boxes(plainMedia.svg, "sds-skel-guide")[1], extent(media.svg)],
    ([found, outline, fill, slot, outer]) => found.length === 0 && outline.length === 1 && same(outline, fill) && same(outline[0].slice(0, 4), slot.slice(0, 4)) && outer !== undefined);
  one("`frames` `TEXT` and `MEDIA` together frame the whole feature, and leave the slot its own mark",
    [boxes(feature({ frames: ["TEXT", "MEDIA"] }, BESIDE).svg, "sds-skel-control").filter((b) => b[4] === 8), extent(feature({}, BESIDE).svg)],
    ([frame, outer]) => frame.length === 1 && same(frame[0].slice(0, 4), outer.slice(0, 4)));
  const words = feature({ frames: ["TEXT"] }, BESIDE), wordsPlain = feature({}, BESIDE);
  one("`frames` `TEXT` alone beside media frames the words, and the slot keeps its dotted mark",
    [words.findings, boxes(words.svg, "sds-skel-control").filter((b) => b[4] === 8), boxes(wordsPlain.svg, "sds-skel-guide")[1], boxes(words.svg, "sds-skel-guide").length, boxes(wordsPlain.svg, "sds-skel-guide").length],
    ([found, frame, column, guides, plainGuides]) => found.length === 0 && frame.length === 1 && same(frame[0].slice(0, 4), column.slice(0, 4)) && guides === plainGuides);

  // 8 · the frames' findings
  one("a feature's `surface` with no part named in `frames` is a finding: it paints nothing", feature({ surface: { raised: true } }, HEAD).findings, says("paints only the parts its `frames` names"));
  one("an `elevation` on a frame that is not raised is a finding", feature({ items: { surface: { elevation: "MD" } } }, DOORS).findings, says("gives an `elevation` and is not `raised`"));
  one("a part the feature does not have in `frames` is a finding", feature({ frames: ["BODY"] }, HEAD).findings, says("a `DSFeature`'s `frames` names its parts, TEXT · MEDIA"));
  one("an `elevation` the design system does not have is a finding", feature({ items: { surface: { raised: true, elevation: "XXL" } } }, DOORS).findings, says("the `elevation` of a feature's `items.surface` is `XXL`"));
  one("`surface` or `items` on a unit that is not a `DSFeature` is a finding",
    [draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSCard", label: "Team", surface: { raised: true }, rows: NOTE } }] }] } }).findings, section({ items: { surface: {} } }).findings],
    ([card, sectioned]) => says("`surface` is a field of a `DSFeature`, and this frame is `DSCard`")(card) && says("`items` is a field of a `DSFeature`, and this frame is `DSSectionContainer`")(sectioned));

  // 9 · a field that a skeleton does not have is a finding, never silence
  one("`numbered` on a feature is no field a skeleton has, and is named in a finding", feature({ numbered: true }, HEAD).findings, says("`numbered` is no field of a frame"));
  one("`selected` on an item is no field a skeleton has, and is named in a finding", feature({}, [{ items: [{ item: { title: "Shape" }, selected: true, fill: true }] }]).findings, says("`selected` is no field of an item"));
  one("a key of a feature's `items` the skeleton does not draw is named, `items.orientation` among them", feature({ items: { orientation: "VERTICAL" } }, DOORS).findings, says("`orientation` is no field of a feature's `items`"));
  one("a field of a row, a head, an item line, a view and the spec is read too",
    draw({ kind: "skeleton", subtitle: "x", views: [{ viewport: "DESKTOP", zoom: 2, frame: { rows: [{ height: 2, items: [{ head: { title: "A", align: "CENTER" } }, { item: { title: "B", badge: "x" }, fill: true }] }] } }] }).findings,
    (g) => ["`subtitle` is no field of a skeleton spec", "`zoom` is no field of a view", "`height` is no field of a row", "`align` is no field of a head", "`badge` is no field of an item line"].every((s) => says(s)(g)));
  one("`tone` keeps the finding that names what replaced it, and a field beside it that no skeleton has is named on its own",
    draw({ kind: "skeleton", frame: { tone: "warn", shade: "dark", rows: NOTE } }).findings,
    (g) => g.length === 2 && says("no longer reads `tone`")(g) && says("`shade` is no field of a frame")(g) && !says("`tone` is no field")(g));

  // 10 · a section and a feature written with none of the new fields draw byte for byte as before (the hash of the drawer before this row)
  const PLAIN = { kind: "skeleton", title: "A section and a feature, as before", views: [{ viewport: "DESKTOP", frame: { size: "XS", rows: [{ items: [{ fill: true, frame: { unit: "DSSectionContainer", rows: [{ items: [{ fill: true, frame: { unit: "DSFeature", rows: [
    { items: [{ head: { eyebrow: "Orders", title: "Watch every order move", description: "Each order shows where it stands." } }] },
    { items: [{ item: { media: "default", title: "Live status", description: "Paid, packed or shipped" }, fill: true }, { slot: "mediaNode · the product", fill: true }] }] } }] }] } }] }] } }] };
  one("a section and a feature written with none of the new fields draw byte for byte as before",
    createHash("sha256").update(draw(PLAIN).svg).digest("hex"), "45e92a0ba59ce1114ff1ad250657ca422a65eb0ff970dcfd29563b23231bbafd");
}

console.log("=== SKELETON — lines, numbers and alignment, and a grid section's fill (RD.DEVEX.WORKSPACE.289 to .293)");
{
  /** Every rect of one class, as [x, y, width, height, corner]. */
  const boxes = (g, cls) => [...g.matchAll(new RegExp(`<rect class="${cls}" x="([\\d.]+)" y="([\\d.]+)" width="([\\d.]+)" height="([\\d.]+)" rx="([\\d.]+)"`, "g"))].map((m) => m.slice(1).map(Number));
  const wordsAt = (g, words) => [...g.matchAll(/<text class="[^"]+" x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)</g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]), words: m[3] })).find((t) => t.words === words);
  /** The thin lines across, as [x1, y, x2], and the thin lines down, as [x, y1, y2]. */
  const across = (g) => [...g.matchAll(/<path class="sds-skel-control" d="M([\d.]+) ([\d.]+) H([\d.]+)"/g)].map((m) => m.slice(1).map(Number));
  const down = (g) => [...g.matchAll(/<path class="sds-skel-control" d="M([\d.]+) ([\d.]+) V([\d.]+)"/g)].map((m) => m.slice(1).map(Number));
  const ITEM = (title, extra = {}) => ({ item: { title, description: "One line under it" }, ...extra });
  const FILLED = (title) => ITEM(title, { fill: true });
  const HEAD = (textAlign) => ({ items: [{ head: { title: "Start in four steps", ...(textAlign ? { textAlign } : {}) } }] });
  const feature = (look, rows) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSFeature", rows, ...look } }] }] } });
  const LIST = [{ items: [FILLED("Connect your store")] }, { items: [FILLED("Choose your plan")] }, { items: [FILLED("Go live")] }];
  const GRID = [{ items: [FILLED("Live status"), FILLED("One place to act")] }, { items: [FILLED("Every channel"), FILLED("Audit built in")] }];

  // 1 · the lines between a feature's items, in `DSGridBorderType`'s words
  const list = feature({ items: { type: "LIST" } }, LIST), unlined = feature({}, LIST);
  const connect = wordsAt(list.svg, "Connect your store"), choose =wordsAt(list.svg, "Choose your plan"), live = wordsAt(list.svg, "Go live");
  one("`items.type` `LIST` draws a line under every item but its last, across the column, where `borderType` is left out, and no finding",
    [list.findings, across(list.svg), down(list.svg), across(unlined.svg)],
    ([found, lines, verticals, none_]) => found.length === 0 && lines.length === 2 && verticals.length === 0 && none_.length === 0
      && lines[0][1] > connect.y && lines[0][1] < choose.y && lines[1][1] > choose.y && lines[1][1] < live.y && lines[0][2] - lines[0][0] > 900);
  const noneList = feature({ items: { type: "LIST", borderType: "NONE" } }, LIST), gridItems = feature({ items: { type: "GRID" } }, GRID);
  one("a `LIST` with `borderType` `NONE` draws no line, and a `GRID` draws none where `borderType` is left out, with no finding",
    [noneList.findings, gridItems.findings, across(noneList.svg), across(gridItems.svg), down(gridItems.svg)],
    ([found, gridFound, ...lines]) => found.length === 0 && gridFound.length === 0 && lines.every((drawn) => drawn.length === 0));
  const grid = feature({ items: { borderType: "GRID" } }, GRID);
  const [rowLine] = across(grid.svg), verticals = down(grid.svg);
  one("`borderType` `GRID` on a `GRID` of items draws a line under the first row and one in the gap between the two items of each row, and the lines meet",
    [grid.findings, across(grid.svg), verticals, wordsAt(grid.svg, "Live status"), wordsAt(grid.svg, "One place to act")],
    ([found, lines, downs, first, second]) => found.length === 0 && lines.length === 1 && downs.length === 2 && downs[0][0] === downs[1][0]
      && downs[0][0] > first.x && downs[0][0] < second.x && downs[0][2] === rowLine[1] && downs[1][1] === rowLine[1]
      && rowLine[0] < downs[0][0] && rowLine[2] > downs[0][0]);
  const edge = feature({ items: { borderType: "EDGE" } }, GRID);
  one("`EDGE` adds a thin rounded outline round the items, and the lines reach it",
    [boxes(edge.svg, "sds-skel-control").filter((b) => b[4] === 8), across(edge.svg), down(edge.svg)],
    ([outline, lines, downs]) => outline.length === 1 && lines.length === 1 && lines[0][0] === outline[0][0] && lines[0][2] === outline[0][0] + outline[0][2]
      && downs[0][1] === outline[0][1] && downs[1][2] === outline[0][1] + outline[0][3]);
  const boxedList = feature({ items: { type: "LIST", surface: {} } }, LIST), boxedGrid = feature({ items: { borderType: "GRID", surface: {} } }, GRID);
  one("items boxed by `items.surface` take no line, as the design system reads none there, with no finding",
    [boxedList.findings, boxedGrid.findings, across(boxedList.svg), across(boxedGrid.svg), down(boxedGrid.svg)],
    ([found, gridFound, ...lines]) => found.length === 0 && gridFound.length === 0 && lines.every((drawn) => drawn.length === 0));
  const split = feature({ items: { type: "LIST" } }, [HEAD(), { items: [{ frame: { rows: LIST } }, { slot: "mediaNode · the setup screen", fill: true }] }]);
  one("the items in a region of the feature that is no unit take its lines too",
    [split.findings, across(split.svg).length], ([found, count]) => found.length === 0 && count === 2);
  const CELL = (title) => ({ fill: true, frame: { unit: "DSFeature", rows: [{ items: [{ head: { pageLevel: "WIDGET", title } }] }] } });
  const gsec = (look, rows) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSFeatureGridSectionContainer", rows, ...look } }] }] } });
  const CELLS = [HEAD(), { items: [CELL("Documents"), CELL("Audit log")] }, { items: [CELL("Notifications"), { spacer: true }] }];
  const lined = gsec({ grid: { borderType: "GRID" } }, CELLS);
  one("a grid section's `grid.borderType` `GRID` draws the lines between its cells: under the first row of cells, and in the gap after a cell, a short row's too; none under the heading",
    [lined.findings, across(lined.svg), down(lined.svg), wordsAt(lined.svg, "Start in four steps"), across(gsec({}, CELLS).svg).length, down(gsec({}, CELLS).svg).length],
    ([found, lines, downs, heading, plainAcross, plainDown]) => found.length === 0 && lines.length === 1 && lines[0][1] > heading.y + 12 && downs.length === 2
      && downs[0][0] === downs[1][0] && plainAcross === 0 && plainDown === 0);
  one("an `items.type` the design system lacks, a `borderType` it lacks, `divided` on a `DSFeature`, and `grid` on another frame are findings",
    [feature({ items: { type: "MASONRY" } }, GRID).findings, feature({ items: { borderType: "DOTTED" } }, GRID).findings, feature({ divided: true }, LIST).findings,
      draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSSectionContainer", grid: { borderType: "GRID" }, rows: [HEAD()] } }] }] } }).findings,
      gsec({ grid: { borderType: "GRID", columns: 3 } }, CELLS).findings],
    ([masonry, dotted, divided, elsewhere, columns]) => says("`items.type` is `MASONRY`, and a skeleton draws GRID · LIST · STATS")(masonry)
      && says("a feature's `items.borderType` is `DOTTED`, and it takes NONE · GRID · EDGE")(dotted)
      && says("a `DSFeature`'s lines are its `items.type` `LIST` or its `items.borderType`")(divided)
      && says("`grid` is a field of a `DSFeatureGridSectionContainer`, and this frame is `DSSectionContainer`")(elsewhere)
      && says("`columns` is no field of a grid section's `grid`")(columns));

  // 2 · `items.numbered`: a number before each item's title, in the order the rows are read
  const numbered = feature({ items: { type: "LIST", numbered: true } }, [HEAD(), { items: [{ frame: { rows: LIST.slice(0, 2) } }, { slot: "mediaNode · the setup screen", fill: true }] }, LIST[2]]);
  const plain = feature({ items: { type: "LIST" } }, [HEAD(), { items: [{ frame: { rows: LIST.slice(0, 2) } }, { slot: "mediaNode · the setup screen", fill: true }] }, LIST[2]]);
  one("`items.numbered` puts 1., 2. and 3. before the titles, on the title's line, counted through a region in the order the rows are read",
    [numbered.findings, ["1.", "2.", "3."].map((n) => wordsAt(numbered.svg, n)), ["Connect your store", "Choose your plan", "Go live"].map((t) => wordsAt(numbered.svg, t))],
    ([found, numbers, titles]) => found.length === 0 && numbers.every((n, i) => n && n.y === titles[i].y && n.x < titles[i].x));
  one("the number takes the room before the title, and the description stays under the start of the line",
    [wordsAt(numbered.svg, "Go live"), wordsAt(plain.svg, "Go live"), wordsAt(numbered.svg, "3."), numbered.svg.match(/<text class="sds-note" x="([\d.]+)" y="[\d.]+">One line under it</)[1], plain.svg.match(/<text class="sds-note" x="([\d.]+)" y="[\d.]+">One line under it</)[1]],
    ([titled, untitled, number, under, plainUnder]) => titled.x > untitled.x && number.x === untitled.x && under === plainUnder);
  one("the number is quiet, at the title's size and weight", numbered.svg.includes('<text class="sds-note" x="') && /style="font-size:12px;font-weight:500">1\.</.test(numbered.svg), true);
  one("`items.numbered` that is not true or false is a finding", feature({ items: { numbered: "yes" } }, LIST).findings, says("`items.numbered` is `"));

  // 3 · a feature's `textAlign` lines up the rows that stand with its head
  const BUTTONS = { items: [{ control: "button", text: "Start building", main: true }, { control: "button", text: "Read the docs" }] };
  const buttons = (g) => boxes(g, "sds-skel-control(?: sds-skel-main)?").filter((b) => b[4] === 3);
  const centred = feature({}, [HEAD("CENTER"), BUTTONS]), started = feature({}, [HEAD(), BUTTONS]);
  const outer = (g) => boxes(g, "sds-skel-guide")[0];
  one("a head's `textAlign` `CENTER` centres the row of actions under it: the room left over is shared on its two sides",
    [centred.findings, buttons(centred.svg), outer(centred.svg), buttons(started.svg)],
    ([found, [first, second], box, [startFirst]]) => found.length === 0 && Math.abs((first[0] - box[0]) - (box[0] + box[2] - (second[0] + second[2]))) <= 1 && first[0] > startFirst[0]);
  const spacered = feature({}, [HEAD("CENTER"), { items: [{ spacer: true }, ...BUTTONS.items, { spacer: true }] }]);
  one("the centred row stands where the spacers on each side faked it", [buttons(centred.svg), buttons(spacered.svg)], ([one_, other]) => JSON.stringify(one_) === JSON.stringify(other));
  const ACROSS = [HEAD("CENTER"), BUTTONS, { items: [{ frame: { rows: [{ items: [ITEM("The decision")] }, { items: [{ control: "button", text: "See a record" }] }] } }, { slot: "mediaNode · draws the items", fill: true }] }];
  const headAcross = feature({}, ACROSS), headStart = feature({}, [HEAD(), ...ACROSS.slice(1)]);
  one("a row in a region that holds no head stays at the start, as the items and their action under a head across do",
    [wordsAt(headAcross.svg, "See a record"), wordsAt(headStart.svg, "See a record"), wordsAt(headAcross.svg, "Start building"), wordsAt(headStart.svg, "Start building")],
    ([record, recordStart, lead, leadStart]) => record.x === recordStart.x && lead.x > leadStart.x);
  const words = (look) => wordsAt(feature(look, [HEAD("CENTER"), { items: [ITEM("Live status"), ITEM("Every channel")] }]).svg, "Live status").x;
  one("item lines of a `GRID` that do not fill the row stand centred, and a `LIST`'s stay at the start",
    [words({}), words({ items: { type: "LIST" } }), wordsAt(feature({}, [HEAD(), { items: [ITEM("Live status"), ITEM("Every channel")] }]).svg, "Live status").x],
    ([grid_, list_, start]) => grid_ > start && list_ === start);
  const heading = gsec({}, [HEAD("CENTER"), BUTTONS, { items: [CELL("Documents"), CELL("Audit log")] }]);
  one("a grid section's centred heading centres its actions, and its cells keep the row",
    [heading.findings, buttons(heading.svg), boxes(heading.svg, "sds-skel-guide")[0]],
    ([found, [first, second], box]) => found.length === 0 && Math.abs((first[0] - box[0]) - (box[0] + box[2] - (second[0] + second[2]))) <= 1);

  // 4 · `verticalAlign` stands the two sides of a split against each other, each at its own height
  const WORDS = { frame: { rows: [HEAD(), { items: [FILLED("Connect your store")] }, { items: [FILLED("Choose your plan")] }, BUTTONS] } };
  const aligned = (verticalAlign) => feature(verticalAlign ? { verticalAlign } : {}, [{ items: [WORDS, { slot: "mediaNode · short code", fill: true, height: 2 }] }]);
  const slotOf = (g) => boxes(g, "sds-skel-guide").find((b) => b[3] === 64) ?? boxes(g, "sds-skel-guide")[2];
  const wordsBox = (g) => boxes(g, "sds-skel-guide")[1];
  const [topped, middled, footed, stretched] = ["TOP", "CENTER", "BOTTOM", undefined].map(aligned);
  one("`verticalAlign` `TOP`, `CENTER` and `BOTTOM` stand the short side at the top, the middle and the foot of the taller one, at its own height; with none it stretches as before",
    [...[topped, middled, footed].map((g) => [g.findings, slotOf(g.svg), wordsBox(g.svg)]), [boxes(stretched.svg, "sds-skel-guide")[2], wordsBox(stretched.svg)]],
    ([[f1, top, words1], [f2, middle, words2], [f3, foot, words3], [slot, words4]]) => [f1, f2, f3].every((f) => f.length === 0) && [top, middle, foot].every((s) => s && s[3] === 64)
      && top[1] === words1[1] && Math.abs(middle[1] + 32 - (words2[1] + words2[3] / 2)) < 1 && foot[1] + 64 === words3[1] + words3[3]
      && slot[3] > 64 && slot[3] === words4[3] && slot[1] === words4[1]);
  const tall = feature({ verticalAlign: "CENTER" }, [{ items: [{ frame: { rows: [HEAD()] } }, { slot: "mediaNode · the product", fill: true, height: 8 }] }]);
  one("the words beside a taller picture keep their own height, at the middle of it",
    [boxes(tall.svg, "sds-skel-guide")[1], boxes(tall.svg, "sds-skel-guide")[2]],
    ([region, slot]) => region[3] < slot[3] && Math.abs(region[1] + region[3] / 2 - (slot[1] + slot[3] / 2)) < 1);
  const folded = feature({ verticalAlign: "TOP" }, [HEAD(), ...LIST]);
  one("a view where the split folds, as a phone's, reads no `verticalAlign` and says nothing, as the design system reads it nowhere but in a split",
    [folded.findings, folded.svg === feature({}, [HEAD(), ...LIST]).svg], ([found, alike]) => found.length === 0 && alike);
  one("a `verticalAlign` the design system lacks, and `verticalAlign` on another unit, are findings",
    [feature({ verticalAlign: "MIDDLE" }, [{ items: [WORDS, { slot: "x", fill: true }] }]).findings,
      draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSSectionContainer", verticalAlign: "TOP", rows: [HEAD()] } }] }] } }).findings],
    ([middle, elsewhere]) => says("a feature's `verticalAlign` is `MIDDLE`, and it takes TOP · CENTER · BOTTOM")(middle)
      && says("`verticalAlign` is a field of a `DSFeature`, and this frame is `DSSectionContainer`")(elsewhere));

  // 5 · a grid section's `section` is drawn as a section's own fields
  const sectionOf = (look) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSSectionContainer", rows: [HEAD()], ...look } }] }] } });
  const sectioned = gsec({ section: { color: "DEFAULT", inset: true, size: "SM" } }, [HEAD()]), section_ = sectionOf({ color: "DEFAULT", inset: true, size: "SM" });
  const extent = (g) => boxes(g, "sds-skel-guide")[0];
  one("a grid section's `section` draws a section's band, its inset and its room, as a `DSSectionContainer` with the same fields does",
    [sectioned.findings, boxes(sectioned.svg, "sds-skel-surface"), extent(sectioned.svg), extent(section_.svg), /<path class="sds-skel-border" d="M[\d.]+ [\d.]+ L/.test(sectioned.svg), extent(gsec({}, [HEAD()]).svg)],
    ([found, band, box, sectionBox, inset, plainBox]) => found.length === 0 && band.length === 1 && JSON.stringify(band[0].slice(0, 4)) === JSON.stringify(box.slice(0, 4))
      && box[3] === sectionBox[3] && inset && box[3] > plainBox[3]);
  one("a grid section's `section.size` is the size of every block inside, as a section's is",
    buttons(gsec({ section: { size: "LG" } }, [HEAD(), BUTTONS]).svg).map((b) => b[3]), (g) => g.length === 2 && g.every((h) => h === 40));
  one("`section` on another frame, a value the design system lacks, and a key a skeleton does not draw are findings",
    [feature({ section: { color: "DEFAULT" } }, LIST).findings, gsec({ section: { color: "BLUE" } }, [HEAD()]).findings, gsec({ section: { flush: true } }, [HEAD()]).findings],
    ([elsewhere, blue, flush]) => says("`section` is a field of a `DSFeatureGridSectionContainer`, and this frame is `DSFeature`")(elsewhere)
      && says("a grid section's `section.color` is `BLUE`")(blue) && says("`flush` is no field of a grid section's `section`")(flush));

  // 6 · a spec written with none of these fields draws byte for byte as before (the hash of the drawer before this row)
  const ROW = (title) => ({ item: { media: "default", title, description: "One line under it" }, fill: true });
  const GCELL = (title) => ({ fill: true, frame: { unit: "DSFeature", rows: [{ items: [{ head: { pageLevel: "WIDGET", title, description: "Two records become one." } }] }] } });
  const AS_BEFORE = { kind: "skeleton", title: "Lines, numbers and alignment, as before", views: [{ viewport: "DESKTOP", frame: { size: "XS", rows: [
    { items: [{ fill: true, frame: { unit: "DSSectionContainer", rows: [{ items: [{ fill: true, frame: { unit: "DSFeature", rows: [
      { items: [{ head: { title: "Start in four steps", description: "From sign-in to your first order.", textAlign: "CENTER" } }] },
      { items: [{ spacer: true }, { control: "button", text: "Start building", main: true }, { control: "button", text: "Read the docs" }, { spacer: true }] },
      { items: [{ frame: { rows: [{ items: [ROW("Connect your store")] }, { items: [ROW("Choose your plan")] }] } }, { slot: "mediaNode · the setup screen", fill: true }] },
      { items: [ROW("Invite the team"), ROW("Go live")] }] } }] }] } }] },
    { items: [{ fill: true, frame: { unit: "DSFeatureGridSectionContainer", rows: [{ items: [{ head: { title: "Built for messy data" } }] }, { items: [GCELL("Entity resolution"), GCELL("Your schema")] }] } }] }] } }] };
  one("a feature, a split, its item rows and a grid section written with none of these fields draw byte for byte as before",
    createHash("sha256").update(draw(AS_BEFORE).svg).digest("hex"), "c59e5a3e39549f0f1f202dbf5fcc598c4d65cefa57a0db1d6742d290af2db362");
}

console.log("=== SKELETON — an item's and a head's parts, and a grid's columns (RD.DEVEX.WORKSPACE.294 to .299)");
{
  /** Every rect of one class, as [x, y, width, height, corner]. */
  const boxes = (g, cls) => [...g.matchAll(new RegExp(`<rect class="${cls}" x="([\\d.]+)" y="([\\d.]+)" width="([\\d.]+)" height="([\\d.]+)" rx="([\\d.]+)"`, "g"))].map((m) => m.slice(1).map(Number));
  const circles = (g, cls) => [...g.matchAll(new RegExp(`<circle class="${cls}" cx="([\\d.]+)" cy="([\\d.]+)" r="([\\d.]+)"`, "g"))].map((m) => m.slice(1).map(Number));
  const wordsAt = (g, words) => [...g.matchAll(/<text class="([^"]+)" x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)</g)].map((m) => ({ cls: m[1], x: Number(m[2]), y: Number(m[3]), words: m[4] })).find((t) => t.words === words);
  /** The glyph strokes, each as its list of [x, y] points. */
  const strokes = (g) => [...g.matchAll(/<path class="sds-skel-glyph" d="([^"]+)"/g)].map((m) => m[1].split(/ (?=M)/).map((run) => [...run.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map((p) => [Number(p[1]), Number(p[2])])));
  const viewBox = (g) => g.match(/viewBox="([^"]+)"/)[1];
  const feature = (look, rows) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSFeature", rows, ...look } }] }] } });
  const LINE = (line, extra = {}) => ({ items: [{ item: { title: "Live status", description: "Paid, packed or shipped", ...line }, fill: true, ...extra }] });

  // 1 · an item's media in `IDSItemMedia`'s kinds: `ICON` bare, as large as the title on its first line; `MARK` as the word draws it
  const bare = feature({}, [LINE({ media: { mtype: "ICON", node: "add" } })]), marked = feature({}, [LINE({ media: "add" })]);
  const bareTitle = wordsAt(bare.svg, "Live status"), [[, top], [, foot]] = strokes(bare.svg)[0]?.[0] ?? [[0, 0], [0, 0]];
  one("an item's `media` `ICON` is a bare icon: its shape with no circle and no square round it, as large as the title and centred on the title's line, and no finding",
    [bare.findings, circles(bare.svg, "sds-skel-control").length, boxes(bare.svg, "sds-skel-control").length, foot - top, (top + foot) / 2, bareTitle.y, circles(marked.svg, "sds-skel-control").length],
    ([found, rings, squares, tall, centre, titleY, markRings]) => found.length === 0 && rings === 0 && squares === 0 && tall > 8 && tall < 12 && Math.abs(centre - (titleY - 4)) < 1 && markRings === 1);
  one("a bare icon takes the title's size and a gap, so the title stands nearer the start than beside a mark",
    [bareTitle.x, wordsAt(marked.svg, "Live status").x, wordsAt(feature({}, [LINE({})]).svg, "Live status").x],
    ([iconX, markX, plainX]) => iconX === plainX + 16 + 8 && markX > iconX);
  one("an item's `media` `MARK` draws as the name of its icon does, byte for byte",
    feature({}, [LINE({ media: { mtype: "MARK", icon: "add" } })]).svg === marked.svg, true);
  one("a kind an item line does not take, a shape the drawer lacks, and a key the kind does not have are findings",
    [feature({}, [LINE({ media: { mtype: "AVATAR", title: "Ana Ruiz" } })]).findings, feature({}, [LINE({ media: { mtype: "ICON", node: "rocket" } })]).findings,
      feature({}, [LINE({ media: { mtype: "ICON", node: "add", src: "x.png" } })]).findings],
    ([avatar, rocket, src]) => says("an item line's `media` is `AVATAR`, and a skeleton draws ICON · MARK on an item line")(avatar)
      && says("an item's `media` names `rocket`")(rocket) && says("`src` is no field of an item line's `media`")(src));

  // 2 · a head's own media, a `MARK` or an `AVATAR` over its words, in its level's box
  const HEADW = (extra = {}, level = "WIDGET") => ({ items: [{ head: { pageLevel: level, title: "Documents", description: "Templates rendered to PDF.", ...extra } }] });
  const headMark = feature({}, [HEADW({ media: { mtype: "MARK", icon: "add" } })]), headPlain = feature({}, [HEADW()]);
  const [ring] = circles(headMark.svg, "sds-skel-control");
  one("a head's `media` `MARK` stands over its words at a `WIDGET`'s box, 40 across, 12 above the title, and moves the words down by both, with no finding",
    [headMark.findings, ring, wordsAt(headMark.svg, "Documents"), wordsAt(headPlain.svg, "Documents")],
    ([found, [cx, cy, r], title, plainTitle]) => found.length === 0 && r === 20 && cx - r === plainTitle.x && title.y - plainTitle.y === 52 && cy + r < title.y - 12);
  one("a `CONTAINER` head's box is 48 across",
    circles(feature({}, [HEADW({ media: { mtype: "MARK" } }, "CONTAINER")]).svg, "sds-skel-bar").map((c) => c[2]), (g) => g.length === 1 && g[0] === 24);
  const avatar = feature({}, [HEADW({ media: { mtype: "AVATAR", title: "Ana Ruiz" } })]);
  one("a head's `media` `AVATAR` is a circle of its initials, with no finding",
    [avatar.findings, circles(avatar.svg, "sds-skel-control").length, wordsAt(avatar.svg, "AR")], ([found, rings, initials]) => found.length === 0 && rings === 1 && initials && initials.cls === "sds-note");
  const centredMark = feature({}, [HEADW({ media: { mtype: "MARK", icon: "add" }, textAlign: "CENTER" })]);
  one("a centred head centres its media", [circles(centredMark.svg, "sds-skel-control")[0], boxes(centredMark.svg, "sds-skel-guide")[0]],
    ([[cx], box]) => Math.abs(cx - (box[0] + box[2] / 2)) <= 1);
  one("a head's media at `PAGE` draws nothing over the words and is a finding, since a feature there stands its media beside them; an `ICON` on a head is a finding",
    [feature({}, [HEADW({ media: { mtype: "MARK" } }, "PAGE")]), feature({}, [HEADW({}, "PAGE")]).svg, feature({}, [HEADW({ media: { mtype: "ICON", node: "add" } })]).findings, feature({}, [HEADW({ media: { mtype: "AVATAR" } })]).findings],
    ([paged, plainPaged, icon, nameless]) => paged.svg === plainPaged && says("a feature at `PAGE` stands its media beside its words")(paged.findings)
      && says("a head's `media` is a `MARK` or an `AVATAR`")(icon) && says("a head's `AVATAR` carries the name it stands for in `title`")(nameless));

  // 3 · a `BADGE` eyebrow, drawn as a badge among the facts is, packed above the title
  const badged = feature({}, [HEADW({ eyebrow: { control: "badge", text: "Recommended" } })]), worded = feature({}, [HEADW({ eyebrow: "Recommended" })]);
  const pill = boxes(badged.svg, "sds-skel-control").find((b) => b[3] === 16), badgedTitle = wordsAt(badged.svg, "Documents");
  one("a head's `eyebrow` written as a badge is a badge over the title, its word as written, and no finding",
    [badged.findings, pill, wordsAt(badged.svg, "Recommended"), wordsAt(badged.svg, "RECOMMENDED"), badgedTitle, wordsAt(worded.svg, "RECOMMENDED")],
    ([found, box, word, capitals, title, wordedCaps]) => found.length === 0 && box && box[4] === 8 && word && word.cls === "sds-code" && !capitals
      && box[1] + box[3] < title.y - 12 && wordedCaps);
  one("the badge's line is a badge's height, so the title stands 6 lower than under words in small capitals",
    wordsAt(badged.svg, "Documents").y - wordsAt(worded.svg, "Documents").y, 6);
  one("an `eyebrow` that is neither words nor a badge is a finding", feature({}, [HEADW({ eyebrow: { text: "Alpha" } })]).findings, says("a head's `eyebrow` is words, drawn in small capitals, or a badge"));

  // 4 · `factsPlacement` `AFTER_TITLE`: the facts under the title and over the description
  const META = { title: "Salesforce", description: "Accounts and contacts, both ways.", meta: ["CRM", "OAuth"] };
  const afterTitle = feature({}, [LINE({ ...META, factsPlacement: "AFTER_TITLE" })]), afterDescription = feature({}, [LINE(META)]);
  one("`factsPlacement` `AFTER_TITLE` stands the facts under the title and over the description, and the item keeps its height, with no finding",
    [afterTitle.findings, wordsAt(afterTitle.svg, "Salesforce").y, wordsAt(afterTitle.svg, "CRM").y, wordsAt(afterTitle.svg, META.description).y, viewBox(afterTitle.svg), viewBox(afterDescription.svg)],
    ([found, title, facts, description, box, plainBox]) => found.length === 0 && title < facts && facts < description && facts - title === 18 && description - facts === 18 && box === plainBox);
  const written = feature({}, [LINE({ ...META, factsPlacement: "AFTER_DESCRIPTION" })]);
  one("`AFTER_DESCRIPTION`, or no `factsPlacement`, stands the facts under the description, as before, with no finding",
    [written.findings, written.svg === afterDescription.svg, wordsAt(afterDescription.svg, "CRM").y > wordsAt(afterDescription.svg, META.description).y], ([found, alike, under]) => found.length === 0 && alike && under);
  const badgeFacts = feature({}, [LINE({ ...META, meta: ["CRM", { control: "badge", text: "OAuth" }], factsPlacement: "AFTER_TITLE" })]);
  one("with a badge among the facts, the badge's line stands between the title and the description",
    [boxes(badgeFacts.svg, "sds-skel-control").find((b) => b[3] === 16), wordsAt(badgeFacts.svg, "Salesforce").y, wordsAt(badgeFacts.svg, META.description).y],
    ([badge, title, description]) => badge && badge[1] > title && badge[1] + badge[3] < description - 8);
  one("a `factsPlacement` the design system lacks is a finding", feature({}, [LINE({ ...META, factsPlacement: "BEFORE_TITLE" })]).findings, says("an item line's `factsPlacement` is `BEFORE_TITLE`, and it takes AFTER_DESCRIPTION · AFTER_TITLE"));

  // 5 · the end arrows, `ARROW_RIGHT` and `ARROW_UP_RIGHT`, drawn bare at the end of the line
  const arrowed = feature({}, [LINE({ end: [{ icon: "ARROW_RIGHT" }] })]), chevron = feature({}, [LINE({ end: [{ icon: "next" }] })]);
  const shaft = strokes(arrowed.svg).at(-1)?.[0];
  one("`ARROW_RIGHT` at the end of an item line is its shape alone, a level shaft with its head, at the line's end, with no finding",
    [arrowed.findings, boxes(arrowed.svg, "sds-skel-control").length, boxes(chevron.svg, "sds-skel-control").length, shaft, boxes(arrowed.svg, "sds-skel-guide")[0]],
    ([found, squares, chevronSquares, [[x1, y1], [x2, y2]], box]) => found.length === 0 && squares === 0 && chevronSquares === 1 && y1 === y2 && x2 > x1 && box[0] + box[2] - x2 < 40);
  const upRight = strokes(feature({}, [LINE({ end: [{ icon: "ARROW_UP_RIGHT" }] })]).svg).at(-1)?.[0];
  one("`ARROW_UP_RIGHT` rises to the end, for a line that leaves the site", [upRight], ([[[x1, y1], [x2, y2]]]) => x2 > x1 && y2 < y1);
  one("an end arrow anywhere but an item line's `end` is a finding", feature({}, [{ items: [{ icon: "ARROW_RIGHT" }] }]).findings, says("`ARROW_RIGHT` is the end arrow of an item line, and stands in its `end`"));

  // 6 · a selected item line of a feature's boxed items: a heavier line inside its edge
  const OPTIONS = [LINE({ title: "Shape", selected: true }), LINE({ title: "Build" })];
  const chosen = feature({ items: { type: "LIST", surface: { raised: true } } }, OPTIONS);
  const [mark] = boxes(chosen.svg, "sds-skel-control sds-skel-main"), frames = boxes(chosen.svg, "sds-skel-control").filter((b) => b[4] === 8);
  one("`selected` on an item line of a feature with `items.surface` draws a heavier line 2 inside its box, which keeps its size, and no finding",
    [chosen.findings, mark, frames], ([found, inner, outer]) => found.length === 0 && inner && outer.length === 2 && inner[0] === outer[0][0] + 2 && inner[1] === outer[0][1] + 2
      && inner[2] === outer[0][2] - 4 && inner[3] === outer[0][3] - 4 && inner[4] === 6 && outer[1][3] === outer[0][3]);
  one("`selected` where the items stand in no box is a finding, since the design system reads it only on boxed items, and draws nothing",
    [feature({}, OPTIONS), feature({}, [LINE({ title: "Shape" }), LINE({ title: "Build" })]).svg],
    ([unboxed, plain]) => says("`selected` marks the chosen item line of a `DSFeature` whose `items.surface` boxes its items")(unboxed.findings) && unboxed.svg === plain);
  one("a `selected` that is not true or false is a finding", feature({ items: { surface: {} } }, [LINE({ selected: "yes" })]).findings, (g) => g.length === 1 && g[0] === "an item line's `selected` is `\"yes\"`, and it takes true or false");

  // 7 · a grid section's `grid.desktop`, `grid.tablet` and `grid.mobile`, each read by the view of its class
  const GCELL = (title) => ({ fill: true, frame: { unit: "DSFeature", rows: [{ items: [{ head: { pageLevel: "WIDGET", title } }] }] } });
  const gview = (viewport, grid, rows) => ({ viewport, frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSFeatureGridSectionContainer", grid, rows } }] }] } });
  const COLUMNS = { borderType: "GRID", desktop: 2, tablet: 2, mobile: 1 };
  const fits = draw({ kind: "skeleton", views: [gview("DESKTOP", COLUMNS, [{ items: [GCELL("Documents"), GCELL("Audit log")] }, { items: [GCELL("Notifications"), { spacer: true }] }]),
    gview("MOBILE", COLUMNS, [{ items: [GCELL("Documents")] }, { items: [GCELL("Audit log")] }])] });
  one("`grid.desktop`, `grid.tablet` and `grid.mobile` are a grid section's own keys, and each view's rows of cells stand in its class's count, with no finding", fits.findings, none);
  const off = draw({ kind: "skeleton", views: [gview("DESKTOP", COLUMNS, [{ items: [GCELL("Documents"), GCELL("Audit log"), GCELL("Notifications")] }])] });
  one("a row of cells that holds another count than its view's class is a finding that names both",
    off.findings, says("the `DESKTOP` view stands a grid section's cells in `grid.desktop`, 2 columns, and a row of them holds 3"));
  one("a count that is not a whole number from 1 to 4 is a finding; a spec of one frame has no class, and reads no count",
    [draw({ kind: "skeleton", views: [gview("DESKTOP", { tablet: 5 }, [{ items: [GCELL("Documents")] }])] }).findings,
      draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSFeatureGridSectionContainer", grid: { desktop: 2 }, rows: [{ items: [GCELL("A"), GCELL("B"), GCELL("C")] }] } }] }] } }).findings],
    ([five, single]) => says("a grid section's `grid.tablet` is `5`, and it takes a whole number of columns, 1 to 4")(five) && single.length === 0);

  // 8 · a spec written with none of these fields draws byte for byte as before (the hash of the drawer before this row)
  const PARTS_BEFORE = { kind: "skeleton", title: "An item's and a head's parts, as before", views: [{ viewport: "DESKTOP", frame: { size: "XS", rows: [
    { items: [{ fill: true, frame: { unit: "DSSectionContainer", rows: [{ items: [{ fill: true, frame: { unit: "DSFeature", items: { type: "LIST", surface: { raised: true } }, rows: [
      { items: [{ head: { eyebrow: "Orders", title: "Every phase has an owner", description: "Choose a phase to see who carries it.", facts: [{ control: "badge", text: "Live" }] } }] },
      { items: [{ item: { media: "default", title: "Shape", description: "The product lead decides", meta: ["Lead", { control: "badge", text: "Now" }], end: [{ icon: "next" }] }, fill: true }] },
      { items: [{ item: { media: "person", title: "Build", description: "The developers carry it", meta: ["Team"] }, fill: true }] }] } }] }] } }] },
    { items: [{ fill: true, frame: { unit: "DSFeatureGridSectionContainer", grid: { borderType: "GRID" }, rows: [{ items: [{ head: { title: "Connect what you already use" } }] },
      { items: [{ fill: true, frame: { unit: "DSFeature", rows: [{ items: [{ icon: "default", mark: true }] }, { items: [{ head: { pageLevel: "WIDGET", eyebrow: "Messaging", title: "Notifications", description: "Email, push and in-app." } }] }] } },
        { fill: true, frame: { unit: "DSFeature", rows: [{ items: [{ item: { media: "default", title: "Salesforce", description: "Accounts, both ways.", meta: ["CRM", "OAuth"] }, fill: true }] }] } }] }] } }] }] } }] };
  one("items, heads and a grid section written with none of these fields draw byte for byte as before",
    createHash("sha256").update(draw(PARTS_BEFORE).svg).digest("hex"), "13af0699d5bb3cd2c98af0c36360558e6dd69867283fea8b2a761d059d930cf3");
}

console.log("=== SKELETON — statistics, an accordion's entries and the tabs' own type (RD.DEVEX.WORKSPACE.300 to .302)");
{
  /** Every rect of one class, as [x, y, width, height, corner]. */
  const boxes = (g, cls) => [...g.matchAll(new RegExp(`<rect class="${cls}" x="([\\d.]+)" y="([\\d.]+)" width="([\\d.]+)" height="([\\d.]+)" rx="([\\d.]+)"`, "g"))].map((m) => m.slice(1).map(Number));
  const texts = (g) => [...g.matchAll(/<text class="([^"]+)" x="([\d.]+)" y="([\d.]+)"(?: style="([^"]*)")?>([^<]*)</g)].map((m) => ({ cls: m[1], x: Number(m[2]), y: Number(m[3]), style: m[4] ?? "", words: m[5] }));
  const wordsAt = (g, words) => texts(g).find((t) => t.words === words);
  /** The plain strokes, glyphs and lines alike, each as its list of [x, y] points. */
  const strokes = (g, cls = "sds-skel-glyph") => [...g.matchAll(new RegExp(`<path class="${cls}" d="([^"]+)"`, "g"))].map((m) => [...m[1].matchAll(/[MLHV]\s*([\d.]+)(?:\s+([\d.]+))?/g)].map((p) => [Number(p[1]), p[2] === undefined ? undefined : Number(p[2])]));
  const feature = (look, rows) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSFeature", rows, ...look } }] }] } });
  const HEAD = (extra = {}) => ({ items: [{ head: { title: "Built for teams like yours", ...extra } }] });
  const STAT = (title, description, extra = {}) => ({ item: { title, description, ...extra }, fill: true });
  const STATS_ROW = { items: [STAT("12k", "orders a day, live"), STAT("99.9%", "uptime last quarter"), STAT("4.9", "rating from 300 teams")] };

  // 1 · `items.type` `STATS`: each item line a statistic, its value large over its label, one level below the feature's own
  const stats = feature({ items: { type: "STATS" } }, [HEAD(), STATS_ROW]);
  const [value, label] = [wordsAt(stats.svg, "12k"), wordsAt(stats.svg, "orders a day, live")];
  one("`items.type` `STATS` draws each item line as a statistic: its title the value, heavy at a card title's 15px under a `CONTAINER` feature, and its description the label under it, quiet at 13px, with no finding",
    [stats.findings, value, label], ([found, number, words]) => found.length === 0 && number.cls === "sds-title" && number.style === "font-size:15px"
      && words.cls === "sds-note" && words.style === "font-size:13px" && words.y > number.y && words.y - number.y < 20);
  const sizes = (pageLevel) => { const g = feature({ items: { type: "STATS" } }, [HEAD({ pageLevel }), STATS_ROW]).svg; return [wordsAt(g, "12k").style, wordsAt(g, "orders a day, live").style]; };
  one("a statistic stands one level below its feature's head: 20 over 14 under `PAGE`, and 13 over 12 under `WIDGET`",
    [sizes("PAGE"), sizes("WIDGET")], ([page, widget]) => page.join() === "font-size:20px,font-size:14px" && widget.join() === "font-size:13px,font-size:12px");
  const plainLines = feature({}, [HEAD(), STATS_ROW]);
  one("a statistic draws no media, no facts line and no number, and stands no line apart from the next, as `STATS` take none where `borderType` is left out",
    [stats.findings, strokes(stats.svg, "sds-skel-control").length, texts(stats.svg).filter((t) => t.words.includes("·")).length, wordsAt(plainLines.svg, "12k").style],
    ([found, lines, dots, asItem]) => found.length === 0 && lines === 0 && dots === 0 && asItem.includes("font-size:12px"));
  const centred = feature({ items: { type: "STATS" } }, [HEAD({ textAlign: "CENTER" }), STATS_ROW]);
  const middle = (t, size) => t.x + Math.ceil(t.words.length * 7.6 * size / 13) / 2;
  one("a centred head centres each statistic's value and its label in its place, on one centre line",
    [wordsAt(centred.svg, "12k"), wordsAt(centred.svg, "orders a day, live"), wordsAt(stats.svg, "12k")],
    ([number, words, started]) => number.x > started.x && Math.abs(middle(number, 15) - (words.x + Math.ceil(words.words.length * 6.4 * 13 / 11) / 2)) <= 1);
  const lined = feature({ items: { type: "STATS", borderType: "GRID" } }, [HEAD(), STATS_ROW]);
  one("`borderType` `GRID` stands a line in the gap after each statistic of a row but its last, as a `GRID` of items does, with no finding",
    [lined.findings, strokes(lined.svg, "sds-skel-control").filter((s) => s[1] && s[1][1] === undefined && s[0][1] !== undefined)], ([found, downs]) => found.length === 0 && downs.length === 2);
  const boxed = feature({ items: { type: "STATS", surface: { bordered: true } } }, [HEAD(), STATS_ROW]);
  one("`items.surface` puts each statistic in a frame of its own, as the design system sets it in a `DSCard`, its value at a boundary's padding",
    [boxed.findings, boxes(boxed.svg, "sds-skel-border").filter((b) => b[4] === 8), wordsAt(boxed.svg, "12k")],
    ([found, frames, number]) => found.length === 0 && frames.length === 3 && number.x === frames[0][0] + 16);
  one("media, facts or `selected` on a statistic, and `items.numbered` with `STATS`, are findings",
    [feature({ items: { type: "STATS" } }, [HEAD(), { items: [STAT("12k", "orders", { media: "default", meta: ["Live"] })] }]).findings,
      feature({ items: { type: "STATS", numbered: true } }, [HEAD(), STATS_ROW])],
    ([parts, numbered]) => says("a statistic of `items.type` `STATS` draws its `title`, the value, and its `description`, the label under it, and nothing else; `media`, `meta` are not drawn")(parts)
      && says("the design system writes no number before a statistic of `STATS`")(numbered.findings) && !wordsAt(numbered.svg, "1."));

  // 2 · `DSAccordionGroup` with its entries: each header with its indicator, the open entry's words under it
  const OPTIONS = [{ header: "Do I need my own cloud account?", expanded: true, content: "Yes. The estate is created in your account, from one declaration." },
    { header: "Can I use only the standards?", content: "Yes, the standards stand alone." }, { header: "Is there a free plan?" }];
  const group = (look, options = OPTIONS, viewport) => {
    const frame = { rows: [{ items: [{ fill: true, frame: { unit: "DSAccordionGroup", options, ...look } }] }] };
    return draw(viewport ? { kind: "skeleton", views: [{ viewport, frame }] } : { kind: "skeleton", frame });
  };
  const plain = group({}), bordered = group({ bordered: true });
  one("a `DSAccordionGroup` with `options` draws each entry's header, and under the open one its words, with no finding; a shut entry's words are not drawn",
    [plain.findings, ...OPTIONS.map((o) => wordsAt(plain.svg, o.header)), wordsAt(plain.svg, OPTIONS[0].content), wordsAt(plain.svg, OPTIONS[1].content), wordsAt(plain.svg, "DSAccordionGroup")],
    ([found, first, second, third, open, shut, name]) => found.length === 0 && first && second && third && open && !shut && name
      && first.style === "font-size:12px;font-weight:500" && open.cls === "sds-code" && open.y > first.y && open.y < second.y && second.y < third.y);
  const chevrons = strokes(plain.svg).map((s) => s.map(([x, y]) => [x, y]));
  one("each header leads with the design system's chevron: down while the entry is shut, turned up while it is open",
    chevrons, (g) => g.length === 3 && g[0][1][1] < g[0][0][1] && g[1][1][1] > g[1][0][1] && g[2][1][1] > g[2][0][1]
      && wordsAt(plain.svg, OPTIONS[0].header).x > g[0][2][0]);
  const outlines = boxes(bordered.svg, "sds-skel-control").filter((b) => b[4] === 8);
  one("`bordered` puts each entry in a thin rounded outline of its own, with a line across under the open entry's header and its words a boundary's padding in",
    [bordered.findings, outlines, strokes(bordered.svg, "sds-skel-control"), wordsAt(bordered.svg, OPTIONS[0].content), boxes(plain.svg, "sds-skel-control").filter((b) => b[4] === 8).length],
    ([found, frames, lines, open, plainFrames]) => found.length === 0 && frames.length === 3 && frames[0][3] > frames[1][3] && lines.length === 1
      && lines[0][0][1] === frames[0][1] + 32 && open.x === frames[0][0] + 16 && plainFrames === 0);
  const narrow = group({ bordered: true }, OPTIONS, "MOBILE");
  one("an open entry's words wrap at a word to the entry's width, and the entry grows by a line for each, with no finding",
    [narrow.findings, texts(narrow.svg).filter((t) => t.cls === "sds-code"), boxes(narrow.svg, "sds-skel-control").filter((b) => b[4] === 8)[0]],
    ([found, lines, frame]) => found.length === 0 && lines.length === 2 && lines[1].y - lines[0].y === 18 && lines.every((t) => t.x + t.words.length * 7 <= frame[0] + frame[2] - 16));
  one("`options` on another unit, `rows` beside `options`, an entry with no `header`, an `expanded` or a `bordered` that is not true or false, and a key an entry does not have are findings",
    [draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSFeature", options: OPTIONS, rows: [HEAD()] } }] }] } }).findings,
      draw({ kind: "skeleton", frame: { rows: [{ items: [{ fill: true, frame: { unit: "DSAccordionGroup", options: OPTIONS, rows: [{ items: [{ text: "Billing" }] }] } }] }] } }).findings,
      group({}, [{ content: "No header" }]).findings, group({}, [{ header: "Billing", expanded: "yes" }]).findings, group({ bordered: "thin" }).findings,
      group({}, [{ header: "Billing", key: "billing" }]).findings],
    ([elsewhere, rows, headless, expanded, borderedWord, key]) => says("`options` is a field of a `DSAccordionGroup`, its entries, and this frame is `DSFeature`")(elsewhere)
      && says("a `DSAccordionGroup` draws its entries from `options`, and its `rows` are not drawn")(rows)
      && says("an entry of a `DSAccordionGroup` carries the words of its `header`")(headless) && expanded.includes("an entry's `expanded` is `\"yes\"`, and it takes true or false")
      && borderedWord.includes("a `DSAccordionGroup`'s `bordered` is `\"thin\"`, and it takes true or false") && says("`key` is no field of an entry of a `DSAccordionGroup`'s `options`")(key));

  // 3 · `DSTabs` `type`: `PILL` draws the pills inside a feature, `LINE` the line at the page level
  const TABS = (extra = {}) => ({ items: [{ control: "tabs", tabs: ["Workspace", "Workstreams", "Docs"], chosen: 0, ...extra }] });
  const pills = feature({}, [HEAD(), TABS({ type: "PILL" }), { items: [{ slot: "the open tab's picture", fill: true, height: 4 }] }]), lineTabs = feature({}, [HEAD(), TABS()]);
  const rounded = (g) => boxes(g, "sds-skel-(?:surface|control)").filter((b) => b[4] >= 10);
  one("a row of tabs with `type` `PILL` inside a feature is drawn as pills: a rounded track and the chosen tab in a pill, no line under it, and no finding; with no `type` it keeps the line",
    [pills.findings, rounded(pills.svg).length, strokes(pills.svg, "sds-skel-border").length, rounded(lineTabs.svg).length, strokes(lineTabs.svg, "sds-skel-border").length],
    ([found, pillShapes, underline, lineShapes, lineUnderline]) => found.length === 0 && pillShapes === 3 && underline === 0 && lineShapes === 0 && lineUnderline === 1);
  const atPage = (extra) => draw({ kind: "skeleton", frame: { rows: [TABS(extra), { items: [{ standin: "rows", fill: true }] }] } });
  one("`type` `LINE` draws the line at the page level, and `PILL` there draws byte for byte as the pills the level picks",
    [atPage({ type: "LINE" }), atPage({ type: "PILL" }).svg === atPage({}).svg], ([line, same]) => line.findings.length === 0 && rounded(line.svg).length === 0 && strokes(line.svg, "sds-skel-border").length === 1 && same);
  one("a `type` the skeleton does not draw, and `type` on an item that is no row of tabs, are findings",
    [feature({}, [HEAD(), TABS({ type: "SWITCH" })]).findings, feature({}, [HEAD(), { items: [{ control: "button", text: "Start", type: "PILL" }] }]).findings],
    ([switched, button]) => says("a row of tabs' `type` is `SWITCH`, and a skeleton draws LINE · PILL")(switched)
      && says("`type` is the look of a row of tabs, in `DSTabsType`'s words, and this item is no row of tabs")(button));

  // 4 · a spec written with none of these fields draws byte for byte as before (the hash of the drawer before this row)
  const LOOKS_BEFORE = { kind: "skeleton", title: "Numbers, an accordion and tabs, as before", views: [{ viewport: "DESKTOP", frame: { size: "XS", rows: [
    { items: [{ control: "tabs", tabs: ["Overview", "Members"], chosen: 0 }] },
    { items: [{ fill: true, frame: { unit: "DSSectionContainer", rows: [{ items: [{ fill: true, frame: { unit: "DSFeature", rows: [
      { items: [{ head: { title: "Built for teams like yours", textAlign: "CENTER" } }] },
      { items: [{ head: { pageLevel: "WIDGET", title: "12k", description: "orders a day", textAlign: "CENTER" }, fill: true }, { head: { pageLevel: "WIDGET", title: "4.9", description: "rating", textAlign: "CENTER" }, fill: true }] },
      { items: [{ control: "tabs", tabs: ["Workspace", "Docs"], chosen: 1 }] },
      { items: [{ fill: true, frame: { unit: "DSAccordionGroup", rows: [{ items: [{ text: "Do I need my own cloud account?" }, { spacer: true }, { icon: "select" }] }, { items: [{ note: "Yes, in your account." }] }] } }] }] } }] }] } }] }] } }] };
  one("numbers faked as heads, an accordion written as rows and tabs with no `type` draw byte for byte as before",
    createHash("sha256").update(draw(LOOKS_BEFORE).svg).digest("hex"), "5b5a9173fd518a9865d63b1fe4f42c0c396662365e85628ae55004b4415a57c7");
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
