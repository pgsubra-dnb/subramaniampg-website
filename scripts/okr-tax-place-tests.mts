#!/usr/bin/env -S npx tsx
/**
 * Place of supply and tax head of OKR Ally invoices (lib/okrAllyTaxPlace.ts), and that BOTH individual-pack paths (verify-payment
 * and the webhook) switch it on while consulting, corporate, Academy and the ₹0 review do not. No database, no network.
 *
 *   npx tsx scripts/okr-tax-place-tests.mts
 */
import { readFileSync } from 'node:fs'
import { resolveTaxPlace, type TaxPlaceInput } from '../lib/okrAllyTaxPlace.ts'

let pass = 0
let fail = 0
const ok = (name: string, cond: boolean, detail = '') => {
  if (cond) pass++
  else fail++
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' - ' + detail : ''}`)
}
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

const SUPPLIER = '33ABCDE1234F1Z5'
const GST_TN = '33AAACP1234C1Z5'
const GST_KA = '29AAACP1234C1Z5'
const gstOf = (base: number) => Math.round(base * 0.18) // gstBreakdown in lib/okrAllyBilling.ts
const run = (o: Partial<TaxPlaceInput> & { base?: number } = {}) => {
  const r = resolveTaxPlace({
    placeOfSupply: 'Tamil Nadu',
    buyerGstin: null,
    gstAmount: gstOf(o.base ?? 100),
    supplierGstin: SUPPLIER,
    razorpayPaymentId: 'pay_x',
    ...o,
  })
  if (!r.ok) throw new Error('unexpected invalid place')
  return r
}
const head = (r: ReturnType<typeof run>) => (r.split.igst !== null ? 'IGST' : 'CGST+SGST')
// chk_tax_split (okr-ally-schema-migration.sql): exactly one of (cgst AND sgst) or igst is set.
const chkTaxSplit = (r: ReturnType<typeof run>) => (r.split.cgst !== null && r.split.sgst !== null && r.split.igst === null) || (r.split.cgst === null && r.split.sgst === null && r.split.igst !== null)

// ---------------------------------------------------------------- the individual pack path (flag on): verify-payment and the webhook
{
  const tn = run({ retailConsumer: true, placeOfSupply: 'Tamil Nadu' })
  ok('individual in Tamil Nadu: Tamil Nadu, CGST + SGST', tn.resolvedPlace === 'Tamil Nadu' && head(tn) === 'CGST+SGST' && tn.split.cgst === 9 && tn.split.sgst === 9)
  for (const state of ['Karnataka', 'Maharashtra', 'Delhi', 'Kerala', 'Ladakh', 'Andaman and Nicobar Islands']) {
    const before = run({ placeOfSupply: state })
    const after = run({ retailConsumer: true, placeOfSupply: state })
    ok(`individual in ${state}: was ${head(before)}, now Tamil Nadu with CGST + SGST`, head(before) === 'IGST' && after.resolvedPlace === 'Tamil Nadu' && head(after) === 'CGST+SGST')
  }
  const code = run({ retailConsumer: true, placeOfSupply: '29' })
  ok('a chosen state given as a code is handled the same', code.resolvedPlace === 'Tamil Nadu' && head(code) === 'CGST+SGST')
  const odd = run({ retailConsumer: true, placeOfSupply: 'Karnataka', base: 375 })
  ok('Rs 375 pack: GST Rs 68 split Rs 34 + Rs 34, which adds up', odd.split.cgst === 34 && odd.split.sgst === 34 && (odd.split.cgst ?? 0) + (odd.split.sgst ?? 0) === gstOf(375))
}

// ---------------------------------------------------------------- an individual WITH a GSTIN: unchanged (the flag does not touch it)
{
  for (const [gstin, state, want, place] of [[GST_KA, 'Karnataka', 'IGST', 'Karnataka'], [GST_TN, 'Tamil Nadu', 'CGST+SGST', 'Tamil Nadu'], [GST_TN, 'Karnataka', 'CGST+SGST', 'Karnataka'], [GST_KA, 'Tamil Nadu', 'IGST', 'Tamil Nadu']] as const) {
    const a = run({ buyerGstin: gstin, placeOfSupply: state })
    const b = run({ buyerGstin: gstin, placeOfSupply: state, retailConsumer: true })
    ok(`individual with a GSTIN (${gstin.slice(0, 2)}), chose ${state}: ${want}, place ${place}, identical with the flag on`, head(b) === want && b.resolvedPlace === place && JSON.stringify(a) === JSON.stringify(b))
  }
}

// ---------------------------------------------------------------- corporate (never flagged): unchanged
{
  const tn = run({ buyerGstin: GST_TN, placeOfSupply: 'Tamil Nadu' })
  ok('corporate in Tamil Nadu: CGST + SGST', head(tn) === 'CGST+SGST' && tn.resolvedPlace === 'Tamil Nadu')
  const ka = run({ buyerGstin: GST_KA, placeOfSupply: 'Karnataka', base: 500 })
  ok('corporate out of state: IGST, place of supply the chosen state', head(ka) === 'IGST' && ka.resolvedPlace === 'Karnataka' && ka.split.igst === gstOf(500))
}

// ---------------------------------------------------------------- consulting, Academy and the ₹0 review (flag off): unchanged
{
  const c = run({ placeOfSupply: 'Karnataka' })
  ok('flag off, no GSTIN, chose Karnataka (consulting / Academy): IGST, Karnataka, as before', head(c) === 'IGST' && c.resolvedPlace === 'Karnataka')
  const free = run({ placeOfSupply: '', razorpayPaymentId: null, gstAmount: 0 })
  ok('the ₹0 free-review invoice: supplier state, nil CGST + SGST, as before', free.resolvedPlace === 'Tamil Nadu' && head(free) === 'CGST+SGST' && free.split.cgst === 0)
  const bad = resolveTaxPlace({ placeOfSupply: 'Nowhereland', buyerGstin: null, gstAmount: 18, supplierGstin: SUPPLIER, razorpayPaymentId: 'pay_x' })
  ok('an invalid state is still refused when the flag is off', bad.ok === false)
}

// ---------------------------------------------------------------- amounts never change; chk_tax_split always holds
{
  let n = 0
  let sums = true
  let heads = true
  for (let base = 0; base <= 1500; base++) {
    for (const place of ['Tamil Nadu', 'Karnataka', 'Delhi']) {
      for (const [gstin, flag] of [[null, true], [null, false], [GST_TN, true], [GST_KA, true], [GST_KA, false]] as const) {
        const gst = gstOf(base)
        const r = run({ base, placeOfSupply: place, buyerGstin: gstin, retailConsumer: flag })
        const total = r.split.igst !== null ? r.split.igst : (r.split.cgst ?? 0) + (r.split.sgst ?? 0)
        if (Math.abs(total - gst) > 1e-9) sums = false // the tax head changes; the GST total never does
        if (!chkTaxSplit(r)) heads = false
        n++
      }
    }
  }
  ok(`GST total never changes: CGST + SGST or IGST always equals the GST amount (${n} cases)`, sums)
  ok(`chk_tax_split still holds: exactly one head set (${n} cases)`, heads)
  const pass1 = run({ retailConsumer: true, placeOfSupply: 'Karnataka', base: 300 })
  ok('resolveTaxPlace takes and returns no base, total or Razorpay amount', Object.keys(pass1).sort().join() === 'ok,resolvedPlace,split')
}

// ---------------------------------------------------------------- BOTH paths set the flag; nothing else does
{
  const callBlock = (src: string) => {
    const i = src.indexOf('createAndSendInvoice({')
    return i < 0 ? '' : src.slice(i, src.indexOf('\n      })', i) > 0 ? src.indexOf('\n      })', i) : src.indexOf('})', i))
  }
  const verify = read('app/api/okr-ally/verify-payment/route.ts')
  const hook = read('app/api/okr-ally/webhook/route.ts')
  ok('verify-payment: the individual pack invoice sets retailConsumer: true', /createAndSendInvoice\(\{[\s\S]*?retailConsumer: true[\s\S]*?\}\)/.test(verify))
  ok('webhook: the individual pack invoice sets retailConsumer: true', /createAndSendInvoice\(\{[\s\S]*?retailConsumer: true[\s\S]*?\}\)/.test(hook))
  ok('each route calls createAndSendInvoice once and sets the flag once', (verify.match(/createAndSendInvoice\(\{/g) ?? []).length === 1 && (hook.match(/createAndSendInvoice\(\{/g) ?? []).length === 1 && (verify.match(/retailConsumer/g) ?? []).length === 1 && (hook.match(/retailConsumer/g) ?? []).length === 1)
  ok('both routes still pass the buyer GSTIN and the chosen place of supply from the order notes', [verify, hook].every((s) => /buyerGstin: notes\.buyerGstin \|\| null/.test(s) && /placeOfSupply: notes\.placeOfSupply/.test(s)))
  ok('both routes still take the amounts from the order notes unchanged', [verify, hook].every((s) => /baseAmount: base,/.test(s) && /gstAmount: gst,/.test(s) && /totalAmount: total,/.test(s)))
  ok('the corporate fulfilment (verify-payment, webhook, okrAllyOrg) does not set the flag', !/retailConsumer/.test(read('lib/okrAllyOrg.ts')) && (verify.indexOf('retailConsumer') > verify.indexOf('fulfilCorporatePurchase')) && (hook.indexOf('retailConsumer') > hook.indexOf('fulfilCorporatePurchase')))
  ok('consulting and Academy corporate do not set the flag', !/retailConsumer/.test(read('lib/consultingCheckout.ts')) && !/retailConsumer/.test(read('lib/academyCorporate.ts')))
  const inv = read('lib/okrAllyInvoice.ts')
  ok('createAndSendInvoice passes the flag to resolveTaxPlace and the free-review invoice does not set it', /retailConsumer: input\.retailConsumer/.test(inv) && (inv.match(/input\.retailConsumer/g) ?? []).length === 1 && !/placeOfSupply: '',[\s\S]*retailConsumer/.test(inv))
  ok('the invoice row still stores the amounts from the input, unchanged', /input\.baseAmount,\s*input\.gstAmount,\s*input\.totalAmount,\s*resolvedPlace,\s*split\.cgst,\s*split\.sgst,\s*split\.igst,/.test(inv))
  void callBlock
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'}: ${pass} checks passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
