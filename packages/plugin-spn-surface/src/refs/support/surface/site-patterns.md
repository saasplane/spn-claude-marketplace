<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-patterns/01-common/03-site-patterns.md",
      "seen": "5d7da374"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-patterns/02-web/03-site-patterns.md",
      "seen": "a86b7b93"
    }
  ]
}
-->

# Site Patterns — One Shape for Each Section of a Site

Source of truth: the foundation's site patterns chapter (`docs/04-capabilities/02-support/01-surface/03-standards-patterns/01-common/03-site-patterns.md`) and the web's part of it (`docs/04-capabilities/02-support/01-surface/03-standards-patterns/02-web/03-site-patterns.md`), chapters of the Patterns construct. The specs of the site patterns are the book's `site-patterns/` folder, which this plugin carries as a copy in `refs/support/surface/site-patterns/`.

Site patterns are the third of the four groups of surface patterns, after the task patterns and the app patterns that `standards-patterns.md` restates, and before the flow patterns of `flow-patterns.md`. An app's screens take app patterns; a site's pages, a marketing page or a page of docs, take site patterns.

Read this before you design or review a page of a site. A site's page is a run of sections, and each section answers one question a reader asks. When each section is arranged from nothing, two sections that hold the same kind of content come out different. So you choose a section's shape by reading what it holds, and you review a page by naming the pattern each section should have followed.

## Terms

| Term | What it means |
| --- | --- |
| Site pattern | the shape of a section of a site's page, chosen by what the section holds |
| Section | one part of a site's page: a `DSSectionContainer` with its fill and its room, holding one `DSFeature` or a `DSFeatureGridSectionContainer` |
| Content signals | the twelve questions asked of a section, in order, whose first yes names its pattern |
| Kind of page | a page's job at its level of the site, such as a site home or a part page, which sets the order of its sections |
| The head across | a form of `DSFeature` for long words beside a picture that draws the items: the head across the full width, the split under it |

## A site pattern — 🔮

**A site pattern says: for this kind of content, show the section this way** (`RULE.SUPPORT.SURFACE.340`). It is an arrangement of units the design system already has, and the design system builds nothing for one.

- **A section of a site's page follows one of the site patterns below, and is built from `DSSectionContainer`, `DSFeature` and `DSFeatureGridSectionContainer` and their props** (`RULE.SUPPORT.SURFACE.340`). A pattern names no component of one site's own. A partner's agent has the design system and this plugin, and never another site's code, so a look stated in a site's own component is a look it cannot build.
- **A section's pattern and its look follow from what the section holds, and not from where it stands on the page** (`RULE.SUPPORT.SURFACE.343`). Every partner builds around their own content, so a rule by position, such as *every second section is filled*, fits nobody's page.
- **Every pattern names the kinds of person it serves in its For line** (`RULE.SUPPORT.SURFACE.332`). A site's page is read by a Visitor, who is deciding, or a Learner, who came to learn or to get a thing working (`standards-core.md`, *Who an app is for*).

## How a site's section is chosen — 🔮

Two answers come before any section is chosen. Who the app is for is read once, for the whole app. The flow says which step of a person's path the page is (`flow-patterns.md`). Then the page itself is read for what it is for: a doc, an app's screen or a marketing page (`RULE.SUPPORT.SURFACE.208`, `standards-core.md`). An app's screen takes an app pattern. A doc and a marketing page take site patterns.

Then ask these questions of each section, in this order, and stop at the first yes (`RULE.SUPPORT.SURFACE.343`). These are the content signals.

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

The order matters. A grid of things that each open a page is a Feature grid and not Doors, because question 6 comes first. A row of numbers in the order a reader follows is Steps, because question 8 comes before question 9. Once the pattern is named, the section answers the questions of its look, in the order *What holds across* gives: the fill, the size, the media, the alignment and the columns.

## The kinds of page, by level — 🔮

A site stands in levels, and each kind of page has one job at its level. The main line runs **site home → group home → subgroup home → part page**. Every other kind stands at one of those levels, beside the page that usually stands there. Each name says the page's job and where it stands, and never its subject, so a partner's site uses the same names for its own pages.

- **A kind of page orders its sections as its reader asks their questions, and does not count them** (`RULE.SUPPORT.SURFACE.340`). A page skips a question its reader does not ask. A count of sections would make a page add a section with nothing to say, or cut one a reader needs.

| Level | Kind | Sample breadcrumb | Its sections, in the order of its reader's questions (the usual pattern in brackets) |
| --- | --- | --- | --- |
| 1 | **Site home** | Home | what is it (Hero) → what does today's way cost me (Statement or Points, filled) → what do I get (Points, Show it, Feature grid) → is it real (Show it, Real sample, Numbers, quotes) → where does each part live (Doors) → what does it cost (plans) → what will I ask (Questions) → how do I start (Doors, Closing call). An app's signed-out home skips what its reader does not ask: what it is, what you get, and how to start |
| 2 | **Group home** | Home › Build & Launch | what is this group (Hero) → why it matters (Statement) → its parts (Doors) → the strongest part, shown (Show it) → what do I do now (Closing call). A group that sells nothing, such as resources: what is here (Hero) → the places (Doors) |
| 2 | **Docs home**, beside a group home | Surface Web › Showcase | what this place is (Hero, a doc page's head) → how to read one page (Show it, a teaching picture kept flat) → the map (Doors for each group, a Feature grid for a set of groups) |
| 2 | **Contact page**, beside a group home | Home › Contact | who to reach and why (Hero) → the addresses (Doors or Points) → what is not ready yet (Points). No closing call |
| 3 | **Subgroup home**, only where a group's parts group again | Home › Build & Launch › Apps | the group home's order, one level down: what is this subgroup (Hero) → its parts (Doors) → the strongest part, shown (Show it) → where next (Doors or Closing call). It states no problem of its own |
| last | **Part page** | Home › Build & Launch › Surface | what is this part (Hero) → what problem does it end (Statement or Points, filled) → how does it work (Steps, Show it, Choose to see) → show me the code (Real sample) → what do I get (Points) → how do I know it holds (Points) → where next (Doors) → what do I do now (Closing call) |
| last | **Audience page**, beside a part page | Home › Solutions › For leaders | who it is for (Hero) → the question this reader asks (Statement) → find yourself (Choose to see or Doors) → what changes for you (Points, Show it, Real sample) → what proves it (Statement or Points) → where next (Doors) → what do I do now (Closing call) |
| last | **Guide**, beside a part page | Home › Resources › Get started | what you will have at the end (Hero, with Steps) → each step in turn (Real sample or Show it, the code placed by its length) → how you know it worked (in each step's words) → where next (Doors, or a Closing call with the product). It sells nothing |
| last | **Values page**, beside a part page | Home › DevEx › Principles | what we decide by (Hero) → each group of principles (Points, with no fill and no media) → what do I do now (Closing call) |

The breadcrumb only shows where a kind stands; a site need not draw one. A subgroup home is a level the site patterns allow, and a site that needs no such level skips it. Two pages take no site pattern: a **text page** with no sections, such as a privacy notice or the terms, is a doc; a sign-up's choice of path is an app's screen, and takes an app pattern.

## The sections, by name — 🔮

Each section gives the question it answers, its **For** line, what calls for it, its look in the design system's units and props, how it stacks on a phone, when not to use it, and its spec in `refs/support/surface/site-patterns/`. Shown features, a directory, plans and quotes are uses of the Feature grid, because their look is the grid's.

| Site pattern | It answers | Calls for it |
| --- | --- | --- |
| Hero | What is this, and is it for me? | the page's one claim, as its first words |
| Statement | Why does this matter? | words alone, read whole |
| Points | What do I get? What is true of it? | items, each a title and one line, with no link and no order |
| Steps | How does it work? How do I start? | items in the order a reader follows them |
| Show it | Show me. | one picture the words introduce |
| Real sample | Is it real? Show me the code. | a quotation of the real source |
| Choose to see | Which one is me? What happens at each step? | a few options, where a press changes the picture |
| Doors | Where do I go next? Where do I start? | items that each open another page |
| Feature grid | What is in the set? Which plan is mine? Who else uses it? | a set of things, each of its own |
| Numbers | Does it work for teams like mine? | numbers read from the real system |
| Questions | What do people ask before they start? | questions, each with a short answer |
| Closing call | What do I do now? | the page's last words and its one call to act |

### Hero

- **For** Visitor · Learner. For a Learner it is a doc page's head: `size` `MD`, `START`, with no actions.
- **Calls for it.** The section that says what the page is: its one claim, and what shows it at a glance.
- **Look.** `DSSectionContainer` `size` `LG`, or `XL` where the hero is the page's emphasis, `color` `BASE`. Inside it, a `DSFeature` at `pageLevel` `PAGE`. The media keeps the frame of its kind: a product is `frames` `MEDIA` with `surface` raised, `elevation` `LG`; a diagram is flat; a mood picture is `type` `BACKDROP`. Use `type` `SPLIT_END` for one picture the title names, and `MEDIA_BOTTOM` for two panes or a wide picture. Centre the words, `textAlign` `CENTER`, only when nothing stands beside or under them. A state such as Alpha is a `BADGE` `eyebrow` in `PRIMARY`, at the level's `variant`. The stack names kinds, so it goes in up to four `BADGE` `facts`, each `OUTLINE` in `DEFAULT` (`RULE.SUPPORT.SURFACE.371`). The actions are the page's one `SOLID` primary, then one `OUTLINE`. With items, use `actionsPlacement` `BEFORE_ITEMS`. A hero takes no `reveal`.
- **On a phone.** The words, the facts and the buttons, then the picture: the facts are the head's own, and the actions stand after the head.
- **Not when.** The section is a slideshow of several claims: give each claim its own section. A hero takes no fill.
- **Specs.** `hero.dg.json`, the picture beside the words; `hero-under.dg.json`, two panes or a wide picture under them.

### Statement

- **For** Visitor.
- **Calls for it.** Words alone, read whole: a title, a description, and at most three text facts. No items and no media.
- **Look.** `DSSectionContainer` `size` `MD`. Inside it, a `DSFeature` at `CONTAINER` with `textAlign` `CENTER` and `reveal` `text` `RISE`. Use `color` `DEFAULT` with `inset` where the statement states the problem the page ends, because the kind of reading changes from its neighbours. Otherwise `BASE`.
- **On a phone.** As it is.
- **Not when.** The claim has parts a reader scans: use Points. It says the hero again.
- **Spec.** `statement.dg.json`.

### Points

- **For** Visitor · Learner.
- **Calls for it.** Items, from two up to eight, each a title and one line about the section's one subject. No link, no order, and not numbers that prove a claim.
- **Look.** A `DSFeature` at `CONTAINER`, `items.type` `GRID`, flat (no `items.surface`), `textAlign` `START`. `gridColumns` follows the count: 2/2/1 for two or four; 3/2/1 for three or six, or 3/3/1 when the lines are short; 4/2/1 for seven or eight; 3/2/1 for five. Items side by side are one sentence each, of about one length. Use `items.orientation` `HORIZONTAL` when the lines are short. Points in one column, beside a picture or as a column of checks, are `items.type` `LIST`, with a line between each two. The fill is `BASE`; `DEFAULT` only where the points state the problem the page ends. Where the words run long and a picture draws the points themselves, use the head across.
- **With icons.** When each point has an icon that names its kind, give each item `media` `ICON`: the design system draws it on the title's first line, at its level's size, with the description under the title. Six such points stand 3/2/1, flat, with no lines.
- **On a phone.** The words, then one point under another.
- **Not when.** The items link: Doors. Each item is a thing of its own: Feature grid. The items run in an order: Steps. The items are numbers: Numbers.
- **Spec.** `points.dg.json`.

Readers scan points, and the eye comes back to a left edge; a centred point of two or three lines loses that edge. One column of points is the design system's list.

### Steps

- **For** Visitor · Learner. For a Learner each step carries its command and the line that says it worked.
- **Calls for it.** Items in the order a reader follows them, read and not pressed.
- **Look.** `items.numbered` true, flat, with a line between each two: `items.type` `LIST`, which draws the lines by default. A row of steps is `GRID` with `items.borderType` `GRID`. An item's `anchor` may only scroll to the step's own section on the same page. With a picture, `type` `SPLIT_END`, the steps a `LIST` beside it. Where the words run long and the picture draws the steps, use the head across.
- **On a phone.** One step under another, then the picture.
- **Not when.** Each step opens a page of its own: Doors, numbered. A press changes the picture: Choose to see.
- **Spec.** `steps.dg.json`.

### Show it

- **For** Visitor · Learner. For a Learner a diagram comes before the product.
- **Calls for it.** One picture the words introduce: the product, a diagram, a photo, or code panes compared.
- **Look.** A `DSFeature` with `mediaNode`. The frame follows the kind of the media (`RULE.SUPPORT.SURFACE.293`): a product is `frames` `MEDIA`, `surface` raised, `elevation` `MD`, or `LG` in the page's emphasis; an illustration or a diagram is flat on the section; a photo is flush and rounded; code panes are flat, each as tall as its lines. Use `type` `SPLIT_END` when the picture is one thing the title names and reads at half width, about 630px at 1440; `MEDIA_BOTTOM` for two or more panes compared, a wide table or chart, or four thumbnails. Points go beside the picture as a `LIST`, or across above it as a `GRID`. Where the picture and the words differ in height, `verticalAlign` stands the shorter against the taller: a picture shorter than its words takes `CENTER`, the default, or `BOTTOM` where it draws the points and its foot meets the last of them; a picture taller than its words takes `TOP`. Where the words run long and the picture draws the points, use the head across. `reveal`: `text` `RISE`, `media` `FADE`, `items` `RISE`. The fill is `BASE`; `DEFAULT` only where the neighbours hold another kind of reading.
- **The product playing.** When the picture is the product doing one thing in motion, the `mediaNode` is the product built from units and playing, flat with no frame of its own. At `CONTAINER` it may lead the section, above the words, with `type` `MEDIA_TOP`. Art behind it that is no look of the design system is left out.
- **On a phone.** The words first, then the points, then the picture. Panes stand two by two, or one under another.
- **Not when.** The picture says again what the items or another section's picture already say: cut it. The section is code read closely: Real sample. A press changes the picture: Choose to see.
- **Specs.** `show-it.dg.json`, the product raised beside the words and their points; `show-it-under.dg.json`, two panes compared under the words with the points across.

### Real sample

- **For** Learner · Visitor. For a Visitor only where the reader is a builder, because working code persuades a builder.
- **Calls for it.** A quotation of the real source, read line by line.
- **Look.** The `mediaNode` is a `DSCodeBlockView` titled with its file, flat in its own frame and not raised. Use `color` `DEFAULT` with `inset` where the neighbours hold another kind of reading; a guide whose every section holds code stays `BASE`. `size` `LG` when the sample is the page's argument, `MD` when it only shows a detail. The place follows the line length: `MEDIA_BOTTOM` when any line runs past about 70 characters, `SPLIT_END` for short, tall code, with the words at the top of their column by `verticalAlign` `TOP`. The lines are the file's own, with … where lines are cut.
- **On a phone.** The words, then the code, which scrolls sideways and does not wrap.
- **Not when.** The code is two things compared: Show it, with code panes on `BASE`.
- **Specs.** `real-sample.dg.json`, short, tall code beside the words; `real-sample-under.dg.json`, code with a long line under them.

### Choose to see

- **For** Visitor · Learner.
- **Calls for it.** A few options, where the reader's press changes the picture. The picture decides the form: a small picture that reads at half width stands beside the options; a page or a product screen, which half width cannot show, stands under them.
- **Beside.** `type` `SPLIT_END`. The options are a `LIST`, `items.type` `LIST`, boxed and raised: `items.surface` raised, `elevation` `MD`, on the door fill. The chosen one is `selected`, and each option's line says what it changes. The picture beside them is small and whole at about 630px of 1440, such as a loop, a tree or a diagram, and keeps the frame of its kind.
- **Under.** `type` `MEDIA_BOTTOM`, and the `mediaNode` is a `DSTabs` at `pageLevel` `CONTAINER` with `type` `PILL`, the look of a website's pages (`RULE.SUPPORT.SURFACE.209`); the level gives its size, and it stands grouped on its track. Tab names are short, one or two words. The tabs only choose which panel is open, and the open tab's panel is the page's own node: the tab's line, one description that says what only this part says, then its picture at the feature's full width. The line and the description are the page's words at the title and description steps of `WIDGET`, so no tab and no `DSFeature` prop is needed. Every panel's picture is one shape, so the section does not jump as the tabs change, and each has its own alt.
- **On a phone.** Beside: each option says its result in words, and the picture stays at rest below, not pinned. Under: the words, then the pills, which keep one row and scroll sideways, then the open tab's line, its description and its picture, which keeps a legible width and scrolls sideways in its own frame, named as a region so the keyboard scrolls it too.
- **Not when.** A press changes nothing: Steps or Points. A press opens a page: Doors.
- **Specs.** `choose-to-see.dg.json`, the options beside their picture; `choose-to-see-under.dg.json`, the pills over the open tab's panel.

### Doors

- **For** Visitor · Learner. For a Learner a doc ends on doors, not on a closing call.
- **Calls for it.** Items that each open another page.
- **Look.** The items are boxed and raised `MD` on the fill that stands off the section: `items.surface` `color` `DEFAULT`, raised, `elevation` `MD`, on a `BASE` section (`RULE.SUPPORT.SURFACE.293`). Each item has an `anchor`. A door stands for a page of its own, so where it has a picture, the picture is a mark, `media` `MARK`. Each may end on an `endNode`: `ARROW_UP_RIGHT` when it leaves the site, `ARROW_RIGHT` inside it. `GRID` columns follow the count, as for Points. Use a `LIST` when each door names a person or carries a long line. A door does not stand on a filled section. A button beside the doors opens a different place, such as the group's overview, not a page a door already opens.
- **On a phone.** One door under another.
- **Not when.** The item is read and not pressed: Points. The door opens the page the closing call already opens: say it once.
- **Spec.** `doors.dg.json`.

Five doors in a row cannot be drawn: the columns stop at four. Three over two reads as a choice made on purpose.

### Feature grid

- **For** Visitor · Learner. Plans, quotes and a directory are for a Visitor; a showcase's groups for a Learner.
- **Calls for it.** A set of things, each of its own: a module, an integration, a group of components, a feature shown with a picture of its own, a plan or a quote. Each carries more than a title and a line: its own picture, its own mark, its facts, its own points, or its own page.
- **Look.** `DSFeatureGridSectionContainer` with `section` (`BASE`, `MD`), `heading` (its actions stand under it) and `grid` by count. Each cell is a `DSFeature` at `pageLevel` `WIDGET`, with `media` `MARK`. Give cells an `eyebrow` when they share a family, and `facts` for the count. **A cell's eyebrow is its group or kind as text, the overline the feature draws, and a badge only when it says a state, in that state's hue** (`RULE.SUPPORT.SURFACE.372`). A cell with an `anchor` is a door: `frames` `TEXT`, `surface` raised, `elevation` `MD`, on `DEFAULT`. A cell that opens nothing is boxed and flat: `frames` `TEXT`, `surface` bordered.
- **Shown features.** Two to four features of one product, each with a small picture of the product doing it. Each cell is a `DSFeature` at `WIDGET` with `type` `MEDIA_TOP`; its `mediaNode` is the picture, built from the design system's own units, flat and unframed. The words stand under it at `START`: a title that makes the claim, and one line. The grid draws lines between the cells, `grid.borderType` `GRID`, and no box around any cell, in 2/1/1 or 3/1/1.
- **Directory.** Many things of one kind, read as a catalogue, such as integrations or data sources. Each cell has `media` `MARK`, the name as its title, `facts` with `factsPlacement` `AFTER_TITLE` for its kind and how it connects (*CRM · OAuth*), and one line. The cells are lined, not boxed, `grid.borderType` `GRID`, in 3/2/1, so the set reads as one table. A cell that opens the thing's page has an `anchor` and is pressed whole.
- **Plans.** The section is `DEFAULT`, because comparing offers is another kind of reading. Each plan holds one eyebrow, its name; a second word such as Most popular is the plan's highlight, a `BADGE` fact in `PRIMARY` at the level's `variant`, not a second eyebrow (`RULE.SUPPORT.SURFACE.373`). Its `items` is a `LIST` of what it holds, each with a check icon, and it has one action. The recommended plan is raised `MD` and carries that highlight. A row-by-row comparison under the plans is `DSComparison`.
- **Quotes.** Each cell's `description` is the quote, its `media` an `AVATAR`, and its `facts` the role and the team. The cells are bordered and flat.
- **On a phone.** The heading and its button, then one cell under another.
- **Not when.** The items are parts or points of one subject, each a title and a line with no picture of its own: they stay a feature's items. Seven modules with one line each stay a list too. There is no price yet: say so in Points.
- **Spec.** `feature-grid.dg.json`.

The data decides the unit. A set of things of their own is a grid section, and the parts of one thing are a feature's items. A part that comes with a picture of its own is a feature of its own, so it is a grid section too (`architecture-containers.md`, the grid section).

### Numbers

- **For** Visitor.
- **Calls for it.** Up to four numbers read from the real system, each with a plain label that says what it gives the reader.
- **Look.** `items.type` `STATS`, flat, in one row. `textAlign` `START`, or `CENTER` when they stand alone under centred words.
- **On a phone.** Two by two, or one under another.
- **Not when.** The number is made up, counts how the system is built, or stands apart from its label. Each is a finding by the words of a marketing page (`standards-core.md`).
- **Spec.** `numbers.dg.json`.

### Questions

- **For** Visitor · Learner.
- **Calls for it.** Questions, from three up to eight, each with a short answer.
- **Look.** A `DSFeature` at `CONTAINER`, its title and description, with `contentNode` set to a `bordered` `DSAccordionGroup`, its first question open. `BASE`, `START`. The accordion runs by the task pattern Disclose (`standards-patterns.md`).
- **On a phone.** As it is.
- **Not when.** The answers are long reading: write a doc page.
- **Spec.** `questions.dg.json`.

### Closing call

- **For** Visitor. A Learner's page has none: a doc closes on where to go next.
- **Calls for it.** The page's last words, and its one call to act.
- **Look.** `DSSectionContainer` `size` `SM`, `color` `PRIMARY`, `strength` `SUBTLE`, with `inset`. A site whose brand reads as a solid band may use `SOLID`, with buttons coloured `DEFAULT`. Inside, a `DSFeature` with `textAlign` `CENTER` and words alone. One `SOLID` primary, and at most one `OUTLINE` that opens a page no door above it opens. The words are not framed. One variant has a product picture beside, with `type` `SPLIT_END` and `START`, when the call is to go and see the product.
- **On a phone.** The words, then the buttons, one under another.
- **Not when.** Doors already end the page.
- **Specs.** `closing-call.dg.json`, centred on `PRIMARY`, `SUBTLE`; `closing-call-beside.dg.json`, the variant with the product beside.

One call is enough. A second button that opens a door the reader has just passed says the same thing twice.

## What holds across — 🔮

Every site pattern answers the same questions about its look, in this order (`RULE.SUPPORT.SURFACE.343`).

| Question | The answer |
| --- | --- |
| Fill | Does the kind of reading change from the neighbours? If it does, `DEFAULT`; if not, `BASE`. `PRIMARY` is for the closing call alone |
| Size | Is this one of the page's one or two strongest sections? If it is, `LG`. The `MARKETING` lens makes that call |
| Media | The frame follows the media's kind, and the place follows its width and how many panes it has. On a phone, the words come first |
| Alignment | Centre the words only when they stand alone with nothing to scan: a Statement, a Closing call, a hero with no picture |
| Columns | The count of items sets them, four at most. Lines that stand side by side are one sentence each, of about one length |

- **A section is `BASE`, and takes `DEFAULT` only where the kind of reading changes from its neighbours** (`RULE.SUPPORT.SURFACE.341`). A statement read whole, code read closely and offers compared are such readings. Sections do not alternate their fills by turn. `PRIMARY` is the closing call's alone, and a hero takes no fill.
- **Words stand on their section, not in a frame** (`RULE.SUPPORT.SURFACE.293`). A statement, a hero's words and a closing call stand on their section, and only a picture or an item takes a frame.
- **Media is framed by its kind** (`RULE.SUPPORT.SURFACE.293`): the product framed and raised, an illustration or a diagram flat, a photo flush and rounded, code in its code frame and flat.
- **Points stand flat, and doors stand boxed and raised** (`RULE.SUPPORT.SURFACE.293`). A point is read and a door is pressed, so the look says which before a reader tries.
- **A grid section is for items that are each a thing of their own** (`RULE.SUPPORT.SURFACE.259`). The parts or points of one subject are a feature's items, because the data decides which, and media alone decides neither.
- **Every section with items stands at the start, and words are centred only where there is nothing to scan** (`RULE.SUPPORT.SURFACE.346`). A Statement, a Closing call and a hero with no picture are centred. Points, Steps, Doors, a Feature grid and Questions stand at `START`, also where they state the problem the page ends: the fill already says so.
- **Lines that stand side by side are one sentence each, of about one length** (`RULE.SUPPORT.SURFACE.342`). The items of a grid, the cells of a grid section and the options of Choose to see are read across. The budget of each line is the length of the words by level, in `standards-core.md`.

### Icon or mark

An item's picture is chosen by what the item stands for and by its form, not by where it stands or whether it links (`RULE.SUPPORT.SURFACE.344`).

| The item | Its picture |
| --- | --- |
| stands for a thing of its own, and introduces it with a title and a line: a door, a cell of a Feature grid, an entry of a site's menu | a mark, `media` `MARK` |
| is a line you read: a point, a step, an option's line | a bare icon, `media` `ICON`, as a cue |
| is a one-line entry of a navigation list | a bare icon |
| is an action | the icon inside the control, which keeps the control's square (`RULE.SUPPORT.SURFACE.067`) |

- **An item takes a mark where it stands for a thing of its own, and a bare icon where it is a line a person reads** (`RULE.SUPPORT.SURFACE.344`). A link alone makes no mark.
- **One group holds one of the two, and its icons stand on all of its items or on none** (`RULE.SUPPORT.SURFACE.287`).

A mark tells a person, before they read a word, that the line names a thing of its own; a bare icon only cues the line it sits on. What a mark is, and its shapes, are in `architecture-components.md`.

### An item's level

**A section's items stand at `WIDGET`.** A `DSFeature` at `PAGE` or `CONTAINER` gives its items `WIDGET` by its own level, so a page never names the level of an item (`RULE.SUPPORT.SURFACE.235`): a title of 16px, a line of 14px in the quiet tone, a bare icon at its level's size, and in an item that stands up, the mark in its box over the title.

- **The entries of a site's menu stand at `CONTENT`** (`RULE.SUPPORT.SURFACE.345`): a title of 13px that is not a heading, a line of 13px, and in an entry that stands up, a mark of a 32px box. They do not take `GROUP`, which draws its title as a quiet heading, so a menu of such headings would read to a screen reader as the page's outline.
- **A menu's tile panel stands three across at most** (`RULE.SUPPORT.SURFACE.347`). Two entries stand two across, three stand three, and four stand two by two; five or six stand three across in two rows. A tablet shows two across and a phone one. A group of seven or more takes a list panel, or splits into two groups.

No entry and no section's item names `pageLevel`: each takes the level of the place it stands in.

### The head across

Some sections have long words, and a picture that draws their items rather than their claim. In a split, the words, the items and the actions share one column beside the picture, so the items fall below the picture's foot. The head across is a form of `DSFeature` for these, `type` `ITEMS_SPLIT_END` or `ITEMS_SPLIT_START` (`RULE.SUPPORT.SURFACE.248`): a form of Show it, Steps and Points when their words run long, not a pattern of its own.

| | The head across |
| --- | --- |
| The parts | The head stands across the feature's full width: the eyebrow, the title, the description, the facts, and the actions where `actionsPlacement` is `BEFORE_ITEMS`. Under it, the split: one column holds the items, or the `contentNode` in their place, with the actions where `actionsPlacement` is `AFTER_ITEMS` under them; the other column holds the media |
| Alignment | `textAlign` `CENTER` centres the head alone. The split's words stand at the start. `verticalAlign` stands the items' column and the media at the `TOP`, the `CENTER` or the `BOTTOM` of their row; `BOTTOM` brings the foot of a picture shorter than its items level with the last item |
| Levels | `PAGE` and `CONTAINER`, as the two splits are |
| On a phone | One column. `ITEMS_SPLIT_END`: the head, the items, the actions after them, then the media. `ITEMS_SPLIT_START`: the head, the media, then the items and the actions after them |
| Not when | The words are a title and a line, or the picture shows the claim and not the items: `SPLIT_END`. There are no items and no `contentNode`. The items are a `GRID` three or more across, or the media is panes, a wide table or a chart: `MEDIA_BOTTOM` |

## On the web: hover on a site — 🔮

A phone has no pointer that rests, so a section reads the same without hover; on the web, hover only adds.

- **A door, and a cell of a Feature grid that opens a page, MUST be lit as one target under the pointer** (`RULE.SUPPORT.SURFACE.236`). The whole item takes the `anchor` and is pressed whole, so the page's hover lights the whole frame. A Directory's cell is lit the same way, and draws no look of its own on hover, such as marks at its corners.
- **An arrow MUST move only while its door or its button is hovered or pressed** (`RULE.SUPPORT.SURFACE.287`). At rest the arrow stands still.

A door already reads as a door at rest, because it is boxed and raised and its picture is a mark, and a point reads as a point, because it is flat (`RULE.SUPPORT.SURFACE.293`). So a person with no pointer tells them apart before anything is lit.

## The specs a section starts from — 🔮

**This plugin carries the book's 17 specs of the site patterns, in `refs/support/surface/site-patterns/`**: one for each of the twelve patterns, and a second for Hero, Show it, Real sample and Choose to see (`-under`) and for Closing call (`-beside`). Each is a skeleton of one section in the design system's units, with a view for a desktop, a tablet and a phone. Its `README.md` lists them.

- **A section starts from the spec of its pattern.** Copy it and put the page's own words in its places; the words in a spec are placeholders that say what a heading or a point is for. Never start a section from an empty file.
- **A spec is strict JSON.** Draw one with `spn-devex docs figure draw <spec>`.
- **Never edit a file in that folder.** It is a byte-identical copy of the book's folder (`RULE.SUPPORT.SURFACE.053`).

## What is not checked yet

- **No check reads a section for its pattern, or a page for the order of its sections.** A review names the pattern and reads the section beside it, and reads the page's sections against its kind's order of questions.

## Boundary

This ref states which shape a section of a site's page takes, how it is chosen from what it holds, the kinds of page and the order of their sections, and the look each pattern takes in the design system's units. It stops at the section. The shape of a screen of an app, and the task patterns a section's tasks follow, are `standards-patterns.md`. A path across pages is `flow-patterns.md`. Who the app is for and the length of the words by level are `standards-core.md`. What `DSSectionContainer`, `DSFeature` and `DSFeatureGridSectionContainer` take, prop by prop, is `architecture-components.md` and `architecture-containers.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RULE.SUPPORT.SURFACE.340` | a section of a site's page follows a site pattern, built from the units that exist, and a kind of page orders its sections by its reader's questions |
| `RULE.SUPPORT.SURFACE.341` | a site's section is `BASE`, and `DEFAULT` only where the kind of reading changes from its neighbours |
| `RULE.SUPPORT.SURFACE.342` | lines standing side by side in a site's section are one sentence each, of about one length |
| `RULE.SUPPORT.SURFACE.343` | a site's section takes its pattern and its look from what it holds, and never from where it stands |
| `RULE.SUPPORT.SURFACE.344` | an item takes a mark where it stands for a thing of its own, and a bare icon where it is a line a person reads |
| `RULE.SUPPORT.SURFACE.345` | the entries of a site's menu stand at `CONTENT` |
| `RULE.SUPPORT.SURFACE.346` | every section of a site's page that holds items stands at the start |
| `RULE.SUPPORT.SURFACE.347` | a menu's tile panel stands three across at most |
| `RULE.SUPPORT.SURFACE.293` | a section's depth follows what each part holds: a point flat, a door boxed and raised, media framed by its kind, and a section never framed |
| `RULE.SUPPORT.SURFACE.371` | a hero's state is a `PRIMARY` badge eyebrow and its stack is `OUTLINE` `DEFAULT` badge facts |
| `RULE.SUPPORT.SURFACE.372` | a grid cell's eyebrow is its group or kind as text, and a badge only when it says a state |
| `RULE.SUPPORT.SURFACE.373` | a plan holds one eyebrow, and a second word is a `PRIMARY` badge fact |
| `RULE.SUPPORT.SURFACE.236` | a feature with an `anchor` is pressed whole and takes no actions, so on the web a door or a grid cell is lit as one target |

## Proof

No check reads a section against these rules yet. A review applies them by reading each section beside its pattern, and by drawing its spec.
