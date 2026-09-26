<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/10-library.md", "seen": "c0e020ac" }
  ]
}
-->
# Library — what the local half ships

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/10-library.md`. Read this as the restatement; that node governs.

**A provider ships a library, not a plugin.** The renderings travel as a versioned package the organization's declaration pins, so a new provider is a library rather than a release of the tool ([blueprints](../../blueprints.md)).

**The command surface resolves and drives; the library provisions.** That split is what lets one surface serve every provider a partner might bind, and it is why nothing in the driver names a vendor.

## Where it ships from

**Libraries ship from the Support stage's infra half, one folder per provider instance, pinned by version in the estate declaration.** The package is `@saasplane/infra-blueprints` — by its own manifest, the layer modules the `spnutils infra` driver invokes, per provider category and instance.

**The pin is the delivery.** A change in that package reaches an estate only when the organization is released carrying the new version, and `spnutils infra show` reads the pinned version rather than any working tree ([packages](../../packages.md)).

## What the local target reads from it

**The provider-free derivation half.** Naming, tags, profiles and the published configuration vocabulary derive from coordinates and name no provider, so every target reads the same derivation. That is why a fixture host and a provisioned host are never two spellings of one name.

**The renderings themselves differ by execution, not by declaration.** Cloud renderings run under the engine; local renderings are compose trees the driver executes.

## Each module brings its own local rendering

**A module package carries its renderings and the tooling carries none** (`RD.INFRA.078`). Its `src/local/` holds one `docker-compose.yml` and what that file mounts, and nothing else: no build step, no host script, no path leaving the folder, no secret.

**The tooling resolves the package, selects the target's folder, and invokes the engine that reads it.** It parses neither rendering, so a module's local form is library content the declaration pins.

## Where the design chapters stop

**The chapters state the shape and do not enumerate a local folder set.** They name where a library ships from, what pins it, and that the local half is compose rather than engine renderings. **This page states no list**, because a list nothing in the book decided would be a second source that drifts from the package.
