// The layouts a sample stands in: a site's DSLayout (TOPNAV with the brand's wide logo, RAIL, CANVAS) around a DSSiteLayout, and an app's
// layouts (RAIL, TOPNAV, DOCK, CANVAS) around its page. A layout holds a page's entries, and the entries are what a note counts.
import { U, slot, txt } from "./kit.ts";
import { brandOrg, orgNamed, wideOf } from "./media.ts";
import type { Brief } from "./words.ts";
import type { Tree } from "./types.ts";

export function siteLayout(b: Brief, kind: string, children: Tree[], selected?: string): Tree {
  const config: Tree = { mtype: kind, body: { width: "XWIDE" } };
  if (kind === "TOPNAV" || kind === "RAIL") {
    config.nav = b.nav.map(([label, key]) => ({ type: "ITEM", key, label, anchor: { href: `#${key}` }, ...(key === selected ? { selected: true } : {}) }));
    config.startNode = wideOf(orgNamed(b.org) ?? brandOrg(), 40) ?? slot(`${b.org} wide logo`, "4:1");
  }
  if (kind === "RAIL") { config.collapsible = false; config.defaultOpen = true; }
  return U("DSLayout", { size: "SM", config }, [U("DSSiteLayout", {}, children)]);
}

export type AppWords = { org: string; nav: Array<[string, string, string]>; dock: Array<[string, string, string]>; selected: string };
const navOf = (items: Array<[string, string, string]>, selected: string): Tree[] =>
  items.map(([key, label, icon]) => ({ type: "ITEM", key, label, startIcon: icon, anchor: { href: `#${key}` }, ...(key === selected ? { selected: true } : {}) }));

export function appLayout(w: AppWords, kind: string, children: Tree[]): Tree {
  let config: Tree;
  if (kind === "RAIL") config = { mtype: "RAIL", collapsible: true, defaultOpen: false, nav: navOf(w.nav, w.selected) };
  else if (kind === "TOPNAV") config = { mtype: "TOPNAV", nav: navOf(w.nav, w.selected), startNode: txt(w.org, "TITLE_LG") };
  else if (kind === "DOCK") config = { mtype: "DOCK", barWidth: "MEDIUM", backTo: { label: `Back to ${w.org}`, anchor: { href: "#back" } }, nav: navOf(w.dock, w.dock[0][0]) };
  else config = { mtype: "CANVAS", footer: { node: txt(`${w.org} · sample product`, "CONTENT_XS", { tone: "MUTED" }) } };
  return U("DSLayout", { config }, children);
}
