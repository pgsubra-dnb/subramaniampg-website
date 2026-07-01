import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'academyModule',
  title: 'Module',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Module Title', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'courseRef', title: 'Course', type: 'reference', to: [{ type: 'course' }] }),
    defineField({ name: 'order', title: 'Order', type: 'number', validation: Rule => Rule.required().min(1) }),
    defineField({ name: 'badgeName', title: 'Badge Name', type: 'string' }),
    defineField({ name: 'badgeImage', title: 'Badge Image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'lesson' }] }],
    }),
    defineField({
      name: 'questionsToShow',
      title: 'Questions to Show Per Attempt',
      type: 'number',
      initialValue: 3,
      description: 'How many questions the quiz randomly selects from the bank',
    }),
    defineField({
      name: 'quizQuestionBank',
      title: 'Quiz Question Bank',
      type: 'array',
      description: 'Add 8-10 questions. The quiz picks randomly from this bank each attempt.',
      of: [{
        type: 'object',
        name: 'quizQuestion',
        title: 'Question',
        fields: [
          { name: 'questionText', title: 'Question', type: 'string', validation: (Rule: any) => Rule.required() },
          { name: 'optionA', title: 'Option A', type: 'string', validation: (Rule: any) => Rule.required() },
          { name: 'optionB', title: 'Option B', type: 'string', validation: (Rule: any) => Rule.required() },
          { name: 'optionC', title: 'Option C', type: 'string', validation: (Rule: any) => Rule.required() },
          { name: 'optionD', title: 'Option D', type: 'string', validation: (Rule: any) => Rule.required() },
          { name: 'correctAnswer', title: 'Correct Answer', type: 'string', options: { list: ['A', 'B', 'C', 'D'] }, validation: (Rule: any) => Rule.required() },
          { name: 'explanation', title: 'Explanation', type: 'text', rows: 3 },
          { name: 'points', title: 'Points', type: 'number', initialValue: 10 },
        ],
        preview: { select: { title: 'questionText', subtitle: 'correctAnswer' } },
      }],
    }),
    defineField({
      name: 'assignmentBank',
      title: 'Assignment Bank',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'assignment' }] }],
      description: 'Pool of assignments for this module. One is selected at random per learner.',
    }),
    defineField({
      name: 'infographicAsset',
      title: 'Module Infographic PDF',
      type: 'file',
      description: 'The generated or uploaded infographic PDF for this module.',
    }),
  ],
  preview: {
    select: { title: 'title', media: 'badgeImage' },
  },
})
