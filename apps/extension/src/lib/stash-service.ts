import type { TabItem } from "@garbo/shared"
import type { PopupState, StashResult, UndoResult } from "../types/messages"
import type { StashSession, StashSnapshot } from "../types/stash"
import { clearLastStashSession, getLastStashSession, getTabItems, setLastStashSession, setTabItems } from "./storage"

const LOCAL_USER_ID = "local-user"
const SUPPORTED_URL_PREFIXES = ["http://", "https://", "file://"]

type StashableTab = chrome.tabs.Tab & { id: number; url: string }

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Unexpected extension error"
}

function isStashableTab(tab: chrome.tabs.Tab): tab is StashableTab {
  const { id, url } = tab

  if (typeof id !== "number" || typeof url !== "string") {
    return false
  }

  return SUPPORTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix))
}

function toTabItem(tab: StashableTab, now: string): TabItem {
  const item: TabItem = {
    id: crypto.randomUUID(),
    userId: LOCAL_USER_ID,
    url: tab.url,
    title: tab.title ?? tab.url,
    createdAt: now,
    status: "saved",
    tags: []
  }

  if (tab.favIconUrl) {
    item.faviconUrl = tab.favIconUrl
  }

  return item
}

function toStashSnapshot(tab: StashableTab, tabItemId: string): StashSnapshot {
  const base: StashSnapshot = {
    tabItemId,
    url: tab.url,
    title: tab.title ?? tab.url,
    pinned: Boolean(tab.pinned),
    index: typeof tab.index === "number" ? tab.index : -1
  }

  if (typeof tab.windowId === "number") {
    base.windowId = tab.windowId
  }

  return base
}

function queryTabs(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => resolve(tabs))
  })
}

function createTab(createProperties: chrome.tabs.CreateProperties): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.tabs.create(createProperties, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      resolve()
    })
  })
}

function removeTabs(tabIds: number[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.tabs.remove(tabIds, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      resolve()
    })
  })
}

function searchSavedTabs(items: TabItem[], rawQuery?: string): TabItem[] {
  const saved = items.filter((item) => item.status === "saved")
  const query = rawQuery?.trim().toLowerCase()

  if (!query) {
    return saved
  }

  return saved.filter((item) => {
    const tags = item.tags.join(" ").toLowerCase()
    const notes = item.notes?.toLowerCase() ?? ""
    return (
      item.title.toLowerCase().includes(query) ||
      item.url.toLowerCase().includes(query) ||
      tags.includes(query) ||
      notes.includes(query)
    )
  })
}

async function stashTabs(tabs: chrome.tabs.Tab[]): Promise<StashResult> {
  const stashableTabs = tabs.filter(isStashableTab)
  const skippedCount = tabs.length - stashableTabs.length

  if (stashableTabs.length === 0) {
    return { savedCount: 0, skippedCount, canUndo: false }
  }

  const now = new Date().toISOString()
  const currentItems = await getTabItems()
  const newItems = stashableTabs.map((tab) => toTabItem(tab, now))
  const snapshots: StashSnapshot[] = []

  stashableTabs.forEach((tab, idx) => {
    const item = newItems[idx]
    if (item) {
      snapshots.push(toStashSnapshot(tab, item.id))
    }
  })

  const session: StashSession = {
    id: crypto.randomUUID(),
    createdAt: now,
    tabs: snapshots
  }

  await setTabItems([...newItems, ...currentItems])
  await setLastStashSession(session)
  await removeTabs(stashableTabs.map((tab) => tab.id))

  return {
    savedCount: newItems.length,
    skippedCount,
    canUndo: true
  }
}

export async function stashCurrentTab(): Promise<StashResult> {
  const activeTabs = await queryTabs({ active: true, currentWindow: true })
  return await stashTabs(activeTabs)
}

export async function stashAllTabsInCurrentWindow(): Promise<StashResult> {
  const tabs = await queryTabs({ currentWindow: true })
  return await stashTabs(tabs)
}

export async function stashSpecificTab(tab: chrome.tabs.Tab): Promise<StashResult> {
  return await stashTabs([tab])
}

export async function undoLastStash(): Promise<UndoResult> {
  const session = await getLastStashSession()
  if (!session || session.tabs.length === 0) {
    return { restoredCount: 0, canUndo: false }
  }

  let restoredCount = 0
  for (const tab of session.tabs) {
    if (!tab.url) {
      continue
    }

    try {
      const createProperties: chrome.tabs.CreateProperties = {
        url: tab.url,
        active: false,
        pinned: tab.pinned
      }

      if (tab.index >= 0) {
        createProperties.index = tab.index
      }

      if (typeof tab.windowId === "number") {
        createProperties.windowId = tab.windowId
      }

      await createTab(createProperties)
      restoredCount += 1
    } catch (_error) {
      try {
        await createTab({
          url: tab.url,
          active: false,
          pinned: tab.pinned
        })
        restoredCount += 1
      } catch {
        // Ignore irrecoverable create failures and continue restoring the rest.
      }
    }
  }

  const items = await getTabItems()
  const tabItemIds = new Set(session.tabs.map((tab) => tab.tabItemId))
  const now = new Date().toISOString()
  const updatedItems = items.map((item) => {
    if (!tabItemIds.has(item.id)) {
      return item
    }

    return {
      ...item,
      status: "active" as const,
      lastOpenedAt: now
    }
  })

  await setTabItems(updatedItems)
  await clearLastStashSession()

  return { restoredCount, canUndo: false }
}

export async function openSavedTab(tabItemId: string): Promise<void> {
  const items = await getTabItems()
  const idx = items.findIndex((item) => item.id === tabItemId)

  if (idx < 0) {
    throw new Error("Saved tab not found")
  }

  const selected = items[idx]
  if (!selected) {
    throw new Error("Saved tab not found")
  }
  await createTab({
    url: selected.url,
    active: true
  })

  const updatedItems = [...items]
  updatedItems[idx] = {
    ...selected,
    status: "active",
    lastOpenedAt: new Date().toISOString()
  }
  await setTabItems(updatedItems)
}

export async function getPopupState(query?: string): Promise<PopupState> {
  const items = await getTabItems()
  const filtered = searchSavedTabs(items, query)
  const sorted = filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const session = await getLastStashSession()

  return {
    items: sorted.slice(0, 12),
    totalSaved: filtered.length,
    canUndo: Boolean(session?.tabs.length)
  }
}

export function formatServiceError(error: unknown): string {
  return toErrorMessage(error)
}
