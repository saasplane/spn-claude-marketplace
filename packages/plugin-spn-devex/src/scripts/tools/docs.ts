#!/usr/bin/env node
// This tool moved to `commands/docs/*.ts`, dispatched by `cli.ts`. The file stays here, thin, so
// every caller that still names `tools/docs.ts` keeps working unchanged until the path sweep
// (`N101` step 6) deletes it. `figures check|colour` is now the `figure` action.
//
//     node docs.ts audit|face|page|status|topics|coverage <args…>
//     node docs.ts figures check|colour <args…>

import { basename } from "node:path";
import { main as cli } from "../cli.ts";

if (process.argv[1] && basename(process.argv[1]) === "docs.ts") {
  const argv = process.argv.slice(2);
  const [action, ...rest] = argv;
  process.exit(await cli(["docs", ...(action === "figures" ? ["figure", ...rest] : argv)]));
}
