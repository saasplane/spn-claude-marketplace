<!-- spn:doc
{
  "id": "cap-spn-core-agents",
  "title": "Agents — spn-core/agents/",
  "lenses": ["LEAD", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "The four agent briefs spn-core ships — one fixed engineering persona, one lens-parameterized reviewer, and the rewrite/review pair this workstream itself convenes."
}
-->

# Agents — spn-core/agents/

`For: Engineering leader · Architect` · `Status: 🔮 PLANNING`

Every file here is a persona a session convenes by name. Three read as themselves on every convening; one, `spn-panel`, is handed a lens name from `refs/lenses/` and reads that file before it says anything about the work in front of it.

| File | Convened for | Authority |
| --- | --- | --- |
| `spn-engineer.md` | design reviews, architecture decisions, build guidance applied with judgment | a fixed persona — the head-of-engineering voice, no lens argument |
| `spn-panel.md` | a gate a skill names — after a plan draft, a contract change, a build | parameterized: reads `refs/lenses/<lens>.md` and blocks only where that lens says so |
| `spn-prose-rewriter.md` | rewriting flagged paragraphs so a reader understands them on first pass | edits — the one agent brief here permitted to write, never a whole file at once |
| `spn-prose-reviewer.md` | judging whether a rewrite kept every claim it was supposed to keep | reports only, on a sample rather than the whole batch |

**Does not do.** No brief here writes code on a change it is reviewing — `spn-panel` and `spn-prose-reviewer` report findings; only `spn-prose-rewriter` edits, and only the paragraphs it was handed.
