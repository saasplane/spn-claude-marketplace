// `checks/figure-spacing.ts` — a drawing a page write carries is measured with `checkFigures`.
const { checkFigureSpacing } = await import("../../../../src/scripts/checks/figure-spacing.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const verdictOf = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");
const write = (file_path, content, tool_name = "Write") =>
  ({ tool_name, cwd: "/repo", tool_input: tool_name === "Write" ? { file_path, content } : { file_path, new_string: content } });

const drawing = (inner) => `<svg class="sds-drawing" viewBox="0 0 400 200">${inner}</svg>`;
const SPACED = drawing('<rect x="20" y="20" width="160" height="60"/><text class="sds-label" x="36" y="56">Turn end</text>');
const TIGHT = drawing('<rect x="20" y="20" width="160" height="60"/><text class="sds-label" x="184" y="56">Turn end</text>');
const page = (body) => write("/ws/.spndevex/workstreams/open/036-x/notes/N006/preview.html", body);

console.log("=== a drawing against the spacing contract");
const refused = checkFigureSpacing(page(TIGHT));
ok("[MKT.HOOKS.135] a label too near a box it is not inside is refused", verdictOf(refused) === "deny", JSON.stringify(refused));
ok("[MKT.HOOKS.135] the refusal names the label", (refused?.deny ?? "").includes("Turn end"), refused?.deny);
ok("[MKT.HOOKS.135] a spaced drawing passes", verdictOf(checkFigureSpacing(page(SPACED))) === "silent",
  JSON.stringify(checkFigureSpacing(page(SPACED))));
ok("[MKT.HOOKS.135] an svg that is not a drawing is not measured",
  verdictOf(checkFigureSpacing(page(TIGHT.replace("sds-drawing", "icon")))) === "silent");
ok("[MKT.HOOKS.135] a write with no svg is quiet", verdictOf(checkFigureSpacing(page("<p>hello</p>"))) === "silent");

console.log("=== the docs design language's own units are not misread as faults");
const dl = (inner) => `<svg class="dl-svg" viewBox="0 0 400 240">${inner}</svg>`;
const verdictFor = (inner) => verdictOf(checkFigureSpacing(page(dl(inner))));
const BOX = '<rect class="dl-tile" x="40" y="40" width="120" height="48" rx="10"/>';
const GLYPH = '<g class="dl-glyph" transform="translate(52 52) scale(0.8)"><rect width="16" height="12" x="4" y="8" rx="2"/><rect width="6" height="6" x="9" y="11"/></g>';
const PERSON = (x, y) => `<g class="person" transform="translate(${x} ${y}) scale(1.4)"><g><line x1="0" y1="-26" x2="0" y2="-29"/><path d="M-2 -10 L-2 0" stroke-width="1.2"/><rect x="-4.5" y="-21" width="9" height="11" rx="3.5"/></g></g>`;
ok("[MKT.HOOKS.135] a glyph's own rects, in its own 24-unit space, are not boxes of the figure",
  verdictFor(`<rect class="dl-plate" x="20" y="20" width="200" height="80" rx="12"/><rect class="dl-tile" x="36" y="36" width="168" height="48" rx="10"/>${GLYPH}`) === "silent");
ok("[MKT.HOOKS.135] known-bad: the same inner rects as plain boxes are a child 4px from its container",
  verdictFor('<rect x="4" y="8" width="16" height="12"/><rect x="5" y="9" width="6" height="6"/>') === "deny");
ok("[MKT.HOOKS.135] a drawn character's short strokes are not connectors, nor near the frame",
  verdictFor(`${BOX}${PERSON(300, 120)}`) === "silent");
ok("[MKT.HOOKS.135] known-bad: a short line outside a character is still a connector",
  verdictFor(`${BOX}<path class="dl-wire" d="M260 120 L263 120"/>`) === "deny");
ok("[MKT.HOOKS.135] a wire that meets the top of a character lands on it",
  verdictFor(`${BOX}<path class="dl-wire" d="M100 88 L100 ${200 - 32 * 1.4}"/>${PERSON(100, 200)}`) === "silent");
ok("[MKT.HOOKS.135] known-bad: a wire that stops 40px short of the character ends in empty space",
  verdictFor(`${BOX}<path class="dl-wire" d="M100 88 L100 ${200 - 32 * 1.4 - 40}"/>${PERSON(100, 200)}`) === "deny");
ok("[MKT.HOOKS.135] a wire drawn on its own as a legend (data-dl-legend) may end in space",
  verdictFor('<g data-dl-legend><path class="dl-wire" d="M40 120 H136"/></g><text class="dl-detail" x="40" y="150">default</text>') === "silent");
ok("[MKT.HOOKS.135] known-bad: the same wire without the marker ends in empty space",
  verdictFor('<path class="dl-wire" d="M40 120 H136"/><text class="dl-detail" x="40" y="150">default</text>') === "deny");
ok("[MKT.HOOKS.135] a chip sits on the wire it names",
  verdictFor(`${BOX}<rect class="dl-tile" x="248" y="40" width="120" height="48" rx="10"/><path class="dl-wire" d="M160 64 H248"/><rect class="dl-chip" x="181" y="54" width="46" height="20" rx="10"/><text class="dl-chip-text" x="204" y="67.5" text-anchor="middle">N:1</text>`) === "silent");
ok("[MKT.HOOKS.135] known-bad: a plain label standing on a wire is refused",
  verdictFor(`${BOX}<rect class="dl-tile" x="248" y="40" width="120" height="48" rx="10"/><path class="dl-wire" d="M160 64 H248"/><text class="dl-wlabel" x="204" y="67.5" text-anchor="middle">N:1</text>`) === "deny");

console.log("=== a wire that runs through a tile it does not join");
{
  // The map that came back clean: What a plate holding Constructs, Behaviors and Capabilities, and the wire from Behaviors to How
  // running straight down through Capabilities.
  const MAP = dl('<rect class="dl-plate" x="16" y="16" width="368" height="140" rx="12"/>' +
    '<rect class="dl-tile" x="32" y="40" width="160" height="48" rx="10"/><rect class="dl-tile" x="208" y="40" width="160" height="48" rx="10"/>' +
    '<rect class="dl-tile" x="208" y="92" width="160" height="48" rx="10"/><rect class="dl-tile" x="208" y="184" width="160" height="48" rx="10"/>' +
    '<path class="dl-wire" d="M288 88 L288 184"/>');
  const said = checkFigureSpacing(page(MAP))?.deny ?? "";
  ok("[MKT.HOOKS.525] red: the wire through the tile it does not join is named as running through it", /runs through a box it does not join/.test(said), said);
  ok("[MKT.HOOKS.525] red: the finding names the tile it crosses", said.includes("208,92"), said);
  const ROUND = MAP.replace('<path class="dl-wire" d="M288 88 L288 184"/>',
    '<path class="dl-wire" d="M368 64 L376 64 Q392 64 392 80 L392 200 Q392 208 384 208 L368 208"/>');
  ok("[MKT.HOOKS.525] green: a wire that lands on a tile's side and leaves by its own corridor is not a crossing",
    !/runs through a box/.test(checkFigureSpacing(page(ROUND))?.deny ?? ""), checkFigureSpacing(page(ROUND))?.deny);
  ok("[MKT.HOOKS.525] green: a wire into a box inside a plate crosses the plate's wall, which is not a crossing",
    !/runs through a box/.test(checkFigureSpacing(page(dl('<rect class="dl-plate" x="16" y="100" width="368" height="120" rx="12"/>' +
      '<rect class="dl-tile" x="120" y="16" width="160" height="48" rx="10"/><rect class="dl-tile" x="120" y="140" width="160" height="48" rx="10"/>' +
      '<path class="dl-wire" d="M200 64 L200 140"/>')))?.deny ?? ""));
  ok("[MKT.HOOKS.525] green: a sample wire inside data-dl-legend, drawn over a sample tile, is the design language's subject",
    !/runs through a box/.test(checkFigureSpacing(page(dl('<g data-dl-legend><rect class="dl-tile" x="40" y="40" width="160" height="48" rx="10"/>' +
      '<path class="dl-wire" d="M20 64 L220 64"/></g>')))?.deny ?? ""));
}

console.log("=== a design-language sample is a mockup of the product, not a docs figure");
{
  const { checkFigures } = await import("../../../../src/scripts/lib/figures.ts");
  // A child 4px inside its container: a box-padding finding wherever it is measured.
  const MOCK = '<svg viewBox="0 0 200 100"><rect x="10" y="10" width="180" height="80"/><rect x="14" y="14" width="40" height="20"/></svg>';
  const sample = `<figure class="dl-fig"><style>.dl-fig{}</style><div class="hd-card">${MOCK}</div><figcaption>a card</figcaption></figure>`;
  ok("[MKT.HOOKS.135] known-bad: the mockup's svg on its own is measured, and its tight box is a finding", checkFigures(MOCK).length > 0,
    JSON.stringify(checkFigures(MOCK)));
  ok("[MKT.HOOKS.135] an svg inside `<figure class=\"dl-fig\">` is passed over, as a skeleton is", checkFigures(sample).length === 0,
    JSON.stringify(checkFigures(sample)));
  ok("[MKT.HOOKS.135] and a figure after the sample is still measured",
    checkFigures(`${sample}<figure class="dl-figure">${MOCK}</figure>`).length === checkFigures(MOCK).length);
}

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);

