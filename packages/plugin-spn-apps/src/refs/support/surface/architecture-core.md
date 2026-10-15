<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/05-architecture-core.md",
      "seen": "e98aed97"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/05-architecture-core/",
      "seen": "9c40c12e"
    }
  ]
}
-->

# Core — The Tokens Every Block Reads

Source of truth: the foundation's Core construct (`docs/02-constructs/02-support/03-surface/05-architecture-core.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/05-architecture-core/`), which are **done**: every role, every step of the scale and every type step carries a value there. Core is the fifth of thirteen Surface constructs, and names the tokens every block is drawn with.

Read this before you ask what a block may read, or before you add a role, a step of the scale, a scale size or an icon.

## Terms

| Term | What it means |
| --- | --- |
| Token | a named value a block is drawn with. A token is not a block |
| Role token | a token named for its job, such as the raised surface. It changes with light and dark |
| Ramp | the raw palette a role points at. A block never reads a ramp step directly |
| Scale | the token group that holds the height, the padding, the gap between blocks, the gap between the parts of a control, the radius and the icon size of each size step |
| Scale size | `DSScaleSizeType` — a step that says how large a thing that is shown is drawn. Each unit that takes it holds its own pixels for the step |
| Type step | one size, one weight and one line height of the type scale |
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

Every role is named for its job, never for a color: **Surface** is the fill a block or a part of the page sits on, at rest, raised, sunken, inset or hovered. **Foreground** is the text and the icon drawn on a surface, from body through a quiet and a muted tone down to a subtle or inverse tone — text on a filled surface reads the inverse foreground role, light in both modes. `fg` is the body text and every title but the title of a group. `fg-quiet`, neutral 600 in light and neutral 300 in dark, is a title that stands a step back: the title of a group. `fg-muted` is descriptions, facts and other secondary words. `fg-subtle` is for a hint that a person can miss, and for a mark between two texts such as a dot. **Border** is the line a bordered block or a divided list draws. **Accent** is the hue of a block's `color`, with its own hover, its own fill on a solid block, and the quiet and subtle tints and the line of the lighter variants. Every overlay that covers a page — a dialog, a confirm dialog, a drawer or a sheet — dims it with one scrim role, `scrim/overlay`, and `DSBackdrop` draws that scrim. Two more scrims serve a block alone: `scrim/fade`, black at 60%, and `scrim/media`, black at 80%. A block reads these roles and types no value of its own: `field/fill` is the fill of a field at rest, and `control/thumb` is the thumb of a switch, which reads `surface` in light and `fg` in dark. Focus has one width, `focus/primitive/width`, 3 px, with a border and a soft ring, `focus/primitive/border` and `focus/primitive/ring`, and an error border and ring, `focus/primitive/border-error` and `focus/primitive/ring-error`. `popup/ring` is the fine ring around a popup, and `opacity/disabled`, 50%, is the strength of a disabled block.

The neutral shades keep these rules (`RD.SUPPORT.SURFACE.141`).

- **In dark, a surface MUST be a dark grey, and never black.** The page, a raised surface and a tinted fill each stand a step lighter than the one before: 19%, 23.5% and 27.5% lightness. So a person tells them apart by their fill.
- **Surfaces MUST be told apart by their fill first, and by a line second.** The border in dark is a quiet, opaque grey, a little lighter than a tinted fill.
- **The fill under the pointer MUST NOT be the grey of the border.** `surface-hover` is one step lighter than the border in light, and lighter than the border in dark. So a row under the pointer keeps its lines.
- **A fill that is already tinted MUST still answer the pointer.** It takes `surface-soft-hover`, one step past the fill under the pointer. `SUBTLE` of the default hue and an entry of the rail take it. `surface-inset` is the fill of `SUBTLE` in the default hue.
- **A ghost or an outline control of the default hue MUST draw `surface-soft-hover` under the pointer** (`RD.SUPPORT.SURFACE.145`). That is one step stronger than the fill a row, a menu entry and a navigation entry draw under the pointer, so an action at the end of a row still shows the pointer on a filled row. A button, a badge, an icon mark and the arrow of an item line read this one step. The other hues keep their own step.
- **Small text that a person reads MUST take the muted tone at least, and never the subtle tone.** The subtle tone does not reach 4.5 to 1 against a surface.
- **A title that stands a step back MUST take the quiet tone, and its description MUST stay muted** (`RD.SUPPORT.SURFACE.143`). A description lighter than muted would fall under 4.5 to 1 on white, so the title moves up a step instead. `DSTextToneType` names it `QUIET`.
- **The shades of the variants MUST be these** (`RD.SUPPORT.SURFACE.154`). In light `QUIET` is step 200, step 300 under the pointer, and `SUBTLE` and `SUBTLE_OUTLINE` step 100, step 200 under the pointer — not step 50, which stands too close to a white page. `SUBTLE` of the default hue is `surface-inset`, and `surface-soft-hover` under the pointer. The text on a tint reads at 4.5 to 1 on it, step 900 on a tint of primary. The line of `OUTLINE` and `SUBTLE_OUTLINE` is step 300, neutral 300 for the default hue, a decoration not held to 3 to 1. In dark a tint is step 500 over the page at a share for each hue, its text step 200, and the line step 700, neutral 600 for the default hue. A tint inverts between modes.
- **A chosen row of a list and the row in view of a table draw the subtle tint of primary, step 100 in light. A pressed toggle draws `QUIET` of its hue.**
- **A known gap, open.** The muted tone falls under 4.5 to 1 on a tinted fill, on a row under the pointer and on a chosen row in light, down to 3.76 to 1. Nothing is changed for it yet.

## The scale — ✅

The scale has five steps, `XS` to `XL`. Each step carries six measures: height, padding (the inset of a card or a part of a container), the gap between blocks (8, 12, 16, 20 and 24px), the gap between the parts of a control (the icon and the label of a button: 8px at every step; the items of a group take the gap between blocks), radius, and icon size. The icon size of a step is the icon of the scale size of the same name. **An icon placed beside a title or beside running text takes the scale size of that text's own step name, and the two sit on one centre line** (`RD.SUPPORT.SURFACE.008`): at `XXS`·`XS`·`SM`·`MD`·`LG`·`XL` the text reads 10·12·13·14·16·18px and its icon 10·12·14·16·18·20px. From `XXL` to `XXL5` a title and its icon are equal, at 24·32·40·48·56px. An icon beside a heading is paired by size, as `architecture-components.md` states. The layout's own measures are named in the scale too — the width of the rail open, shut and on a narrow screen, the height of a bar, the width of the dock's column, the width of the shell and the inset of the main area — and no layout holds one as a number.

## The scale sizes — ✅

A scale size says how large a thing that is shown is drawn. It runs from `XXS` to `XXL5`, through `scaleSize` and the vocabulary `DSScaleSizeType`, and `DSIcon`, `DSIconMark`, `DSAvatar` and `DSAvatarGroup` take it. It stands beside the scale and is not a step of it: the scale says how dense a control is, and a scale size says how large a picture is. Each unit holds its own pixels for a step, so one value, given to an icon, a mark and an avatar, draws things that fit together (`RD.SUPPORT.SURFACE.101`).

| Step | Icon | Icon mark and avatar |
| --- | --- | --- |
| `XXS` | 10px | 24px |
| `XS` | 12px | 28px |
| `SM` | 14px | 32px |
| `MD` | 16px | 36px |
| `LG` | 18px | 40px |
| `XL` | 20px | 44px |
| `XXL` | 24px | 48px |
| `XXL2` | 32px | 56px |
| `XXL3` | 40px | 64px |
| `XXL4` | 48px | 80px |
| `XXL5` | 56px | 96px |

- **An icon mark holds the icon of its own step.** The icon is about half the mark from `XXL` up: a 24px icon in a 48px mark, and a 56px icon in a 96px mark. An avatar of a group takes the pixels of an avatar.
- **From `XS` to `XL` a mark and an avatar are as tall as a control of the size step of the same name.** So a picture with no scale size of its own lines up with the controls beside it. A unit that is given no scale size takes the step that fits its `size`.
- **From `XXL` to `XXL5` an icon is the size of the title of its own step name.** Below `XXL` an icon is equal to its title or a little larger.

## The type steps and icons — ✅

Text is drawn in one of three families, and each family has its steps.

| Family | What its text does | Its steps | Its weight |
| --- | --- | --- | --- |
| Heading | names the whole page, a container or a group, or is the one large line of an expressive page: a number, a price, the line of a hero | `HEADING_XXS` to `HEADING_XXL5`, 14 to 80px | semibold up to `HEADING_MD`, bold from `HEADING_LG` |
| Title | names a widget, a row among others or a small row | `TITLE_XXS` to `TITLE_XXL5`, 10 to 56px | medium |
| Content | is the running text a person reads | `CONTENT_XXS` to `CONTENT_XL`, 10 to 18px | regular |

- **Title runs from `TITLE_XXS` to `TITLE_XXL5`, and Heading from `HEADING_XXS` to `HEADING_XXL5`. Content ends at `CONTENT_XL`** (`RD.SUPPORT.SURFACE.102`). The steps from `XXL` to `XXL5` carry the names of the larger scale sizes, so a title, an icon, a mark and an avatar of one step name stand together.
- **The Heading scale MUST start at `HEADING_XXS`, 14px, with `HEADING_XS` at 18px and `HEADING_SM` at 22px** (`RD.SUPPORT.SURFACE.142`). Each is semibold. From `HEADING_MD` up the steps keep their sizes, so each level of a page has a step for its title.
- **A title and a heading may have the same size, and they then differ by weight.** Both families have a step at 14px, at 18px and from 24 to 56px. Which family a title takes is the level of the page it names (`architecture-components.md`).
- **A type step sets the size and the weight of a text, and nothing else** (`RD.SUPPORT.SURFACE.103`). Whether a text is a heading of the page is its element, which `DSText` takes through `element`. So a large number in a heading step is not announced as a section unless the page says so. The element of a title comes from the nesting of its boxes, never from its family (`RD.SUPPORT.SURFACE.106`).
- **The steps `HEADING_XXS` to `HEADING_XL` MUST take a line of 1.2 times their size, and `HEADING_XXL` to `HEADING_XXL5` a tighter line of 1.1.** A Title step takes a line of 1.3, and a Content step a line of 1.5.

The weights are `REGULAR` · `MEDIUM` · `SEMIBOLD` · `BOLD`. A text also carries a tone (`DEFAULT` · `QUIET` · `MUTED` · `SUBTLE` · `INVERSE`), for how strongly it stands out from its surface. A block draws an icon from one closed set, `DSIconType`, with one name for each icon, never a file of its own choosing — the full list of names is declared member by member in the capability chapter. `BUILDING_2`, `MOON`, `PALETTE`, `STORE` and `SUN` are among them.

## Boundary

This ref names every role, every step of the scale, every scale size, and the family of every type step. It gives none of them a value in the general vocabulary sense beyond what is listed above — the full worked value of every role in light and dark lives in the capability chapter this ref restates. It does not say which block reads which role, or which prop carries a type step — that is `architecture-components.md` and `architecture-names.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.SURFACE.008` | an icon placed beside a title or beside running text takes the scale size of that text's own step name, and the two sit on one centre line |
| `RD.SUPPORT.SURFACE.141` | the neutral shades of the surfaces and the text in light and in dark, and small text a person reads is never subtle |
| `RD.SUPPORT.SURFACE.101` | the pixels an icon, an icon mark and an avatar are drawn at for each scale size, and a mark holds the icon of its own step |
| `RD.SUPPORT.SURFACE.102` | Title runs to `TITLE_XXL5` and Heading to `HEADING_XXL5`, and Content ends at `CONTENT_XL` |
| `RD.SUPPORT.SURFACE.103` | a type step sets the size and the weight of a text, and its element is a separate property |
| `RD.SUPPORT.SURFACE.142` | the Heading scale starts at `HEADING_XXS`, and the size and line height of its three smallest steps |
| `RD.SUPPORT.SURFACE.143` | the quiet tone stands between the body and the muted tone, and the job of each text tone |
| `RD.SUPPORT.SURFACE.154` | the shades of the variants by strength, in light and in dark |
| `RD.SUPPORT.SURFACE.145` | a ghost or an outline control of the default hue draws the soft-hover fill under the pointer |
| `RD.SUPPORT.APPS.152` | the spacing and size scale is a token group beside the roles, and a block reads a role token and the scale, never a ramp step or a number of its own |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
