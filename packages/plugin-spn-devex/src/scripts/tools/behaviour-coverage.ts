#!/usr/bin/env node
// This tool moved to `commands/behaviours/coverage.ts`, dispatched by `cli.ts`. The file stays here,
// thin, so every caller that still names `tools/behaviour-coverage.ts` keeps working unchanged until
// the path sweep (`N101` step 6) deletes it.
//
//     node behaviour-coverage.ts [--json] [root]

import { basename } from "node:path";
import { main as cli } from "../cli.ts";

if (process.argv[1] && basename(process.argv[1]) === "behaviour-coverage.ts")
  process.exit(await cli(["behaviours", "coverage", ...process.argv.slice(2)]));
