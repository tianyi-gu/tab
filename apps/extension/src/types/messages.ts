import type { TabItem } from "@garbo/shared"

export type BackgroundRequest =
  | { type: "stash-current-tab" }
  | { type: "stash-all-tabs" }
  | { type: "undo-last-stash" }
  | { type: "open-saved-tab"; tabItemId: string }
  | { type: "get-popup-state"; query?: string }

export type BackgroundResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export interface StashResult {
  savedCount: number
  skippedCount: number
  canUndo: boolean
}

export interface UndoResult {
  restoredCount: number
  canUndo: boolean
}

export interface PopupState {
  items: TabItem[]
  totalSaved: number
  canUndo: boolean
}
