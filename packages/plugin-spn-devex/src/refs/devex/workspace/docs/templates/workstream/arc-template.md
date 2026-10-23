<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The arc · § A step row says where, at what altitude, and how · § An arc's status says which of eight states it is in · § An arc carries its specification, or names the note that holds it · § The workstream is kept as data, and every file has one owner · § The folder · § The formats · § The commands · § The life of an arc, and every file it touches · § The approach page keeps up with its arcs
     and docs/04-capabilities/02-support/02-apps/06-tests/README.md § When a whole tier runs
     This file carries rules it does not own. The chapters above are the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- AN ARC IS KEPT AS DATA, IN TWO FOLDERS NAMED BY ONE NUMBER. `arcs/N<nnn>/` holds what the commands write:
     `state.json`, `log.jsonl`, `facts.jsonl` and `<subject>.md`, the arc's name file. Nobody types in it, and the
     PreToolUse hook refuses an edit there. The arc's address is its row on the approach page, `approach.html#N<nnn>`,
     and every link to the arc points there, never at `state.json`.
     `notes/N<nnn>/` holds what the agent writes: `preview.html`, `samples/`, `plan.md`, `orders/` and `scripts/`.
     This file is not copied into a workstream. It shows the commands that write the arc's data and what each field
     holds, then the agent's own files, so an arc is opened and run the same way every time. No card lives in an arc:
     a question is a record in `questions.jsonl`, raised with `workstream question raise`. -->
# N{{nnn}} — the arc, as data and as the agent's files

## Open it — the commands write `arcs/N{{nnn}}/`

```sh
# open the arc as PROPOSED: its title names the cycle it pays, its subject is one to three words of at most 24
# characters, and its goal is the outcome once it is done, in a sentence or two
spn-devex workstream row write N{{nnn}} --title "{{the cycle it pays, named: R: the support release that carries X}}" --subject {{short-name}} --goal "{{what is true once the arc is done}}"

# its header: what it decides, the repositories in chain order, the cycle, what it follows, the coordinator's model
spn-devex workstream row write N{{nnn}} --decides "{{what this arc decides, in one phrase}}" --repos {{repo}},{{repo}} --cycle "{{a book change · a support release · a plugin release and reinstall · a renumbering · a corpus pass · a symbols regeneration · a full verification}}" --follows "{{N<m> — why it lands first, or nothing}}" --model "{{Opus 5.5}}"

# each fact read while ideating, the source's commit pinned
spn-devex workstream fact write N{{nnn}} --source {{repository/path:line}} --fact "{{what the source says, in one line}}" --used-by {{q<n> or row}}

# a row, once the plan is written: its kind, where, at what altitude, how, and its acceptance
spn-devex workstream row write N{{nnn}} {{row}} --title "{{the step's What: the files, or plan § k}}" --kind {{fix · change · question}} --repo {{repo or —}} --altitude {{DOCS · CODE · GENERATED · RELEASE · PROOF}} --mechanism "{{by hand · script · command · agents}}" --acceptance "{{`command` → before → after}}" --model {{the row's model}} --blocked-by {{row or q<n>, or none}} --touches {{repository:place}} --decisions {{q<n>}} --facts {{f<n>}}

# the go, the one write that moves the arc out of PROPOSED, with your words beside it; every row not yet landed turns from design to change
spn-devex workstream row write N{{nnn}} --status DECIDED --note "<the developer's words>"

# the status after the go, at your word: RUNNING, HELD, PART-LANDED, LANDED, CARRIED or DROPPED, with a reason for the last three and HELD
spn-devex workstream row write N{{nnn}} --status {{STATUS}} --reason "{{the card it waits on · where it went · why}}"

# a line on the log, which has no other writer: a decision, a correction, your words
spn-devex workstream row write N{{nnn}} --note "{{what was decided or corrected, by whom, and why; the notes it changed}}"

# once the approach page's part for this arc is current with its rows
spn-devex workstream arc stamp write N{{nnn}}
```

## What the commands keep — `arcs/N{{nnn}}/state.json`

```json
{ "schemaVersion": 1,
  "arc": "N{{nnn}}", "subject": "{{short-name}}", "title": "{{the cycle it pays, named}}",
  "goal": "{{what is true once the arc is done, in a reader's words}}",
  "status": "PROPOSED", "reason": null,
  "decides": "{{what this arc decides}}", "repos": ["{{repo}}", "{{repo}}"],
  "cycle": "{{the cycle it pays}}", "follows": "{{N<m>, or nothing}}", "model": "{{Opus 5.5}}",
  "preview": "preview.html",
  "rows": [
    { "id": "0", "parent": "N{{nnn}}", "title": "write notes/N{{nnn}}/plan.md: pins, what exists today, commands with their before, rows, orders",
      "kind": "change", "repo": "—", "altitude": "DOCS", "mechanism": "by hand",
      "acceptance": "every plan row has Files, Fails before and Proof", "state": "waiting" },
    { "id": "{{1}}", "parent": "N{{nnn}}", "title": "{{plan § 1}}",
      "kind": "{{change}}", "repo": "{{repo}}", "altitude": "{{DOCS}}", "mechanism": "{{agents}}",
      "acceptance": "{{`command` → before → after}}", "model": "{{sonnet}}",
      "blockedBy": ["0"], "touches": ["{{repository:place}}"], "decisions": ["{{q<n>}}"], "facts": ["{{f<n>}}"],
      "state": "waiting", "order": "orders/{{1}}.md" },
    { "id": "{{n}}", "parent": "N{{nnn}}", "title": "on clean trees, after the last write, cache off: run again what the rows above touched, each gate once and the touched cases under one fresh run name; no whole tier unless one of the five cases holds; and the consumer install",
      "kind": "change", "repo": "—", "altitude": "PROOF", "mechanism": "command",
      "acceptance": "each Commands row → its after, and each named id → SUCCESS in that run's file", "state": "waiting" } ] }
```

<!-- A row's state is waiting · ready · running · stopped · landed · carried · deferred, and `report write` folds a
     child's hand-back into it: the outcome, the proof, the commits, the cost and the follow-ups. A row with rows under it
     takes its state from them. Row 0 is a precondition of RUNNING, and the PROOF row is never deleted. -->

```text
log.jsonl     {"at":"{{YYYY-MM-DDTHH:MM}}","kind":"{{what happened: opened · header · status · added · a row's new state · landed · stopped · needs-you · stamped · note}}","row":"{{row or null}}","note":"{{one line}}"}
facts.jsonl   {"id":"f{{n}}","fact":"{{one line}}","source":"{{repo/path:line}}","commit":"{{sha}}","readAt":"{{YYYY-MM-DDTHH:MM}}","usedBy":["{{q<n> or row}}"]}
```

```text
arcs/N{{nnn}}/{{short-name}}.md   the arc's name, written with its data: the title · the goal · the status and its reason ·
                                  what it decides · its repositories · links to ../../approach.html#N{{nnn}}, the preview,
                                  the plan and the samples. No rows and no log
```

## What the agent writes — `notes/N{{nnn}}/`

```text
notes/N{{nnn}}/
  preview.html      the arc's one preview, from PROPOSED: each proposal a section, its status in the masthead
  samples/          real files of the kind the work produces, each in its own format, as many as the work needs
  plan.md           how the arc will be done, from DECIDED: pins, what exists today, the commands and their before, the traps
  orders/
    {{row}}.md          one brief per delegated row, named by the row, its front matter first (order-template.md)
    {{row}}.report.md   the child's hand-back, its front matter first, which `report write` folds into the row
  scripts/          what a script row runs
```

## Before the status reads LANDED

Every row is landed, carried or deferred, and none is stopped or waits on a card. The PROOF row's output is in its
`proof`, run with the cache off. Every card this arc answered has left `Open`, and the page's `What` states its
result. The approach page's part for the arc is current, its stamp written, and its Cycles row reads LANDED. The
landing is committed.
