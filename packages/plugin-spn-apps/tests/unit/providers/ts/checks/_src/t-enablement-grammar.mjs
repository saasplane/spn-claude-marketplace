// `enablement-grammar` — the four rules, each proven by a known-bad and an untouched, read from a module's contributions.
import { one, done, tree } from "../../../../../helpers/harness.mjs";

const SEED = "packages/module-server-prj-ts/src/migrations/contributions.ts";
const OLD_SEED = "packages/module-server-prj-ts/src/migrations/001-prj-setup-a.ts";
const DOC_SEED = "packages/module-server-doc-ts/src/migrations/contributions.ts";
const AUTHZ = "packages/module-server-prj-api/src/app/utils/authz.ts";
const SERVICE = "packages/module-server-prj-api/src/app/services/IAMOrgService.ts";
const MIGRATION = "packages/module-server-prj-api/src/migrations/002-prj-data.ts";

const seed = (code, extra = "") =>
  "export const PRJ_ENABLEMENT_SEED = [\n  {\n    code: '" + code + "',\n" +
  "    orgTypes: [OrgType.PLATFORM],\n" + extra + "  },\n];\n";

// A DOC module's definition, its own const naming the module, and the field type a definition carries.
const docSeed = (code, extra = "") =>
  "export const DOC_ENABLEMENT_SEED = [\n  {\n    code: " + code + ",\n" +
  "    orgTypes: [OrgType.PLATFORM],\n" + extra + "  },\n];\n";

console.log("=== rule 1 PREFIX");

one("a code under another module's prefix", {
  script: "enablement-grammar", root: tree({ [SEED]: seed("NTF_MANAGE_CHANNELS") }),
  input: { file_path: SEED, content: seed("NTF_MANAGE_CHANNELS") },
  expect: "deny", says: "[PREFIX]",
});

one("a code under its own module's prefix", {
  script: "enablement-grammar", root: tree({ [SEED]: seed("PRJ_MANAGE_CHANNELS") }),
  input: { file_path: SEED, content: seed("PRJ_MANAGE_CHANNELS") },
  expect: "",
});

const PREFIX_OTHER = seed("NTF_MANAGE_CHANNELS");
one("[MKT.PROVIDERS.33] a code under another module's prefix in a contribution is denied, and the denial says to add a selection key in its own contribution", {
  script: "enablement-grammar", root: tree({ [SEED]: PREFIX_OTHER }),
  input: { file_path: SEED, content: PREFIX_OTHER },
  expect: "deny", says: "adds a selection key in its own contribution",
});

one("[MKT.PROVIDERS.33] a bad code in a file named *setup-a* is no longer watched", {
  script: "enablement-grammar", root: tree({ [OLD_SEED]: PREFIX_OTHER }),
  input: { file_path: OLD_SEED, content: PREFIX_OTHER },
  expect: "",
});

console.log("\n=== rule 2 VERB");

one("a verb that is not MANAGE", {
  script: "enablement-grammar", root: tree({ [SEED]: seed("PRJ_ALLOW_CHANNELS") }),
  input: { file_path: SEED, content: seed("PRJ_ALLOW_CHANNELS") },
  expect: "deny", says: "[VERB]",
});

one("a code with only two segments", {
  script: "enablement-grammar", root: tree({ [SEED]: seed("PRJ_MANAGE") }),
  input: { file_path: SEED, content: seed("PRJ_MANAGE") },
  expect: "deny", says: "[VERB]",
});

const LIMIT_OK = docSeed("'DOC_LIMIT_STORAGE_BYTES'", "    fieldType: 'NUMBER',\n");
one("[MKT.PROVIDERS.33] a NUMBER definition DOC_LIMIT_STORAGE_BYTES", {
  script: "enablement-grammar", root: tree({ [DOC_SEED]: LIMIT_OK }),
  input: { file_path: DOC_SEED, content: LIMIT_OK },
  expect: "",
});

const NUMBER_MANAGE = docSeed("'DOC_MANAGE_STORAGE'", "    fieldType: 'NUMBER',\n");
one("[MKT.PROVIDERS.33] a NUMBER definition whose code reads DOC_MANAGE_STORAGE is denied [VERB]", {
  script: "enablement-grammar", root: tree({ [DOC_SEED]: NUMBER_MANAGE }),
  input: { file_path: DOC_SEED, content: NUMBER_MANAGE },
  expect: "deny", says: "[VERB]",
});

const OTHER_LIMIT = docSeed("'DOC_LIMIT_FILES'", "    fieldType: 'BOOLEAN',\n");
one("[MKT.PROVIDERS.33] a non-NUMBER definition whose code reads DOC_LIMIT_FILES is denied [VERB]", {
  script: "enablement-grammar", root: tree({ [DOC_SEED]: OTHER_LIMIT }),
  input: { file_path: DOC_SEED, content: OTHER_LIMIT },
  expect: "deny", says: "[VERB]",
});

const MEMBER_LIMIT = docSeed("DOCEnablementType.LIMIT_STORAGE_BYTES", "    fieldType: IAMEnablementFieldType.NUMBER,\n");
one("[MKT.PROVIDERS.33] the member form DOCEnablementType.LIMIT_STORAGE_BYTES with IAMEnablementFieldType.NUMBER", {
  script: "enablement-grammar", root: tree({ [DOC_SEED]: MEMBER_LIMIT }),
  input: { file_path: DOC_SEED, content: MEMBER_LIMIT },
  expect: "",
});

// The VERB denial carries the two forms and no longer says "no amount form". Read in-process, since a case here can only look for words.
{
  const { verdict } = await import("../../../../../../src/providers/ts/scripts/checks/_src/enablement-grammar.ts");
  const said = verdict(DOC_SEED, NUMBER_MANAGE, NUMBER_MANAGE)?.deny ?? "";
  const ok = said.includes("[VERB]") && said.includes("`{MOD}_LIMIT_{NOUN}`") && !said.includes("no amount form");
  console.log(`  ${ok ? "PASS" : "FAIL"}  [MKT.PROVIDERS.33] the VERB denial names the MANAGE and LIMIT forms and no longer holds the words 'no amount form'`);
  if (!ok) { console.log(`        ${said.slice(0, 300)}`); process.exit(1); }
}

const AUTHZ_BAD = "const E = PRJEnablementType;\nexport const PRJ_AUTHZ = { list: E.VIEW_CHANNELS };\n";
one("a gate member not beginning MANAGE_", {
  script: "enablement-grammar", root: tree({ [AUTHZ]: AUTHZ_BAD }),
  input: { file_path: AUTHZ, content: AUTHZ_BAD },
  expect: "deny", says: "does not begin `MANAGE_`",
});

const AUTHZ_OK = "const E = PRJEnablementType;\nexport const PRJ_AUTHZ = { list: E.MANAGE_CHANNELS };\n";
one("a gate member through an alias, named correctly", {
  script: "enablement-grammar", root: tree({ [AUTHZ]: AUTHZ_OK }),
  input: { file_path: AUTHZ, content: AUTHZ_OK },
  expect: "",
});

console.log("\n=== rule 3 NOUN");

const MULTI_BAD = seed("PRJ_MANAGE_CUSTOMIZATION", "    fieldType: 'STRING_MULTI',\n");
one("a multi-value definition named for its area", {
  script: "enablement-grammar", root: tree({ [SEED]: MULTI_BAD }),
  input: { file_path: SEED, content: MULTI_BAD },
  expect: "deny", says: "[NOUN]",
});

const MULTI_OK = seed("PRJ_MANAGE_ENTITY_TYPES", "    fieldType: 'STRING_MULTI',\n");
one("a multi-value definition named for its options", {
  script: "enablement-grammar", root: tree({ [SEED]: MULTI_OK }),
  input: { file_path: SEED, content: MULTI_OK },
  expect: "",
});

const BOOL_AREA = seed("PRJ_MANAGE_CUSTOMIZATION");
one("a boolean may name the area", {
  script: "enablement-grammar", root: tree({ [SEED]: BOOL_AREA }),
  input: { file_path: SEED, content: BOOL_AREA },
  expect: "",
});

const MULTI_MEMBER_BAD = docSeed("'DOC_MANAGE_CUSTOMIZATION'", "    fieldType: IAMEnablementFieldType.SELECT_MULTI,\n");
one("[MKT.PROVIDERS.33] a multi-value definition written IAMEnablementFieldType.SELECT_MULTI and named for its area is denied [NOUN]", {
  script: "enablement-grammar", root: tree({ [DOC_SEED]: MULTI_MEMBER_BAD }),
  input: { file_path: DOC_SEED, content: MULTI_MEMBER_BAD },
  expect: "deny", says: "[NOUN]",
});

console.log("\n=== rule 4 ORG TYPE");

const SET_BAD = "const allowed = new Set([OrgType.PLATFORM, OrgType.ENTERPRISE]);\n";
one("a hardcoded Set in a service", {
  script: "enablement-grammar", root: tree({ [SERVICE]: SET_BAD }),
  input: { file_path: SERVICE, content: SET_BAD },
  expect: "deny", says: "[ORG TYPE]",
});

const ARRAY_BAD = "const allowed: OrgType[] = [OrgType.PLATFORM, OrgType.ENTERPRISE];\n";
one("a hardcoded annotated array", {
  script: "enablement-grammar", root: tree({ [SERVICE]: ARRAY_BAD }),
  input: { file_path: SERVICE, content: ARRAY_BAD },
  expect: "deny", says: "[ORG TYPE]",
});

const INLINE_BAD = "if ([OrgType.PLATFORM, OrgType.ENTERPRISE].includes(org.orgType)) { return true; }\n";
one("an inline list asked for membership", {
  script: "enablement-grammar", root: tree({ [SERVICE]: INLINE_BAD }),
  input: { file_path: SERVICE, content: INLINE_BAD },
  expect: "deny", says: "[ORG TYPE]",
});

const QUOTED_BAD = "const allowed = new Set(['PLATFORM', 'ENTERPRISE']);\n";
one("the same Set written with string literals", {
  script: "enablement-grammar", root: tree({ [SERVICE]: QUOTED_BAD }),
  input: { file_path: SERVICE, content: QUOTED_BAD },
  expect: "deny", says: "[ORG TYPE]",
});

const THREE = "const every = new Set([OrgType.PLATFORM, OrgType.ENTERPRISE, OrgType.CONSUMER]);\n";
one("[MKT.PROVIDERS.33] all three org types in a Set are still a hardcoded list", {
  script: "enablement-grammar", root: tree({ [SERVICE]: THREE }),
  input: { file_path: SERVICE, content: THREE },
  expect: "deny", says: "[ORG TYPE]",
});

const PAIR = "const allowed = new Set([OrgType.ENTERPRISE, OrgType.CONSUMER]);\n";
one("[MKT.PROVIDERS.33] a Set of ENTERPRISE and CONSUMER", {
  script: "enablement-grammar", root: tree({ [SERVICE]: PAIR }),
  input: { file_path: SERVICE, content: PAIR },
  expect: "deny", says: "[ORG TYPE]",
});

const CEILING_OK = seed("PRJ_MANAGE_CHANNELS");
one("[MKT.PROVIDERS.33] a ceiling of OrgType.PLATFORM", {
  script: "enablement-grammar", root: tree({ [SEED]: CEILING_OK }),
  input: { file_path: SEED, content: CEILING_OK },
  expect: "",
});

const CEILING_CATEGORY = CEILING_OK.replace("OrgType.PLATFORM", "OrgType.CLINIC");
one("[MKT.PROVIDERS.33] a ceiling naming a category code, refused by name", {
  script: "enablement-grammar", root: tree({ [SEED]: CEILING_CATEGORY }),
  input: { file_path: SEED, content: CEILING_CATEGORY },
  expect: "deny", says: "CLINIC",
});
one("[MKT.PROVIDERS.33] the category-code ceiling refusal names Record<OrgType, …> as the form that passes", {
  script: "enablement-grammar", root: tree({ [SEED]: CEILING_CATEGORY }),
  input: { file_path: SEED, content: CEILING_CATEGORY },
  expect: "deny", says: "Record<OrgType, …>",
});

const CEILING_QUOTED = CEILING_OK.replace("OrgType.PLATFORM", "'PATIENT'");
one("[MKT.PROVIDERS.33] a quoted category code in a ceiling, refused by name", {
  script: "enablement-grammar", root: tree({ [SEED]: CEILING_QUOTED }),
  input: { file_path: SEED, content: CEILING_QUOTED },
  expect: "deny", says: "PATIENT",
});

const RECORD = "const labels: Record<OrgType, string> = { PLATFORM: 'a', ENTERPRISE: 'b', CONSUMER: 'c' };\n";
one("Record<OrgType, …>, exhaustive by the type system", {
  script: "enablement-grammar", root: tree({ [SERVICE]: RECORD }),
  input: { file_path: SERVICE, content: RECORD },
  expect: "",
});

one("a ceiling list in a migration, which is correct there", {
  script: "enablement-grammar", root: tree({ [MIGRATION]: SET_BAD }),
  input: { file_path: MIGRATION, content: SET_BAD },
  expect: "",
});

console.log("\n=== scope and masking");

one("an ordinary source file, out of scope", {
  script: "enablement-grammar",
  root: tree({ "packages/module-server-prj-api/src/app/other.ts": SET_BAD }),
  input: { file_path: "packages/module-server-prj-api/src/app/other.ts", content: SET_BAD },
  expect: "",
});

const COMMENTED = "// never write new Set([OrgType.PLATFORM, OrgType.ENTERPRISE]) here\nexport const x = 1;\n";
one("the offending Set quoted in a comment", {
  script: "enablement-grammar", root: tree({ [SERVICE]: COMMENTED }),
  input: { file_path: SERVICE, content: COMMENTED },
  expect: "",
});

one("an unrelated edit beside a pre-existing violation", {
  script: "enablement-grammar",
  root: tree({ [SERVICE]: SET_BAD + "export const other = 1;\n" }),
  input: { file_path: SERVICE, old_string: "export const other = 1;", new_string: "export const other = 2;" },
  expect: "",
});

one("an Edit that introduces the Set", {
  script: "enablement-grammar",
  root: tree({ [SERVICE]: "export const other = 1;\n" }),
  input: { file_path: SERVICE, old_string: "export const other = 1;",
           new_string: "const allowed = new Set([OrgType.PLATFORM, OrgType.ENTERPRISE]);" },
  expect: "deny", says: "[ORG TYPE]",
});

done("enablement-grammar");
