import type { TabItem } from "@tabmagic/core"
import { db } from "../data/db"

const INBOX_COLLECTION_ID = "inbox"

export interface UndoEntry {
  savedTabId: string
  url: string
  windowId?: number
  index?: number
  pinned?: boolean
}

export interface UndoSnapshot {
  createdAt: string
  entries: UndoEntry[]
}

function toSavedTab(tab: chrome.tabs.Tab): TabItem | null {
  if (!tab.url || tab.url.startsWith("chrome-extension://")) {
    return null
  }

  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    url: tab.url,
    title: tab.title || tab.url,
    faviconUrl: tab.favIconUrl,
    createdAt: now,
    status: "saved",
    tags: [],
    collectionId: INBOX_COLLECTION_ID
  }
}

export async function stashTabs(tabs: chrome.tabs.Tab[]): Promise<UndoSnapshot> {
  const closableTabs = tabs.filter((tab) => typeof tab.id === "number")
  const candidates = closableTabs
    .map((tab) => ({ tab, saved: toSavedTab(tab) }))
    .filter((item): item is { tab: chrome.tabs.Tab; saved: TabItem } => item.saved !== null)

  if (candidates.length === 0) {
    return { createdAt: new Date().toISOString(), entries: [] }
  }

  await db.transaction("rw", db.tabItems, async () => {
    await db.tabItems.bulkPut(candidates.map((item) => item.saved))
  })

  const tabIds = candidates.map((item) => item.tab.id as number)
  await chrome.tabs.remove(tabIds)

  return {
    createdAt: new Date().toISOString(),
    entries: candidates.map((item) => ({
      savedTabId: item.saved.id,
      url: item.saved.url,
      windowId: item.tab.windowId,
      index: item.tab.index,
      pinned: item.tab.pinned
    }))
  }
}

export async function undoStash(snapshot: UndoSnapshot): Promise<number> {
  if (snapshot.entries.length === 0) {
    return 0
  }

  const sorted = [...snapshot.entries].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))

  for (const entry of sorted) {
    try {
      await chrome.tabs.create({
        url: entry.url,
        pinned: entry.pinned,
        windowId: entry.windowId,
        index: entry.index
      })
    } catch {
      await chrome.tabs.create({
        url: entry.url,
        pinned: entry.pinned
      })
    }
  }

  await db.tabItems.bulkDelete(snapshot.entries.map((entry) => entry.savedTabId))
  return snapshot.entries.length
}
