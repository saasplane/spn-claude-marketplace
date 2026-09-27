<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/02-support/02-infra/10-providers.md", "seen": "a16ca173" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/", "seen": "41e2e150" }
  ]
}
-->
# Infra providers — one declaration, rendered twice, naming no vendor

**Source of truth:** the foundation's `02-constructs/02-support/02-infra/10-providers.md` and its capability chapters. Read this as the restatement; the book governs.

**This is not `providers/aws/*`.** Those say what AWS actually does. This says what a provider *is*, and what the commands above it are therefore allowed to know.

## Why two engineers can run different infrastructure and read the same rule

**The rule and the place it runs are two different things.** One engineer on a laptop and one on a cloud account read the same rule about what a deployment is or how access is granted, because the declaration states the rule once — the planes, the deployment shape, the trust chain — and **names no vendor.**

**A provider is the second thing**: the place a declaration is rendered into something that actually runs.

## The rules that keep the surface clean

**A provider instance holds every fact about its vendor, so the command surface holds none.** The moment a command knows a vendor's name, every other vendor becomes a special case.

**The check reads which provider the declaration named** and expects that provider's own session values. It refuses by name when it cannot reach them — and it still names no vendor of its own.

**The tree follows the category vocabulary, and only the three domain roots are fixed.** A category names a port; an instance fills it.

## Local is a realization, not a binding

**Running on your own machine fills no category and names no account.** That is why local binds nothing: there is nothing to bind to.

**An unimplemented layer is absent, never stubbed.** An estate that cannot have organization accounts says so rather than showing empty ones — because a stub answers, and an answer you cannot trust is worse than a refusal.

## What a provider ships

**A library, not a plugin.** The renderings travel as a versioned package the declaration pins.

**One repository holds every provider instance and releases them as one version**, so *which provider am I on* never becomes *which four versions am I on*.

## What to ask of a new cloud

**What would it have to render, and what would the commands above it have to change?** If the second answer is anything but *nothing*, the boundary has been drawn in the wrong place.
