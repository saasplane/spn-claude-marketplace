// `checks/sql-sample.ts` (MKT.HOOKS.492) — the SQL a workstream's preview or sample draws follows the book's grammar before the
// developer reads it. Each case is a Write payload; only the text the write supplies is read, never a page already written.
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { checkSqlSample, applies } = await import(join(CHECKS, "sql-sample.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  [MKT.HOOKS.492] ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  [MKT.HOOKS.492] ${label}${detail ? `\n        ${String(detail).slice(0, 400)}` : ""}`);
};

const WS = "/work/.spndevex/workstreams/open/037-probe";
const PREVIEW = `${WS}/notes/N003/preview.html`;
const SAMPLE = `${WS}/notes/N003/samples/store.sql`;
const write = (file_path, content, tool_name = "Write") => ({ tool_name, tool_input: { file_path, content } });
const kind = (verdict) => (verdict?.deny ? "deny" : "silent");

const TAIL = "created_at timestamptz, updated_at timestamptz, created_by uuid, updated_by uuid";
const table = (name, extra = "", schema = "platform") => `CREATE TABLE ${schema}.${name} (id uuid PRIMARY KEY, ${extra}${extra ? ", " : ""}${TAIL});`;
const page = (sql) => `<html><body><pre><code>${sql.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre></body></html>`;

console.log("=== which writes it reads");
ok("a workstream arc's preview.html", applies(PREVIEW));
ok("a file in an arc's samples/ folder", applies(SAMPLE));
ok("the approach page is not read", !applies(`${WS}/approach.html`));
ok("a preview outside a workstream is not read", !applies("/work/docs/notes/N003/preview.html"));
ok("a Read is not a write", kind(checkSqlSample({ tool_name: "Read", tool_input: { file_path: PREVIEW, content: table("job_x") } })) === "silent");

console.log("\n=== a draft that follows the grammar passes");
ok("a preview with a grammar-clean table, enum and index", kind(checkSqlSample(write(PREVIEW, page(
  table("ent_custom_field_def", "settings_json jsonb") + "\nCREATE TYPE platform.ent_field_kind_type AS ENUM ('a');\nCREATE INDEX idx_ent_custom_field_def_org ON platform.ent_custom_field_def (org_id);")))) === "silent");
ok("N002's store sample with updated_by in its tail", kind(checkSqlSample(write(SAMPLE,
  `CREATE TABLE platform.svc_transaction_bound_write (id uuid PRIMARY KEY, payload_json jsonb, ${TAIL});\nCREATE TABLE platform.svc_transaction_bound_record_version (id uuid PRIMARY KEY, ${TAIL});`))) === "silent");
ok("a preview with no SQL", kind(checkSqlSample(write(PREVIEW, "<h1>Plan</h1><p>No tables here.</p>"))) === "silent");

console.log("\n=== a draft that breaks it is denied, naming its rule");
{
  const cases = [
    ["TABLE", table("ent_fields")],
    ["SCHEMA", `CREATE TABLE ent_field (id uuid, ${TAIL});`],
    ["ENUM", "CREATE TYPE platform.ent_field_kind AS ENUM ('a');"],
    ["INDEX", "CREATE INDEX ix_field ON platform.ent_field (a);"],
    ["JSON", table("ent_field", "settings jsonb")],
    ["AUDIT TAIL", "CREATE TABLE platform.ent_field (id uuid, name text);"],
  ];
  for (const [rule, sql] of cases) {
    const v = checkSqlSample(write(PREVIEW, page(sql)));
    ok(`${rule}: a preview is denied, naming [${rule}]`, kind(v) === "deny" && v.deny.includes(`[${rule}]`) && v.deny.includes("preview"), JSON.stringify(v));
  }
  const sample = checkSqlSample(write(SAMPLE, "CREATE TABLE platform.ent_field (id uuid, created_at timestamptz, name text);"));
  ok("a sample is denied and called a sample", kind(sample) === "deny" && sample.deny.includes("this sample") && sample.deny.includes("[AUDIT TAIL]"), JSON.stringify(sample));
  ok("the denial cites the book's rules", checkSqlSample(write(PREVIEW, page(table("ent_fields")))).deny.includes("RULE.SUPPORT.APPS.254"));
}

console.log("\n=== the page text is read as a reader sees it");
ok("tags inside the SQL are dropped, so a highlighted pre still reads", kind(checkSqlSample(write(PREVIEW,
  "<pre><span class=k>CREATE TABLE</span> platform.<b>ent_fields</b> (id uuid, " + TAIL + ");</pre>"))) === "deny");
ok("an Edit's new_string is read too", kind(checkSqlSample({ tool_name: "Edit", tool_input: { file_path: SAMPLE, new_string: table("ent_fields") } })) === "deny");

console.log("\n=== a long list is cut");
{
  const many = Array.from({ length: 6 }, (_, i) => table(`ent_thing${i}s`)).join("\n");
  const v = checkSqlSample(write(SAMPLE, many));
  ok("more than four findings show four and count the rest", kind(v) === "deny" && v.deny.includes("and 2 more"), JSON.stringify(v));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — sql-sample` : `\n  all ${total} passed — sql-sample`);
process.exit(failed ? 1 : 0);
