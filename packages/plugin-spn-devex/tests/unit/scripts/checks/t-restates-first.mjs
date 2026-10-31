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

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);

