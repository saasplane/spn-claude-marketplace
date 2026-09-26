<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/09-deployments.md", "seen": "e6ad504a" }
  ]
}
-->
# Deployments — there is no layer command, and that is the ruling

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/aws/09-deployments.md`. Read this as the restatement; that node governs.

## What is not here

**No AWS rendering of the deployments layer exists.** The layer is named in the blueprint order and nothing renders it, because the layers beneath it do not render either. There is also no `spnutils infra deployments` command, in this realization or in any other, and none is planned.

## What to do instead

**An app joins an environment by registering, never by being deployed at.** `spnutils infra app up` registers the app against the layers already standing — its schemas, its certificate binding, its ingress entry. Locally that is the whole story, and the local provider does it today.

**On AWS, a release rides the delivery pipeline.** The pipeline assumes its deploy role through [`03-session.md`](03-session.md), reads the image the control center's registry already holds, and promotes the digest that was built once. No estate command puts code into an environment.

**A change to the estate underneath still names its own mode.** `up` and `down` each take exactly one of `--plan` or `--apply`, with no default, and `tofu apply` and `tofu destroy` are never run by hand.

## Why this is not a gap

**`DEPLOYMENTS` is a blueprint layer, not a command noun.** It names where running things sit in the order — after the environment that holds them — so the model can state what depends on what. A layer earns a command when a person has to bring it up, and this one is brought up by the pipeline on every merge.

**A command here would create a second way to put code into an environment.** Two paths means one of them is the path nobody audits, and the estate driver would have to hold release logic the pipeline already holds. The absence is what keeps the delivery path single, and what keeps the estate's job to the ground the code lands on.
