<!-- spn:restates
{
  "files": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-patterns/01-common/site-patterns",
      "seen": "d2a544aa"
    }
  ]
}
-->
# The specs of the site patterns, as a partner has them

**The book owns every file here and this folder is a copy.** They are byte-identical to
`spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-patterns/01-common/site-patterns/`, and when the two disagree the book wins.
`restates files write` writes them and `restates check` reports a copy that has fallen behind.

**Each file is a skeleton spec of one site pattern, and a section of a site's page starts from it.** The `design` skill
names the pattern it follows, and `spn-devex docs figure draw <spec>` draws its spec. The stamp
above names the folder and not each file, so a spec the book adds is seen as well as one it edits.

| Spec |
| --- |
| [`choose-to-see-under.dg.json`](choose-to-see-under.dg.json) |
| [`choose-to-see.dg.json`](choose-to-see.dg.json) |
| [`closing-call-beside.dg.json`](closing-call-beside.dg.json) |
| [`closing-call.dg.json`](closing-call.dg.json) |
| [`doors.dg.json`](doors.dg.json) |
| [`feature-grid.dg.json`](feature-grid.dg.json) |
| [`hero-under.dg.json`](hero-under.dg.json) |
| [`hero.dg.json`](hero.dg.json) |
| [`numbers.dg.json`](numbers.dg.json) |
| [`points.dg.json`](points.dg.json) |
| [`questions.dg.json`](questions.dg.json) |
| [`real-sample-under.dg.json`](real-sample-under.dg.json) |
| [`real-sample.dg.json`](real-sample.dg.json) |
| [`show-it-under.dg.json`](show-it-under.dg.json) |
| [`show-it.dg.json`](show-it.dg.json) |
| [`statement.dg.json`](statement.dg.json) |
| [`steps.dg.json`](steps.dg.json) |

**Never edit a file here.** It is an output. A builder changes the spec in the book, and the export
carries it.
