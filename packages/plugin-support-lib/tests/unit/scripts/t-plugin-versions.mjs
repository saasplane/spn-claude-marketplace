// The shared reader under `scripts/lib/plugin-versions.mjs` — what the release command and the
// plugins' own tests both use to say the four plugins carry one version (RULE.DEVEX.AGENT.110).
import { fileURLToPath } from "node:url";
import { compareVersions, agreedVersion, newestReleaseNumber, readVersions, releaseTags, versionIn, withVersion }
  from "../../../../../scripts/lib/plugin-versions.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const refusal = (fn) => { try { fn(); return null; } catch (error) { return error.message; } };

console.log("=== four manifests that disagree are refused, by name");
{
  const said = refusal(() => agreedVersion([
    { name: "spn-devex", version: "0.75.0" }, { name: "spn-apps", version: "0.67.0" },
    { name: "spn-infra", version: "0.59.0" }, { name: "spn-surface", version: "0.3.0" },
  ]));
  ok("refused", said !== null);
  ok("names each plugin and its number", said?.includes("spn-apps 0.67.0") && said?.includes("spn-surface 0.3.0"), said);
  const one = refusal(() => agreedVersion([
    { name: "spn-devex", version: "0.76.0" }, { name: "spn-apps", version: "0.76.0" },
    { name: "spn-infra", version: "0.76.0" }, { name: "spn-surface", version: "0.75.0" },
  ]));
  ok("one plugin off by one is refused", one !== null);
  ok("four that agree give the version", agreedVersion([
    { name: "spn-devex", version: "0.76.0" }, { name: "spn-apps", version: "0.76.0" },
    { name: "spn-infra", version: "0.76.0" }, { name: "spn-surface", version: "0.76.0" },
  ]) === "0.76.0");
}

console.log("\n=== the version field is written in place, every other byte kept");
{
  const text = '{\n  "name": "spn-devex",\n  "version": "0.75.0",\n  "description": "core \\u2014 agnostic"\n}\n';
  const written = withVersion(text, "0.76.0");
  ok("the version moves", versionIn(written) === "0.76.0");
  ok("the escapes and layout stay", written === text.replace("0.75.0", "0.76.0"), written);
  ok("a manifest with no version is refused", refusal(() => withVersion('{ "name": "x" }', "1.0.0")) !== null);
}

console.log("\n=== the newest release is read by number, from v-tags only");
{
  const lines = [
    "aaa\trefs/tags/v0.9.0", "bbb\trefs/tags/v0.9.0^{}", "ccc\trefs/tags/v0.10.0",
    "ddd\trefs/tags/v0.10.0^{}", "eee\trefs/tags/spn-devex--v0.75.0", "fff\trefs/tags/vnext",
  ].join("\n");
  ok("0.10.0 is above 0.9.0", newestReleaseNumber(lines) === "0.10.0", newestReleaseNumber(lines));
  ok("no tags read as none", newestReleaseNumber("") === null);
  ok("numeric order", compareVersions("0.10.0", "0.9.9") > 0 && compareVersions("1.0.0", "1.0.0") === 0);
}

console.log("\n=== the five tags and their messages");
{
  const tags = releaseTags(["spn-devex", "spn-apps", "spn-infra", "spn-surface"].map((name) => ({ name })), "0.76.0");
  ok("five tags", tags.length === 5);
  ok("the marketplace tag names each plugin", tags[0].name === "v0.76.0"
    && tags[0].message === "SaaS Plane marketplace 0.76.0: spn-devex 0.76.0, spn-apps 0.76.0, spn-infra 0.76.0, spn-surface 0.76.0", tags[0].message);
  ok("one tag per plugin", tags[1].name === "spn-devex--v0.76.0" && tags[1].message === "spn-devex 0.76.0");
}

console.log("\n=== this repository's own four plugins carry one version");
{
  const root = fileURLToPath(new URL("../../../../../", import.meta.url));
  const plugins = readVersions(root);
  ok("four plugins are listed", plugins.length === 4, plugins.map((plugin) => plugin.name).join(", "));
  const said = refusal(() => agreedVersion(plugins));
  ok("their versions agree", said === null, said);
}

console.log(`\n${failed ? `${failed} of ${total} FAILED` : `all ${total} passed`}`);
process.exit(failed ? 1 : 0);
