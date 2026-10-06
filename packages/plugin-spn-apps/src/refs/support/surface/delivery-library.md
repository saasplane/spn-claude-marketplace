<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/11-delivery-library.md",
      "seen": "980b843d"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/11-delivery-library/",
      "seen": "df9aa540"
    }
  ]
}
-->

# Delivery Library — Where the Look Is Drawn

Source of truth: the foundation's Delivery Library construct (`docs/02-constructs/02-support/03-surface/11-delivery-library.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/11-delivery-library/`). Delivery Library is the eleventh of thirteen Surface constructs, and the first of the Delivery group — where the library is drawn and what every stack shows as proof.

Read this before you add a token or a block to the library, or before you ask whether a look may live only in one stack's code.

## Terms

| Term | What it means |
| --- | --- |
| Design library | the Figma files that draw each named block and token |
| Snapshot | one file that states a design system in the Surface domain's own words, written from the library and from each stack |
| Gap | one difference between the library's snapshot and a stack's snapshot, of one closed kind |
| Plan | one file for one library file, that lists what the plugin's update mode does there, one operation an entry |
| Result file | the file the update mode saves after an apply, that says what happened to each entry |
| Decisions file | the short file of what a person settled once, from which the plans are written |

## The files, by layer — 🔮

The design library holds one file for each layer of the design system that is drawn, and one for drafts. Five of the six layers are drawn: Core, Components, Widgets, Containers and Layouts. The sixth layer, App, has no file of its own: the choices of the theme are variables, so Core holds them, and the rest of the app's contract stays in words.

| File | Holds | May use |
| --- | --- | --- |
| Core | the variables, the text styles, the scale and the icons | nothing |
| Components | one page for each group of components | Core |
| Widgets | one page for each widget | Components and Core |
| Containers | the container, with its parts and its look | Components and Core |
| Layouts | the layout, in each of its types | every file before it |
| Lab | drafts of large changes | any published file |

A file can use only what another file has published. SaaS Plane's own library is six files in Figma, in the **Design System** folder of the SaaS Plane team, and a link opens only for a person with a seat on that team:

| File | Its pages |
| --- | --- |
| DS 1-core | Colour · Type · Scale · Icons |
| DS 2-Components | one page for each group, then Choices |
| DS 3-Widgets | Filter bar · Data table |
| DS 4-Containers | Container |
| DS 5-Layouts | Layout |
| DS 9-Lab | drafts, never published |

Core holds the variables in collections, and each is one setting of the book: `Roles` (Light, Dark), `Hue` (the values of `color`), `Scale`, `Theme-Font`, `Theme-Radius`, the four `Theme-*` collections of the container look (`Theme-Raised` also holds `page/fill`), and `Frame` (the frame setting of `flush`). A private part's name starts with a dot; a description is one line and a link; a file that changes is published by a person.

## Color is a mode, and the rest are properties — 🔮

In the design library, `color` is a variable mode. `variant`, `size` and the state are properties. `color` stays a prop on every stack, and a design read back turns the mode into the prop.

## What stays in words — 🔮

The library holds the pictures, the properties and the variables. It draws every case a person can see in the showcase, and a line in a description never stands in for a drawing. The book states what no person sees: keyboard use and where focus goes; the overlay seam, and translation; a data shape as a whole; the rule that decides a refusal by the permission gate, whose denied state is drawn. A block with a behaviour and little or no look is stated by its behaviour and its feedback: `DSAuthz`, `DSSticky`, `DSAnchor` and `DSAnchorContainer` have a small sheet of states each, the five formatters share one sheet of formats, `DSAspectRatio` has one sheet of ratios, `DSElementObserver` has an entry with its description and no states, and `DSPortal`, a block of the web alone, has no entry. A description in the library carries one line and a link to the chapter that states the behavior.

## A value held worked out — 🔮

The primary ramp comes from one seed by a formula, and the radius of each size step comes from one base value. A variable of the library holds a value or a pointer to another variable, so the library holds the worked-out values, and the rule that produces them stays in words.

## The snapshot

A person who wants to know where the library and a stack differ should not have to read either one in full. A snapshot is one file that states a design system in the Surface domain's own words. It is written from the library, and the same file is written from each stack's code, so the two are compared key by key. It holds no word of a design tool and no word of a stack, so the web and a native stack write exactly the same file. The command `spnutils apps surface library` writes the library's snapshot and `spnutils apps surface snapshot <package>` writes a stack's, with no model. A file holds a time in UTC, and a command prints it in local time with its offset. A snapshot is the machine's own state and it never enters a repository.

A snapshot has four parts and three levels:

| Key | Level | What it holds |
| --- | --- | --- |
| `snapshotVersion` and `source` | all | the kind of source (`DESIGN_LIBRARY`, `WEB` or `NATIVE`), the time it was read, what it was read from, and the deepest level written |
| `vocabularies` and `units` | 1, the inventory | the closed lists a prop takes, and each unit with its name, layer, group, props, shown states and parts |
| `tokens` | 2 | the ramps, the roles for light and for dark, the scale, the type steps and the theme |
| `measures` | 3 | for each unit and each size: the height, paddings, gap, radii, border and text size, each as a value and, where the side can say it, the token it is bound to |

Level 1 finds most gaps. Level 2 finds a value that differs. Level 3 is read only for the units that levels 1 and 2 flag, because it is the largest. The category, the showcase layout and what a unit has are tags of the showcase only: they are never in a snapshot and never a gap.

## The gaps

A gap is one difference between the library's snapshot and a stack's. Its kind is one of six, and the list is closed:

| Kind | What it means |
| --- | --- |
| `UNIT_ABSENT` | a unit that one side holds and the other does not |
| `PROP_ABSENT` | a prop that one side holds and the other does not |
| `VALUE_ABSENT` | a value of a closed list that one side offers and the other does not, missing or extra; `lacks` says which side is without it |
| `VALUE_DIFFERS` | the same token or measure with another value, by more than half a pixel |
| `TOKEN_ABSENT` | a token that one side holds and the other does not |
| `NAME_UNMAPPED` | a name the naming map does not know, so no comparison was possible |

One gap is a record with the keys `kind`, `level`, `path`, `lacks`, `library` and `stack`. `lacks` is `LIBRARY` or `STACK`, and it is null for `VALUE_DIFFERS` and `NAME_UNMAPPED`, the two kinds that lack nothing on one side. The view prints a dash for it. The record is JSON, named by its package, and it also holds what the gaps were compared from and a count of what could not be compared. It holds `rulesApplied` too, the count of gaps each rule of the comparison left out. A view of one line for each gap is written from the record and is never edited.

The view stays short by five rules. A `UNIT_ABSENT` line replaces every line under that unit. Many `VALUE_ABSENT` gaps on one prop become one line with a list. What could not be compared is a count in the footer and never a line. Level 3 is written only for the units that levels 1 and 2 flagged. **A person and a model read the gaps, and never the library.**

## Reading the library

A plugin of SaaS Plane's own, run by hand in the Figma desktop app, works on the library file that is open. It has two modes, Read and Update. There is one run, and one file saved, for each of the five library files. Lab is never read.

- **The read mode MUST only read.** It creates, sets, moves and deletes nothing, and it saves what it read as one raw file. The plugin asks for no network in either mode.
- **The update mode MUST act on the open file alone, and MUST apply only what a plan names, only after the person has seen the dry run and pressed apply.** It MUST save a named version before its first operation, and it MUST NEVER publish.
- **A run MUST ask for one save.** A cancelled save leaves the window open with a button that saves the same result and makes no new read.
- **A change MUST be published before it is read.** A raw file holds what its file held when it was read.
- **The raw file holds the facts as Figma names them**, with no rule of ours applied. Its keys are `rawVersion`, `file`, `collections`, `styles`, `pages` and `counts`. `rawVersion` is `2`: a version holds its own frame, a layer holds its sizing, and a text layer holds its case and its decoration, and a file of version 1 is still read and lacks those three facts. **`counts` MUST be written last**: eight numbers that prove the file whole. The command that writes the library's snapshot refuses a file with no `counts`, with counts that differ from what it holds, or of an unknown `rawVersion`, and names the file.
- **Every library file MUST have a raw file before the library's snapshot is written.** A unit in one file is bound to a variable of another, so no file can be read alone.
- **The naming map is the one place a design tool's name appears.** It is one file kept inside the stack's tool. It maps by rule first and by exception second, and a name it does not know is a `NAME_UNMAPPED` gap, never a guess. It holds, for example, a boolean drawn as a variant with two values (a flag prop), a `BOOLEAN` switch that shows a part (the presence of a content prop), a `state` variant (a shown state, never a prop), a page name (a group name, with the layer from the file) and a one-value token such as `radius/base` (`theme.radius`).
- **A model MUST NOT read the library, a raw file or a snapshot to find a gap.** It reads the gaps.

## Bringing the library to a stack

A change of the surface is stated in the construct first, drawn in the library second and built in the web or a native stack third. An improvement is taken in the same order. A person settles what a gap cannot give once, in the decisions file. The command `spnutils apps surface library-plan <package>` reads the gaps, the two snapshots, the raw files and the decisions file, and writes one plan for each library file into `plugin-input/<package>/`, with `counts` last, and a view of the plans by library file, `compare/<package>/library-plan.md`, for a person to review. The library is the side that changes, and a plan shows what would change there before anything is applied.

- **A plan holds operations of fourteen kinds, one entry each.** Each kind is done by the plugin alone, or prepared by the plugin and drawn by a person. Its keys are `planVersion`, `file`, `madeAgainst`, `decidedIn`, `pluginVersionNeeded`, `operations` and `counts`.
- **The tool's folder, `~/.spnutils/surface/`, is ordered around the plugin, and the tool writes only under `plugin/`, `plugin-input/` and `compare/`.** The plugin saves into `plugin-output/raw/` and `plugin-output/results/<package>/`, a person writes `decisions/<package>.decisions.json`, and the tool never writes in those two. `spnutils apps surface plugin` makes the whole tree, and run again it leaves every other folder and file as it was.
- **The dry run changes nothing, and apply MUST be available only when no operation is refused.** The plugin refuses a plan made for another library file or against an older state of the library, and an entry whose expected value is not what the file holds.
- **The result file says one outcome for each entry:** `DONE`, `PREPARED`, `SKIPPED` or `REFUSED`, with `counts` last. The command `status` reads the result files.
- **A rule of the comparison removes a gap only when a named fact proves it, and `rulesApplied` MUST count it.** The comparison leaves out what is not a unit, and it reads the props the stack declares. A second reader of the web's snapshot reads from the running showcase the values that only a browser works out.

## Drawing a block

- A block drawn from data is a host and an item. One item serves every host that takes one data shape (`architecture-components.md`).
- Each shared state has one picture, on every block and on every kind of surface (`architecture-names.md`).
- An overlay is drawn as its surface alone, placed over a `DSBackdrop`, and its extent is the size of the instance. It draws no width of its own, and the library draws no `extent` variant.
- A popup or an overlay that a block opens is a private part of that block, shown by the switch `open`. It is never a block a designer places on a page of its own.
- A value that only changes which published block sits in a slot is no variant. The slot holds the block.

## Boundary

This ref states what the library draws, how its files are layered, and what stays in words because no person sees it. It does not state which blocks or tokens exist — that is `architecture-components.md` and `architecture-core.md`. It does not state how a stack builds what the library draws, or what proves it did — that is `providers.md` and `delivery-showcase.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.141` | the design library draws the look of each named block, and behavior stays in words |
| `RD.SUPPORT.SURFACE.025` | a change of the surface is stated in the construct first, drawn in the library second and built in the web or a native stack third |
| `RD.SUPPORT.SURFACE.026` | the library draws every case the showcase shows, and states a block with a behaviour and little or no look by its behaviour and its feedback |
| `RD.SUPPORT.SURFACE.027` | the plugin has a read mode and an update mode, and the update mode writes only what a plan names, only in the open file, only after a dry run and an apply, and never publishes |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
