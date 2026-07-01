import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'assignment',
  title: 'Assignment',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Assignment Title', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'code', title: 'Assignment Code', type: 'string', description: 'e.g. 1A, 3C, 4-Process-B — used internally to identify the assignment.' }),
    defineField({ name: 'course', title: 'Course', type: 'reference', to: [{ type: 'course' }], validation: Rule => Rule.required() }),
    defineField({ name: 'moduleSlug', title: 'Module Slug', type: 'string', description: 'Which module this assignment belongs to.' }),
    defineField({ name: 'prompt', title: 'Assignment Prompt', type: 'text', validation: Rule => Rule.required() }),
    defineField({ name: 'allowText', title: 'Allow Text Submission', type: 'boolean', initialValue: true }),
    defineField({ name: 'allowFile', title: 'Allow File Upload', type: 'boolean', initialValue: true }),
    defineField({ name: 'acceptedFileTypes', title: 'Accepted File Types', type: 'array', of: [{ type: 'string' }], initialValue: ['xlsx', 'docx', 'pdf'] }),
    defineField({ name: 'active', title: 'Active', type: 'boolean', initialValue: true }),
  ],
})
