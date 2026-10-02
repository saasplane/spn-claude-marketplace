// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md · 05-artifacts.md · 02-document.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// A numbered topic the constructs seat does not name, and two documents under one id.
//
//   spn-devex docs topics check [<path>…]   the findings under the paths
//
// A SUBJECT WITH ONE ACTION, AND A `tree` PATH. A path may be a repository, or a folder or a file
// inside one. The command finds the repository from the path and compares its three seats, and it
// reports the findings whose file sits under the path.

import { relative, resolve } from "node:path";
import { type Action, OPTIONAL, readWords, repositoryOf, scopeOf, under } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { duplicateIds, resolveWorkspace, topicsCheck } from "./_lib.ts";

export const describe = "a numbered topic the constructs seat does not name, and two documents under one id";

function check(args: string[]): number {
  const words = readWords(args);
  const paths = scopeOf(words.paths, OPTIONAL);
  const workspace = resolveWorkspace();
  // Each path brings its repository once. A path in no repository is read as it is.
  const repositories = [...new Set(paths.map((path) => repositoryOf(path) ?? resolve(path)))];
  const found = repositories.flatMap((repository) => [...topicsCheck(repository), ...duplicateIds(repository)])
    .filter((finding) => under(finding.file, paths));
  for (const finding of found)
    console.log(`${finding.grade === "RULE" ? "✗" : "!"} ${finding.grade.padEnd(4)} ${finding.check.padEnd(9)} ${relative(workspace, finding.file)}\n         ${finding.message}`);
  const rule = found.filter((finding) => finding.grade === "RULE").length;
  console.log(found.length ? `\n${found.length} finding(s) — ${rule} RULE, ${found.length - rule} SOFT` : `\nclean — ${repositories.length} repository(ies)`);
  return rule ? 1 : 0;
}

export const actions: Record<string, Action> = {
  check: {
    describe: "the topic and id findings under the paths, from the three seats of each path's repository",
    usage: "[<path>…]",
    run: check,
  },
};
