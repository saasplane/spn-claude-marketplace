// RESTATES: spn-foundation docs/04-capabilities/02-support/01-apps/06-tests/README.md § Code coverage is reported, never enforced
// The chapter is the source of truth; a change is made there first, then here, in the same change.
//
// Reading the coverage excludes out of a Jest or Vitest configuration, as text. Coverage is
// measured and reported, never enforced (RD.SUPPORT.APPS.133), so the one thing read here is
// whether each exclude carries a comment giving its reason.

import { basename } from "node:path";

/** A configuration that runs code and so can collect coverage. A Playwright configuration drives a browser and collects none. */
export const isCodeConfig = (path: string): boolean =>
  /^(jest\.config(\.[\w-]+)?\.(c|m)?js|vitest\.config(\.[\w-]+)?\.m?[jt]s)$/.test(basename(path));

/** The text of the `{ … }` block opened by the first `{` at or after `from`, with its bounds. */
function blockAt(text: string, from: number): { start: number; end: number } | null {
  const open = text.indexOf("{", from);
  if (open < 0) return null;
  let depth = 0;
  for (let at = open; at < text.length; at += 1) {
    if (text[at] === "{") depth += 1;
    if (text[at] === "}") { depth -= 1; if (depth === 0) return { start: open, end: at + 1 }; }
  }
  return null;
}

/** Where the exclude list sits: `coveragePathIgnorePatterns` for Jest, `exclude` inside `coverage` for Vitest. */
function excludeList(text: string): { start: number; end: number } | null {
  const jest = text.search(/\bcoveragePathIgnorePatterns\s*:\s*\[/);
  let at = jest;
  if (at < 0) {
    const coverage = text.search(/\bcoverage\s*:\s*\{/);
    if (coverage < 0) return null;
    const block = blockAt(text, coverage);
    if (block === null) return null;
    const inner = text.slice(block.start, block.end).search(/\bexclude\s*:\s*\[/);
    if (inner < 0) return null;
    at = block.start + inner;
  }
  const open = text.indexOf("[", at);
  const close = text.indexOf("]", open);
  return open < 0 || close < 0 ? null : { start: open, end: close + 1 };
}

/** Every exclude entry, with whether a comment on its own line or the line above gives its reason. */
export function excludesOf(text: string): { entry: string; reasoned: boolean }[] {
  const list = excludeList(text);
  if (list === null) return [];
  const lines = text.slice(list.start, list.end).split("\n");
  const found: { entry: string; reasoned: boolean }[] = [];
  lines.forEach((line, index) => {
    const code = line.split("//")[0];
    for (const match of code.matchAll(/(['"`])((?:(?!\1).)*)\1/g)) {
      const sameLine = /\/\/\s*\S/.test(line.slice(code.length));
      const above = index > 0 && /^\s*\/\/\s*\S/.test(lines[index - 1]);
      found.push({ entry: match[2], reasoned: sameLine || above });
    }
  });
  return found;
}
