<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/12-delivery-showcase.md",
      "seen": "d74b8fd4"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/12-delivery-showcase/",
      "seen": "18aa1b44"
    }
  ]
}
-->

# Delivery Showcase — The Proof Every Realization Delivers

Source of truth: the foundation's Delivery Showcase construct (`docs/02-constructs/02-support/03-surface/12-delivery-showcase.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/12-delivery-showcase/`). Delivery Showcase is the twelfth of thirteen Surface constructs.

Read this before you add a unit to a showcase, or before you judge whether one is complete. A stack that realizes Surface proves it with a showcase: a running catalogue that shows how every unit is used, like the web's Storybook. Every stack follows the same outline with its own tool — Storybook on the web, a showcase app on native. A showcase is for a developer who is about to use a unit. It shows how a unit is used, and it is not a test of the system. **The thing to unlearn: nobody lays out a page of a showcase.** A unit declares a few facts about itself, and its page is derived from them. A stack builds the frame that derives the pages, never an outline of its own.

## The rule — 🔮

1. A showcase is a list of groups, in one order, and each group belongs to one layer of the design system. A group of units opens with its Overview.
2. A unit has a main page and a Playground, and other pages where its showcase layout calls for them.
3. A main page opens the same way on every unit, and then holds sections in one order.
4. A unit declares its tags: its group, its category, its showcase layout and what it has. Its page is derived from them, so no page is laid out by hand.
5. A section is one container. Its header holds the title, one line and the section's actions. Its content is one card that holds the tabs, the preview and the code as one object. Its footer holds the actions that follow from the section.
6. The code of an example is the usage only, and it is shown whole.
7. A unit that writes a value shows the live value beside it in every example.
8. A size is a tab of the page or the section that shows the unit, and never a page of its own.
9. A showcase is built from the units of the design system it proves, and from nothing else.

## Terms

| Term | What it means |
| --- | --- |
| Showcase | a running catalogue that shows how every unit is used |
| Layer | the layer of the design system that a group belongs to: Core, Components, Widgets, Containers, Layouts or App |
| Group | one part of the showcase's navigation, such as Core or Component - Actions |
| Unit | one component, widget, container or layout of the library |
| Main page | the first page of a unit: the opening, then its sections |
| Playground | the page of a unit where every prop is a control |
| Scenario page | a page of its own for one use of a unit that needs the whole width or the whole screen |
| Section | one named part of a page, drawn as one container. The sections of a main page are Usage, Sizes, Colors, Content, States and Props |
| Card | the content of a section's container, in the container's frame, which holds the section's tabs, its preview and its code |
| Tab | one example of a section |
| Tag | one fact a unit declares about itself, from which its page is derived |
| Category | the tag that says what a unit is: Control, Display, Overlay, Composite, Utility or Screen |
| Showcase layout | the tag that says how much of a page a unit needs: Inline, Content, Full width or Full screen |
| Config object | an object that a prop takes, such as the config of a data table, explained under the props table |

## The layers, the groups and the units — 🔮

The groups stand in the order of their layers. Welcome stands before them and belongs to no layer. A unit does not choose its layer: the layer follows from the group.

| Layer | Its groups, in order |
| --- | --- |
| Core | Core |
| Components | Component - Actions · Data Display · Feedback · Structure · Media · Navigation · Overlays · Popovers · Typography · Utility, then Data Entry - Fields · Pickers · Composites |
| Widgets | Widgets |
| Containers | Containers |
| Layouts | Layouts |
| App | App |

Welcome, Core and App hold pages, and every other group holds units. Core holds Colour, Type, Scale, Icons, States, Primitives, Patterns and Inline alignment. App holds Theme and Contract. A group of units opens with its Overview, also when it has one unit, and no group nests inside another. Core, Components, Widgets, Containers and Layouts each match a library file, DS 1-core to DS 5-Layouts; App matches none. A showcase shows no unit that the constructs do not name.

A group's Overview names the group, says in one sentence what its units are for, and holds one card for each unit: its name, its category, one sentence, a small live example with real words, and the pages the unit has.

Each unit below is listed with its category, its showcase layout and what it has. *None* means the unit has none of the eight things a unit can have.

| Group | Its units |
| --- | --- |
| Component - Actions | `DSButton` Control · Inline · sizes, colours, variants, states, content, opener. `DSButtonGroup` Control · Content · sizes |
| Component - Data Display | Display · Content: `DSAccordion` sizes, content · `DSAccordionGroup` sizes, content, data · `DSAddressView` sizes, data · `DSCard` sizes, opener · `DSCarousel` none · `DSCodeBlockView` sizes · `DSDataFieldView` sizes, data · `DSDataUnit` sizes, content · `DSItem` sizes, content, opener · `DSJSONView` data · `DSList` sizes · `DSTable` sizes. Display · Inline: `DSAvatar` sizes, content · `DSAvatarGroup` sizes · `DSBadge` sizes, colours, variants, states, content, opener |
| Component - Feedback | Display · Content: `DSAlert` sizes, colours · `DSProgress` sizes, colours · `DSSkeleton` none · `DSEmpty` sizes, content. `DSSpinner` Display · Inline · sizes, colours, content. `DSToast` Overlay · Content · colours |
| Component - Structure | Utility · Content: `DSCollapsible` sizes, content · `DSHScroll` none · `DSScrollArea` none · `DSSeparator` colours |
| Component - Media | `DSAspectRatio` Display · Content · none. Display · Inline: `DSIcon` colours, states, content · `DSImage` content |
| Component - Navigation | Control · Content: `DSBreadcrumb` data · `DSMenubar` sizes, data · `DSNavigationMenu` sizes, data · `DSPagination` sizes, value · `DSTabs` sizes, content, data · `DSAnchor` states, opener. `DSLink` Control · Inline · sizes, colours, states, content, opener |
| Component - Overlays | Overlay · Content: `DSDialog` sizes · `DSAlertDialog` colours, content · `DSDrawer` sizes · `DSSheet` sizes · `DSBackdrop` none |
| Component - Popovers | Overlay · Content: `DSContextMenu` sizes, states, opener, data · `DSDropdownMenu` sizes, states, opener, data · `DSHoverCard` states, content, opener · `DSPopover` states, content, opener · `DSTooltip` sizes, states, opener |
| Component - Typography | Display · Inline: `DSText` colours · `DSKbd` sizes, data |
| Component - Utility | Display · Inline · none: `DSFormatCurrency` · `DSFormatDate` · `DSFormatDateTime` · `DSFormatNumber` · `DSFormatTime`. Utility · Content: `DSAuthz` content · `DSAnchorContainer` states, opener · `DSElementObserver` none · `DSPortal` none · `DSSticky` states |
| Data Entry - Fields | Control · Content: `DSInput` sizes, states, content, value · `DSInputNumber` sizes, states, content, value · `DSInputOTP` · `DSInputPhone` · `DSTextarea` · `DSCheckbox` · `DSRadio` · `DSSwitch` · `DSSlider` · `DSSliderRange` sizes, states, value each · `DSCheckboxGroup` · `DSRadioGroup` sizes, states, value, data each · `DSToggle` sizes, colours, states, content, value · `DSToggleGroup` · `DSToggleGroupMulti` sizes, colours, states, value, data each. `DSLabel` Control · Inline · sizes, states |
| Data Entry - Pickers | Control · Content: `DSSelect` · `DSSelectMulti` · `DSAutocomplete` · `DSAutocompleteMulti` sizes, states, content, value, data each · `DSDatePicker` · `DSTimePicker` · `DSDateTimePicker` sizes, states, value each · `DSDateRangePicker` sizes, states, value, data. `DSCommand` Composite · Content · sizes, data. `DSCommandPalette` Overlay · Content · sizes, opener, data |
| Data Entry - Composites | `DSForm` Composite · Full width · sizes · a form; scenario pages All controls and Field behavior. Composite · Content: `DSAddressForm` sizes, states, value · `DSAttachment` · `DSAttachmentMulti` · `DSDataFieldForm` sizes, states, value, data each · `DSJSONControl` sizes, states, value · `DSDataFieldBuilder` states, value, data. `DSImagePicker` Composite · Inline · none |
| Widgets | `DSWDataTable` Composite · Full width · data; scenario pages Table, List, Grid, Record actions, Sticky columns. `DSWFilterBar` Composite · Full width · sizes, content, data; scenario page With overflow |
| Containers | `DSContainer` Composite · Full width · sizes; scenario pages Listing, Form, Dashboard |
| Layouts | `DSLayout` Screen · Full screen · content, data · no Playground; one page for each layout type: Rail, Dock, Top nav |

## The pages of a unit — 🔮

| What you see | How many | Where |
| --- | --- | --- |
| A group's Overview | one for each group of units | first under its group |
| A unit's main page | one for each unit | first under its unit |
| The Playground | one for each unit, except a unit whose showcase layout is Full screen | after the main page |
| A scenario page | one for each scenario of a Full width unit, and one for each type of a Full screen unit | after the Playground |

**A scenario is a section or a tab, unless the showcase layout is Full width or Full screen.**

| Showcase layout | Its pages | A scenario is | Where the code sits | How States are shown |
| --- | --- | --- | --- | --- |
| Inline | a main page and a Playground | a section or a tab | in the card, beside the preview | in one row, with the name of each state under it |
| Content | a main page and a Playground | a section or a tab | in the card, beside the preview; under the unit and its State panel where the unit writes a value | as tabs, one state in each |
| Full width | a short main page of Usage and Props, a Playground, and one page for each scenario | a page | in the card, under the preview | on the scenario pages |
| Full screen | a short main page of Usage and Props, and one page for each type of the screen; no Playground | a page | in the card, under the embedded screen | on the page of each type |

- The main page of a Full width or a Full screen unit ends with a link to each of its other pages, each with a few words that say what the page shows.
- **A size is a tab, and never a page of its own.** The sizes of a unit are tabs of the page or the section that shows the unit, so a developer sees a whole use at each size. No unit has a scenario page for its sizes alone, whatever its showcase layout. The sizes of an Inline or a Content unit are the tabs of its section Sizes. The sizes of a Full width or a Full screen unit are tabs of a scenario page, or of a section of its main page. The sizes of the form are the tabs of *All controls*, and every control of the form follows the open tab.
- A scenario page shows its running result and, under it in the same card, the config that makes the scenario, as code, shown whole, with a comment line on each part that matters. Under the card, a few sentences say what to change to reach the neighbouring behaviour. A scenario page links back to its unit's main page, and to the explanation of each config object it uses. The link to a config object stands in the footer of the section that shows the config, at the footer's start.
- **An embedded screen fills the content of its section, from edge to edge.** It is the real screen, running, embedded in the card and scaled so that its whole width shows. It reaches every edge of the container's frame, so the frame's border and corners are the screen's frame. No margin, bar or empty strip stands beside it. *Open full screen* is an action of the section, so it stands at the end of the section's header, level with the title, and opens the real screen. On a narrow page the title and the action stay on one line where they fit, and wrap where they do not.

## The opening of a main page — 🔮

Every main page opens the same way. The opening is styled as a page of the book styles its own header: a first line, then one row of labelled groups.

```text
SAAS PLANE  |  DESIGN SYSTEM  |  {LAYER}
FIGMA  {link}  {last sync}          SHOWCASE  {layer}  {group}  {category}  {showcase layout}
{Unit name}
{short summary}
```

| Part of the opening | Holds | How it is drawn |
| --- | --- | --- |
| The first line | the product, the design system and the unit's layer | in small capitals with wide spacing, and a bar between its parts |
| Figma | two values, in this order: the link to the unit's drawing in the library, then the date and time of the last sync | the label *Figma* in small capitals, then each value as a small pill |
| Showcase | four values, in this order: the layer, the group, the category, then the showcase layout | the label *Showcase* in small capitals, then each value as a small pill |
| The name | the unit's name | as the title of the page |
| The summary | one short sentence that says what the unit is for | as plain text under the name |

- The two groups stand in one row, Figma at its start and Showcase at its end. On a narrow page the row wraps, and no value is cut.
- **A group has one label, and a pill holds a value only.** The labels are *Figma* and *Showcase*. No pill carries a label of its own: the label of its group and its place in the group say what a pill means. Under *Figma*, the first pill is the link and the second is the last sync. Under *Showcase*, the pills are the layer, the group, the category and the showcase layout, in that order. The order is the same on every main page.
- The pill of the link opens the unit's drawing in the library, and reads the unit's name.
- The date and time of the sync are written for a person, in the reader's own zone: the date in words, a twelve-hour time with AM or PM, and the zone by its name, as in *4 Oct 2026, 9:40 PM IST*.
- **A missing value is a pill that holds a dash.** The pill keeps its place, so the order of the values still says what each pill means. The page invents no link and no date.
- No badge stands beside a title. No import line follows the opening.

## The tags a unit declares — 🔮

| Tag | Values | What follows from it |
| --- | --- | --- |
| layer | Core, Components, Widgets, Containers, Layouts, App | the first line and the Showcase group of the opening. The layer follows from the group |
| group | the groups above | where the unit sits in the navigation |
| category | Control, Display, Overlay, Composite, Utility, Screen | the Showcase group of the opening, and the unit's card on its group's Overview |
| showcase layout | Inline, Content, Full width, Full screen | how a preview is laid out, whether States stand in one row or in tabs, where the code sits, and whether a scenario is a section or a page |
| has | sizes, colours, variants, states, content, value, opener, data | which sections the main page holds, and which card a section takes |

A unit also declares its name, its short summary, and its link to the library with the instant of the last sync. A form declares that it is a form.

| Category | What it is |
| --- | --- |
| Control | a person acts on it |
| Display | it shows a value or content |
| Overlay | a person opens it |
| Composite | it is built from several other blocks |
| Utility | it draws little of its own |
| Screen | it is a whole screen |

| Showcase layout | The unit |
| --- | --- |
| Inline | is small, and sits in a line with others |
| Content | is as wide as the place it is put in |
| Full width | needs the whole width of a page |
| Full screen | is a screen |

What a unit has is read from its own props.

| A unit has | When | What follows |
| --- | --- | --- |
| sizes | it takes `size` | the section Sizes |
| colours | it takes `color` | the section Colors |
| variants | it takes `variant` | no section: every tab of Sizes and of Colors shows each variant |
| states | the caller sets a state on it, such as disabled or working | the section States |
| content | it holds an icon, or a place that takes any block | the section Content |
| value | it writes a value | no section: every card shows the live value beside the unit |
| opener | something opens it, or it opens something | no section: the Usage example holds the thing that opens it |
| data | it is drawn from a list, a record or a config | no section: the Usage example holds real records |

A unit sits in one category, placed by what a developer mostly does with it. The five formatters are one family and each shows a value, so all five are Display, although their group is Component - Utility. **A wrong declaration shows as a fault on the page.** A missing tag, a layer that the group does not give, or an example for a section that the tags do not give, is drawn at the top of the main page, and the sections that still hold are drawn under it.

## Sections, and the card of a section — 🔮

A main page holds its sections in one order. Usage is first and Props is last. A section appears only when the unit has something for it.

| Section | Appears when the unit has | What it holds |
| --- | --- | --- |
| Usage | always | one example: the richest real use of the unit, one that an app would really have |
| Sizes | sizes | one tab for each size, `XS` to `XL`. Each tab shows every variant, in a row that flows to the next line |
| Colors | colours | one tab for each colour. Each tab shows every variant, in a row that flows to the next line |
| Content | content | one tab for each icon or place the unit holds |
| States | states | each state the caller sets: in one row, with the name of each state under it, when the showcase layout is Inline; otherwise one tab for each state. A unit that is loading shows the state *Working* |
| Props | always | the props table and the unit's config objects. Its footer holds the link to the Playground |

A section opens on the tab its unit names. Where the unit names none, Sizes opens at `SM`, Colors at the primary colour, and any other section at its first tab. A section with one example has no row of tabs, unless that example carries a name of its own.

**Every section of a page is one container**, as `architecture-containers.md` states a container, on a main page and on a scenario page. It takes the container's three parts, in the container's one order.

| Part of the container | What it holds in a section | In the frame |
| --- | --- | --- |
| Header | at its start, the section's title, and under it one muted line that says what the section shows. At its end, level with the title, the section's actions, such as *Open full screen* over an embedded screen | no. It sits flat on the page |
| Content | the card: the tabs, the preview and the code as one object. The part is `flush`, because what it holds reaches the edge of the frame | yes. It is the one part the frame holds |
| Footer | at its start, the actions that follow from the section, such as *Open the Playground* under Props | no. It sits flat on the page |

- The frame is the section's one border. What stands in the content draws no border and no corners of its own.
- A header's actions stand at its end, and a footer's actions stand at its start. An action of the header acts on what the section shows now. An action of the footer leads on from the section, to another page or to another part of the same page.
- Every section has a header. A section with no action that follows from it has no footer.
- The look of the frame comes from the theme, as an app's does. The showcase sets no border, no fill and no corners of its own on a section, so a change of the container's look in the theme shows on every section.
- The opening of a page is the page's own header, and not the header of a container.

The content of a section's container is one card. The card holds the tabs, the preview and the code as one object. The container's frame is the card's border and its corners, so a section has one border and not two.

| Part of the card | On a wide page | On a narrow page |
| --- | --- | --- |
| Tabs | a row at the card's top, from its start. The open tab has a line under it in the primary colour, and a rule runs across the card under the row | the same row. When the tabs do not fit, the row scrolls sideways inside the card and never wraps |
| Preview | at the start of the card, on the card's own surface, with its content centred | under the tabs, at the card's full width |
| Code | beside the preview, on a dark surface that reaches the card's end and bottom edge, with no gap and no frame of its own; open at first | under one bar across the card, which holds *Show code* at its start and the copy control at its end; closed at first. When open, the same dark block, as wide as the card, closing the card's bottom edge |
| Inside the code | each case begins with a comment line that names it, then the usage. An empty line separates two cases. A copy control stands at the top of the code, at its end | the same. A long line scrolls sideways inside the block, and the page never scrolls sideways |

- **The code is the usage only**: the lines a developer writes at the point of use. It holds no import, no wrapping function and no whole file.
- **The code is shown whole, and is never cut.** The copy control copies all of it.
- Where the showcase layout is Full width or Full screen, the code stands under the preview, inside the same card.

**A unit that writes a value, and a form.** In every example of such a unit, the live value stands beside the unit, and the code goes under both. The live unit takes about three fifths of the row. Beside it stands a dark panel titled *State*, with a copy control at the end of its title bar, a rule under the title, and under it the value the unit writes, live. The code stands under both, at the card's full width. On a narrow page the panel stands under the unit, and the code behind the bar with *Show code*. The main page has no section for the value. A form takes the same card.

## Props and config objects — 🔮

Props holds the props table: each prop with its type or its values, its default, and what it does. The link to the Playground follows from the section, so it stands in the section's footer, at the footer's start. On a narrow page each prop is a small block of its own.

A unit whose props take objects explains each object under its props table, in a part named *Config objects*. Each object has a part of its own: one sentence on what it is for and what takes it; a table of its fields with the name, the type, the default and what each does; and an example of the object as code. A field that is itself an object links to the part that explains that object. The main page explains each object in general, and a scenario page explains one config in particular.

## The container's pages, and the page Theme — 🔮

The pages of `DSContainer` show every variant that `architecture-containers.md` states, each as a real page of an app inside the container, never as an empty box. Its main page says what a container is for under the opening. It then shows the parts, the parts a frame holds, each look that `raised`, `bordered` and `rounded` make, and a part with its inset and with `flush`, as tabs of sections of the container's own. Those sections stand after Usage and before Props. A listing, a form and a dashboard are one scenario page each.

Theme is a page of App, of its own kind. It has three parts, in this order.

| Part of the page | What it holds |
| --- | --- |
| The theme explained | what a theme is: the closed list of its choices, who sets it, what a page may not set, and how it reaches every block through `DSApp`. Then the theme object, explained as a config object |
| The theme's form | the form that sets the theme, on the page itself, with *Apply* and *Reset*. It is the same form the showcase's own bar offers. Applying it sets the theme of the page and of the sample app under it. The code of the theme object stands beside the form and follows the form's values |
| One sample app | one app, embedded as an embedded screen is, in the layout type Rail, with a dashboard, a listing, an edit form and the view of one record. It takes the theme that the form applies |

## Built from the design system's own units — 🔮

**A showcase is built from the units of the Surface it proves.** Every control, text, row of tabs, container, table and code view on a page of a showcase is a unit of that design system, drawn with its tokens. This holds for the page around a preview as well as for the preview: the opening, the sections, a group's Overview and a documentation page.

| On a page of the showcase | Is the unit |
| --- | --- |
| a pill of the opening | `DSBadge` |
| the first line, a label, a title, a muted line and a summary | `DSText` |
| a bar between two parts of a line | `DSSeparator` |
| a section | `DSContainer` |
| the row of tabs of a card | `DSTabs` |
| the props table, and the table of a config object's fields | `DSTable` |
| the code of an example | `DSCodeBlockView` |
| an action, such as *Open full screen*, *Open the Playground* or the copy control | `DSButton` |

- Every colour and every space on a page is a token of the core. A page of a showcase sets no value by hand.
- **Where a showcase cannot be built from a unit, that is a fault of the unit.** The fault is fixed in the design system, and the showcase then uses the unit.
- **A showcase keeps no part of its own in a unit's place.** It holds no control, no row of tabs, no container, no table and no code view that the design system does not hold.

## The rules of every page — 🔮

- The words inside a previewed unit are what an app shows a person, such as *Save changes* or *Add member*, and never the name of a size or of a variant.
- A size named in words is written out: X Small, Small, Medium, Large, X Large. A tab keeps the short name, `XS` to `XL`.
- The showcase opens at the default size the apps use, `SM`. An example gives a size only where size is what it shows.
- An action's example shows the primary colour.
- A thing inline with text takes the text's size step. Core holds the page *Inline alignment*: every control at each size on one centre line, and a line of text with an icon, a badge, a link and a button on the text's baseline.
- One control, *Show code*, on the showcase's own bar, sets the code of every card. It is on at first on a wide page and off at first on a narrow one. On a narrow page each card also has its own control, which wins for its card. On a wide page a card has no control of its own.
- Every page reads well on a phone, a tablet and a desktop. On a narrow page a split stacks, nothing has a fixed width, a wide table scrolls inside its own box, and a row of variants flows to the next line. The page never scrolls sideways.
- A documentation page, which is a page written in prose such as a page of Core, has no outline panel. Its content is as wide as the width of the shell, a measure of the layout, and on a narrower window it fits the window.
- A unit inside a documentation page keeps its own sizes. The styling a tool gives its documentation never reaches a unit.

## What a stack chooses — 🔮

The construct fixes the layers, the groups and their order; the pages of a unit; the opening and what each part of it holds; the tags and that a page is derived from them; the sections, their order and when each appears; and the card of a section with where the code sits. It also fixes that a section is one container, that a size is a tab, that an embedded screen fills the content of its section, and that every part of a page is a unit of the design system. Every rule of the construct is the construct's, and a stack changes none of them. A stack chooses the tool that draws the showcase, how a page is stored, how a pill, a tab and a control are drawn, how a unit writes its declaration, the width under which a page is narrow, the number of pages, how a running screen is embedded, the navigation and the bar its tool draws around a page, and which units it builds yet. On the web a unit is one set of stories with its declaration and its examples, and *Show code* is a control of the Storybook's toolbar. A native showcase follows the same outline.

## What the showcase proves — 🔮

| Who | Outcome |
| --- | --- |
| Designer | finds every unit the constructs name, in the group that holds it, under its own name; opens its drawing from the Figma link in the opening of its main page |
| Developer | reads how to use a unit: its examples with their usage code, its props, its Playground; sees each shared state and task state without writing code |
| Partner | changes a theme choice on the page Theme and sees the page repaint |
| Quality engineer | knows a behaviour (keys, focus, task states) is proven, not only shown — the component tier of tests proves it; the showcase only shows the look |

The showcase never restyles a unit and never shows one the constructs do not name.

## Boundary

This ref states what a showcase shows, in what outline, and how the page of a unit is derived. It stops at the edge of that catalogue. It does not state which units or groups exist — that is `architecture-components.md` and every construct the outline names. It does not state what the layers are — that is `architecture-names.md`. It does not state how a unit is drawn before it is built — that is `delivery-library.md`. It does not state how a stack builds the showcase, with which tool — that is `providers.md`. And it does not prove a behaviour: the showcase shows a unit, and proving what it does is the component tier of tests.

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
