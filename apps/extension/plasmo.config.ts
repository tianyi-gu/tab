import { defineManifest } from "@plasmo/config"

export default defineManifest(() => ({
  manifest_version: 3,
  name: "Garbo",
  version: "0.1.0",
  description: "A calm, local-first tab manager",
  permissions: [
    "tabs",
    "tabGroups",
    "storage",
    "alarms",
    "notifications",
    "commands",
    "contextMenus"
  ],
  host_permissions: ["<all_urls>"],
  action: {
    default_popup: "popup.html"
  },
  options_ui: {
    page: "options.html",
    open_in_tab: true
  }
}))
