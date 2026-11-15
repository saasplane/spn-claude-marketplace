<!-- This file declares the design track and states no rule. A page's or a unit's look is decided on the arc's preview before the go and is never a pass. -->
# The design track

Read by table header, never by position. A fix in the full run that changes a unit changes the book first, so the draw follows it and the publish waits until the run is green.

| Pass | World | Holds | Proof | After | Runs with | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| draw | SURFACE | the library's units drawn by the plugin from the book's construct snapshot `refs/support/surface/construct.snapshot.json` | read back against the snapshot | book | the code passes | — |
| publish | SURFACE | the developer's click in Figma | the published library and the released code agree | draw | the release | the repository's full run |
| Runs only when | — | the library is in sync with the book and its drawing tool has landed | — | — | — | — |
