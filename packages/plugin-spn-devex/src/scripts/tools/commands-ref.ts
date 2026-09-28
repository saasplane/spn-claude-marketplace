#!/usr/bin/env node
// This tool moved to `commands/restates/commands.ts`, dispatched by `cli.ts`. The file stays here,
// thin, so every caller that still names `tools/commands-ref.ts` keeps working unchanged until the
// path sweep (`N101` step 6) deletes it.
//
//     node commands-ref.ts [--write]

import { basename } from "node:path";
import { main as cli } from "../cli.ts";

if (process.argv[1] && basename(process.argv[1]) === "commands-ref.ts")
  process.exit(await cli(["restates", "commands", ...process.argv.slice(2)]));
