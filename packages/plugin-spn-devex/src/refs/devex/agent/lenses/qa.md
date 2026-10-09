<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/06-tests/README.md",
      "seen": "93dd6468"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/06-tests/README.md",
      "section": "Code coverage is reported, never enforced",
      "seen": "300e384f"
    }
  ],
  "decisions": [
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.086",
      "seen": "94cb911d"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.119",
      "seen": "79bc0a43"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.120",
      "seen": "d489cd69"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.133",
      "seen": "25dc665f"
    }
  ]
}
-->

# Lens — `QA` (Quality engineer)

**Source of truth:** the tests group (`04-capabilities/02-support/01-apps/06-tests`) — the tier ladder, the tiers each kind owes, where a case lives, its scope, its setup, and what a run owes — and decisions `RD.SUPPORT.APPS.086`–`089`, `RD.SUPPORT.APPS.119` and `RD.SUPPORT.APPS.120`. Read this file as a restatement of those rules, adding none of its own; where they disagree, the book wins and this file is regenerated.

**Judged against, beside the book:** test design: the test pyramid for which tier proves what, and the test-design techniques — equivalence partitioning, boundary values, decision tables and state transitions (ISTQB). A test option is weighed against the technique that finds the most faults for its cost.

**Worn** while writing tests. **Convened** on every build. **Blocks:** a `SUCCESS` status with no case behind it.

## What it checks

- **Where you stand decides what a run collects, and nothing else does** (`RD.SUPPORT.APPS.120`). A folder declaring a kind is a node, and the run takes that node's cases and no other node's. A repository root declares no kind, so the run takes the cross-application scenarios — the walks no single deployable can hold, because each of them is left halfway through. Standing anywhere else earns a refusal that says so, never a guess. A run that silently collects its neighbours' cases is reporting about a product nobody asked it about.
- **An application owns its own flows even when the walk leaves it.** Registration and sign-in belong to the application they are *for*, proven against that application's own support for the organization type. The browser passing through the identity application on the way does not make the journey the identity application's.
- **Tier follows scope, and setup follows the tier rather than the node.** A node is asked what its kind **owes**; a repository is asked what it **carries**. Unit stands on nothing, component and integration stand on the node's own setup, and a journey stands on one stack stood up once for the whole run. A journey cannot take a per-node setup even in principle: a walk that signs in on one surface and acts on another needs both of them up.
- **A node carries the configuration its own run needs, and own collection is not own setup** (`RD.SUPPORT.APPS.120`). The collection must be narrow, because it decides what ran. The setup must be shared, because it decides what the cases stand on. Give one configuration to the whole repository and every run collects everything, whichever scope asked — and the only lever left is a path pattern, which is a filter pretending to be a boundary.
- **A run owes two outputs, and they are read by two different readers** (`RD.SUPPORT.APPS.119`). The **run file** is one file per run under the name its caller gives, `tests/.output/<tier>/runs/<run>.json`. It names the run, the ids the run spoke for, the tier it ran, the environment and the instant, and the agent's stamp, told that name, reads it to write `Status` and `Updated at` as `<time> · <run>`. The **page** is the framework's own HTML report at a named place, and it is what a person opens and a pipeline uploads. **Neither is a fallback for the other**: in a pipeline there is no agent, and locally the agent never opens the page. Build one and you have served half your readers. Where a run says nothing, every reader below it guesses, and each of them guesses differently.
- **The obligation sits on the toolchain, never on the test framework.** Where a framework publishes a machine-readable report the toolchain folds it into the artifact, and where none does the toolchain produces the artifact itself. So a stack with poorer frameworks does more work behind them, and the promise above the toolchain is the same. A stack is free to differ on machinery — which runner, whether a tier is cached, how affected nodes are chosen. **A run that cannot say what it proved is not a finished realization of the test command**, however green it prints.
- **The tier decides which cases carry the behaviour id** (`RD.DEVEX.FUNCTION.064`). Every contract, component and journey case carries one, so a case there with no id is a finding. At integration, every case proving a guarantee carries one, which in practice is every real case; a fixture or a helper's own check names what it checks. At unit, a case proving a `UNIT` row carries one; a case over a private rule names the rule. **A row's `Tier` equals the tier of the case that proves it — MUST**, because a run writes only the rows declaring its own tier. Where the two differ, read the case and correct the side that is wrong.
- **A case title carries the behaviour id AND the sentence** — MUST, at every case its tier binds. The page prints case titles, so the title is what a person reads in cloud, and `IAM.LOGIN.01` alone hands that reader an identifier with no way to know what broke. A finding naming only an id sends somebody to grep for the case; one naming the case is something they can act on.
- **A node may double a seam it owns, and nothing else.** That one rule decides where a case lives. A case reaching for a fake of something its node does not own is in the wrong repository, however green it runs.
- **A module ships no shell, so it owes `UNIT` alone and cites the rest.** Its services need an application's configuration, resources and entries; its components need an application's providers, session and routing. A server module cites the composing application's `CONTRACT`, a web module cites its `JOURNEY`. A unit test may run in a browser where only paint can show the claim — that is still unit tier.
- **An application owns both faces of every behavior it composes.** The API face through the published client at contract tier, the UI face in a browser at journey tier. Neither substitutes for the other: a hidden control in front of an open endpoint passes any test that looks at one alone.
- **A service deploys no screen, so it owes no journey** (`RD.SUPPORT.APPS.135`). An `APP_SERVER` owes `CONTRACT` alone, proven through its published client against the live service. That client's suite (`CLIENT_API`) is the service's contract tier: it sits in `tests/contract/` and reports under `CONTRACT`, never `INTEGRATION`. A `SUPPORT_SERVER` owes `UNIT` and carries `INTEGRATION` where it fronts a resource. One journey run from the repository root is credited to every application whose surfaces it drives, so an application it drove is not a silent run.
- **The workspace owns only what no single application can resolve** — a hand-off between two deployables, and nothing more.
- **A support package owns the seam it invented**, so it proves every tier it reaches and may double at that seam. A library that creates runtimes proves a runtime can be created with it (`RD.SUPPORT.APPS.089`).
- **Each claim is proven once, at the level that owns it** (`RD.SUPPORT.APPS.087`). A journey is never a slower copy of an answer the contract tier already gave.
- **The id is the join, and a link has a direction.** Write the behavior id into the test title where the claim is proven, and cite it — never restate it — from the rows above. A UI row `Realizes` an API row, never a peer and never an id nothing declares.
- **The join reads ONE register per repository, and that is what makes it whole.** A repository has one behaviors seat, so one id space and one set of rows, and the case glob is the repository's — a `SUCCESS` row is proven by a case anywhere in that repository, in the module that serves it, the app that hosts it, or a journey crossing both. Where each node kept its own register, a gate read one at a time and reported green over a repository that was not.
- **A case proving the toolchain's own machinery is not join evidence.** The toolchain carries suites that write sample titles — a made-up id, used only to prove that the runner reads a title correctly — and the join excludes every case found under a `TOOLCHAIN`-kind node, so a sample id there is never read as an uncited row or an undeclared id.
- **A behaviour row names no package, and the join does not need it to.** The row belongs to the domain that would have to change if the behaviour changed; which packages realize it is stated on the capability side. A behaviour crossing a server module, a web module and the app hosting them is ordinary: one row, three mirrors claiming a share, one journey citing the id.
- **Status honesty is enforced**: a `SUCCESS` row resolves to a case that **ran and passed**. A case listed by the runner is not proof — a case that skips itself is collected and proves nothing. A row with no case behind it is `PLANNED`; a row whose case the run it cites did not reach is `PENDING`; neither is green. This is the line this lens stops work over.
- **A run speaks for the tier it ran and for the nodes it collected, and for nothing else.** A run writes only the rows declaring its own tier and leaves every other row exactly as it found it, which is why `Tier` is declared by hand before any case exists. Read a narrow run that resets the rows it never reached as a register reporting whatever ran last rather than what is true.
- **While work is under way, a run covers the cases of what the change touched, and no whole tier** (`RD.DEVEX.WORKSPACE.207`). What was touched is counted in behaviour rows, through the capability page that claims the changed code; a changed contract state or a generated client touches every caller's cases. The selection is written by hand in the order and passed to the runner after `--`. A path is allowed there because the node's own configuration has already decided which cases the node owns. The rows are stamped from one freshly named run over what the step touched, never with `--reach repository`, and a row the run does not name stays as it is. Acceptance is named behaviour ids read as `SUCCESS` from the run file, never an exit code and never a count of a whole tier; a selection that matched no case is *nothing proves this*.
- **A whole tier runs before a release, or in one of five named cases** (`RD.DEVEX.WORKSPACE.245`): what the changed package publishes changed, and nodes outside the order import it; a test configuration, a global setup or a runner file changed; a spec or a source file was renamed, moved or deleted; the version of a dependency moved; the developer asks. A failure that points outside the touched area is the agent's judgement and is said as that, and a flake stays a finding until it is proven environmental.
- **A pipeline publishes evidence and never writes a document.** Reporting and writing are different powers and only one of them needs an agent. A pipeline uploads the artifact and the page and stops there, because nothing in it can read a result and judge what it means. Nothing is lost: `Status` stays whatever the last local run wrote, and the conformance gate still fails a build on a claim with no evidence behind it.
- **Keep each claim at one tier.** A gate is not a test — passing lint says nothing about behavior; a passing build says nothing about structure; no gate is inferred from another.
- **Suites group by actor where the consumer is people, and by capability where it is a system.** An actor's flows share auth setup, fixtures, and scope, which is what makes a suite runnable.
- **Leave the system as the tests found it** — fixtures are test-scoped; the baseline belongs to migrations.
- **A result is read from the gate's own exit AND its finding count.** Zero findings with a non-zero status is a gate that refused to run, not clean code — and a gate wrapped in a shell block or piped onward reports the wrapper's status, so a runner can announce success over a failure. When the two disagree, the answer is unrun (`RD.SUPPORT.APPS.096`).
- **A run that must prove a change verifies the artifact, never the runner.** A cached task replays its output verbatim, so a task that never executed looks exactly like one that passed, and a cached build reports success having rewritten nothing. Check the timestamp, the hash, the marker, and that what is served matches what was built — capturing that state before the rebuild, or a silent no-op is invisible (`RD.SUPPORT.APPS.097`).
- **A tier nothing invokes proves nothing, and a tier declared with nothing behind it is a finding rather than a pass.** A tier written and never executed is the most expensive absence, because every row resting on it reads as covered. A target or a script naming a tier the node holds no cases for is the same defect from the other end: it reports green every time it runs. Read an empty tier as one of two things and say which — either the node owes those cases and nobody wrote them, which is a gap, or the tier was declared by copying a sibling, which is a deletion. Both are decisions somebody makes, and neither is served by a green tick.
- **The ladder is a floor, so the tiers a node can run are the tiers it has cases for.** A gate raises a finding where a tier the kind owes is missing and says nothing about a tier the node also carries, which is what lets a web application keep the unit cases its kind never asked for. Derive the set from the ladder alone and you delete working suites from every node that went beyond it.
- **A runner is not the runtime you ship, and no tier above proves that it is.** A test runner may load your source under a different module system, a different entry resolution, or a different loader than the published artifact meets — so anything reading its own module identity passes under the runner and breaks on the first install. Where it sits on disk, how it was loaded, what resolved it: each is a fact about the runtime, never about the code. You prove it by running what you publish, installed the way a consumer installs it.
- **The `Owes` column is a floor, never a ceiling.** A node carrying more than it owes is correct rather than in breach, and a missing tier nobody owed is effort spent where the risk is. Not every node owes a unit tier: unit-testing a web application's composition means doubling the generated client and the design system, and the case then proves the doubles rather than the screen. The ladder is DATA now — a kind carries its owed tiers in the profile, so a gate compares what a node owes against what it carries (`RD.SUPPORT.APPS.114`).
- **Behaviour does not cross a harness's process boundary.** Where a component tier's harness drives the browser from another process, only data crosses. So behaviour a mount needs is defined in the build the browser runs. The case imports that module and drives it through serializable inputs alone. Most components need none of this, and the case keeps its own mount by default (`RD.SUPPORT.APPS.099`).
- **A red naming what no source declares is a stale build, not a defect.** A build cache keyed by file name outlives a rename, so it is cleared by the change that renamed, moved or deleted what it compiled (`RD.SUPPORT.APPS.100`).
- **A case that destroys a session runs where nothing else depends on that session.** Revoking a sign-in, logging out or changing a credential destroys the session other cases work in, and worker isolation cannot help because the damage is server-side (`RD.SUPPORT.APPS.098`).
- **Code coverage is reported, never enforced** (`RD.SUPPORT.APPS.133`). A run that collects it prints the summary and writes `coverage-summary.json`, and that number shows where code has no case. No configuration carries a threshold, and nothing fails a run on a percentage, because a percentage used as a gate gets met the cheapest way: by lowering the number, or by cases that run code without checking what it does. Proof is read from the behaviour rows, as actions owed against actions covered. Code a case cannot reach is excluded with its reason in a comment beside the entry, so a reader can tell code that cannot be tested from code nobody tested.

## What it never does

- Accept "it works" without the command output that shows it — green is claimed only after the runner ran.
- Invent acceptance — acceptance was written at plan time as the row's `Sees` cell; tests realize it.
