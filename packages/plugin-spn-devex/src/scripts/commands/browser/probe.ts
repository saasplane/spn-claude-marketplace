// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A page is proved by its values, in the arc's final row
// The chapter is the source of truth; a rule change is edited there first, then here.
//
// A page read as values, never a picture: computed properties, the ancestors' attributes that decide
// them, and the stylesheet rule that set each. Headless, its own Chromium, no screenshot. A selector with
// no match is reported; a page that does not load exits 1.

import { FLAG, UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { playwrightPath } from "../docs/figure.ts";

export const describe = "read a page as values: computed properties, ancestors' attributes, the rules that set them, and the accessibility tree";
export const usage = "<url> --select <css> [--select <css> …] [--props <p,…>] [--ancestors <a,…>] [--rules <p,…>] [--aria] [--mode light|dark] [--width <px>] [--wait <ms>]";

const DEFAULT_PROPS = ["background-color", "color", "font-size", "font-weight", "width", "height"];
const NOT_CHECKED = [
  "not checked — no browser on this machine, so nothing was read. This is not a failure.",
  "To install one: npm install -g playwright && npx playwright install chromium",
];

const list = (values: string[]): string[] => values.flatMap((value) => value.split(",")).map((part) => part.trim()).filter(Boolean);

/** Runs in the page, so it holds no closure over this file. */
const READ = (job: { select: string; props: string[]; ancestors: string[]; rules: string[] }) => {
  const sheetName = (sheet: CSSStyleSheet): string =>
    sheet.href || (sheet.ownerNode as Element | null)?.getAttribute?.("data-vite-dev-id") || "inline";
  const topLevel = (text: string): string[] => {
    const out: string[] = []; let depth = 0, start = 0;
    for (let i = 0; i < text.length; i += 1) {
      const c = text[i];
      if (c === "\\") { i += 1; continue; }
      if (c === "(" || c === "[") depth += 1; else if (c === ")" || c === "]") depth -= 1;
      else if (c === "," && depth === 0) { out.push(text.slice(start, i)); start = i + 1; }
    }
    out.push(text.slice(start));
    return out.map((part) => part.trim()).filter(Boolean);
  };
  // Specificity of one complex selector as [ids, classes, types] folded into one number: `:is()`, `:not()` and `:has()`
  // count their most specific argument, `:where()` counts nothing.
  const specificity = (selector: string): number => {
    let ids = 0, classes = 0, types = 0;
    const text = selector.replace(/"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/g, "\"\"");
    const ident = /^(?:\\.|[\w-])+/;
    for (let i = 0; i < text.length;) {
      const rest = text.slice(i);
      const c = text[i];
      if (c === "#") { ids += 1; i += 1 + (rest.slice(1).match(ident)?.[0].length ?? 0); }
      else if (c === ".") { classes += 1; i += 1 + (rest.slice(1).match(ident)?.[0].length ?? 0); }
      else if (c === "[") { classes += 1; let depth = 0; for (; i < text.length; i += 1) { if (text[i] === "[") depth += 1; else if (text[i] === "]" && --depth === 0) { i += 1; break; } } }
      else if (rest.startsWith("::")) { types += 1; i += 2 + (rest.slice(2).match(ident)?.[0].length ?? 0); if (text[i] === "(") { let depth = 0; for (; i < text.length; i += 1) { if (text[i] === "(") depth += 1; else if (text[i] === ")" && --depth === 0) { i += 1; break; } } } }
      else if (c === ":") {
        const name = (rest.slice(1).match(ident)?.[0] ?? "").toLowerCase();
        i += 1 + name.length;
        let args = "";
        if (text[i] === "(") { const open = i; let depth = 0; for (; i < text.length; i += 1) { if (text[i] === "(") depth += 1; else if (text[i] === ")" && --depth === 0) { i += 1; break; } } args = text.slice(open + 1, i - 1); }
        if (name === "where") continue;
        if (name === "is" || name === "not" || name === "has" || name === "matches") {
          const best = Math.max(0, ...topLevel(args).map(specificity));
          ids += Math.floor(best / 1e6); classes += Math.floor((best % 1e6) / 1e3); types += best % 1e3;
        } else if (name === "before" || name === "after" || name === "first-line" || name === "first-letter") types += 1;
        else classes += 1;
      }
      else if (/[a-zA-Z\\]/.test(c)) { types += 1; i += rest.match(ident)?.[0].length ?? 1; }
      else i += 1;
    }
    return ids * 1e6 + classes * 1e3 + types;
  };
  // A nested rule's selector, made whole from its parent's: `&` stands for the parent, and a selector with no `&` is a
  // descendant of it. Matched alone, a bare `&` would match every element.
  const nest = (selector: string, parent: string | null): string =>
    parent === null ? selector : selector.includes("&") ? selector.split("&").join(`:is(${parent})`) : `:is(${parent}) ${selector}`;
  // The shorthands that can set a longhand: `background` for `background-color`, `border-top`, `border-color` and
  // `border` for `border-top-color`. A shorthand written with `var()` leaves its longhands empty in the rule's style.
  // A custom property has none.
  const shorthands = (prop: string): string[] => {
    if (prop.startsWith("--")) return [];
    const parts = prop.split("-");
    const out: string[] = [];
    for (let k = parts.length - 1; k >= 1; k -= 1) out.push(parts.slice(0, k).join("-"));
    if (parts.length > 2) out.push(`${parts[0]}-${parts[parts.length - 1]}`);
    return out;
  };
  // A cascade layer's place: unlayered rules come after every layer, and a layer ranks by the first time it is named.
  const layerRank = new Map<string, number>();
  const rankOf = (layer: string | null): number => {
    if (layer === null) return Number.MAX_SAFE_INTEGER;
    if (!layerRank.has(layer)) layerRank.set(layer, layerRank.size);
    return layerRank.get(layer) as number;
  };
  type Entry = { sheet: string; selector: string; value: string; shorthand: string | null; important: boolean; layer: number; specificity: number; order: number };
  const collected: { el: Element; prop: string; entry: Entry }[] = [];
  const els = [...document.querySelectorAll(job.select)];
  let order = 0;
  const walk = (rules: CSSRuleList, sheet: string, parent: string | null, layer: string | null): void => {
    for (const rule of rules as unknown as CSSRule[]) {
      const media = (rule as CSSMediaRule).media;
      if (media && !window.matchMedia(media.mediaText).matches) continue;
      if (rule.constructor.name === "CSSSupportsRule" && !CSS.supports((rule as CSSSupportsRule).conditionText)) continue;
      if (rule.constructor.name === "CSSLayerStatementRule") {
        for (const name of (rule as CSSLayerStatementRule).nameList) rankOf(layer === null ? name : `${layer}.${name}`);
        continue;
      }
      let inner = layer;
      if (rule.constructor.name === "CSSLayerBlockRule") {
        const name = (rule as CSSLayerBlockRule).name;
        inner = layer === null ? name : `${layer}.${name}`;
        rankOf(inner);
      }
      const selectorText = (rule as CSSStyleRule).selectorText;
      // Declarations after a nested rule sit in a rule of their own, with no selector: they apply to the parent's.
      const own = selectorText ? topLevel(selectorText).map((part) => nest(part, parent))
        : rule.constructor.name === "CSSNestedDeclarations" && parent !== null ? [parent] : [];
      const style = (rule as CSSStyleRule).style;
      if (own.length && style) {
        order += 1;
        for (const part of own) {
          for (const el of els) {
            let hit = false;
            try { hit = el.matches(part); } catch { hit = false; }
            if (!hit) continue;
            for (const prop of job.rules) {
              let value = style.getPropertyValue(prop), shorthand: string | null = null, priority = style.getPropertyPriority(prop);
              if (!value) {
                shorthand = shorthands(prop).find((name) => style.getPropertyValue(name)) ?? null;
                if (shorthand === null) continue;
                value = style.getPropertyValue(shorthand); priority = style.getPropertyPriority(shorthand);
              }
              collected.push({ el, prop, entry: { sheet, selector: part, value, shorthand, important: priority === "important",
                layer: rankOf(inner), specificity: specificity(part), order } });
            }
          }
        }
      }
      const grouped = (rule as CSSGroupingRule).cssRules;
      if (grouped) walk(grouped, sheet, selectorText ? topLevel(selectorText).map((part) => nest(part, parent)).join(", ") : parent, inner);
    }
  };
  if (job.rules.length) {
    for (const sheet of document.styleSheets) {
      try { walk(sheet.cssRules, sheetName(sheet), null, null); } catch { /* a sheet from another origin cannot be read */ }
    }
  }
  return els.map((el, index) => {
    const style = getComputedStyle(el);
    const props: Record<string, string> = {};
    for (const prop of job.props) props[prop] = style.getPropertyValue(prop);
    const box = el.getBoundingClientRect();
    const ancestors: { tag: string; slot: string | null; attrs: Record<string, string> }[] = [];
    if (job.ancestors.length) {
      for (let up = el.parentElement; up; up = up.parentElement) {
        const attrs: Record<string, string> = {};
        for (const name of job.ancestors) { const value = up.getAttribute(name); if (value !== null) attrs[name] = value; }
        if (Object.keys(attrs).length) ancestors.push({ tag: up.tagName.toLowerCase(), slot: up.getAttribute("data-slot"), attrs });
      }
    }
    // The cascade's order, winner first: important before normal; among normal rules the later layer and unlayered win,
    // among important ones the earlier layer; then specificity, then the later rule.
    const rules: Record<string, { sheet: string; selector: string; value: string; shorthand?: string }[]> = {};
    for (const prop of job.rules) {
      rules[prop] = collected.filter((c) => c.el === el && c.prop === prop)
        .sort((a, b) => Number(b.entry.important) - Number(a.entry.important)
          || (a.entry.important ? a.entry.layer - b.entry.layer : b.entry.layer - a.entry.layer)
          || b.entry.specificity - a.entry.specificity || b.entry.order - a.entry.order)
        .map(({ entry }) => ({ sheet: entry.sheet, selector: entry.selector, value: entry.value,
          ...(entry.shorthand === null ? {} : { shorthand: entry.shorthand }) }));
    }
    return { select: job.select, index, text: (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60), props,
      box: { x: box.x, y: box.y, width: box.width, height: box.height }, ancestors, rules };
  });
};

export async function run(args: string[]): Promise<number> {
  const words = readWords(args, { select: VALUE, props: VALUE, ancestors: VALUE, rules: VALUE, aria: FLAG,
    mode: ["light", "dark"], width: VALUE, wait: VALUE });
  // A URL is not a path, so it is never resolved against the working folder.
  if (words.paths.length !== 1) throw new UsageFault(words.paths.length ? "takes one url." : "needs a url.");
  const [url] = words.paths;
  const selects = words.values("select");
  if (!selects.length && !words.given("aria")) throw new UsageFault("needs `--select <css>`, or `--aria` for the whole page.");
  const number = (name: string, fallback: number): number => {
    const given = words.value(name);
    if (given === null) return fallback;
    const parsed = Number(given);
    if (!Number.isFinite(parsed) || parsed < 0) throw new UsageFault(`takes \`--${name}\` as a number of ${name === "width" ? "pixels" : "milliseconds"}.`);
    return parsed;
  };
  const width = number("width", 1440), wait = number("wait", 1000);
  const props = words.given("props") ? list(words.values("props")) : DEFAULT_PROPS;
  const ancestors = list(words.values("ancestors")), rules = list(words.values("rules"));
  const mode = words.value("mode");

  const entry = playwrightPath();
  if (!entry) { for (const line of NOT_CHECKED) console.log(line); return 0; }
  const { chromium } = await import(entry);
  const browser = await chromium.launch();
  try {
    const page = await (await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width, height: 900 } })).newPage();
    try {
      const response = await page.goto(url, { waitUntil: "load", timeout: 90000 });
      // A server that answers with an error page has not served the page that was asked for.
      if (response && response.status() >= 400) {
        console.error(`The page ${url} did not load: the server answered ${response.status()} ${response.statusText()}.`.replace(/ \./, "."));
        return 1;
      }
    } catch (thrown) {
      console.error(`The page ${url} did not load: ${String((thrown as Error).message).split("\n")[0]}`);
      return 1;
    }
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => undefined);
    if (mode) await page.evaluate((value: string) => document.documentElement.setAttribute("data-mode", value), mode);
    await page.waitForTimeout(wait);

    const matches: unknown[] = [];
    for (const select of selects) {
      let found: any[];
      try { found = await page.evaluate(READ, { select, props, ancestors, rules }); }
      catch { throw new UsageFault(`\`${select}\` is not a selector the page can read.`); }
      if (!found.length) matches.push({ select, index: null, text: null, props: {}, box: null, ancestors: [], rules: {} });
      if (words.given("aria")) {
        for (const one of found) one.aria = await page.locator(select).nth(one.index).ariaSnapshot();
      }
      matches.push(...found);
    }
    const result: Record<string, unknown> = { url, width, mode: mode ?? null, matches };
    if (words.given("aria") && !selects.length) result.aria = await page.locator("body").ariaSnapshot();
    console.log(JSON.stringify(result, null, 2));
    return 0;
  } finally {
    await browser.close();
  }
}
