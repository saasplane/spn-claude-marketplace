// `checks/figure-spacing.ts` — a drawing a page write carries is measured with `checkFigures`.
const { checkFigureSpacing } = await import("../../../../src/scripts/checks/figure-spacing.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const verdictOf = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");
const write = (file_path, content, tool_name = "Write") =>
  ({ tool_name, cwd: "/repo", tool_input: tool_name === "Write" ? { file_path, content } : { file_path, new_string: content } });

const drawing = (inner) => `<svg class="sds-drawing" viewBox="0 0 400 200">${inner}</svg>`;
const SPACED = drawing('<rect x="20" y="20" width="160" height="60"/><text class="sds-label" x="36" y="56">Turn end</text>');
const TIGHT = drawing('<rect x="20" y="20" width="160" height="60"/><text class="sds-label" x="184" y="56">Turn end</text>');
const page = (body) => write("/ws/.spndevex/workstreams/open/036-x/notes/N006/preview.html", body);

console.log("=== a drawing against the spacing contract");
const refused = checkFigureSpacing(page(TIGHT));
ok("[MKT.HOOKS.135] a label too near a box it is not inside is refused", verdictOf(refused) === "deny", JSON.stringify(refused));
ok("[MKT.HOOKS.135] the refusal names the label", (refused?.deny ?? "").includes("Turn end"), refused?.deny);
ok("[MKT.HOOKS.135] a spaced drawing passes", verdictOf(checkFigureSpacing(page(SPACED))) === "silent",
  JSON.stringify(checkFigureSpacing(page(SPACED))));
ok("[MKT.HOOKS.135] an svg that is not a drawing is not measured",
  verdictOf(checkFigureSpacing(page(TIGHT.replace("sds-drawing", "icon")))) === "silent");
ok("[MKT.HOOKS.135] a write with no svg is quiet", verdictOf(checkFigureSpacing(page("<p>hello</p>"))) === "silent");

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);

