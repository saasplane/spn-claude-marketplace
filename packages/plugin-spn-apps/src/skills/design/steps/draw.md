<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/11-surface/01-common/08-design-library.md",
      "seen": "b56467c9"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/11-surface/01-common/06-names.md",
      "seen": "11fd5eab"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/11-surface/01-common/07-layout-container.md",
      "seen": "6d40e010"
    }
  ]
}
-->
# Step: draw — the page in Figma, from the published libraries

Read this step when the tree of the page is written and the window holds the Figma connector. **The tree is the source, and the drawing follows it.** A change of mind goes into the tree first, and then into the drawing.

Its provenance is the foundation book's design library, names, and layout and container chapters. Apply this restatement. The chapters are provenance, and not files to open.

## Before you draw

- **Ask the developer for the link of the file to draw in.** The connector takes a link, and it finds no file by its name. The file is a design file of the team, and not a library file.
- **Search the published libraries for every block of the tree**, before you draw the first one. What you do not find is handled as *When the library does not hold a block* says.
- **Read the description of each block you found.** It lists which properties are shown states, and which are taken from the block above.

## What the page is drawn from

The design library holds one file for each layer of the design system. A page draws from what those files have published, and from nothing else.

| Layer | The file holds | SaaS Plane names its file |
| --- | --- | --- |
| Core | the variables, the text styles, the scale and the icons | `DS 1-core` |
| Components | one page for each group of components | `DS 2-Components` |
| Widgets | one page for each widget | `DS 3-Widgets` |
| Containers | the container, with its parts and its look | `DS 4-Containers` |
| Layouts | the layout, in each of its types | `DS 5-Layouts` |

**Never draw from Lab.** It holds drafts, and it is never published.

## How each line of the tree is drawn

| In the tree | In Figma |
| --- | --- |
| The page | one top frame, named as the page. It holds the theme: light or dark, and the look of the containers |
| A block | an instance of the library component of the same name |
| A prop with a closed set of values | the property of the same name, set to the same value |
| `color` | a variable mode, set on the instance itself |
| The look of a container or a card | a mode of the theme's collections, for each of `frames`, `raised`, `bordered` and `rounded` |
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
- **Never rename an instance, a property or a value.** The name carries the link between the design and its code.

## When the library does not hold a block

The libraries are drawn layer by layer, so a page can need a block that no file holds yet.

| What is missing | What you do |
| --- | --- |
| A block the book names, which no library file has published | Draw the rest of the page. Hold its place with an empty plain frame named `missing <block>`, with no fill. Name the block and its line of the tree in the report |
| A block the book does not name | Stop at that line of the tree. The control is proposed to the design system, and the page waits for it |
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

Do the comparison inside the call, and return the counts and the differences. The connector cuts a long result. Then give the developer the link of the top frame.

**The connector cannot publish a library.** This step writes to no library file, so nothing here waits for a publish.
