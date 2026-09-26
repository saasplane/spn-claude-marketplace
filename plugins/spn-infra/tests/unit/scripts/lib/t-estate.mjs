// The estate laws — each against what it must refuse AND what it must let through, each against what it must refuse AND what it must let
// through. A rule tested only on known-bad input cannot tell you it is conservative.
import { one, done, hasBash } from "../../../helpers/harness.mjs";

const EST = "/tmp/estate/src/spestate.json";
const SRC = "/tmp/estate/src/blueprint.ts";

console.log(`=== estate laws — parity arm ${hasBash ? "ON (bash present)" : "OFF (bash retired)"}`);

// 1 · dist/ — the path alone decides, and it decides even with no text at all.
one("an edit under dist/", { input: { file_path: "/tmp/estate/dist/main.js", content: "x" }, expect: "deny", says: "under dist/" });
one("an edit under dist/ with no content", { input: { file_path: "/tmp/estate/dist/main.js" }, expect: "deny", says: "under dist/" });
one("a folder merely named distribution", { input: { file_path: "/tmp/estate/distribution/main.ts", content: "x" }, expect: "" });

// 2 · ARNs.
one("an ARN in a manifest", { input: { file_path: EST, content: '{"role":"arn:aws:iam::1:role/x"}' }, expect: "deny", says: "ARN" });
one("an ARN in ordinary source", { input: { file_path: SRC, content: 'const r = "arn:aws-cn:s3:::b";' }, expect: "deny", says: "ARN" });
one("the word arn on its own", { input: { file_path: SRC, content: 'const arn = discovered();' }, expect: "" });

// 3 · Secret shapes.
one("an access key id", { input: { file_path: SRC, content: 'const k = "AKIAIOSFODNN7EXAMPLE";' }, expect: "deny", says: "access key id" });
one("private key material", { input: { file_path: SRC, content: "-----BEGIN RSA PRIVATE KEY-----\nabc\n" }, expect: "deny", says: "private key" });
one("a credential key with a literal", { input: { file_path: EST, content: '{"client_secret": "s3cr3t-value-long"}' }, expect: "deny", says: "credential-named key" });
one("a credential key holding a reference", { input: { file_path: EST, content: '{"client_secret": "${VAULT_SECRET}"}' }, expect: "" });
// THE LENGTH THRESHOLD IS EIGHT, and both implementations agree on it. `changeme` is exactly eight
// and IS refused; this case was first written expecting silence and the parity arm proved the
// expectation wrong rather than the port. Both sides of the boundary are stated so nobody has to
// re-derive it from a regex.
one("a credential key holding a placeholder under the threshold", { input: { file_path: EST, content: '{"password": "short"}' }, expect: "" });
one("a credential key holding an eight-character literal", { input: { file_path: EST, content: '{"password": "changeme"}' }, expect: "deny", says: "credential-named key" });

// 4 · Account ids — only where a key names one.
one("a keyed account id", { input: { file_path: EST, content: '{"account_id": "123456789012"}' }, expect: "deny", says: "account id" });
one("a bare twelve-digit number", { input: { file_path: EST, content: '{"ordinal": "123456789012"}' }, expect: "" });

// 5 · Provider strings, in estate manifests only.
one("a region outside a cloud entry", { input: { file_path: EST, content: '{"note": "deploy to us-east-1"}' }, expect: "deny", says: "provider region" });
one("a region as a cloud entry's own value", { input: { file_path: EST, content: '{"cloud": {"region": "us-east-1"}}' }, expect: "" });
one("an instance class outside a capacity key", { input: { file_path: EST, content: '{"note": "db.r6g.large"}' }, expect: "deny", says: "instance class" });
one("an instance class as a capacity value", { input: { file_path: EST, content: '{"profile": {"database": "db.r6g.large"}}' }, expect: "" });
one("a region in ordinary source is not this rule's business", { input: { file_path: SRC, content: 'const r = "us-east-1";' }, expect: "" });

// The conservative floor: nothing to go on means allow.
one("no file path", { input: { content: "arn:aws:iam::1:role/x" }, expect: "" });
one("a clean manifest", { input: { file_path: EST, content: '{"name": "platform"}' }, expect: "" });

done("estate laws");
