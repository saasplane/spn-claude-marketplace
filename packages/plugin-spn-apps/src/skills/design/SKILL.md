<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md",
      "seen": "6f182673"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/03-ideate.md",
      "seen": "cc127ea7"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/",
      "seen": "68393479"
    }
  ]
}
-->
---
name: design
description: Design a page of a SaaS Plane app from the blocks of the design system, or register a new unit in the design system's own Figma library, or change what a library file already holds. Use when the user asks to design, lay out or draw a page, a screen or a flow of pages, in words or in Figma; also use it when the ask is to add a component, a widget, a container or a layout to the Figma library, to draw a unit the code already has but the library does not, or to change a set, a version, a token or a value a library file holds. For a page, it picks the layout, writes down the facts of the data and of the person, chooses the page pattern, decides the containers, chooses the pattern for each task, and then the blocks, and states the page as a tree of named blocks with their props; with the Figma connector it draws that tree from the published libraries. For a library change, step 7, "Draw it in Figma", walks `steps/change-library.md` directly — read that step on its own when the ask is about the library and not about a page. Not for deciding what a feature is - that is the `ideate` skill - and not for writing the code of a screen, which is the `implement` skill.
---

# design — a page, from its layout down to its blocks

**Read `refs/devex/workspace/workstream.md` (spn-devex) before acting.** It holds the loop this skill runs inside: how a prompt is read, where a new ask goes, what a prompt does to a running arc, and how a reply closes.

**Then read `refs/support/surface/standards-core.md`, `architecture-names.md`, `architecture-containers.md`, `architecture-layouts.md` and `architecture-app.md`, in this plugin.** They hold the levels of a page, the rules of content, the names, the container, the layout and the theme. This skill holds the order of the decisions, the patterns, and the form of the result.

**Read `refs/support/surface/standards-patterns.md` before you choose a page pattern.** It holds the fourteen page patterns, the four steps of the choice, and the tree by layer of each pattern. The specs of the patterns are in `refs/support/surface/patterns/`, in this plugin, and a page starts from one. Read `architecture-widgets.md` and `architecture-components.md` where the pattern names a data table, a filter bar, an item line, a badge or a field.

**This one skill serves the builder of SaaS Plane and a partner alike.** Both design from the refs and the specs this plugin carries, and neither needs the book open.

**The surface has two levels** (`RD.SUPPORT.SURFACE.081`). The book states the core: the core units, the rules, and for pages the patterns and their skeletons. A stack's design system builds all of it, and it may provide further units of its own that help build apps. So you read the pattern and its skeleton from the refs, and you pick the units from the stack's design system, the core units and the stack's own, or from a partner's own code.

Take the scope from the argument: one page, or a flow of pages. A flow is several pages, and each page gets a tree of its own.

**Your output is one tree for each page**: every block by the name the book gives it, with its props. State it in the reply. Write it to a file only where the developer or the running arc names one. You write no code here.

The decisions run in one order. Each level of a page owns one thing, and the level above it decides first. A block is the last thing chosen.

| | Decision | What it settles |
| --- | --- | --- |
| 1 | the layout | the navigation, and the main area the page gets |
| 2 | the facts, and the page pattern | what the data and the person are, which arrangement the whole page takes, and what shows each part |
| 3 | the containers | which parts of the page are framed as a header, content and a footer |
| 4 | the pattern for each task | how each thing the person does runs, and what they see in each task state |
| 5 | the blocks | the named block for each part of each pattern, with its props |

## Before the first decision — say what the page is for

- **Name the purpose in one sentence**: the main intent, and the main action. A page has one purpose. If the sentence needs *and*, design two pages.
- **List each task the person does on the page.** Read the tasks from the behavior rows of the owning docs. Where a task has no row, say so: the `ideate` skill writes the row.
- **Name the kind of surface.** It is web today. A rule that names hover or a pointer holds for the web alone.
- **Read what the app holds already**: its theme, and the layout its other pages use.

## 1. Pick the layout

A layout frames the page. It draws the navigation, and it hands the page a main area. It owns nothing inside that area.

| Layout type | The navigation |
| --- | --- |
| `RAIL` | a sidebar of icons at the side, which a person opens and closes |
| `DOCK` | a navigation that stays open, beside one column of content |
| `TOPNAV` | a bar across the top, with the content centered below it |

- **The page chooses its layout, and the theme never does.** Say which type the app's other pages use, and propose it. Where the app has no page yet, show the layout types, and the developer chooses.
- **Fill the named places**: the brand, the navigation, the account, the utility actions, the main area and the footer. Every layout type places each of them.
- **The footer is optional, and it closes the main area.** Where the content is short it stands at the bottom edge of the main area, and where the content is long it stands after the content. An app that gives no footer has none. The layout places it, and decides nothing about what it holds.
- **Mark the place the person is in.** The navigation shows it with the selected state.
- **Leave the navigation to the layout.** A page that draws its own navigation has taken the layout's job.

## 2. Write the facts down, and choose the page pattern

**How a page is shown MUST follow from its data and from the person who uses it** (`RD.SUPPORT.SURFACE.047`). Never arrange a page by how another page looks, or by which block is at hand. So you write the facts down first, and you choose from them.

### Write the facts down

Read what you can from the contract, and ask for the rest. Write every fact in the reply before you choose anything. The developer then corrects a fact and not a layout.

| Fact | Where you read it |
| --- | --- |
| what one record holds: a name, a state, a picture, and how many facts | the contract |
| whether the query takes a page, a text or a filter | the contract |
| whether the set is fixed or grows | the contract: an enum is a fixed set |
| what belongs to a record | the contract: the other commands that take its id |
| how many there usually are, where the server returns the whole set | you ask |
| who comes, how often, and to do what | you ask |
| what the role of that person lets them do on the page | the permission codes of the contract. Where they do not say, you ask |

- **Ask for a fact you cannot read, and never guess it.** A guessed fact looks the same on the page as a read one, so nobody would know to correct it.
- **Never plan a page that depends on a count** (`RD.SUPPORT.SURFACE.050`). A group shows how many items it has only where the server gives that number together with the groups.

### Choose in four steps, with a block last

A page is decided in four steps, in this order (`RD.SUPPORT.SURFACE.052`). The choice never starts from a block.

| Step | What you decide | Decided from |
| --- | --- | --- |
| 1 | the page pattern: the shape of the page | what the page is about, and why a person comes |
| 2 | what shows each part that has many of one thing | what the contract says of the list, and what one of them holds |
| 3 | what changes at a tablet and on a phone | the choice of step 2 |
| 4 | how a thing is entered or changed | how much there is to enter |

**Step 1: name the one page pattern that fits.** A page pattern is chosen from the set below and never invented (`RD.SUPPORT.SURFACE.051`). The names are proposed, and not yet confirmed one by one.

| Page pattern | The data | The person | Its spec in `refs/support/surface/patterns/` |
| --- | --- | --- | --- |
| Find in a list | a set that grows as people work | comes often, to find one | `find-in-a-list.dg.json` · `find-in-a-list-look.dg.json` |
| A record and its setup | one record, and a few things set up for it | comes rarely, to see where things stand | `record-and-its-setup.dg.json` |
| A record and what belongs to it | one record, with lists of other records attached | comes to attach or remove one, or to read what happened | `record-and-what-belongs-to-it.dg.json` |
| Set up by kind | fixed kinds, with one or a few of each | comes rarely, to connect or change one | `set-up-by-kind.dg.json` |
| Compare across kinds | one fixed set of settings, for a fixed set of kinds | comes rarely, to check or change a default | `compare-across-kinds.dg.json` · `compare-across-kinds-edit.dg.json` |
| Groups and their items | things in groups, where a group is a heading | comes to see the whole and open one item | `groups-and-their-items.dg.json`, and its `-two-lists`, `-open` and `-many` forms · `one-action.dg.json` |
| An overview | counts, and what waits for a person | has just arrived | `overview.dg.json` |
| A record and its steps | one record that moves through known steps | moves it on, with the right role | `record-and-its-steps.dg.json` |
| Choose many | many things to tick | ticks several | `choose-many-in-groups.dg.json` · `choose-many-in-one-list.dg.json` |
| An editor with its preview | content a person writes, and what it becomes | must see the result while writing | `editor-with-preview.dg.json` |
| An entry over the page | a small or a medium form | needs the page it belongs to, which stays beneath or beside the entry | `entry-over-the-page.dg.json` |
| Inherit or override | a value that follows a default until someone sets their own | must see which of the two it is, and be able to go back | `inherit-or-override.dg.json` |
| An entry that is a page | a large form, with sections or a part that repeats | fills it in one sitting | `entry-as-a-page.dg.json` |
| Change in place, in a list | many small values of one kind | changes one after another | `change-in-place.dg.json` |

- **The first eight are a whole page.** The last six are how a person enters or changes something, and each opens from one of the eight.
- **Where the data and the person point to two patterns, say so and ask.** A list that grows, used by a person who comes once a year, is a different page from the same list used every day.
- **A page that fits no pattern is named in the result, and it waits.** A new page pattern joins the patterns chapter of the book first.

**Step 2: choose what shows each part.** The contract decides first. Where the query takes a page, a text or a filter, the part is the data table, `DSDataTableWidget`, also where the set is small today (`RD.SUPPORT.SURFACE.054`).

| What the contract says of the list | What one of them holds | Shown as |
| --- | --- | --- |
| the query takes a page, a text or a filter | several facts a person compares across rows | `DSDataTableWidget`, in its `TABLE` layout |
| the same | a title and a line under it | `DSDataTableWidget`, in its `LIST` layout |
| the same | a thing of its own: a kind to set up, an app, a file with a preview | `DSDataTableWidget`, in its `GRID` layout |
| the whole set, a few and fixed | a name | a list, `DSList` |
| the whole set, a few | a picture, a title, a line under it, and an action | a list of item lines, `DSList` holding one `DSItem` for each |
| the whole set, some | two to four facts a person compares | a plain table, `DSTable` |
| one record | several facts | readings, each a title with its value under it, `DSDataUnit` |

- **A few is up to about 7, and some is up to about 30.** Both numbers are proposed.
- **A page pattern fixes the arrangement, and never which block fills a part** (`RD.SUPPORT.SURFACE.049`). Choose each part by its own data. Two parts of one page often hold data of different shapes.
- **A search and a filter of a data table go to the server** (`RD.SUPPORT.SURFACE.070`). Never plan a search that runs in the page over the records already loaded.

**Step 3: say what changes at a tablet and on a phone.** It follows from step 2, because each block has its own way to fit a smaller screen.

| At a desktop | At a tablet | On a phone |
| --- | --- | --- |
| `DSDataTableWidget`, layout `TABLE` | the same, with fewer columns | the same data table, layout `LIST`, with the filters behind one action |
| `DSDataTableWidget`, layout `GRID` | the same, with fewer across | layout `LIST` |
| a table, `DSTable` | the same | a list, one group at a time |
| two parts side by side: the groups, and the items of the chosen one | the items take the place of the groups, with a back action; the address changes | the same as a tablet |
| a dialog | the same | a sheet from the bottom of the screen |
| a sheet at the side | the same | the full screen |

**Step 4: decide how a thing is entered or changed.** How much there is to enter decides where the entry opens (`RD.SUPPORT.SURFACE.075`). The two numbers are proposed.

| The entry | At a desktop | On a phone | Page pattern |
| --- | --- | --- | --- |
| small: up to about 5 fields in one group | a dialog over the page | a sheet from the bottom of the screen | An entry over the page |
| medium: one column with a few groups, up to about 12 fields | a sheet at the side, with the page still in view | the full screen | An entry over the page |
| large: sections, steps, or records of its own inside it | a page | a page | An entry that is a page |
| one value among many of one kind | in its row | in its line | Change in place, in a list |
| a thing that is only on or off | in place, as a switch | the same | the pattern of the page it stands on |

### Start from the spec of the pattern

- **Open the spec of the pattern you named, in `refs/support/surface/patterns/`.** It is a skeleton with a view for each screen class. Draw it with `spn-devex docs figure draw <spec>` where you want to see it.
- **Read the tree by layer of that pattern in `standards-patterns.md`.** It names the containers, the widgets and the components the pattern is drawn with, and what changes on a tablet and a phone.
- **The values in a spec are samples.** They show what kind of data a part holds. Put the page's own data in their place, and keep the arrangement.
- **Never edit a spec in the plugin.** Work from a copy. Every page of one pattern then starts from the same arrangement.

## 3. Decide the containers

A container is optional. Use one where a part of the page has a header, content and a footer as one unit. A page with no such part uses none.

**Take the containers from the tree of the page pattern.** Its Container line says how many containers the page has, and what each part of one holds.

| A page | Header | Content | Footer |
| --- | --- | --- | --- |
| A listing | the page title, a line under it where one is needed, and actions at the end | a filter bar where the listing has one, and a data table in a `flush` part | the paging of the records |
| A form | the title of the form | its sections, one under another, each under its own title | the actions that save the form or leave it |
| A dashboard | flat | raised, holding widgets that show numbers | none |

- **Put the title and the actions of a container in its header, and what closes its work in its footer** (`RD.SUPPORT.SURFACE.074`). The action of one part of the content stands at the end of that part's title, and never in the header.
- **The actions that close the work of an entry stand in one place and in one order** (`RD.SUPPORT.SURFACE.095`). Over the page, in a dialog, a sheet, a drawer or a popover, they stand at the end of the footer: the action that leaves the work first, and the main action last. In an entry that is a page of its own they stand at the start of the footer, the main action first. A value changed in place keeps its two actions beside the box, the one that saves first. The main action is a solid button, and the action that leaves is an outline button.
- **Frame a part only when it has a title of its own, and also an action of its own or data it loads by itself** (`RD.SUPPORT.SURFACE.057`, proposed). The record a page is about is the header of the page, and it takes no frame.
- **An entry over the page is one container, placed inside the dialog or the sheet** (`RD.SUPPORT.SURFACE.077`). Its title and the action that closes it stand in its header, its fields are its content, and its actions stand in its footer.
- **A large form is one container.** Its sections are the parts of its content, each under its own title. A section is never a container of its own, and no list of the sections stands beside the form (`RD.SUPPORT.SURFACE.078`).
- **Groups and their items are two containers at a desktop.** On a tablet and on a phone the items take the place of the groups, with a back action, and the swap changes the address (`RD.SUPPORT.SURFACE.079`). A set of groups that can be added to is a list, and never a row of tabs (`RD.SUPPORT.SURFACE.080`).
- **Give one container to each thing a person reads or saves as a whole** (`RD.SUPPORT.SURFACE.116`). The sections of that thing are the parts of its content, each under its own title, and never containers of their own. Two things that are read or saved apart are two containers, or cards. An editor with its preview and *Choose many* are each one container (`RD.SUPPORT.SURFACE.115`).
- **Give the page that reads a record and the page that changes it the same parts in the same order** (`RD.SUPPORT.SURFACE.117`). On the page that changes it, a reading becomes a field, a block of source becomes an editor, and the footer with the actions is added.
- **Write no prop and no padding to place a title** (`RD.SUPPORT.SURFACE.109`). An item line at the level `PAGE`, `SECTION` or `GROUP` starts where what stands under it starts, and in a `flush` part it takes the inset of its place. `bleed` on a title changes nothing. A card hands its size to what it holds, as a container does (`RD.SUPPORT.SURFACE.114`). A container frames a part of a page. A card, `DSCard`, frames one thing: a record, an app, a file, a number.
- **A card may hold `DSCard.Header`, `DSCard.Content` and `DSCard.Footer`, and it still frames one thing** (`RD.SUPPORT.SURFACE.091`). Its parts all sit inside its one frame, in every theme. A part pads itself, and `flush` on a part drops that padding, for a part whose content reaches the edge of the card. `divided` draws a line between each two parts. A part of a page that has a title, actions and data of its own stays a container.
- **Write the parts in one order**: `DSContainer.Header`, then `DSContainer.Content`, then `DSContainer.Footer`. A container holds one or more content parts, and at most one header and one footer.
- **The page decides what fills a part.** Write `flush` on a part whose content reaches the edge of the frame, such as a table. A part without `flush` insets everything it holds.
- **In a `flush` part, a block that draws a border of its own draws none.** Those blocks are a table, a list, a code block, an accordion and an empty state. Every other block reaches the edge.
- **Never put a container inside a container.** A card, an accordion or a set of tabs goes inside the content.
- **Leave the look to the theme.** The look is `frames`, `raised`, `bordered` and `rounded`, and one more prop, `unframed`, that holds a part out of the frame. Set one on a container only where that container differs from the app.
- **Write `unframed` for a part that no theme should frame on this page** (`RD.SUPPORT.SURFACE.092`). It is a list: any of `HEADER`, `CONTENT`, `FOOTER`. A part listed there sits flat on the page, whatever `frames` and the theme give, and the rest of the look stays the theme's. One such part is a header that is the header of the page. The book states `unframed` before the web builds it, so say so where the tree writes it.
- **Write no color, no padding and no margin on a container.** The gap between two blocks comes from the scale.
- **The book defines no block for a row or a grid of blocks in a part** (`RD.SUPPORT.SURFACE.084`). The page writes it, with its gap from the scale, or uses a unit for it where its stack provides one.
- **A page may use no container at all.** It may put a widget or a component straight into the main area, or fill the area with one block.

## 4. Choose the pattern for each task

The page pattern says where the parts of the page sit. A task pattern says how each task inside those parts runs. Name each task in one verb. Most tasks are one of the intents below under another name: *search* is Find, *edit* is Enter and *delete* is Act.

| Intent | The person | Blocks that carry it | Task states |
| --- | --- | --- | --- |
| Move | goes to another place, and knows where they are | the layout · `DSNavigationMenu` · `DSTabs` · `DSBreadcrumb` · `DSLink` | working, then done or failed |
| Find | searches, filters, sorts and pages through records | `DSFilterBarWidget` · `DSDataTableWidget` · `DSCommandPalette` · `DSPagination` | all six |
| Read | reads records as a table, a list or a grid, or one record in detail | `DSTable` · `DSList` · `DSDataFieldView` · `DSEmpty` · `DSSkeleton` | all six |
| Enter | fills fields, sees the check on each one, and sends the form | `DSForm` and the entry fields | idle, working, then done or failed |
| Choose | picks one or many from a set | `DSSelect` · `DSRadioGroup` · `DSCheckboxGroup` · `DSToggleGroup` and the pickers | idle, then done. All six when the set is loaded |
| Act | runs one main action, an action on many records, or one that destroys something | `DSButton` · `DSDropdownMenu` · `DSConfirmPopover` · `DSConfirmDialog` | working, then done or failed |
| Interrupt | meets a task that takes over the page for a moment | `DSDialog` · `DSDrawer` · `DSSheet` | those of the task inside it |
| Disclose | sees more in place, without leaving | `DSAccordion` · `DSCollapsible` · `DSPopover` · `DSTooltip` · `DSHoverCard` | idle, then done. All six when it is loaded |
| Hear back | learns that the surface works, is done, or failed | `DSSpinner` · `DSProgress` · `DSToast` · `DSAlert` | working, done and failed |
| Be refused | meets a block they have no permission for | `DSAuthz`, and the gate props `permissions`, `enablements` and `authzDenied` | denied |

The six task states are idle, working, done, failed, empty and denied.

- **One intent is the main one**, and it carries the main action of the page.
- **Decide what the person sees in each task state**, for every task. A block drawn from data shows all six, each with a picture of its own. An action shows working, and then done or failed.
- **Decide the way back from each failure.** A failed state says what went wrong. A failed send keeps what the person entered. An empty result keeps its filters shown.
- **An action that needs a confirmation asks first**, and what the act does decides in which block. An act a person can undo, such as activate, deactivate or remove from a list, asks in a popover, `DSConfirmPopover`, which opens from the control that was pressed. An act that cannot be undone, such as delete, asks in a dialog, `DSConfirmDialog`, over the page. Never plan a dialog for a small act that can be undone. Both blocks stay open while the act runs, and show a failure where the person confirmed.
- **An overlay's closing actions stand at the end of its footer, the cancel first and the main action last.** `DSDialog`, `DSDrawer` and `DSSheet` may hold the parts `Header`, `Content` and `Footer`, and only the content scrolls between the other two. `DSConfirmDialog` and `DSConfirmPopover` place their two actions the same way.
- **Every overlay that covers a page dims it with one scrim.** A sheet that is not modal covers no page (`RD.SUPPORT.SURFACE.093`): the tree writes `modal=false` on `DSSheet`, the sheet stands beside the page and draws no scrim, and the page stays usable. Plan it where a person works in the sheet and in the page by turns. On a phone a sheet stays modal. A popover draws no scrim either.
- **A toast and an alert take their icon from their hue, and the two draw one picture.** The toast is an alert that appears for a while and leaves, so no caller passes its icon.
- **Put nothing a person needs behind hover alone.** `DSTooltip` and `DSHoverCard` hold an addition, and never the one way to a thing.
- **Never invent a pattern for an intent the table holds.** A task that fits no intent is named in the result, and the page waits. A new intent joins the patterns chapter of the book first.
- **A row of a list ends with its actions** (`RD.SUPPORT.SURFACE.071`). One action stands on the row itself, two or more go behind one action, and a press on a row opens the record. These three are proposed.

## 5. Then the blocks

Take each block from the tree by layer of the page pattern, and from the list its task pattern names. Write it by its name in the book, with each prop that differs from its default.

- **Go down the layers of the pattern's tree: the widgets, then the components.** Use the unit that step 2 chose for each part that holds many of one thing. Use the units the tree names for the rest.
- **Hold each small thing to its rule of content** (`standards-core.md`). A state is a badge on the line of facts, before the other facts, and the normal state shows none. The end of a line holds its actions and nothing else, except that the arrow of a line that leads somewhere may stand after them (`RD.SUPPORT.SURFACE.087`). A field a person enters is a `DSForm.Field`, and a field a person reads is a `DSDataUnit`, each with its title above. Readings stand in a grid. The choices of one set stand in columns.
- **A line of a list is an item line, `DSItem`**: a picture, a title, a line under it, and actions at its end. The header of a record has the same shape (`RD.SUPPORT.SURFACE.064`).
- **Under the picture an item line holds its title, its description, then its line of facts.** The facts go to `facts`, and they stand under the description, so a line that has both shows both (`RD.SUPPORT.SURFACE.086`). Write each fact as data, in one of four forms: plain words; `TEXT`, with a `label` and icons where it needs them; `BADGE`, with a `color`; or `CUSTOM`, a block of the page's own (`RD.SUPPORT.SURFACE.096`). A fact whose value cannot be read alone, such as a count, a date or a person, carries its label before it, as *Members: 12*. A state is a `BADGE` fact.
- **Write the `pageLevel` of an item line, and no type step, heading element or scale size for it** (`RD.SUPPORT.SURFACE.094`). `PAGE` is the head of the whole page. `SECTION` is the title line of a part of a page, which is a container or a card. `GROUP` is the title line of a titled group inside the content of a part. `CONTENT` is a line among others, and the default. The level and the `size` together decide the type step and the element of the title, and the scale size of the picture. A larger head is the same item at a larger size.
- **Give every level of a page its title** (`RD.SUPPORT.SURFACE.112`). A page has one heading that names it, as an item line at the level `PAGE` (`RD.SUPPORT.SURFACE.106`). A listing that is the page gives the header of its container the level `PAGE`, and a listing that is a part of a page gives it `SECTION` (`RD.SUPPORT.SURFACE.107`). A container or a card that holds parts, or more than one content part, has an item line at the level `SECTION` in its header. A group inside the content of a part has an item line at the level `GROUP`, with the action of the group at its end.
- **The description of an item line is drawn whole, and the page decides what it says** (`RD.SUPPORT.SURFACE.111`). Write a short summary. Give the heads of a row of cards descriptions of one length where they should stand at one height.
- **Write the `pageLevel` of a row of tabs, and no look for it** (`RD.SUPPORT.SURFACE.113`). The tabs that lead to the sub-pages of a whole page say `PAGE`, and the tabs of a part of a page say `SECTION`: both draw the line under the open tab. Tabs that say no level draw the filled row, for two ways to show one thing.
- **Write `showArrow` on a line that leads somewhere, where the page wants the arrow.** It is a chevron after the actions, and it is off by default.
- **In a list the row carries the link, the chosen fill and the reaction to the pointer, and the item line inside it carries none** (`RD.SUPPORT.SURFACE.097`). `DSItem` takes no `selected`: write `selected`, `anchor` and `showArrow` on the row, `DSList.Item`. An item line that stands alone, in a card or a header, carries its own `anchor` and `showArrow`. Write `hoverable` on a `DSList` whose rows a person acts on; it is off by default.
- **A line of the `LIST` layout of `DSDataTableWidget` is an item line too.** The page gives the title, the description and the facts of a record. The table's rows carry no padding of their own, and they answer the pointer as the rows of its table do.
- **A mark is round unless the page chooses another shape** (`RD.SUPPORT.SURFACE.085`). `DSIconMark` draws an icon as a mark, with `shape` as `CIRCLE`, `ROUNDED` or `SQUARE`. Choose rounded or square where the thing is better shown so, such as an app or a file. A mark is never pressed.
- **`scaleSize` says how large a picture is drawn, and `size` stays the density step** (`RD.SUPPORT.SURFACE.100`). `DSIcon`, `DSIconMark`, `DSAvatar` and `DSAvatarGroup` take it, from `XXS` to `XXL5`. Inside an item line the item gives the picture its scale size, so write none there. In a component of your own, a picture beside a title takes the scale size of the title's own step name (`RD.SUPPORT.SURFACE.104`); `architecture-components.md` states what stands beside a heading.
- **Give `DSDataTableWidget` the layout that step 2 chose, and the `LIST` layout for a phone** (`RD.SUPPORT.SURFACE.068`). Give `DSFilterBarWidget` its fields, and say which stay in view. Never rearrange the bar (`RD.SUPPORT.SURFACE.073`).
- **Where a ref says a unit does not do a thing yet, name it under *Missing*.** `architecture-widgets.md` says so plainly, under *Not there yet*. Write the tree as the pattern asks, and say which line waits for the unit.

- **`variant`, `color` and `size` each mean one thing on every block.** `variant` is the surface treatment, `color` is the hue and `size` is the density step, read smallest to largest, `XS` to `XL`, with `SM` the default a theme sets. Every value comes from the vocabulary of its prop. `CUSTOM` is a value of `color` that means the caller owns the colour: a page sets a colour outside the theme only through it, as `customColor` on a block that takes it.
- **Leave `size` unset**, unless one block must differ. A block takes the size that the container, the widget or the `DSScope` above it passes on, and then the app's.
- **A prop that takes a vocabulary is written with a value of that vocabulary.** `architecture-names.md` states the values, as `TWELVE_HOUR` or `TWENTY_FOUR_HOUR` for the `type` of `DSTimePicker`. Never invent a name or a switch for such a prop.
- **Write only props the book names.** Hover, focus and pressed are shown states. The platform produces them, and the tree never sets them.
- **A block drawn from data is a host and its items.** Write the host, and then one item for each entry you want shown. One item serves every host that takes one data shape — the three menus take one shape and share `DSMenuNode`. A host whose data differs declares its own item.
- **What a block does stays in words**: where an action leads, and which permission gates it. Write it beside the block.
- **A unit the stack's design system provides on its own is written by the name its stack gives it.** The book does not name it, and its stack's docs state its props. Say in the result that it is the stack's own, because another stack may not have it and the library holds no drawing of it.
- **A block the design system lacks is never built inside the page.** Name it under *Missing*, with the task that needs it. It is proposed to the design system: one that every stack should build joins the core units, in the book first, and one that helps a single stack may be that stack's own unit.

## 6. State the page as a tree

Write one tree for each page. It reads from the top level down: the page, the layout, each container, then each widget or component.

**Write the facts above the tree, and then the page pattern with its spec.** A reader of the result names its facts, its pattern and its tree by layer, in that order.

| A line of the tree | Is written as |
| --- | --- |
| The page | its route, its purpose in one sentence, its main action, and its page pattern |
| The layout | `DSLayout`, then its type |
| A block | its name in the book, then each prop as `name=VALUE` |
| A part of a block | the name of the part: `DSContainer.Header`, or a named place of the layout. A part of a container carries `flush` after its name, where the page writes it |
| Content | the text a person reads, in quotes |
| A placement of the page's own | `row`, `column` or `grid`, in lower case. It is no block, and it carries no look. Where the stack provides a unit for it, the tree may name that unit |
| A task | at the right of the block that carries it: the intent, and what the block does |

```text
facts    one order holds a number, a customer, a state, a total and a date     the contract
         the query takes a page, a text and a filter                          the contract
         the set grows as people work                                         the contract
         the sales team comes many times a day, to find one order             asked
pattern  Find in a list · spec: find-in-a-list.dg.json
shows    the orders: DSDataTableWidget, layout TABLE; on a phone, layout LIST

page  /orders · purpose: find an order · main action: New order · pattern: Find in a list
└── DSLayout  RAIL
    ├── brand             DSText "Acme"
    ├── navigation        items: "Orders" selected · "Customers" · "Reports"      Move
    ├── account           DSAvatar
    ├── utility actions   DSButton variant=GHOST "Help"
    └── main area
        └── DSContainer
            ├── DSContainer.Header
            │   ├── DSText    typography=TITLE_LG "Orders"
            │   └── DSButton  variant=SOLID color=PRIMARY "New order"             Move · leads to /orders/new
            ├── DSContainer.Content
            │   └── DSFilterBarWidget                                                  Find
            └── DSContainer.Content  flush
                └── DSDataTableWidget                                                  Find · Read
```

Under the tree, give one line for each task: what the person sees in each task state, and the way back from a failure. Then name what is missing.

For a flow, write the trees in the order a person meets the pages. Each Move names the page it leads to.

```text
Find · Read   DSDataTableWidget   idle: the filters, with no search asked yet
                             working: the skeleton of the table
                             done: the orders, one row each
                             empty: nothing matches, and the filters stay shown
                             failed: what went wrong, and the search offered again
                             denied: the page says that the person has no permission
Move          New order      working: shown on the button · failed: the place says that it cannot be shown
Missing       nothing. The page reads the device and lists LIST on a phone, and gives the table a place in the container's footer for its paging
```

## 7. Draw it in Figma — only where the window holds the connector

A tree is complete with no drawing. Draw it where the window holds the Figma connector and the developer asks for the drawing. Read `skills/design/steps/draw.md` then, and follow it. It draws the tree from the published libraries, by instances, with the look as theme modes. It then reads the page back by name. Where the window holds no connector, say so, and hand over the tree.

The page is a use case, composed from the published library in a file that is not a library file. It is never put into a library file. Where the drawing needs a block or a value the library lacks, that is a change of the library, and the connector makes it (`refs/support/surface/delivery-library.md`, under "A developer's hands are two, and you change the library through the connector"; before a connector write, read its heading "The connector's facts"). Read `skills/design/steps/change-library.md` and follow its walk, name the developer's next step, and show the result. A child agent that sends `use_figma` cannot read the connector's own skill, so give a writer of one page `skills/design/steps/writer-brief.md` with its order, and any other child `skills/design/steps/connector-rules.md`. Never ask a developer to draw, rebind or confirm anything in Figma: a developer's hands are two, saving a named version before the connector's first change in a library file, which the connector cannot save, and publishing a file. Nothing else is asked.

**Of units, the library draws the core units only** (`RD.SUPPORT.SURFACE.082`). The book does not name a unit that a stack provides on its own, so the library holds no published component for one, and the order of a change does not bind it. Surface has two core widgets, `DSDataTableWidget` and `DSFilterBarWidget`. The unit that places a list beside the detail of its chosen row is the web stack's own, `DSListDetailWidget`, so the library holds none for it (`RD.SUPPORT.SURFACE.099`).

**The library draws nothing of a pattern** (`RD.SUPPORT.SURFACE.099`). It holds the core units with their properties and their cases, the icons, and the places of the layout. It holds no task pattern, no page pattern, no skeleton and no sample page: a page or a pattern is composed from the published units on request. A stack's own unit that every stack should build joins the book first, and the library draws it then.

## Close

- **Convene the `ux` lens over the tree**, and over the drawing where one exists. Run it through the `spn-panel` subagent, with the spn-devex plugin's `refs/devex/agent/lenses/ux.md`. The context that designed the page does not review it.
- **Report** the purpose, the facts, the page pattern with its spec, the tree of each page, the tasks with their task states, and what is missing. Say which rule a choice rests on where that rule is proposed. For a drawing, add the read-back and each difference from the tree. Then give the findings of the lens.
- **Hand off by name.** The `implement` skill builds the page, in its `ui` step.

## Lenses

Wear the spn-devex plugin's `refs/devex/agent/lenses/ux.md` while you design. The close's review is the same lens convened.

**This file and its step are the standard for anyone reading them.** Their provenance is the foundation book's Surface chapters: standards, interaction, patterns, names, layout and container, and the design library. Those chapters carry the reasoning behind each rule, for a reader who holds the book. Nothing here is deferred to them.
