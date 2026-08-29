import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { getSessionUser, getSiteSettings } from '@/lib/okrAlly'
import { grantCredits, getPack } from '@/lib/okrAllyBilling'
import { createAndSendInvoice } from '@/lib/okrAllyInvoice'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'

export const dynamic = 'force-dynamic'

/**
 * Primary (client-side) confirmation path for an OKR Ally pack purchase
 * (build sequence step 4). The Razorpay webhook is the silent fallback for the
 * closed-tab case — both call the same idempotent grantCredits.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Pack, credits, coupon and owning user are read back from the order `notes`
 * set in create-order — the client cannot influence what gets granted.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ success: false, reason: 'Not signed in' }, { status: 401 })
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, reason: 'Missing required fields' }, { status: 400 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, reason: 'Signature mismatch' }, { status: 400 })
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
    const order = await razorpay.orders.fetch(razorpay_order_id)
    const notes = (order.notes || {}) as Record<string, string>

    if (notes.app !== 'okr-ally' || notes.userId !== user.id) {
      return NextResponse.json({ success: false, reason: 'Order does not belong to this user' }, { status: 403 })
    }

    const pack = getPack(notes.pack)
    const credits = pack ? pack.credits : Number(notes.credits)
    if (!credits || credits < 1) {
      return NextResponse.json({ success: false, reason: 'Order has no credits' }, { status: 400 })
    }

    const result = await grantCredits({
      userId: user.id,
      credits,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      couponCode: notes.couponCode || null,
    })

    if (result.granted) {
      const settings = await getSiteSettings()
      const signoff = settings.legalBusinessName || 'Embiggen Consulting LLP'
      await sendBrevoEmail({
        to: user.email,
        toName: user.name,
        subject: 'Your OKR Ally credits are ready',
        htmlContent: `
          <div style="font-family:Inter,Arial,sans-serif;color:#2C2C2A;line-height:1.6;">
            <p>Your payment is confirmed. <strong>${credits} review credit${credits > 1 ? 's' : ''}</strong> ${credits > 1 ? 'have' : 'has'} been added to your account.</p>
            <p>Balance: <strong>${result.creditsRemaining}</strong>. Your GST invoice follows in a separate email.</p>
            <p style="font-size:13px;color:#6b6b66;">Subramaniam P G &middot; ${signoff}</p>
          </div>`,
        textContent:
          `Your payment is confirmed. ${credits} review credit(s) added. ` +
          `Balance: ${result.creditsRemaining}. Your GST invoice follows separately.`,
      })
    }

    // GST invoice (build sequence step 5) — idempotent on razorpay_payment_id,
    // so the webhook re-running this is a no-op. Never blocks the confirmation:
    // credits are already granted; a soft failure is logged for backfill.
    const base = Number(notes.base)
    const gst = Number(notes.gst)
    const total = Number(notes.total)
    let invoiceNumber: string | null = null
    if (base && gst && total && notes.placeOfSupply) {
      const inv = await createAndSendInvoice({
        userId: user.id,
        razorpayPaymentId: razorpay_payment_id,
        baseAmount: base,
        gstAmount: gst,
        totalAmount: total,
        buyerGstin: notes.buyerGstin || null,
        placeOfSupply: notes.placeOfSupply,
        buyerName: user.name,
        buyerEmail: user.email,
      })
      if (inv.ok) invoiceNumber = inv.invoice.invoice_number
    } else {
      console.error('OKR Ally verify-payment: order notes missing invoice fields', razorpay_order_id)
    }

    return NextResponse.json({
      success: true,
      alreadyProcessed: result.alreadyProcessed,
      creditsRemaining: result.creditsRemaining,
      invoiceNumber,
    })
  } catch (error) {
    console.error('OKR Ally verify-payment error:', error)
    return NextResponse.json({ success: false, reason: 'Internal error' }, { status: 500 })
  }
}
