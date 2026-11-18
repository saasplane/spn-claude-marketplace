// MEDIA STANDS ON ITS OWN LEVEL. A hero scene goes through the section's media, edge to edge; a close-up or a sheet goes through the
// feature's media, and a small picture through the item's. A scene in a feature that is no hero, or a sheet on a section, is on the wrong level.
import { type Page, SECTION, refusal } from "./page.ts";

export function refusals(page: Page): string[] {
  const found: string[] = [];
  for (const medium of page.media) {
    const kind = medium.node.kind;
    const owner = medium.owner;
    if (!owner) continue;
    if (kind === "scene" && owner.name === "DSFeature" && owner.props.pageLevel !== "PAGE")
      found.push(refusal("media-level", owner.path, `the scene ${medium.file} is on a feature's media; a hero scene goes through the section's media, edge to edge`));
    if ((kind === "closeup" || kind === "sheet") && owner.name === SECTION)
      found.push(refusal("media-level", owner.path, `the ${kind} ${medium.file} is on a section's media; a close-up or a sheet goes through the feature's media`));
  }
  return found;
}
