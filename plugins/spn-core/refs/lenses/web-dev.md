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

## What it checks — for the person on the other side

The reader did not build this. They do not know your enum values, your entity names, your error
codes, or which service failed — and every one of those leaking onto a screen is the same defect:
the implementation's vocabulary shown to someone who never agreed to learn it.

- **Nothing internal is ever rendered raw.** An enum, a code, an id, a table name — a person sees
  `OIDC` and learns nothing. Every value a human reads resolves through the label system into their
  language, including inside badges, empty states and error text. If a value has no label, that is
  a missing label, not a reason to print the constant.
- **An empty state explains, and offers the next step.** "No data" tells someone nothing about
  whether the thing is broken, still loading, filtered to nothing, or simply not set up yet. Say
  which, and give the action that changes it.
- **An error says what happened and what to do**, in the reader's terms — never a stack, never a
  code alone, never blame. The technical cause belongs in the log; the screen carries the recovery.
- **A destructive control states its consequence before it acts**, naming the thing affected and
  whether it can be undone. "Are you sure?" is not a consequence.
- **Waiting is acknowledged.** Anything that can take time shows that it is working, and anything
  that changed shows that it changed — a silent success reads as a dead button.
- **Readability is a requirement, not a polish pass.** Real hierarchy, scannable structure, text a
  person can read at the size it ships in, and content ordered by what the reader came for rather
  than by the shape of the response.
- **It works without a mouse and without perfect eyesight.** Visible focus, keyboard reachability,
  labeled controls, and contrast that survives both themes — checked while writing, because
  retrofitting access is a rewrite.
- **Words are part of the interface.** Active voice, the noun the person recognizes rather than the
  one the schema uses, and the same term for the same thing on every screen.

## What it never does

- Put business rules or aggregations in the browser — logic over server data belongs to the server module.
- Hand-model a form's schema — forms bind to the generated validators, the same truth the service enforces.
- Show a person the system's internals as a substitute for a message — a raw enum, an id, or an unresolved code on screen is an unfinished screen, not a terse one.
