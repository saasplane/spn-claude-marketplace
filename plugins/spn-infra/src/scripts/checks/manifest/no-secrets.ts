#!/usr/bin/env node
// RESTATES: `spn-claude-marketplace/plugins/spn-infra/src/refs/support/infra/README.md` § no secrets at any path. The ref governs.
//
// Refuse secret material at the moment it is written, at any path.
//
// **THESE THREE ARE THE SHAPES A SECRET ACTUALLY TAKES IN A FILE**, and each is unmistakable: an
// ARN carries its own scheme, an access key id has a fixed prefix and a fixed length, and a private
// key announces itself in a header. None of the three has an innocent form, which is why they are
// matched at every path rather than only in a manifest.
//
// **A LITERAL CREDENTIAL IS THE FOURTH AND IT IS THE ONLY JUDGEMENT CALL.** A `${…}` reference is
// how a credential is supposed to arrive and is left alone, and a short value is a placeholder
// rather than a secret. So the rule needs a credential-named key, a quoted literal, and eight
// characters — three signals together, because any one of them alone is ordinary.
import type { Rule } from "../laws.ts";
import { LAWS } from "../laws.ts";

export const RULES: Rule[] = [
  {
    name: "arn",
    applies: () => true,
    run: (_path, text) => /arn:aws[a-z-]*:/.test(text)
      ? { deny: `Denied: the text being written contains an ARN. ${LAWS}` } : null,
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
