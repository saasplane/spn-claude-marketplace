#!/usr/bin/env node
// This tool moved to `commands/behaviours/stamp.ts`, dispatched by `cli.ts`. The file stays here,
// thin, so every caller that still names `tools/behaviour-rows.ts` — a skill, a ref — keeps working
// unchanged until the path sweep (`N101` step 6) deletes it.
//
//     node behaviour-rows.ts [--write] [--reach repository] [--results <spn-tests.json> …] [root]

import { basename } from "node:path";
import { main as cli } from "../cli.ts";

if (process.argv[1] && basename(process.argv[1]) === "behaviour-rows.ts")
  process.exit(await cli(["behaviours", "stamp", ...process.argv.slice(2)]));
