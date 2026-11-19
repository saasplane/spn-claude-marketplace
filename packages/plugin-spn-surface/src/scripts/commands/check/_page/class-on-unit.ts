// A CLASS ON A DESIGN-SYSTEM UNIT IS A MISSING PROP (RULE.SUPPORT.SURFACE.442). The unit takes its look from its props and the theme; a class
// written to get a look is a look a partner's agent cannot rebuild, so the gap goes to the design system and the page keeps the unit as it is.
import { type Page, refusal } from "./page.ts";

export function refusals(page: Page): string[] {
  const found: string[] = [];
  for (const unit of page.units)
    for (const key of ["className", "class"])
      if (key in unit.props) found.push(refusal("class-on-unit", unit.path, `${key}="${String(unit.props[key])}" on a design-system unit; the unit takes its look from its props and the theme, never a class`));
  return found;
}
