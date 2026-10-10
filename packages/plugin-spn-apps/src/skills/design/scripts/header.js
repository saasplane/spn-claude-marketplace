// Writes the layout clauses of a unit's header, and makes the unit's notes the header's last clauses.
//
// Passed to the Figma connector's `use_figma` as it is, or through `bundle.mjs` for the sets of a page. A
// plain script with top-level `await` and `return`, no wrapper. Fill INPUTS, change nothing else. DRY IS
// THE DEFAULT: with `dryRun: true` it changes nothing and returns the header as it is and as it would be.
// It works after `names.js`, where `apply-spec.js` cannot, because it checks nothing against a spec.
//
//   setId   the unit's set, or null for a unit with no set
//   pageId  the page of a unit with no set: its section is the section of that page named as the unit
//   layout  the layout clauses, joined by ` · ` (`rows: ...`, `columns: ...`, `one row`, `one column`), or
//           null to leave the layout as it is
//   notes   clauses to end the header with, each written once: a note the header already holds as a clause
//           is not written twice
//
// The header is the one text of the unit's section that begins with the unit's name and ` — `. Its clauses
// are separated by ` · `. The run of layout clauses (the first one to the last that follows it without a
// gap) is replaced by `layout`; `one row` and `one column` are a layout clause only as a whole clause,
// because a description may begin with the same words. The notes that are not held yet follow the last
// clause. The text is changed by inserting and deleting the characters that differ, so its style stays.
// It refuses, changing nothing, when there is no header or two, when the header holds no layout clause to
// replace, when `layout` holds a clause that is no layout clause, or when a note holds ` · `.

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

const SEPARATOR = " · ";
const prefix = INPUTS.unit + " — ";
const isLayout = (clause) => /^(rows: |columns: )/.test(clause) || /^(one row|one column)$/.test(clause.trim());
const problems = [];
const headers = home.children.filter((child) => child.type === "TEXT" && child.characters.startsWith(prefix));
if (headers.length !== 1) return { unit: INPUTS.unit, dryRun: INPUTS.dryRun, problems: [`${headers.length} headers begin with "${prefix}", not one`], was: null, now: null };
const header = headers[0];
const was = header.characters;
const clauses = was.slice(prefix.length).split(SEPARATOR);

const layoutClauses = INPUTS.layout === null || INPUTS.layout === undefined ? null : String(INPUTS.layout).split(SEPARATOR).map((clause) => clause.trim()).filter((clause) => clause.length > 0);
if (layoutClauses !== null) {
  if (layoutClauses.length === 0) problems.push("the layout is empty");
  for (const clause of layoutClauses) if (!isLayout(clause)) problems.push(`\`${clause}\` is no layout clause`);
}
for (const note of INPUTS.notes || []) if (note.includes(SEPARATOR)) problems.push(`the note \`${note}\` holds ${SEPARATOR.trim()}`);

let next = clauses;
if (layoutClauses !== null) {
  const first = clauses.findIndex(isLayout);
  if (first < 0) {
    problems.push("the header holds no layout clause to replace");
  } else {
    let last = first;
    while (last + 1 < clauses.length && isLayout(clauses[last + 1])) last += 1;
    next = [...clauses.slice(0, first), ...layoutClauses, ...clauses.slice(last + 1)];
  }
}
for (const note of (INPUTS.notes || []).map((one) => one.trim()).filter((one) => one.length > 0)) {
  if (!next.some((clause) => clause.trim() === note)) next = [...next, note];
}
const now = prefix + next.join(SEPARATOR);

const done = { unit: INPUTS.unit, dryRun: INPUTS.dryRun, problems, was, now, stood: now === was };
if (problems.length > 0 || INPUTS.dryRun || now === was) return done;

// Only the characters that differ change, so the text keeps its style.
let start = 0;
while (start < was.length && start < now.length && was[start] === now[start]) start += 1;
let endWas = was.length;
let endNow = now.length;
while (endWas > start && endNow > start && was[endWas - 1] === now[endNow - 1]) { endWas -= 1; endNow -= 1; }
for (const segment of header.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(segment.fontName);
if (endNow > start) header.insertCharacters(endWas, now.slice(start, endNow), "BEFORE");
if (endWas > start) header.deleteCharacters(start, endWas);
return { ...done, now: header.characters };
