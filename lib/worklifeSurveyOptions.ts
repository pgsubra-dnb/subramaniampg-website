// Shared option lists for the Work Life Survey — used by both the client form
// and the server-side validator so allowed values can never drift apart.

export const AGE_GROUP = ['20-24', '25-29', '30-34', '35-39', '40 plus'] as const
export const EXPERIENCE_YEARS = ['0-2', '3-5', '6-10', '11-15', 'more than 15'] as const
export const CURRENT_ROLE = [
  'Individual contributor',
  'Team lead or first time manager',
  'Manager of managers',
  'Founder or self employed',
  'Other',
] as const
export const INDUSTRY = [
  'IT and software',
  'Banking and finance',
  'Manufacturing',
  'Services',
  'Startup',
  'Government',
  'Other',
] as const
export const CITY_TYPE = ['Metro', 'Tier 2 city', 'Tier 3 or smaller'] as const

export const GUIDANCE_NEED = ['Many times', 'A few times', 'Once or twice', 'No'] as const
export const SITUATION_TYPE = [
  'Dealing with my boss',
  'Managing my team',
  'Office politics',
  'A career decision',
  'Salary or promotion',
  'Confidence or communication',
  'Something else',
] as const
export const GUIDANCE_SOURCE = [
  'A mentor at work',
  'A friend or family member',
  'YouTube or online content',
  'ChatGPT or AI tools',
  'Nobody',
  'Other',
] as const
export const GUIDANCE_SATISFACTION = [
  'Very satisfied',
  'Somewhat satisfied',
  'Not satisfied',
  'I get no guidance',
] as const

export const PAID_LEARNING = [
  'A course',
  'A subscription app',
  'A coach or counsellor',
  'Books',
  'A live workshop',
  'No, nothing paid',
] as const
export const PAID_AMOUNT = ['Under 500 rupees', '500 to 2000', '2000 to 10000', 'Above 10000'] as const
export const COMPLETION = ['Fully', 'Partly', 'Barely started'] as const
export const WORTH_PAYING = [
  'Answers to my exact situation',
  'A structured path for my career stage',
  'Direct access to an experienced person',
  'A community of people like me',
  'Certificates',
  'Accountability to actually act',
] as const

export const SOURCE_VALUES = ['linkedin', 'whatsapp', 'hr', 'alumni', 'other', 'direct'] as const

export const ONE_PROBLEM_MAX_LEN = 500
export const OTHER_TEXT_MAX_LEN = 200

export type SituationType = (typeof SITUATION_TYPE)[number]
export type PaidLearning = (typeof PAID_LEARNING)[number]
export type WorthPaying = (typeof WORTH_PAYING)[number]
