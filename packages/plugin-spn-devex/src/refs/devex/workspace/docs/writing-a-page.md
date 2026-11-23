<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "seen": "76fc037b"
    }
  ]
}
-->

# Writing a page — the runbook

**Source of truth:** the artifacts chapter (`04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md`), RULE.DEVEX.WORKSPACE.560. This file restates it as one runbook and adds no rule. **The book governs.** Read it when you are about to write a page, any page the developer will open: it says which template, which command, and what makes the page done.

**A page that reaches the developer holds no placeholder and no empty section.** A `{{…}}` left from a template, a heading with nothing under it and a section whose only content is a placeholder are each a finding, and a reply that links such a page is refused.

## The six steps

1. **Pick.** The kind of page decides the template.

   | The page is | Its template | Made by | Lives |
   | --- | --- | --- | --- |
   | a workstream's approach page | `approach-template.html` | `workstream open` | the workstream's folder, `approach.html` |
   | an arc's page | `arc-template.html` | `docs page new arc`, or the arc's own write | `notes/<arc>/preview.html` |
   | the index of artifacts, or of an arc's samples | `index-template.html` | `docs index write` | the pocket's `index.html`, or `samples/index.html` |
   | a surface page | `surface-page-template.html` | `docs page new surface-page` | `notes/<arc>/samples/` or the pocket's `surface/` |
   | a construct, overview, guide, hub or report page | its own template | `docs page write <seat>` from a seat | the pocket's `docs/` or `reports/` folder |
   | anything else | `page-template.html` | `docs page new page` | where its subject is |

2. **Start.** `spn-devex docs page write <seat>` for a page that comes from a seat. `spn-devex docs page new <kind> <path> [--name <name>] [--workstream <NNN-subject>] [--arc <arc>]` for a hand page: it copies the kind's template, fills the workspace's name, the numbered names, the breadcrumb's links, the stylesheet and script links at the newest cut with their hashes, today's date and the arc's and workstream's links, refuses a path that exists, and prints each placeholder still left with the line of the template's comment that explains it. The kinds are the templates': `approach · arc · index · surface-page · construct · overview · guide · hub · report · blocks · page`.

3. **Fill.** The masthead's three levels first (Title, Subtitle, Description). Then each section: its block by rule 549 (`blocks.md`, the table of which content takes which block), its figure by rule 548, its words by the voice. Every placeholder is filled and every section holds something, or the section is removed where the kind allows it. A section is never left with its heading and a placeholder.

4. **Check.** `spn-devex docs page check <file>`: no placeholder, no empty section, no finding. Act on every hint too; a hint is the block or figure the page should have used.

5. **Look.** `spn-devex docs look <file>`, in light and in dark, at the Mac widths of the Docs design language. A page you have not looked at is a page you have not seen.

6. **Hand on.** Link the page where it belongs: an arc's page from the approach page's Plan row, its samples from the arc's page, and a samples folder holds HTML pages only. Hand the developer the page's whole `file:///` address.

## While the tools change

When the work changes the tools themselves, a command, a check or the stylesheet, run them from the branch's source (`node packages/plugin-spn-devex/src/scripts/cli.ts …`), check each step on the arc's samples, and build, cut (only if a stylesheet changed) and run the touched tests once at the end (RULE.DEVEX.WORKSPACE.559).
