#!/usr/bin/env node
// This tool moved to `commands/plugin/partner.ts`, dispatched by `cli.ts`. The file stays here, thin,
// so every caller that still names `tools/partner-shape.ts` keeps working unchanged until the path
// sweep (`N101` step 6) deletes it.
//
//     node partner-shape.ts [--keep]

import { basename } from "node:path";
import { main as cli } from "../cli.ts";

if (process.argv[1] && basename(process.argv[1]) === "partner-shape.ts")
  process.exit(await cli(["plugin", "partner", ...process.argv.slice(2)]));
