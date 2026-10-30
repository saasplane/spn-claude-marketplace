// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The figures · § A connector is a claim
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// The `.dg` drawer. A figure's single source is its spec — a fenced ```dg block in the seat file —
// and this turns one into inline SVG. Nothing is drawn by eye: every box is measured from its own
// text, so a connector lands on an edge and a label fits by construction rather than by luck.
//
// The grid: canvas 1100 wide, margin 24, three type sizes and no fourth. The chapter says 760; the page
// renders a figure at the width of its column, about 1100, so a 760 canvas was scaled up by half and
// every box and label read big and dark beside the hand-drawn figures of the hub (N13, 2026-09-21).
// The chapter changes to 1100 in N13 step 1; this is the one measure from here on.

/**
 * THE FLOWCHART SHAPES, and each one carries its meaning (05-artifacts.md § The figures). A shape is
 * not decoration: a reader knows a decision from a step before reading either label, which is the
 * whole reason `FLOWCHART` is its own kind rather than a `MAP` with a diamond bolted on.
 */
export type Shape = "process" | "terminator" | "decision" | "io" | "predefined" | "store" | "connector"
  | "window" | "chevron" | "pipe" | "bucket";

/**
 * A RESOURCE OUTSIDE A SYSTEM'S BOUNDARY CARRIES THE SHAPE OF WHAT IT IS (05-artifacts.md § SYSTEM,
 * rule 4). Seven kinds, and each earns its place by being a different KIND of thing rather than a
 * different colour of the same thing — you read what a box is before you read its name.
 */
export type Resource = "client" | "way-in" | "queue" | "store" | "cache" | "bucket" | "service";
const RESOURCE: Record<Resource, { shape: Shape; soft?: boolean }> = {
  client: { shape: "window" },
  "way-in": { shape: "chevron" },
  queue: { shape: "pipe" },
  store: { shape: "store" },
  cache: { shape: "store", soft: true },   // a cylinder you can afford to lose
  bucket: { shape: "bucket" },
  service: { shape: "process" },
};
export type Box = { id: string; label: string; note?: string; em?: boolean; off?: boolean; warn?: boolean; in?: string; shape?: Shape };
export type Link = { from: string; to: string; label?: string; dashed?: boolean; card?: string };
/** One band of a SYSTEM's boundary: a named layer, and the boxes inside it. */
export type Layer = { name: string; boxes: Box[] };
export type Spec = {
  kind: string; boxes?: Box[]; links?: Link[]; caption?: string; title?: string;
  layers?: Layer[]; outside?: (Box & { as?: Resource })[]; frame?: SkeletonFrame; views?: SkeletonView[];
  /** A skeleton's layout: the views stand in it. Left out, a view is the inside of a page alone. */
  layout?: SkeletonLayout;
};

/**
 * THE LAYOUT A SKETCH STANDS IN, in the words of `DSLayoutType` and of the three parts' looks (05-artifacts.md
 * § `SKELETON`, RULE.DEVEX.WORKSPACE.260). It is the sketch's setting and never part of an app pattern: a pattern
 * fills the content of any layout and names none of its own.
 */
export type SkeletonLayout = {
  /** `DSLayoutType`. `CANVAS` draws the body alone. */
  type: "RAIL" | "DOCK" | "TOPNAV" | "CANVAS";
  /** `IDSLayoutBodyLook.width`: the box the navigation and the content stand in, `FULL` where it is left out. */
  body?: { width?: "FULL" | "XWIDE" | "WIDE" | "MEDIUM" | "NARROW"; maxWidth?: unknown; className?: unknown };
  /** `IDSLayoutNavigationLook.attached`, true where it is left out; the words of its entries as `nav`, and the open one
   *  as `chosen`, by its word: the entry that leads to the page the sketch shows. */
  navigation?: { attached?: boolean; sticky?: unknown; className?: unknown; nav?: string[]; chosen?: string;
    /** On a `RAIL` only: a figure about the rail itself draws it open at a desktop. Left out, the rail stands shut to its icons on every device. */
    open?: boolean };
  /** `IDSLayoutContentLook.attached`, true where it is left out. */
  content?: { attached?: boolean; bordered?: unknown; raised?: unknown; className?: unknown };
};

/** THE PAGE LEVEL: the head of the page. Its item holds the title, the description, a picture and facts; its
 *  actions stand at the end; `back` is the way back at the start of the title's line. */
export type SkeletonPage = { item: NonNullable<SkeletonItem["item"]>; actions?: SkeletonItem[]; back?: boolean };

/** A picture in the shape of the design system's `IDSItemMedia`: its kind as `mtype`, and the field that kind draws from. An
 *  item line takes `ICON`, a bare icon named in `node`, and `MARK`, a mark holding `icon`; a feature's head takes `MARK` and
 *  `AVATAR`, whose `title` gives its initials. Each shape is one the drawer draws itself. */
export type SkeletonMedia = { mtype: "ICON" | "MARK" | "AVATAR"; node?: string; icon?: string; title?: string };

/**
 * SKELETON — where the parts of a screen or a block sit, and nothing about how they look
 * (05-artifacts.md § `SKELETON`). An item is plain words, a control, an icon, a slot, a stand-in, a
 * note in muted text, or a frame of its own: a region, such as a navigation beside a main area.
 * A spec holds one `frame`, or `views`: one screen at several screen classes.
 */
export type SkeletonItem = {
  /** Plain words — a title. With `control` it is the control's sample value; with `icon`, the word beside it. */
  text?: string; note?: string; fill?: boolean;
  frame?: SkeletonFrame;
  /** A named place that holds content: a dotted boundary and its name. */
  tag?: string;
  /** A slot that accepts any node: one block whose only content is its name. */
  slot?: string;
  /** A control at the size of its component, on one line. `main` tells the main action by weight, never by colour. */
  control?: "button" | "field" | "select" | "checkbox" | "switch" | "tabs" | "badge" | "pager"; main?: boolean;
  /** A switch's sample value: its knob stands at the end of the track when it is on, and at the start when it is off.
   *  On an icon it makes the icon a mark, and `on: false` draws the default mark empty: a thing that is there
   *  to be set up, and is not yet. */
  on?: boolean;
  /** On a table stand-in: its lines reach the outline of the container it is the content of. */
  flush?: boolean;
  /** Set by the drawer and never written in a spec: where the edge above a flush table is, and whether the table stands
   *  in a part that is a unit, whose boundary its lines reach. */
  edgeTop?: number; inPart?: boolean;
  /** Set by the drawer and never written in a spec: this row of tabs stands at the page level, in the root frame's rows
   *  or in the page head's actions, and is drawn as pills. Tabs inside a container, a card or a widget keep the line. */
  atPage?: boolean;
  /** An icon that is a mark and not an action: it stands for a thing or a person, and is drawn in a circle.
   *  `mark: false` with `on` keeps the icon an action, a tile, and `on: true` puts a small check at its corner. */
  mark?: boolean;
  /** The words of a row of tabs, and the place of the chosen one, counted from 0. */
  tabs?: string[]; chosen?: number;
  /** On a row of tabs, `DSTabsType`: `PILL` draws the pills and `LINE` the line wherever the row stands. Left out, the level picks:
   *  pills at the page level, the line inside a container, a card, a widget or a feature. */
  type?: "LINE" | "PILL";
  /** One of the small set of plain line shapes the drawer draws, centred in a square the height of a control. At the end of an
   *  item line, `ARROW_RIGHT` and `ARROW_UP_RIGHT` are its end arrows, in `DSIconType`'s names, drawn bare. */
  icon?: "close" | "add" | "menu" | "search" | "more" | "previous" | "next" | "select" | "checkbox" | "bell" | "person" | "default" | "ARROW_RIGHT" | "ARROW_UP_RIGHT";
  /** What bars stand in for; `lines` counts them, and the indexes in `headings` are shorter, taller heading bars.
   *  A `table` shows sample values in place of bars: `columns` are the words of its head row, and `cells` a few rows.
   *  A cell is a word, or an item that is plain words, a note, an icon or a control. A column with an empty head
   *  holds the actions of a row, and stands at the end. */
  standin?: "rows" | "cards" | "field" | "list" | "table"; lines?: number; headings?: number[];
  columns?: string[]; cells?: (string | SkeletonItem)[][];
  /** On a `field` stand-in: the field of a form with its own words. `label` is its title, `info` puts the mark of
   *  its help at the end of the title's line, `text` is the sample value in its control, and `control: "select"`
   *  draws that control as a select. Under the control stands one line, its `error` or else its `description`,
   *  and the room of that line is kept where a field has neither. */
  label?: string; info?: boolean; description?: string; error?: string;
  /** On a `field` stand-in with a `label`: the field is read and not entered, as the library's data unit shows it.
   *  Its value stands under its title with no box, as plain words, or as a badge with `control: "badge"`. */
  read?: boolean;
  /** A line in the style of the library's item: a `media`, the name of an icon; a `title`; a `description` under it;
   *  `meta`, several facts on the line under the title, each a word or a badge; and `end`, what stands at the end
   *  of the line. `inline` marks a compact line at the level INLINE: with facts and no description, its facts stand on
   *  the title's line after a dot ("v3 · Draft"). `media` given as the name of an icon is a mark; given in `IDSItemMedia`'s
   *  shape it is a bare icon (`ICON`) or a mark (`MARK`). `factsPlacement` `AFTER_TITLE` stands the facts under the title,
   *  over the description, and `selected` marks the chosen line of a feature's boxed items. */
  item?: { media?: string | SkeletonMedia; title: string; description?: string; meta?: (string | SkeletonItem)[]; end?: SkeletonItem[]; inline?: boolean;
    factsPlacement?: "AFTER_DESCRIPTION" | "AFTER_TITLE"; selected?: boolean };
  /** A feature's head, in the names of `IDSFeatureProps`: its `pageLevel`, which sizes it, `CONTAINER` where it is left out;
   *  the `eyebrow`, the words over the title, or a badge there; the `title`; the `description` under it; `facts`, each a word
   *  or a badge, on one line under the description; `textAlign`, `START` where it is left out; and `media`, a `MARK` or an
   *  `AVATAR` over its words. It is one block as tall as its lines. */
  head?: { pageLevel?: "PAGE" | "CONTAINER" | "WIDGET"; eyebrow?: string | SkeletonItem; title: string; description?: string; facts?: SkeletonItem[]; textAlign?: "START" | "CENTER";
    media?: SkeletonMedia };
  /** Free room that pushes the items after it to the end of the row. */
  spacer?: boolean;
  /** A region standing taller than what it holds, in rows. */
  height?: number;
  /** Set by the drawer and never written in a spec: this word is the title of a part of the content, this item is
   *  the header of a page drawn with no page level, or this item is the page level's own. */
  part?: boolean; page?: boolean;
};
/** A row runs left to right. `label` names the place, in a column every row of the frame shares;
 *  `framed` puts the row's items inside one box, as an example sits in its frame. */
/** `chosen`, in a container: this row is the chosen line of a list, and a band is drawn behind it. */
/** `marked`: the row has no border, and a dotted line is drawn around it to show how far it reaches. */
export type SkeletonRow = { label?: string; framed?: boolean; chosen?: boolean; marked?: boolean; items: SkeletonItem[];
  /** Set by the drawer and never written in a spec: the unit of the part of the content this row stands in, and
   *  whether it is that part's first row, under which its name stands. */
  within?: string; lead?: boolean };
/** A frame is a box, with an optional title (`label`) and `note`, holding rows top to bottom. A
 *  frame nested in a row may carry `width` — a fraction of the row, or absent for what is left. Its `look` is
 *  `raised` (a surface), `bordered` (a solid line) or `flat` (neither), and `fill` takes the height left in its column.
 *
 *  A CONTAINER is a frame with `frames`: its rows each hold one part, the parts stand with no gap, and `frames`
 *  names the parts that share a frame. Parts next to each other that are named share one frame; a part not
 *  named is flat. The frame is `raised` (one surface behind its parts), `bordered` (one solid outline and a solid
 *  line between its parts), or both, and `rounded` or square. `size` is a size step, `XS` to `XL`, that every
 *  control inside reads its height from; the default is `SM`. A `DSFeature` is no such container: its `frames`
 *  names the parts of its own frame, `TEXT` and `MEDIA`. */
export type SkeletonFrame = {
  label?: string; note?: string; width?: string; rows: SkeletonRow[]; look?: "raised" | "bordered" | "flat" | "card" | "container"; tag?: string; height?: number; fill?: boolean;
  /** The design system's unit this frame is. Its name gives its level: a container, a widget, a card, or a component. */
  unit?: string;
  /** Set by the drawer and never written in a spec: the page level stands above this frame, so no item in it is the page's header. */
  headed?: boolean;
  frames?: string[]; raised?: boolean; bordered?: boolean; rounded?: boolean;
  size?: "XS" | "SM" | "MD" | "LG" | "XL";
  /** Set by the drawer and never written in a spec: this word is the title of a part of the content, or this
   *  item is the header of the page. */
  part?: boolean;
  /** With a `look` of `container`: what stands at the end of its header, the rows of its footer, and its content
   *  as several parts, each with a title of its own, its actions at the end of that title, and its rows. */
  actions?: SkeletonItem[]; footer?: SkeletonRow[];
  sections?: SkeletonSection[];
  /** With a `look` of `container`: a line across the outline between each two of its rows, as a list has. A part takes it too. */
  divided?: boolean;
  /** Never on a frame: a container's header stands inside its outline, so only a row with no border takes `marked`.
   *  Read only to name it as a finding. */
  marked?: boolean;
  /** With a `look` of `card`: a mark before its title, one of the drawer's shapes, for the kind of thing the card is about. */
  media?: string;
  /** On a `DSSectionContainer`, in its own names: `color`, the section's fill, `BASE` where it is left out; `strength`, how strong
   *  a `DEFAULT` or a `PRIMARY` fill is; and `inset`, an inner shadow along its top and bottom edges. Its `size` also stands its
   *  room above and below. */
  color?: "BASE" | "DEFAULT" | "PRIMARY"; strength?: "SUBTLE" | "QUIET" | "SOLID"; inset?: boolean;
  /** On a `DSFeature`, in its own names: `items.surface` puts each of its item lines in a frame of its own. With `frames`, which on
   *  a `DSFeature` names its parts `TEXT` and `MEDIA`, `surface` is what the feature's own frame draws. `items.type` and
   *  `items.borderType` draw the lines between its items, and `items.numbered` a number before each item's title. `items.type`
   *  `STATS` draws each item line as a statistic: its title the value, large, and its description the label under it. */
  items?: { surface?: SkeletonFrame["surface"]; type?: "GRID" | "LIST" | "STATS"; borderType?: "NONE" | "GRID" | "EDGE"; numbered?: boolean };
  surface?: { color?: "BASE" | "DEFAULT" | "PRIMARY"; strength?: "SUBTLE" | "QUIET" | "SOLID"; raised?: boolean; elevation?: "XS" | "SM" | "MD" | "LG" | "XL"; bordered?: boolean; rounded?: boolean };
  /** On a `DSFeature`: where the two sides of its split stand against each other, each at its own height. Left out, every part
   *  stretches to its row. */
  verticalAlign?: "TOP" | "CENTER" | "BOTTOM";
  /** On a `DSFeature`, `DSFeatureType` `BACKDROP`: its media, a slot in a row of its own, stands behind its words and its actions,
   *  and they keep to three fifths of its width on a tablet and a desktop. The other types are drawn by where its rows place the media. */
  type?: "BACKDROP";
  /** On a `DSFeatureGridSectionContainer`, in its own names: `section`, the section it draws, with a `DSSectionContainer`'s fill and
   *  room; `grid.borderType`, the lines between its cells; and `grid.desktop`, `grid.tablet` and `grid.mobile`, the columns at each
   *  screen class, which a view reads for its own. */
  section?: { color?: "BASE" | "DEFAULT" | "PRIMARY"; strength?: "SUBTLE" | "QUIET" | "SOLID"; inset?: boolean; size?: "XS" | "SM" | "MD" | "LG" | "XL" };
  grid?: { borderType?: "NONE" | "GRID" | "EDGE"; desktop?: number; tablet?: number; mobile?: number };
  /** On a `DSAccordionGroup`, in `IDSAccordionGroupOption`'s names: its entries, each a `header`, the `content` an open entry shows
   *  under it, and `expanded`, whether it is open. With `bordered` each entry stands in an outline of its own. */
  options?: SkeletonAccordionOption[];
};
/** One entry of a `DSAccordionGroup`: the words of its header, the words its open body shows, and whether it is open. */
export type SkeletonAccordionOption = { header: string; content?: string; expanded?: boolean };
/** A section of the content of a container or a card: its title, the actions at the end of that title, its rows, and
 *  the unit of the design system it is, whose name stands at its corner. A section with a title and no unit is a group,
 *  the level `GROUP` of the design system: a dotted boundary round it, *Group* at its corner.
 *
 *  `part: true` makes the section a content part of a container (`DSPanelContainer.Content`) and not a group: it takes no
 *  dotted boundary and no corner word, only its title with its actions, and a line across the container's box above it
 *  where it is not the first part. Its own `sections` are the groups that stand inside it, each with its dotted boundary.
 *  A container's content is parts separated by lines, or groups, or both: parts by lines, groups inside a part. */
export type SkeletonSection = { label?: string; actions?: SkeletonItem[]; rows: SkeletonRow[]; divided?: boolean; unit?: string;
  part?: boolean; sections?: SkeletonSection[] };
/** One screen at one screen class, and in one task state where it shows one: a whole frame of its own, never derived
 *  from another view. A spec holds `views` in place of `frame`, and the views are drawn in one figure. `page` is the
 *  view's page level. */
export type SkeletonView = { viewport: "DESKTOP" | "TABLET" | "MOBILE"; state?: string; page?: SkeletonPage; frame: SkeletonFrame };

/** The measure the figure check uses, at the drawn scale. */
const W_LABEL = 7, W_NOTE = 6.4, W_TITLE = 7.6;
// One pair of numbers, both axes: 24 where nothing connects two boxes, 56 where a connector does.
// Padding is one number, 16, for a leaf and a container alike (05-artifacts.md § The grid).
const PAD_X = 16, GAP_Y = 24, GAP_COL = 56, GAP_LINKED = 56;
// A box edge carries three connection points at most; a fourth link leaves by another side.
// A side offers three points at most — its middle and the middle of each half.
const SIDE_POINTS = 3, GAP_APART = 24;
// A connector's label and the connector itself. Every figure puts this much clear space between a
// label's line and any arrow — its own or a neighbour's — so no drawer invents its own offset and
// no reader has to work out which run a word belongs to.
const LABEL_H = 12, LABEL_GAP = 8;
const H_ONE = 44, H_TWO = 64;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// A LABEL IS SPOKEN, NOT RENDERED. A caption may carry the page's own markdown — a code span for a
// contract term, emphasis on one word — and the `<figcaption>` renders it as markup. The `aria-label`
// is read aloud instead, so the same sentence reaching it verbatim makes a screen reader announce the
// backtick characters themselves. Found by a step 2 agent on the one caption that spells a contract
// term as a code span (N14, 2026-09-22). The markers are the four `render.ts` renders inline.
const spoken = (s: string) => s
  .replace(/`([^`]+)`/g, "$1")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  .replace(/\*\*([^*]+)\*\*/g, "$1")
  .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1$2");

/**
 * A FIGURE'S viewBox HUGS ITS CONTENT, so a drawing is as wide as the paragraph above it. Every
 * drawer lays out inside a 1100 canvas and centres its rows in it, which is right for placing things
 * and wrong for shipping them: a four-box flowchart 250px wide arrived inside a 1156 canvas and
 * rendered as a small picture marooned in white space. The developer saw it on the blocks page —
 * *let each type of blocks take full width* — and the hand-authored figures were fitted then; the
 * drawer never was, so every figure it produced still paid the inset the edge-to-edge rule forbids.
 *
 * Bleed is `2`, so a `1.5` stroke on an outer edge is not clipped, and `9` wherever a connector
 * reaches the boundary, so the check's own `8px` frame rule still holds. `<defs>` is excluded: the
 * arrowhead defined there has its own coordinate space starting at 0,0, and measuring it makes every
 * figure look as though it already began at the origin (N13, 2026-09-22).
 */
function fit(body: string[]): { x0: number; y0: number; w: number; h: number } {
  const src = body.filter((l) => !l.includes("<defs>")).join("\n");
  let lo: [number, number] = [Infinity, Infinity], hi: [number, number] = [-Infinity, -Infinity];
  const see = (x: number, y: number, pad = 0) => {
    lo = [Math.min(lo[0], x - pad), Math.min(lo[1], y - pad)];
    hi = [Math.max(hi[0], x + pad), Math.max(hi[1], y + pad)];
  };
  for (const m of src.matchAll(/<rect[^>]*\sx="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/g))
    { const [x, y, w, h] = m.slice(1).map(Number); see(x, y); see(x + w, y + h); }
  for (const m of src.matchAll(/<circle[^>]*\scx="(-?[\d.]+)" cy="(-?[\d.]+)" r="([\d.]+)"/g))
    { const [cx, cy, r] = m.slice(1).map(Number); see(cx, cy, r); }
  for (const m of src.matchAll(/<ellipse[^>]*\scx="(-?[\d.]+)" cy="(-?[\d.]+)" rx="([\d.]+)" ry="([\d.]+)"/g))
    { const [cx, cy, rx, ry] = m.slice(1).map(Number); see(cx - rx, cy - ry); see(cx + rx, cy + ry); }
  // Text is measured from the same character widths the figure check measures it by, and a baseline
  // sits below its own line, so the box runs upward from `y`.
  for (const m of src.matchAll(/<text class="([\w-]+)" x="(-?[\d.]+)" y="(-?[\d.]+)"(?: style="[^"]*")?>([\s\S]*?)<\/text>/g)) {
    const cls = m[1], x = Number(m[2]), y = Number(m[3]);
    const w = m[4].replace(/&[a-z]+;/g, " ").length * (cls === "sds-title" ? W_TITLE : cls === "sds-label" ? W_LABEL : W_NOTE);
    see(x, y - 13); see(x + w, y + 3);
  }
  for (const m of src.matchAll(/<path[^>]*\sd="([^"]+)"/g)) {
    const conn = m[0].includes('class="sds-connector');
    let x = 0, y = 0;
    for (const [, c, u, v] of m[1].matchAll(/([MLHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g)) {
      const a = Number(u);
      x = c === "V" ? x : a;
      y = c === "V" ? a : c === "H" ? y : Number(v);
      see(x, y, conn ? 9 : 2);
    }
  }
  if (!Number.isFinite(lo[0])) return { x0: 0, y0: 0, w: 1100, h: 1 };
  const x0 = Math.floor(lo[0] - 2), y0 = Math.floor(lo[1] - 2);
  return { x0, y0, w: Math.ceil(hi[0] + 2) - x0, h: Math.ceil(hi[1] + 2) - y0 };
}

/** One masthead for every drawer: the marker it needs, and a viewBox that hugs what was drawn. */
function svgOf(body: string[], label: string, extraClass = ""): string {
  const { x0, y0, w, h } = fit(body);
  return [
    // A FIGURE IS NEVER SCALED UP. The page sets `width:100%` so a wide figure shrinks to the column,
    // and that same rule stretched a NARROW one: a flowchart 586 across was blown up to the column's
    // 1100, so its text rendered at twice the size of the figure above it and the drawing stood
    // 1650px tall. The cap is the figure's own width, inline so it beats the stylesheet, and
    // `width:100%` still shrinks it on a narrow screen (2026-09-22, found on the Sign-in sample).
    `<svg class="sds-drawing${extraClass ? " " + extraClass : ""}" viewBox="${x0} ${y0} ${w} ${h}" style="max-width:${w}px" role="img" aria-label="${esc(spoken(label))}">`,
    // THE ARROWHEAD ONLY WHERE AN ARROW USES IT. A figure with no connector — every skeleton — carried
    // a marker it never drew, and six of them on one page repeated the id `ar` six times.
    ...(body.some((l) => l.includes("marker-end")) ? [`  <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>`] : []),
    ...body,
    `</svg>`,
  ].join("\n");
}

type Vert = { x: number; y1: number; y2: number; path?: number };
type Blocker = { x: number; y: number; w: number; h: number; path?: number };
// A LABEL IS NEVER BLOCKED BY ITS OWN CONNECTOR. Once runs became blockers the placer started
// pushing each label away from the very line it names — a system diagram's labels sit a standard
// gap above their own horizontal leg, which is exactly where they belong. Each run carries the
// path it came from and each label the path it names, and the placer skips the match.
type Pending = { x: number; y: number; w: number; txt: string; path?: number };

/** Every vertical run in a path, so a label can be kept off all of them and not merely off its own. */
function vertsOf(d: string, path?: number): Vert[] {
  const out: Vert[] = [];
  let x = 0, y = 0;
  for (const [, c, u, v] of d.matchAll(/([MHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g)) {
    const a = Number(u);
    const nx = c === "V" ? x : a, ny = c === "V" ? a : c === "M" ? Number(v) : y;
    if (c === "V") out.push({ x, y1: y, y2: ny, path });
    x = nx; y = ny;
  }
  return out;
}

/**
 * Every HORIZONTAL run in a path, shaped as a zero-height blocker.
 *
 * `placeLabels` already keeps a label clear of every box and every vertical run, and a horizontal
 * run was the third thing on the canvas that nothing told it about. Giving a label a second axis
 * to move on made that gap visible immediately: a label stepped to a free band and landed 1px from
 * the horizontal leg of another connector. A run with no height blocks exactly the way a flat box
 * would, so the placer needs no new rule — only the shape it already knows.
 */
function horzOf(d: string, path?: number): Blocker[] {
  const out: Blocker[] = [];
  let x = 0, y = 0;
  for (const [, c, u, v] of d.matchAll(/([MHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g)) {
    const a = Number(u);
    const nx = c === "V" ? x : a, ny = c === "V" ? a : c === "M" ? Number(v) : y;
    if (c === "H") out.push({ x: Math.min(x, nx), y: y, w: Math.abs(nx - x), h: 0, path });
    x = nx; y = ny;
  }
  return out;
}

/**
 * WHERE A LABEL FINALLY SITS is decided once every line is drawn, because the connector that crosses
 * a label is rarely the one it names — it belongs to a third link passing through the same gap, which
 * no drawer can see while it is placing its own text. Each label slides along its own line to the
 * nearest stretch no vertical run crosses, keeping the clear air the contract owes. A label with
 * nowhere clear to go stays where it was put, and the figure check reports it rather than this
 * quietly stacking it somewhere worse.
 */
function placeLabels(pending: Pending[], verticals: Vert[], margin: number, width: number,
                     boxes: Blocker[] = []): string[] {
  // AND A LABEL ALREADY PLACED BLOCKS THE ONE AFTER IT. The pass slid each label clear of the lines
  // and the boxes and then dropped it on its neighbour, because it kept no memory of where it had
  // just put one — two labels in the same band, 70px of overlap, and each of them individually
  // correct. This is the same rule the figure check applies when it says two words that close read
  // as one phrase; the placer now applies it while it still has somewhere else to go.
  const settled: { x: number; y: number; w: number }[] = [];
  // A BAND IS THE SECOND AXIS, and the pass used to have only the first. It slid a label sideways
  // along its own line and, where every x was taken, left it sitting on a connector and let the
  // figure check report it — eleven findings on one six-box map, each of them a label with nowhere
  // horizontal to go and a perfectly empty band a few pixels above. A label may now step to the
  // next band up or down, two at most, so it stays beside the line it names; the pitch is the one
  // the contract already uses everywhere else. Horizontal is still tried first at every band,
  // because sliding along the line reads better than floating away from it.
  const PITCH = LABEL_H + LABEL_GAP;
  const bands = [0, -PITCH, PITCH, -2 * PITCH, 2 * PITCH, -3 * PITCH, 3 * PITCH];
  return pending.map((p) => {
    // A BOX IS AS BLOCKING AS A CONNECTOR, and this pass only knew about connectors. Sliding a label
    // clear of two vertical runs pushed it OUT of the column gap and onto the box it named: the
    // sliding rule solved the problem it was given and created a worse one nobody had told it about.
    // A box overlapping the label's own band blocks its whole width plus the clear air it is owed.
    const blockedAt = (y: number): [number, number][] => {
      // THE SAME RECTANGLE THE CHECK MEASURES, to the pixel. The placer used to model the label as
      // `y - LABEL_H` to `y + 2`, two pixels taller at the bottom than the check's `y - lh` to `y`,
      // and those two pixels were the whole bug: a label sitting the contract's exact gap above its
      // own connector read as blocked, so the placer moved it — off a position that was already
      // correct and onto one that was not. A label owes clear air to every arrow, its own included,
      // so nothing here is excluded for belonging to the label. It simply has to measure what the
      // gate measures.
      const top = y - LABEL_H, bottom = y;
      return [
        ...verticals
          .filter((v) => Math.min(v.y1, v.y2) < bottom + LABEL_GAP && Math.max(v.y1, v.y2) > top - LABEL_GAP)
          .map((v) => [v.x - LABEL_GAP, v.x + LABEL_GAP] as [number, number]),
        ...boxes
          .filter((b) => b.y < bottom + LABEL_GAP && b.y + b.h > top - LABEL_GAP)
          .map((b) => [b.x - LABEL_GAP, b.x + b.w + LABEL_GAP] as [number, number]),
        ...settled
          .filter((q) => Math.abs(q.y - y) < PITCH)
          .map((q) => [q.x - LABEL_GAP, q.x + q.w + LABEL_GAP] as [number, number]),
      ];
    };
    let best: { x: number; y: number } | null = null;
    for (const dy of bands) {
      const y = p.y + dy;
      const blocked = blockedAt(y);
      const free = (x: number) => x >= margin && x + p.w <= width - margin
        && !blocked.some(([lo, hi]) => lo < x + p.w && x < hi);
      if (free(p.x)) { best = { x: p.x, y: y }; break; }
      const tries = [...blocked.flatMap(([lo, hi]) => [hi, lo - p.w]), margin, width - margin - p.w]
        .filter(free)
        .sort((m, n) => Math.abs(m - p.x) - Math.abs(n - p.x));
      if (tries.length) { best = { x: tries[0], y: y }; break; }
    }
    // NOWHERE CLEAR ANYWHERE still leaves it where it was put, and the check still reports it.
    // A placer that invents room it does not have hides the crowding instead of fixing it.
    const at = best ?? { x: p.x, y: p.y };
    settled.push({ x: at.x, y: at.y, w: p.w });
    return `  <text class="sds-note" x="${Math.round(at.x)}" y="${Math.round(at.y)}">${esc(p.txt)}</text>`;
  });
}

/**
 * THE POINTS A SIDE OFFERS, and HOW MANY CONNECTORS ASK FOR THEM decides which: one connector takes
 * the middle, two take the middle of each half, three take all three. That order matters — a side is
 * not a fixed set of slots a lone arrow has to pick from, or a single connector lands off-centre and
 * dog-legs to reach a box it was pointing straight at (developer, 2026-09-21).
 *
 * A short side offers fewer, because two points closer than the contract's gap read as one. Among the
 * points on offer a connector takes whichever lines up best with the box at its other end, and two
 * connectors may well take the same one: forcing every arrow onto a point of its own bends lines that
 * had no reason to bend, and alignment is what a reader follows.
 */
function sidePoints(start: number, len: number, asking: number): number[] {
  const at = (f: number) => Math.round(start + len * f);
  const halves = [at(0.25), at(0.75)], all = [at(0.25), at(0.5), at(0.75)];
  const want = Math.min(Math.max(asking, 1), SIDE_POINTS);
  if (want === 1) return [at(0.5)];
  if (want === 2) return len / 2 >= GAP_APART ? halves : [at(0.5)];
  if (len / (SIDE_POINTS + 1) >= GAP_APART) return all;
  return len / 2 >= GAP_APART ? halves : [at(0.5)];
}
const alignedTo = (points: number[], towards: number): number =>
  points.reduce((best, p) => (Math.abs(p - towards) < Math.abs(best - towards) ? p : best), points[0]);

function boxWidth(b: Box): number {
  const label = b.label.length * W_LABEL;
  const note = (b.note ?? "").length * W_NOTE;
  return Math.ceil(Math.max(label, note) + PAD_X * 2);
}
const boxHeight = (b: Box) => (b.note ? H_TWO : H_ONE);

/** The classes of a box: the spec's `em` is the blue tone, `warn` the amber one, and `off` a box that is absent. */
function boxClass(b: Box): string {
  if (b.em) return "sds-box sds-tone-blue";
  if (b.warn) return "sds-box sds-tone-amber";
  if (b.off) return "sds-box sds-absent";
  return "sds-box";
}

function rect(b: Box, x: number, y: number, w: number, h: number): string {
  const cy = b.note ? y + 26 : y + h / 2 + 4;
  const out = [`  <rect class="${boxClass(b)}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`,
               `  <text class="sds-label" x="${x + PAD_X}" y="${cy}">${esc(b.label)}</text>`];
  if (b.note) out.push(`  <text class="sds-note" x="${x + PAD_X}" y="${cy + 19}">${esc(b.note)}</text>`);
  return out.join("\n");
}

/**
 * ENTITIES — the construct is data. Three columns, and the direction of a link decides the column:
 * what points at the centre sits left, the centre sits in the middle, what it points at sits right.
 * Every connector then runs one way along the horizontal axis and lands on two vertical edges, so
 * none of them crosses a label and no return lane is needed.
 */
function drawEntities(spec: Spec): { svg: string; findings: string[] } {
  const findings: string[] = [];
  const boxes = spec.boxes ?? [];
  const links = spec.links ?? [];
  if (!boxes.length) return { svg: "", findings: ["a `dg` figure with no boxes"] };

  const centre = boxes.find((b) => b.em) ?? boxes[0];
  if (!boxes.some((b) => b.em)) findings.push(`no box is marked \`em\`, so \`${centre.id}\` was taken as the centre`);

  const targets = links.filter((l) => l.from === centre.id).map((l) => l.to);
  const sources = links.filter((l) => l.to === centre.id).map((l) => l.from);
  const byId = new Map(boxes.map((b) => [b.id, b]));
  for (const l of links) for (const end of [l.from, l.to])
    if (!byId.has(end)) findings.push(`a link names \`${end}\`, and no box has that id`);

  const left = [...new Set(sources)].map((id) => byId.get(id)!).filter(Boolean);
  const right = [...new Set(targets)].map((id) => byId.get(id)!).filter(Boolean);
  const placed = new Set([centre.id, ...left.map((b) => b.id), ...right.map((b) => b.id)]);
  for (const b of boxes) if (!placed.has(b.id)) { right.push(b); findings.push(`\`${b.id}\` is in no link, so it was placed beside the centre`); }

  const colWidth = (col: Box[]) => (col.length ? Math.max(...col.map(boxWidth)) : 0);
  const wL = colWidth(left), wC = boxWidth(centre), wR = colWidth(right);
  const colHeight = (col: Box[]) => col.reduce((h, b) => h + boxHeight(b) + GAP_Y, -GAP_Y);
  const hL = colHeight(left), hC = boxHeight(centre), hR = colHeight(right);

  const margin = 24;
  // A link's label rides in the column gap, so the gap is as wide as the widest label plus the clear
  // air it owes on both sides. Sized from GAP_COL alone, a label longer than 56px was hung above a
  // box instead and landed inside the next column (N13, 2026-09-21).
  // A RELATION'S TEXT IS ITS LABEL AND ITS CARDINALITY, as one phrase, computed ONCE. Sizing the
  // column gap from the label alone and then drawing the label plus its cardinality is two readings
  // of one thing, which is the shape of fault this arc keeps finding: the gap came out 80 wide for
  // text that needed 96, and three labels landed over boxes they did not belong to.
  const relationText = (l: Link) => l.label ? (l.card ? `${l.label}  ${l.card}` : l.label) : (l.card ?? "");
  const widestLabel = Math.max(0, ...links.map((l) => relationText(l).length * W_NOTE));
  // A COLUMN GAP HOLDS THE LABELS **AND** THE ELBOWS. Sized for the widest label alone, a gap two
  // relations cross has its own two vertical runs standing in the space the labels were measured
  // for — so each label is pushed off its centre, onto a box or onto its neighbour. The gap is wide
  // enough for the widest thing said across it plus a lane for every relation after the first.
  const crossings = Math.max(
    links.filter((l) => l.to === centre.id).length,
    links.filter((l) => l.from === centre.id).length, 1);
  const gapCol = Math.max(GAP_COL, Math.ceil(widestLabel) + LABEL_GAP * 2 + GAP_APART * (crossings - 1));
  const height = Math.max(hL, hC, hR) + margin * 2;
  const width = margin * 2 + wL + wC + wR + gapCol * 2;
  const xL = margin, xC = margin + wL + gapCol, xR = xC + wC + gapCol;

  const out: string[] = [];
  const at = new Map<string, { x: number; y: number; w: number; h: number }>();
  const layColumn = (col: Box[], x: number, w: number, total: number) => {
    let y = margin + (height - margin * 2 - total) / 2;
    for (const b of col) {
      const h = boxHeight(b);
      out.push(rect(b, x, y, w, h));
      at.set(b.id, { x, y, w, h });
      y += h + GAP_Y;
    }
  };
  layColumn(left, xL, wL, hL);
  layColumn([centre], xC, wC, hC);
  layColumn(right, xR, wR, hR);

  // Two links crossing the same column gap would otherwise share one vertical x and one landing
  // point, so each would run straight through the other's label. Each gets a share of the gap and a
  // share of the edge it lands on, which is what keeps the labels readable (N13, 2026-09-21).
  const eVerts: Vert[] = [], ePending: Pending[] = [];
  const eHorz: Blocker[] = [];
  // Per box AND per side, because a box can be pointed at from the left and point on to the right,
  // and each of those sides answers the how-many question on its own.
  const leaves = new Map<string, number>(), lands = new Map<string, number>();
  for (const l of links) {
    const a = at.get(l.from), b = at.get(l.to);
    if (!a || !b) continue;
    const side = a.x < b.x ? "R" : "L";
    const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
    bump(leaves, `${l.from}:${side}`);
    bump(lands, `${l.to}:${side === "R" ? "L" : "R"}`);
  }
  const lane = new Map<Link, { i: number; n: number }>();
  for (const l of links) {
    const peers = links.filter((p) => (at.get(p.from)?.x ?? -1) === (at.get(l.from)?.x ?? -2)
                                   && (at.get(p.to)?.x ?? -1) === (at.get(l.to)?.x ?? -2));
    lane.set(l, { i: peers.indexOf(l), n: peers.length });
  }

  for (const [pathId, l] of links.entries()) {
    const a = at.get(l.from), b = at.get(l.to);
    if (!a || !b) continue;
    const fromRight = a.x < b.x;
    const x1 = fromRight ? a.x + a.w : a.x;
    const x2 = fromRight ? b.x : b.x + b.w;
    const { i, n } = lane.get(l) ?? { i: 0, n: 1 };
    const y1 = alignedTo(sidePoints(a.y, a.h, leaves.get(`${l.from}:${fromRight ? "R" : "L"}`) ?? 0), b.y + b.h / 2);
    const y2 = alignedTo(sidePoints(b.y, b.h, lands.get(`${l.to}:${fromRight ? "L" : "R"}`) ?? 0), y1);
    const mid = x1 + ((x2 - x1) * (i + 1)) / (n + 1);
    const dash = l.dashed ? ' stroke-dasharray="5 4"' : "";
    const dPath = `M${x1} ${y1} H${mid} V${y2} H${x2}`;
    out.push(`  <path class="sds-connector" d="${dPath}"${dash} marker-end="url(#ar)"/>`);
    eVerts.push(...vertsOf(dPath, pathId)); eHorz.push(...horzOf(dPath, pathId));
    // EVERY RELATION LINE CARRIES ITS CARDINALITY, which is what the chapter asks of this kind and
    // what the drawer had no field for: an ER diagram whose lines say only *belongs to* leaves the
    // reader with the one question they opened it to answer — one, or many? It rides with the label
    // rather than sitting apart from it, because the two are read as one phrase.
    if (!l.card)
      findings.push(`the relation \`${l.from}\` → \`${l.to}\` carries no cardinality; every relation line in an entity diagram says one or many (\`card\`: "1:N")`);
    const text = relationText(l);
    if (text) {
      // THE LABEL SITS IN THE COLUMN GAP, on the connector's own vertical run — the one place in an
      // ER layout where no box can be. Hung above a box instead, it lands inside whichever column is
      // taller. Where the run is straight across it goes a standard gap above the line.
      const w = text.length * W_NOTE;
      // ON ITS OWN OUTBOUND LEG, not centred on the gap. Centring every label on the gap put them all
      // at one x, so with more than one relation crossing a gap each was pushed off by the other's
      // elbow — onto a box, or onto its neighbour. A link's own leg runs from its source to its own
      // elbow, at its own height, and that is a stretch no other relation in the gap occupies.
      const lead = Math.min(x1, mid), tail = Math.max(x1, mid);
      const want = (lead + tail - w) / 2;
      // Kept inside the gap, so a label never starts over the column it came from.
      const lo = Math.min(x1, x2) + LABEL_GAP, hi = Math.max(x1, x2) - LABEL_GAP;
      // A GAP HAS TWO BANDS, NOT ONE. Relations after the first in a gap alternate to the underside
      // of their own leg, which doubles the room without widening the figure — and a label under a
      // line reads as belonging to it exactly as one above it does.
      const under = i % 2 === 1;
      ePending.push({ x: Math.round(Math.min(Math.max(want, lo), Math.max(lo, hi - w))),
                      y: y1 + (under ? LABEL_H + LABEL_GAP : -LABEL_GAP), w, txt: text, path: pathId });
    }
  }

  out.push(...placeLabels(ePending, eVerts, margin, width, [...at.values(), ...eHorz]));

  return { svg: svgOf(out, spec.title ?? spec.caption ?? "entity diagram"), findings };
}

/** CHAIN — a FLOW read left to right: a box per step, an arrow means *then*. */
function drawChain(spec: Spec): { svg: string; findings: string[] } {
  const boxes = spec.boxes ?? [];
  if (!boxes.length) return { svg: "", findings: ["a `dg` figure with no boxes"] };
  // 56 is the connected gap: a 7 arrowhead and 49 of shaft. It was 22, which is the grid's
  // unconnected gap — the two rules contradicted each other and the chain followed the wrong one.
  const margin = 24, gap = 56;
  const h = Math.max(...boxes.map(boxHeight));
  const widths = boxes.map(boxWidth);
  const width = margin * 2 + widths.reduce((a, b) => a + b, 0) + gap * (boxes.length - 1);
  // A chain wider than the canvas is drawn by the map drawer as a one-way chain, which stands it
  // up as a vertical line. The neighbours are the links, since a chain declares none.
  if (width > 1100) {
    const links = boxes.slice(0, -1).map((b, i) => ({ from: b.id, to: boxes[i + 1].id }));
    return drawMap({ ...spec, kind: "map", links });
  }
  const height = margin * 2 + h;
  const out: string[] = [];
  let x = margin;
  boxes.forEach((b, i) => {
    out.push(rect(b, x, margin, widths[i], h));
    if (i < boxes.length - 1) out.push(`  <path class="sds-connector" d="M${x + widths[i]} ${margin + h / 2} H${x + widths[i] + gap}" marker-end="url(#ar)"/>`);
    x += widths[i] + gap;
  });
  return {
    svg: svgOf(out, spec.title ?? spec.caption ?? "chain"),
    findings: [],
  };
}

/**
 * MAP — the parts of one thing, and how they touch. The chapter's shape, exactly: **a box is a
 * group, an arrow is what flows, a nested box is containment.**
 *
 * Groups lay out in rows that wrap at the canvas width, so a map of three parts is one row and a
 * map of nine is three — the reader never scrolls sideways and no box is scaled down to fit. A box
 * naming another in `in` is drawn INSIDE it, and its parent grows to hold it rather than the child
 * being shrunk: containment is the claim, so the parent's size is derived from what it contains.
 *
 * Every connector leaves one edge and lands on another, which is the chapter's own test for a
 * figure being checkable rather than a matter of taste. Boxes sharing a row connect straight across;
 * boxes on different rows leave the bottom edge and enter the top, so no connector crosses a label.
 */
/** Wrap a note at a fixed width so a box is never wider than a third of the canvas. */
const NOTE_CHARS = 34;
function wrapNote(note: string): string[] {
  const words = note.split(/\s+/); const lines: string[] = []; let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > NOTE_CHARS) { lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}
const shapeOf = (b: Box): Shape => b.shape ?? "process";

// The lean on a parallelogram, the bars on a predefined process, the cap on a cylinder, and the
// radius of an on-page connector. Four numbers, each belonging to one shape and to nothing else.
const SKEW = 16, BARS = 11, CAP = 13, DOT = 17;
// A window's title bar, a chevron's point, and how far a bucket narrows towards its foot.
const BAR = 22, POINT = 40, TAPER = 12;

/**
 * TEXT IS CENTRED BY ARITHMETIC, NOT BY `text-anchor`. The figure check reads a `<text>` element's
 * `x` as the LEFT edge of the word and measures its box from there, so a centred label declared the
 * SVG way would be judged half a word to the right of where it actually sits — every clearance
 * around it wrong, and wrong in the direction that passes. So the drawer computes the left edge
 * itself from the same character width the check uses, and the two halves agree by construction.
 */
function centred(cls: "sds-label" | "sds-note", txt: string, cx: number, y: number): string {
  const w = txt.length * (cls === "sds-label" ? W_LABEL : W_NOTE);
  return `  <text class="${cls}" x="${Math.round(cx - w / 2)}" y="${y}">${esc(txt)}</text>`;
}

function mapBoxWidth(b: Box): number {
  const lines = b.note ? wrapNote(b.note) : [];
  const widest = Math.max(b.label.length * W_LABEL, ...lines.map((l) => l.length * W_NOTE));
  const base = Math.ceil(widest + PAD_X * 2);
  switch (shapeOf(b)) {
    // A DIAMOND HOLDS ONLY THE RECTANGLE INSCRIBED IN IT. A rectangle centred in a diamond of width
    // W and height H fits exactly when `tw/W + th/H <= 1`, so a flat allowance cannot be right at
    // any size — the wider the text, the more the corners take away. Doubling each side puts both
    // ratios at one half, which leaves the text's own corners inside the edge with its padding to
    // spare. Found by the developer on the Sign-in flowchart, where *The organization judges* sat
    // wider than the diamond at its own height and the note's last line fell outside it entirely
    // (2026-09-22).
    case "decision": return base * 2;
    case "io": return base + SKEW;
    case "predefined": return base + BARS * 2;
    case "terminator": return base + 12;
    case "connector": return DOT * 2;
    case "chevron": return base + POINT;
    case "pipe": return base + CAP;
    case "bucket": return base + TAPER * 2;
    default: return base;
  }
}
function mapBoxHeight(b: Box): number {
  const lines = b.note ? wrapNote(b.note).length : 0;
  const base = lines ? 26 + 19 * lines + 12 : H_ONE;
  switch (shapeOf(b)) {
    // The other half of the inscribed rule above: doubled, so the text's height uses half the
    // diamond and its width the other half.
    case "decision": return base * 2;
    // The cap sits INSIDE the box's own bounds rather than above them, so the grid's spacing keeps
    // every neighbour clear of it without the layout knowing a cylinder is there.
    case "store": return base + CAP;
    case "terminator": return Math.max(base, 40);
    case "connector": return DOT * 2;
    case "window": return base + BAR;
    default: return base;
  }
}

/**
 * A SHAPE IS DRAWN, AND ITS TEXT IS PLACED INSIDE IT. Everything but `process` centres its label,
 * because a leaning, pointed or round shape has no left edge a reader's eye can rest on.
 *
 * Only `<rect>` is a shape the figure check measures sides of, which is deliberate rather than a
 * gap: a connector lands on a diamond's vertex or a terminator's end, and the check reads those as
 * points on a closed path — it is the CENTRING rule that wants a rectangle, and a diamond has no
 * side to be off the middle of.
 */
function mapRect(b: Box, x: number, y: number, w: number, h: number): string {
  const cls = boxClass(b), cx = x + w / 2, cy = y + h / 2;
  const body: string[] = [];
  let textTop = y + 26, textMid = cy + 4, centre = true;

  switch (shapeOf(b)) {
    case "terminator":
      body.push(`  <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/>`);
      break;
    case "decision":
      body.push(`  <path class="${cls}" d="M${cx} ${y} L${x + w} ${cy} L${cx} ${y + h} L${x} ${cy} Z"/>`);
      // THE BLOCK IS CENTRED ON THE DIAMOND'S WAIST, not hung from its top. A diamond is at its
      // widest exactly at the middle, so text starting 26 below the top vertex begins where the
      // shape is still narrow — and once the height was doubled to fit the text at all, a
      // top-anchored block sat high and left the room it needed empty underneath it.
      textTop = cy - (19 * (b.note ? wrapNote(b.note).length : 0)) / 2 + 4;
      break;
    case "io":
      body.push(`  <path class="${cls}" d="M${x + SKEW} ${y} L${x + w} ${y} L${x + w - SKEW} ${y + h} L${x} ${y + h} Z"/>`);
      break;
    case "predefined":
      body.push(`  <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`,
                `  <path class="${cls}" d="M${x + BARS} ${y} V${y + h}"/>`,
                `  <path class="${cls}" d="M${x + w - BARS} ${y} V${y + h}"/>`);
      break;
    case "store":
      // Rect from the cap's waist down, cap centred on that waist: a connector lands on the rect,
      // which is a shape the check can measure, and the cap is the picture rather than the claim.
      body.push(`  <rect class="${cls}" x="${x}" y="${y + CAP}" width="${w}" height="${h - CAP}" rx="3"/>`,
                `  <ellipse class="${cls}" cx="${cx}" cy="${y + CAP}" rx="${w / 2}" ry="${CAP}"/>`);
      textTop = y + CAP + 26; textMid = y + CAP + (h - CAP) / 2 + 4;
      break;
    case "connector":
      body.push(`  <circle class="${cls}" cx="${cx}" cy="${cy}" r="${DOT}"/>`);
      break;
    case "window":
      // A client: a frame with a title bar. The bar is marked a curve so the figure check reads it
      // as part of the picture rather than as a connector starting and ending on nothing.
      body.push(`  <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`,
                `  <path class="sds-connector" data-role="curve" d="M${x} ${y + BAR} H${x + w}"/>`);
      textTop = y + BAR + 24; textMid = y + BAR + (h - BAR) / 2 + 4; centre = false;
      break;
    case "chevron":
      body.push(`  <path class="${cls}" d="M${x} ${y} H${x + w - POINT} L${x + w} ${cy} L${x + w - POINT} ${y + h} H${x} Z"/>`);
      centre = false;
      break;
    case "pipe":
      // A queue, lying on its side: the cap is at the end work enters, not on top.
      body.push(`  <rect class="${cls}" x="${x + CAP}" y="${y}" width="${w - CAP}" height="${h}" rx="3"/>`,
                `  <ellipse class="${cls}" cx="${x + CAP}" cy="${cy}" rx="${CAP}" ry="${h / 2}"/>`);
      textTop = y + 26; textMid = cy + 4; centre = false;
      break;
    case "bucket":
      body.push(`  <path class="${cls}" d="M${x} ${y} L${x + w} ${y} L${x + w - TAPER} ${y + h} L${x + TAPER} ${y + h} Z"/>`);
      centre = false;
      break;
    default:
      body.push(`  <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`);
      centre = false;
  }

  if (!b.note) {
    body.push(centre ? centred("sds-label",b.label, cx, textMid) : `  <text class="sds-label" x="${x + PAD_X}" y="${textMid}">${esc(b.label)}</text>`);
    return body.join("\n");
  }
  body.push(centre ? centred("sds-label",b.label, cx, textTop) : `  <text class="sds-label" x="${x + PAD_X}" y="${textTop}">${esc(b.label)}</text>`);
  wrapNote(b.note).forEach((line, i) => body.push(
    centre ? centred("sds-note",line, cx, textTop + 19 * (i + 1))
           : `  <text class="sds-note" x="${x + PAD_X}" y="${textTop + 19 + 19 * i}">${esc(line)}</text>`));
  return body.join("\n");
}

type Placed = { x: number; y: number; w: number; h: number; row: number };

/**
 * WHERE A CONNECTOR MEETS A SHAPE depends on the shape, which is the price of having shapes at all.
 * A rectangle's top is a flat run offering up to three points; a diamond's top is a single vertex; a
 * parallelogram's top is a flat run shifted by its own lean; a cylinder's top is the waist of its
 * cap. Get this wrong and the arrow lands in white space beside the shape it points at — which the
 * figure check reports as a connector starting nowhere, and which a reader sees immediately.
 */
function acrossPoints(b: Box, p: Placed, side: "top" | "bottom", asking: number): number[] {
  const cx = p.x + p.w / 2;
  switch (shapeOf(b)) {
    case "decision": case "connector": case "terminator": return [Math.round(cx)];
    case "io": return [Math.round(cx + (side === "top" ? SKEW / 2 : -SKEW / 2))];
    default: return sidePoints(p.x, p.w, asking);
  }
}
/** A cylinder's top edge is the waist its cap is centred on, because that is where its rect starts. */
const edgeY = (b: Box, p: Placed, side: "top" | "bottom") =>
  side === "bottom" ? p.y + p.h : shapeOf(b) === "store" ? p.y + CAP : p.y;
/** A shape's left and right, measured at its own middle, where a sideways connector meets it. */
function edgeX(b: Box, p: Placed, side: "left" | "right"): number {
  const cx = p.x + p.w / 2;
  switch (shapeOf(b)) {
    case "io": return side === "left" ? p.x + SKEW / 2 : p.x + p.w - SKEW / 2;
    case "connector": return side === "left" ? cx - DOT : cx + DOT;
    // A bucket narrows towards its foot, so at its own middle it is half a taper in on both sides.
    case "bucket": return side === "left" ? p.x + TAPER / 2 : p.x + p.w - TAPER / 2;
    // A pipe is entered at the tip of its cap, which is where work goes in.
    case "pipe": return side === "left" ? p.x : p.x + p.w;
    default: return side === "left" ? p.x : p.x + p.w;
  }
}
/** A cylinder's middle is the middle of its body, not of the box its cap is reserved in. */
const midY = (b: Box, p: Placed) => shapeOf(b) === "store" ? p.y + CAP + (p.h - CAP) / 2 : p.y + p.h / 2;

/**
 * MAP — groups and what flows between them. Boxes are laid in rows by dependency depth: a box
 * nothing points at sits in the first row, and a box sits one row below the deepest box that points
 * at it. So every link runs downward, a link to the next row is one elbow through the gap between
 * the rows, and a link that skips rows goes round the right edge rather than through a box. Labels
 * sit in the gaps, never on a box. Notes wrap at a fixed width, so a box is a third of the canvas
 * at most and a row holds up to three.
 *
 * Before this, boxes were laid in the order written and wrapped by width; a box with a long note
 * filled its own row, every box stacked in one column, and each connector ran straight through the
 * boxes between its ends with its label printed over them (N13's sample, 2026-09-21).
 */
function drawMap(spec: Spec, opts: { downward?: boolean } = {}): { svg: string; findings: string[] } {
  const label = opts.downward ? "flowchart" : "map";
  const findings: string[] = [];
  const all = spec.boxes ?? [];
  const links = spec.links ?? [];
  if (!all.length) return { svg: "", findings: ["a `dg` figure with no boxes"] };

  const byId = new Map(all.map((b) => [b.id, b]));
  for (const l of links) for (const end of [l.from, l.to])
    if (!byId.has(end)) findings.push(`a link names \`${end}\`, and no box has that id`);

  const kids = new Map<string, Box[]>();
  const top: Box[] = [];
  for (const b of all) {
    if (b.in === undefined) { top.push(b); continue; }
    if (!byId.has(b.in)) { findings.push(`\`${b.id}\` is nested in \`${b.in}\`, and no box has that id`); top.push(b); continue; }
    if (b.in === b.id) { findings.push(`\`${b.id}\` is nested in itself`); top.push(b); continue; }
    kids.set(b.in, [...(kids.get(b.in) ?? []), b]);
  }
  if (!top.length) { findings.push("every box is nested, so none could be placed"); return { svg: "", findings }; }

  // 16 inside a container, the same number a leaf pads its own label by — one padding, not two
  // (05-artifacts.md § The primitives). It was 12, so a nested box read as falling out of its parent.
  const HEAD = 34, PAD_IN = 16;
  const outerW = (b: Box): number => {
    const own = mapBoxWidth(b);
    const inner = (kids.get(b.id) ?? []).map(outerW);
    return inner.length ? Math.max(own, Math.max(...inner) + PAD_IN * 2) : own;
  };
  const outerH = (b: Box): number => {
    const inner = kids.get(b.id) ?? [];
    if (!inner.length) return mapBoxHeight(b);
    return HEAD + inner.reduce((h, c) => h + outerH(c) + 10, 0) + PAD_IN - 10 + PAD_IN;
  };

  // The row of a top-level box is its depth: one more than the deepest box that points at it. A
  // nested box counts through the group that holds it. A cycle is reported and its back edge ignored.
  const holder = (id: string): string => { const b = byId.get(id); return b && b.in !== undefined && byId.has(b.in) ? holder(b.in) : id; };
  const topIds = top.map((b) => b.id);
  const depth = new Map<string, number>(topIds.map((id) => [id, 0]));
  const edges = links.map((l) => [holder(l.from), holder(l.to)] as [string, string]).filter(([f, t]) => f !== t && depth.has(f) && depth.has(t));
  for (let pass = 0; pass < topIds.length + 1; pass++) {
    let moved = false;
    for (const [f, t] of edges) { const want = depth.get(f)! + 1; if (want > depth.get(t)!) { depth.set(t, want); moved = true; } }
    if (!moved) break;
    if (pass === topIds.length) { findings.push("the links form a cycle, so the rows could not be decided; a map flows one way"); break; }
  }

  const CANVAS = 1100, margin = 24, gapX = GAP_LINKED;

  // A ONE-WAY CHAIN IS A STRAIGHT LINE. When every box has at most one link in and one out and the
  // links form a single path through all of them, the figure is a flow, and a flow reads best as a
  // line: horizontal when it fits the canvas, vertical when it does not. Labels sit above a
  // horizontal link, beside a vertical one — never on a box. The developer's rule, 2026-09-21.
  if (!kids.size) {
    const inOf = new Map<string, number>(), outOf = new Map<string, number>();
    for (const [f, t] of edges) { outOf.set(f, (outOf.get(f) ?? 0) + 1); inOf.set(t, (inOf.get(t) ?? 0) + 1); }
    const heads = topIds.filter((id) => !(inOf.get(id) ?? 0));
    const simple = topIds.every((id) => (inOf.get(id) ?? 0) <= 1 && (outOf.get(id) ?? 0) <= 1);
    if (simple && heads.length === 1 && edges.length === topIds.length - 1 && topIds.length > 1) {
      // A FLOWCHART RUNS DOWN THE PAGE even when it is a straight line and would fit across one.
      // A map of three parts reads fine either way; a path does not, because a reader follows a
      // path downward and a decision's answers have to fall on either side of where it turns.
      const next = new Map(edges);
      const order: string[] = []; let cur: string | undefined = heads[0];
      while (cur && order.length <= topIds.length) { order.push(cur); cur = next.get(cur); }
      if (order.length === topIds.length) {
        const boxes = order.map((id) => byId.get(id)!);
        const linkOf = (a: string, b: string) => links.find((l) => holder(l.from) === a && holder(l.to) === b);
        const labelW = (i: number) => ((linkOf(order[i], order[i + 1])?.label ?? "").length * W_NOTE);
        const ws = boxes.map(mapBoxWidth), hs = boxes.map(mapBoxHeight);
        const gaps = boxes.slice(0, -1).map((_, i) => Math.max(gapX, labelW(i) + 16));
        const total = ws.reduce((s, w) => s + w, 0) + gaps.reduce((s, g) => s + g, 0);
        const out: string[] = [];
        let width = CANVAS, height = 0;
        if (total <= CANVAS - margin * 2 && !opts.downward) {
          const h = Math.max(...hs);
          let x = margin + Math.floor((CANVAS - margin * 2 - total) / 2);
          const y = margin;
          // A BOX IS CENTRED ON THE ROW'S MIDDLE, not hung from its top. The connector runs at the
          // tallest box's mid-height, so a shorter box left at the top took its only arrow off its
          // own centre — 7px on a row of one noted box and two plain ones, which is exactly the
          // fault the centring rule refuses. Centring is also what the developer asked for of every
          // figure: elements may be centred, and spacing is what must not vary.
          boxes.forEach((b, i) => {
            const by = y + (h - hs[i]) / 2;   // not rounded: a half-pixel here is the arrow off centre
            out.push(mapRect(b, x, by, ws[i], hs[i]));
            if (i < boxes.length - 1) {
              const l = linkOf(order[i], order[i + 1]);
              const x1 = x + ws[i], x2 = x1 + gaps[i], cy = y + h / 2;
              out.push(`  <path class="sds-connector" d="M${x1} ${cy} H${x2}"${l?.dashed ? ' stroke-dasharray="5 4"' : ""} marker-end="url(#ar)"/>`);
              if (l?.label) out.push(`  <text class="sds-note" x="${Math.round(x1 + (gaps[i] - labelW(i)) / 2)}" y="${cy - 8}">${esc(l.label)}</text>`);
              x = x2;
            }
          });
          height = margin + h + margin;
        } else {
          const w = Math.max(...ws);
          const x = margin + Math.floor((CANVAS - margin * 2 - w) / 2);
          let y = margin;
          const GAP_V = 40;
          boxes.forEach((b, i) => {
            out.push(mapRect(b, x, y, w, hs[i]));
            if (i < boxes.length - 1) {
              const l = linkOf(order[i], order[i + 1]);
              const cx = x + w / 2, y1 = y + hs[i], y2 = y1 + GAP_V;
              out.push(`  <path class="sds-connector" d="M${cx} ${y1} V${y2}"${l?.dashed ? ' stroke-dasharray="5 4"' : ""} marker-end="url(#ar)"/>`);
              if (l?.label) out.push(`  <text class="sds-note" x="${cx + 10}" y="${y1 + GAP_V / 2 + 4}">${esc(l.label)}</text>`);
              y = y2;
            }
          });
          height = y + hs[hs.length - 1] + margin;
        }
        return { svg: svgOf(out, spec.title ?? spec.caption ?? label), findings };
      }
    }
  }

  const levels = [...new Set([...depth.values()])].sort((a, b) => a - b);
  // Within a row, boxes are ordered by where the boxes they link to sit — a sweep down by sources,
  // then up by targets — so two links in one gap do not cross. Order is what makes a picture read.
  const pos = new Map<string, number>();
  const byLevel = levels.map((lv) => top.filter((b) => depth.get(b.id) === lv));
  byLevel.forEach((row) => row.forEach((b, i) => pos.set(b.id, i)));
  const mean = (ids: string[], fallback: number) => ids.length ? ids.reduce((s, id) => s + (pos.get(id) ?? 0), 0) / ids.length : fallback;
  const sweep = (down: boolean) => {
    const order = down ? byLevel : [...byLevel].reverse();
    for (const row of order) {
      const key = (b: Box) => mean(edges.filter(([f, t]) => (down ? t : f) === b.id).map(([f, t]) => (down ? f : t)), pos.get(b.id) ?? 0);
      row.sort((a, b) => key(a) - key(b) || (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0));
      row.forEach((b, i) => pos.set(b.id, i));
    }
  };
  sweep(true); sweep(false); sweep(true);
  const rows: Box[][] = [];
  for (const lv of levels) {
    const members = byLevel[levels.indexOf(lv)];
    let row: Box[] = []; let used = 0;
    for (const b of members) {
      const w = outerW(b);
      if (row.length && used + gapX + w > CANVAS - margin * 2) { rows.push(row); row = []; used = 0; }
      row.push(b); used += (used ? gapX : 0) + w;
    }
    if (row.length) rows.push(row);
  }

  const out: string[] = [];
  const at = new Map<string, { x: number; y: number; w: number; h: number; row: number }>();
  const place = (b: Box, x: number, y: number, w: number, h: number, row: number) => {
    const inner = kids.get(b.id) ?? [];
    at.set(b.id, { x, y, w, h, row });
    if (!inner.length) { out.push(mapRect(b, x, y, w, h)); return; }
    out.push(`  <rect class="${boxClass(b)}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none"/>`);
    out.push(`  <text class="sds-label" x="${x + PAD_IN}" y="${y + 22}">${esc(b.label)}</text>`);
    let cy = y + HEAD;
    for (const c of inner) { const ch = outerH(c); place(c, x + PAD_IN, cy, w - PAD_IN * 2, ch, row); cy += ch + 10; }
  };

  // EVERY horizontal run through a gap takes a lane of its own, so no two connectors travel side by
  // side and each label has a line to itself. A link to the next row crosses one gap and takes one
  // lane; a link that skips rows travels through two and takes a lane in each. Both are counted,
  // because a gap is as tall as everything crossing it, and lanes are a whole gap apart so the two
  // kinds cannot be placed by different arithmetic and land on each other.
  const rowOf = new Map<string, number>();
  rows.forEach((row, i) => { for (const b of row) rowOf.set(b.id, i); });
  const rowOfAny = (id: string) => rowOf.get(holder(id)) ?? -1;

  // A BOX LEAVES BY ITS SIDE ONLY IF NOTHING IN ITS ROW SITS BEYOND IT. The side corridor runs to the
  // right of every box, so a connector taking the right edge of a box that is NOT last in its row
  // travels the width of the row straight through every box after it: the nine-group map ran one link
  // across five boxes at their own mid-height, 0px of clear air, and printed its label over five more.
  // The chapter's rule is that a link which skips rows runs down a corridor clear of every box, and
  // clear is a fact about this row rather than an assumption — so it is decided per box. Last in its
  // row leaves by the side; anything else drops into the lane below, which is clear by construction.
  const lastInRow = new Set(rows.map((row) => row[row.length - 1].id));
  const bySide = (id: string) => lastInRow.has(holder(id));

  type Lane = { gap: number; index: number };
  const exitLane = new Map<Link, Lane>(), entryLane = new Map<Link, Lane>();
  const lanesIn: number[] = rows.map(() => 0);
  const takeLane = (gap: number): Lane => ({ gap, index: lanesIn[gap]++ });

  // How many connectors use each edge of each box, which is what decides how many points that edge
  // offers. Counted from the routes actually taken rather than from the rows alone: a link that skips
  // rows leaves by the side when it can and by the bottom when it cannot, and a box whose only arrow
  // leaves by the side must not have its bottom counted, or the one arrow on the bottom of the box
  // below it stops landing in the middle.
  const leaveBottom = new Map<string, number>(), enterTop = new Map<string, number>();
  const leaveTop = new Map<string, number>(), enterBottom = new Map<string, number>();
  const bump = (m: Map<string, number>, id: string) => m.set(id, (m.get(id) ?? 0) + 1);

  for (const l of links) {
    const ra = rowOfAny(l.from), rb = rowOfAny(l.to);
    if (ra < 0 || rb < 0 || ra === rb) continue;
    if (rb === ra + 1) {                                   // neighbours: one lane, bottom to top
      const lane = takeLane(ra);
      exitLane.set(l, lane); entryLane.set(l, lane);
      bump(leaveBottom, l.from); bump(enterTop, l.to);
    } else if (rb > ra + 1) {                              // skips down the right-hand corridor
      if (!bySide(l.from)) { exitLane.set(l, takeLane(ra)); bump(leaveBottom, l.from); }
      if (!bySide(l.to)) { entryLane.set(l, takeLane(rb - 1)); bump(enterTop, l.to); }
    } else {                                               // upward, and reported below
      if (!bySide(l.from)) { exitLane.set(l, takeLane(ra - 1)); bump(leaveTop, l.from); }
      if (!bySide(l.to)) { entryLane.set(l, takeLane(rb)); bump(enterBottom, l.to); }
    }
  }
  // A lane is not a line, it is a line plus the label riding above it plus the clear air the
  // contract owes on both sides. Deriving the pitch from LABEL_GAP is what stops a label touching
  // the arrow above it: whatever room a label needs, the next lane starts past it by construction.
  // One lane therefore makes a gap of exactly GAP_LINKED, which is the connected minimum.
  const LANE_H = LABEL_H + LABEL_GAP * 2, LANE_TOP = LANE_H;
  const gapAfter = (i: number) => Math.max(GAP_LINKED, LANE_TOP + LANE_H * lanesIn[i]);

  const laneY = (gap: number, lane: number) => rowBottom[gap] + LANE_TOP + LANE_H * lane;

  const rowTop: number[] = [], rowBottom: number[] = [];
  let y = margin;
  rows.forEach((row, i) => {
    const rh = Math.max(...row.map(outerH));
    const rw = row.reduce((s, b) => s + outerW(b), 0) + gapX * (row.length - 1);
    let x = margin + Math.floor((CANVAS - margin * 2 - rw) / 2);   // rows are centred
    rowTop.push(y); rowBottom.push(y + rh);
    for (const b of row) { const w = outerW(b); place(b, x, y, w, outerH(b), i); x += w + gapX; }
    y += rh + (i < rows.length - 1 ? gapAfter(i) : 0);
  });
  // A SIDE CORRIDOR PER SKIPPING LINK, clear to the right of every box. A link that skips rows runs
  // down one of these rather than out to the figure's far edge, so the figure is only as wide as the
  // routes it actually needs.

  // THE CORRIDOR SITS BESIDE THE BOXES, not beside the canvas. It was floored at the canvas edge, so
  // a four-box flowchart 260px wide sent its one skipping link out to x=1132 and back — a sweep the
  // width of a page to join two boxes a hand's breadth apart, and 725px of viewBox for 260px of
  // picture. The canvas is where things are LAID OUT; it is not where they end up.
  const rightMost = Math.max(...[...at.values()].map((p2) => p2.x + p2.w));
  const skippers = links.filter((l) => {
    const ra = rowOfAny(l.from), rb = rowOfAny(l.to);
    return ra >= 0 && rb >= 0 && (rb < ra || rb > ra + 1);
  });
  const sideLane = (l: Link) => rightMost + GAP_LINKED + Math.max(0, skippers.indexOf(l)) * GAP_Y;
  const width = Math.max(rightMost, skippers.length ? sideLane(skippers[skippers.length - 1]) : 0) + margin;
  const height = y + margin;

  // WHERE A CONNECTOR MEETS A BOX, decided once so the lane search and the drawing cannot disagree.
  const exitX = (l: Link) => {
    const a = at.get(l.from)!, b = at.get(l.to)!;
    const up = b.row < a.row;
    const n = (up ? leaveTop : leaveBottom).get(l.from) ?? 0;
    const towards = b.row === a.row + 1 ? b.x + b.w / 2 : sideLane(l);
    return alignedTo(acrossPoints(byId.get(l.from)!, a, up ? "top" : "bottom", n), towards);
  };
  const entryX = (l: Link) => {
    const a = at.get(l.from)!, b = at.get(l.to)!;
    const up = b.row < a.row;
    const n = (up ? enterBottom : enterTop).get(l.to) ?? 0;
    const towards = b.row === a.row + 1 ? a.x + a.w / 2 : sideLane(l);
    return alignedTo(acrossPoints(byId.get(l.to)!, b, up ? "bottom" : "top", n), towards);
  };

  // WHICH LANE A LINK TAKES IN A GAP IS CHOSEN, NOT COUNTED OFF. Lanes keep the horizontal runs
  // apart, and nothing kept the VERTICAL runs apart: a link drops from its source to its own lane,
  // and drops again from that lane to its target, so a link on a high lane has a long second drop
  // passing every lane below it — and that drop can land inside the contract's 24 of another link's
  // first drop. Three links out of one gap came out 22 apart, and no arithmetic here was wrong: the
  // ORDER was. So the order is searched and scored with the same rule the figure check applies to
  // the finished drawing, and the first clean one wins. Where no order is clean the best is kept and
  // the check reports it, which is the promise the drawer makes everywhere: try, then tell the truth.
  type Drop = { link: Link; lane: Lane; x: number; edge: number };
  const drops: Drop[] = [];
  for (const l of links) {
    const a = at.get(l.from), b = at.get(l.to);
    if (!a || !b || a.row === b.row) continue;
    const down = b.row > a.row;
    const el = exitLane.get(l), en = entryLane.get(l);
    const ba = byId.get(l.from)!, bb = byId.get(l.to)!;
    if (el) drops.push({ link: l, lane: el, x: exitX(l), edge: edgeY(ba, a, down ? "bottom" : "top") });
    if (en) drops.push({ link: l, lane: en, x: entryX(l), edge: edgeY(bb, b, down ? "top" : "bottom") });
  }

  // The figure check's own rule, applied to a candidate order rather than to a drawing.
  const clashes = (ds: Drop[], yOf: (lane: Lane) => number): number => {
    const segs = ds.map((d) => { const ly = yOf(d.lane); return { k: d.link, x: d.x, y1: Math.min(d.edge, ly), y2: Math.max(d.edge, ly) }; });
    let n = 0;
    for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
      if (segs[i].k === segs[j].k) continue;
      const apart = Math.abs(segs[i].x - segs[j].x);
      if (apart < 0.5 || apart >= GAP_APART) continue;   // collinear reads as one line continuing
      if (Math.min(segs[i].y2, segs[j].y2) - Math.max(segs[i].y1, segs[j].y1) > LABEL_GAP) n += 1;
    }
    return n;
  };
  const orders = <T,>(xs: T[]): T[][] =>
    xs.length <= 1 ? [xs] : xs.flatMap((x, i) => orders([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r]));

  for (let g = 0; g < rows.length; g++) {
    const ds = drops.filter((d) => d.lane.gap === g);
    const lanes = [...new Set(ds.map((d) => d.lane))];
    if (lanes.length < 2) continue;
    const yFor = (order: Lane[]) => {
      const m = new Map(order.map((ln, i) => [ln, rowBottom[g] + LANE_TOP + LANE_H * i]));
      return (ln: Lane) => m.get(ln)!;
    };
    let best = lanes, score = clashes(ds, yFor(lanes));
    // Six lanes in one gap is 720 orders and the search is exhaustive; beyond that it is greedy —
    // each place in turn takes whichever lane adds fewest clashes to what is already settled.
    if (score) {
      if (lanes.length <= 6) {
        for (const order of orders(lanes)) {
          const s2 = clashes(ds, yFor(order));
          if (s2 < score) { best = order; score = s2; if (!score) break; }
        }
      } else {
        const rest = [...lanes], picked: Lane[] = [];
        while (rest.length) {
          let at2 = 0, low = Infinity;
          for (let i = 0; i < rest.length; i++) {
            const trial = [...picked, rest[i]];
            const s2 = clashes(ds.filter((d) => trial.includes(d.lane)), yFor([...trial, ...rest.filter((r) => r !== rest[i])]));
            if (s2 < low) { low = s2; at2 = i; }
          }
          picked.push(...rest.splice(at2, 1));
        }
        if (clashes(ds, yFor(picked)) < score) best = picked;
      }
    }
    best.forEach((ln, i) => { ln.index = i; });
  }


  // Labels live in the gaps between rows. Two labels in one gap are stacked so neither overprints.
  const taken: { gap: number; x1: number; x2: number; y: number }[] = [];
  const labelAt = (gap: number, cx: number, w: number, baseY: number): { x: number; y: number } => {
    let x = Math.min(Math.max(cx - w / 2, margin), width - margin - w);
    let ly = baseY;
    for (let tries = 0; tries < 4; tries++) {
      const hit = taken.find((t) => t.gap === gap && Math.abs(t.y - ly) < LABEL_H + LABEL_GAP && t.x1 < x + w && x < t.x2);
      if (!hit) break;
      ly += LABEL_H + LABEL_GAP;
    }
    taken.push({ gap, x1: x, x2: x + w, y: ly });
    return { x, y: ly };
  };

  const verticals: Vert[] = [];
  const horizontals: Blocker[] = [];
  const pending: Pending[] = [];

  for (const [pathId, l] of links.entries()) {
    const a = at.get(l.from), b = at.get(l.to);
    if (!a || !b) continue;
    const dash = l.dashed ? ' stroke-dasharray="5 4"' : "";
    let d: string; let label: { x: number; y: number } | null = null;
    const w = (l.label ?? "").length * W_NOTE;
    if (a.row === b.row) {
      // Side by side: out of one vertical edge, into the other, the label above both.
      const rightward = a.x < b.x;
      const ba = byId.get(l.from)!, bb = byId.get(l.to)!;
      const x1 = edgeX(ba, a, rightward ? "right" : "left"), x2 = edgeX(bb, b, rightward ? "left" : "right");
      const y1 = midY(ba, a), y2 = midY(bb, b), mid = (x1 + x2) / 2;
      d = `M${x1} ${y1} H${mid} V${y2} H${x2}`;
      if (l.label) label = labelAt(-1 - a.row, mid, w, Math.min(a.y, b.y) - LABEL_GAP);
    } else if (b.row === a.row + 1) {
      // The next row down: out of the bottom, along this link's own lane in the gap, into the top.
      const x1 = exitX(l), x2 = entryX(l);
      const y1 = edgeY(byId.get(l.from)!, a, "bottom"), y2 = edgeY(byId.get(l.to)!, b, "top");
      const lane = exitLane.get(l);
      const mid = laneY(a.row, lane ? lane.index : 0);
      const straight = Math.abs(x1 - x2) < 1;
      d = straight ? `M${x1} ${y1} V${y2}` : `M${x1} ${y1} V${mid} H${x2} V${y2}`;
      if (l.label) {
        // Above this link's own horizontal run, or beside the vertical run when the link is straight.
        // Either way the text is in the gap and its span never contains a vertical segment.
        const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
        const cx = straight ? x1 + 8 + w / 2 : (lo + hi) / 2;
        label = { x: Math.min(Math.max(cx - w / 2, margin), width - margin - w), y: straight ? mid + LABEL_GAP : mid - LABEL_GAP };
        if (!straight && w > hi - lo - 8) { // a label longer than its run sits clear of both verticals
          label.x = Math.min(Math.max(hi + 6, margin), width - margin - w);
          if (label.x + w > width - margin) label.x = Math.max(lo - w - 6, margin);
        }
      }
    } else if (b.row > a.row) {
      // Skips a row: out to a corridor of its own, clear to the right of every box, down it, and
      // back in beside the target. A connector leaves whichever side puts it on the shortest honest
      // route rather than always the bottom — leaving the bottom forced a link that skips two rows
      // out to the figure's far edge and back across everything, to join two boxes sitting one above
      // the other (developer, 2026-09-21). HONEST is the word that does the work: the right edge is
      // the shortest route only for a box with nothing beyond it in its row, and for any other box
      // it is a run straight through its neighbours. So the side is taken when it is clear, and the
      // lane below is taken when it is not.
      const sideX = sideLane(l);
      const parts: string[] = [];
      let runY: number, runFrom: number;
      const ba = byId.get(l.from)!, bb = byId.get(l.to)!;
      if (bySide(l.from)) { runY = midY(ba, a); runFrom = edgeX(ba, a, "right"); parts.push(`M${runFrom} ${runY}`); }
      else {
        const el = exitLane.get(l)!; runY = laneY(el.gap, el.index); runFrom = exitX(l);
        parts.push(`M${runFrom} ${edgeY(ba, a, "bottom")}`, `V${runY}`);
      }
      parts.push(`H${sideX}`);
      if (bySide(l.to)) parts.push(`V${midY(bb, b)}`, `H${edgeX(bb, b, "right")}`);
      else { const en = entryLane.get(l)!; parts.push(`V${laneY(en.gap, en.index)}`, `H${entryX(l)}`, `V${edgeY(bb, b, "top")}`); }
      d = parts.join(" ");
      if (l.label) label = labelAt(a.row, (runFrom + sideX) / 2, w, runY - LABEL_GAP);
    } else {
      // Upward: out of the top, along the gap above to the lane, up to the gap below the target, in
      // from the bottom. Drawn, and reported, because a map is meant to flow one way.
      findings.push(`the link \`${l.from}\` → \`${l.to}\` runs upward; a map flows one way, so a link points at a box below its source`);
      const sideX = sideLane(l);
      const parts: string[] = [];
      let runY: number, runFrom: number;
      const ba = byId.get(l.from)!, bb = byId.get(l.to)!;
      if (bySide(l.from)) { runY = midY(ba, a); runFrom = edgeX(ba, a, "right"); parts.push(`M${runFrom} ${runY}`); }
      else {
        const el = exitLane.get(l)!; runY = laneY(el.gap, el.index); runFrom = exitX(l);
        parts.push(`M${runFrom} ${edgeY(ba, a, "top")}`, `V${runY}`);
      }
      parts.push(`H${sideX}`);
      if (bySide(l.to)) parts.push(`V${midY(bb, b)}`, `H${edgeX(bb, b, "right")}`);
      else { const en = entryLane.get(l)!; parts.push(`V${laneY(en.gap, en.index)}`, `H${entryX(l)}`, `V${edgeY(bb, b, "bottom")}`); }
      d = parts.join(" ");
      if (l.label) label = labelAt(a.row - 1, (runFrom + sideX) / 2, w, runY - LABEL_GAP);
    }
    out.push(`  <path class="sds-connector" d="${d}"${dash} marker-end="url(#ar)"/>`);
    horizontals.push(...horzOf(d, pathId));
    if (label && l.label) { verticals.push(...vertsOf(d, pathId)); pending.push({ ...label, w, txt: l.label, path: pathId }); }
    else verticals.push(...vertsOf(d, pathId));
  }

  // THE BOXES GO IN. `placeLabels` has known since it was written that a box blocks as surely as a
  // connector, and this call site never passed them — so a map's labels were slid clear of every
  // line and dropped 2px from a box, which is the one fault the placer's own comment describes.
  // Three call sites, one of them passing the argument: the lesson was learned in `entities` and
  // never carried across.
  out.push(...placeLabels(pending, verticals, margin, width, [...at.values(), ...horizontals]));

  return { svg: svgOf(out, spec.title ?? spec.caption ?? label), findings };
}

/**
 * SYSTEM — the architecture of a thing somebody builds, and the one kind that carries a server
 * module, a web module and an estate package alike, because the three are the same shape: server
 * runs entry → services → repositories → stores, web runs pages → hooks → services → client, an
 * estate runs organization → account → network → resources (RULE.DEVEX.WORKSPACE.135).
 *
 * WHY IT IS A DRAWER RATHER THAN THREE RULES BOLTED ONTO THE MAP. The kind was specified fully and
 * drawn by hand three times; placing ONE of those figures took more than twenty rounds against the
 * figure check, and every fault was caught by a rule rather than by eye. A person cannot hold the
 * spacing contract, the lane rules, the attachment points and the label clearances in their head at
 * once, and should not have to (developer, 2026-09-21). So the spec names layers, the boxes inside
 * them, the resources outside the boundary with the KIND of each, and the edges — and every
 * coordinate is computed here.
 *
 * Three columns. What points INTO the system sits left, the system sits in the middle, what the
 * system reaches sits right — the same rule `ENTITIES` uses, and for the same reason: with direction
 * deciding the column, every outward edge runs one way and none of them crosses a label.
 */
function drawSystem(spec: Spec): { svg: string; findings: string[] } {
  const findings: string[] = [];
  const layers = spec.layers ?? [];
  const outside = spec.outside ?? [];
  const links = spec.links ?? [];
  if (!layers.length) return { svg: "", findings: ["a `system` figure with no layers; a system is layers inside one boundary"] };

  const inner = layers.flatMap((l) => l.boxes);
  const byId = new Map<string, Box>([...inner, ...outside].map((b) => [b.id, b]));
  const layerOf = new Map<string, number>();
  layers.forEach((l, i) => l.boxes.forEach((b) => layerOf.set(b.id, i)));
  const isOut = new Set(outside.map((b) => b.id));
  for (const l of links) for (const end of [l.from, l.to])
    if (!byId.has(end)) findings.push(`an edge names \`${end}\`, and no box has that id`);
  // RULE 3 — an edge is a call or a flow of data and it carries what flows. An unlabelled line
  // meaning *related* is the one thing this kind refuses, because *related* is what a reader was
  // already assuming. Inside the boundary the layer order says it, so only outward edges are held.
  for (const l of links)
    if (!l.label && (isOut.has(l.from) || isOut.has(l.to)))
      findings.push(`the edge \`${l.from}\` → \`${l.to}\` crosses the boundary with nothing on it; an edge carries what flows`);

  // Which side of the boundary an outside thing belongs on: what points in sits left, what is
  // reached sits right. A thing that does both is drawn on the left, where a loop closing back is
  // easier to follow than a loop opening forward.
  const reaches = new Set(links.filter((l) => !isOut.has(l.from) && isOut.has(l.to)).map((l) => l.to));
  const feeds = new Set(links.filter((l) => isOut.has(l.from)).map((l) => l.from));
  const left = outside.filter((b) => feeds.has(b.id));
  const right = outside.filter((b) => !feeds.has(b.id) && reaches.has(b.id));
  for (const b of outside)
    if (!feeds.has(b.id) && !reaches.has(b.id))
      findings.push(`\`${b.id}\` sits outside the boundary with no edge to it; anything drawn outside is something the system talks to`);

  const shaped = (b: Box & { as?: Resource }): Box => b.shape ? b
    : { ...b, shape: RESOURCE[b.as ?? "service"].shape, off: b.off ?? RESOURCE[b.as ?? "service"].soft };

  const margin = 24, HEAD_MOD = 40, HEAD_LAYER = 36, PAD_IN = 16;
  const innerW = Math.max(200, ...inner.map(mapBoxWidth));
  const layerW = innerW + PAD_IN * 2, modW = layerW + PAD_IN * 2;

  // The left side is itself a little chain — a client knocks on a door, the door calls the entry —
  // so it lays out in columns by how far each box is from the boundary.
  const depthOf = new Map<string, number>(left.map((b) => [b.id, 0]));
  for (let pass = 0; pass < left.length; pass++)
    for (const l of links)
      if (depthOf.has(l.from) && depthOf.has(l.to))
        depthOf.set(l.to, Math.max(depthOf.get(l.to)!, depthOf.get(l.from)! + 1));
  const leftCols: (Box & { as?: Resource })[][] = [];
  for (const b of left) (leftCols[depthOf.get(b.id) ?? 0] ??= []).push(b);
  const leftW = leftCols.map((c) => Math.max(...c.map((b) => mapBoxWidth(shaped(b)))));
  // A gap on the left holds the label of whatever is said across it, for the same reason.
  const leftGap = leftCols.map((col) => {
    const said = links.filter((l) => col.some((b) => b.id === l.from)).map((l) => (l.label ?? "").length * W_NOTE);
    return Math.max(GAP_LINKED, Math.ceil(Math.max(0, ...said)) + 32);
  });
  const leftSpan = leftW.reduce((t, w, i) => t + w + leftGap[i], 0);
  const rightW = right.length ? Math.max(...right.map((b) => mapBoxWidth(shaped(b)))) : 0;

  const modX = margin + leftSpan;
  // One corridor per outward edge, between the boundary and the right-hand column, GAP_APART apart.
  const outEdges = links.filter((l) => !isOut.has(l.from) && reaches.has(l.to));
  // The rail holds one corridor per outward edge AND the widest label said across it, because an
  // outward edge's label sits on the run that lands in the right-hand column.
  const outLabel = Math.max(0, ...outEdges.map((l) => (l.label ?? "").length * W_NOTE));
  const railW = outEdges.length
    ? Math.max(GAP_LINKED + GAP_APART * Math.max(0, outEdges.length - 1) + GAP_LINKED, Math.ceil(outLabel) + 32)
    : GAP_LINKED;
  const rightX = modX + modW + (right.length ? railW : 0);

  // Vertical: the module first, since the outside boxes hang off what they connect to.
  const at = new Map<string, { x: number; y: number; w: number; h: number }>();
  const body: string[] = [];
  const layerAt: { y: number; h: number }[] = [];
  let y = margin + HEAD_MOD;
  for (const layer of layers) {
    const hs = layer.boxes.map(mapBoxHeight);
    const lh = HEAD_LAYER + hs.reduce((t, h) => t + h, 0) + GAP_Y * (hs.length - 1) + PAD_IN;
    layerAt.push({ y, h: lh });
    let by = y + HEAD_LAYER;
    layer.boxes.forEach((b, i) => { at.set(b.id, { x: modX + PAD_IN * 2, y: by, w: innerW, h: hs[i] }); by += hs[i] + GAP_Y; });
    y += lh + GAP_LINKED;
  }
  const modH = y - GAP_LINKED + PAD_IN - margin;

  // RULE 1 — one outermost container, and it is the thing being described.
  body.push(`  <rect class="sds-box sds-absent" x="${modX}" y="${margin}" width="${modW}" height="${modH}" rx="3" fill="none"/>`);
  body.push(`  <text class="sds-title" x="${modX + PAD_IN}" y="${margin + 26}">${esc(spec.title ?? "the system")}</text>`);
  layers.forEach((layer, i) => {
    const { y: ly, h: lh } = layerAt[i];
    body.push(`  <rect class="sds-box sds-absent" x="${modX + PAD_IN}" y="${ly}" width="${layerW}" height="${lh}" rx="3" fill="none"/>`);
    body.push(`  <text class="sds-title" x="${modX + PAD_IN * 2}" y="${ly + 24}">${esc(layer.name)}</text>`);
    for (const b of layer.boxes) { const p = at.get(b.id)!; body.push(mapRect(b, p.x, p.y, p.w, p.h)); }
  });

  // RULE 2 — the layers run one way, the direction a call travels, and the arrow between them says so.
  for (let i = 0; i + 1 < layers.length; i++) {
    const a = layerAt[i], b = layerAt[i + 1];
    body.push(`  <path class="sds-connector" d="M${modX + modW / 2} ${a.y + a.h} V${b.y}" marker-end="url(#ar)"/>`);
  }

  // An outside box is centred on what it connects to, then pushed down to keep the grid's own gap.
  const settle = (boxes: (Box & { as?: Resource })[], want: (b: Box) => number, x: number, w: number) => {
    const rows = boxes.map((b) => ({ b, h: mapBoxHeight(shaped(b)), y: want(b) }))
      .sort((m, n) => m.y - n.y);
    let floor = margin;
    for (const r of rows) {
      r.y = Math.max(r.y - r.h / 2, floor);
      at.set(r.b.id, { x, y: r.y, w, h: r.h });
      body.push(mapRect(shaped(r.b), x, r.y, w, r.h));
      floor = r.y + r.h + GAP_Y;
    }
  };
  const midOf = (id: string) => { const p = at.get(id); return p ? p.y + p.h / 2 : margin + modH / 2; };
  let lx = margin;
  leftCols.forEach((col, i) => {
    settle(col, (b) => {
      const onward = links.filter((l) => l.from === b.id).map((l) => l.to);
      return onward.length ? onward.reduce((t, id) => t + midOf(id), 0) / onward.length : margin + modH / 2;
    }, lx, leftW[i]);
    lx += leftW[i] + leftGap[i];
  });
  settle(right, (b) => {
    const back = links.filter((l) => l.to === b.id).map((l) => l.from);
    return back.length ? back.reduce((t, id) => t + midOf(id), 0) / back.length : margin + modH / 2;
  }, rightX, rightW);

  // The edges. Inward runs land on the left of what they reach; outward runs leave the right of the
  // box that owns them — which layer owns an edge is the claim the figure exists to make checkable.
  const pending: Pending[] = [], verticals: Vert[] = [];

  // A SIDE OFFERS THREE POINTS AND A LONE ARROW TAKES THE MIDDLE, on this kind as on every other.
  // Two edges leaving one box both took its exact middle, so they ran side by side out of the
  // boundary and the check read them as one line 7px thick. A shape's usable side is its own body:
  // a cylinder's begins below its cap.
  const leaving = new Map<string, number>(), arriving = new Map<string, number>();
  for (const l of links) {
    if (!at.has(l.from) || !at.has(l.to)) continue;
    leaving.set(l.from, (leaving.get(l.from) ?? 0) + 1);
    arriving.set(l.to, (arriving.get(l.to) ?? 0) + 1);
  }
  const span = (b: Box, p: { y: number; h: number }) =>
    shapeOf(b) === "store" ? { start: p.y + CAP, len: p.h - CAP } : { start: p.y, len: p.h };

  // TWO CONNECTORS MAY SHARE A POINT ONLY WHERE THEY PART AT ONCE. The map drawer lets a side's
  // points be chosen by alignment, and two links taking the same one is fine there because each
  // drops into a lane of its own within a few pixels. Here they do not: both edges leave the
  // boundary and run RIGHT, so a shared point put them side by side for 88px and the check read
  // them as one line 8px thick. On this kind a side's points are dealt out, one per edge, in the
  // order the things at the other end sit — so the fan is a fan and its lines never touch.
  const seat = new Map<Link, number>();
  for (const [id, group] of new Map<string, Link[]>(
    [...new Set(links.map((l) => l.from))].map((id) => [id, links.filter((l) => l.from === id && at.has(l.to))]))) {
    if (!at.has(id)) continue;
    group.sort((m, n) => at.get(m.to)!.y - at.get(n.to)!.y).forEach((l, i) => seat.set(l, i));
  }
  const arrive = new Map<Link, number>();
  for (const [id, group] of new Map<string, Link[]>(
    [...new Set(links.map((l) => l.to))].map((id) => [id, links.filter((l) => l.to === id && at.has(l.from))]))) {
    if (!at.has(id)) continue;
    group.sort((m, n) => at.get(m.from)!.y - at.get(n.from)!.y).forEach((l, i) => arrive.set(l, i));
  }
  const sideY = (b: Box, p: { y: number; h: number }, n: number, i: number) => {
    const { start, len } = span(b, p);
    const pts = sidePoints(start, len, n);
    return pts[Math.min(i, pts.length - 1)];
  };

  // WHICH CORRIDOR AN OUTWARD EDGE TAKES IS CHOSEN, NOT COUNTED OFF — the same lesson the map
  // drawer learned about lanes, met again one layer out. An edge leaves the boundary at its own seat,
  // runs right to its corridor, drops, and runs right again into its resource. The FIRST run of one
  // edge and the LAST run of another therefore share a stretch of x whenever the second corridor is
  // the further out, and the contract's 24 has to hold between them. Ordering by where the resources
  // sit is the obvious choice and it is wrong: it put a run into the cache 8px under a run out of
  // services. So the order is searched and scored with the figure check's own rule, exhaustively up
  // to six corridors and greedily beyond, and where nothing is clean the best is kept and reported.
  const outward = links.filter((l) => isOut.has(l.to) && !isOut.has(l.from) && at.has(l.to) && at.has(l.from));
  const railOf = new Map<Link, number>();
  outward.forEach((l, i) => railOf.set(l, i));
  if (outward.length > 1) {
    const runsFor = (order: Link[]) => {
      const segs: { k: Link; y: number; x1: number; x2: number }[] = [];
      order.forEach((l, i) => {
        const a = at.get(l.from)!, b = at.get(l.to)!;
        const ba = shaped(byId.get(l.from) as Box & { as?: Resource });
        const bb = shaped(byId.get(l.to) as Box & { as?: Resource });
        const y1 = sideY(ba, a, leaving.get(l.from) ?? 1, seat.get(l) ?? 0);
        const y2 = sideY(bb, b, arriving.get(l.to) ?? 1, arrive.get(l) ?? 0);
        const via = modX + modW + GAP_LINKED + GAP_APART * i;
        if (Math.abs(y1 - y2) < 1) segs.push({ k: l, y: y1, x1: edgeX(ba, { ...a, row: 0 }, "right"), x2: b.x });
        else {
          segs.push({ k: l, y: y1, x1: edgeX(ba, { ...a, row: 0 }, "right"), x2: via });
          segs.push({ k: l, y: y2, x1: via, x2: b.x });
        }
      });
      let bad = 0;
      for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
        if (segs[i].k === segs[j].k) continue;
        const apart = Math.abs(segs[i].y - segs[j].y);
        if (apart < 0.5 || apart >= GAP_APART) continue;
        if (Math.min(segs[i].x2, segs[j].x2) - Math.max(segs[i].x1, segs[j].x1) > LABEL_GAP) bad += 1;
      }
      return bad;
    };
    const permute = <T,>(xs: T[]): T[][] =>
      xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permute([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r]));
    let best = outward, score = runsFor(outward);
    if (score) {
      const tries = outward.length <= 6 ? permute(outward)
        : [[...outward].sort((m, n) => at.get(m.to)!.y - at.get(n.to)!.y),
           [...outward].sort((m, n) => at.get(n.to)!.y - at.get(m.to)!.y)];
      for (const order of tries) {
        const s2 = runsFor(order);
        if (s2 < score) { best = order; score = s2; if (!score) break; }
      }
    }
    best.forEach((l, i) => railOf.set(l, i));
  }

  for (const [pathId, l] of links.entries()) {
    const a = at.get(l.from), b = at.get(l.to);
    if (!a || !b) continue;
    const ba = shaped(byId.get(l.from) as Box & { as?: Resource });
    const bb = shaped(byId.get(l.to) as Box & { as?: Resource });
    const dash = l.dashed ? ' stroke-dasharray="5 4"' : "";
    const w = (l.label ?? "").length * W_NOTE;
    // A CYLINDER'S MIDDLE IS THE MIDDLE OF ITS BODY, not of the box its cap is reserved in — the
    // first draw put the only arrow into a database 7px off its own centre, twice, which is the
    // same half-a-shape mistake the map drawer had in its rows.
    const x1 = edgeX(ba, { ...a, row: 0 }, "right"), x2 = edgeX(bb, { ...b, row: 0 }, "left");
    const y1 = sideY(ba, a, leaving.get(l.from) ?? 1, seat.get(l) ?? 0);
    const y2 = sideY(bb, b, arriving.get(l.to) ?? 1, arrive.get(l) ?? 0);
    let d: string, lx2: number, ly2: number;
    if (isOut.has(l.to) && !isOut.has(l.from)) {
      // Out of the boundary, down its own corridor, into the resource. The label rides the last run,
      // which is the one stretch of the route that is outside every container on the page — a label
      // left inside the module reads as belonging to the module, and the check measures it against
      // the boundary it sits in and calls it an overrun, which it is.
      const via = modX + modW + GAP_LINKED + GAP_APART * (railOf.get(l) ?? 0);
      d = Math.abs(y1 - y2) < 1 ? `M${x1} ${y1} H${x2}` : `M${x1} ${y1} H${via} V${y2} H${x2}`;
      const from = Math.abs(y1 - y2) < 1 ? modX + modW : via;
      lx2 = from + (x2 - from - w) / 2; ly2 = y2 - LABEL_GAP;
    } else {
      // Inward, or between two things outside. The label sits above the run, before the boundary.
      d = Math.abs(y1 - y2) < 1 ? `M${x1} ${y1} H${x2}` : `M${x1} ${y1} V${y2} H${x2}`;
      const stop = isOut.has(l.to) ? x2 : modX;
      lx2 = x1 + (stop - x1 - w) / 2; ly2 = Math.min(y1, y2) - LABEL_GAP;
    }
    body.push(`  <path class="sds-connector" d="${d}"${dash} marker-end="url(#ar)"/>`);
    verticals.push(...vertsOf(d, pathId));
    if (l.label) pending.push({ x: Math.round(lx2), y: Math.round(ly2), w, txt: l.label, path: pathId });
  }
  body.push(...placeLabels(pending, verticals, margin, rightX + rightW + margin));

  return { svg: svgOf(body, spec.title ?? spec.caption ?? "system diagram"), findings };
}

/**
 * SEQUENCE — a process with more than one participant, where WHO SPEAKS TO WHOM is the thing to see.
 * One lifeline per participant, time running down, one arrow per message carrying its own label, and
 * a dashed arrow for a reply (05-artifacts.md § The figures).
 *
 * **A lifeline runs on past the last message.** The developer, on the handoff figure: *for seq flow
 * diagram can we have particpant vertical line grow extra*. A lifeline is the participant's existence
 * through time and the messages are events on it, so one stopping dead at the final arrow says the
 * parties ceased to exist at the last word spoken.
 *
 * A lifeline is marked `lifeline`, which the figure check reads as background rather than as a claim:
 * it is exempt from the shaft, the clearance and the parallel-run rules, and a message landing on one
 * still counts as landing on something, because a connector may end on another connector.
 */
function drawSequence(spec: Spec): { svg: string; findings: string[] } {
  const findings: string[] = [];
  const parts = spec.boxes ?? [];
  const msgs = spec.links ?? [];
  if (!parts.length) return { svg: "", findings: ["a `dg` figure with no boxes"] };

  const idx = new Map(parts.map((b, i) => [b.id, i]));
  for (const m of msgs) for (const end of [m.from, m.to])
    if (!idx.has(end)) findings.push(`a message names \`${end}\`, and no participant has that id`);
  const known = msgs.filter((m) => idx.has(m.from) && idx.has(m.to));
  for (const m of known) if (!m.label)
    findings.push(`the message \`${m.from}\` → \`${m.to}\` carries no label; a sequence shows who says WHAT to whom`);

  const margin = 24;
  // One pitch per message. A label sits LABEL_GAP above its own arrow and owes the same to the arrow
  // above it, so the pitch is that gap twice plus the line itself — the same arithmetic a lane uses.
  const HEAD_H = 44, PITCH = LABEL_H + LABEL_GAP * 3, TAIL = 36, SELF_W = 44, SELF_H = 22;

  const ws = parts.map((b) => Math.max(120, Math.ceil(b.label.length * W_LABEL + PAD_X * 2)));
  // A COLUMN GAP GROWS TO HOLD THE WIDEST THING SAID ACROSS IT. A message's label is centred on its
  // own arrow, so a long one on a short arrow sprawls over the lifelines either side of it.
  const gaps = parts.slice(0, -1).map((_, i) => {
    const across = known.filter((m) => {
      const a = idx.get(m.from)!, b = idx.get(m.to)!;
      return Math.min(a, b) === i && Math.max(a, b) === i + 1;
    });
    const widest = Math.max(0, ...across.map((m) => (m.label ?? "").length * W_NOTE));
    return Math.max(GAP_COL, Math.ceil(widest + 24 - (ws[i] + ws[i + 1]) / 2));
  });

  const out: string[] = [];
  const xs: number[] = [];
  let x = margin;
  parts.forEach((b, i) => {
    xs.push(x + ws[i] / 2);
    out.push(`  <rect class="${boxClass(b)}" x="${x}" y="${margin}" width="${ws[i]}" height="${HEAD_H}" rx="3"/>`);
    out.push(centred("sds-label",b.label, x + ws[i] / 2, margin + HEAD_H / 2 + 4));
    x += ws[i] + (gaps[i] ?? 0);
  });

  let y = margin + HEAD_H + PITCH;
  for (const m of known) {
    const a = xs[idx.get(m.from)!], b = xs[idx.get(m.to)!];
    const dash = m.dashed ? ' stroke-dasharray="5 4"' : "";
    if (m.from === m.to) {
      // A PARTICIPANT SPEAKING TO ITSELF is a loop off its own lifeline and back, because an arrow
      // from a line to the same line has nowhere to be and no length a reader could see.
      out.push(`  <path class="sds-connector" d="M${a} ${y} H${a + SELF_W} V${y + SELF_H} H${a}"${dash} marker-end="url(#ar)"/>`);
      if (m.label) out.push(`  <text class="sds-note" x="${Math.round(a + SELF_W + LABEL_GAP)}" y="${y + SELF_H / 2 + 4}">${esc(m.label)}</text>`);
      y += SELF_H + PITCH;
      continue;
    }
    out.push(`  <path class="sds-connector" d="M${a} ${y} H${b}"${dash} marker-end="url(#ar)"/>`);
    if (m.label) out.push(centred("sds-note",m.label, (a + b) / 2, y - LABEL_GAP));
    y += PITCH;
  }

  // The lifelines are drawn last so they run the full height, and they run on past the last message.
  const foot = y - PITCH + TAIL;
  parts.forEach((_, i) => out.push(
    `  <path class="sds-connector sds-lifeline" d="M${xs[i]} ${margin + HEAD_H} V${foot}" stroke-dasharray="3 5"/>`));

  return { svg: svgOf(out, spec.title ?? spec.caption ?? "sequence diagram"), findings };
}

/**
 * FLOWCHART — the path somebody or something takes, and where it turns. It is laid out on the map's
 * own geometry, because rows-by-depth is what a flowchart already is; what the kind adds is the
 * standard shape vocabulary and the rule that the path runs DOWN the page.
 *
 * A shape is inferred only where the author has not named one, and only for the two a flowchart
 * cannot be read without: the ends of the path are terminators, and a box with more than one way out
 * is a decision. Everything else stays a process, which is what it usually is. Naming `shape` in the
 * spec always wins — inference is a convenience, never an opinion the author cannot overrule.
 */
function drawFlowchart(spec: Spec): { svg: string; findings: string[] } {
  const boxes = spec.boxes ?? [];
  const links = spec.links ?? [];
  const outs = new Map<string, number>(), ins = new Map<string, number>();
  for (const l of links) { outs.set(l.from, (outs.get(l.from) ?? 0) + 1); ins.set(l.to, (ins.get(l.to) ?? 0) + 1); }

  const shaped: Box[] = boxes.map((b) => {
    if (b.shape) return b;
    if (!ins.get(b.id) || !outs.get(b.id)) return { ...b, shape: "terminator" as Shape };
    if ((outs.get(b.id) ?? 0) > 1) return { ...b, shape: "decision" as Shape };
    return b;
  });
  const shapeById = new Map(shaped.map((b) => [b.id, shapeOf(b)]));

  const { svg, findings } = drawMap({ ...spec, boxes: shaped }, { downward: true });
  // A DIAMOND WITH AN UNANSWERED BRANCH is the one fault this kind can have that a map cannot. The
  // chapter says a decision carries each branch's answer, and a reader meeting two unlabelled arrows
  // out of a diamond has to guess which one is yes — which is the question the diamond was asked.
  for (const l of links)
    if (shapeById.get(l.from) === "decision" && !l.label)
      findings.push(`the branch \`${l.from}\` → \`${l.to}\` leaves a decision with no answer on it; each branch out of a diamond carries its own answer`);
  return { svg, findings };
}

/**
 * SKELETON — a mock of a layout, drawn under the rule that holds for every other kind: nothing by
 * eye, every box measured from its own text. No connectors: position is the whole claim, so this
 * drawer emits none.
 *
 * A SKELETON READS ITS OWN MEASURES (05-artifacts.md § `SKELETON`, § The skeleton's own guidelines).
 * Every number below is a copy of a grid number or a number of its own; none is shared with another
 * kind, so a change here never moves a MAP, a FLOWCHART, a SYSTEM or an ENTITIES figure.
 *
 * Marks, never tints: a background is a surface (`sds-skel-surface`), a solid line is a border the block
 * has (`sds-skel-border`), a dotted line marks a component, a part or a slot (`sds-skel-guide`), a thin
 * line is a control (`sds-skel-control`), and a soft bar stands in for content (`sds-skel-bar`). A drawing
 * carries no colour of its own: every mark is a class of the shared stylesheet.
 */
const SKEL_PAD = 16, SKEL_GAP = 24, SKEL_LABEL_H = 12, SKEL_LABEL_GAP = 8;
const SKEL_W_LABEL = 7, SKEL_W_NOTE = 6.4, SKEL_W_TITLE = 7.6;
const SKEL_H_ONE = 44, SKEL_H_TWO = 64;
/** A control's height at each size step, from the library's own scale. A frame's `size` sets it for everything inside; the default is `SM`. */
const SKEL_CONTROL_H: Record<string, number> = { XS: 28, SM: 32, MD: 36, LG: 40, XL: 44 };
const SKEL_DEFAULT_H = SKEL_CONTROL_H.SM;
/** The control height inside `frame`: its own `size`, or a grid section's `section.size`, which it hands to every block inside, or
 *  the one that holds it. */
const skelSizeH = (frame: SkeletonFrame, inherited: number): number => {
  const size = frame.size ?? skelGridSectionOf(frame)?.size;
  return size !== undefined && SKEL_CONTROL_H[size] !== undefined ? SKEL_CONTROL_H[size] : inherited;
};
/** The corner of a rounded frame; a square one has none. */
const SKEL_ROUND = 8;
/** A tag's line: the note measure, its own clear air below it before the words or bars it heads. */
const SKEL_TAG_H = SKEL_LABEL_H + SKEL_LABEL_GAP;
/** One placeholder bar and the gap under it; a heading bar is a little taller. */
const SKEL_BAR = 6, SKEL_HEAD_BAR = 8, SKEL_BAR_STEP = SKEL_BAR + SKEL_LABEL_GAP;
/** Controls of one packed group (a pager, a layout switch) sit this far apart. */
const SKEL_PACK_GAP = 4;
/** How many named boundaries may sit inside one another before the drawing is split: a container, a widget or a card
 *  in it, and a group in that. */
const SKEL_NEST_MAX = 3;
const SKEL_LINES_W = 160, SKEL_FIELD_W = 160, SKEL_CARD_H = 64;
const WIDTH_FRACTIONS: Record<string, number> = { "1/4": 1 / 4, "1/3": 1 / 3, "1/2": 1 / 2, "2/3": 2 / 3, "3/4": 3 / 4 };
// THE OUTER FRAME TAKES THE GRID'S CONTENT WIDTH (05-artifacts.md § The grid), as the hand-drawn
// skeletons did: a layout is a screen, and a screen drawn 300 wide reads as a widget.
const SKEL_CANVAS = 1052;
// A FLOOR RATHER THAN A ZERO, for the degenerate case every row's width is left to a `fill` or a
// fraction: nothing would set the frame's own width, and 0 is not a figure.
const SKEL_MIN_W = 200;

const SKEL_LOOKS = ["raised", "bordered", "flat", "card", "container"];
/** A container on a surface: the height of its header, a band inside its outline under its unit's name, from its top
 *  to the line under it: its title alone, or its title with a note under it. */
const SKEL_CONTAINER_HEAD = 44, SKEL_CONTAINER_HEAD_TWO = 52;
/** How far the dotted line of a part with no border stands above and below what it marks. */
const SKEL_GUIDE_OUT = 6;
/** A card's head: its title on one line, or its title with a note under it. */
const SKEL_CARD_HEAD_ONE = 40, SKEL_CARD_HEAD_TWO = 58;
/** A mark that tells a state, set up or not, is small: this much lower than a control. A mark that stands for a thing is as tall as one,
 *  and it stays so where it also tells that thing's state: a spec says `mark` and `on` together for it. */
const SKEL_MARK_DROP = 12;
const SKEL_CONTROLS = ["button", "field", "select", "checkbox", "switch", "tabs", "badge", "pager"];
/** The looks of a row of tabs a skeleton draws, in `DSTabsType`'s words (RULE.DEVEX.WORKSPACE.302). */
const SKEL_TABS_TYPES = ["LINE", "PILL"];
/** A badge stands this much lower than a control, and a switch's track this much, each on the row's centre line. */
const SKEL_BADGE_DROP = 8, SKEL_SWITCH_DROP = 12;
/** An icon before the word of a badge or a tab: a plain shape with no square around it. */
const SKEL_INLINE_ICON = 14;
/** The width a view is drawn at, for each screen class. It stands for the class, and is never a size on a screen. */
// THE DESKTOP TAKES THE GRID'S WIDTH, and the tablet and the phone share the next line, three parts to two, with
// the gap between them: 617 + 24 + 411 is the grid's 1052.
const SKEL_VIEW_W: Record<string, number> = { DESKTOP: 1052, TABLET: 617, MOBILE: 411 };
/** The task states a view may show, in `DSTaskStateType`'s own order (RULE.DEVEX.WORKSPACE.230). The views of one screen
 *  class are drawn in this order, after the view with no `state`, and a flow file's `state` names one of them. */
export const SKEL_TASK_STATES = ["IDLE", "WORKING", "DONE", "FAILED", "EMPTY", "DENIED"];
/** A view's name in a finding and over its drawing: its class, and the word of its state where it shows one. */
const skelViewName = (view: Pick<SkeletonView, "viewport" | "state">): string => (view.state ? `${view.viewport} · ${view.state}` : view.viewport);
const SKEL_STANDINS = ["rows", "cards", "field", "list", "table"];
/** A table's head row, and the room a body row has above and below its tallest cell. */
const SKEL_TABLE_HEAD = 24, SKEL_TABLE_ROW_PAD = 8;
/** The two lines of an item: its title, and its description under it. */
const SKEL_ITEM_LINE = 18;
const SKEL_ICONS = ["close", "add", "menu", "search", "more", "previous", "next", "select", "checkbox", "bell", "person", "default"];
/** The end arrows of an item line, in `DSIconType`'s own names (RULE.DEVEX.WORKSPACE.297): read only in an item line's `end`. */
const SKEL_END_ARROWS = ["ARROW_RIGHT", "ARROW_UP_RIGHT"];
/** Where an item line's facts stand against its description, in `DSItemFactsPlacementType`'s words (RULE.DEVEX.WORKSPACE.296). */
const SKEL_FACTS_PLACEMENTS = ["AFTER_DESCRIPTION", "AFTER_TITLE"];
/** A finding said once, however many times the drawer meets what it names. */
const skelSay = (findings: string[], message: string): void => { if (!findings.includes(message)) findings.push(message); };

/**
 * THE UNITS A SPEC MAY NAME: every unit the design system's barrel exports (`spn-support-ts`
 * `packages/support-web-ds-ts/src/index.ts` @ `368b3262`, and `DSFeatureGridSectionContainer` @ `v5.31.0`), leaving out its
 * contexts and its observers, which are no unit a page is drawn from. A `unit` that is not here is a finding, since a sketch
 * names the real unit.
 */
const SKEL_UNITS = new Set([
  "DSFeatureGridSectionContainer",
  "DSAccordion", "DSAccordionGroup", "DSActorView", "DSAddressForm", "DSAddressView", "DSAlert", "DSAnchor", "DSAnchorContainer",
  "DSApp", "DSAspectRatio", "DSAttachment", "DSAttachmentMulti", "DSAuthz", "DSAutocomplete", "DSAutocompleteMulti", "DSAvatar",
  "DSAvatarGroup", "DSBackdrop", "DSBadge", "DSBreadcrumb", "DSButton", "DSButtonGroup", "DSCalendar", "DSCard", "DSCardWidget",
  "DSCarousel", "DSCheckbox", "DSCheckboxGroup", "DSCodeBlockView", "DSCollapsible", "DSColorPicker", "DSColorView", "DSCommand",
  "DSCommandPalette", "DSComparison", "DSConfirmDialog", "DSConfirmPopover", "DSContextMenu", "DSDataFieldBuilder",
  "DSDataFieldForm", "DSDataFieldView", "DSDataTable", "DSDataTableContainer", "DSDataUnit", "DSDataUnitGroup", "DSDatePicker",
  "DSDateRangePicker", "DSDateTimePicker", "DSDialog", "DSDrawer", "DSDropdownMenu", "DSEmpty", "DSEntryOverlay", "DSFeature", "DSFilterBar",
  "DSForm", "DSFormatCurrency", "DSFormatDate", "DSFormatDateTime", "DSFormatNumber", "DSFormatTime", "DSHScroll", "DSHoverCard",
  "DSIcon", "DSImage", "DSImagePicker", "DSInput", "DSInputNumber", "DSInputOTP", "DSInputPhone", "DSItem", "DSItemCard",
  "DSItemFacts", "DSJSONControl", "DSJSONView", "DSKbd", "DSLabel", "DSLayout", "DSLink", "DSList", "DSListDetail", "DSMark",
  "DSMenubar", "DSNavBarSide", "DSNavBarTop", "DSNavEntry", "DSNavList", "DSNavMenu", "DSOverlayContainer", "DSPageLevel",
  "DSPagination", "DSPanelContainer", "DSPopover", "DSPortal", "DSProgress", "DSProgressCircle", "DSRadio", "DSRadioGroup",
  "DSScrollArea", "DSSectionContainer", "DSSelect", "DSSelectMulti", "DSSeparator", "DSSheet", "DSSkeleton", "DSSlider", "DSSliderRange", "DSSpinner",
  "DSStatusActiveView", "DSSticky", "DSSurface", "DSSwitch", "DSTable", "DSTabs", "DSTagGroup", "DSText", "DSTextarea",
  "DSThemeForm", "DSTimePicker", "DSToast", "DSToggle", "DSToggleGroup", "DSToggleGroupMulti", "DSToolbar", "DSTooltip",
]);
type SkelLevel = "container" | "widget" | "card" | "component";
/** THE LEVEL IS READ FROM THE UNIT'S SUFFIX (RULE.SUPPORT.SURFACE.229): a suffix names where a unit is placed, so `Container` is
 *  around a part of a page and `Widget` beside others, and a component, a composite included (`DSDataTable`, `DSFilterBar`),
 *  takes no suffix. A card stands at the level of a widget, and is told by its name. */
// `DSCardWidget` IS A CARD, the widget a page sets in a container or on the page, so it is drawn as one: its outline,
// its name and its title.
const skelLevel = (unit: string): SkelLevel =>
  /Container$/.test(unit) ? "container" : /Card(Widget)?$/.test(unit) ? "card" : /Widget$/.test(unit) ? "widget" : "component";
/** The look a level is drawn in where the frame names none: a container its outline, a card its outline and title,
 *  and a widget or a component a dotted boundary. */
const SKEL_LEVEL_LOOK: Record<SkelLevel, SkeletonFrame["look"]> = { container: "container", card: "card", widget: "flat", component: "flat" };
/** The word at the corner of a group: a part of a container's or a card's content with a title of its own, the level
 *  `GROUP` of the design system, which is no unit and so is named by its level. */
const SKEL_GROUP = "Group";
/** The name at a boundary's corner: its tag, and its unit. Every unit carries its name, a card as well as a widget, so a
 *  reader reads the levels of a page at a glance; a container draws its own at the corner of its outline, over its header. */
const skelCornerName = (frame: SkeletonFrame, surface = false): string | undefined => {
  const unit = frame.unit !== undefined && !surface ? frame.unit : undefined;
  return [frame.tag, unit].filter((s) => !!s).join(" · ") || undefined;
};
/** Whether a frame is a named boundary, which the nesting count counts. */
const skelNamed = (frame: SkeletonFrame): boolean => !!frame.tag || frame.unit !== undefined;

/** A SECTION OF A PAGE AND A FEATURE'S FRAMES, IN THE DESIGN SYSTEM'S OWN NAMES (RULE.DEVEX.WORKSPACE.285, .286, .288).
 *  A `DSSectionContainer` takes its fill as `color` and `strength`, its `inset`, and its room from its `size`; a `DSFeature` takes
 *  `items.surface`, and `frames` with `surface`. Each is drawn with a mark a frame's look already has, and never as a colour. */
const SKEL_SECTION = "DSSectionContainer", SKEL_FEATURE = "DSFeature", SKEL_GRID_SECTION = "DSFeatureGridSectionContainer";
const SKEL_SURFACE_COLORS = ["BASE", "DEFAULT", "PRIMARY"], SKEL_SURFACE_STRENGTHS = ["SUBTLE", "QUIET", "SOLID"];
const SKEL_FEATURE_PARTS = ["TEXT", "MEDIA"];
/** A section's room above and below its content, by its size: the section's room on a phone, which is also about its room on
 *  a desktop at the scale a desktop view draws the window. A section with no `size` keeps a boundary's padding. */
const SKEL_SECTION_ROOM: Record<string, number> = { XS: 24, SM: 32, MD: 56, LG: 64, XL: 72 };
type SkelSectionLook = Pick<SkeletonFrame, "color" | "strength" | "inset" | "size">;
/** A GRID SECTION DRAWS A SECTION FROM ITS `section` (RULE.DEVEX.WORKSPACE.293): its fill, its inset and its room are a section's own. */
const skelGridSectionOf = (frame: SkeletonFrame): SkelSectionLook | undefined =>
  frame.unit === SKEL_GRID_SECTION && frame.section !== null && typeof frame.section === "object" && !Array.isArray(frame.section) ? frame.section : undefined;
/** The fields a section is drawn with: a `DSSectionContainer`'s own, or a grid section's `section`. */
const skelSectionLook = (frame: SkeletonFrame): SkelSectionLook | undefined => (frame.unit === SKEL_SECTION ? frame : skelGridSectionOf(frame));
const skelSectionRoom = (frame: SkeletonFrame): number | undefined => {
  const look = skelSectionLook(frame);
  return look !== undefined && frame.look === "container" && look.size !== undefined ? SKEL_SECTION_ROOM[look.size] : undefined;
};
/** THE LINES BETWEEN A FEATURE'S ITEMS, AND BETWEEN A GRID SECTION'S CELLS, IN `DSGridBorderType`'S WORDS (RULE.DEVEX.WORKSPACE.289).
 *  `border` is `GRID` or `EDGE`; `across` draws a line between the parts of one row too, as a `GRID` of items and a grid of cells
 *  do, where a `LIST` has one item to a row; `cells` reads rows of `DSFeature` cells, where a feature reads rows of item lines. */
const SKEL_ITEMS_TYPES = ["GRID", "LIST", "STATS"], SKEL_BORDER_TYPES = ["NONE", "GRID", "EDGE"], SKEL_V_ALIGNS = ["TOP", "CENTER", "BOTTOM"];
const SKEL_GRID_CLASSES = ["desktop", "tablet", "mobile"];
type SkelLines = { border: string; across: boolean; cells: boolean };
/** Filled from the spec once, before it is drawn, each by the rows array it reads, which a view's copy of its frame keeps: the lines
 *  a frame's rows take; the number each item line carries (RULE.DEVEX.WORKSPACE.290); the rows that stand centred with a centred head
 *  (RULE.DEVEX.WORKSPACE.291); and the split rows of a feature with `verticalAlign`, each with its alignment (RULE.DEVEX.WORKSPACE.292). */
const skelLined = new WeakMap<object, SkelLines>();
const skelNumbers = new WeakMap<object, number>();
const skelCentred = new WeakSet<object>();
const skelAligned = new WeakMap<object, string>();
/** A FEATURE'S STATISTICS, `items.type` `STATS` (RULE.DEVEX.WORKSPACE.300): each item line of such a feature, kept with the sizes of its
 *  value and its label and whether the feature's head centres them. Filled from the spec once, before it is drawn. The design system
 *  draws a statistic one level below the feature's own: its value at the title step of that level and its label at its description
 *  step, which the drawer's head steps give as 20 · 15 · 13px and 14 · 13 · 12px under `PAGE`, `CONTAINER` and `WIDGET`. */
type SkelStat = { value: number; label: number; centre: boolean };
const skelStats = new WeakMap<object, SkelStat>();
const SKEL_STAT_VALUE: Record<string, number> = { PAGE: 20, CONTAINER: 15, WIDGET: 13 };
const SKEL_STAT_LABEL: Record<string, number> = { PAGE: 14, CONTAINER: 13, WIDGET: 12 };
/** Whether a row is one of the items its frame's lines part: item lines, or `DSFeature` cells, with spacers where a row is short. */
const skelLinedRow = (row: SkeletonRow, lines: SkelLines): boolean => {
  const real = (row?.items ?? []).filter((it) => !!it && typeof it === "object" && skelKind(it) !== "spacer");
  return real.length > 0 && real.every((it) => (lines.cells ? skelKind(it) === "frame" && it.frame!.unit === SKEL_FEATURE : skelKind(it) === "item"));
};
/** Whether a frame is a container drawn by its parts, its `frames` naming the parts that share a frame. A `DSFeature`'s
 *  `frames` names the parts of its own frame instead. */
const skelHasParts = (frame: SkeletonFrame): boolean => frame.frames !== undefined && frame.unit !== SKEL_FEATURE;
type SkelSurface = NonNullable<SkeletonFrame["surface"]>;
/** What a feature's own frame draws: its `surface`, or the feature's defaults where it gives none. */
const skelSurfaceOf = (frame: SkeletonFrame): SkelSurface =>
  frame.surface !== null && typeof frame.surface === "object" && !Array.isArray(frame.surface) ? frame.surface : {};
/** The item lines and the slots that stand in a frame of their own: each item line of a feature with `items.surface`, and
 *  each slot that is the media of a feature whose `frames` names `MEDIA`. Filled from the spec once, before it is drawn. */
const skelItemFrames = new WeakMap<object, SkelSurface>();
/** A boxed item line takes a boundary's padding on every side. */
const skelItemBox = (it: SkeletonItem): number => (skelItemFrames.has(it) ? SKEL_PAD * 2 : 0);
/** Whether a frame holds a slot, in its rows or in a region of them that is no unit of its own: a feature's media. */
const skelHoldsSlot = (frame: SkeletonFrame): boolean => (frame.rows ?? []).some((row) => skelRowHoldsSlot(row));
const skelItemHoldsSlot = (it: SkeletonItem): boolean =>
  skelKind(it) === "slot" || (skelKind(it) === "frame" && it.frame!.unit === undefined && skelHoldsSlot(it.frame!));
const skelRowHoldsSlot = (row: SkeletonRow): boolean => (row?.items ?? []).some((it) => !!it && typeof it === "object" && skelItemHoldsSlot(it));
/** A FEATURE OF `type` `BACKDROP` STANDS ITS MEDIA BEHIND ITS WORDS (RULE.DEVEX.WORKSPACE.305), as `DSFeature` lays its media under the words
 *  and the actions over the whole feature. Its media is the slot in a row of its own, which leaves the flow of the rows; the words, the
 *  actions and the items keep to three fifths of the feature's width on a tablet and a desktop, at the start or centred by `textAlign`,
 *  and to the whole of it on a phone, and with no screen class. Kept, once before the spec is drawn, by the rows the feature lays out. */
type SkelBackdrop = { media: SkeletonItem; measure: number; centre: boolean };
const skelBackdrops = new WeakMap<object, SkelBackdrop>();
const skelBackdropOf = (frame: SkeletonFrame): SkelBackdrop | undefined => (Array.isArray(frame.rows) ? skelBackdrops.get(frame.rows) : undefined);
const SKEL_BACKDROP_MEASURE = 3 / 5, SKEL_FEATURE_TYPES = ["BACKDROP"];
/** Which parts of a `DSFeature` its own frame is drawn round. `TEXT` with `MEDIA`, or `TEXT` where the feature has no media,
 *  is the whole feature; `MEDIA` alone is each slot; `TEXT` alone beside media is the words and the items. */
function skelFeatureFrames(frame: SkeletonFrame): { whole: boolean; text: boolean; media: boolean } {
  const parts = frame.unit === SKEL_FEATURE && Array.isArray(frame.frames) ? frame.frames : [];
  // A BACKDROP'S MEDIA LIES UNDER ITS WORDS, so a part named in `frames` frames the whole feature, as the design system frames it.
  if (skelBackdropOf(frame)) return { whole: parts.some((part) => SKEL_FEATURE_PARTS.includes(part)), text: false, media: false };
  const text = parts.includes("TEXT"), media = parts.includes("MEDIA"), hasMedia = parts.length > 0 && skelHoldsSlot(frame);
  const whole = text && (media || !hasMedia);
  return { whole, text: text && !whole, media: media && !whole && hasMedia };
}
/** A FRAME IS DRAWN WITH THE MARKS A FRAME'S LOOK ALREADY HAS: a thin outline, as a card's, solid where it is `bordered`; behind
 *  it the background of a raised frame where it is `raised` or its colour is not `BASE`; and a rounded corner unless `rounded`
 *  is false. How strong a fill is, and how far a raised frame stands off, are the library's look and draw no mark of their own. */
function skelSurfaceMarks(surface: SkelSurface, x: number, y: number, w: number, h: number): string[] {
  const rx = surface.rounded === false ? 0 : SKEL_ROUND;
  const filled = surface.raised === true || (surface.color !== undefined && surface.color !== "BASE");
  return [...(filled ? [skelRect("sds-skel-surface", x, y, w, h, rx)] : []), skelRect(surface.bordered === true ? "sds-skel-border" : "sds-skel-control", x, y, w, h, rx)];
}

/** A `DSAccordionGroup` WITH ITS ENTRIES, in `IDSAccordionGroupOption`'s names (RULE.DEVEX.WORKSPACE.301): a group that names its `options`
 *  draws them, one under another, each its header line with the indicator at its start and, where it is `expanded`, its `content` under
 *  it. A group written with `rows` and no `options` draws its rows as before. */
const SKEL_ACCORDION = "DSAccordionGroup";
const skelAccordionOf = (frame: SkeletonFrame): SkeletonAccordionOption[] | undefined =>
  frame.unit === SKEL_ACCORDION && Array.isArray(frame.options)
    ? frame.options.filter((option) => option !== null && typeof option === "object" && !Array.isArray(option)) : undefined;
/** THE WIDTH EACH OPEN ENTRY'S WORDS WERE WRAPPED AT, as a head's are: they wrap at a word to the entry's width, which a row learns only when
 *  it is drawn, so a spec that holds an accordion is drawn twice (`drawSkeleton`), and an entry drawn at two widths keeps the narrower. */
const skelAccordionWidths = new WeakMap<object, number>();
/** The words an open entry shows under its header, or none where it is closed or has no words. */
const skelAccordionWords = (option: SkeletonAccordionOption): string | undefined =>
  option.expanded === true && typeof option.content === "string" && option.content.trim() ? option.content : undefined;
const skelAccordionLines = (option: SkeletonAccordionOption, width: number): string[] => {
  const words = skelAccordionWords(option);
  return words === undefined ? [] : skelHeadWrap(words, width, (line) => skelWordW(line));
};
/** AN ENTRY IS ITS HEADER LINE, as tall as a control of its size, and under it an open entry's words, a line apart from it, or inside its
 *  own outline a boundary's padding round them where the group is `bordered`. */
const skelAccordionEntryH = (frame: SkeletonFrame, option: SkeletonAccordionOption, ctl: number): number => {
  const lines = skelAccordionLines(option, skelAccordionWidths.get(option) ?? Infinity).length;
  return ctl + (lines ? (frame.bordered === true ? SKEL_PAD * 2 : SKEL_LABEL_GAP) + lines * SKEL_ITEM_LINE : 0);
};
/** The entries stand one under another, the gap between parts apart. */
const skelAccordionH = (frame: SkeletonFrame, entries: SkeletonAccordionOption[], ctl: number): number =>
  entries.reduce((t, option) => t + skelAccordionEntryH(frame, option, ctl), 0) + SKEL_GAP * Math.max(0, entries.length - 1);
/** The room an entry needs across: its indicator, the gap and its header's words, or the widest word of its open words, and the padding
 *  of its outline where the group is `bordered`. */
const skelAccordionMinW = (frame: SkeletonFrame, entries: SkeletonAccordionOption[]): number => Math.max(0, ...entries.map((option) => {
  const words = skelAccordionWords(option) ?? "";
  return (frame.bordered === true ? SKEL_PAD * 2 : 0) + Math.max(SKEL_INLINE_ICON + SKEL_LABEL_GAP + skelStepW(String(option.header ?? ""), SKEL_STEP_ITEM),
    ...words.split(/\s+/).filter(Boolean).map((word) => skelWordW(word)));
}));
/** THE ENTRIES OF A GROUP, drawn from `(x, y)` across `w`. The indicator is the design system's chevron, at the start of the header line,
 *  pointing down while the entry is shut and turned up while it is open; the header's words stand at an item title's step. */
function skelDrawAccordion(frame: SkeletonFrame, entries: SkeletonAccordionOption[], x: number, y: number, w: number, ctl: number, out: string[]): void {
  const bordered = frame.bordered === true, pad = bordered ? SKEL_PAD : 0;
  let top = y;
  for (const option of entries) {
    const wrapAt = w - pad * 2, known = skelAccordionWidths.get(option);
    skelAccordionWidths.set(option, known === undefined ? wrapAt : Math.min(known, wrapAt));
    const lines = skelAccordionLines(option, wrapAt), entryH = skelAccordionEntryH(frame, option, ctl);
    if (bordered) out.push(skelRect("sds-skel-control", x, top, w, entryH, SKEL_ROUND));
    const cx = x + pad + SKEL_INLINE_ICON / 2, cy = top + ctl / 2, unit = SKEL_INLINE_ICON / 24;
    const at = (vx: number, vy: number): [number, number] => [cx - SKEL_INLINE_ICON / 2 + vx * unit, cy - SKEL_INLINE_ICON / 2 + vy * unit];
    out.push(...(option.expanded === true ? [skelPath("sds-skel-glyph", [[at(6, 15), at(12, 9), at(18, 15)]])] : skelGlyph("select", cx, cy, SKEL_INLINE_ICON)));
    out.push(skelStepText(String(option.header ?? ""), SKEL_STEP_ITEM, x + pad + SKEL_INLINE_ICON + SKEL_LABEL_GAP, cy + 4));
    if (lines.length) {
      // A BORDERED ENTRY THAT IS OPEN DIVIDES ITS HEADER FROM ITS BODY BY A LINE ACROSS ITS OUTLINE.
      if (bordered) out.push(`  <path class="sds-skel-control" d="M${r2(x)} ${r2(top + ctl)} H${r2(x + w)}"/>`);
      let lineTop = top + ctl + (bordered ? SKEL_PAD : SKEL_LABEL_GAP);
      for (const line of lines) {
        out.push(`  <text class="sds-code" x="${r2(x + pad)}" y="${Math.round(lineTop + 13)}">${esc(line)}</text>`);
        lineTop += SKEL_ITEM_LINE;
      }
    }
    top += entryH + SKEL_GAP;
  }
}
/** Whether a spec holds a group's entries anywhere, and so must be measured before it is drawn. */
const skelHasOptions = (value: unknown): boolean => Array.isArray(value) ? value.some(skelHasOptions)
  : value !== null && typeof value === "object" && ("options" in value || Object.values(value).some(skelHasOptions));

/** THE LAYOUT'S WORDS, and the fields of the three looks (`IDSLayoutBodyLook`, `IDSLayoutNavigationLook`,
 *  `IDSLayoutContentLook`); a sketch's navigation adds the words of its entries and the open one. */
const SKEL_LAYOUT_TYPES = ["RAIL", "DOCK", "TOPNAV", "CANVAS"];
const SKEL_LAYOUT_PARTS: Record<string, string[]> = {
  body: ["width", "maxWidth", "className"],
  navigation: ["attached", "sticky", "className", "nav", "chosen", "open"],
  content: ["bordered", "raised", "attached", "className"],
};
/** Below `FULL`, the body's box at a desktop: its share of a window 1920 wide, drawn in the view's 1052. */
const SKEL_BODY_W: Record<string, number> = { NARROW: 421, MEDIUM: 561, WIDE: 701, XWIDE: 842 };
const SKEL_BODY_WIDTHS = ["FULL", "XWIDE", "WIDE", "MEDIUM", "NARROW"];
/** A rail shut to icons on every device, and open only where a figure about the rail itself asks (`open`), at a desktop; a
 *  dock's column open at a desktop; a top bar and a phone's bar; how far a part that is not attached stands in; and the
 *  step of an entry of the navigation. */
const SKEL_RAIL_OPEN = 131, SKEL_RAIL_SHUT = 40, SKEL_LAYOUT_BAR = 48, SKEL_APART = 16, SKEL_NAV_STEP = 28;
/** The title of the page level is the largest of a surface's titles, a step over a container's. */
const SKEL_STEP_PAGE = 24;

type SkelKind = "frame" | "spacer" | "slot" | "item" | "head" | "standin" | "control" | "icon" | "place" | "plain" | "note";
/** Which shape an item is; `null` is the thing the spec refuses. A tag with no other claim is a named place. */
const skelKind = (it: SkeletonItem): SkelKind | null =>
  it.frame ? "frame" : it.spacer ? "spacer" : it.slot !== undefined ? "slot" : it.item !== undefined ? "item"
    : it.head !== undefined ? "head"
    : it.standin !== undefined || it.lines !== undefined ? "standin"
    : it.control !== undefined ? "control" : it.icon !== undefined ? "icon"
    : it.tag !== undefined ? "place" : it.text !== undefined ? "plain" : it.note !== undefined ? "note" : null;

/** `tone` as a colour and `em` on a word are not read: the finding names the field that replaces each. */
function skelOldFields(holder: SkeletonItem | SkeletonFrame, findings: string[]): void {
  const said = (message: string) => { if (!findings.includes(message)) findings.push(message); };
  const old = holder as { tone?: string; em?: boolean; off?: boolean; warn?: boolean };
  if (old.tone !== undefined) said("a skeleton no longer reads `tone`; a place is told apart by its mark, so give a frame a `look` of `raised`, `bordered` or `flat`");
  if (old.em !== undefined) said("a skeleton no longer reads `em`; a title is plain `text`, and the main action is a `control` with `main: true`");
  if (old.off !== undefined) said("a skeleton no longer reads `off`; muted words are a `note`");
  if (old.warn !== undefined) said("a skeleton no longer reads `warn`; a skeleton shows an arrangement, so say it in a `note`");
}

const skelWordW = (s: string) => Math.ceil(s.length * SKEL_W_LABEL);
const skelTextW = (s: string) => Math.ceil(s.length * SKEL_W_LABEL + SKEL_PAD * 2);
const skelTagW = (s: string) => Math.ceil(s.length * SKEL_W_NOTE + SKEL_PAD * 2);
const skelPagerParts = (it: SkeletonItem) => (it.text ?? "‹ 1 2 3 ›").split(/\s+/).filter(Boolean);
const skelPartW = (part: string, h: number) => Math.max(h, Math.ceil(part.length * SKEL_W_LABEL + SKEL_PAD));
const skelIconOnly = (it: SkeletonItem) => skelKind(it) === "icon" && it.text === undefined;
/** A switch, a row of tabs and a badge keep their own width: none of them takes the rest of a row. */
const skelOwnWidth = (it: SkeletonItem) => it.control === "switch" || it.control === "tabs" || it.control === "badge";
const skelSwitchW = (h: number) => Math.round((h - SKEL_SWITCH_DROP) * 1.8);
const skelInlineIconW = (it: SkeletonItem) => (it.icon !== undefined ? SKEL_INLINE_ICON + SKEL_PACK_GAP : 0);
const skelTabWords = (it: SkeletonItem) => (Array.isArray(it.tabs) ? it.tabs.map(String) : []);
const skelTabW = (it: SkeletonItem, word: string) => skelInlineIconW(it) + skelWordW(word);
const r2 = (n: number) => Math.round(n * 100) / 100;

/** A cell of a table as an item: a word is a note, and anything else is the item it is given as. */
const skelCell = (cell: string | SkeletonItem | undefined): SkeletonItem => (typeof cell === "string" ? { note: cell } : cell ?? { note: "" });
const SKEL_CELL_KINDS: (SkelKind | null)[] = ["plain", "note", "icon", "control"];
/** The width each column of a table needs: its head word, or its widest cell. */
function skelTableColumns(it: SkeletonItem, h: number): number[] {
  const columns = Array.isArray(it.columns) ? it.columns : [];
  const rows = Array.isArray(it.cells) ? it.cells : [];
  return columns.map((head, c) => Math.max(skelWordW(String(head)), ...rows.map((row) => skelFixedWidth(skelCell(row[c]), h))));
}
const skelTableW = (it: SkeletonItem, h: number): number => {
  const widths = skelTableColumns(it, h);
  return SKEL_PAD * 2 + widths.reduce((t, w) => t + w, 0) + SKEL_GAP * Math.max(0, widths.length - 1);
};
const skelTableRowH = (h: number) => h + SKEL_TABLE_ROW_PAD * 2;
const skelTableH = (it: SkeletonItem, h: number) => SKEL_PAD + SKEL_TABLE_HEAD + (Array.isArray(it.cells) ? it.cells.length : 0) * skelTableRowH(h) + SKEL_LABEL_GAP;
/** The width of what stands at the end of an item line, with the gaps between its parts. */
const skelItemEndW = (it: SkeletonItem, h: number): number => {
  const end = it.item?.end ?? [];
  return end.reduce((t, e) => t + skelFixedWidth(e, h), 0) + SKEL_LABEL_GAP * Math.max(0, end.length - 1);
};
/** THE TITLES OF A SURFACE STAND IN STEPS, as the design system's type steps do: a container's title is the largest,
 *  a card's a step under it, and the title of a part of the content a step under that, all three heavy. An item's
 *  title names one thing among the content, so it is smaller and of medium weight. A step is told by size and
 *  weight together, and the size is written on the word, since the stylesheet has one size for a title. */
const SKEL_CARD_MARK = 22;
const SKEL_STEP_CONTAINER = 20, SKEL_STEP_CARD = 15, SKEL_STEP_PART = 13, SKEL_STEP_ITEM = 12;
const skelStepW = (words: string, step: number) => Math.ceil(words.length * SKEL_W_TITLE * step / SKEL_STEP_PART);
const skelStepText = (words: string, step: number, x: number, y: number) =>
  `  <text class="sds-title" x="${r2(x)}" y="${Math.round(y)}" style="font-size:${step}px${step === SKEL_STEP_ITEM ? ";font-weight:500" : ""}">${esc(words)}</text>`;
/** The facts on the line under an item's title: its description first, then each of `meta`. */
const skelItemFacts = (it: SkeletonItem): (string | SkeletonItem)[] =>
  [...(it.item?.description !== undefined && !it.item?.meta?.length ? [it.item.description] : []), ...(it.item?.meta ?? [])];
/** AN ITEM HAS UP TO THREE LEVELS: its title, a description that is plain words, and a line of facts. Each of the
 *  last two is there only where the data has it. Where both are, the description stands on a line of its own. */
const skelItemOwnDescription = (it: SkeletonItem): string | undefined => (it.item?.meta?.length ? it.item?.description : undefined);
const skelItemDescriptionH = (it: SkeletonItem) => (skelItemOwnDescription(it) !== undefined ? SKEL_ITEM_LINE : 0);
/** AN ITEM MARKED `inline` WITH FACTS AND NO DESCRIPTION STANDS ONE LINE: its facts follow its title after a dot, as
 *  the library's item draws a compact row at the level INLINE. */
const skelItemInline = (it: SkeletonItem): boolean => it.item?.inline === true && skelItemFacts(it).length > 0 && skelItemOwnDescription(it) === undefined;
/** A dot stands between every two facts, a badge among them: a line may hold two badges, or a badge with an icon,
 *  and one mark between all of them reads the same wherever it falls. */
const SKEL_FACT_DOT = "·", SKEL_FACT_DOT_W = 16;
/** A word on the facts line is measured closer than a note elsewhere, so the dot stands midway between two facts. */
const SKEL_W_FACT = 5.9;
/** A BADGE ON THE LINE OF FACTS IS AS TALL AS THE WORDS BESIDE IT, and not as tall as a badge that stands alone. */
const SKEL_FACT_BADGE = 16, SKEL_FACT_CTL = SKEL_FACT_BADGE + 8;
/** A word on the facts line is measured letter by letter, since capitals and digits are wider than small letters and a dot must not touch the word before it. */
const skelFactTextW = (words: string) => Math.ceil([...words].reduce((t, c) => t + (/[A-Z0-9@]/.test(c) ? 7.4 : /[mwMW]/.test(c) ? 9.2 : /[iljt.,:;' ]/.test(c) ? 3.6 : SKEL_W_FACT + 0.3), 0));
const skelFactW = (fact: string | SkeletonItem, _h: number) => (typeof fact === "string" ? skelFactTextW(fact) : skelFixedWidth(fact, SKEL_FACT_CTL));
/** The width of one line of facts, with a dot between every two. */
const skelFactsW = (facts: (string | SkeletonItem)[], h: number): number =>
  facts.reduce((t: number, fact, i) => t + skelFactW(fact, h) + (i ? SKEL_FACT_DOT_W : 0), 0);
const skelItemFactsW = (it: SkeletonItem, h: number): number => skelFactsW(skelItemFacts(it), h);
const skelItemHasBadge = (it: SkeletonItem) => skelItemFacts(it).some((fact) => typeof fact !== "string");
const skelItemStep = (it: SkeletonItem) => (it.page ? SKEL_STEP_PAGE : it.part ? SKEL_STEP_CONTAINER : SKEL_STEP_ITEM);
/** A NUMBERED ITEM'S NUMBER STANDS BEFORE ITS TITLE, on the title's line, at its size and weight, and a small gap from it. */
const SKEL_NUMBER_GAP = 6;
const skelItemNumber = (it: SkeletonItem): string | undefined => (skelNumbers.has(it) ? `${skelNumbers.get(it)}.` : undefined);
const skelItemNumberW = (it: SkeletonItem): number => {
  const number = skelItemNumber(it);
  return number === undefined ? 0 : skelStepW(number, skelItemStep(it)) + SKEL_NUMBER_GAP;
};
const skelItemTitleW = (it: SkeletonItem) => skelItemNumberW(it) + skelStepW(it.item?.title ?? "", skelItemStep(it));
const skelItemWordsW = (it: SkeletonItem, h: number) => skelItemInline(it) ? skelItemTitleW(it) + SKEL_FACT_DOT_W + skelItemFactsW(it, h)
  : Math.max(skelItemTitleW(it), skelItemFactsW(it, h), Math.ceil((skelItemOwnDescription(it) ?? "").length * SKEL_W_NOTE));
/** An item with a line under its title stands two lines tall, and a little taller where that line holds a badge. This is its height
 *  with each of its words on one line; `skelItemH` adds the lines its words wrap to. */
const skelItemBaseH = (it: SkeletonItem, h: number) => skelStats.has(it) ? skelStatH(it) : !skelItemFacts(it).length || skelItemInline(it) ? h
  : skelItemDescriptionH(it) + (skelItemHasBadge(it) ? Math.max(h, SKEL_ITEM_LINE + SKEL_PACK_GAP + SKEL_FACT_BADGE + SKEL_LABEL_GAP) : Math.max(h, SKEL_ITEM_LINE * 2 + SKEL_LABEL_GAP));
const skelItemH = (it: SkeletonItem, h: number) => skelItemBaseH(it, h) + skelItemWrapH(it, h);
/** THE MEDIA OF AN ITEM IS AS LARGE AS THE LINES BESIDE IT: beside a title alone it is as tall as a control, and
 *  beside a title with a description it stands the height of both, so a picture is in proportion to what it names. Words that
 *  wrap to more lines leave it the size it has beside one line of each. */
const skelItemMediaD = (it: SkeletonItem, h: number) => (skelItemFacts(it).length && !skelItemInline(it) ? skelItemBaseH(it, h) - 4 : h);

/** TEXT THAT FITS (RULE.DEVEX.WORKSPACE.303): an item line's description, its line of facts, a head's line of facts and a note wrap at a
 *  word to their column, as a head's description does, where they run past it; words that fit stand as written. Their room is learnt
 *  as a head's is, so a spec is drawn twice (`drawSkeleton`): the width each was drawn at is kept here, by the line or the note it is,
 *  and a part drawn at two widths keeps the narrower. A line of facts breaks between two facts, and a fact in words longer than the
 *  column breaks at a word; a badge never breaks. A wrapped line of facts steps 18px, or 20px where it holds a badge. */
const skelWrapWidths = new WeakMap<object, number>();
const skelWrapKeep = (key: unknown, width: number): void => {
  if (key === null || typeof key !== "object") return;
  const known = skelWrapWidths.get(key);
  skelWrapWidths.set(key, known === undefined ? width : Math.min(known, width));
};
const skelWrapAt = (key: unknown): number => (key !== null && typeof key === "object" ? skelWrapWidths.get(key) ?? Infinity : Infinity);
const SKEL_FACT_BADGE_STEP = SKEL_PACK_GAP + SKEL_FACT_BADGE;
const skelNoteW = (words: string) => Math.ceil(words.length * SKEL_W_NOTE);
/** Words wrapped at a word to `width` where they run past it, and kept whole, as written, where they fit. */
const skelWrapWords = (words: string, width: number, measure: (line: string) => number): string[] =>
  measure(words) <= width ? [words] : skelHeadWrap(words, width, measure);
/** The widest word of `words`: the least room they wrap to. */
const skelWordsMinW = (words: string, measure: (line: string) => number): number =>
  Math.max(0, ...words.split(/\s+/).filter(Boolean).map(measure));
/** One line of facts: each fact, and whether a dot stands before it. */
type SkelFactLine = { fact: string | SkeletonItem; dot: boolean }[];
const skelFactLineW = (line: SkelFactLine, h: number): number => line.reduce((t, entry) => t + skelFactW(entry.fact, h) + (entry.dot ? SKEL_FACT_DOT_W : 0), 0);
/** The least room a fact takes: a badge whole, and words their widest word. */
const skelFactMinW = (fact: string | SkeletonItem, h: number): number => (typeof fact === "string" ? skelWordsMinW(fact, skelFactTextW) : skelFactW(fact, h));
function skelWrapFacts(facts: (string | SkeletonItem)[], width: number, h: number): SkelFactLine[] {
  if (skelFactsW(facts, h) <= width) return [facts.map((fact, i) => ({ fact, dot: i > 0 }))];
  const lines: SkelFactLine[] = [[]];
  let used = 0;
  for (const fact of facts) {
    let line = lines[lines.length - 1];
    const own = skelFactW(fact, h);
    if (line.length && used + SKEL_FACT_DOT_W + own <= width) { line.push({ fact, dot: true }); used += SKEL_FACT_DOT_W + own; continue; }
    if (line.length) { line = []; lines.push(line); }
    if (typeof fact === "string" && own > width) {
      skelHeadWrap(fact, width, skelFactTextW).forEach((piece, i) => {
        if (i) { line = []; lines.push(line); }
        line.push({ fact: piece, dot: false });
        used = skelFactTextW(piece);
      });
    } else { line.push({ fact, dot: false }); used = own; }
  }
  return lines;
}
/** The lines an item line's words stand on, at the width it was drawn at: its own description's, and its facts'. */
function skelItemWrapped(it: SkeletonItem, h: number): { description: string[]; facts: SkelFactLine[] } {
  const width = skelWrapAt(it.item), own = skelItemOwnDescription(it), facts = skelItemFacts(it);
  return { description: own !== undefined ? skelWrapWords(own, width, skelNoteW) : [], facts: facts.length ? skelWrapFacts(facts, width, h) : [] };
}
/** The room the lines an item's words wrap to add under its one line of each. A statistic and an inline line never wrap. */
function skelItemWrapH(it: SkeletonItem, h: number): number {
  if (skelStats.has(it) || skelItemInline(it) || !skelItemFacts(it).length) return 0;
  const { description, facts } = skelItemWrapped(it, h);
  return Math.max(0, description.length - 1) * SKEL_ITEM_LINE + Math.max(0, facts.length - 1) * (skelItemHasBadge(it) ? SKEL_FACT_BADGE_STEP : SKEL_ITEM_LINE);
}
/** A note's lines at the width it was drawn at; a line of code never wraps. */
const skelNoteLines = (it: SkeletonItem): string[] => (skelCode.has(it) || typeof it.note !== "string" ? [it.note!] : skelWrapWords(it.note, skelWrapAt(it), skelWordW));

/** CODE AND A ROW OF TABS SCROLL SIDEWAYS (RULE.DEVEX.WORKSPACE.304), as `DSCodeBlockView` scrolls a long line inside its block and `DSTabs`
 *  scrolls a long row in `DSHScroll`: wider than their column, they keep their width and are cut at its end, where a mark stands, the
 *  design system's arrow at an edge that has more. Each line of a `DSCodeBlockView` that is a note is code, kept here before it is drawn. */
const SKEL_CODE = "DSCodeBlockView";
const skelCode = new WeakSet<object>();
const skelScrolls = (it: SkeletonItem): boolean => skelCode.has(it) || it.control === "tabs";
/** The mark at the cut edge: a round tile with the `next` shape, standing in from the edge on the line's centre, and the least room a
 *  scrolling part takes. */
const SKEL_SCROLL_MARK = 20, SKEL_SCROLL_MIN = SKEL_SCROLL_MARK * 2;
const skelScrollMark = (edge: number, mid: number): string[] => [
  skelRect("sds-skel-surface", edge - SKEL_SCROLL_MARK, mid - SKEL_SCROLL_MARK / 2, SKEL_SCROLL_MARK, SKEL_SCROLL_MARK, SKEL_SCROLL_MARK / 2),
  skelRect("sds-skel-control", edge - SKEL_SCROLL_MARK, mid - SKEL_SCROLL_MARK / 2, SKEL_SCROLL_MARK, SKEL_SCROLL_MARK, SKEL_SCROLL_MARK / 2),
  ...skelGlyph("next", edge - SKEL_SCROLL_MARK / 2, mid, 12),
];
/** AN ITEM'S MEDIA IS READ IN `IDSItemMedia`'S KINDS (RULE.DEVEX.WORKSPACE.294). A name written as a word is a mark, as before; `ICON` is
 *  a bare icon, named in `node`; `MARK` is a mark holding `icon`. A kind an item line does not take keeps a mark's place. */
const SKEL_ITEM_MEDIA = ["ICON", "MARK"];
const skelMediaGiven = (media: unknown): media is SkeletonMedia => media !== null && typeof media === "object" && !Array.isArray(media);
const skelItemMediaOf = (media: unknown): { bare: boolean; shape: string } =>
  !skelMediaGiven(media) ? { bare: false, shape: media as string }
    : media.mtype === "ICON" ? { bare: true, shape: media.node ?? "default" } : { bare: false, shape: media.mtype === "MARK" ? media.icon ?? "default" : "default" };
/** A BARE ICON IS AS LARGE AS THE TITLE, and stands on the title's first line with no circle and no square round it. */
const skelItemIconW = (it: SkeletonItem) => Math.round(skelItemStep(it) * 4 / 3);
const skelItemMediaW = (it: SkeletonItem, h: number): number =>
  it.item?.media === undefined ? 0 : (skelItemMediaOf(it.item.media).bare ? skelItemIconW(it) : skelItemMediaD(it, h)) + SKEL_LABEL_GAP;
const skelItemW = (it: SkeletonItem, h: number): number => skelStats.has(it) ? skelStatW(it)
  : skelItemMediaW(it, h) + skelItemWordsW(it, h) + (it.item?.end?.length ? SKEL_GAP + skelItemEndW(it, h) : 0);
/** The least room an item line takes (RULE.DEVEX.WORKSPACE.303): its title, which never wraps, or the widest word of its description or
 *  fact, or its widest badge, beside its media and its end. A statistic and an inline line take their whole width. */
const skelItemMinW = (it: SkeletonItem, h: number): number => skelStats.has(it) || skelItemInline(it) || !skelItemFacts(it).length ? skelItemW(it, h)
  : skelItemMediaW(it, h) + Math.max(skelItemTitleW(it), ...skelItemFacts(it).map((fact) => skelFactMinW(fact, h)), skelWordsMinW(skelItemOwnDescription(it) ?? "", skelNoteW))
    + (it.item?.end?.length ? SKEL_GAP + skelItemEndW(it, h) : 0);
/** The width of the words of an item line drawn `lineW` wide: what its media and its end leave. */
const skelItemWordsAt = (it: SkeletonItem, h: number, lineW: number): number =>
  lineW - skelItemMediaW(it, h) - (it.item?.end?.length ? SKEL_GAP + skelItemEndW(it, h) : 0);
/** A STATISTIC IS ITS VALUE OVER ITS LABEL, one block as tall as its two lines, as the design system stacks them with no room between
 *  (RULE.DEVEX.WORKSPACE.300). It is as wide as the wider of the two. */
const skelStatOf = (it: SkeletonItem): SkelStat => skelStats.get(it)!;
const skelStatLabel = (it: SkeletonItem): string | undefined => (typeof it.item?.description === "string" && it.item.description ? it.item.description : undefined);
const skelStatH = (it: SkeletonItem): number => {
  const stat = skelStatOf(it);
  return skelHeadLine(stat.value) + (skelStatLabel(it) !== undefined ? skelHeadLine(stat.label) : 0);
};
const skelStatW = (it: SkeletonItem): number => {
  const stat = skelStatOf(it), label = skelStatLabel(it);
  return Math.max(skelStepW(String(it.item?.title ?? ""), stat.value), label !== undefined ? skelHeadDescriptionW(label, stat.label) : 0);
};

/** A FEATURE'S HEAD IS DRAWN AT ITS LEVEL, IN `DSFeature`'S OWN NAMES (RULE.DEVEX.WORKSPACE.284): its title at its level's step,
 *  heavy; its description a step larger than an item's words, quiet; the eyebrow in small capitals, packed above the title;
 *  and the facts on one line under the description, as an item's `meta` stands. Every size is larger than an item's, so the
 *  head leads and the items follow. `CONTAINER`, a feature in a section, is the level where `pageLevel` is left out. */
type SkelHead = NonNullable<SkeletonItem["head"]>;
const SKEL_HEAD_LEVELS = ["PAGE", "CONTAINER", "WIDGET"], SKEL_HEAD_ALIGNS = ["START", "CENTER"];
const SKEL_HEAD_TITLE: Record<string, number> = { PAGE: SKEL_STEP_PAGE, CONTAINER: SKEL_STEP_CONTAINER, WIDGET: SKEL_STEP_CARD };
const SKEL_HEAD_DESCRIPTION: Record<string, number> = { PAGE: 16, CONTAINER: 14, WIDGET: 13 };
/** The eyebrow's size and the gap between it and the title; the gap between the title, the description and the facts. */
const SKEL_HEAD_EYEBROW = 11, SKEL_HEAD_EYEBROW_GAP = 6, SKEL_HEAD_GAP = 8;
/** A line of the head is this much taller than its words. */
const SKEL_HEAD_LEADING = 1.25;
/** The size a note's measure, `SKEL_W_NOTE`, is taken at, and the measure of a spaced capital of the eyebrow. */
const SKEL_HEAD_NOTE_SIZE = 11, SKEL_HEAD_W_CAPS = 8;
/** A spec's head, or an empty one where it wrote something that is not one, so a finding names it and nothing throws. */
const skelHeadOf = (it: SkeletonItem): SkelHead => (it.head !== null && typeof it.head === "object" ? it.head : ({} as SkelHead));
const skelHeadLevel = (head: SkelHead): string => (SKEL_HEAD_LEVELS.includes(head.pageLevel as string) ? head.pageLevel! : "CONTAINER");
const skelHeadLine = (size: number) => Math.round(size * SKEL_HEAD_LEADING);
const skelHeadDescriptionW = (words: string, size: number) => Math.ceil(words.length * SKEL_W_NOTE * size / SKEL_HEAD_NOTE_SIZE);
const skelHeadEyebrowW = (words: string) => Math.ceil(words.length * SKEL_HEAD_W_CAPS);
/** The facts under a head, as an item's `meta` holds them: a badge as itself, and a fact that is only words as its words. */
const skelHeadFacts = (head: SkelHead): (string | SkeletonItem)[] => (Array.isArray(head.facts) ? head.facts : []).map((fact) =>
  typeof fact === "string" ? fact
    : fact !== null && typeof fact === "object" && fact.control === undefined && (skelKind(fact) === "plain" || skelKind(fact) === "note") ? String(fact.text ?? fact.note)
    : fact);
/** Words wrapped at a word to `width`, each line measured by `measure`. A word wider than the width stands on a line of its own. */
function skelHeadWrap(words: string, width: number, measure: (line: string) => number): string[] {
  const lines: string[] = [];
  for (const word of words.split(/\s+/).filter(Boolean)) {
    const last = lines.at(-1);
    if (last !== undefined && measure(`${last} ${word}`) <= width) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}
/** A HEAD'S MEDIA STANDS OVER ITS WORDS, in the box of its level (RULE.DEVEX.WORKSPACE.294), as a feature draws its media on top below
 *  `PAGE`: a `MARK` or an `AVATAR`, 48px at `CONTAINER` and 40px at `WIDGET`, 12px above the eyebrow or the title. A feature at
 *  `PAGE` stands its media beside its words, so a head there draws none over them. */
const SKEL_HEAD_MEDIA = ["MARK", "AVATAR"];
const SKEL_HEAD_MEDIA_BOX: Record<string, number> = { CONTAINER: 48, WIDGET: 40 }, SKEL_HEAD_MEDIA_GAP = 12;
const skelHeadMediaBox = (head: SkelHead): number =>
  skelMediaGiven(head.media) && SKEL_HEAD_MEDIA.includes(head.media.mtype) ? SKEL_HEAD_MEDIA_BOX[skelHeadLevel(head)] ?? 0 : 0;
/** A BADGE EYEBROW IS ONE OF THE FACTS' BADGES (RULE.DEVEX.WORKSPACE.295), on a line as tall as a badge among the facts, packed above the title. */
const SKEL_HEAD_BADGE_LINE = SKEL_FACT_BADGE + 4;
const skelHeadBadge = (head: SkelHead): SkeletonItem | undefined =>
  head.eyebrow !== null && typeof head.eyebrow === "object" && !Array.isArray(head.eyebrow) && head.eyebrow.control === "badge" ? head.eyebrow : undefined;
/** The initials an avatar shows where it has no picture: the first letter of the first two words of its name. */
const skelInitials = (title: string): string => title.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => [...word][0].toUpperCase()).join("");

/** THE HEAD IS ONE BLOCK AS TALL AS ITS LINES, and takes no control's height: its media's box and the gap, the eyebrow's line, the
 *  gap, every line of the title, the gap and every line of the description, the gap and the line of facts. Each line is placed
 *  from the head's top. */
type SkelHeadLine = { part: "eyebrow" | "title" | "description"; words: string; size: number; top: number; w: number };
function skelHeadLayout(head: SkelHead, width: number): { lines: SkelHeadLine[]; factsTop?: number; factLines: SkelFactLine[]; factStep: number; height: number; mediaBox: number; badgeTop?: number } {
  const level = skelHeadLevel(head), step = SKEL_HEAD_TITLE[level], size = SKEL_HEAD_DESCRIPTION[level];
  const lines: SkelHeadLine[] = [];
  let y = 0;
  const put = (part: SkelHeadLine["part"], words: string, at: number, measure: (line: string) => number) => {
    for (const wrapped of skelHeadWrap(words, width, measure)) { lines.push({ part, words: wrapped, size: at, top: y, w: measure(wrapped) }); y += skelHeadLine(at); }
  };
  const mediaBox = skelHeadMediaBox(head);
  if (mediaBox) y = mediaBox + SKEL_HEAD_MEDIA_GAP;
  // THE EYEBROW IS WRITTEN IN A SENTENCE'S CASE AND DRAWN IN CAPITALS, on one line; a badge there stands on a badge's line.
  let badgeTop: number | undefined;
  if (typeof head.eyebrow === "string" && head.eyebrow) {
    const capitals = head.eyebrow.toUpperCase();
    lines.push({ part: "eyebrow", words: capitals, size: SKEL_HEAD_EYEBROW, top: y, w: skelHeadEyebrowW(capitals) });
    y += skelHeadLine(SKEL_HEAD_EYEBROW) + SKEL_HEAD_EYEBROW_GAP;
  } else if (skelHeadBadge(head)) { badgeTop = y; y += SKEL_HEAD_BADGE_LINE + SKEL_HEAD_EYEBROW_GAP; }
  if (typeof head.title === "string") put("title", head.title, step, (line) => skelStepW(line, step));
  if (typeof head.description === "string" && head.description) {
    y += SKEL_HEAD_GAP;
    put("description", head.description, size, (line) => skelHeadDescriptionW(line, size));
  }
  // THE LINE OF FACTS WRAPS TO THE HEAD'S COLUMN (RULE.DEVEX.WORKSPACE.303), between two facts, each further line a step under the last.
  let factsTop: number | undefined, factLines: SkelFactLine[] = [];
  const facts = skelHeadFacts(head), factStep = facts.some((fact) => typeof fact !== "string") ? SKEL_FACT_BADGE_STEP : SKEL_ITEM_LINE;
  if (facts.length) {
    factLines = skelWrapFacts(facts, width, 0);
    y += SKEL_HEAD_GAP; factsTop = y; y += SKEL_ITEM_LINE + (factLines.length - 1) * factStep;
  }
  return { lines, factsTop, factLines, factStep, height: y, mediaBox, badgeTop };
}
/** THE WIDTH EACH HEAD WAS DRAWN AT. A head's lines wrap to the width its row gives it, and a row is laid out only when it is
 *  drawn, after the heights are counted; widths never depend on heights. So a spec that holds a head is drawn twice: once
 *  to learn each head's width here, and once with its wrapped lines counted in its height (`drawSkeleton`). A head drawn
 *  at two widths keeps the narrower, so its room is never short. */
const skelHeadWidths = new WeakMap<object, number>();
const skelHeadH = (it: SkeletonItem): number => {
  const head = skelHeadOf(it);
  return skelHeadLayout(head, skelHeadWidths.get(head) ?? Infinity).height;
};
/** The room a head needs across: what does not wrap, its media, its eyebrow and its widest fact. Its title, its description and its line
 *  of facts wrap. */
const skelHeadMinW = (it: SkeletonItem, h: number): number => {
  const head = skelHeadOf(it), badge = skelHeadBadge(head);
  return Math.max(typeof head.eyebrow === "string" ? skelHeadEyebrowW(head.eyebrow) : 0, ...skelHeadFacts(head).map((fact) => skelFactMinW(fact, h)),
    ...(badge ? [skelFixedWidth(badge, SKEL_FACT_CTL)] : []), skelHeadMediaBox(head));
};
/** Whether a spec holds a head anywhere, and so must be measured before it is drawn. */
const skelHasHead = (value: unknown): boolean => Array.isArray(value) ? value.some(skelHasHead)
  : value !== null && typeof value === "object" && ("head" in value || Object.values(value).some(skelHasHead));
/** Whether a spec holds an item line or a note anywhere, whose words may wrap, and so must be measured before it is drawn. */
const skelHasWords = (value: unknown): boolean => Array.isArray(value) ? value.some(skelHasWords)
  : value !== null && typeof value === "object" && ("item" in value || "note" in value || Object.values(value).some(skelHasWords));

/** An item's own width where it has one; a `fill` item or a frame takes what the row has left. */
function skelFixedWidth(it: SkeletonItem, h: number): number {
  switch (skelKind(it)) {
    case "plain": return it.part ? skelStepW(it.text!, SKEL_STEP_PART) : skelWordW(it.text!);
    case "note": return skelWordW(it.note!);
    case "place": return it.fill ? 0 : Math.max(it.text !== undefined ? skelTextW(it.text) : 0, skelTagW(it.tag!), SKEL_PAD * 2);
    case "slot": return it.fill ? 0 : Math.max(skelTagW(it.slot!), SKEL_PAD * 2);
    case "standin": return it.standin === "table" ? (it.fill ? 0 : skelTableW(it, h)) : it.fill ? 0 : SKEL_LINES_W;
    case "item": return it.fill ? 0 : skelItemW(it, h) + skelItemBox(it);
    case "head": return 0; // a head takes the rest of its row, and wraps to it
    case "icon": return h + (it.text !== undefined ? SKEL_LABEL_GAP + skelWordW(it.text) : 0);
    case "control": {
      const text = it.text ?? "";
      if (it.control === "pager") {
        const parts = skelPagerParts(it);
        return parts.reduce((t, p) => t + skelPartW(p, h), 0) + SKEL_PACK_GAP * (parts.length - 1);
      }
      if (it.control === "checkbox") return h + (text ? SKEL_LABEL_GAP + skelWordW(text) : 0);
      if (it.control === "switch") return skelSwitchW(h) + (text ? SKEL_LABEL_GAP + skelWordW(text) : 0);
      if (it.control === "tabs") {
        const words = skelTabWords(it);
        return words.reduce((t, word) => t + skelTabW(it, word), 0) + SKEL_GAP * Math.max(0, words.length - 1);
      }
      if (it.control === "badge") return SKEL_LABEL_GAP * 2 + skelInlineIconW(it) + skelWordW(text);
      if (it.fill) return 0;
      if (it.control === "field") return Math.max(skelTextW(text), SKEL_FIELD_W);
      if (it.control === "select") return skelTextW(text) + SKEL_PAD + 8;
      return Math.max(skelTextW(text), SKEL_PAD * 2);
    }
    default: return 0; // a frame never sets the row's shared width — it takes a fraction of it, or what is left
  }
}

/** A form field's title line, and the one line under its control: its error, or else its description. A field
 *  with its own words keeps the room of that line where it has neither, so the fields of a row stand level. */
const skelFieldHeadH = (it: SkeletonItem) => (it.label !== undefined ? SKEL_ITEM_LINE : SKEL_HEAD_BAR);
const skelFieldBelow = (it: SkeletonItem): string | undefined => it.error ?? it.description;
const skelFieldBelowH = (it: SkeletonItem) => (it.label !== undefined || skelFieldBelow(it) !== undefined ? SKEL_PACK_GAP + SKEL_ITEM_LINE : 0);
const SKEL_FAIL = "var(--sds-fail)";
/** The height of the value of a field that is read: a line of words, or a badge of the size it has among facts. */
const SKEL_READ_LINE = 20;

/** An item's own height: its slot, its tag's line above its words, its bars, or the rows it asks for. */
function skelItemHeight(it: SkeletonItem, slot: number): number {
  const kind = skelKind(it);
  if (kind === "frame") return skelFrameHeight(it.frame!, slot);
  let h = slot;
  if (kind === "place" && it.text !== undefined) h = slot + SKEL_TAG_H;
  if (kind === "item") h = skelItemH(it, slot) + skelItemBox(it);
  if (kind === "head") h = skelHeadH(it);
  // A NOTE THAT WRAPS STANDS A LINE TALLER FOR EACH LINE IT WRAPS TO (RULE.DEVEX.WORKSPACE.303).
  if (kind === "note") h = slot + (skelNoteLines(it).length - 1) * SKEL_ITEM_LINE;
  if (kind === "standin") {
    const count = Math.max(1, it.lines ?? 3);
    if (it.standin === "table") h = skelTableH(it, slot);
    else if (it.standin === "cards") h = SKEL_CARD_H;
    else if (it.standin === "field") h = it.read ? skelFieldHeadH(it) + SKEL_PACK_GAP + SKEL_READ_LINE : skelFieldHeadH(it) + SKEL_LABEL_GAP + slot + skelFieldBelowH(it);
    else h = SKEL_PAD + count * SKEL_BAR_STEP - SKEL_LABEL_GAP + SKEL_PAD;
  }
  return Math.max(h, (it.height ?? 0) * slot);
}
/** The line a part's unit, or the word *Group*, is named on, over its first row. */
const skelLeadH = (row: SkeletonRow): number => (row.lead && row.within !== undefined ? SKEL_TAG_H : 0);
/** A row's height, independent of width: the tallest item it holds, or that plus the framed pad. */
function skelRowHeight(row: SkeletonRow, ctl: number): number {
  const items = row.items.length ? row.items : [{}];
  const h = Math.max(...items.map((it) => skelItemHeight(it, ctl))) + skelLeadH(row);
  return row.framed ? h + SKEL_GAP * 2 : h;
}
/** A frame's height, independent of width: its header, its rows stacked with the gap, its own pad. */
function skelFrameHeight(frame: SkeletonFrame, inherited: number): number {
  const ctl = skelSizeH(frame, inherited);
  const rows = skelRows(frame);
  // A GROUP'S ENTRIES STAND UNDER ITS NAME, with a boundary's padding under the last (RULE.DEVEX.WORKSPACE.301).
  const entries = skelAccordionOf(frame);
  if (entries) return Math.max(skelHead(frame) + skelAccordionH(frame, entries, ctl) + SKEL_PAD, (frame.height ?? 0) * ctl);
  // A CONTAINER'S PARTS STAND WITH NO GAP AND NO PADDING OF THE CONTAINER'S OWN: each part keeps its own.
  if (skelHasParts(frame))
    return Math.max(skelHead(frame) + skelParts(frame).reduce((t, p) => t + skelFrameHeight(p, ctl), 0), (frame.height ?? 0) * ctl);
  const body = rows.reduce((t, r) => t + skelRowHeight(r, ctl), 0) + SKEL_GAP * Math.max(0, rows.length - 1);
  // A SECTION WITH A `size` STANDS ITS ROOM UNDER ITS CONTENT, as above it.
  return Math.max(skelHead(frame) + body + (skelSectionRoom(frame) ?? SKEL_PAD), (frame.height ?? 0) * ctl);
}
/** The rows a frame lays out: its own, and under them the footer's where it is a container drawn for a surface. */
function skelSectionRows(section: SkeletonSection): SkeletonRow[] {
  const rows: SkeletonRow[] = [
    // A PART OF THE CONTENT HAS ITS OWN TITLE, with the actions of that part at its end, so an action stands beside what it acts on.
    ...(section.label !== undefined || section.actions?.length
      ? [{ items: [...(section.label !== undefined ? [{ text: section.label, part: true }] : []), { spacer: true }, ...(section.actions ?? [])] }] : []),
    ...(section.rows ?? []),
  ];
  // A CONTENT PART IS BOUNDED BY NO BOX OF ITS OWN: a line across the container's box sets it apart, and the groups
  // inside it, each its own `sections` entry, draw their dotted boundary.
  if (section.part && section.unit === undefined) return [...rows, ...(section.sections ?? []).flatMap(skelSectionRows)];
  // A PART THAT IS A UNIT OF THE DESIGN SYSTEM carries its name at its corner, over its first row, and each of its rows
  // knows the part it stands in, so its boundary reaches round all of them. A PART WITH A TITLE AND NO UNIT IS A GROUP,
  // the level `GROUP`: it is bounded the same way and named by its level, so its title stands inside it.
  const within = section.unit ?? (section.label !== undefined ? SKEL_GROUP : undefined);
  if (within === undefined) return rows;
  return rows.map((row, i) => ({ ...row, within, lead: i === 0 }));
}
const skelRows = (frame: SkeletonFrame): SkeletonRow[] =>
  frame.look !== "container" && frame.look !== "card" ? frame.rows ?? []
    : [...(frame.sections ?? []).flatMap(skelSectionRows), ...(frame.rows ?? []), ...(frame.footer ?? [])];
/** The rows of a container that begin under a line: each part of its content after the first, and its footer.
 *  A card has no line between its parts; it has only the lines of a list it holds. */
function skelDividers(frame: SkeletonFrame): Set<number> {
  const at = new Set<number>();
  if (frame.look !== "container" && frame.look !== "card") return at;
  const parts = frame.look === "container";
  let index = 0;
  // THE ROWS OF A PART THAT IS `divided` HAVE A LINE BETWEEN EACH TWO, as the lines of a list in a data table do.
  (frame.sections ?? []).forEach((section, order) => {
    if (parts && order > 0) at.add(index);
    const count = skelSectionRows(section).length, own = (section.rows ?? []).length;
    const head = section.label !== undefined || section.actions?.length ? 1 : 0;
    if (section.divided) for (let r = head + 1; r < head + own; r++) at.add(index + r);
    index += count;
  });
  if (parts && (frame.rows ?? []).length && index > 0) at.add(index);
  if (frame.divided) for (let r = 1; r < (frame.rows ?? []).length; r++) at.add(index + r);
  index += (frame.rows ?? []).length;
  if (parts && frame.footer?.length && index > 0) at.add(index);
  return at;
}
/** The rows of a container that begin a part whose own boundary stands in place of a line: a group after the first
 *  section, and its rows after its groups. A content part, and the footer, begin under a line across the box, and a
 *  line between two rows of one list is no boundary, so the default frame draws those. */
function skelPartStarts(frame: SkeletonFrame): Set<number> {
  const at = new Set<number>();
  if (frame.look !== "container") return at;
  let index = 0;
  (frame.sections ?? []).forEach((section, order) => {
    if (order > 0 && !section.part) at.add(index);
    index += skelSectionRows(section).length;
  });
  if ((frame.rows ?? []).length && index > 0 && !(frame.sections ?? []).some((section) => section.part)) at.add(index);
  return at;
}
/** Whether a container drawn for a surface has a header: a title, or actions. */
const skelContainerHead = (frame: SkeletonFrame): number =>
  (frame.label || frame.actions?.length ? (frame.label && frame.note ? SKEL_CONTAINER_HEAD_TWO : SKEL_CONTAINER_HEAD) : 0);
/** Where a container's header band begins, under the top of its outline: under its unit's name, or a step in. */
const skelContainerBandTop = (frame: SkeletonFrame): number => (frame.unit !== undefined ? SKEL_TAG_H : SKEL_LABEL_GAP);
/** Where a container's content begins under the top of its outline: the line under its header, or the outline itself
 *  where it has no header. */
const skelContainerEdge = (frame: SkeletonFrame): number => (skelContainerHead(frame) ? skelContainerBandTop(frame) + skelContainerHead(frame) : 0);
/** CONTENT THAT IS ONLY CARDS STANDS FLUSH: each card is its own box, so no box goes round them and they reach the
 *  container's edges, as a framed content does. */
const skelCardsOnly = (frame: SkeletonFrame): boolean => {
  const rows = skelRows(frame);
  return frame.look === "container" && rows.length > 0 && rows.every((row) => (row.items ?? []).every((item) => item.frame?.look === "card"));
};
/** How far a frame's rows stand in from its sides: its padding, or nothing where its content is only cards. */
const skelInset = (frame: SkeletonFrame): number => (skelCardsOnly(frame) ? 0 : SKEL_PAD);
/** The parts of a container: the one frame each of its rows holds. */
const skelParts = (frame: SkeletonFrame): SkeletonFrame[] =>
  (frame.rows ?? []).flatMap((r) => (r.items.length === 1 && r.items[0].frame ? [r.items[0].frame] : []));
/** A frame's header: its tag's line, then its title and note. A frame with neither title nor tag
 *  starts its rows at its own padding. */
function skelHead(frame: SkeletonFrame): number {
  // A BACKDROP'S MEDIA IS NAMED AT ITS CORNER, over the words that stand on it (RULE.DEVEX.WORKSPACE.305).
  return skelHeadOwn(frame) + (skelBackdropOf(frame) ? SKEL_TAG_H : 0);
}
function skelHeadOwn(frame: SkeletonFrame): number {
  const tag = skelCornerName(frame) ? SKEL_TAG_H + SKEL_LABEL_GAP : 0;
  // A CONTAINER HOLDS ITS HEADER: its unit's name at the corner of its outline, its header band under the name, and its
  // content under the line that closes the band. With no header, the content stands under the name.
  // A SECTION WITH A `size` STANDS ITS ROOM ABOVE ITS CONTENT, under its name, in place of a boundary's padding.
  const room = skelSectionRoom(frame) ?? SKEL_PAD;
  if (frame.look === "container")
    return skelContainerHead(frame) ? skelContainerEdge(frame) + room : (frame.unit !== undefined ? SKEL_TAG_H : 0) + room;
  if (!frame.label) return Math.max(tag, SKEL_PAD);
  // A card whose title line holds an action stands a gap taller, so the action keeps clear of the first part under it.
  if (frame.look === "card") return tag + (frame.note ? SKEL_CARD_HEAD_TWO : SKEL_CARD_HEAD_ONE) + (frame.actions?.length ? SKEL_LABEL_GAP * 2 : 0);
  return tag + (frame.note ? SKEL_H_TWO : SKEL_H_ONE);
}
/** The left column every row of a frame shares, sized to the widest row label — or none at all. */
function skelLabelCol(frame: SkeletonFrame): number {
  const labels = skelRows(frame).map((r) => r.label).filter((l): l is string => !!l);
  return labels.length ? Math.ceil(Math.max(...labels.map((l) => l.length * SKEL_W_LABEL))) : 0;
}
/** The gap after item `i` of a row: a packed group (icon after icon, pager part after part) sits close. */
const skelGapAfter = (row: SkeletonRow, i: number) =>
  skelIconOnly(row.items[i]) && row.items[i + 1] && skelIconOnly(row.items[i + 1]) ? SKEL_PACK_GAP : SKEL_GAP;
const skelRowGaps = (row: SkeletonRow) =>
  row.items.slice(0, -1).reduce((t, _, i) => t + skelGapAfter(row, i), 0);
/** A row's own minimum width: room for each item, the gaps between them, and a framed row's own pad.
 *  A frame with a fraction asks the row to be wide enough that its share holds it, and the other items
 *  ask it to be wide enough that what the fractions leave holds them. The row needs the larger of the
 *  two, never their sum: a sum asks for more than the row uses, and draws a figure wider than its page. */
/** The least room one item of a row takes. A fill or a frame still needs room for what it holds; an item line's words and a note
 *  wrap, and code and a row of tabs scroll, so each takes less than its own width (RULE.DEVEX.WORKSPACE.303, .304). */
function skelItemNeed(it: SkeletonItem, ctl: number): number {
  const kind = skelKind(it);
  if (kind === "spacer") return 0;
  if (kind === "frame") return skelFrameMinWidth(it.frame!, ctl);
  if (kind === "standin" && it.standin === "table") return skelTableW(it, ctl);
  if (kind === "item") return skelItemMinW(it, ctl) + skelItemBox(it);
  if (kind === "head") return skelHeadMinW(it, ctl);
  if (kind === "standin" || kind === "slot") return Math.max(kind === "slot" ? skelTagW(it.slot!) : SKEL_LINES_W, SKEL_PAD * 2);
  if (kind === "place") return Math.max(skelTagW(it.tag!), it.text !== undefined ? skelTextW(it.text) : 0, SKEL_PAD * 2);
  if (kind === "control" && it.fill && !skelOwnWidth(it)) return it.control === "field" ? SKEL_FIELD_W : skelTextW(it.text ?? "");
  if ((kind === "note" || kind === "control") && skelScrolls(it)) return Math.min(SKEL_SCROLL_MIN, skelFixedWidth(it, ctl));
  if (kind === "note" && typeof it.note === "string") return skelWordsMinW(it.note, skelWordW);
  return skelFixedWidth(it, ctl);
}
/** Whether an item that keeps its own width gives some of it where its row runs past its room: an item line whose words wrap, a note, and
 *  code and a row of tabs, which scroll. */
const skelGives = (it: SkeletonItem): boolean => {
  const kind = skelKind(it);
  return (kind === "item" && !it.fill && !skelStats.has(it) && !skelItemInline(it) && skelItemFacts(it).length > 0)
    || (kind === "note" && typeof it.note === "string") || (kind === "control" && it.control === "tabs");
};
function skelRowMinWidth(row: SkeletonRow, ctl: number): number {
  const fractionOf = (it: SkeletonItem): number | undefined =>
    skelKind(it) === "frame" && it.frame!.width ? WIDTH_FRACTIONS[it.frame!.width] : undefined;
  const need = (it: SkeletonItem): number => skelItemNeed(it, ctl);
  let shares = 0, forShares = 0, others = 0;
  for (const it of row.items) {
    const fraction = fractionOf(it);
    if (fraction === undefined) { others += need(it); continue; }
    shares += fraction;
    forShares = Math.max(forShares, Math.ceil(need(it) / fraction));
  }
  const rest = others + skelRowGaps(row);
  const framed = row.framed ? SKEL_GAP * 2 : 0;
  const named = skelLeadH(row) ? skelTagW(row.within!) : 0;
  return Math.max(named, Math.max(forShares, shares > 0 && shares < 1 ? Math.ceil(rest / (1 - shares)) : rest) + framed);
}
/** A frame's own minimum width: its padding, its label column, and its widest row's need. */
function skelFrameMinWidth(frame: SkeletonFrame, inherited: number): number {
  const ctl = skelSizeH(frame, inherited);
  const labelCol = skelLabelCol(frame);
  const head = Math.max(frame.label ? skelStepW(frame.label, frame.look === "container" ? SKEL_STEP_CONTAINER : frame.look === "card" ? SKEL_STEP_CARD : SKEL_STEP_PART) + (frame.look === "card" && frame.media !== undefined ? SKEL_CARD_MARK + SKEL_LABEL_GAP : 0) : 0, skelCornerName(frame) ? skelTagW(skelCornerName(frame)!) - SKEL_PAD : 0,
    frame.look === "container" && frame.unit !== undefined ? skelTagW(frame.unit) - SKEL_PAD : 0,
    frame.label && frame.note ? Math.ceil(frame.note.length * SKEL_W_NOTE) : 0);
  // A CONTAINER'S OR A CARD'S HEADER HOLDS ITS ACTIONS AT THE END, so its title and its actions must both fit across.
  const headActions = (frame.look === "container" || frame.look === "card") && frame.actions?.length
    ? SKEL_GAP + frame.actions.reduce((t, a) => t + skelFixedWidth(a, ctl), 0) + SKEL_LABEL_GAP * (frame.actions.length - 1) : 0;
  if (skelHasParts(frame)) return Math.max(head + SKEL_PAD * 2, ...skelParts(frame).map((p) => skelFrameMinWidth(p, ctl)));
  const entries = skelAccordionOf(frame);
  if (entries) return SKEL_PAD * 2 + Math.max(head, skelAccordionMinW(frame, entries));
  const widest = Math.max(0, ...skelRows(frame).map((r) => skelRowMinWidth(r, ctl)));
  // THE WORDS OVER A BACKDROP KEEP TO THEIR MEASURE (RULE.DEVEX.WORKSPACE.305), so the feature is as wide as that measure needs.
  const backdrop = skelBackdropOf(frame), rows = backdrop ? Math.ceil(widest / backdrop.measure) : widest;
  return Math.max(SKEL_PAD * 2 + head + headActions, skelInset(frame) * 2 + (labelCol ? labelCol + SKEL_GAP : 0) + rows);
}

/** Whether an item takes the rest of its row's width. */
const skelFlexes = (it: SkeletonItem): boolean => {
  const kind = skelKind(it);
  if (kind === "spacer" || kind === "head") return true;
  if (kind === "frame") return it.frame!.width === undefined || WIDTH_FRACTIONS[it.frame!.width] === undefined;
  return !!it.fill && kind !== "plain" && kind !== "note" && kind !== "icon" && !skelOwnWidth(it);
};

/**
 * Each item's width within a row of `available` pixels. An item's own width and a frame's fraction of
 * `available` are fixed; a `fill` item, a spacer or a frame named with no fraction takes an equal share of
 * what the fixed items and the row's own gaps leave over. An item with no shape a skeleton has, and a
 * `width` naming no fraction the spec has, are findings — the drawer still places something, rather than
 * leaving a gap nobody can explain.
 */
function skelRowWidths(row: SkeletonRow, available: number, ctl: number, findings: string[]): number[] {
  const n = row.items.length;
  const widths: number[] = new Array(n).fill(0);
  const flex: number[] = [];
  let fixed = 0;
  row.items.forEach((it, i) => {
    const kind = skelKind(it);
    if (kind === null) { findings.push("an item that is none of `text`, `note`, `slot`, `icon`, `control`, `standin`, `item`, `spacer` or `frame`"); return; }
    if (kind === "frame") {
      const w = it.frame!.width;
      if (w !== undefined && WIDTH_FRACTIONS[w] === undefined)
        findings.push(`a frame's \`width\` is \`${w}\`, and a skeleton takes one of ${Object.keys(WIDTH_FRACTIONS).join(" · ")}, or none for what is left`);
      if (w !== undefined && WIDTH_FRACTIONS[w] !== undefined) { widths[i] = Math.round(available * WIDTH_FRACTIONS[w]); fixed += widths[i]; return; }
      flex.push(i); return;
    }
    // A SLOT OR A PART ALONE IN ITS ROW IS THE ROW'S: it takes the row's width, as it takes the column's height with `fill`.
    if (skelFlexes(it) || (n === 1 && (kind === "slot" || kind === "place"))) { flex.push(i); return; }
    widths[i] = skelFixedWidth(it, ctl); fixed += widths[i];
  });
  // WHAT KEEPS ITS OWN WIDTH AND RUNS PAST THE ROW GIVES SOME OF IT (RULE.DEVEX.WORKSPACE.303, .304): an item line's words and a note wrap,
  // and code and a row of tabs scroll, each down to the least it takes, in the row's order. A row that fits draws as before.
  let over = fixed + skelRowGaps(row) - available;
  if (over > 0) row.items.forEach((it, i) => {
    if (over <= 0 || flex.includes(i) || skelKind(it) === null || !skelGives(it)) return;
    const give = Math.min(over, widths[i] - skelItemNeed(it, ctl));
    if (give > 0) { widths[i] -= give; fixed -= give; over -= give; }
  });
  const left = Math.max(0, available - fixed - skelRowGaps(row));
  const share = flex.length ? Math.round(left / flex.length) : 0;
  for (const i of flex) widths[i] = share;
  return widths;
}

const skelRect = (cls: string, x: number, y: number, w: number, h: number, rx = 3) =>
  `  <rect class="${cls}" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${rx}"/>`;
const skelPath = (cls: string, points: [number, number][][]) =>
  `  <path class="${cls}" d="${points.map((line) => line.map(([px, py], i) => `${i ? "L" : "M"}${r2(px)} ${r2(py)}`).join(" ")).join(" ")}"/>`;

/** A frame's marks. The outer frame is the drawing's own edge; a part is a surface, a border or neither, and a part with no border of its own shows the dotted boundary. */
function skelMarks(look: string | undefined, x: number, y: number, w: number, h: number): string[] {
  if (look === "bordered") return [skelRect("sds-skel-border", x, y, w, h)];
  // A CARD IS A THIN, ROUNDED OUTLINE with nothing behind it: a part with a title of its own, as a page draws one.
  if (look === "card") return [skelRect("sds-skel-control", x, y, w, h, SKEL_ROUND)];
  if (look === "flat") return [skelRect("sds-skel-guide", x, y, w, h)];
  return [skelRect("sds-skel-surface", x, y, w, h), skelRect("sds-skel-guide", x, y, w, h)];
}

/**
 * An icon is a few plain line shapes, drawn about the centre `(cx, cy)` in a box of `g` pixels. Every
 * point is written out in absolute numbers, so no transform hides a shape from the drawing's own fit.
 */
function skelGlyph(name: string, cx: number, cy: number, g: number): string[] {
  const u = g / 24, X = (v: number) => cx - g / 2 + v * u, Y = (v: number) => cy - g / 2 + v * u;
  const line = (...pts: number[][]): [number, number][] => pts.map(([a, b]) => [X(a), Y(b)]);
  const stroke = (...lines: [number, number][][]) => skelPath("sds-skel-glyph", lines);
  const solid = (...lines: [number, number][][]) => skelPath("sds-skel-glyph sds-skel-glyph-solid", lines);
  const dot = (a: number, b: number, rad: number) => `  <circle class="sds-skel-glyph sds-skel-glyph-solid" cx="${r2(X(a))}" cy="${r2(Y(b))}" r="${r2(rad * u)}"/>`;
  switch (name) {
    case "close": return [stroke(line([6, 6], [18, 18]), line([18, 6], [6, 18]))];
    case "add": return [stroke(line([12, 5], [12, 19]), line([5, 12], [19, 12]))];
    case "menu": return [stroke(line([5, 7], [19, 7]), line([5, 12], [19, 12]), line([5, 17], [19, 17]))];
    case "search": return [`  <circle class="sds-skel-glyph" cx="${r2(X(10))}" cy="${r2(Y(10))}" r="${r2(6 * u)}"/>`, stroke(line([15, 15], [20, 20]))];
    case "more": return [dot(5, 12, 1.6), dot(12, 12, 1.6), dot(19, 12, 1.6)];
    case "previous": return [stroke(line([14, 5], [7, 12], [14, 19]))];
    case "next": return [stroke(line([10, 5], [17, 12], [10, 19]))];
    case "select": return [stroke(line([6, 9], [12, 15], [18, 9]))];
    case "checkbox": return [stroke(line([8, 12], [11, 15], [16, 8]))];
    case "bell": return [solid(line([12, 4], [16, 7], [17, 12], [19.5, 16], [4.5, 16], [7, 12], [8, 7], [12, 4])), dot(12, 19, 1.6)];
    case "person": return [dot(12, 8, 4), solid(line([4, 20], [6, 15], [12, 13], [18, 15], [20, 20], [4, 20]))];
    // THE END ARROWS OF AN ITEM LINE, in `DSIconType`'s names: a line with its head, across, and up to the end where it leaves the site.
    case "ARROW_RIGHT": return [stroke(line([5, 12], [19, 12]), line([13, 6], [19, 12], [13, 18]))];
    case "ARROW_UP_RIGHT": return [stroke(line([7, 17], [17, 7]), line([8, 7], [17, 7], [17, 16]))];
    default: return [dot(12, 12, 2)];
  }
}

/**
 * An icon in its slot, a square of side `h` about `(cx, cy)`. AN ACTION KEEPS ITS SQUARE, since it is pressed,
 * and an icon is an action unless the spec says it is a mark. A MARK IS DRAWN IN A CIRCLE: it stands for a
 * thing or a person, as a picture or a logo does, and it is `across` wide: as wide as the place it is in asks.
 * The default mark is a filled circle, or an empty one where `on` is false, as a provider that is there to be
 * set up and is not yet; any other mark is a circle that holds its shape.
 */
function skelIcon(name: string, cx: number, cy: number, h: number, mark: boolean, on?: boolean, across = h): string[] {
  const circle = (cls: string, r: number) => `  <circle class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}"/>`;
  // A TILE THAT IS SET UP carries a small filled check at its top end corner, as a brand that is on does.
  const check = on === true ? [circle("sds-skel-bar", 4).replace(`cx="${r2(cx)}" cy="${r2(cy)}"`, `cx="${r2(cx + h / 2)}" cy="${r2(cy - h / 2)}"`)] : [];
  if (!mark) return [skelRect("sds-skel-control", cx - h / 2, cy - h / 2, h, h), ...skelGlyph(name, cx, cy, Math.round(h / 2)), ...check];
  if (name === "default") return [circle(on === false ? "sds-skel-control" : "sds-skel-bar", across / 2)];
  return [circle("sds-skel-control", across / 2), ...skelGlyph(name, cx, cy, Math.round(across / 2))];
}

/** ONE LINE OF FACTS, a dot between every two of them, a badge among them, from `fx` on the centre line `factsMid`: the whole line where
 *  it fits, or one of the lines it wraps to, which starts with no dot (RULE.DEVEX.WORKSPACE.303). A fact that is neither a word nor a badge
 *  is the finding `refusal`. */
function skelDrawFactLine(line: SkelFactLine, fx: number, factsMid: number, h: number, refusal: string, findings: string[], out: string[]): void {
  line.forEach(({ fact, dot }) => {
    if (dot) {
      out.push(`  <text class="sds-note" x="${r2(fx + 6)}" y="${Math.round(factsMid + 4)}">${SKEL_FACT_DOT}</text>`);
      fx += SKEL_FACT_DOT_W;
    }
    if (typeof fact === "string") out.push(`  <text class="sds-note" x="${r2(fx)}" y="${Math.round(factsMid + 4)}">${esc(fact)}</text>`);
    else if (fact.control !== "badge") findings.push(refusal);
    else skelDrawLeaf(fact, "control", fx, factsMid - SKEL_FACT_CTL / 2, skelFixedWidth(fact, SKEL_FACT_CTL), SKEL_FACT_CTL, SKEL_FACT_CTL, SKEL_FACT_CTL, findings, out);
    fx += skelFactW(fact, h);
  });
}

/** One item that is a leaf (a control, an icon, a slot, plain words, a stand-in), drawn at `(ix, iy)`, `iw` wide and `ih` tall. */
function skelDrawLeaf(it: SkeletonItem, kind: SkelKind, ix: number, iy: number, iw: number, ih: number, boxH: number, h: number, findings: string[], out: string[]): void {
  const mid = iy + ih / 2;
  const baseline = Math.round(mid + 4);
  if (kind === "plain") { out.push(it.part ? skelStepText(it.text!, SKEL_STEP_PART, ix, baseline) : `  <text class="sds-label" x="${ix}" y="${baseline}">${esc(it.text!)}</text>`); return; }
  if (kind === "note") {
    // A LINE OF CODE WIDER THAN ITS COLUMN KEEPS ITS WIDTH AND IS CUT AT THE COLUMN'S END, where the mark stands (RULE.DEVEX.WORKSPACE.304).
    if (skelCode.has(it) && typeof it.note === "string" && skelWordW(it.note) > iw) {
      const shown = it.note.slice(0, Math.max(0, Math.floor((iw - SKEL_SCROLL_MARK - SKEL_PACK_GAP) / SKEL_W_LABEL)));
      out.push(`  <text class="sds-code" x="${ix}" y="${baseline}">${esc(shown)}</text>`, ...skelScrollMark(ix + iw, mid));
      return;
    }
    // A NOTE WIDER THAN ITS COLUMN WRAPS AT A WORD (RULE.DEVEX.WORKSPACE.303), its lines centred together where its row is taller.
    skelWrapKeep(it, iw);
    const lines = skelNoteLines(it);
    if (lines.length < 2) { out.push(`  <text class="sds-code" x="${ix}" y="${baseline}">${esc(it.note!)}</text>`); return; }
    lines.forEach((line, k) =>
      out.push(`  <text class="sds-code" x="${ix}" y="${Math.round(mid + 4 - (lines.length - 1) * SKEL_ITEM_LINE / 2 + k * SKEL_ITEM_LINE)}">${esc(line)}</text>`));
    return;
  }
  if (kind === "slot") {
    // A SLOT THAT IS A FEATURE'S MEDIA, WITH `frames` NAMING `MEDIA`, STANDS IN THE FEATURE'S FRAME, flush.
    const framed = skelItemFrames.get(it);
    out.push(...(framed ? skelSurfaceMarks(framed, ix, iy, iw, ih) : skelMarks(undefined, ix, iy, iw, ih)));
    out.push(`  <text class="sds-note" x="${ix + SKEL_LABEL_GAP}" y="${iy + SKEL_LABEL_H + 4}">${esc(it.slot!)}</text>`);
    return;
  }
  if (kind === "place") {
    out.push(...skelMarks(undefined, ix, iy, iw, ih));
    out.push(`  <text class="sds-note" x="${ix + SKEL_LABEL_GAP}" y="${iy + SKEL_LABEL_H + 4}">${esc(it.tag!)}</text>`);
    if (it.text !== undefined) out.push(`  <text class="sds-code" x="${ix + SKEL_PAD}" y="${Math.round(iy + SKEL_TAG_H + (ih - SKEL_TAG_H) / 2 + 4)}">${esc(it.text)}</text>`);
    return;
  }
  if (kind === "item") {
    // THE LINE OF AN ITEM: its media at the start, its title with its description under it, and what stands at its end.
    const item = it.item!;
    if (typeof item.title !== "string" || !item.title) findings.push("an item line carries its `title`, and this one carries none");
    // AN ITEM LINE IN A FRAME OF ITS OWN, as a feature's `items.surface` puts it: the frame round the line's place, as tall as
    // its row, and the line inside it at a boundary's padding, at the top.
    const boxed = skelItemFrames.get(it);
    if (boxed) out.push(...skelSurfaceMarks(boxed, ix, iy, iw, ih));
    // A STATISTIC (RULE.DEVEX.WORKSPACE.300): its title is the value, large and heavy, and its description the label under it, quiet, each
    // at its step one level below the feature's own. It draws nothing else, as the design system draws a statistic from these two.
    if (skelStats.has(it)) {
      const stat = skelStatOf(it), label = skelStatLabel(it);
      const drawn = (["media", "meta", "end", "inline", "factsPlacement", "selected"] as const).filter((key) => item[key] !== undefined);
      if (drawn.length)
        skelSay(findings, `a statistic of \`items.type\` \`STATS\` draws its \`title\`, the value, and its \`description\`, the label under it, and nothing else; ${drawn.map((key) => `\`${key}\``).join(", ")} ${drawn.length > 1 ? "are" : "is"} not drawn`);
      const lineX = boxed ? ix + SKEL_PAD : ix, lineW = boxed ? iw - SKEL_PAD * 2 : iw;
      const top = boxed ? iy + SKEL_PAD : iy + (ih - skelStatH(it)) / 2;
      const valueW = skelStepW(String(item.title ?? ""), stat.value), labelW = label !== undefined ? skelHeadDescriptionW(label, stat.label) : 0;
      // `textAlign` `CENTER` ON THE FEATURE'S HEAD CENTRES THE VALUE AND THE LABEL IN THEIR PLACE, each by its own measure.
      const startOf = (w: number) => (stat.centre ? lineX + (lineW - w) / 2 : lineX);
      const baseOf = (lineTop: number, size: number) => Math.round(lineTop + (skelHeadLine(size) + size * 0.7) / 2);
      out.push(skelStepText(String(item.title ?? ""), stat.value, startOf(valueW), baseOf(top, stat.value)));
      if (label !== undefined)
        out.push(`  <text class="sds-note" x="${r2(startOf(labelW))}" y="${baseOf(top + skelHeadLine(stat.value), stat.label)}" style="font-size:${stat.label}px">${esc(label)}</text>`);
      return;
    }
    // THE CHOSEN LINE OF A FEATURE'S BOXED ITEMS KEEPS ITS FRAME AND DRAWS A HEAVIER LINE INSIDE ITS EDGE (RULE.DEVEX.WORKSPACE.298), as
    // `DSItemCard` marks a selected tile, so it keeps its size. The design system reads `selected` only where the items are boxed.
    if (item.selected !== undefined && typeof item.selected !== "boolean") skelSay(findings, `an item line's \`selected\` is \`${JSON.stringify(item.selected)}\`, and it takes true or false`);
    else if (item.selected === true && !boxed)
      skelSay(findings, "`selected` marks the chosen item line of a `DSFeature` whose `items.surface` boxes its items, as the design system reads it only there, and this line stands in no box");
    else if (item.selected === true && boxed) {
      const inner = boxed.rounded === false ? 0 : SKEL_ROUND - 2;
      out.push(skelRect("sds-skel-control sds-skel-main", ix + 2, iy + 2, iw - 4, ih - 4, inner));
    }
    const lineH = boxed ? skelItemH(it, h) : ih, lineX = boxed ? ix + SKEL_PAD : ix, lineW = boxed ? iw - SKEL_PAD * 2 : iw;
    const lineMid = boxed ? iy + SKEL_PAD + lineH / 2 : mid;
    // THE TITLE AND THE LINE UNDER IT ARE TOLD APART BY WEIGHT, SIZE AND SHADE: the title is of medium weight, the facts small and quiet.
    const facts = skelItemFacts(it), top = lineMid - lineH / 2;
    const inline = skelItemInline(it);
    // ITS WORDS WRAP TO WHAT ITS MEDIA AND ITS END LEAVE OF THE LINE (RULE.DEVEX.WORKSPACE.303), and the width is kept for its height.
    if (!inline) skelWrapKeep(item, skelItemWordsAt(it, h, lineW));
    const wraps = skelItemWrapH(it, h) > 0;
    const titleY = facts.length && !inline ? top + (lineH - (skelItemH(it, h) - SKEL_LABEL_GAP)) / 2 + 13 : lineMid + 4;
    // MEDIA BESIDE WORDS THAT WRAP KEEPS ITS SIZE AND STANDS AT THE TOP, beside the title and the first line under it.
    const mediaMid = wraps ? top + skelItemBaseH(it, h) / 2 : lineMid;
    let wx = lineX;
    if (item.media !== undefined) {
      const media = skelItemMediaOf(item.media);
      if (skelMediaGiven(item.media)) {
        const given = item.media;
        if (!SKEL_ITEM_MEDIA.includes(given.mtype))
          skelSay(findings, `an item line's \`media\` is \`${String(given.mtype)}\`, and a skeleton draws ${SKEL_ITEM_MEDIA.join(" · ")} on an item line; a mark is drawn in its place`);
        else if (!SKEL_ICONS.includes(media.shape))
          skelSay(findings, `an item's \`media\` names \`${media.shape}\`, and a skeleton draws ${SKEL_ICONS.join(" · ")}; \`default\` is drawn where none fits`);
      } else if (!SKEL_ICONS.includes(item.media)) findings.push(`an item's \`media\` is \`${item.media}\`, and a skeleton draws ${SKEL_ICONS.join(" · ")}; \`default\` is drawn where none fits`);
      if (media.bare) {
        // A BARE ICON (RULE.DEVEX.WORKSPACE.294): as large as the title, on the title's first line, with nothing round it.
        const size = skelItemIconW(it);
        out.push(...skelGlyph(media.shape, lineX + size / 2, titleY - 4, size));
        wx = lineX + size + SKEL_LABEL_GAP;
      } else {
        const across = skelItemMediaD(it, h);
        out.push(...skelIcon(media.shape, lineX + across / 2, mediaMid, h, true, undefined, across));
        wx = lineX + across + SKEL_LABEL_GAP;
      }
    }
    // A NUMBERED ITEM'S NUMBER STANDS BEFORE ITS TITLE, quiet, at the title's size and weight (RULE.DEVEX.WORKSPACE.290).
    const number = skelItemNumber(it), step = skelItemStep(it);
    if (number !== undefined)
      out.push(`  <text class="sds-note" x="${r2(wx)}" y="${Math.round(titleY)}" style="font-size:${step}px;font-weight:${step === SKEL_STEP_ITEM ? 500 : 600}">${number}</text>`);
    out.push(skelStepText(item.title ?? "", step, wx + skelItemNumberW(it), titleY));
    // THE FACTS STAND ON ONE LINE, a dot between every two of them, a badge among them.
    const ownDescription = skelItemOwnDescription(it);
    // WORDS THAT RUN PAST THE LINE STAND ON THE LINES THEY WRAP TO (RULE.DEVEX.WORKSPACE.303): the description's, then the facts', each line
    // a step under the last.
    const wrapped: { description: string[]; facts: SkelFactLine[] } = inline ? { description: [], facts: [facts.map((fact, i) => ({ fact, dot: i > 0 }))] } : skelItemWrapped(it, h);
    const below = wrapped.description.length * SKEL_ITEM_LINE;
    // FACTS PLACED AFTER THE TITLE STAND UNDER IT AND OVER THE DESCRIPTION (RULE.DEVEX.WORKSPACE.296), as `factsPlacement` `AFTER_TITLE` puts
    // them; the two lines trade places and the item keeps its height. With no description of its own there is nothing to trade.
    if (item.factsPlacement !== undefined && !SKEL_FACTS_PLACEMENTS.includes(item.factsPlacement))
      skelSay(findings, `an item line's \`factsPlacement\` is \`${String(item.factsPlacement)}\`, and it takes ${SKEL_FACTS_PLACEMENTS.join(" · ")}`);
    const afterTitle = item.factsPlacement === "AFTER_TITLE" && ownDescription !== undefined, badgeLine = skelItemHasBadge(it);
    const factStep = badgeLine ? SKEL_FACT_BADGE_STEP : SKEL_ITEM_LINE, factsBelow = Math.max(0, wrapped.facts.length - 1) * factStep;
    // AN INLINE ITEM'S FACTS STAND ON THE TITLE'S LINE, after the title and a dot.
    const factsMid = inline ? titleY - 4 : (afterTitle ? 0 : below) + (badgeLine ? titleY + 5 + SKEL_PACK_GAP + SKEL_FACT_BADGE / 2 : titleY + SKEL_ITEM_LINE - 4);
    const descriptionY = afterTitle ? factsMid + factsBelow + (badgeLine ? SKEL_FACT_BADGE / 2 + 13 : 4 + SKEL_ITEM_LINE) : titleY + SKEL_ITEM_LINE;
    wrapped.description.forEach((line, k) =>
      out.push(`  <text class="sds-note" x="${r2(wx)}" y="${Math.round(descriptionY + k * SKEL_ITEM_LINE)}">${esc(line)}</text>`));
    let fx = wx;
    if (inline) {
      fx += skelItemTitleW(it);
      out.push(`  <text class="sds-note" x="${r2(fx + 6)}" y="${Math.round(factsMid + 4)}">${SKEL_FACT_DOT}</text>`);
      fx += SKEL_FACT_DOT_W;
    }
    wrapped.facts.forEach((line, k) =>
      skelDrawFactLine(line, fx, factsMid + k * factStep, h, "a fact on the line under an item's title is a word or a badge", findings, out));
    let ex = lineX + lineW - skelItemEndW(it, h);
    for (const part of item.end ?? []) {
      const partKind = skelKind(part), pw = skelFixedWidth(part, h);
      if (!SKEL_CELL_KINDS.includes(partKind)) findings.push("the end of an item line holds words, a note, an icon or a control");
      // AN END ARROW IS DRAWN BARE, its shape alone in the place of an icon (RULE.DEVEX.WORKSPACE.297): it says where the line leads, and
      // nothing round it says it can be pressed apart from the line.
      else if (partKind === "icon" && SKEL_END_ARROWS.includes(part.icon!)) {
        out.push(...skelGlyph(part.icon!, ex + h / 2, lineMid, Math.round(h / 2)));
        if (part.text !== undefined) out.push(`  <text class="sds-code" x="${ex + h + SKEL_LABEL_GAP}" y="${Math.round(lineMid + 4)}">${esc(part.text)}</text>`);
      } else skelDrawLeaf(part, partKind!, ex, lineMid - h / 2, pw, h, h, h, findings, out);
      ex += pw + SKEL_LABEL_GAP;
    }
    return;
  }
  if (kind === "head") {
    // A FEATURE'S HEAD: the eyebrow, the title and the description wrapped at a word to the head's width, and the facts.
    const head = skelHeadOf(it);
    const level = skelHeadLevel(head);
    if (typeof head.title !== "string" || !head.title) findings.push("a head carries its `title`, and this one carries none");
    if (head.pageLevel !== undefined && !SKEL_HEAD_LEVELS.includes(head.pageLevel))
      findings.push(`a head's \`pageLevel\` is \`${String(head.pageLevel)}\`, and a head takes ${SKEL_HEAD_LEVELS.join(" · ")}; \`CONTAINER\` is drawn where it is left out`);
    if (head.textAlign !== undefined && !SKEL_HEAD_ALIGNS.includes(head.textAlign))
      findings.push(`a head's \`textAlign\` is \`${String(head.textAlign)}\`, and a head takes ${SKEL_HEAD_ALIGNS.join(" · ")}`);
    const step = SKEL_HEAD_TITLE[level];
    const wide = typeof head.title === "string" ? head.title.split(/\s+/).find((word) => skelStepW(word, step) > iw) : undefined;
    if (wide !== undefined)
      findings.push(`the head \`${head.title}\` has a word wider than its column: \`${wide}\` needs ${skelStepW(wide, step)} across at ${step}px, and the column is ${r2(iw)}; a title wraps at a word, so a word that does not fit runs over its column`);
    const known = skelHeadWidths.get(head);
    if (it.head === head) skelHeadWidths.set(head, known === undefined ? iw : Math.min(known, iw));
    // `textAlign` `CENTER` CENTRES EVERY LINE OF THE HEAD, each by its own measure.
    const centre = head.textAlign === "CENTER";
    const startOf = (w: number) => (centre ? ix + (iw - w) / 2 : ix);
    const { lines, factsTop, factLines, factStep, mediaBox, badgeTop } = skelHeadLayout(head, iw);
    // A HEAD'S MEDIA (RULE.DEVEX.WORKSPACE.294): a `MARK` or an `AVATAR` over its words, in its level's box; a feature at `PAGE` stands its
    // media beside its words, where a spec draws it as a slot.
    if (head.media !== undefined) {
      const given = head.media;
      if (!skelMediaGiven(given) || !SKEL_HEAD_MEDIA.includes(given.mtype))
        skelSay(findings, `a head's \`media\` is a \`MARK\` or an \`AVATAR\`, in \`IDSItemMedia\`'s shape, and this one is \`${JSON.stringify(given)}\``);
      else if (level === "PAGE") skelSay(findings, "a feature at `PAGE` stands its media beside its words and never over them, so a head at `PAGE` draws no `media`: draw it as a slot beside the head");
      else if (given.mtype === "MARK" && !SKEL_ICONS.includes(given.icon ?? "default"))
        skelSay(findings, `a head's \`media\` names \`${given.icon}\`, and a skeleton draws ${SKEL_ICONS.join(" · ")}; \`default\` is drawn where none fits`);
      else if (given.mtype === "AVATAR" && (typeof given.title !== "string" || !given.title.trim()))
        skelSay(findings, "a head's `AVATAR` carries the name it stands for in `title`, and draws its initials");
    }
    if (mediaBox) {
      const given = head.media!, cx = startOf(mediaBox) + mediaBox / 2, cy = iy + mediaBox / 2;
      // AN AVATAR WITH NO PICTURE SHOWS ITS INITIALS in a circle; a mark is a circle that holds its shape, as every mark is.
      if (given.mtype === "AVATAR") out.push(`  <circle class="sds-skel-control" cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(mediaBox / 2)}"/>`,
        `  <text class="sds-note" x="${r2(cx)}" y="${Math.round(cy + 5)}" text-anchor="middle" style="font-size:${Math.round(mediaBox / 3)}px;font-weight:600">${esc(skelInitials(String(given.title ?? "")))}</text>`);
      else out.push(...skelIcon(given.icon ?? "default", cx, cy, mediaBox, true, undefined, mediaBox));
    }
    // A HEAD'S EYEBROW IS WORDS OR A BADGE (RULE.DEVEX.WORKSPACE.295): a badge stands as a badge among the facts does, packed above the title.
    if (head.eyebrow !== undefined && typeof head.eyebrow !== "string" && !skelHeadBadge(head))
      skelSay(findings, "a head's `eyebrow` is words, drawn in small capitals, or a badge, `{ \"control\": \"badge\", \"text\": … }`, drawn as a badge among the facts");
    const badge = skelHeadBadge(head);
    if (badge && badgeTop !== undefined) {
      const bw = skelFixedWidth(badge, SKEL_FACT_CTL);
      skelDrawLeaf(badge, "control", startOf(bw), iy + badgeTop + SKEL_HEAD_BADGE_LINE / 2 - SKEL_FACT_CTL / 2, bw, SKEL_FACT_CTL, SKEL_FACT_CTL, SKEL_FACT_CTL, findings, out);
    }
    for (const line of lines) {
      const lineBase = Math.round(iy + line.top + (skelHeadLine(line.size) + line.size * 0.7) / 2);
      if (line.part === "title") out.push(skelStepText(line.words, line.size, startOf(line.w), lineBase));
      else out.push(`  <text class="sds-note" x="${r2(startOf(line.w))}" y="${lineBase}" style="font-size:${line.size}px${line.part === "eyebrow" ? ";letter-spacing:.08em;font-weight:600" : ""}">${esc(line.words)}</text>`);
    }
    // THE FACTS STAND ON ONE LINE UNDER THE DESCRIPTION, as an item's `meta` stands under its title, and on the lines they wrap to where
    // they run past the column, each line centred by its own measure with `textAlign` `CENTER` (RULE.DEVEX.WORKSPACE.303).
    if (factsTop !== undefined) factLines.forEach((line, k) =>
      skelDrawFactLine(line, startOf(skelFactLineW(line, h)), iy + factsTop + SKEL_ITEM_LINE / 2 + k * factStep, h, "a fact under a head is a word or a badge", findings, out));
    return;
  }
  if (kind === "icon") {
    if (SKEL_END_ARROWS.includes(it.icon!)) skelSay(findings, `\`${it.icon}\` is the end arrow of an item line, and stands in its \`end\`; an icon elsewhere is one of ${SKEL_ICONS.join(" · ")}`);
    else if (!SKEL_ICONS.includes(it.icon!)) findings.push(`an icon is \`${it.icon}\`, and a skeleton draws ${SKEL_ICONS.join(" · ")}; \`default\` is drawn where none fits`);
    const mark = it.mark ?? it.on !== undefined;
    out.push(...skelIcon(it.icon!, ix + h / 2, mid, h, mark, it.on, mark && it.mark !== true ? h - SKEL_MARK_DROP : h));
    if (it.text !== undefined) out.push(`  <text class="sds-code" x="${ix + h + SKEL_LABEL_GAP}" y="${baseline}">${esc(it.text)}</text>`);
    return;
  }
  if (kind === "control") {
    const text = it.text ?? "";
    if (!SKEL_CONTROLS.includes(it.control!)) findings.push(`a control is \`${it.control}\`, and a skeleton draws ${SKEL_CONTROLS.join(" · ")}`);
    if (it.tag !== undefined) findings.push(`a control carries no tag: \`${it.tag}\` names a component, a part or a slot, and a control is told by its sample value`);
    if (text.includes("\n")) findings.push("a control stands on one line, and its sample value runs over more");
    const cls = "sds-skel-control" + (it.main ? " sds-skel-main" : "");
    if (it.icon !== undefined && skelOwnWidth(it) && !SKEL_ICONS.includes(it.icon))
      findings.push(`an icon is \`${it.icon}\`, and a skeleton draws ${SKEL_ICONS.join(" · ")}; \`default\` is drawn where none fits`);
    if (it.control === "switch") {
      // ON OR OFF IS TOLD BY WHERE THE KNOB STANDS, and by its weight: at the end and solid when on, at the start and hollow when off.
      const trackH = h - SKEL_SWITCH_DROP, trackW = skelSwitchW(h), knob = trackH / 2 - 3;
      out.push(skelRect("sds-skel-control", ix, mid - trackH / 2, trackW, trackH, trackH / 2));
      out.push(`  <circle class="sds-skel-glyph${it.on ? " sds-skel-glyph-solid" : ""}" cx="${r2(it.on ? ix + trackW - trackH / 2 : ix + trackH / 2)}" cy="${r2(mid)}" r="${r2(knob)}"/>`);
      if (text) out.push(`  <text class="sds-code" x="${ix + trackW + SKEL_LABEL_GAP}" y="${baseline}">${esc(text)}</text>`);
      return;
    }
    if (it.control === "tabs") {
      // TABS AT THE PAGE LEVEL ARE PILLS; TABS INSIDE A CONTAINER, A CARD OR A WIDGET ARE THE LINE. The chosen tab is
      // heavier in both. Each word keeps its place in the row either way, so the pill reaches out into the gap around it.
      // THE LINE: a thin line runs under the whole row, as the rule of a tab list does, and the chosen word has a heavier one.
      const words = skelTabWords(it);
      const chosen = it.chosen ?? 0;
      if (!words.length) { findings.push("a row of tabs names its words in `tabs`, and this one names none"); return; }
      if (!Number.isInteger(chosen) || chosen < 0 || chosen >= words.length)
        findings.push(`\`chosen\` is \`${chosen}\`, and this row has ${words.length} tabs, counted from 0`);
      if (words.some((word) => word.includes("\n"))) findings.push("a control stands on one line, and a tab's word runs over more");
      // A ROW OF TABS THAT NAMES ITS `type` IS DRAWN IN IT WHEREVER IT STANDS (RULE.DEVEX.WORKSPACE.302), as `DSTabs` draws the type a page
      // names: `PILL` the pills, as the second form of a choice to see sets them over its panel inside a feature, and `LINE` the line.
      if (it.type !== undefined && !SKEL_TABS_TYPES.includes(it.type))
        skelSay(findings, `a row of tabs' \`type\` is \`${String(it.type)}\`, and a skeleton draws ${SKEL_TABS_TYPES.join(" · ")}; the level's look is drawn in its place`);
      const pill = it.type === "PILL" || (it.type !== "LINE" && !!it.atPage);
      const foot = iy + h - 1;
      // THE PILL'S TRACK STARTS WHERE THE ROW STARTS, so its edge lines up with the page head and the parts under it;
      // its words stand in from that edge by the pill's padding and the track's.
      const pillPad = SKEL_LABEL_GAP, trackPad = 3;
      const inset = pill ? pillPad + trackPad : 0;
      // A ROW OF TABS WIDER THAN ITS COLUMN KEEPS ITS WIDTH AND SCROLLS (RULE.DEVEX.WORKSPACE.304), as `DSTabs` scrolls it in `DSHScroll`: it is
      // cut at the column's end, the tabs that stand whole before the mark are drawn, and the mark stands at the edge that has more.
      const cut = iw + 0.5 < skelFixedWidth(it, h), shownTo = ix + iw - SKEL_SCROLL_MARK - SKEL_PACK_GAP;
      const shows = (from: number, w: number) => !cut || from + w <= shownTo;
      if (pill) {
        // THE PILL: a muted rounded track with an outline holds the words, and the chosen one stands in a filled pill.
        const pillH = h - trackPad * 2, trackW = cut ? iw : iw + inset * 2;
        out.push(skelRect("sds-skel-surface", ix, iy, trackW, h, h / 2));
        out.push(skelRect("sds-skel-control", ix, iy, trackW, h, h / 2));
        let px = ix + inset;
        words.forEach((word, index) => {
          if (index === chosen && shows(px - pillPad, skelTabW(it, word) + pillPad * 2))
            out.push(skelRect("sds-skel-control", px - pillPad, iy + trackPad, skelTabW(it, word) + pillPad * 2, pillH, pillH / 2));
          px += skelTabW(it, word) + SKEL_GAP;
        });
      } else out.push(`  <path class="sds-skel-control" d="M${r2(ix)} ${r2(foot)} H${r2(ix + iw)}"/>`);
      let tx = ix + inset;
      words.forEach((word, index) => {
        const tw = skelTabW(it, word);
        if (shows(tx, tw)) {
          if (it.icon !== undefined) out.push(...skelGlyph(it.icon, tx + SKEL_INLINE_ICON / 2, mid, SKEL_INLINE_ICON));
          out.push(`  <text class="${index === chosen ? "sds-label" : "sds-code"}" x="${r2(tx + skelInlineIconW(it))}" y="${baseline}">${esc(word)}</text>`);
          if (index === chosen && !pill) out.push(`  <path class="sds-skel-border" d="M${r2(tx)} ${r2(foot)} H${r2(tx + tw)}"/>`);
        }
        tx += tw + SKEL_GAP;
      });
      if (cut) out.push(...skelScrollMark(ix + iw - (pill ? trackPad : 0), mid));
      return;
    }
    if (it.control === "badge") {
      // A SMALL FRAMED WORD, LOWER THAN A BUTTON AND NEVER HEAVY, so nobody reads it as something to press.
      if (!text) findings.push("a badge carries its word in `text`, and this one carries none");
      if (it.main) findings.push("a badge never takes the weight of a main action; leave `main` off a badge");
      const badgeH = h - SKEL_BADGE_DROP;
      out.push(skelRect("sds-skel-control", ix, mid - badgeH / 2, iw, badgeH, badgeH / 2));
      if (it.icon !== undefined) out.push(...skelGlyph(it.icon, ix + SKEL_LABEL_GAP + SKEL_INLINE_ICON / 2, mid, SKEL_INLINE_ICON));
      if (text) out.push(`  <text class="sds-code" x="${r2(ix + SKEL_LABEL_GAP + skelInlineIconW(it))}" y="${baseline}">${esc(text)}</text>`);
      return;
    }
    if (it.control === "pager") {
      let px = ix;
      for (const part of skelPagerParts(it)) {
        const pw = skelPartW(part, h);
        out.push(skelRect(cls, px, iy, pw, h));
        if (part === "‹" || part === "›") out.push(...skelGlyph(part === "‹" ? "previous" : "next", px + pw / 2, mid, Math.round(h / 2)));
        else out.push(`  <text class="sds-code" x="${r2(px + (pw - part.length * SKEL_W_LABEL) / 2)}" y="${baseline}">${esc(part)}</text>`);
        px += pw + SKEL_PACK_GAP;
      }
      return;
    }
    if (it.control === "checkbox") {
      out.push(skelRect(cls, ix, iy, h, h));
      out.push(...skelGlyph("checkbox", ix + h / 2, mid, Math.round(h / 2)));
      if (text) out.push(`  <text class="sds-code" x="${ix + h + SKEL_LABEL_GAP}" y="${baseline}">${esc(text)}</text>`);
      return;
    }
    out.push(skelRect(cls, ix, iy, iw, h));
    if (text) out.push(`  <text class="sds-code" x="${ix + SKEL_PAD}" y="${baseline}">${esc(text)}</text>`);
    if (it.control === "select") out.push(...skelGlyph("select", ix + iw - SKEL_PAD - 4, mid, Math.round(h / 2)));
    return;
  }
  // a stand-in: bars with no box around them
  const count = Math.max(1, it.lines ?? 3);
  const kindOf = it.standin ?? "rows";
  if (!SKEL_STANDINS.includes(kindOf)) findings.push(`a stand-in is \`${kindOf}\`, and a skeleton draws ${SKEL_STANDINS.join(" · ")}`);
  const bar = (x: number, y: number, w: number, hh: number) => skelRect("sds-skel-bar", x, y, w, hh);
  if (kindOf === "table") {
    // A TABLE WITH SAMPLE VALUES: a head row of words, a line under it, and a few rows of cells. The room over is
    // shared by the columns that hold data; a column with an empty head holds the actions of a row and stands at the end.
    const columns = Array.isArray(it.columns) ? it.columns.map(String) : [];
    const rows = Array.isArray(it.cells) ? it.cells : [];
    if (!columns.length) { findings.push("a table names the words of its head row in `columns`, and this one names none"); return; }
    const widths = skelTableColumns(it, h);
    const data = columns.map((head, c) => (head === "" ? -1 : c)).filter((c) => c >= 0);
    const over = Math.max(0, iw - skelTableW(it, h));
    if (data.length) for (const c of data) widths[c] += over / data.length;
    const left: number[] = [];
    let cx = ix + SKEL_PAD;
    widths.forEach((w, c) => { left.push(cx); cx += w + SKEL_GAP; });
    if (!data.length) left.forEach((_, c) => { left[c] += over; });
    const headY = iy + SKEL_PAD;
    // THE HEAD ROW OF A FLUSH TABLE IS A BAND, with its words small and in capitals, as the library's table draws it.
    // The band begins at the edge above the table, the outline or the line over its part, and its words stand at its middle.
    const headLine = headY + SKEL_TABLE_HEAD - 4, bandTop = it.flush ? it.edgeTop ?? iy : iy;
    // A FLUSH TABLE IN A PART THAT IS A UNIT reaches that part's boundary, which stands inside the outline.
    const reach = SKEL_PAD - (it.inPart ? SKEL_LABEL_GAP : 0);
    if (it.flush) out.push(skelRect("sds-skel-surface", ix - reach, bandTop, iw + reach * 2, headLine - bandTop, 0));
    columns.forEach((head, c) => { if (head) out.push(it.flush
      ? `  <text class="sds-note" x="${r2(left[c])}" y="${Math.round((bandTop + headLine) / 2 + 4)}" style="letter-spacing:.06em;font-weight:600">${esc(head.toUpperCase())}</text>`
      : `  <text class="sds-label" x="${r2(left[c])}" y="${Math.round(headY + 12)}">${esc(head)}</text>`); });
    // A FLUSH TABLE REACHES THE OUTLINE OF ITS CONTAINER: the line under its head row and a line under each row
    // run from edge to edge, as a table does that is the whole of a container's content.
    const lineFrom = it.flush ? ix - reach : ix + SKEL_PAD, lineTo = it.flush ? ix + iw + reach : ix + iw - SKEL_PAD;
    out.push(`  <path class="sds-skel-control" d="M${r2(lineFrom)} ${r2(headY + SKEL_TABLE_HEAD - 4)} H${r2(lineTo)}"/>`);
    if (it.flush) for (let r = 1; r < rows.length; r++)
      out.push(`  <path class="sds-skel-control" d="M${r2(lineFrom)} ${r2(headY + SKEL_TABLE_HEAD + r * skelTableRowH(h) - 2)} H${r2(lineTo)}"/>`);
    rows.forEach((row, r) => {
      if (!Array.isArray(row)) { findings.push("a row of a table is a list of cells, one for each column"); return; }
      if (row.length > columns.length) findings.push(`a row of a table holds ${row.length} cells, and the table has ${columns.length} columns`);
      const top = headY + SKEL_TABLE_HEAD + r * skelTableRowH(h) + SKEL_TABLE_ROW_PAD;
      row.slice(0, columns.length).forEach((given, c) => {
        const cell = skelCell(given), cellKind = skelKind(cell);
        if (cellKind === "note" && cell.note === "") return;
        if (!SKEL_CELL_KINDS.includes(cellKind)) { findings.push("a cell of a table is a word, a note, an icon or a control"); return; }
        // A box in a cell that takes `fill` is as wide as its column, so the action that saves it stands beside it.
        const cw = cell.fill && columns[c] !== "" ? widths[c] : skelFixedWidth(cell, h);
        const at = columns[c] === "" ? left[c] + widths[c] - cw : left[c];
        skelDrawLeaf(cell, cellKind!, at, top, cw, h, h, h, findings, out);
      });
    });
    return;
  }
  if (kindOf === "cards") {
    const cardW = (iw - SKEL_GAP * (count - 1)) / count;
    for (let c = 0; c < count; c++) {
      const cx = ix + c * (cardW + SKEL_GAP);
      out.push(skelRect("sds-skel-control", cx, iy, cardW, SKEL_CARD_H));
      out.push(bar(cx + SKEL_PAD, iy + SKEL_PAD, (cardW - SKEL_PAD * 2) * 0.5, SKEL_HEAD_BAR));
      out.push(bar(cx + SKEL_PAD, iy + SKEL_PAD + SKEL_BAR_STEP + 4, cardW - SKEL_PAD * 2, SKEL_BAR));
      out.push(bar(cx + SKEL_PAD, iy + SKEL_PAD + SKEL_BAR_STEP * 2 + 4, (cardW - SKEL_PAD * 2) * 0.7, SKEL_BAR));
    }
    return;
  }
  if (kindOf === "field") {
    // THE FIELD OF A FORM, AS THE LIBRARY'S FORM FIELD LAYS IT OUT: its title, with the mark of its help at the end of that line;
    // its control, as wide as its place; and one line under the control, its error or else its description.
    // An error is told by the failure colour, on the outline of the control and on its own line.
    const top = iy + skelFieldHeadH(it) + SKEL_LABEL_GAP, below = skelFieldBelow(it);
    if (it.label === undefined) out.push(bar(ix, iy, Math.min(iw, SKEL_FIELD_W) * 0.4, SKEL_HEAD_BAR));
    else {
      // The title of a field that is entered has the weight of content. The title of one that is read is heavier and
      // lighter in tone than its value, so it reads as the heading of the value and does not compete with it; the mark
      // of its help stands beside it, where the entered field's stands at the end of the line.
      out.push(it.read
        ? `  <text class="sds-note" x="${r2(ix)}" y="${Math.round(iy + 13)}" style="font-size:${SKEL_STEP_ITEM}px;font-weight:600">${esc(it.label)}</text>`
        : `  <text class="sds-title" x="${r2(ix)}" y="${Math.round(iy + 13)}" style="font-size:${SKEL_STEP_ITEM}px;font-weight:400">${esc(it.label)}</text>`);
      if (it.info) {
        const cx = it.read ? ix + skelStepW(it.label, SKEL_STEP_ITEM) + SKEL_LABEL_GAP + 6 : ix + iw - 6;
        out.push(`  <circle class="sds-skel-glyph" cx="${r2(cx)}" cy="${r2(iy + 9)}" r="6"/>`);
        out.push(`  <text class="sds-note" x="${r2(cx)}" y="${r2(iy + 12.5)}" text-anchor="middle" style="font-size:9px;font-weight:600">i</text>`);
      }
    }
    if (it.read) {
      // A FIELD THAT IS READ, AS THE LIBRARY'S DATA UNIT SHOWS IT: its value under its title, with no box around it.
      const valueMid = iy + skelFieldHeadH(it) + SKEL_PACK_GAP + SKEL_READ_LINE / 2, text = it.text ?? "";
      if (it.label === undefined) findings.push("a field that is read carries its title in `label`, and this one carries none");
      if (it.control === "badge") {
        const badge: SkeletonItem = { control: "badge", text };
        skelDrawLeaf(badge, "control", ix, valueMid - SKEL_FACT_CTL / 2, skelFixedWidth(badge, SKEL_FACT_CTL), SKEL_FACT_CTL, SKEL_FACT_CTL, SKEL_FACT_CTL, findings, out);
      } else out.push(`  <text class="sds-title" x="${r2(ix)}" y="${Math.round(valueMid + 4)}" style="font-size:${SKEL_STEP_PART}px;font-weight:400">${esc(text)}</text>`);
      return;
    }
    const failed = it.error !== undefined;
    out.push(failed ? skelRect("sds-skel-control", ix, top, iw, h).replace("/>", ` style="stroke:${SKEL_FAIL}"/>`) : skelRect("sds-skel-control", ix, top, iw, h));
    if (it.text !== undefined) out.push(`  <text class="sds-code" x="${ix + SKEL_PAD}" y="${Math.round(top + h / 2 + 4)}">${esc(it.text)}</text>`);
    if (it.control === "select") out.push(...skelGlyph("select", ix + iw - SKEL_PAD - 4, top + h / 2, Math.round(h / 2)));
    if (below !== undefined) out.push(`  <text class="sds-note" x="${r2(ix)}" y="${Math.round(top + h + SKEL_PACK_GAP + 13)}"${failed ? ` style="fill:${SKEL_FAIL}"` : ""}>${esc(below)}</text>`);
    return;
  }
  const heads = new Set(it.headings ?? []);
  let by = iy + SKEL_PAD;
  for (let b = 0; b < count; b++) {
    const head = heads.has(b);
    if (kindOf === "list") {
      out.push(bar(ix + SKEL_PAD, by, SKEL_BAR, SKEL_BAR));
      out.push(bar(ix + SKEL_PAD + SKEL_BAR + SKEL_LABEL_GAP, by, (iw - SKEL_PAD * 2 - SKEL_BAR - SKEL_LABEL_GAP) * (head ? 0.42 : 0.7), head ? SKEL_HEAD_BAR : SKEL_BAR));
    } else out.push(bar(ix + SKEL_PAD, by, (iw - SKEL_PAD * 2) * (head ? 0.42 : 1), head ? SKEL_HEAD_BAR : SKEL_BAR));
    by += SKEL_BAR_STEP;
  }
}

/** Whether a row's one item takes the height left in its column: a frame, a slot or a part, with `fill`. */
const skelGrows = (row: SkeletonRow): boolean => {
  if (row.items.length !== 1) return false;
  const it = row.items[0], kind = skelKind(it);
  return kind === "frame" ? !!it.frame!.fill : (kind === "slot" || kind === "place") && !!it.fill;
};

/** What a container's own props say, checked: each one a reader maps to one of the four. */
function skelContainerFindings(frame: SkeletonFrame, parts: SkeletonFrame[], findings: string[]): void {
  const names = parts.map((p) => p.tag);
  if (!Array.isArray(frame.frames)) { findings.push("`frames` is the list of the parts that share a frame, by their `tag`"); return; }
  for (const named of frame.frames)
    if (!names.includes(named)) findings.push(`\`frames\` names \`${named}\`, and no part of this container has that \`tag\``);
  if (frame.frames.length && !frame.raised && !frame.bordered)
    findings.push("`frames` lists parts, and the frame is neither `raised` nor `bordered`; a part not in a frame is flat, so leave it out of `frames`");
  if ((frame.rows ?? []).some((r) => !(r.items.length === 1 && r.items[0].frame)))
    findings.push("a container's rows each hold one part, a `frame` with a `tag`");
  for (const part of parts) {
    if (!part.tag) findings.push("a part of a container carries a name; give the part its `tag`");
    if (part.look !== undefined) findings.push(`the part \`${part.tag ?? ""}\` takes its frame from the container's \`frames\`; leave \`look\` off a part`);
  }
}

/** One frame, drawn at `(x, y)`. `forcedW` is given for a frame nested in a row; the outer frame
 *  sizes itself from its own rows instead. `named` counts the named boundaries that hold this one.
 *  `inherited` is the control height of the frame that holds this one, and a `bare` part leaves its
 *  marks to the container that holds it. `canvas` is the width an outer frame is drawn at: the grid's
 *  content width for a spec with one frame, and the width of its screen class for a view. */
function skelDrawFrame(frame: SkeletonFrame, x: number, y: number, forcedW: number | undefined, findings: string[], out: string[], forcedH?: number, named = 0, inherited = SKEL_DEFAULT_H, bare = false, canvas = SKEL_CANVAS): void {
  const root = forcedW === undefined;
  skelOldFields(frame, findings);
  if (frame.size !== undefined && SKEL_CONTROL_H[frame.size] === undefined)
    findings.push(`a \`size\` is \`${frame.size}\`, and a skeleton takes ${Object.keys(SKEL_CONTROL_H).join(" · ")}`);
  const ctl = skelSizeH(frame, inherited);
  const isContainer = skelHasParts(frame);
  const rows = skelRows(frame);
  // AN ITEM THAT STANDS ON THE PAGE ITSELF IS THE PAGE'S HEADER: it names the record the page is about, so its
  // title is as large and as heavy as a container's, and not the title of one thing among many.
  // Where the page level stands above the frame, it is the head of the page, and an item in the frame is not.
  if (root && !frame.headed) for (const row of rows) for (const it of row.items ?? []) if (it.item) it.part = true;
  // TABS IN THE ROOT FRAME'S ROWS STAND AT THE PAGE LEVEL, as the page head's actions do (they are the root frame's own row).
  if (root) for (const row of rows) for (const it of row.items ?? []) if (it.control === "tabs") it.atPage = true;
  const parts = skelParts(frame);
  const entries = skelAccordionOf(frame);
  if (isContainer) skelContainerFindings(frame, parts, findings);
  // A `DSAccordionGroup` THAT DRAWS ITS ENTRIES TAKES `bordered` AS ITS OWN, an outline round each entry (RULE.DEVEX.WORKSPACE.301).
  else if (frame.raised !== undefined || (frame.bordered !== undefined && entries === undefined) || frame.rounded !== undefined)
    findings.push("`raised`, `bordered` and `rounded` belong to a frame with `frames`; a frame that stands alone takes `look`");
  const labelCol = skelLabelCol(frame);
  const inset = skelInset(frame);
  const rowContentW = forcedW !== undefined
    ? Math.max(0, forcedW - inset * 2 - (labelCol ? labelCol + SKEL_GAP : 0))
    : Math.max(SKEL_MIN_W, canvas - inset * 2 - (labelCol ? labelCol + SKEL_GAP : 0), ...rows.map((r) => skelRowMinWidth(r, ctl)));
  const w = forcedW !== undefined ? forcedW : isContainer ? Math.max(canvas - SKEL_PAD * 2, skelFrameMinWidth(frame, inherited)) : inset * 2 + (labelCol ? labelCol + SKEL_GAP : 0) + rowContentW;
  // A FRAME IN A ROW STANDS AS TALL AS THE ROW, so a rail and the main area beside it end on one line.
  const natural = skelFrameHeight(frame, inherited);
  const h = Math.max(natural, forcedH ?? 0);

  if (frame.look !== undefined && !SKEL_LOOKS.includes(frame.look))
    findings.push(`a frame's \`look\` is \`${frame.look}\`, and a frame takes ${SKEL_LOOKS.join(" · ")}`);
  if (frame.look !== undefined && frame.look !== "container" && !frame.tag && frame.unit === undefined && !frame.label && !root)
    findings.push(`a boundary with a \`look\` of \`${frame.look}\` carries no name; give the part its \`tag\``);
  const ownName = frame.tag ?? frame.unit;
  if (ownName && named >= SKEL_NEST_MAX)
    findings.push(`the boundary \`${ownName}\` sits inside ${named} named boundaries, and a skeleton nests ${SKEL_NEST_MAX} at most; draw \`${ownName}\` as a skeleton of its own`);
  // A CONTAINER HAS NO BOX OF ITS OWN: its frames are drawn behind its parts, below.
  // A CONTAINER ON A SURFACE IS ONE BOX THAT HOLDS ITS HEADER (RULE.DEVEX.WORKSPACE.268): the thin rounded outline, its
  // unit's name at the corner, its header as a band under the name, the title and the line under it at the start and
  // its actions at the end, then under a line its content and, under another, its footer. The header is the container's
  // own part, `DSPanelContainer.Header`, so it is drawn inside the box and never as a heading standing over it.
  const surface = frame.look === "container" && !root;
  if (frame.look === "container" && frame.marked)
    findings.push("`marked` is for a row with no border; a container's header stands inside its outline, so a container takes no `marked`");
  // A SECTION'S FILL IS A BAND ACROSS ITS BOX, the background a raised frame has (RULE.DEVEX.WORKSPACE.285). How strong the fill
  // is belongs to the library's look, so every strength draws the same band.
  // A GRID SECTION'S `section` IS DRAWN AS A SECTION'S OWN FIELDS (RULE.DEVEX.WORKSPACE.293).
  const sectionLook = skelSectionLook(frame);
  const band = sectionLook !== undefined && SKEL_SURFACE_COLORS.includes(sectionLook.color as string) && sectionLook.color !== "BASE" ? skelRect("sds-skel-surface", x, y, w, h, 0) : undefined;
  if (band && !(root && !bare)) out.push(band);
  if (surface) {
    const headH = skelContainerHead(frame);
    // BY DEFAULT A CONTAINER FRAMES ITS CONTENT AND ITS FOOTER, NOT ITS HEADER: the container's extent is a dotted
    // outline, as a group's is, and the content and the footer stand in one thin rounded box under the header.
    out.push(skelRect("sds-skel-guide", x, y, w, h));
    if (rows.length && !skelCardsOnly(frame)) out.push(skelRect("sds-skel-control", x, y + skelContainerEdge(frame), w, h - skelContainerEdge(frame), SKEL_ROUND));
    const bandY = y + skelContainerBandTop(frame);
    if (frame.label) out.push(skelStepText(frame.label, SKEL_STEP_CONTAINER, x + SKEL_PAD, bandY + 23));
    if (frame.label && frame.note) out.push(`  <text class="sds-note" x="${x + SKEL_PAD}" y="${bandY + 40}">${esc(frame.note)}</text>`);
    const actions = frame.actions ?? [];
    let ax = x + w - SKEL_PAD - (actions.reduce((t, a) => t + skelFixedWidth(a, ctl), 0) + SKEL_LABEL_GAP * Math.max(0, actions.length - 1));
    const actionsTop = bandY + (headH - SKEL_LABEL_GAP * 2 - ctl) / 2;
    for (const action of actions) {
      const actionKind = skelKind(action), aw = skelFixedWidth(action, ctl);
      if (!SKEL_CELL_KINDS.includes(actionKind)) findings.push("the actions of a container's header are words, a note, an icon or a control");
      else skelDrawLeaf(action, actionKind!, ax, actionsTop, aw, ctl, ctl, ctl, findings, out);
      ax += aw + SKEL_LABEL_GAP;
    }
  }
  // A ROOT FRAME THAT STANDS IN A LAYOUT'S CONTENT IS BARE: the content's line is its edge.
  // A FEATURE WHOSE `frames` HOLD THE WHOLE OF IT IS DRAWN IN ITS OWN FRAME, in place of its dotted boundary (RULE.DEVEX.WORKSPACE.286).
  const featureFrames = skelFeatureFrames(frame);
  if (root && !bare) out.push(skelRect("sds-box", x, y, w, h), ...(band ? [band] : []));
  else if (!bare && !isContainer && !surface) out.push(...(featureFrames.whole ? skelSurfaceMarks(skelSurfaceOf(frame), x, y, w, h) : skelMarks(frame.look, x, y, w, h)));
  // A SECTION'S `inset` IS A SOLID LINE ALONG THE TOP AND THE BOTTOM EDGE OF ITS BOX, and none at its sides.
  if (sectionLook?.inset === true) out.push(skelPath("sds-skel-border", [[[x, y], [x + w, y]], [[x, y + h], [x + w, y + h]]]));
  const corner = skelCornerName(frame, frame.look === "container");
  const tagH = corner ? SKEL_TAG_H + SKEL_LABEL_GAP : 0;
  if (corner) out.push(`  <text class="sds-note" x="${x + SKEL_LABEL_GAP}" y="${y + SKEL_LABEL_H + 4}">${esc(corner)}</text>`);
  // A CONTAINER'S UNIT IS NAMED AT THE CORNER OF ITS OUTLINE, over its header, quiet, on the line the book gives a name.
  if (frame.look === "container" && frame.unit !== undefined)
    out.push(`  <text class="sds-note" x="${x + SKEL_LABEL_GAP}" y="${y + SKEL_LABEL_H + 4}">${esc(frame.unit)}</text>`);
  // A CARD MAY CARRY A MARK BEFORE ITS TITLE, for the kind of thing the card is about.
  const cardMark = frame.look === "card" && frame.media !== undefined ? SKEL_CARD_MARK + SKEL_LABEL_GAP : 0;
  if (cardMark) out.push(...skelIcon(frame.media!, x + SKEL_PAD + SKEL_CARD_MARK / 2, y + tagH + 21, SKEL_CARD_MARK, true, undefined, SKEL_CARD_MARK));
  if (frame.label && !surface) out.push(frame.look === "card" ? skelStepText(frame.label, SKEL_STEP_CARD, x + SKEL_PAD + cardMark, y + tagH + 26)
    : `  <text class="sds-title" x="${x + SKEL_PAD}" y="${y + tagH + 26}">${esc(frame.label)}</text>`);
  if (frame.label && frame.note && !surface) out.push(`  <text class="sds-code" x="${x + SKEL_PAD}" y="${y + tagH + 45}">${esc(frame.note)}</text>`);
  // A CARD'S ACTIONS STAND AT THE END OF ITS TITLE'S LINE, as a container's stand at the end of its header.
  if (frame.look === "card" && frame.actions?.length) {
    let cx = x + w - SKEL_PAD - (frame.actions.reduce((t, a) => t + skelFixedWidth(a, ctl), 0) + SKEL_LABEL_GAP * (frame.actions.length - 1));
    for (const action of frame.actions) {
      const actionKind = skelKind(action), aw = skelFixedWidth(action, ctl);
      if (!SKEL_CELL_KINDS.includes(actionKind)) findings.push("the actions of a card's header are words, a note, an icon or a control");
      else skelDrawLeaf(action, actionKind!, cx, y + tagH + 22 - ctl / 2, aw, ctl, ctl, ctl, findings, out);
      cx += aw + SKEL_LABEL_GAP;
    }
  }
  // A GROUP'S ENTRIES STAND INSIDE ITS BOUNDARY, under its name, at a boundary's padding (RULE.DEVEX.WORKSPACE.301).
  if (entries) { skelDrawAccordion(frame, entries, x + SKEL_PAD, y + skelHead(frame), w - SKEL_PAD * 2, ctl, out); return; }

  // A PART THAT TAKES THE HEIGHT LEFT: where the frame stands taller than its rows need, the rows whose
  // one item is a `fill` frame, slot or part share what is over.
  const slack = Math.max(0, h - natural);
  const growers = rows.map((row, i) => (skelGrows(row) ? i : -1)).filter((i) => i >= 0);

  if (isContainer) {
    // THE PARTS STAND WITH NO GAP. Those named in `frames` and next to each other share one frame.
    const heights = parts.map((p) => skelFrameHeight(p, ctl));
    const partGrowers = parts.map((p, i) => (p.fill ? i : -1)).filter((i) => i >= 0);
    if (partGrowers.length && slack > 0) for (const i of partGrowers) heights[i] += slack / partGrowers.length;
    const tops: number[] = [];
    let top = y + skelHead(frame);
    heights.forEach((ph) => { tops.push(top); top += ph; });
    const listed = parts.map((p) => !!p.tag && Array.isArray(frame.frames) && frame.frames.includes(p.tag));
    const radius = frame.rounded ? SKEL_ROUND : 0;
    for (let i = 0; i < parts.length; i++) {
      if (!listed[i]) continue;
      let end = i;
      while (end + 1 < parts.length && listed[end + 1]) end++;
      const fy = tops[i], fh = tops[end] + heights[end] - fy;
      if (frame.raised) out.push(skelRect("sds-skel-surface", x, fy, w, fh, radius));
      if (frame.bordered) {
        out.push(skelRect("sds-skel-border", x, fy, w, fh, radius));
        for (let d = i + 1; d <= end; d++) out.push(`  <path class="sds-skel-border" d="M${r2(x)} ${r2(tops[d])} H${r2(x + w)}"/>`);
      }
      i = end;
    }
    parts.forEach((part, i) => {
      // A PART WITH NO SOLID BORDER AROUND IT KEEPS ITS DOTTED BOUNDARY; a solid line already marks the others.
      if (!(frame.bordered && listed[i])) out.push(skelRect("sds-skel-guide", x, tops[i], w, heights[i], 0));
      skelDrawFrame(part, x, tops[i], w, findings, out, heights[i], named + (skelNamed(frame) ? 1 : 0), ctl, true);
    });
    return;
  }

  const heights = rows.map((r) => skelRowHeight(r, ctl));
  if (growers.length && slack > 0) for (const i of growers) heights[i] += slack / growers.length;

  const itemsX = x + inset + (labelCol ? labelCol + SKEL_GAP : 0);
  // A BACKDROP'S MEDIA STANDS BEHIND THE ROWS, across the feature under its name, and its own name stands at its corner; the rows keep
  // to their measure over it, at the start or centred (RULE.DEVEX.WORKSPACE.305).
  const backdrop = skelBackdropOf(frame);
  if (backdrop) {
    const top = y + skelHeadOwn(frame) - SKEL_LABEL_GAP;
    skelDrawLeaf(backdrop.media, "slot", x + SKEL_LABEL_GAP, top, w - SKEL_LABEL_GAP * 2, y + h - SKEL_LABEL_GAP - top, 0, ctl, findings, out);
  }
  const backdropW = backdrop ? Math.round(rowContentW * backdrop.measure) : rowContentW;
  const backdropShift = backdrop?.centre ? Math.round((rowContentW - backdropW) / 2) : 0;
  let rowY = y + skelHead(frame);
  const dividers = skelDividers(frame), partStarts = skelPartStarts(frame);
  const lines = skelLined.get(frame.rows);
  const linedRows = rows.map((row) => lines !== undefined && skelLinedRow(row, lines));
  // A FEATURE'S `frames` NAMING `TEXT` ALONE BESIDE ITS MEDIA FRAMES THE WORDS AND THE ITEMS: each run of rows that holds no slot,
  // here, and in a row that holds one, each part of it that is not the media, below.
  const textFrame = featureFrames.text ? skelSurfaceOf(frame) : undefined;
  if (textFrame) {
    const runMarks = (from: number, to: number) => skelSurfaceMarks(textFrame, itemsX - SKEL_LABEL_GAP, from - SKEL_LABEL_GAP, rowContentW + SKEL_LABEL_GAP * 2, to - from + SKEL_LABEL_GAP * 2);
    let top = rowY, runTop: number | undefined, runEnd = 0;
    rows.forEach((row, i) => {
      if (!skelRowHoldsSlot(row)) { runTop ??= top; runEnd = top + heights[i]; }
      else if (runTop !== undefined) { out.push(...runMarks(runTop, runEnd)); runTop = undefined; }
      top += heights[i] + SKEL_GAP;
    });
    if (runTop !== undefined) out.push(...runMarks(runTop, runEnd));
  }
  // A ROW WITH NO BORDER, such as the way back or the header of a record, takes the same dotted line with `marked`,
  // as wide as the containers beside it, so their edges are seen to agree.
  rows.forEach((row, rowIndex) => {
    const rh = heights[rowIndex];
    if (row.marked && !(row.items ?? []).some((it) => it.frame))
      out.push(skelRect("sds-skel-guide", itemsX, rowY - SKEL_GUIDE_OUT, w - SKEL_PAD - (itemsX - x), rh + SKEL_GUIDE_OUT * 2, 0));
    // THE CHOSEN LINE OF A LIST IS A BAND across the outline, from the line above it to the line under it.
    if (surface && row.chosen) {
      const bandTop = rowIndex === 0 ? y + skelContainerEdge(frame) : rowY - SKEL_GAP / 2;
      const bandEnd = rowIndex === rows.length - 1 ? y + h : rowY + rh + SKEL_GAP / 2;
      out.push(skelRect("sds-skel-surface", x, bandTop, w, bandEnd - bandTop, 0));
    }
    // A PART OF A CONTAINER'S CONTENT, AND ITS FOOTER, BEGIN UNDER A LINE across the outline. A line between two rows
    // of one part, as a list in a group draws, stays inside that part's boundary.
    // In a container a line crosses its box above each content part after the first and above its footer; a group is
    // marked by its own boundary and takes no line, and the line between two rows of one list stays.
    if ((surface || frame.look === "card") && dividers.has(rowIndex)) {
      const inPart = row.within !== undefined && !row.lead ? SKEL_LABEL_GAP : 0;
      if (!partStarts.has(rowIndex)) out.push(`  <path class="sds-skel-control" d="M${r2(x + inPart)} ${r2(rowY - SKEL_GAP / 2)} H${r2(x + w - inPart)}"/>`);
    }
    if (row.label) out.push(`  <text class="sds-label" x="${x + SKEL_PAD}" y="${Math.round(rowY + rh / 2 + 4)}">${esc(row.label)}</text>`);
    // A FLUSH TABLE IS TOLD WHERE THE EDGE ABOVE IT IS: the line under the header, or the outline, where it is the first
    // row, or the line over its part. Where a unit's name stands over it, the table begins under the name.
    const namedAbove = row.within !== undefined || (rowIndex === 0 && frame.unit !== undefined && !skelContainerHead(frame));
    if (surface) for (const it of row.items ?? []) if (it.standin === "table" && it.flush) {
      it.edgeTop = namedAbove ? undefined : rowIndex === 0 ? y + skelContainerEdge(frame) : dividers.has(rowIndex) ? rowY - SKEL_GAP / 2 : undefined;
      it.inPart = row.within !== undefined && skelLevel(row.within) !== "card";
    }
    // A PART THAT IS A UNIT OF THE DESIGN SYSTEM is drawn at the level its name gives: a widget, a component or a group a
    // dotted boundary round its rows, and a card its outline; each carries its name at its corner, a group the word *Group*.
    if (row.lead && row.within !== undefined) {
      let end = rowIndex;
      while (end + 1 < rows.length && rows[end + 1].within === row.within && !rows[end + 1].lead) end++;
      const bottom = rowY + heights.slice(rowIndex, end + 1).reduce((t, v) => t + v, 0) + SKEL_GAP * (end - rowIndex);
      const card = skelLevel(row.within) === "card";
      out.push(skelRect(card ? "sds-skel-control" : "sds-skel-guide", x + SKEL_LABEL_GAP, rowY - SKEL_LABEL_GAP, w - SKEL_LABEL_GAP * 2, bottom - rowY + SKEL_LABEL_GAP * 2, card ? SKEL_ROUND : 3));
      out.push(`  <text class="sds-note" x="${x + SKEL_PAD}" y="${rowY + SKEL_LABEL_GAP}">${esc(row.within)}</text>`);
      if (named + (skelNamed(frame) ? 1 : 0) >= SKEL_NEST_MAX)
        findings.push(`the boundary \`${row.within}\` sits inside ${named + (skelNamed(frame) ? 1 : 0)} named boundaries, and a skeleton nests ${SKEL_NEST_MAX} at most; draw \`${row.within}\` as a skeleton of its own`);
    }

    const leadH = skelLeadH(row);
    let innerX = itemsX + backdropShift, innerY = rowY + leadH, innerW = backdropW;
    if (row.framed) {
      out.push(...skelMarks(undefined, innerX, innerY, innerW, rh - leadH));
      innerX += SKEL_GAP; innerY += SKEL_GAP; innerW -= SKEL_GAP * 2;
    }

    const widths = skelRowWidths(row, innerW, ctl, findings);
    // EVERY BOX IN A ROW STANDS AS TALL AS THE ROW, so a named place beside a plain one lines up at
    // both edges, as the regions of a layout do.
    const boxH = (row.framed ? rh - SKEL_GAP * 2 : rh) - leadH;
    if (textFrame && skelRowHoldsSlot(row)) {
      let tx = innerX;
      row.items.forEach((it, i) => {
        const kind = skelKind(it);
        if (kind !== null && kind !== "spacer" && !skelItemHoldsSlot(it)) out.push(...skelSurfaceMarks(textFrame, tx, innerY, widths[i], boxH));
        tx += widths[i] + skelGapAfter(row, i);
      });
    }
    // A ROW THAT STANDS WITH A CENTRED HEAD IS CENTRED IN ITS COLUMN (RULE.DEVEX.WORKSPACE.291): what it holds keeps its widths, and
    // the room left over is shared on its two sides. A row that a `fill` or a spacer fills has none left over.
    const over = skelCentred.has(row) ? innerW - widths.reduce((t, v) => t + v, 0) - skelRowGaps(row) : 0;
    const startX = innerX + (over > 0 ? Math.round(over / 2) : 0);
    // THE LINES BETWEEN A FEATURE'S ITEMS AND BETWEEN A GRID'S CELLS (RULE.DEVEX.WORKSPACE.289): one across the column under every row of
    // them but the last, one in the gap after every part of a row but its last where they stand across, and with `EDGE` a rounded
    // outline round them all. Each line runs to the next, so the lines of a grid meet.
    if (lines !== undefined && linedRows[rowIndex]) {
      const edge = lines.border === "EDGE", before = linedRows[rowIndex - 1] === true, after = linedRows[rowIndex + 1] === true;
      const reach = edge ? SKEL_GAP / 2 : 0;
      if (edge && !before) {
        let end = rowIndex;
        while (linedRows[end + 1] === true) end++;
        const bottom = rowY + heights.slice(rowIndex, end + 1).reduce((t, v) => t + v, 0) + SKEL_GAP * (end - rowIndex);
        out.push(skelRect("sds-skel-control", itemsX - reach, rowY - reach, rowContentW + reach * 2, bottom - rowY + reach * 2, SKEL_ROUND));
      }
      if (before) out.push(`  <path class="sds-skel-control" d="M${r2(itemsX - reach)} ${r2(rowY - SKEL_GAP / 2)} H${r2(itemsX + rowContentW + reach)}"/>`);
      if (lines.across) {
        let lx = startX;
        row.items.forEach((it, i) => {
          if (i < row.items.length - 1 && skelKind(it) !== "spacer") {
            const cx = lx + widths[i] + skelGapAfter(row, i) / 2;
            out.push(`  <path class="sds-skel-control" d="M${r2(cx)} ${r2(rowY - (before || edge ? SKEL_GAP / 2 : 0))} V${r2(rowY + rh + (after || edge ? SKEL_GAP / 2 : 0))}"/>`);
          }
          lx += widths[i] + skelGapAfter(row, i);
        });
      }
    }
    // A SPLIT OF A FEATURE WITH `verticalAlign` STANDS EACH SIDE AT ITS OWN HEIGHT (RULE.DEVEX.WORKSPACE.292), at the top, the middle or
    // the foot of the row; with none, every box in a row stands as tall as the row.
    const aligned = skelAligned.get(row);
    const placed = (own: number) => innerY + (aligned === "TOP" ? 0 : aligned === "BOTTOM" ? boxH - own : (boxH - own) / 2);
    const centres: number[] = [];
    let ix = startX;
    row.items.forEach((it, i) => {
      const iw = widths[i];
      const kind = skelKind(it);
      skelOldFields(it, findings);
      if (kind === "slot") {
        const stray = ["text", "note", "lines", "standin", "control", "icon", "frame"].filter((k) => (it as Record<string, unknown>)[k] !== undefined);
        if (stray.length) findings.push(`a slot holds nothing: \`${it.slot}\` carries ${stray.map((k) => `\`${k}\``).join(", ")}, and a slot is one block whose only content is its name`);
      }
      if (kind === "frame") {
        const own = aligned !== undefined ? Math.min(skelFrameHeight(it.frame!, ctl), boxH) : boxH;
        skelDrawFrame(it.frame!, ix, aligned !== undefined ? placed(own) : innerY, iw, findings, out, own, named + (skelNamed(frame) ? 1 : 0) + (row.within !== undefined ? 1 : 0), ctl);
      } else if (kind !== null && kind !== "spacer") {
        // A PLACE AND A STAND-IN STRETCH, A CONTROL DOES NOT: a named region fills its row, and a
        // control keeps the height of its component, centred on the row's one centre line. An item line in a frame of its
        // own stands as tall as its row, as the boxes of a feature's items do.
        const stretches = aligned === undefined && (kind === "slot" || kind === "place" || (it.height !== undefined && kind === "standin") || (kind === "item" && skelItemFrames.has(it)));
        const own = stretches ? boxH : skelItemHeight(it, ctl);
        const top = aligned !== undefined ? placed(Math.min(own, boxH)) : kind === "standin" || stretches ? innerY : innerY + (boxH - Math.min(own, boxH)) / 2;
        const drawnH = kind === "standin" ? Math.min(own, boxH) : own;
        if (kind !== "standin" && aligned === undefined) centres.push(top + (kind === "control" || kind === "icon" ? ctl : own) / 2);
        skelDrawLeaf(it, kind, ix, top, iw, kind === "control" || kind === "icon" ? ctl : drawnH, boxH, ctl, findings, out);
      }
      ix += iw + skelGapAfter(row, i);
    });
    if (centres.length > 1 && Math.max(...centres) - Math.min(...centres) > 0.5)
      findings.push("the items of one row do not share one centre line");
    rowY += rh + SKEL_GAP;
  });
}

/**
 * WHICH UNIT, WHEN (05-artifacts.md § `SKELETON`, standards-patterns § Which unit, when). The unit a spec names decides
 * the look, and the drawer refuses a unit the rule names wrongly: a `DSCard` is one thing on its own, with no titled
 * parts; a `DSCardWidget` is one thing among several of its kind, built from data, with titled parts; a container is a
 * part of the page with a header; and a line about one thing is a `DSItem`. It reads the spec as written, before
 * `skelUnits` gives a frame the look of its level.
 */
const skelFrameChildren = (frame: SkeletonFrame): SkeletonFrame[] =>
  [...(frame.sections ?? []).flatMap((section) => section?.rows ?? []), ...(frame.rows ?? []), ...(frame.footer ?? [])]
    .flatMap((row) => (row?.items ?? []).map((it) => it?.frame).filter((child): child is SkeletonFrame => !!child));
/** Whether a row is a line built by hand: words, a note with words in it, and an action, and nothing else but room. */
const skelHandLine = (row: SkeletonRow): { words: boolean; note: boolean; action: boolean; only: boolean } => {
  const kinds = (row.items ?? []).map((it) => ({ it, kind: skelKind(it) }));
  const letters = (text: unknown) => typeof text === "string" && /[\p{L}\p{N}]/u.test(text);
  const isAction = ({ it, kind }: { it: SkeletonItem; kind: SkelKind | null }) =>
    (kind === "control" && it.control === "button") || (kind === "icon" && it.text === undefined && it.mark === undefined && it.on === undefined);
  return {
    words: kinds.some(({ it, kind }) => kind === "plain" && letters(it.text)),
    note: kinds.some(({ it, kind }) => kind === "note" && letters(it.note)),
    action: kinds.some(isAction),
    only: kinds.every((entry) => entry.kind === "plain" || entry.kind === "note" || entry.kind === "spacer" || isAction(entry) || (entry.kind === "control" && entry.it.control === "badge")),
  };
};
function skelWhichUnit(frame: SkeletonFrame | undefined, findings: string[], pageLevel = false, inFrames = false): void {
  if (!frame || typeof frame !== "object") return;
  const said = (message: string) => { if (!findings.includes(message)) findings.push(message); };
  const named = typeof frame.unit === "string" ? frame.unit : undefined;
  const level = named !== undefined ? skelLevel(named) : undefined;
  const rowLists = [...(frame.sections ?? []).map((section) => section?.rows ?? []), frame.rows ?? [], frame.footer ?? []];
  if (named === "DSCard" && (frame.sections ?? []).some((section) => section?.label !== undefined))
    said(`the card \`${frame.label ?? named}\` has titled parts: a card with parts is a \`DSCardWidget\``);
  if (named !== undefined && frame.look !== undefined && !inFrames && SKEL_UNITS.has(named) && frame.look !== SKEL_LEVEL_LOOK[level!])
    said(`\`${named}\` writes \`look\` as \`${frame.look}\`, and its level gives \`${SKEL_LEVEL_LOOK[level!]}\`: the unit decides the look; drop \`look\``);
  const children = skelFrameChildren(frame);
  // A `DSCardWidget` HAS A HEAD: a mark, or actions in the head, or titled parts under it. One with none of them
  // shows its own info and is a `DSCard`, however many cards stand beside it.
  const hasParts = (frame.sections ?? []).some((section) => section?.label !== undefined);
  if (named === "DSCardWidget" && frame.media === undefined && (frame.actions ?? []).length === 0 && !hasParts)
    said(`the \`DSCardWidget\` \`${frame.label ?? ""}\` has no head and no parts: a card with no head and no parts is a \`DSCard\``);
  // A ROW OF THE PAGE OUTSIDE ANY FRAME that holds words and an action is one thing with its own info and action.
  if (pageLevel) for (const row of frame.rows ?? []) {
    const line = skelHandLine(row);
    if (!(row?.items ?? []).some((it) => it?.frame) && (line.words || line.note) && line.action)
      said("a row of the page outside any frame holds words and an action: one thing with its own info and action is a `DSCard`");
  }
  // A ROW BUILT BY HAND as words, a note and an action is one line about one thing.
  for (const rows of rowLists) for (const row of rows) {
    const line = skelHandLine(row);
    if (line.words && line.note && line.action && line.only)
      said("a row is built by hand as words, a note and an action: one line about one thing is a `DSItem`; write it as an `item`");
  }
  for (const child of children) skelWhichUnit(child, findings, false, skelHasParts(frame));
}

/**
 * THE UNITS OF A SPEC, read once before anything is drawn. A `unit` the barrel does not name is a finding, on a
 * frame and on a part of the content alike. A frame that names a unit and no `look` is drawn in its level's look:
 * a container its outline, a card its outline and title, a widget or a component a dotted boundary. A part of a
 * container with `frames` takes its frame from the container, so it is given no look.
 */
function skelUnits(frame: SkeletonFrame | undefined, findings: string[], inFrames = false): void {
  if (!frame || typeof frame !== "object") return;
  const known = (unit: unknown) => {
    if (typeof unit === "string" && SKEL_UNITS.has(unit)) return;
    const said = `\`${String(unit)}\` is no unit of the design system: a \`unit\` is a name its barrel exports, such as \`DSPanelContainer\`, \`DSFilterBar\`, \`DSCard\` or \`DSForm\``;
    if (!findings.includes(said)) findings.push(said);
  };
  if (frame.unit !== undefined) {
    known(frame.unit);
    if (frame.look === undefined && !inFrames && typeof frame.unit === "string") frame.look = SKEL_LEVEL_LOOK[skelLevel(frame.unit)];
  }
  for (const section of frame.sections ?? []) if (section?.unit !== undefined) known(section.unit);
  const rows = [...(frame.sections ?? []).flatMap((section) => section?.rows ?? []), ...(frame.rows ?? []), ...(frame.footer ?? [])];
  for (const row of rows) for (const it of row?.items ?? []) if (it?.frame) skelUnits(it.frame, findings, skelHasParts(frame));
}

/** What a feature hands the regions inside it that are no unit: the lines of its items, whether they are numbered and counted so
 *  far, and whether they are a `LIST`. */
type SkelFeatureLook = { lines?: SkelLines; numbered: boolean; list: boolean; count: { n: number }; stats?: SkelStat };
/** Whether a row stands centred with a centred head: it holds actions, words, icons or item lines, and no item line of a `LIST`. */
const skelCentrable = (row: SkeletonRow, list: boolean): boolean => {
  const kinds = (row?.items ?? []).map((it) => (it && typeof it === "object" ? skelKind(it) : null));
  return kinds.some((kind) => kind !== "spacer")
    && kinds.every((kind) => kind === "control" || kind === "icon" || kind === "plain" || kind === "note" || kind === "spacer" || (kind === "item" && !list));
};
/**
 * A SECTION'S FILL, A FEATURE'S FRAMES, LINES, NUMBERS AND ALIGNMENT, AND A GRID'S COLUMNS, read once before anything is drawn
 * (RULE.DEVEX.WORKSPACE.285, .286, .288 to .293, .299). A view hands down its screen class as `device`. `color`, `strength` and `inset` belong to a `DSSectionContainer`; `items`, `surface`, `verticalAlign` and the
 * parts `TEXT` and `MEDIA` in `frames` to a `DSFeature`; and `section` and `grid` to a `DSFeatureGridSectionContainer`. Each value
 * is one the design system has. Each item line of a feature with `items.surface`, and each slot that is the media of a feature
 * whose `frames` frames it, is kept with the frame it stands in; each item line of a numbered feature with its number; the rows
 * a feature's or a grid's lines part, the rows centred with a centred head, and a split's rows with their alignment. A region of
 * a feature that is no unit of its own is the feature's, and another unit inside it is not.
 */
function skelLooks(frame: SkeletonFrame | undefined, findings: string[], items?: SkelSurface, media?: SkelSurface, feature?: SkelFeatureLook, device?: string): void {
  if (!frame || typeof frame !== "object") return;
  const said = (message: string) => { if (!findings.includes(message)) findings.push(message); };
  const unit = typeof frame.unit === "string" ? frame.unit : undefined;
  const which = unit !== undefined ? `\`${unit}\`` : "a frame with no `unit`";
  for (const key of ["color", "strength", "inset"] as const)
    if (frame[key] !== undefined && unit !== SKEL_SECTION) said(`\`${key}\` is a field of a \`DSSectionContainer\`, and this frame is ${which}`);
  for (const key of ["items", "surface", "verticalAlign", "type"] as const)
    if (frame[key] !== undefined && unit !== SKEL_FEATURE) said(`\`${key}\` is a field of a \`DSFeature\`, and this frame is ${which}`);
  for (const key of ["section", "grid"] as const)
    if (frame[key] !== undefined && unit !== SKEL_GRID_SECTION) said(`\`${key}\` is a field of a \`DSFeatureGridSectionContainer\`, and this frame is ${which}`);
  const enumOf = (value: unknown, values: string[], what: string) => {
    if (value !== undefined && !values.includes(value as string)) said(`${what} is \`${String(value)}\`, and it takes ${values.join(" · ")}`);
  };
  if (unit === SKEL_SECTION) {
    enumOf(frame.color, SKEL_SURFACE_COLORS, "a section's `color`");
    enumOf(frame.strength, SKEL_SURFACE_STRENGTHS, "a section's `strength`");
  }
  // WHAT A FRAME DRAWS IS `IDSFrameSurface`: each value one the design system has, and an `elevation` only on a raised frame.
  const surfaceOf = (given: unknown, what: string): SkelSurface | undefined => {
    if (given === null || typeof given !== "object" || Array.isArray(given)) { said(`${what} holds the keys of \`IDSFrameSurface\`, and it is \`${JSON.stringify(given)}\``); return undefined; }
    const surface = given as SkelSurface;
    enumOf(surface.color, SKEL_SURFACE_COLORS, `the \`color\` of ${what}`);
    enumOf(surface.strength, SKEL_SURFACE_STRENGTHS, `the \`strength\` of ${what}`);
    enumOf(surface.elevation, Object.keys(SKEL_CONTROL_H), `the \`elevation\` of ${what}`);
    if (surface.elevation !== undefined && surface.raised !== true)
      said(`${what} gives an \`elevation\` and is not \`raised\`: how far a frame stands off is read only where it is raised`);
    return surface;
  };
  const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
  // A FEATURE OF `type` `BACKDROP` (RULE.DEVEX.WORKSPACE.305): its media, the slot alone in a row of its own, leaves the flow of its rows and is
  // kept to be drawn behind them, with the measure its screen class gives the words. The other types are drawn by where the rows place the media.
  if (unit === SKEL_FEATURE && frame.type !== undefined) {
    const slotOf = (row: SkeletonRow): SkeletonItem | undefined => {
      const real = (row?.items ?? []).filter((it) => !!it && typeof it === "object" && skelKind(it) !== "spacer");
      return real.length === 1 && skelKind(real[0]) === "slot" ? real[0] : undefined;
    };
    const at = Array.isArray(frame.rows) ? frame.rows.findIndex((row) => slotOf(row) !== undefined) : -1;
    if (!SKEL_FEATURE_TYPES.includes(frame.type as string))
      said(`a \`DSFeature\`'s \`type\` is \`${String(frame.type)}\`, and a skeleton reads ${SKEL_FEATURE_TYPES.join(" · ")}; the other types are drawn by where the feature's rows place its media`);
    else if (at < 0) said("a `DSFeature` of `type` `BACKDROP` stands its media behind its words: name the media as a slot alone in a row of the feature");
    else {
      const media = slotOf(frame.rows[at])!;
      frame.rows = frame.rows.filter((_, i) => i !== at);
      const centre = frame.rows.some((row) => (row?.items ?? []).some((it) => !!it && typeof it === "object" && skelKind(it) === "head" && skelHeadOf(it).textAlign === "CENTER"));
      skelBackdrops.set(frame.rows, { media, measure: device === "DESKTOP" || device === "TABLET" ? SKEL_BACKDROP_MEASURE : 1, centre });
    }
  }
  // EACH LINE OF A `DSCodeBlockView` THAT IS A NOTE IS CODE, which scrolls and never wraps (RULE.DEVEX.WORKSPACE.304).
  if (unit === SKEL_CODE && Array.isArray(frame.rows))
    for (const row of frame.rows) for (const it of row?.items ?? []) if (!!it && typeof it === "object" && skelKind(it) === "note") skelCode.add(it);
  const ownRows = Array.isArray(frame.rows) ? frame.rows : [];
  let itemsHere = items, mediaHere = media, featureHere = feature;
  if (unit === SKEL_FEATURE) {
    const given = frame.items;
    itemsHere = given !== null && typeof given === "object" && given.surface !== undefined ? surfaceOf(given.surface, "a feature's `items.surface`") : undefined;
    const parts = frame.frames;
    if (parts !== undefined && (!Array.isArray(parts) || parts.some((part) => !SKEL_FEATURE_PARTS.includes(part))))
      said(`a \`DSFeature\`'s \`frames\` names its parts, ${SKEL_FEATURE_PARTS.join(" · ")}, and this one is \`${JSON.stringify(parts)}\``);
    const own = frame.surface !== undefined ? surfaceOf(frame.surface, "a feature's `surface`") : undefined;
    if (frame.surface !== undefined && !(Array.isArray(parts) && parts.some((part) => SKEL_FEATURE_PARTS.includes(part))))
      said("a `DSFeature`'s `surface` paints only the parts its `frames` names, and this one names none");
    mediaHere = skelFeatureFrames(frame).media ? own ?? {} : undefined;
    // THE ITEMS' FORM, THEIR LINES AND THEIR NUMBERS (RULE.DEVEX.WORKSPACE.289, .290): a `LIST` has its lines where `borderType` is left
    // out, a `GRID` none, and items boxed by `items.surface` none at all.
    const shape = isObject(given) ? given : {};
    if (shape.type !== undefined && !SKEL_ITEMS_TYPES.includes(shape.type as string))
      said(`a feature's \`items.type\` is \`${String(shape.type)}\`, and a skeleton draws ${SKEL_ITEMS_TYPES.join(" · ")}`);
    enumOf(shape.borderType, SKEL_BORDER_TYPES, "a feature's `items.borderType`");
    if (shape.numbered !== undefined && typeof shape.numbered !== "boolean") said(`a feature's \`items.numbered\` is \`${JSON.stringify(shape.numbered)}\`, and it takes true or false`);
    const list = shape.type === "LIST";
    const border = itemsHere ? "NONE" : SKEL_BORDER_TYPES.includes(shape.borderType as string) ? (shape.borderType as string) : list ? "GRID" : "NONE";
    // A FEATURE'S `STATS` (RULE.DEVEX.WORKSPACE.300) stand side by side as a `GRID` does, with no line where `borderType` is left out, and
    // take the sizes one level below the feature's own, which its head's `pageLevel` gives. The design system numbers no statistic.
    const head = ownRows.flatMap((row) => row?.items ?? []).find((it) => !!it && typeof it === "object" && skelKind(it) === "head");
    const level = head !== undefined ? skelHeadLevel(skelHeadOf(head)) : "CONTAINER";
    const stats = shape.type === "STATS" ? { value: SKEL_STAT_VALUE[level], label: SKEL_STAT_LABEL[level], centre: head !== undefined && skelHeadOf(head).textAlign === "CENTER" } : undefined;
    if (stats && shape.numbered === true) said("`items.numbered` numbers the item lines of a `GRID` or a `LIST`, and the design system writes no number before a statistic of `STATS`");
    featureHere = { lines: border !== "NONE" ? { border, across: !list, cells: false } : undefined, numbered: shape.numbered === true && !stats, list, count: { n: 0 }, stats };
    if (frame.divided !== undefined)
      said("`divided` draws the lines of a container's or a card's list, and a `DSFeature`'s lines are its `items.type` `LIST` or its `items.borderType`");
    // THE SPLIT OF A FEATURE WITH `verticalAlign` (RULE.DEVEX.WORKSPACE.292): each of its rows that holds its media beside its words. A
    // view where the split folds, as a phone's, has no such row, and the field is read nowhere there, as the design system reads it.
    enumOf(frame.verticalAlign, SKEL_V_ALIGNS, "a feature's `verticalAlign`");
    if (SKEL_V_ALIGNS.includes(frame.verticalAlign as string)) for (const row of ownRows) {
      const real = (row?.items ?? []).filter((it) => !!it && typeof it === "object" && skelKind(it) !== "spacer");
      if (real.length > 1 && real.some((it) => skelKind(it) === "frame" || skelKind(it) === "slot")) skelAligned.set(row, frame.verticalAlign!);
    }
  } else if (unit !== undefined) { itemsHere = undefined; mediaHere = undefined; featureHere = undefined; }
  if (unit === SKEL_GRID_SECTION) {
    // A GRID SECTION'S `section` IS A SECTION'S FILL AND ROOM, AND ITS `grid.borderType` THE LINES BETWEEN ITS CELLS (RULE.DEVEX.WORKSPACE.293, .289).
    if (frame.section !== undefined && !isObject(frame.section)) said(`a grid section's \`section\` holds a section's \`color\`, \`strength\`, \`inset\` and \`size\`, and it is \`${JSON.stringify(frame.section)}\``);
    const sectionLook = skelGridSectionOf(frame);
    if (sectionLook !== undefined) {
      enumOf(sectionLook.color, SKEL_SURFACE_COLORS, "a grid section's `section.color`");
      enumOf(sectionLook.strength, SKEL_SURFACE_STRENGTHS, "a grid section's `section.strength`");
      enumOf(sectionLook.size, Object.keys(SKEL_CONTROL_H), "a grid section's `section.size`");
    }
    if (frame.grid !== undefined && !isObject(frame.grid)) said(`a grid section's \`grid\` holds its \`borderType\`, and it is \`${JSON.stringify(frame.grid)}\``);
    const border = isObject(frame.grid) ? frame.grid.borderType : undefined;
    enumOf(border, SKEL_BORDER_TYPES, "a grid section's `grid.borderType`");
    if ((border === "GRID" || border === "EDGE") && Array.isArray(frame.rows)) skelLined.set(frame.rows, { border, across: true, cells: true });
    // THE COLUMNS AT EACH SCREEN CLASS, `IDSGrid`'s `desktop`, `tablet` and `mobile` (RULE.DEVEX.WORKSPACE.299): each 1 to 4, and a view reads
    // its own class's: every row of its cells stands in that many columns, a spacer filling a short row. A spec with one frame has no class.
    if (isObject(frame.grid)) {
      const grid = frame.grid as Record<string, unknown>;
      for (const key of SKEL_GRID_CLASSES)
        if (grid[key] !== undefined && !(Number.isInteger(grid[key]) && (grid[key] as number) >= 1 && (grid[key] as number) <= 4))
          said(`a grid section's \`grid.${key}\` is \`${JSON.stringify(grid[key])}\`, and it takes a whole number of columns, 1 to 4`);
      const key = typeof device === "string" ? device.toLowerCase() : undefined;
      const columns = key !== undefined && SKEL_GRID_CLASSES.includes(key) ? grid[key] : undefined;
      if (typeof columns === "number" && Number.isInteger(columns) && columns >= 1 && columns <= 4 && Array.isArray(frame.rows))
        for (const row of frame.rows) if (Array.isArray(row?.items) && skelLinedRow(row, { border: "NONE", across: true, cells: true }) && row.items.length !== columns)
          said(`the \`${device}\` view stands a grid section's cells in \`grid.${key}\`, ${columns} columns, and a row of them holds ${row.items.length}; a short row is filled with spacers`);
    }
  }
  // A `DSAccordionGroup`'S ENTRIES ARE ITS `options` (RULE.DEVEX.WORKSPACE.301): each with the words of its `header`, its `content` in words,
  // and `expanded` true or false; the group's `bordered` true or false. A group that draws its entries draws no `rows`.
  if (frame.options !== undefined) {
    if (unit !== SKEL_ACCORDION) said(`\`options\` is a field of a \`DSAccordionGroup\`, its entries, and this frame is ${which}`);
    else if (!Array.isArray(frame.options)) said(`a \`DSAccordionGroup\`'s \`options\` is the list of its entries, and it is \`${JSON.stringify(frame.options)}\``);
    else {
      if (ownRows.length) said("a `DSAccordionGroup` draws its entries from `options`, and its `rows` are not drawn");
      for (const option of frame.options) {
        if (!isObject(option) || typeof option.header !== "string" || !option.header.trim()) { said("an entry of a `DSAccordionGroup` carries the words of its `header`"); continue; }
        if (option.expanded !== undefined && typeof option.expanded !== "boolean") said(`an entry's \`expanded\` is \`${JSON.stringify(option.expanded)}\`, and it takes true or false`);
        if (option.content !== undefined && typeof option.content !== "string") said(`an entry's \`content\` is the words its open body shows, and it is \`${JSON.stringify(option.content)}\``);
      }
    }
  }
  if (unit === SKEL_ACCORDION && Array.isArray(frame.options) && frame.bordered !== undefined && typeof frame.bordered !== "boolean")
    said(`a \`DSAccordionGroup\`'s \`bordered\` is \`${JSON.stringify(frame.bordered)}\`, and it takes true or false`);
  // A REGION OF A FEATURE THAT IS NO UNIT HOLDS THE FEATURE'S ITEMS TOO, and takes their lines.
  if (featureHere?.lines !== undefined && (unit === SKEL_FEATURE || unit === undefined) && Array.isArray(frame.rows)) skelLined.set(frame.rows, featureHere.lines);
  // A CENTRED HEAD CENTRES THE ROWS THAT STAND WITH IT (RULE.DEVEX.WORKSPACE.291): in a feature, in a region of one, and in a grid section's heading.
  if (unit === SKEL_FEATURE || unit === SKEL_GRID_SECTION || (unit === undefined && featureHere !== undefined)) {
    const centred = ownRows.some((row) => (row?.items ?? []).some((it) => !!it && typeof it === "object" && skelKind(it) === "head" && skelHeadOf(it).textAlign === "CENTER"));
    if (centred) for (const row of ownRows) if (skelCentrable(row, featureHere?.list === true)) skelCentred.add(row);
  }
  const rows = [...(frame.sections ?? []).flatMap((section) => section?.rows ?? []), ...(frame.rows ?? []), ...(frame.footer ?? [])];
  for (const row of rows) for (const it of row?.items ?? []) {
    if (!it || typeof it !== "object") continue;
    const kind = skelKind(it);
    if (kind === "item" && itemsHere) skelItemFrames.set(it, itemsHere);
    if (kind === "slot" && mediaHere) skelItemFrames.set(it, mediaHere);
    // EACH ITEM LINE OF A NUMBERED FEATURE TAKES THE NEXT NUMBER, in the order its rows are read (RULE.DEVEX.WORKSPACE.290).
    if (kind === "item" && featureHere?.numbered) skelNumbers.set(it, ++featureHere.count.n);
    if (kind === "item" && featureHere?.stats) skelStats.set(it, featureHere.stats);
    if (kind === "frame") skelLooks(it.frame, findings, itemsHere, mediaHere, featureHere, device);
  }
}

/** THE FIELDS A SKELETON HAS, by what holds them (RULE.DEVEX.WORKSPACE.287). A field none of them has draws nothing, so it is a
 *  finding that names it. The fields the drawer writes on its own copy are listed too, since a spec that writes one asks for
 *  what the drawer does anyway; `tone`, `em`, `off` and `warn` on an item or a frame keep the findings that name what replaced them. */
const SKEL_FIELDS: Record<string, string[]> = {
  spec: ["kind", "title", "caption", "frame", "views", "layout"],
  view: ["viewport", "state", "page", "frame"],
  page: ["item", "actions", "back"],
  frame: ["label", "note", "width", "rows", "look", "tag", "height", "fill", "unit", "headed", "frames", "raised", "bordered", "rounded", "size",
    "part", "actions", "footer", "sections", "divided", "marked", "media", "color", "strength", "inset", "items", "surface", "verticalAlign", "section", "grid",
    "options", "type"],
  section: ["label", "actions", "rows", "divided", "unit", "part", "sections"],
  row: ["label", "framed", "chosen", "marked", "items", "within", "lead"],
  item: ["text", "note", "fill", "frame", "tag", "slot", "control", "main", "on", "flush", "edgeTop", "inPart", "atPage", "mark", "tabs", "chosen",
    "icon", "standin", "lines", "headings", "columns", "cells", "label", "info", "description", "error", "read", "item", "head", "spacer", "height", "part", "page",
    "type"],
  line: ["media", "title", "description", "meta", "end", "inline", "factsPlacement", "selected"],
  head: ["pageLevel", "eyebrow", "title", "description", "facts", "textAlign", "media"],
  media: ["mtype", "node", "icon", "title"],
  items: ["surface", "type", "borderType", "numbered"],
  surface: ["color", "strength", "raised", "elevation", "bordered", "rounded"],
  gridSection: ["color", "strength", "inset", "size"],
  grid: ["borderType", "desktop", "tablet", "mobile"],
  option: ["header", "content", "expanded"],
};
const SKEL_OLD_FIELDS = ["tone", "em", "off", "warn"];
function skelFieldFindings(spec: Spec, findings: string[]): void {
  const said = (message: string) => { if (!findings.includes(message)) findings.push(message); };
  const known = (value: unknown, holder: string, where: string, old = false): value is Record<string, unknown> => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    for (const key of Object.keys(value)) if (!SKEL_FIELDS[holder].includes(key) && !(old && SKEL_OLD_FIELDS.includes(key)))
      said(`\`${key}\` is no field of ${where}, and a skeleton draws nothing for it`);
    return true;
  };
  const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
  const line = (value: unknown) => {
    if (!known(value, "line", "an item line")) return;
    known(value.media, "media", "an item line's `media`");
    for (const fact of list(value.meta)) if (typeof fact !== "string") item(fact);
    for (const part of list(value.end)) item(part);
  };
  const item = (value: unknown): void => {
    if (!known(value, "item", "an item", true)) return;
    if (value.type !== undefined && value.control !== "tabs") said("`type` is the look of a row of tabs, in `DSTabsType`'s words, and this item is no row of tabs");
    frame(value.frame);
    line(value.item);
    if (known(value.head, "head", "a head")) {
      known(value.head.media, "media", "a head's `media`");
      if (typeof value.head.eyebrow !== "string") item(value.head.eyebrow);
      for (const fact of list(value.head.facts)) if (typeof fact !== "string") item(fact);
    }
    for (const cells of list(value.cells)) for (const cell of list(cells)) if (typeof cell !== "string") item(cell);
  };
  const row = (value: unknown) => { if (known(value, "row", "a row")) for (const it of list(value.items)) item(it); };
  const section = (value: unknown): void => {
    if (!known(value, "section", "a section")) return;
    for (const action of list(value.actions)) item(action);
    for (const r of list(value.rows)) row(r);
    for (const group of list(value.sections)) section(group);
  };
  const frame = (value: unknown): void => {
    if (!known(value, "frame", "a frame", true)) return;
    known(value.surface, "surface", "a `surface`");
    if (known(value.items, "items", "a feature's `items`")) known(value.items.surface, "surface", "a `surface`");
    known(value.section, "gridSection", "a grid section's `section`");
    known(value.grid, "grid", "a grid section's `grid`");
    for (const option of list(value.options)) known(option, "option", "an entry of a `DSAccordionGroup`'s `options`");
    for (const action of list(value.actions)) item(action);
    for (const part of list(value.sections)) section(part);
    for (const r of [...list(value.rows), ...list(value.footer)]) row(r);
  };
  known(spec, "spec", "a skeleton spec");
  frame(spec.frame);
  for (const view of list(spec.views)) {
    if (!known(view, "view", "a view")) continue;
    frame(view.frame);
    if (known(view.page, "page", "a view's `page`")) { line(view.page.item); for (const action of list(view.page.actions)) item(action); }
  }
}

/**
 * THE LAYOUT IS READ IN THE DESIGN SYSTEM'S OWN WORDS. Its type is one of `DSLayoutType`, its body's width one of
 * `DSLayoutWidthType`, and each part takes the fields of its look and no other; a field the looks do not have is a
 * finding that names the ones they have. Returns whether the layout can be drawn.
 */
function skelLayoutFindings(layout: unknown, findings: string[]): layout is SkeletonLayout {
  if (layout === null || typeof layout !== "object" || Array.isArray(layout)) {
    findings.push(`a skeleton's \`layout\` holds \`type\`, \`body\`, \`navigation\` and \`content\`, and this one is \`${JSON.stringify(layout)}\``);
    return false;
  }
  const given = layout as Record<string, unknown>;
  for (const key of Object.keys(given)) if (key !== "type" && !(key in SKEL_LAYOUT_PARTS))
    findings.push(`\`layout.${key}\` is no field of a layout: a layout takes \`type\`, ${Object.keys(SKEL_LAYOUT_PARTS).map((p) => `\`${p}\``).join(", ")}`);
  for (const [part, fields] of Object.entries(SKEL_LAYOUT_PARTS)) {
    const look = given[part];
    if (look === undefined) continue;
    if (look === null || typeof look !== "object" || Array.isArray(look)) { findings.push(`\`layout.${part}\` holds the fields of its look, ${fields.map((f) => `\`${f}\``).join(" · ")}`); continue; }
    for (const key of Object.keys(look)) if (!fields.includes(key))
      findings.push(`\`layout.${part}.${key}\` is no field of the ${part}'s look, which has ${fields.map((f) => `\`${f}\``).join(" · ")}`);
  }
  // THE CHOSEN ENTRY IS NAMED BY ITS WORD, one of `nav`: the entry that leads to the page the sketch shows.
  const navigation = given.navigation as { nav?: unknown; chosen?: unknown; open?: unknown } | undefined;
  if (navigation?.open !== undefined && (typeof navigation.open !== "boolean" || given.type !== "RAIL"))
    findings.push(`\`layout.navigation.open\` is \`${String(navigation.open)}\`: only a \`RAIL\` takes \`open\`, as \`true\`, for a figure about the rail itself; a skeleton draws every rail shut to its icons`);
  const words = Array.isArray(navigation?.nav) ? navigation!.nav!.map(String) : [];
  if (navigation?.chosen !== undefined && typeof navigation.chosen !== "string")
    findings.push(`\`layout.navigation.chosen\` is \`${String(navigation.chosen)}\`; name the open entry by its word, one of \`nav\`, as \`"chosen": "${words[Number(navigation.chosen)] ?? words[0] ?? "Orders"}"\``);
  else if (typeof navigation?.chosen === "string" && !words.includes(navigation.chosen))
    findings.push(`\`layout.navigation.chosen\` is \`${navigation.chosen}\`, and \`nav\` holds ${words.length ? words.map((word) => `\`${word}\``).join(" · ") : "no word"}`);
  else if (words.length && navigation?.chosen === undefined)
    findings.push("`layout.navigation.nav` names its entries and no `chosen`: a page always stands under one entry of its navigation, so name it");
  const width = (given.body as { width?: unknown } | undefined)?.width;
  if (width !== undefined && !SKEL_BODY_WIDTHS.includes(width as string))
    findings.push(`\`layout.body.width\` is \`${String(width)}\`, and a body is ${SKEL_BODY_WIDTHS.join(" · ")}`);
  if (!SKEL_LAYOUT_TYPES.includes(given.type as string)) {
    findings.push(`\`layout.type\` is \`${String(given.type)}\`, and a layout is ${SKEL_LAYOUT_TYPES.join(" · ")}`);
    return false;
  }
  return true;
}

/** The entries of a navigation, down a column: the words of `nav` with the chosen one, the page's own entry, in a band,
 *  or bars where it names none; shut, each entry is a square and the chosen one is in a band. */
function skelNavColumn(nav: SkeletonLayout["navigation"], nx: number, ny: number, nw: number, open: boolean, out: string[]): void {
  const words = Array.isArray(nav?.nav) ? nav!.nav!.map(String) : [];
  const count = words.length || 4;
  for (let i = 0; i < count; i++) {
    const top = ny + i * SKEL_NAV_STEP;
    const isChosen = words.length > 0 && words[i] === nav?.chosen;
    if (isChosen) out.push(skelRect("sds-skel-surface", nx + 6, top, nw - 12, 24, 4));
    if (!open) out.push(skelRect("sds-skel-bar", nx + nw / 2 - 6, top + 6, 12, 12, 3));
    else if (!words.length) out.push(skelRect("sds-skel-bar", nx + 14, top + 9, 60, SKEL_BAR, 3));
    else out.push(`  <text class="${isChosen ? "sds-title" : "sds-label"}" x="${r2(nx + 14)}" y="${r2(top + 16)}">${esc(words[i])}</text>`);
  }
}
/** The height a column of entries asks for: its head, its entries, and its foot. */
const skelNavNeed = (nav: SkeletonLayout["navigation"]) =>
  SKEL_LAYOUT_BAR + (Array.isArray(nav?.nav) && nav!.nav!.length ? nav!.nav!.length : 4) * SKEL_NAV_STEP + SKEL_LAYOUT_BAR;
/** The app's tile and its name at the head of a navigation; a sketch names no app, so the name is a bar. */
const skelAppHead = (ax: number, cy: number, named: boolean): string[] => [
  skelRect("sds-skel-bar", ax, cy - 7, 14, 14, 3), ...(named ? [skelRect("sds-skel-bar", ax + 20, cy - SKEL_BAR / 2, 60, SKEL_BAR, 3)] : []),
];

/**
 * ONE VIEW IN ITS LAYOUT, WITH ITS PAGE LEVEL (05-artifacts.md § `SKELETON`, RULE.DEVEX.WORKSPACE.260). The window is the
 * view at its class's width. The window is the body: below `FULL`, at a desktop, the body's box is its share of a
 * window 1920 wide, centred; at a tablet and on a phone it is the screen. The navigation is a surface at its edge: a
 * rail the window's height, open at a desktop and shut at a tablet; a top bar across the window, its items in the box;
 * a dock's column inside the content, at its left. The content is a solid line round its box: attached, the box from
 * the navigation, or the window's top, to the bottom, square, and beside a rail centred in the area beside it; a part
 * not attached is rounded and stands 16 in. On a phone every part attaches and one bar stands at the top. `CANVAS`
 * draws the body alone. The page level stands first in the content, with no boundary, and the frame under it.
 * Returns the window's height.
 */
function skelDrawWindow(view: SkeletonView, layout: SkeletonLayout | undefined, x: number, y: number, findings: string[], out: string[]): number {
  const W = SKEL_VIEW_W[view.viewport], phone = view.viewport === "MOBILE", desk = view.viewport === "DESKTOP";
  const type = layout?.type;
  const navAt = phone || layout?.navigation?.attached !== false;
  const contentAt = phone || layout?.content?.attached !== false;
  const inset = (attached: boolean) => (attached ? 0 : SKEL_APART);
  const width = layout?.body?.width ?? "FULL";
  const boxW = desk && SKEL_BODY_W[width] !== undefined ? SKEL_BODY_W[width] : W;
  const bar = type !== undefined && type !== "CANVAS" && (phone || type === "TOPNAV") ? SKEL_LAYOUT_BAR : 0;
  const nav = layout?.navigation;
  // A SKELETON DRAWS A RAIL SHUT TO ITS ICONS ON EVERY DEVICE, so the content gets the room: there are many skeletons, and a
  // desktop's open rail is only the subject of a figure about the rail itself, which asks for it with `navigation.open`.
  const navOpen = desk && (type === "DOCK" || (type === "RAIL" && nav?.open === true));
  const side = type !== undefined && !phone && (type === "RAIL" || type === "DOCK") ? (navOpen ? SKEL_RAIL_OPEN : SKEL_RAIL_SHUT) : 0;

  // THE CONTENT'S BOX: beside a rail, centred in the area beside it; otherwise centred in the window.
  const areaX = type === "RAIL" && !phone ? x + inset(navAt) + side : x;
  const areaW = x + W - areaX;
  const contentW = Math.min(boxW, areaW - inset(contentAt) * 2);
  const contentX = areaX + (areaW - contentW) / 2;
  const contentTop = y + (bar ? inset(navAt) + bar : 0) + (type !== undefined ? inset(contentAt) : 0);
  const dock = type === "DOCK" && !phone ? side + inset(navAt) * 2 : 0;
  const innerX = contentX + dock, innerW = contentW - dock;

  // THE PAGE LEVEL: the way back, the item of the page at the page's step, and its actions at the end, as one row.
  const frame: SkeletonFrame = { ...view.frame, headed: view.page !== undefined || view.frame.headed };
  const ctl = skelSizeH(frame, SKEL_DEFAULT_H);
  let pageFrame: SkeletonFrame | undefined;
  if (view.page !== undefined) {
    const page = view.page;
    if (page === null || typeof page !== "object" || !page.item) findings.push(`the \`${skelViewName(view)}\` view's \`page\` carries its \`item\`: the title of the page, with its description, picture and facts`);
    else pageFrame = { size: frame.size, rows: [{ items: [
      ...(page.back ? [{ icon: "previous" as const }] : []),
      { item: page.item, fill: true, page: true },
      ...(Array.isArray(page.actions) ? page.actions : []),
    ] }] };
  }
  const pageH = pageFrame ? skelRowHeight(pageFrame.rows[0], ctl) + SKEL_GAP : 0;
  const frameH = skelFrameHeight(frame, SKEL_DEFAULT_H);
  const contentNeed = pageH + frameH;
  const navNeed = side && type === "RAIL" ? skelNavNeed(nav) + inset(navAt) * 2 : 0;
  const H = Math.max(contentTop - y + contentNeed + (type !== undefined ? inset(contentAt) : 0), navNeed, dock ? skelNavNeed(nav) + contentTop - y : 0);
  const contentH = y + H - inset(contentAt) - contentTop;

  // A VIEW THAT NEEDS MORE ROOM THAN ITS CONTENT HAS IS A FINDING, as one that needs more than its class.
  const needs = Math.max(skelFrameMinWidth(frame, SKEL_DEFAULT_H), pageFrame ? skelFrameMinWidth(pageFrame, SKEL_DEFAULT_H) : 0);
  if (needs > innerW)
    findings.push(type === undefined
      ? `the \`${skelViewName(view)}\` view needs ${needs} across, and its class stands at ${W}; an arrangement that does not fit its screen is stacked, or drawn with fewer parts in a row`
      : `the \`${skelViewName(view)}\` view needs ${needs} across, and its content in a \`${type}\` with a \`${width}\` body stands at ${r2(innerW)}; an arrangement that does not fit is stacked, or drawn in a wider body`);

  out.push(skelRect("sds-box", x, y, W, H));
  // THE NAVIGATION, a surface at its edge.
  if (type !== undefined && type !== "CANVAS") {
    if (phone) {
      out.push(skelRect("sds-skel-surface", x, y, W, bar, 0));
      out.push(...skelIcon("menu", x + 8 + SKEL_DEFAULT_H / 2, y + bar / 2, SKEL_DEFAULT_H, false));
      out.push(...skelAppHead(x + 16 + SKEL_DEFAULT_H, y + bar / 2, true));
      out.push(...skelIcon("person", x + W - 16 - 12, y + bar / 2, 24, true, undefined, 24));
    } else if (type === "TOPNAV") {
      const barX = x + inset(navAt), barW = W - inset(navAt) * 2, barY = y + inset(navAt);
      out.push(skelRect("sds-skel-surface", barX, barY, barW, bar, navAt ? 0 : SKEL_ROUND));
      const boxX = Math.max(x + (W - boxW) / 2, barX);
      out.push(...skelAppHead(boxX + 16, barY + bar / 2, true));
      const words = Array.isArray(nav?.nav) ? nav!.nav!.map(String) : [];
      let wx = boxX + 16 + 80 + SKEL_GAP;
      words.forEach((word, i) => {
        if (word === nav?.chosen) out.push(skelRect("sds-skel-surface", wx - 8, barY + 12, skelWordW(word) + 16, 24, 4));
        out.push(`  <text class="${word === nav?.chosen ? "sds-title" : "sds-label"}" x="${r2(wx)}" y="${r2(barY + bar / 2 + 4)}">${esc(word)}</text>`);
        wx += skelWordW(word) + SKEL_GAP;
      });
      out.push(...skelIcon("person", Math.min(boxX + boxW, barX + barW) - 16 - 12, barY + bar / 2, 24, true, undefined, 24));
    } else {
      // A RAIL RUNS THE WINDOW'S HEIGHT; A DOCK'S COLUMN STANDS INSIDE THE CONTENT, AT ITS LEFT.
      const nx = type === "RAIL" ? x + inset(navAt) : contentX + inset(navAt), ny = (type === "RAIL" ? y : contentTop) + inset(navAt);
      const nh = (type === "RAIL" ? H : contentH) - inset(navAt) * 2;
      out.push(skelRect("sds-skel-surface", nx, ny, side, nh, navAt ? 0 : SKEL_ROUND));
      out.push(...skelAppHead(navOpen ? nx + 14 : nx + side / 2 - 7, ny + SKEL_LAYOUT_BAR / 2, navOpen));
      skelNavColumn(nav, nx, ny + SKEL_LAYOUT_BAR, side, navOpen, out);
      out.push(...skelIcon("person", navOpen ? nx + 14 + 12 : nx + side / 2, ny + nh - SKEL_LAYOUT_BAR / 2, 24, true, undefined, 24));
    }
  }
  // THE CONTENT, a solid line round its box: square where it is attached, rounded where it stands in.
  if (type !== undefined) out.push(skelRect("sds-skel-border", contentX, contentTop, contentW, contentH, contentAt ? 0 : SKEL_ROUND));
  if (pageFrame) skelDrawFrame(pageFrame, innerX, contentTop, undefined, findings, out, undefined, 0, SKEL_DEFAULT_H, true, innerW);
  skelDrawFrame(frame, innerX, contentTop + pageH, undefined, findings, out, undefined, 0, SKEL_DEFAULT_H, true, innerW);
  return H;
}

/**
 * A SPEC WITH `views` DRAWS ONE SCREEN AT SEVERAL SCREEN CLASSES, AND IN SEVERAL TASK STATES, IN ONE FIGURE
 * (05-artifacts.md § `SKELETON`, RULE.DEVEX.WORKSPACE.230). Each view is a whole frame of its own. They are drawn in one
 * order, desktop, then tablet, then phone, and the views of one class stand together: the one with no `state` first,
 * the others in `DSTaskStateType`'s order. Each stands under the name of its class and the word of its state, at the
 * width that stands for its class. A view that would pass the grid's content width starts a new line, so a figure
 * never grows wider than its page and its words stay as large as any other figure's. A view stands in the spec's
 * `layout` where it has one, and its `page` stands first in its content.
 */
function skelDrawViews(views: SkeletonView[], layout: SkeletonLayout | undefined, findings: string[], out: string[]): void {
  const classes = Object.keys(SKEL_VIEW_W);
  const seen = new Set<string>();
  const drawn: SkeletonView[] = [];
  for (const view of views) {
    const viewport = view?.viewport;
    if (!classes.includes(viewport)) { findings.push(`a view's \`viewport\` is \`${viewport}\`, and a skeleton takes ${classes.join(" · ")}`); continue; }
    if (view.state !== undefined && !SKEL_TASK_STATES.includes(view.state)) {
      findings.push(`a view's \`state\` is \`${String(view.state)}\`, and a view shows one of \`DSTaskStateType\`: ${SKEL_TASK_STATES.join(" · ")}`);
      continue;
    }
    const name = skelViewName(view);
    if (seen.has(name)) {
      findings.push(view.state
        ? `two views are \`${name}\`, and a skeleton holds one view for a screen class in a task state`
        : `two views are \`${viewport}\`, and a skeleton holds one view for a screen class`);
      continue;
    }
    seen.add(name);
    if (!view.frame) { findings.push(`the \`${name}\` view has no \`frame\`; each view is a whole frame of its own`); continue; }
    drawn.push(view);
  }
  const stateAt = (view: SkeletonView) => (view.state === undefined ? -1 : SKEL_TASK_STATES.indexOf(view.state));
  drawn.sort((one, other) => classes.indexOf(one.viewport) - classes.indexOf(other.viewport) || stateAt(one) - stateAt(other));
  const left = 24;
  let x = left, y = 24, lineH = 0;
  for (const view of drawn) {
    const stands = SKEL_VIEW_W[view.viewport];
    // IN A LAYOUT, OR UNDER A PAGE LEVEL, THE WINDOW STANDS AT ITS CLASS'S WIDTH and what it holds is measured against its content.
    if (layout !== undefined || view.page !== undefined) {
      if (x > left && x + stands > left + SKEL_CANVAS) { x = left; y += lineH + SKEL_GAP; lineH = 0; }
      out.push(`  <text class="sds-note" x="${x}" y="${y + SKEL_LABEL_H}">${esc(skelViewName(view))}</text>`);
      lineH = Math.max(lineH, SKEL_TAG_H + skelDrawWindow(view, layout, x, y + SKEL_TAG_H, findings, out));
      x += stands + SKEL_GAP;
      continue;
    }
    const needs = skelFrameMinWidth(view.frame, SKEL_DEFAULT_H);
    if (needs > stands)
      findings.push(`the \`${skelViewName(view)}\` view needs ${needs} across, and its class stands at ${stands}; an arrangement that does not fit its screen is stacked, or drawn with fewer parts in a row`);
    const w = Math.max(stands, needs);
    if (x > left && x + w > left + SKEL_CANVAS) { x = left; y += lineH + SKEL_GAP; lineH = 0; }
    out.push(`  <text class="sds-note" x="${x}" y="${y + SKEL_LABEL_H}">${esc(skelViewName(view))}</text>`);
    skelDrawFrame(view.frame, x, y + SKEL_TAG_H, undefined, findings, out, undefined, 0, SKEL_DEFAULT_H, false, stands);
    lineH = Math.max(lineH, SKEL_TAG_H + skelFrameHeight(view.frame, SKEL_DEFAULT_H));
    x += w + SKEL_GAP;
  }
}

/**
 * THE CHOSEN ENTRY IS THE PAGE'S OWN (RULE.DEVEX.WORKSPACE.268). A page that is itself an entry of the navigation stands
 * under that entry, so a view whose page level's title is a word of `nav` and is not the chosen one is a finding: the
 * band would say the person is somewhere the page says they are not. A page below an entry, such as a record or a step,
 * keeps the entry it was reached from, which the spec names as `chosen`.
 */
function skelChosenFindings(views: SkeletonView[], layout: SkeletonLayout | undefined, findings: string[]): void {
  const words = Array.isArray(layout?.navigation?.nav) ? layout!.navigation!.nav!.map(String) : [];
  const chosen = layout?.navigation?.chosen;
  if (!words.length || typeof chosen !== "string") return;
  for (const view of views) {
    const title = view?.page?.item?.title;
    if (typeof title === "string" && words.includes(title) && title !== chosen)
      findings.push(`the \`${skelViewName(view)}\` view's page is \`${title}\`, an entry of the navigation, and the chosen entry is \`${chosen}\`; the chosen entry is the page's own`);
  }
}

/** A `skeleton` with neither `frame` nor `views` draws nothing: it is one outer frame, or one for each
 *  screen class, and there is no other claim this kind can make. The spec is read from a copy, since the
 *  drawer writes its own marks on what it reads. */
function drawSkeleton(given: Spec): { svg: string; findings: string[] } {
  const findings: string[] = [];
  const out: string[] = [];
  const spec: Spec = structuredClone(given);
  skelFieldFindings(spec, findings);
  skelWhichUnit(spec.frame, findings);
  if (Array.isArray(spec.views)) for (const view of spec.views) skelWhichUnit(view?.frame, findings, true);
  skelUnits(spec.frame, findings);
  if (Array.isArray(spec.views)) for (const view of spec.views) skelUnits(view?.frame, findings);
  skelLooks(spec.frame, findings);
  if (Array.isArray(spec.views)) for (const view of spec.views) skelLooks(view?.frame, findings, undefined, undefined, undefined, view?.viewport);
  let layout: SkeletonLayout | undefined;
  if (spec.layout !== undefined) {
    if (spec.views === undefined) findings.push("`layout` is the layout the views stand in, so a spec with a `layout` holds `views`; give the frame a `viewport`");
    else if (skelLayoutFindings(spec.layout, findings)) layout = spec.layout;
  }
  const views = spec.views !== undefined;
  if (views) {
    if (spec.frame) findings.push("a skeleton holds `frame` or `views`, never both; a view carries its own `frame`");
    if (!Array.isArray(spec.views) || !spec.views.length) return { svg: "", findings: [...findings, "a `skeleton` figure whose `views` holds no view; give each view a `viewport` and a `frame`"] };
    skelChosenFindings(spec.views, layout, findings);
  } else if (!spec.frame) return { svg: "", findings: [...findings, "a `skeleton` figure with no `frame` and no `views`; a skeleton is one outer frame, or one for each screen class"] };
  const paint = (said: string[], into: string[]) => views ? skelDrawViews(spec.views!, layout, said, into) : skelDrawFrame(spec.frame!, 24, 24, undefined, said, into);
  // A HEAD WRAPS TO THE WIDTH ITS ROW GIVES IT, and so do an item line's words and a note (RULE.DEVEX.WORKSPACE.303), so a spec that holds
  // one is first drawn to learn each width, and that drawing and what it found are put aside. A spec with none is drawn once.
  if (skelHasHead(spec) || skelHasOptions(spec) || skelHasWords(spec)) paint([...findings], []);
  paint(findings, out);
  if (views && !out.length) return { svg: "", findings };
  return { svg: svgOf(out, spec.title ?? spec.caption ?? "skeleton", "sds-skeleton"), findings };
}

const DRAWERS: Record<string, (s: Spec) => { svg: string; findings: string[] }> = {
  entities: drawEntities,
  chain: drawChain,
  flowchart: drawFlowchart,
  sequence: drawSequence,
  system: drawSystem,
  map: drawMap,
  skeleton: drawSkeleton,
};

/**
 * `flow` IS RETIRED, and the refusal is where the distinction gets taught (Q136 A, 2026-09-22).
 * It was registered as an alias of the map drawer before `FLOWCHART` existed, so a figure asking for
 * a flow was laid out as boxes and arrows with no shapes at all — and the book's figure table never
 * named a `FLOW`. A drawer that accepts a kind the book does not have is the same defect as a
 * capability folder with no construct twin, which is the check this very step adds.
 *
 * A retired kind is worth more than an unknown one, because the two it might have meant are exactly
 * the pair the chapter asks a reader to read twice: a map answers *what is this made of*, a
 * flowchart answers *what happens, and where does it turn*.
 */
const RETIRED: Record<string, string> = {
  flow: "`flow` is retired. Use `map` when the figure is the PARTS of one thing and how they touch, or `flowchart` when it is a PATH somebody takes and where it turns — a flowchart has the standard shapes because a decision is not a step, and a map has none because its boxes are all the same kind of thing (05-artifacts.md, The figures)",
};

export const KINDS = Object.keys(DRAWERS);

export function draw(spec: Spec): { svg: string; findings: string[] } {
  const kind = (spec.kind ?? "").toLowerCase();
  if (RETIRED[kind]) return { svg: "", findings: [RETIRED[kind]] };
  const drawer = DRAWERS[kind];
  if (!drawer)
    return { svg: "", findings: [`no helper draws a \`${spec.kind}\` figure. The helpers are ${KINDS.join(" · ")}; author this one as SVG in an HTML block in the seat file and it is used verbatim (05-artifacts.md, The figures)`] };
  return drawer(spec);
}
