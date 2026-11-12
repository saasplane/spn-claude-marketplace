// Writes a unit's layout into its section's plugin data, and its `behaviour:` note into its header.
//
// Passed to the Figma connector's `use_figma` as it is, or through `bundle.mjs` for the sets of a page. A
// plain script with top-level `await` and `return`, no wrapper. Fill INPUTS, change nothing else. DRY IS
// THE DEFAULT: with `dryRun: true` it changes nothing and returns the header and the layout as they are and as
// they would be. It works after `names.js`, where `apply-spec.js` cannot, because it checks nothing against a spec.
//
//   setId   the unit's set, or null for a unit with no set
//   pageId  the page of a unit with no set: its section is the section of that page named as the unit
//   layout  the layout the section keeps as shared plugin data (namespace `saasplane`, key `layout`), as the
//           drawing page's part "The layout, kept as plugin data" states: { shape, tables, default, cases,
//           behaviour }, each table a `caption`, `rowGroups` and `columnGroups`, each group a `prop` and its
//           `values`, the default first; or null to leave the layout as it is
//   notes   `behaviour: <names>` notes: their names join the header's `behaviour:` line, each written once
//
// The header is the one text of the unit's section whose layer is `header · ` and the unit's name, or whose first
// line is the unit's name. It reads, in the book's form, the unit's name; on the line under it, what the unit is in
// one line; then `behaviour: ` and the names, joined by `, `. It holds no layout: a header still in the old form,
// `<unit> — <line> · rows: … · behaviour: …`, is written in the new form, its line and its behaviour kept and its
// layout clauses dropped, since the layout is the plugin data's. The text is changed by inserting and deleting the
// characters that differ, so its style stays. It refuses, changing nothing, when there is no header or two, when the
// layout is not of the book's form, or when a note is not a `behaviour:` note.

const INPUTS = {
  unit: "",
  setId: null,
  pageId: null,
  layout: null,
  notes: [],
  dryRun: true,
};

let home = null;
let page = null;
if (INPUTS.setId) {
  const set = await figma.getNodeByIdAsync(INPUTS.setId);
  if (!set || set.type !== "COMPONENT_SET" || set.name !== INPUTS.unit) return { refused: `${INPUTS.setId} is not the set ${INPUTS.unit}` };
  home = set.parent;
  page = home;
  while (page && page.type !== "PAGE") page = page.parent;
} else {
  page = INPUTS.pageId ? await figma.getNodeByIdAsync(INPUTS.pageId) : null;
  if (!page || page.type !== "PAGE") return { refused: `${INPUTS.pageId} is not a page` };
  home = page.children.find((child) => child.type === "SECTION" && child.name === INPUTS.unit) || null;
  if (!home) return { refused: `the page holds no section named ${INPUTS.unit}` };
}
await figma.setCurrentPageAsync(page);
if (home.type !== "SECTION") return { refused: `the unit ${INPUTS.unit} stands in no section, and only a section keeps a layout` };

const BEHAVIOUR = "behaviour: ";
const OLD_SEPARATOR = " · ";
const OLD_LAYOUT = /^(rows: |columns: |one row$|one column$|one component)/;
const SHAPES = ["set", "one component", "no set of versions, shown as cases"];
const problems = [];

// The layout given, checked against the book's form before anything is written.
const layout = INPUTS.layout ?? null;
if (layout !== null) {
  const bad = (group) => typeof group?.prop !== "string" || !Array.isArray(group.values) || group.values.length === 0;
  if (typeof layout !== "object" || !SHAPES.includes(layout.shape)) problems.push(`the layout's shape is none of ${SHAPES.join(", ")}`);
  else if (!Array.isArray(layout.tables) || layout.tables.some((table) => typeof table?.caption !== "string" || !Array.isArray(table.rowGroups) || !Array.isArray(table.columnGroups) || [...table.rowGroups, ...table.columnGroups].some(bad))) {
    problems.push("a table of the layout lacks its caption, a group, or a group's prop or values");
  } else if (typeof layout.default !== "object" || !Array.isArray(layout.cases) || !Array.isArray(layout.behaviour)) {
    problems.push("the layout lacks its `default`, its `cases` or its `behaviour`");
  }
}
const added = [];
for (const note of (INPUTS.notes || []).map((one) => String(one).trim()).filter((one) => one.length > 0)) {
  if (!note.startsWith(BEHAVIOUR)) problems.push(`the note \`${note}\` is no \`behaviour:\` note, and a header holds no other`);
  else added.push(...note.slice(BEHAVIOUR.length).split(", ").map((name) => name.trim()).filter((name) => name.length > 0));
}

const headers = home.children.filter((child) => child.type === "TEXT" &&
  (child.name === `header · ${INPUTS.unit}` || child.characters.split("\n")[0].trim() === INPUTS.unit || child.characters.startsWith(INPUTS.unit + " — ")));
if (headers.length !== 1) return { unit: INPUTS.unit, dryRun: INPUTS.dryRun, problems: [`${headers.length} headers name ${INPUTS.unit}, not one`], was: null, now: null };
const header = headers[0];
const was = header.characters;

// The header read in either form: its one line and the behaviour it names.
let line = null;
let behaviour = [];
if (was.startsWith(INPUTS.unit + " — ")) {
  const clauses = was.slice((INPUTS.unit + " — ").length).split(OLD_SEPARATOR).map((clause) => clause.trim());
  line = clauses[0] && !OLD_LAYOUT.test(clauses[0]) && !clauses[0].startsWith(BEHAVIOUR) ? clauses[0] : null;
  for (const clause of clauses.filter((one) => one.startsWith(BEHAVIOUR))) behaviour.push(...clause.slice(BEHAVIOUR.length).split(", ").map((name) => name.trim()));
} else {
  const lines = was.split("\n").map((one) => one.trim()).filter((one) => one.length > 0).slice(1);
  line = lines.find((one) => !one.startsWith(BEHAVIOUR)) ?? null;
  for (const one of lines.filter((candidate) => candidate.startsWith(BEHAVIOUR))) behaviour.push(...one.slice(BEHAVIOUR.length).split(", ").map((name) => name.trim()));
}
for (const name of added) if (!behaviour.includes(name)) behaviour.push(name);
behaviour = behaviour.filter((name, at) => name.length > 0 && behaviour.indexOf(name) === at);
const now = [INPUTS.unit, ...(line ? [line] : []), ...(behaviour.length > 0 ? [BEHAVIOUR + behaviour.join(", ")] : [])].join("\n");

const layoutWas = home.getSharedPluginData("saasplane", "layout") || null;
const layoutNow = layout === null ? layoutWas : JSON.stringify(layout);
const done = { unit: INPUTS.unit, dryRun: INPUTS.dryRun, problems, was, now, layoutWas, layoutNow, stood: now === was && layoutNow === layoutWas };
if (problems.length > 0 || INPUTS.dryRun || done.stood) return done;

// The layout and the set's header are written in the same call, so the two never say different things.
if (layoutNow !== layoutWas) home.setSharedPluginData("saasplane", "layout", layoutNow);
if (now !== was) {
  // Only the characters that differ change, so the text keeps its style.
  let start = 0;
  while (start < was.length && start < now.length && was[start] === now[start]) start += 1;
  let endWas = was.length;
  let endNow = now.length;
  while (endWas > start && endNow > start && was[endWas - 1] === now[endNow - 1]) { endWas -= 1; endNow -= 1; }
  for (const segment of header.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(segment.fontName);
  if (endNow > start) header.insertCharacters(endWas, now.slice(start, endNow), "BEFORE");
  if (endWas > start) header.deleteCharacters(start, endWas);
}
return { ...done, now: header.characters, layoutNow: home.getSharedPluginData("saasplane", "layout") || null };
