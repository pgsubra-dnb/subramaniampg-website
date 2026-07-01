import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'bookingPurchase',
  title: 'Booking Purchase',
  type: 'document',
  fields: [
    defineField({ name: 'learnerEmail', title: 'Learner Email', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'course', title: 'Course', type: 'reference', to: [{ type: 'course' }] }),
    defineField({ name: 'amount', title: 'Amount Paid (₹ incl. GST)', type: 'number' }),
    defineField({ name: 'razorpayPaymentId', title: 'Razorpay Payment ID', type: 'string' }),
    defineField({ name: 'paidAt', title: 'Paid At', type: 'datetime' }),
  ],
  orderings: [
    { title: 'Paid (newest first)', name: 'paidAtDesc', by: [{ field: 'paidAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'learnerEmail', subtitle: 'paidAt' },
  },
})
