import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * OKR Ally / Goal Ally — demo request context.
 *
 * A demo session (PGS's `is_admin`-only "Start demo" — see lib/okrAllyDemo.ts)
 * must never produce a real side effect: no outbound email, no GST invoice, no
 * advance of the sequential invoice counter. Records are still written (the demo
 * IS the real product), but flagged `is_demo` and kept off the admin review list.
 *
 * The request handlers a demo session can reach that would otherwise send mail
 * or mint an invoice (today: POST /api/okr-ally/review) run their body inside
 * `runInDemoContext(true, …)`. `sendBrevoEmail` and `createAndSendInvoice` then
 * see `isDemoRequest() === true` and no-op with a log line — "regardless of what
 * is typed during it".
 */
const store = new AsyncLocalStorage<{ demo: boolean }>()

/** Run `fn` with the demo flag bound to the current async context. */
export function runInDemoContext<T>(demo: boolean, fn: () => Promise<T>): Promise<T> {
  return store.run({ demo: !!demo }, fn)
}

/** True when the current request is being handled for a demo session. */
export function isDemoRequest(): boolean {
  return store.getStore()?.demo === true
}
