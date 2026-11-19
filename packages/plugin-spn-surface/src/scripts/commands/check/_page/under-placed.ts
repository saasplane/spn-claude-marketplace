// A DRAWING UNDER THE WORDS IS DRAWN FOR THE SECTION'S CONTENT WIDTH. One drawn for the side, then centred in an empty band, reads
// as a mistake; it is made wide for its own frame and lined up with the grid or the items above it.
import { type Page, refusal } from "./page.ts";

/** The drawing's width: the spec's own, or the width of its viewBox. */
const widthOf = (node: Record<string, unknown>, svg: string | null): number | null => {
  if (typeof node.width === "number") return node.width;
  const box = svg?.match(/viewBox="\s*[\d.-]+[ ,]+[\d.-]+[ ,]+([\d.]+)/);
  return box ? Number(box[1]) : null;
};

export function refusals(page: Page): string[] {
  if (page.contentWidth === null) return [];
  const found: string[] = [];
  for (const medium of page.media) {
    if (medium.node.placement !== "under") continue;
    const width = widthOf(medium.node, page.read(medium.file));
    if (width !== null && width < page.contentWidth)
      found.push(refusal("under-placed", medium.file, `drawn ${width} wide under the words, narrower than the section's content (${page.contentWidth}); draw it for the content width, lined up with what is above`));
  }
  return found;
}
