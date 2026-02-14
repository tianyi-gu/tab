# garbo

Browser-first tab manager to reduce tab clutter while preserving retrieval through stashing, reminders, and automations.

## Current State

This repository is scaffolding only (no feature implementation yet).

## Monorepo Layout

- `apps/extension` - Browser extension (Plasmo + React + TypeScript + Tailwind)
- `apps/api` - Backend API skeleton (Fastify + TypeScript)
- `packages/shared` - Shared domain types

## Prerequisites

- Node.js 20+
- pnpm 9+

## Getting Started

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Useful Commands

```bash
pnpm dev         # run extension + API in parallel
pnpm build       # build all packages
pnpm typecheck   # type-check all packages
pnpm lint        # placeholder lint script
```

## Extension Notes

Planned permissions are already declared in the manifest scaffold:

- `tabs`
- `tabGroups`
- `storage`
- `alarms`
- `notifications`
- `commands`
- `contextMenus`

## API Notes

Current placeholder endpoint:

- `GET /health`

Future route groups are stubbed:

- `/v1/tabs`
- `/v1/collections`
- `/v1/reminders`
- `/v1/rules`

## Git Setup / Push

If this repo is new and has no commits yet:

```bash
git add .
git commit -m "chore: scaffold garbo monorepo"
git remote set-url origin git@github.com:tianyi-gu/tab.git
git push -u origin main
```
