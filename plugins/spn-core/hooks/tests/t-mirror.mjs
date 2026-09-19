// `mirror` — the nudge that names the document governing an edited `src/` folder.
//
// THIS ONE HAS NO PYTHON BEHIND IT. Every other suite here is a port, so its test is parity with the
// incumbent. This check is new, so the fixtures are the whole proof and they carry the cases the
// corpus cannot: two rows that could both claim a folder (no Map overlaps today), and a second edit
// in a folder already named.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const HOOKS = resolve(import.meta.dirname, "..");

const BASE = mkdtempSync(join(tmpdir(), "t-mirror-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let made = 0;
function tree(files) {
  made += 1;
  const root = join(BASE, `w${made}`);
  for (const [path, text] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text, "utf8");
  }
  mkdirSync(join(root, ".spndevex"), { recursive: true });
  return root;
}

const face = (rows) =>
  "# Capabilities\n\nprose about the seat.\n\n## Map\n\n" +
  "| File | Governs | Carries | Status |\n| --- | --- | --- | --- |\n" +
  rows.map(([file, governs, status]) =>
    `| [${file}](${file}) | ${governs === null ? "&mdash;" : "[\`" + governs + "\`](../../" + governs + ")"} | what it carries | ${status} |`).join("\n") +
  "\n\n## Something else\n\n| File | Governs |\n| --- | --- |\n| [not-a-mirror.md](not-a-mirror.md) | [`src/app/`](../../src/app) |\n";

const FACE = "pkg/docs/03-capabilities/README.md";

function said(root, path, session) {
  const payload = JSON.stringify({
    tool_name: "Edit", cwd: root, session_id: session,
    tool_input: { file_path: join(root, path), new_string: "x" },
  });
  const out = execFileSync(process.execPath, [`${HOOKS}/checks/mirror.ts`],
    { input: payload, encoding: "utf8", cwd: root }).trim();
  if (!out) return "";
  try { return JSON.parse(out).systemMessage ?? ""; } catch { return out; }
}

let n = 0, failed = 0;
function one(label, got, { expect, says }) {
  n += 1;
  const spoke = Boolean(got);
  const saysOk = !says || got.includes(says);
  const ok = spoke === (expect === "names it") && saysOk;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect} · got ${spoke ? "names it" : "silent"}${says ? ` · names "${says}" ${saysOk}` : ""}`);
  if (!ok) console.log(`        said: ${got.slice(0, 220)}`);
}

console.log("=== mirror — it names the document");

{
  const root = tree({ [FACE]: face([["app.md", "src/app/", "✅"]]), "pkg/src/app/Service.ts": "x\n" });
  one("an edit under a governed folder",
    said(root, "pkg/src/app/Service.ts", "s1"),
    { expect: "names it", says: "app.md" });
}

{
  // NO MAP IN THIS CORPUS OVERLAPS YET, so this case exists only here. The depth rule allows both,
  // and naming the shallower one sends the reader to a page that does not carry the seam.
  const root = tree({
    [FACE]: face([["app.md", "src/app/", "✅"], ["session.md", "src/app/services/session/", "🚧"]]),
    "pkg/src/app/services/session/Store.ts": "x\n",
  });
  one("two rows could claim it — the deeper one wins",
    said(root, "pkg/src/app/services/session/Store.ts", "s1"),
    { expect: "names it", says: "session.md" });
}

{
  const root = tree({
    [FACE]: face([["app.md", "src/app/", "✅"], ["session.md", "src/app/services/session/", "🚧"]]),
    "pkg/src/app/Other.ts": "x\n",
  });
  one("a sibling outside the deeper folder still gets the shallow mirror",
    said(root, "pkg/src/app/Other.ts", "s1"),
    { expect: "names it", says: "app.md" });
}

{
  const root = tree({ [FACE]: face([["app.md", "src/app/", "🚧"]]), "pkg/src/app/A.ts": "x\n" });
  one("the row's status is carried, so a mirror known to be incomplete says so",
    said(root, "pkg/src/app/A.ts", "s1"),
    { expect: "names it", says: "🚧" });
}

console.log("\n=== mirror — once per mirror per session");

{
  const root = tree({
    [FACE]: face([["app.md", "src/app/", "✅"], ["entry.md", "src/entry/", "✅"]]),
    "pkg/src/app/A.ts": "x\n", "pkg/src/app/B.ts": "x\n", "pkg/src/entry/C.ts": "x\n",
  });
  one("the first edit in a folder names it", said(root, "pkg/src/app/A.ts", "same"),
    { expect: "names it", says: "app.md" });
  one("a second edit under the same mirror is silent", said(root, "pkg/src/app/B.ts", "same"),
    { expect: "silent" });
  one("an edit under a DIFFERENT mirror still speaks", said(root, "pkg/src/entry/C.ts", "same"),
    { expect: "names it", says: "entry.md" });
  one("the same folder in another session speaks again", said(root, "pkg/src/app/A.ts", "other"),
    { expect: "names it", says: "app.md" });
}

console.log("\n=== mirror — silent");

{
  const root = tree({ "pkg/src/app/A.ts": "x\n" });
  one("a node with no capabilities seat yet", said(root, "pkg/src/app/A.ts", "s1"), { expect: "silent" });
}

{
  const root = tree({ [FACE]: face([["app.md", "src/app/", "✅"]]), "pkg/src/migrations/001.ts": "x\n" });
  one("a folder the Map carries no row for — invariant 4's, and the audit owns it",
    said(root, "pkg/src/migrations/001.ts", "s1"), { expect: "silent" });
}

{
  const root = tree({
    [FACE]: face([["data-model.md", null, "✅"]]), "pkg/src/app/A.ts": "x\n",
  });
  one("a row whose Governs cell is a dash claims nothing",
    said(root, "pkg/src/app/A.ts", "s1"), { expect: "silent" });
}

{
  const root = tree({ [FACE]: face([["app.md", "src/app/", "✅"]]), "pkg/docs/03-capabilities/app.md": "x\n" });
  one("an edit to the mirror itself, which is not under src/",
    said(root, "pkg/docs/03-capabilities/app.md", "s1"), { expect: "silent" });
}

{
  const root = tree({
    [FACE]: face([["app.md", "src/app/", "✅"]]),
    "pkg/node_modules/thing/src/app/A.ts": "x\n",
  });
  one("a vendored tree carrying its own src/",
    said(root, "pkg/node_modules/thing/src/app/A.ts", "s1"), { expect: "silent" });
}

{
  // The `## Map` heading bounds the table. A second table further down the face is not the Map, and
  // reading it would name a document that governs nothing.
  const root = tree({ [FACE]: face([["entry.md", "src/entry/", "✅"]]), "pkg/src/app/A.ts": "x\n" });
  one("a table after the Map is not the Map",
    said(root, "pkg/src/app/A.ts", "s1"), { expect: "silent" });
}

console.log(failed ? `\n  ${failed} of ${n} FAILED — mirror` : `\n  all ${n} passed — mirror`);
process.exit(failed ? 1 : 0);
