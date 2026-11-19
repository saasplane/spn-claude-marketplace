<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The surface page preview",
      "seen": "eeb41049"
    }
  ]
}
-->

# The surface page preview

Read this when the developer asks to review the pages of a site or an app, such as the SaaS Plane site or the hiring demo site, and only once the app's design language exists. Before it exists there is nothing for a page to follow, so the review is of the design language, on the arc's preview (`steps/design-language.md`).

A surface page preview is the workstream's third page template, `surface-page-preview-template.html`: a bar and a frame and nothing else, over the copy of one page. The bar carries the page's title, the width switch, the mode switch and Notes, which is off by default. The copy, or the rendered page, is the work's own file and the preview only views it.

## The order

A page that exists only as a design is rendered from its tree; a page that runs is copied. Both stand in the same preview.

0. **Render a page designed before code.** Write the page as a tree (`<page>.tree.json`, `specVersion` at its top) and run `spnutils apps surface render --app <code> --file <page>.tree.json`, where `<code>` is the app's short code in its design-language row. It prints `{ "pages": [ { "html", "findings" } ] }` and writes no file; save each page's `html` as `.pages/<page>/index.html` beside the preview, and treat a finding as an open drawing fix. Never edit a unit's markup in the output: change the tree and render again (`RULE.SUPPORT.SURFACE.579-585`).
1. **Copy each running page.** After the design language, run `spn-surface page copy <url> <folder>` for each page, where `<folder>` is `.pages/<page>/` beside the preview. It writes one self-contained `index.html`, with the page's style inlined, its scripts removed and its fonts beside it. The site is only read, and nothing in it changes. A page that is not running yet is built in the worktree first, never drawn by a second renderer.
2. **Apply what was decided in the copy only.** The decided sections, media and words are changed in the copy and never in the site, so the site stays as it is until the go. A medium is placed as the design language's section layers say, and a section's background is its own `mediaNode`.
3. **Write each section's note from its case line.** The case line is the one line a section already has (`site-patterns.md`). Put the notes in a notes file, `[{ "title": "<the section's heading>", "note": "<line>" }]`, and give it to the command with `--notes <notes.json>`; each note is pinned to the section whose heading carries that title and stays hidden until the bar's Notes is on. Run the copy again after a note changes.
4. **Write the surface page preview from the template.** Copy `surface-page-preview-template.html` and fill the page's name and the copy's address, nothing more. The bar and the frame are all the preview holds, and its `spn:doc` variant is `surface-page-preview`, so the docs check holds it to the template and the state check never counts it as the arc's second preview.

## A group of pages

- **A group has one layout sample, `00-layout`**, that shows the app's top navigation and footer once, with the menus open and the phone drawer. Every other page of the group shows its own content only, and a page shown alone keeps its layout.
- **A few previews are linked from the arc's preview.** Many go in a samples group under the one index, which `spn-devex docs index write <samples folder>` produces from the pages on disk, and the arc's preview links the index alone.

## Traps

- **The copy names its own mode switch in its `preview-mode` meta and uses no SaaS Plane name.** A partner's site and the book's own sample are made the same way. Opened alone, the copy is just the page.
- **The bar's message, the meta and the note marker change only with a new stylesheet version.** Never edit them in a copy.
