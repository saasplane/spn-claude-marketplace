<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/01-standards-core.md",
      "seen": "7a55e6dd"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/01-standards-core/",
      "seen": "5fdeecbf"
    }
  ]
}
-->

# Standards — What Every Page Is Held To

Source of truth: the foundation's Standards construct (`docs/02-constructs/02-support/03-surface/01-standards-core.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/01-standards-core/`). Standards is the first of thirteen Surface constructs, in three groups: Standards, Architecture and Delivery.

Read this before you design a page, before you review one, or before you add a second kind of surface. It states what a surface is built in and what one page is for, before any block is named. `standards-interaction.md`, `standards-patterns.md` and the ten `architecture-*` and `delivery-*` refs in this folder carry the rest of the domain; this one is the first.

## Terms

| Term | What it means |
| --- | --- |
| Kind of surface | where a surface runs and how a person reaches it: web today, native later |
| Page | one route of an app, with one purpose |
| Block | any unit a surface is built from: a layout, a container, a widget or a component |
| Level | one step of the chain from the app to a component, with what that step owns |
| Device type | the screen class and the orientation a page is drawn at |
| Line of facts | the one line under a title that holds the short facts of a thing, such as its state, its kind and its code |

## The kinds of surface — ✅

A kind of surface says where a surface runs and how a person reaches it: **web**, with a pointer and a keyboard, in a browser window, realized today; **native**, with touch, on a phone or a tablet, realized later. A rule is shared only when it holds on every kind of surface — hover is the first example, because it needs a pointer, so it is the web's own shown state and never a shared one. The capability chapters divide the same way: one folder holds what every kind of surface follows, and one folder holds what a single kind needs.

## The levels — 🔮

A surface is built in levels, and each level owns one thing. Read a surface from the top level down.

```text
app  →  page  →  layout  →  container  →  widget or component
        one route   main area   optional
```

| Level | What it is | What it owns |
| --- | --- | --- |
| App | a set of routes | which pages exist |
| Page | one route, with one purpose | which layout it uses, and everything it puts in the main area |
| Layout | the frame of a page | the navigation, and the main area it hands to the page. Nothing inside the main area |
| Container, optional | a framed part of a page, as a header, content and a footer | its frame, and the order of its parts |
| Widget | a block built for one purpose, from components | its own working |
| Component | the smallest block | one control, or one way to show something |

- Let a level own what the table gives it, and never decide what another level owns. The container is optional — a page may put a widget or a component straight into the main area, or fill the whole area with one block.
- A token is not a level: a token is a value a block is drawn with, and it is not a block.

## A page has one purpose — 🔮

A page has one purpose: one main intent, and one main action. A page with two purposes is two pages. A review finds it with one question: what did the person come here to do? If the answer needs the word *and*, the page is doing two jobs, competing for the same space.

## The rules of content — 🔮

A page is made of small things that come back on every page: a label, a state, a count, a field, a line of a list. Each has one rule here. A person who has read one page can then read the next, because the same thing stands in the same place on both.

None of these rules names a block, so each holds on every kind of surface. The blocks that carry them are named where they belong. The item line, the badge and the two blocks of a field are in `architecture-components.md`. The data table is in `architecture-widgets.md`. A form and its footer are in `architecture-containers.md`.

The first five rules say what a page shows, and where.

| The content | Its rule | A reviewer checks |
| --- | --- | --- |
| A label | A value **MUST** take a label only where a person cannot tell what the value is without one (`RD.SUPPORT.SURFACE.056`). A name, a picture, a state and an email need none. An address, an owner, a date and a limit each keep their label. This rule is proposed | cover the label and look at the value alone. If you can still tell what the value is, the label is a finding |
| A frame | A part of a page **MUST** take a frame of its own only when it has a title of its own, and also an action of its own or data it loads by itself (`RD.SUPPORT.SURFACE.057`). The record a page is about is the header of the page, and it **MUST NOT** take a frame. This rule is proposed | for each framed part, find its title, and then its own action or its own loading. A frame with no title, or with neither of the other two, is a finding |
| A state | A state **MUST** be shown as a badge (`RD.SUPPORT.SURFACE.058`). It stands on the line of facts under the title, before the other facts, or at the end of the line, and the page chooses by the room the screen gives. It **MUST NOT** stand after the title. The normal state **MUST** show no badge: an active person shows none, and an inactive one shows *Inactive* | find each badge. One that stands after a title is a finding, and so is a badge for the normal state |
| The end of a line | What stands at the end of a line is data: a badge, a count, a status, or the arrow (`RD.SUPPORT.SURFACE.059`, `RD.SUPPORT.SURFACE.178`). A line **MUST NOT** hold an action at its end: the actions of a line stand in the header, the row or the table that holds it. A line that leads to a page **MUST** show the arrow where its row holds no action. A row that has an action **MUST** give it at the end of the row, and it shows no arrow (`RD.SUPPORT.SURFACE.087`). The arrow is off unless the page asks for it | read the end of each line. A line that leads to a page and shows neither an action nor the arrow is a finding, and so is an arrow on a line that leads nowhere |
| A count | A page pattern **MUST NOT** depend on a count (`RD.SUPPORT.SURFACE.050`). A group **MUST** show how many items it has only where the server gives that number together with the groups | read the page as if no count had come. A part that is then empty or wrong is a finding |

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

## An application and a site — 🔮

An application and a site are built from the same blocks, and one theme gives both their look. A site is a surface a person reads more than they work on, such as a marketing site. It needs three additions the standard names and states no rule for yet: larger type steps, a full-width section, and site widgets (such as the opening block and a footer in columns). They add to the design system and read the same tokens, so one theme tints a partner's site and their app together.

## Motion — ✅

One set of tokens moves every surface. A place has its own clamped duration (`clamp(min, base x --motion-speed, max)`) for the hover, the icon's emphasis, the tooltip, the menu, the collapse, the toast, the dialog, the sheet and the rail. Three eases are shared: `enter` (ease-out) for what arrives, `exit` (ease-in) for what leaves, `move` (ease-in-out) for what changes size or place. `--motion-speed` is the multiplier a theme sets as `motionSpeed` (`DEFAULT` x 1, `FAST` x 0.75, `SLOW` x 1.25), and `--motion-amount` is how far things move.

| Kind | Enters | Leaves |
| --- | --- | --- |
| Dialog | fades, grows from 96 % | the same, reversed, in two thirds of the time |
| Sheet and phone drawer | slides its whole width from its edge | slides back, in two thirds of the time |
| Menu, popover, select, hover card, context menu | fades, moves 4 px out from its trigger | the same, reversed, in two thirds of the time |
| Tooltip | fades in after a short wait | fades, in the time it entered |
| Toast | slides in from its corner | fades where it stands, in the time it entered |
| Accordion, collapsible | grows to its content's height | shrinks, in the time it entered |
| Rail | grows to its open width, labels fade in after | labels fade, then it shrinks, in the time it entered |

- Every unit that moves MUST take its duration and ease from the tokens, and each kind MUST enter and leave by its role.
- An icon MUST move only because what holds it is hovered, pressed or open (`architecture-components.md` states the motions).
- Under `prefers-reduced-motion` nothing MUST move and every fade MUST take the hover duration, set in one place. A size change in place keeps its place's min duration with no overshoot.
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
| Does each intent use its pattern, built from blocks of the design system? | `standards-interaction.md`, `standards-patterns.md` |
| Does every block drawn from data show every task state? | `standards-interaction.md` |
| Does every action answer the person: working, done or failed? | `standards-interaction.md` |
| Does a hue, a surface treatment or a word mean the same thing as on every other page? | `architecture-names.md` |
| Does it work by keyboard, show its focus, and keep its contrast? | this ref |
| Does it hold on each kind of surface, at each density, theme and language? | this ref |

A question that cannot be answered from a part is a matter of taste, and it is not a finding.

## The web's own standards — 🔮

A device type is two closed sets, stated in full in the web's chapter (`docs/04-capabilities/02-support/03-surface/01-standards-core/02-web/01-standards.md`): screen class (`MOBILE` · `TABLET` · `DESKTOP`) and orientation (`PORTRAIT` · `LANDSCAPE`). A page holds at each screen class and each orientation; a block decides its layout from the device type, read from the context it is drawn in, and never measures a width of its own. There is one exception: a unit that can stand in a narrow place inside a wide window **MAY** arrange itself by the width of its place (`RD.SUPPORT.SURFACE.133`). The device type says how wide the window is, and it cannot say how wide a column of that window is. Such a unit reads the width of its own place, and never the width of the window. `DSPagination` and the footer of `DSDataTableWidget` are such units. On the web, a pattern states the keys that carry it and what the pointer does, and whatever the pointer can do the keyboard must be able to do too. Hover is a shown state of the web alone, never a prop, and never the only way to reach something a person needs. A prop **MAY** state whether a block answers to the pointer at all, and **never** that a pointer is over it: `hoverable` on `DSTable` is such a prop, and the row's hover fill stays a shown state that the caller cannot claim.

## Boundary

This ref states what a surface is built in, what one page is for, and what a page has to hold through, before any block is named. It stops where a block, a pattern or a name begins — those are `standards-interaction.md`, `standards-patterns.md`, `architecture-names.md` and the refs after it. Reach for `../apps/support.md` when the question is where a `ui/` folder sits or what a support package may share.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.SURFACE.050` | no page pattern depends on a count |
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

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
