#!/usr/bin/env python3
"""The agent's own speech is held to the card grammar, exactly as a document is.

`05-artifacts.md` § *The approach document* → `Open` rules it, and the clause is the one most
often missed:

    Open items put to a person in chat follow this layout exactly as a document's Open section
    does — MUST. That covers a status reply, an answer to "what's left?", and a pending-work
    report at any moment.

**Nothing checked it until now, and the corpus knew.** `registers/instruments.md` carries the
rule as a mechanical-and-unbuilt instrument, landed by `009` as `A5`. This is that instrument.

**The failure it catches is exact.** A reply names lettered options — *"say A and I will…"*,
*"my recommendation is B"* — while showing no options table. The reader is asked to choose
between things they were never shown, and the card grammar exists to stop precisely that.

**What it deliberately does NOT do.** It never reads whether a recommendation is good, never
counts words, and never fires on a reply that simply mentions a letter. Only a reply that asks
for a choice, and does not show one.

Wired on `Stop`, which is the one event carrying the reply. A WARNING and never a refusal: the
turn is already written, and refusing it would only lose the work.
"""
import json
import re
import sys

# A reply asking for a lettered choice. `say A`, `answer Q3B`, `option A`, `recommendation is B`,
# `A, B or C`. Every form seen in this workspace's own transcripts, and each needs a table.
ASKS = re.compile(
    r'\b(?:say|answer|reply|pick|choose|choosing|select)\s+(?:with\s+)?[`"*]?(?:Q\d+)?[A-D]\b'
    r'|\brecommendation\s+is\s+[`"*]?[A-D]\b'
    r'|\boption\s+[`"*]?[A-D]\b'
    r'|\b[A-D]\s*,\s*[A-D]\s*(?:,\s*[A-D]\s*)?(?:or|/)\s*[A-D]\b', re.I)
# A markdown options table: a header row and the `| --- |` separator the grammar requires.
TABLE = re.compile(r'^\|.*\|\s*$\n^\|[\s:-]*\|[\s:|-]*$', re.M)
# A lettered row inside a table — `| **A** | … | … |`. The shape the grammar actually asks for.
LETTERED_ROW = re.compile(r'^\|\s*\**\s*[A-D]\s*\**\s*\|', re.M)


def last_reply(payload):
    """The assistant text this turn ended with, however the host spells it."""
    for key in ('last_assistant_message', 'assistant_message', 'message', 'response'):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value
        if isinstance(value, dict):
            content = value.get('content')
            if isinstance(content, str):
                return content
            if isinstance(content, list):
                return '\n'.join(p.get('text', '') for p in content if isinstance(p, dict))
    return ''


def finding(text):
    """A reply asking for a lettered choice while showing no lettered options table."""
    if not ASKS.search(text):
        return ''
    if TABLE.search(text) and LETTERED_ROW.search(text):
        return ''
    return ('Your reply asks for a lettered choice and shows no options table. A card put to a '
            'person in chat follows the same layout a document uses — MUST: the choice as a '
            'numbered `Q<n>`, what it changes, what it costs to leave, and **the options as a '
            'table, lettered, with the trade-off in its own column** (05-artifacts.md, The '
            'approach document). Naming A and B without showing them asks somebody to choose '
            'between things they cannot see. Put the card on the approach page, and say in the '
            'reply that it is there.')


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0
    message = finding(last_reply(payload))
    if message:
        print(json.dumps({'systemMessage': message}))
    return 0


if __name__ == '__main__':
    sys.exit(main())
