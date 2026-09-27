<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/02-support/02-infra/07-trust.md", "seen": "a44d7a3e" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/07-trust/", "seen": "74f60a60" }
  ]
}
-->

# Trust — who may reach what, and how identity is proved between layers

Enforce and check what follows when an estate change touches access, a credential, or what is allowed to run. Nobody holds a permanent credential, and nothing runs that cannot prove where it came from — those two guarantees are this whole file.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| Plane | — | one of four separate surfaces access can be granted through: data, human, workload, configuration |
| Membership | — | what a person or a service actually holds; a credential is minted briefly from it |
| Guardrail | — | an organization-level policy that can only refuse, never grant |
| Break-glass role | — | a role for the emergencies the ordinary role sets deliberately cannot cover; assuming one raises an alarm |
| Plan mode | `SPEstateProvisionModeType.PLAN` | a run that shows what would change and reaches no account, so it needs no credential |
| Apply mode | `SPEstateProvisionModeType.APPLY` | a run that performs the change; against a cloud realization it also takes an explicit approval |
| Digest | — | the identity a build produces once; every later claim binds to it and is promoted forward unchanged |
| Attestation | — | a signed record of what an artifact contains and how it was produced, bound to the digest |
| Admission | — | the point where the runtime refuses anything carrying no valid attestation |
| Evidence | — | findings, audit trails and configuration history, flowing continuously into an account that can deploy nothing |

## The four planes never grant through one another

**MUST.** Access is granted through exactly one of four planes, and none of them ever stands in for another.

| Plane | Its subjects | Where its grants come from |
| --- | --- | --- |
| data | applications, migrations, tooling | the baseline's role factory; a migration owns what it created |
| human | employees, contractors, auditors | the estate declaration |
| workload | running processes and pipeline jobs | the application's coordinate-scoped share of the platform baseline |
| configuration | every application, every runtime | the application's own coordinates |

A person **MUST NOT** be granted access through an application's database credentials, and a workload **MUST NOT** take on a person's permissions. If you find a place where one plane's grant is being used to stand in for another, that is the defect this rule exists to name — report it rather than routing around it.

Access is never something held once and kept. What is actually held is a **membership**; a credential is minted briefly from it and expires. A membership somebody was never given is not a smaller grant — it is nothing, the same way a repository you cannot see is not a repository you were refused.

## Identity flows from one place, to two providers

The company's identity provider feeds both the cloud and the repository host. Group membership flows outward from there rather than being maintained twice, so the permission sets that govern an account and the teams that govern a repository **cannot drift into disagreeing about who a developer is**.

**The groups are derived from the declaration, never created by hand.** A product's roles are a function of its code and its workloads, so adding a product adds its groups and nobody maintains a table by hand. Adding a person is one group membership, and every credential, profile and repository grant follows from it. A group that exists with no declaration producing it is drift, reported by name rather than assumed intentional.

## What a cloud act needs, and how it refuses

Every provisioning run names its own mode, and there is no default.

- A **plan** reaches no account and changes nothing, so it needs no credential. Rehearse the riskiest path — the first cloud walk a new company takes — before any account exists.
- An **apply** performs the change; against a cloud realization it also takes an explicit approval.
- A run naming neither mode, or naming both, **MUST** be refused (`RD.INFRA.094`).

**The credential check reads the provider the estate declared**, expects that provider's own session variables, and refuses by naming the provider when they are absent. Nothing in the driver names a vendor — a session holding a different provider's credentials reads as holding none. That fails safe, not dangerously, but it is still worth surfacing as a defect if you see it happen.

## You hold no privilege of your own

You run as whoever invoked you. A developer who cannot assume a role cannot make you assume it either, and the refusal **MUST** come from the provider, never from a policy you consult yourself. A check you perform is advice; a role the caller cannot hold is enforcement, and only the provider can enforce it.

What you add is failing early and by name: state the role a layer needs, the roles the caller can actually assume, and who to ask. Surface that before an apply runs for twenty minutes and fails at the end — never let a role gap surface only after the run has started.

## Guardrails deny; they MUST NOT grant

Organization-level policies back every plane, and every one of them can only refuse.

| The refusal | What it stops |
| --- | --- |
| no identity users | a permanent credential attached to a person or a machine |
| no wildcard actions | a grant nobody can read the extent of |
| no publicly readable data stores | a store reachable without passing the edge |
| no untagged resources | anything created outside the declaration |
| no decryption across an environment boundary | one environment reading another's data, however valid its role |

The last one carries two jobs. It is the line that holds when every other limit has already failed — a stolen non-production role still cannot read production data, because the key policy itself refuses. And it is what makes a single workload account safe to span regions, because keys are per environment: a principal scoped to one production environment cannot reach another's data even holding a valid role in the same account.

A guardrail that grants anything is not a guardrail — it is a permission wearing the wrong name. Treat any policy that adds access, rather than only removing it, as a defect regardless of where it sits.

## Policy is workload-scoped; its instances are environment-scoped

Network rules are defined once per workload and instantiated per environment. The objects they attach to belong to an environment's own network, and that only works because **adjacency is expressed by identity, never by address range**. A data store accepts traffic from the named upstream, never from a range somebody can widen later. That is what lets one rule shape be shared between environments without loosening it for any of them. An adjacency rule written as an address range is a defect — it widens the moment the network grows, silently.

## Evidence and change never meet

Auditors reach exactly one account, and it is the one that cannot deploy. An audit therefore never requires handing out access to something that can change what is being audited. The audited **MUST NOT** custody their own evidence.

Break-glass roles exist for the emergencies the ordinary role sets deliberately cannot handle, and they are expected to go unused. Assuming one raises an alarm rather than merely appearing in a log — a break-glass assumption is an incident signal by definition. A role that alarms only when misused is a role somebody will start treating as routine; do not let that drift stand unremarked.

## The chain from a commit to an admitted process

Each hop adds one claim, and every claim travels with the artifact rather than beside it.

| Hop | What it adds | How it fails when done wrongly |
| --- | --- | --- |
| build | the digest — the identity | a rebuild per environment, which invalidates every test that ran |
| scan | findings in the source, the dependencies and the image | a gate on the build rather than on promotion |
| attest | a record of the contents and provenance, bound to the digest | a claim that lives only in a log |
| promote | an approval, skipping no rung | production entered as a side effect of a merge |
| admit | the runtime refusing whatever carries no attestation | a policy in the pipeline, which is what an attacker edits |

**A failing scan MUST block promotion, never the build.** A build that cannot complete tells you nothing; an artifact that cannot advance tells you exactly what to fix, with the evidence still attached to something that exists.

*Every release is trusted* cannot be a convention of the pipeline, because the pipeline is the thing an attacker edits. **The runtime admits what carries a valid attestation and refuses everything else, MUST**, so the guarantee holds even when the process that was supposed to produce it did not. A deployment credential is scoped to an environment's grant rather than to a workflow file for the same reason: a control that lives only inside the thing being controlled is not a control.

That gives *what is running in production* one answer with a chain behind it — a digest traceable to one commit, one build, one scan, one attestation and one approval. If you cannot trace a running digest back through all five hops, treat that as unproven rather than assume the chain held.

## The instruments are installed, never connected

Scanners are stood up by the platform layer, into whichever cloud the organization already declared. A platform is scanned for the same reason it is observable: it was provisioned. Nothing waits on a team choosing a vendor, and no capability is missing on the first apply — there is no window in which a platform is running but unscanned because a purchase had not finished.

## Evidence is a by-product

Findings, audit trails and configuration history flow into the observing accounts continuously, so compliance is a query rather than a project. The accounts that receive them can deploy nothing, which is what makes the record worth trusting.

**What is unproven MUST say so.** A claim with no evidence behind it is reported as unproven rather than quietly left out, because a report that hides its gaps is worse than no report — it gets believed. When you cannot establish a fact about what is running, state that you could not establish it. Never fill the gap with an inference and present it as a finding.

## What must never appear in a declaration

The estate holds credentials and account boundaries, so a declaration carries coordinates and intent — never the identifiers a provider assigns.

| Never write, by hand, anywhere | What breaks when you do |
| --- | --- |
| an ARN | the estate stops being reproducible — the value is tied to one account that happens to exist today |
| an account id | a manifest that pins one becomes a manifest that only ever stands one estate up; a second estate built from it reads the wrong account and either fails or, worse, succeeds against the wrong one |
| a key id | the same identifier a rotation retires; a typed key id is a key id that silently stops matching the moment it rotates |
| a secret, typed in as a value | it is a secret in git forever — history does not forget, and rewriting it after the fact does not undo who already has a clone |
| a cloud provider's own string (a region name, an instance class) outside the cloud entry that owns it | the estate becomes unportable by spelling — a rename or a second provider now means hunting every place the string was copied |

**Every provider-assigned value is discovered by the tool holding the credential and recorded as resolved state, never typed by a person.** A value copied from a console into a manifest is a defect on sight, whatever excuse produced it — including a day-zero runbook that would otherwise have transcribed one by hand. Keep credentials in the config plane's own stores, whose only readers are the apply and the deploy; a credential in a manifest, an env file, or a doc has already left the plane that was supposed to hold it.

## What it makes checkable

| Defect | What it means |
| --- | --- |
| a plane granting through another | a person is using an application's credentials, or the reverse |
| a long-lived credential anywhere | something exists that cannot be rotated by expiry |
| a provisioning command that defaults its mode | a rehearsal and a real apply are indistinguishable to the person running them |
| a credential check that names a vendor | a session holding a different provider is read as holding none |
| an auditor with deploy access | evidence and change coincide in one principal |
| a guardrail that grants | a backstop became a permission |
| an adjacency rule written as an address range | the rule widens the moment a network grows |
| an artifact rebuilt per environment | every test that ran was against a different artifact |
| admission accepting an unattested image | trust is a pipeline convention again, and an attacker can edit it |
| a report omitting what it could not establish | a gap was presented as a pass |
| an ARN, an account id, a key id, or a typed secret in a manifest | the estate stopped being reproducible, or a secret entered git history permanently |
