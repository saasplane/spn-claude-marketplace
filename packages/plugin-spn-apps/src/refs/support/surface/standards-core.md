<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/01-standards-core.md",
      "seen": "2a9385ae"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/01-standards-core/",
      "seen": "a8e19828"
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

An application and a site are built from the same blocks, and one theme gives both their look. A site is a surface a person reads more than they work on, such as a marketing site. It needs four additions the standard names and states no rule for yet: larger type steps, a full-width section, motion tokens, and site widgets (such as the opening block and a footer in columns). They add to the design system and read the same tokens, so one theme tints a partner's site and their app together.

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
| Does each intent use its pattern, built from blocks of the design system? | `standards-interaction.md`, `standards-patterns.md` |
| Does every block drawn from data show every task state? | `standards-interaction.md` |
| Does every action answer the person: working, done or failed? | `standards-interaction.md` |
| Does a hue, a surface treatment or a word mean the same thing as on every other page? | `architecture-names.md` |
| Does it work by keyboard, show its focus, and keep its contrast? | this ref |
| Does it hold on each kind of surface, at each density, theme and language? | this ref |

A question that cannot be answered from a part is a matter of taste, and it is not a finding.

## The web's own standards — 🔮

A device type is two closed sets, stated in full in the web's chapter (`docs/04-capabilities/02-support/03-surface/01-standards-core/02-web/01-standards.md`): screen class (`MOBILE` · `TABLET` · `DESKTOP`) and orientation (`PORTRAIT` · `LANDSCAPE`). A page holds at each screen class and each orientation; a block decides its layout from the device type, read from the context it is drawn in, and never measures a width of its own. On the web, a pattern states the keys that carry it and what the pointer does, and whatever the pointer can do the keyboard must be able to do too. Hover is a shown state of the web alone, never a prop, and never the only way to reach something a person needs. A prop **MAY** state whether a block answers to the pointer at all, and **never** that a pointer is over it: `hoverable` on `DSTable` is such a prop, and the row's hover fill stays a shown state that the caller cannot claim.

## Boundary

This ref states what a surface is built in, what one page is for, and what a page has to hold through, before any block is named. It stops where a block, a pattern or a name begins — those are `standards-interaction.md`, `standards-patterns.md`, `architecture-names.md` and the refs after it. Reach for `../apps/support.md` when the question is where a `ui/` folder sits or what a support package may share.

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
