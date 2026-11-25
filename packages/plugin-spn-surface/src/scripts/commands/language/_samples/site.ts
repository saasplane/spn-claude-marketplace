// The container recipes of the site categories (MARKETING, MARKETPLACE, RESOURCES): one recipe for each kind, each case a form of it, drawn with
// the words of the category's brief. A recipe returns the section's node, or null where the language has no recipe for that kind or case, and
// the caller then draws the kind from its catalogue description.
import { DOORS_SURFACE, GRID, U, act, quote, badge, btn, cells, col, doors, eyebrow, feat, fitem, grid, item, lines, link, muted, row, sec, slot, table, txt, vl } from "./kit.ts";
import type { Brief, Line } from "./site-words.ts";
import type { Tree } from "./types.ts";

const asItem = (l: Line, href?: string): Tree => fitem(l[0], l[1], l[2], l[3] || undefined, href);
const iconLine = (l: Line): Tree => ({ key: l[0], title: l[1], description: l[2], media: { mtype: "ICON", node: l[3] } });
const stepLine = (l: Line): Tree => ({ key: l[0], title: l[1], description: l[2] });
const factsOf = (b: Brief): Tree[] => b.facts.map((f) => eyebrow(f));
const cta = (b: Brief): Tree[] => [act("main", b.heroCta[0], "#doors", true), act("second", b.heroCta[1], "#docs")];
const SURFACE_RAISED = { raised: true, elevation: "LG" };
const field = (label: string, ctl: Tree): Tree => {
  const value = (ctl.props?.valueLink as Tree | undefined)?.value ?? "";
  return U("DSForm.Field", { label, validators: [], attributeLink: vl(value) }, [ctl]);
};
const input = (value = "", props: Tree = {}): Tree => U("DSInput", { valueLink: vl(value), ...props });
const form = (fields: Tree[], button: string, note?: string): Tree =>
  U("DSForm", { size: "MD" }, [col([...fields, U("DSButton", { label: button, color: "PRIMARY", variant: "SOLID", anchor: { href: "#send" } }), ...(note ? [muted(note)] : [])])]);
const sideBySide = (a: Tree, b: Tree, desktop = 2): Tree => ({ place: "grid", gap: "XL", columns: { desktop, tablet: 1, mobile: 1 }, children: [col([a], "SM"), col([b], "SM")] });
const featureGrid = (heading: Tree, children: Tree[], desktop = 3, tablet = 2, mobile = 1, size = "MD"): Tree =>
  U("DSFeatureGridSectionContainer", { section: { size, color: "BASE" }, heading, grid: { desktop, tablet, mobile } }, children);

// ---- the hero
function hero(b: Brief, c: string): Tree {
  const base = { title: b.claim, description: b.claim2 };
  const words = { ...base, actions: cta(b), facts: factsOf(b) };
  switch (c) {
    case "ON_SCENE": return sec([feat({ ...words, textAlign: "START" }, "PAGE")], "XL", "BASE", { mediaNode: slot("Scene", "16:7") });
    case "UNDER": return sec([feat({ ...words, type: "MEDIA_BOTTOM", textAlign: "START", frames: ["MEDIA"], surface: SURFACE_RAISED, mediaNode: slot("The whole product, wide", "16:7") }, "PAGE")], "LG");
    case "BACKDROP": return sec([feat({ ...words, type: "BACKDROP", mediaNode: slot("A picture of the subject filling the feature", "16:7") }, "PAGE")], "LG");
    case "WORDS_ALONE": return sec([feat({ ...base, actions: cta(b), textAlign: "CENTER" }, "PAGE")], "LG");
    case "ARTICLE_HEAD": return sec([feat({ eyebrow: eyebrow("Guide"), title: b.article.title, description: b.article.lede, facts: [{ mtype: "TEXT", text: b.article.by, startIcon: "USER" }, { mtype: "TEXT", text: b.article.date, startIcon: "CALENDAR" }] }, "PAGE")], "LG");
    case "FORM_BESIDE": return sec([feat({ type: "SPLIT_END", eyebrow: badge("Live webinar", "PRIMARY", "SOLID"), title: "Ship a new app in a week", description: "Watch a team go from an empty folder to a signed-in, role-aware app, live on 12 December at 16:00 IST. Bring a question.", facts: [{ mtype: "TEXT", text: "12 December 2026", startIcon: "CALENDAR" }, { mtype: "TEXT", text: "60 minutes with Q&A", startIcon: "CLOCK" }], contentNode: form([field("Name", input("Dana Lee")), field("Work email", input("dana@northwind.example"))], "Register", "We send the link and the recording the same day.") }, "PAGE")], "LG");
    case "ITEM_HEAD": {
      const r = b.records[0];
      return sec([feat({ type: "SPLIT_START", eyebrow: badge("Bestseller", "PRIMARY", "SOLID"), title: r[0], description: `${r[1]} Sold by a verified seller, with ${b.numbers[2][0]} ${b.numbers[2][1]}.`, facts: [{ mtype: "TEXT", text: "4.8 (2,310 ratings)", startIcon: "CHECK" }, { mtype: "TEXT", text: "Last updated 3 November 2026", startIcon: "CALENDAR" }], mediaNode: slot(`${r[0]}, gallery`, "16:9"), actions: [act("buy", `Buy for ${r[2]}`, "#buy", true), act("save", "Save for later", "#save")] }, "PAGE")], "LG");
    }
    case "BRAND_HEAD": return sec([feat({ type: "SPLIT_START", eyebrow: eyebrow("Seller", "OUTLINE", "DEFAULT"), title: "Kite Studio", description: "A two-person studio in Pune that builds audit and reporting add-ons, verified since March 2025.", facts: [{ mtype: "TEXT", text: "4.9 across 312 reviews", startIcon: "CHECK" }, { mtype: "TEXT", text: "14 listings", startIcon: "LIST" }], mediaNode: slot("Kite Studio, logo", "1:1"), actions: [act("follow", "Follow", "#follow", true), act("ask", "Ask a question", "#ask")] }, "PAGE")], "LG");
    case "SLIDES": return sec([feat({ ...words, type: "SPLIT_END", mediaNode: slot("First of three pictures, which turn on their own", "4:3"), frames: ["MEDIA"], surface: SURFACE_RAISED }, "PAGE")], "LG");
    default: return sec([feat({ ...words, type: "SPLIT_END", eyebrow: eyebrow(b.nav[1][0], "SOLID", "PRIMARY"), frames: ["MEDIA"], surface: SURFACE_RAISED, mediaNode: slot(b.picture.hero, "4:3") }, "PAGE")], "LG");
  }
}

// ---- the sections of a page's argument
const statement = (b: Brief, c: string): Tree => sec([feat({ textAlign: "CENTER", title: c === "LEAD_IN" ? "Find the page written for you" : b.problem, description: c === "LEAD_IN" ? "The sections below answer different readers. Pick by the question you are asking, and go straight to your own." : b.problem2, facts: c === "LEAD_IN" ? undefined : b.facts })], "MD");

function points(b: Brief, c: string): Tree {
  const words = { title: "What each team gets on day one", description: "Three things an admin does most, each done once for the whole organization instead of once per app." };
  const nodes = b.points.map(iconLine);
  switch (c) {
    case "HEAD_ACROSS": return sec([feat({ ...words, textAlign: "START" }), grid(nodes.map((n) => feat({ title: n.title, description: n.description, media: n.media }, "WIDGET")), 3, 3, 1)], "MD");
    case "BESIDE_A_PICTURE": return sec([feat({ ...words, type: "ITEMS_SPLIT_END", verticalAlign: "TOP", items: lines(nodes), mediaNode: slot("The three points at work", "4:3") })], "MD");
    default: return sec([feat({ ...words, textAlign: "START", items: cells(nodes, 3) })], "MD");
  }
}

function steps(b: Brief, c: string): Tree {
  const words = { title: "Four steps, in this order", description: "Each step says why before it says what to press, so nobody follows a click path they do not understand." };
  if (c === "A_ROW") return sec([feat({ ...words, textAlign: "START" }), U("DSStepper", { items: b.steps.map((s, i) => ({ key: s[0], label: s[1], taskState: i < 2 ? "DONE" : i === 2 ? "WORKING" : undefined })), activeKey: b.steps[2][0], type: "NUMBER" })], "MD");
  if (c === "HEAD_ACROSS") return sec([feat({ ...words, textAlign: "START" }), grid(b.steps.map((s, i) => feat({ title: `${i + 1}. ${s[1]}`, description: s[2] }, "WIDGET")), 4, 2, 1)], "MD");
  return sec([feat({ ...words, type: "SPLIT_END", verticalAlign: "TOP", items: lines(b.steps.map(stepLine), true), mediaNode: slot("Member, role, permissions, app screens", "4:3") })], "MD");
}

function showIt(b: Brief, c: string): Tree {
  const words = { eyebrow: eyebrow(b.nav[0][0]), title: "One role, held in every app", description: "Add a member to the one list for the whole organization, give the member a role, and every app reads it.", actions: [act("go", `Open ${b.org}`, "#open")] };
  switch (c) {
    case "UNDER": return sec([feat({ ...words, type: "MEDIA_BOTTOM", frames: ["MEDIA"], surface: { raised: true, elevation: "MD" }, mediaNode: slot(`${b.picture.show}, full width`, "16:8") })], "MD");
    case "SEVERAL_PICTURES": return sec([feat({ ...words, type: "MEDIA_BOTTOM", frames: ["MEDIA"], surface: { raised: true, elevation: "MD" }, contentNode: U("DSToggleGroup", { options: [{ value: "list", label: "The list" }, { value: "page", label: "The page" }, { value: "log", label: "History" }], valueLink: vl("list") }), mediaNode: slot(`First picture: ${b.picture.show}`, "16:8") })], "MD");
    default: return sec([feat({ ...words, type: "SPLIT_END", items: lines(b.points.slice(0, 2).map(iconLine)), frames: ["MEDIA"], surface: { raised: true, elevation: "MD" }, mediaNode: slot(b.picture.show, "4:3") })], "MD");
  }
}

function realSample(b: Brief, c: string): Tree {
  const code = U("DSCodeBlockView", { filename: b.code.file, language: b.code.language, showLineNumbers: true, bordered: true, code: b.code.text });
  const words = { eyebrow: eyebrow("A real sample"), title: "What a role grant holds", description: "A grant names the member, the role and the organization, and nothing else. The values here are samples." };
  if (c === "UNDER") return sec([feat({ ...words, type: "MEDIA_BOTTOM", mediaNode: code })], "MD", "DEFAULT", { inset: true });
  if (c === "RUNNING_EXAMPLE") return sec([feat({ ...words, title: "Run it and see the result", type: "SPLIT_END", verticalAlign: "TOP", mediaNode: col([code, U("DSAlert", { color: "SUCCESS", text: "The role is in force", description: "Every app reads it on the next page." })], "SM") })], "MD", "DEFAULT", { inset: true });
  return sec([feat({ ...words, type: "SPLIT_END", verticalAlign: "TOP", mediaNode: code })], "MD", "DEFAULT", { inset: true });
}

function choose(b: Brief, c: string): Tree {
  const tog = U("DSToggleGroup", { options: b.choose.map(([label], i) => ({ value: `c${i}`, label })), valueLink: vl("c0") });
  return sec([feat({ title: "Which one is you?", description: "Pick the part you play, and see what it does for you from your first day.", contentNode: tog, type: c === "UNDER" ? "MEDIA_BOTTOM" : "SPLIT_END", mediaNode: slot(`${b.choose[0][1]} (a press swaps the picture)`, c === "UNDER" ? "16:8" : "4:3") })], "MD");
}

function doorsKind(b: Brief, c: string): Tree {
  const head = { title: "Where each part lives", description: "Open the part you need, or start with the first and add the rest when your team is ready." };
  const nodes = b.doors.map((l) => asItem(l, `#${l[0]}`));
  switch (c) {
    case "DOOR_ROWS": return sec([feat({ ...head, items: lines(nodes) })], "MD", "BASE", { id: "doors" });
    case "CHILD_SECTION_WITH_PARTS": return sec([feat({ type: "ITEMS_SPLIT_END", verticalAlign: "TOP", title: b.groups[0][1], description: `Each part of ${b.groups[0][1].toLowerCase()} opens on its own page.`, items: lines(b.groups[0][2].map((p, i) => fitem(`c${i}`, p, "A short line about what the page holds.", "ARROW_RIGHT", `#${p.toLowerCase()}`))), mediaNode: slot(`${b.groups[0][1]}, in one picture`, "4:3"), actions: [act("go", `See ${b.groups[0][1].toLowerCase()}`, "#go", true)] })], "MD");
    case "CHILD_SECTION_WITH_POINTS": return sec([feat({ type: "SPLIT_END", verticalAlign: "TOP", title: b.groups[1][1], description: `What ${b.groups[1][1].toLowerCase()} gives you, in three points.`, items: lines(b.points.map((p) => fitem(p[0], p[1], p[2]))), mediaNode: slot(`${b.groups[1][1]}, in one picture`, "4:3"), actions: [act("go", `See ${b.groups[1][1].toLowerCase()}`, "#go", true)] })], "MD", "DEFAULT", { inset: true });
    case "NEXT_TOPIC": return sec([feat({ textAlign: "CENTER", title: `You have seen how ${b.points[1][1].toLowerCase()}`, description: "Next, see how a member signs in once for every app, then reads the same role in each one.", actions: [{ ...act("next", "Next: One sign-in", "#next", true), endIcon: "ARROW_RIGHT" }, act("demo", "See the demo", "#demo")] })], "SM");
    case "WAY_BACK": return sec([feat({ textAlign: "CENTER", title: "We could not find that page", description: "The address may have changed. Go back to the start, or tell us what you were looking for.", actions: [act("home", "Back to home", "#home", true), act("touch", "Get in touch", "#contact")] }, "PAGE")], "LG");
    case "PREVIOUS_AND_NEXT": return sec([{ place: "row", gap: "MD", justify: "between", children: [btn("Previous: Invite a member", undefined, "OUTLINE", "ARROW_LEFT"), btn("Next: Assign a role", "PRIMARY", "SOLID")] }], "SM");
    case "LINK_GROUPS": return sec([feat({ title: "Browse by group", description: "Each group opens its own set of listings.", items: cells(b.groups.slice(0, 3).map((g) => fitem(g[0], g[1], g[2].join(", "), undefined, `#${g[0]}`)), 3) })], "MD");
    default: return sec([feat({ ...head, items: doors(nodes, 3) })], "MD", "BASE", { id: "doors" });
  }
}

function featureGridKind(b: Brief, c: string): Tree {
  if (c === "INTEGRATIONS") return featureGrid({ title: "Works with what you use", description: "Each mark opens the page that shows how it works with the product, step by step." }, b.marks.slice(0, 4).map((m) => U("DSItemCard", { card: {}, item: { title: m, description: "Open the guide", media: { mtype: "MARK", text: m.slice(0, 2).toUpperCase() }, pageLevel: "WIDGET" } })), 4, 2, 1);
  if (c === "CONTENTS") return featureGrid({ title: "What is in the course", description: "Twenty-nine short lessons in six modules, six hours and twenty minutes in all, each ending with a check." }, [feat({ title: "The modules", description: "Take them in order; each ends with a short check.", contentNode: U("DSAccordionGroup", { bordered: true, options: ["Why roles belong to the member", "Designing a role", "Granting and revoking", "Reading roles in an app"].map((t, i) => ({ key: `m${i}`, header: `${t} · ${4 + i} lessons`, content: "Short lessons, each with a check at the end.", expanded: i === 0 })) }) }, "GROUP")], 1, 1, 1);
  const icons = ["KEY", "USERS", "SHIELD", "GLOBE", "LIST", "CREDIT_CARD"];
  const six = [["One sign-in", "One identity for every app, whichever provider your team uses."], ["One member list", "Everyone in the organization, in one place, whatever app they open."], ["Roles set once", "A role is set on the member, and every app reads it."], ["Public sites", "Pages that show before sign-in, drawn from the same blocks."], ["A kept history", "Each change is stored with its author and the time it happened."], ["One invoice", "One plan and one bill for the organization, however many apps."]];
  return featureGrid({ title: "What is in the set", description: "Six parts that every app starts with, so no team builds the same one twice." }, six.map(([t, d], i) => feat({ title: t, description: d, media: { mtype: "MARK", icon: icons[i] } }, "WIDGET")));
}

function numbers(b: Brief, c: string): Tree {
  if (c === "WITH_FACTS") return sec([feat({ textAlign: "START", title: "Founded to end the rebuild", description: "Two founders began in 2022, and the team has grown to thirty-eight people since, still working from Pune.", facts: [{ mtype: "TEXT", text: "2022", label: "Founded" }, { mtype: "TEXT", text: "Pune", label: "Where" }, { mtype: "TEXT", text: "38", label: "People" }], items: { type: "STATS", nodes: b.numbers.map(([n, d], i) => ({ key: `n${i}`, title: n, description: d })) } })], "MD");
  return sec([feat({ textAlign: "CENTER", title: c === "TRUST" ? "Trusted by buyers and sellers alike" : "Teams already build this way", description: "Figures from our customer survey of the last twelve months, across every organization that takes part.", items: { type: "STATS", nodes: b.numbers.map(([n, d], i) => ({ key: `n${i}`, title: n, description: d })) } }), muted("Source: customer survey, October 2026, 120 organizations.", "CONTENT_XS")], "MD");
}

const questions = (b: Brief, c: string): Tree => sec([feat({ textAlign: "CENTER", title: c === "ASKED" ? "Asked by buyers before they pay" : "What people ask before they start", contentNode: U("DSAccordionGroup", { bordered: true, options: b.qa.map(([q, a], i) => ({ key: `q${i}`, header: q, content: a, expanded: i === 0 })) }) })], "MD");

function closing(b: Brief, c: string): Tree {
  const base = { title: b.closing.title, description: b.closing.description };
  const a = [act("start", b.closing.cta, "#start", true), act("docs", b.closing.second, "#more")];
  const look = ["SM", "PRIMARY", { strength: "SUBTLE", inset: true }] as const;
  const section = (kids: Tree[]) => sec(kids, look[0], look[1], look[2]);
  if (c === "BESIDE") return section([feat({ ...base, type: "SPLIT_END", actions: a, mediaNode: slot("The product on its first day", "4:3") })]);
  if (c === "WITH_FORM") return section([feat({ textAlign: "CENTER", title: "Get the first look", description: "Leave your email and we write the day the next release opens, with what it does and how to try it.", contentNode: U("DSInput", { name: "email", type: "EMAIL", placeholder: "you@company.com", valueLink: vl("") }), actions: [act("join", "Keep me posted", "#join", true)] })]);
  if (c === "WITH_HIGHLIGHT") return section([feat({ ...base, textAlign: "CENTER", actions: a }), feat({ frames: ["TEXT"], surface: { color: "PRIMARY", strength: "SUBTLE", raised: true, elevation: "MD" }, textAlign: "CENTER", title: "See every page of the foundation", description: "One page shows each part, drawn from the real units, so you can check every claim yourself.", actions: [act("show", "View the Showcase", "#showcase", true)] }, "WIDGET")]);
  if (c === "STILL_NEED_HELP") return sec([feat({ textAlign: "CENTER", title: "Still need help?", description: b.closing.description, actions: a })], "SM", "DEFAULT", { inset: true });
  return section([feat({ ...base, textAlign: "CENTER", actions: a })]);
}

function highlight(b: Brief, c: string): Tree {
  if (c === "A_CALL_TO_ONE_PAGE") return sec([feat({ frames: ["TEXT"], surface: { color: "PRIMARY", strength: "SUBTLE", raised: true, elevation: "MD" }, textAlign: "CENTER", title: "See every page of the foundation", description: "One page shows each part, drawn from the real units, so you can check every claim yourself.", actions: [act("show", "View the Showcase", "#showcase", true)] })], "MD");
  return sec([feat({ frames: ["TEXT", "MEDIA"], surface: { raised: true, elevation: "MD", lit: true }, type: "SPLIT_END", eyebrow: eyebrow("Proof"), title: "One change, nine apps, one minute", description: "This is the result from one organization on the Team plan, read from its own audit view the same day.", mediaNode: slot(b.picture.proof, "4:3") })], "MD");
}

function reading(b: Brief, c: string): Tree {
  const kids: unknown[] = [];
  if (c === "TITLE_AND_COLUMN") kids.push(feat({ title: "How we keep your data private", description: "This notice says what we collect, why we keep it, and who can read it. We last changed it on 1 March 2026." }, "PAGE"));
  kids.push(txt("A role is set once, on the member. Every app reads the same role, so a change reaches all of them together.", "CONTENT_LG"), txt("Where a role lives", "TITLE_MD", { element: "h2" }), txt("Each app asks the foundation which screens the role allows. The app never keeps its own copy of the role."), U("DSAlert", { color: "INFO", text: "A role carries a set of permissions, never one permission alone." }), U("DSCodeBlockView", { filename: b.code.file, language: b.code.language, bordered: true, code: b.code.text }));
  return sec(kids, "MD");
}

function articleBody(b: Brief): Tree { return reading(b, "COLUMN"); }

const recordCard = (r: [string, string, string], form = "VERTICAL"): Tree => U("DSItemCard", { card: {}, item: { title: r[0], description: r[1], media: { mtype: "MARK", icon: "FILE" }, facts: [r[2]], pageLevel: "WIDGET", orientation: form } });
const paging = (total = 48, per = 6): Tree => U("DSPagination", { totalRecords: total, valueLink: vl({ page: 1, recordsPerPage: per }) });
const searchBar = (label = "Search"): Tree => U("DSFilterBar", { fields: [{ mtype: "TEXT", key: "q", label, placeholder: label, primary: true, valueLink: vl("") }] });

function records(b: Brief, c: string): Tree {
  const head = feat({ title: "Everything written, newest first", description: "Notes from the team on roles, sign-in, sites and billing, each written by the person who built the part." });
  const gridOf = (list: Array<[string, string, string]>, d = 3): Tree => featureGrid({}, list.map((r) => recordCard(r)), d, 2, 1, "XS");
  switch (c) {
    case "FEATURED_FIRST": return sec([head, featureGrid({}, b.records.slice(0, 2).map((r) => recordCard(r)), 2, 2, 1, "XS"), gridOf(b.records.slice(2, 5)), paging()], "MD");
    case "BY_SHELF": return sec([feat({ title: "Most read this month", actions: [act("all", "See all", "#all")] }), gridOf(b.records.slice(0, 3)), feat({ title: "Newly added this week", actions: [act("all2", "See all", "#all")] }), gridOf(b.records.slice(3, 6))], "MD");
    case "FILTERED": {
      const f = [{ mtype: "TEXT", key: "q", label: "Search", placeholder: "Search 48 listings", primary: true, valueLink: vl("") }, ...[["topic", "Topic", ["Roles", "Sign-in", "Sites", "Billing"]], ["level", "Level", ["Beginner", "Intermediate", "Advanced"]], ["price", "Price", ["Free", "Paid"]]].map(([k, l, o]) => ({ mtype: "SELECT", key: k, label: l, options: (o as string[]).map((x) => ({ key: x.toLowerCase(), label: x })), valueLink: vl(null) }))];
      return sec([feat({ title: "Find the one for you", description: "Narrow the list by topic, level or price, and sort it the way you like." }), U("DSFilterBar", { fields: f }), gridOf(b.records), paging(48, 9)], "MD");
    }
    case "A_TO_Z": return sec([head, searchBar(), U("DSList", { divided: true }, [...b.records].sort((x, y) => x[0].localeCompare(y[0])).map((r) => U("DSList.Item", { content: item(r[0], r[1], "CONTENT") }))), paging()], "MD");
    case "DATED_FEED": return sec([head, U("DSList", { divided: true }, b.records.map((r) => U("DSList.Item", { content: item(r[0], r[1], "CONTENT", muted(r[2])) }))), paging()], "MD");
    case "PAGED_LIST": return sec([head, searchBar(), U("DSList", { divided: true }, b.records.map((r) => U("DSList.Item", { content: item(r[0], r[1], "CONTENT", btn(null, undefined, "GHOST", "ARROW_RIGHT", `Open ${r[0]}`)) }))), paging()], "MD");
    case "LIST_AND_PANE": return sec([head, grid([U("DSList", { divided: true }, b.records.slice(0, 4).map((r) => U("DSList.Item", { content: item(r[0], r[1], "CONTENT") }))), feat({ title: b.records[0][0], description: b.records[0][1], eyebrow: eyebrow(b.records[0][2]), type: "MEDIA_TOP", mediaNode: slot(`${b.records[0][0]}, preview`, "16:9"), actions: [act("open", "Open it", "#open", true)] }, "WIDGET")], 2, 1, 1)], "MD");
    default: return sec([head, searchBar(), gridOf(b.records), paging()], "MD");
  }
}

function plans(b: Brief): Tree {
  const plan = (p: Brief["plans"][number]): Tree => feat({ title: p.name, description: p.line, eyebrow: { mtype: "CUSTOM", node: U("DSFormatCurrency", { value: p.price, currencyCode: "USD" }) }, items: lines(p.feats.map((f, i) => ({ key: `f${i}`, title: f, description: "Included in the plan." }))), actions: [act("choose", `Choose ${p.name}`, "#choose", !!p.recommended)], frames: ["TEXT"], surface: p.recommended ? { raised: true, elevation: "MD", lit: true } : { raised: false, elevation: "MD" }, ...(p.recommended ? { facts: [{ mtype: "BADGE", text: "Recommended", variant: "SOLID", color: "PRIMARY" }] } : {}) }, "WIDGET");
  return featureGrid({ title: "Which plan is yours?", description: "Prices are per month, billed yearly.", textAlign: "CENTER" }, b.plans.map(plan));
}

function compare(b: Brief, c: string): Tree {
  if (c === "PLANS") return sec([feat({ title: "What each plan holds", description: "Each row is one thing, and each column a plan; the recommended plan stands out." }), table(["", ...b.plans.map((p) => p.name)], [["Apps", "1", "Unlimited", "Unlimited"], ["Members", "5", "50", "Unlimited"], ["Audit history", "", "Included", "Included"], ["Support", "", "", "Included"]])], "MD");
  if (c === "ALTERNATIVES") return sec([feat({ title: "This, against what you use now", description: "Each row sets it against building it yourself, and each claim names the source it comes from." }), table(["", b.org, "What you use now"], [["Sign-in", "Built once", "Built per app"], ["Member list", "One list", "A list per app"], ["Role change", "Once, in every app", "App by app"]])], "MD");
  if (c === "RATES") return sec([feat({ title: "What each plan costs", description: "Per month, billed yearly, in dollars." }), table(["Plan", "Per member", "Per app", "Support"], [["Starter", "Free", "Free", "Community"], ["Team", "$4", "$9", "Email"], ["Company", "$6", "$12", "A named person"]])], "MD");
  return sec([feat({ title: "Compare the listings", description: "Two listings side by side, row by row." }), U("DSComparison", { subjects: b.records.slice(0, 3).map((r, i) => ({ key: `r${i}`, title: r[0] })), groups: [{ key: "g", rows: ["Price", "Seller", "Refund"].map((l, i) => ({ mtype: "FIELD", key: `k${i}`, config: { mtype: "TEXT", key: `k${i}`, label: l }, values: Object.fromEntries(b.records.slice(0, 3).map((r, j) => [`r${j}`, { mtype: "TEXT", value: i === 0 ? r[2] : i === 1 ? "Kite Studio" : "14 days" }])) })) }] })], "MD");
}

function testimonials(b: Brief, c: string): Tree {
  const quoteOf = (q: [string, string, string], card = true): Tree => quote(q[0], q[1], q[2], card);
  if (c === "CUSTOMER_MARKS" || c === "MARKS") return featureGrid({ title: "Used by teams like yours", description: "A few of the organizations that run on it today." }, b.marks.map((m) => feat({ title: m, media: { mtype: "MARK", text: m.slice(0, 2).toUpperCase() } }, "WIDGET")), 5, 3, 2, "SM");
  if (c === "QUOTE") return sec([feat({ title: "In their words" }), quoteOf(b.quotes[0], false)], "MD");
  if (c === "REVIEWS") return sec([feat({ title: "What buyers say about it", description: "4.8 out of 5, from 2,310 ratings, and many say it saved them a quarter of work.", items: { type: "STATS", nodes: [{ key: "a", title: "4.8", description: "average rating" }, { key: "b", title: "2,310", description: "ratings" }] } }), grid(["Ananya P.", "Marcus T.", "Lena K.", "Tomas R."].map((n, i) => U("DSItemCard", { card: {}, item: { title: n, description: b.quotes[i % 3][0], media: { mtype: "AVATAR", title: n }, facts: [`${5 - (i === 2 ? 1 : 0)} out of 5`], pageLevel: "WIDGET", orientation: "VERTICAL" } })), 2, 2, 1)], "MD");
  if (c === "STORIES") return sec([feat({ title: "How teams use it", description: "Three teams tell how they moved onto one foundation, with the numbers they kept.", items: doors(b.marks.slice(0, 3).map((m, i) => fitem(`st${i}`, `${m}, in ${["a quarter", "a day", "a week"][i]}`, "How the team moved over, step by step.", "FILE", "#story")), 3) })], "MD");
  if (c === "PRESS") return sec([feat({ title: "What the press wrote about us", description: "Publications and award lists have written about us, in their own words.", items: cells(["Daily Build", "Stack Review", "Ship Weekly"].map((t, i) => fitem(`pr${i}`, t, ["A foundation that ends the rebuild.", "Sign-in, set once.", "The base every app was missing."][i], undefined, undefined, { media: { mtype: "MARK", text: t.slice(0, 2).toUpperCase() } })), 3) })], "MD");
  return sec([feat({ title: "Teams say it best", description: "Hear from the people who moved onto one foundation, in their own words." }), grid(b.quotes.map((q) => quoteOf(q)), 3, 1, 1)], "MD");
}

function people(b: Brief, c: string): Tree {
  const head = { title: "The people behind it", description: "Thirty-eight people across three time zones, building one foundation for every app a team opens." };
  if (c === "AVATARS") return featureGrid(head, b.people.map(([n, r]) => U("DSItemCard", { card: {}, item: { title: n, description: r, media: { mtype: "AVATAR", title: n }, pageLevel: "WIDGET", orientation: "VERTICAL" } })), 4, 2, 1);
  return featureGrid(head, b.people.map(([n, r]) => personCard(n, r)), 4, 3, 2);
}
export const personCard = (n: string, r: string): Tree => U("DSCardWidget", { parts: [{ mtype: "MEDIA", key: "portrait", node: slot(`${n}, portrait, head and shoulders`, "4:5") }, { mtype: "FREE", key: "who", node: U("DSItem", { pageLevel: "WIDGET", title: n, description: r }) }] });

function enquiry(b: Brief, c: string): Tree {
  if (c === "REQUEST") {
    const f = form([field("Name", input("Dana Lee")), field("Work email", input("dana@northwind.example")), field("Team size", U("DSSelect", { options: ["1 to 10", "11 to 50", "51 to 200"].map((k) => ({ key: k, label: k })), valueLink: vl("11 to 50") })), field("What would you like to see?", U("DSTextarea", { valueLink: vl("How roles reach our nine apps."), rows: 4 }))], "Request a demo", "We reply within one working day, and a demo takes thirty minutes.");
    const side = feat({ title: "What happens next", description: "A person from our team writes back to book a time.", items: lines([["r1", "We read your note", "We read it first, so the demo starts from your own case."], ["r2", "We book thirty minutes", "We offer a time that suits you."], ["r3", "You see it run", "We show it running with your own apps."]].map(([k, t, d]) => ({ key: k, title: t, description: d })), true) }, "GROUP");
    return sec([feat({ title: `See ${b.org} with your own apps`, description: "Tell us a little about your apps and your team, and we show you how it fits them." }), sideBySide(f, side)], "MD");
  }
  const f = form([field("Name", input("Dana Lee")), field("Work email", input("dana@northwind.example")), field("Topic", U("DSSelect", { options: ["Sales", "Support", "Press", "Partnerships"].map((k) => ({ key: k.toLowerCase(), label: k })), valueLink: vl("sales") })), field("Message", U("DSTextarea", { valueLink: vl("We run nine apps and want one sign-in for all of them."), rows: 5 }))], "Send message", "We reply within one working day.");
  const way = (k: string, t: string, d: string, icon: string, href: string): Tree => ({ key: k, title: t, description: d, media: { mtype: "MARK", icon }, anchor: { href } });
  const ways = U("DSCardWidget", { header: { title: "Ways to reach us", description: "Write to the team that answers it, or call us." }, parts: [{ mtype: "ITEMS", key: "ways", items: [way("sales", b.emails[0], "Plans, pricing and demos", "MAIL_OPEN", `mailto:${b.emails[0]}`), way("support", b.emails[1], "Help with something you run", "MAIL_OPEN", `mailto:${b.emails[1]}`), way("phone", "+91 20 5550 0142", "Our team picks up the phone", "PHONE", "tel:+912055500142")] }], footer: txt("Monday to Friday, 9:00 to 18:00 IST", "CONTENT_SM", { tone: "MUTED" }) });
  return sec([feat({ title: "Send us a message", description: "Choose a topic, and your message goes straight to the people who answer it, not to a shared inbox." }), sideBySide(f, ways)], "MD");
}

function locations(b: Brief, c: string): Tree {
  const office = ([n, a]: [string, string]): Tree => ({ key: `o-${n.toLowerCase()}`, title: n, description: a, media: { mtype: "ICON", node: "GLOBE" }, facts: ["Monday to Friday, 9:00 to 18:00"], endNode: link("Directions", `#directions-${n.toLowerCase()}`) });
  const list = (offs: Array<[string, string]>): Tree => feat({ items: { type: "LIST", divided: true, nodes: offs.map(office) } }, "GROUP");
  const head = feat({ title: "Come and see us in person", description: "Each office keeps a desk free for visitors, so write to us first and we will have it ready for you." });
  if (c === "MAP") return sec([head, sideBySide(list(b.places), slot(`Map with three pins: ${b.places.map((p) => p[0]).join(", ")}`, "4:5"))], "MD");
  return sec([head, list(b.places.slice(0, 2))], "MD");
}

function find(b: Brief, c: string): Tree {
  const head = feat({ title: c === "STRUCTURED" ? "Find the right listing" : "What are you looking for?", description: "Type a word, or choose a category and a price." }, "CONTAINER");
  const auto = U("DSAutocomplete", { placeholder: `Search ${b.org}`, options: b.records.map((r) => ({ key: r[0].toLowerCase(), label: r[0] })), valueLink: vl(null) });
  if (c === "STRUCTURED") return sec([head, grid([auto, U("DSSelect", { options: ["Add-ons", "Courses", "Workshops"].map((k) => ({ key: k, label: k })), valueLink: vl("Add-ons") }), U("DSSelect", { options: ["Any price", "Free", "Under $50"].map((k) => ({ key: k, label: k })), valueLink: vl("Any price") }), btn("Search", "PRIMARY", "SOLID", "SEARCH")], 4, 2, 1)], "MD");
  return sec([head, auto, feat({ title: "Popular searches", items: lines(b.doors.map((d) => ({ key: d[0], title: d[1] }))) }, "GROUP")], "MD");
}

const deals = (b: Brief): Tree => sec([feat({ frames: ["TEXT", "MEDIA"], surface: { raised: true, elevation: "MD", lit: true }, type: "SPLIT_END", eyebrow: badge("Ends Sunday", "PRIMARY", "SOLID"), title: "Two courses for the price of one", description: "Buy Roles in a day and get Audit history your auditors will read free, until Sunday 29 November 2026.", mediaNode: slot("The two courses side by side", "4:3"), actions: [act("buy", "Buy both for $49", "#buy", true)] })], "MD");

function specifications(b: Brief): Tree {
  const group = (t: string, rows: string[][]): Tree => feat({ title: t, contentNode: table(["", ""], rows, false) }, "GROUP");
  return sec([feat({ title: "Specifications", description: "What it is, what it needs and what it works with." }), group("What it is", [["Version", "2.4.0"], ["Updated", "3 November 2026"], ["Size", "1.2 MB"]]), group("What it needs", [["Plan", "Team or Company"], ["Apps", "Any"], ["Sign-in", "Single sign-on"]])], "MD");
}

function options(b: Brief): Tree {
  return sec([feat({ title: "Choose an option", description: "Each option has its own price and what it includes." }), U("DSRadioGroup", { options: [["solo", "Solo", "1 seat, $29"], ["team", "Team", "10 seats, $99"], ["studio", "Studio", "Unlimited seats, $249"]].map(([key, label, description]) => ({ key, label, description })), valueLink: vl("team") })], "MD");
}

function syllabus(b: Brief): Tree {
  return sec([feat({ title: "What is in it", description: "Twenty-nine short lessons in six modules, each ending with a check.", contentNode: U("DSAccordionGroup", { bordered: true, options: ["Why roles belong to the member", "Designing a role", "Granting and revoking", "Reading roles in an app", "Audit and review"].map((t, i) => ({ key: `m${i}`, header: `${t} · ${4 + i} lessons`, content: "Short lessons, each with a check at the end.", expanded: i === 0 })) }) })], "MD");
}

function owner(b: Brief): Tree {
  return sec([feat({ title: "Sold by", description: "Every seller is verified before a listing goes live." }), U("DSCardWidget", { parts: [{ mtype: "FREE", key: "o", node: U("DSItem", { pageLevel: "WIDGET", title: "Kite Studio", description: "Pune, India · seller since March 2025", media: { mtype: "AVATAR", title: "Kite Studio" }, facts: ["4.9 across 312 reviews", "14 listings"], endNode: btn("See the seller", undefined, "OUTLINE") }) }] })], "MD");
}

function policies(b: Brief): Tree {
  return sec([feat({ title: "Refunds, delivery and licences", description: "Short answers, before you pay.", contentNode: U("DSAccordionGroup", { bordered: true, options: [["Can I get a refund?", "Yes, within 14 days, if the add-on does not do what its page says."], ["How is it delivered?", "Instantly, to your organization's Lumen account."], ["Who holds the licence?", "Your organization, for as long as it holds the add-on."]].map(([h, c], i) => ({ key: `p${i}`, header: h, content: c, expanded: i === 0 })) }) })], "MD");
}

function order(b: Brief, c: string): Tree {
  const lineOf = (r: [string, string, string], end: Tree): Tree => item(r[0], `${r[1]}`, "CONTENT", end, { media: { slot: `cover-${r[0].toLowerCase().replace(/[^a-z]+/g, "-")}`, label: `Cover of ${r[0]}`, ratio: "4:3" } });
  const total = col([row([muted("Subtotal"), txt("$97.00", "CONTENT_MD")], "LG"), row([muted("Tax"), txt("$8.73", "CONTENT_MD")], "LG"), row([txt("Total", "TITLE_MD"), txt("$105.73", "TITLE_MD")], "LG")], "SM");
  const rows = b.records.slice(0, 3).map((r) => lineOf(r, c === "CART" ? row([txt(r[2], "TITLE_MD"), btn(null, undefined, "GHOST", "X", `Remove ${r[0]}`)], "SM") : txt(r[2], "TITLE_MD")));
  return sec([feat({ title: c === "CART" ? "Your cart" : "Review your order", description: c === "CART" ? "Three listings, ready to pay for." : "Check the three listings and the total before you pay." }), U("DSList", { divided: true }, rows.map((r) => U("DSList.Item", { content: r }))), total, btn(c === "CART" ? "Go to checkout" : "Pay $105.73", "PRIMARY", "SOLID")], "MD");
}

function checkoutSteps(b: Brief): Tree {
  const f = form([field("Name on the card", input("Dana Lee")), field("Billing email", input("dana@lumenlabs.example"))], "Continue");
  return sec([feat({ title: "Checkout", description: "Four steps, one form each." }), U("DSStepper", { items: [{ key: "a", label: "Details", taskState: "DONE" }, { key: "b", label: "Payment", taskState: "WORKING" }, { key: "c", label: "Review" }, { key: "d", label: "Done" }], activeKey: "b", type: "NUMBER" }), f], "MD");
}

function footer(b: Brief, c: string): Tree {
  const l = (label: string, href: string): Tree => U("DSLink", { label, size: "SM", tone: "QUIET", anchor: { href } });
  const list = (title: string, rows: Array<[string, string]>): Tree => U("DSList", { title, size: "SM", flush: true }, rows.map(([t, h]) => U("DSList.Item", { content: l(t, h) })));
  const brand = col([U("DSItem", { pageLevel: "CONTENT", title: b.org, media: { mtype: "ICON", node: "ZAP", color: "PRIMARY" } }), txt(b.promise, "CONTENT_MD", { tone: "MUTED" })], "XS");
  const legalLinks = ["Privacy", "Terms", "Status", "X", "LinkedIn", "GitHub"].map((t) => U("DSLink", { label: t, size: "SM", tone: "MUTED", anchor: { href: `#${t.toLowerCase()}` } }));
  const legal = { place: "row", gap: "MD", wrap: true, justify: "between", children: [txt(b.legal, "CONTENT_MD", { tone: "MUTED" }), { place: "row", gap: "MD", wrap: true, children: legalLinks }] };
  const kids: unknown[] = [brand];
  if (c !== "SHORT") {
    const lists = b.groups.map(([k, t, pages]) => list(t, [["Overview", `#${k}`], ...pages.map((p): [string, string] => [p, `#${p.toLowerCase().replace(/ /g, "-")}`])]));
    const contact = [list("Contact", b.emails.map((a): [string, string] => [a, `mailto:${a}`])), row([U("DSButton", { label: "Get in touch", variant: "OUTLINE", size: "SM", anchor: { href: "#contact" } })])];
    const cellsOf = [[lists[0]], [lists[1]], [lists[2], lists[4]], [lists[3], ...contact]];
    kids.push({ place: "grid", gap: "LG", columns: { desktop: 4, tablet: 2, mobile: 2 }, children: cellsOf.map((cell) => col(cell, "LG")) });
  }
  kids.push(U("DSSeparator", {}), legal);
  return U("DSSectionContainer", { size: "XS", color: "BASE" }, [col(kids, "LG")]);
}

/** The recipe of a kind and case for a site brief, or null where the language holds none. */
export function siteContainer(kind: string, caseCode: string, b: Brief): Tree | null {
  const c = caseCode;
  switch (kind) {
    case "HERO": return hero(b, c);
    case "STATEMENT": return statement(b, c);
    case "POINTS": return points(b, c);
    case "STEPS": return steps(b, c);
    case "SHOW_IT": return showIt(b, c);
    case "REAL_SAMPLE": return realSample(b, c);
    case "CHOOSE_TO_SEE": return choose(b, c);
    case "DOORS": return doorsKind(b, c);
    case "FEATURE_GRID": return featureGridKind(b, c);
    case "NUMBERS": return numbers(b, c);
    case "QUESTIONS": return questions(b, c);
    case "CLOSING_CALL": return closing(b, c);
    case "FOOTER": return footer(b, c);
    case "HIGHLIGHT": return highlight(b, c);
    case "READING_COLUMN": return c ? reading(b, c) : articleBody(b);
    case "RECORDS": return records(b, c);
    case "PLANS": return plans(b);
    case "COMPARE": return compare(b, c);
    case "TESTIMONIALS": return testimonials(b, c);
    case "PEOPLE": return people(b, c);
    case "ENQUIRY": return enquiry(b, c);
    case "LOCATIONS": return locations(b, c);
    case "FIND": return find(b, c);
    case "DEALS": return deals(b);
    case "SPECIFICATIONS": return specifications(b);
    case "OPTIONS": return options(b);
    case "SYLLABUS": return syllabus(b);
    case "OWNER": return owner(b);
    case "POLICIES": return policies(b);
    case "ORDER": return order(b, c);
    case "CHECKOUT_STEPS": return checkoutSteps(b);
    default: return null;
  }
}
export { DOORS_SURFACE, GRID };
