import { PLUGIN } from "../../../helpers/harness.mjs";
// `release-go` — the check that refused a correct release, naming a version nobody typed.
//
// It guards the one act that cannot be taken back: a release at a version nobody recorded. The agent records the version
// in an arc's log before the go (`arc edit --note "release <repo> <version>: <why>"`), and the check reads the bump size and
// that line (RULE.DEVEX.WORKSPACE.069): no line, or a stamped bump smaller than the recorded one, is refused; a bigger one is not.
//
// EVERY REFUSAL IS READ FOR WHAT IT ASKS. A refused case passes only when its message names the command that records
// the version, and never the retired go forms.
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
import { WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const CHECKS = resolve(PLUGIN, "src", "scripts", "checks");
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
const open = join(BASE, "ws", ".spndevex", WORKSTREAMS, "open");

// The log line `arc edit --note` writes for a release's recorded version.
const AT = "2026-11-02T20:05+05:30";
const recorded = (repo, version, at = AT) => ({ at, kind: "note", row: null, note: `release ${repo} ${version}: the wiring changes` });
const unrelated = { at: AT, kind: "note", row: null, note: "the release will be 9.0.0" };

/** An arc's data and log in an open workstream, as the `workstream` commands write them. */
function arc(workstream, id, lines) {
  const dir = join(open, workstream, "arcs", id);
  mkdirSync(dir, { recursive: true });
  const data = { schemaVersion: 2, arc: id, subject: "a-subject", title: "a subject", goal: null, status: "DECIDED", reason: null,
    preview: "preview.html", rows: [{ id: "1", parent: id, title: "release it", kind: "change", state: "waiting" }] };
  writeFileSync(join(dir, "state.json"), `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(join(dir, "log.jsonl"), lines.map((line) => JSON.stringify(line)).join("\n") + "\n");
}
/** The open workstreams hold exactly these arcs' logs: each is `[workstream, arc id, lines]`. */
function logs(...arcs) {
  rmSync(open, { recursive: true, force: true });
  for (const [workstream, id, lines] of arcs) arc(workstream, id, lines);
}

const verdict = (command, cwd) => checkReleaseGo({ tool_name: "Bash", cwd: cwd, tool_input: { command: command } });
const denied = (v) => typeof v?.deny === "string";
// A refusal names the command that records the version, and never the retired go forms.
const RECORDS_A_VERSION = "workstream arc edit <ws>/<arc> --note \"release ";
const asksForTheCommand = (v) => denied(v) && v.deny.includes(RECORDS_A_VERSION) && !v.deny.includes("--status DECIDED") && !v.deny.includes("— go.**");

// ── the recorded version, which is what the check reads ──

logs(["008-x", "N001", [unrelated]]);
one("[MKT.HOOKS.489] a release with no recorded version line is refused, naming the command that records it",
  asksForTheCommand(verdict("spnutils apps release 1.2.68", support)));
one("[MKT.HOOKS.489] a note that only mentions a version, in no `release <repo> <version>:` form, records nothing",
  asksForTheCommand(verdict("spnutils apps release 9.0.0", support)));

logs(["008-x", "N001", [recorded("spn-support-ts", "1.2.68")]]);
one("[MKT.HOOKS.489] a stamped version equal to the recorded one passes",
  !denied(verdict("spnutils apps release 1.2.68", support)));
one("[MKT.HOOKS.489] a stamped patch under a recorded patch passes, whatever the number",
  !denied(verdict("spnutils apps release 1.2.69", support)));
one("[MKT.HOOKS.489] a major stamped over a recorded patch passes: only a smaller bump is refused",
  !denied(verdict("spnutils apps release 2.0.0", support)));

logs(["008-x", "N001", [recorded("spn-support-ts", "1.3.0")]]);
one("[MKT.HOOKS.489] a bump smaller than the recorded one is refused",
  asksForTheCommand(verdict("spnutils apps release 1.2.68", support)));

logs(["008-x", "N001", [recorded("spn-support-ts", "2.0.0")]]);
one("[MKT.HOOKS.489] a major the log records passes with no developer words anywhere",
  !denied(verdict("spnutils apps release 2.0.0", support)));

logs(["008-x", "N001", [recorded("spn-platform-ts", "1.0.0")]]);
one("[MKT.HOOKS.489] a line recorded for another repository is no record for this one",
  asksForTheCommand(verdict("spnutils apps release 1.2.68", support)));

logs(["008-x", "N001", [recorded("spn-support-ts", "1.2.68", "2026-11-01T10:00+05:30")]], ["008-x", "N002", [recorded("spn-support-ts", "2.0.0", "2026-11-02T10:00+05:30")]]);
one("[MKT.HOOKS.489] the newest recorded line wins over an older one",
  !denied(verdict("spnutils apps release 2.0.0", support)) && asksForTheCommand(verdict("spnutils apps release 1.2.68", support)));

logs(["008-x", "N001", [unrelated]]);
one("[MKT.HOOKS.489] an omitted version passes: the CLI increments and never bumps a major",
  !denied(verdict("spnutils apps release", support)));
one("[MKT.HOOKS.489] a rehearsal passes, because it publishes nothing",
  !denied(verdict("spnutils apps release 2.0.0 --dry-run", support)));
one("[MKT.HOOKS.489] an unrelated command is not this check's business",
  !denied(verdict("npx nx run utility-ts:build", support)));

// ── which directory answers the question, which is where it was wrong ──

// The regression. Standing in one checkout and releasing another is the ordinary case in a workspace
// of seven, and it produced a refusal citing a repository the caller never named.
logs(["008-x", "N001", [recorded("spn-support-ts", "1.2.68"), recorded("spn-platform-ts", "0.1.1")]]);
one("[MKT.HOOKS.489] REGRESSION: cd into a repo, and its OWN tags decide",
  !denied(verdict(`cd ${support} && npx tsx apps/utility-ts/src/index.ts apps release 1.2.68`, platform)));

// The untouched twin: the fix must not make the check blind. Against a repository that really is at
// 0.1.0, 1.2.68 really is a major bump, where the log records a patch for it, and it must still be refused.
logs(["008-x", "N001", [recorded("spn-platform-ts", "1.0.0")]]);
one("[MKT.HOOKS.489] and a smaller bump than recorded is still refused after the cd, by that repo's own tags",
  denied(verdict(`cd ${platform} && spnutils apps release 0.1.1`, support)));

one("[MKT.HOOKS.489] a relative cd resolves against the session, not the root",
  commandCwd("cd spn-support-ts && spnutils apps release 1.2.68", join(BASE, "ws")) === support);
one("[MKT.HOOKS.489] an absolute cd is taken as it stands",
  commandCwd(`cd ${support} && x`, platform) === support);
one("[MKT.HOOKS.489] a quoted path survives a space in it",
  commandCwd(`cd '${support}' && x`, platform) === support);
one("[MKT.HOOKS.489] a semicolon separates as well as &&",
  commandCwd(`cd ${support}; x`, platform) === support);

// Not every command starting with those two letters is a `cd`, and a command this cannot read must
// fall back rather than guess — a wrong guess here reads the wrong repository's tags silently.
one("[MKT.HOOKS.489] no leading cd leaves the session's directory alone",
  commandCwd("spnutils apps release 1.2.68", support) === support);
one("[MKT.HOOKS.489] a bare cd with no separator is not parsed",
  commandCwd("cdk deploy && x", support) === support);

// ── the comparison itself ──

one("[MKT.HOOKS.489] a major bump is a higher first number, nothing else",
  isMajorBump("2.0.0", "1.9.9") && !isMajorBump("1.9.9", "1.2.0") && !isMajorBump("1.2.68", "1.2.67"));
one("[MKT.HOOKS.489] a version it cannot read is not a major bump, because it cannot prove one",
  !isMajorBump("latest", "1.2.67") && !isMajorBump("2.0.0", "not-a-version"));

// A repository with no tags at all has nothing to compare against, and a gate that refuses what it
// cannot understand is a gate somebody turns off.
const fresh = join(BASE, "ws", "untagged");
mkdirSync(fresh, { recursive: true });
git(["init", "-q"], fresh);
one("[MKT.HOOKS.489] a repository with no release tag is not this check's call",
  !denied(verdict("spnutils apps release 9.0.0", fresh)));
one("[MKT.HOOKS.489] a version it cannot read is not this check's call either",
  !denied(verdict("spnutils apps release latest", support)));

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
