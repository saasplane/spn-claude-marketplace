// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md · 05-artifacts.md · 02-document.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// The invariants a page must hold: every check `_lib.ts` carries for a page.
//
//   spn-devex docs audit check [<path>…] [--variant <name>] [--finding <name>]   the findings under the paths
//   spn-devex docs audit report <repo> [--json]                                   the gap scan, to stdout
//
// A SUBJECT WITH TWO ACTIONS, AND A `corpus` PATH. `check` reads every page of the repository each
// path sits in, because some findings compare one page with another, and it reports the findings
// under the paths. A path in no repository is read as it is. The two filters narrow what is reported
// and never what is read.
//
// Grades: RULE refuses, SOFT reports.

import { readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { type Action, FLAG, OPTIONAL, REQUIRED, onePath, readWords, repositoryOf, scopeOf, under } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { VARIANTS, audit, gapReport, isAuditedPage, readBlock, resolveWorkspace, walkFiles } from "./_lib.ts";

export const describe = "the invariants a page must hold";

/** The name of each kind of finding `check` can report: the word printed after the grade on a finding's line. */
export const FINDINGS = ["binds", "block", "cards", "codefig", "column", "contents", "depends", "furniture", "header", "link",
  "masthead", "outline", "overview", "produced", "proof", "status", "style", "styles", "treefig", "vocabulary"] as const;

const isDocument = (file: string): boolean => file.endsWith(".md") || file.endsWith(".html");

/**
 * The documents a path names. A folder means every document under it, by the walk `face` uses, so a
 * `templates/` folder is skipped by the rule that walk carries. A file is named as it is.
 */
function documentsAt(path: string): string[] {
  let folder = false;
  try { folder = statSync(path).isDirectory(); } catch { return [path]; }
  return folder ? walkFiles(path, isDocument) : [path];
}

function check(args: string[]): number {
  const words = readWords(args, { variant: VARIANTS, finding: FINDINGS });
  const paths = scopeOf(words.paths, OPTIONAL);
  const variants = words.values("variant"), names = words.values("finding");
  const workspace = resolve(resolveWorkspace());

  // WHAT IS READ IS WIDER THAN WHAT IS REPORTED. Each path brings every document of its repository,
  // and the documents it names itself; a path in no repository brings only those.
  const read = new Set<string>();
  const named = new Set<string>();
  for (const path of paths) {
    const repository = repositoryOf(path);
    if (repository) for (const file of documentsAt(repository)) read.add(file);
    for (const file of documentsAt(path)) { read.add(file); named.add(file); }
  }

  // A SAMPLE, A TEMPLATE AND A BUNDLED COPY ARE NOT PAGES, so none of them is audited or counted.
  const variantByFile = new Map<string, string>();
  const variantOf = (file: string): string => {
    if (!variantByFile.has(file)) {
      let variant = "";
      try { variant = readBlock(readFileSync(file, "utf8")).block?.variant ?? ""; } catch { variant = ""; }
      variantByFile.set(file, variant);
    }
    return variantByFile.get(file) ?? "";
  };
  const selected = (file: string): boolean => !variants.length || variants.includes(variantOf(file));
  const pages = [...named].filter(isAuditedPage).filter(selected);
  if (!pages.length) {
    console.log(variants.length && named.size ? `no page under that path declares the variant ${variants.join(" · ")}`
      : named.size ? "no page under that path — a sample, a template and a bundled copy are not audited as pages"
      : "no document under that path");
    return 0;
  }

  // A finding is reported where the file it is printed against sits under a path, and a finding
  // that compares several files where any one of them does.
  const found = audit([...read].filter(isAuditedPage), workspace).filter((finding) =>
    [finding.file, ...(finding.about ?? [])].some((file) => under(file, paths) && selected(file))
    && (!names.length || names.includes(finding.check)));
  const rule = found.filter((finding) => finding.grade === "RULE");
  for (const finding of found)
    console.log(`${finding.grade === "RULE" ? "✗" : "!"} ${finding.grade.padEnd(4)} ${finding.check.padEnd(9)} ${relative(workspace, finding.file)}\n         ${finding.message}`);
  console.log(found.length
    ? `\n${found.length} finding${found.length > 1 ? "s" : ""} — ${rule.length} RULE, ${found.length - rule.length} SOFT, over ${pages.length} page${pages.length > 1 ? "s" : ""}`
    : `\nclean — ${pages.length} page${pages.length > 1 ? "s" : ""}`);
  return rule.length ? 1 : 0;
}

function report(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  const repository = onePath(scopeOf(words.paths, REQUIRED));
  return gapReport(repository, resolve(resolveWorkspace()), words.given("json"));
}

export const actions: Record<string, Action> = {
  check: {
    describe: "the findings under the paths, read from the whole repository of each path",
    usage: "[<path>…] [--variant <name>] [--finding <name>]",
    run: check,
  },
  report: {
    describe: "the gap scan of one repository, printed; with --json, as data",
    usage: "<repo> [--json]",
    run: report,
  },
};
