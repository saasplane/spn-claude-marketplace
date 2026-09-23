// `release-go` — the check that refused a correct release, naming a version nobody typed.
//
// It guards the one act that cannot be taken back: a major release the developer never agreed to.
// Minor and patch are the standing authorization in `N39`, so the check reads the bump size and
// looks for a dated go line in an open workstream's arcs.
//
// IT HAD NO SUITE, and that is how the defect below survived. It was "proven against seven shapes"
// by hand in the sitting that wrote it, and a hand proof runs once, from one directory.
//
// THE DEFECT. `payload.cwd` is where the SESSION stands. A Bash call in a seven-repository
// workspace routinely carries its own `cd <repo> && …`, and the check read the session's directory
// instead. So `cd spn-support-ts && … apps release 1.2.68` was compared against `spn-platform-ts`'s
// tags, which are `v0.1.0`, and a patch bump was refused as a major one — with a message naming a
// version the caller had never written.
//
// The same `cd` prefix also stopped the permission floor's `allow` rule matching, because a pattern
// matches the FIRST token. One prefix, two independent failures, and neither was visible from the
// other. So half these cases are about the bump rule and half are about which directory answers it.
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const CHECKS = resolve(import.meta.dirname, "..", "checks");
const { checkReleaseGo, commandCwd, isMajorBump } = await import(join(CHECKS, "release-go.ts"));

const BASE = mkdtempSync(join(tmpdir(), "t-release-go-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let n = 0, failed = 0;
function one(label, ok) {
  n += 1;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
}

function git(args, cwd) {
  execFileSync("git", args, { cwd, stdio: ["ignore", "ignore", "ignore"] });
}

/** A repository carrying one release tag, so the check has a current version to compare against. */
function repo(name, tag) {
  const dir = join(BASE, "ws", name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "README.md"), `# ${name}\n`);
  git(["init", "-q"], dir);
  git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "x"], dir);
  git(["tag", tag], dir);
  return dir;
}

/** The workspace: two checkouts at very different versions, which is the whole point. */
mkdirSync(join(BASE, "ws"), { recursive: true });
const support = repo("spn-support-ts", "v1.2.67");
const platform = repo("spn-platform-ts", "v0.1.0");
mkdirSync(join(BASE, "ws", ".spndevex", "workstreams", "open", "008-x", "arcs"), { recursive: true });

const arcs = join(BASE, "ws", ".spndevex", "workstreams", "open", "008-x", "arcs");
writeFileSync(join(arcs, "N1-x.md"), "# N1\n\n## Log\n\n- **2026-09-23 — go.** Release this as 3.0.0.\n");

const verdict = (command, cwd) => checkReleaseGo({ tool_name: "Bash", cwd: cwd, tool_input: { command: command } });
const denied = (v) => typeof v?.deny === "string";

// ── the bump rule, which is what the check is for ──

one("a patch release passes, being the standing authorization",
  !denied(verdict("spnutils apps release 1.2.68", support)));
one("a minor release passes too",
  !denied(verdict("spnutils apps release 1.3.0", support)));
one("a major release with no recorded go is refused",
  denied(verdict("spnutils apps release 2.0.0", support)));
one("a major release WITH a dated go line in an open arc passes",
  !denied(verdict("spnutils apps release 3.0.0", support)));
one("an omitted version passes — the CLI increments and never bumps a major",
  !denied(verdict("spnutils apps release", support)));
one("a rehearsal passes, because it publishes nothing",
  !denied(verdict("spnutils apps release 2.0.0 --dry-run", support)));
one("an unrelated command is not this check's business",
  !denied(verdict("npx nx run utility-ts:build", support)));

// ── which directory answers the question, which is where it was wrong ──

// The regression. Standing in one checkout and releasing another is the ordinary case in a workspace
// of seven, and it produced a refusal citing a repository the caller never named.
one("REGRESSION: cd into a repo, and its OWN tags decide",
  !denied(verdict(`cd ${support} && npx tsx apps/utility-ts/src/index.ts apps release 1.2.68`, platform)));

// The untouched twin: the fix must not make the check blind. Against a repository that really is at
// 0.1.0, 1.2.68 really is a major bump, and it must still be refused.
one("and a real major bump is still refused after the cd",
  denied(verdict(`cd ${platform} && spnutils apps release 1.2.68`, support)));

one("a relative cd resolves against the session, not the root",
  commandCwd("cd spn-support-ts && spnutils apps release 1.2.68", join(BASE, "ws")) === support);
one("an absolute cd is taken as it stands",
  commandCwd(`cd ${support} && x`, platform) === support);
one("a quoted path survives a space in it",
  commandCwd(`cd '${support}' && x`, platform) === support);
one("a semicolon separates as well as &&",
  commandCwd(`cd ${support}; x`, platform) === support);

// Not every command starting with those two letters is a `cd`, and a command this cannot read must
// fall back rather than guess — a wrong guess here reads the wrong repository's tags silently.
one("no leading cd leaves the session's directory alone",
  commandCwd("spnutils apps release 1.2.68", support) === support);
one("a bare cd with no separator is not parsed",
  commandCwd("cdk deploy && x", support) === support);

// ── the comparison itself ──

one("a major bump is a higher first number, nothing else",
  isMajorBump("2.0.0", "1.9.9") && !isMajorBump("1.9.9", "1.2.0") && !isMajorBump("1.2.68", "1.2.67"));
one("a version it cannot read is not a major bump, because it cannot prove one",
  !isMajorBump("latest", "1.2.67") && !isMajorBump("2.0.0", "not-a-version"));

// A repository with no tags at all has nothing to compare against, and a gate that refuses what it
// cannot understand is a gate somebody turns off.
const fresh = join(BASE, "ws", "untagged");
mkdirSync(fresh, { recursive: true });
git(["init", "-q"], fresh);
one("a repository with no release tag is not this check's call",
  !denied(verdict("spnutils apps release 9.0.0", fresh)));

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
