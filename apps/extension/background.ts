import { db } from "./data/db"
import {
  alarmNameForReminder,
  isReminderAlarm,
  reminderIdFromAlarmName,
  runReminder,
  scheduleReminder
} from "./lib/reminders"
import { stashTabs } from "./lib/stash"

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await db.collections.get("inbox")

  if (!existing) {
    const now = new Date().toISOString()
    await db.collections.put({
      id: "inbox",
      name: "Inbox",
      color: "#5f7f69",
      createdAt: now,
      updatedAt: now
    })
  }

  // Re-register alarms for scheduled reminders (alarms are cleared on extension restart)
  const scheduled = await db.reminders.where("state").equals("scheduled").toArray()
  const now = Date.now()
  for (const r of scheduled) {
    const when = new Date(r.scheduledFor).getTime()
    if (when > now) {
      await chrome.alarms.create(alarmNameForReminder(r.id), { when })
    }
  }
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!isReminderAlarm(alarm.name)) return
  const reminderId = reminderIdFromAlarmName(alarm.name)
  await runReminder(reminderId)
})

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "stash-current-tab") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      const snapshot = await stashTabs([tab])
      await chrome.storage.local.set({ lastStash: snapshot })
    }
  }
})

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (!notificationId.startsWith("reminder-")) return
  const reminderId = notificationId.replace("reminder-", "")
  const reminder = await db.reminders.get(reminderId)
  const tabItem = reminder ? await db.tabItems.get(reminder.tabItemId) : null
  if (!tabItem) return
  if (buttonIndex === 0) {
    await chrome.tabs.create({ url: tabItem.url, active: true })
  } else if (buttonIndex === 1) {
    const { getScheduledFor } = await import("./lib/reminders")
    const tomorrow = getScheduledFor("tomorrow_morning")
    await scheduleReminder({
      id: crypto.randomUUID(),
      tabItemId: tabItem.id,
      type: reminder?.type ?? "reopen_and_notify",
      scheduledFor: tomorrow,
      state: "scheduled",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
  await chrome.notifications.clear(notificationId)
})
