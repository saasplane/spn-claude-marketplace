<!-- spn:doc
{
  "id": "spn-claude-marketplace-run-the-hooks-tests",
  "title": "Run the Suites — And Read What They Wrote Down",
  "lenses": ["QA", "SERVER_DEV", "ARCHITECT"],
  "status": "DONE",
  "summary": "Running the plugins' own suites over the source, reading a result honestly rather than by its exit code, and the behaviour cells a run is allowed to write.",
  "keywords": ["tests", "suites", "runner", "behaviour rows", "register", "tier", "status", "hooks"]
}
-->

# Run the Suites — And Read What They Wrote Down

`For: Quality engineer · Backend developer · Architect` · `Status: ✅ DONE`

Run these after any change to a hook, a check or a tool here. They exercise the source in your working tree rather than the installed copy, so you get an answer before you install anything.

They also do a second job that no other repository's suites do. **This repository declares `GENERAL`, so `spnutils` serves it with its document commands alone and has no test runner for it.** There is no other program that could write this repository's behaviour rows, so these suites are that program too.

## Run the whole set

```bash
cd /opt/work/saasplane/code/spn-claude-marketplace
node plugins/spn-devex/tests/run.mjs
```

Every file named `t-*.mjs` beside the runner is a suite, and they run in name order. The output is one line per suite and a tally:

```
  ok    t-doc-check.mjs          all 18 passed
  ok    t-docs.mjs               all 84 passed
  ok    t-seats.mjs              all 86 passed

  13 suite(s) · 459 case(s) · all passing
  0 case(s) carry a behaviour id -> docs/artifacts/reports/spn-tests.json
```

A suite whose last line is not `all N passed` is printed as `FAIL`, with its own last line beside it. The tally then names how many suites are failing rather than how many cases passed.

## Run one suite

A suite is an ordinary program, so you run it directly while you iterate on the check it covers:

```bash
node plugins/spn-devex/tests/t-doc-check.mjs
```

On its own it prints every case — `PASS` or `FAIL`, then the title — under the heading of the behaviour being exercised. That is the level to work at while a check is moving, because the aggregate view drops everything but the last line.

## Read the result honestly

**Read what a run says rather than its exit code.** The exit code is one bit, and these suites are built to tell you more than one bit.

| What you see | What it actually means |
| --- | --- |
| `all passing` in the tally | every suite's own last line reported a clean pass |
| a `FAIL` line | that suite's last line was something else — including a crash, which reports as `CRASHED` |
| `N case(s) carry a behaviour id` | how many assertions spoke for a register row; the rest spoke only for themselves |
| `py [not installed]` inside a case | the Python arm is gone, so only the TypeScript check ran |

**The runner discards each suite's error stream on purpose.** Some suites exercise the hook that writes warnings there, and inheriting that stream would print a fixture's findings into the summary as though they were this run's. Where you want a suite's error output, run that suite on its own.

**These suites are a builder's gate.** Several cases name real files in the surrounding workspace, because what they prove is that a check agrees with the corpus, and a corpus cannot be invented. Somebody holding the plugin without the workspace runs `partner-shape.ts` instead, which needs nothing but the plugin itself.

## What a run writes down

Every run writes `docs/artifacts/reports/spn-tests.json`, whether or not anything carried an id. An empty result set is itself a fact about the run, and an absent file would read as a run that never happened.

A case speaks for a behaviour row when its **title carries the row's id in brackets** — `[MKT.DOCS.01]`, for instance. The runner reads the id out of the title, and the case becomes a result under that id. A title with no id proves nothing to the register and is counted only in the tally, which is correct: a register row is a promise somebody made, not every assertion anybody wrote.

### Writing the rows

Add the flag and the run also writes what it found into the behaviour rows:

```bash
node plugins/spn-devex/tests/run.mjs --write-status
```

**It writes the `Status` cell and the `Updated at` cell, and nothing else.** Every other cell in a row — who the actor is, what they do, what they see, the type, the tier — is a decision a person made, and a run has no opinion about any of it.

The limits below keep that writer honest, and each one exists to stop a run saying more than it knows:

- **A run speaks only for the tiers it ran.** These suites exercise one unit against a fixture, with no service and no browser, so they declare `UNIT` and leave every row of another tier exactly as it was. A partial run that reset the register would make the status swing on each run.
- **A row is green only when every case carrying its id is green.** One red among several is a red row.
- **A row whose tier the run covered, and whose case the run never reached, becomes `PENDING`.** That is the honest answer and the one a reader needs — a row that used to pass and is no longer proven says so.
- **`MANUAL` is never written over.** A behaviour a person checks by hand has no case and no run.

A row still reading `PLANNED` is left alone. It has never been proven, so a run that did not reach it changes nothing.

### Where the rows stand today

The suites pass in full and **no case carries a behaviour id yet**, so `--write-status` reports that every row already says what the run found. The rows in [`03-behaviors/`](../03-behaviors/README.md) all read `PLANNED`, which is true: they are declared rather than proven. They start moving the day a case title carries the id of the row it proves.

You can ask the writer what it would do without letting it write, by running it against the artifact directly:

```bash
node plugins/spn-devex/src/scripts/tools/behaviour-status.mjs \
  --results docs/artifacts/reports/spn-tests.json .
```

It prints one line per row it would change, then a tally. With no `--write` it changes nothing.

---

<!-- book-nav -->
📖 ← [install the plugins](01-install-the-plugins.md) · ↑ [guides](README.md) · [purpose](../01-purpose/README.md) →
