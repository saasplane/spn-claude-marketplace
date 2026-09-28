#!/usr/bin/env node
// This tool moved to `commands/docs/prose.ts`, dispatched by `cli.ts`. The file stays here, thin, so
// every caller that still names `tools/prose-triage.ts` keeps working unchanged until the path
// sweep (`N101` step 6) deletes it.
//
//     node prose-triage.ts [path ...] [--comments] [--paragraphs <path>] [--ledger=<file>] [--record=<file>]

import { basename } from "node:path";
import { main as cli } from "../cli.ts";

if (process.argv[1] && basename(process.argv[1]) === "prose-triage.ts")
  process.exit(await cli(["docs", "prose", ...process.argv.slice(2)]));
