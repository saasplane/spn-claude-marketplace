<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/10-library.md", "seen": "c8840176" }
  ]
}
-->
# Library — what the AWS half of the blueprint package ships

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/aws/10-library.md`. Read this as the restatement; that node governs.

**A provider ships a library, not a plugin.** The renderings travel as a versioned package the declaration pins, so an estate is bound to an exact set of blueprints rather than to whatever the library holds today.

## A folder per layer, plus the shared functions

The AWS half of the blueprint package carries a folder for each layer the declaration names, and one more for the computations they share.

| Folder | Renders |
| --- | --- |
| `ground/` | what the declaration validates and discovers before any layer runs |
| `organization/` | the account tree, the guardrails on it, the output store |
| `platform/` | one platform's own estate — registries, state, zones, certificates |
| `environment/` | one environment — the network, then the resources, then the compute |
| `deployments/` | what actually runs, which apps register into |
| `functions/` | the shared computations every layer above calls — names, addresses, tags |

**`functions/` is why the layers do not each compute a name.** A coordinate is derived once and read by every layer, so two layers cannot disagree about what a thing is called.

## A folder existing is not a layer rendering

**Read the list carefully, because it looks like coverage and is not.** The package holds a folder per layer; what [`01-realization.md`](01-realization.md) reports is which of those layers actually stands anything up on AWS today, and the answer there is still 🔮 for each of them.

**So the library is where the work lands, rather than the record that it has.** A folder of renderings nobody has run is a folder of renderings nobody has run.

## How it arrives

**Pinned, never floating.** The organization's declaration names the package and an exact version, so a blueprint change is unreachable until the organization releases with the new pin. A library that could change under a live estate is a library that changes estates nobody touched.

**One repository holds every provider instance and releases them together**, at one version. So *which provider am I on* never becomes *which versions am I on* — and a provider with no change in it is released anyway, at the new number.

**A pinned reference is a name and a version.** A path reference resolves only where a sibling checkout exists, which is every machine in the standard workspace layout and deliberately not CI.

## What it may never do

**The library holds the vendor knowledge, so the command surface holds none.** The moment `spnutils infra` knows an AWS service name, every other cloud becomes a special case of the first one.

**And a rendering names no coordinate of its own.** Everything it needs is computed in `functions/` from the declaration, because a name invented inside a rendering is a name nothing else can find.
