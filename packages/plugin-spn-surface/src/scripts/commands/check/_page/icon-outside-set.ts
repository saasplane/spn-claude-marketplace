// AN ICON OUTSIDE THE APP'S LUCIDE SET IS REFUSED. The set the app carries in its own `node_modules` is the only icon source: a name
// it does not hold names no icon, and a drawing offered as an icon must be a path set the app's version draws.
import { type Page, refusal } from "./page.ts";

const GEOMETRY = ["d", "cx", "cy", "r", "x", "y", "width", "height", "rx", "ry", "x1", "y1", "x2", "y2", "points"];
type Shape = [string, Record<string, unknown>];

const signature = (shapes: Shape[]): string => shapes
  .map(([tag, a]) => `${tag}|${GEOMETRY.filter((k) => a[k] !== undefined).map((k) => `${k}=${String(a[k]).replace(/\s+/g, " ").trim()}`).join(";")}`)
  .sort().join("\n");

/** The shapes a drawing writes, by the geometry that makes them and never by colour or key. */
const shapesOf = (svg: string): Shape[] => [...svg.matchAll(/<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*?)\/?>/g)].map(([, tag, raw]) => {
  const attributes: Record<string, string> = {};
  for (const [, key, value] of raw.matchAll(/([\w-]+)="([^"]*)"/g)) attributes[key] = value;
  return [tag, attributes];
});

export function refusals(page: Page): string[] {
  const set = page.icons;
  if (!set) return [];
  const found: string[] = [];
  for (const unit of page.units) {
    const icon = unit.props.icon;
    if (typeof icon === "string" && !set.names.has(icon)) found.push(refusal("icon-outside-set", unit.path, `icon "${icon}" is not in lucide-react ${set.version}, the set this app carries`));
  }
  for (const medium of page.media) {
    const named = medium.node.icon;
    if (named === undefined && medium.node.as !== "icon") continue;
    const svg = page.read(medium.file);
    if (svg === null) continue;
    const mine = signature(shapesOf(svg));
    const names = typeof named === "string" ? [named] : [...set.names];
    if (names.some((name) => set.names.has(name) && signature(set.node(name) as Shape[]) === mine)) continue;
    found.push(refusal("icon-outside-set", medium.file, typeof named === "string" && !set.names.has(named)
      ? `icon "${named}" is not in lucide-react ${set.version}`
      : `${typeof named === "string" ? `its paths are not lucide-react ${set.version}'s "${named}"` : `its paths match no icon in lucide-react ${set.version}`}; the app's set is the only icon source`));
  }
  return found;
}
