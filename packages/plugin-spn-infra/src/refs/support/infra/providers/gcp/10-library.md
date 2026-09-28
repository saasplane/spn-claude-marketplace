<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/gcp/10-library.md", "seen": "8cbf2cf0" }
  ]
}
-->
# Library — no blueprint package ships for this cloud

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/gcp/10-library.md`. Read this as the restatement; that node governs.

**No blueprint library exists for Google Cloud.** Nothing renders any layer here, so there is no package for a declaration to pin and no version to choose.

**What to do instead.** There is nothing to install. Do not write renderings for this cloud inside a company's own estate repository while waiting, and do not vendor another cloud's library and edit it.

**Why this is a ruling rather than an absence.** A blueprint is shipped, never authored ([blueprints](../../blueprints.md)), and that is what makes an estate reproducible by somebody who has never seen it. Hand-written renderings in a company repository would compete with the real library rather than be replaced by it, and the estate would hold two answers for what a layer stands up.

## What is true today

**The arrival shape is already decided.** A provider instance ships a library, not a plugin ([providers](../README.md)), so a new cloud arrives as a dependency something takes rather than as a slot something registers into.

**One repository holds every provider instance and releases them as one version**, because the layers read each other's published outputs. A version skew between two instances would be a defect.

**So a Google Cloud library would be pinned at the same version as its siblings**, by a declaration that already knows how to pin one ([packages](../../packages.md)). What is missing is the package.
