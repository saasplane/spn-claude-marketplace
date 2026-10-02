<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-apps/11-surface.md",
      "seen": "c465fc58"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/11-surface/",
      "seen": "c3a02c88"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/08-web.md",
      "section": "Generated primitives are never hand-edited",
      "seen": "87b2001b"
    }
  ]
}
-->

# Surface — what a page is built from, and what it is judged by

Source of truth: the foundation's Surface construct (`docs/02-constructs/02-support/01-apps/11-surface.md`) and its capability chapters (`docs/04-capabilities/02-support/01-apps/11-surface/`). The last section restates one rule of the TypeScript chapter, `docs/04-capabilities/02-support/01-apps/10-providers/ts/08-web.md`.

Read this before you design a page, review one, or change a block of the design system. A surface is what a person sees and touches in an app: its pages, how a task runs on them, and the blocks they are built from. It has three parts. Standards says what every surface owes a person. Interaction says how a task runs. Design System names the blocks that deliver both.

## Read the status marks first

Each section below carries the status of its book chapter. The marks tell a rule that is stated from a block that is built.

| Mark | Means | Sections that carry it |
| --- | --- | --- |
| ✅ | implemented: the book states it as done | accessibility · the contexts and the seams · what only a browser needs |
| 🔮 | planned: the book states the standard, and it is not a record of what runs today | the levels · interaction · the names · the container · the layout · the theme · the order of a setting · the design library |

Read a 🔮 section as design. No check reads a page against the levels or the interaction rules yet. No stack builds the container yet, or the context that carries a frame. A theme holds the brand color and light or dark today.

## Terms

| Term | What it means |
| --- | --- |
| Surface | what a person sees and touches in an app: its pages, and the blocks they are built from |
| Kind of surface | where a surface runs and how a person reaches it: web today, native later |
| Page | one route of an app, with one purpose |
| Block | any unit a surface is built from: a layout, a container, a widget or a component |
| Level | one step of the chain from the app to a component, with what that step owns |
| Task state | where a task stands: idle, working, done, failed, empty or denied |
| Token | a named value a block is drawn with. A token is not a block |
| Role token | a token named for its job, such as the raised surface. It changes with light and dark |
| Vocabulary | a closed set of values a prop may take |
| Frame | the drawn edge and fill of a container |
| Declared prop | a property the caller sets, under the same name on every stack |
| Shown state | a state the platform produces itself, such as hover or focus. It has a picture and no prop |
| Design library | the Figma files that draw each named block and token |

## Standards

### The levels — 🔮

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

- Let a level own what the table gives it, and never decide what another level owns.
- Give a page one purpose: one main intent, and one main action. A page with two purposes is two pages.
- Treat the container as optional. A page may put a widget or a component straight into the main area.
- Never write a second version of a page for a density, a theme, a device type or a language. A block reads each of them from the context it is drawn in.
- Put a rule in the shared chapters only when it holds on every kind of surface. A rule that names hover, a window or a browser belongs to the web.

### Accessibility — ✅

- Make every component work by keyboard alone: moving to it, activating it and leaving it. Manage focus across overlays and route changes.
- Give every interactive element correct semantics and the platform's accessibility attributes, ARIA on the web.
- Keep every pair of color tokens at the contrast baseline, WCAG 2.1 AA, in light and in dark.
- A page built from the design system's components inherits the baseline. A page that builds a control of its own owes all of it on its own.

## Interaction — 🔮

- Run each task by the pattern of its intent, built from blocks of the design system. Never invent a second way to run a task the book already holds a pattern for.
- Show every task state on a block drawn from data: idle, working, done, failed, empty and denied. Give each one a picture of its own.
- Make every action answer the person: working as soon as it starts, and then done or failed. Silence is never an answer.
- Say what went wrong in a failed state, and give the way back to where the person was.
- Draw feedback with blocks of the design system. A page never draws a loading picture or a failure picture of its own.
- Raise an interruption through the overlay seam. It says why it interrupts, it answers, and it returns the person to the place they left.
- Treat a denied state as presentation only. The refusal itself is the server's.
- Never make anything a person needs reachable by hover only.

## Design System

### The contexts and the seams — ✅

Exactly two contexts cross between an app and its design system, one direction each. The application supplies session, permissions, locale facts, the translate implementation and the unauthenticated policy. The design system supplies theme, device, navigation, media resolution and density.

- **Service calls**: run every call of a screen through the service executor. It never throws: it resolves to what the call returns, or to nothing when the call fails. An unauthenticated failure goes to the app's policy alone. Before the app is mounted there is no policy, so that failure goes to the caller's own handler. Any other failure is shown once, by the screen's handler or by a toast.
- **Theming**: derive the brand from a single seed. Treat light and dark as a mode flip on the role layer. Read the roles and the scale from a component, never a ramp step and never a raw value. Let the design-system root own theme state, with the setter reachable from any depth.
- **Formatting**: ship one formatting capability per preference vocabulary. Never format by hand in a component or a module. Resolve an absent optional preference to the vocabulary's declared default, never to the device's locale.
- **Translation**: pass every user-facing string through the design system's translate capability, with a key, a source message and named variables. The application supplies the implementation.
- **Navigation**: declare a `navigate` seam in the design system, and bind the application's router to it once. Never import a router, read a route or touch history from a design-system component.
- **Media**: resolve variant, size and density into an address. Require a placeholder and an error image. Never assemble a URL by hand in a screen.
- **Overlays**: request dialogs, confirmations and sheets through one imperative seam. Never mount them from the component that needs them.
- **Gated rendering**: treat it as presentation only. Hiding a control is courtesy, and the refusal is the server's.

A conforming design system answers a fixed set of groups: actions, data entry, data display, navigation, layout, overlays and popovers, feedback, media, typography and utility, and widgets. Compose these blocks, and never restyle a copy of one. Propose a missing control to the design system, and never build it inside a page.

The set sits in five layers, on every stack: core, components, widgets, containers and layouts. A layer uses only the layers named before it. How far a stack has built the scale is the stack's to say. For TypeScript, read `providers/ts/08-web.md` in this same plugin.

### A name is the contract — 🔮

One name is used in the book, in the design library and in every stack. The book names every block, prop, closed value and token. The design library draws each one under that name, and a stack builds it under that name. No file maps a design name to a code name. A stack may add the form its language asks for, and never a second name.

| Name | Means | Values | Vocabulary |
| --- | --- | --- | --- |
| `variant` | the surface treatment | `SOLID` · `SOFT` · `OUTLINE` · `GHOST` · `LINK` | `DSVariantType` |
| `color` | the hue | `DEFAULT` · `PRIMARY` · `INFO` · `SUCCESS` · `WARNING` · `ERROR` | `DSColorType` |
| `size` | the density step | `XS` · `SM` · `MD` · `LG` · `XL` | `DSSizeType` |

- Keep each of the three names for its one meaning, on every block. A block takes `variant` and `color` independently.
- Give a prop that means something else another name. A shape, a type step or a kind of alert is not a surface treatment.
- Name a prop and its vocabulary with one word: the vocabulary `DS<Component><Word>Type` is taken through the prop `<word>`.
- Take every value from the vocabulary of its prop, never a free string.
- Use `bordered` for a border a block draws around itself, and `rounded` for the corners of its frame. Only the container and the card take `raised`.
- An unset `bordered` reads the frame setting of a `flush` part above it, and only on a block that frames a part of a page. Those blocks are the table, the data table, the list, the code block, the accordions and the empty state. A field, a menubar and an avatar read their own default, because their border is the control's own chrome.
- Use `flush` on a part of a container for a part that draws no inset. It is yes or no, and no when it is not set.
- Mark each property of the design library as a declared prop, a shown state, or a setting taken from the block above. A design read back to code never gains a prop that no platform has.
- Name a hook of the design system by its context: `useDS`, then the context, then the value. Each context has one hook that returns it whole. The size and the frame setting each have a hook of one value, which takes the block's own prop. The rule binds a hook whose value comes from one context: a hook that reads several, or none, is named for what it does.

The names chapter of the book lists each prop that takes another name, with its values. The web design system uses `variant` for several vocabularies today.

### The container — 🔮

A container is an optional block. A page uses one when a part of it has a header, content and a footer as one unit.

| Part | Named | How many | What it takes |
| --- | --- | --- | --- |
| Header | `DSContainer.Header` | none or one | `flush`, and no other prop |
| Content | `DSContainer.Content` | one or more | `flush`, and no other prop. Several join in one frame |
| Footer | `DSContainer.Footer` | none or one | `flush`, and no other prop |

The parts sit in one order: the header, then the content, then the footer. The header places its first block at the start and its last at the end. The footer starts its blocks at the start edge. A part holds anything: a `div`, a text, a block or a page's own component. The look of a container is four props, and nothing else.

| Prop | Values | What it decides |
| --- | --- | --- |
| `frames` | a list: any of `HEADER`, `CONTENT`, `FOOTER` | which parts the frame holds. A part that is not listed sits flat on the page |
| `raised` | yes or no | whether the frame is filled with the raised surface and lifted |
| `bordered` | yes or no | whether the frame has a border. Inside a bordered frame, a line divides the parts |
| `rounded` | yes or no | whether the corners of the frame are rounded |

A container also takes `size`, which sets the density of every block inside it.

A part insets its content, and the page decides what fills a part.

| The part | Its inset |
| --- | --- |
| In the frame, with nothing written | the padding of the container's size step, once around everything in it |
| In the frame, with `flush` | none |
| Not in the frame: the container is flat, or `frames` does not list the part | none, so `flush` changes nothing |

- Write `flush` on a part whose content reaches the edge of the frame, such as a table.
- Let `flush` describe the content, and never the look. A theme can change the frame from flat to bordered to raised, and no page changes.
- Write the gap between two blocks in a part on the page, from the scale. A part sets no gap, and the design system has no block for a row or a grid.
- Expect no line between two blocks that sit side by side in a `flush` part.

| Space | Owner |
| --- | --- |
| The frame | the container |
| The inset of a part | the part |
| The gap between two blocks in a part | the page |
| A block's border | the block |
| The gap between two containers | the page |

A container takes no background color, no padding value, no margin, no container inside it, and no prop named `variant`. It takes no child that is not one of its parts. The card, `DSCard`, stays a separate block beside it. A container frames a part of a page, and a card frames one thing. A card takes `raised`, `bordered` and `rounded`.

### The layout — 🔮

A layout owns the navigation and the main area of a page, and nothing inside that area. A page chooses its layout, and no rule restricts where the page places a block in the main area. The gap between two blocks comes from the scale. The layout types are `RAIL`, `DOCK` and `TOPNAV`, and every type places the same named places. A layout names no routing library.

### The theme — 🔮

A theme is one declared object, and it holds a closed list of six choices.

| Choice | What it sets |
| --- | --- |
| Brand color | the seed the primary ramp is worked out from |
| Light or dark | which ramp step each role token points at |
| Default size | the size step a block takes when none is set on it |
| Font family | the typeface of every text |
| Corner radius | one base value. The radius of every size step is worked out from it |
| Container look | the four props of the container, as the default for every container and every card |

A partner changes the look of an app through one theme, and in no other way. A partner writes one theme, and never a style for a block. The layout type is not a choice of the theme.

### Prop, nearest block, app — 🔮

A block takes some settings from where it sits. One order serves every such setting.

```text
a prop set on the block itself
   ↓  if none
the nearest block above it that sets the value
   ↓  if none
the app's own setting
```

| Setting | Who sets it for the blocks inside | How far it travels |
| --- | --- | --- |
| Color | a block with a surface treatment | to its own text and icons |
| Size | whoever composes a region: the app, a container, a widget or a composite, or the page | all the way down, until a block that passes its size on sets another |
| Frame | a part of a container that has `flush` | to the block that uses it, and never into a card or an overlay |

Size flows down from whoever composes a region. Only the blocks of this table pass their size on.

| Passes its size on | To |
| --- | --- |
| `DSApp`, from the theme | every block of the app |
| `DSContainer` | every block inside it |
| A widget or a composite | its own parts: a data table to its table and its pager, a form to its fields, a button group to its buttons, a filter bar to its controls |
| `DSScope` with a `size`, written by the page | everything in that region of the page |

No other block passes its size on. A card, a dialog, a drawer, a sheet and an alert do not. Tabs, a tooltip, a menu, a popover and a collapsible do not either. The size above still reaches the blocks inside such a block.

A frame is drawn once on any part of a page. The page follows that rule, and no code enforces it. A block never changes because of where it sits. It reacts to one thing only: sitting in a `flush` part.

| A block in a `flush` part | What it does |
| --- | --- |
| `DSTable` · `DSWDataTable` · `DSList` · `DSCodeBlockView` · `DSAccordion` · `DSAccordionGroup` · `DSEmpty` | it draws no border and no rounding of its own. Its own `bordered` still wins |
| Any other block: an image, a form, a text, a page's own component | nothing. It reaches the edge |
| A block inside the one that reacted | nothing. The setting stops at the block that used it |
| A block inside a card, or inside an overlay | nothing. A block that draws a frame of its own starts a new one |

- In a part that is not `flush`, expect every block to look as it does on a plain page. No block drops its border by itself.
- A block with `bordered` in a `flush` part keeps its border, because its own prop wins. The page then shows two lines, and the `UX` lens reports it as a finding.
- The frame setting reaches through a block that only holds content. So a table inside a page's own component, in a `flush` part, draws no border.

### The design library — 🔮

The design library follows the book, and it declares no name. It holds one Figma file for each layer and one for drafts. `color` is a variable mode there, and it stays a prop on every stack. The look of a container and of a card is a mode of the theme's collections there, and it stays props on every stack. Behavior stays in words, in the book. No file of the library is published yet.

### What only a browser needs — ✅

- Reference a package's served assets, such as fonts, by a URL relative to the stylesheet that needs them. The app that imports the styles makes those files reachable.
- Import only the asset entries a package declares, never a build-output path or a source path inside it.
- Treat a stored theme as a cache. The prepared value wins on load.
- Render a link as a real anchor, and route through the navigation seam when it is activated normally.
- Write the app's own media as root-relative paths on the app's own origin. No asset origin is configured.

## What a stack adds

How a block is built belongs to the stack. For TypeScript, read `providers/ts/08-web.md` in this same plugin. One rule of it applies every time a block changes: **no file under `_shadcn/` is edited by hand.** The shadcn CLI emits or copies every file there, the hooks and helpers included. Make the change in the block's `DS*` wrapper.

## Boundary

Use this ref for what a page owes a person, how a task runs, and what the blocks are named and look like. Reach for the `support.md` ref in this plugin when the question is where a `ui/` folder sits or what a support package may share. Reach for `tests.md` when the question is what a person can do and what proves it. This ref does not state who reaches an app: that Surface belongs to the platform area.

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
