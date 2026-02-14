import type { TabItem } from "@garbo/shared"
import type { StashSession } from "../types/stash"

const TAB_ITEMS_KEY = "garbo.tabItems"
const LAST_STASH_SESSION_KEY = "garbo.lastStashSession"

function storageGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] as T | undefined)
    })
  })
}

function storageSet(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => resolve())
  })
}

function storageRemove(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([key], () => resolve())
  })
}

export async function getTabItems(): Promise<TabItem[]> {
  return (await storageGet<TabItem[]>(TAB_ITEMS_KEY)) ?? []
}

export async function setTabItems(items: TabItem[]): Promise<void> {
  await storageSet(TAB_ITEMS_KEY, items)
}

export async function getLastStashSession(): Promise<StashSession | undefined> {
  return await storageGet<StashSession>(LAST_STASH_SESSION_KEY)
}

export async function setLastStashSession(session: StashSession): Promise<void> {
  await storageSet(LAST_STASH_SESSION_KEY, session)
}

export async function clearLastStashSession(): Promise<void> {
  await storageRemove(LAST_STASH_SESSION_KEY)
}
