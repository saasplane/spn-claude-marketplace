// The shell of a samples home's index.html, as the docs index template draws it: the head card, the tree's place and the data block the command writes.
// {{NAME}} {{PLACE}} {{SUMMARY}} {{SLUG}} are filled by the command, and {{DATA}} by the tree of pages.
export const INDEX_SHELL = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{NAME}} samples</title>
<!-- spn:doc
{"id": "{{SLUG}}", "variant": "index", "title": "{{NAME}} samples", "summary": "{{SUMMARY}}"}
-->
<link rel="stylesheet" href="https://saasplane.github.io/spn-claude-marketplace/assets/docs/1.17.1/docs-language.css" integrity="sha384-i6rhHn61fjNWwm9/gmvKkhKXP/sDSVNR0hTmkDa480EyhFsviavrOvsSAHsZzRkV" crossorigin="anonymous">
<div class="sds-index" id="index">
  <aside class="sds-index-side" id="index-side">
    <div class="sds-rail-head">
      <a class="sds-rail-brand" href="index.html" title="Open the first page of {{NAME}}" aria-label="Open the first page of {{NAME}}">
        <span class="sds-rail-mark"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg></span>
        <span class="sds-rail-words"><span class="sds-rail-name">{{NAME}}</span><span class="sds-rail-place">{{PLACE}}</span></span>
      </a>
      <button type="button" class="sds-index-toggle" id="index-toggle" aria-expanded="true" aria-controls="index-tree" aria-label="Show or hide the tree of pages" title="Hide the tree"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg></button>
    </div>
    <nav class="sds-tree" id="index-tree" aria-label="Pages"></nav>
    <div class="sds-rail-marks" id="index-marks" aria-label="Groups of pages"></div>
    <noscript><p class="sds-index-note">This index needs its script to list the pages. Start at <a href="index.html">the hub</a>.</p></noscript>
  </aside>
  <main class="sds-index-main">
    <div class="sds-pagebar" id="index-bar" aria-label="The page on screen"></div>
    <div class="sds-panes" id="index-panes"></div>
  </main>
</div>


<script type="application/json" id="index-data">
{{DATA}}
</script>
<script src="https://saasplane.github.io/spn-claude-marketplace/assets/docs/1.17.1/docs-index.js" integrity="sha384-v/QmXBUa53+BRBWdxh3erwPoYJ0SRcA7nvhAUvLG0uAK0yzDADzRxu5GerfXffNb" crossorigin="anonymous"></script>
`;
