<!-- spn:doc
{"id": "spn-infra-capabilities-estate-providers", "variant": "capability", "title": "Providers in spn-infra", "lenses": ["INFRA", "ARCHITECT"], "status": "DONE", "realizes": ["estate-providers"], "summary": "One folder per cloud, each holding a scripts half and no skills half — the validators a gate dispatches into, the spellings that belong to each cloud, and why the authoring stack rather than the instance decides which halves a provider has.", "keywords": ["provider", "cloud", "aws", "gcp", "scripts half", "discovery"]}
-->

# Providers in spn-infra

`For: DevOps / SRE · Architect` · `Status: ✅ DONE` · `Realizes: Providers`

`packages/plugin-spn-infra/src/providers/` holds `aws` and `gcp`, and each of them holds a scripts half alone. **A skills half is earned by changing the authoring stack**, and the cloud does not change it: an estate declaration is provider-neutral, and every rendering is written against OpenTofu whichever cloud it will reach. So the walk reads the same on every cloud, this plugin carries no skills half, and it is not expected to grow one. What genuinely differs is the resource vocabulary, which is a fact and therefore lives in the refs tree.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The AWS manifest parse | `packages/plugin-spn-infra/src/providers/aws/scripts/checks/manifest.ts` | AWS's region and instance-class patterns, and the shared rules run once over the text |
| The AWS rendering parse | `packages/plugin-spn-infra/src/providers/aws/scripts/checks/rendering.ts` | the rendering subject for AWS, which decides on the path alone |
| The Google Cloud manifest parse | `packages/plugin-spn-infra/src/providers/gcp/scripts/checks/manifest.ts` | Google's own region and machine-type patterns, which differ from AWS's by one separator |
| The Google Cloud rendering parse | `packages/plugin-spn-infra/src/providers/gcp/scripts/checks/rendering.ts` | the rendering subject for Google Cloud |
| The judgement each of them feeds | `packages/plugin-spn-infra/src/scripts/lib/provider-strings.ts` | the cloud-free rule, written as a factory taking one cloud's patterns |
| The gate that discovers them | `packages/plugin-spn-infra/src/scripts/checks/subjects.ts` | reads the folder, imports each cloud's validator per subject, names no cloud |
| Each cloud's vocabulary | `packages/plugin-spn-infra/src/refs/support/infra/providers/` | what that cloud calls things, restated as a fact rather than run as code |
| The proof | `packages/plugin-spn-infra/tests/unit/providers/t-subjects.mjs` | each cloud's spellings refused, each cloud's sanctioned homes allowed |

## Follows the pattern

- The two halves, and the rule that a gate never names an instance — [Providers](../../../02-constructs/01-devex/07-providers.md)
- The provider that carries both halves, because there the instance is the stack — [Providers in spn-apps](../../02-apps/plugin-spn-apps/06-providers.md)

## Special handling

### The rule is the domain's and the parse is the provider's

**Why** — *a rule says an account id is never pinned, which is true on every cloud*. What an account id looks like is that cloud's business, and keeping the two apart is what lets a cloud join by adding a folder rather than by copying a rule.
**What** — each validator declares its own cloud's patterns and then runs the shared rule bodies over the text. The rules themselves sit above every provider.
**How** — the text is parsed once and handed to every rule that applies, because four rules each masking the same text is four times the work at the moment a person is waiting. `packages/plugin-spn-infra/src/providers/aws/scripts/checks/manifest.ts`.

### A cloud is registered by having a folder, and nothing else

**Why** — *a list of clouds written anywhere is a list somebody has to keep current*, and the gate is the worst place for it to live.
**What** — the gate reads which folders the providers tree holds, sorted so the order is stable, and imports each one's validator for each subject. A cloud with no file for a subject contributes nothing there.
**How** — the import path is composed from the folder name and the subject name, so a third cloud needs no edit anywhere. `packages/plugin-spn-infra/src/scripts/checks/subjects.ts`.

### `local` has no folder, and the absence is the statement

**Why** — *a stub that answers with silence teaches a reader that the write-time check works there*. An absent realization says what is true.
**What** — no validator ships for the local cloud, so it has no folder under `providers/`. Its vocabulary is still restated, because those words are true whether or not code reads them.
**How** — the entries sit in the refs tree beside every other cloud's. `packages/plugin-spn-infra/src/refs/support/infra/providers/local/`.

### The vocabulary is stated, never executed

**Why** — *`providers/` executes and `refs/` states*. A cloud's spellings kept in a folder a gate dispatches into would be a fact nobody could look up without reading code.
**What** — each cloud's words are restated subject by subject in the refs tree, where a reader and a skill both find them.
**How** — the only cloud strings inside a provider folder are the patterns its own validator matches with. `packages/plugin-spn-infra/src/refs/support/infra/providers/`.

### Every cloud's validators run, not the declared one's

**Why** — *running only the declared cloud's patterns would let an AWS region into a declaration whose cloud entry says Google* — the mistake somebody makes while moving an estate between clouds, and the moment the gate is most worth having. A write-time gate cannot read a resolved estate anyway, because there may not be one yet.
**What** — every cloud's validator runs for every write. The cost is a handful of regular expressions against text already in memory.
**How** — the subjects are resolved per write, subject-major, so the path-only subject still runs before any text is read. `packages/plugin-spn-infra/src/scripts/checks/subjects.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-infra's scripts | the rule bodies, the rule shape, and the judgement each cloud feeds its patterns to | the rule lives once and the patterns live per cloud |
| takes | spn-infra's refs | each cloud's own words, restated beside the parse that reads that cloud's text | a name is a fact and a parse is code |
| publishes | spn-infra's gate | one validator per subject per cloud, found by reading the folder | a cloud joins by adding a folder and no gate changes |
| publishes | every estate repository | a write-time parse for each cloud the plugin carries one for | the rule holds everywhere and the spelling is checked where it is known |
