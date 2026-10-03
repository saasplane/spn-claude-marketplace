<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/05-architecture-core.md",
      "seen": "c8211598"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/05-architecture-core/",
      "seen": "69c2b90b"
    }
  ]
}
-->

# Core — The Tokens Every Block Reads

Source of truth: the foundation's Core construct (`docs/02-constructs/02-support/03-surface/05-architecture-core.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/05-architecture-core/`), which are **done**: every role, every step of the scale and every type step carries a value there. Core is the fifth of thirteen Surface constructs, and names the tokens every block is drawn with.

Read this before you ask what a block may read, or before you add a role, a step of the scale or an icon.

## Terms

| Term | What it means |
| --- | --- |
| Token | a named value a block is drawn with. A token is not a block |
| Role token | a token named for its job, such as the raised surface. It changes with light and dark |
| Ramp | the raw palette a role points at. A block never reads a ramp step directly |
| Scale | the token group that holds the height, the padding, the gap between blocks, the gap between the parts of a control, the radius and the icon size of each size step |
| Type step | one size and one line height of the type scale |
| Icon | one of the named pictures a block may draw in place of its label, from a closed set |

## The token groups — ✅

| Token group | Holds | A block reads it |
| --- | --- | --- |
| The seed | the one brand color of a theme | never |
| The ramps | the raw palettes. Primary is worked out from the seed. Neutral, success, warning, error and info are fixed | never |
| The roles | tokens named for a job: surface, foreground, border and accent. Each one points at a ramp step, and dark points it at another | yes |
| The type steps | a size and a line height for each step of text | yes |
| The scale | the height, the padding, the gap between blocks, the gap between the parts of a control, the radius and the icon size of each size step | yes |

A block reads a role token and the scale, never a ramp step, and never holds a number of its own. That is what lets one seed retint an app and one flip turn it dark, with no block changed.

## The roles, by job — ✅

Every role is named for its job, never for a color: **Surface** is the fill a block or a part of the page sits on, at rest, raised, sunken, inset or hovered. **Foreground** is the text and the icon drawn on a surface, from body down to a muted or inverse tone — text on a filled surface reads the inverse foreground role, light in both modes. **Border** is the line a bordered block or a divided list draws. **Accent** is the hue of a block's `color`, with its own hover, its own fill on a solid block and its own tint on a soft one. Every overlay that covers a page dims it with one scrim role, and `DSBackdrop` draws that scrim.

## The scale — ✅

The scale has five steps, `XS` to `XL`. Each step carries six measures: height, padding (the inset of a card or a part of a container), the gap between blocks, the gap between the parts of a control, radius, and icon size. The layout's own measures are named in the scale too — the width of the rail open, shut and on a narrow screen, the height of a bar, the width of the dock's column, the width of the shell and the inset of the main area — and no layout holds one as a number.

## The type steps and icons — ✅

Text is drawn at one of three families of step, each at several sizes: heading (a page or section title), title (a component's own title or label), content (the body text a person reads). Each step also carries a weight (`REGULAR` · `MEDIUM` · `SEMIBOLD` · `BOLD`) and a tone (`DEFAULT` · `MUTED` · `SUBTLE` · `INVERSE`). A block draws an icon from one closed set, `DSIconType`, never a file of its own choosing — the full list of names is declared member by member in the capability chapter.

## Boundary

This ref names every role, every step of the scale, and the family of every type step. It gives none of them a value in the general vocabulary sense beyond what is listed above — the full worked value of every role in light and dark lives in the capability chapter this ref restates. It does not say which block reads which role, or which prop carries a type step — that is `architecture-components.md` and `architecture-names.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.152` | the spacing and size scale is a token group beside the roles, and a block reads a role token and the scale, never a ramp step or a number of its own |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
