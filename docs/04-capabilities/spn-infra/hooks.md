<!-- spn:doc
{
  "id": "cap-spn-infra-hooks",
  "title": "Hooks — spn-infra/hooks/",
  "lenses": ["INFRA", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "One shell script, wired to every Write and Edit, denying the five ways an estate write can leak a secret or a discovered identifier — conservative by design: unsure means allow."
}
-->

# Hooks — spn-infra/hooks/

`For: DevOps / SRE · Architect` · `Status: 🔮 PLANNING`

Unlike `spn-core` and `spn-apps-ts`, this plugin's whole `hooks/` folder is one script rather than a divided tree of events, checks, tools and lib — the estate guard is one rule with five clauses, and nothing here earns a second file yet.

| File | Fires on | Denies | Proven by |
| --- | --- | --- | --- |
| `scripts/deny-estate-violations.sh` | `PreToolUse` (`Write\|Edit`) | an edit under `*/dist/*`; content carrying an ARN; content carrying a secret shape (access keys, private-key blocks, quoted credential literals); content pinning a twelve-digit account id; a provider string outside a cloud entry in `spestate.json` | none dedicated yet — read by inspection |

**Does not do.** On anything unexpected — no `jq`, unparsable input, no file path — the script exits allowing the call rather than denying it. A hook that fails closed on a shape it does not understand would deny far more than the five things it actually knows to check for.
