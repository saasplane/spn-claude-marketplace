// The container recipes of the site categories (MARKETING, MARKETPLACE, RESOURCES): one recipe for each kind, each case a form of it, drawn with
// the words of the category's brief. A recipe returns the section's node, or null where the language has no recipe for that kind or case, and
// the caller then draws the kind from its catalogue description.
import { DOORS_SURFACE, GRID, U, act, bare, dsAtLeast, dsHas, quote, badge, btn, cells, col, doors, eyebrow, feat, fitem, grid, item, lines, link, muted, row, sec, slot, table, txt, vl } from "./kit.ts";
import { bannerOf, coverOf, currencyOf, drawing, faceMedia, faceOf, personNamed, firstItem, logoOf, orgIn, orgNamed, personByKey, recordByKey, sellerOrg, subjects, teacherOf, wideOf } from "./media.ts";
import type { Brief, Line } from "./words.ts";
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
/** The page kind being drawn, so a hero says what its own page says; empty where a container is drawn alone. */
let pageNow = "";
// a page that orders a shelf twice draws two different shelves, one for each turn, never the same pair twice
let shelfTurn = 0;
export const setPage = (code: string): void => { pageNow = code; shelfTurn = 0; };

/** A picture the language draws at a path of its assets, or the labelled slot where it holds none. */
const pic = (path: string | undefined, label: string, ratio: string): Tree => drawing(path, label, ratio) ?? slot(label, ratio);

function hero(b: Brief, c: string): Tree {
  const own = b.pageHeroes?.[pageNow];
  const base = own ? { title: own[0], description: own[1] } : { title: b.claim, description: b.claim2 };
  const words = own ? { ...base, actions: [act("main", own[2], "#doors", true), act("second", own[3], "#docs")] } : { ...base, actions: cta(b), facts: factsOf(b) };
  switch (c) {
    case "ON_SCENE": return b.pictures?.scene && drawing(b.pictures.scene, b.picture.hero, "16:7") ? sec([feat({ ...words, textAlign: "START" }, "PAGE")], "XL", "BASE", { mediaNode: drawing(b.pictures.scene, b.picture.hero, "16:7"), mediaScrim: "START" }) : sec([feat({ ...words, textAlign: "START" }, "PAGE")], "XL", "BASE", { mediaNode: bare("scene", "16:7"), pattern: "DOTS", fadedEdges: true });
    case "UNDER": return sec([feat({ ...words, type: "MEDIA_BOTTOM", textAlign: "START", frames: ["MEDIA"], surface: SURFACE_RAISED, mediaNode: slot("The whole product, wide", "16:7") }, "PAGE")], "LG");
    case "BACKDROP": return sec([feat({ ...words, type: "BACKDROP", mediaNode: bare("backdrop-photo", "16:7") }, "PAGE")], "LG");
    case "WORDS_ALONE": return sec([feat({ ...base, actions: cta(b), textAlign: "CENTER" }, "PAGE")], "LG");
    case "ARTICLE_HEAD": return sec([feat({ eyebrow: eyebrow("Guide"), title: b.article.title, description: b.article.lede, facts: [{ mtype: "TEXT", text: b.article.by, startIcon: "USER" }, { mtype: "TEXT", text: b.article.date, startIcon: "CALENDAR" }] }, "PAGE")], "LG");
    case "FORM_BESIDE": return sec([feat({ type: "SPLIT_END", eyebrow: badge("Live webinar", "PRIMARY", "SOLID"), title: "Ship a new app in a week", description: "Watch a team go from an empty folder to a signed-in, role-aware app, live on 12 December at 16:00 IST. Bring a question.", facts: [{ mtype: "TEXT", text: "12 December 2026", startIcon: "CALENDAR" }, { mtype: "TEXT", text: "60 minutes with Q&A", startIcon: "CLOCK" }], contentNode: form([field("Name", input("Dana Lee")), field("Work email", input("dana@northwind.example"))], "Register", "We send the link and the recording the same day.") }, "PAGE")], "LG");
    case "ITEM_HEAD": {
      const r = b.records[0];
      const item = firstItem();
      const cover = coverOf(typeof item?.key === "string" ? item.key : r[3]);
      return sec([feat({ type: "SPLIT_START", eyebrow: badge("Bestseller", "PRIMARY", "SOLID"), title: r[0], description: `${r[1]} Sold by a verified seller, who answers questions within two working days.`, facts: [{ mtype: "TEXT", text: "4.8 (2,310 ratings)", startIcon: "CHECK" }, { mtype: "TEXT", text: "Last updated 3 November 2026", startIcon: "CALENDAR" }], mediaNode: cover?.node ?? slot(`${r[0]}, gallery`, "16:9"), actions: [act("buy", `Buy for ${r[2]}`, "#buy", true), act("save", "Save for later", "#save")] }, "PAGE")], "LG");
    }
    case "BRAND_HEAD": {
      const org = sellerOrg();
      const seller = typeof org?.name === "string" ? org.name : "Kite Studio";
      const about = typeof org?.about === "string" ? org.about : "A two-person studio in Pune that builds audit and reporting add-ons, verified since March 2025.";
      return sec([feat({ type: "SPLIT_START", eyebrow: eyebrow("Seller", "OUTLINE", "DEFAULT"), title: seller, description: about, facts: [{ mtype: "TEXT", text: "4.9 across 312 reviews", startIcon: "CHECK" }, { mtype: "TEXT", text: "14 listings", startIcon: "LIST" }], mediaNode: bannerOf(org) ?? slot(`${seller}, logo`, "1:1"), actions: [act("follow", "Follow", "#follow", true), act("ask", "Ask a question", "#ask")] }, "PAGE")], "LG");
    }
    case "SLIDES": return sec([feat({ ...words, textAlign: "START" }, "PAGE")], "LG", "BASE", { mediaNode: bare("slides-first", "16:7"), mediaScrim: "START" });
    default: return sec([feat({ ...words, type: "SPLIT_END", eyebrow: own ? undefined : eyebrow(b.heads?.heroTag ?? b.nav[1][0], "SOLID", "PRIMARY"), frames: ["MEDIA"], surface: SURFACE_RAISED, mediaNode: (pageNow === "MARKET_CATEGORY" ? subjects().find((one) => one.name === own?.[0])?.picture : null) ?? pic(b.pictures?.hero, b.picture.hero, "4:3") }, "PAGE")], "LG");
  }
}

// ---- the sections of a page's argument
const statement = (b: Brief, c: string): Tree => sec([feat({ textAlign: "CENTER", title: c === "LEAD_IN" ? "Find the page written for you" : b.problem, description: c === "LEAD_IN" ? "The sections below answer different readers. Pick by the question you are asking, and go straight to your own." : b.problem2, facts: c === "LEAD_IN" ? undefined : b.facts })], "MD");

function points(b: Brief, c: string): Tree {
  const [pt, pd] = b.heads?.points ?? ["What each team gets on day one", "Three things an admin does most, each done once for the whole organization instead of once per app."];
  const words = { title: pt, description: pd };
  const nodes = b.points.map(iconLine);
  switch (c) {
    case "HEAD_ACROSS": return sec([feat({ ...words, textAlign: "START" }), grid(nodes.map((n) => feat({ title: n.title, description: n.description, media: n.media }, "WIDGET")), 3, 3, 1)], "MD");
    case "BESIDE_A_PICTURE": return sec([feat({ ...words, type: "ITEMS_SPLIT_END", verticalAlign: "TOP", items: lines(nodes), mediaNode: slot("The three points at work", "4:3") })], "MD");
    default: return sec([feat({ ...words, textAlign: "START", items: cells(nodes, 3) })], "MD");
  }
}

function steps(b: Brief, c: string): Tree {
  const [st, sd] = b.heads?.steps ?? ["Four steps, in this order", "Each step says why before it says what to press, so nobody follows a click path they do not understand."];
  const words = { title: st, description: sd };
  if (c === "A_ROW") return sec([feat({ ...words, textAlign: "START" }), U("DSStepper", { items: b.steps.map((s, i) => ({ key: s[0], label: s[1], taskState: i < 2 ? "DONE" : i === 2 ? "WORKING" : undefined })), activeKey: b.steps[2][0], type: "NUMBER" })], "MD");
  if (c === "HEAD_ACROSS") return sec([feat({ ...words, textAlign: "START" }), grid(b.steps.map((s, i) => feat({ title: `${i + 1}. ${s[1]}`, description: s[2] }, "WIDGET")), 4, 2, 1)], "MD");
  return sec([feat({ ...words, type: "SPLIT_END", verticalAlign: "TOP", items: lines(b.steps.map(stepLine), true), mediaNode: slot("Member, role, permissions, app screens", "4:3") })], "MD");
}

function showIt(b: Brief, c: string): Tree {
  const [st, sd] = b.heads?.show ?? ["One role, held in every app", "Add a member to the one list for the whole organization, give the member a role, and every app reads it."];
  const words = { eyebrow: eyebrow(b.nav[0][0]), title: st, description: sd, actions: [act("go", `Open ${b.org}`, "#open")] };
  switch (c) {
    case "UNDER": return sec([feat({ ...words, type: "MEDIA_BOTTOM", frames: ["MEDIA"], surface: { raised: true, elevation: "MD" }, mediaNode: pic(b.pictures?.show, `${b.picture.show}, full width`, "16:8") })], "MD");
    case "SEVERAL_PICTURES": return sec([feat({ ...words, type: "MEDIA_BOTTOM", frames: ["MEDIA"], surface: { raised: true, elevation: "MD" }, contentNode: U("DSToggleGroup", { options: [{ value: "list", label: "The list" }, { value: "page", label: "The page" }, { value: "log", label: "History" }], valueLink: vl("list") }), mediaNode: slot(`First picture: ${b.picture.show}`, "16:8") })], "MD");
    default: return sec([feat({ ...words, type: "SPLIT_END", items: lines(b.points.slice(0, 2).map(iconLine)), frames: ["MEDIA"], surface: { raised: true, elevation: "MD" }, mediaNode: pic(b.pictures?.show, b.picture.show, "4:3") })], "MD");
  }
}

function realSample(b: Brief, c: string): Tree {
  const code = U("DSCodeBlockView", { filename: b.code.file, language: b.code.language, showLineNumbers: true, bordered: true, code: b.code.text });
  const [st, sd] = b.heads?.sample ?? ["What a role grant holds", "A grant names the member, the role and the organization, and nothing else. The values here are samples."];
  const words = { eyebrow: eyebrow("A real sample"), title: st, description: sd };
  if (c === "UNDER") return sec([feat({ ...words, type: "MEDIA_BOTTOM", mediaNode: code })], "MD", "DEFAULT", { inset: true });
  if (c === "RUNNING_EXAMPLE") return sec([feat({ ...words, title: "Run it and see the result", type: "SPLIT_END", verticalAlign: "TOP", mediaNode: col([code, U("DSAlert", { color: "SUCCESS", text: "The role is in force", description: "Every app reads it on the next page." })], "SM") })], "MD", "DEFAULT", { inset: true });
  return sec([feat({ ...words, type: "SPLIT_END", verticalAlign: "TOP", mediaNode: code })], "MD", "DEFAULT", { inset: true });
}

function choose(b: Brief, c: string): Tree {
  const tog = U("DSToggleGroup", { options: b.choose.map(([label], i) => ({ value: `c${i}`, label })), valueLink: vl("c0") });
  return sec([feat({ title: "Which one is you?", description: "Pick the part you play, and see what it does for you from your first day.", contentNode: tog, type: c === "UNDER" ? "MEDIA_BOTTOM" : "SPLIT_END", mediaNode: slot(`${b.choose[0][1]} (a press swaps the picture)`, c === "UNDER" ? "16:8" : "4:3") })], "MD");
}

/** A door that shows a picture, its icon, a title, a line and a link: the card of a section that opens other pages. */
const doorCard = (b: Brief, l: Line): Tree | null => {
  const picture = drawing(b.pictures?.doors?.[l[0]], l[1], "8:5");
  if (!picture) return null;
  return U("DSCardWidget", { parts: [{ mtype: "MEDIA", key: "pic", node: picture }, { mtype: "FREE", key: "body", node: col([U("DSItem", { pageLevel: "WIDGET", title: l[1], description: l[2], media: l[3] ? { mtype: "MARK", icon: l[3] } : undefined }), link(`See ${l[1].toLowerCase()}`, `#${l[0]}`)], "SM") }] });
};
/** The subjects of a marketplace as tiles: each draws its picture, its name and its line, and opens its page. */
const subjectTiles = (): Tree | null => {
  const list = subjects().filter((one) => one.picture);
  if (!list.length) return null;
  return sec([feat({ title: "Browse by subject", description: "Each subject opens its own page of courses and workshops, from the people who teach it." }), grid(list.map((one) => U("DSCardWidget", { parts: [{ mtype: "MEDIA", key: "pic", node: one.picture }, { mtype: "FREE", key: "body", node: col([U("DSItem", { pageLevel: "WIDGET", title: one.name, description: one.line, media: one.icon ? { mtype: "MARK", icon: one.icon } : undefined }), link(`See ${one.name.toLowerCase()}`, `#${one.key}`)], "SM") }] })), 3, 2, 1)], "MD", "BASE", { id: "doors" });
};

function doorsKind(b: Brief, c: string): Tree {
  const [dt, dd] = b.heads?.doors ?? ["Where each part lives", "Open the part you need, or start with the first and add the rest when your team is ready."];
  const head = { title: dt, description: dd };
  const nodes = b.doors.map((l) => asItem(l, `#${l[0]}`));
  const cards = b.doors.map((l) => doorCard(b, l));
  if (cards.length && cards.every((one) => one !== null) && (c === "" || c === "GRID" || c === "DOORS")) return sec([feat(head), grid(cards as Tree[], Math.min(cards.length, 3), 2, 1)], "MD", "BASE", { id: "doors" });
  switch (c) {
    case "DOOR_ROWS": return sec([feat({ ...head, items: lines(nodes) })], "MD", "BASE", { id: "doors" });
    case "CHILD_SECTION_WITH_PARTS": return sec([feat({ type: "ITEMS_SPLIT_END", verticalAlign: "TOP", title: b.groups[0][1], description: `Each part of ${b.groups[0][1].toLowerCase()} opens on its own page.`, items: lines(b.groups[0][2].map((p, i) => fitem(`c${i}`, p, "A short line about what the page holds.", "ARROW_RIGHT", `#${p.toLowerCase()}`))), mediaNode: slot(`${b.groups[0][1]}, in one picture`, "4:3"), actions: [act("go", `See ${b.groups[0][1].toLowerCase()}`, "#go", true)] })], "MD");
    case "CHILD_SECTION_WITH_POINTS": return sec([feat({ type: "SPLIT_END", verticalAlign: "TOP", title: b.groups[1][1], description: `What ${b.groups[1][1].toLowerCase()} gives you, in three points.`, items: lines(b.points.map((p) => fitem(p[0], p[1], p[2]))), mediaNode: slot(`${b.groups[1][1]}, in one picture`, "4:3"), actions: [act("go", `See ${b.groups[1][1].toLowerCase()}`, "#go", true)] })], "MD", "DEFAULT", { inset: true });
    case "NEXT_TOPIC": return sec([feat({ textAlign: "CENTER", title: `You have seen how ${b.points[1][1].toLowerCase()}`, description: "Next, see how a member signs in once for every app, then reads the same role in each one.", actions: [{ ...act("next", "Next: One sign-in", "#next", true), endIcon: "ARROW_RIGHT" }, act("demo", "See the demo", "#demo")] })], "SM");
    case "WAY_BACK": return sec([feat({ textAlign: "CENTER", title: "We could not find that page", description: "The address may have changed. Go back to the start, or tell us what you were looking for.", actions: [act("home", "Back to home", "#home", true), act("touch", "Get in touch", "#contact")] }, "PAGE")], "LG");
    case "PREVIOUS_AND_NEXT": return sec([{ place: "row", gap: "MD", justify: "between", children: [btn("Previous: Invite a member", undefined, "OUTLINE", "ARROW_LEFT"), btn("Next: Assign a role", "PRIMARY", "SOLID")] }], "SM");
    case "LINK_GROUPS": return sec([feat({ title: "Browse the listings by group", description: "Each group opens its own set of listings, so you can start from the kind of thing you need and narrow down from there.", items: cells(b.groups.slice(0, 3).map((g) => fitem(g[0], g[1], g[2].join(", "), undefined, `#${g[0]}`)), 3) })], "MD");
    default: return sec([feat({ ...head, items: doors(nodes, 3) })], "MD", "BASE", { id: "doors" });
  }
}

function featureGridKind(b: Brief, c: string): Tree {
  if (c === "INTEGRATIONS") return featureGrid({ title: "Works with what you use", description: "Each mark opens the page that shows how it works with the product, step by step." }, b.marks.slice(0, 4).map((m) => U("DSItemCard", { card: {}, item: { title: m, description: "Open the guide", media: { mtype: "MARK", text: m.slice(0, 2).toUpperCase() }, pageLevel: "WIDGET" } })), 4, 2, 1);
  if (c === "CONTENTS") return featureGrid({ title: "What is in the course", description: "Twenty-nine short lessons in six modules, six hours and twenty minutes in all, each ending with a check." }, [feat({ title: "The modules", description: "Take them in order; each ends with a short check.", contentNode: U("DSAccordionGroup", { bordered: true, options: ["Why roles belong to the member", "Designing a role", "Granting and revoking", "Reading roles in an app"].map((t, i) => ({ key: `m${i}`, header: `${t} · ${4 + i} lessons`, content: "Short lessons, each with a check at the end.", expanded: i === 0 })) }) }, "GROUP")], 1, 1, 1);
  if (b.features?.length) {
    const [ft, fd] = b.featuresHead ?? ["What is in the set", "The parts every account starts with."];
    const cardOf = (l: Line): Tree => {
      const picture = drawing(b.pictures?.features?.[l[0]], l[1], "8:5");
      const body = col([U("DSItem", { pageLevel: "WIDGET", title: l[1], description: l[2], media: l[3] ? { mtype: "MARK", icon: l[3] } : undefined }), link("Learn more", `#${l[0]}`)], "SM");
      return U("DSCardWidget", { parts: [...(picture ? [{ mtype: "MEDIA", key: "pic", node: picture }] : []), { mtype: "FREE", key: "body", node: body }] });
    };
    return sec([feat({ title: ft, description: fd }), grid(b.features.map(cardOf), 3, 2, 1)], "MD");
  }
  const tiles = subjectTiles();
  if (tiles) return tiles;
  const icons = ["KEY", "USERS", "SHIELD", "GLOBE", "LIST", "CREDIT_CARD"];
  const six = [["One sign-in", "One identity for every app, whichever provider your team uses."], ["One member list", "Everyone in the organization, in one place, whatever app they open."], ["Roles set once", "A role is set on the member, and every app reads it."], ["Public sites", "Pages that show before sign-in, drawn from the same blocks."], ["A kept history", "Each change is stored with its author and the time it happened."], ["One invoice", "One plan and one bill for the organization, however many apps."]];
  return featureGrid({ title: "What is in the set", description: "Six parts that every app starts with, so no team builds the same one twice." }, six.map(([t, d], i) => feat({ title: t, description: d, media: { mtype: "MARK", icon: icons[i] } }, "WIDGET")));
}

function numbers(b: Brief, c: string): Tree {
  if (c === "WITH_FACTS") return sec([feat({ textAlign: "START", title: "Founded to end the rebuild", description: "Two founders began in 2022, and the team has grown to thirty-eight people since, still working from Pune.", facts: [{ mtype: "TEXT", text: "2022", label: "Founded" }, { mtype: "TEXT", text: "Pune", label: "Where" }, { mtype: "TEXT", text: "38", label: "People" }], items: { type: "STATS", nodes: b.numbers.map(([n, d], i) => ({ key: `n${i}`, title: n, description: d })) } })], "MD");
  const [nt, nd, ns] = b.heads?.numbers ?? ["Teams already build this way", "Figures from our customer survey of the last twelve months, across every organization that takes part.", "Source: customer survey, October 2026, 120 organizations."];
  return sec([feat({ textAlign: "CENTER", title: c === "TRUST" ? "Trusted by buyers and sellers alike" : nt, description: nd, items: { type: "STATS", nodes: b.numbers.map(([n, d], i) => ({ key: `n${i}`, title: n, description: d })) } }), { place: "row", justify: "center", children: [muted(ns, "CONTENT_XS")] }], "MD");
}

const questions = (b: Brief, c: string): Tree => sec([feat({ textAlign: "CENTER", title: c === "ASKED" ? "Asked by buyers before they pay" : "What people ask before they start", contentNode: U("DSAccordionGroup", { bordered: true, options: b.qa.map(([q, a], i) => ({ key: `q${i}`, header: q, content: a, expanded: i === 0 })) }) })], "MD", "BASE", { width: "NARROW" });

function closing(b: Brief, c: string): Tree {
  const base = { title: b.closing.title, description: b.closing.description };
  const a = [act("start", b.closing.cta, "#start", true), act("docs", b.closing.second, "#more")];
  const look = ["SM", "PRIMARY", { strength: "SUBTLE", inset: true }] as const;
  const section = (kids: Tree[]) => sec(kids, look[0], look[1], look[2]);
  if (c === "BESIDE") return section([feat({ ...base, type: "SPLIT_END", actions: a, mediaNode: pic(b.pictures?.closing, "The product on its first day", "4:3") })]);
  if (c === "WITH_FORM") return section([feat({ textAlign: "CENTER", title: "Get the first look", description: "Leave your email and we write the day the next release opens, with what it does and how to try it.", contentNode: U("DSInput", { name: "email", type: "EMAIL", placeholder: "you@company.com", valueLink: vl("") }), actions: [act("join", "Keep me posted", "#join", true)] })]);
  if (c === "WITH_HIGHLIGHT") return section([feat({ ...base, textAlign: "CENTER", actions: a }), feat({ frames: ["TEXT"], surface: { color: "PRIMARY", strength: "SUBTLE", raised: true, elevation: "MD" }, textAlign: "CENTER", title: "See every page of the foundation", description: "One page shows each part, drawn from the real units, so you can check every claim yourself.", actions: [act("show", "View the Showcase", "#showcase", true)] }, "WIDGET")]);
  if (c === "STILL_NEED_HELP") return sec([feat({ textAlign: "CENTER", title: "Still need help?", description: b.closing.description, actions: a })], "SM", "DEFAULT", { inset: true });
  return section([feat({ ...base, textAlign: "CENTER", actions: a })]);
}

function highlight(b: Brief, c: string): Tree {
  if (c === "A_CALL_TO_ONE_PAGE") return sec([feat({ frames: ["TEXT"], surface: { color: "PRIMARY", strength: "SUBTLE", raised: true, elevation: "MD" }, textAlign: "CENTER", title: "See every page of the foundation", description: "One page shows each part, drawn from the real units, so you can check every claim yourself.", actions: [act("show", "View the Showcase", "#showcase", true)] })], "MD");
  return sec([feat({ frames: ["TEXT", "MEDIA"], surface: { raised: true, elevation: "MD", lit: true }, type: "SPLIT_END", eyebrow: eyebrow("Proof"), title: "One change, nine apps, one minute", description: "This is the result from one organization on the Team plan, read from its own audit view the same day.", mediaNode: pic(b.pictures?.proof, b.picture.proof, "4:3") })], "MD");
}

function reading(b: Brief, c: string): Tree {
  const kids: unknown[] = [];
  if (c === "TITLE_AND_COLUMN") kids.push(feat({ title: "How we keep your data private", description: "This notice says what we collect, why we keep it, and who can read it. We last changed it on 1 March 2026." }, "PAGE"));
  kids.push(
    txt("A role is set once, on the member. Every app reads the same role, so a change reaches all of them together, and nobody has to repeat it nine times.", "CONTENT_LG"),
    txt("Where a role lives", "TITLE_LG", { element: "h2" }),
    txt("Each app asks the foundation which screens the role allows. The app never keeps its own copy of the role, which is why a member removed on Monday morning cannot open anything by lunch."),
    txt("A role is a name for a set of permissions. Editor can change content and sites; Viewer can read them; Owner can also change billing and invite other owners."),
    U("DSAlert", { color: "INFO", text: "A role carries a set of permissions, never one permission alone." }),
    txt("What a grant looks like", "TITLE_LG", { element: "h2" }),
    txt("A grant names the member, the role and the organization, and nothing else. This one gives Dana Lee the Editor role in Lumen Labs."),
    U("DSCodeBlockView", { filename: b.code.file, language: b.code.language, bordered: true, code: b.code.text }),
    txt("What to check afterwards", "TITLE_LG", { element: "h2" }),
    txt("Sign in as the member and open each app. The screens the role allows show, and the ones it does not allow are gone, not greyed out. The change also appears in the audit history, with your name and the time."),
  );
  return sec(c === "TITLE_AND_COLUMN" ? [kids[0], col(kids.slice(1), "LG")] : [col(kids, "LG")], "MD");
}

function articleBody(b: Brief): Tree { return reading(b, "COLUMN"); }

const recordCard = (r: [string, string, string] | [string, string, string, string?], form = "VERTICAL"): Tree => {
  const cover = coverOf(r[3]);
  if (!cover) return plainRecordCard(r, form);
  const rec = recordByKey(r[3] as string);
  const author = typeof rec?.person === "string" ? personByKey(rec.person) : null;
  const facts = [...cover.facts, typeof rec?.date === "string" ? rec.date : r[2]].filter((one) => typeof one === "string" && one.length > 0) as string[];
  const media = author ? faceMedia(String(author.name), 28) : null;
  return U("DSCardWidget", { parts: [{ mtype: "MEDIA", key: "cover", node: cover.node }, { mtype: "FREE", key: "body", node: col([U("DSItem", { pageLevel: "WIDGET", title: r[0], description: r[1], facts }), ...(media ? [U("DSItem", { pageLevel: "CONTENT", title: String(author?.name), media })] : [])], "SM") }] });
};
const plainRecordCard = (r: [string, string, string] | [string, string, string, string?], form = "VERTICAL"): Tree => U("DSItemCard", { card: {}, item: { title: r[0], description: r[1], media: { mtype: "MARK", icon: "FILE" }, facts: [r[2]], pageLevel: "WIDGET", orientation: form } });
const paging = (total = 48, per = 6): Tree => U("DSPagination", { totalRecords: total, valueLink: vl({ page: 1, recordsPerPage: per }) });
// The search of one section's records, a shelf's or a seller's: an open bar of one field at the content's width; only the
// head of a page of results is folded.
const resultsBar = (b: Brief, label = "Search"): Tree => searchBar(b, "FREE_TEXT") ?? U("DSFilterBar", { fields: [{ mtype: "TEXT", key: "q", label, placeholder: label, primary: true, valueLink: vl("") }] });

function records(b: Brief, c: string): Tree {
  const [rt, rd] = b.heads?.records ?? ["Everything written, newest first", "Notes from the team on roles, sign-in, sites and billing, each written by the person who built the part."];
  const head = feat({ title: rt, description: rd });
  // a run of cards is one grid placed in the section, so the gap between its rows is the grid's own and not a section's padding twice
  const gridOf = (list: Array<[string, string, string, string?]>, d = 3): Tree => grid(list.map((r) => recordCard(r)), d, 2, 1);
  switch (c) {
    case "FEATURED_FIRST": return sec([head, grid(b.records.slice(0, 2).map((r) => recordCard(r)), 2, 2, 1), gridOf(b.records.slice(2, 5)), paging()], "MD");
    case "BY_SHELF": {
      const turn = shelfTurn++ % 2;
      const title = turn === 0 ? (b.heads?.shelves?.[0] ?? "Most read this month") : (b.heads?.shelves?.[1] ?? "Newly added this week");
      return sec([feat({ title, actions: [act(`all${turn}`, "See all", "#all")] }), gridOf(b.records.slice(turn * 3, turn * 3 + 3))], "MD");
    }
    case "FILTERED": {
      const f = [{ mtype: "TEXT", key: "q", label: "Search", placeholder: "Search 48 listings", primary: true, valueLink: vl("") }, ...[["topic", "Topic", ["Roles", "Sign-in", "Sites", "Billing"]], ["level", "Level", ["Beginner", "Intermediate", "Advanced"]], ["price", "Price", ["Free", "Paid"]]].map(([k, l, o]) => ({ mtype: "SELECT", key: k, label: l, options: (o as string[]).map((x) => ({ key: x.toLowerCase(), label: x })), valueLink: vl(null) }))];
      return sec([feat({ title: "Find the one for you", description: "Narrow the list by topic, level or price, and sort it the way you like." }), U("DSFilterBar", { fields: f }), gridOf(b.records), paging(48, 9)], "MD");
    }
    case "A_TO_Z": return sec([head, resultsBar(b), U("DSList", { divided: true }, [...b.records].sort((x, y) => x[0].localeCompare(y[0])).map((r) => U("DSList.Item", { content: item(r[0], r[1], "CONTENT") }))), paging()], "MD");
    case "DATED_FEED": return sec([head, U("DSList", { divided: true }, b.records.map((r) => U("DSList.Item", { content: item(r[0], r[1], "CONTENT", muted(r[2])) }))), paging()], "MD");
    case "PAGED_LIST": return sec([head, resultsBar(b), U("DSList", { divided: true }, b.records.map((r) => U("DSList.Item", { content: item(r[0], r[1], "CONTENT", btn(null, undefined, "GHOST", "ARROW_RIGHT", `Open ${r[0]}`)) }))), paging()], "MD");
    case "LIST_AND_PANE": return sec([head, grid([U("DSList", { divided: true }, b.records.slice(0, 4).map((r) => U("DSList.Item", { content: item(r[0], r[1], "CONTENT") }))), feat({ title: b.records[0][0], description: b.records[0][1], eyebrow: eyebrow(b.records[0][2]), type: "MEDIA_TOP", mediaNode: slot(`${b.records[0][0]}, preview`, "16:9"), actions: [act("open", "Open it", "#open", true)] }, "WIDGET")], 2, 1, 1)], "MD");
    default: return sec([head, resultsBar(b), gridOf(b.records), paging()], "MD");
  }
}

/** The plan cards of a pricing page: a Monthly and Annual switch with the saving, the plan most teams pick raised with its badge, a big price with its period, a tick list of what the plan holds and one full-width button. */
const SAVING = 20;
function plans(b: Brief): Tree {
  const money = (value: number): Tree => U("DSFormatCurrency", { value, currencyCode: currencyOf() });
  const annual = (price: number): number => Math.round(price * (100 - SAVING) / 100);
  const card = (p: Brief["plans"][number]): Tree => {
    const rec = !!p.recommended;
    return U("DSCardWidget", {
      surface: rec ? { raised: true, elevation: "LG", lit: true } : { raised: false, elevation: "MD" },
      header: { title: p.name, description: p.line },
      parts: [
        ...(rec ? [{ mtype: "FREE", key: "badge", node: badge("Most popular", "PRIMARY", "SOLID") }] : []),
        { mtype: "FREE", key: "price", node: p.price === 0 ? row([txt("Free", "HEADING_XL"), muted("for ever")], "SM") : col([row([U("DSText", { typography: "HEADING_XL" }, [{ unit: "DSFormatCurrency", props: { value: annual(p.price), currencyCode: currencyOf() } }]), muted("/ month")], "SM"), row([muted("Billed yearly, or"), money(p.price), muted("a month if you pay monthly")], "XS")], "XS") },
        { mtype: "ITEMS", key: "feats", items: p.feats.map((f, i) => ({ key: `f${i}`, title: f, media: { mtype: "ICON", node: "CHECK", color: "PRIMARY" } })) },
        { mtype: "FREE", key: "go", node: U("DSButton", { label: p.price === 0 ? "Start free" : `Choose ${p.name}`, fullWidth: true, ...(rec ? { color: "PRIMARY", variant: "SOLID" } : { variant: "OUTLINE" }), anchor: { href: "#choose" } }) },
      ],
    });
  };
  const switchBar = U("DSTabs", { type: "PILL", options: [{ key: "monthly", label: "Monthly" }, { key: "annual", label: `Annual · Save ${SAVING}%` }], activeKey: "annual" });
  return sec([feat({ eyebrow: eyebrow("Pricing", "OUTLINE", "DEFAULT"), title: "Which plan is yours?", description: "Every plan starts free to try. Change plan, or stop, whenever you like.", textAlign: "CENTER" }), row([switchBar], "SM"), grid(b.plans.map(card), Math.min(b.plans.length, 4), 2, 1)], "MD");
}

// ---- the comparison: DSComparison reads FIELD rows (its cell is a data field's value) grouped under a head, subjects in columns and each subject's actions
// in the last row. A tick is a BOOLEAN field worded "✓" and "—"; a number, a limit and a text are TEXT fields, so every cell of a row reads in one voice.
const textRow = (key: string, label: string, subjects: string[], values: string[]): Tree => ({ mtype: "FIELD", key, config: { mtype: "TEXT", key, label }, values: Object.fromEntries(subjects.map((s, i) => [s, { mtype: "TEXT", value: values[i] }])) });
const tickRow = (key: string, label: string, subjects: string[], values: string[]): Tree => ({ mtype: "FIELD", key, config: { mtype: "BOOLEAN", key, label, ...(dsAtLeast("11.28.0") ? {} : { labelTrue: "✓", labelFalse: "—" }) }, values: Object.fromEntries(subjects.map((s, i) => [s, { mtype: "BOOLEAN", value: values[i] === "yes" }])) });
const comparison = (subjects: Tree[], groups: Tree[], extra: Tree = {}): Tree => U("DSComparison", { size: "MD", subjects, groups, ...extra });

function planComparison(b: Brief): Tree {
  const rec = b.plans.findIndex((p) => p.recommended);
  const subjects = b.plans.map((p, i): Tree => ({ key: p.name.toLowerCase(), ...(i === rec ? (dsAtLeast("11.28.0") ? { title: p.name, badge: { mtype: "BADGE", text: "Recommended", color: "PRIMARY" } } : { title: `${p.name} · Recommended` }) : { title: p.name }), actions: U("DSButton", { label: p.price === 0 ? "Start free" : `Choose ${p.name}`, ...(i === rec ? { color: "PRIMARY", variant: "SOLID" } : { variant: "OUTLINE" }), anchor: { href: "#choose" } }) }));
  const keys = subjects.map((s) => s.key as string);
  const cash = (value: number): string => new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyOf(), maximumFractionDigits: 0 }).format(value);
  const price = (p: Brief["plans"][number]): string => (p.price === 0 ? "Free" : `${cash(Math.round(p.price * 0.8))} a month`);
  const groups: Tree[] = [{ key: "price", header: { title: "Price" }, rows: [textRow("price", "Billed yearly, 20% less", keys, b.plans.map(price)), textRow("monthly", "Billed monthly", keys, b.plans.map((p) => (p.price === 0 ? "Free" : `${cash(p.price)} a month`)))] }];
  b.planTable.forEach(([group, rows], g) => groups.push({ key: `g${g}`, header: { title: group }, rows: rows.map(([label, kind, values], r) => (kind === "tick" ? tickRow : textRow)(`g${g}r${r}`, label, keys, values)) }));
  return comparison(subjects, groups);
}

function compare(b: Brief, c: string): Tree {
  if (c === "PLANS") return sec([feat({ title: "What each plan holds", description: "Every row is one thing you can check before you pay, grouped by theme, with the plan most teams pick marked at its head." }), planComparison(b)], "MD");
  if (c === "ALTERNATIVES") {
    const keys = ["lumen", "app", "vendor"];
    const subjects: Tree[] = [{ key: "lumen", title: b.org }, { key: "app", title: "Building it per app" }, { key: "vendor", title: "A sign-in vendor" }];
    const groups: Tree[] = [
      { key: "build", header: { title: "Building it" }, rows: [textRow("a1", "First app live", keys, ["2 days", "6 weeks", "3 weeks"]), textRow("a2", "Each further app", keys, ["Same day", "4 weeks", "1 week"]), tickRow("a3", "One member list", keys, ["yes", "no", "no"]), tickRow("a4", "Roles set once", keys, ["yes", "no", "yes"])] },
      { key: "run", header: { title: "Running it" }, rows: [textRow("b1", "Cost for 50 members", keys, ["$49 a month", "About 1 engineer", "$250 a month"]), tickRow("b2", "Public sites included", keys, ["yes", "no", "no"]), tickRow("b3", "Audit history kept", keys, ["yes", "no", "yes"])] },
      { key: "src", header: { title: "Where each claim comes from" }, rows: [textRow("c1", "Source", keys, ["Customer survey, October 2026", "Internal estimate, 12 teams", "Vendor pricing page, 3 November 2026"])] },
    ];
    return sec([feat({ title: "This, against what you use now", description: "Each row sets it beside building the base yourself and beside a sign-in vendor, and the last row names where each claim comes from." }), comparison(subjects, groups)], "MD");
  }
  if (c === "RATES") {
    const row = (label: string, unit: string, price: number, note: string): unknown[] => [label, unit, U("DSFormatCurrency", { value: price, currencyCode: "USD" }), note];
    const head = (t: string): unknown[] => [txt(t, "TITLE_SM"), "", "", ""];
    return sec([feat({ title: "What each unit of use costs", description: "Per month, billed yearly, in dollars. Each row is one rate with the unit it is counted in, so you can add up your own bill." }), table(["Rate", "Unit", "Price", "Included in"], [head("Members"), row("Extra member", "Per member", 4, "Team and above"), row("Guest member", "Per guest", 1, "Every plan"), head("Apps"), row("Extra app", "Per app", 9, "Starter only"), row("Public site", "Per site", 12, "Team and above"), head("Add-ons"), row("SCIM provisioning", "Per organization", 99, "Business"), row("Extra audit year", "Per year kept", 29, "Team and above")])], "MD");
  }
  // marketplace: the listings a reader chose, a column each, the differences in rows, each listing's own action under it
  const L = b.listings;
  const keys = L.map((_, i) => `l${i}`);
  const subjects: Tree[] = L.map((l, i) => ({ key: keys[i], title: l.title, ...(dsAtLeast("11.28.0") ? { media: { mtype: "CUSTOM", node: slot(`Cover of ${l.title}`, "4:3") } } : {}), ...(i === 0 && dsAtLeast("11.28.0") ? { badge: { mtype: "BADGE", text: "Best rated", color: "PRIMARY" } } : {}), actions: U("DSButton", { label: `Buy for ${l.price}`, ...(i === 0 ? { color: "PRIMARY", variant: "SOLID" } : { variant: "OUTLINE" }), anchor: { href: "#buy" } }) }));
  const rows = (labels: string[]): Tree[] => labels.map((label, r) => textRow(`f${label}${r}`, label, keys, L.map((l) => l.facts[label])));
  const groups: Tree[] = [{ key: "buy", header: { title: "The listing" }, rows: [textRow("price", "Price", keys, L.map((l) => l.price)), ...rows(["Seller", "Rating"])] }, { key: "fit", header: { title: "What it needs" }, rows: rows(["Works with", "Version", "Size", "Setup"]) }, { key: "after", header: { title: "After you buy" }, rows: rows(["Updated", "Refund", "Support"]) }, { key: "inc", header: { title: "What it includes" }, rows: [tickRow("sso", "Works with single sign-on", keys, ["yes", "yes", "no"]), tickRow("audit", "Writes to the audit history", keys, ["yes", "no", "yes"]), tickRow("source", "Source code included", keys, ["no", "no", "yes"]), tickRow("trial", "Free 14-day trial", keys, ["yes", "yes", "yes"])] }];
  // where the design system draws DSSelectMulti, a reader narrows the listings to the plans they hold
  const plansHeld = dsHas("DSSelectMulti") ? [U("DSSelectMulti", { options: ["Starter", "Team", "Business", "Enterprise"].map((k) => ({ key: k.toLowerCase(), label: k })), placeholder: "Plans you hold", valueLink: vl(["team", "business"]) })] : [];
  return sec([feat({ title: "Compare these listings side by side", description: "Three add-ons side by side, row by row, with what each one costs and needs. Take one off the list or add another, up to four." }), ...plansHeld, comparison(subjects, groups)], "MD");
}

/** A customer's mark as a wide lockup, one quiet tone, 36px tall at its own width: its glyph and its name. */
const lockup = (name: string): Tree => wideOf(orgNamed(name), 44) ?? logoLockup(name);
const logoLockup = (name: string): Tree => U("DSItem", { pageLevel: "CONTAINER", title: name, media: { mtype: "MARK", text: name.slice(0, 1), shape: "ROUNDED", variant: "SUBTLE" } });

function testimonials(b: Brief, c: string): Tree {
  // a quote tied to its org: the org's logo over the words, in one card, where the data holds the org
  const quoteOf = (q: [string, string, string], card = true): Tree => {
    const org = orgIn(q[2]);
    const logo = logoOf(org, 32);
    if (!card || !logo) return quote(q[0], q[1], q[2], card);
    return U("DSCardWidget", { parts: [{ mtype: "FREE", key: "org", node: row([logo, muted(String(org?.name))], "SM") }, { mtype: "FREE", key: "quote", node: quote(q[0], q[1], q[2], false) }] });
  };
  if (c === "CUSTOMER_MARKS" || c === "MARKS" || c === "") return sec([feat({ textAlign: "START", title: "Trusted by teams like yours", description: b.logosLine }), U("DSHScroll", {}, [{ place: "row", gap: "XL", children: b.marks.slice(0, 8).map((m) => lockup(m)) }])], "MD");
  if (c === "QUOTE") return sec([feat({ title: "In their words" }), quoteOf(b.quotes[0], false)], "MD");
  if (c === "REVIEWS") return sec([feat({ title: "What buyers say about it", description: "4.8 out of 5, from 2,310 ratings, and many say it saved them a quarter of work.", items: { type: "STATS", nodes: [{ key: "a", title: "4.8", description: "average rating" }, { key: "b", title: "2,310", description: "ratings" }] } }), grid(["Ananya P.", "Marcus T.", "Lena K.", "Tomas R."].map((n, i) => U("DSItemCard", { card: {}, item: { title: n, description: b.quotes[i % 3][0], media: { mtype: "AVATAR", title: n }, facts: [`${5 - (i === 2 ? 1 : 0)} out of 5`], pageLevel: "WIDGET", orientation: "VERTICAL" } })), 2, 2, 1)], "MD");
  if (c === "STORIES") return sec([feat({ title: "How teams use it", description: "Three teams tell how they moved onto one foundation, which steps they took first, and the numbers they kept afterwards.", items: doors(b.marks.slice(0, 3).map((m, i) => fitem(`st${i}`, `${m}, in ${["a quarter", "a day", "a week"][i]}`, "How the team moved over, step by step.", "FILE", "#story")), 3) })], "MD");
  if (c === "PRESS" && b.press?.length) return sec([feat({ title: "What the press wrote about us", description: "Publications have written about us, in their own words, and each piece opens in full on its own site." }), grid(b.press.map(([key, name, headline, date]) => U("DSCardWidget", { parts: [{ mtype: "FREE", key: "logo", node: drawing(`pictures/partners/${key}-wide.svg`, `${name}, wide logo`, "5:1", { width: 150, height: 30 }) ?? txt(name, "TITLE_MD") }, { mtype: "FREE", key: "body", node: col([txt(headline, "TITLE_MD"), muted(date), link("Read the piece", `#${key}`)], "SM") }] })), 3, 1, 1)], "MD");
  if (c === "PRESS") return sec([feat({ title: "What the press wrote about us", description: "Publications and award lists have written about us, in their own words, and each piece opens in full on its own site.", items: cells(["Daily Build", "Stack Review", "Ship Weekly"].map((t, i) => fitem(`pr${i}`, t, ["A foundation that ends the rebuild.", "Sign-in, set once.", "The base every app was missing."][i], undefined, undefined, { media: { mtype: "MARK", text: t.slice(0, 2).toUpperCase() } })), 3) })], "MD");
  const [qt, qd] = b.heads?.quotes ?? ["Teams say it best", "Hear from the people who moved onto one foundation, in their own words, and what changed for them in a single quarter."];
  return sec([feat({ title: qt, description: qd }), grid(b.quotes.map((q) => quoteOf(q)), 3, 1, 1)], "MD");
}

function people(b: Brief, c: string): Tree {
  const head = { title: "The people behind it", description: "Thirty-eight people across three time zones, building one foundation for every app a team opens." };
  if (c === "AVATARS") return featureGrid(head, b.people.map(([n, r]) => U("DSItemCard", { card: {}, item: { title: n, description: r, media: { mtype: "AVATAR", title: n }, pageLevel: "WIDGET", orientation: "VERTICAL" } })), 4, 2, 1);
  return featureGrid(head, b.people.map(([n, r]) => personCard(n, r)), 4, 3, 2);
}
export const personCard = (n: string, r: string): Tree => U("DSCardWidget", { parts: [{ mtype: "MEDIA", key: "portrait", node: faceOf(personNamed(n), 240) ? { ...(faceOf(personNamed(n), 240) as Tree), width: undefined, height: undefined, ratio: "1:1" } : slot(`${n}, portrait, head and shoulders`, "4:5") }, { mtype: "FREE", key: "who", node: U("DSItem", { pageLevel: "WIDGET", title: n, description: r }) }] });

function enquiry(b: Brief, c: string): Tree {
  if (c === "REQUEST") {
    const f = form([field("Name", input("Dana Lee")), field("Work email", input("dana@northwind.example")), field("Team size", U("DSSelect", { options: ["1 to 10", "11 to 50", "51 to 200"].map((k) => ({ key: k, label: k })), valueLink: vl("11 to 50") })), field("What would you like to see?", U("DSTextarea", { valueLink: vl("How roles reach our nine apps."), rows: 4 }))], "Request a demo", "We reply within one working day, and a demo takes thirty minutes.");
    const side = feat({ title: "What happens after you ask", description: "A person from our team writes back to book a time that suits you, within one working day.", items: lines([["r1", "We read your note", "We read it first, so the demo starts from your own case."], ["r2", "We book thirty minutes", "We offer a time that suits you."], ["r3", "You see it run", "We show it running with your own apps."]].map(([k, t, d]) => ({ key: k, title: t, description: d })), true) }, "GROUP");
    return sec([feat({ title: `See ${b.org} with your own apps`, description: "Tell us a little about your apps and your team, and we show you how it fits them." }), sideBySide(f, side)], "MD");
  }
  const f = form([field("Name", input("Dana Lee")), field("Work email", input("dana@northwind.example")), field("Topic", U("DSSelect", { options: ["Sales", "Support", "Press", "Partnerships"].map((k) => ({ key: k.toLowerCase(), label: k })), valueLink: vl("sales") })), field("Message", U("DSTextarea", { valueLink: vl("We run nine apps and want one sign-in for all of them."), rows: 5 }))], "Send message", "We reply within one working day.");
  const way = (k: string, t: string, d: string, icon: string, href: string): Tree => ({ key: k, title: t, description: d, media: { mtype: "MARK", icon }, anchor: { href } });
  const ways = U("DSCardWidget", { header: { title: "Ways to reach us", description: "Write to the team that answers it, or call us." }, parts: [{ mtype: "ITEMS", key: "ways", items: [way("sales", b.emails[0], "Plans, pricing and demos", "MAIL_OPEN", `mailto:${b.emails[0]}`), way("support", b.emails[1], "Help with something you run", "MAIL_OPEN", `mailto:${b.emails[1]}`), way("phone", "+91 20 5550 0142", "Our team picks up the phone", "PHONE", "tel:+912055500142")] }], footer: txt("Monday to Friday, 9:00 to 18:00 IST", "CONTENT_SM", { tone: "MUTED" }) });
  return sec([feat({ title: "Send us a message", description: "Choose a topic, and your message goes straight to the people who answer it, not to a shared inbox." }), sideBySide(f, ways)], "MD");
}

function locations(b: Brief, c: string): Tree {
  const office = ([n, a, phone, hours]: [string, string, string?, string?]): Tree => { const view = drawing(b.pictures?.places?.[n], `${n} office`, "1:1", { width: 72, height: 72 }); return { key: `o-${n.toLowerCase()}`, title: n, description: a, media: view ? { mtype: "CUSTOM", node: view } : { mtype: "ICON", node: "GLOBE" }, facts: [hours ?? "Monday to Friday, 9:00 to 18:00", ...(phone ? [phone] : [])], endNode: link("Directions", `#directions-${n.toLowerCase()}`) }; };
  const list = (offs: Array<[string, string, string?, string?]>): Tree => feat({ items: { type: "LIST", divided: true, nodes: offs.map(office) } }, "GROUP");
  const head = feat({ title: "Come and see us in person", description: "Each office keeps a desk free for visitors, so write to us first and we will have it ready for you." });
  if (c === "MAP") return sec([head, sideBySide(list(b.places), slot(`Map with three pins: ${b.places.map((p) => p[0]).join(", ")}`, "4:5"))], "MD");
  return sec([head, list(b.places.slice(0, 2))], "MD");
}

/** The search bar the catalogue names for every site search. Where the design system draws DSSearchBar it is the bar; where it does not yet, `null` and the caller draws today's fields. */
function searchBar(b: Brief, c: string, folded = false): Tree | null {
  if (!dsHas("DSSearchBar")) return null;
  const select = (key: string, label: string, options: string[], value: string | null): Tree => ({ mtype: "SELECT", key, label, options: options.map((k) => ({ key: k.toLowerCase(), label: k })), valueLink: vl(value) });
  const what: Tree = { mtype: "TEXT", key: "q", label: "What", placeholder: `Search ${b.org}`, primary: true, valueLink: vl(b.records[0][0]) };
  if (c !== "STRUCTURED") return U("DSSearchBar", { fields: [what], folded });
  const fields: Tree[] = [what, select("price", "Price", ["Any price", "Free", "Under $50", "$50 to $150"], "any price"), { mtype: "DATE_RANGE", key: "when", label: "When", valueLink: vl({ start: null, end: null }) }, { mtype: "COUNT", key: "seats", label: "Seats", options: [{ key: "members", label: "Members", description: "Who will use it" }, { key: "admins", label: "Admins", description: "Who will manage it" }], limits: { members: { min: 1, max: 500 }, admins: { min: 1, max: 20 } }, valueLink: vl({ members: 10, admins: 2 }) }];
  const icon = (node: string): Tree => (dsAtLeast("11.28.0") ? { media: { mtype: "ICON", node } } : {});
  const scopes = { options: [{ key: "addons", label: "Add-ons", fields: ["q", "price", "seats"], ...icon("PLUG") }, { key: "courses", label: "Courses", fields: ["q", "price"], ...icon("FILE") }, { key: "workshops", label: "Workshops", fields: ["q", "when", "seats"], ...icon("CALENDAR") }], valueLink: vl("addons") };
  return U("DSSearchBar", { fields, scopes, folded });
}

function find(b: Brief, c: string): Tree {
  const head = feat({ title: c === "STRUCTURED" ? "Find the right listing for you" : "What are you looking for?", description: "Type a word, or choose a category, a price and the number of seats, and the list narrows as you go." }, "CONTAINER");
  const popular = col([txt("Popular searches", "TITLE_SM"), grid((b.heads?.popular ?? b.doors.map((d) => d[1])).map((t) => U("DSButton", { label: t, variant: "OUTLINE", size: "SM", startIcon: "SEARCH", anchor: { href: `#${t.toLowerCase().replace(/ /g, "-")}` } })), 5, 3, 2, "SM")], "SM");
  const bar = searchBar(b, c);
  const kinds = dsAtLeast("11.28.0") && b.org === "Lumen Market" ? [U("DSTabs", { options: [["addons", "Add-ons", "PLUG"], ["courses", "Courses", "FILE"], ["workshops", "Workshops", "CALENDAR"]].map(([key, label, icon]) => ({ key, label, media: { mtype: "ICON", node: icon } })), activeKey: "addons", type: "LINE" })] : [];
  if (bar) return sec([head, bar, popular], "MD");
  const auto = U("DSAutocomplete", { placeholder: `Search ${b.org}`, options: b.records.map((r) => ({ key: r[0].toLowerCase(), label: r[0] })), valueLink: vl(null) });
  const seats = dsHas("DSInputNumberGroup") ? [U("DSInputNumberGroup", { options: [{ key: "members", label: "Members", description: "Who will use it" }, { key: "admins", label: "Admins", description: "Who will manage it" }], limits: { members: { min: 1, max: 500 }, admins: { min: 1, max: 20 } }, valueLink: vl({ members: 10, admins: 2 }) })] : [];
  if (c === "STRUCTURED") return sec([head, ...kinds, grid([auto, U("DSSelect", { options: ["Add-ons", "Courses", "Workshops"].map((k) => ({ key: k, label: k })), valueLink: vl("Add-ons") }), U("DSSelect", { options: ["Any price", "Free", "Under $50"].map((k) => ({ key: k, label: k })), valueLink: vl("Any price") }), ...seats, btn("Search", "PRIMARY", "SOLID", "SEARCH")], seats.length ? 5 : 4, 2, 1)], "MD");
  return sec([head, ...kinds, auto, popular], "MD");
}

const deals = (b: Brief): Tree => sec([feat({ frames: ["TEXT", "MEDIA"], surface: { raised: true, elevation: "MD", lit: true }, type: "SPLIT_END", eyebrow: badge("Ends Sunday", "PRIMARY", "SOLID"), title: "Two courses for the price of one", description: "Buy Roles in a day and get Audit history your auditors will read free, until Sunday 29 November 2026.", mediaNode: slot("The two courses side by side", "4:3"), actions: [act("buy", "Buy both for $49", "#buy", true)] })], "MD");

function specifications(b: Brief): Tree {
  const group = (t: string, rows: string[][]): Tree => feat({ title: t, contentNode: table(["", ""], rows, false) }, "GROUP");
  return sec([feat({ title: "The full specifications of this listing", description: "What it is, what it needs and what it works with, so you can check the fit before you pay for it." }), group("What it is", [["Version", "2.4.0"], ["Updated", "3 November 2026"], ["Size", "1.2 MB"]]), group("What it needs", [["Plan", "Team or Company"], ["Apps", "Any"], ["Sign-in", "Single sign-on"]])], "MD");
}

function options(b: Brief): Tree {
  return sec([feat({ title: "Choose the option that fits", description: "Each option has its own price and its own seats, so you pay for the team you have today and not for more." }), U("DSRadioGroup", { options: [["solo", "Solo", "1 seat · $29"], ["team", "Team", "10 seats · $99"], ["studio", "Studio", "Unlimited seats · $249"]].map(([key, label, description]) => ({ key, label: `${label} · ${description}`, description: key === "team" ? "Most teams pick this" : undefined })), valueLink: vl("team") })], "MD");
}

function syllabus(b: Brief): Tree {
  return sec([feat({ title: "What is in the course", description: "Twenty-nine short lessons in six modules, each ending with a check, so you know what you have learned.", contentNode: U("DSAccordionGroup", { bordered: true, options: ["Why roles belong to the member", "Designing a role", "Granting and revoking", "Reading roles in an app", "Audit and review"].map((t, i) => ({ key: `m${i}`, header: `${t} · ${4 + i} lessons`, content: "Short lessons, each with a check at the end.", expanded: i === 0 })) }) })], "MD");
}

const sellerName = (): string => (typeof sellerOrg()?.name === "string" ? String(sellerOrg()?.name) : "Kite Studio");
const sellerLine = (): string => (typeof sellerOrg()?.city === "string" ? `${String(sellerOrg()?.city)} · seller since ${String(sellerOrg()?.since ?? "").slice(0, 4)}` : "Pune, India · seller since March 2025");

function owner(b: Brief): Tree {
  return sec([feat({ title: "Who sells this listing", description: "Every seller is verified before a listing goes live, and each seller's page shows their reviews and their other listings." }), U("DSCardWidget", { parts: [{ mtype: "FREE", key: "o", node: U("DSItem", { pageLevel: "WIDGET", title: sellerName(), description: sellerLine(), media: logoOf(sellerOrg(), 48) ? { mtype: "CUSTOM", node: logoOf(sellerOrg(), 48) } : { mtype: "AVATAR", title: sellerName() }, facts: ["4.9 across 312 reviews", "14 listings"], endNode: btn("See the seller", undefined, "OUTLINE") }) }] })], "MD");
}

function policies(b: Brief): Tree {
  return sec([feat({ title: "Refunds, delivery and licences", description: "Short answers about money back, how a purchase reaches you and who holds the licence, before you pay.", contentNode: U("DSAccordionGroup", { bordered: true, options: [["Can I get a refund?", "Yes, within 14 days, if the add-on does not do what its page says."], ["How is it delivered?", "Instantly, to your organization's Lumen account."], ["Who holds the licence?", "Your organization, for as long as it holds the add-on."]].map(([h, c], i) => ({ key: `p${i}`, header: h, content: c, expanded: i === 0 })) }) })], "MD");
}

function order(b: Brief, c: string): Tree {
  const lineOf = (r: [string, string, string], end: Tree): Tree => item(r[0], `${r[1]}`, "CONTENT", end, { media: { slot: `cover-${r[0].toLowerCase().replace(/[^a-z]+/g, "-")}`, label: `Cover of ${r[0]}`, ratio: "4:3" } });
  // the sums stand in a table of their own, the figures in one column, so the eye runs down them
  const total = table(["Your order", "Amount"], [["Subtotal, three listings", "$97.00"], ["Tax, 9%", "$8.73"], [txt("Total", "TITLE_MD"), txt("$105.73", "TITLE_MD")]]);
  const rows = b.records.slice(0, 3).map((r) => lineOf(r, c === "CART" ? row([txt(r[2], "TITLE_MD"), btn(null, undefined, "GHOST", "X", `Remove ${r[0]}`)], "SM") : txt(r[2], "TITLE_MD")));
  if (c === "RECEIPT") return sec([feat({ title: "What you ordered", description: "Order SPN-48213, paid on 27 Nov 2026 with the card ending 4242. The receipt is in your inbox, and every listing is ready to install." }), U("DSList", { divided: true }, rows.map((r) => U("DSList.Item", { content: r }))), table(["Paid", "Amount"], [["Subtotal, three listings", "$97.00"], ["Tax, 9%", "$8.73"], [txt("Total paid", "TITLE_MD"), txt("$105.73", "TITLE_MD")]])], "MD");
  return sec([feat({ title: c === "CART" ? "Your cart" : "Review your order", description: c === "CART" ? "Three listings, ready to pay for." : "Check the three listings and the total before you pay." }), U("DSList", { divided: true }, rows.map((r) => U("DSList.Item", { content: r }))), total, btn(c === "CART" ? "Go to checkout" : "Pay $105.73", "PRIMARY", "SOLID")], "MD");
}

function checkoutSteps(b: Brief): Tree {
  const f = form([field("Name on the card", input("Dana Lee")), field("Billing email", input("dana@lumenlabs.example"))], "Continue");
  return sec([feat({ title: "Checkout in four short steps", description: "Four steps, one form each: your details, the payment, a last review of the order, and then it is done." }), U("DSStepper", { items: [{ key: "a", label: "Details", taskState: "DONE" }, { key: "b", label: "Payment", taskState: "WORKING" }, { key: "c", label: "Review" }, { key: "d", label: "Done" }], activeKey: "b", type: "NUMBER" }), f], "MD");
}

function footer(b: Brief, c: string): Tree {
  const l = (label: string, href: string): Tree => U("DSLink", { label, size: "SM", tone: "QUIET", anchor: { href } });
  const list = (title: string, rows: Array<[string, string]>): Tree => U("DSList", { title, size: "SM", flush: true }, rows.map(([t, h]) => U("DSList.Item", { content: l(t, h) })));
  const brandLogo = logoOf(orgNamed(b.org), 28);
  const brand = col([U("DSItem", { pageLevel: "CONTENT", title: b.org, media: brandLogo ? { mtype: "CUSTOM", node: brandLogo } : { mtype: "ICON", node: "ZAP", color: "PRIMARY" } }), txt(b.promise, "CONTENT_MD", { tone: "MUTED" })], "XS");
  const legalLinks = ["Privacy", "Terms", "Status", "X", "LinkedIn", "GitHub"].map((t) => U("DSLink", { label: t, size: "SM", tone: "MUTED", anchor: { href: `#${t.toLowerCase()}` } }));
  // the legal line over its links: the render places a row without wrapping, so a row of the two squeezes the line on a phone
  const legal = col([txt(b.legal, "CONTENT_MD", { tone: "MUTED" }), { place: "row", gap: "MD", children: legalLinks }], "SM");
  const kids: unknown[] = [brand];
  if (c !== "SHORT") {
    const lists = b.groups.map(([k, t, pages]) => list(t, [["Overview", `#${k}`], ...pages.map((p): [string, string] => [p, `#${p.toLowerCase().replace(/ /g, "-")}`])]));
    const contact = [list("Contact", b.emails.map((a): [string, string] => [a, `mailto:${a}`])), row([U("DSButton", { label: "Get in touch", variant: "OUTLINE", size: "SM", anchor: { href: "#contact" } })])];
    // four columns of the groups the language names, a fifth group under the third, and the contact under the fourth; a
    // language with fewer groups fills fewer columns, and never draws an empty one
    const cellsOf = [[lists[0]], [lists[1]], [lists[2], lists[4]], [lists[3], ...contact]].map((cell) => cell.filter((one): one is Tree => one !== undefined)).filter((cell) => cell.length > 0);
    kids.push({ place: "grid", gap: "LG", columns: { desktop: 4, tablet: 2, mobile: 2 }, children: cellsOf.map((cell) => col(cell, "LG")) });
  }
  kids.push(U("DSSeparator", {}), legal);
  return U("DSSectionContainer", { size: "XS", color: "BASE" }, [col(kids, "LG")]);
}

// ---- the kinds the catalogue added: each is built from the pieces above, the units its entry names
const itemRows = (b: Brief): Array<[string, string, number]> => [[b.records[0][0], "Kite Studio", 48], [b.records[0][0], "Northwind Labs", 52], [b.records[0][0], "Pune Add-ons", 61]];

function offers(b: Brief): Tree {
  const rows = itemRows(b).map(([, seller, price], i) => item(seller, "Instant delivery, 14-day refund", "CONTENT", row([...(i === 0 ? [badge("Best price", "PRIMARY", "SOLID")] : []), U("DSFormatCurrency", { value: price, currencyCode: "USD" }), btn("Buy", i === 0 ? "PRIMARY" : undefined, i === 0 ? "SOLID" : "OUTLINE")], "MD"), { facts: [`${(4.9 - i / 10).toFixed(1)} across ${312 - i * 90} reviews`] }));
  return sec([feat({ title: "Offers from other sellers", description: "Each seller's price and what the buyer gets, with the seller's rating beside it, so you can pick the best offer." }), U("DSList", { divided: true }, rows.map((r) => U("DSList.Item", { content: r })))], "MD");
}

function bundle(b: Brief): Tree {
  return sec([feat({ title: "Often bought together with this one", description: "Three listings that buyers of this one also pay for, priced as a set, so you can add them in one step." }), grid(b.records.slice(0, 3).map((r) => recordCard(r)), 3, 2, 1), row([txt("All three, $103.00", "TITLE_MD"), btn("Buy the three", "PRIMARY", "SOLID")], "LG")], "MD");
}

const description = (b: Brief): Tree => sec([feat({ title: "About this listing in full", description: `${b.records[0][1]} Written by the seller, with the parts that matter first.` }), txt("A longer account of what it is, what it does for the buyer and what it asks of them, written by the seller in plain words, with the parts that matter first.", "CONTENT_MD"), btn("Show more", undefined, "GHOST")], "MD");

const notes = (b: Brief): Tree => sec([feat({ title: "Good to know before you pay", description: "Short notes to read before you pay: which plans it works with, how updates are priced and whether you need a call." }), U("DSList", { divided: true }, ["Works with the Team and Company plans.", "Updates are free for a year.", "No setup call is needed."].map((t) => U("DSList.Item", { content: txt(t) })))], "MD");

const aboutOf = (name: string, line: string): Tree => sec([feat({ type: "SPLIT_END", verticalAlign: "TOP", title: `About ${name}`, description: line, mediaNode: bannerOf(orgNamed(name), "4:3") ?? slot(`${name}, in one picture`, "4:3") })], "MD");

export const questionCard = (q: string, a: string, n: number): Tree => U("DSItem", { pageLevel: "WIDGET", title: q, description: a, facts: [`${n} found this helpful`], endNode: btn("Helpful", undefined, "OUTLINE") });
export const commentCard = (name: string, text: string): Tree => U("DSItem", { pageLevel: "WIDGET", title: name, description: text, media: { mtype: "AVATAR", title: name }, facts: ["2 days ago"], endNode: btn("Reply", undefined, "GHOST") });

function thread(b: Brief, kind: "QUESTIONS" | "COMMENTS"): Tree {
  const cards = kind === "QUESTIONS" ? b.qa.slice(0, 3).map(([q, a], i) => questionCard(q, a, 12 - i * 4)) : b.quotes.map((q) => commentCard(q[1], q[0]));
  return sec([feat({ title: kind === "QUESTIONS" ? "Questions and answers" : "Comments", description: kind === "QUESTIONS" ? "Asked by readers, and answered." : "What readers wrote under it." }), U("DSList", { divided: true }, cards.map((c) => U("DSList.Item", { content: c }))), btn(kind === "QUESTIONS" ? "Ask a question" : "Write a comment", undefined, "OUTLINE")], "MD");
}

function confirmation(b: Brief): Tree {
  return sec([feat({ textAlign: "CENTER", title: "Your order is placed", description: "We sent the receipt to dana@northwind.example, and the seller has the order and starts on it today.", items: lines([["c1", "We tell the seller", "The seller starts on it today."], ["c2", "You get it by email", "Instantly, to your organization's account."], ["c3", "You can see it any time", "Under Orders, in your account."]].map(([k, t, d]) => ({ key: k, title: t, description: d })), true), actions: [act("orders", "See your orders", "#orders", true), act("more", "Keep browsing", "#more")] })], "MD");
}

const author = (b: Brief): Tree => sec([feat({ title: "Written by this page's author", description: "The person who wrote this page, what they work on, and how to find the other pages they have written for readers." }), grid([personCard(b.people[0][0], b.people[0][1])], 4, 3, 2)], "MD");

/** The recipe of a kind and case for a site brief, or null where the language holds none. */
export function siteContainer(kind: string, caseCode: string, b: Brief): Tree | null {
  const c = caseCode;
  switch (kind) {
    case "INTRO_HERO": return hero(b, c);
    case "ITEM_HERO": return hero(b, "ITEM_HEAD");
    case "SELLER_HERO": case "BRAND_HERO": return hero(b, "BRAND_HEAD");
    case "DOC_HERO": case "GUIDE_HERO": case "TOPIC_HERO": case "RELEASE_HERO": return hero(b, "ARTICLE_HEAD");
    case "INTRO_PROBLEM": case "INTRO_STATEMENT": return statement(b, c);
    case "EXPLAIN_FEATURES": case "ITEM_HIGHLIGHTS": return points(b, c);
    case "EXPLAIN_STEPS": return steps(b, c);
    case "EXPLAIN_SHOWCASE": return c === "SCROLL_THROUGH" ? choose(b, c) : showIt(b, c);
    case "EXPLAIN_SAMPLE": return realSample(b, c);
    case "BROWSE_TILES": return subjectTiles() ?? doorsKind(b, c);
    case "EXPLAIN_DOORS": return doorsKind(b, c);
    case "EXPLAIN_CATEGORIES": case "ITEM_INCLUDED": return featureGridKind(b, c);
    case "PROOF_CLAIM": return numbers(b, c);
    case "COMMON_FAQ": return questions(b, c);
    case "ACTION_CLOSING": return closing(b, c);
    case "COMMON_FOOTER": return footer(b, c);
    case "READ_ARTICLE": return c ? reading(b, c) : articleBody(b);
    case "READ_AUTHOR": return author(b);
    case "BROWSE_FEATURED": return records(b, "FEATURED_FIRST");
    case "BROWSE_SHELF": return records(b, "BY_SHELF");
    case "BROWSE_RESULTS": return records(b, c);
    case "PRICE_PLANS": return plans(b);
    case "PRICE_COMPARE": return compare(b, c || "PLANS");
    case "ITEM_COMPARE": return compare(b, c || "RECORDS");
    case "PROOF_LOGOS": case "PROOF_TESTIMONIALS": return testimonials(b, c);
    case "PROOF_REVIEWS": case "ITEM_REVIEWS": case "SELLER_REVIEWS": return testimonials(b, "REVIEWS");
    case "ABOUT_TEAM": return people(b, c);
    case "ABOUT_LOCATIONS": return locations(b, c);
    case "ITEM_LOCATION": return locations(b, "MAP");
    case "ACTION_CONTACT": return enquiry(b, c);
    case "BROWSE_SEARCH": return find(b, c);
    case "BROWSE_PROMO": return deals(b);
    case "ITEM_FACTS": return specifications(b);
    case "ITEM_VARIANTS": return options(b);
    case "ITEM_OUTLINE": return syllabus(b);
    case "ITEM_SELLER": return owner(b);
    case "ITEM_POLICIES": case "SELLER_POLICIES": return policies(b);
    case "ACTION_CART": return order(b, "CART");
    case "ACTION_SUMMARY": return order(b, c || (pageNow === "MARKET_CONFIRMATION" ? "RECEIPT" : "REVIEW"));
    case "ACTION_CHECKOUT": return checkoutSteps(b);
    case "ACTION_CONFIRMATION": return confirmation(b);
    case "ITEM_OFFERS": return offers(b);
    case "ITEM_BUNDLE": return bundle(b);
    case "ITEM_DESCRIPTION": return description(b);
    case "ITEM_NOTES": return notes(b);
    case "SELLER_ABOUT": return aboutOf(sellerName(), typeof sellerOrg()?.about === "string" ? String(sellerOrg()?.about) : "A two-person studio in Pune that builds audit and reporting add-ons, verified since March 2025.");
    case "BRAND_ABOUT": return aboutOf(sellerOrg() ? sellerName() : "Lumen", typeof sellerOrg()?.about === "string" ? String(sellerOrg()?.about) : "The brand behind the listings on this page, with its own range and its own words about it.");
    case "ITEM_QUESTIONS": case "TOPIC_QUESTIONS": return thread(b, "QUESTIONS");
    case "ITEM_COMMENTS": case "DOC_COMMENTS": case "GUIDE_COMMENTS": case "TOPIC_COMMENTS": return thread(b, "COMMENTS");
    default: return null;
  }
}
export { DOORS_SURFACE, GRID, highlight, field, input, form, recordCard };
