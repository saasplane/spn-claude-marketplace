<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/03-standards-patterns.md",
      "seen": "ad49771b"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/03-standards-patterns/",
      "seen": "78593fca"
    }
  ]
}
-->

# Patterns — One Way to Run Each Task

Source of truth: the foundation's Patterns construct (`docs/02-constructs/02-support/03-surface/03-standards-patterns.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/03-standards-patterns/`). Those chapters hold the task patterns, the page patterns, and the folder of specs that this plugin carries a copy of.

Patterns is the third of thirteen Surface constructs. It fills in the six parts of a pattern (the previous standard of this folder) once for each task intent a person has in an app today. It also names the page patterns: a small set of arrangements for a whole page.

Read this to build a page from patterns a person already knows, or to review a page by naming the pattern it should have used. A page never invents a pattern of its own for an intent this ref already holds. Most "new" tasks are one of the intents below under another name: *search* is Find, *edit* is Enter, *delete* is Act. The same holds for a whole page. Most pages are one of the page patterns below, and the data and the person say which one.

## Terms

`Task intent` and `Pattern` belong to `standards-interaction.md`; this ref uses them as that ref states them. It adds three terms of its own.

| Term | What it means |
| --- | --- |
| Intent | the one verb a pattern's section is named for, such as Move or Act |
| Task pattern | the pattern for one task intent: one way to run that task, stated in the six parts of `standards-interaction.md` |
| Page pattern | the arrangement of a whole page, chosen by the data the page holds and by the person who reads it |

**The surface names two kinds of pattern: a task pattern and a page pattern** (`RD.SUPPORT.SURFACE.046`). A page follows one page pattern. Each task on that page follows its task pattern. The page pattern says where the parts of a page sit, and the task pattern says how each task inside those parts runs. A listing page follows the page pattern Find in a list, and the search inside it runs by the task pattern Find.

## The patterns, by intent — 🔮

| Task intent | The pattern covers | Blocks that carry it |
| --- | --- | --- |
| Move | going to another place, and knowing where you are | the layout · `DSNavList` · `DSNavMenu` · `DSNavBarSide` · `DSNavBarTop` · `DSTabs` · `DSBreadcrumb` · `DSLink` |
| Find | search, filter, sort, and paging through records | `DSFilterBarWidget` · `DSDataTableWidget` · `DSCommandPalette` · `DSPagination` |
| Read | records as a table, a list or a grid, one record in detail, subjects compared across the same settings, and nothing to show | `DSTable` · `DSList` · `DSDataFieldView` · `DSComparisonWidget` · `DSEmpty` · `DSSkeleton` |
| Enter | filling a field, the check on it, and sending a form | `DSForm` and the entry fields |
| Choose | picking one or many from a set | `DSSelect` · `DSRadioGroup` · `DSCheckboxGroup` · `DSToggleGroup` and the pickers |
| Act | one main action, an action on many records, and an action that destroys something | `DSButton` · `DSDropdownMenu` · `DSConfirmPopover` · `DSConfirmDialog` |
| Interrupt | a task that takes over the page for a moment | `DSDialog` · `DSDrawer` · `DSSheet` |
| Disclose | showing more in place, without leaving | `DSAccordion` · `DSCollapsible` · `DSPopover` · `DSTooltip` · `DSHoverCard` |
| Hear back | what the surface says while it works, when it is done, and when it fails | `DSSpinner` · `DSProgress` · `DSToast` · `DSAlert` |
| Be refused | a block hidden or disabled because the person has no permission | `DSAuthz` and the gate props |

A page usually serves several intents, and one is still the main one (`standards-core.md`'s one purpose). Each intent's section states its own six parts in full in the capability chapter; a few load-bearing details: an empty result is not a failed search — the two pictures stay apart. A field that is not accepted is a control state (error) on the field, where a send that does not work is a task state (failed) on the form. Every overlay that covers a page dims it with one scrim, so a dialog, a confirm dialog, a drawer and a sheet all read the same way: the page behind waits. **A sheet that is not modal covers no page, so it MUST draw no scrim** (`RD.SUPPORT.SURFACE.093`). It stands beside the page, and the page stays usable. It is no interruption, because the page does not wait. A page uses it where a person works in the sheet and in the page by turns, such as a panel of settings whose result shows on the page. A popover covers no page either, so `DSConfirmPopover` draws no scrim. An alert and a toast draw one picture; the toast is the alert that appears for a while and leaves. A refusal on the surface is presentation only — hiding or disabling protects nothing, and the refusal itself is the server's.

An action that needs a confirmation first asks the person for it. A confirmation has two blocks, and what the act does decides which one a page uses.

| The act | Its confirmation | Why |
| --- | --- | --- |
| A person can undo it, such as activate, deactivate or remove from a list | a popover, `DSConfirmPopover`, which opens from the control that was pressed | the page stays in view and the person keeps their place. A wrong answer costs little, because the act can be undone |
| It cannot be undone, such as delete | a dialog, `DSConfirmDialog`, over the page | the dialog covers the page, so the person stops and reads the question before something is lost |

- **A confirmation MUST be a popover for an act a person can undo, and a dialog for an act that cannot be undone.** A dialog for every small act teaches a person to confirm without reading. Then the dialog no longer stops them on the one act that matters.
- **Both blocks stay open while the act runs.** A failure is then shown where the person confirmed, and the act is never sent twice.

## Adding an intent — 🔮

The list grows when a task appears that no section covers, after checking the task is genuinely new.

- A new intent joins this construct as a section, with every one of Interaction's six parts stated.
- A new pattern names blocks of the design system. A pattern that needs a block the design system lacks waits for that block.

A page never invents a pattern of its own for an intent the list already holds.

## The data and the person decide — 🔮

**How a thing is shown MUST follow from the data and from the person who uses it** (`RD.SUPPORT.SURFACE.047`). A page is never arranged by how another page looks, or by which block is at hand. Two pages that look alike may hold data that grows in different ways. They may also serve people who come for different reasons. The same arrangement would then be right for one page and wrong for the other.

So the facts are written down before anything is chosen. A reviewer then corrects a fact and not a layout, and the layout follows from the corrected fact.

| The fact | Where it is read |
| --- | --- |
| What one record holds: a name, a state, a picture, and how many facts | the contract |
| Whether the query takes a page, a text or a filter | the contract |
| Whether the set is fixed or grows | the contract: an enum is a fixed set |
| What belongs to a record | the contract: the other commands that take its id |
| How many there usually are, where the server returns the whole set | it is asked, because no contract states it |
| Who comes, how often, and to do what | it is asked, because no contract states it |

- **A fact that cannot be read is asked for and never guessed.** A guessed fact looks the same on the page as a read one, so nobody would know to correct it.
- **A page pattern MUST NOT depend on a count** (`RD.SUPPORT.SURFACE.050`). A server does not always return how many items a group holds. A group shows a count only where the server gives it together with the groups. No page asks once for each group to fill a number in.

## The page patterns — 🔮

A page pattern says: for this kind of data and this kind of person, show the page this way. Fourteen are named. A page whose data and person match a row takes that pattern.

| Page pattern | The data | The person | Kind |
| --- | --- | --- | --- |
| Find in a list | a set that grows as people work | comes often, to find one | a whole page |
| A record and its setup | one record, and a few things set up for it | comes rarely, to see where things stand | a whole page |
| A record and what belongs to it | one record, with lists of other records attached | comes to attach or remove one, or to read what happened | a whole page |
| Set up by kind | fixed kinds, with one or a few of each | comes rarely, to connect or change one | a whole page |
| Compare across kinds | one fixed set of settings, for a fixed set of kinds | comes rarely, to check or change a default | a whole page |
| Groups and their items | things in groups, where a group is a heading | comes to see the whole and open one item | a whole page |
| An overview | counts, and what waits for a person | has just arrived | a whole page |
| A record and its steps | one record that moves through known steps | moves it on, with the right role | a whole page |
| Choose many | many things to tick | ticks several | entering or changing |
| An editor with its preview | content a person writes, and what it becomes | must see the result while writing | entering or changing |
| An entry over the page | a small or a medium form | needs the page it belongs to, which stays beneath or beside the entry | entering or changing |
| Inherit or override | a value that follows a default until someone sets their own | must see which of the two it is, and be able to go back | entering or changing |
| An entry that is a page | a large form, with sections or a part that repeats | fills it in one sitting | entering or changing |
| Change in place, in a list | many small values of one kind | changes one after another | entering or changing |

Eight are the arrangement of a page a person arrives at. The other six are how a person enters or changes something, and each of those opens from one of the eight.

- **The page patterns are one closed set, and a page pattern is chosen and never invented** (`RD.SUPPORT.SURFACE.051`). The name of each pattern is proposed: the developer of SaaS Plane has not confirmed the names one by one.
- **A page pattern MUST be built from units that exist, and it is never a block of its own** (`RD.SUPPORT.SURFACE.048`). No stack builds anything for a page pattern. A page follows one with the blocks the design system already has.
- **A page pattern fixes the arrangement of a page, and never which block fills a part** (`RD.SUPPORT.SURFACE.049`). Each part MUST be shown by what its own data asks for: a list, a table, a data table, or a view of one thing. Two parts of one page often hold data of different shapes.

## The choice, in four steps — 🔮

**A page is decided in four steps, in one order, and a block is the last thing chosen** (`RD.SUPPORT.SURFACE.052`). A choice that starts from a block fits the page to the block. The data and the person are then read too late to change anything.

| Step | What is decided | Decided from |
| --- | --- | --- |
| 1 | the page pattern: the shape of the page | what the page is about, and why a person comes |
| 2 | what shows each part that has many of one thing | what the contract says of the list, and what one of them holds |
| 3 | what changes at a tablet and on a phone | the choice of step 2 |
| 4 | how a thing is entered or changed | how much there is to enter |

### Step 1: the pattern

Read the facts against the table of the page patterns, and name the one pattern that fits. Where the data and the person point to two different patterns, say so and ask. A list that grows, used by a person who comes once a year, is a different page from the same list used every day.

### Step 2: what shows a part

**The contract decides first.** Where the query takes a page, a text or a filter, the part is the data table, `DSDataTableWidget`. The server then holds more records than the page has loaded.

| What the contract says of the list | What one of them holds | Shown as |
| --- | --- | --- |
| the query takes a page, a text or a filter | several facts a person compares across rows | `DSDataTableWidget`, in its `TABLE` layout |
| the same | a title and a line under it | `DSDataTableWidget`, in its `LIST` layout |
| the same | a thing of its own: a kind to set up, an app, a file with a preview | `DSDataTableWidget`, in its `GRID` layout |
| the whole set, a few and fixed | a name | a list, `DSList` |
| the whole set, a few and fixed, and its order is the meaning | a name, or a few facts | a list, `DSList`, or a plain table, `DSTable`, with `reorder` |
| the whole set, a few | a picture, a title, a line under it, and an action | a list of item lines, `DSList` holding one `DSItem` for each |
| the whole set, some | two to four facts a person compares | a plain table, `DSTable` |
| one record | several facts | readings, each a title with its value under it, `DSDataUnit` |
| a few subjects, such as plans or roles | the same settings, a value for each subject | a comparison, `DSComparisonWidget`: the settings down the side, one column for each subject |

- **A fixed ordered set is a `DSTable` or a `DSList` with `reorder`; a listing of records is `DSDataTableWidget` and never reorders** (`RD.SUPPORT.SURFACE.182`). The order of a listing is its viewer's sort, and the order of a fixed set is its meaning, such as the tags of a record or the entries of a menu.
- **A few is up to about 7, and some is up to about 30.** The numbers are there so that two people who read the same set reach the same block. Both numbers are proposed, and not yet confirmed (`RD.SUPPORT.SURFACE.052`).
- **The search and the filters of a data table MUST be sent to the server** (`RD.SUPPORT.SURFACE.070`). The page holds one page of the records. A search in the page would search only that.

### Step 3: the smaller screens

The screen classes are `DESKTOP`, `TABLET` and `MOBILE` (`standards-core.md`). A page holds at each of them, and what changes between two classes is the arrangement.

| At a desktop | At a tablet | On a phone |
| --- | --- | --- |
| `DSDataTableWidget`, layout `TABLE` | the same, with fewer columns | the same data table, layout `LIST`, with the filters behind one action |
| `DSDataTableWidget`, layout `GRID` | the same, with fewer across | layout `LIST` |
| a table, `DSTable` | the same | a list, one group at a time |
| two parts side by side: the groups, and the items of the chosen one | the items take the place of the groups, with a back action; the address changes | the same as a tablet |
| a dialog | the same | a sheet from the bottom of the screen |
| a sheet at the side | the same | the full screen |

### Step 4: how a thing is entered or changed

Where a person comes mostly to read, and a change has weight, the page shows the values and a change is asked for. Nothing then changes by a stray key, and a person who may only read sees the same page. How much there is to enter decides where the entry opens.

| The entry | At a desktop | On a phone | Page pattern |
| --- | --- | --- | --- |
| small: up to about 5 fields in one group | a dialog over the page | a sheet from the bottom of the screen | An entry over the page |
| medium: one column with a few groups, up to about 12 fields | a sheet at the side, with the page still in view | the full screen | An entry over the page |
| large: sections, steps, or records of its own inside it | a page | a page | An entry that is a page |
| one value among many of one kind | in its row | in its line | Change in place, in a list |
| a thing that is only on or off | in place, as a switch | the same | the pattern of the page it stands on |

The two numbers of a small and a medium entry are proposed (`RD.SUPPORT.SURFACE.075`, stated in `architecture-containers.md`).

### What holds for every row of a list

- **A row ends with its actions** (`RD.SUPPORT.SURFACE.071`). `DSDataTableWidget` shows them as icons, or behind one action.
- **One action stands on the row itself, and two or more go behind one action.** A row then keeps its width for its facts. This rule is proposed.
- **A press on a row opens the record**, where the record has a page or a look. This rule is proposed.
- **A state that is normal shows no badge** (`RD.SUPPORT.SURFACE.058`). A badge on every row says nothing, and the row that differs is then hard to find.

## The specs a page starts from — 🔮

**This plugin carries one or more specs for each page pattern, in `refs/support/surface/patterns/`.** A spec is a skeleton: a file that shows where the parts of a page sit, and nothing about how they look. The folder holds 22 specs. 21 are for the fourteen page patterns, and one is for a rule of content. Its `README.md` lists them.

- **A page starts from the spec of its pattern.** Copy the spec, and change the sample values to the page's own. Never start a page from an empty file.
- **The values in a spec are samples.** They show what kind of data a part holds: a title and a line under it, a picture, a state, an action at the end. Which unit shows that data on a real page is the choice of step 2.
- **A spec holds a view for each screen class its pattern differs at.** So one file shows the page at a desktop, at a tablet and on a phone.
- **A spec is strict JSON.** It holds no comment. Draw one with `spn-devex docs figure draw <spec>`.
- **Never edit a file in that folder.** It is a copy of the book's folder. A spec in the plugin MUST equal the spec of the same name in the book (`RD.SUPPORT.SURFACE.053`).

## Each page pattern, by level — 🔮

The levels are the layout, the page level, the containers, the widgets and cards, and the components (`RD.SUPPORT.SURFACE.202`). Every page pattern fills the content of the app's layout. It names no layout of its own: its spec draws it in the layout of its live page, as the sketch's setting. The page level is the head of the page: `DSPageLevel` at `PAGE` above the containers, or the header of the one container that is the page, with `fullPage`. A card stands at the level of a widget. The units named below are the ones the pattern is drawn with. Which unit shows a part that holds many of one thing is still the choice of step 2.

### Find in a list

- **When.** The data grows as people work, and a person comes often, to find one record. A record that has things of its own opens as a page. A record of a few facts and nothing else opens as a look beside the list.
- **Page level.** The header of the container, with `fullPage`: the title, a line under it and the main action.
- **Container.** One `DSContainer`. Its content is two parts: the filter bar, and the records. Its footer holds the paging: the page gives `DSDataTableWidget` a place in the footer, and the table draws its paging there.
- **Widget.** `DSFilterBarWidget` and `DSDataTableWidget`, in the layout that step 2 chose.
- **Component.** `DSDrawer`, for the look of a small record beside its list.
- **On a tablet and a phone.** A tablet keeps `TABLE` with fewer columns, and its filter bar holds fewer boxes. On a phone the data table is in its `LIST` layout, and the filter bar is one button that says how many filters are on. The look of a small record is a screen of its own on a phone.
- **Specs.** `find-in-a-list.dg.json` · `find-in-a-list-look.dg.json`.

### A record and its setup

- **When.** The data is one record and a few things set up for it. A person comes rarely, to see where things stand.
- **Layout.** The page level, then the containers. An action that can do harm stands apart from the others, at the end.
- **Page level.** `DSPageLevel` at `PAGE`, holding `DSItem`: the record, its picture, its name, and under the name its facts.
- **Container.** One `DSContainer` for each thing set up, with its title and its actions above its outline.
- **Widget.** None.
- **Card.** `DSCard` for each smaller part.
- **Component.** `DSSwitch` for a thing that is only on or off. `DSBadge` for a state that is not normal.
- **On a tablet and a phone.** At a desktop the large part is the main column and the short part stands beside it. On a tablet and a phone all of it is one column: the header, the main column, then the column that stood beside it.
- **Spec.** `record-and-its-setup.dg.json`.

### A record and what belongs to it

- **When.** The data is one record with lists of other records attached. A person comes to attach or remove one, or to read what happened.
- **Layout.** The page level, then the attached lists, side by side where the page is wide.
- **Page level.** `DSPageLevel` at `PAGE`, holding `DSItem`: the way back, the record's picture, its name, and under the name its state and one more fact.
- **Container.** One `DSContainer` for each attached list. A list a person adds to has a box at its top that finds a record as they type, with Add beside it. A list that is only read has none.
- **Widget.** None.
- **Component.** `DSList` holding `DSItem`: each attached record is a line that ends with the action that removes it. `DSEmpty` for the empty state of a list. No list shows a count.
- **On a tablet and a phone.** Three lists stand side by side at a desktop, two and one on a tablet, and one column on a phone.
- **Spec.** `record-and-what-belongs-to-it.dg.json`.

### Set up by kind

- **When.** The data has fixed kinds, with one or a few of each. A person comes rarely, to connect or change one. The page shows every kind always, also a kind that has nothing yet. The kinds in use come first.
- **Page level.** `DSPageLevel` at `PAGE`: the title of the page, and a line under it.
- **Container.** One `DSContainer`, holding the kinds.
- **Widget.** `DSDataTableWidget` in its `GRID` layout, where the kinds come from a query that takes a page, a text or a filter. It draws one card for each kind.
- **Card.** `DSCard`, one for each kind. Its title is the kind, with the icon of that kind before it.
- **Component.** `DSItem` and `DSEmpty`. Under the title of a card stands the provider as an item. A kind with nothing yet says so and offers the action.
- **On a tablet and a phone.** Three cards across at a desktop, two on a tablet, and one on a phone.
- **Spec.** `set-up-by-kind.dg.json`.

### Compare across kinds

- **When.** The data is one fixed set of settings for a fixed set of kinds. A person comes rarely, to check or change a default. The page has no search and no paging, because the settings are few and fixed.
- **Page level.** The header of the container, with `fullPage`: the title of the page, and a line under it.
- **Container.** One `DSContainer`, holding the table.
- **Widget.** None.
- **Component.** `DSTable`: a setting in each row and a kind in each column, with an Edit under each kind. `DSDialog` with `DSForm` for the change. On a phone, `DSTabs` and `DSDataUnit`.
- **On a tablet and a phone.** A tablet keeps the table. On a phone a person reads one kind at a time, as labelled values, with the kinds as tabs and Edit in the footer. Tabs fit here because the kinds are a closed set. The entry that changes one kind is a dialog at a desktop, and a sheet from the bottom of the screen on a phone.
- **Specs.** `compare-across-kinds.dg.json` · `compare-across-kinds-edit.dg.json`.

### Choose many

- **When.** The data is many things to tick, and a person ticks several. Where the data says which group each thing belongs to, the page has one part for each group. Where it does not, the things are one list with a search.
- **A heading MUST NOT be made up for choices whose data names no group** (`RD.SUPPORT.SURFACE.055`). A made-up heading puts a choice where a person does not look for it.
- **Layout.** The content, or the content of the entry the choices stand in: one container, or the parts of the entry's content.
- **Page level.** The header of the container, with `fullPage`, where the choices are a page; the entry's own header where they stand in an entry.
- **Container.** One `DSContainer`: a part of its content for each group under the title of the group, or one part for the whole list, and its actions in its footer. The choices of every group are saved once, so a group is a part of the content and never a container of its own.
- **Widget.** None.
- **Component.** `DSForm`, with `DSSwitch` or `DSCheckbox`, and `DSList`. The choices stand in columns.
- **On a tablet and a phone.** On a phone the choices stand one under another.
- **Specs.** `choose-many-in-groups.dg.json` · `choose-many-in-one-list.dg.json`.

### An editor with its preview

- **When.** The data is content a person writes and what that content becomes. The person must see the result while writing.
- **An editor with its preview MUST be one container, and each thing a person writes MUST stand beside its own result** (`RD.SUPPORT.SURFACE.115`). The page is an entry that is a page. Its content has a part for the details that have no preview, and then one part for each thing a person writes, under the title of that thing.
- **Where the content has several forms, a row of tabs MUST choose the form.** The tabs stand at the top of the content, and every part under them belongs to the chosen form. Where the record is saved whole, one save holds every form.
- **Layout.** One container.
- **Page level.** The header of the container, with `fullPage`: the way back, before the title.
- **Container.** One `DSContainer`: the tabs, the details and one part for each thing written as the parts of its content, each part under its own title; its actions at the start of its footer.
- **Widget.** None.
- **Component.** `DSTabs` for the forms of the content, such as its channels. `DSForm` for the fields of the details. `DSTextarea` for the editor of each thing written, and the rendered result beside it. `DSSticky` for the footer that stays in view.
- **On a tablet and a phone.** At a desktop the editor of each part and its result stand side by side. On a tablet and a phone a person sees one of the two at a time, the writing or the result. A second row of tabs moves between them, and the choice holds for every part of the content at once.
- **Spec.** `editor-with-preview.dg.json`.

### An entry over the page

- **When.** The data is a small or a medium form, and the page it belongs to stays beneath or beside it. Step 4 says which is small and which is medium.
- **Layout.** The content of the page the entry belongs to. It stays in view beneath a dialog, or beside a sheet.
- **Page level.** The page level of the page the entry belongs to. The entry takes none of its own: its title stands in the header of its container.
- **Container.** One `DSContainer` inside the overlay. Its title and the action that closes it stand in its header. Its fields are its content. Its actions stand in its footer.
- **Widget.** None.
- **Component.** `DSDialog` for a small form. `DSSheet` for a medium one. `DSDrawer` for a look at one record. `DSForm` for the fields.
- **On a tablet and a phone.** A tablet keeps the dialog, or the sheet beside its page. On a phone a small entry is a sheet from the bottom of the screen, and a medium entry takes the full screen.
- **Spec.** `entry-over-the-page.dg.json`. It draws a medium entry. A dialog over its page has no figure, because a skeleton lays no frame over another.

### Inherit or override

- **When.** The data is a value that follows a default until someone sets their own. The person must see which of the two it is, and be able to go back.
- **Layout.** The page level, then one container for each part.
- **Page level.** `DSPageLevel` at `PAGE`: the title of what the values belong to, with the way back before it.
- **Container.** One `DSContainer` for each part. The line under its title says whether the part follows the default or holds its own values. Its header or its footer holds the one action that changes that.
- **Widget.** None.
- **Component.** `DSDataUnit` for the values that are read. `DSButton` for the action to set its own, or to go back.
- **Following the default is the normal state, so it shows no badge.**
- **On a tablet and a phone.** The values a person reads stand three across at a desktop and a tablet, and one under another on a phone. Two parts stand side by side at a desktop, and one under another on a tablet and a phone.
- **Spec.** `inherit-or-override.dg.json`.

### Groups and their items

- **When.** The data is things in groups, where a group is a heading. A person comes to see the whole and to open one item.
- **The pattern is two parts: the groups, and the items of the chosen one.** What shows each part is chosen separately, by the data of that part.

| A part is shown as | When its data is |
| --- | --- |
| parts of the page, with nothing to choose | the groups only: few and fixed, so all of it fits one page |
| a list | few, each told by its name and a little more that fits one line |
| a table | some, each with two or three facts a person compares |
| a data table, with a search, filters and paging | many: a person must find one first |
| cards | few, each with a picture or more than a line can hold |
| a view of one thing | the items only: the chosen group is one record to read, as one message of a mailbox is |

Whether the set of groups is closed decides the arrangement, before any count does.

| The groups | The arrangement |
| --- | --- |
| a closed set, few, and all the items fit on about two screens | one page, a container for each group, all open |
| a closed set, few, each one long | a tab for each group |
| can be added to, by a module, a partner or a person; or many | the groups as a list at the left, the items of the chosen group at the right |
| any, where the items of a group grow without limit | the same, with a data table at the right, which is then Find in a list |

- **A set of groups that can be added to MUST be a list, and never a row of tabs** (`RD.SUPPORT.SURFACE.080`). A row of tabs has the width of the page and no more.
- **Both parts MUST be in view at a desktop only** (`RD.SUPPORT.SURFACE.079`). On a tablet and on a phone the items of the chosen group take the place of the groups, with a back action.
- **The swap MUST change the address.** The back of the browser then does the same as the back action. A reload stays on the chosen group, and a link to one group opens it on every screen.
- **Many groups a person searches MUST be the `LIST` layout of `DSDataTableWidget`, and never its `TABLE` layout** (`RD.SUPPORT.SURFACE.069`). The part is narrow, and a person picks one group by its name.
- **Ask whether a group is a thing a person manages.** Where the product fixes the groups, a group is a heading. Where people make them, a group has its own actions.
- **Page level.** `DSPageLevel` at `PAGE`: the title of the page, and a line under it.
- **Container.** `DSContainer`: one for each group, or two side by side. Where two stand side by side, the chosen group is the title of the container at the right. The action that adds an item stands in that header.
- **Widget.** `DSDataTableWidget` in its `LIST` layout, where the groups are many.
- **Component.** `DSList` holding `DSItem`, for the groups as lines, with a band behind the chosen one. `DSTable`, where the items are a table. `DSBadge` for a state that is not normal.
- **Specs.** `groups-and-their-items.dg.json` for a closed set. `groups-and-their-items-two-lists.dg.json` for a list beside a list. `groups-and-their-items-open.dg.json` for a set that can be added to. `groups-and-their-items-many.dg.json` for many groups. `one-action.dg.json` for the page of one item.

### An overview

- **When.** The data is counts and what waits for a person, and the person has just arrived. The page shows how much there is, then what needs them, then the places they often go to.
- **Layout.** The page level, a row of numbers, then the containers.
- **Page level.** `DSPageLevel` at `PAGE`: the title of the page.
- **Container.** `DSContainer`: what waits for the person, and the places they often go to.
- **Widget.** None.
- **Card.** `DSCard` for each number, a card of its own.
- **Component.** `DSDataUnit` for the number in its card. `DSList` for each thing that waits, as a line that ends with its action.
- **On a tablet and a phone.** The numbers stand four across at a desktop, and two across on a tablet and a phone. The two containers stand side by side at a desktop, and one under another on a tablet and a phone.
- **Spec.** `overview.dg.json`.

### A record and its steps

- **When.** The data is one record that moves through known steps. A person with the right role moves it on. The page shows the step the record is at, and only the actions that are open at that step.
- **Layout.** The page level, the steps, then the containers.
- **Page level.** `DSPageLevel` at `PAGE`, holding `DSItem`: the way back, the record's picture, its name, and on the line under the name its state and its facts. Its end holds only the actions open at this step.
- **Container.** `DSContainer`: the steps, and one container for each group of checks of the record.
- **Widget.** None.
- **Component.** `DSDataUnit` for each check. `DSBadge` only on the value that is not normal. `DSButton` for the actions open at this step.
- **The design system has no unit for a strip of steps today.** The spec draws the steps as four plain words, with the step the record is at as the heavy one.
- **On a tablet and a phone.** The checks stand two across where two parts share the width at a desktop, three across on a tablet, and one under another on a phone. On a phone the steps stand one under another, and the actions of the step stand at the end of the page.
- **Spec.** `record-and-its-steps.dg.json`.

### An entry that is a page

- **When.** The data is a large form, with sections or a part that repeats. A person fills it in one sitting.
- **Layout.** One container.
- **Page level.** The header of the container, with `fullPage`: the way back, before the title.
- **Container.** One `DSContainer`. Its sections are the parts of its content, each with its own title. Its actions stand in its footer.
- **Widget.** None.
- **Component.** `DSForm` for the fields, each with its title above its control. `DSSticky` for the footer that stays in view.
- **The sections are parts of one form that is saved once.** So they are not containers of their own, and no list of the sections stands beside the form.
- **On a tablet and a phone.** Fields that are short and belong together share a row at a desktop. On a phone each field takes a row.
- **Spec.** `entry-as-a-page.dg.json`.

### Change in place, in a list

- **When.** The data is many small values of one kind, and a person changes one after another. The page is a data table whose rows are read. The action of a row turns its value from words into a box, and the action that saves it stands beside the box. The page holds no form, and nothing opens over it.
- **Page level.** The header of the container, with `fullPage`: the title, and a line under it.
- **Container.** One `DSContainer`: the filter bar and the rows in its content, and the paging in its footer.
- **Widget.** `DSDataTableWidget` and `DSFilterBarWidget`.
- **Component.** `DSInput`, the box in the one cell that is being changed, as wide as the cell.
- **On a tablet and a phone.** On a phone the table is in its `LIST` layout. A row that is read is a line. The row that is being changed is its text with its box under it, and the same two actions beside the box.
- **Spec.** `change-in-place.dg.json`.

## How many containers a page uses — 🔮

A container frames one thing that a person reads as a whole or saves as a whole. That one fact decides how many containers a page has, in every pattern.

- **A page MUST use one container for each thing a person reads or saves as a whole** (`RD.SUPPORT.SURFACE.116`). The sections of that one thing are the parts of its content, each under its own title.
- **A section of one thing MUST NOT be a container of its own.** A frame around a section says that the section is read or saved by itself.
- **Two things that are read or saved apart MUST be two containers, each with its own title.** A person then sees where one thing ends and the next begins, and which actions belong to which.

| The page | Its containers |
| --- | --- |
| an entry that is saved once | one container. Its sections are the parts of its content, and its actions stand in its footer |
| the page of a record | the head of the record outside any frame, then one container for each thing that belongs to the record, such as its content and the list of its versions |
| a listing | one container, with the filter bar and the records as the parts of its content |

The reason is the theme. The parts of a container are the places the look of the app reaches. So a page that draws no frame, no line and no padding of its own takes the theme of a partner with no change.

- **The page that reads a record and the page that changes it MUST hold the same parts in the same order** (`RD.SUPPORT.SURFACE.117`). On the page that changes the record, a reading becomes a field, a block of source becomes an editor, and the footer with the actions is added. Nothing else moves. The rule holds for the container of the thing that is changed: the page that reads a record may hold more containers, such as the list of its versions.

## The listing pages — 🔮

A listing page is a page whose whole content is the records of one kind. It follows Find in a list. `DSDataTableWidget` has three layouts, and a listing page is that one widget in one of the three. It keeps its search, its filters and its paging in each.

| One record holds | At a desktop | At a tablet | On a phone |
| --- | --- | --- | --- |
| several facts a person compares across rows | `TABLE` | `TABLE`, with fewer columns where the record has many | `LIST` |
| a thing of its own: a kind to set up, an app, a file with a preview | `GRID` | `GRID`, two across | `LIST` |
| a title and a line under it | `LIST` | `LIST` | `LIST` |

- **A listing page whose query takes a page, a text or a filter MUST stay a data table, also where its set is small today** (`RD.SUPPORT.SURFACE.054`). Its search and its paging are sent to the server. A plain table or a list would do neither.
- **A list of groups and the list of their items are one page.** The two follow Groups and their items, and neither is a listing page of its own.

## The sign-in page — 🔮

A sign-in is not one of the fourteen patterns: it is the page a person passes before any of them, and every app has one, so its shape is stated once (`RD.SUPPORT.SURFACE.205`).

| Level | The sign-in |
| --- | --- |
| Layout | `CANVAS`, the body alone, with the container centred in the window, across and down, in a column as wide as a form reads well. A legal line, where the app has one, is the layout's `footerNode` |
| Page level | none apart from the container: its header holds an item with the step's title, such as *Sign in to Nimbus*, and its line |
| Container | one `DSContainer` at `SM`, in the theme's look, with `divided` set to `CONTENT`: the first content signs in, and a second content, set apart by its line, holds the other task, *New to Nimbus? Create an account* |
| Components | in the first content, in this order: the brand as an item at the level `CONTAINER` with its mark; the providers as one centred row of icon buttons of one size, each named by its tooltip; a `DSSeparator` with the label *or*; the fields; the main action across the content; a `DSSeparator` with the label *Other ways to sign in*; and the other ways, such as a passkey, a code by email and single sign-on, as one row of equal outline buttons |

- **A sign-in is one compact container, so the whole of it is seen without a scroll.** Each group stands one step of the scale from the next, and the fields stand one under another, their message lines the space between them.
- **Every control is a `DSForm.Field`.** A choice between two ways to say who you are, such as an email or a phone, is a `DSToggleGroup` above the one field it switches. The action of a field, such as *Forgot password?*, stands at the end of its label line as `labelEndNode`. A checkbox alone on its line, such as *Remember me*, is a field with `showBlankLabel={false}`.
- **The providers are icons alone, one row, centred, each its own size with one gap between them**, and never a column of wide buttons.
- **An alternative stands as an equal of the others, and opens its own step in place.** A one-time code or single sign-on changes the header's title and the content's fields, with a way back to the password, and the page does not move.

## What every spec shows the same way — 🔮

Every spec draws a part of a page the same way, whichever pattern it belongs to. The rule behind each row is stated once, in the ref the last column names.

| Part of a page | How every spec shows it | The rule is stated in |
| --- | --- | --- |
| the record a page is about | the page level, the head of the page: its picture, its name, and its facts on the line under the name. It has no frame | `standards-core.md` |
| a state a person looks for | a badge on the line of facts, before the other facts, or at the end of the line. The normal state shows none. The end of a line holds its actions, a badge, or both | `standards-core.md` |
| a line of a list | an item line, `DSItem`, with a line between each two | `architecture-components.md` |
| a field a person enters, and a field a person reads | `DSForm.Field`, and `DSDataUnit`, each with its title above | `architecture-components.md` |
| a value from an enum | a badge beside other facts, a title where it is the subject of a part, and plain text where it stands alone in a labelled field. `a-value-from-an-enum.dg.json` draws each way | `architecture-components.md` |
| a filter bar, a value changed in a list, and many groups a person searches | `DSFilterBarWidget` in its one form, and `DSDataTableWidget` | `architecture-widgets.md` |
| a container, several parts of one content, and a large form | the title and the actions above the outline, and what closes the work in the footer | `architecture-containers.md` |

## What is not settled or checked yet

- **No check reads a page for its pattern.** A review names the pattern and reads the page beside its spec.
- **A unit does not yet do everything a pattern asks of it.** No unit draws a strip of steps, and a value that is not text is not changed in a cell. `architecture-widgets.md` says plainly what a unit does not do, under *Not there yet*.

## Boundary

This ref states which pattern covers a given task, and what blocks carry it. It also states which arrangement a whole page takes, and in what order that is decided. It stops at naming the blocks. It does not state what the six parts are or what a task state is — that is `standards-interaction.md`, used by every pattern here without restating it. It does not state what a label, a badge, a count or a field owes a person on any page — those are the rules of content, in `standards-core.md`. It does not state what the layouts of the data table are, what an item line holds, or how an entry and a large form are framed — those are `architecture-widgets.md`, `architecture-components.md` and `architecture-containers.md`. It does not state what a block, a prop or a token is named — that is `architecture-names.md` and the refs after it.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.158` | every overlay that covers a page dims it with one scrim |
| `RD.SUPPORT.SURFACE.093` | a sheet that is not modal stands beside the page and draws no scrim |
| `RD.SUPPORT.APPS.159` | an alert and a toast draw one picture |
| `RD.SUPPORT.SURFACE.046` | the two kinds of pattern, a task pattern and a page pattern |
| `RD.SUPPORT.SURFACE.047` | how a thing is shown follows from the data and from the person who uses it |
| `RD.SUPPORT.SURFACE.048` | a page pattern is built from blocks that exist, and is never a block of its own |
| `RD.SUPPORT.SURFACE.049` | a page pattern fixes the arrangement, and never which block fills a part |
| `RD.SUPPORT.SURFACE.050` | no page pattern depends on a count |
| `RD.SUPPORT.SURFACE.051` | the page patterns as one named set, chosen and never invented. The names are proposed |
| `RD.SUPPORT.SURFACE.052` | a page is decided in four steps, with a block as the last thing chosen. The two numbers of step 2 are proposed |
| `RD.SUPPORT.SURFACE.053` | a spec in the plugin equals the spec of the same name in the book |
| `RD.SUPPORT.SURFACE.054` | a listing page whose query takes a page, a text or a filter stays a data table |
| `RD.SUPPORT.SURFACE.055` | no heading is made up for choices whose data names no group |
| `RD.SUPPORT.SURFACE.115` | an editor with its preview is one container, and each thing a person writes stands beside its own result |
| `RD.SUPPORT.SURFACE.116` | a page uses one container for each thing a person reads or saves as a whole, and a section of one thing is never a container of its own |
| `RD.SUPPORT.SURFACE.117` | the page that reads a record and the page that changes it hold the same parts in the same order |
| `RD.SUPPORT.SURFACE.205` | a sign-in is one compact container on a canvas, its providers one row of icons and every control a form field |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
