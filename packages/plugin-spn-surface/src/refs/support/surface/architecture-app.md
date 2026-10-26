<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-surface/10-architecture-app.md",
      "seen": "9fc29ff6"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/10-architecture-app/",
      "seen": "bf4fcd9c"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-apps/10-providers/ts/08-web.md",
      "section": "Generated primitives are never hand-edited",
      "seen": "87b2001b"
    }
  ]
}
-->

# App — What Every Surface Is Configured With

Source of truth: the foundation's App construct (`docs/02-constructs/02-support/01-surface/10-architecture-app.md`) and its capability chapters (`docs/04-capabilities/02-support/01-surface/10-architecture-app/`). App is the tenth of thirteen Surface constructs, and the last of the Architecture group.

Read this before you mount a surface, write a theme, or ask what a block already knows without being told. `DSApp` mounts once and hands every block below it the person's grants, their preferences, the look and the device, and the seams a block never owns itself.

## Terms

| Term | What it means |
| --- | --- |
| Theme | `IDSTheme` — the closed list of choices that gives an app its look, with a value in every field, held by the context and by `DS_THEME_DEFAULT` |
| Theme choice | `DSDeepPartialType<IDSTheme>` — what an app hands in: the same type with every field optional, nested parts included |

## The contexts and the seams — ✅

Exactly two contexts cross between an app and its design system, one direction each. The application supplies session, permissions, locale facts, the translate implementation and the unauthenticated policy. The design system supplies theme, device, navigation, media resolution and density.

- **Service calls**: run every call of a screen through the service executor. It never throws: it resolves to what the call returns, or to nothing when the call fails. An unauthenticated failure goes to the app's policy alone. Before the app is mounted there is no policy, so that failure goes to the caller's own handler. Any other failure is shown once, by the screen's handler or by a toast. A failure that nothing takes is logged as an error, so none is silent.
- **Theming**: derive the brand from a single seed. Treat light and dark as a mode flip on the role layer. A theme that names no mode follows the device's light or dark, live, and the mode in force is always one of the two (`RD.SUPPORT.SURFACE.211`). A block with no `mode` follows the theme around it; a block whose `mode` names light or dark draws in that mode's own values wherever it stands, in both directions. Read the roles and the scale from a component, never a ramp step and never a raw value. Let the design-system root own theme state, the choice and the theme beside it, with the setter of the choice reachable from any depth.
- **Formatting**: ship one formatting capability per preference vocabulary. Never format by hand in a component or a module. Resolve an absent optional preference to the vocabulary's declared default, never to the device's locale. The app always holds the time format, as it holds the date format and the number format (`RD.SUPPORT.SURFACE.123`). A block that shows or takes a time uses the format the page gives it, else the app's, and it holds no time format of its own. A console that states no preference of a person or of an organization gives the 12-hour form with AM or PM, `HH_MM_DAY_FORMAT`.
- **Translation**: pass every user-facing string through the design system's translate capability, with a key, a source message and named variables. The application supplies the implementation.
- **Navigation**: declare a `navigate` seam in the design system, and bind the application's router to it once. Never import a router, read a route or touch history from a design-system component.
- **Media**: resolve variant, size and density into an address. Require a placeholder and an error image. Never assemble a URL by hand in a screen.
- **Overlays**: request dialogs, confirmations and sheets through one imperative seam. Never mount them from the component that needs them.
- **Gated rendering**: treat it as presentation only. Hiding a control is courtesy, and the refusal is the server's.

A conforming design system answers a fixed set of groups (`architecture-components.md`). The set sits in six layers, on every stack (`architecture-names.md`): core, components, widgets, containers, layouts and app. A layer uses only the layers named before it.

**App is the sixth and last layer.** It holds the root block `DSApp`, the app's contract and the theme. It may use every layer before it, and no block of another layer uses the root block: a block only reads what the root block hands down.

## The theme — 🔮

> **Built.** `@saasplane/support-web-ds-ts` carries the theme by layer (`app`, `layout`, `container`, `widget` and `component`), each look that paints typed as `Required<IDSFrameSurface>`, the frames only the panel takes from the theme, and the feature whose paint is its own `surface`, from support 5.22.0, and the library is owed.

A theme is one declared object, `IDSTheme`, and it holds a closed list of choices. The choices are grouped by layer, each under the layer that reads it, from the outside of a page in: `app` holds the six global values, `layout` the layout look, `container` the look of the panel, `widget` the look of the card widget, and `component` the looks of the card and the table. Every choice is optional, the brand colour, the mode and the size among them, and a choice left out takes the value of the default theme. The mode alone has no default: left out, the theme follows the device.

| Choice | What it sets |
| --- | --- |
| Brand color | the seed the primary ramp is worked out from |
| Light or dark | which ramp step each role token points at; `LIGHT` or `DARK`, and left unset the device's, followed live (`RD.SUPPORT.SURFACE.211`) |
| Default size | the size step a block takes when none is set on it |
| Corner radius | one base value. The radius of every size step is worked out from it |
| Motion speed | `motionSpeed`: the multiplier on every place's base duration |
| Temperature of the greys | `neutralTemperature`: `COOL`, `NEUTRAL` (the default) or `WARM`. The greys, the surfaces, the lines and the text lean cool, stay neutral or lean warm, and a grey stays a grey. A choice of three, never a hue or a chroma as a value (`RD.SUPPORT.SURFACE.203`) |
| Card look | `component.card`: the props of `IDSFrameSurface`, `color`, `strength`, `raised`, `bordered` and `rounded`, as the default for the surface of every card |
| Table look | `component.table`: `striped` and `hoverable`, as the default for every table |
| Card widget look | `widget.card`: what `DSCardWidget` adds to a card. `divided` is the lines between its head, its parts and its footer, `rowsDivided` the lines between the rows of its `ITEMS` and `LIST` parts, and `rowsHoverable` the hover of those rows |
| Panel look | `container.panel`: `frames` and the five props of `IDSFrameSurface`, as the default for every panel container. Only the panel reads it; a card reads the card look alone |
| Layout look | `layout`: how a layout is drawn, in three parts, `body`, `navigation` and `content` |

In `component.card`, `widget.card` and `component.table` each value but the fill is yes or no.

- **The theme MUST group its choices by layer, each under the layer that reads it** (`RD.SUPPORT.SURFACE.264`). `app` holds the six global values, the ones `DSApp` reads to write the root tokens and the default size; the layers stand in the order of a page, from the outside in, in the type, in the default theme and in every list of them. The first is the app because the app is what reads the six values (`RD.SUPPORT.SURFACE.276`). A new look goes under its unit's layer. The platform stores no theme on the server, so an old stored value reads as nothing.
- **A unit's look MUST stand in the theme only where the unit frames by default and repeats across an app** (`RD.SUPPORT.SURFACE.279`). The panel container, the card, the card widget and the table do. A unit that frames only where its page asks, as the feature does, holds no look in the theme: its page sets its paint on its own props, and each key left out takes a fixed default of the design system.
- **A look that paints a frame MUST extend `Required<IDSFrameSurface>`, and the theme MUST hold no nested `surface` key** (`RD.SUPPORT.SURFACE.261`). The fields are typed once, so the theme, a unit's `surface` and the theme's form read the same five keys.

- **A table MUST take `striped` and `hoverable` from its own prop where the prop is given, else from the theme's `component.table`** (`RD.SUPPORT.SURFACE.126`). The default theme stripes a table and gives it no hover. A partner changes them once for every table of an app, and one table that says otherwise still wins.
- **A card MUST take each key of its `surface` from its own prop where the key is given, else from the theme's `component.card`** (`RD.SUPPORT.SURFACE.128`, `RD.SUPPORT.SURFACE.261`). Each key is decided by itself, so a `surface` that sets `bordered` alone leaves the others as they were, and one resolver, `prepareFrameSurface`, keeps the theme's value for a key left undefined. Where the app chose no card value, the card takes the default: raised, bordered and rounded, whatever the panel look chose (`RD.SUPPORT.SURFACE.232`). So a theme can say flat panels with bordered cards. The parts the frame holds are the card's `frames`, all three where it names none, and the theme holds no `frames` for a card.
- **Only the panel MUST take its frames from the theme** (`RD.SUPPORT.SURFACE.262`). A card names its own `frames`, and a feature frames nothing unless the page lists its `frames`.
- **A feature MUST take `frames` from its own prop, and each key of its `surface` from its own prop where the key is given, else from the design system's fixed feature default, `FEATURE_SURFACE_DEFAULT`** (`RD.SUPPORT.SURFACE.240`, `RD.SUPPORT.SURFACE.277`). The theme holds no feature look and cannot change that default, so a framed feature draws flat unless its page gives it a `surface`. `FEATURE_SURFACE_DEFAULT` is `color` `BASE`, `strength` `SUBTLE`, `raised` no, `bordered` no and `rounded` yes; `frames` is empty where it is left out, so a feature draws no frame, and there is no `unframed`.
- **Every text MUST take the design system's font, the facts of an item line and of a feature included, and the theme MUST hold no face for a part of the text** (`RD.SUPPORT.SURFACE.196`). A value or a code a page shows in the monospaced face is `DSText` with `monospaced`, a choice of the page and not of the theme.
- **The card look holds the surface of a card and nothing else.** The line between the parts of a plain `DSCard`, `divided`, is a prop of the card that the page writes.
- **`DSCardWidget` MUST take what it adds to a card from the theme's `widget.card`, where its own prop says nothing.** Its `divided` is its own prop, else `divided` of `widget.card`, no by default. The rows of a part take `divided` from the prop of the part, else from `rowsDivided`, yes by default. They take `hoverable` from the prop of the part, else from `rowsHoverable`, yes by default. The surface of the widget's card follows the card look.
- **The theme holds no block for a list.** The `divided` and the `hoverable` of `DSList` are props that the page writes.

The layout look, `IDSThemeLayout`, has three parts and no more: `body`, `navigation` and `content` (`RD.SUPPORT.SURFACE.200`). The body is the whole window, with the fill behind everything and the width of the box the other two stand in. The navigation is the look of the rail, the top bar, and the bar and column of a dock, and the content is the look of the area the page's children stand in. `architecture-layouts.md` states what each part is in each layout type, and how the entries of the navigation are drawn.

| Field | What it sets | Values | Taken by |
| --- | --- | --- | --- |
| `color` | the colour of the fill | `DSSurfaceColorType`: `BASE` (the surface of the page) · `DEFAULT` (the neutral hue) · `PRIMARY` (the brand hue) | the body · the navigation · the content |
| `strength` | how strong the fill of a hue is. `BASE` takes none | `DSSurfaceStrengthType`: `SUBTLE` · `QUIET` · `SOLID` | the body · the navigation · the content |
| `width` | how wide the body's box grows | `DSLayoutWidthType`: `FULL` (the whole window) · `XWIDE` (at most 1400 px) · `WIDE` (1280) · `MEDIUM` (1024) · `NARROW` (768), each centred | the body |
| `maxWidth` | the widest the box grows, in pixels, over the width's own step | a number | the body |
| `opacity` | whether the fill is opaque, or frosted where content passes behind it | `DSSurfaceOpacityType`: `OPAQUE` · `TRANSLUCENT` | the navigation |
| `entry` | the kind of the entries of the navigation | `DSNavEntryType`: `SOLID` · `QUIET` · `SUBTLE` · `LINE` · `PLAIN` | the navigation |
| `bordered` | the lines: at the edge of the part, and around a panel of navigation that opens from it | yes or no | the navigation · the content |
| `raised` | the depth: a shadow under the part, and under such a panel | yes or no | the navigation · the content |
| `elevation` | how far a raised part, and a panel that opens from it, stands off the page. Read only where `raised` is yes; `MD` where left out, the shadow a raised bar and its panels always cast (`RD.SUPPORT.SURFACE.289`) | `DSSizeType`: `XS` to `XL` | the navigation · the content |
| `attached` | the part meets the window's edge. No, it floats as a rounded container, the layout's space in | yes or no | the navigation · the content |
| `sticky` | the top bar stays in the window while the page scrolls. A rail always stays | yes or no | the navigation |

- **The theme MUST style the layout in three parts, the body, the navigation and the content, and it MUST hold no setting for one layout type** (`RD.SUPPORT.SURFACE.139`, `RD.SUPPORT.SURFACE.200`). A partner writes the look once, and the rail, the dock and the top bar each draw it. The navigation look of the theme extends the look a bar takes, `IDSNavBarLook`, so the theme and a bar share one shape.
- **A surface MUST take its look as a colour and a strength, and the navigation also an opacity, each from its own closed set.**
- **In dark, a stronger navigation MUST be darker than the page, and never lighter.**
- **The content MUST take every colour and every strength**, so a marketing page can draw its sections. **Where the body text of the units would fall under 4.5 to 1 on the fill of the content — a `QUIET` or `SOLID` content — the content MUST give the units inside it the tokens of the opposite mode**, scoped to the content, as dark mode does for the page.
- **A field of the layout look that the app leaves out MUST take the value of the default theme.** Every layout reads the one theme, so no layout keeps a default of its own. Where the colour of the body is left out, it is `BASE`, the surface of the page, under a navigation of `DEFAULT` at `SUBTLE`: nothing works it out from the containers (`RD.SUPPORT.APPS.160`).
- **The layout look MUST take no colour value, no opacity value and no blur as a value.** Each field names one of a closed set, and the design system holds the values. The fill under the pointer of an entry is not a setting of its own: it follows from the kind of entry and the fill of the navigation.
- **The width MUST be the body's, and the spacing MUST follow the theme's `size`** (`RD.SUPPORT.SURFACE.158`, `RD.SUPPORT.SURFACE.200`). The layout keeps one spacing, `--layout-space`: 16 px at `XS` and `SM`, 24 at `MD`, 32 at `LG` and `XL`, and 16 on a phone. It is not a field of the layout look, and there is no gutter. The theme gives every app `FULL`.
- **`sticky` MUST sit in the layout look, so an app sets it once.** It governs the top bar of a top nav and of a dock. The config of a top nav has no `sticky` and no `overlay` of its own.
- **The bar's width and the size of the navigation's entries are not fields of the layout look** (`RD.SUPPORT.SURFACE.257`). They are `barWidth` and `size` in the config of a top nav and a dock, and `size` in a rail's, as `architecture-layouts.md` states, because the navigation look is shared by every layout and only some of them read these.
- **The layout type is not part of the layout look.** A marketing page takes the layout type `CANVAS`, and draws its sections in the body's box. The layouts alone read the layout look, and a layout's config can give one page a look of its own for each part, field by field.

A partner changes the look of an app through one theme, and in no other way (`RD.SUPPORT.APPS.150`). A partner writes one theme, and never a style for a block. The theme is held at the app's root, and changeable from any depth, so a component that learns the brand late (after sign-in, from an API response) retints the whole surface without reaching application-root state. The layout type is not a choice of the theme. Support ships a theme, and never a template.

## The whole theme — 🔮

The theme is one type, `IDSTheme`, with a value in every field but the mode. What an app hands in is its choice: the same type with every field optional, worked out by one helper type, so no part is written twice. The theme the blocks draw is the choice laid over one default object, field by field.

```ts
export const DS_THEME_DEFAULT: IDSTheme = {
  app: {
    primary: DS_DEFAULT_PRIMARY,                  // '#084A75'
                                                  // no mode: the default theme follows the device
    size: DSSizeType.SM,
    radius: DSThemeRadiusType.MEDIUM,
    motionSpeed: DSMotionSpeedType.DEFAULT,
    neutralTemperature: DSThemeNeutralTemperatureType.NEUTRAL,
  },
  layout: {
    body: {
      color: DSSurfaceColorType.BASE,
      strength: DSSurfaceStrengthType.SUBTLE,
      width: DSLayoutWidthType.FULL,
    },
    navigation: {
      color: DSSurfaceColorType.DEFAULT,
      strength: DSSurfaceStrengthType.SUBTLE,
      opacity: DSSurfaceOpacityType.OPAQUE,
      entry: DSNavEntryType.SUBTLE,
      bordered: true,
      raised: true,
      attached: true,
      sticky: true,
    },
    content: {
      color: DSSurfaceColorType.BASE,
      strength: DSSurfaceStrengthType.SUBTLE,
      bordered: false,
      raised: false,
      attached: true,
    },
  },
  container: {
    panel: {
      frames: [DSBoxPartType.CONTENT, DSBoxPartType.FOOTER],
      color: DSSurfaceColorType.BASE,
      strength: DSSurfaceStrengthType.SUBTLE,
      raised: true,
      bordered: true,
      rounded: true,
    },
  },
  widget: {
    card: { divided: false, rowsDivided: true, rowsHoverable: true },
  },
  component: {
    card: { color: DSSurfaceColorType.BASE, strength: DSSurfaceStrengthType.SUBTLE, raised: true, bordered: true, rounded: true },
    table: { striped: true, hoverable: false },
  },
};
```

- **The app and its context MUST hold the whole theme, `theme`, and the choice beside it, `themeChoice`** (`RD.SUPPORT.SURFACE.161`). So a page can tell a value the app chose from a default, and clear a choice. A choice equal to the default is left out of `themeChoice`. `DSApp` and `setTheme` take the choice. A second, resolved type exists nowhere.
- **The defaults MUST be written in one place, the default theme.** A unit and a layout read the theme, and keep no fallback of their own for a value of it. A unit's own prop, optional, still wins.
- **A theme that names no mode MUST follow the device, and the mode in force MUST stay light or dark** (`RD.SUPPORT.SURFACE.211`). `DSThemeModeType` keeps `LIGHT` and `DARK`, with no third member. `DSApp` reads `prefers-color-scheme` and follows its change; `data-mode` and every token stay light or dark. A unit that draws by mode reads `useDSResolvedMode()`, never `theme.mode`.
- **Some values MUST be worked out from the choice, and not fixed.** The colour of the content follows the choice the app made for the containers. An unset card value takes the card look's own default, never the panel's.
- **Wherever a person chooses the mode, it MUST be offered as System, Light and Dark, System first and the default** (`RD.SUPPORT.SURFACE.211`). System leaves `app.mode` out of the choice, so the app follows the device; Light and Dark are choices of their own and are kept. Each stands with its icon: a monitor, a sun and a moon.
- **The theme MUST hold no font family** (`RD.SUPPORT.SURFACE.196`). The typeface is the app's font file, bound to `DSThemeSans` with `@font-face`, and `--font-theme` stays `DSThemeSans`. A family name without its file only falls back, so a brand font is a file and a licence an app decides once.

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
| Size | whoever composes a region: a container, a card, an overlay, a widget or a composite, written from its `size`, or the page by writing `size` on the box that holds the region | all the way down, until a block that passes its size on sets another |
| Frame | a part of a container or of a card that has `flush` | to the block that uses it. A card and an overlay stop the setting that comes from outside them |

Only these blocks pass their size on: `DSPanelContainer` to every block inside it, and where none did the theme's size stands; `DSCard` to every block inside it, and a card that states no size hands on the size it stands in; a widget or a composite to its own parts (a data table to its table and its pager, a form to its fields, a button group to its buttons, a filter bar to its controls). No other block passes its size on — a dialog, a drawer, a sheet, an alert, tabs, a tooltip, a menu, a popover and a collapsible do not. A popover draws its own surface: the fill, the edge, the radius and the shadow. A frame is drawn once on any part of a page (`architecture-containers.md`); a block reacts to one thing only: sitting in a `flush` part, of a panel or of a card. A `flush` part of a card sets the frame setting again for what that part holds.

## What only a browser needs — ✅

- Reference a package's served assets, such as fonts, by a URL relative to the stylesheet that needs them. The app that imports the styles makes those files reachable.
- Import only the asset entries a package declares, never a build-output path or a source path inside it.
- Treat a stored theme as a cache. The prepared value wins on load.
- Render a link as a real anchor, and route through the navigation seam when it is activated normally.
- Write the app's own media as root-relative paths on the app's own origin. No asset origin is configured.

The web's own share of the device type — screen class and orientation — is stated in `standards-core.md`.

## What a stack adds

How a block is built belongs to the stack. For TypeScript, read `refs/support/apps/providers/ts/08-web.md` in the spn-apps plugin and `providers.md` in this one. One rule of it applies every time a block changes: **no file under `_shadcn/` is edited by hand.** The shadcn CLI emits or copies every file there, the hooks and helpers included. Make the change in the block's `DS*` wrapper.

## Boundary

This ref states what an app hands a surface, once, and in what order a block resolves a setting it did not set itself. It stops at the edge of the app's own contract. It does not state where a permission, a preference or a brand colour is read from — that belongs to the Platform. It does not state what a layout or a container is — those are `architecture-layouts.md` and `architecture-containers.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.150` | a partner changes the look of an app through one theme, and the layout type is not a choice of it |
| `RD.SUPPORT.SURFACE.126` | the theme holds the table look, and the order a table takes its stripes and its hover in |
| `RD.SUPPORT.SURFACE.139` | the theme holds the layout look, in three parts, the body, the navigation and the content, and a surface takes a colour and a strength |
| `RD.SUPPORT.SURFACE.200` | a layout has three parts, the body, the navigation and the content; the width is the body's, attached and sticky are the navigation's and the content's, and the spacing follows the theme's size |
| `RD.SUPPORT.SURFACE.128` | the theme holds the card look, apart from the panel look, and the card widget look, the order each is read in, and the theme holds no block for a list |
| `RD.SUPPORT.SURFACE.232` | each theme look is read only by its own component, and an unset field takes its own look's default |
| `RD.SUPPORT.SURFACE.240` | a feature frames nothing unless the page lists its `frames`, and takes the paint of a frame from its own `surface`, else from the design system's fixed feature default |
| `RD.SUPPORT.SURFACE.264` | the theme groups its choices by layer: app, layout, container, widget and component |
| `RD.SUPPORT.SURFACE.276` | the theme's first layer is the app, the layer that reads the six values, and the layers stand top-down in the type, the default theme and every list of them |
| `RD.SUPPORT.SURFACE.277` | the theme holds no feature look, and a framed feature takes each key of its `surface` left out from the design system's fixed feature default |
| `RD.SUPPORT.SURFACE.279` | a unit's look stands in the theme only where the unit frames by default and repeats across an app: the panel container, the card, the card widget and the table |
| `RD.SUPPORT.SURFACE.289` | `IDSSurfaceLook` carries `elevation`, `MD` where left out and read only where `raised` is true; a bar hands its elevation to the panels it opens |
| `RD.SUPPORT.SURFACE.261` | the looks that paint a frame extend the surface the core types once, and one resolver keeps the theme's value for a key left out |
| `RD.SUPPORT.SURFACE.262` | only the panel takes its frames from the theme, and the theme holds no feature look and no feature's frames |
| `RD.SUPPORT.SURFACE.257` | the bar's width and the size of the navigation's entries are the layout's config, not the theme's |
| `RD.SUPPORT.SURFACE.161` | the theme is one type with every value, over one default theme, the app's choice is the same type with every field optional, and no unit keeps a fallback of its own |
| `RD.SUPPORT.SURFACE.203` | the theme holds the temperature of the greys, a choice of three |
| `RD.SUPPORT.SURFACE.211` | a theme that names no mode follows the device's light or dark, live, the mode in force staying light or dark, and a person chooses the mode as System, Light and Dark |
| `RD.SUPPORT.SURFACE.196` | the theme holds no font family and no face for a part of the text, and every text, the facts included, takes the design system's font: the typeface is the app's font file, bound to `DSThemeSans` with `@font-face`, and `--font-theme` stays `DSThemeSans` |
| `RD.SUPPORT.SURFACE.169` | `DSForm.Field` takes `labelEndNode` after the info mark, only its label shrinks, and its message line is kept where the field can fail or has a description (`RD.SUPPORT.SURFACE.171`); the theme's form is built on it |
| `RD.SUPPORT.SURFACE.123` | the app holds the time format as a required fact, and a block holds no time format of its own |
| `RD.SUPPORT.APPS.156` | the screen still shows a call working, and that it is done |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
