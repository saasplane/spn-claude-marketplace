// Makes the sheet `<Unit> cases` in a unit's section, with its two labels, for a unit that has none.
// NOT YET RUN AGAINST A FILE: only its stand-in test has run it. Send it dry first and read what it says.
//
// Passed to the Figma connector's `use_figma` as it is, or through `bundle.mjs` for the sets of a page. A
// plain script with top-level `await` and `return`, no wrapper. Fill INPUTS, change nothing else. DRY IS
// THE DEFAULT: with `dryRun: true` it changes nothing and returns the place it would make the sheet at.
//
//   unit    the unit's name
//   setId   the unit's set, or null for a unit with no set
//   pageId  the page the call works on; with no set, the unit's section is the section of this page named
//           as the unit, found at any depth of sections
//   label   a text; the sheet's own label is `<Unit> cases — <label>` (the sheets that stand list their
//           cases there). With no label it is `<Unit> cases — one component for each case`
//
// The sheet has the form the sheets that stand in the file have: a frame named `<Unit> cases` in the
// unit's section, a horizontal auto layout 24 apart with no padding, a white fill, no stroke, clipping its
// content, as wide and high as what it will hold. It stands under everything the section holds, its left
// edge on the unit's set (or lone component), and the section grows to hold it with 80 below. Two labels
// stand with it, as they do on a sheet that is there: the band label `label · Cases`, 79 above the sheet
// at the left of the header, and the sheet's own label `<Unit> cases — ...`, 16 above the sheet at its
// left. Each is a copy of a text of the section, so it has that text's style: the header for the sheet's
// label, a band label for `Cases`: the section's own `Usage` or `Parts`, or else the first band label (`Usage`,
// `Cases`, `Parts`) of the page, the unit's parent sections first. The answer's `bandStyleFrom` is the id of
// the text copied, or null when `label · Cases` stood already.
// A sheet that stands is `stood`, and nothing is made. It refuses, changing nothing, when the set is not in
// a section, when the section has no header or no text to take the labels' style from, or when it has
// nothing to set the sheet's left edge by.

const INPUTS = {
  unit: "",
  setId: null,
  pageId: null,
  label: null,
  dryRun: true,
};

const page = INPUTS.pageId ? await figma.getNodeByIdAsync(INPUTS.pageId) : null;
if (!page || page.type !== "PAGE") return { refused: `${INPUTS.pageId} is not a page` };
let set = null;
let section = null;
if (INPUTS.setId) {
  set = await figma.getNodeByIdAsync(INPUTS.setId);
  if (!set || set.type !== "COMPONENT_SET" || set.name !== INPUTS.unit) return { refused: `${INPUTS.setId} is not the set ${INPUTS.unit}` };
  section = set.parent;
  if (!section || section.type !== "SECTION") return { refused: `the set ${INPUTS.unit} does not stand in a section` };
  let up = section;
  while (up && up.type !== "PAGE") up = up.parent;
  if (up !== page) return { refused: `the set ${INPUTS.unit} is not on the page ${INPUTS.pageId}` };
} else {
  const inside = (parent) => {
    for (const child of parent.children) {
      if (child.type !== "SECTION") continue;
      if (child.name === INPUTS.unit) return child;
      const deeper = inside(child);
      if (deeper) return deeper;
    }
    return null;
  };
  section = inside(page);
  if (!section) return { refused: `the page holds no section named ${INPUTS.unit}` };
}
await figma.setCurrentPageAsync(page);

const SHEET_NAME = `${INPUTS.unit} cases`;
const BAND_NAME = "label · Cases";
const BAND_ABOVE = 79;
const LABEL_ABOVE = 16;
const SECTION_BELOW = 80;
const UNDER = BAND_ABOVE + 80;
const problems = [];
const boxOf = (node) => [node.x, node.y, node.width, node.height];

const standing = section.children.find((child) => (child.type === "FRAME" || child.type === "SECTION") && child.name === SHEET_NAME);
if (standing) {
  return { unit: INPUTS.unit, dryRun: INPUTS.dryRun, problems, stood: true, sheet: standing.id, section: section.id, box: boxOf(standing) };
}

const texts = section.children.filter((child) => child.type === "TEXT");
const header = texts.find((child) => child.characters.startsWith(INPUTS.unit + " — "));
const bandStands = texts.some((child) => child.name === BAND_NAME);
const BAND_NAMES = ["label · Usage", "label · Cases", "label · Parts"];
// With none in the unit's section, a band label of the same page is copied: the unit's parent sections' own
// children first (nearest first), then the sections of the whole page, walked at any depth.
const bandIn = (parent) => parent.children.find((child) => child.type === "TEXT" && BAND_NAMES.includes(child.name));
const bandElsewhere = () => {
  for (let up = section.parent; up && up.type === "SECTION"; up = up.parent) {
    const found = bandIn(up);
    if (found) return found;
  }
  const walk = (parent) => {
    for (const child of parent.children) {
      if (child.type !== "SECTION" || child === section) continue;
      const found = bandIn(child) || walk(child);
      if (found) return found;
    }
    return null;
  };
  return walk(page);
};
const bandTemplate = bandStands ? null : texts.find((child) => child.name === "label · Usage" || child.name === "label · Parts") || bandElsewhere();
const anchor = set || section.children.find((child) => child.type === "COMPONENT" && child.name === INPUTS.unit)
  || [...section.children].filter((child) => child.type !== "TEXT").sort((first, second) => first.x - second.x)[0];
if (!header) problems.push(`the section ${INPUTS.unit} holds no header to take the sheet label's style from`);
if (!bandStands && !bandTemplate) problems.push("neither the section nor the page holds a band label (Usage, Cases or Parts) to take the style of `Cases` from");
if (!anchor) problems.push("the section holds nothing to set the sheet's left edge by");
if (problems.length > 0) return { unit: INPUTS.unit, dryRun: INPUTS.dryRun, problems, stood: false, sheet: null, section: section.id, box: null };

const bottom = section.children.length > 0 ? Math.max(...section.children.map((child) => child.y + child.height)) : 0;
const sheetLeft = anchor.x;
const sheetTop = bottom + UNDER;
const sectionBefore = boxOf(section);
const done = { unit: INPUTS.unit, dryRun: INPUTS.dryRun, problems, stood: false, sheet: null, section: section.id, box: [sheetLeft, sheetTop, 0, 0], sectionBox: sectionBefore, bandStyleFrom: bandTemplate ? bandTemplate.id : null };
if (INPUTS.dryRun) return done;

const sheet = figma.createFrame();
sheet.name = SHEET_NAME;
section.appendChild(sheet);
sheet.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
sheet.strokes = [];
sheet.clipsContent = true;
sheet.layoutMode = "HORIZONTAL";
sheet.itemSpacing = 24;
sheet.paddingLeft = 0;
sheet.paddingRight = 0;
sheet.paddingTop = 0;
sheet.paddingBottom = 0;
sheet.primaryAxisSizingMode = "AUTO";
sheet.counterAxisSizingMode = "AUTO";
sheet.x = sheetLeft;
sheet.y = sheetTop;

// A copy of a text lands on the page's top level: it goes into the section first, then takes its place.
const written = async (template, text, name, left, top) => {
  const label = template.clone();
  section.appendChild(label);
  for (const segment of label.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(segment.fontName);
  label.characters = text;
  label.name = name;
  label.x = left;
  label.y = top;
  return label;
};
const sheetLabelText = `${SHEET_NAME} — ${INPUTS.label || "one component for each case"}`;
const sheetLabel = await written(header, sheetLabelText, "label · " + sheetLabelText, sheetLeft, sheetTop - LABEL_ABOVE - header.height);
const made = [sheetLabel.id];
if (!bandStands) {
  const band = await written(bandTemplate, "Cases", BAND_NAME, header.x, sheetTop - BAND_ABOVE);
  made.push(band.id);
}
const wantedHeight = Math.max(section.height, sheet.y + Math.max(sheet.height, 1) + SECTION_BELOW);
const wantedWidth = Math.max(section.width, sheet.x + sheet.width);
if (wantedHeight !== section.height || wantedWidth !== section.width) section.resizeWithoutConstraints(wantedWidth, wantedHeight);
return { ...done, sheet: sheet.id, box: boxOf(sheet), sectionBox: boxOf(section), madeLabels: made };
