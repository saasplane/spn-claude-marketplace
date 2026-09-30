// `lib/command-reader.ts` — a Bash command read into the programs it runs, each as script › group ›
// subgroup › action and the args typed after the action (RD.DEVEX.WORKSPACE.185, N8 row 2p). The
// port of the prototype `classify.py`: split on `&&`, `||`, `;`, `|`; drop `VAR=value`, `cd <dir>`
// and redirections; know per program how many words make the levels and which options take a value.
import { DEFAULT_PROGRAMS, programsFrom, readCommand, segments } from "../../../../src/scripts/lib/command-reader.ts";

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

const ROOT = "/w";
const read = (command, cwd = ROOT, programs = DEFAULT_PROGRAMS) => readCommand(command, cwd, programs, ROOT);
const m = (script, group, subgroup, action, args, repo = null) => ({ script, group, subgroup, action, args, repo });

console.log("=== segments — the shell's separators, quotes and redirections");
same("&&, ||, ; and | each end a segment", segments("a 1 && b 2 || c; d | e"), [["a", "1"], ["b", "2"], ["c"], ["d"], ["e"]]);
same("quotes join a word and hide a separator", segments(`echo "a && b" 'c;d'`), [["echo", "a && b", "c;d"]]);
same("redirections and their targets are dropped", segments("git status > /tmp/x 2>&1 < in"), [["git", "status"]]);
same("a heredoc's body is never read as commands", segments("git commit -F - <<'EOF'\ngit push\nEOF\necho done"),
  [["git", "commit", "-F", "-"], ["echo", "done"]]);
same("a comment is not a word", segments("git status # and git push"), [["git", "status"]]);

console.log("\n=== spnutils — three levels where the second word has subcommands, otherwise two");
same("infra platform up is three levels, and the rest is args",
  read("spnutils infra platform up dmo --apply"), [m("spnutils", "infra", "platform", "up", "dmo --apply")]);
same("infra app up is three levels", read("spnutils infra app up web"), [m("spnutils", "infra", "app", "up", "web")]);
same("apps migrate up is three levels", read("spnutils apps migrate up service-sample-ts"),
  [m("spnutils", "apps", "migrate", "up", "service-sample-ts")]);
same("apps test is two", read("spnutils apps test unit utility-ts"), [m("spnutils", "apps", null, "test", "unit utility-ts")]);
same("a bare option leaves the levels null", read("spnutils -v"), [m("spnutils", null, null, null, "-v")]);

console.log("\n=== the words around a program");
same("VAR=value and a leading cd are dropped, and the cd names the repo",
  read("cd spn-support-ts && NX_SKIP_NX_CACHE=true spnutils apps test unit utility-ts 2>&1 | tail -5"),
  [m("spnutils", "apps", null, "test", "unit utility-ts", "spn-support-ts")]);
same("the repo comes from cwd when nothing moves it",
  read("git status", "/w/spn-foundation/docs"), [m("git", null, null, "status", null, "spn-foundation")]);
same("a cd back to the root reads null", read("cd /w && git log -1", "/w/spn-foundation"), [m("git", null, null, "log", "-1")]);
same("git's -C takes a value before the action", read("git -C /w/x status --short"), [m("git", null, null, "status", "--short")]);
same("npx nx is nx, one level", read("npx nx run app:build --skip-nx-cache"), [m("nx", null, null, "run", "app:build --skip-nx-cache")]);
same("docker compose is two levels, and -f takes a value", read("docker compose -f x.yml up -d"),
  [m("docker", "compose", null, "up", "-d")]);
same("docker ps is one", read("docker ps -a"), [m("docker", null, null, "ps", "-a")]);
same("an installed plugin CLI is its plugin, two levels",
  read("node /Users/d/.claude/plugins/cache/spn/spn-devex/0.10.9/dist/cli.mjs docs audit docs/"),
  [m("spn-devex", "docs", null, "audit", "docs/")]);
same("the marketplace's own build is the same plugin",
  read("node packages/plugin-spn-apps/src/dist/cli.mjs coverage check ."), [m("spn-apps", "coverage", null, "check", ".")]);
same("a compound command writes one match per program",
  read("git add a && git commit -m 'two words' && ls").map((one) => one.action), ["add", "commit"]);
same("a quoted program name is not run", read(`echo "git status"`), []);
same("an unmatched command reads nothing", read("ls -la; cat x | grep y"), []);

console.log("\n=== secrets");
same("an option naming a token, a password, a secret or a key has its value written ***",
  read("spnutils infra config set --token abc --api-key=zzz --password p FOO"),
  [m("spnutils", "infra", "config", "set", "--token *** --api-key=*** --password *** FOO")]);

console.log("\n=== the workspace filter");
{
  const programs = programsFrom({ add: [{ program: "pnpm", levels: 1, valued: ["filter"] }], remove: ["git"] });
  same("a removed program is no longer read", read("git status", ROOT, programs), []);
  same("an added program is read with its own levels", read("pnpm --filter x install --frozen-lockfile", ROOT, programs),
    [m("pnpm", null, null, "install", "--frozen-lockfile")]);
  same("the defaults stay where not removed", read("spnutils apps test unit x", ROOT, programs).length, 1);
  same("a malformed filter leaves the defaults", programsFrom({ add: "nonsense", remove: 3 }).length, DEFAULT_PROGRAMS.length);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — command reader` : `\n  all ${total} passed — command reader`);
process.exit(failed ? 1 : 0);
