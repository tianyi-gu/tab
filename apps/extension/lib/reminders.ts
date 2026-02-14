import type { Reminder, ReminderType, TabItem } from "@tabmagic/core"
import { db } from "../data/db"

const ALARM_PREFIX = "reminder:"

export function alarmNameForReminder(reminderId: string): string {
  return `${ALARM_PREFIX}${reminderId}`
}

export function isReminderAlarm(name: string): boolean {
  return name.startsWith(ALARM_PREFIX)
}

export function reminderIdFromAlarmName(name: string): string {
  return name.slice(ALARM_PREFIX.length)
}

/**
 * Schedule a reminder: persist to Dexie and set a chrome.alarms alarm.
 * When the alarm fires, the background script will run the reminder (notify/reopen).
 */
export async function scheduleReminder(reminder: Reminder): Promise<void> {
  const now = new Date().toISOString()
  const withTimestamps = {
    ...reminder,
    createdAt: reminder.createdAt ?? now,
    updatedAt: now
  }
  await db.reminders.put(withTimestamps)
  const when = new Date(reminder.scheduledFor).getTime()
  if (when > Date.now()) {
    await chrome.alarms.create(alarmNameForReminder(reminder.id), { when })
  }
}

/**
 * Cancel a reminder: mark state cancelled and clear the alarm.
 */
export async function cancelReminder(reminderId: string): Promise<void> {
  const reminder = await db.reminders.get(reminderId)
  if (!reminder) return
  await db.reminders.update(reminderId, { state: "cancelled", updatedAt: new Date().toISOString() })
  await chrome.alarms.clear(alarmNameForReminder(reminderId))
}

/**
 * Run reminder action: show notification and/or reopen tab.
 * Called from background when an alarm fires.
 */
export async function runReminder(reminderId: string): Promise<void> {
  const reminder = await db.reminders.get(reminderId)
  if (!reminder || reminder.state !== "scheduled") return

  const tabItem = await db.tabItems.get(reminder.tabItemId)
  if (!tabItem) {
    await db.reminders.update(reminderId, { state: "fired", updatedAt: new Date().toISOString() })
    return
  }

  const shouldNotify = reminder.type === "notify_only" || reminder.type === "reopen_and_notify"
  const shouldReopen = reminder.type === "reopen" || reminder.type === "reopen_and_notify"

  if (shouldNotify) {
    const notificationId = `reminder-${reminder.id}`
    await chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: tabItem.faviconUrl ?? "/assets/icon-128.png",
      title: "TabMagic",
      message: tabItem.title || tabItem.url,
      buttons: shouldReopen ? [{ title: "Open" }, { title: "Snooze again" }] : undefined
    })
  }

  if (shouldReopen) {
    await chrome.tabs.create({ url: tabItem.url, active: false })
    const now = new Date().toISOString()
    await db.tabItems.update(reminder.tabItemId, { lastOpenedAt: now })
  }

  await db.reminders.update(reminderId, { state: "fired", updatedAt: new Date().toISOString() })
  await chrome.alarms.clear(alarmNameForReminder(reminderId))
}

/** Preset label and how to compute scheduledFor from now. */
export type SnoozePreset = "later_today" | "tomorrow_morning" | "this_weekend" | "custom"

export function getScheduledFor(preset: SnoozePreset, customDate?: Date): string {
  const now = new Date()
  switch (preset) {
    case "later_today": {
      const evening = new Date(now)
      evening.setHours(18, 0, 0, 0)
      return (evening > now ? evening : new Date(now.getTime() + 2 * 60 * 60 * 1000)).toISOString()
    }
    case "tomorrow_morning": {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)
      return tomorrow.toISOString()
    }
    case "this_weekend": {
      const d = new Date(now)
      const day = d.getDay()
      const daysUntilSat = day === 0 ? 6 : 6 - day
      d.setDate(d.getDate() + daysUntilSat)
      d.setHours(10, 0, 0, 0)
      return d.toISOString()
    }
    case "custom":
      return (customDate ?? now).toISOString()
    default:
      return now.toISOString()
  }
}

export const SNOOZE_PRESET_LABELS: Record<SnoozePreset, string> = {
  later_today: "Later today (6pm)",
  tomorrow_morning: "Tomorrow at 9am",
  this_weekend: "This weekend (Saturday 10am)",
  custom: "Custom..."
}
