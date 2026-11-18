// A HERO FORM IS THE ONE ITS MEDIA CALLS FOR. A scene stands behind the words (BACKDROP), one picture stands at their end (SPLIT_END),
// and a wide picture or two panes stand under them (MEDIA_BOTTOM); a hero in another form crops or crowds its drawing.
import { type Page, refusal } from "./page.ts";

const FORM: Record<string, string> = { scene: "BACKDROP", picture: "SPLIT_END", wide: "MEDIA_BOTTOM", panes: "MEDIA_BOTTOM" };
const SAID: Record<string, string> = { scene: "a scene", picture: "a picture", wide: "a wide picture", panes: "two panes" };

export function refusals(page: Page): string[] {
  const found: string[] = [];
  for (const unit of page.units) {
    const medium = unit.props.mediaNode as { kind?: string } | undefined;
    if (unit.name !== "DSFeature" || unit.props.pageLevel !== "PAGE" || !medium) continue;
    const kind = medium.kind ?? "picture";
    const want = FORM[kind];
    if (want && unit.props.type !== want) found.push(refusal("hero-form", unit.path, `${SAID[kind]} calls for type ${want}, the hero says ${String(unit.props.type ?? "none")}`));
  }
  return found;
}
