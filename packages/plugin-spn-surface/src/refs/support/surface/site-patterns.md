<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/01-common/04-site-container-kinds.md",
      "seen": "cf88a9c6"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/02-web/02-site-container-kinds.md",
      "seen": "e36e6c76"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-surface-catalogue/01-common/02-site-page-kinds.md",
      "seen": "b4eb74d7"
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
- **A page whose sections follow site container kinds MUST be wrapped once in `DSSiteLayout`** (`RULE.SUPPORT.SURFACE.196` · MUST · skill:spn-surface/design). The wrapper marks the page as a site's, a marketing page or a page of docs in a web app, so its display steps draw in the theme's display family; a page that follows an app page kind or a task pattern is never wrapped, a public sign-in page included.
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

A site stands in levels, and each kind of page has one job at its level. The main line runs from Home down to the topics: **Home → Group home → Topic**, three levels by default, and a group home serves any level between the home and the topics. Every other kind stands at one of those levels, beside the page that usually stands there. Each name says the page's job and where it stands, and never its subject, so a partner's site uses the same names for its own pages.

- **A kind of page orders its sections as its reader asks their questions, and does not count them** (`RULE.SUPPORT.SURFACE.340` · MUST · skill:spn-surface/design). A page skips a question its reader does not ask. A count of sections would make a page add a section with nothing to say, or cut one a reader needs.

| Level | Kind | Contract name | Sample breadcrumb | Its sections, in the order of its reader's questions (the usual container kind in brackets) |
| --- | --- | --- | --- | --- |
| 1 | **Home** | `HOME` | Home | What is it (Hero) → what does today's way cost me (Statement or Points, filled) → what do I get (Points, Show it, Feature grid) → is it real (Show it, Real sample, Numbers, quotes) → where does each part live (Doors) → what does it cost (plans) → what will I ask (Questions) → how do I start (Doors, Closing call). An app's signed-out home is a Home that skips the questions its reader does not ask: what it is, what you get, and how to start. |
| 2 | **Group home** | `GROUP_HOME` | Home › Build & Launch | What is this group (Hero) → why it matters (Statement) → its parts (Doors) → the strongest part, shown (Show it) → what do I do now (Closing call). A group that sells nothing, such as a group of resources, skips why it matters and the strongest part, and needs no closing call: what is here (Hero) → the places (Doors). On a resources site a Group home is one help topic, a group's front page with its guides and articles in one place: what is this topic (Hero) → its guides and articles (Doors) → what will I ask (Questions). |
| 2 | **Docs**, beside a group home, on a resources site | `DOCS` | Surface Web › Showcase | What this place is (Hero, a doc page's head) → how to read one page (Show it, a teaching picture kept flat) → the map (Doors for each group, a Feature grid for a set of groups). |
| 2 | **Contact**, beside a group home | `CONTACT` | Home › Contact | Who to reach and why (Hero) → the addresses (Doors or Points) → what is not ready yet (Points). It needs no closing call. |
| 2 | **Pricing**, beside a group home | `PRICING` | Home › Pricing | What it costs, in a line (Hero, with no picture) → the plans side by side (Feature grid, its plans use) → what each plan holds, row by row, where plans differ in more than three ways (a comparison of the plans, in Points beside each plan, never a data table) → what will I ask about paying (Questions) → how do I start (Closing call). A site that sells nothing yet, such as one in alpha, has no pricing page and says how to reach it on its contact page instead. |
| 2 | **About**, beside a group home | `ABOUT` | Home › About | Who we are and why we exist (Hero) → what we believe (Statement) → how far we have come (Numbers) → the people (Feature grid, its directory use, each person a mark and a line) → where to reach us, or work with us (Doors) → what do I do now (Closing call). |
| 2 | **Blog**, beside a group home | `BLOG` | Home › Blog | What is written here, and for whom (Hero, with no picture) → the newest piece, led (Show it, its picture and its first lines) → every piece, newest first (Feature grid, its directory use: each a title, a line, a date and who wrote it) → where to follow (Doors). It sells nothing, so it needs no closing call. |
| 2 | **Search**, beside a group home, on a resources site | `SEARCH` | Home › Search | The results of a search, in a help centre started from a search. What was asked (Hero) → what answers it, grouped by kind (Feature grid) → where else to look (Doors). |
| 2 | **Changelog**, beside a group home, on a resources site | `CHANGELOG` | Home › Changelog | What changed in which version, newest first, each version dated. What this page records (Hero) → each version in turn, newest first (the reading, as an Article's) → where next (Doors). |
| last | **Topic** | `TOPIC` | Home › Build & Launch › Surface | What is this part (Hero) → what problem does it end (Statement or Points, filled) → how does it work (Steps, Show it, Choose to see) → show me the code (Real sample) → what do I get (Points) → how do I know it holds (Points) → where next (Doors) → what do I do now (Closing call). |
| last | **Audience**, beside a topic | `AUDIENCE` | Home › Solutions › For leaders | Who it is for (Hero) → the question this reader asks (Statement) → find yourself (Choose to see or Doors) → what changes for you (Points, Show it, Real sample) → what proves it (Statement or Points) → where next (Doors) → what do I do now (Closing call). |
| last | **Guide**, beside a topic, on a resources site | `GUIDE` | Home › Resources › Get started | What you will have at the end (Hero, with Steps) → each step in turn (Real sample or Show it, the code placed by its length) → how you know it worked (in each step's words) → where next (Doors, or a Closing call with the product). It sells nothing. |
| last | **Reference**, beside a guide, on a resources site | `REFERENCE` | Home › Docs › Reference › One endpoint | One endpoint, command, record or config option, stated in full, in a `RAIL` of API docs. What is this (Hero) → what is true of it, in full (the reading, as an Article's) → how is it used, in code (Real sample) → where next (Doors). It is for a Learner who looks one thing up. Where the Learner is doing a task end to end, the page is a Guide. |
| last | **Values**, beside a topic | `VALUES` | Home › DevEx › Principles | What we decide by (Hero) → each group of principles (Points, with no fill and no media) → what do I do now (Closing call). |
| last | **Article**, under a blog | `ARTICLE` | Home › Blog › An article | The title, who wrote it and when (Hero, a doc page's head) → the reading (the site frame around long text: headings, figures, code placed by its length, at a reading width) → where next (Doors, the related pieces). An article is read whole, so it carries no sections between its paragraphs. **A blog is a listing and a detail of articles with a reading order of its own.** Blog lists the articles, the newest first, and an Article is one of them, read whole. Both stay MARKETING's; the general Listing and Detail belong to a marketplace. |
| — | **Landing**, outside the levels | `LANDING` | none: reached from a campaign | What is this offer (Hero) → why should I care (Points) → is it real (Real sample, Numbers, quotes) → what is the catch (Questions) → do it now (Closing call, with its one action). It stands in `CANVAS`, with no site navigation and a short footer, so nothing leads the Visitor away from the one thing the page asks. **A Guide is a page of a RESOURCES site, for a Learner.** A technical platform has guides, and a marketing site links to them; a product with no technical side has none, and its marketing pages end on a sign-up instead. **Not found keeps the layout of its site**, so the site's navigation stays beside it, with a short message, a search on a site that has one, and the way back. Two pages take no container kind. A page of the kind **Text**, with no sections, such as a privacy notice or the terms, is a doc: Privacy and Terms are the titles of such pages in a site's navigation, and never kinds. A sign-up's choice of path is an app's screen, and takes an app page kind. |

A marketplace's page kinds stand in levels of their own, in *The kinds of page of a marketplace* below.

The contract name is the `code` a design language's spec gives the kind under PAGES, and the catalogue holds it as the same `code`. **A page kind's code is the name a reader sees in a site's navigation, in capitals, with no `PAGE` suffix**: Home is `HOME`, Contact is `CONTACT`, About is `ABOUT`, Blog is `BLOG`, Listing is `LISTING`, Detail is `DETAIL` and Landing is `LANDING`, and a name with two words keeps an underscore, as `GROUP_HOME` does. A page's own title in the navigation, such as Privacy or Terms, is a page of a kind and never a kind: it is a page of Text. The catalogue holds two more kinds that take no sections of their own: `TEXT`, and `NOT_FOUND`, the page for an address that leads nowhere. On a resources site, `HOME` is the start of the whole site, and the catalogue gives it the sections Hero, Feature grid and Doors.

**A design language may define a page kind of its own in its spec, built from the sections below.** The kinds above are the catalogue it picks from, and a kind it adds is stated in that language's own spec and never added here.

The breadcrumb only shows where a kind stands; a site need not draw one. A group home serves any level between the home and the topics, so a site whose groups divide again uses a group home at the second level too, and three levels stay the default. A Guide is a page of a RESOURCES site, for a Learner: a technical platform has guides and a marketing site links to them, and a product with no technical side has none. A blog is a listing and a detail of articles with a reading order of its own: Blog is the listing of articles, led by the newest, and an Article is their detail, read whole. They stay MARKETING's, and the general Listing and Detail are a marketplace's (below). **Not found keeps the layout of its site**, so the site's navigation stays beside it, with a short message, a search on a site that has one, and the way back. Two pages take no container kind: a page of the kind **Text**, with no sections, such as a privacy notice or the terms, is a doc, and a sign-up's choice of path is an app's screen, and takes an app page kind.

## The kinds of page of a marketplace — 🔮

A marketplace is a public site of records: a shop, a site of cars, a job board, a matrimony site. Its reader is a Seeker, who came to find one record among many and choose it. Its pages argue no case. They help the Seeker look, narrow and compare, and every page ends where the Seeker can go on looking. In one visit a Seeker goes down the levels and back up many times: from a search or a category, through the records, to one record, and back again.

| Level | Kind | Contract name | Sample breadcrumb | Its sections, in the order of its reader's questions (the usual container kind in brackets) |
| --- | --- | --- | --- | --- |
| 1 | **Home** | `HOME` | Home | What is here, and can I find mine (Find, a search first) → where does each kind of record live (Doors, the categories as cards) → the few worth a look first (Records, by shelf) → what will I ask (Questions) → where is everything else (Footer). |
| 2 | **Listing** | `LISTING` | Home › Jobs | Every record of one kind. What is listed here, and for whom (Hero, its words alone) → the few worth a look first (Records, by shelf) → every record, narrowed the way a reader looks for one (Records, filtered) → what will I ask before I choose (Questions) → where do I go if none fits (Doors). Where the records fall into categories a reader picks first, each category is a page of its own. |
| 2 or deeper | **Category** | `CATEGORY` | Home › Phones › Android phones | One category of records, the page an entry of the menu opens. What is in this category (Hero, its words alone) → its smaller categories (Doors, as cards) → the few worth a look first (Records, by shelf) → every record in it, narrowed (Records, filtered) → what will I ask (Questions). A category with no smaller ones skips its doors. |
| 2 | **Results**, beside a listing | `RESULTS` | Home › Phones › Under 300 | The list a Seeker browses and narrows with filters, reached from a category, a brand or a shared link, because the filters chosen are the page's address. What did I choose (Hero, its words alone, the filters as tags) → the records that match, narrowed further (Records, filtered) → where do I go if none fits (Doors). |
| 2 | **Search**, beside a listing | `SEARCH` | Home › Search | What a typed query returns, across every category. What was asked (Find, the words kept in the field with the count of what answers them) → which categories hold it (Doors, as rows, each with its count) → the records that answer it, narrowed (Records, filtered). A search that finds nothing says so and offers to widen it. |
| 2 | **Saved** | `SAVED` | Home › Saved | The records a reader kept to come back to, on this device or in their account. What have I kept (Hero, its words alone) → the records kept, newest first (Records, saved) → where do I go to find more (Doors). A record no longer offered stays on the list, marked as gone, until the reader takes it off. |
| last | **Brand** | `BRAND` | Home › Brands › One maker | The page of one maker, seller or employer. Who makes these, and can I trust them (Hero, the brand's head: its mark, its name, its rating and how many records it has) → what they are known for (Points) → every record of theirs, narrowed (Records, filtered) → who vouches for them (Testimonials, reviews) → where else to look (Doors). |
| last | **Compare** | `COMPARE` | Home › Phones › Compare | Two to four records a reader chose, side by side. Which ones am I comparing (Hero, its words alone) → how do they differ, row by row (Compare, the records: their pictures first, then their facts in groups, each record's own action under its column). The Seeker picks the records from their cards, and the chosen ones wait in a tray at the foot of the page until Compare opens. |
| last | **Detail**, under a listing or a category | `DETAIL` | Home › Jobs › One job | One record, the page a card opens. Is this the one, what does it cost, how do I get it (Hero, the record's head: its pictures beside its name, maker, rating, key facts, price and one main action) → what do I get (Points) → what exactly is in it (Feature grid, its contents) → who vouches for it (Testimonials, reviews) → what will I ask (Questions) → what else is like it (Records, by shelf) → what do I do now (Closing call, with the record's one action). |

A marketplace also holds Text and Not found, the standard pages of every site. The sections each kind names are the container kinds below, and the catalogue gives each section's case. **A Seeker keeps a record with one press, from its card or from its page**: on this device, or in their account where they are signed in, and the Saved page shows what was kept.

## The sections, by name — 🔮

Each section gives the question it answers, its **For** line, what calls for it, its look in the design system's units and props, how it stacks on a phone, when not to use it, and its spec in `refs/support/surface/site-patterns/`. Shown features, a directory, plans and quotes are uses of the Feature grid, because their look is the grid's.

| Container kind | It answers | Calls for it |
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
| Highlight | What matters most here? | one thing the page wants remembered, shown whole in a lit frame |
| Reading column | Let me read it through. | a long text read whole: an article, a reference page, a changelog, a text page |
| Records | What is here, all of it? | the records of one kind, each a door to its own page |
| Plans | Which plan is mine? | the plans side by side, each with what it costs and holds |
| Compare | What does each hold, row by row? | the same facts of several plans, alternatives or records, read across |
| People | Who is behind this? | the people of a team, each a mark, a name and a line |
| Find | Where is the answer? | the question a reader came with, and a way to search |
| Footer | Where is everything else? Who is behind this? | the brand, the site's links and its legal line, at the foot of every page |

### Hero

- **For** Visitor · Learner · Seeker. For a Learner it is a doc page's head: `size` `MD`, `START`, with no actions. For a Seeker on one record's page it is that record's head: its pictures beside its name, its key facts, its price and one main action.
- **Calls for it.** The section that says what the page is: its one claim, and what shows it at a glance.
- **Look.** `DSSectionContainer` `size` `LG`, or `XL` where the hero is the page's emphasis, `color` `BASE`. Inside it, a `DSFeature` at `pageLevel` `PAGE`. The media keeps the frame of its kind: a product is `frames` `MEDIA` with `surface` raised, `elevation` `LG`; a diagram is flat; a mood picture is `type` `BACKDROP`. Use `type` `SPLIT_END` for one picture the title names, and `MEDIA_BOTTOM` for two panes or a wide picture. Centre the words, `textAlign` `CENTER`, only when nothing stands beside or under them. A state such as Alpha is a `BADGE` `eyebrow` in `PRIMARY`, at the level's `variant`. The stack names kinds, so it goes in up to four `BADGE` `facts`, each `OUTLINE` in `DEFAULT` (`RULE.SUPPORT.SURFACE.371` · GUIDE). The actions are the page's one `SOLID` primary, then one `OUTLINE`. With items, use `actionsPlacement` `BEFORE_ITEMS`. A hero takes no `reveal`.
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

- **For** Visitor · Learner · Seeker.
- **Calls for it.** Items, from two up to eight, each a title and one line about the section's one subject. No link, no order, and not numbers that prove a claim.
- **Look.** A `DSFeature` at `CONTAINER`, `items.type` `GRID`, flat (no `items.surface`), `textAlign` `START`. `gridColumns` follows the count: 2/2/1 for two or four; 3/2/1 for three or six, or 3/3/1 when the lines are short; 4/2/1 for seven or eight; 3/2/1 for five. Items side by side are one sentence each, of about one length. Use `items.orientation` `HORIZONTAL` when the lines are short. Points in one column, beside a picture or as a column of checks, are `items.type` `LIST`, with a line between each two. The fill is `BASE`; `DEFAULT` only where the points state the problem the page ends. Where the words run long and a picture draws the points themselves, use the head across.
- **With icons.** When each point has an icon that names its kind, give each item `media` `ICON`: the design system draws it on the title's first line, at its level's size, with the description under the title. Six such points stand 3/2/1, flat, with no lines.
- **On a phone.** The words, then one point under another.
- **Not when.** The items link: Doors. Each item is a thing of its own: Feature grid. The items run in an order: Steps. The items are numbers: Numbers.
- **Spec.** `points.dg.json`.
- **Before and after.** The old way against the new is Points, and never a table. Each point is a question the reader asks: its line is the new way's answer, and the old way is a text fact labelled *Today*. A data table is an app's reading unit and never draws a site's section (`RULE.SUPPORT.SURFACE.293` · MUST · skill:spn-surface/design).

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
- **Look.** A `DSFeature` with `mediaNode`. The frame follows the kind of the media (`RULE.SUPPORT.SURFACE.293` · MUST · skill:spn-surface/design): a product is `frames` `MEDIA`, `surface` raised, `elevation` `MD`, or `LG` in the page's emphasis; an illustration or a diagram is flat on the section; a photo is flush and rounded; code panes are flat, each as tall as its lines. Use `type` `SPLIT_END` when the picture is one thing the title names and reads at half width, about 630px at 1440; `MEDIA_BOTTOM` for two or more panes compared, a wide table or chart, or four thumbnails. Points go beside the picture as a `LIST`, or across above it as a `GRID`. Where the picture and the words differ in height, `verticalAlign` stands the shorter against the taller: a picture shorter than its words takes `CENTER`, the default, or `BOTTOM` where it draws the points and its foot meets the last of them; a picture taller than its words takes `TOP`. Where the words run long and the picture draws the points, use the head across. `reveal`: `text` `RISE`, `media` `FADE`, `items` `RISE`. The fill is `BASE`; `DEFAULT` only where the neighbours hold another kind of reading.
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
- **Under.** `type` `MEDIA_BOTTOM`, and the `mediaNode` is a `DSTabs` at `pageLevel` `CONTAINER` with `type` `PILL`, the look of a website's pages (`RULE.SUPPORT.SURFACE.209` · GUIDE); the level gives its size, and it stands grouped on its track. Tab names are short, one or two words. The tabs only choose which panel is open, and the open tab's panel is the page's own node: the tab's line, one description that says what only this part says, then its picture at the feature's full width. The line and the description are the page's words at the title and description steps of `WIDGET`, so no tab and no `DSFeature` prop is needed. Every panel's picture is one shape, so the section does not jump as the tabs change, and each has its own alt.
- **On a phone.** Beside: each option says its result in words, and the picture stays at rest below, not pinned. Under: the words, then the pills, which keep one row and scroll sideways, then the open tab's line, its description and its picture, which keeps a legible width and scrolls sideways in its own frame, named as a region so the keyboard scrolls it too.
- **Not when.** A press changes nothing: Steps or Points. A press opens a page: Doors.
- **Specs.** `choose-to-see.dg.json`, the options beside their picture; `choose-to-see-under.dg.json`, the pills over the open tab's panel.

### Doors

- **For** Visitor · Learner · Seeker. For a Learner a doc ends on doors, not on a closing call. For a Seeker the doors are the categories, and the smaller categories inside one.
- **Calls for it.** Items that each open another page.
- **Look.** The items are boxed and raised `MD` on the fill that stands off the section: `items.surface` `color` `DEFAULT`, raised, `elevation` `MD`, on a `BASE` section (`RULE.SUPPORT.SURFACE.293` · MUST · skill:spn-surface/design). Each item has an `anchor`. A door stands for a page of its own, so where it has a picture, the picture is a mark, `media` `MARK`. Each may end on an `endNode`: `ARROW_UP_RIGHT` when it leaves the site, `ARROW_RIGHT` inside it. `GRID` columns follow the count, as for Points. Use a `LIST` when each door names a person or carries a long line. A door does not stand on a filled section. A button beside the doors opens a different place, such as the group's overview, not a page a door already opens.
- **On a phone.** One door under another.
- **Not when.** The item is read and not pressed: Points. The door opens the page the closing call already opens: say it once.
- **Spec.** `doors.dg.json`.

Five doors in a row cannot be drawn: the columns stop at four. Three over two reads as a choice made on purpose.

### Feature grid

- **For** Visitor · Learner · Seeker. Plans, quotes and a directory are for a Visitor; a showcase's groups for a Learner; what one record holds for a Seeker.
- **Calls for it.** A set of things, each of its own: a module, an integration, a group of components, a feature shown with a picture of its own, a plan or a quote. Each carries more than a title and a line: its own picture, its own mark, its facts, its own points, or its own page.
- **Look.** `DSFeatureGridSectionContainer` with `section` (`BASE`, `MD`), `heading` (its actions stand under it) and `grid` by count. Each cell is a `DSFeature` at `pageLevel` `GROUP`, with `media` `MARK`: a short point under the heading. A cell with a picture of its own, or a plan, is at `WIDGET`. Give cells an `eyebrow` when they share a family, and `facts` for the count. **A cell's eyebrow is its group or kind as text, the overline the feature draws, and a badge only when it says a state, in that state's hue** (`RULE.SUPPORT.SURFACE.372` · GUIDE). A cell with an `anchor` is a door: `frames` `TEXT` and `MEDIA`, `surface` raised, `elevation` `MD`, on `DEFAULT`, so its mark stands inside the one box that lights. A cell that opens nothing is boxed and flat: `frames` `TEXT` and `MEDIA`, `surface` bordered. The cells of a row stand at one height (`RULE.SUPPORT.SURFACE.530` · MUST · skill:spn-surface/design).
- **Shown features.** Two to four features of one product, each with a small picture of the product doing it. Each cell is a `DSFeature` at `WIDGET` with `type` `MEDIA_TOP`; its `mediaNode` is the picture, built from the design system's own units, flat and unframed. The words stand under it at `START`: a title that makes the claim, and one line. The grid draws lines between the cells, `grid.borderType` `GRID`, and no box around any cell, in 2/1/1 or 3/1/1.
- **Directory.** Many things of one kind, read as a catalogue, such as integrations or data sources. Each cell has `media` `MARK`, the name as its title, `facts` with `factsPlacement` `AFTER_TITLE` for its kind and how it connects (*CRM · OAuth*), and one line. The cells are lined, not boxed, `grid.borderType` `GRID`, in 3/2/1, so the set reads as one table. A cell that opens the thing's page has an `anchor` and is pressed whole.
- **Plans.** The section is `DEFAULT`, because comparing offers is another kind of reading. Each plan holds one eyebrow, its name; a second word such as Most popular is the plan's highlight, a `BADGE` fact in `PRIMARY` at the level's `variant`, not a second eyebrow (`RULE.SUPPORT.SURFACE.373` · GUIDE). Its `items` is a `LIST` of what it holds, each with a check icon, and it has one action. The recommended plan is raised `MD` and carries that highlight. A row-by-row comparison under the plans is `DSComparison`.
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

- **For** Visitor · Learner · Seeker.
- **Calls for it.** Questions, from three up to eight, each with a short answer.
- **Look.** A `DSFeature` at `CONTAINER`, `BASE`, whose title and description stand centred over the accordion, `textAlign` `CENTER`, and whose `contentNode` is a `bordered` `DSAccordionGroup` with its first question open. The section and the feature take their full width; the page writer sets the accordion in a wrapper of its own at the reading measure, centred, and the words of each question start at the start. The accordion runs by the task pattern Disclose (`standards-patterns.md`).
- **On a phone.** As it is.
- **Not when.** The answers are long reading: write a doc page.
- **Spec.** `questions.dg.json`.

### Closing call

- **For** Visitor · Seeker. A Learner's page has none: a doc closes on where to go next. A Seeker meets one only on a record's own page, carrying that record's one action.
- **Calls for it.** The page's last words, and its one call to act.
- **Look.** `DSSectionContainer` `size` `SM`, `color` `PRIMARY`, `strength` `SUBTLE`, with `inset`. A site whose brand reads as a solid band may use `SOLID`, with buttons coloured `DEFAULT`. Inside, a `DSFeature` with `textAlign` `CENTER` and words alone. One `SOLID` primary, and at most one `OUTLINE` that opens a page no door above it opens. The words are not framed. One variant has a product picture beside, with `type` `SPLIT_END` and `START`, when the call is to go and see the product.
- **On a phone.** The words, then the buttons, one under another.
- **Not when.** Doors already end the page.
- **Specs.** `closing-call.dg.json`, centred on `PRIMARY`, `SUBTLE`; `closing-call-beside.dg.json`, the variant with the product beside.

One call is enough. A second button that opens a door the reader has just passed says the same thing twice.

### Highlight

- **Calls for it.** One thing the page wants remembered, shown whole in a lit frame.
- **Look.** `DSSectionContainer` holding one `DSFeature` framed raised and full, at most once on a page and never first. The case it draws by default is the kind's own, and the other cases are in the Surface Catalogue.
- **Spec.** `highlight.dg.json`.

### Reading column

- **Calls for it.** A long text read whole: an article, a reference page, a changelog, a text page.
- **Look.** `DSSectionContainer` holding one `DSFeature` at the start, at a reading width. The case it draws by default is the kind's own, and the other cases are in the Surface Catalogue.
- **Spec.** `reading-column.dg.json`.

### Records

- **For** Visitor · Learner · Seeker. For a Seeker it is most of a marketplace: the records by shelf, the records narrowed by filters, or the ones they kept.
- **Calls for it.** The records of one kind, each a door to its own page.
- **Look.** `DSFeatureGridSectionContainer` of cells, each a title, a line and one fact. The case it draws by default is the kind's own, and the other cases are in the Surface Catalogue.
- **Spec.** `records.dg.json`.

### Plans

- **Calls for it.** The plans side by side, each with what it costs and holds.
- **Look.** `DSFeatureGridSectionContainer` of cells, each a plan with one action. The case it draws by default is the kind's own, and the other cases are in the Surface Catalogue.
- **Spec.** `plans.dg.json`.

### Compare

- **For** Visitor · Seeker. For a Seeker the columns are the two to four records they chose, each with its own action.
- **Calls for it.** The same facts of several plans, alternatives or records, read across.
- **Look.** `DSFeatureGridSectionContainer` of cells holding the same facts in the same order. The case it draws by default is the kind's own, and the other cases are in the Surface Catalogue.
- **Spec.** `compare.dg.json`.

### People

- **Calls for it.** The people of a team, each a mark, a name and a line.
- **Look.** `DSFeatureGridSectionContainer` of cells, each with a mark. The case it draws by default is the kind's own, and the other cases are in the Surface Catalogue.
- **Spec.** `people.dg.json`.

### Find

- **For** Learner · Seeker. For a Seeker it is the first section of a marketplace's home and of its search page.
- **Calls for it.** The question a reader came with, and a way to search.
- **Look.** `DSSectionContainer` holding one `DSFeature` with one action that opens the search. The case it draws by default is the kind's own, and the other cases are in the Surface Catalogue.
- **Spec.** `find.dg.json`.

### Footer

- **For** Visitor · Learner · Seeker.
- **Calls for it.** The foot of every page of a site: the brand, the places the site holds and its legal line. No content signal chooses it, because every site's page ends on one.
- **Look.** `DSSectionContainer` `size` `SM`, with no line above it. In it, the brand linked to the site's home (`architecture-layouts.md`) and its one line; under them columns, each a `DSList` with its title and flush rows of quiet links, so the words keep the column's edge; last, one hairline above a legal bar of the legal line and its links.
- **On a phone.** The brand and its line, then one column of links under another, then the legal bar.
- **Not when.** The page is an app's screen or a sign-in step. The links duplicate a menu in a long list: keep the columns to the groups a visitor looks for at the foot.

A footer has one shape, so two sites do not build two.

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
