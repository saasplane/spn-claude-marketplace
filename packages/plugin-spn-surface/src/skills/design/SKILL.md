---
name: design
description: Design a page of a SaaS Plane app from the blocks of the design system, or register a new unit in the design system's own Figma library, or change what a library file already holds. Use when the user asks to design, lay out or draw a page, a screen or a flow of pages, in words, in Figma, or as a mock with no Figma; also when the user brings a design of the page (a Figma link, an image, a PDF or slides, a sketch, a page of their product, or HTML), or points at a page to follow, which the given-design mode reads into the same tree (`steps/given-design.md`); also use it when the ask is to add a component, a widget, a container or a layout to the Figma library, to draw a unit the code already has but the library does not, or to change a set, a version, a token or a value a library file holds. For a page, it first names who the app is for and the flow the page is a step of, then picks the layout, writes down the facts of the data and of the person, chooses the app pattern or each section's site pattern, decides the containers, chooses the pattern for each task, and then the blocks, and states the page as a tree of named blocks with their props; with the Figma connector it draws that tree from the published libraries, and with none it draws the tree as skeletons, a mock, each page drawn once with its errors in place and its other states in words, with a flow file that orders the pages (step 8). For a library change, step 7, "Draw it in Figma", walks `steps/change-library.md` directly — read that step on its own when the ask is about the library and not about a page. Not for deciding what a feature is - that is the `ideate` skill - and not for writing the code of a screen, which is the `implement` skill.
---
<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md",
      "seen": "6943024a"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/03-ideate.md",
      "seen": "32bc2649"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/",
      "seen": "32782a8c"
    }
  ]
}
-->

# design — a page, from its layout down to its blocks

**Read `refs/devex/workspace/workstream.md` (spn-devex) before acting.** It holds the loop this skill runs inside: how a prompt is read, where a new ask goes, what a prompt does to a running arc, and how a reply closes.

**Then read `refs/support/surface/README.md`, in this plugin: the entry ref, and its route 1.** It names each Surface ref this skill reads, in the order the decisions below run: the levels of a page and the rules of content, the flow, the layout, the patterns, the panels, the tasks, then the blocks, whose props come from the choice tables. This skill holds the order of the decisions, the patterns, and the form of the result.

**Read `refs/support/surface/standards-patterns.md` before you choose a pattern.** It holds the four groups of surface patterns, the task patterns, the fourteen app patterns with the kinds of person each serves, the four steps of the choice, and the tree by level of each app pattern. A site's page reads `site-patterns.md` too, for its sections, and a page that is a step of a path reads `flow-patterns.md`. The specs are in `refs/support/surface/app-patterns/` for a screen of an app and in `refs/support/surface/site-patterns/` for a section of a site's page, in this plugin, and a page starts from one. Read `architecture-components.md`, under Composites, where the pattern names a data table, a filter bar, an item line, a badge or a field; a unit the task needs is found by the task's words with `spn-surface unit find <words>`, and its choice table is one call away with `spn-surface unit show <Unit>`, and for a unit beyond the core the same call prints its props from the symbol index of the repository it runs in, or, from a workspace's root, of each repository in it, and the core block whose table decides the rest.

**This one skill serves the builder of SaaS Plane and a partner alike.** Both design from the refs and the specs this plugin carries, and neither needs the book open.

**The surface has two levels** (`RULE.SUPPORT.SURFACE.081`). The book states the core: the core units, the rules, and for pages the patterns and their skeletons. A stack's design system builds all of it, and it may provide further units of its own that help build apps. So you read the pattern and its skeleton from the refs, and you pick the units from the stack's design system, the core units and the stack's own, or from a partner's own code.

Take the scope from the argument: one page, or a flow of pages. A flow is several pages, and each page gets a tree of its own.

**Where the ask brings a design of the page, or points at a page to follow, read `skills/design/steps/given-design.md` before step 1, and run the steps below through it.** It is the same skill and the same tree: the facts come first, the design is read once, each of steps 1 to 5 checks the partner's version instead of starting from nothing, and the reply ends on two lists and a stop before any code. It is guidance: the cases guide, and the partner's choice stands wherever they keep it.

**Your output is one tree for each page**: every block by the name the book gives it, with its props and the case each follows. The build reads it; the reply shows the picture of the page, and the tree in full only when the developer asks. In a partner's repository, write only the draft rows the partner accepts, in its behaviours, and each kept line as a comment in the code at the line it keeps; the tree itself is not written there. In a workstream, write it where the running arc names. A mock is the same tree drawn as skeletons (step 8). You write no code here.

The decisions run in one order. Each level of a page owns one thing, and the level above it decides first. Who the app is for comes before all of them, and a block is the last thing chosen.

| | Decision | What it settles |
| --- | --- | --- |
| 0 | who the app is for, and the flow | the kind of person every later decision reads, and the path the page is a step of |
| 1 | the layout | the navigation, and the content the page gets |
| 2 | the facts, and the pattern | what the data and the person are, which app pattern the screen takes or which site pattern each section of a site's page takes, and what shows each part |
| 3 | the panels | which parts of the page are framed as a header, content and a footer |
| 4 | the pattern for each task | how each thing the person does runs, and what they see in each task state |
| 5 | the blocks | the named block for each part of each pattern, with its props |

## 0. Name who the app is for, and the flow the page is a step of

The same list is built one way for a trained team that works in it all day, and another way for many people who open it now and then, on a phone, and were never shown how. So before any pattern is chosen, name the kind of person the app is for (`RULE.SUPPORT.SURFACE.330`). `refs/support/surface/standards-core.md`, under *Who an app is for*, holds the four kinds with their answers and the table of what each kind changes.

- **Read the kind once for the app, from what the partner has already written**: the personas whose behaviour rows land in the app, each row's *Who* and *Does*, and the industry brief where there is one. Ask of each persona the four questions: do they use the app as their job (**Team**)? Do they use it for themselves (**Everyday users**)? Are they still deciding, not signed in (**Visitor**)? Did they come to learn or to get a thing working (**Learner**)? The kinds are one closed set (`RULE.SUPPORT.SURFACE.331`); name one of the four, never a role, a domain or one of the platform's apps.
- **Where the personas and the rows do not say, ask the developer, and never guess** (`RULE.SUPPORT.SURFACE.330`). A guessed kind looks the same as a read one, so nobody would know to correct it.
- **Never read the kind from the platform's tier.** A member business on an enterprise account is a Team, and a one-person account in a product sold to the public is an Everyday user.
- **A page another kind reaches takes that kind** (`RULE.SUPPORT.SURFACE.333`): an app's landing and its register page are a Visitor's, whoever the app is for. Where two kinds meet on one page, the less forgiving decides: Everyday users over a Team, a Visitor over a Learner. A page that would need two patterns for its two kinds is two pages.
- **Name the flow the page is a step of**, from the ten in `refs/support/surface/flow-patterns.md`: which flow, which step, where it starts and where it ends. A page that is no step of a named flow says so. The flow's *For* line and its task states then hold on the page, and on the web its lines for Back, a reload and a link.
- **Write the kind as the first row of the facts table, and the flow as the second**, each with where you read it (the facts are below, in step 2). The developer then corrects a kind, and not a layout.
- **Carry the kind into every decision below.** It changes only what the app already sets and the lines its patterns carry (`RULE.SUPPORT.SURFACE.334`): the layout's job in step 1, the density, which of two fitting patterns is chosen in step 2, how much an entry asks at once in step 4, the words of a failure and of an empty state, and what a phone must finish. Read each from the table in `standards-core.md`, and never build a second version of a page or a unit of the kind's own.

## Before the first layout — say what the page is for

- **Name the purpose in one sentence**: the main intent, and the main action. A page has one purpose. If the sentence needs *and*, design two pages.
- **List each task the person does on the page.** Read the tasks from the behavior rows of the owning docs. Where a task has no row, say so: the `ideate` skill writes the row.
- **Name the kind of surface.** It is web today. A rule that names hover or a pointer holds for the web alone.
- **Read what the app holds already**: its theme, and the layout its other pages use.
- **Place by purpose before you pick a unit** (`RULE.SUPPORT.SURFACE.207`). Group the controls of each task by intent, put each beside what it relates to, and draw alternatives as equals. Only then choose the units that carry that. A page built from a list of parts reads as a page of parts.

## 1. Pick the layout

A layout frames the page. It draws the navigation, and it hands the page the content. It owns nothing inside it.

| Layout type | The navigation | What it is for |
| --- | --- | --- |
| `RAIL` | a sidebar at the side, with a fixed head and foot, which a person opens and shuts to icons | an app a person works in, with many sections: an admin console |
| `DOCK` | a bar across the top, and the entries in a column beside one page | one person's or one thing's settings: a profile, an account |
| `TOPNAV` | a bar across the top, with the content below it | a website, with the few entries that fit on one line |
| `CANVAS` | none: the body alone | a sign-in, a marketing page or a page of an error |

- **The theme styles the layout in three parts, the body, the navigation and the content, and a page writes no look for any of them** (`RULE.SUPPORT.SURFACE.139`, `RULE.SUPPORT.SURFACE.200`). The body is the whole window, with the fill behind everything and the width of the box the others stand in; the navigation moves a person around the app; the content is the content. The navigation is attached to the window's edge or floats, the layout's space in (`--layout-space`); the content is attached, a box at the body's width that meets the navigation with the body showing around it, or floats; and the top bar is sticky or not. The width is the body's: `FULL`, `XWIDE`, `WIDE`, `MEDIUM` or `NARROW`. A phone draws one drawer for all three layouts. The layouts alone read the theme. `architecture-layouts.md` states them.
- **The page chooses its layout, and the theme never does.** Choose it by the job of the app, as the table says, and never by its look (`RULE.SUPPORT.SURFACE.206`). The kind of person sets that job: a Team takes `RAIL` for the app, `DOCK` for a person's own settings and `CANVAS` to sign in; Everyday users take `TOPNAV` with the few entries that fit on one line, or `DOCK` for their own account, and never a `RAIL` of many sections; a Visitor takes `TOPNAV` for a site and `CANVAS` for one landing; a Learner takes `TOPNAV` for a few pages, with the doc's sections at the side where it has many. Say which type the app's other pages use, and propose it. Where the app has no page yet, show the layout types, and the developer chooses.
- **Fill the places, named by where they stand** (`RULE.SUPPORT.SURFACE.157`): `startNode`, the navigation, `endNode`, `actionsNode`, the content and `footerNode`, and in a dock or a top nav `headerNode`. Every layout type with a navigation takes them in its config; `CANVAS` is the body alone, with no navigation and no overlay.
- **`headerNode` is the header directly under the bar**, for a hero, a slideshow, or the head of an account or a project (`RULE.SUPPORT.SURFACE.258`). What it holds stands in the body's box, as the footer's does, and a hero that needs the whole window is a section placed in it. It scrolls with the page, and the content's box starts under it.
- **The footer is optional, and it is the place at the page's end, the window's width**, and beside a rail the width of the area beside it. What it holds stands in the body's box, lined up with the bar's items and the page. Where the content is short it stands at the window's bottom, and where the content is long it stands after the content. An app that gives no footer has none, and the layout decides nothing about what it holds.
- **A top nav and a dock take the bar's width as `barWidth` in their config, and a rail, a dock and a top nav take the size of their entries as `size`, of every step `XS` to `XL`** (`RULE.SUPPORT.SURFACE.257`). The theme holds neither.
- **Say where each node stands on a phone.** `phone` places `startNode`, `actionsNode` and `endNode` in the bar, the drawer or both: by default `startNode` both, `actionsNode` the drawer and `endNode` the bar. The bar starts with the menu, or with the way back where a dock has `backTo`, and a node in the bar takes its collapsed form where the page gives one.
- **Mark the place the person is in.** The navigation shows it with the selected state.
- **Leave the navigation to the layout.** A page that draws its own navigation has taken the layout's job.

## 2. Write the facts down, and choose the pattern

**How a page is shown follows from its data and from the person who uses it** (`RULE.SUPPORT.SURFACE.047`). Do not arrange a page by how another page looks, or by which block is at hand; a page a partner points at counts only where the facts and the cases leave a choice (`steps/given-design.md`). So you write the facts down first, and you choose from them.

### Write the facts down

Read what you can from the contract, and ask for the rest. Write every fact in the reply before you choose anything. The developer then corrects a fact and not a layout.

| Fact | Where you read it |
| --- | --- |
| the kind of person the app is for, with its answers: how often they come, trained or not, their device, what they never forgive | step 0: the personas, the rows' *Who* and *Does*, the brief; asked where they do not say; never the tier |
| the flow the page is a step of, and the step | step 0: `flow-patterns.md`, or *none* |
| what one record holds: a name, a state, a picture, and how many facts | the contract |
| whether the query takes a page, a text or a filter | the contract |
| whether the set is fixed or grows | the contract: an enum is a fixed set |
| what belongs to a record | the contract: the other commands that take its id |
| how many there usually are, where the server returns the whole set | you ask |
| who comes, how often, and to do what | you ask |
| what the role of that person lets them do on the page | the permission codes of the contract. Where they do not say, you ask |

- **Ask for a fact you cannot read, and never guess it.** A guessed fact looks the same on the page as a read one, so nobody would know to correct it.
- **Never plan a page that depends on a count** (`RULE.SUPPORT.SURFACE.050`). A group shows how many items it has only where the server gives that number together with the groups.

### Choose in four steps, with a block last

A page is decided in four steps, in this order (`RULE.SUPPORT.SURFACE.052`). The choice never starts from a block.

| Step | What you decide | Decided from |
| --- | --- | --- |
| 1 | the app pattern: the shape of the page | what the page is about, why a person comes, and the kind of person |
| 2 | what shows each part that has many of one thing | what the contract says of the list, and what one of them holds |
| 3 | what changes at a tablet and on a phone | the choice of step 2 |
| 4 | how a thing is entered or changed | how much there is to enter |

**Step 1: name the one app pattern that fits.** An app pattern is chosen from the set below and never invented (`RULE.SUPPORT.SURFACE.051`). Its *For* line names the kinds of person it serves (`RULE.SUPPORT.SURFACE.332`): the kind from step 0 must be among them, and the pattern's line for that kind, in `standards-patterns.md`, is applied. The names are proposed, and not yet confirmed one by one.

| App pattern | The data | The person | For | Its spec in `refs/support/surface/app-patterns/` |
| --- | --- | --- | --- | --- |
| Find in a list | a set that grows as people work | comes often, to find one | Team · Everyday users | `find-in-a-list.dg.json` · `find-in-a-list-look.dg.json` |
| A record and its setup | one record, and a few things set up for it | comes rarely, to see where things stand | Team · Everyday users | `record-and-its-setup.dg.json` |
| A record and what belongs to it | one record, with lists of other records attached | comes to attach or remove one, or to read what happened | Team | `record-and-what-belongs-to-it.dg.json` |
| Set up by kind | fixed kinds, with one or a few of each | comes rarely, to connect or change one | Team | `set-up-by-kind.dg.json` |
| Compare across kinds | one fixed set of settings, for a fixed set of kinds | comes rarely, to check or change a default | Team | `compare-across-kinds.dg.json` · `compare-across-kinds-edit.dg.json` |
| Groups and their items | things in groups, where a group is a heading | comes to see the whole and open one item | Team · Learner | `groups-and-their-items.dg.json`, and its `-two-lists`, `-open` and `-many` forms · `one-action.dg.json` |
| An overview | counts, and what waits for a person | has just arrived | Team · Everyday users | `overview.dg.json` |
| A record and its steps | one record that moves through known steps | moves it on, with the right role | Team · Everyday users | `record-and-its-steps.dg.json` |
| Choose many | many things to tick | ticks several | Team · Everyday users | `choose-many-in-groups.dg.json` · `choose-many-in-one-list.dg.json` |
| An editor with its preview | content a person writes, and what it becomes | must see the result while writing | Team | `editor-with-preview.dg.json` |
| An entry over the page | a small or a medium form | needs the page it belongs to, which stays beneath or beside the entry | Team · Everyday users | `entry-over-the-page.dg.json` |
| Inherit or override | a value that follows a default until someone sets their own | must see which of the two it is, and be able to go back | Team | `inherit-or-override.dg.json` |
| An entry that is a page | a large form, with sections or a part that repeats | fills it in one sitting | Team · Everyday users | `entry-as-a-page.dg.json` |
| Change in place, in a list | many small values of one kind | changes one after another | Team | `change-in-place.dg.json` |

- **The first eight are a whole page.** The last six are how a person enters or changes something, and each opens from one of the eight.
- **Cite the pattern's *For* line in the result, and follow its line for the kind.** For Everyday users, Find in a list is the `LIST` layout on every screen with a search box and two or three filters in view, An overview is a greeting and one card with no row of counts, and an entry over the page is a small one only, a medium one becoming an entry that is a page in steps with `DSStepper`.
- **Where the data fits two patterns, the kind of person decides between them** (`RULE.SUPPORT.SURFACE.333`). A Team takes the one that keeps the person in place and fast: Find in a list as a table, Change in place, An entry over the page. Everyday users take the one that asks one thing at a time: the data table's `LIST` layout, an entry in steps, a record read before it is changed. Where the kind does not settle it, say so and ask.
- **A sign-in has a shape of its own** (`RULE.SUPPORT.SURFACE.205`). It is not one of the fourteen: start from *The sign-in page* in `standards-patterns.md`, and for the sign-up page, a reset and an invitation from *The pages beside a sign-in* (`RULE.SUPPORT.SURFACE.364`).
- **A page no pattern fits is derived, and it never waits** (`RULE.SUPPORT.SURFACE.051`, `RULE.SUPPORT.SURFACE.332`). Derive it from the patterns whose person and data fit it, as a board is derived from Groups and their items and a cart from Change in place, in a list, and name in the result which patterns it is derived from. A page shape earns a pattern of its own only when no pattern fits its person and its data, and that pattern joins the book first.

**A site's page takes a site pattern for each section, and no app pattern.** Where step 0 and the words of the page say it is a doc or a marketing page, read `refs/support/surface/site-patterns.md`: name the kind of page by its level (a site home, a group home, a part page, a guide and the rest), list its sections in the order of its reader's questions, and name each section's pattern by the content signals, asked in order with the first yes winning. Each pattern's *For* line names Visitor, Learner or both; follow its line for the kind. Each section starts from its spec in `refs/support/surface/site-patterns/`, and the choice's steps 2 to 4 below apply to an app's screen only.

**Step 2: choose what shows each part.** The contract decides first. Where the query takes a page, a text or a filter, the part is the data table, `DSDataTable`, also where the set is small today (`RULE.SUPPORT.SURFACE.054`).

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

- **A few is up to about 7, and some is up to about 30.** Both numbers are proposed.
- **An app pattern fixes the arrangement, and never which block fills a part** (`RULE.SUPPORT.SURFACE.049`). Choose each part by its own data. Two parts of one page often hold data of different shapes.
- **A search and a filter of a data table go to the server** (`RULE.SUPPORT.SURFACE.070`). Never plan a search that runs in the page over the records already loaded.

**Step 3: say what changes at a tablet and on a phone.** It follows from step 2, because each block has its own way to fit a smaller screen.

| At a desktop | At a tablet | On a phone |
| --- | --- | --- |
| `DSDataTable`, layout `TABLE` | the same, with fewer columns | the same data table, layout `LIST`, with the filters behind one action |
| `DSDataTable`, layout `GRID` | the same, with fewer across | layout `LIST` |
| a table, `DSTable` | the same | a list, one group at a time |
| two parts side by side: the groups, and the items of the chosen one | the items take the place of the groups, with a back action; on the web the address changes | the same as a tablet |
| a dialog | the same | a sheet from the bottom of the screen |
| a sheet at the side | the same | the full screen |

**Step 4: decide how a thing is entered or changed.** How much there is to enter decides where the entry opens (`RULE.SUPPORT.SURFACE.075`). The two numbers are proposed.

| The entry | At a desktop | On a phone | App pattern |
| --- | --- | --- | --- |
| small: up to about 5 fields in one group | a dialog over the page | a sheet from the bottom of the screen | An entry over the page |
| medium: one column with a few groups, up to about 12 fields | a sheet at the side, with the page still in view | the full screen | An entry over the page |
| large: sections, steps, or records of its own inside it | a page | a page | An entry that is a page |
| one value among many of one kind | in its row | in its line | Change in place, in a list |
| a thing that is only on or off | in place, as a switch | the same | the pattern of the page it stands on |

- **The kind of person sets how much an entry asks at once** (`standards-core.md`, *What each kind changes*). A Team takes many fields at once, up to about 12 in a sheet, keyboard first, defaults filled. Everyday users take about 5 fields a screen and one decision, every format accepted and nothing they entered lost, so their medium entry is an entry that is a page in steps, with `DSStepper`. A Visitor takes one ask and the fewest fields, with no account before value.
- **On the web an entry over the page is an address** (`RULE.SUPPORT.SURFACE.366`): Back closes it, a reload opens it again, and a link opens it over its page. A confirmation, and proving it is you again, are not.

### Start from the spec of the pattern

- **Open the spec of the pattern you named**: for an app pattern in `refs/support/surface/app-patterns/`, and for each section of a site's page in `refs/support/surface/site-patterns/`, by the page's kind. It is a skeleton with a view for each screen class. Draw it with `spn-devex docs figure draw <spec>` where you want to see it.
- **Read the tree by level of that pattern in `standards-patterns.md`, or a site pattern's look in `site-patterns.md`.** It names the page level, the panels, the widgets and cards, and the components the pattern is drawn with, and what changes on a tablet and a phone.
- **The spec names the layout and the page level a tree starts from** (`RULE.DEVEX.WORKSPACE.260`). Its `layout` is the setting the sketch is drawn in, and never part of the pattern: the tree writes the layout chosen in decision 1. Its `page` is the page level, the head of the page: `DSPageLevel` at `PAGE` above the panels, or the header of the one panel that is the page, with `fullPage`. Each block's `unit` is the unit the tree writes for it, and a card stands at the level of a widget.
- **The values in a spec are samples.** They show what kind of data a part holds. Put the page's own data in their place, and keep the arrangement. Every title, description and value the tree writes is in the product's own words, and never the name of a pattern, a unit or a level.
- **The words follow what the page is for** (`RULE.SUPPORT.SURFACE.208`). Decide before writing a word whether the page is a doc, an app's screen or a marketing page, and never two at once (anything set one under another is a `DSList`, `DEC.SUPPORT.SURFACE.288`): on an app's screen a label is short, an action is a verb and its object in 1 to 3 words and 4 at most, with an arrow drawn as its icon and never typed (`RULE.SUPPORT.SURFACE.335`), an error says how to fix it, and nothing persuades, with everyday words only for Everyday users; on a marketing page the personas come first, each section answers one reader question, and every number is real, in the length its level allows (`RULE.SUPPORT.SURFACE.286`). The rule in full is `refs/support/surface/standards-core.md`, under "The words of a page, by what it is for".
- **Never edit a spec in the plugin.** Work from a copy. Every page of one pattern then starts from the same arrangement.

## 3. Decide the panels

A panel is optional. Use one where a part of the page has a header, content and a footer as one unit. A page with no such part uses none.

**Take the panels from the tree of the app pattern.** Its Container line says how many panels the page has, and what each part of one holds.

| A page | Header | Content | Footer |
| --- | --- | --- | --- |
| A listing | the page title, a line under it where one is needed, and actions at the end | a filter bar where the listing has one, and a data table in a `flush` part | the paging of the records |
| A form | the title of the form | its sections, one under another, each under its own title | the actions that save the form or leave it |
| A dashboard | flat | raised, holding widgets that show numbers | none |

- **Put the title and the actions of a panel in its header, and what closes its work in its footer** (`RULE.SUPPORT.SURFACE.074`). The action of one part of the content stands at the end of that part's title, and never in the header.
- **The actions that close the work of an entry stand in one place and in one order** (`RULE.SUPPORT.SURFACE.095`). Over the page, in a dialog, a sheet, a drawer or a popover, they stand at the end of the footer: the action that leaves the work first, and the main action last. In an entry that is a page of its own they stand at the start of the footer, the main action first. A value changed in place keeps its two actions beside the box, the one that saves first. The main action is a solid button, and the action that leaves is an outline button.
- **Frame a part only when it has a title of its own, and also an action of its own or data it loads by itself** (`RULE.SUPPORT.SURFACE.057`, proposed). The record a page is about is the header of the page, and it takes no frame.
- **An entry over the page is one panel, placed inside the dialog or the sheet** (`RULE.SUPPORT.SURFACE.077`). Its title and the action that closes it stand in its header, its fields are its content, and its actions stand in its footer.
- **A large form is one panel.** Its sections are the parts of its content, each under its own title. A section is never a panel of its own, and no list of the sections stands beside the form (`RULE.SUPPORT.SURFACE.078`).
- **Groups and their items are two panels at a desktop.** On a tablet and on a phone the items take the place of the groups, with a back action (`RULE.SUPPORT.SURFACE.079`), and on the web the swap changes the address. A set of groups that can be added to is a list, and never a row of tabs (`RULE.SUPPORT.SURFACE.080`).
- **Give one panel to each thing a person reads or saves as a whole** (`RULE.SUPPORT.SURFACE.116`). The sections of that thing are the parts of its content, each under its own title, and never panels of their own. Two things that are read or saved apart are two panels, or cards. An editor with its preview and *Choose many* are each one panel (`RULE.SUPPORT.SURFACE.115`).
- **Give the page that reads a record and the page that changes it the same parts in the same order** (`RULE.SUPPORT.SURFACE.117`). On the page that changes it, a reading becomes a field, a block of source becomes an editor, and the footer with the actions is added.
- **Write no prop and no padding to place a title** (`RULE.SUPPORT.SURFACE.109`). An item line at the level `PAGE`, `CONTAINER`, `WIDGET` or `GROUP` starts where what stands under it starts, and in a `flush` part it takes the inset of its place. The part that holds a title gives it its room, and an item line draws no padding of its own (`RULE.SUPPORT.SURFACE.175`). A card hands its size to what it holds, as a panel does (`RULE.SUPPORT.SURFACE.114`). A panel frames a part of a page. A card, `DSCard`, frames one thing: a record, an app, a file, a number. A card is told from a panel by level and purpose, and it takes `surface` and `frames` itself, all three parts where it names none (`RULE.SUPPORT.SURFACE.261`, `RULE.SUPPORT.SURFACE.262`, `RULE.SUPPORT.SURFACE.263`).
- **A page that holds several panels has its head above them, outside any frame, with its way back** (`RULE.SUPPORT.SURFACE.120`). It is an item line at the level `PAGE`. A page with one panel puts its head in the header of that panel. Write the title and the address to go back to, and no row, back button or padding for them.
- **Write no padding for tabs in a `flush` part, or for their panel** (`RULE.SUPPORT.SURFACE.118`). The first tab starts where the text under it starts, and the line of the tabs still reaches the edge.
- **A card may hold `DSCard.Header`, `DSCard.Content` and `DSCard.Footer`, and it still frames one thing** (`RULE.SUPPORT.SURFACE.091`). Its parts all sit inside its one frame, in every theme. A part pads itself, and `flush` on a part drops that padding, for a part whose content reaches the edge of the card. `divided` draws a line between each two parts. A part of a page that has a title, actions and data of its own stays a panel.
- **Write the parts in one order**: `DSPanelContainer.Header`, then `DSPanelContainer.Content`, then `DSPanelContainer.Footer`. A panel holds one or more content parts, and at most one header and one footer.
- **The page decides what fills a part.** Write `flush` on a part whose content reaches the edge of the frame, such as a table. A part without `flush` insets everything it holds.
- **In a `flush` part, a block that draws a border of its own draws none.** Those blocks are a table, a list, a code block, an accordion and an empty state. Every other block reaches the edge.
- **Write `divided` on a bordered panel only where it needs other lines than the default.** Unset, the frame draws a line between every two parts; `false` draws none; a list draws a line above each part it names, as `CONTENT` sets a second content, another task, apart. A sign-in's *Create an account* is such a content.
- **Never put a panel inside a panel.** A card, an accordion or a set of tabs goes inside the content.
- **Leave the look to the theme.** The look is `frames`, the one prop `surface` (an `IDSFrameSurface`, with the keys `color`, `strength`, `raised`, `elevation`, `bordered` and `rounded`, each optional) and `unframed`, which holds a part out of the frame. Set one on a panel only where that panel differs from the app; a `surface` key left out takes the theme's.
- **Write `unframed` for a part that no theme should frame on this page** (`RULE.SUPPORT.SURFACE.092`). It is a list: any of `HEADER`, `CONTENT`, `FOOTER`. A part listed there sits flat on the page, whatever `frames` and the theme give, and the rest of the look stays the theme's. One such part is a header that is the header of the page. The book states `unframed` before the web builds it, so say so where the tree writes it.
- **Write no color, no padding and no margin on a panel.** The gap between two blocks comes from the scale.
- **The book defines no block for a row or a grid of blocks in a part** (`RULE.SUPPORT.SURFACE.084`). The page writes it, with its gap from the scale, or uses a unit for it where its stack provides one.
- **A page may use no panel at all.** It may put a widget or a component straight into the content, or fill the area with one block.

## 4. Choose the pattern for each task

The app pattern says where the parts of the page sit. A task pattern says how each task inside those parts runs, and its *For* line says how it runs for the kind of person: for Everyday users a failure in everyday words with what to do next, one action at a time with undo before confirm, and a few options shown whole. Name each task in one verb. Most tasks are one of the intents below under another name: *search* is Find, *edit* is Enter and *delete* is Act.

| Intent | The person | Blocks that carry it | Task states |
| --- | --- | --- | --- |
| Move | goes to another place, and knows where they are | the layout · `DSNavList` · `DSNavMenu` · `DSNavBarSide` · `DSNavBarTop` · `DSTabs` · `DSBreadcrumb` · `DSLink` | working, then done or failed |
| Find | searches, filters, sorts and pages through records | `DSFilterBar` · `DSDataTable` · `DSCommandPalette` · `DSPagination` | all six |
| Read | reads records as a table, a list or a grid, or one record in detail | `DSTable` · `DSList` · `DSDataFieldView` · `DSEmpty` · `DSSkeleton` | all six |
| Enter | fills fields, sees the check on each one, and sends the form | `DSForm` and the entry fields | idle, working, then done or failed |
| Choose | picks one or many from a set | `DSSelect` · `DSRadioGroup` · `DSCheckboxGroup` · `DSToggleGroup` and the pickers; a record is chosen by `DSAutocomplete`, never a select (`RULE.SUPPORT.SURFACE.307`) | idle, then done. All six when the set is loaded |
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
- **Every overlay that covers a page dims it with one scrim.** A sheet that is not modal covers no page (`RULE.SUPPORT.SURFACE.093`): the tree writes `modal=false` on `DSSheet`, the sheet stands beside the page and draws no scrim, and the page stays usable. Plan it where a person works in the sheet and in the page by turns. On a phone a sheet stays modal. A popover draws no scrim either.
- **A toast and an alert take their icon from their hue, and the two draw one picture.** The toast is an alert that appears for a while and leaves, so no caller passes its icon.
- **Put nothing a person needs behind hover alone.** `DSTooltip` and `DSHoverCard` hold an addition, and never the one way to a thing.
- **Never invent a pattern for an intent the table holds.** A task that fits no intent is named in the result, and the page waits. A new intent joins the patterns chapter of the book first.
- **A row of a list ends with its actions** (`RULE.SUPPORT.SURFACE.071`). One action stands on the row itself, two or more go behind one action, and a press on a row opens the record. These three are proposed.

## 5. Then the blocks

Take each block from the tree by layer of the app pattern, and from the list its task pattern names. Write it by its name in the book, with each prop that differs from its default.

- **Go down the layers of the pattern's tree: the widgets, then the components.** Use the unit that step 2 chose for each part that holds many of one thing. Use the units the tree names for the rest.
- **Find a unit by the task's words before you look for it anywhere else: run `spn-surface unit find <words>`.** An ask names a task, not a unit, and a module or the design system may already hold the unit it needs. The command names the units whose name or line carries the words, best first, from the snapshot this plugin carries and the same symbol index `unit show` reads, each with its package, the repository it came from and the core block whose cases it leaves to; it opens no source. Place the unit it names rather than building it again from its block, and run `unit show` on it. Search the source for a unit only where `unit find` names none. From a workspace's root both commands read every member and name the one each unit came from; `--repo <name or path>` reads one alone. A note beside a Read of a unit's own `.tsx` says the same: run `unit show` on its name first.
- **For each block, run `spn-surface unit show <Unit>`, and give each closed prop the value of the first case that matches, naming the case** (`RULE.SUPPORT.SURFACE.375`). It prints the unit's props, their values and defaults, whether the library draws each, its usage, its cases with the rule each rests on, and its index by value, from the snapshot this plugin carries; it opens no source and no book. The same lookup serves every unit: a core unit prints its cases, and any other, the design system's own or a module's, prints its props from the symbol index of the repository it runs in, or, from a workspace's root, of each repository in it, each with its values, its default and its description, and names the core block its name's last word points to, whose table decides what its props do not (`RULE.SUPPORT.APPS.207`); run `unit show` on that block too. Read the cases from the top: the first that matches says each prop's value and who writes it, the page, the place, the level or the unit. Write only what the case gives the page; a value it leaves to the place or the level is not written by hand. A unit with no table says where its props come from: its size from its place, and a field's check from its `DSForm.Field`. The cases are a guide: start from the first case that matches, and a partner's choice stands where they keep it, written on the line as a kept line (`steps/given-design.md`).
- **Hold each small thing to its rule of content** (`standards-core.md`). A state is a badge on the line of facts, before the other facts, or at the end of the line, and the normal state shows none. A badge that names a kind draws `OUTLINE` in `DEFAULT`, a state takes the hue its meaning gives from the book's table, and a view holds at most one `SOLID` button (`RULE.SUPPORT.SURFACE.368`, `.369`, `.370`). A button with no `variant` draws `OUTLINE` outside a header or a footer, the tints `QUIET`, `SUBTLE` and `SUBTLE_OUTLINE` are the place's and not the page's, and a button's colour says its act: `PRIMARY` the main action, `ERROR` a main action that deletes or ends, `DEFAULT` every other (`RULE.SUPPORT.SURFACE.376`, `.379`, `.384`). What stands at the end of a line is the page's own: its actions, a badge, or both. A line that leads to a page shows the arrow where its end holds no action, and a line that has an action shows no arrow (`RULE.SUPPORT.SURFACE.059`, `RULE.SUPPORT.SURFACE.087`). A field a person enters is a `DSForm.Field`, and a field a person reads is a `DSDataUnit`, each with its title above. Readings stand in a grid. The choices of one set stand in columns.
- **Every control a person sets is a `DSForm.Field`**, a lone checkbox or switch too (`RULE.SUPPORT.SURFACE.169`, `RULE.SUPPORT.SURFACE.171`). A field with no label of its own keeps a blank label line, so it lines up beside labelled fields in a row; alone on its line in a column, write `showBlankLabel={false}`. A field's own action, such as *Forgot password?*, goes to `labelEndNode`, and never under the field. A switch and a checkbox take their own `label`.
- **A line of a list is an item line, `DSItem`**: a picture, a title, a line under it, and actions at its end. The header of a record has the same shape (`RULE.SUPPORT.SURFACE.064`).
- **Under the picture an item line holds its title, its description, then its line of facts.** The facts go to `facts`, and they stand under the description, so a line that has both shows both (`RULE.SUPPORT.SURFACE.086`). Write each fact as data, in one of four forms: plain words; `TEXT`, with a `label` and icons where it needs them; `BADGE`, with a `color`; or `CUSTOM`, a block of the page's own (`RULE.SUPPORT.SURFACE.096`). A fact whose value cannot be read alone, such as a count, a date or a person, carries its label before it, as *Members: 12*. A state is a `BADGE` fact.
- **Give the picture of an item line to `media` as data of one kind, and what stands at its end to `endNode`** (`RULE.SUPPORT.SURFACE.130`, `RULE.SUPPORT.SURFACE.131`). The kinds are `ICON`, `MARK`, `AVATAR`, `AVATAR_GROUP` and `CUSTOM`. A kind holds no size, because the item owns the size of its picture. `DSItem` takes no `startIcon` and no `actions`. `endNode` holds the actions of the thing, a badge, or both, and it stands outside the link of the line.
- **Write the `pageLevel` of an item line, and no size, type step, heading element, badge size or picture size for it** (`RULE.SUPPORT.SURFACE.094`, `RULE.SUPPORT.SURFACE.113`). `PAGE` is the head of the whole page. `CONTAINER` is the title of a panel, a dialog, a sheet or a drawer. `WIDGET` is the title of a widget or a card. `GROUP` is the title of an inner part of a widget, quiet only where no description stands under it. `CONTENT` is a row among others, and the default. `INLINE` is a value inside another unit, such as a row of a popover, a menu or a cell. The level alone decides the type of the text, the size of a badge among the facts and the box of the picture. The heading element follows the level (`RULE.SUPPORT.SURFACE.106`): `PAGE` the `h1`, `CONTAINER` the `h2`, `WIDGET` the `h3`, `GROUP` the `h4`. and a title in the header of a box takes the level its box gives (`RULE.SUPPORT.SURFACE.107`).
- **Give every level of a page its title** (`RULE.SUPPORT.SURFACE.112`). A page has one `h1` that names it, as an item line at the level `PAGE`. A panel that is the whole page says so with `fullPage`, and its header is then the page head, and any other panel is `CONTAINER` (`RULE.SUPPORT.SURFACE.107`, `RULE.SUPPORT.SURFACE.179`). A panel or a card that holds parts, or more than one content part, has an item line in its header, at the level its box gives. An inner part of a widget has an item line at the level `GROUP`, with the action of the group at its end.
- **An item line cuts nothing it draws, and the page decides what its words say** (`RULE.SUPPORT.SURFACE.111`). Write a short summary. Give the heads of a row of cards descriptions of one length where they should stand at one height.
- **Write the `pageLevel` of a row of tabs first, and a look only for a website's pages** (`RULE.SUPPORT.SURFACE.113`, `RULE.SUPPORT.SURFACE.209`). In an app, choose by level and write no `type`: the tabs that lead to the sub-pages of a whole page say `PAGE` and draw the pill, on its track and not raised (`RULE.SUPPORT.SURFACE.224`), and the tabs of the parts of a panel or of a card say `CONTAINER` or `WIDGET`, each drawing the line under the open tab; tabs that say no level draw the switch, for two ways to show one thing. The top bar of a website's pages writes `type={DSTabsType.PILL}`, the floating bar. Write `size` on a unit that takes a page level only to replace the size of its place; the level still raises it, one step for each level, `PAGE` three up to `INLINE` one down (`RULE.SUPPORT.SURFACE.315`). Write no colour on tabs: they take the theme's navigation colour and entry, neutral by default (`RULE.SUPPORT.SURFACE.214`); write `color` or `entry`, of the navigation's own types, only on a row that must differ from the navigation, such as a second row of tabs or the tabs of a busy card.
- **Write `showArrow` on a line that leads to a page and has no action at its end.** It is a chevron at the end of the line, and it is off unless the page writes it.
- **In a list the row carries the link, the chosen fill and the reaction to the pointer, and the item line inside it carries none** (`RULE.SUPPORT.SURFACE.097`). `DSItem` takes no `selected`: write `selected`, `anchor`, `endNode` and `showArrow` on the row, `DSList.Item`. A chosen row is drawn as a fill across the row, with no check. A row holds plain words, a line of facts through `DSItemFacts`, or an item line (`RULE.SUPPORT.SURFACE.132`). An item line that stands alone, in a card or a header, carries its own `anchor` and `showArrow`. Write `hoverable` on a `DSList` whose rows a person acts on; it is off by default.
- **A line of the `LIST` layout of `DSDataTable` is an item line too.** The page gives the title, the description and the facts of a record. The table's rows carry no padding of their own, and they answer the pointer as the rows of its table do.
- **Where a page shows one record beside the data table or under it, give the table the id of that record** (`RULE.SUPPORT.SURFACE.125`). It is `selectedRecordId` in the `data` of the table's config. The `LIST` and `TABLE` layouts draw its row as a chosen row of a list. The record in view is selected, and the records a person ticks are checked.
- **A card with a head, drawn from data, is `DSCardWidget`** (`RULE.SUPPORT.SURFACE.127`, narrowed by `RULE.SUPPORT.SURFACE.221`): a title with its mark, actions in the head, often titled parts. A card that shows its own info, such as a number with its caption, is a `DSCard`, however many stand side by side. Give it `header`, the props of `DSItem`, then `parts`, then `footer`, any node. A part is `ITEMS`, with item lines, `LIST`, with rows of a list, or `FREE`, with any node. The widget has no paging, no search and no working state: a set that needs them is a data table. The small head of a part takes `headerActions`, drawn as the head of a group (`RULE.SUPPORT.SURFACE.181`).
- **Subjects compared across the same settings are `DSComparison`** (`RULE.SUPPORT.SURFACE.181`). Give it `subjects` (each may carry its own `actions`, such as an Edit, which stand in its head and take their look from the place: `RULE.SUPPORT.SURFACE.193`), `groups` of rows (a data field's config with a value for each subject, or a `CUSTOM` row with a `renderer`, and a `compareValue` where its values are to be compared) and, where wanted, `differencesOnly`. It draws every value through `DSDataFieldView`, marks a value that differs from the most common value of its row, or from the subject `baselineKey` names (`RULE.SUPPORT.SURFACE.184`), and keeps the label column pinned.
- **A pitch is `DSFeature`, a section of a website is `DSSectionContainer`, and a grid of features under a heading is `DSFeatureGridSectionContainer`** (`RULE.SUPPORT.SURFACE.233`, `RULE.SUPPORT.SURFACE.243`, `RULE.SUPPORT.SURFACE.259`). A hero, the head of a section with its items, a closing call and the tile of an integration are each a `DSFeature`: the tree gives it data only (an eyebrow, a title, a description, facts, `items`, `actions`, a small `media` or a `mediaNode` of art) and its `pageLevel`, which alone sizes it. It chooses `type` for where the media stands (`ITEMS_SPLIT_END` and `ITEMS_SPLIT_START` stand the words across the feature and the items beside the media), `textAlign` for where the text lines up, `verticalAlign` for how the two columns of a split stand when one is taller, and `actionsPlacement` to put the actions before the items (`RULE.SUPPORT.SURFACE.248`, `RULE.SUPPORT.SURFACE.251`). The feature gives its items the level that follows its own, and a small picture takes one box per level (`RULE.SUPPORT.SURFACE.235`, `RULE.SUPPORT.SURFACE.274`). The items are one group, `items`, with the columns per screen class in `gridColumns` and the parting by `borderType` or a boxed `surface` (`RULE.SUPPORT.SURFACE.269`). A feature frames nothing unless the page lists its `frames`, and the theme holds no feature look (`RULE.SUPPORT.SURFACE.277`). A section sets one part of a page apart: a fill and the room of its `size`, holding one child (`RULE.SUPPORT.SURFACE.243`, `RULE.SUPPORT.SURFACE.247`); it reaches the edges of its place and stands straight in it (`RULE.SUPPORT.SURFACE.254`), and a `flush` section draws no room of its own on any side (`RULE.SUPPORT.SURFACE.313`). Which section a site's page takes, and its look, is its site pattern (`site-patterns.md`). The grid section takes `section`, `heading` and `grid` and leaves out `flush`. The data decides when a section is a grid section: a set of features that are each a thing of their own under one heading, while a `DSFeature` with items holds its own parts or points, with media or without. A section frames nothing, and what stands in it takes its depth from what it does for the visitor: a point flat, a door or a choice boxed and raised at `MD`, the product's media framed and raised, a photo flush (`RULE.SUPPORT.SURFACE.293`). A `TEXT` eyebrow at `PAGE` and `CONTAINER` stands out, and a state is a `BADGE` eyebrow (`RULE.SUPPORT.SURFACE.290`). A hero's state is a `PRIMARY` `BADGE` eyebrow and its stack is `OUTLINE` `DEFAULT` `BADGE` facts, a grid cell's eyebrow is its group or kind as text and a badge only when it says a state, and a plan holds one eyebrow, its name, with a second word such as Most popular as a `PRIMARY` `BADGE` fact (`RULE.SUPPORT.SURFACE.371`, `.372`, `.373`). A part with a title and actions is a `DSPanelContainer`.
- **A line that says roughly when a thing last changed may show how long ago it was** (`RULE.SUPPORT.SURFACE.122`). Write `type` as `AGO` on `DSFormatDate` or `DSFormatDateTime`. A page that is a log of what happened shows the date and the time on each line.
- **A mark says what, and an avatar says who.** `DSMark` holds an icon, or `text`, a symbol of one to three characters, such as a step's number or a file's type; it never holds a name. `DSAvatar` holds a picture or the initials of a person, a workspace or a company. Both take `color`, and `shape` as `CIRCLE`, `ROUNDED` or `SQUARE`.
- **A mark is round unless the page chooses another shape** (`RULE.SUPPORT.SURFACE.085`). Choose rounded or square where the thing is better shown so, such as an app or a file. Its `variant` takes the shared vocabulary, and `GHOST` and `LINK` draw the icon alone, with no fill (`RULE.SUPPORT.SURFACE.124`). A mark is never pressed.
- **`scaleSize` says how large a picture is drawn, and `size` stays the density step** (`RULE.SUPPORT.SURFACE.100`). `DSIcon`, `DSMark`, `DSAvatar` and `DSAvatarGroup` take it, from `XXS` to `XXL5`. Inside an item line the item gives the picture its scale size, so write none there. In a component of your own, a picture beside a title takes the scale size of the title's own step name (`RULE.SUPPORT.SURFACE.104`); `architecture-components.md` states what stands beside a heading.
- **A number of things that wait is `count` on the navigation entry or on the button**, never a badge the page places. The entry shows it as a quiet badge, and as a dot when shut; a button with a label shows a badge after it, and an icon alone a dot. Write it only where the data gives the number (`RULE.SUPPORT.SURFACE.050`).
- **A row that scrolls sideways is `DSHScroll`, with `arrow` where a pointer needs the arrows** (`RULE.SUPPORT.SURFACE.204`). Leave `arrowType` at `DEFAULT` on a page, a card or a section of the brand, and write `OVERLAY` only for a row over a picture. A row of tabs scrolls by itself.
- **An icon takes `tone` as a text does, and `tone` wins over `color`** (`RULE.SUPPORT.SURFACE.303`). A bare icon of an item line with no `color` and no `tone` draws muted; pass `color` `DEFAULT` for the colour of the title (`RULE.SUPPORT.SURFACE.304`).
- **Write no `variant` or `color` to make a mark, an avatar or a badge lighter on a coloured navigation or band.** A unit that is shown takes the lighter tints of the ground it stands on by itself, and a status badge keeps its hue (`architecture-core.md`).
- **Write no duration, ease or animation.** Each unit enters and leaves by its role, at the theme's `motionSpeed` (`standards-core.md`, *Motion*). An icon moves only through what holds it: write `motion` and `hoverNode` on `DSIcon`, `startIconMotion` or `endIconMotion` on `DSButton`, or `iconMotion` on `DSMark`, where the movement says something, such as `NUDGE_START` on a way back.
- **Give `DSDataTable` the layout that step 2 chose, and the `LIST` layout for a phone** (`RULE.SUPPORT.SURFACE.068`). Give `DSFilterBar` its fields, and say which stay in view. Never rearrange the bar (`RULE.SUPPORT.SURFACE.073`).
- **Where a ref says a unit does not do a thing yet, name it under *Missing*.** `architecture-components.md` says so plainly, under *Not there yet*. Write the tree as the pattern asks, and say which line waits for the unit.

- **`variant`, `color` and `size` each mean one thing on every block.** `variant` is the surface treatment, `color` is the hue and `size` is the density step, read smallest to largest, `XS` to `XL`, with `SM` the default a theme sets. Every value comes from the vocabulary of its prop. `CUSTOM` is a value of `color` that means the caller owns the colour: a page sets a colour outside the theme only through it, as `customColor` on a block that takes it.
- **Leave `size` unset**, unless one block must differ. A block takes the size that the panel, the card, the widget or the composite above it passes on, and then the app's.
- **A prop that takes a vocabulary is written with a value of that vocabulary.** `architecture-names.md` states the values, as `TWELVE_HOUR` or `TWENTY_FOUR_HOUR` for the `type` of `DSTimePicker`. Never invent a name or a switch for such a prop.
- **Write only props the book names.** Hover, focus and pressed are shown states. The platform produces them, and the tree never sets them.
- **A block drawn from data is a host and its items.** Write the host, and then one item for each entry you want shown. One item serves every host that takes one data shape — the three menus take one shape and share `DSMenuNode`. A host whose data differs declares its own item.
- **What a block does stays in words**: where an action leads, and which permission gates it. Write it beside the block.
- **A unit the stack's design system provides on its own is written by the name its stack gives it.** The book does not name it, and its stack's docs state its props. Say in the result that it is the stack's own, because another stack may not have it and the library holds no drawing of it.
- **A run of steps is `DSStepper`, given its steps as data** (`RULE.SUPPORT.SURFACE.308`): a sign-up or an entry in steps, or a timeline. Write its `pageLevel`, its `activeKey` and, where a person may return to a done step, `onActiveKeyChange`; a step's `taskState` takes `IDLE`, `WORKING`, `DONE` or `FAILED`, and the stepper invents no state of its own (`RULE.SUPPORT.SURFACE.309`). In a `DSFeature` it is the `contentNode`.
- **A block the design system lacks is never built inside the page.** Name it under *Missing*, with the task that needs it, and with each shared axis of the surface it would take and a reason for each it leaves out (`RULE.SUPPORT.SURFACE.316`, `architecture-components.md`). It is proposed to the design system: one that every stack should build joins the core units, in the book first, and one that helps a single stack may be that stack's own unit.

## 6. State the page as a tree

Write one tree for each page. It reads from the top level down: the page, the layout, each panel, then each widget or component.

**Write the kind of person and the flow first, then the facts above the tree, and then the pattern with its *For* line and its spec.** A reader of the result names who the page is for, its facts, its pattern and its tree by layer, in that order.

| A line of the tree | Is written as |
| --- | --- |
| The page | its route, its purpose in one sentence, its main action, and its app pattern; on a site's page, its kind of page and each section's site pattern |
| The layout | `DSLayout`, then its type |
| A block | its name in the book, then each prop the page writes as `name=VALUE`, and the case only where the page writes a value or a change or a kept line stands |
| A part of a block | the name of the part: `DSPanelContainer.Header`, or a named place of the layout. A part of a panel carries `flush` after its name, where the page writes it |
| Content | the text a person reads, in quotes |
| A placement of the page's own | `row`, `column` or `grid`, in lower case. It is no block, and it carries no look. Where the stack provides a unit for it, the tree may name that unit |
| A task | at the right of the block that carries it: the intent, and what the block does |

```text
kind     Team: the sales team use the app as their job, every day, trained,   the personas: Sales rep; rows SAL.ORD.*
         at a desktop; they never forgive a slow task they repeat all day
flow     Open one and come back, step 1: the list                             flow-patterns.md
facts    one order holds a number, a customer, a state, a total and a date     the contract
         the query takes a page, a text and a filter                          the contract
         the set grows as people work                                         the contract
         the sales team comes many times a day, to find one order             asked
pattern  Find in a list · For Team · Everyday users · spec: app-patterns/find-in-a-list.dg.json
shows    the orders: DSDataTable, layout TABLE, the Team's table that compares; on a phone, layout LIST

page  /orders · purpose: find an order · main action: New order · pattern: Find in a list
└── DSLayout  RAIL
    ├── startNode         DSText "Acme"
    ├── nav               items: "Orders" selected · "Customers" · "Reports"      Move
    ├── endNode           DSAvatar
    ├── actionsNode       DSButton "Help"
    └── content
        └── DSPanelContainer
            ├── DSPanelContainer.Header
            │   ├── DSItem    title="Orders"
            │   └── DSButton  color=PRIMARY "New order"                          Move · leads to /orders/new
            │       case: the main action, in a header (RULE.SUPPORT.SURFACE.390)
            ├── DSPanelContainer.Content
            │   └── DSFilterBar                                                  Find
            └── DSPanelContainer.Content  flush
                └── DSDataTable                                                  Find · Read
```

Under the tree, give one line for each task: what the person sees in each task state, and the way back from a failure. Then name what is missing.

For a flow, write the trees in the order a person meets the pages. Each Move names the page it leads to.

```text
Find · Read   DSDataTable   idle: the filters, with no search asked yet
                             working: the skeleton of the table
                             done: the orders, one row each
                             empty: nothing matches, and the filters stay shown
                             failed: what went wrong, and the search offered again
                             denied: the page says that the person has no permission
Move          New order      working: shown on the button · failed: the place says that it cannot be shown
Missing       nothing. The page reads the device and lists LIST on a phone, and gives the table a place in the panel's footer for its paging
```

## 7. Draw it in Figma — only where the window holds the connector

A tree is complete with no drawing. Draw it where the window holds the Figma connector and the developer asks for the drawing. Read `skills/design/steps/draw.md` then, and follow it. It draws the tree from the published libraries, by instances, with the look as theme modes. It then reads the page back by name. Where the window holds no connector, say so, hand over the tree, and offer the mock of step 8.

The page is a use case, composed from the published library in a file that is not a library file. It is never put into a library file. Where the drawing needs a block or a value the library lacks, that is a change of the library, and the connector makes it (`refs/support/surface/delivery-library.md`, under "A developer's hands are two, and you change the library through the connector"; before a connector write, read its heading "The connector's facts"). Read `skills/design/steps/change-library.md` and follow its walk, name the developer's next step, and show the result. A child agent that sends `use_figma` cannot read the connector's own skill, so give a writer of one page `skills/design/steps/writer-brief.md` with its order, and any other child `skills/design/steps/connector-rules.md`. Never ask a developer to draw, rebind or confirm anything in Figma: a developer's hands are two, saving a named version before the connector's first change in a library file, which the connector cannot save, and publishing a file. Nothing else is asked.

**Of units, the library draws the core units only** (`RULE.SUPPORT.SURFACE.082`). The book does not name a unit that a stack provides on its own, so the library holds no published component for one, and the order of a change does not bind it. Surface's core composites are `DSDataTable`, `DSFilterBar`, `DSComparison` and `DSFeature`, and its core widget is `DSCardWidget`. The unit that places a list beside the detail of its chosen row is the web stack's own, `DSListDetail`, so the library holds none for it (`RULE.SUPPORT.SURFACE.099`).

**The library draws nothing of a pattern** (`RULE.SUPPORT.SURFACE.099`). It holds the core units with their properties and their cases, the icons, and the places of the layout. It holds no task pattern, no app pattern, no skeleton and no sample page: a page or a pattern is composed from the published units on request. A stack's own unit that every stack should build joins the book first, and the library draws it then.

## 8. Draw it as skeletons — a mock, with no Figma

A mock is the tree drawn as skeletons, and it needs no connector. Draw it where the developer asks for a mock, or asks to see a page or a flow and the window holds no Figma connector. Read `skills/design/steps/mock.md` then, and follow it: the facts first, then one skeleton for each page in the order a person meets them, each move naming its page; each page drawn once, with its errors in place and its other states in words; a phone view only where the arrangement changes; each dialog or sheet as its own view; and a flow file that orders the pages. It reads the tree the steps above wrote, and decides nothing of its own.

## Close

- **Convene the `ux` and `ui` lenses over the tree at the design gate**, and over the drawing where one exists, and `marketing` as well on a marketing page. Run each through the `spn-panel` subagent, with the spn-devex plugin's `refs/devex/agent/lenses/ux.md`, `ui.md` and `marketing.md`. The context that designed the page does not review it.
- **Report** the kind of person and where it was read, the flow, the purpose, the facts, the pattern with its *For* line and its spec (or the patterns a page no pattern fits is derived from), the picture of each page, the tasks with their task states, and what is missing; the tree of each page is written for the build and shown in full when the developer asks. In the given-design mode, the reply is the one `steps/given-design.md` orders, and it stops before any code. Say which rule a choice rests on where that rule is proposed. For a drawing, add the read-back and each difference from the tree. For a mock, add its files in the flow's order, each with its views. Then give the findings of each lens.
- **Hand off by name.** The `implement` skill builds the page, in its `ui` step.

## Lenses

Wear the spn-devex plugin's `refs/devex/agent/lenses/ux.md` while you place the page — its purpose, pattern, containers and tasks — and `refs/devex/agent/lenses/ui.md` while you choose the blocks, their props and their look. On a marketing page, wear `marketing.md` while you write its words. The close convenes the same lenses at the design gate.

**This file and its step are the standard for anyone reading them.** Their provenance is the foundation book's Surface chapters: standards, interaction, patterns, names, layout and container, and the design library. Those chapters carry the reasoning behind each rule, for a reader who holds the book. Nothing here is deferred to them.
