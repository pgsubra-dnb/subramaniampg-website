export const metadata = {
  title: 'Privacy Policy | Subramaniam P G',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl mb-2" style={{ fontFamily: 'Lora, serif', color: '#633806' }}>
        Privacy Policy
      </h1>
      <p className="text-sm mb-12" style={{ color: '#888780' }}>
        Effective date: June 2026 | Offered by: Embiggen Consulting LLP
      </p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>What We Collect</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          When you enrol in a course or submit an assessment on subramaniampg.guru, we collect your
          email address. No other personal information is collected by our platform.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>How We Use Your Information</h2>
        <ul className="list-disc list-inside space-y-2 text-base" style={{ color: '#5F5E5A' }}>
          <li>To send you a magic link for course access.</li>
          <li>To issue your course completion certificate.</li>
          <li>To send you course-related emails such as module completion confirmations and reflections.</li>
          <li>To notify you of updates relevant to your enrolled course.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>What We Do Not Do</h2>
        <ul className="list-disc list-inside space-y-2 text-base" style={{ color: '#5F5E5A' }}>
          <li>We do not sell or rent your email address to any third party.</li>
          <li>We do not use your email for unrelated marketing without your consent.</li>
          <li>We do not store your payment card details, bank account information, or any financial data.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Payment Data</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          All payment processing is handled by Razorpay, a PCI-DSS compliant payment gateway. When you
          make a payment, your card and bank details are entered directly into the Razorpay secure
          interface and are never seen, transmitted to, or stored by Embiggen Consulting LLP.
          Razorpay&apos;s own privacy policy governs how your payment data is handled.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Data Retention</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          Your email address and course enrolment records are retained for as long as you have an
          active enrolment or certificate on record. You may request deletion of your data at any time
          by writing to{' '}
          <a href="mailto:pgs@embiggen.co.in" style={{ color: '#633806' }}>pgs@embiggen.co.in</a>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Third-Party Services</h2>
        <ul className="list-disc list-inside space-y-2 text-base" style={{ color: '#5F5E5A' }}>
          <li>Sanity — content management and enrolment records.</li>
          <li>Brevo — transactional email delivery.</li>
          <li>Razorpay — payment processing.</li>
          <li>Vercel — website hosting.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Your Rights</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          You have the right to request access to the data we hold about you, and to request its
          correction or deletion. Write to{' '}
          <a href="mailto:pgs@embiggen.co.in" style={{ color: '#633806' }}>pgs@embiggen.co.in</a>.
          We will respond within 7 working days.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Contact</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          For any privacy-related queries, write to{' '}
          <a href="mailto:pgs@embiggen.co.in" style={{ color: '#633806' }}>pgs@embiggen.co.in</a>.
        </p>
      </section>
    </main>
  )
}
