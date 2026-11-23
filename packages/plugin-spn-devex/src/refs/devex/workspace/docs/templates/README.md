<!-- spn:restates
{
  "files": [
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/templates",
      "seen": "01853006"
    }
  ]
}
-->
# The templates, as a partner has them

**The book owns every file here and this folder is a copy.** They are byte-identical to
`spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/templates/`, and when the two
disagree the book wins. `restates files write` writes them and `restates check` reports a copy
that has fallen behind, so a builder's edit reaches every partner with the next plugin release
rather than being discovered by somebody's first session going wrong.

**The stamp above names the folder, not each file** (`RULE.DEVEX.AGENT.072` · MUST · skill:spn-devex/develop). One citation per template
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
| `docs/` | [`pages/blocks-template.html`](docs/pages/blocks-template.html) · [`pages/construct-template.html`](docs/pages/construct-template.html) · [`pages/guide-template.html`](docs/pages/guide-template.html) · [`pages/hub-template.html`](docs/pages/hub-template.html) · [`pages/index-template.html`](docs/pages/index-template.html) · [`pages/overview-template.html`](docs/pages/overview-template.html) · [`pages/page-template.html`](docs/pages/page-template.html) · [`pages/report-template.html`](docs/pages/report-template.html) · [`seats/capability-template.md`](docs/seats/capability-template.md) · [`seats/construct-seat-template.md`](docs/seats/construct-seat-template.md) · [`seats/design-language-capability-template.md`](docs/seats/design-language-capability-template.md) · [`seats/design-language-construct-template.md`](docs/seats/design-language-construct-template.md) · [`seats/design-language-reference-template.md`](docs/seats/design-language-reference-template.md) · [`seats/schema-template.sql`](docs/seats/schema-template.sql) · [`seats/test-and-verify-template.md`](docs/seats/test-and-verify-template.md) |
| `plugin/` | [`agent-template.md`](plugin/agent-template.md) · [`hook-template.ts`](plugin/hook-template.ts) · [`lens-template.md`](plugin/lens-template.md) · [`ref-template.md`](plugin/ref-template.md) · [`skill-template.md`](plugin/skill-template.md) |
| `surface/` | [`surface-page-template.html`](surface/surface-page-template.html) |
| `workstream/` | [`approach-template.html`](workstream/approach-template.html) · [`arc-record-template.md`](workstream/arc-record-template.md) · [`arc-template.html`](workstream/arc-template.html) · [`handover-template.md`](workstream/handover-template.md) · [`order-template.md`](workstream/order-template.md) · [`plan-template.md`](workstream/plan-template.md) |

**Never edit a file here.** It is an output. The rule lives in the book's copy, a builder changes
it there, and the export carries it.
