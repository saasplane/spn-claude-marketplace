// The recipes of the app categories (DASHBOARD for a team, PORTAL for an individual): panels, lists, forms and the widgets of an app, with the
// words of a sample product, Lumen Labs. A page of an app is a layout holding panels; a recipe returns the panels, and the layout is the kind's.
import { U, badge, btn, col, dsAtLeast, dsHas, grid, item, link, muted, row, sec, slot, table as plainTable, txt, vl } from "./kit.ts";
import { BRIEFS } from "./words.ts";
import { siteContainer } from "./site.ts";
import type { Tree } from "./types.ts";

export type W = {
  who: string; title: string; description: string; action: string; search: string; heads: string[]; rows: unknown[][]; count: string; total: number;
  filters: Array<[string, string, string[]]>; record: string; recordLine: string; permission: string; kind: "DASHBOARD" | "PORTAL";
};
const active = (): Tree => badge("Active", "SUCCESS");
const delivered = (): Tree => badge("Delivered", "SUCCESS");
const dash = (): unknown[][] => [["Dana Lee", "dana@lumenlabs.example", "Owner", active(), "Today"], ["Ravi Shah", "ravi@lumenlabs.example", "Admin", active(), "Today"], ["Mei Tan", "mei@lumenlabs.example", "Editor", active(), "Yesterday"], ["Joao Costa", "joao@lumenlabs.example", "Editor", badge("Invited", "INFO"), "Not yet"], ["Aisha Khan", "aisha@lumenlabs.example", "Viewer", active(), "24 Nov 2026"], ["Priya Nair", "priya@lumenlabs.example", "Admin", active(), "24 Nov 2026"], ["Omar Haddad", "omar@lumenlabs.example", "Viewer", badge("Invited", "INFO"), "Not yet"], ["Sofia Rossi", "sofia@lumenlabs.example", "Editor", active(), "21 Nov 2026"], ["Lena Fischer", "lena@lumenlabs.example", "Viewer", badge("Suspended", "ERROR"), "3 Nov 2026"]];
const port = (): unknown[][] => [["#1052", "26 Nov 2026", "Lumen Cable", "$18.00", badge("Processing", "INFO")], ["#1048", "12 Nov 2026", "Lumen Lamp, 2 items", "$84.00", badge("On its way", "INFO")], ["#1041", "29 Oct 2026", "Lumen Desk", "$212.50", delivered()], ["#1033", "3 Oct 2026", "Lumen Bulb, 4 items", "$19.00", delivered()], ["#1027", "18 Sep 2026", "Lumen Shade", "$64.20", badge("Returned")], ["#1019", "2 Sep 2026", "Lumen Stand", "$38.00", delivered()], ["#1012", "21 Aug 2026", "Lumen Chair", "$129.00", delivered()], ["#1005", "9 Aug 2026", "Lumen Lamp", "$47.80", badge("Returned")]];
export const WORDS: Record<string, W> = {
  DASHBOARD: { who: "Team", title: "Members", description: "Everyone in Lumen Labs and the role each person holds", action: "Invite member", search: "Search members", heads: ["Name", "Email", "Role", "State", "Last active"], rows: dash(), count: "9 of 24", total: 24, filters: [["role", "Role", ["Owner", "Admin", "Editor", "Viewer"]], ["state", "State", ["Active", "Invited", "Suspended"]]], record: "Billing app", recordLine: "App · billing · owned by Dana Lee", permission: "Editor", kind: "DASHBOARD" },
  PORTAL: { who: "Individual", title: "Your orders", description: "What you bought from Lumen Labs and where it is", action: "Start a return", search: "Search orders", heads: ["Order", "Placed", "Items", "Total", "State"], rows: port(), count: "8 of 31", total: 31, filters: [["state", "State", ["Processing", "On its way", "Delivered", "Returned"]], ["year", "Placed in", ["2026", "2025", "2024"]]], record: "Order #1048", recordLine: "Placed 12 Nov 2026 · Lumen Lamp, 2 items", permission: "Household", kind: "PORTAL" },
};

const field = (label: string, value: unknown, kind = "input", text?: string): Tree => {
  const control = kind === "switch" ? U("DSSwitch", { label: text ?? label, valueLink: vl(value) }) : kind === "check" ? U("DSCheckbox", { label: text ?? label, valueLink: vl(value) }) : kind === "area" ? U("DSTextarea", { valueLink: vl(value), rows: 4 }) : U("DSInput", { valueLink: vl(value) });
  return U("DSForm.Field", { label: kind === "switch" || kind === "check" ? "" : label, validators: [], attributeLink: vl(value) }, [control]);
};
const form = (fields: Tree[]): Tree => U("DSForm", { size: "MD" }, [col(fields)]);
const lineItem = (title: string, description?: string | null, level = "CONTENT", end?: unknown, extra: Tree = {}): Tree => item(title, description, level, end, extra);
/** Lines of a list, each divided from the next, as the rows of a panel stand. */
const stack = (rows: Tree[], extra: Tree = {}): Tree => U("DSList", { divided: true, ...extra }, rows.map((r) => (r.props?.unread ? U("DSList.Item", { content: { ...r, props: { ...r.props, unread: undefined } }, unread: true }) : U("DSList.Item", { content: r }))));
const avatarOf = (name: string): Tree => ({ mtype: "AVATAR", title: name });

/** A panel: its header's item, an optional bar, its content and its footer. */
export function panel(title: string, description: string | null, content: unknown[], opts: { footer?: unknown[]; end?: unknown; full?: boolean; flush?: boolean; back?: boolean; bar?: unknown[] } = {}): Tree {
  const head = lineItem(title, description, opts.full ? "PAGE" : "CONTAINER", opts.end, opts.back ? { backAnchor: { href: "#back" } } : {});
  const parts: unknown[] = [U("DSPanelContainer.Header", {}, [head])];
  if (opts.bar) parts.push(U("DSPanelContainer.Content", {}, opts.bar));
  parts.push(U("DSPanelContainer.Content", opts.flush ? { flush: true } : {}, content));
  if (opts.footer) parts.push(U("DSPanelContainer.Footer", {}, opts.footer));
  return U("DSPanelContainer", opts.full ? { fullPage: true } : {}, parts);
}
const dataTable = (heads: string[], rows: unknown[][], withAction = true, lead = false): Tree => {
  const hs = [...heads.map((h) => U("DSTable.HCell", {}, [h])), ...(withAction ? [U("DSTable.HCell", {}, [""])] : [])];
  const body = rows.map((r) => U("DSTable.Row", {}, [...r.map((c, i) => U("DSTable.DCell", { marked: i === 0 }, c === "" ? [] : [lead && i === 0 ? lineItem(String(c), null, "CONTENT", undefined, { media: avatarOf(String(c)) }) : c])), ...(withAction ? [U("DSTable.DCell", { alignment: "END" }, [btn(null, undefined, "GHOST", "MORE_HORIZONTAL", `Actions for ${String(typeof r[0] === "string" ? r[0] : "row")}`)])] : [])]));
  return U("DSTable", { hoverable: true }, [U("DSTable.Head", {}, [U("DSTable.Row", {}, hs)]), U("DSTable.Body", {}, body)]);
};
/** The count at a footer's start ("6 of 24"): its spaces do not break, so it stays on one line whatever the pager beside it asks for. */
const count = (text: string): Tree => muted(text.replace(/ /g, "\u00a0"));
const paging = (total: number, per = 12): Tree => U("DSPagination", { totalRecords: total, valueLink: vl({ page: 1, recordsPerPage: per }), recordsPerPageOptions: [12, 25, 50] });
const filterBar = (w: W, extra = true, chosen = false): Tree => U("DSFilterBar", { fields: [{ mtype: "TEXT", key: "q", label: w.search, placeholder: w.search, primary: true, valueLink: vl("") }, ...(extra ? w.filters.map(([key, label, opts], i) => (i === 0 ? { mtype: "SELECT_MULTI", key, label, primary: true, options: opts.map((o) => ({ key: o.toLowerCase(), label: o })), valueLink: vl(chosen ? opts.slice(1).map((o) => o.toLowerCase()) : []) } : { mtype: "SELECT", key, label, primary: true, options: opts.map((o) => ({ key: o.toLowerCase(), label: o })), valueLink: vl(null) })) : [])] });
const chips = (tags: string[]): Tree => row([U("DSTagGroup", { tags: tags.map((k) => ({ key: k.toLowerCase(), label: k })) }), btn("Clear all", undefined, "GHOST")]);
const actions = (w: W): Tree => (w.kind === "DASHBOARD" ? U("DSButtonGroup", {}, [btn("Export", undefined, "OUTLINE"), btn(w.action, "PRIMARY", "SOLID", "PLUS")]) : btn(w.action, "PRIMARY", "SOLID", "PLUS"));
const listPanel = (w: W, applied?: string[]): Tree => panel(w.title, w.description, [dataTable(w.heads, w.rows, true, w.kind === "DASHBOARD")], { footer: [count(w.count), paging(w.total)], end: actions(w), full: true, bar: [filterBar(w, true, !!applied), ...(applied ? [chips(applied)] : [])], flush: true });
const stat = (label: string, value: string, note: string, goto: string): Tree => U("DSCardWidget", { parts: [{ mtype: "FREE", key: "s", node: col([muted(label, "TITLE_SM"), txt(value, "HEADING_MD"), muted(note, "CONTENT_XS"), U("DSLink", { label: goto, anchor: { href: "#list" }, size: "SM" })], "XS") }] });
const recent = (w: W): Tree => panel("Recent activity", w.kind === "DASHBOARD" ? "What changed in the team this week" : "What happened on your account lately", [stack((w.kind === "DASHBOARD" ? [["Dana Lee", "Changed Ravi Shah to Admin", "Members, roles", "2 hours ago"], ["Mei Tan", "Published docs.lumenlabs.example", "Docs site, 14 pages", "Yesterday"], ["Dana Lee", "Invited Joao Costa as an Editor", "joao@lumenlabs.example", "Yesterday"], ["Priya Nair", "Turned on two-step sign-in", "Billing app", "24 Nov 2026"]] : [["Lumen Post", "Order #1048 is on its way", "Tracking LP-88213, arrives Thursday", "Today"], ["Lumen Labs", "Payment received, $18.00", "Card ending 4242, order #1052", "Yesterday"], ["You", "Changed your delivery address", "14 Harbour Lane, Pune", "24 Nov 2026"], ["You", "Signed in on a new phone", "Pune, India", "10 Nov 2026"]]).map(([who, t, d, when], i) => lineItem(t, d, "CONTENT", muted(when), { media: w.kind === "DASHBOARD" ? avatarOf(who) : { mtype: "ICON", node: ["STORE", "CREDIT_CARD", "MAP_PIN", "SHIELD"][i] } })))]);

/** A layout kind drawn holding a page. */
export const layoutBody = (w: W): Tree[] => [col([listPanel(w), recent(w)], "LG")];

const bk = (): Tree => btn("Save changes", "PRIMARY", "SOLID");
const dis = (): Tree => btn("Discard", undefined, "OUTLINE");
const danger = (what: string, line: string): Tree => panel(`Delete ${what}`, line, [muted("Export its data first if you need a copy.")], { end: btn(`Delete ${what}`, "ERROR", "OUTLINE") });

function setup(w: W, c: string): Tree[] {
  if (w.kind === "DASHBOARD") return [col([lineItem(w.record, "Owned by Dana Lee · Mumbai", "PAGE", btn("Open app", undefined, "OUTLINE"), { media: { mtype: "ICON", node: "APP_WINDOW" }, backAnchor: { href: "#back" } }),
    panel("Details", "Name, owner and region", [form([field("Name", "Billing app"), field("Slug", "billing"), field("Owner", "Dana Lee"), field("Region", "Mumbai")])], { footer: [bk(), dis()] }),
    panel("Sign-in", "Who may open the app", [form([field("a", true, "switch", "Require two-step sign-in"), field("b", true, "switch", "Allow sign-in with a link"), field("c", false, "switch", "Let members stay signed in")])]),
    c === "CURRENT_PLAN" ? U("DSCardWidget", { header: { title: "Team plan", description: "$49 a month, billed yearly" }, parts: [{ mtype: "ITEMS", key: "p", items: [{ key: "a", title: "Renews", description: "12 March 2027" }, { key: "b", title: "Seats", description: "24 of 50 used" }] }], footer: btn("Change plan", undefined, "OUTLINE") }) : panel("Access", "Which roles open it", ["Admins", "Editors", "Viewers"].map((r, i) => lineItem(r, [`3 members · can change settings`, `9 members · can edit content`, `12 members · can read only`][i], "CONTENT", btn("Change", undefined, "OUTLINE")))),
    danger("app", "Removes the app and its data. It cannot be undone.")], "LG")];
  return [col([lineItem("Your account", "dana@northwind.example · Member since March 2024", "PAGE", undefined, { media: { mtype: "AVATAR", title: "Dana Lee" } }),
    panel("Profile", "What your household sees", [form([field("Display name", "Dana Lee"), field("Time zone", "Asia/Kolkata"), field("Language", "English")])], { footer: [bk(), dis()] }),
    c === "CURRENT_PLAN" ? U("DSCardWidget", { header: { title: "Lumen Plus", description: "$9 a month" }, parts: [{ mtype: "ITEMS", key: "p", items: [{ key: "a", title: "Renews", description: "12 March 2027" }, { key: "b", title: "Free delivery", description: "On every order" }] }], footer: btn("Change plan", undefined, "OUTLINE") }) : panel("Sign-in", "How you get into your account", [lineItem("Password", "Changed 3 months ago", "CONTENT", btn("Change password", undefined, "OUTLINE")), lineItem("Two-step check", "Asks for a code from your phone", "CONTENT", btn("Set up", undefined, "OUTLINE"))]),
    panel("Notifications", "What reaches your inbox", [form([field("a", true, "switch", "Email me when someone signs in on a new device"), field("b", false, "switch", "Email me a summary each week")])]),
    danger("account", "Removes your profile and access. It cannot be undone.")], "LG")];
}

type Rec = { head: Tree; lists: Tree[]; props: string[][]; tabs: Array<[string, string]> };
/** The record a page of one record shows: a member for a team (Mei Tan), an order for an individual (#1048). */
const mei = (w: W = WORDS.DASHBOARD): Rec => {
  const lst = (rows: string[][], what: string): Tree => U("DSList", { divided: true }, rows.map(([r, d]) => U("DSList.Item", { content: lineItem(r, d), endNode: btn(null, undefined, "GHOST", "X", `Remove ${r} ${what}`) })));
  const plain = (rows: string[][]): Tree => U("DSList", { divided: true }, rows.map(([r, d, e]) => U("DSList.Item", { content: lineItem(r, d, "CONTENT", e ? muted(e) : undefined) })));
  if (w.kind === "PORTAL") return {
    head: lineItem("Order #1048", "Placed 12 Nov 2026 · Lumen Lamp, 2 items", "PAGE", U("DSButtonGroup", {}, [btn("Start a return", undefined, "OUTLINE"), btn("Track order", "PRIMARY", "SOLID")]), { media: { mtype: "ICON", node: "STORE" }, backAnchor: { href: "#back" } }),
    lists: [panel("Items", "What is in the order", [plain([["Lumen Lamp, warm white", "2 × $42.00", "$84.00"]])]),
      panel("Delivery", "Where it goes and who brings it", [plain([["Lumen Post", "Tracking LP-88213, arrives Thursday"], ["14 Harbour Lane", "Pune 411001. Ring twice, leave at the door"]])], { end: btn("Change address", undefined, "OUTLINE") }),
      panel("Payment", "How it was paid", [plain([["Visa ending 4242", "Charged $84.00 on 12 Nov 2026"]])]),
      panel("Activity", "What happened to the order", [U("DSList", { divided: true }, [["Out for delivery", "Lumen Post, LP-88213", "Today, 09:12"], ["Packed", "Left our depot in Pune", "Yesterday"], ["Payment received", "$84.00 by card", "12 Nov 2026"]].map(([t, d, when]) => U("DSList.Item", { content: lineItem(t, d, "CONTENT", muted(when)) })))])],
    props: [["Placed", "12 Nov 2026"], ["Total", "$84.00"], ["Paid with", "Visa ending 4242"], ["Arrives", "Thursday"]],
    tabs: [["Items", "STORE"], ["Delivery", "MAP_PIN"], ["Payment", "CREDIT_CARD"], ["Activity", "CLOCK"]] };
  return { head: lineItem("Mei Tan", "mei@lumenlabs.example · Editor · Joined 3 March 2024", "PAGE", U("DSButtonGroup", {}, [btn("Suspend", undefined, "OUTLINE"), btn("Edit", undefined, "OUTLINE")]), { media: { mtype: "AVATAR", title: "Mei Tan" }, backAnchor: { href: "#back" } }),
    lists: [panel("Roles", "What Mei Tan may do", [lst([["Editor", "Since 3 Mar 2024"], ["Reviewer", "Since 12 Sep 2025"]], "role")], { end: btn("Add role", undefined, "OUTLINE", "PLUS") }),
      panel("Sites", "Where Mei Tan publishes", [lst([["docs.lumenlabs.example", "Docs site"], ["www.lumenlabs.example", "Marketing site"]], "site")], { end: btn("Add site", undefined, "OUTLINE", "PLUS") }),
      panel("Apps", "What Mei Tan opens", [lst([["Billing app", "Editor"], ["Support desk", "Viewer"]], "app")], { end: btn("Add app", undefined, "OUTLINE", "PLUS") }),
      panel("Recent activity", "The last things Mei Tan did", [U("DSList", { divided: true }, [["Published a site", "docs.lumenlabs.example", "Today, 08:40"], ["Changed a page", "Roles and permissions", "Yesterday"]].map(([t, d, when]) => U("DSList.Item", { content: lineItem(t, d, "CONTENT", muted(when)) })))])],
    props: [["Email", "mei@lumenlabs.example"], ["Role", "Editor"], ["Joined", "3 Mar 2024"], ["Two-step", "On"]],
    tabs: [["Roles", "SHIELD"], ["Sites", "GLOBE"], ["Apps", "APP_WINDOW"], ["Keys", "KEY"], ["Activity", "CLOCK"]] };
};
function belongs(w: W, c: string): Tree[] {
  const { head, lists, props, tabs } = mei(w);
  if (c === "WITH_PROPERTIES_BESIDE") return [col([head, grid([col([lists[0], lists[1], lists[2], lists[3]], "LG"), panel("Properties", null, [col(props.map(([l, v]) => U("DSDataUnit", { label: l, node: v })), "SM")])], 2, 1, 1)], "LG")];
  if (c === "TABBED") return [col([head, U("DSTabs", { options: tabs.map(([l, icon]) => ({ key: l.toLowerCase(), label: l, anchor: { href: `#${l.toLowerCase()}` }, ...(dsAtLeast("11.28.0") ? { media: { mtype: "ICON", node: icon } } : {}) })), activeKey: tabs[0][0].toLowerCase(), type: "LINE" }), lists[0]], "LG")];
  return [col([head, grid([lists[0], lists[1]], 2, 1, 1), lists[2], lists[3]], "LG")];
}

const eventRows = (w: W): unknown[][] => (w.kind === "DASHBOARD" ? [["24 Nov 2026, 09:12", "Role changed", "Dana Lee", "Ravi Shah is now an Admin"], ["24 Nov 2026, 08:40", "Site published", "Mei Tan", "docs.lumenlabs.example"], ["23 Nov 2026, 17:05", "Member invited", "Dana Lee", "Omar Haddad as Viewer"], ["22 Nov 2026, 10:01", "Sign-in changed", "Priya Nair", "Two-step now required"]] : [["24 Nov 2026, 09:12", "Order shipped", "#1048", "Lumen Post, LP-88213"], ["21 Nov 2026, 14:03", "Payment received", "#1052", "$18.00 by card ending 4242"], ["19 Nov 2026, 10:25", "Address changed", "Home", "14 Harbour Lane"], ["10 Nov 2026, 08:45", "Sign-in from a new device", "Phone", "Pune, India"]]);
function find(w: W, c: string): Tree[] {
  if (c !== "DATED_EVENTS") return [listPanel(w)];
  const rows = eventRows(w);
  const f = [{ mtype: "DATE_RANGE", key: "when", label: "Time range", primary: true, valueLink: vl({ start: null, end: null }) }, { mtype: "TEXT", key: "q", label: "Search events", placeholder: "Search events", primary: true, valueLink: vl("") }];
  return [panel(w.kind === "DASHBOARD" ? "Activity" : "Account activity", "Everything that changed, newest first", [dataTable(w.kind === "DASHBOARD" ? ["When", "Event", "By", "Detail"] : ["When", "Event", "About", "Detail"], rows, false)], { footer: [count("4 of 186 events"), paging(186)], full: true, bar: [U("DSFilterBar", { fields: f })], flush: true })];
}
const waiting = (w: W): Tree => w.kind === "DASHBOARD" ? panel("Needs you", "3 things are waiting for you", [stack([["Approve Joao Costa", "Invited 2 days ago as an Editor, waiting for your approval", "Review"], ["Finish setting up docs.lumenlabs.example", "The site has no 404 page and no sitemap yet", "Open site"], ["Renew the card for billing", "Visa ending 4242 expires in December", "Update card"]].map(([t, d, a]) => lineItem(t, d, "CONTENT", btn(a, undefined, "OUTLINE"), { media: { mtype: "ICON", node: "CIRCLE_ALERT" } })))]) : panel("Needs you", "2 things are waiting for you", [stack([["Order #1048 arrives Thursday", "Lumen Lamp, 2 items, with Lumen Post (LP-88213)", "Track order"], ["Rate your Lumen Desk", "Delivered 3 Nov 2026, tell others how it is", "Rate"]].map(([t, d, a]) => lineItem(t, d, "CONTENT", btn(a, undefined, "OUTLINE"), { media: { mtype: "ICON", node: "CIRCLE_ALERT" } })))]);
const statsOf = (w: W): Tree[] => (w.kind === "DASHBOARD" ? [["Members", "24", "+2 this week", "See members"], ["Sites", "5", "all live", "See sites"], ["Apps", "9", "1 needs setup", "See apps"], ["Invites", "3", "waiting", "See invites"]] : [["Open orders", "2", "1 on its way", "See orders"], ["Spent this year", "$418", "since January", "See invoices"], ["Saved addresses", "2", "home, work", "See addresses"], ["Points", "340", "60 to next", "See rewards"]]).map(([a, b, d, e]) => stat(a, b, d, e));
function overview(w: W): Tree[] {
  return [col([lineItem("Overview", "Good morning, Dana", "PAGE"), ...(w.kind === "DASHBOARD" ? [checklist(3)] : []), waiting(w), grid(statsOf(w), 4, 2, 2), recent(w)], "LG")];
}
const checklist = (done = 3): Tree => panel("Finish setting up", `${done} of 5 steps done`, [col([U("DSProgress", { value: done, max: 5, size: "SM" }), ...[["Name your organization", "Lumen Labs"], ["Invite your team", "24 members joined"], ["Connect a sign-in", "Email and password"], ["Publish a site", "Put a page on your own domain"], ["Set up billing", "Add a card to keep your sites live"]].map(([t, d], i) => lineItem(t, d, "CONTENT", i < done ? undefined : btn("Start", undefined, "OUTLINE"), { media: { mtype: "ICON", node: i < done ? "CHECK" : "CIRCLE" } }))], "SM")], { end: btn("Dismiss", undefined, "GHOST") });

type Drawn = { children: Tree[]; layout: string | null; planned?: string };
/** The drawings a page of an app is made of, each under the code of the part it now belongs to; a page kind chooses among them by its case. */
function drawing(code: string, c: string, w: W): Drawn {
  const D = w.kind === "DASHBOARD";
  switch (code) {
    case "RECORD_HOME": return { children: find(w, c), layout: null };
    case "RECORD_VIEW_OWN": return { children: setup(w, c), layout: D ? null : "DOCK" };
    case "RECORD_VIEW": return { children: belongs(w, c), layout: null };
    case "SETUP_SECTION": return { layout: null, children: [panel("Channels", "How Lumen Labs reaches people", [grid([["Email", "MAIL_OPEN", "Postmark", "Connected · 12,400 sent"], ["SMS", "MESSAGE_CIRCLE", "No provider yet", "Not connected"], ["Push", "BELL", "Firebase", "Connected · 3,100 sent"]].map(([k, ic, pr, st]) => U("DSCardWidget", { header: { title: k, pageLevel: "WIDGET", media: { mtype: "ICON", node: ic } }, parts: [{ mtype: "ITEMS", key: "p", items: [{ key: "p1", title: pr, description: st, endNode: btn("Manage", undefined, "OUTLINE") }] }] })), 3, 2, 1)], { full: true })] };
    case "SETUP_COMPARE": {
      const subj = ["Owner", "Admin", "Editor", "Viewer"].map((k) => ({ key: k.toLowerCase(), title: k }));
      const rows: Array<[string, string, boolean[]]> = [["invite", "Invite people", [true, true, false, false]], ["publish", "Publish a site", [true, true, true, false]], ["billing", "See billing", [true, true, false, false]]];
      return { layout: null, children: [panel("Role permissions", "What each role can do", [U("DSComparison", { subjects: subj, groups: [{ key: "g", rows: rows.map(([k, l, v]) => ({ mtype: "FIELD", key: k, config: { mtype: "BOOLEAN", key: k, label: l }, values: Object.fromEntries(["owner", "admin", "editor", "viewer"].map((s, i) => [s, { mtype: "BOOLEAN", value: v[i] }])) })) }] })], { full: true })] };
    }
    case "LISTING_CHOOSE": return { layout: null, children: [panel(`Permissions for ${w.permission}`, "Choose what this " + (D ? "role" : "person") + " can do", [form([grid(["View members", "Invite members", "Remove members", "Edit roles", "Publish sites", "See billing"].map((p, i) => field(p, i % 2 === 0, "check")), 3, 3, 1)])], { footer: [btn("Save", "PRIMARY", "SOLID"), btn("Cancel", undefined, "OUTLINE")], full: true, back: true })] };
    case "ENTRY_PREVIEW": return { layout: null, children: [panel("Invite email", "What a new member receives", [form([field("Subject", "You are invited to Lumen Labs"), grid([field("Message", "Hi {name}, your invite to Lumen Labs is ready.", "area"), U("DSCard", {}, [U("DSCard.Content", {}, [muted("Preview", "TITLE_SM"), txt("Hi Dana, your invite to Lumen Labs is ready.")])])], 2, 1, 1)])], { footer: [btn("Save", "PRIMARY", "SOLID"), btn("Cancel", undefined, "OUTLINE")], full: true, back: true })] };
    case "ENTRY_OVER": return { layout: null, children: [grid([panel(w.title, null, [dataTable(w.heads, w.rows.slice(0, 4))], { full: true }), panel(String(w.rows[1][0]), "Opened from the list", [form([field(w.heads[1], String(w.rows[1][1])), field(w.heads[2], String(w.rows[1][2]))])], { footer: [btn("Save", "PRIMARY", "SOLID"), btn("Cancel", undefined, "OUTLINE")], end: btn(null, undefined, "GHOST", "X", "Close") })], 2, 1, 1)] };
    case "SETUP_INHERITED": return { layout: null, children: [col([lineItem(w.record, "Settings it inherits or overrides", "PAGE", undefined, { backAnchor: { href: "#back" } }), ...[["Sign-in", "Follows the organization default", [["Method", "Email and password"], ["Session", "12 hours"], ["Two-step", "Required"]], "Set its own"], ["Notifications", "Holds its own values", [["Digest", "Weekly"], ["Quiet hours", "22:00 to 07:00"], ["Channel", "Email"]], "Follow the default"]].map(([t, d, vs, a]) => panel(t as string, d as string, [grid((vs as string[][]).map(([l, v]) => U("DSDataUnit", { label: l, node: v })), 3, 2, 1)], { end: btn(a as string, undefined, "OUTLINE") }))], "LG")] };
    case "LISTING_GROUPS": return { layout: null, children: groups(w, c) };
    case "HOME_APP": return { layout: null, children: overview(w) };
    case "RECORD_STEPS": {
      const steps = D ? [["Invited", "DONE"], ["Accepted", "DONE"], ["Verified", "WORKING"], ["Active", ""]] : [["Placed", "DONE"], ["Packed", "DONE"], ["On its way", "WORKING"], ["Delivered", ""]];
      const checks = D ? [["Email", "Confirmed"], ["Two-step", "Not set up"], ["Terms", "Accepted"]] : [["Carrier", "Lumen Post"], ["Tracking", "LP-88213"], ["Arrives", "Thursday"]];
      return { layout: null, children: [col([lineItem(D ? "Joao Costa" : w.record, D ? "Invited 22 Nov" : w.recordLine, "PAGE", btn(D ? "Resend invite" : "Track order", "PRIMARY", "SOLID"), { backAnchor: { href: "#back" } }), panel("Where it is", null, [U("DSStepper", { items: steps.map(([l, s], i) => ({ key: `s${i}`, label: l, ...(s ? { taskState: s } : {}) })), activeKey: "s2", type: "NUMBER" })]), panel("Checks", null, [grid(checks.map(([l, v]) => U("DSDataUnit", { label: l, node: v })), 3, 2, 1)])], "LG")] };
    }
    case "ENTRY_FORM": {
      const parts: Array<[string, Tree[]]> = D ? [["Details", [field("Name", "Docs site"), field("Address", "docs.lumenlabs.example")]], ["Access", [field("a", true, "switch", "Visible to everyone"), field("b", false, "switch", "Let search engines list it")]]] : [["Delivery", [field("Name", "Dana Lee"), field("Address", "14 Harbour Lane")]], ["Contact", [field("Phone", "+1 555 0100"), field("Email", "dana@lumenlabs.example")]]];
      if (c === "DONE") return { layout: null, children: [panel(D ? "Site created" : "Address saved", null, [col([U("DSAlert", { color: "SUCCESS", text: D ? "docs.lumenlabs.example is live" : "14 Harbour Lane is saved", description: "You can change it any time." }), row([btn(D ? "Open the site" : "Back to orders", "PRIMARY", "SOLID"), btn("Add another", undefined, "OUTLINE")])], "MD")], { full: true })] };
      return { layout: null, children: [panel(D ? "New site" : "New address", null, parts.flatMap(([t, fs]) => [txt(t, "TITLE_LG"), form(fs)]), { footer: [btn("Save", "PRIMARY", "SOLID"), btn("Cancel", undefined, "OUTLINE")], full: true, back: true })] };
    }
    case "LISTING_EDIT": return { layout: null, children: [D
      ? panel("Texts", "Change one where it stands", [U("DSFilterBar", { fields: [{ mtype: "TEXT", key: "q", label: "Search texts", placeholder: "Search texts", primary: true, valueLink: vl("") }] }), plainTable(["Where it shows", "Text", ""], [["Sign-in page", "Welcome back", ""], ["Sign-out button", U("DSInput", { valueLink: vl("Log out") }), row([btn("Save", "PRIMARY", "SOLID"), btn("Cancel", undefined, "OUTLINE")])], ["Invite email", "You are invited to Lumen Labs", ""]])], { footer: [count("3 of 48 texts")], full: true })
      : panel("Delivery notes", "Change one where it stands", [plainTable(["Address", "Note for the courier", ""], [["Home", "Ring twice and leave at the door", ""], ["Work", U("DSInput", { valueLink: vl("Reception signs for parcels") }), row([btn("Save", "PRIMARY", "SOLID"), btn("Cancel", undefined, "OUTLINE")])], ["Parents", "Deliver before 18:00", ""]])], { footer: [count("3 addresses")], full: true })] };
    case "COMMON_NOT_FOUND": return { layout: null, children: [col([lineItem("Page not found", "The address may have changed. Go back, or search for what you wanted.", "PAGE", btn("Back to home", "PRIMARY", "SOLID"))])] };
    case "COMMON_NO_ACCESS": return { layout: null, children: [col([lineItem("No access", D ? "Ask an owner of Lumen Labs to give you a role that opens this page." : "This page belongs to another account. Ask its owner to share it with you.", "PAGE", btn(D ? "Ask for access" : "Back to your orders", "PRIMARY", "SOLID"))])] };
    case "COMMON_SERVER_ERROR": return { layout: "CANVAS", children: [col([lineItem("Something went wrong", "It is on our side and we have been told. Try again in a minute.", "PAGE", btn("Try again", "PRIMARY", "SOLID"))])] };
    case "COMMON_MAINTENANCE": return { layout: "CANVAS", children: [col([lineItem("Back soon", "We are updating Lumen Labs and will be back by 10:30 IST. Nothing you saved is lost.", "PAGE")])] };
    default: return { layout: null, children: [], planned: code };
  }
}

const recordCards = (w: W): Tree => grid([0, 1, 2].map((i) => U("DSItemCard", { card: {}, item: { title: String(w.rows[i][0]), description: String(w.rows[i][1]), media: { mtype: "ICON", node: "APP_WINDOW" }, facts: [String(w.rows[i][2])], pageLevel: "WIDGET", orientation: "VERTICAL" } })), 3, 2, 1);
const detailOf = (w: W): Tree => panel(String(w.rows[1][0]), String(w.rows[1][1]), [col([U("DSDataUnit", { label: w.heads[2], node: String(w.rows[1][2]) }), U("DSDataUnit", { label: w.heads[4], node: String(w.rows[1][4]) })], "SM")], { end: btn("Edit", undefined, "OUTLINE") });
const pickList = (w: W): Tree => panel(w.title, null, [U("DSList", { divided: true }, w.rows.slice(0, 5).map((r, i) => U("DSList.Item", { content: lineItem(String(r[0]), String(r[1]), "CONTENT"), selected: i === 1 })))], { flush: true });
const authPanel = (w: W, c: string): Tree => {
  const mail = `dana@${w.kind === "DASHBOARD" ? "lumenlabs" : "northwind"}.example`;
  const email = field("Email", mail);
  const go = (label: string): unknown[] => [btn(label, "PRIMARY", "SOLID")];
  switch (c) {
    case "SIGN_UP": return panel("Create your account", "A few details, and you are in", [form([field("Name", "Dana Lee"), email, field("Password", "a long phrase")])], { footer: go("Create account") });
    case "RESET": return panel("Reset your password", "We send a link to the email you signed up with", [form([email])], { footer: go("Send reset link") });
    case "INVITE": return D(w)
      ? panel("Join Lumen Labs", "Dana Lee invited you as an Editor", [lineItem("Lumen Labs", "24 members, 9 apps", "CONTENT", undefined, { media: { mtype: "ICON", node: "APP_WINDOW" } })], { footer: go("Accept invitation") })
      : panel("Join a household", "Maya Lee invited you to share her orders", [lineItem("Maya Lee", "Sees and tracks 4 orders with you", "CONTENT", undefined, { media: avatarOf("Maya Lee") })], { footer: go("Accept invitation") });
    case "VERIFY": return panel("Check your email", `We sent a six-digit code to ${mail}`, [form([field("Code", "482 913")])], { footer: [...go("Verify"), btn("Send it again", undefined, "OUTLINE")] });
    case "CALLBACK": return panel("Signing you in", "Finishing with your provider", [U("DSSpinner", { label: "Finishing sign-in" })]);
    default: return panel("Sign in to Lumen Labs", "Use the email you signed up with", [form([email, field("Password", "a long phrase")])], { footer: go("Sign in") });
  }
};
const entrySteps = (w: W): Tree => panel(D(w) ? "New site" : "New address", null, [U("DSStepper", { items: [{ key: "a", label: "Details", taskState: "DONE" }, { key: "b", label: "Access", taskState: "WORKING" }, { key: "c", label: "Review" }], activeKey: "b", type: "NUMBER" }), form([field("a", true, "switch", D(w) ? "Visible to everyone" : "Use as the billing address"), field("b", false, "switch", D(w) ? "Let search engines list it" : "Leave at the door")])], { footer: [btn("Back", undefined, "OUTLINE"), btn("Continue", "PRIMARY", "SOLID")], full: true, back: true });

function recordHome(w: W, c: string): Drawn {
  const out = (children: Tree[]): Drawn => ({ children, layout: null });
  switch (c) {
    case "WITH_STATS": return out([col([grid(statsOf(w), 4, 2, 2), listPanel(w)], "LG")]);
    case "WITH_SUMMARY": return out([col([panel("Summary", null, [row([txt(String(w.total), "HEADING_MD"), muted(`${w.title.toLowerCase()} in all, ${w.count.toLowerCase()} shown`)], "MD")]), listPanel(w)], "LG")]);
    case "SAVED": return out([panel("Saved for later", "What you kept to come back to", [recordCards(w)], { full: true })]);
    case "ASIDE": return out([U("DSPageFrameAside", { main: listPanel(w), aside: col(statsOf(w).slice(0, 2), "MD") })]);
    case "LIST_DETAIL": return out([U("DSPageFrameListDetail", { list: pickList(w), detail: detailOf(w), backAnchor: { href: "#list" } })]);
    case "GROUPS": return out([U("DSPageFrameGroups", { groups: U("DSNavList", { nodes: ["Account", "Billing"].map((g, i) => ({ type: "ITEM", key: g.toLowerCase(), label: g, anchor: { href: `#${g.toLowerCase()}` }, ...(i === 0 ? { selected: true } : {}) })) }), list: pickList(w), detail: detailOf(w), groupsAnchor: { href: "#groups" }, backAnchor: { href: "#list" } })]);
    case "BY_DAY": return out([col(["Today", "Yesterday"].map((day, i) => panel(`${day} · ${3 - i} events`, null, [U("DSList", { divided: true }, eventRows(w).slice(i * 2, i * 2 + 2).map((r) => U("DSList.Item", { content: lineItem(String(r[1]), String(r[3]), "CONTENT", muted(String(r[0]).slice(-5)), { media: { mtype: "AVATAR", title: String(r[2]) } }) })))])), "LG")]);
    default: return drawing("RECORD_HOME", c, w);
  }
}

function recordView(w: W, c: string): Drawn {
  const { head, lists } = mei(w);
  switch (c) {
    case "ASIDE": return drawing("RECORD_VIEW", "WITH_PROPERTIES_BESIDE", w);
    case "TABS": case "SUB_PAGES": return drawing("RECORD_VIEW", "TABBED", w);
    case "LIST_DETAIL": return { layout: null, children: [col([head, U("DSPageFrameListDetail", { list: lists[0], detail: lists[1], backAnchor: { href: "#back" } })], "LG")] };
    case "OWN": return drawing("RECORD_VIEW_OWN", "CURRENT_PLAN", w);
    case "SHEET": return { layout: null, children: [beneath(listPanel(w), overlayParts("DSSheet", D(w) ? "Ravi Shah" : `Order ${String(w.rows[1][0])}`, D(w) ? "ravi@lumenlabs.example · Admin" : String(w.rows[1][2]), [col(D(w) ? [["Role", "Admin"], ["State", "Active"], ["Joined", "3 Mar 2024"], ["Two-step", "On"], ["Last active", "Today, 09:12"]].map(([l, v]) => U("DSDataUnit", { label: l, node: v })) : [["Placed", "12 Nov 2026"], ["Total", "$84.00"], ["Paid with", "Visa ending 4242"], ["Carrier", "Lumen Post, LP-88213"], ["Arrives", "Thursday"]].map(([l, v]) => U("DSDataUnit", { label: l, node: v })), "SM")], [btn(D(w) ? "Edit member" : "Track order", "PRIMARY", "SOLID")], "MD"))] };
    default: return drawing("RECORD_VIEW", c, w);
  }
}

function recordEntry(w: W, c: string): Drawn {
  switch (c) {
    case "DIALOG": return { layout: null, children: [entryDialog(w)] };
    case "SHEET": return { layout: null, children: [entrySheet(w)] };
    case "REVEAL": return { layout: null, children: [col([keysBehind(w), revealDialog(w)], "LG")] };
    case "STEP_UP": return { layout: null, children: [col([ownerBehind(w), stepUpDialog(w)], "LG")] };
    case "STEPS": return { layout: null, children: [entrySteps(w)] };
    case "WITH_PREVIEW": return drawing("ENTRY_PREVIEW", "", w);
    case "RESUMABLE": return { layout: null, children: [...drawing("ENTRY_FORM", "", w).children, muted("Draft saved a minute ago. Come back any time and it opens where you left it.")] };
    default: return drawing("ENTRY_FORM", c === "DONE" ? c : "", w);
  }
}

/** The page of an app a kind draws, by its case. */
export function appPage(code: string, c: string, w: W): Drawn {
  switch (code) {
    case "HOME_APP": return c === "FIRST_USE" ? { layout: null, children: [col([lineItem("Overview", "Welcome to Lumen Labs, Dana", "PAGE"), checklist(1)], "LG")] } : drawing("HOME_APP", c, w);
    case "RECORD_HOME": return recordHome(w, c);
    case "RECORD_VIEW": return recordView(w, c);
    case "RECORD_ENTRY": return recordEntry(w, c);
    case "AUTH_FLOW": return { layout: "CANVAS", children: [col([authPanel(w, c)])] };
    default: return drawing(code, c, w);
  }
}

/** The part of a page an app container kind draws, or null where no piece of the language fits it. */
export function appContainer(code: string, c: string, w: W): Tree[] | null {
  const nodes = containerNodes(code, c, w);
  return nodes && sectioned(nodes);
}
/** What stands in a page beside the cases of its kind: each case in a section of its own, so the next case's head is told from the card above it. */
const sectioned = (nodes: Tree[]): Tree[] => [sec(nodes, "SM", "BASE")];
function containerNodes(code: string, c: string, w: W): Tree[] | null {
  const { lists } = mei(w);
  switch (code) {
    case "HEAD_PAGE": return [U("DSPageHead", { header: { title: w.title, description: w.description }, headerActions: actions(w) })];
    case "HEAD_RECORD": return [U("DSPageHead", { header: { title: w.record, description: w.recordLine, media: D(w) ? { mtype: "ICON", node: "APP_WINDOW" } : { mtype: "ICON", node: "STORE" }, endNode: D(w) ? badge("Active", "SUCCESS") : badge("On its way", "INFO") }, headerActions: U("DSButtonGroup", {}, [btn(D(w) ? "Deactivate" : "Track order", undefined, "OUTLINE"), btn(D(w) ? "Edit" : "Start a return", D(w) ? "PRIMARY" : undefined, D(w) ? "SOLID" : "OUTLINE")]), backAnchor: { href: "#back" }, backLabel: w.title })];
    case "HEAD_GREETING": return [U("DSPageHead", { header: { title: "Good morning, Dana", description: D(w) ? "Here is what needs you today" : "Here is where your orders stand" } })];
    case "HEAD_PART": return [row([txt("Roles", "TITLE_LG"), btn("Add role", undefined, "OUTLINE", "PLUS")], "MD")];
    case "HOME_WAITING": return [waiting(w)];
    case "HOME_SETUP": return [checklist(3)];
    case "HOME_AREAS": return [grid(["Orders", "Invoices", "Help"].map((t, i) => U("DSCardWidget", { header: { title: t, description: ["What you bought", "What you paid", "Ask us anything"][i] }, parts: [{ mtype: "FREE", key: "go", node: U("DSLink", { label: `Open ${t.toLowerCase()}`, anchor: { href: `#${t.toLowerCase()}` }, size: "SM" }) }] })), 3, 2, 1)];
    case "MEASURE_TILES": return [grid(statsOf(w), 4, 2, 2)];
    case "MEASURE_RANKED": return [panel(D(w) ? "Most active" : "Most bought", D(w) ? "Changes made this week" : "Since you joined in 2024", [U("DSList", { divided: true }, (D(w) ? [["Ravi Shah", "Admin · 42 changes", 100, "Today"], ["Mei Tan", "Editor · 31 changes", 74, "Today"], ["Priya Nair", "Admin · 18 changes", 43, "Yesterday"], ["Dana Lee", "Owner · 9 changes", 21, "Today"]] : [["Lumen Bulb", "4 bought · $76.00", 100, "Last: 3 Oct 2026"], ["Lumen Lamp", "3 bought · $131.80", 75, "Last: 12 Nov 2026"], ["Lumen Cable", "2 bought · $36.00", 50, "Last: 26 Nov 2026"], ["Lumen Desk", "1 bought · $212.50", 25, "Last: 29 Oct 2026"]]).map(([t, d, v, when]) => U("DSList.Item", { content: lineItem(String(t), String(d), "CONTENT", row([U("DSProgress", { value: v as number, max: 100, size: "SM" }), muted(String(when))], "MD"), D(w) ? { media: avatarOf(String(t)) } : {}) })))])];
    case "MEASURE_PROGRESS": return [panel("Storage", "14 of 20 GB used", [U("DSProgress", { value: 14, max: 20, size: "SM" })])];
    case "LISTING_TABLE":
      if (c === "CHOOSE") return drawing("LISTING_CHOOSE", "", w).children;
      if (c === "EDIT_IN_PLACE") return drawing("LISTING_EDIT", "", w).children;
      if (c === "REORDER") return [reorderTable(w)];
      return [listPanel(w, c === "" ? undefined : D(w) ? ["Role: Admin, Editor, Viewer", "State: Active"] : ["State: On its way, Delivered, Returned", "Placed in: 2026"])];
    case "LISTING_LIST": return listing(w, c);
    case "LISTING_GRID": return [panel(c === "BY_PICTURE" ? (D(w) ? "Sites" : "What you bought") : (D(w) ? "Apps" : "Addresses and cards"), c === "BY_PICTURE" ? (D(w) ? "Each site as it looks today" : "Tap a picture to see the order") : (D(w) ? "What your team runs on Lumen Labs" : "Where we send things and how you pay"), [gridCards(w, c === "BY_PICTURE")], { footer: [muted(c === "BY_TEXT" ? (D(w) ? "6 apps" : "4 saved") : (D(w) ? "6 sites" : "6 items"))] })];
    case "LISTING_GROUPS": return groups(w, c);
    case "RECORD_FACTS": return [panel(w.record, w.recordLine, [col([["Owner", "Dana Lee"], ["Region", "Mumbai"], ["Created", "3 Mar 2024"]].map(([l, v]) => U("DSDataUnit", { label: l, node: v })), "SM")], { footer: [bk()], end: btn("Edit", undefined, "OUTLINE") })];
    case "RECORD_RELATED": return [c === "FIND_AND_ADD" ? col([U("DSAutocomplete", { placeholder: D(w) ? "Find a role to add" : "Find an item to add", options: (D(w) ? ["Editor", "Reviewer", "Publisher"] : ["Lumen Bulb", "Lumen Cable", "Lumen Shade"]).map((k) => ({ key: k.toLowerCase(), label: k })), valueLink: vl(null) }), lists[0]], "MD") : lists[0]];
    case "RECORD_EDIT": return [panel("Details", "Name, owner and region", [form([field("Name", w.record), field("Owner", "Dana Lee"), field("Region", "Mumbai")])], { footer: [bk(), dis()] })];
    case "RECORD_STEPS": return widgetNodes("PROGRESS_STEPS", "", w);
    case "RECORD_PREVIEW": return [panel("Preview", "What a new member receives", [U("DSCard", {}, [U("DSCard.Content", {}, [txt("Hi Dana, your invite to Lumen Labs is ready.")])])])];
    case "RECORD_DISCUSSION": return [panel("Discussion", "What the team wrote about the Billing app", [col([messageList(w, false), U("DSTextarea", { valueLink: vl(""), rows: 3, placeholder: "Write a note for the team" })], "MD")], { footer: [btn("Post note", "PRIMARY", "SOLID")] })];
    case "RECORD_THREAD": return [panel("Thread", "Messages about the Billing app, oldest first", [col([messageList(w, true), U("DSTextarea", { valueLink: vl(""), rows: 2, placeholder: "Reply to the thread" })], "MD")], { footer: [btn("Send", "PRIMARY", "SOLID")] })];
    case "RECORD_DANGER": return [danger(D(w) ? "app" : "account", "Removes it and its data. It cannot be undone.")];
    case "SETUP_SECTION": return drawing(c === "INHERITED" ? "SETUP_INHERITED" : "SETUP_SECTION", "", w).children;
    case "SETUP_COMPARISON": return drawing("SETUP_COMPARE", "", w).children;
    case "ENTRY_FORM": return drawing("ENTRY_FORM", "", w).children;
    case "ENTRY_STEPS": return [entrySteps(w)];
    case "ENTRY_PREVIEW": return drawing("ENTRY_PREVIEW", "", w).children;
    case "ENTRY_REVEAL": return [revealDialog(w)];
    case "ENTRY_STEP_UP": return [stepUpDialog(w)];
    case "AUTH_PANEL": return [authPanel(w, "SIGN_IN")];
    case "COMMON_FLOOR": return [col([U("DSEmpty", { title: "Page not found", description: "The address may have changed. Go back, or search for what you wanted.", icon: "SEARCH", bordered: true }), btn("Back to home", "PRIMARY", "SOLID")])];
    case "COMMON_FOOTER": return [siteContainer("COMMON_FOOTER", "SHORT", BRIEFS.MARKETING) as Tree];
    default: return null;
  }
}
/** A row of a LIST: the record's name and its one or two facts, its state and time (or total) at its end. */
const recordLine = (w: W, r: unknown[], extra: Tree = {}, end?: unknown): Tree => (D(w)
  ? lineItem(String(r[0]), `${String(r[1])} · ${String(r[2])}`, "CONTENT", end ?? row([r[3], muted(String(r[4]))], "MD"), { media: avatarOf(String(r[0])), ...extra })
  : lineItem(`Order ${String(r[0])}`, `${String(r[2])} · placed ${String(r[1])}`, "CONTENT", end ?? row([r[4], txt(String(r[3]), "TITLE_SM")], "MD"), extra));
const moveButtons = (what: string): Tree => U("DSButtonGroup", {}, [btn(null, undefined, "GHOST", "CHEVRON_UP", `Move ${what} up`), btn(null, undefined, "GHOST", "CHEVRON_DOWN", `Move ${what} down`)]);
const orderRows = (w: W): Array<[string, string, boolean]> => (D(w) ? [["Email and password", "Always first, the platform keeps it there", true], ["Single sign-on with Okta", "Used by 21 of 24 members", false], ["Sign-in link by email", "Used by 3 members", false], ["Passkey", "Not set up by anyone yet", false]] : [["Visa ending 4242", "Expires 12/2028 · tried first", false], ["Mastercard ending 1881", "Expires 03/2027", false], ["Lumen balance, $12.00", "Used when the cards fail", false]]);
const reorderList = (w: W): Tree => panel(D(w) ? "Sign-in methods" : "Payment methods", D(w) ? "The order your members see them on the sign-in page" : "The order we try them when you pay", [stack(orderRows(w).map(([t, d, lock]) => lineItem(t, d, "CONTENT", lock ? badge("Fixed", "DEFAULT") : moveButtons(t), { media: { mtype: "ICON", node: lock ? "KEY" : "GRIP_VERTICAL" } })))], { footer: [btn("Save order", "PRIMARY", "SOLID"), muted("Drag a row, or move it with the arrows")], flush: true });
const tickRow = (w: W, r: unknown[], on: boolean): Tree => recordLine(w, r, { media: { mtype: "CUSTOM", node: U("DSCheckbox", { label: "", ariaLabel: `Select ${String(r[0])}`, valueLink: vl(on) }) } });
const chooseList = (w: W): Tree => panel(w.title, "Tick the ones you want to act on", [stack(w.rows.slice(0, 6).map((r, i) => tickRow(w, r, i === 1 || i === 3 || i === 4)))], { footer: [muted("3 selected of " + w.total), btn(D(w) ? "Change role" : "Return items", undefined, "OUTLINE"), btn("Clear selection", undefined, "GHOST")], flush: true });
const unreadRows = (w: W): Tree[] => (D(w) ? [["Ravi Shah", "Mentioned you in Billing app", "“Dana, can you check the owner?”", "09:12", true], ["Priya Nair", "Asked for access to docs.lumenlabs.example", "Viewer, until 31 Dec 2026", "08:40", true], ["Mei Tan", "Published a site", "docs.lumenlabs.example, 14 pages", "Yesterday", false], ["Joao Costa", "Accepted the invitation", "Editor since 26 Nov 2026", "Yesterday", false]] : [["Lumen Post", "Your order #1048 is out for delivery", "Arrives today between 14:00 and 18:00", "09:12", true], ["Lumen Labs", "Your Lumen Plus renews in 3 days", "$9.00 on 30 Nov 2026, card ending 4242", "08:40", true], ["Lumen Labs", "We changed our terms", "Effective 1 Jan 2027", "Yesterday", false], ["Lumen Post", "Order #1041 was delivered", "Left with the neighbour at number 16", "3 Nov", false]]).map(([who, t, d, when, un]) => lineItem(String(t), String(d), "CONTENT", muted(String(when)), { ...(un ? { unread: true } : {}), media: D(w) ? avatarOf(String(who)) : { mtype: "ICON", node: "BELL" } }));
const reorderTable = (w: W): Tree => {
  const rows: string[][] = D(w) ? [["Owner", "1 member", "Everything, billing included"], ["Admin", "3 members", "Everything but billing"], ["Editor", "9 members", "Content and sites"], ["Viewer", "11 members", "Read only"]] : [["Home", "14 Harbour Lane, Pune", "Default address"], ["Work", "Level 4, 22 Cantt Road, Pune", "Used for invoices"], ["Parents", "7 Lake View, Mumbai", "Gifts"]];
  const hs = ["", D(w) ? "Role" : "Address", D(w) ? "Members" : "Place", D(w) ? "Rights" : "Used for", ""];
  const head = U("DSTable.Head", {}, [U("DSTable.Row", {}, hs.map((h) => U("DSTable.HCell", {}, [h])))]);
  const body = U("DSTable.Body", {}, rows.map(([a, b, c2], i) => U("DSTable.Row", {}, [U("DSTable.DCell", {}, [U("DSIcon", { node: i === 0 && D(w) ? "KEY" : "GRIP_VERTICAL" })]), U("DSTable.DCell", { marked: true }, [a]), U("DSTable.DCell", {}, [b]), U("DSTable.DCell", {}, [c2]), U("DSTable.DCell", { alignment: "END" }, [i === 0 && D(w) ? badge("Fixed", "DEFAULT") : moveButtons(a)])])));
  return panel(D(w) ? "Roles" : "Addresses", D(w) ? "The order of the role picker; Owner is fixed at the top" : "The first one is where orders go by default", [U("DSTable", { hoverable: true }, [head, body])], { footer: [btn("Save order", "PRIMARY", "SOLID")], flush: true });
};
function listing(w: W, c: string): Tree[] {
  if (c === "REORDER") return [reorderList(w)];
  if (c === "CHOOSE") return [chooseList(w)];
  if (c === "UNREAD") return [panel(D(w) ? "Inbox" : "Messages", "2 not read yet", [stack(unreadRows(w))], { end: btn("Mark all read", undefined, "OUTLINE"), flush: true })];
  if (c === "RECENT") return [panel(D(w) ? "Latest members" : "Latest orders", "Newest first", [stack(w.rows.slice(0, 4).map((r) => recordLine(w, r)))], { footer: [link(D(w) ? "See all 24 members" : "See all 31 orders")], flush: true })];
  return [panel(w.title, w.description, [stack(w.rows.slice(0, 6).map((r) => recordLine(w, r)))], { footer: [count(w.count.replace(/\d+ of/, "6 of")), paging(w.total)], end: actions(w), flush: true })];
}
// ── Overlays: a dialog, a sheet and the confirm, drawn from their own units, with the page they stand over drawn beneath them ──
const overlayParts = (unit: string, title: string, description: string, body: unknown[], foot: unknown[], extent: string): Tree => U(unit, { extent, ariaTitle: title }, [U(`${unit}.Header`, {}, [lineItem(title, description, "CONTAINER")]), U(`${unit}.Content`, {}, body), U(`${unit}.Footer`, {}, foot)]);
const beneath = (page: Tree, over: Tree): Tree => col([page, over], "LG");
/** The page an overlay stands over, drawn from the overlay's own subject: the plan for seats, the apps for a new app, the household, the addresses. */
const planBehind = (): Tree => panel("Plan", "Team plan · $49 a month, billed yearly", [stack([["Seats", "24 of 50 used", "Add seats"], ["Renews", "12 Mar 2027 · Visa ending 4242", "Change card"]].map(([t, d, a]) => lineItem(t, d, "CONTENT", btn(a, undefined, "OUTLINE"))))]);
const appsBehind = (): Tree => panel("Apps", "What your team runs on Lumen Labs", [stack([["Billing app", "Owned by Dana Lee · 24 members"], ["Docs publisher", "Owned by Mei Tan · 4 members"], ["Status page", "Owned by Ravi Shah · 3 members"]].map(([t, d]) => lineItem(t, d, "CONTENT", undefined, { media: { mtype: "ICON", node: "APP_WINDOW" } })))], { end: btn("New app", "PRIMARY", "SOLID", "PLUS") });
const householdBehind = (): Tree => panel("Household", "People who can see the orders you share", [stack([["Dana Lee", "You · sees every order"], ["Sam Lee", "Brother · sees 2 shared orders"]].map(([t, d]) => lineItem(t, d, "CONTENT", undefined, { media: avatarOf(t) })))], { end: btn("Add person", undefined, "OUTLINE", "PLUS") });
const addressesBehind = (): Tree => panel("Addresses", "Where we send your orders", [stack([["Home", "14 Harbour Lane, Pune 411001 · default"], ["Work", "Level 4, 22 Cantt Road, Pune 411001"]].map(([t, d]) => lineItem(t, d, "CONTENT", btn("Edit", undefined, "OUTLINE"), { media: { mtype: "ICON", node: "MAP_PIN" } })))], { end: btn("New address", "PRIMARY", "SOLID", "PLUS") });

const seatCount = (): Tree => (dsHas("DSInputNumberGroup")
  ? U("DSInputNumberGroup", { options: [{ key: "editor", label: "Editors", description: "Change content and sites, $12 each a month" }, { key: "viewer", label: "Viewers", description: "Read only, free" }], limits: { editor: { min: 0, max: 20 }, viewer: { min: 0, max: 50 } }, valueLink: vl({ editor: 3, viewer: 10 }) })
  : form([field("Editors", "3"), field("Viewers", "10")]));
function entryDialog(w: W): Tree {
  if (D(w)) return beneath(planBehind(), overlayParts("DSDialog", "Add seats", "Seats are billed from today, pro rata to 12 Mar 2027. You hold 24 of 50.", [seatCount()], [btn("Cancel", undefined, "OUTLINE"), btn("Add 13 seats", "PRIMARY", "SOLID")], "MD"));
  return beneath(householdBehind(), overlayParts("DSDialog", "Add someone to your household", "They can see and track the orders you share with them.", [form([field("Name", "Maya Lee"), field("Email", "maya@northwind.example"), field("Relationship", "Partner")])], [btn("Cancel", undefined, "OUTLINE"), btn("Send invitation", "PRIMARY", "SOLID")], "MD"));
}
function entrySheet(w: W): Tree {
  const body = D(w)
    ? [txt("Details", "TITLE_LG"), form([field("Name", "Support desk"), field("Slug", "support"), field("Owner", "Ravi Shah")]), txt("Access", "TITLE_LG"), form([field("a", true, "switch", "Open to every member"), field("b", false, "switch", "Let viewers comment")]), txt("Region", "TITLE_LG"), form([field("Region", "Mumbai")])]
    : [txt("Delivery", "TITLE_LG"), form([field("Name", "Maya Lee"), field("Address", "7 Lake View, Mumbai 400050"), field("Phone", "+91 98200 55012")]), txt("Notes", "TITLE_LG"), form([field("Note for the courier", "Ring twice, leave at the door", "area")])];
  return beneath(D(w) ? appsBehind() : addressesBehind(), overlayParts("DSSheet", D(w) ? "New app" : "New address", D(w) ? "Name it, say who owns it and who may open it." : "Where should we deliver?", body, [btn("Cancel", undefined, "OUTLINE"), btn(D(w) ? "Create app" : "Save address", "PRIMARY", "SOLID")], "MD"));
}
const revealDialog = (w: W): Tree => D(w)
  ? overlayParts("DSDialog", "Your new API key", "Copy it now and keep it somewhere safe. We show it only once.", [col([U("DSCodeBlockView", { code: "lm_live_4f9a1c7e2b8d03a5c61e9f27", showCopy: true, showHeader: false, bordered: true, rounded: true }), U("DSAlert", { color: "WARNING", text: "You cannot see this key again after you close this window." })], "MD")], [btn("Done", "PRIMARY", "SOLID")], "MD")
  : overlayParts("DSDialog", "Your recovery codes", "Each code works once if you lose your phone. We show them only once.", [col([U("DSCodeBlockView", { code: "4F7K-92QD\nM3XA-81PL\nZ6TR-40WB\nH8CN-57YE\nJ2VU-63GS\nB9DL-14MF", showCopy: true, showHeader: false, bordered: true, rounded: true }), U("DSAlert", { color: "WARNING", text: "Save them now. Closing this window hides them for good." })], "MD")], [btn("I saved them", "PRIMARY", "SOLID")], "MD");
const stepUpDialog = (w: W): Tree => overlayParts("DSDialog", "Confirm it is you", D(w) ? "You are making Mei Tan the owner of Lumen Labs. Enter your password to go on." : "You are changing your sign-in email to dana.lee@northwind.example. Enter your password to go on.", [form([field("Password", "a long phrase")])], [btn("Cancel", undefined, "OUTLINE"), btn("Confirm", "PRIMARY", "SOLID")], "SM");
const confirmDialog = (w: W): Tree => U("DSConfirmDialog", D(w)
  ? { title: "Delete the Billing app?", description: "This removes the app, its 3 sites' links and 120 days of history. It cannot be undone.", color: "ERROR", confirmLabel: "Delete app", cancelLabel: "Keep the app" }
  : { title: "Close your account?", description: "This removes your profile, 31 orders and your saved addresses. It cannot be undone.", color: "ERROR", confirmLabel: "Close account", cancelLabel: "Keep my account" });
const twoPress = (w: W): Tree => col([row([btn(D(w) ? "Delete app" : "Close account", "ERROR", "OUTLINE"), muted("First press: the button asks again")], "MD"), row([btn(D(w) ? "Press again to delete" : "Press again to close", "ERROR", "SOLID"), muted("Second press: it runs")], "MD")], "MD");
const facets = (w: W): Tree => {
  const opts = (xs: Array<[string, number]>): Tree[] => xs.map(([l, n]) => ({ key: l.toLowerCase().replace(/\W+/g, "-"), label: l, count: n }));
  const list = D(w)
    ? [{ mtype: "SELECT_MULTI", key: "role", label: "Role", valueLink: vl(["editor"]), options: opts([["Owner", 1], ["Admin", 3], ["Editor", 9], ["Viewer", 11]]) }, { mtype: "SELECT_MULTI", key: "state", label: "State", valueLink: vl([]), options: opts([["Active", 21], ["Invited", 2], ["Suspended", 1]]) }, { mtype: "BOOLEAN", key: "two", label: "Sign-in", labelTrue: "Two-step sign-in on", count: 17, valueLink: vl(null) }]
    : [{ mtype: "SELECT_MULTI", key: "state", label: "State", valueLink: vl(["delivered"]), options: opts([["Processing", 1], ["On its way", 1], ["Delivered", 26], ["Returned", 3]]) }, { mtype: "NUMBER_RANGE", key: "total", label: "Total", min: 0, max: 300, step: 10, currencyCode: "USD", valueLink: vl([20, 220]), distribution: [9, 7, 5, 4, 3, 2, 1] }, { mtype: "SELECT", key: "year", label: "Placed in", valueLink: vl("2026"), options: opts([["2026", 14], ["2025", 12], ["2024", 5]]) }];
  const rows = w.rows.filter((r) => (D(w) ? r[2] === "Editor" : (r[4] as Tree).props?.label === "Delivered")).map((r) => recordLine(w, r));
  return U("DSPageFrameAside", { main: panel(w.title, D(w) ? "9 editors of 24 members" : "26 delivered of 31 orders", [stack(rows)], { flush: true, footer: [count(`${rows.length} of ${D(w) ? 9 : 26} shown`)] }), aside: U("DSFilterFacets", { facets: list, title: "Filters" }) });
};
const talk = (w: W): Array<[string, string, string, string, boolean]> => (D(w)
  ? [["Mei Tan", "Editor", "I moved the Billing app to the Pune team, so Priya can see its invoices.", "Mon 24 Nov, 10:12", false], ["Dana Lee", "Owner", "Thanks. I will check the owner field before we close this.", "Mon 24 Nov, 10:30", true], ["Ravi Shah", "Admin", "The owner is Dana Lee now. Anything left open?", "Today, 09:02", false]]
  : [["Lumen Support", "Support", "Your lamp left our depot this morning. Lumen Post will text you before it arrives.", "Mon 24 Nov, 10:12", false], ["You", "", "Can it be left with the neighbour at number 16?", "Mon 24 Nov, 10:30", true], ["Lumen Support", "Support", "Yes, we added that to the delivery note.", "Today, 09:02", false]]);
/** The messages of a record: a DSChatMessage for each where the design system has one, else a divided list of lines with the time at their end. */
const messageList = (w: W, thread: boolean): Tree => (dsHas("DSChatMessage")
  ? col(talk(w).map(([n, role, m, when, own], i) => U("DSChatMessage", { title: n, ...(role ? { description: role } : {}), media: avatarOf(n), message: m, time: when, own, showSender: !own && (!thread || i === 0 || talk(w)[i - 1][0] !== n) })), "MD")
  : stack(talk(w).map(([n, role, m, when]) => lineItem(n, m, "CONTENT", muted(when), { media: avatarOf(n) }))));
const keysBehind = (w: W): Tree => panel(D(w) ? "API keys" : "Two-step methods", D(w) ? "What your apps use to reach Lumen Labs" : "Ways to prove it is you when you sign in", [stack((D(w) ? [["Billing sync", "Created 3 Mar 2026 · last used today", "KEY"], ["Docs publisher", "Created 12 Sep 2026 · last used yesterday", "KEY"]] : [["Authenticator app", "Added 3 Mar 2026 · used today", "SHIELD"], ["Phone ending 0142", "Added 12 Sep 2025 · used 2 Nov 2026", "PHONE"]]).map(([t, d, ic]) => lineItem(t, d, "CONTENT", btn(D(w) ? "Revoke" : "Remove", undefined, "OUTLINE"), { media: { mtype: "ICON", node: ic } })))], { end: btn(D(w) ? "New API key" : "Add a method", undefined, "OUTLINE", "PLUS") });
const ownerBehind = (w: W): Tree => panel(D(w) ? "Ownership" : "Sign-in email", D(w) ? "Who owns Lumen Labs and its billing" : "Where we send codes and receipts", [form([field(D(w) ? "Owner" : "Email", D(w) ? "Dana Lee" : "dana@northwind.example")])], { footer: [btn("Save changes", "PRIMARY", "SOLID")] });
const gridCards = (w: W, picture: boolean): Tree => {
  const data: string[][] = D(w)
    ? (picture ? [["docs.lumenlabs.example", "Docs site, 14 pages, published today", "Live"], ["www.lumenlabs.example", "Marketing site, 22 pages, published 21 Nov 2026", "Live"], ["help.lumenlabs.example", "Help centre, 48 articles, published 3 Nov 2026", "Live"], ["status.lumenlabs.example", "Status page, 3 pages, no changes since 9 Sep 2026", "Draft"], ["careers.lumenlabs.example", "Careers site, 6 pages, first draft saved yesterday", "Draft"], ["labs.lumenlabs.example", "Experiments, 2 pages, taken offline on 14 Oct 2026", "Offline"]]
      : [["Billing app", "Invoices, plans and card payments for the whole team. Owned by Dana Lee in Mumbai.", "24 members"], ["Support desk", "Where requests from customers arrive and are answered. Owned by Ravi Shah.", "9 members"], ["Docs publisher", "Writes the docs site from the repository on every merge to main.", "4 members"], ["Status page", "Shows customers whether Lumen Labs is up, with a history of incidents.", "3 members"], ["Roles", "Who may open what, set once for the whole organization.", "24 members"], ["Sign-in", "Email, passkeys and single sign-on with Okta for all members.", "24 members"]])
    : (picture ? [["Lumen Lamp", "Warm white, 2 bought, $84.00", "Delivered 3 Nov"], ["Lumen Desk", "Oak, 140 cm, $212.50", "Delivered 29 Oct"], ["Lumen Shade", "Linen, medium, $64.20", "Returned"], ["Lumen Chair", "Grey wool, $129.00", "Delivered 21 Aug"], ["Lumen Stand", "Brass, $38.00", "Delivered 2 Sep"], ["Lumen Bulb", "E27, pack of 4, $19.00", "Delivered 3 Oct"]]
      : [["Home", "14 Harbour Lane, Pune 411001. Ring twice and leave the parcel at the door.", "Default address"], ["Work", "Level 4, 22 Cantt Road, Pune 411001. Reception signs for parcels.", "Used for invoices"], ["Parents", "7 Lake View, Mumbai 400050. Delivery only before 18:00.", "Gifts"], ["Visa ending 4242", "Dana Lee, expires 12/2028. Tried first when you pay.", "Default card"]]);
  return grid(data.map(([t, d, f]) => U("DSItemCard", { card: {}, item: { title: t, description: d, facts: [f], pageLevel: "WIDGET", orientation: "VERTICAL", media: picture ? { mtype: "CUSTOM", node: slot(`${t}, a picture of it`, D(w) ? "16:10" : "1:1") } : { mtype: "ICON", node: D(w) ? "APP_WINDOW" : "MAP_PIN" } } })), 3, 2, 1);
};
type Kind = { title: string; icon: string; records: Array<[string, string, string?]>; inactive?: number; add: string };
const kindsOf = (w: W, c: string): Kind[] => {
  if (c === "ALL_KINDS") return D(w)
    ? [{ title: "Owners", icon: "KEY", add: "Add sign-in", records: [["Email and password", "Required for all 1 owner"], ["Passkey", "Optional, 1 owner uses it"]] }, { title: "Admins", icon: "SHIELD", add: "Add sign-in", records: [["Email and password", "Required for all 3 admins"], ["Okta single sign-on", "Optional, 3 admins use it"]] }, { title: "Editors", icon: "USER", add: "Add sign-in", records: [["Okta single sign-on", "Required for all 9 editors"]] }, { title: "Viewers", icon: "EYE", add: "Add sign-in", records: [] }]
    : [{ title: "Authenticator app", icon: "SHIELD", add: "Set up", records: [["Authy on Dana's phone", "Added 3 Mar 2026, used today"]] }, { title: "Passkey", icon: "KEY", add: "Set up", records: [] }, { title: "Text message", icon: "PHONE", add: "Set up", records: [] }, { title: "Recovery codes", icon: "FILE", add: "Make new codes", records: [["6 codes left", "Made 3 Mar 2026"]] }];
  return D(w)
    ? [{ title: "Email templates", icon: "MAIL_OPEN", add: "Add template", inactive: c === "FOLD_INACTIVE" ? 2 : undefined, records: [["Invitation", "Sent when someone is invited · edited 24 Nov 2026"], ["Password reset", "Sent when someone asks for a link · edited 3 Sep 2026"], ["Invoice ready", "Sent on the 1st of the month · edited 12 Mar 2026"]] }, { title: "Integrations", icon: "PLUG", add: "Add integration", inactive: c === "FOLD_INACTIVE" ? 1 : undefined, records: [["Postmark", "Email, 12,400 sent this month"], ["Firebase", "Push, 3,100 sent this month"], ["Slack", "Alerts to #ops"]] }, { title: "Webhooks", icon: "ZAP", add: "Add webhook", records: [["Billing events", "hooks.lumenlabs.example/billing · last call today 09:12"], ["Member events", "hooks.lumenlabs.example/members · last call yesterday"]] }]
    : [{ title: "Addresses", icon: "MAP_PIN", add: "Add address", inactive: c === "FOLD_INACTIVE" ? 2 : undefined, records: [["Home", "14 Harbour Lane, Pune"], ["Work", "Level 4, 22 Cantt Road, Pune"]] }, { title: "Cards", icon: "CREDIT_CARD", add: "Add card", records: [["Visa ending 4242", "Expires 12/2028, default"], ["Mastercard ending 1881", "Expires 03/2027"]] }, { title: "Devices", icon: "PHONE", add: "Add device", records: [["Dana's iPhone", "Pune, India · signed in today"], ["Work laptop", "Pune, India · signed in 24 Nov 2026"]] }];
};
const kindCard = (k: Kind): Tree => U("DSCardWidget", { header: { title: k.title, pageLevel: "WIDGET", media: { mtype: "ICON", node: k.icon }, ...(k.records.length ? { description: `${k.records.length} ${k.records.length === 1 ? "record" : "records"}` } : { description: "None yet" }) }, headerActions: btn(k.add, undefined, "OUTLINE", "PLUS"), parts: k.records.length ? [{ mtype: "ITEMS", key: "r", items: k.records.map(([t, d], i) => ({ key: `r${i}`, title: t, ...(d ? { description: d } : {}) })) }] : [{ mtype: "FREE", key: "e", node: muted("Nothing added. It stays here so you can add one.") }], ...(k.inactive ? { footer: link(`${k.inactive} inactive`) } : {}) });
function groups(w: W, c: string): Tree[] {
  if (c === "SECTIONS") {
    const sections: Array<[string, string, string[][]]> = D(w)
      ? [["Organization", "Open to every member", [["Roles", "Who may open what"], ["Sign-in", "Email, passkeys, Okta"], ["Billing app", "Invoices and plans"]]], ["Team", "Open to the people in a team", [["Support desk", "9 members"], ["Docs publisher", "4 members"]]]]
      : [["Shared with you", "Things Dana Lee shared", [["Household orders", "Maya Lee and 1 more"], ["Family plan", "Lumen Plus"]]], ["Only yours", "Nobody else sees these", [["Saved addresses", "Home, Work"], ["Payment methods", "2 cards"]]]];
    return [col(sections.map(([t, d, cards]) => col([lineItem(t, d, "CONTAINER"), grid(cards.map(([a, b]) => U("DSCardWidget", { header: { title: a, description: b, pageLevel: "WIDGET", media: { mtype: "ICON", node: D(w) ? "APP_WINDOW" : "USERS" } }, parts: [{ mtype: "FREE", key: "o", node: link(`Open ${a.toLowerCase()}`) }] })), 3, 2, 1)], "MD")), "XL")];
  }
  const kinds = kindsOf(w, c);
  return [col([lineItem(c === "ALL_KINDS" ? (D(w) ? "Sign-in by member category" : "Two-step methods") : D(w) ? "Notifications" : "Your account", c === "ALL_KINDS" ? (D(w) ? "How each kind of member proves who they are" : "Every way to prove it is you, set up or not") : D(w) ? "What Lumen Labs sends, and where it goes" : "What we hold for you", "PAGE"), grid(kinds.map(kindCard), c === "ALL_KINDS" && kinds.length === 4 ? 4 : 3, 2, 1)], "LG")];
}
const D = (w: W): boolean => w.kind === "DASHBOARD";

export function appWidget(code: string, c: string, w: W): Tree[] | null {
  const nodes = widgetNodes(code, c, w);
  return nodes && sectioned(nodes);
}
function widgetNodes(code: string, c: string, w: W): Tree[] | null {
  const P = (title: string, content: unknown[], end?: unknown): Tree => panel(title, null, content, { end });
  switch (code) {
    case "CARD_DEFAULT":
      if (c === "ITEMS") return [U("DSCardWidget", { header: { title: w.record, description: w.recordLine }, parts: [{ mtype: "ITEMS", key: "p", items: [{ key: "a", title: "Owner", description: "Dana Lee" }, { key: "b", title: "Region", description: "Mumbai" }, { key: "c", title: "Created", description: "3 Mar 2024" }] }], footer: btn("Open", undefined, "OUTLINE") })];
      if (c === "AREA") return containerNodes("HOME_AREAS", "", w);
      return [panel(w.title, w.description, [grid([stat(w.heads[0], "24", "+2 this week", "See all"), stat(w.heads[2], "9", "1 needs setup", "See all"), stat(w.heads[4], "3", "waiting", "See all")], 3, 2, 1)])];
    case "LINE_RECORD": {
      if (c === "EVENT") return [P("Event", [stack(unreadRows(w).slice(2).map((r) => ({ ...r, props: { ...r.props, unread: undefined } })))])];
      if (c === "UNREAD") return [P("Unread", [stack(unreadRows(w))])];
      const rows = c === "SIDE_LIST" ? (D(w) ? [["Dana Lee", "Owner · today"], ["Ravi Shah", "Admin · today"], ["Mei Tan", "Editor · yesterday"], ["Aisha Khan", "Viewer · 24 Nov"]] : [["Dana Lee", "You"], ["Maya Lee", "Partner · sees shared orders"], ["Sam Lee", "Brother · sees 2 orders"]]).map(([n, d]) => lineItem(n, d, "CONTENT", undefined, { media: avatarOf(n) })) : w.rows.slice(0, 4).map((r) => recordLine(w, r));
      return [c === "SIDE_LIST" ? panel(D(w) ? "Seen last" : "Your household", null, [col(rows, "SM")], { end: link("See all") }) : P(w.title, [stack(rows)])];
    }
    case "VALUE_STATE": return [P("States", [row([badge("Active", "SUCCESS"), badge("Invited", "INFO"), badge("Suspended", "ERROR"), badge("Pending", "WARNING")], "SM")])];
    case "VALUE_ENTERED": if (c === "SWITCH") return [P("Entered values", [form([field("a", true, "switch", "Require two-step sign-in"), field("b", false, "switch", "Let members stay signed in")])])];
      return [P("Entered values", [form([field("Name", w.rows[0][0] as string), field("Email", String(w.rows[0][1])), field("Note", "Joined from the Pune office.", "area")])])];
    case "VALUE_READ":
      if (c === "CODE") return [P("Read as code", [col([U("DSDataUnit", { label: D(w) ? "API key" : "Tracking number", node: U("DSCodeBlockView", { code: D(w) ? "lm_live_4f9a1c7e2b8d03a5" : "LP-88213-IN", showCopy: true, showHeader: false, bordered: true, rounded: true }) }), U("DSDataUnit", { label: D(w) ? "Webhook address" : "Order link", node: U("DSCodeBlockView", { code: D(w) ? "hooks.lumenlabs.example/billing" : "lumenlabs.example/o/1048", showCopy: true, showHeader: false, bordered: true, rounded: true }) })], "MD")])];
      if (c === "INHERITED") return [P("Follows a default", [grid([["Session length", "8 hours", "Organization default: 12 hours", "Use the default"], ["Quiet hours", "22:00 to 07:00", "Follows the organization default", ""]].map(([l, v, d, a]) => U("DSDataUnit", { label: l, node: row([txt(v), muted(d), ...(a ? [link(a)] : [])], "MD") })), 2, 1, 1)])];
      return [P("Read values", [grid((D(w) ? [["Name", "Mei Tan"], ["Email", "mei@lumenlabs.example"], ["Role", "Editor"], ["Joined", "3 Mar 2024"]] : [["Order", "#1048"], ["Placed", "12 Nov 2026"], ["Total", "$84.00"], ["Paid with", "Visa ending 4242"]]).map(([l, v]) => U("DSDataUnit", { label: l, node: v })), 4, 2, 1)])];
    case "BROWSE_FILTERS": {
      if (c === "SAVED_VIEWS") return [P("Filters", [row([U("DSSelect", { options: ["All members", "Admins", "Invited this week"].map((k) => ({ key: k, label: k })), valueLink: vl("Admins") }), filterBar(w)], "MD")])];
      if (c === "APPLIED_CHIPS") return [P("Filters", [filterBar(w), chips(["Admin", "Active"])])];
      if (c === "QUICK_PILLS") return [P("Filters", [row(["All", "Active", "Invited", "Suspended"].map((l, i) => btn(l, i === 0 ? "PRIMARY" : undefined, i === 0 ? "SOLID" : "OUTLINE")), "SM"), filterBar(w, false)])];
      return [P("Filters", [filterBar(w)])];
    }
    case "ACTION_BULK": return [P("Records", [row([muted("3 selected"), btn(D(w) ? "Change role" : "Return items", undefined, "OUTLINE"), btn("Export", undefined, "OUTLINE"), btn("Remove", "ERROR", "OUTLINE")], "SM"), dataTable(w.heads, w.rows.slice(0, 3))])];
    case "NOTICE_EMPTY": {
      const text = c === "NO_RESULTS" ? ["No matches", "Nothing fits the filters you set. Clear them to see everything.", "SEARCH"] : c === "ALL_DONE" ? ["All done", "Nothing is waiting for you.", "CHECK"] : c === "CONNECTION_LOST" ? ["Cannot reach the server", "Check your connection. We keep trying.", "GLOBE"] : [D(w) ? "No sites yet" : "No orders yet", D(w) ? "Create the first site" : "Your first order will appear here", "GLOBE"];
      return [P("Records", [U("DSEmpty", { title: text[0], description: text[1], icon: text[2], bordered: true })])];
    }
    case "NOTICE_DEFAULT": {
      const alert = U("DSAlert", { color: "WARNING", text: D(w) ? "Your card ending 4242 expires in December" : "Your order #1048 is delayed", description: D(w) ? "Add a new card before 1 Dec 2026 to keep your 5 sites live." : "It now arrives on Friday 28 Nov 2026. We are sorry." });
      return [c === "PAGE" ? col([alert, U("DSPageHead", { header: { title: w.title, description: w.description }, headerActions: actions(w) })], "MD") : P("Notice", [alert])];
    }
    case "ACTION_JUMP": return [P("Jump", [U("DSCommandPalette", { placeholder: "Jump to a page or a record" })])];
    case "CARD_STAT": {
      if (c === "WITH_DELTA") return [grid((D(w) ? [["Members", "24", "+2", "up from 22 last week"], ["Sites live", "5", "0", "same as last week"], ["Sign-ins", "1,284", "+12%", "up from 1,147"]] : [["Spent this year", "$418", "+$84", "since 1 Nov"], ["Open orders", "2", "-1", "one arrived this week"], ["Points", "340", "+60", "since last month"]]).map(([a, b, d, n]) => U("DSCardWidget", { parts: [{ mtype: "FREE", key: "s", node: col([muted(a, "TITLE_SM"), row([txt(b, "HEADING_MD"), badge(d, d.startsWith("-") ? "ERROR" : d === "0" ? "DEFAULT" : "SUCCESS")], "SM"), muted(n, "CONTENT_XS")], "XS") }] })), 3, 2, 1)];
      if (c === "AS_STATE_FILTER") return [grid((D(w) ? [["All", "24"], ["Active", "21"], ["Invited", "2"], ["Suspended", "1"]] : [["All", "31"], ["Processing", "1"], ["On its way", "1"], ["Delivered", "26"], ["Returned", "3"]]).map(([a, b], i) => U("DSCardWidget", { surface: i === 1 ? { raised: true, elevation: "MD" } : {}, parts: [{ mtype: "FREE", key: "s", node: col([muted(a, "TITLE_SM"), txt(b, "HEADING_MD")], "XS") }] })), D(w) ? 4 : 5, 2, 2)];
      return [grid(statsOf(w), 4, 2, 2)];
    }
    case "PROGRESS_CHECKLIST": return [checklist(3)];
    case "PROGRESS_STEPS": return [P("Where it is", [U("DSStepper", { items: ["Placed", "Packed", "On its way", "Delivered"].map((l, i) => ({ key: `s${i}`, label: l, ...(i < 2 ? { taskState: "DONE" } : i === 2 ? { taskState: "WORKING" } : {}) })), activeKey: "s2", type: "NUMBER" })])];
    case "CARD_PLAN": return [grid([["Starter", 0, ["1 app", "5 members"]], ["Team", 49, ["Unlimited apps", "50 members"]], ["Company", 199, ["Single sign-on", "Support"]]].map(([n, p, fs], i) => U("DSCardWidget", { header: { title: n as string }, surface: { raised: c === "CURRENT_PLAN" && i === 1 }, parts: [{ mtype: "FREE", key: "p", node: row([U("DSFormatCurrency", { value: p as number, currencyCode: "USD" }), muted("a month")], "SM") }, { mtype: "ITEMS", key: "f", items: (fs as string[]).map((f, j) => ({ key: `f${j}`, title: f })) }, { mtype: "FREE", key: "c", node: c === "CURRENT_PLAN" && i === 1 ? badge("Current plan", "PRIMARY", "SOLID") : btn(`Choose ${n}`, undefined, "OUTLINE") }] })), 3, 2, 1)];
    case "CARD_RECORD": return [grid((D(w)
      ? [["Billing app", "Invoices and plans for the team", 80, "On track", "SUCCESS", "2026-12-12", ["Dana Lee", "Mei Tan", "Ravi Shah", "Priya Nair"]], ["Support desk", "Where customer requests arrive", 45, "At risk", "WARNING", "2027-01-20", ["Ravi Shah", "Aisha Khan"]], ["Docs publisher", "Writes the docs site on each merge", 100, "Done", "DEFAULT", "2026-11-21", ["Mei Tan", "Joao Costa", "Sofia Rossi"]]]
      : [["Order #1048", "Lumen Lamp, 2 items, with Lumen Post", 66, "On its way", "INFO", "2026-11-27", ["Dana Lee", "Maya Lee"]], ["Order #1052", "Lumen Cable, packed today", 20, "Processing", "INFO", "2026-11-28", ["Dana Lee"]], ["Order #1041", "Lumen Desk, oak, 140 cm", 100, "Delivered", "SUCCESS", "2026-10-29", ["Dana Lee", "Maya Lee", "Sam Lee"]]]
    ).map(([t, d, pct, flag, tone, iso, who]) => U("DSCardWidget", { header: { title: t as string, description: d as string, pageLevel: "WIDGET" }, headerActions: badge(flag as string, tone as string), parts: [{ mtype: "FREE", key: "p", node: U("DSProgress", { value: pct as number, max: 100, size: "SM" }) }], footer: row([U("DSAvatarGroup", { size: "SM", max: 3 }, (who as string[]).map((n) => U("DSAvatar", { title: n }))), muted(D(w) ? (pct === 100 ? "Done" : "Due") : (pct === 100 ? "Delivered" : "Arrives")), U("DSFormatDate", { isoDate: iso as string })], "SM") })), 3, 2, 1)];
    case "VALUE_ACTOR": return [P("Actors", [row([lineItem("Dana Lee", "Owner", "CONTENT", undefined, { media: { mtype: "AVATAR", title: "Dana Lee" } }), lineItem("Mei Tan", "Editor", "CONTENT", undefined, { media: { mtype: "AVATAR", title: "Mei Tan" } })], "XL")])];
    case "BROWSE_FACETS": return [facets(w)];
    case "ACTION_CONFIRM": return [c === "TWO_PRESS" ? P(D(w) ? "Delete the app" : "Close the account", [twoPress(w)]) : col([danger(D(w) ? "app" : "account", "Removes it and its data. It cannot be undone."), confirmDialog(w)], "LG")];
    case "BROWSE_SEARCH": return [P("Search", [U("DSAutocomplete", { placeholder: w.search, options: w.rows.slice(0, 4).map((r) => ({ key: String(r[0]).toLowerCase(), label: String(r[0]) })), valueLink: vl(null) })])];
    case "BROWSE_RANGE": return [P("Range", [U("DSDateRangePicker", { valueLink: vl({ start: null, end: null }) })])];
    case "PROGRESS_METER": return [P("Progress", [U("DSProgress", { value: 14, max: 20, size: "SM" })])];
    default: return null;
  }
}
export { slot };
