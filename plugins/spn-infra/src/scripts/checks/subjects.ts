#!/usr/bin/env node
// RESTATES: nothing. It assembles what `checks/` states and what `providers/` parses.
//
// Which provider's validators this write is judged by, and which subjects exist.
//
// **THE ESTATE HAS ONE PROVIDER PER CATEGORY AND THE DECLARATION SAYS WHICH.** A write-time gate
// cannot read a resolved estate — there may not be one yet — so it runs EVERY provider's
// validators. That sounds wasteful and is not: the rules are the same and only the patterns differ,
// so the cost is a handful of regular expressions against text already in memory.
//
// **AND IT IS THE SAFE DIRECTION.** Running only the declared cloud's patterns would let an AWS
// region into a declaration whose cloud entry says Google, which is exactly the mistake somebody
// makes while moving an estate between clouds — the moment the gate is most worth having.
import type { Verdict } from "../lib/payload.ts";
import { validate as awsManifest } from "../providers/aws/validate-manifest.ts";
import { validate as awsRendering } from "../providers/aws/validate-rendering.ts";
import { validate as gcpManifest } from "../providers/gcp/validate-manifest.ts";
import { validate as gcpRendering } from "../providers/gcp/validate-rendering.ts";

/** One subject, parsed once per provider that has an opinion about it. */
export type Subject = { name: string; validate: (path: string, text: string) => Verdict };

/**
 * Every subject, in the order a person would want to hear about them.
 *
 * `rendering` reads the path alone, so it runs first and costs nothing when it does not apply.
 * `manifest` needs the text the write would produce.
 */
export const SUBJECTS: Subject[] = [
  { name: "rendering:aws", validate: awsRendering },
  { name: "rendering:gcp", validate: gcpRendering },
  { name: "manifest:aws", validate: awsManifest },
  { name: "manifest:gcp", validate: gcpManifest },
];

/** The text this call would ADD. A Write carries `content`, an Edit carries `new_string`. */
export const written = (input: { content?: string; new_string?: string }): string =>
  input.content ?? input.new_string ?? "";

/** True where a subject can decide without reading any text — the path is enough. */
export const pathOnly = (name: string): boolean => name.startsWith("rendering:");
