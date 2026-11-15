// `lib/passes.ts` — the passes each world's plugin declares, read from the real refs through `refRoots` with the checkout as the place:
// APPS TS from the apps plugin's restate, INFRA from the infra plugin, FOUNDATION and GENERAL from the devex plugin, and the design
// track from the surface plugin. A world with no ref returns no passes and a reason.
const { passTableOf, passFindingOf, designTrackOf } = await import("../../../../src/scripts/lib/passes.ts");

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

// The plugins' refs are read from this repository itself, wherever it is cloned: the place is the folder that holds the
// repository (refRoots joins `spn-claude-marketplace/packages/...` under it), and no installed copy is read.
const { dirname, resolve } = await import("node:path");
const { fileURLToPath } = await import("node:url");
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const places = { installed: null, checkout: dirname(repoRoot) };
const idsOf = (passes) => passes.map((pass) => pass.id);

console.log("=== the APPS TS passes, in the preview's order");
{
  const ts = passTableOf("APPS", "TS", places);
  same("[MKT.SCRIPTS.579] passTableOf(APPS, TS) returns the twelve passes 0-11 in the preview's order", idsOf(ts),
    ["baseline", "book", "pins", "universal", "server", "client", "web", "server-tests", "web-tests", "commit", "full", "release"]);
  same("[MKT.SCRIPTS.579] each pass holds the kinds the book names", ts.map((pass) => pass.kinds), [
    [], ["book"], ["pins"], ["TOOLCHAIN", "SUPPORT_UNIVERSAL"], ["SUPPORT_SERVER", "MODULE_SERVER", "APP_SERVER", "APP_UTILITY"], ["CLIENT_API"],
    ["SUPPORT_WEB", "MODULE_WEB", "APP_WEB"], ["server tests"], ["web tests"], [], [], ["generated"],
  ]);
  same("[MKT.SCRIPTS.579] and its Proof", ts.map((pass) => pass.proof), [
    "its own run", "the docs checks the hooks demand", "`pnpm install --frozen-lockfile`", "type-check", "type-check of every server project touched",
    "client type-check; the document came from the worktree", "type-check of every web project touched", "type-check", "type-check, then each new case's red first",
    "none", "the run", "the release's own gate",
  ]);
  same("[MKT.SCRIPTS.579] each follows the pass before it", ts.map((pass) => pass.after), [
    [], ["baseline"], ["book"], ["pins"], ["universal"], ["server"], ["client"], ["web"], ["server-tests"], ["web-tests"], ["commit"], ["full"],
  ]);
  same("[MKT.SCRIPTS.579] the pins pass waits on the upstream release, the client runs with the worktree's service and the full run with a clean reset",
    [ts[2].waitsOn, ts[5].runsWith, ts[10].runsWith], ["the upstream release it reads", "the worktree's own service", "a clean reset"]);
}

console.log("\n=== the INFRA passes");
{
  const infra = passTableOf("INFRA", null, places);
  same("[MKT.SCRIPTS.580] passTableOf(INFRA) returns book, pins, support, module, organization, platform, tests, commit, validate-and-tiers and release, each after the one before",
    idsOf(infra).slice(0, 10), ["book", "pins", "support", "module", "organization", "platform", "tests", "commit", "validate-and-tiers", "release"]);
  same("[MKT.SCRIPTS.580] the node passes hold SUPPORT, MODULE, ORGANIZATION and PLATFORM in turn", infra.slice(2, 6).map((pass) => pass.kinds), [["SUPPORT"], ["MODULE"], ["ORGANIZATION"], ["PLATFORM"]]);
  same("[MKT.SCRIPTS.580] the cloud apply is the last row, after the release, and waits on the developer's approval, so no part of the plan holds it",
    infra.slice(10).map((pass) => [pass.id, pass.after, pass.proof, pass.waitsOn]), [["cloud-apply", ["release"], "never planned without approval", "the developer's approval"]]);
}

console.log("\n=== the design track");
{
  const track = designTrackOf(places);
  const draw = track.find((pass) => pass.id === "draw");
  const publish = track.find((pass) => pass.id === "publish");
  same("[MKT.SCRIPTS.581] designTrackOf returns draw after the book, running with the code passes", [draw?.after, draw?.runsWith], [["book"], "the code passes"]);
  same("[MKT.SCRIPTS.581] and publish after draw, running with the release and waiting on the repository's full run", [publish?.after, publish?.runsWith, publish?.waitsOn], [["draw"], "the release", "the repository's full run"]);
  same("[MKT.SCRIPTS.581] the track's condition row is read too, headed `Runs only when`", track.filter((pass) => pass.title === "Runs only when").length, 1);
}

console.log("\n=== FOUNDATION and GENERAL, one table with a World column");
{
  same("[MKT.SCRIPTS.582] FOUNDATION returns book, docs-check and release", idsOf(passTableOf("FOUNDATION", null, places)), ["book", "docs-check", "release"]);
  same("[MKT.SCRIPTS.582] GENERAL returns restates, source, tests, commit, full, release and install", idsOf(passTableOf("GENERAL", null, places)),
    ["restates", "source", "tests", "commit", "full", "release", "install"]);
  same("[MKT.SCRIPTS.582] the two worlds' `release` rows are told apart by World: FOUNDATION's release follows docs-check, GENERAL's follows the full run",
    [passTableOf("FOUNDATION", null, places).at(-1).after, passTableOf("GENERAL", null, places).find((pass) => pass.id === "release").after], [["docs-check"], ["full"]]);
  same("[MKT.SCRIPTS.582] a world with no ref returns no passes and the reason", [passTableOf("SURFACE", null, places), passFindingOf("SURFACE", null, places), passFindingOf("FOUNDATION", null, places)],
    [[], "no plugin declares passes for the world SURFACE", null]);
  same("[MKT.SCRIPTS.582] an APPS repository with no stack, or a stack no plugin carries, returns none and says why",
    [passTableOf("APPS", null, places), passFindingOf("APPS", null, places), passTableOf("APPS", "Rust", places), passFindingOf("APPS", "Rust", places)],
    [[], "an APPS repository declares no stack", [], "no plugin carries support/apps/providers/rust/03-structure.md for APPS (Rust)"]);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — passes` : `\n  all ${total} passed — passes`);
process.exit(failed ? 1 : 0);
