// `sql-grammar` — a migration write that breaks the SQL grammar is refused, each rule by name (MKT.PROVIDERS.34).
// Q14 A: only the SQL being written is judged. A migration already in the repository is never read unless it is edited,
// and the same names written in a new migration are refused.
import { one, done, tree } from "../../../../../helpers/harness.mjs";

const ENT = "packages/module-server-ent-ts/src/migrations/002-ent-data.ts";
const OLD = "packages/module-server-ent-ts/src/migrations/001-ent-setup.ts";
const NEW = "packages/module-server-ent-ts/src/migrations/003-ent-more.ts";
const CMP = "packages/module-server-cmp-ts/src/migrations/002-cmp-data.ts";
const CODE = "packages/module-server-ent-ts/src/app/services/EntService.ts";

const TAIL = "created_at timestamptz, updated_at timestamptz, created_by uuid, updated_by uuid";
const wrap = (sql) => "export const up = `\n" + sql + "\n`;\n";
const table = (name, extra = "", schema = "platform") => `CREATE TABLE ${schema}.${name} (id uuid PRIMARY KEY, ${extra}${extra ? ", " : ""}${TAIL});`;
const bad = (sql, says, label, path = ENT) => one(`[MKT.PROVIDERS.34] ${label}`, {
  script: "sql-grammar", root: tree({ [path]: wrap(sql) }),
  input: { file_path: path, content: wrap(sql) }, expect: "deny", says,
});

console.log("=== a migration that follows the grammar");

one("[MKT.PROVIDERS.34] a prefixed singular table, its enum, indexes and JSON column pass", {
  script: "sql-grammar",
  root: tree({ [ENT]: wrap("") }),
  input: {
    file_path: ENT,
    content: wrap([
      table("ent_custom_field_def", "settings_json jsonb"),
      "CREATE TYPE platform.ent_field_kind_type AS ENUM ('a');",
      "CREATE INDEX idx_ent_custom_field_def_org ON platform.ent_custom_field_def (org_id);",
      "CREATE UNIQUE INDEX uq_ent_custom_field_def_code ON platform.ent_custom_field_def (code);",
    ].join("\n")),
  },
  expect: "",
});

one("[MKT.PROVIDERS.34] a file that is not a migration is not read", {
  script: "sql-grammar", root: tree({ [CODE]: "" }),
  input: { file_path: CODE, content: wrap(table("job_thing")) },
  expect: "",
});

console.log("\n=== each rule refused by name");

bad(table("job_project"), "[TABLE]", "TABLE: a table under another module's code is refused");
bad(table("ent_fields"), "[TABLE]", "TABLE: a table that reads plural is refused");
bad("CREATE TABLE ent_field (id uuid, " + TAIL + ");", "[SCHEMA]", "SCHEMA: a table naming no schema is refused");
bad(table("ent_field", "", "migration"), "[SCHEMA]", "SCHEMA: a table in the migration schema is refused");
bad("CREATE TYPE platform.ent_field_kind AS ENUM ('a');", "[ENUM]", "ENUM: an enum type not ending _type is refused");
bad("CREATE INDEX ix_field ON platform.ent_field (a);", "[INDEX]", "INDEX: an index not starting idx_ and its table is refused");
bad("ALTER TABLE platform.ent_field ADD CONSTRAINT field_code UNIQUE (code);", "[INDEX]", "INDEX: a unique constraint not starting uq_ and its table is refused");
bad(table("ent_field", "settings jsonb"), "[JSON]", "JSON: a JSON column not ending _json is refused");
bad("CREATE TABLE platform.ent_field (id uuid, name text);", "[AUDIT TAIL]", "AUDIT TAIL: a business table without the audit tail is refused");
bad("CREATE TABLE platform.ent_field (id uuid, created_at timestamptz, name text);", "[AUDIT TAIL]", "AUDIT TAIL: business columns after the audit columns are refused");

one("[MKT.PROVIDERS.34] the denial names the book's rules", {
  script: "sql-grammar", root: tree({ [ENT]: "" }),
  input: { file_path: ENT, content: wrap(table("job_project")) },
  expect: "deny", says: "RULE.SUPPORT.APPS.254",
});

console.log("\n=== ENT and CMP migrations already in the repository (Q14 A)");

const OLD_SQL = wrap([
  "CREATE TABLE platform.ent_custom_field_defs (id uuid, name text);",
  "CREATE INDEX idx_ent_custom_field_def_org_entity ON platform.ent_custom_field_def (org_id);",
  "CREATE UNIQUE INDEX uq_ent_metadata ON platform.ent_metadata (code);",
].join("\n"));

one("[MKT.PROVIDERS.34] an edit elsewhere in a migration that breaks the grammar is not refused for what it did not write", {
  script: "sql-grammar", root: tree({ [OLD]: OLD_SQL }),
  input: { file_path: OLD, old_string: "export const up = `", new_string: "export const down = `" },
  expect: "",
});

one("[MKT.PROVIDERS.34] a CMP migration left untouched is not read when its neighbour is written", {
  script: "sql-grammar", root: tree({ [CMP]: OLD_SQL.replaceAll("ent_", "cmp_"), [ENT]: "" }),
  input: { file_path: ENT, content: wrap(table("ent_field")) },
  expect: "",
});

one("[MKT.PROVIDERS.34] the same names written in a new migration are refused", {
  script: "sql-grammar", root: tree({ [OLD]: OLD_SQL, [NEW]: "" }),
  input: { file_path: NEW, content: OLD_SQL },
  expect: "deny", says: "[TABLE]",
});

one("[MKT.PROVIDERS.34] an edit that writes a breaking line into an existing migration is refused", {
  script: "sql-grammar", root: tree({ [ENT]: wrap(table("ent_field")) }),
  input: { file_path: ENT, old_string: "\n`;", new_string: "\nCREATE INDEX ix_field ON platform.ent_field (a);\n`;" },
  expect: "deny", says: "[INDEX]",
});

one("[MKT.PROVIDERS.34] SQL inside a comment is not judged", {
  script: "sql-grammar", root: tree({ [ENT]: "" }),
  input: { file_path: ENT, content: "// CREATE TABLE job_project (id uuid);\n" + wrap(table("ent_field")) },
  expect: "",
});

done("sql-grammar (apps)");
