// The artifacts pocket in two halves (RULE.DEVEX.WORKSPACE.221, 555, 556): `public/` holds docs, guides and surface, `private/` holds reports.
// Read through the layout functions, the page writer's links, the index builder and the docs check. A repository that still holds the earlier
// layout keeps it, and nothing here moves a page.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PLUGIN, TEMPLATES_DIR } from "../../../../helpers/harness.mjs";
import { INDEX_SCRIPT, linesFor } from "../../../../../../plugin-support-lib/src/lib/page-styles.ts";

const LIB = resolve(PLUGIN, "..", "plugin-support-lib", "src", "lib", "docs-tree.ts");
const tree = await import(pathToFileURL(LIB).href);
const render = await import(pathToFileURL(resolve(PLUGIN, "src", "scripts", "lib", "render.ts")).href);
const docCheck = await import(pathToFileURL(resolve(PLUGIN, "src", "scripts", "checks", "doc-check.ts")).href);
const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-public-private-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 700)}` : ""}`);
};
const put = (root, path, text = "x") => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), text, "utf8"); };
let made = 0;
const repo = (files = {}) => {
  made += 1;
  const root = join(BASE, `spn-sample-${made}`);
  for (const [path, text] of Object.entries({ "sprepo.json": '{"type":"APPS","name":"Sample","config":null}', ...files })) put(root, path, text);
  return root;
};

console.log("=== which layout a pocket has");
const none = repo({ "docs/README.md": "# Docs\n" });
ok("[MKT.SCRIPTS.635] a repository with no pocket writes the split layout", tree.artifactsLayout(join(none, "docs")) === "split");
const faceOnly = repo({ "docs/artifacts/README.md": "# Pocket\n" });
ok("[MKT.SCRIPTS.635] a pocket holding only its face is split too", tree.artifactsLayout(join(faceOnly, "docs")) === "split");
const today = repo({ "docs/artifacts/docs/concept-overview.md": "x" });
ok("[MKT.SCRIPTS.635] a pocket that holds docs directly keeps the earlier layout", tree.artifactsLayout(join(today, "docs")) === "today");
const split = repo({ "docs/artifacts/public/docs/a.md": "x" });
ok("[MKT.SCRIPTS.635] a pocket that holds public is split", tree.artifactsLayout(join(split, "docs")) === "split");
const dir = (root, f) => tree.slashes(f(join(root, "docs"))).slice(tree.slashes(root).length + 1);
ok("[MKT.SCRIPTS.635] split: docs and guides sit in public, reports in private, and each half has an index",
  dir(none, tree.artifactDocsDir) === "docs/artifacts/public/docs" && dir(none, tree.guidePagesDir) === "docs/artifacts/public/guides" && dir(none, tree.reportsDir) === "docs/artifacts/private/reports"
  && dir(none, tree.artifactIndex) === "docs/artifacts/public/index.html" && dir(none, tree.privateIndex) === "docs/artifacts/private/index.html" && dir(none, tree.surfacePagesDir) === "docs/artifacts/public/surface");
ok("[MKT.SCRIPTS.635] earlier layout: the same functions answer where the pages are today",
  dir(today, tree.artifactDocsDir) === "docs/artifacts/docs" && dir(today, tree.reportsDir) === "docs/artifacts/reports" && dir(today, tree.artifactIndex) === "docs/artifacts/index.html");

console.log("\n=== a page's place, read from its path in either layout");
ok("[MKT.SCRIPTS.635] visibilityOf names the half, and null for the earlier layout", tree.visibilityOf("/r/docs/artifacts/public/docs/a.html") === "public" && tree.visibilityOf("/r/docs/artifacts/private/reports/a.html") === "private" && tree.visibilityOf("/r/docs/artifacts/docs/a.html") === null);
ok("[MKT.SCRIPTS.635] artifactFolderOf reads the folder below the half", tree.artifactFolderOf("/r/docs/artifacts/public/guides/g-guide.html") === "guides" && tree.artifactFolderOf("/r/docs/artifacts/guides/g-guide.html") === "guides" && tree.artifactFolderOf("/r/docs/artifacts/public/index.html") === null);
const seat = join(none, "docs/02-constructs/01-core/thing.md");
const produced = tree.producedPageOf(seat);
ok("[MKT.SCRIPTS.635] a seat file's page sits in public/docs, and the page finds its seat again", produced.endsWith("docs/artifacts/public/docs/01-core/constructs/thing-construct.html") && tree.seatOf(produced) === tree.slashes(seat) && tree.isProducedPage(produced));
const earlier = tree.producedPageOf(join(today, "docs/02-constructs/01-core/thing.md"));
ok("[MKT.SCRIPTS.635] in the earlier layout it stays where it was written", earlier.endsWith("docs/artifacts/docs/01-core/constructs/thing-construct.html") && tree.seatOf(earlier).endsWith("docs/02-constructs/01-core/thing.md"));
const misplaced = tree.pagePlaceOf("/r/docs/artifacts/public/docs/stray-construct.html");
ok("[MKT.SCRIPTS.635] a page out of its place is told its place under public", typeof misplaced === "string" && misplaced.includes("docs/artifacts/public/docs/"), misplaced);

console.log("\n=== public links only inside public, or out of the repository (RULE.DEVEX.WORKSPACE.555)");
const publicPage = "/r/docs/artifacts/public/docs/a-overview.html";
const found = (path, links) => docCheck.publicLinkFindings(path, links.map((href) => `<a href="${href}">x</a>`).join(""));
ok("[MKT.HOOKS.531] red: a public page that links a seat file is refused, with what to link instead", found(publicPage, ["../../../../04-capabilities/x.md"]).some(([sev, m]) => sev === "RULE" && m.includes("github.com") && m.includes("555")));
ok("[MKT.HOOKS.531] red: a public page that links into private is refused", found(publicPage, ["../../private/reports/audit-report.html"]).some(([, m]) => m.includes("links into private/")));
ok("[MKT.HOOKS.531] green: a link inside public, an address out of the repository and a fragment are silent", found(publicPage, ["./b-overview.html", "../guides/g-guide.html#top", "https://github.com/o/r/blob/HEAD/docs/x.md", "#top", "mailto:a@b.c"]).length === 0);
ok("[MKT.HOOKS.531] green: a private page may link into public (RULE.DEVEX.WORKSPACE.556)", found("/r/docs/artifacts/private/reports/audit-report.html", ["../../public/docs/a-overview.html", "../../../x.md"]).length === 0);
ok("[MKT.HOOKS.531] green: a page of the earlier layout is not held to the rule", found("/r/docs/artifacts/docs/a-overview.html", ["../../x.md"]).length === 0);
ok("[MKT.HOOKS.531] the finding is part of the docs check on a public page", docCheck.check(publicPage, `<!doctype html>${linesFor("1.0.0").stylesheet}<div class="sds-page"><div class="sds-wrap"><div class="sds-masthead"></div><a href="../x.md">y</a></div></div>`).some(([, m]) => m.includes("seat file")));

console.log("\n=== a seat link becomes the built page's link, or the file's address on github.com");
const origin = repo({ "docs/04-capabilities/x.md": "# x\n", "docs/02-constructs/01-core/thing.md": "# t\n" });
execFileSync("git", ["init", "-q"], { cwd: origin });
execFileSync("git", ["remote", "add", "origin", "git@github.com:acme/spn-sample.git"], { cwd: origin });
const address = render.githubAddress(join(origin, "docs/04-capabilities/x.md"));
ok("[MKT.SCRIPTS.635] the address is read from the git remote", address === "https://github.com/acme/spn-sample/blob/HEAD/docs/04-capabilities/x.md", address);
ok("[MKT.SCRIPTS.635] a file in no repository, or a repository with no remote, has none", render.githubAddress(join(none, "docs/README.md")) === null);
const seatFile = join(origin, "docs/02-constructs/01-core/thing.md");
const inPublic = render.hrefForPage(seatFile, join(origin, "docs/artifacts/public/docs/01-core/constructs/thing-construct.html"));
ok("[MKT.SCRIPTS.635] on a public page, a seat link out of the construct seat is the github address and the anchor is kept", inPublic("../../04-capabilities/x.md#a") === "https://github.com/acme/spn-sample/blob/HEAD/docs/04-capabilities/x.md#a", inPublic("../../04-capabilities/x.md#a"));
ok("[MKT.SCRIPTS.635] a construct seat link is the built page's link", inPublic("./thing.md") === "./thing-construct.html", inPublic("./thing.md"));
const inEarlier = render.hrefForPage(seatFile, join(origin, "docs/artifacts/docs/01-core/constructs/thing-construct.html"));
ok("[MKT.SCRIPTS.635] a page of the earlier layout keeps its relative link", inEarlier("../../04-capabilities/x.md").endsWith("04-capabilities/x.md") && !inEarlier("../../04-capabilities/x.md").startsWith("https:"));

console.log("\n=== docs index writes the two index pages");
const STYLES = join(BASE, "styles");
mkdirSync(STYLES);
writeFileSync(join(STYLES, "versions.json"), JSON.stringify({ "1.0.0": {} }));
writeFileSync(join(STYLES, "integrity.json"), JSON.stringify({ "1.0.0": { "sds-docs.css": "sha384-c", "sds-docs.js": "sha384-j", "sds-index.js": "sha384-i" } }));
const env = { ...process.env, SPN_TELEMETRY: "off", SPN_WORKSPACE: BASE, SPN_STYLES: STYLES, SPN_TEMPLATES: TEMPLATES_DIR };
const index = (...args) => {
  try { return { code: 0, out: execFileSync(process.execPath, [TOOL, "docs", "index", ...args], { encoding: "utf8", env, stdio: "pipe" }) }; }
  catch (error) { return { code: error.status ?? 1, out: String(error.stdout ?? "") + String(error.stderr ?? "") }; }
};
const page = (block) => `<meta charset="utf-8">\n<title>${block.title}</title>\n<!-- spn:doc\n${JSON.stringify(block)}\n-->\n${linesFor("1.0.0").stylesheet}\n<div class="sds-page"></div>\n`;
const both = repo({
  "docs/artifacts/public/docs/concept-overview.html": page({ id: "hub", variant: "overview", title: "Hub" }),
  "docs/artifacts/public/guides/start-guide.html": page({ id: "g", variant: "guide", title: "Start" }),
  "docs/artifacts/public/surface/site/index.html": page({ id: "s", variant: "index", title: "Site samples" }),
  "docs/artifacts/public/surface/site/home.html": page({ id: "h", variant: "surface-page", title: "Home" }),
  "docs/artifacts/private/reports/audit-report.html": page({ id: "r", variant: "report", title: "Audit" }),
});
const written = index("write", both);
ok("[MKT.SCRIPTS.636] write exits 0 and writes one index in each half", written.code === 0 && existsSync(join(both, "docs/artifacts/public/index.html")) && existsSync(join(both, "docs/artifacts/private/index.html")), written.out);
ok("[MKT.SCRIPTS.636] no index is written in the pocket itself", !existsSync(join(both, "docs/artifacts/index.html")));
const data = (file) => JSON.parse(/id="index-data">([\s\S]*?)<\/script>/.exec(readFileSync(join(both, file), "utf8"))[1]);
const labels = (file) => data(file).groups.map((g) => g.label);
ok("[MKT.SCRIPTS.636] the public index lists Docs, Guides and Surface, and the private one only Reports", labels("docs/artifacts/public/index.html").join() === "Docs,Guides,Surface" && labels("docs/artifacts/private/index.html").join() === "Reports", `${labels("docs/artifacts/public/index.html")} | ${labels("docs/artifacts/private/index.html")}`);
const publicPaths = JSON.stringify(data("docs/artifacts/public/index.html"));
ok("[MKT.SCRIPTS.636] the public index never names a report, and lists a samples home and not the samples behind it", !publicPaths.includes("audit-report") && publicPaths.includes("surface/site/index.html") && !publicPaths.includes("home.html"), publicPaths);
const checked = index("check", both);
ok("[MKT.SCRIPTS.636] check is clean on what was written", checked.code === 0, checked.out);
const earlierRepo = repo({ "docs/artifacts/docs/concept-overview.html": page({ id: "hub", variant: "overview", title: "Hub" }) });
const stay = index("write", earlierRepo);
ok("[MKT.SCRIPTS.636] a pocket in the earlier layout keeps its one index in the pocket, with a one-line note", stay.code === 0 && existsSync(join(earlierRepo, "docs/artifacts/index.html")) && !existsSync(join(earlierRepo, "docs/artifacts/public")) && stay.out.includes("earlier layout"), stay.out);

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-public-private` : `\n  all ${total} passed — t-public-private`);
process.exit(failed ? 1 : 0);
