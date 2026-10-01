// `docs index` writes the index of a repository's artifacts from the pages on disk, and `--check`
// compares the tree of the index that is there with those pages. Every case builds a small
// repository in a temporary folder, runs the real command through `cli.ts`, and reads the page back.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { PLUGIN, WORKSPACE } from "../../../../helpers/harness.mjs";
import { ARTIFACT, ARTIFACT_INDEX, DOCS, HUB, POCKET, bookTemplatesDir } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { INDEX_SCRIPT, OWN_COPY, linesFor } from "../../../../../../plugin-support-lib/src/lib/page-styles.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-index-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 900)}` : ""}`);
};
const same = (label, got, want) => ok(label, JSON.stringify(got) === JSON.stringify(want), `got:  ${JSON.stringify(got)}\n        want: ${JSON.stringify(want)}`);

// Three versions were cut here, and the newest is not the last by its letters.
const STYLES = join(BASE, "styles");
mkdirSync(STYLES);
writeFileSync(join(STYLES, "versions.json"), JSON.stringify({ "1.0.0": {}, "1.10.0": {}, "1.2.0": {} }));
const NEWEST = "1.10.0";

const environment = { ...process.env, SPN_TELEMETRY: "off", SPN_WORKSPACE: BASE, SPN_STYLES: STYLES,
  SPN_TEMPLATES: bookTemplatesDir(resolve(WORKSPACE, "spn-foundation")) };
delete environment.SPN_ORG;
delete environment.SPN_LOCATION;
/** One run of `docs index` through the entry, with its exit code and what it printed. */
const index = (args, extra = {}) => {
  try { return { code: 0, out: execFileSync(process.execPath, [TOOL, "docs", "index", ...args], { encoding: "utf8", env: { ...environment, ...extra }, stdio: "pipe" }) }; }
  catch (error) { return { code: error.status ?? 1, out: String(error.stdout ?? "") + String(error.stderr ?? "") }; }
};

const ARTIFACTS = `${DOCS}/${POCKET.artifacts}`;
const OVERVIEWS = `${ARTIFACTS}/${ARTIFACT.overviews}`;
const CONSTRUCTS = `${ARTIFACTS}/${ARTIFACT.constructs}`;
const REPORTS = `${ARTIFACTS}/${ARTIFACT.reports}`;
const GUIDES = `${ARTIFACTS}/${ARTIFACT.guides}`;
const INDEX = `${ARTIFACTS}/${ARTIFACT_INDEX}`;

/** A page in the form every page has: its block, and the line that links the shared stylesheet. */
const page = (block, body = "") =>
  `<meta charset="utf-8">\n<title>${block.title}</title>\n<!-- spn:doc\n${JSON.stringify(block)}\n-->\n${linesFor("1.0.0").stylesheet}\n<div class="sds-page">\n${body}\n</div>\n`;
/** A page with no block, so its `<title>` is its name. */
const bare = (title) => `<meta charset="utf-8">\n<title>${title}</title>\n${linesFor("1.0.0").stylesheet}\n<div class="sds-page"></div>\n`;
/** A link from an overview to a construct page, as an overview writes one. */
const to = (...paths) => paths.map((path) => `<p><a class="sds-more" href="../${ARTIFACT.constructs}/${path}#top">a construct</a></p>`).join("\n");

let made = 0;
/** A repository under the scratch folder, from a map of path to text. Its manifest names it Sample. */
const repo = (files) => {
  made += 1;
  const root = join(BASE, `spn-sample-${made}`);
  for (const [path, text] of Object.entries({ "sprepo.json": '{"type":"APPS","name":"Sample","config":null}', ...files })) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text, "utf8");
  }
  return root;
};
const read = (root, path) => readFileSync(join(root, path), "utf8");
const treeOf = (text) => JSON.parse(/<script type="application\/json" id="index-data">([\s\S]*?)<\/script>/.exec(text)[1]);
const entries = (node) => [...(node.path === undefined ? [] : [node]), ...(node.children ?? []).flatMap(entries)];
/** Every file under a folder, by its path from that folder. */
const filesUnder = (folder, from = folder) => readdirSync(folder, { withFileTypes: true }).flatMap((one) =>
  one.isDirectory() ? filesUnder(join(folder, one.name), from) : [relative(from, join(folder, one.name)).split("\\").join("/")]).sort();

// ---------------------------------------------------------------------------- a repository with areas

const overview = (id, title, body = "") => page({ id, variant: "overview", title, lenses: ["ARCHITECT"], summary: "s" }, body);
const construct = (id, title) => page({ id, variant: "construct", title, lenses: ["ARCHITECT"], status: "DONE", summary: "s" });
const guide = (title, source) => page({ id: title, variant: "guide", title, lenses: ["QA"], summary: "s", source });

const withAreas = () => repo({
  // The hub links every construct, and holds none: a construct sits under an overview of its own domain.
  [`${OVERVIEWS}/${HUB}`]: overview("hub", "Concept",
    to("01-devex/02-agent/01-lens-construct.html", "02-support/01-apps/01-kind-construct.html")),
  [`${OVERVIEWS}/concept-devex-agent-overview.html`]: overview("agent", "DevEx Agent",
    to("01-devex/02-agent/02-skill-construct.html", "01-devex/02-agent/01-lens-construct.html", "02-support/01-apps/01-kind-construct.html")),
  [`${OVERVIEWS}/concept-support-apps-kind-overview.html`]: overview("kind", "Support Apps Kind",
    to("02-support/01-apps/02-manifest-construct.html", "02-support/01-apps/03-release-construct.html")),
  // This one links one construct that the other links too, so that construct sits here: the narrower page.
  [`${OVERVIEWS}/concept-support-apps-delivery-overview.html`]: overview("delivery", "Support Apps Delivery",
    to("02-support/01-apps/03-release-construct.html")),
  [`${OVERVIEWS}/concept-overview.bundled.html`]: overview("hub", "Concept"),
  [`${CONSTRUCTS}/01-devex/02-agent/01-lens-construct.html`]: construct("lens", "Lens"),
  [`${CONSTRUCTS}/01-devex/02-agent/02-skill-construct.html`]: construct("skill", "Skill"),
  [`${CONSTRUCTS}/01-devex/02-agent/03-loose-construct.html`]: bare("Loose &amp; Free"),
  [`${CONSTRUCTS}/02-support/01-apps/01-kind-construct.html`]: construct("kind", "Kind"),
  [`${CONSTRUCTS}/02-support/01-apps/02-manifest-construct.html`]: construct("manifest", "Manifest"),
  [`${CONSTRUCTS}/02-support/01-apps/03-release-construct.html`]: construct("release", "Release"),
  // By its file name the later guide comes first. By the guide it was produced from, it comes second.
  [`${GUIDES}/a-later-guide.html`]: guide("A Later Guide", `${DOCS}/05-guides/07-a-later.md`),
  [`${GUIDES}/getting-started-guide.html`]: guide("Getting Started", `${DOCS}/05-guides/01-getting-started.md`),
  [`${ARTIFACTS}/README.md`]: "# Artifacts\n",
});

{
  const root = withAreas();
  const before = filesUnder(root);
  const ran = index([root]);
  ok("[MKT.SCRIPTS.104] the index is written, and the run exits 0", ran.code === 0 && existsSync(join(root, INDEX)), ran.out);
  same("[MKT.SCRIPTS.104] the run writes the index and no other file", filesUnder(root), [...before, INDEX].sort());
  const text = read(root, INDEX);
  const tree = treeOf(text);

  same("[MKT.SCRIPTS.104] a repository with no report has the groups Docs and Guides, and no Reports group",
    tree.groups.map((group) => group.label), ["Docs", "Guides"]);
  const pagesOnDisk = before.filter((path) => path.endsWith(".html") && !path.endsWith(".bundled.html"))
    .map((path) => path.slice(ARTIFACTS.length + 1));
  same("[MKT.SCRIPTS.104] the tree holds every page on disk once, and no bundled copy and no index",
    tree.groups.flatMap(entries).map((node) => node.path).sort(), pagesOnDisk.sort());

  const at = (path) => ({ kind: path.includes("overview") ? "overview" : "construct", path });
  same("[MKT.SCRIPTS.104] Docs: the hub by its name, an area as a folder, a domain with one overview as the link to it, a domain with two as a folder",
    tree.groups[0].children, [
      { label: "Concept", ...at(`${ARTIFACT.overviews}/${HUB}`) },
      { label: "DevEx", children: [
        { label: "Agent", ...at(`${ARTIFACT.overviews}/concept-devex-agent-overview.html`), title: "DevEx Agent", folded: true, children: [
          { label: "Lens", ...at(`${ARTIFACT.constructs}/01-devex/02-agent/01-lens-construct.html`) },
          { label: "Skill", ...at(`${ARTIFACT.constructs}/01-devex/02-agent/02-skill-construct.html`) },
          { label: "Loose & Free", ...at(`${ARTIFACT.constructs}/01-devex/02-agent/03-loose-construct.html`) }] }] },
      { label: "Support", children: [
        { label: "Apps", folded: true, children: [
          { label: "Support Apps Kind", ...at(`${ARTIFACT.overviews}/concept-support-apps-kind-overview.html`), children: [
            { label: "Manifest", ...at(`${ARTIFACT.constructs}/02-support/01-apps/02-manifest-construct.html`) }] },
          { label: "Support Apps Delivery", ...at(`${ARTIFACT.overviews}/concept-support-apps-delivery-overview.html`), children: [
            { label: "Release", ...at(`${ARTIFACT.constructs}/02-support/01-apps/03-release-construct.html`) }] },
          { label: "Kind", ...at(`${ARTIFACT.constructs}/02-support/01-apps/01-kind-construct.html`) }] }] }]);
  const agent = tree.groups[0].children[1].children[0], apps = tree.groups[0].children[2].children[0];
  ok("[MKT.SCRIPTS.104] the domain with one overview opens a page, and the domain with two opens none",
    typeof agent.path === "string" && apps.path === undefined, JSON.stringify([agent.path, apps.path]));
  ok("[MKT.SCRIPTS.104] a page with no block is named by its `<title>`, and its kind is read from its file name",
    agent.children[2].label === "Loose & Free" && agent.children[2].kind === "construct", JSON.stringify(agent.children[2]));
  same("[MKT.SCRIPTS.104] Guides stand in the order of the guides they were produced from",
    tree.groups[1].children.map((node) => [node.label, node.kind]), [["Getting Started", "guide"], ["A Later Guide", "guide"]]);
  ok("the run says which construct no overview of its domain links", /SOFT[^\n]*01-kind-construct\.html\n[^\n]*no overview of its domain links/.test(ran.out), ran.out);

  ok("the data keeps the path to the pages empty, and the limit of tabs", tree.base === "" && tree.tabs === 8, JSON.stringify([tree.base, tree.tabs]));
  const lines = linesFor(NEWEST, INDEX_SCRIPT);
  ok("the page links the newest version that was cut, and loads the index's script from it",
    text.includes(lines.stylesheet) && text.includes(lines.script) && !text.includes("/1.0.0/") && !text.includes("/1.2.0/"),
    text.split("\n").filter((line) => line.includes("sds-")).slice(0, 2).join("\n"));
  ok("the page holds no slot, no footer and no note to an author of the template",
    !text.includes("{{") && !text.includes("<footer>") && !text.includes("RESTATES") && text.startsWith('<meta charset="utf-8">'), text.slice(0, 200));
  ok("the side says the workspace and the repository's declared name", text.includes('<div class="sds-index-where">SaaS Plane &nbsp;|&nbsp; Sample</div>'));
  ok("the line shown with scripts off points at the hub", text.includes(`<a href="${ARTIFACT.overviews}/${HUB}">the hub</a>`));
  ok("the page's own block says it is the index, and a line says the page is produced",
    text.includes('"variant":"index"') && text.includes("<!-- Produced by `docs index`"));

  const again = index([root]);
  ok("a second run writes the same bytes", again.code === 0 && read(root, INDEX) === text && again.out.includes("current"), again.out);
  ok("the index itself is not a page of the tree on the second run", !treeOf(read(root, INDEX)).groups.flatMap(entries).some((node) => node.path === ARTIFACT_INDEX));

  // ------------------------------------------------------------------------ --check
  const checked = index([root, "--check"]);
  ok("[MKT.SCRIPTS.105] `--check` on an index that holds every page exits 0", checked.code === 0 && checked.out.includes("current"), checked.out);

  writeFileSync(join(root, CONSTRUCTS, "01-devex/02-agent/04-new-construct.html"), construct("new", "New"));
  rmSync(join(root, CONSTRUCTS, "02-support/01-apps/02-manifest-construct.html"));
  const stale = index([root, "--check"]);
  ok("[MKT.SCRIPTS.105] `--check` exits 1 where the tree and the pages disagree", stale.code === 1, stale.out);
  ok("[MKT.SCRIPTS.105] `--check` lists a page the tree lacks",
    /RULE[^\n]*04-new-construct\.html\n[^\n]*lacks this page/.test(stale.out), stale.out);
  ok("[MKT.SCRIPTS.105] `--check` lists an entry that has no page",
    /the entry `Manifest` has no page: [^\n]*02-manifest-construct\.html is not there/.test(stale.out), stale.out);
  ok("[MKT.SCRIPTS.105] `--check` names no page that the tree and the disk agree on", !/01-lens-construct|03-release-construct/.test(stale.out), stale.out);
  ok("[MKT.SCRIPTS.105] `--check` writes nothing", read(root, INDEX) === text);

  const mended = index([root]);
  const after = treeOf(read(root, INDEX)).groups.flatMap(entries).map((node) => node.path);
  ok("the next run without `--check` brings the index to the pages on disk",
    mended.code === 0 && mended.out.includes("rewrote") && after.some((path) => path.endsWith("04-new-construct.html")) && !after.some((path) => path.endsWith("02-manifest-construct.html")), mended.out);

  // A page's name changed, and no page came or went: the entries agree, so the exit code stays 0.
  const written = read(root, INDEX);
  writeFileSync(join(root, CONSTRUCTS, "01-devex/02-agent/01-lens-construct.html"), construct("lens", "Lens, Named Again"));
  const renamed = index([root, "--check"]);
  ok("`--check` says, without failing, that a name changed since the index was written",
    renamed.code === 0 && /SOFT[^\n]*index\.html\n[^\n]*not what `docs index` writes now/.test(renamed.out) && read(root, INDEX) === written, renamed.out);
}

// ---------------------------------------------------------------------------- no index yet, and no pocket

{
  const root = withAreas();
  const before = filesUnder(root);
  const none = index([root, "--check"]);
  ok("[MKT.SCRIPTS.105] `--check` with no index says so, exits 1 and writes none",
    none.code === 1 && none.out.includes("there is no index here") && JSON.stringify(filesUnder(root)) === JSON.stringify(before), none.out);

  const out = join(BASE, "elsewhere", ARTIFACT_INDEX);
  mkdirSync(dirname(out));
  const away = index([root, "--out", out]);
  const tree = existsSync(out) ? treeOf(readFileSync(out, "utf8")) : { base: null };
  ok("`--out` writes the page elsewhere, keeps the path to the pages in `base`, and writes nothing into the repository",
    away.code === 0 && tree.base === `../spn-sample-${made}/${ARTIFACTS}/` && JSON.stringify(filesUnder(root)) === JSON.stringify(before), `${away.out}\n${tree.base}`);
}

{
  const root = repo({ [`${DOCS}/README.md`]: "# Docs\n" });
  const refused = index([root]);
  ok("a repository with no artifacts pocket is refused, and nothing is written",
    refused.code === 1 && refused.out.includes(`has no ${ARTIFACTS}`) && !existsSync(join(root, ARTIFACTS)), refused.out);
  const usage = index([]);
  ok("with no repository the command prints its usage and exits 2", usage.code === 2 && usage.out.includes("usage: spn-devex docs index"), usage.out);
}

// ---------------------------------------------------------------------------- no areas, and reports

{
  const report = (title) => page({ id: title, variant: "report", title, lenses: ["LEAD"], summary: "s" });
  const root = repo({
    [`${OVERVIEWS}/${HUB}`]: overview("hub", "Concept"),
    [`${OVERVIEWS}/concept-core-overview.html`]: overview("core", "Core", to("02-core/01-runtime-construct.html")),
    // Framework names no folder. It links a construct of one domain, so that domain is its home too.
    [`${OVERVIEWS}/concept-server-overview.html`]: overview("server", "Server", to("04-server/01-boot-construct.html", "04-server/02-entry-construct.html")),
    [`${OVERVIEWS}/concept-framework-overview.html`]: overview("framework", "Framework", to("04-server/02-entry-construct.html")),
    // This one links constructs of two domains, so it has no home and is listed after the hub.
    [`${OVERVIEWS}/concept-sample-overview.html`]: overview("sample", "Sample", to("02-core/01-runtime-construct.html", "04-server/01-boot-construct.html")),
    [`${CONSTRUCTS}/02-core/01-runtime-construct.html`]: construct("runtime", "Runtime"),
    [`${CONSTRUCTS}/04-server/01-boot-construct.html`]: construct("boot", "Service Boot"),
    [`${CONSTRUCTS}/04-server/02-entry-construct.html`]: construct("entry", "Entry"),
    [`${CONSTRUCTS}/09-no-overview/01-alone-construct.html`]: construct("alone", "Alone"),
    [`${REPORTS}/tests-report.html`]: report("Tests report"),
    [`${REPORTS}/audit-report.html`]: report("Audit report"),
    [`${ARTIFACTS}/loose/odd-page.html`]: bare("Odd"),
  });
  const ran = index([root]);
  const tree = ran.code === 0 ? treeOf(read(root, INDEX)) : { groups: [] };
  same("[MKT.SCRIPTS.104] a repository with reports and no guide page has the groups Docs and Reports",
    tree.groups.map((group) => group.label), ["Docs", "Reports"]);
  const shape = (node) => (node.children ? { [node.label + (node.path ? " →" : "")]: node.children.map(shape) } : node.label);
  same("[MKT.SCRIPTS.104] with no areas the domains sit under Docs, and each overview is listed by its own name",
    tree.groups[0]?.children.map(shape), [
      "Concept", "Sample",
      { "Core →": ["Runtime"] },
      { "Server": [{ "Server →": ["Service Boot"] }, { "Framework →": ["Entry"] }] },
      { "No overview": ["Alone"] },
      "Odd"]);
  same("[MKT.SCRIPTS.104] the reports stand in the order of their paths", tree.groups[1]?.children.map((node) => node.label), ["Audit report", "Tests report"]);
  ok("[MKT.SCRIPTS.104] no entry of the tree reads Overview", !tree.groups.flatMap(entries).some((node) => node.label === "Overview"));
  ok("the run says which overview has no home, and which page the tree has no place for",
    /concept-sample-overview\.html\n[^\n]*links constructs of 2 folders/.test(ran.out) && /odd-page\.html\n[^\n]*listed last under Docs/.test(ran.out), ran.out);
}

// ---------------------------------------------------------------------------- a template of the form before

{
  const root = withAreas();
  const templates = join(BASE, "templates-before");
  mkdirSync(join(templates, "pages"), { recursive: true });
  writeFileSync(join(templates, "pages", "artifact-index-template.html"), "<title>Index</title>\n<style>.tree{}</style>\n<div class=\"index\"></div>\n");
  const refused = index([root], { SPN_TEMPLATES: templates });
  ok("a template that links no shared stylesheet is refused in the one wording, and no index is written",
    refused.code === 1 && refused.out.includes(OWN_COPY) && !existsSync(join(root, INDEX)), refused.out);

  const none = join(BASE, "styles-none");
  mkdirSync(none);
  const uncut = index([root], { SPN_STYLES: none });
  ok("with no version cut the command stops and writes no index",
    uncut.code === 1 && uncut.out.includes("no version of the shared styles was cut") && !existsSync(join(root, INDEX)), uncut.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
