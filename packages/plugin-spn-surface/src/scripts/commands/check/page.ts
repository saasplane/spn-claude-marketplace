// `spn-surface check page` — a page's spec, refused where it departs from the design language and the design system.
//
//     spn-surface check page <spec.json> --app <app root> [--media <dir>] [--content <px>]
//
// The agent runs it on every write of a spec. It prints one line for each refusal and exits 1, and it prints
// one line and exits 0 where the spec passes. The refusals are one file each in `_page/`: a raw colour, a class on
// a unit, an icon outside the app's lucide set, a hero form its media does not call for, two emphases in one
// section, media on the wrong level, and a drawing under the words narrower than its section's content.
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { UsageFault, VALUE, onePath, readWords, scopeOf, REQUIRED } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { refusals as classOnUnit } from "./_page/class-on-unit.ts";
import { refusals as heroForm } from "./_page/hero-form.ts";
import { refusals as iconOutsideSet } from "./_page/icon-outside-set.ts";
import { refusals as mediaLevel } from "./_page/media-level.ts";
import { type Page, pageOf } from "./_page/page.ts";
import { refusals as rawColour } from "./_page/raw-colour.ts";
import { refusals as twoEmphases } from "./_page/two-emphases.ts";
import { refusals as underPlaced } from "./_page/under-placed.ts";

export const describe = "Refuse a page spec's raw colour, class on a unit, icon outside the app's set, wrong hero form, two emphases, misplaced or under-placed media";
export const usage = "<spec.json> --app <app root> [--media <dir>] [--content <px>]";

/** The app's lucide set, read from its own `node_modules`: the one place its icons come from. */
function iconsOf(app: string): NonNullable<Page["icons"]> {
  let root: string;
  try { root = dirname(createRequire(join(resolve(app), "package.json")).resolve("lucide-react/package.json")); }
  catch { throw new UsageFault(`${app} carries no lucide-react; \`--app\` names the app whose icon set the page draws from.`); }
  const folder = join(root, "dist/esm/icons");
  return {
    version: (JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version: string }).version,
    names: new Set(readdirSync(folder).filter((file) => file.endsWith(".mjs")).map((file) => file.slice(0, -4))),
    node: (name) => {
      const found = readFileSync(join(folder, `${name}.mjs`), "utf8").match(/node:\s*(\[[\s\S]*?\])\s*\n\s*\};/);
      return found ? (Function(`return ${found[1]}`)() as unknown[]) : [];
    },
  };
}

export function run(args: string[]): number {
  const words = readWords(args, { app: VALUE, media: VALUE, content: VALUE });
  const spec = onePath(scopeOf(words.paths, REQUIRED));
  const app = words.value("app");
  if (!app) throw new UsageFault("needs `--app <app root>`, where the icon set is read from.");
  const content = words.value("content");
  const page = pageOf(JSON.parse(readFileSync(spec, "utf8")), resolve(words.value("media") ?? dirname(spec)), iconsOf(app), content ? Number(content) : null);
  const found = [rawColour, classOnUnit, iconOutsideSet, heroForm, twoEmphases, mediaLevel, underPlaced].flatMap((refuse) => refuse(page));
  if (found.length) { console.log(found.join("\n")); return 1; }
  console.log(`OK ${basename(spec)}: no raw colour, no class on a unit, every icon in lucide-react ${page.icons?.version}, hero form matches its media, one emphasis per section, media on its level`);
  return 0;
}
