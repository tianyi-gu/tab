export function PopupApp() {
  return (
    <main className="min-h-[460px] w-[380px] bg-canvas p-5 text-ink">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Garbo</h1>
        <p className="mt-1 text-sm text-slate-700">Stash tabs, keep focus, come back on your schedule.</p>
      </header>

      <section className="mt-6 grid gap-3">
        <button className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-canvas">Stash This Tab</button>
        <button className="rounded-xl border border-ink/20 bg-white px-4 py-2 text-sm font-medium text-ink">Stash All Tabs</button>
      </section>

      <section className="mt-6 rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="text-sm font-semibold">Quick Snooze</h2>
        <p className="mt-1 text-xs text-slate-600">Later Today • Tomorrow Morning • This Weekend • Custom</p>
      </section>
    </main>
  )
}
