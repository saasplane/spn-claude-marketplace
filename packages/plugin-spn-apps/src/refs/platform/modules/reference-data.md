<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/03-platform/02-modules/01-reference-data.md", "seen": "b5e7c13f" },
    { "path": "spn-foundation/docs/04-capabilities/03-platform/02-modules/01-reference-data/", "seen": "29ae7299" }
  ]
}
-->
# Reference data — one list, one place to fix it

**Source of truth:** the foundation's `02-constructs/03-platform/02-modules/01-reference-data.md` and its capability chapters. Read this as the restatement; the book governs.

## What it is for

**Build a list of countries inside every module that needs one** and you end up with several different spellings of the same country, and nowhere to fix any of them. This module is the one place a shared list lives.

## The rule that decides how you extend it

**The registry itself is not a fixed list, and the capabilities are.** New reference types are expected and adding one is ordinary. What each type can *do* is the closed part — so a type cannot invent a behaviour, and every type behaves the way every other one does.

## When you reach for it

**A value that more than one module has an opinion about belongs here.** A value only one module ever reads is that module's own, and moving it here buys a dependency and no single source.
