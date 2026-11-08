import { CHECKS } from "../../../helpers/harness.mjs";
// `checks/cloud-flag.ts` — a `spnutils` command that reaches a real cloud account is asked each time:
// the cloud-capable commands of `infra` when `--cloud` sits anywhere in the command, and `login` always.
// It never denies, and the same words without `--cloud` pass.
import { join } from "node:path";

const { applies, checkCloudFlag, cloudCommand } = await import(join(CHECKS, "cloud-flag.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const bash = (command) => ({ tool_name: "Bash", tool_input: { command } });
const kind = (verdict) => (verdict?.deny ? "deny" : verdict?.ask ? "ask" : "silent");

// Every cloud-capable command, in the spelling a person types it.
const CLOUD = [
  "spnutils infra organization up --apply --approve",
  "spnutils infra organization status",
  "spnutils infra platform up lpd --apply",
  "spnutils infra platform down lpd",
  "spnutils infra environment up lpd --env in-dev --apply",
  "spnutils infra deployments up lpd --env in-dev --image api=sha256:abc",
  "spnutils infra web deploy lpd in-dev sample-web --dist dist",
  "spnutils infra web rollback lpd in-dev sample-web abc123",
  "spnutils infra config set lpd --env in-dev --app api",
  "spnutils infra config get lpd --env in-dev --app api KEY",
  "spnutils infra config list lpd --env in-dev --app api",
  "spnutils infra logs lpd api",
];

console.log("=== a case per command: without --cloud allowed, with --cloud asked");
for (const command of CLOUD) {
  ok(`[MKT.HOOKS.92] \`${command}\` without --cloud passes`, kind(checkCloudFlag(bash(command))) === "silent");
  ok(`[MKT.HOOKS.92] \`${command} --cloud\` is asked`, kind(checkCloudFlag(bash(`${command} --cloud`))) === "ask");
}

console.log("\n=== the flag may sit anywhere");
{
  ok("[MKT.HOOKS.92] a flag first among the options is asked",
    kind(checkCloudFlag(bash("spnutils infra platform up lpd --cloud --apply"))) === "ask");
  ok("[MKT.HOOKS.92] a flag between the options is asked",
    kind(checkCloudFlag(bash("spnutils infra environment up lpd --env in-dev --cloud --apply"))) === "ask");
  ok("[MKT.HOOKS.92] a flag after a leading cd is asked",
    kind(checkCloudFlag(bash("cd spn-infra && spnutils infra organization up --cloud --plan"))) === "ask");
  ok("[MKT.HOOKS.92] the = spelling is asked",
    kind(checkCloudFlag(bash("spnutils infra logs lpd --cloud=true"))) === "ask");
}

console.log("\n=== a release is asked unless it stays on this machine");
{
  ok("[MKT.HOOKS.92] `spnutils infra release` without --local is asked", kind(checkCloudFlag(bash("spnutils infra release -p infra-blueprints"))) === "ask");
  ok("[MKT.HOOKS.92] a dry run without --local is asked, it reads the pair", kind(checkCloudFlag(bash("spnutils infra release -p infra-blueprints --dry-run"))) === "ask");
  ok("[MKT.HOOKS.92] the reason names the registry pair",
    (checkCloudFlag(bash("spnutils infra release"))?.ask ?? "").includes("registry pair"));
  ok("[MKT.HOOKS.92] --local anywhere passes", checkCloudFlag(bash("spnutils infra release --local -p infra-blueprints")) === null);
  ok("[MKT.HOOKS.92] --local after the other options passes", checkCloudFlag(bash("spnutils infra release -p infra-blueprints --approve --local")) === null);
}

console.log("\n=== login is asked always");
{
  ok("[MKT.HOOKS.92] `spnutils login` is asked", kind(checkCloudFlag(bash("spnutils login"))) === "ask");
  ok("[MKT.HOOKS.92] the reason says it writes credentials",
    (checkCloudFlag(bash("spnutils login"))?.ask ?? "").includes("writes credentials"));
}

console.log("\n=== what it leaves alone");
{
  ok("[MKT.HOOKS.92] a local layer command passes", checkCloudFlag(bash("spnutils infra platform up lpd --local --apply")) === null);
  ok("[MKT.HOOKS.92] a command of another group passes", checkCloudFlag(bash("spnutils apps test unit api --cloud")) === null);
  ok("[MKT.HOOKS.92] a command that only contains the words passes", checkCloudFlag(bash("echo spnutils infra logs --cloud")) === null);
  ok("[MKT.HOOKS.92] a second command after && is not read as the first", checkCloudFlag(bash("ls && spnutils infra logs lpd --cloud")) === null);
  ok("[MKT.HOOKS.92] a non-Bash call passes", checkCloudFlag({ tool_name: "Edit", tool_input: { command: "spnutils login" } }) === null);
  ok("[MKT.HOOKS.92] a payload with no command passes", checkCloudFlag({ tool_name: "Bash", tool_input: {} }) === null);
  ok("[MKT.HOOKS.92] it never denies", CLOUD.every((command) => kind(checkCloudFlag(bash(`${command} --cloud`))) !== "deny"));
}

console.log("\n=== the dispatcher's fast path");
{
  ok("[MKT.HOOKS.92] `applies` is true for a cloud command", applies("", "spnutils infra logs lpd --cloud") === true);
  ok("[MKT.HOOKS.92] `applies` is false for anything else", applies("", "git status") === false);
  ok("[MKT.HOOKS.92] `cloudCommand` names the command it would ask about",
    cloudCommand("spnutils infra platform up lpd --cloud") === "spnutils infra platform up --cloud");
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — cloud-flag` : `\n  all ${total} passed — cloud-flag`);
process.exit(failed ? 1 : 0);
