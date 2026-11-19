// A RAW COLOUR IS REFUSED IN A DRAWING AND IN A UNIT'S PROPS. A drawing takes its colours from the theme's tokens, or mixes of them, so
// that any brand's theme recolours it; a hex or a function colour written into it is one the theme cannot reach.
import { type Page, refusal } from "./page.ts";

const LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i;
const NAMED = /^(red|green|blue|white|black|gray|grey|orange|yellow|purple|pink|teal|navy|brown|silver|gold|cyan|magenta)$/i;

/** The colour literals a drawing writes, in its attributes and in its style text; a `var(...)` is never one. */
export function literalsOf(svg: string): string[] {
  const found: string[] = [];
  for (const [, value] of svg.matchAll(/\b(?:fill|stroke|stop-color|flood-color|lighting-color|color)="([^"]*)"/g))
    if (LITERAL.test(value) || NAMED.test(value.trim())) found.push(value);
  const styles = [...svg.matchAll(/style="([^"]*)"/g), ...svg.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  for (const text of styles)
    for (const m of text.replace(/var\([^)]*\)/g, "").matchAll(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^)]*\)/gi)) found.push(m[0]);
  return [...new Set(found)];
}

export function refusals(page: Page): string[] {
  const found: string[] = [];
  for (const unit of page.units) {
    const json = JSON.stringify(unit.props);
    const at = json.search(LITERAL);
    if (at >= 0) found.push(refusal("raw-colour", unit.path, `the colour ${json.slice(at).match(/^[^",}\]]+/)?.[0]} is written in props; a drawing takes a colour from the theme's tokens`));
  }
  for (const medium of page.media) {
    const svg = page.read(medium.file);
    if (svg === null) { found.push(refusal("media-missing", `${medium.path} ${medium.file}`, "the media file does not exist")); continue; }
    const hits = literalsOf(svg);
    if (hits.length) found.push(refusal("raw-colour", `${medium.file}:${svg.slice(0, Math.max(0, svg.indexOf(hits[0]))).split("\n").length}`, `${hits.join(", ")} written in the drawing; use a theme token, as var(--...) or currentColor`));
  }
  return found;
}
