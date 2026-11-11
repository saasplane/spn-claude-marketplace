<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/03-platform/02-modules/04-documents.md",
      "seen": "aff1985d"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/03-platform/02-modules/04-documents/",
      "seen": "0f7465c8"
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

## A public upload

**A visitor with no account sends a file to a module that declared the purpose, and the file waits until that module claims it.** A module declares each purpose in its migration contribution, and Documents stores it in `doc_public_upload_purpose`: the code, the module, the allowed types, the maximum size, the claim window, the uploads per source an hour, the files per claim, whether it is active, and its own quarantine ceiling, so one purpose's flood fills only its own quarantine. The uploads per source are counted by a keyed HMAC of the address, never a plain hash. A purpose is retired by turning it off and is never deleted. Documents refuses a code without the declaring module's prefix, a duplicate, and a size above its own.

**`createDocPublicUpload` is the one public door, with a rate limit and a challenge** (rule: a visitor's upload waits in quarantine, served by nothing, until the module that declared its purpose claims it with the one-time token · MUST). It returns a one-time upload token, a signed upload URL bound to the size, and when the URL expires. The browser sends the bytes to the store, not to the API.

**The upload waits in quarantine under the platform organization, and nothing processes or serves it there.** Only the declaring module claims it, by `claimDocPublicUploadInternal`, after its own checks. The claim checks the token, the purpose, the expiry, that it is used once, the size and the content, and the owner's storage limit, then moves the file into the owner's organization. The claim is single and idempotent per token and owning organization, so a retry returns the same file. A sweep deletes what is not claimed within the window. Malware scanning is not built, and nor is a sweep of owned files that no record names; both are carried to the follow-ups.
