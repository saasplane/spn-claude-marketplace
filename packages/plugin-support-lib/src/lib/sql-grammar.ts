// The SQL grammar as pure functions over SQL text: TABLE, SCHEMA, ENUM · INDEX · JSON and AUDIT TAIL, each
// finding naming its rule. The rules are the book's (02-database.md, RULE.SUPPORT.APPS.251 and .254);
// the callers decide which SQL to hand in and which findings a write introduced.

/** The rule a finding names. */
export type SqlRule = "TABLE" | "SCHEMA" | "ENUM" | "INDEX" | "JSON" | "AUDIT TAIL";
/** A half-open span of the SQL text a finding points at. */
export type SqlRegion = [number, number];
/** One breach of the grammar: its rule, where it is, and what to write instead. */
export type SqlFinding = { rule: SqlRule; region: SqlRegion; message: string };

/** What the SQL's surroundings say: the owning module's code, and any schema the platform declares. */
export type SqlContext = {
  /** The owning module's code, as the path or the page names it; null when the SQL names none. */
  module: string | null;
  /** Schemas beyond `platform` and `product` that the platform declares. */
  declaredSchemas?: readonly string[];
};

const MOST_BYTES = 63;
const AUDIT_TAIL = ["created_at", "updated_at", "created_by", "updated_by"] as const;
const SCHEMAS = ["platform", "product"];

// The one stated exception to the module prefix (N002): the service app's transaction-bound store in
// `platform`, and the names derived from it. Its prefix is the app code.
const FRAMEWORK_STORE = /^[a-z][a-z0-9]*_transaction_bound_(?:write|record_version)(?:_[a-z0-9_]+)?$/;

const IDENT = String.raw`[A-Za-z_][\w]*`;
const QUALIFIER = String.raw`(?:(\$\{[^}]*\}|${IDENT})\s*\.\s*)?`;
const CREATE_TABLE = new RegExp(String.raw`\bCREATE\s+(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?${QUALIFIER}(${IDENT})\s*\(`, "gi");
const CREATE_TYPE = new RegExp(String.raw`\bCREATE\s+TYPE\s+${QUALIFIER}(${IDENT})\s+AS\s+ENUM\b`, "gi");
const CREATE_INDEX = new RegExp(String.raw`\bCREATE\s+(UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?(${IDENT})\s+ON\s+(?:ONLY\s+)?${QUALIFIER}(${IDENT})`, "gi");
const ADD_CONSTRAINT = new RegExp(String.raw`\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?${QUALIFIER}(${IDENT})\s+ADD\s+CONSTRAINT\s+(${IDENT})\s+(UNIQUE|FOREIGN\s+KEY)\b`, "gi");
const INLINE_CONSTRAINT = new RegExp(String.raw`^CONSTRAINT\s+(${IDENT})\s+(UNIQUE|FOREIGN\s+KEY)\b`, "i");

const bytes = (name: string) => new TextEncoder().encode(name).length;
const finding = (rule: SqlRule, region: SqlRegion, message: string): SqlFinding => ({ rule, region, message });

/** The span between the parenthesis at `open` and its match, or null. */
function parenBody(sql: string, open: number): SqlRegion | null {
  let depth = 0;
  for (let i = open; i < sql.length; i += 1) {
    if (sql[i] === "(") depth += 1;
    else if (sql[i] === ")") {
      depth -= 1;
      if (depth === 0) return [open + 1, i];
    }
  }
  return null;
}

/** A table body split at its top-level commas, line comments dropped. */
function definitions(body: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of body.replace(/--[^\n]*/g, "")) {
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    if (char === "," && depth === 0) { out.push(current.trim()); current = ""; } else current += char;
  }
  if (current.trim()) out.push(current.trim());
  return out.filter(Boolean);
}

const isConstraint = (definition: string) =>
  /^(?:CONSTRAINT|PRIMARY\s+KEY|UNIQUE|FOREIGN\s+KEY|CHECK|EXCLUDE|LIKE)\b/i.test(definition);

/** A name that reads plural: ends in `s` but not an ending a singular word keeps (`status`, `address`, `analysis`). */
function plural(entity: string): boolean {
  return /s$/.test(entity) && !/(?:ss|us|is|ics|ous)$/.test(entity);
}

/** RULE.SUPPORT.APPS.254: the name starts with the module's code, lower case, and an underscore. */
function prefixed(name: string, module: string | null): boolean {
  if (module) return name.startsWith(`${module.toLowerCase()}_`) && name.length > module.length + 1;
  return /^[a-z][a-z0-9]{1,7}_[a-z0-9]/.test(name);        // no module named: any code and an entity
}

function nameFindings(kind: "table" | "enum type", name: string, region: SqlRegion, context: SqlContext, schema: string | null): SqlFinding[] {
  const rule: SqlRule = kind === "table" ? "TABLE" : "ENUM";
  const out: SqlFinding[] = [];
  const store = FRAMEWORK_STORE.test(name) && schema === "platform";
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    out.push(finding(rule, region, `The ${kind} \`${name}\` is not snake_case. A name is lower case, digits and underscores, ` +
      "`{module}_{entity}` (RULE.SUPPORT.APPS.251)."));
    return out;
  }
  if (!store && !prefixed(name, context.module)) {
    const code = context.module ? `its module's code \`${context.module.toLowerCase()}_\`` : "a module's code and an underscore";
    out.push(finding(rule, region, `The ${kind} \`${name}\` does not start with ${code}. ` +
      "Every table, enum type, sequence, function and view starts with the code of the module that owns it " +
      "(RULE.SUPPORT.APPS.254); a table that belongs to another row is `{module}_{owner}_{entity}`, owner first."));
  }
  if (kind === "table" && !store) {
    const entity = name.split("_").pop() ?? name;
    if (plural(entity)) {
      out.push(finding(rule, region, `The table \`${name}\` reads plural. A table is named for one row: \`{module}_{entity}\`, ` +
        "singular (RULE.SUPPORT.APPS.251)."));
    }
  }
  if (kind === "enum type" && !name.endsWith("_type")) {
    out.push(finding(rule, region, `The enum type \`${name}\` does not end \`_type\`. An enum is \`{module}_{concept}_type\` (RULE.SUPPORT.APPS.251).`));
  }
  if (bytes(name) > MOST_BYTES) {
    out.push(finding(rule, region, `The ${kind} \`${name}\` is ${bytes(name)} bytes. No name passes ${MOST_BYTES}: Postgres cuts a longer one ` +
      "silently and two names can then collide (RULE.SUPPORT.APPS.254)."));
  }
  return out;
}

function schemaFindings(name: string, schema: string | null, region: SqlRegion, context: SqlContext): SqlFinding[] {
  if (schema === null) {
    return [finding("SCHEMA", region, `The table \`${name}\` names no schema. A table is created in the schema its owner holds: ` +
      "`${schema}.name` from the migration's context, or `platform` or `product` in full. One owner per table, one schema per owner.")];
  }
  if (schema.startsWith("${")) return [];
  const lower = schema.toLowerCase();
  if (lower === "migration") {
    return [finding("SCHEMA", region, `The table \`${name}\` is created in \`migration\`, which holds the tracker and nothing else. ` +
      "A migration never creates a schema and never fills that one.")];
  }
  if (![...SCHEMAS, ...(context.declaredSchemas ?? [])].includes(lower)) {
    return [finding("SCHEMA", region, `The table \`${name}\` is created in \`${schema}\`, which is no schema its owner holds. ` +
      "Platform modules own `platform`, the application's modules own `product`, and an added schema belongs to the app that " +
      "declared it in the manifest.")];
  }
  return [];
}

function tailFindings(table: string, defs: string[], region: SqlRegion): SqlFinding[] {
  const columns = defs.filter((d) => !isConstraint(d)).map((d) => d.split(/\s+/)[0].replace(/"/g, "").toLowerCase());
  if (!columns.includes("id")) return [];
  const tail = columns.filter((c) => (AUDIT_TAIL as readonly string[]).includes(c));
  const expected = AUDIT_TAIL.filter((c) => tail.includes(c));
  const last = columns.slice(columns.length - tail.length);
  const ordered = tail.every((c, i) => c === expected[i]);
  const atEnd = tail.every((c, i) => c === last[i]);
  if (tail.includes("created_at") && ordered && atEnd) return [];
  const reason = !tail.includes("created_at") ? "`created_at` is missing"
    : !ordered ? "the audit columns are out of order" : "business columns follow the audit columns";
  return [finding("AUDIT TAIL", region, `The table \`${table}\` does not end \`${AUDIT_TAIL.join(", ")}\`: ${reason}. ` +
    "The audit tail is always last and in that order, dropping the columns the table's shape drops (an immutable row keeps `created_at`).")];
}

function constraintFindings(table: string, name: string, kind: string, region: SqlRegion): SqlFinding[] {
  const unique = /^UNIQUE/i.test(kind);
  const prefix = `${unique ? "uq" : "fk"}_${table}_`;
  const out: SqlFinding[] = [];
  if (!name.toLowerCase().startsWith(prefix) && name.toLowerCase() !== prefix.slice(0, -1)) {
    out.push(finding("INDEX", region, `The ${unique ? "unique" : "foreign-key"} constraint \`${name}\` does not start \`${prefix}\`. ` +
      "A key is `uq_{table}_{columns}` or `fk_{table}_{columns}` (RULE.SUPPORT.APPS.254)."));
  }
  if (bytes(name) > MOST_BYTES) {
    out.push(finding("INDEX", region, `The constraint \`${name}\` is ${bytes(name)} bytes, over the ${MOST_BYTES} Postgres keeps (RULE.SUPPORT.APPS.254).`));
  }
  return out;
}

/**
 * Every finding the four rules see in this SQL: a migration's source, or the text of a preview. Each finding
 * carries a region of `sql`. Pure: the same text and context give the same findings.
 */
export function sqlFindings(sql: string, context: SqlContext): SqlFinding[] {
  const out: SqlFinding[] = [];

  for (const match of sql.matchAll(CREATE_TABLE)) {
    const schema = match[1] ?? null;
    const name = match[2];
    const region: SqlRegion = [match.index, match.index + match[0].length];
    out.push(...nameFindings("table", name, region, context, schema));
    out.push(...schemaFindings(name, schema, region, context));
    const body = parenBody(sql, match.index + match[0].length - 1);
    if (body === null) continue;
    const defs = definitions(sql.slice(body[0], body[1]));
    const whole: SqlRegion = [match.index, body[1]];
    out.push(...tailFindings(name, defs, whole));
    for (const def of defs) {
      const column = /^("?[A-Za-z_]\w*"?)\s+(?:\$\{[^}]*\}\.)?(JSONB?)\b/i.exec(def);
      if (column && !/_json$/i.test(column[1].replace(/"/g, ""))) {
        out.push(finding("JSON", whole, `The JSON column \`${column[1]}\` of \`${name}\` does not end \`_json\`. ` +
          "A document column is `{purpose}_json` (RULE.SUPPORT.APPS.251)."));
      }
      const inline = INLINE_CONSTRAINT.exec(def);
      if (inline) out.push(...constraintFindings(name, inline[1], inline[2], whole));
    }
  }

  for (const match of sql.matchAll(CREATE_TYPE)) {
    out.push(...nameFindings("enum type", match[2], [match.index, match.index + match[0].length], context, match[1] ?? null));
  }

  for (const match of sql.matchAll(CREATE_INDEX)) {
    const unique = Boolean(match[1]);
    const name = match[2];
    const prefix = `${unique ? "uq" : "idx"}_${match[4]}`;
    const region: SqlRegion = [match.index, match.index + match[0].length];
    if (!name.toLowerCase().startsWith(`${prefix}_`) && name.toLowerCase() !== prefix) {
      out.push(finding("INDEX", region, `The ${unique ? "unique index" : "index"} \`${name}\` does not start \`${prefix}_\`. ` +
        "An index is `idx_{table}_{columns}`, a unique one `uq_{table}_{columns}` (RULE.SUPPORT.APPS.254)."));
    }
    if (bytes(name) > MOST_BYTES) {
      out.push(finding("INDEX", region, `The index \`${name}\` is ${bytes(name)} bytes, over the ${MOST_BYTES} Postgres keeps (RULE.SUPPORT.APPS.254).`));
    }
  }

  for (const match of sql.matchAll(ADD_CONSTRAINT)) {
    out.push(...constraintFindings(match[2], match[3], match[4], [match.index, match.index + match[0].length]));
  }
  return out;
}
