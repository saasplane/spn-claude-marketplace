---
name: test
description: What proves a behaviour, at which tier, and what a passing suite does and does not mean. Use when deciding where a test belongs, judging whether a change is adequately proven, or reading a test result honestly. Stack-agnostic; the stack plugin supplies the runners and the gate commands.
---

# test — proof, at the tier that means something

**A behavior is a claim that someone can do something. A test is what makes the claim checkable.** A behavior nobody can prove is a wish, and a claim marked done without a test citing it is a status nobody verified.

## The tiers, and what each actually proves

| Tier | Proves | Cannot prove |
| --- | --- | --- |
| **Unit** | a rule, transformation, or rendering decision behaves as specified, in isolation | that it is wired to anything |
| **Component** | what a rendering harness cannot compute — styles, mode flips, layout at real breakpoints, hover and portals, visual change | that anything is wired to anything |
| | **A browser is a runner, not a tier.** A case that mounts one piece with no fakes is unit tier whichever runner shows it. Only a package owning its own components owes this tier by name | |
| **Integration** | the code against its **real backing resources** — scoping, isolation, invalidation, delivery | that a caller can reach it, or may |
| **Contract** | the **published surface** under a real principal — gates, error shapes, read levels, compatibility | why a person gave up halfway through |
| **Journey** | a person completing an outcome through a real entry | which rule failed when it fails |

**A node may double a seam it owns, and nothing else.** That one rule decides where a case lives, and everything below follows from it. A case reaching for a fake of something its node does not own belongs in another repository, however green it runs.

**The tier is derived, not debated: a project's KIND fixes its consumer, and the consumer fixes what proof means.** A package consumed by other code is proven where that code meets it; an application consumed by people is proven where people meet it.

| The project is | Its consumer is | It owes |
| --- | --- | --- |
| A support package | Modules and apps | Every tier it reaches — unit, integration wherever it fronts a real resource, component where it owns web components. It invented its own seam, so it may double there |
| A domain module | The composing application | **Unit alone.** It ships no shell, so a server module **cites** the composing application's contract and a web module **cites** its journey |
| An application | People and other systems | **Both faces of what it composes** — contract through its entries, and journeys over its own surfaces |
| An API client | Other systems | Integration against a running service — this **is** that service's contract tier |
| A command-line tool | Operators and pipelines | Unit · integration of the invoked command |
| The workspace | — | **Only what no single application can resolve** — a hand-off between two deployables, and nothing else |

**A module ships no shell on either face.** Its services need an application's configuration, resources and entries; its components need an application's providers, session and routing. So a module cannot stand either one up alone, and a suite that appears to is faking the application around it.

**Pick the tier by what would break.** A validation rule breaks in a unit; an authorization gate breaks against the real service; a journey breaks end to end. Writing a unit test for something that only fails when wired is a green that proves nothing.

**Neither substitutes for the other.** A passing unit suite with a broken wiring is a passing build of a broken product. A passing journey with untested rules is a change nobody checked at the level where it is decided.

## Where a gate belongs

Format, lint, and generated-file protection run **pre-commit**. Codegen freshness, structure, and type checking run pre-commit where fast and otherwise on the **pull request**. Unit and component suites gate the **merge**, and integration and contract tiers run on the **affected projects**. Journeys run **after deployment to a rung**, on a quiesced stack, and release gates run **inside the release**, before anything is versioned.

Two rules: a gate runs at **exactly one placement**, and a pre-commit gate **never reaches the network or a resource** — a commit must work offline.

**Credentials for a journey come from the environment** — never hardcoded, never defaulted. A suite missing one fails loudly rather than signing in as the wrong actor.

## Static gates are not tests

Codegen freshness, structural conformance, type checking, lint — these prove the code is **well-formed**, not that it **works**. They are cheap and they run first, but passing all of them says nothing about behavior. For anything user-visible, the running system is the exit criterion.

Equally: **never infer one gate from another.** A passing build says nothing about structural conformance; a passing lint says nothing about tests.

## Reading a result honestly

- **Report the count, not the color.** A suite that silently stopped collecting tests is green. The number is what tells you it ran.
- **Never report a gate or a check you did not run.** An assumed pass is worse than an unknown, because it stops anyone looking.
- **A flake is a finding until proven environmental.** Confirm from evidence — the observed failure mode, not the inconvenience of the timing. A consistent failure is a regression no matter how much it looks like the last flake.
- **Say what you did not cover.** The gap a reader does not know about is the one that ships.
- **Read the gate's own exit AND its finding count.** Zero findings with a non-zero status means the gate refused to run, not that the code is clean. A gate wrapped in a shell block or piped into another command reports the *wrapper's* status, so a runner can announce success over a failure. When the two numbers disagree, the answer is **unrun**.
- **A cached result is a claim about inputs, not a run.** A build system replays a cached task's output verbatim — same ticks, same counts — and a cached build reports success having rewritten nothing. To prove a change you just made, verify the **artifact**: the timestamp moved, the hash changed, the marker is present, and what is served matches what was built. Capture that state *before* rebuilding, or a silent no-op is invisible.
- **A tier nothing invokes proves nothing.** Check the command you ran actually covers the tier you mean — a `test` target may drive one runner while another tier sits behind a script no gate calls. A tier declared, written and never executed is the most expensive absence, because every row resting on it reads as covered.

## Harness, fixture, helper — three things, kept apart

- **Harness** — what stands the system under test up and tears it down: a test application, substitutable providers, a principal, resource lifecycle. It holds no scenario data and **never asserts**. A stack's support family ships it; no module assembles its own boot.
- **Fixture** — the data one test creates before it asserts, scoped to that test. Not the baseline a migrated system starts with, which is shared and owned by migrations.
- **Helper** — assertion-free convenience. The moment it starts or holds something, it is harness and belongs with the setup.

A **double** stands in for a collaborator and belongs to the unit tier only; a **test provider** satisfies the real capability interface and behaves — the two are not interchangeable.

## Managing the case set

- **A case belongs to the node whose claim it proves and travels with it** — deleting a capability deletes its cases in the same change.
- **Cases land with the claim, not after it.** A surface merged with its cases deferred has no status anyone can read.
- **Suites group by consumer**: by actor where people consume the node (one auth setup, one fixture set per actor), by capability where a system does.
- **Placement is derived, never chosen** — kind fixes the tier, the tier fixes the folder, and suites mirror the source seats they prove.
- **A skipped case is a 🚧 on the row it proves**, never a silence behind a green summary.

## Where tests live

**In their own tree, never beside the code they test.** Co-located tests ship with the implementation or need an exclusion rule that then has to be maintained forever.

A test that proves a stated behavior should be traceable to it. Where the platform records behaviors with identifiers, the test title carries the identifier. The claim and its proof can then be matched mechanically rather than by reading.

## Data and isolation

- **A test that depends on state another test left is not a test.** Seed what you need, or derive it.
- **A shared local stack is shared.** A destructive reset wipes data belonging to work that is not yours; it runs on an explicit instruction and against a named target.
- **Seed and template changes only land on a clean re-migrate.** A warm database keeps the old row, so a seed edit tested against a warm stack proves nothing about a fresh one.
- **Run journey tests on a quiesced system.** Building, provisioning, or resetting concurrently produces timeouts that read as failures and are not.
- **A case that destroys a session runs where nothing else depends on that session.** Revoking a sign-in, logging out, revoking a device or changing a credential destroys the session other cases are working in, and worker isolation cannot help because the damage is server-side. Classify by what a case flips — nothing, its own throwaway data, a shared session, or global state — and let that decide both where it runs and when.

## Lenses

Wear `refs/lenses/qa.md` while writing tests. On every build's close, convene the `spn-panel` subagent with `qa`: a ✅ status with no test behind it stops the work.

## Finish

Report per tier: what ran, the count, and what failed with its actual output. Then state the honest coverage — which behaviors are now proven, which are asserted but unproven, and what tier would settle the difference.
