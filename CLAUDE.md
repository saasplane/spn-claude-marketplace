# CLAUDE.md — spn-claude-marketplace

The public marketplace that **authors and delivers the SaaS Plane Claude plugins**. Two trees
sit at the root: `plugins/` — the three plugins themselves, each with its own
`.claude-plugin/plugin.json` — and `docs/`, which describes them. `.claude-plugin/marketplace.json`
is what a `claude plugin marketplace add` reads. **This file carries only what is true of this
repo alone**; the docs-tree shape and the working protocol are stated in `spn-core` itself, and a
copy here would be a second source that drifts.

## `GENERAL`, and what that decides

**This repo declares `GENERAL` in `sprepo.json`** — no nodes, one docs tree. It answers to no
stack, so the `apps` and `infra` verbs refuse it by name, and what the agent manages here is the
docs tree and this repository's own files (`RD.GOV.024`). It loads `spn-core` and only `spn-core`:
core governs docs trees, and a stack plugin acts on nodes this repository does not have.

**Authoring a plugin is not loading it.** This repo authors all three and loads one. Editing
`plugins/spn-apps-ts/skills/…/SKILL.md` is editing markdown, which core's doc rules govern, and the
suites here run the source rather than the installed copy. Being the builder checkout is a separate
axis — `SPN_DEVEX_AGENT_WORKSPACE`.

## The docs tree — one domain per plugin

The map is [`docs/README.md`](docs/README.md). This repository divides its *What* seats by
domain, with no area above them, and a domain **is a plugin** — so the same three divide
[`02-constructs/`](docs/02-constructs/README.md),
[`03-behaviors/`](docs/03-behaviors/README.md) and
[`04-capabilities/`](docs/04-capabilities/README.md) alike:

| Domain | Describes | Its constructs |
| --- | --- | --- |
| [`01-spn-core`](docs/02-constructs/01-spn-core/README.md) | the stack-agnostic plugin | the plugin set, the hook set, the loop events, the checks, the tools, the pages, the skills, the refs, the lenses, the agents |
| [`02-spn-apps-ts`](docs/02-constructs/02-spn-apps-ts/README.md) | the TypeScript stack plugin | its checks, tools, skills and refs |
| [`03-spn-infra`](docs/02-constructs/03-spn-infra/README.md) | the estate plugin | the estate guard, its skills, its refs |

Under [`04-capabilities/`](docs/04-capabilities/README.md) the level below a domain is the
package that realizes it, and **here the package is the plugin itself** — so a domain holds
exactly one folder of the same name, `01-spn-core/spn-core/`. That is the plugin tree mirrored:
one chapter per construct, and the chapter names what the plugin actually ships.

`docs/registers/` holds [`decisions.md`](docs/registers/decisions.md) alone.
[`01-purpose/`](docs/01-purpose/README.md) carries the repository's own why · what · who, one set for
the repository and never one per plugin. [`05-guides/`](docs/05-guides/README.md) carries tasks named
as tasks — installing the plugin set, and running the suites.

## Versioning — this repo counts on its own

**`RD.APPS.034` does not reach you here.** That row rules lockstep versioning *within a
repository*, with the version stamped at publish rather than written into source. It governs `APPS`
repos, and this one is not. **You follow the Claude marketplace's own convention instead** — one
version per plugin, in each `.claude-plugin/plugin.json`, and the three move independently.

### The count moves after the release, never before

**You release at the version the plugins carry, then you increment.** A version ships, and the
first edit after it increments the patch. The number in `plugin.json` therefore names **what is
published**, not what you are working on.

**That is what makes a stale cache findable.** A cache directory is keyed by version, so a plugin
edited without an increment installs over its own published bytes and nothing tells you which you
are running.

**One thing you can rely on here, and one you cannot.** Installing from a checkout in the workspace
**overwrites** the cached directory even when that version already exists — proven on 2026-09-08 by
reinstalling over a stale build of the same version. **A published source has not been tested that
way**, so treat a backwards version move as unsafe there until somebody proves otherwise.

**You would otherwise apply the wrong rule here, which is why this is written down.** Three plugins at three
versions looks like the lockstep defect that row names, and it is not one. Ruled by the developer
on 2026-09-08.

<!-- spnutils:agent:begin -->
## SaaS Plane

This repo is wired for SaaS Plane. Standards and flows arrive via the saasplane plugins
(spn-core); the version-matched repo inventory is imported below.

@.claude/saasplane/rules.md

This block is managed by `spnutils repo agent-sync` — do not hand-edit inside the markers.
<!-- spnutils:agent:end -->
