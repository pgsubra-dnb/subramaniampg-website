import type { Brand } from '@/lib/okrAllyBrand'
import type { SubmittedKR, ReviewContextSnapshot } from '@/lib/okrAllyReview'

/**
 * OKR Ally / Goal Ally — demo seed library source material.
 *
 * The demo's pre-seeded History and the corporate demo's seeded-employee usage
 * are CLONES of persistent rows, never generated at demo-start:
 *
 *  - one row is a content-clone of PGS's own single real submission + review
 *    (`SEED_REAL_SOURCE_EMAIL`); his original row is only ever read, never touched.
 *  - the four drafts below (S1-S4) have synthetic Objective/Goal + KR/Sub-goal +
 *    context, but their scores and feedback come from the REAL, live review
 *    engine (lib/okrAllyReview.ts `runReview`) — captured once into the seed
 *    library account and cloned from there afterwards.
 *
 * Rebuild the library with POST /api/okr-ally/demo/_seedlib (admin only).
 */

/** The protected library account. is_demo = TRUE so its submissions are kept
 *  off the admin review list, but it is never swept by purgeExpiredDemoData and
 *  never deleted by a demo teardown (guarded by this exact email). */
export const SEED_ACCOUNT_EMAIL = 'okr-ally-demo-seed@embiggen.co.in'
export const SEED_ACCOUNT_NAME = 'OKR Ally Demo Seed'

/** The one genuinely real submission the library clones — PGS's own account. */
export const SEED_REAL_SOURCE_EMAIL = 'pgs@embiggen.co.in'

/** Marker on a cloned submission's idempotency_key so clones are easy to find. */
export const SEED_KEY_PREFIX = 'demo-seed:'

const frozen = (t: string) => ({
  raw_input: t,
  clarifying_question: null,
  clarifying_answer: null,
  paraphrase_suggested: null,
  final_text: t,
  paraphrase_action: 'not_offered' as const,
})

export interface SeedDraft {
  /** Stable id used in the idempotency key and to pick clones by brand. */
  key: string
  brand: Brand
  objective: string
  krs: SubmittedKR[]
  contextSnapshot: ReviewContextSnapshot
}

export const SEED_DRAFTS: SeedDraft[] = [
  {
    key: 'S1',
    brand: 'okr_ally',
    objective:
      'Enterprise trials convert to paid at a rate that makes our outbound motion profitable.',
    krs: [
      { text: 'Raise enterprise trial-to-paid conversion from 14% to 22% by the Q2 close', initiatives: ['Add a mandatory technical-fit call in week one of every enterprise trial', 'Give AEs a shared success-criteria doc agreed with the buyer before the trial starts'] },
      { text: 'Cut median enterprise sales cycle from 68 days to 50 days', initiatives: ['Pre-book the procurement and security review in the first week', 'Standardise the ROI model so AEs stop rebuilding it per deal'] },
      { text: 'Grow the share of enterprise trials that complete the guided onboarding from 41% to 70%', initiatives: ['Assign an onboarding specialist to every trial over 25 seats', 'Trigger a check-in the moment a trial stalls for 3 days'] },
    ],
    contextSnapshot: {
      company_context: frozen(
        'We are a mid-market sales-analytics SaaS, about 120 staff, roughly $18M ARR. We sell mainly to RevOps and sales leadership at companies with 200 to 2,000 employees. Growth to date has been outbound-led with a 14-day self-serve trial for the entry tier and a guided trial for enterprise.'
      ),
      business_context: frozen(
        'Outbound CAC is up roughly 30% year on year and the board has told us to grow efficiently rather than at any cost this year. Enterprise deals carry our margin but the trial-to-paid rate there has been flat while the pipeline has grown, so a lot of AE time is going into trials that never close.'
      ),
      role_context: frozen(
        'I am the VP of Sales. I own the AE team, the SDR team and sales enablement, and I set the trial process. I do not own the product roadmap, pricing, or marketing spend.'
      ),
    },
  },
  {
    key: 'S2',
    brand: 'okr_ally',
    objective: 'Improve our marketing so we get more leads and grow the brand.',
    krs: [
      { text: 'Do more content', initiatives: [] },
      { text: 'Increase followers', initiatives: [] },
      { text: 'Run better campaigns', initiatives: [] },
    ],
    contextSnapshot: {
      company_context: frozen('Early-stage B2B software company. Small team. We sell to operations managers.'),
      business_context: frozen('We need more pipeline. Marketing has been mostly founder-led so far.'),
      role_context: frozen('I run marketing.'),
    },
  },
  {
    key: 'S3',
    brand: 'goal_ally',
    objective:
      'New members reach their first completed workout plan without needing a call with a coach.',
    krs: [
      { text: 'Raise the 14-day plan-completion rate for new members from 38% to 60%', initiatives: ['Cut the default first plan from 5 sessions a week to 3', 'Send a same-day nudge when a member misses their first scheduled session'] },
      { text: 'Reduce first-week support tickets per new member from 5 to 2', initiatives: ['Rewrite the 10 most-viewed help articles around the first-plan flow', 'Add inline tips at the two steps that generate the most tickets'] },
      { text: 'Grow the share of new members who set a goal during onboarding from 55% to 85%', initiatives: ['Make goal-setting the first onboarding step, not the fourth', 'Offer three preset goals so a member can pick instead of writing one'] },
    ],
    contextSnapshot: {
      company_context: frozen(
        'We are a consumer fitness app, about 40 staff, roughly 120,000 monthly active members on a mix of monthly and annual subscriptions. Members can follow a structured plan or free-form log workouts; plans are the stickier path.'
      ),
      business_context: frozen(
        'Activation in the first two weeks is our single biggest churn driver — members who complete a first plan retain far better. Coaching calls do lift activation but they do not scale and the team is at capacity. The company goal this year is to make self-serve activation the default.'
      ),
      role_context: frozen(
        'I am the Head of Member Experience. I own onboarding, in-app guidance, lifecycle messaging and the support team. I do not own the core training content or pricing.'
      ),
    },
  },
  {
    key: 'S4',
    brand: 'goal_ally',
    objective: 'Make the product better and keep users happy.',
    krs: [
      { text: 'Ship more features', initiatives: [] },
      { text: 'Fix bugs faster', initiatives: [] },
      { text: 'Get better reviews', initiatives: [] },
    ],
    contextSnapshot: {
      company_context: frozen('A small mobile app company. We have a productivity app on iOS and Android.'),
      business_context: frozen('Users have been complaining and our ratings dropped. We want to turn that around.'),
      role_context: frozen('I am the product manager.'),
    },
  },
]
