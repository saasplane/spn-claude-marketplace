// `await-sequencing` — a .then() chain in a server node's source.
import { one, done, tree } from "./harness.mjs";

const SRC = "packages/thing-ts/src/app/UserService.ts";
const SPEC = "packages/thing-ts/src/app/UserService.spec.ts";
const server = (kind = "APP_SERVER") => ({
  "sprepo.json": '{"world":"APPS","stacks":["spn-apps-ts"]}\n',
  "packages/thing-ts/spkind.json": '{"kind":"' + kind + '","config":null}\n',
});

const CHAIN = "export async function load() {\n  return fetchUser().then((user) => user.id);\n}\n";
const AWAITED = "export async function load() {\n  const user = await fetchUser();\n  return user.id;\n}\n";

console.log("=== await-sequencing — known-bad");

for (const kind of ["APP_SERVER", "APP_UTILITY", "MODULE_SERVER", "SUPPORT_SERVER"]) {
  one("a chain in a " + kind + " node", {
    script: "await-sequencing",
    root: tree({ ...server(kind), [SRC]: CHAIN }),
    input: { file_path: SRC, content: CHAIN },
    expect: "deny", says: "await is how you sequence work",
  });
}

one("a chain with a space before the paren", {
  script: "await-sequencing",
  root: tree({ ...server(), [SRC]: CHAIN.replace(".then(", ".then (") }),
  input: { file_path: SRC, content: CHAIN.replace(".then(", ".then (") },
  expect: "deny", says: "await is how you sequence work",
});

one("an Edit that introduces the chain", {
  script: "await-sequencing",
  root: tree({ ...server(), [SRC]: AWAITED }),
  input: { file_path: SRC, old_string: "  const user = await fetchUser();\n  return user.id;",
           new_string: "  return fetchUser().then((user) => user.id);" },
  expect: "deny", says: "await is how you sequence work",
});

console.log("\n=== await-sequencing — untouched");

one("the awaited form the rule asks for", {
  script: "await-sequencing",
  root: tree({ ...server(), [SRC]: AWAITED }),
  input: { file_path: SRC, content: AWAITED }, expect: "",
});

one("an awaited .catch supplying a fallback", {
  script: "await-sequencing",
  root: tree({ ...server(), [SRC]: "const body = await response.json().catch(() => null);\n" }),
  input: { file_path: SRC, content: "const body = await response.json().catch(() => null);\n" },
  expect: "",
});

one("a web node, which is not this rule's subject", {
  script: "await-sequencing",
  root: tree({ ...server("APP_WEB"), [SRC]: CHAIN }),
  input: { file_path: SRC, content: CHAIN }, expect: "",
});

one("a universal node, whose code also runs in a browser", {
  script: "await-sequencing",
  root: tree({ ...server("MODULE_UNIVERSAL"), [SRC]: CHAIN }),
  input: { file_path: SRC, content: CHAIN }, expect: "",
});

one("a spec beside the source", {
  script: "await-sequencing",
  root: tree({ ...server(), [SPEC]: CHAIN }),
  input: { file_path: SPEC, content: CHAIN }, expect: "",
});

one("a file with no node manifest above it", {
  script: "await-sequencing",
  root: tree({ "sprepo.json": '{"world":"APPS"}\n', [SRC]: CHAIN }),
  input: { file_path: SRC, content: CHAIN }, expect: "",
});

one("a chain quoted in a doc comment", {
  script: "await-sequencing",
  root: tree({ ...server(), [SRC]: "/** Never write fetchUser().then((u) => u.id) here. */\n" + AWAITED }),
  input: { file_path: SRC, content: "/** Never write fetchUser().then((u) => u.id) here. */\n" + AWAITED },
  expect: "",
});

one("a chain inside a string", {
  script: "await-sequencing",
  root: tree({ ...server(), [SRC]: "const advice = 'do not use x.then(y) on the server';\n" }),
  input: { file_path: SRC, content: "const advice = 'do not use x.then(y) on the server';\n" },
  expect: "",
});

one("an unrelated edit beside a pre-existing chain", {
  script: "await-sequencing",
  root: tree({ ...server(), [SRC]: CHAIN + "\nexport const other = 1;\n" }),
  input: { file_path: SRC, old_string: "export const other = 1;", new_string: "export const other = 2;" },
  expect: "",
});

done("await-sequencing");
