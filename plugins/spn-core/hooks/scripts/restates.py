#!/usr/bin/env python3
"""The `spn:restates` block: how it is written, and what a hash covers.

Two checks read this block and they must read it identically. `coherence.py` compares the
foundation's own provider restatements against its chapters, inside one repo. `restate-drift.py`
compares the marketplace's plugin restatements against a book it is handed. Writing the parser
twice would be the defect this construct exists to stop — the same rule stated twice, drifting,
with nothing comparing them (RD.DOCS.055).

THE BLOCK

    <!-- spn:restates
    {
      "chapters": [
        { "path": "CONCEPT.md", "section": "Kind Tests", "seen": "3f9c1e7a" },
        { "path": "docs/03-capabilities/02-apps/06-tests/README.md", "seen": "b204d81c" }
      ],
      "rows": ["RD.APPS.086"]
    }
    -->

A CITATION IS AN OBJECT, and it carries its own `seen` (workstream 009, `Q11` answered A).
`section` is optional: name one and the hash covers that heading's own text, leave it out and
the hash covers the whole file. So a citation is exactly as precise as the sentence it replaces.

WHY NOT ONE `seen` FOR THE BLOCK. `CONCEPT.md` is over seven thousand lines and eight
restatements cite it. The QA lens cites one section of about a hundred lines. A hash over the
whole file re-stamps that lens every time anything else in the file moves — measured at roughly
176 re-stamps in sixty days, almost all of them on content nobody cited. A finding that is
usually wrong teaches people to stop reading the run.
"""
import re
import json
import hashlib

BLOCK = re.compile(r"<!--\s*spn:restates\s*(\{.*?\})\s*-->", re.S)
# The DECLARATION form, which carries a colon. Bare prose does not declare anything, and one
# skill says *a node that restates what its kind already implies has introduced a second
# source of truth* — a sentence about the defect, matched as a declaration by a looser rule.
SOURCE_LINE = re.compile(r"^.*Source of truth\s*:?\*{0,2}\s*:.*$|^.*\*\*Source of truth:\*\*.*$", re.M | re.I)
ROW_ID = re.compile(r"\bRD\.[A-Z]+\.\d{3}\b")
HEADING = re.compile(r"^(#{1,6})[ \t]+(.+?)[ \t]*$", re.M)


def normalize(text):
    """What a hash is taken over.

    Trailing whitespace and surrounding blank lines are invisible to a reader, so a change to
    them is not a change to the rule. Everything else counts, including a reordering — a rule
    list whose order changed is a rule list the restatement may now get wrong.
    """
    lines = [line.rstrip() for line in text.replace("\r\n", "\n").split("\n")]
    while lines and not lines[0]:
        lines.pop(0)
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def seen_hash(text):
    """Eight hex characters. Long enough that a collision is not the failure you will meet."""
    return hashlib.sha256(normalize(text).encode("utf-8")).hexdigest()[:8]


def section_text(document, section):
    """One heading's own text, to the next heading at the same level or above.

    Returns None where no heading matches, which is itself the finding: a section that was
    renamed reads as absent, and a restatement citing it is pointing at nothing.
    """
    wanted = section.strip().lower()
    matches = list(HEADING.finditer(document))
    for index, match in enumerate(matches):
        title = match.group(2).strip().lower()
        # Compared with the heading's own decoration removed, so `## *Kind Tests*` and a
        # citation of `Kind Tests` are the same section. A citation names the words.
        if re.sub(r"[^a-z0-9 ]", "", title) != re.sub(r"[^a-z0-9 ]", "", wanted):
            continue
        depth = len(match.group(1))
        end = len(document)
        for later in matches[index + 1:]:
            if len(later.group(1)) <= depth:
                end = later.start()
                break
        return document[match.end():end]
    return None


def parse(path):
    """The block in one file. Returns (block, error) — exactly one of them is None."""
    text = path.read_text(encoding="utf-8", errors="replace")
    found = BLOCK.search(text)
    if found is None:
        return None, None
    try:
        block = json.loads(found.group(1))
    except json.JSONDecodeError as broken:
        return None, f"spn:restates is not valid JSON — {broken.msg} at line {broken.lineno}"
    if not isinstance(block.get("chapters", []), list):
        return None, "spn:restates `chapters` must be a list of citations"
    return block, None


def declares_a_source(path):
    """A file that says what it restates in PROSE, whether or not it carries the block.

    Metadata is stripped first. `spn:doc` carries a `summary` field, and a summary describing a
    standard can hold the words *source of truth* without the file declaring anything — one
    provider guideline does exactly that. Reading it as a declaration reports a file as unstamped
    that never claimed a source at all.
    """
    text = re.sub(r"<!--.*?-->", "", path.read_text(encoding="utf-8", errors="replace"), flags=re.S)
    return bool(SOURCE_LINE.search(text))


def check(path, block, book_root, known_rows):
    """Every finding one restatement's block earns. Empty where it is current.

    `known_rows` may be empty, and then row citations are not checked at all — a repo holding
    no register is a fact about that repo rather than a finding about it.
    """
    findings = []
    for citation in block.get("chapters", []):
        if not isinstance(citation, dict) or "path" not in citation:
            findings.append(f"{path}: a citation must be an object with a `path`")
            continue
        cited = book_root / citation["path"]
        if not cited.is_file():
            findings.append(f"{path}: cites `{citation['path']}`, which does not resolve")
            continue
        document = cited.read_text(encoding="utf-8", errors="replace")
        where = citation["path"]
        if citation.get("section"):
            document = section_text(document, citation["section"])
            where = f"{citation['path']} § {citation['section']}"
            if document is None:
                findings.append(f"{path}: cites `{where}`, and no such heading exists")
                continue
        current = seen_hash(document)
        stamped = citation.get("seen")
        if stamped is None:
            findings.append(f"{path}: cites `{where}` with no `seen` — nothing to compare")
        elif stamped != current:
            findings.append(
                f"{path}: `{where}` has moved since this file restated it "
                f"— seen {stamped}, now {current}"
            )
    for row in block.get("rows", []):
        if known_rows and row not in known_rows:
            findings.append(f"{path}: cites `{row}`, which the register does not carry")
    return findings


def register_rows(register):
    """Every decision id the register declares. Empty where there is no register to read."""
    if not register.is_file():
        return set()
    return set(ROW_ID.findall(register.read_text(encoding="utf-8", errors="replace")))
