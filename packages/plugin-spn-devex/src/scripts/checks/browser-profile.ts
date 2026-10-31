#!/usr/bin/env node
// Pages are looked at through `spn-devex docs look`, on the tool's own profile (RULE.DEVEX.UTILS.074). A Chrome or
// Playwright launch that names the developer's own Chrome profile, by its library folder or by `--profile-directory`,
// opens their sign-ins and tabs to a script, so it is refused and the agent is told to look the supported way.
//
//   called by: events/pretooluse.ts, before a Bash call

import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

const PROFILE = /Library\/Application Support\/Google\/Chrome|--profile-directory\b/;
const BROWSER = /chrome|chromium|playwright|puppeteer/i;
/** Programs that only read a folder: naming the profile there opens nothing. */
const READS = /^\s*(?:ls|cat|find|stat|du|head|grep|wc)\b/;

export function checkBrowserProfile(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command || READS.test(command) || !PROFILE.test(command) || !BROWSER.test(command)) return null;
  return { deny:
    "This opens your own Chrome profile. Look at pages through `spn-devex docs look`, on the tool's own profile " +
    "(RULE.DEVEX.UTILS.074)." };
}

if (runAlone("browser-profile.ts")) {
  try { emit(checkBrowserProfile(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
