<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/03-platform/02-modules/02-translation.md",
      "seen": "8ae4045f"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/03-platform/02-modules/02-translation/",
      "seen": "c21ea064"
    }
  ]
}
-->
# Translation — two halves that look symmetrical and are not

**Source of truth:** the foundation's `02-constructs/03-platform/02-modules/02-translation.md` and its capability chapters. Read this as the restatement; the book governs.

## The one distinction that decides everything else

**A label belongs to the platform, so the platform translates it. Content belongs to an organization, so the organization translates its own.** The two halves look symmetrical and are not.

**They sit at different scopes, and mixing them up is expensive.** A label translated per organization becomes a thing every customer must supply before the product reads correctly. Content translated centrally becomes a thing the platform must know about somebody else's data.

## How a map changes

**The map is replaced whole rather than merged.** A merge leaves a key nobody meant to keep, and there is no way to tell it from one somebody still needs.

## When you reach for it

**Every string a person reads goes through it.** A string assembled from fragments in code cannot be translated, because the fragments carry no grammar.
