<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/03-platform/02-modules/04-documents.md",
      "seen": "422eca62"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/03-platform/02-modules/04-documents/",
      "seen": "11ee9886"
    }
  ]
}
-->
# Documents — a key is derived, and its first segment is the access class

**Source of truth:** the foundation's `02-constructs/03-platform/02-modules/04-documents.md` and its capability chapters. Read this as the restatement; the book governs.

## What it is for

**Build file handling against one storage vendor's own library** and the day the vendor changes, every module that ever touched a file changes too. This module is the seam that stops that.

## The key grammar, which is where mistakes happen

**The key's first segment is the access class**, and everything after the first slash is this module's business. **Only the two roots are the foundation's.**

**A key is derived, never authored, and carries no application segment.** A key somebody typed is a key that will disagree with the record it names.

**A file's class is stamped when the record is created and never changes.** Re-classifying a stored file would move it, and a moved file is one every existing reference stops finding.

## When you reach for it

**Any binary a person uploads or downloads.** A module writing to storage directly has taken the classification and retention rules with it, silently.
