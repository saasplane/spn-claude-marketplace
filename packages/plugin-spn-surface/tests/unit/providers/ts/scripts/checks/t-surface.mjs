// The Surface check: the JSX tag reader on the shapes that break a pattern, each of its notes with
// a seeded wrong file that gets it and the same file corrected that gets none, the write's own notes
// against the file before it, and the frame that leaves before loading anything on any other path.
//
// Each hook case runs the dispatcher's own entry with a PreToolUse event on stdin, the way the hook does,
// against a repository built in a temporary folder: a `TS` claim, a web node and a server node.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../../../helpers/harness.mjs";

const ENTRY = resolve(PLUGIN, "src", "scripts", "events", "pretooluse.ts");
const { findings } = await import(resolve(PLUGIN, "src", "providers", "ts", "scripts", "checks", "surface.ts"));
const { readJsx } = await import(resolve(PLUGIN, "src", "providers", "ts", "scripts", "checks", "_surface", "jsx.ts"));

const root = realpathSync(mkdtempSync(join(tmpdir(), "spn-surface-check-")));
process.on("exit", () => rmSync(root, { recursive: true, force: true }));
const put = (path, body) => { mkdirSync(join(root, path, ".."), { recursive: true }); writeFileSync(join(root, path), body, "utf8"); };
put("sprepo.json", JSON.stringify({ type: "APPS", name: "Sample", config: { mtype: "APPS", stack: "TS" } }));
put(".git/HEAD", "ref: refs/heads/main\n");
put("packages/module-web-x-ts/spkind.json", JSON.stringify({ kind: "MODULE_WEB" }));
put("packages/module-server-x-ts/spkind.json", JSON.stringify({ kind: "MODULE_SERVER" }));
const WEB = join(root, "packages/module-web-x-ts/src/entry/ui/components");
mkdirSync(WEB, { recursive: true });
const SERVER = join(root, "packages/module-server-x-ts/src/entry/ui");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (!condition) failed += 1;
  console.log(`  ${condition ? "PASS" : "FAIL"}  ${label}${condition || !detail ? "" : `\n        ${detail}`}`);
};

function hook(input, tool = "Write", env = { ...process.env, SPN_TELEMETRY: "off" }) {
  const out = execFileSync("node", [ENTRY], { input: JSON.stringify({ tool_name: tool, tool_input: input, cwd: root }),
    encoding: "utf8", env, stdio: ["pipe", "pipe", "pipe"] }).trim();
  if (!out) return { kind: "", text: "" };
  const specific = JSON.parse(out).hookSpecificOutput ?? {};
  if (specific.permissionDecision === "deny") return { kind: "deny", text: specific.permissionDecisionReason };
  return { kind: "note", text: specific.additionalContext ?? "" };
}

const HEAD = "import { DSBadge, DSButton, DSCard, DSColorType, DSDialog, DSDropdownMenu, DSIconType, DSItem, DSMark, DSPageLevelType, " +
  "DSPanelContainer, DSSectionContainer, DSVariantType } from '@saasplane/support-web-ds-ts';\n\n";
/** A panel's header holding a record's item and the buttons given, as the merchant page writes one. */
const header = (buttons) =>
  `    <DSPanelContainer>\n      <DSPanelContainer.Header>\n        <DSItem title="Avery Seller" />\n${buttons.map((one) => `        ${one}`).join("\n")}\n      </DSPanelContainer.Header>\n    </DSPanelContainer>`;
const MORE = "<DSDropdownMenu nodes={more}>{({ anchor }) => <DSButton anchor={anchor} startIcon={DSIconType.MORE_HORIZONTAL} ariaLabel=\"More actions\" />}</DSDropdownMenu>";
const page = (body) => `${HEAD}export const Page = () => (\n  <div>\n${body}\n  </div>\n);\n`;
const rulesOf = (text) => findings(text).map((note) => note.rule);

console.log("=== the reader — the shapes that break a pattern");
{
  const apostrophe = page("    <p>You can't undo this, and it's final.</p>\n    <DSButton variant={DSVariantType.SOLID} label=\"Delete\" />\n    <DSButton variant={DSVariantType.SOLID} label=\"Keep\" />");
  ok("an apostrophe in JSX text does not hide the tags after it", rulesOf(apostrophe).includes("button-one-solid"));
  const arrow = readJsx(page("    <DSButton anchor={() => go(a > b)} variant={DSVariantType.SOLID} label=\"Go\" />")).tags.find((tag) => tag.name === "DSButton");
  ok("`=>` in a prop is code, and the attributes after it are read",
    arrow?.attrs.map((attr) => attr.name).join(" ") === "anchor variant label", JSON.stringify(arrow?.attrs));
  ok("a spread may carry what a tag seems to lack, so `CUSTOM` beside one is not noted",
    !rulesOf(page("    <DSBadge {...tagProps} color={DSColorType.CUSTOM} label=\"Tag\" />")).includes("custom-no-colour"));
  const template = page("    <DSBadge label={`${name}'s ${count > 1 ? 'items' : 'item'}`} variant={DSVariantType.SOLID} />");
  ok("a template literal with a quote and a `>` inside is stepped over", rulesOf(template).includes("badge-solid"));
  ok("a ternary of two `SOLID` is two branches of one condition, and gets no note", !rulesOf(page(
    "    {isPage ? (\n      <DSButton variant={DSVariantType.SOLID} label=\"Account\" />\n    ) : (\n      <DSButton variant={DSVariantType.SOLID} label=\"Switch\" />\n    )}")).length);
  ok("`&&` on two sides keeps each button in its own branch", !rulesOf(page(
    "    {a && <DSButton variant={DSVariantType.SOLID} label=\"A\" />}\n    {!a && <DSButton variant={DSVariantType.SOLID} label=\"B\" />}")).length);
  const generic = `${HEAD}const map: Record<ThingStatusType, DSColorType> = {};\nconst id = <T,>(x: T) => x;\nconst less = a < b;\nexport const P = () => <DSButton variant={DSVariantType.SOLID} label="One" />;\n`;
  const names = readJsx(generic).tags.map((tag) => tag.name);
  ok("a type's arguments, a generic arrow and a comparison are no tags", JSON.stringify(names) === '["DSButton"]', JSON.stringify(names));
  ok("a tag the reader cannot walk to its end gives no note rather than a wrong one",
    !rulesOf(`${HEAD}export const P = () => <DSBadge variant={DSVariantType.SOLID} label="x"`).length);
  ok("a unit built inside the design system, imported from a relative path, is not judged",
    !rulesOf("import { DSBadge } from './DSBadge';\nimport { DSVariantType } from '../core/common';\nexport const X = () => <DSBadge variant={DSVariantType.SOLID} label=\"x\" />;\n").length);
}

// Each note: [rule, its book row, the seeded wrong body, the same body corrected].
const PAIRS = [
  ["badge-kind-look", "RD.SUPPORT.SURFACE.368",
    "    <DSBadge label=\"Admin\" variant={DSVariantType.OUTLINE} color={DSColorType.SUCCESS} />",
    "    <DSBadge label=\"Admin\" variant={DSVariantType.OUTLINE} color={DSColorType.DEFAULT} />"],
  ["state-hue-table", "RD.SUPPORT.SURFACE.369",
    "    {null}\n  </div>\n);\nconst ROLE_STATUS_COLOR: Record<RoleStatusType, DSColorType> = {\n  [RoleStatusType.ACTIVE]: DSColorType.SUCCESS,\n  [RoleStatusType.PENDING]: DSColorType.INFO,\n};\nconst Other = () => (\n  <div>",
    "    {null}\n  </div>\n);\nconst ROLE_STATUS_COLOR: Record<RoleStatusType, DSColorType> = {\n  [RoleStatusType.ACTIVE]: DSColorType.SUCCESS,\n  [RoleStatusType.PENDING]: DSColorType.WARNING,\n};\nconst Other = () => (\n  <div>"],
  ["badge-solid", "RD.SUPPORT.SURFACE.374",
    "    <DSBadge label=\"Live\" variant={DSVariantType.SOLID} color={DSColorType.SUCCESS} />",
    "    <DSBadge label=\"Live\" color={DSColorType.SUCCESS} />"],
  ["button-one-solid", "RD.SUPPORT.SURFACE.370",
    "    <DSButton variant={DSVariantType.SOLID} color={DSColorType.PRIMARY} label=\"Save\" />\n    <DSButton variant={DSVariantType.SOLID} label=\"Cancel\" />",
    "    <DSButton variant={DSVariantType.SOLID} color={DSColorType.PRIMARY} label=\"Save\" />\n    <DSButton label=\"Cancel\" />"],
  ["container-in-container", "RD.SUPPORT.APPS.147",
    "    <DSPanelContainer>\n      <DSPanelContainer.Content>\n        <DSPanelContainer>inner</DSPanelContainer>\n      </DSPanelContainer.Content>\n    </DSPanelContainer>",
    "    <DSPanelContainer>\n      <DSPanelContainer.Content>outer</DSPanelContainer.Content>\n    </DSPanelContainer>\n    <DSPanelContainer>inner</DSPanelContainer>"],
  ["hand-set-look", "RD.SUPPORT.APPS.150",
    "    <DSButton className=\"ds:mt-2 ds:px-4 ds:bg-red-500 ds:rounded-lg\" label=\"Go\" />",
    "    <DSButton className=\"ds:mt-2\" label=\"Go\" />"],
  ["custom-no-colour", "RD.SUPPORT.SURFACE.382",
    "    <DSBadge label=\"VIP\" color={DSColorType.CUSTOM} />",
    "    <DSBadge label=\"VIP\" color={DSColorType.CUSTOM} customColor={tag.color} />"],
  ["header-one-main", "RD.SUPPORT.SURFACE.390",
    header(["<DSButton label=\"Start review\" color={DSColorType.PRIMARY} />", "<DSButton label=\"Approve merchant\" color={DSColorType.PRIMARY} />"]),
    header(["<DSButton label=\"Start review\" color={DSColorType.PRIMARY} />", "<DSButton label=\"Approve merchant\" />"])],
  ["header-error-beside-main", "RD.SUPPORT.SURFACE.390",
    header(["<DSButton label=\"Reject\" color={DSColorType.ERROR} />", "<DSButton label=\"Start review\" color={DSColorType.PRIMARY} />"]),
    header(["<DSButton label=\"Reject\" />", "<DSButton label=\"Start review\" color={DSColorType.PRIMARY} />"])],
  ["header-secondaries", "RD.SUPPORT.SURFACE.390",
    header(["<DSButton label=\"Mark onboarding in progress\" />", "<DSButton label=\"Reject\" />", "<DSButton label=\"Deactivate\" />", "<DSButton label=\"Start review\" color={DSColorType.PRIMARY} />"]),
    header(["<DSButton label=\"Mark onboarding in progress\" />", "<DSButton label=\"Reject\" />", MORE, "<DSButton label=\"Start review\" color={DSColorType.PRIMARY} />"])],
];

console.log("\n=== each note — a seeded wrong file gets it, through the hook, and the same file corrected gets none");
for (const [rule, row, wrong, right] of PAIRS) {
  const file = join(WEB, `${rule}.tsx`);
  const seeded = hook({ file_path: file, content: page(wrong) });
  ok(`${rule}: the seeded file gets a note naming ${row}`, seeded.kind === "note" && seeded.text.includes(row), `${seeded.kind}: ${seeded.text.slice(0, 300)}`);
  const corrected = hook({ file_path: file, content: page(right) });
  ok(`${rule}: the corrected file gets none`, corrected.kind === "", corrected.text.slice(0, 300));
}

console.log("\n=== the shipped bundle reaches the stack's reader and says what the source says");
{
  const BUNDLE = resolve(PLUGIN, "src", "dist", "events", "pretooluse.mjs");
  const input = JSON.stringify({ tool_name: "Write", tool_input: { file_path: join(WEB, "Bundle.tsx"), content: page(PAIRS[3][2]) }, cwd: root });
  const run = (entry) => execFileSync("node", [entry], { input, encoding: "utf8", env: { ...process.env, SPN_TELEMETRY: "off" } }).trim();
  const bundled = run(BUNDLE);
  ok("the bundle gives the note, word for word as the source", bundled.includes("RD.SUPPORT.SURFACE.370") && bundled === run(ENTRY), bundled.slice(0, 200));
}

console.log("\n=== the cases a note must not reach");
{
  ok("a badge over a picture is SOLID by its rule, and gets no note", !rulesOf(page(
    "    <DSCard media={<DSBadge label=\"Live\" variant={DSVariantType.SOLID} color={DSColorType.SUCCESS} />} />")).length);
  ok("a dialog over a page is a view of its own and holds its own SOLID", !rulesOf(page(
    "    <DSButton variant={DSVariantType.SOLID} label=\"Invite\" />\n    <DSDialog open={open}>\n      <DSButton variant={DSVariantType.SOLID} label=\"Send\" />\n    </DSDialog>")).length);
  ok("a site page's closing call repeats the hero's one act in its own section, and gets no note", !rulesOf(page(
    "    <DSSectionContainer>\n      <DSButton variant={DSVariantType.SOLID} label=\"Start free\" />\n    </DSSectionContainer>\n" +
    "    <DSSectionContainer>\n      <DSButton variant={DSVariantType.SOLID} label=\"Open the workspace\" />\n    </DSSectionContainer>")).length);
  ok("a kind badge in a colour a person chose (`CUSTOM`) is never the kind note", !rulesOf(page(
    "    <DSBadge label=\"VIP\" variant={DSVariantType.OUTLINE} color={DSColorType.CUSTOM} customColor={c} />")).length);
  ok("a colour from a lookup is not judged", !rulesOf(page(
    "    <DSBadge label=\"x\" variant={DSVariantType.OUTLINE} color={STATUS_COLOR[status]} />")).length);
  ok("a bare `DSItem` at `INLINE` may draw a description, by the item line's own rules", !rulesOf(page(
    "    <DSItem pageLevel={DSPageLevelType.INLINE} title=\"v3\" description=\"Draft\" />")).length);
  ok("a unit whose `className` the design system gives to the page is the page's: a surface's padding and radius, a list's gap",
    !rulesOf(`import { DSList, DSSurface } from '@saasplane/support-web-ds-ts';\nexport const P = () => (\n  <div>\n    <DSSurface className="ds:rounded-lg ds:p-6" />\n    <DSList flush className="ds:gap-1" />\n  </div>\n);\n`).length);
  ok("a gap beside `flex` lays out the page's own children, and is the page's", !rulesOf(page(
    "    <DSPanelContainer.Content className=\"ds:flex ds:flex-col ds:gap-4\">x</DSPanelContainer.Content>")).length);
  ok("a class that sets a margin, a width or a type step is the page's own", !rulesOf(page(
    "    <DSButton className=\"ds:mt-2 ds:w-full ds:text-sm md:ml-4\" label=\"Go\" />")).length);
}

console.log("\n=== only what this write adds");
{
  const file = join(WEB, "Existing.tsx");
  const two = page("    <DSButton variant={DSVariantType.SOLID} label=\"Save\" />\n    <DSButton variant={DSVariantType.SOLID} label=\"Cancel\" />\n    <p>old</p>");
  writeFileSync(file, two, "utf8");
  const unrelated = hook({ file_path: file, old_string: "<p>old</p>", new_string: "<p>new</p>" }, "Edit");
  ok("an edit beside a slip that was already there says nothing about it", unrelated.kind === "", unrelated.text.slice(0, 200));
  writeFileSync(file, page("    <DSButton variant={DSVariantType.SOLID} label=\"Save\" />\n    <p>old</p>"), "utf8");
  const second = hook({ file_path: file, old_string: "<p>old</p>", new_string: "<DSButton variant={DSVariantType.SOLID} label=\"Cancel\" />" }, "Edit");
  ok("an edit that adds the second SOLID gets the note", second.kind === "note" && second.text.includes("RD.SUPPORT.SURFACE.370"), second.text.slice(0, 200));
  ok("a note is advice, never a refusal", second.kind !== "deny");
}

console.log("\n=== the frame — any other path leaves before the check is loaded");
{
  const telemetry = realpathSync(mkdtempSync(join(tmpdir(), "spn-surface-frame-")));
  mkdirSync(join(telemetry, ".spndevex", ".debug"), { recursive: true });
  writeFileSync(join(telemetry, ".spndevex", ".debug", "telemetry.on"), "on\n");
  const env = { ...process.env };
  delete env.SPN_TELEMETRY;
  const spans = (input, tool = "Write") => {
    rmSync(join(telemetry, ".spndevex", ".debug", "telemetry"), { recursive: true, force: true });
    execFileSync("node", [ENTRY], { input: JSON.stringify({ tool_name: tool, tool_input: input, cwd: telemetry }), env, encoding: "utf8" });
    // A run that timed no check writes no line at all (`timing.ts` § end), so no file is no span.
    let text = "";
    try { text = readFileSync(join(telemetry, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), "utf8").trim(); } catch { /* none */ }
    return text ? text.split("\n").map((line) => JSON.parse(line)).map((line) => `${line.group} › ${line.action}`) : [];
  };
  const markdown = spans({ file_path: join(WEB, "notes.md"), content: page(PAIRS[3][2]) });
  ok("a non-`.tsx` write times nothing: no check was loaded", JSON.stringify(markdown) === "[]", JSON.stringify(markdown));
  const typescript = spans({ file_path: join(WEB, "util.ts"), content: "export const a = 1;\n" });
  ok("a `.ts` write leaves the same way", JSON.stringify(typescript) === "[]", JSON.stringify(typescript));
  const tsx = spans({ file_path: join(WEB, "Page.tsx"), content: page(PAIRS[3][2]) });
  ok("a web node's `.tsx` loads the check and runs the stack's reader", tsx.includes("surface › load") && tsx.includes("surface › ts"), JSON.stringify(tsx));
  rmSync(telemetry, { recursive: true, force: true });
  ok("a `.tsx` in a server node gets no note", hook({ file_path: join(SERVER, "Page.tsx"), content: page(PAIRS[3][2]) }).kind === "");
  ok("a `.tsx` spec gets no note", hook({ file_path: join(WEB, "Page.spec.tsx"), content: page(PAIRS[3][2]) }).kind === "");
  ok("another tool is not looked at", hook({ file_path: join(WEB, "Page.tsx"), content: page(PAIRS[3][2]) }, "Read").kind === "");
  ok("an event the hook cannot read leaves it with nothing to say", hook(null).kind === "");
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — surface check` : `\n  all ${total} passed — surface check`);
process.exit(failed ? 1 : 0);
