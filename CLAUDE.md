# spn-claude-marketplace

Agent guide.

<!-- spnutils:agent-init:begin -->
## SaaS Plane

This repo is wired for SaaS Plane. Standards and flows arrive via the saasplane plugins
(spn-core); the version-matched repo inventory is imported below.

@.claude/saasplane/rules.md

This block is managed by `spnutils repo agent-init` and refreshed by `spnutils repo agent-sync` — do not hand-edit inside the markers.
<!-- spnutils:agent-init:end -->

## Versioning — this repo counts on its own

**This repo claims no world, and you will find no `sprepo.json` here.** It is the one member of the
workspace that deliberately has none. The workspace discovers its members, and **access control is
absence**.

**So `RD.APPS.034` does not reach you here.** That row rules lockstep versioning *within a
repository*, with the version stamped at publish rather than written into source. It governs `APPS`
repos. **You follow the Claude marketplace's own convention instead** — one version per plugin, in
each `.claude-plugin/plugin.json`.

### The count moves after the release, never before

**You release at the version the plugins carry, then you increment.** So `0.2.0` ships, and the
first edit after it sets `0.2.1`. The number in `plugin.json` therefore names **what is published**,
not what you are working on.

**That is what makes a stale cache findable.** A cache directory is keyed by version, so a plugin
edited without an increment installs over its own published bytes and nothing tells you which you
are running.

**One thing you can rely on here, and one you cannot.** Installing from a checkout in the workspace
**overwrites** the cached directory even when that version already exists — proven on 2026-09-08 by
reinstalling over a stale `0.1.0`. **A published source has not been tested that way**, so treat a
backwards version move as unsafe there until somebody proves otherwise.

**This is written down because you would otherwise apply the wrong rule.** Three plugins at three
versions looks like the lockstep defect that row names, and it is not one. Ruled by the developer
on 2026-09-08.


