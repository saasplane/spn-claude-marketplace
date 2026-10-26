// `assertion-message` — a journey assertion carrying no message. Warns; never refuses.
import { one, done, tree } from "../../../../../helpers/harness.mjs";

const J = "apps/web/tests/journeys/signin.spec.ts";
const COMPONENT = "apps/web/tests/components/button.spec.tsx";
const CONTRACT = "apps/api/tests/contract/users.spec.ts";
const file = (body) => "import { expect, test } from '@playwright/test';\n\n" + body + "\n";

console.log("=== assertion-message — known-bad");

one("a bare assertion in a journey", {
  script: "assertion-message", root: tree({ [J]: file("await expect(editors).toHaveCount(1);") }),
  input: { file_path: J, content: file("await expect(editors).toHaveCount(1);") },
  expect: "note", says: "says why it might have failed",
});

one("expect.soft with no message", {
  script: "assertion-message", root: tree({ [J]: file("expect.soft(rows).toHaveCount(3);") }),
  input: { file_path: J, content: file("expect.soft(rows).toHaveCount(3);") },
  expect: "note", says: "says why it might have failed",
});

one("expect.poll with no message", {
  script: "assertion-message", root: tree({ [J]: file("await expect.poll(() => count()).toBe(2);") }),
  input: { file_path: J, content: file("await expect.poll(() => count()).toBe(2);") },
  expect: "note", says: "says why it might have failed",
});

const SPANNED = "await expect(\n  page.getByRole('list')\n).toHaveCount(1);";
one("an assertion spanning lines, reported on one", {
  script: "assertion-message", root: tree({ [J]: file(SPANNED) }),
  input: { file_path: J, content: file(SPANNED) },
  expect: "note", says: "says why it might have failed",
});

// A TRAILING COMMA IS NOT A MESSAGE. `expect(\n  x,\n)` is the way a formatter writes an assertion
// over several lines, and the comma after its only argument carries nothing. The assertion gets the
// note a bare assertion gets.
const TRAILING = "await expect(\n  page.getByRole('list'),\n).toHaveCount(1);";
one("[MKT.PROVIDERS.32] an assertion over several lines with a trailing comma and no message", {
  script: "assertion-message", root: tree({ [J]: file(TRAILING) }),
  input: { file_path: J, content: file(TRAILING) },
  expect: "note", says: "says why it might have failed",
});

one("an Edit that introduces a bare assertion", {
  script: "assertion-message",
  root: tree({ [J]: file("const editors = page.getByRole('textbox');") }),
  input: { file_path: J, old_string: "const editors = page.getByRole('textbox');",
           new_string: "const editors = page.getByRole('textbox');\nawait expect(editors).toHaveCount(1);" },
  expect: "note", says: "says why it might have failed",
});

console.log("\n=== assertion-message — untouched");

const WITH = "await expect(editors, 'no channel editor rendered — the session may lack NTF_CONFIG_MANAGE').toHaveCount(1);";
one("a message as a string literal", {
  script: "assertion-message", root: tree({ [J]: file(WITH) }),
  input: { file_path: J, content: file(WITH) }, expect: "",
});

const TEMPLATE = "await expect(editors, `none rendered for ${role}`).toHaveCount(1);";
one("a message as a template literal", {
  script: "assertion-message", root: tree({ [J]: file(TEMPLATE) }),
  input: { file_path: J, content: file(TEMPLATE) }, expect: "",
});

const VARIABLE = "await expect(editors, why).toHaveCount(1);";
one("a message as a variable", {
  script: "assertion-message", root: tree({ [J]: file(VARIABLE) }),
  input: { file_path: J, content: file(VARIABLE) }, expect: "",
});

one("a component spec, a tier this never judges", {
  script: "assertion-message", root: tree({ [COMPONENT]: file("expect(button).toBeVisible();") }),
  input: { file_path: COMPONENT, content: file("expect(button).toBeVisible();") }, expect: "",
});

one("a contract spec, where a second argument would throw", {
  script: "assertion-message", root: tree({ [CONTRACT]: file("expect(body.id).toBe('1');") }),
  input: { file_path: CONTRACT, content: file("expect(body.id).toBe('1');") }, expect: "",
});

const EXTEND = "expect.extend({ toBeFine() { return { pass: true, message: () => '' }; } });";
one("expect.extend, which asserts nothing", {
  script: "assertion-message", root: tree({ [J]: file(EXTEND) }),
  input: { file_path: J, content: file(EXTEND) }, expect: "",
});

const COMMENTED = "// never write expect(editors).toHaveCount(1) with no message\n" + WITH;
one("a bare assertion quoted in a comment", {
  script: "assertion-message", root: tree({ [J]: file(COMMENTED) }),
  input: { file_path: J, content: file(COMMENTED) }, expect: "",
});

const TRAILING_AFTER_MESSAGE = "await expect(\n  page.getByRole('list'),\n  'the list did not render',\n).toHaveCount(1);";
one("[MKT.PROVIDERS.32] a message followed by a trailing comma is still a message", {
  script: "assertion-message", root: tree({ [J]: file(TRAILING_AFTER_MESSAGE) }),
  input: { file_path: J, content: file(TRAILING_AFTER_MESSAGE) }, expect: "",
});

const COMMA_IN_STRING = "await expect(page.getByText('one, two, three'), 'the list did not render').toHaveCount(1);";
one("a comma inside a string is not an argument boundary", {
  script: "assertion-message", root: tree({ [J]: file(COMMA_IN_STRING) }),
  input: { file_path: J, content: file(COMMA_IN_STRING) }, expect: "",
});

one("an unrelated edit beside a pre-existing bare assertion", {
  script: "assertion-message",
  root: tree({ [J]: file("await expect(editors).toHaveCount(1);\nconst other = 1;") }),
  input: { file_path: J, old_string: "const other = 1;", new_string: "const other = 2;" },
  expect: "",
});

one("a payload with no file path", {
  script: "assertion-message", root: tree({ [J]: file(WITH) }),
  input: { content: "anything" }, expect: "",
});

done("assertion-message");
