<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md",
      "seen": "6f182673"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/05-test.md",
      "seen": "020faf26"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/05-test.md",
      "section": "Which case carries an id",
      "seen": "62048c29"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/05-test.md",
      "section": "What the phase owes when it closes",
      "seen": "8f12c198"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/06-tests/README.md",
      "section": "A case title carries the id and the sentence",
      "seen": "9c154376"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/06-tests/README.md",
      "section": "Code coverage is reported, never enforced",
      "seen": "300e384f"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/06-tests/README.md",
      "section": "The selective loop — what runs while work is under way",
      "seen": "5d190e92"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/13-tests.md",
      "section": "Coverage — how the model is rendered here",
      "seen": "e03d4ac4"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/02-packages/02-tests.md",
      "section": "One entry, and one printer",
      "seen": "d697a45a"
    }
  ],
  "decisions": [
    {
      "repo": "spn-foundation",
      "row": "RD.DEVEX.FUNCTION.064",
      "seen": "554e4ba4"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.133",
      "seen": "25dc665f"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.DEVEX.WORKSPACE.181",
      "seen": "0cde0770"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.DEVEX.WORKSPACE.207",
      "seen": "c4c45c16"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.DEVEX.WORKSPACE.245",
      "seen": "edaf28ed"
    }
  ]
}
-->
---
name: test
description: What proves a behaviour, at which tier, and what a passing suite does and does not mean. Use when deciding where a test belongs, judging whether a change is adequately proven, or reading a test result honestly. Stack-agnostic; the domain plugin supplies the runners and the gate commands.
---

# test — proof, at the tier that means something

**Read [`refs/devex/workspace/workstream.md`](../../refs/devex/workspace/workstream.md) before acting.** It holds the loop this skill runs inside: how a prompt is read, where a new ask goes, what a prompt does to a running arc, and how a reply closes.

**Read the repository's *Test and verify* guide first — `docs/05-guides/*-test-and-verify.md` — and never `CLAUDE.md` for how to run anything** (`RD.DEVEX.WORKSPACE.181`). A repository that can run owes that guide: the keys the run reads, the numbered steps with their commands, what you should see, and what to do when a step fails. `CLAUDE.md` is generated and states nothing about running. The repository's `.claude/saasplane/rules.md` § How this repository is tested names the guide's path, or says there is none. Where there is none, say so in your report rather than guessing a sequence.

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
| A support package | Modules and apps | Unit, and component where it owns web components. It **carries** integration wherever it fronts a real resource, and the kind does not owe it. It invented its own seam, so it may double there |
| A domain module | The composing application | **Unit alone.** It ships no shell, so a server module **cites** the composing application's contract and a web module **cites** its journey |
| A service application | Other systems, and the web applications that put it in front of people | **Contract** through its entries, and **no journey** — a journey is a person at a screen, and a service deploys none. Its API client's contract run is credited to it; its own `tests/integration/` cases are integration |
| A web application | People | **Journeys** over its own surfaces, and **component** for its shell components. One journey run from the repository root is credited to every application whose surfaces it drives |
| An API client | Other systems | **Contract** against a running service — its suite **is** that service's contract tier, sits in `tests/contract/`, and reports under that name |
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
- **A cache fails in the other direction too.** A build cache keyed by file name outlives a rename. The next build then fails resolving something no source declares any more. Read that red as a **stale build, not a defect**. Then clear the cache in the change that renamed, moved or deleted what it compiled.
- **A tier nothing invokes proves nothing.** Check the command you ran actually covers the tier you mean — a `test` target may drive one runner while another tier sits behind a script no gate calls. A tier declared, written and never executed is the most expensive absence, because every row resting on it reads as covered.

## Harness, fixture, helper — three things, kept apart

- **Harness** — what stands the system under test up and tears it down: a test application, substitutable providers, a principal, resource lifecycle. It holds no scenario data and **never asserts**. A stack's support family ships it; no module assembles its own boot.
- **Fixture** — the data one test creates before it asserts, scoped to that test. Not the baseline a migrated system starts with, which is shared and owned by migrations.
- **Helper** — assertion-free convenience. The moment it starts or holds something, it is harness and belongs with the setup.

A **double** stands in for a collaborator and belongs to the unit tier only; a **test provider** satisfies the real capability interface and behaves — the two are not interchangeable.

**Behaviour does not cross a harness's process boundary.** A component tier's harness may drive the browser from another process. What it marshals across is data. A function handed over as an input answers nothing on the far side. A component declared inside the case may not be mountable at all. So you define that behaviour in the build the browser runs. It covers a render prop, a child that is a function, or a callback whose answer the component reads. The case imports that module and drives it through serializable inputs alone. **Most components need none of this**, and the case keeps its own mount by default.

## Managing the case set

- **A case belongs to the node whose claim it proves and travels with it** — deleting a capability deletes its cases in the same change.
- **Cases land with the claim, not after it.** A surface merged with its cases deferred has no status anyone can read.
- **Suites group by consumer**: by actor where people consume the node (one auth setup, one fixture set per actor), by capability where a system does.
- **Placement is derived, never chosen** — kind fixes the tier, the tier fixes the folder, and suites mirror the source seats they prove.
- **A skipped case is a 🚧 on the row it proves**, never a silence behind a green summary.

## Where tests live

**In their own tree, never beside the code they test.** Co-located tests ship with the implementation or need an exclusion rule that then has to be maintained forever.

## Which case carries an id

**A case carries the id of the row it proves, and the tier decides which cases do — MUST** (`RD.DEVEX.FUNCTION.064`). The id opens the case's title and the sentence follows it — `IAM.LOGIN.01 a person signs in with a password` — because a person reading a failed run in cloud needs both what broke and what it means.

| Tier | Which cases carry an id | What a case with no id names instead |
| --- | --- | --- |
| contract · component · journey | every case | nothing: each of these tiers proves what a consumer or a person meets, so a case with no id is a finding |
| integration | every case proving a guarantee only the real resource can hold, which in practice is every real case | a fixture or a helper's own check names what it checks |
| unit | a case proving a row whose `Tier` is `UNIT` | a case over a private rule names the rule, because nothing outside the node can see it |

**A row's `Tier` equals the tier of the case that proves it — MUST.** A run writes only the rows that declare the tier it ran. So a row declaring one tier, whose only case runs at another, is written by neither run and never reads as proven. Where the two differ, read the case and correct the side that is wrong: change the row when the case proves it at the tier that owns the claim, and move the case when it sits in the wrong tier.

**Where the id sits is the runner's to say**, and each runner has one place for it:

| Runner | Where the id sits | Example |
| --- | --- | --- |
| Jest, Vitest, Playwright | the case title, or the `describe` title around it; a journey adds its phase tag to the same title | `IAM.LOGIN.01 a person signs in with a password` |
| bash `*.sh`, in an estate package | the case line `helpers/case.sh` prints, `ok <TIER> <ID> <title>` | `ok CONTRACT PLT.DOMAIN.01 one local apex has one owner, and none is a cloud apex` |
| node `*.test.mjs`, in an estate package | the test's name, opening with its tier and its id | `UNIT BLU.ROUTE.01 a tenant host is served from the environment its route names` |
| `tofu test` `*.tftest.hcl` | the `run` block's name, with an underscore for each dot of the id | `MOD_SEAT_01_the_module_seat_plans_for_its_world` |

**A case the tier binds that carries no id is a finding**, because it proves a row nobody can find.

## Data and isolation

- **A test that depends on state another test left is not a test.** Seed what you need, or derive it.
- **A shared local stack is shared.** A destructive reset wipes data belonging to work that is not yours; it runs on an explicit instruction and against a named target.
- **Seed and template changes only land on a clean re-migrate.** A warm database keeps the old row, so a seed edit tested against a warm stack proves nothing about a fresh one.
- **Run journey tests on a quiesced system.** Building, provisioning, or resetting concurrently produces timeouts that read as failures and are not.
- **A case that destroys a session runs where nothing else depends on that session.** Revoking a sign-in, logging out, revoking a device or changing a credential destroys the session other cases are working in, and worker isolation cannot help because the damage is server-side. Classify by what a case flips — nothing, its own throwaway data, a shared session, or global state — and let that decide both where it runs and when.

## The selective loop: run the cases of what you touched

**While work is under way, run the cases of what you touched, and no whole tier — MUST** (`RD.DEVEX.WORKSPACE.207`). A whole tier answers a question about every row a node holds, and a change to one module asks about a few of them. The loop holds for unit, component, contract and integration, in every kind. Journeys stay outside it, because they need a quiesced running stack.

**Count what you touched in behaviour rows, never in folders.** The capability page that claims the changed code names the rows it realizes, and each row names its cases through the id in their titles.

| What changed | What it touched |
| --- | --- |
| the source of a module | the rows its capability page claims, and the cases that carry their ids |
| a contract state | those rows, and the cases of every caller of the state |
| a generated client | the cases of every node that calls through the client |

**Write the selection in the order, by hand, from the plan's list of files.** No command derives it. Pass it to the runner after `--`:

```bash
spnutils apps test <tier> <run> <package> -- <the runner's own selection>
spnutils infra test <run> <package>          # an estate package is selected whole
```

Everything after `--` reaches the runner unchanged, so the words are the runner's own, and the stack's plugin says what they are. A path given to the runner is allowed here, because the node's own configuration has already decided which cases the node owns. The selection only picks, among those, the ones this change touched.

**Use two run names for a step.**

| Run name | Used for | Why |
| --- | --- | --- |
| one working name, reused | every selective run made while coding | a reused name replaces its own file, so the 20 files a tier keeps are not spent on small runs |
| one fresh name, used once | one run over every case the step touched, once they pass | this is the run the rows are stamped from, and each row's `Updated at` names it |

**Stamp from the freshly named run, and never with `--reach repository`.** The stamp writes the rows that run names and leaves every other row as it is. `--reach repository` says the run was the whole of its tiers, and it sets every row the run did not name back to `PLANNED`. So a `SUCCESS` row says that its own case passed when that case last ran, and `Updated at` says how old that proof is.

**State acceptance as named behaviour ids, read as `SUCCESS` from the run file — MUST.** It is never an exit code: the runner exits clean when a selection matches no case, so a mistyped selection passes. It is never a count of a whole tier, which only a whole run can meet. **Report a selection that matched no case as *nothing proves this*.**

## When a whole tier runs

**A whole tier runs before a release, or in one of five named cases — MUST** (`RD.DEVEX.WORKSPACE.245`).

**Before a release, the full pass is a named step.** Run the owed tiers of the nodes the release publishes, whole and once, with the services up. Ask for the release go only after that pass. The release command runs every tier it can run by itself and releases every library, a generated client among them. It does not run a client's contract tier, which calls a running service, and it names that tier as not run. So that tier is run here, in the full pass.

**Outside a release, run a whole tier only in these five cases:**

| The case | Why a selection is not enough |
| --- | --- |
| what the changed package publishes changed, and nodes outside the order import it | their cases can break, and the order's selection does not name them. A change that stays behind what the package publishes is proved by the package's own cases |
| a test configuration, a global setup or a runner file changed | every case of the tier stands on it |
| a spec or a source file was renamed, moved or deleted | a selection written from the old names can match nothing, and a stale build can fail a case nobody touched |
| the version of a dependency moved | every case that reaches the dependency last passed against the old version |
| the developer asks | the developer's word needs no second reason |

- **A failure that points outside the touched area is your judgement.** Say what you saw, and say that the choice to widen the run was yours.
- **A flake stays a finding until it is proven environmental.** A wider run is never the way to set one aside.
- **For a partner, a whole tier means a whole tier of their own nodes.** A failure that points into a published package is a report to the platform, and not a wider run. A version move of the platform or of the toolchain runs every tier of every node, under one run name.
- **An arc's `PROOF` row runs again, on clean trees, what the arc's rows touched.** It runs no whole tier unless one of the five cases holds.

## After a run: stamp the rows

**Every run is named, and `spnutils` runs a tier and writes that run's file, never a row** (`RD.DEVEX.UTILS.071`). Give a name to every test command: `spnutils apps test <tier> <run> <package>`, `spnutils infra test <run> [package]`. While you code, that is the working name of the selective loop, and the fresh name for the run you stamp from. A full pass gives every tier of the pass one name, such as `full-1001`. The run writes `tests/.output/<tier>/runs/<run>.json`, and a journey phase writes `<run>.<phase>.json`, so one run name never overwrites itself across phases. A reused name replaces that one file and no other, and each tier keeps its 20 newest. What the run means for the documents is yours, through this plugin's scripts:

```bash
spn-devex behaviours stamp check <run> .        # what it would change
spn-devex behaviours stamp write <run> .        # Status and Updated at, from that run
spn-devex behaviours coverage show . --json     # the tests report's measurement
```

The writer reads only the run you name, `<run>.json` and every `<run>.<phase>.json` in every node, and refuses a stamp that names none, listing the newest runs it found. It writes `Updated at` as `<time> · <run>`, so a row names the run that proved it. It stamps a row only from a result at the row's own `Tier`, never writes over `MANUAL`, and leaves a row the run did not mention alone unless `--reach repository` says the run is the whole of its tiers. It reads a register by its headings, so an eight-, nine- or ten-cell row is stamped alike. A repository's one root journey run is read wherever it wrote its file, so the rows of every web application it drove are stamped from it (`RD.SUPPORT.APPS.135`). The run's name in `Updated at` is a label: it tells a reader which run last proved the row, and when. A run file is temporary output, so nothing requires it to be kept and you may delete it at any time. Nothing checks a row against its run file after the stamp. The coverage measurement and the reports read the stamped rows only, and open no run file. A stack's plugin adds what knows the stack — where a case lives, for the join.

## Code coverage is reported, never enforced

**Code coverage is measured and reported, never enforced — MUST** (`RD.SUPPORT.APPS.133`). The rows answer *what was claimed and proven*; coverage answers a different question, *how much of the code does any suite run at all?* A run that collects it prints its summary — lines, statements, functions and branches — and the test tool writes `coverage-summary.json` beside its report.

- **No configuration carries a threshold, and nothing fails a run on a percentage.** A percentage used as a gate gets met the cheapest way: by editing the number down, or by writing cases that run code without checking what it does.
- **An exclude carries its reason beside it — MUST.** Code no automatic test can reach, such as a proof-of-person challenge or a vendor round trip, is excluded by name with a comment on the same entry saying why. A reader can then tell code that cannot be tested from code nobody tested.
- **A journey configuration collects no coverage.** It drives a browser against a running stack, and a code-coverage number there measures nothing a person reads.

## Lenses

Wear `refs/devex/agent/lenses/qa.md` while writing tests. On every build's close, convene the `spn-panel` subagent with `qa`: a ✅ status with no test behind it stops the work.

## Finish

Report per tier: what ran, the count, and what failed with its actual output. Then state the honest coverage — which behaviors are now proven, which are asserted but unproven, and what tier would settle the difference.

**A full-repository run fixes what keeps a row unproved before the report is written.** A run over the whole repository is not only a report. Each of these keeps a row unproved, and each one is the run's own work:

- a row whose tier is not the tier of the case that proves it;
- a runner that ran and wrote no run file, so its cases prove nothing;
- a case its tier binds that carries no id;
- a red case.

Fix each one, run that tier again, and then write the report. Anything the run cannot fix is named in the report with the reason.
