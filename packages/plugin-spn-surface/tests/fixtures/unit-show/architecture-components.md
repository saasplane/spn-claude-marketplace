# Components — a fixture of one choice table

## Overlays

#### The choice table of `DSSheet`

A sheet is chosen by what it holds.

**The cases**, read from the top; the first that matches wins.

| The sheet holds | Where it stands | `placement` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| a medium entry | at the side of the page | `RIGHT` (the unit's) | the place's | nothing | `RD.SUPPORT.SURFACE.075` |
| a small entry | — | not a sheet: a `DSDialog` | — | — | `RD.SUPPORT.SURFACE.075` |

**The limits across a view.** A sheet over a page is a view of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `placement` | `RIGHT` | every case |

#### The choice table of `DSOther`

| The other holds | `size` | The page writes | Rule |
| --- | --- | --- | --- |
| something else | `MD` | the size | this table |
