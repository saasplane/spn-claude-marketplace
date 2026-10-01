import { WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
// `arc-status` — an arc's status is one of eight (RD.DEVEX.WORKSPACE.058).
//
// BOTH DIRECTIONS ARE CASES, because a check that only ever speaks is the same defect as one that
// never does, wearing the other sign. The set drifted in the first place while a template comment
// declared it and nothing read it.

const { checkArcStatus, STATUSES, statusIn } = await import("../../../../src/scripts/checks/arc-status.ts");

let n = 0, failed = 0;
const ARC = `/w/.spndevex/${WORKSTREAMS}/open/008-x/arcs/N1-a-subject.md`;
const verdict = (text, path = ARC) =>
  checkArcStatus({ tool_name: "Write", tool_input: { file_path: path, content: text } });

function one(what, text, expected, path = ARC) {
  n += 1;
  const v = verdict(text, path);
  // IT REFUSES NOW RATHER THAN ADVISING (N66). The check shipped soft on purpose and its own note
  // said it would advise until the corpus was clean under it; the corpus was cleaned on 2026-09-24
  // and the word flipped. These cases read `deny` for the same reason they read `note` before — the
  // question they ask is whether the check SPEAKS about a word outside the set, not how loudly.
  const got = v && (v.deny || v.note) ? "note" : "silent";
  const ok = got === expected;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${what} -> ${got}`);
}

console.log("\n=== every word of the set is silent, and the set is read from the check itself");
for (const word of STATUSES) one(`Status: **${word}`, `# N1\n\nStatus: **${word} — a line.**`, "silent");

console.log("\n=== the words the corpus actually drifted to, each a known-bad");
// MEASURED over workstream `008` on 2026-09-23: these are the real off-vocabulary statuses found,
// not invented ones. A check proven against words nobody writes is proven against nothing.
for (const word of ["IMPLEMENTING", "PLANNING", "OPEN", "TAKEN", "DONE"])
  one(`Status: **${word} is off the set`, `# N1\n\nStatus: **${word} — a line.**`, "note");

console.log("\n=== the second spelling is read, because the corpus has both");
one("**Status: LANDED", "# N1\n\n**Status: LANDED 2026-09-23 — all six steps.**", "silent");
one("**Status: DONE", "# N1\n\n**Status: DONE 2026-09-23.**", "note");

console.log("\n=== what it must never speak about");
one("an edit that touches no status line", "# N1\n\nsome prose about the arc", "silent");
one("a file outside an arcs/ folder", "Status: **DONE**", "silent", "/w/spn-foundation/docs/README.md");
one("a note file beside the arcs", "Status: **DONE**", "silent", `/w/.spndevex/${WORKSTREAMS}/open/008-x/notes/N-plan.md`);

console.log("\n=== an arc file named with three digits is read as an arc file");
{
  const THREE = `/w/.spndevex/${WORKSTREAMS}/open/020-x/arcs/N001-book-change.md`;
  one("a word off the set in N001-book-change.md", "# N001\n\nStatus: **DONE — a line.**", "note", THREE);
  one("a word of the set in N001-book-change.md", "# N001\n\nStatus: **PROPOSED — a line.**", "silent", THREE);
  one("a file under notes/N001/ is not an arc file", "Status: **DONE**", "silent", `/w/.spndevex/${WORKSTREAMS}/open/020-x/notes/N001/plan.md`);
  n += 1;
  const named = (verdict("# N001\n\nStatus: **DONE**", THREE)?.deny ?? "").includes("`N001-book-change.md`");
  if (!named) failed += 1;
  console.log(`  ${named ? "PASS" : "FAIL"}  the refusal names the arc file`);
}

console.log("\n=== the reader itself");
{
  n += 1;
  const ok = statusIn("# N1\n\nStatus: **PART-LANDED — three of nine.**") === "PART-LANDED";
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  a hyphen is part of the word, so PART-LANDED is not PART`);
}

console.log("\n=== which statuses are past DECIDED, in the order of the set");
{
  const { pastDecided } = await import("../../../../src/scripts/checks/arc-status.ts");
  for (const [word, expected] of [["PROPOSED", false], ["DECIDED", false], ["RUNNING", true], ["HELD", true],
    ["PART-LANDED", true], ["LANDED", true], ["CARRIED", true], ["DROPPED", true], ["OPEN", false], [null, false]]) {
    n += 1;
    const ok = pastDecided(word) === expected;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  [MKT.HOOKS.40] ${word ?? "an arc with no status"} is ${expected ? "" : "not "}past DECIDED`);
  }
}

console.log(failed ? `  ${failed} FAILED` : `  all ${n} passed`);
process.exit(failed ? 1 : 0);
