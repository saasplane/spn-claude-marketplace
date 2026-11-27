import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
// The tree vocabulary the sample recipes write in: a node is `{ unit, props, children }` as `spnutils apps surface render` reads it, and a placement
// is `{ place, … }`. Nothing here draws; a recipe builds a tree and the render draws it.
import type { Tree } from "./types.ts";

export const U = (unit: string, props: Tree = {}, children?: unknown[]): Tree => (children === undefined ? { unit, props } : { unit, props, children });
export const txt = (text: string, typography = "CONTENT_MD", props: Tree = {}): Tree => U("DSText", { typography, ...props }, [text]);
export const muted = (text: string, typography = "CONTENT_SM"): Tree => txt(text, typography, { tone: "MUTED" });
export const col = (children: unknown[], gap = "MD"): Tree => ({ place: "column", gap, children });
export const row = (children: unknown[], gap = "SM"): Tree => ({ place: "row", gap, children });
export const grid = (children: unknown[], desktop = 3, tablet = 2, mobile = 1, gap = "MD"): Tree => ({ place: "grid", gap, columns: { desktop, tablet, mobile }, children });
export const slot = (label: string, ratio = "4:3"): Tree => ({ slot: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40), label, ratio });
export const vl = (value: unknown): Tree => ({ value });

/** A button. `label` null draws an icon-only button, which needs `aria`. */
export function btn(label: string | null, color?: string, variant?: string, icon?: string, aria?: string): Tree {
  const props: Tree = { anchor: { href: "#x" } };
  if (label) props.label = label;
  if (color) props.color = color;
  if (variant) props.variant = variant;
  if (icon) props.startIcon = icon;
  if (aria) props.ariaLabel = aria;
  return U("DSButton", props);
}
export const badge = (label: string, color = "WARNING", variant = "SUBTLE"): Tree => U("DSBadge", { label, color, variant });
/** The badge a feature's eyebrow takes. */
export const eyebrow = (text: string, variant = "OUTLINE", color = "DEFAULT"): Tree => ({ mtype: "BADGE", text, variant, color });
/** One action of a feature: the main one is solid and primary, the others outline. */
export function act(key: string, label: string, href = "#", main = false): Tree {
  return { key, label, anchor: { href }, ...(main ? { color: "PRIMARY", variant: "SOLID" } : { variant: "OUTLINE" }) };
}
/** One item of a feature's items: a title, a line and an icon in a mark; an href makes it a door with an arrow. */
export function fitem(key: string, title: string, description: string | null, icon?: string, href?: string, extra: Tree = {}): Tree {
  const node: Tree = { key, title };
  if (description) node.description = description;
  if (icon) node.media = { mtype: "MARK", icon };
  if (href) { node.anchor = { href }; node.showArrow = true; }
  return { ...node, ...extra };
}
export const GRID = (n = 3): Tree => ({ desktop: n, tablet: Math.min(n, 2), mobile: 1 });
export const DOORS_SURFACE: Tree = { color: "DEFAULT", raised: true, elevation: "MD" };
export const doors = (nodes: Tree[], cols = 3): Tree => ({ type: "GRID", gridColumns: GRID(cols), surface: DOORS_SURFACE, nodes });
/** A list of lines: a bare icon at the start of a line, never a mark above a title (a point is a line a person reads). */
export const lines = (nodes: Tree[], numbered = false): Tree => ({ type: "LIST", ...(numbered ? { numbered: true } : {}), nodes });
export const cells = (nodes: Tree[], cols = 3): Tree => ({ type: "GRID", gridColumns: GRID(cols), nodes });

/** A DSSectionContainer around its children. */
export const sec = (children: unknown[], size = "MD", color = "BASE", props: Tree = {}): Tree => U("DSSectionContainer", { size, color, ...props }, children);
/** A DSFeature. */
export const feat = (props: Tree = {}, level = "CONTAINER"): Tree => U("DSFeature", { pageLevel: level, ...props });
/** A DSItem line. */
export function item(title: string, description?: string | null, level = "CONTENT", end?: unknown, extra: Tree = {}): Tree {
  const props: Tree = { pageLevel: level, title };
  if (description) props.description = description;
  if (end !== undefined) props.endNode = end;
  return U("DSItem", { ...props, ...extra });
}
export const link = (label: string, href = "#x", size = "SM", tone?: string): Tree => U("DSLink", { label, anchor: { href }, size, ...(tone ? { tone } : {}) });

/** A table of text cells. */
export function table(head: string[], rows: unknown[][], bordered = true): Tree {
  const H = U("DSTable.Head", {}, [U("DSTable.Row", {}, head.map((h) => U("DSTable.HCell", {}, [h])))]);
  const B = U("DSTable.Body", {}, rows.map((r) => U("DSTable.Row", {}, r.map((c) => U("DSTable.DCell", {}, c === "" ? [] : [c])))));
  return U("DSTable", bordered ? { bordered: true, rounded: true } : {}, [H, B]);
}

/** The planned mark: a section a visitor could meet, with one Planned badge; the unit it needs stands in its note, never on the page. */
export function plannedSection(title: string, description: string, caption: string, ratio = "16:5"): Tree {
  return sec([feat({ title, description, eyebrow: eyebrow("Planned", "SOLID", "WARNING"), mediaNode: slot(caption, ratio), type: "MEDIA_BOTTOM" })]);
}
export function plannedPanel(title: string, caption: string): Tree {
  return U("DSFeature", { pageLevel: "CONTAINER", type: "MEDIA_BOTTOM", title, description: "This part is planned and is not drawn yet.", eyebrow: eyebrow("Planned", "SOLID", "WARNING"), mediaNode: slot(caption, "16:4") });
}

/** Two rules swept over every tree before it is drawn: an arrow stands only on a door, and an icon above a title is for a grid item only. */
export function sweep<T>(node: T): T {
  if (Array.isArray(node)) { node.forEach(sweep); return node; }
  if (node && typeof node === "object") {
    const record = node as Tree;
    const items = record.items as Tree | undefined;
    if (items && Array.isArray(items.nodes)) {
      const nodes = items.nodes as Tree[];
      if (items.type === "LIST") nodes.forEach((x) => { if (x && x.media && !("orientation" in x)) x.orientation = "HORIZONTAL"; });
      else if (items.type === "GRID" && !items.surface) nodes.forEach((x) => { if (x) delete x.showArrow; });
    }
    Object.values(record).forEach(sweep);
  }
  return node;
}

/** A quote: a person's words, who said them and the role they hold, framed as a card where `card` is set. */
export const quote = (words: string, name: string, role: string, card = false, level = "WIDGET"): Tree =>
  U("DSQuote", { quote: words, speaker: { title: name, description: role, media: { mtype: "AVATAR", title: name } }, pageLevel: level, ...(card ? { surface: { raised: true, elevation: "MD" } } : {}) });

/** A keyboard key combination. */
export const kbd = (keys: string[]): Tree => U("DSKbd", { keys });

/** A picture's place with no caption drawn in it: a neutral fill at the slot's shape (a ratio) or its height in pixels, for where words stand over or beside it. */
export const bare = (name: string, ratio?: string, height?: number, width?: number): Tree => ({ slot: name, label: "", ...(ratio ? { ratio } : {}), ...(height ? { height } : {}), ...(width ? { width } : {}) });


// ---- what the design system draws: a recipe that uses a unit newer than the released design system asks `dsHas` first and falls back to today's drawing.
let dsVersion = "";
const dsNames = new Map<string, string>();
/** The design system version the samples draw against; set once by the draw. */
export const setDs = (version: string): void => { dsVersion = version; };
/** Whether the design system the samples draw against exports a unit: read from the installed package's declarations, or from SPN_SURFACE_DS_UNITS (a list with a comma between) where a test names them. */
export function dsHas(unit: string): boolean {
  if (process.env.SPN_SURFACE_DS_UNITS !== undefined) return process.env.SPN_SURFACE_DS_UNITS.split(",").includes(unit);
  if (!dsNames.has(dsVersion)) {
    const file = join(homedir(), ".saasplane", "cache", "design-system", dsVersion, "node_modules", "@saasplane", "support-web-ds-ts", "index.d.ts");
    dsNames.set(dsVersion, existsSync(file) ? readFileSync(file, "utf8") : "");
  }
  return new RegExp(`\\b${unit}\\b`).test(dsNames.get(dsVersion) ?? "");
}

/** Whether the design system the samples draw against is at least a version: for a prop of a unit the drawing may use only from that version on, where `dsHas` names units. */
export function dsAtLeast(version: string): boolean {
  const n = (v: string): number[] => v.split(".").map((x) => Number.parseInt(x, 10) || 0);
  const [a, b] = [n(dsVersion), n(version)];
  for (let i = 0; i < 3; i++) { if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0); }
  return true;
}
