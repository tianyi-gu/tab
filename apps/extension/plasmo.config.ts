export default {
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
  commands: {
    "garbo-stash-current": {
      suggested_key: {
        default: "Ctrl+Shift+S",
        mac: "Command+Shift+S"
      },
      description: "Stash current tab"
    }
  },
  options_ui: {
    page: "options.html",
    open_in_tab: true
  }
}
