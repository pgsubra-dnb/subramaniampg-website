/**
 * Corporate review-credit bundles — three fixed sizes, GST added on top.
 * Display-side copy of the rate card, shared by the corporate purchase page
 * (app/okr-ally/corporate) and the Corporate tab of Pricing & Plans so the
 * two can never drift. Values are unchanged from the original CorporateClient.
 * (The server-side source of truth for charging is lib/okrAllyOrg.ts.)
 */
export const BUNDLES = [
  { id: 'b100', credits: 100, base: 6000 },
  { id: 'b200', credits: 200, base: 11000 },
  { id: 'b500', credits: 500, base: 25000 },
]
export const gst = (b: number) => Math.round(b * 0.18)
