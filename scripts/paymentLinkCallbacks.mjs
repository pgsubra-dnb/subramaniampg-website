/**
 * Inspect / set the `callback_url` on the three "A Conversation with PGS"
 * Razorpay Payment Links, then FETCH each back and print the real stored value
 * (never trusts the PATCH response alone).
 *
 *   node --env-file=.env.production.local scripts/paymentLinkCallbacks.mjs --check
 *   node --env-file=.env.production.local scripts/paymentLinkCallbacks.mjs --set
 *
 * Needs RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in the environment (live keys).
 *
 * NOTE: Razorpay's "Update Payment Link" API (PATCH /v1/payment_links/:id) does
 * NOT document `callback_url` / `callback_method` as updatable — they are
 * creation-time fields. This script attempts the PATCH and then verifies by
 * re-fetch. If the callback is still absent after --set, the links must be
 * RECREATED with the callback (POST /v1/payment_links) and consultingBooking.ts
 * updated with the new rzp.io URLs.
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
if (!KEY_ID || !KEY_SECRET) {
  console.error('Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (live keys).')
  process.exit(1)
}

const mode = process.argv.includes('--set') ? 'set' : 'check'
const CALLBACK_URL = 'https://www.subramaniampg.guru/work/book-consulting/confirmed'

// The three links from PR #12 / lib/consultingBooking.ts, keyed by the rzp.io
// short code and the expected GST-inclusive amount (paise).
const EXPECTED = [
  { minutes: 30, shortCode: 'pkAJGdUg', amountPaise: 118000 },
  { minutes: 60, shortCode: 'fhELv8uU', amountPaise: 236000 },
  { minutes: 90, shortCode: 'RZz1ViqS', amountPaise: 354000 },
]

const AUTH = 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')
const BASE = 'https://api.razorpay.com/v1'

async function rzp(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: AUTH, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  if (!res.ok) {
    const err = new Error(`${init.method || 'GET'} ${path} → ${res.status}`)
    err.body = body
    throw err
  }
  return body
}

async function listAllPaymentLinks() {
  // The list endpoint is not paginated the usual way for payment links; it
  // returns { payment_links: [...] }. Ask for a generous count.
  const out = await rzp('/payment_links?count=100')
  return out.payment_links || out.items || []
}

function summarise(pl) {
  return {
    id: pl.id,
    short_url: pl.short_url,
    amount: pl.amount,
    currency: pl.currency,
    status: pl.status,
    callback_url: pl.callback_url ?? null,
    callback_method: pl.callback_method ?? null,
  }
}

const links = await listAllPaymentLinks()
console.log(`Found ${links.length} payment link(s) on this account.\n`)

let anyMissingAfter = false

for (const want of EXPECTED) {
  const match = links.find(
    (pl) =>
      (pl.short_url && pl.short_url.includes(want.shortCode)) ||
      pl.amount === want.amountPaise,
  )

  console.log(`── ${want.minutes} min  (expect ${want.amountPaise} paise, short code ${want.shortCode}) ──`)
  if (!match) {
    console.log('  NOT FOUND on this account. Skipping.\n')
    anyMissingAfter = true
    continue
  }

  const before = await rzp(`/payment_links/${match.id}`)
  console.log('  before:', JSON.stringify(summarise(before)))

  if (before.amount !== want.amountPaise) {
    console.log(`  ⚠ amount mismatch: link is ${before.amount} paise, expected ${want.amountPaise}. Not touching it.\n`)
    continue
  }

  if (mode === 'set') {
    try {
      const patched = await rzp(`/payment_links/${match.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ callback_url: CALLBACK_URL, callback_method: 'get' }),
      })
      console.log('  PATCH response:', JSON.stringify(summarise(patched)))
    } catch (e) {
      console.log('  PATCH FAILED:', e.message, JSON.stringify(e.body))
    }
    // Re-fetch — do not trust the PATCH response.
    const after = await rzp(`/payment_links/${match.id}`)
    console.log('  after  :', JSON.stringify(summarise(after)))
    const ok = after.callback_url === CALLBACK_URL && after.callback_method === 'get'
    console.log(ok ? '  ✅ callback is set on the stored link.' : '  ❌ callback NOT set after PATCH — this link must be RECREATED with the callback.')
    if (!ok) anyMissingAfter = true
  } else {
    const ok = before.callback_url === CALLBACK_URL && before.callback_method === 'get'
    console.log(ok ? '  ✅ callback already set.' : '  ❌ no callback set (or not the expected URL).')
    if (!ok) anyMissingAfter = true
  }
  console.log()
}

console.log(anyMissingAfter
  ? 'RESULT: at least one link still has no usable callback. See notes above.'
  : 'RESULT: all three links have the callback set and verified by re-fetch.')
process.exit(anyMissingAfter ? 2 : 0)
