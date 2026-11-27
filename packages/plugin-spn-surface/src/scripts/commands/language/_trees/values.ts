// The values parts of a language's samples: Shared (Brand, Drawing, Motion, Voice) and each category's Media, Motion and Words. A page holds one
// section for each thing the part sets: a head that says what it is, a sample drawn in the design system's units, and the language's own values
// for it in a table, read from the spec and the catalogue's kind. A value the design system draws is drawn; a part that holds only words is words.
import { U, badge, btn, col, eyebrow, feat, grid, item, kbd, muted, plannedSection, row, sec, slot, table, txt } from "./kit.ts";
import { noteOf, sentence, slugOf, words } from "./notes.ts";
import { partPath } from "./home.ts";
import type { CatKind, Entry, Page, Tree } from "./types.ts";

type Spec = Record<string, unknown>;
const human = (key: string): string => {
  const text = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};
const scalar = (value: unknown): string => {
  if (value === null || value === undefined) return "none";
  if (Array.isArray(value)) return value.map(scalar).join(", ");
  if (typeof value === "string") return /^[A-Z0-9_]+$/.test(value) ? words(value) : value;
  return String(value);
};

/** A spec value as rows of a name and a value: a nested value gives a row for each of its leaves, named by its path. */
export function rowsOf(value: unknown, prefix = "", out: string[][] = [], limit = 16): string[][] {
  if (out.length >= limit) return out;
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, inner] of Object.entries(value as Spec)) {
      if (key === "mtype" || key === "lengthSource" || key === "research" || key === "seenOn" || key === "why") continue;
      rowsOf(inner, prefix ? `${prefix} › ${human(key).toLowerCase()}` : human(key), out, limit);
    }
  } else if (Array.isArray(value) && value.some((one) => one !== null && typeof one === "object")) {
    value.slice(0, 4).forEach((one, at) => rowsOf(one, `${prefix} ${at + 1}`, out, limit));
  } else if (prefix) out.push([prefix, scalar(value)]);
  return out.slice(0, limit);
}
const valuesTable = (value: unknown): Tree | null => {
  const rows = rowsOf(value);
  return rows.length ? table(["Value", "Set to"], rows) : null;
};

const SENTENCE: Record<string, string> = {
  PARAGRAPH: "Lumen Labs keeps every site and app of your team in one place, so you change a role once and it holds everywhere.",
  ROW: "Ravi Shah · Admin", LABEL: "Display name", DESCRIPTION: "Shown to everyone in your organization", NOTE: "Updated 2 minutes ago by Dana Lee",
  TITLE: "Notification settings", DISPLAY_HEADING: "One foundation for every app", STATE_SENTENCE: "2 of 24 invitations could not be sent", EYEBROW: "Platform", TERM: "SSO",
};

/** A sample for a kind of a values part, drawn in the design system's units, or null where the table of values is the whole page entry. */
function sample(part: string, kind: CatKind): Tree[] {
  const style = (kind.style ?? {}) as Spec;
  const code = kind.code;
  if (part === "WORDS") {
    if (code === "KEYS") return [row([txt("Press", "CONTENT_SM"), kbd(["Ctrl", "K"]), txt("to jump to anything", "CONTENT_SM")], "SM")];
    const unit = (style.unitValue ?? {}) as Spec;
    const typography = String(unit.typography ?? style.typography ?? "CONTENT_MD");
    const extra: Tree = {};
    if (unit.tone ?? style.tone) extra.tone = String(unit.tone ?? style.tone);
    if (code === "TERM") extra.underline = "DOTTED";
    if (code === "STATE_SENTENCE") extra.color = "ERROR";
    if (code === "EYEBROW") extra.format = "UPPERCASE";
    return [txt(SENTENCE[code] ?? sentence(kind.description), typography, extra)];
  }
  if (part === "MEDIA") {
    switch (code) {
      case "ICON_MARK": case "ICON_UI": return [grid([["KEY", "A mark: a thing of its own"], ["USERS", "A bare icon: a line a person reads"], ["SHIELD", "An icon inside a control"]].map(([icon, text], at) => item(text, null, "CONTENT", undefined, { media: at === 0 ? { mtype: "MARK", icon } : { mtype: "ICON", node: icon } })), 3, 1, 1)];
      case "ICON_AVATAR": return [row([item("Dana Lee", "Owner", "CONTENT", undefined, { media: { mtype: "AVATAR", title: "Dana Lee" } }), item("Mei Tan", "Editor", "CONTENT", undefined, { media: { mtype: "AVATAR", title: "Mei Tan" } })], "XL")];
      case "VIEW_CODE": return [U("DSCodeBlockView", { filename: "role-grant.json", language: "JSON", showLineNumbers: true, bordered: true, code: "{\n  \"member\": \"dana.lee@example.com\",\n  \"role\": \"Editor\"\n}" })];
      case "VIEW_PRODUCT": case "FILE_ATTACHED": return [feat({ type: "MEDIA_BOTTOM", pageLevel: "CONTAINER", title: "The member list", description: "A product view stands framed and raised.", frames: ["MEDIA"], surface: { raised: true, elevation: "MD" }, mediaNode: slot("The member list in the admin console", "16:8") })];
      case "ART_PHOTO": return [feat({ type: "MEDIA_BOTTOM", pageLevel: "CONTAINER", title: "A team at work", description: "A photograph stands flush and rounded.", mediaNode: slot("The Pune team at a shared desk", "16:8") })];
      case "ART_DRAWING": case "ART_ILLUSTRATION": return [slot(`${kind.title}: a drawing of how a role reaches every app`, "16:6")];
      case "PLACE_MAP": case "VIEW_EMBED": return [slot(`${kind.title}: three offices pinned on one map`, "16:6")];
      default: return [];
    }
  }
  if (part === "MOTION") {
    switch (code) {
      case "LOADING": return [grid([col([muted("Start", "TITLE_SM"), U("DSSkeleton", { type: "LIST", count: 3 }), U("DSSpinner", { label: "Loading members" })], "SM"), col([muted("End", "TITLE_SM"), U("DSList", { divided: true }, ["Dana Lee", "Ravi Shah", "Mei Tan"].map((n) => U("DSList.Item", { content: n })))], "SM")], 2, 1, 1)];
      case "HOVER": return [feat({ pageLevel: "WIDGET", title: "A door", description: "Lit as one target under the pointer; the arrow moves only while hovered.", surface: { color: "DEFAULT", raised: true } })];
      default: return [];
    }
  }
  return [];
}

function kindEntry(part: string, kind: CatKind, spec: Spec): Entry {
  const planned = kind.status !== "BUILT";
  if (planned) return { kind: kind.title, case: "", note: noteOf(kind), node: plannedSection(kind.title, sentence(kind.description), kind.title), planned: true };
  const drawn = sample(part, kind);
  const style = valuesTable({ ...((kind.style ?? {}) as Spec) });
  const kids: unknown[] = [feat({ title: kind.title, description: sentence(kind.description) }), ...(drawn.length ? [col(drawn, "MD")] : []), ...(style ? [style] : [])];
  void spec;
  return { kind: kind.title, case: "", note: noteOf(kind), node: sec(kids, "MD"), planned: false };
}

/** The first section of a category's part: what the language sets for it, from the spec, as the values and the reason. */
function headEntry(part: string, title: string, setting: Spec | undefined): Entry {
  const why = typeof setting?.why === "string" ? (setting.why as string) : "";
  const table = valuesTable(setting?.values);
  const kids: unknown[] = [feat({ eyebrow: eyebrow(String(setting?.source ?? "OWN").toLowerCase()), title: `What the language sets for ${title.toLowerCase()}`, description: sentence(why) || `The language sets no values for ${title.toLowerCase()} of its own.` }), ...(table ? [table] : [])];
  return { kind: title, case: "", note: sentence(why) || `The language sets no values for ${title.toLowerCase()} of its own.`, node: sec(kids, "MD"), planned: false };
}

export const VALUE_PARTS = ["MEDIA", "MOTION", "WORDS"] as const;

/** The pages of a category's three values parts, each in the part's own file; a language holds no Theme part (RULE.SUPPORT.SURFACE.642). */
export function categoryValuePages(category: string, folder: string, cat: Record<string, CatKind[]>, specCat: Record<string, Spec> | undefined, titles: Record<string, string>): Page[] {
  return VALUE_PARTS.map((part) => {
    const kinds = cat[part] ?? [];
    const entries = [headEntry(part, titles[part], specCat?.[part]), ...kinds.map((k) => kindEntry(part, k, specCat?.[part] ?? {}))];
    return { file: `${partPath(folder, part)}.html`, title: titles[part], category, part, kinds: kinds.map((k) => k.code), entries, ask: sentence(titles[`${part}-ask`]) || "", layout: "CANVAS" };
  });
}

/** The Shared pages: Brand, Drawing, Motion and Voice, each a section for each thing the language keeps the same everywhere. */
export function sharedPages(parts: Array<{ code: string; title: string; description: string; values?: { ALL?: string[] } }>, shared: Record<string, Spec> | undefined): Page[] {
  return parts.map((part, at) => {
    const setting = shared?.[part.code] as Spec | undefined;
    const values = (setting?.values ?? {}) as Spec;
    const keys = part.values?.ALL ?? [];
    const why = typeof setting?.why === "string" ? (setting.why as string) : part.description;
    const entries: Entry[] = keys.map((key) => {
      const value = values[key];
      const head = feat({ eyebrow: eyebrow(String(setting?.source ?? "NONE").toLowerCase()), title: human(key), description: sentence(why) });
      let drawn: Tree[] = [];
      if (part.code === "BRAND") drawn = [row([btn("Primary", "PRIMARY", "SOLID"), btn("Default", undefined, "OUTLINE"), badge("Primary", "PRIMARY", "SOLID"), badge("Info", "INFO"), badge("Warning", "WARNING")], "SM"), txt("The typeface, at three steps", "HEADING_MD"), txt("Notification settings", "TITLE_MD"), txt("Shown to everyone in your organization", "CONTENT_MD")];
      else if (part.code === "MOTION") drawn = [grid([U("DSSkeleton", { type: "LIST", count: 2 }), U("DSSpinner", { label: "Loading members" })], 2, 1, 1)];
      else if (part.code === "VOICE") drawn = [txt("Lumen Labs keeps every site and app of your team in one place.", "CONTENT_LG"), muted("The sample product's words stand at each level; this language writes no voice rule yet.")];
      const tbl = valuesTable(value);
      const kids: unknown[] = [head, ...(drawn.length ? [col(drawn, "MD")] : []), ...(tbl ? [tbl] : value === null || value === undefined ? [muted(`The language sets nothing for ${human(key).toLowerCase()}.`)] : [])];
      return { kind: human(key), case: "", note: sentence(why) || sentence(part.description), node: sec(kids, "MD"), planned: false };
    });
    if (!entries.length) entries.push({ kind: part.title, case: "", note: sentence(part.description), node: sec([feat({ title: part.title, description: sentence(part.description) })], "MD"), planned: false });
    return { file: `01-shared/${String(at + 1).padStart(2, "0")}-${slugOf(part.code)}.html`, title: part.title, category: "SHARED", part: part.code, kinds: keys.map(slugOf), entries, ask: sentence(part.description), layout: "CANVAS" };
  });
}
