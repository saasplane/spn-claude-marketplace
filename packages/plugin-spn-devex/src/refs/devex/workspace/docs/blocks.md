<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-pages.md",
      "section": "The masthead, and the opening",
      "seen": "b8b710da"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/06-blocks.md",
      "section": "The blocks — what a page reaches for instead of prose",
      "seen": "da0019b4"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/06-blocks.md",
      "section": "Four blocks have a spelling in markdown",
      "seen": "b8bbc30f"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/06-blocks.md",
      "section": "Which block a content takes, and how its fence is written",
      "seen": "630320ab"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/06-blocks.md",
      "section": "Group panels, and the rows and folds inside them",
      "seen": "8277bd3f"
    }
  ]
}
-->
# Blocks, in the spelling you actually write

**Source of truth:** the foundation's `04-capabilities/01-devex/04-workspace/04-docs/06-blocks.md` — *The blocks*, *Four blocks have a spelling in markdown* and *Which block a content takes, and how its fence is written* — and `05-pages.md` — *The masthead, and the opening*. This file restates them for an agent that ships without the book beside it; where the two disagree, the book wins. The figures a block holds are restated in the figures ref beside this file.

**You write markdown.** `docs page write` produces the HTML, and the shared stylesheet that every page
links supplies every border, background and colour. That gives a block the same form on every page
and in both themes, so you never add styling to a page. So this file is the whole vocabulary you
need: what a block is *typed as* in a seat file. The HTML blocks template is the **rendered**
reference a person opens to see what a block looks like. It is much larger than this file and tells
you nothing you can type, so do not open it (Q135, 2026-09-22).

The rules behind this file are `06-blocks.md § The blocks`. When the two
disagree, the chapter wins and this file is wrong.

## The masthead comes first, and it is three levels

**A page opens on its Title, its Subtitle and its Description, and nothing else sits above the
first heading.** In a construct seat you type them in three places:

| Level | What you type in the seat | What it holds |
| --- | --- | --- |
| **Title** | the `# Title` line, matching the block's `title` | the construct's own name, in full |
| **Subtitle** | a `subtitle` field in the `spn:doc` block. Never a paragraph in the body, because `docs page` reads the first lead paragraph as the Description | one plain sentence: the construct's one-line promise |
| **Description** | the first paragraph after the tag line, and only one | what it is · why read this page · at most two short sentences on how the page runs |

**All three are plain language** (`RULE.DEVEX.WORKSPACE.182` · MUST · check:doc-check) (`RULE.DEVEX.WORKSPACE.187` · MUST · check:doc-check): everyday
words, one idea a sentence, no numbers, no slogan, no figure of speech, and no book word the same
sentence does not explain. The block's `summary` is the Description's first sentence, word for word.
**Show a new Title or Subtitle to the developer before you write it.** The only exemption is the
foundation hub's Title and Subtitle, fixed by `DEC.DEVEX.WORKSPACE.143`. What each level holds on the
other page kinds is [`doc-sets.md`](doc-sets.md) § Every page opens on a masthead of three levels.

## Most of a page is not a block

Paragraphs, lists, numbered steps and subheadings are what a section is made of. Write them plainly
and label them as nothing at all. **A section holds none, one or several blocks**, and nothing
declares *the* block of a section.

**Every page kind bounds its prose, and a paragraph that does a block's job is flagged.** A preview and an approach
page hold a paragraph to 60 words beside another block and 120 as a part's only content, a list to seven items each
under 25 words, and a callout to one sentence. A hub, an overview, a guide, a report and a construct seat file explain,
so they hold 120 and 200 words, ten items each under 60 words, and three sentences (rules 522 and 531). `doc-check`
names, as a SOFT finding, a paragraph that lists items, sets today against after, gives steps, or crowds code names
(rule 530; the table below).

## A page is written in two passes

**Write the text first, then give each subsection the block that shows it best** (rule RULE.DEVEX.WORKSPACE.533).
The first pass is the page kind's sections and, under each subsection, its topic name, its claim and its content, in
plain sentences with no block chosen. The second pass takes each subsection in turn, reads what its content is,
picks the block from the table in *What you type*, and writes it in its own form. A seat file's blocks are the
spellings in this file, and `docs page write` renders them; an approach page and a preview take the same blocks
as HTML from `blocks-template.html`. Then run `docs page check` or `docs audit`, whose SOFT findings name each
paragraph that should have been a block. The check runs on the saved file at every Stop and in `docs check`, not only on Write and Edit, so a page written any other way is checked too.

## Every block has a rule

**Each block has its own rule: when to reach for it, its parts, its limit and the check that holds it** (rule
RULE.DEVEX.WORKSPACE.530). Where a limit has two numbers, the first is a preview's and an approach page's, and the
second an explaining page's.

| Block | Reach for it when | Its parts | Its limit | Held by |
| --- | --- | --- | --- | --- |
| **Paragraph** | one claim with its grounds | the claim, then the reason | 60 words beside another block, 120 alone · 120 and 200 | `doc-check` (531) |
| **List** | a few loose points, no order | one line a point | 7 items, each under 25 words · 10, each under 60 | `doc-check` (522, 531) |
| **Numbered list** | steps, the order is the content | one step a line | the list's limit; a path that turns is a flowchart | `doc-check` (530) |
| **Callout** (`MUST`) | a rule somebody must follow | the rule, then its check | one sentence · three | `doc-check` (522, 531) |
| **Table** | a record, or things compared down a column | a header, a row a thing | a column only where a reader compares down it | `doc-check` (259) |
| **Item cells** | several things, each with facts | title, its line, its facts | three levels, no inline style | `doc-check` (259) |
| **Comparison** | two states of one thing | a Today and a Proposed column | prose that sets them side by side is this table | `doc-check` (530) |
| `CODE` | a literal | a fence tagged with its language | declarations only for a public shape; two code names in a sentence | `doc-check` (530) |
| `FILE` | code that is one file, or part of one | path as title, language as badge | the path from the repository's root | the page writer (532) |
| `UNIT` | a unit of the design system shown as it draws, on a surface sample page only | a fence tagged `unit`, one tree | one tree; no raw element, no finding left; never on a docs page (`RULE.DEVEX.WORKSPACE.571` · GUIDE) | the page writer (538) |
| `TREE` | a hierarchy easier read than drawn | a fence tagged `tree`, one path a line, a folder ending in `/`, its note after two spaces | paths and short notes, never sentences | `doc-check` (233, 238) |
| `COMMAND` | something the reader runs, in a terminal or asks of the agent | a fence tagged `sh` (or `bash`), one command a line, `run=claude` after the tag for a step asked of the agent; in a guide, a step's command. Drawn in a frame: where it runs with a copy button, a quiet `$` never selected or copied, the step's What you see below | one command a line, never a script (a script stays `CODE`); its result is a line, not pasted output | the page script and `doc-check` |
| `DIFF` | what a file says today and will say | a `FILE` frame holding a `diff` fence | an approach page or a preview only | the page writer (532) |
| **Figure** | a shape: parts, a path, participants, data | a sentence before, the drawing, a caption after | drawn from a spec | `docs figure check` |
| `CATALOG` | a set of named things, no order | a tile: name, line, literal | one line a tile | the page writer (532) |
| `CARDS` | pages a reader might go to next | optional kicker, title, description | one grid for a subsection | the page writer (532) |
| `NEXT` | the two pages either side | a title and a direction | two doors, no paragraph | the page writer (532) |
| **Sample link** | a whole file of the work | a link into `samples/` | never framed in the page | read at review |
| **Card** | a decision still open | options side by side, and the card | the card section of the book | `doc-check` |

What `doc-check` flags, each as the block it should have been:

| The paragraph | The block |
| --- | --- |
| lists four things after a colon, or three clauses joined by semicolons | a list, or a table of item cells |
| sets today against what is proposed | a table with a Today and a Proposed column |
| gives steps as First, then Then | a numbered list, a chain or a flowchart |
| holds a run of four code names joined by commas, or five in a sentence | a list, a table or a `FILE` frame |
| runs past its page kind's bound | a subsection, or a table |

## What you type

| What you are writing | What you type |
| --- | --- |
| an explanation, an argument, a part, the Description | a paragraph. Nothing else |
| two states compared (today and proposed) | a table with the columns Today and Proposed |
| several things, each with facts | a table of item cells: the item's title, its line and its facts in three levels |
| steps someone takes | a flowchart where the path turns, a chain where it never does |
| the parts of one thing, or who speaks to whom | a map, or a sequence |
| a screen or a layout | a `skeleton` figure, one view for each screen class, drawn by `docs figure draw` |
| a decision still open | its options side by side, and its card |
| a public shape (a contract state, a route, a table, a token, a command's options) | `CODE`: declarations only, a `diff` where the shape exists today |
| how something looks, on a surface sample page | the thing rendered, light and dark side by side: a fence tagged `unit`, one tree (*A rendered unit is a tree*, below). A docs page never holds one |
| a built unit of several parts, on a docs page | a `skeleton` of its parts in their design-system names, and a line naming its showcase page; a single component has no figure (`RULE.DEVEX.WORKSPACE.571` · GUIDE) |
| a named set that needs a head and a one-line description | a group panel holding a list: `~~~group <name> \| <description>` over one `catalog layout=LIST` |
| a named set split into two to six sub-sets, each its own list | a group panel holding `tabs` |
| several named sets, each a peer | a run of group panels |
| one list with nothing above it to name | a plain `catalog` |
| alternatives with no group to name | `tabs` alone |
| what a person can do | a table in the person's words: after, then before |
| a whole file of the work | a link to it in `samples/`, never framed in the page |
| a part, a sub-part | `### Title`, `#### Title` — `###` through `#####` all render |
| a list where order does not matter | `- item` or `* item` |
| a list where the order **is** the content | `1. item` — numbered lists render as numbered lists |
| a rule somebody has to follow (`MUST`) | `> the rule, in one sentence` — a blockquote becomes the accent callout |
| a record, a comparison, a glossary | a markdown table. A table already arrives as a bordered card, so it needs nothing added |
| a literal — a contract, a manifest, a command, its output (`CODE`) | a fenced block **tagged with its language** |
| a hierarchy easier read than drawn (`TREE`) | a fenced block tagged `tree`: a folder (a name ending in `/`), then two spaces or more and what it holds; folders, files, branches, a status word (new, changed, removed) and the notes are coloured apart when the page opens. A `text` block of that shape is read as a tree too |
| today against after (`DIFF`) | a fenced block tagged `diff`. **An approach page or a preview only**, since a construct states current truth |
| a shape (a figure) | a fenced block tagged `dg`, holding strict JSON |
| a set of named things, no order | a fence tagged `catalog`, one line a tile (*Four blocks have a spelling*, below) |
| pages a reader might go to next | a fence tagged `cards`, one line a door |
| the two pages either side of this one | a fence tagged `next`, a `previous` line and a `next` line |
| a code block that is one file | its fence tag carries `file=<path>` after the language |
| a note to yourself, never rendered | `<!-- … -->`, on one line or many |

**A fenced block with no language is never coloured**, so tag it. The page holds the code plain, and
the shared script colours a tagged block when the page opens. The script knows seven languages:
`ts` · `json` · `yaml` · `sql` · `sh` · `diff` · `md`.

**One rule for figures, and it is not optional**: every figure has a **sentence before it** saying
what you are looking at and a **caption after it** saying what to notice. A figure with neither is
decoration.

## A code block that is one file stands in a `FILE` frame

**A code block that shows one file, or a part of one, is framed, with the file's path from its
repository's root as the frame's title and its language as a small badge at the end.** You know which
file you are reading before the first line, and a path in a line above a block is read as prose and
skipped. A `DIFF` always shows one file, so it always stands in one. A block that is no one file — a
command, a sample of output, a shape written out — stays a `CODE` block, with no frame.

In a seat file the frame is a fence tag, ```` ```ts file=packages/x/src/theme.ts ````, and `docs page write` draws it. On a hand-written page (an approach page or a preview) the frame is HTML: a `figure.sds-file` holding
a `figcaption` with its `.sds-file-path` and its `.sds-file-lang`, then the `pre`. The code stays plain
in the file, and the shared script colours it. It is never a sample framed in the page.

## Four blocks have a spelling in markdown

**`CATALOG`, `CARDS`, `NEXT` and `FILE` are fenced blocks, and `docs page write` draws each as the blocks template
shows it** (rule RULE.DEVEX.WORKSPACE.532). A fence reads as plain code on github.com. One line is one thing, and
its parts are split on a space, a bar and a space.

````markdown
```catalog
Hub | the page every path starts from | hub-template.html
Guide | stages and steps
```

```cards
Reading path | what the path covers | path.md
```

```next
previous | The page before | before.md
next | The page after | after.md
```

```ts file=packages/support-web-ds-ts/src/ui/core/theme.ts
export interface IDSTheme {}
```
````

`catalog` makes one tile a line in one grid, its literal in code and optional. `cards` makes a tile a door: the whole tile is one link, with an arrow after the title, and a line of four parts
(`Kicker | Title | description | link`) puts a kicker before the title, where three parts do not. `next` makes the two doors, and a line may be left out. `file=<path>` makes the frame with
the path as its title and the language as a badge. A `cards` line with no link, and a block with no line, are findings.
The `PROSE` panel still has no spelling: write a paragraph where you wanted one, and never hand-write HTML to fake it.

## Which block a content takes, and how its fence is written

**Content that has a shape takes the block that shape names, from this table, read down to the first row that fits** (rule RULE.DEVEX.WORKSPACE.549 · GUIDE). Headings and fact keys are words, never sentences: `Layout · Arrangement · Use`, `Standard pages`, `Frequency`.

**Ask four questions in this order, and the first "yes" decides the block** (rule RULE.DEVEX.WORKSPACE.549 · GUIDE):

1. Is the first thing on each line a condition, a question or a case ("when…", "a unit not built yet", "if…")? Write a plain table.
2. Are two to four things compared fact by fact? Write `catalog layout=TABLE`.
3. Is each line a thing with a name and a sentence a reader reads? Write `catalog layout=GRID`, or `LIST` when the names are long.
4. Otherwise, write a plain table.

Three worked examples, each as Content, Right, Wrong:

- **The figure table itself.** Content: each row starts with a condition ("2–4 things compared fact by fact") and says what to use. Right: a plain table. Wrong: cards, because a reader looks a case up and does not browse names.
- **Four checks, each a name, a sentence and a weight.** Content: `Reach`, `Voice`, `Length`, `Fit`, each with what it measures and how much it counts. Right: `catalog layout=GRID`. Wrong: a plain table, because the names are things a reader browses and the sentences are read.
- **Five numbers sorted by kind.** Content: a kind in the first column and a count beside it. Right: a plain table. Wrong: a catalog, because a number is a value, not a sentence a reader reads.

**GRID or LIST is decided by what each item holds.** Use `GRID` for a fixed set of types a reader scans and picks from, when every item fits a card: a name of up to four words, one line of up to about fifteen words, and at most three short facts. A card is drawn in `DSCardWidget`'s parts: the name and line in the head, the facts in the content, each key above its value. Short facts stand side by side in one row; a longer fact stacks under them across the card, with room between the facts that stack. Use `LIST` for anything longer: a name over four words, a line over about fifteen words, more than three facts, or facts that are sentences. Rows are for things a reader reads down, and a list names where its facts stand (rule 563). More than six items in the construct's own groups take group panels, and each panel holds a `GRID` or a `LIST` by the same test.

Then read the table down to the first row that fits.

| When the content is | Use |
| --- | --- |
| 2–4 things compared fact by fact | `catalog layout=TABLE` |
| things a reader browses | `catalog layout=GRID`, or `LIST` when the names are long |
| more than six items in groups, read as one list | a `catalog` with `## Group` lines, one list with jump links |
| a named set with a head and a description, its members a list | a group panel holding a `catalog layout=LIST` |
| a named set split into two to six sub-sets | a group panel holding `tabs` |
| whole alternatives, where each reader needs one | `tabs look=PILL` |
| one block in several forms | `tabs look=LINE` |
| two short views flipped back and forth | `tabs look=SWITCH` |
| detail some readers want | a fold |
| a file the page explains | `file=<path> fold` with an empty body |
| what every reader must read | stays on the page |
| a wide comparison of attributes | a plain table |

The rows leave some content between two of them. These lines settle the usual cases, so two writers choose the same block:

- **Two to four things make a catalog table, and five or more make a wide one.** A `catalog layout=TABLE` holds two to four things and at most six facts. Five things or more, or seven facts or more, is a wide comparison and stays a plain table.
- **A catalog needs a name for each item, once.** A table whose first column repeats a name, or has no name at all, stays a table.
- **A description is a clause a reader reads, not a value.** A column of sentences or clauses beside a name reads as a catalog. A column of numbers, owners, states or one-word values is a table of attributes, and stays a table.
- **A fact is a value compared down a list; a phrase that describes the item goes in its line.** A short fact is a word, a number, a status, a version (up to about 20 characters) or up to three tags. A fact that is a phrase about the item is folded into the item's line (rule 549).
- **A catalog list names where its facts stand, `facts=END` or `facts=AFTER_DESCRIPTION`; the page writer never guesses it** (`RULE.DEVEX.WORKSPACE.563` · GUIDE). The two are the design system's placements: `END` is `DSItem`'s end part, `AFTER_DESCRIPTION` is `DSItemFactsPlacementType`'s default.
  - **`END`, when every fact is short:** up to three columns at the row's end under a header row naming the thing and each fact once, every heading and value set at the start; an item without a fact leaves its cell empty. A longer value, or a fourth column, stops the write and names `AFTER_DESCRIPTION`.
  - **`AFTER_DESCRIPTION`, the default, when a fact is a sentence:** under the description. One fact name across the list is one `Key: value` line; two or more are cells, each key over its value, one column for each key in the same place on every item, an empty cell kept.
  - A list with no `facts=` whose facts are all short is a soft finding that names `END`. `facts=` is for `LIST` only.
- **A fact whose value is codes from a closed set is written as tags** (`RULE.DEVEX.WORKSPACE.564` · GUIDE): `Owes: [UNIT] [COMPONENT]`, one bracket for each code, drawn as one badge each. Up to three tags count as a short fact, so they may stand in an `END` column. Use it for a tier, a status or a kind, never for words. A line of tags with no key is drawn as bare badges, in any layout, only as an item's one fact; beside other facts or in an `END` list it is a finding.
- **Which part of a list item does this go in?** Read down to the first row that fits (rule 549):

| What you have | It goes in |
| --- | --- |
| a short value compared down the list: a status, a weight, a grade, a version, a count, up to three tags | a fact, with `facts=END`: a column at the row's end, named once in the header row (up to three) |
| words that describe the item | the item's line |
| what the item prints, such as a message | a quote, a `> ` line under the item in the fence |
| one phrase that holds only under a condition | a note, a `~ Label: phrase` line under the item |
| a fact that is a sentence, or more than three facts | a fact, with `facts=AFTER_DESCRIPTION`: under the description, one `Key: value` line, or a cell for each key |
| only a few codes from a closed set, with no name needed | a line of tags with no key: bare badges, the item's one fact |
- **A table of links to parts of the same page stays a table.** `cards` are doors to other pages a reader may open next; a list of examples or references is not a set of doors.
- **A converted table keeps its words.** The first column becomes the items' names and its heading is dropped. Each other heading becomes a fact key and is cut to a word or two (`The prefix of its published keys` becomes `Prefix`). An item may have no one line of its own.
- **Order decides between a list and a figure.** Steps a reader carries out in turn are a numbered list, and stay numbered when the sentence before them counts them ("Three steps…"). A flow between things the page names is a `chain`. Layers inside a boundary are a `system`. Anything else that connects things is a `map`.
- **A tree is a `tree` fence**, one path a line, children indented two spaces under their folder, a folder ending in `/`, and a note after two spaces. A line that is no path is a note on the line before it.
- **A code block with no path stays `CODE`.** A `FILE` frame names the file the block is; a block that holds two files is two fences.
- **A drawing a `dg` kind cannot draw stays the hand-drawn figure the page already has**, between its `<!-- fig:name -->` markers: plates, the task-state colours, people and agents. A new figure starts as a `dg` fence and becomes hand-drawn only when no kind can say it.
- **A table the tools read keeps its form.** A construct's `Terms`, `Binds` and vocabulary tables, a register's rows and every generated block are read by the docs tools, which build the glossary and the rules index from them, so they stay plain tables whatever their shape.
- **A first column of conditions is a table.** When each row starts with a case ("if…", "a provider's `NEW`"), not the name of a thing, the content is a lookup and stays a table. Questions asked in order are a numbered list, not a flowchart.
- **A chain is for steps in order.** A run a thing goes through (build, scan, attest) is a `chain`. Things related by verbs ("cites", "declares", "bounds") are a `map`, with the verb on the link.
- **A tree is for a hierarchy.** Flat paths with no nesting stay a list or a table; a tree's note is everything after the two spaces.
- **A heading cut to a word applies to every table you touch**, kept or converted, and a transposed table's row labels are cut the same way.
- **Was and Now headings stay on a book page.** Today and Proposed are a workstream page's comparison words, never a construct's.

A plain table of a name column and a description column past four rows reads as a catalog, and the page writer says so as a soft finding. A fence is written as the page writer reads it, and reads as plain code on github.com:

| Block | You write | It becomes |
| --- | --- | --- |
| `CATALOG`, `GRID` | a fence tagged `catalog`, one line a card: name, one line; the card's facts on the lines under it, indented, one `Key: value` a line | cards in a grid of two to four across, in `DSCardWidget`'s parts, each fact's key above its value |
| `CATALOG`, `LIST`, `END` | the same fence tagged `catalog layout=LIST facts=END`; `name=Rule` (the item noun) heads the main column, and each fact column is headed by its key | one item a row, its short facts as up to three columns at the end under a header row |
| `CATALOG`, `LIST`, `AFTER_DESCRIPTION` | the same fence tagged `catalog layout=LIST`, or with `facts=AFTER_DESCRIPTION` | one item a row, its facts under the description: one `Key: value` line, or a cell for each key, lined up down the list |
| `CATALOG`, `TABLE` | the same fence tagged `catalog layout=TABLE` | the cards as columns and each fact key as a row; the key column takes its row's fill and stays at the start with an edge shadow while the table scrolls, as `DSTable`'s pinned column does |
| bare tags | an item's one fact written as a line of tags with no key, `[UNIT] [COMPONENT]` | the tags alone, as badges, in any layout |
| `CATALOG` media | `media=ICON`, `MARK`, `AVATAR`, `AVATAR_GROUP` or `MEDIA_TOP` after the tag, one for every item; an item names its media after its line | none by default: an item takes media only when the picture tells a reader something its name does not, never as decoration on every card; `ICON` for an item read as a line, `MARK` for an item that is a thing of its own, `AVATAR` for a person or a team, `MEDIA_TOP` for an item told best by its shape |
| `TABS` | a fence of tildes tagged `tabs look=LINE`, `SWITCH` or `PILL` (`LINE` when left out), and a `--- <label>` line before each panel, whose body is one block; two to six tabs, never nested | a bar at the start and one panel at a time; every panel shows where the script does not run |
| group panel | a fence of tildes tagged `group <name> \| <description>` holding one `tabs` or one `catalog` fence | one panel: name, description and count in its head, its body flush; a fenced group draws no row of jump links |
| `## Group` lines | inside a `catalog` fence | one panel for each group, with a row of jump links above them |
| fold | `file=<path> fold` after the language, the body left empty to read the file from the repository root | the file's frame inside a `details` whose summary is the path |

````markdown
~~~group The parts of a category | what a category is made of
```catalog layout=LIST facts=AFTER_DESCRIPTION
Shared | what every category holds
  Code: [OWN]
  For: a designer
  Choose when: a value is the same on every page
  Not when: one page needs its own look → Style
```
~~~

```catalog layout=GRID
`RAIL` | a sidebar
  Navigation: at the side
```

~~~tabs look=PILL
--- Server
The server's way.
--- Web
The web's way.
~~~

```yaml file=docs/spec.yaml fold
```
````

## Group panels, and the rows and folds inside them

**A named set that needs a head is a group panel** (`RULE.DEVEX.WORKSPACE.565` · GUIDE): `~~~group <name> | <description>` holding one `tabs` or one `catalog` fence, drawn as one panel with its title, description and count in its head and its body flush. Groups never nest, and a fenced group draws no row of jump links. Pick by the set: a list for a named set of items, tabs for a set split into two to six sub-sets each its own list, a run of panels for peer sets, a plain `catalog` for a list with nothing above it to name, tabs alone for alternatives with no group to name, and a `catalog` with `## Group` lines for more than six items in groups read as one list.

- **A list in a group draws Plan-style rows** (`RULE.DEVEX.WORKSPACE.566` · GUIDE): the title, its description, one small line of facts, and one closed-set fact `[CODE]` as a badge at the row's end.
- **An item's `For:`, `Choose when:`, `Not when:` (`condition → instead`) and `Rules:` lines are one closed Guidance fold under the row** (`RULE.DEVEX.WORKSPACE.567` · GUIDE).
- **A fact drawn with its item has one look** (`RULE.DEVEX.WORKSPACE.568` · GUIDE): the text font, the key in the fact colour at medium weight, the value in the card title colour. Only a fact in a column of its own (`facts=END`, a table) keeps the column's look.
- **A numbered table reads its number and title on one line** (`RULE.DEVEX.WORKSPACE.569` · GUIDE).
- **A group's name and description are the construct's own words** (`RULE.DEVEX.WORKSPACE.570` · GUIDE).
