<!-- spn:doc
{
  "id": "cap-spn-apps-ts-hooks-checks",
  "title": "Checks — spn-apps-ts/hooks/checks/",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "The TS-stack write-time checks: enablement grammar, an unanchored host assertion, three coverage warnings, a read-verb naming rule, an await-vs-.then() rule, and a journey assertion missing its why — composed by one dispatcher, pretooluse.ts."
}
-->

# Checks — spn-apps-ts/hooks/checks/

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

Every file here catches one TS-stack-specific pattern at the moment a `Write` or `Edit` would introduce it. `pretooluse.ts` composes them into one process, the same shape `spn-core`'s own dispatcher uses, so an ordinary edit still pays one process rather than seven.

| File | Refuses or reports | Proven by |
| --- | --- | --- |
| `enablement-grammar.ts` | a code not prefixed by its own module, a second segment that is not `MANAGE`, a multi-value definition named after its area, or a hardcoded set of organization types in a service | `hooks/tests/t-enablement-grammar.mjs` |
| `host-assertion.ts` | an unanchored host pattern in a navigation assertion — the shape that matched inside a provider's own `redirect_uri` and passed while the browser sat on the vendor's page | `hooks/tests/t-host-assertion.mjs` |
| `coverage.ts` | three write-time warnings: a route nothing exercises, a mutation nothing undoes, a module test doubling a seam it does not own | `hooks/tests/t-coverage.mjs` |
| `read-verb-naming.ts` | a `get…` method returning an `XList` under a name that does not say so | `hooks/tests/t-read-verb.mjs` |
| `await-sequencing.ts` | a `.then()` chain in a server node's source, where every other function in the file awaits | `hooks/tests/t-await-sequencing.mjs` |
| `assertion-message.ts` | a journey assertion naming what it expected with nothing explaining what an absence would mean | `hooks/tests/t-assertion-message.mjs` |
| `pretooluse.ts` | the dispatcher — composes the six above into one process | `hooks/tests/t-dispatch.mjs` |

**Does not do.** None of these enforces a rule stack-agnostic enough for `spn-core` to carry — each restates a pattern specific to how this stack's own contract, service and journey layers are written, cited in `providers/apps/ts/` by name.
