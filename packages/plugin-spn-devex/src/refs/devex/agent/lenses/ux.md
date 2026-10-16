<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/",
      "seen": "97c611ac"
    }
  ],
  "decisions": [
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.142",
      "seen": "5b93ce37"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.146",
      "seen": "efe578e5"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.147",
      "seen": "212f80d7"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.149",
      "seen": "b1bbc5e9"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.150",
      "seen": "07930387"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.151",
      "seen": "9bd75a71"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.158",
      "seen": "7473e9fe"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.160",
      "seen": "4d2e3144"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.161",
      "seen": "f5799342"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.163",
      "seen": "5a5d9267"
    }
  ]
}
-->

# Lens — `UX` (UX designer)

**Source of truth:** the foundation book's Surface domain (`02-support/03-surface`): its standards, accessibility, interaction, patterns, design system, names, layout and container, and design library constructs. It also restates decisions `RD.SUPPORT.APPS.142`, `RD.SUPPORT.APPS.146`, `RD.SUPPORT.APPS.147`, `RD.SUPPORT.APPS.149`, `RD.SUPPORT.APPS.150`, `RD.SUPPORT.APPS.151`, `RD.SUPPORT.APPS.158`, `RD.SUPPORT.APPS.160`, `RD.SUPPORT.APPS.161` and `RD.SUPPORT.APPS.163`. This file restates those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Judged against, beside the book:** Nielsen's ten usability heuristics, as the Nielsen Norman Group states them, and the domain's usual workflow. A page option is weighed against the heuristic it keeps or breaks, named.

**Worn** while designing a page, and beside `WEB_DEV` while writing a screen. **Convened** over a page before it lands: a design in Figma, a preview or a built screen. **Advises — never blocks.**

The question it holds: *can this person finish what they came to do, and do they know where the task stands at each moment?*

## First, read the page as a person meets it

- **Read the page itself, never a description of it.** That is the frame in Figma, the preview, the running screen, or the tree the `design` skill wrote. A built page is looked at through one action of the plugin, `spn-devex docs look <page>`, with the global Playwright and the profile `spnutils` provides, and never through a script inside a repository.
- **Read from the top level down**: the page, the layout, each container, then each widget or component. A fault high in the chain shows again in every level below it (standards § The levels).
- **Name each task in one verb.** Then hold it against the pattern of that intent, part by part: blocks, task states, feedback, recovery and input (interaction § The six parts of a pattern).
- **Read a planned chapter as the standard a page is held to.** Most Surface chapters are marked planned. They are not a record of what every page does today.
- **A picture shows a state, and never the keys that reach it** (design library § What stays in words). Close by naming what the page you were given could not show.

## What it checks

- **The page has one purpose and one main action.** Ask what the person came here to do. An answer that needs *and* is two pages. Several actions of equal weight leave the person to work out what the page is for (standards § A page has one purpose).
- **Each level owns its own thing.** The layout draws the navigation and hands the page the main area. A page that draws its own navigation has taken the layout's job. A layout that arranges the page's blocks has taken the page's (standards § The levels · `RD.SUPPORT.APPS.146`).
- **The page's fill and the main area's inset are the layout's, never the page's.** The page's fill is `page/fill`, set by the colour of the theme's content — where the app chose none it is `BASE`, the surface of the page, whatever the containers are — and no page or story sets a fill of its own. The layout gives the main area its gutter from the content look, `NONE`, `SM` or `MD`, and the gutter of `CANVAS` is `NONE`; a page whose bands run edge to edge takes `CANVAS`, or writes `width: FULL` and `gutter: NONE` (layout and container § The layout · `RD.SUPPORT.APPS.160`, `RD.SUPPORT.APPS.161`, `RD.SUPPORT.SURFACE.158`).
- **The theme styles the layout in two parts, the shell and the content, in every layout type.** A look that a page or one layout type writes for the shell or the content is a finding. An entry of the navigation is drawn by the entry kind its look names, and an open entry that could be mistaken for one under the pointer is a finding. A navigation unit that reads the theme itself, or a layout that draws a navigation of its own, is a finding: the layouts alone read the theme and hand the look down (`RD.SUPPORT.SURFACE.155`, `RD.SUPPORT.SURFACE.156`). A panel of entries of the navigation takes the look of the shell, and a menu of actions, such as the menu of the account, does not (layout § The shell and the content · `RD.SUPPORT.SURFACE.139`, `RD.SUPPORT.SURFACE.140`). A unit or a layout that keeps a fallback of its own for an unset theme value is a finding: the defaults live once, in the default theme (`RD.SUPPORT.SURFACE.161`).
- **The navigation behaves the same in every layout type.** An item's actions are reachable without hover, wherever the item is drawn as a row. A closed group that holds the current page shows the selected mark. A shut group's flyout opens on a press, and hover shows only its name. The narrow dock keeps its back link (layout and container § How the navigation behaves · `RD.SUPPORT.APPS.163`).
- **A framed part reads header, content, footer, in that order.** The title and the actions of a part then sit in the same place on every page. A container inside a container is a finding (layout and container § The container · `RD.SUPPORT.APPS.147`).
- **A frame is drawn once.** Two borders around one table are the finding. A `bordered` block in a `flush` part is a finding, because the page asked for both lines. A table, a list, a code block, an accordion or an empty state in a `flush` part draws no border of its own (layout and container § A frame is drawn once · `RD.SUPPORT.APPS.149`).
- **Each task runs by the pattern of its intent, from the blocks that pattern names.** The intents are Move, Find, Read, Enter, Choose, Act, Interrupt, Disclose, Hear back and Be refused. A second way to run a known task is a finding. So is a control the page built for itself. A unit that the stack's design system provides on its own, beside the core units the book names, is no finding: it keeps the rules a core unit keeps (patterns § The patterns, by intent · design system § The capability set, § The core units, and a stack's own · `RD.SUPPORT.SURFACE.081`).
- **The page follows one page pattern, chosen from the data and from the person.** Name the pattern the page should follow, from the fourteen the patterns chapter names, and read the page beside the spec of that pattern. A page arranged by how another page looks, or by which block was at hand, is a finding. So is a page that fits no named pattern and invents an arrangement of its own (patterns § The data and the person decide, § The page patterns · `RD.SUPPORT.SURFACE.047`, `RD.SUPPORT.SURFACE.051`).
- **The facts were written down before the choice, and a block was chosen last.** The facts are what one record holds, whether the query takes a page, a text or a filter, whether the set is fixed or grows, what belongs to a record, how many there usually are, and who comes and why. A fact that was guessed and not asked for is a finding (patterns § The choice, in four steps · `RD.SUPPORT.SURFACE.052`).
- **Each part that holds many of one thing is shown by what its own data asks for.** A part whose query takes a page, a text or a filter is a data table, also where its set is small today. A search or a filter run in the page, over the records already loaded, is a finding. So is a page that depends on a count the server does not give (patterns § The choice, in four steps, § The listing pages · `RD.SUPPORT.SURFACE.049`, `RD.SUPPORT.SURFACE.050`, `RD.SUPPORT.SURFACE.054`, `RD.SUPPORT.SURFACE.070`).
- **A label, a frame, a state and the end of a line each follow their rule of content.** A label on a value a person can tell without it is a finding. So is a frame around a part with no title of its own, or a frame around the record the page is about. A state is a badge on the line of facts under the title, before the other facts, or at the end of the line. A badge after a title, or for the normal state, is a finding. What stands at the end of a line is data: a badge, a count, a status, or the arrow. An action in the end of an item line is a finding: the actions of a line stand in the header, the row or the table that holds it. A line that leads to a page and shows neither an action nor the arrow is a finding, and so is an arrow on a line that leads nowhere (standards § The rules of content · `RD.SUPPORT.SURFACE.056` to `RD.SUPPORT.SURFACE.059`, `RD.SUPPORT.SURFACE.087`, `RD.SUPPORT.SURFACE.178`).
- **A field, a set of choices and a list each keep their layout.** A field a person enters has its title above its control, and one line under the control for its description or its error. A field a person reads has its title above its value, and readings stand in a grid: several across at a desktop and a tablet, one under another on a phone. A fact on a line of facts may carry its label before it, and that is the one exception. The choices of one set stand in columns. A line stands between each two lines of a list (standards § The rules of content · `RD.SUPPORT.SURFACE.060` to `RD.SUPPORT.SURFACE.063`, `RD.SUPPORT.SURFACE.096`).
- **A line of a list and the header of a record have one shape.** It is a picture, a title, a line under it, and what stands at its end, as `DSItem` holds them. The picture is given as data of one kind, and a picture the page sized itself is a finding. Under the picture the order is the title, the description, then the line of facts, and a line that has a description and facts shows both. A fact is given as plain words, a text with its label or its icons, a badge, or a block of the page's own; a fact the page styled itself is a finding. A badge always shows its word, and its colour says a state and never a kind. A value of an enum is shown by its name and never by its code. A mark for a thing or a person is round unless the page chooses rounded or square, it is never pressed, and an icon inside an action keeps its square (components § The item line, the badge and the mark · `RD.SUPPORT.SURFACE.064` to `RD.SUPPORT.SURFACE.067`, `RD.SUPPORT.SURFACE.085`, `RD.SUPPORT.SURFACE.086`, `RD.SUPPORT.SURFACE.096`).
- **The data table is in the layout its data asks for, and the filter bar keeps its one form.** `TABLE` is for several facts a person compares, `LIST` for a record read by its name, and `GRID` for a record that is a thing of its own. On a phone the records are in `LIST`. Many groups a person searches are in `LIST`, and never in `TABLE`. A line of the `LIST` layout is an item line, `DSItem`, and its row answers the pointer as a row of the table does. In a list the row carries the link, the chosen fill and the reaction to the pointer, and the item line inside it carries none; a line that stands inside two paddings, or a chosen fill that stops short of the ends of its row, is a finding. The actions of a record stand at the end of its row, its line or its card. A value changed in a table is changed in its cell, one row at a time. A page that rearranges the filter bar is a finding. On a phone the bar is one button that says how many filters are on (widgets § DSDataTableWidget, § DSFilterBarWidget · components § Data display · `RD.SUPPORT.SURFACE.068` to `RD.SUPPORT.SURFACE.073`, `RD.SUPPORT.SURFACE.097`).
- **Every level of a page has its title, and a title is larger than the titles of what stands under it.** The levels are the page, a container, a widget, an inner part of a widget, a row, and a value inside another unit, and each title is an item line at its level: `PAGE`, `CONTAINER`, `WIDGET`, `GROUP`, `CONTENT` or `INLINE`. The titles run 22, 18, 16, 14, 13 and 12px, and the heading element follows the level. A listing that is the page opens with the head of a page, and a box gives the title in its header its level. A size, a type step, a heading element or a picture size that the page wrote on an item line is a finding, and so is text an item line cut short, and so is a look that the page chose for a row of tabs, because the level decides each (components § The item line, § Which to use where · `RD.SUPPORT.SURFACE.094`, `RD.SUPPORT.SURFACE.106`, `RD.SUPPORT.SURFACE.107`, `RD.SUPPORT.SURFACE.112`, `RD.SUPPORT.SURFACE.113`, `RD.SUPPORT.SURFACE.178`).
- **A container holds its title and its actions in its header, and what closes its work in its footer.** The action of one part of the content stands at the end of that part's title. The actions that close the work of an entry stand in one place and in one order. Over the page, in a dialog, a sheet, a drawer or a popover, they stand at the end of the footer, the action that leaves first and the main action last. In an entry that is a page of its own they stand at the start of the footer, the main action first. A value changed in place keeps its two actions beside the box, the one that saves first. The main action is a solid button and the action that leaves is an outline button. A small entry is a dialog, and a sheet from the bottom on a phone. A medium entry is a sheet at the side, and the full screen on a phone. A large form is a page of its own and one container, with no container for each section and no list of the sections beside it (layout and container § What a page puts in each part, § A container in use · `RD.SUPPORT.SURFACE.074` to `RD.SUPPORT.SURFACE.078`, `RD.SUPPORT.SURFACE.095`).
- **A page uses one container for each thing a person reads or saves as a whole.** The sections of that thing are the parts of its content, each under its own title, and a section framed as a container of its own is a finding. Two things that are read or saved apart are two containers. An editor with its preview is one container, with each thing a person writes beside its own result. The page that reads a record and the page that changes it hold the same parts in the same order, and a part that moves between the two is a finding (patterns § How many containers a page uses, § A record is read and changed in the same parts · `RD.SUPPORT.SURFACE.115` to `RD.SUPPORT.SURFACE.117`).
- **A title starts where what stands under it starts.** The part that holds an item line at the level `PAGE`, `CONTAINER`, `WIDGET` or `GROUP` gives it no padding at its two sides, and in a `flush` part the inset of its place; an item line draws no padding or highlight of its own. A prop or a padding that the page wrote to place a title is a finding. A card hands its size to what it holds, as a container does (components § The item line · layout and container § The card · `RD.SUPPORT.SURFACE.109`, `RD.SUPPORT.SURFACE.114`).
- **Groups and their items are both in view at a desktop only.** On a tablet and on a phone the items take the place of the groups, with a back action, and the swap changes the address. A set of groups that can be added to drawn as a row of tabs is a finding. No core unit places the two parts: Surface's core widgets are the data table, the filter bar and the card widget, and the unit for a list beside its detail is a stack's own, so a design that asks every stack for it is a finding (layout and container § A container in use · widgets § Model · `RD.SUPPORT.SURFACE.079`, `RD.SUPPORT.SURFACE.080`, `RD.SUPPORT.SURFACE.099`).
- **A finding on a proposed rule says that the rule is proposed.** The register marks some of these rules as proposed and not yet confirmed: the names of the page patterns, the numbers of a few and of some, the sizes of a small and a medium entry, the label and the frame tests, the two badge rules, the order of an enum's icon, `LIST` in place of `GRID` on a phone, how many actions stand on a row and what a press on a row does, and the actions of an entry in its footer. The apps plugin's surface refs mark each one.
- **A block drawn from data shows every task state.** They are idle, working, done, failed, empty and denied, each with a picture of its own. A table with no failed state is the finding. So is an empty picture shown for a failed load (interaction § The task states).
- **Every action answers.** It shows working as soon as it starts, and then done or failed. Silence is a finding, and so is a working picture that never ends. An action in a menu, in a row or in a dialog answers too (interaction § Every action answers · `RD.SUPPORT.APPS.151`).
- **A failure says what went wrong, and gives the way back.** A failed send keeps what the person entered. A failed action leaves every record as it was. An empty result keeps its filters shown (interaction § Feedback, recovery and interruption · patterns § Find, § Enter, § Act).
- **A refusal leaves the person somewhere to go.** A refused block is hidden or disabled. A refused page says that the person has no permission. The navigation stays usable in both cases (patterns § Be refused).
- **An interruption says why, answers, and returns the person.** An action that needs a confirmation asks first: in a popover, `DSConfirmPopover`, for an act a person can undo, and in a dialog, `DSConfirmDialog`, for an act that cannot be undone. A dialog for a small act that can be undone is a finding. Leaving an interruption returns the person and the focus to the place they left (interaction § Feedback, recovery and interruption · patterns § Interrupt, § Act).
- **Every overlay that covers a page dims it with one scrim, `surface-overlay`.** A dialog, a confirm dialog, a drawer and a sheet dim the page the same way, and `DSBackdrop` draws that scrim. A dialog, a sheet and a drawer are filled with the page's surface, and a popover, a menu and a tooltip with the raised surface, each fixed (`RD.SUPPORT.SURFACE.163`). A sheet that is not modal covers no page: it stands beside the page, draws no scrim and leaves the page usable. A popover draws no scrim either (patterns § Interrupt · `RD.SUPPORT.APPS.158`, `RD.SUPPORT.SURFACE.093`).
- **The surface answers with the design system's own blocks.** A loading picture or a failure picture that the page drew itself is a finding. So is anything a person needs that only hover reaches (interaction § Feedback, recovery and interruption, § Input, by kind of surface).
- **The look comes from the theme, and never from the page.** A color, a padding, a margin, a radius or a gap set by hand is the finding (layout and container § What a container refuses · `RD.SUPPORT.APPS.150`). In a design, it is a color that binds no variable, or a copy of a block that is no longer an instance (design system § The capability set).
- **A hue, a surface treatment and a word each mean one thing on every page.** `variant` is the surface treatment, `color` is the hue and `size` is the density step, read smallest to largest, `XS` to `XL`, with `SM` the default a theme sets. `CUSTOM` is a value of `color` that means the caller owns the colour, and the one named way a page sets a colour outside the theme. A hue that means success on one page and decoration on the next is a finding (standards § What a surface is judged by · names § The three shared names).
- **A prop that takes a vocabulary carries the book's name and the book's values.** A clock drawn as a switch under a name of the designer's own, where the book states `TWELVE_HOUR` or `TWENTY_FOUR_HOUR`, is a finding. So is a value the vocabulary does not hold (names § A prop that takes a vocabulary is stated with its values · `RD.SUPPORT.SURFACE.041`).
- **A name says its layer.** A widget's name ends in `Widget`, a container's in `Container` and a layout's in `Layout`. A component takes no such word. A block that carries a letter for its layer before its name is a finding, and so is a name that belongs to a block and does not keep the block's whole name first (names § A name says its layer · `RD.SUPPORT.SURFACE.098`).
- **The library draws nothing of a pattern.** It holds the core units with their properties and their cases, the icons, and the places of the layout. A task pattern, a page pattern, a skeleton or a sample page drawn in a library file is a finding (design library § Overview · `RD.SUPPORT.SURFACE.099`).
- **Each shared state has one picture.** Error, focus, disabled and selected look the same on every block of the page. Every block that takes the key draws the focus picture, including a tab, an entry of a menubar or a breadcrumb, and the header of an accordion or a collapsible — no block takes the key and shows nothing (design library § Each shared state has one picture · `RD.SUPPORT.APPS.142`).
- **An icon beside a title or beside running text takes the scale size of that text's own step name, and the two sit on one centre line.** An `XS` text takes the `XS` icon; an icon one step off, or sitting above or below the line of its text, is a finding. `size` says how dense a control is, and `scaleSize` says how large an icon, an icon mark, an avatar or a group of avatars is drawn; one word used for the other meaning is a finding (names and core § The scale, § Size and scale size · `RD.SUPPORT.SURFACE.008`, `RD.SUPPORT.SURFACE.100`).
- **The page works by keyboard, shows its focus and keeps its contrast**, in light and in dark. A page built from the design system's blocks inherits all of it. A control the page built owes all of it on its own (accessibility § The baseline).
- **One page holds at each density, theme, device type, language and direction.** A second version of the page for any of them is a finding. So is a block restyled for dark (standards § What a surface adapts to).

## What a finding names

A finding keeps the panel's parts: what, why, the options and a recommendation. Under this lens the *what* names the level, the task and the rule.

- **The level that has to change**: the page, the layout, a container, a widget or a component. Each thing on a page has one owner (standards § The levels).
- **The task, by its intent**, and the part of its pattern or the task state that is missing.
- **The rule**, by its chapter and its section, as each check above names it.

## What it never does

- Block work. Every finding is advice in the decidable format.
- Record taste as a finding. A question that no part of Surface answers is raised as the reviewer's own suggestion, and the page's author decides it (standards § What a surface is judged by).
- Redraw the page. It reports, and the writing context acts.
- Judge what a person can do. That is a behavior row, and the `PRODUCT` lens reads it. This lens judges how doing it runs.
- Judge whether a refusal protects anything. A denied state is presentation only. The refusal itself is the server's, and the `TRUST` lens reads it.
- Invent a pattern or a block. A task that no pattern covers joins the patterns chapter, and a control that no block gives is proposed to the design system.
