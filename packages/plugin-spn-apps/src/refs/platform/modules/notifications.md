<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/03-platform/02-modules/03-notifications.md",
      "seen": "e59707bb"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/03-platform/02-modules/03-notifications/",
      "seen": "414e8cad"
    }
  ]
}
-->
# Notifications — composed once, delivered through a seam

**Source of truth:** the foundation's `02-constructs/03-platform/02-modules/03-notifications.md` and its capability chapters. Read this as the restatement; the book governs.

## What it is for

**Compose each message by hand inside the module that triggers it** and every rebrand becomes a code change, every channel becomes a vendor call, and a message that never arrived leaves no record anywhere.

**So a module raises an event and this module composes and delivers it.** The trigger knows what happened; it does not know how it reaches anybody.

## The catalog is filled by the modules that send

**A sending module hands NTF its own group, its actions and their default emails, and NTF applies them; no module's migration writes NTF's tables** (`RULE.PLATFORM.MODULES.033` · MUST · skill:spn-apps/implement). The contribution is an `NTFMigrationContribution`, which NTF applies in its own migration hook once for each module and version, so a repeat changes nothing. A module in another service sends it through the platform's one remote-migration route. NTF names no product's actions itself, so a partner's module adds its own the way HIR does.

## The distinction people collapse

**Whether a template is locked is not the same question as whether an organization category may customize at all.** One is about this template; the other is about what that category is offered. Answering the first when you were asked the second is how a customization arrives that nobody meant to grant.

## When you reach for it

**Anything a person receives outside the application.** A module sending its own mail has taken the delivery problem, the retry problem and the audit problem along with it.
