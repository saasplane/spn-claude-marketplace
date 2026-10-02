// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The index of artifacts — one page that opens every other
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// The index of a repository's artifacts, produced from the pages on disk.
//
//   spn-devex docs index check [<path>] [--out <file>]   compare the tree of the index with the pages
//   spn-devex docs index write <path> [--out <file>]     write the index
//
// A SUBJECT WITH TWO ACTIONS, AND A `tree` PATH. The path may be a repository, or any folder or file
// inside one, and the command finds the repository from it. A repository has one index, so `write`
// writes that one page, and `check` reports what it finds under the path.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { type Action, OPTIONAL, REQUIRED, VALUE, docsTreeOf, onePath, readWords, repositoryOf, scopeOf, under } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { ARTIFACT_INDEX, CONSTRUCT_PAGES, DOCS, OVERVIEW_PAGE_SUFFIX, POCKET, artifactDocsDir, artifactIndex, artifactsDir, docsOf,
  domainConstructsDir, guidePagesDir, hubPage, isOverview, isProducedPage, reportsDir,
  slashes } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { BUNDLED_SUFFIX, INDEX_SCRIPT } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";
import { locationOf, resolveWorkspace, text as plainText } from "./_lib.ts";
import { Refusal, attribute, escaped, newestCut,
  pageTemplate, place, refuseSlots, say, swap, templatesDir, withHead, type Note } from "./_pages.ts";

export const describe = "the index of a repository's artifacts, produced from the pages on disk";

const TEMPLATE = "artifact-index-template.html";
const OPTIONS = { out: VALUE };
/** The artifacts pocket, as a message names it. */
const POCKET_PATH = `${DOCS}/${POCKET.artifacts}`;
/** The three groups of the tree, in their order. */
const GROUPS = ["Docs", "Guides", "Reports"] as const;
/** How many tabs the index keeps open. One more page takes the tab that was opened longest ago. */
const TAB_LIMIT = 8;
/** The block of data that holds the tree, with the comment above it. */
const DATA_BLOCK = /(?:<!--(?:(?!-->)[\s\S])*-->\s*)?<script type="application\/json" id="index-data">([\s\S]*?)<\/script>/;

/**
 * One node of the tree, in the shape `sds-index.js` reads. A node with a `path` is a page. A node with
 * `children` and no `path` is a folder. An overview that holds constructs has both.
 */
export type TreeNode = {
  label: string; kind?: string; path?: string; title?: string; folded?: boolean; children?: TreeNode[];
  note?: string; beside?: boolean;
};
/** The data of an index: the path to the pages, the limit of tabs, and the groups. */
export type Tree = { base: string; tabs: number; groups: TreeNode[] };

/** What the index reads of one page: its text, its name, its kind, and the guide it was produced from. */
type PageFacts = { text: string; title: string; kind: string; source: string | null };

const byName = (one: string, two: string): number => (one < two ? -1 : one > two ? 1 : 0);
/** A folder's or a file's name without the number that orders it: `02-agent` is `agent`. */
const bare = (name: string): string => name.replace(/^\d+-/, "");

/** Every page under a folder, in the order of its path. A bundled copy and a hidden folder are skipped. */
function pagesUnder(folder: string): string[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder).sort(byName).flatMap((name) => {
    if (name.startsWith(".")) return [];
    const full = join(folder, name);
    if (statSync(full).isDirectory()) return pagesUnder(full);
    return name.endsWith(".html") && !name.endsWith(BUNDLED_SUFFIX) ? [full] : [];
  });
}

/** A page's name is the `title` of its block, and its `<title>` where it has no block. */
function factsOf(file: string): PageFacts {
  const text = readFileSync(file, "utf8");
  let block: Record<string, unknown> = {};
  const found = /<!--\s*spn:doc\s*(\{[\s\S]*?\})\s*-->/.exec(text);
  if (found) { try { block = JSON.parse(found[1]) as Record<string, unknown>; } catch { block = {}; } }
  const stem = basename(file, ".html");
  const tab = /<title>([\s\S]*?)<\/title>/.exec(text)?.[1];
  const title = typeof block.title === "string" && block.title ? block.title : (tab ? plainText(tab) : "") || stem;
  const kind = typeof block.variant === "string" && block.variant ? block.variant : stem.slice(stem.lastIndexOf("-") + 1);
  return { text, title, kind, source: typeof block.source === "string" ? block.source : null };
}

/** Every page under a node of the tree, the node itself too when it is a page. */
export function entriesOf(node: TreeNode): TreeNode[] {
  return [...(node.path === undefined ? [] : [node]), ...(node.children ?? []).flatMap(entriesOf)];
}

/**
 * The groups of the tree, from the pages under one artifacts pocket, and what is worth saying about
 * them. Every page is placed once.
 */
export function groupsOf(artifacts: string): { groups: TreeNode[]; pages: string[]; notes: Note[] } {
  const docs = dirname(artifacts);
  const files = pagesUnder(artifacts).filter((file) => file !== artifactIndex(docs));
  const facts = new Map(files.map((file): [string, PageFacts] => [file, factsOf(file)]));
  const notes: Note[] = [];
  const pathOf = (file: string): string => slashes(relative(artifacts, file));
  const entry = (file: string): TreeNode => ({ label: facts.get(file)!.title, kind: facts.get(file)!.kind, path: pathOf(file) });
  const under = (folder: string): string[] => files.filter((file) => file.startsWith(folder + sep));
  const direct = (folder: string): string[] => files.filter((file) => dirname(file) === folder);

  const docsRoot = artifactDocsDir(docs);
  const hub = files.find((file) => file === hubPage(docs)) ?? null;
  /** The overviews directly in one folder. The hub is not one of them. */
  const overviewsIn = (folder: string): string[] => direct(folder).filter((file) => file !== hub && isOverview(file));
  /** The construct pages of one folder: every page directly in its `constructs` folder. */
  const constructsIn = (folder: string): string[] => direct(domainConstructsDir(folder));
  const overviews = under(docsRoot).filter((file) => file !== hub && isOverview(file));
  // The part of an overview's file name that names its place: `devex-agent-overview` is `devex-agent`.
  const stems = new Map(overviews
    .map((file): [string, string] => [file, basename(file).slice(0, -OVERVIEW_PAGE_SUFFIX.length)]));

  // A FOLDER'S LABEL is the word an overview's title gives that part of its file name: `devex` is DevEx.
  const words = new Map<string, string>();
  for (const [file, stem] of stems) {
    const titleWords = facts.get(file)!.title.split(/\s+/).filter(Boolean);
    const parts = stem.split("-");
    if (titleWords.length === parts.length && titleWords.every((word, at) => word.toLowerCase() === parts[at]))
      parts.forEach((part, at) => words.set(part, titleWords[at]));
  }
  const label = (folder: string): string => {
    const name = bare(basename(folder));
    const spaced = name.replace(/-/g, " ");
    return words.get(name) ?? spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
  };

  // WHICH CONSTRUCTS AN OVERVIEW LINKS is read from the overview's own page: every link of it that
  // points at a construct page that is there.
  const linked = new Map<string, string[]>();
  for (const file of overviews) {
    const reached: string[] = [];
    for (const link of facts.get(file)!.text.matchAll(/<a\b[^>]*?\bhref="([^"#?]+)/g)) {
      if (/^[a-z][a-z0-9+.-]*:/.test(link[1])) continue;
      const target = resolve(dirname(file), link[1]);
      if (isProducedPage(target) && facts.has(target) && !reached.includes(target)) reached.push(target);
    }
    linked.set(file, reached);
  }

  // THE FOLDERS UNDER THE POCKET'S `docs` FOLDER ARE THE OUTLINE. A folder that holds a `constructs`
  // folder or an overview is a domain, and a folder that holds such folders is an area. A folder that
  // holds neither is not in the tree.
  const foldersIn = (folder: string): string[] => readdirSync(folder).sort(byName).filter((name) => name !== CONSTRUCT_PAGES)
    .map((name) => join(folder, name)).filter((full) => statSync(full).isDirectory() && under(full).length > 0);
  const holdsPages = (folder: string): boolean => overviewsIn(folder).length + constructsIn(folder).length > 0;
  const inTree = (folder: string): boolean => holdsPages(folder) || foldersIn(folder).some(inTree);
  const isArea = (folder: string): boolean => foldersIn(folder).some(inTree);

  // AN OVERVIEW BESIDE THE HUB belongs to no one domain, so it holds no construct.
  const beside = existsSync(docsRoot) ? overviewsIn(docsRoot) : [];
  for (const file of beside) {
    const reached = new Set(linked.get(file)!.map((construct) => dirname(construct))).size;
    notes.push({ grade: "SOFT", check: "index", file, message:
      `this overview sits beside the hub, in no domain's folder, and it links constructs of ${reached} folder(s), so it is listed under Docs after the hub and holds nothing` });
  }

  /**
   * One domain, which starts folded. With one overview it is the link to that overview, with its
   * constructs under it. With more it is a folder, and each overview holds the constructs it links.
   */
  const domainNode = (folder: string): TreeNode => {
    const here = overviewsIn(folder);
    const constructs = constructsIn(folder);
    const reach = new Map(here.map((file): [string, string[]] => [file, constructs.filter((construct) => linked.get(file)!.includes(construct))]));
    const holds = new Map(here.map((file): [string, string[]] => [file, []]));
    const rest: string[] = [];
    for (const construct of constructs) {
      const wanted = here.filter((file) => reach.get(file)!.includes(construct));
      if (!wanted.length) {
        rest.push(construct);
        if (here.length) notes.push({ grade: "SOFT", check: "index", file: construct, message:
          "no overview of its domain links this construct, so it comes last in its domain" });
        continue;
      }
      // Where two overviews of one domain link it, it sits under the one that links fewer constructs.
      const owner = wanted.reduce((narrowest, file) => {
        const fewer = reach.get(file)!.length - reach.get(narrowest)!.length;
        return fewer < 0 || (fewer === 0 && byName(basename(file), basename(narrowest)) < 0) ? file : narrowest;
      });
      holds.get(owner)!.push(construct);
    }
    if (here.length === 1) {
      const inside = [...holds.get(here[0])!, ...rest].map(entry);
      return { ...entry(here[0]), label: label(folder), title: facts.get(here[0])!.title, folded: true,
        ...(inside.length ? { children: inside } : {}) };
    }
    // Overviews of one domain stand in the order of the first construct each holds.
    const place = (file: string): number => (holds.get(file)!.length ? constructs.indexOf(holds.get(file)![0]) : constructs.length);
    const ordered = [...here].sort((one, two) => place(one) - place(two) || byName(basename(one), basename(two)));
    const inside = ordered.map((file): TreeNode => {
      const held = holds.get(file)!.map(entry);
      return { ...entry(file), ...(held.length ? { children: held } : {}) };
    });
    return { label: label(folder), folded: true, children: [...inside, ...rest.map(entry)] };
  };
  /** An area is a folder of the tree: its own overviews, its own constructs, then the folders in it. */
  const folderNode = (folder: string): TreeNode => {
    if (!isArea(folder)) return domainNode(folder);
    return { label: label(folder), children: [...overviewsIn(folder).map(entry), ...constructsIn(folder).map(entry),
      ...foldersIn(folder).filter(inTree).map(folderNode)] };
  };

  // DOCS: the hub by its own name, then each overview beside it, then the folders in their order.
  const docsGroup: TreeNode[] = [...(hub ? [entry(hub)] : []), ...beside.map(entry),
    ...(existsSync(docsRoot) ? foldersIn(docsRoot) : []).filter(inTree).map(folderNode)];
  // GUIDES stand in the order of the guides they were produced from, and REPORTS in the order of their paths.
  const guides = under(guidePagesDir(docs));
  const orderOf = (file: string): string => facts.get(file)!.source ?? pathOf(file);
  const guidesGroup = [...guides].sort((one, two) => byName(orderOf(one), orderOf(two))).map(entry);
  const reports = under(reportsDir(docs));
  const reportsGroup = reports.map(entry);

  // EVERY PAGE ON DISK IS IN THE TREE ONCE. A page in a place the tree has no rule for comes last under Docs.
  const placed = new Set([...docsGroup.flatMap(entriesOf), ...guidesGroup, ...reportsGroup].map((node) => node.path));
  for (const file of files.filter((one) => !placed.has(pathOf(one)))) {
    docsGroup.push(entry(file));
    notes.push({ grade: "SOFT", check: "index", file, message:
      "the tree has no place for a page that sits here, so it is listed last under Docs, by its own name" });
  }
  const every = [docsGroup, guidesGroup, reportsGroup].map((children, at): TreeNode => ({ label: GROUPS[at], children }));
  const groups = every.filter((group) => group.children!.length > 0);
  const counted = new Map<string, number>();
  for (const node of groups.flatMap(entriesOf)) counted.set(node.path!, (counted.get(node.path!) ?? 0) + 1);
  const wrong = files.map(pathOf).filter((path) => counted.get(path) !== 1);
  if (wrong.length || counted.size !== files.length)
    throw new Refusal(`the tree does not hold every page once: ${wrong.map((path) => `${path} is in it ${counted.get(path) ?? 0} time(s)`).join(", ")}`);
  return { groups, pages: files, notes };
}

/** The index page: the template's shell, with its head and its slots filled and its tree written. */
function indexPage(template: string, tree: Tree, where: { organisation: string; location: string; repository: string; hub: string }): string {
  const shell = withHead(template, {
    tab: `${where.location} Artifacts`,
    block: { id: `${basename(where.repository)}-artifacts-index`, variant: "index", title: "Artifacts",
      summary: `Every page of this repository's ${POCKET_PATH}, in one tree, opened in tabs.` },
    produced: "Produced by `docs index` from the pages on disk. Never edit this page: produce it again.",
    version: newestCut(), script: INDEX_SCRIPT,
  });
  const data = DATA_BLOCK.exec(shell);
  if (!data) throw new Refusal("the template has no block of data with the id `index-data`, so the page cannot be produced from it");
  let around = `${shell.slice(0, data.index)}\u0000${shell.slice(data.index + data[0].length)}`;
  around = swap(around, /\{\{WORKSPACE\}\}/, escaped(where.organisation), "slot `{{WORKSPACE}}`");
  around = swap(around, /\{\{REPOSITORY\}\}/, escaped(where.location), "slot `{{REPOSITORY}}`");
  around = swap(around, /\{\{THE ADDRESS OF THE HUB[^}]*\}\}/, attribute(where.hub), "slot for the address of the hub");
  refuseSlots(around, TEMPLATE);
  // The data sits in a script element, so a `<` in it is written as its escape and can never close the element.
  const written = JSON.stringify(tree, null, 1).replace(/</g, "\\u003c");
  return around.replace("\u0000", () =>
    "<!-- THE TREE, written by `docs index` from the pages on disk. Nobody types it. A folder has `label` and\n" +
    "     `children`. A page has `label`, `kind` and `path`. A node marked `folded` starts closed. -->\n" +
    `<script type="application/json" id="index-data">\n${written}\n</script>`);
}

/** A note of `check`, with the page it is about where that is another file than the one it is printed against. */
type Compared = Note & { about?: string };

/** Where the tree of the index that is there and the pages on disk disagree. Nothing is written. */
function compare(indexFile: string, artifacts: string, pages: string[]): Compared[] {
  const rule = (file: string, message: string, about?: string): Compared => ({ grade: "RULE", check: "index", file, message, about });
  if (!existsSync(indexFile))
    return [rule(indexFile, `there is no index here, so none of the ${pages.length} page(s) under ${POCKET_PATH} has an entry. Run \`docs index write\``)];
  const data = DATA_BLOCK.exec(readFileSync(indexFile, "utf8"));
  let tree: Tree | null = null;
  if (data) { try { tree = JSON.parse(data[1]) as Tree; } catch { tree = null; } }
  if (!tree || !Array.isArray(tree.groups))
    return [rule(indexFile, "this index holds no tree: it has no block of data with the id `index-data` that can be read")];
  const base = typeof tree.base === "string" ? tree.base : "";
  const counted = new Map<string, number>();
  const notes: Compared[] = [];
  for (const node of tree.groups.flatMap(entriesOf)) {
    const file = resolve(dirname(indexFile), (node.beside ? "" : base) + node.path);
    counted.set(file, (counted.get(file) ?? 0) + 1);
    if (!pages.includes(file) && counted.get(file) === 1)
      notes.push(rule(indexFile, `the entry \`${node.label}\` has no page: ${slashes(relative(artifacts, file))} is not there`, file));
  }
  for (const file of pages) {
    const times = counted.get(file) ?? 0;
    if (times === 0) notes.push(rule(file, `the tree of ${ARTIFACT_INDEX} lacks this page`));
    if (times > 1) notes.push(rule(file, `the tree of ${ARTIFACT_INDEX} holds this page ${times} times`));
  }
  return notes;
}

/**
 * The docs tree a path belongs to. A folder in no repository that holds a `docs/` folder is read as a
 * repository would be, so a tree with no manifest above it still has an index.
 */
function treeOf(path: string): string {
  if (repositoryOf(path) === null && existsSync(join(path, DOCS))) return docsOf(path);
  return docsTreeOf(path);
}

/** Both actions are one reading of the pages on disk; `write` is the one that puts the index there. */
function run(args: string[], write: boolean): number {
  const words = readWords(args, OPTIONS);
  const path = onePath(scopeOf(words.paths, write ? REQUIRED : OPTIONAL));
  const workspace = resolveWorkspace();
  const docs = treeOf(path);
  const repository = dirname(docs);
  const artifacts = artifactsDir(docs);
  try {
    if (!existsSync(artifacts) || !statSync(artifacts).isDirectory())
      throw new Refusal(`${repository} has no ${POCKET_PATH}, so there is nothing to list`);
    const typedOut = words.value("out");
    const out = resolve(typedOut ?? artifactIndex(docs));
    // THE PATH FEEDS THE INDEX where the index sits under it, or where it sits in the pocket the index
    // is produced from. A path beside both names no page of the index, so the run has nothing to do.
    if (typedOut === null && !under(out, [path]) && !under(path, [artifacts])) {
      console.log(`nothing to ${write ? "write" : "check"} — ${relative(workspace, path)} holds no page of ${POCKET_PATH} and no index`);
      return 0;
    }
    const { groups, pages, notes } = groupsOf(artifacts);
    // The path to the pages is kept once, as `base`. It is empty where the index sits in the pocket itself.
    const base = dirname(out) === artifacts ? "" : `${slashes(relative(dirname(out), artifacts))}/`;
    const named = locationOf(docs, workspace);
    // The hub is the first page of the tree. Where a repository has no hub, the first page stands for it.
    const first = groups.flatMap(entriesOf)[0]?.path ?? "";
    const produce = (): string => indexPage(pageTemplate(templatesDir(workspace), TEMPLATE), { base, tabs: TAB_LIMIT, groups }, {
      organisation: process.env.SPN_ORG ?? "SaaS Plane",
      location: process.env.SPN_LOCATION ?? (named === "—" ? basename(repository) : named),
      repository,
      hub: base + first,
    });
    if (write) return say([...place(out, produce(), true, workspace, "index"), ...notes], workspace) ? 1 : 0;

    // WHAT IS READ IS THE WHOLE POCKET, AND WHAT IS REPORTED SITS UNDER THE PATH. A note is reported
    // where its file, or the page it is about, is under the path, and the index itself where it is.
    const found = compare(out, artifacts, pages);
    const whole = under(out, [path]);
    if (!found.length && whole) {
      let current = true;
      try { current = readFileSync(out, "utf8") === produce(); } catch { current = true; }
      if (!current) found.push({ grade: "SOFT", check: "index", file: out, message:
        "the tree holds every page once, but this page is not what `docs index write` writes now: a name or a place changed" });
      else console.log(`current  ${relative(workspace, out)}`);
    }
    const reported = [...found, ...notes].filter((note: Compared) => under(note.file, [path]) || (note.about !== undefined && under(note.about, [path])));
    if (!reported.length && !whole) console.log(`current  ${relative(workspace, path)} — the tree of ${ARTIFACT_INDEX} and the pages under this path agree`);
    return say(reported, workspace) ? 1 : 0;
  } catch (refused) {
    if (!(refused instanceof Refusal)) throw refused;
    console.error(`✗ ${refused.message}`);
    return 1;
  }
}

export const actions: Record<string, Action> = {
  check: {
    describe: "compare the tree of the index with the pages on disk, and write nothing",
    usage: "[<path>] [--out <file>]",
    run: (args) => run(args, false),
  },
  write: {
    describe: "write the index of the repository the path sits in",
    usage: "<path> [--out <file>]",
    run: (args) => run(args, true),
  },
};
