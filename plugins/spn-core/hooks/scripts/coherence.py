#!/usr/bin/env python3
"""Check the corpus against itself, rather than against its own form.

Every other validator in this repo asks whether a document is well-formed: links
resolve, metadata parses, statuses are legal. All of them pass while two documents
state opposite rules, because nothing compares one rule to another.

This asks four questions that only have answers across documents:

  VOCABULARY   does every closed vocabulary say the same thing everywhere it appears
  RULING       does a register ruling survive contact with the documents it governs
  OWNERSHIP    is one subject ruled on by two documents that do not cite each other
  CARDINALITY  does prose write a count into a set that is free to grow

Run from the repo root. Exit code is the number of findings.
"""
import re
import sys
import pathlib
from collections import defaultdict

ROOT = pathlib.Path(".")
SOURCES = sorted(
    {*ROOT.glob("docs/**/*.md"), *ROOT.glob("providers/**/*.md"),
     ROOT / "CONCEPT.md", ROOT / "README.md", ROOT / "CLAUDE.md"}
)
REGISTER = ROOT / "docs/registers/decisions.md"

# Prose that is deliberately historical: a superseded ruling keeps its old words on
# purpose, and an artifact describes the moment it was produced (RD.DOCS.021).
HISTORICAL = re.compile(r"~~.*?~~|<del>.*?</del>", re.S)


def body(path):
    """A document's prose, with fences, metadata and struck-through text removed."""
    t = path.read_text()
    t = re.sub(r"<!--.*?-->", "", t, flags=re.S)
    t = re.sub(r"```.*?```", "", t, flags=re.S)
    return HISTORICAL.sub("", t)


def vocabulary():
    """A closed vocabulary must read identically everywhere it is written."""
    seen = defaultdict(dict)
    for p in SOURCES:
        for m in re.finditer(r"^(SP[A-Za-z]+Type)\s+(.+?)(?=\n\S|\n\n|\Z)",
                             p.read_text(), re.M | re.S):
            name, values = m.group(1), frozenset(re.findall(r"\b[A-Z][A-Z_0-9]+\b", m.group(2)))
            if values:
                seen[name][str(p)] = values
    out = []
    for name, where in seen.items():
        if len(set(where.values())) > 1:
            variants = sorted(where.items(), key=lambda kv: len(kv[1]), reverse=True)
            widest = variants[0][1]
            for src, vals in variants[1:]:
                if vals != widest:
                    missing = sorted(widest - vals) or "—"
                    extra = sorted(vals - widest) or "—"
                    out.append(f"VOCABULARY  {name} differs in {src}\n"
                               f"            missing {missing} · extra {extra}\n"
                               f"            widest form is {variants[0][0]}")
    return out


# A bolded COMPLETE sentence — long enough to be a claim, and punctuated like one. Emphasis on a
# phrase is not this; a second ruling hiding in a long cell is.
BURIED = re.compile(r"\*\*([^*]{25,}?[.!?])\*\*")


def rulings():
    """One ruling per row, and the whole decision column is that ruling.

    The register has a `Why` column, so the decision column carries no reasoning and no
    second answer. A row that holds two rulings is two rows: the one a reader meets first
    is the one they act on, and the other is invisible until somebody reads the whole cell.
    `RD.SAAS.035` carried a MUST two hundred words in, which is the case this was written for.

    **Bold is ordinary emphasis in a row**, so its absence proves nothing and is not checked.
    What is checked is a bolded complete SENTENCE after the opening one, which is what a
    buried ruling looks like every time it has appeared.
    """
    split, long = [], []
    for row in re.findall(r"^\| (RD\.[A-Z]+\.\d+) \| (.+?) \| .+? \| .+? \|$",
                          REGISTER.read_text(), re.M):
        rid, text = row
        body = re.sub(r"^\*\*.+?\*\*", "", text, count=1)   # the opening claim is the ruling
        buried = BURIED.findall(body)
        if buried:
            split.append((len(buried), rid, " ".join(buried[0].split())[:80]))
        elif len(text.split()) > 150:
            long.append((len(text.split()), rid, ""))
    if not split and not long:
        return []
    # ONE finding, not one per row. A third of the register predates this rule, and printing a
    # line each buries every other question this script asks. The counts are the backlog, and
    # the worst ten are what somebody can pick up today — nothing is dropped silently.
    out = [f"RULING      {len(split)} row(s) hold more than one ruling, and {len(long)} run past "
           f"150 words in one decision cell.\n"
           f"            One ruling per row; reasoning belongs in `Why`. Worst first:"]
    for count, rid, sample in sorted(split, reverse=True)[:6]:
        out[0] += f"\n              {rid:<16} +{count} buried · {sample}…"
    for words, rid, _ in sorted(long, reverse=True)[:4]:
        out[0] += f"\n              {rid:<16} {words} words"
    return out


def ownership():
    """Two documents ruling on one subject, neither citing the other."""
    out = []
    # A rule bullet is a bolded lead-in at the start of a list item or numbered rule.
    owners = defaultdict(list)
    for p in SOURCES:
        # The concept may not cite a seat or a chapter at all — it links only outward
        # (RD.DOCS.012), so it can never satisfy this check and is not in scope for it.
        # Its disagreements with the chapters are a different question, settled by which
        # side is newer rather than by who owns the rule.
        if str(p) == "CONCEPT.md":
            continue
        if "registers/decisions.md" in str(p) or "/approaches/" in str(p):
            continue
        # The whole bolded lead-in, not up to its first comma — truncating there collapses
        # "Plain sentences, whoever the reader is" to two words, which the filter then drops.
        for m in re.finditer(r"^(?:[-*]|\d+\.)\s+\*\*(.{6,110}?)\*\*", body(p), re.M):
            key = re.sub(r"[^a-z ]", " ", m.group(1).lower())
            key = " ".join(w for w in key.split() if len(w) > 3)
            if len(key.split()) >= 3:
                owners[key].append(str(p))
    for key, where in owners.items():
        where = sorted(set(where))
        if len(where) < 2:
            continue
        # A link is not a licence to restate. 04-discipline allows repetition only as a
        # *declared* mirror, so a citation downgrades the finding — it never clears it.
        cites = any(pathlib.Path(a).name in pathlib.Path(b).read_text()
                    for a in where for b in where if a != b)
        mirror = any(re.search(r"\bmirrors?\b.{0,80}" + re.escape(pathlib.Path(a).name),
                               pathlib.Path(b).read_text(), re.I | re.S)
                     for a in where for b in where if a != b)
        if mirror:
            continue  # declared, and the declaration is what the discipline asks for
        note = ("they link to each other, which is not a declared mirror"
                if cites else "neither cites the other")
        out.append(f"OWNERSHIP   \"{key}\" is ruled on by {len(where)} documents — {note}"
                   f"\n            " + "\n            ".join(where))
    return out


# RD.GOV.008 keeps a count where it carries the ruling: adding a member would be a
# redesign, not an ordinary register entry. These are those sets — the test is whether
# the number is the decision, not whether the set happens to be closed today.
LOAD_BEARING = {
    "seats", "passes", "layers", "entries", "principals", "pockets", "stages",
    "runtimes", "directions", "disciplines", "families",
}


def cardinality():
    """A count written into prose for a set that is free to grow (RD.GOV.008)."""
    WORDS = r"(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)"
    GROWABLE = r"(?:kinds?|constructs?|skills?|lenses|domains?|tiers?|artifacts?|" \
               r"chapters?|templates?|resources?|groups?|personas?|verbs?|" \
               r"invariants?|providers?|surfaces?)"
    out = []
    for p in SOURCES:
        if "/approaches/" in str(p) or "/reports/" in str(p):
            continue  # point-in-time, correct as produced (RD.DOCS.021)
        text = body(p)
        for m in re.finditer(rf"\bthe {WORDS} ({GROWABLE})\b", text, re.I):
            noun = m.group(1).lower().rstrip("s") + "s"
            if noun in LOAD_BEARING:
                continue
            line = text[:m.start()].count("\n") + 1
            out.append(f"CARDINALITY {p}:{line} — \"{m.group(0)}\" writes a count into a set "
                       f"a decision entry could grow")
    return out


def main():
    findings = vocabulary() + rulings() + ownership() + cardinality()
    for f in findings:
        print(f)
        print()
    kinds = defaultdict(int)
    for f in findings:
        kinds[f.split()[0]] += 1
    summary = " · ".join(f"{v} {k.lower()}" for k, v in sorted(kinds.items())) or "nothing"
    print(f"{len(SOURCES)} documents compared against each other — {summary}")
    return len(findings)


if __name__ == "__main__":
    sys.exit(min(main(), 250))
