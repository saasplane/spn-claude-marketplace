import { PLUGIN } from "../../../../helpers/harness.mjs";
// `docs look` — a whole page rendered in light and in dark. The path where no browser is found, the
// refusals, and that the command is listed in the entry's help. The rendering itself needs a browser,
// so it is proven by running it on a real page, not here.
import { chmodSync, mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-look-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

function run(args, env = process.env) {
  try { return { out: execFileSync(process.execPath, [TOOL, ...args], { encoding: "utf8", cwd: BASE, stdio: "pipe", env }), code: 0 }; }
  catch (e) { return { out: String(e.stdout ?? "") + String(e.stderr ?? ""), code: e.status ?? 1 }; }
}
let n = 0, failed = 0;
function one(label, ok, detail = "") {
  n += 1;
  if (!ok) { failed += 1; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`); }
  else console.log(`  PASS  ${label}`);
}

console.log("\n=== `docs look` is listed, refuses what it cannot read, and says `not checked` where no browser is found");
const page = join(BASE, "page.html");
writeFileSync(page, "<!doctype html><title>t</title><p>hello</p>");

const help = run(["help"]);
one("the entry's help lists `docs look`", help.code === 0 && /docs look/.test(help.out), help.out.slice(0, 200));
one("and the listing carries its usage words", JSON.parse(run(["help", "--json"]).out).some?.((c) => c.command?.includes("docs look")) ?? /docs look/.test(run(["help", "--json"]).out));

const none = run(["docs", "look"]);
one("with no page it is refused with exit 2", none.code === 2 && /docs look/.test(none.out), none.out);
const missing = run(["docs", "look", join(BASE, "absent.html")]);
one("a page that is not there is refused with exit 2", missing.code === 2 && /nothing is there/.test(missing.out), missing.out);
const flag = run(["docs", "look", page, "--json"]);
one("an option it does not take is refused with exit 2", flag.code === 2 && /does not take `--json`/.test(flag.out), flag.out);

// A FAKE `npm` THAT NAMES A FOLDER HOLDING NO PLAYWRIGHT, so the search for a global install finds none.
const bin = join(BASE, "bin");
mkdirSync(bin);
writeFileSync(join(bin, "npm"), `#!/bin/sh\necho "${join(BASE, "no-global-modules")}"\n`);
chmodSync(join(bin, "npm"), 0o755);
const out = join(BASE, "pictures");
const bare = run(["docs", "look", page, "--out", out], { ...process.env, PATH: `${bin}:${process.env.PATH}`, SPN_TELEMETRY: "off" });
one("with no browser it prints `not checked` and the line that installs one", /^not checked/.test(bare.out) && bare.out.includes("npx playwright install chromium"), bare.out);
one("and exits 0", bare.code === 0);
one("and writes no picture", !existsSync(out));
console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
