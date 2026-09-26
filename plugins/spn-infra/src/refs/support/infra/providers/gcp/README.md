<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/gcp/README.md", "seen": "81aff186" }
  ]
}
-->
# Google Cloud — the folder exists and the realization does not

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/gcp/README.md`. Read this as the restatement; that node governs.

**No Google Cloud realization exists, and none is being designed.** Say that plainly when somebody asks. There is no partial support, no planned date, and nothing here to read for guidance on standing an estate up on it.

**The folder is here because the provider axis is deliberately open**, the same way a second stack sits beside `ts` with nothing in it yet. An axis with exactly one occupant reads as a model that assumes that occupant, and the assumption is what makes the second one expensive.

## What is nevertheless true today

**The estate laws already know this cloud's spellings.** `scripts/providers/gcp/validate-manifest.ts` carries Google's region and machine-type patterns, and the write-time gate runs it on every declaration — so a Google region typed into a manifest is refused now, before any realization exists.

**That is deliberate and it is not the same as support.** The gate exists because somebody moving an estate between clouds is exactly who types the wrong cloud's strings, and the moment they do it is the moment the refusal is worth most.

## What to tell a partner

**The estate declaration is provider-agnostic, so nothing they write today is wasted.** What is missing is the realization — the code that turns the declaration into accounts, networks and compute on this cloud — and building it is a piece of work nobody has started.
