import "./styles/globals.css"
import { useEffect, useMemo, useState } from "react"
import { db } from "./data/db"
import { stashTabs, type UndoSnapshot, undoStash } from "./lib/stash"
import { SNOOZE_PRESET_LABELS, type SnoozePreset, snoozeCurrentTab } from "./lib/snooze"

function formatCount(value: number): string {
  return value === 1 ? "1 saved tab" : `${value} saved tabs`
}

export default function Popup() {
  const [savedCount, setSavedCount] = useState(0)
  const [status, setStatus] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null)
  const [snoozing, setSnoozing] = useState(false)

  async function refreshCount(): Promise<void> {
    const count = await db.tabItems.count()
    setSavedCount(count)
  }

  async function loadUndoSnapshot(): Promise<void> {
    const storage = await chrome.storage.local.get("lastStash")
    setUndoSnapshot((storage.lastStash as UndoSnapshot | undefined) || null)
  }

  useEffect(() => {
    void refreshCount()
    void loadUndoSnapshot()
  }, [])

  const subtitle = useMemo(() => formatCount(savedCount), [savedCount])

  async function handleStashCurrentTab(): Promise<void> {
    setLoading(true)
    setStatus("")

    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!currentTab) {
        setStatus("No active tab found.")
        return
      }

      const snapshot = await stashTabs([currentTab])
      await chrome.storage.local.set({ lastStash: snapshot })
      setUndoSnapshot(snapshot)
      await refreshCount()
      setStatus(snapshot.entries.length ? "Tab stashed. Undo is available." : "This tab cannot be stashed.")
    } catch (error) {
      setStatus(`Failed to stash tab: ${String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleStashAllTabs(): Promise<void> {
    setLoading(true)
    setStatus("")

    try {
      const tabs = await chrome.tabs.query({ currentWindow: true })
      const snapshot = await stashTabs(tabs)
      await chrome.storage.local.set({ lastStash: snapshot })
      setUndoSnapshot(snapshot)
      await refreshCount()
      setStatus(snapshot.entries.length ? `Stashed ${snapshot.entries.length} tabs.` : "No stashable tabs found.")
    } catch (error) {
      setStatus(`Failed to stash tabs: ${String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleUndo(): Promise<void> {
    if (!undoSnapshot) {
      return
    }

    setLoading(true)
    setStatus("")

    try {
      const restored = await undoStash(undoSnapshot)
      await chrome.storage.local.remove("lastStash")
      setUndoSnapshot(null)
      await refreshCount()
      setStatus(restored ? `Restored ${restored} tabs.` : "Nothing to restore.")
    } catch (error) {
      setStatus(`Failed to undo stash: ${String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSnooze(preset: SnoozePreset): Promise<void> {
    if (preset === "custom") return
    setSnoozing(true)
    setStatus("")
    try {
      const { stashedCount } = await snoozeCurrentTab(preset)
      await refreshCount()
      await loadUndoSnapshot()
      setStatus(`Tab stashed and reminder set for ${SNOOZE_PRESET_LABELS[preset]}. Undo available.`)
    } catch (error) {
      setStatus(`Failed: ${String(error)}`)
    } finally {
      setSnoozing(false)
    }
  }

  function openLibrary(): void {
    chrome.windows.getCurrent((win) => {
      if (win?.id && chrome.sidePanel?.open) {
        chrome.sidePanel.open({ windowId: win.id })
      }
    })
  }

  return (
    <main className="w-[360px] p-4">
      <section className="rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-calm-100">
        <h1 className="text-lg font-semibold text-calm-900">TabMagic</h1>
        <p className="mt-1 text-sm text-calm-700">{subtitle}</p>
        <p className="mt-0.5 text-xs text-calm-500">Local-first · your data stays on this device</p>
        <div className="mt-4 grid gap-2">
          <button
            className="rounded-md bg-calm-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
            onClick={() => void handleStashCurrentTab()}
            disabled={loading}>
            Stash This Tab
          </button>
          <button
            className="rounded-md bg-calm-500 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
            onClick={() => void handleStashAllTabs()}
            disabled={loading}>
            Stash All Tabs
          </button>
          <p className="text-xs font-medium text-calm-500">Snooze this tab (stash + remind)</p>
          <div className="grid grid-cols-1 gap-1.5">
            {(Object.keys(SNOOZE_PRESET_LABELS) as SnoozePreset[])
              .filter((p) => p !== "custom")
              .map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={loading || snoozing}
                  onClick={() => void handleSnooze(preset)}
                  className="rounded-md border border-calm-200 bg-white px-3 py-2 text-left text-sm text-calm-800 hover:bg-calm-50 disabled:opacity-70">
                  {SNOOZE_PRESET_LABELS[preset]}
                </button>
              ))}
          </div>
          <button
            className="rounded-md border border-calm-500 px-3 py-2 text-sm font-medium text-calm-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void handleUndo()}
            disabled={loading || !undoSnapshot}>
            Undo Last Stash
          </button>
          <button
            type="button"
            onClick={openLibrary}
            className="rounded-md border border-calm-300 bg-calm-50 px-3 py-2 text-sm font-medium text-calm-700 hover:bg-calm-100">
            Open Tab Library
          </button>
        </div>
        <p className="mt-3 min-h-5 text-xs text-calm-700">{status}</p>
      </section>
    </main>
  )
}
