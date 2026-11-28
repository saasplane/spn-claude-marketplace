// `checks/restates-first.ts` — the plugin's copy of the book's templates is written by `restates files write` (RULE.DEVEX.WORKSPACE.229).
const { checkRestatesFirst } = await import("../../../../src/scripts/checks/restates-first.ts");

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

console.log("=== the template copy");
const copy = "/repo/packages/plugin-spn-devex/src/refs/devex/workspace/docs/templates/approach.html";
const refused = checkRestatesFirst(write(copy, "<html></html>"));
ok("[MKT.HOOKS.139] a hand write to the template copy is refused", verdictOf(refused) === "deny", JSON.stringify(refused));
ok("[MKT.HOOKS.139] the refusal names the book's template and the command that writes the copy",
  (refused?.deny ?? "").includes("book") && (refused?.deny ?? "").includes("spn-devex restates files write"), refused?.deny);
ok("[MKT.HOOKS.139] an Edit is refused too", verdictOf(checkRestatesFirst(write(copy, "x", "Edit"))) === "deny");
ok("[MKT.HOOKS.139] another ref is not the copy",
  verdictOf(checkRestatesFirst(write("/repo/packages/plugin-spn-devex/src/refs/devex/workspace/docs/doc-sets.md", "x"))) === "silent");
ok("[MKT.HOOKS.139] a Read is not a write",
  verdictOf(checkRestatesFirst({ tool_name: "Read", tool_input: { file_path: copy } })) === "silent");

console.log("=== the surface specs mirror and the language list");
const spec = "/repo/packages/plugin-spn-surface/src/refs/specs/surface/languages/base/spdl.json";
const mirror = checkRestatesFirst(write(spec, "{}"));
ok("[MKT.HOOKS.140] a hand write to spn-surface's copy of a book spec is refused, naming the book and the build",
  verdictOf(mirror) === "deny" && (mirror?.deny ?? "").includes("docs/specs/surface") && (mirror?.deny ?? "").includes("build-plugins"), mirror?.deny);
const list = checkRestatesFirst(write("/repo/packages/plugin-spn-surface/src/languages.json", "{}", "Edit"));
ok("[MKT.HOOKS.140] a hand edit to the language list is refused, naming its source", verdictOf(list) === "deny" && (list?.deny ?? "").includes("surface-languages.json"), list?.deny);
ok("[MKT.HOOKS.140] the source of the list is not guarded", verdictOf(checkRestatesFirst(write("/repo/scripts/surface-languages.json", "{}"))) === "silent");

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);

