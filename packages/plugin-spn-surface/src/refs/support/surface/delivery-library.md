<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-surface/11-delivery-library.md",
      "seen": "92053436"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/11-delivery-library/",
      "seen": "3aabeea6"
    }
  ]
}
-->

# Delivery Library — Where the Look Is Drawn

Source of truth: the foundation's Delivery Library construct (`docs/02-constructs/02-support/01-surface/11-delivery-library.md`) and its capability chapters (`docs/04-capabilities/02-support/01-surface/11-delivery-library/`). Delivery Library is the eleventh of thirteen Surface constructs, and the first of the Delivery group — where the library is drawn and what every stack shows as proof.

Read this before you add a token or a block to the library, or before you ask whether a look may live only in one stack's code. The units the book names are the core units, and the library draws those. A stack may provide further units of its own, as `architecture-components.md` states. The book does not name them, so the library does not draw them, and the order of a change does not bind them.

**The library draws only what the Surface constructs say is drawn: the core units with their properties and their cases, the icons, and the places of the layout** (`RD.SUPPORT.SURFACE.099`). Nothing of a pattern is drawn. A task pattern, an app pattern, a skeleton and a sample page are ways to use the units and not units, so the book states them and the library holds none.

## Terms

| Term | What it means |
| --- | --- |
| Design library | the Figma files that draw each named block and token |
| Snapshot | one file that states a design system in the Surface domain's own words, written from the book, from the library and from each stack |
| Plugin | the Figma plugin the tool writes out with the CONSTRUCT snapshot inside, which builds the library's sets from that file alone |
| Gap | one difference between a snapshot and the one before it, the library's against the book's or a stack's against the library's, of one closed kind |
| Inventory | one file for one library file, that holds what the agent read of it through the connector, to the depth the comparison needs, and that the tool takes in |
| Accepted difference | a gap that has been looked at and accepted, recorded with its reason and taken in by the tool, so that the list of gaps leaves it out and counts it |
| A unit's section | the Figma section that holds one unit and everything the unit owns, named as the unit. It is a different thing from a block of the design system, which a unit's set draws |
| Shared parts | the last section of a page, which holds a part that two or more units on the page use |

## The files, by layer

A library holds one file for each layer that is drawn, and one for drafts. SaaS Plane's design system has five that are published (Core, Components, Widgets, Containers and Layouts) and one for drafts (Lab) that is never published, and the tool's inventories are of the published files. Five of the six layers are drawn: Core, Components, Widgets, Containers and Layouts. The sixth layer, App, has no file of its own: the choices of the theme are variables, so Core holds them, and the rest of the app's contract stays in words.

| File | Holds | May use |
| --- | --- | --- |
| Core | the variables, the text styles, the scale and the icons | nothing |
| Components | one page for each group of components | Core |
| Widgets | one page for each widget | Components and Core |
| Containers | the container, with its parts and its look | Components and Core |
| Layouts | the layout, in each of its types | every file before it |
| Lab | drafts of large changes | any published file |

A file can use only what another file has published. SaaS Plane's own library is the five published files and the file for drafts, in the **Design System** folder of the SaaS Plane team, and a link opens only for a person with a seat on that team:

| File | Its pages |
| --- | --- |
| DS 1-core | Colour · Type · Scale · Icons · States, the pages of the showcase's Core entries that show tokens |
| DS 2-Components | one page for each group of the showcase, in its order: Actions · Data display · Feedback · Structure · Media · Navigation · Overlays · Popovers · Typography · Utility, then the three pages of Data entry: Fields, Pickers and Composites. Each set sits in its unit's section on its group's page |
| DS 3-Widgets | Widgets: `DSDataTable`, then `DSFilterBar` with its item `DSFilterBarField` |
| DS 4-Containers | Containers |
| DS 5-Layouts | Layouts |
| DS 9-Lab | drafts, never published |

Core holds the variables in collections, and each is one setting of the book: `Ramps` (the ramps, which no block reads), `Mode` (`LIGHT`, `DARK`), `Color` (the values of `color`), `Level` (the six values of `DSPageLevelType`, `PAGE` · `CONTAINER` · `WIDGET` · `GROUP` · `CONTENT` · `INLINE`: the level tokens from `PAGE` to `GROUP`, and the item line's rows, its picture's boxes and 12px at `CONTENT` and `INLINE`), `Treatment` (the values of `variant`, `SOLID` · `QUIET` · `SUBTLE` · `SUBTLE_OUTLINE` · `OUTLINE` · `GHOST` · `LINK`, for a unit that takes its look as a mode, with `SUBTLE` the default; the file still holds the modes of before, `SOFT` among them, and is owed these), `Mark-Shape` (the values of `shape` of a mark and of an avatar, `CIRCLE` · `ROUNDED` · `SQUARE`), `Tone` (`DEFAULT` · `QUIET` · `MUTED` · `SUBTLE` · `INVERSE`, the values of `tone` of a text and a link), `Surface` (`BASE` · `DEFAULT` · `PRIMARY`, the values of the `color` of a surface), `Strength` (`SUBTLE` · `QUIET` · `SOLID`, the `strength` of a surface), `Scale` (it also holds the size of an icon and of a mark at each scale size), `Theme-Font`, `Theme-Radius`, the four `Theme-*` collections of the panel look: `frames` and the keys `raised`, `bordered` and `rounded` of its `surface` (`Theme-Raised` also holds `page-fill`), and `Frame` (the frame setting of `flush`). Each collection's name is the one the book gives it, in the table of the CONSTRUCT snapshot's `collection`; the files of the old Design System folder keep the names `Hue` and `Roles`, and the modes Light and Dark, until the folder is retired. A private part's name starts with a dot, and it is drawn inside the section of the unit that owns it, or in the section named Shared parts when several units use it; a description is one line and a link; a file that changes is published by a person.

The organisation of a library file that the book states holds for any library, the builder's and a partner's own: a page for a group, a section for a unit with its header, set, Usage, Cases and Parts, the distances, the names of labels and cases, and the checks before a publish. Which files a library is divided into is the builder's for its design system and a partner's own for a library of its own. A partner's library uses the builder's published library and never edits it.

## Color is a mode, and the rest are properties

In the design library, `color` is a variable mode. `variant`, `size`, `scaleSize` and the state are properties. The scale sizes are variables of the library's core, and the mark, the avatar and the avatar group carry `scaleSize` with every step from `XXS` to `XXL5`. Which other properties of a unit are properties of its set, and which are drawn as cases, "Which property is a variant and which is a case" states. `color` stays a prop on every stack, and a design read back turns the mode into the prop. A hue is a mode of the `Color` collection, read by its name in the same call that sets it, and the colour of a picture never chooses it.

## What stays in words

The library holds the pictures, the properties and the variables. It draws every state and every case a unit's column names, and a line in a description never stands in for a drawing. A showcase is proven against the library and may show more. The book states what no person sees: keyboard use and where focus goes; the overlay seam, and translation; a data shape as a whole; the rule that decides a refusal by the permission gate, whose denied state is drawn. A block with a behaviour and little or no look is drawn as its column says, its feedback composed from the units it holds. A description in the library carries one line and a link to the chapter that states the behavior.

## A value held worked out

The primary ramp comes from one seed by a formula, and the radius of each size step comes from one base value. A variable of the library holds a value or a pointer to another variable, so the library holds the worked-out values, and the rule that produces them stays in words.

## The snapshot

A person who wants to know where the library and a stack differ should not have to read either one in full. A snapshot is one file that states a design system in the Surface domain's own words. It is written from the book, from the library and from each stack's code, in one form. The one written from the book is the CONSTRUCT snapshot: the tool reads it from each unit's column, *The library draws*, and from the token pages. It is the plugin's only input and the third side of every comparison: the library is compared with it, and a stack with the library. It holds no word of a design tool and no word of a stack, so the web and a native stack write exactly the same file. The command `spnutils apps surface construct` writes the CONSTRUCT snapshot from the book, `spnutils apps surface library` takes in the inventory of each library file and writes the library's snapshot from the five, and `spnutils apps surface snapshot <package>` writes a stack's from its code. The three snapshots are made with no model. A file holds a time in UTC, and a command prints it in local time with its offset. A snapshot is the machine's own state and it never enters a repository, with one exception. The CONSTRUCT snapshot comes from the book alone, so spn-surface carries a copy of it, written from the book of each release, at `refs/support/surface/construct.snapshot.json` beside this ref. Whatever reads it in the plugin reads that copy and nothing else: never the book, a sibling checkout or the machine's home folder (`RD.SUPPORT.SURFACE.392`).

A snapshot has four parts and three levels:

| Key | Level | What it holds |
| --- | --- | --- |
| `snapshotVersion` and `source` | all | the kind of source (`CONSTRUCT`, `DESIGN_LIBRARY`, `WEB` or `NATIVE`), the time it was read, what it was read from, and the deepest level written |
| `vocabularies` and `units` | 1, the inventory | the closed lists a prop takes, and each unit with its name, layer, group, props, shown states and parts; in the CONSTRUCT snapshot also how each prop is drawn (`mtype`: `CROSSED`, `ONCE`, `MODE`, `TEXT`, `SWAP` or `NO`), the `collection` of a `MODE` entry, the unit's `crosses`, its `levelForms`, its `cases` and its `usage` |
| `tokens` | 2 | the ramps, the roles for light and for dark, the scale, the type steps and the theme |
| `measures` | 3 | for each unit and each size: the height, paddings, gap, radii, border and text size, each as a value and, where the side can say it, the token it is bound to |

A `MODE` entry names its `collection`, by the one name "Color is a mode, and the rest are properties" gives it; an entry without it fails the schema. `levelForms` lists a unit's allowed pairs of a level and a form, read from the book. `cases` and `usage` are read from the unit's column, and a unit with a choice table takes both from its table (`RD.SUPPORT.SURFACE.375`): the cases are what it draws once, its modes, its texts and its swaps, and a choice table's cases are among them; the usage is the table's first case that draws the unit, and names the instances the plugin places, with their props.

Level 1 finds most gaps. Level 2 finds a value that differs. Level 3 is read only for the units that levels 1 and 2 flag, because it is the largest. The category, the showcase layout and what a unit has are tags of the showcase only: they are never in a snapshot and never a gap.

## The gaps

The comparison asks two questions, each of one side and the side before it: does the library draw everything the book asks for, and does the stack support everything the library asks for? A gap is a unit, a property or a value that the library holds and the stack does not. What the stack holds beyond the library is not a gap; it is kept in the record and shown as one count, because a stack always holds more than the library draws. Only SaaS Plane's own design library is compared this way. Its kind is one of six, and the list is closed:

| Kind | What it means |
| --- | --- |
| `UNIT_ABSENT` | a unit that the library holds and the stack does not |
| `PROP_ABSENT` | a prop that the library holds and the stack does not |
| `VALUE_ABSENT` | a value of a closed list that the library offers and the stack does not; a value only the stack offers is counted, and is no gap |
| `VALUE_DIFFERS` | the same token or measure with another value, by more than half a pixel |
| `TOKEN_ABSENT` | a token that the library holds and the stack does not |
| `NAME_UNMAPPED` | a name the naming map does not know, so no comparison was possible |

One gap is a record with the keys `kind`, `level`, `path`, `lacks`, `library` and `stack`. `lacks` is `LIBRARY` for a gap of the library against the book and `STACK` for a gap of a stack against the library, and it is null for `VALUE_DIFFERS` and `NAME_UNMAPPED`, the two kinds that lack nothing on one side. The view prints a dash for it. The record is JSON, named by its package, and it also holds what the gaps were compared from and a count of what could not be compared. It holds `rulesApplied` too, the count of gaps each rule of the comparison left out, and `accepted`, the count of gaps an accepted difference left out. A view of one line for each gap is written from the record and is never edited.

The view stays short by five rules. A `UNIT_ABSENT` line replaces every line under that unit. Many `VALUE_ABSENT` gaps on one prop become one line with a list. What could not be compared is a count in the footer and never a line. Level 3 is written only for the units that levels 1 and 2 flagged. **A person and a model read the gaps, and never the library.**

## Reading the library

A library file has two readers. The tool, `spnutils`, reads the units of a library file from Figma and builds the file's inventory. The agent reads the variables and the styles through the Figma connector. Five library files are read, and Lab is never read, because it holds drafts.

**The tool does not hold its own reading yet.** Until it does, the agent reads each library file through the connector, with the scripts that its setup ships, and writes what it read as one inventory, and the tool takes the inventory in. The sections below state that reading.

- **A reading MUST only read.** It creates, sets, moves and deletes nothing in the file.
- **The tool MUST read a library file with a read-only token, and the token MUST NOT be printed, logged or kept in a file the tool writes.** The token is a Figma personal access token with no write scope. The developer keeps it in the seat file, under the key `SPN_DEVEX_AGENT_FIGMA_TOKEN`, and the tool alone reads it from the seat.
- **The connector reads the variables and the styles, and it makes every write.** It reads the variables with their collections and values, and the text and effect styles with their sizes. Figma's answer for a unit gives the id of a bound variable and never its name. In a file that uses Core, that id carries the variable's key in Core, so Core's variables are read first, with each variable's key, and the tool finds each name there. No plugin of the team's own runs inside Figma.
- **One inventory is read for each library file.** A unit in one library file is bound to a variable of another, so no file is read alone, and the five inventories are read by the same rules.
- **The tool takes an inventory in, and the agent never writes in the tool's folder.** The agent prepares the inventory outside the tool's folder, and a command of the tool checks it and copies it into place, as "The folders of the tool" states.
- **A reading shows the file as it is when it is read, whether or not its last change is published.** Another library file sees a change only after a person publishes it, and the inventory holds the time it was read.
- **A library file MUST be read again when it changed after the time its inventory holds.** The connector gives the file's last change, and the agent compares it with `readAt`.
- **A model MUST NOT read the library, an inventory or a snapshot to find a gap.** It reads the gaps.

### The inventory

The inventory holds the facts as Figma names them. **No rule of ours is applied to it**: no state is skipped, no mode is filtered and no name is changed. Its name is the library file's name in lower case with dashes, then `.inventory.json`. It is the one inventory of the file that "How the connector's work is carried out" says is read once and handed on, and "What the agent reads and keeps" states what it holds for the agent's own work. This heading states what it holds for the snapshot.

| Key | Holds |
| --- | --- |
| `inventoryVersion` | a number, `1` |
| `file` | the library file's `name`, `slug` and `layer`, the time it was read as `readAt`, and the depth it was read to as `depth`, which is 1, 2 or 3 |
| `collections` | each variable collection with its modes, and each variable with its type and its value in every mode. A value is a number, a string, a boolean, a colour, or `{ "alias": "<variable name>" }` |
| `styles` | the text styles with their size and line height, and the effect styles, by name |
| `pages` | only the pages that hold a unit. A unit is a set of components or a lone component, with its name and id. At depth 2 and deeper it also holds the facts below |
| `counts` | written last: `pages`, `units`, `variables`, `textStyles` and `effectStyles` |

An inventory is read to one of three depths, and each is a reading of its own.

- **Depth 1 holds the units and the tokens.** It holds every unit by name, and the collections and the styles.
- **Depth 2 holds each unit's props and how each prop is drawn.** A prop holds its type as Figma types it (`VARIANT`, `BOOLEAN`, `TEXT`, `INSTANCE_SWAP`, `SLOT`), its values and its default. The drawn facts are three, and without them a comparison cannot settle some props and values.

| The inventory holds | For | What it settles |
| --- | --- | --- |
| the frame of a version: its fill, border, corners and shadow, and the variables bound to them | the set | `bordered`, `raised` and `rounded` of the `surface` of a card |
| the sizing of a layer: fill, hug or fixed, across and down | the set | `fullWidth`, `inline`, `fill`, `fullHeight` and `widthStep` |
| the case and the decoration of a text layer: the line and its style | the set | `format` and `underline` of a text |

**The script that reads a unit reduces its layers inside Figma, so the inventory holds these facts for each set and never one entry for every layer.**

- **Depth 3 holds the measures, and it is read for one unit on request, never for a whole file.** For each version of the unit it holds the height and width, and the paddings, the gap, the radii, the border weights and the text size of its layers, each with the variable it is bound to. The comparison reads level 3 only for the units that the first two levels flag, and an inventory holds measures only for the units that were asked for.

**An inventory is not a record of every layer.** It holds no entry for every layer of every version, because the facts the snapshot keeps are reduced from them inside Figma. It holds no count of where each variable is used across the whole file. That count is made for one variable, through the connector, when a change needs it, such as removing the variable.

**The `counts` key MUST be written last, after the data.** It is what proves a file whole. The command that takes an inventory in counts what the file holds and compares it with the file's own `counts`. **It MUST refuse a file with no `counts`, a file whose counts differ from what it holds, and a file of an unknown `inventoryVersion`, and it MUST name the file.**

**The command's checks cannot tell a slip in copying.** The connector returns the answers as text, and the agent writes them to files. The counts and the shape of each unit pass a changed value, such as a list `["FIXED"]` written for `["FIXED","HUG"]`, or a name with a leading space. So before the inventory is taken in, the agent proves each unit by a short hash. The same script is sent again, wrapped in a function with its body unchanged, and it returns for each unit an eight-character hash of the unit with its keys sorted. A program computes the same hash from the answer file and compares by the unit's index, following `next` until each page is whole. A unit that differs is read again alone and corrected. A change in the file between the two readings is told from a slip in copying, and the newer reading is taken. The hash proves the file against a second reading of the same connector, so a change made and undone between the two readings is outside it.

**Every library file MUST have an inventory taken in before the library's snapshot is written.** A unit in one file is bound to a variable of another, so no file can be read alone. With one missing, the command names it and writes no snapshot.

### The naming map

The inventory says things in Figma's words. The Surface domain says them in its own. **The naming map is the one place a design tool's name appears.** It is one file that ships with the tool, inside the stack's tool. It maps by rule first and by exception second, and a name it does not know is a `NAME_UNMAPPED` gap, never a guess.

| The library says | The Surface domain says | Why |
| --- | --- | --- |
| `radius/base`, in the collection `Theme-Radius` | `theme.app.radius` | the rule for slashes does not find it, and a stack holds it as one value |
| `disabled`, type `VARIANT`, values `false` and `true` | the prop `disabled`, kind flag | Figma draws a boolean as a variant with two values |
| `withStartIcon`, type `BOOLEAN` | no prop: the presence of the content prop `startIcon` | it is a switch that shows or hides a part |
| `state`, values `rest` and `hover` | a shown state, never a prop | a shown state has a picture and no prop |
| the page `Media` in the file `DS 2-Components` | the group `Component - Media`, in the layer `COMPONENTS` | a page name is not a group name, and the file gives the layer |

A part such as `DSInputOTPCell` has no unit of its own name in a stack. The map says it is part of its host. The map is read by the tool and written by no command of it. A developer and an agent are never asked to edit a copy of it on the machine.

### The run

The comparison runs in five steps, and the tool does each by one command.

1. **The stack's snapshot.** `snapshot <package>` writes the stack's side from its code.
2. **Each library file is read and its inventory taken in.** The agent reads the file through the connector and prepares its inventory. `library` takes the inventory in.
3. **The library's snapshot.** `library` writes it from the five inventories, at the lowest depth among them, and `source` names that depth and the time of the oldest reading.
4. **The gaps.** `gaps <package>` compares the two snapshots and writes the gaps.
5. **The accepted differences.** `accepted <package>` takes in the gaps that have been looked at and accepted, and the next `gaps` leaves them out.

- **A reading older than a reading already taken in MUST be refused by its time, and so MUST a library snapshot that is older than one of its inventories.** `library` refuses an inventory whose `readAt` is earlier than the one it holds for that file, and `gaps` refuses a library snapshot that is older than any inventory. Each refusal names the file and the two times.

### The accepted differences

A gap that has been looked at and accepted stays a true difference between the library and the stack, and it stops being a finding. **An accepted difference MUST be recorded with its reason and taken in by the tool, and the comparison MUST read it.** The record is a file, `accepted.json`, in the stack's folder of the comparison, and its name does not change.

| Key | Holds |
| --- | --- |
| `acceptedVersion` | a number, `1` |
| `package` | the stack the differences are for |
| `accepted` | one entry for each accepted gap, with its `key`, the key of the gap, and its `reason`, one sentence that says why the difference stays |
| `counts` | written last: `accepted` |

**A key matches a gap exactly.** The key of a gap is its `path`, such as `DSImage.width` or `roles.scrim-backdrop.DARK`. For a `VALUE_ABSENT` gap it is the `path`, then `=`, then the value, such as `DSInput.type=EMAIL`. The value is the gap's `library`. Each key is compared as written, with case, and a prefix never matches: `DSImage.width` does not take `DSImage.widthStep`. A difference that is meant for several gaps names each one.

- **The command that takes the record in MUST refuse, and name, an entry with no reason, a key that two entries hold, a file whose counts differ from its entries, and a file of an unknown `acceptedVersion`.** It writes nothing when it refuses.
- **The list of gaps leaves out a gap whose key is accepted, and counts it.** The record of the gaps holds the count as `accepted`, beside `rulesApplied`, and the view says it in the footer. The footer also names a key that matches no gap, so that an acceptance that no longer applies is seen.

### What the comparison leaves out, and what it reads

A rule of the comparison removes a gap only when a named fact proves it, such as a mode name, a part name or a declared prop. A gap that has been looked at and accepted is the other way a gap leaves the list. **Each rule MUST be stated in the book before the code applies it, and the record of the gaps MUST count it in `rulesApplied`.** A reader then sees how many gaps each rule left out.

| Rule | What it removes |
| --- | --- |
| Leave out what is not a unit | an icon drawn as a component, a private part whose name starts with a dot, a named part of a unit, an item that a host draws once for each entry, and a case, which is told by its name: `property=value` cells joined by `, ` |
| Read the props the stack declares | a prop that the stack declares as a text, a number, a list or an object, which the first reading did not see |
| A shown state is a picture and never a prop | a state the library draws as a picture, counted by the first reading as a prop |
| A switch of the library is the prop of the stack | a switch such as `close` for `onClose`, and a presence switch whose prop the stack derives |
| A mode is a prop | the hue, the theme and the frame, which the library draws as a mode and the stack takes as a prop |
| A prop drawn another way | a prop that the library sets on an inner part, or states in its own words, or draws as a mode of a collection |
| The value none means not set | a value the library draws as none where the stack leaves the prop unset, including the plain look that the library holds beside the values of the web |
| A token held under another name | a token that the naming map names by another name, and a role that the stack holds once for both modes |
| A prop with no look | a prop on a list that is declared by hand and checked against the stack's code |

**The list of props with no look MUST be declared by hand and checked against the stack's code.** A prop on it changes nothing a person sees, so the library draws nothing for it.

### The values a browser works out

Some facts about the web are numbers that only a browser can say, because the style sheet works them out with `calc()` or `color-mix`, or sets them by mode when it runs. Without them, a comparison counts the name of such a value and compares nothing.

- **A second reader of the stack's snapshot MUST read these values from the running showcase.** It opens one page, reads the computed value of each such token in the light mode, sets the dark mode on the page, and reads the values set by mode again. It writes them into the `tokens` of the snapshot, and it touches no repository.
- **The colour tolerance of a computed value is not settled.** A length differs when it differs by more than half a pixel.

### The folders of the tool

The folder is `~/.saasplane/state/surface/`. It holds what the tool takes in and what the tool makes, in two folders, one for the library's side and one for each stack's.

```text
~/.saasplane/state/surface/
  library/                          the library's side, taken in by `library`
    ds-1-core.inventory.json        one inventory for each library file
    ds-2-components.inventory.json
    ds-3-widgets.inventory.json
    ds-4-containers.inventory.json
    ds-5-layouts.inventory.json
    library.snapshot.json           the five files as one neutral snapshot
  compare/
    <package>/                      one folder for each design system package
      snapshot.json                 the stack's side
      gaps.json
      gaps.md
      accepted.json                 the differences that are accepted
```

| Entry | Written by |
| --- | --- |
| an inventory | `library`, which takes in a file prepared elsewhere, checks it and copies it |
| `library.snapshot.json` | `library` |
| `snapshot.json` | `snapshot` |
| `gaps.json` and `gaps.md` | `gaps` |
| `accepted.json` | `accepted`, which takes in a file prepared elsewhere, checks it and copies it |

- **Every entry MUST be written by a command of the tool, and by no other way.** A developer and an agent never add or change a file in the folder. The tool's home folder is the tool's own, whatever it holds.
- **The tool makes a folder when it first writes in it.** No command makes the tree ahead of use.
- **The naming map is not in this folder.** It ships with the tool, as "The naming map" states.

### The steps a person follows

1. Run `spnutils apps surface snapshot <package>`.
2. For each of the five library files, the agent reads the file through the connector with the scripts of its setup and prepares the inventory outside the tool's folder. It runs `spnutils apps surface library --file <inventory>`, and the tool checks the inventory and copies it into `library/`.
3. When the fifth inventory is in, `library` has written `library/library.snapshot.json`. Run `spnutils apps surface gaps <package>`. A person and a model read the gaps, and nothing before them.
4. For a gap that has been looked at and accepted, the agent writes the accepted differences outside the tool's folder and runs `spnutils apps surface accepted <package> --file <file>`. The next `gaps` leaves them out and counts them.
5. To bring the library to the stack, the agent changes it through the connector, by the rules below. A developer saves a named version before the agent's first change in a file.
6. A developer publishes each library file that changed.
7. Read the changed library files again with step 2, then run `spnutils apps surface gaps <package>` and `spnutils apps surface status`. The comparison finds no gap that is not counted in `rulesApplied` or in `accepted`.

## Changing the library

The library is the baseline, and a stack is brought to it; this turned on 2026-10-10, when all five library files were published. A set of the library is built by the plugin from the CONSTRUCT snapshot, and no model draws a set (`RD.SUPPORT.SURFACE.295`). A change of the surface is stated in the construct first, drawn in the library second and built in the web or a native stack third, and an improvement is taken in the same order. So the library never draws what the book does not name, and a stack never builds a core unit that the library does not draw. **This order binds the core units, which are the ones the book names. It does not bind a unit that a stack provides on its own** (`RD.SUPPORT.SURFACE.082`). The book does not name a stack's own unit, so the library does not draw it as a published component. A stack's own unit that every stack should build joins the book first, and the library draws it then. **The library MUST NOT draw a task pattern, an app pattern, a skeleton or a sample page** (`RD.SUPPORT.SURFACE.099`). A pattern is a way to use the units and not a unit, so a drawing of one would be a second place where a page is decided, and it would fall behind the book. The book states each pattern with its skeleton, and a page is built from the units the library draws. The agent changes the library through the Figma connector and in no other way.

| Step | What happens |
| --- | --- |
| 1. The book | a new or changed name, value or rule is written here first |
| 2. Core | the variable or token Core holds is added or changed, because every other file reads through it |
| 3. The file of its layer | the component, the widget, the container or the layout that carries the change is updated in its own file |
| 4. A person's publish | the file is published by a person. Until then, no other file sees the change |

- **A change MUST run from the book to Core, then to the file of its layer, then to a person's publish.** No file is published ahead of the book, and no file skips Core for a token it reads.
- **A draft of a large change MUST sit in Lab until it is ready, and Lab MUST NOT be published.** A file that used Lab for a published part would be reading a draft nobody agreed to.
- **Every publish MUST be noted with its version.** A note that names no version leaves nobody able to say which change a stack is building against.
- **A stack MUST read a component, a property and a variable by the name the book gives it, and never by the version that published it.** The version marks when a file changed. It is not part of the name a stack imports by, so a later publish under the same name changes nothing a stack has to update.

## A developer's hands are two, and you change the library through the connector

A developer does not work in the design library by hand.

- **A developer's hands in the design library are two things: saving a named version of a file before your first change in it, and publishing a file.** The connector cannot save a named version, so you ask the developer for it and wait. Nothing else in the library is asked of a developer. Never ask a developer to draw, rebind, remove or confirm anything in Figma, and never ask a developer to add or change a file in the tool's folder.
- **You change the library through the Figma connector, except a set, which the plugin builds from the CONSTRUCT snapshot.** Follow the rules of "How an agent changes a library file through the connector" and of "How the connector's work is carried out". Name the developer's next step and show the result.
- **When something looks wrong, the developer sends a picture.** You correct the work and show the result again. The developer does not repair the file.

### Three kinds of work

- **A unit changes: a prop, a value or a look.** The connector changes it, under the rules below, so that the library holds the same change for every version of the unit.
- **A case is a unit with its prop values set, read from its column.** Place it as instances of the unit, and never draw it as a new look. A case drawn as a new look would be a second look for the same unit.
- **A use case, a page or a pattern built from units is not synchronised with a stack.** Compose it on request from the published library, in a file that is not a library file. It is never put into one of the library files.

### A builder manages the library, and a partner uses it

- **SaaS Plane's design library is managed by its builder, and a partner is given the published library and does not change it.** A partner composes pages from the published library in a file that is not a library file. What a partner may edit is the partner's own files.
- **Every agent is given the same rules.** The builder's agent and the partner's agent follow these rules alike, because the two modes differ in what you may edit and in nothing else. A rule is never kept back from an agent because of the mode it runs in.

### Before a connector writes

- **Before the connector writes, say what you are about to change**, stay inside the file and the items you named, and show the result after the write. A write outside the named file or items is a defect.
- **The connector never publishes a library.** A developer publishes, as the steps above state.
- **Before the connector's first change in a library file, a person MUST have saved a named version of that file.** The connector cannot save one, so ask the developer for it and wait. Without it, a change that goes wrong leaves no point to go back to, and you could not give one.

## How the connector's work is carried out

The connector works one call at a time, and each call costs time and tokens. Six agents worked in one library file by the connector, and each used between 57 and 131 tool calls. The cost came from finding the file again, from a read, a change and a proof as three calls for one item, from probing how the file behaves, and from a picture for nearly every step. These rules take that cost away without making a change less safe.

- **An inventory of a library file MUST be read once and handed on.** Before the first change in a library file, one reading writes an inventory of it, and every agent that then works in that file is given the inventory and does not read those facts again. "What the agent reads and keeps" states what the inventory holds for the agent's own work, and "The inventory" states what it holds for the snapshot. The inventory names the time it was read. A change to the file updates the inventory's lines for what it changed. Without one, each agent reads the same facts again, and each reading is paid for in full.
- **A script MUST cover a page and return its own proof.** The changes one page needs go in as few calls as stay safe to run again, and the same call returns what proves it: the ids changed or made, the counts, the names and the boxes. A separate reading call is made only where that proof is missing. A change followed by a reading call for each item is the same work paid for twice. A change to many versions of one unit is one script, and it returns what it changed in every version.
- **A script that moves or makes many nodes MUST answer dry first.** The dry answer says what the script would change and changes nothing, and the script runs for real only after the dry answer is read. A change that cannot be given back is then seen before it is made.
- **Calls that change a file MUST run one at a time.** Two agents never change one library file at once. Reading calls may run together. Two changes to one file at once can each be made against a state the other has already changed.
- **One picture MUST be taken for each set or sheet.** It is taken once after the set or the sheet is made or changed, and once more only after a repair of what the picture showed. A picture for each step costs more than the proof the step already returned.
- **What a probe learned MUST be written once, where the next agent reads it before working, and it is not tried again.** A fact about how Figma or the connector behaves, which an agent had to try out, is written down: how a slot of an instance is filled, how a version is copied, what the connector cannot do. The agent that learns a fact adds it to the list below. A fact tried twice is paid for twice, and a probe in a real file can change the file.

### The connector's facts

Read this list before you work in a library file by the connector. Each is a fact about how Figma or the connector behaves, written once so that no agent tries it again. **The agent that learns a new fact adds it to this list**, in the book first, and then here.

| Group | Fact | What the agent does |
| --- | --- | --- |
| Every call | A script is plain JavaScript | it uses top-level `await` and `return`, with no wrapper and no call to close the plugin |
| Every call | Only the `return` value comes back | it returns what it needs to see, because a log line is not returned and a notice throws |
| Every call | Every promise must be awaited | it awaits each one, or the call ends before the work does |
| Every call | No state lives between calls | it passes the ids of an earlier call as text in the script |
| Every call | A call names the skills it follows | it passes the skill names on every call, and the skill for changing a library on a call that changes a set, a version, a variable or a style |
| Every call | An error says whether the call may run again | it reads that answer, runs the call again if it is safe, and reads the file first if it is not |
| Every call | A child agent cannot read the connector's own skill resource | the plugin's skill carries the rules a child needs, and the child is given that file |
| Every call | The permission check refuses a call that changes a library when the order did not name the change | a writer does only what its order names, and reports the rest |
| Every call | An answer over 20,480 bytes is refused with "Return value exceeds the 20480-byte limit", and the refusal says that the call's changes to the canvas were not kept; this was seen once, on a read of 68,507 bytes | it returns ids, counts and hashes from a call that changes the file and never a whole read, and it takes a large read in parts |
| Pages | A call starts on the file's first page, every time | a script does not assume the page it worked on before |
| Pages | Moving to a page is an async call, and a switch loads the file again | a script switches page once and never inside a loop over pages |
| Pages | Work on several pages is several calls | it sends one call for each page, and calls that only read may be sent together |
| Pages | A component on another page of the file is fetched by its id with `getNodeByIdAsync`, and `createInstance()` on it places an instance while the current page is another; this was seen for three components | it makes the instance from the id, with no change of page and no import by key |
| Reading | A search by type uses an index and is far faster than a search with a test | it searches by type first |
| Reading | A node's subtree is searched by a selector | it uses the node's query, such as a name, a type or a child of a type, and not a loop |
| Reading | A set holds its property definitions and a version does not | it never reads the definitions from a version, and optional chaining does not make that safe |
| Reading | Only some kinds of node have some properties | it checks the node's kind before it reads such a property |
| Reading | A picture of a node comes back in the answer | it asks the node for it, and sets the scale when the default size is too small |
| Reading | `get_screenshot` answers with a link unless it is passed `enableBase64Response: true`, and a shell that cannot resolve `www.figma.com` cannot fetch the link | it passes the flag and reads the picture inline, and it passes a page's id for a picture of the whole page |
| Reading | A picture of a section 4,315 wide at `maxDimension` 3000 shows labels of 12 px and does not show a dashed edge of 1 px, which a picture of the set at twice its own width shows; each was seen once | it takes the section at 3000 to read labels, and the set at its own size to see an edge of 1 px |
| Reading | `exportAsync` of a version as a PNG gives the same bytes for the same drawing: the hash of the bytes stood on five versions while a frame became a slot and a fill moved from the root to a layer | it hashes those bytes before and after a change that must leave a version's look as it stands |
| Reading | A search by type returns nodes in the order of the layers, so a hash over its result changes when layers are reordered | it sorts by id before it hashes a proof |
| Reading | What stands inside a hidden layer of an instance is not read the same way each time: `findOne` on an instance did not return a hidden slot until the instance's yes-or-no property was set on, and `children` of a hidden instance read empty on some versions and whole on others; each was seen once | it sets the property on before it looks for the slot, and it changes the inside of a layer before the layer is hidden |
| Reading | A hidden child of an auto layout parent reads `layoutSizingHorizontal` as `FIXED` after it is set to `FILL`, and its `layoutAlign` reads `STRETCH`; this was seen on two sets | it compares `layoutAlign` and not the sizing on a hidden layer |
| Reading | A variable and a collection are fetched through `figma.variables`, as `figma.variables.getVariableByIdAsync` and `figma.variables.getVariableCollectionByIdAsync`; `figma.getVariableByIdAsync` does not exist, and a call to it throws | it writes both calls with `figma.variables.` |
| Reading | The connector returns an inventory's answers as text, and the agent writes them to files | it proves each unit by a hash, as "The inventory" states, because a slip in copying passes the counts |
| Writing | A call that changes the file must say what it changed, and an answer over 20,480 bytes is refused | it returns every id made or changed, as ids and counts, and keeps the answer under the limit, because the refusal says that the call's changes were not kept |
| Writing | A colour runs from 0 to 1, and its opacity sits on the paint | it writes the three channels with no alpha, and sets the opacity on the paint |
| Writing | Fills and strokes are read-only lists | it copies the list, changes the copy and assigns it back |
| Writing | A paint bound to a variable is a new paint | it assigns the new paint back |
| Writing | A paint read from one node and assigned to another keeps its variable binding, on `fills` and on `strokes`, also when it is copied as plain JSON; this was seen in four pieces of work | it copies the ground of a set or the fill of a label from a neighbour's paint, and binds nothing again |
| Writing | An opacity set on a paint that is bound to a variable draws opaque | it sets the opacity on the layer |
| Writing | A text cannot change before its fonts are loaded | it loads the text's own fonts first, then changes it |
| Writing | A text changed in place with `insertCharacters` and `deleteCharacters` keeps its style, text added at its end takes the font of the last character, and a layer that was named by hand keeps its name when its text changes (13 texts and four headers) | it loads the fonts, changes the text in place from its last match to its first, and sets a label's layer name in the same call |
| Writing | Setting `fontName` on a text layer that holds a text style takes the style off that layer, and the layer keeps its size, its line height and its bound font family (7 of 7 layers) | it sets `fontName` only where the layer is to hold no text style |
| Writing | A text layer whose horizontal sizing is `FILL` in an auto layout frame keeps `textAutoResize` at `HEIGHT` when it is set to `WIDTH_AND_HEIGHT`; this was seen once | it sets `layoutSizingHorizontal` to `HUG` first |
| Writing | A text that hugs keeps the edge it is aligned to when its text changes: a right-aligned label kept its right edge while its left edge moved from 334 to -582, and a left-aligned header kept its `x` and grew to the right; a text style set on such a text makes it grow downwards | it reads `textAlignHorizontal`, sets `x` again after the change, and checks a longer label against the width of its section |
| Writing | The `x` and `y` of a rotated layer are the place of its own corner after the turn and not of its box: an ellipse turned by 90 at `x` 0 and `y` 0 has its box one diameter above, and `absoluteBoundingBox` gives the true place (ten layers of one set) | it places a rotated layer by the difference of two `absoluteBoundingBox` readings, and the layer's rotation, fills and bindings stand |
| Writing | A set's `description` reads an apostrophe back as `&#39;`, a text written with `&#39;` reads back as `&amp;#39;`, and `descriptionMarkdown` read as an empty text; this was seen on one set | it writes the plain apostrophe for each `&#39;` when it writes back a description it read, and makes the call throw unless the description reads back as wanted |
| Writing | A new node lands at the corner of its page | it places the node clear of what the page holds |
| Writing | A child must be in its parent before it is set to hug or fill | it appends the child first, and sets the size before the sizing modes |
| Writing | A variable or a style that fits is better than a plain value | it binds fills, strokes, padding, radius and gap to a variable where one fits, and uses a plain value only where the work names one |
| Writing | Versions combined into a set sit on one another | it lays them out in a grid and resizes the set before the set is read or shown |
| Writing | A comma inside a version's value splits its name | a value never holds a comma, or the set breaks |
| Writing | A copy of a version made inside a set (`clone()`) loses its property ties, and a slot in it becomes a plain frame | it compares each copy with its twin and ties it again |
| Writing | A `clone()` keeps the variable bindings, the text styles and the fill overrides of its layers, and a copy of a frame that holds an instance keeps the instance's explicit variable modes, its property values and its filled slots (23 of 23 copies of a slot, 15 of 15 copies of a version, 45 copies of a component) | it binds nothing again on a copy, and ties again only what the row above says a copy loses |
| Writing | A set's default version is the one at its top left, not the first in its list of children | it changes the default by changing places in the grid, and reads the default back |
| Writing | The options of a variant property read in the order of the grid's rows and not in the order the versions were combined in; this was seen once, and whether the place in the grid is the cause was not tested | it reads the options back after the grid is laid out |
| Writing | A yes-or-no property ties only to a layer's `visible` and a text property only to a text's `characters`, and the root of a version cannot be tied to a property, so no property changes a fill, a padding or another layer | it puts what a yes-or-no property switches on a layer of its own, such as a rectangle that carries the root's fill, stroke and radius, and raises the root's padding by the weight of a stroke that counted in the layout; what no property can change it sets on the instance in the case, and says so in the sheet's label |
| Writing | A component of Core, such as an icon, is made through the connector with no picture from bytes: `figma.createNodeFromSvg` on the icon's SVG, `outlineStroke()` on each shape, `figma.union` of the outlines and `figma.flatten` into the component give one filled vector of the same box and weight as the icons beside it (five icons) | it builds an icon that Core lacks this way, and a shape that has a fill and a stroke goes into the union twice, as the outline of its stroke and as the shape with its stroke taken off |
| Writing | An id cannot be guessed | it reads an id from an earlier answer and never makes one up |
| Writing | A name's beginning can match more than one node | it cleans up only by exact id |
| Writing | A component that is removed is still fetched by its id, with no parent and on no page, and `remove()` on a layer inside a set that is already removed throws `Removing this node is not allowed`; this was seen in one probe in the drafts file | it proves a removal by the children of the parent and not by fetching the id, and it removes a set whole and none of its layers after it |
| Writing | The layers panel reads from a parent's last child to its first, and `appendChild` or `insertChild` of a node into the parent it stands in changes its place in that order and nothing else, for a page's sections and for a section's pieces (101 nodes and 16 sections kept their boxes) | it orders the layers by exact ids, appending the children from the last of the panel to the first, and checks that no box changed |
| Renaming | A set keeps its id and its key when its name changes, and so does each of its versions, and a lone component keeps its id and its key when it is renamed (seven sets and one lone component, each read before and after in calls of their own) | it renames by exact id, and reads the id, the key and the versions back in a call of its own |
| Renaming | An instance's layer that Figma named after its component takes the component's new name by itself, and a layer that was named by hand keeps the old name (51 layers followed, and 11 named by hand did not) | it renames the layers named by hand by their ids, and leaves the others |
| Renaming | A variant property and its values are named by the versions' names, and the versions keep their ids and keys when the names change | it renames a property or a value by renaming it in the name of every version, and it adds a property by naming it in every standing version before it copies the versions of the new values |
| Composing a sheet | A part moved across calls can fail with no error and leave a node with no parent | it makes the wrapper frame first, builds each part inside it, and fetches the wrapper by id at the start of each script |
| Composing a sheet | A child cannot be appended to an instance | it fills a slot through the slot, and the footer slot of a nested popup takes an instance put in through it |
| Composing a sheet | A node appended to the slot of an instance stands beside the slot's default content, which stays, and the appended node takes a new id that begins with `I`; this was seen in three pieces of work | it removes the default content with `remove()` on that child, builds a frame whole before it appends it to the slot, and reads the new id back |
| Composing a sheet | An instance holds its text in a text property | it sets the text through that property, reading the exact key from the instance, and sets the text of a layer only where no property holds it |
| Composing a sheet | On a layer of an instance, `setBoundVariable(field, null)` takes off a variable that the main component binds, and the field then takes a plain value; this was seen on a corner radius and on a padding | it takes the binding off on the instance and then sets the value |
| Composing a sheet | A change to an instance inside a component does not reach every placed instance whole: a placed instance that overrode one variant property of the inner instance kept the inner instance's earlier version, and a text override on an inner instance whose version changed was dropped; each was seen once | it reads the overrides of every placed instance before it changes an inner instance, and sets them again afterwards |
| Composing a sheet | A swap set through a swap property keeps the fill override of an icon's vector, because every icon of Core names its vector `outline`; this was seen on one set | it sets the colour once on the vector `outline`, and swaps the icon through the property |
| Composing a sheet | A variable, a style or a component of another library file is not in the local lists | it finds one through a layer of this file that uses it, or imports it by key with `importVariableByKeyAsync`, `importStyleByKeyAsync` or `importComponentByKeyAsync`, the key read in the library's own file or in its inventory; the component that comes back is what a swap property takes in `setProperties` |
| Composing a sheet | `setTextStyleIdAsync` and `setEffectStyleIdAsync` take the id of another library's style as a neighbouring layer carries it, in the form `S:<key>,<node>`; each was seen once | it reads the id from the neighbour and sets it, after it loads the style's font for a text |
| Composing a sheet | A mode of a collection of Core is set on an instance with `setExplicitVariableModeForCollection`, also on an instance that stands in the slot of another instance, and the collection is fetched by the id that a placed instance's `explicitVariableModes` carries | it reads the collection id from a neighbouring instance, on this page or on another, and sets the mode on the new instance |
| Composing a sheet | A mode set on a component is carried by every instance placed from it, and the mode of a frame above an instance reaches the instance only after `clearExplicitVariableModeForCollection` takes the instance's own explicit mode off; each was seen once | it sets on the component a mode that every instance is to have, and clears the mode on the instance where the frame's mode is to reach it |
| Composing a sheet | A picture of a whole case cannot be edited | it never places one as a fill or a layer, and builds the case from layers |
| Composing a sheet | A group whose members are joined (`attached`) places its members and draws nothing on them | it sets the joined look on each member instance, as the next rows state |
| Composing a sheet | The joined look is overrides on each member instance: the inner corners square and the shared border dropped | the first member gets the radii of its inner side at 0; a middle member gets all four radii at 0 and no stroke on the side it shares; the last gets the radii of its inner side at 0 and no stroke on the shared side |
| Composing a sheet | A member put in new has none of those overrides, and a group of one needs none | it sets them on each new member of a group of two or more, and reads the radii and stroke weights back |
| Composing a sheet | The web joins members by the group's own CSS on its direct children, and neither the group nor a member has a property for it in the file | it draws the joined look by overrides, in a button group and in a toggle group alike, and has read no other unit that joins members |
| Slots | `createSlot()` on a version adds a slot property to the version's set, and on a lone component to the component itself, and the new slot is tied to that property before its layer is named | where the frame it replaces is tied to a slot property that stands, it makes the slot, ties it to that property and deletes the added one, in one call; where the slot is a new place, which was so on three sets and nine lone components, it keeps the added property, deletes nothing, and checks that exactly one slot property was added |
| Slots | A call that throws leaves the file as it was, which was so each time the file was read after a throw | it makes the call throw unless exactly one slot property was added, no layer is tied to it, and the set's definitions, the version's key and the version's look are as they were at the start |
| Slots | Naming the new slot layer renames the added property | it reads the added property's key again just before the delete, because the key kept from right after `createSlot()` is stale and the delete throws |
| Slots | A new slot keeps the x and y that `createSlot()` gave it after it is put into an auto layout parent | it sets the slot absolute, sets its x and y to the frame's old x and y, and sets it back to auto |
| Slots | A new slot has a stroke of weight 1 on all four sides, counted in layout | it copies the four sides' weights, the dash pattern, whether strokes count in layout and the effects from the frame, because copying one stroke weight makes every side 1 and moves the children |
| Slots | `strokesIncludedInLayout` is set on a new slot only after its `layoutMode` is set, and before that the call throws; this was seen once | it sets `layoutMode` first |
| Slots | Copying a frame's values onto a slot loses the frame's variable bindings | it reads the frame's bound fields before the frame goes, binds each one again on the slot, and compares the bindings with the twin version's slot |
| Slots | The frame is gone once the slot replaces it | it finds a binding lost earlier only by comparing the slot with the twin version's slot at the same path |
| Slots | On a set of hundreds of versions each add and delete of a slot property walks every version, about 11 seconds for each layer on a set of 850 versions | it makes the slot by copying the twin version's slot into the version, which adds no property |
| Slots | A copy of a slot made with `clone()` and put into another version of its set stays a slot, keeps its layout, its children and its variable bindings, adds no property, and loses its property ties, `slotContentId` and `visible`; this was so in every copy read on two sets (23 of 23, and 4 of 4) | it ties each copy again in the same call, with `componentPropertyReferences`, and compares the copy with the twin's slot |
| Slots | A call longer than about 90 seconds can lose its answer or be cut | it keeps each call to about eight layers on such a set, and reads the file to see what was done |
| Slots | A copied slot is proven against a slot made the first way | it compares every field of the copy with a slot of the same size made by `createSlot()`, except its position, which follows the version's size |
| Slots | A slot carries two ties at once, `visible` to a yes-or-no property and `slotContentId` to a slot property, and an instance with the yes-or-no on shows the slot laid out in its auto layout parent; this was seen on two sets | it ties a slot that is hidden by default to both |
| Slots | A slot moved into another frame of its own version with `appendChild` or `insertChild` stays a slot with the same id and keeps its ties, the set's property definitions stand, and an instance placed before the move keeps what it drew and what its slot holds (two versions in the drafts file, then 4 of 4 versions and 14 instances of one set) | it moves a slot into a new frame with no new tie and no new property, and compares the hash of every placed instance before and after |
| A library's update | A file takes a library's published update only when the update is accepted in that file in Figma, and the connector cannot accept it | it asks the developer to accept it, and reads the file's instances again afterwards |
| A library's update | An outdated Figma desktop app can list the update and not take it, so the file's instances stand on the library's earlier state; this was seen once, and the update took after the app was updated and restarted | it compares a set's versions and properties in the file with the library's published set, and asks the developer to update the app and restart it when they differ |
| A library's update | After an update is accepted, a nested component may have changed size, and a layout can then fail its own proof with no change in the file's own sets; this was seen in one file, where a usage became 8 px shorter and the component that shrank was not found | it reads the file's sets and runs the layout proof and the scan again, and mends a layout that fails with the alignment script, its plan read first |
| A library's update | A library's publish carries components and styles, and a change to the canvas alone gives Figma nothing to publish, which was seen once, in a file whose sets were unchanged | it does not ask for a publish after a label, a sheet or a section is moved, and it reads a set's publish state to see whether anything is left to carry |
| A library's update | `getPublishStatusAsync()` on a component, read in the library's own file, answers `CURRENT` for a published component and `UNPUBLISHED` for one made since the last publish; whether another file can import an unpublished component was not tried | it reads the status before it imports a component by key, and draws with a published component until a person has published the library and the update is accepted |
| What the connector cannot do | It cannot save a named version | a person saves it before the connector's first change in a file |
| What the connector cannot do | It cannot load all pages at once | it works on one page at a time |
| What the connector cannot do | It cannot set plugin data | it keeps its notes outside the file |
| What the connector cannot do | It cannot create an image from bytes | it builds the drawing from layers, and an icon is an instance of the icon unit |
| What the connector cannot do | It cannot read `devStatus` of a section: the read throws, which was seen once | it does not read it |

## What a library file holds

A library file is read by people and by scripts. A person reads the grid of a set to see every case at once. A script reads the label of a set to learn how the grid is laid out, and reads the top left of a set to learn its default. So each rule below keeps one thing true that a script or a person relies on.

### A file's pages are the showcase's groups, and a unit is one section

A person who opens a page reads it as a tree: the page, then one section for each unit, then what the unit holds. A page of a file that holds units is one group of the showcase, so a person who knows the showcase finds the same groups in the file, in the same order.

- **A page's name MUST be its group's name in the showcase, without the `Component - ` that starts the name of a group of components, and the pages MUST stand in the showcase's order.** The group `Component - Actions` is the page Actions. The group `Data Entry - Fields` is the page Data entry · Fields, and its two sisters are Data entry · Pickers and Data entry · Composites. A file does not order its pages by its own rule.
- **A published file MUST have a cover as its page 0, which Figma shows as the file's thumbnail, and the plugin MUST draw it from the CONSTRUCT snapshot.** The cover names the file, its layer and the book's commit the file was built from. It holds no unit, and it is the one page of a file that is no group of the showcase.
- **The Core file's pages, after its cover, MUST be the showcase's Core entries that show tokens: Colour, Type, Scale, Icons and States.** The file holds no component, so its section holds a group of tokens with its specimens and not a unit. The showcase's Core entries Primitives, Patterns and Inline alignment show components, so they have no page in this file and stay in the showcase. "A section of the Core file" states what such a section holds. The Scale page holds Control sizes and The layout's measures as the showcase does, and States is drawn from tokens only, one row for each state. The pages of the Widgets, Containers and Layouts files are Widgets, Containers and Layouts.
- **A page that is no group of the showcase MUST NOT be kept, but for the cover.** What it holds goes to the page of the unit it serves, and what serves no unit is removed.
- **A page MUST hold one section for each unit of its group, named exactly as the unit, such as `DSInput`, and nothing else at its top level.** No level stands between a page and its units. A label or a usage that stood loose on the page would be parted from its unit the next time the unit moves, so every thing a unit owns sits inside the unit's section.
- **The sections MUST stand in the showcase's order of the group's units, in one column down the page.** A person who knows the showcase then finds a unit where the showcase lists it. A unit that the showcase lists and the page has no node for gets no section, and the agent reports it.
- **A unit's section MUST hold these, from the top down, in this order: the header, the set with its row and column labels, the usage, the cases and the parts.** A person sees what a unit is for before every switch on it, as the page of the unit in the showcase opens with its Usage. A band the unit has nothing for is left out with its label, and a top-level unit always has its Usage. A unit whose column draws nothing once and no mode, text or swap owes no sheet of cases. A top-level unit owes a usage of its primary use whatever else it draws, as "What a library file owes of a unit" states.

| Piece | What it is |
| --- | --- |
| The header | one text, named `header · ` and the unit's name. It reads the unit's name, ` — `, what the unit is in one line, then the layout, with its rows and its columns |
| The set | the unit's set, unchanged, with its column labels above it and its row labels in one column on its left |
| The usage | a text `label · Usage`, and under it each usage of the unit with the caption that names it |
| The cases | a text `label · Cases`, and under it the unit's sheets of cases and its loose case components |
| The parts | a text `label · Parts`, and under it one section for each part, named as the part and built the same way |

- **The header's one line MUST come from the set's own description, its first sentence, and its rows and columns from the set's own grid.** A header written from memory would be a second statement of what the set already says. The header is the unit's one header label: it carries the layout in the form that "The form of a label" states, and a unit has no second header text beside it. A header label that was drawn before, with the unit's name and a layout, is replaced by the header, and the layer name and the one line are the header's only additions.
- **A part is a set or a lone component that serves another unit and that the showcase does not list on its own, and it MUST sit in the section of the unit that owns it.** The owner is the unit whose source uses the part, read from the stack and never guessed from the name. A name that starts with a dot is always a part. A part that two or more units on the page use sits in a last section of the page, named `Shared parts`, built the same way.
- **A label or a usage of a unit MUST sit in that unit's section, even when it was drawn on another page.** One that is found on the page of another unit moves to its unit's page and into its section. A thing whose unit is not in the file, or that serves no unit, is removed, and the agent reports each one it removes with what it was.

The distances are fixed, so that every section reads the same. They are in pixels, in the section's own coordinates.

| What | Distance |
| --- | --- |
| Padding between the section's edge and its content | 80 on every side, the header at the top left |
| From the header to the top of the column labels | 48 |
| From the bottom of a column label to the top of the set | 16, the label's left edge at its column's left |
| From the row labels' right edge to the set | 24, the column as wide as its widest label, each label centred on its row |
| Between two bands | 80 |
| From a band's label to its content | 24 |
| Between things in one band | 48, standing left to right and wrapping under after 4,000 wide |
| Between two sections of a page | 240, the first at the top left of the page |

The section is as large as its content and its padding, and it holds each of them: a section neither clips nor resizes what is in it by itself.

- **Moving a set into a section, or to another page, MUST change nothing of the unit.** Its key, its versions' keys, its name, its size, its default and its properties stay as they were, and an instance keeps its main component. An agent reads them before the move and after it, and reports both, as it does for a default.
- **Size stays a property of a unit, and a set keeps a version for each value of the size of the web.** A value that is only a colour, a corner, a height, a padding or a text size is carried by a variable and never by a version. Which other properties of the unit are properties of its set, and which are drawn as cases, "Which property is a variant and which is a case" states.
- **A unit that the showcase lists and that is drawn only as a sheet of cases MUST have a section with its header and its sheet.** It has no set of versions. Its header's layout clause reads `no set of versions, shown as cases`. The sheet's label stands above the sheet in the band of cases, its layer named `label · ` and its text, and it is never the unit's header.
- **A thing MUST be given room for what it draws, and "nothing meets" and "inside its section" MUST be judged by what a thing draws as well as by its box.** An open select in a usage draws a popup outside its box, and a shadow reaches past its box. Each of them stays clear of its neighbours and inside its section.
- **The layers panel MUST read from the top in the page's order, and inside a section in the order of its pieces.** A person who reads the panel reads the page.
- **A section MUST take the fill that its page's content stood on.** The unit then reads on the ground it was drawn on.
- **A usage's layer and its caption MUST begin `usage · ` and the unit's name, with no comma straight after the unit.** The unit's name is then read the same way in every usage.
- **A row label MUST be centred on its row's band.**

### A section of the Core file

The Core file holds no component set, so a section there holds a group of tokens and not a unit. It is named as the group, such as `Control sizes`, and holds these, from the top: the header, an optional label with the rest of the description, and one frame of specimens.

- **The header is named `header · ` and the group's name, and it reads the group's name, ` — `, and one line.** The label that follows holds what the line cannot.
- **The frame of specimens MUST draw each specimen from the file's variables and text styles, with no value typed in.** A specimen then changes when a variable changes.
- **A frame of specimens that sets a variable mode MUST be moved whole, and a specimen MUST NOT be taken out of the frame that gives it its mode.** A specimen outside its frame reads in the wrong mode.

### A set and its layout

- **A set's versions MUST sit in a grid inside the set. No version sits outside the set's box, and no two versions meet.** A version outside its set belongs to no set when a person looks, and two versions that meet hide each other.
- **A set's header label MUST state which property runs on the rows, which runs on the columns, and in which order the values of each run, and the set MUST be laid out as its label says.** The label is the one place a layout is written, so a script and a person read the same layout. The one thing a label does not decide is the default version, which the next heading decides, and that rule always wins over a label.
- **A layout MUST be changed by changing the label and the set together.** A set laid out in a new way under an old label, or a label rewritten over an old layout, leaves the two saying different things.
- **A set whose label states no layout MUST NOT be laid out again by an agent.** An agent that chose a layout for it would be choosing for the designer, and the choice could not be checked against anything. The agent reports the set, so that a label can be written.

### The default version is the stack's default, and the label tells the truth about it

In Figma, the default version of a set is the version at its top left. So the layout of a set decides its default, and moving versions can change the default without anyone seeing it. The default of a unit is what a stack gives it when no prop is passed. A stack states it, the library follows it, and the library does not state a second default of its own.

- **The version at the top left of a set MUST carry the stack's default value of every property.** Then the row and the column that hold the default come first.
- **The header label of the set MUST name that default.**
- **Where a label and the stack differ on the default, the stack decides, and the label is corrected first. A label is never followed to a different default.** A default the library holds under a label's word would become the default of every instance placed from it, and no stack builds it. A label states a default as a claim, and a claim is checked against the stack, never the other way.

These three rules and the layout rules above do not conflict, because they cover two different questions. A set follows its label for which property runs on the rows and which on the columns, and in which order. It does not follow a label for which version comes first: the row and the column that hold the default come first whatever an old label says, and the label is corrected to say so. A set whose label states no layout is not moved, and if its default version is not the stack's, the agent reports it and does not move it.

- **Anything that moves versions MUST read the default version of each set it touches before it moves them and after, and report both.** A default that changed is then seen on the day it changes, and not found later in a file that others have built on. The evidence is a layout done from labels that still named a default the stack did not give: seventeen sets were laid out as their labels said, and each one's default moved from the stack's default to another size.

### Versions that are added are laid out

- **Whatever adds versions to a set MUST place them in the grid as the label's order gives, and MUST prove that no version is outside the set and no two versions meet.** A copy of a version lands on top of the one it was made from, and a set with stacked or outside versions reads as one case. The connector's facts state that combined versions sit on one another.
- **Before a property or a value is added to a set, work out how many versions the set will hold after it, and say so.** A property multiplies the versions of a set, and one more property multiplies them again, so the product is not seen until it is worked out. A property that is not the size, a state or the shared `variant` is not added to the set at all, because it is drawn as a case, as "Which property is a variant and which is a case" states.
- **The default value of a property that is added MUST draw what the set draws now.** The versions that stand are then the look of the default, only the other values are new drawings, and no instance already placed changes.
- **A set MUST NOT be grown past 1,000 versions.** A set of thousands of versions cannot be laid out or read. One change that added three properties to one unit made 2,040 versions at once, and nobody saw the product until the work had run for 87 minutes.
- **A property of the web unit that is not the size, a state, the shared `variant`, a look drawn once, a prop of forms of the block itself or a property a named unit keeps crossed is drawn as a case on the unit's sheet, and not as a property of the unit.** The sheet holds one component for each case, so the set stays small, and the case is the unit with its prop values set and is not a unit of its own.

### A label

A set, a lone component and a sheet each have a header label. A row of a set may have a row label.

- **A label MUST name its unit in a form a script can read: its layer is named `label · ` followed by its text, or `header · ` followed by the unit's name for a header, and the text takes one of the three forms stated below.** The unit's name is the name the book gives it. A script then finds the unit that a label belongs to by reading the label, and not by guessing from where it sits. A label's layer name equals `label · ` and the label's whole text, so a change to the text changes the name in the same call. A row label and a column label name the values their row or column holds, and a script finds the unit by the row or column the label sits beside.
- **A label MUST sit inside its unit's section, on the unit's own page, and move when the unit moves.** A label left behind when its set moves names nothing near it. A label outside its unit's section, or on a page other than its unit's, is a defect, and an agent that finds one reports it. "A file's pages are the showcase's groups, and a unit is one section" states where in the section each label stands.

### The form of a label

The layer of a row label and of a column label is named `label · ` followed by the label's text, and the layer of a header is named `header · ` followed by the unit's name, so the name and the text say the same thing about the unit. A label has one of three forms.

| Label | Its text |
| --- | --- |
| Header | the unit's name, then ` — `, then what the unit is in one line, then ` · `, then the layout, with notes if there are any |
| Row | the values of the row, in the order of the axes, joined by ` · ` |
| Column | the values of the column, in the order of the axes, joined by ` · ` |

- **The layout of a header is `rows: <axis>` and `columns: <axis>`, in either order, joined by ` · `.** An axis that is left out is one row or one column, and `one row` and `one column` say it in words. Where the unit is one component with no grid it reads `one component`. Where the unit has no set of versions and is shown only as a sheet of cases, it reads `no set of versions, shown as cases`. A note may stand before or after the layout, each after ` · `, and after `one component` it may follow a comma. A script finds the layout by its words and reads no note, except the one clause that names behaviour. That clause is a note of its own, `behaviour: ` followed by the names of the properties, joined by `, `, such as `behaviour: collapsible, sticky`. It names each property of the unit that changes only how the unit behaves, as "What a library file owes of a unit" states, and a unit with no such property has no clause.
- **An axis is a list of cells in the order they run from the top left, joined by `, `.** A cell is `<property>=<value>`, or only `<value>` when its property is the property of the cell before it. Two properties that multiply, the outer one first, are joined by ` x `, so `variant=SOLID (default), SUBTLE x size=SM (default), XS` gives every size under each variant.
- **A cell names a value in whole, or by the part of it before its first `: `.** For the value `address: the row goes to an address` the cell is `case=address (default)`. A value that is long, or that holds `: `, is then written short, and a script reads both forms.
- **A grid whose rows hold different cases is written with one cell for each row, and its columns read `the other cases of that kind`.** `DSFormats` stands for five formatters, one in each row, and a row's cells are that formatter's own cases, so no one property runs across the columns. Its rows axis names what each row holds, such as `case=currency USD (default), date US_STANDARD`, and a note after the layout may say what the set stands for.
- **The default is marked ` (default)`, written once after the one value of each property that the stack's default version carries.** That value comes first in its list, because the version at the top left carries the default.
- **A row label and a column label name values and no property.** The header names the property, and the label is read against it. `SOLID (default) · SM (default)` is the row of the default variant at the default size.

Two headers follow, written in this form: the one for `DSDataUnit` and the one for `DSList.Item`. Each set crosses its size with its states and nothing else, as "Which property is a variant and which is a case" states.

```text
header · DSDataUnit — a label and its value · rows: size=SM (default), XS, MD, LG, XL · columns: state=filled (default), empty
header · DSList.Item — one row of a list · rows: size=SM (default), XS, MD, LG, XL · columns: state=rest (default), hover, disabled=true · divided is off
```

### A sheet of cases, and a case

- **A sheet of cases MUST sit in its unit's section, in the band of cases under the unit's usage, and its name MUST be the unit's name followed by `cases`, such as `DSInput cases`.** The section then shows the unit and its cases in one place, and a script finds the sheet from the unit's name.
- **A case MUST be the unit with its prop values set, placed as instances of the unit, and never drawn as a new look.** A case drawn as a new look would be a second look for the same unit. A case is named for what it shows, under one property named `case`, because Figma names the property `Property 1` when the components it combines are not named `property=value`. A case's name holds no comma, and the connector's facts state why.
- **A case is not a unit and is never published as one.** A case is one drawing of a unit with some of its property values set, and it is named by the values it shows, as cells `property=value` joined by `, `. A name is unique on its sheet, and no cell holds a second `=` or a comma. A comparison never counts a case as a unit. A case MUST NOT take, in the file, a form that publishes it as a component of the library. A published case would appear among the units a stack imports, so a stack would be offered units the book never named, one for each case of each sheet.

How the library keeps to the last rule is stated as far as the book can state it today. The form a case takes in the file must not publish it as a component of the library. The files that hold cases are brought to this by their own change, and until that change lands a case that is still a component is a recorded difference from this rule, never a form to copy.

### A usage

- **A usage is a node in the section of the unit it shows, in the band of Usage, and its name is `usage · ` followed by what it shows.** It is an instance, a frame of instances, or the text that captions one. It shows a unit in a use that the grid of its set cannot hold, such as a select open, a pair of arrows both on, or a dialog over its backdrop.
- **A usage is not a unit and is not a stray.** It is no component, holds no version and is never published. It belongs to the unit it shows, so the scan before a publish does not list it as a stray. Like every other thing in a section it sits clear of the things beside it, at the distance the section states.

### What a library file owes of a unit

A showcase is the running catalogue that a stack proves its realization with, and a showcase is proven against the library. A unit's set, its cases and its usage are read from its column, *The library draws*, in the components chapter: the usage is the unit's primary use, named by the units it stands with, and the plugin composes it from instances; the cases are what the column draws once, its modes, its texts and its swaps. Nothing of a unit's section is taken from the showcase, which may show more (`RD.SUPPORT.SURFACE.026`). A property that a unit has, and that nothing on its page draws, leaves nothing to prove a stack against. So the page draws what a person sees of each unit.

- **A top-level unit MUST have a usage of its primary use.** A top-level unit is a unit the book lists, in a group table or in one line under its own heading, and its column names its usage. A part owes no usage, because it serves another unit and the usage of that unit shows it. The usage stands in the band of Usage and takes the name that "A usage" states.
- **A property that changes what is visibly there MUST be drawn.** An icon, a heading, a footer, a clear button and an open menu are such properties. "Which property is a variant and which is a case" places each of them. A version of the set draws a property only where the property is the size, a state, the shared `variant` or a look drawn once, and a case named `<property>=<value>` on the version where the property draws it in every other kind. A property whose default is on is drawn by its off case. A property that draws only on one version is drawn by a case on that version, and not by a case on the default.
- **The test is what a person can see, at rest or in any state the unit can be in, and a state a unit can be in MUST be drawn.** A state is a visible change: open (a select's popup, a menu, a dialog), hover, focus, pressed, selected, checked, filled, invalid with its message, disabled, loading and empty. The library chapter already requires a drawing for every state that changes what a person sees, and makes the state a property of the set, `state=…`, with a shown state drawn as a picture and no prop. This rule includes both and restates neither.
- **A property of behaviour changes nothing a person can see in any state, so it has nothing to draw, and the unit's header MUST name it.** It decides when or how something happens, and not what is there. A late-loading image (`lazy`), a callback, the delay before a tooltip shows, whether a menu closes when an item is chosen, the step of a number, the limit on a value and the `name` of a field are such properties. The header names each one in the clause `behaviour: ` that "The form of a label" states, so a script tells a property of behaviour from a property that nothing draws.
- **A property that lets a unit reach a state is drawn by that state.** `collapsible` lets a panel be shut, and the shut panel is a state, so it is drawn. `sticky` holds a header in place while a page scrolls, and a case draws one scroll place, as "A unit with no look of its own" states for a still picture of behaviour. A property is named in the `behaviour:` clause only when no state it leads to looks different.
- **Example, `DSSelect`.** `open` is drawn, because the popup is there to see. `disabled` is drawn, and so is a start icon. Whether the popup closes when a choice is made is behaviour, and the header names it.
- **A property whose value is a token MUST be shown as a mode, by one case with the mode set on the instance.** A hue, light or dark, a border, a radius and a shadow are such properties. A variable carries each of their values, so a version for each value would draw the same unit again and again. Size and the scale size are the properties of this kind that stay versions, as the rule on size states, and the page level is a mode, as "Which property is a variant and which is a case" states.
- **A unit that the library draws as cases alone, having no look of its own, MUST say why in the label of its sheet.** A person who reads the sheet then learns that the unit has no set because the unit has no look, and not because a set is missing.
- **The duty MUST run one way: a showcase may show more than the library, and a library MUST NOT lack a case its column names.** A library that lacks one is at fault, and the showcase is not.

### Which property is a variant and which is a case

A set holds one version for each pair of values that its writer crossed, so each property that is crossed multiplies the set. `DSInput` crossed eight properties and held 850 versions, and a person who opens it cannot find the version they want. A case costs one component for one property, whether the set is crossed or not. So this part states which properties a set crosses and which are drawn as cases, and it takes the answer from the unit's column, *The library draws*, which the book keeps by the rules below (RD.SUPPORT.SURFACE.038). The showcase names its section of choices a caller makes with a prop Cases, and the library's sheet of cases carries the same word (RD.SUPPORT.SURFACE.039).

- **The library MUST follow the unit's column.** Each property is drawn as the column says: crossed, once, as a mode, as a text or a swap, or not at all, and the table below says what each part of the column is in Figma. A stack is proven against the library, and its showcase may show more.
- **A set MUST cross its size, its states and the shared `variant`, and it MAY cross two more kinds of property, which are stated below. It MUST NOT cross any other property.** A designer who picks a unit picks a size, a state and a look, and every pair of them is a picture that someone will place. So the set crosses the shared `variant` with the size and the states. A property that a designer does not pick together with these only multiplies the versions that hold nothing new.
- **`disabled` MUST stay a property of its own and MUST NOT be a value of `state`.** A caller sets `disabled`, and a person or the system puts the unit in a state.
- **Each prop the column draws once, each mode, each text and each swap MUST be one case on the unit's sheet of cases.** A case is one picture a person can find.
- **Colors MUST be a mode, shown by one case.** The case sets the mode on the instance, and the instance shows every variant.
- **A vocabulary whose every value names one set of tokens MUST be a mode, and the page level is one: the collection Level, whose modes are the six values of `DSPageLevelType`** (`RD.SUPPORT.SURFACE.296`). A designer sets a frame's level once, and every unit inside takes that level's sizes, its items one level down, so a level costs no version. A form that a level changes MUST stay a crossed vocabulary, and a set MUST draw only the pairs the book allows: the type of a feature, the size of a button, the level a feature gives its items and the corner of a mark.
- **A set MAY cross a prop that takes a vocabulary whose values are forms of the block itself.** `type` of `DSTimePicker`, `attached` of `DSToggleGroup` and `sort` of a table's header cell are such props, and the library carries each under the same name and the same values as the web.
- **A set MAY cross a property that a named unit keeps crossed, and the book names that property for the unit, with its reason.** The reason is always that the values combine into forms a person must see together. The property is crossed for its own unit only; on any other unit it is a case. "A property a named unit keeps crossed" lists them.
- **A look that no property can produce MUST be a version drawn once, crossed with nothing, and its case MUST be an instance of that version.** `type` of `DSSkeleton` has six values and each is a look that no other property can draw, so the set holds six versions and a version for each pair with the size would draw the same look again.
- **A pair of values that the web cannot be in MUST be left out, and a pair MUST keep a version only where it draws something that neither value draws alone.** A disabled row of a list is not under the pointer, so `DSList.Item` has no hover version for it. A checked radio that is disabled shows a mark in the disabled look, so `DSRadio` keeps that pair.
- **Usage MUST stay the usage, and Props MUST draw nothing.**
- **An agent MUST place each property in the unit's column by the rules of this part, read from the stack's source, never from the property's name**, and the column then decides the set. A first list that sorted the properties of 93 sets by name alone left 32 names that only a reading of the source could place.

| Part of the column | In Figma | Versions it adds |
| --- | --- | --- |
| crossed | versions of the set | a product |
| once | one version each | one per value |
| colour | a mode of Color | none |
| light and dark | a mode of Mode | none |
| page level | a mode of Level | none |
| text, swap | a text or swap property | none |
| usage | the Usage band, composed from instances | none |

The column places a property, and a short list of questions then decides only how its case is carried. A question is asked of a property that is drawn as a case, in this order, and the first yes decides.

| Question | The case is carried by | Example |
| --- | --- | --- |
| Is its value a token, such as a hue, light or dark, a border, a radius or a shadow? | a mode on the instance | `Color=WARNING` of `DSBadge`, and `Mode=DARK` of `DSCodeBlockView` |
| Does it show or hide one part? | a yes-or-no property | `withClose=true` of `DSBadge` |
| Is it words, a number that is shown, a picture or a nested node? | a text property, or a swap of the node | `title=AL` of `DSAvatar`, and `startIcon=BELL` of `DSBadge` |
| Is it a free number? | the property on the instance, set to one value | `maxHeight=160` of `DSCodeBlockView` |

A property that changes nothing a person can see in any state is drawn by no case, and the unit's header names it in the clause `behaviour: `.

#### A property a named unit keeps crossed

No unit keeps such a property today. A part's `flush` and a frame's `frames` are modes, and the forms a person picks first are crossed by the rule on a vocabulary of forms, so neither is an exception. A property that a unit needs crossed for another reason joins this part first, as a row of a table that names the unit, the property and the reason.

### A unit with no look of its own

- **A unit with no look of its own MUST be shown on a sheet that is composed from library units, and the sheet's label MUST say that the unit is not drawn.** A unit that places or watches another unit draws nothing, so a drawing of it would be a look the web does not have. The sheet shows what a person sees when the unit is used, and the label says what the unit is.

### A unit that cannot hold the web's case

- **When a unit cannot hold a case of the web, the case MUST show what the unit can hold, the sheet's label MUST say what is cut, and the cut MUST be recorded as a difference between the unit and the web, to be closed in the unit.** A sheet that shows less than the web without saying so reads as the whole case. The difference is closed by changing the unit, so that the sheet can later show the whole case. It is never closed by redrawing the case.

### A new set, sheet or page takes the form of its neighbours

- **A new set, sheet or page MUST take the form of its neighbours: the ground of a set, a label, a place clear of every other node, and the background of its page.** The ground of a set is its fill and its stroke, bound to the same variables the neighbouring sets bind. A new unit is made in a section of its own, named as the unit, and the section stands at the end of its group's page, 240 below the last section, in the place the showcase's order gives it. A new page has the editor's own background and not the library's. A new set with no ground shows dark text on a dark page, and a page with another background makes the same unit look different from its neighbours.

## How an agent changes a library file through the connector

The rules under "Before a connector writes" and "How the connector's work is carried out" state what the agent says before it writes, the named version a person saves first, and how the connector's work is carried out. The rules below add to them and repeat none of them.

### Before the change

- **An order MUST be checked against the live file before it runs.** An order that was written from a reading MUST name the time of that reading. Before a change, the agent reads the live file for what the order assumes: that each unit exists, that it is a set or a lone component, and what its properties are. It corrects the order and says what it corrected. A file changes between a reading and a change, and an order written from the older reading names counts that are wrong and units that are not there.
- **An order MUST name the web's file and line for each thing it makes, and where the order and the web differ, the agent takes the web and says so in its report.** The library follows the web, and an order written from memory can name a trigger or a count the web does not have.

### During the change

- **A script that changes a file MUST change only the nodes it names.** It is given the nodes it may touch. Before it moves anything it checks that the change leaves no version outside its set, no two versions meeting and no two top-level nodes meeting, and if the change would, it moves nothing. A change outside the named nodes is a defect and is reported, never kept quiet, because a node moved outside the order is a change nobody approved and nobody will look for.

### What the agent reads and keeps

- **An inventory MUST hold, for each page: its id, name and background.** For each set and each lone component it holds the id, the box, the properties with their values, the count of versions, the default version and the ground. For each sheet it holds the id, the box and the cases. For each label it holds the id, the full text, the box and the unit it names. It holds every other top-level node too, and the time it was read. A label's text is in it because without the text the next agent reads the file again to learn what a label says, and the inventory is read once to avoid that. The rule that an inventory is read once and handed on is stated above; this rule states what it holds for the agent's own work. "The inventory" states what the same inventory holds for the snapshot, so no fact is stated twice.
- **A picture that is taken MUST be looked at, and the report MUST say which pictures were looked at and what each one showed.** A picture that nobody looked at proves nothing, and the cost of taking it is paid for nothing.

### Before a publish

- **Before the agent says that a file may be published, it MUST scan the whole file and report each of these:** versions outside a set; pairs of versions that meet; top-level nodes that meet; a top-level node that is no unit's section; things inside a section that meet; strays, which are nodes that belong to no unit, no sheet and no usage; a property left with the editor's default name; a set whose properties cannot be read; labels outside their unit's section or on a page other than their unit's; a direct child of a section that lies outside its section; a top-level unit with no usage; a property that nothing draws and that the header does not name as behaviour; and each set whose default version is not the one its label names. A person publishes after the agent's word, and a file that is published with one of these shows it to every stack that reads the library.

## Drawing a block

- A block drawn from data is a host and an item. One item serves every host that takes one data shape (`architecture-components.md`).
- Each shared state has one picture, on every block and on every kind of surface (`architecture-names.md`).
- An overlay is drawn as its surface alone, placed over a `DSBackdrop`, and its extent is the size of the instance. It draws no width of its own, and the library draws no `extent` variant.
- A popup or an overlay that a block opens is a private part of that block, shown by the switch `open`. It is never a block a designer places on a page of its own.
- A value that only changes which published block sits in a slot is no variant. The slot holds the block.

Some core units are put together from other blocks, or open something the device draws. The rules above decide how each one is drawn.

| Block | What the library draws |
| --- | --- |
| `DSToolbar` | the row, with its frame on and off. An item of it is an instance of `DSButton` in a slot, so the toolbar has no variant for what an item is |
| `DSTagGroup` | the row of tags, each an instance of `DSBadge` with its close action |
| `DSCalendar` | the month grid, once. It is the grid that `DSDatePicker` opens, so the two use one drawing |
| `DSColorPicker` | the swatch and the field with the code beside it, with a colour, with none, and with a typed text that is no code. The picker that opens belongs to the device, so it is not drawn |
| `DSColorView` | the swatch and the value, the swatch alone, and the empty case |
| `DSProgressCircle` | the ring at each size, filled to a value and turning |
| `DSMark` | its sizes alone: `size` and `scaleSize` as properties. Its `shape` and its `variant` are modes, as its `color` is, so the set holds one version for each size and each scale size, and a designer sets the size, the icon, the shape, the look and the hue each by itself (`RD.SUPPORT.SURFACE.137`). The file is brought to this in a change of its own |
| `DSAvatar` | `size`, `scaleSize` and `badge` as properties. At the sizes, `badge` holds its values, and the published versions stay. At the scale sizes the status mark is a switch: a dot and an icon are each shown by a yes-or-no property, and the size of the mark follows the avatar. The file is brought to this in a change of its own |
| `DSConfirmPopover` | its surface alone, with the question and the two actions, as a popover is drawn. The control that opens it is not part of the drawing |
| `DSConfirmDialog` | its surface alone, over `DSBackdrop`, as every overlay is drawn |

## Boundary

This ref states what the library draws, how its files are layered, and what stays in words because no person sees it. It does not state which blocks or tokens exist — that is `architecture-components.md` and `architecture-core.md`. It does not state how a stack builds what the library draws, or what proves it did — that is `providers.md` and `delivery-showcase.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.141` | the design library draws the look of each named block, and behavior stays in words |
| `RD.SUPPORT.SURFACE.006` | the design library is not a provider |
| `RD.SUPPORT.SURFACE.023` | a design system is compared through one neutral snapshot, and a person or a model reads only the gaps |
| `RD.SUPPORT.SURFACE.024` | the tool reads the units of a library file from Figma and builds its inventory, and the connector reads the variables and the styles and makes every write |
| `RD.SUPPORT.SURFACE.025` | a change of the surface is stated in the construct first, drawn in the library second and built in the web or a native stack third |
| `RD.SUPPORT.SURFACE.082` | this order binds the core units, and not a unit that a stack provides on its own |
| `RD.SUPPORT.SURFACE.099` | the library draws the core units, the icons and the places of the layout only, and nothing of a pattern |
| `RD.SUPPORT.SURFACE.026` | the library draws every case a unit's column names, a block with a behaviour and little or no look as its column says, and a showcase is proven against the library and may show more |
| `RD.SUPPORT.SURFACE.027` | the Figma connector is the one way the agent changes the library, and a developer publishes |
| `RD.SUPPORT.SURFACE.028` | a developer's hands in the library are saving a named version and publishing a file, the builder manages the library and a partner is given it published, and the agent says what it will change before a connector write |
| `RD.SUPPORT.SURFACE.029` | the connector's work in a library file is carried out by an inventory read once, a script for each page, one picture for each set and a probe written once, and a person saves a named version before the connector's first change |
| `RD.SUPPORT.SURFACE.030` | a library file holds a set in a grid its label states, the stack's default at the top left with the label corrected to it, a label a script can read, and a case that is never published as a unit |
| `RD.SUPPORT.SURFACE.137` | the shape and the look of a mark are variable modes in the library, and its set holds its sizes alone |
| `RD.SUPPORT.SURFACE.031` | an agent checks an order against the live file and the web, changes only the nodes it names, and scans the whole file before it says a publish may go |
| `RD.SUPPORT.SURFACE.032` | a library file has a page for each group of the showcase, in its order, and each unit is one section that holds everything the unit owns, with the header, set, usage, cases and parts in a fixed order and at fixed distances |
| `RD.SUPPORT.SURFACE.033` | the Core file's pages and its sections of tokens, a unit drawn only as cases, the forms a header meets in practice, the pages of the Widgets, Containers and Layouts files, and the six sentences that complete `.032`: room for what a thing draws, the layers panel in the page's order, a section's fill, a usage's name, and a row label centred on its band |
| `RD.SUPPORT.SURFACE.036` | a library file draws what the showcase is proven against: a usage of its primary use for every top-level unit, a drawing of every property that changes what is visibly there, a header note for a property of behaviour, a mode with one case for a property whose value is a token, and a scan that reports a property nothing draws |
| `RD.SUPPORT.SURFACE.295` | the plugin builds the library's sets from the CONSTRUCT snapshot alone, and the tool writes the snapshot from the book and writes the plugin out |
| `RD.SUPPORT.SURFACE.392` | spn-surface carries the CONSTRUCT snapshot of each release's book, the one snapshot a repository holds, and what reads it in the plugin reads that copy alone |
| `RD.SUPPORT.SURFACE.296` | the page level is a mode of the collection Level, and a form a level changes stays crossed with the allowed pairs only |
| `RD.SUPPORT.SURFACE.037` | how a library file is organised holds for any library, the builder's and a partner's own, and the division into files is its owner's: the builder's for its design system, a partner's for its own library, which uses the builder's published library and never edits it |
| `RD.SUPPORT.SURFACE.038` | a set's properties are its size, its states and the shared `variant`, a prop of forms of the block, and a property a named unit keeps crossed, and the unit's column says which |
| `RD.SUPPORT.SURFACE.044` | the comparison of the library with a stack asks one question: does the stack support everything the library asks for |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
