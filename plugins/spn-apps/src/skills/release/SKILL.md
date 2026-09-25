---
name: release
description: Publish this repository's releasable projects, in lockstep, through `apps release`. Use when the developer asks to cut, ship, or publish a release, or to preview what one would do before running it. Not for releasing a single package — the scope is always the repository — and not for an estate package, which is the `spn-infra` plugin's own `release` skill.
---

# release — publish the repository, in lockstep

`apps release` is a repository-scoped command. It never takes a package: every releasable
project in the repository publishes together, at one version, or none of them do
(`RD.APPS.034`, `RD.APPS.118`). Asking it for one project is refused by name — the CLI says so
rather than pretending the option exists.

## When to reach for it, and when not

| The ask is… | Then… |
| --- | --- |
| cut/ship/publish a release, or "what would a release do right now" | this skill |
| release just this one package | **refused by the command itself** — say why, and point at what actually publishes: the whole repository, together |
| stage a build without publishing, to inspect it | `--dry-run` below, not a separate local-only mode — `apps release` has no `--local` staging door. That is `spn-infra`'s `release` skill, for an estate package, not this one |
| publish an estate package (`infra-platform-*`, a module, an organization node) | hand off to the `spn-infra` plugin's `release` skill — same shape, a different command, a different registry rule |
| the developer has not said yes to publishing yet | run `--dry-run` and show the result; never pass `-y`/`--approved` on your own judgment — that flag exists so the developer's yes travels with the command instead of stopping at a prompt you cannot see |

## What one release does, in order

1. **Reads the version.** Named on the command line, or read from the newest release tag and
   incremented — see *Naming the version* below.
2. **Runs the gates** on every releasable project — build, check, test, whatever its kind owes.
   A gate failure stops here: nothing is stamped, nothing is committed, nothing is tagged,
   nothing is published.
3. **Stamps the version into the built artifact**, after the gates pass and before anything
   ships. The stamp lands in what gets published, never in the source tree — source keeps a
   placeholder, which is the whole point of lockstep (`RD.APPS.034`): there is no version bump
   to review in a diff, because there is nothing to bump.
4. **Commits and tags** the release at that version.
5. **Publishes** every releasable project to the organization's registry pair (public/private,
   routed by each package's declared scope) — always the real registry. There is no
   local-store option on this command the way `infra release --local` has one.

What it leaves behind: a commit and a tag in this repository's history, published packages at
the org's registry, and source manifests unchanged — still at the placeholder, exactly as they
were before the release ran (`RD.APPS.045`).

## What must be true before you run it — a clean tree, first

**`apps release` stages the whole tree before it commits — `git add -A`, not a scoped add.**
Anything uncommitted anywhere in the repository, not only in what you meant to release, gets
swept into the release commit. This is the finding that costs somebody an afternoon: a second
session's half-finished edit, sitting uncommitted in a sibling package, becomes part of a
release neither session asked for.

So before running anything but `--dry-run`:

- `git status` — the tree is clean, or you know exactly what every uncommitted change is and
  that it belongs in this release.
- No other session holds uncommitted work in this repository. If you cannot be sure, ask rather
  than assume the tree is yours alone.
- No source manifest carries a hand-typed real version. `RD.APPS.045` makes this an explicit
  refusal — a manifest still holding a real version fails the run before anything is built —
  but catching it yourself first is cheaper than a failed gate run.

## Naming the version

`spnutils apps release [version]` — the argument is an explicit semver, typed by the developer.
**Naming the version is the developer's call, not yours to infer.**

Omit it and the command reads the newest release tag in this repository and increments it. That
is a real default, not a placeholder — but "newest" is read at the moment the command runs, and
another session may have moved that tag since you last looked. Omitting the version is a bet
that nobody else released in between. When precision matters — and it always does for a number
that gets tagged and published — check `git tag` for what "newest" actually is right now, or ask
the developer what version they mean, rather than letting the command guess silently.

## What a dry run proves, and what it does not

```text
spnutils apps release --dry-run
```

Runs every gate and the stamp, then stops — no commit, no tag, no publish. It proves the code
builds, checks, and tests clean across every releasable project, and that the version resolves
to something sane. It does **not** prove the publish itself will succeed — registry auth, a
version already present at the registry (which refuses, immutably — a fix is a new version,
never a re-publish), or anything network-shaped is still unproven until the real run reaches
that step. A green dry run is permission to show the developer a preview, not a claim that the
real release cannot fail.

`--json` emits the release State on stdout — reach for it when you need to read exactly what a
run (dry or real) reported, rather than parsing table output by eye.

## When it fails partway

A gate failure fails clean — before step 3, nothing was written anywhere. A failure after the
stamp is the case to slow down for: check `git log` and `git tag` for whether the commit and tag
actually landed, and check the registry for whether the version published, before deciding what
to do next. **Do not just re-run the command.** A re-run stages the tree again with `git add -A`,
and if a tag for that version already exists, the version is already spent — a version already
present at the registry refuses rather than overwrites, and a tag is not retagged. Read what
actually completed, report it to the developer plainly, and let them decide whether the fix is
retrying the publish step, cutting a new version, or cleaning up a partial tag by hand.
