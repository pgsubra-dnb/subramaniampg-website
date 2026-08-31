/**
 * Probe the LIVE /api/consulting/webhook signature check with a candidate secret,
 * WITHOUT a payment and WITHOUT touching the database.
 *
 *   node --env-file=.env.production.local scripts/testConsultingWebhook.mjs
 *
 * It POSTs a tiny, correctly-signed body with a NON-"payment_link.paid" event
 * (`webhook.probe`). The route verifies the HMAC first, then — for any event it
 * doesn't handle — returns 200 `{ ok: true, ignored: "webhook.probe" }` and does
 * nothing else. So:
 *
 *   200 {"ok":true,"ignored":"webhook.probe"}   → the server's secret == the
 *                                                 candidate secret used here.
 *   400 {"ok":false,"reason":"Invalid signature"} → they DIFFER.
 *   500                                          → server has neither
 *                                                 CONSULTING_RAZORPAY_WEBHOOK_SECRET
 *                                                 nor RAZORPAY_WEBHOOK_SECRET set.
 *
 * The route resolves its secret as
 *   CONSULTING_RAZORPAY_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET
 * so this script picks the candidate the same way (override with WEBHOOK_TEST_SECRET).
 *
 *   --url <u>   target (default https://subramaniampg.guru/api/consulting/webhook)
 */

import crypto from 'crypto'

const candidate =
  process.env.WEBHOOK_TEST_SECRET ||
  process.env.CONSULTING_RAZORPAY_WEBHOOK_SECRET ||
  process.env.RAZORPAY_WEBHOOK_SECRET

if (!candidate) {
  console.error(
    'No candidate secret. Set WEBHOOK_TEST_SECRET (or CONSULTING_RAZORPAY_WEBHOOK_SECRET,\n' +
      'or RAZORPAY_WEBHOOK_SECRET) in the environment / --env-file.'
  )
  process.exit(1)
}

const urlArg = process.argv.indexOf('--url')
const url =
  urlArg !== -1 && process.argv[urlArg + 1]
    ? process.argv[urlArg + 1]
    : 'https://subramaniampg.guru/api/consulting/webhook'

// Deliberately NOT payment_link.paid — the route verifies the signature before
// it looks at the event, then ignores anything it doesn't handle.
const body = JSON.stringify({
  event: 'webhook.probe',
  payload: {},
  _note: 'signature probe from scripts/testConsultingWebhook.mjs — not a Razorpay event',
})
const signature = crypto.createHmac('sha256', candidate).update(body).digest('hex')

const masked =
  candidate.length <= 8
    ? '*'.repeat(candidate.length)
    : candidate.slice(0, 3) + '…' + candidate.slice(-3) + ` (len ${candidate.length})`

console.log(`POST ${url}`)
console.log(`candidate secret: ${masked}`)

const res = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-razorpay-signature': signature },
  body,
})
const text = await res.text()
console.log(`\nHTTP ${res.status}`)
console.log(text)

if (res.status === 200 && text.includes('webhook.probe')) {
  console.log('\n✓ MATCH — the deployed webhook validates against this exact secret.')
  process.exitCode = 0
} else if (res.status === 400) {
  console.log('\n✗ MISMATCH — the deployed webhook does NOT accept this secret.')
  process.exitCode = 2
} else {
  console.log('\n? Unexpected — inspect the response above.')
  process.exitCode = 3
}
