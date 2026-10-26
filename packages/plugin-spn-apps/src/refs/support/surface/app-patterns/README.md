<!-- spn:restates
{
  "files": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-patterns/01-common/app-patterns",
      "seen": "a3c1f827"
    }
  ]
}
-->
# The specs of the app patterns, as a partner has them

**The book owns every file here and this folder is a copy.** They are byte-identical to
`spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-patterns/01-common/app-patterns/`, and when the two disagree the book wins.
`restates files write` writes them and `restates check` reports a copy that has fallen behind.

**Each file is a skeleton spec of one app pattern, and a screen of an app starts from it.** The `design` skill
names the pattern it follows, and `spn-devex docs figure draw <spec>` draws its spec. The stamp
above names the folder and not each file, so a spec the book adds is seen as well as one it edits.

| Spec |
| --- |
| [`a-value-from-an-enum.dg.json`](a-value-from-an-enum.dg.json) |
| [`change-in-place.dg.json`](change-in-place.dg.json) |
| [`choose-many-in-groups.dg.json`](choose-many-in-groups.dg.json) |
| [`choose-many-in-one-list.dg.json`](choose-many-in-one-list.dg.json) |
| [`compare-across-kinds-edit.dg.json`](compare-across-kinds-edit.dg.json) |
| [`compare-across-kinds.dg.json`](compare-across-kinds.dg.json) |
| [`editor-with-preview.dg.json`](editor-with-preview.dg.json) |
| [`entry-as-a-page.dg.json`](entry-as-a-page.dg.json) |
| [`entry-over-the-page.dg.json`](entry-over-the-page.dg.json) |
| [`find-in-a-list-look.dg.json`](find-in-a-list-look.dg.json) |
| [`find-in-a-list.dg.json`](find-in-a-list.dg.json) |
| [`groups-and-their-items-many.dg.json`](groups-and-their-items-many.dg.json) |
| [`groups-and-their-items-open.dg.json`](groups-and-their-items-open.dg.json) |
| [`groups-and-their-items-two-lists.dg.json`](groups-and-their-items-two-lists.dg.json) |
| [`groups-and-their-items.dg.json`](groups-and-their-items.dg.json) |
| [`inherit-or-override.dg.json`](inherit-or-override.dg.json) |
| [`one-action.dg.json`](one-action.dg.json) |
| [`overview.dg.json`](overview.dg.json) |
| [`record-and-its-setup.dg.json`](record-and-its-setup.dg.json) |
| [`record-and-its-steps.dg.json`](record-and-its-steps.dg.json) |
| [`record-and-what-belongs-to-it.dg.json`](record-and-what-belongs-to-it.dg.json) |
| [`set-up-by-kind.dg.json`](set-up-by-kind.dg.json) |

**Never edit a file here.** It is an output. A builder changes the spec in the book, and the export
carries it.
