// `enablement-grammar` — the four rules, each proven by a known-bad and an untouched.
import { one, done, tree } from "./harness.mjs";

const SEED = "packages/module-server-prj-api/src/migrations/001-prj-setup-a.ts";
const AUTHZ = "packages/module-server-prj-api/src/app/utils/authz.ts";
const SERVICE = "packages/module-server-prj-api/src/app/services/IAMOrgService.ts";
const MIGRATION = "packages/module-server-prj-api/src/migrations/002-prj-data.ts";

const seed = (code, extra = "") =>
  "export const PRJ_ENABLEMENT_SEED = [\n  {\n    code: '" + code + "',\n" +
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

console.log("\n=== rule 4 ORG TYPE");

const SET_BAD = "const allowed = new Set([OrgType.PLATFORM, OrgType.ACCOUNT]);\n";
one("a hardcoded Set in a service", {
  script: "enablement-grammar", root: tree({ [SERVICE]: SET_BAD }),
  input: { file_path: SERVICE, content: SET_BAD },
  expect: "deny", says: "[ORG TYPE]",
});

const ARRAY_BAD = "const allowed: OrgType[] = [OrgType.PLATFORM, OrgType.ACCOUNT];\n";
one("a hardcoded annotated array", {
  script: "enablement-grammar", root: tree({ [SERVICE]: ARRAY_BAD }),
  input: { file_path: SERVICE, content: ARRAY_BAD },
  expect: "deny", says: "[ORG TYPE]",
});

const INLINE_BAD = "if ([OrgType.PLATFORM, OrgType.ACCOUNT].includes(org.orgType)) { return true; }\n";
one("an inline list asked for membership", {
  script: "enablement-grammar", root: tree({ [SERVICE]: INLINE_BAD }),
  input: { file_path: SERVICE, content: INLINE_BAD },
  expect: "deny", says: "[ORG TYPE]",
});

const QUOTED_BAD = "const allowed = new Set(['PLATFORM', 'ACCOUNT']);\n";
one("the same Set written with string literals", {
  script: "enablement-grammar", root: tree({ [SERVICE]: QUOTED_BAD }),
  input: { file_path: SERVICE, content: QUOTED_BAD },
  expect: "deny", says: "[ORG TYPE]",
});

const COMPLETE = "const every = new Set([OrgType.PLATFORM, OrgType.ACCOUNT, OrgType.PLATFORM_ENTERPRISE,\n" +
  "  OrgType.ACCOUNT_ENTERPRISE, OrgType.PLATFORM_CONSUMER, OrgType.ACCOUNT_CONSUMER]);\n";
one("a complete enumeration, which gates nothing", {
  script: "enablement-grammar", root: tree({ [SERVICE]: COMPLETE }),
  input: { file_path: SERVICE, content: COMPLETE },
  expect: "",
});

const RECORD = "const labels: Record<OrgType, string> = { PLATFORM: 'a', ACCOUNT: 'b' };\n";
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

const COMMENTED = "// never write new Set([OrgType.PLATFORM, OrgType.ACCOUNT]) here\nexport const x = 1;\n";
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
           new_string: "const allowed = new Set([OrgType.PLATFORM, OrgType.ACCOUNT]);" },
  expect: "deny", says: "[ORG TYPE]",
});

done("enablement-grammar");
