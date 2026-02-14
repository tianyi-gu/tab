import type { BackgroundRequest, BackgroundResponse, PopupState, StashResult, UndoResult } from "./src/types/messages"
import {
  formatServiceError,
  getPopupState,
  openSavedTab,
  stashAllTabsInCurrentWindow,
  stashCurrentTab,
  stashSpecificTab,
  undoLastStash
} from "./src/lib/stash-service"

const CONTEXT_MENU_STASH = "garbo-stash-tab"
const COMMAND_STASH_CURRENT = "garbo-stash-current"

function createResponse<T>(data: T): BackgroundResponse<T> {
  return { ok: true, data }
}

function createErrorResponse(error: unknown): BackgroundResponse<never> {
  return {
    ok: false,
    error: formatServiceError(error)
  }
}

async function handleRequest(request: BackgroundRequest): Promise<BackgroundResponse> {
  switch (request.type) {
    case "stash-current-tab": {
      const result = await stashCurrentTab()
      return createResponse<StashResult>(result)
    }
    case "stash-all-tabs": {
      const result = await stashAllTabsInCurrentWindow()
      return createResponse<StashResult>(result)
    }
    case "undo-last-stash": {
      const result = await undoLastStash()
      return createResponse<UndoResult>(result)
    }
    case "open-saved-tab": {
      await openSavedTab(request.tabItemId)
      return createResponse({ ok: true })
    }
    case "get-popup-state": {
      const state = await getPopupState(request.query)
      return createResponse<PopupState>(state)
    }
    default: {
      return createErrorResponse(new Error("Unsupported background request"))
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_STASH,
      title: "Stash This Tab",
      contexts: ["page", "action"]
    })
  })
})

chrome.runtime.onMessage.addListener((request: BackgroundRequest, _sender, sendResponse) => {
  void handleRequest(request)
    .then((response) => sendResponse(response))
    .catch((error) => sendResponse(createErrorResponse(error)))

  return true
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_STASH || !tab) {
    return
  }

  void stashSpecificTab(tab)
})

chrome.commands.onCommand.addListener((command) => {
  if (command !== COMMAND_STASH_CURRENT) {
    return
  }

  void stashCurrentTab()
})
