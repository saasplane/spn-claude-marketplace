<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/08-web.md",
      "seen": "8607f5f6"
    }
  ]
}
-->
# Web — the canonical component, hook and screen

**Source of truth:** the foundation's `10-providers/ts/08-web.md`. Read this as the restatement; that chapter governs.

**One canonical component shape, written so the next one is written the same way.** Read the chapter as the standard rather than as a catalogue: it is not a list of components you may use, it is the shape yours must take.

**The wrapper is the public API.** A generated primitive is never hand-edited and never exported directly — the wrapper around it is what the rest of the application sees, and what absorbs a regeneration.

**No file under `_shadcn/` is edited by hand.** The shadcn CLI emits or copies every file there: the primitives, and the hooks and helpers beside them. The rule covers the whole folder. Make the change a component needs in its `DS*` wrapper. Run the CLI again to refresh a file. Re-point the tokens to change a look, because an edited primitive loses the edit at the next regeneration.

**Three prop names are shared, and each one means one thing.** `variant` is the surface treatment, `color` is the hue, and `size` is the density step. A component takes `variant` and `color` independently, and never folds the two into one prop. The Surface ref, [`../../surface.md`](../../surface.md), states the three names with their values.

**A name is the book's, and TypeScript adds only its form.** The Surface construct states the name of a component, of a prop and of a closed value. This stack adds the form and nothing else: `DS` + PascalCase for a component, `I` + that name + `Props` for its props, a `Type` suffix for an enum, and `DS_` + UPPER_SNAKE for a constant map. A prop the book renames takes the book's name.

**A hook names its context.** A hook of the design system reads as `useDS` + the context + the value, such as `useDSScopeSize`, `useDSAppAuthz`, `useDSAppTestData` and `useDSOverlayConfirm`. Each context has one hook that returns it whole: `useDSContext`, `useDSAppContext`, `useDSScopeContext` and `useDSOverlayContext`. `useDSScopeIsFramed` returns whether the block sits in a `flush` part, with the block's own `bordered` winning. The Surface ref states the rule.

**`DSScope` sets the size or the frame setting for what it holds.** A page writes `<DSScope size={…}>` around a region. A part of a container with `flush` draws no inset, and it wraps what it holds in `DSScope framed`. A part without `flush` draws its inset when it is in the frame, and it sets no frame setting. Each block that reacts reads `useDSScopeIsFramed(props.bordered)`, and wraps what it holds in `DSScope`, so the setting stops there. A card and each overlay wrap what they hold in `DSScope` with nothing set: the frame setting stops, and the size above passes through. A block that only holds content sets no scope. 🚧 Not yet realized: no release carries `DSScope` or the container.

**The default size is a field of the theme.** `size` is required on the theme. A component rendered without `size` takes the size of the nearest block above it that sets one, and then the theme's `size`. Resolve it through `useDSScopeSize`, never through a destructure default. 🚧 Not yet realized: the context holds the default size as `defaultComponentSize` today, so read the installed package before you write a theme.

**A component reads the roles and the scale, and nothing below them.** It never reads a ramp, the seed or a number of its own. The scale holds the height, the padding, the gap, the radius and the icon size of each size step, and a component reads it through the size maps. 🚧 The scale is not yet realized as tokens: the numbers sit in the class maps today.

**The design system's own boot is not the application's boot.** They are two different acts, and confusing them puts application state inside a library.

**Every web app declares the same scripts, and a separate preview script is not among them** — it was the start script under another name and is retired. **The test bundle is a flavour of the build, never a second script.**

**The dev server accepts the host the estate serves it on**, because the name a browser reaches it by comes from the estate's coordinates rather than from localhost.

**A stylesheet's asset paths are relative to the stylesheet**, not to the page that loads it.
