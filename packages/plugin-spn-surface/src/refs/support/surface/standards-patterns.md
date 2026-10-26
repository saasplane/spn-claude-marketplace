<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-surface/03-standards-patterns.md",
      "seen": "04ba9cf3"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-patterns/",
      "seen": "aa82da09"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "`SKELETON` — a mock of a layout",
      "seen": "ee4edd9b"
    }
  ]
}
-->

# Surface Patterns — Tasks, Apps, Sites and Flows

Source of truth: the foundation's Patterns construct (`docs/02-constructs/02-support/01-surface/03-standards-patterns.md`) and its capability chapters (`docs/04-capabilities/02-support/01-surface/03-standards-patterns/`). Those chapters hold the task patterns, the app patterns, the site patterns and the flow patterns, each in a common folder with what only a browser has in a web folder, and the two folders of specs that this plugin carries a copy of.

This ref restates the four groups, the task patterns and the app patterns. The site patterns and the flow patterns have refs of their own beside this one, `site-patterns.md` and `flow-patterns.md`.

Patterns is the third of thirteen Surface constructs. It fills in the six parts of a pattern (the previous standard of this folder) once for each task intent a person has in an app today. It also names the app patterns: a small set of arrangements for a whole screen of an app. Beside them stand the site patterns, for a section of a site's page, and the flow patterns, for a path across pages to one outcome.

Read this to build a page from patterns a person already knows, or to review a page by naming the pattern it should have used. A page never invents a pattern of its own for an intent this ref already holds. Most "new" tasks are one of the intents below under another name: *search* is Find, *edit* is Enter, *delete* is Act. The same holds for a whole screen. Most screens are one of the app patterns below, and the data and the person say which one.

## Terms

`Task intent` and `Pattern` belong to `standards-interaction.md`; this ref uses them as that ref states them. A task pattern is that same Pattern, with the longer name so that a reader can tell it from an app pattern.

| Term | What it means |
| --- | --- |
| Intent | the one verb a pattern's section is named for, such as Move or Act |
| Task pattern | the pattern for one task intent: one way to run that task, stated in the six parts of `standards-interaction.md` |
| App pattern | the arrangement of a whole screen of an app, chosen by the data the screen holds and by the person who reads it |
| Site pattern | the shape of a section of a site's page, marketing or docs |
| Flow pattern | a path across pages to one outcome, built from the app and site patterns that exist |

## The groups, smallest scope first — 🔮

**The surface patterns fall into groups by scope, smallest first: task patterns, app patterns, site patterns and flow patterns** (`RD.SUPPORT.SURFACE.046`). A rule is found in the group its scope names.

| Group | Its scope | Where it holds | Restated in |
| --- | --- | --- | --- |
| Task patterns | one task of one intent, from Move to Be refused, on any page | on every kind of app | this ref |
| App patterns | the shape of a screen of an app, chosen by its data and its person | chosen by the kind of app | this ref |
| Site patterns | the shape of a section of a site's page, marketing or docs | chosen by the kind of app | `site-patterns.md` |
| Flow patterns | a path across pages to one outcome, built from the app and site patterns that exist | on every kind of app | `flow-patterns.md` |

Task and flow patterns hold on every kind of app. App and site patterns are chosen by the kind of app, as the book already chooses a layout by an app's job: an app's screens take app patterns, and a site's pages take site patterns. A page follows one app or site pattern, and each task on that page follows its task pattern. A listing page follows the app pattern Find in a list, and the search inside it runs by the task pattern Find.

**Each group is stated in two folders.** `01-common/` holds what every kind of surface follows. `02-web/` holds what a browser alone has: each intent's keys and pointer, hover, and the address an app pattern changes. A rule sits in common only when it holds on every kind of surface; this ref gives the web's lines under their own headings, *On the web*.

## The kind of person, in every pattern — 🔮

**Every pattern, in every group, MUST name the kinds of person it serves, and one line says how it runs differently for one of them** (`RD.SUPPORT.SURFACE.332`). Each section opens with its **For** line. The kinds are one closed set, Team, Everyday users, Visitor and Learner, read once for the app before any pattern is chosen, as `standards-core.md` states under *Who an app is for*. Where a section names no difference, the pattern runs as written for every kind it serves.

- **Where two patterns fit a page's data, the kind of person MUST decide between them** (`RD.SUPPORT.SURFACE.333`). A Team takes the one that keeps the person in place and fast, Everyday users the one that asks one thing at a time. `standards-core.md` gives the table of what each kind changes.
- **A kind changes only what an app already sets, and the lines its patterns carry** (`RD.SUPPORT.SURFACE.334`). It never brings a second version of a page, or a unit of its own.

## The task patterns, by intent — 🔮

| Task intent | The pattern covers | Blocks that carry it | For |
| --- | --- | --- | --- |
| Move | going to another place, and knowing where you are | the layout · `DSNavList` · `DSNavMenu` · `DSNavBarSide` · `DSNavBarTop` · `DSTabs` · `DSBreadcrumb` · `DSLink` | Team · Everyday users · Visitor · Learner. For Everyday users, the few places that fit one bar, never a tree of sections; for a Visitor, a site's bar and its doors |
| Find | search, filter, sort, and paging through records | `DSFilterBar` · `DSDataTable` · `DSCommandPalette` · `DSPagination` | Team · Everyday users · Learner. For Everyday users, one search box first and a few filters in view; for a Learner, a search over the docs |
| Read | records as a table, a list or a grid, one record in detail, subjects compared across the same settings, and nothing to show | `DSTable` · `DSList` · `DSDataFieldView` · `DSComparison` · `DSEmpty` · `DSSkeleton` | Team · Everyday users · Visitor · Learner. For Everyday users, item lines before a table; for a Team, a table that compares |
| Enter | filling a field, the check on it, and sending a form | `DSForm` and the entry fields | Team · Everyday users · Visitor. For Everyday users, one group of fields at a time, every format accepted, and nothing lost; for a Visitor, the fewest fields |
| Choose | picking one or many from a set | `DSSelect` · `DSRadioGroup` · `DSCheckboxGroup` · `DSToggleGroup` and the pickers | Team · Everyday users. For Everyday users, a few options shown whole, and never a picker to search under about 7 |
| Act | one main action, an action on many records, and an action that destroys something | `DSButton` · `DSDropdownMenu` · `DSConfirmPopover` · `DSConfirmDialog` | Team · Everyday users. For a Team, actions on many records; for Everyday users, one action at a time, with undo before confirm |
| Interrupt | a task that takes over the page for a moment | `DSDialog` · `DSDrawer` · `DSSheet` | Team · Everyday users. For Everyday users on a phone, a sheet from the bottom or the full screen |
| Disclose | showing more in place, without leaving | `DSAccordion` · `DSCollapsible` · `DSPopover` · `DSTooltip` · `DSHoverCard` | Team · Everyday users · Visitor · Learner. For a Visitor and a Learner, the accordion of a site's Questions |
| Hear back | what the surface says while it works, when it is done, and when it fails | `DSSpinner` · `DSProgress` · `DSToast` · `DSAlert` | Team · Everyday users · Visitor · Learner. For Everyday users, a failure in everyday words, with what to do next |
| Be refused | a block hidden or disabled because the person has no permission | `DSAuthz` and the gate props | Team · Everyday users. For Everyday users, the refusal says who to ask, in everyday words |

A page usually serves several intents, and one is still the main one (`standards-core.md`'s one purpose). Each intent's section states its own six parts in full in the capability chapter; a few load-bearing details: an empty result is not a failed search — the two pictures stay apart. A field that is not accepted is a control state (error) on the field, where a send that does not work is a task state (failed) on the form. Every overlay that covers a page dims it with one scrim, so a dialog, a confirm dialog, a drawer and a sheet all read the same way: the page behind waits. **A sheet that is not modal covers no page, so it MUST draw no scrim** (`RD.SUPPORT.SURFACE.093`). It stands beside the page, and the page stays usable. It is no interruption, because the page does not wait. A page uses it where a person works in the sheet and in the page by turns, such as a panel of settings whose result shows on the page. A popover covers no page either, so `DSConfirmPopover` draws no scrim. An alert and a toast draw one picture; the toast is the alert that appears for a while and leaves. A refusal on the surface is presentation only — hiding or disabling protects nothing, and the refusal itself is the server's.

Each section states its input for each kind of surface. On native it says what touch does: a tap, and for Read a scroll by touch. A hidden or disabled block takes no input.

An action that needs a confirmation first asks the person for it. A confirmation has two blocks, and what the act does decides which one a page uses.

| The act | Its confirmation | Why |
| --- | --- | --- |
| A person can undo it, such as activate, deactivate or remove from a list | a popover, `DSConfirmPopover`, which opens from the control that was pressed | the page stays in view and the person keeps their place. A wrong answer costs little, because the act can be undone |
| It cannot be undone, such as delete | a dialog, `DSConfirmDialog`, over the page | the dialog covers the page, so the person stops and reads the question before something is lost |

- **A confirmation MUST be a popover for an act a person can undo, and a dialog for an act that cannot be undone.** A dialog for every small act teaches a person to confirm without reading. Then the dialog no longer stops them on the one act that matters.
- **Both blocks stay open while the act runs.** A failure is then shown where the person confirmed, and the act is never sent twice.

### On the web: the keys, the pointer and hover

On the web each intent's input says what the keyboard does and what the pointer does. *Reach* means the keyboard moves focus to a block; *activate* means it presses the block that has focus.

| Task intent | On the web |
| --- | --- |
| Move | the keyboard reaches each destination and activates it, and the pointer presses it |
| Find | the person types in the search field; the keyboard reaches each filter, the sort and the pager, and the pointer presses each one |
| Read | the keyboard reaches each record that can be opened, and the pointer presses it |
| Enter | the keyboard reaches each field in reading order, and it sends the form; the pointer presses a field to enter it |
| Choose | the keyboard reaches the set, moves through its entries and picks one; the pointer presses an entry |
| Act | the keyboard reaches the action and activates it, and the pointer presses it |
| Interrupt | the keyboard stays inside the interruption while it is open, and one key leaves it; the pointer presses its actions |
| Disclose | the keyboard reaches the block and opens or closes it, and the pointer presses it. Hover shows `DSTooltip` and `DSHoverCard`, and so does focus |
| Hear back | the keyboard reaches any action a message offers, and the pointer presses it |

Hover belongs to the web alone. So `DSTooltip` and `DSHoverCard` hold only an addition, and never the one way to a thing a person needs.

## Adding an intent — 🔮

The list grows when a task appears that no section covers, after checking the task is genuinely new.

- A new intent joins this construct as a section, with every one of Interaction's six parts stated.
- A new pattern names blocks of the design system. A pattern that needs a block the design system lacks waits for that block.

A page never invents a pattern of its own for an intent the list already holds.

## A page no pattern fits — 🔮

Adding an intent checks that a new task is not an old one under another name. A page shape is checked the same way. **A page shape earns a pattern of its own only when no existing pattern fits its person and its data.** Until then, **a page no pattern fits is derived from the patterns whose person and data fit it, and it never waits for a pattern** (`RD.SUPPORT.SURFACE.051`, `RD.SUPPORT.SURFACE.332`): a board is derived from Groups and their items, and a cart from Change in place, in a list. Counting the kinds of product that need a shape is not the test, because the book lists no kinds of product; the person and the data can be read for any page.

## The data and the person decide — 🔮

**How a thing is shown MUST follow from the data and from the person who uses it** (`RD.SUPPORT.SURFACE.047`). A page is never arranged by how another page looks, or by which block is at hand. Two pages that look alike may hold data that grows in different ways. They may also serve people who come for different reasons. The same arrangement would then be right for one page and wrong for the other.

**The person is read twice.** The kind of person the app is for is read once, before any page, and it decides between two patterns that fit the same data. Who comes to this page, how often and to do what is read for each page.

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
- **An app pattern MUST NOT depend on a count** (`RD.SUPPORT.SURFACE.050`). A server does not always return how many items a group holds. A group shows a count only where the server gives it together with the groups. No page asks once for each group to fill a number in.

## The app patterns — 🔮

An app pattern says: for this kind of data and this kind of person, show the screen this way. Fourteen are named. A page whose data and person match a row takes that pattern, and its **For** line names the kinds it serves.

| App pattern | The data | The person | Kind | For |
| --- | --- | --- | --- | --- |
| Find in a list | a set that grows as people work | comes often, to find one | a whole page | Team · Everyday users |
| A record and its setup | one record, and a few things set up for it | comes rarely, to see where things stand | a whole page | Team · Everyday users |
| A record and what belongs to it | one record, with lists of other records attached | comes to attach or remove one, or to read what happened | a whole page | Team |
| Set up by kind | fixed kinds, with one or a few of each | comes rarely, to connect or change one | a whole page | Team |
| Compare across kinds | one fixed set of settings, for a fixed set of kinds | comes rarely, to check or change a default | a whole page | Team |
| Groups and their items | things in groups, where a group is a heading | comes to see the whole and open one item | a whole page | Team · Learner |
| An overview | counts, and what waits for a person | has just arrived | a whole page | Team · Everyday users |
| A record and its steps | one record that moves through known steps | moves it on, with the right role | a whole page | Team · Everyday users |
| Choose many | many things to tick | ticks several | entering or changing | Team · Everyday users |
| An editor with its preview | content a person writes, and what it becomes | must see the result while writing | entering or changing | Team |
| An entry over the page | a small or a medium form | needs the page it belongs to, which stays beneath or beside the entry | entering or changing | Team · Everyday users |
| Inherit or override | a value that follows a default until someone sets their own | must see which of the two it is, and be able to go back | entering or changing | Team |
| An entry that is a page | a large form, with sections or a part that repeats | fills it in one sitting | entering or changing | Team · Everyday users |
| Change in place, in a list | many small values of one kind | changes one after another | entering or changing | Team |

Eight are the arrangement of a page a person arrives at. The other six are how a person enters or changes something, and each of those opens from one of the eight.

- **The app patterns are one closed set, and an app pattern is chosen and never invented** (`RD.SUPPORT.SURFACE.051`). A page no pattern fits is derived from the patterns that fit it, as *A page no pattern fits* says. The name of each pattern is proposed: the developer of SaaS Plane has not confirmed the names one by one.
- **An app pattern MUST be built from units that exist, and it is never a block of its own** (`RD.SUPPORT.SURFACE.048`). No stack builds anything for an app pattern. A page follows one with the blocks the design system already has.
- **An app pattern fixes the arrangement of a page, and never which block fills a part** (`RD.SUPPORT.SURFACE.049`). Each part MUST be shown by what its own data asks for: a list, a table, a data table, or a view of one thing. Two parts of one page often hold data of different shapes.

## The choice, in four steps — 🔮

**A page is decided in four steps, in one order, and a block is the last thing chosen** (`RD.SUPPORT.SURFACE.052`). A choice that starts from a block fits the page to the block. The data and the person are then read too late to change anything.

| Step | What is decided | Decided from |
| --- | --- | --- |
| 1 | the app pattern: the shape of the page | what the page is about, and why a person comes |
| 2 | what shows each part that has many of one thing | what the contract says of the list, and what one of them holds |
| 3 | what changes at a tablet and on a phone | the choice of step 2 |
| 4 | how a thing is entered or changed | how much there is to enter |

### Step 1: the pattern

Read the facts against the table of the app patterns, and name the one pattern that fits. Where the data and the person point to two different patterns, say so and ask: the kind of person the app is for decides between two that fit the same data. A list that grows, used by a person who comes once a year, is a different page from the same list used every day.

### Step 2: what shows a part

**The contract decides first.** Where the query takes a page, a text or a filter, the part is the data table, `DSDataTable`. The server then holds more records than the page has loaded.

| What the contract says of the list | What one of them holds | Shown as |
| --- | --- | --- |
| the query takes a page, a text or a filter | several facts a person compares across rows | `DSDataTable`, in its `TABLE` layout |
| the same | a title and a line under it | `DSDataTable`, in its `LIST` layout |
| the same | a thing of its own: a kind to set up, an app, a file with a preview | `DSDataTable`, in its `GRID` layout |
| the whole set, a few and fixed | a name | a list, `DSList` |
| the whole set, a few and fixed, and its order is the meaning | a name, or a few facts | a list, `DSList`, or a plain table, `DSTable`, with `reorder` |
| the whole set, a few | a picture, a title, a line under it, and an action | a list of item lines, `DSList` holding one `DSItem` for each |
| the whole set, some | two to four facts a person compares | a plain table, `DSTable` |
| one record | several facts | readings, each a title with its value under it, `DSDataUnit` |
| a few subjects, such as plans or roles | the same settings, a value for each subject | a comparison, `DSComparison`: the settings down the side, one column for each subject |

- **A fixed ordered set is a `DSTable` or a `DSList` with `reorder`; a listing of records is `DSDataTable` and never reorders** (`RD.SUPPORT.SURFACE.182`). The order of a listing is its viewer's sort, and the order of a fixed set is its meaning, such as the tags of a record or the entries of a menu.
- **A few is up to about 7, and some is up to about 30.** The numbers are there so that two people who read the same set reach the same block. Both numbers are proposed, and not yet confirmed (`RD.SUPPORT.SURFACE.052`).
- **The search and the filters of a data table MUST be sent to the server** (`RD.SUPPORT.SURFACE.070`). The page holds one page of the records. A search in the page would search only that.

### Step 3: the smaller screens

The screen classes are `DESKTOP`, `TABLET` and `MOBILE` (`standards-core.md`). A page holds at each of them, and what changes between two classes is the arrangement.

| At a desktop | At a tablet | On a phone |
| --- | --- | --- |
| `DSDataTable`, layout `TABLE` | the same, with fewer columns | the same data table, layout `LIST`, with the filters behind one action |
| `DSDataTable`, layout `GRID` | the same, with fewer across | layout `LIST` |
| a table, `DSTable` | the same | a list, one group at a time |
| two parts side by side: the groups, and the items of the chosen one | the items take the place of the groups, with a back action | the same as a tablet |
| a dialog | the same | a sheet from the bottom of the screen |
| a sheet at the side | the same | the full screen |

### Step 4: how a thing is entered or changed

Where a person comes mostly to read, and a change has weight, the page shows the values and a change is asked for. Nothing then changes by a stray key, and a person who may only read sees the same page. How much there is to enter decides where the entry opens.

| The entry | At a desktop | On a phone | App pattern |
| --- | --- | --- | --- |
| small: up to about 5 fields in one group | a dialog over the page | a sheet from the bottom of the screen | An entry over the page |
| medium: one column with a few groups, up to about 12 fields | a sheet at the side, with the page still in view | the full screen | An entry over the page |
| large: sections, steps, or records of its own inside it | a page | a page | An entry that is a page |
| one value among many of one kind | in its row | in its line | Change in place, in a list |
| a thing that is only on or off | in place, as a switch | the same | the pattern of the page it stands on |

The two numbers of a small and a medium entry are proposed (`RD.SUPPORT.SURFACE.075`, stated in `architecture-containers.md`).

### What holds for every row of a list

- **A press on a row opens the record**, where the record has a page or a look. A person then needs no second target to aim at.
- **A row ends with its actions** (`RD.SUPPORT.SURFACE.071`). `DSDataTable` shows them as icons, `ICONS`, or behind one action. One action stands on the row itself, and two or more go behind one action, so a row keeps its width for its facts.
- **A state that is normal shows no badge** (`RD.SUPPORT.SURFACE.058`). A badge on every row says nothing, and the row that differs is then hard to find.
- **A group shows a count of its items only where the server gives it with the groups.**

#### Rows that are switched off

Some records are switched off and on again, such as an organization's directories, its integrations and its message templates. A switched-off record stays in its own list, so a person who comes to switch it back on finds it where the others are, with the same look, on every screen (`RD.SUPPORT.SURFACE.363`).

- **A record that is switched off MUST carry a badge, *Inactive*, wherever its row stands.** It is a state that is not normal, so a person reads it from the row and never from where the row was put.
- **In a data table, the switched-off rows MUST be found by the filter.** The state filter stands on *Active*, as Find in a list keeps the filter people use most switched on, and nothing is folded.
- **In a set shown whole, a list in a panel, a part or a card, the switched-off rows MUST stand at the end of their own list, folded under one row that counts them.** The active rows stand first. The last row says how many, such as *2 inactive*, and opens the switched-off rows in place under it, each with its badge: a `DSCollapsible` in the `DSList`, and a `DSBadge` on each row. It is the fold of Disclose. The count always shows, so nothing is hidden without a word. Where every row is switched off, nothing is folded.
- **A list MUST NOT hold its rows in a popover.** A popover holds an addition beside the block that asked for it, not records a person reads and opens.

The rule adds no unit and no prop. A card that opens its fold grows taller, and its neighbours in the row keep their height.

## The specs a screen starts from — 🔮

**This plugin carries one or more specs for each app pattern, in `refs/support/surface/app-patterns/`.** A spec is a skeleton: a file that shows where the parts of a page sit, and nothing about how they look. The folder holds 22 specs. 21 are for the fourteen app patterns, and one is for a rule of content. Its `README.md` lists them. The specs of the site patterns are a second folder beside it, `refs/support/surface/site-patterns/`, which `site-patterns.md` names. A flow is drawn as the skeletons of its pages, each started from the spec of the pattern it follows, and a flow file that puts them in order.

- **A page starts from the spec of its pattern.** Copy the spec, and change the sample values to the page's own. Never start a page from an empty file.
- **The values in a spec are samples.** They show what kind of data a part holds: a title and a line under it, a picture, a state, an action at the end. Which unit shows that data on a real page is the choice of step 2.
- **A spec holds a view for each screen class its pattern differs at.** So one file shows the page at a desktop, at a tablet and on a phone.
- **A spec draws every level of its page.** It names its `layout` (the sketch's setting, never part of the pattern), each view's page level as `page`, and the `unit` of each container, widget and card.
- **A spec holds a view for each task state its blocks show** (`RD.DEVEX.WORKSPACE.230`). A block drawn from data has more than one picture: its records, and its empty, failed and denied states. A mock that draws only the records hides the pictures a person meets first on a new account. So a view takes `state`, a value of `DSTaskStateType`, and each state a block shows is a view of its own. A view with no `state` shows the page with its data; a view with a `state` shows the same page in that state, as a whole frame, with only what the state changes drawn differently. The views of one screen class stand together, the one with no `state` first and the others in the order of `DSTaskStateType`. A state the page's blocks do not show is not drawn, and a `state` that is no value of `DSTaskStateType` is a finding.
- **A flow's pages are listed in a flow file, in the order a person meets them, each with where its moves lead** (`RD.DEVEX.WORKSPACE.230`). A skeleton draws one page and no path, so loose skeletons leave a reader to guess which page follows which, and where a refusal sends a person. The file is `<flow>.flow.json`, beside the specs of its pages. `flow` is its name, the name of the flow pattern where it follows one (`flow-patterns.md`). `pages` lists the pages in order, each with `page`, a word the file is unique by, `spec`, the skeleton that draws it, and `moves`. A move names what a person does and where it leads: `on` is the words of the action or the event, `to` is a page of the file or `end` where the flow is done, and `state` is the task state of the view it lands on, where it lands on one.
- **The flow file draws nothing.** Each page is drawn by its own spec, and the file is read against them: a `to` that names no page of the file, a page no move reaches but the first, a `spec` that is not there, and a `state` the page's spec does not draw are each a finding.

  ```json
  { "flow": "Invite a member",
    "pages": [
      { "page": "members", "spec": "members.dg.json",
        "moves": [ { "on": "Invite a member", "to": "invite" } ] },
      { "page": "invite", "spec": "invite.dg.json",
        "moves": [ { "on": "Send invite", "to": "members" },
                   { "on": "Send invite", "to": "invite", "state": "FAILED" },
                   { "on": "Cancel", "to": "members" } ] }
    ] }
  ```
- **A spec is strict JSON.** It holds no comment. Draw one with `spn-devex docs figure draw <spec>`.
- **Never edit a file in that folder.** It is a copy of the book's folder. A spec in the plugin MUST equal the spec of the same name in the book (`RD.SUPPORT.SURFACE.053`).

## Which unit, when — 🔮

A part of a page takes the unit it is for (`RD.SUPPORT.SURFACE.217`, narrowed by `RD.SUPPORT.SURFACE.221`), and a skeleton that names another is refused.

| Unit | Use it for |
| --- | --- |
| `DSPanelContainer` | a part of the page with a header (title, description, actions), whose look follows the theme's panel framing |
| `DSCardWidget` | a card with a head: a title with its mark or icon, and actions in the head, often with titled parts under it |
| `DSCard` | a card that shows its own info: a number with its caption, or a single thing with its words and an action under them; several side by side stay `DSCard`s, even when they come from data |
| Content part | one section of a panel's content, a `DSPanelContainer.Content`: one or more in a panel, a line between every two, each with its own title and actions, no dotted boundary |
| Group | a titled cluster inside a panel, a card or a content part, with a dotted boundary; a level, not a unit |
| `DSItem` | one line about one thing: its media, its title, a line under the title, and what stands at its end |

A panel whose content is only cards lets them stand flush; any other content sits in the panel's one rounded box, which holds every content part and the footer, a line across it between every two parts and above the footer (`RD.DEVEX.WORKSPACE.272`). A panel may separate its sections by lines (parts), by groups, or both: parts by lines, groups inside a part. A side column holds a panel where its parts share one header, and widgets or cards on their own where each stands alone. A frame names its unit and leaves its look to it. A page never holds a loose row of words and an action; that is a `DSCard`.

## Each app pattern, by level — 🔮

The levels are the layout, the page level, the containers, the widgets and cards, and the components (`RD.SUPPORT.SURFACE.202`). Every app pattern fills the content of the app's layout. It names no layout of its own: its spec draws it in the layout of its live page, as the sketch's setting. The page level is the head of the page: `DSPageLevel` at `PAGE` above the containers, or the header of the one container that is the page, with `fullPage`. A card stands at the level of a widget. The units named below are the ones the pattern is drawn with. Which unit shows a part that holds many of one thing is still the choice of step 2. Each section opens with its **For** line (`RD.SUPPORT.SURFACE.332`).

### Find in a list

- **For** Team · Everyday users. For Everyday users, on their own orders or bookings, the `LIST` layout on every screen, with a search box and two or three filters in view.
- **When.** The data grows as people work, and a person comes often, to find one record. The page shows a search, the filter people use most already on, and the records at the full width. A record that has things of its own opens as a page. A record of a few facts and nothing else opens as a look beside the list.
- **Page level.** The header of the panel, with `fullPage`: the title, a line under it and the main action.
- **Container.** One `DSPanelContainer`. Its content is two parts: the filter bar, and the records. Its footer holds the paging: the page gives `DSDataTable` a place in the footer, and the table draws its paging there.
- **Widget.** `DSFilterBar` and `DSDataTable`, in the layout that step 2 chose.
- **Component.** `DSDrawer`, for the look of a small record beside its list.
- **On a tablet and a phone.** A tablet keeps `TABLE` with fewer columns, and its filter bar holds fewer boxes. On a phone the data table is in its `LIST` layout, and the filter bar is one button that says how many filters are on. The look of a small record is a screen of its own on a phone.
- **Specs.** `find-in-a-list.dg.json` · `find-in-a-list-look.dg.json`.

### A record and its setup

- **For** Team · Everyday users. For Everyday users, on their own account, everyday words, each thing on its own panel, and nothing harmful without undo.
- **When.** The data is one record and a few things set up for it. A person comes rarely, to see where things stand. The page shows the record as its header, one part for each thing set up, and an action that can do harm apart from the others, at the end.
- **Page level.** `DSPageLevel` at `PAGE`, holding `DSItem`: the record, its picture, its name, and under the name its facts.
- **Container.** One `DSPanelContainer` for each thing set up: its header, with its title and its actions, then its content.
- **Widget.** None.
- **Card.** `DSCardWidget` for each thing set up that has titled parts; a plain `DSCard` for who owns the record.
- **Component.** `DSSwitch` for a thing that is only on or off. `DSBadge` for a state that is not normal.
- **On a tablet and a phone.** At a desktop the large part is the main column and the short part stands beside it. On a tablet and a phone all of it is one column, in the order a person reads: the header, the main column, then the column that stood beside it.
- **Spec.** `record-and-its-setup.dg.json`.

### A record and what belongs to it

- **For** Team.
- **When.** The data is one record with lists of other records attached. A person comes to attach or remove one, or to read what happened.
- **Layout.** The page level, then the attached lists, side by side where the page is wide.
- **Page level.** `DSPageLevel` at `PAGE`, holding `DSItem`: the way back, the record's picture, its name, and under the name its state and one more fact.
- **Container.** One `DSPanelContainer` for each attached list. A list a person adds to has a box at its top that finds a record as they type, with Add beside it. A list that is only read has none.
- **Widget.** None.
- **Component.** `DSList` holding `DSItem`: each attached record is a line that ends with the action that removes it. `DSEmpty` for the empty state of a list. No list shows a count.
- **On a tablet and a phone.** Three lists stand side by side at a desktop, two and one on a tablet, and one column on a phone.
- **Spec.** `record-and-what-belongs-to-it.dg.json`.

### Set up by kind

- **For** Team.
- **When.** The data has fixed kinds, with one or a few of each. A person comes rarely, to connect or change one. The page shows every kind always, also a kind that has nothing yet. The kinds in use come first, and the action that adds stands inside the kind.
- **Page level.** `DSPageLevel` at `PAGE`: the title of the page, and a line under it.
- **Container.** One `DSPanelContainer`, holding the kinds.
- **Widget.** `DSDataTable` in its `GRID` layout, where the kinds come from a query that takes a page, a text or a filter. It draws one card for each kind.
- **Card.** `DSCardWidget`, one for each kind, a widget of its own. Its title is the kind, with the icon of that kind before it.
- **Component.** `DSItem` and `DSEmpty`. Under the title of a card stands the provider as an item. A kind with nothing yet says so and offers the action.
- **On a tablet and a phone.** Three cards across at a desktop, two on a tablet, and one on a phone.
- **Spec.** `set-up-by-kind.dg.json`.

### Compare across kinds

- **For** Team.
- **When.** The data is one fixed set of settings for a fixed set of kinds. A person comes rarely, to check or change a default. The page reads first, and has no search and no paging, because the settings are few and fixed.
- **Page level.** The header of the panel, with `fullPage`: the title of the page, and a line under it.
- **Container.** One `DSPanelContainer`, holding the table.
- **Widget.** None.
- **Component.** `DSTable`: a setting in each row and a kind in each column, with an Edit under each kind. `DSDialog` with `DSForm` for the change. On a phone, `DSTabs` and `DSDataUnit`.
- **On a tablet and a phone.** A tablet keeps the table. On a phone a person reads one kind at a time, as labelled values, with the kinds as tabs and Edit in the footer. Tabs fit here because the kinds are a closed set. The entry that changes one kind is a dialog at a desktop, and a sheet from the bottom of the screen on a phone.
- **Specs.** `compare-across-kinds.dg.json` · `compare-across-kinds-edit.dg.json`.

### Choose many

- **For** Team · Everyday users. For Everyday users, on what they are told about, few choices, as switches.
- **When.** The data is many things to tick, and a person ticks several. Where the data says which group each thing belongs to, the page has one part for each group. Where it does not, the things are one list with a search.
- **A heading MUST NOT be made up for choices whose data names no group** (`RD.SUPPORT.SURFACE.055`). A made-up heading puts a choice where a person does not look for it.
- **Layout.** The content, or the content of the entry the choices stand in: one panel, or the parts of the entry's content.
- **Page level.** The header of the panel, with `fullPage`, where the choices are a page; the entry's own header where they stand in an entry.
- **Container.** One `DSPanelContainer`: a part of its content for each group under the title of the group, or one part for the whole list, and its actions in its footer. The choices of every group are saved once, so a group is a part of the content and never a panel of its own.
- **Widget.** None.
- **Component.** `DSForm`, with `DSSwitch` or `DSCheckbox`, and `DSList`. The choices stand in columns.
- **On a tablet and a phone.** On a phone the choices stand one under another.
- **Specs.** `choose-many-in-groups.dg.json` · `choose-many-in-one-list.dg.json`.

### An editor with its preview

- **For** Team.
- **When.** The data is content a person writes and what that content becomes. The person must see the result while writing.
- **An editor with its preview MUST be one panel, and each thing a person writes MUST stand beside its own result** (`RD.SUPPORT.SURFACE.115`). The page is an entry that is a page. Its content has a part for the details that have no preview, and then one part for each thing a person writes, under the title of that thing.
- **Where the content has several forms, a row of tabs MUST choose the form.** The tabs stand at the top of the content, and every part under them belongs to the chosen form. Where the record is saved whole, one save holds every form.
- **Layout.** One panel.
- **Page level.** The header of the panel, with `fullPage`: the way back, before the title.
- **Container.** One `DSPanelContainer`: the tabs, the details and one part for each thing written as the parts of its content, each part under its own title; its actions at the start of its footer, which takes `sticky` so that it stays in view.
- **Widget.** None.
- **Component.** `DSTabs` for the forms of the content, such as its channels. `DSForm` for the fields of the details. `DSTextarea` for the editor of each thing written, and the rendered result beside it.
- **On a tablet and a phone.** At a desktop the editor of each part and its result stand side by side. On a tablet and a phone a person sees one of the two at a time, the writing or the result. A second row of tabs moves between them, and the choice holds for every part of the content at once.
- **Spec.** `editor-with-preview.dg.json`.

### An entry over the page

- **For** Team · Everyday users. For Everyday users, small entries only; a medium one becomes an entry that is a page, in steps.
- **When.** The data is a small or a medium form, and the page it belongs to stays beneath or beside it. Step 4 says which is small and which is medium.
- **Layout.** The content of the page the entry belongs to. It stays in view beneath a dialog, or beside a sheet.
- **Page level.** The page level of the page the entry belongs to. The entry takes none of its own: its title stands in the header of its panel.
- **Container.** One `DSPanelContainer` inside the overlay. Its title and the action that closes it stand in its header. Its fields are its content. Its actions stand in its footer.
- **Widget.** None.
- **Component.** `DSDialog` for a small form. `DSSheet` for a medium one. `DSDrawer` for a look at one record. `DSForm` for the fields.
- **On a tablet and a phone.** A tablet keeps the sheet beside its page. On a phone a medium entry takes the full screen, and a small one, a dialog, becomes a sheet from the bottom of the screen.
- **On the web** the entry is an address: see *On the web: the address of a screen* below.
- **Spec.** `entry-over-the-page.dg.json`. It draws a medium entry. A dialog over its page has no figure, because a skeleton lays no frame over another.

### Inherit or override

- **For** Team.
- **When.** The data is a value that follows a default until someone sets their own. The person must see which of the two it is, and be able to go back.
- **Layout.** The page level, then one panel for each part.
- **Page level.** `DSPageLevel` at `PAGE`: the title of what the values belong to, with the way back before it.
- **Container.** One `DSPanelContainer` for each part. The line under its title says whether the part follows the default or holds its own values. Its header or its footer holds the one action that changes that.
- **Widget.** None.
- **Component.** `DSDataUnit` for the values that are read. `DSButton` for the action to set its own, or to go back.
- **Following the default is the normal state, so it shows no badge.**
- **On a tablet and a phone.** The values a person reads stand three across at a desktop and a tablet, and one under another on a phone. Two parts stand side by side at a desktop, and one under another on a tablet and a phone.
- **Spec.** `inherit-or-override.dg.json`.

### Groups and their items

- **For** Team · Learner. For a Learner, the groups of a doc or a showcase.
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
| a closed set, few, and all the items fit on about two screens | one page, a panel for each group, all open |
| a closed set, few, each one long | a tab for each group |
| can be added to, by a module, a partner or a person; or many | the groups as a list at the left, the items of the chosen group at the right |
| any, where the items of a group grow without limit | the same, with a data table at the right, which is then Find in a list |

- **A set of groups that can be added to MUST be a list, and never a row of tabs** (`RD.SUPPORT.SURFACE.080`). A row of tabs has the width of the page and no more.
- **Both parts MUST be in view at a desktop only** (`RD.SUPPORT.SURFACE.079`). On a tablet and on a phone the items of the chosen group take the place of the groups, with a back action. On the web the swap also changes the address: see *On the web: the address of a screen* below.
- **Many groups a person searches MUST be the `LIST` layout of `DSDataTable`, and never its `TABLE` layout** (`RD.SUPPORT.SURFACE.069`). The part is narrow, and a person picks one group by its name.
- **Ask whether a group is a thing a person manages.** Where the product fixes the groups, a group is a heading. Where people make them, a group has its own actions.
- **Page level.** `DSPageLevel` at `PAGE`: the title of the page, and a line under it.
- **Container.** `DSPanelContainer`: one for each group, or two side by side. Where two stand side by side, the chosen group is the title of the panel at the right. The action that adds an item stands in that header.
- **Widget.** `DSDataTable` in its `LIST` layout, where the groups are many.
- **Component.** `DSList` holding `DSItem`, for the groups as lines, with a band behind the chosen one. `DSTable`, where the items are a table. `DSBadge` for a state that is not normal.
- **On a tablet and a phone.** A closed set stays one page, one panel under another. In the three other specs a tablet and a phone show one part at a time.
- **Specs.** `groups-and-their-items.dg.json` for a closed set. `groups-and-their-items-two-lists.dg.json` for a list beside a list. `groups-and-their-items-open.dg.json` for a set that can be added to. `groups-and-their-items-many.dg.json` for many groups. `one-action.dg.json` for the page of one item.

### An overview

- **For** Team · Everyday users. For Everyday users, a greeting, what waits for them as one card, and the next step, with no row of counts.
- **When.** The data is counts and what waits for a person, and the person has just arrived. The page shows how much there is, then what needs them, then the places they often go to.
- **Before anything is counted.** A new place holds nothing yet, and a row of zeros tells a person nothing about what to do. **While the place holds nothing, an overview MUST say what it shows before anything is counted** (`RD.SUPPORT.SURFACE.365`): the welcome, once, and one card that names the first step with its action, in place of the row of numbers. The numbers appear once there is something to count.
- **Each number MUST load and fail by itself, with Try again** (`RD.SUPPORT.SURFACE.365`). A number the person may not see is not drawn. First run, in `flow-patterns.md`, is the flow that starts here.
- **Layout.** The page level, a row of numbers, then the panels.
- **Page level.** `DSPageLevel` at `PAGE`: the title of the page.
- **Container.** `DSPanelContainer`: what waits for the person, and the places they often go to.
- **Widget.** None.
- **Card.** `DSCard` for each number, a card of its own, however many stand side by side.
- **Component.** `DSDataUnit` for the number in its card. `DSList` for each thing that waits, as a line that ends with its action.
- **On a tablet and a phone.** The numbers stand four across at a desktop, and two across on a tablet and a phone. The two panels stand side by side at a desktop, and one under another on a tablet and a phone.
- **Spec.** `overview.dg.json`.

### A record and its steps

- **For** Team · Everyday users. For Everyday users, the steps are read and never moved, and the only action is their own, such as cancel.
- **When.** The data is one record that moves through known steps. A person with the right role moves it on. The page shows the step the record is at, and only the actions that are open at that step.
- **Layout.** The page level, the steps, then the panels.
- **Page level.** `DSPageLevel` at `PAGE`, holding `DSItem`: the way back, the record's picture, its name, and on the line under the name its state and its facts. Its end holds only the actions open at this step.
- **Container.** `DSPanelContainer`: the steps, and one panel for each group of checks of the record.
- **Widget.** None.
- **Component.** `DSDataUnit` for each check. `DSBadge` only on the value that is not normal. `DSButton` for the actions open at this step.
- **The steps are four plain words in the spec**, with the step the record is at as the heavy one. The design system has no unit for a strip of steps today.
- **On a tablet and a phone.** The checks stand two across where two parts share the width at a desktop, three across on a tablet, and one under another on a phone. On a phone the steps stand one under another, and the page level folds its actions into one *more* icon when they do not fit beside the way back, the picture and the title, whatever their number.
- **Spec.** `record-and-its-steps.dg.json`.

### An entry that is a page

- **For** Team · Everyday users. For Everyday users, one group of fields a screen, with `DSStepper` to show where they stand, a way back to each group, and the place saved.
- **When.** The data is a large form, with sections or a part that repeats. A person fills it in one sitting.
- **Layout.** One panel.
- **Page level.** The header of the panel, with `fullPage`: the way back, before the title.
- **Container.** One `DSPanelContainer`. Its sections are the parts of its content, each with its own title. Its actions stand in its footer, which takes `sticky` so that it stays in view.
- **Widget.** None.
- **Component.** `DSForm` for the fields, each with its title above its control.
- **The sections are parts of one form that is saved once.** So they are not panels of their own, and no list of the sections stands beside the form.
- **On a tablet and a phone.** Fields that are short and belong together share a row at a desktop. On a phone each field takes a row.
- **Spec.** `entry-as-a-page.dg.json`.

### Change in place, in a list

- **For** Team.
- **When.** The data is many small values of one kind, and a person changes one after another. The page is a data table whose rows are read. The action of a row turns its value from words into a box, and the action that saves it stands beside the box. The page holds no form, and nothing opens over it.
- **Page level.** The header of the panel, with `fullPage`: the title, and a line under it.
- **Container.** One `DSPanelContainer`: the filter bar and the rows in its content, and the paging in its footer.
- **Widget.** `DSDataTable` and `DSFilterBar`.
- **Component.** `DSInput`, the box in the one cell that is being changed, as wide as the cell.
- **On a tablet and a phone.** On a phone the table is in its `LIST` layout. A row that is read is a line. The row that is being changed is its text with its box under it, and the same two actions beside the box.
- **Spec.** `change-in-place.dg.json`.

## How many panels a page uses — 🔮

A panel frames one thing that a person reads as a whole or saves as a whole. That one fact decides how many panels a page has, in every pattern.

- **A page MUST use one panel for each thing a person reads or saves as a whole** (`RD.SUPPORT.SURFACE.116`). The sections of that one thing are the parts of its content, each under its own title.
- **A section of one thing MUST NOT be a panel of its own.** A frame around a section says that the section is read or saved by itself.
- **Two things that are read or saved apart MUST be two panels, each with its own title.** A person then sees where one thing ends and the next begins, and which actions belong to which.

| The page | Its panels |
| --- | --- |
| an entry that is saved once | one panel. Its sections are the parts of its content, and its actions stand in its footer |
| the page of a record | the head of the record outside any frame, then one panel for each thing that belongs to the record, such as its content and the list of its versions |
| a listing | one panel, with the filter bar and the records as the parts of its content |

The reason is the theme. The parts of a panel are the places the look of the app reaches. So a page that draws no frame, no line and no padding of its own takes the theme of a partner with no change.

- **The page that reads a record and the page that changes it MUST hold the same parts in the same order** (`RD.SUPPORT.SURFACE.117`). On the page that changes the record, a reading becomes a field, a block of source becomes an editor, and the footer with the actions is added. Nothing else moves. The rule holds for the panel of the thing that is changed: the page that reads a record may hold more panels, such as the list of its versions.

## The listing pages — 🔮

A listing page is a page whose whole content is the records of one kind. It follows Find in a list. `DSDataTable` has three layouts, and a listing page is that one widget in one of the three. It keeps its search, its filters and its paging in each.

| One record holds | At a desktop | At a tablet | On a phone |
| --- | --- | --- | --- |
| several facts a person compares across rows | `TABLE` | `TABLE`, with fewer columns where the record has many | `LIST` |
| a thing of its own: a kind to set up, an app, a file with a preview | `GRID` | `GRID`, two across | `LIST` |
| a title and a line under it | `LIST` | `LIST` | `LIST` |

- **A listing page whose query takes a page, a text or a filter MUST stay a data table, also where its set is small today** (`RD.SUPPORT.SURFACE.054`). Its search and its paging are sent to the server. A plain table or a list would do neither.
- **A list of groups and the list of their items are one page.** The two follow Groups and their items, and neither is a listing page of its own.

## The sign-in page — 🔮

**For** Team · Everyday users · Visitor. For Everyday users, the providers and a code by email lead; for a Team, company sign-on stands as an equal; for a Visitor, the sign-up page beside it, with one ask and no account before value.

A sign-in is not one of the fourteen patterns: it is the page a person passes before any of them, and every app has one, so its shape is stated once (`RD.SUPPORT.SURFACE.205`).

| Level | The sign-in |
| --- | --- |
| Layout | `CANVAS`, the body alone, with the panel centred in the window, across and down, in a column as wide as a form reads well. A legal line, where the app has one, is the layout's `footerNode` |
| Page level | none apart from the panel: its header holds an item with the step's title, such as *Sign in to Nimbus*, and its line |
| Container | one `DSPanelContainer` at `SM`, in the theme's look, with `divided` set to `CONTENT`: the first content signs in, and a second content, set apart by its line, holds the other task, *New to Nimbus? Create an account* |
| Components | in the first content, in this order: the brand as an item at the level `CONTAINER` with its mark; the providers as one centred row of icon buttons of one size, each named by its tooltip; a `DSSeparator` with the label *or*; the fields; the main action across the content; a `DSSeparator` with the label *Other ways to sign in*; and the other ways, such as a passkey, a code by email and single sign-on, as one row of equal outline buttons |

- **A sign-in is one compact panel, so the whole of it is seen without a scroll.** Each group stands one step of the scale from the next, and the fields stand one under another, their message lines the space between them.
- **Every control is a `DSForm.Field`.** A choice between two ways to say who you are, such as an email or a phone, is a `DSToggleGroup` above the one field it switches. The action of a field, such as *Forgot password?*, stands at the end of its label line as `labelEndNode`. A checkbox alone on its line, such as *Remember me*, is a field with `showBlankLabel={false}`.
- **The providers are icons alone, one row, centred, each its own size with one gap between them**, and never a column of wide buttons.
- **An alternative stands as an equal of the others, and opens its own step in place.** A one-time code or single sign-on changes the header's title and the content's fields, with a way back to the password, and the page does not move.

### The pages beside a sign-in

A person meets other pages beside the sign-in: the page that creates an account, the reset of a password, an invitation, and the return from a provider or a company. They belong to the same door, so they take its shape.

- **A page beside a sign-in MUST take the sign-in's panel** (`RD.SUPPORT.SURFACE.364`). It is the same `CANVAS`, the same one `DSPanelContainer` at `SM` and the same header, with its own step's title in it. Its steps change in place, as an alternative of the sign-in does, and each step after the first has its own way back to the one before.
- **The sign-up page's second content MUST offer the sign-in** (`RD.SUPPORT.SURFACE.364`): *Already have an account? Sign in*, on every step. The sign-in offers the sign-up in turn, as every flow asks (`flow-patterns.md`).

| The page | Its steps, in the sign-in's panel | The flow it belongs to |
| --- | --- | --- |
| the sign-up page | the person's details, a code that proves the address, and where the address already holds a place, make another or sign in; after a provider's own pages, *Finish setting up* | Sign up |
| the reset of a password | who you are, how to reach you, then the code and the new password; from the emailed link, the new password | Get back in |
| an invitation | who invited the person and to what, then their name and a password, or their sign-in | Accept an invitation |
| a return from a provider or a company | a wait; on a failure, the panel's alert and the way back to the same site's sign-in | Sign in |

## What every spec shows the same way — 🔮

Every spec draws a part of a page the same way, whichever pattern it belongs to. The rule behind each row is stated once, in the ref the last column names.

| Part of a page | How every spec shows it | The rule is stated in |
| --- | --- | --- |
| the record a page is about | the page level, the head of the page: its picture, its name, and its facts on the line under the name. It has no frame | `standards-core.md` |
| a state a person looks for | a badge on the line of facts, before the other facts, or at the end of the line. The normal state shows none. The end of a line holds its actions, a badge, or both | `standards-core.md` |
| a line of a list | an item line, `DSItem`, with a line between each two | `architecture-components.md` |
| a field a person enters, and a field a person reads | `DSForm.Field`, and `DSDataUnit`, each with its title above | `architecture-components.md` |
| a value from an enum | a badge beside other facts, a title where it is the subject of a part, and plain text where it stands alone in a labelled field. `a-value-from-an-enum.dg.json` draws each way | `architecture-components.md` |
| a filter bar, a value changed in a list, and many groups a person searches | `DSFilterBar` in its one form, and `DSDataTable` | `architecture-widgets.md` |
| a panel, several parts of one content, and a large form | the title and the actions above the outline, and what closes the work in the footer | `architecture-containers.md` |

## On the web: the address of a screen — 🔮

A browser gives every screen an address. A person goes back with the browser's Back, reloads, and sends a link, and each of them lands by the address alone. These lines are the web's alone; how an address is built and what it names is the web module's, and the stack's build steps state it.

- **Groups and their items: the swap MUST change the address**, although it happens in place. The browser's Back then does the same as the back action, a reload stays on the chosen group, and a link to one group opens it on any screen.
- **An entry over the page MUST be an address, although it opens in place** (`RD.SUPPORT.SURFACE.366`). The browser's Back then closes the entry and never leaves the page under it, a reload opens it again, and a link opens it over its page. What was typed is lost on a reload.
- **A confirmation, and proving it is you again, are not addresses.** Each interrupts a task, as Interrupt states, so a reload drops it, and the act is tried again.

The flow patterns take these rules as they are, in each flow that opens an entry (`flow-patterns.md`).

## What is not settled or checked yet

- **No check reads a page for its pattern.** A review names the pattern and reads the page beside its spec.
- **Whether one data table changes its layout by screen class is not checked against a stack.** The book takes it that it does; what each stack builds is its provider's to say.
- **A skeleton lays no frame over another.** So a dialog over its page has no figure, and a sheet is drawn beside its page.
- **A unit does not yet do everything a pattern asks of it.** No unit draws a strip of steps in an app pattern's spec, and a value that is not text is not changed in a cell. `architecture-widgets.md` says plainly what a unit does not do, under *Not there yet*.

## Boundary

This ref states the four groups of the surface patterns, which task pattern covers a given task and what blocks carry it, and which arrangement a whole screen of an app takes and in what order that is decided. It stops at naming the blocks. The shape of a site's section is `site-patterns.md`, and a path across pages is `flow-patterns.md`. It does not state what the six parts are or what a task state is — that is `standards-interaction.md`, used by every pattern here without restating it. It does not state who an app is for, or what a label, a badge, a count or a field owes a person on any page — those are `standards-core.md`. It does not state what the layouts of the data table are, what an item line holds, or how an entry and a large form are framed — those are `architecture-widgets.md`, `architecture-components.md` and `architecture-containers.md`. It does not state what a block, a prop or a token is named — that is `architecture-names.md` and the refs after it.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.158` | every overlay that covers a page dims it with one scrim |
| `RD.SUPPORT.SURFACE.093` | a sheet that is not modal stands beside the page and draws no scrim |
| `RD.SUPPORT.APPS.159` | an alert and a toast draw one picture |
| `RD.SUPPORT.SURFACE.046` | the surface patterns in groups by scope, smallest first: task, app, site and flow patterns |
| `RD.SUPPORT.SURFACE.047` | how a thing is shown follows from the data and from the person who uses it |
| `RD.SUPPORT.SURFACE.048` | an app pattern is built from blocks that exist, and is never a block of its own |
| `RD.SUPPORT.SURFACE.049` | an app pattern fixes the arrangement, and never which block fills a part |
| `RD.SUPPORT.SURFACE.050` | no app pattern depends on a count |
| `RD.SUPPORT.SURFACE.051` | the app patterns as one named set, chosen and never invented, and a page no pattern fits derived from the patterns that fit it. The names are proposed |
| `RD.SUPPORT.SURFACE.052` | a page is decided in four steps, with a block as the last thing chosen. The two numbers of step 2 are proposed |
| `RD.SUPPORT.SURFACE.053` | a spec in the plugin equals the spec of the same name in the book |
| `RD.SUPPORT.SURFACE.054` | a listing page whose query takes a page, a text or a filter stays a data table |
| `RD.SUPPORT.SURFACE.055` | no heading is made up for choices whose data names no group |
| `RD.SUPPORT.SURFACE.115` | an editor with its preview is one panel, and each thing a person writes stands beside its own result |
| `RD.SUPPORT.SURFACE.116` | a page uses one panel for each thing a person reads or saves as a whole, and a section of one thing is never a panel of its own |
| `RD.SUPPORT.SURFACE.117` | the page that reads a record and the page that changes it hold the same parts in the same order |
| `RD.SUPPORT.SURFACE.202` | an app pattern states its units by level, its page level and its cards among them, and names no layout of its own |
| `RD.SUPPORT.SURFACE.205` | a sign-in is one compact panel on a canvas, its providers one row of icons and every control a form field |
| `RD.SUPPORT.SURFACE.217` | a part of a page takes the unit it is for, a panel, a card widget, a card or an item, and a skeleton naming another is refused |
| `RD.SUPPORT.SURFACE.332` | every pattern names the kinds of person it serves, with one line where it runs differently for one, and a page no pattern fits is derived and never waits |
| `RD.SUPPORT.SURFACE.333` | where two patterns fit a page's data, the kind of person decides between them |
| `RD.SUPPORT.SURFACE.363` | switched-off rows stay in their own list, each with the badge *Inactive* |
| `RD.SUPPORT.SURFACE.364` | the pages beside a sign-in take the sign-in's panel |
| `RD.SUPPORT.SURFACE.365` | an overview says what it shows before anything is counted |
| `RD.SUPPORT.SURFACE.366` | on the web an entry over the page is an address |
| `RD.SUPPORT.SURFACE.221` | a card that shows its own info is a `DSCard`, and a `DSCardWidget` is a card with a head |
| `RD.SUPPORT.SURFACE.371` | a hero's state is a `PRIMARY` badge eyebrow, and its stack is `OUTLINE` `DEFAULT` badge facts, as `site-patterns.md` states |
| `RD.SUPPORT.SURFACE.372` | a grid cell's eyebrow is its group or kind as text, and a badge only when it says a state |
| `RD.SUPPORT.SURFACE.373` | a plan holds one eyebrow |
| `RD.DEVEX.WORKSPACE.230` | a skeleton holds a view for each task state its blocks show, and a flow file orders a flow's pages with where each move leads |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
