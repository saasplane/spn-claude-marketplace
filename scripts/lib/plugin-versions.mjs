// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md § What
// names a plugin, and what a version means, and § The place you are standing decides the install
// mode (RD.DEVEX.AGENT.110). The chapter is the source of truth; a rule change is edited there
// first, then here, in the same change.
//
// What the release command and the plugins' own tests both read: where the four manifests are, the
// one version they carry, and the newest `vX.Y.Z` release tag. One implementation, so the command
// that writes a version and the test that refuses four that disagree can never disagree themselves.

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** `X.Y.Z`, numbers only, no leading zero — the shape of a plugin version and of a release tag's number. */
export const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** The field a manifest's version sits in, matched in place so the rest of the file keeps its bytes. */
const VERSION_FIELD = /("version"\s*:\s*")([^"]*)(")/g;

/** The order the plugins are named in a release tag's message — the order they joined the marketplace. */
const MESSAGE_ORDER = ["spn-devex", "spn-apps", "spn-infra", "spn-surface"];

/**
 * Every plugin the listing names, with its manifest's path. Read from
 * `.claude-plugin/marketplace.json`, never typed, so a plugin added to the listing is released with
 * the rest the moment it is listed.
 *
 * @param root the marketplace checkout
 * @returns [{ name, manifest }] — `manifest` relative to `root`, in release-message order
 */
export function listedPlugins(root) {
  const listing = JSON.parse(readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8"));
  const plugins = (listing.plugins ?? []).map((plugin) => ({
    name: plugin.name,
    manifest: join(plugin.source.replace(/^\.\//, ""), ".claude-plugin", "plugin.json"),
  }));
  const rank = (name) => (MESSAGE_ORDER.includes(name) ? MESSAGE_ORDER.indexOf(name) : MESSAGE_ORDER.length);
  return plugins.sort((a, b) => rank(a.name) - rank(b.name));
}

/** The version a manifest's text carries; refuses a manifest with no version field, or more than one. */
export function versionIn(text, label = "manifest") {
  const found = [...text.matchAll(VERSION_FIELD)];
  if (found.length !== 1) throw new Error(`${label} carries ${found.length} "version" fields, and one is expected`);
  return found[0][2];
}

/** The manifest's text with its version replaced — the field only, every other byte kept. */
export function withVersion(text, version, label = "manifest") {
  versionIn(text, label);
  return text.replace(VERSION_FIELD, (_, open, _old, close) => `${open}${version}${close}`);
}

/**
 * The one version every plugin carries, or a refusal naming each plugin and its number.
 *
 * @param entries [{ name, version }]
 */
export function agreedVersion(entries) {
  const versions = new Set(entries.map((entry) => entry.version));
  if (entries.length > 0 && versions.size === 1) return entries[0].version;
  const each = entries.map((entry) => `${entry.name} ${entry.version}`).join(", ");
  throw new Error(`the plugins carry versions that disagree: ${each} — the four are released at one version`);
}

/** Every listed plugin's version, read from its manifest under `root`. */
export function readVersions(root) {
  return listedPlugins(root).map((plugin) => ({
    ...plugin,
    version: versionIn(readFileSync(join(root, plugin.manifest), "utf8"), plugin.manifest),
  }));
}

/** Numeric comparison of two `X.Y.Z` strings — `0.10.0` is above `0.9.0`. */
export function compareVersions(a, b) {
  const [pa, pb] = [a, b].map((v) => v.split(".").map(Number));
  for (let i = 0; i < 3; i += 1) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

/**
 * The newest release number among `git ls-remote --tags` output lines, read by number as Support
 * reads it; `null` when there is none. Only `refs/tags/vX.Y.Z` counts, so a plugin's own tag
 * (`<plugin>--v<version>`) and a peeled `^{}` line are ignored.
 */
export function newestReleaseNumber(lsRemoteOutput) {
  const numbers = lsRemoteOutput
    .split("\n")
    .map((line) => /\srefs\/tags\/v(\S+)$/.exec(line.trim())?.[1])
    .filter((number) => number && VERSION_PATTERN.test(number));
  return numbers.sort(compareVersions).at(-1) ?? null;
}

/** The five tags a release cuts, each with its annotation's message. */
export function releaseTags(plugins, version) {
  const each = plugins.map((plugin) => `${plugin.name} ${version}`).join(", ");
  return [
    { name: `v${version}`, message: `SaaS Plane marketplace ${version}: ${each}` },
    ...plugins.map((plugin) => ({ name: `${plugin.name}--v${version}`, message: `${plugin.name} ${version}` })),
  ];
}
