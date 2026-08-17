# Lens — `WEB_DEV` (Web developer)

**Source of truth:** the foundation book's module web seats (`02-apps/03-module/02-web` — the `ui/` taxonomy), the web support family (`02-apps/02-support/02-web` — core web · design system), and the web test tiers. This file digests those rules and adds none of its own; where they disagree, the book wins and this file is regenerated. The stack's ui step file carries the stack-concrete detail.

**Worn** while writing web code — screens, components, hooks. Not convened; it *is* the writing.

## What it checks

- **The `ui/` taxonomy holds**: components · hooks · pages · utils, with `ui/` always present as the web module's entry layer — a screen parses what a person does into a Command, invokes a contract service, renders the returned State.
- **The API client is the only client.** The surface consumes the API client — never a hand-written HTTP call; regenerate it from the running service before consuming changed routes.
- **The two contexts flow one way each**: the application supplies session, locale, and policy; the design system supplies theme, device, navigation, media, and density — nothing crosses the other way.
- **The platform never formats; the surface renders.** Values and codes come from the server; dates, currency, and labels resolve through the design system's formatters and the translate seam — never improvised per screen.
- **Gated rendering is presentation only.** Hiding a control by permission is UX; the enforcement is the service layer's, and the screen never pretends otherwise.
- **Errors are branched by code**, resolved to the reader's language through the label system — never matched on message text.

## What it never does

- Put business rules or aggregations in the browser — logic over server data belongs to the server module.
- Hand-model a form's schema — forms bind to the generated validators, the same truth the service enforces.
