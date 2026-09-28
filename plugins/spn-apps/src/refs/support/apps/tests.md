<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/02-support/01-apps/06-tests.md", "seen": "298c01fb" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/06-tests/", "seen": "8c26e972" }
  ]
}
-->

# Proof tiers — what proves a behaviour, at the apps level

Source of truth: the foundation's proof-tiers construct (`docs/02-constructs/02-support/01-apps/06-tests.md`) and its capability chapters (`docs/04-capabilities/02-support/01-apps/06-tests/`).

A behaviour row states what a person or another system can do. Marking it done with nothing exercising it produces a status somebody asserted rather than one anybody verified. Reach for this file when you decide which tier a case belongs on, or how a case you write joins the row it proves.

**Get the join direction right, because this is the mistake the corpus has made before: never make a behaviour row cite a test.** Carry the behaviour id in the test's title instead — that makes the test the citing party and the row derivable from it. Read a row's `Status` cell as a place a scan writes; never write a case's name into it yourself.

## The tier ladder

Five tiers, each buying something the others cannot. When you place a case, pick the tier by what would break: a rule breaks in a unit, a style or a layout breaks in a browser, a scoping guarantee breaks against the real resource, a gate breaks through the contract, a flow breaks for the person walking it.

| Tier | Proves | Cannot prove | Stands on |
| --- | --- | --- | --- |
| `UNIT` | a rule, a transformation, or a rendering decision, in isolation | that any of it is wired to anything | nothing running; doubles at seams the code owns |
| `COMPONENT` | what a rendering harness cannot compute — styles, mode flips, layout at real breakpoints, hover and portals, visual change | that anything is wired to anything | a real browser, real CSS, no application |
| `INTEGRATION` | the code against its real backing resource — scoping, isolation, invalidation, delivery | that a caller can reach it, or may | a freshly migrated resource, provisioned for the run |
| `CONTRACT` | the published surface under a real principal — gates, error shapes, read levels, compatibility | why a person gave up halfway through | a running application reached the way consumers reach it |
| `JOURNEY` | a person completing an outcome through a real entry | which rule failed when it fails | a quiesced running stack |

```text
SPTestTierType  UNIT · INTEGRATION · CONTRACT · COMPONENT · JOURNEY
```

**No tier substitutes for another.** A green unit suite over broken wiring is a passing build of a broken product; a passing journey over untested rules is a change nobody checked where it was decided. **A static gate is not a test at all** — structural validation, type checking and lint prove shape, never behaviour, and a green run at one **MUST NOT** be read as passing another. **A test runner is not the runtime that ships.** It may load source under a different module system than the published artifact meets, so anything reading its own module identity passes under the runner and breaks on the first install. No tier above proves that, because every one of them runs source rather than the published artifact — that claim is proven by running what is published, installed the way a consumer installs it.

## Kind decides the tier

Derive the tier — never debate it. A project's kind fixes its consumer, and the consumer fixes what proof has to mean: prove a package where other code meets it, and prove an application where people meet it. The set of kinds is closed, so read the row for the kind in front of you rather than guessing.

| Kind | Owes | Why |
| --- | --- | --- |
| `SUPPORT_UNIVERSAL` | unit | runtime-free rules, proven under server unit regardless of which runtime later imports them |
| `SUPPORT_SERVER` | unit · integration | integration where it fronts a real resource |
| `SUPPORT_WEB` | unit · component | unit under a rendering harness, component in a real browser |
| `MODULE_SERVER` | unit | ships no shell — its services need an application's configuration, resources and entries, so it cites the composing application's contract tier |
| `MODULE_WEB` | unit | ships no shell on the other face — cites a journey of the composing application |
| `APP_SERVER` | contract · journey | it is the runtime, so it owns the API face of every behaviour it composes |
| `APP_WEB` | journey · component | it is the runtime, so it owns the UI face — actions, states, refusals, whether a screen is offered |
| `APP_UTILITY` | unit · integration | integration is the invoked command, end to end |
| `CLIENT_API` | integration | against a running service — this suite **is** that service's contract tier |

**Read the owed set as a floor, never a ceiling.** A node carrying more than it owes is correct rather than in breach, and the tiers a node can actually run are the tiers it has cases for — if you derive from the ladder alone and delete a working suite that went beyond it, you have deleted proof the project actually had. **A tier declared with no cases behind it is a finding, not a pass.** A target naming a tier the node holds no cases for reports green every run, and every row resting on that tier reads as covered when it is not — either the node owes those cases and nobody wrote them, or the tier was declared by copying a sibling; the first is a gap, the second is a deletion, and neither is served by a green tick.

A repository root declares no kind, so a run asked from there collects only the scenarios that cross two deployables — the workspace's own cases are what no single application can resolve, such as signing in on one application and acting inside another.

## Doubling: where a case may stand in for a seam

Decide where a case belongs with one rule, and read the node's kind to see which side of it you are standing on:

> A node may double a seam it owns, and nothing else.

| Node | Owns | Owes here |
| --- | --- | --- |
| a support package | its own primitives and its own seams | proof of every row it declares, in isolation, doubling those seams freely |
| a module | a capability, no seam of its own | a case that must double the generated client, the design system, or the application shell is proving the composing application's wiring — it belongs to that application |
| an application | the runtime | no doubles at all |

A support package that creates runtimes proves that one can be created with it — the proof is doing it, never unit-testing the parts and inferring the whole.

## Scope: the folder decides what a run collects

| Standing in | Is | The run collects |
| --- | --- | --- |
| a folder declaring a kind | a node | that node's cases, and no other node's |
| a repository root, declaring no kind | a repository | the cross-application scenarios only |
| neither | nothing named | a refusal that says so, never a guess |

Tier follows scope, and the question differs on each side: a node is asked what its kind **owes** — the kind's ladder, plus any tier it carries, a floor never a ceiling; a repository is asked what it **carries** — whatever it holds, since it declares no kind and no ladder owes it one.

**What a case must stand on is decided by its tier**, not by the node:

| Tier | Stands on | Whose setup |
| --- | --- | --- |
| unit | nothing | none |
| component | a real browser, no application | the node's own |
| integration · contract | a real backing resource | the node's own |
| journey | a running stack | shared — one stand-up for the run |

A journey cannot have a per-node setup even in principle: a walk that signs in on one surface and acts on another needs both of them up, so a per-node stack would have to be the whole stack anyway. **A node's own collection stays narrow; the setup a tier stands on is shared where the tier is** — a node asked for one tier **MUST** run that node's cases at that tier, and a run that silently collects its neighbours' cases is reporting about a product nobody asked it about.

## The behaviours join, and which side cites which

A behaviour row and a case are joined by the row's id, and the join is mechanical rather than editorial:

- **The id appears in the case title**, so the trace runs both ways: a row leads to its proof, and a failing case leads to the row it breaks. The title also carries the sentence a person reads — a title that is an identifier alone hands a reader something to look up and nothing to understand.
- **Internals are exempt.** An id binds contract-visible behaviour; a unit test over a private rule names the rule rather than an id.
- **The acceptance line is the assertion.** A case that passes while its row's acceptance line is false is a defect in the case, never a nuance.
- **A cited row is proven by the node that owns it.** A web module citing a domain row does not re-prove it; it proves only what a screen can fail.
- **Two cases may cite one id**, and the row then takes the worse of the two outcomes — a behaviour with one failing proof is not proven.

**A `SUCCESS` row MUST resolve to a case that ran.** A row with no case behind it reads `PLANNED`; a row whose case the last run did not reach reads `PENDING`. Neither is green, and they are different findings that call for different work: *nothing cites this id yet* means a case is owed; *a case exists and the run did not reach it* means the suite is owed a run. Telling a developer to write a case that already exists is the worst thing a check can say, so the two are never collapsed into one.

## Status sync: a title scan, run at prerelease, that goes both ways

**The row's `Status` and `Updated at` are written by a scan of case titles, run at prerelease — never by hand, and never by a case citing a row that then trusts itself forever.** The scan reads every case title reachable in the repository, checks which behaviour ids they carry and whether the case they belong to ran and passed, and writes the finding onto the row it names.

**That sync promotes and it demotes, and both directions matter equally.** A row moves from `PLANNED` to `SUCCESS` the first time a case citing its id runs and passes — that is the promotion everyone expects. It moves the other way just as mechanically: delete the case, or break it, or let the run stop reaching it, and the next scan finds no passing evidence and writes the row back down to `PLANNED` or `PENDING`. **A row is never left reading `SUCCESS` on the strength of a proof that no longer exists.** Treating the sync as promotion-only is how a corpus ends up with green rows behind deleted suites — the scan has no memory of what a row used to say, only of what the last run found.

**A run speaks for the tiers it ran and for nothing else.** A contract run updates the rows declaring the contract tier and leaves every journey row exactly as it found them — without that scoping, a narrow run would reset every row it never covered, and the register would swing on each run rather than hold steady between them. That is also why the tiers a run spoke for are declared in its own artifact rather than inferred from its results: a tier that ran and found no case must still speak, or a whole tier's rows would freeze on the day its last case was deleted, never demoted at all.

**One status value is never written by the sync: `PROMISE`.** That value belongs to the foundation book alone, where a row says what the standards make possible and carries no tier and no status. A row here that read `PROMISE` beside a tier and a status would be two grammars in one line.

**There is no `skipped` status.** A case that could not run says so as its own finding — an admission rather than a silence — and that is a different fact again from *nothing cites this id yet* or *a case exists and the run did not reach it*.

## What a run owes

A suite that passes tells nothing until it says what it proved. A run owes two outputs, read by two different readers, and neither is a fallback for the other:

| Output | Written for | What its absence costs |
| --- | --- | --- |
| the run artifact — the ids and outcome of each case, the tiers run, the environment, the instant | the agent, writing `Status` and `Updated at` from it | the run said nothing, and a claim with no evidence behind it is a finding |
| the framework's own readable page, at a named place | a person, and the pipeline that uploads it — what gets read in a pipeline, where no agent runs | the run still proved what it proved; only the reading of it is poorer |

**A pipeline produces evidence and never writes a document.** Nothing in a pipeline judges what a result means, and a pipeline committing into the repository it built from commits into its own trigger — the artifact is published, a row keeps whatever the last scan wrote, and the release gate still fails the build on a claim with no evidence behind it.

## Case titles carry the id and the sentence

```text
IAM.LOGIN.01 a person signs in with a password
└── id ──┘  └──────── the sentence a person reads ────────┘
```

A title of the id alone hands a reader in a pipeline an identifier and no way to know what broke. **Write a case title that carries both, at every tier that binds an id** — the id for the scan to join against, the sentence for the person reading the framework's own page.

## Managing the case set

- **A case belongs to the node whose claim it proves, and travels with it.** Delete a capability and delete its cases in the same change; a case outliving its subject fails for reasons nobody owns.
- **Add cases in the change that adds the claim, not after it.** A capability merged with its proof deferred has no status anyone can read.
- **Grouping follows the consumer.** Where the consumer is people, suites group by persona, so one suite shares one authentication setup and one fixture set. Where the consumer is a system, suites group by capability.
- **Name a case for the claim, not the code path.** Write the title as what is true when it passes.

## Coverage: what a release-gating sweep must reach

A percentage is not the answer — it moves when a case is added and says nothing about which case. **What a route owes is read from the behaviour rows that claim it.** An action is an interaction whichever way it is reached: a person reaches it through a browser, another system reaches it through the published client, so the published surface *is* the behaviour surface and a row is what both answer to.

| Surface | Driven by | Proven at |
| --- | --- | --- |
| view components in a browser | a person | journey |
| the published methods | another system, through the generated client | contract |

**A row owes proof on each surface that exposes it.** A row proven on one surface alone says which, never that it is fully proven. **An absent action is a designed fact and owes its own row that reads *cannot*, in the same grammar as one that reads *can*** — without it, nothing distinguishes *this cannot be created by design* from *nobody has built create yet*. A refusal is a behaviour too, and it owes proof on both surfaces exactly as a permission does. **A row is proven once per app-site type — MUST**, on the tenant's own surface where one exists, since that resolves an organization and exercises more of the path than the platform-owned surface does.

**A release gate is a named subset of the rows — MUST.** Absent that name, every case blocks a release in principle, which in practice means a red is waved through on judgement and the gate means nothing. Two exclusions, each excluded for a stated reason: anything requiring a real vendor round trip, because a vendor's outage is not a regression in the code; and what only a person can complete, such as a proof-of-person challenge, kept as a short list that is never claimed empty. A skipped case still leaves its row `PENDING` — a run reports the rows it did not reach as well as the ones it did.

**The join is checked in both directions.** A cited id **MUST** exist — a case title naming a row no document declares resolves to nothing. A `SUCCESS` row **MUST** resolve to a case — review alone never enforces that. The pattern a scan reads ids with **MUST** match every id shape the registers actually use, a digit in a middle segment included, or the scan silently indexes part of the register and reports green over the rest.

**A second number answers a different question: how much of the code does any suite execute at all.** Every project carries a code-coverage floor, measured rather than chosen, that the runner reads on every run and that rises and never falls (`RD.APPS.133`). It never decides a release on its own. Code no automatic case can reach is named, with its reason, in the exemptions file.

## Isolation, and reading a result honestly

- **Seed or derive — never inherit.** A test depending on state another test left is not a test; suites **MUST** pass alone, in any order, and concurrently.
- **A baseline is not a fixture.** What a freshly migrated system starts with is shared and pre-existing; what a case needs, the case creates.
- **Integration and contract tiers start from a known state**, and a warm resource proves nothing about a fresh one — baseline and template changes are proven only on a clean re-migrate.
- **Journeys run against a quiesced stack.** Building or provisioning alongside one produces timeouts that read as failures and are not.
- **A shared stack is shared.** A destructive reset **MUST** run on an explicit instruction against a named target, never as a suite's own setup.
- **A case that destroys a session runs where nothing else depends on that session**, and declares that it does — worker isolation cannot help, because the damage happens on the server.

**Report the count, never the colour.** A suite that silently stopped collecting cases still shows green, and a tier nobody invoked proves nothing however green the command that skipped it prints. **A cached result is a claim about inputs, never a run** — a cached task replays its output verbatim, so verify the artifact it produced (a moved timestamp, a changed hash, bytes actually served) whenever a run must prove a change just made. **Prove a gate against input it must refuse before you trust its green as evidence** — feed it a deliberate fault, watch it refuse, then restore what you fed it, and hash the restore so a fault left behind cannot make a later red lie.

## What this file leaves out

Which command runs a tier, and what a run mode wakes, belongs to the application's own lifecycle — ask for `app.md` in this plugin. The row grammar itself — the cells a behaviour row carries, who writes each of them, and how a foundation promise differs from a proven row — is the documentation standard's own subject and is not restated here.
