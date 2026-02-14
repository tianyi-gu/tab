import type { ReminderType } from "@tabmagic/core"
import { db } from "../data/db"
import { stashTabs } from "./stash"
import {
  getScheduledFor,
  type SnoozePreset,
  scheduleReminder,
  SNOOZE_PRESET_LABELS
} from "./reminders"

export { getScheduledFor, SNOOZE_PRESET_LABELS }
export type { SnoozePreset }

const INBOX_COLLECTION_ID = "inbox"

/**
 * Snooze the current tab: stash it into Inbox and schedule a reminder.
 * Returns the created reminder and undo snapshot for the stash.
 */
export async function snoozeCurrentTab(
  preset: SnoozePreset,
  type: ReminderType = "reopen_and_notify",
  customDate?: Date
): Promise<{ reminderId: string; stashedCount: number }> {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!currentTab?.id || !currentTab.url) {
    throw new Error("No active tab to snooze.")
  }

  const snapshot = await stashTabs([currentTab])
  if (snapshot.entries.length === 0) {
    throw new Error("This tab cannot be stashed.")
  }

  const savedTabId = snapshot.entries[0].savedTabId
  const scheduledFor = getScheduledFor(preset, customDate)
  const now = new Date().toISOString()
  const reminder = {
    id: crypto.randomUUID(),
    tabItemId: savedTabId,
    type,
    scheduledFor,
    state: "scheduled" as const,
    createdAt: now,
    updatedAt: now
  }
  await scheduleReminder(reminder)
  await chrome.storage.local.set({ lastStash: snapshot })
  return { reminderId: reminder.id, stashedCount: snapshot.entries.length }
}

/**
 * Add a reminder to an already-saved tab (e.g. from Library).
 */
export async function snoozeSavedTab(
  tabItemId: string,
  preset: SnoozePreset,
  type: ReminderType = "reopen_and_notify",
  customDate?: Date
): Promise<string> {
  const tab = await db.tabItems.get(tabItemId)
  if (!tab) throw new Error("Tab not found.")
  const scheduledFor = getScheduledFor(preset, customDate)
  const now = new Date().toISOString()
  const reminder = {
    id: crypto.randomUUID(),
    tabItemId,
    type,
    scheduledFor,
    state: "scheduled" as const,
    createdAt: now,
    updatedAt: now
  }
  await scheduleReminder(reminder)
  return reminder.id
}
