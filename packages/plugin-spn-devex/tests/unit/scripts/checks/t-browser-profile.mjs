// `checks/browser-profile.ts` — a Chrome or Playwright launch that names the developer's own Chrome profile is
// refused, and told to look at pages through `spn-devex docs look`, on the tool's own profile.
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { checkBrowserProfile } = await import(join(CHECKS, "browser-profile.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const bash = (command) => ({ tool_name: "Bash", tool_input: { command } });

console.log("=== the developer's own profile is refused");
{
  const library = checkBrowserProfile(bash(`open -na "Google Chrome" --args --user-data-dir="$HOME/Library/Application Support/Google/Chrome"`));
  ok("[MKT.HOOKS.127] a launch naming the Chrome library folder is refused, naming docs look", library?.deny?.includes("spn-devex docs look") === true, JSON.stringify(library));
  const directory = checkBrowserProfile(bash(`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --profile-directory="Profile 1" https://x`));
  ok("[MKT.HOOKS.127] a launch naming --profile-directory is refused", directory?.deny?.includes("spn-devex docs look") === true, JSON.stringify(directory));
  const playwright = checkBrowserProfile(bash(`node -e "chromium.launchPersistentContext('/Users/a/Library/Application Support/Google/Chrome')" # playwright`));
  ok("[MKT.HOOKS.127] a Playwright launch on that folder is refused", playwright?.deny !== undefined, JSON.stringify(playwright));
}

console.log("\n=== the tool's own profile passes");
{
  ok("[MKT.HOOKS.127] spn-devex docs look passes", checkBrowserProfile(bash("spn-devex docs look page.html")) === null);
  ok("[MKT.HOOKS.127] a Chrome launch on a throwaway profile passes", checkBrowserProfile(bash(`open -na "Google Chrome" --args --user-data-dir=/tmp/look-profile`)) === null);
  ok("[MKT.HOOKS.127] a command that is no browser launch passes", checkBrowserProfile(bash("ls ~/Library/Application\\ Support/Google/Chrome")) === null);
  ok("[MKT.HOOKS.127] a non-Bash call passes", checkBrowserProfile({ tool_name: "Read", tool_input: { command: "chrome --profile-directory=x" } }) === null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — browser profile` : `\n  all ${total} passed — browser profile`);
process.exit(failed ? 1 : 0);
