import type { AppWords } from "./layouts.ts";
export const APP_WORDS: Record<string, AppWords> = {
  DASHBOARD: { org: "Lumen Labs", selected: "members", nav: [["home", "Home", "HOME"], ["members", "Members", "USERS"], ["apps", "Apps", "APP_WINDOW"], ["sites", "Sites", "GLOBE"], ["roles", "Roles", "KEY"], ["settings", "Settings", "SETTINGS"]], dock: [["general", "General", "SETTINGS"], ["billing", "Billing", "CREDIT_CARD"], ["security", "Security", "SHIELD"]] },
  PORTAL: { org: "Lumen Labs", selected: "orders", nav: [["overview", "Overview", "HOME"], ["orders", "Orders", "STORE"], ["invoices", "Invoices", "FILE"], ["help", "Help", "INFO"]], dock: [["profile", "Profile", "USER"], ["signin", "Sign-in", "KEY"], ["notifications", "Notifications", "BELL"]] },
};
