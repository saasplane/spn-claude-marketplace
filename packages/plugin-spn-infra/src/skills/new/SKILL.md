<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md",
      "seen": "efbbe76f"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/02-scm.md",
      "seen": "1eabeee5"
    }
  ]
}
-->
---
name: new
description: Stand up a new estate node or a new estate repository with spnutils infra scaffold - choosing the type, placing it, and knowing what its manifest must carry. Use when an estate repo must be minted, when an organization or platform node is needed, or when a platform needs a new lifecycle module package. Not for changing an existing node's declaration (implement skill) and not for publishing one (release skill).
---

# new — scaffold the node, then let the validator judge it

**Read `refs/devex/workspace/workstream.md` (spn-devex) before acting.** It holds the loop this skill runs inside: how a prompt is read, where a new ask goes, what a prompt does to a running arc, and how a reply closes.

**Never hand-build an estate tree.** `spnutils infra scaffold` writes the tree each type prescribes, and `spnutils infra validate` reports where a tree disagrees with its own type. Scaffold, then validate — that pair is the whole of standing a node up. Read `refs/support/infra/packages.md`, in this plugin, for the four types and the two manifest files; read `refs/support/infra/naming.md` for the name grammar.

## Choose the type first

| Type | You are making | The command |
| --- | --- | --- |
| the repository | the checkout itself, as the organization's estate repo | `spnutils infra scaffold repo --name "<readable name>"` |
| `ORGANIZATION` | the org node — **at most one per repo** | `spnutils infra scaffold organization <org> --name "<readable name>"` |
| `PLATFORM` | a platform node | `spnutils infra scaffold platform <spc> --name "<readable name>"` |
| `MODULE` | a lifecycle plug-in attached at a layer step | `spnutils infra scaffold module <code> --name "<readable name>"` |

`--name` is what a person calls it — "SaaS Plane", "SPN Demo", "Identity". The positional argument is the token the grammar composes from, and the two are different things: `<org>` and `<spc>` are codes, never sentences.

**`SUPPORT` is the fourth type and has no scaffold.** `@saasplane/infra-blueprints` is what SaaS Plane ships; an organization pins it, and nobody mints one here.

## Where it goes

Nodes sit under `packages/`, one folder each, and the family-first folder name is **checked against** `spinfrapkg.json` rather than trusted as one. Every node root is found by `spinfrapkg.json` and its type is read from `src/spestate.json` — never inferred from where the folder sits.

**A module code is a purpose, never a product** — `idp`, not a vendor name — so swapping the product later changes no consumer. That purpose lives in the package name and nowhere else.

## What the manifest must carry

Two files per node, and no `package.json` anywhere in an estate tree (RD.SUPPORT.INFRA.066) — one appearing is a defect, not metadata.

- **`spinfrapkg.json`** names the publishable artifact: `name` (authoritative; its scope routes the publish) · `version` (the artifact's semver) · `description` · `author` · `license`.
- **`src/spestate.json`** declares the node: `type` opens the file, and `config` is discriminated by its `mtype`. Keep it under `src/`, because what publishes is source.

What each type's `config` owes:

| Type | `config` carries |
| --- | --- |
| `ORGANIZATION` | `name` · `org` · the `blueprint` pin · `packages` · `emailDomain` · `legal` · `regions` · `providers` · `modules` |
| `PLATFORM` | `org` · `spc` · `name` · `domains` · `owner` · `network` — then the declaration (`resources` · `apps` · `modules`) and the realization (`providers`) |
| `MODULE` | `mtype` · `name` — **identity only**. Usage stays on the referencing `modules[]` row; nothing about a consumer ever enters the module |

The scaffold writes the skeleton; the choices inside it are the `implement` skill's subject, and a person types them.

## Prove the scaffold landed

```text
spnutils infra validate <repo|organization|platform|module>
```

The target is the same selector `scaffold` takes, and it reads **every node of that type**. Omit it to read every node the repository declares. Green here says the tree matches its type — see the `verify` skill for what that does and does not prove.

## Hand-off

`implement` once the node exists and its choices must be written; `verify` for the full validate-and-test pass; `release` when the package must publish.
