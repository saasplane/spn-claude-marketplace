// `read-verb-naming` — a read verb returning an XList must be named for that list.
import { one, done, tree } from "../../../../../helpers/harness.mjs";

const WATCHED = "packages/thing-ts/src/contract/services/UserService.ts";
const UNWATCHED = "packages/thing-ts/src/app/services/UserService.ts";

const iface = (body) => `export interface UserService {\n${body}\n}\n`;

console.log("=== read-verb-naming — known-bad");

one("a plural read returning an XList", {
  script: "read-verb-naming",
  root: tree({ [WATCHED]: iface("  getUsers(): Promise<UserList>;") }),
  input: { file_path: WATCHED, content: iface("  getUsers(): Promise<UserList>;") },
  expect: "deny", says: "name it getUserList",
});

one("the getAll form, plural", {
  script: "read-verb-naming",
  root: tree({ [WATCHED]: iface("  getAllUsers(): Promise<UserList>;") }),
  input: { file_path: WATCHED, content: iface("  getAllUsers(): Promise<UserList>;") },
  expect: "deny", says: "name it getAllUserList",
});

one("a scoped plural keeps its scope in the fix", {
  script: "read-verb-naming",
  root: tree({ [WATCHED]: iface("  getUsersByOrg(orgId: string): Promise<UserList>;") }),
  input: { file_path: WATCHED, content: iface("  getUsersByOrg(orgId: string): Promise<UserList>;") },
  expect: "deny", says: "name it getUserListByOrg",
});

one("a signature spanning lines", {
  script: "read-verb-naming",
  root: tree({ [WATCHED]: iface("  getUsers(\n    orgId: string,\n    page: number,\n  ): Promise<UserList>;") }),
  input: { file_path: WATCHED, content: iface("  getUsers(\n    orgId: string,\n    page: number,\n  ): Promise<UserList>;") },
  expect: "deny", says: "getUsers returns Promise<UserList>",
});

{
  // AN EDIT CARRIES ONLY ITS REPLACEMENT. Scored alone the fragment is half a signature and parses
  // as nothing, which is how a hook reports green having checked nothing.
  const before = iface("  getUserList(): Promise<UserList>;");
  const after = "  getUsers(): Promise<UserList>;";
  one("an Edit whose fragment is only the new line", {
    script: "read-verb-naming",
    root: tree({ [WATCHED]: before }),
    input: { file_path: WATCHED, old_string: "  getUserList(): Promise<UserList>;", new_string: after },
    expect: "deny", says: "name it getUserList",
  });
}

console.log("\n=== read-verb-naming — untouched");

one("already named for its list", {
  script: "read-verb-naming",
  root: tree({ [WATCHED]: iface("  getUserList(): Promise<UserList>;") }),
  input: { file_path: WATCHED, content: iface("  getUserList(): Promise<UserList>;") },
  expect: "",
});

one("a plural promising a keyed map keeps its plural", {
  script: "read-verb-naming",
  root: tree({ [WATCHED]: iface("  getOrgMetas(): Promise<OrgMetas>;") }),
  input: { file_path: WATCHED, content: iface("  getOrgMetas(): Promise<OrgMetas>;") },
  expect: "",
});

one("a write verb is not judged", {
  script: "read-verb-naming",
  root: tree({ [WATCHED]: iface("  createUsers(): Promise<UserList>;") }),
  input: { file_path: WATCHED, content: iface("  createUsers(): Promise<UserList>;") },
  expect: "",
});

one("search is not judged", {
  script: "read-verb-naming",
  root: tree({ [WATCHED]: iface("  searchUsers(): Promise<UserList>;") }),
  input: { file_path: WATCHED, content: iface("  searchUsers(): Promise<UserList>;") },
  expect: "",
});

one("the same declaration outside the contract seat", {
  script: "read-verb-naming",
  root: tree({ [UNWATCHED]: iface("  getUsers(): Promise<UserList>;") }),
  input: { file_path: UNWATCHED, content: iface("  getUsers(): Promise<UserList>;") },
  expect: "",
});

one("the offending signature quoted in a doc comment", {
  script: "read-verb-naming",
  root: tree({ [WATCHED]: `/** Never write getUsers(): Promise<UserList> — name it for the list. */\n${iface("  getUserList(): Promise<UserList>;")}` }),
  input: { file_path: WATCHED, content: `/** Never write getUsers(): Promise<UserList> — name it for the list. */\n${iface("  getUserList(): Promise<UserList>;")}` },
  expect: "",
});

{
  // A violation that was ALREADY in the file must not block an edit somewhere else in it.
  const before = iface("  getUsers(): Promise<UserList>;\n  getOrgList(): Promise<OrgList>;");
  one("an unrelated edit beside a pre-existing violation", {
    script: "read-verb-naming",
    root: tree({ [WATCHED]: before }),
    input: { file_path: WATCHED, old_string: "  getOrgList(): Promise<OrgList>;",
             new_string: "  getOrgList(orgId: string): Promise<OrgList>;" },
    expect: "",
  });
}

one("a payload with no file path", {
  script: "read-verb-naming",
  root: tree({ [WATCHED]: iface("  getUserList(): Promise<UserList>;") }),
  input: { content: "anything" },
  expect: "",
});

done("read-verb-naming");
