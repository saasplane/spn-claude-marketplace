// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md § The five seats · § The two pockets · § A seat may carry `templates/`
//           docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § What the pocket holds · § The approach document — a workstream's, never a repository's
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// The docs layout, stated once: every plugin script builds and recognizes a docs path through this
// module, which spn-devex, spn-apps and spn-infra each import by relative path. support-lib's unit
// suite refuses a literal layout folder in any other script of any plugin.
//
// Two layouts meet here:
//
//   <repo>/docs/                                     a repository's docs tree
//     01-purpose/ … 05-guides/                       the five seats, numbered in reading order
//     registers/decisions.md                         the pocket holding the repository's own rules
//     artifacts/{overviews,constructs,reports}/      the pocket holding what a node produced
//   <workspace>/.spndevex/workstreams/<state>/<NNN-subject>/
//                                                    a workstream, its approach page and its arcs
//
// Paths are compared with forward slashes.

import { join, sep } from "node:path";

/** The workspace's working-state folder, at the workspace root. */
export const DEVEX = ".spndevex";

// ---------------------------------------------------------------------------- the docs tree

/** The folder a repository's docs tree sits in, at the repository root. */
export const DOCS = "docs";

/** The five seats, by the question each answers, in reading order (03-tree.md § The five seats). */
export const SEAT = {
  purpose: "01-purpose",
  constructs: "02-constructs",
  behaviors: "03-behaviors",
  capabilities: "04-capabilities",
  guides: "05-guides",
} as const;
export type Seat = keyof typeof SEAT;
/** The seat folders in reading order. */
export const SEATS: readonly string[] = Object.values(SEAT);

/** The two pockets, unnumbered because a pocket is consulted rather than read (03-tree.md § The two pockets). */
export const POCKET = { registers: "registers", artifacts: "artifacts" } as const;
export type Pocket = keyof typeof POCKET;

/** The artifacts pocket's folder set, which is fixed (05-artifacts.md § What the pocket holds). */
export const ARTIFACT = { overviews: "overviews", constructs: "constructs", guides: "guides", reports: "reports" } as const;
export const ARTIFACT_FOLDERS: readonly string[] = Object.values(ARTIFACT);

/** The one folder a seat may hold that is not documents (03-tree.md § A seat may carry `templates/`). */
export const TEMPLATES = "templates";

/** A folder's face, the file every seat, level and node carries. */
export const FACE = "README.md";
/** The decision log in the registers pocket. */
export const DECISIONS = "decisions.md";
/** What a construct page's file name ends in, beside the seat file's stem. */
export const CONSTRUCT_PAGE_SUFFIX = "-construct.html";
/** What a guide page's file name ends in. */
export const GUIDE_PAGE_SUFFIX = "-guide.html";
/** The index of artifacts: one per repository, directly in the pocket. */
export const ARTIFACT_INDEX = "index.html";
/** The hub: one per repository, the entry point of the overviews. */
export const HUB = "concept-overview.html";

/** Forward slashes, whatever the platform wrote. */
export const slashes = (path: string): string => path.split(sep).join("/").replace(/\\/g, "/");

/** A repository's docs tree. */
export function docsOf(repo: string): string { return join(repo, DOCS); }

/** One seat's folder inside a docs tree. */
export function seatDir(docs: string, seat: Seat): string { return join(docs, SEAT[seat]); }
export function constructsDir(docs: string): string { return seatDir(docs, "constructs"); }
export function behaviorsDir(docs: string): string { return seatDir(docs, "behaviors"); }
export function capabilitiesDir(docs: string): string { return seatDir(docs, "capabilities"); }

/** One pocket's folder inside a docs tree. */
export function pocketDir(docs: string, pocket: Pocket): string { return join(docs, POCKET[pocket]); }
export function registersDir(docs: string): string { return pocketDir(docs, "registers"); }
/** The decision log, `<docs>/registers/decisions.md`. */
export function decisionsRegister(docs: string): string { return join(registersDir(docs), DECISIONS); }
export function artifactsDir(docs: string): string { return pocketDir(docs, "artifacts"); }
export function overviewsDir(docs: string): string { return join(artifactsDir(docs), ARTIFACT.overviews); }
/** Where construct pages sit: the pocket folder that mirrors the constructs seat folder for folder. */
export function constructPagesDir(docs: string): string { return join(artifactsDir(docs), ARTIFACT.constructs); }
export function reportsDir(docs: string): string { return join(artifactsDir(docs), ARTIFACT.reports); }
/** Where guide pages sit: the pocket folder that holds each guide produced as a page. */
export function guidePagesDir(docs: string): string { return join(artifactsDir(docs), ARTIFACT.guides); }
/** The index of artifacts of a docs tree. */
export function artifactIndex(docs: string): string { return join(artifactsDir(docs), ARTIFACT_INDEX); }
/** The hub page of a docs tree. */
export function hubPage(docs: string): string { return join(overviewsDir(docs), HUB); }
/**
 * The folder a file sits in directly under a docs tree's artifacts pocket — `overviews` for
 * `<repo>/docs/artifacts/overviews/01-x/a.html` — or `null` where the file is not inside a folder of
 * that pocket. A check compares it with `ARTIFACT_FOLDERS`, because the pocket's folder set is fixed.
 */
export function artifactFolderOf(path: string): string | null {
  const parts = slashes(path).split("/");
  for (let at = 0; at + 3 < parts.length; at += 1)
    if (parts[at] === DOCS && parts[at + 1] === POCKET.artifacts) return parts[at + 2] || null;
  return null;
}

const segment = (name: string): string => `/${name}/`;

/** Whether a path has the named folder as one of its segments. */
export function hasSegment(path: string, name: string): boolean {
  return slashes(path).includes(segment(name));
}

/** Whether a path sits inside the given seat. */
export function inSeat(path: string, seat: Seat): boolean { return hasSegment(path, SEAT[seat]); }
/** Whether a path sits inside the artifacts pocket. */
export function inArtifacts(path: string): boolean { return hasSegment(path, POCKET.artifacts); }
/** Whether a path sits under a `templates/` folder, which the document checks skip by folder. */
export function inTemplates(path: string): boolean { return hasSegment(path, TEMPLATES); }

/**
 * A path split where the seat folder sits: the docs tree above it, and the path inside it. Null when
 * the path is not inside the seat. `first` reads the first such segment, `last` the last one.
 */
export function splitAtSeat(path: string, seat: Seat, from: "first" | "last" = "first"): { docs: string; rel: string } | null {
  const norm = slashes(path);
  const mark = segment(SEAT[seat]);
  const at = from === "first" ? norm.indexOf(mark) : norm.lastIndexOf(mark);
  if (at < 0) return null;
  return { docs: norm.slice(0, at), rel: norm.slice(at + mark.length) };
}

/** The same relative path in another seat — a construct's behaviours file, say. Null outside `from`. */
export function mirrorPath(path: string, from: Seat, to: Seat): string | null {
  const split = splitAtSeat(path, from);
  return split ? `${split.docs}${segment(SEAT[to])}${split.rel}` : null;
}

/** A construct seat file: a `.md` in the constructs seat that is not a face. */
export function isSeatFile(path: string): boolean {
  const norm = slashes(path);
  return inSeat(norm, "constructs") && norm.endsWith(".md") && !norm.endsWith(`/${FACE}`);
}

/** The construct page a seat file is produced as (05-artifacts.md § What the pocket holds). */
export function producedPageOf(seatFile: string): string {
  return slashes(seatFile)
    .replace(segment(SEAT.constructs), segment(`${POCKET.artifacts}/${ARTIFACT.constructs}`))
    .replace(/\.md$/, CONSTRUCT_PAGE_SUFFIX);
}

/** A construct page: an `…-construct.html` in the pocket folder that mirrors the constructs seat. */
export function isProducedPage(path: string): boolean {
  const norm = slashes(path);
  return norm.includes(segment(`${POCKET.artifacts}/${ARTIFACT.constructs}`)) && norm.endsWith(CONSTRUCT_PAGE_SUFFIX);
}

/** The seat file a construct page is produced from, found by path alone. */
export function seatOf(producedPage: string): string {
  return slashes(producedPage)
    .replace(segment(`${POCKET.artifacts}/${ARTIFACT.constructs}`), segment(SEAT.constructs))
    .replace(new RegExp(`${CONSTRUCT_PAGE_SUFFIX.replace(/[.]/g, "\\.")}$`), ".md");
}

/** An overview page: an `.html` in the pocket's `overviews/`. */
export function isOverview(path: string): boolean {
  const norm = slashes(path);
  return norm.includes(segment(`${POCKET.artifacts}/${ARTIFACT.overviews}`)) && norm.endsWith(".html");
}

/** A register: a `.md` in the registers pocket that is not its face. */
export function isRegister(path: string): boolean {
  const norm = slashes(path);
  return norm.endsWith(".md") && norm.includes(segment(POCKET.registers)) && !norm.endsWith(`/${FACE}`);
}

/**
 * The docs tree a path sits in, or null outside one. The tree is the `docs` folder directly above a
 * seat or a pocket; a file at the tree's own top level (its face, say) falls back to the nearest
 * `docs` folder above it.
 */
export function docsRootOf(path: string): string | null {
  const parts = slashes(path).split("/");
  const inside = new Set<string>([...SEATS, ...Object.values(POCKET)]);
  for (let i = 1; i < parts.length; i += 1)
    if (inside.has(parts[i]) && parts[i - 1] === DOCS) return parts.slice(0, i).join("/");
  for (let i = parts.length - 2; i >= 0; i -= 1)
    if (parts[i] === DOCS) return parts.slice(0, i + 1).join("/");
  return null;
}

/**
 * The foundation's page templates, relative to the foundation's root. Every produced page is
 * rendered with them, in every tree.
 */
export const BOOK_TEMPLATES = [DOCS, SEAT.capabilities, "01-devex", "04-workspace", "04-docs", TEMPLATES].join("/");
/** The foundation's page templates, under a foundation checkout. */
export function bookTemplatesDir(foundation: string): string { return join(foundation, BOOK_TEMPLATES); }

/**
 * The plugin's byte-identical copy of the book's templates, relative to the plugin's `src/`, beside
 * the ref that cites it (`refs/devex/workspace/docs/doc-sets.md`).
 */
export const PLUGIN_TEMPLATES = ["refs", "devex", "workspace", DOCS, TEMPLATES].join("/");

// ---------------------------------------------------------------------------- the workstreams

/** The container every workstream sits in, under the workspace's `.spndevex/`. */
export const WORKSTREAMS = "workstreams";
/** The container, relative to the workspace root, as a message names it. */
export const DEVEX_WORKSTREAMS = `${DEVEX}/${WORKSTREAMS}`;
/** The name that container replaced. Readers still accept it so a half-migrated workspace parses. */
export const SESSIONS = "sessions";
/** A workstream's lifecycle: `open` is being worked, `backlog` is parked, `closed` is accounted for. */
export const WORKSTREAM_STATES = ["open", "backlog", "closed"] as const;
export type WorkstreamState = (typeof WORKSTREAM_STATES)[number];
/** The folder inside a workstream holding one file per arc. */
export const ARCS = "arcs";
/** What an approach page's file name ends in. It lives in its workstream, never in a docs tree. */
export const APPROACH_SUFFIX = "-approach.html";
/** A workstream's own page. The folder carries the number and the subject, so the file name repeats neither. */
export const APPROACH_PAGE = "approach.html";

/**
 * Whether a file is an approach page: a workstream's `approach.html`, or a page named
 * `<subject>-approach.html`, which is the name a closed workstream keeps.
 */
export function isApproachPage(path: string): boolean {
  const name = slashes(path).split("/").pop() ?? "";
  return name === APPROACH_PAGE || name.endsWith(APPROACH_SUFFIX);
}

/** The folder holding one state's workstreams, `<root>/.spndevex/workstreams/<state>`. */
export function workstreamsDir(root: string, state: WorkstreamState): string {
  return join(root, DEVEX, WORKSTREAMS, state);
}

/** The same, under the name the container replaced. */
export function legacyWorkstreamsDir(root: string, state: WorkstreamState): string {
  return join(root, DEVEX, SESSIONS, state);
}

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const STATE_GROUP = `(?:${WORKSTREAM_STATES.join("|")})`;

/**
 * The pattern source for `.spndevex/workstreams/<state>/` — the prefix every workstream path starts
 * with. `legacy` also accepts the container's older name.
 */
export function workstreamPrefixSource(legacy = false): string {
  const container = legacy ? `(?:${WORKSTREAMS}|${SESSIONS})` : WORKSTREAMS;
  return `${escape(DEVEX)}\\/${container}\\/${STATE_GROUP}\\/`;
}

/**
 * The workstream folder a path sits in, and its name, or null outside one. Both container names
 * are read.
 */
export function workstreamDirOf(path: string): { folder: string; name: string } | null {
  const found = new RegExp(`^(.*\\/${workstreamPrefixSource(true)}([^/]+))\\/`).exec(slashes(path));
  return found ? { folder: found[1], name: found[2] } : null;
}

/** An arc file: any `.md` directly under a workstream's `arcs/`, in either container. */
export function isArcFile(path: string): boolean {
  return new RegExp(`\\/${escape(DEVEX)}\\/(?:${WORKSTREAMS}|${SESSIONS})\\/[^/]+\\/[^/]+\\/${ARCS}\\/[^/]+\\.md$`).test(slashes(path));
}

/**
 * `/workstreams/<state>/<subject>/arcs/<file>.md` anywhere in a text — a path, or a command naming
 * one. `anchored` requires it to end the text.
 */
export function arcPathPattern(anchored: boolean): RegExp {
  return new RegExp(`\\/${WORKSTREAMS}\\/[^/]+\\/[^/]+\\/${ARCS}\\/[^/]+\\.md${anchored ? "$" : ""}`);
}
