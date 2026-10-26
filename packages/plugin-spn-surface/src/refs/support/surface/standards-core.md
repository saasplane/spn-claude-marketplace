<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-surface/01-standards-core.md",
      "seen": "36da06ae"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/01-standards-core/",
      "seen": "66812030"
    }
  ]
}
-->

# Standards — What Every Page Is Held To

Source of truth: the foundation's Standards construct (`docs/02-constructs/02-support/01-surface/01-standards-core.md`) and its capability chapters (`docs/04-capabilities/02-support/01-surface/01-standards-core/`). Standards is the first of thirteen Surface constructs, in three groups: Standards, Architecture and Delivery.

Read this before you design a page, before you review one, or before you add a second kind of surface. It states what a surface is built in, who the app is for, what one page is for and how its words follow that, before any block is named. `standards-interaction.md`, `standards-patterns.md` and the ten `architecture-*` and `delivery-*` refs in this folder carry the rest of the domain; this one is the first.

## Terms

| Term | What it means |
| --- | --- |
| Kind of surface | where a surface runs and how a person reaches it: web today, native later |
| Page | one route of an app, with one purpose |
| Block | any unit a surface is built from: a layout, a container, a widget or a component |
| Level | one step of the chain from the app to a component, with what that step owns |
| Device type | the screen class and the orientation a page is drawn at |
| Line of facts | the one line under a title that holds the short facts of a thing, such as its state, its kind and its code |
| Kind of person | who an app is for, named by how they use it: Team, Everyday users, Visitor or Learner |

## The kinds of surface — ✅

A kind of surface says where a surface runs and how a person reaches it: **web**, with a pointer and a keyboard, in a browser window, realized today; **native**, with touch, on a phone or a tablet, realized later. A rule is shared only when it holds on every kind of surface — hover is the first example, because it needs a pointer, so it is the web's own shown state and never a shared one. The capability chapters divide the same way: one folder holds what every kind of surface follows, and one folder holds what a single kind needs.

## The levels — 🔮

A surface is built in levels, and each level owns one thing. Read a surface from the top level down.

```text
app  →  page  →  layout  →  container  →  widget or component
        one route   the content   optional
```

| Level | What it is | What it owns |
| --- | --- | --- |
| App | a set of routes | which pages exist |
| Page | one route, with one purpose | which layout it uses, and everything it puts in the content |
| Layout | the frame of a page | the navigation, and the content it hands to the page. Nothing inside the content |
| Container, optional | a part of a page: a panel framed as a header, content and a footer, or a section set apart by its fill | its frame or its fill, and the order of its parts |
| Widget | a unit placed beside others or in a sidebar, built from components | its own working and its size |
| Component | the smallest block | one control, or one way to show something |

- Let a level own what the table gives it, and never decide what another level owns. The container is optional — a page may put a widget or a component straight into the content, or fill the whole content with one block.
- A token is not a level: a token is a value a block is drawn with, and it is not a block.
- The chain says who owns what. A second word, the page level, says where a block stands on a page: `PAGE`, `CONTAINER`, `WIDGET`, `GROUP`, `CONTENT` or `INLINE`. A box tells its level to what it holds, and a block takes its type sizes, heading tag, gaps and buttons from it. A page level is a position and never a unit; `architecture-names.md` holds its values.

## A page has one purpose — 🔮

A page has one purpose: one main intent, and one main action. A page with two purposes is two pages. A review finds it with one question: what did the person come here to do? If the answer needs the word *and*, the page is doing two jobs, competing for the same space.

## The rules of content — 🔮

A page is made of small things that come back on every page: a label, a state, a count, a field, a line of a list. Each has one rule here. A person who has read one page can then read the next, because the same thing stands in the same place on both.

None of these rules names a block, so each holds on every kind of surface. The blocks that carry them are named where they belong. The item line, the badge and the two blocks of a field are in `architecture-components.md`. The data table is in `architecture-components.md`, under Composites. A form and its footer are in `architecture-containers.md`.

The first five rules say what a page shows, and where.

| The content | Its rule | A reviewer checks |
| --- | --- | --- |
| A label | A value **MUST** take a label only where a person cannot tell what the value is without one (`RD.SUPPORT.SURFACE.056`). A name, a picture, a state and an email need none. An address, an owner, a date and a limit each keep their label. This rule is proposed | cover the label and look at the value alone. If you can still tell what the value is, the label is a finding |
| A frame | A part of a page **MUST** take a frame of its own only when it has a title of its own, and also an action of its own or data it loads by itself (`RD.SUPPORT.SURFACE.057`). The record a page is about is the header of the page, and it **MUST NOT** take a frame. This rule is proposed | for each framed part, find its title, and then its own action or its own loading. A frame with no title, or with neither of the other two, is a finding |
| A state | A state **MUST** be shown as a badge (`RD.SUPPORT.SURFACE.058`). It stands on the line of facts under the title, before the other facts, or at the end of the line, and the page chooses by the room the screen gives. It **MUST NOT** stand after the title. The normal state **MUST** show no badge: an active person shows none, and an inactive one shows *Inactive* | find each badge. One that stands after a title is a finding, and so is a badge for the normal state |
| The end of a line | What stands at the end of a line is data: a badge, a count, a status, or the arrow (`RD.SUPPORT.SURFACE.059`, `RD.SUPPORT.SURFACE.178`). A line **MUST NOT** hold an action at its end: the actions of a line stand in the header, the row or the table that holds it. A line that leads to a page **MUST** show the arrow where its row holds no action. A row that has an action **MUST** give it at the end of the row, and it shows no arrow (`RD.SUPPORT.SURFACE.087`). The arrow is off unless the page asks for it | read the end of each line. A line that leads to a page and shows neither an action nor the arrow is a finding, and so is an arrow on a line that leads nowhere |
| A count | An app pattern **MUST NOT** depend on a count (`RD.SUPPORT.SURFACE.050`). A group **MUST** show how many items it has only where the server gives that number together with the groups | read the page as if no count had come. A part that is then empty or wrong is a finding |

- **A badge that says what kind of thing a record is MUST follow the rule of a state.** It stands on the line of facts, as one of the facts, and never after the title.
- **Why a label and a frame are held back.** A label that tells a person nothing new takes room from the value. A frame says that what is inside it stands apart, and a frame around every part says that of nothing.
- **Why a state stands where it does.** A state is one of the facts of a thing, so it is read with them, or at the end of the line where the line is short. A badge on every line would hide the few lines a person has to look at.
- **Why the end of a line is kept so.** A person finds the actions of every line in the same place, and a line with no action still says that it leads somewhere.

The last four rules say how a field, a set of choices and a list are laid out.

| The content | Its rule | A reviewer checks |
| --- | --- | --- |
| A field a person enters | Its title **MUST** stand above its control, and never beside it (`RD.SUPPORT.SURFACE.060`). One line under the control **MUST** hold its description, or its error where the value is refused | look for a title beside a control, and for an error shown anywhere but under the control it belongs to. Each is a finding |
| A field a person reads | Its title **MUST** stand above its value, and never beside it (`RD.SUPPORT.SURFACE.061`). Readings **MUST** stand in a grid: several across at a desktop and a tablet, and one under another on a phone. A fact on a line of facts **MAY** carry its label before it (`RD.SUPPORT.SURFACE.096`), and that is the one exception | look for a title beside a value. Then read the page at each screen class. One column of readings in a part that has room for several is a finding, and so are readings side by side on a phone |
| The choices of one set | The choices **MUST** stand in columns: each choice starts at the same place in every row and in every group (`RD.SUPPORT.SURFACE.062`) | read down the start of the choices. A choice that starts where the one above it does not is a finding |
| The lines of a list | A line **MUST** stand between each two lines of a list (`RD.SUPPORT.SURFACE.063`) | look between two lines of each list. Two lines with nothing between them are a finding |

- **Why a title stands above.** A title above its control keeps the same place at every screen class. A title beside it needs a second arrangement on a phone. A field that is read then has the same shape as the field that is entered.

## What a surface adapts to — 🔮

A surface is not drawn once. A block reads each of these from the context it is drawn in, with no code of the page's own.

| A surface adapts to | What changes | Who sets it |
| --- | --- | --- |
| Density | the size step a block takes when none is set on it | the app, once. A block may set its own |
| Theme | the brand color, light or dark, and the rest of the look | the app, through its theme |
| Device type | the screen class and the orientation | the device |
| Language | every string a person reads, and how a date or a number is written | the person, through their preferences |
| Direction | the side a line of text starts from | the language |

Never write a second version of a page for a density, a theme, a device type or a language.

## Who an app is for — 🔮

Every page asks who comes to it, how often, and to do what, and that answer belongs to the page. One question comes before it, asked once for the whole app: who is the app for? The same list is built one way for a trained team that works in it all day, and another way for many people who open it now and then, on a phone, and were never shown how. So the answer is read before any pattern is chosen, and every pattern reads it.

A **kind of person** is who an app is for, named by how they use it. It is never a business domain, a role such as *merchant*, or one of the platform's apps. Each kind is defined by its answers to the same questions: how often they come, whether they were trained, the device they use, and what they never forgive. The name alone does not carry those answers, so wherever a kind is read, its answers stand beside it.

| Kind of person | Who they are | How often they come | Trained | Their device | What they never forgive |
| --- | --- | --- | --- | --- | --- |
| **Team** | people who use the app as their job: staff, an operator, a seller running a shop, a client firm's employees, the administrator who sets it up | every day or every week; setup pages rarely | yes, or they learn on the job | a desktop, a keyboard and a pointer; a phone for a quick check or an approval | lost work, a slow task they repeat all day, or a page that hides where a task stands |
| **Everyday users** | many people who use the app for themselves: a shopper, a traveller, a patient, a policyholder, a daily news reader | rarely, or now and then; every day for what they read | never | often a phone, by touch, sometimes on a poor connection | a confusing step, an error they cannot fix, or a form that asks too much |
| **Visitor** | a person not signed in, deciding whether a product is for them | once, or a few times while they decide | never | any; often a phone, from a link | a first screen that hides what it is, or a made-up claim |
| **Learner** | a person reading to learn or to get a thing working: a developer in the docs, a person in a help article | in bursts, when they need it | in their own trade, and new to this product | a desktop, beside their work | a missing or wrong step, or a sample that does not run |

- **An app MUST name the kind of person it is for before any pattern is chosen** (`RD.SUPPORT.SURFACE.330`).
- **The kinds of person MUST be one closed set: Team, Everyday users, Visitor and Learner, each with its answers beside it** (`RD.SUPPORT.SURFACE.331`). *Everyday users* is not the platform's user record, which is an identity, and it is not the platform's consumer tier.

### How the kind is read

The kind is read once for the app, from what the partner has already written: the personas whose rows land in the app, each behaviour row's *Who* and *Does*, and the industry brief where there is one. Then ask of each persona: do they use the app as their job? Do they use it for themselves? Are they still deciding? Did they come to learn? Write the kind as the app's first fact, with where you read it.

- **Where the personas and the rows do not say, the kind MUST be asked, and never guessed** (`RD.SUPPORT.SURFACE.330`). A guessed kind looks the same as a read one, so nobody would know to correct it.
- **The kind MUST NOT be read from the platform's tier** (`RD.SUPPORT.SURFACE.330`). An app on a consumer tier is for Everyday users, but a member business on an enterprise account is a Team, and a one-person account in a product sold to the public is an Everyday user.
- **A page that another kind reaches takes that kind** (`RD.SUPPORT.SURFACE.333`). An app's landing and its register page are read by a Visitor, whoever the app is for. In an app that serves two kinds, each page takes the kind of the persona its rows name: in an identity hub, an organization's sign-in policy is a Team's page, and a person's own devices are an Everyday users page.
- **Where two kinds meet on one page, the less forgiving decides** (`RD.SUPPORT.SURFACE.333`). Everyday users decide over the Team, and the Visitor over the Learner, because a trained person loses little on a plain page and an untrained one is lost on a dense one. A page that would need two patterns for its two kinds is two pages, as a page with two purposes is.
- **Where two patterns fit a page's data, the kind of person MUST decide between them** (`RD.SUPPORT.SURFACE.333`). The table below says which one each kind takes.

The register page is where a Visitor becomes a Team or Everyday users: the Visitor reads it, and it ends at the new place's home, which takes the kind the app is for. The kind belongs to the app, and how often a person comes stays a fact of each page: a Team comes daily to a list and rarely to its setup page.

### What each kind changes

The book's rules hold for every kind as they stand. A kind changes only a setting the app already owns, or a line a pattern already carries.

| What changes | Team | Everyday users | Visitor | Learner |
| --- | --- | --- | --- | --- |
| **The layout's job** | `RAIL` for the app; `DOCK` for a person's own settings; `CANVAS` to sign in | `TOPNAV` with the few entries that fit on one line, or `DOCK` for their own account; never a `RAIL` of many sections | `TOPNAV` for a site; `CANVAS` for one landing | `TOPNAV` for a few pages; the doc's sections at the side where it has many |
| **Density** | the theme's app size; tables keep every column a person compares | one size step up; fewer facts on a line; item lines before a table where the set is small | the site's sizes by a section's role, as today | the reading measure; code at its own size |
| **The pattern, where two fit** | the one that keeps the person in place and fast: Find in a list as a table, Change in place, An entry over the page | the one that asks one thing at a time: the data table's `LIST` layout, an entry in steps, a record read before it is changed | words before a picture: Points before a Feature grid, Show it before a Real sample, except for a builder | the one that teaches: Steps, Real sample, Show it with a diagram, Questions |
| **An entry** | many fields at once, up to about 12 in a sheet; keyboard first; actions on many records; defaults filled | about 5 fields a screen and one decision; every format a person might type accepted; nothing they entered lost; undo before confirm | one ask, the fewest fields, and no account before value | a command to copy, and the line that says it worked |
| **A failure, and empty** | a failure names what went wrong and the reference support can use; empty says what to create, in the trade's words | a failure says what happened and what to do next in everyday words, never a code alone, with a way to ask for help; empty says what will appear and how to start | a form's failure keeps what was typed; media that does not load leaves its words | a step's failure names the likely error and its fix |
| **The words** | an app screen's rules, below, in the product's words, which may be the trade's | the same, with everyday words only, and a description one step shorter | the marketing page's rules, below, and its budget by level | the doc's rules: why before how, a term explained where it is first met |
| **A phone** | desktop first; on a phone a person checks, approves and reads, and those tasks finish there | phone first: every task finishes with one hand, the main action in reach at the foot, an entry a full screen or a sheet from the bottom | the first screen says what it is and for whom; words, then the picture | code scrolls sideways and never wraps; steps stand one under another |

- **A kind of person MUST change only what an app already sets, such as its density, and the lines its patterns carry** (`RD.SUPPORT.SURFACE.334`). It **MUST NOT** bring a second version of a page, or a unit of its own.
- **Every pattern MUST name the kinds it serves, and one line says how it runs differently for one** (`RD.SUPPORT.SURFACE.332`). Every pattern of every group carries it as a *For* line: `standards-patterns.md`, `site-patterns.md` and `flow-patterns.md`. A page no pattern fits is derived from the patterns whose person and data fit it, and it never waits for a pattern; `standards-patterns.md` says when a page shape earns a pattern of its own.

## An application and a site — 🔮

An application and a site are built from the same units, and one theme gives both their look. A site is a surface a person reads more than they work on, such as a marketing site. A page of a site is a run of sections: each is a `DSSectionContainer`, set apart by its fill and its room, and holds one `DSFeature` or a grid of features, `DSFeatureGridSectionContainer`. A feature's page level sets its display size, 64, 40, 22 or 18 px from `PAGE` to `GROUP`. Three rules hold on every page of a site: its words keep a length budget by level, each part takes its depth from what it holds, and anything set one under another is a `DSList`. None of this changes a unit an application uses, and a unit a site uses reads the same tokens as every other, so one theme tints a partner's site and their app together.

## The words of a page, by what it is for — 🔮

A page is read in one of three ways, and its words follow the way it is read. In **a doc** — a guide, a reference, a help article — the reader came to learn or to follow steps. On **an app's screen** — an admin, a profile, a sign-in — the person is in the middle of a task. On **a marketing page** — a product site, a landing page, the design system's public landing — the reader is deciding whether to care. This is not a kind of surface: all three can run on the web.

- The writer **MUST** decide what a page is for, from its purpose, before writing a word of it — the question § A page has one purpose asks: what did the person come here to do?
- A page **MUST** be one of the three, and never two at once. A product site's sign-in is an app's screen; a help article opened from a screen is a doc. A sign-in that argues for the product, a landing page holding a form of settings, and a guide that sells are each a finding.
- `VOICE` writes the words in all three modes, and `MARKETING` owns what a marketing page says and to whom (the spn-devex plugin's `refs/devex/agent/lenses/`).

**A doc** follows the readability bar (the spn-devex plugin's `refs/devex/workspace/docs/doc-sets.md`), holds no persuasion, and each step names the real command, the real path and what the reader will see.

**An app's screen** gets the task done and stays out of the way.

| Its words | Their rule |
| --- | --- |
| A label | short, in the product's own words, and held to the rule of a label above |
| An action | **MUST** start with a verb that says what happens, and name its object where the verb alone does not, such as *Save changes* or *Invite a member*. It is 1 to 3 words, and 4 at most, and never a sentence or a question. An arrow is the button's icon, never a character typed in its words. *OK* or *Submit* alone is a finding. The number guides the labels an agent writes; a label a person asks for in their own words is written as they asked (`RD.SUPPORT.SURFACE.335`) |
| An error | **MUST** say what went wrong and how to fix it, on the line under the field it belongs to |
| A number | is data the person acts on, never there to impress |
| What it never holds | persuasion, a slogan or a marketing claim |

**A marketing page** shows a reader who has not decided what they get, and why it matters to them.

- Name the personas first, and what each one needs to hear: a buyer the outcome and the cost of going without it, a builder that it works and how to start.
- Lead with the problem and the outcome; the how comes lower down, as the proof.
- Each section **MUST** answer one question a reader asks: what is it, why me, what do I get, or how do I start. A section that answers none is cut.
- A headline states the outcome, and the line under it gives the proof. A headline that describes the system is a finding.
- The words **MUST** be a buyer's and a builder's. A word of the system's own — a layer, a task intent, a unit, a seat, a pattern's name — **MUST NOT** stand on the page unless the same sentence explains it.
- A number **MUST** stand in one card: the number, its plain label, then what it gives the reader. Every number **MUST** be read from the real system, and a made-up number **MUST NOT** appear.
- **The words MUST fit the length of their level** (`RD.SUPPORT.SURFACE.286`, `RD.SUPPORT.SURFACE.287`), measured at 1440. The `MARKETING` lens writes to this table.

| Level | Eyebrow | Title | Description | Item title and description | Actions |
| --- | --- | --- | --- | --- | --- |
| `PAGE`, a hero | 1 to 3 words; a `TEXT` eyebrow in semibold, a state as a badge | 4 to 8 words, at most 2 lines | 15 to 30 words, at most 2 lines | not set | 1 to 3 words each; one primary and one more at most |
| `CONTAINER`, a section | 1 to 3 words, drawn as at `PAGE` | 4 to 8 words, one line | 15 to 30 words, at most 2 lines | 2 to 4 words; 10 to 20 words, at most 3 lines | 1 to 3 words; at most 2 |
| `WIDGET`, a card, or a tile in a section | not set | 2 to 5 words | 8 to 16 words, at most 2 lines | 2 to 4 words; 6 to 12 words | one, of 1 to 3 words |
| `GROUP`, rows in a card or list | not set | 1 to 4 words | at most 12 words, one line | 1 to 3 words; at most 10 words | not set |
| `CONTENT`, `INLINE`: a fact, a chip, a label, or a menu's entry | not set | 1 to 3 words | not set | not set | not set |

A feature adds facts at its level: 0 to 4 at `PAGE`, 0 to 3 at `CONTAINER` and `WIDGET`, 0 to 2 below, of 1 to 3 words each at the top. Its items follow their form: a `GRID` title of 2 to 4 words, a `LIST` title of 1 to 3 words as the step's name, `STATS` a value of 6 characters at most and a label of 2 to 5 words that says what it counts. The buttons and the count of items are in `architecture-components.md`.

- **Siblings MUST match.** The items of one group share one grammatical form, and no description runs more than about a third longer than its shortest sibling's.
- **One idea MUST stand in each element.** A title carries one claim, the description its reason, the items the evidence and the action the next step. A second clause in a title belongs in the description.

## Motion — ✅

One set of tokens moves every surface. A place has its own clamped duration (`clamp(min, base x --motion-speed, max)`) for the hover, the icon's emphasis, the tooltip, the menu, the collapse, the toast, the dialog, the sheet and the rail, and for the reveal of a unit that moves into place as it first scrolls into view. Three eases are shared: `enter` (ease-out) for what arrives, `exit` (ease-in) for what leaves, `move` (ease-in-out) for what changes size or place. `--motion-speed` is the multiplier a theme sets as `motionSpeed` (`DEFAULT` x 1, `FAST` x 0.75, `SLOW` x 1.25), and `--motion-amount` is how far things move.

| Kind | Enters | Leaves |
| --- | --- | --- |
| Dialog | fades, grows from 96 % | the same, reversed, in two thirds of the time |
| Sheet and phone drawer | slides its whole width from its edge | slides back, in two thirds of the time |
| Menu, popover, select, hover card, context menu | fades, moves 4 px out from its trigger | the same, reversed, in two thirds of the time |
| Tooltip | fades in after a short wait | fades, in the time it entered |
| Toast | slides in from its corner | fades where it stands, in the time it entered |
| Accordion, collapsible | grows to its content's height | shrinks, in the time it entered |
| Rail | grows to its open width, labels fade in after | labels fade, then it shrinks, in the time it entered |
| A revealed unit | the first time it scrolls into view: words first, then media, then items (a grid row by row, a list top down, stats left to right), each fading, rising, sliding or zooming in, 60 ms apart | none; it plays once and stays |

- Every unit that moves MUST take its duration and ease from the tokens, and each kind MUST enter and leave by its role.
- An icon MUST move only because what holds it is hovered, pressed or open (`architecture-components.md` states the motions).
- Under `prefers-reduced-motion` nothing MUST move and every fade MUST take the hover duration, set in one place. A size change in place keeps its place's min duration with no overshoot.
- A reveal MUST play once, in the order words, media, items, and MUST leave the words shown without a script (`RD.SUPPORT.SURFACE.282`). One observer drives every reveal; rise, slide and zoom move by `--motion-amount`, so reduced motion stops them. The theme holds no reveal.
- The loader is not motion; it owns its turning.

## What every surface owes a person — ✅

Four things, on every kind of surface, by every page, whatever the page is for.

| A surface owes | What it means |
| --- | --- |
| Keyboard use | every block works by keyboard alone: moving to it, activating it and leaving it |
| A focus a person can see | the block that takes the next key shows it. Focus is carried across an interruption and across a change of page |
| Meaning for a screen reader | each block carries the platform's accessibility attributes, so assistive technology announces what a sighted person sees |
| Contrast | every pair of color tokens meets the contrast baseline, WCAG 2.1 AA, in light and in dark |

A page built from the design system's components inherits all four. A page that builds a control of its own owes all four on its own — the argument for not building one.

## What a surface is judged by — 🔮

A review asks the same questions of any page, each answered from one part of this domain.

| The question | Answered from |
| --- | --- |
| Does the page have one purpose, and one main action? | this ref |
| Does each label, state, count, field and line of a list follow its rule of content? | this ref |
| Do its words fit what the page is for: a doc, an app's screen or a marketing page? | this ref |
| Does each intent use its pattern, built from blocks of the design system? | `standards-interaction.md`, `standards-patterns.md` |
| Does every block drawn from data show every task state? | `standards-interaction.md` |
| Does every action answer the person: working, done or failed? | `standards-interaction.md` |
| Does a hue, a surface treatment or a word mean the same thing as on every other page? | `architecture-names.md` |
| Does it work by keyboard, show its focus, and keep its contrast? | this ref |
| Does it hold on each kind of surface, at each density, theme and language? | this ref |

A question that cannot be answered from a part is a matter of taste, and it is not a finding.

## The web's own standards — 🔮

A device type is two closed sets, stated in full in the web's chapter (`docs/04-capabilities/02-support/01-surface/01-standards-core/02-web/01-standards.md`): screen class (`MOBILE` · `TABLET` · `DESKTOP`) and orientation (`PORTRAIT` · `LANDSCAPE`). A page holds at each screen class and each orientation; a block decides its layout from the device type, read from the context it is drawn in, and never measures a width of its own. There is one exception: a unit that can stand in a narrow place inside a wide window **MAY** arrange itself by the width of its place (`RD.SUPPORT.SURFACE.133`). The device type says how wide the window is, and it cannot say how wide a column of that window is. Such a unit reads the width of its own place, and never the width of the window. `DSPagination` and the footer of `DSDataTable` are such units. On the web, a pattern states the keys that carry it and what the pointer does, and whatever the pointer can do the keyboard must be able to do too. Hover is a shown state of the web alone, never a prop, and never the only way to reach something a person needs. A prop **MAY** state whether a block answers to the pointer at all, and **never** that a pointer is over it: `hoverable` on `DSTable` is such a prop, and the row's hover fill stays a shown state that the caller cannot claim.

## Boundary

This ref states what a surface is built in, what one page is for, and what a page has to hold through, before any block is named. It stops where a block, a pattern or a name begins — those are `standards-interaction.md`, `standards-patterns.md`, `architecture-names.md` and the refs after it. Where a `ui/` folder sits, and what a support package may share, are the stack's, and its build steps state them.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.SURFACE.050` | no app pattern depends on a count |
| `RD.SUPPORT.SURFACE.056` | when a value takes a label. The rule is proposed |
| `RD.SUPPORT.SURFACE.057` | when a part of a page takes a frame of its own. The rule is proposed |
| `RD.SUPPORT.SURFACE.058` | a state and a kind are badges on the line of facts, and the normal state shows none |
| `RD.SUPPORT.SURFACE.059` | what stands at the end of a line is data, a badge, a count, a status or the arrow, never an action, and when a line shows its arrow |
| `RD.SUPPORT.SURFACE.133` | a unit in a narrow place of a wide window may arrange itself by the width of its place. It is a MAY |
| `RD.SUPPORT.SURFACE.087` | the arrow of a line that leads somewhere may stand after its actions. It is a MAY |
| `RD.SUPPORT.SURFACE.060` | a field a person enters has its title above its control, with one line under it |
| `RD.SUPPORT.SURFACE.061` | a field a person reads has its title above its value, and readings stand in a grid |
| `RD.SUPPORT.SURFACE.062` | the choices of one set stand in columns |
| `RD.SUPPORT.SURFACE.063` | a line stands between each two lines of a list |
| `RD.SUPPORT.SURFACE.330` | an app names the kind of person it is for before any pattern is chosen, read from its personas and rows, asked where they do not say, and never read from the tier |
| `RD.SUPPORT.SURFACE.331` | the kinds of person are one closed set, Team, Everyday users, Visitor and Learner, each named by how a person uses a product |
| `RD.SUPPORT.SURFACE.333` | the kind decides between two patterns that fit, a page another kind reaches takes that kind, and the less forgiving decides where two meet |
| `RD.SUPPORT.SURFACE.334` | a kind changes only what an app already sets and the lines its patterns carry, and never brings a second version of a page or a unit |
| `RD.SUPPORT.SURFACE.208` | the words of a page follow what it is for, a doc, an app's screen or a marketing page, decided before a word is written |
| `RD.SUPPORT.SURFACE.335` | an app's action label is a verb and its object, 1 to 3 words and 4 at most, never a sentence or a question, with an arrow drawn as its icon |
| `RD.SUPPORT.SURFACE.282` | a reveal plays once, words first, and leaves the words shown without a script |
| `RD.SUPPORT.SURFACE.286` | the words of a marketing page fit a length budget by level |
| `RD.SUPPORT.SURFACE.287` | a feature's words, buttons and items follow its level and its form |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
