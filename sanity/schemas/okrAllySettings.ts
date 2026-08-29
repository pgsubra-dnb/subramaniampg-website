import { defineType, defineField } from 'sanity'

/**
 * OKR Ally settings — the `siteSettings`-equivalent for the isolated `okr-ally`
 * dataset. Only the fields OKR Ally actually reads:
 *   - footer / exit-screen links
 *   - the supplier details snapshotted onto each GST invoice at generation time
 *
 * Read server-side via getSiteSettings() in lib/okrAlly.ts. Treat as a
 * singleton — create exactly one document of this type.
 */
export default defineType({
  name: 'okrAllySettings',
  title: 'OKR Ally Settings',
  type: 'document',
  fields: [
    // ── Contact + social / booking links (report footer + exit screen) ──
    defineField({
      name: 'email',
      title: 'Contact Email',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      title: 'Contact Phone',
      type: 'string',
    }),
    defineField({
      name: 'substackUrl',
      title: 'Substack URL',
      type: 'url',
      description: 'Newsletter subscribe link, shown in the OKR Ally exit screen and report footer.',
    }),
    defineField({
      name: 'linkedinUrl',
      title: 'LinkedIn URL',
      type: 'url',
      description: 'Personal LinkedIn profile, shown in the OKR Ally exit screen and report footer.',
    }),
    defineField({
      name: 'okrAllyBookingUrl',
      title: 'Consulting Booking URL',
      type: 'url',
      description: 'External booking link (e.g. https://cal.id/pgs) for the OKR Ally exit screen.',
    }),

    // ── Business / GST invoice compliance ──────────────────────────────
    // Snapshotted onto each `invoices` row at generation time, so historical
    // invoices stay accurate even if these values change later.
    defineField({
      name: 'legalBusinessName',
      title: 'Legal Business Name',
      type: 'string',
      description: 'Registered legal name of the supplier, printed on GST invoices.',
    }),
    defineField({
      name: 'registeredAddress',
      title: 'Registered Address',
      type: 'text',
      rows: 3,
      description: 'Full registered address of the supplier, printed on GST invoices.',
    }),
    defineField({
      name: 'supplierGstin',
      title: 'Supplier GSTIN',
      type: 'string',
      description: '15-character GSTIN of the supplier. Determines the supplier state for CGST+SGST vs IGST split.',
    }),
    defineField({
      name: 'supplierPan',
      title: 'Supplier PAN',
      type: 'string',
      description: '10-character PAN of the supplier, printed on GST invoices.',
    }),
    defineField({
      name: 'supplierSacCode',
      title: 'Supplier SAC Code',
      type: 'string',
      description: 'Service Accounting Code for the review service. Always begins "99". Confirm the exact code and digit count (4 vs 6) with your accountant before go-live.',
    }),
  ],
  preview: {
    select: { title: 'legalBusinessName' },
    prepare({ title }) {
      return { title: title || 'OKR Ally Settings' }
    },
  },
})
