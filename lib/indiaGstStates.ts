/**
 * Indian GST state / UT codes (place-of-supply codes). Used to decide whether
 * an OKR Ally invoice splits tax into CGST+SGST (buyer in the supplier's
 * state) or charges IGST (inter-state). The tax total is 18% either way — only
 * the invoice itemisation changes (design doc section 3).
 */
export const GST_STATES: { code: string; name: string }[] = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' },
]

const BY_NAME = new Map(GST_STATES.map((s) => [s.name.toLowerCase(), s.code]))
const BY_CODE = new Map(GST_STATES.map((s) => [s.code, s.name]))

export function isValidStateName(name: string): boolean {
  return BY_NAME.has(name.trim().toLowerCase())
}

/** State/UT code for a place-of-supply value that is either the state name or the 2-digit code. */
export function stateCode(placeOfSupply: string): string | null {
  const v = placeOfSupply.trim()
  if (BY_CODE.has(v)) return v
  return BY_NAME.get(v.toLowerCase()) ?? null
}

/** First two digits of a 15-character GSTIN are its state/UT code. */
export function stateCodeFromGstin(gstin: string): string | null {
  const code = gstin.trim().slice(0, 2)
  return BY_CODE.has(code) ? code : null
}

export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
