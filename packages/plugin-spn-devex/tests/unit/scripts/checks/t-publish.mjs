// `publish` — the check on a publish (05-artifacts.md § Nothing is published unless the developer
// asks · § What a stored page carries, and what a published one carries).
//
// It reminds on every publish, because it cannot know whether the developer asked. It refuses one
// thing, which it reads from the file: a page that loads a stylesheet or a script from outside. Each
// case writes a real page into a temporary folder, because the check reads the file the call names.
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { linesFor } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";

const { PUBLISHER, SCRIPT_HOSTS, STYLESHEET_HOSTS, bundledName, checkPublish, loadedFromOutside, publishes } =
  await import("../../../../src/scripts/checks/publish.ts");

const TMP = realpathSync(mkdtempSync(join(tmpdir(), "publish-probe-")));
process.on("exit", () => rmSync(TMP, { recursive: true, force: true }));

let n = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  n += 1;
  if (!condition) failed += 1;
  console.log(`  ${condition ? "PASS" : "FAIL"}  ${label}${condition || !detail ? "" : `\n        ${String(detail).slice(0, 700)}`}`);
};

const STYLES = linesFor("1.0.0");
const BODY = `<header class="sds-masthead"><h1>A page</h1></header>\n<section id="s1"><p>You read it once.</p></section>`;
const put = (name, text) => {
  const path = join(TMP, name);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text);
  return path;
};
const publish = (path, extra = {}) => checkPublish({ tool_name: PUBLISHER, cwd: TMP, tool_input: { file_path: path, ...extra } });

console.log("\n=== publish — which calls publish a page");
ok("the publishing tool with no action publishes", publishes({ tool_name: PUBLISHER, tool_input: { file_path: "a.html" } }));
ok("an asset upload to a page already published does not", !publishes({ tool_name: PUBLISHER, tool_input: { file_path: "a.png", asset: true } }));
ok("a read does not, and neither does another tool",
  !publishes({ tool_name: PUBLISHER, tool_input: { action: "read" } }) && !publishes({ tool_name: "Write", tool_input: { file_path: "a.html" } }));
ok("a call that publishes nothing gets no verdict", checkPublish({ tool_name: PUBLISHER, tool_input: { action: "list" } }) === null);

console.log("\n=== publish — a page that loads its styles from outside is refused");
{
  // KNOWN-BAD: a stored page, with the two lines that load its version from the shared address.
  const stored = put("docs/artifacts/reports/tests-report.html", `<!doctype html>\n${STYLES.stylesheet}\n${BODY}\n${STYLES.script}\n`);
  const verdict = publish(stored);
  ok("[MKT.HOOKS.46] known-bad: a publish of a page that links the shared address is refused", Boolean(verdict?.deny), JSON.stringify(verdict));
  ok("[MKT.HOOKS.46] the refusal names the command that bundles the page",
    verdict?.deny?.includes(`\`spn-devex docs sds bundle ${stored}\``), verdict?.deny);
  ok("[MKT.HOOKS.46] and the copy to publish instead, beside the page",
    verdict?.deny?.includes(`\`${join(TMP, "docs/artifacts/reports", "tests-report.bundled.html")}\``), verdict?.deny);
  ok("[MKT.HOOKS.46] it names each address the page loads from outside, the stylesheet's and the script's",
    verdict?.deny?.includes("/1.0.0/sds-docs.css`") && verdict?.deny?.includes("/1.0.0/sds-docs.js`"), verdict?.deny);
  ok("[MKT.HOOKS.46] the reminder about the developer's ask is still given beside the refusal",
    verdict?.note?.includes("RD.DEVEX.WORKSPACE.117") && verdict?.note?.includes(stored), verdict?.note);
  ok("the copy's name is the page's name with `.bundled` before its ending", bundledName("/x/approach.html") === "approach.bundled.html");

  // The same page named by a path from the call's own folder is read from that folder.
  ok("[MKT.HOOKS.46] a path given from the call's folder is read from there",
    Boolean(publish("docs/artifacts/reports/tests-report.html")?.deny));

  // A sample links its styles from a folder beside it, which the publishing host does not hold either.
  const sample = put("samples/approach-example.html", `<link rel="stylesheet" href="../assets/sds-docs.css">\n${BODY}\n<script src="../assets/sds-docs.js"></script>\n`);
  ok("[MKT.HOOKS.46] a page that links a folder beside it is refused too, because the host holds no such folder",
    Boolean(publish(sample)?.deny) && publish(sample).deny.includes("`../assets/sds-docs.css`"), publish(sample)?.deny);
}

console.log("\n=== publish — a page a published page may be is reminded, and never refused");
{
  // UNTOUCHED: the bundled copy carries its styles and its script inside it.
  const bundled = put("docs/artifacts/reports/tests-report.bundled.html", `<!doctype html>\n<style>.sds-masthead{margin:0}</style>\n${BODY}\n<script>document.documentElement.classList.add("sds-has-script");</script>\n`);
  const verdict = publish(bundled);
  ok("[MKT.HOOKS.46] untouched: a page with its styles and script inside it is not refused", verdict !== null && !verdict.deny, JSON.stringify(verdict));
  ok("it is still reminded that nothing is published unless the developer asks", verdict?.note?.includes("unless the developer asks"), verdict?.note);

  const allowed = put("allowed.html",
    `<link rel="preconnect" href="https://fonts.gstatic.com">\n<link rel="stylesheet" href="${STYLESHEET_HOSTS[0]}css2?family=Inter">\n${BODY}\n` +
    `<script src="${SCRIPT_HOSTS[0]}ajax/libs/d3/7.9.0/d3.min.js"></script>\n<script src="${SCRIPT_HOSTS[1]}chart.js"></script>\n<a href="https://example.org/a">a link is not a load</a>\n`);
  ok("[MKT.HOOKS.46] a stylesheet from Google Fonts, and a script from either allowed host, are not refused", !publish(allowed)?.deny, publish(allowed)?.deny);

  const otherHost = put("other-host.html", `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/some.css">\n${BODY}\n<script src="https://example.org/a.js"></script>\n`);
  ok("[MKT.HOOKS.46] a stylesheet from a script's host, and a script from any other host, are refused",
    loadedFromOutside(`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/some.css">`).length === 1 && publish(otherHost)?.deny?.includes("`https://example.org/a.js`"),
    publish(otherHost)?.deny);

  const commented = put("commented.html", `<!-- a stored page carries ${STYLES.stylesheet} and ${STYLES.script} -->\n<style>p{margin:0}</style>\n${BODY}\n`);
  ok("a line inside a comment loads nothing, so it refuses nothing", !publish(commented)?.deny, publish(commented)?.deny);

  // A page and the files the same call publishes beside it: the page may name those files.
  const withFiles = put("multi/index.html", `<link rel="stylesheet" href="styles.css">\n${BODY}\n<script src="./app.js"></script>\n`);
  ok("a file the same call publishes beside the page may be loaded, given as a map or as a list",
    !publish(withFiles, { files: { "styles.css": "multi/styles.css", "app.js": "multi/app.js" } })?.deny &&
    !publish(withFiles, { files: [{ path: "styles.css" }, { path: "app.js" }] })?.deny);
  ok("and the same page is refused where the call publishes no such file", publish(withFiles)?.deny?.includes("`styles.css`"), publish(withFiles)?.deny);

  ok("[MKT.HOOKS.46] a file that cannot be read is reminded and not refused",
    publish(join(TMP, "no-such-page.html")) !== null && !publish(join(TMP, "no-such-page.html")).deny && Boolean(publish(join(TMP, "no-such-page.html")).note));
  ok("a publish that names no file is reminded", Boolean(checkPublish({ tool_name: PUBLISHER, tool_input: { type_url: "https://claude.ai/x", title: "A deck" } })?.note));
}

console.log(failed ? `\n  ${failed} FAILED — publish` : `\n  all ${n} passed — publish`);
process.exit(failed ? 1 : 0);
