<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/03-platform/02-modules/05-entities.md",
      "seen": "aaaf2b5d"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/03-platform/02-modules/05-entities/",
      "seen": "27b98165"
    }
  ]
}
-->
# Entities — the patterns every record type can opt into

**Source of truth:** the foundation's `02-constructs/03-platform/02-modules/05-entities.md` and its capability chapters. Read this as the restatement; the book governs.

## What it is for

**Build comments, attachments, tags and custom fields once per record type** and a product ends up with several slightly different versions of each, none of them quite finished. This module builds them once.

## How a type joins

**Opting in is declared once, in the registry, and not per pattern.** A type that opted into the registry gets the patterns it declared — there is no second switch per pattern to forget. Custom fields and tags are opt-in patterns, and a third capability, `LOOKUP`, makes a type a data source an autocomplete field may pick from.

**A custom field that picks from a list names a registered type.** Its source is the code of a registered entity type that opted into `LOOKUP`, as the contract spells it, and the type's records are the list. The custom-field form chooses the records through the owning module's `<State>Autocomplete` and its `use<State>OptionSource`, which a type that opts into `LOOKUP` owes its web module. The module refuses a source on create and on edit when the type is not registered or did not opt in. A stored field whose type later leaves the registry is kept and reads as a source that is unavailable. Whether a saved value's ids still exist in the list is not checked yet.

**A custom field is an organization declaring that a record type has an extra field**: its name, its type, how it renders, whether it is required. That is a customer's declaration, not a schema change.

## The distinction that matters

**An activity entry is not the audit trail.** Activity is what a person sees on a record — readable, editable in the sense that it can be added to, and about the record. The audit trail is evidence, never edited, and it lives in its own module. Using one for the other loses either the readability or the evidence.

## When you reach for it

**Any record a person comments on, tags, or attaches a file to.** Building that inside your module means building it again in the next one.
