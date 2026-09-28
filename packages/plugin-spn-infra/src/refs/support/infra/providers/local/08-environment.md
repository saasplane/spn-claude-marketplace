<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/08-environment.md", "seen": "a43d7c4a" }
  ]
}
-->
# Environment — refused by name

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/08-environment.md`. Read this as the restatement; that node governs.

**The environment layer has no local form at all, and pointing the environment noun at a machine is refused by name.** `spnutils infra environment plan | up | down | status` takes an `{env}` and requires `--cloud`. The refusal is the answer this page gives, not a note about work still to come.

## What to do instead

**The machine is one environment, so the layers above and below it already give you everything.** `spnutils infra platform up` stands the engines and the modules; `spnutils infra app up` attaches your applications. Neither takes an `{env}`, and no local name carries an environment token.

**To exercise a real environment, target the cloud by name.** `--cloud` is the target you ask for, and a plan reaches no account, so the whole walk can be rehearsed before an account exists. `up` and `down` each take exactly one of `--plan` or `--apply`, with no default, and `tofu apply` or `tofu destroy` is never hand-run.

**To work against a real environment's data, attach to one — and only to one in the non-production workload.** That limit is derived rather than imposed: the workload boundary keeps conditioned data and real customer data inside their own accounts, and your machine is inside neither.

## Why this is a ruling rather than an absence

**An environment is a derived thing, and the things it derives from do not exist on a machine.** The coordinates `{region}` and `{setup}` resolve to a workload account, a network slice from the address formula, a template and a size. A laptop has no account, no address block to allocate and no workload boundary to sit inside.

**A local environment command would therefore have to invent a coordinate nothing derives.** The invented value would then flow into names, into the configuration tree and into the parameter paths, and each would be a second spelling of something the estate never declared.

**A refusal is legible where an empty success is not.** A command that quietly did nothing would leave you believing the layer had been satisfied.
