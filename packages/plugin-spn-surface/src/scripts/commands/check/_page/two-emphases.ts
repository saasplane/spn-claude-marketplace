// A SECTION TAKES ONE EMPHASIS AND NEVER TWO (RULE.SUPPORT.SURFACE.438): the emphasis band, a fill other than the ground,
// a gradient, or the one highlight. Two in one section read as two sections' worth of shouting in one.
import { type Page, SECTION, refusal } from "./page.ts";

const emphasisOf = (name: string, props: Record<string, unknown>): string[] => {
  const found: string[] = [];
  if (props.color === "PRIMARY" || props.gradient || props.emphasis || props.band === "EMPHASIS") found.push(`${name} emphasis band`);
  else if (name === SECTION && props.color && props.color !== "BASE") found.push(`${name} fill ${String(props.color)}`);
  if (props.highlight || props.frames === "HIGHLIGHT") found.push(`${name} highlight`);
  return found;
};

export function refusals(page: Page): string[] {
  const found: string[] = [];
  const sections = new Set(page.units.map((unit) => unit.section).filter((section): section is number => section !== null));
  for (const section of sections) {
    const units = page.units.filter((unit) => unit.section === section);
    const emphases = units.flatMap((unit) => emphasisOf(unit.name, unit.props));
    if (emphases.length > 1) found.push(refusal("RULE.SUPPORT.SURFACE.438", units[0].path, `${emphases.length} emphases in one section (${emphases.join(" + ")}); a section takes one`));
  }
  return found;
}
