// The estate laws, as refusals at write time — the rules `refs/laws.md` states, enforced where a
// person is about to break one rather than where they would later read about it.
//
// CONSERVATIVE BY CONSTRUCTION: when a rule cannot tell, it allows. Each rule below matches a shape
// somebody TYPED — an ARN, a key id, a pinned account, a provider string in a manifest — and every
// one of those is a value the driver discovers and records as resolved state. A false refusal costs
// a person their edit and their trust in the gate; a miss costs one review comment.
//
// WHY THE RULES ARE NAMED SEPARATELY. A single "estate" verdict cannot say which law it read, so a
// person meets a refusal with no way to check whether the gate or the edit is wrong. Each rule
// carries its own name, its own message and its own cases.

import type { ToolInput, Verdict } from "../lib/payload.ts";

/** What `refs/laws.md` says, quoted at the point of refusal so nobody has to go and find it. */
const LAWS =
  "See refs/laws.md in the spn-infra plugin: no secrets, ARNs or account ids at any path; every " +
  "provider-assigned value is discovered by the driver and recorded as resolved state; provider " +
  "strings live only inside a cloud entry.";

/** The text this call would ADD. A Write carries `content`, an Edit carries `new_string`. */
export const written = (input: ToolInput): string =>
  (input as { content?: string; new_string?: string }).content
  ?? (input as { content?: string; new_string?: string }).new_string
  ?? "";

type Rule = {
  name: string;
  /** What this rule could possibly have an opinion about, from the path alone. */
  applies: (path: string) => boolean;
  run: (path: string, text: string) => Verdict;
};

// A region literal and an instance class are legitimate INSIDE the two homes the declaration
// sanctions — a cloud entry's `region` mapping, and a profile's capacity keys. Both are blanked
// before the manifest is searched, so what remains is a provider string with no home.
const SANCTIONED = [
  /"region"\s*:\s*"[a-z0-9-]+"/g,
  /"(database|cache|queue|compute)"\s*:\s*"[^"]*"/g,
];
const REGION = /\b(af|ap|ca|cn|eu|il|me|sa|us|usgov)-(central|north|south|east|west|northeast|northwest|southeast|southwest)-[0-9]\b/;
const INSTANCE_CLASS = /"(db|cache|kafka)\.[a-z0-9]+\.[a-z0-9]+"/;

export const RULES: Rule[] = [
  {
    // `dist/` is staged whole by `spnutils infra release` and published as-is, so an edit there is
    // overwritten by the next build. This one reads the PATH alone and needs no text.
    name: "dist-is-build-output",
    applies: (path) => path.includes("/dist/"),
    run: (path) => ({
      deny: `Denied: ${path} is under dist/ — the artifact is staged by the build (spinfrapkg.json + src/**, whole) and published as-is. Edit the source under src/ and rebuild; never hand-edit dist/.`,
    }),
  },
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
  {
    // Only where a KEY names it. A bare twelve-digit number is left alone, because twelve digits is
    // also a phone number, an id and a timestamp.
    name: "pinned-account-id",
    applies: () => true,
    run: (_path, text) => /(account[_-]?id|accountid)["']?\s*[:=]\s*["']?[0-9]{12}\b/i.test(text)
      ? { deny: `Denied: the text being written pins a 12-digit account id. Accounts are discovered by the tool holding the credential and recorded as resolved state. ${LAWS}` } : null,
  },
  {
    name: "provider-string-outside-cloud",
    applies: (path) => path.endsWith("spestate.json"),
    run: (path, text) => {
      const scrubbed = SANCTIONED.reduce((t, pattern) => t.replace(pattern, ""), text);
      if (REGION.test(scrubbed))
        return { deny: `Denied: a provider region string appears in ${path} outside a cloud entry's "region" mapping — the only place a provider region is spelled. ${LAWS}` };
      if (INSTANCE_CLASS.test(scrubbed))
        return { deny: `Denied: a provider instance class appears in ${path} outside a profile's capacity keys (database/cache/queue/compute) — provider strings live only inside a cloud entry. ${LAWS}` };
      return null;
    },
  },
];
