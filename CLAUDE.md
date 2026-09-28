# CLAUDE.md — spn-claude-marketplace

The public marketplace that **authors and delivers the SaaS Plane Claude plugins**. Three trees
sit at the root: `packages/` — the three plugins plus the shared support folder, each plugin with
its own `.claude-plugin/plugin.json` — `docs/`, which describes them, and a root `package.json` /
`scripts/build-plugins.mjs`, a dev-only build that bundles each plugin's `cli.ts` and `events/*.ts`
into a committed `dist/` and never ships or installs. `.claude-plugin/marketplace.json`
is what a `claude plugin marketplace add` reads. **This file carries only what is true of this
repo alone**; the docs-tree shape and the working protocol are stated in `spn-devex` itself, and a
copy here would be a second source that drifts.

## `GENERAL`, and what that decides

**This repo declares `GENERAL` in `sprepo.json`** — no nodes, one docs tree. It answers to no
stack, so the `apps` and `infra` commands refuse it by name, and what the agent manages here is the
docs tree and this repository's own files (`RD.DEVEX.WORKSPACE.176`). It loads `spn-devex` and only `spn-devex`:
core governs docs trees, and a domain plugin acts on nodes this repository does not have.

**Authoring a plugin is not loading it.** This repo authors all three and loads one. Editing
`packages/plugin-spn-apps/src/skills/…/SKILL.md` is editing markdown, which spn-devex's doc rules govern, and the
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
| [`01-devex`](docs/02-constructs/01-devex/README.md) | `spn-devex`, the stack-agnostic plugin | plugin · hooks · agents · skills · scripts · refs · providers · tests |
| [`02-apps`](docs/02-constructs/02-apps/README.md) | `spn-apps`, the apps domain, stack-agnostic with its stacks inside it | plugin · hooks · skills · scripts · refs · providers · tests |
| [`03-infra`](docs/02-constructs/03-infra/README.md) | `spn-infra`, the estate plugin | plugin · hooks · skills · scripts · refs · providers · tests |

Under [`04-capabilities/`](docs/04-capabilities/README.md) the level below a domain is the
package that realizes it, and **here the package is the plugin itself** — so a domain holds
exactly one folder named for that plugin, `01-devex/plugin-spn-devex/`. That is the plugin tree mirrored:
one chapter per construct, and the chapter names what the plugin actually ships.

`docs/registers/` holds [`decisions.md`](docs/registers/decisions.md) alone.
[`01-purpose/`](docs/01-purpose/README.md) carries the repository's own why · what · who, one set for
the repository and never one per plugin. [`05-guides/`](docs/05-guides/README.md) carries tasks named
as tasks — installing the plugin set, and running the suites.

## Versioning — this repo counts on its own

**`RD.SUPPORT.APPS.034` does not reach you here, and this repo still moves its three plugins together.**
That row rules lockstep versioning *within a repository*, with the version stamped at publish
rather than written into source. It governs `APPS` repos, and this one is not — the version is
written into each `.claude-plugin/plugin.json`, because that is what a Claude marketplace reads.

**But the three carry the same number, and every release moves all three.** A plugin with no
change in it is released anyway, at the new number. Ruled by the developer on 2026-09-22,
reversing the 2026-09-08 ruling that let them move independently.

**The reason is that a reader cannot tell three numbers apart.** The three plugins are installed as
one set, by one command, and a session loads whichever of them its repository declares. When they
read `0.7.3 · 0.7.1 · 0.7.1` there is no way to know from the outside whether that is three
deliberate versions or one release that half-landed — and the second is what it looked like all
day on 2026-09-22, while `spn-devex 0.7.3` was declared and the workspace root ran `0.7.2 · 0.7.0 ·
0.7.0`. **One number answers *are you current?* and three numbers only raise it.** The cost is
releasing a plugin that did not change, which costs nothing.

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

**So the increment is the set's, not the plugin's.** After a release, the first edit to *any* of
the three moves *all three* to the next patch. Bumping only the plugin you touched is what produced
the split this rule ends.

<!-- spnutils:agent:begin -->
## SaaS Plane

This repo is wired for SaaS Plane. Standards and flows arrive via the saasplane plugins
(spn-devex); the version-matched repo inventory is imported below.

@.claude/saasplane/rules.md

This block is managed by `spnutils repo agent-sync` — do not hand-edit inside the markers.
<!-- spnutils:agent:end -->
