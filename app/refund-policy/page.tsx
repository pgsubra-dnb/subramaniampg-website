export const metadata = {
  title: 'Refund and Cancellation Policy | Subramaniam P G',
}

export default function RefundPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl mb-2" style={{ fontFamily: 'Lora, serif', color: '#633806' }}>
        Refund and Cancellation Policy
      </h1>
      <p className="text-sm mb-12" style={{ color: '#888780' }}>
        Effective date: June 2026 | Offered by: Embiggen Consulting LLP
      </p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>No Refund Policy</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          All course purchases on subramaniampg.guru are final. We do not offer refunds, cancellations,
          or transfers once a course enrolment is confirmed and access is granted. This applies to all
          courses, including those purchased at a discounted price using a coupon code.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Exception — Technical Access Failure</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          If a verified technical issue on our platform prevents you from accessing a course you have
          paid for, and we are unable to resolve the issue within 48 hours of your reporting it, a full
          refund will be issued to the original payment method. To report a technical access issue, email{' '}
          <a href="mailto:pgs@embiggen.co.in" style={{ color: '#633806' }}>pgs@embiggen.co.in</a> with
          your registered email address and a description of the problem.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Coupon Codes and Discounts</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          Coupon codes are non-transferable, non-refundable, and cannot be exchanged for cash. Each
          coupon is valid only for the course and time period specified at the time of issue.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Contact</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          For any queries related to this policy, write to{' '}
          <a href="mailto:pgs@embiggen.co.in" style={{ color: '#633806' }}>pgs@embiggen.co.in</a>.
        </p>
      </section>
    </main>
  )
}
