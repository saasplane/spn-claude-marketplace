// `host-assertion` — an unanchored host pattern in a navigation assertion.
import { one, done, tree } from "../../../../../helpers/harness.mjs";

const SPEC = "apps/web/tests/journeys/signin.spec.ts";
const file = (body) => "import { expect } from '@playwright/test';\n\n" + body + "\n";

console.log("=== host-assertion — known-bad");

const BAD = "const OUR_HOSTS = /lc-spndemo\\.app/;\nawait expect(page).toHaveURL(OUR_HOSTS);";
one("the 2026-09-06 defect itself", {
  script: "host-assertion", root: tree({ [SPEC]: file(BAD) }),
  input: { file_path: SPEC, content: file(BAD) },
  expect: "deny", says: "unanchored host pattern",
});

const INLINE = "await page.waitForURL(/example\\.app/);";
one("inline in a waitForURL", {
  script: "host-assertion", root: tree({ [SPEC]: file(INLINE) }),
  input: { file_path: SPEC, content: file(INLINE) },
  expect: "deny", says: "waitForURL",
});

// THE CONTEXT MUST BE IN THE LITERAL'S OWN STATEMENT. A pattern assigned to a neutral name on one
// line and used navigationally on the next is silent in both implementations — the window is a
// statement, not a file. That is the check being precise rather than missing a case.
const HOSTNAME = "expect(new URL(u).hostname).toMatch(/example\\.app/);";
one("a hostname comparison", {
  script: "host-assertion", root: tree({ [SPEC]: file(HOSTNAME) }),
  input: { file_path: SPEC, content: file(HOSTNAME) },
  expect: "deny", says: "hostname",
});

{
  const before = file("await page.waitForURL(/^https:\\/\\/example\\.app\\//);");
  const after = "await page.waitForURL(/example\\.app/);";
  one("an Edit that loosens an anchored pattern", {
    script: "host-assertion", root: tree({ [SPEC]: before }),
    input: { file_path: SPEC, old_string: "await page.waitForURL(/^https:\\/\\/example\\.app\\//);",
             new_string: after },
    expect: "deny", says: "unanchored host pattern",
  });
}

console.log("\n=== host-assertion — untouched");

const FRONT = "await page.waitForURL(/^https:\\/\\/example\\.app(\\/|$)/);";
one("anchored at the front", {
  script: "host-assertion", root: tree({ [SPEC]: file(FRONT) }),
  input: { file_path: SPEC, content: file(FRONT) }, expect: "",
});

const BACK = "await expect(page).toHaveURL(/example\\.app$/);";
one("anchored at the back", {
  script: "host-assertion", root: tree({ [SPEC]: file(BACK) }),
  input: { file_path: SPEC, content: file(BACK) }, expect: "",
});

const URLEQ = "expect(new URL(page.url()).hostname).toBe('example.app');";
one("the hostname equality the rule asks for", {
  script: "host-assertion", root: tree({ [SPEC]: file(URLEQ) }),
  input: { file_path: SPEC, content: file(URLEQ) }, expect: "",
});

const COMMENT = "// Never write /example\\.app/ in a toHaveURL — it matches inside a redirect_uri.\n" +
  "await page.waitForURL(/^https:\\/\\/example\\.app\\//);";
one("the bad pattern quoted in a comment", {
  script: "host-assertion", root: tree({ [SPEC]: file(COMMENT) }),
  input: { file_path: SPEC, content: file(COMMENT) }, expect: "",
});

const STRING = "const documented = 'use /example\\\\.app/ only when anchored';\nconsole.log(documented);";
one("the bad pattern inside a string", {
  script: "host-assertion", root: tree({ [SPEC]: file(STRING) }),
  input: { file_path: SPEC, content: file(STRING) }, expect: "",
});

const NOCONTEXT = "const emailDomain = /example\\.app/;\nexpect(address).toMatch(emailDomain);";
one("a host-shaped pattern with nothing navigational about it", {
  script: "host-assertion", root: tree({ [SPEC]: file(NOCONTEXT) }),
  input: { file_path: SPEC, content: file(NOCONTEXT) }, expect: "",
});

const DIVIDE = "const rate = total / count / 2;\nawait page.waitForURL(/^https:\\/\\/example\\.app\\//);";
one("division, which is not a regex", {
  script: "host-assertion", root: tree({ [SPEC]: file(DIVIDE) }),
  input: { file_path: SPEC, content: file(DIVIDE) }, expect: "",
});

one("a markdown file, which this never reads", {
  script: "host-assertion", root: tree({ "docs/rule.md": BAD }),
  input: { file_path: "docs/rule.md", content: BAD }, expect: "",
});

{
  const before = file(BAD + "\nconst other = 1;");
  one("an unrelated edit beside a pre-existing violation", {
    script: "host-assertion", root: tree({ [SPEC]: before }),
    input: { file_path: SPEC, old_string: "const other = 1;", new_string: "const other = 2;" },
    expect: "",
  });
}

done("host-assertion");
