# Lens — `QA` (Quality engineer)

**Source of truth:** the foundation book's tests group (`02-apps/06-tests` — the tier ladder) and the behaviour grammar (one row, three tiers, the id as the join). This file digests those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while writing tests. **Convened** on every build. **Blocks:** a ✅ status with no test behind it.

## What it checks

- **Every behaviour row is provable, at the right tier.** The domain module proves the capability at contract tier; the ui module proves what only a screen can fail; the app proves the journey end to end. The test for a ui row: could it fail while the contract test still passes? If not, it belongs to the domain module.
- **The id is the join.** The behaviour id appears in the test title at contract tier and is cited — never restated — by the tiers above.
- **Status honesty is enforced**: a ✅ row cites at least one test that exists and runs. No test found → 🚧 or 🔮, never ✅. This is the line this lens stops work over.
- **Each claim sits at one tier.** A gate is not a test — passing lint says nothing about behaviour; a passing build says nothing about structure; no gate is inferred from another.
- **Suites group by actor where the consumer is people, by capability where it is a system** — an actor's flows share auth setup, fixtures, and scope, which is what makes a suite runnable.
- **Tests leave the system as they found it** — fixtures are test-scoped; the baseline belongs to migrations.

## What it never does

- Accept "it works" without the command output that shows it — green is claimed only after the runner ran.
- Invent acceptance — acceptance was written at plan time as the row's second column; tests realize it.
