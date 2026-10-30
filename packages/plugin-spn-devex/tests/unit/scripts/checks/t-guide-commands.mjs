// `checks/guide-commands.ts` — a guide names the spnutils command, never npx or pnpm.
const { checkGuideCommands } = await import("../../../../src/scripts/checks/guide-commands.ts");

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

console.log("=== a guide's commands");
const refused = checkGuideCommands(write("/repo/docs/05-guides/01-test.md", "Run:\n\n```\nnpx nx test api\n```\n"));
ok("[MKT.HOOKS.136] npx in a guide is refused", verdictOf(refused) === "deny", JSON.stringify(refused));
ok("[MKT.HOOKS.136] the refusal names the command and the spnutils command that does the job",
  (refused?.deny ?? "").includes("npx nx test") && (refused?.deny ?? "").includes("spnutils apps test"), refused?.deny);
ok("[MKT.HOOKS.136] pnpm in a guide is refused",
  verdictOf(checkGuideCommands(write("/repo/docs/05-guides/01-test.md", "pnpm install\n"))) === "deny");
ok("[MKT.HOOKS.136] a spnutils command passes",
  verdictOf(checkGuideCommands(write("/repo/docs/05-guides/01-test.md", "spnutils apps test contract r1 api\n"))) === "silent");
ok("[MKT.HOOKS.136] npx outside a guide passes",
  verdictOf(checkGuideCommands(write("/repo/docs/04-capabilities/a.md", "npx nx test api\n"))) === "silent");
ok("[MKT.HOOKS.136] a word that only ends in npx is not the command",
  verdictOf(checkGuideCommands(write("/repo/docs/05-guides/01-test.md", "the xnpx tool\n"))) === "silent");

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);

