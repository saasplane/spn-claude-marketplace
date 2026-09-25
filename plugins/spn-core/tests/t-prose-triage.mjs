// `prose-triage` — the tool that scored a Hashicorp README as somebody's writing.
//
// The triage had no suite at all, which is why both of its defects were found by running it while
// looking for something else. The second one is the reason this file exists: it walked
// `spn-support-infra/tmp/`, a folder `.gitignore` names, and scored two paragraphs of a provider
// README that OpenTofu had downloaded. Those two went into a count seven arcs are judged by.
//
// The repair was not to add `tmp` to the typed skip list. A typed list is only ever as complete as
// the last defect somebody hit, and every future cache folder is the same defect waiting. Git
// already knows what a repository keeps, so the tool asks it.
//
// So these cases are about WHAT THE CORPUS IS, and each one has an untouched twin: for every file
// that must be dropped there is an identical file that must still be read, because a skip rule that
// silences real prose is worse than the defect it fixes.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const HOOKS = resolve(import.meta.dirname, "..");
const TOOL = join(HOOKS, "src", "scripts", "tools", "prose-triage.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-prose-triage-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let n = 0, failed = 0;

function run(args, cwd) {
  try { return { out: execFileSync("node", [TOOL, ...args], { encoding: "utf8", cwd }), code: 0 }; }
  catch (e) { return { out: String(e.stdout ?? ""), code: e.status ?? 1 }; }
}

function one(label, ok) {
  n += 1;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
}

function git(args, cwd) {
  execFileSync("git", args, { cwd, stdio: ["ignore", "ignore", "ignore"] });
}

/** The count the report prints, so a case asserts the number rather than the presence of a name. */
function candidates(out) {
  const found = out.match(/candidates\s+(\d+) paragraphs in (\d+) files/);
  return found ? { paragraphs: Number(found[1]), files: Number(found[2]) } : null;
}

/** One paragraph carrying a fault the tool can see: a bare pronoun opener. */
const FLAGGED = "# A page\n\nThis is the part that costs people time, so read the table instead.\n";

// ── a repository with an ignored folder in it, which is the shape the defect was found in ──

const repo = join(BASE, "repo");
mkdirSync(join(repo, "docs"), { recursive: true });
mkdirSync(join(repo, "tmp", "providers", "registry.example.org", "vendor"), { recursive: true });
writeFileSync(join(repo, ".gitignore"), "tmp\n");
writeFileSync(join(repo, "docs", "01-kept.md"), FLAGGED);
writeFileSync(join(repo, "tmp", "providers", "registry.example.org", "vendor", "README.md"), FLAGGED);
git(["init", "-q"], repo);

const scanned = run([repo], BASE);

one("the ignored provider README is not scored",
  !scanned.out.includes("vendor/README.md"));
one("the tracked page beside it still is",
  scanned.out.includes("01-kept.md"));
one("so the count is the corpus, not the disk",
  candidates(scanned.out)?.paragraphs === 1 && candidates(scanned.out)?.files === 1);

// The defect that survived the first fix: the ignored set was built from absolute paths and the walk
// compared relative ones, so the tool reported the identical count and nothing looked wrong. A case
// that only ran from one directory would have passed over it, so this one runs from inside the repo
// and asserts the same answer.
const fromInside = run(["."], repo);
one("run from inside the repository the answer is the same",
  candidates(fromInside.out)?.paragraphs === 1);
one("and it is the same file that was dropped",
  !fromInside.out.includes("vendor/README.md") && fromInside.out.includes("01-kept.md"));

// ── the untouched half: nothing outside a repository may go quiet ──

// A partner holds a folder that git knows nothing about. Nothing has said to drop it, so dropping it
// would be this tool inventing a rule. Silence here would be the failure the whole fix exists to
// avoid, in the other direction.
const loose = join(BASE, "loose");
mkdirSync(join(loose, "docs"), { recursive: true });
writeFileSync(join(loose, "docs", "01-loose.md"), FLAGGED);
const outside = run([loose], BASE);
one("a folder in no repository at all is still read",
  candidates(outside.out)?.paragraphs === 1 && outside.out.includes("01-loose.md"));

// An ignore rule that matched a name anywhere would take `docs/tmp-notes.md` with it. Git's own
// answer is a path, so a file whose NAME merely starts the same way is untouched.
writeFileSync(join(repo, "docs", "tmp-notes.md"), FLAGGED);
const nearMiss = run([repo], BASE);
one("a tracked file whose name begins like the ignored folder is kept",
  nearMiss.out.includes("tmp-notes.md") && candidates(nearMiss.out)?.paragraphs === 2);

// ── the ledger, which is how a judged false positive reaches zero ──

// Three of `N6`'s last sixty-three candidates were correct prose the pattern could not clear. They
// are recorded rather than rewritten, so the ledger is what makes "0 candidates" mean "0 a reader
// has not judged". A ledger that skipped the wrong file would hide real work, so it is keyed on
// content: edit the file and it comes back.
const ledger = join(BASE, "ledger.tsv");
writeFileSync(ledger, "");
run([repo, `--record=${ledger}`], BASE);
const afterRecord = run([repo, `--ledger=${ledger}`], BASE);
one("a recorded file is not reported again",
  candidates(afterRecord.out)?.paragraphs === 0);

writeFileSync(join(repo, "docs", "01-kept.md"), `${FLAGGED}\nThis is another one that reads the same way.\n`);
const afterEdit = run([repo, `--ledger=${ledger}`], BASE);
one("and editing it brings it straight back",
  afterEdit.out.includes("01-kept.md"));

// ── two patterns that flagged only good prose, and their twins (N55) ──

// The LEDGER above is for a judged exception: prose a generally-sound pattern cannot clear. These
// two are a different thing. `is always the` had ELEVEN hits across the whole workspace and not one
// was an abstraction — it is a copula that was sitting in a list of vague noun-phrases. `heartbeat`
// is this platform's own name for a mechanism, carried by `module-server-job-ts` through four source
// files, a behaviour row and an env var. A ledger entry would have hidden each next correct use.
//
// So every case here has the twin this file's header asks for: the sentence that must go quiet, and
// beside it one carrying a pattern that must still fire. A removal that silenced its neighbours
// would be worse than the false positives it fixed.
const patterns = join(BASE, "patterns");
mkdirSync(join(patterns, "docs"), { recursive: true });

const only = (name, body) => {
  const dir = join(patterns, name);
  mkdirSync(join(dir, "docs"), { recursive: true });
  writeFileSync(join(dir, "docs", "01-p.md"), `# A page\n\n${body}\n`);
  return candidates(run([dir], BASE).out);
};

one("a concrete claim using 'is always the' is not an abstraction",
  only("copula", "The private zone is always the child name, never the apex.")?.paragraphs === 0);
one("but a vague noun-phrase still is",
  only("vague", "The thing that matters here is left for the reader to work out.")?.paragraphs === 1);
one("and 'comes down to' still is",
  only("comes", "Whether it holds comes down to something nobody has written down yet.")?.paragraphs === 1);

one("'heartbeat' is a named mechanism, not a figure of speech",
  only("term", "The reconcile heartbeat re-arms every schedule whose next firing is already past.")?.paragraphs === 0);
one("but 'lifeblood' is still a metaphor",
  only("blood", "The registry is the lifeblood of every platform that reads from it.")?.paragraphs === 1);
one("and 'wedded to' still is",
  only("wed", "The release is wedded to the branch it was cut from, for better or worse.")?.paragraphs === 1);

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
