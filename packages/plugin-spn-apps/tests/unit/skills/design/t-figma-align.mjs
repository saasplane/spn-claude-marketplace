// The alignment script the design skill hands to the Figma connector's `use_figma`: `align.js` (it places the
// pieces of every section of a page at the book's distances, and proves the page's alignment).
//
// It runs here as the connector runs it: the file's text is the body of an async function whose one argument is
// `figma`, with top-level `await` and `return`. `figma` is a stand-in of only the parts the script uses: a page of
// sections, a set with versions, texts, instances, the bounding box of every node in page coordinates, the render
// bounds of every node that is not a SECTION (a SECTION has none, and Figma throws on the read, so the stand-in
// does too), `findAllWithCriteria`, `resizeWithoutConstraints`, and a set's `defaultVariant`.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// FIGMA_SCRIPTS points the suite at another folder of the scripts (a changed copy, to see a case fail on it).
const SCRIPTS = process.env.FIGMA_SCRIPTS ?? resolve(import.meta.dirname, "..", "..", "..", "..", "src", "skills", "design", "scripts");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const INPUTS_BLOCK = /const INPUTS = \{[\s\S]*?\n\};/;

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const same = (label, actual, expected) =>
  ok(label, JSON.stringify(actual) === JSON.stringify(expected), `got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`);
async function guard(body) {
  try { await body(); } catch (error) { ok(`a case crashed: ${String(error?.message ?? error)}`, false, String(error?.stack ?? "").split("\n")[1] ?? ""); }
}

// ---- the stand-in -------------------------------------------------------------------------------

const node = (id, name, type, box, extra = {}) => ({ id, name, type, x: box[0], y: box[1], width: box[2], height: box[3], children: [], ...extra });
const text = (id, name, characters, box) => node(id, name, "TEXT", box, { characters });
const version = (id, name, box) => node(id, name, "COMPONENT", box, { key: `key:${id}`, children: [node(`${id}:0`, "layer", "RECTANGLE", [0, 0, 10, 10])] });
function componentSet(id, name, box, versions) {
  const set = node(id, name, "COMPONENT_SET", box, { key: `key:${id}`, children: versions, componentPropertyDefinitions: {} });
  Object.defineProperty(set, "defaultVariant", { get() { return [...this.children].sort((first, second) => first.y - second.y || first.x - second.x)[0]; } });
  return set;
}
const section = (id, name, box, children) => {
  const one = node(id, name, "SECTION", box, { children, fills: [] });
  one.resizeWithoutConstraints = (width, height) => { one.width = width; one.height = height; };
  return one;
};

function file(sections, background = { r: 0.12, g: 0.12, b: 0.12 }) {
  const everything = new Map();
  const page = { id: "2:1", name: "Actions", type: "PAGE", children: sections, backgrounds: [{ type: "SOLID", color: background, opacity: 1 }] };
  const root = { id: "0:0", type: "DOCUMENT", children: [page] };
  page.parent = root;
  const walk = (one) => {
    everything.set(one.id, one);
    // a node's box in the page's coordinates: its own place and the places of the nodes above it
    Object.defineProperty(one, "absoluteBoundingBox", {
      configurable: true,
      get() {
        let [x, y] = [this.x, this.y];
        for (let up = this.parent; up && up.type !== "PAGE"; up = up.parent) { x += up.x; y += up.y; }
        return { x, y, width: this.width, height: this.height };
      },
    });
    Object.defineProperty(one, "absoluteRenderBounds", {
      configurable: true,
      get() {
        if (this.type === "SECTION") throw new Error("no such property 'absoluteRenderBounds' on SECTION node");
        const [left, top, right, bottom] = this.bleed ?? [0, 0, 0, 0];
        const box = this.absoluteBoundingBox;
        return { x: box.x - left, y: box.y - top, width: box.width + left + right, height: box.height + top + bottom };
      },
    });
    for (const child of one.children) { child.parent = one; walk(child); }
  };
  for (const one of sections) { one.parent = page; walk(one); }
  page.findAllWithCriteria = ({ types }) => {
    const found = [];
    const collect = (one) => { for (const child of one.children) { if (types.includes(child.type)) found.push(child); collect(child); } };
    collect(page);
    return found;
  };
  return {
    mixed: Symbol("mixed"), root, page, everything, switches: 0,
    async getNodeByIdAsync(id) { return everything.get(id) ?? (id === page.id ? page : null); },
    async setCurrentPageAsync() { this.switches += 1; },
  };
}

async function run(inputs, figma) {
  const body = readFileSync(resolve(SCRIPTS, "align.js"), "utf8");
  // an input the case does not give keeps the script's own default, as it does when an agent fills only some
  const defaults = new Function(`return ${INPUTS_BLOCK.exec(body)[0].slice("const INPUTS = ".length, -1)}`)();
  const filled = body.replace(INPUTS_BLOCK, () => `const INPUTS = ${JSON.stringify({ ...defaults, pageId: "2:1", ...inputs })};`);
  return new AsyncFunction("figma", filled)(figma);
}

// A unit's section as a person leaves it: everything a little off its place. The set stands at (150, 140), 200 x 100;
// a row label ends 10 px left of it, level with its first row; a column label ends on its top.
function unitSection({ stray = false } = {}) {
  const set = componentSet("S:set", "DSButton", [150, 140, 200, 100], [version("S:v1", "size=SM", [0, 0, 100, 40]), version("S:v2", "size=MD", [0, 50, 100, 40])]);
  return section("S:sec", "DSButton", [13, 7, 900, 700], [
    text("S:head", "header · DSButton", "DSButton — rows: size=SM, MD", [50, 30, 300, 20]),
    set,
    text("S:row", "label · SM (default)", "SM (default)", [100, 160, 40, 20]),
    text("S:col", "label · rest", "rest", [160, 120, 40, 20]),
    text("S:bs", "label · Usage", "Usage", [50, 300, 100, 20]),
    text("S:cap", "label · usage · DSButton open", "usage · DSButton open", [53, 330, 150, 20]),
    node("S:smp", "usage · DSButton open", "INSTANCE", [50, 360, 120, 40]),
    ...(stray ? [node("S:stray", "Rectangle", "RECTANGLE", [60, 60, 10, 10])] : []),
  ]);
}
// The same unit with both bands, Cases standing above Usage: the order the book does not give.
function casesAboveUsage() {
  const unit = unitSection();
  unit.children = unit.children.filter((child) => !["S:bs", "S:cap", "S:smp"].includes(child.id));
  unit.children.push(
    text("S:bc", "label · Cases", "Cases", [50, 300, 100, 20]),
    node("S:sheet", "DSButton cases", "FRAME", [50, 330, 200, 60]),
    text("S:bs", "label · Usage", "Usage", [50, 450, 100, 20]),
    text("S:cap", "label · usage · DSButton open", "usage · DSButton open", [53, 480, 150, 20]),
    node("S:smp", "usage · DSButton open", "INSTANCE", [50, 510, 120, 40]),
  );
  return unit;
}
const pageOf = (...sections) => file(sections);
const at = (figma, id) => figma.everything.get(id);
const boxOf = (one) => [one.x, one.y, one.width, one.height];

console.log("=== align.js — the plan, and the apply of one small section");
await guard(async () => {
  const figma = pageOf(unitSection());
  const plan = await run({ mode: "plan" }, figma);
  same("the plan reads the content line and the one width, and changes nothing", [plan.contentLine, plan.width, plan.problems, plan.anomalies, boxOf(at(figma, "S:head"))], [130, 460, [], [], [50, 30, 300, 20]]);
  same("the plan names the section's box before and after", plan.sections.map((one) => [one.name, one.from, one.to]), [["DSButton", [13, 7, 900, 700], [0, 0, 460, 548]]]);
  const applied = await run({ mode: "apply" }, figma);
  same("apply says it applied and that a label's offset from its set changed by nothing", [applied.applied, applied.greatestLabelOffsetChange], [true, 0]);
  same("the header stands at the padding", boxOf(at(figma, "S:head")).slice(0, 2), [80, 80]);
  same("the set stands on the content line, below the header and its column labels", boxOf(at(figma, "S:set")).slice(0, 2), [130, 168]);
  same("a row label and a column label keep their offset from the set", [at(figma, "S:row").x - at(figma, "S:set").x, at(figma, "S:row").y - at(figma, "S:set").y, at(figma, "S:col").x - at(figma, "S:set").x, at(figma, "S:col").y - at(figma, "S:set").y], [-50, 20, 10, -20]);
  same("the band's label stands 80 below the set, and the caption 24 below the label, 16 above its usage, level with it at the left",
    [at(figma, "S:bs").y, at(figma, "S:cap").y, at(figma, "S:smp").y, at(figma, "S:cap").x === at(figma, "S:smp").x], [348, 392, 428, true]);
  same("the section is at the page's top left, as wide as the widest and as high as its content and its padding", boxOf(at(figma, "S:sec")), [0, 0, 460, 548]);
  same("the section takes the top fill", at(figma, "S:sec").fills, [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]);
  same("no version of the set moved", at(figma, "S:set").children.map(boxOf), [[0, 0, 100, 40], [0, 50, 100, 40]]);
  const again = await run({ mode: "apply" }, figma);
  same("a second apply moves and resizes nothing", [again.nodesMoved, again.nodesResized, again.filled], [0, 0, 0]);
});
await guard(async () => {
  const figma = pageOf(casesAboveUsage());
  const before = await run({ mode: "prove" }, figma);
  same("a section with Cases above Usage fails the proof, naming the band", before.fails.includes("Usage stands below Cases in DSButton"), true);
  const applied = await run({ mode: "apply" }, figma);
  same("apply places the bands in the book's order: Usage 80 below the set, Cases 80 below the usage",
    [applied.applied, at(figma, "S:bs").y, at(figma, "S:smp").y, at(figma, "S:bc").y, at(figma, "S:sheet").y], [true, 348, 428, 548, 592]);
  same("the section is then as high as its content and its padding, and the proof passes", [boxOf(at(figma, "S:sec")), (await run({ mode: "prove" }, figma)).fails], [[0, 0, 460, 732], []]);
});
await guard(async () => {
  const figma = pageOf(unitSection({ stray: true }));
  const refused = await run({ mode: "apply" }, figma);
  same("a thing above no band label is an anomaly: apply refuses and moves nothing", [Boolean(refused.refused), refused.anomalies.length, boxOf(at(figma, "S:head"))], [true, 1, [50, 30, 300, 20]]);
  const allowed = await run({ mode: "apply", allowAnomalies: true }, figma);
  same("with allowAnomalies it applies", allowed.applied, true);
});

console.log("\n=== align.js — the proof");
const applied = async (...sections) => {
  const figma = pageOf(...sections);
  await run({ mode: "apply" }, figma);
  return figma;
};
await guard(async () => {
  const figma = await applied(unitSection());
  const proof = await run({ mode: "prove" }, figma);
  same("a page arranged by apply passes the proof", [proof.fails, proof.counts.sets, proof.counts.headers, proof.counts.sections], [[], 1, 1, 1]);
  const ran = await run({ mode: "run" }, pageOf(unitSection()));
  same("run: snapshot, apply and prove against the snapshot pass, the keys and the labels' offsets and the layers order kept",
    [ran.proof.fails, ran.proof.counts.components, ran.proof.counts.labelOffsetsKept, ran.proof.counts.layersOrder], [[], 1, "2 of 2", "same"]);
});
await guard(async () => {
  const figma = await applied(unitSection());
  at(figma, "S:head").x += 5;
  const proof = await run({ mode: "prove" }, figma);
  same("a header 5 px off the padding fails the proof", proof.fails.includes("header not at the padding in DSButton: 85,80"), true);
});
await guard(async () => {
  const figma = await applied(unitSection());
  const outside = node("S:out", "Rectangle", "RECTANGLE", [1000, 100, 40, 40]);
  outside.parent = at(figma, "S:sec");
  at(figma, "S:sec").children.push(outside);
  figma.everything.set("S:out", outside);
  for (const key of ["absoluteBoundingBox", "absoluteRenderBounds"]) Object.defineProperty(outside, key, { get() { return { x: this.x, y: this.y, width: this.width, height: this.height }; } });
  const proof = await run({ mode: "prove" }, figma);
  same("a child outside its section, by its box, fails the proof", proof.fails.includes("outside DSButton: S:out"), true);
});
await guard(async () => {
  const figma = await applied(unitSection());
  const drawsPast = at(figma, "S:smp");
  drawsPast.bleed = [0, 0, 0, 200];
  const proof = await run({ mode: "prove" }, figma);
  same("a child inside its section whose drawing reaches past it fails the proof, by what it draws", proof.fails.includes("outside DSButton: S:smp"), true);
});
await guard(async () => {
  const figma = await applied(unitSection());
  const { offsets } = await run({ mode: "ledger", what: "offsets" }, figma);
  at(figma, "S:row").y += 5;
  const proof = await run({ mode: "prove", ledger: { offsets } }, figma);
  same("a label 5 px off its row fails the proof against the ledger of offsets", proof.fails.includes("label S:row offset moved by 0,5"), true);
  at(figma, "S:row").y -= 5;
  same("the label put back, the proof passes", (await run({ mode: "prove", ledger: { offsets } }, figma)).fails, []);
  const seen = await run({ mode: "prove", bump: ["S:row", 0, 5], ledger: { offsets } }, figma);
  same("bump shows the proof fail once and puts the node back", [seen.seenToFail.length > 0, seen.fails, at(figma, "S:row").y], [true, [], 188]);
});
await guard(async () => {
  const ran = await run({ mode: "run" }, pageOf(unitSection()));
  const figma = await applied(unitSection());
  at(figma, "S:set").name = "DSButtonRenamed";
  const ledger = { lines: ran.ledger.map((line) => [line[0], line[line.length - 1]]) };
  const proof = await run({ mode: "prove", ledger }, figma);
  same("a set renamed after the ledger was taken fails the keys proof", proof.fails.some((one) => one.startsWith("key, id, name, default, size or hash differs S:set")), true);
});
await guard(async () => {
  const figma = await applied(unitSection());
  const strayText = text("S:stray", "Note", "a note", [0, 0, 10, 10]);
  figma.page.children.push(strayText);
  strayText.parent = figma.page;
  const proof = await run({ mode: "prove" }, figma);
  same("a node at the page's top level that is no section fails the proof", proof.fails.includes("top level holds non-sections: S:stray"), true);
});

console.log("\n=== the text the agent passes on");
{
  const body = readFileSync(resolve(SCRIPTS, "align.js"), "utf8");
  ok("align.js holds one INPUTS block and no console.log, no spnutils, no import", (body.match(/const INPUTS = \{/g) ?? []).length === 1 && INPUTS_BLOCK.test(body) && !body.includes("console.log") && !body.toLowerCase().includes("spnutils") && !/^import /m.test(body));
  ok("align.js is dry by default", /const INPUTS = \{\n  mode: "plan"/.test(body));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — figma align` : `\n  all ${total} passed — figma align`);
process.exit(failed ? 1 : 0);
