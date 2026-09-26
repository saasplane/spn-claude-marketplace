<!-- spn:doc
{
  "id": "behaviors-stack-checks",
  "variant": "behaviors",
  "title": "Behaviors — Scripts",
  "lenses": ["SERVER_DEV", "QA"],
  "status": "PLANNING",
  "summary": "What this plugin's own code promises: a refusal about the edit rather than about the file, a repository left alone where no provider exists, a register found wherever it sits, a run that writes only the cells it owns, and coverage measured against actions rather than routes.",
  "keywords": ["gate", "subject", "register", "tier", "action", "rows"]
}
-->

# Behaviors — Scripts

`For: Backend developer · Quality engineer` · `Status: 🔮 PLANNING`

The table below lists the promises [Scripts](../../02-constructs/02-apps/04-scripts.md) makes. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.SCRIPTS.21 | Architect | add a stack to this domain without editing a gate | The gate composes the provider path from the declaration, so a new stack is a new folder | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.22 | Backend developer | work in a repository this plugin ships no provider for and not be refused | A declaration that resolves to no provider resolves to no subject, silently | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.23 | Backend developer | have a contract file read once for a write rather than once per rule | The subject builds the resulting text once, and every rule reads what it produced | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.24 | Backend developer | see one refusal for one edit rather than several | The first refusal is the answer; notes are collected only when nothing refused | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.25 | Backend developer | keep the rest of the chain when one rule throws | A rule that throws is skipped, and the subject still answers | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.26 | Backend developer | hold this plugin without the core plugin beside it on disk | The payload, the timing record and the stamp are this plugin's own copies, never imports across plugins | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.27 | Editor | trust a drift run that reads files stamped by either plugin | Both copies of the hash agree byte for byte, and a case in the suite fails if they stop agreeing | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.28 | Quality engineer | move a documents tree and have every tool still find the registers | A register is recognised by its own headings, wherever in the repository it sits | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.29 | Quality engineer | keep the cells a person decided after a run writes | Only the status and the moment it was found are written; every other cell is copied through | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.30 | Quality engineer | run one rung and leave the rows of the others as they were | A run updates only the rows declaring a tier it covered | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.31 | Quality engineer | keep a hand-checked row through every run | A row marked as checked by a person is never written over | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.32 | Quality engineer | tell a case that was skipped from a case that passed | The status comes from the runner's own results file rather than from a specification | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.33 | Backend developer | find a published action no behaviour row claims | The declared actions and the register's rows are read and compared | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.34 | Backend developer | have an action found even in a module an application owns | An action is found by its declaration rather than by a folder shape | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.35 | Partner / integrator | read which published packages a node may depend on without a checkout | A command writes the table, under a citation naming the command that produced it | POSITIVE | UNIT | PLANNED | — |

## Retired ids

An id is identity and is never reused, so the chapter that took over these promises re-issues them under its own name rather than carrying the old ones.

| Retired | Re-issued under |
| --- | --- |
| ~~MKT.TSCHECK.01~~ … ~~MKT.TSCHECK.02~~ | `MKT.SCRIPTS.*` above, and `MKT.PROVIDERS.*` for the promises a rule makes |
| ~~MKT.TSTOOL.01~~ … ~~MKT.TSTOOL.02~~ | `MKT.SCRIPTS.*` above |
