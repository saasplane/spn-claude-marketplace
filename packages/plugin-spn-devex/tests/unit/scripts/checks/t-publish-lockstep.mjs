// `checks/publish-lockstep.ts` — `npm publish` and `pnpm publish` are refused in a repository that has a release
// command, and the refusal names it. [MKT.HOOKS.387]
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { applies, checkPublishLockstep, releaseCommand } = await import(join(CHECKS, "publish-lockstep.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const BASE = realpathSync(mkdtempSync(join(tmpdir(), "spn-devex-publish-lockstep-")));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));
function repo(name, type, scripts) {
  const dir = join(BASE, name);
  mkdirSync(join(dir, "packages", "a"), { recursive: true });
  writeFileSync(join(dir, "sprepo.json"), JSON.stringify({ type }));
  if (scripts) writeFileSync(join(dir, "package.json"), JSON.stringify({ scripts }));
  return dir;
}
const bash = (command, cwd) => ({ tool_name: "Bash", cwd, tool_input: { command } });
const kind = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");

console.log("=== a publish in a repository with a release command");
{
  const apps = repo("apps", "APPS"), infra = repo("infra", "INFRA"), plugins = repo("plugins", "GENERAL", { "release:plugins": "node x.mjs" });
  for (const command of ["npm publish", "pnpm publish --access public", "pnpm -r publish", "cd packages/a && npm publish"]) {
    const verdict = checkPublishLockstep(bash(command, apps));
    ok(`[MKT.HOOKS.387] \`${command}\` is refused, naming spnutils apps release`, kind(verdict) === "deny" && verdict.deny.includes("spnutils apps release"), JSON.stringify(verdict));
  }
  ok("[MKT.HOOKS.387] an INFRA repository is told spnutils infra release", checkPublishLockstep(bash("npm publish", infra))?.deny?.includes("spnutils infra release"));
  ok("[MKT.HOOKS.387] a repository with a release script is told that script", checkPublishLockstep(bash("pnpm publish", plugins))?.deny?.includes("pnpm release:plugins"));
  ok("[MKT.HOOKS.387] a publish from a package folder is still read against its repository", checkPublishLockstep(bash("npm publish", join(apps, "packages", "a")))?.deny?.includes("spnutils apps release"));
}

console.log("\n=== what it lets through");
{
  const none = repo("none", "GENERAL");
  const apps = repo("apps2", "APPS");
  ok("a repository with no release command is not judged", kind(checkPublishLockstep(bash("npm publish", none))) === "silent" && releaseCommand(none) === null);
  ok("a folder in no repository is not judged", kind(checkPublishLockstep(bash("npm publish", join(BASE, "loose")))) === "silent");
  ok("npm pack and npm install pass", kind(checkPublishLockstep(bash("npm pack && pnpm install", apps))) === "silent");
  ok("a call that is not Bash is not read", kind(checkPublishLockstep({ tool_name: "Write", tool_input: { command: "npm publish" }, cwd: apps })) === "silent");
  ok("a command that only names the word does not apply", !applies("", "echo publish") && applies("", "pnpm publish"));
}

console.log(`\n${failed ? `${failed} of ${total} FAILED` : `all ${total} passed`}`);
process.exit(failed ? 1 : 0);
