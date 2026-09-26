<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/01-devex/03-utils/01-spnutils.md", "seen": "d8cafded" },
    { "path": "spn-foundation/docs/04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md", "seen": "07a688b1" }
  ]
}
-->
# Command Vocabulary — Stack-Agnostic

**Source of truth:** the foundation's `02-constructs/01-devex/03-utils/01-spnutils.md` for what the CLI is, and `04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md` for the standard it holds to. The command listing below that is generated from the released CLI, so it states what a partner actually holds rather than what this file last claimed.

Two command vocabularies belong to the platform rather than to any stack: the **`spnutils` commands** and the **DevEx stage skills**. Both mean the same thing in every repo and every language. What *runs* when you invoke one is the stack's business, and it is the only part that differs.

**The command never forks; only its realization does.** A stack joins by realizing this vocabulary, not by extending it. So an agent that knows these commands can operate any SaaS Plane repo, including one built on a stack it has never seen. A second stack changes no command: the groups are the platform's vocabulary, the stack adapters its realizations.

## `spnutils` — the foundation CLI

One CLI serves every stack. The group says *what kind of thing changes*, which is what keeps the boundary stable as commands are added — a new command joins a group rather than minting one:

| Group | Changes | Never |
| --- | --- | --- |
| `repo` | the repository and its remote — creation, convergence to the standard, agent wiring | the content of code, tests, or docs |
| `apps` | the apps domain's nodes — scaffolds, generated sources, conformance, release | repo settings or the estate |
| `infra` | the estate — layers, apps, config, estate packages; **local is the default realization, `--cloud` is asked for by name** | committed code |
| `workspace` | the level above the repository — the floor's permission tiers, the plugin union, the machine env seat, and `.spndevex/` | anything inside a repository |

## Every command, generated

**The released CLI's whole surface is [`commands.md`](commands.md) beside this file**, written by `commands-ref.ts` from the version a partner actually holds.

**It is a separate file because it is generated and this one is not.** A file half authored and half produced means editing prose around markers you must not touch, and the boundary is invisible until somebody crosses it.
