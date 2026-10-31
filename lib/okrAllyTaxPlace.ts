import { GST_STATES, stateCode, stateCodeFromGstin } from './indiaGstStates'

/**
 * Place of supply and the CGST+SGST / IGST split of an OKR Ally invoice. Pure (no database), so it is unit-tested
 * (scripts/okr-tax-place-tests.mts). Used by createAndSendInvoice in lib/okrAllyInvoice.ts.
 *
 * Rules:
 * - Individual on the individual pack path (`retailConsumer`): place of supply is Tamil Nadu and the tax is CGST 9 + SGST 9, always.
 *   The individual checkout asks for neither a state nor a GSTIN; any state or GSTIN an older page (or an order created before this
 *   rule) carries is ignored here.
 * - A buyer with a GSTIN who is NOT on that path (a corporate): the GSTIN's state decides the split; the place of supply printed is
 *   the state the buyer chose (unchanged).
 * - Everything else (consulting, the ₹0 free-review invoice, Academy): the state chosen decides, as before.
 * Only the tax head and the place of supply are decided here. No amount ever changes.
 */

/** Tamil Nadu, where the supplier is registered. */
export const RETAIL_PLACE_OF_SUPPLY_CODE = '33'

export interface TaxSplit {
  cgst: number | null
  sgst: number | null
  igst: number | null
}

export function computeTaxSplit(gstAmount: number, buyerStateCode: string | null, supplierStateCode: string | null): TaxSplit {
  if (buyerStateCode && supplierStateCode && buyerStateCode === supplierStateCode) {
    const cgst = Math.round((gstAmount / 2) * 100) / 100
    return { cgst, sgst: Math.round((gstAmount - cgst) * 100) / 100, igst: null }
  }
  return { cgst: null, sgst: null, igst: gstAmount }
}

export interface TaxPlaceInput {
  /** The buyer's state (name or 2-digit code). Empty for the ₹0 free-review invoice. */
  placeOfSupply: string
  buyerGstin: string | null
  gstAmount: number
  supplierGstin: string
  /** Null for the ₹0 free-review invoice (no checkout step, so no buyer state). */
  razorpayPaymentId: string | null
  /** Set only by the individual pack path (verify-payment and the webhook). */
  retailConsumer?: boolean
}

export type TaxPlaceResult = { ok: true; resolvedPlace: string; split: TaxSplit } | { ok: false }

export function resolveTaxPlace(input: TaxPlaceInput): TaxPlaceResult {
  const retail = input.retailConsumer === true
  const placeInput = retail
    ? RETAIL_PLACE_OF_SUPPLY_CODE
    : input.placeOfSupply?.trim() || (input.razorpayPaymentId ? '' : stateCodeFromGstin(input.supplierGstin) || '')
  const placeCode = stateCode(placeInput)
  const resolvedPlace = placeCode ? GST_STATES.find((s) => s.code === placeCode)!.name : null
  if (!resolvedPlace) return { ok: false }

  // An individual is always in the place just worked out (Tamil Nadu); otherwise the GSTIN's state decides, else the chosen state.
  const buyerStateCode = retail ? placeCode : input.buyerGstin ? stateCodeFromGstin(input.buyerGstin) : placeCode
  const supplierStateCode = stateCodeFromGstin(input.supplierGstin)
  return { ok: true, resolvedPlace, split: computeTaxSplit(input.gstAmount, buyerStateCode, supplierStateCode) }
}
