<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/11-delivery-library/",
      "seen": "85f8fd0b"
    }
  ]
}
-->
# Step: change-library — a change of a library file, through the connector

Read this step when the library lacks a block, a property or a value, and the window holds the Figma connector. **Every rule is stated in `refs/support/surface/delivery-library.md`, under the heading each line names.** A line here says what to do, and the heading says why and how far it holds. Read the heading before you do the line.

Its provenance is the foundation book's design library chapter. Apply this restatement. The chapter is provenance, and not a file to open.

## The walk, in order

1. **Read the file once, by passing `skills/design/scripts/page.js` to the connector as it is with its inputs filled, or take the inventory you were handed, and write the time of the reading on it.** Headings: "The inventory", "How the connector's work is carried out", and "What the agent reads and keeps".
2. **Ask the developer for a named version before the first change in the file, and wait.** Heading: "Before a connector writes".
3. **Check the order against the live file, and against the web's file and line, and say what you corrected.** Heading: "Before the change".
4. **Tell the developer what is about to change, item by item.** Heading: "Before a connector writes".
5. **Send one script for each page, given the nodes it may touch, and let it check before it moves anything and return its own proof.** Headings: "During the change", and "How the connector's work is carried out".
6. **Before you add a property or a value to a set, work out the versions the set will hold, never pass 1,000, and draw a look the stack shows as one case as a case on the unit's sheet.** Heading: "Versions that are added are laid out".
7. **Where a call moves versions, lay out one set by passing `skills/design/scripts/layout.js` to the connector as it is, dry first, and read the default version of each set before and after, check it against the stack's default at the top left, and correct a label that disagrees, never follow it.** Headings: "The default version is the stack's default, and the label tells the truth about it", and "How the connector's work is carried out".
8. **Give a new set, sheet or page the form of its neighbours, place a case as instances of the unit, and say on the sheet's label what a unit cannot hold, and list it.** Headings: "A new set, sheet or page takes the form of its neighbours", "A sheet of cases, and a case", "A unit that cannot hold the web's case", and "A unit with no look of its own".
9. **Take one picture for each set or sheet, and look at it.** Headings: "How the connector's work is carried out", and "What the agent reads and keeps".
10. **Scan the whole file last, with `skills/design/scripts/page.js` set to report the scan.** Heading: "Before a publish".
11. **Tell the developer what changed, what still differs from the web and was left, and that the publish is theirs.** Heading: "Before a publish".

Never edit the body of either script: fill its inputs and pass the rest as it is.

Keep the inventory current as you go: a change to the file updates the inventory's lines for what it changed.

**The connector cannot publish a library, and it never does.** The developer publishes after your word.
