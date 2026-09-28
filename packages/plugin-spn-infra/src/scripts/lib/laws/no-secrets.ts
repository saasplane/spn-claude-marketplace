#!/usr/bin/env node
// RESTATES: `plugin-spn-infra/src/refs/support/infra/README.md` § no secrets at any path. The ref governs.
//
// Refuse secret material at the moment it is written, at any path.
//
// **THESE THREE ARE THE SHAPES A SECRET ACTUALLY TAKES IN A FILE**, and each is unmistakable: an
// ARN carries its own scheme, an access key id has a fixed prefix and a fixed length, and a private
// key announces itself in a header. None of the three has an innocent form, which is why they are
// matched at every path rather than only in a manifest.
//
// **ONE PLACEHOLDER ACCOUNT IS SANCTIONED, AND ONLY INSIDE A `*.tftest.hcl` FILE**: `000000000000`,
// every provider's own reserved testing account, held by nobody. Blanked before the search, same as
// `provider-strings.ts`'s two sanctioned homes, so what remains is a real-looking ARN.
//
// **A LITERAL CREDENTIAL IS THE FOURTH AND IT IS THE ONLY JUDGEMENT CALL.** A `${…}` reference is
// how a credential is supposed to arrive and is left alone, and a short value is a placeholder
// rather than a secret. So the rule needs a credential-named key, a quoted literal, and eight
// characters — three signals together, because any one of them alone is ordinary.
import type { Rule } from "./law.ts";
import { LAWS } from "./law.ts";

/** The one ARN shape a `*.tftest.hcl` file may hold: the reserved testing account, and nothing else. */
const PLACEHOLDER_ARN = /arn:aws[a-z-]*:[a-z0-9-]*:[a-z0-9-]*:000000000000:[a-z0-9/:_-]*/gi;

export const RULES: Rule[] = [
  {
    name: "arn",
    applies: () => true,
    run: (path, text) => {
      const isTestFile = path.endsWith(".tftest.hcl");
      const scrubbed = isTestFile ? text.replace(PLACEHOLDER_ARN, "") : text;
      if (!/arn:aws[a-z-]*:/.test(scrubbed)) return null;
      return { deny: `Denied: the text being written contains an ARN${isTestFile ? " that does not name the placeholder account 000000000000" : ""}. ${LAWS}` };
    },
  },
  {
    name: "access-key-id",
    applies: () => true,
    run: (_path, text) => /\b(AKIA|ASIA)[0-9A-Z]{16}\b/.test(text)
      ? { deny: `Denied: the text being written contains an access key id. ${LAWS}` } : null,
  },
  {
    name: "private-key",
    applies: () => true,
    run: (_path, text) => /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text)
      ? { deny: `Denied: the text being written contains private key material. ${LAWS}` } : null,
  },
  {
    // A credential-named key assigned a quoted LITERAL. A `${…}` reference is how a credential is
    // supposed to arrive, and a short value is a placeholder rather than a secret.
    name: "literal-credential",
    applies: () => true,
    run: (_path, text) => /"[a-z0-9_-]*(password|secret|api[_-]?key|access[_-]?key|client[_-]?secret)[a-z0-9_-]*"\s*[:=]\s*"[^"$][^"]{7,}"/i.test(text)
      ? { deny: `Denied: the text being written assigns a literal value to a credential-named key. A credential is never pinned in a file — it belongs in the config plane, written through the config commands. ${LAWS}` } : null,
  },
];
