// RESTATES: docs/04-capabilities/02-support/01-surface/06-architecture-components/01-common/01-components.md
// § Actions, § The item line, § The badge and § The choice table of `DSBadge`;
// docs/04-capabilities/02-support/01-surface/08-architecture-containers/01-common/01-container.md;
// docs/04-capabilities/02-support/01-surface/10-architecture-app/01-common/02-settings-and-theme.md;
// RD.SUPPORT.SURFACE.368, .369, .370, .374, .378, .382, .384, .385, .263 and RD.SUPPORT.APPS.147, .150, .218.
//
// The eight notes of the Surface check, each a soft note to the agent naming its book row and the fix
// (RD.DEVEX.AGENT.107: in the first release no rule refuses a write). Each reads what one file shows —
// named design-system tags and literal enum members — and stays silent where the deciding fact is not
// written in it: a colour from a lookup, a variant left to the place, props that arrive by a spread.
import { attrOf, lineOf, memberOf, spreads, type Read, type Tag } from "./jsx.ts";

/** One note: its rule, a key that names the same finding in the file before and after a write, its words. */
export type Finding = { rule: string; key: string; line: number; text: string };

const CONTAINERS = new Set(["DSPanelContainer", "DSDataTablePanelContainer", "DSSectionContainer", "DSFeatureGridSectionContainer"]);
const CARDS = new Set(["DSCard", "DSCardWidget", "DSItemCard"]);
const SECTIONS = new Set(["DSSectionContainer", "DSFeatureGridSectionContainer"]);
/** A view of its own (RD.SUPPORT.SURFACE.370): a dialog, a drawer, a sheet or a step. */
const VIEW = /(Dialog|Drawer|Sheet|Step)$/;
const PICTURE_TAG = /(Image|Picture|Cover|Media|Avatar|Photo|Thumbnail)$|^img$/;
const PICTURE_ATTR = /^(media|mediaNode|image|imageNode|cover|coverNode|picture|thumbnail)$/;
const OVERLAY = /(Dialog|Drawer|Sheet|Popover)$/;

// The hue table of RD.SUPPORT.SURFACE.369, by the values the book lists. `EXPIRED` fits two rows and is left
// to the reader of the code, as the book says.
const HUE: Record<string, string> = {};
for (const [hue, values] of Object.entries({
  SUCCESS: "ACTIVE LIVE VERIFIED PUBLISHED SENT PAID ACCEPTED",
  WARNING: "PENDING INVITED UNVERIFIED AWAITING_APPROVAL",
  ERROR: "FAILED REJECTED BLOCKED BOUNCED",
  INFO: "RUNNING PROCESSING SYNCING SCHEDULED",
  DEFAULT: "DRAFT DISABLED ARCHIVED REVOKED",
  PRIMARY: "CURRENT DEFAULT PRIMARY ALPHA BETA",
})) for (const value of values.split(" ")) HUE[value] = hue;

const last = (name: string): string => name.split(".").at(-1) ?? name;
const ancestors = function* (tag: Tag): Generator<Tag> { for (let at = tag.parent; at; at = at.parent) yield at; };
/** A tag named by what it writes, never by where it stands, so a line moved by an edit keeps its key. */
const signature = (tag: Tag): string =>
  `${tag.name}|${tag.attrs.map((attr) => `${attr.name}=${attr.value.replace(/\s+/g, " ").trim()}`).join("|")}`;

/** The design-system names this file imports from a package, so a unit is one the page uses, not builds. */
function packageUnits(code: string, source: string): Set<string> {
  const units = new Set<string>();
  for (const match of code.matchAll(/\bimport\s+(?:type\s+)?\{([^}]*)\}\s*from\s*(['"])/g)) {
    const quoteAt = (match.index ?? 0) + match[0].length - 1;
    const close = source.indexOf(match[2], quoteAt + 1);
    const specifier = source.slice(quoteAt + 1, close);
    if (specifier.startsWith(".")) continue;
    for (const name of match[1].split(",")) {
      const local = name.trim().split(/\s+as\s+/).at(-1)?.trim();
      if (local && /^DS[A-Z]/.test(local)) units.add(local);
    }
  }
  return units;
}

/** Every note this file's text gets, in source order. */
export function notesOf(source: string, read: Read): Finding[] {
  const found: Finding[] = [];
  const units = packageUnits(read.code, source);
  const isUnit = (tag: Tag, name?: string): boolean => {
    const root = tag.name.split(".")[0];
    return units.has(root) && (name === undefined || tag.name === name);
  };
  const add = (rule: string, tag: Tag | null, at: number, key: string, text: string): void => {
    found.push({ rule, key: `${rule}|${key}`, line: lineOf(source, tag ? tag.start : at), text });
  };
  const solidButtons = new Map<string, Tag[]>();

  for (const tag of read.tags) {
    const line = lineOf(source, tag.start);
    const where = `\`${tag.name}\` at line ${line}`;
    const variant = memberOf(tag, "variant", "DSVariantType");
    const color = memberOf(tag, "color", "DSColorType");

    if (isUnit(tag, "DSBadge") && variant === "OUTLINE" && color && color !== "DEFAULT" && color !== "CUSTOM")
      add("badge-kind-look", tag, 0, signature(tag),
        `${where} is \`OUTLINE\` in \`${color}\`. An \`OUTLINE\` badge names a kind or a type, and a kind draws \`OUTLINE\` in \`DEFAULT\` (RD.SUPPORT.SURFACE.368). If it names a kind, write \`DSColorType.DEFAULT\` or leave \`color\` out; if it says a state, leave \`variant\` to the place and take the hue from the hue table (RD.SUPPORT.SURFACE.369).`);

    if (isUnit(tag, "DSBadge") && variant === "SOLID") {
      const overPicture = [tag, ...ancestors(tag)].some((at) => (at.inAttr && PICTURE_ATTR.test(at.inAttr)) || (at !== tag && PICTURE_TAG.test(last(at.name))));
      if (!overPicture)
        add("badge-solid", tag, 0, signature(tag),
          `${where} writes \`SOLID\` outside a picture. A badge is \`SOLID\` only over a picture, where a tint cannot be read (RD.SUPPORT.SURFACE.374, .378). Leave \`variant\` out so the place or the level gives it; a strong fill is never how a badge stands out.`);
    }

    if (color === "CUSTOM" && !spreads(tag)) {
      if (isUnit(tag, "DSBadge") && !attrOf(tag, "customColor"))
        add("custom-no-colour", tag, 0, signature(tag),
          `${where} is \`CUSTOM\` with no \`customColor\`, so it draws \`DEFAULT\`. \`CUSTOM\` is a label a person coloured, and its colour goes in \`customColor\` (RD.SUPPORT.SURFACE.382); give it that colour, or write the hue the badge means.`);
      if (isUnit(tag, "DSButton") || isUnit(tag, "DSMark"))
        add("custom-no-colour", tag, 0, signature(tag),
          `${where} is \`CUSTOM\`, and a ${tag.name === "DSButton" ? "button" : "mark"} has no colour of its own to draw from, so it draws \`DEFAULT\` (${tag.name === "DSButton" ? "RD.SUPPORT.SURFACE.384" : "RD.SUPPORT.SURFACE.385"}). Write the colour its ${tag.name === "DSButton" ? "act" : "state or brand"} gives, or leave \`color\` out.`);
    }

    if (isUnit(tag, "DSButton") && variant === "SOLID") {
      const view = [...ancestors(tag)].find((at) => VIEW.test(last(at.name)) || SECTIONS.has(at.name))
        ?? [tag, ...ancestors(tag)].at(-1) as Tag;
      const key = `${view.start}|${tag.branches.join(",")}`;
      solidButtons.set(key, [...(solidButtons.get(key) ?? []), tag]);
    }

    if (CONTAINERS.has(tag.name) && isUnit(tag)) {
      for (const at of ancestors(tag)) {
        if (OVERLAY.test(last(at.name))) break;
        if (CONTAINERS.has(at.name) || CARDS.has(at.name)) {
          add("container-in-container", tag, 0, `${signature(tag)}|in|${at.name}`,
            `${where} stands inside \`${at.name}\` (line ${lineOf(source, at.start)}). A container takes no container inside it (RD.SUPPORT.APPS.147), and a panel is a part of a page at \`CONTAINER\` while a card is one thing at \`WIDGET\` (RD.SUPPORT.SURFACE.263). Make the inner part a content part of the outer one, or a panel of its own beside it.`);
          break;
        }
      }
    }

    const className = attrOf(tag, "className");
    if (className && /^DS[A-Z]/.test(tag.name) && isUnit(tag)) {
      const literal = className.kind === "string" ? className.value
        : [...className.value.matchAll(/(['"`])([^'"`]*)\1/g)].map((match) => match[2]).join(" ");
      const written = literal.split(/\s+/).filter(Boolean);
      // A gap beside `flex` or `grid` lays out the page's own children inside the unit, and is the page's.
      const laysOut = written.some((name) => /^(inline-)?(flex|grid)$/.test(name.split(":").at(-1) ?? ""));
      const owned = PAGE_OWNS[tag.name] ?? new Set<string>();
      const looks = written.filter((name) => {
        const look = lookOf(name);
        return look !== null && !owned.has(look) && !(look === "gap" && laysOut);
      });
      if (looks.length)
        add("hand-set-look", tag, 0, `${signature(tag)}|${looks.join(" ")}`,
          `${where} carries \`${looks.join(" ")}\` in its \`className\`. A design-system unit takes its colour, padding, radius and gap from its props, its place and the theme, never from a class (RD.SUPPORT.APPS.150). Remove the class, and ask a prop or the theme for the look; a margin or a width around the unit is the page's own.`);
    }
  }

  // ONE SOLID PER VIEW, the branches of a condition apart (RD.SUPPORT.SURFACE.370). A view here is the nearest
  // dialog, drawer, sheet or step, else the section of a site page, else the tag tree the button stands in:
  // the closing call of a site page repeats the hero's one act in a section of its own, so the pair is one
  // main action said twice and is never on screen together.
  for (const group of solidButtons.values()) {
    for (const tag of group.slice(1))
      add("button-one-solid", tag, 0, `${signature(tag)}|after|${signature(group[0])}`,
        `\`DSButton\` at line ${lineOf(source, tag.start)} is a second written \`SOLID\` in one view; the first is at line ${lineOf(source, group[0].start)}. A view holds one \`SOLID\`, its main action (RD.SUPPORT.SURFACE.370): leave this one's \`variant\` out so it draws \`OUTLINE\`, or write \`GHOST\` at the end of a row or in a toolbar. If the two stand in two views the file cannot show, nothing need change.`);
  }

  // THE HUE TABLE, against a map written in this file (RD.SUPPORT.SURFACE.369). A map built in another file,
  // or a hue chosen by a `switch`, is not seen here.
  for (const match of read.code.matchAll(/\[\s*([A-Z]\w*(?:Status|State)Type)\.([A-Z][A-Z0-9_]*)\s*\]\s*:\s*DSColorType\.([A-Z]+)/g)) {
    const [, enumName, member, hue] = match;
    const ruled = HUE[member];
    if (!ruled || ruled === hue) continue;
    add("state-hue-table", null, match.index ?? 0, `${enumName}.${member}|${hue}`,
      `\`[${enumName}.${member}]: DSColorType.${hue}\` at line ${lineOf(source, match.index ?? 0)} gives ${member} the hue \`${hue}\`, and the hue table gives it \`${ruled}\` (RD.SUPPORT.SURFACE.369). Write \`DSColorType.${ruled}\`, so the state has one colour in every app.`);
  }
  return found.sort((a, b) => a.line - b.line);
}

const COLOURS = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|transparent|current|inherit";
const TEXT_NOT_COLOUR = /^text-(xs|sm|base|lg|xl|\d+xl|left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip|\[\d)/;
type Look = "colour" | "padding" | "radius" | "gap";

/**
 * The looks a unit's own `className` is for, as the design system states them on the prop. `DSSurface`
 * draws only its fill, and its padding and radius are the page's; `DSList` leaves the gap between rows
 * to the page; `DSText` draws no box, so space around its words is the page's layout.
 */
const PAGE_OWNS: Record<string, Set<Look>> = {
  DSSurface: new Set<Look>(["padding", "radius"]),
  DSList: new Set<Look>(["gap"]),
  DSText: new Set<Look>(["padding", "gap"]),
};

/** Which look one utility class sets — a colour, a padding, a radius or a gap — or null (RD.SUPPORT.APPS.150). */
export function lookOf(written: string): Look | null {
  const name = written.replace(/^!/, "").split(":").at(-1)?.replace(/^!/, "") ?? "";
  if (/^-?p[xytrblse]?-/.test(name)) return "padding";
  if (/^(gap(-[xy])?|space-[xy])-/.test(name)) return "gap";
  if (/^rounded(-|$)/.test(name)) return "radius";
  if (/^bg-/.test(name) && !/^bg-(cover|contain|center|no-repeat|repeat|fixed|local|scroll|clip-|origin-|none|gradient-|left|right|top|bottom|auto)/.test(name)) return "colour";
  if (/^text-/.test(name) && !TEXT_NOT_COLOUR.test(name)) return "colour";
  if (new RegExp(`^(border(-[xytrblse])?|ring|outline|fill|stroke|divide)-(${COLOURS})(-|/|$)`).test(name)) return "colour";
  return /^(border(-[xytrblse])?|ring|fill|stroke)-\[(#|rgb|hsl|var\()/.test(name) ? "colour" : null;
}
