/**
 * Recreate the three "A Conversation with PGS" Razorpay Payment Links WITH a
 * callback_url (which cannot be added to an existing link — the Update API
 * rejects it with "extra fields sent in state created").
 *
 *   node --env-file=.env.production.local scripts/recreatePaymentLinks.mjs --dry-run
 *   node --env-file=.env.production.local scripts/recreatePaymentLinks.mjs --create
 *   node --env-file=.env.production.local scripts/recreatePaymentLinks.mjs --create --cancel-old
 *
 * --dry-run     : print what would be created, touch nothing.
 * --create      : create the three new links, re-fetch each to confirm the
 *                 callback is stored, print the new short_urls.
 * --cancel-old  : after a successful --create, cancel the three OLD links
 *                 (only if they have zero payments).
 *
 * Needs live RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
if (!KEY_ID || !KEY_SECRET) {
  console.error('Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (live keys).')
  process.exit(1)
}

const args = new Set(process.argv.slice(2))
const DRY = args.has('--dry-run') || (!args.has('--create'))
const CANCEL_OLD = args.has('--cancel-old')

const CALLBACK_URL = 'https://www.subramaniampg.guru/work/book-consulting/confirmed'
const DESCRIPTION = 'A Conversation with PGS'
const NOTES = { 'The fee is inclusive of service tax at 18%': '' } // replicated from the originals

// old link id ← keyed by amount (paise)
const OLD = {
  118000: 'plink_TWIVKO9J9H2Zk5',
  236000: 'plink_TWIWLbUapCRCoX',
  354000: 'plink_TWIXFs0QDm0w5y',
}
const SLOTS = [
  { minutes: 30, amountPaise: 118000 },
  { minutes: 60, amountPaise: 236000 },
  { minutes: 90, amountPaise: 354000 },
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
  try { body = JSON.parse(text) } catch { body = text }
  if (!res.ok) {
    const e = new Error(`${init.method || 'GET'} ${path} → ${res.status}`)
    e.body = body
    throw e
  }
  return body
}

const s = (pl) => ({
  id: pl.id, short_url: pl.short_url, amount: pl.amount, status: pl.status,
  callback_url: pl.callback_url ?? null, callback_method: pl.callback_method ?? null,
})

const results = []

for (const slot of SLOTS) {
  console.log(`\n── ${slot.minutes} min  (${slot.amountPaise} paise) ──`)
  const payload = {
    amount: slot.amountPaise,
    currency: 'INR',
    description: DESCRIPTION,
    accept_partial: false,
    notify: { email: true, sms: true },
    reminder_enable: false,
    notes: NOTES,
    callback_url: CALLBACK_URL,
    callback_method: 'get',
  }

  if (DRY) {
    console.log('  would POST /payment_links:', JSON.stringify(payload))
    continue
  }

  const created = await rzp('/payment_links', { method: 'POST', body: JSON.stringify(payload) })
  console.log('  created:', JSON.stringify(s(created)))
  const after = await rzp(`/payment_links/${created.id}`)
  const ok = after.callback_url === CALLBACK_URL && after.callback_method === 'get'
  console.log('  re-fetch:', JSON.stringify(s(after)))
  console.log(ok ? '  ✅ callback stored on the new link.' : '  ❌ callback NOT stored — stop and investigate.')
  results.push({ minutes: slot.minutes, amountPaise: slot.amountPaise, id: after.id, short_url: after.short_url, ok })
}

if (DRY) {
  console.log('\nDRY RUN — nothing created. Re-run with --create.')
  process.exit(0)
}

const allOk = results.length === SLOTS.length && results.every((r) => r.ok)
console.log('\n=== NEW LINKS ===')
for (const r of results) console.log(`  ${r.minutes} min  ₹${r.amountPaise / 100}  ${r.short_url}  (${r.id})`)

if (!allOk) {
  console.log('\nAt least one link is not right — NOT cancelling anything.')
  process.exit(2)
}

if (CANCEL_OLD) {
  console.log('\n=== CANCELLING OLD LINKS ===')
  for (const [amountPaise, id] of Object.entries(OLD)) {
    const cur = await rzp(`/payment_links/${id}`)
    if (cur.amount_paid && cur.amount_paid > 0) {
      console.log(`  ${id}: amount_paid=${cur.amount_paid} — HAS PAYMENTS, leaving it alone.`)
      continue
    }
    if (cur.status === 'cancelled') { console.log(`  ${id}: already cancelled.`); continue }
    const c = await rzp(`/payment_links/${id}/cancel`, { method: 'POST' })
    console.log(`  ${id} (₹${amountPaise / 100}): status → ${c.status}`)
  }
} else {
  console.log('\nOld links left active. Re-run with --cancel-old to cancel them, or cancel from the dashboard.')
}

console.log('\nNext: update lib/consultingBooking.ts CONSULTING_SLOTS[].razorpayPaymentLink with the NEW short_urls above.')
