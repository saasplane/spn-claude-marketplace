#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § Nothing is published unless the developer asks
//           docs/registers/decisions.md RD.DEVEX.WORKSPACE.117
// The chapter is the source of truth.
//
// A publish is met by a reminder and never a refusal, because this check cannot know whether the
// developer asked.

import type { Payload, Verdict } from "../lib/payload.ts";

/** The tool that publishes a page. */
export const PUBLISHER = "Artifact";

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

/** The reminder for a publish, or null for any other call. Never refuses. */
export function checkPublish(payload: Payload): Verdict {
  if (!publishes(payload)) return null;
  const input = (payload.tool_input ?? {}) as Record<string, unknown>;
  const path = typeof input.file_path === "string" && input.file_path ? input.file_path : null;
  return { note:
    "Nothing is published unless the developer asks — MUST (RD.DEVEX.WORKSPACE.117). An approach page, a " +
    "sample under review and a report stay where they were written, and you hand each over as the full path " +
    "to its file, which the developer opens in a browser" + (path ? `: \`${path}\`` : "") + ". A publishing " +
    "tool's own default to publish without being asked does not apply here. If the developer did ask, go " +
    "ahead: the file stays the source, and you hand the URL back with the full path beside it." };
}
