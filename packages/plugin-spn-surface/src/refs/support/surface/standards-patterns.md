<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-surface/04-standards-patterns.md",
      "seen": "47844d21"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/04-standards-patterns/",
      "seen": "14201d2d"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/01-common/03-app-page-kinds.md",
      "seen": "85fe6878"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/02-web/01-app-page-kinds.md",
      "seen": "c7b021b4"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/07-figures.md",
      "section": "`SKELETON` — a mock of a layout",
      "seen": "5dbe783b"
    }
  ]
}
-->

# Surface Patterns — Tasks, App Page Kinds and Flows

Source of truth: the foundation's Patterns construct (`docs/02-constructs/02-support/01-surface/04-standards-patterns.md`) and its capability chapters (`docs/04-capabilities/02-support/01-surface/04-standards-patterns/`), which hold the task patterns and the flow patterns; and the Surface Catalogue's app page kinds (`docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/01-common/03-app-page-kinds.md`, with the web's part in `02-web/01-app-page-kinds.md`), which hold what were the app page kinds, each in a common folder with what only a browser has in a web folder, and the two folders of specs that this plugin carries a copy of.

This ref restates the two groups of patterns, the task patterns, and the rules that choose among the app page kinds of the Surface Catalogue; the kinds themselves are read with `spn-surface catalogue show`. The rules of the site page and container kinds and the flow patterns have refs of their own beside this one, `site-patterns.md` and `flow-patterns.md`.

Patterns is the fourth of sixteen Surface constructs. It fills in the six parts of a pattern (the previous standard of this folder) once for each task intent a person has in an app today, and it holds the flow patterns, for a path across pages to one outcome. The page kinds, the arrangements for a whole screen of an app and for a page of a site, and the sections of a site's page, are the Surface Catalogue's: this ref restates the app page kinds, and `site-patterns.md` the container kinds of a site.

Read this to build a page from patterns a person already knows, or to review a page by naming the pattern it should have used. A page invents no pattern of its own for an intent this ref already holds. Most "new" tasks are one of the intents below under another name: *search* is Find, *edit* is Enter, *delete* is Act. The same holds for a whole screen. Most screens are one of the app page kinds below, and the data and the person say which one.

## Terms

`Task intent` and `Pattern` belong to `standards-interaction.md`; this ref uses them as that ref states them. A task pattern is that same Pattern, with the longer name so that a reader can tell it from an app page kind.

| Term | What it means |
| --- | --- |
| Intent | the one verb a pattern's section is named for, such as Move or Act |
| Task pattern | the pattern for one task intent: one way to run that task, stated in the six parts of `standards-interaction.md` |
| App page kind | the arrangement of a whole screen of an app, chosen by the data the screen holds and by the person who reads it |
| Design language | the set of choices that gives a whole site or app one look, which its pages follow: how sections part, how emphasis shows, how pictures are framed, how much room a section takes |
| Flow pattern | a path across pages to one outcome, built from the page kinds that exist |

## The groups, smallest scope first — 🔮

**The surface patterns fall into two groups by scope, smallest first: task patterns and flow patterns** (`RULE.SUPPORT.SURFACE.046` · MUST · skill:spn-surface/design). A rule is found in the group its scope names.

| Group | Its scope | Where it holds | Restated in |
| --- | --- | --- | --- |
| Task patterns | one task of one intent, from Move to Be refused, on any page | on every surface category | this ref |
| Flow patterns | a path across pages to one outcome, built from the page kinds that exist; it may cross categories, as a sign-up flow runs from a MARKETING page into a PORTAL | on every surface category | `flow-patterns.md` |

A whole page is a page kind, and a section of a site's page is a container kind. The Surface Catalogue holds both: this ref restates the app page kinds, and `site-patterns.md` the container kinds of a site.

Task and flow patterns hold on every surface category. A page kind is chosen by the category, as the book already chooses a layout by an app's job: an app's screens take app page kinds, and a site's pages take site page kinds, with each section of a site's page taking a container kind. A page follows one page kind, and each task on that page follows its task pattern. A listing page follows the app page kind `RECORD_HOME`, and the search inside it runs by the task pattern Find. **These patterns are never customised by a language:** a design language picks, customises or adds kinds, and it leaves the way a task runs and the way a flow goes as they are.

**A rule about how a page is designed and uses a unit is guidance, and it says its reason** (`RULE.SUPPORT.SURFACE.394` · MUST · skill:spn-surface/design). So the rules here read as advice wherever they say which pattern or unit a page picks, where a part stands, which value, variant, colour or size a page writes, how many of a thing a view shows, and the words a page uses. MUST is kept for four things: what the design system and a stack must build, the floor a person is owed whatever the design, the process of the library and the showcase, and true claims. A true claim is a number on a marketing page, read from the real system and never made up. A bold rule below with no MUST is advice, and a partner's choice against it stands.

**Each group is stated in two folders.** `01-common/` holds what every platform follows. `02-web/` holds what a browser alone has: each intent's keys and pointer, hover, and the address an app page kind changes. A rule sits in common only when it holds on every platform; this ref gives the web's lines under their own headings, *On the web*.

## The person, in every pattern — 🔮

**Every pattern, in every group, MUST name the persons it serves, and one line says how it runs differently for one of them** (`RULE.SUPPORT.SURFACE.332` · MUST · skill:spn-surface/design). Each section opens with its **For** line. The kinds are one closed set, Team, Individual, Visitor and Learner, read once for the app before any pattern is chosen, as `standards-core.md` states under *Who an app is for*. Where a section names no difference, the pattern runs as written for every kind it serves.

- **Where two page kinds fit a page's data, the person MUST decide between them** (`RULE.SUPPORT.SURFACE.333` · MUST · skill:spn-surface/design). A Team takes the one that keeps the person in place and fast, an Individual the one that asks one thing at a time. `standards-core.md` gives the table of what each kind changes.
- **A person changes only what an app already sets, and the lines its page kinds carry** (`RULE.SUPPORT.SURFACE.334` · MUST · skill:spn-surface/design). It never brings a second version of a page, or a unit of its own.

## The task patterns, by intent — 🔮

| Task intent | The pattern covers | Blocks that carry it | For |
| --- | --- | --- | --- |
| Move | going to another place, and knowing where you are | the layout · `DSNavList` · `DSNavMenu` · `DSNavBarSide` · `DSNavBarTop` · `DSTabs` · `DSBreadcrumb` · `DSLink` | Team · Individual · Visitor · Learner. For an Individual, the few places that fit one bar, never a tree of sections; for a Visitor, a site's bar and its doors |
| Find | search, filter, sort, and paging through records | `DSFilterBar` · `DSDataTable` · `DSCommandPalette` · `DSPagination` | Team · Individual · Learner. For an Individual, one search box first and a few filters in view; for a Learner, a search over the docs |
| Read | records as a table, a list or a grid, one record in detail, subjects compared across the same settings, and nothing to show | `DSTable` · `DSList` · `DSDataFieldView` · `DSComparison` · `DSEmpty` · `DSSkeleton` | Team · Individual · Visitor · Learner. For an Individual, item lines before a table; for a Team, a table that compares |
| Enter | filling a field, the check on it, and sending a form | `DSForm` and the entry fields | Team · Individual · Visitor. For an Individual, one group of fields at a time, every format accepted, and nothing lost; for a Visitor, the fewest fields |
| Choose | picking one or many from a set | `DSSelect` · `DSRadioGroup` · `DSCheckboxGroup` · `DSToggleGroup` and the pickers | Team · Individual. For an Individual, a few options shown whole, and never a picker to search under about 7 |
| Act | one main action, an action on many records, and an action that destroys something | `DSButton` · `DSDropdownMenu` · `DSConfirmPopover` · `DSConfirmDialog` | Team · Individual. For a Team, actions on many records; for Individual, one action at a time, with undo before confirm |
| Interrupt | a task that takes over the page for a moment | `DSDialog` · `DSDrawer` · `DSSheet` | Team · Individual. For an Individual on a phone, a sheet from the bottom or the full screen |
| Disclose | showing more in place, without leaving | `DSAccordion` · `DSCollapsible` · `DSPopover` · `DSTooltip` · `DSHoverCard` | Team · Individual · Visitor · Learner. For a Visitor and a Learner, the accordion of a site's Questions |
| Hear back | what the surface says while it works, when it is done, and when it fails | `DSSpinner` · `DSProgress` · `DSToast` · `DSAlert` | Team · Individual · Visitor · Learner. For an Individual, a failure in everyday words, with what to do next |
| Be refused | a block hidden or disabled because the person has no permission | `DSAuthz` and the gate props | Team · Individual. For an Individual, the refusal says who to ask, in everyday words |

A page usually serves several intents, and one is still the main one (`standards-core.md`'s one purpose). Each intent's section states its own six parts in full in the capability chapter; a few load-bearing details: an empty result is not a failed search — the two pictures stay apart. A field that is not accepted is a control state (error) on the field, where a send that does not work is a task state (failed) on the form. Every overlay that covers a page dims it with one scrim, so a dialog, a confirm dialog, a drawer and a sheet all read the same way: the page behind waits. **A sheet that is not modal covers no page, so it MUST draw no scrim** (`RULE.SUPPORT.SURFACE.093` · MUST · skill:spn-surface/design). It stands beside the page, and the page stays usable. It is no interruption, because the page does not wait. A page uses it where a person works in the sheet and in the page by turns, such as a panel of settings whose result shows on the page. A popover covers no page either, so `DSConfirmPopover` draws no scrim. An alert and a toast draw one picture; the toast is the alert that appears for a while and leaves. A refusal on the surface is presentation only — hiding or disabling protects nothing, and the refusal itself is the server's.

Each section states its input for each platform. On native it says what touch does: a tap, and for Read a scroll by touch. A hidden or disabled block takes no input.

An action that needs a confirmation first asks the person for it. A confirmation has two blocks, and what the act does decides which one a page uses.

| The act | Its confirmation | Why |
| --- | --- | --- |
| A person can undo it, such as activate, deactivate or remove from a list | a popover, `DSConfirmPopover`, which opens from the control that was pressed | the page stays in view and the person keeps their place. A wrong answer costs little, because the act can be undone |
| It cannot be undone, such as delete | a dialog, `DSConfirmDialog`, over the page | the dialog covers the page, so the person stops and reads the question before something is lost |

- **A confirmation fits as a popover for an act a person can undo, and as a dialog for an act that cannot be undone.** A dialog for every small act teaches a person to confirm without reading. Then the dialog no longer stops them on the one act that matters.
- **Both blocks stay open while the act runs.** A failure is then shown where the person confirmed, and the act is never sent twice.
- **A list's search, filters, sort and chosen view stand in the page's address**, so a copied link opens the same list and the back button returns to it. A filter in force shows as a chip under the bar, each with Clear, and one Clear all ends them together. Seen on GitHub's and Linear's lists and Shopify's resource index.
- **A page of values is saved together, with one Save.** A save bar shows once a value changes, with Save and Discard, and Save stays enabled so a press always answers. A switch that acts on its own saves in place and needs no bar. Seen in Primer's saving pattern and Shopify's settings template.
- **A form shows each default as its real value, marked Default, and never as a faded placeholder** (`RULE.SUPPORT.SURFACE.405` · MUST · skill:spn-surface/design). A faded placeholder reads as an empty field, so a person cannot tell a value the form will save from a hint.

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

A page invents no pattern of its own for an intent the list already holds.

## A page no page kind fits — 🔮

Adding an intent checks that a new task is not an old one under another name. A page shape is checked the same way. **A page shape earns a page kind of its own only when no existing page kind fits its person and its data.** Until then, **a page no page kind fits is derived from the page kinds whose person and data fit it, and it never waits for a page kind** (`RULE.SUPPORT.SURFACE.051` · MUST · skill:spn-surface/design) (`RULE.SUPPORT.SURFACE.332` · MUST · skill:spn-surface/design): a board is derived from `RECORD_HOME` with the frame `GROUPS`, and a cart from `RECORD_HOME` with the case `EDIT_IN_PLACE`. Counting the kinds of product that need a shape is not the test, because the book lists no kinds of product; the person and the data can be read for any page.

## The data and the person decide — 🔮

**How a thing is shown follows from the data and from the person who uses it** (`RULE.SUPPORT.SURFACE.047` · MUST · skill:spn-surface/design). A page is not arranged by how another page looks, or by which block is at hand. Two pages that look alike may hold data that grows in different ways. They may also serve people who come for different reasons. The same arrangement would then be right for one page and wrong for the other.

**A page is shaped from how people use it and from the nature of its data, through the UX lens, before it is built** (`RULE.SUPPORT.SURFACE.396` · MUST · skill:spn-surface/design). One thing is one page, a bounded set is cards, and a set that grows is a list with its detail. A page built first and shaped after keeps the shape of its first draft.

**The person is read twice.** The person the app is for is read once, before any page, and it decides between two page kinds that fit the same data. Who comes to this page, how often and to do what is read for each page.

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
- **An app page kind does not depend on a count** (`RULE.SUPPORT.SURFACE.050` · MUST · skill:spn-surface/design). A server does not always return how many items a group holds. A group shows a count only where the server gives it together with the groups. No page asks once for each group to fill a number in.

## A design brought, and a page pointed at — 🔮

**A partner may bring a design of the page, point at a page to follow, bring both, or bring nothing, and each is read into the same design tree** (`RULE.SUPPORT.SURFACE.393` · GUIDE). A design, in whatever form it comes, is the first answer at every step: what fits stands, a state it did not show is added in words against the frame it comes from, and a change the partner's person would feel goes back to the partner, who keeps theirs or takes the standard. A page pointed at is someone else's page, so it is never copied as the tree; it speaks only where the facts and the cases leave a choice, because a page is not arranged by how another page looks. Both are shown before any code.

This is guidance. A case guides the design and no check forces one, so the partner's choice stands wherever they keep it, and a kept choice is written on the tree and, once built, as one comment in the code on the line it keeps. The spn-surface `design` skill runs the mode in full in its step `steps/given-design.md`: how each form is read, the check at steps 1 to 5, the two lists and the stop before code. `guide-bring-a-feature.md` tells a partner the same in plain words.

## The app page kinds — 🔮

**The app page kinds, with the persons each serves, are the catalogue's, and this ref holds no copy of them** (`RULE.SUPPORT.SURFACE.601` · MUST · skill:spn-surface/design): `spn-surface catalogue show DASHBOARD PAGES` and `catalogue show PORTAL PAGES`, and one kind whole with `catalogue show <CATEGORY> PAGES <KIND>`. The rules that choose among them follow.

- **The app page kinds are one closed set** (`RULE.SUPPORT.SURFACE.051` · MUST · skill:spn-surface/design). A page chooses one and invents none, and a page no page kind fits is derived from the patterns that fit it, as *A page no pattern fits* says; both are advice. The name of each pattern is proposed: the developer of SaaS Plane has not confirmed the names one by one.
- **An app page kind MUST be built from units that exist, and it is never a block of its own** (`RULE.SUPPORT.SURFACE.048` · MUST · skill:spn-surface/design). No stack builds anything for an app page kind. A page follows one with the blocks the design system already has.
- **An app page kind fixes the arrangement of a page, and not which block fills a part** (`RULE.SUPPORT.SURFACE.049` · GUIDE). Each part is shown by what its own data asks for: a list, a table, a data table, or a view of one thing. Two parts of one page often hold data of different shapes.

## The choice, in four steps — 🔮

**A page is decided in four steps, in one order, and a block is the last thing chosen** (`RULE.SUPPORT.SURFACE.052` · MUST · skill:spn-surface/design). A choice that starts from a block fits the page to the block. The data and the person are then read too late to change anything.

| Step | What is decided | Decided from |
| --- | --- | --- |
| 1 | the app page kind: the shape of the page | what the page is about, and why a person comes |
| 2 | what shows each part that has many of one thing | what the contract says of the list, and what one of them holds |
| 3 | what changes at a tablet and on a phone | the choice of step 2 |
| 4 | how a thing is entered or changed | how much there is to enter |

### Step 1: the page kind

Read the facts against the table of the app page kinds, and name the one page kind that fits. Where the data and the person point to two different page kinds, say so and ask: the person the app is for decides between two that fit the same data. A list that grows, used by a person who comes once a year, is a different page from the same list used every day.

### Step 2: what shows a part

**The contract decides first** (`RULE.SUPPORT.SURFACE.054` · GUIDE). Where the query takes a page, a text or a filter, the part is the data table, `DSDataTable`, because the server holds more records than the page has loaded.

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

- **A fixed ordered set is a `DSTable` or a `DSList` with `reorder`; a listing of records is `DSDataTable` and never reorders** (`RULE.SUPPORT.SURFACE.182` · GUIDE). The order of a listing is its viewer's sort, and the order of a fixed set is its meaning, such as the tags of a record or the entries of a menu.
- **A few is up to about 7, and some is up to about 30.** The numbers are there so that two people who read the same set reach the same block. Both numbers are proposed, and not yet confirmed (`RULE.SUPPORT.SURFACE.052` · MUST · skill:spn-surface/design).
- **The search and the filters of a data table MUST be sent to the server** (`RULE.SUPPORT.SURFACE.070` · MUST · skill:spn-surface/design). The page holds one page of the records. A search in the page would search only that.

### Step 3: the smaller screens

The screen classes are `DESKTOP`, `TABLET` and `MOBILE` (`standards-core.md`). A page holds at each of them, and what changes between two classes is the arrangement.

| At a desktop | At a tablet | On a phone |
| --- | --- | --- |
| `DSDataTable`, layout `TABLE` | the same, with fewer columns | the same data table, layout `LIST`, with the filters behind one action |
| `DSDataTable`, layout `GRID` | the same, with fewer across | layout `LIST` |
| a table, `DSTable` | the same | a list, one group at a time |
| two parts side by side: the groups, and the items of the chosen one | the items take the place of the groups, with the way back above their title | the same as a tablet |
| a dialog | the same | a sheet from the bottom of the screen |
| a sheet at the side | the same | the full screen |

### Step 4: how a thing is entered or changed

Where a person comes mostly to read, and a change has weight, the page shows the values and a change is asked for. Nothing then changes by a stray key, and a person who may only read sees the same page. How much there is to enter decides where the entry opens.

| The entry | At a desktop | On a phone | App page kind |
| --- | --- | --- | --- |
| small: up to about 5 fields in one group | a dialog over the page | a sheet from the bottom of the screen | `RECORD_ENTRY`, case `DIALOG` |
| medium: one column with a few groups, up to about 12 fields | a sheet at the side, with the page still in view | the full screen | `RECORD_ENTRY`, case `SHEET` |
| large: sections, steps, or records of its own inside it | a page | a page | `RECORD_ENTRY`, case `PAGE` |
| one value among many of one kind | in its row | in its line | `RECORD_HOME`, case `EDIT_IN_PLACE` |
| a thing that is only on or off | in place, as a switch | the same | the pattern of the page it stands on |

The two numbers of a small and a medium entry are proposed (`RULE.SUPPORT.SURFACE.075` · GUIDE), stated in `architecture-containers.md`.

### What holds for every row of a list

- **A press on a row opens the record**, where the record has a page or a look. A person then needs no second target to aim at.
- **A row ends with its actions** (`RULE.SUPPORT.SURFACE.071` · MUST · skill:spn-surface/design). `DSDataTable` shows them as icons, `ICON_UI`, or behind one action. One action stands on the row itself, and two or more go behind one action, so a row keeps its width for its facts.
- **A state that is normal shows no badge** (`RULE.SUPPORT.SURFACE.058` · GUIDE). A badge on every row says nothing, and the row that differs is then hard to find.
- **A group shows a count of its items only where the server gives it with the groups.**

#### Rows that are switched off

Some records are switched off and on again, such as an organization's directories, its integrations and its message templates. A switched-off record stays in its own list, so a person who comes to switch it back on finds it where the others are, with the same look, on every screen (`RULE.SUPPORT.SURFACE.363` · GUIDE).

- **A record that is switched off carries a badge, *Inactive*, wherever its row stands** (`RULE.SUPPORT.SURFACE.363` · GUIDE). It is a state that is not normal, so a person reads it from the row and never from where the row was put.
- **In a data table, the switched-off rows are found by the filter.** The state filter stands on *Active*, as `RECORD_HOME` keeps the filter people use most switched on, and nothing is folded.
- **In a set shown whole, a list in a panel, a part or a card, the switched-off rows stand at the end of their own list, folded under one row that counts them.** The active rows stand first. The last row says how many, such as *2 inactive*, which is the case `FOLD_INACTIVE` of `LISTING_GROUPS`, and opens the switched-off rows in place under it, each with its badge: a `DSCollapsible` in the `DSList`, and a `DSBadge` on each row. It is the fold of Disclose. The count always shows, so nothing is hidden without a word. Where every row is switched off, nothing is folded.
- **A list holds its rows in the page, not in a popover.** A popover holds an addition beside the block that asked for it, not records a person reads and opens.

The rule adds no unit and no prop. A card that opens its fold grows taller, and its neighbours in the row keep their height.

## The specs a screen starts from — 🔮

**This plugin carries one or more specs for each app page kind, in `refs/support/surface/app-patterns/`.** A spec is a skeleton: a file that shows where the parts of a page sit, and nothing about how they look. The folder holds 23 specs: 22 for the app page kinds of a dashboard and a portal, and one for a rule of content. `ANALYTICS_HOME`, `ANALYTICS_REPORT`, the floor pages and `AUTH_FLOW` have no spec yet. Its `README.md` lists them. The specs of the site container kinds are a second folder beside it, `refs/support/surface/site-patterns/`, which `site-patterns.md` names. A flow is drawn as the skeletons of its pages, each started from the spec of the pattern it follows, and a flow file that puts them in order.

- **A page starts from the spec of its page kind.** Copy the spec, and change the sample values to the page's own. Never start a page from an empty file.
- **The values in a spec are samples.** They show what kind of data a part holds: a title and a line under it, a picture, a state, an action at the end. Which unit shows that data on a real page is the choice of step 2.
- **A spec holds a view for each screen class its page kind differs at.** So one file shows the page at a desktop, at a tablet and on a phone.
- **A spec draws every level of its page.** It names its `layout` (the sketch's setting, never part of the page kind), each view's page level as `page`, and the `unit` of each container, widget and card.
- **A mock of a layout is a `SKELETON` figure drawn by its helper, with a flow file ordering the pages and each page drawn once** (`RULE.DEVEX.WORKSPACE.454` · MUST · skill:spn-surface/design). The page is drawn with its data, and the errors a person meets on it are drawn where they appear, such as a form's alert and a field's message. The other task states, working, empty and denied, are the tree's task lines, in words: drawing every state cost many tokens, and the words of a state already carry it. A view takes `state`, a value of `DSTaskStateType`, only for a page that needs a state drawn to be understood. A view with no `state` shows the page with its data and its errors in place; a view with a `state` shows the same page in that state, as a whole frame, with only what the state changes drawn differently. A phone gets a view of its own only where its arrangement differs, such as a table that becomes a list. The views of one screen class stand together, the one with no `state` first and the others in the order of `DSTaskStateType`, and a `state` that is no value of `DSTaskStateType` is a finding.
- **A flow's pages are listed in a flow file, in the order a person meets them, each with where its moves lead** (`RULE.DEVEX.WORKSPACE.230` · MUST · skill:spn-surface/design). A skeleton draws one page and no path, so loose skeletons leave a reader to guess which page follows which, and where a refusal sends a person. The file is `<flow>.flow.json`, beside the specs of its pages. `flow` is its name, the name of the flow pattern where it follows one (`flow-patterns.md`). `pages` lists the pages in order, each with `page`, a word the file is unique by, `spec`, the skeleton that draws it, and `moves`. A move names what a person does and where it leads: `on` is the words of the action or the event, `to` is a page of the file or `end` where the flow is done, and `state` is the task state of the view it lands on, where it lands on one.
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
- **Never edit a file in that folder.** It is a copy of the book's folder. A spec in the plugin MUST equal the spec of the same name in the book (`RULE.SUPPORT.SURFACE.053` · MUST · skill:spn-surface/design).

## Which unit, when — 🔮

A part of a page takes the unit it is for (`RULE.SUPPORT.SURFACE.217` · GUIDE), narrowed by (`RULE.SUPPORT.SURFACE.221` · GUIDE), and a skeleton that names another is refused.

| Unit | Use it for |
| --- | --- |
| `DSPanelContainer` | a part of the page with a header (title, description, actions), whose look follows the theme's panel framing |
| `DSCardWidget` | a card with a head: a title with its mark or icon, and actions in the head, often with titled parts under it |
| `DSCard` | a card that shows its own info: a number with its caption, or a single thing with its words and an action under them; several side by side stay `DSCard`s, even when they come from data |
| Content part | one section of a panel's content, a `DSPanelContainer.Content`: one or more in a panel, a line between every two, each with its own title and actions, no dotted boundary |
| Group | a titled cluster inside a panel, a card or a content part, with a dotted boundary; a level, not a unit |
| `DSItem` | one line about one thing: its media, its title, a line under the title, and what stands at its end |

A panel whose content is only cards lets them stand flush; any other content sits in the panel's one rounded box, which holds every content part and the footer, a line across it between every two parts and above the footer (`RULE.DEVEX.WORKSPACE.272` · GUIDE). A panel may separate its sections by lines (parts), by groups, or both: parts by lines, groups inside a part. A side column holds a panel where its parts share one header, and widgets or cards on their own where each stands alone. A frame names its unit and leaves its look to it. A loose row of words and an action on a page is a `DSCard`.

## Each app page kind, by level — 🔮

Each app page kind's tree by level is its catalogue kind's units and cases: `spn-surface catalogue show <CATEGORY> PAGES <KIND>`. Under each name below stand only the rules that kind carries.

The levels are the layout, the page level, the containers, the widgets and cards, and the components (`RULE.SUPPORT.SURFACE.202` · MUST · skill:spn-surface/design). Every app page kind fills the content of the app's layout. It names no layout of its own: its spec draws it in the layout of its live page, as the sketch's setting. The page level is the head of the page: `DSPageHead` above the containers, or the header of the one container that is the page, with `fullPage`. A card stands at the level of a widget. The units named below are the ones the pattern is drawn with. Which unit shows a part that holds many of one thing is still the choice of step 2. Each section opens with its **For** line (`RULE.SUPPORT.SURFACE.332` · MUST · skill:spn-surface/design).

### `RECORD_HOME`, case `CHOOSE`

- **A heading is not made up for choices whose data names no group** (`RULE.SUPPORT.SURFACE.055` · GUIDE). A made-up heading puts a choice where a person does not look for it.

### `RECORD_ENTRY`, case `WITH_PREVIEW`

- **An entry with a preview is one panel, and each thing a person writes stands beside its own result** (`RULE.SUPPORT.SURFACE.115` · GUIDE). The page is a `RECORD_ENTRY` in the case `PAGE`. Its content has a part for the details that have no preview, and then one part for each thing a person writes, under the title of that thing.

### `RECORD_HOME`, frame `GROUPS`

- **A set of groups that can be added to is a list, and not a row of tabs** (`RULE.SUPPORT.SURFACE.080` · GUIDE). A row of tabs has the width of the page and no more.
- **Both parts are in view at a desktop only** (`RULE.SUPPORT.SURFACE.079` · MUST · skill:spn-surface/design). On a tablet and on a phone the items of the chosen group take the place of the groups, with the way back above their title. Where the items are a list beside a detail, the page is three parts, the groups drawn flat as navigation, and `DSPageFrameGroups` places them, so no more than two containers stand side by side (`RULE.SUPPORT.SURFACE.625` · MUST · skill:spn-surface/design). On the web the swap also changes the address: see *On the web: the address of a screen* below.
- **Many groups a person searches fit the `LIST` layout of `DSDataTable`, and not its `TABLE` layout** (`RULE.SUPPORT.SURFACE.069` · GUIDE). The part is narrow, and a person picks one group by its name.

### `HOME_APP`

- **Before anything is counted.** A new place holds nothing yet, and a row of zeros tells a person nothing about what to do. **While the place holds nothing, the page says what it shows before anything is counted** (`RULE.SUPPORT.SURFACE.365` · GUIDE): the welcome, once, and one card that names the first step with its action, in place of the row of numbers. The numbers appear once there is something to count.
- **Each number loads and fails by itself, with Try again** (`RULE.SUPPORT.SURFACE.365` · GUIDE). A number the person may not see is not drawn. First run, in `flow-patterns.md`, is the flow that starts here.

## How many panels a page uses — 🔮

A panel frames one thing that a person reads as a whole or saves as a whole. That one fact decides how many panels a page has, in every page kind.

- **A page uses one panel for each thing a person reads or saves as a whole** (`RULE.SUPPORT.SURFACE.116` · GUIDE). The sections of that one thing are the parts of its content, each under its own title.
- **A section of one thing is not a panel of its own.** A frame around a section says that the section is read or saved by itself.
- **Two things that are read or saved apart are two panels, each with its own title.** A person then sees where one thing ends and the next begins, and which actions belong to which.

| The page | Its panels |
| --- | --- |
| an entry that is saved once | one panel. Its sections are the parts of its content, and its actions stand in its footer |
| the page of a record | the head of the record outside any frame, then one panel for each thing that belongs to the record, such as its content and the list of its versions |
| a listing | one panel, with the filter bar and the records as the parts of its content |

The reason is the theme. The parts of a panel are the places the look of the app reaches. So a page that draws no frame, no line and no padding of its own takes the theme of a partner with no change.

- **The page that reads a record and the page that changes it hold the same parts in the same order** (`RULE.SUPPORT.SURFACE.117` · GUIDE). On the page that changes the record, a reading becomes a field, a block of source becomes an editor, and the footer with the actions is added. Nothing else moves. The rule holds for the panel of the thing that is changed: the page that reads a record may hold more panels, such as the list of its versions.

## The listing pages — 🔮

A listing page is a page whose whole content is the records of one kind. It follows `RECORD_HOME`. `DSDataTable` has three layouts, and a listing page is that one widget in one of the three. It keeps its search, its filters and its paging in each.

| One record holds | At a desktop | At a tablet | On a phone |
| --- | --- | --- | --- |
| three or more facts a person compares across many rows | `TABLE` | `TABLE`, with fewer columns where the record has many | `LIST` |
| a person or an organization, told apart by a second fact | `TABLE`, its lead cell on two lines | `TABLE`, its lead cell on two lines | `LIST` |
| more than a line, as a thing a person chooses by looking: a kind to set up, an app, a file with a preview, a project with its progress and its people | `GRID` | `GRID`, two across | `GRID`, one across |
| a title and one or two facts, opened one at a time | `LIST` | `LIST` | `LIST` |

Which picture each layout leads with, and which field fills it, are stated with the data table in `architecture-components.md` (`RULE.SUPPORT.SURFACE.606` · GUIDE) (`RULE.SUPPORT.SURFACE.614` · GUIDE) (`RULE.SUPPORT.SURFACE.615` · GUIDE) (`RULE.SUPPORT.SURFACE.616` · MUST · skill:spn-surface/design).

- **A listing page whose query takes a page, a text or a filter stays a data table, also where its set is small today** (`RULE.SUPPORT.SURFACE.054` · GUIDE). Its search and its paging are sent to the server. A plain table or a list would do neither.
- **A list of groups and the list of their items are one page.** The two follow the frames `GROUPS` and `STACK` of `RECORD_HOME`, and neither is a listing page of its own.

## The pages for a failure that is not the person's — 🔮

- **The floor holds `COMMON_SERVER_ERROR` and `COMMON_MAINTENANCE`, beside `COMMON_NOT_FOUND` and `COMMON_NO_ACCESS`, for every surface category** (`RULE.SUPPORT.SURFACE.605` · MUST · skill:spn-surface/design). Each is one `DSEmpty`: `COMMON_SERVER_ERROR` (`ServerCrash`, *Something went wrong on our side*, **Try again** and **Go back**) stands in the layout of its surface where it can still be drawn, and `COMMON_MAINTENANCE` (`Wrench`, *We'll be back soon*, until a time) stands on `CANVAS`. No language customises them.
- **A page of the kind `ANALYTICS_HOME` sets one range and one period compared for every part of the page** (`RULE.SUPPORT.SURFACE.618` · GUIDE). A figure and a chart that read two ranges cannot be compared. The kind is planned in the design system until a chart unit is built.

## The sign-in page — 🔮

**For** Team · Individual · Visitor. For an Individual, the providers and a code by email lead; for a Team, company sign-on stands as an equal; for a Visitor, the sign-up case beside it, with one ask and no account before value.

`AUTH_FLOW` is the page a person passes before any other page kind, and every app has one, so its shape is stated once (`RULE.SUPPORT.SURFACE.205` · MUST · skill:spn-surface/design).

| Level | The sign-in |
| --- | --- |
| Layout | `CANVAS`, the body alone, with the panel centred in the window, across and down, in a column as wide as a form reads well. A legal line, where the app has one, is the layout's `footerNode` |
| Page level | none apart from the panel: its header holds an item with the step's title, such as *Sign in to Nimbus*, and its line |
| Container | one `DSPanelContainer` at `SM`, in the theme's look, with `divided` set to `CONTENT`: the first content signs in, and a second content, set apart by its line, holds the other task, *New to Nimbus? Create an account* |
| Components | in the first content, in this order: the brand as an item at the level `CONTAINER` with its mark; the providers as one centred row of icon buttons of one size, each named by its tooltip; a `DSSeparator` with the label *or*; the fields; the main action across the content; a `DSSeparator` with the label *Other ways to sign in*; and the other ways, such as a passkey, a code by email and single sign-on, as one row of equal outline buttons |

- **A sign-in is one compact panel, so the whole of it is seen without a scroll.** Each group stands one step of the scale from the next, and the fields stand one under another, their message lines the space between them.
- **Every control is a `DSForm.Field`.** A choice between two ways to say who you are, such as an email or a phone, is a `DSToggleGroup` above the one field it switches. The action of a field, such as *Forgot password?*, stands at the end of its label line as `labelEndNode`. A checkbox alone on its line, such as *Remember me*, is a field with `showBlankLabel={false}`.
- **The providers are icons alone, one row, centred, each its own size with one gap between them**, not a column of wide buttons.
- **An alternative stands as an equal of the others, and opens its own step in place.** A one-time code or single sign-on changes the header's title and the content's fields, with a way back to the password, and the page does not move.

### The cases beside `SIGN_IN`

A person meets other cases beside the sign-in: the case that creates an account, the reset of a password, an invitation, and the return from a provider or a company. They belong to the same door, so they take its shape.

- **A case beside `SIGN_IN` takes the sign-in's panel** (`RULE.SUPPORT.SURFACE.364` · GUIDE). It is the same `CANVAS`, the same one `DSPanelContainer` at `SM` and the same header, with its own step's title in it. Its steps change in place, as an alternative of the sign-in does, and each step after the first has its own way back to the one before.
- **The second content of `SIGN_UP` offers the sign-in** (`RULE.SUPPORT.SURFACE.364` · GUIDE): *Already have an account? Sign in*, on every step. `SIGN_IN` offers the sign-up in turn, as every flow asks (`flow-patterns.md`).

| The page | Its steps, in the sign-in's panel | The flow it belongs to |
| --- | --- | --- |
| the sign-up page | the person's details, a code that proves the address, and where the address already holds a place, make another or sign in; after a provider's own pages, *Finish setting up* | Sign up |
| the reset of a password | who you are, how to reach you, then the code and the new password; from the emailed link, the new password | Get back in |
| an invitation | who invited the person and to what, then their name and a password, or their sign-in | Accept an invitation |
| a return from a provider or a company | a wait; on a failure, the panel's alert and the way back to the same site's sign-in | Sign in |

## What every spec shows the same way — 🔮

Every spec draws a part of a page the same way, whichever page kind it belongs to. The rule behind each row is stated once, in the ref the last column names.

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

- **`RECORD_HOME`, frame `GROUPS`: the swap MUST change the address**, although it happens in place. The browser's Back then does the same as the back action, a reload stays on the chosen group, and a link to one group opens it on any screen.
- **On the web an entry in a dialog or a sheet MUST be an address, although it opens in place** (`RULE.SUPPORT.SURFACE.366` · MUST · skill:spn-surface/design). The browser's Back then closes the entry and never leaves the page under it, a reload opens it again, and a link opens it over its page. What was typed is lost on a reload.
- **A confirmation, and proving it is you again, are not addresses.** Each interrupts a task, as Interrupt states, so a reload drops it, and the act is tried again.

The flow patterns take these rules as they are, in each flow that opens an entry (`flow-patterns.md`).

## What is not settled or checked yet

- **No check reads a page for its page kind.** A review names the page kind and reads the page beside its spec.
- **Whether one data table changes its layout by screen class is not checked against a stack.** The book takes it that it does; what each stack builds is its provider's to say.
- **A skeleton lays no frame over another.** So a dialog over its page has no figure, and a sheet is drawn beside its page.
- **A unit does not yet do everything a pattern asks of it.** No unit draws a strip of steps in an app page kind's spec, and a value that is not text is not changed in a cell. `architecture-widgets.md` says plainly what a unit does not do, under *Not there yet*.

## Boundary

This ref states the four groups of the surface patterns, which task pattern covers a given task and what blocks carry it, and which arrangement a whole screen of an app takes and in what order that is decided. It stops at naming the blocks. The shape of a site's section is `site-patterns.md`, and a path across pages is `flow-patterns.md`. It does not state what the six parts are or what a task state is — that is `standards-interaction.md`, used by every pattern here without restating it. It does not state who an app is for, or what a label, a badge, a count or a field owes a person on any page — those are `standards-core.md`. It does not state what the layouts of the data table are, what an item line holds, or how an entry and a large form are framed — those are `architecture-widgets.md`, `architecture-components.md` and `architecture-containers.md`. It does not state what a block, a prop or a token is named — that is `architecture-names.md` and the refs after it.

## Binds

| Rule | What it decides |
| --- | --- |
| `RULE.SUPPORT.APPS.158` | every overlay that covers a page dims it with one scrim |
| `RULE.SUPPORT.SURFACE.093` | a sheet that is not modal stands beside the page and draws no scrim |
| `RULE.SUPPORT.APPS.159` | an alert and a toast draw one picture |
| `RULE.SUPPORT.SURFACE.046` | the surface patterns in groups by scope, smallest first: task, app, site and flow patterns |
| `RULE.SUPPORT.SURFACE.047` | how a thing is shown follows from the data and from the person who uses it. It is advice |
| `RULE.SUPPORT.SURFACE.048` | an app page kind is built from blocks that exist, and is never a block of its own |
| `RULE.SUPPORT.SURFACE.049` | an app page kind fixes the arrangement, and not which block fills a part. It is advice |
| `RULE.SUPPORT.SURFACE.050` | no app page kind depends on a count. It is advice |
| `RULE.SUPPORT.SURFACE.051` | the app page kinds as one named set; that a page chooses one, and derives one from the patterns that fit where none does, is advice. The names are proposed |
| `RULE.SUPPORT.SURFACE.052` | a page is decided in four steps, with a block as the last thing chosen. The two numbers of step 2 are proposed. It is advice |
| `RULE.SUPPORT.SURFACE.053` | a spec in the plugin equals the spec of the same name in the book |
| `RULE.SUPPORT.SURFACE.054` | a listing page whose query takes a page, a text or a filter stays a data table. It is advice |
| `RULE.SUPPORT.SURFACE.055` | no heading is made up for choices whose data names no group. It is advice |
| `RULE.SUPPORT.SURFACE.115` | an entry with a preview is one panel, and each thing a person writes stands beside its own result. It is advice |
| `RULE.SUPPORT.SURFACE.116` | a page uses one panel for each thing a person reads or saves as a whole, and a section of one thing is not a panel of its own. It is advice |
| `RULE.SUPPORT.SURFACE.117` | the page that reads a record and the page that changes it hold the same parts in the same order. It is advice |
| `RULE.SUPPORT.SURFACE.202` | an app page kind states its units by level, its page level and its cards among them, and names no layout of its own |
| `RULE.SUPPORT.SURFACE.205` | a sign-in is one compact panel on a canvas, its providers one row of icons and every control a form field. It is advice |
| `RULE.SUPPORT.SURFACE.217` | a part of a page takes the unit it is for, a panel, a card widget, a card or an item, and a skeleton naming another is refused. It is advice |
| `RULE.SUPPORT.SURFACE.332` | every pattern names the persons it serves, with one line where it runs differently for one; that a page no page kind fits is derived and does not wait is advice |
| `RULE.SUPPORT.SURFACE.598` | that a help centre, and any site whose bar does not list its groups or that runs deeper than three levels, draws the breadcrumb under the bar, one link a level and the page unlinked |
| `RULE.SUPPORT.SURFACE.333` | where two page kinds fit a page's data, the person decides between them |
| `RULE.SUPPORT.SURFACE.363` | switched-off rows stay in their own list, each with the badge *Inactive*. It is advice |
| `RULE.SUPPORT.SURFACE.364` | a case beside `SIGN_IN` takes the sign-in's panel. It is advice |
| `RULE.SUPPORT.SURFACE.365` | `HOME_APP` says what it shows before anything is counted. It is advice |
| `RULE.SUPPORT.SURFACE.366` | on the web an entry in a dialog or a sheet is an address |
| `RULE.SUPPORT.SURFACE.221` | a card that shows its own info is a `DSCard`, and a `DSCardWidget` is a card with a head |
| `RULE.SUPPORT.SURFACE.371` | a hero's state is a `PRIMARY` badge eyebrow, and its stack is `OUTLINE` `DEFAULT` badge facts, as `site-patterns.md` states. It is advice |
| `RULE.SUPPORT.SURFACE.372` | a grid cell's eyebrow is its group or kind as text, and a badge only when it says a state. It is advice |
| `RULE.SUPPORT.SURFACE.373` | a plan holds one eyebrow. It is advice |
| `RULE.SUPPORT.SURFACE.393` | a partner's design, a page to follow, both or neither are read into one design tree, checked at each step and shown before any code, and a kept choice stands. It is advice |
| `RULE.SUPPORT.SURFACE.394` | a rule about how a page is designed and uses a unit is guidance and says its reason; MUST stays for what the design system and a stack build, the floor a person is owed, the library and showcase process, and true claims |
| `RULE.DEVEX.WORKSPACE.454` | a mock of a layout is a `SKELETON` figure drawn by its helper, with a flow file ordering the pages and each page drawn once |
| `RULE.DEVEX.WORKSPACE.230` | a mock draws each page once, its errors in place and its other task states in words, and a flow file orders a flow's pages with where each move leads |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
