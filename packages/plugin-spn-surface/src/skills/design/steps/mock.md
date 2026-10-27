<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "`SKELETON` — a mock of a layout",
      "seen": "ee4edd9b"
    },
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-surface/06-architecture-components.md",
      "section": "The choice table",
      "seen": "558560a5"
    }
  ]
}
-->
# Step: mock — the tree drawn as skeletons, with no Figma

Read this step when the developer asks for a mock of a page or a flow, or asks to see the design where the window holds no Figma connector. **A mock is the tree this skill already wrote, drawn as skeletons.** It is no second design: every decision in it is made in steps 0 to 5, and a change of mind goes into the tree first, and then into the mock. In a designer's words it is a mock; in the book's it is a skeleton, a mock of a layout.

Its provenance is the foundation book's docs chapter, on the skeleton and the flow file, and the components construct, on the mock. Apply this restatement. The chapters are provenance, and not files to open.

## What a mock is, and what it is not

- **A mock names units, and never their props.** It shows where each block stands and which unit it is: `DSPanelContainer`, `DSDataTable`, `DSCard`, an item line, a button. The choice table gives each unit its props when the page is built, so a mock writes no variant, colour or size.
- **A mock shows no look.** No colour that means something, no size in pixels, no theme, no unit drawn from the library. The library holds the look, and the Figma step draws it.
- **A mock is drawn in a skeleton's own words and nothing else.** Out of it are clicking from page to page, sending the mock to Figma, and a native screen.

## Write the facts first

Before the first skeleton, write the facts of step 0 and step 2 at the head of the mock, each with where you read it: who the app is for, the flow and the page's step in it, and what the data holds. A reader corrects a fact before a drawing. Where the tree already holds them, copy them from the tree.

## One skeleton for each page, in the order a person meets them

- **Each page is one spec, a skeleton, started from the spec of its pattern** (`refs/support/surface/standards-patterns.md`, under *The specs a screen starts from*). Copy the pattern's spec, put the page's own words and data in place of the samples, and keep the arrangement. Never start from an empty file.
- **The spec draws every level of the page, from the tree**: its `layout`, each view's page level as `page`, and the `unit` of each panel, widget and card. Each line of the tree is a frame, a part, an item or a control of the spec.
- **A view for each screen class where the pattern changes.** A desktop view, and a phone view where the arrangement differs at a phone, as step 3 of the tree says: a data table that becomes a list, two parts that become one with a way back, a dialog that becomes a sheet. A tablet view only where the tablet differs from both.
- **Each dialog, sheet or drawer is its own view**, a whole frame of its own over the page it opens from. It is a view a person sees as one task, and it holds its own main action.
- **Each block drawn from data shows its empty, failed and denied pictures as views of their own**, with `state`, a value of `DSTaskStateType`: `EMPTY`, `FAILED`, `DENIED`, and `WORKING` where the wait is long enough to see. A view with no `state` shows the page with its data. A view with a `state` shows the same page in that state, as a whole frame, with only what the state changes drawn differently. The views of one screen class stand together, the one with no `state` first and the others in the order of `DSTaskStateType`. A state the page's blocks do not show is not drawn. The words of each state are the tree's task lines: what the person sees, and the way back from a failure.
- **Every move names the page it leads to.** An action that opens another page, a dialog or an end of the flow says where it lands, in the tree and in the flow file.

## A flow file that orders the pages

A mock of more than one page carries a flow file, `<flow>.flow.json`, beside the specs it names.

- **`flow` is the flow's name**, the name of its flow pattern where it follows one (`refs/support/surface/flow-patterns.md`).
- **`pages` lists the pages in the order a person meets them.** Each has `page`, a word the file is unique by, `spec`, the skeleton that draws it, and `moves`.
- **A move names what a person does and where it leads.** `on` is the words of the action or the event, `to` is a page of the file or `end` where the flow is done, and `state` is the task state of the view it lands on, where it lands on one.

```json
{ "flow": "Invite a member",
  "pages": [
    { "page": "members", "spec": "members.dg.json",
      "moves": [ { "on": "Invite a member", "to": "invite" } ] },
    { "page": "invite", "spec": "invite.dg.json",
      "moves": [ { "on": "Send invite", "to": "members" },
                 { "on": "Send invite", "to": "invite", "state": "FAILED" },
                 { "on": "Cancel", "to": "members" } ] }
  ] }
```

**The flow file draws nothing; each page is drawn by its own spec.** Read the file against the specs before you hand the mock over. A `to` that names no page of the file, a page no move reaches but the first, a `spec` that is not there, and a `state` the page's spec does not draw are each a finding to fix.

## Where the mock is written, and how it is looked at

- **Write the specs and the flow file as files** in the running arc's `notes/N<nnn>/samples/` folder, or where the developer names. Each spec is strict JSON, with no comment.
- **Draw each spec with `spn-devex docs figure draw <spec>`**, and look at it before you show it.
- **Read the flow file with `spn-devex docs figure draw <flow>.flow.json`.** It draws nothing, reads the file against the specs beside it, and names each finding above; hand the mock over when it says the file is clean.
- **Show the mock as the list of its files, in the flow's order**, each with the page it draws and the views it holds. Then give the tree, which the build reads: the mock and the build stand on the same tree.

## Close

Report the facts, the flow file and each page's views, and what is missing. The `ux` lens reads the mock at the design gate, as the skill's close says. The Figma step stays the way to the look: where the developer then asks for the drawing and the window holds the connector, run `steps/draw.md` from the same tree.
