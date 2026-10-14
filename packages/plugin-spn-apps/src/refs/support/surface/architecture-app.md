<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/10-architecture-app.md",
      "seen": "3321d2dc"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/10-architecture-app/",
      "seen": "b723a7a3"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/08-web.md",
      "section": "Generated primitives are never hand-edited",
      "seen": "87b2001b"
    }
  ]
}
-->

# App — What Every Surface Is Configured With

Source of truth: the foundation's App construct (`docs/02-constructs/02-support/03-surface/10-architecture-app.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/10-architecture-app/`). App is the tenth of thirteen Surface constructs, and the last of the Architecture group.

Read this before you mount a surface, write a theme, or ask what a block already knows without being told. `DSApp` mounts once and hands every block below it the person's grants, their preferences, the look and the device, and the seams a block never owns itself.

## Terms

| Term | What it means |
| --- | --- |
| Theme | `IDSTheme` — the closed list of choices that gives an app its look |

## The contexts and the seams — ✅

Exactly two contexts cross between an app and its design system, one direction each. The application supplies session, permissions, locale facts, the translate implementation and the unauthenticated policy. The design system supplies theme, device, navigation, media resolution and density.

- **Service calls**: run every call of a screen through the service executor. It never throws: it resolves to what the call returns, or to nothing when the call fails. An unauthenticated failure goes to the app's policy alone. Before the app is mounted there is no policy, so that failure goes to the caller's own handler. Any other failure is shown once, by the screen's handler or by a toast. A failure that nothing takes is logged as an error, so none is silent.
- **Theming**: derive the brand from a single seed. Treat light and dark as a mode flip on the role layer. A block with no `mode` follows the theme around it; a block whose `mode` names light or dark draws in that mode's own values wherever it stands, in both directions. Read the roles and the scale from a component, never a ramp step and never a raw value. Let the design-system root own theme state, with the setter reachable from any depth.
- **Formatting**: ship one formatting capability per preference vocabulary. Never format by hand in a component or a module. Resolve an absent optional preference to the vocabulary's declared default, never to the device's locale. The app always holds the time format, as it holds the date format and the number format (`RD.SUPPORT.SURFACE.123`). A block that shows or takes a time uses the format the page gives it, else the app's, and it holds no time format of its own. A console that states no preference of a person or of an organization gives the 12-hour form with AM or PM, `HH_MM_DAY_FORMAT`.
- **Translation**: pass every user-facing string through the design system's translate capability, with a key, a source message and named variables. The application supplies the implementation.
- **Navigation**: declare a `navigate` seam in the design system, and bind the application's router to it once. Never import a router, read a route or touch history from a design-system component.
- **Media**: resolve variant, size and density into an address. Require a placeholder and an error image. Never assemble a URL by hand in a screen.
- **Overlays**: request dialogs, confirmations and sheets through one imperative seam. Never mount them from the component that needs them.
- **Gated rendering**: treat it as presentation only. Hiding a control is courtesy, and the refusal is the server's.

A conforming design system answers a fixed set of groups (`architecture-components.md`). The set sits in six layers, on every stack (`architecture-names.md`): core, components, widgets, containers, layouts and app. A layer uses only the layers named before it.

**App is the sixth and last layer.** It holds the root block `DSApp`, the app's contract and the theme. It may use every layer before it, and no block of another layer uses the root block: a block only reads what the root block hands down.

## The theme — 🔮

A theme is one declared object, `IDSTheme`, and it holds a closed list of choices.

| Choice | What it sets |
| --- | --- |
| Brand color | the seed the primary ramp is worked out from |
| Light or dark | which ramp step each role token points at |
| Default size | the size step a block takes when none is set on it |
| Font family | the typeface of every text |
| Corner radius | one base value. The radius of every size step is worked out from it |
| Container look | `container`: the four props of the container, as the default for every container. A card follows it where the card look says nothing |
| Card look | `card`: `raised`, `bordered` and `rounded`, as the default for the surface of every card |
| Card widget look | `cardWidget`: what `DSCardWidget` adds to a card. `divided` is the lines between its head, its parts and its footer, `rowsDivided` the lines between the rows of its `ITEMS` and `LIST` parts, and `rowsHoverable` the hover of those rows |
| Table look | `table`: `striped` and `hoverable`, as the default for every table |
| Layout look | `layout`: how a layout is drawn, in two parts, `shell` and `content` |

Each of the last four blocks is optional. In `card`, `cardWidget` and `table` each value is yes or no.

- **A table MUST take `striped` and `hoverable` from its own prop where the prop is given, else from the theme's `table`, else off** (`RD.SUPPORT.SURFACE.126`). A partner turns them on once for every table of an app, and one table that says no still wins.
- **A card MUST take `raised`, `bordered` and `rounded` from its own prop where the prop is given, else from the theme's `card`** (`RD.SUPPORT.SURFACE.128`). Each of the props is decided by itself, so a `card` that sets `bordered` alone leaves the others as they were. Under a theme with no `card`, a card takes them from the theme's `container`, and where that says nothing it draws its own look: raised, bordered and with square corners. So a theme can say flat containers with bordered cards, and an app that has written no `card` sees no change.
- **The card look holds the surface of a card and nothing else.** The line between the parts of a plain `DSCard`, `divided`, is a prop of the card that the page writes.
- **`DSCardWidget` MUST take what it adds to a card from the theme's `cardWidget`, where its own prop says nothing.** Its `divided` is its own prop, else `divided` of `cardWidget`, else off. The rows of a part take `divided` from the prop of the part, else from `rowsDivided`, else on, and `hoverable` from the prop of the part, else from `rowsHoverable`, else off. The surface of the widget's card follows the card look.
- **The theme holds no block for a list.** The `divided` and the `hoverable` of `DSList` are props that the page writes.

The layout look, `IDSThemeLayout`, has two parts and no more: `shell`, the look of a bar of the navigation (`IDSNavBarLook`), and `content` (`IDSContentLook`). `architecture-layouts.md` states what the shell and the content are in each layout type, and how the entries of the navigation are drawn.

| Field | What it sets | Values | Taken by |
| --- | --- | --- | --- |
| `color` | the colour of the fill | `DSSurfaceColorType`: `BASE` (the surface of the page) · `DEFAULT` (the neutral hue) · `PRIMARY` (the brand hue) | the shell · the content |
| `strength` | how strong the fill of a hue is. `BASE` takes none | `DSSurfaceStrengthType`: `SUBTLE` · `QUIET` · `SOLID` | the shell · the content |
| `opacity` | whether the fill is opaque, or frosted where content passes behind it | `DSSurfaceOpacityType`: `OPAQUE` · `TRANSLUCENT` | the shell |
| `bordered` | the lines: at the edge of the shell, and around a panel of navigation that opens from it | yes or no | the shell |
| `raised` | the depth: a shadow under the shell, and under such a panel | yes or no | the shell |
| `entry` | the kind of the entries of the navigation | `DSNavEntryType`: `SOLID` · `QUIET` · `SUBTLE` · `LINE` · `PLAIN` | the shell |
| `inset` | the content as a rounded sheet set into the shell | yes or no | the content |

- **The theme MUST style the layout in two parts, the shell and the content, and it MUST hold no setting for one layout type** (`RD.SUPPORT.SURFACE.139`). A partner writes the look once, and the rail, the dock and the top bar each draw it. The shell of the theme and a bar of the navigation share one shape, `IDSNavBarLook`.
- **A surface MUST take its look as a colour, a strength and an opacity, each from its own closed set.**
- **In dark, a stronger shell MUST be darker than the page, and never lighter.**
- **The content MUST take every colour and every strength**, so a marketing page can draw its bands. **Where the body text of the units would fall under 4.5 to 1 on the fill of the content — a `QUIET` or `SOLID` content — the content MUST give the units inside it the tokens of the opposite mode**, scoped to the content, as dark mode does for the page.
- **With no `layout`, and with a field left out, every layout MUST draw as it did before.** Where the colour of the content is left out, the fill of the page stays the sunken surface under a theme whose containers are raised, and the plain surface under any other.
- **The layout look MUST take no colour value, no opacity value and no blur as a value.** Each field names one of a closed set, and the design system holds the values. The fill under the pointer of an entry is not a setting of its own: it follows from the kind of entry and the fill of the shell.
- **The layout type and the widths of the layout are not part of the layout look.** A marketing page takes the layout type `CANVAS`, and draws its bands in the main area. The layouts alone read the layout look, and a layout's config can give one page a content look of its own.

A partner changes the look of an app through one theme, and in no other way (`RD.SUPPORT.APPS.150`). A partner writes one theme, and never a style for a block. The theme is held at the app's root, and changeable from any depth, so a component that learns the brand late (after sign-in, from an API response) retints the whole surface without reaching application-root state. The layout type is not a choice of the theme. Support ships a theme, and never a template.

## Prop, nearest block, app — 🔮

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
| Size | whoever composes a region: the app, a container, a card, a widget or a composite, or the page | all the way down, until a block that passes its size on sets another |
| Frame | a part of a container or of a card that has `flush` | to the block that uses it. A card and an overlay stop the setting that comes from outside them |

Only these blocks pass their size on: `DSApp` (from the theme) to every block of the app; `DSContainer` to every block inside it; `DSCard` to every block inside it, and a card that states no size hands on the size it stands in; a widget or a composite to its own parts (a data table to its table and its pager, a form to its fields, a button group to its buttons, a filter bar to its controls); `DSScope` with a `size`, written by the page, to everything in that region. No other block passes its size on — a dialog, a drawer, a sheet, an alert, tabs, a tooltip, a menu, a popover and a collapsible do not. A popover draws its own surface: the fill, the edge, the radius and the shadow. A frame is drawn once on any part of a page (`architecture-containers.md`); a block reacts to one thing only: sitting in a `flush` part, of a container or of a card. A `flush` part of a card sets the frame setting again for what that part holds.

## What only a browser needs — ✅

- Reference a package's served assets, such as fonts, by a URL relative to the stylesheet that needs them. The app that imports the styles makes those files reachable.
- Import only the asset entries a package declares, never a build-output path or a source path inside it.
- Treat a stored theme as a cache. The prepared value wins on load.
- Render a link as a real anchor, and route through the navigation seam when it is activated normally.
- Write the app's own media as root-relative paths on the app's own origin. No asset origin is configured.

The web's own share of the device type — screen class and orientation — is stated in `standards-core.md`.

## What a stack adds

How a block is built belongs to the stack. For TypeScript, read `../apps/providers/ts/08-web.md` and `providers.md` in this plugin. One rule of it applies every time a block changes: **no file under `_shadcn/` is edited by hand.** The shadcn CLI emits or copies every file there, the hooks and helpers included. Make the change in the block's `DS*` wrapper.

## Boundary

This ref states what an app hands a surface, once, and in what order a block resolves a setting it did not set itself. It stops at the edge of the app's own contract. It does not state where a permission, a preference or a brand colour is read from — that belongs to the Platform. It does not state what a layout or a container is — those are `architecture-layouts.md` and `architecture-containers.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.150` | a partner changes the look of an app through one theme, and the layout type is not a choice of it |
| `RD.SUPPORT.SURFACE.126` | the theme holds the table look, and the order a table takes its stripes and its hover in |
| `RD.SUPPORT.SURFACE.139` | the theme holds the layout look, in two parts, the shell and the content, and a surface takes a colour, a strength and an opacity |
| `RD.SUPPORT.SURFACE.128` | the theme holds the card look, apart from the container look, and the card widget look, the order each is read in, and the theme holds no block for a list |
| `RD.SUPPORT.SURFACE.123` | the app holds the time format as a required fact, and a block holds no time format of its own |
| `RD.SUPPORT.APPS.156` | the screen still shows a call working, and that it is done |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
