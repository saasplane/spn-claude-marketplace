<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/12-language-design-language/01-common/01-design-language.md",
      "section": "A site's review walks the site",
      "seen": "bb7fc835"
    }
  ]
}
-->

# A site's review walks the site

Read this when the developer asks to review a site that is running, and at an arc's final re-check of one. A copy shows what a section was meant to be, and only the page shows what a visitor gets. One review read copies and never the live site after the carry, so a band's second feature shipped at the card's level and 32 of 109 media broke their sizes.

## The walk

1. **List the routes** of the site, one a line, from its menu and its sitemap. Leave none out.
2. **Run the script** `skills/design/scripts/site-walk.mjs`:
   `node site-walk.mjs --base <https://host> --routes-file <routes.txt> --out <folder> --shots`
   It visits every route at a phone (390), a tablet (834), the narrowest side-by-side width (1024) and a desktop (1440), in light and in dark, and reads computed values.
3. **Read what it reports**, by page:
   - **Media.** Each medium's scale and its smallest rendered text. A drawing under scale 0.5, or text under 11 px, is redrawn for its column (`RULE.SUPPORT.SURFACE.589` · MUST · skill:spn-surface/design).
   - **Hidden at rest.** Parts of a medium still at opacity 0 or hidden after every reveal played.
   - **Sideways scroll.** Any page wider than its window.
   - **The head.** Title, description, canonical link, share preview, language, one `h1` (`RULE.SUPPORT.APPS.269` · MUST · skill:spn-apps/implement).
   - **The root files.** `robots.txt`, `sitemap.xml`, the manifest and the favicon.
4. **A band's features read at one level** (`RULE.SUPPORT.SURFACE.587` · MUST · skill:spn-surface/design), and the bands follow the screen classes: phone under 768, tablet 768 to 1023, side by side from 1024 (`RULE.SUPPORT.SURFACE.588` · MUST · skill:spn-surface/design). A band that stacks at 1024 or stands side by side under it is a finding.
5. **Report** each finding with its page, width and mode, and put each one that is accepted on the arc as a row, in the reply that agrees it.

The script finds Playwright in the global install and changes nothing on the site. It exits 1 when it has a finding.
