<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/11-delivery-library.md",
      "seen": "6800197a"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/11-delivery-library/",
      "seen": "3cc9bc9f"
    }
  ]
}
-->

# Delivery Library — Where the Look Is Drawn

Source of truth: the foundation's Delivery Library construct (`docs/02-constructs/02-support/03-surface/11-delivery-library.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/11-delivery-library/`). Delivery Library is the eleventh of thirteen Surface constructs, and the first of the Delivery group — where the library is drawn and what every stack shows as proof.

Read this before you add a token or a block to the library, or before you ask whether a look may live only in one stack's code.

## Terms

| Term | What it means |
| --- | --- |
| Design library | the Figma files that draw each named block and token |

## The files, by layer — 🔮

The design library holds one file for each layer of the design system that is drawn, and one for drafts. Five of the six layers are drawn: Core, Components, Widgets, Containers and Layouts. The sixth layer, App, has no file of its own: the choices of the theme are variables, so Core holds them, and the rest of the app's contract stays in words.

| File | Holds | May use |
| --- | --- | --- |
| Core | the variables, the text styles, the scale and the icons | nothing |
| Components | one page for each group of components | Core |
| Widgets | one page for each widget | Components and Core |
| Containers | the container, with its parts and its look | Components and Core |
| Layouts | the layout, in each of its types | every file before it |
| Lab | drafts of large changes | any published file |

A file can use only what another file has published. SaaS Plane's own library is six files in Figma, in the **Design System** folder of the SaaS Plane team, and a link opens only for a person with a seat on that team:

| File | Its pages |
| --- | --- |
| DS 1-core | Colour · Type · Scale · Icons |
| DS 2-Components | one page for each group, then Choices |
| DS 3-Widgets | Filter bar · Data table |
| DS 4-Containers | Container |
| DS 5-Layouts | Layout |
| DS 9-Lab | drafts, never published |

Core holds the variables in collections, and each is one setting of the book: `Roles` (Light, Dark), `Hue` (the values of `color`), `Scale`, `Theme-Font`, `Theme-Radius`, the four `Theme-*` collections of the container look (`Theme-Raised` also holds `page/fill`), and `Frame` (the frame setting of `flush`). A private part's name starts with a dot; a description is one line and a link; a file that changes is published by a person.

## Color is a mode, and the rest are properties — 🔮

In the design library, `color` is a variable mode. `variant`, `size` and the state are properties. `color` stays a prop on every stack, and a design read back turns the mode into the prop.

## What stays in words — 🔮

The library holds the pictures, the properties and the variables. The book states what has no picture: keyboard use and where focus goes; the overlay seam, and translation; a data shape as a whole; the permission gate. A description in the library carries one line and a link to the chapter that states the behavior.

## A value held worked out — 🔮

The primary ramp comes from one seed by a formula, and the radius of each size step comes from one base value. A variable of the library holds a value or a pointer to another variable, so the library holds the worked-out values, and the rule that produces them stays in words.

## Drawing a block

- A block drawn from data is a host and an item. One item serves every host that takes one data shape (`architecture-components.md`).
- Each shared state has one picture, on every block and on every kind of surface (`architecture-names.md`).
- An overlay is drawn as its surface alone, placed over a `DSBackdrop`, and its extent is the size of the instance. It draws no width of its own.
- A popup or an overlay that a block opens is a private part of that block, shown by the switch `open`. It is never a block a designer places on a page of its own.
- A value that only changes which published block sits in a slot is no variant. The slot holds the block.

## Boundary

This ref states what the library draws, how its files are layered, and what stays in words because no picture can hold it. It does not state which blocks or tokens exist — that is `architecture-components.md` and `architecture-core.md`. It does not state how a stack builds what the library draws, or what proves it did — that is `providers.md` and `delivery-showcase.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.141` | the design library draws the look of each named block, and behavior stays in words |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
