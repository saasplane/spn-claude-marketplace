#!/usr/bin/env node
// Plugins reach a window one way (RULE.DEVEX.AGENT.034): `spnutils workspace agent-sync` installs what the workspace's
// repositories imply and refreshes what has drifted, then says what it did. A raw `claude plugin install`, `update`
// or `marketplace update` skips that reading, so it is refused and the agent is told to run agent-sync in this window.
//
//   called by: events/pretooluse.ts, before a Bash call

import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

const RAW = /(?:^|[\s;&|(])claude\s+plugins?\s+(?:install|update|marketplace\s+update)\b/;

export function checkPluginSync(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command || !RAW.test(command)) return null;
  return { deny:
    "Plugins are installed by `spnutils workspace agent-sync`, in this window. Run it and read its plugin actions, " +
    "in place of a raw `claude plugin` install or update (RULE.DEVEX.AGENT.034)." };
}

if (runAlone("plugin-sync.ts")) {
  try { emit(checkPluginSync(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
