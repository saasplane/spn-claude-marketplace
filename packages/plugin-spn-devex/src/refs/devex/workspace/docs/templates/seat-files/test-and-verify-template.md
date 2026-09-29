<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md § How — guides: steps, and nothing proven
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- The one guide every repository that can run owes
     (decision RD.DEVEX.WORKSPACE.181), at 05-guides/<NN>-test-and-verify.md.
     Write it for a person at a terminal. Every step is the same three things: a sentence or two
     saying what the step does and why, the commands in a block they can copy and run exactly as
     written, and what they should see when it worked. Name the folder to run from when it is not
     this repository. A placeholder stands only for a value the reader chooses, never for a secret.
     Write only commands you have run, and put each server's flags in the command that starts it.
     Keep the four headings that are not steps: Before you start, the steps, Clean reset and
     verify, and If something fails. A link never leaves the repository, so the guide cites no
     other repository's guide: an apps repository runs its own reset from its own pin. -->
<!-- spn:doc
{"id": "<repo>-test-and-verify", "title": "Test and Verify", "lenses": ["SERVER_DEV", "WEB_DEV", "QA"], "status": "DONE", "summary": "<One sentence: what a full run of this repository covers, and what it needs running first.>", "keywords": ["test", "verify", "clean reset", "migrations", "servers", "spnenv"], "stages": ["TEST"]}
-->

# Test and Verify

`For: <Backend developer · Web developer · Quality engineer>` · `Status: ✅ DONE`

<Two or three sentences. What this guide runs, roughly how long it takes once the stack is up, and which part deletes anything. A reader who stops here knows whether they can start now.>

## Before you start

Every password and setting these tests use lives in one file on your machine, `~/.spnenv`. Values are grouped by platform code, so this repository's start with `<CODE>_`. You type your own values in the file's `spnutils:dev` section. `spnutils` reads the file itself, so any command that starts with `spnutils` needs nothing more.

<Name the steps below that run a tool directly — npx, tsx, playwright — and so need the values in the shell. If there are none, say so and stop here.>

Those steps need the values in your shell. Add this line to `~/.zshenv` once, then open a new terminal. It shares every value with every program you start, so add it only if you run those steps:

```bash
[ -f ~/.spnenv ] && set -a && . ~/.spnenv && set +a
```

Then check the keys this guide uses. This prints each name with `set` or `MISSING`, never a value:

```bash
for k in <KEY_ONE> <KEY_TWO>; do [[ -n ${(P)k} ]] && echo "$k set" || echo "$k MISSING"; done
```

<Say what to do for a MISSING key: which section of ~/.spnenv it belongs in, and who has the value.>

## Step 1 — <What the reader does, as a task>

<One or two sentences: what this step does, and why it comes here — usually because a later step needs what it leaves behind.>

```bash
<commands, exactly as you ran them>
```

<What they should see: the line, the count, or the page that proves it worked. Add how long it takes when it is more than a minute.>

## Step 2 — <…>

<Continue until the whole repository has run. When a step writes something a later step reads, say so in both steps. When the run needs a server stopped or restarted in another mode, make that its own step.>

<One command per line, never a loop. Say which lines are independent — the reader may run them in separate terminals at once — and which must run in order, and why: they share a database, or one uses what another made.>

<A server gets a block of its own, because it takes a terminal of its own. Say which port it holds, and give the check that shows it is ready as its own block.>

## Step N — Stop the servers and record what the run proved

<The last step. What to stop, and how. Then say that each run left a result file in its project's tests/.output/ folder, and that the agent stamps the behaviour rows and replaces the tests report from those files when you ask it to.>

## Clean reset and verify

<Use only when somebody asks for a clean reset, and say what it deletes — including what other repositories on the same platform lose. Numbered steps, each command on its own line with its platform code: take the platform down with --clean, then the organization; bring the organization up, then the platform; rebuild the certificate bundle the terminal uses. Then what this repository must redo — registering its apps, migrating the empty database, anything a teardown left out of date — and end with "start again from Step 1". In the estate repository this section resets every platform it declares, and ends by telling the reader that each apps repository needs its own Step 1 again.>

## If something fails

<One short paragraph per known problem. Open with the symptom in bold, exactly as the reader sees it, then say what it means and what to run. Include the problems a reset leaves behind — a missing route, an empty database, a missing certificate bundle — because a reader meets those first.>

**<symptom>** <What it means.> <What to run, or which step to repeat.>
