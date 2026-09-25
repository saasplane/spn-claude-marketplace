<!-- spn:doc
{"id": "spn-infra-capabilities-estate-guard", "variant": "capability", "title": "Estate Guard in spn-infra", "lenses": ["INFRA", "TRUST"], "status": "DONE", "realizes": ["estate-guard"], "summary": "A dispatcher wired to every write, running seven named rules over what an estate edit would add, denying the ways one leaks a secret or pins something a driver should discover, and allowing the call on anything it cannot read.", "keywords": ["guard", "secret", "ARN", "account id", "dist", "provider string"]}
-->

# Estate Guard in spn-infra

`For: DevOps / SRE · DevSecOps / Security` · `Status: ✅ DONE` · `Realizes: Estate Guard`

This plugin's hook surface is a dispatcher and a set of named rules, in the same `events / checks / lib / tests` arrangement both sibling plugins use. Before you read it, know the direction it fails in. **When the guard does not understand its input, it allows the call.** A guard that refused whatever it could not parse would deny far more than the things it actually knows about, and people would route around it, which leaves an estate with no guard at all.

Each rule carries its own name, so a refusal says which law it read rather than leaving the reader to match a message against a pattern.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The wiring | `plugins/spn-infra/hooks/hooks.json` | one `PreToolUse` entry matching `Write` and `Edit`, declaring a timeout of 20 |
| The dispatcher | `plugins/spn-infra/hooks/events/pretooluse.ts` | reads the event, runs the rules in order, and stops at the first denial |
| The rules | `plugins/spn-infra/hooks/checks/estate-violations.ts` | seven of them, each named, each with its own refusal message |
| Its libraries | `plugins/spn-infra/hooks/lib/payload.ts` · `lib/timing.ts` | this plugin's own copies, because a plugin ships alone |
| The tests | `plugins/spn-infra/hooks/tests/` | 21 cases, one command |
| The rules it cites | `plugins/spn-infra/refs/laws.md` | the estate laws every refusal message points the reader at |

## Follows the pattern

- The four events and the refuse-or-report line — [The Hook](../../../02-constructs/01-spn-devex/02-hook-set.md)
- The decision JSON a refusal is printed as, and the always-zero exit — [Hook in spn-devex](../../01-spn-devex/spn-devex/02-hook-set.md)

## Special handling

### Unsure means allow, and every exit is zero

**Why** — *a hook that crashes or over-refuses is removed by the people it blocks*. The rules are narrow on purpose, and anything outside them is somebody else's business.
**What** — unreadable input, or a call naming no file, ends the run in silence with the call allowed. A refusal prints the documented decision JSON and still exits zero.
**How** — the dispatcher returns as soon as it finds no file path, and the whole run is wrapped so that nothing reaches the harness as a failure. `plugins/spn-infra/hooks/events/pretooluse.ts`.

### A rule that throws is skipped, never fatal

**Why** — *a gate that crashes the PreToolUse chain removes every other gate with it*, which is worse than any single miss.
**What** — each rule is asked whether it applies and then asked to run, and each question is caught on its own. A rule that fails either way is passed over and the remaining rules still run.
**How** — two separate catches inside the loop, so a fault while deciding applicability cannot hide a later rule. Same file.

### It reads the text the call would add, not the file

**Why** — *a refusal must be about what is being written*. Judging the file on disk would refuse an edit to a file that already carries the fault and miss the fault arriving now.
**What** — a `Write` carries its content and an `Edit` carries its replacement text, and `written()` takes whichever is present. With no new text, only the path-based rule can fire.
**How** — the dispatcher skips any rule but `dist-is-build-output` when there is no new text. `plugins/spn-infra/hooks/checks/estate-violations.ts`.

### Build output is refused by path alone

**Why** — *the published artifact is staged whole by the release command*. A hand edit under the output folder is lost on the next build, and until then it is what is running.
**What** — a path under a build output folder is refused before the text is read, and the message names the source folder to edit instead. An empty write there is still an edit to something the build owns.
**How** — `dist-is-build-output` is the one rule that reads the path alone, which is why the dispatcher never skips it for want of text. Same file.

### An identifier is refused only where a key names it

**Why** — *a bare run of digits is not evidence of anything*. Refusing every one of them would block timestamps, sizes and identifiers with nothing to do with an account.
**What** — `pinned-account-id` fires where a key spelled as an account identifier is assigned a value of the right shape, and leaves a loose number alone. `literal-credential` is shaped the same way: it needs a credential-named key assigned a quoted literal of real length, and ignores a reference to a variable.
**How** — the length threshold is eight characters, and both sides of that boundary are stated as test cases so nobody re-derives it from a regular expression. Same file.

### One rule reads only the estate manifest

**Why** — *a provider's own region string is legitimate in a small number of places*: the region mapping on a cloud entry, and a profile's capacity keys. Searching for such strings everywhere would refuse documentation and test fixtures.
**What** — `provider-string-outside-cloud` fires only on a file named as an estate manifest. It removes the sanctioned homes from the text first, then searches what is left.
**How** — the removal runs over the region mapping and the capacity keys, and the search runs on the remainder. Same file.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-infra's refs | the estate laws every refusal message cites by name | the rule lives in the card and the guard is the part a check can catch |
| takes | the Claude Code harness | the event JSON on stdin, and the decision fields it reads back | the shape is the harness's, and the dispatcher speaks it directly |
| takes | nothing outside this plugin | its payload and timing helpers are its own copies | a plugin is installed on its own, so a sibling's file cannot be a dependency |
| publishes | every estate repository | seven named refusals at the moment an edit would land | an estate leak is found before the file exists, not in review |
