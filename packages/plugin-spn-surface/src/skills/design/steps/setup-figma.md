# Step: setup-figma — the agent sets Figma up with the person

Read this step when the person asks to set up Figma, for a partner as for a builder, and when the check before drawing in `change-library.md` finds a font or anything else missing. The rules are stated in `refs/support/surface/delivery-library.md`, under "The agent sets Figma up with the person". This step says the order.

## What you check yourself

Check each one before you ask the person anything, and say what you found in one line:

1. **The connector,** by `whoami`. If it is not signed in, that is a hand step (below).
2. **The fonts.** Read the `Theme-Font` variables `text`, `display` and `code` of the library copy, then `figma.listAvailableFontsAsync()` for the three families they name. Figma hosts Geist, Geist Mono and Schibsted Grotesk, so the defaults need nothing. The connector sees the fonts Figma hosts and the fonts uploaded to the person's Figma account, and none that is only installed on the machine.
3. **The library copy.** The person's team holds SaaS Plane's library, copied from the Community page of the Support release the person uses.
4. **The Figma token,** by `spnutils workspace status`, only where the person builds a library of their own.

## What you decide with the person, one question at a time

Ask the next question only after the last is answered, and put a recommendation in each.

1. **The default fonts or their own.** The default is Geist for text, Schibsted Grotesk for the display steps of a site's pages and Geist Mono for code, and it needs nothing. For their own, walk the steps of the setup guide's "Your own font in place of a default": check that the licence allows web and design use, set the library copy's `Theme-Font` variable of that family (`text`, `display` or `code`) to the font's name, upload the font under its own name only if Figma does not host it, and bind `DSThemeText`, `DSThemeDisplay` or `DSThemeCode` with `@font-face` in the app's `src/assets/styles/index.css`. You write that rule in their code. No `spndesk/figma/fonts/` is written and no font is renamed.
2. **Their Figma plan.** On Professional each designer uploads a brand font; on Organization an admin uploads it once for the team.
3. **The library as it is, or one of their own.** Only a library of their own adds the Lab file, the `DS <n>-<Name>` files, the token and the plugin (`spnutils apps surface figma` writes the plugin when the CONSTRUCT snapshot exists).

## What the person does by hand

Name each only when it is due, and check it after the person says it is done:

- **Sign in to the connector.** Check with `whoami`.
- **Upload a brand font** in Figma's account settings, only if Figma does not host it. Check with the font list.
- **Copy the library** from the Community page. Check that the team holds it.
- **Save a named version, and publish.** The agent never publishes; the person saves a named version before your first change in a file.

Never ask the person to draw, rebind or confirm anything else in Figma.
