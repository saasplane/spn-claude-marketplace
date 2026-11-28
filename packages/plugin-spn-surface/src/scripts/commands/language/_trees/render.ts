// The render, called in batches: `spnutils apps surface render [--app <package> | --theme <file>] --ds <version> --file <tree> --modes <modes>
// --devices <devices>` draws each section of a tree `{ title, category, sections }` for each mode and device and prints the copies as JSON,
// writing no file. With neither --app nor --theme the copies wear the design system's default theme, as a language's own samples do. A sample
// page is one section, so a batch of pages of one category is one call, and each section's window is told from the next by its opening tag.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Tree } from "./types.ts";

export const MODES = ["LIGHT", "DARK"] as const;
export const DEVICES = ["DESKTOP", "TABLET", "PHONE"] as const;
export type Mode = (typeof MODES)[number];
export type Device = (typeof DEVICES)[number];
export type Finding = { section: number; unit: string; message: string; path: string };
export type Drawn = { findings: Finding[]; html: Record<Mode, Record<Device, string[]>> };

/** The program that draws: `spnutils`, unless a test names another. */
export const spnutils = (): string => process.env.SPN_SURFACE_SPNUTILS ?? "spnutils";

/** The version of the design system the render draws with: the released `spnutils` carries one version of it, read from `spnutils --version`. */
export function installedVersion(): string {
  const run = spawnSync(spnutils(), ["--version"], { encoding: "utf8" });
  const found = /\b(\d+\.\d+\.\d+)\b/.exec(`${run.stdout ?? ""}`);
  if (run.error || !found) throw new Error(`cannot read the design system's version from \`${spnutils()} --version\`.`);
  return found[1];
}

/** The design system gives a field, a tab and a menu an id of ten random letters on each draw. They are renamed `u1`, `u2` … in the order they first appear,
 * so the same tree draws the same markup every time, and a light copy equals its dark copy where nothing else differs. */
export function steadyIds(html: string): string {
  const names = new Map<string, string>();
  for (const found of html.matchAll(/\s(?:id|for)="([A-Za-z0-9]{10})(?=["-])/g)) if (/[A-Z]/.test(found[1]) && !names.has(found[1])) names.set(found[1], `u${names.size + 1}`);
  let out = html;
  for (const [from, to] of names) out = out.split(from).join(to);
  return out;
}

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
/** The elements that stand at the top of a copy, one for each section the render drew: the markup is walked tag by tag, a quoted attribute may hold a `>`, and
 * an element ends where its own depth closes. A copy whose sections are not whole elements yields a different count, and the caller refuses it. */
export function windowsOf(html: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let from = -1;
  let at = 0;
  while (at < html.length) {
    const open = html.indexOf("<", at);
    if (open < 0) break;
    if (html.startsWith("<!--", open)) { at = html.indexOf("-->", open) + 3; continue; }
    let end = open + 1;
    let quote = "";
    for (; end < html.length; end += 1) {
      const c = html[end];
      if (quote) { if (c === quote) quote = ""; } else if (c === '"' || c === "'") quote = c; else if (c === ">") break;
    }
    const tag = html.slice(open + 1, end);
    at = end + 1;
    if (tag.startsWith("/")) { depth -= 1; if (depth === 0 && from >= 0) { out.push(html.slice(from, at)); from = -1; } continue; }
    const name = /^[A-Za-z][\w:-]*/.exec(tag)?.[0].toLowerCase() ?? "";
    if (name === "script" || name === "style") { at = html.indexOf(`</${name}`, at); at = html.indexOf(">", at) + 1; if (depth === 0) out.push(html.slice(open, at)); continue; }
    const selfClosed = tag.endsWith("/") || VOID.has(name);
    if (depth === 0) from = open;
    if (selfClosed) { if (depth === 0) { out.push(html.slice(from, at)); from = -1; } continue; }
    depth += 1;
  }
  return out;
}

/** The theme the copies wear: a web app's, by its package, a theme file, or neither, the design system's default (RULE.SUPPORT.SURFACE.579). */
export type ThemeChoice = { app: string | null; theme: string | null };
export const DEFAULT_THEME: ThemeChoice = { app: null, theme: null };
const themeArgs = (choice: ThemeChoice): string[] => (choice.app ? ["--app", choice.app] : choice.theme ? ["--theme", choice.theme] : []);

/** Draw each section for the modes and devices, in one call, in one surface category. A section's findings name the unit the design system does not build. */
export function drawSections(sections: Tree[], category: string, choice: ThemeChoice, ds: string, modes: readonly Mode[] = MODES, devices: readonly Device[] = DEVICES, tolerant = false): Drawn {
  const dir = mkdtempSync(join(tmpdir(), "surface-samples-"));
  try {
    const file = join(dir, "batch.tree.json");
    writeFileSync(file, JSON.stringify({ title: "samples", category, sections }));
    const run = spawnSync(spnutils(), ["apps", "surface", "render", ...themeArgs(choice), "--ds", ds, "--file", file, "--modes", modes.join(","), "--devices", devices.join(",")], { encoding: "utf8", maxBuffer: 1 << 30 });
    let parsed: { renders: Record<string, Record<string, { html: string; findings: Array<{ path: string; unit: string; message: string }> }>> };
    try { parsed = JSON.parse(run.stdout); } catch { throw new Error(`the render printed no JSON: ${(run.stdout || run.stderr || String(run.error)).slice(0, 600)}`); }
    const html = { LIGHT: { DESKTOP: [], TABLET: [], PHONE: [] }, DARK: { DESKTOP: [], TABLET: [], PHONE: [] } } as Drawn["html"];
    const findings: Finding[] = [];
    for (const mode of modes) for (const device of devices) {
      const copy = parsed.renders[mode][device];
      const windows = windowsOf(copy.html);
      if (tolerant && windows.length !== sections.length) {
        // the render draws nothing where one section will not render with its props: halve the batch until each broken section stands alone
        const merged: Finding[] = [];
        const search = (from: number, to: number): void => {
          const part = sections.slice(from, to);
          try {
            const drawn = drawSections(part, category, choice, ds, [modes[0]], [devices[0]], false);
            for (const finding of drawn.findings) merged.push({ ...finding, section: from + finding.section });
          } catch (error) {
            if (part.length === 1) { merged.push({ section: from, unit: /(DS[\w.]+) will not render/.exec(String(error))?.[1] ?? "a unit", message: String(error).slice(0, 300), path: "" }); return; }
            const mid = from + Math.ceil(part.length / 2);
            search(from, mid); search(mid, to);
          }
        };
        search(0, sections.length);
        return { findings: merged, html };
      }
      if (windows.length !== sections.length && process.env.SPN_SURFACE_KEEP) writeFileSync(process.env.SPN_SURFACE_KEEP, JSON.stringify({ title: "samples", category, sections }));
      // A batch can fail where each of its sections draws on its own, as two forms in one batch do: draw each section
      // alone then, and refuse only a section that will not draw by itself.
      if (windows.length !== sections.length && sections.length > 1) {
        const alone = sections.map((section) => drawSections([section], category, choice, ds, modes, devices, false));
        for (const m of modes) for (const d of devices) html[m][d] = alone.flatMap((one) => one.html[m][d]);
        alone.forEach((one, at) => { for (const finding of one.findings) findings.push({ ...finding, section: at }); });
        return { findings, html };
      }
      if (windows.length !== sections.length) throw new Error(`${copy.findings.slice(0, 3).map((f) => `${f.path}: ${f.message}`).join(" | ")} the render drew ${windows.length} windows for ${sections.length} sections (${mode} ${device}).`);
      html[mode][device] = windows.map(steadyIds);
      if (mode === modes[0] && device === devices[0]) for (const finding of copy.findings) findings.push({ section: Number(/sections\[(\d+)\]/.exec(finding.path)?.[1] ?? -1), unit: finding.unit, message: finding.message, path: finding.path });
    }
    return { findings, html };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
