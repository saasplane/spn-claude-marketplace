#!/usr/bin/env node
// This tool moved to `commands/docs/coherence.ts`, dispatched by `cli.ts`. The file stays here, thin,
// so every caller that still names `tools/coherence.ts` keeps working unchanged until the path sweep
// (`N101` step 6) deletes it.
//
//     node coherence.ts [path]

import { basename } from "node:path";
import { main as cli } from "../cli.ts";

if (process.argv[1] && basename(process.argv[1]) === "coherence.ts")
  process.exit(await cli(["docs", "coherence", ...process.argv.slice(2)]));
