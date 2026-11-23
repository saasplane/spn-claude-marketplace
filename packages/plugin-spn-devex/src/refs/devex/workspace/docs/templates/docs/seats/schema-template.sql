-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md § What — capabilities: the standard here, a chapter per construct everywhere else
--      This file carries rules it does not own. The chapter above is the source of truth.
--      A rule change is edited there first, then here, in the same change. Never add a rule here.
--      restate-drift.ts reports this copy when its source moves.

-- =====================================================================================================
-- {{MODULE}} — artifacts/resources/schema.sql
-- The authoritative data model of this module, as SQL a reader can run. Copied into migrations,
-- never the other way round. Sections in this order; a table carries an intent line, a surprising
-- constraint carries a why. Copied from schema-template.sql.
-- module: {{code}} · owner: {{node}} · as of: {{date}}
-- =====================================================================================================

-- 1. schemas ------------------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS {{schema}};

-- 2. tables, by module --------------------------------------------------------------------------------
-- intent: {{what a row is, in the consumer's words}}
CREATE TABLE {{schema}}.{{table}} (
  id            uuid PRIMARY KEY,
  org_id        uuid NOT NULL,              -- the tenant scope every org-scoped row carries
  {{column}}    {{type}} NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid NOT NULL               -- a principal, never an identity
);

-- 3. indexes ------------------------------------------------------------------------------------------
CREATE INDEX {{table}}_org_idx ON {{schema}}.{{table}} (org_id);

-- 4. constraints --------------------------------------------------------------------------------------
-- why: {{the reason a competent reader would otherwise remove it}}
ALTER TABLE {{schema}}.{{table}} ADD CONSTRAINT {{name}} {{constraint}};

-- 5. seeds --------------------------------------------------------------------------------------------
INSERT INTO {{schema}}.{{table}} (...) VALUES (...);
