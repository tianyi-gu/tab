chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "garbo-stash-tab",
    title: "Stash This Tab",
    contexts: ["page", "action"]
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "garbo-stash-tab" || !tab?.id) {
    return
  }

  // Placeholder workflow; implementation comes later.
  console.info("Stash requested for tab", tab.id)
})
