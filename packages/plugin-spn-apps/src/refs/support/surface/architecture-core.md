<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/05-architecture-core.md",
      "seen": "4e2323a6"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/05-architecture-core/",
      "seen": "ae74bbd8"
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
| The seed | the one brand color of a theme, and the temperature of its greys | never |
| The ramps | the raw palettes. Primary is worked out from the seed. Neutral's lightness is fixed and its hue and chroma are the theme's temperature. Success, warning, error and info are fixed | never |
| The roles | tokens named for a job: surface, foreground, border and accent. Each one points at a ramp step, and dark points it at another | yes |
| The type steps | a size and a line height for each step of text | yes |
| The scale | the height, the padding, the gap between blocks, the gap between the parts of a control, the radius and the icon size of each size step | yes |

A block reads a role token and the scale, never a ramp step, and never holds a number of its own. That is what lets one seed retint an app and one flip turn it dark, with no block changed.

## The roles, by job — ✅

Every role is named for its job, never for a color: **Surface** is the fill a block or a part of the page sits on, at rest, raised, sunken, inset or hovered. **Foreground** is the text and the icon drawn on a surface, from body through a quiet and a muted tone down to a subtle or inverse tone — text on a filled surface reads the inverse foreground role, light in both modes. `fg` is the body text and every title but the title of a group. `fg-quiet`, neutral 600 in light and neutral 300 in dark, is a title that stands a step back: the title of a group. `fg-muted` is the facts of an item and other secondary words. `fg-subtle` is for a placeholder, a disabled state, and a mark between two texts such as a dot. **Border** is the line a block draws, chosen by what it parts: `surface-divider` between rows, `surface-border` at the edge of a card, a container, a popover and the shell, and `surface-border-strong` at the edge of a control. The shell's look holds no colour of its own and points at these roles. **Accent** is the hue of a block's `color`, with its own hover, its own fill on a solid block, and the quiet and subtle tints and the line of the lighter variants. The brand has two roles: `primary` is the brand as a fill, and `primary-fg` the brand as text and as a line, a link, `PRIMARY` text, a selected tab and a chosen card's ring. In light the two are the seed; dark parts them. Every overlay that covers a page — a dialog, a confirm dialog, a drawer or a sheet — dims it with one overlay role, `surface-overlay`, black at 40% in light and 60% in dark, and `DSBackdrop` draws it. Two scrims serve a block alone: `scrim/fade`, black at 60%, and `scrim/media`, black at 80%. A block reads these roles and types no value of its own: `field/fill` is the fill of a field at rest, and `control/thumb` is the thumb of a switch, which reads `surface` in light and `fg` in dark. Focus has one width, `focus/primitive/width`, 3 px, with a border and a soft ring, `focus/primitive/border` and `focus/primitive/ring`, and an error border and ring, `focus/primitive/border-error` and `focus/primitive/ring-error`. `popup/ring` is the fine ring around a popup, and `opacity/disabled`, 50%, is the strength of a disabled block.

The neutral shades keep these rules (`RD.SUPPORT.SURFACE.141`, `163`, `166` and `203`).

- **The greys MUST take their hue and chroma from the theme's temperature, and their lightness from the design system** (`RD.SUPPORT.SURFACE.203`). `neutralTemperature` is `COOL`, `NEUTRAL` or `WARM`, written by `applyTheme` as `--neutral-hue` and `--neutral-chroma`. `NEUTRAL`, the default, is no chroma, so every grey stays as it was. `WARM` takes hue 85 and `COOL` hue 250, at a chroma of 0.005 at the dark end and a share of it toward white, which stays white. Every grey of dark takes the same two tokens. The temperature is a choice of three and never a hue or a chroma as a value.
- **In dark the body text MUST be an off-white, neutral 200, one step down from near-white**, with the quiet, muted and subtle tones in their order under it (`RD.SUPPORT.SURFACE.203`): 13.67 to 1 on the page and 12.17 on a raised surface.
- **In dark the brand as a fill MUST keep the brand's strength, and the brand as text or a line MUST take its light step** (`RD.SUPPORT.SURFACE.203`). `primary` in dark is the seed's hue and chroma at 54% lightness, 49% under the pointer, with white text on it (5.07 to 1 for the default seed): a `SOLID` button, the on track of a switch (60% under the pointer, the white knob 3.94 to 1 off it), a checked box, a progress or slider fill, a chosen entry. `primary-fg` is step 400, 300 under the pointer, and the focus ring stays step 400. On a fill, `--primary-fg` follows `--surface-entry-fg`: white on `PRIMARY` `SOLID`, step 400 on `DEFAULT` `SOLID` in light and on every fill in dark.

- **In dark, a surface MUST be a dark grey, and never black.** The sunken surface and the side bar stand a shade under the page, and the page, a raised surface and the fills under the pointer each stand a step lighter than the one before: 20%, 22%, 26.5% and 29% lightness, and 34% for the strong fill under the pointer. Light changes only by the two new roles. So a person tells them apart by their fill.
- **Surfaces MUST be told apart by their fill first, and by a line second.** The border in dark is a quiet, opaque grey, a little lighter than a tinted fill.
- **A line MUST be chosen by what it parts.** Between rows it is `surface-divider`, neutral 100 in light and 27% in dark. At an edge it is `surface-border`, and at a control `surface-border-strong`.
- **The fill under the pointer MUST NOT be the grey of the edge in light.** `surface-hover` is one step lighter than the border there. In dark the border stands at 32%, a clear step above the raised surface at 26.5%, the strong border at 40%, the fill under the pointer at 29% and the divider at 27%.
- **A control's edge, and the off track of a switch, MUST step one small step from the strong border under the pointer** (`RD.SUPPORT.SURFACE.167`): neutral 300 to 400 in light, and 0.40 to 0.48 lightness in dark, drawn in full. The role is the edge under the pointer, `--surface-border-hover`.
- **A block MUST read the paint tokens set on its own root and no others** (`RD.SUPPORT.SURFACE.192`). `--surface-fill` is unset by default, and where a class of the app sets it, to a colour or an image such as a gradient, a container's frames and a card's root draw it; where it is unset they draw the preset fill of their `color` and `strength`. `--surface-translucent-fill`, 82%, and `--surface-blur`, 12px, frost a TRANSLUCENT block, which stays solid where the browser cannot blur and where the person asks for reduced transparency; the shell's `--shell-translucent-fill` and `--shell-blur` are aliases of them.
- **The surface a block stands on is one value, a `color` and a `strength`, set by what draws a fill and read by the tokens** (`RD.SUPPORT.SURFACE.199`). A block that draws a fill writes `data-surface-color` and `data-surface-strength`, and the stylesheet re-points every role token under them, in one set named `--surface-*` (`--surface-color-fill`, `--surface-fg`, `--surface-color-hover`, `--surface-line`, the entry set). Where a surface has a colour, the `PRIMARY` main action takes the colours of the open `SOLID` entry, so on `PRIMARY` `SOLID` it is white with the brand's text.
- **A control that draws its own box stands on the page inside it** (`RD.SUPPORT.SURFACE.199`). Its text, muted text, lines and field are the page's, held as `--page-*`, so its text reads on its field on every colour; its label and description outside the box keep the surface's colours, and a borderless field in another's addon, marked `ds-control-bare`, reads the surface.
- **Where a surface has a colour other than `BASE`, the neutral and the primary tint are a share of the surface's own text colour** (`RD.SUPPORT.SURFACE.199`). An avatar's fallback, the chip of an avatar group and a neutral or primary `SUBTLE` or `QUIET` badge take `--surface-tint-subtle` and `--surface-tint-quiet` and the surface's text; on `BASE` the tints stay the page's. A status badge (`INFO`, `SUCCESS`, `WARNING`, `ERROR`) keeps its own wash on a fill, so states draw apart as on the page, and its words take the surface's text, so they read at 4.5 to 1.
- **A `PRIMARY` badge on a grey fill MUST keep the brand's own tint and words** (`RD.SUPPORT.SURFACE.210`). On `DEFAULT` at `SUBTLE` or `QUIET` the badge, shown or with an anchor, reads the page's primary tint and its text, the `--page-primary-*` tokens, so a wash of the brand stands off the grey as it does off the page. On `DEFAULT` `SOLID` and on a fill of the brand the rule above stands, and every other unit keeps the surface's tints.
- **A unit that is shown and never chosen MUST take the lighter tints on a fill other than `BASE`.** A mark, an avatar and a badge with no anchor name the shown tints, `--shown-*`, with the entry's tint as their fallback; a fill other than `BASE` sets them and `BASE` inside a fill resets them, so no unit reads the surface itself. On a fill, `SUBTLE` is the surface's text at 12 %, the strength a `SUBTLE` tint has on the page, `QUIET` the entry's `SUBTLE` step, and their initials and icons the surface's muted text. A status hue keeps its own wash; the entries of a navigation keep the stronger tints.
- **A card or a container takes `color` and `strength`, `BASE` by default. A dialog, a sheet and a drawer are `BASE`, and a popover, a menu and a tooltip are raised, each fixed.**
- **A fill that is already tinted MUST still answer the pointer.** It takes `surface-soft-hover`, one step past the fill under the pointer. `SUBTLE` of the default hue and the chosen entry of the side bar take it. The fill of `SUBTLE` in the default hue is the text colour mixed into transparency.
- **A ghost or an outline control of the default hue MUST draw `surface-hover` under the pointer when it has words, and `surface-soft-hover` when it is icon only** (`RD.SUPPORT.SURFACE.145`). The strong step is one past the fill a row, a menu entry and a navigation entry draw under the pointer, so an icon at the end of a row still shows the pointer on a filled row. The arrow of an item line and a mark read the strong step. The other hues keep their own step.
- **Small text that a person reads MUST take the muted tone at least, and the subtle tone is only for a placeholder or a disabled state** (`RD.SUPPORT.SURFACE.166`). The subtle tone does not reach 4.5 to 1 against a surface.
- **A title that stands a step back MUST take the quiet tone, and the description of an item MUST take it at every level but `INLINE`; facts stay muted** (`RD.SUPPORT.SURFACE.143`, `166`). `DSTextToneType` names it `QUIET`.
- **The shades of the variants MUST be these** (`RD.SUPPORT.SURFACE.154`). Every tint is a wash of the hue's step 500 into transparency, at a share for each hue and a larger one under the pointer (`RD.SUPPORT.SURFACE.183`): `SUBTLE` and `SUBTLE_OUTLINE` at the least share that stands `0.04` of lightness from the page, a card and a dialog, and `QUIET` at the share that keeps its designed step from the page. `SUBTLE` of the default hue is the text colour mixed into transparency, `6` percent and `11` under the pointer. The text on a tint reads at 4.5 to 1 on it, step 900 on a tint of primary. The line of `OUTLINE` and `SUBTLE_OUTLINE` is step 300, and `surface-border-strong` for the default hue. In dark the light tint of every hue is its step 500 at 18 percent, 24 under the pointer, with the hue's step 400 for the text on it, step 300 for primary (`RD.SUPPORT.SURFACE.188`), the quiet tint keeps its own share and its text step 200, and the line is step 700, and `surface-border-strong` for the default hue. A tint inverts between modes.
- **A chosen row of a list and the row in view of a table draw the subtle tint of primary. A pressed toggle draws `QUIET` of its hue.**
- **Muted words on a hovered or a chosen row MUST step to the quiet tone** (`RD.SUPPORT.SURFACE.166`), because the muted tone falls to 3.76 to 1 there.

## The scale — ✅

The scale has five steps, `XS` to `XL`. Each step carries six measures: height, padding (the inset of a card or a part of a container), the gap between blocks (8, 12, 16, 20 and 24px), the gap between the parts of a control (the icon and the label of a button: 8px at every step; the items of a group take the gap between blocks), radius, and icon size. The icon size of a step is the icon of the scale size of the same name. **An icon placed beside a title or beside running text takes the scale size of that text's own step name, and the two sit on one centre line** (`RD.SUPPORT.SURFACE.008`): at `XXS`·`XS`·`SM`·`MD`·`LG`·`XL` the text reads 10·12·13·14·16·18px and its icon 10·12·14·16·18·20px. From `XXL` to `XXL5` a title and its icon are equal, at 24·32·40·48·56px. An icon beside a heading is paired by size, as `architecture-components.md` states. The layout's own measures are named in the scale too — the width of the rail open, shut and on a narrow screen, the height of a bar, the width of the dock's column, the width of the shell and the inset of the main area — and no layout holds one as a number.

## The scale sizes — ✅

A scale size says how large a thing that is shown is drawn. It runs from `XXS` to `XXL5`, through `scaleSize` and the vocabulary `DSScaleSizeType`, and `DSIcon`, `DSMark`, `DSAvatar` and `DSAvatarGroup` take it. It stands beside the scale and is not a step of it: the scale says how dense a control is, and a scale size says how large a picture is. Each unit holds its own pixels for a step, so one value, given to an icon, a mark and an avatar, draws things that fit together (`RD.SUPPORT.SURFACE.101`).

| Step | Icon | Mark and avatar |
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

- **A mark holds the icon of its own step.** The icon is about half the mark from `XXL` up: a 24px icon in a 48px mark, and a 56px icon in a 96px mark. An avatar of a group takes the pixels of an avatar.
- **From `XS` to `XL` a mark and an avatar are as tall as a control of the size step of the same name.** So a picture with no scale size of its own lines up with the controls beside it. A unit that is given no scale size takes the step that fits its `size`.
- **From `XXL` to `XXL5` an icon is the size of the title of its own step name.** Below `XXL` an icon is equal to its title or a little larger.

## The type steps and icons — ✅

Text is drawn in one of three families, and each family has its steps.

| Family | What its text does | Its steps | Its weight |
| --- | --- | --- | --- |
| Heading | names the whole page, a container or a group, or is the one large line of an expressive page: a number, a price, the line of a hero | `HEADING_XXS` to `HEADING_XXL5`, 14 to 80px | semibold up to `HEADING_MD`, bold from `HEADING_LG` |
| Title | names a widget, a row among others or a small row | `TITLE_XXS` to `TITLE_XXL5`, 10 to 56px | medium |
| Content | is the running text a person reads | `CONTENT_XXS` to `CONTENT_XXL5`, 10 to 36px | regular |

- **Title runs from `TITLE_XXS` to `TITLE_XXL5`, and Heading from `HEADING_XXS` to `HEADING_XXL5`. Content runs to `CONTENT_XXL5`** (`RD.SUPPORT.SURFACE.102`, `RD.SUPPORT.SURFACE.225`). `CONTENT_XXL` to `CONTENT_XXL5` are 20, 24, 28, 32 and 36px with lines of 1.5, 1.45, 1.4, 1.35 and 1.3, each under the Title step of the same name. The steps from `XXL` to `XXL5` carry the names of the larger scale sizes, so a title, an icon, a mark and an avatar of one step name stand together.
- **The Heading scale MUST start at `HEADING_XXS`, 14px, with `HEADING_XS` at 18px and `HEADING_SM` at 22px** (`RD.SUPPORT.SURFACE.142`). Each is semibold. From `HEADING_MD` up the steps keep their sizes on a desktop, so each level of a page has a step for its title.
- **A title and a heading may have the same size, and they then differ by weight.** Both families have a step at 14px, at 18px and from 24 to 56px. Which family a title takes is the level of the page it names (`architecture-components.md`).
- **A website's words are 14px or larger; only data and code shown inside a demo may be smaller** (`RD.SUPPORT.SURFACE.227`). A lead, a caption, a line under tabs, a footer line and a step's description are `CONTENT_MD` or above.
- **A type step sets the size and the weight of a text, and nothing else** (`RD.SUPPORT.SURFACE.103`). Whether a text is a heading of the page is its element, which `DSText` takes through `element`. So a large number in a heading step is not announced as a section unless the page says so. The element of a title comes from the nesting of its boxes, never from its family (`RD.SUPPORT.SURFACE.106`).
- **The steps `HEADING_XXS` to `HEADING_XL` MUST take a line of 1.2 times their size, and `HEADING_XXL` to `HEADING_XXL5` a tighter line of 1.1.** A Title step takes a line of 1.3, and a Content step a line of 1.5.

- **The display steps take smaller sizes on a phone** (`RD.SUPPORT.SURFACE.164`). `HEADING_LG` is 30, `HEADING_XL` 32, `HEADING_XXL` 36, `HEADING_XXL2` 40, `HEADING_XXL3` 44, `HEADING_XXL4` 48 and `HEADING_XXL5` 56px. `TITLE_XXL2` is 26, `TITLE_XXL3` 30, `TITLE_XXL4` 34 and `TITLE_XXL5` 40px. Every step of 28px or less keeps its size, each phone value stands above the step under it, and the titles of an item keep one set of sizes on every device.

The weights are `REGULAR` · `MEDIUM` · `SEMIBOLD` · `BOLD`. A text also carries a tone (`DEFAULT` · `QUIET` · `MUTED` · `SUBTLE` · `INVERSE`), for how strongly it stands out from its surface. A block draws an icon from one closed set, `DSIconType`, with one name for each icon, never a file of its own choosing — the full list of names is declared member by member in the capability chapter. `BUILDING_2`, `MOON`, `PALETTE`, `STORE` and `SUN` are among them.

### The level tokens

A pitch is sized by the level of the page it stands at, and the sizes must not be chosen in code. So each level from `PAGE` to `GROUP` holds one set of tokens, `--level-<level>-<part>`, where the level is written in lower case (`RD.SUPPORT.SURFACE.238`). A unit reads them and a page never does. A theme may change them.

| Token | Holds |
| --- | --- |
| `--level-<level>-title` | the size token of the level's display step, the step the title of a feature is drawn in |
| `--level-<level>-gap` | the gap between the words of a feature: the eyebrow, the title, the description and the facts |
| `--level-<level>-actions-gap` | the room before the actions |
| `--level-<level>-media-gap` | the room between the words and the media |
| `--level-<level>-inset` | the inset of a feature that has a frame |
| `--level-<level>-box` | the side of the square a small picture stands in |

| Level | Display step | On a desktop | On a phone | Gap between the words | Before the actions | Words to media | Inset | Box of a small picture |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `PAGE` | `HEADING_XXL4` | 72px | 48px | 24px | 40px | 64px | 64px | 56px |
| `CONTAINER` | `HEADING_XL` | 40px | 32px | 16px | 32px | 48px | 48px | 48px |
| `WIDGET` | `HEADING_SM` | 22px | 22px | 12px | 24px | 24px | 32px | 44px |
| `GROUP` | `HEADING_XS` | 18px | 18px | 8px | 16px | 16px | 24px | 40px |

- **A unit MUST read the title through the type step.** `--level-<level>-title` names the type step's own size token, which carries its phone value, so the phone size follows with nothing written. A unit that sizes its title by a level token never asks what the device is.
- **A page MUST NOT write a level token.** A level is a position, and a theme that wants another rhythm changes the token once.
- **The words of a feature's points MUST be 14px or larger, with no exception** (`RD.SUPPORT.SURFACE.239`).

## Boundary

This ref names every role, every step of the scale, every scale size, and the family of every type step. It gives none of them a value in the general vocabulary sense beyond what is listed above — the full worked value of every role in light and dark lives in the capability chapter this ref restates. It does not say which block reads which role, or which prop carries a type step — that is `architecture-components.md` and `architecture-names.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.SURFACE.008` | an icon placed beside a title or beside running text takes the scale size of that text's own step name, and the two sit on one centre line |
| `RD.SUPPORT.SURFACE.141` | the neutral shades of the surfaces and the text in light and in dark, and small text a person reads is never subtle |
| `RD.SUPPORT.SURFACE.101` | the pixels an icon, a mark and an avatar are drawn at for each scale size, and a mark holds the icon of its own step |
| `RD.SUPPORT.SURFACE.102` | Title runs to `TITLE_XXL5` and Heading to `HEADING_XXL5`, and Content runs to `CONTENT_XXL5` |
| `RD.SUPPORT.SURFACE.227` | a website's words are 14px or larger, and only data and code shown inside a demo may be smaller |
| `RD.SUPPORT.SURFACE.238` | each level from `PAGE` to `GROUP` holds one set of level tokens, and a unit reads a title through the type step so the phone size follows |
| `RD.SUPPORT.SURFACE.239` | the words of a feature's points are 14px or larger, with no exception |
| `RD.SUPPORT.SURFACE.103` | a type step sets the size and the weight of a text, and its element is a separate property |
| `RD.SUPPORT.SURFACE.142` | the Heading scale starts at `HEADING_XXS`, and the size and line height of its three smallest steps |
| `RD.SUPPORT.SURFACE.143` | the quiet tone stands between the body and the muted tone, and the job of each text tone |
| `RD.SUPPORT.SURFACE.154` | the shades of the variants by strength, in light and in dark |
| `RD.SUPPORT.SURFACE.145` | a ghost or an outline control of the default hue draws the soft fill under the pointer with words and the strong fill when it is icon only |
| `RD.SUPPORT.SURFACE.199` | the surface is one value, a colour and a strength, set by what draws a fill; the tokens are `--surface-*` and the main action reads the fill |
| `RD.SUPPORT.SURFACE.163` | the values of the roles and lines, the divider and the overlay, and the fills of cards, containers and overlays |
| `RD.SUPPORT.SURFACE.164` | the display steps of the Heading and Title scales take smaller values on a phone |
| `RD.SUPPORT.SURFACE.210` | a `PRIMARY` badge on a grey fill, `DEFAULT` at `SUBTLE` or `QUIET`, keeps the brand's own tint and words, the page's |
| `RD.SUPPORT.SURFACE.166` | the description of an item is quiet but for `INLINE`, the subtle tone, muted on a hovered or chosen row, and the outline badge's line |
| `RD.SUPPORT.SURFACE.203` | the theme's temperature of the greys, the brand as a fill parted from the brand as text in dark, and the dark body text one step down |
| `RD.SUPPORT.APPS.152` | the spacing and size scale is a token group beside the roles, and a block reads a role token and the scale, never a ramp step or a number of its own |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
