import { PLUGIN } from "../../../../helpers/harness.mjs";
// `coverage measure` — the coverage report's measurement. It writes nothing, so every case builds a
// repository in a temporary folder and asserts what was measured: each gap against input that
// carries it, beside input that does not.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { SEAT } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "commands", "coverage", "measure.ts");
const kept = [];
process.on("exit", () => { for (const dir of kept) rmSync(dir, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const repo = (files) => {
  const root = mkdtempSync(join(tmpdir(), "coverage-"));
  kept.push(root);
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body, "utf8");
  }
  return root;
};

const APPS = { "sprepo.json": '{"type":"APPS","config":{"mtype":"APPS","stack":"TS"}}' };
const node = (dir, kind) => ({
  [`${dir}/package.json`]: `{"name":"${dir.split("/").pop()}"}`,
  [`${dir}/spkind.json`]: `{"kind":"${kind}","config":{"mtype":"${kind}"}}`,
});
/** A construct seat file and its rows, at `01-core/<name>.md`. */
const construct = (name, ...rows) => ({
  [`docs/${SEAT.constructs}/01-core/${name}.md`]: `# ${name}\n`,
  [`docs/${SEAT.behaviors}/01-core/${name}.md`]: [
    "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(([id, status]) => `| ${id} | a person | acts | a result | POSITIVE | UNIT | ${status} | — |`),
    "",
  ].join("\n"),
});
/** A capability chapter for a construct in one package, its Where table naming the given paths. */
const chapter = (pkg, name, ...paths) => ({
  [`docs/${SEAT.capabilities}/01-core/${pkg}/${name}.md`]: [
    `# ${name} in ${pkg}`, "", "## Where", "",
    "| Part of the construct | Lives in | What it is |",
    "| --- | --- | --- |",
    ...paths.map((path) => `| a part | ${path.split(" ").map((one) => `\`${one}\``).join(", ")} | what it is |`),
    "", "## Follows the pattern", "", "- the pattern", "",
  ].join("\n"),
});
const code = (path) => ({ [path]: "export const value = 1;\n" });

const measure = (root, ...args) => execFileSync("node", [TOOL, ...args, root], { encoding: "utf8" });
const json = (root) => JSON.parse(measure(root, "--json"));
const levelOf = (result, path) => [...result.packages, ...result.apps].find((level) => level.path === path);

console.log("=== coverage measure — the three sides");

{
  const root = repo({
    ...APPS, ...node("packages/store", "MODULE_SERVER"),
    ...code("packages/store/src/app/services/StoreService.ts"),
    ...construct("01-store", ["COR.STORE.01", "SUCCESS"], ["COR.STORE.02", "PLANNED"]),
    ...chapter("store", "01-store", "src/app/services/StoreService.ts"),
    [`docs/${SEAT.behaviors}/README.md`]: [
      "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
      "| COR.REPO.01 | a person | clones it | it builds | POSITIVE | UNIT | SUCCESS | — |", "",
    ].join("\n"),
  });
  const result = json(root);
  const store = levelOf(result, "packages/store");
  ok("[MKT.SCRIPTS.71] a package counts the rows of the constructs its chapters realize, and the constructs",
    store?.written.rows === 2 && store?.written.constructs === 1, JSON.stringify(store?.written));
  ok("[MKT.SCRIPTS.71] a construct whose chapter's Where paths all resolve is built", store?.built.constructs === 1, JSON.stringify(store?.built));
  ok("[MKT.SCRIPTS.71] proved is the tests report's join: a row at SUCCESS at its own tier", store?.proved.rows === 1, JSON.stringify(store?.proved));
  ok("[MKT.SCRIPTS.71] a row under a built construct that is not SUCCESS is built, not proved",
    store?.builtNotProved.count === 1 && store.builtNotProved.ids[0] === "COR.STORE.02", JSON.stringify(store?.builtNotProved));
  ok("a row at the repository's own path counts only at the repository",
    result.repositoryLevel.written.rows === 3 && result.repositoryLevel.proved.rows === 2 && result.repositoryLevel.repositoryRows === 1,
    JSON.stringify(result.repositoryLevel));
  ok("each side names its unit, so rows are never compared with constructs",
    result.units.built === "constructs" && result.units.proved === "behaviour rows" && result.units.builtNotStated === "seats in src/", JSON.stringify(result.units));
  ok("a package and an app are measured apart", result.packages.length === 1 && result.apps.length === 0);
}

{
  const root = repo({
    ...APPS, ...node("packages/store", "MODULE_SERVER"), ...code("packages/store/src/app/services/StoreService.ts"),
    ...construct("01-store", ["COR.STORE.01", "SUCCESS"]),
    [`docs/${SEAT.constructs}/01-core/01-store.md`]: '<!-- spn:doc\n{"id": "store", "variant": "construct"}\n-->\n# Store\n',
    ...Object.fromEntries(Object.entries(chapter("store", "01-keeping", "src/app/services/StoreService.ts"))
      .map(([path, body]) => [path, `<!-- spn:doc\n{"id": "store-cap", "variant": "capability", "realizes": ["store"]}\n-->\n${body}`])),
  });
  const store = levelOf(json(root), "packages/store");
  ok("[MKT.SCRIPTS.71] a chapter binds to its construct by the `realizes` it declares, not by its file name",
    store?.built.constructs === 1 && store?.written.rows === 1, JSON.stringify(store));
}

console.log("=== coverage measure — stated, not built");

{
  const root = repo({
    ...APPS, ...node("packages/store", "MODULE_SERVER"),
    ...code("packages/store/src/app/services/StoreService.ts"),
    ...construct("01-store", ["COR.STORE.01", "SUCCESS"]),
    ...chapter("store", "01-store", "src/app/services/StoreService.ts", "src/app/services/Missing.ts"),
  });
  const result = json(root);
  const store = levelOf(result, "packages/store");
  ok("[MKT.SCRIPTS.66] a Where path that does not exist leaves its construct stated, not built",
    store?.built.constructs === 0 && store?.statedNotBuilt.count === 1 && store.statedNotBuilt.items[0]?.path === "src/app/services/Missing.ts",
    JSON.stringify(store?.statedNotBuilt));
  ok("[MKT.SCRIPTS.66] and the repository counts it too", result.repositoryLevel.statedNotBuilt.count === 1 && result.repositoryLevel.built.constructs === 0);
  ok("a row under a construct that is not built is never counted as built, not proved", store?.builtNotProved.count === 0);
}

{
  const root = repo({ ...APPS, ...node("packages/store", "MODULE_SERVER"), ...code("packages/store/src/app/services/StoreService.ts"),
    ...construct("01-store", ["COR.STORE.01", "PLANNED"]) });
  const item = json(root).repositoryLevel.statedNotBuilt.items[0];
  ok("[MKT.SCRIPTS.66] a construct with rows and no chapter anywhere is stated, not built",
    item?.construct === "01-core/01-store.md" && item.chapter === null, JSON.stringify(item));
}

{
  const root = repo({ ...APPS, ...node("apps/api", "APP_SERVER"), ...code("apps/api/src/index.ts"),
    ...construct("01-store", ["COR.STORE.01", "PLANNED"]), ...chapter("api", "01-store", "apps/api/src/index.ts") });
  const item = levelOf(json(root), "apps/api")?.statedNotBuilt.items[0];
  ok("a path written from the repository root does not resolve, and the finding says which root it is read from",
    item?.path === "apps/api/src/index.ts" && (item.hint ?? "").includes("repository root"), JSON.stringify(item));
}

console.log("=== coverage measure — built, not stated");

{
  const root = repo({
    ...APPS, ...node("packages/store", "MODULE_SERVER"),
    ...code("packages/store/src/app/services/Stated.ts"),
    ...code("packages/store/src/app/services/Unstated.ts"),
    ...code("packages/store/src/app/services/Mirrored.ts"),
    ...code("packages/store/src/app/services/Imported.ts"),
    "packages/store/tests/unit/app/services/Mirrored.spec.ts": "// a case\n",
    "packages/store/tests/unit/other.spec.ts": "import { value } from '../../src/app/services/Imported';\n",
    ...construct("01-store", ["COR.STORE.01", "SUCCESS"]),
    ...chapter("store", "01-store", "src/app/services/Stated.ts"),
  });
  const store = levelOf(json(root), "packages/store");
  const seats = Object.fromEntries((store?.builtNotStated.seats ?? []).map((one) => [one.seat, one.proved]));
  ok("[MKT.SCRIPTS.67] a seat no Where row names is built, not stated",
    "src/app/services/Unstated.ts" in seats && !("src/app/services/Stated.ts" in seats), JSON.stringify(seats));
  ok("[MKT.SCRIPTS.67] of those, a seat with no test is not proved", seats["src/app/services/Unstated.ts"] === false);
  ok("[MKT.SCRIPTS.67] a seat a test mirrors at its own path is marked proved", seats["src/app/services/Mirrored.ts"] === true);
  ok("[MKT.SCRIPTS.67] a seat a test imports by a relative path is marked proved", seats["src/app/services/Imported.ts"] === true);
  ok("the count and the proved count agree with the list", store?.builtNotStated.count === 3 && store?.builtNotStated.proved === 2, JSON.stringify(store?.builtNotStated));
}

{
  const root = repo({
    ...APPS, ...node("packages/client", "CLIENT_API"), ...node("packages/store", "MODULE_SERVER"),
    ...code("packages/client/src/index.ts"), ...code("packages/client/src/generated/sdk.ts"),
    ...code("packages/store/src/index.ts"), ...code("packages/store/src/contract/states/validators/order.ts"),
    ...code("packages/store/src/contract/states/order.ts"),
    ...construct("01-store", ["COR.STORE.01", "SUCCESS"]), ...chapter("client", "01-store", "src/generated/"),
  });
  const result = json(root);
  const client = levelOf(result, "packages/client");
  const store = levelOf(result, "packages/store");
  ok("[MKT.SCRIPTS.72] generated code is never a seat: a client's `src/generated/` and a validators folder are not listed",
    JSON.stringify(client?.builtNotStated.seats.map((one) => one.seat)) === '["src/index.ts"]'
      && !store?.builtNotStated.seats.some((one) => one.seat.includes("validators")), JSON.stringify([client?.builtNotStated, store?.builtNotStated]));
  ok("[MKT.SCRIPTS.72] a package's root barrel is generated, so it is not a seat",
    !store?.builtNotStated.seats.some((one) => one.seat === "src/index.ts") && store?.builtNotStated.seats.some((one) => one.seat === "src/contract/states/order.ts"),
    JSON.stringify(store?.builtNotStated.seats));
  ok("[MKT.SCRIPTS.72] a Where row naming a generated folder declares nothing, and is reported",
    client?.declaresNothing.some((one) => one.path === "src/generated/") && client?.built.constructs === 0, JSON.stringify(client));
}

console.log("=== coverage measure — what a Where row declares");

{
  const root = repo({
    ...APPS, ...node("packages/ds", "SUPPORT_WEB"),
    ...code("packages/ds/src/ui/components/actions/Button.tsx"),
    ...code("packages/ds/src/ui/components/overlays/Dialog.tsx"),
    ...construct("01-store", ["COR.STORE.01", "SUCCESS"]),
    ...chapter("ds", "01-store", "src/ui/components/", "src/"),
  });
  const ds = levelOf(json(root), "packages/ds");
  const nothing = (ds?.declaresNothing ?? []).map((one) => one.path).sort();
  ok("[MKT.SCRIPTS.68] a layer folder in a Where row — `src/` or `src/ui/components/` — declares nothing, and is named",
    JSON.stringify(nothing) === '["src/","src/ui/components/"]', JSON.stringify(ds?.declaresNothing));
  ok("[MKT.SCRIPTS.68] so the seats beneath it stay built, not stated",
    ds?.builtNotStated.seats.map((one) => one.seat).join(",") === "src/ui/components/actions,src/ui/components/overlays", JSON.stringify(ds?.builtNotStated));
  ok("[MKT.SCRIPTS.68] and a chapter whose rows declare nothing is not built",
    ds?.built.constructs === 0 && ds?.statedNotBuilt.items[0]?.reason === "the Where section declares no code", JSON.stringify(ds?.statedNotBuilt));
}

{
  const root = repo({
    ...APPS, ...node("packages/web", "MODULE_WEB"),
    ...code("packages/web/src/entry/ui/pages/home/HomePage.tsx"),
    ...code("packages/web/src/entry/ui/pages/list/ListPage.tsx"),
    ...construct("01-store", ["COR.STORE.01", "SUCCESS"]), ...construct("02-list", ["COR.LIST.01", "SUCCESS"]),
    ...chapter("web", "01-store", "pages/home/"),
    ...chapter("web", "02-list", "src/entry/ui/pages/list/"),
  });
  const web = levelOf(json(root), "packages/web");
  ok("[MKT.SCRIPTS.69] a web module's relative path resolves from `src/entry/ui/`, and states that seat",
    web?.built.constructs === 1 && !web.builtNotStated.seats.some((one) => one.seat === "src/entry/ui/pages/home"), JSON.stringify(web));
  const item = web?.statedNotBuilt.items.find((one) => one.construct === "01-core/02-list.md");
  ok("[MKT.SCRIPTS.69] a web module's path written from the package folder does not resolve, and the finding names its root",
    item?.path === "src/entry/ui/pages/list/" && (item.hint ?? "").includes("src/entry/ui/"), JSON.stringify(web?.statedNotBuilt));
  ok("the whereRoot of a web module is its entry/ui folder", web?.whereRoot === "src/entry/ui", web?.whereRoot);
}

{
  const root = repo({
    ...APPS, ...node("packages/store", "MODULE_SERVER"),
    ...code("packages/store/src/migrations/1738000001000-create.ts"),
    ...code("packages/store/src/migrations/1738000002000-alter.ts"),
    ...construct("01-store", ["COR.STORE.01", "SUCCESS"]), ...chapter("store", "01-store", "src/migrations/"),
    ...node("apps/api", "APP_SERVER"),
    ...code("apps/api/src/modules/order/app/services/OrderService.ts"),
    ...code("apps/api/src/modules/order/contract/states/order.ts"),
    ...code("apps/api/src/modules/user/app/services/UserService.ts"),
    ...construct("02-api", ["COR.API.01", "SUCCESS"]), ...chapter("api", "02-api", "src/modules/order/"),
  });
  const result = json(root);
  const store = levelOf(result, "packages/store");
  const api = levelOf(result, "apps/api");
  ok("[MKT.SCRIPTS.70] a seat folder covers its tree: naming `src/migrations/` states every migration",
    store?.builtNotStated.count === 0 && store?.built.constructs === 1, JSON.stringify(store));
  ok("[MKT.SCRIPTS.70] naming an app's module folder whole declares its whole tree, and only that module's",
    JSON.stringify(api?.builtNotStated.seats.map((one) => one.seat)) === '["src/modules/user/app/services/UserService.ts"]', JSON.stringify(api?.builtNotStated));
  ok("an app module's seats are read by the module's own kind, with the path starting at the app folder",
    api?.built.constructs === 1 && api?.declaresNothing.length === 0, JSON.stringify(api));
}

{
  const root = repo({
    ...APPS, ...node("packages/web", "MODULE_WEB"),
    ...code("packages/web/src/entry/ui/pages/home/HomePage.tsx"),
    ...code("packages/web/src/entry/ui/pages/home/parts/HomeCard.tsx"),
    ...construct("01-store", ["COR.STORE.01", "SUCCESS"]), ...chapter("web", "01-store", "pages/home/HomePage.tsx"),
  });
  const web = levelOf(json(root), "packages/web");
  ok("[MKT.SCRIPTS.70] a row naming a file inside a seat folder states that seat, with its whole tree",
    web?.builtNotStated.count === 0 && web?.built.constructs === 1, JSON.stringify(web?.builtNotStated));
}

{
  const root = repo({
    ...APPS, ...node("packages/store", "MODULE_SERVER"),
    ...code("packages/store/src/cache/interface.ts"), ...code("packages/store/src/cache/Redis.ts"),
    ...code("packages/store/src/migrations/1738000003000-a.ts"), ...code("packages/store/src/migrations/1738000005000-b.ts"),
    ...construct("01-store", ["COR.STORE.01", "SUCCESS"]),
    ...chapter("store", "01-store", "src/cache/interface.ts Redis.ts", "src/migrations/…3000 …5000"),
  });
  const store = levelOf(json(root), "packages/store");
  ok("a bare name in a cell is the sibling of the path before it, and an ellipsis is a wildcard",
    store?.built.constructs === 1 && store?.statedNotBuilt.count === 0, JSON.stringify(store?.statedNotBuilt));
}

console.log("=== coverage measure — the answer as a whole");

{
  const files = { ...APPS, ...node("packages/store", "MODULE_SERVER"), ...code("packages/store/src/app/services/StoreService.ts"),
    ...construct("01-store", ["COR.STORE.01", "SUCCESS"]), ...chapter("store", "01-store", "src/app/services/StoreService.ts") };
  const root = repo(files);
  const first = json(root);
  const second = json(root);
  ok("an unchanged tree measures to the same digest", first.digest === second.digest && first.digest.startsWith("sha256:"), `${first.digest} ${second.digest}`);
  ok("the report path is the pocket's coverage-report.html, not written yet",
    first.report.path === "docs/artifacts/reports/coverage-report.html" && first.report.exists === false, JSON.stringify(first.report));
  ok("the proved side links the tests report it was read from", first.testsReport.path === "docs/artifacts/reports/tests-report.html", JSON.stringify(first.testsReport));
  const plain = measure(root);
  ok("the plain reading prints the per-package table and the totals",
    plain.includes("packages/store") && plain.includes("totals:") && plain.includes("MODULE_SERVER"), plain);
}

{
  const root = repo({ "sprepo.json": '{"type":"FOUNDATION","config":{"mtype":"FOUNDATION"}}' });
  const result = json(root);
  ok("a foundation repository is answered with an absence, not with zeros", result.absence !== null && result.repositoryLevel === null, JSON.stringify(result));
}

console.log(`\n${total - failed} of ${total} passed`);
process.exit(failed ? 1 : 0);
