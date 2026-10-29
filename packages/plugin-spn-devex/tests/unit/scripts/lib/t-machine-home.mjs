// `lib/machine-home.ts` — how a plugin script finds its folder under `~/.saasplane/`.
//
// Every case runs in a child process whose `HOME` is a scratch folder, so no real home is read or written.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const LIB = resolve(PLUGIN, "src", "scripts", "lib", "machine-home.ts");
const LOOK = resolve(PLUGIN, "src", "scripts", "commands", "docs", "look.ts");
const CORPUS = resolve(PLUGIN, "src", "scripts", "checks", "corpus.ts");
const CACHE = resolve(PLUGIN, "src", "scripts", "lib", "corpus-cache.ts");

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

const base = mkdtempSync(join(tmpdir(), "spn-home-"));
const homeOf = (name, make) => {
  const home = join(base, name);
  mkdirSync(home, { recursive: true });
  if (make) mkdirSync(join(home, ".saasplane"), { recursive: true });
  return home;
};
/** Evaluate a module expression in a child whose HOME is `home`; the override is never set. */
const ask = (home, imports, expr) => {
  const env = { ...process.env, HOME: home, SPN_TELEMETRY: "off" };
  delete env.SPN_CORPUS_CACHE_FOR_TESTS;
  const code = `${imports}\nconsole.log(JSON.stringify(${expr}));`;
  return JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", code], { env, encoding: "utf8" }).trim().split("\n").pop());
};
const LINE = "spn-devex: no ~/.saasplane/ on this machine — run `spnutils workspace init` to make it";
const lib = `import * as m from ${JSON.stringify(LIB)};`;

console.log("\n=== machine-home — the home, the rooms, the missing line");

{
  const bare = homeOf("bare", false);
  same("a missing home gives the line that names `spnutils workspace init`", ask(bare, lib, "m.missingHomeLine()"), LINE);
  same("a missing home is not found", ask(bare, lib, "m.homeExists()"), false);
  same("a room under a missing home is not found", ask(bare, lib, "m.findRoom('state','browser','chrome')"), null);
  same("looking makes nothing", existsSync(join(bare, ".saasplane")), false);
  const made = homeOf("made", true);
  same("a home that is there gives no line", ask(made, lib, "m.missingHomeLine()"), null);
  same("a room spnutils did not make is not found", ask(made, lib, "m.findRoom('state','browser','chrome')"), null);
  mkdirSync(join(made, ".saasplane", "state", "browser", "chrome"), { recursive: true });
  same("a room spnutils made is found at its place", ask(made, lib, "m.findRoom('state','browser','chrome')"), join(made, ".saasplane", "state", "browser", "chrome"));
}

console.log("\n=== docs look — the profile through the module");
{
  const made = homeOf("look", true);
  same("the profile is at `state/browser/chrome`", ask(made, `import * as l from ${JSON.stringify(LOOK)};`, "l.PROFILE"),
    join(made, ".saasplane", "state", "browser", "chrome"));
  same("the missing-profile line names `infra organization up --apply`",
    ask(made, lib, "m.MISSING_PROFILE_LINE").includes("`spnutils infra organization up --apply` stands it up"), true);
}

console.log("\n=== the corpus cache — its room, and the stop hook");
{
  const bare = homeOf("cache-bare", false);
  same("with no home the store reports the missing-home line", ask(bare, `import * as c from ${JSON.stringify(CACHE)};`, "c.storeMissingLine()"), LINE);
  const corpus = `import * as k from ${JSON.stringify(CORPUS)};`;
  same("with no home the Stop hook's check says nothing", ask(bare, corpus, "k.checkCorpus(process.env.HOME, new Set(['repo-a']))"), []);
  same("with no home the Stop hook's check makes nothing", existsSync(join(bare, ".saasplane")), false);
  const made = homeOf("cache-made", true);
  same("inside a home the store is its own room", ask(made, `import * as c from ${JSON.stringify(CACHE)};`, "c.storeDir()"),
    join(made, ".saasplane", "cache", "plugins", "spn-devex", "corpus"));
  same("inside a home the store reports no line", ask(made, `import * as c from ${JSON.stringify(CACHE)};`, "c.storeMissingLine()"), null);
  const out = execFileSync(process.execPath, [CORPUS, made], { env: { ...process.env, HOME: made, SPN_TELEMETRY: "off", SPN_CORPUS_CACHE_FOR_TESTS: "" }, encoding: "utf8" });
  same("inside a home the command runs", out.includes("corpus clean"), true);
  const bareRun = (() => {
    try { execFileSync(process.execPath, [CORPUS, bare], { env: { ...process.env, HOME: bare, SPN_CORPUS_CACHE_FOR_TESTS: "" }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); return "exit 0"; }
    catch (e) { return String(e.stdout).trim(); }
  })();
  same("with no home the command prints the one line and stops", bareRun, LINE);
  same("and the command made no home", readdirSync(bare), []);
}

rmSync(base, { recursive: true, force: true });
console.log(failed ? `  ${failed} FAILED` : `  all ${total} passed`);
process.exit(failed ? 1 : 0);
