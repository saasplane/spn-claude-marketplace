<!-- spn:doc
{"id": "spn-infra-capabilities-estate-guard", "variant": "capability", "title": "Estate Guard in spn-infra", "lenses": ["INFRA", "TRUST"], "status": "DONE", "realizes": ["estate-guard"], "summary": "One shell script wired to every write, denying the five ways an estate edit leaks a secret or pins something a driver should discover, and allowing the call on anything it does not understand.", "keywords": ["guard", "secret", "ARN", "account id", "dist", "provider string"]}
-->

# Estate Guard in spn-infra

`For: DevOps / SRE · DevSecOps / Security` · `Status: ✅ DONE` · `Realizes: Estate Guard`

The whole of this plugin's hook surface is one file: a shell script wired to every `Write` and `Edit`. There is no divided tree of events, checks, tools and shared code, because the guard is one rule with five clauses and nothing here has earned a second file. Before you read it, know the direction it fails in. **When the guard does not understand its input, it allows the call.** A guard that refused whatever it could not parse would deny far more than the five things it actually knows about, and people would route around it.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The wiring | `plugins/spn-infra/hooks/hooks.json` | one `PreToolUse` entry matching `Write` and `Edit`, with no timeout of its own |
| The guard | `plugins/spn-infra/hooks/events/deny-estate-violations.sh` | the five clauses, each with its own refusal message |
| The rules it cites | `plugins/spn-infra/refs/laws.md` | the estate laws every refusal message points the reader at |

## Follows the pattern

- The four events and the refuse-or-report line — [The Hook](../../../02-constructs/01-spn-core/02-hook-set.md)
- The decision JSON a refusal is printed as, and the always-zero exit — [Hook in spn-core](../../01-spn-core/spn-core/02-hook-set.md)

## Special handling

### Unsure means allow, and every exit is zero

**Why** — *a hook that crashes or over-refuses is removed by the people it blocks*. The five clauses are narrow on purpose, and anything outside them is somebody else's business.
**What** — no `jq` on the machine, unreadable input, or a call with no file path all end the script silently with the call allowed. A refusal prints the documented decision JSON and still exits zero.
**How** — the guards sit at the top of the file, each a single test followed by an exit. `plugins/spn-infra/hooks/events/deny-estate-violations.sh`.

### It reads the text the call would add, not the file

**Why** — *a refusal must be about what is being written*. Judging the file on disk would refuse an edit to a file that already carries the fault and miss the fault arriving now.
**What** — a `Write` carries its content and an `Edit` carries its replacement text, and the script takes whichever is present. With no new text, only the path-based clause can fire.
**How** — one expression pulls `content` or `new_string`, in that order. Same file, near the top.

### Four clauses read any path; one reads only the estate manifest

**Why** — *a provider region string is legitimate in exactly two places*: the region mapping on a cloud entry, and a profile's capacity keys. Searching for region strings everywhere would refuse documentation and test fixtures.
**What** — the fifth clause fires only on a file named `spestate.json`. It first removes the two sanctioned homes from the text, then looks for what is left.
**How** — the removal is a substitution over the region mapping and the four capacity keys, and the search runs on the remainder. Same file, clause five.

### An account id is refused only where a key names it

**Why** — *a bare twelve-digit number is not evidence of anything*. Refusing every one of them would block timestamps, sizes and identifiers that have nothing to do with an account.
**What** — the clause fires when a key spelled as an account identifier is assigned twelve digits, and leaves a loose number alone.
**How** — the same discipline shapes the credential clause, which needs a credential-named key assigned a quoted literal of real length, and ignores a reference to a variable. Same file, clauses three and four.

### Build output is refused by path alone

**Why** — *the published artifact is staged whole by the release verb*. A hand edit under the output folder is lost on the next build, and until then it is what is running.
**What** — any path under a `dist/` folder is refused before the text is even read, and the message names the source folder to edit instead.
**How** — this is the only clause that does not need the written text. Same file, clause one.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-infra's refs | the estate laws every refusal message cites by name | the rule lives in the card and the guard is the part a script can catch |
| takes | the Claude Code harness | the event JSON on stdin, and the decision fields it reads back | the shape is the harness's, and the script speaks it directly |
| publishes | every estate repository | five refusals at the moment an edit would land | an estate leak is found before the file exists, not in review |
