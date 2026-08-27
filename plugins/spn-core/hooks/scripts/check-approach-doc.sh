#!/usr/bin/env bash
# Approach documents must clear the bars the book states mechanically.
# Source of truth: the foundation book, docs/03-capabilities/05-docs/05-artifacts.md
# ("The approach document") and 02-document.md rule 12 (RD.DOCS.031, the one voice).
# This hook checks only what a script CAN check; the register itself is judgement.
set -uo pipefail
payload="$(cat)"
file="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')"
case "$file" in
  */artifacts/approaches/*-approach.html) ;;
  *) exit 0 ;;
esac
content="$(printf '%s' "$payload" | jq -r '.tool_input.content // .tool_input.new_string // empty')"
[ -z "$content" ] && exit 0

findings="$(printf '%s' "$content" | python3 -c '
import sys, re
h = sys.stdin.read()
out = []
# prose only — the register never governs records (tables, diagrams, code)
prose = re.sub(r"<(table|svg|pre)\b.*?</\1>", " ", h, flags=re.S|re.I)
prose = re.sub(r"<[^>]+>", " ", prose)

if not re.search(r"who this is for|audience", h, re.I):
    out.append("masthead does not name its audience (05-artifacts: an artifact has no seat, so its content is decided by its audience)")

m = re.search(r"<section id=\"s0\".*?</section>", h, re.S)
if m:
    n = len(re.findall(r"<tr>", m.group(0))) - 1
    if n > 8:
        out.append(f"Terms carries {n} rows; the bar is five to eight")

card = re.findall(r"\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s+(decisions|nouns|scopes|tables|items|questions|rules|steps|findings|surfaces)\b", prose, re.I)
if card:
    ex = ", ".join(f"{a} {b}" for a, b in card[:3])
    out.append(f"cardinality written into prose ({ex}) — RD.GOV.008: name a set by its rule, not its count")

sents = [s for s in re.split(r"(?<=[.!?])\s+", prose) if len(s.split()) > 3]
if sents:
    avg = sum(len(s.split()) for s in sents) / len(sents)
    you = len(re.findall(r"\b(you|your)\b", prose, re.I))
    per1k = you / max(len(prose.split()), 1) * 1000
    if per1k < 4:
        out.append(f"prose reads third-person ({per1k:.1f} uses of you/your per 1000 words) — RD.DOCS.031 is second person")
    if avg > 21:
        out.append(f"average sentence {avg:.0f} words; the plainness bar is around fifteen")
print("\n".join(f"  - {o}" for o in out))
' 2>/dev/null)"

[ -z "$findings" ] && exit 0
jq -n --arg f "$findings" '{
  systemMessage: ("Approach-doc standard — this file misses bars the book states:\n" + $f +
    "\n  Load `refs/doc-sets.md` (One voice) and the `plan` skill’s approach-document section before writing.")
}'
exit 0
