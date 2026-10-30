<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/11-delivery-library/",
      "seen": "a2deed0a"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/04-architecture-names/",
      "seen": "79345e75"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/08-architecture-containers/",
      "seen": "b3e5c65c"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/09-architecture-layouts/",
      "seen": "2d0ba4f7"
    }
  ]
}
-->
# Step: draw — the page in Figma, from the published libraries

Read this step when the tree of the page is written and the window holds the Figma connector. **The tree is the source, and the drawing follows it.** A change of mind goes into the tree first, and then into the drawing.

Its provenance is the foundation book's design library, names, and layout and container chapters. Apply this restatement. The chapters are provenance, and not files to open.

## Before you write in Figma

- **Say what you are about to change**: the file, and the items. Stay inside them, and show the result when you have written.
- **A page is composed from the published library, in a file that is not a library file.** Never write a page into a library file. A case the showcase shows is placed as instances of its unit and never drawn as a new look.
- **The library holds the core units, which are the ones the book names, and no other unit** (`RULE.SUPPORT.SURFACE.082`). It draws no component for a unit that a stack provides on its own, and nothing of a pattern: no task pattern, no app pattern, no skeleton and no sample page (`RULE.SUPPORT.SURFACE.099`). So an app pattern is drawn as its units, and never as one instance.
- **A suffix names where a unit is placed: `App`, `Layout`, `Container` or `Widget`** (`RULE.SUPPORT.SURFACE.229`). A component takes no such word, a composite is a component, and no block carries a letter for its layer before its name. The core composites are `DSDataTable`, `DSFilterBar`, `DSComparison` and `DSFeature`, and the core widget is `DSCardWidget`. A page of groups and their items has no core unit that places its two parts, so draw the two containers themselves; `DSListDetail` is the web stack's own unit and has no drawing.
- **Never ask the developer to draw, rebind, remove or confirm anything in Figma.** A developer's hands are two: saving a named version before the connector's first change in a library file, and publishing a file. Nothing else is asked. When the library lacks something, the connector changes the library, as `refs/support/surface/delivery-library.md` states under "A developer's hands are two, and you change the library through the connector". Before a connector write, read its heading "The connector's facts". Name the developer's next step.

## Before you draw

- **Ask the developer for the link of the file to draw in.** The connector takes a link, and it finds no file by its name. The file is a design file of the team, and not a library file.
- **Search the published libraries for every block of the tree**, before you draw the first one. What you do not find is handled as *When the library does not hold a block* says.
- **Read the description of each block you found.** It lists which properties are shown states, and which are taken from the block above.

## What the page is drawn from

The design library holds one file for each layer of the design system that is drawn. The sixth layer, App, has no file of its own, and Core holds the choices of the theme. A page draws from what those files have published, and from nothing else.

| Layer | The file holds | SaaS Plane names its file | Its file key |
| --- | --- | --- | --- |
| Core | the variables, the text styles, the scale and the icons | `DS 1-core` | `3RZVOKGItY4Kos2ZVfmI3V` |
| Components | one page for each group of components | `DS 2-Components` | `saEPRBFUOa7QEj84NpCJkr` |
| Widgets | one page for each widget | `DS 3-Widgets` | `QfApgt8QTngjhGe0Hqf3Xq` |
| Containers | the panel, with its parts and its look | `DS 4-Containers` | `XQPPdU83nFQjT5LQ3JmHgg` |
| Layouts | the layout, in each of its types | `DS 5-Layouts` | `ENmqF4WjVnecAVnpuy0nHF` |

**Never draw from Lab.** It holds drafts, and it is never published.

## How each line of the tree is drawn

| In the tree | In Figma |
| --- | --- |
| The page | one top frame, named as the page. It holds the theme: light or dark, and the look of the panels |
| A block | an instance of the library component of the same name |
| A prop with a closed set of values | the property of the same name, set to the same value. The values are the vocabulary's, as `architecture-names.md` states them: a clock, a placement, an alignment or a format is never drawn under a name or a switch of the designer's own. An alignment is `DSHorizontalAlignType` (`START`, `CENTER`, `END`) or `DSVerticalAlignType` (`TOP`, `CENTER`, `BOTTOM`) on every unit that takes one (`RULE.SUPPORT.SURFACE.249`) |
| `color` | a variable mode, set on the instance itself and read by its name from the `Color` collection; light or dark is a mode of the `Mode` collection |
| The look of a container or a card | a mode of the theme's collections, for `frames` and for the keys `raised`, `elevation`, `bordered` and `rounded` of its `surface` |
| `unframed` on a container | the parts it lists are drawn with no frame, whatever the mode of `frames` on the top frame gives. The rest of the container keeps the look of the theme |
| The layout | one instance of `DSLayout` in its type, filling the top frame. The `width` of the body, and the `attached` of the navigation and of the content, are set on it as properties of the same names |
| A part of a layout | the body, the navigation or the content of that instance. The navigation holds `startNode`, the entries of `nav`, `actionsNode` and `endNode`; the content holds the page. `headerNode`, in a dock or a top nav, is the header directly under the bar, what it holds standing in the body's box, and the content's box starts under it; `footerNode` is the place at the page's end |
| The level of a frame | a variable mode of the `Level` collection, set once on the frame, whose six modes are the values of `DSPageLevelType`. It costs no version of any unit |
| The page level | the head of the page, first in the content: `DSPageLevel` at `PAGE` as its `HEADER`, or the header of a `DSPanelContainer` with `fullPage`. A `DSItem` holds the title and the description, the actions follow it as one group at the end, and `backAnchor` is the way back at the start of the title's line |
| A part of a block, or a named place | the part of the instance that carries that name. The blocks of the tree go inside it |
| `flush` on a part of a container | the frame setting, a variable mode set on that part |
| Content | the text of the instance, typed as the tree gives it |
| `row`, `column` or `grid` | a plain frame with auto layout. Its gap binds a variable of the scale |
| A block drawn from data | the host instance, with one item instance for each entry |
| A shown state, such as hover or focus | left at rest. The tree does not set it |
| A setting a block takes from the block above | set to the value of the block above. The library cannot pass a value down |

- **Draw every block as an instance.** Never detach one, never restyle a copy of one, and never draw a block from shapes.
- **Draw a flow as one top frame for each page**, side by side, in the order a person meets the pages.
- **Set the look where the tree sets it.** The top frame holds the look of the app. One instance holds a mode only where the tree sets that prop on that block.
- **Never set a hue on a plain frame.** A mode reaches everything inside the frame it is set on, and no code does that.
- **Never type a color.** Every color on the page is a variable of Core, and a block already binds it.
- **Never type a number where the scale holds one.** The gap and the padding of a plain frame each bind a variable.
- **Set the frame setting on a part only where the tree writes `flush` on that part.** It is a variable mode set on the part. That is how a table reads that it fills the part.
- **Draw each part of a container with what the tree puts in it.** The header holds the title of the container at its start and its actions after it, as one group at the end; the actions write no size and no variant, because their place gives both (`RULE.SUPPORT.SURFACE.178`). The footer holds what closes its work, such as the paging of a listing or the two actions of an entry. The action of one part of the content stands at the end of that part's title.
- **Draw the actions that close the work of an entry in their one place and order.** Over the page, in a dialog, a sheet, a drawer or a popover, they stand at the end of the footer: the action that leaves the work first, and the main action last. In an entry that is a page of its own they stand at the start of the footer, the main action first, and the footer takes `sticky` so they stay in view on a long form (`RULE.SUPPORT.SURFACE.367`). A value changed in place keeps its two actions beside the box, the one that saves first. The main action is a solid button, and the action that leaves is an outline button.
- **Draw a part named in `unframed` flat.** It takes no frame in any theme, so a change of the top frame's look leaves it as it is. One such part is a header that is the header of the page.
- **Draw the header, `headerNode`, only where the tree fills it.** It stands directly under the bar, and what it holds stands in the body's box, as the footer's does, with no fill or line of the layout's own: the body's colours stand behind it. A hero that needs the whole window is a section placed in it (`RULE.SUPPORT.SURFACE.258`).
- **Draw the footer of a layout only where the tree fills it.** It is an optional place that closes the page, the place at its end as the top bar is at its start. It runs the window's width, and beside a rail the area's, and what it holds stands in the body's box, lined up with the bar's items and the page. Where the content is short it stands at the window's bottom, and where the content is long it stands after the content.
- **Draw the layout as its three parts.** The top frame's fill is the body's, and below `FULL` the body's box is the width, centred, with the body showing on both sides. An attached navigation meets the window's edge: a rail the left, the window's height, and a top bar the top, its fill across the window and its items in the box. An attached content is the box itself, from the navigation, or the window's top, to the bottom, with square corners; beside a rail it is centred in the area beside the rail. A part that is not attached is a rounded container in the box, `--layout-space` from the window and from the part beside it. A raised content beside a navigation that is not raised stands above it, so its shadow falls on the navigation; where both are raised, the navigation stands above. On a phone every part attaches, and the layout draws its bar: the menu at its start, or the way back where a dock has `backTo`, then the nodes `phone` puts in the bar, and the account's avatar at its end.
- **Draw a card at the level of a widget.** A `DSCard`, a `DSItemCard` or a card of `DSCardWidget` stands in a container's content or on the page. Its title is at `WIDGET`, a part of it at `GROUP`, and its item lines at `CONTENT`.
- **Draw a section of a website as `DSSectionContainer`, not as a container.** A section is one part of a page with a fill of its own and the room above and below that its `size` gives, and it holds one child and frames nothing: no header, no footer, no frame (`RULE.SUPPORT.SURFACE.243`, `RULE.SUPPORT.SURFACE.247`). It reaches the edges of its place, as the layout marks it (`RULE.SUPPORT.SURFACE.254`). A grid of features under a heading is `DSFeatureGridSectionContainer`, drawn as a section whose child is a feature at `CONTAINER` over the grid (`RULE.SUPPORT.SURFACE.259`). The book states them before the library draws them, so a section the library lacks is handled as *When the library does not hold a block* says. What stands in a section takes its depth from what it holds and does for the visitor, and the section never frames itself (`RULE.SUPPORT.SURFACE.293`). A part with a title and actions stays a `DSPanelContainer`.
- **Draw the parts of a card inside its one frame.** A part of a card pads itself, and `flush` on a part drops that padding. A card hands its size to what it holds, and a `flush` part of a card says so to the blocks in it. A `flush` part of a container around a card does not reach into it. An item line draws no padding or highlight of its own: the part that holds a title gives it no padding at its two sides, and in a `flush` part the inset of its place, and a row of a list gives the line it holds its room and its highlight. The book states these before the library draws them. `divided` is the line between each two parts. A card names the parts its frame holds with `frames`, all three where it names none, and a part not listed stands flat outside the frame (`RULE.SUPPORT.SURFACE.262`).
- **A header above the outline is a look, and the theme holds it.** It is the value of `frames` that lists `CONTENT` and `FOOTER` and leaves `HEADER` out. The app patterns are drawn in that form. Set it as a mode on the top frame, and on one container only where the tree sets `frames` on that container.
- **An entry over the page is one container inside its overlay.** Draw the `DSDialog` or the `DSSheet` instance over a `DSBackdrop`, and place the container of the tree inside it. A container in an overlay is not a container inside a container.
- **Draw sizes smallest to largest.** A set shows its `SM` version at the top left, as the default a theme sets, and its layers run `XS` to `XL`. An icon beside a title or beside running text takes the scale size of that text's own step name and shares its centre line: an `XS` icon beside `XS` text. `scaleSize` is a property, as `size` is, and the mark, the avatar and the avatar group carry it with every step from `XXS` to `XXL5`.
- **Never rename an instance, a property or a value.** The name carries the link between the design and its code.
- **Draw an item line from what the tree gives `DSItem`.** Under the picture stand the title, the description, then the line of facts, with a dot between each two facts; at `INLINE`, with facts and no description, the facts follow the title on its own line after a dot (`RULE.SUPPORT.SURFACE.223`). A fact is words, a `TEXT`, a `BADGE` or a `CUSTOM` block, and a `label` stands before its words with a colon. `pageLevel` is `PAGE`, `CONTAINER`, `WIDGET`, `GROUP`, `CONTENT` or `INLINE`, and it alone decides the type of the text, the size of a badge among the facts and the box of the picture, so no text style is set by hand. The item line has no size. A row of tabs takes `pageLevel` too, and the level decides its look: the pill at `PAGE`, the line at `CONTAINER` and `WIDGET`, the switch at `GROUP`, `CONTENT` and `INLINE` (`RULE.SUPPORT.SURFACE.224`). The book states these before the library draws them, so a level the component lacks is handled as *When the library does not hold a block* says. The picture is the kind the tree gives `media`, and what stands at the end of the line is what the tree gives `endNode`. `showArrow` is the chevron at the end of a line that leads to a page and has no action there.
- **In a list, set the chosen fill, the link and the arrow on the row.** `selected`, `anchor`, `showArrow` and `endIconMotion` are the row's, `DSList.Item`, and `DSItem` takes no `selected`. A chosen row of a list is a fill of the soft step of the primary role across the row, with no check. A list may carry a `title`, which starts where the rows' words start; anything stacked is a `DSList`. `hoverable` on `DSList` is a yes-or-no property that is no by default; the hover itself is a shown state and stays at rest.

## How a block is drawn

- **An overlay is drawn as its surface alone, placed over a `DSBackdrop`, and its extent is the size of the instance.** It draws no width of its own, and the library draws no `extent` variant; the instance placed on the canvas decides it.
- **The two confirmations are drawn as their surface alone.** `DSConfirmDialog` stands over `DSBackdrop`, as every overlay does. `DSConfirmPopover` is drawn with the question and its two actions, as a popover is drawn, with no backdrop, and the control that opens it is not part of the drawing. Both place the action that cancels first and the action that confirms last, at the end.
- **A sheet that is not modal is drawn beside the page, with no `DSBackdrop`.** That is `modal` set to no on `DSSheet`.
- **A popup or an overlay that a block opens is a private part of that block, shown by the switch `open`.** It is never a block a designer places on a page of its own.
- **A value that only changes which published block sits in a slot is no variant.** The slot already makes that choice, so a variant for it would repeat the choice and need a new version for each block that may sit there.
- **A set crosses its size, its states and the shared `variant`, and may cross a prop that takes a vocabulary of forms of the block itself (`type` of `DSTimePicker`, `attached` of `DSToggleGroup`, `sort` of a table's header cell) and a property that the book names for its unit with a reason.** Every other property of the web unit is placed in the unit's column, *The library draws*, in the components chapter, read from the stack's source and never from the property's name: a prop drawn once is a case on the unit's sheet, a hue, light or dark and the page level are modes, and text and swaps are properties. No unit keeps a crossed property today, until the book names one; a look that no property can produce is a version drawn once. `skills/design/steps/change-library.md` carries the walk.

## When the library does not hold a block

The libraries are drawn layer by layer, so a page can need a block that no file holds yet.

| What is missing | What you do |
| --- | --- |
| A block the book names, which no library file has published | Draw the rest of the page. Hold its place with an empty plain frame named `missing <block>`, with no fill. Name the block and its line of the tree in the report |
| A unit that the stack provides on its own, which the book does not name | The library draws no component for it. Hold its place as for a block no file has published, and say in the report that the unit is the stack's own and has no drawing |
| A block that neither the book nor the stack names | Stop at that line of the tree. The control is proposed to the design system, and the page waits for it |
| A property or a value that the tree sets and the component lacks | Leave the property at its default. Name the difference in the report |

**Nothing drawn by hand stands in for a block.** A stand-in reads back as a name the book does not hold, and a person takes it for the design. The report says that the page is drawn in part, and lists what it waits for. When the library publishes the block, an instance takes the place of the frame.

## Read the page back by name

When the page is drawn, read it through the connector, and write what you read as a tree again.

- **Write each instance by the name of its component**, and each property by the name of its prop.
- **Write a mode as the prop it stands for.** Where an instance resolves to another mode than the top frame, write the prop. Where both resolve to the same mode, write nothing.
- **Write no prop for a shown state, or for a setting from the block above.** A design read back never gains a prop that no platform has.
- **Compare the tree you read with the tree you drew from.** The two are equal, or you name each difference.

| The read-back counts | Has to be |
| --- | --- |
| Instances that come from no published library | 0 |
| Copies of a block that are no longer an instance | 0 |
| Fills, strokes and text colors that bind no variable | 0 |
| Plain frames that carry a hue or a look mode, the top frame apart | 0 |
| Gaps and paddings of a plain frame that bind no variable | 0 |
| Names that the book does not hold, the frames named `missing` apart | 0 |
| Containers inside a container | 0 |
| Lines of the tree with no layer, and layers with no line | 0 |

Do the comparison inside the call, and return the counts and the differences. The connector refuses an answer over 20,480 bytes. Then give the developer the link of the top frame.

**The connector cannot publish a library.** This step writes to no library file, so nothing here waits for a publish.
