<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/03-platform/02-modules/05-entities.md", "seen": "d1c0e534" },
    { "path": "spn-foundation/docs/04-capabilities/03-platform/02-modules/05-entities/", "seen": "014b94c9" }
  ]
}
-->
# Entities — the patterns every record type can opt into

**Source of truth:** the foundation's `02-constructs/03-platform/02-modules/05-entities.md` and its capability chapters. Read this as the restatement; the book governs.

## What it is for

**Build comments, attachments, tags and custom fields once per record type** and a product ends up with several slightly different versions of each, none of them quite finished. This module builds them once.

## How a type joins

**Opting in is declared once, in the registry, and not per pattern.** A type that opted into the registry gets the patterns it declared — there is no second switch per pattern to forget.

**A custom field is an organization declaring that a record type has an extra field**: its name, its type, how it renders, whether it is required. That is a customer's declaration, not a schema change.

## The distinction that matters

**An activity entry is not the audit trail.** Activity is what a person sees on a record — readable, editable in the sense that it can be added to, and about the record. The audit trail is evidence, never edited, and it lives in its own module. Using one for the other loses either the readability or the evidence.

## When you reach for it

**Any record a person comments on, tags, or attaches a file to.** Building that inside your module means building it again in the next one.
