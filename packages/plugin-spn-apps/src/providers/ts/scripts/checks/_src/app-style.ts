#!/usr/bin/env node
// Note a style forced onto a design-system unit, in an app's `.tsx` or `.css`: a `!` utility or
// `!important`, or a colour or spacing set by hand on a `<DS…>` unit. It notes and never refuses, because
// how a unit is used is guidance with cases, and it judges only the text the write introduces.
//
//   hook :  app-style.ts --stdin        (PreToolUse JSON on stdin; notes with the better way named)

import { basename, resolve } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { resultingText } from "../../../../../../../plugin-support-lib/src/lib/source.ts";

// An app is a folder under `apps/`; its screens are `.tsx` and its stylesheet is `.css`.
const APP_FILE = /\/apps\/[^/]+\/.+\.(?:tsx|css)$/;

// A utility forced with `!` in front of it or `!` after it, as a class token.
const FORCED_UTILITY = /(?:^|[\s"'`{])(!(?:[a-z][a-z0-9]*:)*[a-z][a-z0-9]*-[\w/[\]#.%-]+|(?:[a-z][a-z0-9]*:)*[a-z][a-z0-9]*-[\w/[\]#.%-]+!)(?=[\s"'`}]|$)/gm;

const COLOUR = /(?:^|[\s"'`])((?:bg|text|border|ring|fill|stroke)-(?:[a-z]+-\d{2,3}|\[#[^\]]+\]|white|black))(?=[\s"'`]|$)/;
const SPACING = /(?:^|[\s"'`])((?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|space-x|space-y)-(?:\d+(?:\.\d+)?|\[[^\]]+\]))(?=[\s"'`]|$)/;
const STYLE_PROP = /\bstyle=\{\{[^}]*\b(color|background(?:Color)?|margin\w*|padding\w*|gap)\s*:/;

// An opening tag of a design-system unit, with its attributes.
const DS_TAG = /<(DS[A-Z][A-Za-z0-9]*)\b([^<>]*?)(?:\/?>)/gs;

const WAY = "Style it through the app's stylesheet or the surface context, so every unit of its kind follows.";

export function watched(path: string): boolean {
  return APP_FILE.test(resolve(path).split("\\").join("/"));
}

/** Every forced or hand-set style in this text, one sentence each. */
export function findings(text: string, css: boolean): string[] {
  const found: string[] = [];
  const unitAt = (index: number): string | null => {
    for (const tag of text.matchAll(DS_TAG))
      if (tag.index <= index && index < tag.index + tag[0].length) return tag[1];
    return null;
  };
  if (css) {
    if (/!important\b/.test(text)) found.push(`!important forces a style over the design system. ${WAY}`);
    return found;
  }
  for (const match of text.matchAll(FORCED_UTILITY)) {
    const unit = unitAt(match.index + match[0].length - match[1].length);
    found.push(`${match[1]} forces a style${unit ? ` on ${unit}` : ""}. ${WAY}`);
  }
  for (const tag of text.matchAll(DS_TAG)) {
    const [, unit, attributes] = tag;
    const colour = COLOUR.exec(attributes), spacing = SPACING.exec(attributes), style = STYLE_PROP.exec(attributes);
    if (colour) found.push(`${colour[1]} sets a colour by hand on ${unit}. ${WAY}`);
    if (spacing) found.push(`${spacing[1]} sets spacing by hand on ${unit}. ${WAY}`);
    if (style) found.push(`style={{ ${style[1]} }} sets a look by hand on ${unit}. ${WAY}`);
  }
  return [...new Set(found)];
}

/** The verdict for one write, given text that has already been parsed. A note, never a deny. */
export function verdict(path: string, source: string | null, added: string | null): Verdict {
  const text = added ?? source;
  if (text === null) return null;
  let found: string[];
  try {
    found = findings(text, path.endsWith(".css"));
  } catch {
    return null;
  }
  if (!found.length) return null;
  return { note: [`spn-apps: ${basename(path)} forces a style on the design system.`, ...found.map((item) => `  - ${item}`)].join("\n") };
}

/** The verdict for one write, parsed here. Called alone; the dispatcher goes through a subject. */
export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  if (!watched(path)) return null;
  let added: string | null;
  try {
    [, added] = resultingText(input, path);
  } catch {
    added = input.content ?? input.new_string ?? null;
  }
  return verdict(path, null, added);
}

export const CHECK = { name: "app-style", run, watched };

if (runAlone("app-style.ts")) {
  const event = (await payload()) as Payload | null;
  emit(event ? run(event.tool_input ?? {}) : null);
  process.exit(0);
}
