<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/05-tagging.md", "seen": "ed4c198f" }
  ]
}
-->
# Tags on AWS — the seven, and why nobody types one

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/aws/05-tagging.md`. Read this as the restatement; that node governs.

**Design of record — nothing is provisioned on AWS yet.**

**An auditor, an incident responder and a finance lead all ask the same three questions about a resource**: whose is this, what is it for, and what data does it hold. Tags are how a resource answers without anybody being paged.

## The seven, on every taggable resource

**Keys are PascalCase and values are lowercase.** No exceptions, because a mixed-case value is a value that silently fails every filter written against it.

| Tag | What it answers | Format |
| --- | --- | --- |
| `Name` | the resource's full derived name | `{env}-{cloud-service}-{name}` — `in-uat-alb-public` |
| `Team` | who owns it, for cost and for paging | a lowercase team code — `platform`, `product`, `devops` |
| `Region` | the **governance** region, where the data may legally live | `{region}` as ISO 3166-1 alpha-2 — `in`, `us`, `eu` |
| `Setup` | the deployment's lifecycle purpose | `dev` · `uat` · `stg` · `prod` · `demo`, or a customer-dedicated code |
| `Env` | the full environment coordinate | `{region}-{setup}` — `in-uat` |
| `Workload` | which isolation boundary, and therefore which account | `prod` · `np` · `stg` |
| `DataClass` | what the resource holds | one of the nine below |

## `Region` is the jurisdiction, never the provider's region

**This is the one that gets confused, and confusing it breaks the residency evidence.** `Region` carries the governance coordinate — the jurisdiction the data-residency obligation attaches to — never the provider region that happens to serve it.

| `Region` | provider region | the residency claim |
| --- | --- | --- |
| `in` | `ap-south-1` | India |
| `us` | `us-east-1` | United States |
| `eu` | `eu-west-1` | European Union |

**An auditor filters on `Region=in` and gets everything inside the India boundary**, whichever provider regions serve it. Carry `ap-south-1` in the tag instead and the filter becomes a question about AWS rather than about the law.

## `DataClass` is the tag that decides things mechanically

**It decides encryption strength and retention mechanically**, so it is not a label somebody picks to be safe — picking a higher class costs real money and picking a lower one loses evidence.

| Value | Covers | Encryption | Retention |
| --- | --- | --- | --- |
| `public` | freely shareable | provider-managed | standard, 1–3 y |
| `internal` | internal business data | provider-managed | standard, 3–5 y |
| `confidential` | financials, strategy | customer-managed key | extended, 5–7 y |
| `restricted` | legal, M&A | CMK + least privilege | long-term, 7 y+, legal hold |
| `pii` | personal data | CMK + least privilege | regulation-bounded, erasure applies |
| `phi` | health data | CMK + HIPAA controls | HIPAA, 6 y+ |
| `pci` | cardholder data | CMK, in PCI DSS scope | PCI DSS, 1–3 y |
| `anonymized` | identifiers removed | provider-managed | standard, 3–5 y |
| `logs` | trails, flow logs, application logs | CMK | compliance-driven, with an immutable copy in the governance account |

## Nobody types a tag

**Every value above is derived from the coordinates the declaration already carries.** A tag written by hand is a second source for something the estate computes, and it will disagree with the computed one exactly when somebody is trying to answer an audit question.

**So a hand-written tag is a finding, not a fix.** If a resource is missing tags, the rendering that made it is what needs changing.
