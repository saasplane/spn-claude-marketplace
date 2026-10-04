<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/12-delivery-showcase.md",
      "seen": "458018e0"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/12-delivery-showcase/",
      "seen": "d5cac44f"
    }
  ]
}
-->

# Delivery Showcase — The Proof Every Realization Delivers

Source of truth: the foundation's Delivery Showcase construct (`docs/02-constructs/02-support/03-surface/12-delivery-showcase.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/12-delivery-showcase/`). Delivery Showcase is the twelfth of thirteen Surface constructs.

Read this before you add a unit to a showcase, or before you judge whether one is complete. A stack that realizes Surface proves it with a showcase: a running catalogue that shows every unit as it really draws, like the web's Storybook. The constructs decide how the showcase is arranged; every stack follows the same outline with its own tool — Storybook on the web, a showcase app on native. **The thing to unlearn: a showcase is not a demo app a team keeps as it pleases.** It is a checked structure, and a stack builds the pages, never an outline of its own.

## The rule — 🔮

1. A showcase is a list of groups, in one order. A group holds pages, or units, or both. A group of units opens with its Overview page.
2. A unit is a component, a widget, a container or a layout. Every unit has two pages: its Overview, which explains it whole, and its Playground, where every prop is a control.
3. An Overview is made of sections, taken from six fixed names, in one order. A section has tabs, and a tab is a preview with its code.
4. A unit has a category. The category decides which sections its Overview has, and which frame draws a section.
5. A unit's own dimension is a tab of the section that its kind of choice belongs to. It never makes a section of its own.
6. A unit whose uses would overwhelm one page has a page for each use, after its Playground.
7. The code of a sample is shown in full, and is never cut.

## Terms

| Term | What it means |
| --- | --- |
| Showcase | a running catalogue that shows every unit as it really draws |
| Group | one part of the showcase's navigation, such as Welcome, Core or Component - Actions |
| Unit | one component, widget, container or layout of the library |
| Page | one entry of the navigation, under a group or under a unit |
| Overview | the first page of a group of units, and the first page of a unit |
| Playground | the page of a unit where every prop is a control |
| Section | one named part of a unit's Overview: Usage, Sizes, Variants, States, Content, Behaviour or Props |
| Tab | one case of a section: a preview with its code |
| Frame | how a section places its preview and its code: Split, Stacked, Launcher or Screen |
| Category | what a unit is: Control, Display, Overlay, Composite, Utility or Screen |
| Page of use | an extra page of a large unit that shows one use of it |

## The groups and the units — 🔮

The groups, in order: Welcome; Core (Colour, Type, Scale, Icons, States, Primitives, Patterns, Theme, Contract); Component - Actions, Data Display, Feedback, Structure, Media, Navigation, Overlays, Popovers, Typography and Utility; Data Entry - Fields, Pickers and Composites; Widgets; Containers; Layouts. Each group matches a construct and, where one exists, a library file: Core → DS 1-core, `architecture-core.md` and `architecture-names.md`; the groups of components and of data entry → DS 2-Components, `architecture-components.md`; Widgets → DS 3-Widgets, `architecture-widgets.md`; Containers → DS 4-Containers, `architecture-containers.md`; Layouts → DS 5-Layouts, `architecture-layouts.md`. Theme is `architecture-app.md`, and Patterns is `standards-patterns.md`. A group of one unit still opens with its Overview, and no group nests inside another.

Every unit is listed with its category, and a Display unit with its width, small or wide, in the construct's tree. A unit has an Overview and a Playground. Five large units add pages of use: `DSWDataTable` (Table, List and grid, Sticky columns, Row actions, States), `DSWFilterBar` (Narrow screen), `DSContainer` (Looks, Listing, Form, Dashboard), `DSLayout` (Rail, Dock, Top bar, Narrow screen) and `DSForm` (All controls).

## The sections of an Overview — 🔮

An Overview carries the sections of its unit's category, in one order. Usage is first and Props is last. A unit leaves out a section when it has nothing to show there.

| Section | What it shows |
| --- | --- |
| Usage | one basic sample, as a developer would first write it |
| Sizes | each size the unit has, side by side |
| Variants | how it looks: its variant, its colour, and the unit's own choices of look |
| States | the condition it is in: disabled, error, focus, selected, working, empty, failed |
| Content | what it holds: icons, a label, a description, slots, options |
| Behaviour | how it acts: how it opens and closes, which way it scrolls, what it does at full screen |
| Props | the props table, the link to the Playground, and the links to the library and to the book |

| Category | What it is | Sections, in order | Frame |
| --- | --- | --- | --- |
| Control | a person acts on it | Usage · Sizes · Variants · States · Content · Props | Split |
| Display | it shows a value or content | Usage · Sizes · Variants · States · Content · Props | Split for a small unit, Stacked for a wide one |
| Overlay | a person opens it | Usage · Sizes · Content · Behaviour · Props | Launcher |
| Composite | it is built from several controls | Usage · Content · States · Behaviour · Props | Stacked |
| Utility | it draws little of its own | Usage · Behaviour · Props | Split |
| Screen | it is a page or most of one | Usage · Props; its uses are pages of use | Screen |

A unit declares its group, its kind (component, widget, container or layout), its category, its width where it is a Display unit, its own dimensions with the section of each, and its pages of use. The frame and the sections follow from the declaration, so nobody chooses them for one unit. A check fails a unit with no category and a dimension with no section.

## Where a unit's own dimension goes — 🔮

Ask what the dimension changes, in this order. The first yes decides.

| The dimension changes… | It is a tab of |
| --- | --- |
| its whole arrangement | a page of its own (a page of use) |
| how the unit looks | Variants |
| how big it is | Sizes |
| what it holds | Content |
| what condition it is in | States |
| how it acts | Behaviour |

## Four frames — 🔮

| Frame | For | The preview | The code |
| --- | --- | --- | --- |
| Split | a control, a small display unit, a utility | on the left | on the right, in full, always open |
| Stacked | a wide display unit, a composite | the full width, on top | under it, in full, in an accordion named *Code*, open at first |
| Launcher | an overlay | a button that opens the real overlay over the page | on the right, in full, always open |
| Screen | the data table, the filter bar, the container, the layout | a frame at a page's height, with *Full screen* | behind a tab named *Code*, in full |

The frame never changes the sections or their order. The code is never cut: *Copy* copies the whole sample, whether its accordion is open or folded.

## What a stack chooses — 🔮

The construct fixes the groups and their order, that a unit has an Overview and a Playground, the six sections with their order and which a category has, the four frames and which a category takes, and where a unit's own dimension goes. A stack chooses the tool that draws the showcase, how a page is stored, how a tab and its controls are drawn, the size of each frame on its screens, and which units it builds yet. A native showcase follows the same outline.

## What the showcase proves — 🔮

| Who | Outcome |
| --- | --- |
| Designer | finds every unit the constructs name, in the group that holds it, under its own name; opens its drawing from its Overview |
| Developer | reads how to use a unit: its samples with code, its props, its Playground; sees each shared state and task state without writing code |
| Partner | changes a theme choice and sees the page repaint |
| Quality engineer | knows a behaviour (keys, focus, task states) is proven, not only shown — the component tier of tests proves it; the showcase only shows the look |

The showcase never restyles a unit and never shows one the constructs do not name.

## Boundary

This ref states what a showcase shows, in what outline, and in what frame. It stops at the edge of that catalogue. It does not state which units or groups exist — that is `architecture-components.md` and every construct the outline names. It does not state how a unit is drawn before it is built — that is `delivery-library.md`. It does not state how a stack builds the showcase, with which tool — that is `providers.md`. And it does not prove a behaviour: the showcase shows a unit, and proving what it does is the component tier of tests.

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
