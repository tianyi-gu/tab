export type Plan = "free" | "pro"
export type AuthProvider = "email" | "google"

export type TabStatus = "saved" | "active" | "archived"
export type ReminderType = "notify_only" | "reopen" | "reopen_and_notify"
export type ReminderState = "scheduled" | "fired" | "cancelled"

export type RuleTrigger = "time" | "recurring" | "focus_mode" | "domain_visit"
export type RuleAction = "open_tabs" | "show_digest" | "add_to_collection"

export interface UserSettings {
  notificationsEnabled: boolean
  defaultSnoozePreset: "later_today" | "tomorrow_morning" | "this_weekend"
  privacyMode: boolean
}

export interface User {
  id: string
  email: string
  authProvider: AuthProvider
  createdAt: string
  plan: Plan
  settings: UserSettings
}

export interface Device {
  id: string
  userId: string
  deviceName: string
  lastSeenAt: string
}

export interface TabItem {
  id: string
  userId?: string
  url: string
  title: string
  faviconUrl?: string
  createdAt: string
  lastOpenedAt?: string
  status: TabStatus
  tags: string[]
  notes?: string
  collectionId?: string
}

export interface Collection {
  id: string
  userId?: string
  name: string
  color?: string
  createdAt: string
  updatedAt: string
}

export interface Reminder {
  id: string
  userId?: string
  tabItemId: string
  type: ReminderType
  scheduledFor: string
  repeatRule?: string
  state: ReminderState
  createdAt: string
  updatedAt: string
}

export interface Rule {
  id: string
  userId?: string
  trigger: RuleTrigger
  triggerConfig: Record<string, unknown>
  action: RuleAction
  actionConfig: Record<string, unknown>
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface EventLog {
  id: string
  userId?: string
  eventType: string
  payload: Record<string, unknown>
  createdAt: string
}
