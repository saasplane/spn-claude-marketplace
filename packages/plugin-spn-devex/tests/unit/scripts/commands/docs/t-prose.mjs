import { PLUGIN } from "../../../../helpers/harness.mjs";
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

const HOOKS = PLUGIN;
const TOOL = join(HOOKS, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-prose-triage-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let n = 0, failed = 0;

/** One `docs prose list` through the entry, with what was typed after the action. */
function run(args, cwd) {
  return typed(["list", ...args], cwd);
}

/** One run of `docs prose` through the entry, typed after the subject. A refusal's text is handed back with the rest. */
function typed(args, cwd) {
  try { return { out: execFileSync(process.execPath, [TOOL, "docs", "prose", ...args], { encoding: "utf8", cwd, stdio: "pipe" }), code: 0 }; }
  catch (e) { return { out: String(e.stdout ?? "") + String(e.stderr ?? ""), code: e.status ?? 1 }; }
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

// A QUOTATION ON AN HTML PAGE IS WRITTEN WITH ENTITIES. The marks were read as text, so a quoted idiom
// was scored as the page's own words, and an agent reworded a quotation to pass (workstream 008).
const html = (name, paragraph) => {
  const dir = join(patterns, name);
  mkdirSync(join(dir, "docs"), { recursive: true });
  const file = join(dir, "docs", "page-overview.html");
  writeFileSync(file, `<meta charset="utf-8"><section id="s1"><p>${paragraph}</p></section>\n`);
  return candidates(run([file], BASE).out);
};
one("an idiom quoted with &ldquo; and &rdquo; is a quotation",
  html("entity-quote", "The earlier welcome said &ldquo;it works out of the box&rdquo; and that line was removed from every page last week.")?.paragraphs === 0);
one("the same idiom quoted with numeric entities is a quotation",
  html("numeric-quote", "The earlier welcome said &#8220;it works out of the box&#8221; and that line was removed from every page last week.")?.paragraphs === 0);
one("known-bad: the same idiom with no quotation marks is still flagged",
  html("bare-idiom", "The earlier welcome works out of the box and that line was removed from every page last week.")?.paragraphs === 1);

// ── the grammar: an action as a word, the files it names, and a filter ──

{
  const LIST_USAGE = "usage: spn-devex docs prose list [<path>…] [--comments] [--ledger=<file>] [--record=<file>] [--variant <name>]";
  const PARAGRAPHS_USAGE = "usage: spn-devex docs prose paragraphs <file>";
  const USAGE = `${LIST_USAGE}\n${PARAGRAPHS_USAGE.replace("usage: ", "       ")}\n`;
  const blockOf = (variant) => `<!-- spn:doc\n${JSON.stringify({ id: variant, variant, title: "A page", lenses: ["QA"], summary: "s" })}\n-->\n\n`;
  // A repository, so a run with no path has one to take: two flagged documents of two variants, and one with no block.
  const home = join(BASE, "home");
  mkdirSync(join(home, "docs", "sub"), { recursive: true });
  writeFileSync(join(home, "sprepo.json"), '{"type":"APPS","name":"t","config":null}');
  writeFileSync(join(home, "docs", "01-construct.md"), blockOf("construct") + FLAGGED);
  writeFileSync(join(home, "docs", "02-report.md"), blockOf("report") + FLAGGED);
  writeFileSync(join(home, "docs", "sub", "03-plain.md"), FLAGGED);

  const bare = typed([], home);
  one("[MKT.SCRIPTS.111] with no action the entry prints each usage line, says an action is owed and exits 2",
    bare.code === 2 && bare.out === `${USAGE}\`docs prose\` needs an action.\n`);
  const asOption = typed(["--paragraphs", join(home, "docs", "01-construct.md")], home);
  one("[MKT.SCRIPTS.111] `--paragraphs` where the action belongs is named as the action `paragraphs`",
    asOption.code === 2 && asOption.out === `${USAGE}\`docs prose\` needs an action. \`--paragraphs\` is the action \`paragraphs\`.\n`);
  one("[MKT.SCRIPTS.111] a path where the action belongs is refused with exit 2", typed([home], BASE).code === 2);
  const option = typed(["list", home, "--json"], BASE);
  one("an option the command does not take is refused by its name, with exit 2",
    option.code === 2 && option.out === `${LIST_USAGE}\n\`docs prose list\` does not take \`--json\`.\n`);
  one("`paragraphs` takes no option of `list`", typed(["paragraphs", join(home, "docs", "01-construct.md"), "--comments"], BASE).code === 2);

  const whole = typed(["list", home], BASE);
  one("known-bad: the repository, listed, reports all three documents", candidates(whole.out)?.paragraphs === 3 && candidates(whole.out)?.files === 3);
  const oneFolder = typed(["list", join(home, "docs", "sub")], BASE);
  one("a folder names the documents under it, and no document beside it",
    candidates(oneFolder.out)?.files === 1 && oneFolder.out.includes("03-plain.md") && !oneFolder.out.includes("01-construct.md"));
  const twoPaths = typed(["list", join(home, "docs", "sub"), join(home, "docs", "02-report.md")], BASE);
  one("several paths are one run", candidates(twoPaths.out)?.files === 2 && !twoPaths.out.includes("01-construct.md"));
  const inside = typed(["list"], join(home, "docs"));
  one("[MKT.SCRIPTS.113] with no path `list` takes the repository the caller is in, from a folder inside it too",
    candidates(typed(["list"], home).out)?.files === 3 && candidates(inside.out)?.files === 3);
  const outside = typed(["list"], BASE);
  one("[MKT.SCRIPTS.113] where the caller is in no repository, `list` with no path says to name one, and exits 2",
    outside.code === 2 && outside.out === `${LIST_USAGE}\n\`docs prose list\` needs a path here, because the folder it is run from is in no repository. Name a repository.\n`);

  const constructs = typed(["list", home, "--variant", "construct"], BASE);
  one("[MKT.SCRIPTS.139] `--variant construct` reads the documents whose block declares that variant, and no other",
    candidates(constructs.out)?.files === 1 && constructs.out.includes("01-construct.md") && !constructs.out.includes("02-report.md") && !constructs.out.includes("03-plain.md")
      && /scanned\s+1 files/.test(constructs.out));
  const twoVariants = typed(["list", home, "--variant", "construct", "--variant=report"], BASE);
  one("[MKT.SCRIPTS.139] `--variant` typed twice reads both kinds, and never a document with no block",
    candidates(twoVariants.out)?.files === 2 && !twoVariants.out.includes("03-plain.md"));
  const noSuch = typed(["list", home, "--variant", "guide"], BASE);
  one("[MKT.SCRIPTS.139] a variant no document declares reads nothing, and exits 0", noSuch.code === 0 && /scanned\s+0 files/.test(noSuch.out));
  const outsideSet = typed(["list", home, "--variant", "chapter"], BASE);
  one("[MKT.SCRIPTS.115] a variant outside the set is refused with the set, and exit 2",
    outsideSet.code === 2 && outsideSet.out.includes("takes `--variant` from approach · overview · construct") && outsideSet.out.includes("and `chapter` is none of them."));

  const printed = typed(["paragraphs", join(home, "docs", "01-construct.md")], BASE);
  one("[MKT.SCRIPTS.140] `paragraphs` prints each flagged paragraph of the one file, under a line that names the file and the fault",
    printed.code === 0 && /--- \S*01-construct\.md  \[opener: /.test(printed.out) && printed.out.includes("This is the part that costs people time")
      && !printed.out.includes("02-report.md"));
  const noFile = typed(["paragraphs"], home);
  one("[MKT.SCRIPTS.140] `paragraphs` with no file says a path is owed and exits 2, from inside a repository too",
    noFile.code === 2 && noFile.out === `${PARAGRAPHS_USAGE}\n\`docs prose paragraphs\` needs a path.\n`);
  one("[MKT.SCRIPTS.140] and a second file is refused with exit 2",
    typed(["paragraphs", join(home, "docs", "01-construct.md"), join(home, "docs", "02-report.md")], BASE).code === 2);
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
