---
name: operate
description: How a running platform is observed, responded to, and maintained - what a service must emit to be operable, what an incident owes back to the standards, and what may never be done to a running estate by hand. Use when investigating a live problem, judging whether a change is observable, handling an incident, or planning routine maintenance. Stack-agnostic; the stack plugin supplies the log and metric wiring.
---

# operate — a platform you can see into, and change without fear

**Everything before this stage produces a system; this stage is the only one that meets it under load, at 3am, with a customer waiting.** A capability that works and cannot be observed is a capability nobody can support, and a fix that cannot be applied safely is not a fix.

## What a change owes before it is operable

| Emits | So that | Absent means |
| --- | --- | --- |
| **Structured logs**, with the request or job identity on every line | one request can be followed end to end | the failure is a story assembled by guessing |
| **The error code**, from the declared vocabulary | the same failure is countable across every instance | severity is inferred from message text |
| **A health signal** the orchestrator can read | a broken instance is replaced rather than served from | traffic keeps arriving at something that cannot answer |
| **The version it is running** | an incident can be tied to a release | the first question of every incident takes an hour |

- **Correlation is carried, never reconstructed.** Pass an identifier from the entry through every call, log line, and queued message the work produces. Work that starts a new identity mid-flight has broken the only thread an operator has.
- **A log line is for whoever is reading it at 3am.** Say what was being attempted, on what, and what happened. Never a bare stack trace, never an internal detail that leaks outward, and never a secret, a token, or a customer's data.
- **What is measured is what a customer feels** — latency at the entry, failure rate by code, queue depth and age. A dashboard of resource graphs with no customer-facing signal on it explains nothing when the product itself is what is wrong.

## During an incident

1. **Stabilize before diagnosing.** Roll back, scale out, or shed load first — the cause can be found from evidence afterwards, and a system that keeps failing while being studied is a choice.
2. **Change one thing, and write down that you changed it.** An estate mutated by three people in parallel cannot be reasoned about, and the record of what was done is the only input the follow-up has.
3. **Never hand-edit a running estate as the fix.** A console change is a rollback with no record and a difference nothing will reconcile. Where the estate genuinely must be touched by hand, it is an explicit, named, temporary act — and reversing it into a declared change is part of closing the incident.
4. **Nothing destructive without confirmation.** Teardown, reset, and data-affecting migration steps state what they will do, wait to be told to proceed, and report what they did.

## What an incident owes back

An incident that changes nothing but a dashboard will happen again. Closing one produces at least one of:

- **An incident record** in the owning node's `artifacts/` pocket — what happened, what was done, and what changed because of it. It is `KEPT`, dated, and never overwritten.
- **A behavior row**, where the gap was a capability nobody had specified.
- **A decision entry**, where the gap was a standard that turned out to be wrong. Treat a standard that produced this failure as the defect; patching the instance and leaving the standard is how the same incident returns under a different name.
- **A test carrying the behavior id**, where the gap was proof. A fix with no test is a claim.

## What this stage never does

- **Provision on its own initiative.** Bringing infrastructure up or down is the provision stage's, invoked deliberately.
- **Fix code.** A defect found here becomes work that re-enters at `PLAN`; a hotfix still runs the passes, only faster.
- **Treat a symptom twice.** The second occurrence of a known failure with no recorded cause is an escalation, not a repeat of the same manual step.
