// Carries out one unit's spec on its set: moves the placed instances, removes the versions that go,
// takes the dropped properties out of the names, and writes the header's layout clause.
//
// Passed to the Figma connector's `use_figma` as it is. A plain script with top-level `await` and
// `return`, no wrapper. Fill INPUTS, change nothing else. DRY IS THE DEFAULT: with `dryRun: true` it
// changes nothing and returns what it would do. A spec is one unit's JSON file (the file `check-specs.mjs`
// reads); pass it whole as `spec`: its `unit`, `setId`, `keep` or `remove`, `dropProps`, `move`, `header`
// and `expect`.
//
//   pageId  the page this call works on; null is the set's own page. The connector works on one page
//           in a call, so a unit placed on other pages gets one "move" call for each of them first.
//   steps   any of "move", "remove", "rename", "header", carried out in that order whatever order is given.
//           move     every instance of the page that stands on a version that goes is swapped to the
//                    version its `move` rule leads to. An instance with no rule is a problem and stays.
//           remove   on the set's own page only: a version that goes is removed. One that still has
//                    an instance on this page is a problem and stays.
//           rename   the cell of each property in `dropProps` is taken out of every version's name.
//                    Refused while a version that goes is still in the set.
//           header   the clauses `rows:`, `columns:`, `one row`, `one column` of the unit's header are
//                    replaced by the spec's `header`.
// Before anything changes it checks that the set is the spec's unit and that the versions that stay
// are `expect.versionsAfterRemoval`; if not, it changes nothing and says why. It stops by itself after
// `maxSeconds` and returns `more: true`: send the same call again, it goes on where it stopped.

const INPUTS = {
  spec: null,
  pageId: null,
  dryRun: true,
  steps: ["move", "remove", "rename", "header"],
  maxSeconds: 45,
};

const startedAt = Date.now();
const late = () => Date.now() - startedAt > INPUTS.maxSeconds * 1000;
const spec = INPUTS.spec;
const set = await figma.getNodeByIdAsync(spec.setId);
if (!set || set.type !== "COMPONENT_SET" || set.name !== spec.unit) {
  return { refused: `${spec.setId} is not the set ${spec.unit}` };
}
// The connector works on one page in a call: the page of INPUTS, or else the set's own page.
let setPage = set.parent;
while (setPage && setPage.type !== "PAGE") setPage = setPage.parent;
const page = INPUTS.pageId ? await figma.getNodeByIdAsync(INPUTS.pageId) : setPage;
if (!page || page.type !== "PAGE") {
  return { refused: `${INPUTS.pageId} is not a page` };
}
await figma.setCurrentPageAsync(page);
const onSetPage = page.id === setPage.id;

const cellsOf = (name) => Object.fromEntries(name.split(", ").map((cell) => {
  const at = cell.indexOf("=");
  return [cell.slice(0, at), cell.slice(at + 1)];
}));
const nameOf = (cells) => Object.entries(cells).map(([property, value]) => `${property}=${value}`).join(", ");
const matches = (cells, pattern) => Object.entries(pattern)
  .every(([property, value]) => (Array.isArray(value) ? value : [value]).map(String).includes(cells[property]));

const drop = spec.dropProps || [];
const versions = set.children.filter((child) => child.type === "COMPONENT").map((node) => ({ node, cells: cellsOf(node.name) }));
const renamed = drop.length > 0 && versions.every((version) => drop.every((property) => !(property in version.cells)));
const stays = (version) => renamed || (spec.keep
  ? spec.keep.some((pattern) => matches(version.cells, pattern))
  : !(spec.remove || []).some((pattern) => matches(version.cells, pattern)));
const kept = versions.filter(stays);
const gone = versions.filter((version) => !stays(version));
if (kept.length !== spec.expect.versionsAfterRemoval) {
  return { refused: `${kept.length} versions would stay, the spec expects ${spec.expect.versionsAfterRemoval}`, versions: versions.length };
}
const keptByName = new Map(kept.map((version) => [version.node.name, version.node]));

const done = { unit: spec.unit, dryRun: INPUTS.dryRun, before: versions.length, stay: kept.length, go: gone.length, moved: 0, removed: 0, renamed: 0, header: null, problems: [], more: false };
const problem = (text) => { if (done.problems.length < 40) done.problems.push(text); };

// The instances of this page that were placed by hand and stand on a version that goes. One inside
// another instance (its id begins with `I`) follows its parent's main component and is left alone.
const goneById = new Map(gone.map((version) => [version.node.id, version]));
const standing = new Map();
if (gone.length > 0 && (INPUTS.steps.includes("move") || INPUTS.steps.includes("remove"))) {
  for (const instance of page.findAllWithCriteria({ types: ["INSTANCE"] })) {
    if (instance.id.startsWith("I")) continue;
    if (late()) { done.more = true; break; }
    const main = await instance.getMainComponentAsync();
    const version = main ? goneById.get(main.id) : null;
    if (!version) continue;
    if (INPUTS.steps.includes("move")) {
      const rule = (spec.move || []).find((one) => matches(version.cells, one.from));
      const target = rule ? keptByName.get(nameOf({ ...version.cells, ...Object.fromEntries(Object.entries(rule.set).map(([property, value]) => [property, String(value)])) })) : null;
      if (target) {
        if (!INPUTS.dryRun) instance.swapComponent(target);
        done.moved += 1;
        continue;
      }
      problem(`no version to move to: ${instance.id} on [${version.node.name}]`);
    }
    standing.set(version.node.id, (standing.get(version.node.id) || 0) + 1);
  }
}

// A version is removed only on the set's own page, and only when no instance of this page stands on it.
// The instances of other pages and files are moved first, by the calls the plan lists for the unit.
if (INPUTS.steps.includes("remove") && !done.more) {
  if (!onSetPage) {
    problem("remove is carried out on the set's own page only");
  } else {
    for (const version of gone) {
      if (late()) { done.more = true; break; }
      if (standing.has(version.node.id) && !INPUTS.dryRun) { problem(`${standing.get(version.node.id)} instances still on [${version.node.name}], not removed`); continue; }
      if (!INPUTS.dryRun) version.node.remove();
      done.removed += 1;
    }
  }
}

const goneLeft = set.children.filter((child) => child.type === "COMPONENT").length - kept.length;
if (INPUTS.steps.includes("rename") && !done.more && !renamed && drop.length > 0 && onSetPage) {
  if (goneLeft > 0 && !INPUTS.dryRun) {
    problem(`${goneLeft} versions that go are still in the set: not renamed`);
  } else {
    for (const version of kept) {
      const name = nameOf(Object.fromEntries(Object.entries(version.cells).filter(([property]) => !drop.includes(property))));
      if (!INPUTS.dryRun) version.node.name = name;
      done.renamed += 1;
    }
  }
}

if (INPUTS.steps.includes("header") && !done.more && spec.header && onSetPage) {
  const home = set.parent;
  const header = home.children.find((child) => child.type === "TEXT" && child.characters.startsWith(spec.unit + " — "));
  if (!header) {
    problem("no header text found beside the set");
  } else {
    // The unit and ` — ` come first, so the first clause is the one after them (`rows: ...` of `DSButton — rows: ...`).
    const prefix = spec.unit + " — ";
    const isLayout = (clause) => /^(rows: |columns: |one row|one column)/.test(clause);
    const clauses = header.characters.slice(prefix.length).split(" · ");
    const first = clauses.findIndex(isLayout);
    let last = first;
    while (last + 1 < clauses.length && isLayout(clauses[last + 1])) last += 1;
    if (first < 0) {
      problem("the header holds no layout clause to replace");
    } else {
      const start = prefix.length + (first === 0 ? 0 : clauses.slice(0, first).join(" · ").length + 3);
      const end = prefix.length + clauses.slice(0, last + 1).join(" · ").length;
      done.header = { was: header.characters.slice(start, end), now: spec.header };
      if (!INPUTS.dryRun && done.header.was !== spec.header) {
        for (const segment of header.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(segment.fontName);
        header.insertCharacters(end, spec.header, "BEFORE");
        header.deleteCharacters(start, end);
      }
    }
  }
}

const after = set.children.filter((child) => child.type === "COMPONENT");
return { ...done, after: after.length, defaultVersion: set.defaultVariant ? set.defaultVariant.name : null, setKey: set.key, properties: INPUTS.dryRun ? null : Object.keys(set.componentPropertyDefinitions) };
