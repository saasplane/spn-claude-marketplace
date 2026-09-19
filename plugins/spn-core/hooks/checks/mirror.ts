#!/usr/bin/env node
// When an edit lands under a node's `src/`, name the one document that governs that folder.
//
// **What a mirror is.** A capability document named for the `src/` folder it governs, carrying that
// folder's seams — guarantee, placement, from context, does not do, the phrase, proven by. One per
// seam family, never one per file. The capability face's `Map` declares them: `File · Governs ·
// Carries · Status`.
//
// **What this is for.** A mirror that states a seam's promise does not drift on its own; it drifts
// because the code moved and nobody who moved it knew the document existed. Finding out costs a walk
// of a docs tree you were not thinking about. So the cost is paid here instead, at the moment the
// edit lands, in one line.
//
// **IT NEVER REFUSES, AND IT SAYS ONE THING.** The seams a mirror carries are prose, and whether an
// edit changed one is a reading, not a match — so a gate here would be guessing. What it can know for
// certain is WHICH document to open, and that is all it says.
//
// **The longest governing folder wins.** The depth rule starts a mirror at `src/<top>/` and goes one
// level deeper only where a folder holds more than one seam family, so `src/app/` and
// `src/app/services/session/` can both be declared. An edit inside the deeper one belongs to the
// deeper mirror, and naming the shallower would send the reader to the wrong page.
//
// **Silent when no row governs the folder.** That case is invariant 4's — *every `src/` folder has a
// code mirror, or the face names it and says where its facts live* — and the audit reports it once,
// against the whole tree. Saying it again on every edit would put a finding nobody can act on in the
// middle of unrelated work, on repeat.
//
// **Once per mirror per session.** A sitting spends many edits in one folder. The first names the
// document; the rest would be the same line over and over, which is how a reader learns to skip it.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import type { Payload, Verdict } from "../lib/payload.ts";
import { DEVEX, read } from "../lib/payload.ts";

const DEBUG = ".debug";
const MIRROR = "mirror";

/**
 * The capability face governing a node, found through the node's own README.
 *
 * A node carries `README.md` and no docs tree: the seats live once, in the repository's tree, and
 * the README links into the ones this node realizes. So the README is the index, and it is the only
 * thing that knows which domain and which layer a node's mirrors sit under — a path cannot say it,
 * because `packages/module-server-iam-ts` lands at `04-capabilities/01-iam/01-server/`.
 *
 * THE DEEPEST LINK WINS, for the same reason the longest governing folder does below: a README
 * reaching both the capabilities SEAT and this node's own face inside it names two true things, and
 * only the deeper one is about this node. The seat face carries no Map of this node's mirrors.
 *
 * Silent where the README carries no such link. That is a node whose seat has not been written yet,
 * and invariant 4 is what reports it — against the whole tree, once, rather than on every edit.
 */
export function faceOf(node: string): string | null {
  const readme = read(join(node, "README.md"));
  if (!readme) return null;
  const faces = [...readme.matchAll(/\]\(([^)\s]+04-capabilities\/[^)\s]*README\.md)\)/g)]
    .map((m) => resolve(node, m[1]))
    .filter((face) => existsSync(face))
    .sort((a, b) => b.split("/").length - a.split("/").length);
  return faces[0] ?? null;
}

/** A Map row: the document, and the `src/` folder it governs. */
export type Row = { file: string; governs: string; status: string };

/**
 * The node a file under `src/` belongs to, and the path inside it.
 *
 * The node is whatever holds the `src/` the file sits under — the LAST such segment, so a fixture or
 * a vendored tree carrying its own `src/` resolves to itself rather than to the repository above it.
 */
export function nodeOf(path: string): [node: string, within: string] | null {
  const full = resolve(path).split("\\").join("/");
  const at = full.lastIndexOf("/src/");
  if (at === -1) return null;
  return [full.slice(0, at), full.slice(at + 1)];
}

/**
 * The `Map` table of a capability face, as rows.
 *
 * Only rows whose Governs cell names a `src/` path are kept: `data-model.md` governs the migrations
 * and writes `—` there, and a row with no folder cannot govern an edit.
 */
export function mapRows(face: string): Row[] {
  const text = read(face);
  if (!text) return [];
  const at = text.search(/^##\s+Map\s*$/m);
  if (at === -1) return [];
  const rest = text.slice(at);
  const end = rest.search(/^##\s+(?!Map\b)/m);
  const table = end === -1 ? rest : rest.slice(0, end);
  const rows: Row[] = [];
  for (const line of table.split("\n")) {
    if (!line.trimStart().startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 2) continue;
    // A link, or bare text. The document is the link's target where there is one, because the label
    // and the target can differ and the target is the path a reader opens.
    const link = /\[([^\]]*)\]\(([^)]+)\)/.exec(cells[0]);
    const file = (link ? link[2] : cells[0]).trim();
    if (!file.endsWith(".md")) continue;                       // the header row, and any prose row
    const governs = /`(src\/[^`]*)`/.exec(cells[1]);
    if (!governs) continue;                                    // `—`, as `data-model.md` writes it
    rows.push({ file, governs: governs[1].replace(/\/+$/, ""), status: cells[3] ?? "" });
  }
  return rows;
}

/** The row governing this path, longest folder first, or null. */
export function governing(rows: Row[], within: string): Row | null {
  const candidates = rows
    .filter((row) => within === row.governs || within.startsWith(`${row.governs}/`))
    .sort((a, b) => b.governs.length - a.governs.length);
  return candidates[0] ?? null;
}

/**
 * One nudge per mirror per session, remembered where the workspace keeps its machinery's state.
 *
 * ONE FILE PER SESSION, LISTING THE MIRRORS — not one file per pair. A sitting touches many folders,
 * so a file each would grow this folder by a multiple of what `confirmed` leaves beside it, and
 * nothing ever sweeps it.
 */
function alreadySaid(root: string, session: string | undefined, mirror: string): boolean {
  if (!session) return false;
  const marker = join(root, DEVEX, DEBUG, MIRROR, session);
  try {
    const said = (read(marker) ?? "").split("\n").filter(Boolean);
    if (said.includes(mirror)) return true;
    mkdirSync(join(root, DEVEX, DEBUG, MIRROR), { recursive: true });
    writeFileSync(marker, [...said, mirror].join("\n") + "\n", "utf8");
    return false;
  } catch { return false; }
}

/** Whether this path could possibly have a mirror, from the path alone. */
export function applies(path: string): boolean {
  return path.includes("/src/") && !path.includes("/node_modules/");
}

/** The one line naming the mirror that governs an edited `src/` folder. */
export function checkMirror(payload: Payload): Verdict {
  const path = payload.tool_input?.file_path;
  if (!path || !applies(path)) return null;
  const found = nodeOf(path);
  if (!found) return null;
  const [node, within] = found;

  const face = faceOf(node);
  if (!face) return null;                          // the node's README names no capability face yet
  const row = governing(mapRows(face), dirname(within));
  if (!row) return null;                           // invariant 4's finding, and the audit owns it

  const mirror = resolve(dirname(face), row.file);
  const root = payload.cwd ?? process.cwd();
  if (alreadySaid(root, payload.session_id, mirror)) return null;

  const shown = relative(root, mirror).startsWith("..") ? mirror : relative(root, mirror);
  const status = row.status ? ` ${row.status}` : "";
  return { note: `${shown}${status} is the mirror of \`${row.governs}/\` — if this edit changes a seam's guarantee, its placement, what it takes from context or what it does not do, that page says so and is updated in the same sitting.` };
}

if (process.argv[1] && basename(process.argv[1]) === "mirror.ts") {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  let payload: Payload = {};
  try { payload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Payload; } catch { /* allows */ }
  const { emit } = await import("../lib/payload.ts");
  emit(checkMirror(payload));
  process.exit(0);
}
