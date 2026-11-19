// The page a spec is: what every refusal of `spn-surface check page` reads, and the one walk that makes it.
//
// A spec is walked generically. An object with a string `unit` is a design-system unit and its `props` are what
// it is given; an object with a string `media` is a drawing, and the unit it sits inside is its owner. A
// DSSectionContainer opens a section, and every unit after it belongs to that section until the next one.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type Unit = { path: string; name: string; props: Record<string, unknown>; section: number | null };
export type Media = { path: string; file: string; node: Record<string, unknown>; owner: Unit | null };
export type Page = {
  units: Unit[];
  media: Media[];
  /** The drawing's text, or null where the file is not there. */
  read: (file: string) => string | null;
  /** The icon names of the app's lucide set, with its version; null where the app was not read. */
  icons: { names: Set<string>; version: string; node: (name: string) => unknown[] } | null;
  /** The section's content width at the desktop, in pixels, where the spec or the command names it. */
  contentWidth: number | null;
};

export const SECTION = "DSSectionContainer";

/** One line a refusal prints: its name, where it is, and what to do. */
export const refusal = (rule: string, where: string, text: string): string => `REFUSED ${rule} ${where}: ${text}`;

/** The spec's units and drawings, in the order written. */
export function pageOf(spec: unknown, mediaDir: string, icons: Page["icons"], contentWidth: number | null): Page {
  const units: Unit[] = [];
  const media: Media[] = [];
  let sections = -1;
  const walk = (value: unknown, path: string, owner: Unit | null): void => {
    if (Array.isArray(value)) { value.forEach((item, at) => walk(item, `${path}[${at}]`, owner)); return; }
    if (!value || typeof value !== "object") return;
    const node = value as Record<string, unknown>;
    let here = owner;
    if (typeof node.unit === "string") {
      if (node.unit === SECTION) sections += 1;
      here = { path: `${path || "/"} ${node.unit}`, name: node.unit, props: (node.props ?? {}) as Record<string, unknown>, section: sections < 0 ? null : sections };
      units.push(here);
    }
    if (typeof node.media === "string") media.push({ path, file: node.media, node, owner });
    for (const [key, child] of Object.entries(node)) walk(child, `${path}/${key}`, here);
  };
  walk(spec, "", null);
  const read = (file: string): string | null => { const at = resolve(mediaDir, file); return existsSync(at) ? readFileSync(at, "utf8") : null; };
  return { units, media, read, icons, contentWidth: contentWidth ?? ((spec as { contentWidth?: number } | null)?.contentWidth ?? null) };
}
