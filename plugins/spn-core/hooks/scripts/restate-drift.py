#!/usr/bin/env python3
"""Do the plugins still say what the book says?

A plugin file restates chapters of the foundation book and adds no rule of its own
(RD.DOCS.055, and `04-devex/10-delivery.md` makes it a MUST in both directions). Nothing has
ever checked it. When you changed a chapter and asked which files restate it, the only answer
was re-reading everything.

`coherence.py` cannot take this question. Its contract is *run in any repo*, and all of its
questions compare documents inside ONE repo. **No repo holds both trees** — there is no book in
the marketplace and no plugins in the foundation. So this check crosses the boundary, and it is
the only thing here that does.

A PARTNER NEVER RUNS THIS, AND THAT IS CORRECT. They hold the plugins and not the book. What the
Foundation publishes is the corrected restatement, never the checker. You run it here, before you
publish — so with no book to compare against it prints one line and exits clean, the property
`partner-shape.py` tests.

    restate-drift.py [path/to/spn-foundation]

With no argument it looks for a sibling checkout carrying the register. Exit code is the number
of findings.
"""
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import restates                                                    # noqa: E402

ROOT = pathlib.Path(".")
PLUGINS = sorted(ROOT.glob("plugins/**/*.md"))


def find_book(argument):
    """The book's location, or None. An explicit path wins and is never second-guessed."""
    if argument:
        given = pathlib.Path(argument)
        return given if (given / "docs/registers/decisions.md").is_file() else None
    # A sibling checkout, which only a producer workspace has. Named by what it CARRIES rather
    # than by what it is called, so a differently-named checkout still answers.
    for sibling in sorted(ROOT.resolve().parent.iterdir()):
        if (sibling / "docs/registers/decisions.md").is_file() and (sibling / "CONCEPT.md").is_file():
            return sibling
    return None


def main():
    if not PLUGINS:
        print("no plugins here — nothing restates the book in this repo")
        return 0

    book = find_book(sys.argv[1] if len(sys.argv) > 1 else None)
    if book is None:
        print(f"{len(PLUGINS)} plugin document(s) · no foundation book to compare against — quiet")
        print("  A partner holds the plugins and not the book, so this check is a builder's gate.")
        print("  Pass the book's path to run it: restate-drift.py path/to/spn-foundation")
        return 0

    known_rows = restates.register_rows(book / "docs/registers/decisions.md")
    findings, omissions, stamped, unstamped, unclassified = [], [], 0, [], set()
    for path in PLUGINS:
        block, broken = restates.parse(path)
        if broken:
            findings.append(f"{path}: {broken}")
            continue
        if block is None:
            if restates.declares_a_source(path):
                unstamped.append(path)
            continue
        stamped += 1
        findings.extend(restates.check(path, block, book, known_rows))
        omissions += [f"{path}: restates `{name}` and does not declare it"
                      for name in restates.undeclared(path, block)]
        unclassified.update(restates.named_sources(path)[2])

    for finding in findings:
        print(f"DRIFT       {finding}")
    if omissions:
        print()
        print(f"UNDECLARED  {len(omissions)} source(s) a block leaves out. The file restates them")
        print("            and nothing watches them, so a moved chapter reaches nobody:")
        for omission in omissions:
            print(f"              {omission}")

    if unstamped:
        print()
        print(f"UNSTAMPED   {len(unstamped)} file(s) say what they restate in prose and carry no block.")
        print("            The sentence is not machine-readable, so no run can name them when a chapter moves:")
        for path in unstamped[:10]:
            print(f"              {path}")
        if len(unstamped) > 10:
            print(f"              … and {len(unstamped) - 10} more")

    if unclassified:
        print()
        print(f"UNREAD      {len(unclassified)} name(s) in a declaration that no rule here can")
        print("            resolve to a document, so nothing compares them. This check")
        print("            under-reports by exactly this much, and says so rather than hiding it:")
        print("              " + " · ".join(sorted(unclassified)[:12]))

    print()
    print(f"{len(PLUGINS)} plugin document(s) · {stamped} carrying spn:restates · "
          f"{len(findings)} drift · {len(omissions)} undeclared · {len(unstamped)} unstamped · "
          f"{len(unclassified)} unread name(s) — book at {book}")
    # UNSTAMPED IS REPORTED AND DOES NOT FAIL. It is coverage, not drift: those files are not
    # wrong, they are unmeasured. Failing on them would leave the gate red from the day it shipped
    # until somebody hand-wrote every last block — and a gate that is always red is one nobody
    # reads, which is the argument this whole construct rests on.
    # AN OMISSION FAILS, WHERE AN UNSTAMPED FILE DOES NOT. The unstamped list is the whole tree
    # on day one, and a gate that is always red is one nobody reads. An omission is bounded and
    # each one has a named fix: add the citation the file already says it restates.
    return len(findings) + len(omissions)


if __name__ == "__main__":
    sys.exit(min(main(), 250))
