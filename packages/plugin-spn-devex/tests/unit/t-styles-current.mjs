// The shared page styles (`05-artifacts.md` § One stylesheet, served in versions): the built stylesheet
// is what its source builds, and a version that was cut holds the bytes it was cut with. A built file
// that fell behind its source would be served to every page at the next cut, and a version that
// changed would restyle every page that links it.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PLUGIN = join(import.meta.dirname, "..", "..");
const ROOT = join(PLUGIN, "..", "..");
const STYLES = join(PLUGIN, "src", "styles");
const SERVED = join(ROOT, "public", "assets", "docs");
const FILES = ["sds-docs.css", "sds-docs.js", "sds-index.js"];

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

console.log("=== styles current — the built stylesheet equals a fresh build of its source");
let check = { status: 0, output: "" };
try {
  check.output = execFileSync(process.execPath, [join(ROOT, "scripts", "build-styles.mjs"), "--check"], { encoding: "utf8" });
} catch (error) {
  check = { status: error.status ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
}
ok("a fresh build of sds-docs.src.css writes the bytes of sds-docs.css", check.status === 0, check.output.trim());
for (const name of FILES) ok(`src/styles/${name} is there`, existsSync(join(STYLES, name)));

console.log("=== styles versions — a version that was cut never changes");
const versions = JSON.parse(readFileSync(join(STYLES, "versions.json"), "utf8"));
const folders = existsSync(SERVED) ? readdirSync(SERVED).sort() : [];
ok("every folder under public/assets/docs is a version the list holds, and every version has its folder",
  JSON.stringify(folders) === JSON.stringify(Object.keys(versions).sort()),
  `folders: ${folders.join(", ")} · listed: ${Object.keys(versions).join(", ")}`);
for (const [version, files] of Object.entries(versions)) {
  ok(`${version} serves the three files and no other`,
    JSON.stringify(Object.keys(files).sort()) === JSON.stringify(FILES)
      && JSON.stringify(readdirSync(join(SERVED, version)).sort()) === JSON.stringify(FILES));
  for (const [name, hash] of Object.entries(files))
    ok(`${version}/${name} holds the bytes it was cut with`, sha(join(SERVED, version, name)) === hash);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-styles-current` : `\n  all ${total} passed — t-styles-current`);
process.exit(failed ? 1 : 0);
