// `check page` — a page spec refused where it departs from the design language: each refusal as it prints, and its fixed input passing.
//
// THIS SUITE OWNS THE COMMAND'S SEVEN REFUSALS. Each case writes a spec and its drawing into a folder, with an app that carries a
// one-icon lucide set, runs the command, and reads what it prints and its exit code.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const CLI = join(resolve(import.meta.dirname, "..", "..", "..", "..", "..", "src"), "scripts", "cli.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const ZAP = "M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002z";
const root = mkdtempSync(join(tmpdir(), "check-page-"));
const icons = join(root, "app", "node_modules", "lucide-react", "dist", "esm", "icons");
mkdirSync(icons, { recursive: true });
writeFileSync(join(root, "app", "package.json"), "{}\n");
writeFileSync(join(root, "app", "node_modules", "lucide-react", "package.json"), JSON.stringify({ name: "lucide-react", version: "1.52.0", main: "index.js" }));
writeFileSync(join(root, "app", "node_modules", "lucide-react", "index.js"), "");
writeFileSync(join(icons, "zap.mjs"), `const __iconData = {\n  name: "zap",\n  node: [\n    [\n      "path",\n      { d: "${ZAP}", key: "1" }\n    ]\n  ]\n};\nexport { __iconData };\n`);

const svg = (body) => `<svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">\n${body}\n</svg>\n`;
const section = (props, ...children) => ({ unit: "DSSectionContainer", props: { size: "LG", color: "BASE", ...props }, children });
const hero = (props) => ({ unit: "DSFeature", props: { pageLevel: "PAGE", type: "SPLIT_END", title: "One foundation", mediaNode: { media: "plane.svg" }, ...props } });

let n = 0;
/** Runs the command on a spec and its drawings, and gives what it printed and its exit code. */
function check(spec, files = { "plane.svg": svg('<rect x="1" y="1" width="9" height="9" fill="currentColor"/>') }, ...more) {
  const dir = join(root, `case-${n += 1}`);
  mkdirSync(dir);
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  writeFileSync(join(dir, "spec.json"), JSON.stringify({ kind: "spec", sections: [spec] }));
  try {
    return { out: execFileSync("node", [CLI, "check", "page", join(dir, "spec.json"), "--app", join(root, "app"), ...more], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 };
  } catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 }; }
}
const refused = (label, run, line) => ok(label, run.code === 1 && run.out.trim() === line, `exit ${run.code}: ${run.out.trim()}`);
const passes = (label, run) => ok(label, run.code === 0 && run.out.startsWith("OK spec.json:"), `exit ${run.code}: ${run.out.trim()}`);

console.log("=== check page — a raw colour in a drawing");
refused("[MKT.SCRIPTS.599] a hex colour in a drawing is refused with its line", check(section({}, hero()), { "plane.svg": svg('<rect x="1" y="1" width="9" height="9" fill="#084A75"/>') }),
  "REFUSED raw-colour plane.svg:2: #084A75 written in the drawing; use a theme token, as var(--...) or currentColor");
passes("[MKT.SCRIPTS.599] a drawing in tokens and currentColor passes", check(section({}, hero()), { "plane.svg": svg('<rect x="1" y="1" width="9" height="9" style="fill:var(--card)" stroke="currentColor"/>') }));

console.log("\n=== check page — a class on a design-system unit");
refused("[MKT.SCRIPTS.599] a className on a unit is refused", check(section({}, hero({ className: "bg-blue-900" }))),
  'REFUSED class-on-unit /sections[0]/children[0] DSFeature: className="bg-blue-900" on a design-system unit; the unit takes its look from its props and the theme, never a class');
passes("[MKT.SCRIPTS.599] the same unit without the class passes", check(section({}, hero())));

console.log("\n=== check page — an icon outside the app's set");
refused("[MKT.SCRIPTS.600] an icon name the app's set does not hold is refused", check(section({}, { unit: "DSIconBadge", props: { icon: "lightning-bolt" } })),
  'REFUSED icon-outside-set /sections[0]/children[0] DSIconBadge: icon "lightning-bolt" is not in lucide-react 1.52.0, the set this app carries');
passes("[MKT.SCRIPTS.600] an icon the set holds passes", check(section({}, { unit: "DSIconBadge", props: { icon: "zap" } })));
refused("[MKT.SCRIPTS.600] a drawing offered as an icon with other paths is refused", check(section({}, { unit: "DSIconBadge", props: { icon: { media: "bolt.svg", icon: "zap" } } }), { "bolt.svg": svg('<path d="M1 1h9" stroke="currentColor"/>') }),
  "REFUSED icon-outside-set bolt.svg: its paths are not lucide-react 1.52.0's \"zap\"; the app's set is the only icon source");

console.log("\n=== check page — a hero form its media does not call for");
refused("[MKT.SCRIPTS.601] a scene in a split hero is refused", check(section({}, hero({ mediaNode: { media: "plane.svg", kind: "scene" } }), ), undefined),
  "REFUSED hero-form /sections[0]/children[0] DSFeature: a scene calls for type BACKDROP, the hero says SPLIT_END");
passes("[MKT.SCRIPTS.601] a scene in a backdrop hero passes", check(section({}, hero({ type: "BACKDROP", mediaNode: { media: "plane.svg", kind: "scene" } }))));

console.log("\n=== check page — two emphases in one section");
refused("[MKT.SCRIPTS.602] a primary band and a highlight in one section are refused", check(section({ color: "PRIMARY" }, { unit: "DSFeature", props: { pageLevel: "SECTION", highlight: true } })),
  "REFUSED RULE.SUPPORT.SURFACE.438 /sections[0] DSSectionContainer: 2 emphases in one section (DSSectionContainer emphasis band + DSFeature highlight); a section takes one");
passes("[MKT.SCRIPTS.602] one emphasis in the section passes", check(section({ color: "PRIMARY" }, { unit: "DSFeature", props: { pageLevel: "SECTION" } })));

console.log("\n=== check page — media on the wrong level");
refused("[MKT.SCRIPTS.601] a hero scene on a feature that is no hero is refused", check(section({}, { unit: "DSFeature", props: { pageLevel: "SECTION", mediaNode: { media: "plane.svg", kind: "scene" } } })),
  "REFUSED media-level /sections[0]/children[0] DSFeature: the scene plane.svg is on a feature's media; a hero scene goes through the section's media, edge to edge");
refused("[MKT.SCRIPTS.603] a sheet on a section's media is refused", check(section({ mediaNode: { media: "plane.svg", kind: "sheet" } })),
  "REFUSED media-level /sections[0] DSSectionContainer: the sheet plane.svg is on a section's media; a close-up or a sheet goes through the feature's media");
passes("[MKT.SCRIPTS.603] a sheet on the feature's media passes", check(section({}, { unit: "DSFeature", props: { pageLevel: "SECTION", mediaNode: { media: "plane.svg", kind: "sheet" } } })));

console.log("\n=== check page — a drawing narrower than its section's content");
const under = (width) => section({}, { unit: "DSFeature", props: { pageLevel: "SECTION", mediaNode: { media: "plane.svg", kind: "sheet", placement: "under", width } } });
refused("[MKT.SCRIPTS.604] a drawing 480 wide under the words in a 1120 section is refused", check(under(480), undefined, "--content", "1120"),
  "REFUSED under-placed plane.svg: drawn 480 wide under the words, narrower than the section's content (1120); draw it for the content width, lined up with what is above");
passes("[MKT.SCRIPTS.604] a drawing as wide as the content passes", check(under(1120), undefined, "--content", "1120"));

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
