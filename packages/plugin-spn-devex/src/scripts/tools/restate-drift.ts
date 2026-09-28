#!/usr/bin/env node
// This tool moved to `commands/restates/check.ts`, dispatched by `cli.ts`. The file stays here, thin,
// so every caller that still names `tools/restate-drift.ts` — a skill, a ref, another plugin —
// keeps working unchanged until the path sweep (`N101` step 6) deletes it.
//
//     node restate-drift.ts [path/to/spn-foundation]

import { basename } from "node:path";
import { main as cli } from "../cli.ts";

if (process.argv[1] && basename(process.argv[1]) === "restate-drift.ts")
  process.exit(await cli(["restates", "check", ...process.argv.slice(2)]));
