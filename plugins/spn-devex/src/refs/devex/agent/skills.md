<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md", "seen": "716e5e8e" },
    { "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/02-skills/01-skills.md", "seen": "af64bd78" }
  ]
}
-->
# Skills — the closed vocabulary, and why a value spells its owner

**Source of truth:** the foundation's `02-constructs/01-devex/02-agent/02-skills.md` and `04-capabilities/01-devex/02-agent/02-skills/01-skills.md`. Read this as the restatement; the book governs.

**Read this before writing or renaming a skill.** The value, the folder and the shipping plugin have to agree, and only one of the three is something you type.

## A skill is matched, never routed

**A skill's description is written so a session can tell, from your words alone, whether this is the unit of work you want.** There is no intake step, because the classification already happened when you typed.

**So two skills with nearly the same description compete**, and the matching gets worse as the pair grows. A skill answering several close asks keeps one description and routes inside itself.

## A value spells its owner, and a folder never does

**A skill's value is `{DOMAIN}_{SKILL}`.** The domain is taken from the claim of the plugin that ships it and is never authored a second time. **The folder name stays bare.**

```text
plugins/spn-devex/src/skills/bootstrap/   →  DEVEX_BOOTSTRAP
plugins/spn-apps/src/skills/implement/    →  APPS_IMPLEMENT
plugins/spn-infra/src/skills/implement/   →  INFRA_IMPLEMENT
```

**Three plugins shipping into one flat vocabulary would collide**, and nothing in a bare value would say who answers for it. Deriving the prefix keeps the fact in one place; bare folders keep each plugin's tree readable on its own terms.

**Conformance is a three-way check: the folder, the value derived from it, and the plugin that ships it must agree.** A value with no folder, or a folder with no value, is a defect a listing finds — and it has been found in a plugin every repository installs.

## The vocabulary is the inventory

**Twenty-two values, and the set is closed.** Devex reads in stage order with the two stage-less ones last; apps and infra read the same six words, so a reader who has learned one domain's surface has learned the other's.

**A skill is mapped to a stage, never named after one.** Proving a claim against the code is something every phase does, so `DEVEX_CHECK` belongs to no single phase — and naming every skill after a phase leaves that one nowhere to sit. The gain is that each list changes on its own clock.

## What a skill may never do

**A skill that states a rule stated nowhere else has become a second source nothing audits.** Name the chapter or the ref that holds the rule instead.

**A stack-agnostic skill needing a concrete step reads a file the stack's own provider folder ships.** Copying the skill per stack is what the provider folders exist to prevent.

**No plugin may name another plugin's file path.** A cross-plugin address is a name, never a path — a partner's install has no sibling directory to reach into.
