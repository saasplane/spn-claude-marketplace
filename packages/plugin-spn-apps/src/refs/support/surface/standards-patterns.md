<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/03-standards-patterns.md",
      "seen": "10f201ec"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/03-standards-patterns/",
      "seen": "e564bcfd"
    }
  ]
}
-->

# Patterns — One Way to Run Each Task

Source of truth: the foundation's Patterns construct (`docs/02-constructs/02-support/03-surface/03-standards-patterns.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/03-standards-patterns/`).

Patterns is the third of thirteen Surface constructs, filling in the six parts of a pattern (the previous standard of this folder) once for each task intent a person has in an app today.

Read this to build a page from patterns a person already knows, or to review a page by naming the pattern it should have used. A page never invents a pattern of its own for an intent this ref already holds — most "new" tasks are one of the intents below under another name: *search* is Find, *edit* is Enter, *delete* is Act.

## Terms

`Task intent` and `Pattern` belong to `standards-interaction.md`; this ref uses them as that ref states them. It adds one term of its own: **Intent** — the one verb a pattern's section is named for, such as Move or Act.

## The patterns, by intent — 🔮

| Task intent | The pattern covers | Blocks that carry it |
| --- | --- | --- |
| Move | going to another place, and knowing where you are | the layout · `DSNavigationMenu` · `DSTabs` · `DSBreadcrumb` · `DSLink` |
| Find | search, filter, sort, and paging through records | `DSWFilterBar` · `DSWDataTable` · `DSCommandPalette` · `DSPagination` |
| Read | records as a table, a list or a grid, one record in detail, and nothing to show | `DSTable` · `DSList` · `DSDataFieldView` · `DSEmpty` · `DSSkeleton` |
| Enter | filling a field, the check on it, and sending a form | `DSForm` and the entry fields |
| Choose | picking one or many from a set | `DSSelect` · `DSRadioGroup` · `DSCheckboxGroup` · `DSToggleGroup` and the pickers |
| Act | one main action, an action on many records, and an action that destroys something | `DSButton` · `DSDropdownMenu` · `DSAlertDialog` |
| Interrupt | a task that takes over the page for a moment | `DSDialog` · `DSDrawer` · `DSSheet` |
| Disclose | showing more in place, without leaving | `DSAccordion` · `DSCollapsible` · `DSPopover` · `DSTooltip` · `DSHoverCard` |
| Hear back | what the surface says while it works, when it is done, and when it fails | `DSSpinner` · `DSProgress` · `DSToast` · `DSAlert` |
| Be refused | a block hidden or disabled because the person has no permission | `DSAuthz` and the gate props |

A page usually serves several intents, and one is still the main one (`standards-core.md`'s one purpose). Each intent's section states its own six parts in full in the capability chapter; a few load-bearing details: an empty result is not a failed search — the two pictures stay apart. A field that is not accepted is a control state (error) on the field, where a send that does not work is a task state (failed) on the form. Every overlay that covers a page dims it with one scrim, so a dialog, an alert dialog, a drawer and a sheet all read the same way. An alert and a toast draw one picture; the toast is the alert that appears for a while and leaves. A refusal on the surface is presentation only — hiding or disabling protects nothing, and the refusal itself is the server's.

## Adding an intent — 🔮

The list grows when a task appears that no section covers, after checking the task is genuinely new.

- A new intent joins this construct as a section, with every one of Interaction's six parts stated.
- A new pattern names blocks of the design system. A pattern that needs a block the design system lacks waits for that block.

A page never invents a pattern of its own for an intent the list already holds.

## Boundary

This ref states which pattern covers a given task, and what blocks carry it. It stops at naming the blocks. It does not state what the six parts are or what a task state is — that is `standards-interaction.md`, used by every pattern here without restating it. It does not state what a block, a prop or a token is named — that is `architecture-names.md` and the refs after it.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.158` | every overlay that covers a page dims it with one scrim |
| `RD.SUPPORT.APPS.159` | an alert and a toast draw one picture |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
