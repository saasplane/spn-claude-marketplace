import { PLUGIN, skipped } from "../../../../helpers/harness.mjs";
// `browser probe` — a page read as values. The browser cases run against a local fixture page and are
// skipped, with a message, where no global Playwright is installed. The refusals need no browser.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const FIXTURE = pathToFileURL(resolve(PLUGIN, "tests", "fixtures", "browser", "probe-page.html")).href;

function run(args) {
  try { return { out: execFileSync(process.execPath, [TOOL, "browser", "probe", ...args], { encoding: "utf8", stdio: "pipe", env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 }; }
  catch (e) { return { out: String(e.stdout ?? "") + String(e.stderr ?? ""), code: e.status ?? 1 }; }
}
let n = 0, failed = 0;
function one(label, ok, detail = "") {
  n += 1;
  if (!ok) { failed += 1; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`); }
  else console.log(`  PASS  ${label}`);
}

console.log("\n=== `browser probe` is listed and refuses what it cannot read");
one("the entry's help lists `browser probe`", /browser probe/.test(run([]).out + execFileSync(process.execPath, [TOOL, "help"], { encoding: "utf8" })));
const bare = run([]);
one("with no url it is refused with exit 2", bare.code === 2, bare.out);
const noSelect = run([FIXTURE]);
one("with neither `--select` nor `--aria` it is refused with exit 2", noSelect.code === 2 && /--select/.test(noSelect.out), noSelect.out);
const badFlag = run([FIXTURE, "--select", "p", "--shot"]);
one("an option it does not take is refused with exit 2", badFlag.code === 2 && /does not take `--shot`/.test(badFlag.out), badFlag.out);
const badMode = run([FIXTURE, "--select", "p", "--mode", "sepia"]);
one("a mode outside light and dark is refused with exit 2", badMode.code === 2, badMode.out);

let hasBrowser = false;
try {
  const root = execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim();
  hasBrowser = existsSync(join(root, "playwright", "index.mjs"));
} catch { hasBrowser = false; }

if (!hasBrowser) {
  skipped(20, "no global Playwright on this machine (npm install -g playwright && npx playwright install chromium)");
} else {
  console.log("\n=== `browser probe` reads the fixture page as values");
  const read = (extra) => {
    const result = run([FIXTURE, "--wait", "0", ...extra]);
    let json = null;
    try { json = JSON.parse(result.out); } catch { /* reported by the case */ }
    return { ...result, json };
  };

  const props = read(["--select", ".card", "--props", "background-color,font-size"]);
  one("props: the computed value of each named property, the later sheet's colour winning", props.code === 0
    && props.json.matches[0].props["background-color"] === "rgb(0, 0, 255)" && !!props.json.matches[0].props["font-size"], props.out.slice(0, 400));
  one("and the match carries its text and a box", props.json.matches[0].text === "Quarterly numbers" && props.json.matches[0].box.width > 0);
  one("and the document shape: url, width 1440, mode null", props.json.url === FIXTURE && props.json.width === 1440 && props.json.mode === null);

  const defaults = read(["--select", ".card"]);
  one("with no `--props`, the six defaults are read", ["background-color", "color", "font-size", "font-weight", "width", "height"]
    .every((name) => name in defaults.json.matches[0].props));

  const up = read(["--select", ".card", "--ancestors", "data-mode"]);
  const chain = up.json.matches[0].ancestors;
  one("ancestors: nearest first, only those carrying the attribute", chain.length === 3
    && chain[0].slot === "inner" && chain[0].attrs["data-mode"] === "dark"
    && chain[1].slot === "outer" && chain[1].attrs["data-mode"] === "light" && chain[2].tag === "html", JSON.stringify(chain));

  const light = read(["--select", ".card", "--props", "background-color", "--mode", "light"]);
  one("mode: `--mode` sets data-mode on the root and is reported", light.json.mode === "light");

  const rules = read(["--select", ".card", "--rules", "background-color"]);
  const found = rules.json.matches[0].rules["background-color"];
  one("rules: both sheets are named", found.some((r) => r.sheet === "/src/first.css") && found.some((r) => r.sheet === "/src/second.css"), JSON.stringify(found));
  one("and the winning rule is first (the dark-mode one, more specific)", found[0].sheet === "/src/first.css" && found[0].value === "rgb(0, 0, 255)", JSON.stringify(found));
  one("and of two rules equally specific, the later sheet comes before the earlier", found.findIndex((r) => r.sheet === "/src/second.css") < found.findIndex((r) => r.selector === ".card" && r.sheet === "/src/first.css"), JSON.stringify(found));

  const layered = read(["--select", ".card", "--rules", "color"]).json.matches[0].rules.color;
  one("rules: an unlayered rule comes before a layered one, though the layered one is later", layered[0]?.sheet === "/src/first.css"
    && layered[0]?.value === "rgb(0, 0, 0)" && layered.some((r) => r.sheet === "/src/third.css"), JSON.stringify(layered));

  const filled = read(["--select", ".fill", "--rules", "background-color", "--props", "background-color"]).json.matches[0];
  one("rules: a value set through a shorthand with var() is found through the shorthand, and named", filled.rules["background-color"].length === 1
    && filled.rules["background-color"][0].selector === ".fill" && filled.rules["background-color"][0].shorthand === "background"
    && filled.rules["background-color"][0].value === "var(--fill)" && filled.props["background-color"] === "rgb(10, 20, 30)", JSON.stringify(filled));

  const custom = read(["--select", ".fill", "--rules=--fill-tone"]).json.matches[0].rules["--fill-tone"];
  one("rules: a custom property has no shorthand, so `--fill` is not reported for `--fill-tone`", custom.length === 0, JSON.stringify(custom));

  const nested = read(["--select", ".fill", "--rules", "outline-color"]).json.matches[0].rules["outline-color"];
  one("rules: a nested rule is matched with its parent's selector, so another parent's nested rule is not listed", nested.length === 1
    && nested[0].selector.includes(":is(.tint)") && nested[0].value === "rgb(9, 9, 9)", JSON.stringify(nested));

  const aria = read(["--select", ".card", "--aria"]);
  one("aria: a match carries its accessibility snapshot, with the aria-label", String(aria.json.matches[0].aria).includes("region \"Quarterly card\""), JSON.stringify(aria.json.matches[0].aria));
  const ariaPage = read(["--aria", "--select", ".none"]);
  one("aria with a selector matching nothing still exits 0", ariaPage.code === 0);

  const none = read(["--select", ".absent"]);
  one("a selector with no match is reported, not an error", none.code === 0 && none.json.matches.length === 1
    && none.json.matches[0].select === ".absent" && none.json.matches[0].index === null && none.json.matches[0].box === null, none.out);

  const phone = read(["--select", ".wide", "--props", "width", "--width", "390"]);
  one("width: `--width 390` narrows the viewport, so a max-width:100% element is no wider than it", phone.json.width === 390
    && parseFloat(phone.json.matches[0].props.width) <= 390 + 1, JSON.stringify(phone.json?.matches?.[0]?.props));
  const desktop = read(["--select", ".wide", "--props", "width"]);
  one("and at the default 1440 the same element is 1000px", desktop.json.matches[0].props.width === "1000px");

  const gone = run(["http://127.0.0.1:1/", "--select", "p", "--wait", "0"]);
  const { createServer } = await import("node:http");
  const server = createServer((_, res) => { res.statusCode = 502; res.end("Bad Gateway"); });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const bad = await new Promise((done) => {
    import("node:child_process").then(({ execFile }) => execFile(process.execPath, [TOOL, "browser", "probe", `http://127.0.0.1:${server.address().port}/`, "--select", "p", "--wait", "0"],
      { encoding: "utf8", env: { ...process.env, SPN_TELEMETRY: "off" } }, (error, out, err) => done({ code: error?.code ?? 0, out: out + err })));
  });
  server.close();
  one("a server answering 502 is a page that did not load: exit 1, one sentence", bad.code === 1 && /answered 502/.test(bad.out) && bad.out.trim().split("\n").length === 1, bad.out);
  one("a page that does not load exits 1 with one sentence", gone.code === 1 && gone.out.trim().split("\n").length === 1 && /did not load/.test(gone.out), gone.out);
}
console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
