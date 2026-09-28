import { PLUGIN } from "../../../../helpers/harness.mjs";
// `docs figure` — proves the ONE thing nothing else covers: that `args[0]` correctly routes between
// the two halves this action combines. `figure check|colour` is extensively proven already, against
// the old `tools/docs.ts figures check|colour` argv shape, in `tests/unit/scripts/t-seats.mjs` — a
// file this workstream slice does not own, and which keeps exercising this exact moved logic through
// the forwarder `tools/docs.ts` -> `cli.ts` -> this file. No suite anywhere proved the DISPATCH
// itself — that `check`/`colour` in `args[0]` pick the geometry half and anything else falls through
// to the browser render — so that is what these three cases are for.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-figure-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

function run(args, cwd = BASE) {
  try { return { out: execFileSync(process.execPath, [TOOL, "docs", "figure", ...args], { encoding: "utf8", cwd }), code: 0 }; }
  catch (e) { return { out: String(e.stdout ?? "") + String(e.stderr ?? ""), code: e.status ?? 1 }; }
}

let n = 0, failed = 0;
function one(label, ok) {
  n += 1;
  if (!ok) { failed += 1; console.log(`  FAIL  ${label}`); }
  else console.log(`  PASS  ${label}`);
}

console.log("\n=== `figure`'s args[0] picks the geometry half or falls through to the render half");

// `check` reads a page's own geometry — no browser involved, so this is the same on every machine.
{
  const page = `<h1>p</h1>\n<figure><svg viewBox="0 0 100 60"><rect x="10" y="10" width="40" height="20"/></svg></figure>\n`;
  const dir = join(BASE, "check");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "a.html"), page);
  const { out, code } = run(["check", dir]);
  one("`figure check` runs the geometry check, not the render — it reports pages, not a render's PNG line",
    out.includes("clean — 1 page") && !out.includes("->"));
  one("and it exits clean", code === 0);
}

// `colour` is the geometry check's other half — also no browser.
{
  const dir = join(BASE, "colour");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "a.html"), `<pre data-lang="ts">const a = 1;</pre>\n`);
  const { out, code } = run(["colour", dir]);
  one("`figure colour` runs the colour audit, not the render",
    out.includes("every coloured block matches its own text") || out.includes("block") && out.includes("off"));
  one("and it exits with the audit's own code, not a usage error", code === 0 || code === 1);
}

// Anything else in `args[0]` is a file to render, never a geometry subcommand. The browser is
// optional on the machine running this suite, so both shapes the render half can honestly print are
// accepted — what is under test is that this path is NOT the geometry check's output shape.
{
  const svg = join(BASE, "plain.svg");
  writeFileSync(svg, `<svg viewBox="0 0 100 60"><rect x="10" y="10" width="40" height="20"/></svg>`);
  const { out, code } = run([svg]);
  one("a bare path is rendered, not geometry-checked — it never reports `clean — N page(s)`",
    !/clean — \d+ page/.test(out));
  one("it either found no browser and said so, or rendered and reported per file",
    out.includes("No browser on this machine") || out.includes("plain.svg"));
  one("and it exits clean either way — the render half reports, it never refuses", code === 0);
}

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
