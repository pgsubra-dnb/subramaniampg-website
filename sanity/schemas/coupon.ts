import { defineType, defineField } from "sanity"

export default defineType({
  name: "coupon",
  title: "Coupon",
  type: "document",
  fields: [
    defineField({
      name: "code",
      title: "Coupon Code",
      type: "string",
      description: "The code learners will type. Stored in uppercase. Case-insensitive at validation.",
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: "discountPercent",
      title: "Discount Percentage",
      type: "number",
      description: "Enter a number between 1 and 100. Enter 100 for a fully free enrolment.",
      validation: Rule => Rule.required().min(1).max(100),
    }),
    defineField({
      name: "expiryDate",
      title: "Expiry Date",
      type: "date",
      description: "Coupon stops working after this date.",
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: "applicableCourse",
      title: "Applicable Course",
      type: "reference",
      to: [{ type: "course" }],
      description: "The course this coupon applies to.",
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      description: "Switch off to disable this coupon immediately.",
      initialValue: true,
    }),
  ],
})
