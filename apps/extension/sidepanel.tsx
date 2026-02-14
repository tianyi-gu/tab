import "./styles/globals.css"
import { useLiveQuery } from "dexie-react-hooks"
import { useCallback, useEffect, useMemo, useState } from "react"
import { db } from "./data/db"
import type { Collection, Reminder, TabItem } from "@tabmagic/core"
import { SNOOZE_PRESET_LABELS, type SnoozePreset, snoozeSavedTab } from "./lib/snooze"
import { cancelReminder } from "./lib/reminders"

function TabCard({
  item,
  collection,
  onOpen,
  onSnooze,
  onRemove
}: {
  item: TabItem
  collection: Collection | undefined
  onOpen: (item: TabItem) => void
  onSnooze: (item: TabItem) => void
  onRemove: (item: TabItem) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-calm-100 bg-white p-3 shadow-sm">
      {item.faviconUrl ? (
        <img src={item.faviconUrl} alt="" className="h-5 w-5 shrink-0 rounded" />
      ) : (
        <div className="h-5 w-5 shrink-0 rounded bg-calm-100" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-calm-900">{item.title || item.url}</p>
        <p className="truncate text-xs text-calm-500">{item.url}</p>
        {collection && (
          <span
            className="mt-1 inline-block rounded px-1.5 py-0.5 text-xs text-calm-600"
            style={{ backgroundColor: collection.color ? `${collection.color}20` : undefined }}>
            {collection.name}
          </span>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="rounded p-1.5 text-calm-600 hover:bg-calm-100 hover:text-calm-900"
          title="Open tab">
          Open
        </button>
        <button
          type="button"
          onClick={() => onSnooze(item)}
          className="rounded p-1.5 text-calm-600 hover:bg-calm-100 hover:text-calm-900"
          title="Snooze">
          Snooze
        </button>
        <button
          type="button"
          onClick={() => onRemove(item)}
          className="rounded p-1.5 text-red-600 hover:bg-red-50"
          title="Remove">
          Remove
        </button>
      </div>
    </div>
  )
}

function UpcomingReminderRow({
  reminder,
  tabItem,
  collection,
  onOpen,
  onCancel
}: {
  reminder: Reminder
  tabItem: TabItem | undefined
  collection: Collection | undefined
  onOpen: (tab: TabItem) => void
  onCancel: (reminder: Reminder) => void
}) {
  if (!tabItem) return null
  const at = new Date(reminder.scheduledFor)
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-calm-100 bg-white p-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-calm-900">{tabItem.title || tabItem.url}</p>
        <p className="text-xs text-calm-500">
          {at.toLocaleDateString()} at {at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onOpen(tabItem)}
          className="rounded px-2 py-1 text-xs font-medium text-calm-700 hover:bg-calm-100">
          Open
        </button>
        <button
          type="button"
          onClick={() => onCancel(reminder)}
          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function TabLibrary() {
  const [search, setSearch] = useState("")
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>("inbox")
  const [view, setView] = useState<"library" | "upcoming">("library")
  const [snoozeTarget, setSnoozeTarget] = useState<TabItem | null>(null)

  useEffect(() => {
    document.documentElement.classList.add("sidepanel")
  }, [])

  const collections = useLiveQuery(() => db.collections.toArray(), []) ?? []
  const tabItems = useLiveQuery(
    async () => {
      const all = await db.tabItems.where("status").equals("saved").sortBy("createdAt")
      const filtered = selectedCollectionId
        ? all.filter((t) => t.collectionId === selectedCollectionId)
        : all
      if (!search.trim()) return filtered.reverse()
      const lower = search.toLowerCase().trim()
      return filtered
        .filter(
          (t) =>
            t.title?.toLowerCase().includes(lower) ||
            t.url?.toLowerCase().includes(lower) ||
            t.tags.some((tag) => tag.toLowerCase().includes(lower)) ||
            t.notes?.toLowerCase().includes(lower)
        )
        .reverse()
    },
    [search, selectedCollectionId]
  )
  const upcomingWithTabs = useLiveQuery(
    async () => {
      const list = await db.reminders
        .where("state")
        .equals("scheduled")
        .sortBy("scheduledFor")
      const reminders = list.filter((r) => new Date(r.scheduledFor) >= new Date()).slice(0, 20)
      const ids = [...new Set(reminders.map((r) => r.tabItemId))]
      const items = await db.tabItems.bulkGet(ids)
      const tabMap = new Map<string, TabItem>()
      items.forEach((item) => {
        if (item) tabMap.set(item.id, item)
      })
      return { reminders, tabMap }
    },
    []
  )
  const upcomingReminders = upcomingWithTabs?.reminders ?? []
  const reminderTabMap = upcomingWithTabs?.tabMap

  const collectionMap = useMemo(() => {
    const m = new Map<string, Collection>()
    for (const c of collections) m.set(c.id, c)
    return m
  }, [collections])

  const openTab = useCallback((item: TabItem) => {
    chrome.tabs.create({ url: item.url })
    const now = new Date().toISOString()
    db.tabItems.update(item.id, { lastOpenedAt: now })
  }, [])

  const handleSnooze = useCallback((item: TabItem) => {
    setSnoozeTarget(item)
  }, [])

  const confirmSnooze = useCallback(
    async (preset: SnoozePreset) => {
      if (!snoozeTarget) return
      try {
        await snoozeSavedTab(snoozeTarget.id, preset)
        setSnoozeTarget(null)
      } catch (e) {
        console.error(e)
      }
    },
    [snoozeTarget]
  )

  const removeTab = useCallback(async (item: TabItem) => {
    await db.reminders.where("tabItemId").equals(item.id).modify({ state: "cancelled" })
    await db.tabItems.delete(item.id)
  }, [])

  const cancelReminderHandler = useCallback(async (reminder: Reminder) => {
    await cancelReminder(reminder.id)
  }, [])

  const tabItemsWithCollection = useMemo(() => {
    return (tabItems ?? []).map((item) => ({
      item,
      collection: item.collectionId ? collectionMap.get(item.collectionId) : undefined
    }))
  }, [tabItems, collectionMap])

  const getTabItem = useCallback(
    (id: string) => reminderTabMap?.get(id) ?? (tabItems ?? []).find((t) => t.id === id),
    [reminderTabMap, tabItems]
  )

  return (
    <main className="flex h-full flex-col bg-calm-50">
      <header className="border-b border-calm-100 bg-white/90 px-4 py-3">
        <h1 className="text-lg font-semibold text-calm-900">Tab Library</h1>
        <input
          type="search"
          placeholder="Search by title, URL, tag, notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2 w-full rounded-md border border-calm-200 px-3 py-2 text-sm placeholder:text-calm-400 focus:border-calm-500 focus:outline-none focus:ring-1 focus:ring-calm-500"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setView("library")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "library" ? "bg-calm-600 text-white" : "bg-calm-100 text-calm-700 hover:bg-calm-200"}`}>
            Saved tabs
          </button>
          <button
            type="button"
            onClick={() => setView("upcoming")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "upcoming" ? "bg-calm-600 text-white" : "bg-calm-100 text-calm-700 hover:bg-calm-200"}`}>
            Upcoming
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-44 shrink-0 border-r border-calm-100 bg-white/80 p-2">
          <p className="px-2 py-1 text-xs font-medium text-calm-500">Collections</p>
          {collections.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCollectionId(c.id)}
              className={`mt-1 w-full rounded-md px-2 py-1.5 text-left text-sm ${selectedCollectionId === c.id ? "bg-calm-100 font-medium text-calm-900" : "text-calm-600 hover:bg-calm-50"}`}
              style={c.color ? { borderLeft: `3px solid ${c.color}` } : undefined}>
              {c.name}
            </button>
          ))}
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto p-4">
          {view === "library" && (
            <div className="space-y-2">
              {tabItemsWithCollection.length === 0 ? (
                <p className="text-sm text-calm-500">No saved tabs in this view.</p>
              ) : (
                tabItemsWithCollection.map(({ item, collection }) => (
                  <TabCard
                    key={item.id}
                    item={item}
                    collection={collection}
                    onOpen={openTab}
                    onSnooze={handleSnooze}
                    onRemove={removeTab}
                  />
                ))
              )}
            </div>
          )}
          {view === "upcoming" && (
            <div className="space-y-2">
              {(upcomingReminders ?? []).length === 0 ? (
                <p className="text-sm text-calm-500">No upcoming reminders.</p>
              ) : (
                (upcomingReminders ?? []).map((reminder) => (
                  <UpcomingReminderRow
                    key={reminder.id}
                    reminder={reminder}
                    tabItem={getTabItem(reminder.tabItemId)}
                    collection={undefined}
                    onOpen={openTab}
                    onCancel={cancelReminderHandler}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {snoozeTarget && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
            <h3 className="font-medium text-calm-900">Snooze this tab</h3>
            <p className="mt-1 truncate text-sm text-calm-600">{snoozeTarget.title || snoozeTarget.url}</p>
            <div className="mt-4 flex flex-col gap-2">
              {(Object.keys(SNOOZE_PRESET_LABELS) as SnoozePreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => void confirmSnooze(preset)}
                  className="rounded-md border border-calm-200 py-2 text-sm font-medium text-calm-800 hover:bg-calm-50">
                  {SNOOZE_PRESET_LABELS[preset]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSnoozeTarget(null)}
              className="mt-3 w-full rounded-md py-2 text-sm text-calm-500 hover:bg-calm-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
