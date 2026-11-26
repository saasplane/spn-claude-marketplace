<!-- spn:restates
{
  "files": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/01-common/site-container-kinds",
      "seen": "0cb0e6f3"
    }
  ]
}
-->
# The specs of the site patterns, as a partner has them

**The book owns every file here and this folder is a copy.** They are byte-identical to
`spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/01-common/site-container-kinds/`, and when the two disagree the book wins.
`restates files write` writes them and `restates check` reports a copy that has fallen behind.

**Each file is a skeleton spec of one site pattern, and a section of a site's page starts from it.** The `design` skill
names the pattern it follows, and `spn-devex docs figure draw <spec>` draws its spec. The stamp
above names the folder and not each file, so a spec the book adds is seen as well as one it edits.

| Spec |
| --- |
| [`about-team.dg.json`](about-team.dg.json) |
| [`action-closing-beside.dg.json`](action-closing-beside.dg.json) |
| [`action-closing.dg.json`](action-closing.dg.json) |
| [`browse-results.dg.json`](browse-results.dg.json) |
| [`browse-search.dg.json`](browse-search.dg.json) |
| [`common-faq.dg.json`](common-faq.dg.json) |
| [`explain-categories.dg.json`](explain-categories.dg.json) |
| [`explain-doors.dg.json`](explain-doors.dg.json) |
| [`explain-features.dg.json`](explain-features.dg.json) |
| [`explain-sample-under.dg.json`](explain-sample-under.dg.json) |
| [`explain-sample.dg.json`](explain-sample.dg.json) |
| [`explain-showcase-choose-under.dg.json`](explain-showcase-choose-under.dg.json) |
| [`explain-showcase-choose.dg.json`](explain-showcase-choose.dg.json) |
| [`explain-showcase-highlight.dg.json`](explain-showcase-highlight.dg.json) |
| [`explain-showcase-under.dg.json`](explain-showcase-under.dg.json) |
| [`explain-showcase.dg.json`](explain-showcase.dg.json) |
| [`explain-steps.dg.json`](explain-steps.dg.json) |
| [`feature-highlight.dg.json`](feature-highlight.dg.json) |
| [`intro-hero-under.dg.json`](intro-hero-under.dg.json) |
| [`intro-hero.dg.json`](intro-hero.dg.json) |
| [`intro-statement.dg.json`](intro-statement.dg.json) |
| [`price-compare.dg.json`](price-compare.dg.json) |
| [`price-plans.dg.json`](price-plans.dg.json) |
| [`proof-claim.dg.json`](proof-claim.dg.json) |
| [`read-article.dg.json`](read-article.dg.json) |

**Never edit a file here.** It is an output. A builder changes the spec in the book, and the export
carries it.
