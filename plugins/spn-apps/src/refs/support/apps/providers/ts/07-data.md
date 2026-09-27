<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/07-data.md", "seen": "1607a602" }
  ]
}
-->
# Data — persistence, schemas and migrations

**Source of truth:** the foundation's `10-providers/ts/07-data.md`. Read this as the restatement; that chapter governs, and it carries the worked index arithmetic this ref summarizes.

**Your data outlives every version of the code that writes it**, which makes the database the layer where convention discipline pays off most.

## Entities

- **A primary key is a `CHAR(26)` sortable id assigned in the service**, not by the database.
- **Audit columns are timestamps with a timezone**, and the actor columns are ids referencing the principal table.
- **An org-scoped table carries its tenant column, and that column leads every index.**
- **Every business table carries an active flag, and no table anywhere carries a deleted-at column.** A hard delete is for a junction or owned-child row and for wholesale set replacement.
- **Application-managed columns are not null and take no SQL default.**

**Column order runs id, tenant scope, entity reference, business fields, lifecycle, then the audit tail.** An immutable table carries only the creation stamp; an assignment table may carry only the creation pair.

**Denormalize the tenant column onto a high-volume child** where the join would sit on a hot path. A table that is the organization record, a global identity-level table, and a version-history table each legitimately carry no tenant column.

## Repositories

**Write a repository as a plain class over the entity manager**, with no custom-repository machinery. Start every query from a query builder. Keep masking, mapping and audit above it, and return entities or an id-and-total result.

**A bulk lookup returns a keyed record and throws on any missing key**, so a service never silently drops requested rows. A lookup that legitimately tolerates absence is a separate method returning null.

**Factor filtering and sorting into private builder-mutating helpers**, so the two queries of a split search apply identical predicates. Always parameter-bind, because those helpers are where injection would otherwise creep in.

**The client states what it needs through a search mode** — the total, the records, or both — so a second-page fetch skips the count and a facet count skips the rows. The records query selects only the key column, and hydration happens in the service.

- **Apply the where-builder to both queries**, and never apply sorting or pagination to the count query.
- **Pagination is offset-based, one-based, and both page and size are nullable**, with null meaning unpaginated. A result's total is null where the mode skipped the count.
- **Offset pagination over a mutating set can skip or duplicate rows across pages.** That is acceptable for an administrative listing, which is the only place it is used.

## Tenant scoping

**Every read and write carries the tenant predicate, including a by-id lookup.** So the plan must always be able to seek on the tenant column, which is why that column leads an index beyond mere selectivity.

| Posture | Reads | Writes |
| --- | --- | --- |
| strict own-tenant | the caller's scope only | the caller's scope only |
| shared platform default | the caller's rows or the platform default | own scope only |
| platform oversight | unrestricted for a platform-scope caller, own scope otherwise | the same |

**An out-of-scope id resolves to not-found rather than forbidden.** Because the predicate runs in SQL, a row in another tenant simply does not match. A cache key must include the scope before you rely on that.

## Discriminator columns

**Store a polymorphic document's discriminator also as a denormalized, indexable `<noun>_type` enum column.** Query and index on the column, never inside the document. The service asserts that the document's `mtype` matches the column at write time, and the redundant pair is intentional because it stays queryable with no JSON access.

## Write-only columns

**Enforcement sits above the ORM, not in it.** The entity always carries the raw column, because delivery paths need it, and the mapper masks it before any read model leaves the service.

**Keep secrets inside the polymorphic document under `internal`**, so the standard masking covers every current and future secret field. A credential value is stored as a password hash and is never mapped out at all.

**Never put a write-only field in a column of a state that is mapped out**, trusting a future mapper to remember to strip it.

## Indexes

**Start lean. Every index costs a write, storage, and maintenance.** Create only those with a measurable benefit.

**Ask these questions in order.**

| Question | The bar |
| --- | --- |
| how often does the query run | frequent means probably index; rare means cache instead |
| how many rows remain after the parent filters | under about a hundred rows a sequential scan is faster than an index |
| is there a better answer | full-text search, log aggregation, an application cache, or filtering in code after a parent query |

**Do not index a status inside an already tiny parent scope.** A composite index on the hierarchy usually covers the query the status index was written for.

**Column order matches the application's filter order**: the tenant column first, then parent keys in hierarchy order, then business filters, with the sorting timestamp last — descending for time series, ascending for a scheduled-work queue.

**Candidates worth checking against the framework**: the tenant-scoped list, the parent-child list, the grandparent-child list where the ancestor is denormalized, the status filter, and a partial unique business key.

**Before creating any index, confirm** the query is frequent or critical, the dataset after parent filters is large enough, no better alternative exists, the tenant column is first, no existing composite already covers it, and the column order matches the query.

**Reach for a partial index to shrink one**, an expression index for a computed predicate, a GIN index for document search, and a covering index for an index-only scan. Use `EXPLAIN ANALYZE` rather than intuition, and read index usage from the statistics views before dropping anything.

## Migrations

**A migration is the only way the schema changes**, and the runner merges every module's migrations into one global order by version.

- **A version is the epoch milliseconds at authoring time.** A new migration exceeds every existing one and runs last. It must also exceed every migration it depends on, across modules.
- **Treat the file name, the array position and the module registration order as cosmetic.** Only the version orders anything.
- **Schema migrations run before seed migrations**, which come in dependency order at higher versions. A seed migration's rollback deletes only its own rows.
- **A migration is self-contained.** No shared helpers, inline validation and hashing, and the only source imports permitted are immutable seed-id constants. Read the environment through the helpers rather than the raw process environment.

**Adding a required field to a document-persisted type breaks every seeded row.** A migration writes that column as a JSON literal no compiler checks against the type, so existing rows silently violate it and the response validator then rejects every read — a broad outage while every package still typechecks clean.

**In the same change**: update every migration literal that writes it, every runtime builder that constructs it, and every integration fixture. Then verify on a clean reset rather than a warm database. Prefer a nullable addition, which degrades instead of failing closed.

**Create an index on a large existing table concurrently**, and drop an invalid one if creation fails. Drop an index only after its usage count has stayed at zero for a week or more, and rebuild a bloated index concurrently too.
