<!-- spn:doc
{
  "id": "spn-claude-marketplace-what",
  "title": "What You Get",
  "lenses": ["LEAD", "ARCHITECT", "SERVER_DEV", "WEB_DEV", "QA", "INFRA", "TRUST", "PARTNER"],
  "status": "DONE",
  "summary": "What installing the marketplace puts into a session — three plugins, five kinds of instrument, and the checkers that read a repository — and the four things this repository declines to be.",
  "keywords": ["what", "plugins", "instruments", "hooks", "skills", "refs", "agents", "scope"]
}
-->

# What You Get

`For: Engineering leader · Architect · Backend developer · Web developer · Quality engineer · DevOps / SRE · DevSecOps / Security · Partner / integrator` · `Status: ✅ DONE`

**The way of working, installable.** This repository is both the source and the marketplace, so publishing it is pushing it. There is no build step between the two. What you install is what you can read here, folder for folder.

## Three plugins, and the set your repository loads

The marketplace ships three plugins. Which of them a repository loads follows from what that repository declares about itself, so you pick nothing by hand.

| Plugin | Carries | Loaded by |
| --- | --- | --- |
| `spn-core` | the stage skills, the day-zero walk, the engineer persona, the review panel and its lenses, the document checks, the cross-repo protocol, and the orientation a window opens with | every repository |
| `spn-apps-ts` | the TypeScript skills — new, implement, review, run, verify — their step files, and the write-time guards over enablement grammar, naming and what proves a change | an `APPS` repository claiming `TS` |
| `spn-infra` | the estate skills, the manifest and naming cards, the estate laws, and the guard over secrets and account identifiers | an `INFRA` repository |

**A plugin is how delivery is divided, and it is not how understanding is divided.** The same hook grammar governs a check in `spn-core` and a check in `spn-apps-ts`. So this repository's own documents divide by the kind of instrument, and you never have to work out which plugin answers a question before you can ask it.

## Five kinds of instrument

Everything a plugin folder holds is one of five things. A plugin carries any mix of them, and owes none of them.

| Instrument | What it is | When you meet it |
| --- | --- | --- |
| a **hook** | code the runtime calls for you, wired to a moment in the session | at the moment a write would land, when a window opens, when a turn ends |
| a **skill** | a stage's steps, loaded once the work matches its description | when you ask for the thing it covers, or name it directly |
| a **ref** | a chapter restated as markdown, stamped with the version it last saw | when a skill loads it, or when you read one for the vocabulary |
| a **lens** | one reviewer's viewpoint, with the authority that viewpoint carries | when a review is convened at a gate |
| an **agent brief** | a persona a session can convene, bound by the tools it declares | when work is delegated to a fresh context |

Beside them sit the **checkers and tools** — the programs that read a repository and report on it. Some run inside a hook, some you run by name. They cover document readability, the docs tree, contract cycles, restatement drift, and the shape a partner's copy is in.

## What it refuses to be

Each boundary below exists because crossing it would make something else here untrue.

- **Not a place a rule is authored.** A rule true of every repository belongs to the foundation book. What sits here is a restatement that names its chapter, so a checker can tell you when the two have parted company.
- **Not a package anything runs on.** Nothing here is imported by a service or shipped to a consumer. The `@saasplane` packages, the platform modules and the blueprint library travel through granted registries, separately.
- **Not a repository with nodes.** It declares `GENERAL`, holds no apps and no packages, and answers to no stack. The apps and estate commands decline it by name, which is the correct answer rather than a gap.
- **Not a second copy of the book.** You get the rules as far as a session needs them. Where you want the full argument, the ref names the chapter and you read it there.

## How a change reaches you

A change here is four moves: edit, install, sync, fresh window. A hook script is live on its next run, and everything else waits for the install — so an edit on disk and a change in behaviour are two different events, and the version field is what tells them apart.

The tasks you actually perform are written up as guides: [installing the plugins](../05-guides/01-install-the-plugins.md) and [running the suites](../05-guides/02-run-the-hooks-tests.md).

Who all of this is for, and who else consumes it, is the next page: [Who it's for](03-who.md).

---

<!-- book-nav -->
📖 ← [why](01-why.md) · ↑ [purpose](README.md) · [who](03-who.md) →
