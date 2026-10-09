// The scripts of a library update: `copy.js`, `property.js`, `sheet.js`, `header.js` and `cases.js` (the operations of the drawing), `versions.js` and `instances.js` (the readings), `check-answers.mjs` (the saved
// answers proven by their hash), `apply-spec.js` (one unit's spec carried out on its set) and `check-specs.mjs` (the
// specs checked against the readings, with no call to Figma).
//
// The two scripts for the connector run here as the connector runs them, on a stand-in of the parts of the Figma API
// they use. The two `.mjs` files run as Node runs them, on folders written here.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

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

function node(id, name, type, fields = {}, children = []) {
  const made = { id, name, type, children, ...fields };
  for (const child of children) child.parent = made;
  made.findAll = (test) => {
    const found = [];
    const walk = (parent) => { for (const child of parent.children) { if (test(child)) found.push(child); walk(child); } };
    walk(made);
    return found;
  };
  made.findAllWithCriteria = ({ types }) => {
    const found = [];
    const walk = (parent) => { for (const child of parent.children) { if (types.includes(child.type)) found.push(child); walk(child); } };
    walk(made);
    return found;
  };
  return made;
}
const instanceOf = (id, main) => node(id, "instance", "INSTANCE", { getMainComponentAsync: async () => main });
const version = (id, name, key, width = 100, height = 40) => node(id, name, "COMPONENT", { key, width, height });
function componentSet(id, name, key, versions, definitions = {}) {
  const made = node(id, name, "COMPONENT_SET", { key }, versions);
  made.remove = undefined;
  for (const one of versions) one.remove = () => { made.children = made.children.filter((child) => child !== one); };
  Object.defineProperty(made, "componentPropertyDefinitions", { get() { return definitions; } });
  Object.defineProperty(made, "defaultVariant", { get() { return made.children.filter((child) => child.type === "COMPONENT")[0]; } });
  return made;
}
function pageNode(id, name, children) {
  const made = node(id, name, "PAGE", {}, children);
  return made;
}
function figmaFile(pages) {
  const everything = new Map();
  const walk = (one) => { everything.set(one.id, one); for (const child of one.children ?? []) walk(child); };
  const root = { id: "0:0", name: "DS 2-Components", type: "DOCUMENT", children: pages };
  for (const one of pages) { one.parent = root; walk(one); }
  return {
    root, switches: 0,
    async getNodeByIdAsync(id) { return everything.get(id) ?? null; },
    async setCurrentPageAsync() { this.switches += 1; },
    async loadFontAsync() {},
  };
}
async function run(script, inputs, figma) {
  const body = readFileSync(resolve(SCRIPTS, script), "utf8");
  const defaults = new Function(`return ${INPUTS_BLOCK.exec(body)[0].slice("const INPUTS = ".length, -1)}`)();
  const filled = body.replace(INPUTS_BLOCK, () => `const INPUTS = ${JSON.stringify({ ...defaults, ...inputs })};`);
  return new AsyncFunction("figma", filled)(figma);
}
const fnv = (text) => {
  let hash = 0x811c9dc5;
  for (let place = 0; place < text.length; place += 1) { hash ^= text.charCodeAt(place); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return hash.toString(16).padStart(8, "0");
};

const scratch = mkdtempSync(join(tmpdir(), "figma-update-"));
let folderCount = 0;
const folderOf = (files) => {
  folderCount += 1;
  const folder = join(scratch, `folder-${folderCount}`);
  mkdirSync(folder, { recursive: true });
  files.forEach((content, at) => writeFileSync(join(folder, `${String(at).padStart(2, "0")}.json`), typeof content === "string" ? content : JSON.stringify(content)));
  return folder;
};
function runNode(script, args) {
  try {
    const said = execFileSync(process.execPath, [resolve(SCRIPTS, script), ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { exit: 0, said };
  } catch (error) {
    return { exit: error.status, said: String(error.stdout ?? "") + String(error.stderr ?? "") };
  }
}

// ---- versions.js ---------------------------------------------------------------------------------

console.log("=== versions.js — the units of a page with each of their versions");
const sizes = ["XS", "SM", "MD"];
const unitsPage = () => {
  const buttons = sizes.map((size, at) => version(`5:${at}`, `size=${size}, state=rest`, `kv${at}`, 100 + at, 40));
  const set = componentSet("9:1", "DSBtn", "kset", buttons, { size: { type: "VARIANT", defaultValue: "XS", variantOptions: sizes } });
  const inner = instanceOf("7:1", buttons[0]);
  const hidden = instanceOf("I7:1;2", buttons[1]);
  const lone = node("8:1", "DSLone", "COMPONENT", { key: "klone", width: 10, height: 10 }, [inner, hidden]);
  return pageNode("2:1", "Actions", [node("3:1", "Section", "SECTION", {}, [set, lone])]);
};
await guard(async () => {
  const figma = figmaFile([unitsPage(), pageNode("2:2", "Cover", [])]);
  const listed = await run("versions.js", { pageId: null }, figma);
  same("with no page id the pages are listed with their place and no page is switched to", [listed.pages, figma.switches], [[{ id: "2:1", name: "Actions", index: 0 }, { id: "2:2", name: "Cover", index: 1 }], 0]);
  const answer = await run("versions.js", { pageId: "2:1" }, figma);
  same("the page's units are read in order: a set, then a lone component", answer.rows.filter((row) => row[0] === "U").map((row) => [row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8]]),
    [[0, "9:1", "kset", "DSBtn", "SET", 3, "size=XS, state=rest", "Section"], [1, "8:1", "klone", "DSLone", "COMPONENT", 1, "DSLone", "Section"]]);
  same("a unit's properties are name -> [type, default, values]", answer.rows[0][9], { size: ["VARIANT", "XS", ["XS", "SM", "MD"]] });
  same("a version is a row of its place, key, name and size", answer.rows.filter((row) => row[0] === "V" && row[1] === 0).map((row) => row.slice(2)), [[0, "kv0", "size=XS, state=rest", 100, 40], [1, "kv1", "size=SM, state=rest", 101, 40], [2, "kv2", "size=MD, state=rest", 102, 40]]);
  same("a lone component gives the instances it holds directly, and not those inside an instance", answer.rows.filter((row) => row[0] === "H"), [["H", 1, [["DSBtn", "size=XS, state=rest"]]]]);
  ok("the hash is the hash of the rows, and each unit's E row the hash of its versions", answer.hash === fnv(JSON.stringify(answer.rows)) && answer.rows.find((row) => row[0] === "E")[2] === fnv(JSON.stringify([["kv0", "size=XS, state=rest", 100, 40], ["kv1", "size=SM, state=rest", 101, 40], ["kv2", "size=MD, state=rest", 102, 40]])));
  same("the page is switched to once", figma.switches, 1);
});
await guard(async () => {
  const figma = figmaFile([unitsPage()]);
  const first = await run("versions.js", { pageId: "2:1", maxBytes: 200 }, figma);
  ok("an answer over the byte limit stops by itself and says where to go on", first.next !== null && first.rows.length < 12, JSON.stringify([first.next, first.nextVersion, first.rows.length]));
  const answers = [first];
  while (answers[answers.length - 1].next !== null) {
    const last = answers[answers.length - 1];
    answers.push(await run("versions.js", { pageId: "2:1", maxBytes: 200, from: last.next, versionsFrom: last.nextVersion }, figma));
  }
  const whole = await run("versions.js", { pageId: "2:1" }, figma);
  same("the cut answers hold the rows the whole answer holds, in the same order", answers.flatMap((answer) => answer.rows.filter((row) => row[0] === "V" || row[0] === "U").map((row) => row.slice(0, 3))), whole.rows.filter((row) => row[0] === "V" || row[0] === "U").map((row) => row.slice(0, 3)));
  const folder = folderOf(answers);
  const checked = runNode("check-answers.mjs", [folder]);
  ok("check-answers.mjs accepts them: every version once, the hashes true, the files in a chain", checked.exit === 0 && /0 failures/.test(checked.said), checked.said);
});

// ---- instances.js --------------------------------------------------------------------------------

console.log("\n=== instances.js — the placed instances of a page, counted by the version they stand on");
await guard(async () => {
  const one = version("5:0", "size=SM, state=rest", "kv0");
  const two = version("5:1", "size=MD, state=rest", "kv1");
  componentSet("9:1", "DSBtn", "kset", [one, two]);
  const card = node("4:1", "Card", "FRAME", {}, [instanceOf("6:1", one), instanceOf("6:2", one), instanceOf("6:3", two), instanceOf("I6:1;9", two)]);
  const figma = figmaFile([pageNode("2:1", "Pages", [node("3:1", "Section", "SECTION", {}, [card])])]);
  const answer = await run("instances.js", { pageId: "2:1" }, figma);
  same("a top-level node gives its count and each version placed in it gives a group with its owner and count", answer.rows.map((row) => row.slice(0, 1).concat(row.slice(1, 2), row[0] === "T" ? [row[3], row[5]] : [row[2], row[5], row[6], row[7]])),
    [["T", 0, "Section", 3], ["G", 0, "kv0", "size=SM, state=rest", "Card", 2], ["G", 0, "kv1", "size=MD, state=rest", "Card", 1]]);
  ok("an instance inside another instance (an id that begins with I) is not counted, and the hash is the rows'", answer.rows[0][5] === 3 && answer.hash === fnv(JSON.stringify(answer.rows)));
  const listed = await run("instances.js", { pageId: null }, figma);
  same("with no page id the pages are listed", listed.pages, [{ id: "2:1", name: "Pages", index: 0 }]);
  const within = await run("instances.js", { pageId: "2:1", within: "4:1" }, figma);
  same("`within` reads the children of the named node as the top-level nodes", within.rows.filter((row) => row[0] === "T").map((row) => row[3]), ["instance", "instance", "instance", "instance"]);
  const cut = await run("instances.js", { pageId: "2:1", within: "4:1", maxBytes: 10 }, figma);
  const rest = await run("instances.js", { pageId: "2:1", within: "4:1", from: cut.next, groupsFrom: cut.nextGroup }, figma);
  ok("an answer over the limit stops at a node's end and says where to go on", cut.next === 1 && cut.rows.length === 2 && rest.next === null, JSON.stringify([cut.next, cut.rows.length, rest.next]));
  const checked = runNode("check-answers.mjs", [folderOf([cut, rest])]);
  ok("check-answers.mjs accepts the two as one chain", checked.exit === 0, checked.said);
});

// ---- check-answers.mjs --------------------------------------------------------------------------

console.log("\n=== check-answers.mjs — saved answers proven by their hash");
await guard(async () => {
  const rows = [["G", 0, "k", false, null, "v", "Card", 1, "1:1"]];
  const answer = (changes = {}) => ({ script: "instances", file: "F", page: { id: "2:1", name: "P" }, within: null, from: 0, groupsFrom: 0, next: null, nextGroup: null, rows, hash: fnv(JSON.stringify(rows)), ...changes });
  const clean = runNode("check-answers.mjs", [folderOf([answer()])]);
  ok("a true answer passes, exit 0", clean.exit === 0 && /1 answers, 1 pages, 0 failures/.test(clean.said), clean.said);
  const slipped = runNode("check-answers.mjs", [folderOf([answer({ rows: [["G", 0, "k", false, null, "w", "Card", 1, "1:1"]] })])]);
  ok("a character changed while copying makes the hash differ: exit 1, naming the file", slipped.exit === 1 && /00\.json: rows hash/.test(slipped.said), slipped.said);
  const gap = runNode("check-answers.mjs", [folderOf([answer({ next: 5 }), answer({ from: 7 })])]);
  ok("files that do not follow one another are named", gap.exit === 1 && /begins at 7\/0, expected 5\/0/.test(gap.said), gap.said);
  const unfinished = runNode("check-answers.mjs", [folderOf([answer({ next: 3 })])]);
  ok("a last file that still has `next` is named as not read to its end", unfinished.exit === 1 && /not read to its end/.test(unfinished.said), unfinished.said);
  const notJson = runNode("check-answers.mjs", [folderOf(["not json"])]);
  ok("a file that is not JSON is named", notJson.exit === 1 && /not JSON/.test(notJson.said), notJson.said);
  const out = join(scratch, "joined.json");
  runNode("check-answers.mjs", [folderOf([answer()]), out]);
  same("the joined file is written when asked, one entry for a page", JSON.parse(readFileSync(out, "utf8")).map((one) => [one.script, one.page.id, one.rows.length]), [["instances", "2:1", 1]]);
  const none = runNode("check-answers.mjs", []);
  same("with no folder it says how it is used and exits 2", none.exit, 2);
});

// ---- apply-spec.js -------------------------------------------------------------------------------

console.log("\n=== apply-spec.js — one unit's spec carried out on its set");
const spec = {
  unit: "DSBtn", setId: "9:1", remove: [{ authzDenied: "DISABLE" }], dropProps: ["authzDenied"],
  move: [{ from: { authzDenied: "DISABLE" }, set: { authzDenied: "ENABLE" } }],
  defaults: { size: "SM" }, header: "rows: size=SM (default), MD", expect: { versionsAfterRemoval: 2 },
};
const specPage = () => {
  const versions = [
    version("5:0", "size=SM, authzDenied=ENABLE", "k0"), version("5:1", "size=MD, authzDenied=ENABLE", "k1"),
    version("5:2", "size=SM, authzDenied=DISABLE", "k2"), version("5:3", "size=MD, authzDenied=DISABLE", "k3"),
  ];
  const set = componentSet("9:1", "DSBtn", "kset", versions);
  const header = node("4:0", "header · DSBtn", "TEXT", {
    characters: "DSBtn — rows: size=SM (default), MD, LG · columns: authzDenied=ENABLE, DISABLE · behaviour: loading",
    getStyledTextSegments: () => [{ fontName: { family: "Inter", style: "Regular" } }],
  });
  header.insertCharacters = (index, text) => { header.characters = header.characters.slice(0, index) + text + header.characters.slice(index); };
  header.deleteCharacters = (start, end) => { header.characters = header.characters.slice(0, start) + header.characters.slice(end); };
  const instance = instanceOf("6:1", versions[2]);
  instance.swapped = null;
  instance.swapComponent = (target) => { instance.swapped = target.name; };
  const section = node("3:1", "Section", "SECTION", {}, [header, set, instance]);
  return { page: pageNode("2:1", "Actions", [section]), set, header, instance, versions };
};
await guard(async () => {
  const made = specPage();
  const figma = figmaFile([made.page]);
  const answer = await run("apply-spec.js", { spec }, figma);
  same("dry is the default: it counts what it would do and changes nothing", [answer.dryRun, answer.before, answer.stay, answer.go, answer.moved, answer.removed, answer.renamed, answer.after], [true, 4, 2, 2, 1, 2, 2, 4]);
  same("dry: the header is named as it would change, and the instance, the set and the names are as they were",
    [answer.header, made.instance.swapped, made.set.children.map((one) => one.name), made.header.characters.slice(0, 20), answer.properties],
    [{ was: "rows: size=SM (default), MD, LG · columns: authzDenied=ENABLE, DISABLE", now: "rows: size=SM (default), MD" }, null, ["size=SM, authzDenied=ENABLE", "size=MD, authzDenied=ENABLE", "size=SM, authzDenied=DISABLE", "size=MD, authzDenied=DISABLE"], "DSBtn — rows: size=S", null]);
});
await guard(async () => {
  const made = specPage();
  const figma = figmaFile([made.page]);
  const answer = await run("apply-spec.js", { spec, dryRun: false }, figma);
  same("applied: the instance moves to the version its rule leads to, and the versions that go are removed", [made.instance.swapped, answer.moved, answer.removed, answer.problems], ["size=SM, authzDenied=ENABLE", 1, 2, []]);
  same("applied: the dropped property is out of every name, in the set that is left", [made.set.children.map((one) => one.name), answer.renamed], [["size=SM", "size=MD"], 2]);
  same("applied: the header's layout clause is replaced and the rest of it stays", made.header.characters, "DSBtn — rows: size=SM (default), MD · behaviour: loading");
  same("applied: the answer gives the default and the properties after", [answer.after, answer.defaultVersion, answer.setKey, answer.properties], [2, "size=SM", "kset", []]);
});
await guard(async () => {
  const made = specPage();
  const figma = figmaFile([made.page]);
  const refused = await run("apply-spec.js", { spec: { ...spec, expect: { versionsAfterRemoval: 3 } } }, figma);
  ok("a spec whose expected count is not what would stay is refused, with nothing changed", /2 versions would stay, the spec expects 3/.test(refused.refused ?? "") && made.set.children.length === 4, JSON.stringify(refused));
  const wrong = await run("apply-spec.js", { spec: { ...spec, unit: "DSOther" } }, figma);
  ok("a set that is not the spec's unit is refused", /is not the set DSOther/.test(wrong.refused ?? ""), JSON.stringify(wrong));
  const described = specPage();
  described.header.characters = "DSBtn — one row of a list: a content · one row · columns: size=SM (default), MD · behaviour: loading";
  await run("apply-spec.js", { spec, dryRun: false, steps: ["header"] }, figmaFile([described.page]));
  same("a description that begins with `one row` is no layout clause: it stays, and the clauses after it are replaced", described.header.characters, "DSBtn — one row of a list: a content · rows: size=SM (default), MD · behaviour: loading");
  const unmoved = specPage();
  const noRule =await run("apply-spec.js", { spec: { ...spec, move: [] }, dryRun: false, steps: ["move", "remove"] }, figmaFile([unmoved.page]));
  ok("an instance with no rule is a problem: it stays, and the version it stands on is not removed", noRule.problems.length === 2 && noRule.removed === 1 && unmoved.set.children.length === 3, JSON.stringify([noRule.problems, noRule.removed]));
});

// ---- names.js ------------------------------------------------------------------------------------

console.log("\n=== names.js — the names of a set's versions changed, and nothing else");
const namesPage = () => {
  const versions = [
    version("5:0", "size=SM, validationType=none, selected=false, state=rest", "k0"), version("5:1", "size=SM, validationType=ERROR, selected=false, state=rest", "k1"),
    version("5:2", "size=SM, validationType=none, selected=true, state=rest", "k2"), version("5:3", "size=MD, validationType=none, selected=false, state=rest", "k3"),
  ];
  const set = componentSet("9:1", "DSBtn", "kset", versions);
  return { page: pageNode("2:1", "Actions", [node("3:1", "Section", "SECTION", {}, [set])]), set };
};
const nameOps = [{
  renameProperty: { validationType: "tone" }, renameValue: [{ property: "tone", from: "ERROR", to: "error" }],
  fold: [{ match: { selected: "true", state: "rest" }, set: { state: "selected" } }, { match: {}, set: { disabled: "false" } }], dropProperty: ["selected"],
}];
await guard(async () => {
  const made = namesPage();
  const dry = await run("names.js", { setId: "9:1", unit: "DSBtn", ops: nameOps }, figmaFile([made.page]));
  same("dry is the default: it says how many names would change, and changes none", [dry.dryRun, dry.versions, dry.renamed, dry.problems, made.set.children[0].name], [true, 4, 4, [], "size=SM, validationType=none, selected=false, state=rest"]);
  const applied = await run("names.js", { setId: "9:1", unit: "DSBtn", ops: nameOps, dryRun: false }, figmaFile([made.page]));
  same("applied: a property and a value are renamed, a difference is folded into another property, a property is added last, and a property leaves",
    made.set.children.map((one) => one.name),
    ["size=SM, tone=none, state=rest, disabled=false", "size=SM, tone=error, state=rest, disabled=false", "size=SM, tone=none, state=selected, disabled=false", "size=MD, tone=none, state=rest, disabled=false"]);
  same("applied: the versions keep their ids and keys, and the answer names the properties after", [made.set.children.map((one) => [one.id, one.key]), applied.propertiesAfter], [[["5:0", "k0"], ["5:1", "k1"], ["5:2", "k2"], ["5:3", "k3"]], ["size", "tone", "state", "disabled"]]);
});
await guard(async () => {
  const lone = namesPage();
  lone.set.children.forEach((one) => { one.name = one.name.replace("size=SM, ", "").replace("size=MD, ", "kind=wide, "); });
  lone.set.children.forEach((one) => { one.name = one.name.replace("kind=wide, ", ""); });
  lone.set.children[3].name = "validationType=none, selected=false, state=hover";
  await run("names.js", { setId: "9:1", unit: "DSBtn", ops: [{ fold: [{ match: {}, set: { size: "SM" } }] }], dryRun: false }, figmaFile([lone.page]));
  same("a property named `size` that the versions do not hold is added first in the name", lone.set.children[0].name, "size=SM, validationType=none, selected=false, state=rest");
  const clash = namesPage();
  const refused = await run("names.js", { setId: "9:1", unit: "DSBtn", ops: [{ dropProperty: ["selected"] }], dryRun: false }, figmaFile([clash.page]));
  ok("two versions that would have one name refuse the change, and nothing is renamed", /two versions would be named/.test(refused.problems[0] ?? "") && clash.set.children[2].name.includes("selected=true"), JSON.stringify(refused.problems));
  const uneven = namesPage();
  const partly = await run("names.js", { setId: "9:1", unit: "DSBtn", ops: [{ fold: [{ match: { size: "MD" }, set: { extra: "yes" } }] }], dryRun: false }, figmaFile([uneven.page]));
  ok("a property added to some versions only refuses the change", partly.problems.some((text) => /not all hold the same properties/.test(text)) && !uneven.set.children[3].name.includes("extra"), JSON.stringify(partly.problems));
  const wrong = await run("names.js", { setId: "9:1", unit: "DSOther", ops: [] }, figmaFile([namesPage().page]));
  ok("a set that is not the unit is refused", /is not the set DSOther/.test(wrong.refused ?? ""), JSON.stringify(wrong));
});

// ---- bundle.mjs ----------------------------------------------------------------------------------

console.log("\n=== bundle.mjs — one call out of one script and several fillings of its inputs");
await guard(async () => {
  const folder = join(scratch, "bundle");
  mkdirSync(folder, { recursive: true });
  // as in Figma: a call starts on the file's first page, and a switch is counted
  const fileOf = (made) => {
    const figma = figmaFile([made.page]);
    figma.currentPage = { id: "0:9" };
    figma.setCurrentPageAsync = async (page) => { figma.switches += 1; figma.currentPage = page; };
    return figma;
  };
  const sendBundle = (path, figma) => new AsyncFunction("figma", readFileSync(path, "utf8"))(figma);
  writeFileSync(join(folder, "dry.json"), JSON.stringify([{ spec }, { spec, steps: ["header"] }]));
  const built = runNode("bundle.mjs", ["--script", "apply-spec.js", "--inputs", join(folder, "dry.json"), "--out", join(folder, "dry")]);
  ok("it writes one file and says its runs and its length", built.exit === 0 && /dry\.js: runs 0 to 1, \d+ characters/.test(built.said), built.said);
  const dryPage = specPage();
  const dryFigma = fileOf(dryPage);
  const dry = await sendBundle(join(folder, "dry.js"), dryFigma);
  const alone = await run("apply-spec.js", { spec }, figmaFile([specPage().page]));
  same("each run answers as the script alone answers, in the order of the list", [dry.script, dry.runs, dry.of, dry.stopped, dry.answers[0], dry.answers[1].removed], ["apply-spec.js", 2, 2, null, alone, 0]);
  same("the page is switched to once for the whole call, and a dry bundle changes nothing", [dryFigma.switches, dryPage.set.children.length], [1, 4]);
  ok("no line of comment is sent, and the script's own text is", !/^\s*\/\//m.test(readFileSync(join(folder, "dry.js"), "utf8")) && readFileSync(join(folder, "dry.js"), "utf8").includes("const cellsOf = (name) =>"));
  writeFileSync(join(folder, "real.json"), JSON.stringify([{ spec, dryRun: false }]));
  runNode("bundle.mjs", ["--script", "apply-spec.js", "--inputs", join(folder, "real.json"), "--out", join(folder, "real")]);
  const realPage = specPage();
  const real = await sendBundle(join(folder, "real.js"), fileOf(realPage));
  same("a real run in a bundle changes the file as the script alone does", [real.answers[0].removed, realPage.set.children.map((one) => one.name), realPage.header.characters], [2, ["size=SM", "size=MD"], "DSBtn — rows: size=SM (default), MD · behaviour: loading"]);
  const small = runNode("bundle.mjs", ["--script", "apply-spec.js", "--inputs", join(folder, "dry.json"), "--out", join(folder, "cut"), "--max", String(readFileSync(join(folder, "real.js"), "utf8").length + 40)]);
  ok("inputs that do not fit the limit are cut into files to send in order", small.exit === 0 && /cut-1\.js: runs 0 to 0/.test(small.said) && /cut-2\.js: runs 1 to 1/.test(small.said), small.said);
  // a second run on another page must not switch again
  const other = specPage();
  other.page.id = "2:9";
  const twoPages = fileOf(dryPage);
  const first = twoPages.getNodeByIdAsync.bind(twoPages);
  let asked = 0;
  twoPages.getNodeByIdAsync = async (id) => { if (id === "9:1") { asked += 1; return asked > 1 ? other.set : dryPage.set; } return first(id); };
  const crossed = await sendBundle(join(folder, "dry.js"), twoPages);
  ok("a run that asks for another page than the first ends the call, and is named", crossed.runs === 2 && /a bundle works on one page/.test(crossed.answers[1].threw ?? "") && crossed.stopped?.next === 1 && twoPages.switches === 1, JSON.stringify([crossed.stopped, crossed.answers[1]]));
  writeFileSync(join(folder, "bad.json"), JSON.stringify({ spec }));
  same("inputs that are no list of objects are refused, exit 2", runNode("bundle.mjs", ["--script", "apply-spec.js", "--inputs", join(folder, "bad.json"), "--out", join(folder, "bad")]).exit, 2);
  same("with no arguments it says how it is used and exits 2", runNode("bundle.mjs", []).exit, 2);
});
for (const script of ["apply-spec.js", "layout.js", "labels.js", "cases.js"]) {
  const folder = join(scratch, "bundle");
  writeFileSync(join(folder, "one.json"), JSON.stringify([{}]));
  const built = runNode("bundle.mjs", ["--script", script, "--inputs", join(folder, "one.json"), "--out", join(folder, `one-${script}`)]);
  let parses = false;
  try { new AsyncFunction("figma", readFileSync(join(folder, `one-${script}.js`), "utf8")); parses = true; } catch { parses = false; }
  ok(`${script} makes a bundle that is a whole script, under the connector's limit`, built.exit === 0 && parses && readFileSync(join(folder, `one-${script}.js`), "utf8").length < 50000, built.said);
}

// ---- check-specs.mjs -----------------------------------------------------------------------------

console.log("\n=== check-specs.mjs — the specs against the readings");
await guard(async () => {
  const specs = join(scratch, "specs");
  const readings = join(scratch, "readings");
  mkdirSync(specs, { recursive: true });
  mkdirSync(readings, { recursive: true });
  const versionRows = [["U", 0, "9:1", "kset", "DSBtn", "SET", 4, "size=SM, authzDenied=ENABLE", "Section", {}],
    ["V", 0, 0, "k0", "size=SM, authzDenied=ENABLE", 1, 1], ["V", 0, 1, "k1", "size=MD, authzDenied=ENABLE", 1, 1],
    ["V", 0, 2, "k2", "size=SM, authzDenied=DISABLE", 1, 1], ["V", 0, 3, "k3", "size=MD, authzDenied=DISABLE", 1, 1]];
  const placed = [["G", 0, "k2", false, "DSBtn", "size=SM, authzDenied=DISABLE", "Card", 3, "6:1"]];
  writeFileSync(join(readings, "versions.json"), JSON.stringify([{ script: "versions", file: "F", page: { id: "2:1", name: "P" }, within: null, rows: versionRows }]));
  writeFileSync(join(readings, "instances.json"), JSON.stringify([{ script: "instances", file: "F", page: { id: "2:1", name: "P" }, within: null, rows: placed }]));
  writeFileSync(join(specs, "DSBtn.json"), JSON.stringify(spec));
  const clean = runNode("check-specs.mjs", ["--specs", specs, "--readings", readings]);
  ok("a spec that holds is counted, exit 0", clean.exit === 0 && /4 today, 2 stay, 2 go, 3 placed on a version that goes/.test(clean.said) && /1 specs, 0 with faults/.test(clean.said), clean.said);
  writeFileSync(join(specs, "DSBtn.json"), JSON.stringify({ ...spec, move: [] }));
  const missing = runNode("check-specs.mjs", ["--specs", specs, "--readings", readings]);
  ok("an instance on a version that goes with no move rule is named, exit 1", missing.exit === 1 && /no move rule: F \/ P, owner Card, 3 on \[size=SM, authzDenied=DISABLE\]/.test(missing.said), missing.said);
  writeFileSync(join(specs, "DSBtn.json"), JSON.stringify({ ...spec, expect: { versionsAfterRemoval: 4 } }));
  const count = runNode("check-specs.mjs", ["--specs", specs, "--readings", readings, "DSBtn"]);
  ok("a unit named on the command line is checked alone, and a wrong expected count is named", count.exit === 1 && /2 versions stay, the spec expects 4/.test(count.said), count.said);
  writeFileSync(join(specs, "DSBtn.json"), JSON.stringify({ ...spec, header: "rows: size=SM (default), MD drawn once" }));
  const prose = runNode("check-specs.mjs", ["--specs", specs, "--readings", readings]);
  ok("a header that words a value as `layout.js` cannot read it is named, exit 1", prose.exit === 1 && /\[size=MD\] holds `size=MD`, which the header does not state/.test(prose.said), prose.said);
  writeFileSync(join(specs, "DSBtn.json"), JSON.stringify({ ...spec, header: "one row · one column" }));
  const unnamed = runNode("check-specs.mjs", ["--specs", specs, "--readings", readings]);
  ok("a header that does not name a property the set holds is named, exit 1", unnamed.exit === 1 && /the header names `size` 0 times/.test(unnamed.said), unnamed.said);
  writeFileSync(join(specs, "DSBtn.json"), JSON.stringify({ ...spec, defaults: { size: "XL" } }));
  const noDefault = runNode("check-specs.mjs", ["--specs", specs, "--readings", readings]);
  ok("defaults that no version that stays carries are named, exit 1", noDefault.exit === 1 && /no version that stays carries every default/.test(noDefault.said), noDefault.said);
  writeFileSync(join(specs, "DSBtn.json"), JSON.stringify({ ...spec, defaults: { size: "XL" }, layoutDefaults: { size: "SM" } }));
  const layoutDefault = runNode("check-specs.mjs", ["--specs", specs, "--readings", readings]);
  ok("`layoutDefaults` gives the default of the set as it stands after the removal, exit 0", layoutDefault.exit === 0, layoutDefault.said);
  writeFileSync(join(specs, "DSBtn.json"), JSON.stringify({ ...spec, remove: [{ authzDenied: "DISABLE" }, { size: "MD" }], dropProps: ["authzDenied", "size"], expect: { versionsAfterRemoval: 1 } }));
  const nameless = runNode("check-specs.mjs", ["--specs", specs, "--readings", readings]);
  ok("a drop that leaves a version no property is named, exit 1", nameless.exit === 1 && /takes every property out of a version's name/.test(nameless.said), nameless.said);
  const usage = runNode("check-specs.mjs", []);
  same("with no folders it says how it is used and exits 2", usage.exit, 2);
});

// ---- cases.js ------------------------------------------------------------------------------------

console.log("\n=== cases.js — the cases of a spec that the set's own properties can produce");
const caseSpec = {
  unit: "DSBtn", setId: "9:1",
  cases: [
    { name: "loading=true", base: { size: "SM" }, props: { loading: true }, stands: false },
    { name: "kept=true", base: { size: "SM" }, props: { loading: true }, stands: true },
    { name: "already=true", base: { size: "SM" }, props: { loading: true }, stands: false },
    { name: "withIcon", base: { size: "SM" }, props: { startIcon: "SEARCH" }, stands: false },
    { name: "nowhere", base: { size: "XL" }, props: { loading: true }, stands: false },
    { name: "unheld", base: { size: "SM" }, props: { missing: 1 }, stands: false },
  ],
};
const casesPage = (sheetType = "FRAME") => {
  const instances = [];
  const base = version("5:0", "size=SM", "k0");
  base.createInstance = () => { const made = node(`i${instances.length}`, "instance", "INSTANCE"); made.set = null; made.setProperties = (values) => { made.set = values; }; instances.push(made); return made; };
  const other = version("5:1", "size=MD", "k1");
  const set = componentSet("9:1", "DSBtn", "kset", [base, other], {
    size: { type: "VARIANT", defaultValue: "SM", variantOptions: ["SM", "MD"] },
    "loading#1:0": { type: "BOOLEAN", defaultValue: false },
    "startIcon#1:1": { type: "INSTANCE_SWAP", defaultValue: "x" },
  });
  // a sheet with no auto layout, as most sheets of the library are: a new child lands on its corner
  const sheet = node("4:0", "DSBtn cases", sheetType, { width: 300, height: 40 }, [node("4:1", "already=true", "COMPONENT", { x: 20, y: 0, width: 100, height: 40 })]);
  sheet.appendChild = (child) => { child.parent = sheet; child.x = 0; child.y = 0; sheet.children.push(child); };
  sheet.resize = (width, height) => { sheet.width = width; sheet.height = height; };
  sheet.resizeWithoutConstraints = sheet.resize;
  const section = node("3:1", "Section", "SECTION", {}, [set, sheet]);
  return { page: pageNode("2:1", "Actions", [section]), sheet, instances };
};
const madeComponents = [];
await guard(async () => {
  const made = casesPage();
  const figma = figmaFile([made.page]);
  figma.createComponent = () => { const component = node(`c${madeComponents.length}`, "", "COMPONENT", { x: 0, y: 0, width: 80, height: 30 }); component.appendChild = (child) => { child.parent = component; component.children.push(child); }; madeComponents.push(component); return component; };
  const dry = await run("cases.js", { spec: caseSpec }, figma);
  same("dry is the default: what it would make is listed with the version each stands on, and nothing is made", [dry.dryRun, dry.made, made.sheet.children.length, madeComponents.length], [true, [["loading=true", null, "size=SM"]], 1, 0]);
  same("dry: a case that stands on the sheet, a swap, a missing base and a property the set lacks are told apart", [dry.made.map((one) => one[0]), dry.stood, dry.problems.map((text) => text.split(":")[0])], [["loading=true"], ["already=true"], ["withIcon", "nowhere", "unheld"]]);
  const applied = await run("cases.js", { spec: caseSpec, dryRun: false }, figma);
  same("applied: a component of the case's name is made on the sheet, holding one instance of the base with the property set by its full key", [applied.made.map((one) => [one[0], one[2]]), made.sheet.children.map((child) => child.name), madeComponents[0].name, made.instances[0].set], [[["loading=true", "size=SM"]], ["already=true", "loading=true"], "loading=true", { "loading#1:0": true }]);
  same("applied: the component lays its instance out", [madeComponents[0].layoutMode, madeComponents[0].children.length], ["VERTICAL", 1]);
  same("applied: on a sheet with no auto layout the new case stands in a row of its own under the cases that are there, and the sheet grows to hold it",
    [madeComponents[0].x, madeComponents[0].y, made.sheet.width, made.sheet.height], [20, 88, 300, 118]);
});
await guard(async () => {
  const made = casesPage("SECTION");
  const figma = figmaFile([made.page]);
  const dry = await run("cases.js", { spec: caseSpec }, figma);
  ok("a sheet that is a section is found as the scan finds it", dry.sheet === "4:0", JSON.stringify(dry));
  const none = casesPage();
  none.sheet.name = "DSOther cases";
  const missing = await run("cases.js", { spec: caseSpec }, figmaFile([none.page]));
  ok("a unit with no sheet is told so, and nothing is made", /no sheet named "DSBtn cases"/.test(missing.problems[0] ?? "") && missing.made.length === 0, JSON.stringify(missing));
  const refused = await run("cases.js", { spec: { ...caseSpec, unit: "DSOther" } }, figma);
  ok("a set that is not the spec's unit is refused", /is not the set DSOther/.test(refused.refused ?? ""), JSON.stringify(refused));
});

// ---- labels.js -----------------------------------------------------------------------------------

console.log("\n=== labels.js — the row and column labels written again from the grid");
let copies = 0;
const labelsPage = () => {
  const cells = [["SM", "rest", 20, 20], ["SM", "hover", 140, 20], ["MD", "rest", 20, 100], ["MD", "hover", 140, 100]];
  const versions = cells.map(([size, state, x, y], at) => version(`5:${at}`, `size=${size}, state=${state}`, `k${at}`, 100, 40));
  versions.forEach((one, at) => { one.x = cells[at][2]; one.y = cells[at][3]; });
  const set = componentSet("9:1", "DSBtn", "kset", versions);
  set.x = 200; set.y = 100; set.width = 300; set.height = 200;
  const home = node("3:1", "Section", "SECTION", {}, []);
  home.appendChild = (child) => { child.parent = home; home.children.push(child); };
  const text = (id, name, characters, x, y) => {
    const made = node(id, name, "TEXT", { characters, x, y, width: 80, height: 20 });
    made.getStyledTextSegments = () => [{ fontName: { family: "Inter", style: "Regular" } }];
    made.remove = () => { home.children = home.children.filter((child) => child !== made); };
    // as in Figma, a copy of a text lands on the page and not in the section of the text it copies
    made.clone = () => { copies += 1; const copy = text(`${id}c${copies}`, made.name, made.characters, made.x, made.y); copy.parent = null; return copy; };
    return made;
  };
  // the header's layer is named as a label, as older headers are
  const header = text("4:0", "label · DSBtn", "DSBtn — rows: size=SM (default), MD · columns: state=rest (default), hover", 200, 60);
  for (const one of [header, set, text("4:1", "label · size=SM (default)", "size=SM (default)", 100, 120), text("4:2", "label · size=MD", "size=MD", 100, 200), text("4:3", "label · state=rest (default)", "state=rest (default)", 220, 70), text("4:4", "label · state=hover", "state=hover", 340, 70)]) { one.parent = home; home.children.push(one); }
  return { page: pageNode("2:1", "Actions", [home]), home, header };
};
await guard(async () => {
  const made = labelsPage();
  const figma = figmaFile([made.page]);
  const dry = await run("labels.js", { setId: "9:1" }, figma);
  same("dry is the default: the labels it would write are listed with the old ones it would remove, and the header is no label",
    [dry.dryRun, dry.removed, dry.rows, dry.columns, dry.problems], [true, ["size=SM (default)", "size=MD", "state=rest (default)", "state=hover"], ["size=SM (default)", "size=MD"], ["state=rest (default)", "state=hover"], []]);
  same("dry: nothing is changed", made.home.children.length, 6);
  const applied = await run("labels.js", { setId: "9:1", dryRun: false }, figma);
  const labels = made.home.children.filter((child) => child.type === "TEXT" && child !== made.header);
  same("applied: the four labels stand where the book puts them: a row label ends 24 left of the set and is centred on its row, a column label stands 16 above, at its column's left",
    labels.map((label) => [label.characters, label.x, label.y]), [["size=SM (default)", 96, 130], ["size=MD", 96, 210], ["state=rest (default)", 220, 64], ["state=hover", 340, 64]]);
  same("applied: the header stays, the old labels are gone and the new ones are named for their text", [made.home.children.includes(made.header), applied.made.length, labels.map((label) => label.name)], [true, 4, ["label · size=SM (default)", "label · size=MD", "label · state=rest (default)", "label · state=hover"]]);
});
await guard(async () => {
  const made = labelsPage();
  made.header.characters = "DSBtn — rows: size=SM (default), MD · columns: tone=a, b";
  const odd = await run("labels.js", { setId: "9:1", dryRun: false }, figmaFile([made.page]));
  ok("a named property the versions do not share one value for refuses the writing, and nothing is changed", odd.problems.length > 0 && made.home.children.length === 6, JSON.stringify(odd.problems));
  const bare = labelsPage();
  bare.header.characters = "DSBtn — one component";
  const none = await run("labels.js", { setId: "9:1" }, figmaFile([bare.page]));
  same("a header that names no layout leaves no label to write", [none.rows, none.columns], [[], []]);
  const lost = labelsPage();
  lost.home.children = lost.home.children.filter((child) => !child.name.startsWith("label · size"));
  const borrowed = await run("labels.js", { setId: "9:1", dryRun: false }, figmaFile([lost.page]));
  const rowLabels = lost.home.children.filter((child) => child.type === "TEXT" && child.characters.startsWith("size="));
  same("a side that had no label takes the style of the other side's and names its property (seen on DSAnchorContainer, whose one property moved from the rows to the columns)",
    [borrowed.problems, borrowed.rows, rowLabels.map((label) => [label.characters, label.x, label.y])], [[], ["size=SM (default)", "size=MD"], [["size=SM (default)", 96, 130], ["size=MD", 96, 210]]]);
  const bareSides = labelsPage();
  bareSides.home.children = bareSides.home.children.filter((child) => !child.name.startsWith("label · s"));
  const styleless = await run("labels.js", { setId: "9:1", dryRun: false }, figmaFile([bareSides.page]));
  ok("with no label on either side to take the style from it is told, and nothing is changed", styleless.problems.some((text) => /no label stood on either side/.test(text)) && bareSides.home.children.length === 2, JSON.stringify(styleless.problems));
  // the set was laid out again and is now shorter than the rows its old labels stood beside
  const shrunk = labelsPage();
  shrunk.home.children.find((child) => child.id === "9:1").height = 60;
  const short = await run("labels.js", { setId: "9:1" }, figmaFile([shrunk.page]));
  const whole = await run("labels.js", { setId: "9:1", oldSetBox: [200, 100, 300, 200] }, figmaFile([shrunk.page]));
  same("a set that shrank: `oldSetBox` finds the labels of the rows it no longer reaches, and without it they would be left standing",
    [short.removed.includes("size=MD"), whole.removed], [false, ["size=SM (default)", "size=MD", "state=rest (default)", "state=hover"]]);
});

// ---- the stand-in of a tree that clones, appends and removes ------------------------------------

let cloneCount = 0;
const plantTree = (made) => {
  made.appendChild = (child) => { if (child.parent && child.parent.children) child.parent.children = child.parent.children.filter((one) => one !== child); child.parent = made; made.children.push(child); };
  made.remove = () => { if (made.parent) made.parent.children = made.parent.children.filter((one) => one !== made); };
  return made;
};
// as in Figma: a clone is a copy of the layers, and it loses the ties of its layers to the set's properties
const cloneOf = (source) => {
  cloneCount += 1;
  const copy = node(`clone${cloneCount}`, source.name, source.type, { key: `ckey${cloneCount}`, x: source.x, y: source.y, width: source.width, height: source.height, componentPropertyReferences: {} }, (source.children ?? []).map(cloneOf));
  copy.parent = null;
  copy.clone = () => cloneOf(copy);
  return plantTree(copy);
};
const layer = (id, name, type, references = {}, children = []) => plantTree(node(id, name, type, { componentPropertyReferences: references, getStyledTextSegments: () => [{ fontName: { family: "Inter", style: "Regular" } }], characters: type === "TEXT" ? "Hello" : undefined }, children));
const treeVersion = (id, name, key, x, y, children) => {
  const made = plantTree(version(id, name, key, 100, 40));
  made.x = x; made.y = y;
  for (const child of children) { child.parent = made; made.children.push(child); }
  made.clone = () => cloneOf(made);
  return made;
};
const treeSet = (versions, definitions = {}) => {
  const made = componentSet("9:1", "DSBtn", "kset", versions, definitions);
  plantTree(made);
  made.x = 0; made.y = 0; made.width = 200; made.height = 140;
  made.resize = (width, height) => { made.width = width; made.height = height; };
  made.addComponentProperty = (name, type, value) => { const key = `${name}#9:${Object.keys(definitions).length + 1}`; definitions[key] = { type, defaultValue: value }; return key; };
  return made;
};
const withFile = (page) => {
  const figma = figmaFile([page]);
  figma.currentPage = { id: "0:9" };
  figma.setCurrentPageAsync = async (target) => { figma.switches += 1; figma.currentPage = target; };
  return figma;
};

// ---- copy.js -------------------------------------------------------------------------------------

console.log("\n=== copy.js — versions added as copies of their twin");
const copyPage = () => {
  const tied = () => [layer("l1", "frame", "FRAME", {}, [layer("l2", "icon", "FRAME", { visible: "show#1:0" })])];
  const versions = [treeVersion("5:0", "size=SM, state=rest", "k0", 20, 20, tied()), treeVersion("5:1", "size=MD, state=rest", "k1", 20, 80, tied())];
  const set = treeSet(versions);
  return { page: pageNode("2:1", "Actions", [node("3:1", "Section", "SECTION", {}, [set])]), set, versions };
};
const copyOne = [{ from: { size: "MD" }, to: { size: "XS" } }];
await guard(async () => {
  const made = copyPage();
  const dry = await run("copy.js", { setId: "9:1", unit: "DSBtn", copies: copyOne }, figmaFile([made.page]));
  same("dry is the default: the copy is named with the twin's name, the set's new box is told, and nothing is made", [dry.dryRun, dry.made, dry.setBoxBefore, dry.setBoxAfter, dry.problems, made.set.children.length], [true, [["size=XS, state=rest", null, "size=MD, state=rest"]], [0, 0, 200, 140], [0, 0, 200, 228], [], 2]);
  const applied = await run("copy.js", { setId: "9:1", unit: "DSBtn", copies: copyOne, dryRun: false }, figmaFile([made.page]));
  const copy = made.set.children[2];
  same("applied: the copy is a new component in the set, in a row 48 under everything the set holds, and the set grows to hold it",
    [made.set.children.length, copy.name, copy.x, copy.y, copy.parent === made.set, applied.setBoxAfter, applied.made.map((one) => [one[0], one[2]])], [3, "size=XS, state=rest", 20, 168, true, [0, 0, 200, 228], [["size=XS, state=rest", "size=MD, state=rest"]]]);
  same("applied: the tie that the clone lost is made again from the twin's, and the answer counts it", [copy.children[0].children[0].componentPropertyReferences, applied.tiedAgain], [{ visible: "show#1:0" }, 1]);
  ok("applied: the twin and the other version are as they were", made.versions[1].children[0].children[0].componentPropertyReferences.visible === "show#1:0" && made.set.children[0].name === "size=SM, state=rest");
  const again = await run("copy.js", { setId: "9:1", unit: "DSBtn", copies: copyOne, dryRun: false }, figmaFile([made.page]));
  same("sent twice: the copy that stands is `stood` and nothing is made", [again.made, again.stood, made.set.children.length], [[], ["size=XS, state=rest"], 3]);
});
await guard(async () => {
  const made = copyPage();
  const hover = [{ from: { size: "MD" }, to: { state: "hover" } }];
  await run("copy.js", { setId: "9:1", unit: "DSBtn", copies: hover, dryRun: false }, figmaFile([made.page]));
  const again = await run("copy.js", { setId: "9:1", unit: "DSBtn", copies: hover, dryRun: false }, figmaFile([made.page]));
  same("a partial `from` that the earlier copy matches too still finds its one twin on a second send", [again.problems, again.stood, made.set.children.length], [[], ["size=MD, state=hover"], 3]);
  const two = copyPage();
  const several = await run("copy.js", { setId: "9:1", unit: "DSBtn", copies: [{ from: { size: "MD" }, to: { size: "XS" } }, { from: { size: "SM" }, to: { size: "XS" } }, { from: { size: "MD" }, to: { size: "LG" } }], dryRun: false }, figmaFile([two.page]));
  same("two copies of one send with one name refuse the unit, though they come from two twins", [several.problems.length > 0, two.set.children.length], [true, 2]);
  const row = copyPage();
  await run("copy.js", { setId: "9:1", unit: "DSBtn", copies: [{ from: { size: "MD" }, to: { size: "XS" } }, { from: { size: "MD" }, to: { size: "LG" } }], dryRun: false }, figmaFile([row.page]));
  same("two copies: the second stands 48 right of the first and the set is wider by the same", [row.set.children.slice(2).map((one) => [one.name, one.x, one.y]), row.set.width], [[["size=XS, state=rest", 20, 168], ["size=LG, state=rest", 168, 168]], 348]);
});
await guard(async () => {
  const check = async (copies, edit = () => {}) => {
    const made = copyPage();
    edit(made);
    const answer = await run("copy.js", { setId: "9:1", unit: "DSBtn", copies, dryRun: false }, figmaFile([made.page]));
    return { answer, made };
  };
  const none = await check([{ from: { size: "XL" }, to: { size: "XS" } }]);
  ok("a `from` that finds no version refuses the unit, changing nothing", /finds 0 versions/.test(none.answer.problems[0] ?? "") && none.made.set.children.length === 2, JSON.stringify(none.answer));
  const many = await check([{ from: { state: "rest" }, to: { size: "XS" } }]);
  ok("a `from` that finds two versions refuses the unit", /finds 2 versions/.test(many.answer.problems[0] ?? "") && many.made.set.children.length === 2, JSON.stringify(many.answer));
  const unheld = await check([{ from: { size: "MD" }, to: { tone: "error" } }]);
  ok("a `to` that names a property the twin does not hold refuses the unit", /holds no property tone/.test(unheld.answer.problems[0] ?? ""), JSON.stringify(unheld.answer));
  const clash = await check([{ from: { size: "MD" }, to: { size: "XS" } }, { from: { size: "SM" }, to: { size: "XS", state: "rest" } }, { from: { size: "MD" }, to: { size: "XS" } }]);
  ok("two copies with one name refuse the unit, and not even the good copy is made", /two copies would be named/.test(clash.answer.problems.join(" ")) && clash.made.set.children.length === 2, JSON.stringify(clash.answer.problems));
  const slotted = await check(copyOne, (made) => { made.versions[1].children[0].children.push(layer("l9", "body", "SLOT")); });
  ok("a twin that holds a slot refuses the unit, because a clone turns a slot into a frame", /holds a slot/.test(slotted.answer.problems[0] ?? "") && slotted.made.set.children.length === 2, JSON.stringify(slotted.answer));
  const wrong = await run("copy.js", { setId: "9:1", unit: "DSOther", copies: copyOne }, figmaFile([copyPage().page]));
  ok("a set that is not the unit is refused", /is not the set DSOther/.test(wrong.refused ?? ""), JSON.stringify(wrong));
});

await guard(async () => {
  const chain = [{ from: { size: "MD" }, to: { size: "XS" } }, { from: { size: "XS" }, to: { state: "error" } }];
  const made = copyPage();
  const dry = await run("copy.js", { setId: "9:1", unit: "DSBtn", copies: chain }, figmaFile([made.page]));
  same("a twin may be a copy planned earlier in the same list: dry names both, the second from the first", [dry.problems, dry.made.map((one) => [one[0], one[2]])], [[], [["size=XS, state=rest", "size=MD, state=rest"], ["size=XS, state=error", "size=XS, state=rest"]]]);
  const applied = await run("copy.js", { setId: "9:1", unit: "DSBtn", copies: chain, dryRun: false }, figmaFile([made.page]));
  const last = made.set.children[3];
  same("real: the same names, the second cloned from the first, its tie made again from the version at the head of the chain", [applied.made.map((one) => one[0]), made.set.children.length, last.children[0].children[0].componentPropertyReferences, applied.tiedAgain], [dry.made.map((one) => one[0]), 4, { visible: "show#1:0" }, 2]);
  const again = await run("copy.js", { setId: "9:1", unit: "DSBtn", copies: chain, dryRun: false }, figmaFile([made.page]));
  same("sent twice: both stand, the second `from` finds the standing first copy", [again.problems, again.stood, made.set.children.length], [[], ["size=XS, state=rest", "size=XS, state=error"], 4]);
  const slotted = copyPage();
  slotted.versions[1].children[0].children.push(layer("l9", "body", "SLOT"));
  const refused = await run("copy.js", { setId: "9:1", unit: "DSBtn", copies: chain, dryRun: false }, figmaFile([slotted.page]));
  ok("the slot is read on the version at the head of the chain", /\[size=MD, state=rest\] holds a slot/.test(refused.problems[0] ?? "") && slotted.set.children.length === 2, JSON.stringify(refused));
});

// ---- property.js ---------------------------------------------------------------------------------

console.log("\n=== property.js — a property added and a layer tied to it");
const propertyPage = (extra = () => {}) => {
  const first = treeVersion("5:0", "size=SM", "k0", 20, 20, [layer("l1", "frame", "FRAME", {}, [layer("l2", "empty state", "FRAME"), layer("l3", "label", "TEXT")])]);
  const second = treeVersion("5:1", "size=MD", "k1", 20, 80, [layer("l4", "empty state", "FRAME")]);
  const third = treeVersion("5:2", "size=LG", "k2", 20, 140, []);
  extra({ first, second, third });
  const definitions = {};
  const set = treeSet([first, second, third], definitions);
  return { page: pageNode("2:1", "Actions", [node("3:1", "Section", "SECTION", {}, [set])]), set, first, second, third, definitions };
};
const yesNo = { setId: "9:1", unit: "DSBtn", name: "empty", type: "BOOLEAN", layer: "empty state", ties: "visible", default: false };
await guard(async () => {
  const made = propertyPage();
  const dry = await run("property.js", yesNo, figmaFile([made.page]));
  same("dry is the default: the versions that would be tied are counted, those without the layer named, and nothing is added", [dry.dryRun, dry.wouldTie, dry.versionsWithoutLayer, dry.key, dry.problems, Object.keys(made.definitions)], [true, 2, ["size=LG"], null, [], []]);
  const applied = await run("property.js", { ...yesNo, dryRun: false }, figmaFile([made.page]));
  same("applied: the property is added with its default and the layer is tied to its full key in each version that holds it", [applied.key, applied.tied, made.definitions[applied.key], made.first.children[0].children[0].componentPropertyReferences, made.second.children[0].componentPropertyReferences], ["empty#9:1", 2, { type: "BOOLEAN", defaultValue: false }, { visible: "empty#9:1" }, { visible: "empty#9:1" }]);
  const again = await run("property.js", { ...yesNo, dryRun: false }, figmaFile([made.page]));
  same("sent twice: the property that stands is `stood`, tied to nothing again and added once", [again.stood, again.key, again.tied, Object.keys(made.definitions).length], [true, "empty#9:1", 0, 1]);
});
await guard(async () => {
  const made = propertyPage();
  const text = await run("property.js", { setId: "9:1", unit: "DSBtn", name: "caption", type: "TEXT", layer: "label", ties: "characters", default: null, dryRun: false }, figmaFile([made.page]));
  same("a text property with no default takes the characters of the layer in the default version", [text.key, text.tied, made.definitions[text.key].defaultValue, made.first.children[0].children[1].componentPropertyReferences], ["caption#9:1", 1, "Hello", { characters: "caption#9:1" }]);
  const refuse = async (changes, edit) => {
    const fresh = propertyPage(edit);
    const answer = await run("property.js", { ...yesNo, ...changes, dryRun: false }, figmaFile([fresh.page]));
    return { answer, fresh };
  };
  const missing = await refuse({ layer: "nowhere" });
  ok("no version holding the layer refuses, and nothing is added", /no version holds a layer named/.test(missing.answer.problems[0] ?? "") && Object.keys(missing.fresh.definitions).length === 0, JSON.stringify(missing.answer));
  const twice = await refuse({}, ({ second }) => { second.children.push(layer("l8", "empty state", "FRAME")); });
  ok("a version holding two layers of that name refuses", /holds 2 layers named/.test(twice.answer.problems[0] ?? "") && Object.keys(twice.fresh.definitions).length === 0, JSON.stringify(twice.answer));
  const taken = await refuse({}, ({ first }) => { first.children[0].children[0].componentPropertyReferences = { visible: "other#1:1" }; });
  ok("a layer already tied to another property by the same tie refuses", /tied to other#1:1 already/.test(taken.answer.problems[0] ?? ""), JSON.stringify(taken.answer));
  const notText = await refuse({ type: "TEXT", ties: "characters", default: "x" });
  ok("a text property that meets a layer that is no text refuses", /not a text/.test(notText.answer.problems[0] ?? ""), JSON.stringify(notText.answer));
  const badDefault = await refuse({ default: "yes" });
  ok("a default that does not fit the type refuses", /true or false/.test(badDefault.answer.problems[0] ?? ""), JSON.stringify(badDefault.answer));
  const badTie = await refuse({ ties: "characters" });
  ok("a tie that does not fit the type refuses", /ties `visible`/.test(badTie.answer.problems[0] ?? ""), JSON.stringify(badTie.answer));
  const wrongType = propertyPage();
  wrongType.definitions["empty#1:1"] = { type: "TEXT", defaultValue: "" };
  const clash = await run("property.js", { ...yesNo, dryRun: false }, figmaFile([wrongType.page]));
  ok("a property of that name and another type is a problem, and nothing is tied", /of the type TEXT/.test(clash.problems[0] ?? "") && wrongType.first.children[0].children[0].componentPropertyReferences.visible === undefined, JSON.stringify(clash));
  const wrong = await run("property.js", { ...yesNo, unit: "DSOther" }, figmaFile([propertyPage().page]));
  ok("a set that is not the unit is refused", /is not the set DSOther/.test(wrong.refused ?? ""), JSON.stringify(wrong));
});

// ---- header.js -----------------------------------------------------------------------------------

console.log("\n=== header.js — the layout clauses of a header and its notes");
const headerPage = (characters = "DSBtn — a button · rows: size=SM (default), MD · columns: state=rest (default) · behaviour: loading", withSet = true) => {
  const text = (id, chars) => {
    const made = node(id, "header · DSBtn", "TEXT", { characters: chars, getStyledTextSegments: () => [{ fontName: { family: "Inter", style: "Regular" } }] });
    made.insertCharacters = (index, added) => { made.characters = made.characters.slice(0, index) + added + made.characters.slice(index); };
    made.deleteCharacters = (start, end) => { made.characters = made.characters.slice(0, start) + made.characters.slice(end); };
    return made;
  };
  const header = text("4:0", characters);
  const set = treeSet([treeVersion("5:0", "size=SM", "k0", 20, 20, [])]);
  const section = node("3:1", "DSBtn", "SECTION", {}, withSet ? [header, set] : [header]);
  return { page: pageNode("2:1", "Actions", [section]), header, section, text };
};
const layoutNew = "rows: size=SM (default), MD, LG · columns: state=rest (default)";
const headerNotes = ["behaviour: loading", "behaviour: filter"];
await guard(async () => {
  const made = headerPage();
  const dry = await run("header.js", { unit: "DSBtn", setId: "9:1", layout: layoutNew, notes: headerNotes }, figmaFile([made.page]));
  same("dry is the default: the header as it is and as it would be, and the text is not changed", [dry.dryRun, dry.was, dry.now, dry.stood, made.header.characters === dry.was],
    [true, "DSBtn — a button · rows: size=SM (default), MD · columns: state=rest (default) · behaviour: loading", "DSBtn — a button · rows: size=SM (default), MD, LG · columns: state=rest (default) · behaviour: loading · behaviour: filter", false, true]);
  const applied = await run("header.js", { unit: "DSBtn", setId: "9:1", layout: layoutNew, notes: headerNotes, dryRun: false }, figmaFile([made.page]));
  same("applied: the layout clauses are replaced, a note the header held is not written again, a new one ends it", made.header.characters, "DSBtn — a button · rows: size=SM (default), MD, LG · columns: state=rest (default) · behaviour: loading · behaviour: filter");
  const again = await run("header.js", { unit: "DSBtn", setId: "9:1", layout: layoutNew, notes: headerNotes, dryRun: false }, figmaFile([made.page]));
  same("sent twice: the header stands as it is", [again.stood, made.header.characters === applied.now], [true, true]);
});
await guard(async () => {
  const notes = headerPage();
  await run("header.js", { unit: "DSBtn", setId: "9:1", notes: ["tone: left to the developer"], dryRun: false }, figmaFile([notes.page]));
  same("with no layout only the notes are written, as the last clauses", notes.header.characters, "DSBtn — a button · rows: size=SM (default), MD · columns: state=rest (default) · behaviour: loading · tone: left to the developer");
  const lone = headerPage("DSBtn — one row of a list: a content · one row · behaviour: loading", false);
  await run("header.js", { unit: "DSBtn", setId: null, pageId: "2:1", layout: "one column", notes: [], dryRun: false }, figmaFile([lone.page]));
  same("a unit with no set is found by the section of the page named as the unit, and a description that begins with `one row` is no layout clause", lone.header.characters, "DSBtn — one row of a list: a content · one column · behaviour: loading");
  const refuse = async (changes, characters) => {
    const fresh = headerPage(characters);
    const answer = await run("header.js", { unit: "DSBtn", setId: "9:1", layout: layoutNew, notes: [], dryRun: false, ...changes }, figmaFile([fresh.page]));
    return { answer, fresh };
  };
  const noLayout = await refuse({}, "DSBtn — a button · one component");
  ok("a header with no layout clause to replace refuses, and the text stays", /holds no layout clause/.test(noLayout.answer.problems[0] ?? "") && noLayout.fresh.header.characters === "DSBtn — a button · one component", JSON.stringify(noLayout.answer));
  const notLayout = await refuse({ layout: "rows: size=SM · behaviour: loading" });
  ok("a layout that holds a clause that is no layout clause refuses", /is no layout clause/.test(notLayout.answer.problems[0] ?? ""), JSON.stringify(notLayout.answer));
  const dotted = await refuse({ notes: ["a · b"] });
  ok("a note that holds ` · ` refuses", /holds ·/.test(dotted.answer.problems[0] ?? ""), JSON.stringify(dotted.answer));
  const two = headerPage();
  two.section.children.push(two.text("4:9", "DSBtn — another"));
  const doubled = await run("header.js", { unit: "DSBtn", setId: "9:1", layout: layoutNew, dryRun: false }, figmaFile([two.page]));
  ok("two headers refuse", /2 headers begin with/.test(doubled.problems[0] ?? "") && two.header.characters.includes("rows: size=SM (default), MD ·"), JSON.stringify(doubled));
  const wrong = await run("header.js", { unit: "DSOther", setId: "9:1", layout: layoutNew }, figmaFile([headerPage().page]));
  ok("a set that is not the unit is refused", /is not the set DSOther/.test(wrong.refused ?? ""), JSON.stringify(wrong));
});

// ---- sheet.js ------------------------------------------------------------------------------------

console.log("\n=== sheet.js — the sheet of cases, made in the unit's section");
const sheetPage = (edit = () => {}) => {
  const text = (id, name, chars, x, y, height = 20) => {
    const made = plantTree(node(id, name, "TEXT", { characters: chars, x, y, width: 100, height, getStyledTextSegments: () => [{ fontName: { family: "Inter", style: "Regular" } }] }));
    made.clone = () => { cloneCount += 1; const copy = text(`t${cloneCount}`, made.name, made.characters, made.x, made.y, made.height); copy.parent = null; return copy; };
    return made;
  };
  const set = treeSet([treeVersion("5:0", "size=SM", "k0", 20, 20, [])]);
  set.x = 435; set.y = 148; set.width = 320; set.height = 164;
  const header = text("4:0", "header · DSBtn", "DSBtn — a button · one row", 80, 80);
  const usageLabel = text("4:1", "label · Usage", "Usage", 80, 392, 19);
  const usage = node("4:2", "usage · DSBtn", "FRAME", { x: 435, y: 471, width: 320, height: 116 });
  const section = plantTree(node("3:1", "DSBtn", "SECTION", { x: 0, y: 100, width: 2810, height: 667 }, []));
  const parts = { text, set, header, usageLabel, usage, section };
  edit(parts);
  for (const child of [parts.header, parts.set, parts.usageLabel, parts.usage].filter(Boolean)) { child.parent = section; section.children.push(child); }
  section.resizeWithoutConstraints = (width, height) => { section.width = width; section.height = height; };
  return { page: pageNode("2:1", "Actions", [section]), ...parts };
};
const sheetFile = (made) => {
  const figma = figmaFile([made.page]);
  figma.createFrame = () => plantTree(node(`f${(cloneCount += 1)}`, "Frame", "FRAME", { x: 0, y: 0, width: 0, height: 0, fills: [], strokes: [] }));
  return figma;
};
const sheetInputs = { unit: "DSBtn", setId: "9:1", pageId: "2:1" };
await guard(async () => {
  const made = sheetPage();
  const dry = await run("sheet.js", sheetInputs, sheetFile(made));
  same("dry is the default: the place of the sheet is told, under everything the section holds, left edge on the set, and nothing is made", [dry.dryRun, dry.stood, dry.box.slice(0, 2), dry.problems, made.section.children.length], [true, false, [435, 746], [], 4]);
  const applied = await run("sheet.js", { ...sheetInputs, dryRun: false }, sheetFile(made));
  const sheet = made.section.children.find((child) => child.name === "DSBtn cases");
  same("applied: a frame named `<Unit> cases` stands in the section as the sheets that stand do: a horizontal auto layout, 24 apart, no padding, white, clipping",
    [sheet.type, sheet.layoutMode, sheet.itemSpacing, [sheet.paddingLeft, sheet.paddingTop], sheet.primaryAxisSizingMode, sheet.counterAxisSizingMode, sheet.clipsContent, sheet.fills[0].color, sheet.strokes, sheet.parent === made.section],
    ["FRAME", "HORIZONTAL", 24, [0, 0], "AUTO", "AUTO", true, { r: 1, g: 1, b: 1 }, [], true]);
  same("applied: the sheet's place, the answer and the section grown to hold it with 80 below", [[sheet.x, sheet.y], applied.sheet === sheet.id, applied.section, made.section.height], [[435, 746], true, "3:1", 827]);
  const labels = made.section.children.filter((child) => child.type === "TEXT" && child.name !== "header · DSBtn" && child.name !== "label · Usage");
  same("applied: the band label stands 79 above the sheet at the header's left, the sheet's label 16 above at its left, each a copy of a text of the section",
    labels.map((label) => [label.name, label.characters, label.x, label.y]).sort(), [["label · Cases", "Cases", 80, 667], ["label · DSBtn cases — one component for each case", "DSBtn cases — one component for each case", 435, 710]]);
  const again = await run("sheet.js", { ...sheetInputs, dryRun: false }, sheetFile(made));
  same("sent twice: the sheet that stands is `stood`, and nothing is made", [again.stood, again.sheet === sheet.id, made.section.children.length], [true, true, 7]);
  const listed = sheetPage();
  await run("sheet.js", { ...sheetInputs, label: "color=DEFAULT, PRIMARY", dryRun: false }, sheetFile(listed));
  same("with a `label` the sheet's own label lists it after `<Unit> cases — `", listed.section.children.filter((child) => child.name.startsWith("label · DSBtn cases")).map((child) => child.characters), ["DSBtn cases — color=DEFAULT, PRIMARY"]);
});
await guard(async () => {
  const stands = sheetPage();
  stands.section.children.push(Object.assign(stands.text("4:7", "label · Cases", "Cases", 80, 700, 19), { parent: stands.section }));
  await run("sheet.js", { ...sheetInputs, dryRun: false }, sheetFile(stands));
  same("a band label that stands is not made again", stands.section.children.filter((child) => child.name === "label · Cases").length, 1);
  const lone = sheetPage((parts) => { parts.set = null; });
  lone.section.children.push(Object.assign(node("5:5", "DSBtn", "COMPONENT", { x: 435, y: 148, width: 100, height: 40 }), { parent: lone.section }));
  const loneAnswer = await run("sheet.js", { unit: "DSBtn", setId: null, pageId: "2:1" }, sheetFile(lone));
  same("a unit with no set: the section is the page's section named as the unit, and the sheet stands by the lone component", [loneAnswer.problems, loneAnswer.box.slice(0, 2)], [[], [435, 746]]);
  const refuse = async (edit, changes = {}) => {
    const fresh = sheetPage(edit);
    const answer = await run("sheet.js", { ...sheetInputs, dryRun: false, ...changes }, sheetFile(fresh));
    return { answer, fresh };
  };
  const noHeader = await refuse((parts) => { parts.header = null; });
  ok("a section with no header to take the label's style from refuses, and makes nothing", /no header/.test(noHeader.answer.problems[0] ?? "") && noHeader.fresh.section.children.length === 3, JSON.stringify(noHeader.answer));
  const noBand = await refuse((parts) => { parts.usageLabel = null; });
  ok("a page with no band label anywhere to take the style of `Cases` from refuses, and makes nothing", /neither the section nor the page holds a band label/.test(noBand.answer.problems[0] ?? "") && noBand.fresh.section.children.length === 3, JSON.stringify(noBand.answer));
  const noSection = await refuse(() => {}, { unit: "DSOther", setId: null });
  ok("a unit with no set and no section of its name is refused", /no section named DSOther/.test(noSection.answer.refused ?? ""), JSON.stringify(noSection.answer));
  const wrongPage = await refuse(() => {}, { pageId: "2:9" });
  ok("a page that is none is refused", /is not a page/.test(wrongPage.answer.refused ?? ""), JSON.stringify(wrongPage.answer));
});

// ---- cases.js, the new inputs --------------------------------------------------------------------

console.log("\n=== cases.js — text, modes and replaces, and a unit with no set");
const newCasesPage = () => {
  const instances = [];
  const createInstance = () => {
    const made = node(`i${instances.length}`, "instance", "INSTANCE");
    made.set = null; made.modes = [];
    made.componentProperties = {}; made.explicitVariableModes = {};
    made.getMainComponentAsync = async () => base;
    made.setProperties = (values) => { made.set = values; for (const [key, value] of Object.entries(values)) made.componentProperties[key] = { value }; };
    made.setExplicitVariableModeForCollection = (collection, modeId) => { made.modes.push([collection.name, modeId]); made.explicitVariableModes[collection.id] = modeId; };
    instances.push(made);
    return made;
  };
  const base = version("5:0", "size=SM", "k0");
  base.createInstance = createInstance;
  const set = componentSet("9:1", "DSBtn", "kset", [base], {
    size: { type: "VARIANT", defaultValue: "SM", variantOptions: ["SM"] },
    "loading#1:0": { type: "BOOLEAN", defaultValue: false },
    "label#1:2": { type: "TEXT", defaultValue: "x" },
  });
  const old = plantTree(node("4:1", "old=lone", "COMPONENT", { key: "oldkey", x: 20, y: 0, width: 100, height: 40 }, [plantTree(node("4:5", "frame", "FRAME"))]));
  const sheet = plantTree(node("4:0", "DSBtn cases", "FRAME", { width: 300, height: 40, layoutMode: "HORIZONTAL" }, [old]));
  const placed = node("6:1", "placed", "INSTANCE", { explicitVariableModes: { "VariableCollectionId:k/8:1": "8:2" } });
  const section = node("3:1", "Section", "SECTION", {}, [set, sheet, placed]);
  const figma = figmaFile([pageNode("2:1", "Actions", [section])]);
  figma.variables = { getVariableCollectionByIdAsync: async (id) => (id === "VariableCollectionId:k/8:1" ? { id, name: "Hue", modes: [{ name: "DEFAULT", modeId: "8:2" }, { name: "SUCCESS", modeId: "8:5" }] } : null) };
  const components = [];
  figma.createComponent = () => { const component = plantTree(node(`c${components.length}`, "", "COMPONENT", { x: 0, y: 0, width: 80, height: 30 })); components.push(component); return component; };
  return { figma, sheet, old, instances, components, set };
};
const oneCase = (changes) => ({ unit: "DSBtn", setId: "9:1", cases: [{ name: "loading=true", base: { size: "SM" }, props: { loading: true }, stands: false, ...changes }] });
await guard(async () => {
  const made = newCasesPage();
  const dry = await run("cases.js", { spec: oneCase({ replaces: "old=lone" }) }, made.figma);
  same("dry: a `replaces` is told as [old name, new name, id], and the component and its children are as they were", [dry.replaced, dry.made, made.old.name, made.old.children.length], [[["old=lone", "loading=true", "4:1", "FRAME frame", "rebuild"]], [], "old=lone", 1]);
  const applied = await run("cases.js", { spec: oneCase({ replaces: "old=lone" }), dryRun: false }, made.figma);
  same("applied: the component is kept with its id and key, loses its children, takes the case's name, holds the new instance, and stays where it was",
    [made.old.id, made.old.key, made.old.name, made.old.children.length, made.old.children[0].set, made.old.x, made.old.y, made.sheet.children.length, made.components.length, applied.replaced, applied.made],
    ["4:1", "oldkey", "loading=true", 1, { "loading#1:0": true }, 20, 0, 1, 0, [["old=lone", "loading=true", "4:1", "FRAME frame", "rebuild"]], []]);
  const again = await run("cases.js", { spec: oneCase({ replaces: "old=lone" }), dryRun: false }, made.figma);
  same("sent twice: the case that stands is `stood`, and the instance is not made again", [again.stood, again.replaced, made.old.children.length], [["loading=true"], [], 1]);
});
await guard(async () => {
  const gone = newCasesPage();
  const none = await run("cases.js", { spec: oneCase({ replaces: "nothing here" }), dryRun: false }, gone.figma);
  same("a `replaces` that names no component of the sheet makes the case new and lists it in `nothingToReplace`; no problem", [none.problems, none.nothingToReplace, none.made.map((one) => one[0]), gone.components.length, gone.old.name], [[], ["loading=true"], ["loading=true"], 1, "old=lone"]);
  const frame = newCasesPage();
  frame.sheet.children.push(Object.assign(node("4:6", "a frame", "FRAME"), { parent: frame.sheet }));
  const notComponent = await run("cases.js", { spec: oneCase({ replaces: "a frame" }), dryRun: false }, frame.figma);
  ok("a `replaces` that names something on the sheet that is no component stays a problem, the case is not made", /stands on the sheet as no component/.test(notComponent.problems[0] ?? "") && notComponent.made.length === 0 && frame.components.length === 0, JSON.stringify(notComponent));
  const twice = newCasesPage();
  const spec = oneCase({ replaces: "old=lone" });
  spec.cases.push({ name: "loading=false", base: { size: "SM" }, props: { loading: false }, stands: false, replaces: "old=lone" });
  const claimed = await run("cases.js", { spec, dryRun: false }, twice.figma);
  same("one component replaced by two cases: the second is a problem, and is made nowhere", [claimed.replaced.length, claimed.problems.length, twice.components.length], [1, 1, 0]);
  const text = newCasesPage();
  const texted = await run("cases.js", { spec: oneCase({ text: { label: "Open file" } }), dryRun: false }, text.figma);
  same("a text property is set by its name, with its full key, together with the other properties", [text.instances[0].set, texted.problems], [{ "loading#1:0": true, "label#1:2": "Open file" }, []]);
  const notText = await run("cases.js", { spec: oneCase({ text: { loading: "x" } }) }, newCasesPage().figma);
  ok("a `text` that names a property that is no text is a problem", /not a text/.test(notText.problems[0] ?? ""), JSON.stringify(notText));
  const swapped = await run("cases.js", { spec: oneCase({ swap: { endIcon: "DSIcon / SETTINGS" } }) }, newCasesPage().figma);
  ok("a non-empty `swap` is a problem and the case is not made; an empty one is no problem", /swap is set by hand/.test(swapped.problems[0] ?? "") && swapped.made.length === 0, JSON.stringify(swapped));
  const emptied = await run("cases.js", { spec: oneCase({ swap: {}, text: {}, modes: {} }) }, newCasesPage().figma);
  same("an empty `swap`, `text` and `modes` change nothing about a case", [emptied.problems, emptied.made.map((one) => one[0])], [[], ["loading=true"]]);
});
await guard(async () => {
  const mode = newCasesPage();
  const dry = await run("cases.js", { spec: oneCase({ modes: { Hue: "SUCCESS" } }) }, mode.figma);
  same("dry: a mode that exists is no problem, and nothing is set", [dry.problems, mode.instances.length], [[], 0]);
  await run("cases.js", { spec: oneCase({ modes: { Hue: "SUCCESS" } }), dryRun: false }, mode.figma);
  same("applied: the collection is found by its name among the instances of the section and the mode by its name, and set on the instance", mode.instances[0].modes, [["Hue", "8:5"]]);
  const unknownMode = await run("cases.js", { spec: oneCase({ modes: { Hue: "PURPLE" } }), dryRun: false }, newCasesPage().figma);
  ok("a mode the collection does not hold is a problem naming the modes it holds, and the case is not made", /holds no mode "PURPLE" \(it holds DEFAULT, SUCCESS\)/.test(unknownMode.problems[0] ?? "") && unknownMode.made.length === 0, JSON.stringify(unknownMode));
  const unknownCollection = await run("cases.js", { spec: oneCase({ modes: { Tone: "left" } }), dryRun: false }, newCasesPage().figma);
  ok("a collection that no instance carries is a problem, and the case is not made", /the collection "Tone" is carried by no instance/.test(unknownCollection.problems[0] ?? "") && unknownCollection.made.length === 0, JSON.stringify(unknownCollection));
});
await guard(async () => {
  const made = newCasesPage();
  const lone = plantTree(node("8:1", "DSLone", "COMPONENT", { key: "lk", width: 10, height: 10 }));
  Object.defineProperty(lone, "componentPropertyDefinitions", { get() { return { "open#2:0": { type: "BOOLEAN", defaultValue: false } }; } });
  const instance = node("i9", "instance", "INSTANCE");
  instance.setProperties = (values) => { instance.set = values; };
  lone.createInstance = () => instance;
  const sheet = plantTree(node("4:8", "DSLone cases", "FRAME", { width: 100, height: 40, layoutMode: "VERTICAL" }, []));
  made.figma.root.children[0].children[0].children.push(lone, sheet);
  lone.parent = sheet.parent = made.figma.root.children[0].children[0];
  const everything = made.figma.getNodeByIdAsync;
  made.figma.getNodeByIdAsync = async (id) => (id === "8:1" ? lone : id === "4:8" ? sheet : everything.call(made.figma, id));
  const answer = await run("cases.js", { spec: { unit: "DSLone", setId: null, loneId: "8:1", cases: [{ name: "open=true", base: {}, props: { open: true }, stands: false }] }, dryRun: false }, made.figma);
  same("a unit with no set: the case is an instance of the lone component, and the props are its own", [answer.problems, answer.made.map((one) => [one[0], one[2]]), instance.set], [[], [["open=true", "DSLone"]], { "open#2:0": true }]);
  const wrongLone = await run("cases.js", { spec: { unit: "DSOther", setId: null, loneId: "8:1", cases: [] } }, made.figma);
  ok("a lone component that is not the unit is refused", /is not the lone component DSOther/.test(wrongLone.refused ?? ""), JSON.stringify(wrongLone));
});

await guard(async () => {
  const instanceIn = (made, main, extra = {}) => {
    const instance = node("9:9", "DSBtn", "INSTANCE", { explicitVariableModes: {}, componentProperties: {}, getMainComponentAsync: async () => main, swapped: null, overridden: "Open file", ...extra });
    instance.swapComponent = (target) => { instance.swapped = target.name; };
    instance.setProperties = (values) => { instance.set = values; };
    instance.parent = made.old;
    made.old.children = [instance];
    return instance;
  };
  const right = newCasesPage();
  const held = instanceIn(right, right.set.children[0], { componentProperties: { "loading#1:0": { value: true } } });
  const renamed = await run("cases.js", { spec: oneCase({ replaces: "old=lone" }), dryRun: false }, right.figma);
  same("a component that already holds the right instance is only renamed: the instance, its properties and the layout are not touched", [right.old.name, right.old.children[0] === held, held.set ?? null, held.swapped, renamed.replaced, renamed.problems], ["loading=true", true, null, null, [["old=lone", "loading=true", "4:1", "INSTANCE DSBtn", "rename"]], []]);
  const same_ = await run("cases.js", { spec: oneCase({}), dryRun: false }, right.figma);
  same("sent twice, or with the right component under the case's own name: `stood`, and nothing is named different", [same_.stood, same_.stoodDifferent], [["loading=true"], []]);
  const other = newCasesPage();
  const second = version("5:1", "size=MD", "k1");
  second.parent = other.set; other.set.children.push(second);
  const kept = instanceIn(other, second);
  const keptAnswer = await run("cases.js", { spec: oneCase({ replaces: "old=lone" }), dryRun: false }, other.figma);
  same("a component that holds one instance of the unit keeps it: it is swapped to the base, takes the properties, and its overrides stay",
    [other.old.children[0] === kept, kept.swapped, kept.set, kept.overridden, other.components.length, other.instances.length, keptAnswer.replaced], [true, "size=SM", { "loading#1:0": true }, "Open file", 0, 0, [["old=lone", "loading=true", "4:1", "INSTANCE DSBtn", "keep"]]]);
  const dryKept = newCasesPage();
  const dryHeld = instanceIn(dryKept, second);
  const dryAnswer = await run("cases.js", { spec: oneCase({ replaces: "old=lone" }) }, dryKept.figma);
  same("dry: what the component holds is told in the fourth item, and nothing is touched", [dryAnswer.replaced[0][3], dryHeld.swapped, dryKept.old.children[0] === dryHeld], ["INSTANCE DSBtn", null, true]);
  const sameName = newCasesPage();
  sameName.old.name = "loading=true";
  const swapped = await run("cases.js", { spec: oneCase({ replaces: "loading=true" }), dryRun: false }, sameName.figma);
  same("a component of the case's own name that is not right and is named by `replaces` is replaced: id and key kept, rebuilt", [swapped.replaced, swapped.stood, swapped.stoodDifferent, sameName.old.id, sameName.old.key, sameName.old.children.length, sameName.old.children[0].set], [[["loading=true", "loading=true", "4:1", "FRAME frame", "rebuild"]], [], [], "4:1", "oldkey", 1, { "loading#1:0": true }]);
  const sameRight = newCasesPage();
  sameRight.old.name = "loading=true";
  const heldRight = node("9:8", "DSBtn", "INSTANCE", { explicitVariableModes: {}, componentProperties: { "loading#1:0": { value: true } }, getMainComponentAsync: async () => sameRight.set.children[0] });
  heldRight.parent = sameRight.old;
  sameRight.old.children = [heldRight];
  const untouched = await run("cases.js", { spec: oneCase({ replaces: "loading=true" }), dryRun: false }, sameRight.figma);
  same("the same input with a right component is `stood` and untouched", [untouched.stood, untouched.stoodDifferent, untouched.replaced, sameRight.old.children[0] === heldRight], [["loading=true"], [], [], true]);
  const stoodWrong = newCasesPage();
  stoodWrong.old.name = "loading=true";
  const wrong = await run("cases.js", { spec: oneCase({}) }, stoodWrong.figma);
  same("a component of the case's own name that is not right stays: `stood`, and named in `stoodDifferent` with what it holds", [wrong.stood, wrong.stoodDifferent, wrong.made], [["loading=true"], [["loading=true", "FRAME frame"]], []]);
  const modeRight = newCasesPage();
  const carried = instanceIn(modeRight, modeRight.set.children[0], { componentProperties: { "loading#1:0": { value: true } }, explicitVariableModes: { "VariableCollectionId:k/8:1": "8:5" } });
  modeRight.old.name = "loading=true";
  const modeAnswer = await run("cases.js", { spec: oneCase({ modes: { Hue: "SUCCESS" } }) }, modeRight.figma);
  const modeOther = await run("cases.js", { spec: oneCase({ modes: { Hue: "DEFAULT" } }) }, modeRight.figma);
  same("a component is right only when its instance carries every wanted mode", [modeAnswer.stoodDifferent, modeOther.stoodDifferent.length, carried.name], [[], 1, "DSBtn"]);
});

await guard(async () => {
  // a page whose instances carry no mode: the collection is reached only through the unit's own bound variables
  const bound = (changes = {}) => {
    const made = newCasesPage();
    made.figma.root.children[0].children[0].children = made.figma.root.children[0].children[0].children.filter((child) => child.id !== "6:1");
    const layer = node("5:9", "body", "FRAME", { boundVariables: { fills: [{ type: "VARIABLE_ALIAS", id: "VariableID:direct" }] } });
    layer.parent = made.set.children[0]; made.set.children[0].children.push(layer);
    const hue = { id: "VariableCollectionId:hue/1:1", name: "Hue", modes: [{ name: "DEFAULT", modeId: "8:2" }, { name: "SUCCESS", modeId: "8:5" }] };
    const roles = { id: "VariableCollectionId:roles/1:2", name: "Roles", modes: [{ name: "Light", modeId: "9:1" }] };
    const variables = {
      "VariableID:direct": { variableCollectionId: roles.id, valuesByMode: { "9:1": { type: "VARIABLE_ALIAS", id: "VariableID:further" } } },
      "VariableID:further": { variableCollectionId: hue.id, valuesByMode: { "8:2": { r: 0, g: 0, b: 0 } } },
      ...changes.variables,
    };
    made.figma.variables = {
      getVariableByIdAsync: async (id) => variables[id] ?? null,
      getVariableCollectionByIdAsync: async (id) => ({ [hue.id]: hue, [roles.id]: roles }[id] ?? null),
    };
    return made;
  };
  const through = bound();
  const dry = await run("cases.js", { spec: oneCase({ modes: { Roles: "Light" } }) }, through.figma);
  const real = await run("cases.js", { spec: oneCase({ modes: { Roles: "Light" } }), dryRun: false }, through.figma);
  same("a collection found only through a variable that a layer of the unit is bound to: dry has no problem, real sets the mode", [dry.problems, real.problems, through.instances[0].modes], [[], [], [["Roles", "9:1"]]]);
  const further = bound();
  const furtherReal = await run("cases.js", { spec: oneCase({ modes: { Hue: "SUCCESS" } }), dryRun: false }, further.figma);
  same("a collection found only through an alias one step further", [furtherReal.problems, further.instances[0].modes], [[], [["Hue", "8:5"]]]);
  const neither = bound();
  const lost = await run("cases.js", { spec: oneCase({ modes: { Tone: "left" } }), dryRun: false }, neither.figma);
  ok("a collection that neither way finds is the problem, worded for both, and the case is not made", /carried by no instance of this page and bound to no layer of the unit/.test(lost.problems[0] ?? "") && lost.made.length === 0, JSON.stringify(lost));
  const instanceWins = bound();
  let asked = 0;
  const original = instanceWins.figma.variables.getVariableByIdAsync;
  instanceWins.figma.variables.getVariableByIdAsync = async (id) => { asked += 1; return original(id); };
  const plain = newCasesPage();
  const wins = await run("cases.js", { spec: oneCase({ modes: { Hue: "SUCCESS" } }), dryRun: false }, plain.figma);
  same("the search among placed instances still wins when it finds the collection: no variable is read", [wins.problems, plain.instances[0].modes, asked], [[], [["Hue", "8:5"]], 0]);
});

// ---- bundle.mjs with the new scripts -------------------------------------------------------------

console.log("\n=== bundle.mjs — the new scripts, each with two runs");
await guard(async () => {
  const folder = join(scratch, "bundle");
  const send = (path, figma) => new AsyncFunction("figma", readFileSync(path, "utf8"))(figma);
  const bundled = (script, runs, tag) => {
    writeFileSync(join(folder, `${tag}.json`), JSON.stringify(runs));
    const built = runNode("bundle.mjs", ["--script", script, "--inputs", join(folder, `${tag}.json`), "--out", join(folder, tag)]);
    return { built, path: join(folder, `${tag}.js`) };
  };
  const copying = copyPage();
  const copyRuns = bundled("copy.js", [{ setId: "9:1", unit: "DSBtn", copies: copyOne }, { setId: "9:1", unit: "DSBtn", copies: copyOne, dryRun: false }], "copy-two");
  const copyFigma = withFile(copying.page);
  const copyAnswer = await send(copyRuns.path, copyFigma);
  same("copy.js in a bundle: a dry run then a real run, the page switched once, the copy made by the second", [copyRuns.built.exit, copyAnswer.runs, copyAnswer.answers[0].made[0][1], copyAnswer.answers[1].made.length, copyFigma.switches, copying.set.children.length], [0, 2, null, 1, 1, 3]);
  const tying = propertyPage();
  const propertyRuns = bundled("property.js", [yesNo, { ...yesNo, dryRun: false }], "property-two");
  const propertyAnswer = await send(propertyRuns.path, withFile(tying.page));
  same("property.js in a bundle: dry then real", [propertyAnswer.answers[0].key, propertyAnswer.answers[1].tied], [null, 2]);
  const heading = headerPage();
  const headerRuns = bundled("header.js", [{ unit: "DSBtn", setId: "9:1", layout: layoutNew }, { unit: "DSBtn", setId: "9:1", layout: layoutNew, dryRun: false }], "header-two");
  const headerAnswer = await send(headerRuns.path, withFile(heading.page));
  same("header.js in a bundle: dry then real", [headerAnswer.answers[0].now === headerAnswer.answers[1].now, heading.header.characters.includes("MD, LG")], [true, true]);
  const sheeting = sheetPage();
  const sheetRuns = bundled("sheet.js", [sheetInputs, { ...sheetInputs, dryRun: false }], "sheet-two");
  const sheetFigma = sheetFile(sheeting);
  sheetFigma.setCurrentPageAsync = async () => {};
  const sheetAnswer = await send(sheetRuns.path, sheetFigma);
  same("sheet.js in a bundle: dry then real", [sheetAnswer.answers[0].sheet, typeof sheetAnswer.answers[1].sheet], [null, "string"]);
});
for (const script of ["copy.js", "property.js", "sheet.js", "header.js"]) {
  const folder = join(scratch, "bundle");
  writeFileSync(join(folder, "one.json"), JSON.stringify([{}]));
  const built = runNode("bundle.mjs", ["--script", script, "--inputs", join(folder, "one.json"), "--out", join(folder, `one-${script}`)]);
  let parses = false;
  try { new AsyncFunction("figma", readFileSync(join(folder, `one-${script}.js`), "utf8")); parses = true; } catch { parses = false; }
  ok(`${script} makes a bundle that is a whole script, under the connector's limit`, built.exit === 0 && parses && readFileSync(join(folder, `one-${script}.js`), "utf8").length < 50000, built.said);
}

await guard(async () => {
  const made = labelsPage();
  for (const [id, name, y] of [["4:7", "label · Usage", 150], ["4:8", "label · Cases", 200], ["4:9", "label · DSBtn cases — size=SM", 220]]) {
    const band = made.home.children.find((child) => child.id === "4:1");
    const copy = band.clone(); copy.id = id; copy.name = name; copy.characters = name.slice(8); copy.x = 40; copy.y = y; copy.parent = made.home; made.home.children.push(copy);
  }
  const dry = await run("labels.js", { setId: "9:1" }, figmaFile([made.page]));
  same("a band label and a sheet's own label beside the set are no row label, and are not removed", dry.removed, ["size=SM (default)", "size=MD", "state=rest (default)", "state=hover"]);
  await run("labels.js", { setId: "9:1", dryRun: false }, figmaFile([made.page]));
  same("after the real call they still stand", ["label · Usage", "label · Cases", "label · DSBtn cases — size=SM"].map((name) => made.home.children.some((child) => child.name === name)), [true, true, true]);
});

await guard(async () => {
  const made = sheetPage();
  const outer = node("3:0", "DSAll", "SECTION", { x: 0, y: 0, width: 3000, height: 1000 }, [made.section]);
  made.page.children = [outer];
  outer.parent = made.page; made.section.parent = outer;
  const nested = await run("sheet.js", { ...sheetInputs, dryRun: false }, sheetFile(made));
  ok("a unit whose section stands inside another section is found: the page is reached by walking up", nested.problems.length === 0 && typeof nested.sheet === "string" && made.section.children.some((child) => child.name === "DSBtn cases"), JSON.stringify(nested));
  const lone = sheetPage((parts) => { parts.set = null; });
  lone.section.children.push(Object.assign(node("5:5", "DSBtn", "COMPONENT", { x: 435, y: 148, width: 100, height: 40 }), { parent: lone.section }));
  const outerLone = node("3:0", "DSAll", "SECTION", { x: 0, y: 0, width: 3000, height: 1000 }, [lone.section]);
  lone.page.children = [outerLone]; outerLone.parent = lone.page; lone.section.parent = outerLone;
  const deep = await run("sheet.js", { unit: "DSBtn", setId: null, pageId: "2:1" }, sheetFile(lone));
  same("a unit with no set: the section named as the unit is found inside another section", [deep.problems, deep.section], [[], "3:1"]);
});

await guard(async () => {
  const own = sheetPage();
  const ownAnswer = await run("sheet.js", { ...sheetInputs, dryRun: false }, sheetFile(own));
  same("the style of `Cases` comes from the section's own band label when it has one", ownAnswer.bandStyleFrom, "4:1");
  const inParent = sheetPage((parts) => { parts.usageLabel = null; });
  const parentBand = inParent.text("7:1", "label · Parts", "Parts", 80, 50);
  const outer = plantTree(node("3:0", "DSAll", "SECTION", { x: 0, y: 0, width: 3000, height: 1000 }, [inParent.section, parentBand]));
  inParent.page.children = [outer]; outer.parent = inParent.page; inParent.section.parent = outer; parentBand.parent = outer;
  const fromParent = await run("sheet.js", { ...sheetInputs, dryRun: false }, sheetFile(inParent));
  const cases = inParent.section.children.find((child) => child.name === "label · Cases");
  same("a section with no band label takes the style from its parent section's: the copy stands in the unit's section", [fromParent.problems, fromParent.bandStyleFrom, Boolean(cases), cases && cases.parent === inParent.section], [[], "7:1", true, true]);
  const another = sheetPage((parts) => { parts.usageLabel = null; });
  const neighbour = plantTree(node("3:8", "DSOther", "SECTION", { x: 0, y: 900, width: 2810, height: 300 }, []));
  const otherBand = another.text("8:1", "label · Usage", "Usage", 80, 300, 19);
  otherBand.parent = neighbour; neighbour.children.push(otherBand);
  neighbour.parent = another.page; another.page.children.push(neighbour);
  const dry = await run("sheet.js", sheetInputs, sheetFile(another));
  const fromOther = await run("sheet.js", { ...sheetInputs, dryRun: false }, sheetFile(another));
  same("a section with no band label takes the style from another section of the page", [dry.problems, dry.bandStyleFrom, fromOther.bandStyleFrom, another.section.children.some((child) => child.name === "label · Cases")], [[], "8:1", "8:1", true]);
  const stands = sheetPage();
  stands.section.children.push(Object.assign(stands.text("4:7", "label · Cases", "Cases", 80, 700, 19), { parent: stands.section }));
  const standing = await run("sheet.js", { ...sheetInputs, dryRun: false }, sheetFile(stands));
  same("when `label · Cases` stood already, bandStyleFrom is a copy of the section's own band label or null", standing.bandStyleFrom, null);
});

// ---- the texts the agent passes on --------------------------------------------------------------

console.log("\n=== the texts the agent passes on");
for (const script of ["cases.js", "labels.js", "copy.js", "property.js", "sheet.js", "header.js"]) {
  ok(`${script} says in its header that it has not yet run against a file`, /NOT YET RUN AGAINST A FILE/.test(readFileSync(resolve(SCRIPTS, script), "utf8").split("\n").slice(0, 4).join("\n")));
  ok(`${script} is dry by default`, /const INPUTS = \{[^}]*dryRun: true/.test(readFileSync(resolve(SCRIPTS, script), "utf8")));
}
for (const script of ["versions.js", "instances.js", "apply-spec.js", "cases.js", "labels.js", "copy.js", "property.js", "sheet.js", "header.js"]) {
  const body = readFileSync(resolve(SCRIPTS, script), "utf8");
  ok(`${script} holds one INPUTS block and no console.log, no spnutils`, (body.match(/const INPUTS = \{/g) ?? []).length === 1 && INPUTS_BLOCK.test(body) && !body.includes("console.log") && !body.toLowerCase().includes("spnutils"));
  const block = INPUTS_BLOCK.exec(body)[0];
  const missing = [...new Set([...body.matchAll(/INPUTS\.(\w+)/g)].map((one) => one[1]))].filter((name) => !new RegExp(`\\n  ${name}:`).test(block));
  same(`${script} holds, in its INPUTS block, every input it reads`, missing, []);
}
for (const script of ["versions.js", "instances.js"]) {
  const body = readFileSync(resolve(SCRIPTS, script), "utf8");
  ok(`${script} writes nothing to the file`, !/\.(createFrame|createComponent|createText|appendChild|remove|swapComponent|insertCharacters|deleteCharacters)\(|\.name = /.test(body));
}
ok("apply-spec.js is dry by default", /const INPUTS = \{[^}]*dryRun: true/.test(readFileSync(resolve(SCRIPTS, "apply-spec.js"), "utf8")));
for (const script of ["check-answers.mjs", "check-specs.mjs"]) {
  const body = readFileSync(resolve(SCRIPTS, script), "utf8");
  ok(`${script} reads files and writes at most the one it is given: no process spawned, no network, no folder of a workstream`, !/child_process|\bfetch\(|node:https?|node:net|XMLHttpRequest|\.spndevex|workstreams|import\.meta\.url/.test(body));
}
rmSync(scratch, { recursive: true, force: true });

console.log(failed ? `\n  ${failed} of ${total} FAILED — figma update scripts` : `\n  all ${total} passed — figma update scripts`);
process.exit(failed ? 1 : 0);
