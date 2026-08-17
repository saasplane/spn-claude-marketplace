---
name: review
description: Review SaaS Plane TS changes against the standards. Use when the user asks for a code review, a PR review, or when the `implement` skill closes with a contract change. Modes by argument - code (the TS standards digest across naming, structure, patterns, service, database, codegen) and contract (the stack-agnostic contract compatibility and secrets gate).
---

# review — code and contract gates

Pick the mode (`code` | `contract`); a change that touched `contract/states/**` or routes gets **both**, contract first. Review the diff, not the whole file; report findings as blocking / should-fix / nit, each with file:line and the rule it breaks. Gates are mechanical before they are human — naming, domain fit, and judgment start where the checklist stops.

## Mode: contract

Apply the **spn-core** plugin's `refs/contract-rules.md` (cross-plugin pointer — spn-core ships alongside this plugin from the `saasplane` marketplace; use its review card as the checklist). The short form:

- One Command in, one State out; commands forward-compatible + idempotent; auth context never in the body; states backward-compatible; events immutable/past-tense/append-only; enums additive.
- Commands carry the caller's inputs only — never the entity's stored `Config` carrier; variant input = `mtype`-discriminated command variants; a client stubbing `maskedX: ''` / `provider: ''` means the command shape is wrong. Constructed family literals are annotated with the **variant** type, never the base.
- **Breaking change detector**: removed/renamed/retyped field, changed meaning, tightened validation on an existing command field → blocking unless it arrives as a planned, versioned change with a migration path.
- Errors: namespaced codes from the module registry, category mapped once, public structured `data`, anti-enumeration (out-of-scope = 404, never 403).
- Secrets: nothing retrievable that is secret — masked reads, `internal` write-only halves, challenge-based OTPs (hash stored, verify-and-burn), reveal-once in dedicated states, no stored secret returnable by any API.
- Generated artifacts untouched by hand; validators regenerated (`gen-validators`) in the same change as the states; cross-module reach only through contracts (or request queues for writes).

## Mode: code

The TypeScript standards, as this skill carries them. **This digest is the standard for anyone reading it** — it is what the review is run against. Its provenance is the foundation book's TypeScript provider set (naming, structure, code patterns, errors and logging, service patterns, database patterns, codegen, toolchain, config and environment, plus the kind registry); where that book is at hand it carries the reasoning behind each rule, and where it is not, nothing here is deferred:

**Naming/structure** — role suffixes (`Service`/`Repository`/`Provider`/`Manager`/`Entity`/`Controller`/`Listener`); module codes FULLY UPPERCASE in class/type/file names (`IAMOrgService`, never `IamOrgService`); enums `Type`-suffixed, keys UPPER_SNAKE matching values; discriminators `<noun>Type`/`<noun>_type`, never bare `type`; `Id`/`Ids` not `ID`; acronyms CAPS in type names; kebab-case multi-export files, PascalCase class files; tests under `tests/`, never `src/`; the `spkind.json` key present on new projects; `app/services|repositories|entities` are classes-only (helpers → `app/utils/` or `app/support/`); controllers and listeners are classes.

**Code patterns** — named exports only; one root barrel (generated via `gen-barrel`), no sub-barrels, never re-export another package's symbols; no object shorthand (`key: value` explicit); returns built as typed `const result: T = {…}` then returned — never inline literals from `return`; contract fields `| null` never optional and CDT types only — a contract is JSON on the wire, so a member is a CDT type, a contract enum, a reference to another contract interface, or an array of one of those, never a language primitive (`gen-validators` refuses to generate otherwise); contract constants in `contract/constants.ts` at the contract root — never in `contract/states/*`, never imported by a validator, and a states file never imports back from it; the contract carries NO logic — no functions in states or constants (resolvers, predicates and derivations are the app layer's), and no vestigial aliases (`type X = Y` naming the whole of another type says nothing); `verb{Module}{Action}` utility names; four-group import order; await or return every promise; never-returning throw helpers stay `function` declarations.

**Errors/logging** — throw over log; helpers over hand-built errors; no raw status numbers; no secrets/internal names in `data`; logger provider (four levels; error object 3rd arg, data 4th), `console.log` bootstrap-only.

**Service layer** — the one-screen Rule Digest: one terminal cached bulk reader per (entity, level); `_prepare*` pure, reached only via cached readers; mutations return via `get<X>ById`, never `_prepare(saved)`; create no purge / update exact-key purge; search hydrates repo ids in order; `@SPAuthorize` on every contract method at the right tier, pre-auth methods bare; decorator order Authorize → Reauth → Cache → Transactional; cross-module writes via request queues with requestKey; audit after the fresh read; active toggle not delete; null-skip updates; wholesale junction replacement; repos take tenant scope first, throw on missing ids, never call services; secrets masked at the mapper; 404 anti-enumeration.

**Database** — org_id leads indexes; ulid CHAR(26) service-assigned; column order (audit tail last); `active` flag, no `deleted_at`; migrations pure, epoch-ms versioned, DDL/seed split; jsonb required-field additions handled across every literal/builder/fixture.

**Codegen/config** — no hand edits to `contract/validators/**`, barrels, `src/generated/**`, label manifests; `gen-validators`/`gen-barrel` run before commit, and a `gen-validators` REFUSAL is a contract defect to fix at the source, never worked around — it reports either *kindly use CDT Types* or *a contract state expresses absence as `| null`, never `?`*; `gen-symbols` emits the published surface for every installable kind; env via `getEnv*` under the `{CODE}_*` grammar, never raw `process.env`, no hardcoded prefixes, no secrets in committed env files.

## Docs coupling (both modes)

A change to a module's contract surface, schema, permissions, errors, or env with **no delta in its doc set** (`docs/03-capabilities/README.md` or its `data-model.md` / `docs/02-behaviors/README.md` / `docs/artifacts/resources/schema.sql`) is a **should-fix** — the doc set changes in the same PR as the API it describes. New `I*Service` methods or exported components without a one-line intent comment: should-fix (foundation decision RD.APPS.006). A behavior row flipped to ✅ without a citable test: blocking (statuses never claim what the code doesn't back).

## Lenses

Contract mode is the `partner` lens convened: run it through the `spn-panel` subagent with the core plugin's `refs/lenses/partner.md` over the contract diff. Code mode may additionally convene `trust` when the change touches authorization, audit, or secrets.

## Verdict

Close with: pass / pass-with-should-fixes / blocked, the list per severity, and — for contract mode — an explicit "additive: yes/no" line. Never wave a breaking change through as a should-fix.
