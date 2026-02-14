import Dexie, { type Table } from "dexie"
import type { Collection, Reminder, Rule, TabItem } from "@tabmagic/core"

export class TabMagicDB extends Dexie {
  tabItems!: Table<TabItem, string>
  collections!: Table<Collection, string>
  reminders!: Table<Reminder, string>
  rules!: Table<Rule, string>

  constructor() {
    super("tabmagic")

    this.version(1).stores({
      tabItems: "id, url, title, status, collectionId, createdAt, lastOpenedAt, *tags",
      collections: "id, name, createdAt, updatedAt",
      reminders: "id, tabItemId, scheduledFor, state, type",
      rules: "id, trigger, action, enabled, updatedAt"
    })
    this.version(2).stores({
      tabItems: "id, url, title, status, collectionId, createdAt, lastOpenedAt, *tags",
      collections: "id, name, createdAt, updatedAt",
      reminders: "id, tabItemId, scheduledFor, state, type, [state+scheduledFor]",
      rules: "id, trigger, action, enabled, updatedAt"
    })
  }
}

export const db = new TabMagicDB()
