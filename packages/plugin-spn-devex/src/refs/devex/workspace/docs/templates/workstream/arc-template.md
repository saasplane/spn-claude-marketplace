<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The arc · § A step row says where, what work, and how · § An arc's status is one of six, stored or worked out · § An arc carries its specification, or names the note that holds it · § The workstream is kept as data, and every file has one owner · § The folder · § The formats · § The commands · § The life of an arc, and every file it touches · § The approach page keeps up with its arcs
     and docs/04-capabilities/02-support/02-apps/06-tests/README.md § When a whole tier runs
     This file carries rules it does not own. The chapters above are the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- AN ARC IS KEPT AS DATA, IN TWO FOLDERS NAMED BY ONE ADDRESS. A numbered build arc is `N<nnn>`; the other two arcs, `ideate` and `follow-ups`, are named by their role and written by `workstream open`. `{{arc}}` stands for the arc's address, `N<nnn>`, `ideate` or `follow-ups`, and takes the place of `N{{nnn}}`; the state.json sample keeps `N{{nnn}}` as a build arc's id. `arcs/<arc>/` holds what the commands write:
     `state.json`, `log.jsonl`, `facts.jsonl` and `<subject>.md`, the arc's name file. Nobody types in it, and the
     PreToolUse hook refuses an edit there. The arc's address is its row on the approach page, `approach.html#<arc>`,
     and every link to the arc points there, never at `state.json`.
     `notes/<arc>/` holds what the agent writes: `preview.html`, `samples/`, `plan.md`, `orders/`, `scripts/` and `work/`.
     This file is not copied into a workstream. It shows the commands that write the arc's data and what each field
     holds, then the agent's own files, so an arc is opened and run the same way every time. No card lives in an arc:
     a question is a record in `questions.jsonl`, raised with `workstream question raise`. -->
# {{arc}} — the arc, as data and as the agent's files

## Open it — the commands write `arcs/{{arc}}/`

```sh
# open the arc as PROPOSED, as many as the plan needs: its title says what it delivers in its domain, its subject is
# one to three words of at most 24 characters, and its goal is the outcome once it is done, in a sentence or two
spn-devex workstream arc edit {{arc}} --title "{{the domain and what lands there: Surface: the patterns standard and the design system}}" --subject {{short-name}} --goal "{{what is true once the arc is done}}"

# its header: what it decides, the repositories in chain order, the package it releases, what it follows, the coordinator's model
spn-devex workstream arc edit {{arc}} --decides "{{what this arc decides, in one phrase}}" --repos {{repo}},{{repo}} --cycle "{{the package it releases, after the last step that changes it, or none}}" --follows "{{N<m> — why it lands first, or nothing}}" --model "{{Opus 5.5}}"

# each fact read while ideating, the source's commit pinned
spn-devex workstream fact write {{arc}} --source {{repository/path:line}} --fact "{{what the source says, in one line}}" --used-by {{q<n> or row}}

# a row: its kind, where, what work, how, and its acceptance; the rows are the steps, so none writes a plan
spn-devex workstream row add {{arc}} "{{the step's What: the files, or plan § k}}" --kind {{fix · change · question}} --repo {{repo or —}} --work {{DOCS · CODE · GENERATED · RELEASE · PROOF}} --mechanism "{{by hand · script · command · agents}}" --acceptance "{{`command` → before → after}}" --model {{the row's model}} --blocked-by {{row or q<n>, or none}} --touches {{repository:place}} --decisions {{q<n>}} --facts {{f<n>}}

# a row's state, its note, and its fields: one command each, the row after the arc
spn-devex workstream row state {{arc}} {{row}} {{ready · running · landed · stopped · deferred}} --note "{{what landed, or why it stopped}}"
spn-devex workstream row note {{arc}} {{row}} "{{a line on the row's log}}"
spn-devex workstream row edit {{arc}} {{row}} --title "{{the step's What}}" --blocked-by {{row or q<n>, or none}}

# the go, the one write that stores DECIDED, with your words beside it; no step starts before it
spn-devex workstream arc edit {{arc}} --status DECIDED --note "<the developer's words>"

# a wait, then a start, each in your words; nothing starts while the wait holds
spn-devex workstream arc edit {{arc}} --wait "<the developer's words>"
spn-devex workstream arc edit {{arc}} --start --note "<the developer's words>"

# your other words: CARRIED or DROPPED, with where it went or why; RUNNING and LANDED are worked out from the steps
spn-devex workstream arc edit {{arc}} --status {{CARRIED · DROPPED}} --reason "{{where it went · why}}" --note "<the developer's words>"

# an arc never decided is deleted, never dropped
spn-devex workstream arc delete {{arc}} --note "<the developer's words>"

# a line on the log, which has no other writer: a decision, a correction, your words
spn-devex workstream arc edit {{arc}} --note "{{what was decided or corrected, by whom, and why; the notes it changed}}"

# once the approach page's part for this arc is current with its goal, its title and its repositories; adding a row never needs it
spn-devex workstream arc stamp write {{arc}}
```

## What the commands keep — `arcs/{{arc}}/state.json`

```json
{ "schemaVersion": 2,
  "arc": "N{{nnn}}", "subject": "{{short-name}}", "title": "{{the domain and what lands there}}",
  "goal": "{{what is true once the arc is done, in a reader's words}}",
  "status": "PROPOSED", "reason": null, "wait": null,
  "decides": "{{what this arc decides}}", "repos": ["{{repo}}", "{{repo}}"],
  "cycle": "{{the package it releases, or none}}", "follows": "{{N<m>, or nothing}}", "model": "{{Opus 5.5}}",
  "preview": "preview.html",
  "rows": [
    { "id": "{{1}}", "parent": "N{{nnn}}", "title": "{{the step's What: the files, or plan § k}}",
      "kind": "{{change}}", "repo": "{{repo}}", "work": "{{DOCS}}", "mechanism": "{{agents}}",
      "acceptance": "{{`command` → before → after}}", "model": "{{sonnet}}",
      "blockedBy": [], "touches": ["{{repository:place}}"], "decisions": ["{{q<n>}}"], "facts": ["{{f<n>}}"],
      "state": "waiting", "order": "orders/{{1}}.md" },
    { "id": "{{n}}", "parent": "N{{nnn}}", "title": "the final re-check, on clean trees, after the last write, with the runner's reuse: run again what the rows above touched; the whole tiers of each touched node, the browser walks and the look, once for the arc; and the consumer install",
      "kind": "change", "repo": "—", "work": "PROOF", "mechanism": "command",
      "acceptance": "each gate → exit 0, and each named id → SUCCESS in that run's file", "state": "waiting" } ] }
```

<!-- A row's state is waiting · ready · running · stopped · landed · carried · deferred, and `report write` folds a
     child's hand-back into it: the outcome, the proof, the commits and the follow-ups. A row with rows under it
     takes its state from them. The PROOF row is the arc's one final re-check, and it is never deleted. A row added asks
     for no page edit and no new stamp. -->

```text
log.jsonl     {"at":"{{YYYY-MM-DDTHH:MM}}","kind":"{{what happened: opened · header · status · added · a row's new state · landed · stopped · needs-you · stamped · note}}","row":"{{row or null}}","note":"{{one line}}"}
facts.jsonl   {"id":"f{{n}}","fact":"{{one line}}","source":"{{repo/path:line}}","commit":"{{sha}}","readAt":"{{YYYY-MM-DDTHH:MM}}","usedBy":["{{q<n> or row}}"]}
```

```text
arcs/{{arc}}/{{short-name}}.md   the arc's name, written with its data: the title · the goal · the status and its reason ·
                                  what it decides · its repositories · links to ../../approach.html#{{arc}}, the preview,
                                  the plan and the samples. No rows and no log
```

## What the agent writes — `notes/{{arc}}/`

```text
notes/{{arc}}/
  preview.html      every arc's one preview, written when the arc opens: each proposal a
                    section, its status in the masthead, frozen at the go
  samples/          real files of the kind the work produces, each in its own format, as many as the work needs
  plan.md           optional, written at the go only where the arc has traps, a set or a move table; never while PROPOSED
  orders/
    {{row}}.md          one brief per delegated row, named by the row, its front matter first (order-template.md)
    {{row}}.report.md   the child's hand-back, its front matter first, which `report write` folds into the row
  scripts/          what a script row runs
```

## Before the steps work out LANDED

Every row is landed, replaced, carried or deferred, and none is stopped or waits on a card. The PROOF row's output is in its
`proof`, run with the runner's reuse. Every card this arc answered has left `Open`, and the page's `What` states its
result. The approach page's part for the arc is current, its stamp written, and its Plan row reads LANDED. The
landing is committed.
