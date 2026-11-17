<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-patterns/01-common/05-design-languages.md",
      "seen": "a7ceab9d"
    }
  ]
}
-->

# Design Languages — One Look for a Whole Site or App

Source of truth: the foundation's design languages chapter (`docs/04-capabilities/02-support/01-surface/03-standards-patterns/01-common/05-design-languages.md`), a chapter of the Patterns construct. The starting list this ref names is the plugin's own, in `refs/support/surface/design-languages/`.

Read this before you build or review a page of a site, and before you make a design language for an app. The site patterns decide where a section's emphasis goes; the design language decides how it looks, and keeps it the same on every page. With nothing to tie the sections together, each page picks its own backgrounds, frames and pictures, and the pages look like they came from different hands.

## Terms

| Term | What it means |
| --- | --- |
| Design language | a set of choices for a whole site or app, made from the design system's units and tokens; it stands beside the theme and never inside it |
| Guide | the design language in words, a page in the app's own docs, with its references by address and date |
| Data | the same choices as a file in the app's code, which the pages and this plugin read |
| Highlight | the one section of a page whose whole feature stands in one raised frame, in a stage or open form |
| Starting list | the design languages this plugin ships as data with drawn samples, where the agent starts and never what an app keeps unchanged |

## A design language — 🔮

A site or an app follows one design language, and every page reads it before it makes a choice of its own (`RULE.SUPPORT.SURFACE.440` · GUIDE). The theme says which colours and corners; the design language says how the pages are built and how they look and move, so any theme recolours it.

- **An app has its own, because the apps of one repository serve different people.** A hiring product's site, its job portal and its company app each have theirs.
- **Support ships design languages as choices, and never as finished pages.** `architecture-app.md` states why.
- **One that sets a choice changes the look, and one that sets none leaves the site as the site patterns state it.** An app that adopts none keeps its look.

## The parts — 🔮

Five parts, each a group of choices, and each choice names a unit or a token of the design system.

| Part | The choices it holds |
| --- | --- |
| Page templates | for each kind of page, its sections in order and the form of each pattern: the hero beside a product screen or over a backdrop, the proof beside its points or under them |
| Section style | the ground, dark or light; how sections part, by fills, hairlines or space; how emphasis shows, flat, a gradient, a vignette or a highlighted frame; a pattern behind a section, none, dots or lines; edges that fade into the ground |
| Interaction style | what a door or a card does under the pointer, a lift, a glow or a lit edge; how sections arrive on scroll, still, a fade, a rise or a blur that clears; moving parts such as a logo ticker |
| Media style | how a product screen is framed, how a diagram is drawn with its node, line and accent, how photos and illustrations meet the ground, and what stands behind a picture: nothing, a line grid, dots, a soft glow, or the site's own image fading at its edges |
| Density | how much a section says, how long its lines run, and the room a section takes above and below |

- **A backdrop may move, and stands still for a visitor who asked for reduced motion** (`RULE.SUPPORT.SURFACE.444` · MUST · skill:spn-surface/design). The visitor's setting outranks the interaction style, and the backdrop stands still too where the app's own motion setting is off.
- **A site page stands roomier than an app.** An ordinary section stands at `MD` and the hero at `LG` or `XL`; a design language may set it calmer or tighter, and one that sets none keeps `MD`. `architecture-layouts.md` states the prop that carries it.

## How a page is built from it — 🔮

The page is the hero and then a run of sections, in the order of the reader's questions, from the template for its kind of page.

- **Each section takes one emphasis and never two** (`RULE.SUPPORT.SURFACE.438` · GUIDE): the page's ground, its own fill where the kind of reading changes, the emphasis band of the hero or the closing call, or the one highlight. `site-patterns.md` gives the tests.
- **A section holds one feature, or several of one claim.** The page sets them side by side or one under another with layout classes, spaced by the section's own gap; the section itself does not change.
- **The highlight has two forms.** A stage is a frame made for a site, with a large radius, generous room and a lit edge or a soft tint. Open has no frame: the section stands larger with a backdrop behind it. Neither is ever an app's panel look, so a marketing page never reads as the inside of the product.
- **Each section gets its case line** (`RULE.SUPPORT.SURFACE.439` · GUIDE), as `site-patterns.md` states.

## What the design system lacks — 🔮

- **A technique no choice covers is a gap for the design system, and is never styled by hand on a page** (`RULE.SUPPORT.SURFACE.442` · GUIDE). A class written on a unit to get a look is the same gap: the unit lacks a prop, and a partner's agent, which has the design system and this book and never the page's code, cannot rebuild a look a class made. Record the gap; the prop arrives with a default, so a site that sets none keeps its look.

## How one is made — 🔮

1. **Ask who the site or app is for**, and which two or three sites the developer or partner likes and one they dislike. With none, start from the audience and the starting list.
2. **Read those sites live** and name what each does with its ground, its sections, its frames, its motion and its pictures.
3. **Map each technique to a choice** of the five parts; one no choice covers is a gap.
4. **Propose two or three design languages**: the nearest of the starting list and its variations, each drawn on a real stretch of the app in its own brand, at a desktop and a phone, light and dark, side by side.
5. **Record the pick** as a guide page in the app's own docs, with the references by address and date, and as the data file its pages read.

A reference is read in a headless browser with its own profile, never by a fetch alone, because a page's look is made on the screen and not in its source.

- **Outside sites are read and never copied** (`RULE.SUPPORT.SURFACE.441` · MUST · skill:spn-surface/design). No words, pictures, code or branding reach the app; only techniques do, each mapped to a choice of our own. A paid reference service is consulted live when someone asks, and holds no part of the library.

## Each app's guide and data — 🔮

Before any page work on an app, the design skill reads that app's guide and follows it; when a choice changes, the agent changes the guide and the data together. The guide says the pick in plain words so the next person knows why; the data holds the same pick as values, so the pages and this plugin read one answer and never two.

## The starting list — 🔮

The plugin ships these as data with a sample each, in `refs/support/surface/design-languages/`. They are our own, and any theme recolours them.

| Name | The look |
| --- | --- |
| Stone | a dark, calm ground, hairlines parting the sections, one lit highlight and little motion |
| Daylight | a light, warm ground, soft fills, room around each section and an open highlight |
| A dense technical one | a close, quiet ground, more on a screen, lines and a grid behind the diagrams, code and the product up front |

Each suits its own reader: Stone a reader who wants a calm, dark page, Daylight a hiring team that weighs warmer frames, photos and more room, and the dense technical one engineers who weigh product and code.

## What is not checked yet

- **No check reads a page for its design language.** A review reads the page beside the app's guide and its data.

## Boundary

This ref states what a design language is, its five parts, how a page is built from one, how one is made and where an app's guide and data live. It stops at the choices. Where a section's emphasis goes, and the tests and the case line, are `site-patterns.md`. What `DSSiteLayout`, `DSSectionContainer` and `DSFeature` take, prop by prop, is `architecture-layouts.md`, `architecture-containers.md` and `architecture-components.md`. The theme, and that Support ships both, is `architecture-app.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RULE.SUPPORT.SURFACE.438` | a section of a site's page takes one emphasis and never two |
| `RULE.SUPPORT.SURFACE.439` | the agent writes one line for each section, its case |
| `RULE.SUPPORT.SURFACE.440` | a site or an app follows one design language, and every page reads it before it chooses |
| `RULE.SUPPORT.SURFACE.444` | a backdrop that moves stands still for reduced motion and for the app's own motion setting |
| `RULE.SUPPORT.SURFACE.441` | an outside site is read and never copied |
| `RULE.SUPPORT.SURFACE.442` | a technique no choice covers, and a class on a unit, is a gap for the design system |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page beside the app's guide and its data.
