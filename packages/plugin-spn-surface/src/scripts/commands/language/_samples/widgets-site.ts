// The widget recipes of the site categories. A widget is never drawn alone at full width: each stands in a real section that uses it, so a reader
// sees its size and its neighbours as a visitor does.
import { quote as quoteCard, U, act, badge, btn, col, eyebrow, feat, fitem, grid, item, lines, link, muted, row, sec, slot, table, txt, vl } from "./kit.ts";
import { personCard } from "./site.ts";
import type { Brief } from "./site-words.ts";
import type { Tree } from "./types.ts";

const h2 = (t: string): Tree => txt(t, "HEADING_SM");
const para = (t: string): Tree => txt(t, "CONTENT_MD");
const head = (title: string, description: string): Tree => feat({ textAlign: "START", title, description });
const rec = (b: Brief, at: number): [string, string, string] => b.records[at % b.records.length];

function recordCard(b: Brief, at: number, form: string): Tree {
  const [t, d, f] = rec(b, at);
  if (form === "LIST_ROW") return item(t, d, "CONTAINER", row([txt(f, "TITLE_MD"), btn("Open", undefined, "OUTLINE")], "MD"), { media: { slot: `cover-${at}`, label: `Cover of ${t}`, ratio: "4:3" }, facts: ["4.8 (2,310)"] });
  if (form === "SIDE_LIST") return item(t, f, "WIDGET", undefined, { media: { slot: `thumb-${at}`, label: `Thumbnail of ${t}`, ratio: "1:1" } });
  return U("DSCardWidget", { parts: [{ mtype: "MEDIA", key: "cover", node: slot(`Cover of ${t}`, "4:3") }, { mtype: "FREE", key: "body", node: col([U("DSItem", { pageLevel: "WIDGET", title: t, description: d, facts: ["4.8 (2,310)", f] }), row([badge("Bestseller", "PRIMARY", "SOLID"), U("DSToggle", { label: "Keep it", valueLink: vl(false) })], "SM")], "SM") }] });
}

export function siteWidget(code: string, c: string, b: Brief): Tree | null {
  switch (code) {
    case "DS_CARD_WIDGET": {
      const card = (t: string, d: string, icon: string, rows: string[][]): Tree => U("DSCardWidget", { header: { title: t, description: d, media: { mtype: "MARK", icon } }, surface: { raised: true, elevation: "MD" }, parts: [{ mtype: "ITEMS", key: "i", items: rows.map(([a, x], j) => ({ key: `a${j}`, title: a, description: x })) }], footer: link("Open the page", "#page") });
      return sec([head("Start with a card", "Four first jobs, each its own card."), grid([card(b.doors[0][1], b.doors[0][2], b.doors[0][3], [["You need", "An owner account"], ["You get", "A member with a role"]]), card(b.doors[1][1], b.doors[1][2], b.doors[1][3], [["You need", "An email address"], ["You get", "An invite, sent"]]), card(b.doors[2][1], b.doors[2][2], b.doors[2][3], [["You need", "An identity provider"], ["You get", "One sign-in for every app"]])], 3, 2, 1)]);
    }
    case "CALLOUT": {
      const al = (color: string, t: string, d: string): Tree => U("DSAlert", { color, text: t, description: d });
      return sec([col([h2("Before you remove a member"), para("A member holds a role in every app, so removing one person reaches all of them."), al("INFO", "A role carries a set of permissions.", "Never one permission alone."), para("The last owner of an organization cannot be removed until another member holds the role."), al("WARNING", "Removing the last owner is not allowed.", "Give the role to someone else first."), al("SUCCESS", "The role is in force.", "Every app reads it on the next page.")])]);
    }
    case "CODE_TABS": {
      const tabs = U("DSTabs", { options: ["Node", "Python", "curl"].map((l) => ({ key: l.toLowerCase(), label: l })), defaultActiveKey: "node" });
      return sec([feat({ type: "SPLIT_END", verticalAlign: "TOP", title: "Assign a role", description: "Each step carries its code, in the language you work in.", items: lines(b.steps.slice(0, 3).map((s) => ({ key: s[0], title: s[1], description: s[2] })), true), mediaNode: col([tabs, U("DSCodeBlockView", { filename: b.code.file, language: b.code.language, showLineNumbers: true, bordered: true, showCopy: true, code: b.code.text })], "SM") })]);
    }
    case "PLAN_CARD": {
      const card = (p: Brief["plans"][number]): Tree => U("DSCardWidget", { header: { title: p.name, description: p.line }, surface: { raised: !!p.recommended, elevation: "MD" }, parts: [{ mtype: "FREE", key: "price", node: row([U("DSFormatCurrency", { value: p.price, currencyCode: "USD" }), muted("a month")], "SM") }, { mtype: "ITEMS", key: "feats", items: p.feats.map((f, i) => ({ key: `f${i}`, title: f })) }, { mtype: "FREE", key: "cta", node: row([btn(`Choose ${p.name}`, p.recommended ? "PRIMARY" : undefined, p.recommended ? "SOLID" : "OUTLINE"), ...(p.recommended ? [badge("Recommended", "PRIMARY", "SOLID")] : [])], "SM") }] });
      return sec([head("Which plan is yours?", "Prices are per month, billed yearly."), grid(b.plans.map(card), 3, 2, 1)]);
    }
    case "PERSON_CARD":
      if (c === "LIST_ROW") return sec([head("The people behind it", "Each a person you can write to."), U("DSList", { divided: true }, b.people.slice(0, 4).map(([n, r]) => U("DSList.Item", { content: item(n, r, "CONTAINER", btn("Write", undefined, "OUTLINE"), { media: { mtype: "AVATAR", title: n } }) })))]);
      return sec([head("The people behind it", "Thirty-eight people across three time zones."), grid(b.people.slice(0, 4).map(([n, r]) => personCard(n, r)), 4, 3, 2)]);
    case "QUOTE_CARD": {
      const quote = (at: number): Tree => quoteCard(b.quotes[at][0], b.quotes[at][1], b.quotes[at][2], true);
      if (c === "SLIDE") return sec([head("What teams say", "One quote at a time."), quote(0)]);
      return sec([head("What teams say", "Three teams, in their own words."), grid([quote(0), quote(1), quote(2)], 3, 1, 1)]);
    }
    case "ON_THIS_PAGE": {
      const sections = [["Before you start", "before"], ["Steps", "steps"], ["Check it worked", "check"], ["Where next", "next"]];
      if (c === "AS_PILLS") return sec([row(sections.map(([l, k]) => btn(l, k === "steps" ? "PRIMARY" : undefined, k === "steps" ? "SOLID" : "OUTLINE")), "SM"), h2("Steps"), para("Open the member list, pick the member, add the role by name, and check it in an app.")]);
      const nav = U("DSNavList", { nodes: sections.map(([l, k]) => ({ type: "ITEM", key: k, label: l, anchor: { href: `#${k}` }, ...(k === "steps" ? { selected: true } : {}) })) });
      return sec([grid([col([txt("On this page", "TITLE_MD", { tone: "MUTED" }), nav]), col([h2("Before you start"), para("You need an owner account and one member to give the role to."), h2("Steps"), para("Open the member list, pick the member, add the role by name, and check it in an app.")])], 2, 1, 1)]);
    }
    case "YOUR_DETAILS": {
      const field = (label: string, ctl: Tree): Tree => U("DSForm.Field", { label, validators: [], attributeLink: vl((ctl.props.valueLink as Tree).value ?? "") }, [ctl]);
      const input = (v: string): Tree => U("DSInput", { valueLink: vl(v) });
      const fields = c === "EMAIL_ONLY" ? [field("Work email", input("dana@northwind.example"))] : c === "WITH_A_MESSAGE" ? [field("Name", input("Dana Lee")), field("Work email", input("dana@northwind.example")), field("Message", U("DSTextarea", { valueLink: vl("We run nine apps and want one sign-in."), rows: 4 })), U("DSCheckbox", { label: "I agree to be written to about this request", valueLink: vl(true) })] : [field("Name", input("Dana Lee")), field("Work email", input("dana@northwind.example")), field("Company", input("Northwind"))];
      return sec([feat({ title: "Tell us who you are", description: "A few details, and nothing you do not need to give." }), U("DSForm", { size: "MD" }, [col([...fields, U("DSButton", { label: "Send", color: "PRIMARY", variant: "SOLID", anchor: { href: "#send" } })])])]);
    }
    case "RECORD_CARD": {
      if (c === "LIST_ROW") return sec([head("Everything written", "Newest first."), U("DSList", { divided: true }, [0, 1, 2].map((i) => U("DSList.Item", { content: recordCard(b, i, c) })))]);
      if (c === "SIDE_LIST") return sec([grid([col([h2("Details of the listing"), para("What it is, what it needs and what it works with, as the page above says.")]), col([txt("More from this seller", "TITLE_MD"), ...[1, 2, 3].map((i) => recordCard(b, i, c))], "SM")], 2, 1, 1)]);
      if (c === "SLIDE") return sec([head("Popular this month", "A few listings, one row."), row([0, 1, 2].map((i) => recordCard(b, i, "GRID_CELL")), "MD")]);
      return sec([head("Everything written", "Newest first."), grid([0, 1, 2].map((i) => recordCard(b, i, c)), 3, 2, 1)]);
    }
    case "COMPARE_TRAY": {
      const picks = [0, 1].map((i) => item(rec(b, i)[0], null, "WIDGET", btn(null, undefined, "GHOST", "X", `Take ${rec(b, i)[0]} off`), { media: { slot: `pick-${i}`, label: `Picture of ${rec(b, i)[0]}`, ratio: "1:1" } }));
      return sec([head("Compare listings", "Pick up to three, then compare."), grid([0, 1, 2].map((i) => recordCard(b, i, "GRID_CELL")), 3, 2, 1), U("DSSticky", { position: "BOTTOM" }, [U("DSCard", {}, [U("DSCard.Content", {}, [row([...picks, btn("Compare 2", "PRIMARY", "SOLID")], "LG")])])])]);
    }
    case "ACTION_PANEL": return sec([grid([col([h2(rec(b, 0)[0]), para(rec(b, 0)[1])]), U("DSCardWidget", { header: { title: rec(b, 0)[2], description: "Taxes included" }, parts: [{ mtype: "FREE", key: "check", node: col([U("DSDateRangePicker", { valueLink: vl({ start: null, end: null }) }), U("DSRadioGroup", { options: [{ key: "solo", label: "Solo, 1 seat" }, { key: "team", label: "Team, 10 seats" }], valueLink: vl("team") })], "SM") }, { mtype: "FREE", key: "cta", node: col([btn("Buy now", "PRIMARY", "SOLID"), muted("Refund in 14 days", "CONTENT_XS")], "XS") }] })], 2, 1, 1)]);
    case "OWNER_CARD": return sec([head("Sold by", "Every seller is verified."), grid([U("DSCardWidget", { parts: [{ mtype: "FREE", key: "o", node: col([U("DSItem", { pageLevel: "WIDGET", title: "Kite Studio", description: "Pune, India", media: { mtype: "AVATAR", title: "Kite Studio" }, facts: ["4.9 across 312 reviews", "14 listings"] }), btn("See the seller", undefined, "OUTLINE")], "SM") }] })], 3, 2, 1)]);
    case "LINK_GROUP": {
      const group = (g: Brief["groups"][number]): Tree => feat({ title: g[1], contentNode: U("DSList", { size: "SM", flush: true }, [...g[2], `View all ${g[2].length + 6}`].map((p) => U("DSList.Item", { content: link(p, `#${p.toLowerCase().replace(/ /g, "-")}`) }))) }, "WIDGET");
      if (c === "SIDE_LIST") return sec([grid([U("DSNavList", { nodes: b.groups.map((g, i) => ({ type: "ITEM", key: g[0], label: g[1], anchor: { href: `#${g[0]}` }, ...(i === 0 ? { selected: true } : {}) })) }), col([h2(b.groups[0][1]), para("The topics of the open group stand here, one a row.")])], 2, 1, 1)]);
      return sec([head("Browse by group", "Each group holds its first topics."), grid(b.groups.slice(0, 3).map(group), 3, 2, 1)]);
    }
    case "PARAMETERS": return sec([col([txt("members.addRole", "HEADING_SM"), para("Gives a member a role in one organization. It returns the member with the roles they now hold."), h2("Parameters"), table(["Name", "Type", "Required", "What it does"], [["member", "string", "Yes", "The email of the member."], ["role", "string", "Yes", "The role to give, by name."], ["expires", "date", "No", "When the role ends. Left out, it does not."]]), h2("Returns"), para("The member, with their roles.")])]);
    case "FEEDBACK": return sec([col([h2("Check it worked"), para("Sign in as that member and open the app. The screens the role allows are the ones that show."), txt("Did this answer it?", "TITLE_MD"), U("DSButtonGroup", {}, [btn("Yes", undefined, "OUTLINE", "CHECK"), btn("No", undefined, "OUTLINE")]), U("DSTextarea", { placeholder: "What was missing?", rows: 3, valueLink: vl("") })])]);
    case "RELEASE_ENTRY": return sec([feat({ eyebrow: badge("2.4.0", "PRIMARY", "SOLID"), title: "Roles can end on a date", description: "Added 3 November 2026", contentNode: U("DSList", {}, ["Added: an end date on a role grant.", "Changed: the members list shows when a role ends.", "Fixed: a role given twice no longer shows twice."].map((t) => U("DSList.Item", { content: t }))) }), feat({ eyebrow: badge("2.3.2", "DEFAULT", "OUTLINE"), title: "A fix for invites", description: "Added 21 October 2026", contentNode: U("DSList", {}, [U("DSList.Item", { content: "Fixed: an invite sent twice no longer makes two members." })]) })]);
    default: return null;
  }
}
export { act, eyebrow, fitem };
