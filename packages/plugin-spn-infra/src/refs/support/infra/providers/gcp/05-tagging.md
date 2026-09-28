<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/gcp/05-tagging.md", "seen": "65d695c6" }
  ]
}
-->
# Tagging — the coordinates are fixed and the rendering is not

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/gcp/05-tagging.md`. Read this as the restatement; that node governs.

**Nothing states which Google Cloud facility carries the coordinates**, or which policy would make them mandatory on resources here.

**What to do instead.** Read [AWS tagging](../aws/05-tagging.md) for the only worked rendering, and take from them the coordinate set alone. The key casing, the policy mechanism and the drift detection there are AWS's, and copying them onto another cloud produces a rendering nobody wrote.

**Why this is a ruling rather than an absence.** The set is decided above every provider and derived from the declaration, so nobody types a value on any cloud. A Google-specific set invented here would be a second vocabulary describing one estate, and the two would answer an auditor differently.

## What is true today

**The write-time gate already carries this cloud's machine-type spelling.** A Google machine type is a family, a purpose and a core count joined by hyphens, and the estate laws refuse one written outside a profile's capacity keys.

**Every value the rendering would carry already exists.** They are coordinates, values derived from coordinates, or facts declared once in the manifest that owns the resource. That is why a hand-authored value is a defect on any cloud.

**So what waits on a realization is the carrier and the policy, never the set.**
