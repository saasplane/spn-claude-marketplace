#!/usr/bin/env node
// This tool moved to `commands/docs/figure.ts`, dispatched by `cli.ts`. The file stays here, thin,
// so every caller that still names `tools/figure-render.ts` keeps working unchanged until the path
// sweep (`N101` step 6) deletes it.
//
//     node figure-render.ts <svg-or-html> [...]

import { basename } from "node:path";
import { main as cli } from "../cli.ts";

if (process.argv[1] && basename(process.argv[1]) === "figure-render.ts")
  process.exit(await cli(["docs", "figure", ...process.argv.slice(2).filter((a) => !a.startsWith("-"))]));
