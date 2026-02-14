export interface StashSnapshot {
  tabItemId: string
  url: string
  title: string
  pinned: boolean
  index: number
  windowId?: number
}

export interface StashSession {
  id: string
  createdAt: string
  tabs: StashSnapshot[]
}
