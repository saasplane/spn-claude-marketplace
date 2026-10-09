<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/11-delivery-library/",
      "seen": "2e30ff33"
    }
  ]
}
-->
# Step: change-library — a change of a library file, through the connector

Read this step when the library lacks a block, a property or a value, and the window holds the Figma connector. **Every rule is stated in `refs/support/surface/delivery-library.md`, under the heading each line names.** A line here says what to do, and the heading says why and how far it holds. Read the heading before you do the line.

Its provenance is the foundation book's design library chapter. Apply this restatement. The chapter is provenance, and not a file to open.

## The walk, in order

1. **Read the file once, by passing `skills/design/scripts/page.js` to the connector as it is with its inputs filled, or take the inventory you were handed, and write the time of the reading on it; where the inventory is for the tool, read the file with `skills/design/scripts/inventory.js` (the list of pages first, then one call for each page) and `skills/design/scripts/tokens.js`, save each answer as a file in one folder, put them together with `node skills/design/scripts/assemble.mjs --answers <folder> --out <inventory>`, and take that in with `spnutils apps surface library --file <inventory>`; before you take it in, prove each unit by a hash: send the same script again inside a function with its body unchanged, have it return an eight-character hash for each unit, compute the same hash from the answer file, and compare by program.** Headings: "The inventory", "How the connector's work is carried out", and "What the agent reads and keeps".
2. **Ask the developer for a named version before the first change in the file, and wait.** Heading: "Before a connector writes".
3. **Check the order against the live file, and against the web's file and line, and say what you corrected.** Heading: "Before the change".
4. **Tell the developer what is about to change, item by item.** Heading: "Before a connector writes".
5. **Send one script for each page, given the nodes it may touch, and let it check before it moves anything and return its own proof.** Where the script makes a frame a slot, follow the connector's facts under Slots, and where it draws a group whose members are joined, follow the facts on the joined look. Headings: "During the change", "How the connector's work is carried out", and "The connector's facts".
6. **Before you add a property or a value to a set, work out the versions the set will hold, never pass 1,000, and draw a look the stack shows as one case as a case on the unit's sheet.** Heading: "Versions that are added are laid out".
7. **Where a call moves versions, lay out one set by passing `skills/design/scripts/layout.js` to the connector as it is, dry first, and read the default version of each set before and after, check it against the stack's default at the top left, and correct a label that disagrees, never follow it.** Headings: "The default version is the stack's default, and the label tells the truth about it", and "How the connector's work is carried out".
8. **Draw, for each unit, what a person sees of it: a usage of its primary use for every top-level unit (a part owes none); every property that changes what is visibly there, by a version or by a case named `<property>=<value>` on the version where it draws, a property that is on by default by its off case; a mode, shown by one case, for a property whose value is a token; every state the unit can be in (open, hover, focus, pressed, selected, checked, filled, invalid with its message, disabled, loading, empty), a property that lets a unit reach a state by that state; and, for a property of behaviour, which changes nothing a person can see in any state, a note in the header, ` · behaviour: <property>, <property>`.** A unit drawn as cases alone says why in its sheet's label. Headings: "What a library file owes of a unit", and "The form of a label".
9. **Give a new set, sheet or page the form of its neighbours, place a case as instances of the unit, and say on the sheet's label what a unit cannot hold, and list it.** Headings: "A new set, sheet or page takes the form of its neighbours", "A sheet of cases, and a case", "A unit that cannot hold the web's case", and "A unit with no look of its own".
10. **Put every thing a unit owns inside the unit's section, in the book's order: the header, the set with its row and column labels, the usage, the cases and the parts, with a page's top level holding sections only.** Name the header's layer `header · ` and the unit's name, and every other label's `label · ` and its text, and a sheet's label stands above the sheet in the band of cases and is never the header. A unit drawn only as a sheet of cases gets a section with its header and its sheet, the header's layout clause reading `no set of versions, shown as cases`. Begin a usage's layer and caption with `usage · ` and the unit's name, with no comma after it, centre a row label on its row's band, give a thing room for what it draws, and give a section the fill its page's content stood on. In the Core file a section holds a group of tokens with one frame of specimens, and a frame that sets a variable mode moves whole. Headings: "A file's pages are the showcase's groups, and a unit is one section", and "A section of the Core file". **Place the pieces of a page's sections at the book's distances by passing `skills/design/scripts/align.js` to the connector as it is, in mode `plan` first and then `run`:** it moves and resizes only the sections and the pieces directly inside them, and proves the page's alignment (the header at the padding, each band 80 apart, nothing outside its section or meeting another, every label's offset from its set kept) against a ledger it takes before the change.
11. **Make a new unit in a section of its own at the end of its group's page, put a label or a usage in its unit's section, and a part in the section of the unit that owns it or in Shared parts.** Heading: "A file's pages are the showcase's groups, and a unit is one section".
12. **Read a set's key, its versions' keys, its name, its size, its default and its properties before a move into a section and after it.** Heading: "A file's pages are the showcase's groups, and a unit is one section".
13. **Take one picture for each set or sheet, and look at it.** Headings: "How the connector's work is carried out", and "What the agent reads and keeps".
14. **Scan the whole file last, with `skills/design/scripts/page.js` set to report the scan, one call for each page.** The script reads a page of either form (nodes at its top level, or inside sections) and says which in `form`; a page where it found no unit answers `emptyReading`, never `clean`. Beside the findings of old it reports a top-level node that is no section, things inside a section that meet, a thing outside its unit's section, a section whose pieces stand out of order, a unit with no header, a usage that names no unit, and a child that lies outside its section's box (by its box or by what it draws, with the side and the px); it blocks on a top-level unit with no usage (a unit drawn as cases alone, with no component in its section, takes its first case for its usage) and on a boolean, swap or text property that nothing on the page draws off its default and that the header does not name after `behaviour: `; it counts, without blocking, the top-level units that have no sheet of cases (a unit whose versions draw everything owes none), and names a property that the clause names and the unit does not have; and it reads a sheet's label apart from a header and a default mark by the words of a value before its first `: `. Heading: "Before a publish".
15. **Tell the developer what changed, what still differs from the web and was left, and that the publish is theirs.** Where the file has taken a library's update, read its sets again and run the layout proof and the scan again before you say anything is whole. Headings: "Before a publish", and "The connector's facts", under A library's update.

## Adding a property, a value or versions to a set

Step 6 and step 8 say what a set must hold. These steps say how one is grown, in order. Each has its reason after it. Headings in the reference: "Versions that are added are laid out", "A label", "The form of a label", "A sheet of cases, and a case", and "The connector's facts".

1. **Read the set again just before the first change.** A writer may have changed it since the inventory was read.
2. **Work out the versions the set will hold, and say so.** One more property multiplies them, and 1,000 is the limit.
3. **Give a new property a default value that draws what stands.** The versions that are there are then the look of the default, only the other values are new drawings, and no placed instance changes.
4. **Make each new version as a copy of its nearest twin, and change only what its value changes.** Name it `property=value, property=value`, with no comma inside a value. A copy made inside a set loses its property ties, and a slot in it becomes a plain frame, so compare each copy with its twin and tie it again.
5. **Keep the default at the top left.** The default version is the one at the top left of the grid, and not the first child. Change it by changing places in the grid, and read it back before and after.
6. **Rename a property or a value in the versions' names.** The versions keep their ids and keys, so nothing placed breaks.
7. **Grow the set, its section and its sheet so that nothing meets.** A copy lands on the version it was made from, and a section that is too small leaves a thing outside it. Then run the layout script, dry first.
8. **Set a label's text and its layer name in one step.** The layer is `label · ` and the text, so a script reads the unit from the label.
9. **Name a case `property=value`, with no comma inside a value,** and keep the name unique on its sheet.
10. **Make the unit's header name the new property.** Its layout clause and its default marks must say what the set now holds, or the scan reports the header as wrong.
11. **Take the hashes of the set before and after, and list every difference.** A difference that your order did not name is a finding to report, not to keep.
12. **Do only what your order names, and report the rest.** A writer that meets a fault outside its order writes it down and leaves it. The permission check refuses a call that changes a library when the order did not name the change.

## The measure and the pace

- **A library is brought to the web by its properties, its values, its defaults and its states, and by nothing clipped or overlapping.** This is the book's own rule: "A property that changes what is visibly there MUST be drawn", and a state a unit can be in MUST be drawn (step 8). Anything finer than that is listed in the report and not drawn. The developer decided this on 2026-10-09.
- **One writer takes a page whole, and a page is scanned once, when it is finished.** Two agents never change one library file at once. Scanning after each set costs a read of the page each time and proves what the last set's proof already returned.

## A child agent

A child agent that sends `use_figma` cannot read the connector's own skill. Hand it `skills/design/steps/connector-rules.md`, and the order for its work. It sends nothing the order does not name.

Never edit the body of any script: fill its inputs and pass the rest as it is.

Keep the inventory current as you go: a change to the file updates the inventory's lines for what it changed.

**The connector cannot publish a library, and it never does.** The developer publishes after your word.
