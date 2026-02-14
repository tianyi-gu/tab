import { useEffect, useMemo, useState } from "react"
import type { BackgroundRequest, PopupState, StashResult, UndoResult } from "../types/messages"
import { sendBackgroundMessage } from "../lib/runtime-client"

const EMPTY_POPUP_STATE: PopupState = {
  items: [],
  totalSaved: 0,
  canUndo: false
}

export function PopupApp() {
  const [query, setQuery] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [isLoadingState, setIsLoadingState] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [popupState, setPopupState] = useState<PopupState>(EMPTY_POPUP_STATE)

  const hasResults = popupState.items.length > 0
  const actionDisabled = isBusy || isLoadingState

  async function refreshState(searchQuery?: string) {
    const request: BackgroundRequest = searchQuery
      ? { type: "get-popup-state", query: searchQuery }
      : { type: "get-popup-state" }

    const nextState = await sendBackgroundMessage<PopupState>(request)
    setPopupState(nextState)
  }

  useEffect(() => {
    void (async () => {
      setIsLoadingState(true)
      try {
        await refreshState()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load saved tabs"
        setNotice(message)
      } finally {
        setIsLoadingState(false)
      }
    })()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshState(query).catch((error) => {
        const message = error instanceof Error ? error.message : "Search failed"
        setNotice(message)
      })
    }, 150)

    return () => clearTimeout(timer)
  }, [query])

  async function runAction<T>(task: () => Promise<T>, onSuccess: (result: T) => string) {
    setIsBusy(true)
    setNotice(null)

    try {
      const result = await task()
      setNotice(onSuccess(result))
      await refreshState(query)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action failed"
      setNotice(message)
    } finally {
      setIsBusy(false)
    }
  }

  function formatStashNotice(result: StashResult): string {
    if (result.savedCount === 0) {
      return "No stashable tabs found in this selection."
    }

    if (result.skippedCount > 0) {
      return `Saved ${result.savedCount} tabs (${result.skippedCount} unsupported).`
    }

    return `Saved ${result.savedCount} tabs.`
  }

  function formatUndoNotice(result: UndoResult): string {
    if (result.restoredCount === 0) {
      return "Nothing to restore."
    }

    return `Restored ${result.restoredCount} tabs.`
  }

  const savedCountLabel = useMemo(() => {
    const count = popupState.totalSaved
    return `${count} saved tab${count === 1 ? "" : "s"}`
  }, [popupState.totalSaved])

  return (
    <main className="min-h-[460px] w-[380px] bg-canvas p-5 text-ink">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Garbo</h1>
        <p className="mt-1 text-sm text-slate-700">Stash tabs now. Pull them back when you need them.</p>
      </header>

      <section className="mt-6 grid gap-3">
        <button
          disabled={actionDisabled}
          onClick={() =>
            void runAction(
              () => sendBackgroundMessage<StashResult>({ type: "stash-current-tab" }),
              formatStashNotice
            )
          }
          className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-canvas disabled:cursor-not-allowed disabled:opacity-50">
          Stash This Tab
        </button>
        <button
          disabled={actionDisabled}
          onClick={() =>
            void runAction(
              () => sendBackgroundMessage<StashResult>({ type: "stash-all-tabs" }),
              formatStashNotice
            )
          }
          className="rounded-xl border border-ink/20 bg-white px-4 py-2 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-50">
          Stash All Tabs
        </button>
        <button
          disabled={actionDisabled || !popupState.canUndo}
          onClick={() =>
            void runAction(
              () => sendBackgroundMessage<UndoResult>({ type: "undo-last-stash" }),
              formatUndoNotice
            )
          }
          className="rounded-xl border border-ink/20 bg-white px-4 py-2 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-50">
          Undo Last Stash
        </button>
      </section>

      <section className="mt-5 rounded-xl border border-ink/10 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Saved Library</h2>
          <span className="text-xs text-slate-500">{savedCountLabel}</span>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, url, tags, notes"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-ink/40"
        />

        <div className="mt-3 space-y-2">
          {isLoadingState ? (
            <p className="text-xs text-slate-500">Loading saved tabs...</p>
          ) : null}

          {!isLoadingState && !hasResults ? (
            <p className="text-xs text-slate-500">No matching saved tabs yet.</p>
          ) : null}

          {!isLoadingState &&
            popupState.items.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 p-2">
                <h3 className="truncate text-xs font-medium">{item.title}</h3>
                <p className="truncate text-[11px] text-slate-500">{item.url}</p>
                <button
                  disabled={isBusy}
                  onClick={() =>
                    void runAction(
                      () => sendBackgroundMessage({ type: "open-saved-tab", tabItemId: item.id }),
                      () => "Opened saved tab."
                    )
                  }
                  className="mt-2 rounded-md border border-ink/20 px-2 py-1 text-[11px] font-medium text-ink disabled:cursor-not-allowed disabled:opacity-50">
                  Open
                </button>
              </article>
            ))}
        </div>
      </section>

      {notice ? <p className="mt-3 text-xs text-slate-600">{notice}</p> : null}
    </main>
  )
}
