#!/usr/bin/env node
// Refuse a second exported component in a `.tsx` file, and a runtime export from an interfaces file (MKT.HOOKS.144).
//
// The rule: put one component in a file, and only what the file's name says. A `.tsx` file holds one exported
// component, named for the file; an interfaces file holds types only, so a constant, a function, a class or an
// enum belongs in a file named for it.
//
// It reads the file the write would PRODUCE and denies only when the write itself introduces the extra
// export, so a finding elsewhere in the file does not block an unrelated edit. Comment and string bodies are
// masked first.
//
//   hook :  one-component-per-file.ts --stdin        (PreToolUse JSON on stdin; denies with the fix named)

import { basename, resolve } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { mask, resultingText } from "../../../../../../../plugin-support-lib/src/lib/source.ts";

const COMPONENT_FUNCTION = /^export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Z][A-Za-z0-9_]*)\b/gm;
const COMPONENT_CONST = /^export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*(?::[^=\n]+)?=\s*(?:React\.)?(?:memo|forwardRef)?\s*(?:<[^>\n]*>)?\s*\(/gm;
const COMPONENT_CLASS = /^export\s+(?:default\s+)?class\s+([A-Z][A-Za-z0-9_]*)\b/gm;
const RUNTIME_EXPORT = /^export\s+(?:default\s+)?(?:(?:async\s+)?function\s*\*?|const\s+enum|enum|class|abstract\s+class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;

const REMEDY_COMPONENT = "Put one component in a file, named for the file. Move each further component into its own " +
  ".tsx file named for it, and import it where it is used.";
const REMEDY_INTERFACES = "An interfaces file holds types only. Move a constant, function, class or enum into a file " +
  "named for what it holds, and keep only interface and type declarations here.";

export function watched(path: string): boolean {
  const normalized = resolve(path).split("\\").join("/");
  if (!normalized.includes("/src/") || /\.(?:d|test|spec|stories)\.tsx?$/.test(normalized) || normalized.includes("/src/_shadcn/")) return false;
  return normalized.endsWith(".tsx") || isInterfacesFile(normalized);
}

/** A file whose name says it holds interfaces: interface.ts, interfaces.ts, Foo.interface.ts, FooInterfaces.ts. */
export function isInterfacesFile(path: string): boolean {
  return /^(?:.*[.\-_])?[Ii]nterfaces?\.ts$|^[A-Za-z0-9]+Interfaces?\.ts$/.test(basename(path));
}

const names = (re: RegExp, masked: string): string[] => [...masked.matchAll(re)].map((m) => m[1]);

/**
 * What the write breaks, one sentence each. `added` is the text the write introduces, or null for a scan;
 * an export is judged only when the write names it.
 */
export function findings(path: string, source: string, added: string | null): { lines: string[]; remedy: string } {
  const masked = mask(source);
  const introduced = (name: string): boolean =>
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from escaped identifier text of the file being judged
    added === null || new RegExp(`\\b${name.replace(/\$/g, "\\$")}\\b`).test(added);
  if (path.endsWith(".tsx")) {
    const components = [...new Set([...names(COMPONENT_FUNCTION, masked), ...names(COMPONENT_CONST, masked), ...names(COMPONENT_CLASS, masked)])];
    if (components.length < 2) return { lines: [], remedy: REMEDY_COMPONENT };
    // An export the write itself declares: its text carries the `export` line, not merely the name.
    const declared = added === null ? components : (() => {
      const text = mask(added);
      return [...new Set([...names(COMPONENT_FUNCTION, text), ...names(COMPONENT_CONST, text), ...names(COMPONENT_CLASS, text)])];
    })();
    const extra = components.filter((name) => declared.includes(name));
    if (!extra.length) return { lines: [], remedy: REMEDY_COMPONENT };
    return { lines: [`${basename(path)} exports ${components.length} components (${components.join(", ")}); the write adds ${extra.join(", ")}`], remedy: REMEDY_COMPONENT };
  }
  const runtime = names(RUNTIME_EXPORT, masked).filter(introduced);
  return { lines: runtime.map((name) => `${name} is a runtime export in an interfaces file`), remedy: REMEDY_INTERFACES };
}

/** The verdict for one write, given text that has ALREADY been parsed. */
export function verdict(path: string, source: string | null, added: string | null): Verdict {
  if (source === null) return null;
  let found: { lines: string[]; remedy: string };
  try {
    found = findings(resolve(path).split("\\").join("/"), source, added);
  } catch {
    return null;                     // a parse this check cannot do allows, never blocks
  }
  if (!found.lines.length) return null;
  return { deny: [`Denied — ${basename(path)} holds more than its name says.`, ...found.lines.map((l) => `  - ${l}`), `  ${found.remedy}`].join("\n") };
}

/** The verdict for one write, parsed here. Called alone; the dispatcher goes through a subject. */
export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  if (!watched(path)) return null;
  let source: string | null;
  let added: string | null;
  try {
    [source, added] = resultingText(input, path);
  } catch {
    source = added = input.content ?? input.new_string ?? null;
  }
  return verdict(path, source, added);
}

export const CHECK = { name: "one-component-per-file", run, watched };

if (runAlone("one-component-per-file.ts")) {
  const event = (await payload()) as Payload | null;
  emit(event ? run(event.tool_input ?? {}) : null);
  process.exit(0);
}
