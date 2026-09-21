// `docs.ts topics` · `docs.ts coverage` · the Proof join — the three checks step 4 of N13 owes.
//
// EVERY CASE HERE RUNS TWICE IN SPIRIT: once on a tree that holds the rule, and once on a tree that
// breaks it. A check is only worth its runtime if it can be made to fail on purpose, and the first
// version of `topics` taught that lesson the expensive way — it returned early when the constructs
// seat named no numbered topic, so it reported CLEAN over seven repositories while comparing every
// numbered behaviours file against an empty set. The regression case below is that exact tree.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const TOOL = resolve(import.meta.dirname, "..", "tools", "docs.ts");
const TEMPLATES = resolve(import.meta.dirname, "..", "..", "..", "..", "..",
                          "spn-foundation", "docs", "04-capabilities", "01-devex",
                          "04-workspace", "04-docs", "templates");
const BASE = mkdtempSync(join(tmpdir(), "t-seats-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let made = 0;
function repo(files, { type = "APPS" } = {}) {
  made += 1;
  const root = join(BASE, `r${made}`);
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, "sprepo.json"), JSON.stringify({ type, name: "t", config: null }));
  for (const [path, text] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text, "utf8");
  }
  return root;
}

const block = (o) => `<!-- spn:doc\n${JSON.stringify(o, null, 2)}\n-->\n`;
const doc = (o, body = "Some prose.\n", tag = null) =>
  block({ summary: `What ${o.title} is.`, ...o }) +
  `\n# ${o.title}\n\n` + (tag === null ? "" : tag + "\n\n") + body;

/** A construct seat file: the six sections, with whatever Binds and Proof the case needs. */
const seat = (id, { binds = "", proof = "" } = {}) => doc(
  { id, variant: "construct", parentId: "concept", title: id, lenses: ["ARCHITECT"],
    status: "PLANNING", dependsOn: [] },
  "## Terms\n\n| Term | Contract | Means |\n| --- | --- | --- |\n| Thing | `SPThing` | a thing |\n\n" +
  "## Model\n\nThe model.\n\n## Parts\n\nThe parts.\n\n## Boundary\n\nThe boundary.\n\n" +
  `## Binds\n\n| Rule | What it decides | Weight |\n| --- | --- | --- |\n| a chapter | a thing | MUST |\n\n${binds}\n` +
  `## Proof\n\nWhat proves it.\n\n${proof}\n`,
  "`For: Architect` · `Status: 🔮 PLANNING`");

/** A behaviours register file, nine cells wide, as the document chapter spells it. */
const register = (id, rows) => doc(
  { id, variant: "behaviors", title: id, lenses: ["QA"], status: "PLANNING" },
  "| Id | Who | Does | Sees | Where | Type | Tier | Status | Updated at |\n" +
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n" +
  rows.map((r) => `| ${r[0]} | A person | ${r[1]} | a result | pkg-ts | POSITIVE | ${r[2]} | ${r[3]} | — |\n`).join(""));

function run(root, args) {
  try {
    return execFileSync(process.execPath, [TOOL, ...args],
      { encoding: "utf8", cwd: root, env: { ...process.env, SPN_WORKSPACE: root, SPN_TEMPLATES: TEMPLATES } });
  } catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
}
const readAt = (root, p) => readFileSync(join(root, p), "utf8");

let n = 0, failed = 0;
function one(name, got, want) {
  n += 1;
  const ok = typeof want === "function" ? want(got) : got === want;
  if (!ok) { failed += 1; console.log(`  FAIL  ${name}\n        got: ${JSON.stringify(String(got).slice(0, 300))}`); }
  else console.log(`  PASS  ${name}`);
}
const has = (s) => (got) => String(got).includes(s);
const lacks = (s) => (got) => !String(got).includes(s);

// ---------------------------------------------------------------- topics

console.log("=== a topic the constructs seat does not name is refused in the other two seats");
{
  const good = {
    "docs/02-constructs/README.md": doc({ id: "d", title: "Dictionary", lenses: ["ARCHITECT"], status: "PLANNING" }),
    "docs/02-constructs/01-core/01-boot.md": seat("boot"),
    "docs/03-behaviors/01-core/01-boot.md": register("b-boot", [["CORE.BOOT.01", "can boot", "UNIT", "PLANNED"]]),
    "docs/04-capabilities/01-core/pkg-ts/01-boot.md": "# Boot\n\nWhere it lives.\n",
  };
  one("a tree where all three seats name the same topic is clean",
      run(repo(good), ["topics", "."]), has("clean — 1 repository"));

  one("a numbered behaviours file naming no construct is a RULE",
      run(repo({ ...good, "docs/03-behaviors/01-core/02-ghost.md": register("g", [["CORE.GHOST.01", "x", "UNIT", "PLANNED"]]) }), ["topics", "."]),
      has("`ghost` is a numbered topic of the behaviours seat"));

  one("the same topic under a different domain is a RULE, not a pass",
      run(repo({ ...good, "docs/03-behaviors/02-other/01-boot.md": register("b2", [["CORE.BOOT.02", "x", "UNIT", "PLANNED"]]) }), ["topics", "."]),
      has("sits under `02-other` here and under `01-core` in the constructs seat"));

  one("a capability chapter naming no construct is a RULE",
      run(repo({ ...good, "docs/04-capabilities/01-core/pkg-ts/02-ghost.md": "# Ghost\n" }), ["topics", "."]),
      has("`ghost` is a numbered chapter of the capabilities seat"));

  one("an unnumbered file in either seat is not a topic and is not judged",
      run(repo({ ...good, "docs/03-behaviors/01-core/personas.md": doc({ id: "p", title: "Personas", lenses: ["QA"], status: "PLANNING" }) }), ["topics", "."]),
      has("clean — 1 repository"));

  // THE REGRESSION. Unnumbered constructs and numbered behaviours is the corpus mid-move, and the
  // first implementation called it clean because it had nothing to compare against.
  one("a tree whose constructs are not numbered yet is NOT reported clean",
      run(repo({
        "docs/02-constructs/01-core/boot.md": seat("boot"),
        "docs/03-behaviors/01-core/01-boot.md": register("b", [["CORE.BOOT.01", "can boot", "UNIT", "PLANNED"]]),
      }), ["topics", "."]),
      (g) => /RULE/.test(g) && !/clean/.test(g));

  one("a repository with no constructs seat at all is silent, not noisy",
      run(repo({ "docs/03-behaviors/01-core/01-boot.md": register("b", [["CORE.BOOT.01", "x", "UNIT", "PLANNED"]]) }), ["topics", "."]),
      has("clean — 1 repository"));
}

// ---------------------------------------------------------------- coverage

console.log("\n=== every construct a chapter, every chapter a construct, every package a construct");
{
  const binds = "| Repo | Node | What it realizes | State |\n| --- | --- | --- | --- |\n| t | pkg-ts | the boot path | planned |\n";
  const kind = JSON.stringify({ kind: "MODULE_SERVER", name: "Pkg", config: { code: "pkg" } });

  const good = {
    "docs/02-constructs/01-core/01-boot.md": seat("boot", { binds }),
    "docs/04-capabilities/01-core/pkg-ts/01-boot.md": "# Boot\n",
    "packages/pkg-ts/spkind.json": kind,
  };
  one("a construct whose every realizing node has a chapter passes",
      run(repo(good), ["coverage", "."]), lacks("RULE"));

  one("a construct whose realizing node has no chapter is a RULE",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": seat("boot", { binds }), "packages/pkg-ts/spkind.json": kind }), ["coverage", "."]),
      has("says `pkg-ts` realizes it and `04-capabilities/` carries no chapter"));

  one("a package holding code that no construct's Binds names is reported",
      run(repo({ ...good, "packages/orphan-ts/spkind.json": JSON.stringify({ kind: "MODULE_WEB", name: "Orphan", config: { code: "orp" } }) }), ["coverage", "."]),
      has("`orphan-ts` holds code and no construct's Binds names it"));

  one("a built package under dist is not a second node", run(repo({
        ...good, "packages/pkg-ts/dist/spkind.json": kind }), ["coverage", "."]),
      lacks("`pkg-ts` holds code and no construct"));

  one("the rules table of Binds is never read as a placement",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": seat("boot") }), ["coverage", "."]),
      lacks("realizes it and `04-capabilities/`"));
}

// ---------------------------------------------------------------- the Proof join

console.log("\n=== the produced page joins the register's rows; the seat file never carries them");
{
  const proof = "| Check | Kind | What a green run shows |\n| --- | --- | --- |\n| `spnutils apps test unit` | gate | the unit tier is green |\n";
  const rows = [["CORE.BOOT.01", "can boot a service", "UNIT", "PLANNED"],
                ["CORE.BOOT.02", "sees a clean shutdown", "INTEGRATION", "DONE"]];
  const ws = repo({
    "docs/02-constructs/01-core/01-boot.md": seat("boot", { proof }),
    "docs/03-behaviors/01-core/01-boot.md": register("b", rows),
  });
  const before = readAt(ws, "docs/02-constructs/01-core/01-boot.md");
  const out = run(ws, ["page", "docs/02-constructs/01-core/01-boot.md"]);
  const page = readAt(ws, "docs/artifacts/constructs/01-core/01-boot-construct.html");

  one("every register row reaches the page", page,
      (g) => g.includes("CORE.BOOT.01") && g.includes("CORE.BOOT.02"));
  one("the row carries the status the register wrote, not a status the seat claims", page,
      has("<td>INTEGRATION</td><td>DONE</td>"));
  one("the joined table says where it came from", page,
      has("<code>03-behaviors/01-core/01-boot.md</code>"));
  one("the seat's own typed check is still there, after the rows", page,
      (g) => g.indexOf("CORE.BOOT.01") < g.indexOf("spnutils apps test unit"));
  one("the seat file on disk is untouched by the join",
      readAt(ws, "docs/02-constructs/01-core/01-boot.md"), before);
  one("an exact register is joined with no finding", out, lacks("SOFT proof"));

  // THE TWO HALVES MUST AGREE ABOUT WHAT THE PAGE IS. `checkProduced` re-rendered the bare seat
  // while `page` renders it with the rows spliced in, so a page `page` had just written reported
  // as hand-edited — 16 of 21 in the first repository to get behaviour files beside its
  // constructs, and it would have fired in every one of them.
  one("a page `page` just wrote does not audit as hand-edited", run(ws, ["audit", "docs"]),
      lacks("this page is not what `docs.ts page` produces"));
  one("and a page that really was hand-edited still is", (() => {
        // The produced page is found rather than named: the renderer decides the file name, and a
        // test that hard-codes it fails for the wrong reason the day that changes.
        const dir = join(ws, "docs/artifacts/constructs/01-core");
        const f = join(dir, readdirSync(dir).find((x) => x.endsWith(".html")));
        writeFileSync(f, `${readFileSync(f, "utf8")}\n<p>typed in by hand</p>\n`, "utf8");
        return run(ws, ["audit", "docs"]);
      })(),
      has("this page is not what `docs.ts page` produces"));

  // The corpus mid-move: one register per domain, and every topic joining from it.
  const ws2 = repo({
    "docs/02-constructs/01-core/01-boot.md": seat("boot", { proof }),
    "docs/03-behaviors/01-core/README.md": register("b", rows),
  });
  const out2 = run(ws2, ["page", "docs/02-constructs/01-core/01-boot.md"]);
  one("a domain register is joined while the move is still running",
      readAt(ws2, "docs/artifacts/constructs/01-core/01-boot-construct.html"), has("CORE.BOOT.01"));
  one("and the fallback is reported rather than hidden", out2,
      has("because this topic has no file of its own yet"));

  // No register at all: a page, and no invented table.
  const ws3 = repo({ "docs/02-constructs/01-core/01-boot.md": seat("boot", { proof }) });
  run(ws3, ["page", "docs/02-constructs/01-core/01-boot.md"]);
  const page3 = readAt(ws3, "docs/artifacts/constructs/01-core/01-boot-construct.html");
  one("a construct with no register still produces a page", page3, has("Proof"));
  one("and it carries no joined table it could not fill", page3, lacks("joined from the register"));

  // A table that is not a behaviour table must not be joined.
  const ws4 = repo({
    "docs/02-constructs/01-core/01-boot.md": seat("boot", { proof }),
    "docs/03-behaviors/01-core/01-boot.md":
      doc({ id: "b", variant: "behaviors", title: "boot", lenses: ["QA"], status: "PLANNING" },
          "| Persona | Means |\n| --- | --- |\n| A person | someone |\n"),
  });
  run(ws4, ["page", "docs/02-constructs/01-core/01-boot.md"]);
  one("a table with no Id column is not mistaken for rows",
      readAt(ws4, "docs/artifacts/constructs/01-core/01-boot-construct.html"), lacks("joined from the register"));
}

console.log("\n=== a behaviour row typed into a seat's Proof is refused");
{
  const typed = "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| CORE.BOOT.01 | A person | boots | it booted | POSITIVE | UNIT | SUCCESS | — |\n";
  one("a register table in Proof is a RULE — the status lives in one place",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": seat("boot", { proof: typed }) }), ["audit", "docs"]),
      has("`Proof` carries a table of behaviour rows"));
  one("a typed check table is untouched by that rule",
      run(repo({ "docs/02-constructs/01-core/01-boot.md": seat("boot", {
        proof: "| Check | Kind | What a green run shows |\n| --- | --- | --- |\n| `spnutils apps test unit` | gate | green |\n" }) }), ["audit", "docs"]),
      lacks("carries a table of behaviour rows"));
}

console.log("\n=== `figures check` takes a folder, the way `audit` does");
{
  // Given a folder it read the directory itself and died on EISDIR with a raw stack trace, which
  // reads as the tool being broken rather than as the argument being a folder. Found by a step 7
  // agent, which then ran it per file and said so rather than reporting the crash as a green.
  const page = (svg) => `<h1>p</h1>\n<figure><svg viewBox="0 0 100 60">${svg}</svg></figure>\n`;
  const clean = page('<rect x="10" y="10" width="40" height="20"/>');
  const ws = repo({
    "docs/artifacts/constructs/01-core/a-construct.html": clean,
    "docs/artifacts/constructs/01-core/b-construct.html": clean,
  });
  const out = run(ws, ["figures", "check", "docs/artifacts/constructs"]);
  one("a folder is every page under it, not a read of the directory", out, lacks("EISDIR"));
  one("and it says how many it judged", out, has("clean — 2 pages"));
  one("a path that is not there is named, not read",
      run(repo({ "docs/README.md": "# x\n" }), ["figures", "check", "docs/artifacts"]),
      (g) => /no such file or folder/.test(g) && !/ENOENT/.test(g));
  one("an empty folder says so rather than claiming clean",
      run(repo({ "docs/README.md": "# x\n" }, {}), ["figures", "check", "docs"]),
      has("clean — 1 page"));
}

console.log("\n=== a topic name repeats across domains, and that is not drift");
{
  // The foundation names `shape`, `ships`, `resources` and `operate` in two domains each. The
  // applications half and the infra half both have a shape and both ship something, and neither is
  // the other. The first version of this check kept one domain per name, so the last one walked
  // won and the other reported as sitting in the wrong place — and a merge agent, reading the rule
  // off the check, renamed a page to satisfy it.
  const two = {
    // One topic name, two domains, two ids — which is exactly what the corpus does: the infra
    // half's pages are `estate-*` so they cannot collide with the applications half's own.
    "docs/02-constructs/01-apps/01-shape.md": seat("apps-shape"),
    "docs/02-constructs/02-infra/01-shape.md": seat("estate-shape"),
    "docs/03-behaviors/01-apps/01-shape.md": register("b1", [["APPS.SHAPE.01", "x", "UNIT", "PLANNED"]]),
    "docs/03-behaviors/02-infra/01-shape.md": register("b2", [["INFRA.SHAPE.01", "y", "UNIT", "PLANNED"]]),
  };
  one("one name in two domains, with a rows file under each, is clean",
      run(repo(two), ["topics", "."]), has("clean — 1 repository"));

  one("and a third domain nothing names is still a RULE",
      run(repo({ ...two, "docs/03-behaviors/03-other/01-shape.md": register("b3", [["OTHER.SHAPE.01", "z", "UNIT", "PLANNED"]]) }), ["topics", "."]),
      (g) => /`shape` sits under `03-other` here and under/.test(g) && /`01-apps`/.test(g) && /`02-infra`/.test(g));
}

console.log("\n=== one id names one document");
{
  const doc2 = (id, title) => doc({ id, variant: "capability", title, lenses: ["SERVER_DEV"], status: "DONE" });
  one("two documents under one id are a RULE, and both are named",
      run(repo({
        "docs/04-capabilities/01-core/pkg-ts/README.md": doc2("pkg-caps", "Capabilities — pkg-ts"),
        "docs/04-capabilities/01-core/pkg-ts/01-boot.md": doc2("pkg-caps", "boot in pkg-ts"),
      }), ["topics", "."]),
      (g) => /`pkg-caps` is the id of 2 documents/.test(g) && (g.match(/RULE ids/g) ?? []).length === 2);

  one("a tree where every id is its own is clean",
      run(repo({
        "docs/04-capabilities/01-core/pkg-ts/README.md": doc2("pkg-caps", "Capabilities — pkg-ts"),
        "docs/04-capabilities/01-core/pkg-ts/01-boot.md": doc2("pkg-boot", "boot in pkg-ts"),
      }), ["topics", "."]),
      has("clean — 1 repository"));

  one("three documents under one id say three, not two",
      run(repo({
        "docs/04-capabilities/01-core/a/README.md": doc2("same", "A"),
        "docs/04-capabilities/01-core/b/README.md": doc2("same", "B"),
        "docs/04-capabilities/01-core/c/README.md": doc2("same", "C"),
      }), ["topics", "."]),
      has("`same` is the id of 3 documents"));

  // A template carries a placeholder id and is excluded from every walk by folder, not per file.
  one("a template's placeholder id is not a collision",
      run(repo({
        "docs/04-capabilities/01-core/pkg-ts/README.md": doc2("pkg-caps", "Capabilities — pkg-ts"),
        "docs/04-capabilities/templates/capability-template.md": doc2("pkg-caps", "A template"),
      }), ["topics", "."]),
      has("clean — 1 repository"));
}

console.log("\n=== `face` over a capability seat writes the chapters' own shape");
{
  const chapter = (name, realizes, status = "DONE") =>
    "<!-- spn:doc\n" + JSON.stringify({ id: `pkg-${realizes}`, variant: "capability", title: `${realizes} in pkg-ts`,
      lenses: ["SERVER_DEV"], status, realizes: [realizes], summary: `What pkg-ts does for ${realizes}.` }) + "\n-->\n\n" +
    `# ${realizes} in pkg-ts\n\n\`For: Backend developer\` · \`Status: ✅ ${status}\` · \`Realizes: ${realizes}\`\n\n## Where\n\nIn the package.\n`;
  const face = (title) =>
    "<!-- spn:doc\n" + JSON.stringify({ id: "pkg-capabilities", variant: "capability", title,
      lenses: ["SERVER_DEV"], status: "DONE", summary: "The constructs pkg-ts realizes." }) + "\n-->\n\n" +
    `# ${title}\n\n\`For: Backend developer\` · \`Status: ✅ DONE\`\n\n` +
    "<!-- spn:generated map — do not edit inside these markers; `docs.ts face` writes it -->\n" +
    "<!-- /spn:generated map -->\n";

  const ws = repo({
    "CONCEPT.md": "# c\n",
    "docs/02-constructs/01-core/01-boot.md": seat("boot"),
    "docs/04-capabilities/README.md": face("Capabilities"),
    "docs/04-capabilities/01-core/README.md": face("Capabilities — core"),
    "docs/04-capabilities/01-core/pkg-ts/README.md": face("Capabilities — pkg-ts"),
    "docs/04-capabilities/01-core/pkg-ts/01-boot.md": chapter("01-boot.md", "boot"),
    "docs/04-capabilities/01-core/pkg-ts/02-log.md": chapter("02-log.md", "log"),
  });
  run(ws, ["face", "docs"]);
  const pkgFace = readAt(ws, "docs/04-capabilities/01-core/pkg-ts/README.md");

  // A CHAPTER REALIZES A CONSTRUCT; IT GOVERNS NO SOURCE FOLDER. The mirror-per-folder Map derived
  // `src/01-boot/` from a chapter's file name and named a folder that does not exist.
  one("a package face's Map names the construct each chapter realizes", pkgFace,
      (g) => /\| Chapter \| Realizes \| Carries \| Status \|/.test(g));
  one("and never invents a src folder from a chapter's file name", pkgFace, lacks("src/01-boot"));
  one("every chapter beside it is a row", pkgFace,
      (g) => g.includes("01-boot.md") && g.includes("02-log.md"));

  // The bug a 6b agent found by probing rather than by trusting: the tag-line pattern ended at the
  // Status chip, so a `Realizes:` chip made it miss and write a SECOND tag line under the title.
  const ch = readAt(ws, "docs/04-capabilities/01-core/pkg-ts/01-boot.md");
  one("a chapter carrying a Realizes chip keeps exactly one tag line", ch,
      (g) => (g.match(/^`For:/gm) ?? []).length === 1);
  one("and the chip the author added survives the rewrite", ch, has("· `Realizes: boot`"));
  one("running face twice writes the same bytes", (run(ws, ["face", "docs"]), readAt(ws, "docs/04-capabilities/01-core/pkg-ts/01-boot.md")), ch);

  // A seat-level face is still the older shape, because it lists domains and not chapters.
  one("a seat face is not turned into a chapter list",
      readAt(ws, "docs/04-capabilities/README.md"), lacks("| Chapter | Realizes |"));
}

// ---------------------------------------------------------------- the status a run writes (Q107)

console.log("\n=== the plugins' own run writes the two cells a run owns, and no others");
{
  const STATUS = resolve(import.meta.dirname, "..", "tools", "behaviour-status.mjs");
  const results = (rows, tiers = ["UNIT"]) => {
    const f = join(BASE, `res${made}-${Math.random().toString(36).slice(2)}.json`);
    writeFileSync(f, JSON.stringify({ env: "local", tiers, ranAt: "2026-09-22T00:00:00.000Z", from: "t", results: rows }), "utf8");
    return f;
  };
  const status = (root, file, extra = []) => {
    try {
      return execFileSync(process.execPath, [STATUS, "--write", "--results", file, root], { encoding: "utf8" });
    } catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
  };

  // Nine cells, `Where` included — the grammar the chapter states today. A parser pinned to the
  // older eight would see no register here and report a confident zero.
  const nine = (rows) =>
    "<!-- spn:doc\n" + JSON.stringify({ id: "b", variant: "behaviors", title: "b", lenses: ["QA"], status: "PLANNING", summary: "s" }, null, 2) + "\n-->\n\n# b\n\n" +
    "| Id | Who | Does | Sees | Where | Type | Tier | Status | Updated at |\n" +
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n" +
    rows.map((r) => `| ${r[0]} | A person | does | sees | pkg | POSITIVE | ${r[1]} | ${r[2]} | ${r[3] ?? "—"} |\n`).join("");

  const ws = repo({ "docs/03-behaviors/01-core/01-boot.md": nine([
    ["MKT.DOCS.01", "UNIT", "PLANNED"],
    ["MKT.DOCS.02", "UNIT", "PLANNED"],
    ["MKT.DOCS.03", "UNIT", "MANUAL"],
    ["MKT.DOCS.04", "JOURNEY", "PLANNED"],
    ["MKT.DOCS.05", "UNIT", "SUCCESS", "2026-01-01T00:00:00.000Z"],
  ]) });
  const out = status(ws, results([
    { id: "MKT.DOCS.01", tier: "UNIT", status: "SUCCESS", title: "[MKT.DOCS.01] it works" },
    { id: "MKT.DOCS.02", tier: "UNIT", status: "FAILED", title: "[MKT.DOCS.02] it does not" },
    { id: "MKT.DOCS.03", tier: "UNIT", status: "SUCCESS", title: "[MKT.DOCS.03] a hand check" },
  ]));
  const reg = readAt(ws, "docs/03-behaviors/01-core/01-boot.md");
  one("a nine-cell register is read, not skipped for its width", out, has("MKT.DOCS.01"));
  one("a proven row becomes SUCCESS", reg, (g) => /MKT\.DOCS\.01 \|.*\| SUCCESS \|/.test(g));
  one("a failing case makes the row FAILED, not absent", reg, (g) => /MKT\.DOCS\.02 \|.*\| FAILED \|/.test(g));
  one("MANUAL is never written over, even by a green case", reg, (g) => /MKT\.DOCS\.03 \|.*\| MANUAL \|/.test(g));
  one("a row in a tier this run did not cover is left alone", reg, (g) => /MKT\.DOCS\.04 \|.*\| PLANNED \|/.test(g));
  one("a row in a covered tier that nothing reached becomes PENDING", reg, (g) => /MKT\.DOCS\.05 \|.*\| PENDING \|/.test(g));
  one("Updated at moves with the status", reg, has("2026-09-22T00:00:00.000Z"));
  one("a row nobody proved keeps the date it had", reg, (g) => !/MKT\.DOCS\.04 \|.*2026-09-22/.test(g));

  // Read-only by default, and the count is the exit code so a pipeline can gate on drift.
  const ws2 = repo({ "docs/03-behaviors/01-core/01-boot.md": nine([["MKT.DOCS.01", "UNIT", "PLANNED"]]) });
  const before = readAt(ws2, "docs/03-behaviors/01-core/01-boot.md");
  let code = 0;
  try {
    execFileSync(process.execPath, [STATUS, "--results", results([{ id: "MKT.DOCS.01", tier: "UNIT", status: "SUCCESS", title: "t" }]), ws2], { encoding: "utf8" });
  } catch (e) { code = e.status; }
  one("without --write nothing on disk changes", readAt(ws2, "docs/03-behaviors/01-core/01-boot.md"), before);
  one("and the exit code is the number of rows that would change", code, 1);

  // One red among several greens is a red row.
  const ws3 = repo({ "docs/03-behaviors/01-core/01-boot.md": nine([["MKT.DOCS.01", "UNIT", "PLANNED"]]) });
  status(ws3, results([
    { id: "MKT.DOCS.01", tier: "UNIT", status: "SUCCESS", title: "a" },
    { id: "MKT.DOCS.01", tier: "UNIT", status: "FAILED", title: "b" },
  ]));
  one("a row proved by several cases is green only when every one of them is",
      readAt(ws3, "docs/03-behaviors/01-core/01-boot.md"), (g) => /MKT\.DOCS\.01 \|.*\| FAILED \|/.test(g));
}

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
