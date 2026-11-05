// `sql-grammar.ts` (MKT.PROVIDERS.34 · MKT.HOOKS.492) — the SQL grammar as pure functions: TABLE, SCHEMA, ENUM · INDEX · JSON
// and AUDIT TAIL, each rule proven by a known-bad SQL that names it and a known-good SQL that passes. The apps check and the
// devex check each import it, so the rules are proven once here.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..");
const { sqlFindings } = await import(pathToFileURL(resolve(HERE, "src", "lib", "sql-grammar.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  [MKT.PROVIDERS.34] [MKT.HOOKS.492] ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  [MKT.PROVIDERS.34] [MKT.HOOKS.492] ${label}${detail ? `\n        ${String(detail).slice(0, 400)}` : ""}`);
};
const rules = (sql, context = { module: "prj" }) => sqlFindings(sql, context).map((f) => f.rule);
const only = (label, sql, expected, context) => {
  const got = rules(sql, context);
  ok(label, JSON.stringify(got) === JSON.stringify(expected), JSON.stringify(got));
};

const TAIL = "created_at timestamptz, updated_at timestamptz, created_by uuid, updated_by uuid";
const table = (name, extra = "", schema = "platform") => `CREATE TABLE ${schema}.${name} (id uuid PRIMARY KEY, ${extra}${extra ? ", " : ""}${TAIL});`;

console.log("=== a SQL that follows the grammar is silent");
only("a singular prefixed table in platform with its audit tail", table("prj_project", "name text"), []);
only("the same in product and in a templated schema", table("prj_project", "", "product") + table("prj_task", "", "${schema}"), []);
only("an enum ending _type, an index and a unique index named for their table",
  "CREATE TYPE platform.prj_state_type AS ENUM ('a');\nCREATE INDEX idx_prj_project_name ON platform.prj_project (name);\nCREATE UNIQUE INDEX uq_prj_project_code ON platform.prj_project (code);", []);
only("a JSON column ending _json", table("prj_project", "settings_json jsonb"), []);
only("an immutable row keeps created_at alone", "CREATE TABLE platform.prj_event (id uuid, created_at timestamptz);", []);
only("a table whose singular ends in status is not plural", table("prj_status"), []);
only("the framework's transaction-bound store in platform keeps its app prefix",
  "CREATE TABLE platform.svc_transaction_bound_write (id uuid, " + TAIL + ");", []);
only("a named unique and foreign-key constraint start uq_ and fk_ with the table",
  "ALTER TABLE platform.prj_task ADD CONSTRAINT uq_prj_task_code UNIQUE (code);\nALTER TABLE platform.prj_task ADD CONSTRAINT fk_prj_task_project FOREIGN KEY (p) REFERENCES platform.prj_project (id);", []);

console.log("\n=== rule TABLE");
only("a table without the module's code", table("job_project"), ["TABLE"]);
only("a table that reads plural", table("prj_projects"), ["TABLE"]);
only("a table that is not snake_case", table("prjProject"), ["TABLE"]);
only("a table over 63 bytes", table("prj_" + "a".repeat(60)), ["TABLE"]);
ok("the finding says what to write instead", sqlFindings(table("prj_projects"), { module: "prj" })[0].message.includes("singular"));
ok("the framework store name is exempt only in platform", rules("CREATE TABLE product.svc_transaction_bound_write (id uuid, " + TAIL + ");").includes("TABLE"));
only("with no module named, any code and an entity passes", table("zzz_thing"), [], { module: null });
only("with no module named, a name without a code is refused", table("thing"), ["TABLE"], { module: null });

console.log("\n=== rule SCHEMA");
only("a table naming no schema", "CREATE TABLE prj_project (id uuid, " + TAIL + ");", ["SCHEMA"]);
only("a table in the migration schema", table("prj_project", "", "migration"), ["SCHEMA"]);
only("a table in a schema nobody declared", table("prj_project", "", "extra"), ["SCHEMA"]);
only("a table in a schema the platform declares", table("prj_project", "", "extra"), [], { module: "prj", declaredSchemas: ["extra"] });

console.log("\n=== rule ENUM");
only("an enum type not ending _type", "CREATE TYPE platform.prj_state AS ENUM ('a');", ["ENUM"]);
only("an enum type without the module's code", "CREATE TYPE platform.job_state_type AS ENUM ('a');", ["ENUM"]);

console.log("\n=== rule INDEX");
only("an index not starting idx_ and its table", "CREATE INDEX ix_name ON platform.prj_project (name);", ["INDEX"]);
only("a unique index starting idx_", "CREATE UNIQUE INDEX idx_prj_project_code ON platform.prj_project (code);", ["INDEX"]);
only("an index named for another table", "CREATE INDEX idx_prj_task_name ON platform.prj_project (name);", ["INDEX"]);
only("an index over 63 bytes", `CREATE INDEX idx_prj_project_${"c".repeat(60)} ON platform.prj_project (c);`, ["INDEX"]);
only("an added unique constraint not starting uq_ and its table", "ALTER TABLE platform.prj_task ADD CONSTRAINT task_code UNIQUE (code);", ["INDEX"]);
only("an added foreign key not starting fk_ and its table", "ALTER TABLE platform.prj_task ADD CONSTRAINT uq_prj_task_p FOREIGN KEY (p) REFERENCES platform.prj_project (id);", ["INDEX"]);
only("an inline unique constraint not starting uq_ and its table",
  "CREATE TABLE platform.prj_task (id uuid, CONSTRAINT task_code UNIQUE (code), " + TAIL + ");", ["INDEX"]);

console.log("\n=== rule JSON");
only("a jsonb column not ending _json", table("prj_project", "settings jsonb"), ["JSON"]);
only("a json column not ending _json", table("prj_project", "payload json"), ["JSON"]);

console.log("\n=== rule AUDIT TAIL");
only("a table with no created_at", "CREATE TABLE platform.prj_project (id uuid, name text);", ["AUDIT TAIL"]);
only("audit columns out of order", "CREATE TABLE platform.prj_project (id uuid, updated_at timestamptz, created_at timestamptz);", ["AUDIT TAIL"]);
only("business columns after the audit columns", "CREATE TABLE platform.prj_project (id uuid, created_at timestamptz, name text);", ["AUDIT TAIL"]);
ok("the denial says why", sqlFindings("CREATE TABLE platform.prj_project (id uuid, name text);", { module: "prj" })[0].message.includes("`created_at` is missing"));
only("a table with no id column owes no tail", "CREATE TABLE platform.prj_link (a uuid, b uuid);", []);

console.log("\n=== regions and purity");
{
  const sql = "SELECT 1;\n" + table("job_project");
  const first = sqlFindings(sql, { module: "prj" })[0];
  ok("a finding's region lies inside the SQL and points at the CREATE", first.region[0] === sql.indexOf("CREATE") && first.region[1] <= sql.length, JSON.stringify(first.region));
  ok("the same text and context give the same findings", JSON.stringify(sqlFindings(sql, { module: "prj" })) === JSON.stringify(sqlFindings(sql, { module: "prj" })));
  ok("a line comment in a table body hides no column from the tail", rules("CREATE TABLE platform.prj_project (id uuid, -- note, x\n " + TAIL + ");").length === 0);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — sql-grammar` : `\n  all ${total} passed — sql-grammar`);
process.exit(failed ? 1 : 0);
