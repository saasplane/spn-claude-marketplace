<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/06-provision.md",
      "seen": "fa79c74d"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/06-provision.md",
      "seen": "79c4a56c"
    }
  ]
}
-->
# Provision — one declaration, and a laptop is not a special case

**Source of truth:** the foundation's `02-constructs/01-devex/01-function/06-provision.md` and `04-capabilities/01-devex/01-function/06-provision.md`. Read this as the restatement; the book governs.

## The thing to unlearn

**Infrastructure usually appears twice** — a set of local scripts that work on the machine they were written on, and a cloud setup that resembles them. The two then drift, and the drift is only discovered by a deploy that fails.

**Here a local environment is not a developer convenience with its own rules.** It is the same declaration a cloud renders, rendered somewhere else. That is what makes local worth trusting: what you prove on a laptop is a claim about the declaration, not about the laptop.

## The rules

**Everything is read, and nothing is assumed.** Every provider-assigned value is discovered by the tool holding the credential and recorded as resolved state. A value typed into a file is a value that will be wrong for the next estate.

**A hosted vendor is a module, never a command of its own.** Adding a vendor adds a module; it does not add a verb. A command surface that grows per vendor is one nobody can learn.

**An unimplemented layer is absent, never stubbed.** A stub answers, so you learn what you were relying on only when the real run refuses you.

**Diagnose down the layers, never across the symptoms.** A higher layer failing usually means a lower one is not up. Chasing the symptom where it appeared is how an afternoon disappears.

## What is destructive, and what that obliges

**`up` and `down` each take exactly one of `--plan` or `--apply`, and there is no default.** A command that plans when you forget a flag is a command doing another command's job, and a default would decide the direction of the mistake for you.

**Estate caution stands everywhere.** Cloud mutation goes through the CLI's own doors. `tofu apply` and `tofu destroy` are never hand-run.

## The boundary

**Provisioning starts things; it does not prove them.** A stack that came up is not a stack that works — proving it is `test`'s job, and a provision step that asserts behaviour has taken another phase's work without that phase's discipline.
