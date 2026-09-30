<!-- spn:restates
{
  "files": [
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/templates",
      "seen": "92b529ed"
    }
  ]
}
-->
# The templates, as a partner has them

**The book owns every file here and this folder is a copy.** They are byte-identical to
`spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/templates/`, and when the two
disagree the book wins. `restates files --write` writes them and `restates check` reports a copy
that has fallen behind, so a builder's edit reaches every partner with the next plugin release
rather than being discovered by somebody's first session going wrong.

**The stamp above names the folder, not each file** (`RD.DEVEX.AGENT.072`). One citation per template
would report every edit and miss every addition — a template nobody cited has nothing to compare
against, and *the book grew a shape a partner does not have* is what this copy exists to prevent.
A folder hash covers added, removed, renamed and edited at once.

**They are here because the plugins ship without the book beside them.** A partner installs the
marketplace and the libraries and never gets `docs/`. The moment that costs most is the first one:
a new repository whose own documentation is the thing they are about to write, with nothing on
disk to copy from.

**Copy a template rather than writing a page from memory.** Each carries the section order, the
card shape and the furniture every check reads, and a page assembled by hand is one that passes a
review and fails a gate.

| Group | Templates |
| --- | --- |
| `agent/` | [`agent-template.md`](agent/agent-template.md) · [`hook-template.py`](agent/hook-template.py) · [`lens-template.md`](agent/lens-template.md) · [`ref-template.md`](agent/ref-template.md) · [`skill-template.md`](agent/skill-template.md) |
| `pages/` | [`blocks-template.html`](pages/blocks-template.html) · [`construct-template.html`](pages/construct-template.html) · [`hub-template.html`](pages/hub-template.html) · [`overview-template.html`](pages/overview-template.html) · [`report-template.html`](pages/report-template.html) |
| `seat-files/` | [`capability-template.md`](seat-files/capability-template.md) · [`construct-seat-template.md`](seat-files/construct-seat-template.md) · [`schema-template.sql`](seat-files/schema-template.sql) · [`test-and-verify-template.md`](seat-files/test-and-verify-template.md) |
| `workstream/` | [`approach-template.html`](workstream/approach-template.html) · [`arc-template.md`](workstream/arc-template.md) · [`handover-template.md`](workstream/handover-template.md) · [`order-template.md`](workstream/order-template.md) · [`plan-template.md`](workstream/plan-template.md) |

**Never edit a file here.** It is an output. The rule lives in the book's copy, a builder changes
it there, and the export carries it.
