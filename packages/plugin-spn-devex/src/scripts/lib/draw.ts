// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The figures · § A connector is a claim
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// The `.dg` drawer. A figure's single source is its spec — a fenced ```dg block in the seat file —
// and this turns one into inline SVG. Nothing is drawn by eye: every box is measured from its own
// text, so a connector lands on an edge and a label fits by construction rather than by luck.
//
// The look is the docs design language's (spn-foundation docs/02-constructs/01-devex/04-workspace/06-design-language.md):
// a figure is a `dl-figure` of one `dl-svg` on the docs column's 928 frame, drawn 1:1, its units a tile of radius 10, a plate of
// radius 12 and a wire of weight 1 with soft corners and no arrowhead. No colour and no size is written here: every mark is a class
// of sds-docs.css, which reads the `--sds-*` tokens. Every length is the drawing scale's, step M (grid 4): a name 12, a detail 10,
// a label 9.5, a gap of 12 between tiles, 24 between plates, 56 where a wire joins, 16 from the frame, a label 8 clear of its wire.
// The layout of each kind is unchanged by the language; only its units are.

import { checkFigures } from "./figures.ts";

/**
 * THE FLOWCHART SHAPES, and each one carries its meaning (05-artifacts.md § The figures). A shape is
 * not decoration: a reader knows a decision from a step before reading either label, which is the
 * whole reason `FLOWCHART` is its own kind rather than a `MAP` with a diamond bolted on.
 */
export type Shape =
  | "process"
  | "terminator"
  | "decision"
  | "io"
  | "predefined"
  | "store"
  | "connector"
  | "window"
  | "chevron"
  | "pipe"
  | "bucket";

/**
 * A RESOURCE OUTSIDE A SYSTEM'S BOUNDARY CARRIES THE SHAPE OF WHAT IT IS (05-artifacts.md § SYSTEM,
 * rule 4). Seven kinds, and each earns its place by being a different KIND of thing rather than a
 * different colour of the same thing — you read what a box is before you read its name.
 */
export type Resource =
  "client" | "way-in" | "queue" | "store" | "cache" | "bucket" | "service";
const RESOURCE: Record<Resource, { shape: Shape; soft?: boolean }> = {
  client: { shape: "window" },
  "way-in": { shape: "chevron" },
  queue: { shape: "pipe" },
  store: { shape: "store" },
  cache: { shape: "store", soft: true }, // a cylinder you can afford to lose
  bucket: { shape: "bucket" },
  service: { shape: "process" },
};
export type Box = {
  id: string;
  label: string;
  note?: string;
  em?: boolean;
  off?: boolean;
  warn?: boolean;
  in?: string;
  shape?: Shape;
  icon?: string;
  tone?: string;
};
export type Link = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  card?: string;
};
/** One band of a SYSTEM's boundary: a named layer, and the boxes inside it. */
export type Layer = { name: string; boxes: Box[] };
export type Spec = {
  kind: string;
  boxes?: Box[];
  links?: Link[];
  caption?: string;
  title?: string;
  layers?: Layer[];
  outside?: (Box & { as?: Resource })[];
  frame?: SkeletonFrame;
  views?: SkeletonView[];
  /** A skeleton's layout: the views stand in it. Left out, a view is the inside of a page alone. */
  layout?: SkeletonLayout;
  /** `draw-once` draws each wire along its path once; `pulse` sends a light along one wire at a time; `focus-steps` moves the focus from one unit
   to the next when the reader presses Next or Back. None by default. */
  motion?: "draw-once" | "pulse" | "focus-steps";
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
  body?: {
    width?: "FULL" | "XWIDE" | "WIDE" | "MEDIUM" | "NARROW";
    maxWidth?: unknown;
    className?: unknown;
  };
  /** `IDSLayoutNavigationLook.attached`, true where it is left out; the words of its entries as `nav`, and the open one
   *  as `chosen`, by its word: the entry that leads to the page the sketch shows. */
  navigation?: {
    attached?: boolean;
    sticky?: unknown;
    className?: unknown;
    nav?: string[];
    chosen?: string;
    /** On a `RAIL` only: a figure about the rail itself draws it open at a desktop. Left out, the rail stands shut to its icons on every device. */
    open?: boolean;
  };
  /** `IDSLayoutContentLook.attached`, true where it is left out. */
  content?: {
    attached?: boolean;
    bordered?: unknown;
    raised?: unknown;
    className?: unknown;
  };
};

/** THE PAGE LEVEL: the head of the page. Its item holds the title, the description, a picture and facts; its
 *  actions stand at the end; `back` is the way back at the start of the title's line. */
export type SkeletonPage = {
  item: NonNullable<SkeletonItem["item"]>;
  actions?: SkeletonItem[];
  back?: boolean;
};

/** A picture in the shape of the design system's `IDSItemMedia`: its kind as `mtype`, and the field that kind draws from. An
 *  item line takes `ICON`, a bare icon named in `node`, and `MARK`, a mark holding `icon`; a feature's head takes `MARK` and
 *  `AVATAR`, whose `title` gives its initials. Each shape is one the drawer draws itself. */
export type SkeletonMedia = {
  mtype: "ICON" | "MARK" | "AVATAR";
  node?: string;
  icon?: string;
  title?: string;
};

/**
 * SKELETON — where the parts of a screen or a block sit, and nothing about how they look
 * (05-artifacts.md § `SKELETON`). An item is plain words, a control, an icon, a slot, a stand-in, a
 * note in muted text, or a frame of its own: a region, such as a navigation beside a main area.
 * A spec holds one `frame`, or `views`: one screen at several screen classes.
 */
export type SkeletonItem = {
  /** Plain words — a title. With `control` it is the control's sample value; with `icon`, the word beside it. */
  text?: string;
  note?: string;
  fill?: boolean;
  frame?: SkeletonFrame;
  /** A named place that holds content: a dotted boundary and its name. */
  tag?: string;
  /** A slot that accepts any node: one block whose only content is its name. */
  slot?: string;
  /** A control at the size of its component, on one line. `main` tells the main action by weight, never by colour. */
  control?:
    | "button"
    | "field"
    | "select"
    | "checkbox"
    | "switch"
    | "tabs"
    | "badge"
    | "pager";
  main?: boolean;
  /** A switch's sample value: its knob stands at the end of the track when it is on, and at the start when it is off.
   *  On an icon it makes the icon a mark, and `on: false` draws the default mark empty: a thing that is there
   *  to be set up, and is not yet. */
  on?: boolean;
  /** On a table stand-in: its lines reach the outline of the container it is the content of. */
  flush?: boolean;
  /** Set by the drawer and never written in a spec: where the edge above a flush table is, and whether the table stands
   *  in a part that is a unit, whose boundary its lines reach. */
  edgeTop?: number;
  inPart?: boolean;
  /** Set by the drawer and never written in a spec: this row of tabs stands at the page level, in the root frame's rows
   *  or in the page head's actions, and is drawn as pills. Tabs inside a container, a card or a widget keep the line. */
  atPage?: boolean;
  /** An icon that is a mark and not an action: it stands for a thing or a person, and is drawn in a circle.
   *  `mark: false` with `on` keeps the icon an action, a tile, and `on: true` puts a small check at its corner. */
  mark?: boolean;
  /** The words of a row of tabs, and the place of the chosen one, counted from 0. */
  tabs?: string[];
  chosen?: number;
  /** On a row of tabs, `DSTabsType`: `PILL` draws the pills and `LINE` the line wherever the row stands. Left out, the level picks:
   *  pills at the page level, the line inside a container, a card, a widget or a feature. */
  type?: "LINE" | "PILL";
  /** One of the small set of plain line shapes the drawer draws, centred in a square the height of a control. At the end of an
   *  item line, `ARROW_RIGHT` and `ARROW_UP_RIGHT` are its end arrows, in `DSIconType`'s names, drawn bare. */
  icon?:
    | "close"
    | "add"
    | "menu"
    | "search"
    | "more"
    | "previous"
    | "next"
    | "select"
    | "checkbox"
    | "bell"
    | "person"
    | "default"
    | "ARROW_RIGHT"
    | "ARROW_UP_RIGHT";
  /** What bars stand in for; `lines` counts them, and the indexes in `headings` are shorter, taller heading bars.
   *  A `table` shows sample values in place of bars: `columns` are the words of its head row, and `cells` a few rows.
   *  A cell is a word, or an item that is plain words, a note, an icon or a control. A column with an empty head
   *  holds the actions of a row, and stands at the end. */
  standin?: "rows" | "cards" | "field" | "list" | "table";
  lines?: number;
  headings?: number[];
  columns?: string[];
  cells?: (string | SkeletonItem)[][];
  /** On a `field` stand-in: the field of a form with its own words. `label` is its title, `info` puts the mark of
   *  its help at the end of the title's line, `text` is the sample value in its control, and `control: "select"`
   *  draws that control as a select. Under the control stands one line, its `error` or else its `description`,
   *  and the room of that line is kept where a field has neither. */
  label?: string;
  info?: boolean;
  description?: string;
  error?: string;
  /** On a `field` stand-in with a `label`: the field is read and not entered, as the library's data unit shows it.
   *  Its value stands under its title with no box, as plain words, or as a badge with `control: "badge"`. */
  read?: boolean;
  /** A line in the style of the library's item: a `media`, the name of an icon; a `title`; a `description` under it;
   *  `meta`, several facts on the line under the title, each a word or a badge; and `end`, what stands at the end
   *  of the line. `inline` marks a compact line at the level INLINE: with facts and no description, its facts stand on
   *  the title's line after a dot ("v3 · Draft"). `media` given as the name of an icon is a mark; given in `IDSItemMedia`'s
   *  shape it is a bare icon (`ICON`) or a mark (`MARK`). `factsPlacement` `AFTER_TITLE` stands the facts under the title,
   *  over the description, and `selected` marks the chosen line of a feature's boxed items. */
  item?: {
    media?: string | SkeletonMedia;
    title: string;
    description?: string;
    meta?: (string | SkeletonItem)[];
    end?: SkeletonItem[];
    inline?: boolean;
    factsPlacement?: "AFTER_DESCRIPTION" | "AFTER_TITLE";
    selected?: boolean;
  };
  /** A feature's head, in the names of `IDSFeatureProps`: its `pageLevel`, which sizes it, `CONTAINER` where it is left out;
   *  the `eyebrow`, the words over the title, or a badge there; the `title`; the `description` under it; `facts`, each a word
   *  or a badge, on one line under the description; `textAlign`, `START` where it is left out; and `media`, a `MARK` or an
   *  `AVATAR` over its words. It is one block as tall as its lines. */
  head?: {
    pageLevel?: "PAGE" | "CONTAINER" | "WIDGET";
    eyebrow?: string | SkeletonItem;
    title: string;
    description?: string;
    facts?: SkeletonItem[];
    textAlign?: "START" | "CENTER";
    media?: SkeletonMedia;
  };
  /** Free room that pushes the items after it to the end of the row. */
  spacer?: boolean;
  /** A region standing taller than what it holds, in rows. */
  height?: number;
  /** Set by the drawer and never written in a spec: this word is the title of a part of the content, this item is
   *  the header of a page drawn with no page level, or this item is the page level's own. */
  part?: boolean;
  page?: boolean;
};
/** A row runs left to right. `label` names the place, in a column every row of the frame shares;
 *  `framed` puts the row's items inside one box, as an example sits in its frame. */
/** `chosen`, in a container: this row is the chosen line of a list, and a band is drawn behind it. */
/** `marked`: the row has no border, and a dotted line is drawn around it to show how far it reaches. */
export type SkeletonRow = {
  label?: string;
  framed?: boolean;
  chosen?: boolean;
  marked?: boolean;
  items: SkeletonItem[];
  /** Set by the drawer and never written in a spec: the unit of the part of the content this row stands in, and
   *  whether it is that part's first row, under which its name stands. */
  within?: string;
  lead?: boolean;
};
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
  label?: string;
  note?: string;
  width?: string;
  rows: SkeletonRow[];
  look?: "raised" | "bordered" | "flat" | "card" | "container";
  tag?: string;
  height?: number;
  fill?: boolean;
  /** The design system's unit this frame is. Its name gives its level: a container, a widget, a card, or a component. */
  unit?: string;
  /** Set by the drawer and never written in a spec: the page level stands above this frame, so no item in it is the page's header. */
  headed?: boolean;
  frames?: string[];
  raised?: boolean;
  bordered?: boolean;
  rounded?: boolean;
  size?: "XS" | "SM" | "MD" | "LG" | "XL";
  /** Set by the drawer and never written in a spec: this word is the title of a part of the content, or this
   *  item is the header of the page. */
  part?: boolean;
  /** With a `look` of `container`: what stands at the end of its header, the rows of its footer, and its content
   *  as several parts, each with a title of its own, its actions at the end of that title, and its rows. */
  actions?: SkeletonItem[];
  footer?: SkeletonRow[];
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
  color?: "BASE" | "DEFAULT" | "PRIMARY";
  strength?: "SUBTLE" | "QUIET" | "SOLID";
  inset?: boolean;
  /** On a `DSFeature`, in its own names: `items.surface` puts each of its item lines in a frame of its own. With `frames`, which on
   *  a `DSFeature` names its parts `TEXT` and `MEDIA`, `surface` is what the feature's own frame draws. `items.type` and
   *  `items.borderType` draw the lines between its items, and `items.numbered` a number before each item's title. `items.type`
   *  `STATS` draws each item line as a statistic: its title the value, large, and its description the label under it. */
  items?: {
    surface?: SkeletonFrame["surface"];
    type?: "GRID" | "LIST" | "STATS";
    borderType?: "NONE" | "GRID" | "EDGE";
    numbered?: boolean;
  };
  surface?: {
    color?: "BASE" | "DEFAULT" | "PRIMARY";
    strength?: "SUBTLE" | "QUIET" | "SOLID";
    raised?: boolean;
    elevation?: "XS" | "SM" | "MD" | "LG" | "XL";
    bordered?: boolean;
    rounded?: boolean;
  };
  /** On a `DSFeature`: where the two sides of its split stand against each other, each at its own height. Left out, every part
   *  stretches to its row. */
  verticalAlign?: "TOP" | "CENTER" | "BOTTOM";
  /** On a `DSFeature`, `DSFeatureType` `BACKDROP`: its media, a slot in a row of its own, stands behind its words and its actions,
   *  and they keep to three fifths of its width on a tablet and a desktop. The other types are drawn by where its rows place the media. */
  type?: "BACKDROP";
  /** On a `DSFeatureGridSectionContainer`, in its own names: `section`, the section it draws, with a `DSSectionContainer`'s fill and
   *  room; `grid.borderType`, the lines between its cells; and `grid.desktop`, `grid.tablet` and `grid.mobile`, the columns at each
   *  screen class, which a view reads for its own. */
  section?: {
    color?: "BASE" | "DEFAULT" | "PRIMARY";
    strength?: "SUBTLE" | "QUIET" | "SOLID";
    inset?: boolean;
    size?: "XS" | "SM" | "MD" | "LG" | "XL";
  };
  grid?: {
    borderType?: "NONE" | "GRID" | "EDGE";
    desktop?: number;
    tablet?: number;
    mobile?: number;
  };
  /** On a `DSAccordionGroup`, in `IDSAccordionGroupOption`'s names: its entries, each a `header`, the `content` an open entry shows
   *  under it, and `expanded`, whether it is open. With `bordered` each entry stands in an outline of its own. */
  options?: SkeletonAccordionOption[];
};
/** One entry of a `DSAccordionGroup`: the words of its header, the words its open body shows, and whether it is open. */
export type SkeletonAccordionOption = {
  header: string;
  content?: string;
  expanded?: boolean;
};
/** A section of the content of a container or a card: its title, the actions at the end of that title, its rows, and
 *  the unit of the design system it is, whose name stands at its corner. A section with a title and no unit is a group,
 *  the level `GROUP` of the design system: a dotted boundary round it, *Group* at its corner.
 *
 *  `part: true` makes the section a content part of a container (`DSPanelContainer.Content`) and not a group: it takes no
 *  dotted boundary and no corner word, only its title with its actions, and a line across the container's box above it
 *  where it is not the first part. Its own `sections` are the groups that stand inside it, each with its dotted boundary.
 *  A container's content is parts separated by lines, or groups, or both: parts by lines, groups inside a part. */
export type SkeletonSection = {
  label?: string;
  actions?: SkeletonItem[];
  rows: SkeletonRow[];
  divided?: boolean;
  unit?: string;
  part?: boolean;
  sections?: SkeletonSection[];
};
/** One screen at one screen class, and in one task state where it shows one: a whole frame of its own, never derived
 *  from another view. A spec holds `views` in place of `frame`, and the views are drawn in one figure. `page` is the
 *  view's page level. */
export type SkeletonView = {
  viewport: "DESKTOP" | "TABLET" | "MOBILE";
  state?: string;
  page?: SkeletonPage;
  frame: SkeletonFrame;
};

/** The measure the figure check uses, at the drawn scale: a character of a name (sans 600 at 12), of a detail or a wire's label
 *  (mono at 10) and of a plate's label (mono 600 capitals at 9.5, spaced .08em). */
const W_LABEL = 6.8,
  W_NOTE = 6,
  W_TITLE = 6.5;
// The drawing scale: 12 between tiles, 24 between plates, 56 where a wire joins two units, 16 from the frame and inside a plate,
// 12 inside a tile, 16 between parallel wires, 8 between a label and its wire, and a tile's height from its form (name alone 36,
// with a detail line 48, one more line 15 more, on the grid of 4).
const PAD_X = 12,
  GAP_Y = 12,
  GAP_PLATES = 24,
  GAP_COL = 56,
  GAP_LINKED = 56;
// A box edge carries three connection points at most; a fourth link leaves by another side.
// A side offers three points at most — its middle and the middle of each half.
const SIDE_POINTS = 3,
  GAP_APART = 16;
// A wire's label and the wire itself. Every figure puts this much clear space between a
// label's line and any wire — its own or a neighbour's — so no drawer invents its own offset and
// no reader has to work out which run a word belongs to.
const LABEL_H = 12,
  LABEL_GAP = 8;
const H_ONE = 36,
  H_TWO = 48,
  LINE_STEP = 15;
/** The docs column: a frame 928 wide, content 16 in from it, drawn at 1:1. */
const FRAME_W = 928,
  FRAME_PAD = 16,
  WIRE_R = 8;
const up4 = (n: number) => Math.ceil(n / 4) * 4;
/** A tile's height from its form: a name alone 36, with detail lines 48 and 15 more for each line past the first, on the 4 grid. */
const tileH = (lines: number) => (lines ? up4(33 + LINE_STEP * lines) : H_ONE);

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * A spec's caption as the text of a `<figcaption>`, for a drawing printed on its own. `figureOf` writes its caption as markup,
 * because a page renders the caption's own markdown first; `docs figure draw` has no page around it, so its caption is text,
 * and a `<` in it wrote an element into the figure (041 follow-ups row 8). An entity the author wrote, such as `&mdash;`, is kept.
 */
export const captionText = (s: string): string =>
  s.replace(/&(?![A-Za-z]+;|#\d+;|#x[0-9A-Fa-f]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// A LABEL IS SPOKEN, NOT RENDERED. A caption may carry the page's own markdown — a code span for a
// contract term, emphasis on one word — and the `<figcaption>` renders it as markup. The `aria-label`
// is read aloud instead, so the same sentence reaching it verbatim makes a screen reader announce the
// backtick characters themselves. Found by a step 2 agent on the one caption that spells a contract
// term as a code span (N14, 2026-09-22). The markers are the four `render.ts` renders inline.
const spoken = (s: string) =>
  s
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1$2");

/**
 * A FIGURE IS DRAWN ON THE COLUMN'S 928 FRAME, AT 1:1. Every drawer lays out inside the frame, 16 in from its edge, and the
 * viewBox is the frame's whole width and the content's height plus 16 below it; the page sets `width: 100%` and a 928 cap,
 * so a figure is never stretched, and on a phone it scales to the column and opens at 1:1 on a tap (the docs language's
 * "Media size"). A figure whose content is wider than the frame, a skeleton of a desktop screen, is a wider frame still,
 * scaled to the column, and says so in its case line.
 */
function fit(body: string[]): { x0: number; y0: number; w: number; h: number } {
  const src = body.join("\n");
  let hi: [number, number] = [0, 0];
  const see = (x: number, y: number) => {
    hi = [Math.max(hi[0], x), Math.max(hi[1], y)];
  };
  for (const m of src.matchAll(
    /<rect[^>]*\sx="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/g,
  )) {
    const [x, y, w, h] = m.slice(1).map(Number);
    see(x + w, y + h);
  }
  for (const m of src.matchAll(
    /<circle[^>]*\scx="(-?[\d.]+)" cy="(-?[\d.]+)" r="([\d.]+)"/g,
  )) {
    const [cx, cy, r] = m.slice(1).map(Number);
    see(cx + r, cy + r);
  }
  for (const m of src.matchAll(
    /<ellipse[^>]*\scx="(-?[\d.]+)" cy="(-?[\d.]+)" rx="([\d.]+)" ry="([\d.]+)"/g,
  )) {
    const [cx, cy, rx, ry] = m.slice(1).map(Number);
    see(cx + rx, cy + ry);
  }
  // Text is measured from the same character widths the figure check measures it by.
  for (const m of src.matchAll(
    /<text class="([\w -]+)" x="(-?[\d.]+)" y="(-?[\d.]+)"((?: text-anchor="\w+")?)>([\s\S]*?)<\/text>/g,
  )) {
    const cls = m[1],
      x = Number(m[2]),
      y = Number(m[3]);
    const w = m[5].replace(/&[a-z]+;/g, " ").length * textW(cls);
    const left = m[4].includes("middle")
      ? x - w / 2
      : m[4].includes("end")
        ? x - w
        : x;
    see(left + w, y + 3);
  }
  for (const m of src.matchAll(/<path[^>]*\sd="([^"]+)"/g)) {
    let x = 0,
      y = 0;
    for (const [, c, u, v] of m[1].matchAll(
      /([MLHVQA])\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+))?/g,
    )) {
      if (c === "H") x = Number(u);
      else if (c === "V") y = Number(u);
      else if (v !== undefined) {
        x = Number(u);
        y = Number(v);
      }
      see(x, y);
    }
  }
  return {
    x0: 0,
    y0: 0,
    w: Math.max(FRAME_W, Math.ceil(hi[0] + FRAME_PAD)),
    h: up4(hi[1] + FRAME_PAD),
  };
}

/** The pixels a character of a text class takes, at the drawn scale. */
function textW(cls: string): number {
  return /\bdl-(?:detail|wlabel|tag|caption)\b/.test(cls)
    ? W_NOTE
    : /\bdl-label\b/.test(cls)
      ? W_TITLE
      : W_LABEL;
}

/** One masthead for every drawer: the frame's wrapper and a viewBox of the column's width, drawn 1:1. */
function svgOf(
  body: string[],
  label: string,
  extraClass = "",
  motion?: string,
): string {
  const { x0, y0, w, h } = fit(body);
  return [
    `<svg class="dl-svg${extraClass ? " " + extraClass : ""}" viewBox="${x0} ${y0} ${w} ${h}"${motion ? ` data-motion="${motion}"` : ""} role="img" aria-label="${esc(spoken(label))}">`,
    ...body,
    `</svg>`,
  ].join("\n");
}

/**
 * A WIRE, as the language draws it: solid 1, every corner soft with a radius of 8, no arrowhead, a reply dashed. `d` is the
 * orthogonal path the layout decided (M, H, V and L only); the corners are rounded here and nowhere else, so the layout and
 * the figure check reason about one set of corners.
 */
function soft(d: string): string {
  const pts: [number, number][] = [];
  let x = 0,
    y = 0;
  for (const [, c, u, v] of d.matchAll(
    /([MLHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g,
  )) {
    const a = Number(u);
    if (c === "H") x = a;
    else if (c === "V") y = a;
    else {
      x = a;
      y = Number(v);
    }
    const last = pts[pts.length - 1];
    if (!last || last[0] !== x || last[1] !== y) pts.push([x, y]);
  }
  // A point in the middle of a straight run is no corner.
  const keep = pts.filter(
    (p, i) =>
      i === 0 ||
      i === pts.length - 1 ||
      !(
        (pts[i - 1][0] === p[0] && p[0] === pts[i + 1][0]) ||
        (pts[i - 1][1] === p[1] && p[1] === pts[i + 1][1])
      ),
  );
  const n = (v: number) => String(Math.round(v * 100) / 100);
  let out = `M${n(keep[0][0])} ${n(keep[0][1])}`;
  for (let i = 1; i < keep.length - 1; i++) {
    const [x0, y0] = keep[i - 1],
      [x1, y1] = keep[i],
      [x2, y2] = keep[i + 1];
    const r = Math.min(
      WIRE_R,
      (Math.abs(x1 - x0) + Math.abs(y1 - y0)) / 2,
      (Math.abs(x2 - x1) + Math.abs(y2 - y1)) / 2,
    );
    const ax = x1 - Math.sign(x1 - x0) * r,
      ay = y1 - Math.sign(y1 - y0) * r;
    const bx = x1 + Math.sign(x2 - x1) * r,
      by = y1 + Math.sign(y2 - y1) * r;
    out += ` L${n(ax)} ${n(ay)} Q${n(x1)} ${n(y1)} ${n(bx)} ${n(by)}`;
  }
  const end = keep[keep.length - 1];
  return out + ` L${n(end[0])} ${n(end[1])}`;
}
function wireSvg(d: string, dashed = false, extra = "", on = false): string {
  return `  <path class="${on ? "dl-wire-on" : "dl-wire"}${dashed ? " dl-wire-dash" : ""}"${extra} d="${soft(d)}"/>`;
}

/**
 * WIRES THAT MEET ONE TILE JOIN ONE BUS, as saasplane.ai draws them: where several wires leave a column for the same side of one tile, each
 * runs a short stub to a line standing 28 clear of that side, the stubs join it, and one line goes on to the tile's middle; where several
 * wires leave one side of one tile for different tiles, the one line runs out from the tile's middle to the same bus and the wires part there.
 * Every wire is still its own path (it runs the shared line itself, and the strokes lie over each other), so the count of wires is the
 * count of links. Only solid wires between different tiles join, and a group that has no room for its bus is left as drawn.
 */
type Side = "left" | "right" | "top" | "bottom";
type BusWire = { d: string; from: string; to: string; dashed?: boolean };
type BusPt = [number, number];
function ptsOf(d: string): BusPt[] {
  const pts: BusPt[] = [];
  let x = 0,
    y = 0;
  for (const [, c, u, v] of d.matchAll(
    /([MLHV])\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+))?/g,
  )) {
    const a = Number(u);
    if (c === "H") x = a;
    else if (c === "V") y = a;
    else {
      x = a;
      y = Number(v);
    }
    const last = pts[pts.length - 1];
    if (!last || last[0] !== x || last[1] !== y) pts.push([x, y]);
  }
  return pts;
}
const dOfPts = (pts: BusPt[]) =>
  `M${pts[0][0]} ${pts[0][1]}` +
  pts
    .slice(1)
    .map((q, i) => (q[1] === pts[i][1] ? ` H${q[0]}` : ` V${q[1]}`))
    .join("");
const BUS_AT = GAP_LINKED / 2;
/** A system's bus stands this far from the tile: its rail carries a label on the run into the bus, and the figure is 928 wide at most. */
const SYS_BUS_AT = 28,
  SYS_BUSES = [28, 24, 20, 16, 0],
  RAIL_LANE = 16;
function busWires(
  wires: BusWire[],
  edge: (id: string, side: Side) => number | null,
  attach: (id: string, side: Side) => number | null,
  busAt = BUS_AT,
): string[] {
  const pts = wires.map((w) => ptsOf(w.d));
  const touched = new Set<number>();
  const arrival = (p: BusPt[], end: "last" | "first"): Side | null => {
    const q = end === "last" ? p : [...p].reverse();
    if (q.length < 2) return null;
    const [a, b] = [q[q.length - 2], q[q.length - 1]];
    if (a[1] === b[1] && a[0] !== b[0]) return a[0] < b[0] ? "left" : "right";
    if (a[0] === b[0] && a[1] !== b[1]) return a[1] < b[1] ? "top" : "bottom";
    return null;
  };
  const apply = (end: "last" | "first") => {
    const groups = new Map<string, number[]>();
    wires.forEach((w, i) => {
      if (w.dashed || w.from === w.to || touched.has(i) || pts[i].length < 2)
        return;
      const id = end === "last" ? w.to : w.from,
        side = arrival(pts[i], end);
      if (!side) return;
      const e = edge(id, side),
        last = end === "last" ? pts[i][pts[i].length - 1] : pts[i][0];
      if (
        e === null ||
        Math.abs(
          (side === "left" || side === "right" ? last[0] : last[1]) - e,
        ) > 1
      )
        return;
      const key = `${id}\u0000${side}`;
      groups.set(key, [...(groups.get(key) ?? []), i]);
    });
    for (const [key, idx] of groups) {
      const [id, side] = key.split("\u0000") as [string, Side];
      const others = new Set(
        idx.map((i) => (end === "last" ? wires[i].from : wires[i].to)),
      );
      if (idx.length < 2 || others.size < 2) continue;
      const c = attach(id, side),
        e = edge(id, side);
      if (c === null || e === null) continue;
      const horiz = side === "left" || side === "right";
      const sign = side === "left" || side === "top" ? -1 : 1; // the bus stands on the tile's own side of the edge
      const bus = e + sign * busAt;
      // each wire, walked towards the tile, as (along, across) so the one rule serves both axes
      const cut = idx.map((i) => {
        const q = end === "last" ? pts[i] : [...pts[i]].reverse();
        const al = (pt: BusPt) => (horiz ? pt[0] : pt[1]) * -sign,
          cr = (pt: BusPt) => (horiz ? pt[1] : pt[0]);
        const alBus = al([horiz ? bus : 0, horiz ? 0 : bus]);
        for (let k = 1; k < q.length; k++) {
          if (al(q[k]) >= alBus && al(q[k - 1]) < alBus) {
            if ((horiz ? q[k][1] : q[k][0]) !== cr(q[k - 1])) return null; // the run that reaches the bus is not straight
            // a corner too near the bus is taken out: the run before it goes on to the bus instead
            let kept = q.slice(0, k);
            while (al(kept[kept.length - 1]) > alBus - GAP_APART) {
              if (kept.length < 3) return null;
              kept = kept.slice(0, -2);
            }
            return { keep: kept, across: cr(kept[kept.length - 1]) };
          }
        }
        return null;
      });
      if (cut.some((x) => x === null)) continue;
      idx.forEach((i, n) => {
        const { keep, across } = cut[n]!;
        const join: BusPt[] = horiz
          ? [
              [bus, across],
              [bus, c],
              [e, c],
            ]
          : [
              [across, bus],
              [c, bus],
              [c, e],
            ];
        const full = [...keep, ...join];
        pts[i] = end === "last" ? full : full.reverse();
        touched.add(i);
      });
    }
  };
  apply("last");
  apply("first");
  return wires.map((w, i) => (touched.has(i) ? dOfPts(pts[i]) : w.d));
}

/** A text of the language. `middle` and `end` anchor it, which the figure check reads. */
function textSvg(
  cls: "dl-name" | "dl-detail" | "dl-wlabel" | "dl-label" | "dl-tag",
  x: number,
  y: number,
  s: string,
  anchor: "start" | "middle" | "end" = "start",
): string {
  return `  <text class="${cls}" x="${Math.round(x * 100) / 100}" y="${Math.round(y * 100) / 100}"${anchor === "start" ? "" : ` text-anchor="${anchor}"`}>${esc(s)}</text>`;
}

type Vert = { x: number; y1: number; y2: number; path?: number };
type Blocker = { x: number; y: number; w: number; h: number; path?: number };
// A LABEL IS NEVER BLOCKED BY ITS OWN CONNECTOR. Once runs became blockers the placer started
// pushing each label away from the very line it names — a system diagram's labels sit a standard
// gap above their own horizontal leg, which is exactly where they belong. Each run carries the
// path it came from and each label the path it names, and the placer skips the match.
type Pending = { x: number; y: number; w: number; txt: string; path?: number };

/** The straight runs of a wire's path: horizontal ones `{ x, y, len }` from their left end, vertical ones `{ x, y, len }` from their top. */
function runsOf(d: string): {
  h: { x: number; y: number; len: number }[];
  v: { x: number; y: number; len: number }[];
} {
  const h: { x: number; y: number; len: number }[] = [],
    v: { x: number; y: number; len: number }[] = [];
  let x = 0,
    y = 0;
  for (const [, c, u, w] of d.matchAll(
    /([MHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g,
  )) {
    const a = Number(u);
    const nx = c === "V" ? x : a,
      ny = c === "V" ? a : c === "M" ? Number(w) : y;
    if (c === "H" && nx !== x)
      h.push({ x: Math.min(x, nx), y, len: Math.abs(nx - x) });
    if (c === "V" && ny !== y)
      v.push({ x, y: Math.min(y, ny), len: Math.abs(ny - y) });
    x = nx;
    y = ny;
  }
  return { h, v };
}

/**
 * WHERE A WIRE'S LABEL STANDS: on the longest straight horizontal run of its own path that no other wire's run overlaps and that is long
 * enough for the words between its soft corners (a run two wires share is a bus, and a label there names neither). A wire with no such
 * run is named from the side of a vertical run of its own, the label's baseline set so it is centred on it; one with neither takes the
 * longest run it has.
 */
function labelRun(
  d: string,
  others: string[],
  w: number,
): { x: number; y: number; len: number; vertical?: boolean } | null {
  const mine = runsOf(d);
  const theirs = others.flatMap((o) => runsOf(o));
  // the part of a run no other wire's run lies along: a run partly on a bus keeps the stretch that is its own
  const own = (r: { x: number; y: number; len: number }, vertical: boolean) => {
    let pieces: [number, number][] = [
      [vertical ? r.y : r.x, (vertical ? r.y : r.x) + r.len],
    ];
    for (const t of theirs)
      for (const q of vertical ? t.v : t.h) {
        if (Math.abs(vertical ? q.x - r.x : q.y - r.y) >= 1) continue;
        const lo = vertical ? q.y : q.x,
          hi = lo + q.len;
        pieces = pieces.flatMap(([a, b]): [number, number][] =>
          hi <= a || lo >= b
            ? [[a, b]]
            : (
                [
                  [a, Math.min(b, lo)],
                  [Math.max(a, hi), b],
                ] as [number, number][]
              ).filter(([m, n]) => n - m > 1),
        );
      }
    return pieces.map(([a, b]) =>
      vertical ? { x: r.x, y: a, len: b - a } : { x: a, y: r.y, len: b - a },
    );
  };
  const hs = mine.h.flatMap((r) => own(r, false)).sort((a, b) => b.len - a.len);
  const vs = mine.v.flatMap((r) => own(r, true)).sort((a, b) => b.len - a.len);
  const room = w + 2 * LABEL_GAP; // the soft corners at the ends of a run take 8 each
  const fit = hs.find((r) => r.len >= room);
  if (fit) return fit;
  const side = vs.find((r) => r.len >= LABEL_H + 2 * LABEL_GAP);
  if (side)
    return {
      x: side.x + LABEL_GAP,
      y: side.y + side.len / 2 + 5,
      len: 0,
      vertical: true,
    };
  if (hs[0]) return hs[0];
  const up = [...mine.v].sort((a, b) => b.len - a.len)[0];
  return up
    ? { x: up.x + LABEL_GAP, y: up.y + up.len / 2 + 5, len: 0, vertical: true }
    : null;
}

/** Every vertical run in a path, so a label can be kept off all of them and not merely off its own. */
function vertsOf(d: string, path?: number): Vert[] {
  const out: Vert[] = [];
  let x = 0,
    y = 0;
  for (const [, c, u, v] of d.matchAll(
    /([MHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g,
  )) {
    const a = Number(u);
    const nx = c === "V" ? x : a,
      ny = c === "V" ? a : c === "M" ? Number(v) : y;
    if (c === "V") out.push({ x, y1: y, y2: ny, path });
    x = nx;
    y = ny;
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
  let x = 0,
    y = 0;
  for (const [, c, u, v] of d.matchAll(
    /([MHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g,
  )) {
    const a = Number(u);
    const nx = c === "V" ? x : a,
      ny = c === "V" ? a : c === "M" ? Number(v) : y;
    if (c === "H")
      out.push({ x: Math.min(x, nx), y: y, w: Math.abs(nx - x), h: 0, path });
    x = nx;
    y = ny;
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
function placeLabels(
  pending: Pending[],
  verticals: Vert[],
  margin: number,
  width: number,
  boxes: Blocker[] = [],
): string[] {
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
  const bands = [
    0,
    -PITCH,
    PITCH,
    -2 * PITCH,
    2 * PITCH,
    -3 * PITCH,
    3 * PITCH,
  ];
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
      const top = y - LABEL_H,
        bottom = y;
      return [
        ...verticals
          .filter(
            (v) =>
              Math.min(v.y1, v.y2) < bottom + LABEL_GAP &&
              Math.max(v.y1, v.y2) > top - LABEL_GAP,
          )
          .map((v) => [v.x - LABEL_GAP, v.x + LABEL_GAP] as [number, number]),
        ...boxes
          .filter(
            (b) =>
              b.y < bottom + LABEL_GAP - (b.h === 0 ? 0.75 : 0) &&
              b.y + b.h > top - LABEL_GAP,
          )
          .map(
            (b) => [b.x - LABEL_GAP, b.x + b.w + LABEL_GAP] as [number, number],
          ),
        ...settled
          .filter((q) => Math.abs(q.y - y) < PITCH)
          .map(
            (q) => [q.x - LABEL_GAP, q.x + q.w + LABEL_GAP] as [number, number],
          ),
      ];
    };
    let best: { x: number; y: number } | null = null;
    for (const dy of bands) {
      const y = p.y + dy;
      const blocked = blockedAt(y);
      const free = (x: number) =>
        x >= margin &&
        x + p.w <= width - margin &&
        !blocked.some(([lo, hi]) => lo < x + p.w && x < hi);
      if (free(p.x)) {
        best = { x: p.x, y: y };
        break;
      }
      const tries = [
        ...blocked.flatMap(([lo, hi]) => [hi, lo - p.w]),
        margin,
        width - margin - p.w,
      ]
        .filter(free)
        .sort((m, n) => Math.abs(m - p.x) - Math.abs(n - p.x));
      if (tries.length) {
        best = { x: tries[0], y: y };
        break;
      }
    }
    // NOWHERE CLEAR ANYWHERE still leaves it where it was put, and the check still reports it.
    // A placer that invents room it does not have hides the crowding instead of fixing it.
    const at = best ?? { x: p.x, y: p.y };
    settled.push({ x: at.x, y: at.y, w: p.w });
    return textSvg("dl-wlabel", Math.round(at.x), Math.round(at.y), p.txt);
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
  const halves = [at(0.25), at(0.75)],
    all = [at(0.25), at(0.5), at(0.75)];
  const want = Math.min(Math.max(asking, 1), SIDE_POINTS);
  if (want === 1) return [at(0.5)];
  if (want === 2) return len / 2 >= GAP_APART ? halves : [at(0.5)];
  if (len / (SIDE_POINTS + 1) >= GAP_APART) return all;
  return len / 2 >= GAP_APART ? halves : [at(0.5)];
}
const alignedTo = (points: number[], towards: number): number =>
  points.reduce(
    (best, p) => (Math.abs(p - towards) < Math.abs(best - towards) ? p : best),
    points[0],
  );

/** A glyph of the language: a lucide drawing, 16 in a tile, no mark behind it. A spec names one in a box's `icon`. */
const GLYPHS: Record<string, string> = {
  layers:
    '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  "book-open":
    '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  database:
    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  server:
    '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  "file-text":
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  "git-branch":
    '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  "circle-check": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  folder:
    '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  "shield-check":
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  rocket:
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>',
  "app-window":
    '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><path d="M6 4v4"/>',
  "layout-grid":
    '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  "key-round":
    '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
  "list-checks":
    '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  monitor:
    '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  "square-pen":
    '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};
/** The glyph's drawing, scaled to `size` and centred on (cx, cy). */
function glyphSvg(
  name: string,
  cx: number,
  cy: number,
  size = 16,
  extra = "",
): string {
  const k = size / 24;
  return `  <g class="dl-glyph${extra}" transform="translate(${(cx - size / 2).toFixed(1)} ${(cy - size / 2).toFixed(1)}) scale(${k.toFixed(4)})">${GLYPHS[name] ?? GLYPHS["square-pen"]}</g>`;
}
const glyphOf = (b: Box) => (b.icon && GLYPHS[b.icon] ? b.icon : undefined);
/** A tile's glyph takes 12 from the left edge, 16 wide, and 10 to the words: 26 in all, beside the 12 of padding. */
const GLYPH_W = 26;

/** The detail lines of a box: its note, a line to each `\n` in it (a map wraps each line further, where it is long). */
const noteLines = (note?: string): string[] => (note ? note.split("\n") : []);
function boxWidth(b: Box): number {
  const label = b.label.length * W_LABEL;
  const note = Math.max(0, ...noteLines(b.note).map((l) => l.length)) * W_NOTE;
  return up4(Math.max(label, note) + PAD_X * 2 + (glyphOf(b) ? GLYPH_W : 0));
}
const boxHeight = (b: Box) =>
  b.note ? tileH(noteLines(b.note).length) : H_ONE;

/** The face of a box, by its tone: `em` is the unit in focus, `warn` a refusal, `off` a box that is absent and drawn dashed. */
const TONES = [
  "success",
  "warning",
  "error",
  "info",
  "neutral",
  "blue",
  "green",
  "amber",
  "red",
  "violet",
  "cyan",
  "pink",
  "olive",
  "orange",
  "grey",
];
function faceOf(b: Box): { cls: string; group: string; line: string } {
  // A tone is a state (success, warning, error, info, neutral) or one of the palette's hues; the unit takes its wash, its edge and its glyph.
  if (b.tone && TONES.includes(b.tone))
    return { cls: "dl-tile-st", group: `dl-st-${b.tone}`, line: "dl-line-st" };
  if (b.em) return { cls: "dl-tile-on", group: "", line: "dl-line-on" };
  if (b.warn)
    return { cls: "dl-tile-st", group: "dl-st-error", line: "dl-line-st" };
  if (b.off) return { cls: "dl-tile-yours", group: "", line: "dl-line-edge" };
  return { cls: "dl-tile", group: "", line: "dl-line-edge" };
}
/** Wraps a unit's marks in its state group, so the state's tokens reach the glyph and the edge. */
function unit(b: Box, marks: string[]): string {
  const g = faceOf(b).group;
  const inner = g
    ? `  <g class="${g}">\n${marks.join("\n")}\n  </g>`
    : marks.join("\n");
  return STEP === null
    ? inner
    : `  <g data-dl-step="${++STEP}">\n${inner}\n  </g>`;
}

/** A box as a tile: radius 10, its name 12 from the left (after its glyph), and its detail lines beneath it. */
function rect(
  b: Box,
  x: number,
  y: number,
  w: number,
  h: number,
  lines: string[] = noteLines(b.note),
  top = false,
): string {
  const g = glyphOf(b);
  const tx = x + PAD_X + (g ? GLYPH_W : 0);
  const marks = [
    `  <rect class="${faceOf(b).cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`,
  ];
  if (g)
    marks.push(
      glyphSvg(
        g,
        x + 20,
        y + h / 2,
        16,
        b.warn || b.tone ? " dl-glyph-st" : "",
      ),
    );
  if (!lines.length)
    marks.push(textSvg("dl-name", tx, top ? y + 21 : y + h / 2 + 4, b.label));
  else {
    marks.push(textSvg("dl-name", tx, y + 21, b.label));
    lines.forEach((line, i) =>
      marks.push(textSvg("dl-detail", tx, y + 36 + LINE_STEP * i, line)),
    );
  }
  return unit(b, marks);
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
  if (!boxes.length)
    return { svg: "", findings: ["a `dg` figure with no boxes"] };

  const centre = boxes.find((b) => b.em) ?? boxes[0];
  if (!boxes.some((b) => b.em))
    findings.push(
      `no box is marked \`em\`, so \`${centre.id}\` was taken as the centre`,
    );

  const targets = links.filter((l) => l.from === centre.id).map((l) => l.to);
  const sources = links.filter((l) => l.to === centre.id).map((l) => l.from);
  const byId = new Map(boxes.map((b) => [b.id, b]));
  for (const l of links)
    for (const end of [l.from, l.to])
      if (!byId.has(end))
        findings.push(`a link names \`${end}\`, and no box has that id`);

  const left = [...new Set(sources)].map((id) => byId.get(id)!).filter(Boolean);
  const right = [...new Set(targets)]
    .map((id) => byId.get(id)!)
    .filter(Boolean);
  const placed = new Set([
    centre.id,
    ...left.map((b) => b.id),
    ...right.map((b) => b.id),
  ]);
  for (const b of boxes)
    if (!placed.has(b.id)) {
      right.push(b);
      findings.push(
        `\`${b.id}\` is in no link, so it was placed beside the centre`,
      );
    }

  const colWidth = (col: Box[]) =>
    col.length ? Math.max(...col.map(boxWidth)) : 0;
  // EVERY TILE OF THE DIAGRAM IS ONE SIZE: the widest tile's width and the tallest tile's height, so the three columns line up and a row across them is level.
  const natL = colWidth(left),
    natC = boxWidth(centre),
    natR = colWidth(right);
  const hTile = Math.max(...boxes.map(boxHeight));
  const colHeight = (col: Box[]) =>
    col.length * hTile + GAP_Y * Math.max(0, col.length - 1);
  const hL = colHeight(left),
    hC = hTile,
    hR = colHeight(right);

  const margin = FRAME_PAD;
  // A link's label rides in the column gap, so the gap is as wide as the widest label plus the clear
  // air it owes on both sides. Sized from GAP_COL alone, a label longer than 56px was hung above a
  // box instead and landed inside the next column (N13, 2026-09-21).
  // A RELATION'S TEXT IS ITS LABEL AND ITS CARDINALITY, as one phrase, computed ONCE. Sizing the
  // column gap from the label alone and then drawing the label plus its cardinality is two readings
  // of one thing, which is the shape of fault this arc keeps finding: the gap came out 80 wide for
  // text that needed 96, and three labels landed over boxes they did not belong to.
  const relationText = (l: Link) =>
    l.label ? (l.card ? `${l.label}  ${l.card}` : l.label) : (l.card ?? "");
  // the words ride above the wire and the cardinality under it, so the gap is as wide as the longer of the two
  const widestLabel = Math.max(
    0,
    ...links
      .flatMap((l) => [(l.label ?? "").length, (l.card ?? "").length])
      .map((n) => n * W_NOTE),
  );
  // A COLUMN GAP HOLDS THE LABELS **AND** THE ELBOWS. Sized for the widest label alone, a gap two
  // relations cross has its own two vertical runs standing in the space the labels were measured
  // for — so each label is pushed off its centre, onto a box or onto its neighbour. The gap is wide
  // enough for the widest thing said across it plus a lane for every relation after the first.
  const crossings = Math.max(
    links.filter((l) => l.to === centre.id).length,
    links.filter((l) => l.from === centre.id).length,
    1,
  );
  const gapCol = up4(
    Math.max(
      GAP_COL,
      Math.ceil(widestLabel) + LABEL_GAP * 2 + GAP_APART * crossings + 8,
    ),
  );
  const wAll = Math.max(natL, natC, natR),
    equal = wAll * 3 + gapCol * 2 + margin * 2 <= FRAME_W;
  const wL = equal ? wAll : natL,
    wC = equal ? wAll : natC,
    wR = equal ? wAll : natR;
  const height = Math.max(hL, hC, hR) + margin * 2;
  // The three columns stand centred on the frame, on the 4 grid.
  const width = FRAME_W;
  const xL = Math.max(margin, up4((FRAME_W - (wL + wC + wR + gapCol * 2)) / 2)),
    xC = xL + wL + gapCol,
    xR = xC + wC + gapCol;

  const out: string[] = [];
  const at = new Map<string, { x: number; y: number; w: number; h: number }>();
  const layColumn = (col: Box[], x: number, w: number, total: number) => {
    let y = margin + (height - margin * 2 - total) / 2;
    for (const b of col) {
      const h = hTile;
      out.push(rect(b, x, y, w, h, undefined, true));
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
  const eVerts: Vert[] = [],
    ePending: Pending[] = [];
  const eHorz: Blocker[] = [];
  // Per box AND per side, because a box can be pointed at from the left and point on to the right,
  // and each of those sides answers the how-many question on its own.
  const leaves = new Map<string, number>(),
    lands = new Map<string, number>();
  for (const l of links) {
    const a = at.get(l.from),
      b = at.get(l.to);
    if (!a || !b) continue;
    const side = a.x < b.x ? "R" : "L";
    const bump = (m: Map<string, number>, k: string) =>
      m.set(k, (m.get(k) ?? 0) + 1);
    bump(leaves, `${l.from}:${side}`);
    bump(lands, `${l.to}:${side === "R" ? "L" : "R"}`);
  }
  const lane = new Map<Link, { i: number; n: number }>();
  for (const l of links) {
    const peers = links.filter(
      (p) =>
        (at.get(p.from)?.x ?? -1) === (at.get(l.from)?.x ?? -2) &&
        (at.get(p.to)?.x ?? -1) === (at.get(l.to)?.x ?? -2),
    );
    lane.set(l, { i: peers.indexOf(l), n: peers.length });
  }

  const eRoutes: {
    d: string;
    from: string;
    to: string;
    dashed?: boolean;
    pathId: number;
    on: boolean;
  }[] = [];
  const byIdE = new Map(boxes.map((b) => [b.id, b]));
  for (const [pathId, l] of links.entries()) {
    const a = at.get(l.from),
      b = at.get(l.to);
    if (!a || !b) continue;
    const fromRight = a.x < b.x;
    const x1 = fromRight ? a.x + a.w : a.x;
    const x2 = fromRight ? b.x : b.x + b.w;
    const { i, n } = lane.get(l) ?? { i: 0, n: 1 };
    const y1 = alignedTo(
      sidePoints(
        a.y,
        a.h,
        leaves.get(`${l.from}:${fromRight ? "R" : "L"}`) ?? 0,
      ),
      b.y + b.h / 2,
    );
    const y2 = alignedTo(
      sidePoints(b.y, b.h, lands.get(`${l.to}:${fromRight ? "L" : "R"}`) ?? 0),
      y1,
    );
    // THE ELBOWS STAND AT THE FAR END OF THE RUN, 16 apart, so the wire leaves its tile straight and the long leg is clear for its label; a wire that
    // is level with its target has no elbow at all.
    const mid =
      y1 === y2 ? x2 : x2 - Math.sign(x2 - x1) * (GAP_APART * (n - i) + 8);
    const dPath =
      y1 === y2 ? `M${x1} ${y1} H${x2}` : `M${x1} ${y1} H${mid} V${y2} H${x2}`;
    eRoutes.push({
      d: dPath,
      from: l.from,
      to: l.to,
      dashed: l.dashed,
      pathId,
      on: !!byIdE.get(l.to)?.em,
    });
    // EVERY RELATION LINE CARRIES ITS CARDINALITY, which is what the chapter asks of this kind and
    // what the drawer had no field for: an ER diagram whose lines say only *belongs to* leaves the
    // reader with the one question they opened it to answer — one, or many? It rides with the label
    // rather than sitting apart from it, because the two are read as one phrase.
    if (!l.card)
      findings.push(
        `the relation \`${l.from}\` → \`${l.to}\` carries no cardinality; every relation line in an entity diagram says one or many (\`card\`: "1:N")`,
      );
    // THE WORDS STAND ABOVE THE WIRE AND THE CARDINALITY UNDER IT, both on the long leg: each is 8 clear of the wire and of the other.
    const lead = Math.min(x1, mid),
      tail = Math.max(x1, mid);
    const lo = Math.min(x1, x2) + LABEL_GAP,
      hi = Math.max(x1, x2) - LABEL_GAP;
    const put = (txt: string, below: boolean) => {
      const w = txt.length * W_NOTE,
        want = (lead + tail - w) / 2;
      ePending.push({
        x: Math.round(Math.min(Math.max(want, lo), Math.max(lo, hi - w))),
        y: y1 + (below ? LABEL_H + LABEL_GAP : -LABEL_GAP),
        w,
        txt,
        path: pathId,
      });
    };
    if (l.label) put(l.label, false);
    if (l.card) put(l.card, !!l.label);
  }

  const joined = busWires(
    eRoutes,
    (id, side) => {
      const p = at.get(id);
      return !p
        ? null
        : side === "left"
          ? p.x
          : side === "right"
            ? p.x + p.w
            : null;
    },
    (id, side) => {
      const p = at.get(id);
      return !p || (side !== "left" && side !== "right")
        ? null
        : Math.round(p.y + p.h / 2);
    },
  );
  eRoutes.forEach((r, i) => {
    r.d = joined[i];
    eVerts.push(...vertsOf(r.d, r.pathId));
    eHorz.push(...horzOf(r.d, r.pathId));
  });
  for (const r of eRoutes.filter((x) => !x.on))
    out.push(wireSvg(r.d, r.dashed));
  for (const r of eRoutes.filter((x) => x.on))
    out.push(wireSvg(r.d, r.dashed, "", true));
  out.push(
    ...placeLabels(ePending, eVerts, margin, width, [...at.values(), ...eHorz]),
  );

  return {
    svg: svgOf(out, spec.title ?? spec.caption ?? "entity diagram"),
    findings,
  };
}

/** CHAIN — a FLOW read left to right: a box per step, an arrow means *then*. */
function drawChain(spec: Spec): { svg: string; findings: string[] } {
  const boxes = spec.boxes ?? [];
  if (!boxes.length)
    return { svg: "", findings: ["a `dg` figure with no boxes"] };
  // 56 is the connected gap: a 7 arrowhead and 49 of shaft. It was 22, which is the grid's
  // unconnected gap — the two rules contradicted each other and the chain followed the wrong one.
  const margin = FRAME_PAD,
    gap = GAP_LINKED;
  const h = Math.max(...boxes.map(boxHeight));
  // the tiles of a row are equal: the widest tile's width and the tallest's height, the text laid from the top padding in each
  const widths = boxes.map(() => Math.max(...boxes.map(boxWidth)));
  const width =
    margin * 2 + widths.reduce((a, b) => a + b, 0) + gap * (boxes.length - 1);
  // A chain wider than the canvas is drawn by the map drawer as a one-way chain, which stands it
  // up as a vertical line. The neighbours are the links, since a chain declares none.
  if (width > FRAME_W) {
    const links = boxes
      .slice(0, -1)
      .map((b, i) => ({ from: b.id, to: boxes[i + 1].id }));
    return drawMap({ ...spec, kind: "map", links });
  }
  const height = margin * 2 + h;
  const out: string[] = [];
  let x = Math.max(margin, up4((FRAME_W - (width - margin * 2)) / 2));
  boxes.forEach((b, i) => {
    out.push(rect(b, x, margin, widths[i], h, undefined, true));
    if (i < boxes.length - 1)
      out.push(
        wireSvg(`M${x + widths[i]} ${margin + h / 2} H${x + widths[i] + gap}`),
      );
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
const NOTE_CHARS = 40;
function wrapNote(note: string): string[] {
  return note.split("\n").flatMap((part) => {
    const words = part.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if (cur && (cur + " " + w).length > NOTE_CHARS) {
        lines.push(cur);
        cur = w;
      } else cur = cur ? cur + " " + w : w;
    }
    if (cur) lines.push(cur);
    return lines;
  });
}
const shapeOf = (b: Box): Shape => b.shape ?? "process";

// The lean on a parallelogram, the bars on a predefined process, the cap on a cylinder, and the
// radius of an on-page connector. Four numbers, each belonging to one shape and to nothing else.
const SKEW = 16,
  BARS = 12,
  CAP = 12,
  DOT = 14;
// A window's title bar, a chevron's point, and how far a bucket narrows towards its foot.
const BAR = 24,
  POINT = 40,
  TAPER = 12;
// THE INNER TEXT BOX OF A SPECIAL SHAPE is the largest rectangle inside its outline, and the text is laid in it with the tile's padding (12),
// never nearer than 8 to a curve or a slant. A cylinder's body begins below its cap's whole depth (2 x CAP) and the first line is set 8 under it;
// a horizontal cylinder's text begins after its end cap's whole width; a slanted side (parallelogram, trapezoid) takes its whole lean off each side.
const STORE_TEXT = 2 * 12 + 8 + 12; // from a cylinder's top to its name's baseline: the cap's depth, 8 clear, the name's height
const storeH = (lines: number) => up4(STORE_TEXT + LINE_STEP * lines + 12);

/**
 * TEXT IS CENTRED BY `text-anchor`, which is how the language centres it: the browser sets the word on the middle, whatever its
 * real width, and the figure check reads the anchor and measures the word from the same middle.
 */
function centred(
  cls: "dl-name" | "dl-detail" | "dl-wlabel",
  txt: string,
  cx: number,
  y: number,
): string {
  return textSvg(cls, Math.round(cx * 100) / 100, y, txt, "middle");
}

/**
 * A DIAMOND IS SIZED TO ITS WORDS, with the tile's padding round them (12 at the sides, 6 above and below the lines). The rectangle inscribed
 * in a diamond of width W and height H holds a text of tw by th when `tw/W + th/H <= 1`; the words take about two thirds of the width and one
 * third of the height, so nothing is left over and no diamond is larger than its text needs.
 */
function decisionSize(b: Box): { w: number; h: number } {
  const lines = b.note ? wrapNote(b.note) : [];
  const tw =
    Math.max(b.label.length * W_LABEL, ...lines.map((l) => l.length * W_NOTE)) +
    PAD_X * 2 +
    (glyphOf(b) ? GLYPH_W : 0);
  const th = 14 + LINE_STEP * lines.length + 12;
  return { w: up4(tw / 0.65), h: up4(th / 0.35) };
}
function mapBoxWidth(b: Box): number {
  const lines = b.note ? wrapNote(b.note) : [];
  const widest = Math.max(
    b.label.length * W_LABEL,
    ...lines.map((l) => l.length * W_NOTE),
  );
  const base = up4(widest + PAD_X * 2 + (glyphOf(b) ? GLYPH_W : 0));
  switch (shapeOf(b)) {
    // A DIAMOND HOLDS ONLY THE RECTANGLE INSCRIBED IN IT. A rectangle centred in a diamond of width
    // W and height H fits exactly when `tw/W + th/H <= 1`, so a flat allowance cannot be right at
    // any size — the wider the text, the more the corners take away. Doubling each side puts both
    // ratios at one half, which leaves the text's own corners inside the edge with its padding to
    // spare. Found by the developer on the Sign-in flowchart, where *The organization judges* sat
    // wider than the diamond at its own height and the note's last line fell outside it entirely
    // (2026-09-22).
    case "decision":
      return decisionSize(b).w;
    case "io":
      return up4(widest + PAD_X * 2 + SKEW * 2);
    case "predefined":
      return base + BARS * 2;
    case "terminator":
      return base + 12;
    case "connector":
      return DOT * 2;
    case "chevron":
      return base + POINT;
    case "pipe":
      return up4(widest + CAP * 2 + PAD_X * 2 + (glyphOf(b) ? GLYPH_W : 0));
    case "bucket":
      return up4(widest + PAD_X * 2 + TAPER * 2);
    default:
      return base;
  }
}
function mapBoxHeight(b: Box): number {
  const lines = b.note ? wrapNote(b.note).length : 0;
  const base = lines ? tileH(lines) : H_ONE;
  switch (shapeOf(b)) {
    // The other half of the inscribed rule above: doubled, so the text's height uses half the
    // diamond and its width the other half.
    case "decision":
      return decisionSize(b).h;
    // The cap sits INSIDE the box's own bounds rather than above them, so the grid's spacing keeps
    // every neighbour clear of it without the layout knowing a cylinder is there.
    case "store":
      return storeH(lines);
    case "terminator":
      return base;
    case "connector":
      return DOT * 2;
    default:
      return base;
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
/** A closed polygon whose every corner is soft, with a radius of r: the language's form for a diamond, a slant, a pot and a point. */
function rpoly(pts: [number, number][], r = 9): string {
  const n = pts.length;
  const f = (v: number) => String(Math.round(v * 10) / 10);
  const segs = pts.map((v, i) => {
    const toward = (a: [number, number]): [number, number] => {
      const dx = a[0] - v[0],
        dy = a[1] - v[1],
        l = Math.hypot(dx, dy),
        k = Math.min(r, l / 2) / l;
      return [v[0] + dx * k, v[1] + dy * k];
    };
    return { a: toward(pts[(i + n - 1) % n]), v, b: toward(pts[(i + 1) % n]) };
  });
  let d = `M${f(segs[0].a[0])} ${f(segs[0].a[1])}`;
  for (const s of segs)
    d += ` L${f(s.a[0])} ${f(s.a[1])} Q${f(s.v[0])} ${f(s.v[1])} ${f(s.b[0])} ${f(s.b[1])}`;
  return d + " Z";
}

function mapRect(
  b: Box,
  x: number,
  y: number,
  w: number,
  h: number,
  topAlign = false,
): string {
  // only the plain forms hang their text from the top; a diamond, a pill, a slant or a cylinder keeps its text where its outline has room
  topAlign =
    topAlign && ["process", "predefined", "window"].includes(shapeOf(b));
  const face = faceOf(b),
    cx = x + w / 2,
    cy = y + h / 2;
  // An absent unit is dashed and has no fill, except where a cap lies over its body: the cap and the body then carry the ground, or the body's
  // top edge would show through the cap.
  const cls =
    b.off && (shapeOf(b) === "store" || shapeOf(b) === "pipe")
      ? "dl-tile-absent"
      : face.cls;
  const body: string[] = [];
  const lines = b.note ? wrapNote(b.note) : [];
  const g = glyphOf(b);
  const natural = lines.length ? tileH(lines.length) : H_ONE;
  // A TILE IN A ROW OR A GRID lays its text from the top padding, so the names of a row share one baseline whatever each tile's own height.
  let textTop = y + 21 + (topAlign ? 0 : Math.max(0, (h - natural) / 2)),
    textMid = topAlign ? y + 21 : cy + 4,
    centre = true,
    tx = x + PAD_X + (g ? GLYPH_W : 0);

  switch (shapeOf(b)) {
    case "terminator":
      body.push(
        `  <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/>`,
      );
      break;
    case "decision":
      body.push(
        `  <path class="${cls}" d="${rpoly(
          [
            [cx, y],
            [x + w, cy],
            [cx, y + h],
            [x, cy],
          ],
          10,
        )}"/>`,
      );
      // THE BLOCK IS CENTRED ON THE DIAMOND'S WAIST, not hung from its top: a diamond is widest at its middle.
      textTop = cy - (LINE_STEP * lines.length) / 2 + 4;
      break;
    case "io":
      body.push(
        `  <path class="${cls}" d="${rpoly(
          [
            [x + SKEW, y],
            [x + w, y],
            [x + w - SKEW, y + h],
            [x, y + h],
          ],
          9,
        )}"/>`,
      );
      break;
    case "predefined":
      body.push(
        `  <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`,
        `  <path class="${face.line}" d="M${x + BARS} ${y + 6} V${y + h - 6}"/>`,
        `  <path class="${face.line}" d="M${x + w - BARS} ${y + 6} V${y + h - 6}"/>`,
      );
      centre = false;
      tx = x + BARS + PAD_X + (g ? GLYPH_W : 0);
      break;
    case "store":
      // Rect from the cap's waist down, cap centred on that waist: a wire lands on the rect, which is a shape the
      // check can measure, and the cap is the picture rather than the claim.
      body.push(
        `  <rect class="${cls}" x="${x}" y="${y + CAP}" width="${w}" height="${h - CAP}" rx="10"/>`,
        `  <ellipse class="${cls}" cx="${cx}" cy="${y + CAP}" rx="${w / 2}" ry="${CAP}"/>`,
      );
      // the text is centred in the body below the cap, its first line 8 clear of the cap's lowest curve
      textTop = y + STORE_TEXT + Math.max(0, (h - storeH(lines.length)) / 2);
      textMid = textTop;
      break;
    case "connector":
      body.push(`  <circle class="dl-step" cx="${cx}" cy="${cy}" r="${DOT}"/>`);
      break;
    case "window":
      // A client: a plain tile, as the language draws every unit. It has no band over its name, which a blank header read as a missing picture.
      body.push(
        `  <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`,
      );
      centre = false;
      break;
    case "chevron":
      body.push(
        `  <path class="${cls}" d="${rpoly(
          [
            [x, y],
            [x + w - POINT, y],
            [x + w, cy],
            [x + w - POINT, y + h],
            [x, y + h],
          ],
          8,
        )}"/>`,
      );
      centre = false;
      break;
    case "pipe":
      // A queue, lying on its side: the cap is at the end work enters, not on top.
      body.push(
        `  <rect class="${cls}" x="${x + CAP}" y="${y}" width="${w - CAP}" height="${h}" rx="10"/>`,
        `  <ellipse class="${cls}" cx="${x + CAP}" cy="${cy}" rx="${CAP}" ry="${h / 2}"/>`,
      );
      centre = false;
      tx = x + CAP * 2 + PAD_X + (g ? GLYPH_W : 0);
      break;
    case "bucket":
      body.push(
        `  <path class="${cls}" d="${rpoly(
          [
            [x, y],
            [x + w, y],
            [x + w - TAPER, y + h],
            [x + TAPER, y + h],
          ],
          8,
        )}"/>`,
      );
      break;
    default:
      body.push(
        `  <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`,
      );
      centre = false;
  }
  if (g && !centre)
    body.push(
      glyphSvg(
        g,
        tx - 18,
        shapeOf(b) === "store" ? y + CAP + (h - CAP) / 2 : cy,
        16,
        b.warn || b.tone ? " dl-glyph-st" : "",
      ),
    );

  const nameAt = lines.length ? textTop : textMid;
  if (shapeOf(b) === "connector")
    body.push(
      `  <text class="dl-step-text" x="${cx}" y="${cy + 3.5}" text-anchor="middle">${esc(b.label)}</text>`,
    );
  else {
    body.push(
      centre
        ? centred("dl-name", b.label, cx, nameAt)
        : textSvg("dl-name", tx, nameAt, b.label),
    );
    lines.forEach((line, i) =>
      body.push(
        centre
          ? centred("dl-detail", line, cx, textTop + LINE_STEP * (i + 1))
          : textSvg("dl-detail", tx, textTop + LINE_STEP * (i + 1), line),
      ),
    );
  }
  return unit(b, body);
}

type Placed = { x: number; y: number; w: number; h: number; row: number };

/**
 * WHERE A CONNECTOR MEETS A SHAPE depends on the shape, which is the price of having shapes at all.
 * A rectangle's top is a flat run offering up to three points; a diamond's top is a single vertex; a
 * parallelogram's top is a flat run shifted by its own lean; a cylinder's top is the waist of its
 * cap. Get this wrong and the arrow lands in white space beside the shape it points at — which the
 * figure check reports as a connector starting nowhere, and which a reader sees immediately.
 */
function acrossPoints(
  b: Box,
  p: Placed,
  side: "top" | "bottom",
  asking: number,
): number[] {
  const cx = p.x + p.w / 2;
  switch (shapeOf(b)) {
    case "decision":
    case "connector":
    case "terminator":
      return [Math.round(cx)];
    case "io":
      return [Math.round(cx + (side === "top" ? SKEW / 2 : -SKEW / 2))];
    case "pipe":
      return [Math.round(p.x + CAP + (p.w - CAP) / 2)];
    default:
      return sidePoints(p.x, p.w, asking);
  }
}
/** A cylinder's top edge is the waist its cap is centred on, because that is where its rect starts. */
const edgeY = (b: Box, p: Placed, side: "top" | "bottom") =>
  side === "bottom" ? p.y + p.h : shapeOf(b) === "store" ? p.y + CAP : p.y;
/** A shape's left and right, measured at its own middle, where a sideways connector meets it. */
function edgeX(b: Box, p: Placed, side: "left" | "right"): number {
  const cx = p.x + p.w / 2;
  switch (shapeOf(b)) {
    case "io":
      return side === "left" ? p.x + SKEW / 2 : p.x + p.w - SKEW / 2;
    case "connector":
      return side === "left" ? cx - DOT : cx + DOT;
    // A bucket narrows towards its foot, so at its own middle it is half a taper in on both sides.
    case "bucket":
      return side === "left" ? p.x + TAPER / 2 : p.x + p.w - TAPER / 2;
    // A pipe is entered at the tip of its cap, which is where work goes in.
    case "pipe":
      return side === "left" ? p.x : p.x + p.w;
    default:
      return side === "left" ? p.x : p.x + p.w;
  }
}
/** A cylinder's middle is the middle of its body, not of the box its cap is reserved in. */
const midY = (b: Box, p: Placed) =>
  shapeOf(b) === "store" ? p.y + CAP + (p.h - CAP) / 2 : p.y + p.h / 2;

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
function drawMap(
  spec: Spec,
  opts: {
    downward?: boolean;
    fixed?: { w: number; h: number; chars: number };
  } = {},
): { svg: string; findings: string[] } {
  const label = opts.downward ? "flowchart" : "map";
  const findings: string[] = [];
  const links = spec.links ?? [];
  // SEVERAL ONE-WAY CHAINS ARE A ROW EACH. Where no box is nested and every box has one wire in and one out at most, with two or more
  // chains, each chain is laid in a row of its own, the tiles narrow enough that a row of five fits the frame, wires straight across.
  const chainMode = (() => {
    const bs = spec.boxes ?? [];
    if (
      opts.downward ||
      !bs.length ||
      bs.some((b) => b.in !== undefined) ||
      !links.length
    )
      return false;
    const inN = new Map<string, number>(),
      outN = new Map<string, number>();
    for (const l of links) {
      outN.set(l.from, (outN.get(l.from) ?? 0) + 1);
      inN.set(l.to, (inN.get(l.to) ?? 0) + 1);
    }
    return (
      bs.every(
        (b) =>
          (inN.get(b.id) ?? 0) <= 1 &&
          (outN.get(b.id) ?? 0) <= 1 &&
          (inN.get(b.id) ?? 0) + (outN.get(b.id) ?? 0) >= 1,
      ) && bs.filter((b) => !(inN.get(b.id) ?? 0)).length >= 2
    );
  })();
  const wrapTile = (b: Box): Box =>
    (!chainMode && !opts.fixed) || !b.note
      ? b
      : {
          ...b,
          note: b.note
            .split("\n")
            .flatMap((part) => {
              const lines: string[] = [];
              let cur = "";
              for (const w of part.split(/\s+/)) {
                if (cur && (cur + " " + w).length > (opts.fixed?.chars ?? 20)) {
                  lines.push(cur);
                  cur = w;
                } else cur = cur ? cur + " " + w : w;
              }
              if (cur) lines.push(cur);
              return lines;
            })
            .join("\n"),
        };
  const all = (spec.boxes ?? []).map(wrapTile);
  if (!all.length)
    return { svg: "", findings: ["a `dg` figure with no boxes"] };

  const byId = new Map(all.map((b) => [b.id, b]));
  for (const l of links)
    for (const end of [l.from, l.to])
      if (!byId.has(end))
        findings.push(`a link names \`${end}\`, and no box has that id`);

  const kids = new Map<string, Box[]>();
  const top: Box[] = [];
  for (const b of all) {
    if (b.in === undefined) {
      top.push(b);
      continue;
    }
    if (!byId.has(b.in)) {
      findings.push(
        `\`${b.id}\` is nested in \`${b.in}\`, and no box has that id`,
      );
      top.push(b);
      continue;
    }
    if (b.in === b.id) {
      findings.push(`\`${b.id}\` is nested in itself`);
      top.push(b);
      continue;
    }
    kids.set(b.in, [...(kids.get(b.in) ?? []), b]);
  }
  if (!top.length) {
    findings.push("every box is nested, so none could be placed");
    return { svg: "", findings };
  }

  // 16 inside a container, the same number a leaf pads its own label by — one padding, not two
  // (05-artifacts.md § The primitives). It was 12, so a nested box read as falling out of its parent.
  // A group is a plate: its label inside it, its baseline 20 from the top and its first row at 32, and 16 of padding round its tiles.
  const HEAD = 32,
    PAD_IN = 16;
  // Tiles in a plate stand 12 apart, and 56 apart where a wire joins two of them.
  const kidGap = (b: Box): number => {
    const ids = new Set((kids.get(b.id) ?? []).map((c) => c.id));
    return links.some((l) => ids.has(l.from) && ids.has(l.to))
      ? GAP_LINKED
      : GAP_Y;
  };
  // A PLATE LAYS ITS TILES IN ROWS, and a row fills the plate's width: one tile spans it, two share it, and so on, with the gap between.
  // Tiles that a wire joins stand one to a row, so the wire runs straight down between them. A row wraps where the plate's room ends.
  type Plan = { rows: Box[][]; w: number; h: number; cols?: Box[][] };
  const plans = new Map<string, Plan>();
  const plan = (b: Box, cap: number): Plan => {
    const hit = plans.get(b.id);
    if (hit) return hit;
    const inner = kids.get(b.id) ?? [];
    let out: Plan;
    if (!inner.length)
      out = {
        rows: [],
        w: opts.fixed ? opts.fixed.w : mapBoxWidth(b),
        h: opts.fixed ? opts.fixed.h : mapBoxHeight(b),
      };
    else {
      const room = cap - PAD_IN * 2,
        gap = kidGap(b);
      const linked = gap === GAP_LINKED;
      const nat = new Map(inner.map((k) => [k.id, plan(k, room)]));
      // A PLATE WHOSE TILES ARE JOINED BY WIRES LAYS THEM IN COLUMNS, the wires running straight across: what feeds stands left, what it feeds
      // is stacked in the next column, and a tile no wire reaches stands in a column of its own at the right. The tiles of a column share the
      // plate's height, and the columns fill its width.
      if (linked && inner.every((k) => !(kids.get(k.id) ?? []).length)) {
        const ids = new Set(inner.map((k) => k.id));
        const inside = links.filter((l) => ids.has(l.from) && ids.has(l.to));
        const d0 = new Map<string, number>(inner.map((k) => [k.id, 0]));
        for (let p = 0; p < inner.length; p++)
          for (const l of inside)
            d0.set(l.to, Math.max(d0.get(l.to)!, d0.get(l.from)! + 1));
        const linkedIds = new Set(inside.flatMap((l) => [l.from, l.to]));
        const depths = [
          ...new Set(
            inner.filter((k) => linkedIds.has(k.id)).map((k) => d0.get(k.id)!),
          ),
        ].sort((m, n) => m - n);
        const cols: Box[][] = depths.map((dv) =>
          inner.filter((k) => linkedIds.has(k.id) && d0.get(k.id) === dv),
        );
        const loose = inner.filter((k) => !linkedIds.has(k.id));
        if (loose.length) cols.push(loose);
        const colW = cols.map((c) =>
          Math.max(...c.map((k) => nat.get(k.id)!.w)),
        );
        const colH = Math.max(
          ...cols.map(
            (c) =>
              c.reduce((s, k) => s + nat.get(k.id)!.h, 0) +
              GAP_Y * (c.length - 1),
          ),
        );
        const gaps = cols.map((_, i) =>
          i === cols.length - 1
            ? 0
            : loose.length && i === cols.length - 2
              ? GAP_PLATES
              : GAP_LINKED,
        );
        const natW =
          colW.reduce((s, v) => s + v, 0) +
          gaps.reduce((s, v) => s + v, 0) +
          PAD_IN * 2;
        const nl2 = b.note ? wrapNote(b.note) : [];
        out = {
          rows: [],
          cols,
          w: up4(Math.max(b.label.length * W_TITLE + PAD_IN * 2, natW, cap)),
          h:
            HEAD +
            colH +
            PAD_IN +
            (nl2.length ? 8 + LINE_STEP * nl2.length : 0),
        };
        plans.set(b.id, out);
        return out;
      }
      const rows: Box[][] = [];
      let cur: Box[] = [],
        used = 0;
      for (const k of inner) {
        const w = nat.get(k.id)!.w;
        // THE TILES OF A ROW ARE DRAWN EQUAL, each as wide as the row's widest, so the row's width is that times its count — measured at
        // the natural widths a row of four tiles overran the plate and the plate its canvas.
        const leaf = (q: Box) => !(kids.get(q.id) ?? []).length;
        const eq =
          cur.length && [...cur, k].every(leaf)
            ? Math.max(...[...cur, k].map((q) => nat.get(q.id)!.w)) *
                (cur.length + 1) +
              GAP_Y * cur.length
            : used + GAP_Y + w;
        if (cur.length && (linked || eq > room)) {
          rows.push(cur);
          cur = [];
          used = 0;
        }
        cur.push(k);
        used += (used ? GAP_Y : 0) + w;
      }
      if (cur.length) rows.push(cur);
      // the tiles of a row are equal, so a row is as wide as its widest tile times its count
      const allTiles = (r: Box[]) =>
        r.every((k) => !(kids.get(k.id) ?? []).length);
      const widest = Math.max(
        ...rows.map(
          (r) =>
            (allTiles(r)
              ? Math.max(...r.map((k) => nat.get(k.id)!.w)) * r.length
              : r.reduce((s, k) => s + nat.get(k.id)!.w, 0)) +
            GAP_Y * (r.length - 1),
        ),
      );
      const rowH = rows.map((r) => Math.max(...r.map((k) => nat.get(k.id)!.h)));
      const nl = b.note ? wrapNote(b.note) : [];
      const noteH = nl.length ? 8 + LINE_STEP * nl.length : 0,
        noteW = Math.max(0, ...nl.map((l) => l.length * W_NOTE)) + PAD_IN * 2;
      out = {
        rows,
        w: up4(
          Math.max(
            b.label.length * W_TITLE + PAD_IN * 2,
            widest + PAD_IN * 2,
            noteW,
          ),
        ),
        h:
          HEAD +
          rowH.reduce((s, h) => s + h, 0) +
          gap * (rows.length - 1) +
          PAD_IN +
          noteH,
      };
    }
    plans.set(b.id, out);
    return out;
  };
  const TOP_CAP = FRAME_W - FRAME_PAD * 2;
  const outerW = (b: Box): number => plan(b, TOP_CAP).w;
  const outerH = (b: Box): number => plan(b, TOP_CAP).h;

  // The row of a top-level box is its depth: one more than the deepest box that points at it. A
  // nested box counts through the group that holds it. A cycle is reported and its back edge ignored.
  const holder = (id: string): string => {
    const b = byId.get(id);
    return b && b.in !== undefined && byId.has(b.in) ? holder(b.in) : id;
  };
  const topIds = top.map((b) => b.id);
  const depth = new Map<string, number>(topIds.map((id) => [id, 0]));
  const edges = links
    .map((l) => [holder(l.from), holder(l.to)] as [string, string])
    .filter(([f, t]) => f !== t && depth.has(f) && depth.has(t));
  for (let pass = 0; pass < topIds.length + 1; pass++) {
    let moved = false;
    for (const [f, t] of edges) {
      const want = depth.get(f)! + 1;
      if (want > depth.get(t)!) {
        depth.set(t, want);
        moved = true;
      }
    }
    if (!moved) break;
    if (pass === topIds.length) {
      findings.push(
        "the links form a cycle, so the rows could not be decided; a map flows one way",
      );
      break;
    }
  }

  // A LINK THAT SKIPS A ROW RUNS DOWN A CORRIDOR BESIDE THE ROWS, so the rows give up that room of the frame when the map has one.
  const skipping = edges.filter(
    ([f, t2]) => (depth.get(t2) ?? 0) > (depth.get(f) ?? 0) + 1,
  ).length;
  const reserve = skipping ? GAP_LINKED + GAP_APART * (skipping - 1) : 0;
  const CANVAS = FRAME_W - reserve,
    margin = FRAME_PAD,
    // A CHAIN'S GAP HOLDS ITS WIRE'S LABEL. Several chains are laid with one gap of 40 between their tiles, and a label wider
    // than 40 less its clear air on each side found no room on its wire, so the placer stood it beside the boxes (041 follow-ups
    // row 8, on spn-support-ts's figures). The gap is the widest label's, with its clear air, and one gap for every row keeps
    // the columns lined up.
    gapX = chainMode
      ? Math.max(40, up4(Math.max(0, ...links.map((l) => (l.label ?? "").length * W_NOTE)) + LABEL_GAP * 2))
      : GAP_LINKED;

  // A ONE-WAY CHAIN IS A STRAIGHT LINE. When every box has at most one link in and one out and the
  // links form a single path through all of them, the figure is a flow, and a flow reads best as a
  // line: horizontal when it fits the canvas, vertical when it does not. Labels sit above a
  // horizontal link, beside a vertical one — never on a box. The developer's rule, 2026-09-21.
  if (!kids.size) {
    const inOf = new Map<string, number>(),
      outOf = new Map<string, number>();
    for (const [f, t] of edges) {
      outOf.set(f, (outOf.get(f) ?? 0) + 1);
      inOf.set(t, (inOf.get(t) ?? 0) + 1);
    }
    const heads = topIds.filter((id) => !(inOf.get(id) ?? 0));
    const simple = topIds.every(
      (id) => (inOf.get(id) ?? 0) <= 1 && (outOf.get(id) ?? 0) <= 1,
    );
    if (
      simple &&
      heads.length === 1 &&
      edges.length === topIds.length - 1 &&
      topIds.length > 1
    ) {
      // A FLOWCHART RUNS DOWN THE PAGE even when it is a straight line and would fit across one.
      // A map of three parts reads fine either way; a path does not, because a reader follows a
      // path downward and a decision's answers have to fall on either side of where it turns.
      const next = new Map(edges);
      const order: string[] = [];
      let cur: string | undefined = heads[0];
      while (cur && order.length <= topIds.length) {
        order.push(cur);
        cur = next.get(cur);
      }
      if (order.length === topIds.length) {
        const boxes = order.map((id) => byId.get(id)!);
        const linkOf = (a: string, b: string) =>
          links.find((l) => holder(l.from) === a && holder(l.to) === b);
        const labelW = (i: number) =>
          (linkOf(order[i], order[i + 1])?.label ?? "").length * W_NOTE;
        const ws0 = boxes.map(mapBoxWidth),
          hs0 = boxes.map(mapBoxHeight);
        // the tiles of a row take the widest tile's width and the tallest's height
        const ws = ws0.map(() => Math.max(...ws0)),
          hs = hs0.map(() => Math.max(...hs0));
        const gaps = boxes
          .slice(0, -1)
          .map((_, i) => Math.max(gapX, labelW(i) + 16));
        const total =
          ws.reduce((s, w) => s + w, 0) + gaps.reduce((s, g) => s + g, 0);
        const out: string[] = [];
        let width = CANVAS,
          height = 0;
        if (total <= CANVAS - margin * 2 && !opts.downward) {
          const h = Math.max(...hs);
          let x = margin + up4((CANVAS - margin * 2 - total) / 2);
          const y = margin;
          // A BOX IS CENTRED ON THE ROW'S MIDDLE, not hung from its top. The connector runs at the
          // tallest box's mid-height, so a shorter box left at the top took its only arrow off its
          // own centre — 7px on a row of one noted box and two plain ones, which is exactly the
          // fault the centring rule refuses. Centring is also what the developer asked for of every
          // figure: elements may be centred, and spacing is what must not vary.
          boxes.forEach((b, i) => {
            const by = y + (h - hs[i]) / 2; // not rounded: a half-pixel here is the arrow off centre
            out.push(mapRect(b, x, by, ws[i], hs[i], true));
            if (i < boxes.length - 1) {
              const l = linkOf(order[i], order[i + 1]);
              const x1 = x + ws[i],
                x2 = x1 + gaps[i],
                cy = y + h / 2;
              out.push(wireSvg(`M${x1} ${cy} H${x2}`, l?.dashed));
              if (l?.label)
                out.push(
                  textSvg(
                    "dl-wlabel",
                    Math.round(x1 + (gaps[i] - labelW(i)) / 2),
                    cy - 8,
                    l.label,
                  ),
                );
              x = x2;
            }
          });
          height = margin + h + margin;
        } else {
          const w = Math.max(...ws);
          const x = margin + up4((CANVAS - margin * 2 - w) / 2);
          let y = margin;
          const GAP_V = 40;
          boxes.forEach((b, i) => {
            out.push(mapRect(b, x, y, w, hs[i], true));
            if (i < boxes.length - 1) {
              const l = linkOf(order[i], order[i + 1]);
              const cx = x + w / 2,
                y1 = y + hs[i],
                y2 = y1 + GAP_V;
              out.push(wireSvg(`M${cx} ${y1} V${y2}`, l?.dashed));
              if (l?.label)
                out.push(
                  textSvg("dl-wlabel", cx + 12, y1 + GAP_V / 2 + 4, l.label),
                );
              y = y2;
            }
          });
          height = y + hs[hs.length - 1] + margin;
        }
        return {
          svg: svgOf(out, spec.title ?? spec.caption ?? label),
          findings,
        };
      }
    }
  }

  const levels = [...new Set([...depth.values()])].sort((a, b) => a - b);
  // Within a row, boxes are ordered by where the boxes they link to sit — a sweep down by sources,
  // then up by targets — so two links in one gap do not cross. Order is what makes a picture read.
  const pos = new Map<string, number>();
  const byLevel = levels.map((lv) => top.filter((b) => depth.get(b.id) === lv));
  byLevel.forEach((row) => row.forEach((b, i) => pos.set(b.id, i)));
  const mean = (ids: string[], fallback: number) =>
    ids.length
      ? ids.reduce((s, id) => s + (pos.get(id) ?? 0), 0) / ids.length
      : fallback;
  const sweep = (down: boolean) => {
    const order = down ? byLevel : [...byLevel].reverse();
    for (const row of order) {
      const key = (b: Box) =>
        mean(
          edges
            .filter(([f, t]) => (down ? t : f) === b.id)
            .map(([f, t]) => (down ? f : t)),
          pos.get(b.id) ?? 0,
        );
      row.sort(
        (a, b) =>
          key(a) - key(b) || (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0),
      );
      row.forEach((b, i) => pos.set(b.id, i));
    }
  };
  sweep(true);
  sweep(false);
  sweep(true);
  const rows: Box[][] = [];
  // SEVERAL ONE-WAY CHAINS ARE A ROW EACH: when every box has one wire in and one out at most and no box is nested, each chain is laid
  // in a row of its own, its wires running straight across, rather than the chains being cut into rows by depth.
  const chains: Box[][] = [];
  if (chainMode) {
    const inN = new Map<string, number>(),
      outN = new Map<string, number>();
    for (const [f, t2] of edges) {
      outN.set(f, (outN.get(f) ?? 0) + 1);
      inN.set(t2, (inN.get(t2) ?? 0) + 1);
    }
    const simple = topIds.every(
      (id) => (inN.get(id) ?? 0) <= 1 && (outN.get(id) ?? 0) <= 1,
    );
    const heads2 = topIds.filter((id) => !(inN.get(id) ?? 0));
    if (simple && heads2.length >= 2) {
      const next2 = new Map(edges);
      for (const h0 of heads2) {
        const ch: Box[] = [];
        let c2: string | undefined = h0;
        while (c2 && ch.length <= topIds.length) {
          ch.push(byId.get(c2)!);
          c2 = next2.get(c2);
        }
        chains.push(ch);
      }
    }
  }
  if (
    chains.length &&
    chains.reduce((s, c) => s + c.length, 0) === topIds.length
  )
    rows.push(...chains);
  else
    for (const lv of levels) {
      const members = byLevel[levels.indexOf(lv)];
      let row: Box[] = [];
      let used = 0;
      for (const b of members) {
        const w = outerW(b);
        if (row.length && used + gapX + w > CANVAS - margin * 2) {
          rows.push(row);
          row = [];
          used = 0;
        }
        row.push(b);
        used += (used ? gapX : 0) + w;
      }
      if (row.length) rows.push(row);
    }

  // EVERY TILE OF A ROW OR A GRID TAKES ONE WIDTH AND ONE HEIGHT: where a figure is all tiles (no group holds any), each tile takes the widest
  // tile's width, or the share of the frame where those do not fit a row, and the tallest tile's height, and a detail wraps only as the width
  // forces it. The figure is laid again at that size, so the rows are equal and the columns line up from row to row.
  if (!opts.fixed && !opts.downward && !kids.size && rows.length) {
    const fitW = Math.min(
      ...rows.map(
        (r) =>
          Math.floor(
            (CANVAS - margin * 2 - gapX * (r.length - 1)) / r.length / 4,
          ) * 4,
      ),
    );
    const uni = Math.max(
      40,
      Math.min(
        Math.max(...top.map(outerW)),
        chainMode ? fitW : Math.max(...top.map(outerW)),
      ),
    );
    const hs2 = top.map((b) => mapBoxHeight(b)),
      same =
        top.every((b) => outerW(b) === uni) && hs2.every((v) => v === hs2[0]);
    if (!same || uni !== Math.max(...top.map(outerW))) {
      // the height is the tallest tile's, once the detail is wrapped to this width
      const chars = Math.max(8, Math.floor((uni - PAD_X * 2) / W_NOTE));
      const rewrapped = top.map((b) =>
        b.note
          ? {
              ...b,
              note: b.note
                .split("\n")
                .flatMap((part) => {
                  const ls: string[] = [];
                  let cur = "";
                  for (const wd of part.split(/\s+/)) {
                    if (cur && (cur + " " + wd).length > chars) {
                      ls.push(cur);
                      cur = wd;
                    } else cur = cur ? cur + " " + wd : wd;
                  }
                  if (cur) ls.push(cur);
                  return ls;
                })
                .join("\n"),
            }
          : b,
      );
      const hmax = Math.max(...rewrapped.map(mapBoxHeight));
      return drawMap(
        {
          ...spec,
          boxes: (spec.boxes ?? []).map(
            (b) => rewrapped.find((r) => r.id === b.id) ?? b,
          ),
        },
        { ...opts, fixed: { w: uni, h: hmax, chars } },
      );
    }
  }

  const out: string[] = [];
  const at = new Map<
    string,
    { x: number; y: number; w: number; h: number; row: number }
  >();
  const tileAt = new Map<string, number>();
  const place = (
    b: Box,
    x: number,
    y: number,
    w: number,
    h: number,
    row: number,
  ) => {
    const inner = kids.get(b.id) ?? [];
    at.set(b.id, { x, y, w, h, row });
    if (!inner.length) {
      tileAt.set(b.id, out.length); // the fan-out pass may stand a tile under a gap, and redraws it here
      out.push(mapRect(b, x, y, w, h, true));
      return;
    }
    out.push(
      `  <rect class="${b.em ? "dl-plate-on" : "dl-plate"}" x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/>`,
    );
    out.push(textSvg("dl-label", x + PAD_IN, y + 20, b.label.toUpperCase()));
    const pl = plans.get(b.id)!,
      innerW = w - PAD_IN * 2,
      gap = kidGap(b);
    // A group's own detail stands under its tiles, at the plate's padding.
    if (b.note)
      wrapNote(b.note).forEach((line, li, all2) =>
        out.push(
          textSvg(
            "dl-detail",
            x + PAD_IN,
            y + h - PAD_IN - LINE_STEP * (all2.length - 1 - li) - 4,
            line,
          ),
        ),
      );
    let cy = y + HEAD;
    if (pl.cols) {
      const cols = pl.cols,
        loose =
          cols.length > 1 &&
          !links.some((l) =>
            cols[cols.length - 1].some((k) => k.id === l.from || k.id === l.to),
          );
      const nat = cols.map((c) =>
        Math.max(...c.map((k) => plans.get(k.id)!.w)),
      );
      const gaps = cols.map((_, i) =>
        i === cols.length - 1
          ? 0
          : loose && i === cols.length - 2
            ? GAP_PLATES
            : GAP_LINKED,
      );
      const extra =
        innerW -
        nat.reduce((s, v) => s + v, 0) -
        gaps.reduce((s, v) => s + v, 0);
      const colH =
        h -
        HEAD -
        PAD_IN -
        (b.note ? 8 + LINE_STEP * wrapNote(b.note).length : 0);
      let cx = x + PAD_IN;
      cols.forEach((c, ci) => {
        const cw =
          ci === cols.length - 1
            ? x + PAD_IN + innerW - cx
            : nat[ci] + up4(extra / cols.length);
        const th = (colH - GAP_Y * (c.length - 1)) / c.length;
        c.forEach((k, ki) => place(k, cx, cy + ki * (th + GAP_Y), cw, th, row));
        cx += cw + gaps[ci];
      });
      return;
    }
    for (const r of pl.rows) {
      const nat = r.map((k) => plans.get(k.id)!.w),
        rh = Math.max(...r.map((k) => plans.get(k.id)!.h));
      const extra =
        innerW - nat.reduce((s, v) => s + v, 0) - GAP_Y * (r.length - 1);
      let cx = x + PAD_IN;
      r.forEach((k, i) => {
        // the tiles of a row are equal; a row that holds a group keeps each its own width
        const tiles = r.every((k) => !(kids.get(k.id) ?? []).length),
          base = tiles ? Math.max(...nat) : nat[i],
          share = tiles
            ? Math.max(0, innerW - base * r.length - GAP_Y * (r.length - 1))
            : extra;
        const kw =
          i === r.length - 1
            ? x + PAD_IN + innerW - cx
            : tiles
              ? Math.max(
                  base,
                  Math.floor((innerW - GAP_Y * (r.length - 1)) / r.length / 2) *
                    2,
                )
              : base + up4(share / r.length);
        place(k, cx, cy, kw, rh, row);
        cx += kw + GAP_Y;
      });
      cy += rh + gap;
    }
  };

  // EVERY horizontal run through a gap takes a lane of its own, so no two connectors travel side by
  // side and each label has a line to itself. A link to the next row crosses one gap and takes one
  // lane; a link that skips rows travels through two and takes a lane in each. Both are counted,
  // because a gap is as tall as everything crossing it, and lanes are a whole gap apart so the two
  // kinds cannot be placed by different arithmetic and land on each other.
  const rowOf = new Map<string, number>();
  rows.forEach((row, i) => {
    for (const b of row) rowOf.set(b.id, i);
  });
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
  const exitLane = new Map<Link, Lane>(),
    entryLane = new Map<Link, Lane>();
  const lanesIn: number[] = rows.map(() => 0);
  const takeLane = (gap: number): Lane => ({ gap, index: lanesIn[gap]++ });

  // How many connectors use each edge of each box, which is what decides how many points that edge
  // offers. Counted from the routes actually taken rather than from the rows alone: a link that skips
  // rows leaves by the side when it can and by the bottom when it cannot, and a box whose only arrow
  // leaves by the side must not have its bottom counted, or the one arrow on the bottom of the box
  // below it stops landing in the middle.
  const leaveBottom = new Map<string, number>(),
    enterTop = new Map<string, number>();
  const leaveTop = new Map<string, number>(),
    enterBottom = new Map<string, number>();
  const bump = (m: Map<string, number>, id: string) =>
    m.set(id, (m.get(id) ?? 0) + 1);

  for (const l of links) {
    const ra = rowOfAny(l.from),
      rb = rowOfAny(l.to);
    if (ra < 0 || rb < 0 || ra === rb) continue;
    if (rb === ra + 1) {
      // neighbours: one lane, bottom to top
      const lane = takeLane(ra);
      exitLane.set(l, lane);
      entryLane.set(l, lane);
      bump(leaveBottom, l.from);
      bump(enterTop, l.to);
    } else if (rb > ra + 1) {
      // skips down the right-hand corridor
      if (!bySide(l.from)) {
        exitLane.set(l, takeLane(ra));
        bump(leaveBottom, l.from);
      }
      if (!bySide(l.to)) {
        entryLane.set(l, takeLane(rb - 1));
        bump(enterTop, l.to);
      }
    } else {
      // upward, and reported below
      if (!bySide(l.from)) {
        exitLane.set(l, takeLane(ra - 1));
        bump(leaveTop, l.from);
      }
      if (!bySide(l.to)) {
        entryLane.set(l, takeLane(rb));
        bump(enterBottom, l.to);
      }
    }
  }
  // A lane is not a line, it is a line plus the label riding above it plus the clear air the
  // contract owes on both sides. Deriving the pitch from LABEL_GAP is what stops a label touching
  // the arrow above it: whatever room a label needs, the next lane starts past it by construction.
  // One lane therefore makes a gap of exactly GAP_LINKED, which is the connected minimum.
  const LANE_H = LABEL_H + LABEL_GAP * 2,
    LANE_TOP = LANE_H;
  const gapAfter = (i: number) =>
    Math.max(GAP_LINKED, LANE_TOP + LANE_H * lanesIn[i]);

  const laneY = (gap: number, lane: number) =>
    rowBottom[gap] + LANE_TOP + LANE_H * lane;

  const rowTop: number[] = [],
    rowBottom: number[] = [];
  let y = margin;
  rows.forEach((row, i) => {
    const rh = Math.max(...row.map(outerH));
    const rw = row.reduce((s, b) => s + outerW(b), 0) + gapX * (row.length - 1);
    let x = margin + up4((CANVAS - margin * 2 - rw) / 2); // rows are centred, on the 4 grid
    // A WIRE RUNS STRAIGHT BETWEEN CENTRES THAT LINE UP, WITH NO JOG; where two units do not line up, a unit moves and the wire does not
    // bend (the language's "Alignment"). So a row stands under its parents: the box that is the one child of a box in the row above, or
    // the middle one of an odd number of them, is put on its parent's centre, and its row moves with it, rigidly, where the frame allows.
    if (i > 0) {
      const parentOf = (b: Box): string | null => {
        const ps = new Set(
          links
            .filter(
              (l) =>
                holder(l.to) === b.id && rowOf.get(holder(l.from)) === i - 1,
            )
            .map((l) => holder(l.from)),
        );
        return ps.size === 1 ? [...ps][0] : null;
      };
      const kidsOf = new Map<string, Box[]>();
      for (const b of row) {
        const p = parentOf(b);
        if (p) kidsOf.set(p, [...(kidsOf.get(p) ?? []), b]);
      }
      let before = x;
      for (const b of row) {
        const p = parentOf(b),
          pa = p ? at.get(p) : undefined;
        const sibs = p ? kidsOf.get(p)! : [];
        if (pa && sibs.length % 2 === 1 && sibs[(sibs.length - 1) / 2] === b) {
          const want = pa.x + pa.w / 2 - outerW(b) / 2,
            shift = want - before;
          if (x + shift >= margin && x + shift + rw <= CANVAS - margin)
            x += shift;
          break;
        }
        before += outerW(b) + gapX;
      }
    }
    rowTop.push(y);
    rowBottom.push(y + rh);
    for (const b of row) {
      const w = outerW(b);
      place(
        b,
        x,
        chainMode && !opts.fixed ? y + (rh - outerH(b)) / 2 : y,
        w,
        outerH(b),
        i,
      );
      x += w + gapX;
    }
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
    const ra = rowOfAny(l.from),
      rb = rowOfAny(l.to);
    return ra >= 0 && rb >= 0 && (rb < ra || rb > ra + 1);
  });
  const sideLane = (l: Link) =>
    rightMost + GAP_LINKED + Math.max(0, skippers.indexOf(l)) * GAP_APART;
  const width =
    Math.max(
      rightMost,
      skippers.length ? sideLane(skippers[skippers.length - 1]) : 0,
    ) + margin;
  const height = y + margin;

  // WHERE A CONNECTOR MEETS A BOX, decided once so the lane search and the drawing cannot disagree.
  const exitX = (l: Link) => {
    const a = at.get(l.from)!,
      b = at.get(l.to)!;
    const up = b.row < a.row;
    const n = (up ? leaveTop : leaveBottom).get(l.from) ?? 0;
    const towards = b.row === a.row + 1 ? b.x + b.w / 2 : sideLane(l);
    return alignedTo(
      acrossPoints(byId.get(l.from)!, a, up ? "top" : "bottom", n),
      towards,
    );
  };
  const entryX = (l: Link) => {
    const a = at.get(l.from)!,
      b = at.get(l.to)!;
    const up = b.row < a.row;
    const n = (up ? enterBottom : enterTop).get(l.to) ?? 0;
    const towards = b.row === a.row + 1 ? a.x + a.w / 2 : sideLane(l);
    return alignedTo(
      acrossPoints(byId.get(l.to)!, b, up ? "bottom" : "top", n),
      towards,
    );
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
    const a = at.get(l.from),
      b = at.get(l.to);
    if (!a || !b || a.row === b.row) continue;
    const down = b.row > a.row;
    const el = exitLane.get(l),
      en = entryLane.get(l);
    const ba = byId.get(l.from)!,
      bb = byId.get(l.to)!;
    if (el)
      drops.push({
        link: l,
        lane: el,
        x: exitX(l),
        edge: edgeY(ba, a, down ? "bottom" : "top"),
      });
    if (en)
      drops.push({
        link: l,
        lane: en,
        x: entryX(l),
        edge: edgeY(bb, b, down ? "top" : "bottom"),
      });
  }

  // The figure check's own rule, applied to a candidate order rather than to a drawing.
  const clashes = (ds: Drop[], yOf: (lane: Lane) => number): number => {
    const segs = ds.map((d) => {
      const ly = yOf(d.lane);
      return {
        k: d.link,
        x: d.x,
        y1: Math.min(d.edge, ly),
        y2: Math.max(d.edge, ly),
      };
    });
    let n = 0;
    for (let i = 0; i < segs.length; i++)
      for (let j = i + 1; j < segs.length; j++) {
        if (segs[i].k === segs[j].k) continue;
        const apart = Math.abs(segs[i].x - segs[j].x);
        if (apart < 0.5 || apart >= GAP_APART) continue; // collinear reads as one line continuing
        if (
          Math.min(segs[i].y2, segs[j].y2) - Math.max(segs[i].y1, segs[j].y1) >
          LABEL_GAP
        )
          n += 1;
      }
    return n;
  };
  const orders = <T>(xs: T[]): T[][] =>
    xs.length <= 1
      ? [xs]
      : xs.flatMap((x, i) =>
          orders([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r]),
        );

  for (let g = 0; g < rows.length; g++) {
    const ds = drops.filter((d) => d.lane.gap === g);
    const lanes = [...new Set(ds.map((d) => d.lane))];
    if (lanes.length < 2) continue;
    const yFor = (order: Lane[]) => {
      const m = new Map(
        order.map((ln, i) => [ln, rowBottom[g] + LANE_TOP + LANE_H * i]),
      );
      return (ln: Lane) => m.get(ln)!;
    };
    let best = lanes,
      score = clashes(ds, yFor(lanes));
    // Six lanes in one gap is 720 orders and the search is exhaustive; beyond that it is greedy —
    // each place in turn takes whichever lane adds fewest clashes to what is already settled.
    if (score) {
      if (lanes.length <= 6) {
        for (const order of orders(lanes)) {
          const s2 = clashes(ds, yFor(order));
          if (s2 < score) {
            best = order;
            score = s2;
            if (!score) break;
          }
        }
      } else {
        const rest = [...lanes],
          picked: Lane[] = [];
        while (rest.length) {
          let at2 = 0,
            low = Infinity;
          for (let i = 0; i < rest.length; i++) {
            const trial = [...picked, rest[i]];
            const s2 = clashes(
              ds.filter((d) => trial.includes(d.lane)),
              yFor([...trial, ...rest.filter((r) => r !== rest[i])]),
            );
            if (s2 < low) {
              low = s2;
              at2 = i;
            }
          }
          picked.push(...rest.splice(at2, 1));
        }
        if (clashes(ds, yFor(picked)) < score) best = picked;
      }
    }
    best.forEach((ln, i) => {
      ln.index = i;
    });
  }

  // Labels live in the gaps between rows. Two labels in one gap are stacked so neither overprints.
  const taken: { gap: number; x1: number; x2: number; y: number }[] = [];
  const labelAt = (
    gap: number,
    cx: number,
    w: number,
    baseY: number,
  ): { x: number; y: number } => {
    let x = Math.min(Math.max(cx - w / 2, margin), width - margin - w);
    let ly = baseY;
    for (let tries = 0; tries < 4; tries++) {
      const hit = taken.find(
        (t) =>
          t.gap === gap &&
          Math.abs(t.y - ly) < LABEL_H + LABEL_GAP &&
          t.x1 < x + w &&
          x < t.x2,
      );
      if (!hit) break;
      ly += LABEL_H + LABEL_GAP;
    }
    taken.push({ gap, x1: x, x2: x + w, y: ly });
    return { x, y: ly };
  };

  const verticals: Vert[] = [];
  const horizontals: Blocker[] = [];
  const pending: Pending[] = [];
  const mRoutes: {
    d: string;
    from: string;
    to: string;
    dashed?: boolean;
    pathId: number;
    on: boolean;
  }[] = [];

  for (const [pathId, l] of links.entries()) {
    const a = at.get(l.from),
      b = at.get(l.to);
    if (!a || !b) continue;
    let d: string;
    let label: { x: number; y: number } | null = null;
    const w = (l.label ?? "").length * W_NOTE;
    if (a.row === b.row && a.x < b.x + b.w && b.x < a.x + a.w) {
      // STACKED, inside one group: the wire runs down between the two, straight where nothing stands between them, and down the group's
      // padding (8 in from its edge) where a tile does.
      const upper = a.y < b.y ? a : b,
        lower = upper === a ? b : a;
      const between = [...at.values()].some(
        (q) =>
          q !== a &&
          q !== b &&
          q.x < upper.x + upper.w &&
          upper.x < q.x + q.w &&
          q.y >= upper.y + upper.h - 1 &&
          q.y + q.h <= lower.y + 1,
      );
      const cx = Math.round(Math.max(a.x, b.x) + Math.min(a.w, b.w) / 2);
      const down = upper === a;
      if (!between) {
        d = down
          ? `M${cx} ${upper.y + upper.h} V${lower.y}`
          : `M${cx} ${lower.y} V${upper.y + upper.h}`;
        if (l.label)
          label = {
            x: cx + 8,
            y: Math.round((upper.y + upper.h + lower.y) / 2 + 4),
          };
      } else {
        const sx = Math.max(a.x + a.w, b.x + b.w) + 8,
          ya = a.y + a.h / 2,
          yb = b.y + b.h / 2;
        d = `M${a.x + a.w} ${ya} H${sx} V${yb} H${b.x + b.w}`;
        if (l.label)
          label = {
            x: sx - w - 8,
            y: Math.round(Math.min(ya, yb) + Math.abs(ya - yb) / 2 + 4),
          };
      }
    } else if (a.row === b.row) {
      // Side by side: out of one vertical edge, into the other, the label above both.
      const rightward = a.x < b.x;
      const ba = byId.get(l.from)!,
        bb = byId.get(l.to)!;
      const x1 = edgeX(ba, a, rightward ? "right" : "left"),
        x2 = edgeX(bb, b, rightward ? "left" : "right");
      let y1 = midY(ba, a),
        y2 = midY(bb, b);
      // A WIRE BETWEEN TWO TILES BESIDE EACH OTHER RUNS STRAIGHT where their sides share a height: it meets the middle of the facing edge of the one
      // and lands at the same height on the other.
      if (y2 > a.y + 12 && y2 < a.y + a.h - 12) y1 = y2;
      else if (y1 > b.y + 12 && y1 < b.y + b.h - 12) y2 = y1;
      const mid = (x1 + x2) / 2;
      d =
        y1 === y2
          ? `M${x1} ${y1} H${x2}`
          : `M${x1} ${y1} H${mid} V${y2} H${x2}`;
      if (l.label)
        label =
          y1 === y2
            ? { x: Math.round(mid - w / 2), y: y1 - LABEL_GAP }
            : labelAt(-1 - a.row, mid, w, Math.min(a.y, b.y) - LABEL_GAP);
    } else if (b.row === a.row + 1) {
      // The next row down: out of the bottom, along this link's own lane in the gap, into the top.
      const x1 = exitX(l),
        x2 = entryX(l);
      const y1 = edgeY(byId.get(l.from)!, a, "bottom"),
        y2 = edgeY(byId.get(l.to)!, b, "top");
      const lane = exitLane.get(l);
      const mid = laneY(a.row, lane ? lane.index : 0);
      const straight = Math.abs(x1 - x2) < 1;
      d = straight
        ? `M${x1} ${y1} V${y2}`
        : `M${x1} ${y1} V${mid} H${x2} V${y2}`;
      if (l.label) {
        // Above this link's own horizontal run, or beside the vertical run when the link is straight.
        // Either way the text is in the gap and its span never contains a vertical segment.
        const lo = Math.min(x1, x2),
          hi = Math.max(x1, x2);
        const cx = straight ? x1 + 8 + w / 2 : (lo + hi) / 2;
        label = {
          x: Math.min(Math.max(cx - w / 2, margin), width - margin - w),
          y: straight ? mid + LABEL_GAP : mid - LABEL_GAP,
        };
        if (!straight && w > hi - lo - 8) {
          // a label longer than its run sits clear of both verticals
          label.x = Math.min(Math.max(hi + 6, margin), width - margin - w);
          if (label.x + w > width - margin)
            label.x = Math.max(lo - w - 6, margin);
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
      const ba = byId.get(l.from)!,
        bb = byId.get(l.to)!;
      if (bySide(l.from)) {
        runY = midY(ba, a);
        runFrom = edgeX(ba, a, "right");
        parts.push(`M${runFrom} ${runY}`);
      } else {
        const el = exitLane.get(l)!;
        runY = laneY(el.gap, el.index);
        runFrom = exitX(l);
        parts.push(`M${runFrom} ${edgeY(ba, a, "bottom")}`, `V${runY}`);
      }
      parts.push(`H${sideX}`);
      if (bySide(l.to))
        parts.push(`V${midY(bb, b)}`, `H${edgeX(bb, b, "right")}`);
      else {
        const en = entryLane.get(l)!;
        parts.push(
          `V${laneY(en.gap, en.index)}`,
          `H${entryX(l)}`,
          `V${edgeY(bb, b, "top")}`,
        );
      }
      d = parts.join(" ");
      if (l.label)
        label = labelAt(a.row, (runFrom + sideX) / 2, w, runY - LABEL_GAP);
    } else {
      // Upward: out of the top, along the gap above to the lane, up to the gap below the target, in
      // from the bottom. Drawn, and reported, because a map is meant to flow one way.
      findings.push(
        `the link \`${l.from}\` → \`${l.to}\` runs upward; a map flows one way, so a link points at a box below its source`,
      );
      const sideX = sideLane(l);
      const parts: string[] = [];
      let runY: number, runFrom: number;
      const ba = byId.get(l.from)!,
        bb = byId.get(l.to)!;
      if (bySide(l.from)) {
        runY = midY(ba, a);
        runFrom = edgeX(ba, a, "right");
        parts.push(`M${runFrom} ${runY}`);
      } else {
        const el = exitLane.get(l)!;
        runY = laneY(el.gap, el.index);
        runFrom = exitX(l);
        parts.push(`M${runFrom} ${edgeY(ba, a, "top")}`, `V${runY}`);
      }
      parts.push(`H${sideX}`);
      if (bySide(l.to))
        parts.push(`V${midY(bb, b)}`, `H${edgeX(bb, b, "right")}`);
      else {
        const en = entryLane.get(l)!;
        parts.push(
          `V${laneY(en.gap, en.index)}`,
          `H${entryX(l)}`,
          `V${edgeY(bb, b, "bottom")}`,
        );
      }
      d = parts.join(" ");
      if (l.label)
        label = labelAt(a.row - 1, (runFrom + sideX) / 2, w, runY - LABEL_GAP);
    }
    mRoutes.push({
      d,
      from: l.from,
      to: l.to,
      dashed: l.dashed,
      pathId,
      on: !!byId.get(l.to)?.em,
    });
    if (label && l.label)
      pending.push({ ...label, w, txt: l.label, path: pathId });
  }
  // wires that meet one tile join one bus
  const mJoined = busWires(
    mRoutes,
    (id, side) => {
      const b = byId.get(id),
        p = at.get(id);
      if (!b || !p) return null;
      return side === "left" || side === "right"
        ? edgeX(b, p, side)
        : edgeY(b, p, side);
    },
    (id, side) => {
      const b = byId.get(id),
        p = at.get(id);
      if (!b || !p) return null;
      return side === "left" || side === "right"
        ? Math.round(midY(b, p))
        : acrossPoints(b, p, side, 1)[0];
    },
  );
  // A FAN-OUT ROUTES ON ONE SHARED LINE. One box whose links all run down to two or more boxes
  // drew each link as a route of its own: a staircase where a lane was taken, a run round the right
  // edge for a box a row further down, and each label at whatever height its route left room for
  // (the developer, 2026-11-20, of the design language's four apps: "I have talked about this issue
  // before"). Now the parent's line runs down to one line at one height, each child's wire leaves it
  // with one bend and drops straight to the middle of the child's top, and every sibling's label
  // stands on its own drop at the same height. A child a row further down stands under the nearest
  // gap of the rows between, so its drop passes through it; a child with links of its own stays where
  // it is, and so does its group, as drawn before.
  {
    const groups = new Map<string, number[]>();
    mRoutes.forEach((r, i) => {
      if (r.dashed) return;
      groups.set(r.from, [...(groups.get(r.from) ?? []), i]);
    });
    for (const [from, idx] of groups) {
      if (idx.length < 2) continue;
      const pb = byId.get(from),
        p = at.get(from);
      if (!pb || !p || (kids.get(from) ?? []).length) continue;
      const kidsOf = idx.map((i) => ({ i, id: mRoutes[i].to, t: at.get(mRoutes[i].to)! }));
      if (kidsOf.some((k) => !k.t || k.t.row <= p.row || (kids.get(k.id) ?? []).length)) continue;
      const top = p.y + p.h,
        firstTop = Math.min(...kidsOf.map((k) => k.t.y));
      const busY = up4(top + (firstTop - top) / 4);
      if (firstTop - busY < LABEL_H + LABEL_GAP * 3) continue;
      const trunk = Math.round(p.x + p.w / 2);
      // a deeper child stands under the gap nearest its middle, where its drop meets no box; one that cannot move (it
      // has links of its own, or no gap fits it) keeps the route it was given, and its siblings still share the line
      const keep = new Set<number>();
      for (const k of kidsOf) {
        const cx = k.t.x + k.t.w / 2;
        const between = [...at.entries()].filter(
          ([id, q]) => id !== k.id && id !== from && q.y < k.t.y && q.y + q.h > busY,
        );
        const blocks = (x: number) => between.some(([, q]) => x > q.x - 24 && x < q.x + q.w + 24);
        if (!blocks(cx)) continue;
        const own = links.some((l) => (l.from === k.id || l.to === k.id) && l.from !== from);
        const xs = between.map(([, q]) => q).sort((a, b) => a.x - b.x);
        const gaps: number[] = [];
        for (let g = 0; g + 1 < xs.length; g++)
          if (xs[g + 1].x - (xs[g].x + xs[g].w) >= 48) gaps.push((xs[g].x + xs[g].w + xs[g + 1].x) / 2);
        const fits = (c: number) =>
          c - k.t.w / 2 >= margin &&
          c + k.t.w / 2 <= width - margin &&
          ![...at.entries()].some(([id, q]) => id !== k.id && q.row === k.t.row && q.x < c + k.t.w / 2 + 24 && q.x + q.w > c - k.t.w / 2 - 24);
        // the nearest gap; of two as near, the right one, where a drop crosses no label set right of its own
        const c = gaps.filter(fits).sort((a, b) => Math.abs(a - cx) - Math.abs(b - cx) || b - a)[0];
        if (own || c === undefined || !tileAt.has(k.id)) {
          keep.add(k.i);
          continue;
        }
        const nx = Math.round(c - k.t.w / 2);
        k.t = { ...k.t, x: nx };
        at.set(k.id, k.t);
        out[tileAt.get(k.id)!] = mapRect(byId.get(k.id)!, nx, k.t.y, k.t.w, k.t.h, true);
      }
      if (kidsOf.length - keep.size < 2) continue;
      const labelY = Math.round((busY + firstTop) / 2 + LABEL_H / 2);
      for (const k of kidsOf.filter((q) => !keep.has(q.i))) {
        const x = Math.round(k.t.x + k.t.w / 2),
          y = k.t.y;
        // straight runs only: the wire's own drawing softens each corner
        mJoined[k.i] =
          x === trunk
            ? `M${trunk} ${top} L${trunk} ${y}`
            : `M${trunk} ${top} L${trunk} ${busY} L${x} ${busY} L${x} ${y}`;
        const lab = pending.find((q) => q.path === mRoutes[k.i].pathId);
        if (lab) {
          lab.y = labelY;
          lab.x = x + LABEL_GAP;
        }
      }
    }
  }
  mRoutes.forEach((r, i) => {
    r.d = mJoined[i];
    horizontals.push(...horzOf(r.d, r.pathId));
    verticals.push(...vertsOf(r.d, r.pathId));
  });
  for (const r of mRoutes.filter((x) => !x.on))
    out.push(wireSvg(r.d, r.dashed));
  for (const r of mRoutes.filter((x) => x.on))
    out.push(wireSvg(r.d, r.dashed, "", true));

  // THE BOXES GO IN. `placeLabels` has known since it was written that a box blocks as surely as a
  // connector, and this call site never passed them — so a map's labels were slid clear of every
  // line and dropped 2px from a box, which is the one fault the placer's own comment describes.
  // Three call sites, one of them passing the argument: the lesson was learned in `entities` and
  // never carried across.
  out.push(
    ...placeLabels(pending, verticals, margin, width, [
      ...at.values(),
      ...horizontals,
    ]),
  );

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
function drawSystem(
  spec: Spec,
  hint?: { rail: number },
  busAtLine = SYS_BUS_AT,
  SYS_NOTE = 16,
): { svg: string; findings: string[]; rail?: number } {
  const findings: string[] = [];
  const layers = spec.layers ?? [];
  const outside = spec.outside ?? [];
  const links = spec.links ?? [];
  if (!layers.length)
    return {
      svg: "",
      findings: [
        "a `system` figure with no layers; a system is layers inside one boundary",
      ],
    };

  const inner = layers.flatMap((l) => l.boxes);
  const byId = new Map<string, Box>(
    [...inner, ...outside].map((b) => [b.id, b]),
  );
  const isOut = new Set(outside.map((b) => b.id));
  const isIn = new Set(inner.map((b) => b.id));
  for (const l of links)
    for (const end of [l.from, l.to])
      if (!byId.has(end))
        findings.push(`an edge names \`${end}\`, and no box has that id`);
  // RULE 3 — an edge is a call or a flow of data and it carries what flows.
  for (const l of links)
    if (!l.label && (isOut.has(l.from) || isOut.has(l.to)))
      findings.push(
        `the edge \`${l.from}\` → \`${l.to}\` crosses the boundary with nothing on it; an edge carries what flows`,
      );

  // What points in sits left, what is reached sits right; a thing that does both sits left.
  const reaches = new Set(
    links.filter((l) => !isOut.has(l.from) && isOut.has(l.to)).map((l) => l.to),
  );
  const feeds = new Set(
    links.filter((l) => isOut.has(l.from)).map((l) => l.from),
  );
  const left = outside.filter((b) => feeds.has(b.id));
  const right = outside.filter((b) => !feeds.has(b.id) && reaches.has(b.id));
  const isLeft = new Set(left.map((b) => b.id));
  for (const b of outside)
    if (!feeds.has(b.id) && !reaches.has(b.id))
      findings.push(
        `\`${b.id}\` sits outside the boundary with no edge to it; anything drawn outside is something the system talks to`,
      );

  // A thing outside is as narrow as its words: its detail wraps at 16 characters.
  const wrapAt = (note: string, chars = SYS_NOTE) =>
    note
      .split("\n")
      .flatMap((part) => {
        const lines: string[] = [];
        let cur = "";
        for (const w of part.split(/\s+/)) {
          if (cur && (cur + " " + w).length > chars) {
            lines.push(cur);
            cur = w;
          } else cur = cur ? cur + " " + w : w;
        }
        if (cur) lines.push(cur);
        return lines;
      })
      .join("\n");
  const shapedCache = new Map<string, Box>();
  const shaped = (b: Box & { as?: Resource }): Box => {
    const hit = shapedCache.get(b.id);
    if (hit) return hit;
    const base: Box = b.shape
      ? b
      : {
          ...b,
          shape: RESOURCE[b.as ?? "service"].shape,
          off: b.off ?? RESOURCE[b.as ?? "service"].soft,
        };
    const out = base.note
      ? { ...base, note: wrapAt(base.note, isOut.has(b.id) ? SYS_NOTE : 22) }
      : base;
    shapedCache.set(b.id, out);
    return out;
  };
  const boxOf = (id: string) => shaped(byId.get(id) as Box & { as?: Resource });

  const margin = FRAME_PAD,
    HEAD_MOD = 32,
    HEAD_LAYER = 32,
    PAD_IN = 16;
  const innerW = Math.max(160, ...inner.map((b) => mapBoxWidth(shaped(b))));
  const layerW = innerW + PAD_IN * 2,
    modW = layerW + PAD_IN * 2;
  const labelW = (l: Link) => (l.label ?? "").length * W_NOTE;

  // ---- which way each link runs
  type K = "fwd" | "instead" | "back" | "other";
  const outOf = (id: string) => links.filter((l) => l.from === id);
  const kindOf = new Map<Link, K>();
  for (const l of links) {
    if (isLeft.has(l.from) && isIn.has(l.to)) {
      const sibling = outOf(l.from).some((m) => isOut.has(m.to));
      kindOf.set(l, sibling ? "instead" : "fwd");
    } else if (isIn.has(l.from) && isLeft.has(l.to)) kindOf.set(l, "back");
    else if (isOut.has(l.from) || isOut.has(l.to)) kindOf.set(l, "fwd");
    else kindOf.set(l, "other");
  }
  const primaryOf = (id: string) =>
    outOf(id).filter((l) => kindOf.get(l) === "fwd");

  // ---- columns of the left side, by how far each box is from the boundary
  const depthOf = new Map<string, number>(left.map((b) => [b.id, 0]));
  for (let pass = 0; pass < left.length; pass++)
    for (const l of links)
      if (depthOf.has(l.from) && depthOf.has(l.to))
        depthOf.set(
          l.to,
          Math.max(depthOf.get(l.to)!, depthOf.get(l.from)! + 1),
        );
  const leftCols: (Box & { as?: Resource })[][] = [];
  for (const b of left) (leftCols[depthOf.get(b.id) ?? 0] ??= []).push(b);
  const leftW = leftCols.map((c) =>
    Math.max(...c.map((b) => mapBoxWidth(shaped(b)))),
  );
  // The corridors the sides take: one for each link that goes round (inward from a thing with its own chain, and back).
  const pool = links.filter(
    (l) => kindOf.get(l) === "instead" || kindOf.get(l) === "back",
  );
  const outward = links.filter(
    (l) => !isOut.has(l.from) && isOut.has(l.to) && !isLeft.has(l.to),
  );
  const leftGap = leftCols.map((col, i) => {
    const said = links
      .filter((l) => col.some((b) => b.id === l.from) && isOut.has(l.to))
      .map(labelW);
    const last = i === leftCols.length - 1;
    const said2 = last
      ? links
          .filter(
            (l) => col.some((b) => b.id === l.from) && kindOf.get(l) === "fwd",
          )
          .map(labelW)
      : [];
    const v = up4(
      Math.max(
        40,
        Math.max(0, ...said, ...said2) + 16,
        last ? 16 * pool.length + 24 : 0,
      ),
    );
    if (process.env.DBG) console.error("gap", i, said, said2, v);
    return v;
  });
  const leftSpan = leftW.reduce((t, w, i) => t + w + leftGap[i], 0);
  const rightW = right.length
    ? Math.max(...right.map((b) => mapBoxWidth(shaped(b))))
    : 0;

  // The right rail: a corridor for each outward link and room, past the last, for the label that rides the run into the box.
  // (the bus of wires that meet one tile takes SYS_BUS_AT of that last run, so the label is given that much more)
  // a wire joins a bus where it meets one tile with another wire from a different tile, or leaves one tile with another to a different tile
  const busAt = (l: Link) =>
    !l.dashed &&
    (new Set(links.filter((m) => m.to === l.to && !m.dashed).map((m) => m.from))
      .size > 1 ||
      new Set(
        links.filter((m) => m.from === l.from && !m.dashed).map((m) => m.to),
      ).size > 1)
      ? busAtLine
      : 0;
  const railMin = (i: number, l: Link) =>
    RAIL_LANE + 16 * i + labelW(l) + 16 + busAt(l);
  const railNeed = (order: Link[]) =>
    up4(Math.max(40, ...order.map((l, i) => railMin(i, l))));
  const railW = right.length
    ? (hint?.rail ??
      railNeed(
        [...outward].sort(
          (m, n) => labelW(n) + busAt(n) - labelW(m) - busAt(m),
        ),
      ))
    : 0;
  const wholeW = leftSpan + modW + railW + rightW;
  const ox = Math.max(margin, up4((FRAME_W - wholeW) / 2));
  const modX = ox + leftSpan;
  const rightX = modX + modW + railW;

  // ---- the module
  type P = { x: number; y: number; w: number; h: number };
  const at = new Map<string, P>();
  const layerAt: { y: number; h: number }[] = [];
  let y = margin + HEAD_MOD;
  // The boxes a thing outside leads into are spaced so that each of those things stands level with its box, and, where a thing also
  // goes round, so that a band for its wire fits between two rows.
  // A side that holds several wires is tall enough for each to have its own seat 28 apart: a label above one wire owes 8 to the next.
  const needFor = (n: number) => (n <= 1 ? 0 : n === 2 ? 56 : 112);
  const sidesOf = (id: string) =>
    Math.max(
      links.filter((l) => l.to === id && kindOf.get(l) !== "back").length,
      links.filter(
        (l) =>
          l.from === id &&
          (kindOf.get(l) === "fwd" || kindOf.get(l) === "other"),
      ).length,
      links.filter((l) => l.from === id && kindOf.get(l) === "back").length,
    );
  const hOf = (b: Box) => {
    const base = mapBoxHeight(shaped(b));
    return Math.max(
      base,
      needFor(sidesOf(b.id)) +
        (shapeOf(shaped(b)) === "store" ? CAP : 0) +
        (needFor(sidesOf(b.id)) ? 8 : 0),
    );
  };
  const tallest = Math.max(0, ...left.map((b) => hOf(b)));
  const gapRows = tallest + (pool.length ? 56 : 24);
  for (const layer of layers) {
    const hs = layer.boxes.map(hOf);
    const led = layer.boxes.some((b) =>
      links.some((l) => l.to === b.id && isLeft.has(l.from)),
    );
    const gaps = hs
      .slice(1)
      .map((h, i) =>
        led ? Math.max(GAP_Y, gapRows - (hs[i] + h) / 2) : GAP_Y,
      );
    const lh =
      HEAD_LAYER +
      hs.reduce((t, h) => t + h, 0) +
      gaps.reduce((t, g) => t + g, 0) +
      PAD_IN;
    layerAt.push({ y, h: lh });
    let by = y + HEAD_LAYER;
    layer.boxes.forEach((b, i) => {
      at.set(b.id, { x: modX + PAD_IN * 2, y: by, w: innerW, h: hs[i] });
      by += hs[i] + (gaps[i] ?? 0);
    });
    y += lh + GAP_LINKED;
  }
  const modH = y - GAP_LINKED + PAD_IN - margin;
  const mid = (id: string) => {
    const p = at.get(id)!;
    return p.y + p.h / 2;
  };

  // ---- sides: three points a side at most, dealt out in the order the other ends sit
  const span = (b: Box, p: P) =>
    shapeOf(b) === "store"
      ? { start: p.y + CAP, len: p.h - CAP }
      : { start: p.y, len: p.h };
  const dealt = (
    id: string,
    group: Link[],
    key: (l: Link) => number,
  ): Map<Link, number> => {
    const out = new Map<Link, number>();
    const p = at.get(id);
    if (!p) return out;
    const { start, len } = span(boxOf(id), p);
    const pts = sidePoints(start, len, group.length);
    [...group]
      .sort((m, n) => key(m) - key(n))
      .forEach((l, i) => out.set(l, pts[Math.min(i, pts.length - 1)]));
    return out;
  };
  // where a link lands on the left side of its target, and leaves from the right side of its source
  const landY = new Map<Link, number>(),
    leaveY = new Map<Link, number>(),
    leaveLeftY = new Map<Link, number>();
  const seatsOf = () => {
    landY.clear();
    leaveY.clear();
    for (const id of new Set(links.map((l) => l.to)))
      if (at.has(id))
        for (const [l, v] of dealt(
          id,
          links.filter(
            (l) => l.to === id && kindOf.get(l) !== "back" && at.has(l.from),
          ),
          (l) => mid(l.from),
        ))
          landY.set(l, v);
    for (const id of new Set(links.map((l) => l.from)))
      if (at.has(id))
        for (const [l, v] of dealt(
          id,
          links.filter(
            (l) =>
              l.from === id &&
              (kindOf.get(l) === "fwd" || kindOf.get(l) === "other") &&
              at.has(l.to),
          ),
          (l) => mid(l.to),
        ))
          leaveY.set(l, v);
  };
  const midOf = (id: string) => {
    const p = at.get(id);
    return p ? p.y + p.h / 2 : margin + modH / 2;
  };

  // ---- the outside, placed from the deepest column out, each box on the seat of what it leads to
  const placeLeft = () => {
    let lx = ox;
    const xs = leftCols.map((_, i) => {
      const x = lx;
      lx += leftW[i] + leftGap[i];
      return x;
    });
    for (let i = leftCols.length - 1; i >= 0; i--) {
      const rows = leftCols[i]
        .map((b) => {
          const prim = primaryOf(b.id).filter(
            (l) => at.has(l.to) || landY.has(l),
          );
          const want = prim.length
            ? prim.reduce(
                (t, l) =>
                  t +
                  (isIn.has(l.to)
                    ? (landY.get(l) ?? midOf(l.to))
                    : midOf(l.to)),
                0,
              ) / prim.length
            : margin + modH / 2;
          return { b, h: hOf(b), y: want };
        })
        .sort((m, n) => m.y - n.y);
      let floor = margin;
      for (const r of rows) {
        r.y = Math.max(r.y - r.h / 2, floor);
        at.set(r.b.id, { x: xs[i], y: r.y, w: leftW[i], h: r.h });
        floor = r.y + r.h + GAP_Y;
      }
    }
  };
  const placeRight = () => {
    const rows = right
      .map((b) => {
        const back = links.filter((l) => l.to === b.id);
        return {
          b,
          h: hOf(b),
          y: back.length
            ? back.reduce((t, l) => t + midOf(l.from), 0) / back.length
            : margin + modH / 2,
        };
      })
      .sort((m, n) => m.y - n.y);
    let floor = margin;
    for (const r of rows) {
      r.y = Math.max(r.y - r.h / 2, floor);
      at.set(r.b.id, { x: rightX, y: r.y, w: rightW, h: r.h });
      floor = r.y + r.h + GAP_Y;
    }
  };
  placeLeft();
  placeRight();
  seatsOf();
  placeLeft();
  seatsOf();

  // ---- the wires
  type Pt = [number, number];
  const pending: Pending[] = [],
    verticals: Vert[] = [],
    horizontals: Blocker[] = [];
  const paths: {
    l: Link;
    pts: Pt[];
    dashed?: boolean;
    label?: { x: number; y: number };
  }[] = [];
  const dOf = (pts: Pt[]) =>
    `M${pts[0][0]} ${pts[0][1]}` +
    pts
      .slice(1)
      .map((p, i) => (p[1] === pts[i][1] ? ` H${p[0]}` : ` V${p[1]}`))
      .join("");
  const edgeL = (id: string) =>
    edgeX(boxOf(id), { ...at.get(id)!, row: 0 }, "left");
  const edgeR = (id: string) =>
    edgeX(boxOf(id), { ...at.get(id)!, row: 0 }, "right");
  const tops = (id: string, side: "top" | "bottom") => {
    const p = at.get(id)!;
    return {
      x: acrossPoints(boxOf(id), { ...p, row: 0 }, side, 1)[0],
      y: edgeY(boxOf(id), { ...p, row: 0 }, side),
    };
  };

  // Straight wires between the left side, into the module, and out of it to the right.
  const railOrder = [...outward];
  if (outward.length > 1) {
    const cross = (order: Link[]) => {
      const segs: { k: Link; y: number; x1: number; x2: number }[] = [];
      order.forEach((l, i) => {
        const a = at.get(l.from)!,
          b = at.get(l.to)!;
        const y1 = leaveY.get(l) ?? a.y + a.h / 2,
          y2 = landY.get(l) ?? b.y + b.h / 2;
        const via = modX + modW + RAIL_LANE + 16 * i;
        if (Math.abs(y1 - y2) < 1)
          segs.push({ k: l, y: y1, x1: edgeR(l.from), x2: b.x });
        else {
          segs.push({ k: l, y: y1, x1: edgeR(l.from), x2: via });
          segs.push({ k: l, y: y2, x1: via, x2: b.x });
        }
      });
      let bad = 0;
      for (let i = 0; i < segs.length; i++)
        for (let j = i + 1; j < segs.length; j++) {
          if (segs[i].k === segs[j].k) continue;
          const apart = Math.abs(segs[i].y - segs[j].y);
          if (apart < 0.5 || apart >= GAP_APART) continue;
          if (
            Math.min(segs[i].x2, segs[j].x2) -
              Math.max(segs[i].x1, segs[j].x1) >
            LABEL_GAP
          )
            bad += 1;
        }
      // wires that cross are worse than a wider rail
      let crossed = 0;
      for (let i = 0; i < segs.length; i++)
        for (let j = i + 1; j < segs.length; j++) {
          const s = segs[i],
            u = segs[j];
          if (s.k === u.k) continue;
          // a segment is a run at y from x1 to x2; a corridor is the drop between the runs of one wire
          // (the drops are found from the pair of runs of a wire)
        }
      for (const k of order)
        for (const m of order) {
          if (k === m) continue;
          const rk = segs.filter((s) => s.k === k),
            rm = segs.filter((s) => s.k === m);
          if (rk.length < 2 || rm.length < 2) continue;
          const [k1, k2] = rk,
            [m1, m2] = rm;
          const kx = k1.x2,
            mx = m1.x2;
          const ky0 = Math.min(k1.y, k2.y),
            ky1 = Math.max(k1.y, k2.y);
          // k's drop at kx between its two runs crosses m's runs when m has a run through kx at a y between them
          for (const r of [m1, m2])
            if (kx > r.x1 && kx < r.x2 && r.y > ky0 && r.y < ky1) crossed += 1;
          void mx;
        }
      return bad * 100000 + crossed * 1000 + railNeed(order);
    };
    const permute = <T>(xs: T[]): T[][] =>
      xs.length <= 1
        ? [xs]
        : xs.flatMap((x, i) =>
            permute([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [
              x,
              ...r,
            ]),
          );
    let best = railOrder,
      score = cross(best);
    for (const order of outward.length <= 6
      ? permute(outward)
      : [[...outward].sort((m, n) => midOf(m.to) - midOf(n.to))]) {
      const s2 = cross(order);
      if (s2 < score) {
        best = order;
        score = s2;
      }
    }
    railOrder.splice(0, railOrder.length, ...best);
  }
  for (const l of links) {
    const k = kindOf.get(l);
    if (!at.has(l.from) || !at.has(l.to)) continue;
    if (k === "fwd" || k === "other") {
      const x1 = edgeR(l.from),
        x2 = edgeL(l.to);
      const y1 = leaveY.get(l) ?? midOf(l.from),
        y2 = landY.get(l) ?? midOf(l.to);
      const out = !isOut.has(l.from) && isOut.has(l.to);
      let pts: Pt[], lab: { x: number; y: number };
      const w = labelW(l);
      if (out) {
        const via =
          modX + modW + RAIL_LANE + 16 * Math.max(0, railOrder.indexOf(l));
        pts =
          Math.abs(y1 - y2) < 1
            ? [
                [x1, y1],
                [x2, y2],
              ]
            : [
                [x1, y1],
                [via, y1],
                [via, y2],
                [x2, y2],
              ];
        const from = Math.abs(y1 - y2) < 1 ? modX + modW : via;
        lab = { x: from + (x2 - from - w) / 2, y: y2 - LABEL_GAP };
      } else {
        const stop = isIn.has(l.to) ? modX : x2;
        if (Math.abs(y1 - y2) < 1)
          pts = [
            [x1, y1],
            [x2, y2],
          ];
        else {
          const jx = isIn.has(l.to)
            ? modX - 8
            : Math.min(x1 + 24, (x1 + stop) / 2);
          pts = [
            [x1, y1],
            [jx, y1],
            [jx, y2],
            [x2, y2],
          ];
        }
        const to = pts.length === 2 ? stop : pts[1][0];
        lab = { x: x1 + (to - x1 - w) / 2, y: y1 - LABEL_GAP };
      }
      paths.push({ l, pts, dashed: l.dashed, label: lab });
    }
  }

  // The wires that go round: chosen as a set, since their corridors and bands share one space. Each is tried in every order and the order
  // with the fewest crossings is kept; a band of a wire is the middle of the free gap beside the box it leaves or reaches.
  const tileRects = () => [...left, ...right].map((b) => at.get(b.id)!);
  const roundWire = (order: Link[]): { paths: typeof paths; bad: number } => {
    const out: typeof paths = [];
    let bad = 0;
    const bands: { y: number; x1: number; x2: number }[] = [];
    // seats on the module's boxes: the back wires leave the left side of what they leave, dealt out in the order of their bands
    const backSeat = new Map<Link, number>();
    const planned = order.map((l, j) => {
      const back = kindOf.get(l) === "back";
      const n = at.get(back ? l.to : l.from)!,
        other = at.get(back ? l.from : l.to)!;
      const id = back ? l.to : l.from;
      const down = other.y + other.h / 2 > n.y + n.h / 2;
      const cx = modX - 24 - 16 * j;
      const p = tops(id, down ? "bottom" : "top");
      const xa = Math.min(p.x, cx),
        xb = Math.max(p.x, cx);
      const near = tileRects().filter(
        (r) => r !== n && r.x < xb && r.x + r.w > xa,
      );
      let band: number;
      if (down) {
        const lo = n.y + n.h,
          below = near.filter((r) => r.y >= lo - 0.5).map((r) => r.y);
        const hi = below.length ? Math.min(...below) : Infinity;
        const cands: number[] = [];
        for (let s = 0; s < 8; s++)
          cands.push(
            Number.isFinite(hi)
              ? Math.round(
                  ((lo + 32 + hi - 16) / 2 +
                    (s % 2 ? 1 : -1) * Math.ceil(s / 2) * 32) /
                    4,
                ) * 4
              : lo + 32 + 32 * s,
          );
        band =
          cands.find(
            (y0) =>
              y0 >= lo + 32 &&
              y0 <= hi - 16 &&
              !bands.some(
                (q) => q.x1 < xb && q.x2 > xa && Math.abs(q.y - y0) < 32,
              ),
          ) ?? (bad++, cands[0]);
      } else {
        const hi = n.y,
          above = near
            .filter((r) => r.y + r.h <= hi + 0.5)
            .map((r) => r.y + r.h);
        const lo = above.length ? Math.max(...above) : margin;
        const cands: number[] = [];
        for (let s = 0; s < 8; s++)
          cands.push(
            Math.round(
              ((lo + 28 + hi - 24) / 2 +
                (s % 2 ? 1 : -1) * Math.ceil(s / 2) * 32) /
                4,
            ) * 4,
          );
        band =
          cands.find(
            (y0) =>
              y0 >= lo + 28 &&
              y0 <= hi - 24 &&
              !bands.some(
                (q) => q.x1 < xb && q.x2 > xa && Math.abs(q.y - y0) < 32,
              ),
          ) ?? (bad++, cands[0]);
      }
      bands.push({ y: band, x1: xa, x2: xb });
      return { l, back, id, down, cx, p, band, xa, xb };
    });
    // the module's side: back wires leave at seats ordered by their bands; wires that arrive take the seats the straight ones left
    for (const [sid, group] of new Map<string, Link[]>(
      [...new Set(planned.filter((q) => q.back).map((q) => q.l.from))].map(
        (s) => [
          s,
          planned.filter((q) => q.back && q.l.from === s).map((q) => q.l),
        ],
      ),
    )) {
      const bandOf = (l: Link) => planned.find((q) => q.l === l)!.band;
      for (const [l, v] of dealt(sid, group, bandOf)) backSeat.set(l, v);
    }
    for (const q of planned) {
      let pts: Pt[], lab: { x: number; y: number };
      const w = labelW(q.l);
      if (q.back) {
        const s = at.get(q.l.from)!,
          ys = backSeat.get(q.l) ?? s.y + s.h / 2;
        pts = [
          [s.x, ys],
          [q.cx, ys],
          [q.cx, q.band],
          [q.p.x, q.band],
          [q.p.x, q.p.y],
        ];
        lab = { x: q.xa + (q.xb - q.xa - w) / 2, y: q.band - LABEL_GAP };
      } else {
        const t = at.get(q.l.to)!,
          yt = landY.get(q.l) ?? t.y + t.h / 2;
        pts = [
          [q.p.x, q.p.y],
          [q.p.x, q.band],
          [q.cx, q.band],
          [q.cx, yt],
          [t.x, yt],
        ];
        lab = { x: q.xa + (q.xb - q.xa - w) / 2, y: q.band - LABEL_GAP };
      }
      out.push({ l: q.l, pts, dashed: q.l.dashed, label: lab });
    }
    return { paths: out, bad };
  };
  const crossings = (set: typeof paths) => {
    const segs = set.flatMap((p, k) =>
      p.pts.slice(1).map((b, i) => ({ k, a: p.pts[i], b })),
    );
    let n = 0;
    for (let i = 0; i < segs.length; i++)
      for (let j = i + 1; j < segs.length; j++) {
        const s = segs[i],
          t = segs[j];
        if (s.k === t.k) continue;
        const sv = s.a[0] === s.b[0],
          tv = t.a[0] === t.b[0];
        if (sv === tv) continue;
        const [v, h] = sv ? [s, t] : [t, s];
        if (
          v.a[0] > Math.min(h.a[0], h.b[0]) &&
          v.a[0] < Math.max(h.a[0], h.b[0]) &&
          h.a[1] > Math.min(v.a[1], v.b[1]) &&
          h.a[1] < Math.max(v.a[1], v.b[1])
        )
          n++;
      }
    return n;
  };
  if (pool.length) {
    const permute = <T>(xs: T[]): T[][] =>
      xs.length <= 1
        ? [xs]
        : xs.flatMap((x, i) =>
            permute([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [
              x,
              ...r,
            ]),
          );
    const tries = pool.length <= 6 ? permute(pool) : [pool];
    let best = roundWire(pool),
      score = best.bad * 100 + crossings([...paths, ...best.paths]);
    for (const order of tries) {
      const r = roundWire(order),
        s = r.bad * 100 + crossings([...paths, ...r.paths]);
      if (s < score) {
        best = r;
        score = s;
        if (!score) break;
      }
    }
    if (best.bad)
      findings.push(
        "a wire that goes round the left side found no free band between the boxes; give the boxes more room",
      );
    paths.push(...best.paths);
  }

  // ---- draw: the module first, then the tiles, then the wires and their words
  const body: string[] = [];
  body.push(
    `  <rect class="dl-plate" x="${modX}" y="${margin}" width="${modW}" height="${modH}" rx="12"/>`,
  );
  body.push(
    textSvg(
      "dl-label",
      modX + PAD_IN,
      margin + 20,
      (spec.title ?? "the system").toUpperCase(),
    ),
  );
  layers.forEach((layer, i) => {
    const { y: ly, h: lh } = layerAt[i];
    body.push(
      `  <rect class="dl-frame-line" x="${modX + PAD_IN}" y="${ly}" width="${layerW}" height="${lh}" rx="10"/>`,
    );
    body.push(
      textSvg("dl-label", modX + PAD_IN * 2, ly + 20, layer.name.toUpperCase()),
    );
    for (const b of layer.boxes) {
      const p = at.get(b.id)!;
      body.push(mapRect(shaped(b), p.x, p.y, p.w, p.h));
    }
  });
  for (const b of [...left, ...right]) {
    const p = at.get(b.id)!;
    body.push(mapRect(shaped(b), p.x, p.y, p.w, p.h));
  }
  for (let i = 0; i + 1 < layers.length; i++) {
    const a = layerAt[i],
      b = layerAt[i + 1];
    body.push(wireSvg(`M${modX + modW / 2} ${a.y + a.h} V${b.y}`));
  }
  const sPaths = paths.map((p) => ({
    d: dOf(p.pts),
    from: p.l.from,
    to: p.l.to,
    dashed: p.dashed,
  }));
  const sJoined =
    busAtLine === 0
      ? sPaths.map((w) => w.d)
      : busWires(
          sPaths,
          (id, side) => {
            const p = at.get(id);
            if (!p) return null;
            return side === "left" || side === "right"
              ? edgeX(boxOf(id), { ...p, row: 0 }, side)
              : edgeY(boxOf(id), { ...p, row: 0 }, side);
          },
          (id, side) => {
            const p = at.get(id);
            if (!p) return null;
            return side === "left" || side === "right"
              ? Math.round(midY(boxOf(id), { ...p, row: 0 }))
              : acrossPoints(boxOf(id), { ...p, row: 0 }, side, 1)[0];
          },
          busAtLine,
        );
  const sOn = (l: Link) => !!boxOf(l.to)?.em;
  paths.forEach((p, id) => {
    const d = sJoined[id];
    verticals.push(...vertsOf(d, id));
    horizontals.push(...horzOf(d, id));
    // A LABEL STANDS ON THE STRAIGHT RUN OF ITS OWN WIRE AS DRAWN. The wire's route was laid before wires that meet one tile were joined
    // on a bus, and a label placed from that first route stood where the wire no longer ran (a label 84 off its wire). Each label is
    // therefore set from the wire's final path: the longest straight run no other wire shares, centred on it, a standard gap clear.
    if (p.l.label && p.label) {
      const w = labelW(p.l),
        own = labelRun(
          sJoined[id],
          sJoined.filter((_, k) => k !== id),
          w,
        );
      const at = !own
        ? p.label
        : own.vertical
          ? { x: own.x, y: own.y }
          : { x: own.x + (own.len - w) / 2, y: own.y - LABEL_GAP };
      pending.push({
        x: Math.round(at.x),
        y: Math.round(at.y),
        w,
        txt: p.l.label,
        path: id,
      });
    }
  });
  paths.forEach((p, id) => {
    if (!sOn(p.l)) body.push(wireSvg(sJoined[id], p.dashed));
  });
  paths.forEach((p, id) => {
    if (sOn(p.l)) body.push(wireSvg(sJoined[id], p.dashed, "", true));
  });
  const blockers: Blocker[] = [
    ...tileRects(),
    { x: modX, y: margin, w: modW, h: modH },
    ...horizontals,
  ];
  body.push(
    ...placeLabels(
      pending,
      verticals,
      margin,
      Math.max(FRAME_W, rightX + rightW + margin),
      blockers,
    ),
  );

  const need = right.length ? railNeed(railOrder) : 0;
  if (!hint && right.length && need < railW)
    return drawSystem(spec, { rail: need }, busAtLine, SYS_NOTE);
  return {
    svg: svgOf(body, spec.title ?? spec.caption ?? "system diagram"),
    findings,
    rail: need,
  };
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
  if (!parts.length)
    return { svg: "", findings: ["a `dg` figure with no boxes"] };

  const idx = new Map(parts.map((b, i) => [b.id, i]));
  for (const m of msgs)
    for (const end of [m.from, m.to])
      if (!idx.has(end))
        findings.push(
          `a message names \`${end}\`, and no participant has that id`,
        );
  const known = msgs.filter((m) => idx.has(m.from) && idx.has(m.to));
  for (const m of known)
    if (!m.label)
      findings.push(
        `the message \`${m.from}\` → \`${m.to}\` carries no label; a sequence shows who says WHAT to whom`,
      );

  const margin = FRAME_PAD;
  // One pitch per message. A label sits LABEL_GAP above its own arrow and owes the same to the arrow
  // above it, so the pitch is that gap twice plus the line itself — the same arithmetic a lane uses.
  const HEAD_H = H_ONE,
    PITCH = LABEL_H + LABEL_GAP * 3,
    TAIL = 36,
    SELF_W = 44,
    SELF_H = 24;

  const ws = parts.map((b) =>
    up4(Math.max(120, b.label.length * W_LABEL + PAD_X * 2)),
  );
  // A COLUMN GAP GROWS TO HOLD THE WIDEST THING SAID ACROSS IT. A message's label is centred on its
  // own arrow, so a long one on a short arrow sprawls over the lifelines either side of it.
  const gaps = parts.slice(0, -1).map((_, i) => {
    const across = known.filter((m) => {
      const a = idx.get(m.from)!,
        b = idx.get(m.to)!;
      return Math.min(a, b) === i && Math.max(a, b) === i + 1;
    });
    const widest = Math.max(
      0,
      ...across.map((m) => (m.label ?? "").length * W_NOTE),
    );
    return Math.max(GAP_COL, Math.ceil(widest + 24 - (ws[i] + ws[i + 1]) / 2));
  });

  const out: string[] = [];
  const xs: number[] = [];
  // The participants stand centred on the frame, on the 4 grid.
  let x = Math.max(
    margin,
    up4(
      (FRAME_W -
        (ws.reduce((s, w) => s + w, 0) + gaps.reduce((s, g) => s + g, 0))) /
        2,
    ),
  );
  parts.forEach((b, i) => {
    xs.push(x + ws[i] / 2);
    out.push(
      rect(
        { ...b, note: undefined, icon: undefined },
        x,
        margin,
        ws[i],
        HEAD_H,
        [],
      ),
    );
    x += ws[i] + (gaps[i] ?? 0);
  });

  let y = margin + HEAD_H + PITCH;
  let flow = 0;
  for (const m of known) {
    const a = xs[idx.get(m.from)!],
      b = xs[idx.get(m.to)!];
    flow += 1;
    if (m.from === m.to) {
      // A PARTICIPANT SPEAKING TO ITSELF is a loop off its own lifeline and back, because an arrow
      // from a line to the same line has nowhere to be and no length a reader could see.
      out.push(
        wireSvg(
          `M${a} ${y} H${a + SELF_W} V${y + SELF_H} H${a}`,
          m.dashed,
          ` data-dl-flow="${flow}"`,
        ),
      );
      if (m.label)
        out.push(
          textSvg(
            "dl-wlabel",
            Math.round(a + SELF_W + LABEL_GAP),
            y + SELF_H / 2 + 3,
            m.label,
          ),
        );
      y += SELF_H + PITCH;
      continue;
    }
    out.push(wireSvg(`M${a} ${y} H${b}`, m.dashed, ` data-dl-flow="${flow}"`));
    if (m.label)
      out.push(centred("dl-wlabel", m.label, (a + b) / 2, y - LABEL_GAP));
    y += PITCH;
  }

  // The lifelines are drawn last so they run the full height, and they run on past the last message.
  const foot = y - PITCH + TAIL;
  parts.forEach((_, i) =>
    out.push(
      `  <path class="dl-guide" data-role="lifeline" d="M${xs[i]} ${margin + HEAD_H} V${foot}"/>`,
    ),
  );

  return {
    svg: svgOf(out, spec.title ?? spec.caption ?? "sequence diagram"),
    findings,
  };
}

/**
 * THE FLOWCHART'S OWN LAYOUT: a spine down the middle of the frame, the branches in columns the same distance to either side of it.
 *
 * The rows are the depth of each box (the longest path to it), so a path runs down the page; the spine is the column of the head, and each
 * way out of a decision takes a column beside it, the first to the left and the second to the right, the same distance from the spine whichever
 * sides are used. Where the ways meet again the joining box is on the column of the decision that split them, and each branch reaches it by the
 * shortest orthogonal route: straight down its own column, along a lane just above the join, and into the join's top, so the branches
 * run into one line there and no wire runs down the frame's edge. A decision's ways leave by its side vertices; steps stand the scale's
 * stack floor (56) apart; the wires into a tile in focus are the accent.
 *
 * It answers only the shape it can read: one head, every link to a box further down, at most two columns each side. Anything else is the map's.
 */
function drawFlowSpine(spec: Spec): { svg: string; findings: string[] } | null {
  const boxes = spec.boxes ?? [],
    links = spec.links ?? [];
  if (!boxes.length || !links.length || boxes.some((b) => b.in !== undefined))
    return null;
  const byId = new Map(boxes.map((b) => [b.id, b]));
  if (
    links.some((l) => !byId.has(l.from) || !byId.has(l.to) || l.from === l.to)
  )
    return null;
  const outs = new Map<string, Link[]>(),
    ins = new Map<string, Link[]>();
  for (const b of boxes) {
    outs.set(b.id, []);
    ins.set(b.id, []);
  }
  for (const l of links) {
    outs.get(l.from)!.push(l);
    ins.get(l.to)!.push(l);
  }
  const heads = boxes.filter((b) => !ins.get(b.id)!.length);
  if (heads.length !== 1) return null;
  // depth: the longest path from the head; a cycle leaves a box unplaced
  const depth = new Map<string, number>(boxes.map((b) => [b.id, 0]));
  for (let pass = 0; pass <= boxes.length; pass++) {
    let moved = false;
    for (const l of links) {
      const want = depth.get(l.from)! + 1;
      if (want > depth.get(l.to)!) {
        depth.set(l.to, want);
        moved = true;
      }
    }
    if (!moved) break;
    if (pass === boxes.length) return null;
  }
  // order: by depth, then as written
  const order = [...boxes].sort(
    (a, b) =>
      depth.get(a.id)! - depth.get(b.id)! ||
      boxes.indexOf(a) - boxes.indexOf(b),
  );
  const col = new Map<string, number>(),
    anc = new Map<string, Set<string>>();
  const splits = (id: string) => outs.get(id)!.length > 1;
  // WHERE THE WAYS OUT OF A SPLIT STAND. A diamond's ways are centred on its own column (two stand either side of it, three leave the middle one
  // straight on); any other box that splits keeps its first way straight on, and the others stand beside it, left then right, nearest first.
  const sideOf = new Map<string, number>();
  for (const b of boxes)
    if (splits(b.id)) {
      const ways = outs
        .get(b.id)!
        .filter((l) => ins.get(l.to)!.length === 1)
        .map((l) => l.to);
      const n = ways.length;
      // A DECISION WITH A WAY STRAIGHT TO A JOIN keeps that way on its own column, so the other ways stand beside it: left of it first, then right.
      // Centred on the column, a lone way would stand on it and the way to the join would run through that tile.
      const toJoin =
        shapeOf(b) === "decision" &&
        outs.get(b.id)!.some((l) => ins.get(l.to)!.length > 1);
      const pattern = toJoin
        ? [-1, 1, -2, 2].slice(0, n)
        : shapeOf(b) === "decision"
          ? Array.from({ length: n }, (_, i) => i - (n - 1) / 2).map((v) =>
              n % 2 === 0 ? (v < 0 ? Math.floor(v) : Math.ceil(v)) : v,
            )
          : [0, -1, 1, -2, 2].slice(0, n);
      // A WAY THAT IS ITSELF A DECISION KEEPS THE COLUMN, and the other ways stand outside the two its own answers take: stood beside it, such a
      // way sits in the row the decision's side runs cross, and a run goes through it.
      const forks = (id: string) =>
        shapeOf(byId.get(id)!) === "decision" &&
        (outs.get(id)?.length ?? 0) > 1;
      const fork = shapeOf(b) !== "decision" ? ways.findIndex(forks) : -1;
      if (fork >= 0 && n > 1) {
        const rest = [-2, 2, -3, 3];
        ways.forEach((id, i) =>
          sideOf.set(id, i === fork ? 0 : rest[i - (i > fork ? 1 : 0)]),
        );
      } else ways.forEach((id, i) => sideOf.set(id, pattern[i]));
    }
  col.set(heads[0].id, 0);
  anc.set(heads[0].id, new Set());
  for (const b of order) {
    if (b.id === heads[0].id) continue;
    const inl = ins.get(b.id)!;
    const regions = inl.map(
      (l) =>
        new Set([...anc.get(l.from)!, ...(splits(l.from) ? [l.from] : [])]),
    );
    if (inl.length === 1) {
      const from = inl[0].from;
      col.set(
        b.id,
        col.get(from)! + (splits(from) ? (sideOf.get(b.id) ?? 0) : 0),
      );
      anc.set(b.id, regions[0]);
    } else {
      const common = [...regions[0]].filter((id) =>
        regions.every((r) => r.has(id)),
      );
      const deepest = common.sort((m, n) => depth.get(n)! - depth.get(m)!)[0];
      col.set(b.id, deepest ? col.get(deepest)! : 0);
      anc.set(b.id, new Set(common.filter((id) => id !== deepest)));
    }
  }
  const cols = [...new Set(col.values())];
  if (cols.some((c) => Math.abs(c) > 2)) return null;
  // The distance from the spine to the first column beside it, the same on both sides: far enough that the widest tile of each stands clear
  // of the widest on the spine by the connected gap, and that a decision's way out has room for its label and a corner.
  const wOf = new Map(boxes.map((b) => [b.id, mapBoxWidth(b)])),
    hOf = new Map(boxes.map((b) => [b.id, mapBoxHeight(b)]));
  const halfIn = (c: number, r: number) => {
    const b = boxes.find((q) => col.get(q.id) === c && depth.get(q.id) === r);
    return b ? wOf.get(b.id)! / 2 : null;
  };
  const rowNos = [...new Set(boxes.map((b) => depth.get(b.id)!))];
  // how far apart two columns must stand: the widest pair of tiles that share a row, and the connected gap between them
  const apart = (c1: number, c2: number): number => {
    let need = 0,
      any = false;
    for (const r of rowNos)
      for (const s of [-1, 1]) {
        const h1 = halfIn(s * c1, r),
          h2 = halfIn(s * c2, r);
        if (h1 !== null && h2 !== null) {
          need = Math.max(need, h1 + h2 + GAP_LINKED);
          any = true;
        }
      }
    void any;
    return need;
  };
  // a decision's way out is a run from its side vertex, with room for its answer and a corner; a split's ways stand far enough apart for each answer
  const answer = (id: string) =>
    Math.max(0, ...outs.get(id)!.map((l) => (l.label ?? "").length * W_NOTE)) +
    GAP_APART;
  let off1 = apart(0, 1),
    ring = 0;
  for (const b of boxes)
    if (splits(b.id)) {
      if (shapeOf(b) === "decision")
        off1 = Math.max(
          off1,
          wOf.get(b.id)! / 2 + Math.max(GAP_LINKED, answer(b.id)),
        );
      else off1 = Math.max(off1, answer(b.id));
      ring = Math.max(ring, answer(b.id));
    }
  const off2 = Math.max(off1 + Math.max(apart(1, 2), ring), apart(0, 2));
  const colX = (c: number) =>
    FRAME_W / 2 +
    Math.sign(c) * (Math.abs(c) === 0 ? 0 : Math.abs(c) === 1 ? off1 : off2);
  const left = Math.min(
    ...boxes.map((b) => colX(col.get(b.id)!) - wOf.get(b.id)! / 2),
  );
  const right = Math.max(
    ...boxes.map((b) => colX(col.get(b.id)!) + wOf.get(b.id)! / 2),
  );
  if (left < FRAME_PAD || right > FRAME_W - FRAME_PAD) return null;

  const rows = [...new Set(order.map((b) => depth.get(b.id)!))].sort(
    (m, n) => m - n,
  );
  const rowH = new Map(
    rows.map((r) => [
      r,
      Math.max(
        ...boxes
          .filter((b) => depth.get(b.id) === r)
          .map((b) => hOf.get(b.id)!),
      ),
    ]),
  );
  const rowTop = new Map<number, number>();
  let y = FRAME_PAD;
  for (const r of rows) {
    rowTop.set(r, y);
    y += rowH.get(r)! + GAP_LINKED;
  }
  type P = { x: number; y: number; w: number; h: number; cx: number };
  const at = new Map<string, P>();
  const out: string[] = [];
  const findings: string[] = [];
  for (const b of order) {
    const w = wOf.get(b.id)!,
      h = hOf.get(b.id)!,
      r = depth.get(b.id)!;
    const cx = colX(col.get(b.id)!),
      top = rowTop.get(r)! + (rowH.get(r)! - h) / 2;
    at.set(b.id, { x: cx - w / 2, y: top, w, h, cx });
    out.push(mapRect(b, cx - w / 2, top, w, h));
  }
  const shapeById = new Map(boxes.map((b) => [b.id, shapeOf(b)]));
  const wires: { d: string; dashed?: boolean; on: boolean }[] = [];
  const labels: string[] = [];
  const asBox = (id: string): Placed => ({ ...at.get(id)!, row: 0 });
  for (const l of links) {
    const a = at.get(l.from)!,
      b = at.get(l.to)!,
      ba = byId.get(l.from)!,
      bb = byId.get(l.to)!;
    const yb = edgeY(ba, asBox(l.from), "bottom"),
      yt = edgeY(bb, asBox(l.to), "top");
    const on = !!bb.em;
    const w = (l.label ?? "").length * W_NOTE;
    let d: string;
    if (shapeById.get(l.from) === "decision" && b.cx !== a.cx) {
      const side = b.cx < a.cx ? -1 : 1,
        vx = a.cx + (side * a.w) / 2,
        cy = a.y + a.h / 2;
      d = `M${vx} ${cy} H${b.cx} V${yt}`;
      if (l.label)
        labels.push(
          textSvg(
            "dl-wlabel",
            Math.round(Math.min(vx, b.cx) + (Math.abs(b.cx - vx) - w) / 2),
            cy - LABEL_GAP,
            l.label,
          ),
        );
    } else if (b.cx === a.cx) {
      d = `M${a.cx} ${yb} V${yt}`;
      // beside the straight run; below the lane when the box's other ways leave along one
      const lower =
        splits(l.from) &&
        outs.get(l.from)!.some((o) => at.get(o.to)!.cx !== a.cx);
      if (l.label)
        labels.push(
          textSvg(
            "dl-wlabel",
            a.cx + 8,
            Math.round(
              lower
                ? yt -
                    LABEL_GAP -
                    (shapeById.get(l.to) === "decision" ? LABEL_H / 3 : 0)
                : (yb + yt) / 2 + 4,
            ),
            l.label,
          ),
        );
    } else {
      // the shortest orthogonal route: down this tile's own column to a lane, along it to the target's column, in. The lane is the splitter's own
      // where the box splits to a box with no other way in, and otherwise the one just above the join, where the branches run into one line.
      const own = splits(l.from) && ins.get(l.to)!.length === 1;
      const ly = own
        ? yb + GAP_LINKED / 2
        : Math.max(yt - GAP_LINKED / 2, yb + GAP_LINKED / 2);
      d = `M${a.cx} ${yb} V${ly} H${b.cx} V${yt}`;
      if (l.label) {
        // the answer stands above the run between this column and the next one in towards the splitter
        const inner = own
          ? Math.abs(col.get(l.to)! - col.get(l.from)!) > 1
            ? colX(
                col.get(l.to)! - Math.sign(col.get(l.to)! - col.get(l.from)!),
              )
            : a.cx
          : a.cx;
        const lo = Math.min(inner, b.cx),
          span = Math.abs(b.cx - inner);
        labels.push(
          textSvg(
            "dl-wlabel",
            Math.round(lo + Math.max(0, (span - w) / 2)),
            ly - LABEL_GAP,
            l.label,
          ),
        );
      }
    }
    wires.push({ d, dashed: l.dashed, on });
  }
  // the plain wires first, the accent ones over them, so where a bus is shared the accent shows
  for (const w of wires.filter((x) => !x.on)) out.push(wireSvg(w.d, w.dashed));
  for (const w of wires.filter((x) => x.on))
    out.push(wireSvg(w.d, w.dashed, "", true));
  out.push(...labels);
  for (const l of links)
    if (shapeById.get(l.from) === "decision" && !l.label)
      findings.push(
        `the branch \`${l.from}\` → \`${l.to}\` leaves a decision with no answer on it; each branch out of a decision carries its own answer`,
      );
  return {
    svg: svgOf(out, spec.title ?? spec.caption ?? "flowchart"),
    findings,
  };
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
  const outs = new Map<string, number>(),
    ins = new Map<string, number>();
  for (const l of links) {
    outs.set(l.from, (outs.get(l.from) ?? 0) + 1);
    ins.set(l.to, (ins.get(l.to) ?? 0) + 1);
  }

  const shaped: Box[] = boxes.map((b) => {
    if (b.shape) return b;
    if (!ins.get(b.id) || !outs.get(b.id))
      return { ...b, shape: "terminator" as Shape };
    if ((outs.get(b.id) ?? 0) > 1) return { ...b, shape: "decision" as Shape };
    return b;
  });
  const shapeById = new Map(shaped.map((b) => [b.id, shapeOf(b)]));

  const spine = drawFlowSpine({ ...spec, boxes: shaped });
  const { svg, findings } =
    spine ?? drawMap({ ...spec, boxes: shaped }, { downward: true });
  // A DIAMOND WITH AN UNANSWERED BRANCH is the one fault this kind can have that a map cannot. The
  // chapter says a decision carries each branch's answer, and a reader meeting two unlabelled arrows
  // out of a diamond has to guess which one is yes — which is the question the diamond was asked.
  for (const l of links)
    if (shapeById.get(l.from) === "decision" && !l.label)
      findings.push(
        `the branch \`${l.from}\` → \`${l.to}\` leaves a decision with no answer on it; each branch out of a diamond carries its own answer`,
      );
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
 * Marks, never tints: a background is a surface (`dl-sk-surface`), a solid line is a border the block
 * has (`dl-line-edge`), a dotted line marks a component, a part or a slot (`dl-frame-line`), a thin
 * line is a control (`dl-ctl`, `dl-ctl-on` for the main one), and a soft bar stands in for content (`dl-bar`). A drawing
 * carries no colour and no size of its own: every mark is a class of the shared stylesheet, and its words take the language's
 * three levels (a name, a detail, a label), never a fourth.
 */
const SKEL_PAD = 16,
  SKEL_GAP = 24,
  SKEL_LABEL_H = 12,
  SKEL_LABEL_GAP = 8;
const SKEL_W_LABEL = 7,
  SKEL_W_NOTE = 6.4,
  SKEL_W_TITLE = 7.6;
const SKEL_H_ONE = 44,
  SKEL_H_TWO = 64;
/** A control's height at each size step, from the library's own scale. A frame's `size` sets it for everything inside; the default is `SM`. */
const SKEL_CONTROL_H: Record<string, number> = {
  XS: 28,
  SM: 32,
  MD: 36,
  LG: 40,
  XL: 44,
};
const SKEL_DEFAULT_H = SKEL_CONTROL_H.SM;
/** The control height inside `frame`: its own `size`, or a grid section's `section.size`, which it hands to every block inside, or
 *  the one that holds it. */
const skelSizeH = (frame: SkeletonFrame, inherited: number): number => {
  const size = frame.size ?? skelGridSectionOf(frame)?.size;
  return size !== undefined && SKEL_CONTROL_H[size] !== undefined
    ? SKEL_CONTROL_H[size]
    : inherited;
};
/**
 * THE CORNERS OF A SKELETON ARE THE DESIGN SYSTEM THEME'S, not the docs'. A drawn unit names the role its corner has, and the role is the
 * design system's own token for that unit: the stylesheet the docs ship (`ds-tokens.css`, copied from the design system) sets `rx` and `ry`
 * on every `rect[data-corner]` from that token, so a partner whose theme sets `--radius` differently has their corners drawn. The `rx`
 * attribute holds the same number at the default theme (`--radius` 0.625rem = 10px) as the fallback where no stylesheet reaches the drawing.
 *   ctl, badge  `--radius-sm`, 6: `rounded-sm`, fixed at every size, on a button, an input, a select, a textarea, a checkbox, a toggle, a
 *               pager button, a nav entry, a badge (DSButton, DSInput, DSSelect, DSBadge)
 *   xs … xl     `--size-<size>-radius`: a card with a `size`, a panel container's frame (DSCardRoot, DSPanelContainerRoot)
 *   frame       `--radius-lg`, 10: a card with no size (`rounded-lg`), a table's rounded frame, a block that is a frame on its own, the window
 *   inset       the frame's corner less the 2px a selected line stands in from it
 *   mark        half of `--radius-sm`: a placeholder mark, a dotted group boundary
 * Two corners take no token: `pill` (fully rounded: a pill tab bar, a switch's track, a placeholder bar, a scroll mark) and `none` (a
 * square frame, `rounded: false`, a band, a flush edge).
 */
export type SkelCorner =
  | "none"
  | "pill"
  | "ctl"
  | "badge"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "frame"
  | "inset"
  | "mark";
/** Each themed corner: the CSS the stylesheet sets `rx` from, and the pixels it comes to at the default theme (the attribute's fallback). */
export const SKEL_CORNER: Record<
  Exclude<SkelCorner, "none" | "pill">,
  { css: string; px: number }
> = {
  ctl: { css: "var(--radius-sm)", px: 6 },
  badge: { css: "var(--radius-sm)", px: 6 },
  xs: { css: "var(--size-xs-radius)", px: 6 },
  sm: { css: "var(--size-sm-radius)", px: 8 },
  md: { css: "var(--size-md-radius)", px: 8 },
  lg: { css: "var(--size-lg-radius)", px: 10 },
  xl: { css: "var(--size-xl-radius)", px: 10 },
  frame: { css: "var(--radius-lg)", px: 10 },
  inset: { css: "calc(var(--radius-lg) - 2px)", px: 8 },
  mark: { css: "calc(var(--radius-sm) / 2)", px: 3 },
};
const SKEL_SIZE_CORNERS: SkelCorner[] = ["xs", "sm", "md", "lg", "xl"];
/** The corner of a frame whose size sets it: a panel container's, at the size its controls stand at (the height says it); a card's, at its own. */
const skelSizeCorner = (ctl: number): SkelCorner =>
  SKEL_SIZE_CORNERS[Object.values(SKEL_CONTROL_H).indexOf(ctl)] ?? "sm";
const skelCardCorner = (frame: SkeletonFrame): SkelCorner => {
  const size = frame.size ?? skelGridSectionOf(frame)?.size;
  return size !== undefined && SKEL_CONTROL_H[size] !== undefined
    ? skelSizeCorner(SKEL_CONTROL_H[size])
    : "frame";
};
/** A tag's line: the note measure, its own clear air below it before the words or bars it heads. */
const SKEL_TAG_H = SKEL_LABEL_H + SKEL_LABEL_GAP;
/** One placeholder bar and the gap under it; a heading bar is a little taller. */
const SKEL_BAR = 6,
  SKEL_HEAD_BAR = 8,
  SKEL_BAR_STEP = SKEL_BAR + SKEL_LABEL_GAP;
/** Controls of one packed group (a pager, a layout switch) sit this far apart. */
const SKEL_PACK_GAP = 4;
/** How many named boundaries may sit inside one another before the drawing is split: a container, a widget or a card
 *  in it, and a group in that. */
const SKEL_NEST_MAX = 3;
const SKEL_LINES_W = 144,
  SKEL_FIELD_W = 144,
  SKEL_CARD_H = 64;
const WIDTH_FRACTIONS: Record<string, number> = {
  "1/4": 1 / 4,
  "1/3": 1 / 3,
  "1/2": 1 / 2,
  "2/3": 2 / 3,
  "3/4": 3 / 4,
};
// THE OUTER FRAME TAKES THE GRID'S CONTENT WIDTH (05-artifacts.md § The grid), as the hand-drawn
// skeletons did: a layout is a screen, and a screen drawn 300 wide reads as a widget.
const SKEL_CANVAS = 896;
// A FLOOR RATHER THAN A ZERO, for the degenerate case every row's width is left to a `fill` or a
// fraction: nothing would set the frame's own width, and 0 is not a figure.
const SKEL_MIN_W = 184;

const SKEL_LOOKS = ["raised", "bordered", "flat", "card", "container"];
/** A container on a surface: the height of its header, a band inside its outline under its unit's name, from its top
 *  to the line under it: its title alone, or its title with a note under it. */
const SKEL_CONTAINER_HEAD = 44,
  SKEL_CONTAINER_HEAD_TWO = 52;
/** How far the dotted line of a part with no border stands above and below what it marks. */
const SKEL_GUIDE_OUT = 6;
/** A card's head: its title on one line, or its title with a note under it. */
const SKEL_CARD_HEAD_ONE = 40,
  SKEL_CARD_HEAD_TWO = 58;
/** A mark that tells a state, set up or not, is small: this much lower than a control. A mark that stands for a thing is as tall as one,
 *  and it stays so where it also tells that thing's state: a spec says `mark` and `on` together for it. */
const SKEL_MARK_DROP = 12;
const SKEL_CONTROLS = [
  "button",
  "field",
  "select",
  "checkbox",
  "switch",
  "tabs",
  "badge",
  "pager",
];
/** The looks of a row of tabs a skeleton draws, in `DSTabsType`'s words (RULE.DEVEX.WORKSPACE.302). */
const SKEL_TABS_TYPES = ["LINE", "PILL"];
/** A badge stands this much lower than a control, and a switch's track this much, each on the row's centre line. */
const SKEL_BADGE_DROP = 8,
  SKEL_SWITCH_DROP = 12;
/** An icon before the word of a badge or a tab: a plain shape with no square around it. */
const SKEL_INLINE_ICON = 14;
/** The width a view is drawn at, for each screen class. It stands for the class, and is never a size on a screen. */
// THE DESKTOP TAKES THE GRID'S WIDTH, and the tablet and the phone share the next line, three parts to two, with
// the gap between them: 617 + 24 + 411 is the grid's 1052.
const SKEL_VIEW_W: Record<string, number> = {
  DESKTOP: 896,
  TABLET: 568,
  MOBILE: 384,
};
/** The task states a view may show, in `DSTaskStateType`'s own order (RULE.DEVEX.WORKSPACE.230). The views of one screen
 *  class are drawn in this order, after the view with no `state`, and a flow file's `state` names one of them. */
export const SKEL_TASK_STATES = [
  "IDLE",
  "WORKING",
  "DONE",
  "FAILED",
  "EMPTY",
  "DENIED",
];
/** A view's name in a finding and over its drawing: its class, and the word of its state where it shows one. */
const skelViewName = (
  view: Pick<SkeletonView, "viewport" | "state">,
): string => (view.state ? `${view.viewport} · ${view.state}` : view.viewport);
const SKEL_STANDINS = ["rows", "cards", "field", "list", "table"];
/** A table's head row, and the room a body row has above and below its tallest cell. */
const SKEL_TABLE_HEAD = 24,
  SKEL_TABLE_ROW_PAD = 8;
/** The two lines of an item: its title, and its description under it. */
const SKEL_ITEM_LINE = 18;
const SKEL_ICONS = [
  "close",
  "add",
  "menu",
  "search",
  "more",
  "previous",
  "next",
  "select",
  "checkbox",
  "bell",
  "person",
  "default",
];
/** The end arrows of an item line, in `DSIconType`'s own names (RULE.DEVEX.WORKSPACE.297): read only in an item line's `end`. */
const SKEL_END_ARROWS = ["ARROW_RIGHT", "ARROW_UP_RIGHT"];
/** Where an item line's facts stand against its description, in `DSItemFactsPlacementType`'s words (RULE.DEVEX.WORKSPACE.296). */
const SKEL_FACTS_PLACEMENTS = ["AFTER_DESCRIPTION", "AFTER_TITLE"];
/** A finding said once, however many times the drawer meets what it names. */
const skelSay = (findings: string[], message: string): void => {
  if (!findings.includes(message)) findings.push(message);
};

/**
 * THE UNITS A SPEC MAY NAME: every unit the design system's barrel exports (`spn-support-ts`
 * `packages/support-web-ds-ts/src/index.ts` @ `368b3262`, and `DSFeatureGridSectionContainer` @ `v5.31.0`), leaving out its
 * contexts and its observers, which are no unit a page is drawn from. A `unit` that is not here is a finding, since a sketch
 * names the real unit.
 */
const SKEL_UNITS = new Set([
  "DSFeatureGridSectionContainer",
  "DSAccordion",
  "DSAccordionGroup",
  "DSActorView",
  "DSAddressForm",
  "DSAddressView",
  "DSAlert",
  "DSAnchor",
  "DSAnchorContainer",
  "DSApp",
  "DSAspectRatio",
  "DSAttachment",
  "DSAttachmentMulti",
  "DSAuthz",
  "DSAutocomplete",
  "DSAutocompleteMulti",
  "DSAvatar",
  "DSAvatarGroup",
  "DSBackdrop",
  "DSBadge",
  "DSBreadcrumb",
  "DSButton",
  "DSButtonGroup",
  "DSCalendar",
  "DSCard",
  "DSCardWidget",
  "DSCarousel",
  "DSCheckbox",
  "DSCheckboxGroup",
  "DSCodeBlockView",
  "DSCollapsible",
  "DSColorPicker",
  "DSColorView",
  "DSCommand",
  "DSCommandPalette",
  "DSComparison",
  "DSConfirmDialog",
  "DSConfirmPopover",
  "DSContextMenu",
  "DSDataFieldBuilder",
  "DSDataFieldForm",
  "DSDataFieldView",
  "DSDataTable",
  "DSDataTableContainer",
  "DSDataUnit",
  "DSDataUnitGroup",
  "DSDatePicker",
  "DSDateRangePicker",
  "DSDateTimePicker",
  "DSDialog",
  "DSDrawer",
  "DSDropdownMenu",
  "DSEmpty",
  "DSEntryOverlay",
  "DSFeature",
  "DSFilterBar",
  "DSForm",
  "DSFormatCurrency",
  "DSFormatDate",
  "DSFormatDateTime",
  "DSFormatNumber",
  "DSFormatTime",
  "DSHScroll",
  "DSHoverCard",
  "DSIcon",
  "DSImage",
  "DSImagePicker",
  "DSInput",
  "DSInputNumber",
  "DSInputOTP",
  "DSInputPhone",
  "DSItem",
  "DSItemCard",
  "DSItemFacts",
  "DSJSONControl",
  "DSJSONView",
  "DSKbd",
  "DSLabel",
  "DSLayout",
  "DSLink",
  "DSList",
  "DSListDetail",
  "DSMark",
  "DSMenubar",
  "DSNavBarSide",
  "DSNavBarTop",
  "DSNavEntry",
  "DSNavList",
  "DSNavMenu",
  "DSOverlayContainer",
  "DSPageLevel",
  "DSPagination",
  "DSPanelContainer",
  "DSPopover",
  "DSPortal",
  "DSProgress",
  "DSProgressCircle",
  "DSRadio",
  "DSRadioGroup",
  "DSScrollArea",
  "DSSectionContainer",
  "DSSelect",
  "DSSelectMulti",
  "DSSeparator",
  "DSSheet",
  "DSSkeleton",
  "DSSlider",
  "DSSliderRange",
  "DSSpinner",
  "DSStatusActiveView",
  "DSSticky",
  "DSSurface",
  "DSSwitch",
  "DSTable",
  "DSTabs",
  "DSTagGroup",
  "DSText",
  "DSTextarea",
  "DSThemeForm",
  "DSTimePicker",
  "DSToast",
  "DSToggle",
  "DSToggleGroup",
  "DSToggleGroupMulti",
  "DSToolbar",
  "DSTooltip",
]);
type SkelLevel = "container" | "widget" | "card" | "component";
/** THE LEVEL IS READ FROM THE UNIT'S SUFFIX (RULE.SUPPORT.SURFACE.229): a suffix names where a unit is placed, so `Container` is
 *  around a part of a page and `Widget` beside others, and a component, a composite included (`DSDataTable`, `DSFilterBar`),
 *  takes no suffix. A card stands at the level of a widget, and is told by its name. */
// `DSCardWidget` IS A CARD, the widget a page sets in a container or on the page, so it is drawn as one: its outline,
// its name and its title.
const skelLevel = (unit: string): SkelLevel =>
  /Container$/.test(unit)
    ? "container"
    : /Card(Widget)?$/.test(unit)
      ? "card"
      : /Widget$/.test(unit)
        ? "widget"
        : "component";
/** The look a level is drawn in where the frame names none: a container its outline, a card its outline and title,
 *  and a widget or a component a dotted boundary. */
const SKEL_LEVEL_LOOK: Record<SkelLevel, SkeletonFrame["look"]> = {
  container: "container",
  card: "card",
  widget: "flat",
  component: "flat",
};
/** The word at the corner of a group: a part of a container's or a card's content with a title of its own, the level
 *  `GROUP` of the design system, which is no unit and so is named by its level. */
const SKEL_GROUP = "Group";
/** The name at a boundary's corner: its tag, and its unit. Every unit carries its name, a card as well as a widget, so a
 *  reader reads the levels of a page at a glance; a container draws its own at the corner of its outline, over its header. */
const skelCornerName = (
  frame: SkeletonFrame,
  surface = false,
): string | undefined => {
  const unit = frame.unit !== undefined && !surface ? frame.unit : undefined;
  return [frame.tag, unit].filter((s) => !!s).join(" · ") || undefined;
};
/** Whether a frame is a named boundary, which the nesting count counts. */
const skelNamed = (frame: SkeletonFrame): boolean =>
  !!frame.tag || frame.unit !== undefined;

/** A SECTION OF A PAGE AND A FEATURE'S FRAMES, IN THE DESIGN SYSTEM'S OWN NAMES (RULE.DEVEX.WORKSPACE.285, .286, .288).
 *  A `DSSectionContainer` takes its fill as `color` and `strength`, its `inset`, and its room from its `size`; a `DSFeature` takes
 *  `items.surface`, and `frames` with `surface`. Each is drawn with a mark a frame's look already has, and never as a colour. */
const SKEL_SECTION = "DSSectionContainer",
  SKEL_FEATURE = "DSFeature",
  SKEL_GRID_SECTION = "DSFeatureGridSectionContainer";
const SKEL_SURFACE_COLORS = ["BASE", "DEFAULT", "PRIMARY"],
  SKEL_SURFACE_STRENGTHS = ["SUBTLE", "QUIET", "SOLID"];
const SKEL_FEATURE_PARTS = ["TEXT", "MEDIA"];
/** A section's room above and below its content, by its size: the section's room on a phone, which is also about its room on
 *  a desktop at the scale a desktop view draws the window. A section with no `size` keeps a boundary's padding. */
const SKEL_SECTION_ROOM: Record<string, number> = {
  XS: 24,
  SM: 32,
  MD: 56,
  LG: 64,
  XL: 72,
};
type SkelSectionLook = Pick<
  SkeletonFrame,
  "color" | "strength" | "inset" | "size"
>;
/** A GRID SECTION DRAWS A SECTION FROM ITS `section` (RULE.DEVEX.WORKSPACE.293): its fill, its inset and its room are a section's own. */
const skelGridSectionOf = (
  frame: SkeletonFrame,
): SkelSectionLook | undefined =>
  frame.unit === SKEL_GRID_SECTION &&
  frame.section !== null &&
  typeof frame.section === "object" &&
  !Array.isArray(frame.section)
    ? frame.section
    : undefined;
/** The fields a section is drawn with: a `DSSectionContainer`'s own, or a grid section's `section`. */
const skelSectionLook = (frame: SkeletonFrame): SkelSectionLook | undefined =>
  frame.unit === SKEL_SECTION ? frame : skelGridSectionOf(frame);
const skelSectionRoom = (frame: SkeletonFrame): number | undefined => {
  const look = skelSectionLook(frame);
  return look !== undefined &&
    frame.look === "container" &&
    look.size !== undefined
    ? SKEL_SECTION_ROOM[look.size]
    : undefined;
};
/** THE LINES BETWEEN A FEATURE'S ITEMS, AND BETWEEN A GRID SECTION'S CELLS, IN `DSGridBorderType`'S WORDS (RULE.DEVEX.WORKSPACE.289).
 *  `border` is `GRID` or `EDGE`; `across` draws a line between the parts of one row too, as a `GRID` of items and a grid of cells
 *  do, where a `LIST` has one item to a row; `cells` reads rows of `DSFeature` cells, where a feature reads rows of item lines. */
const SKEL_ITEMS_TYPES = ["GRID", "LIST", "STATS"],
  SKEL_BORDER_TYPES = ["NONE", "GRID", "EDGE"],
  SKEL_V_ALIGNS = ["TOP", "CENTER", "BOTTOM"];
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
const SKEL_STAT_VALUE: Record<string, number> = {
  PAGE: 20,
  CONTAINER: 15,
  WIDGET: 13,
};
const SKEL_STAT_LABEL: Record<string, number> = {
  PAGE: 14,
  CONTAINER: 13,
  WIDGET: 12,
};
/** Whether a row is one of the items its frame's lines part: item lines, or `DSFeature` cells, with spacers where a row is short. */
const skelLinedRow = (row: SkeletonRow, lines: SkelLines): boolean => {
  const real = (row?.items ?? []).filter(
    (it) => !!it && typeof it === "object" && skelKind(it) !== "spacer",
  );
  return (
    real.length > 0 &&
    real.every((it) =>
      lines.cells
        ? skelKind(it) === "frame" && it.frame!.unit === SKEL_FEATURE
        : skelKind(it) === "item",
    )
  );
};
/** Whether a frame is a container drawn by its parts, its `frames` naming the parts that share a frame. A `DSFeature`'s
 *  `frames` names the parts of its own frame instead. */
const skelHasParts = (frame: SkeletonFrame): boolean =>
  frame.frames !== undefined && frame.unit !== SKEL_FEATURE;
type SkelSurface = NonNullable<SkeletonFrame["surface"]>;
/** What a feature's own frame draws: its `surface`, or the feature's defaults where it gives none. */
const skelSurfaceOf = (frame: SkeletonFrame): SkelSurface =>
  frame.surface !== null &&
  typeof frame.surface === "object" &&
  !Array.isArray(frame.surface)
    ? frame.surface
    : {};
/** The item lines and the slots that stand in a frame of their own: each item line of a feature with `items.surface`, and
 *  each slot that is the media of a feature whose `frames` names `MEDIA`. Filled from the spec once, before it is drawn. */
const skelItemFrames = new WeakMap<object, SkelSurface>();
/** A boxed item line takes a boundary's padding on every side. */
const skelItemBox = (it: SkeletonItem): number =>
  skelItemFrames.has(it) ? SKEL_PAD * 2 : 0;
/** Whether a frame holds a slot, in its rows or in a region of them that is no unit of its own: a feature's media. */
const skelHoldsSlot = (frame: SkeletonFrame): boolean =>
  (frame.rows ?? []).some((row) => skelRowHoldsSlot(row));
const skelItemHoldsSlot = (it: SkeletonItem): boolean =>
  skelKind(it) === "slot" ||
  (skelKind(it) === "frame" &&
    it.frame!.unit === undefined &&
    skelHoldsSlot(it.frame!));
const skelRowHoldsSlot = (row: SkeletonRow): boolean =>
  (row?.items ?? []).some(
    (it) => !!it && typeof it === "object" && skelItemHoldsSlot(it),
  );
/** A FEATURE OF `type` `BACKDROP` STANDS ITS MEDIA BEHIND ITS WORDS (RULE.DEVEX.WORKSPACE.305), as `DSFeature` lays its media under the words
 *  and the actions over the whole feature. Its media is the slot in a row of its own, which leaves the flow of the rows; the words, the
 *  actions and the items keep to three fifths of the feature's width on a tablet and a desktop, at the start or centred by `textAlign`,
 *  and to the whole of it on a phone, and with no screen class. Kept, once before the spec is drawn, by the rows the feature lays out. */
type SkelBackdrop = { media: SkeletonItem; measure: number; centre: boolean };
const skelBackdrops = new WeakMap<object, SkelBackdrop>();
const skelBackdropOf = (frame: SkeletonFrame): SkelBackdrop | undefined =>
  Array.isArray(frame.rows) ? skelBackdrops.get(frame.rows) : undefined;
const SKEL_BACKDROP_MEASURE = 3 / 5,
  SKEL_FEATURE_TYPES = ["BACKDROP"];
/** Which parts of a `DSFeature` its own frame is drawn round. `TEXT` with `MEDIA`, or `TEXT` where the feature has no media,
 *  is the whole feature; `MEDIA` alone is each slot; `TEXT` alone beside media is the words and the items. */
function skelFeatureFrames(frame: SkeletonFrame): {
  whole: boolean;
  text: boolean;
  media: boolean;
} {
  const parts =
    frame.unit === SKEL_FEATURE && Array.isArray(frame.frames)
      ? frame.frames
      : [];
  // A BACKDROP'S MEDIA LIES UNDER ITS WORDS, so a part named in `frames` frames the whole feature, as the design system frames it.
  if (skelBackdropOf(frame))
    return {
      whole: parts.some((part) => SKEL_FEATURE_PARTS.includes(part)),
      text: false,
      media: false,
    };
  const text = parts.includes("TEXT"),
    media = parts.includes("MEDIA"),
    hasMedia = parts.length > 0 && skelHoldsSlot(frame);
  const whole = text && (media || !hasMedia);
  return { whole, text: text && !whole, media: media && !whole && hasMedia };
}
/** A FRAME IS DRAWN WITH THE MARKS A FRAME'S LOOK ALREADY HAS: a thin outline, as a card's, solid where it is `bordered`; behind
 *  it the background of a raised frame where it is `raised` or its colour is not `BASE`; and a rounded corner unless `rounded`
 *  is false. How strong a fill is, and how far a raised frame stands off, are the library's look and draw no mark of their own. */
function skelSurfaceMarks(
  surface: SkelSurface,
  x: number,
  y: number,
  w: number,
  h: number,
  corner: SkelCorner = "frame",
): string[] {
  const rx: SkelCorner = surface.rounded === false ? "none" : corner;
  const filled =
    surface.raised === true ||
    (surface.color !== undefined && surface.color !== "BASE");
  return [
    ...(filled ? [skelRect("dl-sk-surface", x, y, w, h, rx)] : []),
    skelRect(
      surface.bordered === true ? "dl-line-edge" : "dl-ctl",
      x,
      y,
      w,
      h,
      rx,
    ),
  ];
}

/** A `DSAccordionGroup` WITH ITS ENTRIES, in `IDSAccordionGroupOption`'s names (RULE.DEVEX.WORKSPACE.301): a group that names its `options`
 *  draws them, one under another, each its header line with the indicator at its start and, where it is `expanded`, its `content` under
 *  it. A group written with `rows` and no `options` draws its rows as before. */
const SKEL_ACCORDION = "DSAccordionGroup";
const skelAccordionOf = (
  frame: SkeletonFrame,
): SkeletonAccordionOption[] | undefined =>
  frame.unit === SKEL_ACCORDION && Array.isArray(frame.options)
    ? frame.options.filter(
        (option) =>
          option !== null &&
          typeof option === "object" &&
          !Array.isArray(option),
      )
    : undefined;
/** THE WIDTH EACH OPEN ENTRY'S WORDS WERE WRAPPED AT, as a head's are: they wrap at a word to the entry's width, which a row learns only when
 *  it is drawn, so a spec that holds an accordion is drawn twice (`drawSkeleton`), and an entry drawn at two widths keeps the narrower. */
const skelAccordionWidths = new WeakMap<object, number>();
/** The words an open entry shows under its header, or none where it is closed or has no words. */
const skelAccordionWords = (
  option: SkeletonAccordionOption,
): string | undefined =>
  option.expanded === true &&
  typeof option.content === "string" &&
  option.content.trim()
    ? option.content
    : undefined;
const skelAccordionLines = (
  option: SkeletonAccordionOption,
  width: number,
): string[] => {
  const words = skelAccordionWords(option);
  return words === undefined
    ? []
    : skelHeadWrap(words, width, (line) => skelWordW(line));
};
/** AN ENTRY IS ITS HEADER LINE, as tall as a control of its size, and under it an open entry's words, a line apart from it, or inside its
 *  own outline a boundary's padding round them where the group is `bordered`. */
const skelAccordionEntryH = (
  frame: SkeletonFrame,
  option: SkeletonAccordionOption,
  ctl: number,
): number => {
  const lines = skelAccordionLines(
    option,
    skelAccordionWidths.get(option) ?? Infinity,
  ).length;
  return (
    ctl +
    (lines
      ? (frame.bordered === true ? SKEL_PAD * 2 : SKEL_LABEL_GAP) +
        lines * SKEL_ITEM_LINE
      : 0)
  );
};
/** The entries stand one under another, the gap between parts apart. */
const skelAccordionH = (
  frame: SkeletonFrame,
  entries: SkeletonAccordionOption[],
  ctl: number,
): number =>
  entries.reduce(
    (t, option) => t + skelAccordionEntryH(frame, option, ctl),
    0,
  ) +
  SKEL_GAP * Math.max(0, entries.length - 1);
/** The room an entry needs across: its indicator, the gap and its header's words, or the widest word of its open words, and the padding
 *  of its outline where the group is `bordered`. */
const skelAccordionMinW = (
  frame: SkeletonFrame,
  entries: SkeletonAccordionOption[],
): number =>
  Math.max(
    0,
    ...entries.map((option) => {
      const words = skelAccordionWords(option) ?? "";
      return (
        (frame.bordered === true ? SKEL_PAD * 2 : 0) +
        Math.max(
          SKEL_INLINE_ICON +
            SKEL_LABEL_GAP +
            skelStepW(String(option.header ?? ""), SKEL_STEP_ITEM),
          ...words
            .split(/\s+/)
            .filter(Boolean)
            .map((word) => skelWordW(word)),
        )
      );
    }),
  );
/** THE ENTRIES OF A GROUP, drawn from `(x, y)` across `w`. The indicator is the design system's chevron, at the start of the header line,
 *  pointing down while the entry is shut and turned up while it is open; the header's words stand at an item title's step. */
function skelDrawAccordion(
  frame: SkeletonFrame,
  entries: SkeletonAccordionOption[],
  x: number,
  y: number,
  w: number,
  ctl: number,
  out: string[],
): void {
  const bordered = frame.bordered === true,
    pad = bordered ? SKEL_PAD : 0;
  let top = y;
  for (const option of entries) {
    const wrapAt = w - pad * 2,
      known = skelAccordionWidths.get(option);
    skelAccordionWidths.set(
      option,
      known === undefined ? wrapAt : Math.min(known, wrapAt),
    );
    const lines = skelAccordionLines(option, wrapAt),
      entryH = skelAccordionEntryH(frame, option, ctl);
    if (bordered) out.push(skelRect("dl-ctl", x, top, w, entryH, "frame"));
    const cx = x + pad + SKEL_INLINE_ICON / 2,
      cy = top + ctl / 2,
      unit = SKEL_INLINE_ICON / 24;
    const at = (vx: number, vy: number): [number, number] => [
      cx - SKEL_INLINE_ICON / 2 + vx * unit,
      cy - SKEL_INLINE_ICON / 2 + vy * unit,
    ];
    out.push(
      ...(option.expanded === true
        ? [skelPath("dl-glyph", [[at(6, 15), at(12, 9), at(18, 15)]])]
        : skelGlyph("select", cx, cy, SKEL_INLINE_ICON)),
    );
    out.push(
      skelStepText(
        String(option.header ?? ""),
        SKEL_STEP_ITEM,
        x + pad + SKEL_INLINE_ICON + SKEL_LABEL_GAP,
        cy + 4,
      ),
    );
    if (lines.length) {
      // A BORDERED ENTRY THAT IS OPEN DIVIDES ITS HEADER FROM ITS BODY BY A LINE ACROSS ITS OUTLINE.
      if (bordered)
        out.push(
          `  <path class="dl-ctl" d="M${r2(x)} ${r2(top + ctl)} H${r2(x + w)}"/>`,
        );
      let lineTop = top + ctl + (bordered ? SKEL_PAD : SKEL_LABEL_GAP);
      for (const line of lines) {
        out.push(
          `  <text class="dl-detail" x="${r2(x + pad)}" y="${Math.round(lineTop + 13)}">${esc(line)}</text>`,
        );
        lineTop += SKEL_ITEM_LINE;
      }
    }
    top += entryH + SKEL_GAP;
  }
}
/** Whether a spec holds a group's entries anywhere, and so must be measured before it is drawn. */
const skelHasOptions = (value: unknown): boolean =>
  Array.isArray(value)
    ? value.some(skelHasOptions)
    : value !== null &&
      typeof value === "object" &&
      ("options" in value || Object.values(value).some(skelHasOptions));

/** THE LAYOUT'S WORDS, and the fields of the three looks (`IDSLayoutBodyLook`, `IDSLayoutNavigationLook`,
 *  `IDSLayoutContentLook`); a sketch's navigation adds the words of its entries and the open one. */
const SKEL_LAYOUT_TYPES = ["RAIL", "DOCK", "TOPNAV", "CANVAS"];
const SKEL_LAYOUT_PARTS: Record<string, string[]> = {
  body: ["width", "maxWidth", "className"],
  navigation: ["attached", "sticky", "className", "nav", "chosen", "open"],
  content: ["bordered", "raised", "attached", "className"],
};
/** Below `FULL`, the body's box at a desktop: its share of a window 1920 wide, drawn in the view's 1052. */
const SKEL_BODY_W: Record<string, number> = {
  NARROW: 421,
  MEDIUM: 561,
  WIDE: 701,
  XWIDE: 842,
};
const SKEL_BODY_WIDTHS = ["FULL", "XWIDE", "WIDE", "MEDIUM", "NARROW"];
/** A rail shut to icons on every device, and open only where a figure about the rail itself asks (`open`), at a desktop; a
 *  dock's column open at a desktop; a top bar and a phone's bar; how far a part that is not attached stands in; and the
 *  step of an entry of the navigation. */
const SKEL_RAIL_OPEN = 131,
  SKEL_RAIL_SHUT = 40,
  SKEL_LAYOUT_BAR = 48,
  SKEL_APART = 16,
  SKEL_NAV_STEP = 28;
/** The title of the page level is the largest of a surface's titles, a step over a container's. */
const SKEL_STEP_PAGE = 24;

type SkelKind =
  | "frame"
  | "spacer"
  | "slot"
  | "item"
  | "head"
  | "standin"
  | "control"
  | "icon"
  | "place"
  | "plain"
  | "note";
/** Which shape an item is; `null` is the thing the spec refuses. A tag with no other claim is a named place. */
const skelKind = (it: SkeletonItem): SkelKind | null =>
  it.frame
    ? "frame"
    : it.spacer
      ? "spacer"
      : it.slot !== undefined
        ? "slot"
        : it.item !== undefined
          ? "item"
          : it.head !== undefined
            ? "head"
            : it.standin !== undefined || it.lines !== undefined
              ? "standin"
              : it.control !== undefined
                ? "control"
                : it.icon !== undefined
                  ? "icon"
                  : it.tag !== undefined
                    ? "place"
                    : it.text !== undefined
                      ? "plain"
                      : it.note !== undefined
                        ? "note"
                        : null;

/** `tone` as a colour and `em` on a word are not read: the finding names the field that replaces each. */
function skelOldFields(
  holder: SkeletonItem | SkeletonFrame,
  findings: string[],
): void {
  const said = (message: string) => {
    if (!findings.includes(message)) findings.push(message);
  };
  const old = holder as {
    tone?: string;
    em?: boolean;
    off?: boolean;
    warn?: boolean;
  };
  if (old.tone !== undefined)
    said(
      "a skeleton no longer reads `tone`; a place is told apart by its mark, so give a frame a `look` of `raised`, `bordered` or `flat`",
    );
  if (old.em !== undefined)
    said(
      "a skeleton no longer reads `em`; a title is plain `text`, and the main action is a `control` with `main: true`",
    );
  if (old.off !== undefined)
    said("a skeleton no longer reads `off`; muted words are a `note`");
  if (old.warn !== undefined)
    said(
      "a skeleton no longer reads `warn`; a skeleton shows an arrangement, so say it in a `note`",
    );
}

const skelWordW = (s: string) => Math.ceil(s.length * SKEL_W_LABEL);
const skelTextW = (s: string) =>
  Math.ceil(s.length * SKEL_W_LABEL + SKEL_PAD * 2);
const skelTagW = (s: string) =>
  Math.ceil(s.length * SKEL_W_NOTE + SKEL_PAD * 2);
const skelPagerParts = (it: SkeletonItem) =>
  (it.text ?? "‹ 1 2 3 ›").split(/\s+/).filter(Boolean);
const skelPartW = (part: string, h: number) =>
  Math.max(h, Math.ceil(part.length * SKEL_W_LABEL + SKEL_PAD));
const skelIconOnly = (it: SkeletonItem) =>
  skelKind(it) === "icon" && it.text === undefined;
/** A switch, a row of tabs and a badge keep their own width: none of them takes the rest of a row. */
const skelOwnWidth = (it: SkeletonItem) =>
  it.control === "switch" || it.control === "tabs" || it.control === "badge";
const skelSwitchW = (h: number) => Math.round((h - SKEL_SWITCH_DROP) * 1.8);
const skelInlineIconW = (it: SkeletonItem) =>
  it.icon !== undefined ? SKEL_INLINE_ICON + SKEL_PACK_GAP : 0;
const skelTabWords = (it: SkeletonItem) =>
  Array.isArray(it.tabs) ? it.tabs.map(String) : [];
const skelTabW = (it: SkeletonItem, word: string) =>
  skelInlineIconW(it) + skelWordW(word);
const r2 = (n: number) => Math.round(n * 100) / 100;

/** A cell of a table as an item: a word is a note, and anything else is the item it is given as. */
const skelCell = (cell: string | SkeletonItem | undefined): SkeletonItem =>
  typeof cell === "string" ? { note: cell } : (cell ?? { note: "" });
const SKEL_CELL_KINDS: (SkelKind | null)[] = [
  "plain",
  "note",
  "icon",
  "control",
];
/** The width each column of a table needs: its head word, or its widest cell. */
function skelTableColumns(it: SkeletonItem, h: number): number[] {
  const columns = Array.isArray(it.columns) ? it.columns : [];
  const rows = Array.isArray(it.cells) ? it.cells : [];
  return columns.map((head, c) =>
    Math.max(
      skelWordW(String(head)),
      ...rows.map((row) => skelFixedWidth(skelCell(row[c]), h)),
    ),
  );
}
const skelTableW = (it: SkeletonItem, h: number): number => {
  const widths = skelTableColumns(it, h);
  return (
    SKEL_PAD * 2 +
    widths.reduce((t, w) => t + w, 0) +
    SKEL_GAP * Math.max(0, widths.length - 1)
  );
};
const skelTableRowH = (h: number) => h + SKEL_TABLE_ROW_PAD * 2;
const skelTableH = (it: SkeletonItem, h: number) =>
  SKEL_PAD +
  SKEL_TABLE_HEAD +
  (Array.isArray(it.cells) ? it.cells.length : 0) * skelTableRowH(h) +
  SKEL_LABEL_GAP;
/** The width of what stands at the end of an item line, with the gaps between its parts. */
const skelItemEndW = (it: SkeletonItem, h: number): number => {
  const end = it.item?.end ?? [];
  return (
    end.reduce((t, e) => t + skelFixedWidth(e, h), 0) +
    SKEL_LABEL_GAP * Math.max(0, end.length - 1)
  );
};
/** THE TITLES OF A SURFACE STAND IN STEPS, as the design system's type steps do: a container's title is the largest,
 *  a card's a step under it, and the title of a part of the content a step under that, all three heavy. An item's
 *  title names one thing among the content, so it is smaller and of medium weight. A step is told by size and
 *  weight together, and the size is written on the word, since the stylesheet has one size for a title. */
const SKEL_CARD_MARK = 22;
const SKEL_STEP_CONTAINER = 20,
  SKEL_STEP_CARD = 15,
  SKEL_STEP_PART = 13,
  SKEL_STEP_ITEM = 12;
const skelStepW = (words: string, step: number) =>
  Math.ceil((words.length * SKEL_W_TITLE * step) / SKEL_STEP_PART);
const skelStepText = (words: string, step: number, x: number, y: number) =>
  `  <text class="dl-name" x="${r2(x)}" y="${Math.round(y)}">${esc(words)}</text>`;
/** The facts on the line under an item's title: its description first, then each of `meta`. */
const skelItemFacts = (it: SkeletonItem): (string | SkeletonItem)[] => [
  ...(it.item?.description !== undefined && !it.item?.meta?.length
    ? [it.item.description]
    : []),
  ...(it.item?.meta ?? []),
];
/** AN ITEM HAS UP TO THREE LEVELS: its title, a description that is plain words, and a line of facts. Each of the
 *  last two is there only where the data has it. Where both are, the description stands on a line of its own. */
const skelItemOwnDescription = (it: SkeletonItem): string | undefined =>
  it.item?.meta?.length ? it.item?.description : undefined;
const skelItemDescriptionH = (it: SkeletonItem) =>
  skelItemOwnDescription(it) !== undefined ? SKEL_ITEM_LINE : 0;
/** AN ITEM MARKED `inline` WITH FACTS AND NO DESCRIPTION STANDS ONE LINE: its facts follow its title after a dot, as
 *  the library's item draws a compact row at the level INLINE. */
const skelItemInline = (it: SkeletonItem): boolean =>
  it.item?.inline === true &&
  skelItemFacts(it).length > 0 &&
  skelItemOwnDescription(it) === undefined;
/** A dot stands between every two facts, a badge among them: a line may hold two badges, or a badge with an icon,
 *  and one mark between all of them reads the same wherever it falls. */
const SKEL_FACT_DOT = "·",
  SKEL_FACT_DOT_W = 16;
/** A word on the facts line is measured closer than a note elsewhere, so the dot stands midway between two facts. */
const SKEL_W_FACT = 5.9;
/** A BADGE ON THE LINE OF FACTS IS AS TALL AS THE WORDS BESIDE IT, and not as tall as a badge that stands alone. */
const SKEL_FACT_BADGE = 16,
  SKEL_FACT_CTL = SKEL_FACT_BADGE + 8;
/** A word on the facts line is measured letter by letter, since capitals and digits are wider than small letters and a dot must not touch the word before it. */
const skelFactTextW = (words: string) =>
  Math.ceil(
    [...words].reduce(
      (t, c) =>
        t +
        (/[A-Z0-9@]/.test(c)
          ? 7.4
          : /[mwMW]/.test(c)
            ? 9.2
            : /[iljt.,:;' ]/.test(c)
              ? 3.6
              : SKEL_W_FACT + 0.3),
      0,
    ),
  );
const skelFactW = (fact: string | SkeletonItem, _h: number) =>
  typeof fact === "string"
    ? skelFactTextW(fact)
    : skelFixedWidth(fact, SKEL_FACT_CTL);
/** The width of one line of facts, with a dot between every two. */
const skelFactsW = (facts: (string | SkeletonItem)[], h: number): number =>
  facts.reduce(
    (t: number, fact, i) => t + skelFactW(fact, h) + (i ? SKEL_FACT_DOT_W : 0),
    0,
  );
const skelItemFactsW = (it: SkeletonItem, h: number): number =>
  skelFactsW(skelItemFacts(it), h);
const skelItemHasBadge = (it: SkeletonItem) =>
  skelItemFacts(it).some((fact) => typeof fact !== "string");
const skelItemStep = (it: SkeletonItem) =>
  it.page ? SKEL_STEP_PAGE : it.part ? SKEL_STEP_CONTAINER : SKEL_STEP_ITEM;
/** A NUMBERED ITEM'S NUMBER STANDS BEFORE ITS TITLE, on the title's line, at its size and weight, and a small gap from it. */
const SKEL_NUMBER_GAP = 6;
const skelItemNumber = (it: SkeletonItem): string | undefined =>
  skelNumbers.has(it) ? `${skelNumbers.get(it)}.` : undefined;
const skelItemNumberW = (it: SkeletonItem): number => {
  const number = skelItemNumber(it);
  return number === undefined
    ? 0
    : skelStepW(number, skelItemStep(it)) + SKEL_NUMBER_GAP;
};
const skelItemTitleW = (it: SkeletonItem) =>
  skelItemNumberW(it) + skelStepW(it.item?.title ?? "", skelItemStep(it));
const skelItemWordsW = (it: SkeletonItem, h: number) =>
  skelItemInline(it)
    ? skelItemTitleW(it) + SKEL_FACT_DOT_W + skelItemFactsW(it, h)
    : Math.max(
        skelItemTitleW(it),
        skelItemFactsW(it, h),
        Math.ceil((skelItemOwnDescription(it) ?? "").length * SKEL_W_NOTE),
      );
/** An item with a line under its title stands two lines tall, and a little taller where that line holds a badge. This is its height
 *  with each of its words on one line; `skelItemH` adds the lines its words wrap to. */
const skelItemBaseH = (it: SkeletonItem, h: number) =>
  skelStats.has(it)
    ? skelStatH(it)
    : !skelItemFacts(it).length || skelItemInline(it)
      ? h
      : skelItemDescriptionH(it) +
        (skelItemHasBadge(it)
          ? Math.max(
              h,
              SKEL_ITEM_LINE + SKEL_PACK_GAP + SKEL_FACT_BADGE + SKEL_LABEL_GAP,
            )
          : Math.max(h, SKEL_ITEM_LINE * 2 + SKEL_LABEL_GAP));
const skelItemH = (it: SkeletonItem, h: number) =>
  skelItemBaseH(it, h) + skelItemWrapH(it, h);
/** THE MEDIA OF AN ITEM IS AS LARGE AS THE LINES BESIDE IT: beside a title alone it is as tall as a control, and
 *  beside a title with a description it stands the height of both, so a picture is in proportion to what it names. Words that
 *  wrap to more lines leave it the size it has beside one line of each. */
const skelItemMediaD = (it: SkeletonItem, h: number) =>
  skelItemFacts(it).length && !skelItemInline(it)
    ? skelItemBaseH(it, h) - 4
    : h;

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
const skelWrapAt = (key: unknown): number =>
  key !== null && typeof key === "object"
    ? (skelWrapWidths.get(key) ?? Infinity)
    : Infinity;
const SKEL_FACT_BADGE_STEP = SKEL_PACK_GAP + SKEL_FACT_BADGE;
const skelNoteW = (words: string) => Math.ceil(words.length * SKEL_W_NOTE);
/** Words wrapped at a word to `width` where they run past it, and kept whole, as written, where they fit. */
const skelWrapWords = (
  words: string,
  width: number,
  measure: (line: string) => number,
): string[] =>
  measure(words) <= width ? [words] : skelHeadWrap(words, width, measure);
/** The widest word of `words`: the least room they wrap to. */
const skelWordsMinW = (
  words: string,
  measure: (line: string) => number,
): number => Math.max(0, ...words.split(/\s+/).filter(Boolean).map(measure));
/** One line of facts: each fact, and whether a dot stands before it. */
type SkelFactLine = { fact: string | SkeletonItem; dot: boolean }[];
const skelFactLineW = (line: SkelFactLine, h: number): number =>
  line.reduce(
    (t, entry) =>
      t + skelFactW(entry.fact, h) + (entry.dot ? SKEL_FACT_DOT_W : 0),
    0,
  );
/** The least room a fact takes: a badge whole, and words their widest word. */
const skelFactMinW = (fact: string | SkeletonItem, h: number): number =>
  typeof fact === "string"
    ? skelWordsMinW(fact, skelFactTextW)
    : skelFactW(fact, h);
function skelWrapFacts(
  facts: (string | SkeletonItem)[],
  width: number,
  h: number,
): SkelFactLine[] {
  if (skelFactsW(facts, h) <= width)
    return [facts.map((fact, i) => ({ fact, dot: i > 0 }))];
  const lines: SkelFactLine[] = [[]];
  let used = 0;
  for (const fact of facts) {
    let line = lines[lines.length - 1];
    const own = skelFactW(fact, h);
    if (line.length && used + SKEL_FACT_DOT_W + own <= width) {
      line.push({ fact, dot: true });
      used += SKEL_FACT_DOT_W + own;
      continue;
    }
    if (line.length) {
      line = [];
      lines.push(line);
    }
    if (typeof fact === "string" && own > width) {
      skelHeadWrap(fact, width, skelFactTextW).forEach((piece, i) => {
        if (i) {
          line = [];
          lines.push(line);
        }
        line.push({ fact: piece, dot: false });
        used = skelFactTextW(piece);
      });
    } else {
      line.push({ fact, dot: false });
      used = own;
    }
  }
  return lines;
}
/** The lines an item line's words stand on, at the width it was drawn at: its own description's, and its facts'. */
function skelItemWrapped(
  it: SkeletonItem,
  h: number,
): { description: string[]; facts: SkelFactLine[] } {
  const width = skelWrapAt(it.item),
    own = skelItemOwnDescription(it),
    facts = skelItemFacts(it);
  return {
    description: own !== undefined ? skelWrapWords(own, width, skelNoteW) : [],
    facts: facts.length ? skelWrapFacts(facts, width, h) : [],
  };
}
/** The room the lines an item's words wrap to add under its one line of each. A statistic and an inline line never wrap. */
function skelItemWrapH(it: SkeletonItem, h: number): number {
  if (skelStats.has(it) || skelItemInline(it) || !skelItemFacts(it).length)
    return 0;
  const { description, facts } = skelItemWrapped(it, h);
  return (
    Math.max(0, description.length - 1) * SKEL_ITEM_LINE +
    Math.max(0, facts.length - 1) *
      (skelItemHasBadge(it) ? SKEL_FACT_BADGE_STEP : SKEL_ITEM_LINE)
  );
}
/** A note's lines at the width it was drawn at; a line of code never wraps. */
const skelNoteLines = (it: SkeletonItem): string[] =>
  skelCode.has(it) || typeof it.note !== "string"
    ? [it.note!]
    : skelWrapWords(it.note, skelWrapAt(it), skelWordW);

/** CODE AND A ROW OF TABS SCROLL SIDEWAYS (RULE.DEVEX.WORKSPACE.304), as `DSCodeBlockView` scrolls a long line inside its block and `DSTabs`
 *  scrolls a long row in `DSHScroll`: wider than their column, they keep their width and are cut at its end, where a mark stands, the
 *  design system's arrow at an edge that has more. Each line of a `DSCodeBlockView` that is a note is code, kept here before it is drawn. */
const SKEL_CODE = "DSCodeBlockView";
const skelCode = new WeakSet<object>();
const skelScrolls = (it: SkeletonItem): boolean =>
  skelCode.has(it) || it.control === "tabs";
/** The mark at the cut edge: a round tile with the `next` shape, standing in from the edge on the line's centre, and the least room a
 *  scrolling part takes. */
const SKEL_SCROLL_MARK = 20,
  SKEL_SCROLL_MIN = SKEL_SCROLL_MARK * 2;
const skelScrollMark = (edge: number, mid: number): string[] => [
  skelRect(
    "dl-sk-surface",
    edge - SKEL_SCROLL_MARK,
    mid - SKEL_SCROLL_MARK / 2,
    SKEL_SCROLL_MARK,
    SKEL_SCROLL_MARK,
    "pill",
  ),
  skelRect(
    "dl-ctl",
    edge - SKEL_SCROLL_MARK,
    mid - SKEL_SCROLL_MARK / 2,
    SKEL_SCROLL_MARK,
    SKEL_SCROLL_MARK,
    "pill",
  ),
  ...skelGlyph("next", edge - SKEL_SCROLL_MARK / 2, mid, 12),
];
/** AN ITEM'S MEDIA IS READ IN `IDSItemMedia`'S KINDS (RULE.DEVEX.WORKSPACE.294). A name written as a word is a mark, as before; `ICON` is
 *  a bare icon, named in `node`; `MARK` is a mark holding `icon`. A kind an item line does not take keeps a mark's place. */
const SKEL_ITEM_MEDIA = ["ICON", "MARK"];
const skelMediaGiven = (media: unknown): media is SkeletonMedia =>
  media !== null && typeof media === "object" && !Array.isArray(media);
const skelItemMediaOf = (media: unknown): { bare: boolean; shape: string } =>
  !skelMediaGiven(media)
    ? { bare: false, shape: media as string }
    : media.mtype === "ICON"
      ? { bare: true, shape: media.node ?? "default" }
      : {
          bare: false,
          shape: media.mtype === "MARK" ? (media.icon ?? "default") : "default",
        };
/** A BARE ICON IS AS LARGE AS THE TITLE, and stands on the title's first line with no circle and no square round it. */
const skelItemIconW = (it: SkeletonItem) =>
  Math.round((skelItemStep(it) * 4) / 3);
const skelItemMediaW = (it: SkeletonItem, h: number): number =>
  it.item?.media === undefined
    ? 0
    : (skelItemMediaOf(it.item.media).bare
        ? skelItemIconW(it)
        : skelItemMediaD(it, h)) + SKEL_LABEL_GAP;
const skelItemW = (it: SkeletonItem, h: number): number =>
  skelStats.has(it)
    ? skelStatW(it)
    : skelItemMediaW(it, h) +
      skelItemWordsW(it, h) +
      (it.item?.end?.length ? SKEL_GAP + skelItemEndW(it, h) : 0);
/** The least room an item line takes (RULE.DEVEX.WORKSPACE.303): its title, which never wraps, or the widest word of its description or
 *  fact, or its widest badge, beside its media and its end. A statistic and an inline line take their whole width. */
const skelItemMinW = (it: SkeletonItem, h: number): number =>
  skelStats.has(it) || skelItemInline(it) || !skelItemFacts(it).length
    ? skelItemW(it, h)
    : skelItemMediaW(it, h) +
      Math.max(
        skelItemTitleW(it),
        ...skelItemFacts(it).map((fact) => skelFactMinW(fact, h)),
        skelWordsMinW(skelItemOwnDescription(it) ?? "", skelNoteW),
      ) +
      (it.item?.end?.length ? SKEL_GAP + skelItemEndW(it, h) : 0);
/** The width of the words of an item line drawn `lineW` wide: what its media and its end leave. */
const skelItemWordsAt = (it: SkeletonItem, h: number, lineW: number): number =>
  lineW -
  skelItemMediaW(it, h) -
  (it.item?.end?.length ? SKEL_GAP + skelItemEndW(it, h) : 0);
/** A STATISTIC IS ITS VALUE OVER ITS LABEL, one block as tall as its two lines, as the design system stacks them with no room between
 *  (RULE.DEVEX.WORKSPACE.300). It is as wide as the wider of the two. */
const skelStatOf = (it: SkeletonItem): SkelStat => skelStats.get(it)!;
const skelStatLabel = (it: SkeletonItem): string | undefined =>
  typeof it.item?.description === "string" && it.item.description
    ? it.item.description
    : undefined;
const skelStatH = (it: SkeletonItem): number => {
  const stat = skelStatOf(it);
  return (
    skelHeadLine(stat.value) +
    (skelStatLabel(it) !== undefined ? skelHeadLine(stat.label) : 0)
  );
};
const skelStatW = (it: SkeletonItem): number => {
  const stat = skelStatOf(it),
    label = skelStatLabel(it);
  return Math.max(
    skelStepW(String(it.item?.title ?? ""), stat.value),
    label !== undefined ? skelHeadDescriptionW(label, stat.label) : 0,
  );
};

/** A FEATURE'S HEAD IS DRAWN AT ITS LEVEL, IN `DSFeature`'S OWN NAMES (RULE.DEVEX.WORKSPACE.284): its title at its level's step,
 *  heavy; its description a step larger than an item's words, quiet; the eyebrow in small capitals, packed above the title;
 *  and the facts on one line under the description, as an item's `meta` stands. Every size is larger than an item's, so the
 *  head leads and the items follow. `CONTAINER`, a feature in a section, is the level where `pageLevel` is left out. */
type SkelHead = NonNullable<SkeletonItem["head"]>;
const SKEL_HEAD_LEVELS = ["PAGE", "CONTAINER", "WIDGET"],
  SKEL_HEAD_ALIGNS = ["START", "CENTER"];
const SKEL_HEAD_TITLE: Record<string, number> = {
  PAGE: SKEL_STEP_PAGE,
  CONTAINER: SKEL_STEP_CONTAINER,
  WIDGET: SKEL_STEP_CARD,
};
const SKEL_HEAD_DESCRIPTION: Record<string, number> = {
  PAGE: 16,
  CONTAINER: 14,
  WIDGET: 13,
};
/** The eyebrow's size and the gap between it and the title; the gap between the title, the description and the facts. */
const SKEL_HEAD_EYEBROW = 11,
  SKEL_HEAD_EYEBROW_GAP = 6,
  SKEL_HEAD_GAP = 8;
/** A line of the head is this much taller than its words. */
const SKEL_HEAD_LEADING = 1.25;
/** The size a note's measure, `SKEL_W_NOTE`, is taken at, and the measure of a spaced capital of the eyebrow. */
const SKEL_HEAD_NOTE_SIZE = 11,
  SKEL_HEAD_W_CAPS = 8;
/** A spec's head, or an empty one where it wrote something that is not one, so a finding names it and nothing throws. */
const skelHeadOf = (it: SkeletonItem): SkelHead =>
  it.head !== null && typeof it.head === "object" ? it.head : ({} as SkelHead);
const skelHeadLevel = (head: SkelHead): string =>
  SKEL_HEAD_LEVELS.includes(head.pageLevel as string)
    ? head.pageLevel!
    : "CONTAINER";
const skelHeadLine = (size: number) => Math.round(size * SKEL_HEAD_LEADING);
const skelHeadDescriptionW = (words: string, size: number) =>
  Math.ceil((words.length * SKEL_W_NOTE * size) / SKEL_HEAD_NOTE_SIZE);
const skelHeadEyebrowW = (words: string) =>
  Math.ceil(words.length * SKEL_HEAD_W_CAPS);
/** The facts under a head, as an item's `meta` holds them: a badge as itself, and a fact that is only words as its words. */
const skelHeadFacts = (head: SkelHead): (string | SkeletonItem)[] =>
  (Array.isArray(head.facts) ? head.facts : []).map((fact) =>
    typeof fact === "string"
      ? fact
      : fact !== null &&
          typeof fact === "object" &&
          fact.control === undefined &&
          (skelKind(fact) === "plain" || skelKind(fact) === "note")
        ? String(fact.text ?? fact.note)
        : fact,
  );
/** Words wrapped at a word to `width`, each line measured by `measure`. A word wider than the width stands on a line of its own. */
function skelHeadWrap(
  words: string,
  width: number,
  measure: (line: string) => number,
): string[] {
  const lines: string[] = [];
  for (const word of words.split(/\s+/).filter(Boolean)) {
    const last = lines.at(-1);
    if (last !== undefined && measure(`${last} ${word}`) <= width)
      lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}
/** A HEAD'S MEDIA STANDS OVER ITS WORDS, in the box of its level (RULE.DEVEX.WORKSPACE.294), as a feature draws its media on top below
 *  `PAGE`: a `MARK` or an `AVATAR`, 48px at `CONTAINER` and 40px at `WIDGET`, 12px above the eyebrow or the title. A feature at
 *  `PAGE` stands its media beside its words, so a head there draws none over them. */
const SKEL_HEAD_MEDIA = ["MARK", "AVATAR"];
const SKEL_HEAD_MEDIA_BOX: Record<string, number> = {
    CONTAINER: 48,
    WIDGET: 40,
  },
  SKEL_HEAD_MEDIA_GAP = 12;
const skelHeadMediaBox = (head: SkelHead): number =>
  skelMediaGiven(head.media) && SKEL_HEAD_MEDIA.includes(head.media.mtype)
    ? (SKEL_HEAD_MEDIA_BOX[skelHeadLevel(head)] ?? 0)
    : 0;
/** A BADGE EYEBROW IS ONE OF THE FACTS' BADGES (RULE.DEVEX.WORKSPACE.295), on a line as tall as a badge among the facts, packed above the title. */
const SKEL_HEAD_BADGE_LINE = SKEL_FACT_BADGE + 4;
const skelHeadBadge = (head: SkelHead): SkeletonItem | undefined =>
  head.eyebrow !== null &&
  typeof head.eyebrow === "object" &&
  !Array.isArray(head.eyebrow) &&
  head.eyebrow.control === "badge"
    ? head.eyebrow
    : undefined;
/** The initials an avatar shows where it has no picture: the first letter of the first two words of its name. */
const skelInitials = (title: string): string =>
  title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => [...word][0].toUpperCase())
    .join("");

/** THE HEAD IS ONE BLOCK AS TALL AS ITS LINES, and takes no control's height: its media's box and the gap, the eyebrow's line, the
 *  gap, every line of the title, the gap and every line of the description, the gap and the line of facts. Each line is placed
 *  from the head's top. */
type SkelHeadLine = {
  part: "eyebrow" | "title" | "description";
  words: string;
  size: number;
  top: number;
  w: number;
};
function skelHeadLayout(
  head: SkelHead,
  width: number,
): {
  lines: SkelHeadLine[];
  factsTop?: number;
  factLines: SkelFactLine[];
  factStep: number;
  height: number;
  mediaBox: number;
  badgeTop?: number;
} {
  const level = skelHeadLevel(head),
    step = SKEL_HEAD_TITLE[level],
    size = SKEL_HEAD_DESCRIPTION[level];
  const lines: SkelHeadLine[] = [];
  let y = 0;
  const put = (
    part: SkelHeadLine["part"],
    words: string,
    at: number,
    measure: (line: string) => number,
  ) => {
    for (const wrapped of skelHeadWrap(words, width, measure)) {
      lines.push({
        part,
        words: wrapped,
        size: at,
        top: y,
        w: measure(wrapped),
      });
      y += skelHeadLine(at);
    }
  };
  const mediaBox = skelHeadMediaBox(head);
  if (mediaBox) y = mediaBox + SKEL_HEAD_MEDIA_GAP;
  // THE EYEBROW IS WRITTEN IN A SENTENCE'S CASE AND DRAWN IN CAPITALS, on one line; a badge there stands on a badge's line.
  let badgeTop: number | undefined;
  if (typeof head.eyebrow === "string" && head.eyebrow) {
    const capitals = head.eyebrow.toUpperCase();
    lines.push({
      part: "eyebrow",
      words: capitals,
      size: SKEL_HEAD_EYEBROW,
      top: y,
      w: skelHeadEyebrowW(capitals),
    });
    y += skelHeadLine(SKEL_HEAD_EYEBROW) + SKEL_HEAD_EYEBROW_GAP;
  } else if (skelHeadBadge(head)) {
    badgeTop = y;
    y += SKEL_HEAD_BADGE_LINE + SKEL_HEAD_EYEBROW_GAP;
  }
  if (typeof head.title === "string")
    put("title", head.title, step, (line) => skelStepW(line, step));
  if (typeof head.description === "string" && head.description) {
    y += SKEL_HEAD_GAP;
    put("description", head.description, size, (line) =>
      skelHeadDescriptionW(line, size),
    );
  }
  // THE LINE OF FACTS WRAPS TO THE HEAD'S COLUMN (RULE.DEVEX.WORKSPACE.303), between two facts, each further line a step under the last.
  let factsTop: number | undefined,
    factLines: SkelFactLine[] = [];
  const facts = skelHeadFacts(head),
    factStep = facts.some((fact) => typeof fact !== "string")
      ? SKEL_FACT_BADGE_STEP
      : SKEL_ITEM_LINE;
  if (facts.length) {
    factLines = skelWrapFacts(facts, width, 0);
    y += SKEL_HEAD_GAP;
    factsTop = y;
    y += SKEL_ITEM_LINE + (factLines.length - 1) * factStep;
  }
  return {
    lines,
    factsTop,
    factLines,
    factStep,
    height: y,
    mediaBox,
    badgeTop,
  };
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
  const head = skelHeadOf(it),
    badge = skelHeadBadge(head);
  return Math.max(
    typeof head.eyebrow === "string" ? skelHeadEyebrowW(head.eyebrow) : 0,
    ...skelHeadFacts(head).map((fact) => skelFactMinW(fact, h)),
    ...(badge ? [skelFixedWidth(badge, SKEL_FACT_CTL)] : []),
    skelHeadMediaBox(head),
  );
};
/** Whether a spec holds a head anywhere, and so must be measured before it is drawn. */
const skelHasHead = (value: unknown): boolean =>
  Array.isArray(value)
    ? value.some(skelHasHead)
    : value !== null &&
      typeof value === "object" &&
      ("head" in value || Object.values(value).some(skelHasHead));
/** Whether a spec holds an item line or a note anywhere, whose words may wrap, and so must be measured before it is drawn. */
const skelHasWords = (value: unknown): boolean =>
  Array.isArray(value)
    ? value.some(skelHasWords)
    : value !== null &&
      typeof value === "object" &&
      ("item" in value ||
        "note" in value ||
        Object.values(value).some(skelHasWords));

/** An item's own width where it has one; a `fill` item or a frame takes what the row has left. */
function skelFixedWidth(it: SkeletonItem, h: number): number {
  switch (skelKind(it)) {
    case "plain":
      return it.part
        ? skelStepW(it.text!, SKEL_STEP_PART)
        : skelWordW(it.text!);
    case "note":
      return skelWordW(it.note!);
    case "place":
      return it.fill
        ? 0
        : Math.max(
            it.text !== undefined ? skelTextW(it.text) : 0,
            skelTagW(it.tag!),
            SKEL_PAD * 2,
          );
    case "slot":
      return it.fill ? 0 : Math.max(skelTagW(it.slot!), SKEL_PAD * 2);
    case "standin":
      return it.standin === "table"
        ? it.fill
          ? 0
          : skelTableW(it, h)
        : it.fill
          ? 0
          : SKEL_LINES_W;
    case "item":
      return it.fill ? 0 : skelItemW(it, h) + skelItemBox(it);
    case "head":
      return 0; // a head takes the rest of its row, and wraps to it
    case "icon":
      return (
        h + (it.text !== undefined ? SKEL_LABEL_GAP + skelWordW(it.text) : 0)
      );
    case "control": {
      const text = it.text ?? "";
      if (it.control === "pager") {
        const parts = skelPagerParts(it);
        return (
          parts.reduce((t, p) => t + skelPartW(p, h), 0) +
          SKEL_PACK_GAP * (parts.length - 1)
        );
      }
      if (it.control === "checkbox")
        return h + (text ? SKEL_LABEL_GAP + skelWordW(text) : 0);
      if (it.control === "switch")
        return skelSwitchW(h) + (text ? SKEL_LABEL_GAP + skelWordW(text) : 0);
      if (it.control === "tabs") {
        const words = skelTabWords(it);
        return (
          words.reduce((t, word) => t + skelTabW(it, word), 0) +
          SKEL_GAP * Math.max(0, words.length - 1)
        );
      }
      if (it.control === "badge")
        return SKEL_LABEL_GAP * 2 + skelInlineIconW(it) + skelWordW(text);
      if (it.fill) return 0;
      if (it.control === "field")
        return Math.max(skelTextW(text), SKEL_FIELD_W);
      if (it.control === "select") return skelTextW(text) + SKEL_PAD + 8;
      return Math.max(skelTextW(text), SKEL_PAD * 2);
    }
    default:
      return 0; // a frame never sets the row's shared width — it takes a fraction of it, or what is left
  }
}

/** A form field's title line, and the one line under its control: its error, or else its description. A field
 *  with its own words keeps the room of that line where it has neither, so the fields of a row stand level. */
const skelFieldHeadH = (it: SkeletonItem) =>
  it.label !== undefined ? SKEL_ITEM_LINE : SKEL_HEAD_BAR;
const skelFieldBelow = (it: SkeletonItem): string | undefined =>
  it.error ?? it.description;
const skelFieldBelowH = (it: SkeletonItem) =>
  it.label !== undefined || skelFieldBelow(it) !== undefined
    ? SKEL_PACK_GAP + SKEL_ITEM_LINE
    : 0;
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
  if (kind === "note")
    h = slot + (skelNoteLines(it).length - 1) * SKEL_ITEM_LINE;
  if (kind === "standin") {
    const count = Math.max(1, it.lines ?? 3);
    if (it.standin === "table") h = skelTableH(it, slot);
    else if (it.standin === "cards") h = SKEL_CARD_H;
    else if (it.standin === "field")
      h = it.read
        ? skelFieldHeadH(it) + SKEL_PACK_GAP + SKEL_READ_LINE
        : skelFieldHeadH(it) + SKEL_LABEL_GAP + slot + skelFieldBelowH(it);
    else h = SKEL_PAD + count * SKEL_BAR_STEP - SKEL_LABEL_GAP + SKEL_PAD;
  }
  return Math.max(h, (it.height ?? 0) * slot);
}
/** The line a part's unit, or the word *Group*, is named on, over its first row. */
const skelLeadH = (row: SkeletonRow): number =>
  row.lead && row.within !== undefined ? SKEL_TAG_H : 0;
/** A row's height, independent of width: the tallest item it holds, or that plus the framed pad. */
function skelRowHeight(row: SkeletonRow, ctl: number): number {
  const items = row.items.length ? row.items : [{}];
  const h =
    Math.max(...items.map((it) => skelItemHeight(it, ctl))) + skelLeadH(row);
  return row.framed ? h + SKEL_GAP * 2 : h;
}
/** A frame's height, independent of width: its header, its rows stacked with the gap, its own pad. */
function skelFrameHeight(frame: SkeletonFrame, inherited: number): number {
  const ctl = skelSizeH(frame, inherited);
  const rows = skelRows(frame);
  // A GROUP'S ENTRIES STAND UNDER ITS NAME, with a boundary's padding under the last (RULE.DEVEX.WORKSPACE.301).
  const entries = skelAccordionOf(frame);
  if (entries)
    return Math.max(
      skelHead(frame) + skelAccordionH(frame, entries, ctl) + SKEL_PAD,
      (frame.height ?? 0) * ctl,
    );
  // A CONTAINER'S PARTS STAND WITH NO GAP AND NO PADDING OF THE CONTAINER'S OWN: each part keeps its own.
  if (skelHasParts(frame))
    return Math.max(
      skelHead(frame) +
        skelParts(frame).reduce((t, p) => t + skelFrameHeight(p, ctl), 0),
      (frame.height ?? 0) * ctl,
    );
  const body =
    rows.reduce((t, r) => t + skelRowHeight(r, ctl), 0) +
    SKEL_GAP * Math.max(0, rows.length - 1);
  // A SECTION WITH A `size` STANDS ITS ROOM UNDER ITS CONTENT, as above it.
  return Math.max(
    skelHead(frame) + body + (skelSectionRoom(frame) ?? SKEL_PAD),
    (frame.height ?? 0) * ctl,
  );
}
/** The rows a frame lays out: its own, and under them the footer's where it is a container drawn for a surface. */
function skelSectionRows(section: SkeletonSection): SkeletonRow[] {
  const rows: SkeletonRow[] = [
    // A PART OF THE CONTENT HAS ITS OWN TITLE, with the actions of that part at its end, so an action stands beside what it acts on.
    ...(section.label !== undefined || section.actions?.length
      ? [
          {
            items: [
              ...(section.label !== undefined
                ? [{ text: section.label, part: true }]
                : []),
              { spacer: true },
              ...(section.actions ?? []),
            ],
          },
        ]
      : []),
    ...(section.rows ?? []),
  ];
  // A CONTENT PART IS BOUNDED BY NO BOX OF ITS OWN: a line across the container's box sets it apart, and the groups
  // inside it, each its own `sections` entry, draw their dotted boundary.
  if (section.part && section.unit === undefined)
    return [...rows, ...(section.sections ?? []).flatMap(skelSectionRows)];
  // A PART THAT IS A UNIT OF THE DESIGN SYSTEM carries its name at its corner, over its first row, and each of its rows
  // knows the part it stands in, so its boundary reaches round all of them. A PART WITH A TITLE AND NO UNIT IS A GROUP,
  // the level `GROUP`: it is bounded the same way and named by its level, so its title stands inside it.
  const within =
    section.unit ?? (section.label !== undefined ? SKEL_GROUP : undefined);
  if (within === undefined) return rows;
  return rows.map((row, i) => ({ ...row, within, lead: i === 0 }));
}
const skelRows = (frame: SkeletonFrame): SkeletonRow[] =>
  frame.look !== "container" && frame.look !== "card"
    ? (frame.rows ?? [])
    : [
        ...(frame.sections ?? []).flatMap(skelSectionRows),
        ...(frame.rows ?? []),
        ...(frame.footer ?? []),
      ];
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
    const count = skelSectionRows(section).length,
      own = (section.rows ?? []).length;
    const head = section.label !== undefined || section.actions?.length ? 1 : 0;
    if (section.divided)
      for (let r = head + 1; r < head + own; r++) at.add(index + r);
    index += count;
  });
  if (parts && (frame.rows ?? []).length && index > 0) at.add(index);
  if (frame.divided)
    for (let r = 1; r < (frame.rows ?? []).length; r++) at.add(index + r);
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
  if (
    (frame.rows ?? []).length &&
    index > 0 &&
    !(frame.sections ?? []).some((section) => section.part)
  )
    at.add(index);
  return at;
}
/** Whether a container drawn for a surface has a header: a title, or actions. */
const skelContainerHead = (frame: SkeletonFrame): number =>
  frame.label || frame.actions?.length
    ? frame.label && frame.note
      ? SKEL_CONTAINER_HEAD_TWO
      : SKEL_CONTAINER_HEAD
    : 0;
/** Where a container's header band begins, under the top of its outline: under its unit's name, or a step in. */
const skelContainerBandTop = (frame: SkeletonFrame): number =>
  frame.unit !== undefined ? SKEL_TAG_H : SKEL_LABEL_GAP;
/** Where a container's content begins under the top of its outline: the line under its header, or the outline itself
 *  where it has no header. */
const skelContainerEdge = (frame: SkeletonFrame): number =>
  skelContainerHead(frame)
    ? skelContainerBandTop(frame) + skelContainerHead(frame)
    : 0;
/** CONTENT THAT IS ONLY CARDS STANDS FLUSH: each card is its own box, so no box goes round them and they reach the
 *  container's edges, as a framed content does. */
const skelCardsOnly = (frame: SkeletonFrame): boolean => {
  const rows = skelRows(frame);
  return (
    frame.look === "container" &&
    rows.length > 0 &&
    rows.every((row) =>
      (row.items ?? []).every((item) => item.frame?.look === "card"),
    )
  );
};
/** How far a frame's rows stand in from its sides: its padding, or nothing where its content is only cards. */
const skelInset = (frame: SkeletonFrame): number =>
  skelCardsOnly(frame) ? 0 : SKEL_PAD;
/** The parts of a container: the one frame each of its rows holds. */
const skelParts = (frame: SkeletonFrame): SkeletonFrame[] =>
  (frame.rows ?? []).flatMap((r) =>
    r.items.length === 1 && r.items[0].frame ? [r.items[0].frame] : [],
  );
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
    return skelContainerHead(frame)
      ? skelContainerEdge(frame) + room
      : (frame.unit !== undefined ? SKEL_TAG_H : 0) + room;
  if (!frame.label) return Math.max(tag, SKEL_PAD);
  // A card whose title line holds an action stands a gap taller, so the action keeps clear of the first part under it.
  if (frame.look === "card")
    return (
      tag +
      (frame.note ? SKEL_CARD_HEAD_TWO : SKEL_CARD_HEAD_ONE) +
      (frame.actions?.length ? SKEL_LABEL_GAP * 2 : 0)
    );
  return tag + (frame.note ? SKEL_H_TWO : SKEL_H_ONE);
}
/** The left column every row of a frame shares, sized to the widest row label — or none at all. */
function skelLabelCol(frame: SkeletonFrame): number {
  const labels = skelRows(frame)
    .map((r) => r.label)
    .filter((l): l is string => !!l);
  return labels.length
    ? Math.ceil(Math.max(...labels.map((l) => l.length * SKEL_W_LABEL)))
    : 0;
}
/** The gap after item `i` of a row: a packed group (icon after icon, pager part after part) sits close. */
const skelGapAfter = (row: SkeletonRow, i: number) =>
  skelIconOnly(row.items[i]) &&
  row.items[i + 1] &&
  skelIconOnly(row.items[i + 1])
    ? SKEL_PACK_GAP
    : SKEL_GAP;
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
  if (kind === "standin" || kind === "slot")
    return Math.max(
      kind === "slot" ? skelTagW(it.slot!) : SKEL_LINES_W,
      SKEL_PAD * 2,
    );
  if (kind === "place")
    return Math.max(
      skelTagW(it.tag!),
      it.text !== undefined ? skelTextW(it.text) : 0,
      SKEL_PAD * 2,
    );
  if (kind === "control" && it.fill && !skelOwnWidth(it))
    return it.control === "field" ? SKEL_FIELD_W : skelTextW(it.text ?? "");
  if ((kind === "note" || kind === "control") && skelScrolls(it))
    return Math.min(SKEL_SCROLL_MIN, skelFixedWidth(it, ctl));
  if (kind === "note" && typeof it.note === "string")
    return skelWordsMinW(it.note, skelWordW);
  return skelFixedWidth(it, ctl);
}
/** Whether an item that keeps its own width gives some of it where its row runs past its room: an item line whose words wrap, a note, and
 *  code and a row of tabs, which scroll. */
const skelGives = (it: SkeletonItem): boolean => {
  const kind = skelKind(it);
  return (
    (kind === "item" &&
      !it.fill &&
      !skelStats.has(it) &&
      !skelItemInline(it) &&
      skelItemFacts(it).length > 0) ||
    (kind === "note" && typeof it.note === "string") ||
    (kind === "control" && it.control === "tabs")
  );
};
function skelRowMinWidth(row: SkeletonRow, ctl: number): number {
  const fractionOf = (it: SkeletonItem): number | undefined =>
    skelKind(it) === "frame" && it.frame!.width
      ? WIDTH_FRACTIONS[it.frame!.width]
      : undefined;
  const need = (it: SkeletonItem): number => skelItemNeed(it, ctl);
  let shares = 0,
    forShares = 0,
    others = 0;
  for (const it of row.items) {
    const fraction = fractionOf(it);
    if (fraction === undefined) {
      others += need(it);
      continue;
    }
    shares += fraction;
    forShares = Math.max(forShares, Math.ceil(need(it) / fraction));
  }
  const rest = others + skelRowGaps(row);
  const framed = row.framed ? SKEL_GAP * 2 : 0;
  const named = skelLeadH(row) ? skelTagW(row.within!) : 0;
  return Math.max(
    named,
    Math.max(
      forShares,
      shares > 0 && shares < 1 ? Math.ceil(rest / (1 - shares)) : rest,
    ) + framed,
  );
}
/** A frame's own minimum width: its padding, its label column, and its widest row's need. */
function skelFrameMinWidth(frame: SkeletonFrame, inherited: number): number {
  const ctl = skelSizeH(frame, inherited);
  const labelCol = skelLabelCol(frame);
  const head = Math.max(
    frame.label
      ? skelStepW(
          frame.label,
          frame.look === "container"
            ? SKEL_STEP_CONTAINER
            : frame.look === "card"
              ? SKEL_STEP_CARD
              : SKEL_STEP_PART,
        ) +
          (frame.look === "card" && frame.media !== undefined
            ? SKEL_CARD_MARK + SKEL_LABEL_GAP
            : 0)
      : 0,
    skelCornerName(frame) ? skelTagW(skelCornerName(frame)!) - SKEL_PAD : 0,
    frame.look === "container" && frame.unit !== undefined
      ? skelTagW(frame.unit) - SKEL_PAD
      : 0,
    frame.label && frame.note ? Math.ceil(frame.note.length * SKEL_W_NOTE) : 0,
  );
  // A CONTAINER'S OR A CARD'S HEADER HOLDS ITS ACTIONS AT THE END, so its title and its actions must both fit across.
  const headActions =
    (frame.look === "container" || frame.look === "card") &&
    frame.actions?.length
      ? SKEL_GAP +
        frame.actions.reduce((t, a) => t + skelFixedWidth(a, ctl), 0) +
        SKEL_LABEL_GAP * (frame.actions.length - 1)
      : 0;
  if (skelHasParts(frame))
    return Math.max(
      head + SKEL_PAD * 2,
      ...skelParts(frame).map((p) => skelFrameMinWidth(p, ctl)),
    );
  const entries = skelAccordionOf(frame);
  if (entries)
    return SKEL_PAD * 2 + Math.max(head, skelAccordionMinW(frame, entries));
  const widest = Math.max(
    0,
    ...skelRows(frame).map((r) => skelRowMinWidth(r, ctl)),
  );
  // THE WORDS OVER A BACKDROP KEEP TO THEIR MEASURE (RULE.DEVEX.WORKSPACE.305), so the feature is as wide as that measure needs.
  const backdrop = skelBackdropOf(frame),
    rows = backdrop ? Math.ceil(widest / backdrop.measure) : widest;
  return Math.max(
    SKEL_PAD * 2 + head + headActions,
    skelInset(frame) * 2 + (labelCol ? labelCol + SKEL_GAP : 0) + rows,
  );
}

/** Whether an item takes the rest of its row's width. */
const skelFlexes = (it: SkeletonItem): boolean => {
  const kind = skelKind(it);
  if (kind === "spacer" || kind === "head") return true;
  if (kind === "frame")
    return (
      it.frame!.width === undefined ||
      WIDTH_FRACTIONS[it.frame!.width] === undefined
    );
  return (
    !!it.fill &&
    kind !== "plain" &&
    kind !== "note" &&
    kind !== "icon" &&
    !skelOwnWidth(it)
  );
};

/**
 * Each item's width within a row of `available` pixels. An item's own width and a frame's fraction of
 * `available` are fixed; a `fill` item, a spacer or a frame named with no fraction takes an equal share of
 * what the fixed items and the row's own gaps leave over. An item with no shape a skeleton has, and a
 * `width` naming no fraction the spec has, are findings — the drawer still places something, rather than
 * leaving a gap nobody can explain.
 */
function skelRowWidths(
  row: SkeletonRow,
  available: number,
  ctl: number,
  findings: string[],
): number[] {
  const n = row.items.length;
  const widths: number[] = new Array(n).fill(0);
  const flex: number[] = [];
  let fixed = 0;
  row.items.forEach((it, i) => {
    const kind = skelKind(it);
    if (kind === null) {
      findings.push(
        "an item that is none of `text`, `note`, `slot`, `icon`, `control`, `standin`, `item`, `spacer` or `frame`",
      );
      return;
    }
    if (kind === "frame") {
      const w = it.frame!.width;
      if (w !== undefined && WIDTH_FRACTIONS[w] === undefined)
        findings.push(
          `a frame's \`width\` is \`${w}\`, and a skeleton takes one of ${Object.keys(WIDTH_FRACTIONS).join(" · ")}, or none for what is left`,
        );
      if (w !== undefined && WIDTH_FRACTIONS[w] !== undefined) {
        widths[i] = Math.round(available * WIDTH_FRACTIONS[w]);
        fixed += widths[i];
        return;
      }
      flex.push(i);
      return;
    }
    // A SLOT OR A PART ALONE IN ITS ROW IS THE ROW'S: it takes the row's width, as it takes the column's height with `fill`.
    if (skelFlexes(it) || (n === 1 && (kind === "slot" || kind === "place"))) {
      flex.push(i);
      return;
    }
    widths[i] = skelFixedWidth(it, ctl);
    fixed += widths[i];
  });
  // WHAT KEEPS ITS OWN WIDTH AND RUNS PAST THE ROW GIVES SOME OF IT (RULE.DEVEX.WORKSPACE.303, .304): an item line's words and a note wrap,
  // and code and a row of tabs scroll, each down to the least it takes, in the row's order. A row that fits draws as before.
  let over = fixed + skelRowGaps(row) - available;
  if (over > 0)
    row.items.forEach((it, i) => {
      if (
        over <= 0 ||
        flex.includes(i) ||
        skelKind(it) === null ||
        !skelGives(it)
      )
        return;
      const give = Math.min(over, widths[i] - skelItemNeed(it, ctl));
      if (give > 0) {
        widths[i] -= give;
        fixed -= give;
        over -= give;
      }
    });
  const left = Math.max(0, available - fixed - skelRowGaps(row));
  const share = flex.length ? Math.round(left / flex.length) : 0;
  for (const i of flex) widths[i] = share;
  return widths;
}

const skelRect = (
  cls: string,
  x: number,
  y: number,
  w: number,
  h: number,
  corner: SkelCorner,
) =>
  `  <rect class="${cls}" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${corner === "none" ? 0 : corner === "pill" ? r2(Math.min(w, h) / 2) : SKEL_CORNER[corner].px}"${corner === "none" || corner === "pill" ? "" : ` data-corner="${corner}"`}/>`;
const skelPath = (cls: string, points: [number, number][][]) =>
  `  <path class="${cls}" d="${points.map((line) => line.map(([px, py], i) => `${i ? "L" : "M"}${r2(px)} ${r2(py)}`).join(" ")).join(" ")}"/>`;

/** A frame's marks. The outer frame is the drawing's own edge; a part is a surface, a border or neither, and a part with no border of its own shows the dotted boundary. */
function skelMarks(
  look: string | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  card: SkelCorner = "frame",
): string[] {
  if (look === "bordered")
    return [skelRect("dl-line-edge", x, y, w, h, "frame")];
  // A CARD IS A THIN, ROUNDED OUTLINE with nothing behind it: a part with a title of its own, as a page draws one.
  if (look === "card") return [skelRect("dl-ctl", x, y, w, h, card)];
  if (look === "flat") return [skelRect("dl-frame-line", x, y, w, h, "frame")];
  return [
    skelRect("dl-sk-surface", x, y, w, h, "frame"),
    skelRect("dl-frame-line", x, y, w, h, "frame"),
  ];
}

/**
 * An icon is a few plain line shapes, drawn about the centre `(cx, cy)` in a box of `g` pixels. Every
 * point is written out in absolute numbers, so no transform hides a shape from the drawing's own fit.
 */
function skelGlyph(name: string, cx: number, cy: number, g: number): string[] {
  const u = g / 24,
    X = (v: number) => cx - g / 2 + v * u,
    Y = (v: number) => cy - g / 2 + v * u;
  const line = (...pts: number[][]): [number, number][] =>
    pts.map(([a, b]) => [X(a), Y(b)]);
  const stroke = (...lines: [number, number][][]) =>
    skelPath("dl-glyph", lines);
  const solid = (...lines: [number, number][][]) =>
    skelPath("dl-glyph dl-glyph-solid", lines);
  const dot = (a: number, b: number, rad: number) =>
    `  <circle class="dl-glyph dl-glyph-solid" cx="${r2(X(a))}" cy="${r2(Y(b))}" r="${r2(rad * u)}"/>`;
  switch (name) {
    case "close":
      return [stroke(line([6, 6], [18, 18]), line([18, 6], [6, 18]))];
    case "add":
      return [stroke(line([12, 5], [12, 19]), line([5, 12], [19, 12]))];
    case "menu":
      return [
        stroke(
          line([5, 7], [19, 7]),
          line([5, 12], [19, 12]),
          line([5, 17], [19, 17]),
        ),
      ];
    case "search":
      return [
        `  <circle class="dl-glyph" cx="${r2(X(10))}" cy="${r2(Y(10))}" r="${r2(6 * u)}"/>`,
        stroke(line([15, 15], [20, 20])),
      ];
    case "more":
      return [dot(5, 12, 1.6), dot(12, 12, 1.6), dot(19, 12, 1.6)];
    case "previous":
      return [stroke(line([14, 5], [7, 12], [14, 19]))];
    case "next":
      return [stroke(line([10, 5], [17, 12], [10, 19]))];
    case "select":
      return [stroke(line([6, 9], [12, 15], [18, 9]))];
    case "checkbox":
      return [stroke(line([8, 12], [11, 15], [16, 8]))];
    case "bell":
      return [
        solid(
          line(
            [12, 4],
            [16, 7],
            [17, 12],
            [19.5, 16],
            [4.5, 16],
            [7, 12],
            [8, 7],
            [12, 4],
          ),
        ),
        dot(12, 19, 1.6),
      ];
    case "person":
      return [
        dot(12, 8, 4),
        solid(line([4, 20], [6, 15], [12, 13], [18, 15], [20, 20], [4, 20])),
      ];
    // THE END ARROWS OF AN ITEM LINE, in `DSIconType`'s names: a line with its head, across, and up to the end where it leaves the site.
    case "ARROW_RIGHT":
      return [
        stroke(line([5, 12], [19, 12]), line([13, 6], [19, 12], [13, 18])),
      ];
    case "ARROW_UP_RIGHT":
      return [stroke(line([7, 17], [17, 7]), line([8, 7], [17, 7], [17, 16]))];
    default:
      return [dot(12, 12, 2)];
  }
}

/**
 * An icon in its slot, a square of side `h` about `(cx, cy)`. AN ACTION KEEPS ITS SQUARE, since it is pressed,
 * and an icon is an action unless the spec says it is a mark. A MARK IS DRAWN IN A CIRCLE: it stands for a
 * thing or a person, as a picture or a logo does, and it is `across` wide: as wide as the place it is in asks.
 * The default mark is a filled circle, or an empty one where `on` is false, as a provider that is there to be
 * set up and is not yet; any other mark is a circle that holds its shape.
 */
function skelIcon(
  name: string,
  cx: number,
  cy: number,
  h: number,
  mark: boolean,
  on?: boolean,
  across = h,
): string[] {
  const circle = (cls: string, r: number) =>
    `  <circle class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}"/>`;
  // A TILE THAT IS SET UP carries a small filled check at its top end corner, as a brand that is on does.
  const check =
    on === true
      ? [
          circle("dl-bar", 4).replace(
            `cx="${r2(cx)}" cy="${r2(cy)}"`,
            `cx="${r2(cx + h / 2)}" cy="${r2(cy - h / 2)}"`,
          ),
        ]
      : [];
  if (!mark)
    return [
      skelRect("dl-ctl", cx - h / 2, cy - h / 2, h, h, "ctl"),
      ...skelGlyph(name, cx, cy, Math.round(h / 2)),
      ...check,
    ];
  if (name === "default")
    return [circle(on === false ? "dl-ctl" : "dl-bar", across / 2)];
  return [
    circle("dl-ctl", across / 2),
    ...skelGlyph(name, cx, cy, Math.round(across / 2)),
  ];
}

/** ONE LINE OF FACTS, a dot between every two of them, a badge among them, from `fx` on the centre line `factsMid`: the whole line where
 *  it fits, or one of the lines it wraps to, which starts with no dot (RULE.DEVEX.WORKSPACE.303). A fact that is neither a word nor a badge
 *  is the finding `refusal`. */
function skelDrawFactLine(
  line: SkelFactLine,
  fx: number,
  factsMid: number,
  h: number,
  refusal: string,
  findings: string[],
  out: string[],
): void {
  line.forEach(({ fact, dot }) => {
    if (dot) {
      out.push(
        `  <text class="dl-detail" x="${r2(fx + 6)}" y="${Math.round(factsMid + 4)}">${SKEL_FACT_DOT}</text>`,
      );
      fx += SKEL_FACT_DOT_W;
    }
    if (typeof fact === "string")
      out.push(
        `  <text class="dl-detail" x="${r2(fx)}" y="${Math.round(factsMid + 4)}">${esc(fact)}</text>`,
      );
    else if (fact.control !== "badge") findings.push(refusal);
    else
      skelDrawLeaf(
        fact,
        "control",
        fx,
        factsMid - SKEL_FACT_CTL / 2,
        skelFixedWidth(fact, SKEL_FACT_CTL),
        SKEL_FACT_CTL,
        SKEL_FACT_CTL,
        SKEL_FACT_CTL,
        findings,
        out,
      );
    fx += skelFactW(fact, h);
  });
}

/** One item that is a leaf (a control, an icon, a slot, plain words, a stand-in), drawn at `(ix, iy)`, `iw` wide and `ih` tall. */
function skelDrawLeaf(
  it: SkeletonItem,
  kind: SkelKind,
  ix: number,
  iy: number,
  iw: number,
  ih: number,
  boxH: number,
  h: number,
  findings: string[],
  out: string[],
): void {
  const mid = iy + ih / 2;
  const baseline = Math.round(mid + 4);
  if (kind === "plain") {
    out.push(
      it.part
        ? skelStepText(it.text!, SKEL_STEP_PART, ix, baseline)
        : `  <text class="dl-name" x="${ix}" y="${baseline}">${esc(it.text!)}</text>`,
    );
    return;
  }
  if (kind === "note") {
    // A LINE OF CODE WIDER THAN ITS COLUMN KEEPS ITS WIDTH AND IS CUT AT THE COLUMN'S END, where the mark stands (RULE.DEVEX.WORKSPACE.304).
    if (
      skelCode.has(it) &&
      typeof it.note === "string" &&
      skelWordW(it.note) > iw
    ) {
      const shown = it.note.slice(
        0,
        Math.max(
          0,
          Math.floor((iw - SKEL_SCROLL_MARK - SKEL_PACK_GAP) / SKEL_W_LABEL),
        ),
      );
      out.push(
        `  <text class="dl-detail" x="${ix}" y="${baseline}">${esc(shown)}</text>`,
        ...skelScrollMark(ix + iw, mid),
      );
      return;
    }
    // A NOTE WIDER THAN ITS COLUMN WRAPS AT A WORD (RULE.DEVEX.WORKSPACE.303), its lines centred together where its row is taller.
    skelWrapKeep(it, iw);
    const lines = skelNoteLines(it);
    if (lines.length < 2) {
      out.push(
        `  <text class="dl-detail" x="${ix}" y="${baseline}">${esc(it.note!)}</text>`,
      );
      return;
    }
    lines.forEach((line, k) =>
      out.push(
        `  <text class="dl-detail" x="${ix}" y="${Math.round(mid + 4 - ((lines.length - 1) * SKEL_ITEM_LINE) / 2 + k * SKEL_ITEM_LINE)}">${esc(line)}</text>`,
      ),
    );
    return;
  }
  if (kind === "slot") {
    // A SLOT THAT IS A FEATURE'S MEDIA, WITH `frames` NAMING `MEDIA`, STANDS IN THE FEATURE'S FRAME, flush.
    const framed = skelItemFrames.get(it);
    out.push(
      ...(framed
        ? skelSurfaceMarks(framed, ix, iy, iw, ih)
        : skelMarks(undefined, ix, iy, iw, ih)),
    );
    out.push(
      `  <text class="dl-detail" x="${ix + SKEL_LABEL_GAP}" y="${iy + SKEL_LABEL_H + 4}">${esc(it.slot!)}</text>`,
    );
    return;
  }
  if (kind === "place") {
    out.push(...skelMarks(undefined, ix, iy, iw, ih));
    out.push(
      `  <text class="dl-detail" x="${ix + SKEL_LABEL_GAP}" y="${iy + SKEL_LABEL_H + 4}">${esc(it.tag!)}</text>`,
    );
    if (it.text !== undefined)
      out.push(
        `  <text class="dl-detail" x="${ix + SKEL_PAD}" y="${Math.round(iy + SKEL_TAG_H + (ih - SKEL_TAG_H) / 2 + 4)}">${esc(it.text)}</text>`,
      );
    return;
  }
  if (kind === "item") {
    // THE LINE OF AN ITEM: its media at the start, its title with its description under it, and what stands at its end.
    const item = it.item!;
    if (typeof item.title !== "string" || !item.title)
      findings.push(
        "an item line carries its `title`, and this one carries none",
      );
    // AN ITEM LINE IN A FRAME OF ITS OWN, as a feature's `items.surface` puts it: the frame round the line's place, as tall as
    // its row, and the line inside it at a boundary's padding, at the top.
    const boxed = skelItemFrames.get(it);
    if (boxed) out.push(...skelSurfaceMarks(boxed, ix, iy, iw, ih));
    // A STATISTIC (RULE.DEVEX.WORKSPACE.300): its title is the value, large and heavy, and its description the label under it, quiet, each
    // at its step one level below the feature's own. It draws nothing else, as the design system draws a statistic from these two.
    if (skelStats.has(it)) {
      const stat = skelStatOf(it),
        label = skelStatLabel(it);
      const drawn = (
        [
          "media",
          "meta",
          "end",
          "inline",
          "factsPlacement",
          "selected",
        ] as const
      ).filter((key) => item[key] !== undefined);
      if (drawn.length)
        skelSay(
          findings,
          `a statistic of \`items.type\` \`STATS\` draws its \`title\`, the value, and its \`description\`, the label under it, and nothing else; ${drawn.map((key) => `\`${key}\``).join(", ")} ${drawn.length > 1 ? "are" : "is"} not drawn`,
        );
      const lineX = boxed ? ix + SKEL_PAD : ix,
        lineW = boxed ? iw - SKEL_PAD * 2 : iw;
      const top = boxed ? iy + SKEL_PAD : iy + (ih - skelStatH(it)) / 2;
      const valueW = skelStepW(String(item.title ?? ""), stat.value),
        labelW =
          label !== undefined ? skelHeadDescriptionW(label, stat.label) : 0;
      // `textAlign` `CENTER` ON THE FEATURE'S HEAD CENTRES THE VALUE AND THE LABEL IN THEIR PLACE, each by its own measure.
      const startOf = (w: number) =>
        stat.centre ? lineX + (lineW - w) / 2 : lineX;
      const baseOf = (lineTop: number, size: number) =>
        Math.round(lineTop + (skelHeadLine(size) + size * 0.7) / 2);
      out.push(
        skelStepText(
          String(item.title ?? ""),
          stat.value,
          startOf(valueW),
          baseOf(top, stat.value),
        ),
      );
      if (label !== undefined)
        out.push(
          `  <text class="dl-detail" x="${r2(startOf(labelW))}" y="${baseOf(top + skelHeadLine(stat.value), stat.label)}">${esc(label)}</text>`,
        );
      return;
    }
    // THE CHOSEN LINE OF A FEATURE'S BOXED ITEMS KEEPS ITS FRAME AND DRAWS A HEAVIER LINE INSIDE ITS EDGE (RULE.DEVEX.WORKSPACE.298), as
    // `DSItemCard` marks a selected tile, so it keeps its size. The design system reads `selected` only where the items are boxed.
    if (item.selected !== undefined && typeof item.selected !== "boolean")
      skelSay(
        findings,
        `an item line's \`selected\` is \`${JSON.stringify(item.selected)}\`, and it takes true or false`,
      );
    else if (item.selected === true && !boxed)
      skelSay(
        findings,
        "`selected` marks the chosen item line of a `DSFeature` whose `items.surface` boxes its items, as the design system reads it only there, and this line stands in no box",
      );
    else if (item.selected === true && boxed) {
      const inner: SkelCorner = boxed.rounded === false ? "none" : "inset";
      out.push(skelRect("dl-ctl-on", ix + 2, iy + 2, iw - 4, ih - 4, inner));
    }
    const lineH = boxed ? skelItemH(it, h) : ih,
      lineX = boxed ? ix + SKEL_PAD : ix,
      lineW = boxed ? iw - SKEL_PAD * 2 : iw;
    const lineMid = boxed ? iy + SKEL_PAD + lineH / 2 : mid;
    // THE TITLE AND THE LINE UNDER IT ARE TOLD APART BY WEIGHT, SIZE AND SHADE: the title is of medium weight, the facts small and quiet.
    const facts = skelItemFacts(it),
      top = lineMid - lineH / 2;
    const inline = skelItemInline(it);
    // ITS WORDS WRAP TO WHAT ITS MEDIA AND ITS END LEAVE OF THE LINE (RULE.DEVEX.WORKSPACE.303), and the width is kept for its height.
    if (!inline) skelWrapKeep(item, skelItemWordsAt(it, h, lineW));
    const wraps = skelItemWrapH(it, h) > 0;
    const titleY =
      facts.length && !inline
        ? top + (lineH - (skelItemH(it, h) - SKEL_LABEL_GAP)) / 2 + 13
        : lineMid + 4;
    // MEDIA BESIDE WORDS THAT WRAP KEEPS ITS SIZE AND STANDS AT THE TOP, beside the title and the first line under it.
    const mediaMid = wraps ? top + skelItemBaseH(it, h) / 2 : lineMid;
    let wx = lineX;
    if (item.media !== undefined) {
      const media = skelItemMediaOf(item.media);
      if (skelMediaGiven(item.media)) {
        const given = item.media;
        if (!SKEL_ITEM_MEDIA.includes(given.mtype))
          skelSay(
            findings,
            `an item line's \`media\` is \`${String(given.mtype)}\`, and a skeleton draws ${SKEL_ITEM_MEDIA.join(" · ")} on an item line; a mark is drawn in its place`,
          );
        else if (!SKEL_ICONS.includes(media.shape))
          skelSay(
            findings,
            `an item's \`media\` names \`${media.shape}\`, and a skeleton draws ${SKEL_ICONS.join(" · ")}; \`default\` is drawn where none fits`,
          );
      } else if (!SKEL_ICONS.includes(item.media))
        findings.push(
          `an item's \`media\` is \`${item.media}\`, and a skeleton draws ${SKEL_ICONS.join(" · ")}; \`default\` is drawn where none fits`,
        );
      if (media.bare) {
        // A BARE ICON (RULE.DEVEX.WORKSPACE.294): as large as the title, on the title's first line, with nothing round it.
        const size = skelItemIconW(it);
        out.push(...skelGlyph(media.shape, lineX + size / 2, titleY - 4, size));
        wx = lineX + size + SKEL_LABEL_GAP;
      } else {
        const across = skelItemMediaD(it, h);
        out.push(
          ...skelIcon(
            media.shape,
            lineX + across / 2,
            mediaMid,
            h,
            true,
            undefined,
            across,
          ),
        );
        wx = lineX + across + SKEL_LABEL_GAP;
      }
    }
    // A NUMBERED ITEM'S NUMBER STANDS BEFORE ITS TITLE, quiet, at the title's size and weight (RULE.DEVEX.WORKSPACE.290).
    const number = skelItemNumber(it),
      step = skelItemStep(it);
    if (number !== undefined)
      out.push(
        `  <text class="dl-name" x="${r2(wx)}" y="${Math.round(titleY)}">${number}</text>`,
      );
    out.push(
      skelStepText(item.title ?? "", step, wx + skelItemNumberW(it), titleY),
    );
    // THE FACTS STAND ON ONE LINE, a dot between every two of them, a badge among them.
    const ownDescription = skelItemOwnDescription(it);
    // WORDS THAT RUN PAST THE LINE STAND ON THE LINES THEY WRAP TO (RULE.DEVEX.WORKSPACE.303): the description's, then the facts', each line
    // a step under the last.
    const wrapped: { description: string[]; facts: SkelFactLine[] } = inline
      ? {
          description: [],
          facts: [facts.map((fact, i) => ({ fact, dot: i > 0 }))],
        }
      : skelItemWrapped(it, h);
    const below = wrapped.description.length * SKEL_ITEM_LINE;
    // FACTS PLACED AFTER THE TITLE STAND UNDER IT AND OVER THE DESCRIPTION (RULE.DEVEX.WORKSPACE.296), as `factsPlacement` `AFTER_TITLE` puts
    // them; the two lines trade places and the item keeps its height. With no description of its own there is nothing to trade.
    if (
      item.factsPlacement !== undefined &&
      !SKEL_FACTS_PLACEMENTS.includes(item.factsPlacement)
    )
      skelSay(
        findings,
        `an item line's \`factsPlacement\` is \`${String(item.factsPlacement)}\`, and it takes ${SKEL_FACTS_PLACEMENTS.join(" · ")}`,
      );
    const afterTitle =
        item.factsPlacement === "AFTER_TITLE" && ownDescription !== undefined,
      badgeLine = skelItemHasBadge(it);
    const factStep = badgeLine ? SKEL_FACT_BADGE_STEP : SKEL_ITEM_LINE,
      factsBelow = Math.max(0, wrapped.facts.length - 1) * factStep;
    // AN INLINE ITEM'S FACTS STAND ON THE TITLE'S LINE, after the title and a dot.
    const factsMid = inline
      ? titleY - 4
      : (afterTitle ? 0 : below) +
        (badgeLine
          ? titleY + 5 + SKEL_PACK_GAP + SKEL_FACT_BADGE / 2
          : titleY + SKEL_ITEM_LINE - 4);
    const descriptionY = afterTitle
      ? factsMid +
        factsBelow +
        (badgeLine ? SKEL_FACT_BADGE / 2 + 13 : 4 + SKEL_ITEM_LINE)
      : titleY + SKEL_ITEM_LINE;
    wrapped.description.forEach((line, k) =>
      out.push(
        `  <text class="dl-detail" x="${r2(wx)}" y="${Math.round(descriptionY + k * SKEL_ITEM_LINE)}">${esc(line)}</text>`,
      ),
    );
    let fx = wx;
    if (inline) {
      fx += skelItemTitleW(it);
      out.push(
        `  <text class="dl-detail" x="${r2(fx + 6)}" y="${Math.round(factsMid + 4)}">${SKEL_FACT_DOT}</text>`,
      );
      fx += SKEL_FACT_DOT_W;
    }
    wrapped.facts.forEach((line, k) =>
      skelDrawFactLine(
        line,
        fx,
        factsMid + k * factStep,
        h,
        "a fact on the line under an item's title is a word or a badge",
        findings,
        out,
      ),
    );
    let ex = lineX + lineW - skelItemEndW(it, h);
    for (const part of item.end ?? []) {
      const partKind = skelKind(part),
        pw = skelFixedWidth(part, h);
      if (!SKEL_CELL_KINDS.includes(partKind))
        findings.push(
          "the end of an item line holds words, a note, an icon or a control",
        );
      // AN END ARROW IS DRAWN BARE, its shape alone in the place of an icon (RULE.DEVEX.WORKSPACE.297): it says where the line leads, and
      // nothing round it says it can be pressed apart from the line.
      else if (partKind === "icon" && SKEL_END_ARROWS.includes(part.icon!)) {
        out.push(
          ...skelGlyph(part.icon!, ex + h / 2, lineMid, Math.round(h / 2)),
        );
        if (part.text !== undefined)
          out.push(
            `  <text class="dl-detail" x="${ex + h + SKEL_LABEL_GAP}" y="${Math.round(lineMid + 4)}">${esc(part.text)}</text>`,
          );
      } else
        skelDrawLeaf(
          part,
          partKind!,
          ex,
          lineMid - h / 2,
          pw,
          h,
          h,
          h,
          findings,
          out,
        );
      ex += pw + SKEL_LABEL_GAP;
    }
    return;
  }
  if (kind === "head") {
    // A FEATURE'S HEAD: the eyebrow, the title and the description wrapped at a word to the head's width, and the facts.
    const head = skelHeadOf(it);
    const level = skelHeadLevel(head);
    if (typeof head.title !== "string" || !head.title)
      findings.push("a head carries its `title`, and this one carries none");
    if (
      head.pageLevel !== undefined &&
      !SKEL_HEAD_LEVELS.includes(head.pageLevel)
    )
      findings.push(
        `a head's \`pageLevel\` is \`${String(head.pageLevel)}\`, and a head takes ${SKEL_HEAD_LEVELS.join(" · ")}; \`CONTAINER\` is drawn where it is left out`,
      );
    if (
      head.textAlign !== undefined &&
      !SKEL_HEAD_ALIGNS.includes(head.textAlign)
    )
      findings.push(
        `a head's \`textAlign\` is \`${String(head.textAlign)}\`, and a head takes ${SKEL_HEAD_ALIGNS.join(" · ")}`,
      );
    const step = SKEL_HEAD_TITLE[level];
    const wide =
      typeof head.title === "string"
        ? head.title.split(/\s+/).find((word) => skelStepW(word, step) > iw)
        : undefined;
    if (wide !== undefined)
      findings.push(
        `the head \`${head.title}\` has a word wider than its column: \`${wide}\` needs ${skelStepW(wide, step)} across at ${step}px, and the column is ${r2(iw)}; a title wraps at a word, so a word that does not fit runs over its column`,
      );
    const known = skelHeadWidths.get(head);
    if (it.head === head)
      skelHeadWidths.set(head, known === undefined ? iw : Math.min(known, iw));
    // `textAlign` `CENTER` CENTRES EVERY LINE OF THE HEAD, each by its own measure.
    const centre = head.textAlign === "CENTER";
    const startOf = (w: number) => (centre ? ix + (iw - w) / 2 : ix);
    const { lines, factsTop, factLines, factStep, mediaBox, badgeTop } =
      skelHeadLayout(head, iw);
    // A HEAD'S MEDIA (RULE.DEVEX.WORKSPACE.294): a `MARK` or an `AVATAR` over its words, in its level's box; a feature at `PAGE` stands its
    // media beside its words, where a spec draws it as a slot.
    if (head.media !== undefined) {
      const given = head.media;
      if (!skelMediaGiven(given) || !SKEL_HEAD_MEDIA.includes(given.mtype))
        skelSay(
          findings,
          `a head's \`media\` is a \`MARK\` or an \`AVATAR\`, in \`IDSItemMedia\`'s shape, and this one is \`${JSON.stringify(given)}\``,
        );
      else if (level === "PAGE")
        skelSay(
          findings,
          "a feature at `PAGE` stands its media beside its words and never over them, so a head at `PAGE` draws no `media`: draw it as a slot beside the head",
        );
      else if (
        given.mtype === "MARK" &&
        !SKEL_ICONS.includes(given.icon ?? "default")
      )
        skelSay(
          findings,
          `a head's \`media\` names \`${given.icon}\`, and a skeleton draws ${SKEL_ICONS.join(" · ")}; \`default\` is drawn where none fits`,
        );
      else if (
        given.mtype === "AVATAR" &&
        (typeof given.title !== "string" || !given.title.trim())
      )
        skelSay(
          findings,
          "a head's `AVATAR` carries the name it stands for in `title`, and draws its initials",
        );
    }
    if (mediaBox) {
      const given = head.media!,
        cx = startOf(mediaBox) + mediaBox / 2,
        cy = iy + mediaBox / 2;
      // AN AVATAR WITH NO PICTURE SHOWS ITS INITIALS in a circle; a mark is a circle that holds its shape, as every mark is.
      if (given.mtype === "AVATAR")
        out.push(
          `  <circle class="dl-ctl" cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(mediaBox / 2)}"/>`,
          `  <text class="dl-name" x="${r2(cx)}" y="${Math.round(cy + 5)}" text-anchor="middle">${esc(skelInitials(String(given.title ?? "")))}</text>`,
        );
      else
        out.push(
          ...skelIcon(
            given.icon ?? "default",
            cx,
            cy,
            mediaBox,
            true,
            undefined,
            mediaBox,
          ),
        );
    }
    // A HEAD'S EYEBROW IS WORDS OR A BADGE (RULE.DEVEX.WORKSPACE.295): a badge stands as a badge among the facts does, packed above the title.
    if (
      head.eyebrow !== undefined &&
      typeof head.eyebrow !== "string" &&
      !skelHeadBadge(head)
    )
      skelSay(
        findings,
        'a head\'s `eyebrow` is words, drawn in small capitals, or a badge, `{ "control": "badge", "text": … }`, drawn as a badge among the facts',
      );
    const badge = skelHeadBadge(head);
    if (badge && badgeTop !== undefined) {
      const bw = skelFixedWidth(badge, SKEL_FACT_CTL);
      skelDrawLeaf(
        badge,
        "control",
        startOf(bw),
        iy + badgeTop + SKEL_HEAD_BADGE_LINE / 2 - SKEL_FACT_CTL / 2,
        bw,
        SKEL_FACT_CTL,
        SKEL_FACT_CTL,
        SKEL_FACT_CTL,
        findings,
        out,
      );
    }
    for (const line of lines) {
      const lineBase = Math.round(
        iy + line.top + (skelHeadLine(line.size) + line.size * 0.7) / 2,
      );
      if (line.part === "title")
        out.push(
          skelStepText(line.words, line.size, startOf(line.w), lineBase),
        );
      else
        out.push(
          `  <text class="${line.part === "eyebrow" ? "dl-label" : line.part === "title" ? "dl-name" : "dl-detail"}" x="${r2(startOf(line.w))}" y="${lineBase}">${esc(line.words)}</text>`,
        );
    }
    // THE FACTS STAND ON ONE LINE UNDER THE DESCRIPTION, as an item's `meta` stands under its title, and on the lines they wrap to where
    // they run past the column, each line centred by its own measure with `textAlign` `CENTER` (RULE.DEVEX.WORKSPACE.303).
    if (factsTop !== undefined)
      factLines.forEach((line, k) =>
        skelDrawFactLine(
          line,
          startOf(skelFactLineW(line, h)),
          iy + factsTop + SKEL_ITEM_LINE / 2 + k * factStep,
          h,
          "a fact under a head is a word or a badge",
          findings,
          out,
        ),
      );
    return;
  }
  if (kind === "icon") {
    if (SKEL_END_ARROWS.includes(it.icon!))
      skelSay(
        findings,
        `\`${it.icon}\` is the end arrow of an item line, and stands in its \`end\`; an icon elsewhere is one of ${SKEL_ICONS.join(" · ")}`,
      );
    else if (!SKEL_ICONS.includes(it.icon!))
      findings.push(
        `an icon is \`${it.icon}\`, and a skeleton draws ${SKEL_ICONS.join(" · ")}; \`default\` is drawn where none fits`,
      );
    const mark = it.mark ?? it.on !== undefined;
    out.push(
      ...skelIcon(
        it.icon!,
        ix + h / 2,
        mid,
        h,
        mark,
        it.on,
        mark && it.mark !== true ? h - SKEL_MARK_DROP : h,
      ),
    );
    if (it.text !== undefined)
      out.push(
        `  <text class="dl-detail" x="${ix + h + SKEL_LABEL_GAP}" y="${baseline}">${esc(it.text)}</text>`,
      );
    return;
  }
  if (kind === "control") {
    const text = it.text ?? "";
    if (!SKEL_CONTROLS.includes(it.control!))
      findings.push(
        `a control is \`${it.control}\`, and a skeleton draws ${SKEL_CONTROLS.join(" · ")}`,
      );
    if (it.tag !== undefined)
      findings.push(
        `a control carries no tag: \`${it.tag}\` names a component, a part or a slot, and a control is told by its sample value`,
      );
    if (text.includes("\n"))
      findings.push(
        "a control stands on one line, and its sample value runs over more",
      );
    const cls = it.main ? "dl-ctl-on" : "dl-ctl";
    if (
      it.icon !== undefined &&
      skelOwnWidth(it) &&
      !SKEL_ICONS.includes(it.icon)
    )
      findings.push(
        `an icon is \`${it.icon}\`, and a skeleton draws ${SKEL_ICONS.join(" · ")}; \`default\` is drawn where none fits`,
      );
    if (it.control === "switch") {
      // ON OR OFF IS TOLD BY WHERE THE KNOB STANDS, and by its weight: at the end and solid when on, at the start and hollow when off.
      const trackH = h - SKEL_SWITCH_DROP,
        trackW = skelSwitchW(h),
        knob = trackH / 2 - 3;
      out.push(
        skelRect("dl-ctl", ix, mid - trackH / 2, trackW, trackH, "pill"),
      );
      out.push(
        `  <circle class="dl-glyph${it.on ? " dl-glyph-solid" : ""}" cx="${r2(it.on ? ix + trackW - trackH / 2 : ix + trackH / 2)}" cy="${r2(mid)}" r="${r2(knob)}"/>`,
      );
      if (text)
        out.push(
          `  <text class="dl-detail" x="${ix + trackW + SKEL_LABEL_GAP}" y="${baseline}">${esc(text)}</text>`,
        );
      return;
    }
    if (it.control === "tabs") {
      // TABS AT THE PAGE LEVEL ARE PILLS; TABS INSIDE A CONTAINER, A CARD OR A WIDGET ARE THE LINE. The chosen tab is
      // heavier in both. Each word keeps its place in the row either way, so the pill reaches out into the gap around it.
      // THE LINE: a thin line runs under the whole row, as the rule of a tab list does, and the chosen word has a heavier one.
      const words = skelTabWords(it);
      const chosen = it.chosen ?? 0;
      if (!words.length) {
        findings.push(
          "a row of tabs names its words in `tabs`, and this one names none",
        );
        return;
      }
      if (!Number.isInteger(chosen) || chosen < 0 || chosen >= words.length)
        findings.push(
          `\`chosen\` is \`${chosen}\`, and this row has ${words.length} tabs, counted from 0`,
        );
      if (words.some((word) => word.includes("\n")))
        findings.push(
          "a control stands on one line, and a tab's word runs over more",
        );
      // A ROW OF TABS THAT NAMES ITS `type` IS DRAWN IN IT WHEREVER IT STANDS (RULE.DEVEX.WORKSPACE.302), as `DSTabs` draws the type a page
      // names: `PILL` the pills, as the second form of a choice to see sets them over its panel inside a feature, and `LINE` the line.
      if (it.type !== undefined && !SKEL_TABS_TYPES.includes(it.type))
        skelSay(
          findings,
          `a row of tabs' \`type\` is \`${String(it.type)}\`, and a skeleton draws ${SKEL_TABS_TYPES.join(" · ")}; the level's look is drawn in its place`,
        );
      const pill = it.type === "PILL" || (it.type !== "LINE" && !!it.atPage);
      const foot = iy + h - 1;
      // THE PILL'S TRACK STARTS WHERE THE ROW STARTS, so its edge lines up with the page head and the parts under it;
      // its words stand in from that edge by the pill's padding and the track's.
      const pillPad = SKEL_LABEL_GAP,
        trackPad = 3;
      const inset = pill ? pillPad + trackPad : 0;
      // A ROW OF TABS WIDER THAN ITS COLUMN KEEPS ITS WIDTH AND SCROLLS (RULE.DEVEX.WORKSPACE.304), as `DSTabs` scrolls it in `DSHScroll`: it is
      // cut at the column's end, the tabs that stand whole before the mark are drawn, and the mark stands at the edge that has more.
      const cut = iw + 0.5 < skelFixedWidth(it, h),
        shownTo = ix + iw - SKEL_SCROLL_MARK - SKEL_PACK_GAP;
      const shows = (from: number, w: number) => !cut || from + w <= shownTo;
      if (pill) {
        // THE PILL: a muted rounded track with an outline holds the words, and the chosen one stands in a filled pill.
        const pillH = h - trackPad * 2,
          trackW = cut ? iw : iw + inset * 2;
        out.push(skelRect("dl-sk-surface", ix, iy, trackW, h, "pill"));
        out.push(skelRect("dl-ctl", ix, iy, trackW, h, "pill"));
        let px = ix + inset;
        words.forEach((word, index) => {
          if (
            index === chosen &&
            shows(px - pillPad, skelTabW(it, word) + pillPad * 2)
          )
            out.push(
              skelRect(
                "dl-ctl",
                px - pillPad,
                iy + trackPad,
                skelTabW(it, word) + pillPad * 2,
                pillH,
                "pill",
              ),
            );
          px += skelTabW(it, word) + SKEL_GAP;
        });
      } else
        out.push(
          `  <path class="dl-ctl" d="M${r2(ix)} ${r2(foot)} H${r2(ix + iw)}"/>`,
        );
      let tx = ix + inset;
      words.forEach((word, index) => {
        const tw = skelTabW(it, word);
        if (shows(tx, tw)) {
          if (it.icon !== undefined)
            out.push(
              ...skelGlyph(
                it.icon,
                tx + SKEL_INLINE_ICON / 2,
                mid,
                SKEL_INLINE_ICON,
              ),
            );
          out.push(
            `  <text class="${index === chosen ? "dl-name" : "dl-detail"}" x="${r2(tx + skelInlineIconW(it))}" y="${baseline}">${esc(word)}</text>`,
          );
          if (index === chosen && !pill)
            out.push(
              `  <path class="dl-line-edge" d="M${r2(tx)} ${r2(foot)} H${r2(tx + tw)}"/>`,
            );
        }
        tx += tw + SKEL_GAP;
      });
      if (cut)
        out.push(...skelScrollMark(ix + iw - (pill ? trackPad : 0), mid));
      return;
    }
    if (it.control === "badge") {
      // A SMALL FRAMED WORD, LOWER THAN A BUTTON AND NEVER HEAVY, so nobody reads it as something to press.
      if (!text)
        findings.push(
          "a badge carries its word in `text`, and this one carries none",
        );
      if (it.main)
        findings.push(
          "a badge never takes the weight of a main action; leave `main` off a badge",
        );
      const badgeH = h - SKEL_BADGE_DROP;
      out.push(skelRect("dl-ctl", ix, mid - badgeH / 2, iw, badgeH, "badge"));
      if (it.icon !== undefined)
        out.push(
          ...skelGlyph(
            it.icon,
            ix + SKEL_LABEL_GAP + SKEL_INLINE_ICON / 2,
            mid,
            SKEL_INLINE_ICON,
          ),
        );
      if (text)
        out.push(
          `  <text class="dl-detail" x="${r2(ix + SKEL_LABEL_GAP + skelInlineIconW(it))}" y="${baseline}">${esc(text)}</text>`,
        );
      return;
    }
    if (it.control === "pager") {
      let px = ix;
      for (const part of skelPagerParts(it)) {
        const pw = skelPartW(part, h);
        out.push(skelRect(cls, px, iy, pw, h, "ctl"));
        if (part === "‹" || part === "›")
          out.push(
            ...skelGlyph(
              part === "‹" ? "previous" : "next",
              px + pw / 2,
              mid,
              Math.round(h / 2),
            ),
          );
        else
          out.push(
            `  <text class="dl-detail" x="${r2(px + (pw - part.length * SKEL_W_LABEL) / 2)}" y="${baseline}">${esc(part)}</text>`,
          );
        px += pw + SKEL_PACK_GAP;
      }
      return;
    }
    if (it.control === "checkbox") {
      out.push(skelRect(cls, ix, iy, h, h, "ctl"));
      out.push(...skelGlyph("checkbox", ix + h / 2, mid, Math.round(h / 2)));
      if (text)
        out.push(
          `  <text class="dl-detail" x="${ix + h + SKEL_LABEL_GAP}" y="${baseline}">${esc(text)}</text>`,
        );
      return;
    }
    out.push(skelRect(cls, ix, iy, iw, h, "ctl"));
    if (text)
      out.push(
        `  <text class="dl-detail" x="${ix + SKEL_PAD}" y="${baseline}">${esc(text)}</text>`,
      );
    if (it.control === "select")
      out.push(
        ...skelGlyph("select", ix + iw - SKEL_PAD - 4, mid, Math.round(h / 2)),
      );
    return;
  }
  // a stand-in: bars with no box around them
  const count = Math.max(1, it.lines ?? 3);
  const kindOf = it.standin ?? "rows";
  if (!SKEL_STANDINS.includes(kindOf))
    findings.push(
      `a stand-in is \`${kindOf}\`, and a skeleton draws ${SKEL_STANDINS.join(" · ")}`,
    );
  const bar = (x: number, y: number, w: number, hh: number) =>
    skelRect("dl-bar", x, y, w, hh, "pill");
  if (kindOf === "table") {
    // A TABLE WITH SAMPLE VALUES: a head row of words, a line under it, and a few rows of cells. The room over is
    // shared by the columns that hold data; a column with an empty head holds the actions of a row and stands at the end.
    const columns = Array.isArray(it.columns) ? it.columns.map(String) : [];
    const rows = Array.isArray(it.cells) ? it.cells : [];
    if (!columns.length) {
      findings.push(
        "a table names the words of its head row in `columns`, and this one names none",
      );
      return;
    }
    const widths = skelTableColumns(it, h);
    const data = columns
      .map((head, c) => (head === "" ? -1 : c))
      .filter((c) => c >= 0);
    const over = Math.max(0, iw - skelTableW(it, h));
    if (data.length) for (const c of data) widths[c] += over / data.length;
    const left: number[] = [];
    let cx = ix + SKEL_PAD;
    widths.forEach((w, c) => {
      left.push(cx);
      cx += w + SKEL_GAP;
    });
    if (!data.length)
      left.forEach((_, c) => {
        left[c] += over;
      });
    const headY = iy + SKEL_PAD;
    // THE HEAD ROW OF A FLUSH TABLE IS A BAND, with its words small and in capitals, as the library's table draws it.
    // The band begins at the edge above the table, the outline or the line over its part, and its words stand at its middle.
    const headLine = headY + SKEL_TABLE_HEAD - 4,
      bandTop = it.flush ? (it.edgeTop ?? iy) : iy;
    // A FLUSH TABLE IN A PART THAT IS A UNIT reaches that part's boundary, which stands inside the outline.
    const reach = SKEL_PAD - (it.inPart ? SKEL_LABEL_GAP : 0);
    if (it.flush)
      out.push(
        skelRect(
          "dl-sk-surface",
          ix - reach,
          bandTop,
          iw + reach * 2,
          headLine - bandTop,
          "none",
        ),
      );
    columns.forEach((head, c) => {
      if (head)
        out.push(
          it.flush
            ? `  <text class="dl-label" x="${r2(left[c])}" y="${Math.round((bandTop + headLine) / 2 + 4)}">${esc(head.toUpperCase())}</text>`
            : `  <text class="dl-name" x="${r2(left[c])}" y="${Math.round(headY + 12)}">${esc(head)}</text>`,
        );
    });
    // A FLUSH TABLE REACHES THE OUTLINE OF ITS CONTAINER: the line under its head row and a line under each row
    // run from edge to edge, as a table does that is the whole of a container's content.
    const lineFrom = it.flush ? ix - reach : ix + SKEL_PAD,
      lineTo = it.flush ? ix + iw + reach : ix + iw - SKEL_PAD;
    out.push(
      `  <path class="dl-ctl" d="M${r2(lineFrom)} ${r2(headY + SKEL_TABLE_HEAD - 4)} H${r2(lineTo)}"/>`,
    );
    if (it.flush)
      for (let r = 1; r < rows.length; r++)
        out.push(
          `  <path class="dl-ctl" d="M${r2(lineFrom)} ${r2(headY + SKEL_TABLE_HEAD + r * skelTableRowH(h) - 2)} H${r2(lineTo)}"/>`,
        );
    rows.forEach((row, r) => {
      if (!Array.isArray(row)) {
        findings.push(
          "a row of a table is a list of cells, one for each column",
        );
        return;
      }
      if (row.length > columns.length)
        findings.push(
          `a row of a table holds ${row.length} cells, and the table has ${columns.length} columns`,
        );
      const top =
        headY + SKEL_TABLE_HEAD + r * skelTableRowH(h) + SKEL_TABLE_ROW_PAD;
      row.slice(0, columns.length).forEach((given, c) => {
        const cell = skelCell(given),
          cellKind = skelKind(cell);
        if (cellKind === "note" && cell.note === "") return;
        if (!SKEL_CELL_KINDS.includes(cellKind)) {
          findings.push(
            "a cell of a table is a word, a note, an icon or a control",
          );
          return;
        }
        // A box in a cell that takes `fill` is as wide as its column, so the action that saves it stands beside it.
        const cw =
          cell.fill && columns[c] !== "" ? widths[c] : skelFixedWidth(cell, h);
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
      out.push(skelRect("dl-ctl", cx, iy, cardW, SKEL_CARD_H, "frame"));
      out.push(
        bar(
          cx + SKEL_PAD,
          iy + SKEL_PAD,
          (cardW - SKEL_PAD * 2) * 0.5,
          SKEL_HEAD_BAR,
        ),
      );
      out.push(
        bar(
          cx + SKEL_PAD,
          iy + SKEL_PAD + SKEL_BAR_STEP + 4,
          cardW - SKEL_PAD * 2,
          SKEL_BAR,
        ),
      );
      out.push(
        bar(
          cx + SKEL_PAD,
          iy + SKEL_PAD + SKEL_BAR_STEP * 2 + 4,
          (cardW - SKEL_PAD * 2) * 0.7,
          SKEL_BAR,
        ),
      );
    }
    return;
  }
  if (kindOf === "field") {
    // THE FIELD OF A FORM, AS THE LIBRARY'S FORM FIELD LAYS IT OUT: its title, with the mark of its help at the end of that line;
    // its control, as wide as its place; and one line under the control, its error or else its description.
    // An error is told by the failure colour, on the outline of the control and on its own line.
    const top = iy + skelFieldHeadH(it) + SKEL_LABEL_GAP,
      below = skelFieldBelow(it);
    if (it.label === undefined)
      out.push(bar(ix, iy, Math.min(iw, SKEL_FIELD_W) * 0.4, SKEL_HEAD_BAR));
    else {
      // The title of a field that is entered has the weight of content. The title of one that is read is heavier and
      // lighter in tone than its value, so it reads as the heading of the value and does not compete with it; the mark
      // of its help stands beside it, where the entered field's stands at the end of the line.
      out.push(
        it.read
          ? `  <text class="dl-name" x="${r2(ix)}" y="${Math.round(iy + 13)}">${esc(it.label)}</text>`
          : `  <text class="dl-detail" x="${r2(ix)}" y="${Math.round(iy + 13)}">${esc(it.label)}</text>`,
      );
      if (it.info) {
        const cx = it.read
          ? ix + skelStepW(it.label, SKEL_STEP_ITEM) + SKEL_LABEL_GAP + 6
          : ix + iw - 6;
        out.push(
          `  <circle class="dl-glyph" cx="${r2(cx)}" cy="${r2(iy + 9)}" r="6"/>`,
        );
        out.push(
          `  <text class="dl-label" x="${r2(cx)}" y="${r2(iy + 12.5)}" text-anchor="middle">I</text>`,
        );
      }
    }
    if (it.read) {
      // A FIELD THAT IS READ, AS THE LIBRARY'S DATA UNIT SHOWS IT: its value under its title, with no box around it.
      const valueMid =
          iy + skelFieldHeadH(it) + SKEL_PACK_GAP + SKEL_READ_LINE / 2,
        text = it.text ?? "";
      if (it.label === undefined)
        findings.push(
          "a field that is read carries its title in `label`, and this one carries none",
        );
      if (it.control === "badge") {
        const badge: SkeletonItem = { control: "badge", text };
        skelDrawLeaf(
          badge,
          "control",
          ix,
          valueMid - SKEL_FACT_CTL / 2,
          skelFixedWidth(badge, SKEL_FACT_CTL),
          SKEL_FACT_CTL,
          SKEL_FACT_CTL,
          SKEL_FACT_CTL,
          findings,
          out,
        );
      } else
        out.push(
          `  <text class="dl-detail" x="${r2(ix)}" y="${Math.round(valueMid + 4)}">${esc(text)}</text>`,
        );
      return;
    }
    const failed = it.error !== undefined;
    out.push(
      skelRect(failed ? "dl-line-warn" : "dl-ctl", ix, top, iw, h, "ctl"),
    );
    if (it.text !== undefined)
      out.push(
        `  <text class="dl-detail" x="${ix + SKEL_PAD}" y="${Math.round(top + h / 2 + 4)}">${esc(it.text)}</text>`,
      );
    if (it.control === "select")
      out.push(
        ...skelGlyph(
          "select",
          ix + iw - SKEL_PAD - 4,
          top + h / 2,
          Math.round(h / 2),
        ),
      );
    if (below !== undefined)
      out.push(
        `  <text class="${failed ? "dl-detail dl-detail-warn" : "dl-detail"}" x="${r2(ix)}" y="${Math.round(top + h + SKEL_PACK_GAP + 13)}">${esc(below)}</text>`,
      );
    return;
  }
  const heads = new Set(it.headings ?? []);
  let by = iy + SKEL_PAD;
  for (let b = 0; b < count; b++) {
    const head = heads.has(b);
    if (kindOf === "list") {
      out.push(bar(ix + SKEL_PAD, by, SKEL_BAR, SKEL_BAR));
      out.push(
        bar(
          ix + SKEL_PAD + SKEL_BAR + SKEL_LABEL_GAP,
          by,
          (iw - SKEL_PAD * 2 - SKEL_BAR - SKEL_LABEL_GAP) * (head ? 0.42 : 0.7),
          head ? SKEL_HEAD_BAR : SKEL_BAR,
        ),
      );
    } else
      out.push(
        bar(
          ix + SKEL_PAD,
          by,
          (iw - SKEL_PAD * 2) * (head ? 0.42 : 1),
          head ? SKEL_HEAD_BAR : SKEL_BAR,
        ),
      );
    by += SKEL_BAR_STEP;
  }
}

/** Whether a row's one item takes the height left in its column: a frame, a slot or a part, with `fill`. */
const skelGrows = (row: SkeletonRow): boolean => {
  if (row.items.length !== 1) return false;
  const it = row.items[0],
    kind = skelKind(it);
  return kind === "frame"
    ? !!it.frame!.fill
    : (kind === "slot" || kind === "place") && !!it.fill;
};

/** What a container's own props say, checked: each one a reader maps to one of the four. */
function skelContainerFindings(
  frame: SkeletonFrame,
  parts: SkeletonFrame[],
  findings: string[],
): void {
  const names = parts.map((p) => p.tag);
  if (!Array.isArray(frame.frames)) {
    findings.push(
      "`frames` is the list of the parts that share a frame, by their `tag`",
    );
    return;
  }
  for (const named of frame.frames)
    if (!names.includes(named))
      findings.push(
        `\`frames\` names \`${named}\`, and no part of this container has that \`tag\``,
      );
  if (frame.frames.length && !frame.raised && !frame.bordered)
    findings.push(
      "`frames` lists parts, and the frame is neither `raised` nor `bordered`; a part not in a frame is flat, so leave it out of `frames`",
    );
  if (
    (frame.rows ?? []).some((r) => !(r.items.length === 1 && r.items[0].frame))
  )
    findings.push(
      "a container's rows each hold one part, a `frame` with a `tag`",
    );
  for (const part of parts) {
    if (!part.tag)
      findings.push(
        "a part of a container carries a name; give the part its `tag`",
      );
    if (part.look !== undefined)
      findings.push(
        `the part \`${part.tag ?? ""}\` takes its frame from the container's \`frames\`; leave \`look\` off a part`,
      );
  }
}

/** One frame, drawn at `(x, y)`. `forcedW` is given for a frame nested in a row; the outer frame
 *  sizes itself from its own rows instead. `named` counts the named boundaries that hold this one.
 *  `inherited` is the control height of the frame that holds this one, and a `bare` part leaves its
 *  marks to the container that holds it. `canvas` is the width an outer frame is drawn at: the grid's
 *  content width for a spec with one frame, and the width of its screen class for a view. */
function skelDrawFrame(
  frame: SkeletonFrame,
  x: number,
  y: number,
  forcedW: number | undefined,
  findings: string[],
  out: string[],
  forcedH?: number,
  named = 0,
  inherited = SKEL_DEFAULT_H,
  bare = false,
  canvas = SKEL_CANVAS,
): void {
  const root = forcedW === undefined;
  skelOldFields(frame, findings);
  if (frame.size !== undefined && SKEL_CONTROL_H[frame.size] === undefined)
    findings.push(
      `a \`size\` is \`${frame.size}\`, and a skeleton takes ${Object.keys(SKEL_CONTROL_H).join(" · ")}`,
    );
  const ctl = skelSizeH(frame, inherited);
  const isContainer = skelHasParts(frame);
  const rows = skelRows(frame);
  // AN ITEM THAT STANDS ON THE PAGE ITSELF IS THE PAGE'S HEADER: it names the record the page is about, so its
  // title is as large and as heavy as a container's, and not the title of one thing among many.
  // Where the page level stands above the frame, it is the head of the page, and an item in the frame is not.
  if (root && !frame.headed)
    for (const row of rows)
      for (const it of row.items ?? []) if (it.item) it.part = true;
  // TABS IN THE ROOT FRAME'S ROWS STAND AT THE PAGE LEVEL, as the page head's actions do (they are the root frame's own row).
  if (root)
    for (const row of rows)
      for (const it of row.items ?? [])
        if (it.control === "tabs") it.atPage = true;
  const parts = skelParts(frame);
  const entries = skelAccordionOf(frame);
  if (isContainer) skelContainerFindings(frame, parts, findings);
  // A `DSAccordionGroup` THAT DRAWS ITS ENTRIES TAKES `bordered` AS ITS OWN, an outline round each entry (RULE.DEVEX.WORKSPACE.301).
  else if (
    frame.raised !== undefined ||
    (frame.bordered !== undefined && entries === undefined) ||
    frame.rounded !== undefined
  )
    findings.push(
      "`raised`, `bordered` and `rounded` belong to a frame with `frames`; a frame that stands alone takes `look`",
    );
  const labelCol = skelLabelCol(frame);
  const inset = skelInset(frame);
  const rowContentW =
    forcedW !== undefined
      ? Math.max(0, forcedW - inset * 2 - (labelCol ? labelCol + SKEL_GAP : 0))
      : Math.max(
          SKEL_MIN_W,
          canvas - inset * 2 - (labelCol ? labelCol + SKEL_GAP : 0),
          ...rows.map((r) => skelRowMinWidth(r, ctl)),
        );
  const w =
    forcedW !== undefined
      ? forcedW
      : isContainer
        ? Math.max(canvas - SKEL_PAD * 2, skelFrameMinWidth(frame, inherited))
        : inset * 2 + (labelCol ? labelCol + SKEL_GAP : 0) + rowContentW;
  // A FRAME IN A ROW STANDS AS TALL AS THE ROW, so a rail and the main area beside it end on one line.
  const natural = skelFrameHeight(frame, inherited);
  const h = Math.max(natural, forcedH ?? 0);

  if (frame.look !== undefined && !SKEL_LOOKS.includes(frame.look))
    findings.push(
      `a frame's \`look\` is \`${frame.look}\`, and a frame takes ${SKEL_LOOKS.join(" · ")}`,
    );
  if (
    frame.look !== undefined &&
    frame.look !== "container" &&
    !frame.tag &&
    frame.unit === undefined &&
    !frame.label &&
    !root
  )
    findings.push(
      `a boundary with a \`look\` of \`${frame.look}\` carries no name; give the part its \`tag\``,
    );
  const ownName = frame.tag ?? frame.unit;
  if (ownName && named >= SKEL_NEST_MAX)
    findings.push(
      `the boundary \`${ownName}\` sits inside ${named} named boundaries, and a skeleton nests ${SKEL_NEST_MAX} at most; draw \`${ownName}\` as a skeleton of its own`,
    );
  // A CONTAINER HAS NO BOX OF ITS OWN: its frames are drawn behind its parts, below.
  // A CONTAINER ON A SURFACE IS ONE BOX THAT HOLDS ITS HEADER (RULE.DEVEX.WORKSPACE.268): the thin rounded outline, its
  // unit's name at the corner, its header as a band under the name, the title and the line under it at the start and
  // its actions at the end, then under a line its content and, under another, its footer. The header is the container's
  // own part, `DSPanelContainer.Header`, so it is drawn inside the box and never as a heading standing over it.
  const surface = frame.look === "container" && !root;
  if (frame.look === "container" && frame.marked)
    findings.push(
      "`marked` is for a row with no border; a container's header stands inside its outline, so a container takes no `marked`",
    );
  // A SECTION'S FILL IS A BAND ACROSS ITS BOX, the background a raised frame has (RULE.DEVEX.WORKSPACE.285). How strong the fill
  // is belongs to the library's look, so every strength draws the same band.
  // A GRID SECTION'S `section` IS DRAWN AS A SECTION'S OWN FIELDS (RULE.DEVEX.WORKSPACE.293).
  const sectionLook = skelSectionLook(frame);
  const band =
    sectionLook !== undefined &&
    SKEL_SURFACE_COLORS.includes(sectionLook.color as string) &&
    sectionLook.color !== "BASE"
      ? skelRect("dl-sk-surface", x, y, w, h, "none")
      : undefined;
  if (band && !(root && !bare)) out.push(band);
  if (surface) {
    const headH = skelContainerHead(frame);
    // BY DEFAULT A CONTAINER FRAMES ITS CONTENT AND ITS FOOTER, NOT ITS HEADER: the container's extent is a dotted
    // outline, as a group's is, and the content and the footer stand in one thin rounded box under the header.
    out.push(skelRect("dl-frame-line", x, y, w, h, skelSizeCorner(ctl)));
    if (rows.length && !skelCardsOnly(frame))
      out.push(
        skelRect(
          "dl-ctl",
          x,
          y + skelContainerEdge(frame),
          w,
          h - skelContainerEdge(frame),
          skelSizeCorner(ctl),
        ),
      );
    const bandY = y + skelContainerBandTop(frame);
    if (frame.label)
      out.push(
        skelStepText(
          frame.label,
          SKEL_STEP_CONTAINER,
          x + SKEL_PAD,
          bandY + 23,
        ),
      );
    if (frame.label && frame.note)
      out.push(
        `  <text class="dl-detail" x="${x + SKEL_PAD}" y="${bandY + 40}">${esc(frame.note)}</text>`,
      );
    const actions = frame.actions ?? [];
    let ax =
      x +
      w -
      SKEL_PAD -
      (actions.reduce((t, a) => t + skelFixedWidth(a, ctl), 0) +
        SKEL_LABEL_GAP * Math.max(0, actions.length - 1));
    const actionsTop = bandY + (headH - SKEL_LABEL_GAP * 2 - ctl) / 2;
    for (const action of actions) {
      const actionKind = skelKind(action),
        aw = skelFixedWidth(action, ctl);
      if (!SKEL_CELL_KINDS.includes(actionKind))
        findings.push(
          "the actions of a container's header are words, a note, an icon or a control",
        );
      else
        skelDrawLeaf(
          action,
          actionKind!,
          ax,
          actionsTop,
          aw,
          ctl,
          ctl,
          ctl,
          findings,
          out,
        );
      ax += aw + SKEL_LABEL_GAP;
    }
  }
  // A ROOT FRAME THAT STANDS IN A LAYOUT'S CONTENT IS BARE: the content's line is its edge.
  // A FEATURE WHOSE `frames` HOLD THE WHOLE OF IT IS DRAWN IN ITS OWN FRAME, in place of its dotted boundary (RULE.DEVEX.WORKSPACE.286).
  const featureFrames = skelFeatureFrames(frame);
  if (root && !bare)
    out.push(
      skelRect("dl-sk-window", x, y, w, h, "frame"),
      ...(band ? [band] : []),
    );
  else if (!bare && !isContainer && !surface)
    out.push(
      ...(featureFrames.whole
        ? skelSurfaceMarks(skelSurfaceOf(frame), x, y, w, h)
        : skelMarks(frame.look, x, y, w, h, skelCardCorner(frame))),
    );
  // A SECTION'S `inset` IS A SOLID LINE ALONG THE TOP AND THE BOTTOM EDGE OF ITS BOX, and none at its sides.
  if (sectionLook?.inset === true)
    out.push(
      skelPath("dl-line-edge", [
        [
          [x, y],
          [x + w, y],
        ],
        [
          [x, y + h],
          [x + w, y + h],
        ],
      ]),
    );
  const corner = skelCornerName(frame, frame.look === "container");
  const tagH = corner ? SKEL_TAG_H + SKEL_LABEL_GAP : 0;
  if (corner)
    out.push(
      `  <text class="dl-detail" x="${x + SKEL_LABEL_GAP}" y="${y + SKEL_LABEL_H + 4}">${esc(corner)}</text>`,
    );
  // A CONTAINER'S UNIT IS NAMED AT THE CORNER OF ITS OUTLINE, over its header, quiet, on the line the book gives a name.
  if (frame.look === "container" && frame.unit !== undefined)
    out.push(
      `  <text class="dl-detail" x="${x + SKEL_LABEL_GAP}" y="${y + SKEL_LABEL_H + 4}">${esc(frame.unit)}</text>`,
    );
  // A CARD MAY CARRY A MARK BEFORE ITS TITLE, for the kind of thing the card is about.
  const cardMark =
    frame.look === "card" && frame.media !== undefined
      ? SKEL_CARD_MARK + SKEL_LABEL_GAP
      : 0;
  if (cardMark)
    out.push(
      ...skelIcon(
        frame.media!,
        x + SKEL_PAD + SKEL_CARD_MARK / 2,
        y + tagH + 21,
        SKEL_CARD_MARK,
        true,
        undefined,
        SKEL_CARD_MARK,
      ),
    );
  if (frame.label && !surface)
    out.push(
      frame.look === "card"
        ? skelStepText(
            frame.label,
            SKEL_STEP_CARD,
            x + SKEL_PAD + cardMark,
            y + tagH + 26,
          )
        : `  <text class="dl-name" x="${x + SKEL_PAD}" y="${y + tagH + 26}">${esc(frame.label)}</text>`,
    );
  if (frame.label && frame.note && !surface)
    out.push(
      `  <text class="dl-detail" x="${x + SKEL_PAD}" y="${y + tagH + 45}">${esc(frame.note)}</text>`,
    );
  // A CARD'S ACTIONS STAND AT THE END OF ITS TITLE'S LINE, as a container's stand at the end of its header.
  if (frame.look === "card" && frame.actions?.length) {
    let cx =
      x +
      w -
      SKEL_PAD -
      (frame.actions.reduce((t, a) => t + skelFixedWidth(a, ctl), 0) +
        SKEL_LABEL_GAP * (frame.actions.length - 1));
    for (const action of frame.actions) {
      const actionKind = skelKind(action),
        aw = skelFixedWidth(action, ctl);
      if (!SKEL_CELL_KINDS.includes(actionKind))
        findings.push(
          "the actions of a card's header are words, a note, an icon or a control",
        );
      else
        skelDrawLeaf(
          action,
          actionKind!,
          cx,
          y + tagH + 22 - ctl / 2,
          aw,
          ctl,
          ctl,
          ctl,
          findings,
          out,
        );
      cx += aw + SKEL_LABEL_GAP;
    }
  }
  // A GROUP'S ENTRIES STAND INSIDE ITS BOUNDARY, under its name, at a boundary's padding (RULE.DEVEX.WORKSPACE.301).
  if (entries) {
    skelDrawAccordion(
      frame,
      entries,
      x + SKEL_PAD,
      y + skelHead(frame),
      w - SKEL_PAD * 2,
      ctl,
      out,
    );
    return;
  }

  // A PART THAT TAKES THE HEIGHT LEFT: where the frame stands taller than its rows need, the rows whose
  // one item is a `fill` frame, slot or part share what is over.
  const slack = Math.max(0, h - natural);
  const growers = rows
    .map((row, i) => (skelGrows(row) ? i : -1))
    .filter((i) => i >= 0);

  if (isContainer) {
    // THE PARTS STAND WITH NO GAP. Those named in `frames` and next to each other share one frame.
    const heights = parts.map((p) => skelFrameHeight(p, ctl));
    const partGrowers = parts
      .map((p, i) => (p.fill ? i : -1))
      .filter((i) => i >= 0);
    if (partGrowers.length && slack > 0)
      for (const i of partGrowers) heights[i] += slack / partGrowers.length;
    const tops: number[] = [];
    let top = y + skelHead(frame);
    heights.forEach((ph) => {
      tops.push(top);
      top += ph;
    });
    const listed = parts.map(
      (p) =>
        !!p.tag && Array.isArray(frame.frames) && frame.frames.includes(p.tag),
    );
    const radius: SkelCorner = frame.rounded ? skelSizeCorner(ctl) : "none";
    for (let i = 0; i < parts.length; i++) {
      if (!listed[i]) continue;
      let end = i;
      while (end + 1 < parts.length && listed[end + 1]) end++;
      const fy = tops[i],
        fh = tops[end] + heights[end] - fy;
      if (frame.raised)
        out.push(skelRect("dl-sk-surface", x, fy, w, fh, radius));
      if (frame.bordered) {
        out.push(skelRect("dl-line-edge", x, fy, w, fh, radius));
        for (let d = i + 1; d <= end; d++)
          out.push(
            `  <path class="dl-line-edge" d="M${r2(x)} ${r2(tops[d])} H${r2(x + w)}"/>`,
          );
      }
      i = end;
    }
    parts.forEach((part, i) => {
      // A PART WITH NO SOLID BORDER AROUND IT KEEPS ITS DOTTED BOUNDARY; a solid line already marks the others.
      if (!(frame.bordered && listed[i]))
        out.push(skelRect("dl-frame-line", x, tops[i], w, heights[i], "none"));
      skelDrawFrame(
        part,
        x,
        tops[i],
        w,
        findings,
        out,
        heights[i],
        named + (skelNamed(frame) ? 1 : 0),
        ctl,
        true,
      );
    });
    return;
  }

  const heights = rows.map((r) => skelRowHeight(r, ctl));
  if (growers.length && slack > 0)
    for (const i of growers) heights[i] += slack / growers.length;

  const itemsX = x + inset + (labelCol ? labelCol + SKEL_GAP : 0);
  // A BACKDROP'S MEDIA STANDS BEHIND THE ROWS, across the feature under its name, and its own name stands at its corner; the rows keep
  // to their measure over it, at the start or centred (RULE.DEVEX.WORKSPACE.305).
  const backdrop = skelBackdropOf(frame);
  if (backdrop) {
    const top = y + skelHeadOwn(frame) - SKEL_LABEL_GAP;
    skelDrawLeaf(
      backdrop.media,
      "slot",
      x + SKEL_LABEL_GAP,
      top,
      w - SKEL_LABEL_GAP * 2,
      y + h - SKEL_LABEL_GAP - top,
      0,
      ctl,
      findings,
      out,
    );
  }
  const backdropW = backdrop
    ? Math.round(rowContentW * backdrop.measure)
    : rowContentW;
  const backdropShift = backdrop?.centre
    ? Math.round((rowContentW - backdropW) / 2)
    : 0;
  let rowY = y + skelHead(frame);
  const dividers = skelDividers(frame),
    partStarts = skelPartStarts(frame);
  const lines = skelLined.get(frame.rows);
  const linedRows = rows.map(
    (row) => lines !== undefined && skelLinedRow(row, lines),
  );
  // A FEATURE'S `frames` NAMING `TEXT` ALONE BESIDE ITS MEDIA FRAMES THE WORDS AND THE ITEMS: each run of rows that holds no slot,
  // here, and in a row that holds one, each part of it that is not the media, below.
  const textFrame = featureFrames.text ? skelSurfaceOf(frame) : undefined;
  if (textFrame) {
    const runMarks = (from: number, to: number) =>
      skelSurfaceMarks(
        textFrame,
        itemsX - SKEL_LABEL_GAP,
        from - SKEL_LABEL_GAP,
        rowContentW + SKEL_LABEL_GAP * 2,
        to - from + SKEL_LABEL_GAP * 2,
      );
    let top = rowY,
      runTop: number | undefined,
      runEnd = 0;
    rows.forEach((row, i) => {
      if (!skelRowHoldsSlot(row)) {
        runTop ??= top;
        runEnd = top + heights[i];
      } else if (runTop !== undefined) {
        out.push(...runMarks(runTop, runEnd));
        runTop = undefined;
      }
      top += heights[i] + SKEL_GAP;
    });
    if (runTop !== undefined) out.push(...runMarks(runTop, runEnd));
  }
  // A ROW WITH NO BORDER, such as the way back or the header of a record, takes the same dotted line with `marked`,
  // as wide as the containers beside it, so their edges are seen to agree.
  rows.forEach((row, rowIndex) => {
    const rh = heights[rowIndex];
    if (row.marked && !(row.items ?? []).some((it) => it.frame))
      out.push(
        skelRect(
          "dl-frame-line",
          itemsX,
          rowY - SKEL_GUIDE_OUT,
          w - SKEL_PAD - (itemsX - x),
          rh + SKEL_GUIDE_OUT * 2,
          "none",
        ),
      );
    // THE CHOSEN LINE OF A LIST IS A BAND across the outline, from the line above it to the line under it.
    if (surface && row.chosen) {
      const bandTop =
        rowIndex === 0 ? y + skelContainerEdge(frame) : rowY - SKEL_GAP / 2;
      const bandEnd =
        rowIndex === rows.length - 1 ? y + h : rowY + rh + SKEL_GAP / 2;
      out.push(
        skelRect("dl-sk-surface", x, bandTop, w, bandEnd - bandTop, "none"),
      );
    }
    // A PART OF A CONTAINER'S CONTENT, AND ITS FOOTER, BEGIN UNDER A LINE across the outline. A line between two rows
    // of one part, as a list in a group draws, stays inside that part's boundary.
    // In a container a line crosses its box above each content part after the first and above its footer; a group is
    // marked by its own boundary and takes no line, and the line between two rows of one list stays.
    if ((surface || frame.look === "card") && dividers.has(rowIndex)) {
      const inPart = row.within !== undefined && !row.lead ? SKEL_LABEL_GAP : 0;
      if (!partStarts.has(rowIndex))
        out.push(
          `  <path class="dl-ctl" d="M${r2(x + inPart)} ${r2(rowY - SKEL_GAP / 2)} H${r2(x + w - inPart)}"/>`,
        );
    }
    if (row.label)
      out.push(
        `  <text class="dl-name" x="${x + SKEL_PAD}" y="${Math.round(rowY + rh / 2 + 4)}">${esc(row.label)}</text>`,
      );
    // A FLUSH TABLE IS TOLD WHERE THE EDGE ABOVE IT IS: the line under the header, or the outline, where it is the first
    // row, or the line over its part. Where a unit's name stands over it, the table begins under the name.
    const namedAbove =
      row.within !== undefined ||
      (rowIndex === 0 && frame.unit !== undefined && !skelContainerHead(frame));
    if (surface)
      for (const it of row.items ?? [])
        if (it.standin === "table" && it.flush) {
          it.edgeTop = namedAbove
            ? undefined
            : rowIndex === 0
              ? y + skelContainerEdge(frame)
              : dividers.has(rowIndex)
                ? rowY - SKEL_GAP / 2
                : undefined;
          it.inPart =
            row.within !== undefined && skelLevel(row.within) !== "card";
        }
    // A PART THAT IS A UNIT OF THE DESIGN SYSTEM is drawn at the level its name gives: a widget, a component or a group a
    // dotted boundary round its rows, and a card its outline; each carries its name at its corner, a group the word *Group*.
    if (row.lead && row.within !== undefined) {
      let end = rowIndex;
      while (
        end + 1 < rows.length &&
        rows[end + 1].within === row.within &&
        !rows[end + 1].lead
      )
        end++;
      const bottom =
        rowY +
        heights.slice(rowIndex, end + 1).reduce((t, v) => t + v, 0) +
        SKEL_GAP * (end - rowIndex);
      const card = skelLevel(row.within) === "card";
      out.push(
        skelRect(
          card ? "dl-ctl" : "dl-frame-line",
          x + SKEL_LABEL_GAP,
          rowY - SKEL_LABEL_GAP,
          w - SKEL_LABEL_GAP * 2,
          bottom - rowY + SKEL_LABEL_GAP * 2,
          card ? "frame" : "mark",
        ),
      );
      out.push(
        `  <text class="dl-detail" x="${x + SKEL_PAD}" y="${rowY + SKEL_LABEL_GAP}">${esc(row.within)}</text>`,
      );
      if (named + (skelNamed(frame) ? 1 : 0) >= SKEL_NEST_MAX)
        findings.push(
          `the boundary \`${row.within}\` sits inside ${named + (skelNamed(frame) ? 1 : 0)} named boundaries, and a skeleton nests ${SKEL_NEST_MAX} at most; draw \`${row.within}\` as a skeleton of its own`,
        );
    }

    const leadH = skelLeadH(row);
    let innerX = itemsX + backdropShift,
      innerY = rowY + leadH,
      innerW = backdropW;
    if (row.framed) {
      out.push(...skelMarks(undefined, innerX, innerY, innerW, rh - leadH));
      innerX += SKEL_GAP;
      innerY += SKEL_GAP;
      innerW -= SKEL_GAP * 2;
    }

    const widths = skelRowWidths(row, innerW, ctl, findings);
    // EVERY BOX IN A ROW STANDS AS TALL AS THE ROW, so a named place beside a plain one lines up at
    // both edges, as the regions of a layout do.
    const boxH = (row.framed ? rh - SKEL_GAP * 2 : rh) - leadH;
    if (textFrame && skelRowHoldsSlot(row)) {
      let tx = innerX;
      row.items.forEach((it, i) => {
        const kind = skelKind(it);
        if (kind !== null && kind !== "spacer" && !skelItemHoldsSlot(it))
          out.push(...skelSurfaceMarks(textFrame, tx, innerY, widths[i], boxH));
        tx += widths[i] + skelGapAfter(row, i);
      });
    }
    // A ROW THAT STANDS WITH A CENTRED HEAD IS CENTRED IN ITS COLUMN (RULE.DEVEX.WORKSPACE.291): what it holds keeps its widths, and
    // the room left over is shared on its two sides. A row that a `fill` or a spacer fills has none left over.
    const over = skelCentred.has(row)
      ? innerW - widths.reduce((t, v) => t + v, 0) - skelRowGaps(row)
      : 0;
    const startX = innerX + (over > 0 ? Math.round(over / 2) : 0);
    // THE LINES BETWEEN A FEATURE'S ITEMS AND BETWEEN A GRID'S CELLS (RULE.DEVEX.WORKSPACE.289): one across the column under every row of
    // them but the last, one in the gap after every part of a row but its last where they stand across, and with `EDGE` a rounded
    // outline round them all. Each line runs to the next, so the lines of a grid meet.
    if (lines !== undefined && linedRows[rowIndex]) {
      const edge = lines.border === "EDGE",
        before = linedRows[rowIndex - 1] === true,
        after = linedRows[rowIndex + 1] === true;
      const reach = edge ? SKEL_GAP / 2 : 0;
      if (edge && !before) {
        let end = rowIndex;
        while (linedRows[end + 1] === true) end++;
        const bottom =
          rowY +
          heights.slice(rowIndex, end + 1).reduce((t, v) => t + v, 0) +
          SKEL_GAP * (end - rowIndex);
        out.push(
          skelRect(
            "dl-ctl",
            itemsX - reach,
            rowY - reach,
            rowContentW + reach * 2,
            bottom - rowY + reach * 2,
            "frame",
          ),
        );
      }
      if (before)
        out.push(
          `  <path class="dl-ctl" d="M${r2(itemsX - reach)} ${r2(rowY - SKEL_GAP / 2)} H${r2(itemsX + rowContentW + reach)}"/>`,
        );
      if (lines.across) {
        let lx = startX;
        row.items.forEach((it, i) => {
          if (i < row.items.length - 1 && skelKind(it) !== "spacer") {
            const cx = lx + widths[i] + skelGapAfter(row, i) / 2;
            out.push(
              `  <path class="dl-ctl" d="M${r2(cx)} ${r2(rowY - (before || edge ? SKEL_GAP / 2 : 0))} V${r2(rowY + rh + (after || edge ? SKEL_GAP / 2 : 0))}"/>`,
            );
          }
          lx += widths[i] + skelGapAfter(row, i);
        });
      }
    }
    // A SPLIT OF A FEATURE WITH `verticalAlign` STANDS EACH SIDE AT ITS OWN HEIGHT (RULE.DEVEX.WORKSPACE.292), at the top, the middle or
    // the foot of the row; with none, every box in a row stands as tall as the row.
    const aligned = skelAligned.get(row);
    const placed = (own: number) =>
      innerY +
      (aligned === "TOP"
        ? 0
        : aligned === "BOTTOM"
          ? boxH - own
          : (boxH - own) / 2);
    const centres: number[] = [];
    let ix = startX;
    row.items.forEach((it, i) => {
      const iw = widths[i];
      const kind = skelKind(it);
      skelOldFields(it, findings);
      if (kind === "slot") {
        const stray = [
          "text",
          "note",
          "lines",
          "standin",
          "control",
          "icon",
          "frame",
        ].filter((k) => (it as Record<string, unknown>)[k] !== undefined);
        if (stray.length)
          findings.push(
            `a slot holds nothing: \`${it.slot}\` carries ${stray.map((k) => `\`${k}\``).join(", ")}, and a slot is one block whose only content is its name`,
          );
      }
      if (kind === "frame") {
        const own =
          aligned !== undefined
            ? Math.min(skelFrameHeight(it.frame!, ctl), boxH)
            : boxH;
        skelDrawFrame(
          it.frame!,
          ix,
          aligned !== undefined ? placed(own) : innerY,
          iw,
          findings,
          out,
          own,
          named +
            (skelNamed(frame) ? 1 : 0) +
            (row.within !== undefined ? 1 : 0),
          ctl,
        );
      } else if (kind !== null && kind !== "spacer") {
        // A PLACE AND A STAND-IN STRETCH, A CONTROL DOES NOT: a named region fills its row, and a
        // control keeps the height of its component, centred on the row's one centre line. An item line in a frame of its
        // own stands as tall as its row, as the boxes of a feature's items do.
        const stretches =
          aligned === undefined &&
          (kind === "slot" ||
            kind === "place" ||
            (it.height !== undefined && kind === "standin") ||
            (kind === "item" && skelItemFrames.has(it)));
        const own = stretches ? boxH : skelItemHeight(it, ctl);
        const top =
          aligned !== undefined
            ? placed(Math.min(own, boxH))
            : kind === "standin" || stretches
              ? innerY
              : innerY + (boxH - Math.min(own, boxH)) / 2;
        const drawnH = kind === "standin" ? Math.min(own, boxH) : own;
        if (kind !== "standin" && aligned === undefined)
          centres.push(
            top + (kind === "control" || kind === "icon" ? ctl : own) / 2,
          );
        skelDrawLeaf(
          it,
          kind,
          ix,
          top,
          iw,
          kind === "control" || kind === "icon" ? ctl : drawnH,
          boxH,
          ctl,
          findings,
          out,
        );
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
  [
    ...(frame.sections ?? []).flatMap((section) => section?.rows ?? []),
    ...(frame.rows ?? []),
    ...(frame.footer ?? []),
  ].flatMap((row) =>
    (row?.items ?? [])
      .map((it) => it?.frame)
      .filter((child): child is SkeletonFrame => !!child),
  );
/** Whether a row is a line built by hand: words, a note with words in it, and an action, and nothing else but room. */
const skelHandLine = (
  row: SkeletonRow,
): { words: boolean; note: boolean; action: boolean; only: boolean } => {
  const kinds = (row.items ?? []).map((it) => ({ it, kind: skelKind(it) }));
  const letters = (text: unknown) =>
    typeof text === "string" && /[\p{L}\p{N}]/u.test(text);
  const isAction = ({
    it,
    kind,
  }: {
    it: SkeletonItem;
    kind: SkelKind | null;
  }) =>
    (kind === "control" && it.control === "button") ||
    (kind === "icon" &&
      it.text === undefined &&
      it.mark === undefined &&
      it.on === undefined);
  return {
    words: kinds.some(({ it, kind }) => kind === "plain" && letters(it.text)),
    note: kinds.some(({ it, kind }) => kind === "note" && letters(it.note)),
    action: kinds.some(isAction),
    only: kinds.every(
      (entry) =>
        entry.kind === "plain" ||
        entry.kind === "note" ||
        entry.kind === "spacer" ||
        isAction(entry) ||
        (entry.kind === "control" && entry.it.control === "badge"),
    ),
  };
};
function skelWhichUnit(
  frame: SkeletonFrame | undefined,
  findings: string[],
  pageLevel = false,
  inFrames = false,
): void {
  if (!frame || typeof frame !== "object") return;
  const said = (message: string) => {
    if (!findings.includes(message)) findings.push(message);
  };
  const named = typeof frame.unit === "string" ? frame.unit : undefined;
  const level = named !== undefined ? skelLevel(named) : undefined;
  const rowLists = [
    ...(frame.sections ?? []).map((section) => section?.rows ?? []),
    frame.rows ?? [],
    frame.footer ?? [],
  ];
  if (
    named === "DSCard" &&
    (frame.sections ?? []).some((section) => section?.label !== undefined)
  )
    said(
      `the card \`${frame.label ?? named}\` has titled parts: a card with parts is a \`DSCardWidget\``,
    );
  if (
    named !== undefined &&
    frame.look !== undefined &&
    !inFrames &&
    SKEL_UNITS.has(named) &&
    frame.look !== SKEL_LEVEL_LOOK[level!]
  )
    said(
      `\`${named}\` writes \`look\` as \`${frame.look}\`, and its level gives \`${SKEL_LEVEL_LOOK[level!]}\`: the unit decides the look; drop \`look\``,
    );
  const children = skelFrameChildren(frame);
  // A `DSCardWidget` HAS A HEAD: a mark, or actions in the head, or titled parts under it. One with none of them
  // shows its own info and is a `DSCard`, however many cards stand beside it.
  const hasParts = (frame.sections ?? []).some(
    (section) => section?.label !== undefined,
  );
  if (
    named === "DSCardWidget" &&
    frame.media === undefined &&
    (frame.actions ?? []).length === 0 &&
    !hasParts
  )
    said(
      `the \`DSCardWidget\` \`${frame.label ?? ""}\` has no head and no parts: a card with no head and no parts is a \`DSCard\``,
    );
  // A ROW OF THE PAGE OUTSIDE ANY FRAME that holds words and an action is one thing with its own info and action.
  if (pageLevel)
    for (const row of frame.rows ?? []) {
      const line = skelHandLine(row);
      if (
        !(row?.items ?? []).some((it) => it?.frame) &&
        (line.words || line.note) &&
        line.action
      )
        said(
          "a row of the page outside any frame holds words and an action: one thing with its own info and action is a `DSCard`",
        );
    }
  // A ROW BUILT BY HAND as words, a note and an action is one line about one thing.
  for (const rows of rowLists)
    for (const row of rows) {
      const line = skelHandLine(row);
      if (line.words && line.note && line.action && line.only)
        said(
          "a row is built by hand as words, a note and an action: one line about one thing is a `DSItem`; write it as an `item`",
        );
    }
  for (const child of children)
    skelWhichUnit(child, findings, false, skelHasParts(frame));
}

/**
 * THE UNITS OF A SPEC, read once before anything is drawn. A `unit` the barrel does not name is a finding, on a
 * frame and on a part of the content alike. A frame that names a unit and no `look` is drawn in its level's look:
 * a container its outline, a card its outline and title, a widget or a component a dotted boundary. A part of a
 * container with `frames` takes its frame from the container, so it is given no look.
 */
function skelUnits(
  frame: SkeletonFrame | undefined,
  findings: string[],
  inFrames = false,
): void {
  if (!frame || typeof frame !== "object") return;
  const known = (unit: unknown) => {
    if (typeof unit === "string" && SKEL_UNITS.has(unit)) return;
    const said = `\`${String(unit)}\` is no unit of the design system: a \`unit\` is a name its barrel exports, such as \`DSPanelContainer\`, \`DSFilterBar\`, \`DSCard\` or \`DSForm\``;
    if (!findings.includes(said)) findings.push(said);
  };
  if (frame.unit !== undefined) {
    known(frame.unit);
    if (frame.look === undefined && !inFrames && typeof frame.unit === "string")
      frame.look = SKEL_LEVEL_LOOK[skelLevel(frame.unit)];
  }
  for (const section of frame.sections ?? [])
    if (section?.unit !== undefined) known(section.unit);
  const rows = [
    ...(frame.sections ?? []).flatMap((section) => section?.rows ?? []),
    ...(frame.rows ?? []),
    ...(frame.footer ?? []),
  ];
  for (const row of rows)
    for (const it of row?.items ?? [])
      if (it?.frame) skelUnits(it.frame, findings, skelHasParts(frame));
}

/** What a feature hands the regions inside it that are no unit: the lines of its items, whether they are numbered and counted so
 *  far, and whether they are a `LIST`. */
type SkelFeatureLook = {
  lines?: SkelLines;
  numbered: boolean;
  list: boolean;
  count: { n: number };
  stats?: SkelStat;
};
/** Whether a row stands centred with a centred head: it holds actions, words, icons or item lines, and no item line of a `LIST`. */
const skelCentrable = (row: SkeletonRow, list: boolean): boolean => {
  const kinds = (row?.items ?? []).map((it) =>
    it && typeof it === "object" ? skelKind(it) : null,
  );
  return (
    kinds.some((kind) => kind !== "spacer") &&
    kinds.every(
      (kind) =>
        kind === "control" ||
        kind === "icon" ||
        kind === "plain" ||
        kind === "note" ||
        kind === "spacer" ||
        (kind === "item" && !list),
    )
  );
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
function skelLooks(
  frame: SkeletonFrame | undefined,
  findings: string[],
  items?: SkelSurface,
  media?: SkelSurface,
  feature?: SkelFeatureLook,
  device?: string,
): void {
  if (!frame || typeof frame !== "object") return;
  const said = (message: string) => {
    if (!findings.includes(message)) findings.push(message);
  };
  const unit = typeof frame.unit === "string" ? frame.unit : undefined;
  const which = unit !== undefined ? `\`${unit}\`` : "a frame with no `unit`";
  for (const key of ["color", "strength", "inset"] as const)
    if (frame[key] !== undefined && unit !== SKEL_SECTION)
      said(
        `\`${key}\` is a field of a \`DSSectionContainer\`, and this frame is ${which}`,
      );
  for (const key of ["items", "surface", "verticalAlign", "type"] as const)
    if (frame[key] !== undefined && unit !== SKEL_FEATURE)
      said(
        `\`${key}\` is a field of a \`DSFeature\`, and this frame is ${which}`,
      );
  for (const key of ["section", "grid"] as const)
    if (frame[key] !== undefined && unit !== SKEL_GRID_SECTION)
      said(
        `\`${key}\` is a field of a \`DSFeatureGridSectionContainer\`, and this frame is ${which}`,
      );
  const enumOf = (value: unknown, values: string[], what: string) => {
    if (value !== undefined && !values.includes(value as string))
      said(
        `${what} is \`${String(value)}\`, and it takes ${values.join(" · ")}`,
      );
  };
  if (unit === SKEL_SECTION) {
    enumOf(frame.color, SKEL_SURFACE_COLORS, "a section's `color`");
    enumOf(frame.strength, SKEL_SURFACE_STRENGTHS, "a section's `strength`");
  }
  // WHAT A FRAME DRAWS IS `IDSFrameSurface`: each value one the design system has, and an `elevation` only on a raised frame.
  const surfaceOf = (given: unknown, what: string): SkelSurface | undefined => {
    if (given === null || typeof given !== "object" || Array.isArray(given)) {
      said(
        `${what} holds the keys of \`IDSFrameSurface\`, and it is \`${JSON.stringify(given)}\``,
      );
      return undefined;
    }
    const surface = given as SkelSurface;
    enumOf(surface.color, SKEL_SURFACE_COLORS, `the \`color\` of ${what}`);
    enumOf(
      surface.strength,
      SKEL_SURFACE_STRENGTHS,
      `the \`strength\` of ${what}`,
    );
    enumOf(
      surface.elevation,
      Object.keys(SKEL_CONTROL_H),
      `the \`elevation\` of ${what}`,
    );
    if (surface.elevation !== undefined && surface.raised !== true)
      said(
        `${what} gives an \`elevation\` and is not \`raised\`: how far a frame stands off is read only where it is raised`,
      );
    return surface;
  };
  const isObject = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value);
  // A FEATURE OF `type` `BACKDROP` (RULE.DEVEX.WORKSPACE.305): its media, the slot alone in a row of its own, leaves the flow of its rows and is
  // kept to be drawn behind them, with the measure its screen class gives the words. The other types are drawn by where the rows place the media.
  if (unit === SKEL_FEATURE && frame.type !== undefined) {
    const slotOf = (row: SkeletonRow): SkeletonItem | undefined => {
      const real = (row?.items ?? []).filter(
        (it) => !!it && typeof it === "object" && skelKind(it) !== "spacer",
      );
      return real.length === 1 && skelKind(real[0]) === "slot"
        ? real[0]
        : undefined;
    };
    const at = Array.isArray(frame.rows)
      ? frame.rows.findIndex((row) => slotOf(row) !== undefined)
      : -1;
    if (!SKEL_FEATURE_TYPES.includes(frame.type as string))
      said(
        `a \`DSFeature\`'s \`type\` is \`${String(frame.type)}\`, and a skeleton reads ${SKEL_FEATURE_TYPES.join(" · ")}; the other types are drawn by where the feature's rows place its media`,
      );
    else if (at < 0)
      said(
        "a `DSFeature` of `type` `BACKDROP` stands its media behind its words: name the media as a slot alone in a row of the feature",
      );
    else {
      const media = slotOf(frame.rows[at])!;
      frame.rows = frame.rows.filter((_, i) => i !== at);
      const centre = frame.rows.some((row) =>
        (row?.items ?? []).some(
          (it) =>
            !!it &&
            typeof it === "object" &&
            skelKind(it) === "head" &&
            skelHeadOf(it).textAlign === "CENTER",
        ),
      );
      skelBackdrops.set(frame.rows, {
        media,
        measure:
          device === "DESKTOP" || device === "TABLET"
            ? SKEL_BACKDROP_MEASURE
            : 1,
        centre,
      });
    }
  }
  // EACH LINE OF A `DSCodeBlockView` THAT IS A NOTE IS CODE, which scrolls and never wraps (RULE.DEVEX.WORKSPACE.304).
  if (unit === SKEL_CODE && Array.isArray(frame.rows))
    for (const row of frame.rows)
      for (const it of row?.items ?? [])
        if (!!it && typeof it === "object" && skelKind(it) === "note")
          skelCode.add(it);
  const ownRows = Array.isArray(frame.rows) ? frame.rows : [];
  let itemsHere = items,
    mediaHere = media,
    featureHere = feature;
  if (unit === SKEL_FEATURE) {
    const given = frame.items;
    itemsHere =
      given !== null && typeof given === "object" && given.surface !== undefined
        ? surfaceOf(given.surface, "a feature's `items.surface`")
        : undefined;
    const parts = frame.frames;
    if (
      parts !== undefined &&
      (!Array.isArray(parts) ||
        parts.some((part) => !SKEL_FEATURE_PARTS.includes(part)))
    )
      said(
        `a \`DSFeature\`'s \`frames\` names its parts, ${SKEL_FEATURE_PARTS.join(" · ")}, and this one is \`${JSON.stringify(parts)}\``,
      );
    const own =
      frame.surface !== undefined
        ? surfaceOf(frame.surface, "a feature's `surface`")
        : undefined;
    if (
      frame.surface !== undefined &&
      !(
        Array.isArray(parts) &&
        parts.some((part) => SKEL_FEATURE_PARTS.includes(part))
      )
    )
      said(
        "a `DSFeature`'s `surface` paints only the parts its `frames` names, and this one names none",
      );
    mediaHere = skelFeatureFrames(frame).media ? (own ?? {}) : undefined;
    // THE ITEMS' FORM, THEIR LINES AND THEIR NUMBERS (RULE.DEVEX.WORKSPACE.289, .290): a `LIST` has its lines where `borderType` is left
    // out, a `GRID` none, and items boxed by `items.surface` none at all.
    const shape = isObject(given) ? given : {};
    if (
      shape.type !== undefined &&
      !SKEL_ITEMS_TYPES.includes(shape.type as string)
    )
      said(
        `a feature's \`items.type\` is \`${String(shape.type)}\`, and a skeleton draws ${SKEL_ITEMS_TYPES.join(" · ")}`,
      );
    enumOf(
      shape.borderType,
      SKEL_BORDER_TYPES,
      "a feature's `items.borderType`",
    );
    if (shape.numbered !== undefined && typeof shape.numbered !== "boolean")
      said(
        `a feature's \`items.numbered\` is \`${JSON.stringify(shape.numbered)}\`, and it takes true or false`,
      );
    const list = shape.type === "LIST";
    const border = itemsHere
      ? "NONE"
      : SKEL_BORDER_TYPES.includes(shape.borderType as string)
        ? (shape.borderType as string)
        : list
          ? "GRID"
          : "NONE";
    // A FEATURE'S `STATS` (RULE.DEVEX.WORKSPACE.300) stand side by side as a `GRID` does, with no line where `borderType` is left out, and
    // take the sizes one level below the feature's own, which its head's `pageLevel` gives. The design system numbers no statistic.
    const head = ownRows
      .flatMap((row) => row?.items ?? [])
      .find((it) => !!it && typeof it === "object" && skelKind(it) === "head");
    const level =
      head !== undefined ? skelHeadLevel(skelHeadOf(head)) : "CONTAINER";
    const stats =
      shape.type === "STATS"
        ? {
            value: SKEL_STAT_VALUE[level],
            label: SKEL_STAT_LABEL[level],
            centre:
              head !== undefined && skelHeadOf(head).textAlign === "CENTER",
          }
        : undefined;
    if (stats && shape.numbered === true)
      said(
        "`items.numbered` numbers the item lines of a `GRID` or a `LIST`, and the design system writes no number before a statistic of `STATS`",
      );
    featureHere = {
      lines:
        border !== "NONE" ? { border, across: !list, cells: false } : undefined,
      numbered: shape.numbered === true && !stats,
      list,
      count: { n: 0 },
      stats,
    };
    if (frame.divided !== undefined)
      said(
        "`divided` draws the lines of a container's or a card's list, and a `DSFeature`'s lines are its `items.type` `LIST` or its `items.borderType`",
      );
    // THE SPLIT OF A FEATURE WITH `verticalAlign` (RULE.DEVEX.WORKSPACE.292): each of its rows that holds its media beside its words. A
    // view where the split folds, as a phone's, has no such row, and the field is read nowhere there, as the design system reads it.
    enumOf(frame.verticalAlign, SKEL_V_ALIGNS, "a feature's `verticalAlign`");
    if (SKEL_V_ALIGNS.includes(frame.verticalAlign as string))
      for (const row of ownRows) {
        const real = (row?.items ?? []).filter(
          (it) => !!it && typeof it === "object" && skelKind(it) !== "spacer",
        );
        if (
          real.length > 1 &&
          real.some((it) => skelKind(it) === "frame" || skelKind(it) === "slot")
        )
          skelAligned.set(row, frame.verticalAlign!);
      }
  } else if (unit !== undefined) {
    itemsHere = undefined;
    mediaHere = undefined;
    featureHere = undefined;
  }
  if (unit === SKEL_GRID_SECTION) {
    // A GRID SECTION'S `section` IS A SECTION'S FILL AND ROOM, AND ITS `grid.borderType` THE LINES BETWEEN ITS CELLS (RULE.DEVEX.WORKSPACE.293, .289).
    if (frame.section !== undefined && !isObject(frame.section))
      said(
        `a grid section's \`section\` holds a section's \`color\`, \`strength\`, \`inset\` and \`size\`, and it is \`${JSON.stringify(frame.section)}\``,
      );
    const sectionLook = skelGridSectionOf(frame);
    if (sectionLook !== undefined) {
      enumOf(
        sectionLook.color,
        SKEL_SURFACE_COLORS,
        "a grid section's `section.color`",
      );
      enumOf(
        sectionLook.strength,
        SKEL_SURFACE_STRENGTHS,
        "a grid section's `section.strength`",
      );
      enumOf(
        sectionLook.size,
        Object.keys(SKEL_CONTROL_H),
        "a grid section's `section.size`",
      );
    }
    if (frame.grid !== undefined && !isObject(frame.grid))
      said(
        `a grid section's \`grid\` holds its \`borderType\`, and it is \`${JSON.stringify(frame.grid)}\``,
      );
    const border = isObject(frame.grid) ? frame.grid.borderType : undefined;
    enumOf(border, SKEL_BORDER_TYPES, "a grid section's `grid.borderType`");
    if ((border === "GRID" || border === "EDGE") && Array.isArray(frame.rows))
      skelLined.set(frame.rows, { border, across: true, cells: true });
    // THE COLUMNS AT EACH SCREEN CLASS, `IDSGrid`'s `desktop`, `tablet` and `mobile` (RULE.DEVEX.WORKSPACE.299): each 1 to 4, and a view reads
    // its own class's: every row of its cells stands in that many columns, a spacer filling a short row. A spec with one frame has no class.
    if (isObject(frame.grid)) {
      const grid = frame.grid as Record<string, unknown>;
      for (const key of SKEL_GRID_CLASSES)
        if (
          grid[key] !== undefined &&
          !(
            Number.isInteger(grid[key]) &&
            (grid[key] as number) >= 1 &&
            (grid[key] as number) <= 4
          )
        )
          said(
            `a grid section's \`grid.${key}\` is \`${JSON.stringify(grid[key])}\`, and it takes a whole number of columns, 1 to 4`,
          );
      const key = typeof device === "string" ? device.toLowerCase() : undefined;
      const columns =
        key !== undefined && SKEL_GRID_CLASSES.includes(key)
          ? grid[key]
          : undefined;
      if (
        typeof columns === "number" &&
        Number.isInteger(columns) &&
        columns >= 1 &&
        columns <= 4 &&
        Array.isArray(frame.rows)
      )
        for (const row of frame.rows)
          if (
            Array.isArray(row?.items) &&
            skelLinedRow(row, { border: "NONE", across: true, cells: true }) &&
            row.items.length !== columns
          )
            said(
              `the \`${device}\` view stands a grid section's cells in \`grid.${key}\`, ${columns} columns, and a row of them holds ${row.items.length}; a short row is filled with spacers`,
            );
    }
  }
  // A `DSAccordionGroup`'S ENTRIES ARE ITS `options` (RULE.DEVEX.WORKSPACE.301): each with the words of its `header`, its `content` in words,
  // and `expanded` true or false; the group's `bordered` true or false. A group that draws its entries draws no `rows`.
  if (frame.options !== undefined) {
    if (unit !== SKEL_ACCORDION)
      said(
        `\`options\` is a field of a \`DSAccordionGroup\`, its entries, and this frame is ${which}`,
      );
    else if (!Array.isArray(frame.options))
      said(
        `a \`DSAccordionGroup\`'s \`options\` is the list of its entries, and it is \`${JSON.stringify(frame.options)}\``,
      );
    else {
      if (ownRows.length)
        said(
          "a `DSAccordionGroup` draws its entries from `options`, and its `rows` are not drawn",
        );
      for (const option of frame.options) {
        if (
          !isObject(option) ||
          typeof option.header !== "string" ||
          !option.header.trim()
        ) {
          said(
            "an entry of a `DSAccordionGroup` carries the words of its `header`",
          );
          continue;
        }
        if (
          option.expanded !== undefined &&
          typeof option.expanded !== "boolean"
        )
          said(
            `an entry's \`expanded\` is \`${JSON.stringify(option.expanded)}\`, and it takes true or false`,
          );
        if (option.content !== undefined && typeof option.content !== "string")
          said(
            `an entry's \`content\` is the words its open body shows, and it is \`${JSON.stringify(option.content)}\``,
          );
      }
    }
  }
  if (
    unit === SKEL_ACCORDION &&
    Array.isArray(frame.options) &&
    frame.bordered !== undefined &&
    typeof frame.bordered !== "boolean"
  )
    said(
      `a \`DSAccordionGroup\`'s \`bordered\` is \`${JSON.stringify(frame.bordered)}\`, and it takes true or false`,
    );
  // A REGION OF A FEATURE THAT IS NO UNIT HOLDS THE FEATURE'S ITEMS TOO, and takes their lines.
  if (
    featureHere?.lines !== undefined &&
    (unit === SKEL_FEATURE || unit === undefined) &&
    Array.isArray(frame.rows)
  )
    skelLined.set(frame.rows, featureHere.lines);
  // A CENTRED HEAD CENTRES THE ROWS THAT STAND WITH IT (RULE.DEVEX.WORKSPACE.291): in a feature, in a region of one, and in a grid section's heading.
  if (
    unit === SKEL_FEATURE ||
    unit === SKEL_GRID_SECTION ||
    (unit === undefined && featureHere !== undefined)
  ) {
    const centred = ownRows.some((row) =>
      (row?.items ?? []).some(
        (it) =>
          !!it &&
          typeof it === "object" &&
          skelKind(it) === "head" &&
          skelHeadOf(it).textAlign === "CENTER",
      ),
    );
    if (centred)
      for (const row of ownRows)
        if (skelCentrable(row, featureHere?.list === true))
          skelCentred.add(row);
  }
  const rows = [
    ...(frame.sections ?? []).flatMap((section) => section?.rows ?? []),
    ...(frame.rows ?? []),
    ...(frame.footer ?? []),
  ];
  for (const row of rows)
    for (const it of row?.items ?? []) {
      if (!it || typeof it !== "object") continue;
      const kind = skelKind(it);
      if (kind === "item" && itemsHere) skelItemFrames.set(it, itemsHere);
      if (kind === "slot" && mediaHere) skelItemFrames.set(it, mediaHere);
      // EACH ITEM LINE OF A NUMBERED FEATURE TAKES THE NEXT NUMBER, in the order its rows are read (RULE.DEVEX.WORKSPACE.290).
      if (kind === "item" && featureHere?.numbered)
        skelNumbers.set(it, ++featureHere.count.n);
      if (kind === "item" && featureHere?.stats)
        skelStats.set(it, featureHere.stats);
      if (kind === "frame")
        skelLooks(
          it.frame,
          findings,
          itemsHere,
          mediaHere,
          featureHere,
          device,
        );
    }
}

/** THE FIELDS A SKELETON HAS, by what holds them (RULE.DEVEX.WORKSPACE.287). A field none of them has draws nothing, so it is a
 *  finding that names it. The fields the drawer writes on its own copy are listed too, since a spec that writes one asks for
 *  what the drawer does anyway; `tone`, `em`, `off` and `warn` on an item or a frame keep the findings that name what replaced them. */
const SKEL_FIELDS: Record<string, string[]> = {
  spec: ["kind", "title", "caption", "frame", "views", "layout"],
  view: ["viewport", "state", "page", "frame"],
  page: ["item", "actions", "back"],
  frame: [
    "label",
    "note",
    "width",
    "rows",
    "look",
    "tag",
    "height",
    "fill",
    "unit",
    "headed",
    "frames",
    "raised",
    "bordered",
    "rounded",
    "size",
    "part",
    "actions",
    "footer",
    "sections",
    "divided",
    "marked",
    "media",
    "color",
    "strength",
    "inset",
    "items",
    "surface",
    "verticalAlign",
    "section",
    "grid",
    "options",
    "type",
  ],
  section: ["label", "actions", "rows", "divided", "unit", "part", "sections"],
  row: ["label", "framed", "chosen", "marked", "items", "within", "lead"],
  item: [
    "text",
    "note",
    "fill",
    "frame",
    "tag",
    "slot",
    "control",
    "main",
    "on",
    "flush",
    "edgeTop",
    "inPart",
    "atPage",
    "mark",
    "tabs",
    "chosen",
    "icon",
    "standin",
    "lines",
    "headings",
    "columns",
    "cells",
    "label",
    "info",
    "description",
    "error",
    "read",
    "item",
    "head",
    "spacer",
    "height",
    "part",
    "page",
    "type",
  ],
  line: [
    "media",
    "title",
    "description",
    "meta",
    "end",
    "inline",
    "factsPlacement",
    "selected",
  ],
  head: [
    "pageLevel",
    "eyebrow",
    "title",
    "description",
    "facts",
    "textAlign",
    "media",
  ],
  media: ["mtype", "node", "icon", "title"],
  items: ["surface", "type", "borderType", "numbered"],
  surface: ["color", "strength", "raised", "elevation", "bordered", "rounded"],
  gridSection: ["color", "strength", "inset", "size"],
  grid: ["borderType", "desktop", "tablet", "mobile"],
  option: ["header", "content", "expanded"],
};
const SKEL_OLD_FIELDS = ["tone", "em", "off", "warn"];
function skelFieldFindings(spec: Spec, findings: string[]): void {
  const said = (message: string) => {
    if (!findings.includes(message)) findings.push(message);
  };
  const known = (
    value: unknown,
    holder: string,
    where: string,
    old = false,
  ): value is Record<string, unknown> => {
    if (value === null || typeof value !== "object" || Array.isArray(value))
      return false;
    for (const key of Object.keys(value))
      if (
        !SKEL_FIELDS[holder].includes(key) &&
        !(old && SKEL_OLD_FIELDS.includes(key))
      )
        said(
          `\`${key}\` is no field of ${where}, and a skeleton draws nothing for it`,
        );
    return true;
  };
  const list = (value: unknown): unknown[] =>
    Array.isArray(value) ? value : [];
  const line = (value: unknown) => {
    if (!known(value, "line", "an item line")) return;
    known(value.media, "media", "an item line's `media`");
    for (const fact of list(value.meta))
      if (typeof fact !== "string") item(fact);
    for (const part of list(value.end)) item(part);
  };
  const item = (value: unknown): void => {
    if (!known(value, "item", "an item", true)) return;
    if (value.type !== undefined && value.control !== "tabs")
      said(
        "`type` is the look of a row of tabs, in `DSTabsType`'s words, and this item is no row of tabs",
      );
    frame(value.frame);
    line(value.item);
    if (known(value.head, "head", "a head")) {
      known(value.head.media, "media", "a head's `media`");
      if (typeof value.head.eyebrow !== "string") item(value.head.eyebrow);
      for (const fact of list(value.head.facts))
        if (typeof fact !== "string") item(fact);
    }
    for (const cells of list(value.cells))
      for (const cell of list(cells)) if (typeof cell !== "string") item(cell);
  };
  const row = (value: unknown) => {
    if (known(value, "row", "a row"))
      for (const it of list(value.items)) item(it);
  };
  const section = (value: unknown): void => {
    if (!known(value, "section", "a section")) return;
    for (const action of list(value.actions)) item(action);
    for (const r of list(value.rows)) row(r);
    for (const group of list(value.sections)) section(group);
  };
  const frame = (value: unknown): void => {
    if (!known(value, "frame", "a frame", true)) return;
    known(value.surface, "surface", "a `surface`");
    if (known(value.items, "items", "a feature's `items`"))
      known(value.items.surface, "surface", "a `surface`");
    known(value.section, "gridSection", "a grid section's `section`");
    known(value.grid, "grid", "a grid section's `grid`");
    for (const option of list(value.options))
      known(option, "option", "an entry of a `DSAccordionGroup`'s `options`");
    for (const action of list(value.actions)) item(action);
    for (const part of list(value.sections)) section(part);
    for (const r of [...list(value.rows), ...list(value.footer)]) row(r);
  };
  known(spec, "spec", "a skeleton spec");
  frame(spec.frame);
  for (const view of list(spec.views)) {
    if (!known(view, "view", "a view")) continue;
    frame(view.frame);
    if (known(view.page, "page", "a view's `page`")) {
      line(view.page.item);
      for (const action of list(view.page.actions)) item(action);
    }
  }
}

/**
 * THE LAYOUT IS READ IN THE DESIGN SYSTEM'S OWN WORDS. Its type is one of `DSLayoutType`, its body's width one of
 * `DSLayoutWidthType`, and each part takes the fields of its look and no other; a field the looks do not have is a
 * finding that names the ones they have. Returns whether the layout can be drawn.
 */
function skelLayoutFindings(
  layout: unknown,
  findings: string[],
): layout is SkeletonLayout {
  if (layout === null || typeof layout !== "object" || Array.isArray(layout)) {
    findings.push(
      `a skeleton's \`layout\` holds \`type\`, \`body\`, \`navigation\` and \`content\`, and this one is \`${JSON.stringify(layout)}\``,
    );
    return false;
  }
  const given = layout as Record<string, unknown>;
  for (const key of Object.keys(given))
    if (key !== "type" && !(key in SKEL_LAYOUT_PARTS))
      findings.push(
        `\`layout.${key}\` is no field of a layout: a layout takes \`type\`, ${Object.keys(
          SKEL_LAYOUT_PARTS,
        )
          .map((p) => `\`${p}\``)
          .join(", ")}`,
      );
  for (const [part, fields] of Object.entries(SKEL_LAYOUT_PARTS)) {
    const look = given[part];
    if (look === undefined) continue;
    if (look === null || typeof look !== "object" || Array.isArray(look)) {
      findings.push(
        `\`layout.${part}\` holds the fields of its look, ${fields.map((f) => `\`${f}\``).join(" · ")}`,
      );
      continue;
    }
    for (const key of Object.keys(look))
      if (!fields.includes(key))
        findings.push(
          `\`layout.${part}.${key}\` is no field of the ${part}'s look, which has ${fields.map((f) => `\`${f}\``).join(" · ")}`,
        );
  }
  // THE CHOSEN ENTRY IS NAMED BY ITS WORD, one of `nav`: the entry that leads to the page the sketch shows.
  const navigation = given.navigation as
    { nav?: unknown; chosen?: unknown; open?: unknown } | undefined;
  if (
    navigation?.open !== undefined &&
    (typeof navigation.open !== "boolean" || given.type !== "RAIL")
  )
    findings.push(
      `\`layout.navigation.open\` is \`${String(navigation.open)}\`: only a \`RAIL\` takes \`open\`, as \`true\`, for a figure about the rail itself; a skeleton draws every rail shut to its icons`,
    );
  const words = Array.isArray(navigation?.nav)
    ? navigation!.nav!.map(String)
    : [];
  if (navigation?.chosen !== undefined && typeof navigation.chosen !== "string")
    findings.push(
      `\`layout.navigation.chosen\` is \`${String(navigation.chosen)}\`; name the open entry by its word, one of \`nav\`, as \`"chosen": "${words[Number(navigation.chosen)] ?? words[0] ?? "Orders"}"\``,
    );
  else if (
    typeof navigation?.chosen === "string" &&
    !words.includes(navigation.chosen)
  )
    findings.push(
      `\`layout.navigation.chosen\` is \`${navigation.chosen}\`, and \`nav\` holds ${words.length ? words.map((word) => `\`${word}\``).join(" · ") : "no word"}`,
    );
  else if (words.length && navigation?.chosen === undefined)
    findings.push(
      "`layout.navigation.nav` names its entries and no `chosen`: a page always stands under one entry of its navigation, so name it",
    );
  const width = (given.body as { width?: unknown } | undefined)?.width;
  if (width !== undefined && !SKEL_BODY_WIDTHS.includes(width as string))
    findings.push(
      `\`layout.body.width\` is \`${String(width)}\`, and a body is ${SKEL_BODY_WIDTHS.join(" · ")}`,
    );
  if (!SKEL_LAYOUT_TYPES.includes(given.type as string)) {
    findings.push(
      `\`layout.type\` is \`${String(given.type)}\`, and a layout is ${SKEL_LAYOUT_TYPES.join(" · ")}`,
    );
    return false;
  }
  return true;
}

/** The entries of a navigation, down a column: the words of `nav` with the chosen one, the page's own entry, in a band,
 *  or bars where it names none; shut, each entry is a square and the chosen one is in a band. */
function skelNavColumn(
  nav: SkeletonLayout["navigation"],
  nx: number,
  ny: number,
  nw: number,
  open: boolean,
  out: string[],
): void {
  const words = Array.isArray(nav?.nav) ? nav!.nav!.map(String) : [];
  const count = words.length || 4;
  for (let i = 0; i < count; i++) {
    const top = ny + i * SKEL_NAV_STEP;
    const isChosen = words.length > 0 && words[i] === nav?.chosen;
    if (isChosen)
      out.push(skelRect("dl-sk-surface", nx + 6, top, nw - 12, 24, "ctl"));
    if (!open)
      out.push(skelRect("dl-bar", nx + nw / 2 - 6, top + 6, 12, 12, "mark"));
    else if (!words.length)
      out.push(skelRect("dl-bar", nx + 14, top + 9, 60, SKEL_BAR, "pill"));
    else
      out.push(
        `  <text class="${isChosen ? "dl-name" : "dl-name"}" x="${r2(nx + 14)}" y="${r2(top + 16)}">${esc(words[i])}</text>`,
      );
  }
}
/** The height a column of entries asks for: its head, its entries, and its foot. */
const skelNavNeed = (nav: SkeletonLayout["navigation"]) =>
  SKEL_LAYOUT_BAR +
  (Array.isArray(nav?.nav) && nav!.nav!.length ? nav!.nav!.length : 4) *
    SKEL_NAV_STEP +
  SKEL_LAYOUT_BAR;
/** The app's tile and its name at the head of a navigation; a sketch names no app, so the name is a bar. */
const skelAppHead = (ax: number, cy: number, named: boolean): string[] => [
  skelRect("dl-bar", ax, cy - 7, 14, 14, "mark"),
  ...(named
    ? [skelRect("dl-bar", ax + 20, cy - SKEL_BAR / 2, 60, SKEL_BAR, "pill")]
    : []),
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
function skelDrawWindow(
  view: SkeletonView,
  layout: SkeletonLayout | undefined,
  x: number,
  y: number,
  findings: string[],
  out: string[],
): number {
  const W = SKEL_VIEW_W[view.viewport],
    phone = view.viewport === "MOBILE",
    desk = view.viewport === "DESKTOP";
  const type = layout?.type;
  const navAt = phone || layout?.navigation?.attached !== false;
  const contentAt = phone || layout?.content?.attached !== false;
  const inset = (attached: boolean) => (attached ? 0 : SKEL_APART);
  const width = layout?.body?.width ?? "FULL";
  const boxW =
    desk && SKEL_BODY_W[width] !== undefined ? SKEL_BODY_W[width] : W;
  const bar =
    type !== undefined && type !== "CANVAS" && (phone || type === "TOPNAV")
      ? SKEL_LAYOUT_BAR
      : 0;
  const nav = layout?.navigation;
  // A SKELETON DRAWS A RAIL SHUT TO ITS ICONS ON EVERY DEVICE, so the content gets the room: there are many skeletons, and a
  // desktop's open rail is only the subject of a figure about the rail itself, which asks for it with `navigation.open`.
  const navOpen =
    desk && (type === "DOCK" || (type === "RAIL" && nav?.open === true));
  const side =
    type !== undefined && !phone && (type === "RAIL" || type === "DOCK")
      ? navOpen
        ? SKEL_RAIL_OPEN
        : SKEL_RAIL_SHUT
      : 0;

  // THE CONTENT'S BOX: beside a rail, centred in the area beside it; otherwise centred in the window.
  const areaX = type === "RAIL" && !phone ? x + inset(navAt) + side : x;
  const areaW = x + W - areaX;
  const contentW = Math.min(boxW, areaW - inset(contentAt) * 2);
  const contentX = areaX + (areaW - contentW) / 2;
  const contentTop =
    y +
    (bar ? inset(navAt) + bar : 0) +
    (type !== undefined ? inset(contentAt) : 0);
  const dock = type === "DOCK" && !phone ? side + inset(navAt) * 2 : 0;
  const innerX = contentX + dock,
    innerW = contentW - dock;

  // THE PAGE LEVEL: the way back, the item of the page at the page's step, and its actions at the end, as one row.
  const frame: SkeletonFrame = {
    ...view.frame,
    headed: view.page !== undefined || view.frame.headed,
  };
  const ctl = skelSizeH(frame, SKEL_DEFAULT_H);
  let pageFrame: SkeletonFrame | undefined;
  if (view.page !== undefined) {
    const page = view.page;
    if (page === null || typeof page !== "object" || !page.item)
      findings.push(
        `the \`${skelViewName(view)}\` view's \`page\` carries its \`item\`: the title of the page, with its description, picture and facts`,
      );
    else
      pageFrame = {
        size: frame.size,
        rows: [
          {
            items: [
              ...(page.back ? [{ icon: "previous" as const }] : []),
              { item: page.item, fill: true, page: true },
              ...(Array.isArray(page.actions) ? page.actions : []),
            ],
          },
        ],
      };
  }
  const pageH = pageFrame
    ? skelRowHeight(pageFrame.rows[0], ctl) + SKEL_GAP
    : 0;
  const frameH = skelFrameHeight(frame, SKEL_DEFAULT_H);
  const contentNeed = pageH + frameH;
  const navNeed =
    side && type === "RAIL" ? skelNavNeed(nav) + inset(navAt) * 2 : 0;
  const H = Math.max(
    contentTop - y + contentNeed + (type !== undefined ? inset(contentAt) : 0),
    navNeed,
    dock ? skelNavNeed(nav) + contentTop - y : 0,
  );
  const contentH = y + H - inset(contentAt) - contentTop;

  // A VIEW THAT NEEDS MORE ROOM THAN ITS CONTENT HAS IS A FINDING, as one that needs more than its class.
  const needs = Math.max(
    skelFrameMinWidth(frame, SKEL_DEFAULT_H),
    pageFrame ? skelFrameMinWidth(pageFrame, SKEL_DEFAULT_H) : 0,
  );
  if (needs > innerW)
    findings.push(
      type === undefined
        ? `the \`${skelViewName(view)}\` view needs ${needs} across, and its class stands at ${W}; an arrangement that does not fit its screen is stacked, or drawn with fewer parts in a row`
        : `the \`${skelViewName(view)}\` view needs ${needs} across, and its content in a \`${type}\` with a \`${width}\` body stands at ${r2(innerW)}; an arrangement that does not fit is stacked, or drawn in a wider body`,
    );

  out.push(skelRect("dl-sk-window", x, y, W, H, "frame"));
  // THE NAVIGATION, a surface at its edge.
  if (type !== undefined && type !== "CANVAS") {
    if (phone) {
      out.push(skelRect("dl-sk-surface", x, y, W, bar, "none"));
      out.push(
        ...skelIcon(
          "menu",
          x + 8 + SKEL_DEFAULT_H / 2,
          y + bar / 2,
          SKEL_DEFAULT_H,
          false,
        ),
      );
      out.push(...skelAppHead(x + 16 + SKEL_DEFAULT_H, y + bar / 2, true));
      out.push(
        ...skelIcon(
          "person",
          x + W - 16 - 12,
          y + bar / 2,
          24,
          true,
          undefined,
          24,
        ),
      );
    } else if (type === "TOPNAV") {
      const barX = x + inset(navAt),
        barW = W - inset(navAt) * 2,
        barY = y + inset(navAt);
      out.push(
        skelRect(
          "dl-sk-surface",
          barX,
          barY,
          barW,
          bar,
          navAt ? "none" : "frame",
        ),
      );
      const boxX = Math.max(x + (W - boxW) / 2, barX);
      out.push(...skelAppHead(boxX + 16, barY + bar / 2, true));
      const words = Array.isArray(nav?.nav) ? nav!.nav!.map(String) : [];
      let wx = boxX + 16 + 80 + SKEL_GAP;
      words.forEach((word, i) => {
        if (word === nav?.chosen)
          out.push(
            skelRect(
              "dl-sk-surface",
              wx - 8,
              barY + 12,
              skelWordW(word) + 16,
              24,
              "ctl",
            ),
          );
        out.push(
          `  <text class="${word === nav?.chosen ? "dl-name" : "dl-name"}" x="${r2(wx)}" y="${r2(barY + bar / 2 + 4)}">${esc(word)}</text>`,
        );
        wx += skelWordW(word) + SKEL_GAP;
      });
      out.push(
        ...skelIcon(
          "person",
          Math.min(boxX + boxW, barX + barW) - 16 - 12,
          barY + bar / 2,
          24,
          true,
          undefined,
          24,
        ),
      );
    } else {
      // A RAIL RUNS THE WINDOW'S HEIGHT; A DOCK'S COLUMN STANDS INSIDE THE CONTENT, AT ITS LEFT.
      const nx = type === "RAIL" ? x + inset(navAt) : contentX + inset(navAt),
        ny = (type === "RAIL" ? y : contentTop) + inset(navAt);
      const nh = (type === "RAIL" ? H : contentH) - inset(navAt) * 2;
      out.push(
        skelRect("dl-sk-surface", nx, ny, side, nh, navAt ? "none" : "frame"),
      );
      out.push(
        ...skelAppHead(
          navOpen ? nx + 14 : nx + side / 2 - 7,
          ny + SKEL_LAYOUT_BAR / 2,
          navOpen,
        ),
      );
      skelNavColumn(nav, nx, ny + SKEL_LAYOUT_BAR, side, navOpen, out);
      out.push(
        ...skelIcon(
          "person",
          navOpen ? nx + 14 + 12 : nx + side / 2,
          ny + nh - SKEL_LAYOUT_BAR / 2,
          24,
          true,
          undefined,
          24,
        ),
      );
    }
  }
  // THE CONTENT, a solid line round its box: square where it is attached, rounded where it stands in.
  if (type !== undefined)
    out.push(
      skelRect(
        "dl-line-edge",
        contentX,
        contentTop,
        contentW,
        contentH,
        contentAt ? "none" : "frame",
      ),
    );
  if (pageFrame)
    skelDrawFrame(
      pageFrame,
      innerX,
      contentTop,
      undefined,
      findings,
      out,
      undefined,
      0,
      SKEL_DEFAULT_H,
      true,
      innerW,
    );
  skelDrawFrame(
    frame,
    innerX,
    contentTop + pageH,
    undefined,
    findings,
    out,
    undefined,
    0,
    SKEL_DEFAULT_H,
    true,
    innerW,
  );
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
function skelDrawViews(
  views: SkeletonView[],
  layout: SkeletonLayout | undefined,
  findings: string[],
  out: string[],
): void {
  const classes = Object.keys(SKEL_VIEW_W);
  const seen = new Set<string>();
  const drawn: SkeletonView[] = [];
  for (const view of views) {
    const viewport = view?.viewport;
    if (!classes.includes(viewport)) {
      findings.push(
        `a view's \`viewport\` is \`${viewport}\`, and a skeleton takes ${classes.join(" · ")}`,
      );
      continue;
    }
    if (view.state !== undefined && !SKEL_TASK_STATES.includes(view.state)) {
      findings.push(
        `a view's \`state\` is \`${String(view.state)}\`, and a view shows one of \`DSTaskStateType\`: ${SKEL_TASK_STATES.join(" · ")}`,
      );
      continue;
    }
    const name = skelViewName(view);
    if (seen.has(name)) {
      findings.push(
        view.state
          ? `two views are \`${name}\`, and a skeleton holds one view for a screen class in a task state`
          : `two views are \`${viewport}\`, and a skeleton holds one view for a screen class`,
      );
      continue;
    }
    seen.add(name);
    if (!view.frame) {
      findings.push(
        `the \`${name}\` view has no \`frame\`; each view is a whole frame of its own`,
      );
      continue;
    }
    drawn.push(view);
  }
  const stateAt = (view: SkeletonView) =>
    view.state === undefined ? -1 : SKEL_TASK_STATES.indexOf(view.state);
  drawn.sort(
    (one, other) =>
      classes.indexOf(one.viewport) - classes.indexOf(other.viewport) ||
      stateAt(one) - stateAt(other),
  );
  const left = FRAME_PAD;
  let x = left,
    y = FRAME_PAD,
    lineH = 0;
  for (const view of drawn) {
    const stands = SKEL_VIEW_W[view.viewport];
    // IN A LAYOUT, OR UNDER A PAGE LEVEL, THE WINDOW STANDS AT ITS CLASS'S WIDTH and what it holds is measured against its content.
    if (layout !== undefined || view.page !== undefined) {
      if (x > left && x + stands > left + SKEL_CANVAS) {
        x = left;
        y += lineH + SKEL_GAP;
        lineH = 0;
      }
      out.push(
        `  <text class="dl-detail" x="${x}" y="${y + SKEL_LABEL_H}">${esc(skelViewName(view))}</text>`,
      );
      lineH = Math.max(
        lineH,
        SKEL_TAG_H +
          skelDrawWindow(view, layout, x, y + SKEL_TAG_H, findings, out),
      );
      x += stands + SKEL_GAP;
      continue;
    }
    const needs = skelFrameMinWidth(view.frame, SKEL_DEFAULT_H);
    if (needs > stands)
      findings.push(
        `the \`${skelViewName(view)}\` view needs ${needs} across, and its class stands at ${stands}; an arrangement that does not fit its screen is stacked, or drawn with fewer parts in a row`,
      );
    const w = Math.max(stands, needs);
    if (x > left && x + w > left + SKEL_CANVAS) {
      x = left;
      y += lineH + SKEL_GAP;
      lineH = 0;
    }
    out.push(
      `  <text class="dl-detail" x="${x}" y="${y + SKEL_LABEL_H}">${esc(skelViewName(view))}</text>`,
    );
    skelDrawFrame(
      view.frame,
      x,
      y + SKEL_TAG_H,
      undefined,
      findings,
      out,
      undefined,
      0,
      SKEL_DEFAULT_H,
      false,
      stands,
    );
    lineH = Math.max(
      lineH,
      SKEL_TAG_H + skelFrameHeight(view.frame, SKEL_DEFAULT_H),
    );
    x += w + SKEL_GAP;
  }
}

/**
 * THE CHOSEN ENTRY IS THE PAGE'S OWN (RULE.DEVEX.WORKSPACE.268). A page that is itself an entry of the navigation stands
 * under that entry, so a view whose page level's title is a word of `nav` and is not the chosen one is a finding: the
 * band would say the person is somewhere the page says they are not. A page below an entry, such as a record or a step,
 * keeps the entry it was reached from, which the spec names as `chosen`.
 */
function skelChosenFindings(
  views: SkeletonView[],
  layout: SkeletonLayout | undefined,
  findings: string[],
): void {
  const words = Array.isArray(layout?.navigation?.nav)
    ? layout!.navigation!.nav!.map(String)
    : [];
  const chosen = layout?.navigation?.chosen;
  if (!words.length || typeof chosen !== "string") return;
  for (const view of views) {
    const title = view?.page?.item?.title;
    if (typeof title === "string" && words.includes(title) && title !== chosen)
      findings.push(
        `the \`${skelViewName(view)}\` view's page is \`${title}\`, an entry of the navigation, and the chosen entry is \`${chosen}\`; the chosen entry is the page's own`,
      );
  }
}

/** A `skeleton` with neither `frame` nor `views` draws nothing: it is one outer frame, or one for each
 *  screen class, and there is no other claim this kind can make. The spec is read from a copy, since the
 *  drawer writes its own marks on what it reads. */
/**
 * A ROW OF PANELS THAT CANNOT STAND ACROSS THE FRAME IS WRAPPED, by the drawer and not by the spec: the book's spec says one row, and where
 * its panels need more than the desktop's 896 the drawer lays them in as many rows as they need, each row the same number of panels (four
 * across that do not fit are two rows of two). A row that fits, or holds anything but panels, or carries a label of its own, is left as written.
 */
function skelWrapRows(
  frame: SkeletonFrame | undefined,
  inherited = SKEL_DEFAULT_H,
): void {
  if (!frame || typeof frame !== "object") return;
  const ctl = skelSizeH(frame, inherited);
  const plain =
    frame.look !== "container" &&
    frame.look !== "card" &&
    frame.unit === undefined &&
    Array.isArray(frame.rows);
  if (plain) {
    const room =
      SKEL_CANVAS -
      skelInset(frame) * 2 -
      (skelLabelCol(frame) ? skelLabelCol(frame) + SKEL_GAP : 0);
    const next: SkeletonRow[] = [];
    for (const row of frame.rows!) {
      const items = Array.isArray(row?.items) ? row.items : [];
      const panels =
        items.length > 1 &&
        items.every(
          (it) =>
            it &&
            typeof it === "object" &&
            skelKind(it) === "frame" &&
            it.frame!.unit === undefined,
        ) &&
        !row.label &&
        !row.framed &&
        !row.within;
      if (!panels || skelRowMinWidth(row, ctl) <= room) {
        next.push(row);
        continue;
      }
      let per = items.length;
      while (
        per > 1 &&
        skelRowMinWidth({ ...row, items: items.slice(0, per) }, ctl) > room
      )
        per--;
      const rowsN = Math.ceil(items.length / per);
      per = Math.ceil(items.length / rowsN);
      for (let i = 0; i < items.length; i += per)
        next.push({ ...row, items: items.slice(i, i + per) });
    }
    // in place: the drawer keeps what it knows of a frame against its rows array
    if (next.length !== frame.rows!.length)
      frame.rows!.splice(0, frame.rows!.length, ...next);
  }
  for (const row of skelRows(frame))
    for (const it of row?.items ?? [])
      if (it && typeof it === "object" && it.frame) skelWrapRows(it.frame, ctl);
}

function drawSkeleton(given: Spec): { svg: string; findings: string[] } {
  const findings: string[] = [];
  const out: string[] = [];
  const spec: Spec = structuredClone(given);
  skelFieldFindings(spec, findings);
  skelWhichUnit(spec.frame, findings);
  if (Array.isArray(spec.views))
    for (const view of spec.views) skelWhichUnit(view?.frame, findings, true);
  skelUnits(spec.frame, findings);
  if (Array.isArray(spec.views))
    for (const view of spec.views) skelUnits(view?.frame, findings);
  skelLooks(spec.frame, findings);
  if (Array.isArray(spec.views))
    for (const view of spec.views)
      skelLooks(
        view?.frame,
        findings,
        undefined,
        undefined,
        undefined,
        view?.viewport,
      );
  skelWrapRows(spec.frame);
  if (Array.isArray(spec.views))
    for (const view of spec.views) skelWrapRows(view?.frame);
  let layout: SkeletonLayout | undefined;
  if (spec.layout !== undefined) {
    if (spec.views === undefined)
      findings.push(
        "`layout` is the layout the views stand in, so a spec with a `layout` holds `views`; give the frame a `viewport`",
      );
    else if (skelLayoutFindings(spec.layout, findings)) layout = spec.layout;
  }
  const views = spec.views !== undefined;
  if (views) {
    if (spec.frame)
      findings.push(
        "a skeleton holds `frame` or `views`, never both; a view carries its own `frame`",
      );
    if (!Array.isArray(spec.views) || !spec.views.length)
      return {
        svg: "",
        findings: [
          ...findings,
          "a `skeleton` figure whose `views` holds no view; give each view a `viewport` and a `frame`",
        ],
      };
    skelChosenFindings(spec.views, layout, findings);
  } else if (!spec.frame)
    return {
      svg: "",
      findings: [
        ...findings,
        "a `skeleton` figure with no `frame` and no `views`; a skeleton is one outer frame, or one for each screen class",
      ],
    };
  const paint = (said: string[], into: string[]) =>
    views
      ? skelDrawViews(spec.views!, layout, said, into)
      : skelDrawFrame(spec.frame!, FRAME_PAD, FRAME_PAD, undefined, said, into);
  // A HEAD WRAPS TO THE WIDTH ITS ROW GIVES IT, and so do an item line's words and a note (RULE.DEVEX.WORKSPACE.303), so a spec that holds
  // one is first drawn to learn each width, and that drawing and what it found are put aside. A spec with none is drawn once.
  if (skelHasHead(spec) || skelHasOptions(spec) || skelHasWords(spec))
    paint([...findings], []);
  paint(findings, out);
  if (views && !out.length) return { svg: "", findings };
  return {
    svg: svgOf(out, spec.title ?? spec.caption ?? "skeleton", "dl-skeleton"),
    findings,
  };
}

const DRAWERS: Record<
  string,
  (s: Spec) => { svg: string; findings: string[] }
> = {
  entities: drawEntities,
  chain: drawChain,
  flowchart: drawFlowchart,
  sequence: drawSequence,
  // A SYSTEM IS 928 WIDE AT MOST, 1:1, 16 from the frame's edge, and clean for the figure check. The bus stands 28 from its tile; where that leaves the
  // figure wider (a rail carries a label on the run into the bus) or the check finds fault, the bus is brought nearer (24, 20, 16), and failing those the
  // figure has no bus and its wires keep their own runs. The edge is never tightened.
  system: (spec: Spec) => {
    const widthOfSvg = (svg: string) =>
      Number(svg.match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/)?.[1] ?? FRAME_W);
    const first = drawSystem(spec);
    let fits: ReturnType<typeof drawSystem> | null = null;
    // the detail of a thing outside wraps at 16 characters where the column allows, then at 14 and 12
    for (const bus of SYS_BUSES)
      for (const note of [16, 14, 12]) {
        const r =
          note === 16 && bus === SYS_BUS_AT
            ? first
            : drawSystem(spec, undefined, bus, note);
        if (!r.svg || widthOfSvg(r.svg) > FRAME_W) continue;
        if (checkFigures(r.svg).length === 0) return r;
        fits ??= r;
      }
    return fits ?? first;
  },
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

const MOTIONS = ["draw-once", "pulse", "focus-steps"];
const MOTION_KINDS: Record<string, string[]> = {
  "draw-once": ["flowchart", "system", "entities", "map", "chain"],
  pulse: ["sequence", "flowchart", "system", "map", "chain"],
  "focus-steps": ["map", "chain"],
};
/** While a figure that steps is drawn, each unit is numbered in the order it is drawn. */
let STEP: number | null = null;
export function draw(spec: Spec): { svg: string; findings: string[] } {
  const kind = (spec.kind ?? "").toLowerCase();
  if (RETIRED[kind]) return { svg: "", findings: [RETIRED[kind]] };
  const drawer = DRAWERS[kind];
  if (!drawer)
    return {
      svg: "",
      findings: [
        `no helper draws a \`${spec.kind}\` figure. The helpers are ${KINDS.join(" · ")}; author this one as SVG in an HTML block in the seat file and it is used verbatim (05-artifacts.md, The figures)`,
      ],
    };
  STEP = spec.motion === "focus-steps" ? 0 : null;
  let drawn: { svg: string; findings: string[] };
  try {
    drawn = drawer(spec);
  } finally {
    /* the count ends with the drawing */
  }
  const stepsDrawn = STEP ?? 0;
  STEP = null;
  void stepsDrawn;
  // A figure that moves says so in its spec (`motion`), and the page's script starts it once 30% of it is in view. The language's Motion table says
  // which kinds may take which: a motion on a kind the table does not allow is a finding.
  if (drawn.svg && spec.motion) {
    if (!MOTIONS.includes(spec.motion as string))
      return {
        svg: drawn.svg,
        findings: [
          ...drawn.findings,
          `\`motion\` is \`${String(spec.motion)}\`, and a figure moves by \`draw-once\`, \`pulse\` or \`focus-steps\`, or not at all`,
        ],
      };
    if (!MOTION_KINDS[spec.motion].includes(kind))
      return {
        svg: drawn.svg,
        findings: [
          ...drawn.findings,
          `\`motion\` \`${spec.motion}\` is for ${MOTION_KINDS[spec.motion].join(", ")} figures; a \`${kind}\` figure stays still`,
        ],
      };
    let svg = drawn.svg.replace(
      /^<svg class="dl-svg/,
      `<svg data-motion="${spec.motion}" class="dl-svg`,
    );
    // a pulse follows the wires in the order they were drawn
    if (spec.motion === "pulse" && !/data-dl-flow=/.test(svg)) {
      let i = 0;
      svg = svg.replace(
        /<path class="dl-wire/g,
        () => `<path data-dl-flow="${++i}" class="dl-wire`,
      );
    }
    return { svg, findings: drawn.findings };
  }
  return drawn;
}

/**
 * THE FIGURE AS A PAGE HOLDS IT: a `dl-figure` of one frame that holds the drawing and the caption the spec gave. The case line (kind,
 * frame, the text sizes, motion, people) is a reviewer's note and belongs to an arc's preview or sample, so it is written only when asked
 * for (`caseLine`); a published page and a template as it ships carry none. The language draws no card, no fill and no
 * border of its own, so the frame is the page's own surface; the page's script gives a figure narrower than its frame the small
 * expand mark and the full view (the language's "Media size").
 */
export function figureOf(
  spec: Spec,
  svg: string,
  caption = "",
  opts: { caseLine?: boolean } = {},
): string {
  const kind = (spec.kind ?? "").toLowerCase();
  const wide = Number(
    svg.match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/)?.[1] ?? FRAME_W,
  );
  const frame =
    wide > FRAME_W ? `${wide}, scaled to the column` : String(FRAME_W);
  const kindName = kind ? kind[0].toUpperCase() + kind.slice(1) : "Figure";
  const steps = spec.motion === "focus-steps" && /data-dl-step=/.test(svg);
  return [
    `<figure class="dl-figure"${steps ? " data-dl-stepped" : ""}>`,
    `<div class="dl-frame">`,
    svg,
    `</div>`,
    ...(steps
      ? [
          `<div class="dl-steps"><button type="button" data-dl-prev>Back</button><button type="button" data-dl-next>Next</button><span data-dl-at></span></div>`,
        ]
      : []),
    ...(caption ? [`<figcaption>${caption}</figcaption>`] : []),
    ...(!opts.caseLine
      ? []
      : [
          `<p class="dl-case"><b>${kindName}</b> &middot; frame ${frame} &middot; labels 12 / 10 / 9.5 px &middot; ${spec.motion === "draw-once" ? "draws once" : spec.motion === "pulse" ? "pulses" : spec.motion === "focus-steps" ? "steps with Next and Back" : "still"} &middot; people: none</p>`,
        ]),
    `</figure>`,
  ].join("\n");
}
