<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/12-language-design-language/01-common/01-design-language.md",
      "seen": "180df091"
    }
  ]
}
-->

# Design Languages — One Look for a Whole Site or App

Source of truth: the foundation's design languages chapter (`docs/04-capabilities/02-support/01-surface/12-language-design-language/01-common/01-design-language.md`), a chapter of the Design Language construct, of Surface's Language group. The kinds a language picks from are the Surface Catalogue's, and every product language extends `base`, Surface's own, which this plugin carries in `refs/specs/surface/languages/base/` beside the catalogue's folder.

Read this before you build or review a page of a site, and before you make a design language for an app. The container kinds of a site decide where a section's emphasis goes; the design language decides how it looks, and keeps it the same on every page. With nothing to tie the sections together, each page picks its own backgrounds, frames and pictures, and the pages look like they came from different hands.

## Terms

| Term | What it means |
| --- | --- |
| Design language | a set of choices for a whole site or app, picked from the Surface Catalogue and made from the design system's units and tokens; it stands beside the theme and never inside it |
| Guide | the design language in words, a page in the app's own docs, with its references by address and date |
| Data | the same choices as one folder, `docs/specs/surface/languages/<name>/`: `spdl.json`, with `types.json`, `samples.json`, `data/` and `assets/` once samples are drawn on the product's own records |
| Highlight | the one section of a page whose whole feature stands in one raised frame, in a stage or open form |

## A design language — 🔮

A site or an app follows one design language, and every page reads it before it makes a choice of its own (`RULE.SUPPORT.SURFACE.440` · GUIDE). The theme says which colours and corners; the design language says how the pages are built and how they look and move, so any theme recolours it.

- **One language states a decision for each surface category, because the surfaces of one repository serve different people.** A hiring product's site is a MARKETING category, its careers pages of open jobs a MARKETPLACE, its job portal a PORTAL and its company app a DASHBOARD, each for its own person, and the language names none of the apps.
- **Support ships design languages as choices, and never as finished pages.** `architecture-app.md` states why.
- **One that sets a choice changes the look, and one that sets none leaves the site as the container kinds state it.** An app that adopts none keeps its look.

## The parts — 🔮

A design language is described for each surface category it states, in the same eight parts, in the groups Structure and Style, beside one Shared group. The surface categories are `MARKETING`, `MARKETPLACE` and `RESOURCES` for a site, and `DASHBOARD` and `PORTAL` for an app. Shared holds four parts, Structure holds four and Style holds four, as the Surface Catalogue states, and every choice in the language names a unit or a token of the design system.

| Part | The choices it holds |
| --- | --- |
| **Shared** | Brand, the values every surface takes; Drawing, the scale, the line weights and how blocks meet; Motion, speed and easing; Voice, how the product speaks |
| **Layouts** | The layouts the category takes from the catalogue, and the room a page gets: how much a section says, how long its lines run, and how much room a section takes above and below. Tablet and phone |
| **Pages** | The page kinds it picks, customises or adds, and for each kind of a site its sections in order, or for each kind of an app its arrangement of units |
| **Containers** | The container kinds it picks, customises or adds, and how a section is built: its ground, its two layers and its scene. The form of each kind: the hero beside a product screen or over a backdrop, the proof beside its points or under them |
| **Widgets** | The units inside a container, its cards, items and buttons, and their states and alignment |
| **Theme** | The ground, dark or light. The surfaces and tones, the radius, the frames and the emphasis: flat, a gradient, a vignette or a highlighted frame. Dark mode |
| **Media** | How a product screen is framed, how a diagram is drawn with its node, line and accent, how photos and illustrations meet the ground, what stands behind a picture, and where media go and at what size |
| **Motion** | What a door or a card does under the pointer, how sections arrive on scroll, and the moving parts, such as a logo ticker |
| **Words** | How long each piece of text runs, and how big it is |

The groups and parts are the language's outline and the outline of its samples. A part or a category the language does not use says so in one line, and is never left out.

- **A language is described for each surface category it states, in the same eight parts, in the groups Structure and Style, beside one Shared group.** An agent finds a choice at the same heading in every language, a partner's included. A category is described under `categories`, in one decision for each part, in the spec format of the blank template a partner starts from.
- **A language works on each part's kinds with three verbs: pick, customise and add.** Customising never changes a kind's meaning, an added kind or case is built from units and never reuses a code or changes the kind's reason, and the floor is never customised: the standard pages, and the task and flow patterns. A language gives a page kind another case with a customised `order`, and adds a case to a catalogue kind with `{ "to": …, "case": … }`. A `pick` is `ALL`, a list of `KIND` and `KIND.CASE` codes, or an object of kinds each with a list of cases or `ALL`, and `customise` and `notUsed` may name a `KIND.CASE`. A kind named with no case takes the cases the language it extends picked. The spec mirrors the catalogue key for key, so a script can check a spec against the catalogue.
- **A child language states only what it sets differently.** It names its parent, `extends: "base"`, and keys what it sets by surface category. Every part it does not state is INHERITED, and a parent never lists its children.
- **Each part carries a fixed id and its source.** The id, such as `categories.MARKETING.THEME`, stays when a heading's words change, so a tool or an agent finds the part by its id. The source, OWN, INHERITED or NONE, says whether the language set the choice, took it from its parent or the design system, or uses none, so a blank is never read as a decision.
- **One language covers every surface category of the platform, and it depends on no app and names none.** A web app names its language in its `spsurface.json` and keeps the themes written from it in `src/spn.surface.json`, and its platform, Web or Native, is a separate axis, so a native app keeps the same two files where its own code reads data, under the same brand.
- **An app uses the language and never forks it.** Its capability chapter says how that app fills a part, by the part's id, and holds only the values where it differs, part by part. The brand is never changed by an app.
- **The language's values are one spec file, keyed by the parts' ids, and its page draws them.** The page's generated section is written from that file and never by hand, so the words and the values cannot drift apart.
- **A language's own samples stand beside it, and generated site samples are another thing.** A language's own samples show each of its choices, one specimen for each kind of each part of each surface category, at `docs/artifacts/public/surface/<language>/`, built from the app's own media files. A sample page's title never ends in "Design Language", which the reader of a language's theme refuses.
- **No part holds a pointer in place of its rule, and a part with nothing of the app's own names the design system's default it follows** (`RULE.SUPPORT.SURFACE.590` · MUST · skill:spn-surface/design). A part the language sets holds the choice; one it leaves to the design system has the status `DEFAULT` and names the default; one it does not use has `NONE`. `spn-surface language check` refuses a part whose words are a pointer alone, such as *Decided in the hiring arc.*
- **A sample page draws each drawing in a frame that scales it whole and carries the app's own tokens** (`RULE.SUPPORT.SURFACE.591` · MUST · skill:spn-surface/design). A drawing placed at a width of its own making with no token map draws black fills and overlapping units.
- **A review of a site, and an arc's final re-check of one, walks every page of the live site at a phone, a tablet and a desktop width, in light and dark, by computed values** (`RULE.SUPPORT.SURFACE.592` · MUST · skill:spn-surface/design), with `skills/design/scripts/site-walk.mjs`.
- **A reference site is read into the same parts.** One reference read for each site, written from the reference template, records part by part what the site does, the values measured from it, our choice, and whether that choice is MAPPED, a GAP in the design system or NOT_TAKEN. The construct's references compare each site with the language part by part.

- **A backdrop may move, and stands still for a visitor who asked for reduced motion** (`RULE.SUPPORT.SURFACE.444` · MUST · skill:spn-surface/design). The visitor's setting outranks the interaction style, and the backdrop stands still too where the app's own motion setting is off.
- **A site page stands roomier than an app.** An ordinary section stands at `MD` and the hero at `LG` or `XL`; a design language may set it calmer or tighter, and one that sets none keeps `MD`. `architecture-layouts.md` states the prop that carries it.

## The drawing scale — 🔮

A design language fills one drawing scale of tokens. SaaS Plane's values are the defaults a language starts from and may change; the book's chapter holds them. Each part of the scale applies to some kinds of medium and not others.

| Part of the scale | Applies to |
| --- | --- |
| Text levels: label, name, detail | any words placed on media: a drawing's labels, callouts on a screenshot, a chart's axis labels, a caption inside a picture |
| Steps by placement: S, M, L | every kind of medium |
| Shape and shadow | every framed medium: a tile, a photo's frame, a product screen |
| Lines: weights, styles, colours | drawn media, and lines drawn over other media |
| Spacing, tile forms, alignment, how blocks meet | drawn media only |

- **A design language fills one drawing scale, and every medium in it takes the parts of that scale that apply to its kind** (`RULE.SUPPORT.SURFACE.536` · MUST · skill:spn-surface/design)
- **A language that uses no drawn media says so in its construct, and skips the parts that apply to drawn media only** (`RULE.SUPPORT.SURFACE.537` · MUST · skill:spn-surface/design)
- **A medium takes one step of the scale by where it sits: S in a card, M in a section and in every docs figure, L in a hero** (`RULE.SUPPORT.SURFACE.538` · MUST · skill:spn-surface/design)
- **Words placed on media have three levels, label, name and detail, and never a fourth, and no word renders below 9px** (`RULE.SUPPORT.SURFACE.539` · MUST · skill:spn-surface/design)
- **Text never shrinks to fit: a medium that only fits with smaller words changes its form or is cut to its subject, and each medium is made at 1:1 for its frame** (`RULE.SUPPORT.SURFACE.540` · MUST · skill:spn-surface/design)
- **Every framed medium takes the scale's radius and the scale's one small shadow, a tile and a photo's frame and a product screen alike, and dark mode has no shadow** (`RULE.SUPPORT.SURFACE.541` · MUST · skill:spn-surface/design)
- **A line in a drawn medium, or drawn over another medium, has one of three weights, detail, line and focus, and one of three styles: solid; dashed for a reply, an inactive unit or a slot you fill; dotted for a guide or a boundary** (`RULE.SUPPORT.SURFACE.542` · MUST · skill:spn-surface/design)
- **A line's colour is a role token, and a line never takes opacity** (`RULE.SUPPORT.SURFACE.543` · MUST · skill:spn-surface/design)
- **A dashed line takes the muted text colour, the token `--draw-dash-color`** (`RULE.SUPPORT.SURFACE.550` · MUST · skill:spn-surface/design)
- **A dotted line takes the accent, mixed into the ground at 24% in SaaS Plane's defaults, the token `--draw-dot-color`** (`RULE.SUPPORT.SURFACE.551` · MUST · skill:spn-surface/design)
- **A dotted line comes in two strengths: a guide, at weight 0.75 in the accent at 24%, and a boundary that holds parts, at weight 1 with round ends in the accent at 45% in light and 55% in dark, the token `--draw-dot-strong-color`; a line's style sets its pattern, its weight its thickness (a dotted line's dot size) and its role its colour, and a dotted line that must be seen is never below weight 1** (`RULE.SUPPORT.SURFACE.570` · MUST · skill:spn-surface/design)
- **The lines of an illustration, a scene's ground, a desk or a person, are not wires, and they take the ink at full, at the weight the scene is drawn in** (`RULE.SUPPORT.SURFACE.552` · MUST · skill:spn-surface/design)
- **A drawn medium takes its spacing from the scale, inside a tile, between tiles, inside a plate, between plates, from a wire to its label, between parallel wires, at a bend and at the frame margin, and a tile takes the inline or the stacked form** (`RULE.SUPPORT.SURFACE.544` · MUST · skill:spn-surface/design)
- **Every edge and baseline of a drawn medium sits on a 4 grid: tiles in a row share their top and height, tiles in a column share their left edge, a wire runs straight between aligned centres, and no wire crosses a wire** (`RULE.SUPPORT.SURFACE.545` · MUST · skill:spn-surface/design)
- **The floors of a stack stand 12 apart, closer than two separate plates, and they never touch** (`RULE.SUPPORT.SURFACE.553` · MUST · skill:spn-surface/design)
- **A row's tiles share their plate's width: one tile spans it, two take half each and three take a third** (`RULE.SUPPORT.SURFACE.554` · MUST · skill:spn-surface/design)
- **A caption under a plate is a detail line, set 8 below the plate's edge, and never a fourth text level** (`RULE.SUPPORT.SURFACE.555` · MUST · skill:spn-surface/design)
- **In a drawn medium a wire ends at the middle of the facing edge of the unit it joins, a wire's label stands clear of its wire, and a plate's name lies inside its plate** (`RULE.SUPPORT.SURFACE.546` · MUST · skill:spn-surface/design)
- **In a drawn medium words keep their inset inside every box and no edge or line crosses them, a glyph and its words share one middle, one short line stands under a name, and code is real code** (`RULE.SUPPORT.SURFACE.547` · MUST · skill:spn-surface/design)
- **Each media kind's record states its frame for each placement, and how the scale's shared parts apply to it** (`RULE.SUPPORT.SURFACE.548` · MUST · skill:spn-surface/design)

Before a medium is made, pick the step from its placement and read the language's tokens for it. SaaS Plane's defaults: label 9, 9.5 and 10.5, name 11, 12 and 14, detail 9.5, 10 and 11.5, for S, M and L; line weights 0.75, 1 and 1.25; spaces on a 4 grid.

## How a page is built from it — 🔮

The page of a site is the hero and then a run of sections, in the order of the reader's questions, from the sections its page kind lists (`site-patterns.md`).

- **Each section takes one emphasis and never two** (`RULE.SUPPORT.SURFACE.438` · GUIDE): the page's ground, its own fill where the kind of reading changes, the emphasis band of the hero or the closing call, or the one highlight. `site-patterns.md` gives the tests, as the container kinds' what-holds-across states.
- **A section holds one feature, or several of one claim.** The page sets them side by side or one under another with layout classes, spaced by the section's own gap; the section itself does not change.
- **The highlight has two forms.** A stage is a frame made for a site, with a large radius, generous room and a lit edge or a soft tint. Open has no frame: the section stands larger with a backdrop behind it. Neither is ever an app's panel look, so a marketing page never reads as the inside of the product.
- **A section that opens onto a group leads with the group's own link, Explore and its name, and a deeper page or the demo comes second** (`RULE.SUPPORT.SURFACE.556` · MUST · skill:spn-surface/design)
- **Each section gets its case line** (`RULE.SUPPORT.SURFACE.439` · GUIDE), as `site-patterns.md` states.

## What the design system lacks — 🔮

- **A technique no choice covers is a gap for the design system, and is never styled by hand on a page** (`RULE.SUPPORT.SURFACE.442` · GUIDE). A class written on a unit to get a look is the same gap: the unit lacks a prop, and a partner's agent, which has the design system and this book and never the page's code, cannot rebuild a look a class made. Record the gap; the prop arrives with a default, so a site that sets none keeps its look.

## How one is made — 🔮

1. **Ask who the site or app is for**, and which two or three sites the developer or partner likes and one they dislike. With none, start from the audience and `base`.
2. **Read those sites live** and name what each does with its ground, its sections, its frames, its motion and its pictures.
3. **Map each technique to a choice** of the parts; one no choice covers is a gap.
4. **Propose two or three design languages**, each extending `base`, each a different answer to the references, each drawn on a real stretch of the app in its own brand, at a desktop and a phone, light and dark, side by side.
5. **Record the pick** in the repository's design language, under the surface category it is for, with the references by address and date, and in the app's `src/spn.surface.json`, which the agent writes from it.

A reference is read in a headless browser with its own profile, never by a fetch alone, because a page's look is made on the screen and not in its source.

- **Outside sites are read and never copied** (`RULE.SUPPORT.SURFACE.441` · MUST · skill:spn-surface/design). No words, pictures, code or branding reach the app; only techniques do, each mapped to a choice of our own. A paid reference service is consulted live when someone asks, and holds no part of the library.

## Made in rounds, with media kinds — 🔮

A design language is kept as the platform's construct, and each app's capability chapter says how that app fills it. The construct records only the decisions; the rounds that led to them are kept beside it, so the next partner's language is made the same way.

- **An agent reads the platform's design language construct and the app's capability chapter before it draws a page or a picture** (`RULE.SUPPORT.SURFACE.525` · MUST · skill:spn-surface/design). It reads the language's page, which draws the whole spec, and the app's chapter, because the page holds the brand and each surface category's decisions and the chapter holds how the app fills them.
- **Intake records what the partner shares**: each reference by address and date, each brand file, and each media kind.
- **Each round shows options on real pages**, the running app or its worktree in the partner's brand values, and records its pick.
- **A language records each media kind it uses**: line drawings (`ART_DRAWING`), illustration, product views (`VIEW_PRODUCT`, drawn or captured), photography, icons and marks (`ICON_MARK`), data and numbers (`DATA_CHART`), motion and video (`MOTION_VIDEO`), 3D. For each, where it comes from (made, supplied, licensed, captured), its treatment, the tokens it reads, where it goes, its tablet and phone forms, its files, and its rights and alt text.
- **Each platform keeps one brand, and each of its apps keeps its own design language.** An app changes only its looks over the brand, and an account's own branding comes last, at run time. The order: the design system's defaults, the platform's brand, the looks of the page's surface category, the account's branding.

## The media kinds, by the scale — 🔮

Each kind's record states its frame for each placement and the parts of the scale it takes. Photography: an aspect ratio per placement, its crop and grade, a frame at the scale's radius and shadow, and no words baked into the image. A product screenshot: captured at 2x, framed at the scale's radius, callouts on the scale's text and lines. A drawing: the whole scale.

## Where media go — 🔮

| Media | Placed on |
| --- | --- |
| A hero scene, through the section's background, its `mediaNode`, edge to edge | the section |
| A close-up or a sheet, through the feature's media | the feature |
| A small picture, through the item's media | the item |

- **A medium is placed on the section, the feature or the item that its size fits, and its colours are the design system's tokens** (`RULE.SUPPORT.SURFACE.526` · MUST · skill:spn-surface/design).
- **A hero form is the one its media calls for**: a scene is `BACKDROP`, one picture `SPLIT_END`, and a wide picture or two panes `MEDIA_BOTTOM`.
- **A drawing takes its colours from the design system's tokens and mixes of them, never a raw colour**, so any brand's theme recolours it. An icon comes from the app's own lucide set only.
- **A module holds `assets/` and `entry/` and nothing else.** Under `assets/` a folder holds folders or files, never both, grouped by kind first and then by page.

### A section's two layers — 🔮

A section has two layers, and they are separate. The section's background is nothing, a pattern such as dots (its `pattern`), or a scene edge to edge (its `mediaNode`). The feature's own media stands beside, under or over its words. A section may use both. Three questions say which layer a medium takes: if words or items point at it, so it must be read, it is the feature's; if it is a place or a surface the words stand on, it is the section's; if it belongs to one item, it is the item's.

| Kind of section | The section's background | The feature's media |
| --- | --- | --- |
| A landing hero | a scene, edge to edge, or none | none while a scene stands behind it, else a drawing beside the words |
| A sub-page hero | none or dots | the page's drawing beside the words |
| A section making a claim | none or dots | a drawing beside or under the words |
| Items with a picture | none | a drawing beside the items, and each item's own small picture |
| A grid or stats | none or dots | none |
| A quote | none | none, or one picture of the person |
| A demo | none or dots | the product view under the words |
| A closing call | none or dots | none |

- **A section's background and its feature's media are two layers, and a section may use both together** (`RULE.SUPPORT.SURFACE.557` · MUST · skill:spn-surface/design)
- **A medium takes the layer that the three questions give it** (`RULE.SUPPORT.SURFACE.558` · MUST · skill:spn-surface/design)
- **A page has at most one scene** (`RULE.SUPPORT.SURFACE.559` · MUST · skill:spn-surface/design)
- **A scene never stands behind a section whose feature also has media** (`RULE.SUPPORT.SURFACE.560` · MUST · skill:spn-surface/design)
- **On a phone a section's scene moves under the words** (`RULE.SUPPORT.SURFACE.561` · MUST · skill:spn-surface/design)

A scene is drawn at 1:1 and never stretched, and its land runs past the content box on both sides, to 2560 in SaaS Plane's defaults, fading at its ends.

- **A section's scene is drawn at 1:1 and never stretched, and its land runs past the content box to the widest window the layout serves, fading at its far ends** (`RULE.SUPPORT.SURFACE.562` · MUST · skill:spn-surface/design)
- **A scene's subjects stand inside the content box** (`RULE.SUPPORT.SURFACE.563` · MUST · skill:spn-surface/design)
- **The section keeps the scene's height under its words, so the words and the actions stand in the sky** (`RULE.SUPPORT.SURFACE.564` · MUST · skill:spn-surface/design)

## Media size by placement — 🔮

A medium's size follows where it is placed. **Each size is read from the design system's container that holds it, and a drawing is made for its frame, never scaled from another placement** (`RULE.SUPPORT.SURFACE.527` · MUST · skill:spn-surface/design).

| Placement | The frame |
| --- | --- |
| A hero | the media column beside the words |
| Beside the words | the feature's split |
| Under the words | the section's content width, lined up with the grid or items above it; never a side-sized drawing centred in an empty band |
| A band of media only | the content width |
| A container's ground | the container, edge to edge, drawn quiet |
| An item's picture | the item's media box |

- **A drawing beside the words stays legible at the narrowest column it stands in, the column at 1024 px** (`RULE.SUPPORT.SURFACE.589` · MUST · skill:spn-surface/design). A drawing whose smallest text renders under 11 px there, or whose scale falls below half, is redrawn for that column.
- **A drawing is never cut: it fits its frame whole, on its ground, and only empty sky is trimmed** (`RULE.SUPPORT.SURFACE.565` · MUST · skill:spn-surface/design)
- **A screenshot inside a drawn window crops to the top of its page** (`RULE.SUPPORT.SURFACE.566` · MUST · skill:spn-surface/design)

## Text alignment and items — 🔮

Text is start-aligned by default, set per container kind. It is centred only for short framing with no medium beside it, or with one centrepiece medium under it; a paragraph and an item grid are never centred.

- **A claim has one carrier, either its items or the medium's labels** (`RULE.SUPPORT.SURFACE.528` · MUST · skill:spn-surface/design). Where a medium already labels each point the items go; items stay where a reader scans to decide: the value list near the top, the claims and the closing call.

### Items with a medium — 🔮

Where a section's items stand beside a medium, the kind of items decides the form. The words stand across the section, the items at the start beside the medium, and the medium is centred on the items.

- **A list of steps or layers stands beside its drawing, numbered and in the drawing's order; where the drawing already labels each step, the items go (`RULE.SUPPORT.SURFACE.528` · MUST · skill:spn-surface/design)** (`RULE.SUPPORT.SURFACE.567` · MUST · skill:spn-surface/design)
- **A list of doors stands beside the group's picture** (`RULE.SUPPORT.SURFACE.568` · MUST · skill:spn-surface/design)
- **A grid of peers takes no drawing beside it** (`RULE.SUPPORT.SURFACE.569` · MUST · skill:spn-surface/design)

## One source for the platform's look — 🔮

Before any page work on an app, the design skill reads the repository's design language and follows it. The design language is the one source of its platform's look, for the apps and for the agent, so a page, a picture and a theme all read one answer and never two.

| What | Where | Who reads it |
| --- | --- | --- |
| **The design language**, the brand once and the decisions of each surface category | a language folder in the repository's own docs, `docs/specs/surface/languages/<name>/`, drawn as a construct page | a person, to know why an app looks as it does, and the agent, before it draws |
| **The app's themes**, the same choices as values: the brand once, `main`, and the looks of each surface category the app serves | `src/spn.surface.json`, written from the language its `spsurface.json` names | the app's code, each page through the category of its route group, `spnutils` and the agent |
| **The app's own stylesheet**, where the app gives one | the app's code, never written from the design language in this release | a page that shows the render's HTML, beside the design system's stylesheet and the render's theme config |

The design language holds the brand once: the primary colour, the greys and the typefaces. It holds the decisions of each surface category: the layouts the category picks from the catalogue, as pointers to the app's layout setting, and its looks: mode, size, motion, radius, body, navigation, frames, card and table. The layout stays the app's own setting and is never copied into a look.

- **The repository's design language is the one source of its platform's look, and it holds the brand once and the decisions of each surface category, and it names no app** (`RULE.SUPPORT.SURFACE.571` · MUST · skill:spn-surface/design). The apps and the agent read it for a page, so no app keeps a second answer to a question the design language has already settled; an app names its language in its `spsurface.json`.
- **Each web app keeps its themes as data in `src/spn.surface.json`, and the agent writes them from the language in the same arc as any change to the language** (`RULE.SUPPORT.SURFACE.572` · MUST · skill:spn-surface/design). The language is the source and the file is its copy, so the two move together in one arc and never apart. The file is never edited by hand.
- **An app's theme and the language it names agree** (`RULE.SUPPORT.SURFACE.573` · GUIDE). The check that refuses an app out of step is the one the next rule states.
- **An app with its theme in code keeps it until it moves to `src/spn.surface.json`** (`RULE.SUPPORT.SURFACE.574` · GUIDE). Guide 43 moves an app from `SITE_THEME`, `APP_THEME` or `APP_THEMES` in `src/theme.ts`; the apps move one at a time, and no app is changed only to match.
- **A theme is layered in one order: the defaults, then the brand, then the looks of the page's surface category, then an account's branding** (`RULE.SUPPORT.SURFACE.575` · MUST · skill:spn-surface/design). Each layer sets only what it holds, so an account's branding changes colours and never the looks of a category, and a page whose route group names no category takes the looks of the app's main one.
- **A design language stands beside the theme: it holds a platform's looks and never the brand of another platform** (`RULE.SUPPORT.SURFACE.576` · GUIDE). A partner's brand is the partner's design language, and an app that serves two platforms names a language for each.
- **`spnutils apps surface theme <app>` refuses an app whose themes are out of step with the language it names** (`RULE.SUPPORT.SURFACE.577` · MUST · skill:spn-surface/design). It reads the language the app's `spsurface.json` names, resolved as rule 640 orders, takes the brand and the Theme part of each surface category from it, and reads the app's `src/spn.surface.json` against them, naming each value that differs, the app's and the language's side by side, category by category. It writes no file, and it refuses an app with no `spsurface.json`, a language that does not resolve, or a `src/spn.surface.json` its contract state refuses.
- **A language is written as one spec file, and its page draws the whole spec as one generated section** (`RULE.SUPPORT.SURFACE.578` · MUST · skill:spn-surface/design). The file holds the brand in Shared and each surface category's values, so the people who read the page, the theme check and the page render all read one answer. The page is written from the file and never by hand, and the spec template shows the form.
- **A web app names its language in `spsurface.json` and keeps its themes in `src/spn.surface.json`: the brand once, `main`, and each category's full look; the scaffold writes both** (`RULE.SUPPORT.SURFACE.586` · MUST · skill:spn-surface/design). `spsurface.json` is `{ "mtype": "APP_WEB", "language": "<name>" }` and nothing else, and a web module's is `{ "mtype": "MODULE_WEB", "language": "<name>" }`; an app-owned module takes its app's language and has neither. One app may serve several categories: saasplane.ai serves `MARKETING` pages and a `RESOURCES` docs section, and a console serves `DASHBOARD` pages and a person's own `PORTAL` pages. `themes.categories` holds the look of each category the app serves, laid over `themes.brand`, and `main` is the category of a page whose route group names none. A category's family follows from the category, so no file names a family. The language holds no row for an app: which categories an app serves is its themes', and its routes and menu are its code's. The shape is the contract's `SPSurfaceNodeData`, and the design system reads it as `IDSAppThemes`. A partner's design language starts on day 0 from the blank template, its brand asked in the foundation workstream's surface round.
- **A page that shows a render links the design system's stylesheet and the theme config generated from a resolved language, and an app's own stylesheet only where the app gives one** (`RULE.SUPPORT.SURFACE.595` · MUST · skill:spn-surface/design). A page showing a render links `design-system.css`; the language's look reaches it through the generated theme config, and the app's through its own stylesheet and its `src/spn.surface.json`, written from the language its `spsurface.json` names. Nothing writes a stylesheet from the design language in this release, so a language never adds a token and a page never carries a third copy of the app's values.
- **Layout type is the app's layout setting and never a theme value** (`RULE.SUPPORT.SURFACE.139` · MUST · skill:spn-surface/design). A language's Layouts part points at the app's layout setting and never copies it into a look.

## The language folder — 🔮

A language is one folder, and only `spdl.json` is required: a look alone is `spdl.json`, and the other files come when a design asks for samples drawn on the product's own records (`RULE.SUPPORT.SURFACE.628` · MUST · skill:spn-surface/design).

| File | Holds |
| --- | --- |
| `spdl.json` | the language's choices; its `name` matches its folder, and `extends` names its parent alone |
| `types.json` | each record type: its `file`, `medium`, `roles`, `required` fields, what is `derived` and the pages it is `neededBy`; a type a module's state defines, such as `IAM.Principal`, takes that state's field names |
| `samples.json` | each category's `person`, `navigation`, `words`, `pages` (the `record` each shows and, in an app, `as` whom) and `flows` |
| `data/` | `index.json`, then one `{ type, records }` file for each kind of record; `categories.json`, `orgs.json`, `people.json` and `members.json` hold the tenancy |
| `assets/` | `brand/`, `pictures/<type>/<key>.webp`, `drawings/` and `sources.json`, the source and licence of each file |

`spn-surface language resolve <name>` finds a language live, in one order: the repository's own, then an installed package's (`spnutils apps installed`), then the `base` this plugin carries, and prints each step (`RULE.SUPPORT.SURFACE.640` · MUST · skill:spn-surface/design). `spn-surface language check <name>` reads the whole folder against its contract states and the catalogue, and `spn-surface language diff <name>` refuses a break against the chain at the branch's base.

## What is not checked yet

- **`spn-surface check page` refuses what it can read in a spec**: a raw colour in a drawing, a class on a unit, an icon outside the app's lucide set, a hero form its media does not call for, two emphases in a section, media on the wrong level, and a drawing under the words narrower than its section's content. `spn-surface check module` refuses a folder outside a module's taxonomy.
- **No check reads a medium against the drawing scale yet**: text sizes, line weights and styles, a frame's radius and shadow, and spacing off the scale go to a review.
- **The rest of a page's design language is read by a review**, beside the design language and the app's `src/spn.surface.json`.
- **The theme check reads the values `src/spn.surface.json` and the language it names share, and no more** (`RULE.SUPPORT.SURFACE.577` · MUST · skill:spn-surface/design): the rest of the language's looks are read by a review.

## Boundary

This ref states what a design language is, its parts by surface category, how a page is built from one, how one is made and where the platform's look and each app's theme live. It stops at the choices. Where a section's emphasis goes, and the tests and the case line, are `site-patterns.md`. What `DSSitePage`, `DSSectionContainer` and `DSFeature` take, prop by prop, is `architecture-layouts.md`, `architecture-containers.md` and `architecture-components.md`. The theme, and that Support ships both, is `architecture-app.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RULE.SUPPORT.SURFACE.438` | a section of a site's page takes one emphasis and never two |
| `RULE.SUPPORT.SURFACE.439` | the agent writes one line for each section, its case |
| `RULE.SUPPORT.SURFACE.440` | a site or an app follows one design language, and every page reads it before it chooses |
| `RULE.SUPPORT.SURFACE.444` | a backdrop that moves stands still for reduced motion and for the app's own motion setting |
| `RULE.SUPPORT.SURFACE.441` | an outside site is read and never copied |
| `RULE.SUPPORT.SURFACE.442` | a technique no choice covers, and a class on a unit, is a gap for the design system |
| `RULE.SUPPORT.SURFACE.525` | an agent reads the platform's design language page and the app's capability chapter before it draws |
| `RULE.SUPPORT.SURFACE.526` | a medium is placed on the level its size fits, in the design system's tokens |
| `RULE.SUPPORT.SURFACE.527` | a medium's size is read from the container that holds it, and drawn for its frame |
| `RULE.SUPPORT.SURFACE.528` | a claim has one carrier, its items or the medium's labels |
| `RULE.SUPPORT.SURFACE.536` | a language fills one drawing scale, and each medium takes the parts that apply to its kind |
| `RULE.SUPPORT.SURFACE.537` | a language with no drawn media says so and skips the drawn-only parts |
| `RULE.SUPPORT.SURFACE.538` | a medium takes its step from its placement: S in a card, M in a section and a docs figure, L in a hero |
| `RULE.SUPPORT.SURFACE.539` | words on media have three levels and none below 9px |
| `RULE.SUPPORT.SURFACE.540` | text never shrinks to fit, and each medium is made at 1:1 for its frame |
| `RULE.SUPPORT.SURFACE.541` | a framed medium takes the scale's radius and one shadow, none in dark |
| `RULE.SUPPORT.SURFACE.542` | lines have three weights and three styles |
| `RULE.SUPPORT.SURFACE.543` | a line's colour is a role token, with no opacity |
| `RULE.SUPPORT.SURFACE.544` | a drawn medium's spacing comes from the scale |
| `RULE.SUPPORT.SURFACE.545` | a drawn medium sits on a 4 grid, aligned, with no wire crossing a wire |
| `RULE.SUPPORT.SURFACE.546` | a wire ends mid-edge, its label clear, a plate's name inside it |
| `RULE.SUPPORT.SURFACE.547` | words 12 from a tile edge, one short line under a name, real code |
| `RULE.SUPPORT.SURFACE.548` | each media kind's record states its frame per placement and the scale parts it takes |
| `RULE.SUPPORT.SURFACE.550` | a dashed line takes the muted colour, `--draw-dash-color` |
| `RULE.SUPPORT.SURFACE.551` | a dotted line takes the accent at 24%, `--draw-dot-color` |
| `RULE.SUPPORT.SURFACE.552` | an illustration's lines take the ink at full and are not wires |
| `RULE.SUPPORT.SURFACE.553` | the floors of a stack stand 12 apart and never touch |
| `RULE.SUPPORT.SURFACE.554` | a row's tiles share their plate's width |
| `RULE.SUPPORT.SURFACE.555` | a caption under a plate is a detail line, 8 below its edge |
| `RULE.SUPPORT.SURFACE.556` | a section that opens onto a group leads with the group's own link |
| `RULE.SUPPORT.SURFACE.557` | a section's background and its feature's media are two layers, used together or apart |
| `RULE.SUPPORT.SURFACE.558` | a medium takes the layer the three questions give it |
| `RULE.SUPPORT.SURFACE.559` | a page has at most one scene |
| `RULE.SUPPORT.SURFACE.560` | no scene behind a section whose feature has media |
| `RULE.SUPPORT.SURFACE.561` | on a phone a section's scene moves under the words |
| `RULE.SUPPORT.SURFACE.562` | a scene is drawn at 1:1, its land running past the content box |
| `RULE.SUPPORT.SURFACE.563` | a scene's subjects stand inside the content box |
| `RULE.SUPPORT.SURFACE.564` | the section keeps the scene's height under its words |
| `RULE.SUPPORT.SURFACE.565` | a drawing is never cut; only empty sky is trimmed |
| `RULE.SUPPORT.SURFACE.566` | a screenshot in a drawn window crops to the top of its page |
| `RULE.SUPPORT.SURFACE.567` | steps or layers stand beside their drawing, numbered in its order |
| `RULE.SUPPORT.SURFACE.568` | doors stand beside the group's picture |
| `RULE.SUPPORT.SURFACE.569` | a grid of peers takes no drawing beside it |
| `RULE.SUPPORT.SURFACE.570` | a dotted line has two strengths, guide and boundary, and never goes below weight 1 where it must be seen |
| `RULE.SUPPORT.SURFACE.571` | the repository's design language is the one source of its platform's look: the brand once, the decisions of each surface category, and it names no app |
| `RULE.SUPPORT.SURFACE.572` | each web app keeps its themes as data in `src/spn.surface.json`, written by the agent in the same arc as a language change |
| `RULE.SUPPORT.SURFACE.573` | an app's theme and the language it names agree; the theme check refuses one out of step |
| `RULE.SUPPORT.SURFACE.574` | an app with its theme in code keeps it until it moves to `src/spn.surface.json` |
| `RULE.SUPPORT.SURFACE.575` | a theme is layered: defaults, brand, the looks of the page's surface category, an account's branding |
| `RULE.SUPPORT.SURFACE.576` | a design language holds a platform's looks and never the brand of another platform |
| `RULE.SUPPORT.SURFACE.577` | `spnutils apps surface theme <app>` refuses an app whose themes are out of step with the language its `spsurface.json` names |
| `RULE.SUPPORT.SURFACE.578` | a language is one spec file, and its page draws the whole spec as one generated section |
| `RULE.SUPPORT.SURFACE.586` | a web app names its language in `spsurface.json` and keeps its themes in `src/spn.surface.json`, the brand once, `main` and each category's look; the scaffold writes both |
| `RULE.SUPPORT.SURFACE.595` | a page that shows a render links the design system's stylesheet and the theme config generated from a resolved language, and an app's own stylesheet only where the app gives one |
| `RULE.SUPPORT.SURFACE.139` | layout type is the app's layout setting and never a theme value |

## Proof

`spn-surface check page` and `spn-surface check module` prove the refusals listed above, and `spnutils apps surface theme <app>` proves an app's `src/spn.surface.json` against the language it names. `spn-surface language check` proves a language's folder. A review applies the rest by reading the page beside the design language.
