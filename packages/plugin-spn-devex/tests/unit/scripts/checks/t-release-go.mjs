import { PLUGIN } from "../../../helpers/harness.mjs";
// `release-go` — the check that refused a correct release, naming a version nobody typed.
//
// It guards the one act that cannot be taken back: a major release the developer never agreed to.
// Minor and patch are the standing authorization in `N39`, so the check reads the bump size and
// looks for the go of an arc in an open workstream whose words name the version (RD.DEVEX.WORKSPACE.069).
// The go is read as `confirmed.ts` reads it, from the arc's `state.json` and `log.jsonl`: the arc reads
// `DECIDED`, `RUNNING` or `LANDED`, and its log holds the line that moved it out of `PROPOSED` with words.
//
// EVERY REFUSAL IS READ FOR WHAT IT ASKS. A refusal that still asks for the retired `- **<date> — go.**`
// line in an arc's `## Log` sends the agent to write a form nothing reads, so a refused case passes only
// when its message names the command that records a go, and never the old line.
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

// The log lines the commands write, by the words `arc edit` puts in each.
const AT = "2026-10-24T20:05+05:30";
const opened = { at: AT, kind: "opened", row: null, note: "opened as PROPOSED" };
const goFor = (version) => ({ at: AT, kind: "status", row: null, note: `PROPOSED → DECIDED · the developer, 24 Oct: 'go, and release it as ${version}'` });
const runs = { at: AT, kind: "status", row: null, note: "DECIDED → RUNNING · row 1 running" };
const reopened = { at: AT, kind: "status", row: null, note: "RUNNING → PROPOSED · rows 4 to 6 are new scope" };
const noteNaming = (version) => ({ at: AT, kind: "note", row: null, note: `the release will be ${version}` });
// An arc opened straight at DECIDED on the developer's words, as one go opens every step's arc (RD.DEVEX.WORKSPACE.280).
const openedOnAGoFor = (version) => ({ at: AT, kind: "opened", row: null, note: `decided on N001's go, the developer: 'release it as ${version}'` });

/** An arc's data and log in an open workstream, as the `workstream` commands write them. */
function arc(workstream, id, status, lines) {
  const dir = join(open, workstream, "arcs", id);
  mkdirSync(dir, { recursive: true });
  // RUNNING is worked out from the steps, never stored: an arc that runs stores the developer's DECIDED, and a step runs.
  const data = { schemaVersion: 2, arc: id, subject: "a-subject", title: "a subject", goal: null, status: status === "RUNNING" ? "DECIDED" : status, reason: null,
    preview: "preview.html", rows: [{ id: "1", parent: id, title: "release it", kind: "change", state: status === "RUNNING" ? "running" : "waiting" }] };
  writeFileSync(join(dir, "state.json"), `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(join(dir, "log.jsonl"), lines.map((line) => JSON.stringify(line)).join("\n") + "\n");
}

arc("008-x", "N001", "RUNNING", [opened, goFor("3.0.0"), runs]);                 // a go naming 3.0.0
arc("008-x", "N002", "DECIDED", [openedOnAGoFor("5.0.0")]);                        // opened on a go naming 5.0.0
arc("008-x", "N003", "PROPOSED", [opened, goFor("6.0.0"), runs, reopened]);      // the go is gone again
arc("008-x", "N006", "PROPOSED", [opened, noteNaming("8.0.0")]);                  // a plan naming 8.0.0
arc("008-x", "N004", "DECIDED", [opened, noteNaming("4.0.0")]);                   // DECIDED with no go in its log
arc("008-x", "N005", "RUNNING", [opened, goFor("12.0.0"), runs]);                 // a go naming 12.0.0, not 2.0.0
// The retired form, still on disk in an open workstream: a dated go line in an arc kept as Markdown.
mkdirSync(join(open, "009-old", "arcs"), { recursive: true });
writeFileSync(join(open, "009-old", "arcs", "N1-x.md"), "# N1\n\n## Log\n\n- **2026-09-23 — go.** Release this as 7.0.0.\n");

const verdict = (command, cwd) => checkReleaseGo({ tool_name: "Bash", cwd: cwd, tool_input: { command: command } });
const denied = (v) => typeof v?.deny === "string";
// A refusal names the command that records a go, and never the line form the arcs left at N002.
const RECORDS_A_GO = "workstream arc edit <ws>/<arc> --status DECIDED --note";
const asksForTheCommand = (v) => denied(v) && v.deny.includes(RECORDS_A_GO) && !v.deny.includes("— go.**") && !v.deny.includes("## Log");

// ── the bump rule, which is what the check is for ──

one("a patch release passes, being the standing authorization",
  !denied(verdict("spnutils apps release 1.2.68", support)));
one("a minor release passes too",
  !denied(verdict("spnutils apps release 1.3.0", support)));
one("a major release with no recorded go is refused, and the refusal asks for the go's command",
  asksForTheCommand(verdict("spnutils apps release 2.0.0", support)));

// ── where the go is read: the arc's data, as `confirmed.ts` reads it ──

one("a major release under an arc whose log holds its go, naming the version, passes",
  !denied(verdict("spnutils apps release 3.0.0", support)));
one("an arc opened at DECIDED on words naming the version holds that go too",
  !denied(verdict("spnutils apps release 5.0.0", support)));
one("an arc moved back to PROPOSED holds no go, though its log once named the version",
  asksForTheCommand(verdict("spnutils apps release 6.0.0", support)));
one("a PROPOSED arc whose plan names the version holds no go",
  asksForTheCommand(verdict("spnutils apps release 8.0.0", support)));
one("DECIDED with no go in its log: a note naming the version is no go",
  asksForTheCommand(verdict("spnutils apps release 4.0.0", support)));
one("a go naming 12.0.0 is no go for 2.0.0",
  asksForTheCommand(verdict("spnutils apps release 2.0.0", support)));
one("a dated go line in an arc kept as Markdown counts for nothing",
  asksForTheCommand(verdict("spnutils apps release 7.0.0", support)));
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
