# TabMagic (Working Name)

A **local-first** browser tab manager for students and professionals who keep many tabs open. Close tabs without losing them: save as “saved tabs,” add **snoozes** (reopen or remind at a time you choose), and later add **automations** (e.g. open a set of tabs on a schedule).

**Goals:** Reduce tab clutter, lower “open-tab guilt,” and improve performance by keeping fewer tabs active while still making them easy to find again.

---

## What’s Included (MVP)

### Extension (Chrome; Edge/Firefox later)

- **Quick stash**
  - **Stash This Tab** / **Stash All Tabs** — Close tabs and save them into a default **Inbox** collection.
  - **Undo Last Stash** — Restore the last stashed set (survives closing the popup).
  - **Keyboard shortcut:** `Cmd+Shift+S` (Mac) / `Ctrl+Shift+S` (Windows/Linux) to stash the current tab.

- **Snooze / Remind**
  - From the popup: **Snooze this tab** with presets: *Later today (6pm)*, *Tomorrow at 9am*, *This weekend (Saturday 10am)*. The tab is stashed and a reminder is scheduled.
  - When the reminder fires: optional **notification** and/or **reopen tab** (reopen + notify, reopen only, or notify only).
  - From the notification: **Open** or **Snooze again** (tomorrow 9am).

- **Tab Library** (side panel)
  - **Search** by title, URL, tags, or notes.
  - **Collections** sidebar (Inbox by default; more later).
  - **Saved tabs** list with Open / Snooze / Remove.
  - **Upcoming** view for scheduled reminders (Open / Cancel).

- **Tech**
  - **Plasmo** + React + TypeScript + Tailwind.
  - **chrome.storage.local** for last-stash undo and small state.
  - **IndexedDB (Dexie)** for tab archive, collections, reminders, and rules.
  - **chrome.alarms** for reminder scheduling; **chrome.notifications** for “reminder fired” UX.
  - Permissions: `tabs`, `tabGroups`, `storage`, `alarms`, `notifications`, `commands`, `contextMenus`, `sidePanel`.

### Core package

- Shared TypeScript models: **TabItem**, **Collection**, **Reminder**, **Rule**, **User**, **Device**, **EventLog** (for future sync/backend).

### Backend (v1.5+)

- MVP is **local-only**; no backend required.
- Later: Node + Fastify/Express, Postgres (e.g. Supabase/Neon), optional sync and Pro features (see PRD).

---

## Run

```bash
npm install
npm run dev
```

Load the unpacked extension from the build output (e.g. `apps/extension/build/chrome-mv3-dev`) in Chrome (Developer mode). Use the extension popup for stash/snooze and the **Tab Library** (side panel) for search and upcoming reminders.

---

## Project layout

- `apps/extension` — Plasmo extension (popup, sidepanel, background, Dexie schema, stash/snooze/reminder logic).
- `packages/core` — Shared domain models and types.

---

## Next steps (from PRD)

- **Phase 2:** Rule builder (recurring schedule → open collection).
- **v1.5:** Optional cloud sync (Supabase), accounts, devices, web dashboard.
- **Later:** PostHog/Sentry, Pro plan (Stripe), AI (smart tags/summaries).
