// `checks/no-history.ts` — a page states what is true now (the book's RULE.DEVEX.WORKSPACE.247).
//
// Each case hands the check's own function a write and reads the verdict. A page under docs/, refs/ or a
// workstream is read; a log, a register and a changelog keep history and are never read.
const { checkNoHistory } = await import("../../../../src/scripts/checks/no-history.ts");

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

console.log("=== history words on a page");
for (const word of ["formerly", "renamed from", "moved from", "replaced by", "legacy"]) {
  const refused = checkNoHistory(write("/repo/docs/04-capabilities/a.md", `# A\n\nThis page was ${word} the old one.\n`));
  ok(`[MKT.HOOKS.133] "${word}" on a docs page is refused`, verdictOf(refused) === "deny" && refused.deny.includes(word), JSON.stringify(refused));
}
ok("[MKT.HOOKS.133] a ref under refs/ is refused",
  verdictOf(checkNoHistory(write("/repo/refs/devex/a.md", "The command was renamed from run.\n"))) === "deny");
ok("[MKT.HOOKS.133] a workstream page is refused",
  verdictOf(checkNoHistory(write("/ws/.spndevex/workstreams/open/036-x/approach.html", "<p>The step is legacy now.</p>"))) === "deny");
ok("[MKT.HOOKS.133] an Edit's new text is read",
  verdictOf(checkNoHistory(write("/repo/docs/a.md", "formerly called x", "Edit"))) === "deny");
ok("[MKT.HOOKS.133] a page that states what is true now is quiet",
  verdictOf(checkNoHistory(write("/repo/docs/a.md", "The command runs the suite.\n"))) === "silent");
ok("[MKT.HOOKS.133] a class name in a tag is not a word on the page",
  verdictOf(checkNoHistory(write("/repo/docs/a.html", '<div class="legacy-box">Fine</div>'))) === "silent");

console.log("\n=== what keeps history is not read");
ok("[MKT.HOOKS.134] a log line is not read",
  verdictOf(checkNoHistory(write("/ws/.spndevex/workstreams/open/036-x/arcs/N006/log.jsonl", '{"text":"renamed from a"}'))) === "silent");
ok("[MKT.HOOKS.134] a register under docs/registers/ is not read",
  verdictOf(checkNoHistory(write("/repo/docs/registers/decisions.md", "| D1 | replaced by D2 |\n"))) === "silent");
ok("[MKT.HOOKS.134] a changelog is not read",
  verdictOf(checkNoHistory(write("/repo/docs/CHANGELOG.md", "- moved from a to b\n"))) === "silent");
ok("[MKT.HOOKS.134] a file that is not a page is not read",
  verdictOf(checkNoHistory(write("/repo/docs/a.ts", "// formerly x"))) === "silent");
ok("[MKT.HOOKS.134] a tool that does not write is not read",
  verdictOf(checkNoHistory({ tool_name: "Read", tool_input: { file_path: "/repo/docs/a.md" } })) === "silent");

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);

