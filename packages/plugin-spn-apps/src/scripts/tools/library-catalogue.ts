#!/usr/bin/env node
// Forwarder. The one implementation is `commands/library/catalogue.ts` now; this file exists only
// so a path written before that move still runs, with the same argv, output and exit code, until
// B3c-2's single path sweep deletes it (`N101` step 1b).
//
//     node library-catalogue.ts <workspace>            write the TS provider's 14-libraries.md
//     node library-catalogue.ts <workspace> --check    report what would change, write nothing
export { main } from "../commands/library/catalogue.ts";
import { run } from "../commands/library/catalogue.ts";

if (process.argv[1] && process.argv[1].endsWith("library-catalogue.ts")) {
  process.exit(run(process.argv.slice(2)));
}
