import Dexie, { type Table } from "dexie"
import type { Collection, Reminder, Rule, TabItem } from "@garbo/shared"

class GarboDatabase extends Dexie {
  tabItems!: Table<TabItem, string>
  collections!: Table<Collection, string>
  reminders!: Table<Reminder, string>
  rules!: Table<Rule, string>

  constructor() {
    super("garbo-db")

    this.version(1).stores({
      tabItems: "id, title, url, createdAt, status, *tags",
      collections: "id, name, createdAt",
      reminders: "id, tabItemId, scheduledFor, state",
      rules: "id, trigger, action, enabled"
    })
  }
}

export const db = new GarboDatabase()
