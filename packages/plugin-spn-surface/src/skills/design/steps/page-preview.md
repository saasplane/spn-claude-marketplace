<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The surface preview",
      "seen": "651b15c4"
    }
  ]
}
-->

# The surface page

Read this when the developer asks to review the pages of a site or an app, such as the SaaS Plane site or the hiring demo site, and only once the app's design language exists. Before it exists there is nothing for a page to follow, so the review is of the design language, on the arc's page (`steps/design-language.md`).

A surface page is one file, `surface-page-template.html` in `templates/surface/`: a bar and the page's markup in one `<template id="page">`, and nothing else. The bar carries the page's title, the width switch, the mode switch and Notes, which is off by default. The shared script builds the frame's document from the template: it links `design-system.css` at the version the `surface-ds` meta names, links the app's stylesheet from the `surface-app-css` meta, sets `data-mode` from the mode switch and sizes the frame by the width switch.

## The order

A page that exists only as a design is rendered from its tree; a page that runs is copied. Both stand in the same surface page.

0. **Render a page designed before code.** Write the page as a tree (`<page>.tree.json`, `treeVersion` at its top) and run `spnutils apps surface render --app <code> --file <page>.tree.json --modes <modes> --devices <devices>`, where `<code>` is the app's short code in its design-language row, `--modes` is `LIGHT`, `DARK` or both, and `--devices` is `DESKTOP`, `TABLET`, `PHONE` or any of them. A choice left out is refused, never defaulted. It prints `{ "renderVersion", "ds", "app", "renders" }`, the HTML of each mode and device asked for keyed by their values, each copy `{ "html", "findings" }`, and writes no file; the output is markup only, and the surface page links the design system's stylesheet at the version `ds` names and the app's language stylesheet, and sets `data-mode`. Put each copy's `html` in the page's template, and treat a finding as an open drawing fix. Never edit a unit's markup in the output: change the tree and render again (`RULE.SUPPORT.SURFACE.579-585`).
1. **Copy each running page.** After the design language, run `spn-surface page copy <url> <folder>` for each page, where `<folder>` is a working folder beside the page. It writes one self-contained `index.html`, with the page's style inlined, its scripts removed and its fonts beside it; the body of that page is what goes in the page's template. The site is only read, and nothing in it changes. A page that is not running yet is built in the worktree first, never drawn by a second renderer.
2. **Apply what was decided in the copy only.** The decided sections, media and words are changed in the copy and never in the site, so the site stays as it is until the go. A medium is placed as the design language's section layers say, and a section's background is its own `mediaNode`.
3. **Write each section's note from its case line.** The case line is the one line a section already has (`site-patterns.md`). Put the notes in a notes file, `[{ "title": "<the section's heading>", "note": "<line>" }]`, and give it to the command with `--notes <notes.json>`; each note is pinned to the section whose heading carries that title and stays hidden until the bar's Notes is on. Run the copy again after a note changes.
4. **Write the surface page from the template.** Copy `surface-page-template.html` and fill the page's name, the design system's version, the app's stylesheet and the page's markup, nothing more. The bar, the frame and the template are all the page holds, and its `spn:doc` variant is `surface-page`, so the docs check holds it to the template and the state check never counts it as the arc's second page.

## A group of pages

- **A group has one layout sample, `00-layout`**, that shows the app's top navigation and footer once, with the menus open and the phone drawer. Every other page of the group shows its own content only, and a page shown alone keeps its layout.
- **A few surface pages are linked from the arc's page.** Many go in a samples group under the one index, which `spn-devex docs index write <samples folder>` produces from the pages on disk, and the arc's page links the index alone.
- **A design language's samples are one samples home, the index page, with each sample in a surface preview.** They live in the repository that owns the language, in `docs/artifacts/design-languages/<language>/`: `index.html` is the home, made from the index template; `shared/`, `site/` and `app/` hold one folder per group, each sample two files named by its slot, the page itself and `<slot>.preview.html`, the surface page that holds its markup; `assets/` holds what the pages load. The home has no sidebar of its own. Every language presents the one standard outline, Shared, Site and App, each run through Theme, Layouts, Pages, Containers, Widgets, Media, Motion and Words, and a sample the language leaves out keeps its entry as a short page marked *None* or *Inherited*. The list of samples is data beside the spec, `docs/specs/design-languages/<language>.samples.json`.

## Traps

- **The page names its design system and its stylesheet in two metas.** The `surface-ds` meta holds a version and the `surface-app-css` meta a relative path, and the page's markup holds no SaaS Plane name, so a partner's site and the book's own sample are made the same way. `spn-devex docs check` refuses a surface page without the template, the two metas or the bar (`RULE.DEVEX.WORKSPACE.535`, `.536` · MUST · skill:spn-devex/ideate).
- **Check a page sample against the current standard for its kind before you edit it** (`RULE.DEVEX.WORKSPACE.547` · MUST · skill:spn-surface/design). A page designed before code is rendered from its tree (step 0), and a running page is copied (step 1). A hand-made page is made again that way, and when a tool or rule a sample depends on lands, a row goes on the arc to re-cut it (`RULE.DEVEX.WORKSPACE.546` · MUST · skill:spn-devex/ideate).
- **The frame's document, the metas and the note marker change only with a new stylesheet version.** Never edit them in a page.
