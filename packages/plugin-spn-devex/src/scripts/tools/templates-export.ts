#!/usr/bin/env node
// This tool moved to `commands/restates/files.ts`, dispatched by `cli.ts`. The file stays here, thin,
// so every caller that still names `tools/templates-export.ts` keeps working unchanged until the
// path sweep (`N101` step 6) deletes it.
//
//     node templates-export.ts <book> [--write]

import { basename } from "node:path";
import { main as cli } from "../cli.ts";

if (process.argv[1] && basename(process.argv[1]) === "templates-export.ts")
  process.exit(await cli(["restates", "files", ...process.argv.slice(2)]));
