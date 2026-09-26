<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/04-lifecycle.md", "seen": "b0ad7aed" }
  ]
}
-->
# Lifecycle — the shared commands, realized

**Source of truth:** the foundation's `10-providers/ts/04-lifecycle.md`. Read this as the restatement; that chapter governs.

**Every stack realizes the same lifecycle commands**, so you and any tool can drive a project without knowing what it is built in. Here the realization is nx targets orchestrated by pnpm: the command is the contract, the target is the realization.

**Write one script per command, and pass the variant as its argument.** A package declares `test` once, never once per tier. What follows the command is passed through, and everything after `--` reaches the runner untouched.

| Command | In a node | Across the repository |
| --- | --- | --- |
| `build` | `pnpm build`, and `pnpm build test` for the flavour the browser tier drives | `nx run-many --target=build --all` |
| `check` | `pnpm check` — the one name | affected, or run-many |
| `format` | `pnpm format` | affected, or run-many |
| `test` | `pnpm test <tier>` — the tier is always named | `nx run-many --target=test:<tier>` |
| `clean` | `pnpm clean` | run-many |
| `dev` · `start` · `stop` | `pnpm dev` · `pnpm start`, taking `--mode` where the kind declares modes | applications run individually; local infrastructure through `spnutils infra` |
| `migrate` | `pnpm migrate <operation>` | — |
| `codegen` | `pnpm codegen <what>` | — |
| `release` | refused — the scope is the repository | `spnutils apps release`, which runs each publishable package's release step in order |

**The script is one name and the nx target may be several.** A tier needs its own cache policy, so `test` in the manifest is one line while the targets behind it are `test:unit`, `test:integration` and their siblings. Those are inferred from the tiers the node carries, and typing them into a manifest is the duplication this surface removes.

## Rules

- **A command never forks per project.** A kind may lack a command entirely — a `CLIENT_API` has no `dev`. Where a command exists it means the same thing everywhere, so you can call it with no per-project knowledge.
- **A second spelling of a command is a defect.** `lint` beside `check`, or `prettier` beside `format`, leaves a caller unable to tell a package that lacks a command from one that names it differently.
- **Never invoke `release` on a package.** Versions are lockstep within a repository and the source carries a placeholder, so a lone package release publishes the placeholder. A package's own release line is the step the repository's release calls.
- **Prefer affected over all** against the `develop` base day to day. `run-many --all` is for gates and releases.
- **The cache is disposable.** `npx nx reset` clears it, and no command may require a warm cache to be correct.
- **The generation commands you run inline are not `codegen`.** `gen-barrel`, `gen-validators`, `gen-labels` and `gen-symbols` run at their marked points through `spnutils apps` — they belong to `11-generation.md`. `codegen` is the command a node declares because somebody types it directly, which today is the API client.

**Reach for `spnutils apps check · test · format` before any `npx` or `pnpm` invocation.** Root scripts are the repository's surface and are a different thing from a node's commands.
