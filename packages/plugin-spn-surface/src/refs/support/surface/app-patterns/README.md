<!-- spn:restates
{
  "files": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/01-common/app-page-kinds",
      "seen": "641c5266"
    }
  ]
}
-->
# The specs of the app patterns, as a partner has them

**The book owns every file here and this folder is a copy.** They are byte-identical to
`spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/01-common/app-page-kinds/`, and when the two disagree the book wins.
`restates files write` writes them and `restates check` reports a copy that has fallen behind.

**Each file is a skeleton spec of one app pattern, and a screen of an app starts from it.** The `design` skill
names the pattern it follows, and `spn-devex docs figure draw <spec>` draws its spec. The stamp
above names the folder and not each file, so a spec the book adds is seen as well as one it edits.

| Spec |
| --- |
| [`a-value-from-an-enum.dg.json`](a-value-from-an-enum.dg.json) |
| [`home-app.dg.json`](home-app.dg.json) |
| [`record-entry-page.dg.json`](record-entry-page.dg.json) |
| [`record-entry-sheet.dg.json`](record-entry-sheet.dg.json) |
| [`record-entry-with-preview.dg.json`](record-entry-with-preview.dg.json) |
| [`record-home-all-kinds.dg.json`](record-home-all-kinds.dg.json) |
| [`record-home-choose-groups.dg.json`](record-home-choose-groups.dg.json) |
| [`record-home-choose-list.dg.json`](record-home-choose-list.dg.json) |
| [`record-home-edit-in-place.dg.json`](record-home-edit-in-place.dg.json) |
| [`record-home-groups-many.dg.json`](record-home-groups-many.dg.json) |
| [`record-home-groups-open.dg.json`](record-home-groups-open.dg.json) |
| [`record-home-groups.dg.json`](record-home-groups.dg.json) |
| [`record-home-stack.dg.json`](record-home-stack.dg.json) |
| [`record-home.dg.json`](record-home.dg.json) |
| [`record-view-aside.dg.json`](record-view-aside.dg.json) |
| [`record-view-inherited.dg.json`](record-view-inherited.dg.json) |
| [`record-view-invoice.dg.json`](record-view-invoice.dg.json) |
| [`record-view-one-action.dg.json`](record-view-one-action.dg.json) |
| [`record-view-sheet.dg.json`](record-view-sheet.dg.json) |
| [`record-view-steps.dg.json`](record-view-steps.dg.json) |
| [`record-view.dg.json`](record-view.dg.json) |
| [`setup-compare-edit.dg.json`](setup-compare-edit.dg.json) |
| [`setup-compare.dg.json`](setup-compare.dg.json) |

**Never edit a file here.** It is an output. A builder changes the spec in the book, and the export
carries it.
