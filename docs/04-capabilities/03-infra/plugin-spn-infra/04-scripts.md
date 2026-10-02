<!-- spn:doc
{"id": "spn-infra-capabilities-estate-guard", "variant": "capability", "title": "Scripts in spn-infra", "lenses": ["INFRA", "TRUST"], "status": "DONE", "realizes": ["estate-guard"], "summary": "A dispatcher wired to every write, a gate that discovers which clouds judge it, and named rule bodies over what an estate edit would add — denying the ways one leaks a secret or pins something a driver should discover, and allowing the call on anything it cannot read.", "keywords": ["scripts", "secret", "ARN", "account id", "dist", "provider string"]}
-->

# Scripts in spn-infra

`For: DevOps / SRE · DevSecOps / Security` · `Status: ✅ DONE` · `Realizes: Scripts`

This plugin's script surface is three folders: the dispatcher the wiring calls, the gate that works out which subjects have an opinion about a file, and the rule bodies they run. Before you read it, know the direction it fails in. **When the gate does not understand its input, it allows the call.** A gate that refused whatever it could not parse would deny far more than the things it actually knows about, and people would route around it, which leaves an estate with no gate at all.

Each rule carries its own name, so a refusal says which law it read rather than leaving the reader to match a message against a pattern.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The dispatcher | `packages/plugin-spn-infra/src/scripts/events/pretooluse.ts` | reads the event, asks each subject in order, and stops at the first denial |
| The gate | `packages/plugin-spn-infra/src/scripts/checks/subjects.ts` | the subject names, the cloud discovery, and the text a call would add |
| The rule shape and the sentence every refusal quotes | `packages/plugin-spn-infra/src/scripts/lib/laws/law.ts` | what a rule is, and the one sentence pointing a refused reader at the laws card |
| Secret material, at any path | `packages/plugin-spn-infra/src/scripts/lib/laws/no-secrets.ts` | an ARN, an access key id, private key material, and a credential-named key holding a literal — the one sanctioned exception is the placeholder account `000000000000`, and only inside a `*.tftest.hcl` file |
| A pinned account | `packages/plugin-spn-infra/src/scripts/lib/laws/no-pinned-account-id.ts` | a key spelled as an account identifier assigned a value of the right shape |
| A provider string with no home | `packages/plugin-spn-infra/src/scripts/lib/laws/provider-strings-only-in-cloud-entry.ts` | the judgement, plus the two sanctioned homes it blanks before searching |
| A hand edit to built output | `packages/plugin-spn-infra/src/scripts/lib/laws/no-edits-to-built-output.ts` | the one rule that decides on the path alone |
| A test file in the wrong tier folder | `packages/plugin-spn-infra/src/scripts/lib/test-file-outside-tier-folder.ts` | refuses a case filed under a tier folder its extension does not belong to, the same defect `spnutils infra test` refuses at run time, caught here first |
| A harness that re-checks the manifest | `packages/plugin-spn-infra/src/scripts/lib/harness-reimplements-manifest-identity.ts` | warns, never refuses, on an embedded Python heredoc reading a manifest file `infra validate` already checks |
| Its libraries | `packages/plugin-support-lib/src/lib/payload.ts` · `lib/timing.ts` | one copy in the shared support folder, bundled into each plugin's `dist` |
| The tests | `packages/plugin-spn-infra/tests/` | one command, and each rule asserted on both sides |
| The card it cites | `packages/plugin-spn-infra/src/refs/support/infra/README.md` | the estate laws every refusal message points the reader at |

## Follows the pattern

- The five moments and the refuse-or-report line — [Hooks](../../../02-constructs/01-devex/02-hooks.md)
- The decision a refusal is printed as, and the always-zero exit — [Hooks in spn-devex](../../01-devex/plugin-spn-devex/02-hooks.md)
- The three folders a script tree is filed into — [Scripts](../../../02-constructs/01-devex/05-scripts.md)
- The one-entry, `<group> <action>` shape a plugin's rules are named under — the foundation's `04-plugins/02-shape.md`

## Special handling

### This plugin has no commands, and the absence is not a gap

**Why** — *a `<group> <action>` entry replaces a flat `tools/` folder*, and this plugin never had one: everything it ships is the write-time gate — `events/`, `checks/`, `lib/` — with nothing reached by a person or an agent typing a path.
**What** — this plugin carries no `cli.ts` and no `commands/` folder. It carries what its two siblings carry: a committed `dist/` that `hooks.json` runs instead of `src/scripts/events/pretooluse.ts`.
**How** — a command surface is added to this plugin the day it ships something meant to be reached by name rather than by a moment; until then, `spn-devex`'s `plugin` group is where a cross-plugin question about this one is answered — `spn-devex plugin paths`, for instance, checks a path this plugin's own skills and refs name.

### Unsure means allow, and every exit is zero

**Why** — *a hook that crashes or over-refuses is removed by the people it blocks*. The rules are narrow on purpose, and anything outside them is somebody else's business.
**What** — unreadable input, or a call naming no file, ends the run in silence with the call allowed. A refusal prints the documented decision and still exits zero.
**How** — the dispatcher returns as soon as it finds no file path, and the whole run is wrapped so that nothing reaches the harness as a failure. `packages/plugin-spn-infra/src/scripts/events/pretooluse.ts`.

### A subject that throws is skipped, never fatal

**Why** — *a gate that crashes the chain removes every other gate with it*, which is worse than any single miss.
**What** — each subject is run inside its own catch, and one that fails is passed over while the rest still run. A subject a cloud ships no file for is simply not there.
**How** — the loop catches per subject, and the import that resolves a cloud's validator catches on its own. `packages/plugin-spn-infra/src/scripts/checks/subjects.ts`.

### It reads the text the call would add, not the file

**Why** — *a refusal must be about what is being written*. Judging the file on disk would refuse an edit to a file that already carries the fault and miss the fault arriving now.
**What** — a write carries its content and an edit carries its replacement text, and `written()` takes whichever is present. With no new text, only the subject that reads the path alone can run.
**How** — the dispatcher skips any subject that needs text when there is none. `packages/plugin-spn-infra/src/scripts/checks/subjects.ts`.

### Build output is refused by path alone

**Why** — *the published artifact is staged whole by the release command*. A hand edit under the output folder is lost on the next build, and until then it is what is running.
**What** — a path under a build output folder is refused before the text is read, and the message names the source folder to edit instead. An empty write there is still an edit to something the build owns.
**How** — the rendering subject reads the path and needs no text, which is why the dispatcher never skips it for want of any. `packages/plugin-spn-infra/src/scripts/lib/laws/no-edits-to-built-output.ts`.

### An identifier is refused only where a key names it

**Why** — *a bare run of digits is not evidence of anything*. Refusing every one of them would block timestamps, sizes and identifiers with nothing to do with an account.
**What** — the pinned-account rule fires where a key spelled as an account identifier is assigned a value of the right shape, and leaves a loose number alone. The credential rule is shaped the same way: it needs a credential-named key assigned a quoted literal of real length, and ignores a reference to a variable.
**How** — the length threshold is eight characters, and both sides of that boundary are stated as test cases so nobody re-derives it from a regular expression. `packages/plugin-spn-infra/src/scripts/lib/laws/no-pinned-account-id.ts` · `lib/laws/no-secrets.ts`.

### One rule reads only the estate manifest

**Why** — *a provider's own region string is legitimate in a small number of places*: the region mapping on a cloud entry, and a profile's capacity keys. Searching for such strings everywhere would refuse documentation and test fixtures.
**What** — the provider-string rule fires only on a file named as an estate manifest. It blanks the sanctioned homes first, then searches what is left.
**How** — the judgement is written once and each cloud's validator hands it that cloud's own patterns, so the rule carries no cloud at all. `packages/plugin-spn-infra/src/scripts/lib/laws/provider-strings-only-in-cloud-entry.ts`.

### The clouds are discovered, and every one of them runs

**Why** — *running only the declared cloud's patterns would let an AWS region into a declaration whose cloud entry says Google*, which is the mistake somebody makes while moving an estate between clouds and the moment the gate is most worth having. A write-time gate cannot read a resolved estate anyway, because there may not be one yet.
**What** — the gate names no cloud. It reads which folders the providers tree holds, sorted so the order is stable, and imports each one's validator per subject.
**How** — the subjects are resolved per write rather than held in a module-level list, so a third cloud joins by adding a folder and no import line changes. `packages/plugin-spn-infra/src/scripts/checks/subjects.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-infra's refs | the estate laws every refusal message cites by name | the rule lives in the card and the script catches the part a script can catch |
| takes | spn-infra's providers | each cloud's parse of a subject, and that cloud's own spellings | the rule is the domain's and the parse is the provider's |
| takes | the Claude Code harness | the event on standard input, and the decision fields it reads back | the shape is the harness's, and the dispatcher speaks it directly |
| takes | nothing outside this plugin | its payload and timing helpers are its own copies | a plugin is installed on its own, so a sibling's file cannot be a dependency |
| publishes | every estate repository | named refusals at the moment an edit would land | an estate leak is found before the file exists, not in review |
