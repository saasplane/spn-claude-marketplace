<!-- RESTATES: spn-foundation docs/04-capabilities/02-support/01-surface/03-standards-patterns/01-common/05-design-languages.md § Where media go · § Media size by placement · § Text alignment and items · 02-support/02-apps/03-module/02-web/README.md § assets beside entry
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- A DESIGN LANGUAGE CAPABILITY CHAPTER, in the capability shape: the places, then what departs from the construct.
     The construct's Model table says which language an app follows; this chapter says where that app keeps it. -->
<!-- spn:doc
{"id": "<app>-capabilities-design-language", "variant": "capability", "title": "{{App}} Design Language", "lenses": ["UX", "WEB_DEV"], "status": "DONE", "realizes": ["design-language"], "summary": "{{One sentence: which language this app follows and where its data and drawings live.}}", "keywords": []}
-->

# {{App}} Design Language

`For: Agent · Web developer` · `Status: ✅ DONE` · `Realizes: Design Language`

{{One paragraph: which language this app follows, by the construct's Model table, and where its data and drawings live.}}

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The data | `src/modules/{{module}}/assets/language/design-language.json` | the language's values, imported |
| A page and its words | `src/modules/{{module}}/entry/ui/pages/<group>/<Name>Page.tsx` and `<Name>Page.data.ts` | the page, with its words beside it |
| Each section's frame | `src/modules/{{module}}/entry/ui/containers/` | the module's containers, on the design system's section container |
| The drawings | `src/modules/{{module}}/assets/drawings/<page>/<name>.svg` and `.css` | imported and drawn inline, tokens only |
| The captures | `public/assets/images/captures/<page>/<name>.png` and `<name>.dark.png` | content images beside `icons/`, resolved through the media seam by path, written by the capture script from the running demo, never by hand; used only where a section is about the live product, and drawn elsewhere |
| The one drawing component | `src/modules/{{module}}/entry/ui/components/SiteDrawing.tsx` | a page imports its own drawings' svg and css from `assets/drawings/<page>/` and renders `<SiteDrawing svg css stillAt />`; there is no central registry, so each lazily loaded route carries only its own drawings |
| Fixed addresses | `public/assets/images/` | `icons/` (the favicon), `media/` (the placeholder and error images) and `captures/` |

`assets/` stands beside `entry/` and is not a layer: imported files (the drawings and the data) live in the package's source tree, content images are resolved from `public/`, and `entry/ui/` holds only its taxonomy. Under `assets/` a folder holds folders or files, never both: grouped by kind first, then by page.

## Layouts this app fills

| Kind | Sections |
| --- | --- |
| Visitor or Learner (a site) | Media size, Alignment and items, Grounds, Drawing kinds, Angles and arrival, Motion, Heroes |
| Team or Everyday users (an app) | Density, Panels, States, Data views, Empty and error states |

## Media sizes

The construct's Media size table, with this app's measured frames. Each size is read from the design system's container that holds it, and a drawing is made for its frame, never scaled from another placement.

| Placement | Frame on desktop | On a phone |
| --- | --- | --- |
| A hero | {{the media column beside the words: width by height, in the stage's width}} | under the words, cropped to its own content |
| Beside the words | {{the feature's split: ratio, gap, width}} | under or over the words, the full width |
| Under the words | {{the content width, lined up with the grid above}} | the full width, redrawn tall where labels would shrink |
| A band of media only | {{the content width}} | the full width |
| A container's ground | {{the container, edge to edge, drawn quiet}} | the same, still quiet |
| An item's picture | {{the item's media box: with a title and a line, with a title alone}} | the same box |

## Alignment and items

The construct's rules for this app: start-aligned is the default; words centre only on a hero or closing call with no medium beside it, a stats band, or one centrepiece medium under a short title and one line; a paragraph or an item grid is never centred.

Where a medium already labels each point, the items go; {{the places this app always keeps its items: the value list near the top, the claims, the closing call}}.

## Special handling

### {{What departs from the construct}}

**Why** — {{one sentence.}}
**What** — {{what differs.}}
**How** — {{the place in the code to read.}}

## Checks

`spn-surface check page <page>` and `spn-surface check module <module>` refuse a hex colour or a hand-written font stack in a drawing; media in the wrong place, such as a scene in a feature or a sheet on a section; a `design-language.json` off its schema; and a construct figure that is out of date.
