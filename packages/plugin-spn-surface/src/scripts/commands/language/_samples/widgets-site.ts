// The widget recipes of the site categories. A widget is never drawn alone at full width: each stands in a real section that uses it, so a reader
// sees its size and its neighbours as a visitor does.
import { quote as quoteCard, U, act, badge, btn, col, eyebrow, feat, fitem, grid, item, lines, link, muted, row, sec, slot, table, txt, vl } from "./kit.ts";
import { commentCard, field as formField, form as formOf, highlight, input as formInput, personCard, questionCard } from "./site.ts";
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

export function siteWidget(kind: string, c: string, b: Brief): Tree | null {
  const code = kind === "CARD_LIST" && (c === "GRID_CELL" || c === "SIDE_LIST") ? "CARD_LIST_GROUP" : kind;
  switch (code) {
    case "CARD_LIST": {
      const card = (t: string, d: string, icon: string, rows: string[][]): Tree => U("DSCardWidget", { header: { title: t, description: d, media: { mtype: "MARK", icon } }, surface: { raised: true, elevation: "MD" }, parts: [{ mtype: "ITEMS", key: "i", items: rows.map(([a, x], j) => ({ key: `a${j}`, title: a, description: x })) }], footer: link("Open the page", "#page") });
      return sec([head("Start with a card", "Four first jobs an admin does in a new organization, each on its own card, with what you need and what you have when it is done."), grid([card(b.doors[0][1], b.doors[0][2], b.doors[0][3], [["You need", "An owner account"], ["You get", "A member with a role"]]), card(b.doors[1][1], b.doors[1][2], b.doors[1][3], [["You need", "An email address"], ["You get", "An invite, sent"]]), card(b.doors[2][1], b.doors[2][2], b.doors[2][3], [["You need", "An identity provider"], ["You get", "One sign-in for every app"]])], 3, 2, 1)]);
    }
    case "CARD_PLAN": {
      const card = (p: Brief["plans"][number]): Tree => U("DSCardWidget", { header: { title: p.name, description: p.line }, surface: { raised: !!p.recommended, elevation: "MD" }, parts: [{ mtype: "FREE", key: "price", node: row([U("DSFormatCurrency", { value: p.price, currencyCode: "USD" }), muted("a month")], "SM") }, { mtype: "ITEMS", key: "feats", items: p.feats.map((f, i) => ({ key: `f${i}`, title: f })) }, { mtype: "FREE", key: "cta", node: row([btn(`Choose ${p.name}`, p.recommended ? "PRIMARY" : undefined, p.recommended ? "SOLID" : "OUTLINE"), ...(p.recommended ? [badge("Recommended", "PRIMARY", "SOLID")] : [])], "SM") }] });
      return sec([head("Which plan is yours?", "Prices are per month, billed yearly, in dollars. Every plan keeps your members and roles, so you can move up any day without redoing them."), grid(b.plans.map(card), 3, 2, 1)]);
    }
    case "CARD_PERSON":
      if (c === "LIST_ROW") return sec([head("The people behind it", "Four people from the team, each with a role and an address you can write to, and each happy to answer a question about their part."), U("DSList", { divided: true }, b.people.slice(0, 4).map(([n, r]) => U("DSList.Item", { content: item(n, r, "CONTAINER", btn("Write", undefined, "OUTLINE"), { media: { mtype: "AVATAR", title: n } }) })))]);
      return sec([head("The people behind it", "Thirty-eight people across three time zones, building one foundation for every app a team opens, with a few of them shown here."), grid(b.people.slice(0, 4).map(([n, r]) => personCard(n, r)), 4, 3, 2)]);
    case "CARD_TESTIMONIAL": {
      const quote = (at: number): Tree => quoteCard(b.quotes[at][0], b.quotes[at][1], b.quotes[at][2], true);
      if (c === "SLIDE") return sec([head("What teams say", "One team at a time, in their own words, with the role of the person who said it and what changed for them in a quarter."), quote(0)]);
      return sec([head("What teams say", "Three teams that moved their apps onto one sign-in, in their own words, with the role of each person who spoke."), grid([quote(0), quote(1), quote(2)], 3, 1, 1)]);
    }
    case "CONTENT_OUTLINE": {
      const sections = [["Before you start", "before"], ["Steps", "steps"], ["Check it worked", "check"], ["Where next", "next"]];
      if (c === "AS_PILLS") return sec([row(sections.map(([l, k]) => btn(l, k === "steps" ? "PRIMARY" : undefined, k === "steps" ? "SOLID" : "OUTLINE")), "SM"), h2("Steps"), para("Open the member list, pick the member, add the role by name, and check it in an app.")]);
      const nav = U("DSNavList", { nodes: sections.map(([l, k]) => ({ type: "ITEM", key: k, label: l, anchor: { href: `#${k}` }, ...(k === "steps" ? { selected: true } : {}) })) });
      return sec([grid([col([txt("On this page", "TITLE_MD", { tone: "MUTED" }), nav]), col([h2("Before you start"), para("You need an owner account and one member to give the role to."), h2("Steps"), para("Open the member list, pick the member, add the role by name, and check it in an app.")])], 2, 1, 1)]);
    }
    case "FORM_DEFAULT": case "FORM_SUBSCRIBE": case "FORM_CONTACT": case "FORM_DEMO": case "FORM_WAITLIST": {
      const field = (label: string, ctl: Tree): Tree => U("DSForm.Field", { label, validators: [], attributeLink: vl((ctl.props.valueLink as Tree).value ?? "") }, [ctl]);
      const input = (v: string): Tree => U("DSInput", { valueLink: vl(v) });
      // each form is a case of the one the catalogue split it from: a subscribe form is the email-only one, a contact form the one with a message, a demo or a waitlist the one with a few fields
      const form = code === "FORM_SUBSCRIBE" ? "EMAIL_ONLY" : code === "FORM_CONTACT" ? "WITH_A_MESSAGE" : code === "FORM_DEMO" || code === "FORM_WAITLIST" ? "A_FEW_FIELDS" : c;
      const fields = form === "EMAIL_ONLY" ? [field("Work email", input("dana@northwind.example"))] : form === "WITH_A_MESSAGE" ? [field("Name", input("Dana Lee")), field("Work email", input("dana@northwind.example")), field("Message", U("DSTextarea", { valueLink: vl("We run nine apps and want one sign-in."), rows: 4 })), U("DSCheckbox", { label: "I agree to be written to about this request", valueLink: vl(true) })] : [field("Name", input("Dana Lee")), field("Work email", input("dana@northwind.example")), field("Company", input("Northwind"))];
      const words: Record<string, [string, string, string]> = { FORM_SUBSCRIBE: ["Get the next one", "Leave your email, and we write when there is something to read.", "Subscribe"], FORM_CONTACT: ["Write to us", "Say what you need, and the team that answers it writes back.", "Send message"], FORM_DEMO: ["See it with your own apps", "A few details, and we book thirty minutes with you.", "Request a demo"], FORM_WAITLIST: ["Join the waitlist", "We write the day a place opens for you.", "Join the waitlist"] };
      const [title, description, button] = words[code] ?? ["Tell us who you are", "A few details, and nothing you do not need to give.", "Send"];
      return sec([feat({ title, description }), U("DSForm", { size: "MD" }, [col([...fields, U("DSButton", { label: button, color: "PRIMARY", variant: "SOLID", anchor: { href: "#send" } })])])]);
    }
    case "CARD_ITEM": {
      if (c === "LIST_ROW") return sec([head(b.heads?.records?.[0] ?? "Everything written", "The most recent listings first, each with its price, its rating and the one line its seller wrote to say what it does."), U("DSList", { divided: true }, [0, 1, 2].map((i) => U("DSList.Item", { content: recordCard(b, i, c) })))]);
      if (c === "SIDE_LIST") return sec([grid([col([h2("Details of the listing"), para("What it is, what it needs and what it works with, as the page above says.")]), col([txt("More from this seller", "TITLE_MD"), ...[1, 2, 3].map((i) => recordCard(b, i, c))], "SM")], 2, 1, 1)]);
      if (c === "SLIDE") return sec([head("Popular this month", "A few of the listings buyers opened most this month, in one row you can scroll, each with its price and its rating."), row([0, 1, 2].map((i) => recordCard(b, i, "GRID_CELL")), "MD")]);
      return sec([head(b.heads?.records?.[0] ?? "Everything written", "The most recent listings first, each with its price, its rating and the one line its seller wrote to say what it does."), grid([0, 1, 2].map((i) => recordCard(b, i, c)), 3, 2, 1)]);
    }
    case "TRAY_COMPARE": {
      const picks = [0, 1].map((i) => item(rec(b, i)[0], null, "WIDGET", btn(null, undefined, "GHOST", "X", `Take ${rec(b, i)[0]} off`), { media: { slot: `pick-${i}`, label: `Picture of ${rec(b, i)[0]}`, ratio: "1:1" } }));
      return sec([head("Compare listings", "Tick up to three listings, and the tray at the foot of the page holds them until you press Compare, so you can keep browsing."), grid([0, 1, 2].map((i) => recordCard(b, i, "GRID_CELL")), 3, 2, 1), U("DSSticky", { position: "BOTTOM" }, [U("DSCard", {}, [U("DSCard.Content", {}, [row([...picks, btn("Compare 2", "PRIMARY", "SOLID")], "LG")])])])]);
    }
    case "ACTION_PANEL": return sec([grid([col([h2(rec(b, 0)[0]), para(rec(b, 0)[1])]), U("DSCardWidget", { header: { title: rec(b, 0)[2], description: "Taxes included" }, parts: [{ mtype: "FREE", key: "check", node: col([U("DSDateRangePicker", { valueLink: vl({ start: null, end: null }) }), U("DSRadioGroup", { options: [{ key: "solo", label: "Solo, 1 seat" }, { key: "team", label: "Team, 10 seats" }], valueLink: vl("team") })], "SM") }, { mtype: "FREE", key: "cta", node: col([btn("Buy now", "PRIMARY", "SOLID"), muted("Refund in 14 days", "CONTENT_XS")], "XS") }] })], 2, 1, 1)]);
    case "CARD_SELLER": return sec([head("Sold by", "Every seller is verified before a listing goes live, and their page shows their rating, their reviews and the other listings they sell."), grid([U("DSCardWidget", { parts: [{ mtype: "FREE", key: "o", node: col([U("DSItem", { pageLevel: "WIDGET", title: "Kite Studio", description: "Pune, India", media: { mtype: "AVATAR", title: "Kite Studio" }, facts: ["4.9 across 312 reviews", "14 listings"] }), btn("See the seller", undefined, "OUTLINE")], "SM") }] })], 3, 2, 1)]);
    case "CARD_LIST_GROUP": {
      const group = (g: Brief["groups"][number]): Tree => feat({ title: g[1], contentNode: U("DSList", { size: "SM", flush: true }, [...g[2], `View all ${g[2].length + 6}`].map((p) => U("DSList.Item", { content: link(p, `#${p.toLowerCase().replace(/ /g, "-")}`) }))) }, "WIDGET");
      if (c === "SIDE_LIST") return sec([grid([U("DSNavList", { nodes: b.groups.map((g, i) => ({ type: "ITEM", key: g[0], label: g[1], anchor: { href: `#${g[0]}` }, ...(i === 0 ? { selected: true } : {}) })) }), col([h2(b.groups[0][1]), para("The topics of the open group stand here, one a row.")])], 2, 1, 1)]);
      return sec([head("Browse by group", "Each group holds the first topics a reader of that part needs, with a link that opens all of them when you want more."), grid(b.groups.slice(0, 3).map(group), 3, 2, 1)]);
    }
    case "FORM_FEEDBACK": return sec([col([h2("Check it worked"), para("Sign in as that member and open the app. The screens the role allows are the ones that show."), txt("Did this answer it?", "TITLE_MD"), U("DSButtonGroup", {}, [btn("Yes", undefined, "OUTLINE", "CHECK"), btn("No", undefined, "OUTLINE")]), U("DSTextarea", { placeholder: "What was missing?", rows: 3, valueLink: vl("") })])]);
    case "CARD_RELEASE": return sec([feat({ eyebrow: badge("2.4.0", "PRIMARY", "SOLID"), title: "Roles can end on a date", description: "Added 3 November 2026", contentNode: U("DSList", {}, ["Added: an end date on a role grant.", "Changed: the members list shows when a role ends.", "Fixed: a role given twice no longer shows twice."].map((t) => U("DSList.Item", { content: t }))) }), feat({ eyebrow: badge("2.3.2", "DEFAULT", "OUTLINE"), title: "A fix for invites", description: "Added 21 October 2026", contentNode: U("DSList", {}, [U("DSList.Item", { content: "Fixed: an invite sent twice no longer makes two members." })]) })]);
    case "FORM_QUOTE": return sec([head("Ask for a quote", "Say what you need and from when, and the seller writes back within two working days with a price and the dates they can do."), formOf([formField("Name", formInput("Dana Lee")), formField("Work email", formInput("dana@northwind.example")), formField("Dates", U("DSDateRangePicker", { valueLink: vl({ start: null, end: null }) })), formField("What do you need?", U("DSTextarea", { valueLink: vl("Twenty seats, from January."), rows: 4 }))], "Ask for a quote")]);
    case "FORM_APPLY": return sec([head("Apply for this role", "Tell us who you are and why this role, and add your CV. A person on the team reads every application within a week."), formOf([formField("Name", formInput("Dana Lee")), formField("Email", formInput("dana@northwind.example")), formField("Why this role", U("DSTextarea", { valueLink: vl("I have built sign-in for nine apps."), rows: 4 }))], "Send application")]);
    case "FORM_REVIEW": return sec([head("Write a review", "Say what it did for you, in your own words, so the next buyer can tell whether it fits. Reviews are posted after a short check."), formOf([formField("Title", formInput("Saved us a quarter")), formField("Your review", U("DSTextarea", { valueLink: vl("One role, set once, held in every app."), rows: 4 }))], "Post review")]);
    case "FORM_QUESTION": return sec([head("Ask a question", "The seller and other buyers answer here, usually within two days, and the answers stay under the listing for the next person who asks."), formOf([formField("Your question", U("DSTextarea", { valueLink: vl("Does it work with single sign-on?"), rows: 3 }))], "Ask")]);
    case "FORM_COMMENT": return sec([head("Write a comment", "Add to what others wrote under this page, or tell us what is missing. Keep it to the page and be kind; a person reads every comment."), formOf([formField("Your comment", U("DSTextarea", { valueLink: vl("This answered my question."), rows: 3 }))], "Post comment")]);
    case "CARD_ITEMS": return sec([grid([U("DSCardWidget", { header: { title: "More from this seller", description: "Four more, newest first" }, parts: [{ mtype: "ITEMS", key: "more", items: [0, 1, 2].map((i) => ({ key: `m${i}`, title: rec(b, i)[0], description: rec(b, i)[2], media: { mtype: "ICON", node: "FILE" } })) }], footer: link("See all", "#all") })], 3, 2, 1)]);
    case "CARD_CATEGORY": return sec([head("Browse by category", "Each category opens its own listings, with the newest first, so you can start from the kind of thing you need and narrow down."), grid(["Add-ons", "Courses", "Workshops"].map((t, i) => U("DSCardWidget", { parts: [{ mtype: "MEDIA", key: "cover", node: slot(`${t}, cover`, "4:3") }, { mtype: "FREE", key: "name", node: U("DSItem", { pageLevel: "WIDGET", title: t, description: `${24 - i * 6} listings` }) }] })), 3, 2, 1)]);
    case "CARD_BRAND": return sec([head("Brands", "The studios and companies behind the listings, each with its own range, its own page and the count of listings you can buy today."), grid(b.marks.slice(0, 3).map((m, i) => U("DSCardWidget", { parts: [{ mtype: "FREE", key: "brand", node: U("DSItem", { pageLevel: "WIDGET", title: m, description: `${40 - i * 9} listings`, media: { mtype: "MARK", text: m.slice(0, 2).toUpperCase() } }) }] })), 3, 2, 1)]);
    case "CARD_ORG": {
      const org = (m: string): Tree => U("DSCardWidget", { parts: [{ mtype: "FREE", key: "org", node: U("DSItem", { pageLevel: "WIDGET", title: m, description: "Runs its nine apps on one sign-in.", media: { mtype: "MARK", text: m.slice(0, 2).toUpperCase() } }) }] });
      if (c === "LIST_ROW") return sec([head("Used by teams like yours", "A few of the organizations that run on it, from five-person studios to freight networks, each with the number of apps it runs."), U("DSList", { divided: true }, b.marks.slice(0, 3).map((m) => U("DSList.Item", { content: item(m, "Runs its nine apps on one sign-in.", "CONTAINER", undefined, { media: { mtype: "MARK", text: m.slice(0, 2).toUpperCase() } }) })))]);
      return sec([head("Used by teams like yours", "A few of the organizations that run on it, from five-person studios to freight networks, each with the number of apps it runs."), grid(b.marks.slice(0, 3).map(org), 3, 2, 1)]);
    }
    case "CARD_REVIEW": return sec([head("What buyers say", "Rated out of five by people who bought it, with the date of each review, so you can tell how recent the praise is."), grid(["Ananya P.", "Marcus T."].map((n, i) => U("DSItemCard", { card: {}, item: { title: n, description: b.quotes[i][0], media: { mtype: "AVATAR", title: n }, facts: [`${5 - i} out of 5`, "3 November 2026"], pageLevel: "WIDGET", orientation: "VERTICAL" } })), 2, 2, 1)]);
    case "CARD_QUESTION": return sec([head("Questions and answers", "Asked by readers, and answered by the people who know the page best, with a count of how many found each answer helpful."), U("DSList", { divided: true }, b.qa.slice(0, 2).map(([q, a], i) => U("DSList.Item", { content: questionCard(q, a, 12 - i * 4) })))]);
    case "CARD_COMMENT": return sec([head("Comments", "What readers wrote under the page, newest first, with the day each was written and a way to reply to the person who wrote it."), U("DSList", { divided: true }, b.quotes.slice(0, 2).map((q) => U("DSList.Item", { content: commentCard(q[1], q[0]) })))]);
    case "FEATURE_HIGHLIGHT": return highlight(b, c);
    case "FEATURE_CTA": return highlight(b, "A_CALL_TO_ONE_PAGE");
    default: return null;
  }
}
export { act, eyebrow, fitem };
