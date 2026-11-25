// The words of the sample products: one for each site category, each a made-up company whose names, dates and figures are sample values.
// A recipe reads its words from the brief of the category it draws, so the same section reads differently on a marketing site, a docs site
// and a marketplace, and no sample ever holds filler text.
export type Line = [key: string, title: string, description: string, icon: string];
export type Brief = {
  org: string; promise: string; legal: string; emails: string[];
  nav: Array<[label: string, key: string]>;
  groups: Array<[key: string, title: string, pages: string[]]>;
  claim: string; claim2: string; problem: string; problem2: string; facts: string[];
  heroCta: [main: string, second: string];
  doors: Line[]; points: Line[]; steps: Line[]; qa: Array<[string, string]>;
  code: { file: string; language: string; text: string };
  records: Array<[title: string, description: string, date: string]>;
  quotes: Array<[text: string, name: string, role: string]>;
  people: Array<[string, string]>;
  plans: Array<{ name: string; price: number; line: string; feats: string[]; recommended?: boolean }>;
  numbers: Array<[string, string]>;
  closing: { title: string; description: string; cta: string; second: string };
  article: { title: string; lede: string; by: string; date: string };
  choose: Array<[string, string]>;
  marks: string[];
  places: Array<[string, string]>;
  picture: { hero: string; show: string; proof: string };
};

export const MARKETING: Brief = {
  org: "Lumen Labs", promise: "One foundation for every app your team opens.", legal: "© 2026 Lumen Labs, Pune. All rights reserved.",
  emails: ["hello@lumenlabs.example", "support@lumenlabs.example", "press@lumenlabs.example"],
  nav: [["Platform", "platform"], ["Apps", "apps"], ["Sites", "sites"], ["Resources", "resources"], ["Company", "company"]],
  groups: [["platform", "Platform", ["Sign-in", "Members and roles", "Audit log"]], ["apps", "Apps", ["Admin console", "Billing", "Support desk"]],
    ["sites", "Sites", ["Marketing site", "Docs site", "Status page"]], ["resources", "Resources", ["Guides", "Reference", "Changelog"]], ["company", "Company", ["About", "Blog", "Careers"]]],
  claim: "Every app your team opens, on one foundation", claim2: "Sign-in, members, roles and sites are built once. A new app starts with them and looks like the rest.",
  problem: "Every new app rebuilds the base", problem2: "A sign-in, an admin and a look get built again for each app, and every person who uses them learns each one from the start.",
  facts: ["Sign-in", "Members", "Roles", "Sites"], heroCta: ["See the apps", "Read the docs"],
  doors: [["console", "Admin console", "Where a team manages its organization and its apps.", "LAYOUT_GRID"], ["sites", "Public sites", "The public pages an app shows before anyone signs in.", "GLOBE"], ["members", "Members and roles", "Who is in an organization and what each person may do.", "USERS"]],
  points: [["p1", "Invite by email", "The person gets a link and picks their own password.", "MAIL_OPEN"], ["p2", "Change a role once", "Every app reads the same role, so a change reaches all of them together.", "KEY"], ["p3", "See who did what", "Each change is kept with its author and time.", "LIST"]],
  steps: [["s1", "Open the member list", "Roles belong to a member, so start from the person.", ""], ["s2", "Pick the member", "Their page shows the roles they hold now.", ""], ["s3", "Add the role", "Choose the role by its name; it carries a set of permissions.", ""], ["s4", "Check an app", "Sign in as that member: the screens the role allows show.", ""]],
  qa: [["What does an app start with?", "Sign-in, members, roles and a public site, already wired."], ["Can we bring our own sign-in?", "Yes. The foundation reads your identity provider; members still live in one list."], ["What does it cost to try?", "Nothing until the first organization goes live."]],
  code: { file: "role-grant.json", language: "JSON", text: "{\n  \"member\": \"dana.lee@example.com\",\n  \"role\": \"Editor\",\n  \"organization\": \"Lumen Labs\"\n}" },
  records: [["Roles in a day", "How one team set this up, in a short read.", "12 March 2026"], ["One sign-in for nine apps", "What changed when the apps shared a sign-in.", "2 March 2026"], ["Moving a team to Lumen", "A week, a checklist and what we would do again.", "20 February 2026"], ["Audit history, explained", "What is kept, for how long, and who may read it.", "9 February 2026"], ["A site per brand", "Three brands, one set of blocks.", "28 January 2026"], ["Billing across apps", "One plan and one invoice for every app.", "14 January 2026"]],
  quotes: [["We moved nine apps onto one sign-in in a single quarter, and nobody on the team had to relearn a screen.", "Priya Nair", "Head of Engineering, Northwind"], ["A role is set once now. The change reaches every app before I have closed the page.", "Omar Haddad", "IT lead, Harbour Foods"], ["Our audit review used to take two days. It takes an afternoon.", "Sofia Rossi", "Security, Atlas Freight"]],
  people: [["Dana Lee", "Founder"], ["Ravi Shah", "Engineering"], ["Mei Tan", "Design"], ["Omar Haddad", "Support"], ["Priya Nair", "Product"], ["Joao Costa", "Sales"], ["Aisha Khan", "Security"], ["Sofia Rossi", "Finance"]],
  plans: [{ name: "Starter", price: 0, line: "For a first app each month.", feats: ["1 app", "5 members"] }, { name: "Team", price: 49, line: "For a team with several apps each month.", feats: ["Unlimited apps", "50 members", "Audit history"], recommended: true }, { name: "Company", price: 199, line: "For an organization each month.", feats: ["Everything in Team", "Single sign-on", "Support"] }],
  numbers: [["120+", "organizations"], ["9", "apps on one foundation"], ["3 weeks", "saved per new app"]],
  closing: { title: "Start with the console", description: "Make an organization, invite your team, then add the first app. The console walks you through each step.", cta: "Open the console", second: "Read the guides" },
  article: { title: "How one role holds in every app", lede: "A role is set once, on the member. This is how every app reads it.", by: "Dana Lee", date: "12 March 2026" },
  choose: [["I run the organization", "What an admin sees first"], ["I build an app", "What a developer sees first"]],
  marks: ["Northwind", "Harbour Foods", "Atlas Freight", "Kite Health", "Orchard Bank"],
  places: [["Pune", "Baner Road, 4th floor"], ["Bengaluru", "Indiranagar, 12th Main"], ["London", "Clerkenwell Green"]],
  picture: { hero: "An organization's apps in the admin console", show: "The member list in the admin console", proof: "The change in the audit view" },
};

export const RESOURCES: Brief = {
  ...MARKETING,
  org: "Lumen Docs", promise: "Guides, reference and a changelog for Lumen Labs.", legal: "© 2026 Lumen Labs. Docs are open for reading.",
  nav: [["Guides", "guides"], ["Reference", "reference"], ["Changelog", "changelog"], ["Examples", "examples"], ["Support", "support"]],
  groups: [["guides", "Guides", ["Quickstart", "Assign a role", "Invite a member"]], ["reference", "Reference", ["Members", "Roles", "Audit log"]], ["changelog", "Changelog", ["This month", "Earlier", "Upgrade notes"]], ["examples", "Examples", ["Node", "Python", "curl"]], ["support", "Support", ["Help centre", "Status", "Community"]]],
  claim: "Give a member a role in five minutes", claim2: "Start with the quickstart, then use the reference when you know what you are looking for.",
  problem: "Roles are the part teams get wrong", problem2: "A role set in one app and forgotten in another is how access drifts. These pages show the one place a role is set.",
  facts: ["Quickstart", "Reference", "Changelog"], heroCta: ["Start the quickstart", "Read the reference"],
  doors: [["give-role", "Assign a role", "Four steps, about five minutes.", "KEY"], ["roles", "Roles and permissions", "Every role, and the set behind it.", "SHIELD"], ["webhooks", "Webhooks", "Hear about a change as it happens.", "CODE"]],
  qa: [["Which role should I give first?", "Start with Editor. It can change content and cannot change billing."], ["Does a role reach every app?", "Yes. Every app reads the role from the member, so one change covers them all."], ["How long does a change take?", "Seconds. Each app shows it on the next page."]],
  steps: [["s1", "Install the client", "One package, no setup.", ""], ["s2", "Find the member", "Look the member up by email.", ""], ["s3", "Add the role", "Name the role; it carries its permissions.", ""], ["s4", "Check it worked", "Sign in as that member and open an app.", ""]],
  points: [["p1", "One call", "A single call gives a member a role.", "CODE"], ["p2", "Every app reads it", "The role holds in all nine apps at once.", "KEY"], ["p3", "Kept in the audit log", "Each grant is stored with its author and time.", "LIST"]],
  numbers: [["1 call", "to give a role"], ["9", "apps read it"], ["5 minutes", "from start to done"]],
  quotes: [["The quickstart worked the first time. Roles were live in all our apps in an afternoon.", "Priya Nair", "Engineer, Northwind"], ["The reference tells me the error before I hit it.", "Omar Haddad", "Developer, Harbour Foods"], ["Short, exact and current.", "Sofia Rossi", "Developer, Atlas Freight"]],
  code: { file: "give-role.js", language: "JAVASCRIPT", text: "await lumen.members.addRole('dana.lee@example.com', 'Editor')" },
  records: [["Assign a role", "Four steps, about five minutes.", "12 November 2026"], ["Invite a member", "Add a person to an organization.", "9 November 2026"], ["Connect a sign-in", "Use the account people already have.", "2 November 2026"], ["Read the audit log", "Who changed what, and when.", "28 October 2026"], ["Rotate an API key", "Replace a key without a gap.", "21 October 2026"], ["Add a webhook", "Hear about a change as it happens.", "14 October 2026"]],
  article: { title: "Assign a role to a member", lede: "Four steps, about five minutes. You need an owner account and one member to give the role to.", by: "Ravi Shah", date: "12 November 2026" },
  closing: { title: "Still need help?", description: "Search the docs first. If the answer is not there, write to support and a person replies within one working day.", cta: "Write to support", second: "Search the docs" },
  picture: { hero: "The members API in a terminal", show: "The member page after the call", proof: "The audit view after the change" },
};

export const MARKETPLACE: Brief = {
  ...MARKETING,
  org: "Lumen Market", promise: "Add-ons, courses and workshops from the people who build on Lumen.", legal: "© 2026 Lumen Market, Pune. Every seller is verified.",
  nav: [["Add-ons", "add-ons"], ["Courses", "courses"], ["Workshops", "workshops"], ["Sell", "sell"], ["Help", "help"]],
  groups: [["add-ons", "Add-ons", ["Sign-in", "Billing", "Reports"]], ["courses", "Courses", ["Getting started", "Roles", "Audit"]], ["workshops", "Workshops", ["This month", "Online", "In person"]], ["sell", "Sell", ["Become a seller", "Fees", "Guidelines"]], ["help", "Help", ["Orders", "Refunds", "Contact"]]],
  claim: "Find what your Lumen setup is missing", claim2: "Add-ons, courses and workshops, each from a seller we have checked, each priced before you open it.",
  problem: "Good add-ons are hard to find", problem2: "Teams ask each other in chat, and the answer is a link that went stale. Here every listing shows its price, its seller and its reviews.",
  facts: ["Verified sellers", "Prices in one currency", "Refund in 14 days"], heroCta: ["Browse add-ons", "Sell on Lumen Market"],
  doors: [["add-ons", "Add-ons", "Extend sign-in, billing and reports.", "LAYOUT_GRID"], ["courses", "Courses", "Learn roles, audit and sites at your own pace.", "FILE"], ["workshops", "Workshops", "Spend a morning with a person who has done it.", "USERS"]],
  points: [["p1", "Priced before you open it", "Every listing shows what it costs, with tax, up front.", "CREDIT_CARD"], ["p2", "Sellers we have checked", "Each seller is verified before a listing goes live.", "SHIELD"], ["p3", "Reviews from buyers", "Only people who bought can review.", "ZAP"]],
  qa: [["Can I get a refund?", "Yes, within 14 days, if the add-on does not do what its page says."], ["Who is the seller?", "Each seller is verified, and their page shows their reviews."], ["Do prices include tax?", "Yes. The price you see is the price you pay."]],
  steps: [["s1", "Pick a listing", "Read its page: price, seller and reviews.", ""], ["s2", "Check the fit", "The page says what it needs and what it works with.", ""], ["s3", "Pay once", "Tax is included, and a receipt is sent.", ""], ["s4", "Use it", "It appears in your organization's account at once.", ""]],
  records: [["Audit export", "Send the audit log to your warehouse each night.", "$29"], ["Roles in a day", "A course for admins who set roles.", "$49"], ["Invoice sync", "Keep every invoice in your books.", "$19 a month"], ["Sign-in coach", "A two-hour workshop on rolling out sign-in.", "$120"], ["Site starter", "A docs site, ready in an afternoon.", "$39"], ["Members digest", "A weekly note on who joined and who left.", "Free"]],
  quotes: [["The audit export paid for itself the first week. It does one job and it does it well.", "Priya Nair", "Head of Engineering, Northwind"], ["I bought the course for two admins and both had set roles by the end of the day.", "Omar Haddad", "IT lead, Harbour Foods"], ["The seller answered my question in an hour.", "Sofia Rossi", "Operations, Atlas Freight"]],
  plans: [{ name: "Free", price: 0, line: "For a first listing each month.", feats: ["1 listing", "Reviews"] }, { name: "Seller", price: 19, line: "For a seller with a few listings each month.", feats: ["20 listings", "Reviews", "Payouts each week"], recommended: true }, { name: "Studio", price: 79, line: "For a studio each month.", feats: ["Unlimited listings", "Team access", "Support"] }],
  numbers: [["340", "verified sellers"], ["1,900", "listings"], ["4.7", "average rating"]],
  closing: { title: "Sell what you know", description: "Apply as a seller, list your first add-on, and we handle the payment, the tax and the refunds.", cta: "Apply as a seller", second: "Read the fees" },
  article: { title: "How we check a seller", lede: "Every seller is verified before a listing goes live. This is what we look at.", by: "Mei Tan", date: "12 March 2026" },
  marks: ["Northwind", "Harbour Foods", "Atlas Freight", "Kite Health", "Orchard Bank"],
  picture: { hero: "A listing of an add-on with its price and reviews", show: "An add-on listing", proof: "The seller's page" },
};

export const BRIEFS: Record<string, Brief> = { MARKETING, RESOURCES, MARKETPLACE };
