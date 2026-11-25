<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/01-common/04-site-container-kinds.md",
      "seen": "6b0b5ba2"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/02-web/02-site-container-kinds.md",
      "seen": "e36e6c76"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/01-common/02-site-page-kinds.md",
      "seen": "3420aa04"
    }
  ]
}
-->

# Site Container Kinds — One Shape for Each Section of a Site

Source of truth: the foundation's container kinds chapter (`docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/01-common/04-site-container-kinds.md`), the web's part of it (`docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/02-web/02-site-container-kinds.md`), and the chapter of the site page kinds (`docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/01-common/02-site-page-kinds.md`), chapters of the Surface Catalogue. The specs of the container kinds are the book's `site-container-kinds/` folder, which this plugin carries as a copy in `refs/support/surface/site-patterns/`.

A section of a site's page is a site category's container kind, and the page kinds of a site each order their sections. Container kinds belong to the surface categories MARKETING, RESOURCES and MARKETPLACE, the sites. An app's screens take app page kinds, which `standards-patterns.md` restates; the flow patterns are `flow-patterns.md`.

Read this before you design or review a page of a site. A site's page is a run of sections, and each section answers one question a reader asks. When each section is arranged from nothing, two sections that hold the same kind of content come out different. So you choose a section's shape by reading what it holds, and you review a page by naming the container kind each section should have followed.

## Terms

| Term | What it means |
| --- | --- |
| Container kind | the shape of a section of a site's page, chosen by what the section holds |
| Section | one part of a site's page: a `DSSectionContainer` with its fill and its room, holding one `DSFeature` or a `DSFeatureGridSectionContainer` |
| Highlight | the one section of a page whose whole feature stands in one raised frame, in the form the design language sets |
| Content signals | the twelve questions asked of a section, in order, whose first yes names its container kind |
| Site page kind | a page's job at its level of the site, such as a Home or a Topic, which sets the order of its sections |
| The head across | a form of `DSFeature` for long words beside a picture that draws the items: the head across the full width, the split under it |

## A container kind — 🔮

**A container kind says: for this kind of content, show the section this way** (`RULE.SUPPORT.SURFACE.340` · MUST · skill:spn-surface/design). It is an arrangement of units the design system already has, and the design system builds nothing for one.

- **A section of a site's page follows one of the site container kinds below, and is built from `DSSectionContainer`, `DSFeature` and `DSFeatureGridSectionContainer` and their props** (`RULE.SUPPORT.SURFACE.340` · MUST · skill:spn-surface/design). A container kind names no component of one site's own. A partner's agent has the design system and this plugin, and never another site's code, so a look stated in a site's own component is a look it cannot build.
- **A page whose sections follow site container kinds MUST be wrapped once in `DSSitePage`** (`RULE.SUPPORT.SURFACE.196` · MUST · skill:spn-surface/design). The wrapper marks the page as a site's, a marketing page or a page of docs in a web app, so its display steps draw in the theme's display family; a page that follows an app page kind or a task pattern is never wrapped, a public sign-in page included.
- **A section's container kind and its look follow from what the section holds, and not from where it stands on the page** (`RULE.SUPPORT.SURFACE.343` · MUST · skill:spn-surface/design). Every partner builds around their own content, so a rule by position, such as *every second section is filled*, fits nobody's page.
- **Every container kind names the persons it serves in its For line** (`RULE.SUPPORT.SURFACE.332` · MUST · skill:spn-surface/design). A site's page is read by a Visitor, who is deciding, a Learner, who came to learn or to get a thing working, or a Seeker, who came to find one record among many and choose it (`standards-core.md`, *Who an app is for*).

## How a site's section is chosen — 🔮

Two answers come before any section is chosen. Who the app is for is read once, for the whole app. The flow says which step of a person's path the page is (`flow-patterns.md`). Then the page itself is read for what it is for: a doc, an app's screen or a marketing page (`standards-core.md`) (`RULE.SUPPORT.SURFACE.208` · MUST · skill:spn-surface/design). An app's screen takes an app page kind. A doc and a marketing page take site container kinds.

Then ask these questions of each section, in this order, and stop at the first yes (`RULE.SUPPORT.SURFACE.343` · MUST · skill:spn-surface/design). These are the content signals.

| # | The question | Yes means |
| --- | --- | --- |
| 1 | Does the section say what the page is, as its first words? | Hero |
| 2 | Is it the page's last call to act, and nothing else? | Closing call |
| 3 | Is it words alone, read whole? | Statement |
| 4 | Is it real code the reader reads line by line? | Real sample |
| 5 | Does the reader's press change what is shown? | Choose to see |
| 6 | Is each item a thing of its own, with more than a title and a line: its own picture, mark, facts or page? | Feature grid: a set, shown features, a directory, plans or quotes |
| 7 | Does each item open another page? | Doors |
| 8 | Do the items run in an order the reader follows? | Steps |
| 9 | Are they numbers read from the real system? | Numbers |
| 10 | Are they questions with answers? | Questions |
| 11 | Is there one picture the words introduce? | Show it |
| 12 | None of these | Points |

The order matters. A grid of things that each open a page is a Feature grid and not Doors, because question 6 comes first. A row of numbers in the order a reader follows is Steps, because question 8 comes before question 9. Once the pattern is named, the section answers the questions of its look, in the order *What holds across* gives: the fill, the size, the highlight, the gradient, the media, the shape, the alignment and the columns. The footer is the exception: it ends every site's page, so no question chooses it.

## The kinds of page, by level — 🔮

**The site page kinds, with their sections in the order of their reader's questions, are the catalogue's, and this ref holds no copy of them** (`RULE.SUPPORT.SURFACE.601` · MUST · skill:spn-surface/design). Read a category's with `spn-surface catalogue show <CATEGORY> PAGES` (MARKETING, MARKETPLACE or RESOURCES), and one kind whole, with its cases, with `catalogue show <CATEGORY> PAGES <KIND>`. The rules that hold across them follow.

- **A kind of page orders its sections as its reader asks their questions, and does not count them** (`RULE.SUPPORT.SURFACE.340` · MUST · skill:spn-surface/design). A page skips a question its reader does not ask. A count of sections would make a page add a section with nothing to say, or cut one a reader needs.

- **A resources site's Home is a hub only where it holds several sets, and a small product makes its one set the whole site** (`RULE.SUPPORT.SURFACE.617` · GUIDE): `HUB`, one search across every set, a door to each set with its count, what is new, and *Still need help?*; `ONE_SET`, the set's own Group home at the first level. A set's Group home takes the case of its purpose, `HELP`, `DOCS` or `GUIDES`, and a resources site keeps no blog of its own: the Blog is `MARKETING`'s.
- **A site holds the floor's Server error and Maintenance beside Not found** (`RULE.SUPPORT.SURFACE.605` · MUST · skill:spn-surface/design). Server error stands in the site's layout where it can still be drawn, and Maintenance on `CANVAS`.
- **A Listing narrowed from a category, a brand or a shared link is the same page, the case `NARROWED`**, because the filters chosen are the page's address; there is no Results kind.
- **A help centre always draws `DSBreadcrumb` under the bar, one link for each level above the page and the page itself unlinked, and so does any site whose bar does not list its groups or that runs deeper than three levels** (`RULE.SUPPORT.SURFACE.598` · MUST · skill:spn-surface/design). Any other site may draw none.

## The kinds of page of a marketplace — 🔮

A marketplace's page kinds, in the groups Find, Choose and Act, are `spn-surface catalogue show MARKETPLACE PAGES`; what needs a person's account opens in PORTAL after sign-in.

## The sections, by name — 🔮

**Each container kind, with its units, placement, style and cases, is the catalogue's**: `spn-surface catalogue show <CATEGORY> CONTAINERS` lists them, and `catalogue show <CATEGORY> CONTAINERS <KIND>` gives one whole. Under each name below stand only the rules that kind carries.

- **Features that each answer their own question stand in sections of their own; one section holds several features only when they answer one question** (`RULE.SUPPORT.SURFACE.593` · MUST · skill:spn-surface/design). On the same fill the sections share one background, and `parting` `HAIRLINE` marks where each ends. The closing call is the one exception: it may hold the page's highlight above its call.

### Hero

- **Look.** `DSSectionContainer` `size` `LG`, or `XL` where the hero is the page's emphasis, `color` `BASE`. Inside it, a `DSFeature` at `pageLevel` `PAGE`. The media keeps the frame of its kind: a product is `frames` `MEDIA` with `surface` raised, `elevation` `LG`; a diagram is flat; a mood picture is `type` `BACKDROP`. Use `type` `SPLIT_END` for one picture the title names, and `MEDIA_BOTTOM` for two panes or a wide picture. Centre the words, `textAlign` `CENTER`, only when nothing stands beside or under them. A state such as Alpha is a `BADGE` `eyebrow` in `PRIMARY`, at the level's `variant`. The stack names kinds, so it goes in up to four `BADGE` `facts`, each `OUTLINE` in `DEFAULT` (`RULE.SUPPORT.SURFACE.371` · GUIDE). The actions are the page's one `SOLID` primary, then one `OUTLINE`. With items, use `actionsPlacement` `BEFORE_ITEMS`. A hero takes no `reveal`.

### Points

- **Before and after.** The old way against the new is Points, and never a table. Each point is a question the reader asks: its line is the new way's answer, and the old way is a text fact labelled *Today*. A data table is an app's reading unit and never draws a site's section (`RULE.SUPPORT.SURFACE.293` · MUST · skill:spn-surface/design).

### Show it

- **Look.** A `DSFeature` with `mediaNode`. The frame follows the kind of the media (`RULE.SUPPORT.SURFACE.293` · MUST · skill:spn-surface/design): a product is `frames` `MEDIA`, `surface` raised, `elevation` `MD`, or `LG` in the page's emphasis; an illustration or a diagram is flat on the section; a photo is flush and rounded; code panes are flat, each as tall as its lines. Use `type` `SPLIT_END` when the picture is one thing the title names and reads at half width, about 630px at 1440; `MEDIA_BOTTOM` for two or more panes compared, a wide table or chart, or four thumbnails. Points go beside the picture as a `LIST`, or across above it as a `GRID`. Where the picture and the words differ in height, `verticalAlign` stands the shorter against the taller: a picture shorter than its words takes `CENTER`, the default, or `BOTTOM` where it draws the points and its foot meets the last of them; a picture taller than its words takes `TOP`. Where the words run long and the picture draws the points, use the head across. `reveal`: `text` `RISE`, `media` `FADE`, `items` `RISE`. The fill is `BASE`; `DEFAULT` only where the neighbours hold another kind of reading.

### Choose to see

- **Under.** `type` `MEDIA_BOTTOM`, and the `mediaNode` is a `DSTabs` at `pageLevel` `CONTAINER` with `type` `PILL`, the look of a website's pages (`RULE.SUPPORT.SURFACE.209` · GUIDE); the level gives its size, and it stands grouped on its track. Tab names are short, one or two words. The tabs only choose which panel is open, and the open tab's panel is the page's own node: the tab's line, one description that says what only this part says, then its picture at the feature's full width. The line and the description are the page's words at the title and description steps of `WIDGET`, so no tab and no `DSFeature` prop is needed. Every panel's picture is one shape, so the section does not jump as the tabs change, and each has its own alt.

### Doors

- **Look.** The items are boxed and raised `MD` on the fill that stands off the section: `items.surface` `color` `DEFAULT`, raised, `elevation` `MD`, on a `BASE` section (`RULE.SUPPORT.SURFACE.293` · MUST · skill:spn-surface/design). Each item has an `anchor`. A door stands for a page of its own, so where it has a picture, the picture is a mark, `media` `MARK`. Each may end on an `endNode`: `ARROW_UP_RIGHT` when it leaves the site, `ARROW_RIGHT` inside it. `GRID` columns follow the count, as for Points. Use a `LIST` when each door names a person or carries a long line. A door does not stand on a filled section. A button beside the doors opens a different place, such as the group's overview, not a page a door already opens.

### Feature grid

- **Look.** `DSFeatureGridSectionContainer` with `section` (`BASE`, `MD`), `heading` (its actions stand under it) and `grid` by count. Each cell is a `DSFeature` at `pageLevel` `GROUP`, with `media` `MARK`: a short point under the heading. A cell with a picture of its own, or a plan, is at `WIDGET`. Give cells an `eyebrow` when they share a family, and `facts` for the count. **A cell's eyebrow is its group or kind as text, the overline the feature draws, and a badge only when it says a state, in that state's hue** (`RULE.SUPPORT.SURFACE.372` · GUIDE). A cell with an `anchor` is a door: `frames` `TEXT` and `MEDIA`, `surface` raised, `elevation` `MD`, on `DEFAULT`, so its mark stands inside the one box that lights. A cell that opens nothing is boxed and flat: `frames` `TEXT` and `MEDIA`, `surface` bordered. The cells of a row stand at one height (`RULE.SUPPORT.SURFACE.530` · MUST · skill:spn-surface/design).
- **Plans.** The section is `DEFAULT`, because comparing offers is another kind of reading. Each plan holds one eyebrow, its name; a second word such as Most popular is the plan's highlight, a `BADGE` fact in `PRIMARY` at the level's `variant`, not a second eyebrow (`RULE.SUPPORT.SURFACE.373` · GUIDE). Its `items` is a `LIST` of what it holds, each with a check icon, and it has one action. The recommended plan is raised `MD` and carries that highlight. A row-by-row comparison under the plans is `DSComparison`.

## What holds across — 🔮

Every container kind answers the same questions about its look, in this order (`RULE.SUPPORT.SURFACE.343` · MUST · skill:spn-surface/design).

| Question | The answer |
| --- | --- |
| Fill | Does the kind of reading change from the neighbours? If it does, `DEFAULT`; if not, `BASE`. `PRIMARY` is for the closing call alone |
| Size | Is this one of the page's one or two strongest sections? If it is, `LG`. The `MARKETING` lens makes that call |
| Highlight | Is this the page's proof, read in place, or its one branded call to act? Proof is the evidence for the page's claims standing in the section itself, with no doors and no link onward. A branded call is one invitation, one `SOLID` button and the product's own picture, such as the sample platform live. A set of doors or links is never a highlight, nor an explanation that ends in an onward button, nor the closing call, and the case line names which of the two it is (rule RULE.SUPPORT.SURFACE.438 · GUIDE). Its whole feature stands in one raised frame, in the fill that stands off its band as a door's box does (`DEFAULT` on a `BASE` band, `BASE` on a `DEFAULT` band, flat or tinted as the design language sets, never a gradient, except in the closing call's band, as the Gradient row says). The band follows the fill rule like any section, and what stands inside the frame is flat, its picture included, so there is one frame. A page holds one besides the closing call, never on the hero and never two in a row. It may stand inside the closing call's band instead, as its first feature, the call stacked under it: the page then ends on one band that holds its proof and its call. The design language sets its form: a stage, a frame made for a site, or open, with no frame, the section larger and a backdrop behind it. It is never an app's panel look |
| Gradient | Is this the hero or the closing call? Its band takes the design language's emphasis, at most once besides the hero, and never on a frame, with one exception: the highlight standing in the closing call's band takes a light tint of the brand that softens across its frame, so the frame reads as part of the band's sweep. A highlight on a band of its own stays flat |
| Media | The frame follows the media's kind, and the place follows its width and how many panes it has. A picture beside the words is `SPLIT_END`; a picture beside the items, the words across above both, is `ITEMS_SPLIT_END`, and a site never rearranges a split with its own CSS. On a phone, the words come first |
| Shape | A picture keeps the shape it is made in and is never cropped to a column; `verticalAlign` stands the shorter column |
| Alignment | `textAlign` `CENTER` centres the head alone. The split's words stand at the start. `verticalAlign` stands the items' column and the media at the `TOP`, the `CENTER` or the `BOTTOM` of their row; `BOTTOM` brings the foot of a picture shorter than its items level with the last item |
| Columns | The count of items sets them, four at most. Lines that stand side by side are one sentence each, of about one length |

- **A site's page MUST be a sequence of sections, and each MUST own its room and its fill** (`RULE.SUPPORT.SURFACE.414` · MUST · skill:spn-surface/design). The layout's box gives the side room, so the words of every section and the bar's items share one edge at every width; what a section holds adds no room unless it is framed, and a frame insets its own words. A footer's list of links keeps its words on the column's edge, with rows that are not pressed whole, each holding a link that marks itself under the pointer. A menu's panel is as wide as what it holds: a few short entries stand as a compact list, and a wide panel is for entries that carry content of their own.
- **The brand at the start of a bar and in a footer links to the home of what it names** (`RULE.SUPPORT.SURFACE.443` · GUIDE). A sign-in step draws it without the link, so the one place a person is meant to finish is not left by a click on the logo.
- **A backdrop may move, and stands still for a visitor who asked for reduced motion and for the app's own motion setting** (`RULE.SUPPORT.SURFACE.444` · MUST). A section's scene is part of its look, so it is the section that holds still.
- **A section takes one emphasis and never two** (`RULE.SUPPORT.SURFACE.438` · GUIDE): the page's ground, its own fill where the kind of reading changes, the emphasis band of the hero or the closing call, or the one highlight.
- **The container kinds decide where emphasis goes, and the site's design language decides how it looks** (`design-languages.md`). A site that sets none keeps the look this ref states.
- **For each section the agent writes one line, its case** (`RULE.SUPPORT.SURFACE.439` · GUIDE): each answer, the test that decided it, and what the other answer would cost. A reviewer then corrects a test's answer, and the section follows from it.
- **A section is `BASE`, and takes `DEFAULT` only where the kind of reading changes from its neighbours** (`RULE.SUPPORT.SURFACE.341` · GUIDE). A statement read whole, code read closely and offers compared are such readings. Sections do not alternate their fills by turn. `PRIMARY` is the closing call's alone, and a hero takes no fill.
- **Words stand on their section, not in a frame**, but for a highlighted section, whose whole feature is framed (`RULE.SUPPORT.SURFACE.293` · MUST · skill:spn-surface/design). A statement, a hero's words and a closing call stand on their section, and only a picture or an item takes a frame.
- **Media is framed by its kind** (`RULE.SUPPORT.SURFACE.293` · MUST · skill:spn-surface/design): the product framed and raised, an illustration or a diagram flat, a photo flush and rounded, code in its code frame and flat.
- **Points stand flat, and doors stand boxed and raised** (`RULE.SUPPORT.SURFACE.293` · MUST · skill:spn-surface/design). A point is read and a door is pressed, so the look says which before a reader tries.
- **A grid section is for items that are each a thing of their own** (`RULE.SUPPORT.SURFACE.259` · MUST · skill:spn-surface/design). The parts or points of one subject are a feature's items, because the data decides which, and media alone decides neither.
- **Every section with items stands at the start, and words are centred only where there is nothing to scan** (`RULE.SUPPORT.SURFACE.346` · GUIDE). A Statement, a Closing call and a hero with no picture are centred. Points, Steps, Doors, a Feature grid and Questions stand at `START`, also where they state the problem the page ends: the fill already says so.
- **A site's bands follow the design system's three screen classes and no widths of their own** (`RULE.SUPPORT.SURFACE.588` · MUST · skill:spn-surface/design). A phone is under 768 px, a tablet from 768 to 1023 px, and a section stands side by side from 1024 px; under 1024 px every band stacks, the words first. A drawing beside the words stays legible at its column at 1024 px (`RULE.SUPPORT.SURFACE.589` · MUST · skill:spn-surface/design).
- **Lines that stand side by side are one sentence each, of about one length** (`RULE.SUPPORT.SURFACE.342` · GUIDE). The items of a grid, the cells of a grid section and the options of Choose to see are read across. The budget of each line is the length of the words by level, in `standards-core.md`.

### Icon or mark

An item's picture is chosen by what the item stands for and by its form, not by where it stands or whether it links (`RULE.SUPPORT.SURFACE.344` · GUIDE).

| The item | Its picture |
| --- | --- |
| stands for a thing of its own, and introduces it with a title and a line: a door, a cell of a Feature grid, an entry of a site's menu | a mark, `media` `MARK` |
| is a line you read: a point, a step, an option's line | a bare icon, `media` `ICON`, as a cue |
| is a one-line entry of a navigation list | a bare icon |
| is an action | the icon inside the control, which keeps the control's square (`RULE.SUPPORT.SURFACE.067` · MUST · skill:spn-surface/design) |

- **An item takes a mark where it stands for a thing of its own, and a bare icon where it is a line a person reads** (`RULE.SUPPORT.SURFACE.344` · GUIDE). A link alone makes no mark.
- **One group holds one of the two, and its icons stand on all of its items or on none** (`RULE.SUPPORT.SURFACE.287` · MUST · skill:spn-surface/design).

A mark tells a person, before they read a word, that the line names a thing of its own; a bare icon only cues the line it sits on. What a mark is, and its shapes, are in `architecture-components.md`.

### An item's level

**A section's items stand at `WIDGET`.** A `DSFeature` at `PAGE` or `CONTAINER` gives its items `WIDGET` by its own level, so a page never names the level of an item (`RULE.SUPPORT.SURFACE.235` · MUST · skill:spn-surface/design): a title of 16px, a line of 14px in the quiet tone, a bare icon at its level's size, and in an item that stands up, the mark in its box over the title.

- **The entries of a site's menu stand at `CONTENT`** (`RULE.SUPPORT.SURFACE.345` · GUIDE): a title of 13px that is not a heading, a line of 13px, and in an entry that stands up, a mark of a 32px box. They do not take `GROUP`, which draws its title as a quiet heading, so a menu of such headings would read to a screen reader as the page's outline.
- **A menu's tile panel stands three across at most** (`RULE.SUPPORT.SURFACE.347` · MUST · skill:spn-surface/design). Two entries stand two across, three stand three, and four stand two by two; five or six stand three across in two rows. A tablet shows two across and a phone one. A group of seven or more takes a list panel, or splits into two groups.

No entry and no section's item names `pageLevel`: each takes the level of the place it stands in.

### The head across

Some sections have long words, and a picture that draws their items rather than their claim. In a split, the words, the items and the actions share one column beside the picture, so the items fall below the picture's foot. The head across is a form of `DSFeature` for these, `type` `ITEMS_SPLIT_END` or `ITEMS_SPLIT_START` (`RULE.SUPPORT.SURFACE.248` · MUST · skill:spn-surface/design): a form of Show it, Steps and Points when their words run long, not a container kind of its own.

| | The head across |
| --- | --- |
| The parts | The head stands across the feature's full width: the eyebrow, the title, the description, the facts, and the actions where `actionsPlacement` is `BEFORE_ITEMS`. Under it, the split: one column holds the items, or the `contentNode` in their place, with the actions where `actionsPlacement` is `AFTER_ITEMS` under them; the other column holds the media |
| Alignment | `textAlign` `CENTER` centres the head alone. The split's words stand at the start. `verticalAlign` stands the items' column and the media at the `TOP`, the `CENTER` or the `BOTTOM` of their row; `BOTTOM` brings the foot of a picture shorter than its items level with the last item |
| Levels | `PAGE` and `CONTAINER`, as the two splits are |
| On a phone | One column. `ITEMS_SPLIT_END`: the head, the items, the actions after them, then the media. `ITEMS_SPLIT_START`: the head, the media, then the items and the actions after them |
| Not when | The words are a title and a line, or the picture shows the claim and not the items: `SPLIT_END`. There are no items and no `contentNode`. The items are a `GRID` three or more across, or the media is panes, a wide table or a chart: `MEDIA_BOTTOM` |

## On the web: hover on a site — 🔮

A phone has no pointer that rests, so a section reads the same without hover; on the web, hover only adds.

- **A door, and a cell of a Feature grid that opens a page, MUST be lit as one target under the pointer** (`RULE.SUPPORT.SURFACE.236` · GUIDE). The whole item takes the `anchor` and is pressed whole, so the page's hover lights the whole frame. A Directory's cell is lit the same way, and draws no look of its own on hover, such as marks at its corners.
- **An arrow MUST move only while its door or its button is hovered or pressed** (`RULE.SUPPORT.SURFACE.287` · MUST · skill:spn-surface/design). At rest the arrow stands still.

A door already reads as a door at rest, because it is boxed and raised and its picture is a mark, and a point reads as a point, because it is flat (`RULE.SUPPORT.SURFACE.293` · MUST · skill:spn-surface/design). So a person with no pointer tells them apart before anything is lit.

## The specs a section starts from — 🔮

**This plugin carries 25 specs of the site container kinds, in `refs/support/surface/site-patterns/`**: one for each of the nineteen container kinds that draw a section, a second for Hero, Show it, Real sample and Choose to see (`-under`) and for Closing call (`-beside`), and a third for Show it, highlighted (`show-it-highlight.dg.json`), the section the Highlight test names. The hero and the closing call specs say in their captions where the emphasis band stands. Each is a skeleton of one section in the design system's units, with a view for a desktop, a tablet and a phone. Its `README.md` lists them.

- **A section starts from the spec of its container kind.** Copy it and put the page's own words in its places; the words in a spec are placeholders that say what a heading or a point is for. Never start a section from an empty file.
- **A spec is strict JSON.** Draw one with `spn-devex docs figure draw <spec>`.
- **Never edit a file in that folder.** It is a byte-identical copy of the book's folder (`RULE.SUPPORT.SURFACE.053` · MUST · skill:spn-surface/design).

## What is not checked yet

- **No check reads a section for its container kind, or a page for the order of its sections.** A review names the container kind and reads the section beside it, and reads the page's sections against its kind's order of questions.

## Boundary

This ref states which shape a section of a site's page takes, how it is chosen from what it holds, the kinds of page of a site and of a marketplace and the order of their sections, and the look each container kind takes in the design system's units. It stops at the section. The shape of a screen of an app, and the task patterns a section's tasks follow, are `standards-patterns.md`. A path across pages is `flow-patterns.md`. Who the app is for and the length of the words by level are `standards-core.md`. What `DSSectionContainer`, `DSFeature` and `DSFeatureGridSectionContainer` take, prop by prop, is `architecture-components.md` and `architecture-containers.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RULE.SUPPORT.SURFACE.340` | a section of a site's page follows a container kind, built from the units that exist, and a kind of page orders its sections by its reader's questions |
| `RULE.SUPPORT.SURFACE.341` | a site's section is `BASE`, and `DEFAULT` only where the kind of reading changes from its neighbours |
| `RULE.SUPPORT.SURFACE.342` | lines standing side by side in a site's section are one sentence each, of about one length |
| `RULE.SUPPORT.SURFACE.343` | a site's section takes its container kind and its look from what it holds, and never from where it stands |
| `RULE.SUPPORT.SURFACE.344` | an item takes a mark where it stands for a thing of its own, and a bare icon where it is a line a person reads |
| `RULE.SUPPORT.SURFACE.345` | the entries of a site's menu stand at `CONTENT` |
| `RULE.SUPPORT.SURFACE.346` | every section of a site's page that holds items stands at the start |
| `RULE.SUPPORT.SURFACE.347` | a menu's tile panel stands three across at most |
| `RULE.SUPPORT.SURFACE.293` | a section's depth follows what each part holds: a point flat, a door boxed and raised, media framed by its kind, and a section never framed |
| `RULE.SUPPORT.SURFACE.414` | a site's page is a sequence of sections, each owning its room and its fill |
| `RULE.SUPPORT.SURFACE.443` | the brand at the start of a bar and in a footer links to the home of what it names, and a sign-in step draws it without the link. It is advice |
| `RULE.SUPPORT.SURFACE.444` | a backdrop may move, and stands still for a visitor who asked for reduced motion and for the app's own motion setting |
| `RULE.SUPPORT.SURFACE.438` | a section takes one emphasis and never two |
| `RULE.SUPPORT.SURFACE.439` | the agent writes one line for each section, its case |
| `RULE.SUPPORT.SURFACE.371` | a hero's state is a `PRIMARY` badge eyebrow and its stack is `OUTLINE` `DEFAULT` badge facts |
| `RULE.SUPPORT.SURFACE.372` | a grid cell's eyebrow is its group or kind as text, and a badge only when it says a state |
| `RULE.SUPPORT.SURFACE.373` | a plan holds one eyebrow, and a second word is a `PRIMARY` badge fact |
| `RULE.SUPPORT.SURFACE.236` | a feature with an `anchor` is pressed whole and takes no actions, so on the web a door or a grid cell is lit as one target |

## Proof

No check reads a section against these rules yet. A review applies them by reading each section beside its container kind, and by drawing its spec.
