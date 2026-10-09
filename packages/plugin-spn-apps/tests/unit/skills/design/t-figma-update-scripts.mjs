// The scripts of a library update: `versions.js` and `instances.js` (the readings), `check-answers.mjs` (the saved
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
  const styleless = await run("labels.js", { setId: "9:1", dryRun: false }, figmaFile([lost.page]));
  ok("a side with no label to take the style from is told, and nothing is changed", styleless.problems.some((text) => /no row label stood/.test(text)), JSON.stringify(styleless.problems));
  // the set was laid out again and is now shorter than the rows its old labels stood beside
  const shrunk = labelsPage();
  shrunk.home.children.find((child) => child.id === "9:1").height = 60;
  const short = await run("labels.js", { setId: "9:1" }, figmaFile([shrunk.page]));
  const whole = await run("labels.js", { setId: "9:1", oldSetBox: [200, 100, 300, 200] }, figmaFile([shrunk.page]));
  same("a set that shrank: `oldSetBox` finds the labels of the rows it no longer reaches, and without it they would be left standing",
    [short.removed.includes("size=MD"), whole.removed], [false, ["size=SM (default)", "size=MD", "state=rest (default)", "state=hover"]]);
});

// ---- the texts the agent passes on --------------------------------------------------------------

console.log("\n=== the texts the agent passes on");
for (const script of ["cases.js", "labels.js"]) {
  ok(`${script} says in its header that it has not yet run against a file`, /NOT YET RUN AGAINST A FILE/.test(readFileSync(resolve(SCRIPTS, script), "utf8").split("\n").slice(0, 4).join("\n")));
  ok(`${script} is dry by default`, /const INPUTS = \{[^}]*dryRun: true/.test(readFileSync(resolve(SCRIPTS, script), "utf8")));
}
for (const script of ["versions.js", "instances.js", "apply-spec.js", "cases.js", "labels.js"]) {
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
