export const metadata = {
  title: 'Terms and Conditions | Subramaniam P G',
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl mb-2" style={{ fontFamily: 'Lora, serif', color: '#633806' }}>
        Terms and Conditions
      </h1>
      <p className="text-sm mb-12" style={{ color: '#888780' }}>
        Effective date: June 2026 | Offered by: Embiggen Consulting LLP
      </p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Acceptance of Terms</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          By enrolling in any course on subramaniampg.guru, you agree to these Terms and Conditions
          in full. If you do not agree, do not proceed with enrolment.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Course Access</h2>
        <ul className="list-disc list-inside space-y-2 text-base" style={{ color: '#5F5E5A' }}>
          <li>Course access is granted to the individual whose email address was used at enrolment.</li>
          <li>Access is non-transferable and may not be shared with any other person.</li>
          <li>Embiggen Consulting LLP reserves the right to revoke access if misuse is detected.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Intellectual Property</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          All course content on subramaniampg.guru — including text, videos, quizzes, infographics,
          and certificates — is the intellectual property of Embiggen Consulting LLP. You may not
          reproduce, distribute, or resell any course content without prior written permission.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Certificates</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          A certificate of completion is issued when all modules in a course are completed and all
          quizzes are passed. Certificates are issued in the name of the enrolling email address.
          Embiggen Consulting LLP maintains a record of all issued certificates.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Coupon Codes</h2>
        <ul className="list-disc list-inside space-y-2 text-base" style={{ color: '#5F5E5A' }}>
          <li>Coupon codes are valid only for the course and time period specified.</li>
          <li>Expired coupon codes cannot be reactivated or extended.</li>
          <li>Coupon codes cannot be combined with other offers.</li>
          <li>Embiggen Consulting LLP reserves the right to withdraw or modify any coupon at any time.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Content Updates</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          Embiggen Consulting LLP reserves the right to update, modify, or remove course content at
          any time. Enrolled learners will continue to have access to the course but may see updated
          content during their enrolment period.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Limitation of Liability</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          Embiggen Consulting LLP is not liable for any loss or damage arising from your use of this
          platform or its course content. The courses are educational in nature and do not constitute
          professional advice specific to your situation.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Governing Law</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          These terms are governed by the laws of India. Any disputes arising from the use of this
          platform shall be subject to the jurisdiction of the courts of Chennai, Tamil Nadu.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Changes to These Terms</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          Embiggen Consulting LLP may update these terms at any time. The updated version will be
          published at subramaniampg.guru/terms with a revised effective date. Continued use of the
          platform after any update constitutes acceptance of the revised terms.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#2C2C2A' }}>Contact</h2>
        <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
          For any queries related to these terms, write to{' '}
          <a href="mailto:pgs@embiggen.co.in" style={{ color: '#633806' }}>pgs@embiggen.co.in</a>.
        </p>
      </section>
    </main>
  )
}
