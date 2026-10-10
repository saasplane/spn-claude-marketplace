<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/10-architecture-app.md",
      "seen": "e8867e00"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/10-architecture-app/",
      "seen": "cc5c4d4c"
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
| Theme | `IDSTheme` — the closed list of six choices that gives an app its look |

## The contexts and the seams — ✅

Exactly two contexts cross between an app and its design system, one direction each. The application supplies session, permissions, locale facts, the translate implementation and the unauthenticated policy. The design system supplies theme, device, navigation, media resolution and density.

- **Service calls**: run every call of a screen through the service executor. It never throws: it resolves to what the call returns, or to nothing when the call fails. An unauthenticated failure goes to the app's policy alone. Before the app is mounted there is no policy, so that failure goes to the caller's own handler. Any other failure is shown once, by the screen's handler or by a toast. A failure that nothing takes is logged as an error, so none is silent.
- **Theming**: derive the brand from a single seed. Treat light and dark as a mode flip on the role layer. A block with no `mode` follows the theme around it; a block whose `mode` names light or dark draws in that mode's own values wherever it stands, in both directions. Read the roles and the scale from a component, never a ramp step and never a raw value. Let the design-system root own theme state, with the setter reachable from any depth.
- **Formatting**: ship one formatting capability per preference vocabulary. Never format by hand in a component or a module. Resolve an absent optional preference to the vocabulary's declared default, never to the device's locale.
- **Translation**: pass every user-facing string through the design system's translate capability, with a key, a source message and named variables. The application supplies the implementation.
- **Navigation**: declare a `navigate` seam in the design system, and bind the application's router to it once. Never import a router, read a route or touch history from a design-system component.
- **Media**: resolve variant, size and density into an address. Require a placeholder and an error image. Never assemble a URL by hand in a screen.
- **Overlays**: request dialogs, confirmations and sheets through one imperative seam. Never mount them from the component that needs them.
- **Gated rendering**: treat it as presentation only. Hiding a control is courtesy, and the refusal is the server's.

A conforming design system answers a fixed set of groups (`architecture-components.md`). The set sits in six layers, on every stack (`architecture-names.md`): core, components, widgets, containers, layouts and app. A layer uses only the layers named before it.

**App is the sixth and last layer.** It holds the root block `DSApp`, the app's contract and the theme. It may use every layer before it, and no block of another layer uses the root block: a block only reads what the root block hands down.

## The theme — 🔮

A theme is one declared object, `IDSTheme`, and it holds a closed list of six choices.

| Choice | What it sets |
| --- | --- |
| Brand color | the seed the primary ramp is worked out from |
| Light or dark | which ramp step each role token points at |
| Default size | the size step a block takes when none is set on it |
| Font family | the typeface of every text |
| Corner radius | one base value. The radius of every size step is worked out from it |
| Container look | the four props of the container, as the default for every container and every card |

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
| Size | whoever composes a region: the app, a container, a widget or a composite, or the page | all the way down, until a block that passes its size on sets another |
| Frame | a part of a container that has `flush` | to the block that uses it, and never into a card or an overlay |

Only these blocks pass their size on: `DSApp` (from the theme) to every block of the app; `DSContainer` to every block inside it; a widget or a composite to its own parts (a data table to its table and its pager, a form to its fields, a button group to its buttons, a filter bar to its controls); `DSScope` with a `size`, written by the page, to everything in that region. No other block passes its size on — a card, a dialog, a drawer, a sheet, an alert, tabs, a tooltip, a menu, a popover and a collapsible do not. A popover draws its own surface: the fill, the edge, the radius and the shadow. A frame is drawn once on any part of a page (`architecture-containers.md`); a block reacts to one thing only: sitting in a `flush` part.

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
| `RD.SUPPORT.APPS.156` | the screen still shows a call working, and that it is done |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
