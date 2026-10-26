#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § Nothing is published unless the developer asks · § What a stored page carries, and what a published one carries
//           docs/registers/decisions.md RD.DEVEX.WORKSPACE.117 · RD.DEVEX.WORKSPACE.215
// The chapter is the source of truth.
//
// On the developer's ask, a publish is met by a reminder and never a refusal, because this check
// cannot know whether the developer asked. It refuses one thing, which it can read from the file: a
// page that loads its styles or its script from outside, which the publishing host does not load.

import { readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import type { Payload, Verdict } from "../lib/payload.ts";
import { BUNDLED_SUFFIX } from "../../../../plugin-support-lib/src/lib/page-styles.ts";

/** The tool that publishes a page. */
export const PUBLISHER = "Artifact";

/** Where a published page may load a stylesheet from: Google Fonts alone. */
export const STYLESHEET_HOSTS: readonly string[] = Object.freeze(["https://fonts.googleapis.com/"]);
/** Where a published page may load a script from. */
export const SCRIPT_HOSTS: readonly string[] = Object.freeze(["https://cdnjs.cloudflare.com/", "https://cdn.jsdelivr.net/npm/"]);

/**
 * Whether this call publishes a page: the `Artifact` tool with no action or `publish`, and not an
 * asset upload to a page already published (`asset: true`), which publishes no new page.
 */
export function publishes(payload: Payload): boolean {
  if (payload.tool_name !== PUBLISHER) return false;
  const input = (payload.tool_input ?? {}) as Record<string, unknown>;
  const action = typeof input.action === "string" ? input.action : "publish";
  return action === "publish" && input.asset !== true;
}

/** The value of one attribute of a tag, in double or single quotes, or null where the tag has none. */
function attributeOf(tag: string, name: string): string | null {
  const found = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(tag);
  return found ? found[1] ?? found[2] ?? "" : null;
}

/** The paths a call publishes beside its page, as the page would name them: the `files` input's keys or entries. */
function publishedBeside(files: unknown): Set<string> {
  const paths = Array.isArray(files)
    ? files.map((entry) => (entry && typeof entry === "object" ? String((entry as { path?: unknown }).path ?? "") : ""))
    : files && typeof files === "object"
      ? Object.entries(files as Record<string, unknown>).filter(([, source]) => source !== null).map(([path]) => path)
      : [];
  return new Set(paths.filter(Boolean).map((path) => path.replace(/^\.\//, "")));
}

/**
 * Each address a page loads a stylesheet or a script from that a published page may not load. An
 * address inside the page (`data:`), an allowed host, and a file the same call publishes beside the
 * page are all loadable. Every other address is from outside: a hosted one, and a relative one that
 * the call does not publish.
 *
 * @param beside  the paths the call publishes beside the page
 */
export function loadedFromOutside(html: string, beside: Set<string> = new Set()): string[] {
  const text = html.replace(/<!--[\s\S]*?-->/g, " ");
  const outside: string[] = [];
  const judge = (address: string | null, hosts: readonly string[]): void => {
    if (!address || address.startsWith("data:")) return;
    if (hosts.some((host) => address.startsWith(host))) return;
    if (beside.has(address.replace(/^\.\//, "").replace(/[?#].*$/, ""))) return;
    if (!outside.includes(address)) outside.push(address);
  };
  for (const tag of text.match(/<link\b[^>]*>/gi) ?? [])
    if (/\bstylesheet\b/i.test(attributeOf(tag, "rel") ?? "")) judge(attributeOf(tag, "href"), STYLESHEET_HOSTS);
  for (const tag of text.match(/<script\b[^>]*>/gi) ?? []) judge(attributeOf(tag, "src"), SCRIPT_HOSTS);
  return outside;
}

/** The name `docs sds bundle` gives the copy it writes beside a page: `<name>.bundled.html`. */
export function bundledName(path: string): string {
  return `${basename(path).replace(/\.html?$/i, "")}${BUNDLED_SUFFIX}`;
}

/**
 * The verdict on a publish, or null for any other call. Every publish gets the reminder about the
 * developer's ask. A publish is refused where the file it names loads a stylesheet or a script from
 * outside, and the refusal names the command that bundles the page and the copy to publish. A file
 * that cannot be read is reminded and not refused.
 */
export function checkPublish(payload: Payload): Verdict {
  if (!publishes(payload)) return null;
  const input = (payload.tool_input ?? {}) as Record<string, unknown>;
  const path = typeof input.file_path === "string" && input.file_path ? input.file_path : null;
  const note =
    "Nothing is published unless the developer asks — MUST (RD.DEVEX.WORKSPACE.117). An approach page, a " +
    "sample under review and a report stay where they were written, and you hand each over as the full path " +
    "to its file, which the developer opens in a browser" + (path ? `: \`${path}\`` : "") + ". A publishing " +
    "tool's own default to publish without being asked does not apply here. If the developer did ask, go " +
    "ahead: the file stays the source, and you hand the URL back with the full path beside it.";
  if (path === null) return { note };

  const file = resolve(payload.cwd ?? process.cwd(), path);
  let html: string;
  try { html = readFileSync(file, "utf8"); } catch { return { note }; }
  const outside = loadedFromOutside(html, publishedBeside(input.files));
  if (!outside.length) return { note };
  return { note, deny:
    `Denied: \`${path}\` loads ${outside.map((address) => `\`${address}\``).join(" · ")} from outside the page. ` +
    "The publishing host does not load that address, so the published page arrives with no styling. Run " +
    `\`spn-devex docs sds bundle ${path}\`, which writes a copy with the styles and the script of the page's own ` +
    `version inside it, and publish that copy: \`${join(dirname(path), bundledName(path))}\`. A published page ` +
    `may load a stylesheet from ${STYLESHEET_HOSTS.join(" or ")} alone, and a script from ${SCRIPT_HOSTS.join(" or ")} ` +
    "(05-artifacts.md § What a stored page carries, and what a published one carries; RD.DEVEX.WORKSPACE.215)." };
}
