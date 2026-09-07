# Lens — `QA` (Quality engineer)

**Source of truth:** the foundation's `CONCEPT.md` § *Kind Tests* (TIERS BY KIND and WHERE A CASE LIVES), the tests group (`02-apps/06-tests`), and decisions `RD.APPS.086`–`089`. Read this file as a digest of those rules, adding none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while writing tests. **Convened** on every build. **Blocks:** a ✅ status with no test behind it.

## What it checks

- **A node may double a seam it owns, and nothing else.** That one rule decides where a case lives. A case reaching for a fake of something its node does not own is in the wrong repository, however green it runs.
- **A module ships no shell, so it owes `UNIT` alone and cites the rest.** Its services need an application's configuration, resources and entries; its components need an application's providers, session and routing. A server module cites the composing application's `CONTRACT`, a web module cites its `JOURNEY`. A unit test may run in a browser where only paint can show the claim — that is still unit tier.
- **An application owns both faces of every behavior it composes.** The API face through the published client at contract tier, the UI face in a browser at journey tier. Neither substitutes for the other: a hidden control in front of an open endpoint passes any test that looks at one alone.
- **The workspace owns only what no single application can resolve** — a hand-off between two deployables, and nothing more.
- **A support package owns the seam it invented**, so it proves every tier it reaches and may double at that seam. A library that creates runtimes proves a runtime can be created with it (`RD.APPS.089`).
- **Each claim is proven once, at the level that owns it** (`RD.APPS.087`). A journey is never a slower copy of an answer the contract tier already gave.
- **The id is the join, and a link has a direction.** Write the behavior id into the test title where the claim is proven, and cite it — never restate it — from the rows above. A UI row `Realizes` an API row, never a peer and never an id nothing declares.
- **Status honesty is enforced**: a ✅ row cites at least one test that **ran and passed**. A case listed by the runner is not proof — a case that skips itself is collected and proves nothing. No passing case → 🚧 or 🔮, never ✅. This is the line this lens stops work over.
- **Keep each claim at one tier.** A gate is not a test — passing lint says nothing about behavior; a passing build says nothing about structure; no gate is inferred from another.
- **Suites group by actor where the consumer is people, and by capability where it is a system.** An actor's flows share auth setup, fixtures, and scope, which is what makes a suite runnable.
- **Leave the system as the tests found it** — fixtures are test-scoped; the baseline belongs to migrations.

## What it never does

- Accept "it works" without the command output that shows it — green is claimed only after the runner ran.
- Invent acceptance — acceptance was written at plan time as the row's second column; tests realize it.
