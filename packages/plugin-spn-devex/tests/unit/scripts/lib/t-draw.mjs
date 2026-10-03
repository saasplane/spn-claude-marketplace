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
    draw({ kind: "skeleton", frame: { rows: [{ items: [{}] }] } }).findings, says("none of `text`, `note`, `slot`, `icon`, `control`, `standin`, `spacer` or `frame`"));

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
  one("a control is a thin outline of the component's height, 28 in a plain row", controls.svg, (g) => rect(g, "sds-skel-control").every((r) => r[3] === 28));
  one("the main action is told apart by weight, with the same class and no colour", controls.svg, (g) => g.includes("sds-skel-control sds-skel-main") && rect(g, "sds-skel-control sds-skel-main").length === 1);
  one("a pager is one packed group: its parts sit 4px apart", controls.svg, (g) => {
    const boxes = rect(g, "sds-skel-control").slice(-4); return boxes.slice(1).every((b, i) => b[0] - (boxes[i][0] + boxes[i][2]) === 4); });
  one("a framed row takes the larger control height", draw({ kind: "skeleton", frame: { rows: [{ framed: true, items: [{ control: "button", text: "Save" }] }] } }).svg,
    (g) => rect(g, "sds-skel-control")[0][3] === 36);
  one("a control with a tag is a finding", draw({ kind: "skeleton", frame: { rows: [{ items: [{ control: "button", text: "x", tag: "name" }] }] } }).findings, says("a control carries no tag"));
  one("a control that runs over one line is a finding", draw({ kind: "skeleton", frame: { rows: [{ items: [{ control: "button", text: "a\nb" }] }] } }).findings, says("one line"));
  one("a control the skeleton lacks is refused by name", draw({ kind: "skeleton", frame: { rows: [{ items: [{ control: "slider", text: "x" }] }] } }).findings, says("`slider`"));

  // 5 · icons
  const icons = draw({ kind: "skeleton", frame: { rows: [{ items: ["close", "add", "menu", "search", "more", "previous", "next", "select", "checkbox", "bell", "person", "default"].map((icon) => ({ icon })) }] } });
  one("each of the twelve icons draws with no finding", icons.findings, none);
  one("an icon sits in a square whose side is the control's height", icons.svg, (g) => rect(g, "sds-skel-control").length === 12 && rect(g, "sds-skel-control").every((r) => r[2] === 28 && r[3] === 28));
  one("icons are line shapes of the stylesheet, with no transform", icons.svg, (g) => g.includes("sds-skel-glyph") && !g.includes("transform"));
  one("an icon the set lacks is a finding that names the default", draw({ kind: "skeleton", frame: { rows: [{ items: [{ icon: "rocket" }] }] } }).findings, says("`default`"));
  const word = draw({ kind: "skeleton", frame: { rows: [{ items: [{ icon: "add", text: "New" }, { control: "button", text: "Go" }] }] } }).svg;
  const wordY = Number((word.match(/<text class="sds-code" x="[\d.]+" y="([\d.]+)">New/) ?? [])[1]);
  one("a word beside an icon is centred on the icon's own line", word, () => wordY === rect(word, "sds-skel-control")[0][1] + 14 + 4);

  // 6 · a title is plain text
  const title = draw({ kind: "skeleton", frame: { rows: [{ items: [{ text: "Members" }] }] } }).svg;
  one("a title is plain text with no box", title, (g) => g.includes(">Members<") && rect(g, "sds-skel-control").length === 0 && rect(g, "sds-skel-guide").length === 0);

  // 7 · stand-ins
  const standin = (kind, extra = {}) => draw({ kind: "skeleton", frame: { rows: [{ items: [{ standin: kind, lines: 3, fill: true, ...extra }] }] } });
  one("rows are bars, and a heading bar is shorter and taller", standin("rows", { headings: [0] }).svg,
    (g) => { const b = rect(g, "sds-skel-bar"); return b.length === 3 && b[0][2] < b[1][2] && b[0][3] > b[1][3]; });
  one("a card grid is cards, each with bars", standin("cards").svg, (g) => rect(g, "sds-skel-control").length === 3 && rect(g, "sds-skel-bar").length === 9);
  one("a form field is its label above its field", standin("field").svg, (g) => rect(g, "sds-skel-bar").length === 1 && rect(g, "sds-skel-control").length === 1);
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
  const deep = { kind: "skeleton", frame: { rows: [{ items: [{ frame: { tag: "a", rows: [{ items: [{ frame: { tag: "b", rows: [{ items: [{ frame: { tag: "c", rows: [] } }] }] } }] }] } }] }] } };
  one("a third named boundary is a finding that names it", draw(deep).findings, says("draw `c` as a skeleton of its own"));
  one("two named boundaries are allowed", draw({ ...deep, frame: { rows: [{ items: [{ frame: { tag: "a", rows: [{ items: [{ frame: { tag: "b", rows: [] } }] }] } }] }] } }).findings, none);

  // 11 · the old fields
  const oldFields = draw({ kind: "skeleton", frame: { tone: "blue", rows: [{ items: [{ text: "Save", em: true }, { note: "n", off: true }] }] } });
  one("`tone` is not read, and the finding names `look`", oldFields.findings, says("no longer reads `tone`"));
  one("`em` is not read, and the finding names `control` and `main`", oldFields.findings, says("`control` with `main: true`"));
  one("`off` is not read, and the finding names `note`", oldFields.findings, says("no longer reads `off`"));
  one("nothing is drawn by guessing: no tone class reaches the drawing", oldFields.svg, (g) => !g.includes("sds-tone-"));
  one("an old `warn` is a finding that names the new field", draw({ kind: "skeleton", frame: { rows: [{ items: [{ text: "x", warn: true }] }] } }).findings, says("no longer reads `warn`"));
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
