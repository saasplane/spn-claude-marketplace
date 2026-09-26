#!/usr/bin/env node
// RESTATES: `spn-infra/src/refs/support/infra/README.md` § every provider-assigned value is discovered. The ref governs.
//
// Refuse a pinned account id at the moment it is written.
//
// **AN ACCOUNT IS DISCOVERED BY THE TOOL HOLDING THE CREDENTIAL**, and recorded as resolved state.
// An account id typed into a file is a value that will be wrong for the next estate and cannot be
// re-derived — which is the whole reason the driver discovers it.
//
// **ONLY WHERE A KEY NAMES IT.** A bare twelve-digit number is left alone, because twelve digits is
// also a phone number, an id and a timestamp. Refusing those would be the false refusal the
// conservative rule exists to avoid.
import type { Rule } from "../laws.ts";
import { LAWS } from "../laws.ts";

export const RULES: Rule[] = [
  {
    name: "pinned-account-id",
    applies: () => true,
    run: (_path, text) => /(account[_-]?id|accountid)["']?\s*[:=]\s*["']?[0-9]{12}\b/i.test(text)
      ? { deny: `Denied: the text being written pins a 12-digit account id. Accounts are discovered by the tool holding the credential and recorded as resolved state. ${LAWS}` } : null,
  },
];
